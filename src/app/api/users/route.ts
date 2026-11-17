import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string().min(2),
  fullName: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']).default('VIEWER'),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'MANAGE_USERS')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const users = await repository.getAllUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser.role, 'MANAGE_USERS')) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Chỉ Admin mới có quyền tạo người dùng.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', details: parsed.error.format() }, { status: 400 });
    }

    const { username, fullName, password, role } = parsed.data;
    const cleanUsername = username.trim().toLowerCase();
    const existing = await repository.getUserByIdentifier(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'USERNAME_EXISTS', message: 'Tên đăng nhập này đã được sử dụng.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newUser = {
      id,
      username: cleanUsername,
      email: `${cleanUsername}@vietthanh.vn`,
      passwordHash,
      fullName,
      role,
      isActive: true,
      createdAt,
    };

    // Store in memory & log
    const { store } = await import('@/lib/data-store');
    store.users.set(id, newUser);

    await repository.logAction('CREATE_USER', 'User', id, { username: cleanUsername, role }, currentUser.id);

    return NextResponse.json({
      status: 'SUCCESS',
      user: { id, username: cleanUsername, fullName, role, isActive: true, createdAt },
    });
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
