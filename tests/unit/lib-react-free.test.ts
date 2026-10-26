import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readModule, type ModuleReading } from './module-reader.ts';

// TWO IMPORT FENCES OVER src, ONE READER.
//   ① THE REACT-FREE FOUNDATION RING — src/lib names no framework (§4, §15.15).
//   ② THE CLIENT-IMPORT FENCE — the islands never import the site's data
//      (§15.40, §16). Born in sections/Header/Header.test.tsx on 2026-10-15,
//      moved here on 2026-10-21 (the blog-article lane's round-2 review) so
//      that both fences read imports through ONE reader (THE READER): the two
//      hand-written readers they had until then missed a dynamic import in
//      backticks TOGETHER once already, and this node project loads the
//      TypeScript compiler that the Header suite's browser project would have
//      to bundle.
//
// THE READER (2026-10-21) parses each module with the TypeScript compiler, the
// parser tsc itself runs, and walks the syntax tree — tests/unit/module-reader.ts,
// where its record lives (every form one module names another by, and why
// the text readers before it failed). It moved there on 2026-10-21 (round 1
// of lib/visible-text's review) for a second reader, a test that round 2
// deleted with the copies it compared (lib/json-shape holds them once now);
// both fences below read imports through it.
//
// ── ① THE REACT-FREE FOUNDATION-RING FENCE (CLAUDE.md §4 + §15.15; the
// cx-to-lib lane's G2 LOW, 2026-09-02). src/lib/ is importable from every tier
// and from plain Node — build tooling, this very node test project — precisely
// because it drags no framework in. That rule lived only in comments
// (lib/cx.ts's two-question home test, scroll-lock's "no React in it"); a
// comment-only invariant breaks silently. This test is the machine: the moment
// any lib file names react/react-dom/next/next-intl — in any of the reader's
// forms — the fast unit project (and the pre-push hook, and CI) goes red naming
// the file and the specifier. A path built at run time is refused in lib/
// outright: it could name a framework, and nothing can read which.
//
// Mechanism note (§15.15 offered two): the eslint `no-restricted-imports`
// variant fires earlier (at typing time) but requires editing
// eslint.config.mjs, which the ECC config-protection hook bars agent sessions
// from touching. This source-guard is the other sanctioned mechanism — same
// red, one gate later. If the eslint fence is ever added by the owner, keep
// BOTH: lint for feedback speed, this for depth (it also catches dynamic
// import(), which no-restricted-imports does not).
//
// Type-only imports are banned too, deliberately: `import type` vanishes at
// runtime, but it still couples lib/'s build to React's type packages and
// normalizes the specifier in the one folder whose promise is its absence.
// A genuine future need for a React type in lib/ is a §15-class decision,
// not a quiet import.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));
const LIB_DIR = join(SRC_DIR, 'lib');

// ── THE READER — `readModule`, tests/unit/module-reader.ts (the header).

/** How a report marks a computed path, after its source text. */
const COMPUTED = ' — a path built at run time';

// ── ① THE RING ──────────────────────────────────────────────────────────────

/** Framework specifiers the ring must never name, as whole first segments —
 * 'react' and 'react-dom/client' match; 'react-aria-like-lib' would not. */
const BANNED = /^(react|react-dom|next|next-intl)(\/|$)/;

/** THE RING'S READING of one lib module: every naming of a framework, a
 *  type-only one included, and every path built at run time, as
 *  "file → specifier". */
const ringOffences = (file: string, source: string): string[] =>
  readModule(file, source)
    .uses.filter((use) => use.computed || BANNED.test(use.specifier))
    .map((use) => `${file} → ${use.specifier}${use.computed ? COMPUTED : ''}`);

describe('src/lib is the React-free foundation ring (§4, §15.15)', () => {
  const files = readdirSync(LIB_DIR, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .sort();

  it('contains files to guard (the fence never passes vacuously)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('has teeth — the reader finds a framework in every import form, a dynamic import in backticks included', () => {
    const forms: Record<string, string> = {
      'a static import': "import { useState } from 'react';",
      'a type-only import (banned here too)':
        "import type { ReactNode } from 'react';",
      'a side-effect import': "import 'react-dom/client';",
      'a re-export': "export { notFound } from 'next/navigation';",
      'a dynamic import in quotes': "const intl = await import('next-intl');",
      'a dynamic import in backticks':
        'const intl = await import(`next-intl/server`);',
      // The forms the text reader missed (the round-2 review, 2026-10-21).
      'a dynamic import with a second argument':
        "const intl = await import('next-intl', { with: {} });",
      'an import() in a TYPE position (banned here too)':
        "type Node = import('react').ReactNode;",
      'a require() call': "const react = require('react');",
    };
    for (const [form, code] of Object.entries(forms)) {
      expect(ringOffences('x/x.ts', code), form).toHaveLength(1);
    }
    // A path built at run time could name a framework: refused outright.
    for (const code of [
      "const intl = await import('next-' + 'intl');",
      'const intl = await import(`next-intl/${part}`);',
      'const intl = await import(name);',
    ]) {
      expect(ringOffences('x/x.ts', code), code).toEqual([
        expect.stringMatching(new RegExp(`${COMPUTED}$`)),
      ]);
    }
    // Prose is no code: a comment, a string and a template that SPELL an
    // import name nothing (the text reader read all three).
    for (const prose of [
      "// import { useState } from 'react';",
      'const example = "import \'react\'";',
      "const example = `import('next-intl')`;",
    ]) {
      expect(ringOffences('x/x.ts', prose), prose).toEqual([]);
    }
    // A lib neighbour is no framework.
    expect(readModule('x/x.ts', "import { cx } from '../cx/cx';").uses).toEqual(
      [{ specifier: '../cx/cx', typeOnly: false, computed: false }],
    );
  });

  it('names no react/react-dom/next/next-intl specifier, and builds no import path at run time, in any lib file', () => {
    const offenders = files.flatMap((name) =>
      ringOffences(name, readFileSync(join(LIB_DIR, name), 'utf8')),
    );
    // A hit means framework code entered the ring. Move the logic beside the
    // components (ui/ flat modules — the lib/cx.ts two-question test), or take
    // the §15-class decision out loud; never widen BANNED to get green.
    expect(offenders).toEqual([]);
  });
});

// ── ② THE CLIENT-IMPORT FENCE ───────────────────────────────────────────────

/** src-relative path → source text: every .ts and .tsx module in src, the
 *  tests, the stories and the declarations aside — the set the Header suite's
 *  glob read until 2026-10-21. */
const readSrcModules = (): Map<string, string> =>
  new Map(
    readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
      .map((name) => name.split(sep).join('/'))
      .filter(
        (name) =>
          /\.tsx?$/.test(name) &&
          !/\.(?:test\.tsx?|stories\.tsx|d\.ts)$/.test(name),
      )
      .sort()
      .map(
        (name) => [name, readFileSync(join(SRC_DIR, name), 'utf8')] as const,
      ),
  );

/** A specifier as the module it names, src-relative and extension-less:
 *  `@/…` unprefixed, a relative path joined to the importing `file`'s folder,
 *  a package left as it is. ONE normaliser for both first-party spellings, so
 *  `.`, `..` and an empty segment read alike in either: `@/lib/./blog/blog`,
 *  `@/lib//blog/blog` and `@/components/../lib/blog/blog` all name
 *  lib/blog/blog. A `..` past src's root is kept, so such a path names
 *  nothing in src. */
const resolveSpecifier = (file: string, specifier: string): string => {
  let segments: string[];
  if (specifier.startsWith('@/')) {
    segments = specifier.slice(2).split('/');
  } else if (specifier.startsWith('.')) {
    segments = [...file.split('/').slice(0, -1), ...specifier.split('/')];
  } else {
    return specifier;
  }
  const path: string[] = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..' && path.length > 0 && path.at(-1) !== '..') {
      path.pop();
    } else {
      path.push(segment);
    }
  }
  return path.join('/').replace(/\.(?:tsx?|jsx?)$/, '');
};

/** The site data no module of the client graph may name (THE FENCE, below):
 *  the lists the server fills by design — the dropdowns' three lib modules;
 *  since 2026-10-20 the blog's (lib/blog, lib/blog-article, lib/site-origin
 *  and the JSON under content/blog/); since 2026-10-21 lib/reviews,
 *  lib/hero-slides and src/messages. A folder's bare name counts too
 *  (`(?:\/|$)`), so a barrel spelling is refused like the file. A module that
 *  only READS the data — a route's populator or words module, the reviews
 *  band, the Header's navSectionLinks — is no row: the walk reads through it
 *  and reports ITS import of the data (THE WALK, below); a hand-kept list of
 *  readers had already missed two (the team's and the services'
 *  populators). */
const DATA_MODULE =
  /^(?:lib\/(?:nav-sections|prices|team|blog|blog-article|site-origin|reviews|hero-slides)|content\/blog|messages)(?:\/|$)/;

/**
 * THE FENCE'S ONE READING of a module — the walk's report and the teeth both
 * run it: every VALUE naming in `source`, the module `file` (src-relative), of
 * a data module (DATA_MODULE) or of a path built at run time, which could
 * name one, as "file → specifier". A type-only naming is erased before the
 * bundler sees it and is never listed.
 */
const dataValueImports = (file: string, source: string): string[] =>
  readModule(file, source)
    .uses.filter(
      (use) =>
        !use.typeOnly &&
        (use.computed ||
          DATA_MODULE.test(resolveSpecifier(file, use.specifier))),
    )
    .map((use) => `${file} → ${use.specifier}${use.computed ? COMPUTED : ''}`);

/**
 * The src module a FIRST-PARTY specifier names, as a key of `sources`: the
 * files a resolver tries — `x.ts` or `x.tsx` (no module in src has both, so
 * which one a resolver tries first never matters), else a folder's
 * `index.ts` or `index.tsx` (src/fonts is such a folder; the walk's teeth
 * relay through one). A package is never looked up, so the walk stays inside
 * src; a file that is no TypeScript module (JSON, a stylesheet) names none —
 * it imports nothing further, and the site's JSON is refused by name in
 * DATA_MODULE.
 */
const moduleFile = (
  sources: ReadonlyMap<string, string>,
  file: string,
  specifier: string,
): string | undefined => {
  if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
    return undefined;
  }
  const path = resolveSpecifier(file, specifier);
  return [
    `${path}.ts`,
    `${path}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ].find((key) => sources.has(key));
};

/**
 * THE WALK — the CLIENT GRAPH of `sources`: every 'use client' module (a
 * root) and every src module the roots reach through VALUE namings, at any
 * depth, each mapped to the module it was first reached from (a root to
 * null). A module a client module imports is bundled for the browser too,
 * directive or not; a type-only naming is erased before the bundler sees it
 * and is not followed, and a computed path cannot be. A data module is never
 * walked into: reaching it IS the offence, reported once, at the import that
 * crosses.
 */
const clientGraph = (
  sources: ReadonlyMap<string, string>,
): ReadonlyMap<string, string | null> => {
  const read = (file: string): ModuleReading =>
    readModule(file, sources.get(file) ?? '');
  const roots = [...sources.keys()].filter((file) => read(file).client).sort();
  const graph = new Map<string, string | null>(
    roots.map((root) => [root, null]),
  );
  const queue = [...roots];
  for (let at = 0; at < queue.length; at += 1) {
    const file = queue[at];
    for (const use of read(file).uses) {
      if (use.typeOnly || use.computed) continue;
      if (DATA_MODULE.test(resolveSpecifier(file, use.specifier))) continue;
      const next = moduleFile(sources, file, use.specifier);
      if (next !== undefined && !graph.has(next)) {
        graph.set(next, file);
        queue.push(next);
      }
    }
  }
  return graph;
};

/** How `file` entered the client graph: its import chain, root first. */
const importChain = (
  graph: ReadonlyMap<string, string | null>,
  file: string,
): string[] => {
  const chain = [file];
  for (let from = graph.get(file); from; from = graph.get(from)) {
    chain.unshift(from);
  }
  return chain;
};

/**
 * THE FENCE'S REPORT: every offence of any module of the client graph of
 * `sources` (dataValueImports), each as the chain it ships through —
 * "root → … → importer → specifier".
 */
const clientDataImports = (sources: ReadonlyMap<string, string>): string[] => {
  const graph = clientGraph(sources);
  return [...graph.keys()]
    .sort()
    .flatMap((file) =>
      dataValueImports(file, sources.get(file) ?? '').map((offence) =>
        [...importChain(graph, file).slice(0, -1), offence].join(' → '),
      ),
    );
};

describe('the islands never import the site’s data (§15.40, §16)', () => {
  // THE FENCE (2026-10-15). The dropdowns list the tariff's eleven
  // categories and the six doctors; lib/nav-sections reads the WHOLE tariff
  // (lib/prices) and the WHOLE team (lib/team) to name them. Read on the
  // server, that costs a visitor nothing: Header.tsx builds the finished links
  // (navSectionLinks.ts) and hands the islands a prop. A module the browser's
  // JavaScript carries that USED either list would carry the list with it, and
  // the fence refuses more than that: any VALUE naming of a data module, in any
  // import form. It is a POLICY, stricter than the bundler, which drops an
  // import whose names are only ever used as types (SWC does, as tsc does):
  // spell a type with `type` (`import type …`, or `type` before each name) and
  // it is allowed, that naming being erased before any bundler runs. Read as
  // source, because no runtime assertion can see what a bundle includes.
  // WIDENED 2026-10-20 to the blog's data (the blog-article lane's lib review —
  // three reviewers asked for it apart): lib/blog parses the whole
  // five-language posts.json at import, a top-level call no tree-shaking drops;
  // lib/blog-article imports lib/blog AND lib/team as values, so one import of
  // it carries the posts, the article JSON and the whole team, and parses five
  // languages during hydration; lib/site-origin reads the BUILD's SITE_ORIGIN,
  // so a browser would compute lib/clinic's placeholder origin while the server
  // printed the build's — a wrong copied link, a hydration mismatch. The JSON
  // under content/blog/ is the data itself. MEASURED (esbuild, minified, then
  // gzip, 2026-10-21): one import of lib/blog, `articlePath` alone, 24.2 KiB
  // minified and 9.3 KiB gzipped; one of lib/blog-article, 142.2 KiB and
  // 40.0 KiB (bundled alone, lib/team is 16.2 KiB gzipped and the article JSON
  // 13.5 KiB).
  // WIDENED 2026-10-21 (the lane's round-2 typescript review) to the other lists
  // the server fills by design: lib/reviews (the patients' reviews, in five
  // languages), lib/hero-slides (the opener's slides) and src/messages — every
  // language's message file, and the privacy policy's own files, which §15.38
  // keeps off every other page. Not data in this sense, by design: lib/clinic
  // and lib/routes (the clinic's one record and the nav's rows, which the
  // contact dialog, the corner discs and the bar read in the browser) and
  // lib/hours (a formatter; the week it formats is lib/clinic's).
  // THE WALK (2026-10-20, the lane's typescript review): a module a client
  // module imports is bundled for the browser too, directive or not, so the
  // fence reads the CLIENT GRAPH — every 'use client' module in src and every
  // src module those reach through value namings, at any depth: 87 of the 184
  // modules, from 24 roots, three hops deep at most, on 2026-10-21. Until
  // 2026-10-20 it read the roots and the Header's own leaves alone, and 59
  // bundled modules went unread: a data import added to CardCarousel's track.ts
  // or ShareLinks' ShareFace.tsx — each bundled through its island, neither a
  // 'use client' file — passed. A module that only READS the data (the blog's
  // and Home's populators and words modules, the team's and the services'
  // populators, the reviews band, the privacy policy's messages module, the
  // Header's navSectionLinks) needs no row in DATA_MODULE: pulled into the
  // client graph, its own import of the data is the offence, reported with the
  // chain from the root that pulled it in.
  // A PATH BUILT AT RUN TIME (2026-10-21): an import() whose path is a template
  // with `${…}`, a `+` or a variable is refused anywhere in the client graph —
  // no reader can tell which module it names, and a bundler packs every file
  // the path's pattern can match. Outside the graph it is allowed:
  // src/i18n/request.ts loads each language's message file that way, on the
  // server.
  // THE LIMITS: JSON is never walked (it imports nothing); a package is never
  // walked (the walk stays in src); a Worker or `new URL(…, import.meta.url)`
  // entry is not read (src has neither).

  const sources = readSrcModules();
  const HEADER = 'components/sections/Header/';
  // The two Header files the SERVER alone runs — the two that read the data.
  const SERVER_FILES = [`${HEADER}Header.tsx`, `${HEADER}navSectionLinks.ts`];

  /** A src module's text, by its src-relative path. */
  const sourceOf = (file: string): string => {
    const source = sources.get(file);
    if (source === undefined) throw new Error(`${file}: no such module`);
    return source;
  };

  /** What the fence reads: the client graph's modules (THE WALK), sorted.
   *  The Header's directive-less leaves need no special case: the islands
   *  that import them bring them in. */
  const clients = [...clientGraph(sources).keys()].sort();

  it('lets no module of the client graph — a ‘use client’ module, or a src module one imports as a value at any depth — name a data module as a VALUE, or build an import path at run time', () => {
    expect(clientDataImports(sources)).toEqual([]);
    // Never vacuous: the whole tree is read, and the walk reaches past the
    // roots — into the Header's directive-less leaves (BurgerToggle, NavItem,
    // NavSectionEntry), the blog's islands' (CardCarousel's track.ts,
    // ShareLinks' ShareFace.tsx: the two holes the walk was built for) and,
    // THREE hops down, the reviews deck's (ReviewsDeck → ReviewCard →
    // StarRating → the Star glyph and lib/rating — the round-2 react review:
    // a walk that expanded the roots' children alone missed those two). The
    // teeth's chain of relays below is the proof that holds at any depth; these
    // are today's tree.
    expect(sources.size).toBeGreaterThan(100);
    expect(clients).toEqual(
      expect.arrayContaining([
        `${HEADER}BurgerToggle.tsx`,
        `${HEADER}HeaderNav.tsx`,
        `${HEADER}NavAccordion.tsx`,
        `${HEADER}NavDropdown.tsx`,
        `${HEADER}NavItem.tsx`,
        `${HEADER}NavMenu.tsx`,
        `${HEADER}NavSectionEntry.tsx`,
        `${HEADER}accordionTiming.ts`,
        `${HEADER}isPlainLeftClick.ts`,
        `${HEADER}useNavDropdowns.ts`,
        `${HEADER}useNavItems.ts`,
        'components/sections/CardCarousel/CardCarousel.tsx',
        'components/sections/CardCarousel/track.ts',
        'components/sections/PriceList/PriceMenu.tsx',
        'components/sections/ReviewCard/ReviewCard.tsx',
        'components/sections/ShareLinks/CopyLinkButton.tsx',
        'components/sections/ShareLinks/ShareFace.tsx',
        'components/ui/SpeedDial/SpeedDial.tsx',
        'components/ui/StarRating/StarRating.tsx',
        'assets/glyphs/Star.tsx',
        'i18n/navigation.ts',
        'lib/rating/rating.ts',
      ]),
    );
  });

  it('keeps Header.tsx and navSectionLinks.ts SERVER modules — the two that read the data', () => {
    for (const file of SERVER_FILES) {
      expect(sources.has(file), file).toBe(true);
      expect(readModule(file, sourceOf(file)).client, file).toBe(false);
      // …and no module of the client graph reaches either one.
      expect(clients, file).not.toContain(file);
    }
    // The reader reads: the links module's own value import IS found.
    expect(
      dataValueImports(SERVER_FILES[1], sourceOf(SERVER_FILES[1])),
    ).toEqual([`${SERVER_FILES[1]} → @/lib/nav-sections/nav-sections`]);
  });

  it('reads the server’s computed import — src/i18n/request.ts builds each message file’s path — and the client graph never reaches it', () => {
    const REQUEST = 'i18n/request.ts';
    expect(
      readModule(REQUEST, sourceOf(REQUEST)).uses.filter((use) => use.computed),
    ).toHaveLength(1);
    expect(clients).not.toContain(REQUEST);
  });

  it('has teeth — the fence’s own reading refuses every VALUE form and passes every type-only one', () => {
    // The module the relative spellings below resolve from.
    const file = `${HEADER}HeaderNav.tsx`;
    expect(dataValueImports(file, sourceOf(file))).toEqual([]);
    // Every value form, each refused.
    const refused: Record<string, string> = {
      'a named import': "import { doctors } from '@/lib/team/team';",
      'a mixed import':
        "import { type Doctor, doctors } from '@/lib/team/team';",
      'a side-effect import': "import '@/lib/prices/prices';",
      'a re-export':
        "export { navSections } from '@/lib/nav-sections/nav-sections';",
      'a star re-export': "export * from '@/lib/team/team';",
      'a dynamic import':
        "const team = await import('../../../lib/team/team');",
      'a dynamic import in backticks':
        'const blog = await import(`@/lib/blog/blog`);',
      'a dynamic import in backticks, its path computed':
        'const part = await import(`../../../lib/team/${name}`);',
      'a default import, relative':
        "import prices from '../../../lib/prices/prices.ts';",
      'a namespace import': "import * as prices from '@/lib/prices/prices';",
      'a barrel spelling, the folder alone':
        "import { posts } from '@/lib/blog';",
      'code after a // comment holding a block opener':
        "// read src/messages/*.json for the words\nimport { doctors } from '@/lib/team/team';\n// */",
      'the blog’s list': "import { articlePath } from '@/lib/blog/blog';",
      'the blog’s articles':
        "import { STAND_IN_ARTICLE } from '@/lib/blog-article/blog-article';",
      'the site’s origin':
        "import { siteOrigin } from '@/lib/site-origin/site-origin';",
      'the posts themselves': "import posts from '@/content/blog/posts.json';",
      'an article itself, relative':
        "import article from '../../../content/blog/articles/a.json';",
      // The forms the text reader missed (the round-2 review, 2026-10-21):
      // the second-argument and computed-path forms are bundled by Next
      // (measured, Turbopack and webpack), the rest are read as the compiler
      // reads them.
      'a dynamic import with a second argument':
        "const posts = await import('@/content/blog/posts.json', { with: { type: 'json' } });",
      'a dynamic import with an empty second argument':
        "const blog = await import('@/lib/blog/blog', {});",
      'a dynamic import, its path two literals joined':
        "const blog = await import('@/lib/blog/' + 'blog');",
      'a dynamic import, its path joined round a variable':
        "const article = await import('@/content/blog/articles/' + slug + '.json');",
      'a dynamic import, its path a template that starts outside the data':
        'const data = await import(`@/lib/${folder}/${folder}`);',
      'an import after a regular expression holding a block opener':
        "const trim = (path: string) => path.replace(/\\/*$/, '');\nexport const load = () => import('@/lib/blog/blog');\n/** the text reader hid everything from the regular expression up to here */",
      'a default import NAMED type': "import type from '@/lib/team/team';",
      'a deferred import': "import defer * as team from '@/lib/team/team';",
      'a require() call': "const team = require('@/lib/team/team');",
      'a path through a dot segment':
        "import { posts } from '@/lib/./blog/blog';",
      'a path through a doubled slash':
        "import { posts } from '@/lib//blog/blog';",
      'a path that climbs back in':
        "import { posts } from '@/components/../lib/blog/blog';",
      // The lists fenced on 2026-10-21.
      'the reviews': "import { reviews } from '@/lib/reviews/reviews';",
      'the opener’s slides':
        "import { heroSlides } from '@/lib/hero-slides/hero-slides';",
      'a message file': "import ro from '@/messages/ro.json';",
      'the privacy policy’s words, relative':
        "import de from '../../../messages/privacy/de.json';",
    };
    for (const [form, code] of Object.entries(refused)) {
      expect(dataValueImports(file, code), form).toHaveLength(1);
    }
    // Every type-only form, each allowed — the type positions too: the
    // compiler erases them (the text reader read them as values, round 2).
    const allowed = [
      "import type { NavSectionLink } from './navSectionLinks';",
      "import { type NavSectionLink, type SectionedPath } from './navSectionLinks';",
      "export type { SectionedPath } from '@/lib/nav-sections/nav-sections';",
      "export type * from '@/lib/team/team';",
      "import type * as Team from '@/lib/team/team';",
      "import { cx } from '@/lib/cx/cx';",
      "import type { BlogPost } from '@/lib/blog/blog';",
      "import { type ArticleCard } from '@/lib/blog-article/blog-article';",
      "type Posts = typeof import('@/lib/blog/blog');",
      "let post: import('@/lib/blog/blog').BlogPost;",
      // A module whose name only STARTS like a fenced one is not fenced.
      "import { roll } from '@/lib/blogroll/blogroll';",
      "import { roll } from '@/lib/blogroll';",
      "import { pages } from '@/content/blogroll/pages.json';",
      "import { inbox } from '@/messagesbox/inbox';",
      // A module that only READS the data is no row: the walk reads through
      // it (the next test), so the reader alone passes it.
      "import { navSectionLinks } from './navSectionLinks';",
      "import { populateTeamRoster } from '@/app/[locale]/team/populate';",
      // Prose is no code: a comment, a string, a template and a doc comment
      // that SPELL an import name nothing.
      "// import { doctors } from '@/lib/team/team';",
      'const example = "import \'@/lib/team/team\'";',
      "const example = `import('@/lib/team/team')`;",
      "/** @type {import('@/lib/team/team').Doctor} */\nconst doctor = null;",
    ];
    for (const code of allowed) {
      expect(dataValueImports(file, code), code).toEqual([]);
    }
  });

  it('has teeth — the walk reads what an island bundles, at any depth, prints the chain and follows no type-only naming', () => {
    /** An in-memory copy of `copy` with `line` added at the end of `file` —
     *  a new file when the copy has none. Nothing on disk changes. */
    const withLine = (
      copy: ReadonlyMap<string, string>,
      file: string,
      line: string,
    ): Map<string, string> =>
      new Map([...copy, [file, `${copy.get(file) ?? ''}\n${line}\n`]]);
    // A stand-in island and its folder, in the copies alone.
    const ISLAND = 'components/sections/Fenced/Fenced.tsx';
    const RELAY = 'components/sections/Fenced/relay.ts';
    const READER = 'components/sections/Fenced/reader.ts';
    const island = (copy: ReadonlyMap<string, string>, line: string) =>
      withLine(copy, ISLAND, `'use client';\n${line}`);

    // THE TWO HOLES the walk closes (the typescript review, 2026-10-20): a
    // directive-less module an island imports. Neither is a root, so the
    // offence is found only by walking to it — through its island.
    for (const [file, line, specifier] of [
      [
        'components/sections/CardCarousel/track.ts',
        "import { articlePath } from '@/lib/blog/blog';",
        '@/lib/blog/blog',
      ],
      [
        'components/sections/ShareLinks/ShareFace.tsx',
        "import { absoluteUrl } from '@/lib/site-origin/site-origin';",
        '@/lib/site-origin/site-origin',
      ],
    ] as const) {
      expect(readModule(file, sourceOf(file)).client, file).toBe(false);
      const offences = clientDataImports(withLine(sources, file, line));
      expect(offences, file).toHaveLength(1);
      const hops = offences[0].split(' → ');
      expect(hops.slice(-2), offences[0]).toEqual([file, specifier]);
      expect(readModule(hops[0], sourceOf(hops[0])).client, offences[0]).toBe(
        true,
      );
      // …and named as a TYPE, the same data is erased: no offence.
      for (const typeOnly of [
        line.replace('import {', 'import type {'),
        line.replace('import { ', 'import { type '),
      ]) {
        expect(
          clientDataImports(withLine(sources, file, typeOnly)),
          typeOnly,
        ).toEqual([]);
      }
    }

    // THE CHAIN PRINTED: island → relay (a re-export) → reader → the data.
    // Unreached, the two are server code and may read anything; a dynamic
    // import in backticks is followed like one in quotes; a TYPE-ONLY edge
    // reaches nothing past it.
    const deep = withLine(
      withLine(
        sources,
        READER,
        "import { doctors } from '@/lib/team/team';\nexport const count = doctors.length;",
      ),
      RELAY,
      "export { count } from './reader';",
    );
    const chain = `${ISLAND} → ${RELAY} → ${READER} → @/lib/team/team`;
    expect(clientDataImports(deep)).toEqual([]);
    expect(
      clientDataImports(island(deep, "import { count } from './relay';")),
    ).toEqual([chain]);
    expect(
      clientDataImports(island(deep, 'const relay = await import(`./relay`);')),
    ).toEqual([chain]);
    expect(
      clientDataImports(island(deep, "import type { Count } from './relay';")),
    ).toEqual([]);

    // ANY DEPTH (the round-2 react review: a walk that expanded the roots'
    // children alone passed every check above). The island → FIVE relays, each
    // re-exporting the next, the fifth through a folder's index.ts → the
    // reader → the data, seven hops: a walk that stops expanding before the
    // reader misses it, and so does one that never looks for a folder's
    // index file.
    const relay = (n: number): string =>
      `components/sections/Fenced/relay${n}.ts`;
    const INDEXED = 'components/sections/Fenced/indexed/index.ts';
    let far = withLine(deep, INDEXED, "export { count } from '../reader';");
    far = withLine(far, relay(5), "export { count } from './indexed';");
    for (let n = 4; n >= 1; n -= 1) {
      far = withLine(far, relay(n), `export { count } from './relay${n + 1}';`);
    }
    expect(clientDataImports(far)).toEqual([]);
    expect(
      clientDataImports(island(far, "import { count } from './relay1';")),
    ).toEqual([
      [
        ISLAND,
        relay(1),
        relay(2),
        relay(3),
        relay(4),
        relay(5),
        INDEXED,
        READER,
        '@/lib/team/team',
      ].join(' → '),
    ]);

    // …and today's tree, three hops down: lib/rating reaches the browser only
    // through ReviewsDeck → ReviewCard → StarRating. Data planted there is
    // reported, from a 'use client' root (the round-2 react review's witness).
    const RATING = 'lib/rating/rating.ts';
    const planted = clientDataImports(
      withLine(sources, RATING, "import { doctors } from '../team/team';"),
    );
    expect(planted).toHaveLength(1);
    expect(planted[0].endsWith(`${RATING} → ../team/team`), planted[0]).toBe(
      true,
    );
    const root = planted[0].split(' → ')[0];
    expect(readModule(root, sourceOf(root)).client, planted[0]).toBe(true);

    // A PATH BUILT AT RUN TIME, in a directive-less module an island imports:
    // refused where it stands, with its chain — nothing can read which module
    // it bundles. Outside the client graph it is no offence.
    const building = withLine(
      sources,
      RELAY,
      'export const load = (folder: string) => import(`@/lib/${folder}/${folder}`);',
    );
    expect(clientDataImports(building)).toEqual([]);
    expect(
      clientDataImports(island(building, "import { load } from './relay';")),
    ).toEqual([
      `${ISLAND} → ${RELAY} → ` + '`@/lib/${folder}/${folder}`' + COMPUTED,
    ]);

    // The Header's own mistake (§15.40): HeaderNav naming the links module as
    // VALUES. The links module is no row; its import of the data is.
    const nav = `${HEADER}HeaderNav.tsx`;
    const navSource = sourceOf(nav);
    const valueLinks = navSource.replace(
      "import type { NavSectionsByPath, SectionedPath } from './navSectionLinks';",
      "import { NavSectionsByPath, SectionedPath } from './navSectionLinks';",
    );
    expect(valueLinks).not.toBe(navSource);
    expect(clientDataImports(new Map([...sources, [nav, valueLinks]]))).toEqual(
      [`${nav} → ${SERVER_FILES[1]} → @/lib/nav-sections/nav-sections`],
    );

    // The two route modules no hand-kept row ever listed: pulled into the
    // client graph, each is caught at its own import of the data.
    for (const [route, data] of [
      ['app/[locale]/team/populate', '@/lib/team/team'],
      ['app/[locale]/services/populate', '@/lib/prices/prices'],
    ] as const) {
      expect(
        clientDataImports(
          island(sources, `import * as route from '@/${route}';`),
        ),
      ).toEqual([`${ISLAND} → ${route}.ts → ${data}`]);
    }

    // The readers of the lists fenced on 2026-10-21, pulled in the same way:
    // the reviews band, Home's populator and the privacy policy's messages
    // module, each caught at its own import of its list.
    const pulled = (module: string): string[] =>
      clientDataImports(
        island(sources, `import * as pulled from '@/${module}';`),
      );
    const REVIEWS = 'components/sections/ReviewsCarousel/ReviewsCarousel';
    expect(pulled(REVIEWS)).toContain(
      `${ISLAND} → ${REVIEWS}.tsx → @/lib/reviews/reviews`,
    );
    const HOME = 'app/[locale]/(home)/populate';
    expect(pulled(HOME)).toContain(
      `${ISLAND} → ${HOME}.ts → @/lib/hero-slides/hero-slides`,
    );
    const PRIVACY = 'components/sections/PrivacyPolicy/messages';
    expect([...pulled(PRIVACY)].sort()).toEqual(
      ['de', 'en', 'fr', 'it', 'ro'].map(
        (language) =>
          `${ISLAND} → ${PRIVACY}.ts → @/messages/privacy/${language}.json`,
      ),
    );
  });
});
