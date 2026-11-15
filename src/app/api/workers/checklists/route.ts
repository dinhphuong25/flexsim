import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { canMutateData } from '@/lib/rbac';
import { ChecklistStatus } from '@/lib/workforce';
import { z } from 'zod';

const UpdateChecklistSchema = z.object({
  id: z.string(),
  status: z.enum(['CHUA_BAT_DAU', 'DANG_THUC_HIEN', 'HOAN_TAT', 'CO_VAN_DE']),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();

  if (user && !canMutateData(user.role)) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản Viewer không được cập nhật trạng thái checklist.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = UpdateChecklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dữ liệu checklist không hợp lệ.' },
        { status: 400 }
      );
    }

    const { id, status, notes } = parsed.data;
    const updated = await repository.updateChecklistStatus(
      id,
      status as ChecklistStatus,
      notes,
      user?.fullName || 'Người kiểm tra'
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Không tìm thấy mục checklist.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: err.message || 'Lỗi khi cập nhật checklist.' },
      { status: 500 }
    );
  }
}
