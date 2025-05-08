/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 swcMinify 选项
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
