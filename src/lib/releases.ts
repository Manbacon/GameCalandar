import { prisma } from './prisma';
import { platformHex as _platformHex, MULTI_HEX as _MULTI_HEX } from './platform-colours';
export { PLATFORM_HEX, MULTI_HEX, DEFAULT_HEX, platformHex } from './platform-colours';
export { type RegionGroup, REGION_META, normalizeRegionGroup, SELECTABLE_REGIONS } from './regions';
import { normalizeRegionGroup } from './regions';
import type { RegionGroup } from './regions';

const releaseInclude = {
  game: { include: { storefronts: true } },
  platform: true,
} as const;

export type ReleaseEntry = Awaited<ReturnType<typeof getReleasesForMonth>>[number];

export async function getReleasesForMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);
  return prisma.gameRelease.findMany({
    where: { datePrecision: 'EXACT', releaseDate: { gte: start, lt: end }, status: { notIn: ['CANCELLED'] }, platform: { isTracked: true } },
    include: releaseInclude,
    orderBy: { releaseDate: 'asc' },
  });
}

export async function getImpreciseReleases() {
  return prisma.gameRelease.findMany({
    where: { datePrecision: { not: 'EXACT' }, status: { notIn: ['CANCELLED', 'RELEASED'] }, platform: { isTracked: true } },
    include: releaseInclude,
    orderBy: [{ yearLabel: 'asc' }, { quarterLabel: 'asc' }, { releaseDate: 'asc' }],
  });
}

export async function getReleasesForList(daysAhead = 90) {
  const now    = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return prisma.gameRelease.findMany({
    where: { datePrecision: 'EXACT', releaseDate: { gte: now, lte: future }, status: { notIn: ['CANCELLED'] }, platform: { isTracked: true } },
    include: releaseInclude,
    orderBy: { releaseDate: 'asc' },
  });
}

export async function getReleasesForDate(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return prisma.gameRelease.findMany({
    where: { datePrecision: 'EXACT', releaseDate: { gte: start, lt: end }, status: { notIn: ['CANCELLED'] }, platform: { isTracked: true } },
    include: releaseInclude,
    orderBy: { releaseDate: 'asc' },
  });
}

export async function getTrackedPlatforms() {
  return prisma.platform.findMany({
    where: { isTracked: true },
    orderBy: { name: 'asc' },
  });
}

// ─── Platform colour helpers ──────────────────────────────────────────────────

export function releaseAccentHex(release: GroupedRelease): string {
  return release.platforms.length > 1
    ? _MULTI_HEX
    : _platformHex(release.platforms[0]?.igdbId ?? 0);
}

// ─── Grouped display types ────────────────────────────────────────────────────

export type PlatformSummary = {
  id: string;
  igdbId: number;
  name: string;
  abbreviation: string | null;
};

export type GroupedRelease = {
  id: string;
  game: ReleaseEntry['game'];
  releaseDate: Date | null;
  datePrecision: string;
  quarterLabel: string | null;
  yearLabel: number | null;
  platforms: PlatformSummary[];
  region: RegionGroup;
  status: string;
};

// Merge same-game, same-day, same-region releases across platforms.
// Different dates OR different regions remain separate entries.
export function groupReleasesForDisplay(releases: ReleaseEntry[]): GroupedRelease[] {
  const map = new Map<string, GroupedRelease>();
  for (const r of releases) {
    const regionGroup = normalizeRegionGroup(r.region);
    const dateKey = r.releaseDate
      ? r.releaseDate.toISOString().slice(0, 10)
      : (r.quarterLabel ?? (r.yearLabel ? String(r.yearLabel) : 'tbd'));
    // Include region in key so regional variants stay separate
    const key = `${r.gameId}::${dateKey}::${regionGroup}`;

    if (map.has(key)) {
      const entry = map.get(key)!;
      if (!entry.platforms.some((p) => p.id === r.platformId)) {
        entry.platforms.push({ id: r.platformId, igdbId: r.platform.igdbId, name: r.platform.name, abbreviation: r.platform.abbreviation });
      }
    } else {
      map.set(key, {
        id: key,
        game: r.game,
        releaseDate: r.releaseDate,
        datePrecision: r.datePrecision,
        quarterLabel: r.quarterLabel,
        yearLabel: r.yearLabel,
        platforms: [{ id: r.platformId, igdbId: r.platform.igdbId, name: r.platform.name, abbreviation: r.platform.abbreviation }],
        region: regionGroup,
        status: r.status,
      });
    }
  }
  return Array.from(map.values());
}

// Filter by platform igdbIds — strips non-selected platforms within each GroupedRelease.
export function filterByPlatform(releases: GroupedRelease[], igdbIds: number[]): GroupedRelease[] {
  if (!igdbIds.length) return releases;
  return releases
    .map((r) => ({ ...r, platforms: r.platforms.filter((p) => igdbIds.includes(p.igdbId)) }))
    .filter((r) => r.platforms.length > 0);
}

// Filter by region groups. Worldwide releases are always included (relevant to every region).
export function filterByRegion(releases: GroupedRelease[], groups: RegionGroup[]): GroupedRelease[] {
  if (!groups.length) return releases;
  return releases.filter((r) => r.region === 'worldwide' || groups.includes(r.region));
}

export function groupByDate(releases: GroupedRelease[]): Map<string, GroupedRelease[]> {
  const map = new Map<string, GroupedRelease[]>();
  for (const r of releases) {
    if (!r.releaseDate) continue;
    const key = r.releaseDate.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

export type ImpreciseBucket = { label: string; releases: GroupedRelease[] };

export function groupImprecise(releases: GroupedRelease[]): ImpreciseBucket[] {
  const buckets = new Map<string, GroupedRelease[]>();
  for (const r of releases) {
    let label: string;
    if      (r.datePrecision === 'QUARTER' && r.quarterLabel) label = r.quarterLabel;
    else if (r.datePrecision === 'YEAR'    && r.yearLabel)    label = String(r.yearLabel);
    else if (r.datePrecision === 'MONTH'   && r.releaseDate)  label = r.releaseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    else label = 'TBD';
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(r);
  }
  return Array.from(buckets.entries()).map(([label, rs]) => ({ label, releases: rs }));
}
