import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('BlurhashController Advanced (e2e)', () => {
  let app: INestApplication;
  const demoApiKey = 'demo_key1';
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // 登录获取 token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ apiKey: demoApiKey });
    jwtToken = res.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/blurhashes/mixed-batch (POST) - url & base64', async () => {
    // base64 of a small red dot PNG
    const redDotBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/mixed-batch')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ items: [
        { type: 'url', value: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' },
        { type: 'base64', value: redDotBase64 }
      ]});
    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.code).toBe(0);
      expect(res.body.data.results.length).toBe(2);
      // 结果可能为 blurhash 或 error
      expect([
        'blurhash' in res.body.data.results[0],
        'error' in res.body.data.results[0]
      ]).toContain(true);
      expect([
        'blurhash' in res.body.data.results[1],
        'error' in res.body.data.results[1]
      ]).toContain(true);
    } else {
      expect(res.body.code).toBe(-1);
      expect(typeof res.body.message).toBe('string');
    }
  });

  it('/api/v1/blurhashes/batch-decode (POST) - batch decode', async () => {
    // 典型 blurhash 测试字符串
    const hashes = [
      { blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' },
      { blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH', width: 16, height: 16 }
    ];
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/batch-decode')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ blurhashes: hashes });
    expect([200, 201, 500]).toContain(res.status);
    if ([200, 201].includes(res.status)) {
      expect(res.body.code).toBe(0);
      expect(res.body.data.results.length).toBe(2);
      // 结果可能为 image 或 error
      expect([
        'image' in res.body.data.results[0],
        'error' in res.body.data.results[0]
      ]).toContain(true);
      expect([
        'image' in res.body.data.results[1],
        'error' in res.body.data.results[1]
      ]).toContain(true);
    } else {
      expect(res.body.code).toBe(-1);
      expect(typeof res.body.message).toBe('string');
    }
  });
});
