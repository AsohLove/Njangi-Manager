import { Module } from '@nestjs/common';
import { MemberSummaryService } from './member-summary.service';
import { MemberSummaryController } from './member-summary.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [MemberSummaryService],
  controllers: [MemberSummaryController],
})
export class MemberSummaryModule {}
