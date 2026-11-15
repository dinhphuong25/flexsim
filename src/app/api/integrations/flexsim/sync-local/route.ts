import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import { repository } from '@/lib/repository';

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const scriptPath = path.join(process.cwd(), 'integration', 'flexsim', 'read_sqlite_direct.py');
    
    // Chạy script đọc trực tiếp SQLite từ FlexSim
    const { stdout, stderr } = await execPromise(`python "${scriptPath}"`, {
      timeout: 10000,
      encoding: 'utf-8',
    });

    if (stderr && !stdout) {
      return NextResponse.json({ error: `Lỗi đọc tệp FlexSim: ${stderr}` }, { status: 500 });
    }

    const flexsimData = JSON.parse(stdout);
    if (flexsimData.error) {
      return NextResponse.json({ error: flexsimData.error }, { status: 404 });
    }

    // Sử dụng mã lượt chạy ổn định (Idempotent Run Code) theo Mục 11
    // Đồng bộ lặp cùng một tệp không sinh thêm lượt chạy hoặc nhân đôi KPI
    const stableRunCode = 'FLEXSIM_DESKTOP_AUTOSAVE';
    const allRuns = await repository.getAllRuns();
    const existingRun = allRuns.find((r) => r.runCode === stableRunCode);

    let run: any;
    if (existingRun) {
      // Cập nhật lượt chạy sẵn có thay vì tạo bản ghi rác trùng lặp
      existingRun.finishedCount = flexsimData.finished_count;
      existingRun.runTimeSeconds = flexsimData.run_time_seconds;
      existingRun.sourceDescription = `Đồng bộ từ tệp SQLite Desktop: ${flexsimData.file_name} (${flexsimData.file_size_mb} MB) lúc ${new Date().toLocaleTimeString('vi-VN')}`;
      existingRun.finishedAt = new Date().toISOString();
      run = existingRun;
    } else {
      // Đăng ký lượt chạy đồng bộ mới
      run = await repository.createRun({
        scenarioId: 'scen_baseline_01',
        runCode: stableRunCode,
        replicationIndex: 1,
        runTimeSeconds: flexsimData.run_time_seconds,
        dataSource: 'SIMULATION',
        sourceDescription: `Đồng bộ từ tệp SQLite Desktop: ${flexsimData.file_name} (${flexsimData.file_size_mb} MB) lúc ${new Date().toLocaleTimeString('vi-VN')}`,
        targetCount: flexsimData.target_count,
      });
    }

    // Tạo stage metrics
    const stageMetrics = flexsimData.stages.map((stg: any) => ({
      stageCode: stg.stage_code,
      currentWip: stg.current_wip,
      avgWip: stg.avg_wip,
      maxWip: stg.max_wip,
      avgStaytime: stg.avg_staytime,
      processingPct: stg.processing_pct,
      outputCount: stg.output_count,
      inputCount: flexsimData.target_count,
    }));

    // Tạo object metrics từ processor percentages
    const objectMetrics = Object.entries(flexsimData.processor_percentages).map(([procName, pct]) => ({
      flexsimName: procName,
      processingPct: pct as number,
      stateAtSample: 'Processing',
      currentContent: 1,
      outputCount: 5408,
    }));

    // Lưu chi tiết các trạm (cập nhật hoặc ghi đè snapshot cho đúng runId)
    await repository.saveSnapshotBatch(run.id, 171000, stageMetrics, objectMetrics);

    // Kết thúc Run với số thành phẩm thực tế từ FlexSim
    await repository.finishRun(run.id, flexsimData.finished_count, 'COMPLETED');

    return NextResponse.json({
      success: true,
      message: existingRun
        ? 'Đã cập nhật dữ liệu đồng bộ FlexSim thành công (Idempotent update)!'
        : 'Đã đồng bộ trực tiếp thành công từ tệp mô hình FlexSim Desktop!',
      file_name: flexsimData.file_name,
      file_path: flexsimData.file_path,
      file_size_mb: flexsimData.file_size_mb,
      software: flexsimData.software,
      run_id: run.id,
      run_code: stableRunCode,
      is_idempotent_update: !!existingRun,
      finished_count: flexsimData.finished_count,
      target_count: flexsimData.target_count,
      remaining_count: flexsimData.remaining_count,
      completion_rate_pct: flexsimData.completion_rate_pct,
      total_stages: flexsimData.stages.length,
      scenarios: flexsimData.scenarios,
      replications_count: flexsimData.total_tasks,
      sync_time: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi đồng bộ';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
