import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateBulkPaymentDto } from './dto/create-bulk-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(roundId: number, ownerId: number, dto: CreatePaymentDto) {
    const round = await this.prisma.round.findFirst({
      where: {
        id: roundId,
        cycle: {
          group: {
            ownerId,
          },
        },
      },
      include: {
        cycle: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    if (round.status !== 'open') {
      throw new ConflictException('Cannot record payment for a closed round');
    }

    const position = await this.prisma.position.findFirst({
      where: {
        id: dto.position_id,
        groupId: round.cycle.groupId,
        isActive: true,
      },
    });

    if (!position) {
      throw new BadRequestException('Position is not in this group');
    }

    const amount = dto.amount ?? round.cycle.group.amount;

    if (amount > round.cycle.group.amount) {
      throw new BadRequestException(
        'Payment amount cannot exceed the group amount',
      );
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        roundId_positionId: {
          roundId,
          positionId: position.id,
        },
      },
    });

    if (existingPayment) {
      throw new ConflictException(
        'Payment already recorded for this position in this round',
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const dueDate = round.dueDate.toISOString().slice(0, 10);

    const isLate = today > dueDate;

    return this.prisma.payment.create({
      data: {
        roundId,
        positionId: position.id,
        amount,
        isLate,
      },
    });
  }

  async createBulkPayment(
    roundId: number,
    userId: number,
    dto: CreateBulkPaymentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const round = await tx.round.findFirst({
        where: {
          id: roundId,
          cycle: {
            group: {
              ownerId: userId,
            },
          },
        },
        include: {
          cycle: {
            include: {
              group: true,
            },
          },
        },
      });

      if (!round) {
        throw new NotFoundException('Round not found');
      }

      if (round.status === 'closed') {
        throw new ConflictException('Round is closed');
      }

      const member = await tx.member.findFirst({
        where: {
          id: dto.member_id,
          groupId: round.cycle.groupId,
        },
        include: {
          positions: {
            where: {
              isActive: true,
            },
          },
        },
      });

      if (!member) {
        throw new BadRequestException('Member does not belong to this group');
      }

      const positionIds = member.positions.map((position) => position.id);

      if (positionIds.length === 0) {
        throw new BadRequestException('Member has no active positions');
      }

      const existingPayments = await tx.payment.findMany({
        where: {
          roundId,
          positionId: {
            in: positionIds,
          },
        },
      });

      const paidPositionIds = new Set(
        existingPayments.map((payment) => payment.positionId),
      );

      const unpaidPositions = member.positions.filter(
        (position) => !paidPositionIds.has(position.id),
      );

      const today = new Date().toISOString().slice(0, 10);
      const dueDate = round.dueDate.toISOString().slice(0, 10);

      const isLate = today > dueDate;

      const payments = unpaidPositions.map((position) => ({
        roundId,
        positionId: position.id,
        amount: round.cycle.group.amount,
        isLate,
      }));

      if (payments.length === 0) {
        throw new ConflictException('All member positions are already paid');
      }

      const createdPayments = await tx.payment.createManyAndReturn({
        data: payments,
      });

      return {
        items: createdPayments,
      };
    });
  }

  async updatePayment(
    paymentId: number,
    ownerId: number,
    dto: UpdatePaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        round: {
          cycle: {
            group: {
              ownerId,
            },
          },
        },
      },
      include: {
        round: {
          include: {
            cycle: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.round.status !== 'open') {
      throw new ConflictException('Cannot update payment for a closed round');
    }

    if (dto.amount <= payment.amount) {
      throw new BadRequestException(
        'Payment amount must be higher than the current amount',
      );
    }

    if (dto.amount > payment.round.cycle.group.amount) {
      throw new BadRequestException(
        'Payment amount cannot exceed the group amount',
      );
    }

    return this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        amount: dto.amount,
      },
    });
  }
}
