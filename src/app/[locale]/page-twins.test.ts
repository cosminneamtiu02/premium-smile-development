import { describe, expect, it } from 'vitest';
import homeTwin from './(home)/Home.stories.tsx?raw';
import homePage from './(home)/page.tsx?raw';
import teamTwin from './team/Team.stories.tsx?raw';
import teamPage from './team/page.tsx?raw';

// THE PAGES AND THEIR STORY TWINS, held together by their SOURCE (G2 react,
// 2026-09-30). A page under app/[locale]/ is an async Server Component — it
// awaits next-intl/server — so no browser runner can render it, and each page
// keeps a KEEP-IN-SYNC twin beside it (Team.stories.tsx, Home.stories.tsx)
// that re-spells its JSX through the isomorphic hooks. The twins' plays pin
// the TWIN. Nothing pinned the PAGE: delete `firstScreen` from the Team page
// — its largest paint goes lazy again — and tsc, eslint, every Vitest project
// and both builds stayed green, and the pixel net cannot see a prop that
// moves no pixel. (tests/e2e/doctor-showcase.spec.ts does read the built
// pages, but the e2e suite runs in no workflow and no hook.)
//
// So this file reads all four sources and compares what a drift would change:
//   · THE BANDS, IN ORDER — the elements each page returns, and its twin's;
//   · THE DOCTORS BAND'S PROPS — by NAME: the Team page says `firstScreen`
//     (the band opens its first screen — DoctorShowcase D9), Home does not
//     (the band sits under the Hero), and each twin says what its page says.
// Only names are compared, never values: a page reads `getTranslations`, its
// twin `useTranslations`. And only the doctors band's props are held equal —
// a twin may pin a band for the workbench (a clock, a viewport) with a prop
// its page does not pass.
//
// It runs in the `components` project (src/**/*.test.{ts,tsx}); nothing is
// rendered — the mechanism of team/[slug]/stat-tiles.test.tsx's "THE ONE
// COPY", which reads a page and its twin the same way.

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

const TEAM = {
  page: returned(teamPage, 'TeamPage'),
  twin: returned(teamTwin, 'TeamPageBands'),
};
const HOME = {
  page: returned(homePage, 'HomePage'),
  twin: returned(homeTwin, 'HomePageBand'),
};

describe('the Team page and its story twin — read off their source', () => {
  it('returns the same bands in the same order: h1 → doctors → staff → map', () => {
    expect(bandsOf(TEAM.page)).toEqual([
      'h1',
      'DoctorShowcase',
      'TeamRoster',
      'ClinicLocation',
    ]);
    expect(bandsOf(TEAM.twin)).toEqual(bandsOf(TEAM.page));
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
  it('returns the same bands in the same order: h1 → hero → doctors → map → reviews', () => {
    expect(bandsOf(HOME.page)).toEqual([
      'h1',
      'Hero',
      'DoctorShowcase',
      'ClinicLocation',
      'ReviewsCarousel',
    ]);
    expect(bandsOf(HOME.twin)).toEqual(bandsOf(HOME.page));
  });

  it('leaves the doctors band LAZY under the hero — no `firstScreen`, page and twin alike (D9)', () => {
    // Home's largest paint is the hero's photograph; a preloaded cutout a
    // screen further down would only compete with it.
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

  it('names the function it could not find', () => {
    expect(() => returned('const x = 1;', 'TeamPage')).toThrow(
      'no function TeamPage',
    );
  });
});
