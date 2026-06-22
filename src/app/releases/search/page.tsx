import { searchGames, platformHex, type GameSearchResult } from '@/lib/releases';
import { gameLabel } from '@/lib/game-labels';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Search Releases' };

function nextUpcoming(game: GameSearchResult) {
  const now = new Date();
  const upcoming = game.releases
    .filter((r) => r.releaseDate && r.releaseDate >= now)
    .sort((a, b) => (a.releaseDate!.getTime()) - (b.releaseDate!.getTime()));
  return upcoming[0] ?? null;
}

function allPlatforms(game: GameSearchResult) {
  const seen = new Set<number>();
  return game.releases
    .filter((r) => { if (seen.has(r.platform.igdbId)) return false; seen.add(r.platform.igdbId); return true; })
    .map((r) => r.platform);
}

function GameLabelBadge({ genres, publishers }: { genres: string[]; publishers: string[] }) {
  const label = gameLabel(genres, publishers);
  if (!label) return null;
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none tracking-wide ${
      label === 'Indie'
        ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50'
        : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
    }`}>
      {label}
    </span>
  );
}

function ResultCard({ game }: { game: GameSearchResult }) {
  const next      = nextUpcoming(game);
  const platforms = allPlatforms(game);
  const isReleased = !next;

  const dateLabel = next?.releaseDate
    ? next.releaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Link
      href={`/releases/game/${game.slug}`}
      className="group flex gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-violet-700/50 rounded-xl p-4 transition-all duration-150 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-violet-900/10"
    >
      {/* Cover */}
      <div className="shrink-0">
        {game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.coverUrl}
            alt={game.title}
            className="w-14 h-[75px] object-cover rounded-lg group-hover:brightness-110 transition-all"
          />
        ) : (
          <div className="w-14 h-[75px] bg-zinc-800 rounded-lg" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-2">
          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white leading-tight transition-colors">
            {game.title}
          </h3>
          <GameLabelBadge genres={game.genres} publishers={game.publishers} />
        </div>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {platforms.slice(0, 6).map((p) => (
              <span
                key={p.id}
                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none"
                style={{ backgroundColor: platformHex(p.igdbId) }}
                title={p.name}
              >
                {p.abbreviation ?? p.name.slice(0, 4).toUpperCase()}
              </span>
            ))}
            {platforms.length > 6 && (
              <span className="text-[10px] text-zinc-600">+{platforms.length - 6}</span>
            )}
          </div>
        )}

        {/* Release date / status */}
        {dateLabel ? (
          <p className="text-xs text-zinc-400">
            <span className="text-zinc-600 mr-1">Next release</span>
            {dateLabel}
          </p>
        ) : isReleased ? (
          <p className="text-xs text-zinc-600">Released</p>
        ) : null}
      </div>

      {/* Right: hypes / rating */}
      <div className="hidden sm:flex shrink-0 flex-col items-end justify-center gap-1.5">
        {game.hypes != null && game.hypes > 0 && (
          <div className="flex items-center gap-1 text-violet-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold tabular-nums">
              {game.hypes >= 1000 ? `${(game.hypes / 1000).toFixed(1)}k` : game.hypes}
            </span>
          </div>
        )}
        {game.rating != null && (
          <span className={`text-sm font-black tabular-nums ${
            game.rating >= 75 ? 'text-green-400' : game.rating >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(game.rating)}<span className="text-zinc-700 font-normal text-xs">/100</span>
          </span>
        )}
        <svg className="w-3.5 h-3.5 text-zinc-700 group-hover:text-violet-600 transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default async function ReleasesSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query   = q.trim();
  const results = query ? await searchGames(query) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header + form */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">Release Schedule</p>
        <h1 className="text-3xl font-black text-zinc-50 mb-4">Search Games</h1>
        <form action="/releases/search" method="GET" className="flex gap-3 max-w-2xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search for a game title…"
            autoFocus
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      {!query ? (
        <div className="text-center py-24 text-zinc-600">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <p className="text-sm">Search by game title to find release dates, platforms and more.</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link href="/releases" className="text-xs text-violet-500 hover:text-violet-400 transition-colors">
              ← Release Calendar
            </Link>
            <Link href="/releases/top-upcoming" className="text-xs text-violet-500 hover:text-violet-400 transition-colors">
              Top Upcoming →
            </Link>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-300 text-lg mb-2">
            No games found for <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
          </p>
          <p className="text-zinc-500 text-sm mb-6">Try a different title, or check the full release calendar.</p>
          <Link href="/releases" className="text-violet-500 hover:text-violet-400 text-sm transition-colors">
            Browse Release Calendar →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
            <span className="text-zinc-300 font-medium">&ldquo;{query}&rdquo;</span>
          </p>
          <div className="space-y-2">
            {results.map((game) => (
              <ResultCard key={game.id} game={game} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
