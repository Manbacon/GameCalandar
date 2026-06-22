'use client';

import { useEditor, EditorContent, useEditorState, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseWidthFromStyle(style: string | null | undefined) {
  return style?.match(/width:\s*([^;]+)/)?.[1]?.trim() ?? '';
}
function parseAlignFromStyle(style: string | null | undefined) {
  const float = style?.match(/float:\s*([^;]+)/)?.[1]?.trim();
  const display = style?.match(/display:\s*([^;]+)/)?.[1]?.trim();
  if (float === 'left') return 'left';
  if (float === 'right') return 'right';
  if (display === 'block') return 'center';
  return '';
}
function buildImageStyle(width: string, align: string): string {
  const parts: string[] = [];
  if (width) parts.push(`width: ${width}`);
  if (align === 'left') parts.push('float: left', 'margin: 0 1.5rem 1rem 0');
  else if (align === 'right') parts.push('float: right', 'margin: 0 0 1rem 1.5rem');
  else if (align === 'center') parts.push('display: block', 'margin: 0 auto 1rem');
  return parts.join('; ');
}
function formatHtml(html: string): string {
  if (!html.trim()) return '';
  const BLOCK = 'p|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|figure|figcaption|div|table|thead|tbody|tr|td|th';
  const VOID = 'hr|img|br';
  let out = html;
  out = out.replace(new RegExp(`(<\\/?(${BLOCK})(?:\\s[^>]*)?>)`, 'gi'), '\n$1\n');
  out = out.replace(new RegExp(`(<(?:${VOID})(?:\\s[^>]*)?>)`, 'gi'), '\n$1\n');
  const INDENT_OPEN = /^<(ul|ol|blockquote|figure|table|thead|tbody|tr)(\s|>)/i;
  const INDENT_CLOSE = /^<\/(ul|ol|blockquote|figure|table|thead|tbody|tr)>/i;
  const lines = out.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let depth = 0;
  return lines.map((line) => {
    if (INDENT_CLOSE.test(line)) depth = Math.max(0, depth - 1);
    const result = '  '.repeat(depth) + line;
    if (INDENT_OPEN.test(line)) depth++;
    return result;
  }).join('\n');
}

// ── Image NodeView — fixed preview size; size/align only affect published HTML ─
function ImageNodeView({ node, selected }: NodeViewProps) {
  const style = node.attrs.style as string | null | undefined;
  const width = parseWidthFromStyle(style);
  const align = parseAlignFromStyle(style);
  const badgeParts = [width && `${width}`, align && align].filter(Boolean);
  const badge = badgeParts.join(' · ');

  return (
    <NodeViewWrapper
      as="span"
      className="relative inline-block my-3 max-w-full"
      data-drag-handle
    >
      {/* Fixed preview size — does NOT reflect width/align settings */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        draggable={false}
        style={{ maxHeight: '260px', width: 'auto', maxWidth: '100%', display: 'block', borderRadius: '0.375rem' }}
        className={selected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-900' : ''}
      />
      {/* Badge shows the size/align that will apply on the published post */}
      {badge && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-mono bg-black/75 text-orange-400 select-none pointer-events-none">
          {badge}
        </span>
      )}
    </NodeViewWrapper>
  );
}

// ── Extended Image extension ──────────────────────────────────────────────────
const Image = TiptapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute('style'),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style as string } : {}),
      },
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class as string } : {}),
      },
    };
  },
});

// ── Toolbar button ────────────────────────────────────────────────────────────
function Btn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-zinc-50'
      }`}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="w-px h-5 bg-zinc-700 mx-1 shrink-0" />;

// ── Image controls bar ────────────────────────────────────────────────────────
type ImageAttrs = { src?: string; style?: string; class?: string };

function ImageBar({ attrs, onUpdate }: { attrs: ImageAttrs; onUpdate: (style: string) => void }) {
  const width = parseWidthFromStyle(attrs.style);
  const align = parseAlignFromStyle(attrs.style);

  const setSize = (w: string) => onUpdate(buildImageStyle(w, align));
  const setAlign = (a: string) => onUpdate(buildImageStyle(width || '100%', a));

  const sizes = [
    { label: 'Original', value: '' },
    { label: '25%', value: '25%' },
    { label: '33%', value: '33%' },
    { label: '50%', value: '50%' },
    { label: '75%', value: '75%' },
    { label: '100%', value: '100%' },
  ];
  const aligns = [
    { label: '← Left', value: 'left' },
    { label: '— Center', value: 'center' },
    { label: 'Right →', value: 'right' },
    { label: '✕ None', value: '' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-zinc-950 border-b border-zinc-700 text-xs">
      <span className="text-zinc-400 font-semibold uppercase tracking-wide shrink-0">Published size:</span>
      <div className="flex items-center gap-1 flex-wrap">
        {sizes.map(({ label, value }) => (
          <button key={label} type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSize(value)}
            className={`px-2 py-0.5 rounded transition-colors ${
              width === value ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <Sep />
      <div className="flex items-center gap-1 flex-wrap">
        {aligns.map(({ label, value }) => (
          <button key={value} type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setAlign(value)}
            className={`px-2 py-0.5 rounded transition-colors ${
              align === value ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-zinc-600 italic ml-auto hidden sm:block">Preview size is fixed — changes apply on publish</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  initialContent?: string;
  onChange: (html: string) => void;
  onImageInsert?: () => void;
};
export type RichTextEditorHandle = { insertImage: (url: string) => void };

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor(
  { initialContent = '', onChange, onImageInsert },
  ref
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
      CharacterCount,
    ],
    content: initialContent,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      setSourceHtml(html);
      onChangeRef.current(html);
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
    },
  }));

  useEffect(() => { return () => { editor?.destroy(); }; }, [editor]);

  const toggleSourceMode = useCallback(() => {
    if (!sourceMode) {
      const html = editor?.getHTML() ?? sourceHtml;
      setSourceHtml(formatHtml(html));
      setSourceMode(true);
    } else {
      editor?.commands.setContent(sourceHtml);
      onChangeRef.current(sourceHtml);
      setSourceMode(false);
    }
  }, [sourceMode, editor, sourceHtml]);

  const handleSourceChange = (val: string) => {
    setSourceHtml(val);
    onChangeRef.current(val);
  };

  const addLink = () => {
    const previous = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') editor?.chain().focus().unsetLink().run();
    else editor?.chain().focus().setLink({ href: url }).run();
  };

  const editorSelection = useEditorState({
    editor,
    selector: (ctx) => ({
      imageActive: ctx.editor?.isActive('image') ?? false,
      imageAttrs: (ctx.editor?.getAttributes('image') ?? {}) as ImageAttrs,
    }),
  });
  const imageActive = editorSelection?.imageActive ?? false;
  const imageAttrs = editorSelection?.imageAttrs ?? ({} as ImageAttrs);

  // No .focus() — preserves the node selection when clicking toolbar buttons
  const updateImageStyle = (style: string) => {
    editor?.commands.updateAttributes('image', { style });
  };

  const charCount = editor?.storage.characterCount?.characters?.() ?? sourceHtml.length;

  return (
    <div className="border border-zinc-700 rounded-lg bg-zinc-900">
      {/* Sticky toolbar wrapper — overflow-hidden here (not on outer div) so sticky works */}
      <div className="sticky top-0 z-10 rounded-t-lg overflow-hidden">
      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-zinc-700 bg-zinc-800">
        {!sourceMode && editor && (
          <>
            <Btn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
            <Btn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
            <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
            <Btn title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{'</>'}</Btn>
            <Sep />
            <Btn title="Heading 2 — orange border on site" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
            <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
            <Btn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>¶</Btn>
            <Sep />
            <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Btn>
            <Btn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
            <Btn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</Btn>
            <Btn title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'{ }'}</Btn>
            <Btn title="Horizontal divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>──</Btn>
            <Sep />
            <Btn title="Add / remove link" active={editor.isActive('link')} onClick={addLink}>🔗</Btn>
            {onImageInsert && <Btn title="Insert image from media library" onClick={onImageInsert}>🖼</Btn>}
            <Sep />
            <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
            <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}>↪</Btn>
            <Sep />
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleSourceMode}
          title={sourceMode ? 'Switch to visual editor' : 'Edit raw HTML source'}
          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ml-auto ${
            sourceMode ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-600'
          }`}
        >
          {'</>'} {sourceMode ? 'Visual' : 'Source'}
        </button>
      </div>

      {/* Image properties bar (visual mode, image selected) */}
      {!sourceMode && imageActive && (
        <ImageBar attrs={imageAttrs} onUpdate={updateImageStyle} />
      )}
      </div>{/* end sticky wrapper */}

      {/* Editor or Source textarea */}
      {sourceMode ? (
        <div className="relative">
          <textarea
            value={sourceHtml}
            onChange={(e) => handleSourceChange(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[520px] p-4 font-mono text-xs text-green-300 bg-zinc-950 resize-y focus:outline-none leading-relaxed"
            placeholder="<p>Raw HTML here…</p>"
          />
          <div className="absolute top-2 right-3 text-xs text-zinc-600 pointer-events-none">HTML source</div>
        </div>
      ) : (
        <EditorContent
          editor={editor}
          className="prose-gaming min-h-[420px] p-4 bg-zinc-900 focus:outline-none
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror]:min-h-[400px]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-600
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_hr]:border-zinc-700
            [&_.ProseMirror_hr]:my-6
            [&_.ProseMirror_code]:bg-zinc-800
            [&_.ProseMirror_code]:text-orange-300
            [&_.ProseMirror_code]:rounded
            [&_.ProseMirror_code]:px-1
            [&_.ProseMirror_pre]:bg-zinc-800
            [&_.ProseMirror_pre]:rounded-lg
            [&_.ProseMirror_pre]:p-4
            [&_.ProseMirror_pre_code]:bg-transparent
            [&_.ProseMirror_pre_code]:text-green-300"
        />
      )}

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-700 bg-zinc-800 rounded-b-lg flex items-center gap-4 text-xs text-zinc-500">
        <span>{charCount} characters</span>
        {sourceMode && <span className="text-amber-500">Editing raw HTML — click Visual to return</span>}
        {!sourceMode && imageActive && <span className="text-orange-400">Image selected — set published size above</span>}
      </div>
    </div>
  );
});

export default RichTextEditor;
