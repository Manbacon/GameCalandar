import Link from "next/link";

type TickerItem = { title: string; slug: string };

export default function NewsTicker({ items }: { items: TickerItem[] }) {
  // Duplicate items so the scroll feels seamless
  const repeated = [...items, ...items];

  return (
    <div className="flex items-center overflow-hidden border-b border-zinc-800 bg-[#1a1a1a]">
      {/* Label */}
      <div className="shrink-0 bg-orange-500 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-white whitespace-nowrap">
          Check out our latest posts
        </span>
      </div>

      {/* Scrolling links */}
      <div className="flex-1 overflow-hidden relative py-2">
        <div className="ticker-scroll flex items-center gap-0">
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center shrink-0">
              <Link
                href={`/posts/${item.slug}`}
                className="text-sm text-zinc-300 hover:text-orange-400 transition-colors whitespace-nowrap px-3"
              >
                {item.title}
              </Link>
              <span className="text-zinc-600 select-none">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center border-l border-zinc-700 px-2 gap-1">
        <button className="p-1 text-zinc-400 hover:text-orange-400 transition-colors" aria-label="Previous">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-1 text-zinc-400 hover:text-orange-400 transition-colors" aria-label="Next">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
