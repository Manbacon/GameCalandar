'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { REGION_META, SELECTABLE_REGIONS, type RegionGroup } from '@/lib/regions';

const REGION_FLAGS: Record<RegionGroup, string> = {
  worldwide: '🌐',
  pal:       '🇪🇺',
  ntsc_u:    '🌎',
  ntsc_j:    '🇯🇵',
  asia:      '🌏',
};

export default function RegionBar() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const selected: RegionGroup[] = searchParams.get('regions')
    ? (searchParams.get('regions')!.split(',').filter(Boolean) as RegionGroup[])
    : [];

  function toggle(group: RegionGroup) {
    const next = selected.includes(group)
      ? selected.filter((r) => r !== group)
      : [...selected, group];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set('regions', next.join(','));
    else params.delete('regions');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('regions');
    router.push(`${pathname}?${params.toString()}`);
  }

  const allSelected = selected.length === 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* "All" pill — clears the filter */}
      <button
        onClick={clearAll}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
          allSelected
            ? 'bg-zinc-700 border-zinc-600 text-zinc-100 shadow-sm'
            : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
        }`}
      >
        <span className="text-base leading-none">🌐</span>
        <span>All</span>
      </button>

      {SELECTABLE_REGIONS.map((group) => {
        const meta    = REGION_META[group];
        const active  = selected.includes(group);
        return (
          <button
            key={group}
            onClick={() => toggle(group)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
              active
                ? 'bg-violet-900/40 border-violet-600 text-violet-200 shadow-sm shadow-violet-900/30'
                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <span className="text-base leading-none">{REGION_FLAGS[group]}</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
