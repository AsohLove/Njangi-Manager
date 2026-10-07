import { IsInt, Min } from 'class-validator';

export class CreateBulkPaymentDto {
  @IsInt()
  @Min(1)
  member_id: number;
}
