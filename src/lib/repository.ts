import { store } from './data-store';
import { prisma } from './prisma';

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
    return Array.from(store.simulationRuns.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
    for (const u of store.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
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
