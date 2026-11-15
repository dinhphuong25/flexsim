import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { sanitizeCsvCell } from '@/lib/export-utils';
import { validateImportRow, RowValidationError } from '@/lib/import-validator';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'IMPORT_BACKUP_DATA')) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Tài khoản không có quyền nhập dữ liệu dự phòng.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const rows: Record<string, unknown>[] = body.rows || [];
    const fileName: string = body.fileName || 'imported_file.csv';

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'EMPTY_DATA', message: 'Tệp không có dữ liệu dòng.' }, { status: 400 });
    }

    if (rows.length > 5000) {
      return NextResponse.json(
        { error: 'PAYLOAD_TOO_LARGE', message: 'Vượt quá giới hạn cho phép (tối đa 5.000 dòng).' },
        { status: 413 }
      );
    }

    const allErrors: RowValidationError[] = [];
    const sanitizedPreview: Record<string, unknown>[] = [];

    rows.forEach((row, index) => {
      const rowIndex = index + 1; // 1-indexed for display
      const rowErrors = validateImportRow(row, rowIndex);
      allErrors.push(...rowErrors);

      // Clean empty string to null and sanitize string values
      const cleanedRow: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val === '' || val === undefined) {
          cleanedRow[key] = null;
        } else if (typeof val === 'string') {
          cleanedRow[key] = sanitizeCsvCell(val);
        } else {
          cleanedRow[key] = val;
        }
      }
      sanitizedPreview.push(cleanedRow);
    });

    const isSuccess = allErrors.length === 0;

    return NextResponse.json({
      status: 'PREVIEW_READY',
      fileName,
      totalRows: rows.length,
      errorCount: allErrors.length,
      isValid: isSuccess,
      errors: allErrors.slice(0, 100),
      preview: sanitizedPreview.slice(0, 10),
    });
  } catch (error) {
    console.error('Lỗi khi xem trước dữ liệu nhập:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
