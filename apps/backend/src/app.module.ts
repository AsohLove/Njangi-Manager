import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { RoundsModule } from './rounds/rounds.module';
import { PaymentsModule } from './payments/payments.module';
import { FinesModule } from './fines/fines.module';

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
    FinesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
