// lib/visible-text — THE SITE'S TESTS OF WHAT A TEXT SHOWS, ON ONE SET OF
// CHARACTERS: the characters that show NOTHING (THE UNSEEN SET, below). Whether
// a text shows anything at all (`hasVisibleText`), a letter's worth
// (`hasVisibleLetter`), a word's worth — a letter or a digit (`hasVisibleWord`)
// — and whether it is FINISHED text, a well-formed string that shows
// something with no white space at either end (`isFinishedText`, and
// `whyUnfinished` for the refusal); and the set's two other uses: the text as a
// reader sees it, its invisible characters dropped and its blank gaps read as
// spaces, for comparing or scanning it (`withoutInvisible`), and any value
// spelled for an error message, every character of the set by its code point
// (`spelled`). React-free MECHANICS (CLAUDE.md §4's foundation
// ring, fenced by tests/unit/lib-react-free.test.ts): pure functions, no DOM,
// no data — so the build-time readers of the blog's JSON, the sections that
// render its words and the tests that read them may all import them. Built on
// the article page's lane (CLAUDE.md §15.39 round 4), 2026-10-20; the set
// spelled once and its two other uses added by round 1 of the module's review,
// 2026-10-21.
//
// ── WHY ONE RULE (the round-2 reviews of sections/BeforeAfter and
// sections/PostProse, 2026-10-20, measured). The lane had THREE ideas of a
// blank text: sections/BeforeAfter counted white space and FORMAT characters
// (`\s` and `\p{Cf}`) as showing nothing; sections/PostProse counted what
// `trim()` leaves; lib/blog-article's `isText` asked only for a trimmed
// string that is not empty. So a paragraph of one zero-width space passed
// the build and drew a 28px blank line, and a subheading of one drew a
// nameless <h2>. Three readers of the same question is §4's sharing table's
// first row — identical MECHANICS, another consumer: extract to the nearest
// tier all of them may import — and lib/ is that tier, since lib/blog-article
// may import no section. Round 1 of this module's review (2026-10-21) found
// the set still spelled four more times — BeforeAfter's quoting of a refusal,
// the CMSR scan's reading (`\p{Cf}`), lib/share's blank check (`trim()`) and
// its quoting, and the article data test's comparison — and moved each onto
// the exports here.
//
// ── THE UNSEEN SET, spelled ONCE (UNSEEN, below; every pattern of this file
// is built from it). A character shows NOTHING when it is:
//   · white space (`\s`, what `trim()` removes — the space, the no-break
//     space, U+202F, the line breaks, U+3000, U+FEFF);
//   · a CONTROL character (`\p{Cc}`, a general category): the C0 controls
//     U+0000–U+001F, DEL U+007F and the C1 controls U+0080–U+009F — NEL
//     U+0085 among them, the one character of Unicode's White_Space that `\s`
//     misses. MEASURED by the round-1 typescript review: drawn as no ink in
//     Chromium and Firefox and as a box in WebKit; the HTML parser drops
//     U+0000 outright;
//   · DEFAULT-IGNORABLE (the derived property Default_Ignorable_Code_Point,
//     DerivedCoreProperties.txt — Unicode's own list of the characters a
//     renderer draws as nothing when it gives them no special meaning): the
//     zero-width space U+200B, the soft hyphen U+00AD, the joiners U+200C and
//     U+200D, the word joiner U+2060, the byte-order mark U+FEFF, the
//     bidirectional marks, the combining grapheme joiner U+034F, the variation
//     selectors U+FE00–U+FE0F and U+E0100–U+E01EF, the Mongolian ones from
//     U+180B, the Khmer inherent vowels U+17B4 and U+17B5, the Hangul fillers
//     U+115F, U+1160, U+3164 and U+FFA0, the tag characters;
//   · U+2800 BRAILLE PATTERN BLANK — a symbol (So), neither white space nor
//     default-ignorable, yet blank on screen and a blank cell on a braille
//     display. Until round 1 it was THE KNOWN GAP, named and left; the review
//     closed it, one escape in the set;
//   · U+FFF9–U+FFFB, the INTERLINEAR ANNOTATION characters — format
//     characters (Cf) that are no default-ignorable code points, and blank in
//     all three engines (the round-1 typescript review, measured).
// 4262 code points in all (visible-text.test.ts counts them). Every pattern
// is read with the `u` flag, so a character past U+FFFF is one code point,
// never two halves.
//
// ── WHY NOT THE FORMAT CATEGORY (`\p{Cf}`) — it is the wrong set at both
// edges (the typescript review, measured): U+034F, the variation selectors,
// U+180B and U+17B4 paint nothing yet are no format characters, and U+3164
// and U+FFA0 are LETTERS (Lo) that draw blank width — while U+0600 ARABIC
// NUMBER SIGN and U+06DD ARABIC END OF AYAH ARE format characters that draw
// a sign. Nor `trim()` alone: it removes white space only, so a zero-width
// space, a soft hyphen or a word joiner survives it.
//
// ── THE LETTER RULE (PostPhoto's round-3 reviews, 2026-10-20 — React and
// TypeScript). A picture's alt must describe it in WORDS, so it holds a
// LETTER, of any script (lib/blog-article's `parseAlt`; sections/PostPhoto
// refuses the same at render) — and `\p{L}` alone counts four letters that
// draw no letter: the Hangul fillers U+115F, U+1160, U+3164 and U+FFA0,
// letters (Lo) and default-ignorable both, so an alt of a Hangul filler and
// a dot passed as words. (What each one draws, MEASURED in round 2 of the
// module's review, 2026-10-21 — Playwright's Chromium, WebKit and Firefox on
// macOS, the page's face and four generic ones: U+3164 and U+FFA0 a blank gap
// in Chromium and nothing in the other two; U+115F and U+1160 no width in any
// engine, where Chromium and WebKit lay the system's dashed „HC" and „HJ"
// placeholder over the next letter, no font of the machine carrying them —
// THE TWO OTHER USES has the gaps.) `hasVisibleLetter` asks for a letter that
// is NOT in THE UNSEEN SET: MEASURED over every code point, it differs from
// `\p{L}` on exactly those four — no other letter is in the set — and every
// letter it accepts also passes `hasVisibleText`. Spelled as a lookahead,
// `(?![…])\p{L}` with the `u` flag, because the set-subtraction form needs
// the `v` flag, which Safari before 17 (Chrome before 112, Firefox before 116)
// does not know: a pattern built with it throws a SyntaxError there when the
// module loads. TypeScript would not stop it — its TS1501 refuses the flag on
// a regular-expression LITERAL below an ES2024 target, and every pattern here
// is built with `new RegExp`, which compiles at any target.
//
// ── THE WORD RULE (round 1's accessibility review, 2026-10-21). A LABEL — a
// post's title, a subheading, a photo's or a pair's heading, a gallery's
// caption, a tag — names what it heads, so a label of marks alone („.",
// „…", „🦷") is a heading or a chip whose name says nothing (SC 2.4.6).
// `hasVisibleWord` asks for a letter OR A DIGIT that shows: „2019" names a
// year, as a pair headed „2019" and „2024" may honestly be. The same
// lookahead on `[\p{L}\p{N}]`, differing from it on the same four fillers;
// lib/blog-article's reading time counts a word by it too (its `wordsIn`).
// RECORDED, the owner's call (round 2's accessibility review, 2026-10-21): the
// rule takes „1." as a post's title or as a subheading, where a digit names
// nothing in the page's outline — the lever is letters for the outline's
// headings and digits only for a figure's label and a tag.
//
// ── FINISHED TEXT — a WELL-FORMED string (no lone surrogate) that SHOWS
// something (`hasVisibleText`) with no white space at either end (`trim()`
// leaves it as it is): what the blog's two parsers ask of every text of their
// JSON (lib/blog's and lib/blog-article's `isFinishedText` checks), moved here
// from their two byte-identical copies of `isText` (round 1, §4's sharing
// table's first row). Well-formed since round 2 (2026-10-21, the typescript
// review): a lone surrogate — JSON's `"\ud800"` escape writes one — is a code
// point outside THE UNSEEN SET, so a text of one passed as text that shows,
// and the page printed U+FFFD in its place — lib/share's words besides, which
// `encodeURIComponent` throws on. `isFinishedText` is a TYPE GUARD onto
// `FinishedText`, a branded string: a guard onto a bare `string` would narrow
// the FALSE branch too —
// on a `string | number` argument to `number`, a string the check refused
// then typed as no string at all (the round-1 typescript review, measured) —
// while no value of any type is assignable to the brand but through the
// guard, so the false branch keeps every type it had. `whyUnfinished` says
// WHICH condition failed, the first in this order — it is not a string, it
// is not well-formed, it shows nothing, or it has white space at an end —
// with the value `spelled`, for the refusal. The end rule is `trim()`'s,
// white space alone: an invisible character at an end that is no white space
// — the presentation selector U+FE0F closing a red heart, U+2764, drawn as an
// emoji — keeps a text finished, as an emoji may close a title.
//
// ── THE TWO OTHER USES.
//   · `withoutInvisible` reads a text AS A READER SEES IT, for a comparison
//     or a scan: every character of the set that is no white space is
//     DROPPED — the controls, the default-ignorable characters (the
//     byte-order mark U+FEFF among them, white space to `\s` though drawn as
//     nothing) — but for the ones an engine draws as a BLANK GAP, each of
//     which becomes a SPACE; white space is KEPT, for each caller to read its
//     own way (the CMSR scan and the blog's two data tests read a run of it as
//     one space). So two texts that differ only by a character drawn as
//     nothing compare equal, a banned phrase split by one is read whole, and
//     one whose words a gap parts is read as words, as the eye reads it („Cea",
//     the braille blank, „mai" reads „Cea mai"; until round 2 of the module's
//     review, 2026-10-21, it read „Ceamai"). THE BLANK GAPS (GAPS, below),
//     MEASURED in that round — Playwright's Chromium, WebKit and Firefox on
//     macOS, every character of the set that is no white space and no
//     control, the page's face and four generic ones: a character some engine
//     draws as a blank width of at least a quarter of an em and none draws ink
//     for — the braille blank U+2800 (0.68 em in all three), the Hangul
//     fillers U+3164 (0.85 em) and U+FFA0 (0.5 em, both in Chromium alone)
//     and the interlinear annotation characters U+FFF9–U+FFFB (0.6 em in
//     Chromium and Firefox). Not U+115F and U+1160, the other two fillers: no
//     width in any engine (THE LETTER RULE's placeholder). Nor a CONTROL
//     (measured on NEL and BEL): Chromium draws NEL as a blank em and BEL as a
//     third of one, WebKit each as a box, Firefox nothing — so a control is
//     DROPPED, and a banned word split by one is read whole (the CMSR scan
//     holds it). A value that is no string is a TypeError naming it `spelled`:
//     a function that hands back a string has no string to hand back for it,
//     and read as the word „undefined", or as nothing, it would pass a scan.
//   · `spelled` writes any value for an error message: a string in double
//     quotes, every character of the set but the plain space — a line feed, a
//     no-break space, a zero-width space, NEL, the braille blank — by its code
//     point, `\u{200B}`, upper-case and at least four digits, so the quote of
//     a blank text shows what it holds; a lone surrogate the same way
//     (`\u{D800}`, ONE escape style — never JSON's lower-case `\ud800`); a
//     double quote and a backslash escaped, every other character as itself,
//     an astral one whole. A value that is no string is named BY ITS TYPE,
//     never by running its own code (sections/PostCard's `quoted`, the
//     precedent): a number or a boolean as written (-0 as „-0"), null and
//     undefined as written, anything else as `<bigint>`, `<symbol>`,
//     `<function>` or `<object>` — JSON.stringify would call an object's
//     `toJSON` and its getters, print a symbol or a function as nothing, and
//     throw on a BigInt.
//
// ── WHAT NONE OF THEM CAN KNOW: whether the page's FONT carries a character
// (a glyph the face lacks still draws, as a fallback or a box), and what an
// engine draws for a character of the set no font of the machine carries —
// THE LETTER RULE's placeholder over U+115F, a box in WebKit for a Mongolian
// variation selector, in Chromium for a shorthand format control (U+1BCA0;
// measured, round 2). And a combining mark alone SHOWS — it draws, on a dotted
// circle or on nothing — as a digit does: `hasVisibleText` asks for something
// seen, never for words; the letter and the word rules are the ones that ask
// for words. Nor do the tests read what a text MEANS.
//
// ── ITS READERS (round 2, 2026-10-21, export by export). At BUILD:
// lib/blog's and lib/blog-article's parsers — `isFinishedText` on every text
// of the blog's JSON, `whyUnfinished` and `spelled` in the refusals;
// `hasVisibleLetter` on every alt that describes (lib/blog-article's
// `parseAlt`, and lib/blog's `isPostAlt` for a post's picture, whose "" is a
// decorative one); `hasVisibleWord` on every label, and in lib/blog-article's
// reading-time count. lib/json-shape quotes a key it refuses `spelled`, and
// lib/share refuses a share text by `whyUnfinished`. At RENDER, which on this
// site is `next build`, three sections, each quoting what it refuses
// `spelled`: sections/BeforeAfter (a pair's headings show a word on both
// halves, `hasVisibleWord`, and its notes text, `hasVisibleText` — or each
// part is empty on both), sections/PostProse (a subheading that shows no
// word, `hasVisibleWord`, and a paragraph that shows nothing,
// `hasVisibleText`, are refused) and sections/PostPhoto (an alt with no
// visible letter, `hasVisibleLetter`; a heading with no word,
// `hasVisibleWord`; a note that shows nothing, `hasVisibleText`). And the
// tests: the CMSR scan reads every string `withoutInvisible`; the blog's two
// data tests read every text through tests/unit/seen-text.ts — `seenAs`, the
// text as `withoutInvisible` leaves it, composed, its spaces read as one, to
// compare two texts, and `invisibleInside`, which finds a character
// `withoutInvisible` would drop or part the words at — and quote what they
// refuse `spelled`; the blog's data test asks lib/blog's own `isPostAlt` of
// a post's picture, and the article data test a `hasVisibleLetter` of a
// heading-less pair's alt after its before or after word.
//
// ── NOT ADOPTED, RECORDED (round 1, 2026-10-21). PostGallery's captions test
// keeps its own `trim() === ''`: it is that test's reader checking the
// article's SHAPE, and a blank caption read as „the shape moved" would
// mislabel what `parseArticle` already refuses at build. And four readers
// outside this lane ask the old `trim()` question still, each the day it is
// touched: the 24 glyph and flag atoms (src/assets/glyphs and flags), whose
// `ariaLabel.trim() !== ''` gives `role="img"` a silent name for a label of
// invisible characters; the reviews', prices' and locales' data tests, which
// count `trim().length`; and lib/initials' `/^\p{L}{2}$/u`, which takes two
// Hangul fillers for two letters behind its compile-time type.

/** THE UNSEEN SET (the header): white space, the controls, the
 *  default-ignorable characters, the braille blank and the interlinear
 *  annotation characters — the body of a character class, spelled once, every
 *  invisible character by its escape. */
const UNSEEN = String.raw`\s\p{Cc}\p{Default_Ignorable_Code_Point}\u{2800}\u{FFF9}-\u{FFFB}`;

/** A character that SHOWS: none of THE UNSEEN SET. */
const VISIBLE = new RegExp(`[^${UNSEEN}]`, 'u');

/** A LETTER that shows: any script's, none of THE UNSEEN SET (THE LETTER RULE). */
const VISIBLE_LETTER = new RegExp(String.raw`(?![${UNSEEN}])\p{L}`, 'u');

/** A LETTER OR A DIGIT that shows (THE WORD RULE). */
const VISIBLE_WORD = new RegExp(String.raw`(?![${UNSEEN}])[\p{L}\p{N}]`, 'u');

/** One character of THE UNSEEN SET, the whole string — what `spelled` writes
 *  by its code point. */
const UNSEEN_CHARACTER = new RegExp(`^[${UNSEEN}]$`, 'u');

/** Every character of THE UNSEEN SET but the white space a reader sees as a
 *  space: every default-ignorable one — U+FEFF too, white space to `\s`
 *  though drawn as nothing — and every other one `\s` does not hold. What
 *  `withoutInvisible` drops — or, for a blank gap (GAPS), reads as a space. */
const INVISIBLE = new RegExp(
  String.raw`\p{Default_Ignorable_Code_Point}|(?!\s)[${UNSEEN}]`,
  'gu',
);

/** THE BLANK GAPS (the header's THE TWO OTHER USES): the characters of THE
 *  UNSEEN SET that some engine draws as a blank width and none draws ink for,
 *  measured — the braille blank, two Hangul fillers and the interlinear
 *  annotation characters. Each a character class's body, by its escape. */
const GAPS = String.raw`\u{2800}\u{3164}\u{FFA0}\u{FFF9}-\u{FFFB}`;

/** One of THE BLANK GAPS, the whole string. */
const GAP = new RegExp(`^[${GAPS}]$`, 'u');

/**
 * Does `text` show anything? True when it is a string holding at least one
 * character outside THE UNSEEN SET (the header) — so false for an empty
 * string, for spaces, no-break spaces and line breaks alone, for a zero-width
 * space, a soft hyphen, a word joiner, a variation selector, a Hangul filler,
 * a control character or the braille blank alone; true for a letter, a digit,
 * a mark or a sign. False for a value that is no string: `RegExp.test` would
 * read `undefined` as the word „undefined".
 */
export function hasVisibleText(text: string): boolean {
  return typeof text === 'string' && VISIBLE.test(text);
}

/**
 * Does `text` show a letter's worth? True when it is a string holding at
 * least one letter, of any script, outside THE UNSEEN SET (the header's THE
 * LETTER RULE) — so false for a dot, a dash, a number, a mark alone and for
 * a Hangul filler (U+115F, U+1160, U+3164, U+FFA0), with or without a mark
 * beside it; true for „Înainte", „ș", „Ψ". Every text it accepts also passes
 * `hasVisibleText`. False for a value that is no string.
 */
export function hasVisibleLetter(text: string): boolean {
  return typeof text === 'string' && VISIBLE_LETTER.test(text);
}

/**
 * Does `text` show a word's worth — a letter or a digit? True when it is a
 * string holding at least one letter or digit, of any script, outside THE
 * UNSEEN SET (the header's THE WORD RULE) — so true for „Înainte" and for
 * „2019", false for „.", „…", „🦷" and a Hangul filler. Every text it accepts
 * also passes `hasVisibleText`. False for a value that is no string.
 */
export function hasVisibleWord(text: string): boolean {
  return typeof text === 'string' && VISIBLE_WORD.test(text);
}

/** The brand only `isFinishedText` puts on a string (the header's FINISHED
 *  TEXT): declared, never created — it exists in the types alone. */
declare const FINISHED: unique symbol;

/** A string `isFinishedText` has passed: it is well-formed, shows something
 *  and has no white space at either end (the header's FINISHED TEXT).
 *  Branded, so that the guard narrows nothing on its false branch. */
export type FinishedText = string & { readonly [FINISHED]: true };

/** Which condition of FINISHED TEXT `value` breaks, the first in the order
 *  they are asked — or `undefined` when it breaks none. */
function flawOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return 'it is not a string';
  if (!value.isWellFormed()) return 'it is not well-formed (a lone surrogate)';
  if (!hasVisibleText(value)) return 'it shows nothing';
  if (value.trim() !== value) return 'it has white space at its start or end';
  return undefined;
}

/**
 * Is `value` FINISHED text — a well-formed string that shows something
 * (`hasVisibleText`) with no white space at either end (the header's FINISHED
 * TEXT)? A type guard onto the branded `FinishedText`, so a refused value
 * keeps its type.
 */
export function isFinishedText(value: unknown): value is FinishedText {
  return flawOf(value) === undefined;
}

/**
 * Why `value` is no finished text, for a refusal's message — „it is not a
 * string", „it is not well-formed (a lone surrogate)", „it shows nothing" or
 * „it has white space at its start or end", the first that holds, then
 * „, got " and the value `spelled`: „it shows nothing, got "\u{200B}"" — or
 * `undefined` when it IS finished text (`isFinishedText`).
 */
export function whyUnfinished(value: unknown): string | undefined {
  const flaw = flawOf(value);
  return flaw === undefined ? undefined : `${flaw}, got ${spelled(value)}`;
}

/**
 * `text` as a reader sees it, for a comparison or a scan: every character of
 * THE UNSEEN SET that is no white space DROPPED — the controls, the
 * default-ignorable characters (U+FEFF among them) — but each blank gap
 * (GAPS: the braille blank, two Hangul fillers, the annotation characters)
 * read as ONE SPACE, and white space KEPT, for the caller to read (the
 * header's THE TWO OTHER USES). Throws a TypeError naming a value that is no
 * string, `spelled`.
 */
export function withoutInvisible(text: string): string {
  if (typeof text !== 'string') {
    throw new TypeError(
      `withoutInvisible: expected a string, got ${spelled(text)}`,
    );
  }
  return text.replace(INVISIBLE, (character) =>
    GAP.test(character) ? ' ' : '',
  );
}

/** A code point as `spelled` writes it: `\u{200B}` — upper-case, at least
 *  four digits. */
const codePointOf = (codePoint: number): string =>
  `\\u{${codePoint.toString(16).toUpperCase().padStart(4, '0')}}`;

/**
 * `value` spelled for an error message (the header's THE TWO OTHER USES): a
 * string in double quotes, every character of THE UNSEEN SET but the plain
 * space and every lone surrogate by its code point (`\u{200B}`, `\u{D800}`),
 * a double quote and a backslash escaped; any other value BY ITS TYPE, never
 * by running its code — a number or a boolean as written, null and undefined
 * as written, else `<bigint>`, `<symbol>`, `<function>` or `<object>`.
 */
export function spelled(value: unknown): string {
  switch (typeof value) {
    case 'string': {
      let quote = '"';
      // A string iterates by code point: an astral character comes whole, a
      // lone surrogate alone.
      for (const character of value) {
        const codePoint = character.codePointAt(0) ?? 0;
        if (character === '"' || character === '\\') {
          quote += `\\${character}`;
        } else if (
          character !== ' ' &&
          (UNSEEN_CHARACTER.test(character) ||
            (codePoint >= 0xd800 && codePoint <= 0xdfff))
        ) {
          quote += codePointOf(codePoint);
        } else {
          quote += character;
        }
      }
      return `${quote}"`;
    }
    case 'number':
      return Object.is(value, -0) ? '-0' : String(value);
    case 'boolean':
      return String(value);
    case 'undefined':
      return 'undefined';
    default:
      return value === null ? 'null' : `<${typeof value}>`;
  }
}
