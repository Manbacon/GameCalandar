import PostArchive from "@/components/posts/PostArchive";
import { getPublishedPostsPaginated, getAllCategories, toCardData } from "@/lib/posts";

export const revalidate = 60;
export const metadata = { title: "All Posts" };

export default async function AllPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPublishedPostsPaginated(page),
    getAllCategories(),
  ]);

  return (
    <PostArchive
      title="All Posts"
      subtitle="Everything published on Monster Gaming"
      posts={posts.map(toCardData)}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      basePath="/posts"
    />
  );
}
