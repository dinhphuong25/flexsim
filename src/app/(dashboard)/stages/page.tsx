import React from 'react';
import { repository } from '@/lib/repository';
import { StageManagementTable } from '@/components/stages/stage-management-table';
import { Layers } from 'lucide-react';

export default async function StagesPage() {
  const stages = await repository.getAllStages();
  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  let stageMetrics: Awaited<ReturnType<typeof repository.getStageMetricsByRunId>> = [];
  let objectMetrics: Awaited<ReturnType<typeof repository.getObjectMetricsByRunId>> = [];

  if (activeRun) {
    stageMetrics = await repository.getStageMetricsByRunId(activeRun.id);
    objectMetrics = await repository.getObjectMetricsByRunId(activeRun.id);
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="h-6 w-6 text-teal-600" />
          Quản Lý Công Đoạn & Tồn Bán Thành Phẩm (WIP)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi toàn bộ 27 công đoạn may, hàng chờ (Queue) và trạm song song. Dữ liệu chưa đo giữ nguyên giá trị rỗng (null), không tự ý gán 0.
        </p>
      </div>

      <StageManagementTable stages={stagesWithMetrics} />
    </div>
  );
}
