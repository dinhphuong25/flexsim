import { sanitizeCsvCell } from './export-utils';

export interface RowValidationError {
  row: number;
  column: string;
  value: unknown;
  error: string;
}

export function validateImportRow(row: Record<string, unknown>, rowIndex: number): RowValidationError[] {
  const errors: RowValidationError[] = [];

  // 1. Kiểm tra đối tượng hoặc công đoạn
  const name = String(row.object_name || row.stage_code || '').trim();
  if (!name) {
    errors.push({
      row: rowIndex,
      column: 'object_name / stage_code',
      value: name,
      error: 'Thiếu định danh tên đối tượng hoặc mã công đoạn.',
    });
  }

  // 2. Chống macro / formula injection
  for (const [col, val] of Object.entries(row)) {
    if (typeof val === 'string' && /^[=+\-@\t\r]/.test(val)) {
      errors.push({
        row: rowIndex,
        column: col,
        value: val,
        error: 'Cảnh báo bảo mật: Giá trị ô chứa ký tự bắt đầu công thức tính toán (=, +, -, @).',
      });
    }
  }

  // 3. Kiểm tra số lượng nguyên: input, output, current, max_wip
  const integerFields = ['input', 'output', 'current', 'max_wip', 'max_content'];
  for (const field of integerFields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      const num = Number(row[field]);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        errors.push({
          row: rowIndex,
          column: field,
          value: row[field],
          error: `Trường ${field} phải là số nguyên không âm.`,
        });
      }
    }
  }

  // 4. Kiểm tra số thực: avg_wip, avg_content, wait_seconds
  const floatFields = ['avg_wip', 'avg_content', 'wait_seconds', 'avg_staytime'];
  for (const field of floatFields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      const num = Number(row[field]);
      if (isNaN(num) || num < 0 || !isFinite(num)) {
        errors.push({
          row: rowIndex,
          column: field,
          value: row[field],
          error: `Trường ${field} phải là số thực không âm hợp lệ.`,
        });
      }
    }
  }

  // 5. Kiểm tra phần trăm gia công (0 - 100)
  if (row.processing_pct !== undefined && row.processing_pct !== null && row.processing_pct !== '') {
    const pct = Number(row.processing_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push({
        row: rowIndex,
        column: 'processing_pct',
        value: row.processing_pct,
        error: 'Tỷ lệ Processing % phải nằm trong khoảng từ 0 đến 100.',
      });
    }
  }

  // 6. Kiểm tra tính nhất quán: current hoặc avg không được vượt quá max khi cùng đo
  const current = row.current !== undefined && row.current !== '' ? Number(row.current) : null;
  const avg = row.avg_wip !== undefined && row.avg_wip !== '' ? Number(row.avg_wip) : null;
  const max = row.max_wip !== undefined && row.max_wip !== '' ? Number(row.max_wip) : null;

  if (max !== null && !isNaN(max)) {
    if (current !== null && !isNaN(current) && current > max) {
      errors.push({
        row: rowIndex,
        column: 'current',
        value: current,
        error: `Tồn hiện tại (${current}) không được vượt quá tồn tối đa quan sát (${max}).`,
      });
    }
    if (avg !== null && !isNaN(avg) && avg > max) {
      errors.push({
        row: rowIndex,
        column: 'avg_wip',
        value: avg,
        error: `Tồn trung bình (${avg}) không được vượt quá tồn tối đa quan sát (${max}).`,
      });
    }
  }

  return errors;
}
