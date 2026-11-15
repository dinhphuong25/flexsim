'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ArrowLeftRight,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sliders,
  RotateCcw,
  Activity,
  Footprints,
  Hammer,
} from 'lucide-react';
import { formatPercentage } from '@/lib/kpi';

interface WorkerData {
  id: string;
  workerCode: string;
  name: string;
  stationA: string;
  stationB: string;
  triggerThreshold: number;
  returnThreshold: number;
  currentQueue: number;
  primaryPct: number;
  supportPct: number;
  transitPct: number;
  unitsAssisted: number;
}

const INITIAL_DISPATCH_STATE: WorkerData[] = [
  {
    id: 'op_04_05',
    workerCode: 'OP_04_05',
    name: 'Nguyễn Thị Hoa (May sườn & đắp đáy)',
    stationA: 'P_CD04B',
    stationB: 'P_CD05B_HOTRO',
    triggerThreshold: 15,
    returnThreshold: 8,
    currentQueue: 22,
    primaryPct: 73.74,
    supportPct: 24.79,
    transitPct: 1.47,
    unitsAssisted: 1043,
  },
  {
    id: 'op_11_12',
    workerCode: 'OP_11_12',
    name: 'Trần Văn Đức (May ly túi & mí sườn)',
    stationA: 'P_CD11B',
    stationB: 'P_CD12B_HOTRO',
    triggerThreshold: 12,
    returnThreshold: 6,
    currentQueue: 4,
    primaryPct: 88.27,
    supportPct: 10.15,
    transitPct: 1.58,
    unitsAssisted: 420,
  },
  {
    id: 'op_13_14',
    workerCode: 'OP_13_14',
    name: 'Lê Thị Mai (Chun sườn & viền túi)',
    stationA: 'P_CD13B',
    stationB: 'P_CD14B_HOTRO',
    triggerThreshold: 10,
    returnThreshold: 5,
    currentQueue: 4,
    primaryPct: 82.96,
    supportPct: 15.22,
    transitPct: 1.82,
    unitsAssisted: 635,
  },
  {
    id: 'op_16_17',
    workerCode: 'OP_16_17',
    name: 'Phạm Thị Lan (Luồn chun & mí cạp)',
    stationA: 'P_CD16B',
    stationB: 'P_CD17B_HOTRO',
    triggerThreshold: 10,
    returnThreshold: 5,
    currentQueue: 4,
    primaryPct: 81.87,
    supportPct: 16.45,
    transitPct: 1.68,
    unitsAssisted: 688,
  },
];

export function FloatingWorkerDispatcher() {
  const [workers, setWorkers] = useState<WorkerData[]>(INITIAL_DISPATCH_STATE);

  const handleQueueChange = (workerId: string, newQueueVal: number) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          return { ...w, currentQueue: newQueueVal };
        }
        return w;
      })
    );
  };

  const handleReset = () => {
    setWorkers(INITIAL_DISPATCH_STATE);
  };

  return (
    <div className="space-y-5">
      {/* Dispatcher Center Banner */}
      <Card className="border border-indigo-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-semibold tracking-wide uppercase border border-indigo-400/30">
              <Sliders className="h-3 w-3" />
              Bộ Mô Phỏng Điều Phối Linh Hoạt (Floating Worker Hub)
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Trung Tâm Giám Sát & Mô Phỏng 4 Công Nhân Điều Chuyển
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
              Theo dõi logic điều chuyển tự động giữa trạm chính (Vị trí A) và trạm hỗ trợ (Vị trí B). Bạn có thể kéo thử nghiệm thanh trượt mức tồn hàng chờ Q để quan sát quyết định điều động theo ngưỡng ngưỡng cài đặt trong FlexSim.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs gap-1.5 bg-white/10 hover:bg-white/20 border-white/20 text-white shrink-0 self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Khôi phục mặc định
          </Button>
        </CardContent>
      </Card>

      {/* 4 Floating Workers Simulator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map((w) => {
          const isAssisting = w.currentQueue >= w.triggerThreshold;
          const isReturning = w.currentQueue <= w.returnThreshold;
          const activeStation = isAssisting ? w.stationB : w.stationA;

          return (
            <Card
              key={w.id}
              className={`border-2 transition-all duration-200 ${
                isAssisting
                  ? 'border-indigo-400 bg-indigo-50/30 shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader className="p-4 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                      {w.workerCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{w.name}</span>
                  </div>
                  {isAssisting ? (
                    <Badge variant="navy" className="gap-1 animate-pulse">
                      <UserCheck className="h-3 w-3 text-indigo-300" />
                      Đang hỗ trợ tại Vị trí B
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600 bg-slate-50">
                      Vận hành tại Vị trí A
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                {/* Station Transfer Status Indicator */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className={`text-center p-2 rounded-lg transition-colors flex-1 ${
                    !isAssisting ? 'bg-teal-100/80 border border-teal-300 font-bold text-teal-950' : 'text-slate-600'
                  }`}>
                    <span className="text-[10px] font-sans block opacity-75">Trạm chính (Vị trí A)</span>
                    <span className="font-mono text-sm">{w.stationA}</span>
                    {!isAssisting && (
                      <span className="text-[10px] text-teal-800 block mt-0.5 font-sans font-medium">
                        ● Đang gia công
                      </span>
                    )}
                  </div>

                  <div className="px-3 flex flex-col items-center">
                    <ArrowLeftRight className={`h-4 w-4 ${isAssisting ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">Điều chuyển</span>
                  </div>

                  <div className={`text-center p-2 rounded-lg transition-colors flex-1 ${
                    isAssisting ? 'bg-indigo-100/90 border border-indigo-300 font-bold text-indigo-950 shadow-xs' : 'text-slate-600'
                  }`}>
                    <span className="text-[10px] font-sans block opacity-75">Trạm hỗ trợ (Vị trí B)</span>
                    <span className="font-mono text-sm">{w.stationB}</span>
                    {isAssisting && (
                      <span className="text-[10px] text-indigo-800 block mt-0.5 font-sans font-medium">
                        ● Đang trợ giúp
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Queue Slider */}
                <div className="space-y-1.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      Mức tồn hàng chờ {w.stationB.replace('P_', 'Q_').replace('B_HOTRO', '')}:
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {w.currentQueue} cái
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={w.currentQueue}
                    onChange={(e) => handleQueueChange(w.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 cái (Hết tồn)</span>
                    <span className="text-amber-600 font-semibold">Ngưỡng về &le; {w.returnThreshold}</span>
                    <span className="text-red-600 font-semibold">Ngưỡng đi &ge; {w.triggerThreshold}</span>
                    <span>30 cái</span>
                  </div>
                </div>

                {/* Workload Breakdown (Section 8 Principle) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Cơ cấu thời gian làm việc thực tế:</span>
                    <span className="font-mono text-teal-800 font-semibold">
                      Đã gia công: {w.unitsAssisted.toLocaleString('vi-VN')} cái
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      style={{ width: `${w.primaryPct}%` }}
                      className="bg-teal-600 h-full"
                      title={`Trạm chính: ${w.primaryPct}%`}
                    />
                    <div
                      style={{ width: `${w.supportPct}%` }}
                      className="bg-indigo-600 h-full"
                      title={`Trạm hỗ trợ: ${w.supportPct}%`}
                    />
                    <div
                      style={{ width: `${w.transitPct}%` }}
                      className="bg-amber-400 h-full"
                      title={`Di chuyển/Đổi trạm: ${w.transitPct}%`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      Trạm chính: <strong>{w.primaryPct}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      Trạm hỗ trợ: <strong>{w.supportPct}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Di chuyển: <strong>{w.transitPct}%</strong>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
