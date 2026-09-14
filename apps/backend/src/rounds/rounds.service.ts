import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { randomInt } from 'crypto';

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateDueDate(
    startDate: Date,
    frequency: string,
    roundNumber: number,
  ): Date {
    const dueDate = new Date(startDate);

    if (frequency === 'weekly') {
      dueDate.setDate(dueDate.getDate() + (roundNumber - 1) * 7);
    } else if (frequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + (roundNumber - 1));
    }

    return dueDate;
  }

  async getEligiblePositions(cycleId: number, ownerId: number) {
    const cycle = await this.prisma.cycle.findUnique({
      where: {
        id: cycleId,
        group: {
          ownerId,
        },
      },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    const collectedPositions = await this.prisma.round.findMany({
      where: {
        cycleId,
      },
      select: {
        collectorPositionId: true,
      },
      distinct: ['collectorPositionId'],
    });

    const collectedPositionIds = collectedPositions.map(
      (round) => round.collectorPositionId,
    );

    return this.prisma.position.findMany({
      where: {
        groupId: cycle.groupId,
        isActive: true,
        id: {
          notIn: collectedPositionIds,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async createRound(cycleId: number, ownerId: number, dto: CreateRoundDto) {
    const cycle = await this.prisma.cycle.findFirst({
      where: {
        id: cycleId,
        group: {
          ownerId,
        },
      },
      include: {
        group: true,
        rounds: {
          orderBy: {
            number: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    if (cycle.status !== 'active') {
      throw new ConflictException('Cycle is not active');
    }

    const openRound = await this.prisma.round.findFirst({
      where: {
        cycleId,
        status: 'open',
      },
    });

    if (openRound) {
      throw new ConflictException('A round is already open');
    }

    const previousRound = cycle.rounds[0];

    const roundNumber = previousRound ? previousRound.number + 1 : 1;

    const collectedRounds = await this.prisma.round.findMany({
      where: {
        cycleId,
      },
      select: {
        collectorPositionId: true,
      },
    });

    const collectedPositionIds = collectedRounds.map(
      (round) => round.collectorPositionId,
    );

    const eligiblePositions = await this.prisma.position.findMany({
      where: {
        groupId: cycle.groupId,
        isActive: true,
        id: {
          notIn: collectedPositionIds,
        },
      },
      orderBy: {
        rotationOrder: 'asc',
      },
    });

    if (eligiblePositions.length === 0) {
      throw new ConflictException('No eligible positions remain in this cycle');
    }

    let collectorPositionId: number;

    if (cycle.group.orderMode === 'fixed') {
      if (dto.method !== 'auto') {
        throw new ConflictException(
          'Fixed order groups must use auto selection',
        );
      }

      collectorPositionId = eligiblePositions[0].id;
    } else {
      if (dto.method !== 'app_draw' && dto.method !== 'manual_draw') {
        throw new ConflictException(
          'Ballot groups must use app_draw or manual_draw',
        );
      }

      if (dto.method === 'app_draw') {
        const randomIndex = randomInt(eligiblePositions.length);

        collectorPositionId = eligiblePositions[randomIndex].id;
      } else {
        if (!dto.collector_position_id) {
          throw new ConflictException(
            'collector_position_id is required for manual_draw',
          );
        }

        const selectedPosition = eligiblePositions.find(
          (position) => position.id === dto.collector_position_id,
        );

        if (!selectedPosition) {
          throw new ConflictException('Selected position is not eligible');
        }

        collectorPositionId = selectedPosition.id;
      }
    }

    const dueDate = dto.due_date
      ? new Date(dto.due_date)
      : this.calculateDueDate(
          cycle.group.startDate,
          cycle.group.frequency,
          roundNumber,
        );

    return this.prisma.round.create({
      data: {
        cycleId,
        number: roundNumber,
        collectorPositionId,
        selectionMethod: dto.method,
        eligiblePositionIds:
          cycle.group.orderMode === 'ballot'
            ? eligiblePositions.map((position) => position.id)
            : undefined,
        dueDate,
      },
    });
  }
}
