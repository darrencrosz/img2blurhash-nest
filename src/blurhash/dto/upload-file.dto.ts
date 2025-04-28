import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentX?: number = 4;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentY?: number = 3;
}
