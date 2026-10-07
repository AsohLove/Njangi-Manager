import { IsInt, Min } from 'class-validator';

export class CreatePositionDto {
  @IsInt()
  @Min(1)
  member_id: number;
}
