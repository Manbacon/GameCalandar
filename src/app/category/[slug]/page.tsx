import { notFound } from "next/navigation";
import PostArchive from "@/components/posts/PostArchive";
import {
  getPostsByCategory,
  getCategoryBySlug,
  getAllCategories,
  toCardData,
} from "@/lib/posts";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: category.name };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [category, { posts, totalPages }, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getPostsByCategory(slug, page),
    getAllCategories(),
  ]);

  if (!category) notFound();

  return (
    <PostArchive
      title={category.name}
      subtitle={`All posts filed under "${category.name}"`}
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath={`/category/${slug}`}
    />
  );
}
