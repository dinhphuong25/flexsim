import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { validateImportRow } from '@/lib/import-validator';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'IMPORT_BACKUP_DATA')) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản không có quyền nhập dữ liệu dự phòng.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      rows,
      fileName = 'imported_backup.csv',
      fileType = 'CSV',
      fileSize = 1024,
      targetRunId,
      dataSource = 'MEASURED',
      notes,
    } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'EMPTY_DATA', message: 'Không có dữ liệu để nhập.' }, { status: 400 });
    }

    // Xác thực lại trước khi lưu
    const errors: { rowNumber: number; columnName?: string; errorMessage: string }[] = [];
    rows.forEach((row, idx) => {
      const rowErrs = validateImportRow(row, idx + 1);
      for (const err of rowErrs) {
        errors.push({
          rowNumber: err.row,
          columnName: err.column,
          errorMessage: err.error,
        });
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: `Dữ liệu có ${errors.length} lỗi kiểm tra. Vui lòng sửa lỗi trước khi xác nhận lưu.`,
          errors: errors.slice(0, 50),
        },
        { status: 400 }
      );
    }

    // Xác định Run ID để lưu dữ liệu
    let runId = targetRunId;
    if (!runId) {
      const scenarios = await repository.getAllScenarios();
      const baseScen = scenarios.find((s) => s.isBaseline) || scenarios[0];
      const newRun = await repository.createRun({
        scenarioId: baseScen.id,
        runCode: `RUN_IMP_${Date.now()}`,
        dataSource,
        sourceDescription: `Nhập từ tệp dự phòng: ${fileName} bởi ${user.fullName} (${notes || 'Không ghi chú'})`,
      });
      runId = newRun.id;
    }

    const stageData: {
      stageCode: string;
      input?: number;
      output?: number;
      currentWip?: number;
      avgWip?: number;
      maxWip?: number;
      avgStaytime?: number;
      processingPct?: number;
    }[] = [];

    const objectData: {
      flexsimName: string;
      input?: number;
      output?: number;
      currentContent?: number;
      avgContent?: number;
      maxContent?: number;
      avgStaytime?: number;
      processingPct?: number;
      state?: string;
    }[] = [];

    for (const r of rows) {
      const isStage = !!r.stage_code;
      if (isStage) {
        stageData.push({
          stageCode: String(r.stage_code).trim(),
          input: r.input !== null && r.input !== undefined && r.input !== '' ? Number(r.input) : undefined,
          output: r.output !== null && r.output !== undefined && r.output !== '' ? Number(r.output) : undefined,
          currentWip: r.current !== null && r.current !== undefined && r.current !== '' ? Number(r.current) : undefined,
          avgWip: r.avg_wip !== null && r.avg_wip !== undefined && r.avg_wip !== '' ? Number(r.avg_wip) : undefined,
          maxWip: r.max_wip !== null && r.max_wip !== undefined && r.max_wip !== '' ? Number(r.max_wip) : undefined,
          avgStaytime:
            r.wait_seconds !== null && r.wait_seconds !== undefined && r.wait_seconds !== ''
              ? Number(r.wait_seconds)
              : undefined,
          processingPct:
            r.processing_pct !== null && r.processing_pct !== undefined && r.processing_pct !== ''
              ? Number(r.processing_pct)
              : undefined,
        });
      } else if (r.object_name) {
        objectData.push({
          flexsimName: String(r.object_name).trim(),
          input: r.input !== null && r.input !== undefined && r.input !== '' ? Number(r.input) : undefined,
          output: r.output !== null && r.output !== undefined && r.output !== '' ? Number(r.output) : undefined,
          currentContent: r.current !== null && r.current !== undefined && r.current !== '' ? Number(r.current) : undefined,
          avgContent: r.avg_wip !== null && r.avg_wip !== undefined && r.avg_wip !== '' ? Number(r.avg_wip) : undefined,
          maxContent: r.max_wip !== null && r.max_wip !== undefined && r.max_wip !== '' ? Number(r.max_wip) : undefined,
          avgStaytime:
            r.wait_seconds !== null && r.wait_seconds !== undefined && r.wait_seconds !== ''
              ? Number(r.wait_seconds)
              : undefined,
          processingPct:
            r.processing_pct !== null && r.processing_pct !== undefined && r.processing_pct !== ''
              ? Number(r.processing_pct)
              : undefined,
          state: r.state ? String(r.state) : undefined,
        });
      }
    }

    const simTime = body.simulationTimeSeconds ? Number(body.simulationTimeSeconds) : 171000;
    await repository.saveSnapshotBatch(runId, simTime, stageData, objectData);

    const importJob = await repository.createImportJob({
      fileName,
      fileType: fileType as 'CSV' | 'XLSX',
      fileSize,
      targetTable: stageData.length > 0 ? 'STAGE_METRICS' : 'OBJECT_METRICS',
      recordCount: rows.length,
      successCount: rows.length,
      errorCount: 0,
      status: 'COMPLETED',
      importedBy: user.id,
      createdAt: new Date().toISOString(),
      errors: [],
    });

    await repository.logAction(
      'IMPORT_BACKUP_CONFIRM',
      'ImportJob',
      importJob.id,
      { fileName, rowsImported: rows.length, targetRunId: runId },
      user.id
    );

    return NextResponse.json({
      status: 'SUCCESS',
      message: `Đã nhập thành công ${rows.length} dòng dữ liệu vào lượt chạy ${runId}.`,
      importJobId: importJob.id,
      targetRunId: runId,
      recordsSaved: {
        stageCount: stageData.length,
        objectCount: objectData.length,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu nhập:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
