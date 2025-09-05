#!/usr/bin/env node
/**
 * 清除用户相关的API缓存
 */

const userAddress = '0x87162cB0E3B0869ee7A87e739Ed444Ba8f22A07C';

console.log('🧹 清除用户API缓存');
console.log('=' * 50);
console.log(`用户地址: ${userAddress}`);

// 清除localStorage中的缓存
const cacheKeys = [
    `user_tokens_${userAddress.toLowerCase()}_sepolia`,
    `user_portfolio_${userAddress.toLowerCase()}`,
    `user_stats_${userAddress.toLowerCase()}`,
    `user_${userAddress.toLowerCase()}`
];

console.log('\n要清除的缓存键:');
cacheKeys.forEach(key => {
    console.log(`  - ${key}`);
});

console.log('\n请在浏览器控制台中运行以下代码来清除缓存:');
console.log('```javascript');
cacheKeys.forEach(key => {
    console.log(`localStorage.removeItem('${key}');`);
});
console.log('console.log("缓存已清除");');
console.log('location.reload();');
console.log('```');

console.log('\n或者直接清除所有localStorage:');
console.log('```javascript');
console.log('localStorage.clear();');
console.log('location.reload();');
console.log('```');
