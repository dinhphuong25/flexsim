'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Search,
  Filter,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';
import {
  SafeStockThresholdConfig,
  classifySafeStock,
} from '@/lib/safe-stock';
import { SafeStockConfigModal } from './safe-stock-config-modal';

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

const BRANCH_LABELS: Record<string, { label: string; short: string }> = {
  ALL: { label: 'Tất cả các nhánh', short: 'Tất cả' },
  FRONT_BODY: { label: 'Nhánh Thân Trước (CD01 - CD06)', short: 'Thân trước' },
  BACK_BODY: { label: 'Nhánh Thân Sau (CD07)', short: 'Thân sau' },
  POST_R01: { label: 'Sau R01 (CD08 - CD14)', short: 'Sau R01' },
  WAISTBAND: { label: 'Nhánh Cạp Lưng (CD15)', short: 'Cạp lưng' },
  POST_R02: { label: 'Sau R02 (CD16 - CD19)', short: 'Sau R02' },
  PAGET: { label: 'Nhánh Paget (CD20 - CD22)', short: 'Paget' },
  POST_R03: { label: 'Sau R03 (CD23 - SINK_TP)', short: 'Sau R03' },
};

export interface StageManagementTableProps {
  stages: StageWithMetrics[];
  initialThresholds?: SafeStockThresholdConfig[];
  userRole?: string;
}

export function StageManagementTable({
  stages,
  initialThresholds = [],
  userRole = 'ADMIN',
}: StageManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [filterMeasuredOnly, setFilterMeasuredOnly] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['stg_cd05', 'stg_cd12', 'stg_cd14']));

  // Quản lý bản đồ cấu hình ngưỡng an toàn
  const [thresholdsMap, setThresholdsMap] = useState<Record<string, SafeStockThresholdConfig>>(() => {
    const map: Record<string, SafeStockThresholdConfig> = {};
    if (initialThresholds) {
      for (const t of initialThresholds) {
        map[t.targetCode] = t;
      }
    }
    return map;
  });

  // Modal cấu hình
  const [modalTarget, setModalTarget] = useState<{
    targetCode: string;
    targetName: string;
    currentWip: number | null;
  } | null>(null);

  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER';

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

  const expandAll = () => {
    setExpandedStages(new Set(stages.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedStages(new Set());
  };

  // Summary KPIs calculated strictly from data
  const summaryKpis = useMemo<{
    totalWip: number;
    measuredCount: number;
    totalStages: number;
    bottleneck: StageWithMetrics | null;
    avgProc: number | null;
  }>(() => {
    let totalWip = 0;
    let measuredCount = 0;
    let bottleneckStage: StageWithMetrics | null = null;
    let maxWip = -1;
    let sumProc = 0;
    let countProc = 0;

    stages.forEach((s) => {
      if (s.metric) {
        measuredCount++;
        const wip = s.metric.currentWip ?? 0;
        totalWip += wip;
        if (wip > maxWip) {
          maxWip = wip;
          bottleneckStage = s;
        }
        if (s.metric.processingPct !== null && s.metric.processingPct !== undefined) {
          sumProc += s.metric.processingPct;
          countProc++;
        }
      }
    });

    return {
      totalWip,
      measuredCount,
      totalStages: stages.length,
      bottleneck: bottleneckStage,
      avgProc: countProc > 0 ? sumProc / countProc : null,
    };
  }, [stages]);

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
      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Công Đoạn & Điểm Ráp</p>
              <h3 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {summaryKpis.totalStages}{' '}
                <span className="text-xs font-sans text-slate-500 font-normal">vị trí</span>
              </h3>
              <p className="text-[11px] text-teal-700 mt-0.5">
                {summaryKpis.measuredCount}/{summaryKpis.totalStages} trạm có số liệu đo FlexSim
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Tồn BTP Toàn Chuyền (WIP)</p>
              <h3 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {summaryKpis.totalWip}{' '}
                <span className="text-xs font-sans text-slate-500 font-normal">cái</span>
              </h3>
              <p className="text-[11px] text-teal-700 mt-0.5">
                Đệm lưu thông (5.500 cấp &rarr; 5.408 thành phẩm)
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Điểm Nghẽn Cần Kiểm Soát</p>
              <h3 className="text-xl font-bold font-mono text-red-600 mt-0.5">
                {summaryKpis.bottleneck ? summaryKpis.bottleneck.stageCode : '--'}{' '}
                <span className="text-xs font-sans text-slate-500 font-normal">
                  ({summaryKpis.bottleneck?.metric?.currentWip ?? 0} cái)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[170px]">
                {summaryKpis.bottleneck ? summaryKpis.bottleneck.name : 'Chưa phát hiện'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Hiệu Suất Processing TB</p>
              <h3 className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                {summaryKpis.avgProc ? `${summaryKpis.avgProc.toFixed(1)}%` : '--'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tỷ lệ chạy máy trung bình toàn chuyền
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Branch Pills */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã công đoạn, tên máy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
              <button
                onClick={() => setFilterMeasuredOnly((prev) => !prev)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
                  filterMeasuredOnly
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Chỉ hiện trạm có dữ liệu
              </button>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7 px-2 text-slate-600">
                  Mở tất cả
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7 px-2 text-slate-600">
                  Thu gọn
                </Button>
              </div>
            </div>
          </div>

          {/* Branch Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium shrink-0 mr-1">Nhánh:</span>
            {Object.entries(BRANCH_LABELS).map(([k, meta]) => {
              const isSelected = selectedBranch === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedBranch(k)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {meta.short}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Stages Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/60 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-700" />
              <CardTitle className="text-sm font-bold text-slate-900">
                Bảng Thống Kê 27 Công Đoạn, Điểm Ráp & Trạm Máy Song Song
              </CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị: {filteredStages.length}/{stages.length} đối tượng
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Mã CĐ</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Tên quy trình / Công đoạn</th>
                  <th className="py-2.5 px-2 text-center">Cấu hình</th>
                  <th className="py-2.5 px-3 text-right">Tồn HT (WIP)</th>
                  <th className="py-2.5 px-3 text-center">Ngưỡng An Toàn (Max)</th>
                  <th className="py-2.5 px-3 text-right">Lượng Vượt</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái Tồn</th>
                  <th className="py-2.5 px-3 text-right">Processing</th>
                  <th className="py-2.5 px-3 text-center">Cập Nhật</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStages.map((stg) => {
                  const isExpanded = expandedStages.has(stg.id);
                  const hasData = stg.metric !== null && stg.metric.currentWip !== null && stg.metric.currentWip !== undefined;
                  const currentWip = stg.metric?.currentWip ?? null;
                  const threshold = thresholdsMap[stg.stageCode] || null;
                  const safeStockEval = classifySafeStock(currentWip, threshold, { isEndOfRun: true });
                  const hasWip = (currentWip ?? 0) > 0;
                  const wipPercent = Math.min(100, Math.round(((currentWip ?? 0) / 30) * 100));
                  const isCritical = safeStockEval.status === 'MUC_NGHIEM_TRONG';
                  const isExceeded = safeStockEval.status === 'VUOT_NGUONG';

                  return (
                    <React.Fragment key={stg.id}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                          isCritical
                            ? 'bg-red-50/50 hover:bg-red-50/70'
                            : isExceeded
                            ? 'bg-amber-50/40 hover:bg-amber-50/60'
                            : isExpanded
                            ? 'bg-teal-50/20'
                            : ''
                        }`}
                        onClick={() => toggleExpand(stg.id)}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400">
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

                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {stg.stageCode}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{stg.name}</span>
                            {stg.notes && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-slate-300">
                                {stg.notes}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            stg.parallelStationCount === 2
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                              : stg.stageCode.startsWith('R')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : stg.stageCode === 'SINK_TP'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {stg.parallelStationCount === 2
                              ? '2 trạm (A/B)'
                              : stg.stageCode.startsWith('R')
                              ? 'Combiner'
                              : stg.stageCode === 'SINK_TP'
                              ? 'Sink'
                              : '1 trạm'}
                          </span>
                        </td>

                        {/* Current WIP with visual indicator */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {hasData ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={
                                isCritical ? 'text-red-600 text-sm font-black' :
                                isExceeded ? 'text-amber-700 text-sm font-black' :
                                hasWip ? 'text-slate-800' : 'text-slate-500'
                              }>
                                {currentWip}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">cái</span>
                              {hasWip && (
                                <div className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${
                                      isCritical ? 'bg-red-500' : isExceeded ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${wipPercent}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">Chưa có dữ liệu</span>
                          )}
                        </td>

                        {/* Safe Stock Max Threshold */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {threshold ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-slate-800 text-xs">
                                {threshold.safeStockMax} <span className="text-[10px] text-slate-500 font-normal">BTP</span>
                              </span>
                              {threshold.criticalStock !== null && (
                                <span className="text-[9px] text-red-600 font-sans">
                                  Báo động: ≥{threshold.criticalStock}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px] italic">Chưa cấu hình</span>
                          )}
                        </td>

                        {/* Excess Stock */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {!threshold ? (
                            <span className="text-slate-400 font-sans text-[11px]">--</span>
                          ) : safeStockEval.currentContent === null ? (
                            <span className="text-slate-400 font-sans text-[11px]">Chưa có DL</span>
                          ) : safeStockEval.excessStock && safeStockEval.excessStock > 0 ? (
                            <span className={isCritical ? 'text-red-600 font-bold' : 'text-amber-700 font-bold'}>
                              +{safeStockEval.excessStock} BTP
                            </span>
                          ) : (
                            <span className="text-emerald-700">0 BTP</span>
                          )}
                        </td>

                        {/* Safe Stock Status Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-medium ${
                              safeStockEval.status === 'TRONG_NGUONG'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : safeStockEval.status === 'VUOT_NGUONG'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                                : safeStockEval.status === 'MUC_NGHIEM_TRONG'
                                ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                                : safeStockEval.status === 'DUOI_MUC_DEM'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : safeStockEval.status === 'CHUA_DANH_GIA'
                                ? 'bg-slate-100 text-slate-600 border-slate-300'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {safeStockEval.statusLabel}
                          </Badge>
                        </td>

                        {/* Processing % with colored pill */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {hasData && stg.metric?.processingPct !== null && stg.metric?.processingPct !== undefined ? (
                            <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                              stg.metric.processingPct >= 99.5
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : stg.metric.processingPct >= 90
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {stg.metric.processingPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">--</span>
                          )}
                        </td>

                        {/* Last Updated Timestamp */}
                        <td className="py-2.5 px-3 text-center text-[11px] text-slate-500 font-mono">
                          {threshold ? (
                            <span title={new Date(threshold.updatedAt).toLocaleString('vi-VN')}>
                              {new Date(threshold.updatedAt).toLocaleDateString('vi-VN', {
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] text-slate-700 hover:text-teal-700 hover:border-teal-400 font-medium"
                            onClick={() => {
                              setModalTarget({
                                targetCode: stg.stageCode,
                                targetName: `${stg.stageCode} - ${stg.name}`,
                                currentWip: currentWip,
                              });
                            }}
                          >
                            {threshold ? 'Sửa ngưỡng' : 'Đặt ngưỡng'}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Sub-rows for component objects in FlexSim */}
                      {isExpanded && stg.objects.length > 0 && (
                        <tr className="bg-slate-50/90 border-y border-slate-200">
                          <td colSpan={11} className="p-3 pl-10">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  Các đối tượng FlexSim mô hình hóa cho {stg.stageCode}:
                                </p>
                                <span className="text-[11px] text-slate-500">
                                  {stg.objects.length} đối tượng (Queue & Processor)
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {stg.objects.map((obj) => {
                                  const objThreshold = thresholdsMap[obj.flexsimName] || null;
                                  return (
                                    <div
                                      key={obj.id}
                                      className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs space-y-1 hover:border-teal-300 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-teal-800 flex items-center gap-1">
                                          <Cpu className="h-3 w-3 text-teal-600" />
                                          {obj.flexsimName}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] py-0 px-1 ${
                                            obj.objectType === 'QUEUE'
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : obj.objectType === 'PROCESSOR'
                                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                                              : 'bg-purple-50 text-purple-700 border-purple-200'
                                          }`}
                                        >
                                          {obj.objectType}
                                        </Badge>
                                      </div>

                                      <div className="text-[11px] text-slate-500 truncate">
                                        {obj.description || 'Đối tượng thành phần mô hình'}
                                      </div>

                                      {obj.metric ? (
                                        <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-100">
                                          {obj.objectType === 'QUEUE' ? (
                                            <>
                                              <span className="text-amber-700 font-bold">
                                                Tồn: {obj.metric.currentContent ?? 0} cái
                                              </span>
                                              <span className="text-slate-500">
                                                Chờ: {obj.metric.avgStaytime ? `${obj.metric.avgStaytime.toFixed(1)}s` : '--'}
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <span>Ra: {formatMetricNumber(obj.metric.outputCount, 0)}</span>
                                              <span className="font-bold text-teal-800">
                                                Tải: {formatPercentage(obj.metric.processingPct)}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="pt-1 text-[10px] text-slate-400 italic">
                                          Chưa có số liệu đo chi tiết
                                        </div>
                                      )}

                                      {obj.objectType === 'QUEUE' && (
                                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                                          <span>
                                            Ngưỡng:{' '}
                                            <span className="font-mono font-semibold text-slate-700">
                                              {objThreshold ? `${objThreshold.safeStockMax} BTP` : 'Chưa cấu hình'}
                                            </span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setModalTarget({
                                                targetCode: obj.flexsimName,
                                                targetName: `Hàng chờ ${obj.flexsimName} (${stg.stageCode})`,
                                                currentWip: obj.metric?.currentContent ?? null,
                                              });
                                            }}
                                            className="text-teal-600 hover:underline font-medium"
                                          >
                                            {objThreshold ? 'Sửa' : 'Cấu hình'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
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

      {/* Safe Stock Configuration Modal */}
      {modalTarget && (
        <SafeStockConfigModal
          isOpen={!!modalTarget}
          onClose={() => setModalTarget(null)}
          targetCode={modalTarget.targetCode}
          targetName={modalTarget.targetName}
          currentWip={modalTarget.currentWip}
          currentConfig={thresholdsMap[modalTarget.targetCode] || null}
          canEdit={canEdit}
          onConfigSaved={(saved) => {
            setThresholdsMap((prev) => {
              const next = { ...prev };
              if (saved) {
                next[modalTarget.targetCode] = saved;
              } else {
                delete next[modalTarget.targetCode];
              }
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
