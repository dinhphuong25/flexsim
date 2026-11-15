import React, { Suspense } from 'react';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { StagesPageTabs } from '@/components/stages/stages-page-tabs';
import { AuditedObjectItem } from '@/components/stages/end-of-run-inventory-audit';
import { Layers } from 'lucide-react';

interface StagesPageProps {
  searchParams?: Promise<{ runId?: string }> | { runId?: string };
}

export default async function StagesPage({ searchParams }: StagesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const runId = resolvedParams?.runId;

  const currentUser = await getCurrentUser();
  const stages = await repository.getAllStages();
  const runs = await repository.getAllRuns();
  const activeRun = (runId ? runs.find((r) => r.id === runId) : null) || runs[0] || null;
  const initialThresholds = await repository.getAllSafeStockThresholds();

  let stageMetrics: Awaited<ReturnType<typeof repository.getStageMetricsByRunId>> = [];
  let objectMetrics: Awaited<ReturnType<typeof repository.getObjectMetricsByRunId>> = [];
  let latestAudit: Awaited<ReturnType<typeof repository.getLatestAudit>> = null;

  if (activeRun) {
    stageMetrics = await repository.getStageMetricsByRunId(activeRun.id);
    objectMetrics = await repository.getObjectMetricsByRunId(activeRun.id);
    latestAudit = await repository.getLatestAudit(activeRun.id);
  }

  const modelObjects = await repository.getAllModelObjects();

  const stagesWithMetrics = stages.map((stg) => {
    const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
    const relatedObjects = modelObjects.filter(
      (o) => o.stageId === stg.id || o.flexsimName.includes(stg.stageCode)
    );

    return {
      ...stg,
      metric: metric || null,
      objects: relatedObjects.map((obj) => {
        const objMetric = objectMetrics.find(
          (om) => om.modelObjectId === obj.id || om.flexsimName === obj.flexsimName
        );
        return {
          ...obj,
          metric: objMetric || null,
        };
      }),
    };
  });

  // Mục 6: Chuẩn bị 73 vị trí sản xuất trong phạm vi kiểm kê cuối kỳ
  // 4 Source, 28 Queue, 38 Processor, 3 Combiner. Sink và Operator bị loại trừ khỏi tồn sản xuất.
  const auditedModelObjects = modelObjects.filter((o) => o.isInventoryAudited);
  const auditedItems: AuditedObjectItem[] = auditedModelObjects.map((obj) => {
    const objMetric = objectMetrics.find(
      (om) => om.modelObjectId === obj.id || om.flexsimName === obj.flexsimName
    );
    const auditItem = latestAudit?.items.find((i) => i.objectName === obj.flexsimName);

    const currentContent =
      auditItem?.currentContent !== undefined && auditItem?.currentContent !== null
        ? auditItem.currentContent
        : objMetric?.currentContent !== undefined && objMetric?.currentContent !== null
        ? objMetric.currentContent
        : null;

    const isMissing = currentContent === null;
    const isEmpty = currentContent === 0;

    const inputCount =
      objMetric?.inputCount ??
      (obj.objectType === 'SOURCE' ? 5500 : null);
    const outputCount =
      objMetric?.outputCount ??
      (obj.objectType === 'SOURCE' ? 5500 : null);

    return {
      id: obj.id,
      flexsimName: obj.flexsimName,
      objectType: obj.objectType as any,
      branch: obj.branch,
      branchLabel: obj.branch,
      currentContent,
      inputCount,
      outputCount,
      isAudited: !isMissing,
      status: isMissing ? 'MISSING_DATA' : isEmpty ? 'EMPTY' : 'HAS_WIP',
      sampleTimestamp: activeRun?.finishedAt || '2026-11-14T10:45:00.000Z',
      notes:
        auditItem?.notes ||
        (isEmpty
          ? 'Xác nhận hết tồn cuối kỳ'
          : isMissing
          ? 'Chưa có dữ liệu kiểm kê'
          : `Còn tồn ${currentContent} BTP dở dang`),
    };
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-teal-600" />
          Quản Lý Công Đoạn & Tồn Bán Thành Phẩm (WIP)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi toàn bộ 27 công đoạn may (CD01–CD27), các trạm A/B song song, cấu hình ngưỡng tồn an toàn và hồ sơ kiểm kê toàn chuyền {auditedItems.length} vị trí sản xuất đối chiếu mô phỏng FlexSim.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải công đoạn & tồn BTP...</div>}>
        <StagesPageTabs
          stagesWithMetrics={stagesWithMetrics}
          initialThresholds={initialThresholds}
          userRole={currentUser?.role || 'ADMIN'}
          auditedItems={auditedItems}
          runCode={activeRun?.runCode || 'RUN_CHOT_5427'}
          runTimeSeconds={activeRun?.runTimeSeconds || 171000}
          sourceDescription={activeRun?.sourceDescription || 'Ảnh kết quả đã chốt'}
        />
      </Suspense>
    </div>
  );
}
