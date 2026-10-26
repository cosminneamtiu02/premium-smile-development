import { createRef, type CSSProperties } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
// no class string can answer any of them.
// tests/setup/components.ts loads no CSS globally; the per-file
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
import {
  PostCard,
  type PostCardContent,
  type PostCardHeadingLevel,
  type PostCardProps,
} from './PostCard';
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
// points, and the ROOT's font size in one, the chips' floor — each putting it
// back as it found it. What the title does to the words the blog ships is
// PostCard.titles.test.tsx's, and what a MINIATURE draws, against its full
// card, PostCard.miniature.test.tsx's; THE MINIATURE's markup and its code
// are pinned here, with no stylesheet needed. THE CLAMP's markup and code
// are pinned here too, and what it draws is measured in the LAST block, the
// one that injects the REAL faces (it counts lines, which only they lay out)
// for itself alone and the one that PHOTOGRAPHS the card (vitest/browser's
// `page.screenshot`, decoded in the page): to the pixel without the page's
// variables, and the hook of a „j" kept by the clip's room. Its sweep across
// sizes, engines and device scales is PostCard.tsx's record, never a gate —
// at a fortieth of an em the clip's bottom edge stands within a pixel of
// both lines' ink, and CI's Linux draws its glyphs otherwise.
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
  href: '/ro/blog/cum-iti-alegi-periuta-de-dinti/',
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
/** THE LINK (PostCard's paragraph): its placement at the row's end, the label
 *  on the content edge; a flex box round the label; its own ring hidden; and
 *  its EMPTY layer over the card's border box at the card's corner — the
 *  press area, and under keyboard focus the house ring round the card. */
const LINK = [
  'flex',
  'ms-auto',
  '-me-2',
  'focus-visible:outline-hidden',
  'before:absolute',
  'before:-inset-[3px]',
  'before:rounded-(--radius-soft)',
  "before:content-['']",
  'before:outline-offset-2',
  'focus-visible:before:outline-2',
  'focus-visible:before:outline-focus',
];
const SIZES =
  '(min-width: 121.25rem) and (pointer: fine) 30rem, (min-width: 71.25rem) 25vw, (min-width: 46.25rem) 40vw, 90vw';
/** ui/Heading's `band` step on its default ink — a full card's title. */
const BAND_TITLE = [
  'font-display',
  'text-3xl',
  '@md:text-4xl',
  'text-ink-strong',
];
/** ui/Heading's `section` step on its default ink — `band`'s small row byte
 *  for byte, with no container step under it: a MINIATURE's title (PostCard's
 *  THE STEPS THE MINIATURE CANNOT REDRAW). */
const SECTION_TITLE = ['font-display', 'text-3xl', 'text-ink-strong'];
/** A picture hint a page of its own may name instead of the list's
 *  (PostCard's THE `sizes`, OVERRIDDEN) — the card passes any hint through
 *  verbatim. */
const PAGE_SIZES = '13rem';
/** THE MINIATURE (PostCard's header): the Home band's share — the owner's
 *  65 % — the variable that carries it inline, and the classes that read it,
 *  written out: the capture on the <article>, and THE MINIATURE'S WRAPPER
 *  round ui/Card — `h-full` and the remap, its pixel's declaration assembled
 *  from PARTS (the harness note's THE CHIPS' PIXEL IS READ IN PARTS). */
const SHARE = 0.65;
const SHARE_VARIABLE = '--miniature';
const CAPTURE = '[--miniature-px:calc(var(--spacing)/4*var(--miniature))]';
const MINIATURE_WRAPPER = ['h-full', `[${PIXEL}:var(--miniature-px)]`, REMAP];
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
/** THE CLAMP (PostCard's header): what a clampable card's title and summary
 *  both wear — three of a page's variables with today's value behind each,
 *  `-webkit-box-orient` plain, and THE CLAMP'S ROOM, padding and the margin
 *  that takes it back, each times the element's `--clamp-on` — then each
 *  one's lines and that switch. Written out (the harness note): a renamed
 *  variable or a moved room fails here. */
const CLAMP = [
  '[display:var(--clamp-box,block)]',
  '[-webkit-box-orient:vertical]',
  '[overflow:var(--clamp-clip,visible)]',
  '[padding:calc(var(--clamp-on)*0.25em)_calc(var(--clamp-on)*0.25em)_calc(var(--clamp-on)*0.025em)]',
  '[margin:calc(var(--clamp-on)*-0.25em)_calc(var(--clamp-on)*-0.25em)_calc(var(--clamp-on)*-0.025em)]',
];
const CLAMP_TITLE_LINES = [
  '[-webkit-line-clamp:var(--title-lines,none)]',
  '[--clamp-on:min(var(--title-lines,0),1)]',
];
const CLAMP_SUMMARY_LINES = [
  '[-webkit-line-clamp:var(--summary-lines,none)]',
  '[--clamp-on:min(var(--summary-lines,0),1)]',
];
/** THE CLAMP'S ROOM, in the element's ems: on top and on both sides, and
 *  below (PostCard's THE CLAMP'S ROOM). */
const ROOM = { side: 0.25, below: 0.025 };
/** The page's four variables as sections/BlogCarousel sets them in its flat
 *  row — here INLINE on an ancestor, never as classes: Tailwind reads tests
 *  too, and a class nothing else wears would ship as a rule. */
const CLAMP_ON = {
  '--clamp-box': '-webkit-box',
  '--clamp-clip': 'hidden',
  '--title-lines': '2',
  '--summary-lines': '2',
} as CSSProperties;
/** A post longer than THE CLAMP's two lines in the flat row's card — its
 *  title on three lines there, its summary on five and more — in Romanian
 *  with diacritics (§15.7): the suite's own words, to the CMSR rules every
 *  page keeps (no superlative, no promise, no result). */
const LONG_POST = {
  ...POST,
  title:
    'Coroane și punți dentare: care e diferența și când e nevoie de fiecare',
  summary:
    'O coroană acoperă un dinte slăbit, iar o punte înlocuiește unul care lipsește, sprijinindu-se pe dinții vecini. Îți explicăm pe rând cum arată fiecare, cât durează lucrarea și cum le îngrijești acasă, între două controale.',
} as const satisfies PostCardContent;
/** A post SHORTER than the clamp's lines — one line of each in the flat
 *  row's card — so a set clamp has nothing to hide in it. */
const SHORT_POST = {
  ...POST,
  title: 'Ce este tartrul',
  summary: 'Pe scurt, ce este.',
} as const satisfies PostCardContent;
/** The flat row's card on a tablet: the blog list's three-across card at the
 *  owner's 1401 window, (1106 − 64) / 3 design px, in the theme's pixel
 *  (sections/BlogCarousel's THE FIXED SHAPE, THE FLAT ROW). */
const ROW_CARD = (1106 - 64) / 3;

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
 *  footer row, whose second box is the card's LINK with the read-more's
 *  label inside it. None of them but the link carries a role — they are
 *  layout — so structure is the only honest way in, and every step is a
 *  named `part`. */
const partsOf = (root: Element | null) => {
  const article = part(root, 'article', HTMLElement);
  const card = part(article.firstElementChild, 'card (ui/Card)', HTMLElement);
  const cell = part(card.children[0], 'picture’s cell', HTMLElement);
  const words = part(card.children[1], 'words', HTMLElement);
  const footer = part(words.lastElementChild, 'footer row', HTMLElement);
  const link = part(footer.children[1], 'link', HTMLAnchorElement);
  return {
    card,
    cell,
    words,
    footer,
    picture: part(cell.querySelector('img'), 'picture', HTMLImageElement),
    author: part(words.children[1], 'author', HTMLElement),
    readingTime: part(footer.children[0], 'reading time', HTMLElement),
    link,
    readMore: part(link.firstElementChild, 'read-more’s label', HTMLElement),
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
  it('names the article with the title alone, through aria-labelledby — an <h2> by default', () => {
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

  it('dresses a MINIATURE’s title in `band`’s small row alone, `section`, then the same rule and belt', () => {
    renderCard({ miniature: SHARE });

    expect(tokensOf(screen.getByRole('heading', { level: 2 }))).toEqual([
      ...SECTION_TITLE,
      TITLE_RULE,
      TITLE_BELT,
    ]);
    // `band` less its one container row, and nothing else: the small row the
    // list's three-across card always draws.
    expect(BAND_TITLE.filter((token) => !token.startsWith('@'))).toEqual(
      SECTION_TITLE,
    );
  });

  it('asks ui/Heading for its step ONCE, in code, through TITLE_STEP — `band` or `section` — and no size by className', () => {
    // The one call site: the step, through `asChild`, on the title's own
    // element — never a second size asked of the atom.
    const asks = [...CODE.matchAll(/<Heading\b([^>]*)>/g)].map((m) => m[1]);
    expect(asks).toHaveLength(1);
    expect(asks[0]).toMatch(
      /\bsize=\{TITLE_STEP\[mini \? 'miniature' : 'full'\]\}/,
    );
    expect(asks[0]).toMatch(/\basChild\b/);
    // The lookup: two steps, a full card's and a miniature's, and no third.
    const table = /\bconst TITLE_STEP = \{([^}]*)\}/.exec(CODE)?.[1];
    expect(table?.replace(/\s+/g, '')).toBe("full:'band',miniature:'section'");
    // The title's className is two wrapping rules, spelled once, on its own
    // element (§6.8): THE TITLE NEVER SPLITS A WORD and its belt — then, on
    // a clampable card alone, THE CLAMP — and no size, since THE NARROW
    // STEPS, REMOVED: a miniature draws its step at its share, never a
    // smaller one.
    expect(CODE).toMatch(
      /<TitleElement\s+id=\{titleId\}\s+className=\{cx\('hyphens-none wrap-anywhere', titleClamp\)\}\s*>/,
    );
    expect(CODE).not.toMatch(/\btext-(?:xl|2xl)\//);
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

  it('keeps ONE tab stop, its link, against a `tabIndex` that slips past the types — reset after the spread (the phase-3 review, 2026-10-20)', () => {
    // The type refuses a written `tabIndex` (the directive below fails `tsc`
    // the day it compiles); a spread of a wider object could still carry
    // one, and a focusable <article> would be a second stop on every card.
    render(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        // @ts-expect-error — the card's one tab stop is its link; `tabIndex` is Omitted (THE NAME)
        tabIndex={0}
      />,
    );

    const article = screen.getByRole('article', { name: POST.title });
    expect(article).not.toHaveAttribute('tabindex');
  });

  it('refuses an address that is not root-absolute, naming it — and takes both shapes localeHref builds', () => {
    // On the server's renderer, the bytes a page ships: a refused card
    // throws there before any markup exists.
    const markupWith = (href: string): string =>
      renderToStaticMarkup(
        <PostCard
          {...POST}
          href={href}
          tagsLabel={TAGS_LABEL}
          readMore={READ_MORE_LABEL}
        />,
      );
    const ARTICLE = 'ro/blog/cum-iti-alegi-periuta-de-dinti/';
    // The characters a URL parser DELETES wherever they stand — the tab, the
    // line feed, the carriage return — and the backslash it reads as a
    // slash, each built from its code point (never typed raw).
    const TAB = String.fromCodePoint(0x9);
    const LF = String.fromCodePoint(0xa);
    const CR = String.fromCodePoint(0xd);
    const BACKSLASH = String.fromCodePoint(0x5c);
    // Each of these strings opens the page the card stands on, one under it
    // or another site's: the empty and the blank, the dot, the fragment and
    // the query alone, two invisible characters (never typed raw), a
    // relative path, a full address, the two that start like the right
    // shape — a URL parser reads '//' and '/' + a backslash as another host —
    // and five that hide one of those behind a tab, a line feed or a carriage
    // return, which the parser deletes (the round-3 review, 2026-10-21: '/',
    // a tab and '/evil.example/x' resolve to another site,
    // '//evil.example/x').
    for (const href of [
      '',
      '   ',
      '.',
      './',
      '#',
      '?',
      String.fromCodePoint(0x0),
      String.fromCodePoint(0x200b),
      ARTICLE,
      `https://example.com/${ARTICLE}`,
      `//${ARTICLE}`,
      `/${BACKSLASH}${ARTICLE}`,
      `/${TAB}/evil.example/x`,
      `/${LF}/x`,
      `/${CR}${BACKSLASH}x`,
      `/${TAB}${LF}${CR}${TAB}/x`,
      `/${TAB}${BACKSLASH}evil.example/x`,
    ]) {
      const name = JSON.stringify(href);
      expect(() => markupWith(href), name).toThrow(RangeError);
      expect(() => markupWith(href), name).toThrow(
        `\`href\` is no root-absolute address`,
      );
      expect(() => markupWith(href), name).toThrow(`got ${name}.`);
    }
    // A value that is no string, past the type: a RangeError that names it —
    // a number and null as written, anything else by its type, never by
    // running its code (an object whose own text is a root-absolute path is
    // refused all the same) — and never the TypeError of a string method it
    // lacks.
    for (const [smuggled, named] of [
      [42, '42'],
      [undefined, '<undefined>'],
      [null, 'null'],
      [{ toString: () => `/${ARTICLE}` }, '<object>'],
    ] as const) {
      const href = smuggled as unknown as string;
      expect(() => markupWith(href), named).toThrow(RangeError);
      expect(() => markupWith(href), named).toThrow(`got ${named}.`);
    }
    // …and both shapes localeHref builds — root-served, and under the
    // interim Pages host's base path (lib/base-path) — open as given, as do
    // the root, a language's home and an address with a fragment.
    for (const href of [
      '/',
      '/ro/',
      `/${ARTICLE}`,
      `/premium-smile-development/${ARTICLE}`,
      `/${ARTICLE}#primul-pas`,
    ]) {
      expect(markupWith(href)).toContain(`href="${href}"`);
    }
  });
});

describe('PostCard — the title’s level: the page’s outline decides it, the look never does (THE TITLE’S LEVEL)', () => {
  /** The title's class list at the default level — the look every level
   *  must wear. */
  const LOOK = [...BAND_TITLE, TITLE_RULE, TITLE_BELT];

  it('is an <h2> by default and at `headingLevel={2}` — the blog list’s, under its <h1>', () => {
    for (const headingLevel of [undefined, 2] as const) {
      renderCard({ headingLevel });
      const heading = screen.getByRole('heading', {
        level: 2,
        name: POST.title,
      });
      expect(heading.tagName).toBe('H2');
      expect(screen.getAllByRole('heading')).toHaveLength(1);
      expect(tokensOf(heading)).toEqual(LOOK);
      cleanup();
    }
  });

  it('is an <h3> at `headingLevel={3}` — the Home band’s, under its own <h2> — in the <h2>’s classes byte for byte, still naming the article and the link', () => {
    const { container } = renderCard({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: POST.title });
    expect(heading.tagName).toBe('H3');
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    // THE LOOK NEVER FOLLOWS THE LEVEL (§15.24).
    expect(tokensOf(heading)).toEqual(LOOK);
    // The <h3> is where the <h2> stood — first in the words — and names the
    // article and, after the read-more's label, the link.
    const article = screen.getByRole('article', { name: POST.title });
    const { words, link, readMore } = partsOf(container.firstElementChild);
    expect(words.firstElementChild).toBe(heading);
    expect(article).toHaveAttribute('aria-labelledby', heading.id);
    expect(link.getAttribute('aria-labelledby')).toBe(
      `${readMore.id} ${heading.id}`,
    );
    expect(
      screen.getByRole('link', { name: `${READ_MORE_LABEL} ${POST.title}` }),
    ).toBe(link);
    // The level never reaches the DOM, in any spelling.
    for (const element of [article, ...article.querySelectorAll('*')]) {
      expect(
        element.getAttributeNames().filter((name) => /level/i.test(name)),
      ).toEqual([]);
    }
  });

  it('keeps a MINIATURE’s look, `section`’s, at either level — the level is the outline’s, the step the miniature’s', () => {
    for (const headingLevel of [2, 3] as const) {
      renderCard({ headingLevel, miniature: SHARE });
      const heading = screen.getByRole('heading', {
        level: headingLevel,
        name: POST.title,
      });
      expect(tokensOf(heading)).toEqual([
        ...SECTION_TITLE,
        TITLE_RULE,
        TITLE_BELT,
      ]);
      cleanup();
    }
  });

  it('picks the element through ONE lookup, in code — `HEADING`: 2 → h2, 3 → h3', () => {
    const table = /\bconst HEADING:[^=]*=\s*\{([^}]*)\}/.exec(CODE)?.[1];
    expect(table?.replace(/\s+/g, '')).toBe("2:'h2',3:'h3',");
    expect(CODE).toMatch(/\bconst TitleElement = HEADING\[headingLevel\];/);
    expect(CODE).toMatch(/\bheadingLevel = 2,/);
  });

  it('refuses a level past the type — 4, null, the string „3" — with a RangeError that names it', () => {
    // The round-3 review, 2026-10-21 (the title kept short: a failure's
    // screenshot is filed under it, and a name past 255 bytes is not saved).
    // On the server's renderer, the bytes a page ships. Unguarded, 4 and
    // null find no tag and React throws its generic "Element type is
    // invalid", and the string '3' finds HEADING's key '3' — an object's keys
    // are strings — and renders an <h3> unasked.
    const markupAt = (headingLevel: unknown): string =>
      renderToStaticMarkup(
        <PostCard
          {...POST}
          tagsLabel={TAGS_LABEL}
          readMore={READ_MORE_LABEL}
          headingLevel={headingLevel as PostCardHeadingLevel}
        />,
      );
    for (const [smuggled, named] of [
      [4, '4'],
      [1, '1'],
      [2.5, '2.5'],
      [Number.NaN, 'NaN'],
      [null, 'null'],
      ['3', '"3"'],
      ['2', '"2"'],
      [{}, '<object>'],
    ] as const) {
      expect(() => markupAt(smuggled), named).toThrow(RangeError);
      expect(() => markupAt(smuggled), named).toThrow(
        '`headingLevel` is the title’s level in the page’s outline, 2 or 3',
      );
      expect(() => markupAt(smuggled), named).toThrow(`got ${named}.`);
    }
    // …while the two levels the type allows, and the default, render as
    // ever.
    expect(markupAt(undefined)).toContain('<h2 ');
    expect(markupAt(2)).toContain('<h2 ');
    expect(markupAt(3)).toContain('<h3 ');
  });
});

describe('PostCard — the picture’s `sizes`: the blog list’s by default, a page’s own when it names one (THE `sizes`, OVERRIDDEN)', () => {
  it('passes a page’s hint to the <img> verbatim', () => {
    const { picture } = partsOf(
      renderCard({ sizes: PAGE_SIZES }).container.firstElementChild,
    );

    expect(picture).toHaveAttribute('sizes', PAGE_SIZES);
  });

  it('keeps the blog list’s hint when none is named — an explicit `undefined` included', () => {
    for (const overrides of [{}, { sizes: undefined }]) {
      const { picture } = partsOf(
        renderCard(overrides).container.firstElementChild,
      );
      expect(picture).toHaveAttribute('sizes', SIZES);
      cleanup();
    }
  });

  it('hands a page’s hint to the preload link too, on a page’s first card', () => {
    const { picture } = partsOf(
      renderCard({ sizes: PAGE_SIZES, preload: true }).container
        .firstElementChild,
    );

    expect(picture).toHaveAttribute('sizes', PAGE_SIZES);
    expect(picture).toHaveAttribute('fetchpriority', 'high');
    // The link for the picture's own srcset and the page's hint (React keys
    // an image preload by both).
    const link = [
      ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
    ].find(
      (element) =>
        element.getAttribute('imagesrcset') ===
          picture.getAttribute('srcset') &&
        element.getAttribute('imagesizes') === PAGE_SIZES,
    );
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect(link).toHaveAttribute('fetchpriority', 'high');
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
  it('lays ONE row on the card’s floor — the reading time in ui/Text’s muted ink, then the link round the read-more’s label', () => {
    const { footer, readingTime, link, readMore } = partsOf(
      renderCard().container.firstElementChild,
    );

    expect(footer.tagName).toBe('DIV');
    expect(tokensOf(footer)).toEqual(FOOTER);
    expect(footer.children).toHaveLength(2);
    expect(readingTime.tagName).toBe('P');
    expect(readingTime.className).toBe(MUTED_TEXT);
    expect(readingTime.textContent).toBe(POST.readingTime);
    // The link holds the label and nothing else.
    expect(link.children).toHaveLength(1);
    expect(readMore.tagName).toBe('SPAN');
    expect(readMore.textContent).toBe(READ_MORE_LABEL);
    expect(link.textContent).toBe(READ_MORE_LABEL);
  });

  it('dresses the read-more’s LABEL as ui/TextButton’s ACCENT tone — the hover’s lavender at rest — and puts the placement on the link round it', () => {
    const { link, readMore } = partsOf(
      renderCard().container.firstElementChild,
    );

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
    // The label is positioned — the atom's own `relative`, its underline's
    // scope — which is why the LINK, not the label, carries the layer.
    expect(tokens).toContain('relative');
    // The placement is the link's, never the label's (THE LINK): exactly its
    // own contract, written out above.
    expect(tokensOf(link)).toEqual(LINK);
    expect(tokens).not.toContain('ms-auto');
    expect(tokens).not.toContain('-me-2');
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

  it('is the card’s ONE link — the page’s href, named „Citește mai mult… <title>”, the visible label first, one tab stop', () => {
    const { link, readMore } = partsOf(
      renderCard().container.firstElementChild,
    );

    expect(link).toHaveAttribute('href', POST.href);
    // Named by its label and the title, in that order (SC 2.5.3, SC 2.4.4),
    // through the two ids — the title's is the article's own name.
    const title = screen.getByRole('heading', { level: 2 });
    expect(link.getAttribute('aria-labelledby')).toBe(
      `${readMore.id} ${title.id}`,
    );
    expect(readMore.id).not.toBe('');
    expect(
      screen.getByRole('link', {
        name: `${READ_MORE_LABEL} ${POST.title}`,
      }),
    ).toBe(link);
    // A plain link: no target, no rel, nothing that opens a new window.
    expect(link.getAttributeNames().sort()).toEqual([
      'aria-labelledby',
      'class',
      'href',
    ]);
    // It takes focus — the card's one tab stop.
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('asks for the link in code with the page’s href and the two ids — and spells no href of its own', () => {
    const anchors = [...CODE.matchAll(/<a\b([^>]*)>/g)].map((m) => m[1]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toMatch(/\bhref=\{href\}/);
    expect(anchors[0]).toMatch(
      /\baria-labelledby=\{`\$\{readMoreId\} \$\{titleId\}`\}/,
    );
    expect(CODE).not.toMatch(/\bhref="/);
  });
});

describe('PostCard — the jump, and ONE thing to press: the link', () => {
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
    // No press state of its own — a press opens the article (THE LINK) — and
    // no growing shadow anywhere in the card (the jump census refuses the old
    // pop's other half).
    for (const element of [article, ...article.querySelectorAll('*')]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^active:/);
        expect(token).not.toMatch(/(^|:)(hover|active):(inset-)?shadow-/);
      }
    }
  });

  it('jumps by default and at `jump={true}`; at `jump={false}` the jump’s tokens and nothing else leave the markup', () => {
    // On the server's renderer, the bytes a page ships.
    const markupWith = (overrides: Partial<PostCardProps>): string =>
      renderToStaticMarkup(
        <PostCard
          {...POST}
          tagsLabel={TAGS_LABEL}
          readMore={READ_MORE_LABEL}
          {...overrides}
        />,
      );
    const jumping = markupWith({});
    expect(markupWith({ jump: true })).toBe(jumping);
    expect(markupWith({ jump: undefined })).toBe(jumping);
    // The jump stands ONCE in the jumping card's markup, its six tokens in a
    // row before the hover area — and the still card is that markup with
    // them taken out, whatever else the card is (a miniature, a level, a
    // caller's class).
    const tokens = `${JUMP.join(' ')} `;
    expect(jumping.split(tokens)).toHaveLength(2);
    expect(markupWith({ jump: false })).toBe(jumping.replace(tokens, ''));
    for (const overrides of [
      { miniature: SHARE },
      { headingLevel: 3 as const, className: 'h-full', preload: true },
    ]) {
      expect(markupWith({ ...overrides, jump: false })).toBe(
        markupWith(overrides).replace(tokens, ''),
      );
    }
    // In the DOM: the article's class is the hover area alone, so a hover
    // still draws the read-more's underline (the measured block below).
    renderCard({ jump: false });
    expect(tokensOf(screen.getByRole('article'))).toEqual([HOVER_AREA]);
  });

  it('asks for the jump in code ONCE — CARD_JUMP whole or nothing, on the <article>, its default `true`', () => {
    expect(CODE).toMatch(/\bjump = true,/);
    // Its declaration and its one wear, and no other mention in code.
    expect(CODE.match(/\bCARD_JUMP\b/g)).toHaveLength(2);
    expect(CODE).toMatch(/\bjump \? CARD_JUMP : undefined,/);
  });

  it('refuses a `jump` past the type — „false", null, 0, an object — with a RangeError that names it', () => {
    // On the server's renderer, the bytes a page ships. Unguarded, the string
    // „false" is truthy and would grow a card its page asked to hold still,
    // and null, which no default replaces, would hold a list card still.
    const markupAt = (jump: unknown): string =>
      renderToStaticMarkup(
        <PostCard
          {...POST}
          tagsLabel={TAGS_LABEL}
          readMore={READ_MORE_LABEL}
          jump={jump as boolean}
        />,
      );
    for (const [smuggled, named] of [
      ['false', '"false"'],
      ['true', '"true"'],
      [null, 'null'],
      [0, '0'],
      [1, '1'],
      [{}, '<object>'],
    ] as const) {
      expect(() => markupAt(smuggled), named).toThrow(RangeError);
      expect(() => markupAt(smuggled), named).toThrow(
        '`jump` is whether the card grows on a hover, true or false',
      );
      expect(() => markupAt(smuggled), named).toThrow(`got ${named}.`);
    }
    // …while the two booleans and the default render as ever.
    expect(markupAt(undefined)).toContain(JUMP.join(' '));
    expect(markupAt(true)).toContain(JUMP.join(' '));
    expect(markupAt(false)).not.toContain(JUMP[0]);
  });

  it('has ONE thing focusable and interactive inside — the link — and no button, no tabindex, no role but the list’s', () => {
    const { container } = renderCard();
    const { link } = partsOf(container.firstElementChild);

    expect(screen.getAllByRole('link')).toEqual([link]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect([
      ...container.querySelectorAll(
        'a[href], button, input, select, textarea, summary, details, iframe, [href], [tabindex], [contenteditable]',
      ),
    ]).toEqual([link]);
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

  it('keeps its own props off the article — no tooltip, no stray attribute, the level, the picture hint, the jump, the clamp and the miniature’s share included', () => {
    renderCard({
      headingLevel: 3,
      sizes: PAGE_SIZES,
      jump: false,
      clampable: true,
    });

    // `title` is the card's heading text, never HTML's tooltip; the content
    // props — `headingLevel`, `sizes`, `jump` and `clampable` among them —
    // are destructured, so nothing of theirs rides the spread.
    expect(screen.getByRole('article').getAttributeNames().sort()).toEqual([
      'aria-labelledby',
      'class',
    ]);
    cleanup();
    // A miniature adds ONE attribute, the style that carries its share —
    // never `miniature` itself, in any spelling.
    renderCard({ miniature: SHARE });
    expect(screen.getByRole('article').getAttributeNames().sort()).toEqual([
      'aria-labelledby',
      'class',
      'style',
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

describe('PostCard — THE MINIATURE as markup and code (what it draws is PostCard.miniature.test.tsx’s)', () => {
  /** The card as the server prints it — the bytes a page ships. */
  const markupOf = (overrides: Partial<PostCardProps> = {}): string =>
    renderToStaticMarkup(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        {...overrides}
      />,
    );

  it('refuses a share outside (0, 1] — 0, a negative, over 1, NaN and ±Infinity — with a RangeError that names it', () => {
    for (const share of [
      0,
      -0.65,
      1.0001,
      2,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(() => markupOf({ miniature: share }), String(share)).toThrow(
        RangeError,
      );
      expect(() => markupOf({ miniature: share }), String(share)).toThrow(
        `got ${String(share)}`,
      );
    }
  });

  it('quotes a STRING share that slipped past the type, so „0.65" never reads as the valid number it spells', () => {
    const smuggled = '0.65' as unknown as number;
    expect(() => markupOf({ miniature: smuggled })).toThrow(RangeError);
    expect(() => markupOf({ miniature: smuggled })).toThrow('got "0.65"');
  });

  it('names any other smuggled share by its TYPE, never by running its code', () => {
    // Each would mislead or throw if it were run: a BigInt, a boxed number
    // and an array print as a valid share („1", „0.65"), a null-prototype
    // object has no text at all (a TypeError), and a throwing toString
    // throws its own error.
    for (const [smuggled, type] of [
      [1n, '<bigint>'],
      [Object(0.65), '<object>'],
      [[0.65], '<object>'],
      [Object.create(null), '<object>'],
      [
        {
          toString: () => {
            throw new Error('the value’s own code ran');
          },
        },
        '<object>',
      ],
    ] as const) {
      const share = smuggled as unknown as number;
      expect(() => markupOf({ miniature: share }), type).toThrow(RangeError);
      expect(() => markupOf({ miniature: share }), type).toThrow(
        `got ${type}.`,
      );
    }
  });

  it('draws any share in (0, 1] — the Home band’s 0.65, 1 itself and the smallest number there is', () => {
    for (const share of [SHARE, 1, 0.01, Number.MIN_VALUE]) {
      expect(markupOf({ miniature: share }), String(share)).toContain(
        `${SHARE_VARIABLE}:${String(share)}`,
      );
    }
  });

  it('prints the list’s card byte for byte without a share — held from both sides', () => {
    // No part of the miniature in its markup (`miniature={undefined}` and a
    // caller's style included), and a miniature with its four parts taken
    // out — and its title's step put back — IS that markup.
    /** A regular expression matching `text` as written. */
    const literally = (text: string): string =>
      text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /** `markup` with `part` turned into `into` — found EXACTLY once, or a
     *  throw that names it, so a part gone missing never passes as handled. */
    const swap = (
      markup: string,
      part: string,
      into: string,
      name: string,
    ): string => {
      const found = markup.match(new RegExp(part, 'g')) ?? [];
      if (found.length !== 1) {
        throw new Error(
          `the miniature’s ${name} stands ${found.length} times in its markup`,
        );
      }
      return markup.replace(new RegExp(part), into);
    };
    /** `markup` with `part` taken out — `swap` into nothing. */
    const takeOut = (markup: string, part: string, name: string): string =>
      swap(markup, part, '', name);
    const share = `${literally(SHARE_VARIABLE)}:${literally(String(SHARE))}`;
    /** The title's class, as each kind of card wears it. */
    const titleClass = (step: readonly string[]): string =>
      `class="${[...step, TITLE_RULE, TITLE_BELT].join(' ')}"`;
    for (const overrides of [
      {},
      { style: { color: 'red' }, id: 'x', className: 'h-full' },
      { headingLevel: 3 as const, sizes: PAGE_SIZES, preload: true },
      { jump: false },
    ]) {
      const plain = markupOf(overrides);
      // One side: without a share — the prop left out, or written
      // `undefined` — none of the four parts.
      for (const markup of [
        plain,
        markupOf({ ...overrides, miniature: undefined }),
      ]) {
        expect(markup).not.toContain(SHARE_VARIABLE);
        expect(markup).not.toContain(CAPTURE);
        expect(markup).not.toContain(MINIATURE_WRAPPER.join(' '));
        expect(markup).not.toContain(`style="${PIXEL}:`);
      }
      // The other: the miniature's markup, built from other props, is that
      // card and exactly four parts — the share inline on the <article> (its
      // own attribute, or after a caller's declarations), the capture among
      // its classes, THE MINIATURE'S WRAPPER round ui/Card (its opening tag
      // and the closing one before the article's), and the chips' pixel
      // inline on the tag list.
      let mini = markupOf({ ...overrides, miniature: SHARE });
      mini = takeOut(mini, ` style="${share}"|;${share}(?=")`, 'share');
      mini = takeOut(mini, ` ${literally(CAPTURE)}`, 'capture');
      mini = takeOut(
        mini,
        literally(`<div class="${MINIATURE_WRAPPER.join(' ')}">`),
        'wrapper',
      );
      mini = mini.replace(/<\/div><\/article>$/, '</article>');
      mini = takeOut(
        mini,
        ` style="${literally(PIXEL)}:[^"]*"`,
        'chips’ pixel',
      );
      // …and its title's step, `section` where the list's card wears `band`
      // (THE STEPS THE MINIATURE CANNOT REDRAW), put back.
      expect(plain).toContain(titleClass(BAND_TITLE));
      mini = swap(
        mini,
        literally(titleClass(SECTION_TITLE)),
        titleClass(BAND_TITLE),
        'title’s step',
      );
      expect(mini).toBe(plain);
    }
  });

  it('puts the share inline over the caller’s style — which can never unset it — the capture on the <article>, the remap on ONE wrapper of its own round ui/Card, the chips’ pixel inline on the tag list, and nothing else', () => {
    const { container: plain } = renderCard({ className: 'h-full' });
    const plainCard = part(
      plain.querySelector('article')?.firstElementChild,
      'full card (ui/Card)',
      HTMLElement,
    );
    const plainTokens = [plainCard, ...plainCard.querySelectorAll('*')].map(
      tokensOf,
    );
    cleanup();
    const { container } = renderCard({
      className: 'h-full',
      miniature: SHARE,
      style: { color: 'red', [SHARE_VARIABLE]: '0.9' } as CSSProperties,
    });
    const article = screen.getByRole('article');
    // The share wins over the caller's own spelling of it; the caller's
    // other declarations stay.
    expect(article.style.getPropertyValue(SHARE_VARIABLE)).toBe(String(SHARE));
    expect(article.style.color).toBe('red');
    // The capture rides between the card's own classes and the caller's.
    expect(tokensOf(article)).toEqual([...JUMP, HOVER_AREA, CAPTURE, 'h-full']);
    // THE MINIATURE'S WRAPPER: the article's one child, a plain <div> with
    // the stretch and the remap and nothing else — no role, no id, no style —
    // and ui/Card its one child, its className the full card's own.
    expect(article.children).toHaveLength(1);
    const wrapper = part(article.firstElementChild, 'wrapper', HTMLDivElement);
    expect(wrapper.getAttributeNames()).toEqual(['class']);
    expect(tokensOf(wrapper)).toEqual(MINIATURE_WRAPPER);
    expect(wrapper.children).toHaveLength(1);
    const card = part(wrapper.firstElementChild, 'card (ui/Card)', HTMLElement);
    expect(tokensOf(card)).toEqual(tokensOf(plainCard));
    expect(tokensOf(card).slice(-2)).toEqual(['relative', 'h-full']);
    // The tag list keeps its class byte for byte (the cover's KEEP-IN-SYNC);
    // its pixel rides inline, CHIP_SCALE's formula with the floor in the
    // CAPTURED pixel (the next case reads the two out of the source) — the
    // capture's, never the share's own variable.
    const list = screen.getByRole('list', { name: TAGS_LABEL });
    expect(list.style.getPropertyValue(PIXEL)).toContain('var(--miniature-px)');
    expect(list.style.getPropertyValue(PIXEL)).not.toContain(
      `var(${SHARE_VARIABLE})`,
    );
    // The Card and everything in it: every class list the full card's — but
    // the title's, `section` for `band` (THE STEPS THE MINIATURE CANNOT
    // REDRAW).
    const inside = [card, ...card.querySelectorAll('*')];
    const titleAt = inside.indexOf(screen.getByRole('heading', { level: 2 }));
    expect(titleAt).toBeGreaterThan(0);
    expect(plainTokens[titleAt]).toEqual([
      ...BAND_TITLE,
      TITLE_RULE,
      TITLE_BELT,
    ]);
    expect(inside.map(tokensOf)).toEqual(
      plainTokens.map((tokens, index) =>
        index === titleAt ? [...SECTION_TITLE, TITLE_RULE, TITLE_BELT] : tokens,
      ),
    );
    expect(container.querySelectorAll('*')).toHaveLength(
      plainTokens.length + 2,
    );
  });

  it('spells the chips’ miniature pixel as CHIP_SCALE’s formula, its floor twelve of the CAPTURED pixel — both read out of the source', () => {
    // CHIP_SCALE's declaration, found by NAME behind THE GUARD (the harness
    // note: never written here whole).
    const chipScale = /\bconst CHIP_SCALE =([^;]*);/.exec(CODE)?.[1] ?? '';
    const classes = [...chipScale.matchAll(/'([^']*)'/g)]
      .map((match) => match[1])
      .join('')
      .split(/\s+/);
    const head = `${GUARD}[${PIXEL}:`;
    const formula = classes
      .find((token) => token.startsWith(head))
      ?.slice(head.length, -1);
    const floor = /^max\((calc\(([\d.]+)rem\/(\d+)\)),/.exec(formula ?? '');
    if (!formula || !floor?.[1] || !floor[2] || !floor[3]) {
      throw new Error(`PostCard.tsx: CHIP_SCALE moved — ${chipScale}`);
    }
    // The floor's rem in the theme's pixels — a sixteenth of a rem each, the
    // spacing step over four — and so, on a miniature, in the CAPTURED one:
    // `--miniature-px`, the share of the pixel the card inherits.
    const twelve = Number(floor[2]) * 16;
    expect(twelve).toBe(12);
    // MINIATURE_CHIPS' value, by the same NAME: CHIP_SCALE's formula, its
    // floor turned into twelve of the captured pixel over the same 18, its
    // `cqw` half as it stands.
    const miniature = new RegExp(
      `\\bconst MINIATURE_CHIPS = \\{\\s*'${PIXEL}':\\s*'([^']*)'`,
    ).exec(CODE)?.[1];
    expect(miniature).toBe(
      formula.replace(
        floor[1],
        `calc(var(--miniature-px)*${twelve}/${floor[3]})`,
      ),
    );
    // …and the share is ONE variable: set once (MINIATURE_SHARE) and read
    // once, by the capture — the chips read the CAPTURED pixel, never the
    // share itself, so a miniature's chips follow the pixel it inherits.
    expect(CODE).toMatch(
      new RegExp(`\\bconst MINIATURE_SHARE = '${SHARE_VARIABLE}';`),
    );
    expect(CAPTURE).toContain(`var(${SHARE_VARIABLE})`);
    expect(CODE.split(`'${CAPTURE}'`)).toHaveLength(2);
    expect(CODE.split(`var(${SHARE_VARIABLE})`)).toHaveLength(2);
    expect(CAPTURE.startsWith('[--miniature-px:')).toBe(true);
  });
});

describe('PostCard — THE CLAMP as markup and code (a page’s to switch on)', () => {
  /** The card as the server prints it — the bytes a page ships. */
  const markupOf = (overrides: Partial<PostCardProps> = {}): string =>
    renderToStaticMarkup(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        {...overrides}
      />,
    );
  /** Every token THE CLAMP may put on an element. */
  const CLAMP_TOKENS = [...CLAMP, ...CLAMP_TITLE_LINES, ...CLAMP_SUMMARY_LINES];

  it('prints the list’s card byte for byte unless asked — no clamp token, whatever else the card is', () => {
    for (const overrides of [
      {},
      { miniature: SHARE },
      { headingLevel: 3 as const, className: 'h-full', preload: true },
      { jump: false },
    ]) {
      const plain = markupOf(overrides);
      expect(markupOf({ ...overrides, clampable: undefined })).toBe(plain);
      expect(markupOf({ ...overrides, clampable: false })).toBe(plain);
      for (const token of CLAMP_TOKENS) {
        expect(plain, token).not.toContain(token);
      }
    }
  });

  it('puts THE CLAMP on the title after its rule and belt, on the summary after its ink — and nowhere else', () => {
    for (const [overrides, step] of [
      [{}, BAND_TITLE],
      [{ miniature: SHARE }, SECTION_TITLE],
    ] as const) {
      const { container } = renderCard({ ...overrides, clampable: true });
      const heading = screen.getByRole('heading', { level: 2 });
      const summary = screen.getByText(POST.summary);
      expect(tokensOf(heading)).toEqual([
        ...step,
        TITLE_RULE,
        TITLE_BELT,
        ...CLAMP,
        ...CLAMP_TITLE_LINES,
      ]);
      expect(tokensOf(summary)).toEqual([
        ...MUTED_TEXT.split(' '),
        ...CLAMP,
        ...CLAMP_SUMMARY_LINES,
      ]);
      // Nothing else in the card wears a token of it: the author, the
      // reading time, the words box and the card keep theirs.
      for (const element of container.querySelectorAll('*')) {
        if (element === heading || element === summary) continue;
        for (const token of tokensOf(element)) {
          expect(CLAMP_TOKENS, `<${element.tagName}>`).not.toContain(token);
        }
      }
      cleanup();
    }
  });

  it('is the list’s card and those tokens, nothing more', () => {
    for (const overrides of [
      {},
      { miniature: SHARE, headingLevel: 3 as const, jump: false },
    ]) {
      const plain = markupOf(overrides);
      const clamped = markupOf({ ...overrides, clampable: true });
      const title = ` ${[...CLAMP, ...CLAMP_TITLE_LINES].join(' ')}"`;
      const summary = ` ${[...CLAMP, ...CLAMP_SUMMARY_LINES].join(' ')}"`;
      // Each run of tokens stands ONCE, at the end of its element's class.
      expect(clamped.split(title)).toHaveLength(2);
      expect(clamped.split(summary)).toHaveLength(2);
      expect(clamped.replace(title, '"').replace(summary, '"')).toBe(plain);
    }
  });

  it('spells THE CLAMP once in code, defaults `clampable` to false, wears it through two classNames', () => {
    /** A constant's string literals, joined — the constant spelled as the
     *  jump census reads CARD_JUMP: literals alone, joined by `+`. */
    const literalsOf = (body: string): string =>
      [...body.matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');
    const box = /const CLAMP_BOX =([^;]*);/.exec(CODE)?.[1] ?? '';
    expect(literalsOf(box)).toBe(CLAMP.join(' '));
    expect(box.replace(/'[^']*'/g, '').trim()).toMatch(/^[+\s]*$/);
    const lines = /const CLAMP_LINES = \{([^}]*)\}/.exec(CODE)?.[1] ?? '';
    expect(/title:\s*'([^']*)'/.exec(lines)?.[1], 'the title’s lines').toBe(
      CLAMP_TITLE_LINES.join(' '),
    );
    expect(/summary:\s*'([^']*)'/.exec(lines)?.[1], 'the summary’s lines').toBe(
      CLAMP_SUMMARY_LINES.join(' '),
    );
    expect(CODE).toMatch(/\bclampable = false,/);
    expect(CODE).toMatch(
      /\bconst titleClamp = clampable \? cx\(CLAMP_BOX, CLAMP_LINES\.title\) : undefined;/,
    );
    expect(CODE).toMatch(
      /\bconst summaryClamp = clampable\s*\?\s*cx\(CLAMP_BOX, CLAMP_LINES\.summary\)\s*:\s*undefined;/,
    );
    expect(CODE).toMatch(
      /<Text tone="muted" className=\{summaryClamp\}>\s*\{summary\}\s*<\/Text>/,
    );
    // Each constant declared once and worn once — no second spelling.
    expect(CODE.match(/\bCLAMP_BOX\b/g)).toHaveLength(3);
    expect(CODE.match(/\bCLAMP_LINES\b/g)).toHaveLength(3);
  });

  it('refuses a `clampable` past the type with a RangeError that names it', () => {
    // Unguarded, the string „false" is truthy and would clamp a card its
    // page asked to keep whole wherever the page sets the variables.
    const markupAt = (clampable: unknown): string =>
      markupOf({ clampable: clampable as boolean });
    for (const [smuggled, named] of [
      ['false', '"false"'],
      ['true', '"true"'],
      [null, 'null'],
      [0, '0'],
      [1, '1'],
      [{}, '<object>'],
    ] as const) {
      expect(() => markupAt(smuggled), named).toThrow(RangeError);
      expect(() => markupAt(smuggled), named).toThrow(
        '`clampable` is whether the page may clamp the title and the summary, true or false',
      );
      expect(() => markupAt(smuggled), named).toThrow(`got ${named}.`);
    }
    // …while the two booleans and the default render as ever.
    expect(markupAt(undefined)).not.toContain(CLAMP[0]);
    expect(markupAt(false)).not.toContain(CLAMP[0]);
    expect(markupAt(true)).toContain(CLAMP.join(' '));
  });
});

describe('PostCard — zero islands of its own, zero message keys', () => {
  it('ships NO client directive and calls ONE hook, the server-safe useId — twice: the title’s id and the read-more’s (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(', 'useId(']);
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
    // THE NAME's refusals, kept by the type: an article it stays, the link is
    // its one tab stop, and no markup arrives but the named props'.
    expectTypeOf<PostCardProps>().not.toHaveProperty('role');
    expectTypeOf<PostCardProps>().not.toHaveProperty('tabIndex');
    expectTypeOf<PostCardProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    // THE DATE LEFT THE CARD (the header's THE AUTHOR): no prop for it.
    expectTypeOf<PostCardProps>().not.toHaveProperty('date');
    // THE TITLE'S LEVEL: two levels and no third, optional — the page's
    // outline names one, the default is the list's <h2>.
    expectTypeOf<PostCardHeadingLevel>().toEqualTypeOf<2 | 3>();
    expectTypeOf<PostCardProps['headingLevel']>().toEqualTypeOf<
      PostCardHeadingLevel | undefined
    >();
    // THE `sizes`, OVERRIDDEN: a page's own hint, optional.
    expectTypeOf<PostCardProps['sizes']>().toEqualTypeOf<string | undefined>();
    // THE MINIATURE: a share, optional — the range is the RangeError's.
    expectTypeOf<PostCardProps['miniature']>().toEqualTypeOf<
      number | undefined
    >();
    // THE CARD JUMP: a flag, optional — `true` when left out, the list's.
    expectTypeOf<PostCardProps['jump']>().toEqualTypeOf<boolean | undefined>();
    // THE CLAMP: a flag, optional — `false` when left out, the list's; how
    // many lines is the page's (its variables), never a number here.
    expectTypeOf<PostCardProps['clampable']>().toEqualTypeOf<
      boolean | undefined
    >();
    // `title` is the heading's text: REQUIRED, a string. What this pin cannot
    // tell is whether HTML's own `title` was Omitted — were it let back in,
    // the intersection would read `string & (string | undefined)`, which is
    // `string` again; the Omit is the props type's own word, and the render
    // case above keeps any tooltip off the <article> at run time.
    expectTypeOf<PostCardProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardProps['preload']>().toEqualTypeOf<
      boolean | undefined
    >();
    // Every string arrives finished, and every one is required — the
    // article's address among them (THE LINK).
    expectTypeOf<PostCardContent['href']>().toEqualTypeOf<string>();
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
 * Tailwind reads class names from source text. `card` hands the card props
 * of its own (a case's `jump`), and `variables` custom properties for the
 * box to pass down to it (a page's THE CLAMP), inline for the same reason.
 */
const renderMeasured = ({
  scalePx,
  width = 360,
  card = {},
  variables = {},
}: {
  scalePx?: number;
  width?: number;
  card?: Partial<PostCardProps>;
  variables?: CSSProperties;
} = {}) => {
  const style = {
    width: `${width}px`,
    ...(scalePx === undefined ? {} : { [PIXEL]: `${scalePx}px` }),
    ...variables,
  } as CSSProperties;
  render(
    <div className={scalePx === undefined ? undefined : REMAP} style={style}>
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE_LABEL}
        {...card}
      />
    </div>,
  );
  const article = screen.getByRole('article', {
    name: card.title ?? POST.title,
  });
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
      // FORCED: the card's link lays its layer over the whole card (THE
      // LINK), and Playwright refuses to hover a box another one covers — so
      // the pointer is put on the target's centre as it stands, where the
      // card's link takes it.
      await realUser.hover(target, { force: true });
      // The CARD is hovered — through its link's layer — the read-more's
      // label is not…
      expect(m.article.matches(':hover')).toBe(true);
      expect(m.link.matches(':hover')).toBe(true);
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

  it('with `jump={false}` holds the card still under a real hover, and still draws the read-more’s underline', async () => {
    // THE PREMISE: a device that hovers, where the jump would answer.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const m = renderMeasured({ card: { jump: false } });
    const accent = tokenRgb('accent');
    expect(m.article.matches(':hover')).toBe(false);
    expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);

    for (const target of [screen.getByRole('heading', { level: 2 }), m.cell]) {
      // FORCED, as above: the pointer on the target's centre, under the
      // card's link layer (THE LINK).
      await realUser.hover(target, { force: true });
      expect(m.article.matches(':hover')).toBe(true);
      // The underline is drawn, in the one lavender…
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(1);
      expect(getComputedStyle(m.readMore).color).toBe(accent);
      // …and the card holds still: no scale, and painted at its laid-out
      // width.
      expect(getComputedStyle(m.article).scale).toBe('none');
      expect(m.article.getBoundingClientRect().width).toBeCloseTo(
        parseFloat(getComputedStyle(m.article).width),
        3,
      );
    }

    const unpark = await parkPointer();
    try {
      expect(m.article.matches(':hover')).toBe(false);
      expect(scaleXOf(getComputedStyle(m.readMore, '::after'))).toBe(0);
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
      // FORCED, as above: the pointer on the target's centre, under the
      // card's link layer (THE LINK).
      await realUser.hover(target, { force: true });
      // The pointer is on the target's place — where the card's LINK lies
      // over it, so the link is hovered and the target is not — and so on
      // the card…
      expect(target.matches(':hover')).toBe(false);
      expect(m.link.matches(':hover')).toBe(true);
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

describe('PostCard — the whole card is its link, measured (real stylesheet)', () => {
  holdStill();
  parkBeforeEach();

  /** The centre of a box on screen. */
  const centreOf = (element: Element): readonly [number, number] => {
    const box = element.getBoundingClientRect();
    return [box.left + box.width / 2, box.top + box.height / 2];
  };

  /** What a press at a point lands on — the engine's own hit test, which
   *  answers a pseudo-element with the element it belongs to — and the link
   *  that holds it, if any. */
  const linkAt = (x: number, y: number): Element | null =>
    document.elementFromPoint(x, y)?.closest('a') ?? null;

  it('answers a press ANYWHERE on the card with its link — the picture, each chip, the title, the author, the summary, the reading time, the label and the frame — and nowhere past it', () => {
    const m = renderMeasured();
    const chips = within(
      screen.getByRole('list', { name: TAGS_LABEL }),
    ).getAllByRole('listitem');
    expect(chips).toHaveLength(POST.tags.length);

    for (const target of [
      m.cell,
      ...chips,
      screen.getByRole('heading', { level: 2 }),
      m.author,
      screen.getByText(POST.summary),
      m.readingTime,
      m.readMore,
    ]) {
      expect(
        linkAt(...centreOf(target)),
        `a press on „${target.textContent || target.tagName}"`,
      ).toBe(m.link);
    }

    // The FRAME too — the layer spans the card's border box (its inset the
    // framed border taken back): the middle of each of the card's four
    // edges, half a pixel inside them, on the 3px frame itself.
    const card = m.card.getBoundingClientRect();
    const middle = [card.left + card.width / 2, card.top + card.height / 2];
    const [midX = 0, midY = 0] = middle;
    for (const [x, y] of [
      [card.left + 0.5, midY],
      [card.right - 0.5, midY],
      [midX, card.top + 0.5],
      [midX, card.bottom - 0.5],
    ] as const) {
      expect(linkAt(x, y), `the frame at (${x}, ${y})`).toBe(m.link);
    }
    // …and not a pixel past it: the layer is the card's, never the page's.
    expect(linkAt(card.right + 2, midY)).toBeNull();
    expect(linkAt(midX, card.bottom + 2)).toBeNull();
  });

  it('draws the keyboard’s focus ring round the WHOLE card — the layer’s 2px of `--focus` at a 2px offset, at the card’s own corner — and hides the link’s own', async () => {
    const m = renderMeasured();
    const layer = (): CSSStyleDeclaration =>
      getComputedStyle(m.link, '::before');

    // At rest: no ring anywhere. The layer is there all the same — empty,
    // positioned, over the card's border box: its inset is the frame.
    expect(layer().outlineStyle).toBe('none');
    expect(layer().position).toBe('absolute');
    expect(layer().content).toBe('""');
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      expect(layer()[side]).toBe(`${-m.frame}px`);
    }
    // At the card's own corner: the layer's radius IS the card's.
    expect(layer().borderTopLeftRadius).toBe(m.cardStyle.borderTopLeftRadius);
    expect(layer().borderBottomRightRadius).toBe(
      m.cardStyle.borderBottomRightRadius,
    );

    // A REAL Tab — the keyboard's focus, the one `:focus-visible` answers —
    // lands on the link, the card's one tab stop.
    await realUser.tab();
    expect(document.activeElement).toBe(m.link);
    expect(m.link.matches(':focus-visible')).toBe(true);
    expect(layer().outlineStyle).toBe('solid');
    expect(layer().outlineWidth).toBe('2px');
    expect(layer().outlineOffset).toBe('2px');
    expect(layer().outlineColor).toBe(tokenRgb('focus'));
    // The link's own ring is hidden: the card's is the one drawn.
    expect(getComputedStyle(m.link).outlineStyle).toBe('none');

    // Focus gone, ring gone.
    m.link.blur();
    expect(layer().outlineStyle).toBe('none');
  });
});

/** The real faces' declarations, as PostCard.miniature.test.tsx injects them
 *  (KEEP-IN-SYNC: the font files .storybook/preview-fonts.css declares,
 *  served from the repo's root, `font-display: block` so no fallback is ever
 *  measured) — THE CLAMP counts LINES, which only the real face can lay out. */
const SERIF = 'Source Serif 4 SB';
const MONO = 'JetBrains Mono SB';
const REAL_FACES = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: '${MONO}';
  src: url('/src/fonts/JetBrainsMonoVariable-subset.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; --font-jetbrains-mono: '${MONO}'; }
`;

/** THE REAL FACES for the calling block: injected before it, taken out after
 *  it, so every other block measures as it always did. A 404 on a subset
 *  REJECTS the load — loudly. */
const withRealFaces = (): void => {
  let faces: HTMLStyleElement | undefined;
  beforeAll(async () => {
    faces = document.createElement('style');
    faces.textContent = REAL_FACES;
    document.head.append(faces);
    await document.fonts.load(`1rem "${SERIF}"`);
    await document.fonts.load(`1rem "${MONO}"`);
    await document.fonts.ready;
  });
  afterAll(() => {
    faces?.remove();
  });
};

/** Every face the card's text is laid out in, loaded for that text — the
 *  stories' `loadFace`, for a whole card. */
const loadFacesOf = async (root: Element): Promise<void> => {
  for (const element of root.querySelectorAll('h2, h3, p, li, span, a')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/** A box's LINES: its content box over its line height — layout values, the
 *  pointer parked (so nothing is painted at a jump's scale). Never its
 *  offsetHeight over the line: on a clamped box that height carries THE
 *  CLAMP'S ROOM as padding. */
const linesOf = (element: Element): number => {
  const style = getComputedStyle(element);
  const content =
    parseFloat(style.height) -
    parseFloat(style.paddingTop) -
    parseFloat(style.paddingBottom);
  return content / parseFloat(style.lineHeight);
};

/** Every picture in `root` loaded and decoded — a picture still swapping to
 *  its original (the harness note: the optimizer's variants 404 here) would
 *  photograph differently from one render to the next. Bounded: a picture
 *  that never arrives fails by name after five seconds. */
const picturesSettled = async (root: Element): Promise<void> => {
  const ready = (image: HTMLImageElement): boolean =>
    image.complete && image.naturalWidth > 0;
  const until = performance.now() + 5_000;
  for (const image of root.querySelectorAll('img')) {
    while (!ready(image)) {
      if (performance.now() > until) {
        throw new Error(`PostCard: the picture ${image.src} never loaded.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await image.decode().catch(() => undefined);
  }
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
};

/** An element as the runner photographs it: its PNG, decoded in the page
 *  (sections/CardCarousel's geometry suite's reader). The runner shoots at
 *  its own scale, so these cases compare one drawing with another, never a
 *  pixel with a CSS length. */
const pixelsOf = async (element: Element): Promise<ImageData> => {
  const base64 = await page.screenshot({ element, save: false });
  const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('PostCard: no 2D context.');
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
};

/** How many of two same-size images' pixels differ — any channel by any
 *  level. Throws by name when their sizes differ. */
const differingPixels = (a: ImageData, b: ImageData): number => {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `PostCard: two photographs of one box differ in size (${a.width}×${a.height}, ${b.width}×${b.height}).`,
    );
  }
  let count = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      a.data[i] !== b.data[i] ||
      a.data[i + 1] !== b.data[i + 1] ||
      a.data[i + 2] !== b.data[i + 2]
    ) {
      count += 1;
    }
  }
  return count;
};

describe('PostCard — THE CLAMP, measured (real stylesheet, real faces)', () => {
  holdStill();
  parkBeforeEach();
  withRealFaces();

  /** The flat row's card on a tablet, `clampable` unless told, the page's
   *  variables on the box round it when given — its title, summary and card
   *  read where the card puts them. */
  const renderRow = async ({
    card = {},
    variables = {},
  }: {
    card?: Partial<PostCardProps>;
    variables?: CSSProperties;
  } = {}) => {
    const m = renderMeasured({
      width: ROW_CARD,
      card: { clampable: true, ...card },
      variables,
    });
    await loadFacesOf(m.article);
    const title = screen.getByRole('heading', { level: 2 });
    const summary = part(m.words.children[3], 'summary', HTMLElement);
    return { ...m, title, summary };
  };

  /** What THE CLAMP may change on an element, as the engine computes it. */
  const clampStyleOf = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      display: style.display,
      overflow: style.overflow,
      clamp: style.getPropertyValue('-webkit-line-clamp'),
      padding: style.padding,
      margin: style.margin,
    };
  };

  /** Every box of the card, relative to the card's own — layout values. */
  const boxesOf = (card: Element) => {
    const origin = card.getBoundingClientRect();
    return [card, ...card.querySelectorAll('*')].map((element) => {
      const box = element.getBoundingClientRect();
      return [
        element.tagName,
        +(box.left - origin.left).toFixed(2),
        +(box.top - origin.top).toFixed(2),
        +box.width.toFixed(2),
        +box.height.toFixed(2),
      ];
    });
  };

  it('is inert without the page’s variables — every value but `-webkit-box-orient`, every box, every pixel', async () => {
    for (const { name, width, card } of [
      { name: 'the flat row’s card', width: ROW_CARD, card: {} },
      {
        name: 'the phone line’s miniature',
        width: ROW_CARD * SHARE,
        card: { miniature: SHARE, headingLevel: 3 as const, jump: false },
      },
    ]) {
      /** One card, as the engine computes and draws it. */
      const read = async (clampable: boolean) => {
        const { container } = render(
          <div style={{ width: `${width}px` }}>
            <PostCard
              {...LONG_POST}
              tagsLabel={TAGS_LABEL}
              readMore={READ_MORE_LABEL}
              {...card}
              clampable={clampable}
            />
          </div>,
        );
        const article = part(
          container.querySelector('article'),
          'article',
          HTMLElement,
        );
        await loadFacesOf(article);
        await picturesSettled(article);
        const title = screen.getByRole('heading', { name: LONG_POST.title });
        const summary = screen.getByText(LONG_POST.summary);
        const reading = {
          title: clampStyleOf(title),
          summary: clampStyleOf(summary),
          orient: [title, summary].map((element) =>
            getComputedStyle(element).getPropertyValue('-webkit-box-orient'),
          ),
          boxes: boxesOf(article),
          // THE WORDS, NOT THE PHOTOGRAPH: the clamp sits on the title and
          // the summary alone, so the words' block — the title's parent,
          // every line the clamp could move — is what is photographed. The
          // picture is left out because CI's condition cannot hold it still:
          // there the optimizer's variants 404 and ui/Image swaps each
          // picture to its original in the browser, and two shots of the
          // SAME card never agreed (285 pixels, every run, measured by the
          // planner with the variants hidden) — whatever the clamp did.
          image: await pixelsOf(
            part(title.parentElement, 'the words’ block', HTMLElement),
          ),
        };
        cleanup();
        return reading;
      };
      // THE RUNNER SETTLES FIRST: MEASURED, its first photographs of a card
      // differ from its later ones though the card is the same — up to 18
      // levels across the whole card on a cold start, and after this file's
      // other blocks a second shot still 2 levels off in the chips' corner —
      // while once two shots in a row agree, every later one, plain or
      // clampable, is the same to the pixel. So the plain card is shot until
      // two shots in a row agree (five at most), and the clampable card is
      // held to the plain shot on EITHER side of it.
      let previous = await read(false);
      let plain = await read(false);
      for (
        let shots = 2;
        differingPixels(previous.image, plain.image) > 0 && shots < 5;
        shots += 1
      ) {
        previous = plain;
        plain = await read(false);
      }
      expect(
        differingPixels(previous.image, plain.image),
        `${name}: two shots of the same card never agreed`,
      ).toBe(0);
      const clampable = await read(true);
      const after = await read(false);
      // Today's values — the fallbacks behind every variable.
      expect(clampable.title, name).toEqual(plain.title);
      expect(clampable.summary, name).toEqual(plain.summary);
      expect(plain.title).toEqual({
        display: 'block',
        overflow: 'visible',
        clamp: 'none',
        padding: '0px',
        margin: '0px',
      });
      // The one value that moved — read by a -webkit-box alone.
      expect(plain.orient).toEqual(['horizontal', 'horizontal']);
      expect(clampable.orient).toEqual(['vertical', 'vertical']);
      // Every box where it stood, and every pixel the card draws.
      expect(clampable.boxes, name).toEqual(plain.boxes);
      expect(differingPixels(clampable.image, plain.image), name).toBe(0);
      expect(differingPixels(clampable.image, after.image), name).toBe(0);
    }
  });

  it('holds the title and the summary to two lines each under the variables — every word in the DOM and the name', async () => {
    // THE PREMISE, measured: without the variables this post runs past two
    // lines of each in the flat row's card — or the clamp would prove
    // nothing.
    const free = await renderRow({ card: LONG_POST });
    const freeLines = {
      title: Math.round(linesOf(free.title)),
      summary: Math.round(linesOf(free.summary)),
    };
    expect(freeLines.title).toBeGreaterThan(2);
    expect(freeLines.summary).toBeGreaterThan(2);
    cleanup();

    const m = await renderRow({ card: LONG_POST, variables: CLAMP_ON });
    for (const [element, text] of [
      [m.title, LONG_POST.title],
      [m.summary, LONG_POST.summary],
    ] as const) {
      const style = getComputedStyle(element);
      // Two lines, laid out: the content box is two line heights.
      expect(linesOf(element), text).toBeCloseTo(2, 2);
      // Clipped and clamped — a box that is no longer the plain block (the
      // engines name it differently; PostCard's WHAT A SET CLAMP DOES).
      expect(style.overflow).toBe('hidden');
      expect(style.getPropertyValue('-webkit-line-clamp')).toBe('2');
      expect(['block', 'inline']).not.toContain(style.display);
      // The lines past the clamp are still laid out, under the box.
      expect(element.scrollHeight).toBeGreaterThan(element.clientHeight);
      // Every word in the DOM.
      expect(element.textContent).toBe(text);
    }
    // The article is named by the WHOLE title, as is its heading — and so
    // is the card's one link, after its label.
    expect(
      screen.getByRole('article', { name: LONG_POST.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: LONG_POST.title }),
    ).toBe(m.title);
    expect(m.link).toHaveAccessibleName(
      `${READ_MORE_LABEL} ${LONG_POST.title}`,
    );
  });

  it('grows the clip by THE CLAMP’S ROOM and takes it back — nothing else moves', async () => {
    const free = await renderRow({ card: SHORT_POST });
    const before = {
      boxes: boxesOf(free.card),
      title: free.title.getBoundingClientRect(),
      summary: free.summary.getBoundingClientRect(),
      lines: [linesOf(free.title), linesOf(free.summary)],
    };
    cleanup();

    const m = await renderRow({ card: SHORT_POST, variables: CLAMP_ON });
    for (const [element, box] of [
      [m.title, before.title],
      [m.summary, before.summary],
    ] as const) {
      const style = getComputedStyle(element);
      const em = parseFloat(style.fontSize);
      const side = ROOM.side * em;
      const below = ROOM.below * em;
      // The room, in the element's own ems…
      expect(parseFloat(style.paddingTop)).toBeCloseTo(side, 2);
      expect(parseFloat(style.paddingLeft)).toBeCloseTo(side, 2);
      expect(parseFloat(style.paddingRight)).toBeCloseTo(side, 2);
      expect(parseFloat(style.paddingBottom)).toBeCloseTo(below, 2);
      // …taken back by a margin of the same size.
      expect(parseFloat(style.marginTop)).toBeCloseTo(-side, 2);
      expect(parseFloat(style.marginLeft)).toBeCloseTo(-side, 2);
      expect(parseFloat(style.marginRight)).toBeCloseTo(-side, 2);
      expect(parseFloat(style.marginBottom)).toBeCloseTo(-below, 2);
      // The clip's box is the text's box grown by the room on every side…
      const grown = element.getBoundingClientRect();
      expect(grown.left).toBeCloseTo(box.left - side, 1);
      expect(grown.right).toBeCloseTo(box.right + side, 1);
      expect(grown.top).toBeCloseTo(box.top - side, 1);
      expect(grown.bottom).toBeCloseTo(box.bottom + below, 1);
    }
    // …and nothing else moved: every other box of the card, and its lines.
    const after = boxesOf(m.card);
    const grownAt = new Set(
      [m.title, m.summary].map((element) =>
        [m.card, ...m.card.querySelectorAll('*')].indexOf(element),
      ),
    );
    expect(after.filter((_, index) => !grownAt.has(index))).toEqual(
      before.boxes.filter((_, index) => !grownAt.has(index)),
    );
    // The lines, to the engine's own arithmetic: it computes the room from
    // the variable's calc() a hair under its ems (7.49999px for 7.5).
    const [titleLines = 0, summaryLines = 0] = before.lines;
    expect(linesOf(m.title)).toBeCloseTo(titleLines, 3);
    expect(linesOf(m.summary)).toBeCloseTo(summaryLines, 3);
  });

  it('keeps the hook of a title’s opening „j" — the room against the clip moved off and at the edge', async () => {
    const m = await renderRow({
      card: {
        ...SHORT_POST,
        title: 'jocuri și jucării: cum îl pregătești pe copil',
      },
      variables: CLAMP_ON,
    });
    const style = getComputedStyle(m.title);
    const em = parseFloat(style.fontSize);
    const box = m.title.getBoundingClientRect();
    const card = m.card.getBoundingClientRect();
    // A lens over the strip a quarter em wide before the title's CONTENT
    // box, as tall as its content — the card's own padding, the room's.
    const content = {
      left: box.left + parseFloat(style.paddingLeft),
      top: box.top + parseFloat(style.paddingTop),
      height:
        box.height -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom),
    };
    const lens = document.createElement('div');
    lens.style.cssText = `position: absolute; pointer-events: none; left: ${content.left - ROOM.side * em - card.left - m.frame}px; top: ${content.top - card.top - m.frame}px; width: ${ROOM.side * em}px; height: ${content.height}px`;
    m.card.append(lens);
    try {
      // The warm-up shot, discarded (the inert case's: the runner's first
      // photograph is its own).
      await pixelsOf(lens);
      const shipped = await pixelsOf(lens);
      // THE CONTROL: the clip at the box's own edge — no room before the
      // text, the layout the same (the padding and its take-back both 0).
      m.title.style.paddingInline = '0';
      m.title.style.marginInline = '0';
      const edge = await pixelsOf(lens);
      // THE REFERENCE: the clip moved three times further off.
      m.title.style.paddingInline = '0.75em';
      m.title.style.marginInline = '-0.75em';
      const off = await pixelsOf(lens);
      /** The darkest channel the strip holds — the ink there, if any. */
      const darkest = (image: ImageData): number => {
        let least = 255;
        for (let i = 0; i < image.data.length; i += 4) {
          least = Math.min(
            least,
            image.data[i] ?? 255,
            image.data[i + 1] ?? 255,
            image.data[i + 2] ?? 255,
          );
        }
        return least;
      };
      // The hook IS there, before the content box (never vacuous)…
      expect(darkest(off)).toBeLessThan(160);
      // …the clip at the box's edge would cut it…
      expect(differingPixels(edge, off)).toBeGreaterThan(0);
      // …and the room keeps every pixel of it.
      expect(differingPixels(shipped, off)).toBe(0);
    } finally {
      lens.remove();
      m.title.style.removeProperty('padding-inline');
      m.title.style.removeProperty('margin-inline');
    }
  });

  it('sets THE CLAMP’S ROOM inside the face’s ink bounds — past the overhangs, under the inter-line gap', async () => {
    const m = await renderRow({ card: LONG_POST, variables: CLAMP_ON });
    const canvas = new OffscreenCanvas(8, 8);
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('PostCard: no 2D context.');
    for (const element of [m.title, m.summary]) {
      const style = getComputedStyle(element);
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      /** The largest of one ink bound over a set of letters. */
      const most = (
        letters: string,
        read: (metrics: TextMetrics) => number,
      ): number =>
        Math.max(
          ...[...letters].map((letter) => read(context.measureText(letter))),
        );
      // The five languages' tallest capitals, their deepest letters, and
      // the two that overhang their box: „j"'s hook, „f"'s arm.
      const ascent = most(
        'ÉÈÀÎĂÂÄÖÜÊÔÛÍÓÚÙÌ',
        (metrics) => metrics.actualBoundingBoxAscent,
      );
      const descent = most(
        'jyșțȘȚgpqçÇ',
        (metrics) => metrics.actualBoundingBoxDescent,
      );
      const before = most('jJ', (metrics) => metrics.actualBoundingBoxLeft);
      const after = most(
        'f',
        (metrics) => metrics.actualBoundingBoxRight - metrics.width,
      );
      const line = parseFloat(style.lineHeight);
      const gap = line - ascent - descent;
      const side = parseFloat(style.paddingLeft);
      const below = parseFloat(style.paddingBottom);
      const name = `<${element.tagName}> at ${style.fontSize}`;
      // The face does overhang (never vacuous)…
      expect(before, name).toBeGreaterThan(0);
      expect(after, name).toBeGreaterThan(0);
      // …and the room before and after the text holds it twice over.
      expect(side, name).toBeGreaterThan(2 * Math.max(before, after));
      // Between two lines the ink leaves a gap, and the room below is in it.
      expect(gap, name).toBeGreaterThan(0);
      expect(below, name).toBeGreaterThan(0);
      expect(below, name).toBeLessThan(gap);
    }
  });
});
