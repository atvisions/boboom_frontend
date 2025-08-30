#!/bin/bash

echo "🧹 清理 Next.js 缓存..."
rm -rf .next

echo "🧹 清理 node_modules 缓存..."
rm -rf node_modules/.cache

echo "🧹 清理浏览器缓存提示..."
echo "请在浏览器中按 Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac) 强制刷新页面"

echo "📦 重新安装依赖..."
npm install

echo "🔨 重新构建项目..."
npm run build

echo "🚀 启动开发服务器..."
npm run dev
