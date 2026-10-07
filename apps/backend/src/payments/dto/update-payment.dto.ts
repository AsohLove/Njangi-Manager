import { IsInt, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsInt()
  @Min(1)
  amount: number;
}
