import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PostType, PostStatus } from "../src/generated/prisma/client";
import http from "http";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Helpers ───────────────────────────────────────────────────────────────────

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&pound;/g, "£")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function inferPostType(categories: string[]): PostType {
  if (categories.some((c) => c.toLowerCase() === "list")) return PostType.LIST;
  if (categories.some((c) => c.toLowerCase() === "news")) return PostType.NEWS;
  return PostType.ARTICLE;
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Monster Gaming database...\n");

  // ── Author user ────────────────────────────────────────────────────────────
  const author = await prisma.user.upsert({
    where: { email: "manbaconmg@monster-gaming.com" },
    update: {},
    create: {
      email: "manbaconmg@monster-gaming.com",
      name: "ManbaconMG",
      username: "ManbaconMG",
      role: "AUTHOR",
    },
  });
  console.log(`✓ Author: ${author.username}`);

  // ── Fetch posts from WordPress REST API ───────────────────────────────────
  const wpPosts = await fetchJson(
    "http://192.168.0.184:8082/wp-json/wp/v2/posts?_embed&per_page=20"
  ) as WpPost[];

  // ── Collect all unique categories and tags ────────────────────────────────
  const allCats = new Map<string, string>(); // name → slug
  const allTags = new Map<string, string>();

  for (const post of wpPosts) {
    if (post._embedded?.["wp:term"]) {
      for (const termGroup of post._embedded["wp:term"]) {
        for (const t of termGroup) {
          if (t.taxonomy === "category" && t.name !== "Uncategorized") {
            allCats.set(t.name, t.slug);
          } else if (t.taxonomy === "post_tag") {
            allTags.set(t.name, t.slug);
          }
        }
      }
    }
  }

  // ── Upsert categories ──────────────────────────────────────────────────────
  const catMap = new Map<string, string>(); // name → db id
  for (const [name, slug] of allCats) {
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    catMap.set(name, cat.id);
    console.log(`  ✓ Category: ${name}`);
  }

  // ── Upsert tags ────────────────────────────────────────────────────────────
  const tagMap = new Map<string, string>(); // name → db id
  for (const [name, slug] of allTags) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tagMap.set(name, tag.id);
  }
  console.log(`  ✓ Tags: ${allTags.size} upserted`);

  // ── Upsert posts ───────────────────────────────────────────────────────────
  console.log("\nMigrating posts...");
  for (const wp of wpPosts) {
    const title = decodeEntities(wp.title.rendered);
    const slug = wp.slug;
    const rawExcerpt = htmlToText(decodeEntities(wp.excerpt.rendered));
    const content = wp.content.rendered; // raw HTML — rendered by the app

    const postCats = wp._embedded?.["wp:term"]
      ? wp._embedded["wp:term"]
          .flat()
          .filter((t) => t.taxonomy === "category" && t.name !== "Uncategorized")
          .map((t) => t.name)
      : [];

    const postTags = wp._embedded?.["wp:term"]
      ? wp._embedded["wp:term"]
          .flat()
          .filter((t) => t.taxonomy === "post_tag")
          .map((t) => t.name)
      : [];

    const featuredImage =
      wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;

    const postType = inferPostType(postCats);
    const publishedAt = new Date(wp.date);

    const post = await prisma.post.upsert({
      where: { slug },
      update: {
        title,
        excerpt: rawExcerpt,
        content: { type: "html", html: content },
        featuredImage,
        type: postType,
        status: PostStatus.PUBLISHED,
        publishedAt,
        categories: {
          set: postCats
            .map((name) => catMap.get(name))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
        tags: {
          set: postTags
            .map((name) => tagMap.get(name))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
      },
      create: {
        title,
        slug,
        excerpt: rawExcerpt,
        content: { type: "html", html: content },
        featuredImage,
        type: postType,
        status: PostStatus.PUBLISHED,
        publishedAt,
        authorId: author.id,
        categories: {
          connect: postCats
            .map((name) => catMap.get(name))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
        tags: {
          connect: postTags
            .map((name) => tagMap.get(name))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
      },
    });

    console.log(`  ✓ [${postType}] ${title}`);
  }

  console.log("\n✅ Seed complete!");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WpPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    "wp:term"?: Array<Array<{ taxonomy: string; name: string; slug: string }>>;
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
  };
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
