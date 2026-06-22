'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PostStatus, PostType } from '@/generated/prisma/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureAdminUser(): Promise<string> {
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'ManbaconMG',
        username: 'manbacon',
        email: 'admin@monstergaming.local',
        role: 'ADMIN',
      },
    });
  }
  return user.id;
}

export async function createPost(formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  if (!title) throw new Error('Title is required');

  const rawSlug = (formData.get('slug') as string | null)?.trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const excerpt = (formData.get('excerpt') as string | null)?.trim() ?? null;
  const html = (formData.get('content') as string | null) ?? '';
  const status = (formData.get('status') as string) === 'PUBLISHED' ? PostStatus.PUBLISHED : PostStatus.DRAFT;
  const type = (formData.get('type') as PostType) ?? PostType.ARTICLE;
  const featuredImage = (formData.get('featuredImage') as string | null)?.trim() || null;
  const categoryIds = formData.getAll('categories') as string[];
  const tagNames = (formData.get('tagNames') as string | null)?.split(',').map((t) => t.trim()).filter(Boolean) ?? [];

  const authorId = await ensureAdminUser();

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content: { type: 'html', html },
      status,
      type,
      featuredImage,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      authorId,
      categories: categoryIds.length
        ? { connect: categoryIds.map((id) => ({ id })) }
        : undefined,
      tags: tagNames.length
        ? {
            connectOrCreate: tagNames.map((name) => ({
              where: { slug: slugify(name) },
              create: { name, slug: slugify(name) },
            })),
          }
        : undefined,
    },
  });

  revalidatePath('/');
  revalidatePath('/posts');
  redirect(`/admin/posts/${post.id}/edit`);
}

export async function updatePost(id: string, formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  if (!title) throw new Error('Title is required');

  const rawSlug = (formData.get('slug') as string | null)?.trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const excerpt = (formData.get('excerpt') as string | null)?.trim() ?? null;
  const html = (formData.get('content') as string | null) ?? '';
  const prevStatus = await prisma.post.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
  const status = (formData.get('status') as string) === 'PUBLISHED' ? PostStatus.PUBLISHED : PostStatus.DRAFT;
  const type = (formData.get('type') as PostType) ?? PostType.ARTICLE;
  const featuredImage = (formData.get('featuredImage') as string | null)?.trim() || null;
  const categoryIds = formData.getAll('categories') as string[];
  const tagNames = (formData.get('tagNames') as string | null)?.split(',').map((t) => t.trim()).filter(Boolean) ?? [];

  const wasPublished = prevStatus?.status === PostStatus.PUBLISHED;
  const nowPublished = status === PostStatus.PUBLISHED;

  await prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      content: { type: 'html', html },
      status,
      type,
      featuredImage,
      publishedAt: nowPublished
        ? wasPublished
          ? prevStatus?.publishedAt
          : new Date()
        : null,
      categories: {
        set: categoryIds.map((cid) => ({ id: cid })),
      },
      tags: {
        set: [],
        connectOrCreate: tagNames.map((name) => ({
          where: { slug: slugify(name) },
          create: { name, slug: slugify(name) },
        })),
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath(`/posts/${slug}`);
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/posts');
  redirect('/admin/posts');
}
