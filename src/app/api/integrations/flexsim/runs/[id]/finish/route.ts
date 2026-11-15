import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import {
  extractBearerToken,
  hashIntegrationToken,
  checkClientRateLimit,
} from '@/lib/integration-security';
import { performInventoryAudit } from '@/lib/inventory-audit';
import { z } from 'zod';

const FinishRunSchema = z.object({
  final_simulation_time_seconds: z.number().nonnegative(),
  final_sink_finished_count: z.number().int().nonnegative(),
  completion_reason: z.enum(['NORMAL', 'STOPPED_EARLY', 'ERROR', 'RESET']).default('NORMAL'),
  notes: z.string().optional(),
  final_snapshot: z
    .object({
      stage_metrics: z.array(z.any()).optional(),
      object_metrics: z.array(z.any()).optional(),
    })
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runId = params.id;

    // 1. Xác thực Token
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Yêu cầu token xác thực Bearer.' },
        { status: 401 }
      );
    }

    const tokenHash = hashIntegrationToken(token);
    const client = await repository.getClientByTokenHash(tokenHash);
    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Token không hợp lệ hoặc đã bị khóa.' },
        { status: 403 }
      );
    }

    // 2. Kiểm tra Rate Limit
    const rateCheck = checkClientRateLimit(client.id, client.rateLimitPerMin);
    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Vượt quá giới hạn tần suất. Thử lại sau ${rateCheck.resetSeconds}s.`,
        },
        { status: 429 }
      );
    }

    // 3. Tìm Run
    const run = await repository.getRunById(runId);
    if (!run) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Không tìm thấy lượt chạy mô phỏng: ${runId}` },
        { status: 404 }
      );
    }

    if (run.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          error: 'ALREADY_FINISHED',
          message: `Lượt chạy ${runId} đã kết thúc trước đó với trạng thái ${run.status}.`,
        },
        { status: 409 }
      );
    }

    // 4. Phân tích Payload
    const body = await req.json();
    const parsed = FinishRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Lưu final snapshot nếu có
    if (data.final_snapshot) {
      const stageData = data.final_snapshot.stage_metrics?.map((sm: any) => ({
        stageCode: sm.stage_code || sm.stageCode,
        input: sm.input,
        output: sm.output,
        currentWip: sm.current_wip ?? sm.currentWip,
        avgWip: sm.avg_wip ?? sm.avgWip,
        maxWip: sm.max_wip ?? sm.maxWip,
        avgStaytime: sm.avg_staytime ?? sm.avgStaytime,
        processingPct: sm.processing_pct ?? sm.processingPct,
      }));

      const objectData = data.final_snapshot.object_metrics?.map((om: any) => ({
        flexsimName: om.flexsim_name || om.flexsimName,
        input: om.input,
        output: om.output,
        currentContent: om.current_content ?? om.currentContent,
        avgContent: om.avg_content ?? om.avgContent,
        maxContent: om.max_content ?? om.maxContent,
        avgStaytime: om.avg_staytime ?? om.avgStaytime,
        processingPct: om.processing_pct ?? om.processingPct,
        state: om.state,
      }));

      await repository.saveSnapshotBatch(
        runId,
        data.final_simulation_time_seconds,
        stageData,
        objectData
      );
    }

    // Ánh xạ trạng thái kết thúc
    let finalStatus: 'COMPLETED' | 'STOPPED_EARLY' | 'ERROR' | 'RESET';
    switch (data.completion_reason) {
      case 'STOPPED_EARLY':
        finalStatus = 'STOPPED_EARLY';
        break;
      case 'ERROR':
        finalStatus = 'ERROR';
        break;
      case 'RESET':
        finalStatus = 'RESET';
        break;
      default:
        finalStatus = 'COMPLETED';
        break;
    }

    const finishedRun = await repository.finishRun(runId, data.final_sink_finished_count, finalStatus);

    // Tự động kiểm tra hết tồn nếu lượt chạy kết thúc bình thường
    let auditSummary = null;
    if (finalStatus === 'COMPLETED') {
      const objMetrics = await repository.getObjectMetricsByRunId(runId);
      const modelObjects = await repository.getAllModelObjects();

      const auditInputs = modelObjects.map((mo) => {
        const metric = objMetrics.find((m) => m.modelObjectId === mo.id || m.flexsimName === mo.flexsimName);
        return {
          flexsimName: mo.flexsimName,
          objectType: mo.objectType,
          branch: mo.branch,
          isMandatoryScope: mo.isInventoryAudited,
          currentContent: metric?.currentContent ?? null,
          sampleTimeSeconds: metric?.simulationTimeSeconds,
        };
      });

      const auditResult = performInventoryAudit({
        objects: auditInputs,
        runEndTimeSeconds: data.final_simulation_time_seconds,
        isMaterialReleaseComplete: true,
        isTransportCleared: true,
        hasUnreleasedMandatoryFeed: false,
      });

      await repository.saveInventoryAudit({
        runId,
        auditTimestamp: new Date().toISOString(),
        simulationTimeSeconds: data.final_simulation_time_seconds,
        conclusion: auditResult.conclusion,
        totalScopeItems: auditResult.totalScopeObjects,
        totalRemainingWip: auditResult.totalRemainingFlowItems,
        isMaterialReleaseComplete: true,
        isTransportCleared: true,
        inspectedScopeSummary: auditResult.conclusionDescription,
        notes: `Tự động kiểm định khi nhận tín hiệu finish từ ${client.clientName}`,
        items: auditResult.itemsWithWip.map((item, idx) => ({
          id: `ai_${runId}_${idx}`,
          objectName: item.flexsimName,
          objectType: item.objectType,
          currentContent: item.content,
          isAudited: true,
          status: 'HAS_WIP',
        })),
      });

      auditSummary = {
        conclusion: auditResult.conclusion,
        title: auditResult.conclusionTitle,
        remaining_flow_items: auditResult.totalRemainingFlowItems,
      };
    }

    await repository.logAction(
      'FLEXSIM_RUN_FINISH',
      'SimulationRun',
      runId,
      {
        finalStatus,
        finishedCount: data.final_sink_finished_count,
        targetCount: run.targetCount,
        simulationTime: data.final_simulation_time_seconds,
        auditConclusion: auditSummary?.conclusion,
      },
      client.id
    );

    return NextResponse.json({
      status: 'CONFIRMED',
      run_id: runId,
      run_code: run.runCode,
      final_status: finalStatus,
      finished_count: data.final_sink_finished_count,
      target_count: run.targetCount,
      completion_rate_pct: Math.round((data.final_sink_finished_count / run.targetCount) * 10000) / 100,
      finished_at: finishedRun?.finishedAt,
      inventory_audit: auditSummary,
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất lượt chạy FlexSim:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Lỗi máy chủ khi hoàn tất lượt chạy.' },
      { status: 500 }
    );
  }
}
