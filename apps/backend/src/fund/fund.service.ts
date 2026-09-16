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

    const [paidFines, fundAdjustments, spending] = await Promise.all([
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
    ]);

    const finesTotal = paidFines._sum.amount ?? 0;
    const adjustmentsTotal = fundAdjustments._sum.amount ?? 0;
    const spendingTotal = spending._sum.amount ?? 0;

    const balance = finesTotal + adjustmentsTotal - spendingTotal;

    return {
      balance,
      paid_fines: finesTotal,
      adjustments: adjustmentsTotal,
      spending: spendingTotal,
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
