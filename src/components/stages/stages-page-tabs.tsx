'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottleneckRootCauseTracer } from './bottleneck-root-cause-tracer';
import { StageManagementTable } from './stage-management-table';
import { EndOfRunInventoryAudit, AuditedObjectItem } from './end-of-run-inventory-audit';
import { SafeStockThresholdConfig } from '@/lib/safe-stock';

interface StagesPageTabsProps {
  stagesWithMetrics: any[];
  initialThresholds: SafeStockThresholdConfig[];
  userRole: string;
  auditedItems: AuditedObjectItem[];
  runCode: string;
  runTimeSeconds: number;
  sourceDescription: string;
}

export function StagesPageTabs({
  stagesWithMetrics,
  initialThresholds,
  userRole,
  auditedItems,
  runCode,
  runTimeSeconds,
  sourceDescription,
}: StagesPageTabsProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'STAGES' | 'AUDIT'>(urlTab === 'audit' ? 'AUDIT' : 'STAGES');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('STAGES')}
          className={cn(
            'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0',
            activeTab === 'STAGES'
              ? 'border-teal-600 text-teal-700 bg-teal-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Layers className="h-4 w-4" />
          Danh Mục 27 Công Đoạn &amp; Ngưỡng Tồn An Toàn
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={cn(
            'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0',
            activeTab === 'AUDIT'
              ? 'border-teal-600 text-teal-700 bg-teal-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Kiểm Kê Cuối Kỳ ({auditedItems.length} Vị Trí Sản Xuất)
        </button>
      </div>

      {/* Tab Content */}
      <div className={activeTab === 'STAGES' ? 'space-y-6' : 'hidden'}>
        <BottleneckRootCauseTracer />
        <StageManagementTable
          stages={stagesWithMetrics}
          initialThresholds={initialThresholds}
          userRole={userRole}
        />
      </div>

      <div className={activeTab === 'AUDIT' ? 'space-y-6' : 'hidden'}>
        <EndOfRunInventoryAudit
          items={auditedItems}
          runCode={runCode}
          runTimeSeconds={runTimeSeconds}
          sourceDescription={sourceDescription}
        />
      </div>
    </div>
  );
}
