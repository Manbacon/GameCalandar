'use client';

import { useState, useTransition, useRef } from 'react';
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor';
import MediaPicker from './MediaPicker';

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

type Props = {
  postId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialStatus?: 'DRAFT' | 'PUBLISHED';
  initialType?: 'ARTICLE' | 'REVIEW' | 'LIST' | 'NEWS';
  initialCategories?: string[];
  initialTags?: string[];
  initialFeaturedImage?: string;
  allCategories: Category[];
  allTags: Tag[];
  action: (formData: FormData) => Promise<void>;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PostForm({
  postId,
  initialTitle = '',
  initialSlug = '',
  initialExcerpt = '',
  initialContent = '',
  initialStatus = 'DRAFT',
  initialType = 'ARTICLE',
  initialCategories = [],
  initialTags = [],
  initialFeaturedImage = '',
  allCategories,
  allTags,
  action,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [slugManual, setSlugManual] = useState(!!initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialStatus);
  const [type, setType] = useState(initialType);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [tagInput, setTagInput] = useState(initialTags.join(', '));
  const [featuredImage, setFeaturedImage] = useState(initialFeaturedImage);
  const [contentHtml, setContentHtml] = useState(initialContent);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'featured' | 'editor'>('featured');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const openMediaForFeatured = () => { setMediaTarget('featured'); setShowMedia(true); };
  const openMediaForEditor = () => { setMediaTarget('editor'); setShowMedia(true); };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === 'featured') {
      setFeaturedImage(url);
    } else {
      editorRef.current?.insertImage(url);
    }
    setShowMedia(false);
  };

  const handleSubmit = (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    setError('');
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('slug', slug);
        fd.append('excerpt', excerpt);
        fd.append('content', contentHtml);
        fd.append('status', submitStatus);
        fd.append('type', type);
        fd.append('featuredImage', featuredImage);
        selectedCategories.forEach((id) => fd.append('categories', id));
        fd.append('tagNames', tagInput);
        await action(fd);
      } catch (err) {
        const msg = (err as Error).message;
        if (!msg.includes('NEXT_REDIRECT')) setError(msg);
      }
    });
  };

  return (
    <>
      {showMedia && (
        <MediaPicker
          onSelect={handleMediaSelect}
          onClose={() => setShowMedia(false)}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-300">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-50 text-lg font-semibold placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Post title…"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="auto-generated-from-title"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Short summary shown on cards and archives…"
            />
          </div>

          {/* Rich text editor */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-1">Content</label>
            <RichTextEditor
              ref={editorRef}
              initialContent={initialContent}
              onChange={setContentHtml}
              onImageInsert={openMediaForEditor}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Publish box */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Publish</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm font-semibold border border-zinc-600 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Publishing…' : status === 'PUBLISHED' ? 'Update' : 'Publish'}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Status: <span className="font-medium text-zinc-400">{status}</span>
            </p>
          </div>

          {/* Post type */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mb-3">Post Type</h3>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ARTICLE">Article</option>
              <option value="REVIEW">Review</option>
              <option value="LIST">List</option>
              <option value="NEWS">News</option>
            </select>
          </div>

          {/* Featured image */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mb-3">Featured Image</h3>
            {featuredImage ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredImage} alt="Featured" className="w-full aspect-video object-cover rounded-lg" />
                <div className="flex gap-2">
                  <button type="button" onClick={openMediaForFeatured} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                    Change
                  </button>
                  <button type="button" onClick={() => setFeaturedImage('')} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openMediaForFeatured}
                className="w-full py-6 border-2 border-dashed border-zinc-600 hover:border-orange-500 rounded-lg text-sm text-zinc-500 hover:text-orange-400 transition-colors"
              >
                + Set featured image
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mb-3">Categories</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {allCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) =>
                      setSelectedCategories((prev) =>
                        e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id)
                      )
                    }
                    className="accent-orange-500"
                  />
                  <span className="text-sm text-zinc-300">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mb-1">Tags</h3>
            <p className="text-xs text-zinc-500 mb-2">Comma-separated. New tags are created automatically.</p>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="nintendo, retro, rpg"
            />
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {allTags.slice(0, 20).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const existing = tagInput.split(',').map((s) => s.trim()).filter(Boolean);
                      if (!existing.includes(t.name)) {
                        setTagInput(existing.length ? `${tagInput.trim()}, ${t.name}` : t.name);
                      }
                    }}
                    className="px-2 py-0.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded-full transition-colors"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
