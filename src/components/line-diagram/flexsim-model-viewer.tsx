'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  ExternalLink,
  Users,
  Activity,
  Box,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Columns,
} from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  code: string;
  type: 'SOURCE' | 'PROCESSOR' | 'COMBINER' | 'OPERATOR' | 'SINK';
  x: number; // percentage from left
  y: number; // percentage from top
  description: string;
  stats: {
    wip?: string;
    staytime?: string;
    processing?: string;
    output?: string;
    rule?: string;
  };
  highlight?: boolean;
}

const MODEL_HOTSPOTS: Hotspot[] = [
  {
    id: 'hs_src_tt',
    name: 'Nguồn cấp Thân trước',
    code: 'SRC_TT',
    type: 'SOURCE',
    x: 28.5,
    y: 28.0,
    description: 'Cấp bán thành phẩm vải thân trước vào đầu chuyền nhánh 1 (CD01).',
    stats: { output: '5.500 cái (đạt 100%)', processing: '100% cấp liệu theo lịch' },
  },
  {
    id: 'hs_cd05',
    name: 'May đáp đáy thân trước (Nút thắt)',
    code: 'CD05 / P_CD05',
    type: 'PROCESSOR',
    x: 69.5,
    y: 26.5,
    description: 'Công đoạn trọng yếu có hàng chờ Q_CD05 lớn nhất toàn chuyền. Nhận hỗ trợ từ OP_04_05.',
    stats: { wip: '22 cái (tồn TB: 22.31 cái)', staytime: '700.33 giây', processing: '99.89%', output: '5.466 cái' },
    highlight: true,
  },
  {
    id: 'hs_op0405',
    name: 'Công nhân điều chuyển 1',
    code: 'OP_04_05',
    type: 'OPERATOR',
    x: 68.8,
    y: 19.5,
    description: 'Điều chuyển giữa P_CD04B và P_CD05B_HOTRO khi hàng chờ Q_CD05 dâng cao.',
    stats: { rule: 'P_CD04B ↔ P_CD05B_HOTRO', processing: '21.5% tại trạm hỗ trợ CD05B' },
    highlight: true,
  },
  {
    id: 'hs_src_ts',
    name: 'Nguồn cấp Thân sau',
    code: 'SRC_TS',
    type: 'SOURCE',
    x: 58.0,
    y: 42.5,
    description: 'Cấp bán thành phẩm thân sau vào CD07 trước khi đưa vào điểm ráp R01.',
    stats: { output: '5.500 cái', processing: '100%' },
  },
  {
    id: 'hs_r01',
    name: 'Điểm ráp 1: Thân trước + Thân sau',
    code: 'R01',
    type: 'COMBINER',
    x: 73.5,
    y: 44.5,
    description: 'Combiner ráp 1 BTP Thân trước từ CD06 và 1 BTP Thân sau từ CD07 tạo thành thân quần bán hoàn thiện.',
    stats: { output: '5.463 bộ', processing: '98.20%', staytime: '4.2 giây' },
    highlight: true,
  },
  {
    id: 'hs_src_lung',
    name: 'Nguồn cấp Cạp lưng',
    code: 'SRC_LUNG',
    type: 'SOURCE',
    x: 43.0,
    y: 38.0,
    description: 'Cấp chi tiết cạp chun vào nhánh CD15 trước khi ráp tại R02.',
    stats: { output: '5.500 cái', processing: '100%' },
  },
  {
    id: 'hs_r02',
    name: 'Điểm ráp 2: Ráp cạp lưng vào thân',
    code: 'R02',
    type: 'COMBINER',
    x: 35.5,
    y: 56.5,
    description: 'Combiner ráp cạp lưng từ CD15 vào thân quần từ CD14. Hàng chờ đầu vào có Q_R02_CHINH.',
    stats: { output: '5.438 bộ', processing: '97.80%', staytime: '4.8 giây' },
    highlight: true,
  },
  {
    id: 'hs_op1112',
    name: 'Công nhân điều chuyển 2',
    code: 'OP_11_12',
    type: 'OPERATOR',
    x: 61.2,
    y: 49.0,
    description: 'Điều chuyển linh hoạt giữa trạm P_CD11B và trạm hỗ trợ P_CD12B_HOTRO.',
    stats: { rule: 'P_CD11B ↔ P_CD12B_HOTRO', processing: '14.8% tại trạm hỗ trợ' },
  },
  {
    id: 'hs_op1314',
    name: 'Công nhân điều chuyển 3',
    code: 'OP_13_14',
    type: 'OPERATOR',
    x: 44.5,
    y: 50.0,
    description: 'Điều chuyển giữa trạm P_CD13B và trạm hỗ trợ P_CD14B_HOTRO khi cần giảm tải.',
    stats: { rule: 'P_CD13B ↔ P_CD14B_HOTRO', processing: '12.5% tại trạm hỗ trợ' },
  },
  {
    id: 'hs_op1617',
    name: 'Công nhân điều chuyển 4',
    code: 'OP_16_17',
    type: 'OPERATOR',
    x: 17.0,
    y: 67.0,
    description: 'Điều chuyển giữa trạm P_CD16B và trạm hỗ trợ P_CD17B_HOTRO.',
    stats: { rule: 'P_CD16B ↔ P_CD17B_HOTRO', processing: '18.2% tại trạm hỗ trợ' },
  },
  {
    id: 'hs_src_paget',
    name: 'Nguồn cấp Paget / Viền nẹp',
    code: 'SRC_PAGET',
    type: 'SOURCE',
    x: 15.0,
    y: 79.0,
    description: 'Cấp chi tiết Paget gấu vào CD20, CD21, CD22 trước khi ráp vào quần tại R03.',
    stats: { output: '5.500 cái', processing: '100%' },
  },
  {
    id: 'hs_r03',
    name: 'Điểm ráp 3: Ráp Paget vào quần',
    code: 'R03',
    type: 'COMBINER',
    x: 49.5,
    y: 71.0,
    description: 'Combiner ráp Paget hoàn thiện từ CD22 vào thân quần từ CD19.',
    stats: { output: '5.425 bộ', processing: '98.10%', staytime: '4.5 giây' },
    highlight: true,
  },
  {
    id: 'hs_sink_tp',
    name: 'Điểm thu gom thành phẩm cuối chuyền',
    code: 'SINK_TP',
    type: 'SINK',
    x: 87.5,
    y: 85.0,
    description: 'Sink tiếp nhận thành phẩm đã hoàn tất 27 công đoạn may và kiểm phẩm cuối cùng.',
    stats: { output: '5.408 cái (98.33% kế hoạch)', processing: '100% tiếp nhận' },
    highlight: true,
  },
];

export function FlexSimModelViewer() {
  const [zoom, setZoom] = useState(1);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(MODEL_HOTSPOTS[1]); // Default to CD05
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showDetailPanel, setShowDetailPanel] = useState(true);

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Mô Hình Mô Phỏng Autodesk FlexSim 2027
                </h3>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 text-[11px] font-mono">
                  NHOM2_FINAL_2_autosave_1.fsm
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Toàn cảnh sơ đồ 3D thực tế trên máy tính mô phỏng: 27 công đoạn, 4 nhánh cấp liệu, 3 trạm Combiner (R01, R02, R03) và 4 Operator điều chuyển.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailPanel((prev) => !prev)}
              className={`text-xs ${!showDetailPanel ? 'bg-teal-50 border-teal-300 text-teal-800' : 'text-slate-600'}`}
              title={showDetailPanel ? 'Ẩn bảng chi tiết để mở rộng khung sơ đồ' : 'Hiện bảng chi tiết thông số'}
            >
              <Columns className="h-3.5 w-3.5 mr-1" />
              {showDetailPanel ? 'Mở rộng sơ đồ' : 'Hiện chi tiết'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHotspots((prev) => !prev)}
              className={`text-xs ${showHotspots ? 'bg-teal-50 border-teal-300 text-teal-800' : 'text-slate-600'}`}
            >
              <Layers className="h-3.5 w-3.5 mr-1" />
              {showHotspots ? 'Ẩn chú thích' : 'Hiện chú thích'}
            </Button>

            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                title="Thu nhỏ (tối thiểu 50%)"
              >
                <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
              </Button>
              <span className="text-[11px] font-mono font-medium px-1.5 text-slate-700 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
                title="Phóng to (tối đa 200%)"
              >
                <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 border-l border-slate-200 rounded-none"
                onClick={() => setZoom(1)}
                title="Khôi phục kích thước vừa khung"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Vừa khung
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsFullscreen((prev) => !prev)}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 mr-1" /> Thu gọn
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 mr-1" /> Toàn màn hình
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Image Viewport + Hotspot Overlay */}
      <div className={`grid grid-cols-1 ${showDetailPanel ? 'lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
        <div className={`${showDetailPanel ? 'lg:col-span-3' : 'col-span-full'} ${isFullscreen ? 'fixed inset-4 z-50 bg-slate-950/95 p-4 rounded-2xl flex flex-col shadow-2xl' : ''}`}>
          {isFullscreen && (
            <div className="flex items-center justify-between pb-3 text-white border-b border-slate-800 mb-2">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-teal-400" />
                <span className="font-bold text-sm">Autodesk FlexSim 2027 - NHOM2_FINAL_2_autosave_1.fsm</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-xs"
              >
                <Minimize2 className="h-4 w-4 mr-1" /> Đóng toàn màn hình
              </Button>
            </div>
          )}

          <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-900 shadow-md">
            {/* FlexSim Status Bar Overlay */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700 text-white px-2.5 py-1 rounded-md text-[11px]">
              <span className="font-mono font-medium">FlexSim 2027 Education</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-mono">Run Time: 171.000,00s (100%)</span>
              <span className="text-slate-500">|</span>
              <span className="text-teal-400 font-medium">Tốc độ: 5.494x</span>
            </div>

            {/* Container with Zoom & Scroll */}
            <div className="overflow-auto max-h-[640px] flex items-center justify-center p-2 bg-slate-900">
              <div
                className="relative transition-all duration-200 mx-auto"
                style={{
                  width: `${Math.round(zoom * 100)}%`,
                  maxWidth: zoom <= 1 ? '100%' : 'none',
                }}
              >
                {/* Real FlexSim Model Screenshot */}
                <img
                  src="/images/flexsim-model-layout.jpg"
                  alt="Sơ đồ mô phỏng Autodesk FlexSim 2027 - Chuyền May Nhóm 2"
                  className="w-full h-auto object-contain rounded-lg select-none pointer-events-auto block"
                />

                {/* Hotspot Markers Overlay */}
                {showHotspots &&
                  MODEL_HOTSPOTS.map((hs) => {
                    const isSelected = selectedHotspot?.id === hs.id;
                    return (
                      <button
                        key={hs.id}
                        onClick={() => {
                          setSelectedHotspot(hs);
                          if (!showDetailPanel) setShowDetailPanel(true);
                        }}
                        style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all duration-150 ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                        }`}
                        title={`${hs.code}: ${hs.name}`}
                      >
                        <span className="relative flex h-6 w-6 items-center justify-center">
                          {hs.highlight && (
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                hs.type === 'PROCESSOR'
                                  ? 'bg-red-400'
                                  : hs.type === 'COMBINER'
                                  ? 'bg-amber-400'
                                  : 'bg-teal-400'
                              }`}
                            />
                          )}
                          <span
                            className={`relative inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold shadow-md border-2 ${
                              isSelected
                                ? 'bg-white text-slate-900 border-teal-500 ring-2 ring-teal-400'
                                : hs.type === 'PROCESSOR' && hs.highlight
                                ? 'bg-red-600 text-white border-white'
                                : hs.type === 'COMBINER'
                                ? 'bg-amber-500 text-white border-white'
                                : hs.type === 'OPERATOR'
                                ? 'bg-purple-600 text-white border-white'
                                : hs.type === 'SINK'
                                ? 'bg-emerald-600 text-white border-white'
                                : 'bg-teal-600 text-white border-white'
                            }`}
                          >
                            {hs.code.startsWith('OP')
                              ? 'OP'
                              : hs.code.startsWith('R0')
                              ? hs.code
                              : hs.code.startsWith('SRC')
                              ? 'IN'
                              : hs.code === 'SINK_TP'
                              ? 'TP'
                              : '05'}
                          </span>
                        </span>

                        {/* Tooltip on Hover */}
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium py-1 px-2 rounded-md shadow-lg pointer-events-none">
                          <span className="font-bold text-teal-300">{hs.code}:</span> {hs.name}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Hotspot Detail Card */}
        {showDetailPanel && (
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-slate-200 shadow-xs h-full flex flex-col justify-between">
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      selectedHotspot?.type === 'PROCESSOR'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : selectedHotspot?.type === 'COMBINER'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : selectedHotspot?.type === 'OPERATOR'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : selectedHotspot?.type === 'SINK'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-teal-50 text-teal-700 border-teal-200'
                    }
                  >
                    {selectedHotspot?.type ?? 'CHI TIẾT ĐỐI TƯỢNG'}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {selectedHotspot?.code}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {selectedHotspot?.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {selectedHotspot?.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs flex-1">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Thông Số Đo FlexSim:
                  </span>

                  {selectedHotspot?.stats.output && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 gap-2">
                      <span className="text-slate-500">Sản lượng qua trạm:</span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        {selectedHotspot.stats.output}
                      </span>
                    </div>
                  )}

                  {selectedHotspot?.stats.wip && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 gap-2">
                      <span className="text-slate-500">Tồn BTP (WIP):</span>
                      <span className="font-mono font-bold text-red-600 shrink-0 text-right">
                        {selectedHotspot.stats.wip}
                      </span>
                    </div>
                  )}

                  {selectedHotspot?.stats.staytime && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 gap-2">
                      <span className="text-slate-500">Thời gian chờ (Wait):</span>
                      <span className="font-mono text-slate-800 shrink-0 text-right">
                        {selectedHotspot.stats.staytime}
                      </span>
                    </div>
                  )}

                  {selectedHotspot?.stats.processing && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 gap-2">
                      <span className="text-slate-500">Tỷ lệ chạy máy (Proc %):</span>
                      <span className="font-mono font-bold text-teal-700 shrink-0 text-right">
                        {selectedHotspot.stats.processing}
                      </span>
                    </div>
                  )}

                  {selectedHotspot?.stats.rule && (
                    <div className="py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 block mb-0.5">Quy tắc điều chuyển:</span>
                      <span className="font-sans font-medium text-purple-700 bg-purple-50 p-1.5 rounded block">
                        {selectedHotspot.stats.rule}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Navigation / Hotspot List */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Chọn Điểm Quan Sát Nhanh:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MODEL_HOTSPOTS.slice(0, 8).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHotspot(h)}
                        className={`text-[11px] text-left px-2 py-1 rounded border transition-colors truncate ${
                          selectedHotspot?.id === h.id
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {h.code}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl text-[11px] text-slate-500 flex items-center justify-between">
                <span>Đồng bộ từ tệp mô phỏng .fsm</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
