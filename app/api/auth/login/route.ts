import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;
  
  // 这里应该是实际的身份验证逻辑
  // 例如：检查数据库中的用户凭据
  if (username === 'admin' && password === '1') {
    // 登录成功
    return NextResponse.json({ 
      success: true, 
      user: { id: 1, username, name: '管理员' } 
    });
  }
  
  // 登录失败
  return NextResponse.json(
    { success: false, message: '用户名或密码错误' },
    { status: 401 }
  );
}