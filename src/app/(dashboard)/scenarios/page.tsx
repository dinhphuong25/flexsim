import React from 'react';
import { repository } from '@/lib/repository';
import { ScenarioListAndComparison } from '@/components/scenarios/scenario-list-and-comparison';
import { ScenarioAuditTrail } from '@/components/scenarios/scenario-audit-trail';
import { StageControlConfigCard } from '@/components/scenarios/stage-control-config-card';
import { GitCompare } from 'lucide-react';

export default async function ScenariosPage() {
  const scenarios = await repository.getAllScenarios();
  const runs = await repository.getAllRuns();

  const scenariosWithStats = scenarios.map((scen) => {
    const scenRuns = runs.filter((r) => r.scenarioId === scen.id);
    return {
      id: scen.id,
      code: scen.code,
      name: scen.name,
      description: scen.description,
      isBaseline: scen.isBaseline,
      configuration: {
        processTimeFactor: scen.configuration?.processTimeFactor ?? 1.0,
        transferThreshold: scen.configuration?.transferThreshold,
        assumptionsBasis: scen.configuration?.assumptionsBasis,
      },
      runCount: scenRuns.length,
      latestRun: scenRuns[0]
        ? {
            id: scenRuns[0].id,
            runCode: scenRuns[0].runCode,
            finishedCount: scenRuns[0].finishedCount,
            targetCount: scenRuns[0].targetCount,
            runTimeSeconds: scenRuns[0].runTimeSeconds,
            dataSource: scenRuns[0].dataSource,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-teal-600" />
          Quản Lý Phương Án & Thống Kê Thực Nghiệm
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thiết lập các kịch bản cải tiến (hệ số giảm thời gian gia công, ngưỡng chuyển người, lịch cấp phôi), so sánh các lần lặp mô phỏng với khoảng tin cậy 95% theo phân phối Student-t và cấu hình điều khiển ngưỡng động 4 công đoạn trọng yếu.
        </p>
      </div>

      {/* Mục 10: Cấu hình điều khiển ngưỡng động và điều chuyển nhân lực */}
      <StageControlConfigCard />

      {/* Danh sách kịch bản & phân tích Student-t 10 Replications */}
      <ScenarioListAndComparison scenarios={scenariosWithStats} />

      {/* Feature 4: Nhật Ký Thay Đổi Cấu Hình Phương Án & Đối Chiếu Thông Số Diff */}
      <ScenarioAuditTrail />
    </div>
  );
}
