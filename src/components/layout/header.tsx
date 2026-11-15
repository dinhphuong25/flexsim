'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  user?: {
    email: string;
    fullName: string;
    role: string;
  } | null;
  activeRunCode?: string;
  dataSourceLabel?: string;
  isLiveConnected?: boolean;
}

export function Header({
  user = { fullName: 'Quản Trị Viên Hệ Thống', email: 'admin@vietthanh.vn', role: 'ADMIN' },
  activeRunCode = 'RUN_REF_141126',
  dataSourceLabel = 'Đối chiếu kết quả ngày 14/11/2026',
  isLiveConnected = false,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
      {/* Current Context & Run Info */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lượt chạy:
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {activeRunCode}
            </span>

            {/* Connection State Badge: Tuân thủ Mục 5: Không hiển thị "trực tiếp" nếu chưa kết nối */}
            {isLiveConnected ? (
              <Badge variant="success" className="flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                FlexSim Đang Gửi Số Liệu
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-600 bg-slate-50 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Dữ liệu lưu trữ (Offline)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nguồn: <span className="font-medium text-slate-700">{dataSourceLabel}</span>
          </p>
        </div>
      </div>

      {/* Right Side: User Profile & Actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-800">{user?.fullName || 'Người dùng'}</div>
            <div className="text-[11px] text-slate-500">{user?.email || ''}</div>
          </div>
          <Badge variant={getRoleBadgeVariant(user?.role || 'VIEWER')}>
            {user?.role || 'VIEWER'}
          </Badge>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
