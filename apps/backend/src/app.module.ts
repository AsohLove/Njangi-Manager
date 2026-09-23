import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { RoundsModule } from './rounds/rounds.module';
import { PaymentsModule } from './payments/payments.module';
import { MembersModule } from './members/members.module';
import { PositionsModule } from './positions/positions.module';
import { CyclesModule } from './cycles/cycles.module';
import { FinesModule } from './fines/fines.module';
import { FundModule } from './fund/fund.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { LedgerModule } from './ledger/ledger.module';
import { MemberSummaryModule } from './member-summary/member-summary.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    PrismaModule,
    AuthModule,
    GroupsModule,
    RoundsModule,
    PaymentsModule,
    MembersModule,
    PositionsModule,
    CyclesModule,
    FinesModule,
    FundModule,
    AdjustmentsModule,
    LedgerModule,
    MemberSummaryModule,
    ShareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
