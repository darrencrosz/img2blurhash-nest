import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { encode, decode } from 'blurhash';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';

@Injectable()
export class BlurhashService {
  constructor(
    private readonly cache: CacheService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 从图片 Buffer 生成 blurhash
   */
  async getBlurhashFromBuffer(buffer: Buffer, options?: { componentX?: number; componentY?: number; resizeWidth?: number }) {
    const componentX = Math.min(9, Math.max(1, options?.componentX || 4));
    const componentY = Math.min(9, Math.max(1, options?.componentY || 3));
    const resizeWidth = options?.resizeWidth || 32;
    const cacheKey = this.cache.generateImageCacheKey(buffer) + `:${componentX}:${componentY}:${resizeWidth}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.info('缓存命中: blurhash', { cacheKey });
      return cached;
    }
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const { data, info } = await image
        .resize(resizeWidth, null, { fit: 'inside' })
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
      const blurhash = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        componentX,
        componentY,
      );
      const result = {
        blurhash,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
        },
        settings: { componentX, componentY },
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error('生成blurhash失败', { error: error.message });
      throw new Error(`生成blurhash失败: ${error.message}`);
    }
  }

  /**
   * 解码 blurhash 为 PNG 图片 Buffer
   */
  async decodeBlurhash(blurhash: string, width = 32, height = 32, punch = 1): Promise<Buffer> {
    const cacheKey = `decode:${blurhash}:${width}:${height}:${punch}`;
    const cached = this.cache.get<Buffer>(cacheKey);
    if (cached) {
      this.logger.info('缓存命中: decode', { cacheKey });
      return cached;
    }
    try {
      const pixels = decode(blurhash, width, height, punch);
      const buffer = Buffer.from(pixels);
      const pngBuffer = await sharp(buffer, {
        raw: {
          width,
          height,
          channels: 4,
        },
      }).png().toBuffer();
      this.cache.set(cacheKey, pngBuffer);
      return pngBuffer;
    } catch (error) {
      this.logger.error('解码blurhash失败', { error: error.message, blurhash });
      throw new Error(`解码blurhash失败: ${error.message}`);
    }
  }
}
