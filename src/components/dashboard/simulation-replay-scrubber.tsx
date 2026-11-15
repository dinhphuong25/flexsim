'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  FastForward,
  Rewind,
  ArrowRight,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatPercentage } from '@/lib/kpi';

interface TimeSnapshot {
  seconds: number;
  label: string;
  shiftName: string;
  sinkOutput: number;
  completionPct: number;
  totalWip: number;
  cd05Wip: number;
  cd12Wip: number;
  cd14Wip: number;
  cd17Wip: number;
  activeWorkerEvent: string;
  eventDescription: string;
  criticalEventBadge?: string;
}

const TIMELINE_SNAPSHOTS: TimeSnapshot[] = [
  {
    seconds: 0,
    label: '0s (Bắt đầu)',
    shiftName: 'Khởi động ca mô phỏng',
    sinkOutput: 0,
    completionPct: 0.0,
    totalWip: 0,
    cd05Wip: 0,
    cd12Wip: 0,
    cd14Wip: 0,
    cd17Wip: 0,
    activeWorkerEvent: '30 công nhân cố định tại vị trí; 4 công nhân điều chuyển ở trạm chính vị trí A.',
    eventDescription: 'Các nguồn cấp phôi (SRC_TT, SRC_TS, SRC_LUNG, SRC_PAGET) bắt đầu xuất phôi vải vào chuyền. Các máy may chạy rà soát ban đầu.',
  },
  {
    seconds: 34200,
    label: '34.200s (9.5h)',
    shiftName: 'Cuối Ca 1',
    sinkOutput: 1080,
    completionPct: 19.64,
    totalWip: 24,
    cd05Wip: 8,
    cd12Wip: 2,
    cd14Wip: 2,
    cd17Wip: 2,
    activeWorkerEvent: 'OP_04_05 vẫn làm việc tại P_CD04B (Chưa kích hoạt điều chuyển vì Q_CD05 < 15).',
    eventDescription: 'Tồn bắt đầu nhen nhóm tích lũy tại trạm may đáp đáy CD05 (từ 0 lên 8 cái). Điểm ráp R01 đã ghép được 1.050 bộ thân.',
  },
  {
    seconds: 68400,
    label: '68.400s (19.0h)',
    shiftName: 'Cuối Ca 2',
    sinkOutput: 2165,
    completionPct: 39.36,
    totalWip: 48,
    cd05Wip: 16,
    cd12Wip: 4,
    cd14Wip: 3,
    cd17Wip: 3,
    activeWorkerEvent: 'KÍCH HOẠT ĐIỀU CHUYỂN: OP_04_05 di chuyển sang P_CD05B_HOTRO khi Q_CD05 vượt ngưỡng 15!',
    eventDescription: 'Nút thắt CD05 bắt đầu tắc nghẽn rõ rệt (16 cái). Máy phụ P_CD05B_HOTRO được khởi động, công nhân điều chuyển OP_04_05 tiếp sức giúp chặn đà tăng tồn.',
    criticalEventBadge: 'Kích hoạt OP_04_05',
  },
  {
    seconds: 102600,
    label: '102.600s (28.5h)',
    shiftName: 'Cuối Ca 3',
    sinkOutput: 3250,
    completionPct: 59.09,
    totalWip: 72,
    cd05Wip: 26,
    cd12Wip: 13,
    cd14Wip: 4,
    cd17Wip: 4,
    activeWorkerEvent: 'ĐIỀU CHUYỂN KÉP: OP_11_12 hỗ trợ P_CD12B_HOTRO; OP_04_05 tạm quay về P_CD04B trả nợ tồn thân.',
    eventDescription: 'Đỉnh điểm tồn ứ toàn ca: CD05 vọt lên 26 cái do OP_04_05 phải quay lại may trạm chính P_CD04B. Đồng thời hàng chờ Q_CD12 đạt 13 cái, kích hoạt OP_11_12.',
    criticalEventBadge: 'Đỉnh tồn đọng 26 cái',
  },
  {
    seconds: 136800,
    label: '136.800s (38.0h)',
    shiftName: 'Cuối Ca 4',
    sinkOutput: 4330,
    completionPct: 78.73,
    totalWip: 86,
    cd05Wip: 24,
    cd12Wip: 6,
    cd14Wip: 11,
    cd17Wip: 11,
    activeWorkerEvent: 'OP_13_14 hỗ trợ P_CD14B; OP_16_17 hỗ trợ P_CD17B. OP_04_05 trở lại trạm may đáp đáy.',
    eventDescription: 'Tồn được phân bổ đều ra các trạm sau R02. Tồn tại CD12 giảm từ 13 về 6 cái nhờ OP_11_12. Điểm ráp R02 và R03 duy trì tốc độ ghép 98%.',
  },
  {
    seconds: 171000,
    label: '171.000s (47.5h)',
    shiftName: 'Kết Thúc Chu Kỳ',
    sinkOutput: 5408,
    completionPct: 98.33,
    totalWip: 92,
    cd05Wip: 22,
    cd12Wip: 4,
    cd14Wip: 4,
    cd17Wip: 4,
    activeWorkerEvent: 'Hoàn thành thời lượng mô phỏng 171.000s. 4 công nhân điều chuyển hoàn thành 2.686 lượt hỗ trợ.',
    eventDescription: 'Thành phẩm tại SINK_TP đạt 5.408 cái (98,33%). Tồn dở dang toàn bộ 27 trạm dừng ở 92 cái (khớp phương trình cân bằng 5408 + 92 = 5500).',
    criticalEventBadge: 'Nghiệm thu 5.408 cái',
  },
];

export function SimulationReplayScrubber() {
  const [currentIndex, setCurrentIndex] = useState<number>(TIMELINE_SNAPSHOTS.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2500); // ms per step

  const snapshot = TIMELINE_SNAPSHOTS[currentIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= TIMELINE_SNAPSHOTS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const handleStep = (delta: number) => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(Math.max(prev + delta, 0), TIMELINE_SNAPSHOTS.length - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <Card className="border border-slate-200 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Clock className="h-5 w-5 text-teal-600" />
              Phát Lại Lượt Mô Phỏng & Dòng Di Chuyển Theo Thời Gian
            </CardTitle>
            <CardDescription className="text-xs">
              Kéo thanh trượt để truy vết: Tồn BTP bắt đầu tăng ở mốc thời gian nào và sau lần điều chuyển nhân sự nào
            </CardDescription>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs"
              title="Về ban đầu (0s)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep(-1)}
              disabled={currentIndex === 0}
              className="h-8 px-2 text-xs"
              title="Lùi 1 mốc"
            >
              <Rewind className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`h-8 px-3 text-xs gap-1.5 font-bold ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Phát lại'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep(1)}
              disabled={currentIndex === TIMELINE_SNAPSHOTS.length - 1}
              className="h-8 px-2 text-xs"
              title="Tiến 1 mốc"
            >
              <FastForward className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Timeline Slider & Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
            <span>0s (Bắt đầu)</span>
            <span className="text-teal-700 text-sm bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Thời điểm hiện tại: {snapshot.seconds.toLocaleString('vi-VN')}s ({snapshot.shiftName})
            </span>
            <span>171.000s (Kết thúc ca)</span>
          </div>

          <input
            type="range"
            min="0"
            max={TIMELINE_SNAPSHOTS.length - 1}
            step="1"
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />

          {/* Timeline Step Buttons */}
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {TIMELINE_SNAPSHOTS.map((snap, idx) => (
              <button
                key={snap.seconds}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`p-1.5 rounded-lg text-center transition-all border text-[10px] font-mono ${
                  currentIndex === idx
                    ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs ring-1 ring-teal-500'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="truncate">{snap.label}</div>
                <div className="text-[9px] text-slate-400 font-sans truncate">{snap.shiftName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time State Indicators at this moment */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Thành phẩm Sink</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-teal-800">
                {snapshot.sinkOutput.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">/ 5.500</span>
            </div>
            <div className="text-[10px] text-teal-700 mt-1 font-semibold">
              Tiến độ: {formatPercentage(snapshot.completionPct)}
            </div>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-200">
            <span className="text-[10px] text-red-700 uppercase block font-semibold">Tồn nút thắt CD05</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-red-700">
                {snapshot.cd05Wip}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">cái</span>
            </div>
            <div className="text-[10px] text-red-600 mt-1 font-mono">
              {snapshot.cd05Wip >= 15 ? 'Đã vượt ngưỡng điều chuyển' : 'Dưới ngưỡng đi (15)'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tồn toàn chuyền</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900">
                {snapshot.totalWip}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">cái</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              CD12: {snapshot.cd12Wip} | CD14: {snapshot.cd14Wip}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
            <span className="text-[10px] text-indigo-700 uppercase block font-semibold">Sự kiện nhân sự</span>
            <div className="text-xs font-bold text-indigo-950 mt-1 line-clamp-1">
              {snapshot.criticalEventBadge || 'Duy trì nhịp ca'}
            </div>
            <div className="text-[10px] text-indigo-700 mt-1 font-sans truncate">
              4 thợ điều chuyển linh hoạt
            </div>
          </div>
        </div>

        {/* Narrative Analysis for this Time Step */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-teal-300">
              <Activity className="h-4 w-4 text-teal-400" />
              Diễn Biến Thực Nghiệm Tại Mốc {snapshot.label}:
            </div>
            {snapshot.criticalEventBadge && (
              <Badge variant="destructive" className="text-[10px]">
                {snapshot.criticalEventBadge}
              </Badge>
            )}
          </div>
          <p className="text-slate-200 leading-relaxed font-sans">
            {snapshot.eventDescription}
          </p>
          <div className="pt-2 border-t border-slate-800 text-indigo-300 font-medium">
            <strong>Hành vi điều chuyển:</strong> {snapshot.activeWorkerEvent}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
