import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRoundDto {
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsIn(['auto', 'app_draw', 'manual_draw'])
  method!: 'auto' | 'app_draw' | 'manual_draw';

  @IsOptional()
  @IsInt()
  @Min(1)
  collector_position_id?: number;
}
