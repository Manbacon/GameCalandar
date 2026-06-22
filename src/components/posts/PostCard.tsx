import Link from "next/link";

export type PostCardData = {
  title: string;
  slug: string;
  excerpt?: string;
  type: "ARTICLE" | "REVIEW" | "LIST" | "NEWS";
  categories: string[];
  author: string;
  date: string;
  gradient: string;
  featuredImage?: string;
};

const typePill: Record<PostCardData["type"], string> = {
  REVIEW:  "bg-purple-600 text-white",
  LIST:    "bg-orange-600 text-white",
  NEWS:    "bg-zinc-600 text-white",
  ARTICLE: "bg-zinc-700 text-zinc-200",
};

export function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-zinc-700 text-zinc-200 rounded-sm">
      {label}
    </span>
  );
}

export default function PostCard({
  post,
  showExcerpt = true,
  compact = false,
}: {
  post: PostCardData;
  showExcerpt?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      {/* Image */}
      <div className={`w-full ${compact ? "aspect-[4/3]" : "aspect-video"} relative overflow-hidden rounded-sm`}>
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full ${post.gradient}`} />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Content */}
      <div className="pt-2 pb-4">
        {/* Tags row — deduplicated so type label never repeats as a category pill */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-sm ${typePill[post.type]}`}>
            {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
          </span>
          {post.categories
            .filter((cat) => cat.toLowerCase() !== post.type.toLowerCase())
            .map((cat) => (
              <CategoryPill key={cat} label={cat} />
            ))}
        </div>

        <h3 className="text-base font-bold text-zinc-100 leading-snug group-hover:text-orange-400 transition-colors line-clamp-2 mb-1">
          {post.title}
        </h3>

        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{post.author}</span>
          {" · "}
          {post.date}
        </p>

        {showExcerpt && post.excerpt && (
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
