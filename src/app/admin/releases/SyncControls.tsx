'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TRACKED_PLATFORMS } from '@/lib/igdb';

type SyncResult = {
  gamesUpserted: number;
  platformsUpserted: number;
  releasesUpserted: number;
  releasesDeleted: number;
  storefrontsUpserted: number;
  errors: string[];
  log: string[];
  durationMs: number;
  error?: string;
};

type CleanupResult = {
  releasesDeleted: number;
  gamesDeleted: number;
  log: string[];
  error?: string;
};

export default function SyncControls() {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [gameId, setGameId] = useState('');
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function ts() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function addLog(lines: string | string[]) {
    const entries = (Array.isArray(lines) ? lines : [lines]).map((l) => `[${ts()}] ${l}`);
    setLog((prev) => [...prev, ...entries]);
  }

  async function runSync(endpoint: string, body: object, label: string) {
    if (syncing) return;
    setSyncing(label);
    addLog(`▶ Starting: ${label}`);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as SyncResult;
      if (!res.ok || data.error) {
        addLog(`✗ Error: ${data.error ?? 'Sync failed'}`);
      } else {
        if (data.log?.length) addLog(data.log);
        addLog(
          `✓ Complete — ${data.gamesUpserted} games, ${data.releasesUpserted} releases` +
          (data.releasesDeleted > 0 ? `, ${data.releasesDeleted} removed` : '') +
          ` (${(data.durationMs / 1000).toFixed(1)}s)`
        );
        if (data.errors?.length) {
          addLog(`⚠ ${data.errors.length} warning(s):`);
          data.errors.forEach((e) => addLog(`  ${e}`));
        }
        router.refresh();
      }
    } catch (err) {
      addLog(`✗ ${(err as Error).message}`);
    } finally {
      setSyncing(null);
    }
  }

  async function runCleanup() {
    if (syncing) return;
    setSyncing('DB cleanup');
    addLog('▶ Starting DB cleanup — removing releases/games for non-tracked platforms…');
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json() as CleanupResult;
      if (!res.ok || data.error) {
        addLog(`✗ Error: ${data.error ?? 'Cleanup failed'}`);
      } else {
        if (data.log?.length) addLog(data.log);
        addLog(`✓ Cleanup complete — ${data.releasesDeleted} releases removed, ${data.gamesDeleted} games removed`);
        router.refresh();
      }
    } catch (err) {
      addLog(`✗ ${(err as Error).message}`);
    } finally {
      setSyncing(null);
    }
  }

  const busy = syncing !== null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
      <h2 className="text-base font-black text-zinc-100 mb-5">Sync Controls</h2>

      {/* Per-platform + Sync All */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Sync by Platform</p>
        <div className="flex flex-wrap gap-2 items-center">
          {TRACKED_PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => runSync('/api/admin/igdb-sync', { platformIds: [p.id] }, `${p.name}`)}
              disabled={busy}
              title={p.name}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:border-violet-600 hover:bg-violet-950/40 text-zinc-300 hover:text-violet-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {syncing === p.name ? (
                <span className="flex items-center gap-1.5">
                  <Spinner /> {p.abbr}
                </span>
              ) : p.abbr}
            </button>
          ))}
          <button
            onClick={() => runSync('/api/admin/igdb-sync', {}, 'Full sync')}
            disabled={busy}
            className="ml-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {syncing === 'Full sync' ? <><Spinner /> Syncing…</> : '↺ Sync All'}
          </button>
          <button
            onClick={() => {
              if (confirm('This will permanently delete all releases and games for non-tracked platforms. Continue?')) {
                runCleanup();
              }
            }}
            disabled={busy}
            className="ml-auto px-3 py-1.5 bg-red-900/40 border border-red-800 hover:bg-red-900/70 hover:border-red-600 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {syncing === 'DB cleanup' ? <><Spinner /> Cleaning…</> : '🗑 Clean DB'}
          </button>
        </div>
      </div>

      {/* Single game by IGDB ID */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Sync Single Game by IGDB ID</p>
        <div className="flex gap-2 max-w-sm">
          <input
            type="number"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && gameId && !busy) {
                runSync('/api/admin/igdb-sync/game', { igdbId: parseInt(gameId) }, `Game ${gameId}`);
              }
            }}
            placeholder="IGDB Game ID — e.g. 119133"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => {
              const id = parseInt(gameId);
              if (!id || busy) return;
              runSync('/api/admin/igdb-sync/game', { igdbId: id }, `Game ${gameId}`);
            }}
            disabled={!gameId || busy}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {syncing?.startsWith('Game ') ? <><Spinner /> Syncing…</> : 'Sync'}
          </button>
        </div>
      </div>

      {/* Log output */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Output Log</p>
          {log.length > 0 && (
            <button onClick={() => setLog([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
              Clear
            </button>
          )}
        </div>
        <pre
          ref={logRef}
          className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 font-mono overflow-auto h-48 whitespace-pre-wrap"
        >
          {log.length === 0
            ? <span className="text-zinc-700">Log output will appear here…</span>
            : log.join('\n')}
        </pre>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
