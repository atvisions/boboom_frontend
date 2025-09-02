// 合约配置
export const CONTRACT_CONFIG = {
  // Sepolia 测试网合约地址
  sepolia: {
    TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V3_ADDRESS as `0x${string}`,
    BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V3_ADDRESS as `0x${string}`,
    IZUMI_INTEGRATION: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`,
    OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS as `0x${string}`,
  },
  // X Layer 主网合约地址
  xlayer: {
    TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V3_ADDRESS as `0x${string}`,
    BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V3_ADDRESS as `0x${string}`,
    IZUMI_INTEGRATION: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`,
    OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS as `0x${string}`,
  }
};

// 平台参数
export const PLATFORM_CONFIG = {
  CREATION_FEE: process.env.NEXT_PUBLIC_CREATION_FEE || '0',
  GRADUATION_THRESHOLD: process.env.NEXT_PUBLIC_GRADUATION_THRESHOLD || '200',
  TRADING_FEE_RATE: process.env.NEXT_PUBLIC_TRADING_FEE_RATE || '100',
};

// 网络配置
export const NETWORK_CONFIG = {
  NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID || '11155111',
  NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/Dwhp-JulbzNpZrEHruaBSD7RRx4Eeukb',
};

// 代币特性配置
export const TOKEN_FLAGS = {
  // 当 OKB 为原生币（如 X Layer 主网的 OKB）时，设置为 'true'
  OKB_IS_NATIVE: (process.env.NEXT_PUBLIC_OKB_IS_NATIVE || 'false').toLowerCase() === 'true',
};

// 获取当前网络的合约地址
export function getContractAddresses(network: 'sepolia' | 'xlayer' = 'sepolia') {
  return CONTRACT_CONFIG[network];
}

// 验证合约地址是否有效
export function validateContractAddresses(network: 'sepolia' | 'xlayer' = 'sepolia') {
  const addresses = getContractAddresses(network);
  const requiredAddresses = [
    addresses.TOKEN_FACTORY_V3,
    addresses.BONDING_CURVE_V3,
    addresses.IZUMI_INTEGRATION,
    addresses.OKB_TOKEN,
  ];
  
  return requiredAddresses.every(addr => addr && addr.startsWith('0x') && addr.length === 42);
}
