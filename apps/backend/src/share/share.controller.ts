import { Controller, Get, Param } from '@nestjs/common';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get(':code')
  getShare(@Param('code') code: string) {
    return this.shareService.getShare(code);
  }
}
