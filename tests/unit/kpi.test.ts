import { describe, it, expect } from 'vitest';
import {
  calculateCompletionRate,
  calculateRemainingCount,
  calculateProductionKpis,
  formatMetricNumber,
  formatPercentage,
  formatSimulationTime,
  evaluateBottleneck,
} from '@/lib/kpi';

describe('Quy tắc KPI và tính toán sản xuất (Mục 6 & 20)', () => {
  it('Tính chính xác tỷ lệ hoàn thành 5408 / 5500', () => {
    const rate = calculateCompletionRate(5408, 5500);
    // 5408 / 5500 * 100 = 98.32727... -> làm tròn 98.33%
    expect(rate).toBe(98.33);
  });

  it('Tính chính xác số lượng còn thiếu: max(5500 - 5408, 0) = 92', () => {
    const remaining = calculateRemainingCount(5408, 5500);
    expect(remaining).toBe(92);
  });

  it('Khi vượt kế hoạch, tỷ lệ phần trăm phải phản ánh đúng trên 100% và số còn thiếu bằng 0', () => {
    const rate = calculateCompletionRate(5600, 5500);
    // 5600 / 5500 * 100 = 101.818... -> 101.82%
    expect(rate).toBe(101.82);

    const remaining = calculateRemainingCount(5600, 5500);
    expect(remaining).toBe(0);
  });

  it('Nguyên tắc quan trọng: Null KHÔNG PHẢI là 0', () => {
    expect(calculateCompletionRate(null, 5500)).toBeNull();
    expect(calculateCompletionRate(undefined, 5500)).toBeNull();
    expect(calculateRemainingCount(null, 5500)).toBeNull();
    expect(calculateRemainingCount(undefined, 5500)).toBeNull();

    // 0 là giá trị đo thực tế (chưa sản xuất được cái nào), còn null là chưa có dữ liệu đo
    expect(calculateCompletionRate(0, 5500)).toBe(0);
    expect(calculateRemainingCount(0, 5500)).toBe(5500);
  });

  it('Tính toán cụm KPI tổng thể với đầy đủ thuộc tính', () => {
    const kpis = calculateProductionKpis(5408, 5500);
    expect(kpis.target).toBe(5500);
    expect(kpis.finished).toBe(5408);
    expect(kpis.completionRatePct).toBe(98.33);
    expect(kpis.remainingCount).toBe(92);
    expect(kpis.isOverTarget).toBe(false);
    expect(kpis.statusLabel).toBe('Gần đạt kế hoạch');
  });

  it('Định dạng số theo chuẩn tiếng Việt, không tự ý biến null thành 0', () => {
    expect(formatMetricNumber(null, 0, 'cái')).toBe('--');
    expect(formatMetricNumber(undefined, 0, 'cái')).toBe('--');
    expect(formatPercentage(null)).toBe('--');

    // Số hợp lệ có đơn vị
    const formatted = formatMetricNumber(5408, 0, 'cái');
    expect(formatted).toContain('5.408');
    expect(formatted).toContain('cái');
  });

  it('Định dạng thời gian mô phỏng chính xác (171.000s)', () => {
    const formatted = formatSimulationTime(171000);
    expect(formatted).toContain('47h 30m 0s');
    expect(formatted).toContain('171.000s');
  });

  it('Đánh giá nút thắt: Processing gần 100% không tự chứng minh nút thắt nếu không có ứ đọng', () => {
    // Trường hợp máy chạy 99% nhưng hàng chờ rỗng (WIP = 0, Staytime = 2s) -> Không phải nút thắt
    const normalEval = evaluateBottleneck(99.0, 0.1, 2.0, 30);
    expect(normalEval.isBottleneck).toBe(false);
    expect(normalEval.severity).toBe('NORMAL');

    // Trường hợp CD05: Processing 99.89%, Avg WIP 22.31, Staytime 700.33s -> Nút thắt nghiêm trọng
    const bottleneckEval = evaluateBottleneck(99.89, 22.31, 700.33, 30);
    expect(bottleneckEval.isBottleneck).toBe(true);
    expect(bottleneckEval.severity).toBe('CRITICAL');
  });
});
