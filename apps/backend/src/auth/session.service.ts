import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number) {
    const sessionId = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        expiresAt,
      },
    });

    return {
      id: sessionId,
      expiresAt,
    };
  }

  async findValid(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      await this.delete(sessionId);
      return null;
    }

    return session;
  }

  async delete(sessionId: string) {
    await this.prisma.session.deleteMany({
      where: { id: sessionId },
    });
  }
}
