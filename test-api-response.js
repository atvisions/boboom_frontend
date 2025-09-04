// 测试前端API响应
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('=== 测试API响应 ===');
    
    const response = await fetch('http://localhost:8000/api/tokens/0xb5a9a6998f8e36754587a3c00d08b3ea522647f8/?network=sepolia');
    const data = await response.json();
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n=== 关键字段检查 ===');
      console.log('graduationProgress:', data.data.graduationProgress, typeof data.data.graduationProgress);
      console.log('graduation_progress:', data.data.graduation_progress, typeof data.data.graduation_progress);
      console.log('okbCollected:', data.data.okbCollected);
      console.log('phase:', data.data.phase);
      
      // 模拟前端映射逻辑
      const mappedProgress = parseFloat(data.data.graduationProgress || data.data.graduation_progress || '0');
      console.log('\n=== 前端映射结果 ===');
      console.log('映射后的进度值:', mappedProgress, typeof mappedProgress);
      
      if (mappedProgress === 0) {
        console.error('❌ 问题：映射后进度值为0');
      } else {
        console.log('✅ 映射成功，进度值:', mappedProgress + '%');
      }
    } else {
      console.error('❌ API响应失败或数据为空');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPI();