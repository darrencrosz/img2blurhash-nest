# 使用官方 Node 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装全部依赖（包含 devDependencies，保证 nest CLI 可用）
RUN npm install

# 复制项目所有文件
COPY . .

# 构建 NestJS 项目
RUN npm run build

# 生产环境只保留生产依赖
RUN npm prune --production

# 启动服务（假设 dist/main.js 是入口）
CMD ["node", "dist/main.js"]

# 暴露端口（根据你的 main.ts 监听端口，默认 3000）
EXPOSE 3000
