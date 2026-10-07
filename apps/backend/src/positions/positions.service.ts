import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async remove(id: number, ownerId: number) {
    const position = await this.prisma.position.findFirst({
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
        payments: true,
        payout: true,
        collectorRounds: true,
      },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot delete or deactivate a position while a cycle is active',
      );
    }

    const hasHistory =
      position.payments.length > 0 ||
      position.payout.length > 0 ||
      position.collectorRounds.length > 0;

    if (hasHistory) {
      await this.prisma.position.update({
        where: { id },
        data: {
          isActive: false,
          rotationOrder: null,
        },
      });
    } else {
      await this.prisma.position.delete({
        where: { id },
      });
    }
  }
}
