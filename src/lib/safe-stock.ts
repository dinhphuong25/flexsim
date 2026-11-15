/**
 * Phân hệ Quản Lý Ngưỡng Tồn BTP An Toàn (Safe Stock Thresholds)
 * 
 * Quy tắc:
 * 1. Cấu hình quản trị riêng biệt cho từng Queue hoặc điểm đo, không phải Max Content của FlexSim.
 * 2. Không tự đặt ngưỡng cho toàn bộ công đoạn; chưa có ngưỡng hiển thị "Chưa cấu hình" / "Chưa đánh giá".
 * 3. Phân loại chuẩn xác:
 *    - Thiếu dữ liệu: "Chưa có dữ liệu"
 *    - Chưa cấu hình: "Chưa đánh giá"
 *    - current < minStock: "Dưới mức đệm" (nếu minStock bật; bỏ qua ở cuối kỳ giải phóng chuyền)
 *    - current <= safeStockMax: "Trong ngưỡng"
 *    - current > safeStockMax: "Vượt ngưỡng"
 *    - current >= criticalStock: "Mức nghiêm trọng" (ưu tiên cao hơn vượt ngưỡng)
 * 4. Validation: 0 <= minStock <= safeStockMax < criticalStock (số nguyên).
 * 5. Tách bạch hoàn toàn giữa Đạt sản lượng (>= 5.500) và Tồn trong ngưỡng.
 */

export type SafeStockScope = 'IN_RUN' | 'END_OF_RUN' | 'BOTH';

export type SafeStockStatus =
  | 'CHUA_CO_DU_LIEU'
  | 'CHUA_DANH_GIA'
  | 'DUOI_MUC_DEM'
  | 'TRONG_NGUONG'
  | 'VUOT_NGUONG'
  | 'MUC_NGHIEM_TRONG';

export interface SafeStockStatusMeta {
  status: SafeStockStatus;
  label: string;
  badgeVariant: 'outline' | 'secondary' | 'success' | 'warning' | 'destructive';
  colorHex: string;
  description: string;
}

export const SAFE_STOCK_STATUS_META: Record<SafeStockStatus, SafeStockStatusMeta> = {
  CHUA_CO_DU_LIEU: {
    status: 'CHUA_CO_DU_LIEU',
    label: 'Chưa có dữ liệu',
    badgeVariant: 'outline',
    colorHex: '#94a3b8',
    description: 'Chưa nhận được số liệu đo đạc tại thời điểm kiểm tra',
  },
  CHUA_DANH_GIA: {
    status: 'CHUA_DANH_GIA',
    label: 'Chưa đánh giá',
    badgeVariant: 'secondary',
    colorHex: '#64748b',
    description: 'Vị trí này chưa được thiết lập cấu hình ngưỡng tồn an toàn',
  },
  DUOI_MUC_DEM: {
    status: 'DUOI_MUC_DEM',
    label: 'Dưới mức đệm',
    badgeVariant: 'outline',
    colorHex: '#3b82f6',
    description: 'Lượng tồn thấp hơn mức đệm an toàn cần thiết để duy trì luồng gia công',
  },
  TRONG_NGUONG: {
    status: 'TRONG_NGUONG',
    label: 'Trong ngưỡng',
    badgeVariant: 'success',
    colorHex: '#10b981',
    description: 'Lượng tồn BTP nằm trong giới hạn an toàn cho phép',
  },
  VUOT_NGUONG: {
    status: 'VUOT_NGUONG',
    label: 'Vượt ngưỡng',
    badgeVariant: 'warning',
    colorHex: '#f59e0b',
    description: 'Lượng tồn BTP vượt quá ngưỡng tối đa an toàn quy định',
  },
  MUC_NGHIEM_TRONG: {
    status: 'MUC_NGHIEM_TRONG',
    label: 'Mức nghiêm trọng',
    badgeVariant: 'destructive',
    colorHex: '#ef4444',
    description: 'Lượng tồn BTP đạt hoặc vượt ngưỡng báo động nghiêm trọng cần can thiệp',
  },
};

export interface SafeStockThresholdConfig {
  id: string;
  targetCode: string; // VD: 'CD05' hoặc 'Q_CD05'
  targetType: 'STAGE' | 'QUEUE' | 'PROCESSOR' | 'BUFFER';
  minStock: number | null; // Mức đệm tối thiểu (null nếu không áp dụng)
  safeStockMax: number; // Mức tồn tối đa chấp nhận được (BTP)
  criticalStock: number | null; // Mức tồn nghiêm trọng (null nếu không cấu hình)
  consecutiveSecondsBeforeAlert: number; // Thời gian vượt ngưỡng liên tục trước khi cảnh báo (tránh dao động ngắn)
  scope: SafeStockScope; // Giám sát trong lượt, cuối kỳ hoặc cả hai
  modelVersion: string; // Phiên bản mô hình áp dụng
  scenarioCode: string; // Mã phương án áp dụng
  effectiveFrom: string; // Thời điểm hiệu lực
  basisNotes: string; // Ghi chú căn cứ thiết lập ngưỡng
  updatedBy: string; // Người cập nhật gần nhất
  updatedAt: string; // Thời điểm cập nhật
}

export interface SafeStockAuditLog {
  id: string;
  targetCode: string;
  previousConfigJson: string | null;
  newConfigJson: string | null;
  changeReason: string;
  updatedBy: string;
  changedAt: string;
}

export interface SafeStockEvaluationResult {
  targetCode: string;
  currentContent: number | null;
  safeStockMax: number | null;
  criticalStock: number | null;
  minStock: number | null;
  excessStock: number | null;
  status: SafeStockStatus;
  statusLabel: string;
  badgeVariant: 'outline' | 'secondary' | 'success' | 'warning' | 'destructive';
  colorHex: string;
  isConfigured: boolean;
  consecutiveSecondsBeforeAlert: number;
  basisNotes?: string;
  updatedAt?: string;
}

/**
 * Kiểm tra tính hợp lệ của cấu hình ngưỡng tồn an toàn
 * Quy tắc:
 * - safeStockMax phải là số nguyên >= 0
 * - 0 <= minStock <= safeStockMax (nếu có minStock)
 * - safeStockMax < criticalStock (nếu có criticalStock)
 * - Tất cả giá trị số lượng phải là số nguyên
 */
export function validateSafeStockConfig(input: {
  safeStockMax?: number | null;
  minStock?: number | null;
  criticalStock?: number | null;
  consecutiveSecondsBeforeAlert?: number | null;
}): { valid: boolean; error?: string } {
  if (input.safeStockMax === undefined || input.safeStockMax === null) {
    return { valid: false, error: 'Ngưỡng tối đa an toàn (safeStockMax) là bắt buộc.' };
  }

  if (!Number.isInteger(input.safeStockMax) || input.safeStockMax < 0) {
    return { valid: false, error: 'Ngưỡng tối đa an toàn phải là số nguyên không âm.' };
  }

  if (input.minStock !== null && input.minStock !== undefined) {
    if (!Number.isInteger(input.minStock) || input.minStock < 0) {
      return { valid: false, error: 'Mức đệm tối thiểu (minStock) phải là số nguyên không âm.' };
    }
    if (input.minStock > input.safeStockMax) {
      return {
        valid: false,
        error: `Mức đệm tối thiểu (${input.minStock}) không được vượt quá ngưỡng an toàn (${input.safeStockMax}).`,
      };
    }
  }

  if (input.criticalStock !== null && input.criticalStock !== undefined) {
    if (!Number.isInteger(input.criticalStock)) {
      return { valid: false, error: 'Mức nghiêm trọng (criticalStock) phải là số nguyên.' };
    }
    if (input.criticalStock <= input.safeStockMax) {
      return {
        valid: false,
        error: `Mức nghiêm trọng (${input.criticalStock}) phải lớn hơn ngưỡng tối đa an toàn (${input.safeStockMax}).`,
      };
    }
  }

  if (
    input.consecutiveSecondsBeforeAlert !== null &&
    input.consecutiveSecondsBeforeAlert !== undefined &&
    input.consecutiveSecondsBeforeAlert < 0
  ) {
    return { valid: false, error: 'Thời gian trễ cảnh báo phải là số không âm.' };
  }

  return { valid: true };
}

/**
 * Phân loại trạng thái tồn BTP của một đối tượng dựa trên Current Content
 * Không dùng WIP trung bình để phân loại Current Content.
 */
export function classifySafeStock(
  currentContent: number | null | undefined,
  config?: SafeStockThresholdConfig | null,
  options?: { isEndOfRun?: boolean; targetCode?: string }
): SafeStockEvaluationResult {
  const targetCode = config?.targetCode || options?.targetCode || 'UNKNOWN';

  // 1. Kiểm tra thiếu dữ liệu
  if (currentContent === null || currentContent === undefined || isNaN(currentContent)) {
    const meta = SAFE_STOCK_STATUS_META.CHUA_CO_DU_LIEU;
    return {
      targetCode,
      currentContent: null,
      safeStockMax: config?.safeStockMax ?? null,
      criticalStock: config?.criticalStock ?? null,
      minStock: config?.minStock ?? null,
      excessStock: null,
      status: meta.status,
      statusLabel: meta.label,
      badgeVariant: meta.badgeVariant,
      colorHex: meta.colorHex,
      isConfigured: !!config,
      consecutiveSecondsBeforeAlert: config?.consecutiveSecondsBeforeAlert ?? 60,
      basisNotes: config?.basisNotes,
      updatedAt: config?.updatedAt,
    };
  }

  // 2. Kiểm tra chưa cấu hình ngưỡng
  if (!config || config.safeStockMax === null || config.safeStockMax === undefined) {
    const meta = SAFE_STOCK_STATUS_META.CHUA_DANH_GIA;
    return {
      targetCode,
      currentContent,
      safeStockMax: null,
      criticalStock: null,
      minStock: null,
      excessStock: null,
      status: meta.status,
      statusLabel: meta.label,
      badgeVariant: meta.badgeVariant,
      colorHex: meta.colorHex,
      isConfigured: false,
      consecutiveSecondsBeforeAlert: 60,
    };
  }

  // 3. Đã có cấu hình: Phân loại theo thứ tự ưu tiên
  const safeStockMax = config.safeStockMax;
  const criticalStock = config.criticalStock;
  const minStock = config.minStock;
  const excessStock = Math.max(currentContent - safeStockMax, 0);

  // 3.1. Ưu tiên cao nhất: Mức nghiêm trọng (current >= criticalStock)
  if (criticalStock !== null && criticalStock !== undefined && currentContent >= criticalStock) {
    const meta = SAFE_STOCK_STATUS_META.MUC_NGHIEM_TRONG;
    return {
      targetCode,
      currentContent,
      safeStockMax,
      criticalStock,
      minStock,
      excessStock,
      status: meta.status,
      statusLabel: meta.label,
      badgeVariant: meta.badgeVariant,
      colorHex: meta.colorHex,
      isConfigured: true,
      consecutiveSecondsBeforeAlert: config.consecutiveSecondsBeforeAlert,
      basisNotes: config.basisNotes,
      updatedAt: config.updatedAt,
    };
  }

  // 3.2. Vượt ngưỡng tối đa an toàn (current > safeStockMax)
  if (currentContent > safeStockMax) {
    const meta = SAFE_STOCK_STATUS_META.VUOT_NGUONG;
    return {
      targetCode,
      currentContent,
      safeStockMax,
      criticalStock,
      minStock,
      excessStock,
      status: meta.status,
      statusLabel: meta.label,
      badgeVariant: meta.badgeVariant,
      colorHex: meta.colorHex,
      isConfigured: true,
      consecutiveSecondsBeforeAlert: config.consecutiveSecondsBeforeAlert,
      basisNotes: config.basisNotes,
      updatedAt: config.updatedAt,
    };
  }

  // 3.3. Dưới mức đệm (current < minStock) nếu minStock được bật
  // Lưu ý: Không coi "Dưới mức đệm" là lỗi ở cuối kỳ khi đang giải phóng chuyền
  if (minStock !== null && minStock !== undefined && currentContent < minStock) {
    if (options?.isEndOfRun) {
      // Khi kết thúc kỳ / giải phóng chuyền, tồn giảm về 0 là bình thường
      const meta = SAFE_STOCK_STATUS_META.TRONG_NGUONG;
      return {
        targetCode,
        currentContent,
        safeStockMax,
        criticalStock,
        minStock,
        excessStock: 0,
        status: meta.status,
        statusLabel: meta.label,
        badgeVariant: meta.badgeVariant,
        colorHex: meta.colorHex,
        isConfigured: true,
        consecutiveSecondsBeforeAlert: config.consecutiveSecondsBeforeAlert,
        basisNotes: config.basisNotes,
        updatedAt: config.updatedAt,
      };
    } else {
      const meta = SAFE_STOCK_STATUS_META.DUOI_MUC_DEM;
      return {
        targetCode,
        currentContent,
        safeStockMax,
        criticalStock,
        minStock,
        excessStock: 0,
        status: meta.status,
        statusLabel: meta.label,
        badgeVariant: meta.badgeVariant,
        colorHex: meta.colorHex,
        isConfigured: true,
        consecutiveSecondsBeforeAlert: config.consecutiveSecondsBeforeAlert,
        basisNotes: config.basisNotes,
        updatedAt: config.updatedAt,
      };
    }
  }

  // 3.4. Trong ngưỡng an toàn (0 <= current <= safeStockMax và không dưới minStock)
  const meta = SAFE_STOCK_STATUS_META.TRONG_NGUONG;
  return {
    targetCode,
    currentContent,
    safeStockMax,
    criticalStock,
    minStock,
    excessStock: 0,
    status: meta.status,
    statusLabel: meta.label,
    badgeVariant: meta.badgeVariant,
    colorHex: meta.colorHex,
    isConfigured: true,
    consecutiveSecondsBeforeAlert: config.consecutiveSecondsBeforeAlert,
    basisNotes: config.basisNotes,
    updatedAt: config.updatedAt,
  };
}

/**
 * Đánh giá tổng thể tuân thủ tồn BTP toàn chuyền và phối hợp với mục tiêu sản lượng
 */
export interface OverallStockComplianceResult {
  isProductionCompleted: boolean;
  productionOutput: number | null;
  productionTarget: number;
  totalConfigured: number;
  totalEvaluated: number;
  withinLimitCount: number;
  excessCount: number;
  criticalCount: number;
  unconfiguredCount: number;
  missingDataCount: number;
  isAllStockWithinLimits: boolean;
  isAllStockCleared: boolean;
  hasSufficientData: boolean;
  overallConclusionLabel: string;
  notes: string;
}

export function evaluateOverallStockCompliance(
  items: {
    targetCode: string;
    currentContent: number | null | undefined;
    config?: SafeStockThresholdConfig | null;
  }[],
  finishedOutput: number | null | undefined,
  productionTarget: number = 5500
): OverallStockComplianceResult {
  const isProductionCompleted = finishedOutput !== null && finishedOutput !== undefined && finishedOutput >= productionTarget;

  let totalConfigured = 0;
  let withinLimitCount = 0;
  let excessCount = 0;
  let criticalCount = 0;
  let unconfiguredCount = 0;
  let missingDataCount = 0;
  let allZero = true;

  for (const item of items) {
    const evalRes = classifySafeStock(item.currentContent, item.config, { isEndOfRun: true });
    if (evalRes.isConfigured) {
      totalConfigured++;
    } else {
      unconfiguredCount++;
    }

    if (item.currentContent === null || item.currentContent === undefined) {
      missingDataCount++;
      allZero = false;
    } else if (item.currentContent !== 0) {
      allZero = false;
    }

    switch (evalRes.status) {
      case 'TRONG_NGUONG':
      case 'DUOI_MUC_DEM':
        withinLimitCount++;
        break;
      case 'VUOT_NGUONG':
        excessCount++;
        break;
      case 'MUC_NGHIEM_TRONG':
        criticalCount++;
        break;
    }
  }

  // Đủ dữ liệu đánh giá nếu không có vị trí nào bị thiếu dữ liệu đo đạc
  const hasSufficientData = items.length > 0 && missingDataCount === 0;
  const isAllStockWithinLimits = hasSufficientData && totalConfigured > 0 && excessCount === 0 && criticalCount === 0;
  const isAllStockCleared = hasSufficientData && allZero;

  let overallConclusionLabel = '';
  if (!hasSufficientData || totalConfigured === 0) {
    overallConclusionLabel = 'Chưa đủ dữ liệu đánh giá tồn toàn chuyền';
  } else if (isProductionCompleted && isAllStockWithinLimits) {
    overallConclusionLabel = 'Đạt sản lượng và tồn trong ngưỡng';
  } else if (isProductionCompleted && !isAllStockWithinLimits) {
    overallConclusionLabel = 'Đạt sản lượng nhưng có vị trí tồn vượt ngưỡng';
  } else if (!isProductionCompleted && isAllStockWithinLimits) {
    overallConclusionLabel = 'Chưa đạt sản lượng, tồn trong ngưỡng';
  } else {
    overallConclusionLabel = 'Chưa đạt sản lượng và tồn vượt ngưỡng';
  }

  return {
    isProductionCompleted,
    productionOutput: finishedOutput ?? null,
    productionTarget,
    totalConfigured,
    totalEvaluated: items.length,
    withinLimitCount,
    excessCount,
    criticalCount,
    unconfiguredCount,
    missingDataCount,
    isAllStockWithinLimits,
    isAllStockCleared,
    hasSufficientData,
    overallConclusionLabel,
    notes: 'Tiêu chuẩn sản lượng (>= 5.500) và Tồn BTP an toàn được theo dõi và đánh giá độc lập.',
  };
}
