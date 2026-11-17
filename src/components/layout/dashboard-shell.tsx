'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Sidebar, MobileDrawer } from './sidebar';
import { Header, HeaderRunOption } from './header';

interface DashboardShellProps {
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
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  activeRunCode,
  dataSourceLabel,
  isLiveConnected,
  runs,
  currentRunId,
  children,
}: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const pathname = usePathname();

  // Đóng drawer khi người dùng chuyển trang
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 animate-app-enter">
      {/* Desktop Sidebar (ẩn trên mobile, hiện từ màn hình md trở lên) */}
      <div className="animate-app-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Drawer (trượt ra khi ấn nút hamburger trên mobile) */}
      <MobileDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <div className="animate-app-content">
          <Header
            user={user}
            activeRunCode={activeRunCode}
            dataSourceLabel={dataSourceLabel}
            isLiveConnected={isLiveConnected}
            runs={runs}
            currentRunId={currentRunId}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 animate-app-content">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {isWelcomeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-app-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-teal-100 bg-white p-5 shadow-2xl sm:p-8 animate-app-modal-content">
            <button
              type="button"
              onClick={() => setIsWelcomeOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng lời chào mừng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-600">
                Nhóm 2
              </p>
              <h2 id="welcome-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
                Chào mừng đến với Hệ Thống Quản Trị Demo
              </h2>
              <p className="mt-4 text-justify leading-7 text-slate-600">
                Website được Nhóm 2 tự nghiên cứu, thiết kế và xây dựng để phục vụ bài
                báo cáo nhóm. Toàn bộ ý tưởng và nội dung được phát triển độc lập, không
                sao chép ý tưởng từ bất kỳ bên nào, thể hiện sự sáng tạo và đóng góp của
                các thành viên trong nhóm.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWelcomeOpen(false)}
              className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Bắt đầu khám phá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
