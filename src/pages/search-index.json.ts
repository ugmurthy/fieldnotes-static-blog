import { catalog, categoryId } from '../catalog';
import { href } from '../settings';
import type { SearchEntry } from '../search';

export async function GET() {
  const { posts, categories } = await catalog();
  const entries: SearchEntry[] = posts.map((post) => ({
    url: href(`${post.id}/`), title: post.data.title, description: post.data.description,
    keywords: post.data.keywords,
    category: categories.find((category) => category.id === categoryId(post))?.title ?? 'Guide'
  }));
  return Response.json(entries);
}
