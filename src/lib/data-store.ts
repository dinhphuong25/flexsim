import {
  BASELINE_PRODUCTION_LINE,
  STAGE_DEFINITIONS,
  FLOATING_WORKERS,
  REFERENCE_SEED_METRICS,
  CHOT_REFERENCE_KPIS,
  CHOT_REFERENCE_METRICS,
  BranchType,
  ObjectType,
} from './line-model-definition';
import { UserRole } from './rbac';
import { hashIntegrationToken } from './integration-security';
import bcrypt from 'bcryptjs';
import {
  INITIAL_WORKFORCE_POSITIONS,
  getInitialSkillMatrix,
  getInitialChecklists,
  WorkerPosition,
  SkillLevel,
  TaskChecklistItem,
} from './workforce';
import { SafeStockThresholdConfig, SafeStockAuditLog } from './safe-stock';

export interface UserEntity {
  id: string;
  email: string;
  username?: string;
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
  dataSource: 'SIMULATION' | 'ACTUAL' | 'PLAN' | 'MEASURED' | 'ASSUMPTION' | 'TEST_SIMULATION' | 'MANUAL';
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
  public workforcePositions: Map<string, WorkerPosition> = new Map();
  public skillMatrix: Record<string, Record<string, SkillLevel>> = {};
  public taskChecklists: Map<string, TaskChecklistItem> = new Map();
  public safeStockThresholds: Map<string, SafeStockThresholdConfig> = new Map();
  public safeStockAuditLogs: Map<string, SafeStockAuditLog> = new Map();
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

    // 1. Initial Users (Admin, Manager, Viewer, Standard User)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@VietThanh2026!ChangeMe', adminSalt);
    const managerHash = bcrypt.hashSync('Manager@VietThanh2026', adminSalt);
    const viewerHash = bcrypt.hashSync('Viewer@VietThanh2026', adminSalt);
    const default123Hash = bcrypt.hashSync('123', adminSalt);

    const adminUser: UserEntity = {
      id: 'usr_admin_01',
      email: 'admin@vietthanh.vn',
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Quản Trị Viên Hệ Thống',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    const managerUser: UserEntity = {
      id: 'usr_manager_01',
      email: 'manager@vietthanh.vn',
      username: 'manager',
      passwordHash: managerHash,
      fullName: 'Quản Đốc Chuyền May',
      role: 'MANAGER',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    const viewerUser: UserEntity = {
      id: 'usr_viewer_01',
      email: 'viewer@vietthanh.vn',
      username: 'viewer',
      passwordHash: viewerHash,
      fullName: 'Nhân Viên Giám Sát',
      role: 'VIEWER',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    const standardUser: UserEntity = {
      id: 'usr_user_01',
      email: 'user@vietthanh.vn',
      username: 'user',
      passwordHash: default123Hash,
      fullName: 'Người Dùng Hệ Thống',
      role: 'VIEWER',
      isActive: true,
      createdAt: '2026-11-14T08:00:00.000Z',
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(managerUser.id, managerUser);
    this.users.set(viewerUser.id, viewerUser);
    this.users.set(standardUser.id, standardUser);

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
      description: 'Chuyền sản xuất may quần dài và sooc trẻ em nữ xuất khẩu (Mã hàng: YSH1000218) Nhóm 2',
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

    // 5. Workers: Chuẩn hóa 34 vị trí (30 cố định CN01..CN30 + 4 điều chuyển CN31..CN34)
    this.skillMatrix = getInitialSkillMatrix();
    const initialChecklists = getInitialChecklists();
    for (const chk of initialChecklists) {
      this.taskChecklists.set(chk.id, chk);
    }

    for (const pos of INITIAL_WORKFORCE_POSITIONS) {
      this.workforcePositions.set(pos.positionCode, { ...pos });
      // Lưu vào workers để tương thích ngược
      this.workers.set(pos.positionCode, {
        id: pos.workerId,
        lineId,
        workerCode: pos.positionCode,
        name: pos.displayName,
        isFloating: pos.workerType === 'FLOATING',
        primaryStation: pos.primaryStation,
        secondaryStation: pos.supportStation,
        transferRule: pos.transferRule,
      });

      // Nếu là vị trí điều chuyển, cũng lưu theo mã OP FlexSim để tương thích
      if (pos.flexsimOperatorCode) {
        this.workers.set(pos.flexsimOperatorCode, {
          id: `wrk_${pos.flexsimOperatorCode.toLowerCase()}`,
          lineId,
          workerCode: pos.flexsimOperatorCode,
          name: `${pos.displayName} (${pos.flexsimOperatorCode})`,
          isFloating: true,
          primaryStation: pos.primaryStation,
          secondaryStation: pos.supportStation,
          transferRule: pos.transferRule,
        });
      }
    }

    // 5b. Safe Stock Thresholds: Cấu hình chuẩn đầy đủ cho 27 công đoạn CD01 - CD27
    for (const s of STAGE_DEFINITIONS) {
      if (s.stageCode.startsWith('CD')) {
        const isCd05 = s.stageCode === 'CD05';
        const threshold: SafeStockThresholdConfig = {
          id: `cfg_stock_${s.stageCode.toLowerCase()}`,
          targetCode: s.stageCode,
          targetType: 'STAGE',
          minStock: isCd05 ? 2 : 1,
          safeStockMax: isCd05 ? 15 : 10,
          criticalStock: isCd05 ? 25 : 20,
          consecutiveSecondsBeforeAlert: 60,
          scope: 'END_OF_RUN',
          modelVersion: 'v1.0-baseline',
          scenarioCode: 'SCEN_CO_DINH',
          effectiveFrom: '2026-11-14T08:00:00.000Z',
          basisNotes: isCd05
            ? 'Căn cứ thiết kế mặt bằng đệm trạm CD05 và năng lực giải tỏa của trạm P_CD05B_HOTRO'
            : `Định mức tồn an toàn tiêu chuẩn cho công đoạn ${s.stageCode} (${s.name})`,
          updatedBy: 'admin@vietthanh.vn',
          updatedAt: '2026-11-14T08:00:00.000Z',
        };
        this.safeStockThresholds.set(threshold.targetCode, threshold);
      }
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
    // 7A. BẢN GHI THAM CHIẾU RIÊNG CHO KẾT QUẢ ĐÃ CHỐT (Mục 1 & 4)
    // Nhãn nguồn: "Ảnh kết quả đã chốt" (Nhập thủ công, không gắn nhãn trực tiếp)
    // Sản lượng: 5.427 thành phẩm, Thời gian: 171.000s, Thiếu: 73, Tỷ lệ: 98,67%
    // 4 Queue trọng điểm (CD05, CD12, CD14, CD17) đều = 0; Tồn cuối toàn chuyền: Chưa xác nhận
    const chotRunId = 'run_chot_5427';
    const chotRun: SimulationRunEntity = {
      id: chotRunId,
      scenarioId: baseScenario.id,
      modelVersionId,
      runCode: 'RUN_CHOT_5427',
      replicationIndex: 1,
      runTimeSeconds: 171000,
      status: 'COMPLETED',
      dataSource: 'MANUAL',
      sourceDescription: 'Ảnh kết quả đã chốt',
      finishedCount: 5427,
      targetCount: 5500,
      isLineCleared: false, // Tồn cuối toàn chuyền: Chưa xác nhận
      startedAt: '2026-11-14T08:00:00.000Z',
      finishedAt: '2026-11-14T10:45:00.000Z',
      createdAt: '2026-11-14T10:45:00.000Z',
    };
    this.simulationRuns.set(chotRun.id, chotRun);

    // Stage Metrics cho Lượt Đã Chốt (áp dụng chính xác Bảng KPI tham chiếu Mục 4)
    for (const [stgCode, m] of Object.entries(REFERENCE_SEED_METRICS.stageMetrics)) {
      const metricId = `sm_${chotRunId}_${stgCode}`;
      const sm = m as any;

      let currentWip = sm.currentWip ?? null;
      let avgWip = sm.avgWip ?? null;
      let maxWip = sm.maxWip ?? null;
      let avgStaytime = sm.avgStaytime ?? null;
      let processingPct = sm.processingPct ?? null;
      let outputCount = sm.outputCount ?? null;

      if (stgCode === 'CD05') {
        currentWip = sm.currentWip ?? 22;
        avgWip = CHOT_REFERENCE_KPIS.WIP_CD05; // 22.07
        maxWip = CHOT_REFERENCE_KPIS.WIPMax_CD05; // 30
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD05; // 686.24
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD05; // 98.56
      } else if (stgCode === 'CD12') {
        currentWip = sm.currentWip ?? 4;
        avgWip = CHOT_REFERENCE_KPIS.WIP_CD12; // 0.01
        maxWip = CHOT_REFERENCE_KPIS.WIPMax_CD12; // 1
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD12; // 0.34
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD12; // 95.26
      } else if (stgCode === 'CD14') {
        currentWip = sm.currentWip ?? 4;
        avgWip = CHOT_REFERENCE_KPIS.WIP_CD14; // 19.86
        maxWip = CHOT_REFERENCE_KPIS.WIPMax_CD14; // 40
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD14; // 617.39
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD14; // 98.52
      } else if (stgCode === 'CD17') {
        currentWip = sm.currentWip ?? 4;
        avgWip = CHOT_REFERENCE_KPIS.WIP_CD17; // 16.31
        maxWip = CHOT_REFERENCE_KPIS.WIPMax_CD17; // 55
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD17; // 509.13
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD17; // 98.83
      } else if (stgCode === 'SINK_TP') {
        outputCount = 5427;
      }

      this.stageMetrics.set(metricId, {
        id: metricId,
        runId: chotRunId,
        stageId: `stg_${stgCode.toLowerCase()}`,
        stageCode: stgCode,
        inputCount: sm.inputCount ?? null,
        outputCount,
        currentWip,
        avgWip,
        maxWip,
        avgStaytime,
        processingPct,
        simulationTimeSeconds: 171000,
        capturedAt: '2026-11-14T10:45:00.000Z',
      });
    }

function computeObjectCounts(
  objName: string,
  om: any,
  isChot: boolean = false
): { inputCount: number; outputCount: number; currentContent: number } {
  let currentContent = om?.currentContent ?? 0;
  let inputCount = om?.inputCount ?? null;
  let outputCount = om?.outputCount ?? null;

  if (objName.startsWith('SRC_')) {
    return { inputCount: 5500, outputCount: 5500, currentContent: 0 };
  }
  if (objName === 'R01') return { inputCount: 10961, outputCount: 5463, currentContent: 0 };
  if (objName === 'R02') return { inputCount: 10936, outputCount: 5438, currentContent: 0 };
  if (objName === 'R03') return { inputCount: 10922, outputCount: 5425, currentContent: 0 };
  if (objName === 'Q_R02_CHINH') return { inputCount: 5438, outputCount: 5438, currentContent: 0 };
  if (objName === 'P_CD05B_HOTRO') {
    const out = isChot ? CHOT_REFERENCE_KPIS.Output_CD05B : 904;
    return { inputCount: out, outputCount: out, currentContent: 0 };
  }
  if (objName === 'P_CD12B_HOTRO') return { inputCount: 150, outputCount: 150, currentContent: 0 };
  if (objName === 'P_CD14B_HOTRO') return { inputCount: 120, outputCount: 120, currentContent: 0 };
  if (objName === 'P_CD17B_HOTRO') return { inputCount: 210, outputCount: 210, currentContent: 0 };
  if (objName === 'SINK_TP') {
    const sinkCount = isChot ? 5427 : 5408;
    return { inputCount: sinkCount, outputCount: sinkCount, currentContent: 0 };
  }

  if (isChot && ['Q_CD05', 'Q_CD12', 'Q_CD14', 'Q_CD17'].includes(objName)) {
    currentContent = 0;
  }

  if (objName.startsWith('Q_CD')) {
    const stgCode = objName.replace('Q_', '');
    const stg = (REFERENCE_SEED_METRICS.stageMetrics as any)[stgCode];
    if (stg) {
      inputCount = stg.inputCount;
      outputCount = stg.inputCount - currentContent;
    }
  } else if (objName.startsWith('P_CD')) {
    if (objName.endsWith('A')) {
      const stgCode = objName.replace('P_', '').slice(0, -1);
      const stg = (REFERENCE_SEED_METRICS.stageMetrics as any)[stgCode];
      if (stg) {
        inputCount = Math.floor(stg.outputCount / 2);
        outputCount = inputCount - currentContent;
      }
    } else if (objName.endsWith('B')) {
      const stgCode = objName.replace('P_', '').slice(0, -1);
      const stg = (REFERENCE_SEED_METRICS.stageMetrics as any)[stgCode];
      if (stg) {
        inputCount = Math.ceil(stg.outputCount / 2);
        outputCount = inputCount - currentContent;
      }
    } else {
      const stgCode = objName.replace('P_', '');
      const stg = (REFERENCE_SEED_METRICS.stageMetrics as any)[stgCode];
      if (stg) {
        inputCount = stg.outputCount + currentContent;
        outputCount = stg.outputCount;
      }
    }
  }

  return {
    inputCount: inputCount ?? 0,
    outputCount: outputCount ?? 0,
    currentContent: currentContent ?? 0,
  };
}

    // Object Metrics cho Lượt Đã Chốt
    for (const [objName, m] of Object.entries(REFERENCE_SEED_METRICS.objectMetrics)) {
      const omId = `om_${chotRunId}_${objName}`;
      const om = m as any;
      const counts = computeObjectCounts(objName, om, true);

      let currentContent = counts.currentContent;
      let avgContent = om.avgContent ?? null;
      let maxContent = om.maxContent ?? null;
      let avgStaytime = om.avgStaytime ?? null;
      let processingPct = om.processingPct ?? null;
      let inputCount = counts.inputCount;
      let outputCount = counts.outputCount;

      if (objName === 'Q_CD05') {
        currentContent = CHOT_REFERENCE_KPIS.BTPCuoi_CD05; // 0
        avgContent = CHOT_REFERENCE_KPIS.WIP_CD05; // 22.07
        maxContent = CHOT_REFERENCE_KPIS.WIPMax_CD05; // 30
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD05; // 686.24
      } else if (objName === 'Q_CD12') {
        currentContent = CHOT_REFERENCE_KPIS.BTPCuoi_CD12; // 0
        avgContent = CHOT_REFERENCE_KPIS.WIP_CD12; // 0.01
        maxContent = CHOT_REFERENCE_KPIS.WIPMax_CD12; // 1
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD12; // 0.34
      } else if (objName === 'Q_CD14') {
        currentContent = CHOT_REFERENCE_KPIS.BTPCuoi_CD14; // 0
        avgContent = CHOT_REFERENCE_KPIS.WIP_CD14; // 19.86
        maxContent = CHOT_REFERENCE_KPIS.WIPMax_CD14; // 40
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD14; // 617.39
      } else if (objName === 'Q_CD17') {
        currentContent = CHOT_REFERENCE_KPIS.BTPCuoi_CD17; // 0
        avgContent = CHOT_REFERENCE_KPIS.WIP_CD17; // 16.31
        maxContent = CHOT_REFERENCE_KPIS.WIPMax_CD17; // 55
        avgStaytime = CHOT_REFERENCE_KPIS.Cho_CD17; // 509.13
      } else if (objName === 'P_CD05') {
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD05; // 98.56
      } else if (objName === 'P_CD12') {
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD12; // 95.26
      } else if (objName === 'P_CD14') {
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD14; // 98.52
      } else if (objName === 'P_CD17') {
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD17; // 98.83
      } else if (objName === 'P_CD05B_HOTRO') {
        processingPct = CHOT_REFERENCE_KPIS.Processing_CD05B; // 6.03
        outputCount = CHOT_REFERENCE_KPIS.Output_CD05B; // 317
        inputCount = 317;
      } else if (objName === 'SINK_TP') {
        inputCount = 5427;
        outputCount = 5427;
      }

      this.objectMetrics.set(omId, {
        id: omId,
        runId: chotRunId,
        modelObjectId: `obj_${objName.toLowerCase()}`,
        flexsimName: objName,
        inputCount,
        outputCount,
        currentContent,
        avgContent,
        maxContent,
        avgStaytime,
        processingPct,
        stateAtSample: currentContent === 0 ? 'Empty' : om.stateAtSample ?? null,
        simulationTimeSeconds: 171000,
        capturedAt: '2026-11-14T10:45:00.000Z',
      });
    }

    // Hồ sơ kiểm kê cuối kỳ đối chiếu cho Lượt Đã Chốt (Mục 6: 73 vị trí sản xuất)
    const chotAuditItems = Array.from(this.modelObjects.values())
      .filter((o) => o.isInventoryAudited)
      .map((o) => {
        const isFourKeyQueue = ['Q_CD05', 'Q_CD12', 'Q_CD14', 'Q_CD17'].includes(o.flexsimName);
        const isSource = o.objectType === 'SOURCE';
        const isCombiner = o.objectType === 'COMBINER';
        const isSupportStation = o.flexsimName.endsWith('_HOTRO');
        const isSpecialQueue = o.flexsimName === 'Q_R02_CHINH';

        let currentContent = 0;
        let isAudited = true;
        let status: 'EMPTY' | 'HAS_WIP' | 'MISSING_DATA' = 'EMPTY';
        let notes = '';

        if (isFourKeyQueue) {
          currentContent = 0;
          status = 'EMPTY';
          notes = 'Xác nhận hết tồn cuối kỳ theo ảnh chốt (BTPCuoi = 0)';
        } else if (isSource) {
          currentContent = 0;
          status = 'EMPTY';
          notes = 'Đã xuất hết 5.500 chi tiết theo lịch cấp liệu (164.700s)';
        } else if (isCombiner || isSpecialQueue) {
          currentContent = 0;
          status = 'EMPTY';
          notes = 'Hoàn tất nhịp ráp Combiner (Content = 0)';
        } else if (isSupportStation) {
          currentContent = 0;
          status = 'EMPTY';
          notes = 'Trạm hỗ trợ hoàn tất ca (Content = 0)';
        } else {
          const om = (REFERENCE_SEED_METRICS.objectMetrics as any)[o.flexsimName];
          if (om && om.currentContent !== undefined && om.currentContent !== null) {
            currentContent = om.currentContent;
            status = currentContent === 0 ? 'EMPTY' : 'HAS_WIP';
            notes = currentContent === 0 ? 'Hết tồn cuối kỳ' : `Còn tồn ${currentContent} BTP dở dang`;
          } else {
            currentContent = 0;
            status = 'EMPTY';
            notes = 'Xác nhận kiểm kê';
          }
        }

        return {
          id: `audit_item_chot_${o.flexsimName}`,
          objectName: o.flexsimName,
          objectType: o.objectType,
          branch: o.branch,
          currentContent,
          isAudited: true,
          status,
          notes,
        };
      });

    const totalRemainingWip = chotAuditItems.reduce(
      (sum, item) => sum + (item.currentContent ?? 0),
      0
    );
    const hasWipCount = chotAuditItems.filter((i) => (i.currentContent ?? 0) > 0).length;

    const chotAudit: InventoryAuditEntity = {
      id: 'audit_chot_5427',
      runId: chotRunId,
      auditTimestamp: '2026-11-14T10:45:00.000Z',
      simulationTimeSeconds: 171000,
      conclusion: 'CHUA_DU_DU_LIEU', // Quy định Mục 1 & 3: Tồn cuối toàn chuyền Chưa xác nhận
      totalScopeItems: chotAuditItems.length,
      totalRemainingWip,
      isMaterialReleaseComplete: true,
      isTransportCleared: false,
      inspectedScopeSummary:
        `4 Queue trọng điểm (CD05, CD12, CD14, CD17) hết tồn cuối kỳ; Chuyền còn ${totalRemainingWip} BTP tại ${hasWipCount} vị trí`,
      notes: 'Ảnh kết quả đã chốt xác nhận 4 Queue trọng điểm = 0. Toàn chuyền chưa xác nhận hết tồn.',
      auditedBy: 'Hội Đồng Nghiệm Thu Nhóm 2',
      items: chotAuditItems,
    };
    this.inventoryAudits.set(chotAudit.id, chotAudit);

    // 7B. Bản Ghi Tham Chiếu Ban Đầu (Đối chiếu ảnh 14/11/2026 - 5.408 thành phẩm)
    const seedRunId = 'run_ref_20261114_01';
    const seedRun: SimulationRunEntity = {
      id: seedRunId,
      scenarioId: baseScenario.id,
      modelVersionId,
      runCode: 'RUN_REF_141126',
      replicationIndex: 1,
      randomSeed: undefined,
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

    // Stage Metrics for Seed Run (Populated for all 27 stages + Combiners + Sink)
    for (const [stgCode, m] of Object.entries(REFERENCE_SEED_METRICS.stageMetrics)) {
      const metricId = `sm_${seedRunId}_${stgCode}`;
      const sm = m as any;
      this.stageMetrics.set(metricId, {
        id: metricId,
        runId: seedRunId,
        stageId: `stg_${stgCode.toLowerCase()}`,
        stageCode: stgCode,
        inputCount: sm.inputCount ?? null,
        outputCount: sm.outputCount ?? null,
        currentWip: sm.currentWip ?? null,
        avgWip: sm.avgWip ?? null,
        maxWip: sm.maxWip ?? null,
        avgStaytime: sm.avgStaytime ?? null,
        processingPct: sm.processingPct ?? null,
        simulationTimeSeconds: 171000,
        capturedAt: '2026-11-14T10:45:00.000Z',
      });
    }

    // Object Metrics for Seed Run (All Processors, Queues, Sources, Combiners, Sink)
    for (const [objName, m] of Object.entries(REFERENCE_SEED_METRICS.objectMetrics)) {
      const omId = `om_${seedRunId}_${objName}`;
      const om = m as any;
      const counts = computeObjectCounts(objName, om, false);

      this.objectMetrics.set(omId, {
        id: omId,
        runId: seedRunId,
        modelObjectId: `obj_${objName.toLowerCase()}`,
        flexsimName: objName,
        inputCount: counts.inputCount,
        outputCount: counts.outputCount,
        currentContent: counts.currentContent,
        avgContent: om.avgContent ?? null,
        maxContent: om.maxContent ?? null,
        avgStaytime: om.avgStaytime ?? null,
        processingPct: om.processingPct ?? null,
        stateAtSample: counts.currentContent === 0 ? 'Empty' : om.stateAtSample ?? null,
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
      notes: 'Kế hoạch may đơn hàng Quần sooc nữ trẻ em (Mã hàng: YSH1000218) xuất khẩu Hàn Quốc - Lô 5.500 cái',
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
if (
  !globalDataStore.__DATA_STORE__ ||
  !globalDataStore.__DATA_STORE__.safeStockThresholds ||
  globalDataStore.__DATA_STORE__.safeStockThresholds.size < 27 ||
  !globalDataStore.__DATA_STORE__.users.has('usr_user_01') ||
  !globalDataStore.__DATA_STORE__.simulationRuns.has('run_chot_5427')
) {
  globalDataStore.__DATA_STORE__ = new DataStore();
}

export const store = globalDataStore.__DATA_STORE__;
