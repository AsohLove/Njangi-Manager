import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsIn(['weekly', 'monthly'])
  frequency: 'weekly' | 'monthly';

  @IsDateString()
  start_date: string;

  @IsIn(['fixed', 'ballot'])
  order_mode: 'fixed' | 'ballot';
}
