import { render } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet and, below, the REAL face: where a subheading breaks is
// the engine's — the face at the size and weight the step computes, on the
// line the column gives it, under the `hyphens` the subheading computes.
// Nothing a class string can answer: PostProse.test.tsx pins the class, this
// file lays the words out.
import '@/styles/globals.css';
import {
  articleWordsFrom,
  populateArticle,
} from '@/app/[locale]/blog/[slug]/populate';
import { unitsAcrossLines } from '@/components/sections/PostCard/PostCard.fixtures';
import { locales, type Locale } from '@/i18n/locales';
import { articles } from '@/lib/blog-article/blog-article';
import { PostProse, type PostProseItem } from './PostProse';

// sections/PostProse — EVERY SUBHEADING THE ARTICLES SHIP KEEPS ITS WORDS
// WHOLE, in each of the five languages, on the column of every phone-sized
// window from 320 to 440 — MEASURED, the real face laid out.
//
// ── WHY (2026-10-20, the review's accessibility finding, measured). The
// subheading inherited the site's `hyphens: auto` (§15.14), and the German
// „Weiche, mittlere oder harte Borsten?" broke „har-te" at a syllable on
// every column from about 284 to 296px wide (Chromium on macOS, which
// hyphenates German) — in this file's sweep, the phones from 320 to 329 and
// the windows from 332 to 346 behind a classic scrollbar, a 320 phone's
// 288px among them; no other language's subheading split. It wears
// `hyphens-none` since — PostProse.tsx's THE SUBHEADING, the owner's
// 2026-10-15 rule for every title on the blog — so it breaks at a space or
// after a hyphen its words carry, and a word too wide for a whole line is the
// belt's alone. This file holds that on what ships.
//
// ── WHAT: every subheading of every article page the route builds, read
// THROUGH THE ROUTE'S POPULATOR (app/[locale]/blog/[slug]/populate.ts'
// `populateArticle`): the prose runs it hands sections/PostPage, in each
// language, for every article lib/blog-article ships — the list the route's
// own `generateStaticParams` maps — so an article added later, or a
// subheading reworded, is laid out here with no edit. The page's other words
// play no part in a subheading: each translator hands back its own key.
//
// ── WHERE: the column of every window from 320 to 440, a pixel apart —
// every phone held upright, the widest an iPhone Pro Max's 440 — twice: on a
// phone, which draws no scrollbar, and behind a classic 15px one, which `vw`
// counts. ui/Container's gutter is 5vw a side on all of them (§15.35), so
// the column is the window less any scrollbar less a tenth of the window:
// 288 to 396px on a phone, 273 to 381 behind a scrollbar. On every one the
// text runs the column's whole width (PostPage's 42rem measure binds only
// from a 672px column), outside THE BAND SCALE (its step is an 896px
// column), so a subheading is the `subhead` step's own 24px at weight 600.
//
// ── HOW: each language's runs as the page lays them out — one PostProse per
// run, under the language's `lang`, which picks the dictionary `hyphens:
// auto` would split with — in a frame as wide as the column; then a Range
// over each unit of each subheading must stand on ONE line (PostCard.
// fixtures.ts's `unitsAcrossLines` and its THE CUT RULE: a unit is what a
// line cannot break — the text between two breakable spaces, cut once more
// after a written hyphen; a no-break space joins, so the French „électrique
// ?" is one). That reading bites where the engine hyphenates the language;
// where it carries no dictionary (§15.25 records Chromium's own pattern set
// on Android, Windows and Linux as believed to carry none), the computed
// `hyphens: none` each case checks first is the guard that bites. The real
// face, `font-display: block`, is loaded before anything is read, as the
// house's plays load it. MEASURED (Chromium on macOS, the real face): the
// widest unit of each language's subheadings at 24px — German „Bürstenkopf"
// 133.4px, French „électrique ?" 122.3, Romanian „electrică?" 103.6, Italian
// „cambiarlo" 110.0, English „children" 91.4 — so no word comes near the
// 273px narrowest line, and the belt stays idle. A run of prose answers no
// hover — no transform, nothing that moves under a resting pointer — so no
// pointer is parked here.

/** The runner's root, which every rem here is written at (the premise). */
const ROOT = 16;

/** A classic scrollbar: `vw` counts it, the column loses it. */
const SCROLLBAR = 15;

/** The windows the subheadings are laid out at (the header's WHERE). */
const FIRST_WINDOW = 320;
const LAST_WINDOW = 440;

/** ui/Container's column at a window under 30rem (§15.35): the window less
 *  any scrollbar less the gutter a side — 5vw, which counts the scrollbar,
 *  never under 1rem. */
const columnAt = (window: number, scrollbar: number): number =>
  window - scrollbar - 2 * Math.max(ROOT, window / 20);

/** A column the runs are laid out in, named by its window. */
type Column = Readonly<{ name: string; width: number }>;

/** THE COLUMNS (the header's WHERE): every window from the first to the
 *  last, a phone's and the same window behind a classic scrollbar. */
const COLUMNS: readonly Column[] = Array.from(
  { length: LAST_WINDOW - FIRST_WINDOW + 1 },
  (_, index) => FIRST_WINDOW + index,
).flatMap((window) => [
  { name: `a ${window} phone`, width: columnAt(window, 0) },
  {
    name: `a ${window} window behind a classic scrollbar`,
    width: columnAt(window, SCROLLBAR),
  },
]);

/** The page's other words, which play no part in a subheading: each
 *  translator hands back its own key (the header's WHAT). */
const WORDS = articleWordsFrom(
  (key) => key,
  (key) => key,
);

/** Every prose run of every article page the route builds in `locale`, as
 *  its populator hands them to sections/PostPage, in the article's order. */
const runsIn = (locale: Locale): readonly (readonly PostProseItem[])[] =>
  articles.flatMap(({ slug }) =>
    populateArticle(locale, slug, WORDS).blocks.flatMap((block) =>
      block.kind === 'prose' ? [block.items] : [],
    ),
  );

/** How many subheadings the runs hold — what a frame must lay out. */
const subheadingsIn = (runs: readonly (readonly PostProseItem[])[]): number =>
  runs.flat().filter((item) => item.kind === 'heading').length;

// The REAL typeface, as PostCard.titles.test.tsx loads it: the declaration
// .storybook/preview-fonts.css makes for Storybook, its URL served from the
// repo's root, `font-display: block` so a fallback is never measured.
const SERIF = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }
`;
let injected: HTMLStyleElement | null = null;

beforeAll(async () => {
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet — and a 404 on the
  // subset REJECTS here, loudly. The subheadings' own weight, 600.
  await document.fonts.load(`600 1.5rem "${SERIF}"`);
  await document.fonts.ready;
});

afterAll(() => {
  injected?.remove();
  injected = null;
});

/** The face each subheading is set in, at the size and weight it computes,
 *  loaded with its own text before anything is read. */
const loadFaces = async (headings: readonly HTMLElement[]): Promise<void> => {
  for (const heading of headings) {
    const style = getComputedStyle(heading);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      heading.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/** `runs` laid out as the page lays them out (the header's HOW): one
 *  PostProse per run, under `locale`'s `lang`, in a frame `width` px wide —
 *  the frame and its subheadings, once the face has them. */
const renderRuns = async (
  locale: Locale,
  runs: readonly (readonly PostProseItem[])[],
  width: number,
): Promise<{ frame: HTMLElement; headings: HTMLElement[] }> => {
  const { container } = render(
    <div lang={locale} style={{ width: `${width}px` }}>
      {runs.map((items, index) => (
        <PostProse key={index} items={items} />
      ))}
    </div>,
  );
  const frame = container.firstElementChild;
  if (!(frame instanceof HTMLElement)) {
    throw new Error('PostProse.subheadings: the frame did not render');
  }
  const headings = [...frame.querySelectorAll('h2')];
  await loadFaces(headings);
  return { frame, headings };
};

describe('PostProse — every subheading the articles ship keeps its words whole (the real face, laid out)', () => {
  it('lays them out as the page does — on the column’s whole width, the `subhead` step’s 24px at weight 600, start-aligned, never hyphenated', async () => {
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the 16px root',
    ).toBe(ROOT);
    expect(document.fonts.check(`600 1.5rem "${SERIF}"`), SERIF).toBe(true);
    // THE COLUMNS, from their parts: a 320 phone's and a 440 one's, each
    // with and without the scrollbar — 121 windows, two columns each.
    expect(COLUMNS).toHaveLength(2 * (LAST_WINDOW - FIRST_WINDOW + 1));
    expect(COLUMNS.slice(0, 2).map(({ width }) => width)).toEqual([288, 273]);
    expect(COLUMNS.slice(-2).map(({ width }) => width)).toEqual([396, 381]);

    const runs = runsIn('ro');
    const { headings } = await renderRuns('ro', runs, 288);
    expect(headings, 'subheadings to lay out').toHaveLength(
      subheadingsIn(runs),
    );
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      const style = getComputedStyle(heading);
      expect(parseFloat(style.width), 'the line is the column').toBeCloseTo(
        288,
        2,
      );
      expect(style.fontSize, 'the `subhead` step').toBe('24px');
      expect(style.fontWeight).toBe('600');
      expect(style.fontFamily.startsWith(`"${SERIF}"`), style.fontFamily).toBe(
        true,
      );
      expect(style.textAlign).toBe('start');
      expect(style.overflowWrap, 'THE BELT').toBe('anywhere');
      // A SUBHEADING NEVER SPLITS A WORD: the class reached the real sheet.
      expect(style.hyphens, 'the subheading’s own `hyphens-none`').toBe('none');
    }
  });

  it.each(locales)(
    'keeps every word of every %s subheading on one line — on the column of every window from 320 to 440, a phone’s and one behind a classic scrollbar',
    async (locale) => {
      const runs = runsIn(locale);
      const [first] = COLUMNS;
      if (!first) throw new Error('PostProse.subheadings: no column');
      const { frame, headings } = await renderRuns(locale, runs, first.width);
      expect(headings, 'subheadings to lay out').toHaveLength(
        subheadingsIn(runs),
      );
      expect(headings.length).toBeGreaterThan(0);
      // THE GUARD THAT BITES where this engine carries no dictionary for the
      // language (the header's HOW): the class, computed, on every one.
      for (const heading of headings) {
        expect(getComputedStyle(heading).hyphens, heading.textContent).toBe(
          'none',
        );
      }

      const split: string[] = [];
      for (const column of COLUMNS) {
        frame.style.width = `${column.width}px`;
        for (const heading of headings) {
          for (const unit of unitsAcrossLines(heading)) {
            split.push(
              `„${unit}" in „${heading.textContent ?? ''}" on ${column.name} (${column.width}px)`,
            );
          }
        }
      }
      expect(split, 'a word laid out on two lines').toEqual([]);
    },
  );

  it('has teeth — a word laid out on two lines is caught: one too wide for its line, broken by the belt', async () => {
    // The reviewed subheading, copied — this case reads the READING, so it
    // holds still while the article is edited.
    const { headings } = await renderRuns(
      'de',
      [[{ kind: 'heading', text: 'Weiche, mittlere oder harte Borsten?' }]],
      288,
    );
    const [heading] = headings;
    if (!heading) throw new Error('PostProse.subheadings: no subheading');
    expect(unitsAcrossLines(heading), 'on a line it fits').toEqual([]);
    // Narrower than „Borsten?" at the step's 24px, wider than „oder": only
    // the belt can break the one, and nothing breaks the other.
    heading.style.width = '3em';
    const caught = unitsAcrossLines(heading);
    expect(caught).toContain('Borsten?');
    expect(caught).not.toContain('oder');
  });
});
