import PostArchive from "@/components/posts/PostArchive";
import { getPostsByType, getAllCategories, toCardData } from "@/lib/posts";
import { PostType } from "@/generated/prisma/client";

export const revalidate = 60;
export const metadata = { title: "Lists" };

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPostsByType(PostType.LIST, page),
    getAllCategories(),
  ]);

  return (
    <PostArchive
      title="Lists"
      subtitle="Top 10s, curated picks, and ranked round-ups"
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath="/lists"
    />
  );
}
