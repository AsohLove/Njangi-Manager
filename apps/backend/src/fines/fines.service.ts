import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFineRuleDto } from './dto/create-fine-rule.dto';
import { UpdateFineRuleDto } from './dto/update-fine-rule.dto';

@Injectable()
export class FinesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFineRules(groupId: number, ownerId: number) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.fineRule.findMany({
      where: {
        groupId,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async createFineRule(
    groupId: number,
    ownerId: number,
    dto: CreateFineRuleDto,
  ) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.fineRule.create({
      data: {
        groupId,
        name: dto.name,
        defaultAmount: dto.default_amount,
      },
    });
  }

  async updateFineRule(
    ruleId: number,
    ownerId: number,
    dto: UpdateFineRuleDto,
  ) {
    const rule = await this.prisma.fineRule.findFirst({
      where: {
        id: ruleId,
        group: {
          ownerId,
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('Fine rule not found');
    }

    await this.prisma.fineRule.update({
      where: {
        id: ruleId,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),
        ...(dto.default_amount !== undefined && {
          defaultAmount: dto.default_amount,
        }),
      },
    });
  }

  async deleteFineRule(ruleId: number, ownerId: number) {
    const rule = await this.prisma.fineRule.findFirst({
      where: {
        id: ruleId,
        group: {
          ownerId,
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('Fine rule not found');
    }

    const fineCount = await this.prisma.fine.count({
      where: {
        ruleId,
      },
    });

    if (fineCount > 0) {
      throw new ConflictException(
        'Cannot delete a fine rule that is already used',
      );
    }

    await this.prisma.fineRule.delete({
      where: {
        id: ruleId,
      },
    });
  }
}
