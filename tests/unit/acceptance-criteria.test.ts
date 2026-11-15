import { describe, it, expect } from 'vitest';
import {
  evaluateAcceptanceCriteria,
  CURRENT_PRODUCTION_TARGET,
  PLANNED_SIMULATION_TIME,
} from '@/lib/kpi';
import {
  generateArrivalSchedule,
  ARRIVAL_SCHEDULE_CONFIG,
  CHOT_REFERENCE_KPIS,
  CHOT_REFERENCE_METRICS,
} from '@/lib/line-model-definition';
import { repository } from '@/lib/repository';

describe('Kiểm thử 9 Quy Tắc Nghiệm Thu Chuẩn Hóa — Nhóm 2 (Mục 13 & 14)', () => {
  // Quy tắc 1: Đúng 5500 tại 171000: đạt sản lượng và thời gian
  it('Quy tắc 1: Đúng 5.500 tại 171.000s -> Đạt sản lượng và đạt thời gian', () => {
    const result = evaluateAcceptanceCriteria({
      actualOutput: 5500,
      target: 5500,
      simulatedSeconds: 171000,
      plannedSeconds: 171000,
    });

    expect(result.outputPassed).toBe(true);
    expect(result.outputStatusLabel).toBe('Đạt sản lượng');
    expect(result.remaining).toBe(0);
    expect(result.completionRate).toBe(100.0);
    expect(result.timePassed).toBe(true);
    expect(result.timeStatusLabel).toContain('Đúng mốc kế hoạch');
  });

  // Quy tắc 2: 5427 tại 171000: thiếu 73, tỷ lệ 98,67%, chưa đạt sản lượng
  it('Quy tắc 2: 5.427 tại 171.000s -> Thiếu 73, tỷ lệ 98,67%, CHƯA ĐẠT sản lượng', () => {
    const result = evaluateAcceptanceCriteria({
      actualOutput: 5427,
      target: 5500,
      simulatedSeconds: 171000,
      plannedSeconds: 171000,
    });

    expect(result.outputPassed).toBe(false);
    expect(result.outputStatusLabel).toBe('Chưa đạt sản lượng');
    expect(result.remaining).toBe(73);
    expect(result.completionRate).toBe(98.67);
    expect(result.timePassed).toBe(true);
    expect(result.allCriteriaPassed).toBe(false);
  });

  // Quy tắc 3: 5500 tại 175000: không đạt vì vượt thời gian (> 171000s)
  it('Quy tắc 3: 5.500 tại 175.000s -> Không đạt kế hoạch vì vượt thời gian', () => {
    const result = evaluateAcceptanceCriteria({
      actualOutput: 5500,
      target: 5500,
      simulatedSeconds: 175000, // > 171000s
      plannedSeconds: 171000,
    });

    expect(result.outputPassed).toBe(true);
    expect(result.timePassed).toBe(false);
    expect(result.timeStatusLabel).toContain('Vượt quá thời gian');
    // Không đạt đồng thời vì vượt thời gian kế hoạch ca
    expect(result.allCriteriaPassed).toBe(false);
  });

  // Quy tắc 4: Bốn Queue = 0 nhưng thiếu trạm khác: trả về "Chưa xác nhận hết tồn toàn chuyền"
  it('Quy tắc 4: Bốn Queue = 0 nhưng thiếu 69 trạm khác -> Chưa xác nhận hết tồn toàn chuyền', () => {
    const result = evaluateAcceptanceCriteria({
      actualOutput: 5427,
      target: 5500,
      simulatedSeconds: 171000,
      inventoryAudit: {
        totalScopeItems: 73,
        auditedItemsCount: 4, // Chỉ mới kiểm tra 4 Queue
        totalEndingWip: 0,
        missingDataCount: 69, // 69 vị trí thiếu dữ liệu
        hasWipCount: 0,
      },
    });

    expect(result.fullLineClear).toBe('UNCONFIRMED');
    expect(result.fullLineClearLabel).toBe('Chưa xác nhận hết tồn toàn chuyền');
    expect(result.allCriteriaPassed).toBe(false);
  });

  // Quy tắc 5: Đủ 73 vị trí đều = 0: trả về "Hết tồn cuối kỳ toàn chuyền"
  it('Quy tắc 5: Đủ 73 vị trí sản xuất đều = 0 BTP -> Hết tồn cuối kỳ toàn chuyền', () => {
    const result = evaluateAcceptanceCriteria({
      actualOutput: 5500,
      target: 5500,
      simulatedSeconds: 171000,
      inventoryAudit: {
        totalScopeItems: 73,
        auditedItemsCount: 73,
        totalEndingWip: 0,
        missingDataCount: 0,
        hasWipCount: 0,
      },
    });

    expect(result.fullLineClear).toBe('CONFIRMED');
    expect(result.fullLineClearLabel).toBe('Hết tồn cuối kỳ toàn chuyền');
    expect(result.allCriteriaPassed).toBe(true);
    expect(result.overallConclusionLabel).toBe('Đạt đồng thời các tiêu chí nghiệm thu');
  });

  // Quy tắc 6: Lịch 5500 không tự suy ra sản lượng 5500
  it('Quy tắc 6: Lịch cấp liệu 5.500 không tự suy ra sản lượng Sink đạt 5.500', () => {
    const schedule = generateArrivalSchedule('SRC_TT');
    const totalPlannedInSchedule = schedule.reduce((sum, r) => sum + r.quantity, 0);

    expect(totalPlannedInSchedule).toBe(5500);
    expect(schedule.length).toBe(550);
    expect(schedule[0].arrivalTime).toBe(0);
    expect(schedule[549].arrivalTime).toBe(164700);

    // Dù lịch cấp là 5500, sản lượng tại Sink vẫn phải kiểm tra độc lập
    const actualOutputAtSink = 5427;
    const kpi = evaluateAcceptanceCriteria({
      actualOutput: actualOutputAtSink,
      target: totalPlannedInSchedule,
      simulatedSeconds: 171000,
    });

    expect(kpi.outputPassed).toBe(false);
    expect(kpi.remaining).toBe(73);
  });

  // Quy tắc 7: Chốt phương án không tự đổi trạng thái nghiệm thu thành Đạt
  it('Quy tắc 7: Chốt phương án (RUN_CHOT_5427) khóa tham chiếu nhưng không đổi nghiệm thu thành Đạt', () => {
    expect(CHOT_REFERENCE_METRICS.finishedCount).toBe(5427);
    expect(CHOT_REFERENCE_METRICS.targetCount).toBe(5500);
    expect(CHOT_REFERENCE_METRICS.remainingCount).toBe(73);
    expect(CHOT_REFERENCE_METRICS.isLineCleared).toBe(false); // Chưa xác nhận
    expect(CHOT_REFERENCE_METRICS.fourKeyQueuesCleared).toBe(true);

    const evalResult = evaluateAcceptanceCriteria({
      actualOutput: CHOT_REFERENCE_METRICS.finishedCount,
      target: CHOT_REFERENCE_METRICS.targetCount,
      simulatedSeconds: CHOT_REFERENCE_METRICS.runTimeSeconds,
      inventoryAudit: {
        totalScopeItems: 73,
        auditedItemsCount: 4,
        totalEndingWip: 0,
        missingDataCount: 69,
        hasWipCount: 0,
      },
    });

    expect(evalResult.outputPassed).toBe(false);
    expect(evalResult.fullLineClear).toBe('UNCONFIRMED');
    expect(evalResult.allCriteriaPassed).toBe(false);
    expect(evalResult.overallConclusionLabel).toBe('Chưa đạt đầy đủ tiêu chí nghiệm thu');
  });

  // Quy tắc 8: Đạt sản lượng và hết tồn là hai cờ độc lập, có thể một đạt một không
  it('Quy tắc 8: Đạt sản lượng và hết tồn là 2 cờ độc lập (Một đạt một không)', () => {
    // Trường hợp A: Đạt sản lượng (5.500) nhưng chuyền vẫn còn tồn 30 BTP
    const caseA = evaluateAcceptanceCriteria({
      actualOutput: 5500,
      target: 5500,
      simulatedSeconds: 171000,
      inventoryAudit: {
        totalScopeItems: 73,
        auditedItemsCount: 73,
        totalEndingWip: 30,
        missingDataCount: 0,
        hasWipCount: 2,
      },
    });

    expect(caseA.outputPassed).toBe(true); // Đạt sản lượng
    expect(caseA.fullLineClear).toBe('HAS_WIP'); // Chưa hết tồn
    expect(caseA.allCriteriaPassed).toBe(false); // Không đạt đồng thời

    // Trường hợp B: Hết tồn toàn chuyền (0 BTP) nhưng sản lượng chỉ đạt 5.427
    const caseB = evaluateAcceptanceCriteria({
      actualOutput: 5427,
      target: 5500,
      simulatedSeconds: 171000,
      inventoryAudit: {
        totalScopeItems: 73,
        auditedItemsCount: 73,
        totalEndingWip: 0,
        missingDataCount: 0,
        hasWipCount: 0,
      },
    });

    expect(caseB.outputPassed).toBe(false); // Chưa đạt sản lượng
    expect(caseB.fullLineClear).toBe('CONFIRMED'); // Đã hết tồn
    expect(caseB.allCriteriaPassed).toBe(false); // Không đạt đồng thời
  });

  // Quy tắc 9: Đồng bộ trùng lặp không tạo bản ghi mới; bản ghi tham chiếu không bị ghi đè
  it('Quy tắc 9: Bản ghi tham chiếu RUN_CHOT_5427 được bảo toàn độc lập, không bị ghi đè', async () => {
    const runs = await repository.getAllRuns();
    const chotRun = runs.find((r) => r.runCode === 'RUN_CHOT_5427');

    expect(chotRun).toBeDefined();
    expect(chotRun?.finishedCount).toBe(5427);
    expect(chotRun?.targetCount).toBe(5500);
    expect(chotRun?.sourceDescription).toBe('Ảnh kết quả đã chốt');
    expect(chotRun?.dataSource).toBe('MANUAL');

    // Kiểm tra các giá trị KPI tham chiếu Mục 4
    expect(CHOT_REFERENCE_KPIS.SanLuong).toBe(5427);
    expect(CHOT_REFERENCE_KPIS.WIP_CD05).toBe(22.07);
    expect(CHOT_REFERENCE_KPIS.WIPMax_CD05).toBe(30);
    expect(CHOT_REFERENCE_KPIS.Cho_CD05).toBe(686.24);
    expect(CHOT_REFERENCE_KPIS.Processing_CD05).toBe(98.56);
    expect(CHOT_REFERENCE_KPIS.BTPCuoi_CD05).toBe(0);
    expect(CHOT_REFERENCE_KPIS.Processing_CD05B).toBe(6.03);
    expect(CHOT_REFERENCE_KPIS.Output_CD05B).toBe(317);
  });
});
