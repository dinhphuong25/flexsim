'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Filter,
  Search,
  Info,
  Package,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMetricNumber } from '@/lib/kpi';

export interface AuditedObjectItem {
  id: string;
  flexsimName: string;
  objectType: 'SOURCE' | 'QUEUE' | 'PROCESSOR' | 'COMBINER';
  branch?: string;
  branchLabel?: string;
  currentContent: number | null;
  inputCount: number | null;
  outputCount: number | null;
  isAudited: boolean;
  status: 'EMPTY' | 'HAS_WIP' | 'MISSING_DATA';
  sampleTimestamp: string;
  notes?: string;
}

interface EndOfRunInventoryAuditProps {
  items: AuditedObjectItem[];
  runCode?: string;
  runTimeSeconds?: number;
  sourceDescription?: string;
}

const TYPE_LABELS: Record<string, string> = {
  SOURCE: 'Source (Nguồn phôi)',
  QUEUE: 'Queue (Hàng chờ BTP)',
  PROCESSOR: 'Processor (Trạm may)',
  COMBINER: 'Combiner (Trạm ráp)',
};

export function EndOfRunInventoryAudit({
  items,
  runCode = 'RUN_CHOT_5427',
  runTimeSeconds = 171000,
  sourceDescription = 'Ảnh kết quả đã chốt',
}: EndOfRunInventoryAuditProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HAS_WIP' | 'MISSING_DATA' | 'EMPTY'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Thống kê tổng hợp phạm vi kiểm kê thực tế
  const totalScopeItems = items.length;
  const sourceCount = items.filter((i) => i.objectType === 'SOURCE').length;
  const queueCount = items.filter((i) => i.objectType === 'QUEUE').length;
  const processorCount = items.filter((i) => i.objectType === 'PROCESSOR').length;
  const combinerCount = items.filter((i) => i.objectType === 'COMBINER').length;

  const auditedCount = items.filter((i) => i.isAudited && i.currentContent !== null).length;
  const missingDataCount = items.filter((i) => i.status === 'MISSING_DATA' || i.currentContent === null).length;
  const hasWipCount = items.filter((i) => i.status === 'HAS_WIP' && (i.currentContent ?? 0) > 0).length;
  const emptyCount = items.filter((i) => i.status === 'EMPTY' && i.currentContent === 0).length;

  // Tính tổng tồn tạm tính trên các vị trí ĐÃ có dữ liệu (không tự biến missing thành 0)
  const provisionalWipTotal = items.reduce((sum, i) => {
    return sum + (i.currentContent !== null ? i.currentContent : 0);
  }, 0);

  // Đánh giá trạng thái toàn chuyền
  const isLineClearConfirmed = missingDataCount === 0 && hasWipCount === 0 && totalScopeItems > 0;
  const lineClearStatusLabel = isLineClearConfirmed
    ? 'Hết tồn cuối kỳ toàn chuyền (ĐÃ XÁC NHẬN)'
    : missingDataCount > 0
    ? 'Chưa xác nhận hết tồn toàn chuyền'
    : `Còn tồn cuối kỳ (${provisionalWipTotal} BTP tại ${hasWipCount} vị trí)`;

  // Lọc danh sách hiển thị
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Bộ lọc trạng thái
      if (statusFilter === 'HAS_WIP' && (item.status !== 'HAS_WIP' || (item.currentContent ?? 0) <= 0)) {
        return false;
      }
      if (statusFilter === 'MISSING_DATA' && item.status !== 'MISSING_DATA' && item.currentContent !== null) {
        return false;
      }
      if (statusFilter === 'EMPTY' && (item.status !== 'EMPTY' || item.currentContent !== 0)) {
        return false;
      }

      // Bộ lọc loại đối tượng
      if (typeFilter !== 'ALL' && item.objectType !== typeFilter) {
        return false;
      }

      // Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.flexsimName.toLowerCase().includes(term);
        const matchBranch = (item.branchLabel || '').toLowerCase().includes(term);
        const matchNotes = (item.notes || '').toLowerCase().includes(term);
        if (!matchName && !matchBranch && !matchNotes) return false;
      }

      return true;
    });
  }, [items, statusFilter, typeFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header & Tổng quan kết luận kiểm kê */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  Hồ Sơ Kiểm Kê Bán Thành Phẩm (WIP) Cuối Kỳ Toàn Chuyền
                </CardTitle>
                <Badge
                  variant={isLineClearConfirmed ? 'success' : missingDataCount > 0 ? 'outline' : 'destructive'}
                  className={cn(
                    'text-xs font-bold px-2.5 py-0.5',
                    missingDataCount > 0 && 'border-amber-400 text-amber-800 bg-amber-50'
                  )}
                >
                  {lineClearStatusLabel}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Phạm vi đối chiếu mô hình: <strong className="text-slate-800">{totalScopeItems} vị trí sản xuất</strong> ({sourceCount} Source, {queueCount} Queue, {processorCount} Processor, {combinerCount} Combiner). Sink và 4 Operator không nằm trong tổng Content sản xuất này.
              </CardDescription>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span className="font-semibold text-slate-700 block font-mono">Lượt: {runCode}</span>
              <span>Thời điểm: {runTimeSeconds.toLocaleString('vi-VN')}s (47h 30m)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {/* 4 Thẻ KPI Tóm Tắt Kiểm Kê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Phạm vi kiểm kê
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">{totalScopeItems}</span>
                <span className="text-xs font-semibold text-slate-600">vị trí sản xuất</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                4 Source + 28 Queue + 38 Proc + 3 Comb
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Vị trí hết tồn cuối kỳ (0)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-700 font-mono">{emptyCount}</span>
                <span className="text-xs font-semibold text-emerald-800">/ {totalScopeItems} vị trí</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {emptyCount === 4
                  ? 'Gồm 4 Queue trọng điểm: Q_CD05, Q_CD12, Q_CD14, Q_CD17'
                  : 'Các vị trí đã xác nhận 0 BTP'}
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                Vị trí thiếu dữ liệu
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-700 font-mono">{missingDataCount}</span>
                <span className="text-xs font-semibold text-amber-800">/ {totalScopeItems} vị trí</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                {missingDataCount > 0 ? 'Chưa có dữ liệu đối chiếu trong ảnh chốt' : 'Đầy đủ dữ liệu 100%'}
              </p>
            </div>

            <div className="p-3.5 bg-purple-50/60 rounded-lg border border-purple-200">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider block">
                Tổng tồn cuối tạm tính
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-purple-900 font-mono">{provisionalWipTotal}</span>
                <span className="text-xs font-semibold text-purple-800">BTP (trên {auditedCount} vị trí)</span>
              </div>
              <p className="text-[11px] text-purple-700 mt-1">
                {missingDataCount > 0 ? `Tạm tính (${missingDataCount} vị trí chưa có số liệu)` : 'Số liệu kiểm kê hoàn chỉnh'}
              </p>
            </div>
          </div>

          {/* Ghi chú quy chuẩn kỹ thuật */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Lưu ý quy chuẩn nghiệm thu kiểm kê cuối kỳ (Mục 6):
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px] pl-1">
              <li>
                <strong>Không gọi tổng FlowItem là số quần quy đổi:</strong> Mô hình gồm 4 nguồn cấp chi tiết độc lập và qua 3 điểm ráp Combiner (R01, R02, R03), các chi tiết dở dang là bán thành phẩm phân tán dọc các nhánh.
              </li>
              <li>
                <strong>Không tự suy ra 73 thành phẩm còn thiếu tương ứng với đúng 73 BTP đang tồn:</strong> Số liệu thiếu 73 cái tại Sink là sản lượng thành phẩm hoàn chỉnh; BTP trên chuyền cần quy trình gia công và ráp hợp lệ.
              </li>
              <li>
                <strong>Không dùng 4 Queue bằng 0 để kết luận toàn chuyền bằng 0:</strong> Ảnh kết quả đã chốt chứng minh 4 Queue trọng điểm CD05, CD12, CD14, CD17 hết tồn. Toàn bộ 73 vị trí sản xuất được đối chiếu chi tiết từ mô hình mô phỏng FlexSim để xác định chính xác số lượng tồn BTP dở dang trên từng công đoạn.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Thanh Công Cụ Lọc & Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Bộ lọc trạng thái */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            className={cn('text-xs h-8', statusFilter === 'ALL' && 'bg-teal-700 hover:bg-teal-800 text-white')}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả vị trí ({totalScopeItems})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'HAS_WIP' ? 'default' : 'outline'}
            className={cn('text-xs h-8', statusFilter === 'HAS_WIP' && 'bg-red-700 hover:bg-red-800 text-white')}
            onClick={() => setStatusFilter('HAS_WIP')}
          >
            Còn tồn ({hasWipCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'MISSING_DATA' ? 'default' : 'outline'}
            className={cn(
              'text-xs h-8',
              statusFilter === 'MISSING_DATA' && 'bg-amber-600 hover:bg-amber-700 text-white'
            )}
            onClick={() => setStatusFilter('MISSING_DATA')}
          >
            Thiếu dữ liệu ({missingDataCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'EMPTY' ? 'default' : 'outline'}
            className={cn('text-xs h-8', statusFilter === 'EMPTY' && 'bg-emerald-700 hover:bg-emerald-800 text-white')}
            onClick={() => setStatusFilter('EMPTY')}
          >
            Hết tồn ({emptyCount})
          </Button>
        </div>

        {/* Lọc loại đối tượng & Tìm kiếm */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs h-8 px-2.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
          >
            <option value="ALL">Tất cả loại đối tượng</option>
            <option value="SOURCE">Source ({sourceCount})</option>
            <option value="QUEUE">Queue ({queueCount})</option>
            <option value="PROCESSOR">Processor ({processorCount})</option>
            <option value="COMBINER">Combiner ({combinerCount})</option>
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên đối tượng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs h-8 pl-8 pr-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách 73 Vị Trí Sản Xuất */}
      <Card className="border border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Tên đối tượng FlexSim</th>
                  <th className="py-2.5 px-3">Loại</th>
                  <th className="py-2.5 px-3">Phân nhánh</th>
                  <th className="py-2.5 px-3 text-right">Content cuối kỳ</th>
                  <th className="py-2.5 px-3 text-right">Input</th>
                  <th className="py-2.5 px-3 text-right">Output</th>
                  <th className="py-2.5 px-3 text-center">Thời điểm kiểm tra</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái kiểm kê</th>
                  <th className="py-2.5 px-3">Ghi chú đối chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không tìm thấy vị trí sản xuất phù hợp với bộ lọc đã chọn.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isMissing = item.status === 'MISSING_DATA' || item.currentContent === null;
                    const isEmpty = item.status === 'EMPTY' || item.currentContent === 0;
                    const hasWip = (item.currentContent ?? 0) > 0;

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-slate-50/70 text-xs transition-colors',
                          isMissing && 'bg-amber-50/15',
                          hasWip && 'bg-red-50/30'
                        )}
                      >
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.flexsimName}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono',
                              item.objectType === 'QUEUE' && 'bg-blue-100 text-blue-800',
                              item.objectType === 'PROCESSOR' && 'bg-slate-100 text-slate-800',
                              item.objectType === 'SOURCE' && 'bg-amber-100 text-amber-800',
                              item.objectType === 'COMBINER' && 'bg-purple-100 text-purple-800'
                            )}
                          >
                            {item.objectType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {item.branchLabel || item.branch || '--'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {isMissing ? (
                            <span className="text-slate-400 font-sans font-normal italic text-[11px]">
                              Chưa có dữ liệu
                            </span>
                          ) : isEmpty ? (
                            <span className="text-emerald-700">0</span>
                          ) : (
                            <span className="text-red-600">{item.currentContent?.toLocaleString('vi-VN')}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {item.inputCount !== null && item.inputCount !== undefined
                            ? item.inputCount.toLocaleString('vi-VN')
                            : '--'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {item.outputCount !== null && item.outputCount !== undefined
                            ? item.outputCount.toLocaleString('vi-VN')
                            : '--'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                          {runTimeSeconds.toLocaleString('vi-VN')}s
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isMissing ? (
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 bg-amber-50">
                              Thiếu dữ liệu
                            </Badge>
                          ) : isEmpty ? (
                            <Badge variant="success" className="text-[10px]">
                              Hết tồn (0)
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Còn tồn ({item.currentContent})
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={item.notes}>
                          {item.notes || (isMissing ? 'Chưa đối chiếu được trong ảnh chốt' : 'Xác nhận kiểm kê')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>
              Hiển thị {filteredItems.length} / {totalScopeItems} vị trí sản xuất trong phạm vi kiểm kê
            </span>
            <span className="font-sans text-[11px]">
              {missingDataCount > 0
                ? `Còn ${missingDataCount} vị trí chưa xác nhận dữ liệu kiểm kê`
                : 'Đã hoàn tất kiểm kê 100% phạm vi'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
