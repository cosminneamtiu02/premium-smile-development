import { describe, expect, it } from 'vitest';
import blogTwin from './blog/Blog.stories.tsx?raw';
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
// `firstScreen` from the Team page — its largest paint goes lazy again — and
// tsc, eslint, every Vitest project and both builds stayed green, and the pixel
// net cannot see a prop that moves no pixel. (tests/e2e/doctor-showcase.spec.ts
// does read the built pages, but the e2e suite runs in no workflow and no hook.)
//
// So this file reads the pages and their twins — eight named sources, and
// since 2026-10-13 every .tsx under this folder through one glob — and
// compares what a drift would change:
//   · THE BANDS, IN ORDER — the elements each page returns, and its twin's;
//   · THE DOCTORS BAND'S PROPS — by NAME: the Team page says `firstScreen`
//     (the band opens its first screen — DoctorShowcase D9), Home does not
//     (the band sits below the Hero and the numbers), and each twin says
//     what its page says;
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
//     sections/TeamRoster its eyebrow and its title, and its twin the same.
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

/** The prop NAMES one element is given, sorted. */
const propsOf = (jsx: string, element: string): string[] => {
  const start = jsx.indexOf(`<${element}`);
  const end = jsx.indexOf('/>', start);
  if (start < 0 || end < 0) throw new Error(`no self-closing <${element}>`);
  return jsx
    .slice(start + element.length + 1, end)
    .replace(/=\{[^{}]*\}/g, '')
    .replace(/="[^"]*"/g, '')
    .split(/\s+/)
    .filter((name) => /^[A-Za-z][\w-]*$/.test(name))
    .toSorted();
};

/**
 * The STRING-LITERAL attributes one element is given, exactly as written —
 * `ground="page"` — sorted (TS review L6, 2026-10-01). Names alone cannot see
 * a value move: Home drifting back to `align="center"` while the Team page
 * stays at the start keeps every name in place. Only `name="…"` literals are
 * read, never an expression's inside: a page and its twin spell those
 * through different hooks, and the names test above already holds them.
 */
const literalsOf = (jsx: string, element: string): string[] => {
  const start = jsx.indexOf(`<${element}`);
  const end = jsx.indexOf('/>', start);
  if (start < 0 || end < 0) throw new Error(`no self-closing <${element}>`);
  return Array.from(
    jsx
      .slice(start + element.length + 1, end)
      .matchAll(/(?<![\w-])[A-Za-z][\w-]*="[^"]*"/g),
    (match) => match[0],
  ).toSorted();
};

/**
 * The BARE boolean attributes one element is given — written with no `=` at
 * all, `scaled` — sorted (the Opus review, 2026-10-02). `propsOf` strips every
 * value, so `scaled={false}` reads as `scaled` there and would pass while the
 * page ships an unscaled band; this reader sees only the bare spelling.
 */
const flagsOf = (jsx: string, element: string): string[] => {
  const start = jsx.indexOf(`<${element}`);
  const end = jsx.indexOf('/>', start);
  if (start < 0 || end < 0) throw new Error(`no self-closing <${element}>`);
  return jsx
    .slice(start + element.length + 1, end)
    .replace(/=\{[^{}]*\}/g, '=VALUE')
    .replace(/="[^"]*"/g, '=VALUE')
    .split(/\s+/)
    .filter((name) => /^[A-Za-z][\w-]*$/.test(name))
    .toSorted();
};

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
  it('returns the same bands in the same order: h1 → doctors → staff → numbers → map', () => {
    expect(bandsOf(TEAM.page)).toEqual([
      'h1',
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
    // The band then preloads its first picture, this page's largest paint.
    // Losing the prop breaks nothing visible: this line is what notices.
    expect(propsOf(TEAM.page, 'DoctorShowcase')).toEqual([
      'doctors',
      'eyebrow',
      'firstScreen',
      'title',
    ]);
    expect(propsOf(TEAM.twin, 'DoctorShowcase')).toEqual(
      propsOf(TEAM.page, 'DoctorShowcase'),
    );
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
  it('returns the same bands in the same order: h1 → hero → numbers → doctors → map → reviews', () => {
    // The numbers BEFORE the doctors — the owner's order since 2026-10-01
    // ("i need to swap these 2 sections between them … so first in cifre and
    // then doctors"); Home's alone, the Team page's order above is untouched.
    expect(bandsOf(HOME.page)).toEqual([
      'h1',
      'Hero',
      'DoctorStats',
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

  it('finds every file that imports the map — Home, the Team page and the doctor page, each with its twin', () => {
    expect(importers.map(({ path }) => path).toSorted()).toEqual([
      './(home)/Home.stories.tsx',
      './(home)/page.tsx',
      './team/Team.stories.tsx',
      './team/[slug]/Doctor.stories.tsx',
      './team/[slug]/page.tsx',
      './team/page.tsx',
    ]);
  });

  it('mounts the map ONCE in each — `scaled`, bare, nothing else, no spread', () => {
    // Never vacuous, even run alone (`-t`): the census holds its six files.
    expect(importers).toHaveLength(6);
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
  // Both route pages render ONE band, sections/PostList, from the SAME pure
  // populator, with words built by ./blog/populate.ts' `blogWordsFrom` from
  // getTranslations' translators (./blog/words.ts); the twin mounts the same
  // band through the same populator and the same `blogWordsFrom`, with
  // useTranslations' translators (CLAUDE.md §15.39). A drift would show as a
  // page rendering something else, or as either side building its words
  // another way — then the twin's plays would no longer cover the pages.
  it('page 1 and the numbered pages return the populated PostList and nothing else', () => {
    expect(stripComments(blogPage)).toMatch(
      /return <PostList \{\.\.\.populateBlogPage\(1, await blogPageWords\(\)\)\} \/>;/,
    );
    expect(stripComments(blogNumberedPage)).toMatch(
      /return \(\s*<PostList\s+\{\.\.\.populateBlogPage\(parsePageParam\(page\), await blogPageWords\(\)\)\}\s+\/>\s*\);/,
    );
  });

  it('every key the list pages read exists — the tab title included (next-intl only logs a miss)', () => {
    // A typo in a key would ship as its own path („blog.pageTitle — …") with
    // the build green: next-intl logs a missing message and prints the path.
    // The keys are spelled in two files: the words in ./blog/populate.ts'
    // `blogWordsFrom`, the tab's title in ./blog/words.ts.
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

  it('the twin mounts the same band through the same populator', () => {
    expect(stripComments(blogTwin)).toMatch(
      /return <PostList \{\.\.\.populateBlogPage\(page, words\)\} \/>;/,
    );
  });

  it('the pages and the twin build their words through the one blogWordsFrom', () => {
    expect(stripComments(blogWords)).toMatch(
      /return blogWordsFrom\(\s*await getTranslations\(\{ locale: BLOG_LOCALE, namespace: 'blog' \}\),\s*await getTranslations\(\{ locale: BLOG_LOCALE, namespace: 'common' \}\),\s*\);/,
    );
    expect(stripComments(blogTwin)).toMatch(
      /blogWordsFrom\(\s*useTranslations\('blog'\),\s*useTranslations\('common'\),\s*\)/,
    );
    // …and neither spells a word key of its own: the mapping lives in one place.
    expect(stripComments(blogTwin)).not.toMatch(/\bt\('/);
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
