import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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
      throw new NotFoundException(
        'Position not found or is not active in this group',
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

    return this.prisma.payment.create({
      data: {
        roundId,
        positionId: position.id,
        amount: dto.amount,
        isLate: dto.is_late ?? false,
      },
    });
  }
}
