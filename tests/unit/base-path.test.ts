import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localeHref } from '../../src/i18n/href';
import { basePath, withBasePath } from '../../src/lib/base-path/base-path';

// THE deployment prefix's one reader (pages-base-path lane, 2026-10-03;
// CLAUDE.md §15.2). On the interim GitHub Pages build the site lives under
// /premium-smile-development/ and the domain root holds nothing else, so a
// picture the page addresses without the prefix 404s — every picture did,
// until ui/Image, the Wordmark and the Footer's badge routed their addresses
// through withBasePath. These cases pin the two shapes the reader must give.
//
// In tests/unit/ and not beside the module for the reason href.test.ts
// records: only this node project can flip the variable between cases — in
// the Chromium project it is a literal baked in at transform time (measured
// 2026-10-03: vi.stubEnv leaves it '' there).
//
// CLEARING it first keeps the suite independent of the machine it runs on: a
// shell that exported PAGES_BASE_PATH for a Pages-shaped local build would
// otherwise turn the root-host cases red (href.test.ts's G2 D4, same reason).
beforeEach(() => {
  vi.stubEnv('PAGES_BASE_PATH', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const PAGES = '/premium-smile-development';

describe('basePath — the deployment prefix', () => {
  it("is '' on a root-serving host, where the variable is unset", () => {
    expect(basePath()).toBe('');
  });

  it('is the variable itself on the interim Pages build', () => {
    vi.stubEnv('PAGES_BASE_PATH', PAGES);
    expect(basePath()).toBe(PAGES);
  });

  it('is read at CALL time, so one process sees whichever shape is set', () => {
    // A value captured at module load would freeze the first answer: the
    // browser bundle relies on the build inlining a literal instead, and the
    // node runners on reading the live environment.
    expect(basePath()).toBe('');
    vi.stubEnv('PAGES_BASE_PATH', PAGES);
    expect(basePath()).toBe(PAGES);
  });
});

describe('withBasePath — a file the page addresses directly', () => {
  it('leaves a root-absolute path as it is on a root-serving host', () => {
    expect(withBasePath('/images/brand/mark.svg')).toBe(
      '/images/brand/mark.svg',
    );
  });

  it('puts the Pages prefix in front of it on the Pages build', () => {
    vi.stubEnv('PAGES_BASE_PATH', PAGES);
    expect(withBasePath('/images/brand/mark.svg')).toBe(
      '/premium-smile-development/images/brand/mark.svg',
    );
    expect(withBasePath('/anpc-sal-pictograma.png')).toBe(
      '/premium-smile-development/anpc-sal-pictograma.png',
    );
  });

  it('agrees with the link prefix — one reader for links and pictures', () => {
    // The reason the reader moved out of i18n/href.ts: a link and a picture on
    // the same page can never be built against two different prefixes.
    vi.stubEnv('PAGES_BASE_PATH', PAGES);
    expect(localeHref('ro', '/')).toBe(withBasePath('/ro/'));
    vi.stubEnv('PAGES_BASE_PATH', undefined);
    expect(localeHref('ro', '/')).toBe(withBasePath('/ro/'));
  });
});
