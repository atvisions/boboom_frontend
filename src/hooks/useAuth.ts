import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

// 使用正确的环境变量，并提供默认值
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const JWT_KEY = 'jwt_token';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { signMessageAsync } = useSignMessage();

  // Effect to check authentication status on load or account change
  useEffect(() => {
    const token = localStorage.getItem(JWT_KEY);
    if (token) {
      // TODO: Add token validation against the connected address
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [isConnected, address]);

  const logout = () => {
    localStorage.removeItem(JWT_KEY);
    setIsAuthenticated(false);
    console.log('Logged out');
  };

  // Effect to handle account switching
  useEffect(() => {
        const handleAccountsChanged = () => {
      console.log('Wallet account changed, logging out.');
      logout();
    };

    if (window.ethereum) {
      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const login = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected or address not available.');
    }

    try {
      // 1. Get nonce from backend
      const nonceUrl = `${API_URL}/api/users/get-nonce/${address}/`;
      const nonceRes = await fetch(nonceUrl);
      if (!nonceRes.ok) throw new Error(`Failed to get nonce: ${nonceRes.status}`);
      const { nonce } = await nonceRes.json();

      // 2. Sign the nonce
      const messageToSign = `Please sign this message to log in: ${nonce}`;
      const signature = await signMessageAsync({ message: messageToSign });

      // 3. Send signature to backend to log in
      const loginUrl = `${API_URL}/api/users/login/`;
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce }),
      });

      if (!loginRes.ok) {
        const errorText = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} - ${errorText}`);
      }

      const { token } = await loginRes.json();

      // 4. Store JWT
      localStorage.setItem(JWT_KEY, token);
      setIsAuthenticated(true);
      console.log('Login successful');

    } catch (error) {
      console.error('Authentication error:', error);
      logout(); // Ensure user is logged out on failure
      throw error; // Re-throw the error to be caught by the caller UI
    }
  };

  return { isAuthenticated, login, logout };
}

