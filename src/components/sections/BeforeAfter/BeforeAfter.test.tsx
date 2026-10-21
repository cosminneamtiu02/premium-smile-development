import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { page } from 'vitest/browser';
import {
  PostPhoto,
  type PostPhotoImage,
} from '@/components/sections/PostPhoto/PostPhoto';
import type { ImagePath } from '@/lib/image-path/image-path';
import { hasVisibleWord } from '@/lib/visible-text/visible-text';
import {
  BeforeAfter,
  type BeforeAfterPair,
  type BeforeAfterProps,
} from './BeforeAfter';
import source from './BeforeAfter.tsx?raw';

// sections/BeforeAfter — the structure suite. The owner, verbatim
// (2026-10-15): "refactor it as 2 section as the blog photo and then blog
// photo turns into a before and after section" — and: "every instantiation
// possible of a inainte and dupa wher eboth left and right must be same
// instance of blog image … here headings sould be replaceble, not mandatory
// before and after and here headings should also be optional". Role-based
// queries wherever a role exists (§9, §13): each half is a `figure` and its
// picture an `img` named by its alt.
//
// ── THE FIGURE'S NAME is asked of Playwright's engine, never of Testing
// Library's: dom-accessibility-api (0.5) reads a <figure> as nameless, while
// HTML-AAM's rule names it by its <figcaption> — a rule Chromium 151 does
// not apply: its own accessibility tree names such a figure "" (measured
// 2026-10-20 through the DevTools protocol; Firefox and WebKit not
// measured), and a screen reader still reads the caption inside the figure.
// Vitest's own locators (`page.getByRole`) run Playwright's role engine,
// which applies the rule — so the naming tests below prove the SPEC as
// Playwright implements it, not what the browser's own tree exposes
// (sections/PostPhoto's suite, the same note; PostPhoto.tsx's THE HEADING).
// Everything else is found through Testing Library, by role, or by structure
// where no role exists.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the ReviewCard and PostCard precedent):
// next-intl's hooks throw without one, so a green render proves this section
// calls no t().
//
// ── STYLES ARE NOT LOADED in this file (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the section fails HERE instead of following the code it is meant
// to check. What the real stylesheet draws with them — the switch at the
// root's 32rem, the subgrid's level pictures, the phone's old positions, the
// fallback without subgrid, the band scale's design pixel — is
// BeforeAfter.scale.test.tsx's business, and the arrangement at the pinned
// windows the stories' plays'. Each HALF's own recipe — its heading, its
// picture, its note — is sections/PostPhoto's, pinned by its own suite; here
// a half is held EQUAL to a PostPhoto rendered alone with the same props.
//
// ── THE PICTURES IN THIS RUNNER: the optimizer's width variants do not exist
// here (`npm run build` makes them), so every <img> 404s and
// next-image-export-optimizer swaps to the original file on the error event,
// at a macrotask boundary. Every picture assertion is therefore SYNCHRONOUS —
// render, read, assert — never awaited (ReviewCard.test.tsx's rule).

/** The demo article's pictures (src/content/blog/articles — COPIED, never
 *  imported: a section's test reads no site data, §4), their alts the hero
 *  slides' own (truthful), Romanian with diacritics (§15.7). */
const IMAGES = {
  before: {
    src: '/images/hero/treatment-room.jpg',
    alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  after: {
    src: '/images/hero/instruments.jpg',
    alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

/** The same pictures for a pair WITHOUT headings: each alt opens on its
 *  half's word, „Înainte: " / „După: ", as the shipped article writes them —
 *  without headings the alts alone say which half is which (BeforeAfter's
 *  `images`, the caller's duty; the CI data test's rule for the articles,
 *  tests/unit/blog-article-data.test.ts). The section checks it nowhere, so
 *  this suite never hands it a heading-less pair that breaks it: a pair
 *  whose headings show nothing gets these, through `imagesFor` — the
 *  refusals' static renders too, which throw before any picture is drawn —
 *  or by name (the a11y review, 2026-10-20). */
const HEADLESS_IMAGES = {
  before: {
    src: IMAGES.before.src,
    alt: 'Înainte: cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  after: {
    src: IMAGES.after.src,
    alt: 'După: prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

const HEADINGS = {
  before: 'Înainte',
  after: 'După',
} as const satisfies BeforeAfterPair<string>;

/** Finished notes — the lead-in written, as the route hands them over. */
const NOTES = {
  before: 'Notă: fotografie din cabinetul nostru.',
  after: 'Notă: după igienizare.',
} as const satisfies BeforeAfterPair<string>;

/** Headings that are not „Înainte" / „După" — "replaceble". */
const REPLACED = {
  before: 'Ianuarie',
  after: 'Aprilie',
} as const satisfies BeforeAfterPair<string>;

/** The parts each half may have, as the instances below give them. */
type Words = Pick<BeforeAfterProps, 'headings' | 'notes'>;

/** The pictures a pair of these words is handed: the plain alts under
 *  headings that show a WORD on both halves, and otherwise — no headings, or
 *  headings that name nothing — the ones that say which half is which
 *  (lib/visible-text's `hasVisibleWord`, the section's own test of a
 *  heading). */
const imagesFor = (words: Words): BeforeAfterPair<PostPhotoImage> =>
  words.headings !== undefined &&
  hasVisibleWord(words.headings.before) &&
  hasVisibleWord(words.headings.after)
    ? IMAGES
    : HEADLESS_IMAGES;

/** THE FOUR INSTANCES — the props present or absent, how many parts each half
 *  has, and the tags each half's <figure> must hold, in DOM order. */
const INSTANCES = [
  [
    'headings and notes',
    { headings: HEADINGS, notes: NOTES },
    3,
    ['FIGCAPTION', 'DIV', 'P'],
  ],
  ['headings alone', { headings: HEADINGS }, 2, ['FIGCAPTION', 'DIV']],
  ['notes alone', { notes: NOTES }, 2, ['DIV', 'P']],
  ['neither', {}, 1, ['DIV']],
] as const satisfies ReadonlyArray<
  readonly [string, Words, 1 | 2 | 3, readonly string[]]
>;

// THE RECIPES, written out.
/** The root: its own container, nothing else of the section's. */
const ROOT = ['@container'];
/** One column, then before | the line | after at the root's @lg — the rows
 *  1rem apart, each half at the top where it is no subgrid (THE LAYOUT, THE
 *  PICTURES STAY LEVEL). */
const GRID = [
  'grid',
  'grid-cols-1',
  'gap-6',
  '@lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
  '@lg:gap-y-4',
  '@lg:items-start',
];
/** sections/PostPhoto's own figure: one column, its parts 1rem apart. */
const FIGURE = ['grid', 'grid-cols-1', 'gap-4'];
/** Each half's placement from the root's @lg, by its part count: the span
 *  and the pair's rows as its own. */
const HALF_SPAN = {
  1: ['@lg:row-span-1', '@lg:grid-rows-subgrid'],
  2: ['@lg:row-span-2', '@lg:grid-rows-subgrid'],
  3: ['@lg:row-span-3', '@lg:grid-rows-subgrid'],
} as const;
/** THE LINE, lying down, then standing from the root's @lg — EXACTLY these,
 *  in this order. Its shared half — `rounded-full bg-(--ribbon)` and the
 *  thickness step 1 — is KEEP-IN-SYNC with sections/PostConclusion's line. */
const LINE = [
  'h-1',
  'w-full',
  'rounded-full',
  'bg-(--ribbon)',
  '@lg:h-auto',
  '@lg:w-1',
  '@lg:self-stretch',
];
/** …and its span, as many rows as each half has. */
const LINE_SPAN = {
  1: '@lg:row-span-1',
  2: '@lg:row-span-2',
  3: '@lg:row-span-3',
} as const;
/** THE HALVES' `sizes`, derived in the header (BeforeAfter.scale.test.tsx
 *  re-derives every number from where it lives). */
const SIZES =
  '(min-width: 70rem) and (pointer: fine) 23vw, (min-width: 41.25rem) 19.375rem, (min-width: 37.5rem) 80vw, 90vw';

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const renderPair = (props: Partial<BeforeAfterProps> = {}) =>
  render(
    <BeforeAfter
      images={IMAGES}
      headings={HEADINGS}
      notes={NOTES}
      {...props}
    />,
  );

/** `node` as the HTMLElement it must be, or a named failure — never an
 *  unchecked cast (BeforeAfter.scale.test.tsx's check, the same name). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`BeforeAfter test: no ${name}`);
  }
  return node;
};

/** The section's boxes, reached from its root by structure — the root, the
 *  grid, and the grid's three children: none but the halves carries a role. */
const partsOf = (root: Element | null) => {
  const grid = htmlElement(htmlElement(root, 'root').firstElementChild, 'grid');
  const [before, line, after] = [...grid.children];
  return {
    grid,
    before: htmlElement(before, 'before half'),
    line: htmlElement(line, 'line'),
    after: htmlElement(after, 'after half'),
  };
};

/**
 * The section's source with its PROSE removed — what the zero-island guards
 * run against (ReviewCard.test.tsx's mechanism): the header discusses
 * 'use client', hooks and handlers by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('BeforeAfter — the four instances, every half a blog photo', () => {
  it.each(INSTANCES)(
    '%s: two figures, before then after, each holding exactly its parts in reading order',
    (_label, words, _parts, tags) => {
      const images = imagesFor(words);
      const { container } = render(<BeforeAfter images={images} {...words} />);

      const figures = screen.getAllByRole('figure');
      expect(figures).toHaveLength(2);
      const { before, after } = partsOf(container.firstElementChild);
      expect(figures).toEqual([before, after]);
      for (const [figure, side] of [
        [before, 'before'],
        [after, 'after'],
      ] as const) {
        expect(figure.tagName).toBe('FIGURE');
        expect([...figure.children].map((child) => child.tagName)).toEqual(
          tags,
        );
        // The picture is always there, named by its alt.
        expect(
          within(figure).getByRole('img', { name: images[side].alt }),
        ).toHaveAttribute('alt', images[side].alt);
        // The heading, only when the pair has headings — the figure's FIRST
        // child, its own half's words.
        const caption = figure.querySelector('figcaption');
        if ('headings' in words) {
          expect(caption).toBe(figure.firstElementChild);
          expect(caption?.textContent).toBe(words.headings[side]);
        } else {
          expect(caption).toBeNull();
        }
        // The note, only when the pair has notes — a <p>, the figure's LAST
        // child, its own half's FINISHED words.
        const note = figure.querySelector('p');
        if ('notes' in words) {
          expect(note).toBe(figure.lastElementChild);
          expect(note?.textContent).toBe(words.notes[side]);
        } else {
          expect(note).toBeNull();
        }
      }
      // Nothing but the words given: no stray text anywhere.
      expect(container.textContent).toBe(
        [
          'headings' in words ? words.headings.before : '',
          'notes' in words ? words.notes.before : '',
          'headings' in words ? words.headings.after : '',
          'notes' in words ? words.notes.after : '',
        ].join(''),
      );
    },
  );

  it.each(INSTANCES)(
    '%s: each half IS sections/PostPhoto — byte for byte the figure it renders alone with the same props, the span its placement',
    (_label, words, parts) => {
      const images = imagesFor(words);
      const { container } = render(<BeforeAfter images={images} {...words} />);
      const { before, after } = partsOf(container.firstElementChild);

      for (const [half, side] of [
        [before, 'before'],
        [after, 'after'],
      ] as const) {
        const { container: alone } = render(
          <PostPhoto
            image={images[side]}
            heading={'headings' in words ? words.headings[side] : undefined}
            note={'notes' in words ? words.notes[side] : undefined}
            sizes={SIZES}
            className={HALF_SPAN[parts].join(' ')}
          />,
        );
        expect(half.outerHTML).toBe(alone.firstElementChild?.outerHTML);
      }
    },
  );

  it('takes ANY headings — „Ianuarie" over the first picture, „Aprilie" over the second', () => {
    render(<BeforeAfter images={IMAGES} headings={REPLACED} />);

    const [before, after] = screen.getAllByRole('figure');
    expect(before.querySelector('figcaption')?.textContent).toBe('Ianuarie');
    expect(after.querySelector('figcaption')?.textContent).toBe('Aprilie');
    expect(screen.queryByText(HEADINGS.before)).toBeNull();
    expect(screen.queryByText(HEADINGS.after)).toBeNull();
  });

  it('is NAMED half by half by its own heading under HTML-AAM’s rule, as Playwright’s role engine applies it — Chromium 151’s own tree names a figure nothing (the header’s THE FIGURE’S NAME)', async () => {
    renderPair({ headings: REPLACED });

    for (const side of ['before', 'after'] as const) {
      const figure = page.getByRole('figure', {
        name: REPLACED[side],
        exact: true,
      });
      await expect.element(figure).toBeInTheDocument();
      await expect
        .element(figure.getByRole('img', { name: IMAGES[side].alt }))
        .toBeInTheDocument();
    }
  });

  it('is never named by a NOTE — without headings each half is an unnamed figure, its note a paragraph inside it', async () => {
    render(<BeforeAfter images={HEADLESS_IMAGES} notes={NOTES} />);

    for (const side of ['before', 'after'] as const) {
      await expect
        .element(page.getByRole('figure', { name: NOTES[side] }))
        .not.toBeInTheDocument();
    }
    for (const figure of screen.getAllByRole('figure')) {
      expect(figure.querySelector('figcaption')).toBeNull();
    }
  });

  it('invents no heading role — a heading is a figure’s label, never an outline slot', () => {
    const { container } = renderPair();

    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(
      0,
    );
  });
});

describe('BeforeAfter — THE PAIR IS ONE SHAPE', () => {
  /** The pair as `next build` renders it — on the server, statically — its
   *  pictures the ones its headings call for (`imagesFor`). */
  const build = (props: Partial<BeforeAfterProps>) => () =>
    renderToStaticMarkup(<BeforeAfter images={imagesFor(props)} {...props} />);

  /** The pair a refusal names: by its before picture's path, `spelled` —
   *  IMAGES' and HEADLESS_IMAGES', the same file. */
  const PAIR = `the pair whose before picture is "${IMAGES.before.src}"`;

  /** What each part must show on both halves: a heading a WORD, a note TEXT. */
  const RULE = {
    headings: 'show a letter or a digit',
    notes: 'show text',
  } as const;

  /** The refusal, written out: the pair, the rule its part breaks, then both
   *  halves' words as the section quotes them — so an article of four pairs
   *  says which pair broke it. */
  const refusal = (part: 'headings' | 'notes', quotes: string): string =>
    `BeforeAfter: ${PAIR} is one shape — its ${part} must ${RULE[part]} on both halves, or be empty on both; they are ${quotes}`;

  /** The blanks below, spelled by code point: raw, they would show nothing
   *  in this file either. */
  const NBSP = String.fromCodePoint(0xa0);
  const LINE_FEED = String.fromCodePoint(0x0a);
  const ZERO_WIDTH = String.fromCodePoint(0x200b);
  /** A Hangul filler — a LETTER (Lo) drawn as blank width — and a variation
   *  selector alone: no format characters, so until the round-2 review
   *  (2026-10-20) this section counted both as text. */
  const HANGUL_FILLER = String.fromCodePoint(0x3164);
  const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
  /** NEL, a control character — the one of Unicode's White_Space that `\s`
   *  misses — and the braille blank: in lib/visible-text's THE UNSEEN SET
   *  since round 1 of its review (2026-10-21). */
  const NEXT_LINE = String.fromCodePoint(0x85);
  const BRAILLE_BLANK = String.fromCodePoint(0x2800);

  /** BLANK strings — non-empty, so PostPhoto would print a row for each, yet
   *  none shows a character (lib/visible-text): PostPhoto refuses each under
   *  one picture's name since round 2 of that module's review, and this
   *  section first, naming the pair — and each as the refusal quotes it, lib/visible-text's `spelled`: every character a reader
   *  would not see spelled by its code point, the line feed too; the plain
   *  space stays a space. */
  const BLANKS = [
    ['a space', ' ', '" "'],
    ['a no-break space', NBSP, '"\\u{00A0}"'],
    ['a line feed', LINE_FEED, '"\\u{000A}"'],
    ['a zero-width space', ZERO_WIDTH, '"\\u{200B}"'],
    ['a Hangul filler', HANGUL_FILLER, '"\\u{3164}"'],
    ['a variation selector alone', VARIATION_SELECTOR, '"\\u{FE0F}"'],
    ['NEL, a control character', NEXT_LINE, '"\\u{0085}"'],
    ['the braille blank', BRAILLE_BLANK, '"\\u{2800}"'],
  ] as const;

  it.each([
    [
      'a heading over the before half alone',
      { headings: { before: 'Înainte', after: '' } },
      refusal('headings', '"Înainte" (before) and "" (after)'),
    ],
    [
      'a heading over the after half alone',
      { headings: { before: '', after: 'După' } },
      refusal('headings', '"" (before) and "După" (after)'),
    ],
    [
      'a note under the before half alone',
      { headings: HEADINGS, notes: { before: NOTES.before, after: '' } },
      refusal(
        'notes',
        '"Notă: fotografie din cabinetul nostru." (before) and "" (after)',
      ),
    ],
    [
      'a note under the after half alone',
      { notes: { before: '', after: NOTES.after } },
      refusal('notes', '"" (before) and "Notă: după igienizare." (after)'),
    ],
  ] as const)(
    'refuses %s — an EMPTY half beside words, one of the holes the types leave — with a RangeError naming the part and quoting both halves, on the static render `next build` runs',
    (_wrong, props, words) => {
      expect(build(props)).toThrow(RangeError);
      expect(build(props)).toThrow(words);
    },
  );

  it.each(BLANKS)(
    'refuses %s on one half beside words on the other — a BLANK half, the other hole: an empty-looking caption or note over that half alone, refused here naming the pair before PostPhoto refuses it under one picture’s name',
    (_name, blank, quoted) => {
      const heading = build({
        headings: { before: HEADINGS.before, after: blank },
      });
      expect(heading).toThrow(RangeError);
      expect(heading).toThrow(
        refusal('headings', `"Înainte" (before) and ${quoted} (after)`),
      );
      const note = build({
        headings: HEADINGS,
        notes: { before: blank, after: NOTES.after },
      });
      expect(note).toThrow(RangeError);
      expect(note).toThrow(
        refusal(
          'notes',
          `${quoted} (before) and "Notă: după igienizare." (after)`,
        ),
      );
    },
  );

  it('refuses an EMPTY half beside a BLANK one — neither shows text, but the blank one is non-empty, a row on one half alone, and the halves’ rows would part', () => {
    const heading = build({ headings: { before: '', after: ' ' } });
    expect(heading).toThrow(RangeError);
    expect(heading).toThrow(refusal('headings', '"" (before) and " " (after)'));
    const note = build({ notes: { before: ZERO_WIDTH, after: '' } });
    expect(note).toThrow(RangeError);
    expect(note).toThrow(
      refusal('notes', '"\\u{200B}" (before) and "" (after)'),
    );
  });

  it('refuses two BLANK halves — a part the pair has must show text on both, or be empty on both: two empty rows over both pictures (round 1 of lib/visible-text’s review; until then they passed)', () => {
    const heading = build({
      headings: { before: ' ', after: NBSP },
      notes: NOTES,
    });
    expect(heading).toThrow(RangeError);
    expect(heading).toThrow(
      refusal('headings', '" " (before) and "\\u{00A0}" (after)'),
    );
    const note = build({
      headings: HEADINGS,
      notes: { before: ZERO_WIDTH, after: NEXT_LINE },
    });
    expect(note).toThrow(RangeError);
    expect(note).toThrow(
      refusal('notes', '"\\u{200B}" (before) and "\\u{0085}" (after)'),
    );
  });

  it.each([
    [
      'no text at all on one half',
      { before: undefined, after: '' },
      'undefined (before) and "" (after)',
    ],
    [
      'a number beside words',
      { before: 7, after: 'După' },
      '7 (before) and "După" (after)',
    ],
    [
      'null on both halves',
      { before: null, after: null },
      'null (before) and null (after)',
    ],
  ])(
    'refuses a half that is no string — %s, escaped from the types — with a TypeError, JavaScript’s error for a value of the wrong type (sections/PostProse’s split), naming the pair and each half by its type, never a crash inside the quoting',
    (_name, pair, quotes) => {
      // Until round 1 of lib/visible-text's review the refusal's own quoting
      // ran JSON.stringify(undefined).replace(…) and crashed with a
      // TypeError of its own, naming neither the part nor the pair; until
      // round 2 it was this section's RangeError.
      const headings = pair as unknown as BeforeAfterPair<string>;
      expect(build({ headings })).toThrow(TypeError);
      expect(build({ headings })).toThrow(
        `BeforeAfter: ${PAIR} holds headings that are not two strings; they are ${quotes}`,
      );
      // …and the notes the same way.
      const notes = pair as unknown as BeforeAfterPair<string>;
      expect(build({ notes })).toThrow(TypeError);
      expect(build({ notes })).toThrow(
        `BeforeAfter: ${PAIR} holds notes that are not two strings; they are ${quotes}`,
      );
    },
  );

  it.each([
    ['a mark on each half', '.', '…', '"." (before) and "…" (after)'],
    [
      'a mark beside a word',
      'Înainte',
      '·',
      '"Înainte" (before) and "·" (after)',
    ],
  ])(
    'refuses HEADINGS of %s — a heading shows a WORD, a letter or a digit (lib/visible-text’s `hasVisibleWord`): a caption of marks alone names nothing (SC 2.4.6), refused here naming the pair, where until round 2 it passed to fail in PostPhoto under one picture’s name',
    (_name, before, after, quotes) => {
      const marks = build({ headings: { before, after } });
      expect(marks).toThrow(RangeError);
      expect(marks).toThrow(refusal('headings', quotes));
    },
  );

  it('keeps NOTES on the text rule — a note of marks alone shows something, and is printed on both halves', () => {
    // Paragraphs and notes keep lib/visible-text's `hasVisibleText`: „…"
    // under a picture shows, and PostPhoto prints it.
    const { container } = render(
      <BeforeAfter
        images={HEADLESS_IMAGES}
        notes={{ before: '…', after: '…' }}
      />,
    );
    const { before, after } = partsOf(container.firstElementChild);
    for (const half of [before, after]) {
      expect(half.querySelector('p')?.textContent).toBe('…');
    }
  });

  it('names a refused pair by ITS before picture — two blank halves quote nothing that says which of an article’s pairs broke the build (round 2)', () => {
    const elsewhere = {
      before: {
        src: '/images/demo/gallery-3.jpg',
        alt: HEADLESS_IMAGES.before.alt,
      },
      after: HEADLESS_IMAGES.after,
    } as const satisfies BeforeAfterPair<PostPhotoImage>;
    const blank = () =>
      renderToStaticMarkup(
        <BeforeAfter
          images={elsewhere}
          notes={{ before: ZERO_WIDTH, after: ' ' }}
        />,
      );
    expect(blank).toThrow(RangeError);
    expect(blank).toThrow(
      'BeforeAfter: the pair whose before picture is "/images/demo/gallery-3.jpg" is one shape — its notes must show text on both halves, or be empty on both; they are "\\u{200B}" (before) and " " (after)',
    );
  });

  it('takes two EMPTY strings as the part absent from both halves — PostPhoto prints nothing for either, and both halves keep one shape', () => {
    const { container } = render(
      <BeforeAfter
        images={HEADLESS_IMAGES}
        headings={{ before: '', after: '' }}
        notes={NOTES}
      />,
    );
    const { before, line, after } = partsOf(container.firstElementChild);

    for (const half of [before, after]) {
      expect([...half.children].map((child) => child.tagName)).toEqual([
        'DIV',
        'P',
      ]);
      // Two parts each: the notes' instance, not a heading row of nothing.
      expect(tokensOf(half)).toEqual([...FIGURE, ...HALF_SPAN[2]]);
    }
    expect(tokensOf(line)).toEqual([...LINE, LINE_SPAN[2]]);
  });

  it('pins at compile time that a part on one half alone cannot be written — the pair is grouped by part, never by half', () => {
    const headingAlone: BeforeAfterProps = {
      images: IMAGES,
      // @ts-expect-error — a heading over the before half alone
      headings: { before: 'Înainte' },
    };
    const noteAlone: BeforeAfterProps = {
      images: IMAGES,
      // @ts-expect-error — a note under the after half alone
      notes: { after: NOTES.after },
    };
    const pictureAlone: BeforeAfterProps = {
      // @ts-expect-error — a pair has two pictures, always
      images: { before: IMAGES.before },
    };
    expect([headingAlone, noteAlone, pictureAlone]).toHaveLength(3);
  });
});

describe('BeforeAfter — THE SUBGRID’s spans, one per instance', () => {
  it.each(INSTANCES)(
    '%s: each half spans as many of the pair’s rows as it has parts, from @lg, and takes them as its own; the line spans as many',
    (_label, words, parts) => {
      const { container } = render(
        <BeforeAfter images={imagesFor(words)} {...words} />,
      );
      const { before, line, after } = partsOf(container.firstElementChild);

      // PostPhoto's own recipe first, the placement merged last (§6.8).
      expect(tokensOf(before)).toEqual([...FIGURE, ...HALF_SPAN[parts]]);
      expect(tokensOf(after)).toEqual([...FIGURE, ...HALF_SPAN[parts]]);
      expect(tokensOf(line)).toEqual([...LINE, LINE_SPAN[parts]]);
    },
  );

  it('spans by row count, never to the last line — the pair’s rows are implicit, and a span to the last explicit line spans none of them', () => {
    const { container } = renderPair();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/row-(span-full|start|end)/);
      }
    }
  });
});

describe('BeforeAfter — the pictures', () => {
  it('asks for its real box in `sizes` on BOTH pictures — the band scale’s share, half the measure, the column', () => {
    renderPair();

    const pictures = screen.getAllByRole('img');
    expect(pictures).toHaveLength(2);
    for (const picture of pictures) {
      expect(picture).toHaveAttribute('sizes', SIZES);
    }
  });

  it('keeps a space before every `vw` share — the one next/image reads to keep the small widths', () => {
    // next/image's getWidths reads `(^|\s)(1?\d?\d)vw` — a whole number that
    // opens the string or follows a space — and keeps the candidates from
    // 640 × the SMALLEST share it read. So every `vw` the string carries must
    // be one that pattern reads (THE SPACE BEFORE `23vw`, the header), and
    // the smallest must be the band scale's 23: 147.2px and up survive.
    const read = [...SIZES.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((match) =>
      Number(match[2]),
    );
    expect(read).toEqual([23, 80, 90]);
    expect(SIZES.split('vw')).toHaveLength(read.length + 1);
    expect(640 * (Math.min(...read) / 100)).toBeCloseTo(147.2, 5);
  });

  it('loads LAZILY — never the page’s LCP — and carries no `fetchpriority`', () => {
    renderPair();

    for (const picture of screen.getAllByRole('img')) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });

  it('prints each alt exactly as handed in, before first — diacritics and all', () => {
    renderPair();

    expect(
      screen.getAllByRole('img').map((picture) => picture.getAttribute('alt')),
    ).toEqual([IMAGES.before.alt, IMAGES.after.alt]);
  });
});

describe('BeforeAfter — THE LINE between the halves', () => {
  it.each(INSTANCES)(
    '%s: ONE empty span between the two figures, hidden from assistive technology',
    (_label, words) => {
      const { container } = render(
        <BeforeAfter images={imagesFor(words)} {...words} />,
      );

      const { grid, line } = partsOf(container.firstElementChild);
      expect(grid.children).toHaveLength(3);
      expect(line.tagName).toBe('SPAN');
      expect(line).toHaveAttribute('aria-hidden', 'true');
      expect(line).toBeEmptyDOMElement();
      expect(line).not.toHaveAttribute('role');
      expect(line).not.toHaveAttribute('tabindex');
      expect(line.getAttributeNames().sort()).toEqual(['aria-hidden', 'class']);
      expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(1);
    },
  );

  it('carries the KEEP-IN-SYNC half it shares with sections/PostConclusion — `rounded-full bg-(--ribbon)` and the thickness step 1', () => {
    const { container } = renderPair();

    const tokens = tokensOf(partsOf(container.firstElementChild).line);
    expect(tokens).toContain('rounded-full');
    expect(tokens).toContain('bg-(--ribbon)');
    // Step 1 both ways: 4px thick lying down, 4px wide standing — the same
    // thickness the conclusion's standing line wears.
    expect(tokens).toContain('h-1');
    expect(tokens).toContain('@lg:w-1');
    // …and no colour or radius of its own beside them.
    expect(
      tokens.filter((token) => /^(@lg:)?(bg|rounded)-/.test(token)),
    ).toEqual(['rounded-full', 'bg-(--ribbon)']);
  });
});

describe('BeforeAfter — the root and the grid', () => {
  it('is its own @container holding ONE grid of before | line | after', () => {
    const { container } = renderPair();

    const root = htmlElement(container.firstElementChild, 'root');
    expect(root.tagName).toBe('DIV');
    expect(tokensOf(root)).toEqual(ROOT);
    expect(root.children).toHaveLength(1);
    const { grid } = partsOf(root);
    expect(grid.tagName).toBe('DIV');
    expect(tokensOf(grid)).toEqual(GRID);
    expect([...grid.children].map((child) => child.tagName)).toEqual([
      'FIGURE',
      'SPAN',
      'FIGURE',
    ]);
  });

  it('asks its OWN width, never the window’s — no viewport prefix anywhere in the section (§6.5)', () => {
    const { container } = renderPair();

    for (const element of [container, ...container.querySelectorAll('*')]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^(sm|md|lg|xl|2xl|max-\w+|min-\[[^\]]+\]):/);
      }
    }
  });
});

describe('BeforeAfter — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the root itself', () => {
    const { container } = renderPair({ className: 'w-full' });

    const root = htmlElement(container.firstElementChild, 'root');
    expect(tokensOf(root)).toEqual([...ROOT, 'w-full']);
    // …never onto the grid inside it.
    expect(tokensOf(partsOf(root).grid)).toEqual(GRID);
  });

  it('spreads native props onto the root, never onto the halves', () => {
    const { container } = render(
      <BeforeAfter
        images={IMAGES}
        headings={HEADINGS}
        id="periuta-inainte-si-dupa"
        lang="ro"
        data-slot="before-after"
      />,
    );

    const root = htmlElement(container.firstElementChild, 'root');
    expect(root).toHaveAttribute('id', 'periuta-inainte-si-dupa');
    expect(root).toHaveAttribute('lang', 'ro');
    expect(root).toHaveAttribute('data-slot', 'before-after');
    for (const figure of screen.getAllByRole('figure')) {
      expect(figure).not.toHaveAttribute('data-slot');
      expect(figure).not.toHaveAttribute('id');
    }
  });

  it('keeps its own props off the root — no stray attribute', () => {
    const { container } = renderPair();

    // `images`, `headings` and `notes` are destructured, so nothing of theirs
    // rides the spread.
    expect(
      htmlElement(container.firstElementChild, 'root').getAttributeNames(),
    ).toEqual(['class']);
  });

  it('is never one picture, never a landmark, named by nothing, described by nothing and no tooltip — a written `role` is refused by the type, and a role, a name, a role description or a `title` that slips past it is reset after the spread (sections/PageHero’s belt)', () => {
    // The directive fails `tsc` the day the type lets a `role` through; at
    // runtime the prop rides the spread, and the reset after it wins. A
    // `role="img"` would make the pair ONE picture, its children — both
    // figures — presentational, gone from assistive technology. The names
    // and the role description are hyphenated, and TypeScript checks no
    // hyphenated JSX attribute against a props type that lacks it: a written
    // one compiles, which is why the reset is the belt that holds (the type
    // pins below). The `title` — a tooltip across both figures — arrives the
    // way the reset exists for, in the spread of a wider object: a WRITTEN
    // one does not compile (the type pins below).
    const smuggled = {
      title: 'Înainte și după',
    } as unknown as Partial<BeforeAfterProps>;
    const { container } = render(
      <BeforeAfter
        images={IMAGES}
        headings={HEADINGS}
        // @ts-expect-error — `role` is Omitted from the pair's props
        role="img"
        aria-label="Înainte și după"
        aria-labelledby="altundeva"
        aria-roledescription="comparație"
        {...smuggled}
      />,
    );

    const root = htmlElement(container.firstElementChild, 'root');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('title');
    expect(root).not.toHaveAttribute('aria-label');
    expect(root).not.toHaveAttribute('aria-labelledby');
    expect(root).not.toHaveAttribute('aria-roledescription');
    expect(root.getAttributeNames()).toEqual(['class']);
    // Both figures still stand, each captioned by its own heading.
    expect(screen.getAllByRole('figure')).toHaveLength(2);
  });

  it('lets no markup in beside its parts — `dangerouslySetInnerHTML` is refused by the type, and one smuggled in through a spread still fails the build loudly, React’s own refusal, never a silent drop', () => {
    const smuggled = {
      dangerouslySetInnerHTML: { __html: '<b>Înainte</b>' },
    } as unknown as Partial<BeforeAfterProps>;

    expect(() =>
      renderToStaticMarkup(<BeforeAfter images={IMAGES} {...smuggled} />),
    ).toThrow(/dangerouslySetInnerHTML/);
  });

  it('accepts ref as a regular prop (React 19) — it is the root <div>', () => {
    const root = createRef<HTMLDivElement>();
    const { container } = renderPair({ ref: root });

    expect(root.current?.tagName).toBe('DIV');
    expect(root.current).toBe(container.firstElementChild);
  });

  it('owns no outer margin anywhere — the article’s measure owns spacing (§6.4)', () => {
    const { container } = renderPair();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^(@\w+:)?-?m[trblxyse]?-/);
      }
    }
  });
});

describe('BeforeAfter — zero islands of its own, zero message keys', () => {
  it('ships NO client directive, calls NO hook and wires NO handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
  });

  it('imports EXACTLY sections/PostPhoto — its public component and its picture type — lib/cx, lib/visible-text and React’s types', () => {
    // The import surface is the guard a regex on directives cannot be: a
    // half swapped for a component with state would hydrate the whole
    // article. The halves' atoms (ui/Heading, ui/Image) arrive THROUGH
    // PostPhoto, never imported here (§4: a section composes another's
    // public component, never its internals).
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/PostPhoto/PostPhoto',
      '@/lib/cx/cx',
      '@/lib/visible-text/visible-text',
      'react',
    ]);
    // lib/visible-text's three exports, by name: `hasVisibleText`, THE PAIR
    // IS ONE SHAPE's test of whether a half's note shows anything,
    // `hasVisibleWord`, its test of whether a half's heading names something
    // (round 2 of that module's review), and `spelled`, the refusal's
    // quoting. This pins the import LINE alone; that no rule of the file's
    // own stands beside them is the refusals' to prove — the BLANKS rows,
    // each a character the shared set alone refuses (a Hangul filler, NEL,
    // the braille blank), the headings of marks alone, and the quote of each.
    expect(CODE).toMatch(
      /^import \{\s*hasVisibleText,\s*hasVisibleWord,\s*spelled,\s*\} from '@\/lib\/visible-text\/visible-text';$/m,
    );
    expect(CODE).toMatch(
      /^import type \{ ComponentPropsWithRef, ReactElement \} from 'react';$/m,
    );
    expect(CODE).toMatch(
      /^import \{\s*PostPhoto,\s*type PostPhotoImage,\s*\} from '@\/components\/sections\/PostPhoto\/PostPhoto';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('never re-spells THE BAND SCALE — it inherits the article’s, worn by sections/PostPage alone', () => {
    // The lane contract's §2: blocks inside the article inherit the remap and
    // must neither import nor spell its strings.
    expect(CODE).not.toMatch(/\bband(Scale|Column)Classes\b/);
    expect(CODE).not.toMatch(/scalable:|design-scale|--scale-px/);
  });

  it('renders every string intact — diacritics and all — and no message key path (§8.1)', () => {
    const { container } = renderPair();

    expect(container.textContent).toBe(
      `${HEADINGS.before}${NOTES.before}${HEADINGS.after}${NOTES.after}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('BeforeAfter — type-level pins', () => {
  it('pins the deliberate type decisions so a refactor cannot quietly widen them', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    // Content arrives as the three named parts, never as children.
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('children');
    // A pair is READ-ONLY, the before first.
    expectTypeOf<BeforeAfterPair<number>>().toEqualTypeOf<
      Readonly<{ before: number; after: number }>
    >();
    // The pictures are PostPhoto's picture shape, a pair of them, required.
    expectTypeOf<BeforeAfterProps['images']>().toEqualTypeOf<
      BeforeAfterPair<PostPhotoImage>
    >();
    expectTypeOf<PostPhotoImage>().toEqualTypeOf<
      Readonly<{ src: ImagePath; alt: string }>
    >();
    // The words optional, each a pair of plain strings.
    expectTypeOf<BeforeAfterProps['headings']>().toEqualTypeOf<
      BeforeAfterPair<string> | undefined
    >();
    expectTypeOf<BeforeAfterProps['notes']>().toEqualTypeOf<
      BeforeAfterPair<string> | undefined
    >();
    // The root's own surface rides along — a ref and a className, an id and
    // the ARIA attributes that do not name it.
    expectTypeOf<BeforeAfterProps>().toHaveProperty('ref');
    expectTypeOf<BeforeAfterProps>().toHaveProperty('className');
    expectTypeOf<BeforeAfterProps>().toHaveProperty('id');
    expectTypeOf<BeforeAfterProps>().toHaveProperty('aria-describedby');
    // …but not markup set beside the parts, a role, a name or a role
    // description for the generic root, or a tooltip across both figures
    // (THE NATIVE SURFACE, sections/PageHero's belt). The hyphenated ones
    // are pinned on the props TYPE, because a written hyphenated attribute
    // compiles whatever the type says — the runtime reset holds that one (the
    // native surface's test). Each directive below fails `tsc` the day the
    // type lets its prop through; the three elements are built, never
    // rendered.
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('role');
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('title');
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('aria-label');
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('aria-roledescription');
    const refused = [
      <BeforeAfter
        key="role"
        images={IMAGES}
        // @ts-expect-error — `role` is no prop of the pair
        role="img"
      />,
      <BeforeAfter
        key="title"
        images={IMAGES}
        // @ts-expect-error — nor is a tooltip across both figures
        title="Înainte și după"
      />,
      <BeforeAfter
        key="markup"
        images={IMAGES}
        // @ts-expect-error — nor is markup set beside its parts
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
    ];
    expect(refused).toHaveLength(3);
    // The old shape — a figure per half — is gone.
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('before');
    expectTypeOf<BeforeAfterProps>().not.toHaveProperty('after');
  });
});
