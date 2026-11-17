'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Radio,
  Key,
  ShieldCheck,
  ShieldAlert,
  Play,
  RefreshCw,
  CheckCircle2,
  Copy,
  Terminal,
  ExternalLink,
  Box,
  HardDrive,
  FileCode,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationClient {
  id: string;
  clientName: string;
  tokenPrefix: string;
  rateLimitPerMin: number;
  isActive: boolean;
  lastUsedAt?: string | null;
}

export function IntegrationManager({
  clients,
  activeRunCode,
}: {
  clients: IntegrationClient[];
  activeRunCode?: string;
}) {
  const router = useRouter();
  const [clientList, setClientList] = useState(clients);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [createdTokenDetails, setCreatedTokenDetails] = useState<{
    rawToken: string;
    warning: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Trạng thái đồng bộ tệp FlexSim trực tiếp
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);
  const [syncDirectResult, setSyncDirectResult] = useState<any | null>(null);

  // Trạng thái chạy Simulator giả lập
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const res = await fetch('/api/integrations/flexsim/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: newClientName }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedTokenDetails({
          rawToken: data.token,
          warning: data.warning,
        });
        setClientList((prev) => [data.client, ...prev]);
        setNewClientName('');
        setIsCreatingToken(false);
      } else {
        alert(data.error || 'Lỗi khi tạo token');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    }
  };

  // Đồng bộ trực tiếp từ tệp FlexSim Desktop
  const handleSyncDirect = async () => {
    setIsSyncingDirect(true);
    setSyncDirectResult(null);
    try {
      const res = await fetch('/api/integrations/flexsim/sync-local', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncDirectResult(data);
        router.refresh();
      } else {
        setSyncDirectResult({ error: data.error || 'Lỗi đồng bộ tệp FlexSim' });
      }
    } catch {
      setSyncDirectResult({ error: 'Không thể kết nối máy chủ' });
    } finally {
      setIsSyncDirectDirect(false);
    }
  };

  const setIsSyncDirectDirect = (val: boolean) => setIsSyncingDirect(val);

  // Chạy giả lập Simulator
  const handleRunSimulator = async () => {
    setIsSimulating(true);
    setSimulatorStatus('Đang khởi tạo phiên kiểm thử kết nối FlexSim...');

    try {
      const token = 'vtf_demo_flexsim_integration_key_2026_secured';

      // Tạo lượt chạy mới
      const startRes = await fetch('/api/integrations/flexsim/runs/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_version: 'v1.0-baseline',
          scenario_code: 'SCEN_CO_DINH',
          data_source: 'TEST_SIMULATION',
          client_software: 'Simulator Kiểm Thử Tự Động (Web Runner)',
          replication_index: 2,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.message || 'Lỗi khi start run');
      }

      const startData = await startRes.json();
      const runId = startData.run_id;
      setSimulatorStatus(`Đã tạo Run kiểm thử: ${runId}. Đang truyền snapshot tiến độ 27 công đoạn...`);

      // Gửi snapshot trung gian đầy đủ 27 công đoạn
      await fetch(`/api/integrations/flexsim/runs/${runId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schema_version: '1.0.0',
          sequence_number: 1,
          simulation_time_seconds: 171000,
          sink_finished_count: 5408,
          stage_metrics: [
            { stage_code: 'CD01', current_wip: 2, avg_wip: 1.85, max_wip: 4, avg_staytime: 18.4, processing_pct: 97.08 },
            { stage_code: 'CD02', current_wip: 4, avg_wip: 3.42, max_wip: 6, avg_staytime: 24.1, processing_pct: 95.51 },
            { stage_code: 'CD03', current_wip: 1, avg_wip: 0.92, max_wip: 3, avg_staytime: 12.5, processing_pct: 98.13 },
            { stage_code: 'CD04', current_wip: 5, avg_wip: 5.15, max_wip: 9, avg_staytime: 32.8, processing_pct: 86.71 },
            { stage_code: 'CD05', current_wip: 22, avg_wip: 22.31, max_wip: 30, avg_staytime: 700.33, processing_pct: 99.89 },
            { stage_code: 'CD06', current_wip: 2, avg_wip: 1.74, max_wip: 4, avg_staytime: 16.2, processing_pct: 98.69 },
            { stage_code: 'CD07', current_wip: 2, avg_wip: 1.45, max_wip: 3, avg_staytime: 14.8, processing_pct: 94.03 },
            { stage_code: 'CD08', current_wip: 3, avg_wip: 2.65, max_wip: 5, avg_staytime: 21.0, processing_pct: 92.48 },
            { stage_code: 'CD09', current_wip: 2, avg_wip: 1.88, max_wip: 4, avg_staytime: 17.5, processing_pct: 93.95 },
            { stage_code: 'CD10', current_wip: 3, avg_wip: 2.45, max_wip: 5, avg_staytime: 19.8, processing_pct: 92.88 },
            { stage_code: 'CD11', current_wip: 4, avg_wip: 4.12, max_wip: 7, avg_staytime: 28.6, processing_pct: 93.64 },
            { stage_code: 'CD12', current_wip: 4, avg_wip: 3.2, max_wip: 6, avg_staytime: 22.4, processing_pct: 99.55 },
            { stage_code: 'CD13', current_wip: 4, avg_wip: 3.55, max_wip: 6, avg_staytime: 25.0, processing_pct: 90.47 },
            { stage_code: 'CD14', current_wip: 4, avg_wip: 3.65, max_wip: 6, avg_staytime: 26.65, processing_pct: 99.59 },
            { stage_code: 'CD15', current_wip: 2, avg_wip: 1.55, max_wip: 3, avg_staytime: 15.2, processing_pct: 88.08 },
            { stage_code: 'CD16', current_wip: 4, avg_wip: 4.25, max_wip: 7, avg_staytime: 29.5, processing_pct: 89.01 },
            { stage_code: 'CD17', current_wip: 4, avg_wip: 3.45, max_wip: 6, avg_staytime: 24.09, processing_pct: 99.54 },
            { stage_code: 'CD18', current_wip: 2, avg_wip: 1.7, max_wip: 4, avg_staytime: 16.8, processing_pct: 87.21 },
            { stage_code: 'CD19', current_wip: 2, avg_wip: 1.62, max_wip: 3, avg_staytime: 15.9, processing_pct: 88.97 },
            { stage_code: 'CD20', current_wip: 1, avg_wip: 0.85, max_wip: 2, avg_staytime: 11.2, processing_pct: 72.71 },
            { stage_code: 'CD21', current_wip: 1, avg_wip: 0.78, max_wip: 2, avg_staytime: 9.5, processing_pct: 45.97 },
            { stage_code: 'CD22', current_wip: 1, avg_wip: 0.82, max_wip: 2, avg_staytime: 10.4, processing_pct: 57.46 },
            { stage_code: 'CD23', current_wip: 4, avg_wip: 4.1, max_wip: 7, avg_staytime: 27.2, processing_pct: 82.87 },
            { stage_code: 'CD24', current_wip: 2, avg_wip: 1.68, max_wip: 3, avg_staytime: 16.0, processing_pct: 69.21 },
            { stage_code: 'CD25', current_wip: 1, avg_wip: 0.95, max_wip: 2, avg_staytime: 12.0, processing_pct: 71.9 },
            { stage_code: 'CD26', current_wip: 2, avg_wip: 1.75, max_wip: 4, avg_staytime: 17.1, processing_pct: 87.5 },
            { stage_code: 'CD27', current_wip: 4, avg_wip: 3.3, max_wip: 6, avg_staytime: 23.5, processing_pct: 71.93 }
          ],
        }),
      });

      // Gửi finish kết thúc
      const finishRes = await fetch(`/api/integrations/flexsim/runs/${runId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          final_simulation_time_seconds: 171000,
          final_sink_finished_count: 5408,
          completion_reason: 'NORMAL',
        }),
      });

      const finishData = await finishRes.json();
      setSimulatorStatus(
        `Hoàn tất kiểm thử thành công! Sản lượng: ${finishData.finished_count}/${finishData.target_count} cái (${finishData.completion_rate_pct}%). Trạng thái: ${finishData.final_status}.`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối';
      setSimulatorStatus(`Lỗi kiểm thử: ${errMsg}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Radio className="h-6 w-6 text-teal-600" />
          Quản Trị Kết Nối Trực Tiếp FlexSim (Machine-to-Machine)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cổng nhận dữ liệu tự động từ phần mềm FlexSim cài đặt trên máy trạm Windows qua HTTPS REST API và đồng bộ trực tiếp tệp mô hình SQLite/FSM.
        </p>
      </div>

      {/* Direct FlexSim Desktop Connection Banner */}
      <Card className="border-teal-500 bg-linear-to-r from-slate-900 to-teal-950 text-white shadow-lg overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="h-5 w-5 text-teal-400" />
                  Kết Nối Trực Tiếp Mô Hình FlexSim Desktop (Windows)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-300 mt-1">
                Tự động phát hiện và trích xuất dữ liệu từ các tệp mô hình FlexSim 2027 trên máy tính trạm
              </CardDescription>
            </div>
            <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs font-mono self-start sm:self-auto">
              ĐỒNG BỘ TRỰC TIẾP: ĐÃ TẮT
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                <FileCode className="h-3.5 w-3.5" /> Tệp Mô Hình FlexSim (.fsm):
              </span>
              <p className="font-mono text-white text-xs font-bold truncate">
                C:\Users\Administrator\Desktop\NHOM2_FINAL_2_autosave_1.fsm
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Phần mềm: Autodesk FlexSim 2027</span>
                <span>•</span>
                <span>Kích thước: 174 KB</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" /> Cơ Sở Dữ Liệu Kết Quả (.sqlite):
              </span>
              <p className="font-mono text-white text-xs font-bold truncate">
                C:\Users\Administrator\Desktop\NHOM2_FINAL_2_autosave_1.sqlite
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Dung lượng: 7.75 MB</span>
                <span>•</span>
                <span>2 Scenarios (HT & PA_DongBo)</span>
                <span>•</span>
                <span>20 Tasks</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                disabled={true}
                className="bg-slate-800 text-slate-400 border border-slate-700 font-bold gap-2 text-xs py-2 px-3.5 shadow-none cursor-not-allowed opacity-75"
              >
                <Zap className="h-4 w-4 text-slate-500" />
                <span>ĐỒNG BỘ TRỰC TIẾP: ĐÃ TẮT</span>
              </Button>
              <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900/60 text-[11px] font-medium">
                Chế độ xem cố định
              </Badge>
            </div>

            <span className="text-[11px] text-slate-400">
              Chức năng đồng bộ trực tiếp từ máy trạm FlexSim đang tắt để cố định số liệu lượt chốt chuẩn (5.427 cái).
            </span>
          </div>

          {syncDirectResult && (
            <div className={`p-3.5 rounded-xl text-xs space-y-1 border ${
              syncDirectResult.error
                ? 'bg-red-950/80 border-red-800 text-red-200'
                : 'bg-emerald-950/80 border-emerald-700 text-emerald-100'
            }`}>
              {syncDirectResult.error ? (
                <div className="font-bold flex items-center gap-1.5 text-red-300">
                  <ShieldAlert className="h-4 w-4" />
                  {syncDirectResult.error}
                </div>
              ) : (
                <>
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Đồng bộ thành công từ FlexSim Desktop!
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Lượt chạy: <code className="text-white font-mono font-bold">{syncDirectResult.run_code}</code> | 
                    Sản lượng: <strong className="text-white">{syncDirectResult.finished_count}/{syncDirectResult.target_count} cái</strong> ({syncDirectResult.completion_rate_pct}%) | 
                    Tổng công đoạn: <strong className="text-white">{syncDirectResult.total_stages} trạm</strong> | 
                    Replications: <strong className="text-white">{syncDirectResult.replications_count} lượt hoàn tất</strong>.
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Các Điểm Cuối Nhận Dữ Liệu (Ingestion API Endpoints)</CardTitle>
          <CardDescription>
            Thiết lập các URL này vào mã kịch bản OnModelPreReset / OnRunEnd hoặc Timer Event trong FlexSim
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded mr-2">GET</span>
                <span className="text-slate-800 font-bold">/api/integrations/flexsim/health</span>
              </div>
              <span className="text-slate-500 font-sans">Kiểm tra kết nối và độ trễ gateway</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded mr-2">POST</span>
                <span className="text-slate-800 font-bold">/api/integrations/flexsim/runs/start</span>
              </div>
              <span className="text-slate-500 font-sans">Đăng ký lượt chạy mới, nhận Run ID và thông số lấy mẫu</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded mr-2">POST</span>
                <span className="text-slate-800 font-bold">/api/integrations/flexsim/runs/:id/snapshots</span>
              </div>
              <span className="text-slate-500 font-sans">Truyền gói dữ liệu theo chu kỳ (hỗ trợ batching &amp; idempotency)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded mr-2">POST</span>
                <span className="text-slate-800 font-bold">/api/integrations/flexsim/runs/:id/finish</span>
              </div>
              <span className="text-slate-500 font-sans">Xác nhận kết thúc lượt, lưu snapshot cuối, kích hoạt kiểm tra tồn</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-5 w-5 text-teal-600" />
                Quản Lý Token Máy-Máy (Integration Clients)
              </CardTitle>
              <CardDescription>
                Mỗi máy trạm FlexSim sử dụng một Token riêng biệt. Token được lưu trữ dạng băm SHA-256 an toàn.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreatingToken(true)}>
              Cấp token mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Form Tạo Token */}
          {isCreatingToken && (
            <form onSubmit={handleCreateToken} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">Cấp Khóa Kết Nối Máy Trạm Mới</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nhập tên máy trạm (VD: FlexSim Workstation 02 - Phong KCS)..."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <Button type="submit" size="sm">
                  Tạo khóa
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingToken(false)}>
                  Hủy
                </Button>
              </div>
            </form>
          )}

          {/* Alert Display Once Created Token */}
          {createdTokenDetails && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
                Khóa Bí Mật Vừa Được Tạo (Chỉ hiển thị một lần duy nhất!)
              </div>
              <p className="text-amber-800">{createdTokenDetails.warning}</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="p-2.5 bg-white rounded border border-amber-300 text-amber-950 font-mono font-bold flex-1 break-all text-xs">
                  {createdTokenDetails.rawToken}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdTokenDetails.rawToken)}>
                  {copied ? 'Đã chép!' : 'Sao chép'}
                </Button>
              </div>
            </div>
          )}

          {/* Clients List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
                <tr>
                  <th className="py-2.5 px-3">Tên máy trạm / Client</th>
                  <th className="py-2.5 px-3">Tiền tố Token</th>
                  <th className="py-2.5 px-3">Giới hạn Rate Limit</th>
                  <th className="py-2.5 px-3">Lần cuối truyền tin</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {clientList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{c.clientName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.tokenPrefix}******</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.rateLimitPerMin} req/phút</td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">
                      {c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleString('vi-VN') : 'Chưa có hoạt động'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {c.isActive ? (
                        <Badge variant="success">Hoạt động</Badge>
                      ) : (
                        <Badge variant="destructive">Đã thu hồi</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Test Simulator Section (Section 14) */}
      <Card className="border-2 border-dashed border-teal-300 bg-teal-50/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="h-5 w-5 text-teal-600" />
                Bộ Gửi Mô Phỏng Giả Lập (Simulator Web Runner)
              </CardTitle>
              <CardDescription>
                Bộ gửi mô phỏng kiểm thử tự động để kiểm chứng đường truyền API khi không có FlexSim Desktop mở sẵn.
              </CardDescription>
            </div>
            <Badge variant="warning">Môi trường kiểm thử</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600">
            Kịch bản kiểm thử sẽ thực hiện tuần tự: Gửi yêu cầu <code>/runs/start</code> &rarr; Truyền các snapshot tiến độ 27 trạm qua <code>/snapshots</code> &rarr; Gửi báo cáo kết thúc qua <code>/finish</code> &rarr; Tự động kích hoạt kiểm định hết tồn chuyền may.
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleRunSimulator} disabled={isSimulating} className="gap-2 text-xs">
              {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isSimulating ? 'Đang thực thi kiểm thử...' : 'Kích hoạt bộ gửi giả lập (Test Simulator)'}
            </Button>
          </div>

          {simulatorStatus && (
            <div className="p-3 bg-white rounded-lg border border-teal-200 text-xs font-mono text-teal-900">
              {simulatorStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
