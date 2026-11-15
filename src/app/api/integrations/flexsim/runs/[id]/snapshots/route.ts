import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import {
  extractBearerToken,
  hashIntegrationToken,
  checkClientRateLimit,
  validateSnapshotSequence,
} from '@/lib/integration-security';
import { z } from 'zod';

const MetricObjectSchema = z.object({
  flexsim_name: z.string(),
  input: z.number().int().nonnegative().optional(),
  output: z.number().int().nonnegative().optional(),
  current_content: z.number().int().nonnegative().optional(),
  avg_content: z.number().nonnegative().optional(),
  max_content: z.number().int().nonnegative().optional(),
  avg_staytime: z.number().nonnegative().optional(),
  processing_pct: z.number().min(0).max(100).optional(),
  state: z.string().optional(),
});

const MetricStageSchema = z.object({
  stage_code: z.string(),
  input: z.number().int().nonnegative().optional(),
  output: z.number().int().nonnegative().optional(),
  current_wip: z.number().int().nonnegative().optional(),
  avg_wip: z.number().nonnegative().optional(),
  max_wip: z.number().int().nonnegative().optional(),
  avg_staytime: z.number().nonnegative().optional(),
  processing_pct: z.number().min(0).max(100).optional(),
});

const SnapshotItemSchema = z.object({
  schema_version: z.string().default('1.0.0'),
  sequence_number: z.number().int().positive(),
  simulation_time_seconds: z.number().nonnegative(),
  captured_at: z.string().optional(),
  sink_finished_count: z.number().int().nonnegative().optional(),
  object_metrics: z.array(MetricObjectSchema).optional(),
  stage_metrics: z.array(MetricStageSchema).optional(),
});

const SnapshotsPayloadSchema = z.union([
  SnapshotItemSchema,
  z.object({
    snapshots: z.array(SnapshotItemSchema).min(1),
  }),
]);

// Map lưu sequence number cao nhất từng nhận được của mỗi runId
const latestRunSequenceMap = new Map<string, number>();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runId = params.id;

    // 1. Xác thực Machine-to-Machine Token
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
          message: `Vượt quá giới hạn tần suất (${client.rateLimitPerMin} req/phút).`,
        },
        { status: 429 }
      );
    }

    // 3. Kiểm tra Run tồn tại và trạng thái
    const run = await repository.getRunById(runId);
    if (!run) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Không tìm thấy lượt chạy mô phỏng: ${runId}` },
        { status: 404 }
      );
    }

    // Nguyên tắc Phần 11 & 20: Dữ liệu gửi muộn không được làm hồi sinh lượt đã kết thúc
    if (run.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          error: 'RUN_ALREADY_FINISHED',
          message: `Lượt chạy ${runId} đã ở trạng thái ${run.status}. Không thể tiếp nhận thêm dữ liệu snapshot.`,
        },
        { status: 409 }
      );
    }

    // 4. Phân tích Payload
    const body = await req.json();
    const parsed = SnapshotsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const snapshotsToProcess = 'snapshots' in parsed.data ? parsed.data.snapshots : [parsed.data];
    let totalObjectsSaved = 0;
    let totalStagesSaved = 0;
    let highestSeqProcessed = latestRunSequenceMap.get(runId) ?? 0;

    for (const snap of snapshotsToProcess) {
      // Kiểm tra thứ tự và idempotency
      const seqValidation = validateSnapshotSequence(snap.sequence_number, latestRunSequenceMap.get(runId) ?? null);
      if (seqValidation.isDuplicate) {
        continue; // Bỏ qua trùng lặp an toàn
      }

      // Lưu Stage Metrics
      const stageData = snap.stage_metrics?.map((sm) => ({
        stageCode: sm.stage_code,
        input: sm.input,
        output: sm.output,
        currentWip: sm.current_wip,
        avgWip: sm.avg_wip,
        maxWip: sm.max_wip,
        avgStaytime: sm.avg_staytime,
        processingPct: sm.processing_pct,
      }));

      // Lưu Object Metrics
      const objectData = snap.object_metrics?.map((om) => ({
        flexsimName: om.flexsim_name,
        input: om.input,
        output: om.output,
        currentContent: om.current_content,
        avgContent: om.avg_content,
        maxContent: om.max_content,
        avgStaytime: om.avg_staytime,
        processingPct: om.processing_pct,
        state: om.state,
      }));

      await repository.saveSnapshotBatch(
        runId,
        snap.simulation_time_seconds,
        stageData,
        objectData
      );

      if (stageData) totalStagesSaved += stageData.length;
      if (objectData) totalObjectsSaved += objectData.length;

      // Cập nhật sản lượng thành phẩm Sink nếu có
      if (snap.sink_finished_count !== undefined && snap.sink_finished_count !== null) {
        run.finishedCount = snap.sink_finished_count;
      }

      if (snap.sequence_number > highestSeqProcessed) {
        highestSeqProcessed = snap.sequence_number;
      }
    }

    latestRunSequenceMap.set(runId, highestSeqProcessed);

    return NextResponse.json({
      status: 'ACCEPTED',
      run_id: runId,
      highest_sequence_processed: highestSeqProcessed,
      records_stored: {
        stage_metrics: totalStagesSaved,
        object_metrics: totalObjectsSaved,
      },
      current_finished_count: run.finishedCount,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lỗi khi tiếp nhận snapshot FlexSim:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Lỗi máy chủ khi lưu dữ liệu snapshot.' },
      { status: 500 }
    );
  }
}
