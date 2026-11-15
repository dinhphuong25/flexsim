'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, Filter, AlertTriangle, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';

interface StageWithMetrics {
  id: string;
  stageCode: string;
  name: string;
  branch: string;
  sequenceOrder: number;
  parallelStationCount: number;
  standardProcessTime?: number;
  notes?: string;
  metric: {
    inputCount: number | null;
    outputCount: number | null;
    currentWip: number | null;
    avgWip: number | null;
    maxWip: number | null;
    avgStaytime: number | null;
    processingPct: number | null;
  } | null;
  objects: {
    id: string;
    flexsimName: string;
    objectType: string;
    branch?: string;
    isInventoryAudited: boolean;
    capacity?: number;
    description?: string;
    metric: {
      inputCount: number | null;
      outputCount: number | null;
      currentContent: number | null;
      avgContent: number | null;
      maxContent: number | null;
      avgStaytime: number | null;
      processingPct: number | null;
      stateAtSample?: string | null;
    } | null;
  }[];
}

const BRANCH_LABELS: Record<string, string> = {
  ALL: 'Tất cả các nhánh',
  FRONT_BODY: 'Nhánh Thân Trước (CD01 - CD06)',
  BACK_BODY: 'Nhánh Thân Sau (CD07)',
  POST_R01: 'Sau R01 (CD08 - CD14)',
  WAISTBAND: 'Nhánh Cạp Lưng (CD15)',
  POST_R02: 'Sau R02 (CD16 - CD19)',
  PAGET: 'Nhánh Paget (CD20 - CD22)',
  POST_R03: 'Sau R03 (CD23 - SINK_TP)',
};

export function StageManagementTable({ stages }: { stages: StageWithMetrics[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [filterMeasuredOnly, setFilterMeasuredOnly] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['stg_cd05']));

  const toggleExpand = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const filteredStages = useMemo(() => {
    return stages.filter((stg) => {
      const matchSearch =
        stg.stageCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stg.objects.some((o) => o.flexsimName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchBranch = selectedBranch === 'ALL' || stg.branch === selectedBranch;

      const hasMeasurement =
        stg.metric?.currentWip !== null ||
        stg.metric?.avgWip !== null ||
        stg.objects.some((o) => o.metric !== null);

      const matchMeasured = !filterMeasuredOnly || hasMeasurement;

      return matchSearch && matchBranch && matchMeasured;
    });
  }, [stages, searchTerm, selectedBranch, filterMeasuredOnly]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã công đoạn, tên máy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {Object.entries(BRANCH_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilterMeasuredOnly((prev) => !prev)}
                className={`text-xs px-3 py-2 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
                  filterMeasuredOnly
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Chỉ hiện trạm có dữ liệu
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />
                Danh Mục 27 Công Đoạn Và Điểm Ráp Mô Hình
              </CardTitle>
              <CardDescription>
                Bao gồm máy trạm song song A/B và trạm hỗ trợ do công nhân điều chuyển đảm nhiệm
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị: {filteredStages.length}/{stages.length} công đoạn
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-y border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">Mã CĐ</th>
                  <th className="py-3 px-4">Tên quy trình / Công đoạn</th>
                  <th className="py-3 px-2 text-center">Trạm</th>
                  <th className="py-3 px-3 text-right">Tồn hiện tại</th>
                  <th className="py-3 px-3 text-right">Tồn TB (WIP)</th>
                  <th className="py-3 px-3 text-right">Tồn Max</th>
                  <th className="py-3 px-3 text-right">Chờ TB (giây)</th>
                  <th className="py-3 px-3 text-right">Processing</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStages.map((stg) => {
                  const isExpanded = expandedStages.has(stg.id);
                  const hasData = stg.metric !== null;
                  const isBottleneck = (stg.metric?.currentWip ?? 0) > 10;

                  return (
                    <React.Fragment key={stg.id}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                          isBottleneck ? 'bg-amber-50/40' : ''
                        }`}
                        onClick={() => toggleExpand(stg.id)}
                      >
                        <td className="py-3 px-3 text-center text-slate-400">
                          {stg.objects.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 inline text-teal-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 inline text-slate-400" />
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {stg.stageCode}
                        </td>

                        <td className="py-3 px-4 font-sans font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{stg.name}</span>
                            {stg.notes && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                {stg.notes}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
                            {stg.parallelStationCount === 2 ? '2 trạm (A/B)' : '1 trạm'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {stg.metric?.currentWip !== null && stg.metric?.currentWip !== undefined ? (
                            <span className={stg.metric.currentWip > 5 ? 'text-red-600' : 'text-slate-800'}>
                              {formatMetricNumber(stg.metric.currentWip, 0, 'cái')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">--</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatMetricNumber(stg.metric?.avgWip, 2, 'cái')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatMetricNumber(stg.metric?.maxWip, 0, 'cái')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatMetricNumber(stg.metric?.avgStaytime, 2, 's')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatPercentage(stg.metric?.processingPct)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {hasData ? (
                            isBottleneck ? (
                              <Badge variant="destructive">Ứ đọng BTP</Badge>
                            ) : (
                              <Badge variant="success">Bình thường</Badge>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">Chưa đo</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Sub-rows for component objects in FlexSim */}
                      {isExpanded && stg.objects.length > 0 && (
                        <tr className="bg-slate-50/90 border-y border-slate-200">
                          <td colSpan={10} className="p-3 pl-12">
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Các đối tượng FlexSim thành phần thuộc công đoạn {stg.stageCode}:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {stg.objects.map((obj) => (
                                  <div
                                    key={obj.id}
                                    className="p-2.5 bg-white rounded border border-slate-200 text-xs shadow-2xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-bold text-teal-800">
                                        {obj.flexsimName}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] py-0">
                                        {obj.objectType}
                                      </Badge>
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">
                                      {obj.description || 'Đối tượng mô hình'}
                                    </div>
                                    {obj.metric ? (
                                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-100">
                                        <span>Output: {formatMetricNumber(obj.metric.outputCount, 0)}</span>
                                        <span className="font-semibold text-slate-800">
                                          Tải: {formatPercentage(obj.metric.processingPct)}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="pt-1 text-[11px] text-slate-400 italic">
                                        Chưa có số liệu đo chi tiết
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
