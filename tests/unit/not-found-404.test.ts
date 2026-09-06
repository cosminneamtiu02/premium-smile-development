import { describe, expect, it } from 'vitest';
import {
  notFoundMain,
  notFoundScript,
  renderNotFoundHtml,
  type NotFoundBlock,
  type NotFoundLink,
} from '../../src/lib/not-found-html';
import { defaultLocale, locales, nativeNames } from '../../src/i18n/locales';

// THE 404 DISPATCHER SUITE — the behavioural half of out/404.html, which since
// the owner's 2026-09-06 correction is no longer a page but a SIGNPOST: the
// real not-found page is a routed shell page (src/app/[locale]/404/page.tsx,
// five of them, with Header, Footer and the corner controls), and this one file
// — the only thing a static host can serve for an unknown URL — decides which
// of the five a visitor is sent to.
//
// ── WHY THIS IS NOT A SOFT 404. The miss itself already returned HTTP 404: the
// host answered the dead URL with this document and that status, so a crawler
// has its answer before a single line of script runs, and the index never sees
// a 200. The forward that follows is for the HUMAN, and it goes to a page that
// explains itself rather than to the home page — routing a miss to HOME stays
// banned, and so does any timed redirect. This is exactly the out/index.html
// pattern (tools/generate-root-redirect.ts) with a smarter first signal: the
// root stub has only the cookie and navigator.languages to go on, while a dead
// URL usually names its own locale in the first path segment.
//
// ── WHY THE SCRIPT IS EXECUTED RATHER THAN READ. What ships to a visitor is
// TEXT: a dozen lines of ES5 in a document that loads no modules of ours and
// never will (§16). `new Function` plus stubbed globals is the closest a test
// gets to being that browser, and it is the locale-match.test.ts shape — a
// `location.replace` recorder — applied to this tool's script. The difference:
// the root stub's script is only reachable as source text, while THIS one is
// produced by an imported builder, so the holes are filled by the builder
// itself and no source-scraping is needed.
//
// ── WHY IN tests/unit/: node only (`new Function`, no DOM). The DOM SHAPE of
// the fallback body belongs to src/lib/not-found-html.test.ts.

/** Fixture text — never the real messages: this file is about the SHAPE the
 *  builders emit, and the owner-authored strings (§8.10) are asserted where
 *  they belong, in the components suite that reads src/messages/*.json. */
const BLOCKS: readonly NotFoundBlock[] = locales.map((locale) => ({
  locale,
  title: `Title ${locale}`,
  message: `Message ${locale}`,
}));

/** The five destinations, in manifest order. Shaped exactly as the tool builds
 *  them — `localeHref(locale, '/404/')` results, baked (D12), never arithmetic
 *  the visitor's browser is asked to redo. */
const LINKS: readonly NotFoundLink[] = locales.map((locale) => ({
  locale,
  href: `/${locale}/404/`,
  name: nativeNames[locale],
}));

// The cookie NAME as a literal, asserted from the OUTSIDE (the #62
// outside-in convention): this file WRITES cookie values, and a tripwire built
// out of the constant it watches would watch nothing. The builder's own copy
// arrives through the `cookieName` option, which the tool fills from
// src/i18n/locales.ts.
const COOKIE = 'NEXT_LOCALE';

const script = (basePath = '') =>
  notFoundScript({
    basePath,
    links: LINKS,
    cookieName: COOKIE,
    defaultLocale,
  });

describe('the emitted script is never vacuous', () => {
  it('carries the URL read, the baked table and the forward', () => {
    const text = script();
    expect(text).toContain('location.pathname');
    expect(text).toContain('location.replace');
    // THE BAKED DESTINATIONS (D12, the root stub's doctrine): the script
    // INDEXES a locale → href table this builder computed at build time, so the
    // visitor's browser performs no URL arithmetic of its own and href.ts is
    // left with no second spelling to stay in step with.
    expect(text).toContain(
      JSON.stringify(Object.fromEntries(LINKS.map((l) => [l.locale, l.href]))),
    );
    expect(text).toContain('indexOf');
    expect(text).toContain(COOKIE);
  });

  it('is strict ES5 with every hole filled', () => {
    const text = script();
    // Arrow functions and block-scoped declarations are the modern shapes a
    // copy-paste would most likely introduce, and the frozen 2019–2021 phones
    // §1 cares about are exactly who this page's no-framework path is for.
    expect(text).not.toContain('=>');
    expect(text).not.toContain('const ');
    expect(text).not.toContain('let ');
    expect(text).not.toContain('`');
    // An unfilled `${…}` would reach the visitor as a syntax error in the one
    // document that exists to recover from a mistake.
    expect(text).not.toContain('${');
    // The one template-literal escape resolved: `\\s` in the source, `\s` here.
    expect(text).toContain('(?:^|;\\s*)');
  });
});

/**
 * Run the emitted script the way a browser runs it — three stubbed globals and
 * nothing else — and hand back every URL it tried to go to.
 *
 * `location.replace`, not `href`: the stub is a plain object, so the forward is
 * a recorded call rather than a navigation. An array (not a `let`) so "it
 * forwarded exactly once" is assertable — the locale-match.test.ts shape.
 */
function forwardsFor(
  basePath: string,
  pathname: string,
  cookie = '',
): string[] {
  const replaced: string[] = [];
  const locationStub = {
    pathname,
    replace: (href: string) => {
      replaced.push(href);
    },
  };
  const documentStub = { cookie };

  new Function('location', 'document', script(basePath))(
    locationStub,
    documentStub,
  );

  return replaced;
}

const href = (locale: string) =>
  LINKS.find((link) => link.locale === locale)?.href;

/**
 * THE SEGMENT TABLE — every shape of URL a static host answers with this one
 * file, and the locale each one names. `null` means the FIRST signal found
 * nothing, at which point the cookie and then the default locale decide (the
 * suite below this one). Rows assert the chosen destination, because the
 * script's verdict is not a return value — it is the URL it sends the visitor
 * to.
 *
 * NO QUERY OR HASH ROWS, and none are missing: `location.pathname` excludes
 * both by definition, so '/de/x?q=1#top' reaches this rule as '/de/x'.
 */
const SEGMENTS: ReadonlyArray<readonly [string, string, string | null]> = [
  ['', '/de/typo/', 'de'],
  // Both slash forms: `trailingSlash: true` makes the second canonical, but a
  // 404 is by definition a URL nobody normalised.
  ['', '/en', 'en'],
  ['', '/en/', 'en'],
  ['', '/', null],
  // THE '/robot' TRAP, the same one src/i18n/href.ts' stripLocale spells out:
  // a text-prefix test would read this as Romanian. The rule is a SEGMENT.
  ['', '/robot/', null],
  ['', '/xx/foo/', null],
  // URLs are case-sensitive and ours are lowercase, so '/DE/x' names no locale
  // of ours and the next signal decides.
  ['', '/DE/x', null],
  // Depth is irrelevant: only the FIRST segment names a language.
  ['', '/ro/blog/vechi-articol/', 'ro'],
  // An encoded slash is NOT a separator: location.pathname hands it over still
  // encoded, so the first segment is the whole 'de%2Ffoo' and names nothing.
  ['', '/de%2Ffoo/', null],
  // An empty first segment ('//de/') is empty, not 'de'.
  ['', '//de/', null],
  ['/premium-smile-development', '/premium-smile-development/fr/x/', 'fr'],
  ['/premium-smile-development', '/premium-smile-development/', null],
  // PREFIX-GUARD TOLERANCE: the base path is baked, but the pathname may not
  // carry it (a host reconfigured under the same build, a hand-typed URL). The
  // guard strips only when the prefix is really there, so this still matches.
  ['/premium-smile-development', '/fr/x/', 'fr'],
  // …and the strip respects the SEGMENT boundary, exactly as stripLocale does
  // for the locale prefix: a longer neighbour is a different path, not a
  // prefixed one, and mangling it here would invent a locale segment.
  ['/premium-smile-development', '/premium-smile-developmentX/de/', null],
];

describe('signal 1 — the URL’s own first path segment', () => {
  it.each(SEGMENTS)('base %j · %s → %j', (basePath, pathname, expected) => {
    const replaced = forwardsFor(basePath, pathname);
    expect(replaced).toHaveLength(1);
    // No cookie in this table: a segment miss falls through to the default,
    // which is what the `null` rows assert.
    expect(replaced[0]).toBe(href(expected ?? defaultLocale));
  });
});

describe('signals 2 and 3 — the language cookie, then the default locale', () => {
  it('prefers the URL’s segment over the cookie', () => {
    // The address the visitor actually followed outranks a remembered choice:
    // someone who clicked a stale German link is reading German right now,
    // whatever they picked last month.
    expect(forwardsFor('', '/de/typo/', `${COOKIE}=fr`)).toEqual([href('de')]);
  });

  it('falls back to the cookie when the URL names no locale', () => {
    expect(forwardsFor('', '/robot/', `${COOKIE}=de`)).toEqual([href('de')]);
    // …including when other cookies share the jar (the root stub's regex
    // shape, interpolated from the same constant).
    expect(forwardsFor('', '/robot/', `other=1; ${COOKIE}=it`)).toEqual([
      href('it'),
    ]);
  });

  it('ignores a cookie value that is not one of our locales', () => {
    expect(forwardsFor('', '/robot/', `${COOKIE}=xx`)).toEqual([
      href(defaultLocale),
    ]);
  });

  it('lands on the default locale when neither signal fires', () => {
    // NOT `fallbackLocale` (English), and not in conflict with it: that
    // constant belongs to the ROOT stub's no-match branch, where the question
    // is "which of the five does this visitor read?" and the answer came from
    // navigator.languages (§5/D1). Here nothing has been asked about the
    // visitor's languages at all — only their URL and their own past click —
    // so the site's own default language is the honest destination.
    expect(forwardsFor('', '/robot/')).toEqual([href(defaultLocale)]);
    expect(forwardsFor('', '/')).toEqual([href(defaultLocale)]);
  });
});

describe('the no-JS fallback body', () => {
  it('emits ONE h1 whose lines are the five titles', () => {
    const main = notFoundMain(BLOCKS, LINKS);
    expect(main.match(/<h1/g)).toHaveLength(1);
    for (const { locale, title } of BLOCKS) {
      expect(main).toContain(
        `<span class="block" lang="${locale}">${title}</span>`,
      );
    }
    // §9 one-h1-per-page holds here as it does on the shell pages: a visitor
    // without JavaScript sees one heading with five lines, not five headings.
    expect(main.match(/<span class="block"/g)).toHaveLength(BLOCKS.length);
  });

  it('justifies each message, in its own language', () => {
    const main = notFoundMain(BLOCKS, LINKS);
    for (const { locale, message } of BLOCKS) {
      expect(main).toContain(
        `<p class="max-w-xl text-justify" lang="${locale}">${message}</p>`,
      );
    }
    expect(main.match(/<p class="max-w-xl text-justify"/g)).toHaveLength(
      BLOCKS.length,
    );
  });

  it('offers a way into all five shell pages', () => {
    const main = notFoundMain(BLOCKS, LINKS);
    for (const { locale, href: target, name } of LINKS) {
      expect(main).toContain(
        `<a class="underline" href="${target}" lang="${locale}" hreflang="${locale}">${name}</a>`,
      );
    }
    // A stranded no-JS visitor is not left on a page that only apologises —
    // the root stub's own visible link list, for the same reason (§13's link
    // check follows these too).
    expect(main.match(/<li>/g)).toHaveLength(LINKS.length);
  });

  it('derives its blocks and its links from the arrays it is given', () => {
    // Two arrays, one locale set: a language cannot be described in the body
    // but missing from the way out, or vice versa. Proven with a two-entry
    // subset — everything present, nothing else.
    const main = notFoundMain(BLOCKS.slice(0, 2), LINKS.slice(0, 2));
    expect(main.match(/<span class="block"/g)).toHaveLength(2);
    expect(main.match(/<li>/g)).toHaveLength(2);
    for (const dropped of ['de', 'fr', 'it']) {
      expect(main).not.toContain(`lang="${dropped}"`);
      expect(main).not.toContain(nativeNames[dropped as 'de']);
    }
  });
});

describe('the assembled document', () => {
  const render = (generatedNote: string) =>
    renderNotFoundHtml({
      lang: defaultLocale,
      htmlClassName: 'serif-variable mono-variable',
      title: 'Title ro — Premium Smile',
      stylesheets: ['/_next/static/chunks/fixture.css'],
      basePath: '',
      cookieName: COOKIE,
      defaultLocale,
      blocks: BLOCKS,
      links: LINKS,
      generatedNote,
    });

  const html = render(
    'GENERATED by tools/generate-404.ts — do not edit by hand.',
  );

  it('is a complete document with the shell’s own root attributes', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain(`<html lang="${defaultLocale}"`);
    expect(html).toContain('class="serif-variable mono-variable"');
    expect(html).toContain('<title>Title ro — Premium Smile</title>');
    expect(html).toContain('<body class="bg-page font-body text-ink">');
    expect(html.endsWith('</html>\n')).toBe(true);
    expect(html).not.toContain('${');
  });

  it('is unconditionally noindex and carries its provenance', () => {
    // UNCONDITIONAL, unlike the shell's env-gated robots meta: this document is
    // a signpost, never a destination, and it is the armor if a misconfigured
    // host ever served it with status 200.
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('GENERATED by tools/generate-404.ts');
  });

  it('refuses a note that would truncate its own HTML comment', () => {
    // `--` is invalid inside an HTML comment and ends it early in some
    // parsers, which would spill the rest of the note into the page as text.
    // A machine, not a shouted comment in the tool.
    expect(() => render('a note with -- inside it')).toThrow(/--/);
  });

  it('loads its stylesheet, then runs the script last in the head', () => {
    expect(html).toContain(
      '<link rel="stylesheet" href="/_next/static/chunks/fixture.css" />',
    );
    const link = html.indexOf('<link rel="stylesheet"');
    const script_ = html.indexOf('<script>');
    const bodyOpen = html.indexOf('<body');
    expect(link).toBeGreaterThan(-1);
    // The forward should start as early as possible — but never before the
    // document has said what it is (title, robots, provenance).
    expect(script_).toBeGreaterThan(link);
    expect(script_).toBeLessThan(bodyOpen);
  });
});
