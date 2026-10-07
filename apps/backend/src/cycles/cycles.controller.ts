import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AuthGuard } from '../auth/auth.guard';
import { CyclesService } from './cycles.service';

@Controller()
@UseGuards(AuthGuard)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post('groups/:id/cycles')
  @HttpCode(201)
  create(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cyclesService.create(id, request.user.id);
  }

  @Get('cycles/:id/summary')
  getSummary(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cyclesService.getSummary(id, request.user.id);
  }
}
