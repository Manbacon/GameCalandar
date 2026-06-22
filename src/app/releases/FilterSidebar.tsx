'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { PLATFORM_HEX, MULTI_HEX, DEFAULT_HEX } from '@/lib/platform-colours';

type Platform = {
  id: string;
  igdbId: number;
  name: string;
  abbreviation: string | null;
};

function colourFor(igdbId: number) {
  return PLATFORM_HEX[igdbId] ?? DEFAULT_HEX;
}

function Dot({ colour }: { colour: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colour }} />;
}

function CheckRow({
  label,
  checked,
  colour,
  onToggle,
  extra,
}: {
  label: string;
  checked: boolean;
  colour: string;
  onToggle: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1 select-none">
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
        style={checked
          ? { backgroundColor: colour, borderColor: colour }
          : { borderColor: '#52525b', backgroundColor: 'transparent' }
        }
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4l2.5 2.5L9 1" />
          </svg>
        )}
      </span>
      {extra}
      <span className={`text-sm transition-colors leading-tight ${checked ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
        {label}
      </span>
    </label>
  );
}

function FilterContent({
  platforms,
  selectedIds,
  onTogglePlatform,
  onClearAll,
}: {
  platforms: Platform[];
  selectedIds: number[];
  onTogglePlatform: (id: number) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Platforms</p>
        {selectedIds.length > 0 && (
          <button onClick={onClearAll} className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors">
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {platforms.map((p) => (
          <CheckRow
            key={p.id}
            label={p.abbreviation ?? p.name}
            checked={selectedIds.includes(p.igdbId)}
            colour={colourFor(p.igdbId)}
            onToggle={() => onTogglePlatform(p.igdbId)}
            extra={<Dot colour={colourFor(p.igdbId)} />}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
        <Dot colour={MULTI_HEX} />
        <span className="text-xs text-zinc-500">Multi-platform</span>
      </div>
    </div>
  );
}

function useFilterState() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const selectedIds: number[] = searchParams.get('platforms')
    ? searchParams.get('platforms')!.split(',').map(Number).filter(Boolean)
    : [];

  function togglePlatform(igdbId: number) {
    const next = selectedIds.includes(igdbId)
      ? selectedIds.filter((id) => id !== igdbId)
      : [...selectedIds, igdbId];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set('platforms', next.join(','));
    else params.delete('platforms');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('platforms');
    router.push(`${pathname}?${params.toString()}`);
  }

  return { selectedIds, togglePlatform, clearAll };
}

// ─── Mobile trigger + drawer ───────────────────────────────────────────────────

export function FilterMobileTrigger({ platforms }: { platforms: Platform[] }) {
  const { selectedIds, togglePlatform, clearAll } = useFilterState();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M9 20h6" />
        </svg>
        Filters
        {selectedIds.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full leading-none">
            {selectedIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-full bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-base font-bold text-zinc-100">Filters</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 flex-1">
              <FilterContent
                platforms={platforms}
                selectedIds={selectedIds}
                onTogglePlatform={togglePlatform}
                onClearAll={clearAll}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Desktop sticky panel ──────────────────────────────────────────────────────

export default function FilterDesktopPanel({ platforms }: { platforms: Platform[] }) {
  const { selectedIds, togglePlatform, clearAll } = useFilterState();

  return (
    <div className="sticky top-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <FilterContent
        platforms={platforms}
        selectedIds={selectedIds}
        onTogglePlatform={togglePlatform}
        onClearAll={clearAll}
      />
    </div>
  );
}
