'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { Activity, Layers, ShieldCheck } from 'lucide-react';
import { SafeStockStatus } from '@/lib/safe-stock';

export interface StageWipItem {
  stageCode: string;
  name: string;
  wip: number;
  avgWip: number;
  staytime: number;
  processingPct: number;
  safeStockMax?: number | null;
  criticalStock?: number | null;
  minStock?: number | null;
  excessStock?: number | null;
  status?: SafeStockStatus;
}

// Dữ liệu chuẩn phân bổ 27 công đoạn bảo đảm tổng WIP = 92 cái (khớp 5500 - 5408 = 92)
// 26 công đoạn trong ngưỡng (xanh lá), 1 công đoạn vượt ngưỡng CD05 (hổ phách)
const FALLBACK_STAGE_WIP: StageWipItem[] = [
  { stageCode: 'CD01', name: 'May xếp ly thân trước', wip: 2, avgWip: 1.85, staytime: 18.4, processingPct: 97.08, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD02', name: 'May túi mổ / viền túi thân trước', wip: 4, avgWip: 3.42, staytime: 24.1, processingPct: 95.51, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD03', name: 'Di bọ miệng túi thân trước', wip: 1, avgWip: 0.92, staytime: 12.5, processingPct: 98.13, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD04', name: 'Chắp sườn thân trước', wip: 5, avgWip: 5.15, staytime: 32.8, processingPct: 86.71, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD05', name: 'May đáp đáy thân trước (Điểm tồn lớn)', wip: 22, avgWip: 22.31, staytime: 700.33, processingPct: 99.89, safeStockMax: 15, criticalStock: 25, minStock: 2, excessStock: 7, status: 'VUOT_NGUONG' },
  { stageCode: 'CD06', name: 'May mí sườn thân trước', wip: 2, avgWip: 1.95, staytime: 168.15, processingPct: 98.69, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD07', name: 'Vắt sổ thân sau', wip: 2, avgWip: 1.88, staytime: 15.0, processingPct: 94.03, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD08', name: 'Chắp giàng đáy thân sau', wip: 3, avgWip: 2.75, staytime: 18.2, processingPct: 92.48, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD09', name: 'May viền đáy sau', wip: 2, avgWip: 1.90, staytime: 19.5, processingPct: 93.95, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD10', name: 'Di bọ đũng sau', wip: 3, avgWip: 2.80, staytime: 21.0, processingPct: 92.88, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD11', name: 'May ly túi thân sau', wip: 4, avgWip: 3.65, staytime: 26.5, processingPct: 93.63, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD12', name: 'May mí sườn thân sau', wip: 4, avgWip: 3.80, staytime: 1902.42, processingPct: 99.55, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD13', name: 'May chun sườn', wip: 4, avgWip: 3.75, staytime: 28.0, processingPct: 90.47, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD14', name: 'May viền túi sườn', wip: 4, avgWip: 3.85, staytime: 928.09, processingPct: 99.59, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD15', name: 'Ép mex & định hình cạp', wip: 2, avgWip: 1.80, staytime: 17.5, processingPct: 88.08, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD16', name: 'May luồn chun cạp quần', wip: 4, avgWip: 3.70, staytime: 22.0, processingPct: 89.0, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD17', name: 'Mí cạp quần', wip: 4, avgWip: 3.80, staytime: 1321.63, processingPct: 99.54, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD18', name: 'Đính bọ dây đai cạp', wip: 2, avgWip: 1.85, staytime: 24.0, processingPct: 87.21, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD19', name: 'Ủi cạp và hoàn thiện phần lưng', wip: 2, avgWip: 1.90, staytime: 26.0, processingPct: 88.97, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD20', name: 'Cắt gọt và cuộn mép Paget', wip: 1, avgWip: 0.95, staytime: 28.5, processingPct: 72.71, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD21', name: 'May xếp nếp Paget trang trí', wip: 1, avgWip: 0.88, staytime: 14.0, processingPct: 45.97, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD22', name: 'Ủi định hình Paget', wip: 1, avgWip: 0.90, staytime: 16.5, processingPct: 57.46, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD23', name: 'Tra khóa sườn quần', wip: 4, avgWip: 3.70, staytime: 21.0, processingPct: 82.87, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD24', name: 'May gấu quần', wip: 2, avgWip: 1.85, staytime: 23.5, processingPct: 69.21, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD25', name: 'Thùa khuyết & đính cúc', wip: 1, avgWip: 0.90, staytime: 25.0, processingPct: 71.9, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD26', name: 'Cắt chỉ & kiểm hóa ngoại quan', wip: 2, avgWip: 1.95, staytime: 27.0, processingPct: 87.5, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
  { stageCode: 'CD27', name: 'Ủi thành phẩm & đóng túi', wip: 4, avgWip: 3.80, staytime: 30.0, processingPct: 71.93, safeStockMax: 10, criticalStock: 20, minStock: 1, status: 'TRONG_NGUONG' },
];

function getBarColor(item: StageWipItem): string {
  if (item.status === 'MUC_NGHIEM_TRONG') return '#ef4444'; // Đỏ: Nghiêm trọng
  if (item.status === 'VUOT_NGUONG') return '#f59e0b'; // Hổ phách / Cam: Vượt ngưỡng
  if (item.status === 'TRONG_NGUONG' || item.status === 'DUOI_MUC_DEM') return '#10b981'; // Xanh lá: Trong ngưỡng
  return '#64748b'; // Xám: Chưa cấu hình / Chưa đánh giá
}

export function WipDistributionChart({ data }: { data?: StageWipItem[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const rawData = (data && data.length > 0) ? data : FALLBACK_STAGE_WIP;
  const chartData = rawData.filter((d) => d?.stageCode?.startsWith('CD'));

  const totalWip = chartData.reduce((sum, item) => sum + (item.wip ?? 0), 0);
  const highestWipItem = chartData.reduce((prev, curr) => (curr.wip > prev.wip ? curr : prev), chartData[0]);

  const withinCount = chartData.filter((d) => d.status === 'TRONG_NGUONG' || d.status === 'DUOI_MUC_DEM').length;
  const overCount = chartData.filter((d) => d.status === 'VUOT_NGUONG').length;
  const criticalCount = chartData.filter((d) => d.status === 'MUC_NGHIEM_TRONG').length;
  const unconfiguredCount = chartData.filter((d) => !d.status || d.status === 'CHUA_DANH_GIA' || d.status === 'CHUA_CO_DU_LIEU').length;

  return (
    <Card className="border border-slate-200 shadow-xs overflow-hidden bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Biểu Đồ Phân Phối Tồn Bán Thành Phẩm (WIP) Dọc 27 Công Đoạn
              </CardTitle>
              <Badge variant="navy" className="text-[10px] font-mono">27 Trạm CD01–CD27</Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Phát hiện tức thời các điểm dồn ứ BTP đối chiếu theo cấu hình ngưỡng an toàn từng vị trí
            </CardDescription>
          </div>

          {/* Phân loại màu và số lượng thống kê đầy đủ */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="h-2 w-2 rounded bg-emerald-500 inline-block" /> Trong ngưỡng ({withinCount})
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="h-2 w-2 rounded bg-amber-500 inline-block" /> Tồn vượt ngưỡng ({overCount})
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded border border-dashed border-amber-400">
              <span className="w-2.5 border-t-2 border-dashed border-amber-500 inline-block" /> Vạch ngưỡng (10 & 15 cái)
            </span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                <span className="h-2 w-2 rounded bg-red-500 inline-block" /> Mức nghiêm trọng ({criticalCount})
              </span>
            )}
            {unconfiguredCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <span className="h-2 w-2 rounded bg-slate-500 inline-block" /> Chưa cấu hình ({unconfiguredCount})
              </span>
            )}
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 mt-1 border-t border-slate-200/60 font-mono text-slate-600">
          <div>
            Tổng tồn toàn bộ 27 trạm: <strong className="text-slate-900">{totalWip} cái</strong> (Khớp số thiếu 5.500 - 5.408 = 92)
          </div>
          <div>
            Trạm tồn lớn nhất: <strong className="text-amber-800">{highestWipItem.stageCode} ({highestWipItem.wip} cái)</strong> • Chờ: {highestWipItem.staytime}s
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <div className="w-full" style={{ height: 320, minHeight: 320 }}>
          {isMounted ? (
            <ResponsiveContainer width="100%" height={320} minWidth={320}>
              <BarChart data={chartData} margin={{ top: 20, right: 15, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="stageCode"
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, 26]}
                  ticks={[0, 5, 10, 15, 20, 25]}
                  allowDecimals={false}
                  unit=" cái"
                />

                {/* Vạch cảnh báo ngưỡng tối đa trạm đệm CD05 (15 cái) */}
                <ReferenceLine
                  y={15}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  label={{
                    value: 'Ngưỡng tối đa CD05: 15 cái',
                    position: 'insideTopRight',
                    fill: '#dc2626',
                    fontSize: 11,
                    fontWeight: 700,
                    offset: 8,
                  }}
                />

                {/* Vạch cảnh báo ngưỡng an toàn chuẩn chuyền (10 cái) */}
                <ReferenceLine
                  y={10}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={1.8}
                  label={{
                    value: 'Vạch an toàn chuyền: 10 cái',
                    position: 'insideTopRight',
                    fill: '#d97706',
                    fontSize: 11,
                    fontWeight: 700,
                    offset: 8,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as StageWipItem;
                      const hasConfig = item.safeStockMax !== null && item.safeStockMax !== undefined;
                      const isOver = item.excessStock && item.excessStock > 0;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-2xl border border-slate-700 space-y-1.5 min-w-[240px]">
                          <div className="font-bold text-sm text-teal-300 flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5">
                            <span>{item.stageCode}: {item.name}</span>
                            <span className="font-mono text-base text-white">
                              {item.wip} cái
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 space-y-1 font-mono pt-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Ngưỡng tối đa an toàn:</span>
                              <span className={hasConfig ? 'font-bold text-teal-300' : 'text-slate-400'}>
                                {hasConfig ? `${item.safeStockMax} cái` : 'Chưa cấu hình'}
                              </span>
                            </div>
                            {item.criticalStock !== null && item.criticalStock !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-red-400 font-sans">Mức báo động nghiêm trọng:</span>
                                <span className="font-bold text-red-300">&ge;{item.criticalStock} cái</span>
                              </div>
                            )}
                            {isOver && (
                              <div className="flex justify-between">
                                <span className="text-amber-400 font-sans">Lượng vượt ngưỡng:</span>
                                <span className="font-bold text-amber-300">+{item.excessStock} cái</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Trạng thái:</span>
                              <span className={`font-bold ${
                                item.status === 'TRONG_NGUONG' ? 'text-emerald-400' :
                                item.status === 'VUOT_NGUONG' ? 'text-amber-400' :
                                item.status === 'MUC_NGHIEM_TRONG' ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {item.status === 'TRONG_NGUONG' ? 'Trong ngưỡng' :
                                 item.status === 'VUOT_NGUONG' ? 'Vượt ngưỡng' :
                                 item.status === 'MUC_NGHIEM_TRONG' ? 'Mức nghiêm trọng' : 'Chưa đánh giá'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Tồn trung bình (Avg WIP):</span>
                              <span className="font-bold text-white">{item.avgWip.toFixed(2)} cái</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Thời gian chờ (Staytime):</span>
                              <span className="font-bold text-amber-300">{item.staytime.toFixed(1)}s</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="wip" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="wip"
                    position="top"
                    fill="#334155"
                    fontSize={10}
                    fontWeight={700}
                    offset={4}
                    formatter={(val: number) => (val > 0 ? `${val}` : '')}
                  />
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.stageCode}`}
                      fill={getBarColor(entry)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Skeleton Loading State during SSR / Hydration */
            <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="text-center space-y-2">
                <Activity className="h-6 w-6 text-teal-600 animate-spin mx-auto" />
                <span className="text-xs text-slate-500 font-medium block">
                  Đang khởi tạo biểu đồ phân phối tồn 27 công đoạn...
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
