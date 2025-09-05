/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
  // 允许外部 API 调用
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    return [
      // 代理 API 调用到后端服务器
      {
        source: '/api/tokens/',
        destination: `${backendUrl}/api/tokens/`,
      },
      {
        source: '/api/tokens/:path*/',
        destination: `${backendUrl}/api/tokens/:path*/`,
      },
      {
        source: '/api/tokens/:path*',
        destination: `${backendUrl}/api/tokens/:path*/`,
      },
      // 用户收藏相关路径 - 更具体的规则放在前面
      {
        source: '/api/users/:address/favorites/toggle/',
        destination: `${backendUrl}/api/users/:address/favorites/toggle/`,
      },
      {
        source: '/api/users/:address/favorites/toggle',
        destination: `${backendUrl}/api/users/:address/favorites/toggle/`,
      },
      {
        source: '/api/users/:address/favorites/:token_address/',
        destination: `${backendUrl}/api/users/:address/favorites/:token_address/`,
      },
      {
        source: '/api/users/:address/favorites/:token_address',
        destination: `${backendUrl}/api/users/:address/favorites/:token_address/`,
      },
      {
        source: '/api/users/:path*/',
        destination: `${backendUrl}/api/users/:path*/`,
      },
      {
        source: '/api/users/:path*',
        destination: `${backendUrl}/api/users/:path*/`,
      },
      {
        source: '/api/transactions/:path*/',
        destination: `${backendUrl}/api/transactions/:path*/`,
      },
      {
        source: '/api/transactions/:path*',
        destination: `${backendUrl}/api/transactions/:path*/`,
      },
      {
        source: '/api/analytics/:path*/',
        destination: `${backendUrl}/api/analytics/:path*/`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${backendUrl}/api/analytics/:path*/`,
      },
      // 代理媒体文件到后端服务器
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*/`,
      },
    ];
  },
};

module.exports = nextConfig;
