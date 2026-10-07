import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListLedgerDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  after?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  round_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  member_id?: number;

  @IsOptional()
  @IsIn(['payment', 'payout', 'fine', 'spending', 'adjustment'])
  type?: 'payment' | 'payout' | 'fine' | 'spending' | 'adjustment';
}
