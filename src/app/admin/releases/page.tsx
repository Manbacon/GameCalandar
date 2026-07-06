import { prisma } from '@/lib/prisma';
import SyncControls from './SyncControls';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Release Schedule' };

const categoryLabels: Record<string, string> = {
  MAIN_GAME: 'Game', DLC: 'DLC', EXPANSION: 'Expansion', BUNDLE: 'Bundle',
  STANDALONE_EXPANSION: 'Standalone', EPISODE: 'Episode', SEASON: 'Season',
  REMAKE: 'Remake', REMASTER: 'Remaster', EXPANDED_GAME: 'Expanded', PORT: 'Port',
  PACK: 'Pack', UPDATE: 'Update',
};

const statusColour: Record<string, string> = {
  RELEASED:     'bg-green-900/50 text-green-400',
  CONFIRMED:    'bg-cyan-900/50 text-cyan-400',
  ANNOUNCED:    'bg-zinc-700 text-zinc-300',
  RUMOURED:     'bg-yellow-900/50 text-yellow-400',
  EARLY_ACCESS: 'bg-blue-900/50 text-blue-400',
  CANCELLED:    'bg-red-900/50 text-red-400',
};

export default async function AdminReleasesPage() {
  const [games, releasesCount, trackedCount] = await Promise.all([
    prisma.game.findMany({
      orderBy: { title: 'asc' },
      include: {
        releases: { include: { platform: true }, orderBy: { releaseDate: 'asc' } },
        storefronts: true,
      },
      take: 200,
    }),
    prisma.gameRelease.count(),
    prisma.platform.count({ where: { isTracked: true } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-50">Release Schedule</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {games.length} games · {releasesCount} release entries · {trackedCount} tracked platforms
        </p>
      </div>

      <SyncControls />

      {games.length === 0 ? (
        <div className="text-center py-24 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-lg mb-2">No games synced yet.</p>
          <p className="text-sm">Use the sync controls above to import upcoming releases.</p>
        </div>
      ) : (
        <>

          {/* Games table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Game</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Platforms / Dates</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => {
                  const firstRelease = game.releases
                    .filter((r) => r.releaseDate)
                    .sort((a, b) => (a.releaseDate?.getTime() ?? 0) - (b.releaseDate?.getTime() ?? 0))[0];
                  const overallStatus = firstRelease?.status ?? 'ANNOUNCED';

                  return (
                    <tr key={game.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {game.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={game.coverUrl} alt={game.title} className="w-8 h-10 object-cover rounded shrink-0" />
                          ) : (
                            <div className="w-8 h-10 bg-zinc-800 rounded shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-zinc-100 leading-snug">{game.title}</p>
                            {game.genres.length > 0 && (
                              <p className="text-xs text-zinc-600 mt-0.5">{game.genres.slice(0, 3).join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-zinc-400">{categoryLabels[game.category] ?? game.category}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {game.releases.map((r) => (
                            <span key={r.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
                              <span className="text-zinc-500">{r.platform.abbreviation ?? r.platform.name}</span>
                              {r.datePrecision === 'EXACT' && r.releaseDate && (
                                <span>{r.releaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              )}
                              {r.datePrecision === 'MONTH' && r.releaseDate && (
                                <span>{r.releaseDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                              )}
                              {r.datePrecision === 'QUARTER' && <span>{r.quarterLabel}</span>}
                              {r.datePrecision === 'YEAR' && <span>{r.yearLabel}</span>}
                              {r.datePrecision === 'TBD' && <span className="text-zinc-600">TBD</span>}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColour[overallStatus] ?? statusColour.ANNOUNCED}`}>
                          {overallStatus.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
