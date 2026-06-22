"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Reviews", href: "/reviews" },
  { label: "Lists", href: "/lists" },
  { label: "News", href: "/news" },
  { label: "Release Schedule", href: "/releases" },
];

function getTodayString() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-[#1a1a1a] border-b border-zinc-800">
      {/* Date bar */}
      <div className="bg-orange-500 px-4 py-1">
        <p className="text-xs font-semibold text-white">{getTodayString()}</p>
      </div>

      {/* Logo row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="inline-flex items-center gap-3">
          {/* Stylised M */}
          <div className="w-14 h-14 flex items-center justify-center bg-black rounded-lg border border-zinc-700">
            <span
              className="text-4xl font-black leading-none select-none"
              style={{
                background: "linear-gradient(135deg, #f97316, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
      </div>

      {/* Nav bar */}
      <div className="border-t border-zinc-800 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 border-transparent hover:border-orange-500 hover:text-orange-400 ${
                    i === 0 ? "text-orange-400 border-orange-500" : "text-zinc-300"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              <button aria-label="Random post" className="p-2 text-zinc-400 hover:text-orange-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 17h.01M17 14h.01M17 20h.01M20 17h.01" />
                </svg>
              </button>
              <Link href="/search" aria-label="Search" className="p-2 text-zinc-400 hover:text-orange-400 transition-colors flex items-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </Link>
              <Link href="/login" className="ml-2 px-4 py-1.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors">
                Sign In
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-zinc-400 hover:text-zinc-50"
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
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#1a1a1a]">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-semibold text-zinc-300 hover:text-orange-400 hover:bg-zinc-800 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-3 py-2 text-sm font-semibold text-center text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
