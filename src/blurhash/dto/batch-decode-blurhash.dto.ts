import { IsArray, ArrayNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BatchDecodeItem {
  @ApiProperty({ description: 'blurhash 字符串', example: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' })
  @IsString()
  blurhash: string;

  @ApiPropertyOptional({ description: '解码后图片宽度，默认 32，范围 1~1000', example: 32, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  width?: number = 32;

  @ApiPropertyOptional({ description: '解码后图片高度，默认 32，范围 1~1000', example: 32, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  height?: number = 32;

  @ApiPropertyOptional({ description: '解码 punch 参数，默认 1，范围 1~10', example: 1, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  punch?: number = 1;
}

export class BatchDecodeBlurhashDto {
  @ApiProperty({ type: [BatchDecodeItem], description: '待解码 blurhash 列表' })
  @IsArray()
  @ArrayNotEmpty()
  blurhashes: BatchDecodeItem[];
}
