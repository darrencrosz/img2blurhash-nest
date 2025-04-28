# 阶段性进展与任务规划

## 2025-04-28 阶段性成果

[X] 主流程、批量、混合、解码等接口全部实现，RESTful + OpenAPI 规范，接口文档 `/api-docs`
[X] 所有主要 DTO、核心接口均有详细注解与示例，Swagger 文档体验极佳
[X] README 顶部已补充项目简介、接口文档入口、主要接口用法、全局响应结构与错误码说明
[X] 常见错误码表与异常响应结构已整理，便于前后端协作
[X] 全局接口限流已上线（每分钟每 IP 30 次），安全性与抗刷能力提升
[X] 集成 JWT 鉴权，所有 blurhash 相关接口需携带 Bearer Token
[X] 新增 /api/v1/auth/login 登录接口，支持通过 API Key 换取 JWT Token
[X] README 已补充 JWT 获取方法、典型请求与响应示例

---

## 阶段任务：e2e 鉴权与 body 解析问题彻查

- [X] e2e 启动时 express.json 尝试，未解决
- [X] LoginDto 导出、login 打印 body，确认 supertest 传参
- [X] supertest .send(JSON.stringify(...))/.type('json') 尝试，未解决
- [X] 头部引入 reflect-metadata，移除 express.json，supertest 只用 .send({})，还原 Nest 默认
- [ ] 运行 e2e，观察 login 打印 body 是否为 { apiKey: ... }
- [ ] 如依然失败，login 方法尝试 @Body('apiKey') apiKey: string

**下一步**：
- 运行 e2e，若 login body 仍为空，则将 login 方法参数改为 @Body('apiKey') apiKey: string，彻底排查 DTO 解析问题。

---

## 下一步任务规划

[ ] 支持多用户/多 API Key 场景（如对接数据库或配置多组密钥）
[ ] 补充接口 e2e 测试用例（保证鉴权、限流、异常等功能稳定）
[ ] 持续集成与自动部署（CI/CD）说明
[ ] 阶段性成果归档，便于团队协作与后续维护

---

如需优先推进某一方向，请在此处补充说明。

如本轮修正通过，则归档经验到 Lesson.md，并整理 Work Log。
