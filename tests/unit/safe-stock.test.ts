import { describe, it, expect } from 'vitest';
import {
  classifySafeStock,
  validateSafeStockConfig,
  evaluateOverallStockCompliance,
  SafeStockThresholdConfig,
} from '@/lib/safe-stock';

describe('Phân hệ Ngưỡng Tồn BTP An Toàn (Safe Stock Thresholds)', () => {
  // Bộ cấu hình kiểm thử theo đúng yêu cầu mục 6
  const testConfig: SafeStockThresholdConfig = {
    id: 'cfg_test_01',
    targetCode: 'TEST_STAGE',
    targetType: 'STAGE',
    minStock: null,
    safeStockMax: 10,
    criticalStock: 20,
    consecutiveSecondsBeforeAlert: 60,
    scope: 'END_OF_RUN',
    modelVersion: 'v1.0-baseline',
    scenarioCode: 'DEFAULT',
    effectiveFrom: '2026-11-15T00:00:00Z',
    basisNotes: 'Cấu hình kiểm thử chuẩn theo yêu cầu mục 6',
    updatedBy: 'admin@vietthanh.vn',
    updatedAt: '2026-11-15T00:00:00Z',
  };

  it('Kiểm thử 1: current = null -> Chưa có dữ liệu', () => {
    const res = classifySafeStock(null, testConfig);
    expect(res.status).toBe('CHUA_CO_DU_LIEU');
    expect(res.statusLabel).toBe('Chưa có dữ liệu');
    expect(res.excessStock).toBeNull();
    expect(res.currentContent).toBeNull();
  });

  it('Kiểm thử 2: current = 0 -> Trong ngưỡng (khi không bật minStock)', () => {
    const res = classifySafeStock(0, testConfig);
    expect(res.status).toBe('TRONG_NGUONG');
    expect(res.statusLabel).toBe('Trong ngưỡng');
    expect(res.excessStock).toBe(0);
    expect(res.currentContent).toBe(0);
  });

  it('Kiểm thử 3: current = 10 -> đúng 10 là Trong ngưỡng', () => {
    const res = classifySafeStock(10, testConfig);
    expect(res.status).toBe('TRONG_NGUONG');
    expect(res.statusLabel).toBe('Trong ngưỡng');
    expect(res.excessStock).toBe(0);
  });

  it('Kiểm thử 4: current = 11 -> Vượt ngưỡng, vượt 1', () => {
    const res = classifySafeStock(11, testConfig);
    expect(res.status).toBe('VUOT_NGUONG');
    expect(res.statusLabel).toBe('Vượt ngưỡng');
    expect(res.excessStock).toBe(1); // 11 - 10 = 1
  });

  it('Kiểm thử 5: current = 20 -> Mức nghiêm trọng (ưu tiên cao hơn vượt ngưỡng)', () => {
    const res = classifySafeStock(20, testConfig);
    expect(res.status).toBe('MUC_NGHIEM_TRONG');
    expect(res.statusLabel).toBe('Mức nghiêm trọng');
    expect(res.excessStock).toBe(10); // 20 - 10 = 10
  });

  it('Kiểm thử 6: Chưa cấu hình ngưỡng -> Chưa đánh giá', () => {
    const res = classifySafeStock(15, null);
    expect(res.status).toBe('CHUA_DANH_GIA');
    expect(res.statusLabel).toBe('Chưa đánh giá');
    expect(res.excessStock).toBeNull();
    expect(res.isConfigured).toBe(false);
  });

  it('Kiểm thử 7: minStock có bật -> Phân loại dưới mức đệm khi trong ca và bỏ qua khi cuối kỳ', () => {
    const configWithMin: SafeStockThresholdConfig = {
      ...testConfig,
      minStock: 3,
    };

    // Trong lượt: current = 2 < 3 -> Dưới mức đệm
    const resInRun = classifySafeStock(2, configWithMin, { isEndOfRun: false });
    expect(resInRun.status).toBe('DUOI_MUC_DEM');
    expect(resInRun.statusLabel).toBe('Dưới mức đệm');

    // Cuối kỳ giải phóng chuyền: không coi là lỗi
    const resEndOfRun = classifySafeStock(2, configWithMin, { isEndOfRun: true });
    expect(resEndOfRun.status).toBe('TRONG_NGUONG');
    expect(resEndOfRun.statusLabel).toBe('Trong ngưỡng');
  });

  it('Kiểm thử 8: Validation cấu hình 0 <= minStock <= safeStockMax < criticalStock', () => {
    // Hợp lệ
    expect(validateSafeStockConfig({ safeStockMax: 10, minStock: 2, criticalStock: 20 }).valid).toBe(true);
    expect(validateSafeStockConfig({ safeStockMax: 10, minStock: null, criticalStock: null }).valid).toBe(true);

    // Không hợp lệ: minStock > safeStockMax
    const invalidMin = validateSafeStockConfig({ safeStockMax: 10, minStock: 12, criticalStock: 20 });
    expect(invalidMin.valid).toBe(false);
    expect(invalidMin.error).toContain('không được vượt quá ngưỡng an toàn');

    // Không hợp lệ: criticalStock <= safeStockMax
    const invalidCrit = validateSafeStockConfig({ safeStockMax: 10, criticalStock: 10 });
    expect(invalidCrit.valid).toBe(false);
    expect(invalidCrit.error).toContain('phải lớn hơn ngưỡng tối đa an toàn');

    // Không hợp lệ: Số thập phân (không phải số nguyên)
    const invalidFloat = validateSafeStockConfig({ safeStockMax: 10.5 });
    expect(invalidFloat.valid).toBe(false);
    expect(invalidFloat.error).toContain('số nguyên');
  });

  it('Kiểm thử 9: Đánh giá mục tiêu độc lập giữa sản lượng (>= 5.500) và tồn an toàn', () => {
    // Trường hợp 1: Đạt sản lượng (5.500) và Tồn trong ngưỡng
    const eval1 = evaluateOverallStockCompliance(
      [{ targetCode: 'CD01', currentContent: 5, config: testConfig }],
      5500,
      5500
    );
    expect(eval1.isProductionCompleted).toBe(true);
    expect(eval1.isAllStockWithinLimits).toBe(true);
    expect(eval1.overallConclusionLabel).toBe('Đạt sản lượng và tồn trong ngưỡng');

    // Trường hợp 2: Chưa đạt sản lượng (5.408) nhưng Tồn trong ngưỡng
    const eval2 = evaluateOverallStockCompliance(
      [{ targetCode: 'CD01', currentContent: 5, config: testConfig }],
      5408,
      5500
    );
    expect(eval2.isProductionCompleted).toBe(false);
    expect(eval2.isAllStockWithinLimits).toBe(true);
    expect(eval2.overallConclusionLabel).toBe('Chưa đạt sản lượng, tồn trong ngưỡng');

    // Trường hợp 3: Chưa đủ dữ liệu
    const eval3 = evaluateOverallStockCompliance(
      [{ targetCode: 'CD01', currentContent: null, config: testConfig }],
      5500,
      5500
    );
    expect(eval3.hasSufficientData).toBe(false);
    expect(eval3.overallConclusionLabel).toBe('Chưa đủ dữ liệu đánh giá tồn toàn chuyền');
  });
});
