import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFundSpendingDto } from './dto/create-fund-spending.dto';

@Injectable()
export class FundService {
  constructor(private readonly prisma: PrismaService) {}

  async getFund(groupId: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [
      paidFines,
      fundAdjustments,
      spending,
      paidFineHistory,
      adjustmentHistory,
      spendingHistory,
    ] = await Promise.all([
      this.prisma.fine.aggregate({
        where: {
          groupId,
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.adjustment.aggregate({
        where: {
          groupId,
          affectsFund: true,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.fundSpending.aggregate({
        where: {
          groupId,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.fine.findMany({
        where: {
          groupId,
          status: 'paid',
        },
        include: {
          member: {
            select: {
              fullName: true,
            },
          },
          round: {
            select: {
              number: true,
            },
          },
        },
        orderBy: {
          paidAt: 'desc',
        },
      }),

      this.prisma.adjustment.findMany({
        where: {
          groupId,
          affectsFund: true,
        },
        include: {
          member: {
            select: {
              fullName: true,
            },
          },
          round: {
            select: {
              number: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.fundSpending.findMany({
        where: {
          groupId,
        },
        orderBy: {
          spentAt: 'desc',
        },
      }),
    ]);

    const finesTotal = paidFines._sum.amount ?? 0;
    const adjustmentsTotal = fundAdjustments._sum.amount ?? 0;
    const spendingTotal = spending._sum.amount ?? 0;

    const balance = finesTotal + adjustmentsTotal - spendingTotal;

    const history = [
      ...paidFineHistory.map((fine) => ({
        type: 'fine' as const,
        id: fine.id,
        amount: fine.amount,
        memberName: fine.member.fullName,
        roundNumber: fine.round?.number ?? null,
        note: fine.note,
        createdAt: fine.paidAt,
      })),

      ...adjustmentHistory.map((adjustment) => ({
        type: 'adjustment' as const,
        id: adjustment.id,
        amount: adjustment.amount,
        memberName: adjustment.member?.fullName ?? null,
        roundNumber: adjustment.round?.number ?? null,
        note: adjustment.note,
        createdAt: adjustment.createdAt,
      })),

      ...spendingHistory.map((item) => ({
        type: 'spending' as const,
        id: item.id,
        amount: item.amount,
        memberName: null,
        roundNumber: null,
        note: item.note,
        createdAt: item.spentAt,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );

    return {
      balance,
      paid_fines: finesTotal,
      adjustments: adjustmentsTotal,
      spending: spendingTotal,
      history,
    };
  }

  async createSpending(
    groupId: number,
    ownerId: number,
    dto: CreateFundSpendingDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findFirst({
        where: {
          id: groupId,
          ownerId,
        },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      const [paidFines, fundAdjustments, spending] = await Promise.all([
        tx.fine.aggregate({
          where: {
            groupId,
            status: 'paid',
          },
          _sum: {
            amount: true,
          },
        }),

        tx.adjustment.aggregate({
          where: {
            groupId,
            affectsFund: true,
          },
          _sum: {
            amount: true,
          },
        }),

        tx.fundSpending.aggregate({
          where: {
            groupId,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const finesTotal = paidFines._sum.amount ?? 0;
      const adjustmentsTotal = fundAdjustments._sum.amount ?? 0;
      const spendingTotal = spending._sum.amount ?? 0;

      const balance = finesTotal + adjustmentsTotal - spendingTotal;

      if (dto.amount > balance) {
        throw new ConflictException(
          'Fund balance is insufficient for this spending',
        );
      }

      return tx.fundSpending.create({
        data: {
          groupId,
          amount: dto.amount,
          note: dto.note.trim(),
        },
      });
    });
  }
}
