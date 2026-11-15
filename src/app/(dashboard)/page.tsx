import React from 'react';
import { repository } from '@/lib/repository';
import { calculateProductionKpis, formatMetricNumber, formatPercentage, formatSimulationTime } from '@/lib/kpi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Box,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const line = await repository.getLine();
  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  const stageMetrics = activeRun ? await repository.getStageMetricsByRunId(activeRun.id) : [];
  const stages = await repository.getAllStages();
  const workers = await repository.getAllWorkers();

  // Tính toán KPI theo quy tắc chuẩn Phần 6
  const targetOutput = activeRun?.targetCount ?? 5500;
  const finishedCount = activeRun?.finishedCount ?? null;
  const kpis = calculateProductionKpis(finishedCount, targetOutput);

  // Tính tổng WIP trong phạm vi có số liệu đo (Null không gộp thành 0)
  const measuredStagesWithWip = stageMetrics.filter((m) => m.currentWip !== null && m.currentWip !== undefined);
  const totalEndingWipInMeasuredScope = measuredStagesWithWip.reduce((sum, m) => sum + (m.currentWip ?? 0), 0);
  const measuredAvgWipValues = stageMetrics
    .map((m) => m.avgWip)
    .filter((v): v is number => v !== null && v !== undefined);
  const averageWipInMeasuredScope = measuredAvgWipValues.length > 0
    ? measuredAvgWipValues.reduce((a, b) => a + b, 0) / measuredAvgWipValues.length
    : null;

  // Xác định công đoạn cần theo dõi đặc biệt (Ví dụ CD05 có thời gian chờ cao & tồn lớn)
  const monitoredStage = stageMetrics.find((m) => m.stageCode === 'CD05');

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tổng Quan Vận Hành Chuyền May Nhóm 2
            </h1>
            <Badge variant="navy">Công ty TNHH May XK Việt Thành</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mặt hàng: <span className="font-semibold text-slate-700">Quần trẻ em nữ</span> | Quy mô:{' '}
            <span className="font-semibold text-slate-700">27 công đoạn, 3 điểm ráp (R01, R02, R03)</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/line-diagram">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Activity className="h-4 w-4 text-teal-600" />
              Xem sơ đồ chuyền
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" className="gap-1.5">
              Xuất báo cáo
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Mục tiêu & Thành phẩm */}
        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Thành Phẩm Tại Sink
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-mono">
                {formatMetricNumber(kpis.finished, 0, 'cái')}
              </span>
              <span className="text-sm text-slate-500 font-mono">
                / {formatMetricNumber(kpis.target, 0, 'cái')}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tỷ lệ hoàn thành:</span>
              <span className="font-bold text-teal-700 font-mono text-sm">
                {formatPercentage(kpis.completionRatePct)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Số còn thiếu */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Số Lượng Còn Thiếu
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-900 font-mono">
                {formatMetricNumber(kpis.remainingCount, 0, 'cái')}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Công thức: <code className="bg-slate-100 px-1 py-0.5 rounded">max(5.500 − 5.408, 0) = 92</code>
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Thời gian mô phỏng */}
        <Card className="border-l-4 border-l-slate-600">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Thời Gian Mô Phỏng
              </span>
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900 font-mono">
                {formatSimulationTime(activeRun?.runTimeSeconds)}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tiến độ: <span className="font-semibold text-slate-700">Đã hoàn thành 100% thời lượng kế hoạch</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Nhân lực bố trí */}
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nhân Lực Kế Hoạch
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-mono">
                34
              </span>
              <span className="text-xs text-slate-500 font-medium">người</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Gồm: <span className="font-semibold text-slate-800">30 cố định</span> +{' '}
              <span className="font-semibold text-teal-700">4 điều chuyển</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Deep Dive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card: Phân Tích Công Đoạn Trọng Yếu CD05 */}
        <Card className="lg:col-span-2 border border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Công Đoạn Cần Theo Dõi Trọng Yếu: CD05
                </CardTitle>
                <CardDescription>
                  May đáp đáy thân trước - Ghi nhận thời gian chờ và tồn BTP lớn nhất trên chuyền
                </CardDescription>
              </div>
              <Badge variant="destructive">Cần chú ý</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Tồn hiện tại (Current WIP)</span>
                <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {formatMetricNumber(monitoredStage?.currentWip, 0, 'cái')}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Tồn trung bình (Avg WIP)</span>
                <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {formatMetricNumber(monitoredStage?.avgWip, 2, 'cái')}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Thời gian chờ (Wait Time)</span>
                <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                  {formatMetricNumber(monitoredStage?.avgStaytime, 2, 's')}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Tỷ lệ chạy máy (Processing)</span>
                <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {formatPercentage(monitoredStage?.processingPct)}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Đánh giá kỹ thuật chuyền may:
              </div>
              <p>
                Trạm CD05 có thời gian chờ lên tới <strong>700,33 giây</strong> và tỷ lệ vận hành đạt <strong>99,89%</strong>.
                Trạm hỗ trợ <code>P_CD05B_HOTRO</code> do công nhân điều chuyển <code>OP_04_05</code> phụ trách đã hoạt động với Output{' '}
                <strong>181 cái</strong> (tải 3,45%). Khuyến nghị xem xét phương án cải tiến lắp cữ định vị để giảm Process Time.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Nguồn: Đối chiếu ảnh kết quả mô phỏng ngày 14/11/2026</span>
              <Link href="/stages" className="text-teal-600 font-medium hover:underline">
                Xem toàn bộ 27 công đoạn &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card: Kiểm tra Hết Tồn Cuối Kỳ */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              Kiểm Tra Tồn Toàn Chuyền
            </CardTitle>
            <CardDescription>
              Đánh giá điều kiện giải phóng chuyền cuối ca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Kết luận: Còn tồn BTP cuối kỳ
              </div>
              <p>
                Công đoạn CD05 ghi nhận tồn cuối kỳ = <strong>22 cái</strong>. Chưa đạt điều kiện hết tồn toàn chuyền.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Đạt sản lượng (5.408/5.500):</span>
                <span className="font-semibold text-slate-700">98,33%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tồn BTP tại phạm vi đo:</span>
                <span className="font-semibold text-red-700 font-mono">
                  {totalEndingWipInMeasuredScope} cái
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">WIP trung bình các trạm đã đo:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatMetricNumber(averageWipInMeasuredScope, 2, 'cái')}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded text-[11px] text-slate-500 flex items-start gap-1.5">
              <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Nguyên tắc: &ldquo;Đạt sản lượng&rdquo; và &ldquo;Hết tồn&rdquo; là hai kết luận độc lập. Số liệu trạm chưa đo được bảo toàn giá trị null, không giả định bằng 0.
              </span>
            </div>

            <Link href="/line-diagram" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Mở sơ đồ kiểm tra tồn chi tiết
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Bảng Công Đoạn Đo Mẫu (Section 18) */}
      <Card className="border border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Dữ Liệu Đo Công Đoạn Trọng Yếu Đã Xác Minh</CardTitle>
              <CardDescription>
                Thống kê thực nghiệm chính xác theo hồ sơ nghiệm thu mô phỏng ngày 14/11/2026
              </CardDescription>
            </div>
            <Badge variant="outline">Phạm vi 4 trạm trọng yếu</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                <tr>
                  <th className="py-2.5 px-3">Công đoạn</th>
                  <th className="py-2.5 px-3">Tên quy trình</th>
                  <th className="py-2.5 px-3 text-right">Tồn hiện tại (Current)</th>
                  <th className="py-2.5 px-3 text-right">Tồn TB (Avg WIP)</th>
                  <th className="py-2.5 px-3 text-right">Tồn Max (Max WIP)</th>
                  <th className="py-2.5 px-3 text-right">Chờ TB (giây)</th>
                  <th className="py-2.5 px-3 text-right">Processing (%)</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stageMetrics.map((m) => {
                  const stg = stages.find((s) => s.stageCode === m.stageCode);
                  const isHighWip = (m.currentWip ?? 0) > 5;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 font-mono text-xs">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.stageCode}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-700">{stg?.name || m.stageCode}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isHighWip ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatMetricNumber(m.currentWip, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.avgWip, 2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.maxWip, 0)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.avgStaytime, 2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{formatPercentage(m.processingPct)}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isHighWip ? (
                          <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-800">
                            Ứ đọng
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800">
                            Lưu thông tốt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
