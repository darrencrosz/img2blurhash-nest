import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('img2blurhash API')
    .setDescription('基于 NestJS 的 Blurhash 编码/解码服务，支持图片上传、URL、混合批量、批量解码等多种场景。\n\n**全局响应结构：**\n\n```json\n{\n  "code": 0, // 0: 成功，-1: 失败\n  "message": "success",\n  "data": { ... }\n}\n```\n\n**错误码说明：**\n- `code=0`：成功\n- `code=-1`：服务端异常或参数错误\n- 其他 code 预留扩展\n\n**接口分组：**\n- Blurhash编码相关（upload, url, batch-url, mixed-batch）\n- Blurhash解码相关（decode, batch-decode）')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
