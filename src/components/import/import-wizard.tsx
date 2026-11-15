'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileUp, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

interface ImportJobSummary {
  id: string;
  fileName: string;
  fileType: string;
  recordCount: number;
  successCount: number;
  errorCount: number;
  status: string;
  createdAt: string;
}

export function ImportWizard({
  history,
}: {
  history: ImportJobSummary[];
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    totalRows: number;
    errorCount: number;
    errors: { row: number; column: string; value: unknown; error: string }[];
    preview: Record<string, unknown>[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Xử lý đọc file CSV / XLSX phía client
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
          setParsedRows(data);
          setStep(2);
        } catch {
          alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } else {
      // Đọc file CSV bằng PapaParse
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data as Record<string, unknown>[]);
          setStep(2);
          setIsLoading(false);
        },
        error: () => {
          alert('Lỗi khi phân tích file CSV.');
          setIsLoading(false);
        },
      });
    }
  };

  // Bước 3: Gửi dữ liệu tới API kiểm tra lỗi (Validate Preview)
  const handleValidatePreview = async () => {
    if (!file || parsedRows.length === 0) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          rows: parsedRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setValidationResult(data);
        setStep(3);
      } else {
        alert(data.message || 'Lỗi khi kiểm tra dữ liệu.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 4: Xác nhận lưu vào Database
  const handleConfirmImport = async () => {
    if (!file || !validationResult || !validationResult.isValid) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.name.endsWith('.xlsx') ? 'XLSX' : 'CSV',
          fileSize: file.size,
          rows: parsedRows,
          dataSource: 'MEASURED',
          notes: 'Nhập từ file dự phòng qua Import Wizard',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStep(4);
      } else {
        alert(data.message || 'Lỗi khi lưu dữ liệu.');
      }
    } catch {
      alert('Lỗi máy chủ khi xác nhận lưu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'stage_code,input,output,current,avg_wip,max_wip,wait_seconds,processing_pct\r\n' +
      'CD01,5500,5500,0,0.12,2,3.45,96.50\r\n' +
      'CD02,5500,5500,0,0.25,3,5.12,98.10\r\n' +
      'CD05,5500,5478,22,22.31,30,700.33,99.89\r\n' +
      'CD12,5450,5450,0,0.01,1,0.25,93.93\r\n' +
      'CD14,5450,5450,0,0.84,4,26.65,98.56\r\n' +
      'CD17,5430,5430,0,0.76,3,24.09,99.03\r\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Nhap_Du_Lieu_Chuyen_May_VietThanh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileUp className="h-6 w-6 text-teal-600" />
            Nhập Dữ Liệu Dự Phòng (CSV / XLSX Backup Import)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình nhập dữ liệu ngoại tuyến gồm 4 bước: Chọn tệp &rarr; Ánh xạ cột &rarr; Kiểm tra lỗi chi tiết &rarr; Lưu vào Database.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleDownloadSample} className="gap-2 shrink-0">
          <Download className="h-4 w-4 text-teal-600" />
          Tải tệp CSV mẫu chuẩn
        </Button>
      </div>

      {/* Stepper Breadcrumb */}
      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
        <span className={step >= 1 ? 'text-teal-700 font-bold' : ''}>1. Chọn tệp</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <span className={step >= 2 ? 'text-teal-700 font-bold' : ''}>2. Phân tích cột</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <span className={step >= 3 ? 'text-teal-700 font-bold' : ''}>3. Kiểm tra tính hợp lệ</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <span className={step >= 4 ? 'text-teal-700 font-bold' : ''}>4. Hoàn tất</span>
      </div>

      {/* Wizard Steps */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bước 1: Chọn Tệp Bảng Tính Cần Nhập</CardTitle>
            <CardDescription>Hỗ trợ định dạng CSV UTF-8 hoặc Microsoft Excel (.xlsx, .xls) tối đa 5.000 dòng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <FileSpreadsheet className="h-10 w-10 text-teal-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Kéo thả tệp CSV hoặc Excel vào đây, hoặc nhấp để chọn tệp
              </p>
              <p className="text-xs text-slate-500 mb-4">Dung lượng tối đa 10MB. Tự động kiểm tra chống Formula Injection.</p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                  <span>Duyệt tệp từ máy tính</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bước 2: Xem Trước Dữ Liệu Tệp Đã Tải Lên</CardTitle>
            <CardDescription>
              Tệp: <strong className="text-slate-800">{file?.name}</strong> ({parsedRows.length} dòng dữ liệu)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto border rounded-lg max-h-64">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    {Object.keys(parsedRows[0] || {}).map((col) => (
                      <th key={col} className="p-2.5">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.values(row).map((val, idx) => (
                        <td key={idx} className="p-2.5">
                          {String(val ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Chọn tệp khác
              </Button>
              <Button size="sm" onClick={handleValidatePreview} disabled={isLoading}>
                {isLoading ? 'Đang kiểm tra...' : 'Tiến hành kiểm tra dữ liệu &rarr;'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Bước 3: Kết Quả Kiểm Tra Tính Toàn Vẹn Dữ Liệu</CardTitle>
                <CardDescription>
                  Tổng: {validationResult.totalRows} dòng | Phát hiện: {validationResult.errorCount} lỗi
                </CardDescription>
              </div>
              {validationResult.isValid ? (
                <Badge variant="success">Hợp lệ 100%</Badge>
              ) : (
                <Badge variant="destructive">Có {validationResult.errorCount} lỗi cần sửa</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {validationResult.errorCount > 0 ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Danh Sách Lỗi Kiểm Tra Cần Sửa Trước Khi Lưu:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pl-2">
                  {validationResult.errors.map((err, idx) => (
                    <div key={idx} className="font-mono">
                      - Dòng {err.row}, cột <strong>{err.column}</strong>: {err.error} (Giá trị nhận: &ldquo;{String(err.value)}&rdquo;)
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Dữ Liệu Đạt Tiêu Chuẩn Toàn Vẹn:
                </div>
                <p>
                  Toàn bộ các số lượng đếm đều là số nguyên không âm, tỷ lệ Processing nằm trong 0–100%, không phát hiện công thức macro nguy hiểm, giá trị rỗng được bảo toàn dạng null.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Quay lại
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmImport}
                disabled={isLoading || !validationResult.isValid}
              >
                {isLoading ? 'Đang lưu vào database...' : 'Xác nhận nhập vào Database'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/20">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Nhập Dữ Liệu Hoàn Tất Thành Công!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{successMessage}</p>
            <div className="pt-4 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setParsedRows([]);
                  setValidationResult(null);
                }}
              >
                Nhập tệp khác
              </Button>
              <Button size="sm" onClick={() => window.location.href = '/stages'}>
                Xem bảng công đoạn
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch Sử Nhập Dữ Liệu Dự Phòng (Import History)</CardTitle>
          <CardDescription>Ghi nhận nhật ký các phiên nhập bảng tính và trạng thái thực thi</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Chưa có phiên nhập dữ liệu nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
                  <tr>
                    <th className="py-2.5 px-3">Tên tệp</th>
                    <th className="py-2.5 px-3">Định dạng</th>
                    <th className="py-2.5 px-3 text-right">Tổng số dòng</th>
                    <th className="py-2.5 px-3 text-right">Thành công</th>
                    <th className="py-2.5 px-3 text-right">Lỗi</th>
                    <th className="py-2.5 px-3">Thời điểm</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{h.fileName}</td>
                      <td className="py-2.5 px-3">{h.fileType}</td>
                      <td className="py-2.5 px-3 text-right">{h.recordCount}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{h.successCount}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{h.errorCount}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-500">
                        {new Date(h.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <Badge variant={h.status === 'COMPLETED' ? 'success' : 'destructive'}>
                          {h.status === 'COMPLETED' ? 'Thành công' : 'Thất bại'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
