import { prisma } from './prisma';
import {
  fetchUpcomingReleaseDates,
  fetchExternalGames,
  fetchGameDetails,
  mapDatePrecision,
  mapQuarterLabel,
  mapGameCategory,
  mapReleaseStatus,
  mapStorefront,
  normalizeCoverUrl,
  normalizeScreenshotUrl,
  shouldIncludePlatform,
  shouldIncludeGame,
  type IgdbReleaseDate,
} from './igdb';
import type { DatePrecision, GameCategory, ReleaseStatus, Storefront } from '@/generated/prisma/client';

export interface SyncResult {
  gamesUpserted: number;
  platformsUpserted: number;
  releasesUpserted: number;
  releasesDeleted: number;
  storefrontsUpserted: number;
  errors: string[];
  durationMs: number;
}

export async function syncIgdbReleases(): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let gamesUpserted = 0;
  let platformsUpserted = 0;
  let releasesUpserted = 0;
  let releasesDeleted = 0;
  let storefrontsUpserted = 0;

  let allReleaseDates: IgdbReleaseDate[] = [];
  try {
    allReleaseDates = await fetchUpcomingReleaseDates(); // default 540 days (18 months)
  } catch (err) {
    const msg = `Failed to fetch release dates: ${(err as Error).message}`;
    console.error('[IGDB sync]', msg);
    errors.push(msg);
    return { gamesUpserted, platformsUpserted, releasesUpserted, releasesDeleted, storefrontsUpserted, errors, durationMs: Date.now() - start };
  }

  // Filter out mobile/legacy platforms, excluded categories, and lifecycle events.
  // IGDB records server-shutdown and delisting dates as release_dates with status=4 (Offline)
  // or status=5 (Cancelled). We only want actual release events.
  const releaseDates = allReleaseDates.filter((rd) => {
    if (!rd.game || !rd.platform) return false;
    if (!shouldIncludeGame(rd.game)) return false;
    if (!shouldIncludePlatform(rd.platform)) return false;
    if (rd.status === 4 || rd.status === 5) return false; // Offline / Cancelled
    return true;
  });

  console.log(`[IGDB sync] ${allReleaseDates.length} total → ${releaseDates.length} after filtering`);

  // Deduplicate platforms and games to minimise DB round-trips
  const platformMap = new Map<number, IgdbReleaseDate['platform']>();
  const gameMap = new Map<number, IgdbReleaseDate['game']>();

  for (const rd of releaseDates) {
    if (rd.platform) platformMap.set(rd.platform.id, rd.platform);
    if (rd.game) gameMap.set(rd.game.id, rd.game);
  }

  // 1. Upsert platforms
  for (const p of platformMap.values()) {
    try {
      await prisma.platform.upsert({
        where: { igdbId: p.id },
        create: {
          igdbId: p.id,
          name: p.name,
          slug: p.slug,
          abbreviation: p.abbreviation ?? null,
          generation: p.generation ?? null,
          // Mark mobile / very old platforms as untracked
          isTracked: (p.generation ?? 99) >= 8 || [6, 14, 3].includes(p.id),
        },
        update: {
          name: p.name,
          abbreviation: p.abbreviation ?? null,
          generation: p.generation ?? null,
        },
      });
      platformsUpserted++;
    } catch (err) {
      errors.push(`Platform ${p.id}: ${(err as Error).message}`);
    }
  }

  // 2. Upsert games
  for (const g of gameMap.values()) {
    try {
      await prisma.game.upsert({
        where: { igdbId: g.id },
        create: {
          igdbId: g.id,
          title: g.name,
          slug: uniqueSlug(g.slug, g.id),
          coverUrl: normalizeCoverUrl(g.cover?.url),
          summary: g.summary ?? null,
          storyline: g.storyline ?? null,
          category: mapGameCategory(g.category) as GameCategory,
          genres: g.genres?.map((genre) => genre.name) ?? [],
          rating: g.rating ?? null,
          ratingCount: g.rating_count ?? null,
          firstReleaseDate: g.first_release_date ? new Date(g.first_release_date * 1000) : null,
          igdbUpdatedAt: g.updated_at ? new Date(g.updated_at * 1000) : null,
        },
        update: {
          title: g.name,
          coverUrl: normalizeCoverUrl(g.cover?.url),
          summary: g.summary ?? null,
          storyline: g.storyline ?? null,
          category: mapGameCategory(g.category) as GameCategory,
          genres: g.genres?.map((genre) => genre.name) ?? [],
          rating: g.rating ?? null,
          ratingCount: g.rating_count ?? null,
          firstReleaseDate: g.first_release_date ? new Date(g.first_release_date * 1000) : null,
          igdbUpdatedAt: g.updated_at ? new Date(g.updated_at * 1000) : null,
        },
      });
      gamesUpserted++;
    } catch (err) {
      errors.push(`Game ${g.id} (${g.name}): ${(err as Error).message}`);
    }
  }

  // 3. Upsert release dates
  for (const rd of releaseDates) {
    if (!rd.game || !rd.platform) continue;

    // Look up our internal IDs
    const [game, platform] = await Promise.all([
      prisma.game.findUnique({ where: { igdbId: rd.game.id }, select: { id: true } }),
      prisma.platform.findUnique({ where: { igdbId: rd.platform.id }, select: { id: true } }),
    ]);
    if (!game || !platform) continue;

    const precision = mapDatePrecision(rd.category);
    const releaseDate = rd.date && precision === 'EXACT' || precision === 'MONTH'
      ? new Date(rd.date! * 1000)
      : rd.date ? new Date(rd.date * 1000)
      : null;

    try {
      await prisma.gameRelease.upsert({
        where: { igdbReleaseDateId: rd.id },
        create: {
          igdbReleaseDateId: rd.id,
          gameId: game.id,
          platformId: platform.id,
          releaseDate,
          datePrecision: precision as DatePrecision,
          quarterLabel: precision === 'QUARTER' && rd.date ? mapQuarterLabel(rd.category, rd.date) : null,
          yearLabel: precision === 'YEAR' && rd.date ? new Date(rd.date * 1000).getFullYear() : null,
          region: regionLabel(rd.release_region),
          status: mapReleaseStatus(rd.game.status) as ReleaseStatus,
        },
        update: {
          releaseDate,
          datePrecision: precision as DatePrecision,
          quarterLabel: precision === 'QUARTER' && rd.date ? mapQuarterLabel(rd.category, rd.date) : null,
          yearLabel: precision === 'YEAR' && rd.date ? new Date(rd.date * 1000).getFullYear() : null,
          region: regionLabel(rd.release_region),
          status: mapReleaseStatus(rd.game.status) as ReleaseStatus,
        },
      });
      releasesUpserted++;
    } catch (err) {
      errors.push(`Release ${rd.id}: ${(err as Error).message}`);
    }
  }

  // 3.5. Clean up stale release dates for each synced game.
  //      When IGDB reschedules a game it sometimes deletes the old release_date record and
  //      creates a new one with a new ID. Our upsert won't touch the orphaned old record, so
  //      we delete any future/TBC GameRelease for a game whose igdbReleaseDateId is no longer
  //      in the current sync batch.
  const syncedIdsByGame = new Map<number, number[]>();
  for (const rd of releaseDates) {
    if (!syncedIdsByGame.has(rd.game.id)) syncedIdsByGame.set(rd.game.id, []);
    syncedIdsByGame.get(rd.game.id)!.push(rd.id);
  }

  const now = new Date();
  for (const [igdbGameId, syncedIds] of syncedIdsByGame) {
    const game = await prisma.game.findUnique({ where: { igdbId: igdbGameId }, select: { id: true } });
    if (!game) continue;
    try {
      const { count } = await prisma.gameRelease.deleteMany({
        where: {
          gameId: game.id,
          igdbReleaseDateId: { notIn: syncedIds },
          OR: [
            { releaseDate: { gte: now } },       // future exact release
            { datePrecision: { not: 'EXACT' } },  // TBC / year / quarter
          ],
        },
      });
      releasesDeleted += count;
    } catch (err) {
      errors.push(`Cleanup game ${igdbGameId}: ${(err as Error).message}`);
    }
  }

  // 3.6. Remove future release records for old games not seen in this sync.
  //      IGDB "Offline" records (server shutdowns, delistings) are now filtered from sync,
  //      but any previously stored records need purging. We identify them by looking for
  //      games with future dates that IGDB no longer returns as upcoming.
  try {
    const seenIgdbGameIds = Array.from(syncedIdsByGame.keys());
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    const { count: offlineCount } = await prisma.gameRelease.deleteMany({
      where: {
        releaseDate: { gte: new Date() },
        game: {
          igdbId: { notIn: seenIgdbGameIds },
          firstReleaseDate: { lt: twoYearsAgo, not: null },
        },
      },
    });
    if (offlineCount > 0) {
      console.log(`[IGDB sync] Removed ${offlineCount} stale lifecycle release records`);
      releasesDeleted += offlineCount;
    }
  } catch (err) {
    errors.push(`Offline cleanup: ${(err as Error).message}`);
  }

  // 4. Fetch and upsert storefronts for PC games
  const pcPlatformIgdbIds = [6, 14, 3]; // Windows, Mac, Linux
  const pcGameIgdbIds = releaseDates
    .filter((rd) => rd.platform && pcPlatformIgdbIds.includes(rd.platform.id))
    .map((rd) => rd.game.id)
    .filter((id, i, arr) => arr.indexOf(id) === i);

  if (pcGameIgdbIds.length > 0) {
    let externalGames: Awaited<ReturnType<typeof fetchExternalGames>> = [];
    try {
      externalGames = await fetchExternalGames(pcGameIgdbIds);
    } catch (err) {
      errors.push(`External games fetch: ${(err as Error).message}`);
    }

    for (const ext of externalGames) {
      const storefrontName = mapStorefront(ext.category);
      if (!storefrontName) continue;

      const game = await prisma.game.findUnique({ where: { igdbId: ext.game }, select: { id: true } });
      if (!game) continue;

      try {
        await prisma.gameStorefront.upsert({
          where: { igdbExternalId: ext.id },
          create: {
            igdbExternalId: ext.id,
            gameId: game.id,
            storefront: storefrontName as Storefront,
            url: ext.url ?? null,
          },
          update: {
            url: ext.url ?? null,
          },
        });
        storefrontsUpserted++;
      } catch (err) {
        // Duplicate [gameId, storefront] — skip silently
        const msg = (err as Error).message;
        if (!msg.includes('Unique constraint')) {
          errors.push(`Storefront ${ext.id}: ${msg}`);
        }
      }
    }
  }

  // 5. Fetch rich game details (screenshots + developer/publisher/website) via /games endpoint.
  //    Done separately because deeply-nested fields are unreliable through release_dates.
  const allGameIgdbIds = Array.from(gameMap.keys());
  if (allGameIgdbIds.length > 0) {
    let gameDetails: Awaited<ReturnType<typeof fetchGameDetails>> = [];
    try {
      gameDetails = await fetchGameDetails(allGameIgdbIds);
    } catch (err) {
      errors.push(`Game details fetch: ${(err as Error).message}`);
    }

    for (const details of gameDetails) {
      const game = await prisma.game.findUnique({ where: { igdbId: details.id }, select: { id: true } });
      if (!game) continue;

      // Update developer, publisher, website on the game record
      const developers = details.involved_companies?.filter((ic) => ic.developer).map((ic) => ic.company.name) ?? [];
      const publishers = details.involved_companies?.filter((ic) => ic.publisher).map((ic) => ic.company.name) ?? [];
      const websiteUrl = details.websites?.find((w) => w.category === 1)?.url ?? null;
      try {
        await prisma.game.update({
          where: { id: game.id },
          data: { developers, publishers, websiteUrl, hypes: details.hypes ?? null },
        });
      } catch (err) {
        errors.push(`Game details update ${details.id}: ${(err as Error).message}`);
      }

      // Upsert screenshots (max 6)
      for (const shot of (details.screenshots ?? []).slice(0, 6)) {
        const url = normalizeScreenshotUrl(shot.url);
        if (!url) continue;
        try {
          await prisma.gameScreenshot.upsert({
            where: { igdbId: shot.id },
            create: { igdbId: shot.id, url, gameId: game.id },
            update: { url },
          });
        } catch {
          // skip duplicate constraint errors silently
        }
      }
    }
  }

  return {
    gamesUpserted,
    platformsUpserted,
    releasesUpserted,
    releasesDeleted,
    storefrontsUpserted,
    errors,
    durationMs: Date.now() - start,
  };
}

// IGDB slugs are globally unique but collision is possible with our cuid-based IDs
// Append IGDB ID suffix only if a conflicting record exists for a different igdbId
function uniqueSlug(slug: string, igdbId: number): string {
  return `${slug}--${igdbId}`;
}

const REGION_LABELS: Record<number, string> = {
  1: 'europe',
  2: 'north_america',
  3: 'australia',
  4: 'new_zealand',
  5: 'japan',
  6: 'china',
  7: 'asia',
  8: 'worldwide',
};

function regionLabel(region: number | undefined): string {
  if (!region) return 'worldwide';
  return REGION_LABELS[region] ?? 'worldwide';
}
