import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { MemberSummaryService } from './member-summary.service';

@Controller()
@UseGuards(AuthGuard)
export class MemberSummaryController {
  constructor(private readonly memberSummaryService: MemberSummaryService) {}

  @Get('groups/:id/members/:memberId/summary')
  getSummary(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.memberSummaryService.getSummary(
      groupId,
      memberId,
      request.user.id,
    );
  }
}
