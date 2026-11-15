import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
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

    const { email, fullName, password, role } = parsed.data;
    const existing = await repository.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'Email này đã được sử dụng.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}`;
    const newUser = {
      id,
      email,
      passwordHash,
      fullName,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Store in memory & log
    const { store } = await import('@/lib/data-store');
    store.users.set(id, newUser);

    await repository.logAction('CREATE_USER', 'User', id, { email, role }, currentUser.id);

    return NextResponse.json({
      status: 'SUCCESS',
      user: { id, email, fullName, role, isActive: true },
    });
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
