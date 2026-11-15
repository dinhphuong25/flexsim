import { describe, it, expect } from 'vitest';
import {
  calculateCompletionRate,
  calculateRemainingCount,
  calculateProductionKpis,
  evaluateProductionOutput,
  formatMetricNumber,
  formatPercentage,
  formatSimulationTime,
  evaluateBottleneck,
  CURRENT_PRODUCTION_TARGET,
} from '@/lib/kpi';

describe('Quy tắc KPI và Tiêu chí Hoàn thành Sản lượng (Mục tiêu 5.500 sản phẩm / 171.000s)', () => {
  it('Kiểm thử bắt buộc 1: 5.100 sản phẩm -> chưa đạt mục tiêu, còn thiếu 400', () => {
    const kpi = evaluateProductionOutput(5100);
    expect(kpi.isCompleted).toBe(false);
    expect(kpi.statusLabel).toBe('Chưa đạt mục tiêu');
    expect(kpi.remaining).toBe(400);
    expect(kpi.remainingCount).toBe(400);
    expect(kpi.excess).toBe(0);
    expect(kpi.aboveThreshold).toBe(0);
    expect(kpi.completionRate).toBe(92.73); // 5100 / 5500 * 100 = 92.727... -> 92.73%
  });

  it('Kiểm thử bắt buộc 2: 5.408 sản phẩm (Lượt chạy FlexSim thực tế) -> chưa đạt mục tiêu, còn thiếu 92, hoàn thành 98,33%', () => {
    const kpi = evaluateProductionOutput(5408);
    expect(kpi.isCompleted).toBe(false);
    expect(kpi.statusLabel).toBe('Chưa đạt mục tiêu');
    expect(kpi.remaining).toBe(92);
    expect(kpi.remainingCount).toBe(92);
    expect(kpi.excess).toBe(0);
    expect(kpi.aboveThreshold).toBe(0);
    expect(kpi.completionRate).toBe(98.33); // 5408 / 5500 * 100 = 98.327... -> 98.33%
    expect(kpi.requirementLabel).toBe('5.500 sản phẩm');
  });

  it('Kiểm thử bắt buộc 3: 5.499 sản phẩm -> chưa đạt mục tiêu, còn thiếu 1', () => {
    const kpi = evaluateProductionOutput(5499);
    expect(kpi.isCompleted).toBe(false);
    expect(kpi.statusLabel).toBe('Chưa đạt mục tiêu');
    expect(kpi.remaining).toBe(1);
    expect(kpi.remainingCount).toBe(1);
    expect(kpi.excess).toBe(0);
    expect(kpi.completionRate).toBe(99.98); // 5499 / 5500 * 100 = 99.9818... -> 99.98%
  });

  it('Kiểm thử bắt buộc 4: 5.500 sản phẩm -> đúng 5.500 là HOÀN THÀNH, thiếu 0', () => {
    const kpi = evaluateProductionOutput(5500);
    expect(kpi.isCompleted).toBe(true);
    expect(kpi.statusLabel).toBe('Hoàn thành');
    expect(kpi.remaining).toBe(0);
    expect(kpi.remainingCount).toBe(0);
    expect(kpi.excess).toBe(0);
    expect(kpi.aboveThreshold).toBe(0);
    expect(kpi.completionRate).toBe(100.0);
  });

  it('Kiểm thử bắt buộc 5: 5.501 sản phẩm -> hoàn thành, vượt 1', () => {
    const kpi = evaluateProductionOutput(5501);
    expect(kpi.isCompleted).toBe(true);
    expect(kpi.statusLabel).toBe('Hoàn thành');
    expect(kpi.remaining).toBe(0);
    expect(kpi.remainingCount).toBe(0);
    expect(kpi.excess).toBe(1);
    expect(kpi.aboveThreshold).toBe(1);
    expect(kpi.completionRate).toBe(100.02); // 5501 / 5500 * 100 = 100.018... -> 100.02%
  });

  it('Kiểm thử bắt buộc 6: Null / Undefined -> hiển thị "Chưa có dữ liệu", KHÔNG chuyển thành 0 hoặc đánh dấu hoàn thành', () => {
    const nullKpi = evaluateProductionOutput(null);
    expect(nullKpi.finishedOutput).toBeNull();
    expect(nullKpi.isCompleted).toBe(false);
    expect(nullKpi.remaining).toBeNull();
    expect(nullKpi.excess).toBeNull();
    expect(nullKpi.completionRate).toBeNull();
    expect(nullKpi.statusLabel).toBe('Chưa có dữ liệu');

    const undefinedKpi = evaluateProductionOutput(undefined);
    expect(undefinedKpi.finishedOutput).toBeNull();
    expect(undefinedKpi.isCompleted).toBe(false);
    expect(undefinedKpi.statusLabel).toBe('Chưa có dữ liệu');
  });

  it('Định dạng hiển thị tiếng Việt và số liệu an toàn', () => {
    expect(formatMetricNumber(null, 0, 'cái')).toBe('--');
    expect(formatMetricNumber(undefined, 0, 'cái')).toBe('--');
    expect(formatPercentage(null)).toBe('--');

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
    const normalEval = evaluateBottleneck(99.0, 0.1, 2.0, 30);
    expect(normalEval.isBottleneck).toBe(false);

    const bottleneckEval = evaluateBottleneck(99.89, 22.31, 700.33, 30);
    expect(bottleneckEval.isBottleneck).toBe(true);
    expect(bottleneckEval.severity).toBe('CRITICAL');
  });
});
