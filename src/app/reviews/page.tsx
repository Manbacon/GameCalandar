import PostArchive from "@/components/posts/PostArchive";
import { getPostsByType, getAllCategories, toCardData } from "@/lib/posts";
import { PostType } from "@/generated/prisma/client";

export const revalidate = 60;
export const metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPostsByType(PostType.REVIEW, page),
    getAllCategories(),
  ]);

  return (
    <PostArchive
      title="Reviews"
      subtitle="Monster Gaming's honest take on the games we've played"
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath="/reviews"
    />
  );
}
