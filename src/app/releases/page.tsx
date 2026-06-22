import {
  getReleasesForMonth,
  getImpreciseReleases,
  getReleasesForList,
  getTrackedPlatforms,
  groupReleasesForDisplay,
  filterByPlatform,
  filterByRegion,
  groupByDate,
  groupImprecise,
  releaseAccentHex,
  platformHex,
  MULTI_HEX,
  type GroupedRelease,
  type ImpreciseBucket,
} from '@/lib/releases';
import { REGION_META, type RegionGroup } from '@/lib/regions';
import { gameLabel } from '@/lib/game-labels';
import FilterDesktopPanel, { FilterMobileTrigger } from './FilterSidebar';
import MonthPicker from './MonthPicker';
import RegionBar from './RegionBar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Release Schedule',
  description: 'Upcoming game release dates — Monster Gaming',
};

export const revalidate = 3600;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function popularityScore(release: GroupedRelease): number {
  const hypes  = release.game.hypes       ?? 0;
  const votes  = release.game.ratingCount ?? 0;
  const rating = release.game.rating      ?? 50;
  return hypes > 0 ? hypes : votes * (rating / 100);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon = 0
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Shared components ────────────────────────────────────────────────────────

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

function RegionBadge({ region }: { region: RegionGroup }) {
  if (region === 'worldwide') return null;
  const meta = REGION_META[region];
  return (
    <span className={`shrink-0 inline-block px-1 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${meta.badgeClass}`}>
      {meta.abbr}
    </span>
  );
}

function PlatformBadge({ igdbId, abbreviation, name }: { igdbId: number; abbreviation: string | null; name: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none"
      style={{ backgroundColor: platformHex(igdbId) }}
      title={name}
    >
      {abbreviation ?? name.slice(0, 3).toUpperCase()}
    </span>
  );
}

function ReleaseBadges({ release }: { release: GroupedRelease }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {release.platforms.map((p) => (
        <PlatformBadge key={p.id} igdbId={p.igdbId} abbreviation={p.abbreviation} name={p.name} />
      ))}
    </div>
  );
}

// ─── Spotlight ────────────────────────────────────────────────────────────────

function SpotlightCard({ release, rank }: { release: GroupedRelease; rank: number }) {
  const accent = releaseAccentHex(release);
  const dateStr = release.releaseDate
    ? release.releaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  return (
    <Link
      href={`/releases/game/${release.game.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
        {release.game.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.game.coverUrl}
            alt={release.game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[10px] font-black text-zinc-300">{rank}</span>
        </div>
        <div className="absolute top-2 right-2">
          <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
        </div>
        {release.game.hypes != null && release.game.hypes > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-950/70 backdrop-blur-sm text-cyan-400 border border-cyan-900/50">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {release.game.hypes >= 1000 ? `${(release.game.hypes / 1000).toFixed(1)}k` : release.game.hypes}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3 bg-zinc-950" style={{ borderTop: `2px solid ${accent}` }}>
        <p className="text-sm font-bold text-zinc-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {release.game.title}
        </p>
        <ReleaseBadges release={release} />
        {dateStr && <p className="text-[11px] text-zinc-500 font-medium">{dateStr}</p>}
      </div>
    </Link>
  );
}

function SpotlightSection({ releases, month, year }: { releases: GroupedRelease[]; month: number; year: number }) {
  if (!releases.length) return null;
  // Deduplicate by game — pick the earliest/best entry per game for the spotlight
  const seen = new Set<string>();
  const unique = releases.filter((r) => {
    if (seen.has(r.game.id)) return false;
    seen.add(r.game.id);
    return true;
  });
  const top = [...unique].sort((a, b) => popularityScore(b) - popularityScore(a)).slice(0, 4);
  if (!top.length) return null;

  return (
    <div className="mb-8">
      <div className="mb-3">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Most Anticipated</p>
        <h2 className="text-sm font-black text-zinc-400">{MONTH_NAMES[month - 1]} {year} Spotlight</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {top.map((release, i) => (
          <SpotlightCard key={release.id} release={release} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarChip({ release }: { release: GroupedRelease }) {
  const accent = releaseAccentHex(release);
  return (
    <Link
      href={`/releases/game/${release.game.slug}`}
      className="flex flex-col gap-0.5 pl-2 pr-1.5 py-1 rounded text-[11px] transition-colors hover:brightness-110"
      style={{ borderLeft: `3px solid ${accent}`, backgroundColor: `${accent}18` }}
    >
      <div className="flex items-center gap-1 min-w-0">
        {release.game.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={release.game.coverUrl} alt="" className="w-4 h-5 object-cover rounded-sm shrink-0" />
        )}
        <span className="text-zinc-200 truncate font-medium leading-tight">{release.game.title}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <ReleaseBadges release={release} />
        <RegionBadge region={release.region} />
        <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
      </div>
    </Link>
  );
}

function CalendarGrid({
  year,
  month,
  releasesByDate,
}: {
  year: number;
  month: number;
  releasesByDate: Map<string, GroupedRelease[]>;
}) {
  const days   = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);
  const today  = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-zinc-600 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="min-h-[90px]" />;
          const dateKey = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayReleases = releasesByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          const isPast  = new Date(year, month - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const hasDayPage = dayReleases.length > 0;

          return (
            <div
              key={dateKey}
              className={`min-h-[90px] p-1.5 rounded-lg border transition-colors ${
                isToday      ? 'border-cyan-500 bg-cyan-950/20'
                : dayReleases.length ? 'border-zinc-700 bg-zinc-900'
                : 'border-zinc-800/40 bg-zinc-900/20'
              } ${isPast && !isToday ? 'opacity-50' : ''}`}
            >
              {hasDayPage ? (
                <Link
                  href={`/releases/day/${dateKey}`}
                  className={`text-xs font-bold mb-1 block hover:underline ${isToday ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {day}
                </Link>
              ) : (
                <p className={`text-xs font-bold mb-1 ${isToday ? 'text-cyan-400' : 'text-zinc-500'}`}>{day}</p>
              )}
              <div className="space-y-0.5">
                {[...dayReleases]
                  .sort((a, b) => popularityScore(b) - popularityScore(a))
                  .slice(0, 4)
                  .map((r) => (
                    <CalendarChip key={r.id} release={r} />
                  ))}
                {dayReleases.length > 4 && (
                  <Link
                    href={`/releases/day/${dateKey}`}
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 pl-1 transition-colors block"
                  >
                    +{dayReleases.length - 4} more
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListCard({ release }: { release: GroupedRelease }) {
  const accent = releaseAccentHex(release);
  return (
    <Link
      href={`/releases/game/${release.game.slug}`}
      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2.5 transition-colors group"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {release.game.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={release.game.coverUrl} alt="" className="w-9 h-12 object-cover rounded shrink-0" />
      ) : (
        <div className="w-9 h-12 bg-zinc-800 rounded shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <p className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white">{release.game.title}</p>
          <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
          <RegionBadge region={release.region} />
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <ReleaseBadges release={release} />
          {release.game.storefronts.length > 0 && (
            <span className="text-[10px] text-zinc-600">
              {release.game.storefronts.map((s) => s.storefront).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ListView({ releases }: { releases: GroupedRelease[] }) {
  const weeks = new Map<string, GroupedRelease[]>();
  for (const r of releases) {
    if (!r.releaseDate) continue;
    const d = new Date(r.releaseDate);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = mon.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(r);
  }

  if (!weeks.size) {
    return <p className="text-zinc-500 text-sm py-12 text-center">No confirmed releases in the next 90 days.</p>;
  }

  return (
    <div className="space-y-8">
      {Array.from(weeks.entries()).map(([weekStart, weekReleases]) => {
        const mon = new Date(weekStart);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        const label = `${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        const byDay = new Map<string, GroupedRelease[]>();
        for (const r of weekReleases) {
          const key = r.releaseDate!.toISOString().slice(0, 10);
          if (!byDay.has(key)) byDay.set(key, []);
          byDay.get(key)!.push(r);
        }

        return (
          <section key={weekStart}>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3 pb-2 border-b border-zinc-800">{label}</h3>
            <div className="space-y-4">
              {Array.from(byDay.entries()).map(([dateKey, dayReleases]) => {
                const date = new Date(dateKey);
                return (
                  <div key={dateKey} className="flex gap-4 items-start">
                    <Link href={`/releases/day/${dateKey}`} className="w-14 shrink-0 text-right pt-1 group">
                      <p className="text-sm font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                      <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </Link>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {dayReleases.map((r) => <ListCard key={r.id} release={r} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── TBC section ──────────────────────────────────────────────────────────────

function TbcCard({ release }: { release: GroupedRelease }) {
  const accent = releaseAccentHex(release);
  return (
    <div
      className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {release.game.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={release.game.coverUrl} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
      ) : (
        <div className="w-8 h-10 bg-zinc-800 rounded shrink-0" />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{release.game.title}</p>
          <GameLabelBadge genres={release.game.genres} publishers={release.game.publishers} />
          <RegionBadge region={release.region} />
        </div>
        <ReleaseBadges release={release} />
      </div>
    </div>
  );
}

function ImpreciseSection({ buckets }: { buckets: ImpreciseBucket[] }) {
  if (!buckets.length) return null;
  return (
    <section className="mt-12 pt-8 border-t border-zinc-800">
      <h2 className="text-xl font-black text-zinc-100 mb-1">Upcoming — Date TBC</h2>
      <p className="text-sm text-zinc-500 mb-6">Release windows and unscheduled titles.</p>
      <div className="space-y-6">
        {buckets.map((b) => (
          <div key={b.label}>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3 pb-2 border-b border-zinc-800">{b.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {b.releases.map((r) => <TbcCard key={r.id} release={r} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; year?: string; platforms?: string; regions?: string }>;
}) {
  const sp = await searchParams;
  const view = sp.view === 'list' ? 'list' : 'calendar';

  const now   = new Date();
  const year  = sp.year  ? parseInt(sp.year)  : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const platformFilter = sp.platforms
    ? sp.platforms.split(',').map(Number).filter(Boolean)
    : [];

  const regionFilter: RegionGroup[] = sp.regions
    ? (sp.regions.split(',').filter(Boolean) as RegionGroup[])
    : [];

  const [rawCalendar, rawList, rawImprecise, trackedPlatforms] = await Promise.all([
    view === 'calendar' ? getReleasesForMonth(year, month) : Promise.resolve([]),
    view === 'list'     ? getReleasesForList(90)           : Promise.resolve([]),
    getImpreciseReleases(),
    getTrackedPlatforms(),
  ]);

  const calendarReleases = groupByDate(filterByRegion(filterByPlatform(groupReleasesForDisplay(rawCalendar), platformFilter), regionFilter));
  const listReleases     = filterByRegion(filterByPlatform(groupReleasesForDisplay(rawList), platformFilter), regionFilter);
  const impreciseBuckets = groupImprecise(filterByRegion(filterByPlatform(groupReleasesForDisplay(rawImprecise), platformFilter), regionFilter));

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;

  // Build filter query string suffix shared by all nav links
  const filterQs = `${platformFilter.length ? `&platforms=${sp.platforms}` : ''}${regionFilter.length ? `&regions=${sp.regions}` : ''}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-50">Release Schedule</h1>
          <p className="text-zinc-400 text-sm mt-1">Upcoming game releases across all platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <FilterMobileTrigger platforms={trackedPlatforms} />
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <Link
              href={`/releases?view=calendar&month=${month}&year=${year}${filterQs}`}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${view === 'calendar' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Calendar
            </Link>
            <Link
              href={`/releases?view=list${filterQs}`}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${view === 'list' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              List
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {view === 'calendar' && (
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/releases?view=calendar&month=${prevMonth}&year=${prevYear}${filterQs}`}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                title={`${MONTH_NAMES[prevMonth - 1]} ${prevYear}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              <MonthPicker
                month={month}
                year={year}
                platformsParam={platformFilter.length ? sp.platforms : undefined}
                regionsParam={regionFilter.length ? sp.regions : undefined}
              />

              <Link
                href={`/releases?view=calendar&month=${nextMonth}&year=${nextYear}${filterQs}`}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                title={`${MONTH_NAMES[nextMonth - 1]} ${nextYear}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {view === 'calendar' && (
            <div className="mb-5">
              <RegionBar />
            </div>
          )}

          {view === 'calendar' && (
            <SpotlightSection
              releases={Array.from(calendarReleases.values()).flat()}
              month={month}
              year={year}
            />
          )}

          {view === 'calendar' ? (
            <CalendarGrid year={year} month={month} releasesByDate={calendarReleases} />
          ) : (
            <ListView releases={listReleases} />
          )}

          <ImpreciseSection buckets={impreciseBuckets} />
        </div>

        <div className="hidden lg:block w-52 shrink-0">
          <FilterDesktopPanel platforms={trackedPlatforms} />
        </div>
      </div>
    </div>
  );
}
