# img2blurhash-nest

基于 NestJS 的高性能 Blurhash 编码/解码服务，支持图片上传、URL、混合批量、批量解码等多种场景，适合前后端低带宽图片预览、骨架屏、渐进式加载等应用。

- **接口文档**：[http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **全局前缀**：`/api/v1`，所有接口均为 `/api/v1/blurhashes/...`

---

## 项目特性
- 支持单张/批量图片 Blurhash 编码与解码
- 支持图片上传、本地文件、URL 输入
- 支持 JWT 鉴权与多 API Key 管理
- 全局限流，保障服务安全
- 丰富的接口文档（Swagger）与错误码说明
- 便捷的本地开发、部署与测试

## 适用场景
- 前端骨架屏、图片占位符生成
- 移动端/低带宽环境下的图片预览
- CDN/图片服务的渐进式加载
- 各类需要图片 hash/模糊占位的场景

---

## 快速开始

```bash
# 克隆项目
$ git clone <repo-url>
$ cd img2blurhash-nest

# 安装依赖
$ npm install

# 启动开发环境
$ npm run start:dev

# 运行 e2e 测试
$ npm run test:e2e
```

---

## 依赖环境
- Node.js >= 16.x
- npm >= 8.x
- 推荐使用 pnpm/yarn 亦可
- 主要依赖：NestJS、sharp、blurhash

---

## 目录结构

```
img2blurhash-nest/
├── src/               # 主源码目录
│   ├── blurhashes/    # 编码解码相关模块
│   ├── auth/          # 鉴权与 API Key 管理
│   ├── common/        # 公共工具/中间件
│   └── ...
├── test/              # 测试用例
├── .env.example       # 环境变量示例
├── package.json       # 依赖与脚本
└── README.md          # 项目说明
```

---

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

---

## 全局响应结构
```json
{
  "code": 0, // 0: 成功，-1: 失败
  "message": "success",
  "data": { ... }
}
```

---

## 错误码说明
- `code=0`：成功
- `code=-1`：服务端异常或参数错误
- 其他 code 预留扩展

### 常见错误码与异常说明

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

---

## 限流说明
- 全局限流：**每分钟每 IP 最多 30 次请求**，超限返回 429 状态码
- 如需提高配额或定制限流策略，请联系维护者

---

## 鉴权与安全
- 所有接口默认启用 JWT Bearer Token 鉴权，需在请求头携带 `Authorization: Bearer <token>`
- Token 可通过管理员分发或 `/api/v1/auth/login` 登录获取
- 未携带或 Token 无效时返回 401 Unauthorized

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
  "data": { "token": "<jwt_token_string>" }
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

#### 多用户/多 API Key 支持
- 支持配置多个 API Key，便于多用户/多客户端接入
- 通过环境变量 `API_KEYS` 配置，逗号分隔，如：
  ```bash
  API_KEYS=demo_key1,demo_key2,clientA_key
  ```
- 登录接口 `/api/v1/auth/login` 支持上述任意 Key 换取 Token

---

## 常见问题 FAQ

**Q: 支持哪些图片格式？**
A: 支持常见的 PNG、JPEG、WebP、GIF（静态帧）等，极少见格式或损坏文件会返回格式不支持。

**Q: 图片有大小/尺寸限制吗？**
A: 默认支持 10MB 以内图片，超出限制会返回错误。

**Q: 如何自定义限流/鉴权策略？**
A: 可通过修改配置或联系维护者定制。

---

## 贡献指南
- 欢迎 Issue、PR 与建议，建议先提 Issue 讨论
- 代码需通过基本测试与 lint 检查
- 贡献前请阅读并遵守本项目 MIT 协议

---

## 联系方式
- 邮箱：[darrencrosz_dev@outlook.com](mailto:darrencrosz_dev@outlook.com)
- Github: [darrencrosz](https://github.com/darrencrosz)

---

## License

MIT

---
