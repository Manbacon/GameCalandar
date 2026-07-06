// IGDB API client (Twitch OAuth2 + APIcalypse queries)

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`IGDB auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

export async function igdbQuery<T = unknown>(endpoint: string, body: string): Promise<T[]> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID!,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB ${endpoint} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T[]>;
}

// IGDB date_format → our DatePrecision
// 0 = exact, 1 = month, 2 = year, 3-6 = quarter (3=Q1, 4=Q2, 5=Q3, 6=Q4), 7 = TBD
export function mapDatePrecision(igdbDateFormat: number): 'EXACT' | 'MONTH' | 'QUARTER' | 'YEAR' | 'TBD' {
  if (igdbDateFormat === 7) return 'TBD';
  if (igdbDateFormat === 2) return 'YEAR';
  if (igdbDateFormat === 1) return 'MONTH';
  if (igdbDateFormat >= 3 && igdbDateFormat <= 6) return 'QUARTER';
  return 'EXACT';
}

export function mapQuarterLabel(igdbDateFormat: number, date: number): string | null {
  const quarter = igdbDateFormat - 2; // 3→Q1, 4→Q2, 5→Q3, 6→Q4
  if (quarter < 1 || quarter > 4) return null;
  const year = new Date(date * 1000).getFullYear();
  return `Q${quarter} ${year}`;
}

// IGDB game status → our ReleaseStatus
export function mapReleaseStatus(igdbStatus: number | undefined): 'RUMOURED' | 'ANNOUNCED' | 'CONFIRMED' | 'EARLY_ACCESS' | 'RELEASED' | 'CANCELLED' {
  switch (igdbStatus) {
    case 0: return 'RELEASED';
    case 2: return 'EARLY_ACCESS'; // alpha
    case 3: return 'EARLY_ACCESS'; // beta
    case 4: return 'EARLY_ACCESS'; // early access
    case 5: return 'CANCELLED';
    case 6: return 'RUMOURED';
    default: return 'ANNOUNCED';
  }
}

// IGDB game category → our GameCategory
export function mapGameCategory(igdbCategory: number): string {
  const map: Record<number, string> = {
    0: 'MAIN_GAME',
    1: 'DLC',
    2: 'EXPANSION',
    3: 'BUNDLE',
    4: 'STANDALONE_EXPANSION',
    6: 'EPISODE',
    7: 'SEASON',
    8: 'REMAKE',
    9: 'REMASTER',
    10: 'EXPANDED_GAME',
    11: 'PORT',
    13: 'PACK',
    14: 'UPDATE',
  };
  return map[igdbCategory] ?? 'MAIN_GAME';
}

// IGDB external_games category → our Storefront
export function mapStorefront(igdbExtCategory: number): string | null {
  const map: Record<number, string> = {
    1: 'STEAM',
    5: 'GOG',
    11: 'MICROSOFT',
    26: 'EPIC',
    28: 'ITCHIO',
  };
  return map[igdbExtCategory] ?? null;
}

// Normalize IGDB cover URLs: //images.igdb.com/... → https://images.igdb.com/.../t_cover_big/...
export function normalizeCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  const full = url.startsWith('//') ? `https:${url}` : url;
  return full.replace('/t_thumb/', '/t_cover_big/');
}

export function normalizeScreenshotUrl(url: string | undefined): string | null {
  if (!url) return null;
  const full = url.startsWith('//') ? `https:${url}` : url;
  return full.replace('/t_thumb/', '/t_screenshot_big/');
}

// ─── Typed IGDB response shapes ──────────────────────────────────────────────

export interface IgdbReleaseDate {
  id: number;
  date?: number;
  release_region?: number;
  status?: number;
  date_format: number; // date precision (0=exact,1=month,2=year,3-6=quarter,7=TBD)
  game: {
    id: number;
    name: string;
    slug: string;
    summary?: string;
    storyline?: string;
    category: number;
    rating?: number;
    rating_count?: number;
    first_release_date?: number;
    updated_at?: number;
    cover?: { url: string };
    genres?: { name: string }[];
    status?: number;
  };
  platform: {
    id: number;
    name: string;
    slug: string;
    abbreviation?: string;
    generation?: number;
  };
}

export interface IgdbExternalGame {
  id: number;
  game: number;
  category: number;
  url?: string;
}

// Rich game details fetched separately via /games endpoint (more reliable than nested release_dates expansion)
export interface IgdbGameDetails {
  id: number;
  hypes?: number;
  screenshots?: { id: number; url: string }[];
  involved_companies?: { company: { name: string }; developer: boolean; publisher: boolean }[];
  websites?: { category: number; url: string }[];
}

// Explicit allowlist — only these IGDB platform IDs are tracked; everything else is ignored
export const TRACKED_PLATFORM_IDS = new Set([
  3,   // Linux
  6,   // PC (Windows)
  14,  // Mac
  48,  // PlayStation 4
  49,  // Xbox One
  130, // Nintendo Switch
  167, // PlayStation 5
  169, // Xbox Series X|S
  386, // Meta Quest 2
  471, // Meta Quest 3
  508, // Nintendo Switch 2
]);

// Ordered list for the admin UI — console-first, then PC, then VR
export const TRACKED_PLATFORMS = [
  { id: 167, name: 'PlayStation 5',     abbr: 'PS5'      },
  { id: 48,  name: 'PlayStation 4',     abbr: 'PS4'      },
  { id: 169, name: 'Xbox Series X|S',   abbr: 'XSX'      },
  { id: 49,  name: 'Xbox One',          abbr: 'XONE'     },
  { id: 508, name: 'Nintendo Switch 2', abbr: 'Switch 2' },
  { id: 130, name: 'Nintendo Switch',   abbr: 'Switch'   },
  { id: 6,   name: 'PC (Windows)',      abbr: 'PC'       },
  { id: 14,  name: 'Mac',               abbr: 'Mac'      },
  { id: 3,   name: 'Linux',             abbr: 'Linux'    },
  { id: 471, name: 'Meta Quest 3',      abbr: 'Quest 3'  },
  { id: 386, name: 'Meta Quest 2',      abbr: 'Quest 2'  },
] as const;

// IGDB game categories to exclude: mods (5) and forks (12)
const EXCLUDED_GAME_CATEGORIES = new Set([5, 12]);

export function shouldIncludePlatform(platform: { id: number }): boolean {
  return TRACKED_PLATFORM_IDS.has(platform.id);
}

export function shouldIncludeGame(game: IgdbReleaseDate['game']): boolean {
  return !EXCLUDED_GAME_CATEGORIES.has(game.category);
}

// Fetch upcoming release dates from IGDB, restricted to the tracked platform allowlist.
// Pass platformIds to limit to specific platforms (e.g. per-platform sync).
// daysAhead defaults to 540 (18 months) — enough to capture credibly-announced titles.
export async function fetchUpcomingReleaseDates(daysAhead = 540, platformIds?: number[]): Promise<IgdbReleaseDate[]> {
  const now     = Math.floor(Date.now() / 1000);
  const future  = now + daysAhead * 24 * 60 * 60;
  const pids    = platformIds ?? Array.from(TRACKED_PLATFORM_IDS);
  const pFilter = `platform = (${pids.join(',')})`;

  const fields = `
    fields id, date, release_region, status, date_format,
      game.id, game.name, game.slug, game.summary, game.storyline, game.category,
      game.rating, game.rating_count, game.first_release_date, game.updated_at,
      game.cover.url, game.genres.name, game.status,
      platform.id, platform.name, platform.slug, platform.abbreviation, platform.generation;
  `;

  async function paginate(where: string, sort: string): Promise<IgdbReleaseDate[]> {
    const all: IgdbReleaseDate[] = [];
    let offset = 0;
    while (offset < 5000) {
      const batch = await igdbQuery<IgdbReleaseDate>('release_dates', `
        ${fields}
        where ${where};
        sort ${sort};
        limit 500;
        offset ${offset};
      `);
      all.push(...batch);
      if (batch.length < 500) break;
      offset += 500;
    }
    return all;
  }

  const [upcoming, imprecise] = await Promise.all([
    paginate(`${pFilter} & date >= ${now} & date <= ${future}`, 'date asc'),
    paginate(`${pFilter} & date_format = (1,2,3,4,5,6,7)`, 'updated_at desc'),
  ]);

  console.log(`[IGDB] Fetched ${upcoming.length} upcoming + ${imprecise.length} imprecise release dates`);
  return [...upcoming, ...imprecise];
}

export async function fetchGameDetails(igdbGameIds: number[]): Promise<IgdbGameDetails[]> {
  if (!igdbGameIds.length) return [];
  const chunks: number[][] = [];
  for (let i = 0; i < igdbGameIds.length; i += 100) chunks.push(igdbGameIds.slice(i, i + 100));
  const results = await Promise.all(
    chunks.map((ids) =>
      igdbQuery<IgdbGameDetails>('games', `
        fields id, hypes,
          screenshots.id, screenshots.url,
          involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
          websites.category, websites.url;
        where id = (${ids.join(',')});
        limit 100;
      `)
    )
  );
  return results.flat();
}

export async function fetchExternalGames(igdbGameIds: number[]): Promise<IgdbExternalGame[]> {
  if (!igdbGameIds.length) return [];
  // Fetch in chunks of 100 to stay within IGDB limits
  const chunks: number[][] = [];
  for (let i = 0; i < igdbGameIds.length; i += 100) {
    chunks.push(igdbGameIds.slice(i, i + 100));
  }
  const results = await Promise.all(
    chunks.map((ids) =>
      igdbQuery<IgdbExternalGame>('external_games', `
        fields id, game, category, url;
        where game = (${ids.join(',')}) & category = (1,5,11,26,28);
        limit 500;
      `)
    )
  );
  return results.flat();
}
