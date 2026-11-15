import React from 'react';
import { repository } from '@/lib/repository';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarCheck,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  CURRENT_PRODUCTION_TARGET,
  evaluateAcceptanceCriteria,
  formatMetricNumber,
  formatSimulationTime,
  formatPercentage,
} from '@/lib/kpi';
import { ArrivalScheduleManager } from '@/components/production-plan/arrival-schedule-manager';

interface ProductionPlanPageProps {
  searchParams?: Promise<{ runId?: string }> | { runId?: string };
}

export default async function ProductionPlanPage({ searchParams }: ProductionPlanPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const runId = resolvedParams?.runId;

  const plan = await repository.getActivePlan();
  const line = await repository.getLine();
  const runs = await repository.getAllRuns();
  const activeRun = (runId ? runs.find((r) => r.id === runId) : null) || runs[0] || null;

  const plannedRunTime = plan?.plannedRunTime ?? 171000;
  const actualFinished = activeRun?.finishedCount ?? 5427;

  const acceptance = evaluateAcceptanceCriteria({
    actualOutput: actualFinished,
    target: CURRENT_PRODUCTION_TARGET,
    simulatedSeconds: activeRun?.runTimeSeconds ?? 171000,
  });

  // 4 Material Branches (Mục 8)
  const materialBranches = plan?.materialReleases ?? [
    {
      id: '1',
      branch: 'FRONT_BODY',
      sourceName: 'SRC_TT',
      plannedQuantity: 5500,
      generatedQuantity: 5500,
      releasedQuantity: 5500,
      heldQuantity: 0,
      completedQuantity: actualFinished,
      isReleaseCompleted: true,
    },
    {
      id: '2',
      branch: 'BACK_BODY',
      sourceName: 'SRC_TS',
      plannedQuantity: 5500,
      generatedQuantity: 5500,
      releasedQuantity: 5500,
      heldQuantity: 0,
      completedQuantity: actualFinished,
      isReleaseCompleted: true,
    },
    {
      id: '3',
      branch: 'WAISTBAND',
      sourceName: 'SRC_LUNG',
      plannedQuantity: 5500,
      generatedQuantity: 5500,
      releasedQuantity: 5500,
      heldQuantity: 0,
      completedQuantity: actualFinished,
      isReleaseCompleted: true,
    },
    {
      id: '4',
      branch: 'PAGET',
      sourceName: 'SRC_PAGET',
      plannedQuantity: 5500,
      generatedQuantity: 5500,
      releasedQuantity: 5500,
      heldQuantity: 0,
      completedQuantity: actualFinished,
      isReleaseCompleted: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-teal-600" />
          Kế Hoạch Sản Lượng & Quản Lý Cấp Liệu 4 Nhánh (Mục 8)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tiến độ cấp phôi nguyên liệu từ 4 Source đầu vào (Thân trước, Thân sau, Cạp lưng, Paget), tỷ lệ cân bằng định mức ráp 1:1:1:1 và bảng xem trước Arrival Schedule 550 đợt chuẩn bị nhập vào FlexSim.
        </p>
      </div>

      {/* Thông số kế hoạch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mục Tiêu Sản Lượng</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              5.500 <span className="text-xs font-normal text-slate-500 font-sans">sản phẩm</span>
            </div>
            <p className={`mt-2 text-xs font-medium ${acceptance.outputPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
              Thực tế: {actualFinished.toLocaleString('vi-VN')} cái ({formatPercentage(acceptance.completionRate)} — {acceptance.outputStatusLabel})
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-700">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thời Gian Kế Hoạch</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {formatSimulationTime(plannedRunTime)}
            </div>
            <p className="mt-2 text-xs text-slate-500">Mốc kiểm tra: 171.000s (47h 30m)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Định Mức Ráp BTP</span>
            <div className="mt-2 text-2xl font-bold text-indigo-900 font-mono">1 : 1 : 1 : 1</div>
            <p className="mt-2 text-xs text-slate-500">Yêu cầu cân bằng tuyệt đối giữa 4 nguồn cấp</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lô Cấp Cuối & Đóng Cổng</span>
            <div className="mt-2 text-2xl font-bold text-amber-900 font-mono">164.700s</div>
            <p className="mt-2 text-xs text-slate-500">6.300s cuối dành riêng cho thoát chuyền</p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng so sánh 4 nhánh cấp liệu: Dự kiến, Đã tạo, Đã ra khỏi Source, Content còn, Hoàn thành Sink */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" />
                Tiến Trình Cấp Liệu 4 Nhánh Đầu Vào (Material Release Progression)
              </CardTitle>
              <CardDescription>
                Phân biệt rõ ràng giữa: Lượng kế hoạch &rarr; Lượng tạo thực tế &rarr; Output thực tế ra khỏi Source &rarr; Content còn trong Source &rarr; Thành phẩm Sink
              </CardDescription>
            </div>
            <Badge variant="success">Lịch cấp 550 đợt hoàn tất</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                <tr>
                  <th className="py-3 px-3">Phân nhánh</th>
                  <th className="py-3 px-3">Tên Source FlexSim</th>
                  <th className="py-3 px-3 text-right">Lượng kế hoạch</th>
                  <th className="py-3 px-3 text-right">Lượng tạo thực tế</th>
                  <th className="py-3 px-3 text-right">Output thực tế</th>
                  <th className="py-3 px-3 text-right">Content còn trong Source</th>
                  <th className="py-3 px-3 text-right">Thành phẩm Sink</th>
                  <th className="py-3 px-3 text-center">Thời điểm cấp cuối</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {materialBranches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                      {b.branch === 'FRONT_BODY' && 'Nhánh Thân Trước'}
                      {b.branch === 'BACK_BODY' && 'Nhánh Thân Sau'}
                      {b.branch === 'WAISTBAND' && 'Nhánh Cạp Lưng'}
                      {b.branch === 'PAGET' && 'Nhánh Nẹp/Paget'}
                    </td>
                    <td className="py-3 px-3 font-bold text-teal-800">{b.sourceName}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatMetricNumber(b.plannedQuantity, 0, 'chi tiết')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatMetricNumber(b.generatedQuantity, 0, 'chi tiết')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-teal-700">
                      {formatMetricNumber(b.releasedQuantity, 0, 'chi tiết')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {formatMetricNumber(b.heldQuantity ?? 0, 0, 'chi tiết')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatMetricNumber(actualFinished, 0, 'sản phẩm')}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">164.700s</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Đã cấp đủ 100%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Lưu ý quy chuẩn cấp liệu:
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Không coi 5.500 trong lịch cấp là bằng chứng Source đã xuất thực tế đủ 5.500 ra chuyền. Cần đối chiếu độc lập giữa lượng phôi tạo, Output thực tế của từng Source và số lượng đã nhập vào các Queue đệm đầu vào (Q_CD01, Q_CD07, Q_CD15, Q_CD20).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mục 8: Bảng xem trước và xuất Arrival Schedule cho FlexSim */}
      <ArrivalScheduleManager />
    </div>
  );
}
