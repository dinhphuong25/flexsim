/**
 * Thư viện tính toán thống kê thực nghiệm và khoảng tin cậy 95% theo chuẩn Phần 10
 */

// Bảng tra giá trị phân phối Student-t với độ tin cậy 95% (two-sided, alpha = 0.05)
// key: bậc tự do df = n - 1
const STUDENT_T_95_CRITICAL_VALUES: Record<number, number> = {
  1: 12.706,
  2: 4.303,
  3: 3.182,
  4: 2.776,
  5: 2.571,
  6: 2.447,
  7: 2.365,
  8: 2.306,
  9: 2.262,
  10: 2.228,
  11: 2.201,
  12: 2.179,
  13: 2.160,
  14: 2.145,
  15: 2.131,
  16: 2.120,
  17: 2.110,
  18: 2.101,
  19: 2.093,
  20: 2.086,
  21: 2.080,
  22: 2.074,
  23: 2.069,
  24: 2.064,
  25: 2.060,
  26: 2.056,
  27: 2.052,
  28: 2.048,
  29: 2.045,
  30: 2.042,
  40: 2.021,
  50: 2.009,
  60: 2.000,
  80: 1.990,
  100: 1.984,
  120: 1.980,
};

/**
 * Lấy hệ số t critical cho df bậc tự do
 */
export function getStudentTCritical(df: number): number {
  if (df <= 0) return 0;
  if (STUDENT_T_95_CRITICAL_VALUES[df]) {
    return STUDENT_T_95_CRITICAL_VALUES[df];
  }
  // Nội suy hoặc xấp xỉ phân phối chuẩn cho mẫu lớn (> 120)
  if (df > 120) {
    return 1.96;
  }
  // Tìm bậc tự do gần nhất
  const availableDfs = Object.keys(STUDENT_T_95_CRITICAL_VALUES).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < availableDfs.length - 1; i++) {
    if (df >= availableDfs[i] && df <= availableDfs[i + 1]) {
      const lower = availableDfs[i];
      const upper = availableDfs[i + 1];
      const fraction = (df - lower) / (upper - lower);
      return STUDENT_T_95_CRITICAL_VALUES[lower] + fraction * (STUDENT_T_95_CRITICAL_VALUES[upper] - STUDENT_T_95_CRITICAL_VALUES[lower]);
    }
  }
  return 1.96;
}

export interface StatisticalSummary {
  n: number;
  mean: number | null;
  variance: number | null;
  stdDev: number | null;
  stdError: number | null;
  tCritical: number | null;
  marginOfError: number | null;
  confidenceInterval95: [number, number] | null;
  min: number | null;
  max: number | null;
  isReliable: boolean;
  warning?: string;
}

/**
 * Tính toán thống kê mô tả và khoảng tin cậy 95% theo phân phối Student-t
 * Lưu ý nguyên tắc Phần 10:
 * - Chỉ tính KTC 95% khi đủ các lần lặp độc lập (n >= 3).
 * - Không coi các thời điểm trong một lượt là các lần lặp độc lập.
 */
export function calculateReplicationStats(samples: number[]): StatisticalSummary {
  const validSamples = samples.filter((v) => v !== null && v !== undefined && !isNaN(v));
  const n = validSamples.length;

  if (n === 0) {
    return {
      n: 0,
      mean: null,
      variance: null,
      stdDev: null,
      stdError: null,
      tCritical: null,
      marginOfError: null,
      confidenceInterval95: null,
      min: null,
      max: null,
      isReliable: false,
      warning: 'Không có dữ liệu mẫu hợp lệ',
    };
  }

  const sum = validSamples.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / n;
  const min = Math.min(...validSamples);
  const max = Math.max(...validSamples);

  if (n === 1) {
    return {
      n: 1,
      mean: Math.round(mean * 100) / 100,
      variance: 0,
      stdDev: 0,
      stdError: 0,
      tCritical: null,
      marginOfError: null,
      confidenceInterval95: null,
      min,
      max,
      isReliable: false,
      warning: 'Chỉ có 1 lần lặp; không thể tính khoảng tin cậy 95%',
    };
  }

  // Phương sai mẫu hiệu chỉnh s^2 = sum((x - mean)^2) / (n - 1)
  const sumSquaredDiff = validSamples.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
  const variance = sumSquaredDiff / (n - 1);
  const stdDev = Math.sqrt(variance);
  const stdError = stdDev / Math.sqrt(n);

  const df = n - 1;
  const tCritical = getStudentTCritical(df);
  const marginOfError = tCritical * stdError;

  const lowerBound = mean - marginOfError;
  const upperBound = mean + marginOfError;

  const isReliable = n >= 5;
  const warning = n < 5
    ? `Số lần lặp (${n}) còn ít, khoảng tin cậy 95% có biên độ dao động rộng. Khuyến nghị chạy tối thiểu 5–10 lần lặp độc lập.`
    : undefined;

  return {
    n,
    mean: Math.round(mean * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    stdError: Math.round(stdError * 100) / 100,
    tCritical: Math.round(tCritical * 1000) / 1000,
    marginOfError: Math.round(marginOfError * 100) / 100,
    confidenceInterval95: [
      Math.round(lowerBound * 100) / 100,
      Math.round(upperBound * 100) / 100,
    ],
    min,
    max,
    isReliable,
    warning,
  };
}

/**
 * So sánh ghép cặp (Paired t-test) giữa phương án cải tiến và đối chứng cùng seed
 */
export interface PairedComparisonResult {
  nPairs: number;
  meanDifference: number;
  percentageChange: number;
  pValueSignificant: boolean;
  conclusion: string;
}

export function comparePairedReplications(
  baselineOutputs: number[],
  improvedOutputs: number[]
): PairedComparisonResult | null {
  const n = Math.min(baselineOutputs.length, improvedOutputs.length);
  if (n < 2) return null;

  const diffs: number[] = [];
  for (let i = 0; i < n; i++) {
    diffs.push(improvedOutputs[i] - baselineOutputs[i]);
  }

  const stats = calculateReplicationStats(diffs);
  if (!stats.mean || !stats.stdDev) return null;

  const baselineMean = baselineOutputs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const pctChange = baselineMean > 0 ? (stats.mean / baselineMean) * 100 : 0;

  // Kiểm định xem 0 có nằm ngoài khoảng tin cậy 95% không
  const isSignificant = stats.confidenceInterval95
    ? (stats.confidenceInterval95[0] > 0 || stats.confidenceInterval95[1] < 0)
    : false;

  let conclusion = '';
  if (isSignificant && stats.mean > 0) {
    conclusion = `Phương án cải tiến có ý nghĩa thống kê (p < 0.05): Tăng trung bình +${stats.mean.toFixed(1)} cái (+${pctChange.toFixed(2)}%).`;
  } else if (isSignificant && stats.mean < 0) {
    conclusion = `Phương án cải tiến làm giảm sản lượng có ý nghĩa thống kê: ${stats.mean.toFixed(1)} cái (${pctChange.toFixed(2)}%).`;
  } else {
    conclusion = `Sự chênh lệch (${stats.mean > 0 ? '+' : ''}${stats.mean.toFixed(1)} cái) chưa có ý nghĩa thống kê ở mức tin cậy 95% do khoảng biến thiên rộng.`;
  }

  return {
    nPairs: n,
    meanDifference: Math.round(stats.mean * 100) / 100,
    percentageChange: Math.round(pctChange * 100) / 100,
    pValueSignificant: isSignificant,
    conclusion,
  };
}
