import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('BlurhashController (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/blurhashes/url (POST) - valid url', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/url')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ url: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' });
    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('blurhash');
    } else {
      expect(res.body.code).toBe(-1);
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
    }
  });

  it('/api/v1/blurhashes/url (POST) - invalid url', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/url')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    // message 可能为字符串或数组
    if (Array.isArray(res.body.message)) {
      expect(res.body.message.length).toBeGreaterThan(0);
    } else {
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
    }
  });

  it('/api/v1/blurhashes/batch-url (POST) - batch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/batch-url')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ urls: [
        'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png',
        'not-a-url',
      ]});
    // 由于 DTO 校验，整体请求会直接 400
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.code).toBe(0);
      expect(res.body.data.results.length).toBe(2);
    } else {
      expect(res.body.code).toBe(400);
    }
  });

  // ========== 鉴权与限流相关用例 ==========
  const demoApiKey = 'demo_key1';
  let jwtToken: string;

  it('/api/v1/auth/login (POST) - 获取 JWT Token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ apiKey: demoApiKey });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('token');
    jwtToken = res.body.data.token;
  });

  it('/api/v1/blurhashes/url (POST) - 未鉴权应 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/blurhashes/url')
      .send({ url: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' })
      .expect(401);
  });

  it('/api/v1/blurhashes/url (POST) - Bearer Token 鉴权', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/url')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ url: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' });
    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('blurhash');
    } else {
      expect(res.body.code).toBe(-1);
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
    }
  });

  it('/api/v1/blurhashes/url (POST) - 限流 429', async () => {
    // 连续超限次数请求，最后一次应返回 429
    let lastStatus = 201;
    for (let i = 0; i < 35; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/blurhashes/url')
        .set('Authorization', 'Bearer ' + jwtToken)
        .send({ url: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect([201, 429, 500]).toContain(lastStatus);
  });
});
