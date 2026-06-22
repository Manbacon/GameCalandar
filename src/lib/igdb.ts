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

// IGDB date category → our DatePrecision
// 0/1/2 = exact, 3 = month, 4 = year, 5-8 = quarter, 9 = TBD
export function mapDatePrecision(igdbCategory: number): 'EXACT' | 'MONTH' | 'QUARTER' | 'YEAR' | 'TBD' {
  if (igdbCategory === 9) return 'TBD';
  if (igdbCategory === 4) return 'YEAR';
  if (igdbCategory === 3) return 'MONTH';
  if (igdbCategory >= 5 && igdbCategory <= 8) return 'QUARTER';
  return 'EXACT';
}

export function mapQuarterLabel(igdbCategory: number, date: number): string | null {
  const quarter = igdbCategory - 4; // 5→Q1, 6→Q2, 7→Q3, 8→Q4
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
  category: number; // date precision
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

// Platform IDs to exclude: mobile, very old hardware, and niche/irrelevant platforms
const EXCLUDED_PLATFORM_IDS = new Set([
  34,  // Android
  39,  // iOS
  38,  // iPad
  45,  // Windows Phone
  55,  // Mobile (generic)
  87,  // N-Gage
  // Legacy consoles (gen <= 6)
  7,   // PS1
  8,   // PS2
  9,   // PS3
  11,  // Xbox
  12,  // Xbox 360
  5,   // Wii
  41,  // Wii U
  24,  // GBA
  20,  // DS
  37,  // 3DS
  22,  // GameBoy Color
  33,  // GameBoy Advance
  // Niche / irrelevant
  46,  // PlayStation Vita
  82,  // Web browser
  161, // Windows Mixed Reality
  381, // Playdate
  438, // Arduboy
  472, // visionOS
]);

// IGDB game categories to exclude: mods (5) and forks (12)
const EXCLUDED_GAME_CATEGORIES = new Set([5, 12]);

export function shouldIncludePlatform(platform: IgdbReleaseDate['platform']): boolean {
  if (EXCLUDED_PLATFORM_IDS.has(platform.id)) return false;
  // Exclude anything with a generation lower than 8 (PS4 era) — but keep PC/Mac/Linux which may have no generation
  const pcIds = new Set([3, 6, 14]); // Linux, PC Windows, Mac
  if (pcIds.has(platform.id)) return true;
  if (platform.generation !== undefined && platform.generation < 8) return false;
  return true;
}

export function shouldIncludeGame(game: IgdbReleaseDate['game']): boolean {
  return !EXCLUDED_GAME_CATEGORIES.has(game.category);
}

// Fetch all upcoming release dates within the window, paginating through IGDB's 500-result cap.
// daysAhead defaults to 540 (18 months) — enough to capture credibly-announced titles.
export async function fetchUpcomingReleaseDates(daysAhead = 540): Promise<IgdbReleaseDate[]> {
  const now    = Math.floor(Date.now() / 1000);
  const future = now + daysAhead * 24 * 60 * 60;

  const fields = `
    fields id, date, release_region, status, category,
      game.id, game.name, game.slug, game.summary, game.storyline, game.category,
      game.rating, game.rating_count, game.first_release_date, game.updated_at,
      game.cover.url, game.genres.name, game.status,
      platform.id, platform.name, platform.slug, platform.abbreviation, platform.generation;
  `;

  async function paginate(where: string, sort: string): Promise<IgdbReleaseDate[]> {
    const all: IgdbReleaseDate[] = [];
    let offset = 0;
    // Safety cap: 10 pages × 500 = 5000 results max
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

  // Run both queries in parallel — IGDB allows 4 req/s, two concurrent is fine
  const [upcoming, imprecise] = await Promise.all([
    paginate(`date >= ${now} & date <= ${future}`, 'date asc'),
    // TBD / year / quarter: no date filter possible, take most recently updated
    paginate('category = (4,5,6,7,8,9)', 'updated_at desc'),
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
