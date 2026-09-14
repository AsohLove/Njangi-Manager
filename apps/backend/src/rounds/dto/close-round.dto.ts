import { IsBoolean, IsOptional } from 'class-validator';

export class CloseRoundDto {
  @IsOptional()
  @IsBoolean()
  acknowledge_shortfall?: boolean;
}
