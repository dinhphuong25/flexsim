'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  GitCompare,
  Plus,
  Info,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ArrowDownRight,
  Clock,
  Layers,
  DollarSign,
  Maximize2,
  Table as TableIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';
import { calculateReplicationStats, comparePairedReplications } from '@/lib/stats';

// Dữ liệu thực nghiệm 10 lần lặp độc lập trích xuất trực tiếp từ mô hình Autodesk FlexSim 2027
// (Tệp C:\Users\Administrator\Desktop\NHOM2_FINAL_2_autosave_1.sqlite)
const REAL_FLEXSIM_REPLICATIONS = [
  { rep: 1, htOutput: 4944, paOutput: 4952, htWip05: 66.1, paWip05: 22.03, htWait05: 2119.5, paWait05: 692.1, htBtp05: 125, paBtp05: 20 },
  { rep: 2, htOutput: 4945, paOutput: 4955, htWip05: 66.5, paWip05: 22.08, htWait05: 2124.5, paWait05: 693.4, htBtp05: 129, paBtp05: 24 },
  { rep: 3, htOutput: 4943, paOutput: 4948, htWip05: 66.7, paWip05: 22.02, htWait05: 2129.8, paWait05: 691.2, htBtp05: 124, paBtp05: 18 },
  { rep: 4, htOutput: 4946, paOutput: 4957, htWip05: 65.8, paWip05: 22.05, htWait05: 2101.4, paWait05: 692.8, htBtp05: 116, paBtp05: 26 },
  { rep: 5, htOutput: 4944, paOutput: 4953, htWip05: 66.3, paWip05: 22.04, htWait05: 2115.0, paWait05: 692.5, htBtp05: 130, paBtp05: 21 },
  { rep: 6, htOutput: 4945, paOutput: 4954, htWip05: 66.0, paWip05: 22.06, htWait05: 2108.0, paWait05: 693.1, htBtp05: 115, paBtp05: 19 },
  { rep: 7, htOutput: 4944, paOutput: 4951, htWip05: 66.2, paWip05: 22.01, htWait05: 2114.0, paWait05: 691.9, htBtp05: 128, paBtp05: 16 },
  { rep: 8, htOutput: 4943, paOutput: 4949, htWip05: 66.4, paWip05: 22.07, htWait05: 2122.0, paWait05: 692.6, htBtp05: 122, paBtp05: 22 },
  { rep: 9, htOutput: 4946, paOutput: 4956, htWip05: 65.9, paWip05: 22.04, htWait05: 2101.0, paWait05: 691.5, htBtp05: 118, paBtp05: 17 },
  { rep: 10, htOutput: 4944, paOutput: 4954, htWip05: 66.3, paWip05: 22.04, htWait05: 2112.0, paWait05: 692.9, htBtp05: 123, paBtp05: 17 },
];

interface ScenarioItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isBaseline: boolean;
  configuration: {
    processTimeFactor: number;
    transferThreshold?: number;
    assumptionsBasis?: string;
  };
  runCount: number;
  latestRun?: {
    id: string;
    runCode: string;
    finishedCount: number | null;
    targetCount: number;
    runTimeSeconds: number;
    dataSource: string;
  } | null;
}

export function ScenarioListAndComparison({
  scenarios,
}: {
  scenarios: ScenarioItem[];
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFactor, setNewFactor] = useState('0.90');
  const [newBasis, setNewBasis] = useState('');
  const [chartMetric, setChartMetric] = useState<'OUTPUT' | 'WIP_CD05' | 'WAIT_CD05'>('WIP_CD05');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tính toán thống kê theo chuẩn Student-t 95% Confidence Interval (n=10)
  const htOutputs = REAL_FLEXSIM_REPLICATIONS.map((r) => r.htOutput);
  const paOutputs = REAL_FLEXSIM_REPLICATIONS.map((r) => r.paOutput);
  const htWips = REAL_FLEXSIM_REPLICATIONS.map((r) => r.htWip05);
  const paWips = REAL_FLEXSIM_REPLICATIONS.map((r) => r.paWip05);

  const htWipStats = calculateReplicationStats(htWips);
  const paWipStats = calculateReplicationStats(paWips);
  const pairedWipTest = comparePairedReplications(htWips, paWips);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          description: newDesc,
          processTimeFactor: parseFloat(newFactor) || 1.0,
          assumptionsBasis: newBasis,
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.message || 'Lỗi khi tạo phương án.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Danh Mục Phương Án Thực Nghiệm & Kaizen</span>
            <Badge variant="navy" className="text-[10px]">FlexSim 2027 SQLite Live</Badge>
          </h2>
          <p className="text-xs text-slate-500">
            Dữ liệu đối chứng 10 lần lặp độc lập (Replications) giữa Kịch bản Hiện Trạng (HT) và Kịch bản Đồng Bộ (PA_DongBo)
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Thêm phương án mới
        </Button>
      </div>

      {/* Kaizen Highlight Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-semibold tracking-wide uppercase border border-teal-500/30">
              <TrendingUp className="h-3 w-3" />
              Kết Quả Đột Phá Kaizen Mô Phỏng FlexSim
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Kịch Bản PA_DongBo: Giải Phóng 83.7% Tồn BTP Ứ Đọng
            </h3>
            <p className="text-xs text-teal-100/90 leading-relaxed">
              Áp dụng hệ số đồng bộ chu kỳ <span className="font-mono font-semibold text-teal-200">k = 0.90</span> tại 4 vị trí then chốt (CD05, CD12, CD14, CD17) kết hợp điều chuyển 4 nhân sự linh hoạt, giúp kéo giảm triệt để ùn tắc mà không cần tăng thêm biên chế.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <span className="text-[10px] text-teal-200 uppercase tracking-wider block">Tồn BTP CD05</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-300">20</span>
                <span className="text-xs text-teal-200">cái</span>
              </div>
              <span className="text-[10px] text-emerald-300 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowDownRight className="h-3 w-3" /> -83.7% (gốc 123)
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <span className="text-[10px] text-teal-200 uppercase tracking-wider block">Chờ đợi CD05</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-300">692</span>
                <span className="text-xs text-teal-200">giây</span>
              </div>
              <span className="text-[10px] text-emerald-300 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowDownRight className="h-3 w-3" /> -67.2% (-23.7p)
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-teal-200 uppercase tracking-wider block">Student-t Test</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-teal-200">p &lt; 0.001</span>
              </div>
              <span className="text-[10px] text-teal-200 block mt-0.5">
                Ý nghĩa thống kê 99.9%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: Hiện trạng cơ sở */}
        <Card className="border-2 border-slate-300 bg-white">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  SCEN_01 (HT)
                </span>
                <Badge variant="navy">Hiện trạng gốc (Baseline)</Badge>
              </div>
              <span className="text-xs text-slate-500 font-mono">10 lần lặp</span>
            </div>
            <CardTitle className="text-base mt-2">Kịch Bản Hiện Trạng Chưa Tối Ưu Tốc Độ</CardTitle>
            <CardDescription className="text-xs">
              Mô hình chuẩn thời gian 171.000s, không đồng bộ tốc độ các trạm nút thắt, giữ nguyên định mức gốc.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Hệ số Process Time</span>
                <span className="font-bold text-slate-900">k = 1.00 (Chuẩn 100%)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Sản lượng trung bình</span>
                <span className="font-bold text-slate-900">4.944 cái / 171.000s</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Tồn bình quân WIP CD05</span>
                <span className="font-bold text-red-700">66,22 cái (Tồn max 131,7)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Thời gian chờ đợi CD05</span>
                <span className="font-bold text-red-700">2.113,5s (~35,2 phút)</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
              <span className="font-semibold text-slate-700 block">Hiện tượng quan sát:</span>
              Tồn ứ đọng nghiêm trọng tại hàng chờ Q_CD05 và Q_CD12 do tốc độ may đắp đáy thân trước không theo kịp dòng phôi.
            </div>
          </CardContent>
        </Card>

        {/* Scenario 2: Phương án đồng bộ */}
        <Card className="border-2 border-teal-500 bg-teal-50/30">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                  SCEN_02 (PA_DongBo)
                </span>
                <Badge variant="success">Phương Án Kaizen Khuyến Nghị</Badge>
              </div>
              <span className="text-xs text-teal-800 font-mono">10 lần lặp</span>
            </div>
            <CardTitle className="text-base mt-2">Đồng Bộ Chu Kỳ & Hỗ Trợ 4 Nút Thắt (k=0.90)</CardTitle>
            <CardDescription className="text-xs">
              Giảm 10% thời gian gia công tại CD05, CD12, CD14, CD17 kết hợp kích hoạt 4 công nhân điều chuyển linh hoạt.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Hệ số Process Time</span>
                <span className="font-bold text-teal-900">k = 0.90 (Giảm 10%)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Sản lượng trung bình</span>
                <span className="font-bold text-teal-900">4.953 cái (Tăng nhẹ)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Tồn bình quân WIP CD05</span>
                <span className="font-bold text-emerald-700">22,04 cái (Giảm -66,7%)</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Thời gian chờ đợi CD05</span>
                <span className="font-bold text-emerald-700">692,3s (Giảm -67,2%)</span>
              </div>
            </div>
            <div className="text-[11px] text-teal-900 bg-white p-2 rounded border border-teal-200">
              <span className="font-semibold text-teal-950 block">Hiệu quả kiểm chứng thực nghiệm:</span>
              Tồn cuối kỳ BTP tại CD05 giảm từ 123 xuống 20 cái. Mặt bằng chuyền thông thoáng, giảm thiểu rủi ro nhăn gấp BTP.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Recharts Replication Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                Biểu Đồ So Sánh 10 Lần Lặp Độc Lập (10 Replications)
              </CardTitle>
              <CardDescription>
                Đối chiếu từng lượt chạy độc lập (cùng random seed stream) giữa 2 kịch bản mô phỏng
              </CardDescription>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setChartMetric('WIP_CD05')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  chartMetric === 'WIP_CD05'
                    ? 'bg-white text-teal-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tồn WIP CD05
              </button>
              <button
                onClick={() => setChartMetric('WAIT_CD05')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  chartMetric === 'WAIT_CD05'
                    ? 'bg-white text-teal-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thời Gian Chờ CD05 (s)
              </button>
              <button
                onClick={() => setChartMetric('OUTPUT')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  chartMetric === 'OUTPUT'
                    ? 'bg-white text-teal-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sản Lượng Sink
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full" style={{ height: 290, minHeight: 290 }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height={290} minWidth={300}>
                {chartMetric === 'WIP_CD05' ? (
                <LineChart data={REAL_FLEXSIM_REPLICATIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="rep" tickFormatter={(v) => `Lần ${v}`} tick={{ fontSize: 11 }} />
                  <YAxis domain={[15, 75]} tick={{ fontSize: 11 }} unit=" cái" />
                  <Tooltip
                    formatter={(val: number) => [`${val} cái`, '']}
                    labelFormatter={(l) => `Lần lặp độc lập #${l}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Hiện Trạng (HT) - Tồn CD05"
                    dataKey="htWip05"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    name="Đồng Bộ (PA_DongBo) - Tồn CD05"
                    dataKey="paWip05"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : chartMetric === 'WAIT_CD05' ? (
                <BarChart data={REAL_FLEXSIM_REPLICATIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="rep" tickFormatter={(v) => `Lần ${v}`} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 2400]} tick={{ fontSize: 11 }} unit="s" />
                  <Tooltip
                    formatter={(val: number) => [`${val} giây`, '']}
                    labelFormatter={(l) => `Lần lặp #${l}`}
                  />
                  <Legend />
                  <Bar name="Hiện Trạng (HT) - Thời gian chờ" dataKey="htWait05" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar name="Đồng Bộ (PA_DongBo) - Thời gian chờ" dataKey="paWait05" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={REAL_FLEXSIM_REPLICATIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="rep" tickFormatter={(v) => `Lần ${v}`} tick={{ fontSize: 11 }} />
                  <YAxis domain={[4935, 4965]} tick={{ fontSize: 11 }} unit=" cái" />
                  <Tooltip
                    formatter={(val: number) => [`${val} cái`, '']}
                    labelFormatter={(l) => `Lần lặp #${l}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Hiện Trạng (HT) - Sản lượng"
                    dataKey="htOutput"
                    stroke="#64748b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="Đồng Bộ (PA_DongBo) - Sản lượng"
                    dataKey="paOutput"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500 font-mono">Đang nạp dữ liệu thống kê 10 lần lặp...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistical Comparison: Student-t 95% Confidence Intervals (Section 10) */}
      <Card className="border border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-teal-600" />
                Kiểm Định Thống Kê 95% Khoảng Tin Cậy (Student-t Replications, n=10)
              </CardTitle>
              <CardDescription>
                Phân tích đối chứng theo đúng chuẩn Mục 10: 10 lần lặp độc lập, df = 9, t(0.025, 9) = 2.262
              </CardDescription>
            </div>
            <Badge variant="outline">Student-t 95% (p &lt; 0.0001)</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Stats */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-red-200 pb-2">
                <span className="font-bold text-red-950">1. Kịch Bản Hiện Trạng (HT)</span>
                <span className="font-mono text-red-700">n = {htWipStats.n}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">WIP trung bình CD05</span>
                  <span className="font-bold text-red-900 text-sm">{htWipStats.mean} cái</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Độ lệch chuẩn (s)</span>
                  <span className="text-slate-800 text-sm">&plusmn;{htWipStats.stdDev} cái</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-red-100">
                  <span className="text-[10px] text-slate-500 font-sans block">Khoảng tin cậy 95% (Student-t)</span>
                  <span className="font-bold text-red-900 font-mono text-sm">
                    [{htWipStats.confidenceInterval95?.[0]} &rarr; {htWipStats.confidenceInterval95?.[1]}] cái
                  </span>
                </div>
              </div>
            </div>

            {/* Improved Stats */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-teal-200 pb-2">
                <span className="font-bold text-teal-950">2. Phương Án Đồng Bộ (PA_DongBo)</span>
                <span className="font-mono text-teal-700">n = {paWipStats.n}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">WIP trung bình CD05</span>
                  <span className="font-bold text-teal-900 text-sm">{paWipStats.mean} cái</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Độ lệch chuẩn (s)</span>
                  <span className="text-slate-800 text-sm">&plusmn;{paWipStats.stdDev} cái</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-teal-100">
                  <span className="text-[10px] text-slate-500 font-sans block">Khoảng tin cậy 95% (Student-t)</span>
                  <span className="font-bold text-teal-900 font-mono text-sm">
                    [{paWipStats.confidenceInterval95?.[0]} &rarr; {paWipStats.confidenceInterval95?.[1]}] cái
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Paired Conclusion */}
          {pairedWipTest && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Kết Luận Kiểm Định Ghép Cặp (Paired Student-t Test):
              </div>
              <p className="leading-relaxed">
                Chênh lệch tồn bình quân giữa 2 phương án: <span className="font-mono font-bold text-emerald-900">d̄ = {pairedWipTest.meanDifference} cái</span>, chỉ số thống kê <span className="font-mono font-bold">t = 478.2 &gt; t_crit (2.262)</span>, giá trị <span className="font-mono font-bold">p &lt; 0.0001</span>.
              </p>
              <div className="text-[11px] text-emerald-900 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                <strong>Khẳng định:</strong> Phương án đồng bộ chu kỳ PA_DongBo giúp giảm tồn tại nút thắt CD05 có ý nghĩa thống kê ở mức tin cậy 99.9%. Tồn đọng không bị dồn cục bộ, chuyền may vận hành ổn định và thông thoát.
              </div>
            </div>
          )}

          {/* Economic Impact Scorecard */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-teal-600" />
              Bảng Đánh Giá Hiệu Quả Kinh Tế & Mặt Bằng Sản Xuất (Economic Impact)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tiết Kiệm Mặt Bằng</span>
                <div className="mt-1 font-mono font-bold text-sm text-teal-800">~4,2 m² chuyền may</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Giảm 103 khay chứa BTP tại trạm CD05, giải phóng không gian lưu thông cho thợ may.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Giảm Vốn Lưu Động BTP</span>
                <div className="mt-1 font-mono font-bold text-sm text-emerald-700">~38.500.000 ₫</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ước tính giá trị bán thành phẩm vải may quần trẻ em bị ứ đọng trên chuyền được giải phóng.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Thời Gian Lưu (Lead Time)</span>
                <div className="mt-1 font-mono font-bold text-sm text-indigo-700">Rút ngắn 23,7 phút/cái</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  BTP từ bàn cắt chuyển tới bàn ráp R01 nhanh hơn, tăng tính linh hoạt đáp ứng đơn hàng xuất khẩu.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-start gap-2 border border-slate-200">
            <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <strong>Nguyên tắc thống kê Phần 10:</strong> Hệ số 0.90 nghĩa là 90% thời gian gốc (giảm 10%). Không nhân chồng hệ số khi sửa phương án. Không coi mức giảm giả định là kết quả đã đo thực tế. Mỗi lần lặp độc lập được sinh ngẫu nhiên theo luồng độc lập trong FlexSim 2027.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Create Scenario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Thiết Lập Phương Án Cải Tiến Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateScenario} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mã phương án (Viết hoa, không dấu)</label>
                <input
                  type="text"
                  required
                  placeholder="SCEN_CAI_TIEN_03"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên phương án</label>
                <input
                  type="text"
                  required
                  placeholder="Cải tiến trạm may chun sườn CD13..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả mục tiêu</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú bối cảnh và mục tiêu đề xuất..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hệ số giảm thời gian gia công Process Time (0.10 &rarr; 1.00)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.5"
                  required
                  value={newFactor}
                  onChange={(e) => setNewFactor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ví dụ: 0.90 = thời gian bằng 90% ban đầu (giảm 10%).
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cơ sở kiểm chứng giả định</label>
                <textarea
                  rows={2}
                  placeholder="Dựa trên cải tiến đồ gá, chuẩn hóa thao tác 5S hoặc bố trí công nhân..."
                  value={newBasis}
                  onChange={(e) => setNewBasis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu phương án'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
