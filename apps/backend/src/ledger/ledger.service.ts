import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListLedgerDto } from './dto/list-ledger.dto';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedger(groupId: number, ownerId: number, dto: ListLedgerDto) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const limit = dto.limit ?? 20;

    const [payments, payouts, fines, spending, adjustments] = await Promise.all(
      [
        this.prisma.payment.findMany({
          where: {
            round: {
              cycle: {
                groupId,
              },
            },
            ...(dto.round_id ? { roundId: dto.round_id } : {}),
            ...(dto.member_id
              ? {
                  position: {
                    memberId: dto.member_id,
                  },
                }
              : {}),
          },
          include: {
            position: {
              include: {
                member: true,
              },
            },
          },
        }),

        this.prisma.payout.findMany({
          where: {
            round: {
              cycle: {
                groupId,
              },
            },
            ...(dto.round_id ? { roundId: dto.round_id } : {}),
            ...(dto.member_id
              ? {
                  position: {
                    memberId: dto.member_id,
                  },
                }
              : {}),
          },
          include: {
            position: {
              include: {
                member: true,
              },
            },
          },
        }),

        this.prisma.fine.findMany({
          where: {
            groupId,
            ...(dto.round_id ? { roundId: dto.round_id } : {}),
            ...(dto.member_id ? { memberId: dto.member_id } : {}),
          },
          include: {
            member: true,
          },
        }),

        this.prisma.fundSpending.findMany({
          where: {
            groupId,
          },
        }),

        this.prisma.adjustment.findMany({
          where: {
            groupId,
            ...(dto.round_id ? { roundId: dto.round_id } : {}),
            ...(dto.member_id ? { memberId: dto.member_id } : {}),
          },
        }),
      ],
    );

    const entries = [
      ...payments.map((payment) => ({
        id: payment.id * 10 + 1,
        type: 'payment',
        amount: payment.amount,
        member_id: payment.position.memberId,
        member_name: payment.position.member.fullName,
        round_id: payment.roundId,
        created_at: payment.paidAt,
      })),

      ...payouts.map((payout) => ({
        id: payout.id * 10 + 2,
        type: 'payout',
        amount: payout.amount,
        member_id: payout.position.memberId,
        member_name: payout.position.member.fullName,
        round_id: payout.roundId,
        created_at: payout.paidAt,
      })),

      ...fines.map((fine) => ({
        id: fine.id * 10 + 3,
        type: 'fine',
        amount: fine.amount,
        member_id: fine.memberId,
        member_name: fine.member.fullName,
        round_id: fine.roundId,
        created_at: fine.appliedAt,
      })),

      ...spending.map((item) => ({
        id: item.id * 10 + 4,
        type: 'spending',
        amount: -item.amount,
        member_id: null,
        member_name: null,
        round_id: null,
        created_at: item.spentAt,
      })),

      ...adjustments.map((adjustment) => ({
        id: adjustment.id * 10 + 5,
        type: 'adjustment',
        amount: adjustment.amount,
        member_id: adjustment.memberId,
        member_name: null,
        round_id: adjustment.roundId,
        created_at: adjustment.createdAt,
      })),
    ];

    entries.sort((a, b) => {
      const timeDifference = b.created_at.getTime() - a.created_at.getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return b.id - a.id;
    });

    const startIndex = dto.after
      ? entries.findIndex((entry) => entry.id === dto.after) + 1
      : 0;

    const page = entries.slice(startIndex, startIndex + limit);

    const hasMore = startIndex + limit < entries.length;

    return {
      entries: page,
      next: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }
}
