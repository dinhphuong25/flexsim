'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  GitCommit,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Split,
  Workflow,
  Scale,
} from 'lucide-react';
import { formatPercentage, formatMetricNumber } from '@/lib/kpi';

interface CombinerBranchDetail {
  branchName: string;
  sourceStage: string;
  readyBtpCount: number;
  avgWaitSeconds: number;
  cycleLeadTime: string;
  isBottleneckBranch: boolean;
}

interface CombinerData {
  id: string;
  code: string;
  name: string;
  totalAssembled: number;
  targetCount: number;
  syncEfficiencyPct: number;
  activeWaitingOn: string;
  leadTimeGapSeconds: number;
  branchA: CombinerBranchDetail;
  branchB: CombinerBranchDetail;
  synchronizationNote: string;
  actionableRecommendation: string;
}

const COMBINERS_DATA: CombinerData[] = [
  {
    id: 'r01',
    code: 'R01',
    name: 'Điểm Ráp Thân Trước & Thân Sau',
    totalAssembled: 5237,
    targetCount: 5500,
    syncEfficiencyPct: 98.2,
    activeWaitingOn: 'Nhánh Thân Trước (CD06)',
    leadTimeGapSeconds: 153.15,
    branchA: {
      branchName: 'Nhánh Thân Trước',
      sourceStage: 'CD06 (May mí sườn)',
      readyBtpCount: 2,
      avgWaitSeconds: 168.15,
      cycleLeadTime: 'Qua 6 công đoạn (CD01-CD06)',
      isBottleneckBranch: true,
    },
    branchB: {
      branchName: 'Nhánh Thân Sau',
      sourceStage: 'CD07 (Vắt sổ thân sau)',
      readyBtpCount: 2,
      avgWaitSeconds: 15.0,
      cycleLeadTime: 'Qua 1 công đoạn (CD07)',
      isBottleneckBranch: false,
    },
    synchronizationNote: 'Nhánh thân trước phải đi qua nút thắt CD05 nên phôi đến R01 có độ trễ bình quân 153,15s so với thân sau CD07. Thân sau thường xuyên phải chờ thân trước tại bàn ráp R01.',
    actionableRecommendation: 'Tăng tốc hoặc đồng bộ trạm CD05 giúp giảm độ lệch chờ ghép tại R01 từ 153s xuống dưới 45s.',
  },
  {
    id: 'r02',
    code: 'R02',
    name: 'Điểm Ráp Tra Cạp Lưng Vào Thân',
    totalAssembled: 5015,
    targetCount: 5500,
    syncEfficiencyPct: 95.8,
    activeWaitingOn: 'Nhánh Thân Quần (CD14 / Q_R02_CHINH)',
    leadTimeGapSeconds: 910.59,
    branchA: {
      branchName: 'Nhánh Thân Sau R01',
      sourceStage: 'CD14 (May viền túi sườn)',
      readyBtpCount: 4,
      avgWaitSeconds: 928.09,
      cycleLeadTime: 'Qua 7 công đoạn (CD08-CD14)',
      isBottleneckBranch: true,
    },
    branchB: {
      branchName: 'Nhánh Cạp Lưng',
      sourceStage: 'CD15 (Ép mex & định hình cạp)',
      readyBtpCount: 2,
      avgWaitSeconds: 17.5,
      cycleLeadTime: 'Qua 1 công đoạn (CD15)',
      isBottleneckBranch: false,
    },
    synchronizationNote: 'Chênh lệch đường đi lớn nhất chuyền: Nhánh thân quần qua 7 công đoạn với thời gian chờ tích lũy 928,09s, trong khi nhánh cạp lưng chỉ qua 1 công đoạn CD15 (17,5s). Cạp lưng luôn sẵn sàng sớm hơn thân quần.',
    actionableRecommendation: 'Bố trí công nhân OP_13_14 hỗ trợ triệt để trạm CD14 để đẩy nhanh dòng thân quần vào hàng chờ Q_R02_CHINH.',
  },
  {
    id: 'r03',
    code: 'R03',
    name: 'Điểm Ráp Paget Trang Trí Vào Quần',
    totalAssembled: 4948,
    targetCount: 5500,
    syncEfficiencyPct: 98.9,
    activeWaitingOn: 'Đồng bộ cân bằng (Cả 2 nhánh sẵn sàng)',
    leadTimeGapSeconds: 10.0,
    branchA: {
      branchName: 'Nhánh Thân Sau R02',
      sourceStage: 'CD19 (Ủi cạp hoàn thiện)',
      readyBtpCount: 2,
      avgWaitSeconds: 27.5,
      cycleLeadTime: 'Qua 4 công đoạn (CD16-CD19)',
      isBottleneckBranch: false,
    },
    branchB: {
      branchName: 'Nhánh Paget',
      sourceStage: 'CD22 (Ủi định hình Paget)',
      readyBtpCount: 1,
      avgWaitSeconds: 17.5,
      cycleLeadTime: 'Qua 3 công đoạn (CD20-CD22)',
      isBottleneckBranch: false,
    },
    synchronizationNote: 'Nhịp đồng bộ giữa 2 nhánh đạt mức tối ưu (độ lệch chỉ 10s). BTP sau khi ghép tại R03 chuyển tiếp thông suốt sang cụm hoàn thiện CD23-CD27 đến SINK_TP.',
    actionableRecommendation: 'Duy trì nhịp cấp phôi ổn định tại SRC_PAGET để tránh làm hẫng nhịp lắp ghép tại R03.',
  },
];

export function CombinerSyncTracker() {
  const [selectedCombinerId, setSelectedCombinerId] = useState<string>('r01');

  const selectedCombiner = COMBINERS_DATA.find((c) => c.id === selectedCombinerId) || COMBINERS_DATA[0];

  return (
    <Card className="border border-slate-200 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Scale className="h-5 w-5 text-indigo-600" />
              Theo Dõi Đồng Bộ Điểm Ráp (Combiners R01 – R02 – R03)
            </CardTitle>
            <CardDescription className="text-xs">
              Giám sát tình trạng chờ ghép BTP giữa các nhánh đầu vào, phát hiện độ lệch nhịp và xác định nhánh gây tắc
            </CardDescription>
          </div>

          {/* Combiner Switcher Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {COMBINERS_DATA.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCombinerId(c.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  selectedCombinerId === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Top Status Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/40 rounded-xl border border-indigo-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-indigo-950">{selectedCombiner.code}</span>
              <span className="text-slate-400">|</span>
              <span className="font-bold text-slate-900 text-sm">{selectedCombiner.name}</span>
            </div>
            <div className="text-xs text-indigo-900 mt-1 flex items-center gap-1.5">
              <span>Đang chờ đợi chính:</span>
              <strong className="text-red-700 bg-red-100 px-2 py-0.5 rounded font-mono">
                {selectedCombiner.activeWaitingOn}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-sans block">Đã ghép thành phẩm</span>
              <span className="font-bold text-slate-900 text-sm">
                {selectedCombiner.totalAssembled.toLocaleString('vi-VN')} / {selectedCombiner.targetCount} bộ
              </span>
            </div>
            <div className="text-right border-l border-indigo-200 pl-4">
              <span className="text-[10px] text-slate-500 font-sans block">Độ lệch thời gian chờ</span>
              <span className="font-bold text-amber-700 text-sm">
                &Delta; {selectedCombiner.leadTimeGapSeconds.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* 2-Branch Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Branch A */}
          <div className={`p-4 rounded-xl border-2 space-y-3 ${
            selectedCombiner.branchA.isBottleneckBranch
              ? 'border-amber-400 bg-amber-50/40 shadow-xs'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Nhánh Đầu Vào 1: {selectedCombiner.branchA.branchName}
              </span>
              {selectedCombiner.branchA.isBottleneckBranch && (
                <Badge variant="warning" className="text-[10px]">Nhánh làm trễ dòng</Badge>
              )}
            </div>

            <div className="font-mono text-sm font-bold text-slate-900">
              {selectedCombiner.branchA.sourceStage}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/80 p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-sans text-slate-500 block">BTP sẵn sàng tại điểm chờ</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCombiner.branchA.readyBtpCount} cái</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-500 block">Thời gian chờ bình quân</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCombiner.branchA.avgWaitSeconds}s</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-sans text-slate-500 block">Lộ trình cấp phôi</span>
                <span className="text-slate-700 font-sans">{selectedCombiner.branchA.cycleLeadTime}</span>
              </div>
            </div>
          </div>

          {/* Branch B */}
          <div className={`p-4 rounded-xl border-2 space-y-3 ${
            selectedCombiner.branchB.isBottleneckBranch
              ? 'border-amber-400 bg-amber-50/40 shadow-xs'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Nhánh Đầu Vào 2: {selectedCombiner.branchB.branchName}
              </span>
              {selectedCombiner.branchB.isBottleneckBranch && (
                <Badge variant="warning" className="text-[10px]">Nhánh làm trễ dòng</Badge>
              )}
            </div>

            <div className="font-mono text-sm font-bold text-slate-900">
              {selectedCombiner.branchB.sourceStage}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/80 p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-sans text-slate-500 block">BTP sẵn sàng tại điểm chờ</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCombiner.branchB.readyBtpCount} cái</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-500 block">Thời gian chờ bình quân</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCombiner.branchB.avgWaitSeconds}s</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-sans text-slate-500 block">Lộ trình cấp phôi</span>
                <span className="text-slate-700 font-sans">{selectedCombiner.branchB.cycleLeadTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Assessment Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-teal-400">
            <Workflow className="h-4 w-4" />
            Nhận Định Đồng Bộ & Hướng Cải Tiến Cho {selectedCombiner.code}:
          </div>
          <p className="text-slate-200 leading-relaxed font-sans">
            {selectedCombiner.synchronizationNote}
          </p>
          <div className="pt-2 border-t border-slate-800 text-amber-300 font-medium">
            <strong>Khuyến nghị vận hành:</strong> {selectedCombiner.actionableRecommendation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
