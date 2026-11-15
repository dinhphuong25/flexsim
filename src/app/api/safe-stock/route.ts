import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { canMutateData } from '@/lib/rbac';
import {
  validateSafeStockConfig,
  classifySafeStock,
  evaluateOverallStockCompliance,
  SafeStockThresholdConfig,
} from '@/lib/safe-stock';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetCode = searchParams.get('targetCode');

  const thresholds = await repository.getAllSafeStockThresholds();
  const auditLogs = targetCode
    ? await repository.getSafeStockAuditLogsByTarget(targetCode)
    : await repository.getAllSafeStockAuditLogs();

  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;
  const stageMetrics = activeRun ? await repository.getStageMetricsByRunId(activeRun.id) : [];

  // Đánh giá trạng thái cho các trạm
  const thresholdMap = new Map<string, SafeStockThresholdConfig>();
  for (const t of thresholds) {
    thresholdMap.set(t.targetCode, t);
  }

  const evaluations = stageMetrics.map((m) => {
    const config = thresholdMap.get(m.stageCode) || null;
    return classifySafeStock(m.currentWip, config, { isEndOfRun: true, targetCode: m.stageCode });
  });

  const overallCompliance = evaluateOverallStockCompliance(
    stageMetrics.map((m) => ({
      targetCode: m.stageCode,
      currentContent: m.currentWip,
      config: thresholdMap.get(m.stageCode) || null,
    })),
    activeRun?.finishedCount ?? null
  );

  return NextResponse.json({
    thresholds,
    auditLogs,
    evaluations,
    overallCompliance,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canMutateData(user.role)) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản của bạn không có quyền cập nhật cấu hình ngưỡng an toàn.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      targetCode,
      safeStockMax,
      minStock,
      criticalStock,
      consecutiveSecondsBeforeAlert,
      scope,
      targetType,
      basisNotes,
      changeReason,
    } = body;

    if (!targetCode) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Mã đối tượng/công đoạn là bắt buộc.' }, { status: 400 });
    }

    const validation = validateSafeStockConfig({
      safeStockMax,
      minStock,
      criticalStock,
      consecutiveSecondsBeforeAlert,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: validation.error }, { status: 400 });
    }

    const res = await repository.upsertSafeStockThreshold(
      targetCode,
      {
        safeStockMax,
        minStock,
        criticalStock,
        consecutiveSecondsBeforeAlert,
        scope,
        targetType,
        basisNotes,
        changeReason,
      },
      user.email
    );

    if (!res.success) {
      return NextResponse.json({ error: 'UPDATE_FAILED', message: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, config: res.config });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err?.message || 'Lỗi xử lý yêu cầu' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Chỉ Quản trị viên (Admin) mới có quyền xóa cấu hình ngưỡng.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetCode = searchParams.get('targetCode');
  const reason = searchParams.get('reason') || 'Xóa cấu hình ngưỡng quản trị';

  if (!targetCode) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Mã đối tượng là bắt buộc.' }, { status: 400 });
  }

  const success = await repository.deleteSafeStockThreshold(targetCode, reason, user.email);
  return NextResponse.json({ success });
}
