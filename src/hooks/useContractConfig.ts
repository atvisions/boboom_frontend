import { useState, useEffect, useCallback } from 'react';
import { 
  ContractAddresses, 
  PlatformConfig, 
  BackendConfigResponse,
  convertBackendConfigToContractAddresses,
  convertBackendConfigToPlatformConfig,
  getFallbackContractAddresses,
  FALLBACK_PLATFORM_CONFIG,
  validateContractAddresses
} from '@/contracts/config';

interface UseContractConfigReturn {
  contractAddresses: ContractAddresses | null;
  platformConfig: PlatformConfig | null;
  network: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isUsingFallback: boolean;
}

/**
 * 动态获取合约配置的Hook
 * 优先从后端API获取，失败时使用环境变量作为后备
 */
export function useContractConfig(): UseContractConfigReturn {
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${backendUrl}/api/tokens/config/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 添加超时
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BackendConfigResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Backend returned unsuccessful response');
      }

      // 转换后端配置为前端格式
      const addresses = convertBackendConfigToContractAddresses(data.data);
      const config = convertBackendConfigToPlatformConfig(data.data);

      // 验证地址有效性
      if (!validateContractAddresses(addresses)) {
        throw new Error('Invalid contract addresses received from backend');
      }

      setContractAddresses(addresses);
      setPlatformConfig(config);
      setNetwork(data.data.network);
      setIsUsingFallback(false);
      
      console.log('✅ Contract config loaded from backend:', {
        network: data.data.network,
        addresses,
        config
      });

    } catch (err) {
      console.warn('⚠️ Failed to load config from backend, using fallback:', err);
      
      // 使用后备配置
      const fallbackNetwork = process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia';
      const fallbackAddresses = getFallbackContractAddresses(fallbackNetwork as 'sepolia' | 'xlayer');
      
      setContractAddresses(fallbackAddresses);
      setPlatformConfig(FALLBACK_PLATFORM_CONFIG);
      setNetwork(fallbackNetwork);
      setIsUsingFallback(true);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      console.log('📦 Using fallback config:', {
        network: fallbackNetwork,
        addresses: fallbackAddresses,
        config: FALLBACK_PLATFORM_CONFIG
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    contractAddresses,
    platformConfig,
    network,
    isLoading,
    error,
    refetch: fetchConfig,
    isUsingFallback,
  };
}

/**
 * 获取特定网络的合约地址（同步版本，用于向后兼容）
 * @deprecated 建议使用 useContractConfig Hook
 */
export function getContractAddresses(network: 'sepolia' | 'xlayer' = 'sepolia'): ContractAddresses {
  console.warn('getContractAddresses is deprecated, use useContractConfig hook instead');
  return getFallbackContractAddresses(network);
}

/**
 * 简化版Hook，只返回合约地址
 */
export function useContractAddresses(): {
  addresses: ContractAddresses | null;
  isLoading: boolean;
  error: string | null;
} {
  const { contractAddresses, isLoading, error } = useContractConfig();
  
  return {
    addresses: contractAddresses,
    isLoading,
    error,
  };
}

/**
 * 简化版Hook，只返回平台配置
 */
export function usePlatformConfig(): {
  config: PlatformConfig | null;
  isLoading: boolean;
  error: string | null;
} {
  const { platformConfig, isLoading, error } = useContractConfig();
  
  return {
    config: platformConfig,
    isLoading,
    error,
  };
}
