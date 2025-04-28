import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlurhashModule } from './blurhash/blurhash.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60秒窗口
      limit: 30, // 每分钟最多30次请求
    } as any), // 临时绕过类型检查，确保限流生效
    AuthModule,
    BlurhashModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
