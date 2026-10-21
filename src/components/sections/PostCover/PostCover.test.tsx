import { createRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Image } from '@/components/ui/Image/Image';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  PostCover,
  type PostCoverOwnProps,
  type PostCoverProps,
} from './PostCover';
import source from './PostCover.tsx?raw';

// sections/PostCover — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the tag list is reachable as a `list` NAMED by its
// label, the picture as an `img` named by its alt.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the PostCard precedent): next-intl's hooks
// throw without one, so a green render proves this section calls no t().
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the section or to an atom fails HERE instead of following the code
// it is meant to check. What the real stylesheet does with them — the row's
// two ends, the two ratios, the chips at the top-right corner — is
// PostCover.stories.tsx's business: its plays measure them; and the chips'
// own pixel, the card's formula under the cover's cap, is
// PostCover.scale.test.tsx's, which loads the sheet and the real face.
// THE CHIPS' PIXEL IS READ IN PARTS: its bracketed declaration is never
// written here whole — Tailwind reads tests too, and
// tests/unit/design-scale.test.ts holds every scanned file to its D-LIT RULE —
// so the token is assembled from `PIXEL` and parsed (`chipPixelOf`).
//
// ── THE PICTURE IN THIS RUNNER: the optimizer's width variants do not exist
// here (`npm run build` makes them), so every <img> 404s and
// next-image-export-optimizer swaps to the original file on the error event,
// at a macrotask boundary. Every picture assertion is therefore SYNCHRONOUS —
// render, read, assert — never awaited (ReviewCard.test.tsx's rule).

/** The cover as the article page hands it over, in Romanian with diacritics
 *  (§15.7): every word finished. */
const COVER = {
  readingTime: '4 min de citit',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Sala de așteptare a clinicii, cu fotolii galbene',
  },
  tags: ['igienă', 'sfaturi'],
  tagsLabel: 'Categorii',
} as const satisfies Omit<PostCoverOwnProps, 'share'>;

/** The share slot's stand-in: a named list, so a test can find it where the
 *  cover puts it. The real controls are sections/ShareLinks'. */
const SHARE_LABEL = 'Distribuie articolul';
const SHARE_SLOT = (
  <ul role="list" aria-label={SHARE_LABEL}>
    <li>Facebook</li>
    <li>WhatsApp</li>
  </ul>
);

// THE RECIPES, written out.
const ROOT = ['@container', 'flex', 'flex-col', 'gap-4'];
const ROW = [
  'flex',
  'flex-wrap',
  'items-center',
  'justify-between',
  'gap-x-6',
  'gap-y-2',
];
/** THE READING TIME'S BOX (PostCover's THE ROW): a grid stretched to its
 *  line, its one row track never shorter than the reading time and never
 *  taller than the line or the share controls' minimum height, the theme's
 *  44px step, the reading time centred in it. No alignment of the track's
 *  own: the grid's default keeps it at the line's top. What the real
 *  stylesheet makes of it is PostCover.scale.test.tsx's THE ROW. */
const TIME = [
  'grid',
  'grid-rows-[minmax(min-content,min(100%,calc(var(--spacing)*11)))]',
  'items-center',
  'self-stretch',
];
const SLOT = ['ms-auto'];
const PICTURE = ['relative', 'aspect-[3/2]', '@2xl:aspect-[2/1]'];
/** THE CAP, the picture's box's last token: the page's own pixel — a quarter
 *  of its spacing step — captured above the list that re-declares the pixel
 *  (PostCover's THE TAGS). */
const CAP = '[--tags-cap:calc(var(--spacing)/4)]';
/** sections/PostCard's tag placement, byte for byte (KEEP-IN-SYNC —
 *  tests/unit/blog-tags-sync.test.ts holds the two sources equal). */
const TAGS = [
  'absolute',
  'start-3',
  'end-3',
  'top-3',
  'flex',
  'flex-row-reverse',
  'flex-wrap',
  'gap-3',
];
/** THE CHIPS FOLLOW THEIR COVER: the design pixel's NAME (the token itself is
 *  read in parts — the harness note above), the remap the list wears, the
 *  guard both ride — an engine that knows container units — and the cap's
 *  name, which the declaration reads. */
const PIXEL = '--scale-px';
const REMAP = 'design-scale';
const GUARD = 'supports-[width:1cqw]:';
const CAP_NAME = '--tags-cap';
/** sections/PostCard's numbers, the card's chip pixel: a 12px label at the
 *  floor (0.75rem over 18) and the card's content width at the owner's 723
 *  window, where its chips are the atom's own. */
const CARD_FORMULA = { floorRem: 0.75, divisor: 18, reference: 513.40625 };
/** COVER_SIZES — the column's share of the window, THE BAND SCALE's cap on a
 *  fine pointer (PostCover's THE `sizes`, DERIVED), written out as the string
 *  the picture and its preload link must carry. Its NUMBERS are not held by
 *  this copy: tests/unit/design-scale.test.ts derives each from where it
 *  lives — ui/Container's gutter, the band's cap, the gate's pointer. */
const SIZES =
  '(min-width: 120rem) and (pointer: fine) 96rem, (min-width: 37.5rem) 80vw, (min-width: 30rem) calc(40vw + 15rem), 90vw';
/** The site's candidates (next.config's deviceSizes) the cover needs — all of
 *  them at least 640 × 0.8 = 512px: next/image reads `80vw`, the smallest
 *  bare share, and never the ramp's share inside calc() (THE SPACE BEFORE
 *  `80vw` AND `90vw`). This runner's default config keeps two larger ones. */
const CANDIDATE_WIDTHS = [640, 750, 828, 1080, 1200, 1920];

/** The `w` descriptors of a picture's srcset, in order. */
const widthsOf = (picture: Element): number[] =>
  [...(picture.getAttribute('srcset') ?? '').matchAll(/\s(\d+)w(?:,|$)/g)].map(
    (match) => Number(match[1]),
  );
/** ui/Image's `framed` situation: covers its box, crops, rounds. */
const FRAMED_PHOTO = ['h-full', 'w-full', 'rounded-xl', 'object-cover'];
/** ui/PillButton's TAG — the pill's box and glow, and the resting control's
 *  hover face held still: the lavender edge and label on the white face. */
const CHIP_TAG = [
  'rounded-full',
  'border-2',
  'min-h-11',
  'whitespace-nowrap',
  'shadow-aura',
  'border-accent',
  'bg-surface',
  'text-accent',
];
/** What a tag never wears: the resting control's ink and tint, and the
 *  current chip's lavender fill and white label. */
const NOT_A_TAG = [
  'border-card-tint',
  'text-ink',
  'bg-accent',
  'text-ink-inverse',
];

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The list's own design pixel, read off its class list IN PARTS (the harness
 * note): the one token that declares `PIXEL` behind THE GUARD, as the smaller
 * of THE CAP (a custom property by name) and the card's formula — the larger
 * of a floor, FLOOR rem over DIVISOR, and the cover's width (`100cqw`) over
 * W. Throws by name when there is no such token, or more than one, or its
 * shape moved. The pattern is built from strings, so no bracketed declaration
 * stands in this file's text.
 */
const chipPixelOf = (
  tokens: readonly string[],
): { cap: string; floorRem: number; divisor: number; reference: number } => {
  const open = '[';
  const declarations = tokens.filter((token) =>
    token.includes(`${open}${PIXEL}:`),
  );
  if (declarations.length !== 1) {
    throw new Error(
      `the list declares its pixel ${declarations.length} times: ${tokens.join(' ')}`,
    );
  }
  const escape = (text: string): string =>
    text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const number = '(\\d+(?:\\.\\d+)?)';
  const shape = new RegExp(
    `^${escape(GUARD)}\\${open}${PIXEL}:min\\(var\\((--[\\w-]+)\\),max\\(calc\\(${number}rem/${number}\\),calc\\(100cqw/${number}\\)\\)\\)\\]$`,
  ).exec(declarations[0] ?? '');
  if (!shape?.[1] || !shape[2] || !shape[3] || !shape[4]) {
    throw new Error(`the list's pixel moved: ${declarations[0] ?? ''}`);
  }
  return {
    cap: shape[1],
    floorRem: Number(shape[2]),
    divisor: Number(shape[3]),
    reference: Number(shape[4]),
  };
};

const renderCover = (overrides: Partial<PostCoverProps> = {}) =>
  render(<PostCover {...COVER} share={SHARE_SLOT} {...overrides} />);

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on (PostCover.scale.test's
 *  `htmlElement`). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PostCover: no ${name}`);
  }
  return node;
};

/** The cover's boxes, by structure — none of them carries a role (they are
 *  layout): the root, the row and its two cells — the reading time's box and
 *  the slot — the reading time in its box, the picture's box and the picture
 *  itself. Each one checked, never cast. */
const partsOf = (root: HTMLElement) => {
  const row = htmlElement(root.children[0], 'row');
  const picture = htmlElement(root.children[1], 'picture box');
  const photo = picture.querySelector('img');
  if (!(photo instanceof HTMLImageElement)) {
    throw new Error('PostCover: no photograph in the picture box');
  }
  const timeBox = htmlElement(row.children[0], 'reading time’s box');
  return {
    row,
    timeBox,
    readingTime: htmlElement(timeBox.children[0], 'reading time'),
    slot: htmlElement(row.children[1], 'share slot'),
    picture,
    photo,
  };
};

/** The root, the render's one top-level element. */
const rootOf = (container: HTMLElement): HTMLElement =>
  htmlElement(container.firstElementChild, 'cover root');

/** A class's UTILITY: the token with its variant chain — every `…:` outside
 *  brackets, so an arbitrary property's own colon stays (tests/unit/
 *  design-scale.test.ts's `parse`) — and an important mark (`!`, before or
 *  after) stripped. */
const utilityOf = (token: string): string => {
  let depth = 0;
  let utility = '';
  for (const char of token) {
    if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    if (char === ':' && depth === 0) utility = '';
    else utility += char;
  }
  return utility.replace(/^!|!$/g, '');
};

/** A margin, in any spelling once its variants are stripped: one of
 *  Tailwind 4's margin utilities (`m`, `mx`, `my`, `ms`, `me`, `mbs`, `mbe`,
 *  `mt`, `mr`, `mb`, `ml` — a named, negative or arbitrary value), the
 *  `space` pair, which sets its children's margins, or an arbitrary margin
 *  property. */
const isMargin = (token: string): boolean =>
  /^-?(?:m(?:bs|be|[trblxyse])?|space-[xy])-|^\[margin(?:-[a-z-]+)?:/.test(
    utilityOf(token),
  );

/**
 * The section's source with its PROSE removed — what the zero-island guards
 * run against: the header discusses `'use client'`, hooks and handlers by
 * name. ONE left-to-right pass — tests/unit/design-scale.test.ts's `tsCode`,
 * the census's stripper, copied verbatim (tests/unit/blog-tags-sync.test.ts
 * carries the same copy): string literals are stepped over whole, and a `//`
 * comment — which opens only at a line's start or after whitespace — is
 * consumed before a `/*` inside it can open a block. A two-pass stripper that
 * removes blocks first lets a glob in a line comment (an image folder written
 * with a star) open a block that swallows real code up to the next `*\/`, and
 * every guard below then passes on code it never saw (the review, 2026-10-20,
 * measured with a handler on the row).
 */
const tsCode = (code: string): string =>
  code.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

const CODE = tsCode(source);

describe('PostCover — the row, then the picture, then the chips', () => {
  it('renders ONE root <div>, its own container, holding the row and the picture’s box', () => {
    const { container } = renderCover();

    const root = rootOf(container);
    expect(container.children).toHaveLength(1);
    expect(root.tagName).toBe('DIV');
    expect(tokensOf(root)).toEqual(ROOT);
    expect(root.children).toHaveLength(2);
    const { row, picture } = partsOf(root);
    expect(tokensOf(row)).toEqual(ROW);
    // The picture's recipe, then THE CAP it hands the tags.
    expect(tokensOf(picture)).toEqual([...PICTURE, CAP]);
  });

  it('starts the row with the reading time — ui/Text’s muted paragraph, the words as given — alone in THE READING TIME’S BOX', () => {
    const { readingTime, row, timeBox } = partsOf(
      rootOf(renderCover().container),
    );

    expect(row.children).toHaveLength(2);
    // The box: the cover laying out its own child, a <div> with no role and
    // no attribute but its classes, holding the paragraph and nothing else.
    expect(timeBox.tagName).toBe('DIV');
    expect(tokensOf(timeBox)).toEqual(TIME);
    expect(timeBox.getAttributeNames()).toEqual(['class']);
    expect(timeBox.children).toHaveLength(1);
    // The paragraph is ui/Text's own, untouched: no class of the cover's
    // rides it (§6.8 — the box places it, nothing restyles it).
    expect(readingTime.tagName).toBe('P');
    expect(readingTime.className).toBe('text-base text-ink-muted');
    expect(readingTime.textContent).toBe(COVER.readingTime);
    expect(screen.getByText(COVER.readingTime)).toBe(readingTime);
  });

  it('spells THE READING TIME’S BOX once, in the one constant the box reads', () => {
    // The class string, pinned in the source as well as in the render above:
    // the stretch, the track's floor at the content (`min-content`, never
    // `auto`, whose automatic minimum the 44px cap would clamp) and its cap at
    // the line and the controls' step are the row's whole contract with a
    // slot that grows.
    const spelled = /^const TIME =\s*'([^']*)';$/m.exec(CODE);
    expect(spelled?.[1]).toBe(TIME.join(' '));
    expect(CODE.match(/className=\{TIME\}/g)).toHaveLength(1);
    // No content alignment of its own: the grid's default keeps the track at
    // the line's top wherever the track is read, and where an engine drops
    // the track list it lets the `auto` row stretch to the line instead of
    // pinning the reading time to the top (PostCover's THE ROW).
    expect(spelled?.[1]).not.toMatch(/(?:^|\s)content-/);
    // The cap is the theme's 44px step, so THE BAND SCALE redraws it as it
    // redraws the controls' own — never a px or rem literal.
    expect(TIME[1]).toContain('calc(var(--spacing)*11)');
    expect(TIME[1]).not.toMatch(/\d(?:px|rem)/);
  });

  it('ends the row with the share slot, AS GIVEN, inside the one wrapper whose auto start margin keeps it at the end', () => {
    const { slot } = partsOf(rootOf(renderCover().container));

    expect(slot.tagName).toBe('DIV');
    expect(tokensOf(slot)).toEqual(SLOT);
    // The slot's content is the caller's element, untouched: the wrapper's
    // one child is the very list the page handed in.
    const share = screen.getByRole('list', { name: SHARE_LABEL });
    expect(slot.children).toHaveLength(1);
    expect(slot.firstElementChild).toBe(share);
    expect(share.getAttributeNames().sort()).toEqual(['aria-label', 'role']);
    expect(
      within(share)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Facebook', 'WhatsApp']);
  });

  it('renders any node the page puts in the slot — text, several elements — and an empty slot as an empty wrapper', () => {
    const slots: ReadonlyArray<[ReactNode, string]> = [
      ['Distribuie', 'Distribuie'],
      [
        <>
          <span>Facebook</span>
          <span>E-mail</span>
        </>,
        'FacebookE-mail',
      ],
      [null, ''],
    ];
    for (const [share, text] of slots) {
      const { container, unmount } = renderCover({ share });
      const { slot } = partsOf(rootOf(container));
      expect(tokensOf(slot)).toEqual(SLOT);
      expect(slot.textContent).toBe(text);
      unmount();
    }
  });

  it('keeps the DOM order the contract names — row, picture, chips — so the chips are read after the picture', () => {
    renderCover();

    const time = screen.getByText(COVER.readingTime);
    const share = screen.getByRole('list', { name: SHARE_LABEL });
    const photo = screen.getByRole('img', { name: COVER.image.alt });
    const chips = screen.getByRole('list', { name: COVER.tagsLabel });
    const follows = (a: Node, b: Node): boolean =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(time, share)).toBe(true);
    expect(follows(share, photo)).toBe(true);
    expect(follows(photo, chips)).toBe(true);
  });
});

describe('PostCover — the picture', () => {
  it('fills its box with ui/Image’s framed photograph, its alt as given — the box’s first child', () => {
    const { picture, photo } = partsOf(rootOf(renderCover().container));

    expect(screen.getByRole('img', { name: COVER.image.alt })).toBe(photo);
    expect(picture.firstElementChild).toBe(photo);
    expect(photo).toHaveAttribute('data-nimg', 'fill');
    for (const token of FRAMED_PHOTO) {
      expect(tokensOf(photo)).toContain(token);
    }
  });

  it('treats an empty alt as decorative — no image in the accessibility tree', () => {
    const { photo } = partsOf(
      rootOf(
        renderCover({ image: { src: COVER.image.src, alt: '' } }).container,
      ),
    );

    expect(screen.queryByRole('img')).toBeNull();
    expect(photo).toHaveAttribute('alt', '');
  });

  it('asks for the column in `sizes` — COVER_SIZES, letter for letter', () => {
    const { photo } = partsOf(rootOf(renderCover().container));

    expect(photo).toHaveAttribute('sizes', SIZES);
  });

  it('lets next/image READ the `80vw` — the srcset sheds the files under 512px, and the ramp’s calc() share is never read', () => {
    // THE SPACE BEFORE `80vw` AND `90vw` (PostCover's THE `sizes`): the
    // filter keeps every candidate of at least deviceSizes[0] × the smallest
    // bare share it reads — 640 × 0.8 = 512px, on this runner's default
    // config as on the site's (both start their deviceSizes at 640). Were the
    // ramp's 40vw read, the 256w and 384w files would join.
    const { photo } = partsOf(rootOf(renderCover().container));

    const widths = widthsOf(photo);
    expect(widths.length).toBeGreaterThan(0);
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(640 * 0.8);
    // …and every one of the site's files stays — each the best fit for a box
    // the cover draws at 1×, 2× or 3×: 640 for a 320 phone's 288px box at 2×,
    // 750 and 1080 for the 390 phone's 351px one at 2× and 3×, 828 for a 460
    // phone's 414px one at 2×, 1200 for a 1500 window's 1200px one at 1×, and
    // 1920 for the band's 1536px cap.
    for (const width of CANDIDATE_WIDTHS) expect(widths).toContain(width);

    // NEVER VACUOUS: the same picture asked for a rem width alone keeps the
    // small files, so the shedding above is the `80vw`'s doing — read — and
    // not the config's.
    const { container, unmount } = render(
      <Image src={COVER.image.src} alt="" fill sizes="96rem" />,
    );
    const control = widthsOf(
      htmlElement(container.querySelector('img'), 'control picture'),
    );
    expect(control).toContain(256);
    expect(control).toContain(384);
    unmount();
  });

  it('loads LAZILY when not asked — and carries no `fetchpriority`', () => {
    const { photo } = partsOf(rootOf(renderCover().container));

    expect(photo).toHaveAttribute('loading', 'lazy');
    expect(photo).not.toHaveAttribute('fetchpriority');
  });

  it('stays lazy when the page says `preload={false}` outright', () => {
    const { photo } = partsOf(
      rootOf(renderCover({ preload: false }).container),
    );

    expect(photo).toHaveAttribute('loading', 'lazy');
    expect(photo).not.toHaveAttribute('fetchpriority');
  });

  it('loads EAGERLY at high priority when the page asks — its LCP picture, with a preload link of the same `sizes`', () => {
    const { photo } = partsOf(rootOf(renderCover({ preload: true }).container));

    expect(photo).toHaveAttribute('fetchpriority', 'high');
    expect(photo).not.toHaveAttribute('loading', 'lazy');
    // …and the pair's third effect, a preload link for the SAME srcset and
    // `sizes` (asserted present only — React keeps one link per srcset for
    // the document's life; the PostCard suite's note).
    const link = [
      ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
    ].find(
      (element) =>
        element.getAttribute('imagesrcset') === photo.getAttribute('srcset'),
    );
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect(link).toHaveAttribute('imagesizes', SIZES);
    expect(link).toHaveAttribute('fetchpriority', 'high');
  });
});

describe('PostCover — the tags over the picture’s top-right corner: sections/PostCard’s, reused', () => {
  it('renders a list named by `tagsLabel` with the card’s placement, then THE CHIPS FOLLOW THEIR COVER’s two tokens — one <li> per tag, in order', () => {
    renderCover();

    const list = screen.getByRole('list', { name: COVER.tagsLabel });
    expect(list.tagName).toBe('UL');
    // Load-bearing in WebKit, which drops list semantics from an unstyled
    // list (eslint.config.mjs's list-role exception).
    expect(list).toHaveAttribute('role', 'list');
    // The placement first, then the pixel's declaration and the remap, each
    // behind THE GUARD — the card's order (PostCard.test.tsx's same case).
    const tokens = tokensOf(list);
    expect(tokens.slice(0, TAGS.length)).toEqual(TAGS);
    expect(tokens).toHaveLength(TAGS.length + 2);
    expect(tokens.at(-2)?.startsWith(`${GUARD}[${PIXEL}:`)).toBe(true);
    expect(tokens.at(-1)).toBe(`${GUARD}${REMAP}`);
    // The FIRST tag first in the DOM — `flex-row-reverse` paints it at the
    // far right (the stories measure it there).
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...COVER.tags]);
  });

  it('draws the list in a design pixel of its OWN — the card’s formula verbatim, under THE CAP (THE CHIPS FOLLOW THEIR COVER)', () => {
    const { container } = renderCover();

    const list = screen.getByRole('list', { name: COVER.tagsLabel });
    // The card's numbers — a 12px label at the floor, the owner's 723 window
    // as the reference — and the cap, read by name.
    expect(chipPixelOf(tokensOf(list))).toEqual({
      cap: CAP_NAME,
      ...CARD_FORMULA,
    });
    // The pixel and the remap ride the LIST alone: the chips inherit them,
    // and nothing else in the cover declares a pixel or wears a remap.
    for (const element of container.querySelectorAll('*')) {
      if (element === list) continue;
      for (const token of tokensOf(element)) {
        expect(token, element.tagName).not.toContain(REMAP);
        expect(token, element.tagName).not.toContain(PIXEL);
      }
    }
  });

  it('captures THE CAP on the picture’s box — the list’s own parent — as a quarter of the page’s spacing step; nothing else names it', () => {
    const { container } = renderCover();
    const { picture } = partsOf(rootOf(container));

    const list = screen.getByRole('list', { name: COVER.tagsLabel });
    // ABOVE the list, never on it: the list re-declares the pixel and, through
    // `design-scale`, the spacing step — read there, either is a cycle.
    expect(list.parentElement).toBe(picture);
    expect(tokensOf(picture).at(-1)).toBe(CAP);
    // One capture, one read: the picture sets it, the list's declaration
    // reads it, and no other element of the cover names it.
    const named = [...container.querySelectorAll('*')].filter((element) =>
      tokensOf(element).some((token) => token.includes(CAP_NAME)),
    );
    expect(named).toEqual([picture, list]);
  });

  it('puts the pixel and the remap behind THE GUARD — an engine without container units keeps the page’s own chips — and the placement and THE CAP behind none', () => {
    const { picture } = partsOf(rootOf(renderCover().container));

    const tokens = tokensOf(
      screen.getByRole('list', { name: COVER.tagsLabel }),
    );
    const guarded = tokens.filter((token) => token.includes(GUARD));
    expect(guarded.map((token) => token.slice(GUARD.length))).toEqual([
      expect.stringMatching(new RegExp(`^\\[${PIXEL}:min\\(`)),
      REMAP,
    ]);
    for (const token of guarded) expect(token.startsWith(GUARD)).toBe(true);
    for (const token of TAGS) expect(tokens).toContain(token);
    // The capture's one reader is the guarded declaration, so where the
    // guard drops that, the capture is computed and never read.
    for (const token of tokensOf(picture)) {
      expect(token).not.toContain(GUARD);
    }
  });

  it('places the list inside the picture’s box, after the picture — painted over it, read after it', () => {
    const { picture, photo } = partsOf(rootOf(renderCover().container));

    const list = screen.getByRole('list', { name: COVER.tagsLabel });
    expect(picture.children).toHaveLength(2);
    expect(picture.children[0]).toBe(photo);
    expect(picture.children[1]).toBe(list);
  });

  it('dresses each <li> as ui/PillButton’s TAG — the lavender edge and label on white, not one hover class, never current', () => {
    // The owner, 2026-10-14: "it should always have the current hover aspect
    // on it no matter what and houls not be dinamic, i do not want to give
    // impression of a button" (PostCover's A TAG, NOT A BUTTON).
    renderCover({ tags: ['igienă', 'sfaturi', 'urgențe'] });

    const items = within(
      screen.getByRole('list', { name: COVER.tagsLabel }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.tagName).toBe('LI');
      const tokens = tokensOf(item);
      for (const token of CHIP_TAG) expect(tokens).toContain(token);
      // No hover of any spelling — a plain `hover:` or a group's: a pointer
      // changes nothing on a tag.
      expect(tokens.filter((token) => token.includes('hover:'))).toEqual([]);
      // Neither control face: no resting ink or tint, no lavender fill.
      for (const token of NOT_A_TAG) expect(tokens).not.toContain(token);
      // Never current, and nothing of the atom leaks: `kind` and `asChild`
      // leave no attribute, and an <li> carries no <button> one.
      expect(item).not.toHaveAttribute('aria-current');
      expect(item.getAttributeNames()).toEqual(['class']);
    }
  });

  it('asks the atom for the tag in its source — every chip it draws is `kind="tag"`', () => {
    // The rendered classes above prove the face; this pins the WORD, so the
    // tag cannot be rebuilt from a className the atom's THE TAG refuses.
    const chips = CODE.match(/<PillButton\b[^>]*>/g) ?? [];
    expect(chips).toHaveLength(1);
    for (const chip of chips) expect(chip).toMatch(/\bkind="tag"/);
    expect(CODE).not.toMatch(/<PillButton\b[^>]*\bactive\b/);
  });

  it('renders no list at all when the post has no tags — the picture’s box holds the picture alone', () => {
    const { picture, photo } = partsOf(
      rootOf(renderCover({ tags: [] }).container),
    );

    expect(screen.queryByRole('list', { name: COVER.tagsLabel })).toBeNull();
    expect(picture.children).toHaveLength(1);
    expect(picture.firstElementChild).toBe(photo);
    // The slot's own list is untouched by it.
    expect(screen.getByRole('list', { name: SHARE_LABEL })).toBeInTheDocument();
  });

  it('keeps three tags in order, the list’s placement and pixel unchanged', () => {
    const tags = ['parodontologie', 'implantologie', 'prevenție'] as const;
    renderCover({ tags });

    const list = screen.getByRole('list', { name: COVER.tagsLabel });
    const tokens = tokensOf(list);
    expect(tokens.slice(0, TAGS.length)).toEqual(TAGS);
    expect(chipPixelOf(tokens)).toEqual({ cap: CAP_NAME, ...CARD_FORMULA });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...tags]);
  });
});

describe('PostCover — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the root itself', () => {
    const root = rootOf(renderCover({ className: 'w-full' }).container);

    const tokens = tokensOf(root);
    expect(tokens.slice(0, ROOT.length)).toEqual(ROOT);
    expect(tokens.at(-1)).toBe('w-full');
  });

  it('spreads native props onto the root, never onto the atoms', () => {
    const { container } = render(
      <PostCover
        {...COVER}
        share={SHARE_SLOT}
        id="coperta"
        lang="ro"
        data-slot="post-cover"
        aria-describedby="titlu"
      />,
    );

    const root = rootOf(container);
    expect(root).toHaveAttribute('id', 'coperta');
    expect(root).toHaveAttribute('lang', 'ro');
    expect(root).toHaveAttribute('data-slot', 'post-cover');
    expect(root).toHaveAttribute('aria-describedby', 'titlu');
    for (const element of root.querySelectorAll('*')) {
      expect(element).not.toHaveAttribute('data-slot');
    }
  });

  it('is never named and given no role — a `role` and both names smuggled in the spread of a wider object, and the names WRITTEN in JSX, are reset after the spread (THE NATIVE SURFACE)', () => {
    // The type refuses all three (the type pins below), but TypeScript checks
    // no hyphenated attribute written in JSX against a props type that lacks
    // it, and never checks the spread of a wider object for what it carries:
    // both roads compile, so only the reset after the spread holds them. A
    // name on the root names a generic <div>, which ARIA forbids (axe's
    // aria-prohibited-attr); a role would make the layout box something it
    // is not — an `img` would flatten the picture and the tag list into one.
    const wider: Pick<
      ComponentPropsWithRef<'div'>,
      'id' | 'role' | 'aria-label' | 'aria-labelledby'
    > = {
      id: 'coperta',
      role: 'img',
      'aria-label': 'Coperta articolului',
      'aria-labelledby': 'titlu',
    };
    const spread = rootOf(
      render(<PostCover {...COVER} share={SHARE_SLOT} {...wider} />).container,
    );
    expect(spread).not.toHaveAttribute('role');
    expect(spread).not.toHaveAttribute('aria-label');
    expect(spread).not.toHaveAttribute('aria-labelledby');
    // The rest of the wider object still rides the spread.
    expect(spread).toHaveAttribute('id', 'coperta');

    const written = rootOf(
      render(
        <PostCover
          {...COVER}
          share={SHARE_SLOT}
          aria-label="Coperta articolului"
          aria-labelledby="titlu"
        />,
      ).container,
    );
    expect(written).not.toHaveAttribute('aria-label');
    expect(written).not.toHaveAttribute('aria-labelledby');
    // The tag list inside keeps its own name, untouched by the reset.
    expect(
      within(written).getByRole('list', { name: COVER.tagsLabel }),
    ).toHaveAttribute('aria-label', COVER.tagsLabel);
  });

  it('keeps its own props off the root — no stray attribute', () => {
    const root = rootOf(renderCover({ preload: true }).container);

    // The content props are destructured, so nothing of theirs rides the
    // spread — `preload` least of all, which would be a DOM warning.
    expect(root.getAttributeNames()).toEqual(['class']);
  });

  it('accepts ref as a regular prop (React 19) — it is the root <div>', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderCover({ ref });

    expect(ref.current).toBe(rootOf(container));
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('owns no outer margin — the one margin in the tree is the slot’s auto start margin, inside the row (§6.4)', () => {
    const { container } = renderCover();

    // Every token read by its UTILITY (`isMargin`), so a margin under a
    // variant chain or written as an arbitrary property counts too.
    const margins = [...container.querySelectorAll('*')].flatMap((element) =>
      tokensOf(element)
        .filter(isMargin)
        .map((token) => [element, token] as const),
    );
    expect(margins).toEqual([[partsOf(rootOf(container)).slot, 'ms-auto']]);
  });
});

describe('PostCover — zero islands of its own, zero message keys', () => {
  it('ships NO client directive, calls NO hook and wires NO handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
  });

  it('imports EXACTLY the three atoms it composes, lib/cx and one lib TYPE — never the share controls', () => {
    // The import surface is the guard a regex on directives cannot be: the
    // share controls arrive through the SLOT, so the client island they carry
    // never becomes this file's. ui/Image is the one accepted island (its
    // optimizer's). lib/image-path arrives as a TYPE only — zero bytes.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Image/Image',
      '@/components/ui/PillButton/PillButton',
      '@/components/ui/Text/Text',
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{ ImagePath \} from '@\/lib\/image-path\/image-path';$/m,
    );
    expect(CODE).toMatch(/^import type \{[^}]*\} from 'react';$/m);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('spells COVER_SIZES once, in the one constant the picture reads', () => {
    expect(CODE.split('calc(40vw + 15rem)').length - 1).toBe(1);
    expect(CODE).toMatch(/sizes=\{COVER_SIZES\}/);
  });

  it('renders every string intact — diacritics and all — and no message key path (§8.1)', () => {
    const { container } = renderCover({ share: null });

    expect(container.textContent).toBe(
      `${COVER.readingTime}${COVER.tags.join('')}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('PostCover — type-level pins', () => {
  it('pins the deliberate type decisions so a refactor cannot quietly widen them', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    // Content arrives as named props — never as children, and no markup set
    // beside them (React throws on it: the root always has children).
    expectTypeOf<PostCoverProps>().not.toHaveProperty('children');
    expectTypeOf<PostCoverProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    // Never named, given no role (THE NATIVE SURFACE). Pinned on the props
    // TYPE: a hyphenated attribute written in JSX compiles whatever the type
    // says, and a wider spread can carry anything, which is why the reset
    // after the spread is the belt that holds those (the runtime test above).
    expectTypeOf<PostCoverProps>().not.toHaveProperty('role');
    expectTypeOf<PostCoverProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostCoverProps>().not.toHaveProperty('aria-labelledby');
    // …and the rest of the native surface rides along: an id, the ARIA
    // attributes the type keeps, `ref` (React 19).
    expectTypeOf<PostCoverProps>().toHaveProperty('id');
    expectTypeOf<PostCoverProps>().toHaveProperty('aria-describedby');
    expectTypeOf<PostCoverProps>().toHaveProperty('ref');
    expectTypeOf<PostCoverProps['readingTime']>().toEqualTypeOf<string>();
    expectTypeOf<PostCoverProps['share']>().toEqualTypeOf<ReactNode>();
    expectTypeOf<PostCoverProps['tagsLabel']>().toEqualTypeOf<string>();
    expectTypeOf<PostCoverProps['preload']>().toEqualTypeOf<
      boolean | undefined
    >();
    // The picture under the optimizer's one folder and the tags, READ-ONLY,
    // as lib/blog's BlogPost holds them: an identity, so it compares each
    // property's readonly flag as well as its type.
    expectTypeOf<PostCoverProps['image']>().toEqualTypeOf<
      Readonly<{ src: ImagePath; alt: string }>
    >();
    expectTypeOf<PostCoverProps['tags']>().toEqualTypeOf<readonly string[]>();
    // The own props are the contract's six, exported for the page band.
    expectTypeOf<keyof PostCoverOwnProps>().toEqualTypeOf<
      'readingTime' | 'share' | 'image' | 'tags' | 'tagsLabel' | 'preload'
    >();
    // `share` is REQUIRED — the page always says what the slot holds.
    expectTypeOf<PostCoverOwnProps>().toHaveProperty('share');
    expectTypeOf<Pick<PostCoverOwnProps, 'share'>>().toEqualTypeOf<{
      share: ReactNode;
    }>();
  });
});
