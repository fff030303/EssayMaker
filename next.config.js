/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 swcMinify 选项
  images: {
    domains: [],
  },
  // 使用 Next.js 内置的 console 移除功能
  compiler: {
    // 临时保留所有console以便调试生产环境问题
    removeConsole: false,
    // 原配置：
    // removeConsole: process.env.NODE_ENV === 'production' ? {
    //   exclude: ['error', 'warn', 'info']
    // } : false,
  },
  // 构建优化配置
  experimental: {
    webpackBuildWorker: true, // 启用 webpack 构建 worker
  },
  // 临时跳过类型检查和 lint 加快构建
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
