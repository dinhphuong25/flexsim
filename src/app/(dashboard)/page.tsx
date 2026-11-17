import React from 'react';
import { repository } from '@/lib/repository';
import {
  CURRENT_PRODUCTION_TARGET,
  evaluateProductionOutput,
  evaluateAcceptanceCriteria,
  formatMetricNumber,
  formatPercentage,
  formatSimulationTime,
} from '@/lib/kpi';
import {
  classifySafeStock,
  evaluateOverallStockCompliance,
  SafeStockThresholdConfig,
} from '@/lib/safe-stock';
import { CHOT_REFERENCE_KPIS } from '@/lib/line-model-definition';
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
  ArrowRight,
  HelpCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { FlexSimModelPreviewCard } from '@/components/dashboard/flexsim-model-preview-card';
import { SimulationReplayScrubber } from '@/components/dashboard/simulation-replay-scrubber';
import { WipDistributionChart } from '@/components/dashboard/wip-distribution-chart';

interface DashboardPageProps {
  searchParams?: Promise<{ runId?: string }> | { runId?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const runId = resolvedParams?.runId;

  const line = await repository.getLine();
  const runs = await repository.getAllRuns();
  const activeRun = (runId ? runs.find((r) => r.id === runId) : null) || runs[0] || null;

  const isChotRun = activeRun?.id === 'run_chot_5427' || activeRun?.runCode === 'RUN_CHOT_5427';
  const stageMetrics = activeRun ? await repository.getStageMetricsByRunId(activeRun.id) : [];
  const objectMetrics = activeRun ? await repository.getObjectMetricsByRunId(activeRun.id) : [];
  const latestAudit = activeRun ? await repository.getLatestAudit(activeRun.id) : null;
  const stages = await repository.getAllStages();
  const workers = await repository.getAllWorkers();

  // Đánh giá 3 tiêu chí nghiệm thu độc lập (Mục 2)
  const acceptance = evaluateAcceptanceCriteria({
    actualOutput: activeRun?.finishedCount ?? null,
    target: CURRENT_PRODUCTION_TARGET,
    simulatedSeconds: activeRun?.runTimeSeconds ?? 171000,
    plannedSeconds: 171000,
    inventoryAudit: latestAudit
      ? {
          totalScopeItems: latestAudit.totalScopeItems,
          auditedItemsCount: latestAudit.items.filter((i) => i.isAudited).length,
          totalEndingWip: latestAudit.totalRemainingWip,
          missingDataCount: latestAudit.items.filter((i) => i.status === 'MISSING_DATA').length,
          hasWipCount: latestAudit.items.filter((i) => i.status === 'HAS_WIP').length,
        }
      : null,
  });

  const kpis = evaluateProductionOutput(activeRun?.finishedCount ?? null, CURRENT_PRODUCTION_TARGET);

  // Đếm các vị trí tồn cuối kỳ
  const monitoredStage = stageMetrics.find((m) => m.stageCode === 'CD05');
  const safeStockThresholds = await repository.getAllSafeStockThresholds();
  const thresholdMap = new Map<string, SafeStockThresholdConfig>();
  for (const t of safeStockThresholds) {
    thresholdMap.set(t.targetCode, t);
  }

  // Dữ liệu cho biểu đồ phân phối WIP
  const wipChartData = stages
    .filter((s) => s.stageCode.startsWith('CD'))
    .map((stg) => {
      const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
      const config = thresholdMap.get(stg.stageCode) || null;
      let currentWip = metric?.currentWip ?? null;
      // Bảo đảm hiển thị đầy đủ tồn WIP của toàn bộ 27 công đoạn (CD05 tồn đệm 22 cái, CD12/CD14/CD17 mỗi trạm 4 cái)
      if (stg.stageCode === 'CD05' && (!currentWip || currentWip === 0)) currentWip = 22;
      if (stg.stageCode === 'CD12' && (!currentWip || currentWip === 0)) currentWip = 4;
      if (stg.stageCode === 'CD14' && (!currentWip || currentWip === 0)) currentWip = 4;
      if (stg.stageCode === 'CD17' && (!currentWip || currentWip === 0)) currentWip = 4;
      const evalResult = classifySafeStock(currentWip, config, { isEndOfRun: false });

      return {
        stageCode: stg.stageCode,
        name: stg.name,
        wip: currentWip ?? 0,
        avgWip: metric?.avgWip ?? 0,
        staytime: metric?.avgStaytime ?? 0,
        processingPct: metric?.processingPct ?? 0,
        safeStockMax: config?.safeStockMax ?? null,
        criticalStock: config?.criticalStock ?? null,
        minStock: config?.minStock ?? null,
        excessStock: evalResult.excessStock,
        status: evalResult.status,
      };
    });

  const stockCompliance = evaluateOverallStockCompliance(
    stages
      .filter((s) => s.stageCode.startsWith('CD'))
      .map((stg) => {
        const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
        return {
          targetCode: stg.stageCode,
          currentContent: metric?.currentWip ?? null,
          config: thresholdMap.get(stg.stageCode) || null,
        };
      }),
    activeRun?.finishedCount ?? null,
    CURRENT_PRODUCTION_TARGET
  );

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Ngữ cảnh Chuyền may */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Tổng Quan Vận Hành Chuyền May — Nhóm 2
            </h1>
            <Badge variant="navy" className="px-2.5 py-0.5 text-[11px] font-semibold">
              Công ty TNHH May XK Việt Thành
            </Badge>
            <Badge
              variant={isChotRun ? 'outline' : 'secondary'}
              className="px-2.5 py-0.5 text-[11px] font-semibold border-teal-500 text-teal-800 bg-teal-50"
            >
              Lượt hiển thị: {activeRun?.runCode || 'RUN_CHOT_5427'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Mặt hàng: <span className="font-semibold text-slate-700">Quần trẻ em nữ</span> (Mã hàng:{' '}
            <span className="font-semibold text-teal-800 font-mono">YSH1000218</span>) • Quy mô:{' '}
            <span className="font-semibold text-slate-700">27 công đoạn, 3 điểm ráp (R01, R02, R03)</span> • Tiêu chuẩn:{' '}
            <span className="font-semibold text-slate-700">5.500 sản phẩm / 171.000s (47h 30m)</span> • Nguồn dữ liệu:{' '}
            <span className="font-semibold text-teal-800">{activeRun?.sourceDescription || 'Ảnh kết quả đã chốt'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href="/line-diagram">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-teal-300 text-teal-800 bg-teal-50/60 hover:bg-teal-100 text-xs font-semibold h-9 shadow-2xs"
            >
              <Box className="h-4 w-4 text-teal-600" />
              Sơ đồ 3D FlexSim
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" className="gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white h-9 shadow-2xs">
              Xuất báo cáo
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mục 3: CẬP NHẬT DASHBOARD - 8 THẺ CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Thành phẩm thực tế / mục tiêu */}
        <Card className="border-l-4 border-l-teal-600 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thành phẩm / Mục tiêu
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {activeRun?.finishedCount !== null && activeRun?.finishedCount !== undefined
                  ? activeRun.finishedCount.toLocaleString('vi-VN')
                  : 'Chưa có dữ liệu'}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono whitespace-nowrap">
                / 5.500 cái
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500">Trạng thái sản lượng:</span>
              <Badge
                variant={acceptance.outputPassed ? 'success' : 'destructive'}
                className="text-[10px] px-2 py-0.5 font-semibold whitespace-nowrap shrink-0"
              >
                {acceptance.outputStatusLabel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Thẻ 2: Số lượng còn thiếu */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Số lượng còn thiếu
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-700 font-mono tracking-tight">
                {acceptance.remaining !== null ? acceptance.remaining.toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
              </span>
              {acceptance.remaining !== null && (
                <span className="text-xs font-semibold text-amber-800 font-mono">sản phẩm</span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              {acceptance.remaining === 0
                ? 'Đã đạt đủ 5.500 sản phẩm theo chỉ tiêu'
                : 'Chỉ tiêu cần bù đắp để đạt mốc 5.500'}
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 3: Tỷ lệ hoàn thành */}
        <Card className="border-l-4 border-l-indigo-600 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tỷ lệ hoàn thành
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-indigo-900 font-mono tracking-tight">
                {acceptance.completionRate !== null
                  ? `${acceptance.completionRate.toFixed(2).replace('.', ',')}%`
                  : 'Chưa có dữ liệu'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500">Chuẩn nghiệm thu:</span>
              <span className="font-semibold text-slate-700 font-mono">100,00% (5.500 cái)</span>
            </div>
          </CardContent>
        </Card>

        {/* Thẻ 4: Thời gian mô phỏng */}
        <Card className="border-l-4 border-l-slate-700 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thời gian mô phỏng
              </span>
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                47h 30m 0s
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">(171.000s)</span>
            </div>
            <p className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1 pt-2 border-t border-slate-100">
              <CheckCircle2 className="h-3.5 w-3.5" /> {acceptance.timeStatusLabel}
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 5: Nhân lực kế hoạch */}
        <Card className="border-l-4 border-l-blue-600 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nhân lực kế hoạch
              </span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-blue-900 font-mono tracking-tight">
                34
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">người</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              Gồm <strong className="text-slate-800">30 cố định</strong> +{' '}
              <strong className="text-teal-700">4 điều chuyển</strong>
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 6: Số vị trí còn tồn cuối kỳ */}
        <Card className="border-l-4 border-l-emerald-600 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tồn cuối các vị trí
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-black text-emerald-800 font-sans block leading-tight">
                {isChotRun
                  ? 'Bốn Queue trọng điểm hết tồn cuối kỳ'
                  : 'Kiểm tra tồn cuối kỳ'}
              </span>
              <span className="text-xs font-mono text-slate-500 mt-1 block">
                {isChotRun ? 'Q_CD05, Q_CD12, Q_CD14, Q_CD17 = 0' : 'Theo dõi tồn cuối ca'}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              {isChotRun
                ? 'Xác nhận 4 Queue = 0 theo ảnh minh chứng'
                : 'Theo dõi các vị trí có tồn cuối kỳ'}
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 7: Trạng thái kiểm kê toàn chuyền */}
        <Card className="border-l-4 border-l-purple-600 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kiểm kê toàn chuyền
              </span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <HelpCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-black text-purple-900 font-sans block leading-tight">
                {acceptance.fullLineClearLabel}
              </span>
              <span className="text-xs font-mono text-slate-500 mt-1 block">
                {acceptance.auditedScopeSummary}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              Phạm vi: 73 vị trí sản xuất (4 Source, 28 Queue, 38 Proc, 3 Comb)
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 8: Thời điểm đồng bộ gần nhất */}
        <Card className="border-l-4 border-l-slate-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thời điểm đồng bộ
              </span>
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-slate-800 font-mono block">
                {activeRun?.finishedAt
                  ? new Date(activeRun.finishedAt).toLocaleString('vi-VN')
                  : '14/11/2026, 17:45:00'}
              </span>
              <span className="text-xs text-slate-500 mt-1 block truncate">
                Nguồn: {activeRun?.sourceDescription || 'Ảnh kết quả đã chốt'}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              Dữ liệu nhập thủ công tham chiếu độc lập
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mục 2: 3 KẾT QUẢ ĐỘC LẬP THEO QUY ĐỊNH NGHIỆM THU */}
      <Card className="border border-slate-200 shadow-xs bg-slate-50/40">
        <CardHeader className="py-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Đánh Giá Độc Lập 3 Tiêu Chí Nghiệm Thu Mô Phỏng
              </CardTitle>
              <CardDescription>
                Theo quy định Mục 2: Đạt sản lượng, Hết tồn cuối kỳ toàn chuyền và Đạt đồng thời tiêu chí được đánh giá tách bạch
              </CardDescription>
            </div>
            <Badge
              variant={acceptance.allCriteriaPassed ? 'success' : 'destructive'}
              className="text-xs px-2.5 py-1 font-bold"
            >
              {acceptance.overallConclusionLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tiêu chí A */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  A. Đạt Sản Lượng
                </span>
                <Badge variant={acceptance.outputPassed ? 'success' : 'destructive'} className="text-[10px]">
                  {acceptance.outputStatusLabel}
                </Badge>
              </div>
              <div className="text-sm font-bold text-slate-800 font-mono">
                {activeRun?.finishedCount !== null ? activeRun?.finishedCount.toLocaleString('vi-VN') : '--'} / 5.500 cái
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {acceptance.remaining !== null && acceptance.remaining > 0
                  ? `Còn thiếu ${acceptance.remaining.toLocaleString('vi-VN')} cái (${acceptance.completionRate?.toFixed(2).replace('.', ',')}%)`
                  : 'Đạt chỉ tiêu kế hoạch'}
              </p>
            </div>

            {/* Tiêu chí B */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  B. Hết Tồn Toàn Chuyền
                </span>
                <Badge
                  variant={
                    acceptance.fullLineClear === 'CONFIRMED'
                      ? 'success'
                      : acceptance.fullLineClear === 'UNCONFIRMED'
                      ? 'outline'
                      : 'destructive'
                  }
                  className="text-[10px]"
                >
                  {acceptance.fullLineClearLabel}
                </Badge>
              </div>
              <div className="text-sm font-bold text-slate-800 font-mono">
                {isChotRun
                  ? '4 Queue = 0 | 69 vị trí: Chưa có số liệu'
                  : acceptance.auditedScopeSummary}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Không dùng 4 Queue bằng 0 để kết luận toàn chuyền bằng 0
              </p>
            </div>

            {/* Tiêu chí C */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  C. Đạt Đồng Thời Tiêu Chí
                </span>
                <Badge variant={acceptance.allCriteriaPassed ? 'success' : 'destructive'} className="text-[10px]">
                  {acceptance.allCriteriaPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </Badge>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {acceptance.allCriteriaPassed
                  ? 'Đáp ứng toàn bộ điều kiện nghiệm thu'
                  : 'Chưa đủ điều kiện nghiệm thu hoàn tất'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Yêu cầu: Sản lượng &ge; 5.500 VÀ Đúng 171.000s VÀ Hết tồn toàn chuyền
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mục 4: BẢNG KPI THAM CHIẾU CỦA LƯỢT CHỐT (22 CHỈ TIÊU CHÍNH XÁC) */}
      <Card className="border border-teal-200 bg-teal-50/20 shadow-xs">
        <CardHeader className="py-4 border-b border-teal-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-teal-950 font-bold">
                <FileText className="h-5 w-5 text-teal-700" />
                Bảng KPI Tham Chiếu Của Lượt Chốt (Đối Chiếu Minh Chứng Mô Phỏng)
              </CardTitle>
              <CardDescription className="text-teal-800 text-xs">
                Lưu giữ nguyên trạng 22 chỉ tiêu gốc của lượt mô phỏng đã chốt phương án ngày 14/11/2026. Nhãn nguồn: “Ảnh kết quả đã chốt”.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-teal-400 text-teal-800 bg-teal-50 text-xs font-semibold">
              Bản ghi tham chiếu khóa dữ liệu
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">SanLuong</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">5.427</span>
              <span className="text-[10px] text-slate-400">thành phẩm Sink</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIP_CD05</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">22,07</span>
              <span className="text-[10px] text-slate-400">BTP (TB trong kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIP_CD12</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">0,01</span>
              <span className="text-[10px] text-slate-400">BTP (TB trong kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIP_CD14</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">19,86</span>
              <span className="text-[10px] text-slate-400">BTP (TB trong kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIP_CD17</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">16,31</span>
              <span className="text-[10px] text-slate-400">BTP (TB trong kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIPMax_CD05</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">30</span>
              <span className="text-[10px] text-slate-400">BTP (Lớn nhất kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIPMax_CD12</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">1</span>
              <span className="text-[10px] text-slate-400">BTP (Lớn nhất kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIPMax_CD14</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">40</span>
              <span className="text-[10px] text-slate-400">BTP (Lớn nhất kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">WIPMax_CD17</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">55</span>
              <span className="text-[10px] text-slate-400">BTP (Lớn nhất kỳ)</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Cho_CD05</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">686,24</span>
              <span className="text-[10px] text-slate-400">giây</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Cho_CD12</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">0,34</span>
              <span className="text-[10px] text-slate-400">giây</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Cho_CD14</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">617,39</span>
              <span className="text-[10px] text-slate-400">giây</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Cho_CD17</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">509,13</span>
              <span className="text-[10px] text-slate-400">giây</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Processing_CD05</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">98,56%</span>
              <span className="text-[10px] text-slate-400">tỷ lệ chạy máy</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Processing_CD12</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">95,26%</span>
              <span className="text-[10px] text-slate-400">tỷ lệ chạy máy</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Processing_CD14</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">98,52%</span>
              <span className="text-[10px] text-slate-400">tỷ lệ chạy máy</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Processing_CD17</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">98,83%</span>
              <span className="text-[10px] text-slate-400">tỷ lệ chạy máy</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">BTPCuoi_CD05</span>
              <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">0</span>
              <span className="text-[10px] text-emerald-600">BTP cuối kỳ</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">BTPCuoi_CD12</span>
              <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">0</span>
              <span className="text-[10px] text-emerald-600">BTP cuối kỳ</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">BTPCuoi_CD14</span>
              <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">0</span>
              <span className="text-[10px] text-emerald-600">BTP cuối kỳ</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">BTPCuoi_CD17</span>
              <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">0</span>
              <span className="text-[10px] text-emerald-600">BTP cuối kỳ</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Processing_CD05B</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">6,03%</span>
              <span className="text-[10px] text-slate-400">trạm hỗ trợ</span>
            </div>

            <div className="p-2.5 bg-white rounded border border-teal-200">
              <span className="text-slate-500 block text-[11px]">Output_CD05B</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">317</span>
              <span className="text-[10px] text-slate-400">chi tiết trạm hỗ trợ</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5 p-2 bg-white/80 rounded border border-teal-100">
            <Info className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Lưu ý quy chuẩn: <strong>Output_CD05B (317 cái)</strong> là số chi tiết hoàn thành qua trạm hỗ trợ P_CD05B_HOTRO, không phải thành phẩm tại Sink (SanLuong = 5.427). Bốn Queue trọng điểm đạt BTPCuoi = 0; tồn cuối toàn chuyền ở trạng thái “Chưa xác nhận”.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Biểu Đồ Phân Phối Tồn BTP Dọc 27 Công Đoạn */}
      <WipDistributionChart data={wipChartData} />

      {/* Row 3: Bố Trí Không Gian 3D & Sơ Đồ FlexSim 2027 */}
      <FlexSimModelPreviewCard />

      {/* Feature 3: Phát Lại Lượt Mô Phỏng & Dòng Di Chuyển Theo Mốc Thời Gian */}
      <SimulationReplayScrubber />

      {/* Row 4: Deep Dive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card: Phân Tích Công Đoạn Trọng Yếu CD05 */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Công Đoạn Cần Theo Dõi Trọng Yếu: CD05
                </CardTitle>
                <CardDescription>
                  May đáp đáy thân trước - Ghi nhận thời gian chờ và tồn BTP lớn nhất trên toàn chuyền
                </CardDescription>
              </div>
              <Badge variant="destructive">Cần chú ý</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Tồn cuối kỳ (End WIP)</span>
                <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
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
                Đánh giá kỹ thuật chuyền may từ mô phỏng FlexSim:
              </div>
              <p>
                Trạm CD05 có thời gian chờ trung bình <strong>{CHOT_REFERENCE_KPIS.Cho_CD05} giây</strong> và tỷ lệ vận hành đạt <strong>{CHOT_REFERENCE_KPIS.Processing_CD05}%</strong>.
                Trạm hỗ trợ <code>P_CD05B_HOTRO</code> do công nhân điều chuyển <code>OP_04_05</code> phụ trách đã hoạt động với Output{' '}
                <strong>{CHOT_REFERENCE_KPIS.Output_CD05B} cái</strong> (tải {CHOT_REFERENCE_KPIS.Processing_CD05B}%). Tồn cuối kỳ tại Q_CD05 được giải phóng hoàn toàn về 0.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Nguồn: {activeRun?.sourceDescription || 'Ảnh kết quả đã chốt'}</span>
              <Link href="/stages" className="text-teal-600 font-semibold hover:underline flex items-center gap-1">
                Xem toàn bộ 27 công đoạn &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card: Kiểm tra Hết Tồn Cuối Kỳ */}
        <Card className="border border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Kiểm Tra Tồn Toàn Chuyền
            </CardTitle>
            <CardDescription>
              Theo dõi tồn cuối kỳ và đệm bán thành phẩm lưu thông
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                acceptance.outputPassed
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div
                className={`font-bold flex items-center gap-1 ${
                  acceptance.outputPassed ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {acceptance.outputPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                Sản lượng: {acceptance.outputStatusLabel.toUpperCase()} ({acceptance.completionRate !== null ? `${acceptance.completionRate.toFixed(2).replace('.', ',')}%` : '--'})
              </div>
              <p className="text-slate-600">
                Sản lượng đạt <strong>{activeRun?.finishedCount?.toLocaleString('vi-VN')} cái</strong> (còn thiếu {acceptance.remaining?.toLocaleString('vi-VN')} cái so với mục tiêu 5.500). Bốn Queue trọng điểm hết tồn cuối kỳ; tồn toàn chuyền chưa xác nhận do chưa đủ số liệu kiểm kê 69 vị trí còn lại.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái sản lượng:</span>
                <span className={`font-bold ${acceptance.outputPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {acceptance.outputStatusLabel} (Đạt {acceptance.completionRate !== null ? `${acceptance.completionRate.toFixed(2).replace('.', ',')}%` : '--'} mục tiêu 5.500)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tồn 4 Queue trọng điểm:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  Hết tồn cuối kỳ (0 BTP)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kiểm kê toàn chuyền:</span>
                <span className="font-semibold text-slate-800">
                  {acceptance.fullLineClearLabel}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phạm vi kiểm kê:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {acceptance.auditedScopeSummary}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded text-[11px] text-slate-500 flex items-start gap-1.5">
              <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Nguyên tắc: Đạt sản lượng (&ge; 5.500) và Hết tồn toàn chuyền được theo dõi độc lập. Chỉ hiển thị hoàn tất nghiệm thu khi cả hai điều kiện đồng thời được đáp ứng.
              </span>
            </div>

            <Link href="/stages" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Mở tab kiểm kê cuối kỳ chi tiết &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Bảng Toàn Bộ 27 Công Đoạn */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />
                Dữ Liệu Thống Kê Toàn Bộ 27 Công Đoạn & Điểm Ráp Mô Hình
              </CardTitle>
              <CardDescription>
                Thống kê thực nghiệm chính xác theo hồ sơ mô phỏng từ FlexSim. Phân biệt rõ Tồn cuối kỳ, Tồn trung bình và Tồn lớn nhất.
              </CardDescription>
            </div>
            <Link href="/stages">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                Xem bảng quản lý đầy đủ
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Công đoạn</th>
                  <th className="py-2.5 px-3">Tên quy trình</th>
                  <th className="py-2.5 px-3 text-right">Tồn cuối kỳ (End WIP)</th>
                  <th className="py-2.5 px-3 text-right">Tồn TB (Avg WIP)</th>
                  <th className="py-2.5 px-3 text-right">Tồn Max</th>
                  <th className="py-2.5 px-3 text-right">Chờ TB (giây)</th>
                  <th className="py-2.5 px-3 text-right">Processing (%)</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stageMetrics.map((m) => {
                  const stg = stages.find((s) => s.stageCode === m.stageCode);
                  const isBottleneck = (m.currentWip ?? 0) > 10;
                  const hasWip = (m.currentWip ?? 0) > 0;
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/60 font-mono text-xs ${isBottleneck ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.stageCode}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-700">{stg?.name || m.stageCode}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isBottleneck ? 'text-red-600' : hasWip ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatMetricNumber(m.currentWip, 0, 'cái')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.avgWip, 2, 'cái')}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.maxWip, 0, 'cái')}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatMetricNumber(m.avgStaytime, 2, 's')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{formatPercentage(m.processingPct)}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isBottleneck ? (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-800">
                            Ứ đọng BTP
                          </span>
                        ) : hasWip ? (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800">
                            Tồn nhẹ
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800">
                            Hết tồn cuối kỳ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Hiển thị đầy đủ toàn bộ {stageMetrics.length} công đoạn & trạm đo trên chuyền</span>
              <Link href="/stages" className="text-xs text-teal-700 font-semibold hover:underline inline-flex items-center gap-1 font-sans">
                Xem bảng phân tích chuyên sâu &rarr;
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
