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

// 简化的合约地址类型（向后兼容）
export interface ContractAddresses {
  TOKEN_FACTORY_V3: `0x${string}`;
  BONDING_CURVE_V3: `0x${string}`;
  IZUMI_INTEGRATION: `0x${string}`;
  LIQUIDITY_ROUTER: `0x${string}`;
  OKB_TOKEN: `0x${string}`;
}

// 获取当前网络的合约地址（简化版本，直接从环境变量读取）
export function getContractAddresses(network: 'sepolia' | 'xlayer' = 'sepolia'): ContractAddresses {
  return {
    TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V1_ADDRESS as `0x${string}`,
    BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V1_ADDRESS as `0x${string}`,
    IZUMI_INTEGRATION: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`,
    LIQUIDITY_ROUTER: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`, // 使用相同地址
    OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS as `0x${string}`,
  };
}
