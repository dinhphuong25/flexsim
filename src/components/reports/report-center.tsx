'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileSpreadsheet, Download, FileText, CheckCircle2, ShieldCheck, Layers, Users, Calendar } from 'lucide-react';

interface ReportRunInfo {
  id: string;
  runCode: string;
  dataSource: string;
  sourceDescription?: string;
  finishedCount: number | null;
  targetCount: number;
  runTimeSeconds: number;
}

export function ReportCenter({
  runs,
}: {
  runs: ReportRunInfo[];
}) {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.id || '');
  const [reportType, setReportType] = useState<'STAGE_METRICS' | 'RUN_OVERVIEW' | 'WORKERS'>('STAGE_METRICS');
  const [isExporting, setIsExporting] = useState(false);

  const selectedRun = runs.find((r) => r.id === selectedRunId) || runs[0];

  const handleDownload = (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    const url = `/api/reports/export?runId=${selectedRun.id}&type=${reportType}&format=${format}`;
    window.open(url, '_blank');
    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-teal-600" />
          Trung Tâm Xuất Báo Cáo Sản Xuất & Mô Phỏng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hỗ trợ trích xuất báo cáo định dạng CSV và Microsoft Excel (.xlsx) có xử lý an toàn chống Formula Injection, hỗ trợ font tiếng Việt UTF-8 BOM.
        </p>
      </div>

      {/* Filter and Selection Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết Lập Thông Số Báo Cáo</CardTitle>
          <CardDescription>Chọn lượt chạy và loại biểu mẫu cần trích xuất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Chọn Lượt Chạy Mô Phỏng Cần Xuất
              </label>
              <select
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.runCode} - {r.dataSource} ({r.finishedCount ?? '--'}/{r.targetCount} cái)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Loại Biểu Mẫu Thống Kê
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="STAGE_METRICS">Báo cáo chi tiết 27 Công đoạn & Tồn BTP (Stage Metrics)</option>
                <option value="RUN_OVERVIEW">Báo cáo tổng quan tiến độ sản lượng Sink (Run Overview)</option>
                <option value="WORKERS">Báo cáo phân bổ 34 Nhân sự chuyền may (Workers Allocation)</option>
              </select>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Thông tin metadata đi kèm báo cáo:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div>Mã lượt: {selectedRun?.runCode}</div>
              <div>Nguồn dữ liệu: {selectedRun?.dataSource}</div>
              <div>Mục tiêu: {selectedRun?.targetCount} cái</div>
              <div>Thành phẩm Sink: {selectedRun?.finishedCount ?? 'Chưa kết thúc'} cái</div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => handleDownload('xlsx')}
              disabled={isExporting}
              className="gap-2 bg-emerald-700 hover:bg-emerald-800"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất tệp Excel (.xlsx)
            </Button>

            <Button
              onClick={() => handleDownload('csv')}
              disabled={isExporting}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4 text-teal-600" />
              Xuất tệp CSV (UTF-8 BOM)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Standard Notice */}
      <Card className="border border-slate-200 bg-slate-50/50">
        <CardHeader className="py-4">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Tiêu Chuẩn Toàn Vẹn Báo Cáo (Tuân thủ Phần 19)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-600 space-y-1 pb-4">
          <p>
            - <strong>Chống CSV Formula Injection:</strong> Tất cả các trường văn bản bắt đầu bằng ký tự <code>=, +, -, @</code> được tự động khử độc để tránh lỗ hổng thực thi lệnh trên Excel.
          </p>
          <p>
            - <strong>Tính trung thực dữ liệu:</strong> Không xuất kết luận vượt quá dữ liệu đã đo. Các công đoạn chưa nhận được số liệu từ FlexSim giữ nguyên ô trống (null), không tự động gán giá trị 0.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
