'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SyncResult = {
  gamesUpserted: number;
  platformsUpserted: number;
  releasesUpserted: number;
  releasesDeleted: number;
  storefrontsUpserted: number;
  errors: string[];
  durationMs: number;
};

export default function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/igdb-sync', { method: 'POST' });
      const data = await res.json() as SyncResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Sync failed');
      } else {
        setResult(data);
        router.refresh(); // re-fetches server data without losing client state
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
          syncing
            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
        }`}
      >
        {syncing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Syncing…
          </span>
        ) : '⟳ Sync from IGDB'}
      </button>

      {error && (
        <p className="text-xs text-red-400 max-w-xs text-right">{error}</p>
      )}

      {result && (
        <div className="text-xs text-right space-y-0.5 max-w-xs">
          <p className="text-green-400 font-semibold">Sync complete in {(result.durationMs / 1000).toFixed(1)}s</p>
          <p className="text-zinc-400">
            {result.gamesUpserted} games · {result.releasesUpserted} releases · {result.storefrontsUpserted} storefronts
            {result.releasesDeleted > 0 && <span className="text-yellow-600"> · {result.releasesDeleted} stale removed</span>}
          </p>
          {result.errors.length > 0 && (
            <details className="text-left mt-1">
              <summary className="text-yellow-500 cursor-pointer">{result.errors.length} warning(s)</summary>
              <ul className="mt-1 space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-red-400 break-all">{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
