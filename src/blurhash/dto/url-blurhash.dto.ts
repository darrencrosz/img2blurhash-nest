import { IsUrl, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UrlBlurhashDto {
  @ApiProperty({ description: '图片 URL', example: 'https://example.com/1.jpg' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'blurhash 横向分量数，默认 4，范围 1~9', example: 4, minimum: 1, maximum: 9, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentX?: number = 4;

  @ApiProperty({ description: 'blurhash 纵向分量数，默认 3，范围 1~9', example: 3, minimum: 1, maximum: 9, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  componentY?: number = 3;
}
