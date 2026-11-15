import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  const line = await repository.getLine();
  const scenarios = await repository.getAllScenarios();

  return NextResponse.json({
    status: 'ONLINE',
    service: 'Viet Thanh Garment FlexSim Ingestion Gateway',
    version: '1.0.0',
    supported_schema_version: '1.0.0',
    server_time: new Date().toISOString(),
    capabilities: {
      batch_snapshots: true,
      idempotent_sequence: true,
      max_payload_bytes: 5242880,
      min_sample_interval_ms: 200,
      supported_data_sources: ['SIMULATION', 'TEST_SIMULATION', 'ACTUAL', 'MEASURED'],
    },
    active_line: line
      ? {
          code: line.code,
          name: line.name,
          target_output: line.targetOutput,
          planned_runtime_seconds: line.runTimeSeconds,
          planned_workers: line.plannedWorkers,
          scenarios: scenarios.map((s) => ({ code: s.code, name: s.name, is_baseline: s.isBaseline })),
        }
      : null,
  });
}
