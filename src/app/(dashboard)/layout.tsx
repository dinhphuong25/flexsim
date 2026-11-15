import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getCurrentUser } from '@/lib/auth';
import { repository } from '@/lib/repository';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const runs = await repository.getAllRuns();
  const activeRun = runs[0] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Header
            user={user || undefined}
            activeRunCode={activeRun?.runCode || 'RUN_CHOT_5427'}
            dataSourceLabel={activeRun?.sourceDescription || 'Ảnh kết quả đã chốt'}
            isLiveConnected={false}
            runs={runs.map((r) => ({
              id: r.id,
              runCode: r.runCode,
              finishedCount: r.finishedCount,
              sourceDescription: r.sourceDescription || '',
              dataSource: r.dataSource,
            }))}
            currentRunId={activeRun?.id}
          />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
