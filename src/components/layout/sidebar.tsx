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
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../ui/button';

const NAV_ITEMS = [
  { href: '/', label: '1. Tổng quan', icon: LayoutDashboard },
  { href: '/stages', label: '2. Công đoạn & Tồn BTP', icon: Layers },
  { href: '/line-diagram', label: '3. Sơ đồ chuyền', icon: Network },
  { href: '/workers', label: '4. Nhân lực', icon: Users },
  { href: '/production-plan', label: '5. Kế hoạch & Cấp liệu', icon: CalendarCheck },
  { href: '/scenarios', label: '6. Kịch bản & Kaizen', icon: GitCompare },
  { href: '/integrations', label: '7. Kết nối FlexSim', icon: Radio },
  { href: '/import', label: '8. Nhập dữ liệu', icon: FileUp },
  { href: '/reports', label: '9. Báo cáo & Nghiệm thu', icon: FileSpreadsheet },
  { href: '/settings', label: '10. Người dùng & Cài đặt', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 h-full border-r border-slate-800 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
        <h1 className="font-black text-lg tracking-wider text-white">NHÓM 2</h1>
        <p className="text-[11px] text-teal-400 font-semibold truncate mt-0.5">Hệ Thống Quản Trị Demo</p>
      </div>

      {/* Navigation Links - Cỡ chữ vừa vặn, tinh tế và không hiện scrollbar */}
      <nav className="flex-1 px-3 py-2 flex flex-col overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
          Phân Hệ Quản Trị
        </div>

        <div className="flex-1 flex flex-col py-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all group shrink-0',
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs shadow-teal-900/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* System Status Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 space-y-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">FlexSim Model:</span>
          <span className="text-teal-400 font-mono font-semibold">v1.0-baseline</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Thời gian chuẩn:</span>
          <span className="text-slate-200 font-sans font-medium">171.000s (~47.5h)</span>
        </div>
      </div>
    </aside>
  );
}
