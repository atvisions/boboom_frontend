// 简单的合约地址类型
interface SimpleContractAddresses {
  OKB_TOKEN: string;
  TOKEN_FACTORY_V3: string;
  BONDING_CURVE_V3: string;
  LIQUIDITY_ROUTER: string;
}

// 直接从环境变量读取合约地址
const CONTRACT_ADDRESSES: SimpleContractAddresses = {
  OKB_TOKEN: process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS || '0x0a4c537d44C4D4f4688812629d07351399C50386',
  TOKEN_FACTORY_V3: process.env.NEXT_PUBLIC_TOKEN_FACTORY_V1_ADDRESS || '0xF7b8eF600A699cB0c7327F4576aF30B62b0AD9eE',
  BONDING_CURVE_V3: process.env.NEXT_PUBLIC_BONDING_CURVE_V1_ADDRESS || '0x0DfA50998227518D42Fec00e046f065c48ebe02F',
  LIQUIDITY_ROUTER: process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS || '0xfC87BD3bEAaD192bf469BAaF9C9a7EE9655a8447',
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
