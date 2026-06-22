import PostForm from '@/components/admin/PostForm';
import { getAllCategories, getAllTags } from '@/lib/posts';
import { createPost } from '@/lib/actions/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Post' };

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-50">New Post</h1>
      </div>
      <PostForm
        allCategories={categories}
        allTags={tags}
        action={createPost}
      />
    </div>
  );
}
