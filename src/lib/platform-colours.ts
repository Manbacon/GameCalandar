// Pure constants — no server imports. Safe to import in both Server and Client Components.

export const PLATFORM_HEX: Record<number, string> = {
  // PlayStation family — blue → indigo → purple for VR
  167: '#1d4ed8',  // PS5               blue-700
  48:  '#4f46e5',  // PS4               indigo-600
  390: '#9333ea',  // PlayStation VR2   purple-600
  // Xbox family — green → teal for last-gen
  169: '#16a34a',  // Xbox Series X|S   green-600
  49:  '#0f766e',  // Xbox One          teal-700
  // Nintendo family — red → rose to distinguish generations
  130: '#dc2626',  // Nintendo Switch   red-600
  508: '#e11d48',  // Nintendo Switch 2 rose-600
  // PC / desktop — distinct hues per platform
  6:   '#0891b2',  // PC (Windows)      cyan-600
  14:  '#94a3b8',  // Mac               slate-400 (Apple silver)
  3:   '#ea580c',  // Linux             orange-600
  // VR / extended reality
  385: '#7c3aed',  // Oculus Rift       violet-700
  163: '#0284c7',  // SteamVR           sky-600
  161: '#475569',  // Windows Mixed Reality slate-600
};

export const MULTI_HEX   = '#d97706'; // amber-600 — multi-platform
export const DEFAULT_HEX = '#52525b'; // zinc-600  — unknown platform

export function platformHex(igdbId: number): string {
  return PLATFORM_HEX[igdbId] ?? DEFAULT_HEX;
}
