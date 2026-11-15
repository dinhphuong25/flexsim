import React from 'react';
import { repository } from '@/lib/repository';
import { ReportCenter } from '@/components/reports/report-center';

export default async function ReportsPage() {
  const runs = await repository.getAllRuns();

  const runItems = runs.map((r) => ({
    id: r.id,
    runCode: r.runCode,
    dataSource: r.dataSource,
    sourceDescription: r.sourceDescription,
    finishedCount: r.finishedCount,
    targetCount: r.targetCount,
    runTimeSeconds: r.runTimeSeconds,
  }));

  return <ReportCenter runs={runItems} />;
}
