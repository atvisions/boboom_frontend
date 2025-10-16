// API配置
export const API_CONFIG = {
  // 后端基础URL
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
  // BASE_URL: "",
  
  // API超时时间
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  
  // 图片上传配置
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '5242880'), // 5MB
    ALLOWED_TYPES: (process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES || 'png,jpg,jpeg,gif,webp').split(','),
  },
  
  // 端点配置
  ENDPOINTS: {
    // 代币相关
    TOKENS: {
      UPLOAD_IMAGE: '/api/tokens/upload-image/',
      UPLOAD_INFO: '/api/tokens/upload-info/',
      LIST: '/api/tokens/',
      DETAIL: (address: string) => `/api/tokens/${address}/`,
      METRICS: (address: string) => `/api/tokens/${address}/metrics/`,
      TRANSACTIONS: (address: string) => `/api/tokens/${address}/transactions`,
      HOLDERS: (address: string) => `/api/tokens/${address}/holders`,
      MINI_CHART: (address: string) => `/api/tokens/tokens/${address}/mini-chart/`,
    },
    
    // 用户相关
    USERS: {
      LOGIN: '/api/users/login/',
      AUTO_LOGIN: '/api/users/auto-login/',
      PROFILE: (address: string) => `/api/users/${address}/`,
      FAVORITES: (address: string, tokenAddress: string) => 
        `/api/users/${address}/favorites/${tokenAddress}/`,
    },
    
    // 交易相关
    TRANSACTIONS: {
      LIST: '/api/transactions/',
    },
    
    // 分析相关 - 新的事件驱动K线系统
    ANALYTICS: {
      PRICE_HISTORY: '/api/analytics/price-history/',
      INTERVALS: '/api/analytics/intervals/',
      SUMMARY: (address: string) => `/api/analytics/summary/${address}/`,
      UPDATE_TRIGGER: '/api/analytics/trigger-update/',
    },
  },
} as const;

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 获取代币相关API URL
export const getTokenApiUrl = {
  uploadImage: () => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.UPLOAD_IMAGE),
  uploadInfo: () => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.UPLOAD_INFO),
  list: () => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.LIST),
  detail: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.DETAIL(address)),
  metrics: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.METRICS(address)),
  transactions: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.TRANSACTIONS(address)),
  miniChart: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.MINI_CHART(address)),
  holders: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.TOKENS.HOLDERS(address)),
};

// 获取用户相关API URL
export const getUserApiUrl = {
  login: () => buildApiUrl(API_CONFIG.ENDPOINTS.USERS.LOGIN),
  autoLogin: () => buildApiUrl(API_CONFIG.ENDPOINTS.USERS.AUTO_LOGIN),
  profile: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.USERS.PROFILE(address)),
  favorites: (address: string, tokenAddress: string) =>
    buildApiUrl(API_CONFIG.ENDPOINTS.USERS.FAVORITES(address, tokenAddress)),
};

// 获取分析相关API URL
export const getAnalyticsApiUrl = {
  priceHistory: () => buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.PRICE_HISTORY),
  intervals: () => buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.INTERVALS),
  summary: (address: string) => buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.SUMMARY(address)),
  updateTrigger: () => buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.UPDATE_TRIGGER),
};
