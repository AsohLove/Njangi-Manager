import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemberSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(groupId: number, memberId: number, ownerId: number) {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        groupId,
        group: {
          ownerId,
        },
      },
      include: {
        positions: {
          orderBy: {
            rotationOrder: 'asc',
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const [payments, payouts, owedFines, paidFines] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          position: {
            memberId,
            groupId,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.payout.aggregate({
        where: {
          position: {
            memberId,
            groupId,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.fine.aggregate({
        where: {
          memberId,
          groupId,
          status: 'owed',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.fine.aggregate({
        where: {
          memberId,
          groupId,
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      member_id: member.id,
      member_name: member.fullName,
      positions: member.positions.map((position) => ({
        id: position.id,
        rotation_order: position.rotationOrder,
        is_active: position.isActive,
      })),
      total_paid: payments._sum.amount ?? 0,
      total_collected: payouts._sum.amount ?? 0,
      fines_owed: owedFines._sum.amount ?? 0,
      fines_paid: paidFines._sum.amount ?? 0,
    };
  }
}
