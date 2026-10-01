import { describe, expect, it } from 'vitest';
import homeTwin from './(home)/Home.stories.tsx?raw';
import homePage from './(home)/page.tsx?raw';
import doctorTwin from './team/[slug]/Doctor.stories.tsx?raw';
import doctorPage from './team/[slug]/page.tsx?raw';
import teamTwin from './team/Team.stories.tsx?raw';
import teamPage from './team/page.tsx?raw';

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
// So this file reads all six sources and compares what a drift would change:
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
//     net photographs the TWIN, which would still say it.
// Only names are compared, never values: a page reads `getTranslations`, its
// twin `useTranslations`. And only the doctors band's and the numbers band's
// props are held equal — a twin may pin a band for the workbench (a clock, a
// viewport) with a prop its page does not pass.
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
 * absence the owner asked for ("so dorp that part").
 */
const CLINIC_NUMBERS = [
  'align',
  'atLeast',
  'eyebrow',
  'format',
  'ground',
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
});

describe('a doctor’s page and its story twin — read off their source', () => {
  it('returns the same bands in the same order: opener → profile → courses → numbers → map', () => {
    expect(bandsOf(DOCTOR.page)).toEqual([
      'DoctorIntro',
      'DoctorProfile',
      'DoctorCourses',
      'DoctorStats',
      'ClinicLocation',
    ]);
    expect(bandsOf(DOCTOR.twin)).toEqual(bandsOf(DOCTOR.page));
  });

  it('keeps the numbers band on its DEFAULTS — the tint, the centre, its lead — page and twin alike (§6.6)', () => {
    // The second page's two settings stay off this one: the doctor page's
    // call did not change by a character when Home's band arrived, and a
    // `ground` or an `align` written here would be a change it never asked for.
    expect(propsOf(DOCTOR.page, 'DoctorStats')).toEqual([
      'atLeast',
      'eyebrow',
      'format',
      'lead',
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

  it('names the function it could not find', () => {
    expect(() => returned('const x = 1;', 'TeamPage')).toThrow(
      'no function TeamPage',
    );
  });
});
