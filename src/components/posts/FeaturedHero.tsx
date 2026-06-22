import Link from "next/link";
import type { PostCardData } from "./PostCard";

const typeBadge: Record<PostCardData["type"], { label: string; className: string }> = {
  REVIEW:  { label: "Review",  className: "bg-purple-500/90 text-white" },
  LIST:    { label: "List",    className: "bg-blue-500/90 text-white" },
  NEWS:    { label: "News",    className: "bg-green-500/90 text-white" },
  ARTICLE: { label: "Article", className: "bg-zinc-500/90 text-white" },
};

export default function FeaturedHero({ post }: { post: PostCardData }) {
  const badge = typeBadge[post.type];

  return (
    <Link href={`/posts/${post.slug}`} className="group block relative rounded-2xl overflow-hidden">
      {/* Background gradient (placeholder for image) */}
      <div className={`w-full aspect-[21/9] md:aspect-[3/1] ${post.gradient}`} />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${badge.className}`}>
            {badge.label}
          </span>
          {post.categories.map((cat) => (
            <span key={cat} className="text-xs font-medium text-orange-400">
              {cat}
            </span>
          ))}
        </div>

        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight max-w-3xl group-hover:text-orange-300 transition-colors">
          {post.title}
        </h2>

        <p className="mt-2 text-sm md:text-base text-zinc-300 max-w-2xl line-clamp-2 hidden sm:block">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-2 mt-4 text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">{post.author}</span>
          <span>&middot;</span>
          <span>{post.date}</span>
        </div>
      </div>
    </Link>
  );
}
