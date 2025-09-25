// 简单的合约地址类型
interface SimpleContractAddresses {
  OKB_TOKEN: string;
  TOKEN_FACTORY_V3: string;
  BONDING_CURVE_V3: string;
  LIQUIDITY_ROUTER: string;
}

// 直接从环境变量读取合约地址
const CONTRACT_ADDRESSES: SimpleContractAddresses = {
  OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS || '0xABB9779ab5D36780c03133776CE0a003e4A5b7e8',
  TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V1_ADDRESS || '0xF7b8eF600A699cB0c7327F4576aF30B62b0AD9eE',
  BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V1_ADDRESS || '0x0DfA50998227518D42Fec00e046f065c48ebe02F',
  LIQUIDITY_ROUTER: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS || '0x1554ED6b3c435ba858264C9519f632B08Eb5d107',
};

export function useContractConfigSimple() {
  return {
    addresses: CONTRACT_ADDRESSES,
    isLoading: false,
    error: null,
  };
}

// 兼容性导出
export function useContractAddresses() {
  return useContractConfigSimple();
}
