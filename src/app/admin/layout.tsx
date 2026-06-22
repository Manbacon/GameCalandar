import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { template: '%s | Admin', default: 'Admin' } };

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '⊞' },
  { label: 'Posts', href: '/admin/posts', icon: '✎' },
  { label: 'New Post', href: '/admin/posts/new', icon: '+' },
  { label: 'Media', href: '/admin/media', icon: '🖼' },
  { label: 'Releases', href: '/admin/releases', icon: '🎮' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#111] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto">
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-2xl font-black leading-none"
              style={{
                background: 'linear-gradient(135deg, #f97316, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              M
            </span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
          >
            ← View site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
