'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  X,
  Layers,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';

interface DiagramNode {
  id: string;
  code: string;
  name: string;
  branch: string;
  type: 'SOURCE' | 'PROCESSOR' | 'COMBINER' | 'SINK' | 'SUPPORT';
  parallel?: boolean;
  hasSupport?: boolean;
  supportName?: string;
  wip?: number | null;
  avgWip?: number | null;
  staytime?: number | null;
  processingPct?: number | null;
  output?: number | null;
  measured: boolean;
}

export function InteractiveLineDiagram({
  nodes,
}: {
  nodes: DiagramNode[];
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.7), 1.6));
  };

  const resetZoom = () => setZoomLevel(1);

  const getNodeStyle = (node: DiagramNode) => {
    // Tuân thủ Mục 7: Dữ liệu thiếu thể hiện "chưa biết" (neutral dashed), không tô xanh bình thường
    if (!node.measured) {
      return 'border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400';
    }
    if ((node.wip ?? 0) > 10) {
      return 'border-solid border-red-400 bg-red-50/90 text-red-900 shadow-sm hover:border-red-600';
    }
    if ((node.wip ?? 0) > 0) {
      return 'border-solid border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-500';
    }
    return 'border-solid border-teal-500 bg-teal-50/70 text-teal-950 hover:border-teal-700';
  };

  // Group nodes into branches according to Section 4
  const frontBodyNodes = nodes.filter((n) => n.branch === 'FRONT_BODY');
  const backBodyNodes = nodes.filter((n) => n.branch === 'BACK_BODY');
  const postR01Nodes = nodes.filter((n) => n.branch === 'POST_R01' && n.code !== 'R01');
  const waistbandNodes = nodes.filter((n) => n.branch === 'WAISTBAND');
  const postR02Nodes = nodes.filter((n) => n.branch === 'POST_R02' && n.code !== 'R02');
  const pagetNodes = nodes.filter((n) => n.branch === 'PAGET');
  const postR03Nodes = nodes.filter((n) => n.branch === 'POST_R03' && n.code !== 'R03');

  const r01Node = nodes.find((n) => n.code === 'R01');
  const r02Node = nodes.find((n) => n.code === 'R02');
  const r03Node = nodes.find((n) => n.code === 'R03');

  return (
    <div className="space-y-4">
      {/* Controls & Legend Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">Chú giải trạng thái:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded border border-dashed border-slate-400 bg-slate-100" />
              <span className="text-slate-600">Chưa có số liệu đo (Chưa biết)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded border border-red-400 bg-red-100" />
              <span className="text-red-700 font-medium">Tồn đọng cao (&gt;10 cái)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded border border-amber-300 bg-amber-100" />
              <span className="text-amber-800">Có tồn BTP (1–10 cái)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded border border-teal-500 bg-teal-100" />
              <span className="text-teal-800">Đã kiểm tra (Hết tồn = 0)</span>
            </div>
          </div>

          {/* Zoom Actions */}
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
            <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)} title="Thu nhỏ">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono font-medium w-12 text-center text-slate-600">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)} title="Phóng to">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetZoom} title="Mặc định">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Diagram Canvas */}
      <div className="relative border border-slate-200 bg-slate-900/5 rounded-xl p-6 overflow-x-auto min-h-[520px]">
        <div
          className="transition-transform duration-200 origin-top-left space-y-8 min-w-[980px]"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* STAGE 1: Nhánh Thân Trước & Thân Sau ráp vào R01 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Nhánh Thân Trước, Thân Sau &rarr; Điểm Ráp R01
              </span>
              <span className="text-[11px] text-slate-400">R01 yêu cầu: 1 BTP Thân Trước + 1 BTP Thân Sau</span>
            </div>

            <div className="space-y-3">
              {/* Thân trước */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200 w-28 shrink-0 text-center">
                  SRC_TT
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                {frontBodyNodes.map((n) => (
                  <React.Fragment key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                        n
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{n.code}</span>
                        {n.parallel && <span className="text-[9px] px-1 bg-white/80 rounded">A/B</span>}
                      </div>
                      <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                        {n.name}
                      </div>
                      {n.measured && (
                        <div className="text-[10px] mt-0.5 font-bold">
                          WIP: {n.wip ?? 0}
                        </div>
                      )}
                    </button>
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  </React.Fragment>
                ))}

                {/* Điểm ráp R01 */}
                {r01Node && (
                  <button
                    onClick={() => setSelectedNode(r01Node)}
                    className="px-4 py-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-950 font-bold text-xs shadow-sm hover:bg-indigo-100"
                  >
                    <div className="flex items-center gap-1">
                      <GitCommit className="h-4 w-4 text-indigo-600" />
                      <span>R01 (Ráp Thân)</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Thân sau */}
              <div className="flex items-center gap-2 flex-wrap pt-1 pl-4 border-l-2 border-slate-200">
                <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-28 shrink-0 text-center">
                  SRC_TS
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                {backBodyNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                      n
                    )}`}
                  >
                    <div>{n.code}</div>
                    <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                      {n.name}
                    </div>
                  </button>
                ))}
                <span className="text-xs text-indigo-600 font-medium italic">&rarr; Đưa vào R01</span>
              </div>
            </div>
          </div>

          {/* STAGE 2: Sau R01 & Nhánh Cạp Lưng &rarr; Điểm Ráp R02 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Sau R01 (CD08 - CD14) & Nhánh Cạp Lưng (CD15) &rarr; Điểm Ráp R02
              </span>
              <span className="text-[11px] text-slate-400">R02 yêu cầu: 1 BTP sau CD14 + 1 Cạp Lưng từ CD15</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Từ R01 &rarr;</span>
                {postR01Nodes.map((n) => (
                  <React.Fragment key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                        n
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{n.code}</span>
                        {n.parallel && <span className="text-[9px] px-1 bg-white/80 rounded">A/B</span>}
                      </div>
                      <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                        {n.name}
                      </div>
                      {n.measured && (
                        <div className="text-[10px] mt-0.5 font-bold">
                          WIP: {n.wip ?? 0}
                        </div>
                      )}
                    </button>
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  </React.Fragment>
                ))}

                {/* Điểm ráp R02 */}
                {r02Node && (
                  <button
                    onClick={() => setSelectedNode(r02Node)}
                    className="px-4 py-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-950 font-bold text-xs shadow-sm hover:bg-indigo-100"
                  >
                    <div className="flex items-center gap-1">
                      <GitCommit className="h-4 w-4 text-indigo-600" />
                      <span>R02 (Tra Cạp)</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Nhánh lưng */}
              <div className="flex items-center gap-2 flex-wrap pt-1 pl-4 border-l-2 border-slate-200">
                <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-28 shrink-0 text-center">
                  SRC_LUNG
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                {waistbandNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                      n
                    )}`}
                  >
                    <div>{n.code}</div>
                    <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                      {n.name}
                    </div>
                  </button>
                ))}
                <span className="text-xs text-indigo-600 font-medium italic">&rarr; Đưa vào R02 (Q_R02_CHINH)</span>
              </div>
            </div>
          </div>

          {/* STAGE 3: Sau R02, Nhánh Paget & Ráp R03 &rarr; Hoàn thiện SINK_TP */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                3. Sau R02, Nhánh Paget (CD20-CD22), Ráp R03 &rarr; SINK_TP (Thành phẩm)
              </span>
              <span className="text-[11px] text-slate-400">R03 yêu cầu: 1 BTP sau CD19 + 1 Paget từ CD22</span>
            </div>

            <div className="space-y-3">
              {/* Sau R02 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Từ R02 &rarr;</span>
                {postR02Nodes.map((n) => (
                  <React.Fragment key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                        n
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{n.code}</span>
                        {n.parallel && <span className="text-[9px] px-1 bg-white/80 rounded">A/B</span>}
                      </div>
                      <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                        {n.name}
                      </div>
                      {n.measured && (
                        <div className="text-[10px] mt-0.5 font-bold">
                          WIP: {n.wip ?? 0}
                        </div>
                      )}
                    </button>
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  </React.Fragment>
                ))}

                {/* R03 */}
                {r03Node && (
                  <button
                    onClick={() => setSelectedNode(r03Node)}
                    className="px-4 py-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-950 font-bold text-xs shadow-sm hover:bg-indigo-100"
                  >
                    <div className="flex items-center gap-1">
                      <GitCommit className="h-4 w-4 text-indigo-600" />
                      <span>R03 (Ráp Paget)</span>
                    </div>
                  </button>
                )}

                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />

                {/* Sau R03 */}
                {postR03Nodes.map((n) => (
                  <React.Fragment key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${
                        n.code === 'SINK_TP'
                          ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : getNodeStyle(n)
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{n.code}</span>
                        {n.parallel && <span className="text-[9px] px-1 bg-white/80 rounded">A/B</span>}
                      </div>
                      <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                        {n.name}
                      </div>
                    </button>
                    {n.code !== 'SINK_TP' && <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Nhánh Paget */}
              <div className="flex items-center gap-2 flex-wrap pt-1 pl-4 border-l-2 border-slate-200">
                <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-28 shrink-0 text-center">
                  SRC_PAGET
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                {pagetNodes.map((n) => (
                  <React.Fragment key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all shadow-2xs text-left ${getNodeStyle(
                        n
                      )}`}
                    >
                      <div>{n.code}</div>
                      <div className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[85px]">
                        {n.name}
                      </div>
                    </button>
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  </React.Fragment>
                ))}
                <span className="text-xs text-indigo-600 font-medium italic">&rarr; Đưa vào R03</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer / Card */}
      {selectedNode && (
        <Card className="border-t-4 border-t-teal-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="py-3 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-900">{selectedNode.code}</span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-800">{selectedNode.name}</span>
              <Badge variant="outline">{selectedNode.branch}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-slate-50 rounded-lg text-xs font-mono">
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Tồn hiện tại</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatMetricNumber(selectedNode.wip, 0, 'cái')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Tồn trung bình</span>
                <span className="text-slate-800 text-sm">
                  {formatMetricNumber(selectedNode.avgWip, 2, 'cái')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Chờ trung bình</span>
                <span className="text-slate-800 text-sm">
                  {formatMetricNumber(selectedNode.staytime, 2, 's')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Tỷ lệ Processing</span>
                <span className="font-bold text-teal-800 text-sm">
                  {formatPercentage(selectedNode.processingPct)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Trạm song song</span>
                <span className="text-slate-800 text-sm font-sans">
                  {selectedNode.parallel ? '2 trạm (A/B)' : '1 trạm đơn'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[11px]">Trạng thái đo</span>
                <span className="text-sm font-sans font-medium">
                  {selectedNode.measured ? (
                    <span className="text-teal-700">Đã xác minh</span>
                  ) : (
                    <span className="text-slate-400">Chưa có số liệu</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
