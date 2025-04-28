import { IsBase64, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadBlurhashDto {
  @ApiProperty({ description: '图片 base64 字符串', example: 'iVBORw0KGgoAAAANSUhEUgAA...' })
  @IsBase64()
  image: string;

  @ApiPropertyOptional({ description: 'blurhash 横向分量数，默认 4，范围 1~9', example: 4, minimum: 1, maximum: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentX?: number = 4;

  @ApiPropertyOptional({ description: 'blurhash 纵向分量数，默认 3，范围 1~9', example: 3, minimum: 1, maximum: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentY?: number = 3;
}
