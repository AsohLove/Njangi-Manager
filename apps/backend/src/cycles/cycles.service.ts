import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(groupId: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: true,
        positions: {
          where: { isActive: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const hasActiveCycle = group.cycles.some((c) => c.status === 'active');
    if (hasActiveCycle) {
      throw new ConflictException(
        'An active cycle already exists for this group',
      );
    }

    if (group.positions.length === 0) {
      throw new ConflictException(
        'Cannot start a cycle with no active positions',
      );
    }

    if (group.orderMode === 'fixed') {
      const isOrderFullySet = group.positions.every(
        (p) => p.rotationOrder !== null,
      );
      if (!isOrderFullySet) {
        throw new ConflictException(
          'Cannot start a cycle in fixed mode until all active positions have rotation orders assigned',
        );
      }
    }

    const maxCycleNumber = group.cycles.reduce(
      (max, c) => (c.number > max ? c.number : max),
      0,
    );
    const nextNumber = maxCycleNumber + 1;

    return this.prisma.cycle.create({
      data: {
        groupId,
        number: nextNumber,
        status: 'active',
      },
    });
  }

  async getSummary(cycleId: number, ownerId: number) {
    const cycle = await this.prisma.cycle.findFirst({
      where: {
        id: cycleId,
        group: { ownerId },
      },
      include: {
        group: true,
        rounds: {
          include: {
            payout: true,
            payments: true,
            collectorPosition: {
              include: { member: true },
            },
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    let totalCollected = 0;
    let totalExpected = 0;
    let totalShortfall = 0;

    const activePositionsCount = await this.prisma.position.count({
      where: { groupId: cycle.groupId, isActive: true },
    });
    const roundExpectedAmount = cycle.group.amount * activePositionsCount;

    const roundsSummary = cycle.rounds.map((round) => {
      const roundCollected = round.payments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const roundShortfall = round.payout ? round.payout.shortfall : 0;

      totalCollected += roundCollected;
      totalExpected += roundExpectedAmount;
      totalShortfall += roundShortfall;

      return {
        id: round.id,
        number: round.number,
        dueDate: round.dueDate,
        status: round.status,
        collector: {
          positionId: round.collectorPositionId,
          memberName: round.collectorPosition.member.fullName,
        },
        collectedAmount: roundCollected,
        expectedAmount: roundExpectedAmount,
        shortfall: roundShortfall,
        openedAt: round.openedAt,
        closedAt: round.closedAt,
      };
    });

    const fundSpending = await this.prisma.fundSpending.findMany({
      where: {
        groupId: cycle.groupId,
        spentAt: {
          gte: cycle.startedAt,
          ...(cycle.completedAt ? { lte: cycle.completedAt } : {}),
        },
      },
      orderBy: { spentAt: 'desc' },
    });

    const fines = await this.prisma.fine.findMany({
      where: {
        groupId: cycle.groupId,
        status: 'paid',
        paidAt: {
          gte: cycle.startedAt,
          ...(cycle.completedAt ? { lte: cycle.completedAt } : {}),
        },
      },
      include: { member: true },
      orderBy: { paidAt: 'desc' },
    });

    return {
      cycle: {
        id: cycle.id,
        number: cycle.number,
        status: cycle.status,
        startedAt: cycle.startedAt,
        completedAt: cycle.completedAt,
      },
      totals: {
        totalCollected,
        totalExpected,
        totalShortfall,
        roundsCount: cycle.rounds.length,
      },
      rounds: roundsSummary,
      fundHistory: {
        finesCollected: fines,
        spending: fundSpending,
      },
    };
  }
}
