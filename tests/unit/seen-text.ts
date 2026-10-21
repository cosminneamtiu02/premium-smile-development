import {
  spelled,
  withoutInvisible,
} from '../../src/lib/visible-text/visible-text';

// THE TEXT AS A READER SEES IT — two readings of lib/visible-text's set of
// characters that show nothing, which the blog's two data tests share
// (tests/unit/blog-data.test.ts for posts.json, tests/unit/
// blog-article-data.test.ts for the articles). Not a test itself (the unit
// project collects `*.test.ts` only): the helper its readers import, the
// shape tests/unit/module-reader.ts set. Moved here on 2026-10-21, round 2 of
// lib/visible-text's review (all three reviewers), from the article data
// test, its one reader until then, when the post data test needed both —
// CLAUDE.md §4's sharing table, its first row: identical mechanics, a second
// consumer, extracted to the nearest tier both may import, which for two
// tests is tests/unit/ itself; lib/visible-text holds what the site's own
// code asks, and no build-time reader asks either of these.
//
// ── `seenAs` — what a reader SEES of a text, for comparing two: every
// invisible character DROPPED and every blank gap read as a space
// (lib/visible-text's `withoutInvisible`) FIRST, then composed to NFC — „ț"
// written as one character or as „t" and a combining comma below is one
// letter to the eye — then every run of white space read as one space, and
// the ends trimmed. Dropping comes BEFORE composing (round 2, the typescript
// review): a combining grapheme joiner U+034F between „t" and its comma
// BLOCKS composition, so composed first, „periu" + „t", U+034F, U+0326 + „a"
// stays two characters after the joiner is dropped, and a copy that differs
// from „periuța" by a joiner reads as other words.
//
// ── `invisibleInside` — every INVISIBLE character inside a text a visitor
// reads or hears: a character `withoutInvisible` would drop, or read as a
// space where none is written — the default-ignorable characters, the
// controls, the blank gaps — each by its code point and its place. „Peri" +
// a zero-width space + „uța" shows „Periuța", passes every rule of the
// parsers (lib/visible-text's FINISHED TEXT keeps an invisible character
// that is no white space, at an end too) and splits the word for search, a
// screen reader's spelling and the CMSR scan's source alike. Kept: the
// invisible characters that BUILD an emoji (round 2, the accessibility and
// React reviews — until then a text-style heart and a keycap were refused):
//   · the zero-width joiner between two pictographs (a woman health worker,
//     a rainbow flag);
//   · a VARIATION SELECTOR after an emoji's base — U+FE0F, which asks for the
//     emoji's picture, and U+FE0E, which asks for its text style (a red
//     heart drawn as a glyph), looking back past a skin-tone modifier;
//   · the presentation selector of a KEYCAP, a digit, „#" or „*", U+FE0F and
//     the enclosing keycap U+20E3 (one, a keycap: „1", U+FE0F, U+20E3);
//   · the TAG characters U+E0020–U+E007F after a black flag U+1F3F4 — the
//     subdivision flags (England: the flag, „gbeng" in tags, the cancel tag).
// NAMED, NOT TAKEN — each joins the kept ones by name in the lane that needs
// it: the soft hyphen U+00AD, the day the owner takes the soft-hyphen lever
// (sections/PostCard's and PostProse's THE LEVER — a soft hyphen written
// where a long label may break), and the zero-width non-joiner U+200C,
// German typesetting's break of a ligature across the seam of a compound
// („Auf" + U+200C + „lage"). None ships today (measured, round 2).

/** What a reader SEES of a text (the header's `seenAs`). */
export const seenAs = (text: string): string =>
  withoutInvisible(text).normalize('NFC').replace(/\s+/gu, ' ').trim();

/** An emoji's own pictograph — a base a joiner or a selector belongs to. */
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

/** What may follow a pictograph inside its sequence before the next joiner
 *  or selector: a variation selector, a skin-tone modifier. */
const PICTOGRAPH_TAIL = /[\u{FE0E}\u{FE0F}\p{Emoji_Modifier}]/u;

/** The two variation selectors an emoji takes: text style, emoji style. */
const VARIATION_SELECTOR = /^[\u{FE0E}\u{FE0F}]$/u;

/** A keycap's base: a digit, „#" or „*". */
const KEYCAP_BASE = /^[0-9#*]$/;

/** The tag characters a subdivision flag spells its region in. */
const TAG = /^[\u{E0020}-\u{E007F}]$/u;

const ZERO_WIDTH_JOINER = String.fromCodePoint(0x200d);
const PRESENTATION_SELECTOR = String.fromCodePoint(0xfe0f);
const ENCLOSING_KEYCAP = String.fromCodePoint(0x20e3);
const BLACK_FLAG = String.fromCodePoint(0x1f3f4);

/**
 * Every INVISIBLE character inside `text` (the header's `invisibleInside`),
 * each as „"\u{200B}" at character 5" — empty when there is none; the
 * characters that build an emoji kept.
 */
export function invisibleInside(text: string): string[] {
  const characters = [...text];
  const at = (index: number): string => characters[index] ?? '';
  /** The pictograph a joiner or a selector at `index` belongs to, looking
   *  back past the selectors and modifiers its sequence already holds. */
  const pictographBefore = (index: number): boolean => {
    let back = index - 1;
    while (back >= 0 && PICTOGRAPH_TAIL.test(at(back))) back -= 1;
    return PICTOGRAPH.test(at(back));
  };
  /** Is the tag character at `index` one of a black flag's run of tags? */
  const flagBefore = (index: number): boolean => {
    let back = index - 1;
    while (back >= 0 && TAG.test(at(back))) back -= 1;
    return at(back) === BLACK_FLAG;
  };
  return characters.flatMap((character, index): string[] => {
    if (withoutInvisible(character) === character) return [];
    if (
      character === ZERO_WIDTH_JOINER &&
      pictographBefore(index) &&
      PICTOGRAPH.test(at(index + 1))
    ) {
      return [];
    }
    if (VARIATION_SELECTOR.test(character) && pictographBefore(index)) {
      return [];
    }
    if (
      character === PRESENTATION_SELECTOR &&
      KEYCAP_BASE.test(at(index - 1)) &&
      at(index + 1) === ENCLOSING_KEYCAP
    ) {
      return [];
    }
    if (TAG.test(character) && flagBefore(index)) return [];
    return [`${spelled(character)} at character ${index + 1}`];
  });
}
