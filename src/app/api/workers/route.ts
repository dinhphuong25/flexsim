import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { FLOATING_WORKERS } from '@/lib/line-model-definition';

export async function GET() {
  const workers = await repository.getAllWorkers();
  const floatingWorkers = workers.filter((w) => w.isFloating);
  const fixedWorkers = workers.filter((w) => !w.isFloating);

  return NextResponse.json({
    totalWorkers: workers.length,
    fixedWorkersCount: fixedWorkers.length,
    floatingWorkersCount: floatingWorkers.length,
    summary: 'Tổng 34 nhân sự bao gồm 30 người cố định tại các trạm và 4 người điều chuyển hỗ trợ linh hoạt.',
    workers,
    floatingWorkersDetails: FLOATING_WORKERS,
  });
}
