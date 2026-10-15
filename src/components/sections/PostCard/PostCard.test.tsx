import { createRef, type CSSProperties } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { page, userEvent as realUser } from 'vitest/browser';
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
// The REAL stylesheet, for the measured blocks at the end — the picture, the
// chips and the card's hover — because the picture's bleed, its corner and
// the words' inset are COMPUTED lengths (six spacing steps less 2px, a radius
// less a frame), the chips' size is a pixel computed from the card's own
// width, their paint is a token's value, and a hover is a rule of the sheet:
// no class string can answer any of them. tests/setup/components.ts loads no CSS globally; the per-file
// import is the house pattern (Card, PersonnelCard …). Every other assertion
// reads tokens, attributes and roles, so each holds with the sheet or without
// it.
import '@/styles/globals.css';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import { PostCard, type PostCardContent, type PostCardProps } from './PostCard';
import source from './PostCard.tsx?raw';
import storiesSource from './PostCard.stories.tsx?raw';
import cardSource from '@/components/ui/Card/Card.tsx?raw';
import postListSource from '@/components/sections/PostList/PostList.tsx?raw';

// sections/PostCard — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the card is reachable as an `article` NAMED BY ITS
// OWN TITLE because a real heading and a real aria-labelledby pair say so.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the ReviewCard precedent): next-intl's hooks
// throw without one, so a green render proves this section calls no t().
//
// ── THE TOKENS ARE THE CONTRACT almost everywhere here — written OUT below
// rather than imported (the ui/Eyebrow RECIPE convention), so a silent edit
// to the section or to an atom fails HERE instead of following the code it is
// meant to check. The two exceptions are the KEEP-IN-SYNCs the card's own
// geometry follows, each READ OUT of its source: ui/Card's framed row — the
// picture's bleed, its corner and the words' inset are derived from it and
// the card's gap — and sections/PostList's GRID, the page's grid, which this
// suite's frame and the stories' frame copy (both held equal to it) and from
// which PICTURE_SIZES' switch points follow (measured where they switch). A
// change in either source turns this file red until the card follows. What
// the real faces do — the footer row's one line in each language, the jump's
// clock, the card in a page's grid at a named width — is
// PostCard.stories.tsx's business. The pointer is moved in TWO blocks, the
// card's hover and the tags' stillness, and it is vitest/browser's REAL
// pointer (a synthetic event cannot move :hover); everywhere else it is
// parked off the card, so the jump never scales a rectangle read here. The
// WINDOW is moved in two more, the owner's reference window and the switch
// points, each putting it back as it found it.
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

/** A post as the blog index hands it over, in Romanian with diacritics
 *  (§15.7): every word finished, the reading time included. */
const POST = {
  title: 'Cum îți alegi periuța de dinți',
  summary:
    'Firele moi, un cap mic și un mâner comod: ce să urmărești pe ambalaj.',
  author: 'Dr. Nicu Elena Alina',
  readingTime: '4 min de citit',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Sala de așteptare a clinicii, cu fotolii galbene',
  },
  tags: ['igienă', 'sfaturi'],
} as const satisfies PostCardContent;

/** The tag list's name and the read-more's label, as the page would hand
 *  them over (§8.1). */
const TAGS_LABEL = 'Categorii';
const READ_MORE_LABEL = 'Citește mai mult…';

// THE RECIPES, written out.
/** THE CARD JUMP — ui/Button's jump cell, the scale alone (PostCard's header). */
const JUMP = [
  '[--jump:200ms]',
  'transition-[scale]',
  'duration-(--jump)',
  'ease-[ease-out]',
  'hover:scale-105',
  'motion-reduce:hover:scale-100',
];
/** THE PICTURE'S CELL: 3:2, the bleed, the inner corner, the clip and its
 *  Safari ≤ 15 twin. */
const PICTURE = [
  'relative',
  'aspect-[3/2]',
  '-mx-[calc(var(--spacing)*6_-_2px)]',
  '-mt-[calc(var(--spacing)*6_-_2px)]',
  'rounded-t-[calc(var(--radius-soft)_-_3px)]',
  'overflow-clip',
  'supports-[not_(overflow:clip)]:overflow-hidden',
];
/** The words: a growing column on the card's rhythm, its top inset. */
const WORDS = [
  'flex',
  'flex-1',
  'flex-col',
  'gap-3',
  'pt-[calc(var(--spacing)*3_-_2px)]',
];
/** ui/TextButton's hover area — the class the <article> wears beside the jump,
 *  so a hover anywhere on the card draws the read-more's underline (PostCard's
 *  THE WHOLE CARD DRAWS THE UNDERLINE). Written out: a renamed group in the
 *  atom fails here. */
const HOVER_AREA = 'group/text-button-area';
/** The read-more's answer to that area: ui/TextButton's `hoverArea="area"`
 *  pair — the lavender label and the drawn underline under the named group. */
const GROUP_HOVER = [
  'group-hover/text-button-area:not-disabled:text-accent',
  'group-hover/text-button-area:not-disabled:after:scale-x-100',
];
/** The categories, over the picture's top-right corner, first tag rightmost. */
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
/** THE CHIPS FOLLOW THEIR CARD: the design pixel's NAME (the token itself is
 *  read in parts — the harness note above), the remap the list wears, and
 *  THE GUARD both ride — an engine that knows container units. */
const PIXEL = '--scale-px';
const REMAP = 'design-scale';
const GUARD = 'supports-[width:1cqw]:';
/** The owner's reference: the card's content width, in CSS px, at a 723 ×
 *  1123 window behind the classic 15px scrollbar (PostCard's THE CHIPS FOLLOW
 *  THEIR CARD) — where the chips are exactly the atom's own. */
const REFERENCE_CONTENT = 513.40625;
/** The atom's own lengths at the reference (ui/PillButton): `min-h-11`,
 *  `px-5`, `text-lg`; and the list's three-step inset and gap. */
const CHIP = { height: 44, padding: 20, label: 18, inset: 12, gap: 12 };
/** The footer row on the card's floor. */
const FOOTER = ['mt-auto', 'flex', 'flex-wrap', 'items-center', 'gap-x-4'];
/** The read-more's placement, merged last by the atom. */
const READ_MORE = ['ms-auto', '-me-2'];
const SIZES =
  '(min-width: 121.25rem) and (pointer: fine) 30rem, (min-width: 71.25rem) 25vw, (min-width: 46.25rem) 40vw, 90vw';
/** ui/Heading's `band` step on its default ink. */
const BAND_TITLE = [
  'font-display',
  'text-3xl',
  '@md:text-4xl',
  'text-ink-strong',
];
/** THE TITLE NEVER SPLITS A WORD — the owner's one class (2026-10-15): the
 *  title breaks between its words only, never at a syllable. */
const TITLE_RULE = 'hyphens-none';
/** THE TITLE'S BELT — the SC 1.4.12 wrap on the heading's own element. */
const TITLE_BELT = 'wrap-anywhere';
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
const MUTED_TEXT = 'text-base text-ink-muted';
/** ui/Card's `framed` row, the tokens that tell it from the others (never the
 *  atom's whole class string — tests/unit/card-single-spelling.test.ts would
 *  count a contiguous copy of its geometry as a second spelling). */
const FRAMED = [
  'border-[3px]',
  'border-(--card-tint)',
  'bg-surface',
  'p-[calc(var(--spacing)*6_-_2px)]',
];
/** ui/PillButton's TAG — the atom's box and glow, and the resting chip's
 *  HOVER face held still: the lavender edge and label on the white ground
 *  (PostCard's THE TAGS). */
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
/** ui/TextButton's ACCENT rest — the hover's lavender at rest, the underline
 *  folded until a hover draws it. */
const ACCENT_AT_REST = ['text-accent', 'after:scale-x-0'];

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The list's own design pixel, read off its class list IN PARTS (the harness
 * note): the one token that declares `PIXEL` behind THE GUARD, as the larger
 * of a floor — FLOOR rem over DIVISOR — and the card's content width
 * (`100cqw`) over W. Throws by name when there is no such token, or more than
 * one, or its shape moved. The pattern is built from strings, so no bracketed
 * declaration stands in this file's text.
 */
const chipPixelOf = (
  tokens: readonly string[],
): { floorRem: number; divisor: number; reference: number } => {
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
    `^${escape(GUARD)}\\${open}${PIXEL}:max\\(calc\\(${number}rem/${number}\\),calc\\(100cqw/${number}\\)\\)\\]$`,
  ).exec(declarations[0] ?? '');
  if (!shape?.[1] || !shape[2] || !shape[3]) {
    throw new Error(`the list's pixel moved: ${declarations[0] ?? ''}`);
  }
  return {
    floorRem: Number(shape[1]),
    divisor: Number(shape[2]),
    reference: Number(shape[3]),
  };
};

const renderCard = (overrides: Partial<PostCardProps> = {}) =>
  render(
    <PostCard
      {...POST}
      tagsLabel={TAGS_LABEL}
      readMore={READ_MORE_LABEL}
      {...overrides}
    />,
  );

/** One of the card's boxes — or a throw that NAMES the part it expected
 *  where the card puts it, of the kind it expected (never a bare cast, whose
 *  miss surfaces lines later as a TypeError about `undefined`). */
const part = <T extends Element>(
  element: Element | null | undefined,
  name: string,
  kind: new () => T,
): T => {
  if (!(element instanceof kind)) {
    throw new Error(
      `PostCard: the ${name} is not where the card puts it (found ${element?.tagName ?? 'nothing'}).`,
    );
  }
  return element;
};

/** The card's boxes, reached from the <article>: ui/Card is its one child,
 *  and the card holds the picture's cell and the words; the words end on the
 *  footer row. None of them carries a role — they are layout — so structure
 *  is the only honest way in, and every step is a named `part`. */
const partsOf = (root: Element | null) => {
  const article = part(root, 'article', HTMLElement);
  const card = part(article.firstElementChild, 'card (ui/Card)', HTMLElement);
  const cell = part(card.children[0], 'picture’s cell', HTMLElement);
  const words = part(card.children[1], 'words', HTMLElement);
  const footer = part(words.lastElementChild, 'footer row', HTMLElement);
  return {
    card,
    cell,
    words,
    footer,
    picture: part(cell.querySelector('img'), 'picture', HTMLImageElement),
    author: part(words.children[1], 'author', HTMLElement),
    readingTime: part(footer.children[0], 'reading time', HTMLElement),
    readMore: part(footer.children[1], 'read-more', HTMLElement),
  };
};

/**
 * Source with its PROSE removed — what the zero-island and call-site guards
 * run against: the header discusses `'use client'`, the hook it has, the
 * handlers it does not and the props it passes, by name. Full-line comments
 * go first (a line comment may hold a block opener of its own — the accent
 * census's three-pass lesson), then blocks — JSX comments included — then
 * the comments that trail code.
 */
const stripComments = (code: string): string =>
  code
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const CODE = stripComments(source);

/**
 * ui/Card's framed row and its geometry, READ OUT OF CARD.TSX — the
 * KEEP-IN-SYNC the picture's bleed, its corner and the words' inset follow:
 * the row's padding (N spacing steps less M pixels), its frame (a border of
 * B pixels) and the gap the card's column keeps between its children. Each
 * read throws by name when the shape it expects is gone. (Described in words
 * on purpose: Tailwind reads this file too, and a class-shaped example here
 * would ship a rule nothing wears.)
 */
const cardSpelling = (() => {
  const code = stripComments(cardSource);
  const framed = /\bframed:\s*'([^']*)'/.exec(code)?.[1];
  if (!framed) throw new Error('Card.tsx: no `framed` row in toneClasses.');
  const padding =
    /(?:^|\s)p-\[(calc\(var\(--spacing\)\*(\d+)_-_(\d+)px\))\]/.exec(framed);
  const frame = /(?:^|\s)border-\[(\d+px)\]/.exec(framed);
  const geometry = /\bconst cardGeometry = '([^']*)'/.exec(code)?.[1];
  const gap = /(?:^|\s)gap-(\d+)(?:\s|$)/.exec(geometry ?? '');
  if (!padding?.[1] || !padding[2] || !padding[3]) {
    throw new Error(`Card.tsx: the framed padding moved — ${framed}`);
  }
  if (!frame?.[1])
    throw new Error(`Card.tsx: the framed border moved — ${framed}`);
  if (!gap?.[1])
    throw new Error(`Card.tsx: the geometry's gap moved — ${geometry}`);
  return {
    padding: padding[1],
    steps: Number(padding[2]),
    less: Number(padding[3]),
    frame: frame[1],
    gap: Number(gap[1]),
  };
})();

/**
 * THE PAGE'S GRID, READ OUT OF sections/PostList (its THE LIST constant,
 * `GRID`) — the other KEEP-IN-SYNC: the grid this suite's frame and the
 * stories' frame copy, and the one the picture's `sizes` switches with.
 * Throws by name when the constant is gone.
 */
const pageGrid = (() => {
  const grid = /\bconst GRID =\s*'([^']*)'/.exec(
    stripComments(postListSource),
  )?.[1];
  if (!grid) throw new Error('PostList.tsx: no `GRID` constant — it moved.');
  return grid;
})();

/** THE FRAME'S GRID — the page's, spelled out for the frame this suite
 *  measures in (`renderInPage`); "the frames ARE the page's grid" holds it
 *  equal to `pageGrid`, the stories' copy too. */
const FRAME_GRID = 'grid grid-cols-1 gap-8 @xl:grid-cols-2 @4xl:grid-cols-3';

describe('PostCard — an <article> named by its own title', () => {
  it('names the article with the title alone, through aria-labelledby — always the page’s <h2>', () => {
    const { container } = renderCard();

    const article = screen.getByRole('article', { name: POST.title });
    const heading = screen.getByRole('heading', { level: 2, name: POST.title });
    expect(article).toBe(container.firstElementChild);
    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBeTruthy();
    expect(article).toHaveAttribute('aria-labelledby', heading.id);
    expect(article).toContainElement(heading);
    // The id names the HEADING; the article carries none of its own.
    expect(article).not.toHaveAttribute('id');
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('gives two cards on one page two different ids (useId)', () => {
    // The index renders a grid of these; a fixed id would collide and both
    // articles would be named by the first title.
    render(
      <>
        <PostCard {...POST} tagsLabel={TAGS_LABEL} readMore={READ_MORE_LABEL} />
        <PostCard
          {...POST}
          title="Ce este tartrul"
          tagsLabel={TAGS_LABEL}
          readMore={READ_MORE_LABEL}
        />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first?.id).not.toBe(second?.id);
    expect(
      screen.getByRole('article', { name: 'Ce este tartrul' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: POST.title }),
    ).toBeInTheDocument();
  });

  it('dresses the title in ui/Heading’s `band` step, on the default ink — then its rule and its belt, and nothing else', () => {
    renderCard();

    expect(tokensOf(screen.getByRole('heading', { level: 2 }))).toEqual([
      ...BAND_TITLE,
      TITLE_RULE,
      TITLE_BELT,
    ]);
  });

  it('never splits a title word at a syllable — `hyphens-none` on the title’s own <h2>, and on nothing round it (the owner, 2026-10-15)', () => {
    // The site's `hyphens: auto` (§15.14) broke card titles inside a word —
    // „Zahnbürs-te" on a phone, „pe-riuța" in a two-column card — and the
    // owner answered the one-class lever with "as you say" (PostCard's THE
    // TITLE NEVER SPLITS A WORD). Merged by the slot after the atom's step,
    // just before the belt, on the heading element itself: the computed
    // `hyphens: none` and the breaks it leaves are PostCard.titles.test.tsx's
    // to measure, in the real face.
    renderCard();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(
      tokensOf(heading).filter((token) => token === TITLE_RULE),
    ).toHaveLength(1);
    expect(tokensOf(heading).at(-2)).toBe(TITLE_RULE);
    // The rule rides the heading alone: `hyphens` inherits, so on the article
    // or the words box it would reach the summary too — prose, which keeps
    // the site's syllable breaks (§15.14).
    const { words } = partsOf(screen.getByRole('article'));
    expect(tokensOf(screen.getByRole('article'))).not.toContain(TITLE_RULE);
    expect(tokensOf(words)).not.toContain(TITLE_RULE);
    const summary = part(words.children[3], 'summary', HTMLElement);
    expect(summary.textContent).toBe(POST.summary);
    expect(tokensOf(summary)).not.toContain(TITLE_RULE);
  });

  it('wears the SC 1.4.12 belt, `wrap-anywhere`, on the title’s own <h2> (G2 a11y, 2026-10-14)', () => {
    // Text spacing widens a word, and with the title's hyphenation off
    // (THE TITLE NEVER SPLITS A WORD) a word wider than the card's line
    // would run past the card (PostCard's THE TITLE'S BELT, measured);
    // `overflow-wrap: anywhere` breaks only such a word. Merged LAST by the
    // slot, after the atom's step and the rule, on the heading element itself.
    renderCard();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(tokensOf(heading).at(-1)).toBe(TITLE_BELT);
    expect(
      tokensOf(heading).filter((token) => token === TITLE_BELT),
    ).toHaveLength(1);
    // The belt rides the heading alone: the words around it keep their own
    // wrapping, and the article's class list is the jump's.
    expect(tokensOf(partsOf(screen.getByRole('article')).words)).toEqual(WORDS);
    expect(tokensOf(screen.getByRole('article'))).not.toContain(TITLE_BELT);
  });

  it('keeps the title’s name against naming attributes that slip past the types', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so both of these compile despite the Omit; the spread rides
    // first (the header's THE NAME), so the pairing still wins — and the
    // smuggled `aria-label` is reset after the spread, so no second name
    // stands in the markup beside the title's (G2 typescript, 2026-10-14).
    render(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        aria-labelledby="elsewhere"
        aria-label="Alt nume"
      />,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    const article = screen.getByRole('article', { name: POST.title });
    expect(article).toHaveAttribute('aria-labelledby', heading.id);
    expect(article).not.toHaveAttribute('aria-label');
  });

  it('stays an article against a `role` that slips past the types — reset after the spread (the tier-2 review, 2026-10-14)', () => {
    // The type refuses a written `role` (the directive below fails `tsc` the
    // day it compiles); a spread of a wider object could still carry one, so
    // the card resets it after the spread, as it resets `aria-label` — a role
    // here would unmake the article its list and its name rely on.
    render(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        // @ts-expect-error — the card is an article; `role` is Omitted (THE NAME)
        role="presentation"
      />,
    );

    const article = screen.getByRole('article', { name: POST.title });
    expect(article.tagName).toBe('ARTICLE');
    expect(article).not.toHaveAttribute('role');
  });
});

describe('PostCard — the frame: the doctor card’s, asked of ui/Card', () => {
  it('puts ui/Card’s framed tone and SOFT corner inside the article — no glow, `relative h-full` merged last', () => {
    const { card } = partsOf(renderCard().container.firstElementChild);

    const tokens = tokensOf(card);
    expect(card.tagName).toBe('DIV');
    for (const token of FRAMED) expect(tokens).toContain(token);
    // THE FRAME: sections/PersonnelCard's own two props — the 1rem corner,
    // never the house's 6px.
    expect(tokens).toContain('rounded-soft');
    expect(tokens).not.toContain('rounded-md');
    expect(tokens).not.toContain('shadow-aura');
    // Placement, merged last by the atom (§6.8): the chips' positioning
    // scope, and the height a stretched list hands the article.
    expect(tokens.slice(-2)).toEqual(['relative', 'h-full']);
  });

  it('asks for exactly that, once, in code: `tone="framed" corners="soft"`', () => {
    // The two props at the one call site — the soft-corner census counts this
    // file among the askers by the same spelling.
    const asks = [...CODE.matchAll(/<Card\b([^>]*)>/g)].map((m) => m[1]);
    expect(asks).toHaveLength(1);
    expect(asks[0]).toMatch(/\btone="framed"/);
    expect(asks[0]).toMatch(/\bcorners="soft"/);
    expect(asks[0]).not.toMatch(/\baura\b/);
  });
});

describe('PostCard — the picture, out to the frame', () => {
  it('fills a 3:2 cell with ui/Image’s PLAIN photograph — fill, object-cover, its alt as given', () => {
    const { cell, picture } = partsOf(renderCard().container.firstElementChild);

    expect(tokensOf(cell)).toEqual(PICTURE);
    expect(screen.getByRole('img', { name: POST.image.alt })).toBe(picture);
    expect(picture).toHaveAttribute('data-nimg', 'fill');
    // `plain` contributes nothing (ui/Image D5): the cell owns the corners,
    // so the photograph wears the one cover rule and no radius of its own.
    expect(tokensOf(picture)).toEqual(['object-cover']);
  });

  it('bleeds through ui/Card’s framed padding EXACTLY as Card.tsx spells it — KEEP-IN-SYNC, read from the atom', () => {
    const { cell } = partsOf(renderCard().container.firstElementChild);
    const tokens = tokensOf(cell);

    // The negative margins ARE the framed row's padding, byte for byte, on
    // the top and on both sides — and never on the bottom, where the words
    // follow on the card's own gap.
    expect(tokens).toContain(`-mx-[${cardSpelling.padding}]`);
    expect(tokens).toContain(`-mt-[${cardSpelling.padding}]`);
    expect(tokens.filter((token) => /^-?m[trblxyse]?-/.test(token))).toEqual([
      `-mx-[${cardSpelling.padding}]`,
      `-mt-[${cardSpelling.padding}]`,
    ]);
    // The top corners are the frame's INNER curve: the soft radius less the
    // framed row's border.
    expect(tokens).toContain(
      `rounded-t-[calc(var(--radius-soft)_-_${cardSpelling.frame})]`,
    );
  });

  it('sets the words as far under the picture as the frame’s padding — the card’s gap plus the rest, read from the atom', () => {
    const { words } = partsOf(renderCard().container.firstElementChild);

    // N steps less M px of padding (the framed row), of which the card's
    // own column gap already spends `gap` steps: the words' top padding is
    // the remainder, so gap + padding-top = the frame's padding exactly.
    expect(tokensOf(words)).toContain(
      `pt-[calc(var(--spacing)*${cardSpelling.steps - cardSpelling.gap}_-_${cardSpelling.less}px)]`,
    );
  });

  it('treats an empty alt as decorative — no image in the accessibility tree', () => {
    renderCard({ image: { src: POST.image.src, alt: '' } });

    expect(screen.queryByRole('img')).toBeNull();
    expect(partsOf(screen.getByRole('article')).picture).toHaveAttribute(
      'alt',
      '',
    );
  });

  it('asks for its real box in `sizes` — a third of the column from 71.25rem, half from 46.25rem, 30rem past the band scale’s cap', () => {
    const { picture } = partsOf(renderCard().container.firstElementChild);

    expect(picture).toHaveAttribute('sizes', SIZES);
    // THE SPACE BEFORE EACH `vw` (the header): next/image reads the shares
    // that start a token or follow a space, and keeps the candidates from
    // the smallest one up.
    expect([...SIZES.matchAll(/(^|\s)(\d+)vw/g)].map((m) => m[2])).toEqual([
      '25',
      '40',
      '90',
    ]);
  });

  it('loads LAZILY when not asked — and carries no `fetchpriority`', () => {
    const { picture } = partsOf(renderCard().container.firstElementChild);

    expect(picture).toHaveAttribute('loading', 'lazy');
    expect(picture).not.toHaveAttribute('fetchpriority');
  });

  it('loads EAGERLY at high priority when the page asks — its first card, a likely LCP', () => {
    const { picture } = partsOf(
      renderCard({ preload: true }).container.firstElementChild,
    );

    expect(picture).toHaveAttribute('fetchpriority', 'high');
    expect(picture).not.toHaveAttribute('loading', 'lazy');
    // …and the pair's third effect, a preload link for the SAME srcset and
    // `sizes` (asserted present only — React keeps one link per srcset for
    // the document's life; the PersonnelCard suite's note).
    const link = [
      ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
    ].find(
      (element) =>
        element.getAttribute('imagesrcset') === picture.getAttribute('srcset'),
    );
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect(link).toHaveAttribute('imagesizes', SIZES);
    expect(link).toHaveAttribute('fetchpriority', 'high');
  });
});

describe('PostCard — the words: title, author, summary, in that order', () => {
  it('puts the picture first, then the words — title, author, the tags, the summary, the footer row (DOM order)', () => {
    const { card, cell, words, author, footer } = partsOf(
      renderCard().container.firstElementChild,
    );

    expect(card.children).toHaveLength(2);
    expect(card.children[0]).toBe(cell);
    expect(tokensOf(words)).toEqual(WORDS);
    expect([...words.children].map((child) => child.tagName)).toEqual([
      'H2',
      'P',
      'UL',
      'P',
      'DIV',
    ]);
    expect(words.children[0]).toBe(screen.getByRole('heading', { level: 2 }));
    expect(words.children[1]).toBe(author);
    expect(words.children[2]).toBe(screen.getByRole('list'));
    expect(words.lastElementChild).toBe(footer);
  });

  it('signs the card with the author on ui/Eyebrow, unhyphenated — and prints no date', () => {
    const { container } = renderCard();
    const { author } = partsOf(container.firstElementChild);

    expect(author.tagName).toBe('P');
    expect(author.className).toBe(`${EYEBROW_RECIPE} hyphens-none`);
    expect(author.textContent).toBe(POST.author);
    expect(author.children).toHaveLength(0);
    // THE DATE LEFT THE CARD: no <time>, nowhere.
    expect(container.querySelector('time')).toBeNull();
    expect(screen.queryByRole('time')).toBeNull();
  });

  it('closes the words on the summary, in ui/Text’s muted ink', () => {
    const { words } = partsOf(renderCard().container.firstElementChild);

    const summary = part(words.children[3], 'summary', HTMLElement);
    expect(summary.tagName).toBe('P');
    expect(summary.textContent).toBe(POST.summary);
    expect(summary.className).toBe(MUTED_TEXT);
  });
});

describe('PostCard — the tags: ui/PillButton’s TAGS — labels, not buttons — over the picture', () => {
  it('renders a list named by `tagsLabel`, one <li> per tag in the DATA’s order — the reversal is paint alone', () => {
    renderCard();

    const list = screen.getByRole('list', { name: TAGS_LABEL });
    expect(list.tagName).toBe('UL');
    // Load-bearing in WebKit, which drops list semantics from an unstyled
    // list (eslint.config.mjs's list-role exception).
    expect(list).toHaveAttribute('role', 'list');
    // The placement first, then THE CHIPS FOLLOW THEIR CARD's two tokens —
    // the pixel's declaration, then the remap, each behind THE GUARD.
    const tokens = tokensOf(list);
    expect(tokens.slice(0, TAGS.length)).toEqual(TAGS);
    expect(tokens).toHaveLength(TAGS.length + 2);
    expect(tokens.at(-2)?.startsWith(`${GUARD}[${PIXEL}:`)).toBe(true);
    expect(tokens.at(-1)).toBe(`${GUARD}${REMAP}`);
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([...POST.tags]);
  });

  it('draws the list in a design pixel of its OWN — the card’s content width over the owner’s reference, never under 0.75rem / 18 (THE CHIPS FOLLOW THEIR CARD)', () => {
    renderCard();

    const list = screen.getByRole('list', { name: TAGS_LABEL });
    // The floor: 0.75rem over 18 — a label (text-lg, 18 of the pixel) never
    // under 0.75rem, 12px at the default root.
    expect(chipPixelOf(tokensOf(list))).toEqual({
      floorRem: 0.75,
      divisor: 18,
      reference: REFERENCE_CONTENT,
    });
    // The pixel and the remap ride the LIST alone: the chips inherit them,
    // and nothing else in the card declares a pixel or wears a remap.
    const card = screen.getByRole('article');
    for (const element of [card, ...card.querySelectorAll('*')]) {
      if (element === list) continue;
      for (const token of tokensOf(element)) {
        expect(token).not.toContain(REMAP);
        expect(token).not.toContain(PIXEL);
      }
    }
  });

  it('puts BOTH behind THE GUARD — an engine without container units (Safari 15, iOS 15) never reads either, and keeps the theme’s own chips', () => {
    renderCard();

    // The guard and nothing else in front of each — the pixel's declaration,
    // then the remap — and no other token of the list wears it: the
    // placement must hold in every engine.
    const tokens = tokensOf(screen.getByRole('list', { name: TAGS_LABEL }));
    const guarded = tokens.filter((token) => token.includes(GUARD));
    expect(guarded.map((token) => token.slice(GUARD.length))).toEqual([
      expect.stringMatching(new RegExp(`^\\[${PIXEL}:max\\(`)),
      REMAP,
    ]);
    for (const token of guarded) expect(token.startsWith(GUARD)).toBe(true);
    for (const token of TAGS) expect(tokens).toContain(token);
  });

  it('is positioned against the CARD: the card says `relative`, the words between stay unpositioned', () => {
    const { card, words } = partsOf(renderCard().container.firstElementChild);

    expect(tokensOf(card)).toContain('relative');
    for (const token of tokensOf(words)) {
      expect(token).not.toMatch(/^(relative|absolute|fixed|sticky)$/);
    }
  });

  it('dresses each <li> as ui/PillButton’s TAG — the lavender edge and label on white, held still: no hover rule, never current', () => {
    renderCard();

    const items = within(
      screen.getByRole('list', { name: TAGS_LABEL }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(POST.tags.length);
    for (const item of items) {
      expect(item.tagName).toBe('LI');
      const tokens = tokensOf(item);
      for (const token of CHIP_TAG) expect(tokens).toContain(token);
      // Not the control's resting face — the card tint's edge, the ink
      // label — whose hover a tag no longer has…
      expect(tokens).not.toContain('border-card-tint');
      expect(tokens).not.toContain('text-ink');
      // …no hover of its own in ANY form — nothing moves under a pointer
      // (the owner: "should not be dinamic") — and never the current face,
      // the lavender fill.
      expect(tokens.filter((token) => token.includes('hover'))).toEqual([]);
      expect(tokens).not.toContain('bg-accent');
      expect(item).not.toHaveAttribute('aria-current');
      // `asChild` leaves no <button> attribute on the item, and `kind` never
      // reaches the DOM.
      expect(item.getAttributeNames()).toEqual(['class']);
    }
  });

  it('asks ui/PillButton for `kind="tag"` in code — the one call site, never `active`', () => {
    // A KIND of the atom's, never a className restyle (§6.8): the call site
    // names the situation and the atom paints it.
    const calls = [...CODE.matchAll(/<PillButton\b([^>]*)>/g)].map((m) => m[1]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/\bkind="tag"/);
    expect(calls[0]).toMatch(/\basChild\b/);
    expect(calls[0]).not.toMatch(/\bactive\b/);
    expect(calls[0]).not.toMatch(/\bclassName\b/);
  });

  it('renders no list at all when the post has no tags — and the words keep their order', () => {
    renderCard({ tags: [] });

    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    const { words } = partsOf(screen.getByRole('article'));
    expect([...words.children].map((child) => child.tagName)).toEqual([
      'H2',
      'P',
      'P',
      'DIV',
    ]);
  });
});

describe('PostCard — the footer row: the reading time, and the read-more at the end', () => {
  it('lays ONE row on the card’s floor — the reading time in ui/Text’s muted ink, then the read-more', () => {
    const { footer, readingTime, readMore } = partsOf(
      renderCard().container.firstElementChild,
    );

    expect(footer.tagName).toBe('DIV');
    expect(tokensOf(footer)).toEqual(FOOTER);
    expect(footer.children).toHaveLength(2);
    expect(readingTime.tagName).toBe('P');
    expect(readingTime.className).toBe(MUTED_TEXT);
    expect(readingTime.textContent).toBe(POST.readingTime);
    expect(readMore.tagName).toBe('A');
    expect(readMore.textContent).toBe(READ_MORE_LABEL);
  });

  it('dresses the read-more as ui/TextButton’s ACCENT tone — the hover’s lavender at rest — placed at the end, its label on the edge', () => {
    const { readMore } = partsOf(renderCard().container.firstElementChild);

    const tokens = tokensOf(readMore);
    for (const token of ACCENT_AT_REST) expect(tokens).toContain(token);
    // Not the menu's ink, and never the current page's full underline.
    expect(tokens).not.toContain('text-ink');
    expect(tokens).not.toContain('after:scale-x-100');
    // The atom's chrome-less box and its hover underline are still there…
    expect(tokens).toContain('hover:after:scale-x-100');
    expect(tokens).toContain('px-2');
    // …and the card's hover draws the same look: THE WHOLE CARD DRAWS THE
    // UNDERLINE, the atom's group pair.
    for (const token of GROUP_HOVER) expect(tokens).toContain(token);
    // Placement, merged LAST by the slot (§6.8).
    expect(tokens.slice(-READ_MORE.length)).toEqual(READ_MORE);
    // `tone`, `hoverArea` and `asChild` never reach the DOM; no current-page
    // mark.
    // (An HTML attribute name is case-blind, so one read covers `hoverArea`.)
    expect(readMore).not.toHaveAttribute('tone');
    expect(readMore).not.toHaveAttribute('hoverarea');
    expect(readMore).not.toHaveAttribute('aria-current');
  });

  it('asks ui/TextButton for `tone="accent"` and `hoverArea="area"` in code — the one call site', () => {
    const calls = [...CODE.matchAll(/<TextButton\b([^>]*)>/g)].map((m) => m[1]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/\btone="accent"/);
    expect(calls[0]).toMatch(/\bhoverArea="area"/);
    expect(calls[0]).toMatch(/\basChild\b/);
    expect(calls[0]).not.toMatch(/\bactive\b/);
  });

  it('is HTML’s PLACEHOLDER link — an <a> with no href: no link role, no tab stop, until the article pages exist', () => {
    const { readMore } = partsOf(renderCard().container.firstElementChild);

    expect(readMore).not.toHaveAttribute('href');
    expect(screen.queryByRole('link')).toBeNull();
    readMore.focus();
    expect(document.activeElement).not.toBe(readMore);
    // Its words are still read, as text, after the reading time.
    expect(screen.getByText(READ_MORE_LABEL)).toBe(readMore);
  });
});

describe('PostCard — the jump, and nothing to press', () => {
  it('carries THE CARD JUMP on the article: 200ms, the keyword ease-out, 105 %, still under reduced motion — and the read-more’s hover area beside it', () => {
    renderCard();

    const article = screen.getByRole('article');
    // Exactly the jump, in order, then the hover area — the card's two own
    // classes, nothing else.
    expect(tokensOf(article)).toEqual([...JUMP, HOVER_AREA]);
    // THE JUMP STAYS byte for byte (the owner: "must remain"): the constant
    // the jump census reads is the jump alone — the hover area rides beside
    // it in the class list, never inside it.
    const jump = /const CARD_JUMP =([^;]*);/.exec(CODE)?.[1] ?? '';
    expect([...jump.matchAll(/'([^']*)'/g)].map((m) => m[1]).join('')).toBe(
      JUMP.join(' '),
    );
    expect(jump.replace(/'[^']*'/g, '').trim()).toMatch(/^[+\s]*$/);
    // No press state — there is nothing to press — and no growing shadow
    // anywhere in the card (the jump census refuses the old pop's other half).
    for (const element of [article, ...article.querySelectorAll('*')]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^active:/);
        expect(token).not.toMatch(/(^|:)(hover|active):(inset-)?shadow-/);
      }
    }
  });

  it('has nothing focusable or interactive inside — no link, no button, no tabindex, no role but the list’s', () => {
    const { container } = renderCard();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(
      container.querySelectorAll(
        'a[href], button, input, select, textarea, summary, details, iframe, [href], [tabindex], [contenteditable]',
      ),
    ).toHaveLength(0);
    // The one <a> is the read-more's placeholder.
    expect(container.querySelectorAll('a')).toHaveLength(1);
    const roles = [...container.querySelectorAll('[role]')].map((element) =>
      element.getAttribute('role'),
    );
    expect(roles).toEqual(['list']);
  });
});

describe('PostCard — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the article itself', () => {
    renderCard({ className: 'h-full' });

    const tokens = tokensOf(screen.getByRole('article'));
    expect(tokens.at(-1)).toBe('h-full');
    expect(tokens.slice(0, JUMP.length)).toEqual(JUMP);
    expect(tokens.at(-2)).toBe(HOVER_AREA);
  });

  it('spreads native props onto the article, never onto the atoms', () => {
    render(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        id="cum-iti-alegi-periuta-de-dinti"
        lang="ro"
        data-slot="post-card"
      />,
    );

    const article = screen.getByRole('article', { name: POST.title });
    expect(article).toHaveAttribute('id', 'cum-iti-alegi-periuta-de-dinti');
    expect(article).toHaveAttribute('lang', 'ro');
    expect(article).toHaveAttribute('data-slot', 'post-card');
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute(
      'data-slot',
    );
  });

  it('keeps its own props off the article — no tooltip, no stray attribute', () => {
    renderCard();

    // `title` is the card's heading text, never HTML's tooltip; the content
    // props are destructured, so nothing of theirs rides the spread.
    expect(screen.getByRole('article').getAttributeNames().sort()).toEqual([
      'aria-labelledby',
      'class',
    ]);
  });

  it('accepts ref as a regular prop (React 19) — it is the <article>', () => {
    const root = createRef<HTMLElement>();
    renderCard({ ref: root });

    expect(root.current?.tagName).toBe('ARTICLE');
    expect(root.current).toBe(screen.getByRole('article'));
  });

  it('owns no OUTER margin — and inside, only its own geometry: the picture’s bleed and the footer row’s placement', () => {
    // §6.4: the page's list owns the spacing between cards, so the article
    // carries no margin. The margins inside are this section's own geometry,
    // each named: the bleed through the frame's padding (THE PICTURE), the
    // footer row on the floor and the read-more at its end (THE FOOTER ROW).
    const { container } = renderCard();
    const margins = [...container.querySelectorAll('*')].flatMap((element) =>
      tokensOf(element).filter((token) => /^-?m[trblxyse]?-/.test(token)),
    );

    expect(
      tokensOf(screen.getByRole('article')).filter((token) =>
        /^-?m[trblxyse]?-/.test(token),
      ),
    ).toEqual([]);
    expect(margins).toEqual([
      '-mx-[calc(var(--spacing)*6_-_2px)]',
      '-mt-[calc(var(--spacing)*6_-_2px)]',
      'mt-auto',
      'ms-auto',
      '-me-2',
    ]);
  });
});

describe('PostCard — zero islands of its own, zero message keys', () => {
  it('ships NO client directive and calls ONE hook, the server-safe useId (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(']);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
  });

  it('imports EXACTLY the seven atoms it composes, lib/cx and one lib TYPE', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // atom swapped for one with state would hydrate the whole index. ui/Image
    // is the one accepted island (its optimizer's), named here so the
    // question is asked out loud the day an eighth import arrives. The lib
    // module arrives as a TYPE only — zero bytes, no lib DATA in this tier.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Card/Card',
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Image/Image',
      '@/components/ui/PillButton/PillButton',
      '@/components/ui/Text/Text',
      '@/components/ui/TextButton/TextButton',
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{ ImagePath \} from '@\/lib\/image-path\/image-path';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders every string intact — diacritics and all — and no message key path (§8.1)', () => {
    const { container } = renderCard();

    expect(container.textContent).toBe(
      `${POST.title}${POST.author}${POST.tags.join('')}${POST.summary}${POST.readingTime}${READ_MORE_LABEL}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('PostCard — type-level pins', () => {
  it('pins the deliberate type decisions so a refactor cannot quietly widen them', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    // The article is named by its own title: a caller can neither rename it
    // nor nest content that would vanish.
    expectTypeOf<PostCardProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<PostCardProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostCardProps>().not.toHaveProperty('children');
    // THE FALSE AFFORDANCE's promises, kept by the type (the header's THE
    // NAME): an article it stays, nothing in it takes focus, and no markup
    // arrives but the named props'.
    expectTypeOf<PostCardProps>().not.toHaveProperty('role');
    expectTypeOf<PostCardProps>().not.toHaveProperty('tabIndex');
    expectTypeOf<PostCardProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    // THE DATE LEFT THE CARD (the header's THE AUTHOR): no prop for it.
    expectTypeOf<PostCardProps>().not.toHaveProperty('date');
    // The title is the page's <h2>, always: no level to choose (THE NAME).
    expectTypeOf<PostCardProps>().not.toHaveProperty('headingLevel');
    // `title` is the heading's text, never the native tooltip's string|undefined.
    expectTypeOf<PostCardProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardProps['preload']>().toEqualTypeOf<
      boolean | undefined
    >();
    // Every string arrives finished, and every one is required.
    expectTypeOf<PostCardProps['tagsLabel']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardProps['readMore']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardContent['readingTime']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardContent['author']>().toEqualTypeOf<string>();
    // The picture under the optimizer's one folder, read-only as lib/blog's
    // BlogPost holds it (G2 typescript, 2026-10-14) — the pin is an identity,
    // so it compares each property's readonly flag as well as its type — and
    // the tags read-only.
    expectTypeOf<PostCardContent['image']>().toEqualTypeOf<
      Readonly<{ src: ImagePath; alt: string }>
    >();
    expectTypeOf<PostCardContent['tags']>().toEqualTypeOf<readonly string[]>();
  });
});

/** THE POINTER, PARKED away from the card before anything is measured — a
 *  resting pointer is :hover (the house's park-the-pointer rule,
 *  PillButton.test.tsx's helper), and a hovered card JUMPS: a 105 % transform
 *  would scale every rectangle read below. A REAL pointer (vitest/browser's
 *  userEvent): a synthetic event cannot move :hover. Returns the clean-up.
 *  THE POINTER OUTLIVES THIS FILE: the box goes, the pointer stays at its
 *  centre, over the top-left corner where the next file in the same browser
 *  page renders — MEASURED (2026-10-15), PostCard.titles.test.tsx's first
 *  card turned :hover there within 100ms, so that file parks its own
 *  (its THE POINTER, PARKED — a copy of this one, KEEP-IN-SYNC). */
const parkPointer = async (): Promise<() => void> => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  return () => parking.remove();
};

/** THE STILLNESS RULE (the PR #45 rule, Ribbon.test.tsx's spelling), for a
 *  block that reads computed values: unlayered, so it beats every @layer'd
 *  utility — the card's colour fade, its jump and the read-more's underline
 *  never run under a reading. Registers the calling block's own hooks. */
const holdStill = (): void => {
  let still: HTMLStyleElement | undefined;
  beforeAll(() => {
    still = document.createElement('style');
    still.textContent =
      '*, *::before, *::after { transition: none !important; animation: none !important; }';
    document.head.append(still);
  });
  afterAll(() => {
    still?.remove();
  });
};

/** THE POINTER, PARKED before each reading of the calling block
 *  (parkPointer above). */
const parkBeforeEach = (): void => {
  let unpark: (() => void) | undefined;
  beforeEach(async () => {
    unpark = await parkPointer();
  });
  afterEach(() => {
    unpark?.();
    unpark = undefined;
  });
};

/** The root's font size, in px — 16 in this runner unless a case moves it. */
const rootPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The theme's spacing step — `--spacing`, 0.25rem — read off the root rather
 *  than baked in (the stories' rem() rule): 4px at the 16px root this runner
 *  keeps. */
const themeStep = (): number => rootPx() / 4;

/** A card's CONTENT width — its border box less the frame and the padding,
 *  the box `100cqw` reads inside it (ui/Card is the list's nearest
 *  container). Layout values, to the engine's 1/64px. */
const contentWidthOf = (card: Element): number => {
  const style = getComputedStyle(card);
  return (
    card.getBoundingClientRect().width -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth) -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  );
};

/** THE CHIPS FOLLOW THEIR CARD, the arithmetic the stylesheet runs — the
 *  larger of the floor (FLOOR rem over DIVISOR) and the card's content width
 *  over the reference — with every number read off the list's own class, so
 *  this states the formula and the class states the values. */
const expectedChipPixel = (list: Element, contentWidth: number): number => {
  const { floorRem, divisor, reference } = chipPixelOf(tokensOf(list));
  return Math.max((floorRem * rootPx()) / divisor, contentWidth / reference);
};

/** The chips as the engine draws them: the list's own pixel, its inset from
 *  the picture's top-right corner and its gap, and each chip's height, its
 *  padding and its label. */
const chipsOf = (cell: Element) => {
  const list = screen.getByRole('list', { name: TAGS_LABEL });
  const listBox = list.getBoundingClientRect();
  const picture = cell.getBoundingClientRect();
  const listStyle = getComputedStyle(list);
  return {
    list,
    pixel: parseFloat(listStyle.getPropertyValue(PIXEL)),
    inset: {
      top: listBox.top - picture.top,
      right: picture.right - listBox.right,
    },
    gap: parseFloat(listStyle.columnGap),
    chips: within(list)
      .getAllByRole('listitem')
      .map((item) => {
        const style = getComputedStyle(item);
        return {
          height: item.getBoundingClientRect().height,
          padding: parseFloat(style.paddingInlineStart),
          label: parseFloat(style.fontSize),
        };
      }),
  };
};

/** How much of its width a scale draws, read off a computed `scale`:
 *  Tailwind compiles its scale utilities onto the individual `scale`
 *  property, never `transform`, and Chromium reads back "0 1" for a rule
 *  swept away, "1" drawn and "1.05" for the jump (TextButton.test.tsx's
 *  reader) — the first value is the answer, and `none` is 1. */
const scaleXOf = (style: CSSStyleDeclaration): number => {
  if (style.scale === 'none') return 1;
  const x = style.scale.split(/\s+/)[0] ?? '';
  return x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x);
};

/** A semantic token's hex, read off the live sheet, as `rgb(r, g, b)` — the
 *  way the engine serializes a computed colour (TextButton.test.tsx's). */
const tokenRgb = (name: string): string => {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

/** A chip's PAINT as the engine computes it — its four edges, its label and
 *  its ground, each a computed `rgb(r, g, b)`. */
const faceOf = (chip: Element) => {
  const style = getComputedStyle(chip);
  return {
    edges: [
      style.borderTopColor,
      style.borderRightColor,
      style.borderBottomColor,
      style.borderLeftColor,
    ],
    label: style.color,
    ground: style.backgroundColor,
  };
};

/** A chip's SIZE as the engine computes it — computed lengths, which no
 *  transform touches, so the card's jump cannot move them while a hover
 *  could (the chips' own pixel, THE CHIPS FOLLOW THEIR CARD). */
const sizeOf = (chip: Element) => {
  const style = getComputedStyle(chip);
  return {
    height: style.height,
    padding: style.paddingInlineStart,
    label: style.fontSize,
  };
};

/** WCAG 2.2's contrast ratio of two computed `rgb(r, g, b)` colours: each
 *  one's relative luminance from its sRGB channels, then (the lighter + 0.05)
 *  over (the darker + 0.05). */
const contrastOf = (first: string, second: string): number => {
  const luminance = (color: string): number => {
    const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map((channel) => {
        const s = Number(channel) / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [one, two] = [luminance(first), luminance(second)];
  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
};

/**
 * A card in a plain box — `width` px wide, 360 unless asked — the
 * width-giving parent ui/Card's inline-size containment needs (Card's THE
 * CONTAINER MARK), either bare (the theme's own step) or inside a design
 * drawn at `scalePx`: `design-scale` is globals.css's real utility, the one
 * ui/Container's THE BAND SCALE switches on for the page's band. The scale
 * rides an inline style, never an arbitrary class: it varies per case, and
 * Tailwind reads class names from source text.
 */
const renderMeasured = ({
  scalePx,
  width = 360,
}: { scalePx?: number; width?: number } = {}) => {
  const style = {
    width: `${width}px`,
    ...(scalePx === undefined ? {} : { [PIXEL]: `${scalePx}px` }),
  } as CSSProperties;
  render(
    <div className={scalePx === undefined ? undefined : REMAP} style={style}>
      <PostCard {...POST} tagsLabel={TAGS_LABEL} readMore={READ_MORE_LABEL} />
    </div>,
  );
  const article = screen.getByRole('article', { name: POST.title });
  const parts = partsOf(article);
  const cardStyle = getComputedStyle(parts.card);
  const cardBox = parts.card.getBoundingClientRect();
  const frame = parseFloat(cardStyle.borderTopWidth);
  const padding = parseFloat(cardStyle.paddingTop);
  return {
    ...parts,
    article,
    cardStyle,
    frame,
    padding,
    contentWidth: contentWidthOf(parts.card),
    /** The frame's INNER edge — the card's padding box. */
    inner: {
      top: cardBox.top + frame,
      left: cardBox.left + frame,
      right: cardBox.right - frame,
    },
    /** The card's CONTENT box's right and bottom edges. */
    content: {
      right: cardBox.right - frame - padding,
      bottom: cardBox.bottom - frame - padding,
    },
    cellBox: parts.cell.getBoundingClientRect(),
    cellStyle: getComputedStyle(parts.cell),
    titleBox: screen.getByRole('heading', { level: 2 }).getBoundingClientRect(),
  };
};

/** THE PAGE'S FRAME, for the readings taken at a real window: a
 *  ui/Container, a rhythm box wearing THE BAND SCALE and the page's grid —
 *  one column, two from the column's 36rem, three from 56rem, 2rem apart —
 *  as FRAME_GRID, held equal to sections/PostList's GRID ("the frames ARE
 *  the page's grid"): a frame that drifted from the page would measure a
 *  card the page never draws. */
const renderInPage = (): void => {
  render(
    <section className="bg-page">
      <Container>
        <div className={cx(bandColumnClasses, bandScaleClasses, 'py-10')}>
          <ul role="list" className={FRAME_GRID}>
            <li>
              <PostCard
                {...POST}
                tagsLabel={TAGS_LABEL}
                readMore={READ_MORE_LABEL}
                className="h-full"
              />
            </li>
          </ul>
        </div>
      </Container>
    </section>,
  );
};

describe('PostCard — the picture, measured (real stylesheet)', () => {
  holdStill();
  parkBeforeEach();

  it.each([
    { scalePx: undefined, design: 'the theme’s own step' },
    { scalePx: 896 / 1106, design: 'the band scale’s own step (0.81px)' },
    { scalePx: 1.5, design: 'a 1.5px design pixel' },
  ])(
    'meets the frame’s inner edge on top and on both sides, its top corners on the frame’s inner curve — $design',
    ({ scalePx }) => {
      const m = renderMeasured({ scalePx });
      const step = scalePx === undefined ? themeStep() : 4 * scalePx;

      // The framed row as the engine renders it: a 3px frame at every step,
      // six steps less 2px of padding (ui/Card's THE SUM RULE).
      expect(m.frame).toBe(3);
      expect(m.padding).toBeCloseTo(6 * step - 2, 1);
      // FLUSH: 0px from the frame's inner edge, to the engine's layout unit.
      expect(m.cellBox.top - m.inner.top).toBeCloseTo(0, 1);
      expect(m.cellBox.left - m.inner.left).toBeCloseTo(0, 1);
      expect(m.inner.right - m.cellBox.right).toBeCloseTo(0, 1);
      // 3:2.
      expect(m.cellBox.width / m.cellBox.height).toBeCloseTo(1.5, 2);
      // The corner: the card's soft radius less the frame — the padding
      // edge's own curve (CSS Backgrounds 3) — and the photograph cut to it.
      const outer = parseFloat(m.cardStyle.borderTopLeftRadius);
      expect(outer).toBeCloseTo(16 * (scalePx ?? 1), 2);
      expect(parseFloat(m.cellStyle.borderTopLeftRadius)).toBeCloseTo(
        outer - m.frame,
        2,
      );
      expect(parseFloat(m.cellStyle.borderTopRightRadius)).toBeCloseTo(
        outer - m.frame,
        2,
      );
      expect(m.cellStyle.borderBottomLeftRadius).toBe('0px');
      expect(m.cellStyle.overflow).toBe('clip');
    },
  );

  it.each([
    { scalePx: undefined, design: 'the theme’s own step' },
    { scalePx: 896 / 1106, design: 'the band scale’s own step (0.81px)' },
    { scalePx: 1.5, design: 'a 1.5px design pixel' },
  ])(
    'sets the title as far under the picture as the frame’s padding, the chips three of THEIR OWN steps into its top-right corner, first tag rightmost — $design',
    ({ scalePx }) => {
      const m = renderMeasured({ scalePx });

      // THE LAYOUT: the card's gap plus the words' top padding = the frame's
      // padding, so the words sit in one even inset.
      expect(m.titleBox.top - m.cellBox.bottom).toBeCloseTo(m.padding, 1);
      // THE TAGS: three of the chips' own steps — 12 of their pixel — in from
      // the picture's corner, whatever pixel the card is drawn in.
      const { list, inset } = chipsOf(m.cell);
      const pixel = expectedChipPixel(list, m.contentWidth);
      expect(inset.top).toBeCloseTo(CHIP.inset * pixel, 1);
      expect(inset.right).toBeCloseTo(CHIP.inset * pixel, 1);
      const listBox = list.getBoundingClientRect();
      const [first, second] = within(list)
        .getAllByRole('listitem')
        .map((item) => item.getBoundingClientRect());
      if (!first || !second) throw new Error('two chips expected');
      // The FIRST tag at the far right, the next to its left, one line.
      expect(first.right).toBeCloseTo(listBox.right, 1);
      expect(second.right).toBeLessThan(first.left);
      expect(second.top).toBeCloseTo(first.top, 1);
      // Over the picture: the chips' line inside the photograph.
      expect(first.bottom).toBeLessThan(m.cellBox.bottom);
    },
  );

  it.each([
    { scalePx: undefined, design: 'the theme’s own step' },
    { scalePx: 1.5, design: 'a 1.5px design pixel' },
  ])(
    'ends the read-more’s LABEL on the content edge and the footer row on the content’s floor — $design',
    ({ scalePx }) => {
      const m = renderMeasured({ scalePx });
      const style = getComputedStyle(m.readMore);
      const box = m.readMore.getBoundingClientRect();

      expect(box.right - parseFloat(style.paddingRight)).toBeCloseTo(
        m.content.right,
        1,
      );
      expect(m.footer.getBoundingClientRect().bottom).toBeCloseTo(
        m.content.bottom,
        1,
      );
      // The read-more's ink at rest is the accent role, the hover's lavender.
      expect(style.color).toBe(tokenRgb('accent'));
    },
  );
});

/** The width the picture's `sizes` asks for at THIS window: its first entry
 *  whose condition the browser matches (matchMedia — the engine's own
 *  reading), its length in CSS pixels — `rem` on the root, `vw` on the
 *  window, the same viewport `sizes` reads. */
const askedBySizes = (): number => {
  for (const entry of SIZES.split(', ')) {
    const at = entry.lastIndexOf(' ');
    const condition = at === -1 ? '' : entry.slice(0, at);
    const length = entry.slice(at + 1);
    if (condition && !matchMedia(condition).matches) continue;
    if (length.endsWith('rem')) return parseFloat(length) * rootPx();
    if (length.endsWith('vw'))
      return (parseFloat(length) / 100) * window.innerWidth;
    throw new Error(`sizes: an entry this reader cannot size — ${entry}`);
  }
  throw new Error('sizes: no entry matched — it lost its default');
};

describe('PostCard — the frames ARE the page’s grid, and the picture’s `sizes` switches with it', () => {
  holdStill();
  parkBeforeEach();

  it('spells both frames’ grids — this suite’s and the stories’ — exactly as sections/PostList spells GRID', () => {
    expect(FRAME_GRID).toBe(pageGrid);
    const stories = stripComments(storiesSource);
    expect(/\bconst FRAME_GRID =\s*'([^']*)'/.exec(stories)?.[1]).toBe(
      pageGrid,
    );
    // …and the stories' frame lays its list on it.
    expect(stories).toMatch(/<ul\s+role="list"\s+className=\{FRAME_GRID\}/);
  });

  it('switches `sizes` a quarter-rem past each window where the grid gains a column, and where the band reaches its cap — never asking for less than the picture on either side (measured behind the classic 15px scrollbar)', async (ctx) => {
    const before = { width: window.innerWidth, height: window.innerHeight };
    try {
      // THE PREMISE, named: the switches are placed for the classic 15px
      // gutter a mouse brings (PostCard's THE PICTURE) — without one each
      // step comes 15px of column earlier, so the switch is merely late.
      await page.viewport(1024, 900);
      const gutter =
        window.innerWidth - document.body.getBoundingClientRect().width;
      ctx.skip(
        gutter !== 15,
        `this runner draws a ${gutter}px scrollbar gutter, not the classic 15px the switches are placed for`,
      );
      // GRID's column counts, in its order — the base, then one per
      // container step — and the band's cap, read off ui/Container.
      const base = /(?:^|\s)grid-cols-(\d+)(?:\s|$)/.exec(pageGrid)?.[1];
      const steps = [...pageGrid.matchAll(/@[\w-]+:grid-cols-(\d+)/g)].map(
        (match) => Number(match[1]),
      );
      const counts = [Number(base), ...steps];
      const capRem = /max-w-\[([\d.]+)rem\]/.exec(bandColumnClasses)?.[1];
      if (!base || steps.length === 0 || !capRem) {
        throw new Error(`the grid or the cap moved: ${pageGrid}`);
      }
      // The switches, read off `sizes` itself: one per step, then the cap's.
      const switches = [...SIZES.matchAll(/\(min-width: ([\d.]+)rem\)/g)]
        .map((match) => Number(match[1]) * rootPx())
        .toSorted((a, b) => a - b);
      expect(switches).toHaveLength(steps.length + 1);

      /** The frame at `width`: its columns, the band, the picture, and what
       *  `sizes` asks for there — layout widths, which no jump can scale. */
      const readAt = async (width: number) => {
        await page.viewport(width, 900);
        renderInPage();
        const { card, cell } = partsOf(
          screen.getByRole('article', { name: POST.title }),
        );
        const grid = part(card.closest('ul'), 'grid', HTMLElement);
        const band = part(grid.parentElement, 'band', HTMLElement);
        const reading = {
          columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          band: parseFloat(getComputedStyle(band).width),
          picture: parseFloat(getComputedStyle(cell).width),
          asked: askedBySizes(),
        };
        cleanup();
        return reading;
      };

      for (const [index, at] of switches.entries()) {
        // A quarter-rem before the switch, and at it.
        const under = await readAt(at - themeStep());
        const over = await readAt(at);
        if (index < steps.length) {
          expect(under.columns, `${at}px`).toBe(counts[index]);
          expect(over.columns, `${at}px`).toBe(counts[index + 1]);
        } else {
          expect(under.band, `${at}px`).toBeLessThan(Number(capRem) * rootPx());
          expect(over.band, `${at}px`).toBeCloseTo(
            Number(capRem) * rootPx(),
            3,
          );
        }
        expect(under.picture, `${at}px`).toBeLessThanOrEqual(under.asked);
        expect(over.picture, `${at}px`).toBeLessThanOrEqual(over.asked);
      }
    } finally {
      await page.viewport(before.width, before.height);
    }
  });
});

describe('PostCard — the chips follow their card, measured (real stylesheet)', () => {
  holdStill();
  parkBeforeEach();

  it('at the owner’s window — 723 × 1123 behind the classic 15px scrollbar — the card’s content box IS the reference, and the chips are EXACTLY the atom’s own: 44px tall, an 18px label, 20px of padding, 12px in and 12px apart', async (ctx) => {
    const before = { width: window.innerWidth, height: window.innerHeight };
    await page.viewport(723, 1123);
    try {
      // THE PREMISE, named: the classic 15px gutter a mouse brings on a Mac
      // (globals.css's `scrollbar-gutter: stable` keeps it reserved), read
      // off the BODY's width — the root's clientWidth can report 0 under a
      // stable gutter. With overlay scrollbars the same window holds TWO
      // columns, and the owner's reference is not drawn there at all.
      const gutter =
        window.innerWidth - document.body.getBoundingClientRect().width;
      ctx.skip(
        gutter !== 15,
        `this runner draws a ${gutter}px scrollbar gutter, not the classic 15px of the owner's window`,
      );
      renderInPage();
      const { card, cell } = partsOf(
        screen.getByRole('article', { name: POST.title }),
      );
      const m = chipsOf(cell);

      // ONE column, and the card's content box IS the width the list divides
      // by — to the engine's 1/64px layout unit…
      expect(contentWidthOf(card)).toBe(
        chipPixelOf(tokensOf(m.list)).reference,
      );
      // …so the pixel is exactly 1px, and every length the atom's own.
      expect(m.pixel).toBe(1);
      expect(m.inset.top).toBeCloseTo(CHIP.inset, 3);
      expect(m.inset.right).toBeCloseTo(CHIP.inset, 3);
      expect(m.gap).toBe(CHIP.gap);
      expect(m.chips).toHaveLength(POST.tags.length);
      for (const chip of m.chips) {
        expect(chip).toEqual({
          height: CHIP.height,
          padding: CHIP.padding,
          label: CHIP.label,
        });
      }
    } finally {
      await page.viewport(before.width, before.height);
    }
  });

  it.each([
    {
      width: REFERENCE_CONTENT + 50,
      scalePx: undefined,
      shape: 'atom',
      design: 'a card of the reference’s width — the atom’s own',
    },
    {
      width: 800,
      scalePx: undefined,
      shape: 'grown',
      design: 'a wider card — larger chips',
    },
    {
      width: 420,
      scalePx: undefined,
      shape: 'between',
      design: 'a narrower card — smaller chips, over the floor',
    },
    {
      width: 360,
      scalePx: undefined,
      shape: 'floor',
      design: 'a phone’s card — on the floor',
    },
    {
      width: 700,
      scalePx: 1.5,
      shape: 'card',
      design:
        'a card in a design drawn at 1.5px — the CARD’s pixel, never the band’s',
    },
  ] as const)(
    'draws every chip at the atom × max(floor, content ÷ reference) — $design',
    ({ width, scalePx, shape }) => {
      const m = renderMeasured({ width, scalePx });
      const c = chipsOf(m.cell);
      const pixel = expectedChipPixel(c.list, m.contentWidth);
      const floor = (0.75 * rootPx()) / 18;

      expect(c.pixel).toBeCloseTo(pixel, 4);
      expect(c.inset.top).toBeCloseTo(CHIP.inset * pixel, 1);
      expect(c.inset.right).toBeCloseTo(CHIP.inset * pixel, 1);
      expect(c.gap).toBeCloseTo(CHIP.gap * pixel, 2);
      for (const chip of c.chips) {
        expect(chip.height).toBeCloseTo(CHIP.height * pixel, 1);
        expect(chip.padding).toBeCloseTo(CHIP.padding * pixel, 2);
        expect(chip.label).toBeCloseTo(CHIP.label * pixel, 2);
      }
      // …and what each case is FOR.
      if (shape === 'atom') expect(c.pixel).toBe(1);
      if (shape === 'grown') expect(c.pixel).toBeGreaterThan(1);
      if (shape === 'between') {
        expect(c.pixel).toBeGreaterThan(floor);
        expect(c.pixel).toBeLessThan(1);
      }
      if (shape === 'floor') {
        expect(m.contentWidth / REFERENCE_CONTENT).toBeLessThan(floor);
        expect(c.pixel).toBeCloseTo(floor, 4);
        for (const chip of c.chips) expect(chip.label).toBeCloseTo(12, 2);
      }
      if (shape === 'card') {
        expect(c.pixel).toBeCloseTo(m.contentWidth / REFERENCE_CONTENT, 4);
        expect(c.pixel).not.toBeCloseTo(scalePx ?? 0, 1);
      }
    },
  );

  it('compiles THE GUARD into the sheet — each of the two rules inside `@supports (width: 1cqw)`, and nowhere outside it', () => {
    renderCard();

    // Every style rule of the document's sheets, each with the at-rules
    // around it (the stories' Jump walker, with @supports kept).
    const rules: { trail: string[]; selector: string }[] = [];
    const walk = (list: CSSRuleList, trail: string[]): void => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) {
          rules.push({ trail, selector: rule.selectorText });
          walk(rule.cssRules, [...trail, rule.selectorText]);
        } else if (rule instanceof CSSSupportsRule) {
          walk(rule.cssRules, [...trail, `@supports ${rule.conditionText}`]);
        } else if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, [...trail, `@media ${rule.conditionText}`]);
        } else if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules, trail);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules, []);
      } catch {
        // A sheet the page may not read is not this card's.
      }
    }
    const guarded = tokensOf(
      screen.getByRole('list', { name: TAGS_LABEL }),
    ).filter((token) => token.startsWith(GUARD));
    expect(guarded).toHaveLength(2);
    for (const token of guarded) {
      const found = rules.filter(
        ({ selector }) => selector === `.${CSS.escape(token)}`,
      );
      expect(found, token).toHaveLength(1);
      expect(
        found[0]?.trail.map((at) => at.replace(/\s+/g, '')),
        token,
      ).toContain('@supports(width:1cqw)');
    }
  });

  it('never draws a label under 0.75rem — the floor rides the root’s font size (a 20px root: a 15px label)', () => {
    const root = document.documentElement;
    const before = root.style.fontSize;
    root.style.fontSize = '20px';
    try {
      // A 360px box leaves the card's content far under two-thirds of the
      // reference, so the floor binds: 0.75rem over 18, at a 20px root.
      const m = renderMeasured();
      const c = chipsOf(m.cell);
      expect(m.contentWidth / REFERENCE_CONTENT).toBeLessThan(2 / 3);
      expect(c.pixel).toBeCloseTo((0.75 * 20) / 18, 4);
      for (const chip of c.chips) expect(chip.label).toBeCloseTo(15, 2);
    } finally {
      root.style.fontSize = before;
    }
  });
});

describe('PostCard — a hover anywhere on the card draws the read-more’s underline (real stylesheet, a real pointer)', () => {
  holdStill();
  parkBeforeEach();

  it('draws it with the pointer on the title or on the picture — never on the read-more — folds it with the pointer off the card, and the card jumps meanwhile', async () => {
    // THE PREMISE: a device that hovers — the named group's hover and the
    // jump both answer `(hover: hover)` alone.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const m = renderMeasured();
    const accent = tokenRgb('accent');

    // At rest, the pointer parked off the card: folded, the card still.
    expect(m.article.matches(':hover')).toBe(false);
    expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);
    expect(scaleXOf(getComputedStyle(m.article))).toBe(1);

    for (const target of [screen.getByRole('heading', { level: 2 }), m.cell]) {
      await realUser.hover(target);
      // The CARD is hovered, the read-more is not…
      expect(m.article.matches(':hover')).toBe(true);
      expect(m.readMore.matches(':hover')).toBe(false);
      // …and the underline is drawn, in the one lavender, while the card
      // jumps on its own clock — THE JUMP STAYS.
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(1);
      expect(getComputedStyle(m.readMore).color).toBe(accent);
      expect(getComputedStyle(m.readMore, '::after').backgroundColor).toBe(
        accent,
      );
      expect(scaleXOf(getComputedStyle(m.article))).toBeCloseTo(1.05, 5);
    }

    // Off the card again: folded, still.
    const unpark = await parkPointer();
    try {
      expect(m.article.matches(':hover')).toBe(false);
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);
      expect(scaleXOf(getComputedStyle(m.article))).toBe(1);
    } finally {
      unpark();
    }
  });
});

describe('PostCard — the tags are LABELS: the tag face at rest, and still under a real hover of a chip or of the card (real stylesheet, a real pointer)', () => {
  holdStill();
  parkBeforeEach();

  /** The rendered card's chips, by role. */
  const tagItems = (): HTMLElement[] =>
    within(screen.getByRole('list', { name: TAGS_LABEL })).getAllByRole(
      'listitem',
    );

  it('paints every chip in the tag face at rest — the edges and the label the `--accent` token on the white `--surface`, 5.06:1 — and gives it no pointer cursor', () => {
    renderMeasured();
    const accent = tokenRgb('accent');
    const surface = tokenRgb('surface');

    const chips = tagItems();
    expect(chips).toHaveLength(POST.tags.length);
    for (const chip of chips) {
      // THE PREMISE: the pointer is parked, so nothing is hovered.
      expect(chip.matches(':hover')).toBe(false);
      const face = faceOf(chip);
      expect(face).toEqual({
        edges: [accent, accent, accent, accent],
        label: accent,
        ground: surface,
      });
      // The label on its own white face, read off the engine's colours
      // (PostCard's THE TAGS): past the 4.5:1 any size of it owes.
      const ratio = contrastOf(face.label, face.ground);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeCloseTo(5.06, 2);
      // Nothing that says "press me".
      expect(getComputedStyle(chip).cursor).not.toBe('pointer');
    }
  });

  it('keeps every chip’s paint and size under a real hover of EACH CHIP, of the title and of the picture — while the card still jumps and still draws the read-more’s underline', async () => {
    // THE PREMISE: a device that hovers — the jump and the underline answer
    // `(hover: hover)` alone, so this is where a hover rule would show.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    // A card wide enough that a chip stays under the pointer when the card
    // grows to 105 % about its centre: the chips sit near its top-right
    // corner and move outward with the jump.
    const m = renderMeasured({ width: 600 });
    const list = screen.getByRole('list', { name: TAGS_LABEL });
    const chips = tagItems();
    const restFaces = chips.map(faceOf);
    const restSizes = chips.map(sizeOf);
    const restPixel = getComputedStyle(list).getPropertyValue(PIXEL);

    // At rest: the card still, the underline folded, every chip lavender.
    expect(m.article.matches(':hover')).toBe(false);
    expect(scaleXOf(getComputedStyle(m.article))).toBe(1);
    expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);
    for (const face of restFaces) expect(face.label).toBe(tokenRgb('accent'));

    for (const target of [
      ...chips,
      screen.getByRole('heading', { level: 2 }),
      m.cell,
    ]) {
      await realUser.hover(target);
      // The pointer is on the target, and so on the card…
      expect(target.matches(':hover')).toBe(true);
      expect(m.article.matches(':hover')).toBe(true);
      // …and no chip moved a colour or a length, the hovered one included.
      expect(chips.map(faceOf)).toEqual(restFaces);
      expect(chips.map(sizeOf)).toEqual(restSizes);
      expect(getComputedStyle(list).getPropertyValue(PIXEL)).toBe(restPixel);
      // Nothing else moved either: THE JUMP and THE WHOLE CARD DRAWS THE
      // UNDERLINE still answer the card's hover, a chip's included.
      expect(scaleXOf(getComputedStyle(m.article))).toBeCloseTo(1.05, 5);
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(1);
    }

    // Off the card again: every chip as it was, the card still, the
    // underline folded.
    const unpark = await parkPointer();
    try {
      expect(m.article.matches(':hover')).toBe(false);
      expect(chips.map(faceOf)).toEqual(restFaces);
      expect(chips.map(sizeOf)).toEqual(restSizes);
      expect(scaleXOf(getComputedStyle(m.article))).toBe(1);
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);
    } finally {
      unpark();
    }
  });
});
