// 清除特定代币的缓存脚本
// 在浏览器控制台中运行此脚本

const tokenAddress = '0x1234567890123456789012345678901234567890';
const network = 'sepolia';

// 生成缓存键
function generateCacheKey(prefix, ...params) {
  return `${prefix}_${params.join('_')}`;
}

// 清除localStorage中的缓存
function clearTokenCache() {
  const cacheKeys = [
    generateCacheKey('token_details', tokenAddress, network),
    generateCacheKey('token_detail', tokenAddress, network),
    generateCacheKey('token_24h_stats', tokenAddress, network),
    generateCacheKey('token_transactions', tokenAddress, network),
    generateCacheKey('token_holders', tokenAddress, network),
    generateCacheKey('token_chart_data', tokenAddress, network)
  ];
  
  console.log('Clearing cache keys:', cacheKeys);
  
  // 清除localStorage中的缓存
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('Cleared cache key:', key);
  });
  
  // 清除sessionStorage中的缓存
  cacheKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  console.log('Token cache cleared successfully!');
  console.log('Please refresh the page to see updated data.');
}

// 执行清除缓存
clearTokenCache();

// 提示用户刷新页面
alert('缓存已清除，请刷新页面查看最新数据！');