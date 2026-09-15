import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  full_name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
