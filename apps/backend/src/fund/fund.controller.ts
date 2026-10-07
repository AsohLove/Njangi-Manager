import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { CreateFundSpendingDto } from './dto/create-fund-spending.dto';
import { FundService } from './fund.service';

@Controller()
@UseGuards(AuthGuard)
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Get('groups/:id/fund')
  getFund(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.fundService.getFund(groupId, request.user.id);
  }

  @Post('groups/:id/fund/spending')
  createSpending(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateFundSpendingDto,
  ) {
    return this.fundService.createSpending(groupId, request.user.id, dto);
  }
}
