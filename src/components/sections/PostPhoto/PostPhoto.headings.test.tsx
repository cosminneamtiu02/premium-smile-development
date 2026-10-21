import { render } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet and, below, the REAL face: where a caption breaks is
// the engine's — the face at the size and weight the step computes, on the
// line the photo gives it, under the `hyphens` the caption computes. Nothing
// a class string can answer: PostPhoto.test.tsx pins the class, this file
// lays the words out (PostProse.subheadings.test.tsx's split).
import '@/styles/globals.css';
import {
  articleWordsFrom,
  populateArticle,
} from '@/app/[locale]/blog/[slug]/populate';
import { unitsAcrossLines } from '@/components/sections/PostCard/PostCard.fixtures';
import { locales, type Locale } from '@/i18n/locales';
import { articles } from '@/lib/blog-article/blog-article';
import { PostPhoto, type PostPhotoImage } from './PostPhoto';

// sections/PostPhoto — EVERY CAPTION THE ARTICLES SHIP KEEPS ITS WORDS WHOLE,
// in each of the five languages — a lone photo's heading and each
// before/after half's — on the column of every phone-sized window from 280
// to 440, and a pair's on every side-by-side half from 230 to 310px —
// MEASURED, the real face laid out.
//
// ── WHY (the round-2 G2 review, 2026-10-20, accessibility). The caption
// inherited the site's `hyphens: auto` (§15.14) while every other title on
// the blog wears `hyphens-none` — the owner's rule of 2026-10-15, a title
// never splits a word. It wears it since: PostPhoto.tsx's THE HEADING, which
// records the measurement that cleared it — no shipped caption changes its
// line count at a phone's default zoom, and no before/after half's at any
// width, so the pair's frozen phone look moves by no pixel. This file holds
// the rule on what ships.
//
// ── WHAT: every caption of every article page the route builds, read
// THROUGH THE ROUTE'S POPULATOR (app/[locale]/blog/[slug]/populate.ts'
// `populateArticle`): a photo block's `heading` and a before/after block's
// `headings`, in each language, for every article lib/blog-article ships —
// the list the route's own `generateStaticParams` maps — so an article added
// later, or a caption reworded, is laid out here with no edit. The page's
// other words play no part in a caption: each translator hands back its own
// key.
//
// ── WHERE, two sets of lines:
//   · EVERY CAPTION on the column of every window from 280 to 440, a pixel
//     apart — every phone held upright, the site's narrowest first, a
//     Galaxy Fold's 280px cover screen — twice: on a phone, which draws no
//     scrollbar, and behind a classic 15px one, which `vw` counts. ui/
//     Container's gutter is 5vw a side, never under 1rem (§15.35) — the floor
//     binds under a 320 window — so the column is 248 to 396px on a phone,
//     233 to 381 behind a scrollbar. The
//     article's 42rem measure binds only from a 672px column and THE BAND
//     SCALE from an 896px one, so a lone photo spans the column — and so does
//     each half of a before/after, stacked under its root's `@lg` (512px), as
//     on every phone here: the caption's line is the column.
//   · A PAIR'S CAPTIONS on every side-by-side half from 230px —
//     sections/BeforeAfter's switch, its root's 32rem less the line (0.25rem)
//     and its air (1.5rem a side), halved — to 310px, the half of the full
//     42rem measure, a pixel apart: the narrowest lines a caption is set on
//     (the article route's notes.test.tsx derives the same 230 for the
//     notes).
//
// ── HOW: each language's captions as the page sets them — one PostPhoto per
// caption, under the language's `lang`, which picks the dictionary
// `hyphens: auto` would split with — in a frame as wide as the line; then a
// Range over each unit of each caption must stand on ONE line (PostCard.
// fixtures.ts's `unitsAcrossLines` and its THE CUT RULE: a unit is what a
// line cannot break — the text between two breakable spaces, cut once more
// after a written hyphen). That reading bites where the engine hyphenates
// the language; where it carries no dictionary (§15.25 records Chromium's own
// pattern set on Android, Windows and Linux as believed to carry none), the
// computed `hyphens: none` each case checks first is the guard that bites.
// MEASURED (Chromium 151 on macOS, the real face): with `hyphens: auto` no
// shipped caption split a word on any of these lines either — the widest
// line one split on was 222px, the French „atten-dons" of a lone photo
// (PostPhoto.tsx's THE HEADING) — so on this engine the sweep guards the
// captions to come, a longer word or a new article, and the computed check
// guards the class. The real face, `font-display: block`, is loaded before
// anything is read, as the house's plays load it. A caption answers no
// hover — nothing moves under a resting pointer — so no pointer is parked.

/** The runner's root, which every rem here is written at (the premise). */
const ROOT = 16;

/** A classic scrollbar: `vw` counts it, the column loses it. */
const SCROLLBAR = 15;

/** The windows every caption is laid out at (the header's WHERE): from the
 *  site's narrowest phone, the 280 Fold cover screen, to a 440 one. */
const FIRST_WINDOW = 280;
const LAST_WINDOW = 440;

/** sections/BeforeAfter's side-by-side halves (the header's WHERE): its root
 *  less the line (step 1) and its air (step 6 a side), halved — from its
 *  switch, the root's `@lg` (32rem), to the full 42rem measure. */
const halfOf = (rootRem: number): number =>
  (rootRem * ROOT - 0.25 * ROOT - 2 * 1.5 * ROOT) / 2;
const FIRST_HALF = halfOf(32);
const LAST_HALF = halfOf(42);

/** ui/Container's column at a window under 30rem (§15.35): the window less
 *  any scrollbar less the gutter a side — 5vw, which counts the scrollbar,
 *  never under 1rem. */
const columnAt = (window: number, scrollbar: number): number =>
  window - scrollbar - 2 * Math.max(ROOT, window / 20);

/** A line the captions are laid out on, named for the failure message. */
type Line = Readonly<{ name: string; width: number }>;

/** THE COLUMNS (the header's WHERE): every window from the first to the
 *  last, a phone's and the same window behind a classic scrollbar. */
const COLUMNS: readonly Line[] = Array.from(
  { length: LAST_WINDOW - FIRST_WINDOW + 1 },
  (_, index) => FIRST_WINDOW + index,
).flatMap((window) => [
  { name: `a ${window} phone`, width: columnAt(window, 0) },
  {
    name: `a ${window} window behind a classic scrollbar`,
    width: columnAt(window, SCROLLBAR),
  },
]);

/** THE HALVES (the header's WHERE): every side-by-side half, a pixel apart. */
const HALVES: readonly Line[] = Array.from(
  { length: LAST_HALF - FIRST_HALF + 1 },
  (_, index) => ({
    name: `a ${FIRST_HALF + index}px side-by-side half`,
    width: FIRST_HALF + index,
  }),
);

/** The page's other words, which play no part in a caption: each translator
 *  hands back its own key (the header's WHAT). */
const WORDS = articleWordsFrom(
  (key) => key,
  (key) => key,
);

/** One caption as a page sets it — and whether it heads a before/after half,
 *  the only captions a side-by-side half is set on. */
type Caption = Readonly<{ text: string; pair: boolean }>;

/** Every caption of every article page the route builds in `locale`, as its
 *  populator hands them to the sections, in the article's order. */
const captionsIn = (locale: Locale): readonly Caption[] =>
  articles.flatMap(({ slug }) =>
    populateArticle(locale, slug, WORDS).blocks.flatMap((block): Caption[] => {
      if (block.kind === 'photo') {
        return block.heading === undefined
          ? []
          : [{ text: block.heading, pair: false }];
      }
      if (block.kind === 'beforeAfter') {
        return block.headings === undefined
          ? []
          : [
              { text: block.headings.before, pair: true },
              { text: block.headings.after, pair: true },
            ];
      }
      return [];
    }),
  );

/** Any picture: the caption's line is the photo's width, whatever it shows. */
const IMAGE = {
  src: '/images/hero/lobby.jpg',
  alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
} as const satisfies PostPhotoImage;

// The REAL typeface, as PostProse.subheadings.test.tsx loads it: the
// declaration .storybook/preview-fonts.css makes for Storybook, its URL
// served from the repo's root, `font-display: block` so a fallback is never
// measured.
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
  // subset REJECTS here, loudly. The captions' own weight, 600.
  await document.fonts.load(`600 1.5rem "${SERIF}"`);
  await document.fonts.ready;
});

afterAll(() => {
  injected?.remove();
  injected = null;
});

/** The face each caption is set in, at the size and weight it computes,
 *  loaded with its own text before anything is read. */
const loadFaces = async (captions: readonly HTMLElement[]): Promise<void> => {
  for (const caption of captions) {
    const style = getComputedStyle(caption);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      caption.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/** `captions` set as the page sets them (the header's HOW): one PostPhoto
 *  per caption, under `locale`'s `lang`, in a frame `width` px wide — the
 *  frame and its <figcaption>s, once the face has them. */
const renderCaptions = async (
  locale: Locale,
  captions: readonly Caption[],
  width: number,
): Promise<{ frame: HTMLElement; headings: HTMLElement[] }> => {
  const { container } = render(
    <div lang={locale} style={{ width: `${width}px` }}>
      {captions.map(({ text }, index) => (
        <PostPhoto key={index} heading={text} image={IMAGE} />
      ))}
    </div>,
  );
  const frame = container.firstElementChild;
  if (!(frame instanceof HTMLElement)) {
    throw new Error('PostPhoto.headings: the frame did not render');
  }
  const headings = [...frame.querySelectorAll('figcaption')];
  await loadFaces(headings);
  return { frame, headings };
};

describe('PostPhoto — every caption the articles ship keeps its words whole (the real face, laid out)', () => {
  it('lays them out as the page does — on the line’s whole width, the `subhead` step’s 24px at weight 600, start-aligned, never hyphenated', async () => {
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the 16px root',
    ).toBe(ROOT);
    expect(document.fonts.check(`600 1.5rem "${SERIF}"`), SERIF).toBe(true);
    // THE LINES, from their parts: a 280 phone's column — the gutter's 1rem
    // floor a side — and a 440 one's, each with and without the scrollbar —
    // 161 windows, two columns each — and the halves from the switch's 230px
    // to the measure's 310px.
    expect(COLUMNS).toHaveLength(2 * (LAST_WINDOW - FIRST_WINDOW + 1));
    expect(COLUMNS.slice(0, 2).map(({ width }) => width)).toEqual([248, 233]);
    expect(COLUMNS.slice(-2).map(({ width }) => width)).toEqual([396, 381]);
    expect([FIRST_HALF, LAST_HALF]).toEqual([230, 310]);
    expect(HALVES).toHaveLength(LAST_HALF - FIRST_HALF + 1);

    const captions = captionsIn('ro');
    expect(captions.length, 'captions to lay out').toBeGreaterThan(0);
    expect(
      captions.filter(({ pair }) => pair).length,
      'a before/after’s captions among them',
    ).toBeGreaterThan(0);
    const { headings } = await renderCaptions('ro', captions, 288);
    expect(headings, 'one <figcaption> per caption').toHaveLength(
      captions.length,
    );
    for (const heading of headings) {
      const style = getComputedStyle(heading);
      expect(parseFloat(style.width), 'the line is the frame').toBeCloseTo(
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
      // A CAPTION NEVER SPLITS A WORD: the class reached the real sheet.
      expect(style.hyphens, 'the caption’s own `hyphens-none`').toBe('none');
    }
  });

  it.each(locales)(
    'keeps every word of every %s caption on one line — every caption on the column of every window from 280 to 440, a phone’s and one behind a classic scrollbar, and a before/after’s on every side-by-side half from 230 to 310px',
    async (locale) => {
      const captions = captionsIn(locale);
      const [first] = COLUMNS;
      if (!first) throw new Error('PostPhoto.headings: no column');
      const { frame, headings } = await renderCaptions(
        locale,
        captions,
        first.width,
      );
      expect(headings, 'one <figcaption> per caption').toHaveLength(
        captions.length,
      );
      expect(headings.length).toBeGreaterThan(0);
      // THE GUARD THAT BITES where this engine carries no dictionary for the
      // language (the header's HOW): the class, computed, on every one.
      for (const heading of headings) {
        expect(getComputedStyle(heading).hyphens, heading.textContent).toBe(
          'none',
        );
      }

      const [lead] = headings;
      if (!lead) throw new Error('PostPhoto.headings: no caption');

      const split: string[] = [];
      const read = (line: Line, pairsOnly: boolean): void => {
        frame.style.width = `${line.width}px`;
        // EACH LINE IS THE ONE IT NAMES: every caption stands in the one
        // frame, so the first caption's box is every caption's line — laid
        // out at another width (a frame the style did not reach, a floor in
        // the figure), the sweep would read lines nobody draws, and pass.
        expect(lead.getBoundingClientRect().width, line.name).toBeCloseTo(
          line.width,
          1,
        );
        headings.forEach((heading, index) => {
          if (pairsOnly && !captions[index]?.pair) return;
          for (const unit of unitsAcrossLines(heading)) {
            split.push(
              `„${unit}" in „${heading.textContent ?? ''}" on ${line.name} (${line.width}px)`,
            );
          }
        });
      };
      for (const column of COLUMNS) read(column, false);
      for (const half of HALVES) read(half, true);
      expect(split, 'a word laid out on two lines').toEqual([]);
    },
  );

  it('has teeth — a word laid out on two lines is caught: one too wide for its line, broken by the belt', async () => {
    // A shipped German caption, copied — this case reads the READING, so it
    // holds still while the article is edited.
    const { headings } = await renderCaptions(
      'de',
      [{ text: 'Bei der Untersuchung', pair: false }],
      288,
    );
    const [heading] = headings;
    if (!heading) throw new Error('PostPhoto.headings: no caption');
    expect(unitsAcrossLines(heading), 'on a line it fits').toEqual([]);
    // Narrower than „Untersuchung" at the step's 24px, wider than „der":
    // only the belt can break the one, and nothing breaks the other.
    heading.style.width = '3em';
    const caught = unitsAcrossLines(heading);
    expect(caught).toContain('Untersuchung');
    expect(caught).not.toContain('der');
  });
});
