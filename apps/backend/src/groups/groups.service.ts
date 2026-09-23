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
      where: {
        id,
        ownerId,
      },
      include: {
        members: true,

        positions: {
          include: { member: true },
        },

        cycles: {
          where: {
            status: 'active',
          },
          take: 1,
          include: {
            rounds: {
              orderBy: {
                number: 'asc',
              },
              include: {
                payments: true,
                collectorPosition: {
                  include: {
                    member: true,
                  },
                },
              },
            },
          },
        },

        fines: {
          where: {
            status: 'paid',
          },
        },

        fundSpendings: true,

        adjustments: {
          where: {
            affectsFund: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const activePositions = group.positions.filter(
      (position) => position.isActive,
    );

    const activeCycle = group.cycles[0] ?? null;
    const allRounds = activeCycle?.rounds ?? [];
    const openRound =
      allRounds.find((round) => round.status === 'open') ?? null;

    const collectedPositionIds = allRounds
      .filter((round) => round.status === 'closed')
      .map((round) => round.collectorPositionId);

    const expectedPot = openRound ? group.amount * activePositions.length : 0;

    const collected = openRound
      ? openRound.payments.reduce((total, payment) => total + payment.amount, 0)
      : 0;

    const remaining = expectedPot - collected;

    const paidFines = group.fines.reduce(
      (total, fine) => total + fine.amount,
      0,
    );

    const fundSpending = group.fundSpendings.reduce(
      (total, spending) => total + spending.amount,
      0,
    );

    const fundAdjustments = group.adjustments.reduce(
      (total, adjustment) => total + adjustment.amount,
      0,
    );

    const fundBalance = paidFines + fundAdjustments - fundSpending;

    const paymentsByPositionId = new Map(
      (openRound?.payments ?? []).map((payment) => [
        payment.positionId,
        payment,
      ]),
    );

    const now = new Date();
    const dueDateEndOfDay = new Date(openRound?.dueDate ?? 0);
    dueDateEndOfDay.setHours(23, 59, 59, 999);
    const isPastDue = openRound ? now > dueDateEndOfDay : false;

    const positionsStatus = openRound
      ? activePositions.map((position) => {
          const payment = paymentsByPositionId.get(position.id);

          let status: 'paid' | 'partial' | 'waiting';
          if (!payment) {
            status = 'waiting';
          } else if (payment.amount >= group.amount) {
            status = 'paid';
          } else {
            status = 'partial';
          }

          const isLate = payment
            ? payment.isLate
            : isPastDue && status !== 'paid';

          return {
            positionId: position.id,
            memberId: position.member.id,
            memberName: position.member.fullName,
            status,
            amountPaid: payment?.amount ?? 0,
            isLate,
          };
        })
      : [];

    return {
      id: group.id,
      name: group.name,
      amount: group.amount,
      frequency: group.frequency,
      startDate: group.startDate,
      orderMode: group.orderMode,

      members: group.members,
      positions: group.positions,

      activeCycle,
      collectedPositionIds,

      openRound: openRound
        ? {
            id: openRound.id,
            number: openRound.number,
            collectorPositionId: openRound.collectorPositionId,

            collector: openRound.collectorPosition
              ? {
                  positionId: openRound.collectorPosition.id,
                  memberId: openRound.collectorPosition.member.id,
                  fullName: openRound.collectorPosition.member.fullName,
                }
              : null,

            selectionMethod: openRound.selectionMethod,
            dueDate: openRound.dueDate,
            status: openRound.status,
            expectedPot,
            collected,
            remaining,
            positions: positionsStatus,
          }
        : null,

      fund: {
        balance: fundBalance,
      },
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
