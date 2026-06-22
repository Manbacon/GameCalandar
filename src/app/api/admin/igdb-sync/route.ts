import { NextResponse } from 'next/server';
import { syncIgdbReleases } from '@/lib/igdb-sync';

export const maxDuration = 60;

export async function POST() {
  if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in .env' },
      { status: 500 }
    );
  }

  try {
    const result = await syncIgdbReleases();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
