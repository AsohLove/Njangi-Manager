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
import { MembersService } from './members.service';

@Controller('members')
@UseGuards(AuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @HttpCode(204)
  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.membersService.remove(id, request.user.id);
  }
}
