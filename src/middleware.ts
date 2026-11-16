import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_SECRET = process.env.AUTH_SECRET || 'viet-thanh-garment-group2-super-secret-jwt-key-2026-simulation';
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
const COOKIE_NAME = 'vtf_session_token';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return Boolean(payload && payload.sub && payload.role);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Cho phép tài nguyên tĩnh, font, ảnh, favicon, manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1.5. Cho phép bot và crawler mạng xã hội (Zalo, Facebook, Twitter, Telegram, Discord...) lấy Open Graph metadata
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isSocialCrawler = /facebookexternalhit|zalobot|twitterbot|telegrambot|slackbot|whatsapp|linkedinbot|discordbot|googlebot|bingbot|applebot/i.test(userAgent);
  if (isSocialCrawler) {
    return NextResponse.next();
  }

  // 2. Cho phép API auth và API tích hợp FlexSim
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/integrations/flexsim')) {
    return NextResponse.next();
  }

  const authenticated = await isAuthenticated(request);

  // 3. Nếu người dùng đang ở trang /login
  if (pathname === '/login') {
    if (authenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 4. Nếu chưa đăng nhập mà truy cập trang chủ hoặc phân hệ khác -> chuyển về /login
  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn ngoại trừ:
     * - _next/static (tệp tĩnh)
     * - _next/image (tệp tối ưu ảnh)
     * - favicon.ico, icon.svg, manifest.json
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|manifest.json).*)',
  ],
};
