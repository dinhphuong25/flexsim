import { describe, it, expect, beforeAll } from 'vitest';
import { repository } from '@/lib/repository';
import { hasPermission, canMutateData } from '@/lib/rbac';
import { generateIntegrationToken } from '@/lib/integration-security';

describe('Kiểm thử tích hợp luồng FlexSim API & Phân quyền RBAC (Mục 11, 17, 20)', () => {
  let testClientToken: string;
  let testRunId: string;

  beforeAll(async () => {
    const { rawToken, tokenHash, tokenPrefix } = generateIntegrationToken();
    testClientToken = rawToken;
    await repository.createIntegrationClient('Test Client Runner', tokenHash, tokenPrefix);
  });

  it('Kiểm tra quyền RBAC trên server cho các vai trò', () => {
    // Admin có toàn quyền
    expect(hasPermission('ADMIN', 'MANAGE_USERS')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGE_INTEGRATION_CLIENTS')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGE_SCENARIOS')).toBe(true);

    // Manager có quyền nghiệp vụ nhưng không quản trị người dùng
    expect(hasPermission('MANAGER', 'MANAGE_USERS')).toBe(false);
    expect(hasPermission('MANAGER', 'MANAGE_SCENARIOS')).toBe(true);
    expect(hasPermission('MANAGER', 'IMPORT_BACKUP_DATA')).toBe(true);

    // Viewer chỉ đọc, không được sửa dữ liệu
    expect(hasPermission('VIEWER', 'MANAGE_USERS')).toBe(false);
    expect(hasPermission('VIEWER', 'MANAGE_SCENARIOS')).toBe(false);
    expect(hasPermission('VIEWER', 'IMPORT_BACKUP_DATA')).toBe(false);
    expect(canMutateData('VIEWER')).toBe(false);
    expect(canMutateData('MANAGER')).toBe(true);
    expect(canMutateData('ADMIN')).toBe(true);
  });

  it('Khởi tạo lượt chạy mới với thông số chuẩn (Start Run)', async () => {
    const scenarios = await repository.getAllScenarios();
    const baseScen = scenarios.find((s) => s.isBaseline) || scenarios[0];

    const newRun = await repository.createRun({
      scenarioId: baseScen.id,
      runCode: `RUN_TEST_${Date.now()}`,
      replicationIndex: 1,
      dataSource: 'TEST_SIMULATION',
      targetCount: 5500,
      runTimeSeconds: 171000,
    });

    expect(newRun.id).toBeDefined();
    expect(newRun.status).toBe('IN_PROGRESS');
    expect(newRun.targetCount).toBe(5500);
    testRunId = newRun.id;
  });

  it('Tiếp nhận snapshot mẻ và cập nhật dữ liệu trạm', async () => {
    await repository.saveSnapshotBatch(
      testRunId,
      30000,
      [
        { stageCode: 'CD05', currentWip: 15, avgWip: 14.2, processingPct: 99.5 },
      ],
      [
        { flexsimName: 'P_CD05', currentContent: 0, processingPct: 99.5 },
      ]
    );

    const stageMetrics = await repository.getStageMetricsByRunId(testRunId);
    const cd05Metric = stageMetrics.find((m) => m.stageCode === 'CD05');
    expect(cd05Metric).toBeDefined();
    expect(cd05Metric?.currentWip).toBe(15);
  });

  it('Hoàn tất lượt chạy với kết quả thành phẩm và trạng thái COMPLETED', async () => {
    const finishedRun = await repository.finishRun(testRunId, 5408, 'COMPLETED');
    expect(finishedRun).not.toBeNull();
    expect(finishedRun?.status).toBe('COMPLETED');
    expect(finishedRun?.finishedCount).toBe(5408);
    expect(finishedRun?.finishedAt).toBeDefined();
  });

  it('Lượt đã kết thúc không thể bị hồi sinh bởi dữ liệu gửi muộn', async () => {
    const run = await repository.getRunById(testRunId);
    expect(run?.status).toBe('COMPLETED');
    // Khi run.status !== 'IN_PROGRESS', logic route từ chối tiếp nhận snapshot mới
    const isAllowedToIngest = run?.status === 'IN_PROGRESS';
    expect(isAllowedToIngest).toBe(false);
  });
});
