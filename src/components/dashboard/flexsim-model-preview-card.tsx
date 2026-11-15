'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Box, ArrowRight, Eye, RefreshCw, CheckCircle2, Clock, Users, Activity, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FlexSimModelPreviewCard() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/integrations/flexsim/sync-local', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus(`Đã nạp ${data.finished_count}/${data.target_count} cái`);
        router.refresh();
      } else {
        setSyncStatus(data.error || 'Lỗi đọc tệp');
      }
    } catch {
      setSyncStatus('Lỗi kết nối máy chủ');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl overflow-hidden relative">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="p-5 md:p-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Info & Actions (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Header Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-slate-800/80 text-teal-300 border-slate-700 font-mono text-[11px]">
              NHOM2_FINAL_2_autosave_1.fsm
            </Badge>
            <Badge variant="outline" className="bg-slate-800/80 text-slate-300 border-slate-700 font-mono text-[11px]">
              SQLite 7.75 MB
            </Badge>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Box className="h-5 w-5 text-teal-400 shrink-0" />
              Bố Trí Không Gian 3D & Luồng Mô Phỏng Nhóm 2
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Mô hình hóa toàn diện chuyền may quần trẻ em nữ: 4 nhánh cấp liệu độc lập (Thân trước, Thân sau, Cạp lưng, Paget), 3 điểm ráp Combiner (R01, R02, R03) và 4 công nhân điều chuyển linh hoạt.
            </p>
          </div>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-teal-400" /> Thời gian chuẩn:
              </span>
              <p className="font-mono font-bold text-white text-xs">171.000s (~47.5h)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="h-3 w-3 text-indigo-400" /> Bố trí nhân lực:
              </span>
              <p className="font-mono font-bold text-white text-xs">34 người (30 + 4)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Activity className="h-3 w-3 text-amber-400" /> Nút thắt chính:
              </span>
              <p className="font-mono font-bold text-red-400 text-xs">CD05 (Tồn: 22 cái)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <Link href="/line-diagram">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold gap-1.5 shadow-md text-xs h-9">
                <Eye className="h-3.5 w-3.5" />
                Mở Sơ Đồ & Ảnh Chụp 3D
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs gap-1.5 h-9"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-teal-400', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Đang đọc...' : 'Đồng Bộ Tệp SQLite'}</span>
            </Button>

            {syncStatus && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                {syncStatus}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: High-Res Screenshot Preview with Interactive Overlay (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 flex justify-center">
          <Link
            href="/line-diagram"
            className="group relative block w-full rounded-xl overflow-hidden border border-teal-500/30 shadow-2xl bg-slate-950 hover:border-teal-400 transition-all hover:scale-[1.01]"
            title="Bấm để xem sơ đồ chi tiết và phóng to mô hình FlexSim"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-slate-950 relative">
              <img
                src="/images/flexsim-model-layout.jpg"
                alt="Mô hình Autodesk FlexSim 2027 - Chuyền May Nhóm 2"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay with pill */}
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/15 transition-colors flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xs text-xs font-bold text-white border border-teal-400/60 shadow-lg flex items-center gap-1.5 group-hover:bg-teal-600 group-hover:text-slate-950 transition-colors">
                  <Eye className="h-3.5 w-3.5 text-teal-400 group-hover:text-slate-950" />
                  Xem Ảnh Gốc 3D Toàn Màn Hình
                </span>
              </div>
            </div>

            {/* Bottom Caption Bar */}
            <div className="bg-slate-950 px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-300 font-semibold truncate">Autodesk FlexSim 2027 – Model 3D</span>
              <span className="text-teal-400 shrink-0">171.000s (OK)</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
