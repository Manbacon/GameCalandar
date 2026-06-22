import { getReleasesForList, groupReleasesForDisplay, releaseAccentHex, platformHex, type GroupedRelease } from '@/lib/releases';
import { gameLabel } from '@/lib/game-labels';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Upcoming',
  description: 'The most anticipated upcoming game releases — Monster Gaming',
};

export const revalidate = 3600;

function popularityScore(r: GroupedRelease) {
  const hypes  = r.game.hypes       ?? 0;
  const votes  = r.game.ratingCount ?? 0;
  const rating = r.game.rating      ?? 50;
  return hypes > 0 ? hypes : votes * (rating / 100);
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function CountdownBadge({ date }: { date: Date }) {
  const days = daysUntil(date);
  if (days < 0)  return null;
  if (days === 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-green-500 text-white animate-pulse">Today</span>;
  if (days === 1) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-green-600/80 text-white">Tomorrow</span>;
  if (days <= 7)  return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-violet-600/80 text-violet-100">{days} days</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-violet-900/60 text-violet-300 border border-violet-700/50">{days} days</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-zinc-800 text-zinc-400 border border-zinc-700">{days} days</span>;
}

function RankNumber({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg leading-none ${
      rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      : rank === 2 ? 'bg-zinc-600/20 text-zinc-400 border border-zinc-500/30'
      : rank === 3 ? 'bg-orange-700/20 text-orange-500 border border-orange-600/30'
      : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
    } ${isTop3 ? '' : ''}`}
    >
      {rank}
    </div>
  );
}

function GameLabelBadge({ genres, publishers }: { genres: string[]; publishers: string[] }) {
  const label = gameLabel(genres, publishers);
  if (!label) return null;
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none tracking-wide ${
      label === 'Indie' ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50' : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
    }`}>
      {label}
    </span>
  );
}

function TopGameCard({ release, rank }: { release: GroupedRelease; rank: number }) {
  const accent = releaseAccentHex(release);
  const score  = popularityScore(release);

  const dateLabel = release.releaseDate
    ? release.releaseDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Link
      href={`/releases/game/${release.game.slug}`}
      className="group flex gap-4 sm:gap-6 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 hover:bg-zinc-900/80"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Rank */}
      <div className="shrink-0 flex flex-col items-center gap-3 pt-1">
        <RankNumber rank={rank} />
      </div>

      {/* Cover */}
      <div className="shrink-0">
        {release.game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.game.coverUrl}
            alt={release.game.title}
            className="w-16 h-[86px] sm:w-20 sm:h-[108px] object-cover rounded-xl group-hover:brightness-110 transition-all duration-200"
          />
        ) : (
          <div className="w-16 h-[86px] sm:w-20 sm:h-[108px] bg-zinc-800 rounded-xl" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Title + badges */}
        <div className="flex items-start gap-2 flex-wrap mb-2">
          <h2 className="text-base sm:text-lg font-black text-zinc-100 group-hover:text-white leading-tight transition-colors">
            {release.game.title}
          </h2>
          <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap gap-1 mb-3">
          {release.platforms.map((p) => (
            <span
              key={p.id}
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none"
              style={{ backgroundColor: platformHex(p.igdbId) }}
              title={p.name}
            >
              {p.abbreviation ?? p.name.slice(0, 4).toUpperCase()}
            </span>
          ))}
        </div>

        {/* Dev / Publisher */}
        {(release.game.developers.length > 0 || release.game.publishers.length > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
            {release.game.developers.length > 0 && (
              <span className="text-xs text-zinc-500">
                <span className="text-zinc-700 uppercase tracking-wider text-[9px] font-bold mr-1">Dev</span>
                {release.game.developers.join(', ')}
              </span>
            )}
            {release.game.publishers.length > 0 && (
              <span className="text-xs text-zinc-500">
                <span className="text-zinc-700 uppercase tracking-wider text-[9px] font-bold mr-1">Pub</span>
                {release.game.publishers.join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Release date + countdown */}
        {dateLabel && release.releaseDate && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 font-medium">{dateLabel}</span>
            <CountdownBadge date={release.releaseDate} />
          </div>
        )}
      </div>

      {/* Right: hypes + rating */}
      <div className="hidden sm:flex shrink-0 flex-col items-end justify-between gap-2">
        {score > 0 && (
          <div className="text-right">
            {release.game.hypes != null && release.game.hypes > 0 ? (
              <div className="flex items-center gap-1 text-violet-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-black tabular-nums">
                  {release.game.hypes >= 1000 ? `${(release.game.hypes / 1000).toFixed(1)}k` : release.game.hypes}
                </span>
                <span className="text-xs text-zinc-600 font-normal">hype</span>
              </div>
            ) : null}
            {release.game.rating != null && (
              <span className={`text-lg font-black tabular-nums ${
                release.game.rating >= 75 ? 'text-green-400'
                : release.game.rating >= 50 ? 'text-yellow-400'
                : 'text-red-400'
              }`}>
                {Math.round(release.game.rating)}
                <span className="text-zinc-700 font-normal text-xs">/100</span>
              </span>
            )}
          </div>
        )}
        <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default async function TopUpcomingPage() {
  // Cast a wide net (180 days) so we have enough to find the top 10 by popularity
  const raw     = await getReleasesForList(180);
  const grouped = groupReleasesForDisplay(raw);

  // Deduplicate by game, keeping best-scoring entry per game
  const seen = new Set<string>();
  const unique = grouped.filter((r) => {
    if (seen.has(r.game.id)) return false;
    seen.add(r.game.id);
    return true;
  });

  const top10 = [...unique]
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">Release Schedule</p>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-50 mb-2">Top Upcoming</h1>
        <p className="text-zinc-400 text-sm">The most anticipated games releasing in the next 6 months, ranked by hype.</p>
      </div>

      {top10.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">No upcoming games found. Try running a sync.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {top10.map((release, i) => (
            <TopGameCard key={release.id} release={release} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-zinc-700 mt-8">
        Rankings based on IGDB hype scores and community ratings. Updated every hour.
      </p>
    </div>
  );
}
