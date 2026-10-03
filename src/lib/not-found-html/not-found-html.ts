// THE 404 DISPATCHER, as text — pure data-shaping, zero imports, so the one
// consumer that matters can reach it: tools/generate-404.ts, plain Node at
// build time (the src/i18n/href.ts charter, for the same reason). No React, no
// next-intl, no browser API — which is the src/lib/ residency requirement (§4:
// the React-free foundation ring, fence-tested in tests/unit/). It does NOT
// live under src/app/ because app/ holds routes, and this file builds a
// document that deliberately is not one (owner org call, 2026-09-06).
//
// ── WHAT THIS DOCUMENT IS, AFTER THE OWNER'S 2026-09-06 CORRECTION. The real
// not-found page is a ROUTED SHELL PAGE — src/app/[locale]/404/page.tsx,
// pre-rendered five times, arriving with the Header, the Footer and the fixed
// corner controls exactly like every other page, and carrying a justified
// paragraph under its heading. This file builds something else: out/404.html,
// the ONE file a static host can serve for an unknown URL (the GitHub Pages and
// Cloudflare Pages convention), whose whole job is to decide WHICH of those five
// pages a visitor is sent to.
//
// ── WHY THIS IS NOT A SOFT 404, stated plainly because it is the objection the
// shape invites. The miss already returned HTTP 404: the host answered the dead
// URL with this document AND that status, so a crawler has its answer before a
// line of script runs and the index never sees a 200. The forward that follows
// is for the HUMAN — and it goes to a page that explains itself in their
// language, never to the home page.
//
// ── WHAT REMAINS BANNED (owner, 2026-09-06):
//   · ROUTING A MISS TO THE HOME PAGE — the visitor is teleported somewhere
//     they never asked for, with no explanation of what happened;
//   · ANY TIMED REDIRECT — a page that moves under an older reader mid-sentence
//     (SC 2.2.1). The forward here is immediate or never.
// This is precisely the out/index.html pattern (tools/generate-root-redirect.ts
// — now the closest precedent in the repo, and worth reading beside this file)
// with one better signal available: the root stub has only a cookie and
// navigator.languages to go on, while a dead URL usually names its own locale
// in the first path segment.
//
// ── THE STRINGS ARE OWNER-AUTHORED (§8.10, and the fb-259/260 rule that no
// user-facing text gets a default in code): `title` and `message` arrive as
// finished strings, read by the tool from src/messages/*.json
// (`common.notFound`) — the SAME keys the routed page renders. Nothing here
// invents, joins or fragments a sentence.
//
// ── WHY THE FALLBACK BODY IS STILL FIVE LANGUAGES. A visitor without
// JavaScript never gets forwarded, so this document must stand on its own for
// them and for a crawler: one <h1> whose five lines are the five titles (§9
// wants exactly one heading, and five sibling <h1>s would fail that), one
// justified paragraph per language, and then the way out — the root stub's own
// visible link list, five plain anchors into the five real pages. Each part
// declares its own `lang` (SC 3.1.2): without it a screen reader pronounces
// "Diese Seite existiert nicht" with the page's Romanian voice.
//
// ── WHY NOT ui/Container's GUTTER (§15.15 a, board fb-343). Container is a
// React TSX module and this document is assembled by a plain-Node tool that
// cannot import one; more to the point, the container recipe governs BANDS
// inside the shell, and this document is not in the shell — it has no Header
// and no Footer, by design, because it is a signpost nobody should read for
// more than a frame. `px-6` plus `max-w-xl` is the deliberate substitute. The
// ROUTED page, which IS in the shell, follows the recipe properly.
//
// ── THREE CONSTRAINTS, EACH WITH A MACHINE BEHIND IT:
//   · THE SCRIPT IS STRICT ES5 — `var`, `function`, `indexOf`; no arrows, no
//     const/let, no template literals in the EMITTED text. This is the document
//     a visitor reaches when something has already gone wrong, on whatever
//     phone they have (§1's 70-year-old, §3's frozen engines), and it carries
//     no transpiler. tests/unit/not-found-404.test.ts asserts the absence of
//     `=>`, of `const `/`let `, and of any unfilled `${` hole, and executes the
//     script against a fixture table of URLs.
//   · EVERY CLASS IS A SIMPLE UTILITY — no dots, no brackets, no variants — so
//     that a token can be looked up as `.token` in the built stylesheet.
//     tools/generate-404.ts does exactly that and throws naming the missing
//     tokens, which is what keeps this document from shipping unstyled the day
//     a class stops being generated.
//   · THE PROVENANCE NOTE CARRIES NO `--`, which would truncate the HTML
//     comment it ships inside and spill the rest onto the page as text.
//     renderNotFoundHtml throws on it — the note is prose, and prose grows a
//     double hyphen the moment someone reformats a sentence.

/** One language's share of the fallback body. */
export type NotFoundBlock = {
  locale: string;
  title: string;
  message: string;
};

/**
 * One language's DESTINATION: the finished URL of that locale's routed 404 page
 * (`localeHref(locale, '/404/')` — locale prefix, trailing slash and interim
 * base path already on), plus the language's name in itself for the visible
 * list. Built by the tool and BAKED (org review D12): the visitor's browser
 * performs no URL arithmetic of its own, and src/i18n/href.ts is left with no
 * second spelling to stay in step with.
 */
export type NotFoundLink = {
  locale: string;
  href: string;
  name: string;
};

/** Indent a multi-line block for the position it is dropped into, leaving
 *  blank lines blank. Cosmetic only — the document is read by people (and
 *  diffed byte-for-byte in review) far more often than by a parser. */
function indent(text: string, spaces: string): string {
  return text
    .split('\n')
    .map((line) => (line === '' ? line : spaces + line))
    .join('\n');
}

/**
 * The dispatcher itself, as BARE JavaScript text (no <script> tags): choose a
 * locale and forward to that locale's real 404 page, immediately.
 *
 * THREE SIGNALS, IN ORDER, each one weaker than the last:
 *   1. THE URL'S OWN FIRST PATH SEGMENT. A dead link usually names the language
 *      it was written for ('/de/alte-seite/'), and the address someone actually
 *      followed outranks anything remembered about them.
 *   2. THE §8.7 LANGUAGE COOKIE — the visitor's own explicit past click, read
 *      here and never written (only the switcher and the banner write it). The
 *      regex shape is the root stub's, and `cookieName` is interpolated from
 *      the same constant, so the emitted bytes cannot drift from what
 *      setLocaleCookie writes. Two consequences of it being EMITTED rather than
 *      called: the name must stay REGEX-SAFE — a metacharacter in it would
 *      silently change what the pattern matches, and no type can catch that —
 *      and any change to it moves the generated bytes, so the proof lives in a
 *      diff of out/404.html.
 *   3. THE SITE'S DEFAULT LOCALE. NOT `fallbackLocale`, and not in conflict
 *      with it: that constant belongs to the root stub's no-match branch, where
 *      the question is "which of the five does this visitor READ?" and the
 *      answer came from navigator.languages (§5, D1). Nothing here has asked
 *      about the visitor's languages at all, so the site's own default is the
 *      honest destination rather than a guess dressed as one.
 * No IP, no geolocation, ever (§8.6) — and no navigator.languages either: the
 * §8.6 suggestion banner on the destination page is where that conversation
 * belongs, with a dismissible offer instead of a silent decision.
 *
 * THE DATA IS BAKED, THE SCRIPT ONLY INDEXES IT (D12). `basePath`, the locale
 * list and the destination table are interpolated here at build time, all three
 * derived from the SAME `links` array — so a locale cannot be in the lookup and
 * missing from the table, or forwarded to a URL the visible list never offers.
 *
 * THE BASE-PATH STRIP IS GUARDED TWICE. It is guarded at all because the prefix
 * is baked into the build while the pathname may not carry it (a host
 * reconfigured under the same build, a hand-typed URL). It is guarded on a
 * SEGMENT BOUNDARY — `path === base` or `base + '/'` — for the reason
 * src/i18n/href.ts' stripLocale spells out for the locale prefix: a bare text
 * prefix would treat '/premium-smile-developmentX/de/' as a prefixed path and
 * hand the rest to the segment rule, inventing a match out of a neighbour.
 */
export function notFoundScript(opts: {
  basePath: string;
  links: readonly NotFoundLink[];
  cookieName: string;
  defaultLocale: string;
}): string {
  const hrefs = Object.fromEntries(
    opts.links.map((link) => [link.locale, link.href]),
  );

  return `(function () {
  var base = ${JSON.stringify(opts.basePath)};
  var hrefs = ${JSON.stringify(hrefs)};
  var locales = ${JSON.stringify(opts.links.map((link) => link.locale))};
  var target = null;
  var path = location.pathname;
  if (base && (path === base || path.indexOf(base + '/') === 0)) path = path.slice(base.length);
  var seg = path.split('/')[1] || '';
  if (locales.indexOf(seg) !== -1) target = seg;
  if (!target) {
    var m = document.cookie.match(/(?:^|;\\s*)${opts.cookieName}=([a-z]{2})/);
    if (m && locales.indexOf(m[1]) !== -1) target = m[1];
  }
  location.replace(hrefs[target || '${opts.defaultLocale}']);
})();`;
}

/**
 * The page's whole body — what a visitor without JavaScript, and every crawler,
 * actually gets: one heading of five lines, five centred messages, and five
 * ways out.
 *
 * THE PARAGRAPHS ARE `text-center`, PER ELEMENT (owner, 2026-09-07: "f*ck
 * justify keep centered" — superseding their 2026-09-06 "text in justify";
 * the sentence before the forward must stay the sentence after it, so this
 * fallback mirrors the routed page's reversal). The utility rides each <p>
 * itself, never a wrapper — the §15.15 b
 * canon (PR #70): globals.css aligns p/li/blockquote to `start` at the base
 * tier precisely so that inherited alignment cannot reach prose, and a
 * deliberate exception therefore belongs ON the element. The routed shell page
 * spells the same override the same way, for the same reason. Justified text is
 * only acceptable here because §15.14's site-wide `hyphens: auto` is in the
 * stylesheet this document loads: without hyphenation, justification opens
 * rivers of white space, and German is where that shows first.
 *
 * THE LINK LIST WEARS TWO CLASSES THE ROOT STUB NEEDS NONE OF, because that
 * stub loads no stylesheet and this one loads Tailwind's: preflight strips
 * both the list markers and the anchors' underline+colour, so without
 * `underline` the five links would render as plain text (a §9 failure — a link
 * a visitor cannot see is not a way out), and `role="list"` restores the
 * semantics Safari drops from any `list-style: none` list outside a <nav> (the
 * repo's own eslint carve-out records that rule; jsx-a11y cannot see this
 * markup, so it is written by hand).
 *
 * TITLES, MESSAGES AND NAMES ARE INTERPOLATED AS-IS, unescaped. Two things make
 * that safe rather than lucky. The inputs are owner-authored message files
 * (§8.10) and the locale manifest — there is no untrusted string anywhere on
 * this page. And the claim is MECHANIZED rather than trusted:
 * not-found-html.test.ts parses the rendered document with a real DOMParser and
 * asserts every span's, paragraph's and anchor's `textContent` equals the raw
 * source string, so the day a translation grows a `<` or a bare `&` the parse
 * diverges and CI goes red before the page ships.
 * NOT ADDING AN ESCAPER HERE (recorded, not forgotten): this document's twin,
 * tools/generate-root-redirect.ts, interpolates `nativeNames` the same way, and
 * escaping one of the pair alone would fork the precedent while leaving the
 * other exposed. That belt belongs to a hygiene lane covering both tools.
 */
export function notFoundMain(
  blocks: readonly NotFoundBlock[],
  links: readonly NotFoundLink[],
): string {
  const titles = blocks
    .map(
      ({ locale, title }) =>
        `<span class="block" lang="${locale}">${title}</span>`,
    )
    .join('\n');

  const messages = blocks
    .map(
      ({ locale, message }) =>
        `<p class="max-w-xl text-center" lang="${locale}">${message}</p>`,
    )
    .join('\n');

  const items = links
    .map(
      ({ locale, href, name }) =>
        `<li><a class="underline" href="${href}" lang="${locale}" hreflang="${locale}">${name}</a></li>`,
    )
    .join('\n');

  return `<main class="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16">
  <h1 class="font-display text-3xl text-ink-strong">
${indent(titles, '    ')}
  </h1>
${indent(messages, '  ')}
  <ul class="flex flex-wrap justify-center gap-4" role="list">
${indent(items, '    ')}
  </ul>
</main>`;
}

/**
 * The finished document — everything above, plus the head the build supplies:
 * the shell's own <html> class (next/font's variables) and stylesheet links,
 * lifted verbatim from the built default-locale page so this file cannot drift
 * from what the site actually loads.
 *
 * `noindex` is UNCONDITIONAL, unlike the shell's env-gated robots meta: this
 * document is a signpost and never a destination, and the meta is the armor if
 * a misconfigured host ever served it with a 200.
 *
 * THE SCRIPT IS LAST IN THE HEAD: as early as a forward can start, but never
 * before the document has said what it is (title, robots, provenance), and
 * before <body> is parsed so the fallback body never paints for a visitor who
 * is about to be moved.
 *
 * There is no `locales` option: the language list IS `links`, and passing it
 * twice is how the two could ever disagree.
 */
export function renderNotFoundHtml(opts: {
  lang: string;
  htmlClassName: string;
  title: string;
  stylesheets: readonly string[];
  basePath: string;
  cookieName: string;
  defaultLocale: string;
  blocks: readonly NotFoundBlock[];
  links: readonly NotFoundLink[];
  generatedNote: string;
}): string {
  // `--` is invalid inside an HTML comment and truncates it in some parsers,
  // which would spill the rest of the provenance note into the page as visible
  // text. A machine rather than a warning in the caller: the note is prose, and
  // prose grows a double hyphen the moment someone reformats a sentence.
  if (opts.generatedNote.includes('--')) {
    throw new Error(
      'generatedNote contains "--", which is invalid inside an HTML comment and would ' +
        'truncate it — the rest of the note would render as visible text on the page. ' +
        'Use an em dash (—) or rewrite the sentence.',
    );
  }

  const links = opts.stylesheets
    .map((href) => `    <link rel="stylesheet" href="${href}" />`)
    .join('\n');

  return `<!doctype html>
<html lang="${opts.lang}" class="${opts.htmlClassName}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.title}</title>
    <meta name="robots" content="noindex" />
    <!--
${indent(opts.generatedNote, '      ')}
    -->
${links}
    <script>
${indent(
  notFoundScript({
    basePath: opts.basePath,
    links: opts.links,
    cookieName: opts.cookieName,
    defaultLocale: opts.defaultLocale,
  }),
  '      ',
)}
    </script>
  </head>
  <body class="bg-page font-body text-ink">
${indent(notFoundMain(opts.blocks, opts.links), '    ')}
  </body>
</html>
`;
}
