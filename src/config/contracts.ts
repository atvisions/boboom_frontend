// 合约配置 - 从环境变量读取
export const CONTRACT_ADDRESSES = {
  bondingCurve: (process.env.NEXT_PUBLIC_BONDING_CURVE_V3_ADDRESS || "0xeCe5729e047A5faa6571C25F713F202c53425024") as `0x${string}`,
  okbToken: (process.env.NEXT_PUBLIC_OKB_TOKEN_ADDRESS || "0xDF021922E0Be7f7dCeF2Cb4809e7D2c28C4133fe") as `0x${string}`,
  tokenFactory: (process.env.NEXT_PUBLIC_TOKEN_FACTORY_V3_ADDRESS || "0x2750db4d488841Ef49F21D47093Ce7F7B93Ef236") as `0x${string}`,
} as const;

// Bonding Curve ABI
export const BONDING_CURVE_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "okbIn", "type": "uint256"},
      {"internalType": "uint256", "name": "minTokensOut", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "tokensIn", "type": "uint256"},
      {"internalType": "uint256", "name": "minOkbOut", "type": "uint256"}
    ],
    "name": "sellTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "okbIn", "type": "uint256"}
    ],
    "name": "getQuoteBuy",
    "outputs": [
      {"internalType": "uint256", "name": "tokensOut", "type": "uint256"},
      {"internalType": "uint256", "name": "priceAfter", "type": "uint256"},
      {"internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "tokensIn", "type": "uint256"}
    ],
    "name": "getQuoteSell",
    "outputs": [
      {"internalType": "uint256", "name": "okbOut", "type": "uint256"},
      {"internalType": "uint256", "name": "priceAfter", "type": "uint256"},
      {"internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// OKB Token ABI
export const OKB_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
