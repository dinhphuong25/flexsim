import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { repository } from '@/lib/repository';

const DEFAULT_SQLITE_PATHS = [
  'C:\\Users\\Administrator\\Desktop\\NHOM2_FINAL_2_autosave_1.sqlite',
  'C:\\Users\\Administrator\\Desktop\\NHOM2_FINAL_2.sqlite',
  'C:\\Users\\Administrator\\Desktop\\NHOM2_FINAL.sqlite',
];

function getActiveFile() {
  for (const p of DEFAULT_SQLITE_PATHS) {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      return {
        path: p,
        fileName: path.basename(p),
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
        mtimeMs: stat.mtimeMs,
        modifiedAt: stat.mtime.toISOString(),
      };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const fileInfo = getActiveFile();
    const runs = await repository.getAllRuns();
    const activeRun = runs[0] || null;

    if (!fileInfo) {
      return NextResponse.json({
        connected: false,
        message: 'Không tìm thấy tệp .sqlite FlexSim trên Desktop',
        activeRun: activeRun ? { id: activeRun.id, code: activeRun.runCode } : null,
      });
    }

    return NextResponse.json({
      connected: true,
      file: fileInfo,
      activeRun: activeRun ? {
        id: activeRun.id,
        code: activeRun.runCode,
        finishedCount: activeRun.finishedCount,
        targetCount: activeRun.targetCount,
        dataSource: activeRun.dataSource,
        createdAt: activeRun.createdAt,
      } : null,
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi lấy trạng thái';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
