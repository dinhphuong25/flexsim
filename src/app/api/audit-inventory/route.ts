import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { performInventoryAudit } from '@/lib/inventory-audit';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'TRIGGER_INVENTORY_AUDIT')) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Không có quyền thực hiện kiểm định hết tồn.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { runId, isMaterialReleaseComplete = true, isTransportCleared = true, hasUnreleasedMandatoryFeed = false } = body;

    const run = await repository.getRunById(runId);
    if (!run) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Không tìm thấy lượt chạy.' }, { status: 404 });
    }

    const modelObjects = await repository.getAllModelObjects();
    const objMetrics = await repository.getObjectMetricsByRunId(runId);

    const auditInputs = modelObjects.map((mo) => {
      const metric = objMetrics.find((m) => m.modelObjectId === mo.id || m.flexsimName === mo.flexsimName);
      return {
        flexsimName: mo.flexsimName,
        objectType: mo.objectType,
        branch: mo.branch,
        isMandatoryScope: mo.isInventoryAudited,
        currentContent: metric?.currentContent ?? null,
        sampleTimeSeconds: metric?.simulationTimeSeconds,
      };
    });

    const auditResult = performInventoryAudit({
      objects: auditInputs,
      runEndTimeSeconds: run.runTimeSeconds,
      isMaterialReleaseComplete,
      isTransportCleared,
      hasUnreleasedMandatoryFeed,
    });

    const savedAudit = await repository.saveInventoryAudit({
      runId,
      auditTimestamp: new Date().toISOString(),
      simulationTimeSeconds: run.runTimeSeconds,
      conclusion: auditResult.conclusion,
      totalScopeItems: auditResult.totalScopeObjects,
      totalRemainingWip: auditResult.totalRemainingFlowItems,
      isMaterialReleaseComplete,
      isTransportCleared,
      inspectedScopeSummary: auditResult.conclusionDescription,
      notes: `Thực hiện thủ công bởi ${user.fullName} (${user.role})`,
      auditedBy: user.id,
      items: auditResult.itemsWithWip.map((item, idx) => ({
        id: `ai_${runId}_${idx}`,
        objectName: item.flexsimName,
        objectType: item.objectType,
        currentContent: item.content,
        isAudited: true,
        status: 'HAS_WIP',
      })),
    });

    await repository.logAction(
      'INVENTORY_AUDIT_MANUAL',
      'InventoryAudit',
      savedAudit.id,
      { runId, conclusion: auditResult.conclusion, remainingWip: auditResult.totalRemainingFlowItems },
      user.id
    );

    return NextResponse.json({
      status: 'SUCCESS',
      audit: savedAudit,
      details: auditResult,
    });
  } catch (error) {
    console.error('Lỗi khi thực hiện kiểm định hết tồn:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
