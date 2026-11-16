import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
  const headersList = headers();
  const userAgent = headersList.get('user-agent')?.toLowerCase() || '';
  const isSocialCrawler = /facebookexternalhit|meta-externalagent|zalobot|zalo|twitterbot|telegrambot|slackbot|whatsapp|linkedinbot|discordbot|googlebot|bingbot|applebot|skype|viber|crawler|spider|preview|linkpreview/i.test(userAgent);

  // Nếu chưa đăng nhập và không phải là bot mạng xã hội, chuyển hướng về /login
  if (!user && !isSocialCrawler) {
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
