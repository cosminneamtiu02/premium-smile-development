// Minimal static server for the built site (out/) — what the e2e suite in
// tests/e2e drives (playwright.e2e.config.ts's `webServer`), the same way the
// visual suite drives storybook-static through tools/serve-storybook.mjs. The
// engine is tools/serve-static.mjs; this file only names the tree.
// Usage: node tools/serve-export.mjs [port]
// The sentinel is the Romanian services page: the one route every e2e spec
// so far exists for, and a file `next build` writes late enough that its
// presence means the export finished.
import { join } from 'node:path';
import { serveStatic } from './serve-static.mjs';

serveStatic({
  root: join(process.cwd(), 'out'),
  port: Number(process.argv[2] ?? 6117),
  sentinel: join('ro', 'services', 'index.html'),
  missing:
    'out/ro/services/index.html not found — run `npm run build` first; the e2e suite drives the static export.',
});
