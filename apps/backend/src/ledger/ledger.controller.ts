import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { LedgerService } from './ledger.service';
import { ListLedgerDto } from './dto/list-ledger.dto';

@Controller()
@UseGuards(AuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('groups/:id/ledger')
  getLedger(
    @Param('id', ParseIntPipe) groupId: number,
    @Query() dto: ListLedgerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ledgerService.getLedger(groupId, request.user.id, dto);
  }
}
