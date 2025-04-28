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
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { BlurhashService } from './blurhash.service';
import { Response } from 'express';
import { UploadBlurhashDto } from './dto/upload-blurhash.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerImageStorage, imageFileFilter } from './file-upload.util';
import { UploadFileDto } from './dto/upload-file.dto';
import { UrlBlurhashDto } from './dto/url-blurhash.dto';
import { BatchUrlBlurhashDto } from './dto/batch-url-blurhash.dto';
import { BatchDecodeBlurhashDto } from './dto/batch-decode-blurhash.dto';
import { downloadImageBuffer } from './utils/download.util';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MixedBatchBlurhashDto, MixedInputType } from './dto/mixed-batch-blurhash.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('blurhashes')
@Controller('blurhashes')
export class BlurhashController {
  constructor(private readonly blurhashService: BlurhashService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '通过 base64 图片生成 blurhash' })
  @ApiBody({
    type: UploadBlurhashDto,
    description: 'base64 图片及可选参数',
    examples: {
      default: {
        summary: '典型请求',
        value: {
          image: 'iVBORw0KGgoAAAANSUhEUgAA...',
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
        metadata: { width: 320, height: 240, type: 'image/png' },
        settings: { componentX: 4, componentY: 3 }
      }
    }
  }})
  async generateFromUpload(@Body() uploadDto: UploadBlurhashDto) {
    const { image, componentX, componentY } = uploadDto;
    const buffer = Buffer.from(image, 'base64');
    return this.blurhashService.getBlurhashFromBuffer(buffer, { componentX, componentY });
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('image', {
    storage: multerImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '上传图片文件生成 blurhash' })
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({ status: 201, description: '生成 blurhash 成功' })
  async generateFromFile(
    @UploadedFile() file: any,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new HttpException('未检测到上传图片', HttpStatus.BAD_REQUEST);
    }
    const { componentX, componentY } = uploadFileDto;
    return this.blurhashService.getBlurhashFromBuffer(file.buffer, { componentX, componentY });
  }

  @UseGuards(JwtAuthGuard)
  @Post('url')
  @UsePipes(new ValidationPipe({ whitelist: true }))
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
    console.log('BlurhashController /url req.user:', (req as any).user);
    console.log('BlurhashController /url req.headers.authorization:', req.headers['authorization']);
    const buffer = await downloadImageBuffer(urlDto.url);
    return this.blurhashService.getBlurhashFromBuffer(buffer, urlDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('batch-url')
  @UsePipes(new ValidationPipe({ whitelist: true }))
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

  @Get('decode/:blurhash')
  @ApiOperation({ summary: '解码 blurhash 并返回图片' })
  @ApiParam({ name: 'blurhash', description: 'Blurhash 字符串' })
  @ApiQuery({ name: 'width', required: false, type: Number, description: '宽度' })
  @ApiQuery({ name: 'height', required: false, type: Number, description: '高度' })
  @ApiQuery({ name: 'punch', required: false, type: Number, description: '对比度因子' })
  @ApiResponse({ status: 200, description: '返回 PNG 图片' })
  async decodeHash(
    @Param('blurhash') blurhash: string,
    @Query('width') width: string,
    @Query('height') height: string,
    @Query('punch') punch: string,
    @Res() res: Response,
  ) {
    if (!blurhash) {
      throw new HttpException('缺少blurhash参数', HttpStatus.BAD_REQUEST);
    }
    const w = parseInt(width) || 32;
    const h = parseInt(height) || 32;
    const p = parseFloat(punch) || 1.0;
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
  @UsePipes(new ValidationPipe({ whitelist: true }))
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

  @UseGuards(JwtAuthGuard)
  @Post('mixed-batch')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '混合批量生成 blurhash（支持 url/base64）' })
  @ApiBody({
    type: MixedBatchBlurhashDto,
    description: '混合批量输入列表',
    examples: {
      default: {
        summary: '典型请求',
        value: {
          items: [
            { type: 'url', value: 'https://example.com/1.jpg', componentX: 4, componentY: 3 },
            { type: 'base64', value: 'iVBORw0KGgoAAAANSUhEUgAA...' }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: '混合批量生成 blurhash 成功', schema: {
    example: {
      code: 0,
      message: 'success',
      data: {
        results: [
          {
            type: 'url',
            value: 'https://example.com/1.jpg',
            blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
            metadata: { width: 320, height: 240, type: 'image/jpeg' },
            settings: { componentX: 4, componentY: 3 }
          },
          {
            type: 'base64',
            value: 'iVBORw0KGgoAAAANSUhEUgAA...',
            blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
            metadata: { width: 320, height: 240, type: 'image/png' },
            settings: { componentX: 4, componentY: 3 }
          },
          { type: 'url', value: 'https://example.com/404.jpg', error: '图片获取失败' }
        ]
      }
    }
  }})
  async mixedBatch(@Body() dto: MixedBatchBlurhashDto) {
    const results = await Promise.all(
      dto.items.map(async ({ type, value, componentX, componentY }) => {
        try {
          let buffer: Buffer;
          if (type === MixedInputType.URL) {
            buffer = await downloadImageBuffer(value);
          } else if (type === MixedInputType.BASE64) {
            buffer = Buffer.from(value, 'base64');
          } else {
            throw new Error('文件类型暂未实现，仅支持 url/base64');
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
