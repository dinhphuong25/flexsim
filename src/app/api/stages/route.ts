import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  const stages = await repository.getAllStages();
  const modelObjects = await repository.getAllModelObjects();

  let stageMetrics: Awaited<ReturnType<typeof repository.getStageMetricsByRunId>> = [];
  let objectMetrics: Awaited<ReturnType<typeof repository.getObjectMetricsByRunId>> = [];

  if (runId) {
    stageMetrics = await repository.getStageMetricsByRunId(runId);
    objectMetrics = await repository.getObjectMetricsByRunId(runId);
  } else {
    // Lấy lượt chạy mới nhất hoặc lượt tham chiếu
    const runs = await repository.getAllRuns();
    if (runs.length > 0) {
      stageMetrics = await repository.getStageMetricsByRunId(runs[0].id);
      objectMetrics = await repository.getObjectMetricsByRunId(runs[0].id);
    }
  }

  const stagesWithMetrics = stages.map((stg) => {
    const metric = stageMetrics.find((m) => m.stageCode === stg.stageCode);
    const relatedObjects = modelObjects.filter((o) => o.stageId === stg.id || o.flexsimName.includes(stg.stageCode));
    return {
      ...stg,
      metric: metric || null,
      objectCount: relatedObjects.length,
      objects: relatedObjects.map((obj) => {
        const objMetric = objectMetrics.find(
          (om) => om.modelObjectId === obj.id || om.flexsimName === obj.flexsimName
        );
        return {
          ...obj,
          metric: objMetric || null,
        };
      }),
    };
  });

  return NextResponse.json({ stages: stagesWithMetrics });
}
