import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateMemberDto } from './dto/create-member.dto';

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
}
