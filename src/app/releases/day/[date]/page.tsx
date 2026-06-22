import { getReleasesForDate, groupReleasesForDisplay, releaseAccentHex, platformHex, type GroupedRelease } from '@/lib/releases';
import { REGION_META, type RegionGroup } from '@/lib/regions';
import { gameLabel } from '@/lib/game-labels';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

function popularityScore(release: GroupedRelease): number {
  const hypes  = release.game.hypes       ?? 0;
  const votes  = release.game.ratingCount ?? 0;
  const rating = release.game.rating      ?? 50;
  return hypes > 0 ? hypes : votes * (rating / 100);
}

async function getReleases(dateStr: string) {
  // dateStr must be YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  const raw = await getReleasesForDate(date);
  const grouped = groupReleasesForDisplay(raw);
  grouped.sort((a, b) => popularityScore(b) - popularityScore(a));
  return { date, grouped };
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date: dateStr } = await params;
  const result = await getReleases(dateStr);
  if (!result) return {};
  const label = result.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return {
    title: `Releases — ${label}`,
    description: `${result.grouped.length} game${result.grouped.length === 1 ? '' : 's'} releasing on ${label}`,
  };
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function RegionBadge({ region }: { region: RegionGroup }) {
  if (region === 'worldwide') return null;
  const meta = REGION_META[region];
  return (
    <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${meta.badgeClass}`}>
      {meta.abbr}
    </span>
  );
}

function GameLabelBadge({ genres, publishers }: { genres: string[]; publishers: string[] }) {
  const label = gameLabel(genres, publishers);
  if (!label) return null;
  return (
    <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none tracking-wide ${
      label === 'Indie' ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50' : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
    }`}>
      {label}
    </span>
  );
}

function DayGameCard({ release }: { release: GroupedRelease }) {
  const accent = releaseAccentHex(release);
  return (
    <Link
      href={`/releases/game/${release.game.slug}`}
      className="flex gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-colors group"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Cover */}
      <div className="shrink-0">
        {release.game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={release.game.coverUrl} alt="" className="w-16 h-[86px] object-cover rounded-lg" />
        ) : (
          <div className="w-16 h-[86px] bg-zinc-800 rounded-lg" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 flex-wrap mb-1.5">
          <h2 className="text-base font-bold text-zinc-100 group-hover:text-white leading-tight">{release.game.title}</h2>
          <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
          <RegionBadge region={release.region} />
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap gap-1 mb-2">
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

        {/* Developer / Publisher */}
        {(release.game.developers.length > 0 || release.game.publishers.length > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
            {release.game.developers.length > 0 && (
              <span className="text-xs text-zinc-500">
                <span className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold mr-1">Dev</span>
                {release.game.developers.join(', ')}
              </span>
            )}
            {release.game.publishers.length > 0 && (
              <span className="text-xs text-zinc-500">
                <span className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold mr-1">Pub</span>
                {release.game.publishers.join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Genres */}
        {release.game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {release.game.genres.map((g) => (
              <span key={g} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] rounded-full">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Summary snippet */}
        {release.game.summary && (
          <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{release.game.summary}</p>
        )}
      </div>

      {/* Hypes / rating */}
      <div className="shrink-0 text-right hidden sm:flex flex-col items-end gap-1">
        {release.game.hypes != null && release.game.hypes > 0 && (
          <span className="text-xs text-cyan-600 font-semibold">{release.game.hypes.toLocaleString()} <span className="text-zinc-600">hype</span></span>
        )}
        {release.game.rating != null && (
          <span className={`text-sm font-bold ${release.game.rating >= 75 ? 'text-green-400' : release.game.rating >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {Math.round(release.game.rating)}<span className="text-zinc-700 font-normal text-xs">/100</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function DayReleasesPage({ params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  const result = await getReleases(dateStr);
  if (!result) notFound();

  const { date, grouped } = result;
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;

  const dayLabel     = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateLabel    = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const backHref     = `/releases?view=calendar&month=${month}&year=${year}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {MONTH_NAMES[month - 1]} {year}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-1">{dayLabel}</p>
        <h1 className="text-3xl font-black text-zinc-50">{dateLabel}</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {grouped.length === 0
            ? 'No confirmed releases on this date.'
            : `${grouped.length} game${grouped.length === 1 ? '' : 's'} releasing`}
        </p>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Nothing scheduled for this day yet.</p>
          <Link href={backHref} className="text-cyan-600 hover:text-cyan-400 text-sm mt-3 inline-block transition-colors">
            Back to calendar
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((release) => (
            <DayGameCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
}
