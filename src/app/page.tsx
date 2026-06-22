import HeroGrid from "@/components/posts/HeroGrid";
import PostCard, { type PostCardData } from "@/components/posts/PostCard";
import NewsTicker from "@/components/layout/NewsTicker";
import Link from "next/link";
import { getPublishedPosts, formatPostDate, typeGradient } from "@/lib/posts";

export const revalidate = 60;

function dbPostToCardData(post: Awaited<ReturnType<typeof getPublishedPosts>>[number]): PostCardData {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    type: post.type as PostCardData["type"],
    categories: post.categories.map((c) => c.name),
    author: post.author.username ?? post.author.name ?? "MonsterGaming",
    date: formatPostDate(post.publishedAt),
    gradient: typeGradient[post.type] ?? typeGradient.ARTICLE,
    featuredImage: post.featuredImage ?? undefined,
  };
}

export default async function HomePage() {
  const posts = await getPublishedPosts(10);
  const cards = posts.map(dbPostToCardData);

  const [heroPost, ...rest] = cards;
  const secondaryFeatured = rest.slice(0, 4);
  const latestPosts = rest.slice(0, 6);

  const categories = [
    ...new Set(posts.flatMap((p) => p.categories.map((c) => c.name))),
  ];

  return (
    <>
      <NewsTicker items={cards.map((p) => ({ title: p.title, slug: p.slug }))} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {heroPost && (
          <HeroGrid featured={heroPost} secondary={secondaryFeatured} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* Post grid */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-2">
              {latestPosts.map((post) => (
                <PostCard key={post.slug} post={post} showExcerpt />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 mb-2">Search</h3>
              <form action="/search" method="GET" className="flex gap-2">
                <input
                  type="search"
                  name="q"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Search..."
                />
                <button type="submit" className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded transition-colors">
                  Search
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
                Recent Posts
              </h3>
              <ul className="space-y-2">
                {cards.slice(0, 5).map((post) => (
                  <li key={post.slug}>
                    <Link href={`/posts/${post.slug}`} className="text-sm text-zinc-400 hover:text-orange-400 transition-colors">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
                Recent Comments
              </h3>
              <p className="text-sm text-zinc-500">No comments to show.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
                Categories
              </h3>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
