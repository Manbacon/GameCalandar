import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { platformHex } from '@/lib/platform-colours';
import { normalizeRegionGroup, REGION_META, type RegionGroup } from '@/lib/regions';

const REGION_FLAGS: Record<RegionGroup, string> = {
  worldwide: '🌐',
  pal:       '🇪🇺',
  ntsc_u:    '🌎',
  ntsc_j:    '🇯🇵',
  asia:      '🌏',
};
import { gameLabel } from '@/lib/game-labels';
import type { Metadata } from 'next';

async function getGame(slug: string) {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      releases: {
        where: { platform: { isTracked: true } },
        include: { platform: true },
        orderBy: [{ releaseDate: 'asc' }],
      },
      storefronts: { orderBy: { storefront: 'asc' } },
      screenshots: { orderBy: { igdbId: 'asc' } },
    },
  });
}

type Game = NonNullable<Awaited<ReturnType<typeof getGame>>>;
type Release = Game['releases'][number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return {};
  return {
    title: `${game.title} — Release Schedule`,
    description: game.summary ?? undefined,
    openGraph: game.coverUrl ? { images: [game.coverUrl] } : undefined,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatReleaseDate(r: Release): string {
  if (r.datePrecision === 'EXACT' && r.releaseDate) {
    return r.releaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (r.datePrecision === 'QUARTER' && r.quarterLabel) return r.quarterLabel;
  if (r.datePrecision === 'YEAR' && r.yearLabel) return String(r.yearLabel);
  if (r.datePrecision === 'MONTH' && r.releaseDate) {
    return r.releaseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return 'TBD';
}

// Group by platform + region, keeping the earliest/most precise date per combination.
// This handles IGDB duplicate records for the same platform+region while preserving
// legitimate regional variants (e.g. Switch 2 Japan vs Switch 2 Worldwide).
function dedupeReleases(releases: Release[]): Release[] {
  const best = new Map<string, Release>();
  for (const r of releases) {
    const key = `${r.platformId}::${normalizeRegionGroup(r.region)}`;
    const existing = best.get(key);
    if (!existing) {
      best.set(key, r);
    } else {
      const rExact = r.datePrecision === 'EXACT';
      const eExact = existing.datePrecision === 'EXACT';
      if (rExact && !eExact) {
        best.set(key, r);
      } else if (rExact === eExact && r.releaseDate && existing.releaseDate && r.releaseDate < existing.releaseDate) {
        best.set(key, r);
      }
    }
  }
  return Array.from(best.values()).sort((a, b) => {
    if (!a.releaseDate && !b.releaseDate) return 0;
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return a.releaseDate.getTime() - b.releaseDate.getTime();
  });
}


const STOREFRONT_META: Record<string, { label: string; colour: string }> = {
  STEAM:       { label: 'Steam',              colour: '#1b2838' },
  EPIC:        { label: 'Epic Games Store',   colour: '#2a2a2a' },
  GOG:         { label: 'GOG',                colour: '#7b2fbe' },
  MICROSOFT:   { label: 'Xbox / Game Pass',   colour: '#107c10' },
  PLAYSTATION: { label: 'PlayStation Store',  colour: '#003791' },
  NINTENDO:    { label: 'Nintendo eShop',     colour: '#e4000f' },
  ITCHIO:      { label: 'itch.io',            colour: '#fa5c5c' },
  OTHER:       { label: 'Store',              colour: '#3f3f46' },
};

const CATEGORY_LABELS: Record<string, string> = {
  DLC: 'DLC', EXPANSION: 'Expansion', BUNDLE: 'Bundle',
  STANDALONE_EXPANSION: 'Standalone Expansion', EPISODE: 'Episode',
  SEASON: 'Season', REMAKE: 'Remake', REMASTER: 'Remaster',
  EXPANDED_GAME: 'Expanded Edition', PORT: 'Port', PACK: 'Pack', UPDATE: 'Update',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  const releases     = dedupeReleases(game.releases);
  const categoryLabel = CATEGORY_LABELS[game.category];
  const heroImage    = game.screenshots[0]?.url ?? game.coverUrl;
  const ratingScore  = game.rating ? Math.round(game.rating) : null;
  const ratingColour = ratingScore == null ? '' : ratingScore >= 75 ? 'text-green-400' : ratingScore >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Blurred backdrop */}
        {heroImage && (
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(48px)',
              opacity: 0.18,
            }}
          />
        )}
        {/* Gradient overlay — fades to page bg at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="pt-6 pb-8">
            <Link
              href="/releases"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Release Schedule
            </Link>
          </div>

          {/* Hero content */}
          <div className="flex gap-6 md:gap-10 items-end pb-12">
            {/* Cover art */}
            <div className="shrink-0">
              {game.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={game.coverUrl}
                  alt={game.title}
                  className="w-36 md:w-52 rounded-xl shadow-2xl ring-1 ring-white/10"
                />
              ) : (
                <div className="w-36 md:w-52 aspect-[3/4] bg-zinc-800 rounded-xl ring-1 ring-white/10" />
              )}
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {categoryLabel && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase tracking-wider">
                    {categoryLabel}
                  </span>
                )}
                {(() => {
                  const label = gameLabel(game.genres, game.publishers);
                  if (!label) return null;
                  return (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      label === 'Indie'
                        ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50'
                        : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                    }`}>
                      {label}
                    </span>
                  );
                })()}
                {game.hypes != null && game.hypes > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-400">
                    <svg className="w-3 h-3 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {game.hypes.toLocaleString()} following
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                {game.title}
              </h1>

              {/* Developer · Publisher · Rating */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-5">
                {game.developers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Developer</p>
                    <p className="text-sm font-semibold text-zinc-200">{game.developers.join(', ')}</p>
                  </div>
                )}
                {game.publishers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Publisher</p>
                    <p className="text-sm font-semibold text-zinc-200">{game.publishers.join(', ')}</p>
                  </div>
                )}
                {ratingScore != null && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">
                      Rating{game.ratingCount ? ` · ${game.ratingCount.toLocaleString()} votes` : ''}
                    </p>
                    <p className={`text-sm font-bold ${ratingColour}`}>{ratingScore}<span className="text-zinc-600 font-normal">/100</span></p>
                  </div>
                )}
              </div>

              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {game.genres.map((g) => (
                    <span key={g} className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Release dates — grouped by platform */}
              {releases.length > 0 && (
                <div className="flex flex-col gap-3 mb-5">
                  {(() => {
                    // Group by platform for cleaner display
                    const byPlatform = new Map<string, Release[]>();
                    for (const r of releases) {
                      if (!byPlatform.has(r.platformId)) byPlatform.set(r.platformId, []);
                      byPlatform.get(r.platformId)!.push(r);
                    }
                    return Array.from(byPlatform.values()).map((platformReleases) => {
                      const p = platformReleases[0].platform;
                      return (
                        <div key={p.id}>
                          {/* Platform header */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white leading-none"
                              style={{ backgroundColor: platformHex(p.igdbId) }}
                            >
                              {p.abbreviation ?? p.name.slice(0, 4).toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-zinc-400">{p.name}</span>
                          </div>
                          {/* Date rows */}
                          <div className="flex flex-col gap-1 pl-3 border-l-2" style={{ borderColor: platformHex(p.igdbId) + '40' }}>
                            {platformReleases.map((r) => {
                              const region = normalizeRegionGroup(r.region);
                              const meta   = REGION_META[region];
                              return (
                                <div key={r.id} className="flex items-center gap-2.5">
                                  <span className="text-sm text-zinc-200 font-medium">{formatReleaseDate(r)}</span>
                                  {region !== 'worldwide' ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}>
                                      <span>{REGION_FLAGS[region]}</span>
                                      <span>{meta.label}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                                      <span>🌐</span>
                                      <span>{meta.label}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Storefronts */}
              {game.storefronts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {game.storefronts.map((s) => {
                    const meta = STOREFRONT_META[s.storefront] ?? STOREFRONT_META.OTHER;
                    return s.url ? (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: meta.colour, border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {meta.label}
                      </a>
                    ) : (
                      <span
                        key={s.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700"
                      >
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Official site */}
              {game.websiteUrl && (
                <a
                  href={game.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
                >
                  Official website
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* About */}
        {(game.summary || game.storyline) && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">About</h2>
            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed max-w-3xl">
              {game.summary && <p>{game.summary}</p>}
              {game.storyline && game.storyline !== game.summary && (
                <p className="text-zinc-400">{game.storyline}</p>
              )}
            </div>
          </section>
        )}

        {/* Screenshots */}
        {game.screenshots.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Screenshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {game.screenshots.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.id}
                  src={s.url}
                  alt=""
                  className="rounded-lg w-full aspect-video object-cover bg-zinc-900"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
