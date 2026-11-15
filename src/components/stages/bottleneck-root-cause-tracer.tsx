'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Search,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  Zap,
  HelpCircle,
  TrendingUp,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { formatPercentage, formatMetricNumber } from '@/lib/kpi';

interface StageAnalysisData {
  code: string;
  name: string;
  upstreamCode: string;
  upstreamName: string;
  upstreamOutput: number;
  upstreamWip: number;
  currentWip: number;
  avgWip: number;
  maxWip: number;
  staytime: number;
  processingPct: number;
  hasSupport: boolean;
  supportStationName?: string;
  supportWorkerCode?: string;
  supportOutput?: number;
  supportPct?: number;
  downstreamCode: string;
  downstreamName: string;
  downstreamWip: number;
  downstreamProcessingPct: number;
  isBlockedByDownstream: boolean;
  rootCauseVerdict: string;
  kaizenRecommendation: string;
}

const STAGES_DIAGNOSTIC_DB: Record<string, StageAnalysisData> = {
  CD05: {
    code: 'CD05',
    name: 'May đáp đáy thân trước',
    upstreamCode: 'CD04',
    upstreamName: 'Chắp sườn thân trước (2 trạm A/B)',
    upstreamOutput: 5488,
    upstreamWip: 5,
    currentWip: 22,
    avgWip: 20.9,
    maxWip: 30,
    staytime: 700.33,
    processingPct: 99.89,
    hasSupport: true,
    supportStationName: 'P_CD05B_HOTRO',
    supportWorkerCode: 'OP_04_05',
    supportOutput: 904,
    supportPct: 24.79,
    downstreamCode: 'CD06',
    downstreamName: 'May mí sườn thân trước',
    downstreamWip: 2,
    downstreamProcessingPct: 98.69,
    isBlockedByDownstream: false,
    rootCauseVerdict: 'Nút thắt nội tại công suất máy chính (Processing 99,89%). Thời gian gia công dài hơn nhịp phôi đổ về từ CD04 (5.488 cái). Trạm hỗ trợ P_CD05B_HOTRO mới chỉ chia sẻ được 24,79% tải do OP_04_05 còn phải may vị trí P_CD04B. CD06 tiếp nhận bình thường (không bị Blocked).',
    kaizenRecommendation: 'Áp dụng phương án PA_DongBo (hệ số k = 0.90) giảm 10% chu kỳ thao tác may đáp đáy, kết hợp hạ ngưỡng điều chuyển OP_04_05 từ 15 xuống 10 cái giúp giải phóng 83,7% tồn dồn ứ.',
  },
  CD12: {
    code: 'CD12',
    name: 'May mí sườn thân sau & chập sườn',
    upstreamCode: 'CD11',
    upstreamName: 'May ly túi thân sau (2 trạm A/B)',
    upstreamOutput: 5467,
    upstreamWip: 4,
    currentWip: 4,
    avgWip: 3.8,
    maxWip: 6,
    staytime: 1902.42,
    processingPct: 99.55,
    hasSupport: true,
    supportStationName: 'P_CD12B_HOTRO',
    supportWorkerCode: 'OP_11_12',
    supportOutput: 420,
    supportPct: 10.15,
    downstreamCode: 'CD13',
    downstreamName: 'May chun sườn (2 trạm A/B)',
    downstreamWip: 4,
    downstreamProcessingPct: 90.47,
    isBlockedByDownstream: false,
    rootCauseVerdict: 'Thời gian chờ BTP lớn (1.902s) do đặc thù phân nhánh thân sau ghép nối sau R01. Tải máy đơn vị đạt 99,55%. Trạm hỗ trợ P_CD12B_HOTRO đã giảm tải tốt, không xảy ra dồn ứ cuối kỳ (WIP hiện tại chỉ 4 cái).',
    kaizenRecommendation: 'Duy trì cơ chế điều chuyển OP_11_12 khi Q_CD12 vượt quá 12 cái để duy trì dòng hàng ổn định.',
  },
  CD14: {
    code: 'CD14',
    name: 'May viền túi & hoàn thiện thân trước điểm ráp R02',
    upstreamCode: 'CD13',
    upstreamName: 'May chun sườn thân sau',
    upstreamOutput: 5461,
    upstreamWip: 4,
    currentWip: 4,
    avgWip: 3.8,
    maxWip: 6,
    staytime: 928.09,
    processingPct: 99.59,
    hasSupport: true,
    supportStationName: 'P_CD14B_HOTRO',
    supportWorkerCode: 'OP_13_14',
    supportOutput: 635,
    supportPct: 15.22,
    downstreamCode: 'R02',
    downstreamName: 'Điểm ráp tra cạp R02 (Combiner)',
    downstreamWip: 0,
    downstreamProcessingPct: 97.8,
    isBlockedByDownstream: false,
    rootCauseVerdict: 'Công đoạn chuẩn bị trước điểm ráp R02. Tỷ lệ vận hành 99,59%, được hỗ trợ bởi OP_13_14. Dòng phôi vào R02 thông thoát, không bị tắc.',
    kaizenRecommendation: 'Đồng bộ chu kỳ phôi với nhánh cạp lưng CD15 để điểm ráp R02 không phải chờ BTP lưng.',
  },
  CD17: {
    code: 'CD17',
    name: 'Mí cạp quần sau điểm ráp R02',
    upstreamCode: 'CD16',
    upstreamName: 'May luồn chun cạp quần (2 trạm A/B)',
    upstreamOutput: 5452,
    upstreamWip: 4,
    currentWip: 4,
    avgWip: 3.8,
    maxWip: 6,
    staytime: 1321.63,
    processingPct: 99.54,
    hasSupport: true,
    supportStationName: 'P_CD17B_HOTRO',
    supportWorkerCode: 'OP_16_17',
    supportOutput: 688,
    supportPct: 16.45,
    downstreamCode: 'CD18',
    downstreamName: 'Đính bọ dây đai cạp',
    downstreamWip: 2,
    downstreamProcessingPct: 87.21,
    isBlockedByDownstream: false,
    rootCauseVerdict: 'Gia công cạp quần sau tra chun. Máy vận hành 99,54%, nhờ có trạm P_CD17B_HOTRO nên tồn duy trì ở mức an toàn 4 cái.',
    kaizenRecommendation: 'Giữ nguyên ngưỡng điều chuyển OP_16_17 ở mức 10 cái.',
  },
};

export function BottleneckRootCauseTracer() {
  const [selectedStageCode, setSelectedStageCode] = useState<string>('CD05');

  const stage = STAGES_DIAGNOSTIC_DB[selectedStageCode] || STAGES_DIAGNOSTIC_DB['CD05'];

  return (
    <Card className="border border-slate-200 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Search className="h-5 w-5 text-teal-600" />
              Truy Ngược Nguyên Nhân Ùn Hàng & Phân Tích Dòng Chảy 4 Chiều
            </CardTitle>
            <CardDescription className="text-xs">
              Xem xét đồng thời: Cấp phôi đầu vào &rarr; Năng lực nội tại trạm &rarr; Trợ lực công nhân điều chuyển &rarr; Tình trạng chặn ở đầu ra
            </CardDescription>
          </div>

          {/* Stage Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Chọn công đoạn:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {Object.keys(STAGES_DIAGNOSTIC_DB).map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedStageCode(code)}
                  className={`px-2.5 py-1 rounded-md font-mono font-bold transition-all ${
                    selectedStageCode === code
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* 4-Quadrant Interactive Diagnostic Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Quadrant 1: Đầu vào (Upstream) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-slate-400" /> 1. Cấp phôi đầu vào
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">{stage.upstreamCode}</Badge>
            </div>
            <div className="font-bold text-xs text-slate-800 line-clamp-1">{stage.upstreamName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Đầu ra chuyển tới:</span>
                <span className="font-bold text-slate-900">{stage.upstreamOutput.toLocaleString('vi-VN')} cái</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Tồn đệm tại trạm trước:</span>
                <span className="text-slate-700">{stage.upstreamWip} cái</span>
              </div>
            </div>
            <div className="text-[10px] text-teal-700 bg-teal-50 p-1.5 rounded border border-teal-100 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 shrink-0" /> Cấp phôi đều, liên tục
            </div>
          </div>

          {/* Quadrant 2: Trạm chính (Current Station Focus) */}
          <div className="p-3.5 bg-red-50/60 rounded-xl border-2 border-red-300 space-y-2 relative shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> 2. Năng lực trạm chính
              </span>
              <Badge variant="destructive" className="font-mono text-[10px]">{stage.code}</Badge>
            </div>
            <div className="font-bold text-xs text-red-950 line-clamp-1">{stage.name}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-red-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Tồn hiện tại (WIP):</span>
                <span className="font-bold text-red-700 text-xs">{stage.currentWip} cái</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Tỷ lệ chạy máy:</span>
                <span className="font-bold text-slate-900">{formatPercentage(stage.processingPct)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Thời gian chờ (Wait):</span>
                <span className="font-bold text-amber-700">{stage.staytime.toFixed(1)}s</span>
              </div>
            </div>
            <div className="text-[10px] text-red-800 bg-red-100/80 p-1.5 rounded border border-red-200 font-semibold flex items-center gap-1">
              <Activity className="h-3 w-3 shrink-0 text-red-600" /> Tải đạt đỉnh gần 100%
            </div>
          </div>

          {/* Quadrant 3: Trạm hỗ trợ điều chuyển */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Cpu className="h-3 w-3" /> 3. Trạm hỗ trợ linh hoạt
              </span>
              <Badge variant="navy" className="font-mono text-[10px]">{stage.supportWorkerCode}</Badge>
            </div>
            <div className="font-bold text-xs text-indigo-950 font-mono">{stage.supportStationName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-indigo-100">
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Số cái đã hỗ trợ:</span>
                <span className="font-bold text-indigo-900">{stage.supportOutput?.toLocaleString('vi-VN')} cái</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Tải máy hỗ trợ:</span>
                <span className="font-bold text-indigo-900">{formatPercentage(stage.supportPct)}</span>
              </div>
            </div>
            <div className="text-[10px] text-indigo-800 bg-indigo-100/70 p-1.5 rounded border border-indigo-200 flex items-center gap-1">
              <Activity className="h-3 w-3 shrink-0 text-indigo-600" /> Chia sẻ tải khi Q &ge; 15
            </div>
          </div>

          {/* Quadrant 4: Đầu ra (Downstream) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-slate-400" /> 4. Trạng thái chặn đầu ra
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">{stage.downstreamCode}</Badge>
            </div>
            <div className="font-bold text-xs text-slate-800 line-clamp-1">{stage.downstreamName}</div>
            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Tồn trạm kế tiếp:</span>
                <span className="font-bold text-slate-900">{stage.downstreamWip} cái</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Tải trạm kế tiếp:</span>
                <span className="text-slate-700">{formatPercentage(stage.downstreamProcessingPct)}</span>
              </div>
            </div>
            <div className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" /> Không bị chặn (Unblocked)
            </div>
          </div>
        </div>

        {/* Root Cause Diagnostic Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 text-white space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            Kết Luận Truy Ngược Căn Nguyên (Root-Cause Verdict) Cho {stage.code}:
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {stage.rootCauseVerdict}
          </p>
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-amber-300 font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-400" />
              <span><strong>Đề xuất Kaizen:</strong> {stage.kaizenRecommendation}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
