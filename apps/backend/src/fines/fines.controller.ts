import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AuthGuard } from '../auth/auth.guard';
import { CreateFineRuleDto } from './dto/create-fine-rule.dto';
import { UpdateFineRuleDto } from './dto/update-fine-rule.dto';
import { FinesService } from './fines.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { ListFinesDto } from './dto/list-fines.dto';

@Controller()
@UseGuards(AuthGuard)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get('groups/:id/fine-rules')
  getFineRules(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.finesService.getFineRules(groupId, request.user.id);
  }

  @Post('groups/:id/fine-rules')
  createFineRule(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateFineRuleDto,
  ) {
    return this.finesService.createFineRule(groupId, request.user.id, dto);
  }

  @Patch('fine-rules/:id')
  updateFineRule(
    @Param('id', ParseIntPipe) ruleId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateFineRuleDto,
  ) {
    return this.finesService.updateFineRule(ruleId, request.user.id, dto);
  }

  @Delete('fine-rules/:id')
  deleteFineRule(
    @Param('id', ParseIntPipe) ruleId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.finesService.deleteFineRule(ruleId, request.user.id);
  }

  @Post('groups/:id/fines')
  createFine(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateFineDto,
  ) {
    return this.finesService.createFine(groupId, request.user.id, dto);
  }

  @Post('fines/:id/pay')
  payFine(
    @Param('id', ParseIntPipe) fineId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.finesService.payFine(fineId, request.user.id);
  }

  @Get('groups/:id/fines')
  getFines(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFinesDto,
  ) {
    return this.finesService.getFines(groupId, request.user.id, query);
  }
}
