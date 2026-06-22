import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPublishedPosts, formatPostDate, wasUpdatedAfterPublish, typeGradient, sanitizeWpContent } from "@/lib/posts";
import { CategoryPill } from "@/components/posts/PostCard";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts(100);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const content = post.content as { type: string; html?: string };
  const htmlContent = sanitizeWpContent(content?.html ?? "");

  const gradient = typeGradient[post.type] ?? typeGradient.ARTICLE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        {/* Main article */}
        <article>
          {/* Featured image */}
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-6">
            {post.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${gradient}`} />
            )}
          </div>

          {/* Category + tag pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}>
                <CategoryPill label={cat.name} />
              </Link>
            ))}
            {post.tags.map((tag) => (
              <Link key={tag.slug} href={`/tag/${tag.slug}`} className="text-xs text-zinc-500 hover:text-orange-400 transition-colors">
                #{tag.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-zinc-50 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-800">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(post.author.username ?? post.author.name ?? "M")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {post.author.username ?? post.author.name}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-zinc-500">
                  Published {formatPostDate(post.publishedAt)}
                </p>
                {wasUpdatedAfterPublish(post.publishedAt, post.updatedAt) && (
                  <p className="text-xs text-zinc-600">
                    · Updated {formatPostDate(post.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className="prose-gaming"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Comments section placeholder */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100 mb-6">
              Comments ({post.comments.length})
            </h2>
            {post.comments.length === 0 ? (
              <p className="text-zinc-500 text-sm mb-8">
                No comments yet. Be the first to leave one!
              </p>
            ) : (
              <div className="space-y-6 mb-8">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0">
                      {(comment.author.name ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-200">
                          {comment.author.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatPostDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leave a comment — sign-in prompt for now */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm mb-4">
                You must be signed in to leave a comment.
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded transition-colors"
              >
                Sign In to Comment
              </Link>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
              Categories
            </h3>
            <ul className="space-y-1">
              {post.categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-3 pb-2 border-b border-zinc-700">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded border border-zinc-700 hover:border-orange-500 hover:text-orange-400 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
