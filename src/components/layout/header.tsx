'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, RefreshCw, CheckCircle2, Box, Zap, Radio, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeaderRunOption {
  id: string;
  runCode: string;
  finishedCount: number | null;
  sourceDescription: string;
  dataSource: string;
}

interface HeaderProps {
  user?: {
    email: string;
    fullName: string;
    role: string;
  } | null;
  activeRunCode?: string;
  dataSourceLabel?: string;
  isLiveConnected?: boolean;
  runs?: HeaderRunOption[];
  currentRunId?: string;
  onOpenMobileNav?: () => void;
}

function getRunOptionLabel(r: HeaderRunOption) {
  if (r.runCode === 'RUN_CHOT_5427') {
    return '[Lượt Đã Chốt] RUN_CHOT_5427 (5.427 cái - Ảnh chốt)';
  }
  if (r.runCode === 'FLEXSIM_DESKTOP_AUTOSAVE') {
    return `FLEXSIM_DESKTOP_AUTOSAVE (${r.finishedCount ? r.finishedCount.toLocaleString('vi-VN') : '5.408'} cái - SQLite)`;
  }
  return `${r.runCode} (${r.finishedCount ? `${r.finishedCount.toLocaleString('vi-VN')} cái` : '--'})`;
}

export function Header({
  user = { fullName: 'Quản Trị Viên', email: 'admin@vietthanh.vn', role: 'ADMIN' },
  activeRunCode = 'RUN_CHOT_5427',
  dataSourceLabel = 'Ảnh kết quả đã chốt',
  isLiveConnected = false,
  runs = [],
  currentRunId,
  onOpenMobileNav,
}: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [lastFileMtime, setLastFileMtime] = useState<number | null>(null);

  const queryRunId = searchParams.get('runId');
  const activeSelectedId = queryRunId || currentRunId || runs[0]?.id;
  const currentRun = runs.find((r) => r.id === activeSelectedId) || runs[0];

  const displayRunCode = currentRun ? currentRun.runCode : activeRunCode;
  const displaySource = currentRun ? currentRun.sourceDescription : dataSourceLabel;

  const handleSelectRun = (runId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('runId', runId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const handleSyncFlexSim = async (isAuto = false) => {
    setIsSyncing(true);
    setSyncMessage(isAuto ? 'Đang tự động nạp...' : 'Đang đọc...');
    try {
      const res = await fetch('/api/integrations/flexsim/sync-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMessage(`Đã nạp ${data.finished_count}/${data.target_count} cái`);
        router.refresh();
      } else {
        setSyncMessage(data.error || 'Lỗi đồng bộ');
      }
    } catch {
      setSyncMessage('Lỗi kết nối máy chủ');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Live Auto-Sync Poller (Background Watcher)
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/integrations/flexsim/live-status');
        if (!res.ok) return;
        const data = await res.json();

        if (data.connected && data.file) {
          const currentMtime = data.file.mtimeMs;
          if (lastFileMtime !== null && currentMtime > lastFileMtime) {
            setLastFileMtime(currentMtime);
            await handleSyncFlexSim(true);
          } else if (lastFileMtime === null) {
            setLastFileMtime(currentMtime);
          }
        }
      } catch {
        // Silent error
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [autoSync, lastFileMtime]);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs shrink-0 shadow-2xs z-20 safe-top-mobile">
      {/* Tier 1: Top Navigation Bar */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between">
        {/* Left: Mobile Menu & Brand (Mobile) / Run Selector (Desktop) */}
        <div className="flex items-center gap-2 min-w-0">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors shrink-0"
              aria-label="Mở menu quản trị"
              title="Mở menu quản trị"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Mobile Brand Name */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span className="font-black text-sm tracking-wider text-slate-900">NHÓM 2</span>
            <Badge variant="outline" className="text-[10px] font-mono font-bold py-0 px-1.5 border-teal-400 text-teal-800 bg-teal-50">
              YSH1000218
            </Badge>
          </div>

          {/* Desktop Only: Context & Run Info */}
          <div className="hidden md:flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                Lượt chạy:
              </span>
              {runs && runs.length > 1 ? (
                <select
                  value={currentRun?.id}
                  onChange={(e) => handleSelectRun(e.target.value)}
                  className="font-mono text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer max-w-sm truncate"
                  title="Chọn lượt chạy mô phỏng để đối chiếu dữ liệu"
                >
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {getRunOptionLabel(r)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {displayRunCode}
                </span>
              )}

              {syncMessage && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 whitespace-nowrap shrink-0 animate-in fade-in">
                  <CheckCircle2 className="h-3 w-3" /> {syncMessage}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md lg:max-w-xl">
              Nguồn: <span className="font-medium text-slate-700">{displaySource}</span> • Mã hàng:{' '}
              <span className="font-semibold text-teal-800 font-mono">YSH1000218</span>
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Auto-Sync Toggle Button */}
          <button
            onClick={() => {
              setAutoSync((prev) => !prev);
              if (!autoSync && lastFileMtime === null) {
                setLastFileMtime(Date.now());
              }
            }}
            className={cn(
              'hidden md:flex text-xs px-2.5 py-1.5 rounded-lg border font-semibold items-center gap-1.5 transition-all shadow-2xs whitespace-nowrap',
              autoSync
                ? 'bg-teal-700 text-white border-teal-700 ring-2 ring-teal-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
            title="Tự động quét và nạp dữ liệu khi tệp FlexSim trên Desktop thay đổi"
          >
            <Radio className={cn('h-3.5 w-3.5', autoSync ? 'text-teal-200 animate-spin' : 'text-slate-400')} />
            <span>{autoSync ? 'Auto-Sync: BẬT' : 'Auto-Sync: TẮT'}</span>
          </button>

          {/* Direct FlexSim Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSyncFlexSim(false)}
            disabled={isSyncing}
            className="h-8 px-2 sm:px-2.5 text-xs gap-1.5 border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 hover:border-teal-400 font-semibold shadow-2xs whitespace-nowrap"
            title="Đọc trực tiếp từ tệp NHOM2_FINAL_2_autosave_1.sqlite trên máy trạm"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-teal-700', isSyncing && 'animate-spin')} />
            <span className="hidden sm:inline">{isSyncing ? 'Đang đọc...' : 'Đồng bộ'}</span>
          </Button>

          {/* User Info & Role Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-1.5 sm:pl-2.5 ml-0.5 sm:ml-1">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.fullName ? (user.fullName.length > 15 ? 'Quản Trị Viên' : user.fullName) : 'Quản Trị Viên'}
              </div>
            </div>

            <Badge variant="destructive" className="text-[10px] font-mono px-1.5 py-0.5">
              {user?.role || 'ADMIN'}
            </Badge>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs gap-1 shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Thoát</span>
          </Button>
        </div>
      </div>

      {/* Tier 2 on Mobile: Dedicated Context & Run Selector Bar */}
      <div className="md:hidden border-t border-slate-200/80 bg-slate-50/90 px-3 py-1.5 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {runs && runs.length > 1 ? (
            <select
              value={currentRun?.id}
              onChange={(e) => handleSelectRun(e.target.value)}
              className="w-full font-mono text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 px-2 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
              title="Chọn lượt chạy mô phỏng để đối chiếu dữ liệu"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {getRunOptionLabel(r)}
                </option>
              ))}
            </select>
          ) : (
            <div className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-1.5 rounded-md border border-slate-200 truncate">
              {displayRunCode}
            </div>
          )}
        </div>

        {/* Mobile Auto-Sync Toggle Pill Button */}
        <button
          onClick={() => {
            setAutoSync((prev) => !prev);
            if (!autoSync && lastFileMtime === null) {
              setLastFileMtime(Date.now());
            }
          }}
          className={cn(
            'text-xs px-2.5 py-1.5 rounded-md border font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-2xs',
            autoSync
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
          )}
          title="Tự động quét và nạp dữ liệu"
        >
          <Radio className={cn('h-3.5 w-3.5', autoSync ? 'text-teal-200 animate-spin' : 'text-slate-400')} />
          <span className="text-[11px] font-semibold">{autoSync ? 'Auto: BẬT' : 'Auto: TẮT'}</span>
        </button>
      </div>

      {/* Sync feedback message on mobile if active */}
      {syncMessage && (
        <div className="md:hidden border-t border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-[11px] font-medium text-emerald-800 flex items-center justify-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="h-3 w-3" /> {syncMessage}
        </div>
      )}
    </header>
  );
}
