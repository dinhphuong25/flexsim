export type BranchType =
  | 'FRONT_BODY'
  | 'BACK_BODY'
  | 'POST_R01'
  | 'WAISTBAND'
  | 'POST_R02'
  | 'PAGET'
  | 'POST_R03';

export type ObjectType =
  | 'SOURCE'
  | 'QUEUE'
  | 'PROCESSOR'
  | 'COMBINER'
  | 'SINK'
  | 'OPERATOR'
  | 'TRANSPORTER'
  | 'OTHER';

export interface StageDefinition {
  stageCode: string;
  name: string;
  branch: BranchType;
  sequenceOrder: number;
  parallelStationCount: number;
  standardProcessTime?: number;
  notes?: string;
  hasSupportStation?: boolean;
  supportStationName?: string;
}

export interface ModelObjectDefinition {
  flexsimName: string;
  objectType: ObjectType;
  stageCode?: string;
  branch?: BranchType;
  isInventoryAudited: boolean;
  capacity?: number;
  description: string;
}

export interface FloatingWorkerDefinition {
  workerCode: string;
  name: string;
  stationA: string;
  stationB: string;
  transferRule: string;
}

export const BASELINE_PRODUCTION_LINE = {
  code: 'LINE_NHOM_2',
  name: 'Chuyền may Quần trẻ em nữ - Nhóm 2',
  productCode: 'YSH1000218',
  productName: 'Quần trẻ em nữ',
  company: 'Công ty TNHH May Xuất Khẩu Việt Thành',
  targetOutput: 5500,
  runTimeSeconds: 171000, // ~47.5 hours
  totalPlannedWorkers: 34,
  fixedWorkers: 30,
  floatingWorkers: 4,
  modelVersion: 'v1.0-baseline',
};

// 27 Stages defined in Section 4 of requirements
export const STAGE_DEFINITIONS: StageDefinition[] = [
  // 1. Nhánh thân trước
  { stageCode: 'CD01', name: 'May xếp ly thân trước', branch: 'FRONT_BODY', sequenceOrder: 1, parallelStationCount: 1, standardProcessTime: 28.5 },
  { stageCode: 'CD02', name: 'May túi mổ / viền túi thân trước', branch: 'FRONT_BODY', sequenceOrder: 2, parallelStationCount: 2, standardProcessTime: 55.0 },
  { stageCode: 'CD03', name: 'Di bọ miệng túi thân trước', branch: 'FRONT_BODY', sequenceOrder: 3, parallelStationCount: 1, standardProcessTime: 24.0 },
  { stageCode: 'CD04', name: 'Chắp sườn thân trước', branch: 'FRONT_BODY', sequenceOrder: 4, parallelStationCount: 2, standardProcessTime: 52.0 },
  { stageCode: 'CD05', name: 'May đáp đáy thân trước', branch: 'FRONT_BODY', sequenceOrder: 5, parallelStationCount: 1, standardProcessTime: 31.0, hasSupportStation: true, supportStationName: 'P_CD05B_HOTRO' },
  { stageCode: 'CD06', name: 'Ủi định hình thân trước', branch: 'FRONT_BODY', sequenceOrder: 6, parallelStationCount: 1, standardProcessTime: 26.0 },

  // 2. Nhánh thân sau
  { stageCode: 'CD07', name: 'May túi ốp / chắp đũng thân sau', branch: 'BACK_BODY', sequenceOrder: 7, parallelStationCount: 1, standardProcessTime: 33.0 },

  // 3. Điểm ráp R01 (Combiner: Thân trước + Thân sau) & các công đoạn sau R01
  { stageCode: 'R01', name: 'Điểm ráp R01 (Ráp Thân Trước & Thân Sau)', branch: 'POST_R01', sequenceOrder: 8, parallelStationCount: 1, notes: 'Combiner 1 TT + 1 TS' },
  { stageCode: 'CD08', name: 'Chắp đũng sau R01', branch: 'POST_R01', sequenceOrder: 9, parallelStationCount: 1, standardProcessTime: 29.0 },
  { stageCode: 'CD09', name: 'May sườn trong', branch: 'POST_R01', sequenceOrder: 10, parallelStationCount: 1, standardProcessTime: 30.5 },
  { stageCode: 'CD10', name: 'Ủi rẽ đường sườn', branch: 'POST_R01', sequenceOrder: 11, parallelStationCount: 1, standardProcessTime: 25.0 },
  { stageCode: 'CD11', name: 'Di bọ đũng và gia cố', branch: 'POST_R01', sequenceOrder: 12, parallelStationCount: 2, standardProcessTime: 50.0 },
  { stageCode: 'CD12', name: 'Cuộn gấu lót trong', branch: 'POST_R01', sequenceOrder: 13, parallelStationCount: 1, standardProcessTime: 28.0, hasSupportStation: true, supportStationName: 'P_CD12B_HOTRO' },
  { stageCode: 'CD13', name: 'May chun phụ sườn', branch: 'POST_R01', sequenceOrder: 14, parallelStationCount: 2, standardProcessTime: 54.0 },
  { stageCode: 'CD14', name: 'Kiểm tra bán thành phẩm chuẩn bị tra cạp', branch: 'POST_R01', sequenceOrder: 15, parallelStationCount: 1, standardProcessTime: 27.0, hasSupportStation: true, supportStationName: 'P_CD14B_HOTRO' },

  // 4. Nhánh cạp lưng
  { stageCode: 'CD15', name: 'Ép mex & may định hình cạp lưng', branch: 'WAISTBAND', sequenceOrder: 16, parallelStationCount: 1, standardProcessTime: 32.0 },

  // 5. Điểm ráp R02 (Combiner: BTP sau CD14 + Cạp lưng CD15) & sau R02
  { stageCode: 'R02', name: 'Điểm ráp R02 (Tra cạp lưng vào thân)', branch: 'POST_R02', sequenceOrder: 17, parallelStationCount: 1, notes: 'Combiner 1 BTP CD14 + 1 Lưng CD15' },
  { stageCode: 'CD16', name: 'May luồn chun cạp quần', branch: 'POST_R02', sequenceOrder: 18, parallelStationCount: 2, standardProcessTime: 56.0 },
  { stageCode: 'CD17', name: 'Mí cạp quần', branch: 'POST_R02', sequenceOrder: 19, parallelStationCount: 1, standardProcessTime: 30.0, hasSupportStation: true, supportStationName: 'P_CD17B_HOTRO' },
  { stageCode: 'CD18', name: 'Đính bọ dây đai cạp', branch: 'POST_R02', sequenceOrder: 20, parallelStationCount: 1, standardProcessTime: 25.5 },
  { stageCode: 'CD19', name: 'Ủi cạp và hoàn thiện phần lưng', branch: 'POST_R02', sequenceOrder: 21, parallelStationCount: 1, standardProcessTime: 28.0 },

  // 6. Nhánh Paget (viền / nẹp trang trí)
  { stageCode: 'CD20', name: 'Cắt gọt và cuộn mép Paget', branch: 'PAGET', sequenceOrder: 22, parallelStationCount: 1, standardProcessTime: 24.0 },
  { stageCode: 'CD21', name: 'May xếp nếp Paget trang trí', branch: 'PAGET', sequenceOrder: 23, parallelStationCount: 1, standardProcessTime: 27.0 },
  { stageCode: 'CD22', name: 'Ủi định hình Paget', branch: 'PAGET', sequenceOrder: 24, parallelStationCount: 1, standardProcessTime: 22.0 },

  // 7. Điểm ráp R03 (Combiner: BTP sau CD19 + Paget CD22) & sau R03
  { stageCode: 'R03', name: 'Điểm ráp R03 (Ráp Paget trang trí vào quần)', branch: 'POST_R03', sequenceOrder: 25, parallelStationCount: 1, notes: 'Combiner 1 BTP CD19 + 1 Paget CD22' },
  { stageCode: 'CD23', name: 'May hoàn thiện gấu quần', branch: 'POST_R03', sequenceOrder: 26, parallelStationCount: 2, standardProcessTime: 53.0 },
  { stageCode: 'CD24', name: 'Đính nút / thêu logo trẻ em', branch: 'POST_R03', sequenceOrder: 27, parallelStationCount: 1, standardProcessTime: 26.0 },
  { stageCode: 'CD25', name: 'Cắt chỉ và làm sạch bán thành phẩm', branch: 'POST_R03', sequenceOrder: 28, parallelStationCount: 1, standardProcessTime: 24.0 },
  { stageCode: 'CD26', name: 'Ủi hoàn thiện toàn bộ sản phẩm', branch: 'POST_R03', sequenceOrder: 29, parallelStationCount: 1, standardProcessTime: 31.0 },
  { stageCode: 'CD27', name: 'KCS kiểm phẩm cuối chuyền và đóng gói', branch: 'POST_R03', sequenceOrder: 30, parallelStationCount: 2, standardProcessTime: 51.0 },
  { stageCode: 'SINK_TP', name: 'Thành phẩm hoàn chỉnh nhập kho (Sink TP)', branch: 'POST_R03', sequenceOrder: 31, parallelStationCount: 1, notes: 'Sink tiếp nhận thành phẩm cuối' }
];

// 4 Floating Operators specified in Section 8 of requirements
export const FLOATING_WORKERS: FloatingWorkerDefinition[] = [
  {
    workerCode: 'OP_04_05',
    name: 'Công nhân điều chuyển 1 (CD04 - CD05)',
    stationA: 'P_CD04B',
    stationB: 'P_CD05B_HOTRO',
    transferRule: 'Hỗ trợ trạm CD05B khi hàng chờ Q_CD05 vượt ngưỡng quy định, chuyển về P_CD04B khi Q_CD05 giảm an toàn.'
  },
  {
    workerCode: 'OP_11_12',
    name: 'Công nhân điều chuyển 2 (CD11 - CD12)',
    stationA: 'P_CD11B',
    stationB: 'P_CD12B_HOTRO',
    transferRule: 'Hỗ trợ trạm CD12B khi hàng chờ Q_CD12 vượt ngưỡng, chuyển về P_CD11B khi ổn định.'
  },
  {
    workerCode: 'OP_13_14',
    name: 'Công nhân điều chuyển 3 (CD13 - CD14)',
    stationA: 'P_CD13B',
    stationB: 'P_CD14B_HOTRO',
    transferRule: 'Hỗ trợ trạm CD14B khi hàng chờ Q_CD14 tăng cao, chuyển về P_CD13B khi hàng chờ giảm.'
  },
  {
    workerCode: 'OP_16_17',
    name: 'Công nhân điều chuyển 4 (CD16 - CD17)',
    stationA: 'P_CD16B',
    stationB: 'P_CD17B_HOTRO',
    transferRule: 'Hỗ trợ trạm CD17B khi tồn BTP tại Q_CD17 dâng cao, quay về P_CD16B khi tải bình thường.'
  }
];

// Full Reference Seed Run Data from FlexSim Simulation (NHOM2_FINAL_2_autosave_1.sqlite)
export const REFERENCE_SEED_METRICS = {
  dataSource: 'MEASURED' as const,
  sourceDescription: 'Dữ liệu mô phỏng tự động từ FlexSim 2027 (NHOM2_FINAL_2_autosave_1.sqlite - Lượt đo 171.000s)',
  finishedCount: 5408,
  targetCount: 5500,
  runTimeSeconds: 171000,
  totalPlannedWorkers: 34,
  stageMetrics: {
    CD01: {
      inputCount: 5500,
      outputCount: 5498,
      currentWip: 2,
      avgWip: 1.85,
      maxWip: 4,
      avgStaytime: 18.4,
      processingPct: 97.08
    },
    CD02: {
      inputCount: 5498,
      outputCount: 5494,
      currentWip: 4,
      avgWip: 3.42,
      maxWip: 6,
      avgStaytime: 24.1,
      processingPct: 95.51
    },
    CD03: {
      inputCount: 5494,
      outputCount: 5493,
      currentWip: 1,
      avgWip: 0.92,
      maxWip: 3,
      avgStaytime: 12.5,
      processingPct: 98.13
    },
    CD04: {
      inputCount: 5493,
      outputCount: 5488,
      currentWip: 5,
      avgWip: 5.15,
      maxWip: 9,
      avgStaytime: 32.8,
      processingPct: 86.71
    },
    CD05: {
      inputCount: 5488,
      outputCount: 5466,
      currentWip: 22,
      avgWip: 22.31,
      maxWip: 30,
      avgStaytime: 700.33,
      processingPct: 99.89
    },
    CD06: {
      inputCount: 5466,
      outputCount: 5464,
      currentWip: 2,
      avgWip: 1.74,
      maxWip: 4,
      avgStaytime: 16.2,
      processingPct: 98.69
    },
    CD07: {
      inputCount: 5500,
      outputCount: 5498,
      currentWip: 2,
      avgWip: 1.45,
      maxWip: 3,
      avgStaytime: 14.8,
      processingPct: 94.03
    },
    CD08: {
      inputCount: 5464,
      outputCount: 5461,
      currentWip: 3,
      avgWip: 2.65,
      maxWip: 5,
      avgStaytime: 21.0,
      processingPct: 92.48
    },
    CD09: {
      inputCount: 5461,
      outputCount: 5459,
      currentWip: 2,
      avgWip: 1.88,
      maxWip: 4,
      avgStaytime: 17.5,
      processingPct: 93.95
    },
    CD10: {
      inputCount: 5459,
      outputCount: 5456,
      currentWip: 3,
      avgWip: 2.45,
      maxWip: 5,
      avgStaytime: 19.8,
      processingPct: 92.88
    },
    CD11: {
      inputCount: 5456,
      outputCount: 5452,
      currentWip: 4,
      avgWip: 4.12,
      maxWip: 7,
      avgStaytime: 28.6,
      processingPct: 93.64
    },
    CD12: {
      inputCount: 5452,
      outputCount: 5448,
      currentWip: 4,
      avgWip: 3.2,
      maxWip: 6,
      avgStaytime: 22.4,
      processingPct: 99.55
    },
    CD13: {
      inputCount: 5448,
      outputCount: 5444,
      currentWip: 4,
      avgWip: 3.55,
      maxWip: 6,
      avgStaytime: 25.0,
      processingPct: 90.47
    },
    CD14: {
      inputCount: 5444,
      outputCount: 5440,
      currentWip: 4,
      avgWip: 3.65,
      maxWip: 6,
      avgStaytime: 26.65,
      processingPct: 99.59
    },
    CD15: {
      inputCount: 5500,
      outputCount: 5498,
      currentWip: 2,
      avgWip: 1.55,
      maxWip: 3,
      avgStaytime: 15.2,
      processingPct: 88.08
    },
    CD16: {
      inputCount: 5440,
      outputCount: 5436,
      currentWip: 4,
      avgWip: 4.25,
      maxWip: 7,
      avgStaytime: 29.5,
      processingPct: 89.01
    },
    CD17: {
      inputCount: 5436,
      outputCount: 5432,
      currentWip: 4,
      avgWip: 3.45,
      maxWip: 6,
      avgStaytime: 24.09,
      processingPct: 99.54
    },
    CD18: {
      inputCount: 5432,
      outputCount: 5430,
      currentWip: 2,
      avgWip: 1.7,
      maxWip: 4,
      avgStaytime: 16.8,
      processingPct: 87.21
    },
    CD19: {
      inputCount: 5430,
      outputCount: 5428,
      currentWip: 2,
      avgWip: 1.62,
      maxWip: 3,
      avgStaytime: 15.9,
      processingPct: 88.97
    },
    CD20: {
      inputCount: 5500,
      outputCount: 5499,
      currentWip: 1,
      avgWip: 0.85,
      maxWip: 2,
      avgStaytime: 11.2,
      processingPct: 72.71
    },
    CD21: {
      inputCount: 5499,
      outputCount: 5498,
      currentWip: 1,
      avgWip: 0.78,
      maxWip: 2,
      avgStaytime: 9.5,
      processingPct: 45.97
    },
    CD22: {
      inputCount: 5498,
      outputCount: 5497,
      currentWip: 1,
      avgWip: 0.82,
      maxWip: 2,
      avgStaytime: 10.4,
      processingPct: 57.46
    },
    CD23: {
      inputCount: 5428,
      outputCount: 5424,
      currentWip: 4,
      avgWip: 4.1,
      maxWip: 7,
      avgStaytime: 27.2,
      processingPct: 82.87
    },
    CD24: {
      inputCount: 5420,
      outputCount: 5418,
      currentWip: 2,
      avgWip: 1.68,
      maxWip: 3,
      avgStaytime: 16.0,
      processingPct: 69.21
    },
    CD25: {
      inputCount: 5418,
      outputCount: 5417,
      currentWip: 1,
      avgWip: 0.95,
      maxWip: 2,
      avgStaytime: 12.0,
      processingPct: 71.9
    },
    CD26: {
      inputCount: 5417,
      outputCount: 5415,
      currentWip: 2,
      avgWip: 1.75,
      maxWip: 4,
      avgStaytime: 17.1,
      processingPct: 87.5
    },
    CD27: {
      inputCount: 5415,
      outputCount: 5411,
      currentWip: 4,
      avgWip: 3.3,
      maxWip: 6,
      avgStaytime: 23.5,
      processingPct: 71.93
    },
    R01: {
      inputCount: 10961,
      outputCount: 5463,
      currentWip: 0,
      avgWip: 0.45,
      maxWip: 2,
      avgStaytime: 4.2,
      processingPct: 98.2
    },
    R02: {
      inputCount: 10936,
      outputCount: 5438,
      currentWip: 0,
      avgWip: 0.52,
      maxWip: 2,
      avgStaytime: 4.8,
      processingPct: 97.8
    },
    R03: {
      inputCount: 10922,
      outputCount: 5425,
      currentWip: 0,
      avgWip: 0.48,
      maxWip: 2,
      avgStaytime: 4.5,
      processingPct: 98.1
    },
    SINK_TP: {
      inputCount: 5408,
      outputCount: 5408,
      currentWip: 0,
      avgWip: 0.0,
      maxWip: 0,
      avgStaytime: 0.0,
      processingPct: 100.0
    },
  },
  objectMetrics: {
    P_CD01: {
      processingPct: 97.08,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD02A: {
      processingPct: 96.33,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD02B: {
      processingPct: 94.69,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD03: {
      processingPct: 98.13,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD04A: {
      processingPct: 99.68,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD04B: {
      processingPct: 73.74,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD05: {
      processingPct: 99.89,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD06: {
      processingPct: 98.69,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD07: {
      processingPct: 94.03,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD08: {
      processingPct: 92.48,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD09: {
      processingPct: 93.95,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD10: {
      processingPct: 92.88,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD11A: {
      processingPct: 99.0,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD11B: {
      processingPct: 88.27,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD12: {
      processingPct: 99.55,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD13A: {
      processingPct: 97.98,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD13B: {
      processingPct: 82.96,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD14: {
      processingPct: 99.59,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD15: {
      processingPct: 88.08,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD16A: {
      processingPct: 96.14,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD16B: {
      processingPct: 81.87,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD17: {
      processingPct: 99.54,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD18: {
      processingPct: 87.21,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD19: {
      processingPct: 88.97,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD20: {
      processingPct: 72.71,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD21: {
      processingPct: 45.97,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD22: {
      processingPct: 57.46,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD23A: {
      processingPct: 82.89,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD23B: {
      processingPct: 82.84,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD24: {
      processingPct: 69.21,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD25: {
      processingPct: 71.9,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD26: {
      processingPct: 87.5,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD27A: {
      processingPct: 72.01,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD27B: {
      processingPct: 71.85,
      stateAtSample: 'Processing',
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 1
    },
    P_CD05B_HOTRO: {
      processingPct: 21.5,
      outputCount: 904,
      stateAtSample: 'Idle',
      currentContent: 0,
      avgContent: 0.20,
      maxContent: 1
    },
    P_CD12B_HOTRO: {
      processingPct: 14.8,
      outputCount: 150,
      stateAtSample: 'Idle',
      currentContent: 0,
      avgContent: 0.20,
      maxContent: 1
    },
    P_CD14B_HOTRO: {
      processingPct: 12.5,
      outputCount: 120,
      stateAtSample: 'Idle',
      currentContent: 0,
      avgContent: 0.20,
      maxContent: 1
    },
    P_CD17B_HOTRO: {
      processingPct: 18.2,
      outputCount: 210,
      stateAtSample: 'Idle',
      currentContent: 0,
      avgContent: 0.20,
      maxContent: 1
    },
    Q_CD01: {
      currentContent: 2,
      avgContent: 1.85,
      maxContent: 4,
      avgStaytime: 18.4,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD02: {
      currentContent: 4,
      avgContent: 3.42,
      maxContent: 6,
      avgStaytime: 24.1,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD03: {
      currentContent: 1,
      avgContent: 0.92,
      maxContent: 3,
      avgStaytime: 12.5,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD04: {
      currentContent: 5,
      avgContent: 5.15,
      maxContent: 9,
      avgStaytime: 32.8,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD05: {
      currentContent: 22,
      avgContent: 22.31,
      maxContent: 30,
      avgStaytime: 700.33,
      stateAtSample: 'Accumulating',
      processingPct: 0.0
    },
    Q_CD06: {
      currentContent: 2,
      avgContent: 1.74,
      maxContent: 4,
      avgStaytime: 16.2,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD07: {
      currentContent: 2,
      avgContent: 1.45,
      maxContent: 3,
      avgStaytime: 14.8,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD08: {
      currentContent: 3,
      avgContent: 2.65,
      maxContent: 5,
      avgStaytime: 21.0,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD09: {
      currentContent: 2,
      avgContent: 1.88,
      maxContent: 4,
      avgStaytime: 17.5,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD10: {
      currentContent: 3,
      avgContent: 2.45,
      maxContent: 5,
      avgStaytime: 19.8,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD11: {
      currentContent: 4,
      avgContent: 4.12,
      maxContent: 7,
      avgStaytime: 28.6,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD12: {
      currentContent: 4,
      avgContent: 3.2,
      maxContent: 6,
      avgStaytime: 22.4,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD13: {
      currentContent: 4,
      avgContent: 3.55,
      maxContent: 6,
      avgStaytime: 25.0,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD14: {
      currentContent: 4,
      avgContent: 3.65,
      maxContent: 6,
      avgStaytime: 26.65,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD15: {
      currentContent: 2,
      avgContent: 1.55,
      maxContent: 3,
      avgStaytime: 15.2,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD16: {
      currentContent: 4,
      avgContent: 4.25,
      maxContent: 7,
      avgStaytime: 29.5,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD17: {
      currentContent: 4,
      avgContent: 3.45,
      maxContent: 6,
      avgStaytime: 24.09,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD18: {
      currentContent: 2,
      avgContent: 1.7,
      maxContent: 4,
      avgStaytime: 16.8,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD19: {
      currentContent: 2,
      avgContent: 1.62,
      maxContent: 3,
      avgStaytime: 15.9,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD20: {
      currentContent: 1,
      avgContent: 0.85,
      maxContent: 2,
      avgStaytime: 11.2,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD21: {
      currentContent: 1,
      avgContent: 0.78,
      maxContent: 2,
      avgStaytime: 9.5,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD22: {
      currentContent: 1,
      avgContent: 0.82,
      maxContent: 2,
      avgStaytime: 10.4,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD23: {
      currentContent: 4,
      avgContent: 4.1,
      maxContent: 7,
      avgStaytime: 27.2,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD24: {
      currentContent: 2,
      avgContent: 1.68,
      maxContent: 3,
      avgStaytime: 16.0,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD25: {
      currentContent: 1,
      avgContent: 0.95,
      maxContent: 2,
      avgStaytime: 12.0,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD26: {
      currentContent: 2,
      avgContent: 1.75,
      maxContent: 4,
      avgStaytime: 17.1,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_CD27: {
      currentContent: 4,
      avgContent: 3.3,
      maxContent: 6,
      avgStaytime: 23.5,
      stateAtSample: 'Waiting',
      processingPct: 0.0
    },
    Q_R02_CHINH: {
      currentContent: 0, avgContent: 0.15, maxContent: 2, avgStaytime: 1.5, stateAtSample: 'Empty', processingPct: 0.0
    },
    SRC_TT: {
      outputCount: 5500, stateAtSample: 'Generating', processingPct: 100.0, currentContent: 0, avgContent: 0.0, maxContent: 0
    },
    SRC_TS: {
      outputCount: 5500, stateAtSample: 'Generating', processingPct: 100.0, currentContent: 0, avgContent: 0.0, maxContent: 0
    },
    SRC_LUNG: {
      outputCount: 5500, stateAtSample: 'Generating', processingPct: 100.0, currentContent: 0, avgContent: 0.0, maxContent: 0
    },
    SRC_PAGET: {
      outputCount: 5500, stateAtSample: 'Generating', processingPct: 100.0, currentContent: 0, avgContent: 0.0, maxContent: 0
    },
    R01: { inputCount: 10961, outputCount: 5463, stateAtSample: 'Processing', processingPct: 98.2, currentContent: 0, avgContent: 0.45, maxContent: 2 },
    R02: { inputCount: 10936, outputCount: 5438, stateAtSample: 'Processing', processingPct: 97.8, currentContent: 0, avgContent: 0.52, maxContent: 2 },
    R03: { inputCount: 10922, outputCount: 5425, stateAtSample: 'Processing', processingPct: 98.1, currentContent: 0, avgContent: 0.48, maxContent: 2 },
    SINK_TP: { inputCount: 5408, outputCount: 0, stateAtSample: 'Collecting', processingPct: 100.0, currentContent: 0, avgContent: 0.0, maxContent: 0 }
  }
};

/**
 * BẢNG KPI THAM CHIẾU CỦA LƯỢT ĐÃ CHỐT (Mục 4)
 * Lưu trữ chính xác các chỉ tiêu từ ảnh minh chứng kết quả đã chốt
 */
export const CHOT_REFERENCE_KPIS = {
  SanLuong: 5427,
  WIP_CD05: 22.07,
  WIP_CD12: 0.01,
  WIP_CD14: 19.86,
  WIP_CD17: 16.31,
  WIPMax_CD05: 30,
  WIPMax_CD12: 1,
  WIPMax_CD14: 40,
  WIPMax_CD17: 55,
  Cho_CD05: 686.24,
  Cho_CD12: 0.34,
  Cho_CD14: 617.39,
  Cho_CD17: 509.13,
  Processing_CD05: 98.56,
  Processing_CD12: 95.26,
  Processing_CD14: 98.52,
  Processing_CD17: 98.83,
  BTPCuoi_CD05: 0,
  BTPCuoi_CD12: 0,
  BTPCuoi_CD14: 0,
  BTPCuoi_CD17: 0,
  Processing_CD05B: 6.03,
  Output_CD05B: 317,
};

/**
 * Dữ liệu lượt tham chiếu đã chốt (Mục 1)
 * Nhãn nguồn: "Ảnh kết quả đã chốt" (Nhập thủ công, không gắn nhãn trực tiếp)
 */
export const CHOT_REFERENCE_METRICS = {
  runCode: 'RUN_CHOT_5427',
  dataSource: 'MANUAL' as const,
  sourceDescription: 'Ảnh kết quả đã chốt',
  finishedCount: 5427,
  targetCount: 5500,
  remainingCount: 73,
  completionRate: 98.67,
  runTimeSeconds: 171000,
  totalPlannedWorkers: 34,
  isLineCleared: false, // Tồn cuối toàn chuyền: Chưa xác nhận
  fourKeyQueuesCleared: true, // CD05, CD12, CD14, CD17 đều bằng 0
};

/**
 * CẤU HÌNH ĐIỀU KHIỂN ĐỂ THEO DÕI (Mục 10)
 */
export interface StageControlConfig {
  stageCode: string;
  highThreshold: number;
  lowThreshold: number;
  highThresholdSecondary?: number;
  initialMode: number;
  finalPhaseTimestamp: number;
  normalWorkloadMarginSeconds: number;
  finalPhaseWorkloadMarginSeconds: number;
  finalPhaseH: number;
  finalPhaseL: number;
  operatorCode: string;
  primaryStation: string;
  supportStation: string;
  actualMode: number | null; // null biểu thị "Chưa có dữ liệu"
}

export const REFERENCE_CONTROL_CONFIGS: StageControlConfig[] = [
  {
    stageCode: 'CD05',
    highThreshold: 30, // H05 = 30
    lowThreshold: 15,  // L05 = 15
    initialMode: 0,
    finalPhaseTimestamp: 164700,
    normalWorkloadMarginSeconds: 600,
    finalPhaseWorkloadMarginSeconds: 180,
    finalPhaseH: 1,
    finalPhaseL: 0,
    operatorCode: 'OP_04_05',
    primaryStation: 'P_CD04B',
    supportStation: 'P_CD05B_HOTRO',
    actualMode: null, // "Chưa có dữ liệu" từ stream thực tế
  },
  {
    stageCode: 'CD12',
    highThreshold: 40, // H05 = 40
    lowThreshold: 20,  // L05 = 20
    initialMode: 0,
    finalPhaseTimestamp: 164700,
    normalWorkloadMarginSeconds: 600,
    finalPhaseWorkloadMarginSeconds: 180,
    finalPhaseH: 1,
    finalPhaseL: 0,
    operatorCode: 'OP_11_12',
    primaryStation: 'P_CD11B',
    supportStation: 'P_CD12B_HOTRO',
    actualMode: null,
  },
  {
    stageCode: 'CD14',
    highThreshold: 40, // H05 = 40
    lowThreshold: 20,  // L05 = 20
    highThresholdSecondary: 60, // H04 = 60
    initialMode: 0,
    finalPhaseTimestamp: 164700,
    normalWorkloadMarginSeconds: 600,
    finalPhaseWorkloadMarginSeconds: 180,
    finalPhaseH: 1,
    finalPhaseL: 0,
    operatorCode: 'OP_13_14',
    primaryStation: 'P_CD13B',
    supportStation: 'P_CD14B_HOTRO',
    actualMode: null,
  },
  {
    stageCode: 'CD17',
    highThreshold: 60, // H05 = 60
    lowThreshold: 30,  // L05 = 30
    highThresholdSecondary: 60, // H04 = 60
    initialMode: 0,
    finalPhaseTimestamp: 164700,
    normalWorkloadMarginSeconds: 600,
    finalPhaseWorkloadMarginSeconds: 180,
    finalPhaseH: 1,
    finalPhaseL: 0,
    operatorCode: 'OP_16_17',
    primaryStation: 'P_CD16B',
    supportStation: 'P_CD17B_HOTRO',
    actualMode: null,
  },
];

export const OPERATOR_MODES = [
  { code: 0, label: 'Làm tại trạm gốc' },
  { code: 1, label: 'Chờ trạm gốc hoàn thành' },
  { code: 2, label: 'Hỗ trợ trạm nhận' },
  { code: 3, label: 'Chờ trạm hỗ trợ hoàn thành để quay về' },
];

/**
 * KẾ HOẠCH CẤP LIỆU (Mục 8)
 * 4 Source: SRC_TT, SRC_TS, SRC_LUNG, SRC_PAGET
 * 550 đợt, 10 chi tiết/đợt, khoảng cách 300s, bắt đầu tại 0s, kết thúc tại 164.700s, Repeat = TẮT
 * Tổng kế hoạch: 5.500 chi tiết
 */
export const ARRIVAL_SCHEDULE_CONFIG = {
  sources: ['SRC_TT', 'SRC_TS', 'SRC_LUNG', 'SRC_PAGET'] as const,
  totalBatches: 550,
  batchQuantity: 10,
  intervalSeconds: 300,
  firstArrivalSeconds: 0,
  lastArrivalSeconds: 164700,
  repeat: false,
  totalPlannedQuantity: 5500,
};

export interface ArrivalScheduleRow {
  batchNumber: number;
  arrivalTime: number; // giây
  itemName: string;
  quantity: number;
}

export function generateArrivalSchedule(sourceName: string = 'SRC_TT'): ArrivalScheduleRow[] {
  const rows: ArrivalScheduleRow[] = [];
  const itemName = sourceName === 'SRC_TT'
    ? 'ThanTruoc'
    : sourceName === 'SRC_TS'
    ? 'ThanSau'
    : sourceName === 'SRC_LUNG'
    ? 'CapLung'
    : 'Paget';

  for (let i = 0; i < ARRIVAL_SCHEDULE_CONFIG.totalBatches; i++) {
    rows.push({
      batchNumber: i + 1,
      arrivalTime: i * ARRIVAL_SCHEDULE_CONFIG.intervalSeconds,
      itemName,
      quantity: ARRIVAL_SCHEDULE_CONFIG.batchQuantity,
    });
  }

  return rows;
}
