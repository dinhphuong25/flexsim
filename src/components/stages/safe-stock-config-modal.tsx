'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  History,
  Settings,
  Save,
  Trash2,
  Info,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import {
  SafeStockThresholdConfig,
  SafeStockAuditLog,
  SafeStockScope,
  validateSafeStockConfig,
} from '@/lib/safe-stock';

interface SafeStockConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCode: string;
  targetName: string;
  currentWip: number | null;
  currentConfig: SafeStockThresholdConfig | null;
  canEdit: boolean;
  onConfigSaved: (config: SafeStockThresholdConfig | null) => void;
}

export function SafeStockConfigModal({
  isOpen,
  onClose,
  targetCode,
  targetName,
  currentWip,
  currentConfig,
  canEdit,
  onConfigSaved,
}: SafeStockConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'HISTORY'>('CONFIG');

  // Form states
  const [minStock, setMinStock] = useState<string>(currentConfig?.minStock?.toString() ?? '');
  const [safeStockMax, setSafeStockMax] = useState<string>(currentConfig?.safeStockMax?.toString() ?? '');
  const [criticalStock, setCriticalStock] = useState<string>(currentConfig?.criticalStock?.toString() ?? '');
  const [consecutiveSeconds, setConsecutiveSeconds] = useState<string>(
    currentConfig?.consecutiveSecondsBeforeAlert?.toString() ?? '60'
  );
  const [scope, setScope] = useState<SafeStockScope>(currentConfig?.scope || 'END_OF_RUN');
  const [basisNotes, setBasisNotes] = useState<string>(currentConfig?.basisNotes || '');
  const [changeReason, setChangeReason] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<SafeStockAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMinStock(currentConfig?.minStock?.toString() ?? '');
      setSafeStockMax(currentConfig?.safeStockMax?.toString() ?? '');
      setCriticalStock(currentConfig?.criticalStock?.toString() ?? '');
      setConsecutiveSeconds(currentConfig?.consecutiveSecondsBeforeAlert?.toString() ?? '60');
      setScope(currentConfig?.scope || 'END_OF_RUN');
      setBasisNotes(currentConfig?.basisNotes || '');
      setChangeReason('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('CONFIG');
      fetchLogs();
    }
  }, [isOpen, currentConfig, targetCode]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/safe-stock?targetCode=${targetCode}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMessage('Tài khoản quyền Viewer không có quyền cập nhật cấu hình.');
      return;
    }

    const parsedSafeMax = parseInt(safeStockMax, 10);
    const parsedMin = minStock.trim() !== '' ? parseInt(minStock, 10) : null;
    const parsedCritical = criticalStock.trim() !== '' ? parseInt(criticalStock, 10) : null;
    const parsedSeconds = parseInt(consecutiveSeconds, 10) || 60;

    const validation = validateSafeStockConfig({
      safeStockMax: parsedSafeMax,
      minStock: parsedMin,
      criticalStock: parsedCritical,
      consecutiveSecondsBeforeAlert: parsedSeconds,
    });

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Dữ liệu không hợp lệ.');
      return;
    }

    if (!changeReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do điều chỉnh hoặc thiết lập cấu hình.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/safe-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCode,
          safeStockMax: parsedSafeMax,
          minStock: parsedMin,
          criticalStock: parsedCritical,
          consecutiveSecondsBeforeAlert: parsedSeconds,
          scope,
          basisNotes,
          changeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Lỗi khi lưu cấu hình.');
      } else {
        setSuccessMessage('Đã lưu cấu hình ngưỡng an toàn thành công!');
        onConfigSaved(data.config);
        fetchLogs();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cấu hình ngưỡng của ${targetCode} để chuyển về trạng thái 'Chưa cấu hình'?`)) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/safe-stock?targetCode=${targetCode}&reason=${encodeURIComponent('Xóa cấu hình quản trị')}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.message || 'Lỗi khi xóa cấu hình.');
      } else {
        setSuccessMessage('Đã chuyển về trạng thái Chưa cấu hình.');
        onConfigSaved(null);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch {
      setErrorMessage('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Cấu Hình Ngưỡng Tồn BTP An Toàn: {targetCode}
              </h2>
              <Badge variant="navy" className="text-[10px] font-mono">
                {targetCode}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {targetName} • Tồn hiện tại: <span className="font-bold text-slate-800 font-mono">{currentWip !== null ? `${currentWip} cái` : 'Chưa có dữ liệu'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'CONFIG'
                ? 'border-teal-600 text-teal-800 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            Thiết lập ngưỡng
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'HISTORY'
                ? 'border-teal-600 text-teal-800 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            Nhật ký điều chỉnh ({auditLogs.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'CONFIG' ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Context Warning Box */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-slate-600 space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-teal-700" />
                  Quy định quản trị ngưỡng tồn:
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ngưỡng này là cấu hình quản trị trên phần mềm để cảnh báo và giám sát, <strong>không phải là Max Content</strong> của hàng chờ hay thông số của mô hình FlexSim. Sửa ngưỡng không làm thay đổi các quy tắc vật lý trong tệp mô phỏng.
                </p>
              </div>

              {/* Threshold Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. minStock */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Mức đệm tối thiểu (minStock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Để trống nếu không áp dụng"
                    value={minStock}
                    disabled={!canEdit || isLoading}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Dưới mức này báo "Dưới mức đệm" (bỏ qua ở cuối kỳ)
                  </span>
                </div>

                {/* 2. safeStockMax */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-900 block">
                    Ngưỡng tối đa an toàn (safeStockMax) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="VD: 15"
                    value={safeStockMax}
                    disabled={!canEdit || isLoading}
                    onChange={(e) => setSafeStockMax(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-teal-500 rounded-lg font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Vượt mức này báo "Vượt ngưỡng"
                  </span>
                </div>

                {/* 3. criticalStock */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Mức nghiêm trọng (criticalStock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="VD: 25"
                    value={criticalStock}
                    disabled={!canEdit || isLoading}
                    onChange={(e) => setCriticalStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Đạt mức này báo "Mức nghiêm trọng" (&gt; safeStockMax)
                  </span>
                </div>
              </div>

              {/* Timing Delay and Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Thời gian vượt liên tục trước khi cảnh báo (giây)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="60"
                    value={consecutiveSeconds}
                    disabled={!canEdit || isLoading}
                    onChange={(e) => setConsecutiveSeconds(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Tránh báo động giả từ các dao động BTP ngắn hạn
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Phạm vi áp dụng
                  </label>
                  <select
                    value={scope}
                    disabled={!canEdit || isLoading}
                    onChange={(e) => setScope(e.target.value as SafeStockScope)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100"
                  >
                    <option value="END_OF_RUN">Tồn cuối kỳ (End of Run)</option>
                    <option value="IN_RUN">Giám sát liên tục trong lượt (In-run)</option>
                    <option value="BOTH">Cả hai phạm vi (In-run &amp; End of Run)</option>
                  </select>
                </div>
              </div>

              {/* Basis Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Căn cứ thiết lập ngưỡng
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Căn cứ thiết kế mặt bằng đệm chuyền 15 khay và năng lực của công nhân điều chuyển..."
                  value={basisNotes}
                  disabled={!canEdit || isLoading}
                  onChange={(e) => setBasisNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100 text-xs"
                />
              </div>

              {/* Change Reason (Required) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-900 block">
                  Lý do điều chỉnh / căn cứ phê duyệt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ghi rõ lý do (VD: Cập nhật diện tích chuyền may đợt kiểm tra Q4/2026)"
                  value={changeReason}
                  disabled={!canEdit || isLoading}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white disabled:bg-slate-100 text-xs"
                />
                <span className="text-[10px] text-slate-500 block">
                  Hệ thống ghi nhận vào nhật ký kiểm toán (Audit Trail) phục vụ đối soát
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {currentConfig && canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa ngưỡng (Về Chưa cấu hình)
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                    Hủy bỏ
                  </Button>
                  {canEdit && (
                    <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                      <Save className="h-4 w-4" />
                      {isLoading ? 'Đang lưu...' : 'Lưu cấu hình'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                <span>Nhật ký sửa đổi cấu hình ngưỡng {targetCode}</span>
                <span className="text-[11px] text-slate-400">
                  Sửa ngưỡng hiện hành không đổi kết luận các lượt lịch sử
                </span>
              </div>

              {loadingLogs ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có lượt sửa đổi cấu hình nào được ghi nhận cho đối tượng này.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map((log) => {
                    const prev = log.previousConfigJson ? JSON.parse(log.previousConfigJson) : null;
                    const next = log.newConfigJson ? JSON.parse(log.newConfigJson) : null;

                    return (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            {log.updatedBy}
                          </span>
                          <span className="text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.changedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="text-slate-700">
                          <span className="font-semibold text-slate-900">Lý do:</span> {log.changeReason}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                          <div>
                            <span className="text-slate-400 block font-sans">Trước khi sửa:</span>
                            {prev ? (
                              <span className="text-slate-600">
                                Max: {prev.safeStockMax} | Crit: {prev.criticalStock ?? '--'} | Min: {prev.minStock ?? '--'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa cấu hình</span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Sau khi sửa:</span>
                            {next ? (
                              <span className="font-bold text-teal-800">
                                Max: {next.safeStockMax} | Crit: {next.criticalStock ?? '--'} | Min: {next.minStock ?? '--'}
                              </span>
                            ) : (
                              <span className="text-red-600 italic">Đã xóa ngưỡng</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
