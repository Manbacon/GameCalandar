'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

type LocalFile = { url: string; name: string; size: number; mtime: string; external?: false };
type RefFile = { url: string; name: string; external: true };
type AnyFile = LocalFile | RefFile;

type ApiResponse = {
  files: LocalFile[];
  referencedImages: RefFile[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isLocal(f: AnyFile): f is LocalFile {
  return !f.external;
}

export default function MediaPage() {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [referencedImages, setReferencedImages] = useState<RefFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AnyFile | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/upload');
      const data = await res.json() as ApiResponse;
      setLocalFiles(data.files ?? []);
      setReferencedImages(data.referencedImages ?? []);
    } catch {
      setError('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setUploading(true);
    setError('');
    try {
      await Promise.all(
        picked.map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          if (!res.ok) {
            const { error: msg } = await res.json() as { error: string };
            throw new Error(`${file.name}: ${msg}`);
          }
        })
      );
      await fetchFiles();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (f: LocalFile) => {
    if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return;
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: f.name }),
    });
    if (res.ok) {
      setLocalFiles((prev) => prev.filter((x) => x.name !== f.name));
      if (selected?.name === f.name) setSelected(null);
    }
  };

  const copyUrl = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderGrid = (items: AnyFile[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((f) => (
        <div
          key={f.url}
          onClick={() => setSelected(f)}
          className={`group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
            selected?.url === f.url ? 'border-orange-500' : 'border-transparent hover:border-zinc-600'
          }`}
        >
          <Image
            src={f.url}
            alt={f.name}
            fill
            className="object-cover"
            sizes="200px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-8 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-50">Media Library</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {localFiles.length} uploaded · {referencedImages.length} referenced from posts
          </p>
        </div>
        <label className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${uploading ? 'bg-zinc-700 text-zinc-400' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
          {uploading ? 'Uploading…' : '+ Upload Images'}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-300">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Grid */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading…</div>
          ) : (
            <>
              {/* Uploaded files */}
              <section>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-3">
                  Uploaded ({localFiles.length})
                </h2>
                {localFiles.length === 0 ? (
                  <div className="py-10 border-2 border-dashed border-zinc-800 rounded-xl text-center text-zinc-600 text-sm">
                    No uploads yet — click &ldquo;+ Upload Images&rdquo; to get started.
                  </div>
                ) : renderGrid(localFiles)}
              </section>

              {/* Referenced from WordPress / external posts */}
              {referencedImages.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-1">
                    Referenced in Posts ({referencedImages.length})
                  </h2>
                  <p className="text-xs text-zinc-600 mb-3">
                    These images are used in your posts but not stored locally — they were imported from WordPress.
                    Click to copy the URL.
                  </p>
                  {renderGrid(referencedImages)}
                </section>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <aside className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-fit sticky top-4">
          {selected ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                <Image src={selected.url} alt={selected.name} fill className="object-contain" unoptimized />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-zinc-200 break-all">{selected.name}</p>
                {isLocal(selected) && <p className="text-zinc-500">{formatBytes(selected.size)}</p>}
                {isLocal(selected) && (
                  <p className="text-zinc-500">{new Date(selected.mtime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
                {selected.external && (
                  <p className="text-xs text-amber-500">External (WordPress import)</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={selected.url}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 font-mono"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded transition-colors shrink-0"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
                <a
                  href={selected.url}
                  target="_blank"
                  className="text-center px-3 py-1.5 text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                >
                  Open in new tab
                </a>
                {isLocal(selected) && (
                  <button
                    onClick={() => handleDelete(selected)}
                    className="px-3 py-1.5 text-xs bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/60 rounded transition-colors"
                  >
                    Delete permanently
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-600">
              <p className="text-sm">Select an image to see details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
