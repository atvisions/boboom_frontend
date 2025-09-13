/**
 * 合约地址配置和工具函数
 */

// 已知的合约地址列表
export const CONTRACT_ADDRESSES = [
  '0xbc9bd35ad4ae0233b5767d4cb9208fdb9cea942d', // token_factory_v3_address
  '0x564e310b4390f24fe5cefaf601973ca1ca0d36f3', // bonding_curve_v3_address
  '0xb96e6ca61596d77150284e4f31ee5c63b9545a70', // izumi_integration_address
];

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
