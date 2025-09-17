/**
 * 合约地址配置和工具函数
 */

// 已知的合约地址列表 - 使用环境变量获取最新地址
export const CONTRACT_ADDRESSES = [
  process.env.NEXT_PUBLIC_TOKEN_FACTORY_V1_ADDRESS?.toLowerCase() || '0xF7b8eF600A699cB0c7327F4576aF30B62b0AD9eE'.toLowerCase(),
  process.env.NEXT_PUBLIC_BONDING_CURVE_V1_ADDRESS?.toLowerCase() || '0x0DfA50998227518D42Fec00e046f065c48ebe02F'.toLowerCase(),
  process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS?.toLowerCase() || '0xfC87BD3bEAaD192bf469BAaF9C9a7EE9655a8447'.toLowerCase(),
  process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS?.toLowerCase() || '0x0a4c537d44C4D4f4688812629d07351399C50386'.toLowerCase(),
  process.env.NEXT_PUBLIC_MOCK_POSITION_MANAGER_ADDRESS?.toLowerCase() || '0xA2EC04A65cbab0c03A955Bd6A20BD3438CDB3614'.toLowerCase(),
].filter(Boolean); // 过滤掉空值

/**
 * 检查地址是否为合约地址
 * @param address 要检查的地址
 * @returns 如果是合约地址返回 true，否则返回 false
 */
export function isContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return CONTRACT_ADDRESSES.includes(address.toLowerCase());
}

/**
 * 过滤掉合约地址，只保留用户地址
 * @param addresses 地址数组
 * @returns 过滤后的用户地址数组
 */
export function filterUserAddresses(addresses: string[]): string[] {
  return addresses.filter(address => {
    if (!address || typeof address !== 'string') return false;
    return !isContractAddress(address);
  });
}

/**
 * 从代币列表中提取创建者地址，并过滤掉合约地址
 * @param tokens 代币列表
 * @returns 过滤后的创建者地址数组
 */
export function extractCreatorAddresses(tokens: any[]): string[] {
  const creatorAddresses = tokens
    .map((token: any) => token.creator)
    .filter((creator: any) => creator && typeof creator === 'string');
  
  return filterUserAddresses(creatorAddresses);
}
