/**
 * 合约地址配置和工具函数
 */

// 已知的合约地址列表 - 使用环境变量获取最新地址
export const CONTRACT_ADDRESSES = [
  process.env.NEXT_PUBLIC_TOKEN_FACTORY_V1_ADDRESS?.toLowerCase() || '0x7a340e069845a1F4e716384F2216feD4D93593Fd'.toLowerCase(),
  process.env.NEXT_PUBLIC_BONDING_CURVE_V1_ADDRESS?.toLowerCase() || '0x6Cdb61d8fA763804351A8A58E19e075aE7D5EaF3'.toLowerCase(),
  process.env.NEXT_PUBLIC_IZUMI_INTEGRATION_ADDRESS?.toLowerCase() || '0xfC87BD3bEAaD192bf469BAaF9C9a7EE9655a8447'.toLowerCase(),
  process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS?.toLowerCase() || '0xABB9779ab5D36780c03133776CE0a003e4A5b7e8'.toLowerCase(),
  process.env.NEXT_PUBLIC_MOCK_POSITION_MANAGER_ADDRESS?.toLowerCase() || '0x80e96F05F4f5607Aee602e45B37abE1565DeF5d3'.toLowerCase(),
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
