'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Settings, ShieldCheck, AlertTriangle, ArrowRightLeft, Info } from 'lucide-react';
import {
  REFERENCE_CONTROL_CONFIGS,
  OPERATOR_MODES,
  StageControlConfig,
} from '@/lib/line-model-definition';

export function StageControlConfigCard() {
  return (
    <Card className="border border-slate-200 shadow-xs">
      <CardHeader className="py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-teal-600" />
              Cấu Hình Điều Khiển Ngưỡng Động &amp; Điều Chuyển Nhân Lực (Mục 10)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Thông số ngưỡng chuyển trạm (H/L), chế độ vận hành (CheDo) và chính sách kích hoạt giải phóng tồn cuối kỳ tại mốc 164.700s.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-teal-400 text-teal-800 bg-teal-50 text-xs">
            Phiên bản mô hình: v1.0-baseline
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Gợi ý vuốt ngang trên màn hình điện thoại */}
        <div className="flex items-center justify-between sm:hidden px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-md text-[11px] text-teal-800 font-medium">
          <span>Bảng 10 cột cấu hình ngưỡng</span>
          <span className="font-bold flex items-center gap-1">Vuốt ngang sang phải &rarr;</span>
        </div>

        {/* Bảng thông số 4 công đoạn trọng yếu */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
          <table className="min-w-[850px] w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Công đoạn</th>
                <th className="py-2.5 px-3">Operator FlexSim</th>
                <th className="py-2.5 px-3">Trạm gốc &harr; Trạm hỗ trợ</th>
                <th className="py-2.5 px-3 text-right">Ngưỡng Cao (H05)</th>
                <th className="py-2.5 px-3 text-right">Ngưỡng Thấp (L05)</th>
                <th className="py-2.5 px-3 text-right">Ngưỡng Phụ (H04)</th>
                <th className="py-2.5 px-3 text-center">Giai đoạn cuối (164.700s)</th>
                <th className="py-2.5 px-3 text-center">Biên tải (Thường / Cuối)</th>
                <th className="py-2.5 px-3 text-center">Chế độ ban đầu</th>
                <th className="py-2.5 px-3 text-center">Trạng thái thực tế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {REFERENCE_CONTROL_CONFIGS.map((cfg) => (
                <tr key={cfg.stageCode} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{cfg.stageCode}</td>
                  <td className="py-2.5 px-3 text-teal-800 font-semibold">{cfg.operatorCode}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 text-[11px]">
                    <code>{cfg.primaryStation}</code> &harr; <code>{cfg.supportStation}</code>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-red-600">{cfg.highThreshold} BTP</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{cfg.lowThreshold} BTP</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {cfg.highThresholdSecondary !== undefined ? `${cfg.highThresholdSecondary} BTP` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700 font-sans text-[11px]">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
                      H={cfg.finalPhaseH}, L={cfg.finalPhaseL}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                    {cfg.normalWorkloadMarginSeconds}s / {cfg.finalPhaseWorkloadMarginSeconds}s
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant="outline" className="text-[10px] border-slate-300">
                      CheDo = {cfg.initialMode}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-slate-400 font-sans italic text-[11px]">
                      {cfg.actualMode !== null ? `Chế độ ${cfg.actualMode}` : 'Chưa có dữ liệu'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4 Chế Độ Vận Hành (CheDo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {OPERATOR_MODES.map((mode) => (
            <div key={mode.code} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-teal-800">Chế độ {mode.code}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  CheDo = {mode.code}
                </Badge>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{mode.label}</p>
            </div>
          ))}
        </div>

        {/* Ghi chú quy chuẩn */}
        <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-teal-900">
            <Info className="h-4 w-4 text-teal-700" />
            Nguyên tắc điều khiển và điều chuyển nhân lực (Mục 10):
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px] pl-1">
            <li>
              <strong>Chuyển giao đoạn cuối tại 164.700s:</strong> Khi đạt mốc 164.700s (sau đợt cấp nguyên liệu thứ 550), ngưỡng kích hoạt hỗ trợ tự động giảm xuống H = 1, L = 0 và biên lệch tải giảm từ 600s xuống 180s nhằm dồn toàn bộ nguồn lực giải phóng tồn dở dang.
            </li>
            <li>
              <strong>Đánh dấu giá trị thiếu:</strong> Trạng thái vận hành thực tế của công nhân nếu chưa có dữ liệu nhật ký runtime từ FlexSim sẽ hiển thị rõ ràng là <em>“Chưa có dữ liệu”</em>, tuyệt đối không tự nội suy hoặc gán số liệu giả định.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
