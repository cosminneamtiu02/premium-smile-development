// lib/base-path/base-path.ts — THE deployment's base path, read in ONE place
// (pages-base-path lane, 2026-10-03: the prerequisite of the second promotion
// to the interim GitHub Pages host, CLAUDE.md §15.2).
//
// ── WHY IT EXISTS. A github.io PROJECT site serves the export under
// /premium-smile-development/ and the domain root holds nothing else, so every
// root-absolute URL the page writes must carry that prefix or it 404s.
// next.config.ts hands the prefix to Next's own `basePath`, which rewrites only
// what NEXT emits — /_next/ assets, the metadata icons. Everything this site
// spells itself had to add it by hand: the links (i18n/href.ts, since §15.13)
// and — until this lane — nothing else, so on the Pages build every picture
// 404'd: ui/Image's optimizer URLs, the Wordmark's mark, the Footer's ANPC
// badge (the "KNOWN DEBT · basePath" those files booked). One reader, every
// writer: the link prefix and the picture prefix cannot disagree.
//
// ── WHY IN lib/. ui/ may import lib MECHANICS but never i18n/ (§4), and both
// ui/Image and i18n/href.ts need the reader, so it sits where both may reach
// it. It imports nothing and reads no browser API, so plain Node loads it too —
// `node tools/generate-root-redirect.ts` imports i18n/href.ts, and with it this
// file, under Node's native type stripping (which is also why href.ts imports
// it by a RELATIVE, `.ts`-suffixed specifier: Node resolves no `@/` alias).

/**
 * '/premium-smile-development' in the interim Pages build (§15.2), '' on every
 * other host and — unless a node test stubs it — in every runner. The SAME
 * variable next.config.ts reads for Next's own `basePath`.
 *
 * Read at CALL time, not at module load: the browser bundle and the Chromium
 * test project get this text replaced by a literal at build time (next.config
 * `env` · vitest.config `define`), while the node runners keep a real
 * environment a test can flip between cases (tests/unit/base-path.test.ts).
 */
export function basePath(): string {
  return process.env.PAGES_BASE_PATH ?? '';
}

/**
 * A root-absolute path on this site, under the deployment's base path:
 * '/images/brand/mark.svg' → '/premium-smile-development/images/brand/mark.svg'
 * in the Pages build, the path itself on a root-serving host. For files the
 * page addresses DIRECTLY — a link is localeHref's job (i18n/href.ts).
 */
export function withBasePath(path: `/${string}`): string {
  return `${basePath()}${path}`;
}
