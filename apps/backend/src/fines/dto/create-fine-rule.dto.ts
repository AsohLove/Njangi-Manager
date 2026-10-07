import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateFineRuleDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  name: string;

  @IsInt()
  @Min(1)
  default_amount: number;
}
