import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListFinesDto {
  @IsOptional()
  @IsIn(['owed', 'paid'])
  status?: 'owed' | 'paid';

  @IsOptional()
  @IsInt()
  @Min(1)
  member_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  after?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
