// Minimal static server for the built Storybook (storybook-static/) so the
// visual suite needs no extra npm dependency and no floating npx fetch.
// Usage: node tools/serve-storybook.mjs [port]
// The engine is tools/serve-static.mjs — shared with tools/serve-export.mjs
// since the price-menu-pin lane (2026-09-18); this file is the Storybook
// caller and nothing else.
import { join } from 'node:path';
import { serveStatic } from './serve-static.mjs';

serveStatic({
  root: join(process.cwd(), 'storybook-static'),
  port: Number(process.argv[2] ?? 6116),
  sentinel: 'index.json',
  missing:
    'storybook-static/index.json not found — run `npm run build-storybook` first (GITHUB_SETUP §7).',
});
