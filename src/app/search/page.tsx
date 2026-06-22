import type { Metadata } from "next";
import PostCard from "@/components/posts/PostCard";
import { searchPosts, getAllCategories, toCardData } from "@/lib/posts";
import Link from "next/link";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [results, categories] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    getAllCategories(),
  ]);

  const cards = results.map(toCardData);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header + search form */}
      <div className="mb-8 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-black text-zinc-50 mb-4">Search</h1>
        <form action="/search" method="GET" className="flex gap-3 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search posts, reviews, lists..."
            autoFocus
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
        {/* Results */}
        <div>
          {!query ? (
            <div className="text-center py-20 text-zinc-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <p>Enter a search term above to find posts.</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-400 text-lg mb-2">
                No results for <span className="text-zinc-50 font-semibold">&ldquo;{query}&rdquo;</span>
              </p>
              <p className="text-zinc-500 text-sm mb-6">Try different keywords or browse by category.</p>
              <Link href="/posts" className="text-orange-500 hover:text-orange-400 text-sm transition-colors">
                Browse all posts →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-6">
                {cards.length} result{cards.length !== 1 ? "s" : ""} for{" "}
                <span className="text-zinc-300 font-medium">&ldquo;{query}&rdquo;</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2">
                {cards.map((post) => (
                  <PostCard key={post.slug} post={post} showExcerpt />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
              Browse Categories
            </h3>
            <ul className="space-y-1.5">
              {categories.map((cat) => (
                <li key={cat.slug} className="flex items-center justify-between">
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                  <span className="text-xs text-zinc-600">{cat._count.posts}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
              Post Types
            </h3>
            <ul className="space-y-1.5">
              {[
                { label: "Reviews", href: "/reviews" },
                { label: "Lists",   href: "/lists"   },
                { label: "News",    href: "/news"    },
                { label: "Articles", href: "/posts"  },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
