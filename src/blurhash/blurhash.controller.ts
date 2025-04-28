import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Res,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { BlurhashService } from './blurhash.service';
import { Response } from 'express';
import { UploadBlurhashDto } from './dto/upload-blurhash.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerImageStorage, imageFileFilter } from './file-upload.util';
import { UploadFileDto } from './dto/upload-file.dto';
import { UrlBlurhashDto } from './dto/url-blurhash.dto';
import { BatchUrlBlurhashDto } from './dto/batch-url-blurhash.dto';
import { BatchDecodeBlurhashDto } from './dto/batch-decode-blurhash.dto';
import { downloadImageBuffer } from './utils/download.util';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MixedBatchBlurhashDto, MixedInputType } from './dto/mixed-batch-blurhash.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('blurhashes')
@Controller('blurhashes')
export class BlurhashController {
  constructor(private readonly blurhashService: BlurhashService) {}

  // @ApiBearerAuth('JWT')
  // @UseGuards(JwtAuthGuard)
  // @Post('upload')
  // @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  // @ApiOperation({ summary: '通过 base64 图片生成 blurhash' })
  // @ApiBody({
  //   type: UploadBlurhashDto,
  //   description: 'base64 图片及可选参数',
  //   examples: {
  //     default: {
  //       summary: '典型请求',
  //       value: {
  //         image: 'iVBORw0KGgoAAAANSUhEUgAA...',
  //         componentX: 4,
  //         componentY: 3
  //       }
  //     }
  //   }
  // })
  // @ApiResponse({ status: 201, description: '生成 blurhash 成功', schema: {
  //   example: {
  //     code: 0,
  //     message: 'success',
  //     data: {
  //       blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  //       metadata: { width: 320, height: 240, type: 'image/png' },
  //       settings: { componentX: 4, componentY: 3 }
  //     }
  //   }
  // }})
  // async generateFromUpload(@Body() uploadDto: UploadBlurhashDto) {
  //   const { image, componentX, componentY } = uploadDto;
  //   const buffer = Buffer.from(image, 'base64');
  //   return this.blurhashService.getBlurhashFromBuffer(buffer, { componentX, componentY });
  // }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file', {
    storage: multerImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '通过图片文件生成 blurhash' })
  @ApiBody({
    description: '图片文件（file 字段上传），可选参数 componentX/componentY',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '图片文件' },
        componentX: { type: 'integer', minimum: 1, maximum: 9, example: 4, description: '横向分量数' },
        componentY: { type: 'integer', minimum: 1, maximum: 9, example: 3, description: '纵向分量数' },
      },
      required: ['file'],
    },
  })
  async generateFromFile(
    @UploadedFile() file: any,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    // 调试：打印 file 和 uploadFileDto
    console.log('上传文件信息:', file);
    console.log('DTO 参数:', uploadFileDto);
    if (!file) {
      throw new HttpException('未检测到上传图片', HttpStatus.BAD_REQUEST);
    }
    // 兼容 diskStorage: file.buffer 可能不存在，需从文件路径读取 Buffer
    let imageBuffer: Buffer;
    if (file.buffer) {
      imageBuffer = file.buffer;
    } else if (file.path) {
      const fs = require('fs');
      imageBuffer = fs.readFileSync(file.path);
    } else {
      throw new HttpException('无法获取上传的图片数据', HttpStatus.BAD_REQUEST);
    }
    const { componentX, componentY } = uploadFileDto;
    return this.blurhashService.getBlurhashFromBuffer(imageBuffer, { componentX, componentY });
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('url')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '通过图片 URL 生成 blurhash' })
  @ApiBody({
    type: UrlBlurhashDto,
    description: '图片 URL 及可选参数',
    examples: {
      default: {
        summary: '典型请求',
        value: {
          url: 'https://example.com/1.jpg',
          componentX: 4,
          componentY: 3
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: '生成 blurhash 成功', schema: {
    example: {
      code: 0,
      message: 'success',
      data: {
        blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
        metadata: { width: 320, height: 240, type: 'image/jpeg' },
        settings: { componentX: 4, componentY: 3 }
      }
    }
  }})
  async fromUrl(@Req() req: Request, @Body() urlDto: UrlBlurhashDto) {
    const buffer = await downloadImageBuffer(urlDto.url);
    return this.blurhashService.getBlurhashFromBuffer(buffer, urlDto);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('batch-url')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '批量通过图片 URL 生成 blurhash' })
  @ApiBody({
    type: BatchUrlBlurhashDto,
    description: '图片 URL 批量列表',
    examples: {
      default: {
        summary: '典型请求',
        value: {
          items: [
            { url: 'https://example.com/1.jpg', componentX: 4, componentY: 3 },
            { url: 'https://example.com/2.jpg' }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: '批量生成 blurhash 成功', schema: {
    example: {
      code: 0,
      message: 'success',
      data: {
        results: [
          {
            blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
            metadata: { width: 320, height: 240, type: 'image/jpeg' },
            settings: { componentX: 4, componentY: 3 }
          },
          { error: '图片获取失败', url: 'https://example.com/2.jpg' }
        ]
      }
    }
  }})
  async batchFromUrl(@Body() batchDto: BatchUrlBlurhashDto) {
    const results = await Promise.all(
      batchDto.items.map(async ({ url, componentX, componentY }) => {
        try {
          const buffer = await downloadImageBuffer(url);
          const data = await this.blurhashService.getBlurhashFromBuffer(buffer, { componentX, componentY });
          return { url, ...data };
        } catch (error) {
          return { url, error: error.message };
        }
      })
    );
    return { results };
  }

  @Post('decode')
  @ApiOperation({ summary: '解码 blurhash 为图片（POST，参数放 body，避免特殊字符问题）' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        blurhash: { type: 'string', description: 'blurhash 字符串', example: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' },
        width: { type: 'integer', description: '输出图片宽度', example: 32 },
        height: { type: 'integer', description: '输出图片高度', example: 32 },
        punch: { type: 'number', description: '对比度因子', example: 1 },
      },
      required: ['blurhash']
    }
  })
  @ApiResponse({ status: 200, description: 'PNG 图片', schema: { type: 'string', format: 'binary' } })
  async decodeHash(@Body() body: { blurhash: string; width?: number; height?: number; punch?: number }, @Res() res: Response) {
    const { blurhash, width, height, punch } = body;
    if (!blurhash) {
      throw new HttpException('缺少blurhash参数', HttpStatus.BAD_REQUEST);
    }
    const w = parseInt(width as any) || 32;
    const h = parseInt(height as any) || 32;
    const p = parseFloat(punch as any) || 1.0;
    if (w <= 0 || w > 1000 || h <= 0 || h > 1000) {
      throw new HttpException('宽度和高度必须在1-1000之间', HttpStatus.BAD_REQUEST);
    }
    if (p <= 0 || p > 10) {
      throw new HttpException('对比度因子必须在0-10之间', HttpStatus.BAD_REQUEST);
    }
    const pngBuffer = await this.blurhashService.decodeBlurhash(blurhash, w, h, p);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(pngBuffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('batch-decode')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '批量解码 blurhash 为图片' })
  @ApiBody({
    type: BatchDecodeBlurhashDto,
    description: '待解码 blurhash 列表',
    examples: {
      default: {
        summary: '典型请求',
        value: {
          blurhashes: [
            { blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 32, height: 32 },
            { blurhash: 'INVALID_BLURHASH' }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: '批量解码 blurhash 成功', schema: {
    example: {
      code: 0,
      message: 'success',
      data: {
        results: [
          {
            blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
            image: 'iVBORw0KGgoAAAANSUhEUgAA...'
          },
          {
            blurhash: 'INVALID_BLURHASH',
            error: '解码blurhash失败: Invalid blurhash string length'
          }
        ]
      }
    }
  }})
  async batchDecode(@Body() dto: BatchDecodeBlurhashDto) {
    const results = await Promise.all(
      dto.blurhashes.map(async ({ blurhash, width, height, punch }) => {
        try {
          const buffer = await this.blurhashService.decodeBlurhash(blurhash, width, height, punch);
          return { blurhash, image: buffer.toString('base64') };
        } catch (error) {
          return { blurhash, error: error.message };
        }
      })
    );
    return { results };
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('mixed-batch')
  @ApiOperation({ summary: '混合批量生成 blurhash（支持 url+文件）' })
  @UseInterceptors(FilesInterceptor('files'))
  async mixedBatch(
    @UploadedFiles() files: any[],
    @Body() dto: any,
  ) {
    // 调试：打印 items 字段收到的原始内容和类型
    console.log('raw dto.items:', dto.items, typeof dto.items);
    let items = dto.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        throw new HttpException('items 字段 JSON 解析失败: ' + e.message, HttpStatus.BAD_REQUEST);
      }
    }
    // 新增：如果 items 是对象且有 items 字段（部分客户端会包裹一层），自动展开
    if (items && typeof items === 'object' && !Array.isArray(items) && Array.isArray(items.items)) {
      items = items.items;
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpException('items 字段必须为非空数组', HttpStatus.BAD_REQUEST);
    }
    // 构造 fileMap
    const fileMap = {};
    if (Array.isArray(files)) {
      for (const file of files) {
        fileMap[file.originalname] = file.buffer || (file.path && require('fs').readFileSync(file.path));
      }
    }
    const results = await Promise.all(
      items.map(async ({ type, value, componentX, componentY }) => {
        try {
          let buffer: Buffer;
          if (type === 'url') {
            buffer = await downloadImageBuffer(value);
          } else if (type === 'file') {
            if (!fileMap[value]) throw new Error('未上传对应文件: ' + value);
            buffer = fileMap[value];
          } else {
            throw new Error('仅支持 url/file 类型');
          }
          const data = await this.blurhashService.getBlurhashFromBuffer(buffer, { componentX, componentY });
          return { type, value, ...data };
        } catch (error) {
          return { type, value, error: error.message };
        }
      })
    );
    return { results };
  }
}
