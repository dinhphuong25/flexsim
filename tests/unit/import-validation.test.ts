import { describe, it, expect } from 'vitest';
import { validateImportRow } from '@/lib/import-validator';
import { sanitizeCsvCell } from '@/lib/export-utils';

describe('Kiểm tra dữ liệu nhập CSV/XLSX dự phòng (Mục 15 & 20)', () => {
  it('Chấp nhận dòng dữ liệu hợp lệ', () => {
    const validRow = {
      stage_code: 'CD05',
      input: 5500,
      output: 5478,
      current: 22,
      avg_wip: 22.31,
      max_wip: 30,
      wait_seconds: 700.33,
      processing_pct: 99.89,
    };

    const errors = validateImportRow(validRow, 1);
    expect(errors.length).toBe(0);
  });

  it('Phát hiện và cảnh báo Formula / Macro Injection (=, +, -, @)', () => {
    const maliciousRow = {
      stage_code: '=cmd|’ /C calc’!A0',
      input: 5500,
      output: 5478,
    };

    const errors = validateImportRow(maliciousRow, 1);
    expect(errors.some((e) => e.error.includes('công thức tính toán'))).toBe(true);

    // Kiểm tra hàm sanitizeCsvCell chèn dấu nháy đơn
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell('+123')).toBe("'+123");
    expect(sanitizeCsvCell('-456')).toBe("'-456");
    expect(sanitizeCsvCell('@test')).toBe("'@test");
    expect(sanitizeCsvCell('Normal Text')).toBe('Normal Text');
  });

  it('Bắt lỗi số âm đối với các trường số lượng đếm', () => {
    const negativeRow = {
      stage_code: 'CD01',
      input: -50,
      output: 5500,
    };

    const errors = validateImportRow(negativeRow, 1);
    expect(errors.some((e) => e.column === 'input')).toBe(true);
  });

  it('Bắt lỗi số không nguyên đối với số lượng đếm (input, output, current)', () => {
    const floatCountRow = {
      stage_code: 'CD02',
      input: 5500.5,
      output: 5500,
    };

    const errors = validateImportRow(floatCountRow, 1);
    expect(errors.some((e) => e.column === 'input' && e.error.includes('số nguyên'))).toBe(true);
  });

  it('Bắt lỗi phần trăm ngoài khoảng 0 - 100', () => {
    const invalidPctRow = {
      stage_code: 'CD03',
      processing_pct: 125.0,
    };

    const errors = validateImportRow(invalidPctRow, 1);
    expect(errors.some((e) => e.column === 'processing_pct')).toBe(true);
  });

  it('Bắt lỗi không nhất quán: Current hoặc Avg vượt quá Max WIP', () => {
    const inconsistentRow = {
      stage_code: 'CD04',
      current: 25,
      max_wip: 10, // current > max
    };

    const errors = validateImportRow(inconsistentRow, 1);
    expect(errors.some((e) => e.column === 'current' && e.error.includes('không được vượt quá'))).toBe(true);
  });
});
