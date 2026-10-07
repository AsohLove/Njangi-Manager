import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { AdjustmentsService } from './adjustments.service';

@Controller()
@UseGuards(AuthGuard)
export class AdjustmentsController {
  constructor(private readonly adjustmentsService: AdjustmentsService) {}

  @Post('groups/:id/adjustments')
  create(
    @Param('id', ParseIntPipe) groupId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.adjustmentsService.create(groupId, request.user.id, dto);
  }
}
