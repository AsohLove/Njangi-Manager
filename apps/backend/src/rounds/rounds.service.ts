import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEligiblePositions(cycleId: number) {}
}
