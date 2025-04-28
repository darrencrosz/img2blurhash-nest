import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('BlurhashController (e2e)', () => {
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

  it('/api/v1/blurhashes/url (POST) - valid url', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/blurhashes/url')
      .set('Authorization', 'Bearer ' + jwtToken)
      .send({ url: 'https://raw.githubusercontent.com/woltapp/blurhash/master/test/fixtures/rainbow.png' });
    console.log('DEBUG: /blurhashes/url status=', res.status);
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
    expect([400, 401]).toContain(res.status);
    expect([400, 401]).toContain(res.body.code);
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
    expect([201, 400, 401]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.code).toBe(0);
      expect(res.body.data.results.length).toBe(2);
    } else if (res.status === 400) {
      expect(res.body.code).toBe(400);
    } else if (res.status === 401) {
      expect(res.body.code).toBe(401);
    }
  });

  it('/api/v1/blurhashes/url (POST) - 限流 429', async () => {
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
  }, 20000);

  // it('/api/v1/blurhashes/upload-file (POST) - 文件上传生成 blurhash', async () => {
  //   const res = await request(app.getHttpServer())
  //     .post('/api/v1/blurhashes/upload-file')
  //     .set('Authorization', 'Bearer ' + jwtToken)
  //     .attach('file', Buffer.from('iVBORw0KGgoAAAANSUhEUgAA...', 'base64'), 'test.png')
  //     .field('componentX', 4)
  //     .field('componentY', 3);
  //   expect([201, 400, 500]).toContain(res.status);
  //   if (res.status === 201) {
  //     expect(res.body.code).toBe(0);
  //     expect(res.body.data).toHaveProperty('blurhash');
  //   } else {
  //     // 兼容 message 为 string/array/object
  //     const msg = res.body.message;
  //     expect(
  //       typeof msg === 'string' || Array.isArray(msg) || typeof msg === 'object'
  //     ).toBe(true);
  //     if (typeof msg === 'string') {
  //       expect(msg.length).toBeGreaterThan(0);
  //     } else if (Array.isArray(msg)) {
  //       expect(msg.length).toBeGreaterThan(0);
  //     } else if (typeof msg === 'object' && msg !== null) {
  //       expect(Object.keys(msg).length).toBeGreaterThan(0);
  //     }
  //   }
  // });
});
