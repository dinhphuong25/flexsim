import * as XLSX from 'xlsx';

/**
 * Phòng chống CSV Formula Injection (CWE-1236)
 * Nếu ô văn bản bắt đầu bằng =, +, -, @, tab hoặc carriage return,
 * tự động chèn dấu nháy đơn (') để trình đọc bảng tính không thực thi mã độc.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Xuất dữ liệu ra chuỗi CSV an toàn có hỗ trợ BOM UTF-8 cho Excel tiếng Việt
 */
export function generateSafeCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const sanitizedHeaders = headers.map(sanitizeCsvCell);
  const headerLine = sanitizedHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');

  const bodyLines = rows.map((row) =>
    row
      .map((cell) => {
        const sanitized = sanitizeCsvCell(cell);
        return `"${sanitized.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  // Byte Order Mark (BOM) \uFEFF giúp Excel hiển thị đúng tiếng Việt có dấu
  return '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
}

/**
 * Tạo file bảng tính XLSX với nhiều sheet và định dạng số
 */
export function generateExcelWorkbook(sheets: {
  name: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Tự động căn chỉnh độ rộng cột
    const colWidths = sheet.headers.map((h, i) => {
      let maxLen = h.length;
      for (const row of sheet.rows) {
        const val = row[i];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  return new Uint8Array(out);
}
