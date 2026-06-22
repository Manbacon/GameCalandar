import { notFound } from 'next/navigation';
import PostForm from '@/components/admin/PostForm';
import { getPostById, getAllCategories, getAllTags, formatPostDateTime } from '@/lib/posts';
import { updatePost } from '@/lib/actions/posts';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  return { title: post ? `Edit: ${post.title}` : 'Edit Post' };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getPostById(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) notFound();

  const contentHtml = (() => {
    const c = post.content as { type?: string; html?: string } | null;
    if (c && typeof c === 'object' && c.html) return c.html;
    return '';
  })();

  const boundUpdate = updatePost.bind(null, id);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-50">Edit Post</h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">{post.slug}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
            {post.publishedAt && (
              <span>Published: <span className="text-zinc-400">{formatPostDateTime(post.publishedAt)}</span></span>
            )}
            <span>Last saved: <span className="text-zinc-400">{formatPostDateTime(post.updatedAt)}</span></span>
          </div>
        </div>
        {post.status === 'PUBLISHED' && (
          <a
            href={`/posts/${post.slug}`}
            target="_blank"
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            View post →
          </a>
        )}
      </div>
      <PostForm
        postId={id}
        initialTitle={post.title}
        initialSlug={post.slug}
        initialExcerpt={post.excerpt ?? ''}
        initialContent={contentHtml}
        initialStatus={post.status as 'DRAFT' | 'PUBLISHED'}
        initialType={post.type as 'ARTICLE' | 'REVIEW' | 'LIST' | 'NEWS'}
        initialCategories={post.categories.map((c) => c.id)}
        initialTags={post.tags.map((t) => t.name)}
        initialFeaturedImage={post.featuredImage ?? ''}
        allCategories={categories}
        allTags={tags}
        action={boundUpdate}
      />
    </div>
  );
}
