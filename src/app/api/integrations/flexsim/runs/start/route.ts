import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import {
  extractBearerToken,
  hashIntegrationToken,
  checkClientRateLimit,
} from '@/lib/integration-security';
import { z } from 'zod';

const StartRunSchema = z.object({
  model_version: z.string().default('v1.0-baseline'),
  scenario_code: z.string().default('SCEN_CO_DINH'),
  random_seed: z.number().int().optional(),
  replication_index: z.number().int().positive().default(1),
  data_source: z
    .enum(['SIMULATION', 'ACTUAL', 'PLAN', 'MEASURED', 'ASSUMPTION', 'TEST_SIMULATION'])
    .default('SIMULATION'),
  source_description: z.string().optional(),
  target_count: z.number().int().positive().default(5500),
  run_time_seconds: z.number().positive().default(171000),
  warmup_seconds: z.number().nonnegative().optional(),
  client_software: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực Machine-to-Machine Token
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Yêu cầu token xác thực Bearer trong Authorization header.' },
        { status: 401 }
      );
    }

    const tokenHash = hashIntegrationToken(token);
    const client = await repository.getClientByTokenHash(tokenHash);
    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Token tích hợp không hợp lệ hoặc đã bị vô hiệu hóa.' },
        { status: 403 }
      );
    }

    // 2. Kiểm tra Rate Limit
    const rateCheck = checkClientRateLimit(client.id, client.rateLimitPerMin);
    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Vượt quá giới hạn tần suất (${client.rateLimitPerMin} req/phút). Vui lòng thử lại sau ${rateCheck.resetSeconds}s.`,
        },
        { status: 429 }
      );
    }

    // 3. Phân tích & Kiểm tra payload
    const body = await req.json();
    const parsed = StartRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Tìm scenario tương ứng
    const scenarios = await repository.getAllScenarios();
    let targetScenario = scenarios.find((s) => s.code === data.scenario_code);
    if (!targetScenario) {
      targetScenario = scenarios.find((s) => s.isBaseline) || scenarios[0];
    }

    const runCode = `RUN_${Date.now()}_REP${data.replication_index}`;

    // 4. Khởi tạo SimulationRun trong cơ sở dữ liệu
    const newRun = await repository.createRun({
      scenarioId: targetScenario.id,
      runCode,
      replicationIndex: data.replication_index,
      randomSeed: data.random_seed,
      runTimeSeconds: data.run_time_seconds,
      warmupSeconds: data.warmup_seconds,
      dataSource: data.data_source,
      sourceDescription: data.source_description || `Dữ liệu nhận từ ${data.client_software || 'FlexSim Client'}`,
      targetCount: data.target_count,
    });

    await repository.logAction(
      'FLEXSIM_RUN_START',
      'SimulationRun',
      newRun.id,
      { client: client.clientName, runCode, replicationIndex: data.replication_index },
      client.id
    );

    return NextResponse.json({
      status: 'SUCCESS',
      run_id: newRun.id,
      run_code: newRun.runCode,
      scenario: {
        id: targetScenario.id,
        code: targetScenario.code,
        name: targetScenario.name,
      },
      configuration: {
        allowed_sample_interval_seconds: 30, // Khuyến nghị lấy mẫu mỗi 30s mô phỏng
        max_batch_size: 100,
        target_count: data.target_count,
        planned_runtime_seconds: data.run_time_seconds,
      },
      created_at: newRun.createdAt,
    });
  } catch (error) {
    console.error('Lỗi khi bắt đầu lượt chạy FlexSim:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Không thể khởi tạo lượt chạy mô phỏng.' },
      { status: 500 }
    );
  }
}
