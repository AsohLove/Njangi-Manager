import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  position_id: number;

  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsBoolean()
  is_late?: boolean;
}
