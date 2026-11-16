import React from 'react';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
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
    <DashboardShell
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
    >
      {children}
    </DashboardShell>
  );
}
