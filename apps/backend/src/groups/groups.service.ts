import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

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
        shareCode: randomBytes(9).toString('base64url'), // 12 characters
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
}
