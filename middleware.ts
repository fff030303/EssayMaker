import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取请求的路径
  const url = request.nextUrl.clone()
  
  // 只对根路径进行处理
  if (url.pathname === '/') {
    // 将路径修改为 /essaymaker
    url.pathname = '/essaymaker'
    return NextResponse.redirect(url)
  }
}

// 配置匹配的路径
export const config = {
  matcher: '/',
} 