import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { canMutateData } from '@/lib/rbac';
import { z } from 'zod';

const UpdateAssignmentSchema = z.object({
  positionCode: z.string(),
  displayName: z.string().optional(),
  assignedStation: z.string().optional(),
  primaryStation: z.string().optional(),
  supportStation: z.string().optional(),
  transferRule: z.string().optional(),
  isAssigned: z.boolean().optional(),
  operationalStatus: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();

  // Kiểm tra quyền: Nếu đã đăng nhập và là VIEWER thì chặn 403
  if (user && !canMutateData(user.role)) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản Viewer chỉ có quyền xem, không được chỉnh sửa phân công.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = UpdateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dữ liệu phân công không hợp lệ.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { positionCode, ...updates } = parsed.data;
    const updated = await repository.updateWorkforcePosition(
      positionCode,
      updates,
      user?.fullName || 'Quản lý chuyền'
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Không tìm thấy vị trí ${positionCode}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, position: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: err.message || 'Lỗi khi cập nhật phân công.' },
      { status: 500 }
    );
  }
}
