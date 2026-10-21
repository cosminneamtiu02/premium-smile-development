import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';
import { page, userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, for the blocks that MEASURE and COMPUTE (PostConclusion
// and PersonnelCard's precedent): the gaps, the 4:3 box, the note's ink and
// size and the subgrid's seat are what the engine draws, not class names.
// tests/setup/components.ts loads no stylesheet; every other assertion here
// reads tokens, attributes and roles, which hold with the sheet or without it.
import '@/styles/globals.css';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  POST_PHOTO_SIZES,
  PostPhoto,
  type PostPhotoContent,
  type PostPhotoImage,
  type PostPhotoProps,
} from './PostPhoto';
import source from './PostPhoto.tsx?raw';

// sections/PostPhoto — the structure and paint suite. The owner, verbatim
// (2026-10-15): "the blog image section has to have optionally a heading or
// not the image as it is now on inaite dupa as shape but wide as the article
// … and the text with note beneath also optionall" — and the note: "jsut the
// gray text on a maximum of 2 rows". Role-based queries wherever a role exists
// (§9, §13): the <figure> is a `figure`, its picture an `img` named by its alt.
//
// ── THE FIGURE'S NAME is asked of Playwright's engine, never of Testing
// Library's: dom-accessibility-api (0.5) reads a <figure> as nameless, while
// HTML-AAM's rule names it by its <figcaption> — a rule Chromium 151 does
// not apply: its own accessibility tree names such a figure "" (measured
// 2026-10-20 through the DevTools protocol; Firefox and WebKit not measured),
// and a screen reader still reads the caption inside the figure. Vitest's own
// locators (`page.getByRole`) run Playwright's role engine, which applies the
// rule (PostGallery.test.tsx's precedent) — so the naming tests below prove
// the SPEC as Playwright implements it, not what the browser's own tree
// exposes (PostPhoto.tsx's THE HEADING). Everything else is found through
// Testing Library, by role, or by structure where no role exists.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the BeforeAfter and PostCard precedent):
// next-intl's hooks throw without one, so a green render proves this section
// calls no t().
//
// ── THE PICTURE IN THIS RUNNER: the optimizer's width variants do not exist
// here (`npm run build` makes them), so the <img> 404s and the optimizer swaps
// to the original file on the error event, at a macrotask boundary. Every
// picture ATTRIBUTE is read synchronously — render, read, assert — never
// awaited (ReviewCard.test.tsx's rule); the boxes are CSS (a 4:3 box, a
// `fill` picture inside it) and never wait on the file.
//
// ── THE TYPEFACE: ONE block loads the real face — THE SUBGRID's, whose
// premise is how many LINES a heading and a note take in a 310px half, which
// is the typeface's: it injects Source Serif 4 the way PostCard.titles.test.tsx
// and BeforeAfter.scale.test.tsx do (the declaration .storybook/
// preview-fonts.css makes for Storybook, `font-display: block`, so a fallback
// is never measured) and takes it away after. Every other block reads a gap,
// a 4:3 box, a font SIZE, a weight and a line height, which do not depend on
// glyph shapes, in the runner's own fallback face — and asks the face the
// note reads in as a RELATION: the body's, whatever the body's is there.
//
// ── THE BYTE PINS are written OUT rather than imported (the ui/Eyebrow
// RECIPE convention): a silent edit to the section or to an atom fails HERE
// instead of following the code it is meant to check.

/** The Romanian demo words (§15.7, with diacritics), and the clinic's own
 *  treatment room as the picture, its alt the hero slide's (truthful). */
const IMAGE = {
  src: '/images/hero/treatment-room.jpg',
  alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
} as const satisfies PostPhotoImage;

const HEADING = 'Cabinetul de tratament';
const NOTE = 'Notă: fotografie din cabinetul nostru.';

/** A heading long enough to take three lines in a 310px half, beside
 *  HEADING's one — THE SUBGRID's premise: its 68 characters at 24px take three
 *  310px lines in the real face that block loads (measured 2026-10-20; the
 *  runner's fallback sans takes three too). */
const LONG_HEADING =
  'Înainte de igienizarea profesională, cu tartru pe fața dinspre limbă';

/** A note long enough to take two lines in a 310px half, beside NOTE's one —
 *  THE SUBGRID's other premise, asserted there in the real face (two lines
 *  and one, measured 2026-10-20): were the two notes the same height, a note
 *  seated at the end of their shared row would pass every reading unseen. */
const LONG_NOTE =
  'Notă: o fotografie din cabinetul nostru, făcută înainte de tratament.';

// THE REAL TYPEFACE, for THE SUBGRID's block alone (the header's THE
// TYPEFACE): BeforeAfter.scale.test.tsx's injection, KEEP-IN-SYNC — the
// subset served from the repo's root, `font-display: block`.
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

// THE RECIPES, written out.
/** The figure: one column, its parts 1rem apart — nothing else. */
const FIGURE = ['grid', 'grid-cols-1', 'gap-4'];
/** ui/Heading's `subhead` step on its default ink, then the heading's own
 *  four: start-aligned on the element, never hyphenated, the belt, THE
 *  SUBGRID's seat. */
const HEADING_TOKENS = [
  'font-display',
  'text-2xl',
  'font-semibold',
  'text-ink-strong',
  'text-start',
  'hyphens-none',
  'wrap-anywhere',
  'self-end',
];
const PICTURE_BOX = ['relative', 'aspect-[4/3]'];
/** ui/Image's `framed` situation: covers its box, crops, rounds 12px. */
const FRAMED_PHOTO = ['h-full', 'w-full', 'rounded-xl', 'object-cover'];
/** THE NOTE: the base step, the credo ink, the high-contrast lift, the belt —
 *  EXACTLY these: no weight, no slant, no alignment of its own. */
const NOTE_TOKENS = [
  'text-base',
  'text-ink-faint',
  'contrast-more:text-ink',
  'wrap-anywhere',
];
/** The measure's `sizes`, derived in the header (PostPhoto.scale.test.tsx
 *  re-derives every number from where it lives). */
const SIZES =
  '(min-width: 70rem) and (pointer: fine) 49vw, (min-width: 52.5rem) 42rem, (min-width: 37.5rem) 80vw, 90vw';

/** The four instances the owner listed — the props present or absent, and the
 *  tags the figure must hold for each, in DOM order. */
const INSTANCES = [
  [
    'heading and note',
    { heading: HEADING, note: NOTE },
    ['FIGCAPTION', 'DIV', 'P'],
  ],
  ['heading alone', { heading: HEADING }, ['FIGCAPTION', 'DIV']],
  ['note alone', { note: NOTE }, ['DIV', 'P']],
  ['neither', {}, ['DIV']],
] as const satisfies ReadonlyArray<
  readonly [string, Omit<PostPhotoContent, 'image'>, readonly string[]]
>;

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on (PostPhoto.scale.test.tsx's
 *  helper of the same name). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PostPhoto: no ${name}`);
  }
  return node;
};

/** How many lines an element's text is laid out on — the distinct tops of
 *  its text's boxes, read through a Range: a grid item stretched to its row
 *  is as tall as the row, whatever its text. */
const linesOf = (element: Element): number => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return new Set([...range.getClientRects()].map((box) => Math.round(box.top)))
    .size;
};

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** A token's colour, resolved by the engine through a probe — no colour is
 *  retyped here (DoctorProfile.stories.tsx's `colourOf`). */
const colourOf = (token: string): string => {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
};

const renderPhoto = (props: Partial<PostPhotoProps> = {}) =>
  render(<PostPhoto heading={HEADING} image={IMAGE} note={NOTE} {...props} />);

/** The figure's parts, reached by structure: only the figure and its picture
 *  carry a role. With both words present: caption, box, note — each checked,
 *  so a part that went missing fails here, by name. */
const partsOf = (figure: HTMLElement) => {
  const box = htmlElement(figure.children[1], 'picture box');
  return {
    caption: htmlElement(figure.children[0], 'caption'),
    box,
    note: htmlElement(figure.children[2], 'note'),
    picture: htmlElement(box.querySelector('img'), 'picture'),
  };
};

/** All three parts rendered, and found — the figure first. */
const renderParts = (props: Partial<PostPhotoProps> = {}) => {
  renderPhoto(props);
  const figure = screen.getByRole('figure');
  return { figure, ...partsOf(figure) };
};

/** A photo alone in a box of exactly `width` px, all three parts. */
const renderAt = (width: number, props: Partial<PostPhotoProps> = {}) => {
  render(
    <div style={{ width: `${width}px` }}>
      <PostPhoto heading={HEADING} image={IMAGE} note={NOTE} {...props} />
    </div>,
  );
  const figure = screen.getByRole('figure');
  return { figure, ...partsOf(figure) };
};

/** The message a render with these props throws — checked a RangeError, the
 *  section's one kind of refusal — and a failure of its own when nothing is
 *  thrown. The static render `next build` runs; the picture is IMAGE unless
 *  the props replace it. */
const refusalOf = (props: Partial<PostPhotoProps>): string => {
  try {
    renderToStaticMarkup(<PostPhoto image={IMAGE} {...props} />);
  } catch (error) {
    expect(error).toBeInstanceOf(RangeError);
    return (error as RangeError).message;
  }
  throw new Error('PostPhoto rendered what it must refuse');
};

/** THE POINTER, PARKED away from what is measured — a resting pointer is
 *  :hover (the house's park-the-pointer rule, PostCard.test.tsx's helper,
 *  KEEP-IN-SYNC). Nothing in this figure answers hover today; the park keeps
 *  a reading from ever depending on where the last file left the mouse. A
 *  REAL pointer (vitest/browser's userEvent): a synthetic event cannot move
 *  :hover. Registers the calling block's own hooks. */
const parkBeforeEach = (): void => {
  let unpark: (() => void) | undefined;
  beforeEach(async () => {
    const parking = document.createElement('div');
    parking.style.cssText = 'width: 2rem; height: 2rem';
    document.body.prepend(parking);
    await realUser.hover(parking);
    unpark = () => parking.remove();
  });
  afterEach(() => {
    unpark?.();
    unpark = undefined;
  });
};

/**
 * The section's source with its PROSE removed — what the zero-island guards
 * run against (BeforeAfter.test.tsx's mechanism): the header discusses
 * 'use client', hooks and handlers by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('PostPhoto — the four instances, one component', () => {
  it.each(INSTANCES)(
    '%s: the figure holds exactly its parts, in reading order',
    (_label, words, tags) => {
      render(<PostPhoto image={IMAGE} {...words} />);

      const figure = screen.getByRole('figure');
      expect(figure.tagName).toBe('FIGURE');
      expect([...figure.children].map((child) => child.tagName)).toEqual(tags);
      // The picture is always there, named by its alt.
      const picture = within(figure).getByRole('img', { name: IMAGE.alt });
      expect(picture).toHaveAttribute('alt', IMAGE.alt);
      // The heading, only when given — the figure's FIRST child.
      const caption = figure.querySelector('figcaption');
      if ('heading' in words) {
        expect(caption).toBe(figure.firstElementChild);
        expect(caption?.textContent).toBe(words.heading);
      } else {
        expect(caption).toBeNull();
      }
      // The note, only when given — a <p>, the figure's LAST child.
      const note = figure.querySelector('p');
      if ('note' in words) {
        expect(note).toBe(figure.lastElementChild);
        expect(note?.textContent).toBe(words.note);
      } else {
        expect(note).toBeNull();
      }
      // Nothing but the words given: no stray text anywhere.
      expect(figure.textContent).toBe(
        `${'heading' in words ? words.heading : ''}${'note' in words ? words.note : ''}`,
      );
    },
  );

  it('is NAMED BY ITS HEADING under HTML-AAM’s rule, as Playwright’s role engine applies it — Chromium 151’s own tree names it nothing (the header’s THE FIGURE’S NAME)', async () => {
    renderPhoto();

    // `exact`: the WHOLE name is the heading — a name that merely contains
    // it, as a substring, would match without it.
    const named = page.getByRole('figure', { name: HEADING, exact: true });
    await expect.element(named).toBeInTheDocument();
    await expect
      .element(named.getByRole('img', { name: IMAGE.alt }))
      .toBeInTheDocument();
  });

  it('is never named by its NOTE — a note alone leaves the figure unnamed, the note a paragraph inside it', async () => {
    render(<PostPhoto image={IMAGE} note={NOTE} />);

    await expect
      .element(page.getByRole('figure', { name: NOTE }))
      .not.toBeInTheDocument();
    const figure = screen.getByRole('figure');
    expect(figure.querySelector('figcaption')).toBeNull();
    expect(within(figure).getByText(NOTE).tagName).toBe('P');
  });

  it('invents no heading role — the caption is a figure’s label, never an outline slot', () => {
    renderPhoto();

    expect(screen.queryByRole('heading')).toBeNull();
    expect(
      screen.getByRole('figure').querySelectorAll('h1, h2, h3, h4, h5, h6'),
    ).toHaveLength(0);
  });

  it('prints NOTHING for an empty heading or note — no element, no gap (ABSENT OR EMPTY, NOTHING)', () => {
    render(<PostPhoto heading="" image={IMAGE} note="" />);

    const figure = screen.getByRole('figure');
    expect([...figure.children].map((child) => child.tagName)).toEqual(['DIV']);
    expect(figure.textContent).toBe('');
  });

  /** The refusal of a heading that names nothing, written out whole — the
   *  picture's path and the heading each quoted as lib/visible-text's
   *  `spelled` quotes them. */
  const headingRefusal = (quote: string): string =>
    `PostPhoto: the picture "${IMAGE.src}" has a heading with no letter or digit that shows (${quote}) — a caption names its picture, so it holds a word, or is absent or empty; a blank one prints an empty row over the picture, a mark alone a caption that names nothing`;

  /** The refusal of a note that shows nothing, written out whole. */
  const noteRefusal = (quote: string): string =>
    `PostPhoto: the picture "${IMAGE.src}" has a note that shows nothing (${quote}) — a note shows text, or is absent or empty; a blank one prints an empty row under the picture`;

  it.each([
    ['a heading of a space', { heading: ' ' }, headingRefusal('" "')],
    [
      'a heading of a zero-width space (U+200B)',
      { heading: String.fromCodePoint(0x200b) },
      headingRefusal('"\\u{200B}"'),
    ],
    [
      'a heading of a dot — a mark alone, no word',
      { heading: '.' },
      headingRefusal('"."'),
    ],
    [
      'a heading of a Hangul filler (U+3164) — a letter drawn as nothing',
      { heading: String.fromCodePoint(0x3164) },
      headingRefusal('"\\u{3164}"'),
    ],
    [
      'a note of a soft hyphen (U+00AD)',
      { note: String.fromCodePoint(0xad) },
      noteRefusal('"\\u{00AD}"'),
    ],
    ['a note of a space', { note: ' ' }, noteRefusal('" "')],
  ])(
    'refuses %s with a named RangeError, the part quoted `spelled` — never an empty row, never read as absent (ABSENT OR EMPTY, NOTHING)',
    (_label, part, message) => {
      // Present and not empty, so the render would print it — and it shows
      // nothing, or no word over the picture: the build stops, by name,
      // rather than draw an empty row or drop a part a composer counted
      // (round 2 of lib/visible-text's accessibility review, 2026-10-21).
      // The characters are built from code points: raw, they would show
      // nothing in this file either.
      expect(refusalOf(part)).toBe(message);
    },
  );

  it.each([
    [
      'a heading of digits alone — „2019" names a year',
      { heading: '2019' },
      'figcaption',
      '2019',
    ],
    [
      'a note of a mark alone — text that shows, a word being a heading’s rule',
      { note: '…' },
      'p',
      '…',
    ],
  ])(
    'prints %s — each part held to its own rule, never a narrower one',
    (_label, part, tag, text) => {
      render(<PostPhoto image={IMAGE} {...part} />);

      expect(
        screen.getByRole('figure').querySelector(`:scope > ${tag}`)
          ?.textContent,
      ).toBe(text);
    },
  );
});

describe('PostPhoto — the heading', () => {
  it('wears ui/Heading’s `subhead` step, then its own four — start, never hyphenated, the belt, the subgrid’s seat — and nothing else', () => {
    const { caption } = renderParts();

    expect(caption.tagName).toBe('FIGCAPTION');
    expect(tokensOf(caption)).toEqual(HEADING_TOKENS);
  });

  it('computes the `subhead` step — 24px semi-bold on a 32px line, the strong ink, start-aligned, never hyphenated, its belt on', () => {
    const { caption } = renderParts();
    const style = getComputedStyle(caption);

    expect(parseFloat(style.fontSize)).toBeCloseTo(rem(1.5), 2);
    expect(parseFloat(style.lineHeight)).toBeCloseTo(rem(2), 2);
    expect(style.fontWeight).toBe('600');
    expect(style.color).toBe(colourOf('--ink-strong'));
    expect(style.textAlign).toBe('start');
    // A CAPTION NEVER SPLITS A WORD (PostPhoto.tsx's THE HEADING): the class
    // reached the real sheet, over the site's inherited `hyphens: auto`.
    expect(style.hyphens).toBe('none');
    expect(style.overflowWrap).toBe('anywhere');
    // Tailwind spells `self-end` as flex-end, which a grid item reads as end.
    expect(style.alignSelf).toMatch(/^(flex-)?end$/);
  });
});

describe('PostPhoto — the picture', () => {
  it('fills a 4:3 box with ui/Image’s framed photograph, its alt as given', () => {
    const { box, picture } = renderParts();

    expect(tokensOf(box)).toEqual(PICTURE_BOX);
    expect(box.children).toHaveLength(1);
    expect(screen.getByRole('img', { name: IMAGE.alt })).toBe(picture);
    expect(picture).toHaveAttribute('data-nimg', 'fill');
    for (const token of FRAMED_PHOTO) {
      expect(tokensOf(picture)).toContain(token);
    }
  });

  it('loads LAZILY — never the page’s LCP — and carries no `fetchpriority`', () => {
    renderPhoto();

    const picture = screen.getByRole('img');
    expect(picture).toHaveAttribute('loading', 'lazy');
    expect(picture).not.toHaveAttribute('fetchpriority');
  });

  it('asks for THE MEASURE by default — POST_PHOTO_SIZES, the string the header derives', () => {
    renderPhoto();

    expect(POST_PHOTO_SIZES).toBe(SIZES);
    expect(screen.getByRole('img')).toHaveAttribute('sizes', SIZES);
  });

  it('hands a composer’s own `sizes` to the picture instead — and never to the figure', () => {
    const half = '(min-width: 41.25rem) 19.375rem, 90vw';
    renderPhoto({ sizes: half });

    expect(screen.getByRole('img')).toHaveAttribute('sizes', half);
    expect(screen.getByRole('figure')).not.toHaveAttribute('sizes');
  });

  it.each([
    ['an EMPTY', ''],
    ['a BLANK', ' \t '],
  ])(
    'takes %s `sizes` as none — the measure’s string, never a `sizes` the browser reads as `100vw` (ABSENT OR EMPTY, NOTHING)',
    (_label, sizes) => {
      // Handed on, an empty string reaches next/image as no `sizes` at all,
      // and a `fill` picture is then told `100vw`: every candidate from
      // 640px, the 384 file a 1× phone asks for gone; a blank one would
      // print as given, and a `sizes` that lists nothing is `100vw` to the
      // browser (the header's THE `sizes`).
      renderPhoto({ sizes });

      const picture = screen.getByRole('img');
      expect(picture).toHaveAttribute('sizes', SIZES);
      expect(picture.getAttribute('srcset')).toMatch(/\s384w(,|$)/);
    },
  );

  it.each([
    ['an empty alt', ''],
    ['an alt of spaces alone', '   '],
    ['a zero-width space alone (U+200B)', String.fromCodePoint(0x200b)],
    ['a soft hyphen alone (U+00AD)', String.fromCodePoint(0xad)],
    ['a word joiner alone (U+2060)', String.fromCodePoint(0x2060)],
    [
      'a Hangul filler alone (U+3164) — a letter, drawn as nothing',
      String.fromCodePoint(0x3164),
    ],
    [
      'a halfwidth Hangul filler beside a dot (U+FFA0)',
      `${String.fromCodePoint(0xffa0)}.`,
    ],
    ['a mark alone', '.'],
    ['a number alone', '123'],
  ])(
    'refuses %s — an alt with no visible letter describes nothing — with a RangeError naming the picture, on the static render `next build` runs',
    (_label, alt) => {
      // MEASURED in Chromium 151's own accessibility tree (2026-10-20):
      // alt="" takes the photo out of the tree, decoration; every other alt
      // here keeps it in as an image whose name says nothing about the
      // picture — unnamed or decoration to a screen reader, either way (the
      // header's THE PICTURE). The data refuses each of them first
      // (lib/blog-article's parseAlt, on lib/visible-text's
      // hasVisibleLetter); this is the section's own belt, held to the same
      // letter rule — the two Hangul fillers are the letters `\p{L}` alone
      // let through.
      const build = () =>
        renderToStaticMarkup(<PostPhoto image={{ src: IMAGE.src, alt }} />);

      expect(build).toThrow(RangeError);
      expect(build).toThrow(IMAGE.src);
      expect(build).toThrow(/unnamed or decoration/);
    },
  );

  /** The refusal, written out whole: the picture's path and its alt each
   *  quoted as lib/visible-text's `spelled` quotes them (THE PICTURE) — the
   *  path in plain double quotes, as it holds nothing to spell. */
  const refusal = (quote: string): string =>
    `PostPhoto: the picture "${IMAGE.src}" has an alt with no visible letter (${quote}) — a blog photo is information, never decoration, and an alt that describes nothing leaves it unnamed or decoration`;

  /** The message a render with this alt throws (`refusalOf`). Any value: an
   *  alt that slipped past the type (a cast, a JSON file read without its
   *  checks). */
  const refusalFor = (alt: unknown): string =>
    refusalOf({ image: { src: IMAGE.src, alt: alt as string } });

  /** Alts that hold no letter, each as the refusal quotes it — the shared
   *  speller's exact output: every character a reader would not see by its
   *  code point, upper-case and four digits at least, a lone surrogate the
   *  same way, the plain space as itself. The last six are the rows JSON
   *  quoting fails — it writes a line feed and a tab as two-letter escapes
   *  and a lone surrogate in lower case, and leaves NEL, the braille blank
   *  and U+FFF9 raw — so the copy this section kept until round 1 of
   *  lib/visible-text's review (JSON's quoting, then the white space and
   *  the default-ignorable characters by code point) turns them red, and so
   *  would any quoting of the section's own. Built from code points: raw,
   *  they would show nothing in this file either. */
  const QUOTED_ALTS = [
    ['spaces alone', '   ', '"   "'],
    [
      'a zero-width space (U+200B)',
      String.fromCodePoint(0x200b),
      '"\\u{200B}"',
    ],
    ['a soft hyphen (U+00AD)', String.fromCodePoint(0xad), '"\\u{00AD}"'],
    ['a word joiner (U+2060)', String.fromCodePoint(0x2060), '"\\u{2060}"'],
    ['a Hangul filler (U+3164)', String.fromCodePoint(0x3164), '"\\u{3164}"'],
    [
      'a halfwidth Hangul filler beside a dot (U+FFA0)',
      `${String.fromCodePoint(0xffa0)}.`,
      '"\\u{FFA0}."',
    ],
    ['a no-break space (U+00A0)', String.fromCodePoint(0xa0), '"\\u{00A0}"'],
    ['a line feed (U+000A)', String.fromCodePoint(0x0a), '"\\u{000A}"'],
    ['a tab (U+0009)', String.fromCodePoint(0x09), '"\\u{0009}"'],
    [
      'NEL, a control character (U+0085)',
      String.fromCodePoint(0x85),
      '"\\u{0085}"',
    ],
    ['the braille blank (U+2800)', String.fromCodePoint(0x2800), '"\\u{2800}"'],
    [
      'an interlinear annotation anchor (U+FFF9)',
      String.fromCodePoint(0xfff9),
      '"\\u{FFF9}"',
    ],
    ['a lone surrogate (U+D800)', String.fromCodePoint(0xd800), '"\\u{D800}"'],
  ] as const;

  it.each(QUOTED_ALTS)(
    'quotes %s in the refusal exactly as lib/visible-text’s `spelled` writes it — never a quote that looks empty',
    (_label, alt, quote) => {
      expect(refusalFor(alt)).toBe(refusal(quote));
    },
  );

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])(
    'refuses an alt that is no string at all — %s, which a pattern would read as that WORD — with the same RangeError',
    (label, alt) => {
      // The type refuses it first; a value that slipped past the type (a
      // cast, a JSON file read without its checks) must not reach the
      // picture as an alt of the letters "undefined".
      expect(refusalFor(alt)).toBe(refusal(`not a string: ${label}`));
    },
  );

  it.each([
    ['a symbol', Symbol('alt'), '<symbol>'],
    ['a BigInt', 7n, '<bigint>'],
    ['a function', () => 'Ω', '<function>'],
  ])(
    'names an alt that is %s BY ITS TYPE in the refusal — never by `String()`, which would print its value or its code',
    (_label, alt, type) => {
      // `String()` would write the symbol as „Symbol(alt)", the BigInt as
      // „7" and the function as its source; JSON's quoting would write the
      // first and the last as nothing and throw on the BigInt.
      expect(refusalFor(alt)).toBe(refusal(`not a string: ${type}`));
    },
  );

  it('names an object alt BY ITS TYPE and never runs its code — `String()` would call its own `toString`, which answers here with a letter', () => {
    // Quoted by `String()`, the refusal would run the object's own code and
    // print a letter the alt never held: „not a string: Ω".
    let calls = 0;
    const alt = {
      toString: () => {
        calls += 1;
        return 'Ω';
      },
    };

    expect(refusalFor(alt)).toBe(refusal('not a string: <object>'));
    expect(calls).toBe(0);
  });

  it.each([
    ['a letter of another script', 'Ω'],
    ['a number before the words', '2 periuțe pe raft'],
  ])(
    'lets %s through — the data’s letter rule, a visible letter of any script, never a narrower one',
    (_label, alt) => {
      const markup = renderToStaticMarkup(
        <PostPhoto image={{ src: IMAGE.src, alt }} />,
      );

      expect(markup).toContain(`alt="${alt}"`);
    },
  );

  it('keeps a space before every `vw` share — the one next/image reads to keep the small widths', () => {
    // next/image's getWidths reads `(^|\s)(1?\d?\d)vw` — a whole number that
    // opens the string or follows a space — and keeps the candidates from
    // 640 × the SMALLEST share it read. So every `vw` the string carries must
    // be one that pattern reads (THE SPACE BEFORE `49vw`, the header), and the
    // smallest must be the band scale's 49: 313.6px and up survive.
    const read = [...SIZES.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((match) =>
      Number(match[2]),
    );
    expect(read).toEqual([49, 80, 90]);
    expect(SIZES.split('vw')).toHaveLength(read.length + 1);
    expect(640 * (Math.min(...read) / 100)).toBeCloseTo(313.6, 5);
  });
});

describe('PostPhoto — the note: grey, unemphasised', () => {
  it('is a <p> wearing EXACTLY its four tokens', () => {
    const { note } = renderParts();

    expect(note.tagName).toBe('P');
    expect(tokensOf(note)).toEqual(NOTE_TOKENS);
  });

  it('computes the owner’s “gray text … absolutely no emphasis” — the credo ink, the regular weight, upright, 16px on a 24px line, the body’s face, no decoration, start-aligned', () => {
    const { note } = renderParts();
    const style = getComputedStyle(note);

    expect(style.color, 'the --ink-faint ink').toBe(colourOf('--ink-faint'));
    expect(style.color, 'not the body’s own ink').not.toBe(colourOf('--ink'));
    expect(style.fontWeight).toBe('400');
    expect(style.fontStyle).toBe('normal');
    expect(parseFloat(style.fontSize)).toBeCloseTo(rem(1), 2);
    expect(parseFloat(style.lineHeight)).toBeCloseTo(rem(1.5), 2);
    expect(style.fontFamily).toBe(getComputedStyle(document.body).fontFamily);
    expect(style.textDecorationLine).toBe('none');
    expect(style.textTransform).toBe('none');
    expect(style.letterSpacing).toBe('normal');
    // Start-aligned by the site's base rule — never justified, never centred.
    expect(style.textAlign).toBe('start');
    expect(style.overflowWrap).toBe('anywhere');
  });

  it('gives the full ink back under a request for more contrast — the compiled rule sits in `(prefers-contrast: more)` and paints the body’s ink', () => {
    // Read off the CSSOM, never by emulating the media feature: an emulated
    // feature outlives a file in the tab the browser projects share (the
    // touch-emulation lesson, tests/unit/no-touch-emulation.test.ts).
    const found: { media: string[]; color: string }[] = [];
    const walk = (rules: CSSRuleList, media: string[]): void => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          if (
            rule.selectorText === `.${CSS.escape('contrast-more:text-ink')}`
          ) {
            found.push({ media, color: rule.style.color });
          }
        } else if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, [...media, rule.media.mediaText]);
        } else if ('cssRules' in rule) {
          walk((rule as CSSGroupingRule).cssRules, media);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      walk(sheet.cssRules, []);
    }

    expect(found.length, 'the lift is compiled').toBeGreaterThan(0);
    for (const rule of found) {
      expect(rule.media).toContain('(prefers-contrast: more)');
      const probe = document.createElement('span');
      probe.style.color = rule.color;
      document.body.append(probe);
      try {
        expect(getComputedStyle(probe).color).toBe(colourOf('--ink'));
      } finally {
        probe.remove();
      }
    }
  });
});

describe('PostPhoto — the layout, measured', () => {
  parkBeforeEach();

  it.each([288, 351, 480, 672])(
    'in a %ipx box: the heading 1rem over the picture, the picture 4:3 across the figure, the note 1rem under it',
    (width) => {
      const { figure, caption, box, picture, note } = renderAt(width);

      expect(rect(figure).width).toBeCloseTo(width, 1);
      // The picture's box: the figure's whole width, three quarters as tall.
      expect(rect(box).width, 'as wide as the figure').toBeCloseTo(width, 1);
      expect(rect(box).height, '4:3').toBeCloseTo(width * 0.75, 1);
      expect(rect(picture).width).toBeCloseTo(rect(box).width, 1);
      expect(rect(picture).height).toBeCloseTo(rect(box).height, 1);
      // 1rem — the figure's gap — on both sides of the picture.
      expect(
        rect(box).top - rect(caption).bottom,
        'heading → picture',
      ).toBeCloseTo(rem(1), 1);
      expect(rect(note).top - rect(box).bottom, 'picture → note').toBeCloseTo(
        rem(1),
        1,
      );
      // Nothing runs out of the figure.
      expect(figure.scrollWidth).toBeLessThanOrEqual(figure.clientWidth);
    },
  );

  it('opens no gap for a part that is absent — the picture alone is the figure', () => {
    render(
      <div style={{ width: '480px' }}>
        <PostPhoto image={IMAGE} />
      </div>,
    );
    const figure = screen.getByRole('figure');
    const box = htmlElement(figure.firstElementChild, 'picture box');

    expect(rect(figure).height).toBeCloseTo(rect(box).height, 1);
    expect(rect(box).height).toBeCloseTo(360, 1);
  });

  it('declares no row template and places none of its parts — each lands in the next row in DOM order (THE SUBGRID)', () => {
    const { figure, caption, box, note } = renderAt(480);

    // Three implicit rows, sized by the three parts.
    expect(getComputedStyle(figure).gridTemplateRows.split(' ')).toHaveLength(
      3,
    );
    for (const part of [caption, box, note]) {
      const style = getComputedStyle(part);
      expect(style.gridRowStart).toBe('auto');
      expect(style.gridRowEnd).toBe('auto');
    }
  });
});

describe('PostPhoto — THE SUBGRID: two photos on a pair’s row tracks (sections/BeforeAfter’s arrangement, the real face)', () => {
  parkBeforeEach();

  // THE REAL FACE, for this block alone (the header's THE TYPEFACE): how many
  // lines LONG_HEADING and LONG_NOTE take in a 310px half is the premise of
  // every case below, and line breaks are the typeface's.
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
  afterAll(() => {
    injected?.remove();
    injected = null;
  });

  /** Two photos side by side, the way the pair places them: three tracks —
   *  half | a 4px line | half — and each photo spanning as many rows as it
   *  has parts, on the pair's row tracks. INLINE STYLES, never classes: the
   *  pair's own utilities are sections/BeforeAfter's to spell (Tailwind
   *  compiles every class-shaped string it scans). */
  const renderPair = (
    rowGap: number,
    before: Omit<PostPhotoContent, 'image'>,
    after: Omit<PostPhotoContent, 'image'>,
  ) => {
    const span = (words: Omit<PostPhotoContent, 'image'>): number =>
      1 + (words.heading ? 1 : 0) + (words.note ? 1 : 0);
    render(
      <div
        style={{
          width: '672px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
          columnGap: '24px',
          rowGap: `${rowGap}px`,
        }}
      >
        <PostPhoto
          image={IMAGE}
          {...before}
          style={{
            gridRow: `span ${span(before)}`,
            gridTemplateRows: 'subgrid',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: '4px',
            gridRow: `span ${Math.max(span(before), span(after))}`,
          }}
        />
        <PostPhoto
          image={IMAGE}
          {...after}
          style={{
            gridRow: `span ${span(after)}`,
            gridTemplateRows: 'subgrid',
          }}
        />
      </div>,
    );
    const [first, second] = screen.getAllByRole('figure');
    // The premise: the two figures really are subgrids.
    for (const figure of [first, second]) {
      expect(getComputedStyle(figure).gridTemplateRows).toMatch(/^subgrid/);
    }
    return [first, second] as const;
  };

  it.each([16, 24, 0])(
    'with a %ipx pair row gap: the pictures level, the SHORTER heading seated 1rem on its own picture, both notes 1rem under the pictures',
    (rowGap) => {
      const [before, after] = renderPair(
        rowGap,
        { heading: LONG_HEADING, note: NOTE },
        { heading: HEADING, note: LONG_NOTE },
      );
      const one = partsOf(before);
      const two = partsOf(after);
      // THE PREMISE, in the real face: both photos' words are set in it, and
      // the long heading and the long note really are taller — the heading by
      // more than half again, the note by a whole line. Two notes of one
      // height would leave nothing for the notes' readings below to catch: a
      // note seated at the END of the shared row would stand exactly where a
      // stretched one starts.
      for (const words of [one.caption, two.note]) {
        expect(
          getComputedStyle(words).fontFamily.startsWith(`"${SERIF}"`),
          getComputedStyle(words).fontFamily,
        ).toBe(true);
      }
      expect(rect(one.caption).height).toBeGreaterThan(
        rect(two.caption).height * 1.5,
      );
      expect(
        rect(two.note).height,
        'the long note takes two lines at least',
      ).toBeGreaterThanOrEqual(
        2 * parseFloat(getComputedStyle(two.note).lineHeight) - 0.5,
      );
      expect(linesOf(one.note), 'the short note takes one').toBe(1);

      // The two pictures share one top and one bottom.
      expect(rect(one.box).top).toBeCloseTo(rect(two.box).top, 1);
      expect(rect(one.box).bottom).toBeCloseTo(rect(two.box).bottom, 1);
      // `self-end`: the short heading sits on its picture, not at the row's top.
      for (const part of [one, two]) {
        expect(
          rect(part.box).top - rect(part.caption).bottom,
          'heading → its own picture',
        ).toBeCloseTo(rem(1), 1);
      }
      expect(rect(two.caption).top).toBeGreaterThan(rect(one.caption).top);
      // The notes' first lines level, each 1rem under its picture.
      for (const part of [one, two]) {
        expect(
          rect(part.note).top - rect(part.box).bottom,
          'picture → its own note',
        ).toBeCloseTo(rem(1), 1);
      }
    },
  );

  it.each([16, 0])(
    'keeps the figure’s own 1rem where the two photos span DIFFERENT rows — a note on one side only — with a %ipx pair row gap, no wider than that 1rem',
    (rowGap) => {
      // A wider gap adds half its excess under that note — 20px at 24
      // (PostPhoto.tsx's THE SUBGRID, its THE GAP, measured) — so only these
      // two are held.
      const [before, after] = renderPair(
        rowGap,
        { heading: HEADING, note: NOTE },
        { heading: HEADING },
      );
      const one = partsOf(before);
      // The after half has no note: its heading and its picture's box alone.
      expect(after.children).toHaveLength(2);
      const twoBox = htmlElement(after.children[1], 'after half’s picture box');

      expect(rect(one.box).top).toBeCloseTo(rect(twoBox).top, 1);
      expect(rect(one.box).bottom).toBeCloseTo(rect(twoBox).bottom, 1);
      expect(rect(one.note).top - rect(one.box).bottom).toBeCloseTo(rem(1), 1);
    },
  );
});

describe('PostPhoto — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the figure itself', () => {
    renderPhoto({ className: 'w-full' });

    expect(tokensOf(screen.getByRole('figure'))).toEqual([...FIGURE, 'w-full']);
  });

  it('wears exactly its own recipe when no className is handed in', () => {
    renderPhoto();

    const figure = screen.getByRole('figure');
    expect(tokensOf(figure)).toEqual(FIGURE);
  });

  it('spreads native props onto the figure, never onto its parts', () => {
    render(
      <PostPhoto
        heading={HEADING}
        image={IMAGE}
        note={NOTE}
        id="cabinetul-de-tratament"
        lang="ro"
        data-slot="post-photo"
      />,
    );

    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('id', 'cabinetul-de-tratament');
    expect(figure).toHaveAttribute('lang', 'ro');
    expect(figure).toHaveAttribute('data-slot', 'post-photo');
    for (const part of figure.querySelectorAll('*')) {
      expect(part).not.toHaveAttribute('data-slot');
      expect(part).not.toHaveAttribute('id');
    }
  });

  it('takes no name but its caption — a written `aria-label`, `aria-labelledby` or `title` and a `role` are reset after the spread (sections/PageHero’s belt)', async () => {
    // The props type Omits all four (the type pins below), but TypeScript
    // checks no hyphenated JSX attribute against a props type that lacks it,
    // so a written `aria-label` still compiles — the reset after the spread
    // is the belt that holds, for the two plain names too. A "presentation"
    // role would strip the figure's name and grouping; a label would replace
    // the <figcaption>'s name; and a `title` NAMES the figure in Chromium 151,
    // which names it by no caption (measured, PostPhoto.tsx's THE HEADING) —
    // Playwright's engine, reading the caption first, would never notice, so
    // the attribute itself is what this test refuses. The `title` arrives the
    // way the reset exists for, in the spread of a wider object — a plain
    // one: JSX checks a spread for no excess property — while a WRITTEN one
    // does not compile (the type pins below).
    const smuggled = { title: 'Un titlu' };
    const { container } = render(
      <PostPhoto
        heading={HEADING}
        image={IMAGE}
        note={NOTE}
        aria-label="Un alt nume"
        aria-labelledby="altundeva"
        {...smuggled}
        // @ts-expect-error — `role` is Omitted from the photo's props
        role="presentation"
      />,
    );

    // Found by its tag, so a figure that lost its role still fails HERE.
    const figure = container.querySelector('figure');
    expect(figure).not.toBeNull();
    expect(figure).not.toHaveAttribute('role');
    expect(figure).not.toHaveAttribute('aria-label');
    expect(figure).not.toHaveAttribute('aria-labelledby');
    expect(figure).not.toHaveAttribute('title');
    await expect
      .element(page.getByRole('figure', { name: HEADING, exact: true }))
      .toBeInTheDocument();
  });

  it('is never HIDDEN — a written `aria-hidden` and a spread `inert` are reset after the spread, so the figure stays in the accessibility tree', async () => {
    // Either would hide the informative picture, its alt, the caption and
    // the note from assistive technology while every part of the figure
    // stays drawn — the reason a `role` is refused, and a stronger one
    // (PostPhoto.tsx's THE HEADING). TypeScript checks no hyphenated JSX
    // attribute against a props type that lacks it, so a WRITTEN
    // `aria-hidden` compiles and the reset is the guard that holds; a written
    // `inert` does not compile (the type pins below), so it arrives the way
    // the reset exists for, in the spread of a wider object.
    const smuggled = { inert: true };
    const { container } = render(
      <PostPhoto
        heading={HEADING}
        image={IMAGE}
        note={NOTE}
        aria-hidden="true"
        {...smuggled}
      />,
    );

    // Found by its tag, so a figure the tree lost still fails HERE.
    const figure = htmlElement(container.querySelector('figure'), 'figure');
    expect(figure).not.toHaveAttribute('aria-hidden');
    expect(figure).not.toHaveAttribute('inert');
    expect(figure.inert).toBe(false);
    // In the tree, by Playwright's role engine — which leaves out whatever
    // an `aria-hidden` ancestor hides: the figure by its caption, and inside
    // it the picture by its alt.
    const named = page.getByRole('figure', { name: HEADING, exact: true });
    await expect.element(named).toBeInTheDocument();
    await expect
      .element(named.getByRole('img', { name: IMAGE.alt }))
      .toBeInTheDocument();
  });

  it('lets no markup in beside its parts — `dangerouslySetInnerHTML` is refused by the type, and one smuggled in through a spread still fails the build loudly, React’s own refusal, never a silent drop', () => {
    // The figure always holds its picture, so markup set beside it is
    // React's error (sections/BeforeAfter's precedent: no reset of its own).
    // A plain object: JSX checks a spread for no excess property.
    const smuggled = { dangerouslySetInnerHTML: { __html: '<b>Notă</b>' } };

    expect(() =>
      renderToStaticMarkup(<PostPhoto image={IMAGE} {...smuggled} />),
    ).toThrow(/dangerouslySetInnerHTML/);
  });

  it('keeps its own props off the figure — no stray attribute', () => {
    renderPhoto({ sizes: '90vw' });

    // `heading`, `image`, `note` and `sizes` are destructured, so nothing of
    // theirs rides the spread.
    expect(screen.getByRole('figure').getAttributeNames()).toEqual(['class']);
  });

  it('accepts ref as a regular prop (React 19) — it is the <figure>', () => {
    const figure = createRef<HTMLElement>();
    renderPhoto({ ref: figure });

    expect(figure.current?.tagName).toBe('FIGURE');
    expect(figure.current).toBe(screen.getByRole('figure'));
  });

  it('asks its OWN box, never the window — no viewport prefix anywhere in the section (§6.5)', () => {
    const { container } = renderPhoto();

    for (const element of [container, ...container.querySelectorAll('*')]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^(sm|md|lg|xl|2xl|max-\w+|min-\[[^\]]+\]):/);
      }
    }
  });

  it('owns no outer margin anywhere — the article’s measure owns spacing (§6.4)', () => {
    const { container } = renderPhoto();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^(@\w+:)?-?m[trblxyse]?-/);
      }
    }
  });
});

describe('PostPhoto — zero islands of its own, zero message keys', () => {
  it('ships NO client directive, calls NO hook and wires NO handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
  });

  it('imports EXACTLY the two atoms it composes, two lib MECHANICS and one lib TYPE', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // atom swapped for one with state would hydrate the whole article.
    // ui/Image is the one accepted island (its optimizer's). lib/cx and
    // lib/visible-text are React-free MECHANICS — from the second, four
    // named functions: the letter rule the alt is held to (THE PICTURE), the
    // word and the text rules a heading and a note are held to (ABSENT OR
    // EMPTY, NOTHING) and `spelled`, the refusals' quoting — never a copy of
    // any; the picture-path module arrives as a TYPE only — zero bytes. No
    // lib DATA in this tier.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/components/ui/Image/Image',
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      '@/lib/visible-text/visible-text',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{ ImagePath \} from '@\/lib\/image-path\/image-path';$/m,
    );
    expect(CODE).toMatch(
      /^import \{\s*hasVisibleLetter,\s*hasVisibleText,\s*hasVisibleWord,\s*spelled,\s*\} from '@\/lib\/visible-text\/visible-text';$/m,
    );
    // The letter rule is the shared one, never a pattern of the section's
    // own: no `\p{L}` here (the round-3 review — it lets the Hangul fillers
    // through).
    expect(CODE).not.toMatch(/\\p\{L\}/);
    // And the refusal's quoting is the shared speller, never one of the
    // section's own beside it — as the copy of sections/BeforeAfter's it
    // kept until round 1 of lib/visible-text's review: no JSON quoting, no
    // `String()` of a value, no character spelled by its code point, no
    // pattern or escape of a character, neither of that copy's two names.
    // The QUOTED_ALTS rows hold what the refusal writes; these hold that
    // nothing here writes it.
    expect(CODE).not.toMatch(/\bJSON\.stringify\b/);
    expect(CODE).not.toMatch(/\bString\(/);
    expect(CODE).not.toMatch(/\bcodePointAt\b|\.toString\(16\)|\bpadStart\b/);
    expect(CODE).not.toMatch(/\\[pu]\{/);
    expect(CODE).not.toMatch(/\b(quoted|codePointOf)\b/);
    expect(CODE).toMatch(
      /^import type \{ ComponentPropsWithRef, ReactElement \} from 'react';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('never re-spells THE BAND SCALE — it inherits the article’s, worn by sections/PostPage alone', () => {
    expect(CODE).not.toMatch(/\bband(Scale|Column)Classes\b/);
    expect(CODE).not.toMatch(/scalable:|design-scale|--scale-px/);
  });

  it('clamps no line — two lines at most is the data’s rule, never a hidden end (TWO LINES AT MOST)', () => {
    // The note's exact tokens (above) already refuse a clamp utility; this
    // reads what the engine draws: nothing cut, nothing hidden.
    const { note } = renderParts();
    const style = getComputedStyle(note);
    expect(style.overflow).toBe('visible');
    expect(style.webkitLineClamp).toBe('none');
    expect(style.textOverflow).toBe('clip');
    expect(note.scrollHeight).toBeLessThanOrEqual(note.clientHeight);
  });

  it('renders every string intact — diacritics and all — and no message key path (§8.1)', () => {
    const { container } = renderPhoto();

    expect(container.textContent).toBe(`${HEADING}${NOTE}`);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('PostPhoto — type-level pins', () => {
  it('pins the deliberate type decisions so a refactor cannot quietly widen them', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    // Content arrives as the three named parts, never as children.
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('children');
    // The content is READ-ONLY to the last field, the words optional, the
    // picture required.
    expectTypeOf<PostPhotoContent>().toEqualTypeOf<
      Readonly<{
        heading?: string;
        image: PostPhotoImage;
        note?: string;
      }>
    >();
    expectTypeOf<PostPhotoImage>().toEqualTypeOf<
      Readonly<{ src: ImagePath; alt: string }>
    >();
    // The picture lives under the optimizer's one folder (§11).
    expectTypeOf<PostPhotoImage['src']>().toEqualTypeOf<ImagePath>();
    // `sizes` is the picture's, optional, a plain string.
    expectTypeOf<PostPhotoProps['sizes']>().toEqualTypeOf<string | undefined>();
    // THE FIGURE'S NAME is no caller's: no role, no label, no title — and
    // neither is ITS PRESENCE: no `aria-hidden`, no `inert` — pinned on the
    // props TYPE, because a written hyphenated attribute compiles whatever
    // the type says (the runtime resets hold those, the fidelity block's
    // tests) — and no markup set beside the parts. Each directive below fails
    // `tsc` the day the type lets its prop through; the elements are built,
    // never rendered.
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('role');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('title');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('aria-hidden');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty('inert');
    expectTypeOf<PostPhotoProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    const refused = [
      <PostPhoto
        key="title"
        image={IMAGE}
        // @ts-expect-error — `title` is no prop of the photo
        title="Un titlu"
      />,
      <PostPhoto
        key="inert"
        image={IMAGE}
        // @ts-expect-error — nor is `inert`: not hyphenated, so the type's
        // refusal holds when it is written
        inert
      />,
      <PostPhoto
        key="markup"
        image={IMAGE}
        // @ts-expect-error — nor is markup set beside its parts
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
    ];
    expect(refused).toHaveLength(3);
    // The rest of the ARIA surface rides along.
    expectTypeOf<PostPhotoProps>().toHaveProperty('aria-describedby');
    // The figure's own surface rides along — a ref and a className.
    expectTypeOf<PostPhotoProps>().toHaveProperty('ref');
    expectTypeOf<PostPhotoProps>().toHaveProperty('className');
  });
});
