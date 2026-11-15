'use client';

import React, { useState } from 'react';
import { InteractiveLineDiagram } from './interactive-diagram';
import { FlexSimModelViewer } from './flexsim-model-viewer';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Network, Eye, Columns, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

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

export function LineDiagramTabs({ nodes }: { nodes: DiagramNode[] }) {
  const [activeTab, setActiveTab] = useState<'3D_MODEL' | 'INTERACTIVE' | 'SPLIT'>('3D_MODEL');

  return (
    <div className="space-y-4">
      {/* View Switcher Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            onClick={() => setActiveTab('3D_MODEL')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === '3D_MODEL'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Eye className="h-4 w-4 text-teal-600" />
            <span>Ảnh Chụp Mô Hình FlexSim Thực Tế</span>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] py-0 px-1 font-mono">
              3D/2D FSM
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('INTERACTIVE')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'INTERACTIVE'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Network className="h-4 w-4 text-teal-600" />
            <span>Sơ Đồ Luồng Logic Tương Tác</span>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] py-0 px-1 font-mono">
              27 Trạm + R01–R03
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('SPLIT')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'SPLIT'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Columns className="h-4 w-4 text-teal-600" />
            <span>So Sánh Hai Góc Nhìn</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Khớp 100% đối tượng Autodesk FlexSim 2027</span>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === '3D_MODEL' && <FlexSimModelViewer />}

      {activeTab === 'INTERACTIVE' && <InteractiveLineDiagram nodes={nodes} />}

      {activeTab === 'SPLIT' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-teal-600" />
              1. Bố Trí Không Gian 3D Trên Phần Mềm Autodesk FlexSim
            </h3>
            <FlexSimModelViewer />
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Network className="h-4 w-4 text-teal-600" />
              2. Sơ Đồ Khối Luồng Sản Xuất & Kiểm Soát Tồn Bán Thành Phẩm (WIP)
            </h3>
            <InteractiveLineDiagram nodes={nodes} />
          </div>
        </div>
      )}
    </div>
  );
}
