import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { visit } from 'unist-util-visit';
import { parse } from 'yaml';
import type { Root } from 'mdast';
import { contentDir, href, validateSlug } from './settings';

// Authored relative links remain portable when the site is mounted at another base path.
export default function remarkLinks() {
  return (tree: Root, file: { path: string }) => {
    visit(tree, ['link', 'image', 'definition'], (node) => {
      if (node.type !== 'link' && node.type !== 'image' && node.type !== 'definition') return;
      if (node.type === 'image') {
        node.data = { ...node.data, hProperties: { loading: 'lazy', decoding: 'async' } };
      }
      const url: string = node.url;
      if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error(`Unsupported link protocol: ${url}`);
      const [, pathname, suffix = ''] = url.match(/^([^?#]*)(.*)$/)!;
      if (!pathname) return;
      const target = resolve(dirname(file.path), decodeURIComponent(pathname));
      if (!target.startsWith(contentDir + sep) || !existsSync(target)
        || !realpathSync(target).startsWith(realpathSync(contentDir) + sep)) {
        throw new Error(`Broken or out-of-content link in ${file.path}: ${url}`);
      }
      const path = relative(contentDir, target).split(sep).join('/');
      if (path.endsWith('.md')) {
        const frontmatter = readFileSync(target, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (frontmatter && parse(frontmatter[1])?.draft) throw new Error(`Link to unpublished draft: ${url}`);
        node.url = href(`${validateSlug(path.slice(0, -3))}/${suffix}`);
      } else {
        if (!/\.(png|jpe?g|webp|gif|avif|svg|mp4|webm|pdf)$/i.test(path)) throw new Error(`Unsupported article asset: ${url}`);
        node.url = href(`_media/${path.split('/').map(encodeURIComponent).join('/')}${suffix}`);
      }
    });
  };
}
