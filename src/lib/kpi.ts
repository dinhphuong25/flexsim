/**
 * Quy tắc tính toán KPI và tiêu chí hoàn thành sản lượng
 * Mục tiêu hiện hành: 5.500 thành phẩm trong 171.000 giây (finishedOutput >= 5500).
 * Hoàn thành khi finishedOutput >= target.
 * Đúng 5.500 là hoàn thành.
 * Null hiển thị "Chưa có dữ liệu", không chuyển thành 0 hoặc đánh dấu hoàn thành.
 *
 * Dùng chung một hàm tính KPI cho frontend, backend và báo cáo:
 * isCompleted = finishedOutput >= target
 * remaining = Math.max(target - finishedOutput, 0)
 * excess = Math.max(finishedOutput - target, 0)
 * completionRate = finishedOutput / target * 100
 */

export const CURRENT_PRODUCTION_TARGET = 5500;
export const CURRENT_PRODUCTION_THRESHOLD = 5500; // Bí danh tương thích
export const CURRENT_MINIMUM_REQUIRED = 5500;
export const PLANNED_SIMULATION_TIME = 171000; // 47h 30m

export type LineClearStatus = 'CONFIRMED' | 'UNCONFIRMED' | 'HAS_WIP';

export interface AcceptanceEvaluation {
  // A. Tiêu chí sản lượng
  target: number;
  actualOutput: number | null;
  remaining: number | null;
  completionRate: number | null;
  outputPassed: boolean;
  outputStatusLabel: string;

  // Tiêu chí thời gian kế hoạch
  simulatedSeconds: number | null;
  plannedSeconds: number;
  timePassed: boolean;
  timeStatusLabel: string;

  // B. Tiêu chí hết tồn cuối kỳ toàn chuyền
  fullLineClear: LineClearStatus;
  fullLineClearLabel: string;
  auditedScopeSummary: string;

  // C. Đạt đồng thời các tiêu chí nghiệm thu
  allCriteriaPassed: boolean;
  overallConclusionLabel: string;
  reasons: string[];
}

/**
 * Đánh giá độc lập 3 tiêu chí nghiệm thu theo quy định Mục 2:
 * A. Đạt sản lượng (actualOutput >= 5500)
 * B. Hết tồn cuối kỳ toàn chuyền (kiểm kê đầy đủ & tất cả = 0)
 * C. Đạt đồng thời các tiêu chí nghiệm thu
 */
export function evaluateAcceptanceCriteria({
  actualOutput,
  target = CURRENT_PRODUCTION_TARGET,
  simulatedSeconds = PLANNED_SIMULATION_TIME,
  plannedSeconds = PLANNED_SIMULATION_TIME,
  inventoryAudit,
}: {
  actualOutput: number | null | undefined;
  target?: number;
  simulatedSeconds?: number | null | undefined;
  plannedSeconds?: number;
  inventoryAudit?: {
    totalScopeItems: number;
    auditedItemsCount: number;
    totalEndingWip: number;
    missingDataCount: number;
    hasWipCount: number;
  } | null;
}): AcceptanceEvaluation {
  const reasons: string[] = [];

  // A. Tiêu chí sản lượng
  let remaining: number | null = null;
  let completionRate: number | null = null;
  let outputPassed = false;
  let outputStatusLabel = 'Chưa có dữ liệu';

  if (actualOutput !== null && actualOutput !== undefined && !isNaN(actualOutput)) {
    remaining = Math.max(0, target - actualOutput);
    completionRate = Math.round((actualOutput / target) * 10000) / 100;
    outputPassed = actualOutput >= target;
    outputStatusLabel = outputPassed ? 'Đạt sản lượng' : 'Chưa đạt sản lượng';
    if (!outputPassed) {
      reasons.push(
        `Sản lượng thực tế (${actualOutput.toLocaleString('vi-VN')}) chưa đạt mục tiêu ${target.toLocaleString('vi-VN')} cái (còn thiếu ${remaining.toLocaleString('vi-VN')} cái, đạt ${completionRate.toFixed(2).replace('.', ',')}%)`
      );
    }
  } else {
    reasons.push('Thiếu dữ liệu sản lượng thành phẩm tại Sink.');
  }

  // Tiêu chí thời gian kế hoạch: mốc 171.000 giây
  let timePassed = false;
  let timeStatusLabel = 'Chưa có dữ liệu';

  if (simulatedSeconds !== null && simulatedSeconds !== undefined && !isNaN(simulatedSeconds)) {
    if (simulatedSeconds === plannedSeconds) {
      timePassed = true;
      timeStatusLabel = `Đúng mốc kế hoạch (${simulatedSeconds.toLocaleString('vi-VN')}s)`;
    } else if (simulatedSeconds < plannedSeconds) {
      timePassed = false;
      timeStatusLabel = `Chưa đủ thời gian kế hoạch (${simulatedSeconds.toLocaleString('vi-VN')}s / ${plannedSeconds.toLocaleString('vi-VN')}s)`;
      reasons.push(`Thời gian mô phỏng chưa hoàn thành đủ 171.000 giây ca kế hoạch.`);
    } else {
      // simulatedSeconds > plannedSeconds: không coi là đạt chỉ vì sau này gom đủ sản lượng
      timePassed = false;
      timeStatusLabel = `Vượt quá thời gian kế hoạch (${simulatedSeconds.toLocaleString('vi-VN')}s > ${plannedSeconds.toLocaleString('vi-VN')}s)`;
      reasons.push(`Thời gian mô phỏng (${simulatedSeconds.toLocaleString('vi-VN')}s) vượt quá mốc 171.000 giây kế hoạch.`);
    }
  } else {
    reasons.push('Thiếu dữ liệu thời gian mô phỏng.');
  }

  // B. Tiêu chí hết tồn cuối kỳ toàn chuyền
  let fullLineClear: LineClearStatus = 'UNCONFIRMED';
  let fullLineClearLabel = 'Chưa xác nhận';
  let auditedScopeSummary = 'Chưa có dữ liệu kiểm kê toàn chuyền';

  if (inventoryAudit) {
    const { totalScopeItems, auditedItemsCount, totalEndingWip, missingDataCount, hasWipCount } = inventoryAudit;
    auditedScopeSummary = `Đã kiểm tra ${auditedItemsCount}/${totalScopeItems} vị trí sản xuất`;

    if (missingDataCount > 0 || auditedItemsCount < totalScopeItems) {
      fullLineClear = 'UNCONFIRMED';
      fullLineClearLabel = 'Chưa xác nhận hết tồn toàn chuyền';
      reasons.push(
        `Chưa đủ dữ liệu kiểm kê toàn chuyền (còn ${missingDataCount + (totalScopeItems - auditedItemsCount)} vị trí chưa có số liệu kiểm kê).`
      );
    } else if (totalEndingWip === 0 && hasWipCount === 0) {
      fullLineClear = 'CONFIRMED';
      fullLineClearLabel = 'Hết tồn cuối kỳ toàn chuyền';
    } else {
      fullLineClear = 'HAS_WIP';
      fullLineClearLabel = `Còn tồn cuối kỳ (${totalEndingWip.toLocaleString('vi-VN')} BTP tại ${hasWipCount} vị trí)`;
      reasons.push(`Chuyền vẫn còn tồn ${totalEndingWip.toLocaleString('vi-VN')} BTP dở dang tại ${hasWipCount} vị trí.`);
    }
  } else {
    reasons.push('Chưa có hồ sơ kiểm kê cuối kỳ đối chiếu.');
  }

  // C. Đạt đồng thời các tiêu chí nghiệm thu
  const allCriteriaPassed = outputPassed && timePassed && fullLineClear === 'CONFIRMED';
  const overallConclusionLabel = allCriteriaPassed
    ? 'Đạt đồng thời các tiêu chí nghiệm thu'
    : 'Chưa đạt đầy đủ tiêu chí nghiệm thu';

  return {
    target,
    actualOutput: actualOutput ?? null,
    remaining,
    completionRate,
    outputPassed,
    outputStatusLabel,
    simulatedSeconds: simulatedSeconds ?? null,
    plannedSeconds,
    timePassed,
    timeStatusLabel,
    fullLineClear,
    fullLineClearLabel,
    auditedScopeSummary,
    allCriteriaPassed,
    overallConclusionLabel,
    reasons,
  };
}

export interface ProductionKpiResult {
  target: number;
  finishedOutput: number | null;
  isCompleted: boolean;
  remaining: number | null;
  excess: number | null;
  completionRate: number | null;
  statusLabel: string;
  requirementLabel: string;

  // Thuộc tính tương thích ngược cho giao diện và báo cáo
  threshold: number;
  minimumRequired: number;
  aboveThreshold: number | null;
  percentageOfThreshold: number | null;
  finished: number | null;
  completionRatePct: number | null;
  remainingCount: number | null;
  isOverTarget: boolean;
}

export type KpiCalculationResult = ProductionKpiResult;

/**
 * Đánh giá tập trung tiêu chí sản lượng hiện hành dùng chung
 */
export function evaluateProductionOutput(
  finishedOutput: number | null | undefined,
  target: number = CURRENT_PRODUCTION_TARGET
): ProductionKpiResult {
  const requirementLabel = `${target.toLocaleString('vi-VN')} sản phẩm`;

  if (finishedOutput === null || finishedOutput === undefined || isNaN(finishedOutput)) {
    return {
      target,
      threshold: target,
      minimumRequired: target,
      finishedOutput: null,
      finished: null,
      isCompleted: false,
      remaining: null,
      remainingCount: null,
      excess: null,
      aboveThreshold: null,
      completionRate: null,
      completionRatePct: null,
      percentageOfThreshold: null,
      statusLabel: 'Chưa có dữ liệu',
      requirementLabel,
      isOverTarget: false,
    };
  }

  const isCompleted = finishedOutput >= target;
  const remaining = Math.max(target - finishedOutput, 0);
  const excess = Math.max(finishedOutput - target, 0);
  const rawRate = (finishedOutput / target) * 100;
  const completionRate = Math.round(rawRate * 100) / 100;

  const statusLabel = isCompleted ? 'Hoàn thành' : 'Chưa đạt mục tiêu';

  return {
    target,
    threshold: target,
    minimumRequired: target,
    finishedOutput,
    finished: finishedOutput,
    isCompleted,
    remaining,
    remainingCount: remaining,
    excess,
    aboveThreshold: excess,
    completionRate,
    completionRatePct: completionRate,
    percentageOfThreshold: completionRate,
    statusLabel,
    requirementLabel,
    isOverTarget: isCompleted,
  };
}

/**
 * Hàm tính tỷ lệ so với mục tiêu (Không giới hạn ở 100%)
 */
export function calculateCompletionRate(
  finished: number | null | undefined,
  target: number = CURRENT_PRODUCTION_TARGET
): number | null {
  if (finished === null || finished === undefined || isNaN(finished)) {
    return null;
  }
  if (!target || target <= 0) {
    return null;
  }
  const rate = (finished / target) * 100;
  return Math.round(rate * 100) / 100;
}

/**
 * Tính số lượng sản phẩm còn thiếu để đạt mục tiêu (>= target)
 * Còn thiếu = Math.max(target - finished, 0)
 */
export function calculateRemainingCount(
  finished: number | null | undefined,
  target: number = CURRENT_PRODUCTION_TARGET
): number | null {
  if (finished === null || finished === undefined || isNaN(finished)) {
    return null;
  }
  return Math.max(target - finished, 0);
}

/**
 * Cụm tính toán KPI sản xuất tổng thể dùng chung
 */
export function calculateProductionKpis(
  finished: number | null | undefined,
  target: number = CURRENT_PRODUCTION_TARGET
): ProductionKpiResult {
  return evaluateProductionOutput(finished, target);
}

/**
 * Định dạng số theo chuẩn hiển thị tiếng Việt
 * Không biến null thành "0", hiển thị "--" hoặc văn bản dự phòng.
 */
export function formatMetricNumber(
  value: number | null | undefined,
  fractionDigits: number = 0,
  unit?: string,
  emptyPlaceholder: string = '--'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return emptyPlaceholder;
  }

  const formatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const formatted = formatter.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Định dạng tỷ lệ phần trăm
 */
export function formatPercentage(
  value: number | null | undefined,
  fractionDigits: number = 2,
  emptyPlaceholder: string = '--'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return emptyPlaceholder;
  }

  const formatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return `${formatter.format(value)}%`;
}

/**
 * Định dạng thời gian mô phỏng (từ giây sang giờ, phút, giây)
 */
export function formatSimulationTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return 'Chưa có dữ liệu';
  }

  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const timeParts: string[] = [];
  if (hrs > 0) timeParts.push(`${hrs}h`);
  if (mins > 0 || hrs > 0) timeParts.push(`${mins}m`);
  timeParts.push(`${secs}s`);

  const formattedSecs = new Intl.NumberFormat('vi-VN').format(totalSecs);
  return `${timeParts.join(' ')} (${formattedSecs}s)`;
}

export type BottleneckSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface BottleneckEvaluation {
  isBottleneck: boolean;
  severity: BottleneckSeverity;
  reasons: string[];
}

/**
 * Đánh giá công đoạn nút thắt theo quy tắc Phần 6
 */
export function evaluateBottleneck(
  processingPct: number | null | undefined,
  avgWip: number | null | undefined,
  staytimeSeconds: number | null | undefined,
  queueCapacity: number = 30
): BottleneckEvaluation {
  const reasons: string[] = [];
  let isBottleneck = false;
  let severity: BottleneckSeverity = 'NORMAL';

  const hasHighProcessing = processingPct !== null && processingPct !== undefined && processingPct >= 95.0;
  const hasHighWip = avgWip !== null && avgWip !== undefined && avgWip >= 10.0;
  const hasHighStaytime = staytimeSeconds !== null && staytimeSeconds !== undefined && staytimeSeconds >= 100.0;

  if (hasHighProcessing && (hasHighWip || hasHighStaytime)) {
    isBottleneck = true;
    severity = 'CRITICAL';
    reasons.push(`Tỷ lệ chạy máy cao (${formatPercentage(processingPct)}) kết hợp ứ đọng hàng chờ`);
  } else if (hasHighWip) {
    isBottleneck = true;
    severity = 'WARNING';
    reasons.push(`Lượng BTP chờ bình quân (${formatMetricNumber(avgWip, 2, 'cái')}) vượt ngưỡng theo dõi`);
  } else if (hasHighProcessing && !hasHighWip && !hasHighStaytime) {
    severity = 'NORMAL';
    reasons.push('Máy hoạt động công suất cao nhưng dòng chảy thông suốt, hàng chờ không bị nghẽn');
  }

  return { isBottleneck, severity, reasons };
}
