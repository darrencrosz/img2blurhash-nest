# img2blurhash-nest

基于 NestJS 的 Blurhash 编码/解码服务，支持图片上传、URL、混合批量、批量解码等多种场景。

- **接口文档入口**： [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **全局前缀**：`/api/v1`，所有接口均为 `/api/v1/blurhashes/...`

## 快速上手

```bash
# 安装依赖
npm install

# 启动开发环境
npm run start:dev

# 运行 e2e 测试
npm run test:e2e
```

## 主要接口说明

### 1. 通过 base64 图片生成 blurhash
- `POST /api/v1/blurhashes/upload`
- 请求体：
```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "componentX": 4,
  "componentY": 3
}
```
- 响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    "metadata": { "width": 320, "height": 240, "type": "image/png" },
    "settings": { "componentX": 4, "componentY": 3 }
  }
}
```

### 2. 通过图片 URL 生成 blurhash
- `POST /api/v1/blurhashes/url`
- 请求体：
```json
{
  "url": "https://example.com/1.jpg",
  "componentX": 4,
  "componentY": 3
}
```
- 响应同上

### 3. 批量处理/混合批量/批量解码
详见 Swagger 文档 `/api-docs`，所有接口均有详细示例。

## 全局响应结构
```json
{
  "code": 0, // 0: 成功，-1: 失败
  "message": "success",
  "data": { ... }
}
```

## 错误码说明
- `code=0`：成功
- `code=-1`：服务端异常或参数错误
- 其他 code 预留扩展

## 常见错误码与异常说明

| code  | message                  | 说明                       |
|-------|--------------------------|----------------------------|
| 0     | success                  | 请求成功                   |
| -1    | 服务端异常/参数错误等     | 统一异常包装，见下方说明   |
| 10001 | 图片下载失败              | URL 无效、图片 404 等      |
| 10002 | 图片格式不支持            | 非常见图片格式/损坏文件    |
| 10003 | blurhash 生成失败         | 图片内容异常、内部错误等    |
| 10004 | blurhash 解码失败         | blurhash 字符串不合法等    |

**异常响应结构示例：**
```json
{
  "code": -1,
  "message": "图片下载失败: 404 Not Found",
  "data": null
}
```

- 服务端所有异常均会被统一包装为上述结构，code=-1 或自定义错误码，message 为具体错误信息。
- 常见异常如参数校验失败、外部依赖异常、解码失败等均会返回合理的 code/message，便于前端精准处理。

## 接口限流说明

- 本服务已启用全局接口限流：**每分钟每 IP 最多 30 次请求**，超限将返回 429 状态码。
- 如需提高配额或定制专属限流策略，请联系项目维护者。

## 鉴权与安全说明

- 所有接口默认启用 JWT Bearer Token 鉴权，需在请求头携带 `Authorization: Bearer <token>`。
- 可通过管理员分发的 Token 访问接口，或联系项目维护者获取。
- 未携带或 Token 无效时将返回 401 Unauthorized。

### 获取 JWT Token 示例

- 接口：`POST /api/v1/auth/login`
- 请求体：
```json
{
  "apiKey": "your_api_key"
}
```
- 成功响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "<jwt_token_string>"
  }
}
```
- 失败响应：
```json
{
  "code": -1,
  "message": "API Key 错误",
  "data": null
}
```

- 获取到 token 后，后续请求需在 Header 携带：
  `Authorization: Bearer <token>`

### 多用户/多 API Key 支持

- 支持配置多个 API Key，便于多用户/多客户端接入。
- 可通过环境变量 `API_KEYS` 配置（逗号分隔），如：
  ```bash
  API_KEYS=demo_key1,demo_key2,clientA_key
  ```
- 登录接口 `/api/v1/auth/login` 支持上述任意 Key 换取 Token。

## 贡献与支持
如需贡献、反馈或定制开发，请联系项目维护者。

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
