import { Module } from '@nestjs/common';
import { BlurhashService } from './blurhash.service';
import { BlurhashController } from './blurhash.controller';
import { LoggerService } from './logger.service';
import { CacheService } from './cache.service';

@Module({
  providers: [BlurhashService, LoggerService, CacheService],
  controllers: [BlurhashController],
  exports: [BlurhashService, LoggerService, CacheService],
})
export class BlurhashModule {}
