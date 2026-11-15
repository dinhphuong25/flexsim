import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { verifyPassword, createSessionToken, getSessionCookieOptions } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Email hoặc mật khẩu không đúng định dạng.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await repository.getUserByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
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

    await repository.logAction('USER_LOGIN', 'User', user.id, { email: user.email }, user.id);

    return response;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Không thể xử lý đăng nhập lúc này.' },
      { status: 500 }
    );
  }
}
