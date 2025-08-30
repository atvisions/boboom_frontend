import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { authAPI } from '@/services/api';
import { toast, toastMessages } from '@/components/ui/toast-notification';

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { signMessageAsync } = useSignMessage();

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 自动登录/注册用户
  const autoLoginUser = async (userAddress: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.autoLogin(userAddress);
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('User auto login successful:', response.message);
      }
    } catch (error) {
      console.error('Auto login failed:', error);
      // 如果自动登录失败，尝试创建新用户
      await createNewUser(userAddress);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新用户（带签名验证）
  const createNewUser = async (userAddress: string) => {
    try {
      // 获取nonce
      const nonceResponse = await authAPI.getNonce(userAddress);
      const nonce = nonceResponse.nonce;

      // 构建签名消息
      const timestamp = Date.now();
      const message = `Welcome to BoBoom!\n\nSign this message to authenticate your wallet.\n\nWallet: ${userAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      // 请求用户签名
      const signature = await signMessageAsync({ 
        account: address as `0x${string}`,
        message 
      });

      // 创建用户
      const response = await authAPI.createUser({
        address: userAddress,
        signature,
        message,
        timestamp
      });

      if (response) {
        setUser(response);
        setIsAuthenticated(true);
        toast.success('Welcome to BoBoom! Your account has been created.');
        console.log('New user created successfully');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create account. Please try again.');
    }
  };

  // 监听钱包连接状态
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    if (isConnected && address) {
      console.log('Wallet connected:', address);
      autoLoginUser(address);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isConnected, address, isClient]);

  // 手动登录（带签名验证）
  const loginWithSignature = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // 获取nonce
      const nonceResponse = await authAPI.getNonce(address);
      const nonce = nonceResponse.nonce;

      // 构建签名消息
      const message = `Please sign this message to log in: ${nonce}`;

      // 请求用户签名
      const signature = await signMessageAsync({ 
        account: address as `0x${string}`,
        message 
      });

      // 验证签名并登录
      const response = await authAPI.login({
        address,
        signature,
        nonce
      });

      if (response.access) {
        // 获取用户信息
        await autoLoginUser(address);
        toast.success('Login successful!');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isClient,
    address,
    isConnected,
    loginWithSignature,
    logout,
  };
}
