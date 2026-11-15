import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { canMutateData } from '@/lib/rbac';
import { SkillLevel } from '@/lib/workforce';
import { z } from 'zod';

const UpdateSkillSchema = z.object({
  positionCode: z.string(),
  stageCode: z.string(),
  skillLevel: z.enum(['CHUA_DANH_GIA', 'DANG_DAO_TAO', 'THUC_HIEN_DUOC', 'CO_THE_HO_TRO']),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();

  if (user && !canMutateData(user.role)) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản Viewer không được cập nhật ma trận kỹ năng.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = UpdateSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dữ liệu kỹ năng không hợp lệ.' },
        { status: 400 }
      );
    }

    const { positionCode, stageCode, skillLevel } = parsed.data;
    await repository.updateSkill(
      positionCode,
      stageCode,
      skillLevel as SkillLevel,
      user?.fullName || 'Quản lý kỹ năng'
    );

    const updatedMatrix = await repository.getSkillMatrix();
    return NextResponse.json({ success: true, skillMatrix: updatedMatrix });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: err.message || 'Lỗi khi cập nhật kỹ năng.' },
      { status: 500 }
    );
  }
}
