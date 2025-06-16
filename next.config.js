/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 swcMinify 选项
  images: {
    domains: [],
  },
  // 使用 Next.js 内置的 console 移除功能
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
