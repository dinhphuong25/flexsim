import { describe, it, expect } from 'vitest';
import {
  INITIAL_WORKFORCE_POSITIONS,
  getInitialSkillMatrix,
  getInitialChecklists,
  STANDARD_FLOATING_PROCEDURE,
} from '@/lib/workforce';
import { repository } from '@/lib/repository';

describe('Kiểm thử Quản lý Nhân lực & Phân công công việc (34 Vị trí)', () => {
  it('Yêu cầu 1 & 14: Đủ 34 vị trí, gồm đúng 30 vị trí cố định và 4 vị trí điều chuyển', () => {
    expect(INITIAL_WORKFORCE_POSITIONS.length).toBe(34);

    const fixed = INITIAL_WORKFORCE_POSITIONS.filter((p) => p.workerType === 'FIXED');
    const floating = INITIAL_WORKFORCE_POSITIONS.filter((p) => p.workerType === 'FLOATING');

    expect(fixed.length).toBe(30);
    expect(floating.length).toBe(4);
  });

  it('Yêu cầu 1 & 14: Tuyệt đối không sinh ra P_CD28, P_CD29, P_CD30 trong hệ thống trạm', () => {
    const invalidStations = ['P_CD28', 'P_CD29', 'P_CD30'];

    for (const pos of INITIAL_WORKFORCE_POSITIONS) {
      expect(invalidStations).not.toContain(pos.primaryStation);
      expect(invalidStations).not.toContain(pos.flexsimObjectName);
      if (pos.supportStation) {
        expect(invalidStations).not.toContain(pos.supportStation);
      }
    }
  });

  it('Yêu cầu 2: Phân công chính xác 30 vị trí cố định từ CN01 đến CN30 theo đúng bảng mẫu', () => {
    const expectedMapping: Record<string, { stage: string; station: string }> = {
      CN01: { stage: 'CD01', station: 'P_CD01' },
      CN02: { stage: 'CD02', station: 'P_CD02A' },
      CN03: { stage: 'CD02', station: 'P_CD02B' },
      CN04: { stage: 'CD03', station: 'P_CD03' },
      CN05: { stage: 'CD04', station: 'P_CD04A' },
      CN06: { stage: 'CD05', station: 'P_CD05' },
      CN07: { stage: 'CD06', station: 'P_CD06' },
      CN08: { stage: 'CD07', station: 'P_CD07' },
      CN09: { stage: 'CD08', station: 'P_CD08' },
      CN10: { stage: 'CD09', station: 'P_CD09' },
      CN11: { stage: 'CD10', station: 'P_CD10' },
      CN12: { stage: 'CD11', station: 'P_CD11A' },
      CN13: { stage: 'CD12', station: 'P_CD12' },
      CN14: { stage: 'CD13', station: 'P_CD13A' },
      CN15: { stage: 'CD14', station: 'P_CD14' },
      CN16: { stage: 'CD15', station: 'P_CD15' },
      CN17: { stage: 'CD16', station: 'P_CD16A' },
      CN18: { stage: 'CD17', station: 'P_CD17' },
      CN19: { stage: 'CD18', station: 'P_CD18' },
      CN20: { stage: 'CD19', station: 'P_CD19' },
      CN21: { stage: 'CD20', station: 'P_CD20' },
      CN22: { stage: 'CD21', station: 'P_CD21' },
      CN23: { stage: 'CD22', station: 'P_CD22' },
      CN24: { stage: 'CD23', station: 'P_CD23A' },
      CN25: { stage: 'CD23', station: 'P_CD23B' },
      CN26: { stage: 'CD24', station: 'P_CD24' },
      CN27: { stage: 'CD25', station: 'P_CD25' },
      CN28: { stage: 'CD26', station: 'P_CD26' },
      CN29: { stage: 'CD27', station: 'P_CD27A' },
      CN30: { stage: 'CD27', station: 'P_CD27B' },
    };

    for (const [code, expected] of Object.entries(expectedMapping)) {
      const pos = INITIAL_WORKFORCE_POSITIONS.find((p) => p.positionCode === code);
      expect(pos, `Vị trí ${code} phải tồn tại`).toBeDefined();
      expect(pos?.stageCode).toBe(expected.stage);
      expect(pos?.primaryStation).toBe(expected.station);
      expect(pos?.flexsimObjectName).toBe(expected.station);
      expect(pos?.workerType).toBe('FIXED');
    }
  });

  it('Yêu cầu 3: Bốn vị trí điều chuyển CN31..CN34 đúng trạm gốc, trạm hỗ trợ và FlexSim Operator', () => {
    const cn31 = INITIAL_WORKFORCE_POSITIONS.find((p) => p.positionCode === 'CN31');
    expect(cn31?.flexsimOperatorCode).toBe('OP_04_05');
    expect(cn31?.primaryStation).toBe('P_CD04B');
    expect(cn31?.supportStation).toBe('P_CD05B_HOTRO');

    const cn32 = INITIAL_WORKFORCE_POSITIONS.find((p) => p.positionCode === 'CN32');
    expect(cn32?.flexsimOperatorCode).toBe('OP_11_12');
    expect(cn32?.primaryStation).toBe('P_CD11B');
    expect(cn32?.supportStation).toBe('P_CD12B_HOTRO');

    const cn33 = INITIAL_WORKFORCE_POSITIONS.find((p) => p.positionCode === 'CN33');
    expect(cn33?.flexsimOperatorCode).toBe('OP_13_14');
    expect(cn33?.primaryStation).toBe('P_CD13B');
    expect(cn33?.supportStation).toBe('P_CD14B_HOTRO');

    const cn34 = INITIAL_WORKFORCE_POSITIONS.find((p) => p.positionCode === 'CN34');
    expect(cn34?.flexsimOperatorCode).toBe('OP_16_17');
    expect(cn34?.primaryStation).toBe('P_CD16B');
    expect(cn34?.supportStation).toBe('P_CD17B_HOTRO');
  });

  it('Yêu cầu 6 & 7: Mỗi vị trí có bản mô tả công việc, nguồn nhận BTP và chuyển giao cụ thể', () => {
    for (const pos of INITIAL_WORKFORCE_POSITIONS) {
      expect(pos.jobDescription).toBeDefined();
      expect(pos.jobDescription.purpose.length).toBeGreaterThan(10);
      expect(pos.jobDescription.inputSource.length).toBeGreaterThan(3);
      expect(pos.jobDescription.outputTarget.length).toBeGreaterThan(3);
      expect(pos.jobDescription.shiftStartTasks.length).toBeGreaterThanOrEqual(1);
      expect(pos.jobDescription.routineTasks.length).toBeGreaterThanOrEqual(2);
      expect(pos.jobDescription.qualityCheckpoints.length).toBeGreaterThanOrEqual(1);
      expect(pos.jobDescription.issueHandling).toBeDefined();

      if (pos.workerType === 'FLOATING') {
        expect(pos.jobDescription.floatingProcedure).toEqual(STANDARD_FLOATING_PROCEDURE);
        expect(pos.jobDescription.supportTasks?.length).toBeGreaterThan(0);
      }
    }
  });

  it('Yêu cầu 9: Ma trận kỹ năng khởi tạo đủ 34 vị trí x 27 công đoạn, mặc định "Chưa đánh giá" cho công đoạn khác', () => {
    const matrix = getInitialSkillMatrix();
    const positionCodes = Object.keys(matrix);
    expect(positionCodes.length).toBe(34);

    // CN01 tại CD01 là THUC_HIEN_DUOC, CD02 đến CD27 là CHUA_DANH_GIA
    expect(matrix['CN01']['CD01']).toBe('THUC_HIEN_DUOC');
    expect(matrix['CN01']['CD02']).toBe('CHUA_DANH_GIA');
    expect(matrix['CN01']['CD27']).toBe('CHUA_DANH_GIA');

    // CN31 tại CD04 là THUC_HIEN_DUOC, CD05 là CO_THE_HO_TRO
    expect(matrix['CN31']['CD04']).toBe('THUC_HIEN_DUOC');
    expect(matrix['CN31']['CD05']).toBe('CO_THE_HO_TRO');
    expect(matrix['CN31']['CD06']).toBe('CHUA_DANH_GIA');
  });

  it('Yêu cầu 10: Checklist nhiệm vụ khởi tạo đủ 7 bước kiểm cho từng vị trí', () => {
    const checklists = getInitialChecklists();
    // 34 vị trí x 7 bước = 238 mục checklist
    expect(checklists.length).toBe(34 * 7);

    const cn01Checklist = checklists.filter((c) => c.positionCode === 'CN01');
    expect(cn01Checklist.length).toBe(7);
    expect(cn01Checklist[0].status).toBe('CHUA_BAT_DAU');
  });

  it('Yêu cầu 11 & 12: Repository cập nhật vị trí, ma trận kỹ năng và checklist thành công', async () => {
    const positions = await repository.getAllWorkforcePositions();
    expect(positions.length).toBe(34);

    // Cập nhật phân công
    const updated = await repository.updateWorkforcePosition('CN01', {
      displayName: 'Vị trí CN01 - Trưởng Chuyền',
    }, 'Test Admin');
    expect(updated?.displayName).toBe('Vị trí CN01 - Trưởng Chuyền');

    // Cập nhật kỹ năng
    const skillOk = await repository.updateSkill('CN01', 'CD02', 'CO_THE_HO_TRO', 'Test Admin');
    expect(skillOk).toBe(true);
    const matrix = await repository.getSkillMatrix();
    expect(matrix['CN01']['CD02']).toBe('CO_THE_HO_TRO');

    // Cập nhật checklist
    const checkItem = await repository.updateChecklistStatus('chk_cn01_1', 'HOAN_TAT', 'Đã kiểm tra máy', 'Test Admin');
    expect(checkItem?.status).toBe('HOAN_TAT');
  });
});
