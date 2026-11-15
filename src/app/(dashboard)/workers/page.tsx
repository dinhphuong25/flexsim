import React from 'react';
import { repository } from '@/lib/repository';
import { FLOATING_WORKERS } from '@/lib/line-model-definition';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeftRight, UserCheck, Shield, Info, Clock, AlertCircle } from 'lucide-react';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';

export default async function WorkersPage() {
  const workers = await repository.getAllWorkers();
  const fixedWorkers = workers.filter((w) => !w.isFloating);
  const floatingWorkers = workers.filter((w) => w.isFloating);

  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;
  const objectMetrics = activeRun ? await repository.getObjectMetricsByRunId(activeRun.id) : [];

  // Thống kê trạm hỗ trợ P_CD05B_HOTRO (OP_04_05)
  const cd05HotroMetric = objectMetrics.find((m) => m.flexsimName === 'P_CD05B_HOTRO');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-teal-600" />
          Phân Bổ Nhân Lực & 4 Công Nhân Điều Chuyển
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tổng số 34 nhân sự chuyền may (30 người cố định + 4 người điều chuyển hỗ trợ). Tuân thủ nguyên tắc không tự ý suy diễn thời gian nhàn rỗi khi chưa có dữ liệu đo đầy đủ.
        </p>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-slate-900">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng Nhân Lực Kế Hoạch
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-mono">34</span>
              <span className="text-xs text-slate-500 font-medium">người</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Bao gồm cả nhân sự cố định và điều chuyển (không cộng trùng)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Công Nhân Cố Định
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-teal-800 font-mono">{fixedWorkers.length}</span>
              <span className="text-xs text-slate-500 font-medium">người (OP_01 &rarr; OP_30)</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Đảm nhiệm các máy may đơn và trạm A của cụm song song
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Công Nhân Điều Chuyển Hỗ Trợ
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-800 font-mono">{floatingWorkers.length}</span>
              <span className="text-xs text-slate-500 font-medium">người linh hoạt</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Di chuyển giữa 2 trạm máy tùy theo mức ứ đọng hàng chờ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Workers Section */}
      <Card className="border border-indigo-200 bg-indigo-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-indigo-950">
                <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
                Chi Tiết 4 Công Nhân Điều Chuyển & Trạm Hỗ Trợ
              </CardTitle>
              <CardDescription>
                Cơ chế chia sẻ tải giữa trạm B song song và trạm hỗ trợ chuyên biệt
              </CardDescription>
            </div>
            <Badge variant="navy">4 Nhân sự linh hoạt</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FLOATING_WORKERS.map((fw) => {
              const isOp05 = fw.workerCode === 'OP_04_05';
              return (
                <div
                  key={fw.workerCode}
                  className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {fw.workerCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{fw.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Điều chuyển 2 vị trí
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                    <div className="text-center">
                      <span className="text-[10px] font-sans text-slate-500 block">Vị trí A (Chính)</span>
                      <span className="font-bold text-slate-800">{fw.stationA}</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div className="text-center">
                      <span className="text-[10px] font-sans text-slate-500 block">Vị trí B (Hỗ trợ)</span>
                      <span className="font-bold text-indigo-700">{fw.stationB}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-0.5">Quy tắc điều chuyển:</span>
                    {fw.transferRule}
                  </div>

                  {isOp05 && cd05HotroMetric && (
                    <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-700 font-mono">
                      <span>Đã hỗ trợ CD05: <strong>{cd05HotroMetric.outputCount} cái</strong></span>
                      <span>Tải hỗ trợ: <strong>{formatPercentage(cd05HotroMetric.processingPct)}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý nguyên tắc Mục 8:</strong> Khi công nhân điều chuyển không Processing tại trạm hỗ trợ, họ đang thực hiện gia công tại trạm chính (vị trí A) hoặc di chuyển theo logic mô hình. Không được lấy thời gian không Processing tại trạm hỗ trợ làm toàn bộ thời gian nhàn rỗi của người đó. Hệ thống không tạo các quyết định nhân sự tự động.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-teal-600" />
            Danh Sách 30 Công Nhân Cố Định Theo Công Đoạn
          </CardTitle>
          <CardDescription>
            Bố trí cố định tại từng vị trí máy quy trình
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {fixedWorkers.map((w) => (
              <div
                key={w.id}
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs hover:bg-slate-100 transition-colors"
              >
                <div className="font-mono font-bold text-slate-800">{w.workerCode}</div>
                <div className="text-[11px] text-slate-600 truncate">{w.name}</div>
                <div className="text-[10px] text-teal-700 font-mono mt-1">
                  Trạm: {w.primaryStation || 'Theo chuyền'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
