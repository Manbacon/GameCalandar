import PostArchive from "@/components/posts/PostArchive";
import { getPostsByType, getAllCategories, toCardData } from "@/lib/posts";
import { PostType } from "@/generated/prisma/client";

export const revalidate = 60;
export const metadata = { title: "News" };

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPostsByType(PostType.NEWS, page),
    getAllCategories(),
  ]);

  return (
    <PostArchive
      title="News"
      subtitle="Gaming news worth reading"
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath="/news"
    />
  );
}
