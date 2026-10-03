// THE link check over the built export, served the way its HOST serves it
// (pages-base-path lane, 2026-10-03; CLAUDE.md §15.2).
//
// With PAGES_BASE_PATH set — the interim GitHub Pages build — the export is
// mounted under that prefix and the domain root holds nothing else, exactly
// like a github.io project site, so a URL the page writes without the prefix
// (a raw <img src="/…">, a loader that ignored the base path) answers 404 here
// as it would in production. That is the defect this tool exists for: before
// the lane every picture on the Pages build 404'd, and no check could see it —
// the crawl then ran on the ROOT-served build only, where an unprefixed URL
// resolves fine. Unset, the export is served at the root (ci.yml's run).
//
// WHAT IT READS: every href / src / srcset in the HTML, and — `checkCss` — the
// url()s inside inline `style` attributes (the optimizer's blur placeholders
// live only there) and inside the stylesheets. NOT read: a preload link's
// `imagesrcset` (it carries no href); those URLs are the srcset's own, which
// the crawl does read on the <img> beside it.
//
// Why a script and not linkinator's CLI with --server-root: the CLI starts its
// crawl at `<root>/premium-smile-development` (it trims the trailing slash),
// its own server answers that with a 301 whose Location names `localhost`
// while the crawl's root names 127.0.0.1, and the same-host rule then refuses
// to recurse — 6 links scanned and a green run (measured 2026-10-03). Serving
// the tree here and handing linkinator a URL that ends in '/' keeps one host.
//
// The 404 dispatcher (out/404.html) is linked from no page, so it gets a crawl
// of its own — its links checked, nothing followed — kept SEPARATE from the
// site's crawl so neither can decide what the other visits (one shared cache
// would let whichever found a page first decide whether it is followed).
//
// Usage: node tools/check-export-links.mjs [port]   — after `npm run build`
// with the same PAGES_BASE_PATH.
import { join } from 'node:path';
import { LinkChecker } from 'linkinator';
import { basePath } from '../src/lib/base-path/base-path.ts';
import { serveStatic } from './serve-static.mjs';

const base = basePath();
const port = Number(process.argv[2] ?? 6118);

const server = serveStatic({
  root: join(process.cwd(), 'out'),
  port,
  base,
  sentinel: '404.html',
  missing:
    'out/404.html not found — run `npm run build` first, with the same PAGES_BASE_PATH.',
});
await new Promise((resolve) => {
  server.once('listening', resolve);
  server.once('error', (error) => {
    console.error(
      `check-export-links: cannot serve on port ${port} (${error.code ?? error.message}) — pass a free port as the first argument.`,
    );
    process.exit(1);
  });
});

const origin = `http://127.0.0.1:${port}${base}`;
const crawl = (path, recurse) =>
  new LinkChecker().check({
    path,
    recurse,
    checkCss: true,
    // Off-site links are not this site's to check (the map embed, the ANPC
    // portal, the social profiles).
    linksToSkip: ['^https?://(?!localhost|127\\.0\\.0\\.1)'],
  });

let links;
try {
  const site = await crawl(`${origin}/`, true);
  const dispatcher = await crawl(`${origin}/404.html`, false);
  links = [...site.links, ...dispatcher.links];
} finally {
  server.close();
}

const broken = links.filter((link) => link.state === 'BROKEN');
for (const link of broken) {
  console.error(`[${link.status}] ${link.url}\n    on ${link.parent}`);
}
const pages = new Set(links.map((link) => link.parent).filter(Boolean)).size;
console.log(
  `${links.length} links on ${pages} pages, served under "${base || '/'}": ${broken.length} broken.`,
);
process.exit(broken.length > 0 ? 1 : 0);
