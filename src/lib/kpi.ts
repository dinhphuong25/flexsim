/**
 * Quy tắc tính toán KPI và hiển thị chỉ số sản xuất theo yêu cầu Phần 6
 */

export interface KpiCalculationResult {
  target: number;
  finished: number | null;
  completionRatePct: number | null;
  remainingCount: number | null;
  isOverTarget: boolean;
  statusLabel: string;
}

/**
 * Tính tỷ lệ hoàn thành kế hoạch:
 * Hoàn thành (%) = thành phẩm / mục tiêu × 100
 * Lưu ý:
 * - null không phải là 0: nếu chưa có số liệu, trả về null.
 * - Nếu vượt kế hoạch (> 100%), hiển thị đúng giá trị thực (> 100%).
 */
export function calculateCompletionRate(
  finished: number | null | undefined,
  target: number
): number | null {
  if (finished === null || finished === undefined || isNaN(finished)) {
    return null;
  }
  if (!target || target <= 0) {
    return null;
  }
  const rate = (finished / target) * 100;
  // Làm tròn 2 chữ số thập phân nhưng giữ độ chính xác
  return Math.round(rate * 100) / 100;
}

/**
 * Tính số lượng sản phẩm còn thiếu:
 * Còn thiếu = max(mục tiêu − thành phẩm, 0)
 * Nếu thành phẩm null, trả về null.
 */
export function calculateRemainingCount(
  finished: number | null | undefined,
  target: number
): number | null {
  if (finished === null || finished === undefined || isNaN(finished)) {
    return null;
  }
  return Math.max(target - finished, 0);
}

/**
 * Tính toán toàn bộ cụm KPI sản lượng tổng thể
 */
export function calculateProductionKpis(
  finished: number | null | undefined,
  target: number
): KpiCalculationResult {
  const completionRatePct = calculateCompletionRate(finished, target);
  const remainingCount = calculateRemainingCount(finished, target);
  const isOverTarget = finished !== null && finished !== undefined ? finished > target : false;

  let statusLabel = 'Chưa có dữ liệu';
  if (completionRatePct !== null) {
    if (completionRatePct >= 100) {
      statusLabel = 'Đạt và vượt kế hoạch';
    } else if (completionRatePct >= 95) {
      statusLabel = 'Gần đạt kế hoạch';
    } else if (completionRatePct >= 80) {
      statusLabel = 'Tiến độ bình thường';
    } else {
      statusLabel = 'Chậm tiến độ';
    }
  }

  return {
    target,
    finished: finished ?? null,
    completionRatePct,
    remainingCount,
    isOverTarget,
    statusLabel,
  };
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

  const formattedStr = formatter.format(value);
  return unit ? `${formattedStr} ${unit}` : formattedStr;
}

/**
 * Định dạng phần trăm
 */
export function formatPercentage(
  value: number | null | undefined,
  fractionDigits: number = 2,
  emptyPlaceholder: string = '--'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return emptyPlaceholder;
  }
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * Định dạng thời gian giây sang định dạng giờ:phút:giây
 */
export function formatSimulationTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '--';
  }
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s (${totalSecs.toLocaleString('vi-VN')}s)`;
  }
  return `${minutes}m ${secs}s (${totalSecs.toLocaleString('vi-VN')}s)`;
}

/**
 * Đánh giá điểm nút thắt (Bottleneck Score):
 * Lưu ý nguyên tắc Phần 6: Processing gần 100% không tự chứng minh nút thắt.
 * Nút thắt thực sự phải đồng thời xem xét:
 * 1. Tồn hàng chờ trước trạm (Queue avg_wip, current_wip)
 * 2. Thời gian chờ (Staytime)
 * 3. Tỷ lệ vận hành (Processing %)
 */
export interface BottleneckEvaluation {
  isBottleneck: boolean;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  reason: string;
}

export function evaluateBottleneck(
  processingPct: number | null | undefined,
  avgWip: number | null | undefined,
  avgStaytime: number | null | undefined,
  capacity: number = 30
): BottleneckEvaluation {
  if (processingPct === null || processingPct === undefined) {
    return {
      isBottleneck: false,
      severity: 'NORMAL',
      reason: 'Chưa đủ dữ liệu thống kê vận hành',
    };
  }

  // Tỷ lệ tải Queue
  const wipRatio = avgWip !== null && avgWip !== undefined ? avgWip / capacity : 0;
  const staytimeSecs = avgStaytime ?? 0;

  if (processingPct >= 98.0 && (wipRatio >= 0.5 || staytimeSecs > 300)) {
    return {
      isBottleneck: true,
      severity: 'CRITICAL',
      reason: `Tải máy rất cao (${processingPct.toFixed(1)}%) đi kèm ứ đọng hàng chờ lớn (Staytime: ${staytimeSecs.toFixed(0)}s)`,
    };
  }

  if (processingPct >= 95.0 && (wipRatio >= 0.3 || staytimeSecs > 100)) {
    return {
      isBottleneck: true,
      severity: 'WARNING',
      reason: `Có dấu hiệu nghẽn: Processing ${processingPct.toFixed(1)}%, thời gian chờ trung bình ${staytimeSecs.toFixed(0)}s`,
    };
  }

  if (processingPct >= 95.0 && wipRatio < 0.2) {
    return {
      isBottleneck: false,
      severity: 'NORMAL',
      reason: `Máy chạy liên tục (${processingPct.toFixed(1)}%) nhưng không ứ đọng hàng trước trạm (không phải nút thắt nghẽn)`,
    };
  }

  return {
    isBottleneck: false,
    severity: 'NORMAL',
    reason: 'Vận hành ổn định trong giới hạn cho phép',
  };
}
