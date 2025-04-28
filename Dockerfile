# 使用官方 Node 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目所有文件
COPY . .

# 构建 NestJS 项目（如果是 TS 源码，需要先构建）
RUN npm run build

# 启动服务（假设 dist/main.js 是入口）
CMD ["node", "dist/main.js"]

# 暴露端口（根据你的 main.ts 监听端口，默认 3000）
EXPOSE 3000
