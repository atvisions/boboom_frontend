import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import BondingCurveV1ABI from '@/contracts/abis/BondingCurveV1.json';
import { getContractAddresses } from '@/contracts/config-simple';

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress, okbAmount, network = 'sepolia' } = await request.json();

    if (!tokenAddress || !okbAmount) {
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
      BondingCurveV1ABI.abi,
      provider
    );

    // 调用合约的getQuoteBuy函数
    const result = await contract.getQuoteBuy(
      tokenAddress,
      ethers.parseEther(okbAmount.toString())
    );

    // 格式化结果
    const [tokensOut, priceAfter, fee] = result;

    return NextResponse.json({
      tokensOut: parseFloat(ethers.formatEther(tokensOut)),
      priceAfter: parseFloat(ethers.formatEther(priceAfter)),
      fee: parseFloat(ethers.formatEther(fee)),
    });

  } catch (error) {
    console.error('Error getting buy quote:', error);
    return NextResponse.json(
      { error: 'Failed to get buy quote' },
      { status: 500 }
    );
  }
}
