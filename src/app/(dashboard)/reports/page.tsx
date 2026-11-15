import React, { Suspense } from 'react';
import { repository } from '@/lib/repository';
import { ReportCenter } from '@/components/reports/report-center';

interface ReportsPageProps {
  searchParams?: Promise<{ runId?: string }> | { runId?: string };
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryRunId = resolvedParams?.runId;

  const runs = await repository.getAllRuns();
  const activeRun = (queryRunId ? runs.find((r) => r.id === queryRunId) : null) || runs[0] || null;

  const runItems = runs.map((r) => ({
    id: r.id,
    runCode: r.runCode,
    dataSource: r.dataSource,
    sourceDescription: r.sourceDescription,
    finishedCount: r.finishedCount,
    targetCount: r.targetCount,
    runTimeSeconds: r.runTimeSeconds,
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải trung tâm báo cáo...</div>}>
      <ReportCenter runs={runItems} initialRunId={activeRun?.id} />
    </Suspense>
  );
}
