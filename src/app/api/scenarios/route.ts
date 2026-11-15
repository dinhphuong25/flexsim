import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { z } from 'zod';

const ScenarioCreateSchema = z.object({
  code: z.string().min(3).max(50),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  processTimeFactor: z.number().min(0.1).max(2.0).default(1.0),
  assumptionsBasis: z.string().optional(),
});

export async function GET() {
  const scenarios = await repository.getAllScenarios();
  const runs = await repository.getAllRuns();

  const scenariosWithStats = scenarios.map((scen) => {
    const scenRuns = runs.filter((r) => r.scenarioId === scen.id);
    return {
      ...scen,
      runCount: scenRuns.length,
      latestRun: scenRuns[0] || null,
    };
  });

  return NextResponse.json({ scenarios: scenariosWithStats });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'MANAGE_SCENARIOS')) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Không có quyền tạo phương án mới.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = ScenarioCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', details: parsed.error.format() }, { status: 400 });
    }

    const line = await repository.getLine();
    const newScen = await repository.createScenario({
      lineId: line?.id || 'line_nhom_2',
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description,
      isBaseline: false,
      processTimeFactor: parsed.data.processTimeFactor,
      assumptionsBasis: parsed.data.assumptionsBasis,
    });

    await repository.logAction(
      'CREATE_SCENARIO',
      'Scenario',
      newScen.id,
      { code: newScen.code, factor: parsed.data.processTimeFactor },
      user.id
    );

    return NextResponse.json({ status: 'SUCCESS', scenario: newScen });
  } catch (error) {
    console.error('Lỗi khi tạo phương án:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
