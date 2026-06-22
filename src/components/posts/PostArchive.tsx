import PostCard, { type PostCardData } from "./PostCard";
import Pagination from "./Pagination";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  posts: PostCardData[];
  categories?: { name: string; slug: string; _count: { posts: number } }[];
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
};

export default function PostArchive({ title, subtitle, posts, categories, currentPage = 1, totalPages = 1, basePath = "/" }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-zinc-800">
        <h1 className="text-3xl font-black text-zinc-50">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-1">{subtitle}</p>}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-500 text-lg">No posts found.</p>
          <Link href="/" className="mt-4 inline-block text-orange-500 hover:text-orange-400 text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          {/* Post grid + pagination */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} showExcerpt />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">Search</h3>
              <form action="/search" method="GET" className="flex gap-2">
                <input
                  type="search"
                  name="q"
                  placeholder="Search..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button type="submit" className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded transition-colors shrink-0">
                  Go
                </button>
              </form>
            </div>

            {categories && categories.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
                  Categories
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
            )}

            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
                Post Types
              </h3>
              <ul className="space-y-1.5">
                {[
                  { label: "Reviews", href: "/reviews" },
                  { label: "Lists", href: "/lists" },
                  { label: "News", href: "/news" },
                  { label: "Articles", href: "/posts" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
