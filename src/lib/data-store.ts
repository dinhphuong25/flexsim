import {
  BASELINE_PRODUCTION_LINE,
  STAGE_DEFINITIONS,
  FLOATING_WORKERS,
  REFERENCE_SEED_METRICS,
  BranchType,
  ObjectType,
} from './line-model-definition';
import { UserRole } from './rbac';
import { hashIntegrationToken } from './integration-security';
import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ProductionLineEntity {
  id: string;
  code: string;
  name: string;
  company: string;
  targetOutput: number;
  runTimeSeconds: number;
  plannedWorkers: number;
  description?: string;
  createdAt: string;
}

export interface StageEntity {
  id: string;
  lineId: string;
  stageCode: string;
  name: string;
  branch: BranchType;
  sequenceOrder: number;
  parallelStationCount: number;
  standardProcessTime?: number;
  notes?: string;
}

export interface ModelObjectEntity {
  id: string;
  modelVersionId: string;
  stageId?: string;
  flexsimName: string;
  objectType: ObjectType;
  branch?: BranchType;
  isInventoryAudited: boolean;
  isActive: boolean;
  capacity?: number;
  description?: string;
  notes?: string;
}

export interface WorkerResourceEntity {
  id: string;
  lineId: string;
  workerCode: string;
  name: string;
  isFloating: boolean;
  primaryStation?: string;
  secondaryStation?: string;
  transferRule?: string;
}

export interface ScenarioEntity {
  id: string;
  lineId: string;
  modelVersionId: string;
  code: string;
  name: string;
  description?: string;
  isBaseline: boolean;
  createdById?: string;
  createdAt: string;
  configuration: {
    processTimeFactor: number;
    processTimeDistribution?: string;
    transferThreshold?: number;
    queueCapacitiesJson?: string;
    materialReleaseScheduleJson?: string;
    assumptionsBasis?: string;
  };
}

export interface SimulationRunEntity {
  id: string;
  scenarioId: string;
  modelVersionId: string;
  runCode: string;
  replicationIndex?: number;
  randomSeed?: number;
  runTimeSeconds: number;
  warmupSeconds?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED_EARLY' | 'ERROR' | 'RESET';
  dataSource: 'SIMULATION' | 'ACTUAL' | 'PLAN' | 'MEASURED' | 'ASSUMPTION' | 'TEST_SIMULATION';
  sourceDescription?: string;
  finishedCount: number | null;
  targetCount: number;
  isLineCleared?: boolean | null;
  startedAt: string;
  finishedAt?: string | null;
  createdById?: string;
  createdAt: string;
}

export interface StageMetricEntity {
  id: string;
  runId: string;
  stageId: string;
  stageCode: string;
  inputCount: number | null;
  outputCount: number | null;
  currentWip: number | null;
  avgWip: number | null;
  maxWip: number | null;
  avgStaytime: number | null;
  processingPct: number | null;
  bottleneckScore?: number | null;
  simulationTimeSeconds: number;
  capturedAt: string;
}

export interface ObjectMetricEntity {
  id: string;
  runId: string;
  modelObjectId: string;
  flexsimName: string;
  inputCount: number | null;
  outputCount: number | null;
  currentContent: number | null;
  avgContent: number | null;
  maxContent: number | null;
  avgStaytime: number | null;
  processingPct: number | null;
  idlePct?: number | null;
  blockedPct?: number | null;
  stateAtSample?: string | null;
  simulationTimeSeconds: number;
  capturedAt: string;
}

export interface TimeSeriesMetricEntity {
  id: string;
  runId: string;
  targetType: 'OBJECT' | 'STAGE';
  targetId: string;
  metricName: string;
  metricValue: number;
  simulationTimeSeconds: number;
  capturedAt: string;
}

export interface ProductionPlanEntity {
  id: string;
  lineId: string;
  planCode: string;
  targetOutput: number;
  plannedRunTime: number;
  totalPlannedWorkers: number;
  fixedWorkers: number;
  floatingWorkers: number;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  materialReleases: {
    id: string;
    branch: BranchType;
    sourceName: string;
    plannedQuantity: number;
    generatedQuantity: number | null;
    releasedQuantity: number | null;
    heldQuantity: number | null;
    completedQuantity: number | null;
    isReleaseCompleted: boolean;
  }[];
}

export interface IntegrationClientEntity {
  id: string;
  clientName: string;
  tokenHash: string;
  tokenPrefix: string;
  permissionsJson: string;
  rateLimitPerMin: number;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface IngestionBatchEntity {
  id: string;
  clientId: string;
  runId: string;
  sequenceNumber: number;
  clientTimestamp?: string;
  receivedAt: string;
  recordCount: number;
  status: 'ACCEPTED' | 'DUPLICATE' | 'REJECTED' | 'ERROR';
  errorMessage?: string;
}

export interface InventoryAuditEntity {
  id: string;
  runId: string;
  auditTimestamp: string;
  simulationTimeSeconds: number;
  conclusion: 'CON_TON' | 'HET_TON_TRONG_PHAM_VI' | 'CHUA_DU_DU_LIEU' | 'HET_TON_TOAN_CHUYEN';
  totalScopeItems: number;
  totalRemainingWip: number;
  isMaterialReleaseComplete: boolean;
  isTransportCleared: boolean;
  inspectedScopeSummary?: string;
  notes?: string;
  auditedBy?: string;
  items: {
    id: string;
    objectName: string;
    objectType: string;
    branch?: string;
    currentContent: number | null;
    isAudited: boolean;
    status: 'EMPTY' | 'HAS_WIP' | 'MISSING_DATA';
    notes?: string;
  }[];
}

export interface ImportJobEntity {
  id: string;
  fileName: string;
  fileType: 'CSV' | 'XLSX';
  fileSize: number;
  targetTable: string;
  recordCount: number;
  successCount: number;
  errorCount: number;
  status: 'PENDING' | 'PREVIEWED' | 'COMPLETED' | 'FAILED';
  importedBy?: string;
  createdAt: string;
  errors: {
    rowNumber: number;
    columnName?: string;
    rawValue?: string;
    errorMessage: string;
  }[];
}

export interface AuditLogEntity {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  detailsJson?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// In-Memory Global Store Instance (Persistent across HMR in dev)
class DataStore {
  private initialized = false;

  public users: Map<string, UserEntity> = new Map();
  public lines: Map<string, ProductionLineEntity> = new Map();
  public stages: Map<string, StageEntity> = new Map();
  public modelObjects: Map<string, ModelObjectEntity> = new Map();
  public workers: Map<string, WorkerResourceEntity> = new Map();
  public scenarios: Map<string, ScenarioEntity> = new Map();
  public simulationRuns: Map<string, SimulationRunEntity> = new Map();
  public stageMetrics: Map<string, StageMetricEntity> = new Map();
  public objectMetrics: Map<string, ObjectMetricEntity> = new Map();
  public timeSeriesMetrics: Map<string, TimeSeriesMetricEntity> = new Map();
  public plans: Map<string, ProductionPlanEntity> = new Map();
  public integrationClients: Map<string, IntegrationClientEntity> = new Map();
  public ingestionBatches: Map<string, IngestionBatchEntity> = new Map();
  public inventoryAudits: Map<string, InventoryAuditEntity> = new Map();
  public importJobs: Map<string, ImportJobEntity> = new Map();
  public auditLogs: Map<string, AuditLogEntity> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public seedInitialData() {
    if (this.initialized) return;

    // 1. Initial Users (Admin, Manager, Viewer)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@VietThanh2026!ChangeMe', adminSalt);
    const managerHash = bcrypt.hashSync('Manager@VietThanh2026', adminSalt);
    const viewerHash = bcrypt.hashSync('Viewer@VietThanh2026', adminSalt);

    const adminUser: UserEntity = {
      id: 'usr_admin_01',
      email: 'admin@vietthanh.vn',
      passwordHash: adminHash,
      fullName: 'Quản Trị Viên Hệ Thống',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    const managerUser: UserEntity = {
      id: 'usr_manager_01',
      email: 'manager@vietthanh.vn',
      passwordHash: managerHash,
      fullName: 'Quản Đốc Chuyền May',
      role: 'MANAGER',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    const viewerUser: UserEntity = {
      id: 'usr_viewer_01',
      email: 'viewer@vietthanh.vn',
      passwordHash: viewerHash,
      fullName: 'Nhân Viên Giám Sát',
      role: 'VIEWER',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(managerUser.id, managerUser);
    this.users.set(viewerUser.id, viewerUser);

    // 2. Production Line
    const lineId = 'line_nhom_2';
    const line: ProductionLineEntity = {
      id: lineId,
      code: BASELINE_PRODUCTION_LINE.code,
      name: BASELINE_PRODUCTION_LINE.name,
      company: BASELINE_PRODUCTION_LINE.company,
      targetOutput: BASELINE_PRODUCTION_LINE.targetOutput,
      runTimeSeconds: BASELINE_PRODUCTION_LINE.runTimeSeconds,
      plannedWorkers: BASELINE_PRODUCTION_LINE.totalPlannedWorkers,
      description: 'Chuyền sản xuất may quần dài và sooc trẻ em nữ xuất khẩu Nhóm 2',
      createdAt: '2026-11-14T08:00:00.000Z',
    };
    this.lines.set(line.id, line);

    // 3. Stages (27 stages + Combiners + Sink)
    for (const s of STAGE_DEFINITIONS) {
      const stageEntity: StageEntity = {
        id: `stg_${s.stageCode.toLowerCase()}`,
        lineId: lineId,
        stageCode: s.stageCode,
        name: s.name,
        branch: s.branch,
        sequenceOrder: s.sequenceOrder,
        parallelStationCount: s.parallelStationCount,
        standardProcessTime: s.standardProcessTime,
        notes: s.notes,
      };
      this.stages.set(stageEntity.id, stageEntity);
    }

    // 4. Model Objects in FlexSim
    const modelVersionId = 'mv_v1_baseline';

    // Sources
    const sources = [
      { name: 'SRC_TT', branch: 'FRONT_BODY' as BranchType, desc: 'Cấp vải thân trước' },
      { name: 'SRC_TS', branch: 'BACK_BODY' as BranchType, desc: 'Cấp vải thân sau' },
      { name: 'SRC_LUNG', branch: 'WAISTBAND' as BranchType, desc: 'Cấp vải cạp lưng' },
      { name: 'SRC_PAGET', branch: 'PAGET' as BranchType, desc: 'Cấp nẹp/viền Paget' },
    ];
    for (const src of sources) {
      this.modelObjects.set(src.name, {
        id: `obj_${src.name.toLowerCase()}`,
        modelVersionId,
        flexsimName: src.name,
        objectType: 'SOURCE',
        branch: src.branch,
        isInventoryAudited: true,
        isActive: true,
        description: src.desc,
      });
    }

    // Queues and Processors
    for (const stg of STAGE_DEFINITIONS) {
      if (stg.stageCode.startsWith('CD')) {
        const qName = `Q_${stg.stageCode}`;
        this.modelObjects.set(qName, {
          id: `obj_${qName.toLowerCase()}`,
          modelVersionId,
          stageId: `stg_${stg.stageCode.toLowerCase()}`,
          flexsimName: qName,
          objectType: 'QUEUE',
          branch: stg.branch,
          isInventoryAudited: true,
          isActive: true,
          capacity: 50,
          description: `Hàng chờ trước công đoạn ${stg.stageCode}`,
        });

        if (stg.parallelStationCount === 2) {
          const pA = `P_${stg.stageCode}A`;
          const pB = `P_${stg.stageCode}B`;
          this.modelObjects.set(pA, {
            id: `obj_${pA.toLowerCase()}`,
            modelVersionId,
            stageId: `stg_${stg.stageCode.toLowerCase()}`,
            flexsimName: pA,
            objectType: 'PROCESSOR',
            branch: stg.branch,
            isInventoryAudited: true,
            isActive: true,
            description: `Máy gia công trạm A - ${stg.name}`,
          });
          this.modelObjects.set(pB, {
            id: `obj_${pB.toLowerCase()}`,
            modelVersionId,
            stageId: `stg_${stg.stageCode.toLowerCase()}`,
            flexsimName: pB,
            objectType: 'PROCESSOR',
            branch: stg.branch,
            isInventoryAudited: true,
            isActive: true,
            description: `Máy gia công trạm B - ${stg.name}`,
          });
        } else {
          const pName = `P_${stg.stageCode}`;
          this.modelObjects.set(pName, {
            id: `obj_${pName.toLowerCase()}`,
            modelVersionId,
            stageId: `stg_${stg.stageCode.toLowerCase()}`,
            flexsimName: pName,
            objectType: 'PROCESSOR',
            branch: stg.branch,
            isInventoryAudited: true,
            isActive: true,
            description: `Máy gia công chính - ${stg.name}`,
          });
        }

        if (stg.hasSupportStation && stg.supportStationName) {
          this.modelObjects.set(stg.supportStationName, {
            id: `obj_${stg.supportStationName.toLowerCase()}`,
            modelVersionId,
            stageId: `stg_${stg.stageCode.toLowerCase()}`,
            flexsimName: stg.supportStationName,
            objectType: 'PROCESSOR',
            branch: stg.branch,
            isInventoryAudited: true,
            isActive: true,
            description: `Trạm hỗ trợ bán tự động - ${stg.name}`,
          });
        }
      } else if (stg.stageCode.startsWith('R')) {
        this.modelObjects.set(stg.stageCode, {
          id: `obj_${stg.stageCode.toLowerCase()}`,
          modelVersionId,
          stageId: `stg_${stg.stageCode.toLowerCase()}`,
          flexsimName: stg.stageCode,
          objectType: 'COMBINER',
          branch: stg.branch,
          isInventoryAudited: true,
          isActive: true,
          description: stg.name,
        });
      } else if (stg.stageCode === 'SINK_TP') {
        this.modelObjects.set('SINK_TP', {
          id: 'obj_sink_tp',
          modelVersionId,
          stageId: 'stg_sink_tp',
          flexsimName: 'SINK_TP',
          objectType: 'SINK',
          branch: stg.branch,
          isInventoryAudited: false, // Sink does not hold inventory
          isActive: true,
          description: 'Sink tiếp nhận thành phẩm cuối chuyền',
        });
      }
    }

    // Special Queue: Q_R02_CHINH
    this.modelObjects.set('Q_R02_CHINH', {
      id: 'obj_q_r02_chinh',
      modelVersionId,
      flexsimName: 'Q_R02_CHINH',
      objectType: 'QUEUE',
      branch: 'POST_R01',
      isInventoryAudited: true,
      isActive: true,
      capacity: 40,
      description: 'Hàng chờ chính dẫn vào điểm ráp R02',
    });

    // 5. Workers: 34 total (30 fixed + 4 floating)
    for (let i = 1; i <= 30; i++) {
      const pad = String(i).padStart(2, '0');
      const code = `OP_${pad}`;
      this.workers.set(code, {
        id: `wrk_${code.toLowerCase()}`,
        lineId,
        workerCode: code,
        name: `Công nhân may ${pad} (Cố định)`,
        isFloating: false,
        primaryStation: `P_CD${pad}`,
      });
    }

    for (const fw of FLOATING_WORKERS) {
      this.workers.set(fw.workerCode, {
        id: `wrk_${fw.workerCode.toLowerCase()}`,
        lineId,
        workerCode: fw.workerCode,
        name: fw.name,
        isFloating: true,
        primaryStation: fw.stationA,
        secondaryStation: fw.stationB,
        transferRule: fw.transferRule,
      });
    }

    // 6. Scenarios: Baseline & Improvement
    const baseScenario: ScenarioEntity = {
      id: 'scen_baseline_01',
      lineId,
      modelVersionId,
      code: 'SCEN_CO_DINH',
      name: 'Phương án đối chứng (Hiện trạng gốc)',
      description: 'Phương án chạy cơ sở với 34 công nhân (30 cố định + 4 điều chuyển theo quy tắc ban đầu)',
      isBaseline: true,
      createdAt: '2026-11-14T08:00:00.000Z',
      configuration: {
        processTimeFactor: 1.0,
        assumptionsBasis: 'Chuẩn thời gian thao tác đo bấm giờ thực tế ngày 14/11/2026',
      },
    };

    const impScenario: ScenarioEntity = {
      id: 'scen_improved_01',
      lineId,
      modelVersionId,
      code: 'SCEN_CAI_TIEN_01',
      name: 'Phương án Cải tiến 1 - Tối ưu trạm CD05 & CD11',
      description: 'Giảm 15% thời gian gia công CD05 bằng cữ gá dưỡng (hệ số 0.85) và điều chỉnh ngưỡng chuyển người hỗ trợ.',
      isBaseline: false,
      createdAt: '2026-11-14T10:00:00.000Z',
      configuration: {
        processTimeFactor: 0.85, // 85% of base time = 15% reduction
        transferThreshold: 15,
        assumptionsBasis: 'Lắp đặt cữ định vị tự động tại CD05 và bàn ủi nhiệt CD10 theo đề án Kaizen',
      },
    };

    this.scenarios.set(baseScenario.id, baseScenario);
    this.scenarios.set(impScenario.id, impScenario);

    // 7. Initial Seed Run: Exactly from Section 18
    // "Đối chiếu ảnh kết quả mô phỏng người dùng ngày 14/11/2026"
    // Finished: 5408, Target: 5500, RunTime: 171000s, Workers: 34
    const seedRunId = 'run_ref_20261114_01';
    const seedRun: SimulationRunEntity = {
      id: seedRunId,
      scenarioId: baseScenario.id,
      modelVersionId,
      runCode: 'RUN_REF_141126',
      replicationIndex: 1,
      randomSeed: undefined, // Chưa biết -> null/undefined theo Section 18
      runTimeSeconds: REFERENCE_SEED_METRICS.runTimeSeconds,
      warmupSeconds: undefined,
      status: 'COMPLETED',
      dataSource: 'MEASURED',
      sourceDescription: REFERENCE_SEED_METRICS.sourceDescription,
      finishedCount: REFERENCE_SEED_METRICS.finishedCount,
      targetCount: REFERENCE_SEED_METRICS.targetCount,
      isLineCleared: false, // Còn tồn tại CD05
      startedAt: '2026-11-14T08:00:00.000Z',
      finishedAt: '2026-11-14T10:45:00.000Z',
      createdAt: '2026-11-14T10:45:00.000Z',
    };
    this.simulationRuns.set(seedRun.id, seedRun);

    // Stage Metrics for Seed Run (Only specified stages have data; others remain null)
    for (const [stgCode, m] of Object.entries(REFERENCE_SEED_METRICS.stageMetrics)) {
      const metricId = `sm_${seedRunId}_${stgCode}`;
      this.stageMetrics.set(metricId, {
        id: metricId,
        runId: seedRunId,
        stageId: `stg_${stgCode.toLowerCase()}`,
        stageCode: stgCode,
        inputCount: null,
        outputCount: null,
        currentWip: m.currentWip,
        avgWip: m.avgWip,
        maxWip: m.maxWip,
        avgStaytime: m.avgStaytime,
        processingPct: m.processingPct,
        simulationTimeSeconds: 171000,
        capturedAt: '2026-11-14T10:45:00.000Z',
      });
    }

    // Object Metrics for Seed Run: P_CD05B_HOTRO
    for (const [objName, m] of Object.entries(REFERENCE_SEED_METRICS.objectMetrics)) {
      const omId = `om_${seedRunId}_${objName}`;
      this.objectMetrics.set(omId, {
        id: omId,
        runId: seedRunId,
        modelObjectId: `obj_${objName.toLowerCase()}`,
        flexsimName: objName,
        inputCount: null,
        outputCount: m.outputCount,
        currentContent: null,
        avgContent: null,
        maxContent: null,
        avgStaytime: null,
        processingPct: m.processingPct,
        simulationTimeSeconds: 171000,
        capturedAt: '2026-11-14T10:45:00.000Z',
      });
    }

    // 8. Production Plan
    const plan: ProductionPlanEntity = {
      id: 'plan_q4_2026',
      lineId,
      planCode: 'KE_HOACH_THANG_11',
      targetOutput: 5500,
      plannedRunTime: 171000,
      totalPlannedWorkers: 34,
      fixedWorkers: 30,
      floatingWorkers: 4,
      startDate: '2026-11-14T00:00:00.000Z',
      endDate: '2026-11-20T23:59:59.000Z',
      status: 'ACTIVE',
      notes: 'Kế hoạch may đơn hàng Quần sooc nữ trẻ em xuất khẩu Hàn Quốc - Lô 5.500 cái',
      createdAt: '2026-11-14T07:30:00.000Z',
      materialReleases: [
        {
          id: 'mr_tt',
          branch: 'FRONT_BODY',
          sourceName: 'SRC_TT',
          plannedQuantity: 5500,
          generatedQuantity: 5500,
          releasedQuantity: 5500,
          heldQuantity: 0,
          completedQuantity: 5408,
          isReleaseCompleted: true,
        },
        {
          id: 'mr_ts',
          branch: 'BACK_BODY',
          sourceName: 'SRC_TS',
          plannedQuantity: 5500,
          generatedQuantity: 5500,
          releasedQuantity: 5500,
          heldQuantity: 0,
          completedQuantity: 5408,
          isReleaseCompleted: true,
        },
        {
          id: 'mr_lung',
          branch: 'WAISTBAND',
          sourceName: 'SRC_LUNG',
          plannedQuantity: 5500,
          generatedQuantity: 5500,
          releasedQuantity: 5500,
          heldQuantity: 0,
          completedQuantity: 5408,
          isReleaseCompleted: true,
        },
        {
          id: 'mr_paget',
          branch: 'PAGET',
          sourceName: 'SRC_PAGET',
          plannedQuantity: 5500,
          generatedQuantity: 5500,
          releasedQuantity: 5500,
          heldQuantity: 0,
          completedQuantity: 5408,
          isReleaseCompleted: true,
        },
      ],
    };
    this.plans.set(plan.id, plan);

    // 9. Sample Integration Client for FlexSim
    const defaultRawToken = 'vtf_demo_flexsim_integration_key_2026_secured';
    const defaultTokenHash = hashIntegrationToken(defaultRawToken);
    const demoClient: IntegrationClientEntity = {
      id: 'client_flexsim_01',
      clientName: 'FlexSim Windows Desktop Client - Chuyền May 2',
      tokenHash: defaultTokenHash,
      tokenPrefix: 'vtf_demo_f',
      permissionsJson: JSON.stringify({ lineCode: 'LINE_NHOM_2', canIngest: true }),
      rateLimitPerMin: 120,
      isActive: true,
      lastUsedAt: '2026-11-14T10:45:00.000Z',
      createdAt: '2026-11-14T08:00:00.000Z',
    };
    this.integrationClients.set(demoClient.id, demoClient);

    this.initialized = true;
  }
}

// Global singleton instance
const globalDataStore = globalThis as unknown as { __DATA_STORE__?: DataStore };
if (!globalDataStore.__DATA_STORE__) {
  globalDataStore.__DATA_STORE__ = new DataStore();
}

export const store = globalDataStore.__DATA_STORE__;
