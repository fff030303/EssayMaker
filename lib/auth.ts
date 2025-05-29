/**
 * 认证相关工具函数
 */

export function getCasAuthUrl(): string {
  // 返回一个默认的认证URL，可以根据实际需求修改
  return "/api/auth/login";
}

export function isAuthenticated(): boolean {
  // 简单的认证检查，可以根据实际需求修改
  return true;
} 