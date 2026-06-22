'use client';

import { useTransition } from 'react';
import { deletePost } from '@/lib/actions/posts';

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        startTransition(() => { deletePost(id); });
      }}
      className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {isPending ? '…' : 'Delete'}
    </button>
  );
}
