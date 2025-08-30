// 测试前端代理配置
const testMediaProxy = async () => {
  console.log('Testing media proxy configuration...');
  
  try {
    // 测试API代理
    const apiResponse = await fetch('/api/users/');
    console.log('API proxy test:', apiResponse.status);
    
    // 测试媒体文件代理
    const mediaResponse = await fetch('/media/face/face-01.png');
    console.log('Media proxy test:', mediaResponse.status);
    
    if (mediaResponse.ok) {
      console.log('✅ Media proxy is working!');
    } else {
      console.log('❌ Media proxy failed');
    }
  } catch (error) {
    console.error('❌ Proxy test failed:', error);
  }
};

// 如果在前端环境中运行
if (typeof window !== 'undefined') {
  testMediaProxy();
}

module.exports = { testMediaProxy };
