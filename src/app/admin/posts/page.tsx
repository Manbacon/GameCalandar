import Link from 'next/link';
import { getAllPostsAdmin } from '@/lib/posts';
import DeletePostButton from '@/components/admin/DeletePostButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Posts' };

const typeLabels: Record<string, string> = {
  ARTICLE: 'Article',
  REVIEW: 'Review',
  LIST: 'List',
  NEWS: 'News',
};

function formatDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminPostsPage() {
  const posts = await getAllPostsAdmin();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-50">Posts</h1>
          <p className="text-zinc-400 text-sm mt-1">{posts.length} total</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <p>No posts yet.</p>
          <Link href="/admin/posts/new" className="mt-2 inline-block text-orange-400 hover:text-orange-300 text-sm transition-colors">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Author</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100 leading-snug line-clamp-2">{post.title}</div>
                    <div className="text-xs text-zinc-600 font-mono mt-0.5">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-400">{typeLabels[post.type] ?? post.type}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-400">
                    {post.author.username ?? post.author.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-500">
                    <div>{formatDate(post.publishedAt)}</div>
                    {post.status === 'PUBLISHED' && post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 24 * 60 * 60 * 1000 && (
                      <div className="text-xs text-zinc-600 mt-0.5">Updated {formatDate(post.updatedAt)}</div>
                    )}
                    {post.status === 'DRAFT' && (
                      <div className="text-xs text-zinc-600 mt-0.5">Saved {formatDate(post.updatedAt)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      post.status === 'PUBLISHED'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {post.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Edit
                      </Link>
                      {post.status === 'PUBLISHED' && (
                        <Link
                          href={`/posts/${post.slug}`}
                          target="_blank"
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
