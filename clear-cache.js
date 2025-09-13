#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 清理前端缓存...');

// 清理目录列表
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.cache'
];

// 清理文件列表
const filesToClean = [
  'tsconfig.tsbuildinfo'
];

// 清理目录
dirsToClean.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  删除目录: ${dir}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  } else {
    console.log(`ℹ️  目录不存在: ${dir}`);
  }
});

// 清理文件
filesToClean.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`🗑️  删除文件: ${file}`);
    fs.unlinkSync(filePath);
  } else {
    console.log(`ℹ️  文件不存在: ${file}`);
  }
});

console.log('✅ 缓存清理完成！');
console.log('💡 建议：');
console.log('   1. 重启开发服务器');
console.log('   2. 在浏览器中按 Ctrl+Shift+R (或 Cmd+Shift+R) 强制刷新');
console.log('   3. 打开开发者工具，在 Network 面板中勾选 "Disable cache"');
console.log('   4. 在控制台运行 clearWebSocketCache() 清理WebSocket缓存');
