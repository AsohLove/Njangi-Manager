import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFineDto {
  @IsInt()
  @Min(1)
  member_id!: number;

  @IsInt()
  @Min(1)
  rule_id!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  round_id?: number;
}
