import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    console.log('Fetching user info for address:', address);
    console.log('Backend URL:', `${backendUrl}/api/users/${address}/`);
    
    const response = await fetch(`${backendUrl}/api/users/${address}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User data:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
