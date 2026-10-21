import { cleanup, render } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
// The REAL stylesheet and, below, the REAL face: how many lines a note takes
// is the typeface's and the engine's, at the size the note computes, on the
// line its section gives it — nothing a character count can answer
// (sections/PostCard's PostCard.titles.test.tsx, the same reasoning).
import '@/styles/globals.css';
import { PostPhoto } from '@/components/sections/PostPhoto/PostPhoto';
import { locales, type Locale } from '@/i18n/locales';
import { articles } from '@/lib/blog-article/blog-article';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import {
  articleWordsFrom,
  populateArticle,
  type ArticleWords,
} from './populate';

// A blog article's notes — EVERY NOTE THE BLOG SHIPS TAKES TWO LINES AT
// MOST, on the narrowest line the page draws it on, in each of the five
// languages, MEASURED. The owner, verbatim (2026-10-15): "each photo has to
// have a max 2 row grays text … starting with "Note: ". i want abosultley no
// emphasis here, jsut the gray text on a maximum of 2 rows".
//
// ── A RULE ON THE DATA, NOT A CLAMP. sections/PostPhoto draws a note whole,
// however long (its header says why it does not clamp: a clamp hides the end
// of a longer note from a sighted reader while a screen reader reads all of
// it, and under a reader's text spacing — WCAG 2.2 SC 1.4.12 — it would cut
// a note that fits). So the two lines are kept HERE, on what the blog ships:
// a note that would take a third line fails CI naming its article, its
// language and its words, and the owner shortens it.
//
// ── WHAT IS MEASURED IS WHAT THE PAGE PRINTS: every article lib/blog-article
// ships, in every language, through this route's own populator and its own
// mapping of the words (./populate.ts' `populateArticle` and
// `articleWordsFrom`, over each language's REAL message file), so each note
// is measured FINISHED — with its lead-in, „Notă: ", "Note: ", „Hinweis: ",
// « Note : », «Nota: » — exactly as the page sets it.
//
// ── THE NARROWEST LINES, derived from their parts below:
//   · A BEFORE/AFTER's half — 230px. sections/BeforeAfter sets its two halves
//     side by side from its root's `@lg` (32rem): two equal tracks beside the
//     line (0.25rem) and its air (1.5rem a side), so at the switch each half
//     is (512 − 4 − 2 × 24) / 2 = 230px — BeforeAfter's THE LAYOUT, whose
//     WHERE THE SWITCH FALLS measures it. Stacked, below the switch, a half is
//     the whole column, never under 273px (the next line).
//   · A BLOG PHOTO — 273px: the article's measure is ui/Container's column on
//     a phone, and at a 320 window behind a classic 15px scrollbar the column
//     is 320 − 15 − 2 × 16 = 273px (the 5vw gutter counts the scrollbar,
//     §15.35); on a 320 phone, with no scrollbar, 288px.
// Every other line a note is drawn on is wider in ems: inside THE BAND SCALE
// the measure and the note's size scale together (§15.32), so a half there is
// 310 design pixels for a 16-design-pixel note.
//
// ── HYPHENATION OFF WHILE MEASURING — the worst case. The site hyphenates
// prose (§15.14) where the engine has a dictionary for the page's language:
// Chromium on macOS has all five, while its pattern set elsewhere is believed
// to lack Romanian (§15.25). A word hyphenated at a line's end can only let
// MORE of the note onto that line, so a note measured unhyphenated takes at
// most as many lines as it ever takes anywhere — and the rule holds on every
// platform, never on this one alone.

/** The runner's root, which every rem here is written at. */
const ROOT = 16;

/** BeforeAfter's switch, its root's `@lg` (32rem), and what a half is there:
 *  the two tracks share what the line (step 1) and its air (step 6 a side)
 *  leave. */
const PAIR_HALF = (32 * ROOT - 0.25 * ROOT - 2 * 1.5 * ROOT) / 2;

/** A 320 window behind a classic scrollbar: the column, less the 5vw gutter
 *  a side, which counts the scrollbar's 15px. */
const PHOTO_LINE = 320 - 15 - 2 * (320 / 20);

/** The most lines a note may take — the owner's "a maximum of 2 rows". */
const MAX_LINES = 2;

/** Each language's own messages. */
const MESSAGES = { ro, en, de, fr, it: it_ } as const satisfies Record<
  Locale,
  typeof ro
>;

/** The page's words in `locale`, through its REAL message file. */
const wordsIn = (locale: Locale): ArticleWords =>
  articleWordsFrom(
    createTranslator({ locale, messages: MESSAGES[locale], namespace: 'blog' }),
    createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace: 'common',
    }),
  );

/** One note as the page prints it, and the line it is measured on. */
type Note = Readonly<{
  where: string;
  locale: Locale;
  text: string;
  line: number;
}>;

/** Every note the blog ships, FINISHED, with the narrowest line it is drawn
 *  on — the header's WHAT IS MEASURED. */
const NOTES: readonly Note[] = articles.flatMap(({ slug }) =>
  locales.flatMap((locale) =>
    populateArticle(locale, slug, wordsIn(locale)).blocks.flatMap(
      (block, index): Note[] => {
        const where = `${slug} (${locale}), block ${index + 1}`;
        switch (block.kind) {
          case 'photo':
            return block.note === undefined
              ? []
              : [{ where, locale, text: block.note, line: PHOTO_LINE }];
          case 'beforeAfter':
            return block.notes === undefined
              ? []
              : [
                  {
                    where: `${where}, before`,
                    locale,
                    text: block.notes.before,
                    line: PAIR_HALF,
                  },
                  {
                    where: `${where}, after`,
                    locale,
                    text: block.notes.after,
                    line: PAIR_HALF,
                  },
                ];
          case 'prose':
          case 'gallery':
            // A run of text and a carousel print no note: a card's words are
            // its caption (sections/PostGallery).
            return [];
          default: {
            // TOTAL over the page's kinds (2026-10-21, round 3 of the Opus
            // reviews — this file is the one enforcer of the owner's two
            // lines): a fifth kind, which might print a note, does not
            // compile here until this walk reads it.
            const unread: never = block;
            throw new Error(
              `${where}: a block of the kind ${JSON.stringify(
                (unread as { kind?: unknown }).kind,
              )}, which this walk does not read`,
            );
          }
        }
      },
    ),
  ),
);

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
  // subset REJECTS here, loudly.
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.ready;
});

afterEach(cleanup);

afterAll(() => {
  injected?.remove();
  injected = null;
});

/**
 * How many lines `text` takes as sections/PostPhoto's note, `line` px wide,
 * under `locale`'s `lang`, unhyphenated (the header's HYPHENATION OFF): the
 * real section renders it, and the note's height over its line height is
 * its count of lines.
 */
const linesOf = async (
  text: string,
  locale: Locale,
  line: number,
): Promise<number> => {
  const { container } = render(
    <div lang={locale} style={{ width: `${line}px` }}>
      <PostPhoto
        image={{ src: '/images/hero/lobby.jpg', alt: 'Sala de așteptare' }}
        note={text}
      />
    </div>,
  );
  const note = container.querySelector('figure > p');
  if (!(note instanceof HTMLElement)) {
    throw new Error('sections/PostPhoto drew no note <p> under its figure');
  }
  note.style.hyphens = 'none';
  const style = getComputedStyle(note);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    text,
  );
  await document.fonts.ready;
  // The note is as wide as its line — the premise every count rests on.
  expect(note.getBoundingClientRect().width).toBeCloseTo(line, 0);
  return Math.round(
    note.getBoundingClientRect().height / parseFloat(style.lineHeight),
  );
};

describe('a blog article’s notes — two lines at most, on the narrowest line each is drawn on (the real face)', () => {
  it('measures notes at all — the blog ships notes under its photos AND under both halves of a before/after', () => {
    expect(NOTES.some(({ line }) => line === PHOTO_LINE)).toBe(true);
    expect(NOTES.some(({ line }) => line === PAIR_HALF)).toBe(true);
    // Every note in every language: the same count in each (one file, the
    // facts once — lib/blog-article's EVERY LANGUAGE, IN ONE FILE).
    const perLanguage = locales.map(
      (locale) => NOTES.filter((note) => note.locale === locale).length,
    );
    expect(new Set(perLanguage).size).toBe(1);
  });

  it('derives its two lines from their parts — 230px for a half at the switch, 273px for a photo at a 320 window behind a classic scrollbar', () => {
    expect(PAIR_HALF).toBe(230);
    expect(PHOTO_LINE).toBe(273);
  });

  it.each(NOTES.map((note) => [note.where, note] as const))(
    '%s: its note takes two lines at most',
    async (_where, note) => {
      const lines = await linesOf(note.text, note.locale, note.line);
      expect(
        lines,
        `${note.where}: „${note.text}" takes ${lines} lines on ${note.line}px — at most ${MAX_LINES}`,
      ).toBeLessThanOrEqual(MAX_LINES);
    },
  );

  it('has teeth — a note of three lines on a half’s line is counted three', async () => {
    const long =
      'Notă: fotografie făcută în cabinet, la lumina zilei, înainte de prima ședință de igienizare.';
    expect(await linesOf(long, 'ro', PAIR_HALF)).toBeGreaterThan(MAX_LINES);
    expect(await linesOf('Notă: o notă scurtă.', 'ro', PAIR_HALF)).toBe(1);
  });
});
