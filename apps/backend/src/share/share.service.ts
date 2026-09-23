import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async getShare(code: string) {
    const group = await this.prisma.group.findUnique({
      where: { shareCode: code },
      include: {
        members: {
          select: {
            id: true,
            fullName: true,
          },
        },
        positions: {
          where: { isActive: true },
          orderBy: { rotationOrder: 'asc' },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        cycles: {
          where: { status: 'active' },
          take: 1,
          include: {
            rounds: {
              include: {
                collectorPosition: {
                  include: {
                    member: {
                      select: {
                        id: true,
                        fullName: true,
                      },
                    },
                  },
                },
                payments: true,
              },
              orderBy: { number: 'asc' },
            },
          },
        },
        fines: {
          where: { status: 'owed' },
          include: {
            rule: true,
            member: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Share page not found');
    }

    // 1. Extract Active Cycle & Current Open Round
    const activeCycle = group.cycles[0] || null;
    const allRoundsInCycle = activeCycle?.rounds || [];
    const currentRound =
      allRoundsInCycle.find((r) => r.status === 'open') || null;

    // 2. Fund Balance Aggregations
    const [paidFines, fundAdjustments, spending] = await Promise.all([
      this.prisma.fine.aggregate({
        where: { groupId: group.id, status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.adjustment.aggregate({
        where: { groupId: group.id, affectsFund: true },
        _sum: { amount: true },
      }),
      this.prisma.fundSpending.aggregate({
        where: { groupId: group.id },
        _sum: { amount: true },
      }),
    ]);

    const fundBalance =
      (paidFines._sum.amount ?? 0) +
      (fundAdjustments._sum.amount ?? 0) -
      (spending._sum.amount ?? 0);

    // 3. Multi-position Label Logic ("position 1 of 2")
    const memberTotalPositions = new Map<number, number>();
    group.positions.forEach((p) => {
      memberTotalPositions.set(
        p.memberId,
        (memberTotalPositions.get(p.memberId) || 0) + 1,
      );
    });

    const memberCurrentIndex = new Map<number, number>();

    // 4. Map Enriched Positions
    const positions = group.positions.map((position) => {
      // Determine slot label
      const totalSlots = memberTotalPositions.get(position.memberId) || 1;
      let positionLabel: string | null = null;

      if (totalSlots > 1) {
        const idx = (memberCurrentIndex.get(position.memberId) || 0) + 1;
        memberCurrentIndex.set(position.memberId, idx);
        positionLabel = `position ${idx} of ${totalSlots}`;
      }

      // Determine payment status in current open round
      const payment = currentRound?.payments.find(
        (p) => p.positionId === position.id,
      );

      let roundStatus: 'paid' | 'partly' | 'waiting' | 'no_open_round' =
        'no_open_round';
      let paidAmount = 0;

      if (currentRound) {
        if (payment) {
          paidAmount = payment.amount;
          if (payment.amount >= group.amount) {
            roundStatus = 'paid';
          } else if (payment.amount > 0) {
            roundStatus = 'partly';
          }
        } else {
          roundStatus = 'waiting';
        }
      }

      return {
        position_id: position.id,
        rotation_order: position.rotationOrder,
        member_id: position.memberId,
        member_name: position.member.fullName,
        position_label: positionLabel,
        round_status: roundStatus,
        paid_amount: paidAmount,
        is_late: payment?.isLate ?? false,
      };
    });

    // 5. Calculate Collector Amounts
    const totalPositionsCount = group.positions.length;
    const targetAmount = totalPositionsCount * group.amount;
    const collectedAmount = currentRound
      ? currentRound.payments.reduce((sum, p) => sum + p.amount, 0)
      : 0;

    // 6. Map Fines list
    const finesList = group.fines.map((fine) => ({
      id: fine.id,
      member_id: fine.memberId,
      member_name: fine.member.fullName,
      rule_name: fine.rule?.name ?? fine.note ?? 'Fine',
      amount: fine.amount,
      status: 'OWED',
    }));

    return {
      name: group.name,
      amount: group.amount,
      frequency: group.frequency,
      total_rounds: totalPositionsCount,
      fund_balance: fundBalance,
      fund_source_note: 'From paid fines',

      current_round: currentRound
        ? {
            id: currentRound.id,
            number: currentRound.number,
            status: currentRound.status,
            due_date: currentRound.dueDate,
            collector: {
              position_id: currentRound.collectorPositionId,
              member_id: currentRound.collectorPosition.memberId,
              member_name: currentRound.collectorPosition.member.fullName,
              rotation_order: currentRound.collectorPosition.rotationOrder,
              target_amount: targetAmount,
              collected_amount: collectedAmount,
            },
            positions,
          }
        : null,

      fines: finesList,
    };
  }
}
