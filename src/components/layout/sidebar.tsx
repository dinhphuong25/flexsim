'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Network,
  Users,
  CalendarCheck,
  GitCompare,
  Radio,
  FileUp,
  FileSpreadsheet,
  Settings,
  Scissors,
} from 'lucide-react';
import { cn } from '../ui/button';

const NAV_ITEMS = [
  { href: '/', label: '1. Tổng quan', icon: LayoutDashboard },
  { href: '/stages', label: '2. Công đoạn & Tồn BTP', icon: Layers },
  { href: '/line-diagram', label: '3. Sơ đồ chuyền', icon: Network },
  { href: '/workers', label: '4. Nhân lực', icon: Users },
  { href: '/production-plan', label: '5. Kế hoạch & Cấp liệu', icon: CalendarCheck },
  { href: '/scenarios', label: '6. Phương án & Thực nghiệm', icon: GitCompare },
  { href: '/integrations', label: '7. Kết nối FlexSim', icon: Radio },
  { href: '/import', label: '8. Nhập dữ liệu', icon: FileUp },
  { href: '/reports', label: '9. Báo cáo', icon: FileSpreadsheet },
  { href: '/settings', label: '10. Người dùng & Cài đặt', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/50">
          <Scissors className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">MAY VIỆT THÀNH</h1>
          <p className="text-xs text-teal-400 font-medium">Chuyền Quần Nữ - Nhóm 2</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Phân Hệ Quản Trị
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-teal-600/90 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-slate-300">Mô hình FlexSim:</span>
          <span className="text-teal-400 font-mono">v1.0-baseline</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Thời gian chuẩn:</span>
          <span className="text-slate-200 font-mono">171.000s (~47.5h)</span>
        </div>
      </div>
    </aside>
  );
}
