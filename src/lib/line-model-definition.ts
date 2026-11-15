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

// Reference Seed Run Data from Section 18 of requirements
export const REFERENCE_SEED_METRICS = {
  dataSource: 'MEASURED' as const,
  sourceDescription: 'Đối chiếu ảnh kết quả mô phỏng người dùng ngày 14/11/2026',
  finishedCount: 5408,
  targetCount: 5500,
  runTimeSeconds: 171000,
  totalPlannedWorkers: 34,
  stageMetrics: {
    CD05: {
      avgWip: 22.31,
      maxWip: 30,
      currentWip: 22,
      avgStaytime: 700.33,
      processingPct: 99.89
    },
    CD12: {
      avgWip: 0.01,
      maxWip: 1,
      currentWip: 0,
      avgStaytime: 0.25,
      processingPct: 93.93
    },
    CD14: {
      avgWip: 0.84,
      maxWip: 4,
      currentWip: 0,
      avgStaytime: 26.65,
      processingPct: 98.56
    },
    CD17: {
      avgWip: 0.76,
      maxWip: 3,
      currentWip: 0,
      avgStaytime: 24.09,
      processingPct: 99.03
    }
  },
  objectMetrics: {
    P_CD05B_HOTRO: {
      processingPct: 3.45,
      outputCount: 181
    }
  }
};
