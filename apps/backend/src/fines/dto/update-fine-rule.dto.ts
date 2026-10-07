import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateFineRuleDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  default_amount?: number;
}
