import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AuthGuard } from '../auth/auth.guard';
import { PositionsService } from './positions.service';

@Controller('positions')
@UseGuards(AuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @HttpCode(204)
  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.positionsService.remove(id, request.user.id);
  }
}
