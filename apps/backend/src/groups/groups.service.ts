import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionOrderDto } from './dto/update-position-order.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: number, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        amount: dto.amount,
        frequency: dto.frequency,
        startDate: new Date(dto.start_date),
        orderMode: dto.order_mode,
        shareCode: randomBytes(9).toString('base64url'),
      },
    });
  }

  async findAll(ownerId: number) {
    return this.prisma.group.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ownerId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async regenerateShareCode(id: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ownerId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const shareCode = randomBytes(9).toString('base64url');

    return this.prisma.group.update({
      where: { id: group.id },
      data: { shareCode },
      select: { shareCode: true },
    });
  }

  async addMember(groupId: number, ownerId: number, dto: CreateMemberDto) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: {
          where: { status: 'active' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot add a member while a cycle is active',
      );
    }

    return this.prisma.member.create({
      data: {
        groupId,
        fullName: dto.full_name.trim(),
        phone: dto.phone ? dto.phone.trim() : null,
      },
    });
  }

  async addPosition(groupId: number, ownerId: number, dto: CreatePositionDto) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: { where: { status: 'active' } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.cycles.length > 0) {
      throw new ConflictException(
        'Cannot add a position while a cycle is active',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.member_id, groupId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    return this.prisma.position.create({
      data: {
        groupId,
        memberId: dto.member_id,
        isActive: true,
      },
    });
  }

  async updatePositionsOrder(
    groupId: number,
    ownerId: number,
    dto: UpdatePositionOrderDto,
  ) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ownerId },
      include: {
        cycles: {
          include: {
            rounds: {
              where: { number: 1 },
            },
          },
        },
        positions: {
          where: { isActive: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.orderMode !== 'fixed') {
      throw new BadRequestException(
        'Reordering positions is only allowed in fixed mode',
      );
    }

    const hasRound1Opened = group.cycles.some((cycle) =>
      cycle.rounds.some((round) => round.openedAt !== null),
    );

    if (hasRound1Opened) {
      throw new ConflictException(
        'Cannot reorder positions once Round 1 has opened',
      );
    }

    const activePositionIds = group.positions.map((p) => p.id);
    const providedIds = dto.position_ids;

    const hasSameLength = providedIds.length === activePositionIds.length;
    const hasAllIds = providedIds.every((id) => activePositionIds.includes(id));
    const hasNoDuplicates = new Set(providedIds).size === providedIds.length;

    if (!hasSameLength || !hasAllIds || !hasNoDuplicates) {
      throw new BadRequestException(
        'The position_ids array must contain every active position ID exactly once',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.position.updateMany({
        where: { groupId },
        data: { rotationOrder: null },
      });

      for (let i = 0; i < providedIds.length; i++) {
        await tx.position.update({
          where: { id: providedIds[i] },
          data: { rotationOrder: i + 1 },
        });
      }
    });
  }
}
