import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFineRuleDto } from './dto/create-fine-rule.dto';
import { UpdateFineRuleDto } from './dto/update-fine-rule.dto';
import { CreateFineDto } from './dto/create-fine.dto';

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

  async createFine(groupId: number, ownerId: number, dto: CreateFineDto) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        id: dto.member_id,
        groupId,
      },
    });

    if (!member) {
      throw new BadRequestException('Member is not in this group');
    }

    const rule = await this.prisma.fineRule.findFirst({
      where: {
        id: dto.rule_id,
        groupId,
      },
    });

    if (!rule) {
      throw new BadRequestException('Fine rule is not in this group');
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
        throw new BadRequestException('Round is not in this group');
      }
    }

    const amount = dto.amount ?? rule.defaultAmount;

    return this.prisma.fine.create({
      data: {
        groupId,
        ruleId: rule.id,
        memberId: member.id,
        roundId: dto.round_id,
        amount,
        note: dto.note,
      },
    });
  }

  async payFine(fineId: number, ownerId: number) {
    const fine = await this.prisma.fine.findFirst({
      where: {
        id: fineId,
        group: {
          ownerId,
        },
      },
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    if (fine.status === 'paid') {
      throw new ConflictException('Fine is already paid');
    }

    const paidFine = await this.prisma.fine.update({
      where: {
        id: fineId,
      },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    return paidFine;
  }
}
