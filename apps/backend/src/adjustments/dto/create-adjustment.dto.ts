import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateAdjustmentDto {
  @IsInt()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  note!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  member_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  round_id?: number;

  @IsBoolean()
  affects_fund!: boolean;
}
