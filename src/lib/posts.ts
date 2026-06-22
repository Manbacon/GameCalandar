import { prisma } from "./prisma";
import { PostStatus, PostType } from "@/generated/prisma/client";

const postInclude = {
  author: { select: { name: true, username: true } },
  categories: true,
  tags: true,
} as const;

export const POSTS_PER_PAGE = 12;

export async function getPublishedPosts(limit = 20) {
  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
}

export async function getPublishedPostsPaginated(page = 1) {
  const skip = (page - 1) * POSTS_PER_PAGE;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: POSTS_PER_PAGE,
      skip,
      include: postInclude,
    }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

export async function getPostsByCategory(categorySlug: string, page = 1) {
  const where = {
    status: PostStatus.PUBLISHED,
    categories: { some: { slug: categorySlug } },
  };
  const skip = (page - 1) * POSTS_PER_PAGE;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { publishedAt: "desc" }, take: POSTS_PER_PAGE, skip, include: postInclude }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

export async function getPostsByTag(tagSlug: string, page = 1) {
  const where = {
    status: PostStatus.PUBLISHED,
    tags: { some: { slug: tagSlug } },
  };
  const skip = (page - 1) * POSTS_PER_PAGE;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { publishedAt: "desc" }, take: POSTS_PER_PAGE, skip, include: postInclude }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

export async function getPostsByType(type: PostType, page = 1) {
  const where = { status: PostStatus.PUBLISHED, type };
  const skip = (page - 1) * POSTS_PER_PAGE;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { publishedAt: "desc" }, take: POSTS_PER_PAGE, skip, include: postInclude }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: {
      ...postInclude,
      comments: {
        include: { author: { select: { name: true, username: true, image: true } } },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function searchPosts(query: string, limit = 30) {
  const q = query.trim();
  if (!q) return [];
  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      OR: [
        { title:   { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}

export async function getAllTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { ...postInclude, comments: false },
  });
}

export async function getAllPostsAdmin() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, username: true } }, categories: true },
  });
}

export async function getAdminStats() {
  const [published, drafts, categories, tags] = await Promise.all([
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.category.count(),
    prisma.tag.count(),
  ]);
  return { published, drafts, categories, tags };
}

export function formatPostDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPostDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function wasUpdatedAfterPublish(publishedAt: Date | null, updatedAt: Date): boolean {
  if (!publishedAt) return false;
  return updatedAt.getTime() - publishedAt.getTime() > 24 * 60 * 60 * 1000;
}

export function sanitizeWpContent(html: string): string {
  let out = html;
  out = out.replace(/<form[^>]*ts_poll_form[^>]*>[\s\S]*?<\/form>/gi, "");
  out = out.replace(/v-bind:[^=]+=["'][^"']*["']/g, "");
  out = out.replace(/<p[^>]*>\s*<\/p>/gi, "");
  return out.trim();
}

export type DbPost = Awaited<ReturnType<typeof getPublishedPosts>>[number];

export function toCardData(post: DbPost) {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    type: post.type as "ARTICLE" | "REVIEW" | "LIST" | "NEWS",
    categories: post.categories.map((c) => c.name),
    author: post.author.username ?? post.author.name ?? "MonsterGaming",
    date: formatPostDate(post.publishedAt),
    gradient: typeGradient[post.type] ?? typeGradient.ARTICLE,
    featuredImage: post.featuredImage ?? undefined,
  };
}

export const typeGradient: Record<string, string> = {
  LIST:    "bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-950",
  REVIEW:  "bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-950",
  NEWS:    "bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900",
  ARTICLE: "bg-gradient-to-br from-slate-800 via-slate-700 to-zinc-900",
};
