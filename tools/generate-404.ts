// Generates out/404.html — THE 404 DISPATCHER — from
// src/lib/not-found-html/not-found-html.ts (every byte of the document),
// src/messages/*.json (every word of it), src/i18n/locales.ts (the manifest and
// the cookie name) and src/i18n/href.ts (every URL), plus two facts lifted out
// of the BUILT default-locale page so this document cannot drift from what the
// site actually loads: the <html> class next/font mints, and the stylesheet
// chunk Turbopack emits. Runs as the last step of `npm run build` on plain Node
// (24+ strips types natively). Deterministic: same inputs ⇒ same bytes.
//
// ── WHAT IT REPLACES, AND WHY A TOOL AT ALL. `next build` already writes an
// out/404.html: bare <html> with NO lang attribute, English boilerplate, no
// tokens and no fonts, and seven framework scripts. On a static host that ONE
// file answers every unknown URL with a real 404 status (the GitHub Pages and
// Cloudflare Pages convention) — it is the only entry point this site has for a
// dead link, and it cannot itself be five pages.
//
// ── SO IT IS A SIGNPOST, NOT THE PAGE (owner correction, 2026-09-06). The real
// not-found page is src/app/[locale]/404/page.tsx: a routed page inside the
// locale shell, pre-rendered five times, arriving with the Header, the Footer
// and the fixed corner controls like every other page, its message justified.
// This file forwards to whichever of the five the visitor should see. The
// reasoning, the banned alternatives and the signal order are argued in
// src/lib/not-found-html/not-found-html.ts' header and restated inside the
// generated document itself.
//
// THE PROBE (2026-09-06), recorded because the obvious alternative looks like
// it should work: a root src/app/not-found.tsx DOES build on Next 16.3, but
// Next wraps it in an IMPLICIT bare <html> — no lang on a page that speaks five
// languages (html-has-lang, §9), no token stylesheet, no fonts, seven scripts —
// and owning that element would mean giving the repo a ROOT layout, which the
// locale-shell architecture forbids: §5 puts exactly one <html> per locale in
// app/[locale]/layout.tsx. So this document is emitted the way out/index.html
// already is, by a build tool, following the tools/generate-root-redirect.ts
// precedent in structure, voice and doctrine — and that stub is now the CLOSEST
// precedent in the repo, not merely a stylistic one: same baked href table,
// same cookie read, same `location.replace`. The template module lives in
// src/lib/ — the React-free foundation ring (§4) — because it is build
// MACHINERY, not a page: src/app/ holds routes only (the owner's 2026-09-06
// org call), tools/ may import src modules while nothing imports tools/, and
// the ring's fence test polices the no-framework promise the emitted document
// depends on.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  renderNotFoundHtml,
  type NotFoundBlock,
} from '../src/lib/not-found-html/not-found-html.ts';
import { localeHref } from '../src/i18n/href.ts';
import {
  defaultLocale,
  locales,
  LOCALE_COOKIE,
  nativeNames,
} from '../src/i18n/locales.ts';

const outDir = join(process.cwd(), 'out');
if (!existsSync(outDir)) {
  console.error(
    'out/ not found — run `next build` first (this runs inside `npm run build`).',
  );
  process.exit(1);
}

// THE BUILT DEFAULT-LOCALE PAGE is the donor for the two things this document
// cannot know on its own. Both extractions throw LOUDLY rather than degrade: a
// 404 page silently shipped without its stylesheet is unstyled five-language
// text on the one page a visitor reaches already frustrated, and nothing else
// in the pipeline would notice.
const donorPath = join(outDir, defaultLocale, 'index.html');
const donor = readFileSync(donorPath, 'utf8');

const htmlClassMatch = donor.match(/<html[^>]*\sclass="([^"]*)"/);
if (!htmlClassMatch || htmlClassMatch[1].trim() === '') {
  // EMPTY COUNTS AS MISSING. A class attribute that matched but carries nothing
  // would sail through and ship a 404 in the browser's default system font —
  // the silent degradation this file's loud-throw doctrine exists to refuse,
  // and the one no test downstream would catch.
  throw new Error(
    `${donorPath}: no class attribute on <html>, or an empty one — the shell always carries ` +
      "next/font's variables there (src/app/[locale]/layout.tsx). Without them the 404 ships " +
      'in the system font. Re-check that file, or the extraction here.',
  );
}
const htmlClassName = htmlClassMatch[1];

// One-or-more, deliberately: today Turbopack emits a single CSS chunk, but the
// count is its business and not a contract this file should assume.
const stylesheets = [...donor.matchAll(/<link\b[^>]*>/g)]
  .map((tag) => tag[0])
  .filter((tag) => /rel="stylesheet"/.test(tag))
  .map((tag) => tag.match(/href="([^"]*)"/)?.[1])
  .filter((href): href is string => href !== undefined);
if (stylesheets.length === 0) {
  throw new Error(
    `${donorPath}: no <link rel="stylesheet"> found — the built page always loads the ` +
      'Tailwind chunk. Either the build output changed shape or this extraction did; ' +
      'shipping the 404 without it would ship it unstyled.',
  );
}

type NotFoundMessages = {
  common: { siteName: string; notFound: { title: string; message: string } };
};

const messages = Object.fromEntries(
  locales.map((locale): [string, NotFoundMessages] => [
    locale,
    JSON.parse(
      readFileSync(
        join(process.cwd(), 'src', 'messages', `${locale}.json`),
        'utf8',
      ),
    ) as NotFoundMessages,
  ]),
);

// MANIFEST ORDER (ro first): the order the blocks are written in is the order a
// crawler and a no-JS visitor read them in, so it is the manifest's, not an
// object-key accident.
const blocks: NotFoundBlock[] = locales.map((locale) => ({
  locale,
  title: messages[locale].common.notFound.title,
  message: messages[locale].common.notFound.message,
}));

// Interim GitHub Pages serves under /<repo>/ (§15.2 amended 2026-08-02). Here
// it is not just a log value as it is in the root stub: the inline script
// STRIPS this prefix before reading the first path segment, so a miss under
// /premium-smile-development/de/… still resolves to German.
const base = process.env.PAGES_BASE_PATH ?? '';

// THE FIVE DESTINATIONS, computed HERE and shipped as results (org review D12).
// `localeHref` cannot be CALLED by the emitted script — it runs in a browser
// where no module of ours exists — so the call happens at build time and what
// ships is its output: a locale → href table the script only indexes into. The
// visitor's browser therefore performs no URL arithmetic of its own, and
// src/i18n/href.ts is left with no second spelling to stay in step with.
// '/404/' is the routed page src/app/[locale]/404/page.tsx renders — a REAL
// page in the shell, with Header, Footer and the corner controls, which is the
// whole point of the owner's 2026-09-06 correction.
const links = locales.map((locale) => ({
  locale,
  href: localeHref(locale, '/404/'),
  name: nativeNames[locale],
}));

// ONE <title> for a document shipped in five languages, from the default
// locale — exactly as out/index.html takes its own (src/i18n/locales.ts' note
// on defaultLocale's remaining roles). Nobody should read this document long
// enough to notice: it forwards on the first frame.
// `404: ` leads (owner, 2026-09-07) — the same locale-neutral prefix the
// routed pages' generateMetadata composes, and composed HERE rather than in
// the message files for the same reason: see that metadata note in
// src/app/[locale]/404/page.tsx, and the source-text pins in
// tests/unit/not-found-404.test.ts that hold the pair together.
const title = `404: ${messages[defaultLocale].common.notFound.title} — ${messages[defaultLocale].common.siteName}`;

// The `--` ban this note observes is enforced by renderNotFoundHtml, which
// throws rather than ship a truncated HTML comment.
const generatedNote = `GENERATED by tools/generate-404.ts from
src/lib/not-found-html/not-found-html.ts, src/messages/*.json,
src/i18n/locales.ts and src/i18n/href.ts (every URL below) — do not edit by
hand.

THE 404 DISPATCHER (owner decisions, 2026-09-06, incl. that day's correction:
the not found page must be a REAL page inside the site shell, with header,
footer and the corner buttons, and its text justified).

The real page is src/app/[locale]/404/page.tsx, pre rendered five times. THIS
file is the one thing a static host can serve for an unknown URL, and its job
is only to decide which of those five a visitor is sent to. The miss already
returned HTTP 404 with this document, so a crawler has its answer before any
script runs and the index never sees a soft 404; the forward that follows is
for the human.

· Routing a miss to the HOME page is BANNED. The visitor is teleported
  somewhere they never asked for, with no explanation of what happened.
· A timed auto redirect is BANNED: a page that moves under an older reader
  mid sentence (SC 2.2.1). The forward here is immediate or never.
· Forwarding INSTANTLY to the locale's own not found page is the sanctioned
  pattern, the same one out/index.html already uses for "/".

Signals, in order: the URL's own first path segment, then the §8.7 language
cookie (read here, written only on an explicit click elsewhere), then the
site's default locale. No IP, no geolocation, ever (§8.6).

Without JavaScript nothing forwards, so the body below stands on its own: one
heading of five lines, five messages, and five links into the real pages.

noindex is UNCONDITIONAL here, unlike the shell's env gated robots meta: this
document is a signpost and never a destination, and the meta is the armor if
a misconfigured host ever served it with status 200.`;

const html = renderNotFoundHtml({
  lang: defaultLocale,
  htmlClassName,
  title,
  stylesheets,
  basePath: base,
  cookieName: LOCALE_COOKIE,
  defaultLocale,
  blocks,
  links,
  generatedNote,
});

// ── THE CLASS-PRESENCE ASSERT. Every class this document wears must exist as a
// selector in the CSS this document loads.
//
// WHY IT CANNOT NORMALLY FIRE: Tailwind v4 scans this repo's source itself, and
// not-found-html.ts is source — so the utilities it spells are generated into
// the chunk by the build that just ran, automatically. That is precisely why
// the assert is worth its lines: it is not policing the author, it is policing
// the JOIN. What it actually catches is (a) a wrong or stale stylesheet
// extraction above — the donor's shape changed and the hrefs now point at
// something else, (b) a .gitignore or source-detection change that stops
// Tailwind scanning this module (Tailwind skips ignored files, and this
// document would then ship unstyled), and (c) a class that is not a simple
// utility at all — a variant or an arbitrary value, which the lookup below
// cannot express and which not-found-html.ts' header bans for that reason.
//
// The tokens come from the WHOLE rendered document (the <main> markup AND
// <body>), minus the <html> class, which was lifted verbatim from the built
// page and is next/font's business rather than Tailwind's.
const fontClasses = new Set(htmlClassName.split(/\s+/));
const tokens = [
  ...new Set(
    [...html.matchAll(/class="([^"]*)"/g)]
      .flatMap((match) => match[1].split(/\s+/))
      .filter((token) => token !== '' && !fontClasses.has(token)),
  ),
].sort();

// The document's stylesheet, in full: the linked chunks and nothing else. It
// carries no <style> block of its own since the dispatcher rework — there is
// no longer anything to hide.
const css = [
  ...stylesheets.map((href) => {
    const relative =
      base && href.startsWith(base) ? href.slice(base.length) : href;
    const file = join(outDir, relative);
    if (!existsSync(file)) {
      throw new Error(
        `${file} not found, but ${donorPath} links it as "${href}" — the href-to-file ` +
          'mapping here (base path strip) no longer matches the build output.',
      );
    }
    return readFileSync(file, 'utf8');
  }),
].join('\n');

const missing = tokens.filter(
  (token) =>
    !new RegExp(
      `\\.${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[{,:]`,
    ).test(css),
);
if (missing.length > 0) {
  throw new Error(
    `out/404.html would ship with unstyled classes: ${missing.join(', ')}. ` +
      'Every class on this page must be a SIMPLE compiled utility (no variants, no ' +
      'arbitrary values) present in the stylesheet the page loads — use one that is ' +
      'already compiled, or check that Tailwind still scans ' +
      'src/lib/not-found-html/not-found-html.ts.',
  );
}

writeFileSync(join(outDir, '404.html'), html);
console.log(
  `out/404.html generated for [${locales.join(', ')}], default "${defaultLocale}", base "${base || '/'}", ${html.length} bytes.`,
);
