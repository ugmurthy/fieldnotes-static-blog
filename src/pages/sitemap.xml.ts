import { catalog } from '../catalog';
import { settings, href, absolute } from '../settings';
import { escapeXml } from '../xml';

export async function GET() {
  const { posts, categories } = await catalog();
  const urls = posts.map((post) => ({ path: `${post.id}/`, modified: post.data.updated ?? post.data.published }));
  for (const scope of ['', ...categories.map((category) => category.id)]) {
    const prefix = scope ? `category/${scope}/` : '';
    const count = scope ? posts.filter((post) => post.id.startsWith(scope + '/')).length : posts.length;
    for (let page = 1; page <= Math.max(1, Math.ceil(count / settings.pageSize)); page++) {
      urls.push({ path: page === 1 ? prefix : `${prefix}page/${page}/`, modified: '' });
    }
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ path, modified }) => `<url><loc>${escapeXml(absolute(href(path)))}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
