import { store } from './data-store';
import { prisma } from './prisma';
import {
  CHOT_REFERENCE_KPIS,
  REFERENCE_CONTROL_CONFIGS,
  generateArrivalSchedule,
} from './line-model-definition';
import {
  WorkerPosition,
  SkillLevel,
  ChecklistStatus,
  TaskChecklistItem,
  INITIAL_WORKFORCE_POSITIONS,
  getInitialSkillMatrix,
  getInitialChecklists,
} from './workforce';
import {
  SafeStockThresholdConfig,
  SafeStockAuditLog,
  validateSafeStockConfig,
} from './safe-stock';

function ensureWorkforceInitialized() {
  if (!store.workforcePositions || store.workforcePositions.size === 0) {
    store.workforcePositions = new Map();
    for (const pos of INITIAL_WORKFORCE_POSITIONS) {
      store.workforcePositions.set(pos.positionCode, { ...pos });
    }
  }
  if (!store.skillMatrix || Object.keys(store.skillMatrix).length === 0) {
    store.skillMatrix = getInitialSkillMatrix();
  }
  if (!store.taskChecklists || store.taskChecklists.size === 0) {
    store.taskChecklists = new Map();
    for (const chk of getInitialChecklists()) {
      store.taskChecklists.set(chk.id, chk);
    }
  }
  if (!store.safeStockThresholds) {
    store.safeStockThresholds = new Map();
    const cd05Threshold: SafeStockThresholdConfig = {
      id: 'cfg_stock_cd05',
      targetCode: 'CD05',
      targetType: 'STAGE',
      minStock: 2,
      safeStockMax: 15,
      criticalStock: 25,
      consecutiveSecondsBeforeAlert: 60,
      scope: 'END_OF_RUN',
      modelVersion: 'v1.0-baseline',
      scenarioCode: 'SCEN_CO_DINH',
      effectiveFrom: '2026-11-14T08:00:00.000Z',
      basisNotes: 'Căn cứ thiết kế mặt bằng đệm trạm CD05 và năng lực giải tỏa của trạm P_CD05B_HOTRO',
      updatedBy: 'admin@vietthanh.vn',
      updatedAt: '2026-11-14T08:00:00.000Z',
    };
    store.safeStockThresholds.set(cd05Threshold.targetCode, cd05Threshold);
  }
  if (!store.safeStockAuditLogs) {
    store.safeStockAuditLogs = new Map();
  }
}

let isPostgresConnected: boolean | null = null;

async function checkPostgres() {
  if (isPostgresConnected !== null) return isPostgresConnected;
  try {
    // Quick ping to check if PostgreSQL is available
    await prisma.$queryRaw`SELECT 1`;
    isPostgresConnected = true;
    return true;
  } catch {
    isPostgresConnected = false;
    return false;
  }
}

export const repository = {
  // Line & Stages
  async getLine(code: string = 'LINE_NHOM_2') {
    for (const line of store.lines.values()) {
      if (line.code === code) return line;
    }
    return Array.from(store.lines.values())[0] || null;
  },

  async getAllStages() {
    return Array.from(store.stages.values()).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  },

  async getAllModelObjects() {
    return Array.from(store.modelObjects.values());
  },

  async getAllWorkers() {
    return Array.from(store.workers.values());
  },

  // Workforce Positions & Assignments
  async getAllWorkforcePositions(): Promise<WorkerPosition[]> {
    ensureWorkforceInitialized();
    return Array.from(store.workforcePositions.values());
  },

  async getWorkforcePositionByCode(code: string): Promise<WorkerPosition | null> {
    ensureWorkforceInitialized();
    return store.workforcePositions.get(code) || null;
  },

  async updateWorkforcePosition(
    code: string,
    data: Partial<WorkerPosition>,
    updatedBy?: string
  ): Promise<WorkerPosition | null> {
    ensureWorkforceInitialized();
    const existing = store.workforcePositions.get(code);
    if (!existing) return null;

    const updated: WorkerPosition = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.workforcePositions.set(code, updated);

    // Đồng bộ sang workers entity
    const worker = store.workers.get(code);
    if (worker) {
      if (data.displayName) worker.name = data.displayName;
      if (data.primaryStation) worker.primaryStation = data.primaryStation;
      if (data.supportStation) worker.secondaryStation = data.supportStation;
      if (data.transferRule) worker.transferRule = data.transferRule;
    }

    await this.logAction('UPDATE_WORKER_POSITION', 'WORKER_POSITION', code, data, updatedBy);
    return updated;
  },

  // Skill Matrix
  async getSkillMatrix(): Promise<Record<string, Record<string, SkillLevel>>> {
    ensureWorkforceInitialized();
    return { ...store.skillMatrix };
  },

  async updateSkill(
    positionCode: string,
    stageCode: string,
    level: SkillLevel,
    updatedBy?: string
  ): Promise<boolean> {
    ensureWorkforceInitialized();
    if (!store.skillMatrix[positionCode]) {
      store.skillMatrix[positionCode] = {};
    }
    store.skillMatrix[positionCode][stageCode] = level;
    await this.logAction(
      'UPDATE_SKILL',
      'WORKER_SKILL',
      `${positionCode}_${stageCode}`,
      { positionCode, stageCode, level },
      updatedBy
    );
    return true;
  },

  // Checklists
  async getAllChecklists(): Promise<TaskChecklistItem[]> {
    ensureWorkforceInitialized();
    return Array.from(store.taskChecklists.values());
  },

  async getChecklistsByPosition(positionCode: string): Promise<TaskChecklistItem[]> {
    ensureWorkforceInitialized();
    return Array.from(store.taskChecklists.values()).filter((c) => c.positionCode === positionCode);
  },

  async updateChecklistStatus(
    id: string,
    status: ChecklistStatus,
    notes?: string,
    updatedBy?: string
  ): Promise<TaskChecklistItem | null> {
    ensureWorkforceInitialized();
    const item = store.taskChecklists.get(id);
    if (!item) return null;

    item.status = status;
    if (notes !== undefined) item.notes = notes;
    item.updatedAt = new Date().toISOString();
    if (updatedBy) item.updatedBy = updatedBy;

    store.taskChecklists.set(id, item);
    await this.logAction('UPDATE_CHECKLIST', 'CHECKLIST_ITEM', id, { status, notes }, updatedBy);
    return item;
  },

  // Safe Stock Thresholds & Governance
  async getAllSafeStockThresholds(): Promise<SafeStockThresholdConfig[]> {
    ensureWorkforceInitialized();
    return Array.from(store.safeStockThresholds.values());
  },

  async getSafeStockThreshold(targetCode: string): Promise<SafeStockThresholdConfig | null> {
    ensureWorkforceInitialized();
    return store.safeStockThresholds.get(targetCode) || null;
  },

  async upsertSafeStockThreshold(
    targetCode: string,
    data: {
      safeStockMax: number;
      minStock?: number | null;
      criticalStock?: number | null;
      consecutiveSecondsBeforeAlert?: number;
      scope?: 'IN_RUN' | 'END_OF_RUN' | 'BOTH';
      targetType?: 'STAGE' | 'QUEUE' | 'PROCESSOR' | 'BUFFER';
      basisNotes?: string;
      changeReason?: string;
    },
    updatedBy: string = 'system'
  ): Promise<{ success: boolean; config?: SafeStockThresholdConfig; error?: string }> {
    ensureWorkforceInitialized();

    const validation = validateSafeStockConfig({
      safeStockMax: data.safeStockMax,
      minStock: data.minStock,
      criticalStock: data.criticalStock,
      consecutiveSecondsBeforeAlert: data.consecutiveSecondsBeforeAlert,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const existing = store.safeStockThresholds.get(targetCode);
    const nowIso = new Date().toISOString();

    const updated: SafeStockThresholdConfig = {
      id: existing?.id || `cfg_stock_${targetCode.toLowerCase()}`,
      targetCode,
      targetType: data.targetType || existing?.targetType || (targetCode.startsWith('Q_') ? 'QUEUE' : 'STAGE'),
      minStock: data.minStock !== undefined ? data.minStock : (existing?.minStock ?? null),
      safeStockMax: data.safeStockMax,
      criticalStock: data.criticalStock !== undefined ? data.criticalStock : (existing?.criticalStock ?? null),
      consecutiveSecondsBeforeAlert: data.consecutiveSecondsBeforeAlert ?? existing?.consecutiveSecondsBeforeAlert ?? 60,
      scope: data.scope || existing?.scope || 'END_OF_RUN',
      modelVersion: existing?.modelVersion || 'v1.0-baseline',
      scenarioCode: existing?.scenarioCode || 'SCEN_CO_DINH',
      effectiveFrom: nowIso,
      basisNotes: data.basisNotes !== undefined ? data.basisNotes : (existing?.basisNotes || ''),
      updatedBy,
      updatedAt: nowIso,
    };

    store.safeStockThresholds.set(targetCode, updated);

    // Lưu lịch sử thay đổi (Audit Log)
    const auditLog: SafeStockAuditLog = {
      id: `audit_stock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetCode,
      previousConfigJson: existing ? JSON.stringify(existing) : null,
      newConfigJson: JSON.stringify(updated),
      changeReason: data.changeReason || 'Cập nhật cấu hình ngưỡng tồn an toàn',
      updatedBy,
      changedAt: nowIso,
    };
    store.safeStockAuditLogs.set(auditLog.id, auditLog);

    await this.logAction(
      existing ? 'UPDATE_SAFE_STOCK_THRESHOLD' : 'CREATE_SAFE_STOCK_THRESHOLD',
      'SAFE_STOCK_THRESHOLD',
      targetCode,
      { previous: existing, current: updated, reason: data.changeReason },
      updatedBy
    );

    return { success: true, config: updated };
  },

  async deleteSafeStockThreshold(
    targetCode: string,
    changeReason: string = 'Xóa cấu hình ngưỡng, chuyển về trạng thái Chưa cấu hình',
    updatedBy: string = 'system'
  ): Promise<boolean> {
    ensureWorkforceInitialized();
    const existing = store.safeStockThresholds.get(targetCode);
    if (!existing) return false;

    store.safeStockThresholds.delete(targetCode);
    const nowIso = new Date().toISOString();

    const auditLog: SafeStockAuditLog = {
      id: `audit_stock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetCode,
      previousConfigJson: JSON.stringify(existing),
      newConfigJson: null,
      changeReason,
      updatedBy,
      changedAt: nowIso,
    };
    store.safeStockAuditLogs.set(auditLog.id, auditLog);

    await this.logAction('DELETE_SAFE_STOCK_THRESHOLD', 'SAFE_STOCK_THRESHOLD', targetCode, { reason: changeReason }, updatedBy);
    return true;
  },

  async getAllSafeStockAuditLogs(): Promise<SafeStockAuditLog[]> {
    ensureWorkforceInitialized();
    return Array.from(store.safeStockAuditLogs.values()).sort(
      (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );
  },

  async getSafeStockAuditLogsByTarget(targetCode: string): Promise<SafeStockAuditLog[]> {
    ensureWorkforceInitialized();
    return Array.from(store.safeStockAuditLogs.values())
      .filter((log) => log.targetCode === targetCode)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  },

  // Scenarios
  async getAllScenarios() {
    return Array.from(store.scenarios.values());
  },

  async getScenarioById(id: string) {
    return store.scenarios.get(id) || null;
  },

  async createScenario(data: {
    lineId: string;
    code: string;
    name: string;
    description?: string;
    isBaseline?: boolean;
    processTimeFactor?: number;
    assumptionsBasis?: string;
  }) {
    const id = `scen_${Date.now()}`;
    const newScen = {
      id,
      lineId: data.lineId,
      modelVersionId: 'mv_v1_baseline',
      code: data.code,
      name: data.name,
      description: data.description,
      isBaseline: data.isBaseline ?? false,
      createdAt: new Date().toISOString(),
      configuration: {
        processTimeFactor: data.processTimeFactor ?? 1.0,
        assumptionsBasis: data.assumptionsBasis,
      },
    };
    store.scenarios.set(id, newScen);
    return newScen;
  },

  // Simulation Runs
  async getAllRuns() {
    const list = Array.from(store.simulationRuns.values());
    return list.sort((a, b) => {
      // Ưu tiên lượt tham chiếu đã chốt (RUN_CHOT_5427) lên đầu tiên làm mặc định
      const isAChot = a.id === 'run_chot_5427' || a.runCode === 'RUN_CHOT_5427';
      const isBChot = b.id === 'run_chot_5427' || b.runCode === 'RUN_CHOT_5427';
      if (isAChot && !isBChot) return -1;
      if (!isAChot && isBChot) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async getRunById(id: string) {
    return store.simulationRuns.get(id) || null;
  },

  async createRun(data: {
    scenarioId: string;
    runCode: string;
    replicationIndex?: number;
    randomSeed?: number;
    runTimeSeconds?: number;
    warmupSeconds?: number;
    dataSource?: 'SIMULATION' | 'ACTUAL' | 'PLAN' | 'MEASURED' | 'ASSUMPTION' | 'TEST_SIMULATION';
    sourceDescription?: string;
    targetCount?: number;
  }) {
    const id = `run_${Date.now()}`;
    const newRun = {
      id,
      scenarioId: data.scenarioId,
      modelVersionId: 'mv_v1_baseline',
      runCode: data.runCode,
      replicationIndex: data.replicationIndex ?? 1,
      randomSeed: data.randomSeed,
      runTimeSeconds: data.runTimeSeconds ?? 171000,
      warmupSeconds: data.warmupSeconds,
      status: 'IN_PROGRESS' as const,
      dataSource: data.dataSource ?? 'SIMULATION',
      sourceDescription: data.sourceDescription,
      finishedCount: 0,
      targetCount: data.targetCount ?? 5500,
      isLineCleared: null,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.simulationRuns.set(id, newRun);
    return newRun;
  },

  async finishRun(
    id: string,
    finishedCount: number,
    status: 'COMPLETED' | 'STOPPED_EARLY' | 'ERROR' | 'RESET' = 'COMPLETED'
  ) {
    const run = store.simulationRuns.get(id);
    if (!run) return null;
    run.finishedCount = finishedCount;
    run.status = status;
    run.finishedAt = new Date().toISOString();
    store.simulationRuns.set(id, run);
    return run;
  },

  // Metrics
  async getStageMetricsByRunId(runId: string) {
    return Array.from(store.stageMetrics.values()).filter((m) => m.runId === runId);
  },

  async getObjectMetricsByRunId(runId: string) {
    return Array.from(store.objectMetrics.values()).filter((m) => m.runId === runId);
  },

  async saveSnapshotBatch(
    runId: string,
    simulationTimeSeconds: number,
    stageMetricsData?: {
      stageCode: string;
      input?: number;
      output?: number;
      currentWip?: number;
      avgWip?: number;
      maxWip?: number;
      avgStaytime?: number;
      processingPct?: number;
    }[],
    objectMetricsData?: {
      flexsimName: string;
      input?: number;
      output?: number;
      currentContent?: number;
      avgContent?: number;
      maxContent?: number;
      avgStaytime?: number;
      processingPct?: number;
      state?: string;
    }[]
  ) {
    const timestamp = new Date().toISOString();

    if (stageMetricsData) {
      for (const sm of stageMetricsData) {
        const code = (sm.stageCode || (sm as any).stage_code || '').trim();
        if (!code) continue;
        const id = `sm_${runId}_${code}_${Date.now()}`;
        store.stageMetrics.set(id, {
          id,
          runId,
          stageId: `stg_${code.toLowerCase()}`,
          stageCode: code,
          inputCount: sm.input ?? (sm as any).input_count ?? null,
          outputCount: sm.output ?? (sm as any).output_count ?? null,
          currentWip: sm.currentWip ?? (sm as any).current_wip ?? null,
          avgWip: sm.avgWip ?? (sm as any).avg_wip ?? null,
          maxWip: sm.maxWip ?? (sm as any).max_wip ?? null,
          avgStaytime: sm.avgStaytime ?? (sm as any).avg_staytime ?? null,
          processingPct: sm.processingPct ?? (sm as any).processing_pct ?? null,
          simulationTimeSeconds,
          capturedAt: timestamp,
        });
      }
    }

    if (objectMetricsData) {
      for (const om of objectMetricsData) {
        const name = (om.flexsimName || (om as any).flexsim_name || '').trim();
        if (!name) continue;
        const id = `om_${runId}_${name}_${Date.now()}`;
        store.objectMetrics.set(id, {
          id,
          runId,
          modelObjectId: `obj_${name.toLowerCase()}`,
          flexsimName: name,
          inputCount: om.input ?? (om as any).input_count ?? null,
          outputCount: om.output ?? (om as any).output_count ?? null,
          currentContent: om.currentContent ?? (om as any).current_content ?? null,
          avgContent: om.avgContent ?? (om as any).avg_content ?? null,
          maxContent: om.maxContent ?? (om as any).max_content ?? null,
          avgStaytime: om.avgStaytime ?? (om as any).avg_staytime ?? null,
          processingPct: om.processingPct ?? (om as any).processing_pct ?? null,
          stateAtSample: om.state ?? (om as any).state_at_sample ?? null,
          simulationTimeSeconds,
          capturedAt: timestamp,
        });
      }
    }
  },

  // Production Plans
  async getActivePlan() {
    for (const p of store.plans.values()) {
      if (p.status === 'ACTIVE') return p;
    }
    return Array.from(store.plans.values())[0] || null;
  },

  // Integration Clients
  async getClientByTokenHash(tokenHash: string) {
    for (const c of store.integrationClients.values()) {
      if (c.tokenHash === tokenHash && c.isActive) return c;
    }
    return null;
  },

  async getAllClients() {
    return Array.from(store.integrationClients.values());
  },

  async createIntegrationClient(clientName: string, tokenHash: string, tokenPrefix: string) {
    const id = `client_${Date.now()}`;
    const newClient = {
      id,
      clientName,
      tokenHash,
      tokenPrefix,
      permissionsJson: JSON.stringify({ lineCode: 'LINE_NHOM_2', canIngest: true }),
      rateLimitPerMin: 120,
      isActive: true,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };
    store.integrationClients.set(id, newClient);
    return newClient;
  },

  async revokeClient(id: string) {
    const client = store.integrationClients.get(id);
    if (!client) return false;
    client.isActive = false;
    store.integrationClients.set(id, client);
    return true;
  },

  // Users
  async getUserByEmail(email: string) {
    return this.getUserByIdentifier(email);
  },

  async getUserByIdentifier(identifier: string) {
    if (!identifier) return null;
    const raw = identifier.trim().toLowerCase();
    for (const u of store.users.values()) {
      if (
        u.email.toLowerCase() === raw ||
        (u.username && u.username.toLowerCase() === raw) ||
        u.email.toLowerCase().split('@')[0] === raw
      ) {
        return u;
      }
    }
    return null;
  },

  async getAllUsers() {
    return Array.from(store.users.values()).map(({ passwordHash: _, ...rest }) => rest);
  },

  // Audits & Imports
  async getLatestAudit(runId: string) {
    for (const a of store.inventoryAudits.values()) {
      if (a.runId === runId) return a;
    }
    return null;
  },

  async saveInventoryAudit(audit: Omit<typeof store.inventoryAudits extends Map<string, infer T> ? T : never, 'id'>) {
    const id = `audit_${Date.now()}`;
    const fullAudit = { ...audit, id };
    store.inventoryAudits.set(id, fullAudit);
    return fullAudit;
  },

  async getAllImportJobs() {
    return Array.from(store.importJobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createImportJob(job: Omit<typeof store.importJobs extends Map<string, infer T> ? T : never, 'id'>) {
    const id = `imp_${Date.now()}`;
    const fullJob = { ...job, id };
    store.importJobs.set(id, fullJob);
    return fullJob;
  },

  // Cấu hình tham chiếu và lịch cấp liệu (Mục 4, 8, 10)
  async getChotReferenceKpis() {
    return CHOT_REFERENCE_KPIS;
  },

  async getControlConfigs() {
    return REFERENCE_CONTROL_CONFIGS;
  },

  async getArrivalSchedule(sourceName?: string) {
    return generateArrivalSchedule(sourceName);
  },

  // Audit Logs
  async logAction(action: string, entityType: string, entityId?: string, details?: unknown, userId?: string) {
    const id = `log_${Date.now()}`;
    const entry = {
      id,
      userId,
      action,
      entityType,
      entityId,
      detailsJson: details ? JSON.stringify(details) : undefined,
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.set(id, entry);
    return entry;
  },

  async getRecentAuditLogs(limit: number = 50) {
    return Array.from(store.auditLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },
};
