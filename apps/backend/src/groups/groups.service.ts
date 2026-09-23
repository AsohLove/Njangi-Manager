import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionOrderDto } from './dto/update-position-order.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: number, dto: CreateGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          ownerId,
          name: dto.name.trim(),
          amount: dto.amount,
          frequency: dto.frequency,
          startDate: new Date(dto.start_date),
          orderMode: dto.order_mode,
          shareCode: randomBytes(9).toString('base64url'),
        },
      });

      await tx.fineRule.createMany({
        data: [
          {
            groupId: group.id,
            name: 'Late payment',
            defaultAmount: 1000,
          },
          {
            groupId: group.id,
            name: 'Missed payment',
            defaultAmount: 2000,
          },
        ],
      });

      return group;
    });
  }

  async findAll(ownerId: number) {
    const groups = await this.prisma.group.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
        cycles: {
          where: { status: 'active' },
          take: 1,
          include: {
            rounds: {
              where: { status: 'open' },
              take: 1,
              include: {
                collectorPosition: {
                  include: {
                    member: true,
                  },
                },
                _count: {
                  select: { payments: true },
                },
              },
            },
          },
        },
      },
    });

    return groups.map((group) => {
      const activeCycle = group.cycles[0] || null;
      const currentRound = activeCycle?.rounds[0] || null;
      const collectorMember = currentRound?.collectorPosition?.member || null;

      return {
        id: group.id,
        ownerId: group.ownerId,
        name: group.name,
        amount: group.amount,
        frequency: group.frequency,
        startDate: group.startDate,
        orderMode: group.orderMode,
        shareCode: group.shareCode,
        createdAt: group.createdAt,
        totalMembers: group._count.members,
        currentRoundNumber: currentRound?.number ?? null,
        collectorName: collectorMember?.fullName ?? null,
        collectorPositionId: currentRound?.collectorPositionId ?? null,
        paidCount: currentRound ? currentRound._count.payments : 0,
      };
    });
  }

  async findOne(id: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ownerId },
      include: {
        members: {
          orderBy: { fullName: 'asc' },
        },
        positions: {
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { rotationOrder: 'asc' },
        },
        cycles: {
          where: { status: 'active' },
          take: 1,
          include: {
            rounds: {
              include: {
                collectorPosition: {
                  include: {
                    member: true,
                  },
                },
                payments: {
                  include: {
                    position: {
                      include: {
                        member: true,
                      },
                    },
                  },
                },
                fines: true,
                adjustments: true,
                payout: true,
                _count: {
                  select: { payments: true },
                },
              },
              orderBy: { number: 'asc' },
            },
          },
        },
        // Aggregations to compute the total Fund Balance
        fines: {
          where: { status: 'paid' },
          select: { amount: true },
        },
        fundSpendings: {
          select: { amount: true },
        },
        adjustments: {
          where: { affectsFund: true },
          select: { amount: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // 1. Calculate Fund Balance:
    //    Fund Balance = (Paid Fines + Fund Adjustments) - Fund Spendings
    const totalFines = group.fines.reduce((sum, f) => sum + f.amount, 0);
    const totalAdjustments = group.adjustments.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    const totalSpendings = group.fundSpendings.reduce(
      (sum, s) => sum + s.amount,
      0,
    );
    const fundBalance = totalFines + totalAdjustments - totalSpendings;

    // 2. Extract Active Cycle, All Rounds, and current Open Round
    const activeCycle = group.cycles[0] || null;
    const allRoundsInCycle = activeCycle?.rounds || [];
    const openRound = allRoundsInCycle.find((r) => r.status === 'open') || null;

    // 3. Collect Position IDs that received payouts in past closed rounds
    const collectedPositionIds = new Set(
      allRoundsInCycle
        .filter((r) => r.status === 'closed' && r.payout !== null)
        .map((r) => r.collectorPositionId),
    );

    // 4. Map positions per member to construct "position X of Y" labels
    const memberTotalPositions = new Map<number, number>();
    group.positions.forEach((p) => {
      memberTotalPositions.set(
        p.memberId,
        (memberTotalPositions.get(p.memberId) || 0) + 1,
      );
    });

    const memberCurrentIndex = new Map<number, number>();

    // 5. Enrich positions array for UI rendering
    const enrichedPositions = group.positions.map((p) => {
      // Slot label (e.g., "position 1 of 2")
      const totalSlots = memberTotalPositions.get(p.memberId) || 1;
      let positionLabel: string | null = null;

      if (totalSlots > 1) {
        const idx = (memberCurrentIndex.get(p.memberId) || 0) + 1;
        memberCurrentIndex.set(p.memberId, idx);
        positionLabel = `position ${idx} of ${totalSlots}`;
      }

      // Payout Status (For Members Screen)
      let payoutStatus: 'COLLECTED' | 'THIS ROUND' | null = null;
      if (openRound && openRound.collectorPositionId === p.id) {
        payoutStatus = 'THIS ROUND';
      } else if (collectedPositionIds.has(p.id)) {
        payoutStatus = 'COLLECTED';
      }

      // Payment Status (For Round Screen)
      const payment = openRound?.payments.find(
        (pay) => pay.positionId === p.id,
      );
      let paymentStatus: 'PAID' | 'PARTLY' | 'WAITING' = 'WAITING';
      let amountPaid = 0;

      if (payment) {
        amountPaid = payment.amount;
        if (payment.amount >= group.amount) {
          paymentStatus = 'PAID';
        } else if (payment.amount > 0) {
          paymentStatus = 'PARTLY';
        }
      }

      return {
        id: p.id,
        memberId: p.memberId,
        memberName: p.member.fullName,
        rotationOrder: p.rotationOrder,
        isActive: p.isActive,
        positionLabel,
        payoutStatus,
        paymentStatus,
        amountPaid,
        isLate: payment?.isLate ?? false,
      };
    });

    // 6. Format Open Round Summary
    const openRoundSummary = openRound
      ? {
          id: openRound.id,
          number: openRound.number,
          dueDate: openRound.dueDate,
          selectionMethod: openRound.selectionMethod,
          collectorPositionId: openRound.collectorPositionId,
          collectorName: openRound.collectorPosition?.member?.fullName ?? null,
          collectorRotationOrder:
            openRound.collectorPosition?.rotationOrder ?? null,
          targetAmount: group.positions.length * group.amount,
          collectedAmount: openRound.payments.reduce(
            (sum, p) => sum + p.amount,
            0,
          ),
          paidCount: openRound._count.payments,
          payments: openRound.payments.map((p) => ({
            id: p.id,
            positionId: p.positionId,
            memberName: p.position?.member?.fullName ?? null,
            amount: p.amount,
            isLate: p.isLate,
            paidAt: p.paidAt,
          })),
          payout: openRound.payout ?? null,
        }
      : null;

    return {
      id: group.id,
      ownerId: group.ownerId,
      name: group.name,
      amount: group.amount,
      frequency: group.frequency,
      startDate: group.startDate,
      orderMode: group.orderMode,
      shareCode: group.shareCode,
      createdAt: group.createdAt,
      fundBalance,
      totalMembers: group.members.length,
      totalPositions: group.positions.length,
      members: group.members,
      positions: enrichedPositions,
      activeCycle: activeCycle
        ? {
            id: activeCycle.id,
            number: activeCycle.number,
            status: activeCycle.status,
            startedAt: activeCycle.startedAt,
          }
        : null,
      openRound: openRoundSummary,
    };
  }

  async regenerateShareCode(id: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ownerId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const shareCode = randomBytes(9).toString('base64url');

    return this.prisma.group.update({
      where: { id: group.id },
      data: { shareCode },
      select: { shareCode: true },
    });
  }

  async addMember(groupId: number, ownerId: number, dto: CreateMemberDto) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: {
          where: { status: 'active' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot add a member while a cycle is active',
      );
    }

    return this.prisma.member.create({
      data: {
        groupId,
        fullName: dto.full_name.trim(),
        phone: dto.phone ? dto.phone.trim() : null,
      },
    });
  }

  async addPosition(groupId: number, ownerId: number, dto: CreatePositionDto) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: { where: { status: 'active' } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot add a position while a cycle is active',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.member_id, groupId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    return this.prisma.position.create({
      data: {
        groupId,
        memberId: dto.member_id,
        isActive: true,
      },
    });
  }

  async updatePositionsOrder(
    groupId: number,
    ownerId: number,
    dto: UpdatePositionOrderDto,
  ) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: {
          include: {
            rounds: {
              where: { number: 1 },
            },
          },
        },
        positions: {
          where: { isActive: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.orderMode !== 'fixed') {
      throw new BadRequestException(
        'Reordering positions is only allowed in fixed mode',
      );
    }

    const activeCycle = group.cycles.find((c) => c.status === 'active');

    if (activeCycle && activeCycle.rounds.length > 0) {
      throw new ConflictException(
        'Cannot reorder positions once Round 1 has opened',
      );
    }

    const activePositionIds = group.positions.map((p) => p.id);
    const providedIds = dto.position_ids;

    const hasSameLength = providedIds.length === activePositionIds.length;
    const hasAllIds = providedIds.every((id) => activePositionIds.includes(id));
    const hasNoDuplicates = new Set(providedIds).size === providedIds.length;

    if (!hasSameLength || !hasAllIds || !hasNoDuplicates) {
      throw new BadRequestException(
        'The position_ids array must contain every active position ID exactly once',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.position.updateMany({
        where: { groupId },
        data: { rotationOrder: null },
      });

      for (let i = 0; i < providedIds.length; i++) {
        await tx.position.update({
          where: { id: providedIds[i] },
          data: { rotationOrder: i + 1 },
        });
      }
    });
  }
}
