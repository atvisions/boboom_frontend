// 动态合约配置类型
export interface ContractAddresses {
  TOKEN_FACTORY_V3: `0x${string}`;
  BONDING_CURVE_V3: `0x${string}`;
  IZUMI_INTEGRATION: `0x${string}`;
  LIQUIDITY_ROUTER: `0x${string}`;
  OKB_TOKEN: `0x${string}`;
}

// 后端配置API响应类型
export interface BackendConfigResponse {
  success: boolean;
  data: {
    network: string;
    version: string;
    creationFee: string;
    graduationThreshold: string;
    tradingFeeRate: number;
    migrationFee: string;
    contracts: {
      tokenFactoryV3: string;
      bondingCurveV3: string;
      izumiIntegration: string;
      liquidityRouter: string;
      okbToken: string;
    };
    isPaused: boolean;
    feeRecipient: string;
  };
}

// 静态合约配置（作为后备）
export const FALLBACK_CONTRACT_CONFIG = {
  // Sepolia 测试网合约地址
  sepolia: {
    TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V3_ADDRESS as `0x${string}`,
    BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V3_ADDRESS as `0x${string}`,
    IZUMI_INTEGRATION: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`,
    LIQUIDITY_ROUTER: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`, // 后备使用相同地址
    OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS as `0x${string}`,
  },
  // X Layer 主网合约地址
  xlayer: {
    TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V3_ADDRESS as `0x${string}`,
    BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V3_ADDRESS as `0x${string}`,
    IZUMI_INTEGRATION: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`,
    LIQUIDITY_ROUTER: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS as `0x${string}`, // 后备使用相同地址
    OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS as `0x${string}`,
  }
};

// 动态平台配置类型
export interface PlatformConfig {
  CREATION_FEE: string;
  GRADUATION_THRESHOLD: string;
  TRADING_FEE_RATE: string;
  MIGRATION_FEE: string;
  IS_PAUSED: boolean;
}

// 静态平台参数（作为后备）
export const FALLBACK_PLATFORM_CONFIG: PlatformConfig = {
  CREATION_FEE: process.env.NEXT_PUBLIC_CREATION_FEE || '0',
  GRADUATION_THRESHOLD: process.env.NEXT_PUBLIC_GRADUATION_THRESHOLD || '200',
  TRADING_FEE_RATE: process.env.NEXT_PUBLIC_TRADING_FEE_RATE || '100',
  MIGRATION_FEE: '1',
  IS_PAUSED: false,
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

// 获取当前网络的合约地址（后备方案）
export function getFallbackContractAddresses(network: 'sepolia' | 'xlayer' = 'sepolia') {
  return FALLBACK_CONTRACT_CONFIG[network];
}

// 验证合约地址是否有效
export function validateContractAddresses(addresses: ContractAddresses) {
  const requiredAddresses = [
    addresses.TOKEN_FACTORY_V3,
    addresses.BONDING_CURVE_V3,
    addresses.IZUMI_INTEGRATION,
    addresses.OKB_TOKEN,
  ];

  return requiredAddresses.every(addr => addr && addr.startsWith('0x') && addr.length === 42);
}

// 从后端配置转换为前端合约地址格式
export function convertBackendConfigToContractAddresses(backendConfig: BackendConfigResponse['data']): ContractAddresses {
  return {
    TOKEN_FACTORY_V3: backendConfig.contracts.tokenFactoryV3 as `0x${string}`,
    BONDING_CURVE_V3: backendConfig.contracts.bondingCurveV3 as `0x${string}`,
    IZUMI_INTEGRATION: backendConfig.contracts.izumiIntegration as `0x${string}`,
    LIQUIDITY_ROUTER: backendConfig.contracts.liquidityRouter as `0x${string}`,
    OKB_TOKEN: backendConfig.contracts.okbToken as `0x${string}`,
  };
}

// 从后端配置转换为前端平台配置格式
export function convertBackendConfigToPlatformConfig(backendConfig: BackendConfigResponse['data']): PlatformConfig {
  return {
    CREATION_FEE: backendConfig.creationFee,
    GRADUATION_THRESHOLD: backendConfig.graduationThreshold,
    TRADING_FEE_RATE: backendConfig.tradingFeeRate.toString(),
    MIGRATION_FEE: backendConfig.migrationFee,
    IS_PAUSED: backendConfig.isPaused,
  };
}
