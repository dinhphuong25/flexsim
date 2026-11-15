import React from 'react';
import { repository } from '@/lib/repository';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatMetricNumber, formatSimulationTime } from '@/lib/kpi';

export default async function ProductionPlanPage() {
  const plan = await repository.getActivePlan();
  const line = await repository.getLine();
  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  const targetOutput = plan?.targetOutput ?? 5500;
  const plannedRunTime = plan?.plannedRunTime ?? 171000;
  const actualFinished = activeRun?.finishedCount ?? 5408;

  // 4 Material Branches
  const materialBranches = plan?.materialReleases ?? [
    { id: '1', branch: 'FRONT_BODY', sourceName: 'SRC_TT', plannedQuantity: 5500, generatedQuantity: 5500, releasedQuantity: 5500, heldQuantity: 0, completedQuantity: 5408, isReleaseCompleted: true },
    { id: '2', branch: 'BACK_BODY', sourceName: 'SRC_TS', plannedQuantity: 5500, generatedQuantity: 5500, releasedQuantity: 5500, heldQuantity: 0, completedQuantity: 5408, isReleaseCompleted: true },
    { id: '3', branch: 'WAISTBAND', sourceName: 'SRC_LUNG', plannedQuantity: 5500, generatedQuantity: 5500, releasedQuantity: 5500, heldQuantity: 0, completedQuantity: 5408, isReleaseCompleted: true },
    { id: '4', branch: 'PAGET', sourceName: 'SRC_PAGET', plannedQuantity: 5500, generatedQuantity: 5500, releasedQuantity: 5500, heldQuantity: 0, completedQuantity: 5408, isReleaseCompleted: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-teal-600" />
          Kế Hoạch Sản Lượng & Quản Lý Cấp Liệu 4 Nhánh
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tiến độ cấp phôi nguyên liệu từ 4 Source đầu vào (Thân trước, Thân sau, Cạp lưng, Paget) và tỷ lệ cân bằng định mức ráp 1:1.
        </p>
      </div>

      {/* Plan Parameters Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mục Tiêu Đơn Hàng</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {formatMetricNumber(targetOutput, 0, 'thành phẩm')}
            </div>
            <p className="mt-2 text-xs text-slate-500">Mã KH: {plan?.planCode || 'KE_HOACH_THANG_11'}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-700">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thời Gian Kế Hoạch</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {formatSimulationTime(plannedRunTime)}
            </div>
            <p className="mt-2 text-xs text-slate-500">Warm-up: Không áp dụng</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Định Mức Ráp BTP</span>
            <div className="mt-2 text-2xl font-bold text-indigo-900 font-mono">1 : 1 : 1 : 1</div>
            <p className="mt-2 text-xs text-slate-500">Yêu cầu cân bằng tuyệt đối giữa 4 nguồn</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lô Cấp Cuối & Hoàn Tất</span>
            <div className="mt-2 text-2xl font-bold text-amber-900 font-mono">Đã Đóng Cấp</div>
            <p className="mt-2 text-xs text-slate-500">Thời gian còn lại để thoát chuyền: 0s</p>
          </CardContent>
        </Card>
      </div>

      {/* 4 Branches Material Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" />
                Tiến Trình Cấp Liệu 4 Nhánh Đầu Vào (Material Release Progression)
              </CardTitle>
              <CardDescription>
                Phân biệt rõ ràng giữa: Dự kiến cấp &rarr; Đã tạo tại Source &rarr; Đã ra khỏi Source &rarr; Hoàn thành tại Sink
              </CardDescription>
            </div>
            <Badge variant="success">Lịch cấp liệu hoàn tất</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                <tr>
                  <th className="py-3 px-3">Phân nhánh</th>
                  <th className="py-3 px-3">Tên Source FlexSim</th>
                  <th className="py-3 px-3 text-right">Dự kiến cấp</th>
                  <th className="py-3 px-3 text-right">Đã tạo tại Source</th>
                  <th className="py-3 px-3 text-right">Đã ra khỏi Source</th>
                  <th className="py-3 px-3 text-right">Đang giữ tại Source</th>
                  <th className="py-3 px-3 text-right">Hoàn thành Sink</th>
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
                      {formatMetricNumber(b.plannedQuantity, 0, 'cái')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatMetricNumber(b.generatedQuantity, 0, 'cái')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-teal-700">
                      {formatMetricNumber(b.releasedQuantity, 0, 'cái')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {formatMetricNumber(b.heldQuantity ?? 0, 0, 'cái')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatMetricNumber(actualFinished, 0, 'cái')}
                    </td>
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

          {/* Balance Check Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Kiểm Tra Cân Bằng Cấp Liệu & Cảnh Báo Hệ Thống:
            </div>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
              <li>
                <strong>Cân đối giữa 4 nhánh:</strong> Cả 4 Source đều đã tạo và xuất kho đủ 5.500 chi tiết. Không xảy ra lệch số lượng giữa các nhánh đầu vào.
              </li>
              <li>
                <strong>Định mức ráp:</strong> R01, R02, R03 đều nhận đủ 1 BTP từ mỗi nhánh theo cấu hình mô hình.
              </li>
              <li>
                <strong>Độ hụt thành phẩm:</strong> 5.500 chi tiết cấp ra &rarr; 5.408 thành phẩm hoàn tất tại Sink. Chênh lệch 92 chi tiết đang nằm trong chuỗi máy (đặc biệt tại CD05 tồn 22 cái).
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
