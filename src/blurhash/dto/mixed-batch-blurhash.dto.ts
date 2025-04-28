import { IsArray, ArrayNotEmpty, IsEnum, IsString, IsOptional, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MixedInputType {
  URL = 'url',
  BASE64 = 'base64',
  FILE = 'file',
}

export class MixedBatchItem {
  @IsEnum(MixedInputType)
  @ApiProperty({ description: '输入类型：url、base64、file', enum: MixedInputType, example: 'url' })
  type: MixedInputType;

  @IsString()
  @ApiProperty({ description: '输入内容，url 或 base64 字符串，file 类型为文件名（预留）', example: 'https://example.com/1.jpg' })
  value: string; // url, base64, 或文件名（file 仅做占位，实际应用时可扩展）

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

export class MixedBatchBlurhashDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MixedBatchItem)
  @ApiProperty({ type: [MixedBatchItem], description: '混合批量输入列表' })
  items: MixedBatchItem[];
}
