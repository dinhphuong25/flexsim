import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  const plan = await repository.getActivePlan();
  const line = await repository.getLine();

  return NextResponse.json({
    line,
    plan,
  });
}
