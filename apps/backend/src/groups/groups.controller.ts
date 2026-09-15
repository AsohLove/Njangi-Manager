import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  ParseIntPipe,
  Param,
  HttpCode,
  Put
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AuthGuard } from '../auth/auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionOrderDto } from './dto/update-position-order.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(request.user.id, dto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.groupsService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.findOne(id, request.user.id);
  }

  @HttpCode(200)
  @Post(':id/share-code')
  regenerateShareCode(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.regenerateShareCode(id, request.user.id);
  }

  @Post(':id/members')
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMemberDto,
  ) {
    return this.groupsService.addMember(id, request.user.id, dto);
  }

  @Post(':id/positions')
  addPosition(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePositionDto,
  ) {
    return this.groupsService.addPosition(id, request.user.id, dto);
  }

  @HttpCode(204)
  @Put(':id/positions/order')
  updatePositionsOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionOrderDto,
  ) {
    return this.groupsService.updatePositionsOrder(id, request.user.id, dto);
  }
}
