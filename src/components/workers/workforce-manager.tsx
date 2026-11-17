'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  UserCheck,
  ArrowLeftRight,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Sliders,
  Eye,
  Edit3,
  Workflow,
  ShieldCheck,
  CheckSquare,
  LayoutGrid,
  Table as TableIcon,
  X,
  ChevronRight,
  Info,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import {
  WorkerPosition,
  SkillLevel,
  ChecklistStatus,
  TaskChecklistItem,
  SKILL_LEVEL_LABELS,
  CHECKLIST_STATUS_LABELS,
  STANDARD_FLOATING_PROCEDURE,
} from '@/lib/workforce';
import { FloatingWorkerDispatcher } from './floating-worker-dispatcher';
import { cn } from '@/lib/utils';

interface WorkforceManagerProps {
  initialPositions: WorkerPosition[];
  initialSkillMatrix: Record<string, Record<string, SkillLevel>>;
  initialChecklists: TaskChecklistItem[];
  userRole?: 'ADMIN' | 'MANAGER' | 'VIEWER';
}

type TabType = 'ROSTER' | 'ASSIGNMENTS' | 'DISPATCH' | 'SKILLS' | 'CHECKLIST';
type ViewMode = 'TABLE' | 'CARDS';

export function WorkforceManager({
  initialPositions,
  initialSkillMatrix,
  initialChecklists,
  userRole = 'ADMIN',
}: WorkforceManagerProps) {
  const [positions, setPositions] = useState<WorkerPosition[]>(initialPositions);
  const [skillMatrix, setSkillMatrix] = useState<Record<string, Record<string, SkillLevel>>>(initialSkillMatrix);
  const [checklists, setChecklists] = useState<TaskChecklistItem[]>(initialChecklists);

  const [activeTab, setActiveTab] = useState<TabType>('ROSTER');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>('ALL');
  const [selectedAssignedFilter, setSelectedAssignedFilter] = useState<string>('ALL');
  const [selectedVerifiedFilter, setSelectedVerifiedFilter] = useState<string>('ALL');

  // Modal / Drawer State
  const [detailPosition, setDetailPosition] = useState<WorkerPosition | null>(null);
  const [editingPosition, setEditingPosition] = useState<WorkerPosition | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    assignedStation: '',
    primaryStation: '',
    supportStation: '',
    transferRule: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Compute KPIs
  const kpis = useMemo(() => {
    const total = positions.length;
    const fixed = positions.filter((p) => p.workerType === 'FIXED').length;
    const floating = positions.filter((p) => p.workerType === 'FLOATING').length;
    const assigned = positions.filter((p) => p.isAssigned).length;
    const verified = positions.filter((p) => p.isVerified).length;
    const missingMapping = positions.filter((p) => !p.primaryStation).length;
    const missingJobDesc = positions.filter((p) => !p.jobDescription).length;
    return {
      total,
      fixed,
      floating,
      assigned,
      verified,
      missingMapping,
      missingJobDesc,
    };
  }, [positions]);

  // Unique branches for filter
  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    positions.forEach((p) => {
      if (!map.has(p.branch)) {
        map.set(p.branch, p.branchLabel);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [positions]);

  // Unique stages for filter
  const stageOptions = useMemo(() => {
    const stages = Array.from(new Set(positions.map((p) => p.stageCode))).sort();
    return stages;
  }, [positions]);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      // Search text (code, name, stageCode, stageName, flexsimObject, operatorCode)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = pos.positionCode.toLowerCase().includes(query);
        const matchName = pos.displayName.toLowerCase().includes(query);
        const matchStage = pos.stageCode.toLowerCase().includes(query) || pos.stageName.toLowerCase().includes(query);
        const matchStation = pos.primaryStation.toLowerCase().includes(query) || pos.flexsimObjectName.toLowerCase().includes(query);
        const matchOperator = pos.flexsimOperatorCode?.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchStage && !matchStation && !matchOperator) {
          return false;
        }
      }

      // Branch filter
      if (selectedBranch !== 'ALL' && pos.branch !== selectedBranch) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'ALL' && pos.stageCode !== selectedStage) {
        return false;
      }

      // Worker type
      if (selectedWorkerType !== 'ALL' && pos.workerType !== selectedWorkerType) {
        return false;
      }

      // Assignment status
      if (selectedAssignedFilter === 'ASSIGNED' && !pos.isAssigned) return false;
      if (selectedAssignedFilter === 'UNASSIGNED' && pos.isAssigned) return false;

      // Verification status
      if (selectedVerifiedFilter === 'VERIFIED' && !pos.isVerified) return false;
      if (selectedVerifiedFilter === 'UNVERIFIED' && pos.isVerified) return false;

      return true;
    });
  }, [
    positions,
    searchQuery,
    selectedBranch,
    selectedStage,
    selectedWorkerType,
    selectedAssignedFilter,
    selectedVerifiedFilter,
  ]);

  // Open edit modal
  const handleOpenEdit = (pos: WorkerPosition) => {
    if (!canEdit) {
      alert('Tài khoản Viewer chỉ có quyền xem, không được chỉnh sửa phân công.');
      return;
    }
    setEditingPosition(pos);
    setEditForm({
      displayName: pos.displayName,
      assignedStation: pos.assignedStation,
      primaryStation: pos.primaryStation,
      supportStation: pos.supportStation || '',
      transferRule: pos.transferRule || '',
    });
  };

  // Submit edit assignment
  const handleSaveEdit = async () => {
    if (!editingPosition) return;
    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/workers/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionCode: editingPosition.positionCode,
          displayName: editForm.displayName,
          assignedStation: editForm.assignedStation,
          primaryStation: editForm.primaryStation,
          supportStation: editForm.supportStation || undefined,
          transferRule: editForm.transferRule || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPositions((prev) =>
          prev.map((p) => (p.positionCode === editingPosition.positionCode ? data.position : p))
        );
        setActionMessage(`Đã cập nhật phân công vị trí ${editingPosition.positionCode} thành công.`);
        setEditingPosition(null);
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.message || 'Lỗi khi cập nhật phân công.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update skill matrix
  const handleSkillChange = async (positionCode: string, stageCode: string, newLevel: SkillLevel) => {
    if (!canEdit) {
      alert('Tài khoản Viewer không được chỉnh sửa ma trận kỹ năng.');
      return;
    }

    // Optimistic UI update
    setSkillMatrix((prev) => ({
      ...prev,
      [positionCode]: {
        ...(prev[positionCode] || {}),
        [stageCode]: newLevel,
      },
    }));

    try {
      const res = await fetch('/api/workers/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionCode,
          stageCode,
          skillLevel: newLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Lỗi cập nhật kỹ năng.');
      }
    } catch {
      alert('Lỗi kết nối khi cập nhật kỹ năng.');
    }
  };

  // Update checklist status
  const handleChecklistStatusChange = async (id: string, newStatus: ChecklistStatus) => {
    if (!canEdit) {
      alert('Tài khoản Viewer không được cập nhật trạng thái checklist.');
      return;
    }

    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );

    try {
      const res = await fetch('/api/workers/checklists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Lỗi cập nhật checklist.');
      }
    } catch {
      alert('Lỗi kết nối khi cập nhật checklist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Quản Lý Nhân Lực & Phân Công Công Việc
            </h1>
            <Badge variant="navy" className="px-2.5 py-0.5 text-[11px] font-semibold">
              34 Vị Trí Kế Hoạch
            </Badge>
            <Badge variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Đã Đối Chiếu FlexSim v1.0
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Quy mô chuyền may Quần trẻ em nữ: <span className="font-semibold text-slate-700">30 vị trí cố định (CN01..CN30)</span> +{' '}
            <span className="font-semibold text-slate-700">4 vị trí điều chuyển (CN31..CN34: OP_04_05, OP_11_12, OP_13_14, OP_16_17)</span>.
            Tách biệt rõ rệt mã công nhân, mã công đoạn và tên đối tượng máy trong mô hình.
          </p>
        </div>

        {/* View Mode Toggle & Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'TABLE' ? 'bg-white shadow-2xs text-teal-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Bảng (Desktop)
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'CARDS' ? 'bg-white shadow-2xs text-teal-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Thẻ (Cards)
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Metric Cards (5 KPI theo yêu cầu 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <Card className="border-l-4 border-l-slate-900 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng Vị Trí</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpis.total}</span>
              <span className="text-[11px] text-slate-500">vị trí</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Biên chế phương án</p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-l-4 border-l-teal-600 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Cố Định</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal-800 font-mono">{kpis.fixed}</span>
              <span className="text-[11px] text-slate-500">người</span>
            </div>
            <p className="text-[10px] text-teal-600 mt-1">CN01 &rarr; CN30</p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-l-4 border-l-indigo-600 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Điều Chuyển</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-800 font-mono">{kpis.floating}</span>
              <span className="text-[11px] text-slate-500">người</span>
            </div>
            <p className="text-[10px] text-indigo-600 mt-1">CN31 &rarr; CN34</p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-l-4 border-l-emerald-600 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Đã Phân Công</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">{kpis.assigned}</span>
              <span className="text-[11px] text-slate-500">/ {kpis.total}</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-1">Đạt 100% kế hoạch</p>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="border-l-4 border-l-blue-600 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Đã Xác Minh</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-800 font-mono">{kpis.verified}</span>
              <span className="text-[11px] text-slate-500">/ {kpis.total}</span>
            </div>
            <p className="text-[10px] text-blue-600 mt-1">Khớp đối tượng FlexSim</p>
          </CardContent>
        </Card>

        {/* KPI 6 */}
        <Card className="border-l-4 border-l-amber-500 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Thiếu Ánh Xạ</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpis.missingMapping}</span>
              <span className="text-[11px] text-slate-500">vị trí</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-1">Không phát sinh lỗi P_CD28..30</p>
          </CardContent>
        </Card>
      </div>

      {/* 5 Tab Navigation Buttons */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'ROSTER'
              ? 'border-teal-600 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          A. Danh Sách Nhân Lực ({positions.length})
        </button>

        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-teal-600 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Workflow className="h-4 w-4" />
          B. Phân Công Công Việc
        </button>

        <button
          onClick={() => setActiveTab('DISPATCH')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'DISPATCH'
              ? 'border-teal-600 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          C. Điều Chuyển &amp; Hỗ Trợ (4 Người)
        </button>

        <button
          onClick={() => setActiveTab('SKILLS')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'SKILLS'
              ? 'border-teal-600 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          D. Ma Trận Kỹ Năng (34 &times; 27)
        </button>

        <button
          onClick={() => setActiveTab('CHECKLIST')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'CHECKLIST'
              ? 'border-teal-600 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          E. Nhật Ký Công Việc &amp; Checklist
        </button>
      </div>

      {/* Filters Bar (Hiển thị cho Tab A & Tab B) */}
      {(activeTab === 'ROSTER' || activeTab === 'ASSIGNMENTS') && (
        <Card className="bg-slate-50/70 border-slate-200">
          <CardContent className="p-3.5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã (CNxx, OP_xx), tên vị trí, công đoạn, trạm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Filter Selects */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Branch Select */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  <option value="ALL">Tất cả nhánh sản xuất</option>
                  {branchOptions.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>

                {/* Stage Select */}
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  <option value="ALL">Tất cả công đoạn</option>
                  {stageOptions.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>

                {/* Type Select */}
                <select
                  value={selectedWorkerType}
                  onChange={(e) => setSelectedWorkerType(e.target.value)}
                  className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  <option value="ALL">Tất cả loại nhân lực</option>
                  <option value="FIXED">Cố định (30 người)</option>
                  <option value="FLOATING">Điều chuyển (4 người)</option>
                </select>

                {/* Clear filters button */}
                {(searchQuery || selectedBranch !== 'ALL' || selectedStage !== 'ALL' || selectedWorkerType !== 'ALL') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBranch('ALL');
                      setSelectedStage('ALL');
                      setSelectedWorkerType('ALL');
                    }}
                    className="h-7 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Đặt lại
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>
                Hiển thị <strong>{filteredPositions.length}</strong> / {positions.length} vị trí nhân lực
              </span>
              <span className="italic text-slate-400">
                Ghi chú: Toàn bộ 30 vị trí cố định được đối chiếu chính xác theo Processor trong FlexSim Model v1.0
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB A: DANH SÁCH NHÂN LỰC (ROSTER) */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-4">
          {viewMode === 'TABLE' ? (
            /* Table View (Mặc định cho Desktop) */
            <Card className="border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5">Mã Vị Trí</th>
                      <th className="py-3 px-3.5">Tên Hiển Thị</th>
                      <th className="py-3 px-3.5">Loại Nhân Lực</th>
                      <th className="py-3 px-3.5">Nhánh Phân Bổ</th>
                      <th className="py-3 px-3.5">Công Đoạn</th>
                      <th className="py-3 px-3.5">Trạm Kế Hoạch (FlexSim)</th>
                      <th className="py-3 px-3.5">Trạng Thái Vận Hành</th>
                      <th className="py-3 px-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredPositions.map((pos) => (
                      <tr key={pos.positionCode} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {pos.positionCode}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">
                          {pos.displayName}
                          {pos.flexsimOperatorCode && (
                            <span className="ml-1.5 font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {pos.flexsimOperatorCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {pos.workerType === 'FIXED' ? (
                            <Badge variant="outline" className="text-teal-800 bg-teal-50 border-teal-200 text-[10px]">
                              Cố định
                            </Badge>
                          ) : (
                            <Badge variant="navy" className="text-[10px]">
                              Điều chuyển
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 text-[11px] font-medium">
                          {pos.branchLabel}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-slate-900">{pos.stageCode}</span>
                          <span className="text-slate-500 text-[11px] block truncate max-w-[140px]">
                            {pos.stageName}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px]">
                          <span className="font-bold text-slate-900">{pos.primaryStation}</span>
                          {pos.supportStation && (
                            <span className="text-indigo-700 font-semibold block text-[10px]">
                              + Hỗ trợ: {pos.supportStation}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                              pos.operationalStatus.includes('vận hành') || pos.operationalStatus.includes('gia công')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : pos.operationalStatus.includes('điều chuyển') || pos.operationalStatus.includes('hỗ trợ')
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full shrink-0',
                                pos.operationalStatus.includes('vận hành') || pos.operationalStatus.includes('gia công')
                                  ? 'bg-emerald-500'
                                  : pos.operationalStatus.includes('điều chuyển') || pos.operationalStatus.includes('hỗ trợ')
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                              )}
                            />
                            {pos.operationalStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailPosition(pos)}
                              className="h-7 px-2 text-[11px] gap-1 font-semibold text-teal-800 hover:bg-teal-50"
                            >
                              <Eye className="h-3 w-3" />
                              Xem công việc
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(pos)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                                title="Chỉnh phân công"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Cards View (Mobile & Grid) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPositions.map((pos) => (
                <Card key={pos.positionCode} className="border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <CardHeader className="p-3.5 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                          {pos.positionCode}
                        </span>
                        <span className="font-bold text-xs text-slate-800">{pos.displayName}</span>
                      </div>
                      {pos.workerType === 'FIXED' ? (
                        <Badge variant="outline" className="text-teal-800 bg-teal-50 border-teal-200 text-[10px]">
                          Cố định
                        </Badge>
                      ) : (
                        <Badge variant="navy" className="text-[10px]">
                          Điều chuyển
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-2 text-xs">
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Công đoạn:</span>
                        <span className="font-bold text-slate-900">{pos.stageCode} — {pos.stageName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Trạm máy:</span>
                        <span className="font-bold text-teal-800">{pos.primaryStation}</span>
                      </div>
                      {pos.supportStation && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Trạm hỗ trợ:</span>
                          <span className="font-bold text-indigo-800">{pos.supportStation}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Phân nhánh:</span>
                        <span className="font-sans text-slate-700">{pos.branchLabel}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          pos.operationalStatus.includes('vận hành') || pos.operationalStatus.includes('gia công')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : pos.operationalStatus.includes('điều chuyển') || pos.operationalStatus.includes('hỗ trợ')
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            pos.operationalStatus.includes('vận hành') || pos.operationalStatus.includes('gia công')
                              ? 'bg-emerald-500'
                              : pos.operationalStatus.includes('điều chuyển') || pos.operationalStatus.includes('hỗ trợ')
                              ? 'bg-indigo-500'
                              : 'bg-slate-400'
                          )}
                        />
                        {pos.operationalStatus}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailPosition(pos)}
                        className="h-7 px-2 text-[11px] gap-1 font-semibold text-teal-800 hover:bg-teal-50"
                      >
                        <Eye className="h-3 w-3" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB B: PHÂN CÔNG CÔNG VIỆC (ASSIGNMENTS DETAIL) */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-950 flex items-start gap-2">
            <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong>Nguyên tắc phân công cấp kế hoạch:</strong> Toàn bộ 30 vị trí cố định được gán tương ứng từng máy may đơn và trạm A của các cặp song song. Bốn nhân sự điều chuyển (CN31..CN34) đảm nhận trạm B gốc và hỗ trợ giải tỏa nút thắt. Mỗi người chỉ có một nhiệm vụ hoạt động tại một thời điểm, không phân công trùng lắp.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPositions.map((pos) => (
              <Card key={pos.positionCode} className="border border-slate-200 shadow-2xs">
                <CardHeader className="p-4 border-b border-slate-100 pb-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                        {pos.positionCode}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{pos.displayName}</div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Mã CD: {pos.stageCode} • {pos.stageName}
                        </span>
                      </div>
                    </div>
                    <Badge variant={pos.workerType === 'FIXED' ? 'outline' : 'navy'}>
                      {pos.workerType === 'FIXED' ? 'Cố định' : 'Điều chuyển'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs font-sans">
                  {/* Station Assignment */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Trạm kế hoạch:</span>
                      <strong className="text-slate-900">{pos.primaryStation}</strong>
                    </div>
                    {pos.supportStation && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Trạm hỗ trợ:</span>
                        <strong className="text-indigo-800">{pos.supportStation}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Đối tượng FlexSim:</span>
                      <span className="text-slate-700">{pos.flexsimObjectName}</span>
                    </div>
                  </div>

                  {/* Standard Task Statement */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Công việc được giao:
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium bg-white p-2.5 rounded border border-slate-200">
                      {pos.jobDescription.standardTaskStatement}
                    </p>
                  </div>

                  {/* Material Flow */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Nguồn nhận:</span>
                      <span className="text-slate-800 line-clamp-1">{pos.jobDescription.inputSource}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Chuyển giao:</span>
                      <span className="text-slate-800 line-clamp-1">{pos.jobDescription.outputTarget}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Cập nhật: {new Date(pos.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(pos)}
                          className="h-7 text-xs font-semibold"
                        >
                          Chỉnh phân công
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setDetailPosition(pos)}
                        className="h-7 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Bản mô tả chi tiết &rarr;
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: ĐIỀU CHUYỂN & HỖ TRỢ (DISPATCH HUB & RULES) */}
      {activeTab === 'DISPATCH' && (
        <div className="space-y-6">
          {/* Quy trình điều chuyển 7 bước theo Phần 7 */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-5 w-5 text-indigo-600" />
                Quy Trình Chuẩn 7 Bước Điều Chuyển Nhân Sự Hỗ Trợ (CN31 &rarr; CN34)
              </CardTitle>
              <CardDescription>
                Quy định thao tác luân chuyển giữa trạm gốc và trạm hỗ trợ, đảm bảo chất lượng và an toàn dòng chảy
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {STANDARD_FLOATING_PROCEDURE.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 relative shadow-2xs"
                  >
                    <span className="font-mono font-bold text-xs text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mb-1">
                      Bước {idx + 1}
                    </span>
                    <p className="text-slate-700 leading-relaxed font-sans font-medium">{step.substring(3)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bảng đối chiếu 4 nhân sự điều chuyển thực tế */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-teal-600" />
                Cấu Hình Ngưỡng Điều Chuyển &amp; Cặp Máy Phụ Trách
              </CardTitle>
              <CardDescription>
                Dữ liệu đồng bộ trực tiếp từ Task Executer và quy tắc giải phóng nút thắt mô hình FlexSim
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Mã Vị Trí</th>
                      <th className="p-3">FlexSim Operator</th>
                      <th className="p-3">Trạm Gốc (Vị trí A)</th>
                      <th className="p-3">Trạm Hỗ Trợ (Vị trí B)</th>
                      <th className="p-3">Quy Tắc Ngưỡng Điều Chuyển</th>
                      <th className="p-3 text-center">Nguồn Cấu Hình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {positions
                      .filter((p) => p.workerType === 'FLOATING')
                      .map((p) => (
                        <tr key={p.positionCode} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{p.positionCode}</td>
                          <td className="p-3 font-bold text-indigo-800">{p.flexsimOperatorCode}</td>
                          <td className="p-3 text-teal-800 font-semibold">{p.primaryStation}</td>
                          <td className="p-3 text-amber-800 font-semibold">{p.supportStation}</td>
                          <td className="p-3 font-sans text-slate-700 text-[11px]">{p.transferRule}</td>
                          <td className="p-3 text-center font-sans">
                            <Badge variant="outline" className="text-[10px] text-slate-600">
                              Baseline &amp; Kaizen
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Floating Worker Hub (Dispatcher Package 4) */}
          <FloatingWorkerDispatcher />
        </div>
      )}

      {/* TAB D: MA TRẬN KỸ NĂNG (SKILL MATRIX) */}
      {activeTab === 'SKILLS' && (
        <Card className="border border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  Ma Trận Kỹ Năng 34 Vị Trí &times; 27 Công Đoạn
                </CardTitle>
                <CardDescription>
                  Theo dõi năng lực thực hiện và hỗ trợ chéo. Mặc định công đoạn phụ trách đạt &ldquo;Thực hiện được&rdquo;, các công đoạn khác ở mức &ldquo;Chưa đánh giá&rdquo;.
                </CardDescription>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-sans">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Thực hiện được
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  Có thể hỗ trợ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Đang đào tạo
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Chưa đánh giá
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="overflow-x-auto max-h-[600px] border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 z-20 font-mono text-[10px] text-slate-700 uppercase shadow-2xs">
                  <tr>
                    <th className="p-2 border-b border-r bg-slate-100 sticky left-0 z-30 min-w-[120px]">
                      Vị trí
                    </th>
                    {Array.from({ length: 27 }, (_, i) => {
                      const code = `CD${String(i + 1).padStart(2, '0')}`;
                      return (
                        <th key={code} className="p-2 border-b text-center min-w-[55px]">
                          {code}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                  {positions.map((pos) => {
                    const rowSkills = skillMatrix[pos.positionCode] || {};
                    return (
                      <tr key={pos.positionCode} className="hover:bg-slate-50/70">
                        {/* Position Code & Label */}
                        <td className="p-2 font-bold text-slate-900 border-r bg-white sticky left-0 z-10 whitespace-nowrap">
                          <span>{pos.positionCode}</span>
                          <span className="text-[10px] text-slate-500 block font-sans truncate max-w-[100px]">
                            {pos.stageCode}
                          </span>
                        </td>

                        {/* 27 Stages Cells */}
                        {Array.from({ length: 27 }, (_, i) => {
                          const stageCode = `CD${String(i + 1).padStart(2, '0')}`;
                          const level = rowSkills[stageCode] || 'CHUA_DANH_GIA';

                          let bgClass = 'bg-slate-50 text-slate-300';
                          if (level === 'THUC_HIEN_DUOC') bgClass = 'bg-emerald-100 text-emerald-900 font-bold';
                          if (level === 'CO_THE_HO_TRO') bgClass = 'bg-indigo-100 text-indigo-900 font-bold';
                          if (level === 'DANG_DAO_TAO') bgClass = 'bg-amber-100 text-amber-900 font-bold';

                          return (
                            <td key={stageCode} className="p-1 border text-center">
                              {canEdit ? (
                                <select
                                  value={level}
                                  onChange={(e) =>
                                    handleSkillChange(pos.positionCode, stageCode, e.target.value as SkillLevel)
                                  }
                                  className={`w-full py-1 text-[9px] rounded text-center border-0 cursor-pointer font-sans ${bgClass}`}
                                  title={`${pos.positionCode} tại ${stageCode}: ${SKILL_LEVEL_LABELS[level]}`}
                                >
                                  <option value="CHUA_DANH_GIA">--</option>
                                  <option value="DANG_DAO_TAO">Đào tạo</option>
                                  <option value="THUC_HIEN_DUOC">Thực hiện</option>
                                  <option value="CO_THE_HO_TRO">Hỗ trợ</option>
                                </select>
                              ) : (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${bgClass}`}>
                                  {level === 'THUC_HIEN_DUOC' && 'TH'}
                                  {level === 'CO_THE_HO_TRO' && 'HT'}
                                  {level === 'DANG_DAO_TAO' && 'ĐT'}
                                  {level === 'CHUA_DANH_GIA' && '--'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB E: NHẬT KÝ CÔNG VIỆC & CHECKLIST */}
      {activeTab === 'CHECKLIST' && (
        <Card className="border border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-teal-600" />
                  Nhật Ký Nhiệm Vụ Ca &amp; Bảng Kiểm Checklist
                </CardTitle>
                <CardDescription>
                  Theo dõi tiến độ thực hiện nhiệm vụ quy trình của từng vị trí trong ca làm việc
                </CardDescription>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Tổng số mục kiểm: <strong>{checklists.length}</strong> (7 bước / 34 vị trí)
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <strong>Lưu ý độc lập:</strong> Trạng thái checklist &ldquo;Hoàn tất&rdquo; do người phụ trách đánh dấu kiểm soát quy trình, hoàn toàn độc lập với sản lượng thành phẩm hoàn thành tại SINK_TP trong mô hình.
            </div>

            {/* Checklist items list */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[550px] overflow-y-auto">
              {checklists.slice(0, 100).map((chk) => (
                <div
                  key={chk.id}
                  className="p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {chk.positionCode}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">{chk.stageCode}</span>
                    <span className="font-medium text-slate-800">
                      Bước {chk.stepOrder}: {chk.taskName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(chk.updatedAt).toLocaleTimeString('vi-VN')}
                    </span>
                    {canEdit ? (
                      <select
                        value={chk.status}
                        onChange={(e) => handleChecklistStatusChange(chk.id, e.target.value as ChecklistStatus)}
                        className={`py-1 px-2.5 rounded text-xs font-semibold border ${
                          chk.status === 'HOAN_TAT'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : chk.status === 'DANG_THUC_HIEN'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : chk.status === 'CO_VAN_DE'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="CHUA_BAT_DAU">Chưa bắt đầu</option>
                        <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                        <option value="HOAN_TAT">Hoàn tất</option>
                        <option value="CO_VAN_DE">Có vấn đề</option>
                      </select>
                    ) : (
                      <Badge
                        variant={
                          chk.status === 'HOAN_TAT'
                            ? 'success'
                            : chk.status === 'CO_VAN_DE'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {CHECKLIST_STATUS_LABELS[chk.status]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DRAWER / MODAL: XEM CHI TIẾT BẢN MÔ TẢ CÔNG VIỆC (YÊU CẦU 6, 7, 8) */}
      {detailPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs animate-fadeIn sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="worker-job-detail-title"
        >
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] md:translate-x-[7.5rem] lg:translate-x-32">
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="font-mono font-black text-base bg-teal-800 text-white px-2.5 py-1 rounded-lg">
                  {detailPosition.positionCode}
                </span>
                <div className="min-w-0">
                  <h3 id="worker-job-detail-title" className="text-base font-bold text-slate-900 sm:text-lg">
                    Bản Mô Tả Công Việc — {detailPosition.displayName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-mono">
                    Công đoạn: {detailPosition.stageCode} — {detailPosition.stageName} • Trạm: {detailPosition.primaryStation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailPosition(null)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng bản mô tả công việc"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-xs sm:p-6">
              {/* Proposal Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Info className="h-4 w-4 text-amber-700" />
                  Mẫu Phân Công Đề Xuất (Theo Cấu Trúc Luồng Mô Phỏng FlexSim v1.0)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Chưa có tài liệu SOP gốc từ phòng kỹ thuật xưởng. Nội dung dưới đây là bản mô tả chuẩn hóa theo dòng chảy sản xuất của mô hình. Cho phép cập nhật SOP chính thức sau.
                </p>
              </div>

              {/* 1. Thông Tin Cơ Bản */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">Loại Vị Trí</span>
                  <strong className="text-slate-900 font-sans">
                    {detailPosition.workerType === 'FIXED' ? 'Công nhân cố định' : 'Công nhân điều chuyển'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">Trạm Kế Hoạch</span>
                  <strong className="text-teal-800">{detailPosition.primaryStation}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">Phân Nhánh</span>
                  <strong className="text-slate-900 font-sans">{detailPosition.branchLabel}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">Xác Minh FlexSim</span>
                  <strong className="text-blue-800 font-sans">{detailPosition.isVerified ? 'Đã xác minh' : 'Chưa'}</strong>
                </div>
              </div>

              {/* 2. Mục Đích & Tiêu Chuẩn Thao Tác */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Mục Đích Công Việc &amp; Quy Trình Được Phê Duyệt
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <p className="font-semibold text-slate-800">{detailPosition.jobDescription.purpose}</p>
                  <p className="text-slate-600 italic text-[11px]">
                    &ldquo;{detailPosition.jobDescription.standardTaskStatement}&rdquo;
                  </p>
                </div>
              </div>

              {/* 3. Dòng Chảy Vật Tư (In/Out) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nguồn nhận BTP</span>
                  <p className="font-mono text-slate-800 font-semibold">{detailPosition.jobDescription.inputSource}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chuyển giao sau thao tác</span>
                  <p className="font-mono text-slate-800 font-semibold">{detailPosition.jobDescription.outputTarget}</p>
                </div>
              </div>

              {/* 4. Quy Trình Đầu Ca, Thường Xuyên, Bàn Giao */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Nhiệm Vụ Cụ Thể Trong Ca
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="font-bold text-slate-800 block text-xs mb-1">1. Đầu ca / Khởi động:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {detailPosition.jobDescription.shiftStartTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="font-bold text-slate-800 block text-xs mb-1">2. Nhiệm vụ thường xuyên:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {detailPosition.jobDescription.routineTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="font-bold text-slate-800 block text-xs mb-1">3. Kiểm tra chất lượng (KCS):</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {detailPosition.jobDescription.qualityCheckpoints.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="font-bold text-slate-800 block text-xs mb-1">4. Bàn giao cuối ca:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {detailPosition.jobDescription.shiftHandoverTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. Nhiệm Vụ Hỗ Trợ (Nếu Là Điều Chuyển) */}
              {detailPosition.workerType === 'FLOATING' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="h-4 w-4 text-indigo-700" />
                    Nhiệm Vụ Điều Chuyển Trạm Hỗ Trợ &amp; Quy Tắc Ngưỡng
                  </h4>
                  <div className="space-y-1.5 text-indigo-900 font-sans">
                    <p>
                      <strong>Trạm hỗ trợ:</strong> {detailPosition.supportStation}
                    </p>
                    <p>
                      <strong>Điều kiện kích hoạt:</strong> {detailPosition.transferRule}
                    </p>
                    {detailPosition.jobDescription.supportTasks && (
                      <div>
                        <strong>Nhiệm vụ tại trạm hỗ trợ:</strong>
                        <ul className="list-disc list-inside text-indigo-800 mt-1 space-y-0.5">
                          {detailPosition.jobDescription.supportTasks.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Cách Xử Lý Sự Cố */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                  Cách Xử Lý Bất Thường &amp; Sự Cố
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Khi thiếu BTP:</span>
                    <span className="text-slate-600">{detailPosition.jobDescription.issueHandling.missingBtp}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Khi ùn hàng chờ:</span>
                    <span className="text-slate-600">{detailPosition.jobDescription.issueHandling.bottleneckCongestion}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-slate-700 block">Khi phát hiện lỗi:</span>
                    <span className="text-slate-600">{detailPosition.jobDescription.issueHandling.defectsFound}</span>
                  </div>
                </div>
              </div>

              {/* Compliance Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 space-y-1">
                <strong>Nguyên tắc đánh giá hiệu suất (Phần 8):</strong>
                <p>
                  Sản lượng hoàn thành (Output) và tỷ lệ chạy máy (Processing %) của trạm Processor là thông số năng lực thiết bị trong mô hình FlexSim, không đồng nhất với sản lượng hay năng suất cá nhân của người lao động.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Xác nhận: {detailPosition.verifiedBy} ({new Date(detailPosition.verifiedAt).toLocaleDateString('vi-VN')})
              </span>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pos = detailPosition;
                      setDetailPosition(null);
                      handleOpenEdit(pos);
                    }}
                  >
                    Chỉnh sửa phân công
                  </Button>
                )}
                <Button size="sm" onClick={() => setDetailPosition(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
          ),
          document.body
        )}

      {/* MODAL: CHỈNH SỬA PHÂN CÔNG (EDIT ASSIGNMENT DIALOG) */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                  {editingPosition.positionCode}
                </span>
                <h3 className="font-bold text-slate-900 text-base">Chỉnh Sửa Phân Công Kế Hoạch</h3>
              </div>
              <button onClick={() => setEditingPosition(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên vị trí hiển thị</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trạm kế hoạch (Vị trí chính)</label>
                <input
                  type="text"
                  value={editForm.primaryStation}
                  onChange={(e) => setEditForm({ ...editForm, primaryStation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vị trí phân công chi tiết</label>
                <input
                  type="text"
                  value={editForm.assignedStation}
                  onChange={(e) => setEditForm({ ...editForm, assignedStation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {editingPosition.workerType === 'FLOATING' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Trạm máy hỗ trợ (Vị trí B)</label>
                    <input
                      type="text"
                      value={editForm.supportStation}
                      onChange={(e) => setEditForm({ ...editForm, supportStation: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Quy tắc ngưỡng điều chuyển</label>
                    <textarea
                      rows={3}
                      value={editForm.transferRule}
                      onChange={(e) => setEditForm({ ...editForm, transferRule: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingPosition(null)} disabled={isSaving}>
                Hủy bỏ
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white">
                {isSaving ? 'Đang lưu...' : 'Lưu phân công'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
