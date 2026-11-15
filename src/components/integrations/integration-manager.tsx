'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Radio, Key, Play, ShieldAlert, CheckCircle2, Copy, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface IntegrationClientItem {
  id: string;
  clientName: string;
  tokenPrefix: string;
  rateLimitPerMin: number;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export function IntegrationManager({
  clients,
}: {
  clients: IntegrationClientItem[];
}) {
  const [clientList, setClientList] = useState(clients);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [createdTokenDetails, setCreatedTokenDetails] = useState<{
    rawToken: string;
    clientName: string;
    warning: string;
  } | null>(null);

  const [simulatorStatus, setSimulatorStatus] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    try {
      const res = await fetch('/api/integrations/flexsim/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: newClientName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedTokenDetails({
          rawToken: data.client.rawToken,
          clientName: data.client.clientName,
          warning: data.warning,
        });
        setClientList((prev) => [data.client, ...prev]);
        setNewClientName('');
        setIsCreatingToken(false);
      } else {
        alert(data.message || 'Lỗi khi tạo token.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kích hoạt bộ gửi mô phỏng kiểm thử (Simulator Runner)
  const handleRunSimulator = async () => {
    setIsSimulating(true);
    setSimulatorStatus('Đang khởi động bộ gửi giả lập (Simulator) để kiểm thử luồng API...');
    try {
      // 1. Lấy token mẫu hoặc gọi trực tiếp API start
      const token = createdTokenDetails?.rawToken || 'vtf_demo_flexsim_integration_key_2026_secured';

      // Gọi /api/integrations/flexsim/runs/start
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
      setSimulatorStatus(`Đã tạo Run kiểm thử: ${runId}. Đang truyền snapshot tiến độ...`);

      // Gửi snapshot trung gian
      await fetch(`/api/integrations/flexsim/runs/${runId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schema_version: '1.0.0',
          sequence_number: 1,
          simulation_time_seconds: 85000,
          sink_finished_count: 2700,
          stage_metrics: [
            { stage_code: 'CD05', current_wip: 18, avg_wip: 19.5, processing_pct: 99.5 },
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
          final_sink_finished_count: 5410,
          completion_reason: 'NORMAL',
        }),
      });

      const finishData = await finishRes.json();
      setSimulatorStatus(
        `Hoàn tất kiểm thử thành công! Sản lượng ghi nhận: ${finishData.finished_count}/${finishData.target_count} cái (${finishData.completion_rate_pct}%). Trạng thái: ${finishData.final_status}.`
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
          Cổng nhận dữ liệu tự động từ phần mềm FlexSim cài đặt trên máy trạm Windows qua HTTPS REST API. Quản lý xác thực Token, Rate Limit và kiểm soát toàn vẹn lượt chạy.
        </p>
      </div>

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
                Bộ Gửi Mô Phỏng Kiểm Thử (Simulator Test Runner)
              </CardTitle>
              <CardDescription>
                BỘ GỬI MÔ PHỎNG KIỂM THỬ (SIMULATOR) - KHÔNG PHẢI FLEXSIM THẬT. Dùng để kiểm thử đường truyền HTTP và độ toàn vẹn API khi chưa mở máy FlexSim thực tế.
              </CardDescription>
            </div>
            <Badge variant="warning">Môi trường kiểm thử</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600">
            Kịch bản kiểm thử sẽ thực hiện tuần tự: Gửi yêu cầu <code>/runs/start</code> &rarr; Truyền các snapshot tiến độ qua <code>/snapshots</code> &rarr; Gửi báo cáo kết thúc qua <code>/finish</code> &rarr; Tự động kích hoạt kiểm định hết tồn chuyền may.
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleRunSimulator} disabled={isSimulating} className="gap-2">
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
