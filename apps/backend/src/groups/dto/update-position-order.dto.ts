import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class UpdatePositionOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  position_ids: number[];
}
