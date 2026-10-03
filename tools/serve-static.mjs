// THE static file server the harness reuses — the engine behind
// tools/serve-storybook.mjs (the visual suite's `webServer`) and
// tools/serve-export.mjs (the e2e suite's, against the built `out/`). One
// implementation, two thin callers: the second consumer arrived with the
// price-menu-pin lane (2026-09-18), which is CLAUDE.md §4's sharing-table row
// 1 — identical MECHANICS, second consumer, extract to the nearest place both
// may import. Zero npm dependencies, no floating npx fetch, same as before.
//
// Behaviour, unchanged from the Storybook-only original: files under `root`
// only (a path that normalizes outside it is a 403), a directory serves its
// index.html (which is what `trailingSlash: true` routes look like on disk —
// `/ro/services/` → `out/ro/services/index.html`), unknown extensions go out
// as octet-stream, anything missing is a plain 404.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/**
 * Serve `root` on 127.0.0.1:`port`. Refuses to start — exit code 1, with the
 * caller's own message — when `sentinel` (a file relative to `root`) is
 * missing, so a suite never waits 30 s on an unbuilt tree.
 *
 * `base` (pages-base-path lane, 2026-10-03) serves the tree the way a github.io
 * PROJECT site does: `root` mounted under that prefix, and the domain root
 * holding nothing else — a request outside the prefix is a 404, exactly the
 * address a root-absolute URL that forgot the prefix would reach in production
 * (tools/check-export-links.mjs is the caller). Omitted, the tree is served at
 * the root as before. Returns the server, so a script can close it.
 *
 * @param {{ root: string; port: number; sentinel: string; missing: string; base?: string }} options
 * @returns {import('node:http').Server}
 */
export function serveStatic({ root, port, sentinel, missing, base = '' }) {
  if (!existsSync(join(root, sentinel))) {
    console.error(missing);
    process.exit(1);
  }

  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      // A malformed %-escape is a broken URL, answered as one — not a throw
      // that takes the server (and the link check it gates) down with it.
      res.writeHead(400).end('bad request');
      return;
    }
    if (base) {
      if (pathname !== base && !pathname.startsWith(`${base}/`)) {
        res.writeHead(404).end('not found');
        return;
      }
      pathname = pathname.slice(base.length) || '/';
    }
    let filePath = normalize(join(root, pathname));
    // Inside `root` means `root` itself or below it — a bare prefix test
    // would also admit a sibling such as `out-old/`.
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    if (!existsSync(filePath)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(res);
  }).listen(port, '127.0.0.1', () => {
    console.log(`${root} on http://127.0.0.1:${port}${base || ''}/`);
  });
}
