import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "The people behind Monster Gaming.",
};

const interests = [
  { icon: "🎮", label: "Video Games", detail: "Across all platforms and genres — though Zelda holds a special place" },
  { icon: "📦", label: "Retro Gaming & Collecting", detail: "Physical games and hardware, the rarer the better" },
  { icon: "🔧", label: "Console Restoration & Mods", detail: "Bringing old hardware back to life — or making it do things it was never meant to do" },
  { icon: "📷", label: "Photography", detail: "Always looking for the right frame" },
  { icon: "📚", label: "Books & Movies", detail: "Big reader, film fan, zero interest in sport" },
  { icon: "💻", label: "Tech & Software", detail: "Works in the industry — a proper geek at heart" },
];

const hardwareHighlights = [
  {
    name: "Sharp Twin Famicom",
    description:
      "A beautiful piece of Japanese engineering — the AN-500B combined both the Famicom and Famicom Disk System into a single unit. Iconic design, and a genuine gorgeous peice of tech.",
  },
  {
    name: "Panasonic Q (GameCube)",
    description:
      "The Japanese-exclusive GameCube that doubled as a DVD player, manufactured by Panasonic under licence from Nintendo. Sleek silver design and wildly over-engineered in the best possible way.",
  },
  {
    name: "Retro Hardware Collection",
    description:
      "An ever-growing collection spanning multiple generations — BBC Micro, Mega Drive, SNES, N64, and much more. Condition, region variants, and rare revisions all matter.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page header */}
      <div className="mb-10 pb-6 border-b border-zinc-800">
        <h1 className="text-4xl font-black text-zinc-50 mb-2">About Us</h1>
        <p className="text-zinc-400 text-lg">The people and passion behind Monster Gaming.</p>
      </div>

      {/* About Monster Gaming */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-zinc-50 mb-4 border-l-4 border-orange-500 pl-4">
          About Monster Gaming
        </h2>
        <div className="prose-gaming">
          <p>
            Monster Gaming started as a place to write honestly about video games — not chasing clicks,
            not regurgitating press releases, just genuine enthusiasm from someone who has been playing
            games since the early 80s and never really stopped.
          </p>
          <p>
            You&apos;ll find reviews, lists, news, and the occasional deep dive here. The release schedule
            is a tool we built because we wanted one — a clean, no-nonsense view of what&apos;s coming
            and when. Everything on this site is made by people who actually care about games.
          </p>
        </div>
      </section>

      {/* Team section */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-zinc-50 mb-6 border-l-4 border-orange-500 pl-4">
          The Team
        </h2>

        {/* ManbaconMG card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Avatar */}
            <div className="sm:w-48 sm:shrink-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 flex items-center justify-center min-h-32 sm:min-h-0">
              <div className="text-center py-8 sm:py-0">
                <div className="text-6xl font-black text-white/90 leading-none">S</div>
                <p className="text-white/60 text-xs mt-1 font-medium">ManbaconMG</p>
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-50">Shaun Vye</h3>
                  <p className="text-orange-500 text-sm font-semibold mt-0.5">Editor in Chief · ManbaconMG</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  I&apos;ve been gaming since my first time on the family BBC Micro in the early 80s —
                  so yes, this has been a lifelong thing. Over the decades I&apos;ve played everything from
                  8-bit home computer classics to modern open-world epics, and somehow I still haven&apos;t
                  run out of things to say about them.
                </p>
                <p>
                  I love a huge range of genres across multiple platforms. If I had to pick a favourite
                  series, <span className="text-zinc-200 font-medium">The Legend of Zelda </span> holds
                  a very special place in m y heart — though I&apos;ll happily get lost in a good JRPG, a tight
                  action-platformer, or a well-crafted indie for weeks at a time.
                </p>
                <p>
                  Beyond just playing games, I collect them — particularly retro hardware and physical
                  releases. I&apos;m drawn to consoles I never got to experience before the world got a lot smaller: the consoles that never
                  made it to the West, or Japanese exclusive games that I barely understand. I also enjoy
                  console restoration work and the occasional mod — there&apos;s something satisfying about
                  getting a 30-year-old system working so well and allowing others to experience the games I grew up with.
                </p>
                <p>
                  Outside of games: I work in tech and software, love photography, and have a pile of
                  books and unwatched films that grows faster than I can manage. I have essentially
                  zero interest in sport, which frees up an enormous amount of time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interests grid */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-zinc-50 mb-6 border-l-4 border-orange-500 pl-4">
          Interests
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {interests.map((item) => (
            <div
              key={item.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">{item.label}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware highlights */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-zinc-50 mb-6 border-l-4 border-orange-500 pl-4">
          Hardware Highlights
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          A few of the more unusual pieces from the collection worth calling out specifically.
        </p>
        <div className="space-y-4">
          {hardwareHighlights.map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4 items-start hover:border-orange-500/40 transition-colors"
            >
              <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0" />
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">{item.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Write for us */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-zinc-50 mb-3">Want to Write for Monster Gaming?</h2>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
          If you love games and have something worth saying about them, we&apos;d love to hear from you.
          Reviews, opinion pieces, lists, retrospectives — all welcome. Get in touch.
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Get in Touch
        </Link>
      </section>
    </div>
  );
}
