import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = extname(file.name).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}

export async function GET(req: NextRequest) {
  const { readdir, stat } = await import('fs/promises');
  const { prisma } = await import('@/lib/prisma');
  const uploadDir = join(process.cwd(), 'public', 'uploads');

  // Local uploads
  const localFiles: { url: string; name: string; size: number; mtime: string }[] = [];
  if (existsSync(uploadDir)) {
    const names = await readdir(uploadDir);
    const withStats = await Promise.all(
      names
        .filter((n) => /\.(jpe?g|png|gif|webp|avif)$/i.test(n))
        .map(async (n) => {
          const s = await stat(join(uploadDir, n));
          return { url: `/uploads/${n}`, name: n, size: s.size, mtime: s.mtime.toISOString() };
        })
    );
    withStats.sort((a, b) => b.mtime.localeCompare(a.mtime));
    localFiles.push(...withStats);
  }

  // Images referenced in posts but not in local uploads
  const posts = await prisma.post.findMany({
    where: { featuredImage: { not: null } },
    select: { featuredImage: true, title: true, slug: true },
  });
  const localUrls = new Set(localFiles.map((f) => f.url));
  const referencedImages = posts
    .map((p) => p.featuredImage!)
    .filter((url, i, arr) => url && !localUrls.has(url) && arr.indexOf(url) === i)
    .map((url) => ({ url, name: url.split('/').pop() ?? url, external: true }));

  return NextResponse.json({ files: localFiles, referencedImages });
}

export async function DELETE(req: NextRequest) {
  const { unlink } = await import('fs/promises');
  const { filename } = await req.json() as { filename: string };

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'public', 'uploads', filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  await unlink(filePath);
  return NextResponse.json({ ok: true });
}
