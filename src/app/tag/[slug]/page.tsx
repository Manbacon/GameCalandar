import { notFound } from "next/navigation";
import PostArchive from "@/components/posts/PostArchive";
import { getPostsByTag, getTagBySlug, getAllCategories, toCardData } from "@/lib/posts";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return { title: `#${tag.name}` };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [tag, { posts, totalPages }, categories] = await Promise.all([
    getTagBySlug(slug),
    getPostsByTag(slug, page),
    getAllCategories(),
  ]);

  if (!tag) notFound();

  return (
    <PostArchive
      title={`#${tag.name}`}
      subtitle={`All posts tagged "${tag.name}"`}
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath={`/tag/${slug}`}
    />
  );
}
