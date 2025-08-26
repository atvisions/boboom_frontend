/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 允许外部 API 调用
  async rewrites() {
    return [
      // 如果需要代理 API 调用可以在这里配置
    ];
  },
};

module.exports = nextConfig;
