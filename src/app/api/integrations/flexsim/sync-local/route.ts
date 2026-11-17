import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Chức năng đồng bộ trực tiếp qua tệp máy trạm FlexSim hiện đang tắt trên môi trường Web Demo
    return NextResponse.json(
      {
        error: 'Chức năng đồng bộ trực tiếp từ máy trạm FlexSim hiện đang tắt trên hệ thống Web Demo.',
        disabled: true,
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi đồng bộ';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
