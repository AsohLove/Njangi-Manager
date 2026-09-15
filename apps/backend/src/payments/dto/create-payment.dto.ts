import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  position_id: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  amount?: number;
}
