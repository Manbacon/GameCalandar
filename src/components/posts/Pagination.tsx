import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const makeHref = (page: number) =>
    page === 1 ? basePath : `${basePath}?page=${page}`;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      <Link
        href={makeHref(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
          currentPage === 1
            ? "text-zinc-600 pointer-events-none"
            : "text-zinc-400 hover:text-orange-400"
        }`}
      >
        ← Prev
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-zinc-600">…</span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
              p === currentPage
                ? "bg-orange-500 text-white"
                : "text-zinc-400 hover:text-orange-400 hover:bg-zinc-800"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={makeHref(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
          currentPage === totalPages
            ? "text-zinc-600 pointer-events-none"
            : "text-zinc-400 hover:text-orange-400"
        }`}
      >
        Next →
      </Link>
    </nav>
  );
}
