import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { LoggerService } from './logger.service';

interface CacheItem<T> {
  value: T;
  expiry: number | null;
}

@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 3600 * 1000; // 1小时
  private readonly CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10分钟
  private cache = new Map<string, CacheItem<any>>();

  constructor(private readonly logger: LoggerService) {
    setInterval(() => this.cleanup(), this.CACHE_CLEANUP_INTERVAL);
  }

  generateImageCacheKey(imageBuffer: Buffer): string {
    return crypto.createHash('md5').update(imageBuffer).digest('hex');
  }

  generateUrlCacheKey(url: string): string {
    return 'url:' + crypto.createHash('md5').update(url).digest('hex');
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    this.logger.debug(`缓存命中: ${key}`);
    return item.value;
  }

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL) {
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`缓存设置: ${key}, TTL: ${ttl}ms`);
  }

  private cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.logger.info(`清理了 ${count} 个过期缓存项`);
    }
  }
}
