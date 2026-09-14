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
import { RoundsService } from './rounds.service';
import type { AuthenticatedRequest } from 'src/auth/authenticated-request';
import { CreateRoundDto } from './dto/create-round.dto';

@Controller()
@UseGuards(AuthGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('cycles/:id/eligible-positions')
  getEligiblePositions(
    @Param('id', ParseIntPipe) cycleId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.roundsService.getEligiblePositions(cycleId, request.user.id);
  }

  @Post('cycles/:id/rounds')
  createRound(
    @Param('id', ParseIntPipe) cycleId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRoundDto,
  ) {
    return this.roundsService.createRound(cycleId, request.user.id, dto);
  }

  @Get('rounds/:id')
  getRound(
    @Param('id', ParseIntPipe) roundId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.roundsService.getRound(roundId, request.user.id);
  }
}
