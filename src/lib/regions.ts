// Client-safe: no server imports. Region normalisation and display metadata.

export type RegionGroup = 'worldwide' | 'pal' | 'ntsc_u' | 'ntsc_j' | 'asia';

export const REGION_META: Record<RegionGroup, { label: string; abbr: string; badgeClass: string }> = {
  worldwide: { label: 'Worldwide',     abbr: 'WW',  badgeClass: '' },
  pal:       { label: 'PAL',           abbr: 'PAL', badgeClass: 'bg-blue-900/50 text-blue-300 border border-blue-700/50' },
  ntsc_u:    { label: 'North America', abbr: 'NA',  badgeClass: 'bg-amber-900/50 text-amber-300 border border-amber-700/50' },
  ntsc_j:    { label: 'Japan',         abbr: 'JP',  badgeClass: 'bg-red-900/50 text-red-300 border border-red-700/50' },
  asia:      { label: 'Asia',          abbr: 'AS',  badgeClass: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' },
};

const REGION_TO_GROUP: Record<string, RegionGroup> = {
  worldwide:    'worldwide',
  europe:       'pal',
  australia:    'pal',
  new_zealand:  'pal',
  north_america: 'ntsc_u',
  japan:        'ntsc_j',
  china:        'asia',
  asia:         'asia',
};

export function normalizeRegionGroup(region: string | null | undefined): RegionGroup {
  if (!region) return 'worldwide';
  return REGION_TO_GROUP[region] ?? 'worldwide';
}

export const SELECTABLE_REGIONS = (['pal', 'ntsc_u', 'ntsc_j', 'asia'] as const) satisfies RegionGroup[];
