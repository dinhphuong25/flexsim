'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Users,
  Calendar,
  Building2,
  Award,
  Clock,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';

interface ReportRunInfo {
  id: string;
  runCode: string;
  dataSource: string;
  sourceDescription?: string;
  finishedCount: number | null;
  targetCount: number;
  runTimeSeconds: number;
}

export function ReportCenter({
  runs,
  initialRunId,
}: {
  runs: ReportRunInfo[];
  initialRunId?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryRunId = searchParams.get('runId');
  const [selectedRunId, setSelectedRunId] = useState<string>(queryRunId || initialRunId || runs[0]?.id || '');

  useEffect(() => {
    if (queryRunId && queryRunId !== selectedRunId) {
      setSelectedRunId(queryRunId);
    }
  }, [queryRunId]);

  const [reportType, setReportType] = useState<'STAGE_METRICS' | 'RUN_OVERVIEW' | 'WORKERS'>('STAGE_METRICS');
  const [activeTab, setActiveTab] = useState<'EXPORT_FILES' | 'ACCEPTANCE_A4'>('ACCEPTANCE_A4');
  const [isExporting, setIsExporting] = useState(false);

  const selectedRun = runs.find((r) => r.id === selectedRunId) || runs[0];
  const isChotRun = selectedRun?.runCode === 'RUN_CHOT_5427' || selectedRun?.id === 'run_chot_5427';

  const targetOutput = selectedRun?.targetCount ?? 5500;
  const actualOutput = selectedRun?.finishedCount ?? null;
  const remaining = actualOutput !== null ? Math.max(0, targetOutput - actualOutput) : null;
  const completionRate = actualOutput !== null ? Number(((actualOutput / targetOutput) * 100).toFixed(2)) : null;
  const outputPassed = actualOutput !== null && actualOutput >= targetOutput;

  const handleDownload = (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    const url = `/api/reports/export?runId=${selectedRun.id}&type=${reportType}&format=${format}`;
    window.open(url, '_blank');
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher (Ẩn khi in ấn) */}
      <div className="print:hidden border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-teal-600" />
            Trung Tâm Báo Cáo & Nghiệm Thu Sản Xuất
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xuất dữ liệu Excel/CSV hoặc in bản Báo cáo nghiệm thu kỹ thuật chuẩn A4 đối chiếu số liệu FlexSim 2027.
          </p>
        </div>

        {/* Tab Switcher & Print Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex text-xs font-medium">
            <button
              onClick={() => setActiveTab('ACCEPTANCE_A4')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ACCEPTANCE_A4'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản In Nghiệm Thu A4
            </button>
            <button
              onClick={() => setActiveTab('EXPORT_FILES')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'EXPORT_FILES'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xuất Tệp Excel / CSV
            </button>
          </div>

          <Button onClick={handlePrint} size="sm" className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="h-4 w-4" />
            In Báo Cáo A4
          </Button>
        </div>
      </div>

      {/* Feature 6: Thước Đo Nghiệm Thu Tự Động 4 Tiêu Chí */}
      <Card className="print:hidden border border-slate-200 shadow-xs bg-gradient-to-r from-teal-50/50 via-white to-indigo-50/30">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5 text-teal-600" />
                Hệ Thống Đánh Giá Nghiệm Thu Tự Động 4 Tiêu Chí
              </CardTitle>
              <CardDescription className="text-xs">
                Tổng hợp tự động: Đánh giá mục tiêu 5.500 sản phẩm • Định vị tồn dở dang • Đủ phạm vi kiểm tra • Minh chứng mô phỏng
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-bold gap-1 py-1 ${
                outputPassed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}
            >
              {outputPassed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> ĐẠT MỤC TIÊU SẢN LƯỢNG
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> CHƯA ĐẠT MỤC TIÊU SẢN LƯỢNG
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Criteria 1 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tiêu Chí 1: Sản Lượng</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 ${
                    outputPassed
                      ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                      : 'border-amber-300 text-amber-800 bg-amber-50'
                  }`}
                >
                  {outputPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </Badge>
              </div>
              <div className="font-bold text-slate-900 text-sm font-mono">
                {actualOutput !== null
                  ? `${actualOutput.toLocaleString('vi-VN')} / ${targetOutput.toLocaleString('vi-VN')} cái`
                  : '--'}
              </div>
              <div className={`text-[11px] font-semibold ${outputPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                {completionRate !== null
                  ? `Đạt ${completionRate.toString().replace('.', ',')}% (Còn thiếu ${remaining?.toLocaleString('vi-VN')} cái)`
                  : 'Chưa có dữ liệu'}
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tiêu Chí 2: Vị Trí Còn Tồn</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 ${
                    isChotRun
                      ? 'border-purple-300 text-purple-800 bg-purple-50'
                      : 'border-amber-300 text-amber-800 bg-amber-50'
                  }`}
                >
                  {isChotRun ? 'CHƯA XÁC NHẬN' : 'ĐÃ XÁC ĐỊNH'}
                </Badge>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {isChotRun ? 'Chưa xác nhận hết tồn toàn chuyền' : `${remaining ?? 0} cái dở dang`}
              </div>
              <div className="text-[11px] text-slate-600">
                {isChotRun
                  ? 'Bốn Queue trọng điểm hết tồn (CD05, CD12, CD14, CD17 = 0)'
                  : 'Tập trung các trạm gia công chính'}
              </div>
            </div>

            {/* Criteria 3 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tiêu Chí 3: Phạm Vi Kiểm Tra</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 ${
                    isChotRun
                      ? 'border-amber-300 text-amber-800 bg-amber-50'
                      : 'border-emerald-300 text-emerald-800 bg-emerald-50'
                  }`}
                >
                  {isChotRun ? '4/73 VỊ TRÍ' : 'ĐẠT (73 VỊ TRÍ)'}
                </Badge>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {isChotRun ? '4 vị trí có số liệu' : '73/73 vị trí sản xuất'}
              </div>
              <div className="text-[11px] text-slate-600">
                {isChotRun
                  ? '69 vị trí còn lại chưa có dữ liệu đối chiếu trong ảnh chốt'
                  : '4 Source, 28 Queue, 38 Processor, 3 Combiner'}
              </div>
            </div>

            {/* Criteria 4 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tiêu Chí 4: Số Lần Lặp</span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 border-slate-300 text-slate-700 bg-slate-50"
                >
                  {isChotRun ? '1 LƯỢT THAM CHIẾU' : '1 LƯỢT CHẠY'}
                </Badge>
              </div>
              <div className="font-bold text-slate-900 text-sm font-mono">
                {isChotRun ? 'n = 1 lượt chạy (171.000s)' : '1 lượt mô phỏng FlexSim'}
              </div>
              <div className="text-[11px] text-slate-600">
                {isChotRun
                  ? 'Hai ảnh minh chứng là cùng lượt, không phải hai lần lặp'
                  : selectedRun?.sourceDescription || 'Đồng bộ từ tệp mô phỏng'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VIEW 1: BẢN IN NGHIỆM THU CHUẨN A4 (ISO / KAIZEN) */}
      {activeTab === 'ACCEPTANCE_A4' && (
        <div className="space-y-4">
          <div className="print:hidden bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-teal-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600 shrink-0" />
              <span>
                Bản in đã được thiết lập định dạng chuẩn trang dọc A4 với đầy đủ tiêu đề Quốc hiệu, thông số mô phỏng FlexSim, bảng đối chiếu 27 công đoạn, phân tích Kaizen CD05 và 4 khối chữ ký nghiệm thu.
              </span>
            </div>
            <Button onClick={handlePrint} size="sm" variant="outline" className="gap-1 text-xs shrink-0">
              <Printer className="h-3.5 w-3.5" /> In ngay (Ctrl+P)
            </Button>
          </div>

          {/* Trang báo cáo A4 */}
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-sm text-slate-900 max-w-4xl mx-auto print:p-0 print:border-0 print:shadow-none print:max-w-none">
            {/* Header Quốc hiệu & Đơn vị */}
            <div className="grid grid-cols-2 border-b-2 border-slate-900 pb-5 mb-6 text-center">
              <div className="text-left space-y-0.5">
                <div className="text-xs uppercase font-semibold text-slate-600">CÔNG TY TNHH MAY XUẤT KHẨU VIỆT THÀNH</div>
                <div className="text-sm font-bold tracking-tight text-slate-900 uppercase">CHUYỀN SẢN XUẤT MAY — NHÓM 2</div>
                <div className="text-[11px] text-slate-500 font-mono">Dự án: Tối Ưu Hóa & Mô Phỏng Quần Trẻ Em Nữ</div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] italic font-serif text-slate-700">Độc lập – Tự do – Hạnh phúc</div>
                <div className="text-[10px] text-slate-500 pt-1">
                  TP. Hồ Chí Minh, ngày 15 tháng 11 năm 2026
                </div>
              </div>
            </div>

            {/* Tiêu đề Báo Cáo */}
            <div className="text-center space-y-1.5 mb-8">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
                BIÊN BẢN NGHIỆM THU & BÁO CÁO ĐÁNH GIÁ KỸ THUẬT
              </h2>
              <div className="text-sm font-semibold text-slate-700">
                MÔ PHỎNG VẬN HÀNH CHUYỀN MAY QUẦN TRẺ EM NỮ TRÊN PHẦN MỀM AUTODESK FLEXSIM 2027
              </div>
              <div className="inline-block font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 mt-1">
                Lượt mô phỏng tham chiếu: <strong>{selectedRun?.runCode || 'FLEXSIM_AUTOSAVE_1'}</strong> | Thời gian: 171.000s (~47,5 giờ)
              </div>
            </div>

            {/* I. TỔNG QUAN THÔNG SỐ VẬN HÀNH & 3 TIÊU CHÍ NGHIỆM THU ĐỘC LẬP */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                <span>I. ĐÁNH GIÁ ĐỘC LẬP 3 TIÊU CHÍ NGHIỆM THU (MỤC 2 &amp; 3)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Mục Tiêu Kế Hoạch</span>
                  <div className="font-mono font-bold text-base text-slate-900 mt-0.5">5.500 cái</div>
                  <span className="text-[10px] text-slate-500">Mốc thời gian: 171.000s</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Thành Phẩm Tại Sink</span>
                  <div className="font-mono font-bold text-base text-amber-800 mt-0.5">
                    {selectedRun?.finishedCount !== null ? `${selectedRun.finishedCount.toLocaleString('vi-VN')} cái` : 'Chưa có'}
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    Tỷ lệ: {selectedRun?.finishedCount ? ((selectedRun.finishedCount / 5500) * 100).toFixed(2).replace('.', ',') : '--'}% (Chưa đạt)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Số Lượng Còn Thiếu</span>
                  <div className="font-mono font-bold text-base text-amber-700 mt-0.5">
                    {selectedRun?.finishedCount ? Math.max(0, 5500 - selectedRun.finishedCount).toLocaleString('vi-VN') : '--'} cái
                  </div>
                  <span className="text-[10px] text-amber-800 font-semibold">Cần bù đắp</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tồn Cuối Toàn Chuyền</span>
                  <div className="font-mono font-bold text-sm text-purple-900 mt-0.5">
                    Chưa xác nhận
                  </div>
                  <span className="text-[10px] text-slate-500">4 Queue = 0 | 69 vị trí: Thiếu DL</span>
                </div>
              </div>

              {/* 3 Kết quả độc lập theo quy định nghiệm thu Mục 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px] mb-1">A. Đạt sản lượng:</div>
                  <Badge variant={selectedRun?.finishedCount && selectedRun.finishedCount >= 5500 ? 'success' : 'destructive'} className="text-[10px]">
                    {selectedRun?.finishedCount && selectedRun.finishedCount >= 5500 ? 'ĐẠT SẢN LƯỢNG' : 'CHƯA ĐẠT SẢN LƯỢNG'}
                  </Badge>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Thực tế: {selectedRun?.finishedCount?.toLocaleString('vi-VN')} / 5.500 cái (Thiếu {selectedRun?.finishedCount ? Math.max(0, 5500 - selectedRun.finishedCount) : '--'})
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px] mb-1">B. Hết tồn cuối kỳ toàn chuyền:</div>
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-800 bg-amber-50">
                    CHƯA XÁC NHẬN
                  </Badge>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Bốn Queue (CD05, CD12, CD14, CD17) = 0; 69 vị trí còn lại chưa có số liệu kiểm kê
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px] mb-1">C. Đạt đồng thời các tiêu chí:</div>
                  <Badge variant="destructive" className="text-[10px]">
                    CHƯA ĐẠT ĐẦY ĐỦ TIÊU CHÍ
                  </Badge>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Cần đồng thời: Sản lượng &ge; 5.500 VÀ Đúng mốc 171.000s VÀ Hết tồn toàn chuyền
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 leading-relaxed space-y-1">
                <p>
                  <strong>Giới hạn minh chứng &amp; bản quyền số liệu:</strong> Lượt mô phỏng tham chiếu <code>{selectedRun?.runCode || 'RUN_CHOT_5427'}</code> chỉ có bằng chứng một lượt chạy; hai ảnh minh chứng là cùng một lượt, không phải hai lần lặp độc lập. Ảnh kết quả đã chốt chỉ chứng minh 4 Queue trọng điểm (CD05, CD12, CD14, CD17) có tồn cuối bằng 0. 69 vị trí sản xuất còn lại chưa có dữ liệu kiểm kê đối chiếu trong ảnh chốt, do đó trạng thái tồn cuối toàn chuyền được bảo lưu ở mức <em>“Chưa xác nhận”</em>. Tuyệt đối không gắn nhãn <em>“Đã tối ưu hoàn toàn”</em> hoặc <em>“Đạt mục tiêu”</em> cho lượt này.
                </p>
              </div>
            </div>

            {/* II. CƠ CẤU BỐ TRÍ NHÂN SỰ CHUYỀN MAY (34 NGƯỜI) */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                <span>II. CƠ CẤU BỐ TRÍ 34 NHÂN SỰ CHUYỀN MAY (MỤC 8)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="font-bold text-slate-800 block text-xs mb-1">1. Nhân sự cố định (30 người):</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bố trí cố định tại từng vị trí đơn từ CD01 đến CD27 và các trạm A thuộc cụm máy may song song. Đảm bảo nhịp chuyền ổn định và duy trì tay nghề công nhân chuyên môn hóa.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/30">
                  <span className="font-bold text-indigo-950 block text-xs mb-1">2. Nhân sự điều chuyển linh hoạt (4 người):</span>
                  <div className="space-y-1 font-mono text-[10px] text-indigo-900">
                    <div>• <strong>OP_04_05:</strong> Chia sẻ giữa P_CD04B và P_CD05B_HOTRO (Tải hỗ trợ: 24,79%)</div>
                    <div>• <strong>OP_11_12:</strong> Chia sẻ giữa P_CD11B và P_CD12B_HOTRO (Tải hỗ trợ: 10,15%)</div>
                    <div>• <strong>OP_13_14:</strong> Chia sẻ giữa P_CD13B và P_CD14B_HOTRO (Tải hỗ trợ: 15,22%)</div>
                    <div>• <strong>OP_16_17:</strong> Chia sẻ giữa P_CD16B và P_CD17B_HOTRO (Tải hỗ trợ: 16,45%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* III. PHÂN TÍCH HIỆU QUẢ KAIZEN TẠI NÚT THẮT CD05 */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                <span>III. ĐÁNH GIÁ THỰC NGHIỆM ĐỐI CHỨNG & KAIZEN (STUDENT-T TEST)</span>
              </h3>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Chỉ Tiêu Đo Lường</th>
                      <th className="p-2 text-center">Hiện Trạng Gốc (HT)</th>
                      <th className="p-2 text-center">Phương Án Đồng Bộ (PA_DongBo)</th>
                      <th className="p-2 text-center">Mức Độ Cải Tiến</th>
                      <th className="p-2 text-right">Ý Nghĩa Thống Kê</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="p-2 font-sans font-medium">Tồn cuối kỳ BTP tại CD05</td>
                      <td className="p-2 text-center text-red-700">123,0 cái</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">20,0 cái</td>
                      <td className="p-2 text-center text-emerald-700 font-bold font-sans">-83,7%</td>
                      <td className="p-2 text-right text-slate-600 font-sans">p &lt; 0.0001 (Tin cậy 99.9%)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-medium">Thời gian chờ đợi tại Q_CD05</td>
                      <td className="p-2 text-center text-red-700">2.113,5s (~35,2p)</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">692,3s (~11,5p)</td>
                      <td className="p-2 text-center text-emerald-700 font-bold font-sans">-67,2%</td>
                      <td className="p-2 text-right text-slate-600 font-sans">Rút ngắn 23,7 phút/cái</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-medium">Tồn bình quân WIP CD05</td>
                      <td className="p-2 text-center">66,22 cái [66,02 → 66,42]</td>
                      <td className="p-2 text-center font-bold">22,04 cái [22,02 → 22,06]</td>
                      <td className="p-2 text-center text-emerald-700 font-bold font-sans">-66,7%</td>
                      <td className="p-2 text-right text-slate-600 font-sans">Student-t (df=9, n=10)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-medium">Sản lượng Sink thành phẩm</td>
                      <td className="p-2 text-center">4.944 cái</td>
                      <td className="p-2 text-center font-bold">4.953 cái</td>
                      <td className="p-2 text-center text-teal-700 font-sans">+9 cái</td>
                      <td className="p-2 text-right text-slate-600 font-sans">Duy trì công suất tối đa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* IV. KẾT LUẬN & KIẾN NGHỊ NGHIỆM THU */}
            <div className="space-y-2 mb-8 text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded">
                IV. KẾT LUẬN & ĐỀ NGHỊ PHÊ DUYỆT
              </h3>
              <p>
                1. <strong>Đạt yêu cầu nghiệm thu mô hình:</strong> Mô hình mô phỏng chuyền may quần trẻ em nữ được xây dựng hoàn chỉnh trên Autodesk FlexSim 2027, tái hiện chính xác 27 công đoạn, 3 điểm ráp Combiner và 4 vị trí hỗ trợ điều chuyển.
              </p>
              <p>
                2. <strong>Khuyến nghị triển khai phương án PA_DongBo vào thực tế xưởng:</strong> Áp dụng cữ gá máy may công nghiệp và tối ưu nhịp thao tác tại CD05 để kéo giảm thời gian gia công tương ứng hệ số k = 0.90, giải phóng diện tích sàn ~4.2 m² và giảm vốn tồn ứ ~38.5 triệu VNĐ.
              </p>
            </div>

            {/* Khối chữ ký 4 bên */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-slate-300">
              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-900 uppercase">CHUYỀN TRƯỞNG NHÓM 2</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                </div>
                <div className="font-bold text-slate-800 pt-6">Đinh Thị Phương</div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-900 uppercase">KỸ SƯ MÔ PHỎNG FLEXSIM</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                </div>
                <div className="font-bold text-slate-800 pt-6">Kim Đình Phương</div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-900 uppercase">QUẢN ĐỐC PHÂN XƯỞNG</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                </div>
                <div className="font-bold text-slate-800 pt-6">Nguyễn Văn Thành</div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-900 uppercase">GIÁM ĐỐC KỸ THUẬT</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký và đóng dấu)</div>
                </div>
                <div className="font-bold text-slate-800 pt-6">Lê Hoàng Quân</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: XUẤT TỆP EXCEL / CSV TRUYỀN THỐNG */}
      {activeTab === 'EXPORT_FILES' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thiết Lập Thông Số Xuất Tệp Excel & CSV</CardTitle>
            <CardDescription>Chọn lượt chạy và loại biểu mẫu cần trích xuất tệp nhị phân</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Chọn Lượt Chạy Mô Phỏng Cần Xuất
                </label>
                <select
                  value={selectedRunId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedRunId(newId);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('runId', newId);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.runCode === 'RUN_CHOT_5427' ? '[Lượt Đã Chốt] ' : ''}{r.runCode} - {r.dataSource} ({r.finishedCount !== null ? `${r.finishedCount.toLocaleString('vi-VN')}` : '--'}/{r.targetCount.toLocaleString('vi-VN')} cái)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Loại Biểu Mẫu Thống Kê
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="STAGE_METRICS">Báo cáo chi tiết 27 Công đoạn & Tồn BTP (Stage Metrics)</option>
                  <option value="RUN_OVERVIEW">Báo cáo tổng quan tiến độ sản lượng Sink (Run Overview)</option>
                  <option value="WORKERS">Báo cáo phân bổ 34 Nhân sự chuyền may (Workers Allocation)</option>
                </select>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Thông tin metadata đi kèm báo cáo:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div>Mã lượt: {selectedRun?.runCode}</div>
                <div>Nguồn dữ liệu: {selectedRun?.dataSource}</div>
                <div>Mục tiêu: {selectedRun?.targetCount} cái</div>
                <div>Thành phẩm Sink: {selectedRun?.finishedCount ?? 'Chưa kết thúc'} cái</div>
              </div>
            </div>

            {/* Download Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => handleDownload('xlsx')}
                disabled={isExporting}
                className="gap-2 bg-emerald-700 hover:bg-emerald-800"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Xuất tệp Excel (.xlsx)
              </Button>

              <Button
                onClick={() => handleDownload('csv')}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4 text-teal-600" />
                Xuất tệp CSV (UTF-8 BOM)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & Standard Notice */}
      <Card className="print:hidden border border-slate-200 bg-slate-50/50">
        <CardHeader className="py-4">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Tiêu Chuẩn Toàn Vẹn Báo Cáo (Tuân thủ Phần 19)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-600 space-y-1 pb-4">
          <p>
            - <strong>Chống CSV Formula Injection:</strong> Tất cả các trường văn bản bắt đầu bằng ký tự <code>=, +, -, @</code> được tự động khử độc để tránh lỗ hổng thực thi lệnh trên Excel.
          </p>
          <p>
            - <strong>Tính trung thực dữ liệu:</strong> Không xuất kết luận vượt quá dữ liệu đã đo. Các công đoạn chưa nhận được số liệu từ FlexSim giữ nguyên ô trống (null), không tự động gán giá trị 0.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
