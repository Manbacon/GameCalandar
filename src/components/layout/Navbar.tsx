'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const BLOG_LINKS = [
  { label: 'Home',     href: '/' },
  { label: 'Reviews',  href: '/reviews' },
  { label: 'Lists',    href: '/lists' },
  { label: 'News',     href: '/news' },
  { label: 'About Us', href: '/about' },
];

const RELEASES_LINKS = [
  { label: 'Release Calendar', href: '/releases' },
  { label: 'Browse',           href: '/releases?view=list' },
  { label: 'Top Upcoming',     href: '/releases/top-upcoming' },
];

function getTodayString() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isReleases = pathname.startsWith('/releases');
  const links = isReleases ? RELEASES_LINKS : BLOG_LINKS;

  function isActive(href: string) {
    const path = href.split('?')[0];
    if (path === '/') return pathname === '/';
    if (path === '/releases') return pathname === '/releases';
    return pathname.startsWith(path);
  }

  return (
    <header className="sticky top-0 z-40 shadow-lg shadow-black/30">
      {/* Date bar */}
      <div className="bg-orange-500 px-4 py-1">
        <p className="text-xs font-semibold text-white">{getTodayString()}</p>
      </div>

      {/* Logo + section switcher */}
      <div className="bg-[#1a1a1a] border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 flex items-center justify-center bg-black rounded-lg border border-zinc-700">
              <span
                className="text-3xl font-black leading-none select-none"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                M
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black tracking-widest text-white uppercase">Monster</span>
              <span className="text-sm font-bold tracking-[0.3em] text-orange-500 uppercase">Gaming</span>
            </div>
          </Link>

          {/* Desktop: section switcher + actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                  !isReleases
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-900/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>📰</span> Editorial
              </Link>
              <Link
                href="/releases"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                  isReleases
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>🎮</span> Releases
              </Link>
            </div>

            <Link href={isReleases ? '/releases/search' : '/search'} aria-label="Search" className="p-2 text-zinc-400 hover:text-orange-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Section sub-nav */}
      <nav className={`border-b transition-colors duration-300 ${
        isReleases
          ? 'bg-[#100d1a] border-violet-900/50'
          : 'bg-[#111111] border-zinc-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 ${
                    active
                      ? isReleases
                        ? 'text-violet-300 border-violet-500'
                        : 'text-orange-400 border-orange-500'
                      : isReleases
                      ? 'text-zinc-500 border-transparent hover:text-violet-300 hover:border-violet-800'
                      : 'text-zinc-400 border-transparent hover:text-orange-400 hover:border-orange-500'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-b ${
          isReleases ? 'border-violet-900/40 bg-[#100d1a]' : 'border-zinc-800 bg-[#1a1a1a]'
        }`}>
          <div className="px-4 pt-3 pb-2 flex gap-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center uppercase tracking-wide transition-colors ${
                !isReleases ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📰 Editorial
            </Link>
            <Link
              href="/releases"
              onClick={() => setMobileOpen(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center uppercase tracking-wide transition-colors ${
                isReleases ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🎮 Releases
            </Link>
          </div>
          <nav className="px-4 pb-3 flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  isReleases
                    ? 'text-zinc-300 hover:text-violet-300 hover:bg-violet-900/20'
                    : 'text-zinc-300 hover:text-orange-400 hover:bg-zinc-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-3 py-2 text-sm font-semibold text-center text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
