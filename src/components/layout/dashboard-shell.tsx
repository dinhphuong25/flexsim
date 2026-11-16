'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Đóng drawer khi người dùng chuyển trang
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      {/* Desktop Sidebar (ẩn trên mobile, hiện từ màn hình md trở lên) */}
      <Sidebar />

      {/* Mobile Drawer (trượt ra khi ấn nút hamburger trên mobile) */}
      <MobileDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          activeRunCode={activeRunCode}
          dataSourceLabel={dataSourceLabel}
          isLiveConnected={isLiveConnected}
          runs={runs}
          currentRunId={currentRunId}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
