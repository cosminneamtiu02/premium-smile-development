import { describe, expect, it } from 'vitest';
import blogTwin from './blog/Blog.stories.tsx?raw';
import blogArticleTwin from './blog/[slug]/Article.stories.tsx?raw';
import blogArticlePage from './blog/[slug]/page.tsx?raw';
import blogArticlePopulate from './blog/[slug]/populate.ts?raw';
import blogArticleWords from './blog/[slug]/words.ts?raw';
import blogNumberedPage from './blog/page/[page]/page.tsx?raw';
import blogPage from './blog/page.tsx?raw';
import blogPopulate from './blog/populate.ts?raw';
import blogWords from './blog/words.ts?raw';
import homeTwin from './(home)/Home.stories.tsx?raw';
import homePage from './(home)/page.tsx?raw';
import doctorTwin from './team/[slug]/Doctor.stories.tsx?raw';
import doctorPage from './team/[slug]/page.tsx?raw';
import privacyTwin from './privacy/Privacy.stories.tsx?raw';
import privacyPage from './privacy/page.tsx?raw';
import teamTwin from './team/Team.stories.tsx?raw';
import teamPage from './team/page.tsx?raw';
import ro from '../../messages/ro.json';

// THE PAGES AND THEIR STORY TWINS, held together by their SOURCE (G2 react,
// 2026-09-30). A page under app/[locale]/ is an async Server Component — it
// awaits next-intl/server — so no browser runner can render it, and each page
// keeps a KEEP-IN-SYNC twin beside it (Team.stories.tsx, Home.stories.tsx,
// [slug]/Doctor.stories.tsx) that re-spells its JSX through the isomorphic
// hooks. The twins' plays pin the TWIN. Nothing pinned the PAGE: delete
// `firstScreen` from the Team page — its first-screen picture goes lazy — and
// tsc, eslint, every Vitest project and both builds stayed green, and the pixel
// net cannot see a prop that moves no pixel. (tests/e2e/doctor-showcase.spec.ts
// does read the built pages, but the e2e suite runs in no workflow and no hook.)
//
// So this file reads the pages and their twins — every source imported by
// name above (the blog's list and, since 2026-10-14, its article among them),
// and since 2026-10-13 every .tsx under this folder through one glob — and
// compares what a drift would change:
//   · THE BANDS, IN ORDER — the elements each page returns, and its twin's;
//   · THE DOCTORS BAND'S PROPS — by NAME: the Team page says `firstScreen`
//     (the band opens its first screen — DoctorShowcase D9), Home does not
//     (the band sits below the Hero and the numbers); and since 2026-10-15
//     the Team page opens the band with its PAGE opener, `hero` (D12 — the
//     blog list's centred hero, sections/PageHero, the page's one <h1>),
//     where Home keeps the band opener's `eyebrow` and `title` — and each
//     twin says what its page says;
//   · THE NUMBERS BAND'S PROPS (sections/DoctorStats, since 2026-10-01) — by
//     NAME too, on all three pages that carry it: Home and the Team page
//     say `ground` and `align` and no `lead` (the owner: "without that
//     gradient lilla background", "left alligned", "so dorp that part"), the
//     doctor page says `lead` and neither setting — its tint and its centre
//     are the band's defaults — and each twin says what its page says. Here
//     a drift DOES move pixels, just not where the net looks: a page that
//     lost `ground="page"` would ship the band lilac again, while the pixel
//     net photographs the TWIN, which would still say it;
//   · THE BAND SCALE (2026-10-02, CLAUDE.md §15.32) — `scaled` on the numbers
//     band and on the map, by NAME: Home and the Team page say it on both
//     (every band on both pages draws in ui/Container's THE BAND SCALE, one
//     heading size and one offset), and so does the doctor page since
//     2026-10-13 — first on the MAP alone (round 3 — the owner: "as the
//     current map on home page is now, i need it updated reactivity wise on
//     absoultey every page"), then on the numbers band too, the same day, when
//     the whole page joined the scale (round 4 — "make the exact same thing
//     with the heading and eyebrow from the individual dr page", "Whole page,
//     like Home") — and each twin says what its page says. A page that lost the word would ship one
//     band out of step with its neighbours on every laptop — in pixels the net
//     does see, but only on the TWIN, which would still say it;
//   · THE MAP ON EVERY PAGE (round 3) — every file under this folder that
//     imports the map, found by a glob, mounts it once, `scaled`, bare, with
//     nothing else in the tag, so a page added here later cannot draw a
//     second kind of map;
//   · THE STAFF BAND'S PROPS (since 2026-10-02): the Team page hands
//     sections/TeamRoster its eyebrow and its title, and its twin the same;
//   · THE BLOG'S LIST PAGES (CLAUDE.md §15.39): both route pages render the
//     populated list, then the map, in the ROUTE's language — the band, its
//     words and the tab's title alike — no source of theirs names a language
//     of its own, and the one-page fallback stays out of search on every
//     build; the twin mounts the same two bands through the same populator;
//   · THE BLOG'S ARTICLE PAGE (CLAUDE.md §15.39 round 4): the route page and
//     its twin mount the same ONE band — sections/PostPage, through the same
//     populator and the same words mapping — and no map after it since
//     2026-10-15 (the owner: "drop the map"), in the ROUTE's language, read
//     once off its [locale] segment; the page is generated in EVERY language,
//     like the list above (since 2026-10-15: every article is written in all
//     five), and no source of the route names a language of its own.
// Only names are compared, never values: a page reads `getTranslations`, its
// twin `useTranslations`. And only the doctors band's and the numbers band's
// props are held equal — a twin may pin a band for the workbench (a clock, a
// viewport) with a prop its page does not pass. The map is the exception:
// since round 3 the census holds every page AND twin to `scaled` alone.
//
// It runs in the `components` project (src/**/*.test.{ts,tsx}); nothing is
// rendered — the mechanism of team/stat-tiles.test.tsx's "THE ONE COPY",
// which reads every page and twin that draws tiles the same way.

/**
 * Block and line comments out, code and strings kept — so a band named in a
 * comment is never counted.
 *
 * A SCANNER, not the two regular expressions the other suites share: a page's
 * header writes paths like `src/messages/*.json` inside a LINE comment, and a
 * block-comment pattern run first reads that `/*` as an opening and swallows
 * the file down to the next JSX comment — `function TeamPage(` included (it
 * did, on this file's first run). Read in order, a `//` ends at its line, a
 * block at its close, and neither is looked for inside a string.
 */
const stripComments = (code: string): string => {
  let kept = '';
  let quote: string | null = null;
  let i = 0;
  while (i < code.length) {
    const char = code[i];
    const pair = code.slice(i, i + 2);
    if (quote !== null) {
      if (char === '\\') {
        kept += pair;
        i += 2;
        continue;
      }
      if (char === quote) quote = null;
      kept += char;
      i += 1;
    } else if (pair === '//') {
      const end = code.indexOf('\n', i);
      i = end < 0 ? code.length : end;
    } else if (pair === '/*') {
      const end = code.indexOf('*/', i + 2);
      i = end < 0 ? code.length : end + 2;
    } else {
      if (char === '"' || char === "'" || char === '`') quote = char;
      kept += char;
      i += 1;
    }
  }
  return kept;
};

/** The JSX a named function returns: from its first `return (` to that
 *  statement's close. Throws by name when the file changed shape, so a
 *  renamed twin fails HERE and not as an empty comparison. */
const returned = (source: string, functionName: string): string => {
  const code = stripComments(source);
  const start = code.indexOf(`function ${functionName}(`);
  if (start < 0) throw new Error(`no function ${functionName}`);
  const open = code.indexOf('return (', start);
  const close = code.indexOf('\n  );', open);
  if (open < 0 || close < 0) {
    throw new Error(`${functionName} returns no parenthesised JSX`);
  }
  return code.slice(open, close);
};

/** Every element the block opens, in order — `h1`, `Hero`, … (a closing tag
 *  and the fragment's `<>` are not openings of a named element). */
const bandsOf = (jsx: string): string[] =>
  Array.from(jsx.matchAll(/<([A-Za-z][A-Za-z0-9]*)/g), (match) => match[1]);

/** One self-closing element's attribute source — everything between
 *  `<Element` and its `/>` — the slice every reader below takes (the verify
 *  review, 2026-10-16: an assertion on the whole block would let ANOTHER
 *  element's attribute stand in for this one's). Throws by name when the
 *  element is missing, so a renamed band fails HERE and not as an empty
 *  comparison. */
const tagOf = (jsx: string, element: string): string => {
  const start = jsx.indexOf(`<${element}`);
  const end = jsx.indexOf('/>', start);
  if (start < 0 || end < 0) throw new Error(`no self-closing <${element}>`);
  return jsx.slice(start + element.length + 1, end);
};

/** The prop NAMES one element is given, sorted. */
const propsOf = (jsx: string, element: string): string[] =>
  tagOf(jsx, element)
    .replace(/=\{[^{}]*\}/g, '')
    .replace(/="[^"]*"/g, '')
    .split(/\s+/)
    .filter((name) => /^[A-Za-z][\w-]*$/.test(name))
    .toSorted();

/**
 * The STRING-LITERAL attributes one element is given, exactly as written —
 * `ground="page"` — sorted (TS review L6, 2026-10-01). Names alone cannot see
 * a value move: Home drifting back to `align="center"` while the Team page
 * stays at the start keeps every name in place. Only `name="…"` literals are
 * read, never an expression's inside: a page and its twin spell those
 * through different hooks, and the names test above already holds them.
 */
const literalsOf = (jsx: string, element: string): string[] =>
  Array.from(
    tagOf(jsx, element).matchAll(/(?<![\w-])[A-Za-z][\w-]*="[^"]*"/g),
    (match) => match[0],
  ).toSorted();

/**
 * The BARE boolean attributes one element is given — written with no `=` at
 * all, `scaled` — sorted (the Opus review, 2026-10-02). `propsOf` strips every
 * value, so `scaled={false}` reads as `scaled` there and would pass while the
 * page ships an unscaled band; this reader sees only the bare spelling.
 */
const flagsOf = (jsx: string, element: string): string[] =>
  tagOf(jsx, element)
    .replace(/=\{[^{}]*\}/g, '=VALUE')
    .replace(/="[^"]*"/g, '=VALUE')
    .split(/\s+/)
    .filter((name) => /^[A-Za-z][\w-]*$/.test(name))
    .toSorted();

/** The numbers band's two settings as Home and the Team page write them. */
const PAGE_GROUND_AT_THE_START = ['align="start"', 'ground="page"'];

const TEAM = {
  page: returned(teamPage, 'TeamPage'),
  twin: returned(teamTwin, 'TeamPageBands'),
};
const HOME = {
  page: returned(homePage, 'HomePage'),
  twin: returned(homeTwin, 'HomePageBand'),
};
const DOCTOR = {
  page: returned(doctorPage, 'DoctorPage'),
  twin: returned(doctorTwin, 'DoctorPageBands'),
};

/** The blog list's ROUTE sources — its two pages and the two modules they
 *  share (CLAUDE.md §15.39); the story twin is read on its own. */
const BLOG_ROUTE_SOURCES = [
  ['page.tsx', blogPage],
  ['page/[page]/page.tsx', blogNumberedPage],
  ['populate.ts', blogPopulate],
  ['words.ts', blogWords],
] as const;

/** The blog article's ROUTE sources — its page and the two modules it reads
 *  (CLAUDE.md §15.39 round 4); the story twin is read on its own. */
const BLOG_ARTICLE_ROUTE_SOURCES = [
  ['[slug]/page.tsx', blogArticlePage],
  ['[slug]/populate.ts', blogArticlePopulate],
  ['[slug]/words.ts', blogArticleWords],
] as const;

/** A locale code in quotes — single, double or backtick, the same on both
 *  sides: what a source that pinned a language would have to spell. */
const QUOTED_LOCALE = /(['"`])(?:ro|en|de|fr|it)\1/;

/**
 * The numbers band's props as Home and the Team page pass them (owner,
 * 2026-10-01): the page ground and the start — and no `lead`, which is the
 * absence the owner asked for ("so dorp that part") — and, since 2026-10-02,
 * `scaled`: one scale with every band on those two pages (§15.32).
 */
const CLINIC_NUMBERS = [
  'align',
  'atLeast',
  'eyebrow',
  'format',
  'ground',
  'scaled',
  'tiles',
  'title',
];

describe('the Team page and its story twin — read off their source', () => {
  it('returns the same bands in the same order: doctors (the hero’s <h1> inside) → staff → numbers → map', () => {
    // No <h1> of the page's own since 2026-10-15: the doctors band's page
    // opener holds it (D12); until then an `sr-only` one opened this list.
    expect(bandsOf(TEAM.page)).toEqual([
      'DoctorShowcase',
      'TeamRoster',
      'DoctorStats',
      'ClinicLocation',
    ]);
    expect(bandsOf(TEAM.twin)).toEqual(bandsOf(TEAM.page));
  });

  it('gives the numbers band the page ground and the start, and NO lead — page and twin alike (owner, 2026-10-01)', () => {
    expect(propsOf(TEAM.page, 'DoctorStats')).toEqual(CLINIC_NUMBERS);
    expect(propsOf(TEAM.twin, 'DoctorStats')).toEqual(
      propsOf(TEAM.page, 'DoctorStats'),
    );
  });

  it('writes those two settings as VALUES — `ground="page"`, `align="start"` — page and twin alike (TS review L6)', () => {
    expect(literalsOf(TEAM.page, 'DoctorStats')).toEqual(
      PAGE_GROUND_AT_THE_START,
    );
    expect(literalsOf(TEAM.twin, 'DoctorStats')).toEqual(
      PAGE_GROUND_AT_THE_START,
    );
  });

  it('tells the doctors band it opens the FIRST SCREEN — page and twin alike (D9)', () => {
    // The band then preloads its first picture, on this page's first screen
    // at every width (its largest paint at a 768 tablet; the hero's <h1> is
    // elsewhere since 2026-10-15 — DoctorShowcase D9). Losing the prop breaks
    // nothing visible: this line is what notices.
    expect(propsOf(TEAM.page, 'DoctorShowcase')).toEqual([
      'doctors',
      'firstScreen',
      'hero',
    ]);
    expect(propsOf(TEAM.twin, 'DoctorShowcase')).toEqual(
      propsOf(TEAM.page, 'DoctorShowcase'),
    );
  });

  it('opens the doctors band with its PAGE opener — `hero`, the words `team.hero.title` and `team.hero.lead` — and never the band opener’s eyebrow and title, page and twin alike (2026-10-15, D12)', () => {
    // The owner: "implement something similar instead of \"FAMILIA PREMIUM
    // SMILE / Specialiștii cu care ne mândrim\" on the echipa page" — "this
    // must take place only on the echipa page". Home's band keeps its eyebrow
    // and title (its own case below).
    for (const [name, source] of [
      ['page', teamPage],
      ['twin', teamTwin],
    ] as const) {
      // The object may be written on one line or across several (prettier
      // keeps either), its last property with or without a comma.
      expect(stripComments(source), name).toMatch(
        /const hero = \{\s*title: t\('hero\.title'\),\s*lead: t\('hero\.lead'\),?\s*\};/,
      );
    }
    for (const jsx of [TEAM.page, TEAM.twin]) {
      // …and THAT `hero` is the one the band gets: `propsOf` reads names
      // alone, so another object under the same name would pass it (the TS
      // review, 2026-10-15) — read on the band's own tag, so another
      // element's `hero={hero}` cannot stand in for it (the verify review,
      // 2026-10-16).
      expect(tagOf(jsx, 'DoctorShowcase')).toMatch(/\bhero=\{hero\}/);
      expect(propsOf(jsx, 'DoctorShowcase')).not.toContain('eyebrow');
      expect(propsOf(jsx, 'DoctorShowcase')).not.toContain('title');
    }
    // …and both keys exist: next-intl would only log a miss and print the
    // key path as the page's <h1>. The other four files are held to the same
    // keys by tests/unit/translation-parity.test.ts.
    expect(typeof ro.team.hero.title).toBe('string');
    expect(typeof ro.team.hero.lead).toBe('string');
  });

  it('titles the staff band — its eyebrow, its title and its members — page and twin alike (owner, 2026-10-02)', () => {
    expect(propsOf(TEAM.page, 'TeamRoster')).toEqual([
      'eyebrow',
      'members',
      'title',
    ]);
    expect(propsOf(TEAM.twin, 'TeamRoster')).toEqual(
      propsOf(TEAM.page, 'TeamRoster'),
    );
  });

  it('draws the map in the band scale — `scaled` and nothing else, page and twin alike (§15.32)', () => {
    expect(propsOf(TEAM.page, 'ClinicLocation')).toEqual(['scaled']);
    expect(propsOf(TEAM.twin, 'ClinicLocation')).toEqual(
      propsOf(TEAM.page, 'ClinicLocation'),
    );
  });

  it('writes `scaled` BARE on the numbers band and the map — never `scaled={…}` — page and twin alike (§15.32)', () => {
    for (const jsx of [TEAM.page, TEAM.twin]) {
      expect(flagsOf(jsx, 'ClinicLocation')).toEqual(['scaled']);
      expect(flagsOf(jsx, 'DoctorStats')).toContain('scaled');
      expect(jsx).not.toMatch(/\bscaled=/);
    }
  });
});

describe('the Home page and its story twin — read off their source', () => {
  it('returns the same bands in the same order: h1 → hero → numbers → articles → doctors → map → reviews', () => {
    // The numbers BEFORE the doctors — the owner's order since 2026-10-01
    // ("i need to swap these 2 sections between them … so first in cifre and
    // then doctors"); Home's alone, the Team page's order above is untouched.
    // The articles band between them since 2026-10-17 (the owner: "place it
    // below th in numbers category and above "Specialiștii cu care ne
    // mândrim"").
    expect(bandsOf(HOME.page)).toEqual([
      'h1',
      'Hero',
      'DoctorStats',
      'BlogCarousel',
      'DoctorShowcase',
      'ClinicLocation',
      'ReviewsCarousel',
    ]);
    expect(bandsOf(HOME.twin)).toEqual(bandsOf(HOME.page));
  });

  it('gives the numbers band the page ground and the start, and NO lead — page and twin alike (owner, 2026-10-01)', () => {
    expect(propsOf(HOME.page, 'DoctorStats')).toEqual(CLINIC_NUMBERS);
    expect(propsOf(HOME.twin, 'DoctorStats')).toEqual(
      propsOf(HOME.page, 'DoctorStats'),
    );
  });

  it('writes those two settings as VALUES — `ground="page"`, `align="start"` — page and twin alike (TS review L6)', () => {
    // The Team page says the same two literals (its own case above): the
    // band reads the same wherever the clinic's numbers stand.
    expect(literalsOf(HOME.page, 'DoctorStats')).toEqual(
      PAGE_GROUND_AT_THE_START,
    );
    expect(literalsOf(HOME.twin, 'DoctorStats')).toEqual(
      PAGE_GROUND_AT_THE_START,
    );
  });

  it('leaves the doctors band LAZY below the hero and the numbers — no `firstScreen`, page and twin alike (D9)', () => {
    // Home's largest paint is the hero's photograph; a preloaded cutout
    // screens further down would only compete with it.
    expect(propsOf(HOME.page, 'DoctorShowcase')).toEqual([
      'doctors',
      'eyebrow',
      'title',
    ]);
    expect(propsOf(HOME.twin, 'DoctorShowcase')).toEqual(
      propsOf(HOME.page, 'DoctorShowcase'),
    );
  });

  it('draws the map in the band scale — `scaled` and nothing else, page and twin alike (§15.32)', () => {
    expect(propsOf(HOME.page, 'ClinicLocation')).toEqual(['scaled']);
    expect(propsOf(HOME.twin, 'ClinicLocation')).toEqual(
      propsOf(HOME.page, 'ClinicLocation'),
    );
  });

  it('writes `scaled` BARE on the numbers band and the map — never `scaled={…}` — page and twin alike (§15.32)', () => {
    for (const jsx of [HOME.page, HOME.twin]) {
      expect(flagsOf(jsx, 'ClinicLocation')).toEqual(['scaled']);
      expect(flagsOf(jsx, 'DoctorStats')).toContain('scaled');
      expect(jsx).not.toMatch(/\bscaled=/);
    }
  });
});

describe('a doctor’s page and its story twin — read off their source', () => {
  it('returns the same bands in the same order: opener → numbers → profile → map', () => {
    // The owner's order since 2026-10-13 (CLAUDE.md §15.23 round 7): "hero
    // section, then Experience confirmed over time and below on the left
    // biography and on the right the thing with the "Courses and
    // specialisations"". The courses are no band of their own any more:
    // sections/DoctorProfile composes sections/DoctorCourses beside the
    // biography, so the page mounts four bands, the courses inside the third.
    expect(bandsOf(DOCTOR.page)).toEqual([
      'DoctorIntro',
      'DoctorStats',
      'DoctorProfile',
      'ClinicLocation',
    ]);
    expect(bandsOf(DOCTOR.twin)).toEqual(bandsOf(DOCTOR.page));
  });

  it('keeps the numbers band on its DEFAULTS — the tint, the centre, its lead — and in the band scale, page and twin alike (§6.6, §15.32 round 4)', () => {
    // The second page's two settings stay off this one: the doctor page's
    // call did not change by a character when Home's band arrived, and a
    // `ground` or an `align` written here would be a change it never asked for.
    // `scaled` joined on 2026-10-13 — the whole page in the band scale.
    expect(propsOf(DOCTOR.page, 'DoctorStats')).toEqual([
      'atLeast',
      'eyebrow',
      'format',
      'lead',
      'scaled',
      'tiles',
      'title',
    ]);
    expect(propsOf(DOCTOR.twin, 'DoctorStats')).toEqual(
      propsOf(DOCTOR.page, 'DoctorStats'),
    );
  });

  it('writes NO setting there as a value either — neither `ground` nor `align`, the tint and the centre are the defaults — and DOES pass a lead, page and twin alike', () => {
    for (const jsx of [DOCTOR.page, DOCTOR.twin]) {
      expect(literalsOf(jsx, 'DoctorStats')).toEqual([]);
      expect(propsOf(jsx, 'DoctorStats')).toContain('lead');
      expect(propsOf(jsx, 'DoctorStats')).not.toContain('ground');
      expect(propsOf(jsx, 'DoctorStats')).not.toContain('align');
    }
  });

  it('draws the map in the band scale — `scaled`, BARE, and nothing else, page and twin alike (§15.32 round 3: the map Home and Team draw)', () => {
    for (const jsx of [DOCTOR.page, DOCTOR.twin]) {
      expect(propsOf(jsx, 'ClinicLocation')).toEqual(['scaled']);
      expect(flagsOf(jsx, 'ClinicLocation')).toEqual(['scaled']);
      expect(jsx).not.toMatch(/\bscaled=/);
    }
  });

  it('draws the numbers band in the band scale — `scaled`, BARE — page and twin alike (§15.32 round 4: the whole page, like Home)', () => {
    // Since 2026-10-13 every band of this page draws in ui/Container's band
    // scale: the three that live only here wear it themselves (their own
    // suites and tests/unit/design-scale.test.ts's census hold them), the two
    // shared with Home and Team take the word from here. `flagsOf` sees only
    // the bare spelling, so `scaled={false}` cannot pass for it.
    for (const jsx of [DOCTOR.page, DOCTOR.twin]) {
      expect(flagsOf(jsx, 'DoctorStats')).toContain('scaled');
      expect(jsx).not.toMatch(/\bscaled=/);
    }
  });
});

/**
 * Every .tsx under app/[locale]/ but the tests — pages, the layout, twins and
 * helpers alike — as SOURCE: the census for THE MAP ON EVERY PAGE (§15.32
 * round 3). `import.meta.glob` is a build-time Vite transform
 * (src/assets/flags/Flags.test.tsx's precedent), so a file added later is in
 * this record without an edit here. Typed by Next's own declaration
 * (next/types/global.d.ts), whose eager form answers `unknown` per file: each
 * is checked to be text where it is read.
 */
const LOCALE_SOURCES = import.meta.glob(['./**/*.tsx', '!./**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The map band's module, as every importer under app/[locale]/ spells it. */
const MAP_MODULE = '@/components/sections/ClinicLocation/ClinicLocation';

/**
 * The name a file imports the map band under — `ClinicLocation`, or the alias
 * of `ClinicLocation as …` — or null when it does not import it by name. A file
 * is chosen by WHAT IT IMPORTS, never by a match in its JSX (the TypeScript
 * review, 2026-10-13): a mount the comment scanner swallowed — it reads a `//`
 * inside JSX text as a comment — then fails the one-mount check below instead
 * of hiding its file from the census. A namespace or default import is not
 * read; nothing in this folder imports the band that way.
 */
const mapNameIn = (code: string): string | null => {
  const specifiers = new RegExp(
    String.raw`import\s*\{([^}]*)\}\s*from\s*['"]${MAP_MODULE}['"]`,
  ).exec(code)?.[1];
  if (specifiers === undefined) return null;
  const binding =
    /(?:^|,)\s*ClinicLocation(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*(?=,|$)/.exec(
      specifiers.trim(),
    );
  return binding === null ? null : (binding[1] ?? 'ClinicLocation');
};

/**
 * Every JSX mount of `name` in `code`, each as the text from its `<` to the
 * file's end — the shape `propsOf` and `flagsOf` read (from the FIRST `<name`
 * to the next `/>`), so each mount is read on its own (the React and
 * TypeScript reviews: the first cut read only the first). `(?![\w$.])` keeps a
 * longer name out — `<ClinicLocationProps>` as a type argument.
 */
const mountsOf = (code: string, name: string): string[] =>
  Array.from(
    code.matchAll(
      new RegExp(String.raw`<${name.replaceAll('$', '\\$')}(?![\w$.])`, 'g'),
    ),
    (match) => code.slice(match.index),
  );

describe('THE MAP ON EVERY PAGE — one band, one scale, wherever app/[locale]/ mounts it (§15.32 round 3)', () => {
  // The owner, 2026-10-13: "as the current map on home page is now, i need it
  // updated reactivity wise on absoultey every page … with this i am refering
  // to individual doctor page". The doctor page had been left out of THE BAND
  // SCALE by a flag it did not pass, so the guard is on the flag, in every
  // file under app/[locale]/ that imports the band: ONE mount each, `scaled`,
  // bare, and nothing else in the tag — no other prop, and no spread that
  // could carry a `scaled={false}` past the names. A page added later that
  // forgets the flag fails here, by its path. Outside this folder it does not
  // look: the band's own stories (sections/ClinicLocation) draw its unscaled
  // default for the workbench, and a section that composed the band (§4
  // allows it; none does today) would need a guard of its own.
  const importers = Object.entries(LOCALE_SOURCES).flatMap(([path, source]) => {
    if (typeof source !== 'string') {
      throw new Error(`${path} did not load as text`);
    }
    const code = stripComments(source);
    const name = mapNameIn(code);
    return name === null ? [] : [{ path, code, name }];
  });

  it('finds every file that imports the map — Home, the Team page, the doctor page and the blog’s list pages, each with its twin (a blog article ends on its own last word since 2026-10-15: "drop the map")', () => {
    expect(importers.map(({ path }) => path).toSorted()).toEqual([
      './(home)/Home.stories.tsx',
      './(home)/page.tsx',
      './blog/Blog.stories.tsx',
      './blog/page.tsx',
      './blog/page/[page]/page.tsx',
      './team/Team.stories.tsx',
      './team/[slug]/Doctor.stories.tsx',
      './team/[slug]/page.tsx',
      './team/page.tsx',
    ]);
  });

  it('mounts the map ONCE in each — `scaled`, bare, nothing else, no spread', () => {
    // Never vacuous, even run alone (`-t`): the census holds its nine files.
    expect(importers).toHaveLength(9);
    for (const { path, code, name } of importers) {
      const mounts = mountsOf(code, name);
      expect(mounts, `${path}: one <${name}>`).toHaveLength(1);
      for (const mount of mounts) {
        expect(propsOf(mount, name), path).toEqual(['scaled']);
        expect(flagsOf(mount, name), path).toEqual(['scaled']);
        expect(
          mount.slice(0, mount.indexOf('/>')),
          `${path}: a spread`,
        ).not.toContain('{...');
      }
    }
  });
});

describe('the privacy page and its story twin — read off their source', () => {
  // The page is ONE band with no props (sections/PrivacyPolicy translates
  // itself and reads lib/clinic), so its whole render is one line — too
  // short for `returned`, which reads a parenthesised block. What a drift
  // would change is the band itself: the page must return it bare, and the
  // twin must mount the very same component (CLAUDE.md §15.38).
  it('the page returns sections/PrivacyPolicy alone, with no props', () => {
    expect(stripComments(privacyPage)).toMatch(
      /export default function PrivacyPage\(\) \{\s*return <PrivacyPolicy \/>;\s*\}/,
    );
  });

  it('the twin mounts that same component', () => {
    expect(stripComments(privacyTwin)).toMatch(/component: PrivacyPolicy,/);
  });
});

describe('the blog’s list pages and their story twin — read off their source', () => {
  // Both route pages render TWO bands since round 2 — sections/PostList from
  // the SAME pure populator, in the route's language read once by
  // ./blog/words.ts' `blogLocale`, with words built by ./blog/populate.ts'
  // `blogWordsFrom` from getTranslations' translator in that language, then
  // the map, `scaled` (THE MAP ON EVERY PAGE above holds its one mount); the
  // twin mounts the same two through the same populator and the same
  // `blogWordsFrom`, with useLocale's language and useTranslations' translator
  // (CLAUDE.md §15.39). A drift would show as a page rendering something else,
  // or as either side building its words another way — then the twin's plays
  // would no longer cover the pages. And since round 3 (2026-10-14) the blog
  // is written in EVERY language: no source here may name a language of its
  // own, and the pages are generated for each one the [locale] layout makes.
  it('page 1 and the numbered pages return the populated PostList in the route’s language, then the map, and nothing else (rounds 2 and 3)', () => {
    expect(stripComments(blogPage)).toMatch(
      /const locale = await blogLocale\(\);\s*return \(\s*<>\s*<PostList \{\.\.\.populateBlogPage\(locale, 1, await blogPageWords\(locale\)\)\} \/>\s*<ClinicLocation scaled \/>\s*<\/>\s*\);/,
    );
    expect(stripComments(blogNumberedPage)).toMatch(
      /const locale = await blogLocale\(\);\s*return \(\s*<>\s*<PostList\s+\{\.\.\.populateBlogPage\(\s*locale,\s*parsePageParam\(page\),\s*await blogPageWords\(locale\),?\s*\)\}\s+\/>\s*<ClinicLocation scaled \/>\s*<\/>\s*\);/,
    );
  });

  it('generates the pages in every language — page 1 inherits the layout’s locales, the numbered pages name the page alone (round 3)', () => {
    // Page 1 declares no `generateStaticParams`: the [locale] layout's five
    // languages are its pages, as for the services, team and privacy pages.
    expect(stripComments(blogPage)).not.toMatch(/generateStaticParams/);
    // The numbered pages return the PAGE alone; Next merges it with each of
    // the layout's languages (the doctor pages' precedent). A `locale` key
    // here would cut the export back to one language.
    expect(stripComments(blogNumberedPage)).toMatch(
      /export function generateStaticParams\(\) \{\s*return numberedPages\(\)\.map\(\(page\) => \(\{ page: String\(page\) \}\)\);\s*\}/,
    );
    // No route source pins a language: not a retired constant, and no
    // locale code in quotes ANYWHERE in its code — a `locale: 'ro'` key, a
    // `getTranslations({ locale: 'de' … })`, a `lang="ro"`, a comparison with
    // `'ro'` alike (comments stripped; the twin names its two story
    // languages and is not read here).
    for (const [name, source] of BLOG_ROUTE_SOURCES) {
      const code = stripComments(source);
      expect(code, name).not.toMatch(QUOTED_LOCALE);
      expect(code, name).not.toMatch(/BLOG_LOCALE/);
    }
    // The language is the ROUTE's: read back from next-intl, then narrowed.
    expect(stripComments(blogWords)).toMatch(
      /const locale = await getLocale\(\);\s*if \(!isLocale\(locale\)\)/,
    );
  });

  it('titles each tab in the ROUTE’s language, and keeps the one-page fallback out of search on every build (round 3)', () => {
    // A metadata function takes the locale off its `params` — the route's
    // [locale] segment — and hands it to ./blog/words.ts' `blogPageTitle`,
    // whose two translators read that language and no other.
    expect(stripComments(blogPage)).toMatch(
      /export async function generateMetadata\(\{ params \}: Props\): Promise<Metadata> \{\s*const \{ locale \} = await params;\s*return \{ title: await blogPageTitle\(locale, 1\) \};\s*\}/,
    );
    // The numbered pages likewise — and /{locale}/blog/page/1/, which repeats
    // page 1 for a blog of six posts or fewer, says BOTH halves of its
    // robots: Next replaces the layout's whole value rather than merging it,
    // so `index: false` alone would leave a NOINDEX build's fallback open to
    // being followed where its shell is not.
    expect(stripComments(blogNumberedPage)).toMatch(
      /export async function generateMetadata\(\{ params \}: Props\): Promise<Metadata> \{\s*const \{ locale, page \} = await params;\s*const n = parsePageParam\(page\);\s*return \{\s*title: await blogPageTitle\(locale, n\),\s*\.\.\.\(n === 1 \? \{ robots: \{ index: false, follow: false \} \} : \{\}\),?\s*\};\s*\}/,
    );
    expect(stripComments(blogWords)).toMatch(
      /export async function blogPageTitle\(\s*locale: string,\s*page: number,?\s*\): Promise<string> \{\s*const t = await getTranslations\(\{ locale, namespace: 'blog' \}\);\s*const common = await getTranslations\(\{ locale, namespace: 'common' \}\);/,
    );
  });

  it('every key the list pages read exists — the tab title included (next-intl only logs a miss)', () => {
    // A typo in a key would ship as its own path („blog.pageTitle — …") with
    // the build green: next-intl logs a missing message and prints the path.
    // The keys are spelled in two files: the words in ./blog/populate.ts'
    // `blogWordsFrom`, the tab's title in ./blog/words.ts. Read against the
    // Romanian file; the pages read them in all five languages since round 3,
    // and tests/unit/translation-parity.test.ts holds the other four files to
    // the same keys.
    const source = stripComments(blogPopulate) + stripComments(blogWords);
    const read = (fn: string) =>
      [...source.matchAll(new RegExp(`\\b${fn}\\('([^']+)'`, 'g'))].map(
        (match) => match[1] ?? '',
      );
    const lookup = (root: unknown, dotted: string): unknown =>
      dotted
        .split('.')
        .reduce<unknown>(
          (node, part) =>
            node !== null && typeof node === 'object'
              ? (node as Record<string, unknown>)[part]
              : undefined,
          root,
        );
    const blogKeys = read('t');
    const commonKeys = read('common');
    expect(blogKeys.length).toBeGreaterThan(0);
    expect(commonKeys).toContain('siteName');
    for (const key of blogKeys) {
      expect(typeof lookup(ro.blog, key), `blog.${key}`).toBe('string');
    }
    for (const key of commonKeys) {
      expect(typeof lookup(ro.common, key), `common.${key}`).toBe('string');
    }
  });

  it('the twin mounts the same two bands through the same populator, in its story’s language', () => {
    expect(stripComments(blogTwin)).toMatch(
      /const locale = useLocale\(\);\s*if \(!isLocale\(locale\)\)/,
    );
    expect(stripComments(blogTwin)).toMatch(
      /return \(\s*<>\s*<PostList \{\.\.\.populateBlogPage\(locale, page, words\)\} \/>\s*<ClinicLocation scaled \/>\s*<\/>\s*\);/,
    );
  });

  it('the twin renders the list in Romanian AND German (§13 — pages in RO + DE)', () => {
    const code = stripComments(blogTwin);
    expect(code).toMatch(
      /export const Romanian: Story = \{\s*globals: \{ locale: 'ro' \}/,
    );
    expect(code).toMatch(
      /export const German: Story = \{\s*globals: \{ locale: 'de' \}/,
    );
  });

  it('the pages and the twin build their words through the one blogWordsFrom', () => {
    expect(stripComments(blogWords)).toMatch(
      /return blogWordsFrom\(\s*await getTranslations\(\{ locale, namespace: 'blog' \}\),?\s*\);/,
    );
    expect(stripComments(blogTwin)).toMatch(
      /blogWordsFrom\(useTranslations\('blog'\)\)/,
    );
    // …and neither spells a word key of its own: the mapping lives in one place.
    expect(stripComments(blogTwin)).not.toMatch(/\bt\('/);
  });
});

describe('a blog article’s page and its story twin — read off their source', () => {
  // The route page renders ONE band — sections/PostPage from the article
  // route's pure populator, in the language its [locale] segment names,
  // narrowed once by ./blog/[slug]/populate.ts' `articleLocale`, with words
  // built by the same file's `articleWordsFrom` from getTranslations' two
  // translators in that language, `blog` and `common` (./blog/[slug]/
  // words.ts) — and no map after it since 2026-10-15 (the owner: "drop the
  // map"; THE MAP ON EVERY PAGE above no longer counts the article's two
  // files); the twin mounts the same band through the same populator, the
  // same narrowing and the same `articleWordsFrom`, with useLocale's language
  // and useTranslations' translators (CLAUDE.md §15.39 round 4) — the list's
  // block above, mirrored. A drift would show as the page rendering something
  // else, or as either side building its words another way — then the twin's
  // plays would no longer cover the page. And since 2026-10-15 every article
  // is written in EVERY language: no source of the route may name a language
  // of its own, and the pages are generated for each one the [locale] layout
  // makes.
  const page = stripComments(blogArticlePage);
  const twin = stripComments(blogArticleTwin);
  const words = stripComments(blogArticleWords);
  const populate = stripComments(blogArticlePopulate);
  // The twin returns its one band on ONE line — prettier drops the
  // parentheses round an element that fits one — which `returned` (a
  // parenthesised block) cannot read; the page's call does not fit one line
  // and keeps them.
  const twinStart = twin.indexOf('function ArticleBand(');
  const twinReturn = /\n {2}return (<[^\n]*\/>);\n/.exec(
    twin.slice(twinStart),
  )?.[1];
  if (twinStart < 0 || twinReturn === undefined) {
    throw new Error('ArticleBand returns no one-line JSX');
  }
  const ARTICLE = {
    page: returned(blogArticlePage, 'BlogArticlePage'),
    twin: twinReturn,
  };

  it('generates ONE page per article in EVERY language — the slug alone, multiplied by the layout’s locales — and lets no other slug be guessed', () => {
    // Next merges each entry with every language the [locale] layout made
    // (the doctor pages' and the numbered list pages' precedent), so the
    // SLUG alone writes /{locale}/blog/<slug>/ in all five. A `locale` key
    // here would cut the export back to one language, as the Romanian-only
    // article of 2026-10-14 was cut.
    expect(page).toMatch(
      /export function generateStaticParams\(\) \{\s*return articles\.map\(\(\{ slug \}\) => \(\{ slug \}\)\);\s*\}/,
    );
    expect(page).toMatch(/export const dynamicParams = false;/);
    // No route source pins a language: not a retired constant, and no locale
    // code in quotes ANYWHERE in its code (comments stripped; the twin names
    // its two story languages and is not read here).
    for (const [name, source] of BLOG_ARTICLE_ROUTE_SOURCES) {
      const code = stripComments(source);
      expect(code, name).not.toMatch(QUOTED_LOCALE);
      expect(code, name).not.toMatch(/ARTICLE_LOCALE/);
    }
  });

  it('reads the language off the route ONCE — the body and the metadata narrow the [locale] segment through the one articleLocale', () => {
    expect(populate).toMatch(
      /export function articleLocale\(locale: string\): Locale \{\s*if \(!isLocale\(locale\)\) \{\s*throw new Error\(/,
    );
    expect(page).toMatch(
      /export async function generateMetadata\(\{ params \}: Props\): Promise<Metadata> \{\s*const \{ locale, slug \} = await params;\s*return articleMetadata\(articleLocale\(locale\), slug\);\s*\}/,
    );
    expect(page).toMatch(
      /const \{ locale, slug \} = await params;\s*const language = articleLocale\(locale\);\s*return \(/,
    );
    expect(page).toMatch(
      /import \{ articleLocale, populateArticle \} from '\.\/populate';/,
    );
  });

  it('the page returns the populated PostPage in that one language, and nothing else — no map after it', () => {
    expect(page).toMatch(
      /return \(\s*<PostPage\s+\{\.\.\.populateArticle\(\s*language,\s*slug,\s*await articleWords\(language\),?\s*\)\}\s+\/>\s*\);/,
    );
    expect(bandsOf(ARTICLE.page)).toEqual(['PostPage']);
  });

  it('the twin mounts the same one band through the same populator, in its story’s language', () => {
    expect(twin).toMatch(/const locale = articleLocale\(useLocale\(\)\);/);
    expect(twin).toMatch(
      /return <PostPage \{\.\.\.populateArticle\(locale, slug, words\)\} \/>;/,
    );
    expect(twin).toMatch(
      /import \{[^}]*\barticleLocale\b[^}]*\bpopulateArticle\b[^}]*\} from '\.\/populate';/,
    );
    expect(bandsOf(ARTICLE.twin)).toEqual(bandsOf(ARTICLE.page));
  });

  it('the twin renders the article in Romanian AND German (§13 — pages in RO + DE)', () => {
    expect(twin).toMatch(
      /export const Romanian: Story = \{\s*globals: \{ locale: 'ro' \}/,
    );
    expect(twin).toMatch(
      /export const German: Story = \{\s*globals: \{ locale: 'de' \}/,
    );
  });

  it('the page and the twin build their words through the one articleWordsFrom, in the page’s language', () => {
    expect(words).toMatch(
      /export async function articleWords\(locale: Locale\): Promise<ArticleWords> \{\s*return articleWordsFrom\(\s*await getTranslations\(\{ locale, namespace: 'blog' \}\),\s*await getTranslations\(\{ locale, namespace: 'common' \}\),?\s*\);\s*\}/,
    );
    expect(words).toMatch(
      /import \{[^}]*\barticleWordsFrom\b[^}]*\} from '\.\/populate';/,
    );
    expect(twin).toMatch(
      /const words = articleWordsFrom\(\s*useTranslations\('blog'\),\s*useTranslations\('common'\),\s*\);/,
    );
    expect(twin).toMatch(
      /import \{[^}]*\barticleWordsFrom\b[^}]*\} from '\.\/populate';/,
    );
    // …and the twin spells no word key and builds no translator of its own:
    // the mapping lives in one place.
    expect(twin).not.toMatch(/\bt\('/);
    expect(twin).not.toMatch(/\bcreateTranslator\b/);
  });

  it('titles the tab in the page’s language — the post’s own title there, then the clinic', () => {
    expect(words).toMatch(
      /export async function articleTitle\(\s*locale: Locale,\s*slug: string,?\s*\): Promise<string> \{\s*const common = await getTranslations\(\{ locale, namespace: 'common' \}\);\s*return `\$\{articlePost\(locale, slug\)\.title\} — \$\{common\('siteName'\)\}`;\s*\}/,
    );
  });

  it('every key the article page reads exists — the tab title included (next-intl only logs a miss)', () => {
    // A typo in a key would ship as its own path („blog.article.gallery.next")
    // with the build green: next-intl logs a missing message and prints the
    // path. The keys are spelled in two files: the words in ./blog/[slug]/
    // populate.ts' `articleWordsFrom` (`blog` through `t`, the carousel's two
    // roledescriptions through `common`), the tab's title in ./blog/[slug]/
    // words.ts. Read against the Romanian file; the page reads them in all
    // five languages since 2026-10-15, and tests/unit/translation-parity.
    // test.ts holds the other four files to the same keys.
    const source = populate + words;
    const read = (fn: string) =>
      [...source.matchAll(new RegExp(`\\b${fn}\\('([^']+)'`, 'g'))].map(
        (match) => match[1] ?? '',
      );
    const lookup = (root: unknown, dotted: string): unknown =>
      dotted
        .split('.')
        .reduce<unknown>(
          (node, part) =>
            node !== null && typeof node === 'object'
              ? (node as Record<string, unknown>)[part]
              : undefined,
          root,
        );
    const blogKeys = read('t');
    const commonKeys = read('common');
    // The three sentences with an argument and a plain word, at least — so a
    // reader that matched nothing cannot pass.
    expect(blogKeys).toEqual(
      expect.arrayContaining([
        'article.byline',
        'readingTime',
        'article.gallery.slide',
        'article.share.copyFailed',
        'article.share.message',
        'article.share.subject',
        'tags',
      ]),
    );
    // `siteName` is read in three places — the share text's words, the tab's
    // title and the link-preview tags — so the reader compares the SET.
    expect([...new Set(commonKeys)].toSorted()).toEqual([
      'carousel.role',
      'carousel.slideRole',
      'siteName',
    ]);
    for (const key of blogKeys) {
      expect(typeof lookup(ro.blog, key), `blog.${key}`).toBe('string');
    }
    for (const key of commonKeys) {
      expect(typeof lookup(ro.common, key), `common.${key}`).toBe('string');
    }
  });

  it('reads the reading time from the blog’s ONE sentence — the list’s cards and the article page speak the same key', () => {
    // One message, so a card on the list and its article's page can never
    // word a reading time two ways (lib/blog-article's READING TIME): both
    // populators read `blog.readingTime`, and neither keeps a second one.
    for (const [name, source] of [
      ['blog/populate.ts', stripComments(blogPopulate)],
      ['blog/[slug]/populate.ts', populate],
    ] as const) {
      expect(source, name).toMatch(/\bt\('readingTime', \{ minutes \}\)/);
      expect(source, name).not.toMatch(/\.readingTime'/);
    }
  });
});

describe('the reader itself — a guard that cannot fail is not a guard', () => {
  it('ignores a band that is only MENTIONED in a comment', () => {
    const source = [
      // The trap the scanner exists for: a `/*` inside a LINE comment.
      '// reads src/messages/*.json — a path, not a block comment',
      'function Probe() {',
      '  // <Hero /> is discussed here, never rendered',
      '  return (',
      '    <>',
      '      {/* <ReviewsCarousel /> — also prose */}',
      '      <ClinicLocation />',
      '    </>',
      '  );',
      '}',
    ].join('\n');
    expect(bandsOf(returned(source, 'Probe'))).toEqual(['ClinicLocation']);
  });

  it('reads prop names and nothing of their values', () => {
    const jsx = `<DoctorShowcase firstScreen title={t('a.b')} lang="ro" />`;
    expect(propsOf(jsx, 'DoctorShowcase')).toEqual([
      'firstScreen',
      'lang',
      'title',
    ]);
  });

  it('reads literal VALUES as written, and nothing from inside an expression', () => {
    const jsx = `<DoctorStats ground="page" title={t("doctor.stats.title")} data-x={a=="b"} align="start" />`;
    expect(literalsOf(jsx, 'DoctorStats')).toEqual([
      'align="start"',
      'ground="page"',
    ]);
    // …and a drifted value reads as itself.
    expect(
      literalsOf('<DoctorStats ground="page" align="center" />', 'DoctorStats'),
    ).not.toEqual(PAGE_GROUND_AT_THE_START);
  });

  it('reads a BARE flag as a flag, and a valued one as nothing', () => {
    expect(flagsOf('<ClinicLocation scaled />', 'ClinicLocation')).toEqual([
      'scaled',
    ]);
    expect(
      flagsOf('<ClinicLocation scaled={false} />', 'ClinicLocation'),
    ).toEqual([]);
    expect(
      flagsOf('<DoctorStats scaled ground="page" tiles={x} />', 'DoctorStats'),
    ).toEqual(['scaled']);
  });

  it('sees a quoted locale code in any quotes, and never a key, a namespace or a path', () => {
    for (const pinned of [
      `getTranslations({ locale: 'de', namespace: 'blog' })`,
      `{ locale: "ro" }`,
      '<html lang="it">',
      'if (locale === `fr`)',
      `const BLOG = 'en';`,
    ]) {
      expect(pinned).toMatch(QUOTED_LOCALE);
    }
    for (const free of [
      `getTranslations({ locale, namespace: 'blog' })`,
      `t('hero.title')`,
      'localeHref(locale, `/blog/page/${page}`)',
      `'route'`,
      // two different quotes are no quoted code
      `"de'`,
    ]) {
      expect(free).not.toMatch(QUOTED_LOCALE);
    }
  });

  it('names the function it could not find', () => {
    expect(() => returned('const x = 1;', 'TeamPage')).toThrow(
      'no function TeamPage',
    );
  });

  it('finds the map by its IMPORT — under an alias too — and never by a name that merely starts like it', () => {
    expect(mapNameIn(`import { ClinicLocation } from '${MAP_MODULE}';`)).toBe(
      'ClinicLocation',
    );
    expect(
      mapNameIn(`import {\n  ClinicLocation as Map,\n} from '${MAP_MODULE}';`),
    ).toBe('Map');
    expect(
      mapNameIn(
        `import { ClinicLocation, type ClinicLocationProps } from '${MAP_MODULE}';`,
      ),
    ).toBe('ClinicLocation');
    expect(
      mapNameIn(`import { type ClinicLocationProps } from '${MAP_MODULE}';`),
    ).toBeNull();
    expect(
      mapNameIn(`import { Hero } from '@/components/sections/Hero/Hero';`),
    ).toBeNull();
  });

  it('reads EVERY mount on its own — a second, unscaled one and a spread are both visible', () => {
    const conditional = mountsOf(
      '{wide ? <ClinicLocation scaled /> : <ClinicLocation />}',
      'ClinicLocation',
    );
    expect(conditional.map((m) => flagsOf(m, 'ClinicLocation'))).toEqual([
      ['scaled'],
      [],
    ]);
    // A longer name is not a mount.
    expect(
      mountsOf(
        'useState<ClinicLocationProps>(); <ClinicLocation scaled />',
        'ClinicLocation',
      ),
    ).toHaveLength(1);
    // The names alone cannot see a spread; the tag's text can.
    const [spread = ''] = mountsOf(
      '<ClinicLocation scaled {...overrides} />',
      'ClinicLocation',
    );
    expect(propsOf(spread, 'ClinicLocation')).toEqual(['scaled']);
    expect(spread.slice(0, spread.indexOf('/>'))).toContain('{...');
  });
});
