import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
              round: true,
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
              round: true,
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
            rule: true,
            round: true,
          },
        }),

        this.prisma.fundSpending.findMany({
          where: {
            groupId,
            ...(dto.member_id || dto.round_id
              ? { id: -1 } // No spending entries if member_id or round_id is specified
              : {}),
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
          round_number: payment.round.number,
          position_id: payment.positionId,
          position_order: payment.position.rotationOrder,
          label: `Payment · ${payment.position.member.fullName}`,
          status: 'paid',
        created_at: payment.paidAt,
      })),

      ...payouts.map((payout) => ({
        id: payout.id * 10 + 2,
        type: 'payout',
        amount: payout.amount,
        member_id: payout.position.memberId,
        member_name: payout.position.member.fullName,
        round_id: payout.roundId,
          round_number: payout.round.number,
          position_id: payout.positionId,
          position_order: payout.position.rotationOrder,
          label: `Payout · ${payout.position.member.fullName}`,
          status: 'paid',
        created_at: payout.paidAt,
      })),

      ...fines.map((fine) => ({
        id: fine.id * 10 + 3,
        type: 'fine',
        amount: fine.amount,
        member_id: fine.memberId,
        member_name: fine.member.fullName,
        round_id: fine.roundId,
          round_number: fine.round?.number ?? null,
          rule_name: fine.rule.name,
          label: `Fine ${fine.status === 'paid' ? 'paid' : 'applied'} · ${fine.member.fullName}`,
          note: fine.note,
          status: fine.status,
        created_at: fine.appliedAt,
      })),

      ...spending.map((item) => ({
        id: item.id * 10 + 4,
        type: 'spending',
        amount: -item.amount,
        member_id: null,
        member_name: null,
        round_id: null,
          round_number: null,
          label: `Spending · ${item.note}`,
          note: item.note,
          status: 'paid',
        created_at: item.spentAt,
      })),

      ...adjustments.map((adjustment) => ({
        id: adjustment.id * 10 + 5,
        type: 'adjustment',
        amount: adjustment.amount,
        member_id: adjustment.memberId,
        member_name: null,
        round_id: adjustment.roundId,
          round_number: null,
          label: `Adjustment · ${adjustment.note}`,
          note: adjustment.note,
          status: 'paid',
        created_at: adjustment.createdAt,
      })),
    ];

    const filteredEntries = dto.type
      ? entries.filter((entry) => entry.type === dto.type)
      : entries;

    filteredEntries.sort((a, b) => {
      const timeDifference = b.created_at.getTime() - a.created_at.getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return b.id - a.id;
    });

    let startIndex = 0;

    if (dto.after) {
      const cursorIndex = filteredEntries.findIndex(
        (entry) => entry.id === dto.after,
      );

      if (cursorIndex === -1) {
        throw new BadRequestException('Invalid ledger cursor');
      }

      startIndex = cursorIndex + 1;
    }

    const page = filteredEntries.slice(startIndex, startIndex + limit);

    const hasMore = startIndex + limit < filteredEntries.length;

    return {
      entries: page,
      next: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }
}
