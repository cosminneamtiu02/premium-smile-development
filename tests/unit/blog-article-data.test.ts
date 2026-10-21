import { Buffer } from 'node:buffer';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { locales, type Locale } from '../../src/i18n/locales';
import { posts } from '../../src/lib/blog/blog';
import {
  articleAuthor,
  articles,
  parseArticle,
  readingMinutes,
  type Article,
  type ArticleBlock,
  type ArticleEntry,
  type ArticleImage,
  type ArticlePair,
} from '../../src/lib/blog-article/blog-article';
import { doctors } from '../../src/lib/team/team';
import {
  hasVisibleLetter,
  spelled,
  withoutInvisible,
} from '../../src/lib/visible-text/visible-text';
import { invisibleInside, seenAs } from './seen-text.ts';

// THE BLOG'S SHIPPED ARTICLES — what src/content/blog/articles/ must hold
// beyond the shape lib/blog-article's `parseArticle` already refuses at build
// time (CLAUDE.md §15.39 round 4, 2026-10-14) — in EVERY LANGUAGE since
// 2026-10-15, when every article came to be written in all five (lib/blog-
// article's EVERY LANGUAGE, IN ONE FILE):
//   · THE FOLDER AND THE REGISTRY AGREE, both ways: a file nobody registered
//     is an article that never ships, and a registered slug with no file is a
//     dangling line (lib/blog-article's THE REGISTRY) — and every file, read
//     again under its own name, IS the article registered under that name, so
//     a registry line whose key imports another article's file fails here;
//   · every picture — a photo's, a before/after's two, a gallery's cards —
//     exists under public/ and is wide enough, in every language's article,
//     so a dense screen is never served an upscaled picture: a half of a
//     pair or a gallery card at least 1080 pixels wide, about twice the
//     widest either is ever drawn (a stacked before/after half stays under
//     its own container's 32rem step, a gallery card under the carousel's
//     20rem cap); a PHOTO at least THE PHOTO FLOOR, derived below — a photo
//     is drawn as wide as the article, so the 1080 floor does not cover it;
//   · the owner's D-DASH wording rule on every word a visitor reads, in every
//     language (no spaced dash, no em or en dash inside a sentence — tests/
//     unit/hero-slides-data.test.ts's DASH, widened here: DASH, below): the
//     prose, the subheadings, every caption, every heading and note of a
//     photo or a pair, and every alt;
//   · every language its OWN words: no paragraph, no note, no picture's alt
//     and no conclusion is another language's, which is what an untranslated
//     copy-paste looks like (lib/blog's data test holds a post's titles and
//     summaries to the same rule) — compared as a reader SEES them
//     (tests/unit/seen-text.ts's `seenAs`), so a copy that differs only by
//     an invisible character, a no-break space, a blank gap or a diacritic
//     composed another way is still the same words (until round 1 of
//     lib/visible-text's review, 2026-10-21, the check compared the raw
//     strings, and such a copy passed it). A NOTE is held to it like a
//     paragraph — a sentence written for the reader in the article's voice,
//     so an untranslated one is that copy-paste — and so is every ALT, in the
//     order the article shows its pictures (since 2026-10-20): a description,
//     never a label, and the one text a sighted proofreader never sees, so a
//     Romanian alt pasted into the German words would be spoken on the German
//     page under its lang="de" (SC 3.1.2) with nobody the wiser. The short
//     labels stay out, every subheading, caption and photo or pair heading:
//     a label may honestly read the same in two languages (a name, „Implant",
//     "Panorama");
//   · a before/after pair says which half is which, to every reader: WITH
//     headings, its two headings differ in what a reader SEES, in every
//     language — compared as `seenAs` reads them, so „Înainte" beside
//     „Înainte" and a zero-width space is refused as the same word twice;
//     WITHOUT headings, its alts open on the language's before and after
//     words (`HALVES`) — and go on to DESCRIBE the half: words with a letter
//     that shows after the prefix, since the prefix alone holds letters, and
//     „Înainte: ." passed every rule until round 1 of lib/visible-text's
//     review (2026-10-21). sections/BeforeAfter checks neither — the
//     caller's duty, written on its `images` and `headings` (the round-2
//     review, 2026-10-20). A heading, a note, a caption, a paragraph or a
//     conclusion that shows NOTHING never reaches this file: `parseArticle`
//     refuses it at build, by lib/visible-text's `isFinishedText`, a label of
//     marks alone by its `hasVisibleWord`, and an alt with no letter that is
//     drawn by its `hasVisibleLetter`;
//   · no INVISIBLE character stands INSIDE the words a visitor reads or
//     hears (tests/unit/seen-text.ts's `invisibleInside`, shared with the
//     post data test since round 2 of lib/visible-text's review): „Peri" + a
//     zero-width space + „uța" shows „Periuța", passes every rule of the
//     parser and splits the word for search, a screen reader's spelling and
//     the CMSR scan's source alike. Invisible is what lib/visible-text's
//     `withoutInvisible` drops or reads as a space — the default-ignorable
//     characters, the controls, the blank gaps — but the ones that BUILD an
//     emoji: the zero-width joiner between two pictographs, a variation
//     selector after an emoji's base, a keycap's selector and a subdivision
//     flag's tags (the helper lists them, and the two it names and does NOT
//     take: the soft hyphen U+00AD and the zero-width non-joiner U+200C).
//     None ships today (round 1 and round 2, 2026-10-21, measured);
//   · every article's author is one of lib/team's doctors, the name spelled
//     as lib/team spells it in Romanian — the one spelling a post's author is
//     written in (lib/blog-article's THE AUTHOR; the module checks it at load
//     too, here it is a named failure per article);
//   · the reading time stays a reading time — 1 to 60 minutes in every
//     language — and it is the time its post's card announces: the card AND
//     the article page print the post's hand-typed `readingMinutes` (lib/blog,
//     CLAUDE.md §15.39 round 2; lib/blog-article's READING TIME), and the
//     minutes the article's own words take are held to it — EQUAL in
//     Romanian, the language the article is written in first, and within ONE
//     minute in each other language, since a translation runs longer or
//     shorter than its source and one number on the card is every language's.
//     An edit to the article that moves its count past that fails CI until
//     the post's field follows.
// The CMSR scan (tests/unit/cmsr-scan.test.ts) reads every paragraph,
// subheading, caption, heading, note, alt and conclusion of the same list, in
// every language.
//
// In the node `unit` project rather than beside the module: the checks read
// the file system. The FUNCTIONS are pinned beside the module, in
// src/lib/blog-article/blog-article.test.ts.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const ARTICLES_DIR = join(ROOT, 'src/content/blog/articles');

/**
 * D-DASH: a spaced dash of any kind, or an em/en dash anywhere, inside a
 * sentence. „Any kind" is every dash Unicode files as one (`\p{Pd}`: the
 * hyphen-minus, the hyphen U+2010, the non-breaking hyphen U+2011, the figure
 * dash U+2012, the en and em dashes …) and the minus sign U+2212, which
 * passes for one (round 2 of lib/visible-text's review: the old class,
 * hyphen-minus, en and em dash alone, let a spaced U+2010 to U+2012 or U+2212
 * through). WIDENED IN THE BLOG'S TWO DATA TESTS ALONE — NOT ADOPTED,
 * recorded: the older tests keep the narrow form, each the day it is touched
 * — tests/unit/hero-slides-data.test.ts, whose DASH this was, team-data's
 * copy of it, and privacy-parity's own two patterns.
 */
const DASH = /\s[\p{Pd}\u{2212}]\s|[\u{2013}\u{2014}]/u;

/** A half of a pair's picture and a gallery card's: about twice the widest either is drawn (the header). */
const MIN_PICTURE_WIDTH = 1080;

/** sections/PostPage's THE MEASURE, 42rem: a photo is drawn as wide as the article. */
const MEASURE_PX = 672;

/**
 * ui/Container's THE BAND SCALE at its widest: the column capped at 96rem,
 * 1536px, over the 1106px reference — the design pixel every length of the
 * article is drawn in on a laptop or desktop.
 */
const LARGEST_BAND_SCALE = 1536 / 1106;

/** A dense laptop or desktop screen: two device pixels to the CSS pixel. */
const DENSITY = 2;

const MINUTES = { min: 1, max: 60 } as const;
/** How far a translation's reading time may stray from its post's — one minute. */
const MINUTES_ACROSS_LANGUAGES = 1;

/** A `const NAME = '…';` of a source text, its string on the next line too. */
function constantOf(source: string, name: string): string {
  const value = new RegExp(`\\bconst ${name} =\\s*'([^']*)';`).exec(
    source,
  )?.[1];
  if (value === undefined) {
    throw new Error(`no \`const ${name} = '…'\` — it moved.`);
  }
  return value;
}

/** sections/PostConclusion, read as text: its CIRCLE, SIGNATURE and NAMES. */
const CONCLUSION = readFileSync(
  join(ROOT, 'src/components/sections/PostConclusion/PostConclusion.tsx'),
  'utf8',
);

/** A count of spacing steps in one of sections/PostConclusion's constants,
 *  the first group `pattern` captures — or a named failure: a pattern that
 *  misses (the class respelled) must never read as a silent NaN.
 *  IT RUNS AT IMPORT (round 3, the typescript review): RESERVE_STEPS and
 *  BASIS_STEPS below are module constants, and the specialty rows' titles
 *  read the ceiling while Vitest collects them, so a respelled class fails
 *  this WHOLE file under that one named error — every article check with it,
 *  not this block's alone. Recorded, not changed: confining the failure
 *  would move the two constants, the ceiling and `wordsOverBasis` into a
 *  describe of their own. */
function stepsIn(constant: string, pattern: RegExp, what: string): number {
  const found = pattern.exec(constantOf(CONCLUSION, constant))?.[1];
  const steps = Number(found);
  if (found === undefined || !Number.isFinite(steps)) {
    throw new Error(
      `sections/PostConclusion's ${constant}: no ${what} (${String(pattern)}) — it moved.`,
    );
  }
  return steps;
}

/**
 * THE SIGNATURE'S RESERVE, in spacing steps — what sections/PostConclusion's
 * circle leaves the author's name and specialty wherever it can still give
 * way (its THE CIRCLE): the steps its clamp takes off the caption's width,
 * less the signature's own gap. Read off the component.
 */
const RESERVE_STEPS =
  stepsIn(
    'CIRCLE',
    /calc\(100%_-_var\(--spacing\)\*(\d+(?:\.\d+)?)\)/,
    'clamp taking steps off the caption',
  ) - stepsIn('SIGNATURE', /(?:^|\s)gap-(\d+(?:\.\d+)?)(?:\s|$)/, 'gap');

/**
 * THE SIGNATURE'S BASIS, in spacing steps — the names' flex basis, and so the
 * NARROWEST their column ever is beside the circle: the signature wraps the
 * names under the circle, at the caption's whole width, wherever the circle,
 * the gap and the basis do not fit side by side (sections/PostConclusion's
 * UNDER THE FLOOR, THE NAMES WRAP), and beside it they grow from the basis.
 * So the basis, not the reserve, is the line every word of a specialty must
 * fit whole. Half a step under the reserve. Read off the component, so the
 * bound below follows it.
 */
const BASIS_STEPS = stepsIn(
  'NAMES',
  /(?:^|\s)basis-\[calc\(var\(--spacing\)\*(\d+(?:\.\d+)?)\)\](?:\s|$)/,
  'flex basis',
);

/** The reserve and the basis in px at the default root: a spacing step is
 *  0.25rem, 4px. Inside THE BAND SCALE the step and the specialty's 14px are
 *  redrawn in the same design pixel, and a larger or smaller root scales
 *  both alike, so the count below is the same in every frame. */
const RESERVE_PX = RESERVE_STEPS * 4;
const BASIS_PX = BASIS_STEPS * 4;

/**
 * THE SPECIALTY'S CHARACTER, with SC 1.4.12's spacing on. The specialty is
 * ui/Eyebrow's one step — 14px JetBrains Mono, `tracking-widest`, uppercased
 * by CSS — and a monospace face gives every character one advance: 0.6em of
 * glyph, 8.4px, and 0.1em of tracking, 1.4px — the 9.8px mono capital the repo
 * records (tests/unit/team-data.test.ts, measured on the built Team page). A
 * reader's SC 1.4.12 letter spacing, 0.12em, REPLACES the tracking: 9.8 +
 * (0.12 − 0.1) × 14 = 10.08px a character. MEASURED 2026-10-20 with the real
 * face on the built German article: „KIEFERORTHOPÄDIE", 16 characters,
 * 156.8px and 161.3px — 16 × 9.8 and 16 × 10.08.
 * COPIED BY HAND, NOT READ (round 3, the typescript review): the 9.8 and the
 * 14 are written here, as the 9.8 is in tests/unit/team-data.test.ts, never
 * read off ui/Eyebrow's step — a node test cannot turn its `text-sm` and
 * `tracking-widest` into pixels without spelling Tailwind's theme a second
 * time, and the 0.6em advance is the face's own metric, in no source of this
 * repo. So a change to the eyebrow's size, its tracking or its face does not
 * move this count; the backstop is sections/PostConclusion's GermanStress
 * story, which lays every run of the widest specialty out in the real face,
 * against THE BASIS, with the spacing on.
 */
const MONO_CAPITAL = 9.8;
const EYEBROW_PX = 14;
const SPACED_CAPITAL = MONO_CAPITAL + (0.12 - 0.1) * EYEBROW_PX;

/** The most characters one word of an author's specialty may carry: what the
 *  basis holds whole with the spacing on — floor(162 / 10.08) = 16. */
const SIGNATURE_WORD_CEILING = Math.floor(BASIS_PX / SPACED_CAPITAL);

/** Where a line may break: HTML's and CSS's white space — the ASCII space,
 *  tab and line breaks. A no-break space (U+00A0, or the U+202F French sets
 *  before its colon) JOINS: a browser never breaks there, so the words on
 *  either side are one run (sections/PostCard's THE CUT RULE). */
const BREAKABLE_SPACE = /[ \t\n\f\r]+/;

/**
 * The words of a specialty that outgrow the signature's basis, each with its
 * count — empty when every word fits. A word is counted AS SHOWN, upper-cased
 * in the page's language (a German ß becomes SS, two characters), and whole
 * between the spaces a line may break at: a hyphen inside it may in fact
 * offer a break („DENTO-ALVÉOLAIRE"), so the count is the stricter reading.
 */
function wordsOverBasis(position: string, locale: Locale): string[] {
  return position
    .split(BREAKABLE_SPACE)
    .filter(Boolean)
    .map((word) => word.toLocaleUpperCase(locale))
    .filter((shown) => [...shown].length > SIGNATURE_WORD_CEILING)
    .map(
      (shown) =>
        `„${shown}" — ${[...shown].length} characters, ${([...shown].length * SPACED_CAPITAL).toFixed(1)}px with SC 1.4.12's spacing, in a ${BASIS_PX}px basis`,
    );
}

/**
 * Every doctor who may sign an article — EVERY DOCTOR LIB/TEAM LISTS, each
 * once, whether a post names them yet or not: an article is the body of a
 * post, and a post may name any of the clinic's doctors (tests/unit/
 * blog-data.test.ts holds every post's author to one of them, and lib/
 * blog-article's `articleAuthor` resolves it through lib/team), so these are
 * every article's possible signers, today's and tomorrow's. Until 2026-10-20
 * the check walked the shipped articles' authors alone — one doctor, whose
 * widest word has 14 characters, while the two 16-character words the
 * clinic's doctors carry were held only by a story's copied string — and
 * until round 3 (2026-10-21, the react and typescript reviews) every post's
 * author: all six doctors today, but a seventh no post names yet would have
 * gone unchecked until a post named them.
 */
const SIGNERS = doctors;

/** Each signer in every language — the rows the specialty check walks. */
const SIGNER_ROWS = SIGNERS.flatMap((doctor) =>
  locales.map(
    (locale) =>
      [doctor.words.ro.name, locale, doctor.words[locale].position] as const,
  ),
);

/** An article file's name: its slug, lower-case ASCII words joined by single dashes, then .json. */
const ARTICLE_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * The pixel size a PNG or JPEG declares in its OWN header — PNG: the IHDR
 * chunk's two big-endian 32-bit words right after the 8-byte signature; JPEG:
 * the first SOFn marker's height then width (16-bit each) — with no image
 * library in the loop, so the unit project stays pure Node. tests/unit/
 * team-data.test.ts's reader; this is its third copy (hero-slides-data holds
 * the second, JPEG only), filed with the §15.19 round-3 helper-promotion
 * census.
 */
function readPixelSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        throw new Error(`${path}: not a JPEG marker at byte ${offset}`);
      }
      const marker = bytes[offset + 1];
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
    throw new Error(`${path}: no SOF marker`);
  }
  throw new Error(`${path}: neither PNG nor JPEG`);
}

/** The widths the optimizer writes — next.config's `deviceSizes`, read out of
 *  its source (tests/unit/blog-data.test.ts's reader, its second copy, filed
 *  with the §15.19 round-3 helper-promotion census). */
function deviceSizes(): number[] {
  const match = /\bdeviceSizes:\s*\[([^\]]*)\]/.exec(
    readFileSync(join(ROOT, 'next.config.ts'), 'utf8'),
  );
  if (!match?.[1]) {
    throw new Error('next.config.ts: no `deviceSizes` — it moved.');
  }
  return match[1].split(',').map((size) => Number(size.trim()));
}

/**
 * THE PHOTO FLOOR. A photo is drawn as wide as the article — the measure,
 * 672px, and on a laptop or desktop that measure in THE BAND SCALE's design
 * pixel, at its widest about 933 CSS pixels — so a dense screen there asks
 * for twice that, about 1867 device pixels, and the browser fetches the
 * optimizer's next width: 1920, the widest it writes. The optimizer copies a
 * picture for every width past its own and never enlarges it (tests/unit/
 * blog-data.test.ts's THE PICTURE FLOOR, the same reasoning), so a narrower
 * photo would be served upscaled there — the Image atom's 1600px demo
 * photograph is one, and the demo shows it only as two 1080px crops among
 * its galleries' cards (public/images/demo/gallery-7.jpg and gallery-8.jpg),
 * never as a photo.
 */
function photoFloor(): number {
  const asked = MEASURE_PX * LARGEST_BAND_SCALE * DENSITY;
  const file = deviceSizes()
    .toSorted((a, b) => a - b)
    .find((size) => size >= asked);
  if (file === undefined) {
    throw new Error(`no optimizer width reaches ${asked}`);
  }
  return file;
}

const PHOTO_FLOOR = photoFloor();

/** One picture of an article: where it is, the picture, and the width its file must reach. */
type Picture = readonly [where: string, image: ArticleImage, floor: number];

/** Every picture an article shows — a photo, a before/after's two, a gallery's cards — labelled, each with its floor. */
function picturesOf(article: Article): readonly Picture[] {
  return article.blocks.flatMap((block, index): readonly Picture[] => {
    const where = `block ${index + 1} (${block.type})`;
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        return [];
      case 'gallery':
        return block.cards.map((card, n): Picture => [
          `${where}, card ${n + 1}`,
          card.image,
          MIN_PICTURE_WIDTH,
        ]);
      case 'photo':
        return [[where, block.image, PHOTO_FLOOR]];
      case 'beforeAfter':
        return [
          [`${where}, before`, block.images.before, MIN_PICTURE_WIDTH],
          [`${where}, after`, block.images.after, MIN_PICTURE_WIDTH],
        ];
    }
  });
}

/** A photo block or a pair: the two blocks whose heading and note are optional. */
type PhotoBlock = Extract<ArticleBlock, { type: 'photo' | 'beforeAfter' }>;

/** A photo's or a pair's headings and notes, labelled — whichever the block has. */
function optionalWordsOf(
  block: PhotoBlock,
  where: string,
): readonly [string, string][] {
  const out: [string, string][] = [];
  if (block.type === 'photo') {
    if (block.heading !== undefined) {
      out.push([`${where}, heading`, block.heading]);
    }
    if (block.note !== undefined) out.push([`${where}, note`, block.note]);
    return out;
  }
  for (const half of ['before', 'after'] as const) {
    if (block.headings !== undefined) {
      out.push([`${where}, ${half}, heading`, block.headings[half]]);
    }
    if (block.notes !== undefined) {
      out.push([`${where}, ${half}, note`, block.notes[half]]);
    }
  }
  return out;
}

/** Every word of an article a visitor reads or hears, labelled — every caption, heading, note and alt included. */
function wordsOf(article: Article): readonly [string, string][] {
  return [
    ...article.blocks.flatMap((block, index): readonly [string, string][] => {
      const where = `block ${index + 1} (${block.type})`;
      switch (block.type) {
        case 'paragraph':
        case 'heading':
          return [[where, block.text]];
        case 'gallery':
          return block.cards.map((card, n): [string, string] => [
            `${where}, card ${n + 1}, caption`,
            card.caption,
          ]);
        case 'photo':
        case 'beforeAfter':
          return optionalWordsOf(block, where);
      }
    }),
    ...picturesOf(article).map(([where, image]): [string, string] => [
      `${where}, alt`,
      image.alt,
    ]),
    ['conclusion', article.conclusion],
  ];
}

/** An article's own words, labelled — every paragraph, every note, every
 *  picture's alt (in `picturesOf`'s order, the order the article shows them)
 *  and the conclusion: what an untranslated copy would leave the same in two
 *  languages (the header: a note and an alt are held to it like a
 *  paragraph, the labels are not). A switch over every type, so a new one is
 *  decided here. */
function ownWordsOf(article: Article): readonly [string, string][] {
  return [
    ...article.blocks.flatMap((block, index): readonly [string, string][] => {
      const where = `block ${index + 1} (${block.type})`;
      switch (block.type) {
        case 'paragraph':
          return [[where, block.text]];
        case 'photo':
          return block.note === undefined
            ? []
            : [[`${where}, note`, block.note]];
        case 'beforeAfter':
          return block.notes === undefined
            ? []
            : [
                [`${where}, before, note`, block.notes.before],
                [`${where}, after, note`, block.notes.after],
              ];
        case 'heading':
        case 'gallery':
          return [];
      }
    }),
    ...picturesOf(article).map(([where, image]): [string, string] => [
      `${where}, alt`,
      image.alt,
    ]),
    ['conclusion', article.conclusion],
  ];
}

/** The article files in the folder — every name but the hidden ones a desktop leaves behind. */
const files = readdirSync(ARTICLES_DIR)
  .filter((name) => !name.startsWith('.'))
  .sort();

const bySlug = articles.map((entry) => [entry.slug, entry] as const);

/** French typography's narrow no-break space, spelled by its code point. */
const NARROW_NBSP = String.fromCodePoint(0x202f);

/** How a pair without headings opens its two alts, in each language. */
const HALVES: Readonly<Record<Locale, readonly [string, string]>> = {
  ro: ['Înainte:', 'După:'],
  en: ['Before:', 'After:'],
  de: ['Vorher:', 'Nachher:'],
  fr: [`Avant${NARROW_NBSP}:`, `Après${NARROW_NBSP}:`],
  it: ['Prima:', 'Dopo:'],
};

/** A before/after block. */
type PairBlock = Extract<ArticleBlock, { type: 'beforeAfter' }>;

/** An article's before/after pairs, each labelled like every other row here. */
function pairsOf(article: Article): readonly (readonly [string, PairBlock])[] {
  return article.blocks.flatMap((block, index) =>
    block.type === 'beforeAfter'
      ? [[`block ${index + 1} (${block.type})`, block] as const]
      : [],
  );
}

/** An article's before/after pairs with no headings, labelled. */
function headlessPairs(
  article: Article,
): readonly (readonly [string, PairBlock])[] {
  return pairsOf(article).filter(([, pair]) => pair.headings === undefined);
}

/** An article's before/after pairs WITH headings, labelled, with their two. */
function pairHeadings(
  article: Article,
): readonly (readonly [string, ArticlePair<string>])[] {
  return pairsOf(article).flatMap(([where, pair]) =>
    pair.headings === undefined ? [] : [[where, pair.headings] as const],
  );
}

/**
 * The own words of `entry` that two of its languages share as a reader SEES
 * them (`seenAs`) — each as „where: every language's text, spelled" — empty
 * when every language has its own. The same blocks in every language (one
 * file, the facts once), so the n-th text of each language is the same
 * paragraph's, note's or picture's.
 */
function sharedOwnWords(entry: ArticleEntry): string[] {
  const romanian = ownWordsOf(entry.languages.ro);
  const everyLanguage = locales.map((locale) =>
    ownWordsOf(entry.languages[locale]),
  );
  return romanian.flatMap(([where], index): string[] => {
    const texts = everyLanguage.map((words) => words[index]?.[1] ?? '');
    return new Set(texts.map(seenAs)).size === locales.length
      ? []
      : [`${where}: ${texts.map(spelled).join(' | ')}`];
  });
}

/** Does a half's alt say which half it is (`HALVES`) AND describe it — open on
 *  the language's word and a space, then words with a letter that shows
 *  (lib/visible-text's `hasVisibleLetter`)? The prefix alone holds letters,
 *  so the letter rule of `parseArticle` cannot see an alt that stops there. */
const saysWhichHalf = (alt: string, word: string): boolean =>
  alt.startsWith(`${word} `) && hasVisibleLetter(alt.slice(word.length + 1));

/** Every article in every language — the rows the per-language rules walk. */
const byLanguage = articles.flatMap((entry) =>
  locales.map(
    (locale) => [entry.slug, locale, entry.languages[locale]] as const,
  ),
);

/** The post an article is the body of, or a named failure. */
function postOf(slug: string): (typeof posts)[number] {
  const owner = posts.find((post) => post.slug === slug);
  if (owner === undefined) {
    throw new Error(`no post „${slug}" in src/content/blog/posts.json`);
  }
  return owner;
}

describe('the blog articles — what the page needs (src/content/blog/articles)', () => {
  it('ships articles (the checks below never pass vacuously)', () => {
    expect(articles.length).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(0);
    expect(byLanguage).toHaveLength(articles.length * locales.length);
  });

  it('names every file by a slug', () => {
    for (const name of files) expect(name).toMatch(ARTICLE_FILE);
  });

  it('registers every file in the folder, and has a file for every registered article', () => {
    const fileSlugs = files.map((name) => name.replace(/\.json$/, ''));
    const registered = articles.map((entry) => entry.slug);
    expect(
      fileSlugs.filter((slug) => !registered.includes(slug)),
      'files no line of lib/blog-article’s REGISTRY ships',
    ).toEqual([]);
    expect(
      registered.filter((slug) => !fileSlugs.includes(slug)),
      'registered articles with no file of their name',
    ).toEqual([]);
  });

  it.each(bySlug)(
    '%s: its file, read again under its own name, is the registered article in every language',
    (slug, entry) => {
      const raw: unknown = JSON.parse(
        readFileSync(join(ARTICLES_DIR, `${slug}.json`), 'utf8'),
      );
      expect(parseArticle(raw, slug)).toEqual(entry);
    },
  );

  it('shows pictures, photos among them (the picture check below never passes vacuously)', () => {
    for (const [slug, locale, article] of byLanguage) {
      const pictures = picturesOf(article);
      expect(pictures.length, `${slug} (${locale})`).toBeGreaterThan(0);
    }
    // THE PHOTO FLOOR is read somewhere: at least one shipped photo block.
    expect(
      byLanguage.some(([, , article]) =>
        article.blocks.some((block) => block.type === 'photo'),
      ),
    ).toBe(true);
  });

  it('derives THE PHOTO FLOOR — the article’s widest, about 933px, at two device pixels: the optimizer’s 1920 file', () => {
    expect(MEASURE_PX * LARGEST_BAND_SCALE).toBeCloseTo(933.27, 2);
    expect(PHOTO_FLOOR).toBe(1920);
    expect(PHOTO_FLOOR).toBeGreaterThan(MIN_PICTURE_WIDTH);
  });

  it.each(byLanguage)(
    '%s in %s: every picture — photos, before/after halves and gallery cards — exists and is wide enough',
    (_slug, _locale, article) => {
      for (const [where, image, floor] of picturesOf(article)) {
        const file = join(PUBLIC, image.src);
        expect(existsSync(file), `${where}: ${file}`).toBe(true);
        expect(
          readPixelSize(file).width,
          `${where}: ${image.src} (at least ${floor} wide)`,
        ).toBeGreaterThanOrEqual(floor);
      }
    },
  );

  it.each(byLanguage)(
    '%s in %s: holds no invisible character inside its words — but the two that build an emoji',
    (_slug, _locale, article) => {
      for (const [where, words] of wordsOf(article)) {
        expect(invisibleInside(words), `${where}: ${spelled(words)}`).toEqual(
          [],
        );
      }
    },
  );

  it('the invisible-inside rule has teeth — a word split by a character drawn as nothing is refused; the characters that build an emoji are not', () => {
    const of = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    // Refused: each splits a word a reader sees whole, or hides a control —
    // and, round 2, the characters an emoji takes where no emoji takes them,
    // and the two exceptions named and NOT taken (tests/unit/seen-text.ts).
    for (const [text, found] of [
      [`Peri${of(0x200b)}uța`, '"\\u{200B}" at character 5'],
      [`Ve${of(0xad)}nen`, '"\\u{00AD}" at character 3'],
      [`a${of(0x200d)}b`, '"\\u{200D}" at character 2'],
      [`x${of(0xfe0f)}`, '"\\u{FE0F}" at character 2'],
      [`x${of(0xfe0e)}`, '"\\u{FE0E}" at character 2'],
      [`Ca${of(0x85)}binet`, '"\\u{0085}" at character 3'],
      [`Ca${of(0x2800)}binet`, '"\\u{2800}" at character 3'],
      [`Ca${of(0x3164)}binet`, '"\\u{3164}" at character 3'],
      [`Auf${of(0x200c)}lage`, '"\\u{200C}" at character 4'],
      // A keycap's selector with no keycap after it; the keycap with no digit
      // before it; a tag after a letter, never a black flag.
      [`1${of(0xfe0f)}`, '"\\u{FE0F}" at character 2'],
      [`x${of(0xfe0f, 0x20e3)}`, '"\\u{FE0F}" at character 2'],
      [`a${of(0xe0067)}`, '"\\u{E0067}" at character 2'],
    ] as const) {
      expect(invisibleInside(text), spelled(text)).toEqual([found]);
    }
    // Kept: a woman health worker (a pictograph, the joiner, a pictograph and
    // its selector), a rainbow flag (a pictograph, its selector, the joiner,
    // a pictograph), a red heart (a pictograph and its selector), the health
    // worker again with a skin tone between her pictograph and the joiner —
    // and, round 2, a red heart in its TEXT style (the selector U+FE0E), a
    // keycap („1", its selector, the enclosing keycap U+20E3) and „#" as one,
    // England's flag (the black flag, „gbeng" in tags, the cancel tag) — and
    // white space, which a reader sees as a gap.
    for (const text of [
      `Echipa ${of(0x1f469, 0x200d, 0x2695, 0xfe0f)}`,
      of(0x1f3f3, 0xfe0f, 0x200d, 0x1f308),
      `Cu drag ${of(0x2764, 0xfe0f)}`,
      of(0x1f469, 0x1f3fd, 0x200d, 0x2695, 0xfe0f),
      `Cu drag ${of(0x2764, 0xfe0e)}`,
      `Pasul ${of(0x31, 0xfe0f, 0x20e3)}`,
      of(0x23, 0xfe0f, 0x20e3),
      `Londra ${of(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f)}`,
      `Le temps${of(0x202f)}: deux${of(0xa0)}minutes`,
    ]) {
      expect(invisibleInside(text), spelled(text)).toEqual([]);
    }
  });

  it.each(byLanguage)(
    '%s in %s: keeps every dash out of its words (D-DASH)',
    (_slug, _locale, article) => {
      for (const [where, words] of wordsOf(article)) {
        expect(DASH.test(words), `${where}: ${spelled(words)}`).toBe(false);
      }
    },
  );

  it.each(bySlug)(
    '%s: gives every language its own words — no paragraph, note, alt or conclusion is another language’s',
    (_slug, entry) => {
      // The same blocks in every language (one file, the facts once), so the
      // n-th text of each language is the same paragraph's, note's or
      // picture's.
      const romanian = ownWordsOf(entry.languages.ro);
      const everyLanguage = locales.map((locale) =>
        ownWordsOf(entry.languages[locale]),
      );
      // Never vacuous for the alts: every picture's is among the texts read.
      expect(
        romanian.filter(([where]) => where.endsWith(', alt')),
      ).toHaveLength(picturesOf(entry.languages.ro).length);
      expect(everyLanguage.map((words) => words.length)).toEqual(
        locales.map(() => romanian.length),
      );
      expect(sharedOwnWords(entry)).toEqual([]);
    },
  );

  it('the own-words check has teeth — an untranslated copy that differs only by an invisible character, a no-break space or a composed diacritic reads as the same words', () => {
    const romanian = 'Schimbă periuța la fiecare trei luni.';
    const nbsp = String.fromCodePoint(0xa0);
    // „ț" as „t" and a combining comma below (U+0326) — NFD's spelling of it.
    const decomposed = romanian.normalize('NFD');
    expect(decomposed, 'the premise: a different string').not.toBe(romanian);
    for (const copy of [
      `${romanian}${String.fromCodePoint(0x200b)}`,
      romanian.replace(' ', nbsp),
      decomposed,
      `Schimbă${String.fromCodePoint(0x2060)} periuța la fiecare trei luni.`,
    ]) {
      expect(copy, 'the premise: raw, the copy differs').not.toBe(romanian);
      expect(seenAs(copy), spelled(copy)).toBe(seenAs(romanian));
    }
    expect(seenAs('Change your brush every three months.')).not.toBe(
      seenAs(romanian),
    );
    // DROPPED BEFORE IT IS COMPOSED (round 2 of lib/visible-text's review):
    // „ț" as „t", a combining grapheme joiner (U+034F) and the comma below —
    // the joiner blocks composition, so composed first the comma would stay
    // apart after the joiner is dropped, and the copy read as other words.
    const joined = romanian.replace(
      'ț',
      `t${String.fromCodePoint(0x34f, 0x326)}`,
    );
    expect(
      withoutInvisible(joined.normalize('NFC')),
      'the premise: composed first, the comma stays apart',
    ).not.toBe(romanian);
    expect(seenAs(joined), spelled(joined)).toBe(seenAs(romanian));
    // A blank gap is a SPACE to the eye: „la", the braille blank, „fiecare"
    // reads as the two words it shows, never as one.
    expect(
      seenAs(romanian.replace(' la ', ` la${String.fromCodePoint(0x2800)}`)),
    ).toBe(seenAs(romanian));
    // …and the CHECK reads through it: the shipped article, its German
    // conclusion replaced in memory by the Romanian one with a no-break space
    // for its first space, is refused — a raw comparison would pass it.
    const [shipped] = articles;
    if (shipped === undefined) throw new Error('no shipped article');
    const { ro, de } = shipped.languages;
    const nearCopy: ArticleEntry = {
      ...shipped,
      languages: {
        ...shipped.languages,
        de: { ...de, conclusion: ro.conclusion.replace(' ', nbsp) },
      },
    };
    expect(de.conclusion).not.toBe(ro.conclusion.replace(' ', nbsp));
    expect(sharedOwnWords(nearCopy)).toEqual([
      expect.stringMatching(/^conclusion: /),
    ]);
  });

  it('shows pairs without headings (the alt rule below never passes vacuously)', () => {
    expect(
      byLanguage.flatMap(([, , article]) => headlessPairs(article)).length,
    ).toBeGreaterThan(0);
  });

  it.each(byLanguage)(
    '%s in %s: a pair without headings says which half is which, in its alts',
    (slug, locale, article) => {
      // lib/blog-article's THE PAIR IS ONE SHAPE: WITHOUT headings, the ALTS
      // say which half is which — a screen reader meets the before first, and
      // the line between the halves is decoration (G2, 2026-10-20).
      const [before, after] = HALVES[locale];
      for (const [where, pair] of headlessPairs(article)) {
        const { before: first, after: second } = pair.images;
        expect(
          saysWhichHalf(first.alt, before),
          `${slug} (${locale}), ${where}: the before alt opens on „${before} " and describes the half — ${spelled(first.alt)}`,
        ).toBe(true);
        expect(
          saysWhichHalf(second.alt, after),
          `${slug} (${locale}), ${where}: the after alt opens on „${after} " and describes the half — ${spelled(second.alt)}`,
        ).toBe(true);
      }
    },
  );

  it('the which-half rule has teeth — the prefix, a space, then words with a letter that shows', () => {
    expect(saysWhichHalf('Înainte: cabinetul de tratament', 'Înainte:')).toBe(
      true,
    );
    expect(saysWhichHalf('După: 2 periuțe', 'După:')).toBe(true);
    for (const alt of [
      // The prefix alone holds letters: `parseArticle`'s letter rule passes
      // every one of these.
      'Înainte: .',
      'Înainte: 2019',
      `Înainte: ${String.fromCodePoint(0x3164)}.`,
      `Înainte: ${String.fromCodePoint(0x200b)}…`,
      // …and these never said which half they are.
      'Înainte:cabinetul',
      'Cabinetul, înainte',
    ]) {
      expect(saysWhichHalf(alt, 'Înainte:'), spelled(alt)).toBe(false);
    }
  });

  it('shows pairs WITH headings (the told-apart rule below never passes vacuously)', () => {
    expect(
      byLanguage.flatMap(([, , article]) => pairHeadings(article)).length,
    ).toBeGreaterThan(0);
  });

  it.each(byLanguage)(
    '%s in %s: a pair with headings tells its halves apart — its two headings differ in what a reader sees',
    (slug, locale, article) => {
      // sections/BeforeAfter's `headings`, the caller's duty: each heading
      // captions its figure, so the two must tell the halves apart — and the
      // section checks it nowhere (the round-2 review, 2026-10-20). Compared
      // as SEEN: an invisible character or another kind of space never makes
      // two headings differ.
      for (const [where, headings] of pairHeadings(article)) {
        expect(
          seenAs(headings.before),
          `${slug} (${locale}), ${where}: ${spelled(headings.before)} and ${spelled(headings.after)} read as one heading twice`,
        ).not.toBe(seenAs(headings.after));
      }
    },
  );

  it('the told-apart check has teeth — the same words twice, or the same words but for an invisible character or a kind of space, are ONE heading to the eye', () => {
    const zeroWidth = String.fromCodePoint(0x200b);
    const noBreakSpace = String.fromCodePoint(0xa0);
    for (const [one, two] of [
      ['Înainte', 'Înainte'],
      ['Înainte', `Înainte${zeroWidth}`],
      ['La sosire', `La${noBreakSpace}sosire`],
    ] as const) {
      expect(seenAs(one), `${spelled(one)} and ${spelled(two)}`).toBe(
        seenAs(two),
      );
    }
    expect(seenAs('Înainte')).not.toBe(seenAs('După'));
    expect(seenAs('La sosire')).not.toBe(seenAs('În cabinet'));
  });

  it.each(bySlug)('%s: is signed by one of the clinic’s doctors', (slug) => {
    const owner = postOf(slug);
    // The name as lib/team spells it in Romanian, the one spelling a post's
    // `author` is written in — lib/team's French drops the honorific's point.
    expect(articleAuthor(owner).words.ro.name).toBe(owner.author);
  });

  it('derives THE SIGNATURE’S BASIS off sections/PostConclusion — 40.5 steps, 162px, half a step under its 41-step reserve: 16 mono capitals with SC 1.4.12’s spacing on', () => {
    // THE RULE before its numbers: the basis stays UNDER the reserve, or
    // wherever the circle gives way (figures of 280 to 320px) the names'
    // column — the reserve exactly — would be no wider than its own basis:
    // past it the names wrap under the circle, and at it an engine's rounding
    // decides (sections/PostConclusion's THE BASIS IS HALF A STEP UNDER THE
    // RESERVE). Asked first, so a basis that reaches the reserve fails here,
    // by name, before the two literals below.
    expect(BASIS_STEPS, 'THE BASIS under THE RESERVE').toBeLessThan(
      RESERVE_STEPS,
    );
    expect(RESERVE_STEPS).toBe(41);
    expect(RESERVE_PX).toBe(164);
    expect(BASIS_STEPS).toBe(40.5);
    expect(BASIS_PX).toBe(162);
    expect(SPACED_CAPITAL).toBeCloseTo(10.08, 10);
    expect(SIGNATURE_WORD_CEILING).toBe(16);
    // A missed pattern is a named failure, never a NaN that compares false.
    expect(() => stepsIn('NAMES', /nowhere-(\d+)/, 'probe')).toThrow(
      /NAMES: no probe/,
    );
  });

  it('walks every doctor lib/team lists, and every specialty a conclusion can print is a row it walks (the specialty check below never passes vacuously)', () => {
    // THE ROSTER: every doctor lib/team lists is walked, a post naming them
    // or none (SIGNERS) — the contract sections/PostConclusion's header
    // states. It holds by construction while SIGNERS is lib/team's own list,
    // and it fails the day the walk is narrowed — to the authors of today's
    // posts, say — while a doctor exists whom no post names yet.
    expect(doctors.length).toBeGreaterThan(0);
    for (const doctor of doctors) {
      expect(SIGNERS, doctor.id).toContain(doctor);
    }
    // THE SEAM: a conclusion prints the specialty of the doctor
    // `articleAuthor` resolves its post's author to, in the page's language
    // (the article route's populator: `articleAuthor(post).words[locale]`),
    // so every such string must be a row the check below walks — whichever
    // list the resolver comes to read.
    const walked = new Set(
      SIGNER_ROWS.map(([, locale, position]) =>
        JSON.stringify([locale, position]),
      ),
    );
    for (const post of posts) {
      const signer = articleAuthor(post);
      for (const locale of locales) {
        const position = signer.words[locale].position;
        expect(
          walked.has(JSON.stringify([locale, position])),
          `„${post.slug}" (${locale}): ${position}`,
        ).toBe(true);
      }
    }
  });

  it.each(SIGNER_ROWS)(
    `%s in %s: the specialty fits the signature’s basis — no word over ${SIGNATURE_WORD_CEILING} characters`,
    (doctor, locale, position) => {
      // The conclusion signs an article with its author's specialty in the
      // page's language (the route's populator), each word kept whole —
      // never split at a syllable — beside the circle; and an article may be
      // signed by any doctor lib/team lists (SIGNERS).
      expect(wordsOverBasis(position, locale), `${doctor} (${locale})`).toEqual(
        [],
      );
    },
  );

  it('the basis check has teeth', () => {
    // German „Kieferorthopädie", the widest any doctor carries today, fits;
    // a word one character longer does not, and a German ß counts as the
    // two capitals the page shows.
    expect(wordsOverBasis('Fachrichtung Kieferorthopädie', 'de')).toEqual([]);
    expect(wordsOverBasis('Fachrichtung Kieferorthopädien', 'de')).toHaveLength(
      1,
    );
    expect(wordsOverBasis('Kieferorthopädiß', 'de')).toHaveLength(1);
    expect(wordsOverBasis('Kieferorthopädis', 'de')).toEqual([]);
    // A no-break space joins: no line breaks there, so the two words are one
    // run — a U+00A0, and the U+202F French sets before its colon.
    for (const joiner of [String.fromCodePoint(0xa0), NARROW_NBSP]) {
      expect(
        wordsOverBasis(`Fachrichtung${joiner}Kieferorthopädie`, 'de'),
      ).toHaveLength(1);
    }
    expect(wordsOverBasis('Kiefer\tKieferorthopädie\nKiefer', 'de')).toEqual(
      [],
    );
  });

  it.each(byLanguage)(
    '%s in %s: takes 1 to 60 minutes to read',
    (_slug, _locale, article) => {
      const minutes = readingMinutes(article);
      expect(minutes).toBeGreaterThanOrEqual(MINUTES.min);
      expect(minutes).toBeLessThanOrEqual(MINUTES.max);
    },
  );

  it.each(bySlug)(
    '%s: takes the time its post’s card announces — in Romanian exactly, in every other language within one minute',
    (slug, entry) => {
      const owner = postOf(slug);
      const romanian = readingMinutes(entry.languages.ro);
      expect(
        romanian,
        `„${slug}": its Romanian words count ${romanian} min, its post's readingMinutes says ${owner.readingMinutes}`,
      ).toBe(owner.readingMinutes);
      for (const locale of locales) {
        const minutes = readingMinutes(entry.languages[locale]);
        expect(
          Math.abs(minutes - owner.readingMinutes),
          `„${slug}" in ${locale}: its words count ${minutes} min, its post's readingMinutes says ${owner.readingMinutes}`,
        ).toBeLessThanOrEqual(MINUTES_ACROSS_LANGUAGES);
      }
    },
  );

  it('the D-DASH scan has teeth — a spaced dash of ANY kind, the hyphen, the non-breaking hyphen, the figure dash and the minus sign among them (round 2)', () => {
    const spaced = (dash: number): string =>
      `Un titlu ${String.fromCodePoint(dash)} o idee`;
    for (const bad of [
      'Un titlu - o idee',
      'Un titlu — o idee',
      'Un–titlu',
      spaced(0x2010),
      spaced(0x2011),
      spaced(0x2012),
      spaced(0x2212),
      spaced(0x2015),
    ]) {
      expect(DASH.test(bad), spelled(bad)).toBe(true);
    }
    for (const good of [
      'Prim-plan cu instrumente',
      's-au desfăcut',
      'adu-ți periuța',
      'eine Zahnbürste mit Zwei-Minuten-Timer',
      'le week-end',
      // A non-breaking hyphen INSIDE a word joins it, as a hyphen does.
      `s${String.fromCodePoint(0x2011)}au desfăcut`,
    ]) {
      expect(DASH.test(good), spelled(good)).toBe(false);
    }
  });
});
