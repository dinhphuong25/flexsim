import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { generateSafeCsv, generateExcelWorkbook } from '@/lib/export-utils';
import { formatMetricNumber, formatPercentage } from '@/lib/kpi';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');
  const format = searchParams.get('format') || 'csv';
  const type = searchParams.get('type') || 'STAGE_METRICS';

  // Lấy dữ liệu lượt chạy
  const runs = await repository.getAllRuns();
  const targetRun = runId ? runs.find((r) => r.id === runId) : runs[0];

  if (!targetRun) {
    return NextResponse.json({ error: 'RUN_NOT_FOUND', message: 'Không tìm thấy dữ liệu lượt chạy.' }, { status: 404 });
  }

  const stageMetrics = await repository.getStageMetricsByRunId(targetRun.id);
  const objectMetrics = await repository.getObjectMetricsByRunId(targetRun.id);
  const stages = await repository.getAllStages();
  const workers = await repository.getAllWorkers();

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');

  if (type === 'STAGE_METRICS') {
    const headers = [
      'Mã công đoạn',
      'Tên công đoạn',
      'Phân nhánh',
      'Số trạm song song',
      'Input',
      'Output',
      'Tồn hiện tại (Current WIP)',
      'Tồn trung bình (Avg WIP)',
      'Tồn tối đa (Max WIP)',
      'Thời gian chờ TB (giây)',
      'Tỷ lệ vận hành (Processing %)',
      'Thời điểm đo (giây)',
    ];

    const rows = stages.map((stg) => {
      const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
      return [
        stg.stageCode,
        stg.name,
        stg.branch,
        stg.parallelStationCount,
        metric?.inputCount ?? '',
        metric?.outputCount ?? '',
        metric?.currentWip ?? '',
        metric?.avgWip !== null && metric?.avgWip !== undefined ? metric.avgWip.toFixed(2) : '',
        metric?.maxWip ?? '',
        metric?.avgStaytime !== null && metric?.avgStaytime !== undefined ? metric.avgStaytime.toFixed(2) : '',
        metric?.processingPct !== null && metric?.processingPct !== undefined ? metric.processingPct.toFixed(2) : '',
        metric?.simulationTimeSeconds ?? '',
      ];
    });

    if (format === 'xlsx') {
      const xlsxBuffer = generateExcelWorkbook([
        {
          name: 'Thống kê Công đoạn',
          headers,
          rows,
        },
      ]);

      return new Response(xlsxBuffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="BaoCao_CongDoan_${targetRun.runCode}_${timestampStr}.xlsx"`,
        },
      });
    }

    // Mặc định xuất CSV
    const csvContent = generateSafeCsv(headers, rows);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="BaoCao_CongDoan_${targetRun.runCode}_${timestampStr}.csv"`,
      },
    });
  }

  if (type === 'RUN_OVERVIEW') {
    const headers = [
      'Mã lượt chạy',
      'Nguồn dữ liệu',
      'Mô tả nguồn',
      'Mục tiêu (cái)',
      'Thành phẩm tại Sink (cái)',
      'Tỷ lệ hoàn thành (%)',
      'Số còn thiếu (cái)',
      'Thời gian mô phỏng (giây)',
      'Trạng thái',
      'Thời điểm xuất',
    ];

    const completionRate = targetRun.finishedCount !== null
      ? ((targetRun.finishedCount / targetRun.targetCount) * 100).toFixed(2)
      : '';
    const missing = targetRun.finishedCount !== null ? Math.max(targetRun.targetCount - targetRun.finishedCount, 0) : '';

    const rows = [
      [
        targetRun.runCode,
        targetRun.dataSource,
        targetRun.sourceDescription || '',
        targetRun.targetCount,
        targetRun.finishedCount ?? '',
        completionRate,
        missing,
        targetRun.runTimeSeconds,
        targetRun.status,
        new Date().toISOString(),
      ],
    ];

    if (format === 'xlsx') {
      const xlsxBuffer = generateExcelWorkbook([
        {
          name: 'Tổng quan lượt chạy',
          headers,
          rows,
        },
      ]);
      return new Response(xlsxBuffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="BaoCao_TongQuan_${targetRun.runCode}_${timestampStr}.xlsx"`,
        },
      });
    }

    const csvContent = generateSafeCsv(headers, rows);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="BaoCao_TongQuan_${targetRun.runCode}_${timestampStr}.csv"`,
      },
    });
  }

  // Workers
  const headers = ['Mã công nhân', 'Họ tên', 'Phân loại', 'Trạm chính', 'Trạm phụ / Hỗ trợ', 'Quy tắc điều chuyển'];
  const rows = workers.map((w) => [
    w.workerCode,
    w.name,
    w.isFloating ? 'Điều chuyển (Hỗ trợ)' : 'Cố định',
    w.primaryStation || '',
    w.secondaryStation || '',
    w.transferRule || '',
  ]);

  const csvContent = generateSafeCsv(headers, rows);
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="BaoCao_NhanLuc_${timestampStr}.csv"`,
    },
  });
}
