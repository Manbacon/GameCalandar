import Link from "next/link";

const footerLinks = {
  Content: [
    { label: "Reviews", href: "/reviews" },
    { label: "Lists", href: "/lists" },
    { label: "News", href: "/news" },
  ],
  Features: [
    { label: "Release Schedule", href: "/releases" },
    { label: "My Collection", href: "/collection" },
    { label: "Want List", href: "/wants" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Profile", href: "/profile" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] border-t border-zinc-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 flex items-center justify-center bg-black rounded border border-zinc-700">
                <span
                  className="text-2xl font-black leading-none"
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
                <span className="text-sm font-black tracking-widest text-white uppercase">Monster</span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-orange-500 uppercase">Gaming</span>
              </div>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Games, games and random game stuffs.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Monster Gaming. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">Built with Next.js &amp; Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
