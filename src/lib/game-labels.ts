// Client-safe: no server imports. Derives display labels from game data.

const AAA_PUBLISHERS = new Set([
  // Sony
  'Sony Interactive Entertainment', 'PlayStation Studios', 'Sony Computer Entertainment',
  // Microsoft / Xbox
  'Xbox Game Studios', 'Microsoft Studios', 'Bethesda Softworks', 'Activision',
  'Activision Blizzard', 'Blizzard Entertainment', 'King',
  // Nintendo
  'Nintendo',
  // EA
  'Electronic Arts', 'EA Games', 'EA Sports', 'EA Originals',
  // Ubisoft
  'Ubisoft',
  // Take-Two / 2K / Rockstar
  'Take-Two Interactive', '2K Games', '2K Sports', 'Rockstar Games', 'Private Division',
  // Capcom
  'Capcom',
  // Square Enix
  'Square Enix',
  // Bandai Namco
  'Bandai Namco Entertainment', 'Bandai Namco Studios',
  // Sega / Atlus
  'Sega', 'Atlus',
  // Konami
  'Konami Digital Entertainment', 'Konami',
  // WB / NetherRealm
  'Warner Bros. Games', 'Warner Bros Interactive Entertainment',
  // Others
  'THQ Nordic', 'Koch Media', 'Deep Silver', 'CD Projekt', 'Paradox Interactive',
  'Focus Entertainment', 'Nacon',
]);

export type GameLabel = 'AAA' | 'Indie' | null;

export function gameLabel(genres: string[], publishers: string[]): GameLabel {
  // Indie check first — some indie games are published by major labels (e.g. Private Division)
  // IGDB tags indie games explicitly in their genre list.
  if (genres.some((g) => g.toLowerCase() === 'indie')) return 'Indie';
  if (publishers.some((p) => AAA_PUBLISHERS.has(p))) return 'AAA';
  return null;
}
