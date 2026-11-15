import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ status: 'SUCCESS', message: 'Đã đăng xuất thành công.' });

  response.cookies.set(cookieOptions.name, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
