import { catalog } from '../catalog';
import { settings, href, absolute } from '../settings';
import { escapeXml } from '../xml';

export async function GET() {
  const { posts } = await catalog();
  const items = posts.map((post) => `<item><title>${escapeXml(post.data.title)}</title><description>${escapeXml(post.data.description)}</description><link>${escapeXml(absolute(href(`${post.id}/`)))}</link><guid isPermaLink="true">${escapeXml(absolute(href(`${post.id}/`)))}</guid><pubDate>${new Date(post.data.published).toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(settings.title)} — ${escapeXml(settings.name)}</title><description>${escapeXml(settings.description)}</description><link>${escapeXml(absolute(href()))}</link>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
