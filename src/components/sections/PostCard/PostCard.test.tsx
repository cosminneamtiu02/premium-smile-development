import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ImagePath } from '@/lib/image-path/image-path';
import type { IsoDate } from '@/lib/time-ago/time-ago';
import {
  PostCard,
  type PostCardContent,
  type PostCardHeadingLevel,
  type PostCardProps,
} from './PostCard';
import source from './PostCard.tsx?raw';

// sections/PostCard — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the card is reachable as an `article` NAMED BY ITS
// OWN TITLE because a real heading and a real aria-labelledby pair say so.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the ReviewCard precedent): next-intl's hooks
// throw without one, so a green render proves this section calls no t().
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the section or to an atom fails HERE instead of following the code
// it is meant to check. What the real stylesheet does with them — the row,
// the stack, the jump's clock — is PostCard.stories.tsx's business. No
// pointer is moved and nothing is measured here, so the jump (a :hover rule
// the unstyled page does not even have) cannot reach an assertion.
//
// ── THE PICTURE IN THIS RUNNER: the optimizer's width variants do not exist
// here (`npm run build` makes them), so every <img> 404s and
// next-image-export-optimizer swaps to the original file on the error event,
// at a macrotask boundary. Every picture assertion is therefore SYNCHRONOUS —
// render, read, assert — never awaited (ReviewCard.test.tsx's rule).

/** A post as the blog index hands it over, in Romanian with diacritics
 *  (§15.7): every word finished, the day in both halves. */
const POST = {
  title: 'Cum îți alegi periuța de dinți',
  summary:
    'Firele moi, un cap mic și un mâner comod: ce să urmărești pe ambalaj.',
  date: { iso: '2026-09-29', label: '29 septembrie 2026' },
  author: 'Dr. Nicu Elena Alina',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Sala de așteptare a clinicii, cu fotolii galbene',
  },
  tags: ['igienă', 'sfaturi'],
} as const satisfies PostCardContent;

/** The tag list's name, as the page would hand it over (§8.1). */
const TAGS_LABEL = 'Categorii';

const NO_BREAK_SPACE = String.fromCodePoint(0x00a0);

/** Every dash a separator could be spelled with — the hyphen-minus, the
 *  Unicode hyphens and dashes, the minus sign (the owner's D-DASH rule). */
const DASHES = [
  0x2d, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212,
].map((point) => String.fromCodePoint(point));

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
/** One column, then the 1 : 3 row at the card's @lg (THE LAYOUT). */
const GRID = [
  'grid',
  'grid-cols-1',
  'gap-x-8',
  'gap-y-6',
  '@lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]',
  '@lg:items-start',
];
const PICTURE_CELL = ['relative', 'aspect-square'];
const WORDS = ['flex', 'flex-col', 'gap-3'];
const SIZES = '(min-width: 46rem) 20vw, 90vw';
/** ui/Heading's `band` step on its default ink. */
const BAND_TITLE = [
  'font-display',
  'text-3xl',
  '@md:text-4xl',
  'text-ink-strong',
];
/** THE TITLE'S BELT — the SC 1.4.12 wrap on the heading's own element. */
const TITLE_BELT = 'wrap-anywhere';
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
/** ui/Card's `framed` row, the tokens that tell it from the others (never the
 *  atom's whole class string — tests/unit/card-single-spelling.test.ts would
 *  count a contiguous copy of its geometry as a second spelling). */
const FRAMED = [
  'border-[3px]',
  'border-(--card-tint)',
  'bg-surface',
  'p-[calc(var(--spacing)*6_-_2px)]',
];
/** ui/Image's `framed` situation: covers its cell, crops, rounds. */
const FRAMED_PHOTO = ['h-full', 'w-full', 'rounded-xl', 'object-cover'];
/** ui/PillButton at REST — the price strip's resting chip. */
const CHIP_AT_REST = [
  'rounded-full',
  'border-2',
  'min-h-11',
  'whitespace-nowrap',
  'shadow-aura',
  'border-card-tint',
  'bg-surface',
  'text-ink',
];

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const renderCard = (overrides: Partial<PostCardProps> = {}) =>
  render(<PostCard {...POST} tagsLabel={TAGS_LABEL} {...overrides} />);

/** The card's boxes, reached from the <article>: ui/Card is its one child,
 *  the grid the card's, and the grid holds the picture's cell and the words.
 *  None of them carries a role — they are layout — so structure is the only
 *  honest way in. */
const partsOf = (article: HTMLElement) => {
  const card = article.firstElementChild as HTMLElement;
  const grid = card.firstElementChild as HTMLElement;
  const cell = grid.children[0] as HTMLElement;
  return {
    card,
    grid,
    cell,
    words: grid.children[1] as HTMLElement,
    picture: cell.querySelector('img') as HTMLImageElement,
  };
};

/** The date line — the ui/Eyebrow <p> that holds the <time>. */
const dateLine = (): HTMLElement =>
  screen.getByRole('time').parentElement as HTMLElement;

/**
 * The section's source with its PROSE removed — what the zero-island guards
 * run against (ReviewCard.test.tsx's mechanism): the header discusses
 * `'use client'`, the hook it has and the handlers it does not, by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

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

  it('renders an <h3> when the page groups its cards under a band’s <h2>', () => {
    renderCard({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: POST.title });
    expect(heading.tagName).toBe('H3');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.getByRole('article', { name: POST.title })).toHaveAttribute(
      'aria-labelledby',
      heading.id,
    );
  });

  it('gives two cards on one page two different ids (useId)', () => {
    // The index renders a list of these; a fixed id would collide and both
    // articles would be named by the first title.
    render(
      <>
        <PostCard {...POST} tagsLabel={TAGS_LABEL} />
        <PostCard {...POST} title="Ce este tartrul" tagsLabel={TAGS_LABEL} />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(
      screen.getByRole('article', { name: 'Ce este tartrul' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: POST.title }),
    ).toBeInTheDocument();
  });

  it('dresses the title in ui/Heading’s `band` step, on the default ink — then its belt, and nothing else', () => {
    renderCard();

    expect(tokensOf(screen.getByRole('heading', { level: 2 }))).toEqual([
      ...BAND_TITLE,
      TITLE_BELT,
    ]);
  });

  it.each([2, 3] as const)(
    'wears the SC 1.4.12 belt, `wrap-anywhere`, on the title’s own <h%i> (G2 a11y, 2026-10-14)',
    (level) => {
      // Text spacing widens a word, and where an engine has no Romanian
      // hyphenation dictionary a word wider than the card's line ran past
      // the card (PostCard's THE TITLE'S BELT, measured); `overflow-wrap:
      // anywhere` breaks only such a word. Merged LAST by the slot, after
      // the atom's step, on the heading element itself — at either level.
      renderCard({ headingLevel: level });

      const heading = screen.getByRole('heading', { level });
      expect(tokensOf(heading).at(-1)).toBe(TITLE_BELT);
      expect(
        tokensOf(heading).filter((token) => token === TITLE_BELT),
      ).toHaveLength(1);
      // The belt rides the heading alone: the words around it keep their own
      // wrapping, and the article's class list is the jump's.
      expect(tokensOf(partsOf(screen.getByRole('article')).words)).toEqual(
        WORDS,
      );
      expect(tokensOf(screen.getByRole('article'))).not.toContain(TITLE_BELT);
    },
  );

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
        aria-labelledby="elsewhere"
        aria-label="Alt nume"
      />,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    const article = screen.getByRole('article', { name: POST.title });
    expect(article).toHaveAttribute('aria-labelledby', heading.id);
    expect(article).not.toHaveAttribute('aria-label');
  });
});

describe('PostCard — the date line: the day, a quiet separator, the author', () => {
  it('prints the day as a <time>: the ISO day in dateTime, the page’s words as its text', () => {
    renderCard();

    const posted = screen.getByRole('time');
    expect(posted.tagName).toBe('TIME');
    expect(posted).toHaveAttribute('datetime', POST.date.iso);
    expect((posted as HTMLTimeElement).dateTime).toBe(POST.date.iso);
    expect(posted.textContent).toBe(POST.date.label);
    // Whole on its line: the date and the name are each an inline block.
    expect(tokensOf(posted)).toEqual(['inline-block']);
  });

  it('wears ui/Eyebrow, unhyphenated, and holds the day, the separator and the author in that order', () => {
    renderCard();

    const line = dateLine();
    expect(line.tagName).toBe('P');
    expect(line.className).toBe(`${EYEBROW_RECIPE} hyphens-none`);
    const [time, dot, comma, author] = [...line.children] as HTMLElement[];
    expect(line.children).toHaveLength(4);
    expect(time).toBe(screen.getByRole('time'));
    expect(author.textContent).toBe(POST.author);
    expect(tokensOf(author)).toEqual(['inline-block']);
    // The DOT is for the eye alone — glued to the date by a no-break space,
    // a plain space after it — and the COMMA for the ear alone.
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot.textContent).toBe(`${NO_BREAK_SPACE}· `);
    expect(tokensOf(comma)).toEqual(['sr-only']);
    expect(comma).not.toHaveAttribute('aria-hidden');
    expect(comma.textContent).toBe(', ');
    expect(line.textContent).toBe(
      `${POST.date.label}${NO_BREAK_SPACE}· , ${POST.author}`,
    );
  });

  it('separates with a middle dot and a comma — never a dash (the owner’s D-DASH rule)', () => {
    renderCard();

    // The fixture's own words carry no dash, so a dash anywhere in the line
    // could only be one the card typed itself.
    const text = dateLine().textContent ?? '';
    for (const dash of DASHES) expect(text).not.toContain(dash);
  });
});

describe('PostCard — the tags: the price strip’s chips at rest', () => {
  it('renders a list named by `tagsLabel`, one <li> per tag, in order', () => {
    renderCard();

    const list = screen.getByRole('list', { name: TAGS_LABEL });
    expect(list.tagName).toBe('UL');
    // Load-bearing in WebKit, which drops list semantics from an unstyled
    // list (eslint.config.mjs's list-role exception).
    expect(list).toHaveAttribute('role', 'list');
    expect(tokensOf(list)).toEqual(['flex', 'flex-wrap', 'gap-3']);
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([...POST.tags]);
  });

  it('dresses each <li> as ui/PillButton at REST — the thin lavender edge, never the current face', () => {
    renderCard();

    for (const item of within(
      screen.getByRole('list', { name: TAGS_LABEL }),
    ).getAllByRole('listitem')) {
      expect(item.tagName).toBe('LI');
      const tokens = tokensOf(item);
      for (const token of CHIP_AT_REST) expect(tokens).toContain(token);
      // The current chip's face is lavender; a tag is never current.
      expect(tokens).not.toContain('bg-accent');
      expect(item).not.toHaveAttribute('aria-current');
      // `asChild` leaves no <button> attribute on the item.
      expect(item.getAttributeNames()).toEqual(['class']);
    }
  });

  it('renders no list at all when the post has no tags', () => {
    renderCard({ tags: [] });

    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    // …and the words keep their order without it: title, date line, summary.
    const { words } = partsOf(screen.getByRole('article'));
    expect([...words.children].map((child) => child.tagName)).toEqual([
      'H2',
      'P',
      'P',
    ]);
  });
});

describe('PostCard — the picture', () => {
  it('fills a square cell with ui/Image’s framed photograph, its alt as given', () => {
    const { cell, picture } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    expect(tokensOf(cell)).toEqual(PICTURE_CELL);
    expect(screen.getByRole('img', { name: POST.image.alt })).toBe(picture);
    expect(picture).toHaveAttribute('data-nimg', 'fill');
    for (const token of FRAMED_PHOTO) {
      expect(tokensOf(picture)).toContain(token);
    }
  });

  it('treats an empty alt as decorative — no image in the accessibility tree', () => {
    renderCard({ image: { src: POST.image.src, alt: '' } });

    expect(screen.queryByRole('img')).toBeNull();
    expect(partsOf(screen.getByRole('article')).picture).toHaveAttribute(
      'alt',
      '',
    );
  });

  it('asks for its real box in `sizes` — a quarter of the card from 46rem, the card under it', () => {
    const { picture } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    expect(picture).toHaveAttribute('sizes', SIZES);
  });

  it('loads LAZILY when not asked — and carries no `fetchpriority`', () => {
    const { picture } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    expect(picture).toHaveAttribute('loading', 'lazy');
    expect(picture).not.toHaveAttribute('fetchpriority');
  });

  it('loads EAGERLY at high priority when the page asks — its first card, a likely LCP', () => {
    const { picture } = partsOf(
      renderCard({ preload: true }).container.firstElementChild as HTMLElement,
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

describe('PostCard — the card and its layout', () => {
  it('puts ui/Card’s framed tone inside the article — the house corner, no glow, filling the article', () => {
    const { card } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    const tokens = tokensOf(card);
    expect(card.tagName).toBe('DIV');
    for (const token of FRAMED) expect(tokens).toContain(token);
    expect(tokens).toContain('rounded-md');
    expect(tokens).not.toContain('rounded-soft');
    expect(tokens).not.toContain('shadow-aura');
    // Placement, merged last by the atom (§6.8).
    expect(tokens.at(-1)).toBe('h-full');
  });

  it('lays the picture and the words in ONE grid that becomes a row at the card’s @lg — DOM order = visual order', () => {
    const { grid, cell, words } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    expect(tokensOf(grid)).toEqual(GRID);
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0]).toBe(cell);
    expect(tokensOf(words)).toEqual(WORDS);
    // Picture, then title, date line, tags, summary.
    expect([...words.children].map((child) => child.tagName)).toEqual([
      'H2',
      'P',
      'UL',
      'P',
    ]);
    expect(words.children[0]).toBe(screen.getByRole('heading', { level: 2 }));
    expect(words.children[1]).toBe(dateLine());
    expect(words.children[2]).toBe(screen.getByRole('list'));
  });

  it('closes on the summary, in ui/Text’s muted ink', () => {
    const { words } = partsOf(
      renderCard().container.firstElementChild as HTMLElement,
    );

    const summary = words.lastElementChild as HTMLElement;
    expect(summary.tagName).toBe('P');
    expect(summary.textContent).toBe(POST.summary);
    expect(summary.className).toBe('text-base text-ink-muted');
  });
});

describe('PostCard — the jump, and nothing to press', () => {
  it('carries THE CARD JUMP on the article: 200ms, the keyword ease-out, 105 %, still under reduced motion', () => {
    renderCard();

    const article = screen.getByRole('article');
    // Exactly the jump, in order, and nothing else of the card's own.
    expect(tokensOf(article)).toEqual(JUMP);
    // The reset is the half a screenshot can never show (the net runs under
    // reduced motion, where the card never moves).
    expect(tokensOf(article)).toContain('motion-reduce:hover:scale-100');
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
        'a, button, input, select, textarea, summary, details, iframe, [href], [tabindex], [contenteditable]',
      ),
    ).toHaveLength(0);
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
  });

  it('spreads native props onto the article, never onto the atoms', () => {
    render(
      <PostCard
        {...POST}
        tagsLabel={TAGS_LABEL}
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

  it('owns no outer margin anywhere — the page’s list owns spacing (§6.4)', () => {
    const { container } = renderCard();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^-?m[trblxyse]?-/);
      }
    }
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

  it('imports EXACTLY the six atoms it composes, lib/cx and two lib TYPES', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // atom swapped for one with state would hydrate the whole index. ui/Image
    // is the one accepted island (its optimizer's), named here so the
    // question is asked out loud the day a seventh import arrives. The two lib
    // modules arrive as TYPES only — zero bytes, no lib DATA in this tier.
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
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      '@/lib/time-ago/time-ago',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{ ImagePath \} from '@\/lib\/image-path\/image-path';$/m,
    );
    expect(CODE).toMatch(
      /^import type \{ IsoDate \} from '@\/lib\/time-ago\/time-ago';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders every string intact — diacritics and all — and no message key path (§8.1)', () => {
    const { container } = renderCard();

    expect(container.textContent).toBe(
      `${POST.title}${POST.date.label}${NO_BREAK_SPACE}· , ${POST.author}${POST.tags.join('')}${POST.summary}`,
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
    // `title` is the heading's text, never the native tooltip's string|undefined.
    expectTypeOf<PostCardProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PostCardHeadingLevel>().toEqualTypeOf<2 | 3>();
    expectTypeOf<PostCardProps['headingLevel']>().toEqualTypeOf<
      PostCardHeadingLevel | undefined
    >();
    expectTypeOf<PostCardProps['preload']>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<PostCardProps['tagsLabel']>().toEqualTypeOf<string>();
    // The day in both halves, the picture under the optimizer's one folder,
    // the tags read-only — and the day and the picture READ-ONLY too, as
    // lib/blog's BlogPost holds them (G2 typescript, 2026-10-14). The pin is
    // an identity, so it compares each property's readonly flag as well as
    // its type: the mutable shapes fail it.
    expectTypeOf<PostCardContent['date']>().toEqualTypeOf<
      Readonly<{ iso: IsoDate; label: string }>
    >();
    expectTypeOf<PostCardContent['image']>().toEqualTypeOf<
      Readonly<{ src: ImagePath; alt: string }>
    >();
    expectTypeOf<PostCardContent['tags']>().toEqualTypeOf<readonly string[]>();
  });
});
