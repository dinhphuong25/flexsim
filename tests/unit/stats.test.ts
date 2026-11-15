import { describe, it, expect } from 'vitest';
import {
  calculateReplicationStats,
  comparePairedReplications,
  getStudentTCritical,
} from '@/lib/stats';

describe('Thống kê mô tả và khoảng tin cậy 95% Student-t (Mục 10 & 20)', () => {
  it('Tra cứu hệ số Student-t critical chính xác theo bậc tự do df', () => {
    // df = 4 (n = 5): t = 2.776
    expect(getStudentTCritical(4)).toBe(2.776);
    // df = 9 (n = 10): t = 2.262
    expect(getStudentTCritical(9)).toBe(2.262);
    // df > 120: xấp xỉ 1.96
    expect(getStudentTCritical(200)).toBe(1.96);
  });

  it('Tính toán đầy đủ thống kê mẫu và khoảng tin cậy 95% khi n = 5', () => {
    const samples = [5408, 5412, 5395, 5420, 5405];
    const stats = calculateReplicationStats(samples);

    expect(stats.n).toBe(5);
    expect(stats.mean).toBe(5408);
    expect(stats.isReliable).toBe(true);
    expect(stats.confidenceInterval95).not.toBeNull();

    if (stats.confidenceInterval95) {
      const [lower, upper] = stats.confidenceInterval95;
      expect(lower).toBeLessThan(stats.mean!);
      expect(upper).toBeGreaterThan(stats.mean!);
    }
  });

  it('Cảnh báo khi số lần lặp ít (n < 3 không đủ độ tin cậy để tính khoảng tin cậy)', () => {
    const singleSample = [5408];
    const statsSingle = calculateReplicationStats(singleSample);
    expect(statsSingle.confidenceInterval95).toBeNull();
    expect(statsSingle.warning).toContain('Chỉ có 1 lần lặp');

    const emptyStats = calculateReplicationStats([]);
    expect(emptyStats.mean).toBeNull();
    expect(emptyStats.confidenceInterval95).toBeNull();
  });

  it('Phân tích ghép cặp (Paired t-test) giữa phương án cải tiến và đối chứng cùng seed', () => {
    const baseline = [5408, 5412, 5395, 5420, 5405];
    const improved = [5510, 5525, 5505, 5530, 5518];

    const paired = comparePairedReplications(baseline, improved);
    expect(paired).not.toBeNull();
    expect(paired?.nPairs).toBe(5);
    expect(paired?.meanDifference).toBeGreaterThan(100);
    expect(paired?.pValueSignificant).toBe(true);
    expect(paired?.conclusion).toContain('có ý nghĩa thống kê');
  });
});
