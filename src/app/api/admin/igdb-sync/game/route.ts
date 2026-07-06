import { NextResponse } from 'next/server';
import { syncGameById } from '@/lib/igdb-sync';

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
    return NextResponse.json({ error: 'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in .env' }, { status: 500 });
  }
  try {
    const { igdbId } = await req.json() as { igdbId: number };
    if (!igdbId || typeof igdbId !== 'number') {
      return NextResponse.json({ error: 'igdbId (number) required' }, { status: 400 });
    }
    const result = await syncGameById(igdbId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
