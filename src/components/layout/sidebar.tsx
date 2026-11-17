'use client';

import React, { useEffect } from 'react';
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
  X,
} from 'lucide-react';
import { cn } from '../ui/button';

export const NAV_ITEMS = [
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

export function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
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
              onClick={onItemClick}
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
  );
}

export function SidebarFooter() {
  return (
    <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 space-y-1 shrink-0">
      <div>
        Copyright © 2026 - Dự án mô phỏng quản trị thuộc về Nhóm 2
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 bg-slate-900 text-slate-100 flex-col shrink-0 h-full border-r border-slate-800 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-black text-lg tracking-wider text-white">NHÓM 2</h1>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/60 shadow-xs">
            YSH1000218
          </span>
        </div>
        <p className="text-[11px] text-teal-400 font-semibold truncate mt-0.5">Hệ Thống Quản Trị Demo</p>
      </div>

      {/* Navigation Links */}
      <SidebarNav />

      {/* System Status Footer */}
      <SidebarFooter />
    </aside>
  );
}

export function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Đóng khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Khóa scroll body khi mở drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col shadow-2xl border-r border-slate-800 select-none overflow-hidden z-10 animate-in slide-in-from-left duration-200 safe-top-mobile">
        {/* Mobile Header with Close Button */}
        <div className="px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-wider text-white">NHÓM 2</h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/60 shadow-xs">
                YSH1000218
              </span>
            </div>
            <p className="text-[10px] text-teal-400 font-semibold truncate mt-0.5">Hệ Thống Quản Trị Demo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <SidebarNav onItemClick={onClose} />

        {/* Footer */}
        <SidebarFooter />
      </aside>
    </div>
  );
}
