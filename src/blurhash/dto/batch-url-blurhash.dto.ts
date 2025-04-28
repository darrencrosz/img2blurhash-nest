import { IsArray, ArrayNotEmpty, IsUrl, ValidateNested, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BatchUrlItem {
  @IsUrl()
  @ApiProperty({ description: '图片 URL', example: 'https://example.com/1.jpg' })
  url: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  @ApiPropertyOptional({ description: 'blurhash 横向分量数，默认 4，范围 1~9', example: 4, minimum: 1, maximum: 9 })
  componentX?: number = 4;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  @ApiPropertyOptional({ description: 'blurhash 纵向分量数，默认 3，范围 1~9', example: 3, minimum: 1, maximum: 9 })
  componentY?: number = 3;
}

export class BatchUrlBlurhashDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BatchUrlItem)
  @ApiProperty({ type: [BatchUrlItem], description: '图片 URL 批量列表' })
  items: BatchUrlItem[];
}
