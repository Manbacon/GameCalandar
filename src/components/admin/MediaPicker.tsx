'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

type MediaFile = { url: string; name: string; size: number; mtime: string };

type Props = {
  onSelect: (url: string) => void;
  onClose: () => void;
};

export default function MediaPicker({ onSelect, onClose }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/upload');
      const data = await res.json() as { files: MediaFile[] };
      setFiles(data.files ?? []);
      setLoaded(true);
    } catch {
      setError('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const { error: msg } = await res.json() as { error: string };
        throw new Error(msg);
      }
      await fetchFiles();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.name !== filename));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-50">Media Library</h2>
          <div className="flex items-center gap-3">
            <label className={`px-3 py-1.5 rounded text-sm font-semibold cursor-pointer transition-colors ${uploading ? 'bg-zinc-700 text-zinc-400' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
              {uploading ? 'Uploading…' : '+ Upload'}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-300">{error}</div>
          )}

          {loading && !loaded ? (
            <div className="text-center py-20 text-zinc-500">Loading…</div>
          ) : files.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p>No images uploaded yet.</p>
              <p className="text-sm mt-1">Click &ldquo;+ Upload&rdquo; to add your first image.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-orange-500 transition-colors"
                  onClick={() => onSelect(f.url)}
                >
                  <Image
                    src={f.url}
                    alt={f.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.name); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-zinc-200 truncate">{f.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
