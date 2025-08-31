import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import BondingCurveV3ABI from '@/contracts/abis/BondingCurveV3_Final.json';
import { getContractAddresses } from '@/contracts/config';

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress, network = 'sepolia' } = await request.json();

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const addresses = getContractAddresses(network);
    
    // 创建provider
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id');
    
    // 创建合约实例
    const contract = new ethers.Contract(
      addresses.BONDING_CURVE_V3,
      BondingCurveV3ABI.abi,
      provider
    );

    // 调用合约的getCurrentPrice函数
    const result = await contract.getCurrentPrice(tokenAddress);

    // 格式化结果
    const price = parseFloat(ethers.formatEther(result));

    return NextResponse.json({
      price,
    });

  } catch (error) {
    console.error('Error getting current price:', error);
    return NextResponse.json(
      { error: 'Failed to get current price' },
      { status: 500 }
    );
  }
}
