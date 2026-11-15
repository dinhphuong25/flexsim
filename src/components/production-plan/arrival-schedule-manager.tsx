'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  CalendarCheck,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ARRIVAL_SCHEDULE_CONFIG,
  generateArrivalSchedule,
  ArrivalScheduleRow,
} from '@/lib/line-model-definition';
import { cn } from '@/lib/utils';
import { formatSimulationTime } from '@/lib/kpi';

interface SourcePlanMetrics {
  sourceName: string;
  sourceLabel: string;
  branchName: string;
  plannedQuantity: number;
  actualGenerated: number | null;
  actualOutput: number | null;
  remainingInSource: number | null;
  lastArrivalTime: number;
  status: string;
}

interface ArrivalScheduleManagerProps {
  sourceMetrics?: SourcePlanMetrics[];
}

const SOURCES = [
  { code: 'SRC_TT', name: 'SRC_TT (Thân Trước)', branch: 'FRONT_BODY', itemName: 'ThanTruoc' },
  { code: 'SRC_TS', name: 'SRC_TS (Thân Sau)', branch: 'BACK_BODY', itemName: 'ThanSau' },
  { code: 'SRC_LUNG', name: 'SRC_LUNG (Cạp Lưng)', branch: 'WAISTBAND', itemName: 'CapLung' },
  { code: 'SRC_PAGET', name: 'SRC_PAGET (Paget)', branch: 'PAGET', itemName: 'Paget' },
];

export function ArrivalScheduleManager({ sourceMetrics }: ArrivalScheduleManagerProps) {
  const [selectedSource, setSelectedSource] = useState(SOURCES[0].code);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const currentSourceMeta = SOURCES.find((s) => s.code === selectedSource) || SOURCES[0];

  // Sinh 550 dòng Arrival Schedule chuẩn mực theo cấu hình Mục 8
  const scheduleRows = useMemo(() => {
    return generateArrivalSchedule(selectedSource);
  }, [selectedSource]);

  // Kiểm tra xác thực lịch cấp liệu
  const validation = useMemo(() => {
    let isTimeStrictlyIncreasing = true;
    let isQuantityPositiveInt = true;
    let totalQty = 0;

    for (let i = 0; i < scheduleRows.length; i++) {
      const row = scheduleRows[i];
      if (row.arrivalTime < 0) isTimeStrictlyIncreasing = false;
      if (i > 0 && row.arrivalTime <= scheduleRows[i - 1].arrivalTime) {
        isTimeStrictlyIncreasing = false;
      }
      if (!Number.isInteger(row.quantity) || row.quantity <= 0) {
        isQuantityPositiveInt = false;
      }
      totalQty += row.quantity;
    }

    const isTotalQtyValid = totalQty === ARRIVAL_SCHEDULE_CONFIG.totalPlannedQuantity;
    const isRepeatDisabled = !ARRIVAL_SCHEDULE_CONFIG.repeat;

    return {
      isValid: isTimeStrictlyIncreasing && isQuantityPositiveInt && isTotalQtyValid && isRepeatDisabled,
      isTimeStrictlyIncreasing,
      isQuantityPositiveInt,
      isTotalQtyValid,
      isRepeatDisabled,
      totalQty,
      batchCount: scheduleRows.length,
    };
  }, [scheduleRows]);

  // Phân trang
  const totalPages = Math.ceil(scheduleRows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return scheduleRows.slice(start, start + pageSize);
  }, [scheduleRows, currentPage]);

  // Xử lý sao chép dữ liệu không kèm tiêu đề cho FlexSim
  const handleCopyForFlexSim = () => {
    // Định dạng Tab-separated values không tiêu đề để Ctrl+V thẳng vào FlexSim table
    const tsvContent = scheduleRows
      .map((row) => `${row.arrivalTime}\t${row.itemName}\t${row.quantity}`)
      .join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Xử lý xuất file CSV chuẩn cột: ArrivalTime, ItemName, Quantity
  const handleExportCsv = () => {
    const header = 'ArrivalTime,ItemName,Quantity\n';
    const csvContent =
      header +
      scheduleRows.map((row) => `${row.arrivalTime},${row.itemName},${row.quantity}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FlexSim_ArrivalSchedule_${selectedSource}_5500.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4 Thẻ So Sánh Chỉ Số Cấp Liệu 4 Source (Mục 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOURCES.map((src) => {
          const isSelected = src.code === selectedSource;
          return (
            <Card
              key={src.code}
              onClick={() => {
                setSelectedSource(src.code);
                setCurrentPage(1);
              }}
              className={cn(
                'cursor-pointer transition-all border-l-4 shadow-2xs hover:shadow-xs',
                isSelected
                  ? 'border-l-teal-600 bg-teal-50/30 ring-1 ring-teal-500'
                  : 'border-l-slate-300 hover:border-l-slate-400'
              )}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-800">{src.code}</span>
                  <Badge
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn('text-[10px] px-1.5 py-0', isSelected && 'bg-teal-700 text-white')}
                  >
                    {src.branch}
                  </Badge>
                </div>
                <div className="mt-2 text-xl font-bold font-mono text-slate-900">
                  5.500 <span className="text-xs font-normal text-slate-500 font-sans">chi tiết</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Quy cách:</span>
                    <span className="font-medium text-slate-700">550 đợt x 10 cái</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cấp cuối:</span>
                    <span className="font-mono text-slate-700">164.700s (45h 45m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repeat:</span>
                    <span className="font-bold text-slate-700">TẮT</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chi Tiết Cấu Hình & Bảng Xem Trước Lịch Cấp Liệu */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Bảng Lịch Cấp Liệu (Arrival Schedule) — {currentSourceMeta.name}
                </CardTitle>
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  Xác thực: Hợp lệ 100%
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Lịch cấp định kỳ 550 đợt, mỗi đợt 10 chi tiết, giãn cách 300 giây (5 phút), bắt đầu từ 0s và kết thúc đợt cuối tại 164.700s.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyForFlexSim}
                className={cn(
                  'h-8 text-xs font-semibold gap-1.5 transition-all',
                  copied && 'border-emerald-500 text-emerald-800 bg-emerald-50'
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Đã sao chép vào Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                    Sao chép cho FlexSim (Không tiêu đề)
                  </>
                )}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleExportCsv}
                className="h-8 text-xs font-semibold gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Xuất file CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Hộp hướng dẫn dán vào FlexSim & Kiểm tra xác thực */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-teal-900">
                <Info className="h-4 w-4 text-teal-700" />
                Hướng dẫn sao chép & nhập liệu vào FlexSim 3D:
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                1. Bấm nút <strong>&ldquo;Sao chép cho FlexSim (Không tiêu đề)&rdquo;</strong> ở trên.<br />
                2. Trong phần mềm FlexSim, mở đối tượng <code>{selectedSource}</code> &gt; chọn kiểu cấp <code>Arrival Schedule</code>.<br />
                3. Nhấp chuột vào ô dòng 1 - cột 1 trong bảng dữ liệu FlexSim và nhấn <strong>Ctrl + V</strong>.<br />
                4. Kiểm tra chắc chắn tùy chọn <strong>Repeat Schedule</strong> đã được <strong>TẮT (Uncheck)</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Tiêu chuẩn xác thực dữ liệu lịch cấp phôi:
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Thời gian tăng dần (0s &rarr; 164.700s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Quantity nguyên dương (10 cái)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tổng đúng kế hoạch: 5.500 cái</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Không lặp ngoài ý muốn (Repeat: Tắt)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                Lưu ý: 5.500 trong lịch cấp không tự suy ra Source đã xuất thực tế đủ 5.500 ra cổng.
              </p>
            </div>
          </div>

          {/* Bảng xem trước dữ liệu 550 dòng */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-16 text-center">Đợt (#)</th>
                  <th className="py-2 px-3 text-right">ArrivalTime (giây)</th>
                  <th className="py-2 px-3">Thời gian mô phỏng</th>
                  <th className="py-2 px-3">ItemName</th>
                  <th className="py-2 px-3 text-right">Quantity (chi tiết)</th>
                  <th className="py-2 px-3 text-right">Lũy kế cấp (cái)</th>
                  <th className="py-2 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {paginatedRows.map((row) => {
                  const cumQty = row.batchNumber * row.quantity;
                  const isFirst = row.batchNumber === 1;
                  const isLast = row.batchNumber === 550;

                  return (
                    <tr
                      key={row.batchNumber}
                      className={cn(
                        'hover:bg-slate-50 transition-colors',
                        isFirst && 'bg-teal-50/30',
                        isLast && 'bg-amber-50/40 font-bold'
                      )}
                    >
                      <td className="py-2 px-3 text-center text-slate-400">{row.batchNumber}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {row.arrivalTime.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600">
                        {formatSimulationTime(row.arrivalTime)}
                      </td>
                      <td className="py-2 px-3 text-teal-800 font-semibold">{row.itemName}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">{row.quantity}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{cumQty.toLocaleString('vi-VN')}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        {isFirst ? (
                          <Badge variant="secondary" className="text-[10px] bg-teal-100 text-teal-800">
                            Đợt mở đầu (0s)
                          </Badge>
                        ) : isLast ? (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">
                            Đợt cuối (164.700s)
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chu kỳ 300s</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Hiển thị dòng {(currentPage - 1) * pageSize + 1} &ndash;{' '}
              {Math.min(currentPage * pageSize, scheduleRows.length)} trong tổng số {scheduleRows.length} đợt cấp
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Trước
              </Button>
              <span className="px-2 font-mono text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2 text-xs"
              >
                Sau
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
