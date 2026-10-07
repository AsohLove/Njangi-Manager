import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async remove(id: number, ownerId: number) {
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        group: { ownerId },
      },
      include: {
        group: {
          include: {
            cycles: { where: { status: 'active' } },
          },
        },
        fines: true,
        adjustments: true,
        positions: {
          include: {
            payments: true,
            payout: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 1. Check for active cycle in the group
    if (member.group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot delete a member while a cycle is active',
      );
    }

    // 2. Check for history (Fines, Adjustments, Payments, or Payouts)
    const hasFinesOrAdjustments =
      member.fines.length > 0 || member.adjustments.length > 0;

    const hasPositionHistory = member.positions.some(
      (pos) => pos.payments.length > 0 || pos.payout.length > 0,
    );

    if (hasFinesOrAdjustments || hasPositionHistory) {
      throw new ConflictException(
        'Cannot delete a member with existing financial history',
      );
    }

    // 3. Clean up inactive/empty positions before deleting member
    await this.prisma.$transaction([
      this.prisma.position.deleteMany({
        where: { memberId: id },
      }),
      this.prisma.member.delete({
        where: { id },
      }),
    ]);
  }
}
