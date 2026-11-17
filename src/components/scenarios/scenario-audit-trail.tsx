'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  History,
  GitCommit,
  User,
  Clock,
  ArrowRight,
  Sliders,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Split,
  Eye,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  author: string;
  role: string;
  action: 'UPDATE_PROCESS_TIME' | 'MODIFY_TRANSFER_THRESHOLD' | 'ADJUST_FEEDING_SCHEDULE' | 'CREATE_SCENARIO';
  title: string;
  scenarioCode: string;
  paramName: string;
  beforeVal: string;
  afterVal: string;
  diffSummary: string;
  rationale: string;
}

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_01',
    timestamp: '15/11/2026 15:42:10',
    author: 'Thành viên Nhóm 2',
    role: 'ADMIN',
    action: 'UPDATE_PROCESS_TIME',
    title: 'Đồng bộ chu kỳ gia công 4 vị trí nút thắt',
    scenarioCode: 'PA_DongBo',
    paramName: 'processTimeFactor (k)',
    beforeVal: 'k = 1.00 (Chuẩn định mức 100%)',
    afterVal: 'k = 0.90 (Giảm 10% tại CD05, CD12, CD14, CD17)',
    diffSummary: 'CD05: 35.0s → 31.5s | CD12: 34.5s → 31.0s | CD14: 34.0s → 30.6s | CD17: 34.5s → 31.0s',
    rationale: 'Chuẩn hóa cữ gá máy may công nghiệp và phương pháp thao tác may đáp đáy theo Kaizen nhóm 2 để kéo giảm 83.7% tồn dồn ứ.',
  },
  {
    id: 'log_02',
    timestamp: '15/11/2026 14:15:30',
    author: 'Thành viên Nhóm 2',
    role: 'MANAGER',
    action: 'MODIFY_TRANSFER_THRESHOLD',
    title: 'Cập nhật ngưỡng kích hoạt điều chuyển OP_04_05',
    scenarioCode: 'PA_DongBo',
    paramName: 'transferThreshold (Q_CD05)',
    beforeVal: 'Ngưỡng đi: >= 20 cái | Ngưỡng về: <= 5 cái',
    afterVal: 'Ngưỡng đi: >= 15 cái | Ngưỡng về: <= 8 cái',
    diffSummary: 'Kích hoạt sớm hơn 5 cái, hồi vị trí chính khi tồn giảm về 8',
    rationale: 'Kích hoạt công nhân điều chuyển OP_04_05 sớm hơn để ngăn chặn việc hàng chờ Q_CD05 tràn lên trên 25 cái gây quá tải.',
  },
  {
    id: 'log_03',
    timestamp: '14/11/2026 09:20:00',
    author: 'Thành viên Nhóm 2',
    role: 'MANAGER',
    action: 'ADJUST_FEEDING_SCHEDULE',
    title: 'Khóa lịch cấp phôi 4 nguồn nguyên liệu theo đơn hàng',
    scenarioCode: 'HT (Baseline)',
    paramName: 'Source Inter-arrival Time',
    beforeVal: 'Cấp phôi tự do không kiểm soát nhịp',
    afterVal: 'SRC_TT: 30.98s | SRC_TS: 32.46s | SRC_LUNG: 33.88s | SRC_PAGET: 34.02s',
    diffSummary: 'Đồng bộ nhịp cấp phôi Takt Time với công suất SINK_TP',
    rationale: 'Bảo đảm tổng cấp phôi đạt 5.500 bộ/171.000s, không để xảy ra tình trạng cấp phôi dồn dập vào đầu ca.',
  },
];

export function ScenarioAuditTrail() {
  const [selectedLogId, setSelectedLogId] = useState<string>('log_01');

  const selectedLog = AUDIT_LOGS.find((l) => l.id === selectedLogId) || AUDIT_LOGS[0];

  return (
    <Card className="border border-slate-200 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <History className="h-5 w-5 text-indigo-600" />
              Nhật Ký Thay Đổi Cấu Hình Phương Án & Đối Chiếu Thông Số (Parameter Diff)
            </CardTitle>
            <CardDescription className="text-xs">
              Lưu vết định danh người thực hiện, thời điểm, thông số trước/sau khi sửa Process Time, ngưỡng chuyển người hoặc lịch cấp liệu
            </CardDescription>
          </div>

          <Badge variant="navy" className="text-[10px]">
            Toàn vẹn dữ liệu Mục 20
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Interactive Side-by-Side Parameter Diff */}
        <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-teal-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-teal-300">
                Đối Chiếu Cấu Hình Thông Số: {selectedLog.title}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Phương án: <strong>{selectedLog.scenarioCode}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Trước khi đổi */}
            <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/60 space-y-1">
              <div className="flex items-center justify-between text-red-300 font-sans font-bold text-[11px]">
                <span>Cấu hình TRƯỚC khi đổi (Old)</span>
                <span className="text-[10px] text-red-400 font-mono">- Trước</span>
              </div>
              <div className="text-slate-200 font-bold pt-1">{selectedLog.beforeVal}</div>
            </div>

            {/* Sau khi đổi */}
            <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-800/60 space-y-1">
              <div className="flex items-center justify-between text-emerald-300 font-sans font-bold text-[11px]">
                <span>Cấu hình SAU khi đổi (New Kaizen)</span>
                <span className="text-[10px] text-emerald-400 font-mono">+ Mới</span>
              </div>
              <div className="text-teal-200 font-bold pt-1">{selectedLog.afterVal}</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div><strong className="text-teal-300 font-sans">Chi tiết chênh lệch (Diff):</strong> {selectedLog.diffSummary}</div>
            <div><strong className="text-amber-300 font-sans">Cơ sở lý do điều chỉnh:</strong> {selectedLog.rationale}</div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Lịch Sử Các Bản Ghi Hiệu Chỉnh Đã Ghi Nhận:
          </span>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {AUDIT_LOGS.map((log) => {
              const isSelected = selectedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{log.title}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.scenarioCode}
                      </Badge>
                      <span className="text-[10px] font-mono text-slate-400">{log.paramName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{log.author}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <Button
                    variant={isSelected ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs gap-1 shrink-0"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{isSelected ? 'Đang xem' : 'Xem Diff'}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
