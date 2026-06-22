import Link from "next/link";
import type { PostCardData } from "./PostCard";

function HeroCard({
  post,
  large = false,
}: {
  post: PostCardData;
  large?: boolean;
}) {
  return (
    <Link href={`/posts/${post.slug}`} className="group relative block overflow-hidden rounded-sm">
      {/* Image or gradient fallback */}
      <div className={`w-full ${large ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[16/9]"} relative overflow-hidden`}>
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full ${post.gradient}`} />
        )}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        {/* Tag pills — type label first, then categories (deduped) */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-500/90 text-white rounded-sm">
            {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
          </span>
          {post.categories
            .filter((cat) => cat.toLowerCase() !== post.type.toLowerCase())
            .map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-800/80 text-zinc-200 rounded-sm"
              >
                {cat}
              </span>
            ))}
        </div>

        <h3
          className={`font-bold text-white leading-snug group-hover:text-orange-300 transition-colors ${
            large ? "text-xl md:text-2xl" : "text-sm md:text-base"
          }`}
        >
          {post.title}
        </h3>

        <p className="mt-1 text-xs text-zinc-400">
          <span className="text-zinc-300">{post.author}</span>
          {" · "}
          {post.date}
        </p>
      </div>
    </Link>
  );
}

export default function HeroGrid({
  featured,
  secondary,
}: {
  featured: PostCardData;
  secondary: PostCardData[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
      {/* Large left card */}
      <HeroCard post={featured} large />

      {/* 2×2 right grid */}
      <div className="grid grid-cols-2 gap-1">
        {secondary.slice(0, 4).map((post) => (
          <HeroCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
