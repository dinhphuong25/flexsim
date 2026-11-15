import { describe, it, expect } from 'vitest';
import { performInventoryAudit } from '@/lib/inventory-audit';

describe('Kiểm tra điều kiện hết tồn toàn chuyền (Mục 16 & 20)', () => {
  const baseObjects = [
    { flexsimName: 'Q_CD01', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
    { flexsimName: 'P_CD01', objectType: 'PROCESSOR', isMandatoryScope: true, currentContent: 0 },
    { flexsimName: 'Q_CD05', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 22 },
    { flexsimName: 'P_CD05', objectType: 'PROCESSOR', isMandatoryScope: true, currentContent: 0 },
    { flexsimName: 'R01', objectType: 'COMBINER', isMandatoryScope: true, currentContent: 0 },
  ];

  it('Kết luận 1: CON_TON khi còn tồn đọng > 0 tại bất kỳ đối tượng thuộc phạm vi', () => {
    const result = performInventoryAudit({
      objects: baseObjects,
      runEndTimeSeconds: 171000,
      isMaterialReleaseComplete: true,
      isTransportCleared: true,
    });

    expect(result.conclusion).toBe('CON_TON');
    expect(result.totalRemainingFlowItems).toBe(22);
    expect(result.objectsWithWipCount).toBe(1);
    expect(result.itemsWithWip[0].flexsimName).toBe('Q_CD05');
  });

  it('Kết luận 3: CHUA_DU_DU_LIEU khi có đối tượng bắt buộc thiếu số liệu (null / undefined)', () => {
    const objectsWithMissing = [
      { flexsimName: 'Q_CD01', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'P_CD01', objectType: 'PROCESSOR', isMandatoryScope: true, currentContent: null }, // Thiếu
      { flexsimName: 'Q_CD05', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
    ];

    const result = performInventoryAudit({
      objects: objectsWithMissing,
      runEndTimeSeconds: 171000,
      isMaterialReleaseComplete: true,
      isTransportCleared: true,
    });

    expect(result.conclusion).toBe('CHUA_DU_DU_LIEU');
    expect(result.missingDataObjectsCount).toBe(1);
    expect(result.missingDataItems).toContain('P_CD01');
  });

  it('Kết luận 2: HET_TON_TRONG_PHAM_VI khi các trạm đo có tồn = 0 nhưng chưa đóng cấp liệu hoặc chưa kiểm tra vận chuyển', () => {
    const zeroWipObjects = [
      { flexsimName: 'Q_CD01', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'P_CD01', objectType: 'PROCESSOR', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'Q_CD05', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
    ];

    // Lịch cấp liệu chưa hoàn tất
    const resultIncompleteRelease = performInventoryAudit({
      objects: zeroWipObjects,
      runEndTimeSeconds: 171000,
      isMaterialReleaseComplete: false,
      isTransportCleared: true,
    });
    expect(resultIncompleteRelease.conclusion).toBe('HET_TON_TRONG_PHAM_VI');

    // Hàng vận chuyển (transporter) chưa được xác nhận kiểm tra
    const resultUninspectedTransport = performInventoryAudit({
      objects: zeroWipObjects,
      runEndTimeSeconds: 171000,
      isMaterialReleaseComplete: true,
      isTransportCleared: false,
    });
    expect(resultUninspectedTransport.conclusion).toBe('HET_TON_TRONG_PHAM_VI');
  });

  it('Kết luận 4: HET_TON_TOAN_CHUYEN khi thỏa mãn toàn diện 7 tiêu chuẩn', () => {
    const allZeroObjects = [
      { flexsimName: 'Q_CD01', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'P_CD01', objectType: 'PROCESSOR', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'Q_CD05', objectType: 'QUEUE', isMandatoryScope: true, currentContent: 0 },
      { flexsimName: 'R01', objectType: 'COMBINER', isMandatoryScope: true, currentContent: 0 },
    ];

    const result = performInventoryAudit({
      objects: allZeroObjects,
      runEndTimeSeconds: 171000,
      isMaterialReleaseComplete: true,
      isTransportCleared: true,
      hasUnreleasedMandatoryFeed: false,
    });

    expect(result.conclusion).toBe('HET_TON_TOAN_CHUYEN');
    expect(result.totalRemainingFlowItems).toBe(0);
    expect(result.isAllMandatoryInspected).toBe(true);
  });
});
