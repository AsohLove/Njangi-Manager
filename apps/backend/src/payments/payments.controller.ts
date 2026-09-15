import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { CreateBulkPaymentDto } from './dto/create-bulk-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller()
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('rounds/:id/payments')
  createPayment(
    @Param('id', ParseIntPipe) roundId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(roundId, request.user.id, dto);
  }

  @Post('rounds/:id/payments/bulk')
  createBulkPayments(
    @Param('id', ParseIntPipe) roundId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBulkPaymentDto,
  ) {
    return this.paymentsService.createBulkPayment(
      roundId,
      request.user.id,
      dto,
    );
  }

  @Patch('payments/:id')
  updatePayment(
    @Param('id', ParseIntPipe) paymentId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(paymentId, request.user.id, dto);
  }
}
