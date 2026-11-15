import React from 'react';
import { repository } from '@/lib/repository';
import { LineDiagramTabs } from '@/components/line-diagram/line-diagram-tabs';
import { CombinerSyncTracker } from '@/components/line-diagram/combiner-sync-tracker';
import { Network } from 'lucide-react';

export default async function LineDiagramPage() {
  const stages = await repository.getAllStages();
  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  const stageMetrics = activeRun ? await repository.getStageMetricsByRunId(activeRun.id) : [];

  const diagramNodes = stages.map((stg) => {
    const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
    const hasData = metric !== undefined && (metric.currentWip !== null || metric.avgWip !== null);

    return {
      id: stg.id,
      code: stg.stageCode,
      name: stg.name,
      branch: stg.branch,
      type: (stg.stageCode.startsWith('R')
        ? 'COMBINER'
        : stg.stageCode === 'SINK_TP'
        ? 'SINK'
        : 'PROCESSOR') as 'SOURCE' | 'PROCESSOR' | 'COMBINER' | 'SINK' | 'SUPPORT',
      parallel: stg.parallelStationCount === 2,
      hasSupport: stg.parallelStationCount > 1 || stg.stageCode === 'CD05',
      wip: metric?.currentWip ?? null,
      avgWip: metric?.avgWip ?? null,
      staytime: metric?.avgStaytime ?? null,
      processingPct: metric?.processingPct ?? null,
      output: metric?.outputCount ?? null,
      measured: hasData,
    };
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Network className="h-5 w-5 text-teal-600" />
          Sơ Đồ Chuyền May & Bố Trí Không Gian FlexSim 2027
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tích hợp trực quan giữa giao diện mô hình 3D thực tế của Autodesk FlexSim và sơ đồ khối luồng sản xuất 4 nhánh cấp liệu, 3 điểm ráp Combiner và 4 công nhân điều chuyển.
        </p>
      </div>

      {/* Feature 2: Bộ Theo Dõi Đồng Bộ 3 Điểm Ráp Combiners */}
      <CombinerSyncTracker />

      {/* Sơ đồ tương tác và bản đồ 3D */}
      <LineDiagramTabs nodes={diagramNodes} />
    </div>
  );
}
