import { NextResponse } from 'next/server';
import { cleanupDatabase } from '@/lib/igdb-sync';

export async function POST() {
  try {
    const result = await cleanupDatabase();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
