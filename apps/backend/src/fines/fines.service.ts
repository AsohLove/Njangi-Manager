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
import { ListFinesDto } from './dto/list-fines.dto';

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

  async getFines(groupId: number, ownerId: number, query: ListFinesDto) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const limit = query.limit ?? 20;

    const fines = await this.prisma.fine.findMany({
      where: {
        groupId,
        ...(query.status && {
          status: query.status,
        }),
        ...(query.member_id && {
          memberId: query.member_id,
        }),
        ...(query.after && {
          id: {
            lt: query.after,
          },
        }),
      },
      include: {
        member: true,
        rule: true,
        round: true,
      },
      orderBy: {
        id: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = fines.length > limit;

    const items = hasMore ? fines.slice(0, limit) : fines;

    const nextAfter = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((fine) => ({
        id: fine.id,
        member_id: fine.memberId,
        member_name: fine.member.fullName,
        rule_id: fine.ruleId,
        rule_name: fine.rule.name,
        round_id: fine.roundId,
        amount: fine.amount,
        note: fine.note,
        status: fine.status,
        applied_at: fine.appliedAt,
        paid_at: fine.paidAt,
      })),
      next_after: nextAfter,
    };
  }
}
