import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { authAPI } from '@/services/api';
import { toast, toastMessages } from '@/components/ui/toast-notification';

// 全局状态管理，防止重复调用
let globalAuthState = {
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
  hasAttemptedAutoLogin: false,
  currentAddress: null as string | null,
  autoLoginPromise: null as Promise<void> | null
};

const authStateListeners = new Set<() => void>();

const notifyAuthStateChange = () => {
  authStateListeners.forEach(listener => listener());
};

const updateGlobalAuthState = (updates: Partial<typeof globalAuthState>) => {
  globalAuthState = { ...globalAuthState, ...updates };
  notifyAuthStateChange();
};

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(globalAuthState.user);
  const [isLoading, setIsLoading] = useState(globalAuthState.isLoading);
  const [isAuthenticated, setIsAuthenticated] = useState(globalAuthState.isAuthenticated);
  const [isClient, setIsClient] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(globalAuthState.hasAttemptedAutoLogin);

  const { signMessageAsync } = useSignMessage();

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 监听全局认证状态变化
  useEffect(() => {
    const updateLocalState = () => {
      setUser(globalAuthState.user);
      setIsLoading(globalAuthState.isLoading);
      setIsAuthenticated(globalAuthState.isAuthenticated);
      setHasAttemptedAutoLogin(globalAuthState.hasAttemptedAutoLogin);
    };
    
    authStateListeners.add(updateLocalState);
    
    return () => {
      authStateListeners.delete(updateLocalState);
    };
  }, []);

  // 自动登录/注册用户（全局单例）
  const autoLoginUser = async (userAddress: string) => {
    // 如果已经在处理相同地址的自动登录，直接返回现有的 Promise
    if (globalAuthState.autoLoginPromise && globalAuthState.currentAddress === userAddress) {
      // Auto login already in progress
      return globalAuthState.autoLoginPromise;
    }
    
    // 如果已经为这个地址尝试过自动登录，不再重复
    if (globalAuthState.hasAttemptedAutoLogin && globalAuthState.currentAddress === userAddress) {

      return;
    }
    
    // 如果已经认证成功，不需要重复登录
    if (globalAuthState.isAuthenticated && globalAuthState.currentAddress === userAddress) {

      return;
    }

    updateGlobalAuthState({ 
      isLoading: true, 
      currentAddress: userAddress,
      hasAttemptedAutoLogin: true
    });
    
    const loginPromise = (async () => {
      try {
          const response = await authAPI.autoLogin(userAddress);
          if (response.user) {
            updateGlobalAuthState({
              user: response.user,
              isAuthenticated: true,
              isLoading: false
            });

            return;
          }
        } catch (error) {

        } finally {
        updateGlobalAuthState({ 
          isLoading: false,
          autoLoginPromise: null
        });
      }
    })();
    
    updateGlobalAuthState({ autoLoginPromise: loginPromise });
    return loginPromise;
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

      // 使用login API创建用户
      const response = await authAPI.login({
        address: userAddress,
        signature,
        nonce
      });

      if (response.access) {
        // 登录成功后获取用户信息
        try {
          const autoLoginResponse = await authAPI.autoLogin(userAddress);
          updateGlobalAuthState({
            user: autoLoginResponse.user,
            isAuthenticated: true,
            hasAttemptedAutoLogin: true,
            currentAddress: userAddress
          });
          toast.success('Welcome to BoBoom! Your account has been created.');

        } catch (autoLoginError) {

          // 即使获取用户信息失败，也标记为已认证
          updateGlobalAuthState({
            user: null,
            isAuthenticated: true,
            hasAttemptedAutoLogin: true,
            currentAddress: userAddress
          });
        }
      }
    } catch (error) {

      toast.error('Failed to create account. Please try again.');
    }
  };

  // 监听钱包连接状态
  useEffect(() => {
    if (!isClient) return; // 只在客户端运行
    
    if (isConnected && address) {
      // 如果地址变化了，重置状态
      if (globalAuthState.currentAddress !== address) {

        updateGlobalAuthState({
          user: null,
          isAuthenticated: false,
          hasAttemptedAutoLogin: false,
          currentAddress: address,
          autoLoginPromise: null
        });
        // 地址变化时才进行自动登录
        autoLoginUser(address);
      } else if (!globalAuthState.hasAttemptedAutoLogin && !globalAuthState.autoLoginPromise) {
        // 只有在未尝试过自动登录且没有正在进行的登录请求时才调用

        autoLoginUser(address);
      }
    } else if (!isConnected) {
      // 只有在状态确实需要重置时才更新
      if (globalAuthState.currentAddress !== null || globalAuthState.isAuthenticated) {

        updateGlobalAuthState({
          user: null,
          isAuthenticated: false,
          hasAttemptedAutoLogin: false,
          currentAddress: null,
          autoLoginPromise: null
        });
      }
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
        // 登录成功，保存token并更新状态
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        
        // 获取用户信息
        const userResponse = await authAPI.autoLogin(address);
        if (userResponse.user) {
          updateGlobalAuthState({
            user: userResponse.user,
            isAuthenticated: true,
            hasAttemptedAutoLogin: true,
            currentAddress: address
          });
        }
        toast.success('Login successful!');
      }
    } catch (error) {

      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = () => {
    updateGlobalAuthState({
      user: null,
      isAuthenticated: false,
      hasAttemptedAutoLogin: false,
      currentAddress: null,
      autoLoginPromise: null
    });
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
