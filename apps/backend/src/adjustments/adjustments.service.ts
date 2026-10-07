import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@Injectable()
export class AdjustmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(groupId: number, ownerId: number, dto: CreateAdjustmentDto) {
    if (dto.amount === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (dto.member_id !== undefined) {
      const member = await this.prisma.member.findFirst({
        where: {
          id: dto.member_id,
          groupId,
        },
      });

      if (!member) {
        throw new BadRequestException('Member does not belong to this group');
      }
    }

    if (dto.round_id !== undefined) {
      const round = await this.prisma.round.findFirst({
        where: {
          id: dto.round_id,
          cycle: {
            groupId,
          },
        },
      });

      if (!round) {
        throw new BadRequestException('Round does not belong to this group');
      }
    }

    return this.prisma.adjustment.create({
      data: {
        groupId,
        memberId: dto.member_id,
        roundId: dto.round_id,
        amount: dto.amount,
        affectsFund: dto.affects_fund,
        note: dto.note.trim(),
      },
    });
  }
}
