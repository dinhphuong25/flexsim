import React from 'react';
import { repository } from '@/lib/repository';
import { InteractiveLineDiagram } from '@/components/line-diagram/interactive-diagram';
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
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Network className="h-6 w-6 text-teal-600" />
          Sơ Đồ Chuyền May Tương Tác (Line Routing Flow)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Biểu diễn luồng may 4 nhánh độc lập (Thân trước, Thân sau, Cạp lưng, Paget), 3 điểm ráp Combiner (R01, R02, R03) và trạm song song.
          Nhấp vào bất kỳ đối tượng nào để xem chi tiết thống kê kỹ thuật.
        </p>
      </div>

      <InteractiveLineDiagram nodes={diagramNodes} />
    </div>
  );
}
