import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { FLOATING_WORKERS } from '@/lib/line-model-definition';

export async function GET() {
  const positions = await repository.getAllWorkforcePositions();
  const fixedPositions = positions.filter((p) => p.workerType === 'FIXED');
  const floatingPositions = positions.filter((p) => p.workerType === 'FLOATING');
  const skillMatrix = await repository.getSkillMatrix();
  const checklists = await repository.getAllChecklists();
  const workers = await repository.getAllWorkers();

  return NextResponse.json({
    kpis: {
      totalPositions: positions.length,
      fixedCount: fixedPositions.length,
      floatingCount: floatingPositions.length,
      validAssignmentsCount: positions.filter((p) => p.isAssigned).length,
      missingMappingsCount: positions.filter((p) => !p.primaryStation).length,
      missingJobDescCount: positions.filter((p) => !p.jobDescription).length,
      verifiedCount: positions.filter((p) => p.isVerified).length,
    },
    summary: 'Tổng 34 nhân sự bao gồm 30 người cố định tại các trạm và 4 người điều chuyển hỗ trợ linh hoạt.',
    positions,
    skillMatrix,
    checklists,
    workers,
    floatingWorkersDetails: FLOATING_WORKERS,
  });
}
