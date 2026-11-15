import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getCurrentUser } from '@/lib/auth';
import { repository } from '@/lib/repository';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user || undefined}
          activeRunCode={activeRun?.runCode || 'RUN_REF_141126'}
          dataSourceLabel={activeRun?.sourceDescription || 'Đối chiếu ảnh kết quả mô phỏng ngày 14/11/2026'}
          isLiveConnected={false}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
