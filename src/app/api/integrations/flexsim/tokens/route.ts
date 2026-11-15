import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { generateIntegrationToken } from '@/lib/integration-security';
import { z } from 'zod';

const CreateTokenSchema = z.object({
  clientName: z.string().min(3).max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const clients = await repository.getAllClients();
  // Không bao giờ trả về tokenHash trong danh sách
  const safeClients = clients.map((c) => ({
    id: c.id,
    clientName: c.clientName,
    tokenPrefix: c.tokenPrefix,
    rateLimitPerMin: c.rateLimitPerMin,
    isActive: c.isActive,
    lastUsedAt: c.lastUsedAt,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ clients: safeClients });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'MANAGE_INTEGRATION_CLIENTS')) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Chỉ Quản trị viên (ADMIN) mới có quyền tạo token tích hợp máy-máy.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = CreateTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', details: parsed.error.format() }, { status: 400 });
    }

    const { rawToken, tokenHash, tokenPrefix } = generateIntegrationToken();
    const newClient = await repository.createIntegrationClient(parsed.data.clientName, tokenHash, tokenPrefix);

    await repository.logAction(
      'CREATE_INTEGRATION_TOKEN',
      'IntegrationClient',
      newClient.id,
      { clientName: newClient.clientName, tokenPrefix },
      user.id
    );

    // Lưu ý Phần 12: Chỉ hiển thị rawToken duy nhất lúc tạo!
    return NextResponse.json({
      status: 'SUCCESS',
      client: {
        id: newClient.id,
        clientName: newClient.clientName,
        tokenPrefix: newClient.tokenPrefix,
        rawToken, // Chỉ hiển thị một lần duy nhất lúc tạo
        rateLimitPerMin: newClient.rateLimitPerMin,
        createdAt: newClient.createdAt,
      },
      warning: 'Lưu ý: Khóa bí mật (rawToken) chỉ hiển thị một lần duy nhất tại đây. Hãy sao chép và lưu an toàn vào cấu hình máy chạy FlexSim.',
    });
  } catch (error) {
    console.error('Lỗi khi tạo token tích hợp:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
