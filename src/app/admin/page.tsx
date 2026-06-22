import Link from 'next/link';
import { getAdminStats } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Published Posts', value: stats.published, href: '/admin/posts?status=published', color: 'bg-orange-500' },
    { label: 'Drafts', value: stats.drafts, href: '/admin/posts?status=draft', color: 'bg-zinc-600' },
    { label: 'Categories', value: stats.categories, href: '/admin/posts', color: 'bg-purple-600' },
    { label: 'Tags', value: stats.tags, href: '/admin/posts', color: 'bg-blue-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-50">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Monster Gaming admin area</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 hover:border-zinc-600 transition-colors"
          >
            <div className={`w-8 h-1 rounded-full mb-3 ${card.color}`} />
            <div className="text-3xl font-black text-zinc-50">{card.value}</div>
            <div className="text-sm text-zinc-400 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/admin/posts/new"
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New Post
        </Link>
        <Link
          href="/admin/media"
          className="px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-50 text-sm font-semibold rounded-lg transition-colors"
        >
          Media Library
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-50 text-sm font-semibold rounded-lg transition-colors"
        >
          View Site →
        </Link>
      </div>
    </div>
  );
}
