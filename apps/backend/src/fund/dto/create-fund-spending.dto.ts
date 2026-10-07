import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateFundSpendingDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  note!: string;
}
