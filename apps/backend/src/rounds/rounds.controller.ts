import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RoundsService } from './rounds.service';

@Controller()
@UseGuards(AuthGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('cycles/:id/eligible-positions')
  getEligiblePositions(@Param('id', ParseIntPipe) cycleId: number) {
    return this.roundsService.getEligiblePositions(cycleId);
  }
}
