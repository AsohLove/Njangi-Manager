import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async getShare(code: string) {
    const group = await this.prisma.group.findUnique({
      where: {
        shareCode: code,
      },
      include: {
        positions: {
          where: {
            isActive: true,
          },
          orderBy: {
            rotationOrder: 'asc',
          },
          include: {
            member: true,
          },
        },
        cycles: {
          where: {
            status: 'active',
          },
          include: {
            rounds: {
              where: {
                status: 'open',
              },
              orderBy: {
                number: 'desc',
              },
              take: 1,
              include: {
                collectorPosition: {
                  include: {
                    member: true,
                  },
                },
                payments: true,
              },
            },
          },
        },
        fines: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Share page not found');
    }

    const currentRound = group.cycles[0]?.rounds[0] ?? null;

    const [paidFines, fundAdjustments, spending] = await Promise.all([
      this.prisma.fine.aggregate({
        where: {
          groupId: group.id,
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.adjustment.aggregate({
        where: {
          groupId: group.id,
          affectsFund: true,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.fundSpending.aggregate({
        where: {
          groupId: group.id,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const paidFinesTotal = paidFines._sum.amount ?? 0;

    const adjustmentsTotal = fundAdjustments._sum.amount ?? 0;

    const spendingTotal = spending._sum.amount ?? 0;

    const fundBalance = paidFinesTotal + adjustmentsTotal - spendingTotal;

    const positions = group.positions.map((position) => {
      const payment = currentRound?.payments.find(
        (payment) => payment.positionId === position.id,
      );

      return {
        position_id: position.id,
        member_id: position.memberId,
        member_name: position.member.fullName,
        round_status: currentRound
          ? payment
            ? 'paid'
            : 'waiting'
          : 'no_open_round',
        paid_amount: payment?.amount ?? 0,
      };
    });

    const fineStatus = group.fines.reduce(
      (result, fine) => {
        const existing = result[fine.memberId] ?? {
          member_id: fine.memberId,
          member_name: fine.member.fullName,
          owed: 0,
          paid: 0,
        };

        if (fine.status === 'paid') {
          existing.paid += fine.amount;
        } else {
          existing.owed += fine.amount;
        }

        result[fine.memberId] = existing;

        return result;
      },
      {} as Record<
        number,
        {
          member_id: number;
          member_name: string;
          owed: number;
          paid: number;
        }
      >,
    );

    return {
      name: group.name,
      amount: group.amount,
      frequency: group.frequency,

      current_round: currentRound
        ? {
            id: currentRound.id,
            number: currentRound.number,
            status: currentRound.status,
            collector: {
              position_id: currentRound.collectorPositionId,
              member_id: currentRound.collectorPosition.memberId,
              member_name: currentRound.collectorPosition.member.fullName,
            },
            positions,
          }
        : null,

      fund_balance: fundBalance,

      fines: Object.values(fineStatus),
    };
  }
}
