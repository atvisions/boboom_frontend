// 测试毕业进度数据处理逻辑
const testTokenData = {
  "address": "0xb5a9a6998f8e36754587a3c00d08b3ea522647f8",
  "symbol": "Q",
  "graduationProgress": 80.0,
  "okbCollected": "160.000000000000000000",
  "phase": "CURVE_TRADING"
};

console.log('=== 测试数据处理逻辑 ===');
console.log('原始数据:', testTokenData);

// 模拟前端映射逻辑
const mappedToken = {
  ...testTokenData,
  graduationProgress: parseFloat(testTokenData.graduationProgress || testTokenData.graduation_progress || '0'),
};

console.log('映射后数据:', mappedToken);

// 模拟BondingCurveProgress组件逻辑
const progress = parseFloat(
  (mappedToken.graduationProgress || mappedToken.graduation_progress || '0').toString()
);

console.log('最终进度值:', progress);
console.log('进度类型:', typeof progress);

if (progress === 0) {
  console.error('❌ 进度值为0，存在问题！');
} else {
  console.log('✅ 进度值正常:', progress + '%');
}