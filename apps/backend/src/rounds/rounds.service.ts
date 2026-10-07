import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { randomInt } from 'crypto';
import { CloseRoundDto } from './dto/close-round.dto';

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateDueDate(
    startDate: Date,
    frequency: string,
    roundNumber: number,
  ): Date {
    const dueDate = new Date(startDate);

    if (frequency === 'weekly') {
      dueDate.setDate(dueDate.getDate() + (roundNumber - 1) * 7);
    } else if (frequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + (roundNumber - 1));
    }

    return dueDate;
  }

  async getEligiblePositions(cycleId: number, ownerId: number) {
    const cycle = await this.prisma.cycle.findUnique({
      where: {
        id: cycleId,
        group: {
          ownerId,
        },
      },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    const collectedPositions = await this.prisma.round.findMany({
      where: {
        cycleId,
      },
      select: {
        collectorPositionId: true,
      },
      distinct: ['collectorPositionId'],
    });

    const collectedPositionIds = collectedPositions.map(
      (round) => round.collectorPositionId,
    );

    return this.prisma.position.findMany({
      where: {
        groupId: cycle.groupId,
        isActive: true,
        id: {
          notIn: collectedPositionIds,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async createRound(cycleId: number, userId: number, dto: CreateRoundDto) {
    const cycle = await this.prisma.cycle.findFirst({
      where: {
        id: cycleId,
        group: {
          ownerId: userId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    if (cycle.status !== 'active') {
      throw new ConflictException('Cycle is not active');
    }

    return this.prisma.$transaction(async (tx) => {
      const openRound = await tx.round.findFirst({
        where: {
          cycleId,
          status: 'open',
        },
      });

      if (openRound) {
        throw new ConflictException('Cycle already has an open round');
      }

      const roundNumber =
        (await tx.round.count({
          where: { cycleId },
        })) + 1;

      const activePositions = await tx.position.findMany({
        where: {
          groupId: cycle.groupId,
          isActive: true,
        },
        orderBy: {
          rotationOrder: 'asc',
        },
      });

      if (activePositions.length === 0) {
        throw new ConflictException('No active positions available');
      }

      const previousRounds = await tx.round.findMany({
        where: {
          cycleId,
        },
        select: {
          collectorPositionId: true,
        },
      });

      const previousCollectorIds = new Set(
        previousRounds.map((round) => round.collectorPositionId),
      );

      const eligiblePositions = activePositions.filter(
        (position) => !previousCollectorIds.has(position.id),
      );

      if (eligiblePositions.length === 0) {
        throw new ConflictException('No eligible positions remain');
      }

      let collectorPositionId: number;
      let eligiblePositionIds: number[] | undefined = undefined;

      if (cycle.group.orderMode === 'fixed') {
        if (dto.method !== 'auto') {
          throw new BadRequestException('Fixed order requires auto selection');
        }

        collectorPositionId = eligiblePositions[0].id;
      } else {
        if (dto.method !== 'app_draw' && dto.method !== 'manual_draw') {
          throw new BadRequestException(
            'Ballot order requires app_draw or manual_draw',
          );
        }

        eligiblePositionIds = eligiblePositions.map((position) => position.id);

        if (dto.method === 'app_draw') {
          const index = randomInt(0, eligiblePositions.length);

          collectorPositionId = eligiblePositions[index].id;
        } else {
          if (!dto.collector_position_id) {
            throw new BadRequestException(
              'collector_position_id is required for manual_draw',
            );
          }

          const selectedIsEligible = eligiblePositions.some(
            (position) => position.id === dto.collector_position_id,
          );

          if (!selectedIsEligible) {
            throw new BadRequestException('Selected position is not eligible');
          }

          collectorPositionId = dto.collector_position_id;
        }
      }

      const dueDate = this.calculateDueDate(
        cycle.group.startDate,
        cycle.group.frequency,
        roundNumber,
      );

      const round = await tx.round.create({
        data: {
          cycleId,
          number: roundNumber,
          collectorPositionId,
          selectionMethod: dto.method,
          eligiblePositionIds,
          dueDate,
        },
        include: {
          collectorPosition: {
            include: {
              member: true,
            },
          },
        },
      });

      return round;
    });
  }

  async getRound(roundId: number, ownerId: number) {
    const round = await this.prisma.round.findFirst({
      where: {
        id: roundId,
        cycle: {
          group: {
            ownerId,
          },
        },
      },
      include: {
        cycle: {
          include: {
            group: true,
          },
        },
        collectorPosition: {
          include: {
            member: true,
          },
        },
        payments: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    const positions = await this.prisma.position.findMany({
      where: {
        groupId: round.cycle.groupId,
        isActive: true,
      },
      include: {
        member: true,
        payments: {
          where: {
            roundId,
          },
        },
      },
      orderBy: {
        rotationOrder: 'asc',
      },
    });

    const expectedAmount = positions.length * round.cycle.group.amount;

    const collectedAmount = round.payments.reduce(
      (total, payment) => total + payment.amount,
      0,
    );

    const positionStatuses = positions.map((position) => {
      const payment = position.payments[0];

      if (!payment) {
        return {
          position_id: position.id,
          member_id: position.memberId,
          member_name: position.member.fullName,
          expected: round.cycle.group.amount,
          paid: 0,
          status: 'waiting',
          is_late: false,
        };
      }

      const isPartial = payment.amount < round.cycle.group.amount;

      return {
        position_id: position.id,
        member_id: position.memberId,
        member_name: position.member.fullName,
        expected: round.cycle.group.amount,
        paid: payment.amount,
        status: isPartial ? 'partly_paid' : 'paid',
        is_late: payment.isLate,
      };
    });

    return {
      id: round.id,
      cycle_id: round.cycleId,
      number: round.number,
      collector_position_id: round.collectorPositionId,
      collector: {
        position_id: round.collectorPosition.id,
        member_id: round.collectorPosition.memberId,
        member_name: round.collectorPosition.member.fullName,
      },
      selection_method: round.selectionMethod,
      due_date: round.dueDate,
      status: round.status,
      expected_amount: expectedAmount,
      collected_amount: collectedAmount,
      positions: positionStatuses,
      opened_at: round.openedAt,
      closed_at: round.closedAt,
    };
  }

  async closeRound(roundId: number, ownerId: number, dto: CloseRoundDto) {
    const round = await this.prisma.round.findFirst({
      where: {
        id: roundId,
        cycle: {
          group: {
            ownerId,
          },
        },
      },
      include: {
        cycle: {
          include: {
            group: true,
          },
        },
        payments: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    if (round.status !== 'open') {
      throw new ConflictException('Round is already closed');
    }

    const expectedAmount =
      round.cycle.group.amount *
      (await this.prisma.position.count({
        where: {
          groupId: round.cycle.groupId,
          isActive: true,
        },
      }));

    const collectedAmount = round.payments.reduce(
      (total, payment) => total + payment.amount,
      0,
    );

    const shortfall = expectedAmount - collectedAmount;

    if (shortfall > 0 && dto.acknowledge_shortfall !== true) {
      throw new ConflictException(
        'Round has a shortfall. Acknowledge the shortfall before closing',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          roundId: round.id,
          positionId: round.collectorPositionId,
          amount: collectedAmount,
          shortfall: Math.max(shortfall, 0),
        },
      });

      const closedRound = await tx.round.update({
        where: {
          id: round.id,
        },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      const activePositionCount = await tx.position.count({
        where: {
          groupId: round.cycle.groupId,
          isActive: true,
        },
      });

      const closedRoundCount = await tx.round.count({
        where: {
          cycleId: round.cycleId,
          status: 'closed',
        },
      });

      if (closedRoundCount >= activePositionCount) {
        await tx.cycle.update({
          where: {
            id: round.cycleId,
          },
          data: {
            status: 'complete',
            completedAt: new Date(),
          },
        });
      }

      return {
        round: closedRound,
        payout,
      };
    });
  }
}
