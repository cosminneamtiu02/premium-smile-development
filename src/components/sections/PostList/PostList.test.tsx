import {
  getDefaultNormalizer,
  render,
  screen,
  within,
} from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { PaginationProps } from '@/components/sections/Pagination/Pagination';
import type { PostCardContent } from '@/components/sections/PostCard/PostCard';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import ro from '@/messages/ro.json';
import {
  PostList,
  type PostListItem,
  type PostListPagination,
  type PostListProps,
} from './PostList';
import { namedAs } from './PostList.fixtures';
import source from './PostList.tsx?raw';

// sections/PostList — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the hero is found as the page's one level-1 heading,
// every card as an `article` named by its own title, the pager as a landmark
// named by its label.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the PostCard and ReviewCard precedent):
// next-intl's hooks throw without one, so a green render proves the band
// calls no t(). NOTHING IS MOCKED either: no router, no clock, no data — a
// dumb band needs none of them, which is the point of the shape.
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the layout's contract here —
// written OUT below rather than imported (the ui/Eyebrow RECIPE convention),
// so a silent edit to the band or to an atom fails HERE. One exception,
// compared rather than retyped: ui/Container's two band-scale strings
// (imported — a hand-typed copy would be a second spelling of the regime,
// which tests/unit/design-scale.test.ts forbids in spirit). What the real
// stylesheet and the real faces do with all of it — the stairway's two and
// three lines, the grid's columns, the pager under the grid's corner, the
// scale — is PostList.scale.test.tsx's business and PostList.stories.tsx's.
//
// ── THE COPY CARRIES LINE BREAKS (PostList.tsx's THE STAIRWAY): the hero's
// two strings hold a `\n` where the stairway turns. A role query names the
// heading by its accessible name, and the two engines that compute one
// disagree on that `\n`: dom-accessibility-api, which Testing Library uses,
// keeps it, while Chromium's own name — what a screen reader speaks — reads
// it as a space. So the <h1> is found by PostList.fixtures.ts's `namedAs`,
// whitespace collapsed on both sides (G2 react and typescript, 2026-10-15),
// so no query leans on the `\n` one engine happens to keep. A TEXT query
// collapses the element's whitespace by default, so the lead is found with
// a normalizer that keeps it (`leadIn`) — which also proves the breaks reach
// the DOM.
//
// ── THE PICTURES IN THIS RUNNER: the optimizer's width variants do not exist
// here, so every <img> 404s and the optimizer swaps to the original file on
// the error event, at a macrotask boundary. Every picture assertion is
// therefore SYNCHRONOUS — render, read, assert — never awaited (the PostCard
// suite's rule).

/** Three posts as the page hands them over, in Romanian with diacritics
 *  (§15.7): every word finished, the reading time included, one post without
 *  categories. Fixtures — never shipped data. */
const POSTS = [
  {
    slug: 'cum-iti-alegi-periuta-de-dinti',
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
  },
  {
    slug: 'ce-este-tartrul',
    title: 'Ce este tartrul și de ce se formează',
    summary:
      'Placa bacteriană întărită pe dinți, pe care periajul de acasă nu o mai poate îndepărta.',
    author: 'Dr. Malea (Sabău) Oana Bianca',
    readingTime: '5 min de citit',
    image: {
      src: '/images/hero/treatment-room.jpg',
      alt: 'Cabinet de tratament, cu scaunul stomatologic',
    },
    tags: ['prevenție'],
  },
  {
    slug: 'prima-vizita-a-copilului-la-dentist',
    title: 'Prima vizită a copilului la dentist',
    summary:
      'Cum îl pregătești acasă și ce se întâmplă în timpul primei consultații.',
    author: 'Dr. Ivașcu-Zugravu Cătălina',
    readingTime: '6 min de citit',
    image: {
      src: '/images/hero/instruments.jpg',
      alt: 'Instrumentele suspendate pe brațul unității dentare',
    },
    tags: [],
  },
] as const satisfies readonly PostListItem[];

/** The hero's two strings — the shipped Romanian copy, read out of the
 *  message file (PostList.tsx's THE STAIRWAY was measured on it), its line
 *  breaks and no-break spaces included. */
const TITLE = ro.blog.hero.title;
const LEAD = ro.blog.hero.lead;
const TAGS_LABEL = 'Categorii';
const READ_MORE = 'Citește mai mult…';
const NAV_LABEL = 'Paginile articolelor';
const PREVIOUS = 'Pagina anterioară';
const NEXT = 'Pagina următoare';

/** Page 1 of 2, the shape the page builds: no back href, a forward one. */
const FIRST_OF_TWO = {
  label: NAV_LABEL,
  current: 1,
  total: 2,
  status: 'Pagina 1 din 2',
  previousLabel: PREVIOUS,
  nextLabel: NEXT,
  nextHref: '/ro/blog/page/2/',
} as const satisfies PostListPagination;

/** The only page: nothing to page through, so no pager at all. */
const ONLY_PAGE = {
  label: NAV_LABEL,
  current: 1,
  total: 1,
  status: 'Pagina 1 din 1',
  previousLabel: PREVIOUS,
  nextLabel: NEXT,
} as const satisfies PostListPagination;

// THE RECIPES, written out.
/** The rhythm box's own classes (THE BAND) — the band-scale strings follow:
 *  the one gap from the lead to the cards (4.8rem — 19.2 spacing steps in
 *  brackets, the expression a bare step compiles to — and 6rem from a 48rem
 *  column), the room above the hero (4 / 6 / 8rem) and under the pager
 *  (2rem). */
const RHYTHM_OWN = [
  'flex',
  'flex-col',
  'gap-[calc(var(--spacing)*19.2)]',
  '@3xl:gap-24',
  'pt-16',
  '@lg:pt-24',
  '@3xl:pt-32',
  'pb-8',
];
/** The hero: both boxes centred, 3rem apart, the heading's lines centred. */
const HERO = ['flex', 'flex-col', 'items-center', 'gap-12', 'text-center'];
/** ui/Heading's `hero` step — THE h1 step (§15.24) — on its default ink. */
const HERO_STEP = [
  'font-display',
  'text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  'text-ink-strong',
];
/** The one wrap style the hero's two blocks wear: `pretty` on a phone's or a
 *  tablet's column alone, under the Container's 48rem step (THE HERO). */
const PHONE_PRETTY = '@max-3xl:text-pretty';
/** THE STAIRWAY: the copy's own line breaks held inside THE BAND SCALE alone
 *  — the pre-line white-space behind the band scale's chain, worn by both
 *  blocks. */
const STAIRWAY = 'scalable:@4xl:@min-[896px]:whitespace-pre-line';
/** THE HEADING'S REACH: inside the band scale alone the <h1> is as wide as
 *  its longest line, up to the column's full width plus 50 spacing steps —
 *  100 design pixels a side — behind the band scale's chain (the owner,
 *  2026-10-15: "it should not be constrained by a div"). */
const REACH = [
  'scalable:@4xl:@min-[896px]:w-max',
  'scalable:@4xl:@min-[896px]:max-w-[calc(100%+var(--spacing)*50)]',
];
/** The <h1>'s size inside the band scale: 16.26 spacing steps, 65.04 design
 *  pixels — sections/DoctorIntro's name's class byte for byte, the KEEP-IN-
 *  SYNC pair restored on the owner's word of 2026-10-15 ("tbh i kinda liked
 *  it how it looked before"). */
const SIZE_IN_SCALE =
  'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]';
/** The <h1>'s own classes before its gated ones: the 6xl cap (THE CAPS),
 *  whole words, the belt, and the phone's `pretty` wrap. */
const TITLE_OWN = ['max-w-6xl', 'hyphens-none', 'wrap-anywhere', PHONE_PRETTY];
/** ui/Text's muted recipe, then the lead's own: the cap of 123 spacing steps
 *  (THE CAPS), whole words, the heading's belt for a word too long for a
 *  line, centred ON THE ELEMENT, the phone's `pretty`, the stairway. */
const LEAD_TOKENS = [
  'text-base',
  'text-ink-muted',
  'max-w-123',
  'hyphens-none',
  'wrap-anywhere',
  'text-center',
  PHONE_PRETTY,
  STAIRWAY,
];
/** The cards and the pager: one 2rem gap (THE PAGER). */
const GROUP = ['flex', 'flex-col', 'gap-8'];
/** One column, two from 36rem, three from 56rem, 2rem apart (THE LIST). */
const GRID = [
  'grid',
  'grid-cols-1',
  'gap-8',
  '@xl:grid-cols-2',
  '@4xl:grid-cols-3',
];

/** Read through the ATTRIBUTE, the same bytes on every element. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** A token's variant chain — the colon-separated part before its utility,
 *  brackets kept whole (an arbitrary value may hold a colon). */
const variantsOf = (token: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i += 1) {
    const char = token[i];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  return parts;
};

/** A token's utility — what follows its variant chain. */
const utilityOf = (token: string): string => {
  const variants = variantsOf(token);
  return variants.length === 0
    ? token
    : token.slice(variants.join(':').length + 1);
};

const renderList = (overrides: Partial<PostListProps> = {}) =>
  render(
    <PostList
      title={TITLE}
      lead={LEAD}
      posts={POSTS}
      tagsLabel={TAGS_LABEL}
      readMore={READ_MORE}
      pagination={FIRST_OF_TWO}
      {...overrides}
    />,
  );

/** The band's boxes, reached from the <h1> by structure — none of the outer
 *  ones carries a role: the hero, the rhythm box, ui/Container, the
 *  <section>. */
const partsOf = (h1: HTMLElement) => {
  const hero = h1.parentElement as HTMLElement;
  const rhythm = hero.parentElement as HTMLElement;
  const column = rhythm.parentElement as HTMLElement;
  return {
    hero,
    rhythm,
    column,
    section: column.parentElement as HTMLElement,
  };
};

/** The page's <h1>, by the name a screen reader hears (the header's THE COPY
 *  CARRIES LINE BREAKS). */
const pageTitle = (): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: namedAs(TITLE) });

/** The cards and the pager — the rhythm box's second child. */
const groupOf = (): HTMLElement => {
  const group = partsOf(pageTitle()).hero.nextElementSibling;
  if (!(group instanceof HTMLDivElement)) throw new Error('no group');
  return group;
};

/** The list of articles — the group's <ul>, never a card's tag list. */
const articleList = (): HTMLElement => {
  const list = groupOf().querySelector(':scope > ul');
  if (!(list instanceof HTMLUListElement)) throw new Error('no article list');
  return list;
};

/**
 * The band's source with its PROSE removed — what the zero-island and
 * by-name guards run against: the header names `'use client'`, t(), the
 * hooks the band does not have and the spread it no longer makes, by name.
 * Three passes, in the PostCard suite's order (the accent census's lesson):
 * full-line comments first — a line comment may itself hold a block opener,
 * which taken first would swallow the code up to the next block's close —
 * then blocks, JSX comments included, then the comments that trail code.
 */
const stripComments = (code: string): string =>
  code
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const CODE = stripComments(source);

/** The band scale's variant chain — the gate first — as ui/Container spells
 *  it, read off its regime string (one chain, or a throw that says so). */
const SCALE_CHAIN = (() => {
  const chains = new Set(
    bandScaleClasses.split(' ').map(variantsOf).map(String),
  );
  if (chains.size !== 1) throw new Error('ui/Container: not one chain');
  return [...chains][0];
})();

/** The lead, found by its text with the line breaks KEPT — the default
 *  normalizer would collapse them into spaces and never match the copy. */
const leadIn = (hero: HTMLElement): HTMLElement =>
  within(hero).getByText(LEAD, {
    normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
  });

describe('PostList — the hero: the page’s one <h1> over a lead', () => {
  it('renders exactly ONE <h1>, the title, on ui/Heading’s `hero` step — whole words, belted and capped', () => {
    renderList();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const h1 = pageTitle();
    expect(h1.tagName).toBe('H1');
    expect(tokensOf(h1)).toEqual([
      ...HERO_STEP,
      ...TITLE_OWN,
      STAIRWAY,
      ...REACH,
      SIZE_IN_SCALE,
    ]);
  });

  it('is found by the name a screen reader hears — the copy’s line break a space, whitespace collapsed on both sides, whichever engine computes the name', () => {
    renderList();

    const h1 = pageTitle();
    // Chromium's own accessible name reads the copy's line break as a space
    // (its accessibility tree through the DevTools protocol, 2026-10-15):
    // that name finds the very heading the suite's query does…
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: namedAs(TITLE.replaceAll('\n', ' ')),
      }),
    ).toBe(h1);
    // …the raw `\n` that dom-accessibility-api keeps matches as well, and the
    // heading's text with one word changed matches nothing.
    expect(namedAs(TITLE)(TITLE)).toBe(true);
    expect(namedAs(TITLE)(TITLE.replace('blogul', 'jurnalul'))).toBe(false);
  });

  it('wears, LAST, the doctor page’s name’s size in the band scale — 16.26 spacing steps, 65.04 design pixels — behind the band scale’s chain, the stairway and the heading’s reach beside it', () => {
    renderList();

    // The `hero` step reads the viewport, the one size the remap cannot
    // redraw (THE BAND SCALE): inside the scale the title takes sections/
    // DoctorIntro's name's design size, 65.04 (tests/unit/design-scale.test.ts
    // holds the two classes equal), and the room for every language's two
    // lines comes from the heading's reach, not from a smaller size.
    const tokens = tokensOf(pageTitle());
    expect(tokens.at(-1)).toBe(SIZE_IN_SCALE);
    // …behind the band scale's own chain, the gate first, and nothing else on
    // the heading gated but the stairway and the reach.
    for (const token of [STAIRWAY, ...REACH, SIZE_IN_SCALE]) {
      expect(String(variantsOf(token)), token).toBe(SCALE_CHAIN);
    }
    expect(
      tokens.filter((token) => variantsOf(token).includes('scalable')),
    ).toEqual([STAIRWAY, ...REACH, SIZE_IN_SCALE]);
    // …so the reach is never worn ungated: off the scale a max-content width
    // would lay the whole heading on one line wider than a phone (the full
    // token list above admits no other width on the heading; the ungated
    // forms are not spelled in this file, which Tailwind scans too).
  });

  it('puts the lead right after the title — a ui/Text <p>, muted, whole words, centred ON THE ELEMENT (§15.15 b), capped, on the stairway', () => {
    renderList();

    const h1 = pageTitle();
    const { hero } = partsOf(h1);
    const lead = leadIn(hero);
    expect(lead.tagName).toBe('P');
    expect(tokensOf(lead)).toEqual(LEAD_TOKENS);
    // DOM order is visual order: the title, then the lead, nothing else — no
    // eyebrow (THE HERO: the owner's "eyebrow of text" is this sentence).
    expect([...hero.children]).toEqual([h1, lead]);
  });

  it('keeps the copy’s line breaks inside THE BAND SCALE alone — ONE white-space token on each block, the stairway behind the band scale’s chain, none on the boxes around them', () => {
    renderList();

    // The white-space utilities, built from their values so this file spells
    // no class nothing wears (Tailwind scans tests too).
    const whiteSpaces = new Set(
      ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'].map(
        (value) => `whitespace-${value}`,
      ),
    );
    const whiteSpaceTokensOf = (element: Element): string[] =>
      tokensOf(element).filter((token) => whiteSpaces.has(utilityOf(token)));
    const h1 = pageTitle();
    const { hero, rhythm } = partsOf(h1);
    expect(whiteSpaceTokensOf(h1)).toEqual([STAIRWAY]);
    expect(whiteSpaceTokensOf(leadIn(hero))).toEqual([STAIRWAY]);
    expect(whiteSpaceTokensOf(hero)).toEqual([]);
    expect(whiteSpaceTokensOf(rhythm)).toEqual([]);
    // …and the copy's breaks reach the DOM as written: one in the heading,
    // two in the lead.
    expect(h1.textContent).toBe(TITLE);
    expect(TITLE.split('\n')).toHaveLength(2);
    expect(LEAD.split('\n')).toHaveLength(3);
  });

  it('centres both boxes and the title’s lines through its <header>', () => {
    renderList();

    const { hero } = partsOf(pageTitle());
    expect(hero.tagName).toBe('HEADER');
    expect(tokensOf(hero)).toEqual(HERO);
  });

  it('wraps the title and the lead as prose falls from the 48rem step up, `pretty` only on a phone’s or a tablet’s column — ONE wrap token on each, none on the boxes around them', () => {
    renderList();

    // The wrap style INHERITS, so a wrap utility on the hero or the rhythm box
    // would reshape both blocks. Of Tailwind's four `text-*` wrap utilities,
    // under any variant, the title and the lead wear exactly one —
    // `@max-3xl:text-pretty` (THE HERO) — and every other is refused: a
    // balanced wrap, a `pretty` at every width, a `nowrap`. (The four are
    // built from their style names, so this file spells no class nothing
    // wears — Tailwind scans tests too.)
    const wrapUtilities = new Set(
      ['wrap', 'nowrap', 'balance', 'pretty'].map((style) => `text-${style}`),
    );
    const wrapTokensOf = (element: Element): string[] =>
      tokensOf(element).filter((token) => wrapUtilities.has(utilityOf(token)));
    const h1 = pageTitle();
    const { hero, rhythm } = partsOf(h1);
    expect(wrapTokensOf(h1)).toEqual([PHONE_PRETTY]);
    expect(wrapTokensOf(leadIn(hero))).toEqual([PHONE_PRETTY]);
    expect(wrapTokensOf(hero)).toEqual([]);
    expect(wrapTokensOf(rhythm)).toEqual([]);
  });
});

describe('PostList — the band: ui/Container’s page-band recipe and THE BAND SCALE', () => {
  it('is an UNNAMED, unpainted <section> around ui/Container, the rhythm box wearing the band scale', () => {
    renderList();

    const { rhythm, column, section } = partsOf(pageTitle());
    expect(section.tagName).toBe('SECTION');
    // No name, no class: the page's <main> is the landmark, the body paints.
    expect(section.getAttributeNames()).toEqual([]);
    expect(section.children).toHaveLength(1);
    expect(column.className).toBe(containerClasses);
    expect(column.children).toHaveLength(1);
    // ui/Container's recipe rule 5: the band's own classes, then BOTH
    // band-scale strings — imported and compared, never retyped.
    expect(rhythm.className).toBe(
      `${RHYTHM_OWN.join(' ')} ${bandColumnClasses} ${bandScaleClasses}`,
    );
  });

  it('gates nothing but the rhythm box’s two strings, the title’s four classes and the lead’s one', () => {
    const { container } = renderList();

    const h1 = pageTitle();
    const { hero, rhythm } = partsOf(h1);
    const lead = leadIn(hero);
    const fromTheScale = [
      ...bandColumnClasses.split(' '),
      ...bandScaleClasses.split(' '),
    ].filter((token) => variantsOf(token).includes('scalable'));
    expect(fromTheScale.length).toBeGreaterThan(0);
    for (const element of [container, ...container.querySelectorAll('*')]) {
      const gated = tokensOf(element).filter((token) =>
        variantsOf(token).includes('scalable'),
      );
      if (element === rhythm) expect(gated).toEqual(fromTheScale);
      else if (element === h1)
        expect(gated).toEqual([STAIRWAY, ...REACH, SIZE_IN_SCALE]);
      else if (element === lead) expect(gated).toEqual([STAIRWAY]);
      // The pager's discs and the cards follow the band's pixel by
      // inheritance; the section's own children wear no gate of their own.
      else if (element.closest('article, nav') === null)
        expect(gated).toEqual([]);
    }
    // The regime is ui/Container's: the band spells none of it.
    expect(CODE).not.toMatch(/design-scale|--scale-px/);
    expect(CODE).toMatch(/\bbandColumnClasses\b/);
    expect(CODE).toMatch(/\bbandScaleClasses\b/);
  });

  it('stacks the hero and the cards-and-pager group, in that order, in the one rhythm box', () => {
    renderList();

    const { hero, rhythm } = partsOf(pageTitle());
    const group = groupOf();
    expect([...rhythm.children]).toEqual([hero, group]);
    expect(tokensOf(group)).toEqual(GROUP);
    expect([...group.children]).toEqual([
      articleList(),
      screen.getByRole('navigation', { name: NAV_LABEL }),
    ]);
  });

  it('owns no outer margin on any box of its own — its gaps space them (§6.4)', () => {
    renderList();

    // ui/Container is left out on purpose: its side margins ARE the gutter,
    // the atom's own product (its header's §6.4 nuance), never the band's;
    // and the band-scale column's `mx-auto` is the cap's centring
    // (bandColumnClasses), not a margin of the band's.
    const { hero, rhythm, section } = partsOf(pageTitle());
    const list = articleList();
    const lead = leadIn(hero);
    const own = (element: Element): string[] =>
      element === rhythm ? RHYTHM_OWN : tokensOf(element);
    for (const box of [
      section,
      rhythm,
      hero,
      pageTitle(),
      lead,
      groupOf(),
      list,
      ...list.children,
    ]) {
      for (const token of own(box)) {
        expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
      }
    }
  });
});

describe('PostList — the list of articles', () => {
  it('renders one list item per post, in order, each holding an article named by its <h2>, on the grid', () => {
    renderList();

    const list = articleList();
    expect(list).toHaveAttribute('role', 'list');
    expect(tokensOf(list)).toEqual(GRID);
    const items = [...list.children] as HTMLElement[];
    expect(items).toHaveLength(POSTS.length);
    items.forEach((item, index) => {
      const post = POSTS[index];
      expect(item.tagName).toBe('LI');
      const article = within(item).getByRole('article', { name: post.title });
      expect(item.firstElementChild).toBe(article);
      expect(
        within(article).getByRole('heading', { level: 2, name: post.title }),
      ).toBeInTheDocument();
    });
  });

  it('makes every card fill its item — `h-full`, the parent’s placement, merged last onto the <article>', () => {
    renderList();

    for (const item of articleList().children) {
      const article = item.firstElementChild as HTMLElement;
      expect(tokensOf(article).at(-1)).toBe('h-full');
    }
  });

  it('hands every card the tag list’s name and the read-more’s label', () => {
    renderList();

    for (const post of POSTS) {
      const article = screen.getByRole('article', { name: post.title });
      if (post.tags.length > 0) {
        expect(
          within(article).getByRole('list', { name: TAGS_LABEL }),
        ).toBeInTheDocument();
      } else {
        expect(within(article).queryByRole('list')).toBeNull();
      }
      expect(within(article).getByText(READ_MORE).tagName).toBe('A');
      expect(within(article).getByText(post.readingTime)).toBeInTheDocument();
    }
  });

  it('preloads the FIRST card’s picture at high priority — and leaves every other card lazy', () => {
    renderList();

    const pictures = [...articleList().children].map(
      (item) => item.querySelector('img') as HTMLImageElement,
    );
    expect(pictures).toHaveLength(POSTS.length);
    const [first, ...rest] = pictures;
    expect(first).toHaveAttribute('fetchpriority', 'high');
    expect(first).not.toHaveAttribute('loading', 'lazy');
    for (const picture of rest) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });

  it('keeps the slug out of the DOM — no attribute names it, nothing prints it', () => {
    const { container } = renderList();

    expect(container.querySelectorAll('[slug]')).toHaveLength(0);
    for (const post of POSTS) {
      expect(container.innerHTML).not.toContain(post.slug);
    }
    // The <li> is bare, and the <article> carries PostCard's own two
    // attributes alone: nothing of the item reaches it but its six fields.
    for (const item of articleList().children) {
      expect(item.getAttributeNames()).toEqual([]);
      expect(
        (item.firstElementChild as HTMLElement).getAttributeNames().sort(),
      ).toEqual(['aria-labelledby', 'class']);
    }
  });
});

describe('PostList — every prop by name', () => {
  // TypeScript lets an object WIDER than its type through a variable, and
  // PostCard and Pagination both spread what they do not know onto their
  // roots — so the band passes each field by name and spreads nothing
  // (PostList.tsx's EVERY CARD PROP BY NAME, AND NOTHING ELSE; THE PAGER).
  it('hands every card its six content fields alone — a field the page adds to an item never reaches the DOM', () => {
    const [first, ...rest] = POSTS;
    const wide = {
      ...first,
      date: '2026-10-14',
      id: 'wide-card',
      'data-wide': 'card',
    };
    const { container } = renderList({ posts: [wide, ...rest] });

    const article = screen.getByRole('article', { name: first.title });
    expect(article.getAttributeNames().sort()).toEqual([
      'aria-labelledby',
      'class',
    ]);
    expect(
      container.querySelector('[date], #wide-card, [data-wide]'),
    ).toBeNull();
  });

  it('hands the pager its eight fields alone — a wider object’s extra field never reaches the <nav>', () => {
    const wide = { ...FIRST_OF_TWO, id: 'wide-pager', 'data-wide': 'pager' };
    renderList({ pagination: wide });

    const nav = screen.getByRole('navigation', { name: NAV_LABEL });
    expect(nav.getAttributeNames().sort()).toEqual(['aria-label', 'class']);
    expect(within(nav).getByRole('link', { name: NEXT })).toHaveAttribute(
      'href',
      FIRST_OF_TWO.nextHref,
    );
  });

  it('spreads nothing anywhere in its source', () => {
    expect(CODE).not.toMatch(/\{\s*\.\.\./);
  });
});

describe('PostList — the pager under the grid’s corner', () => {
  it('renders the navigation landmark, named by its label, after the grid — placed at the end edge by the band (`self-end`, merged last)', () => {
    renderList();

    const nav = screen.getByRole('navigation', { name: NAV_LABEL });
    expect(nav.tagName).toBe('NAV');
    expect(nav.previousElementSibling).toBe(articleList());
    expect(tokensOf(nav).at(-1)).toBe('self-end');
    // The neighbours, named by the two labels: page 1 has no page before it.
    expect(within(nav).getByRole('button', { name: PREVIOUS })).toBeDisabled();
    const next = within(nav).getByRole('link', { name: NEXT });
    expect(next).toHaveAttribute('href', FIRST_OF_TWO.nextHref);
    expect(next).toHaveAttribute('rel', 'next');
  });

  it('renders NO pager on a one-page blog — the group holds the grid alone', () => {
    renderList({ pagination: ONLY_PAGE });

    expect(screen.queryByRole('navigation')).toBeNull();
    expect([...groupOf().children]).toEqual([articleList()]);
  });
});

describe('PostList — the empty blog', () => {
  it('renders the hero ALONE — no group, no list, no article, no pager', () => {
    renderList({ posts: [], pagination: ONLY_PAGE });

    const h1 = pageTitle();
    const { hero, rhythm } = partsOf(h1);
    expect([...rhythm.children]).toEqual([hero]);
    expect(leadIn(hero)).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toEqual([h1]);
    expect(screen.queryAllByRole('list')).toHaveLength(0);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('draws no pager under no grid, whatever the pagination says — the pager stands under the grid’s corner', () => {
    renderList({ posts: [], pagination: FIRST_OF_TWO });

    expect(screen.queryByRole('navigation')).toBeNull();
    expect([...partsOf(pageTitle()).rhythm.children]).toHaveLength(1);
  });
});

describe('PostList — the outline (§9)', () => {
  it('opens on the page’s <h1> and gives every card an <h2> under it', () => {
    renderList();

    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));
    expect(levels).toEqual([1, ...POSTS.map(() => 2)]);
  });
});

describe('PostList — zero islands, zero message keys, zero data', () => {
  it('ships NO client directive, calls no hook, no t() and no handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY the two sections, three atoms and one helper it composes — and no data', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // import of lib/blog would make the band its own populator, and a
    // section with state would hydrate the whole index.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/Pagination/Pagination',
      '@/components/sections/PostCard/PostCard',
      '@/components/ui/Container/Container',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Text/Text',
      '@/lib/cx/cx',
      'react',
    ]);
    expect(CODE).toMatch(/^import type \{ ReactElement \} from 'react';$/m);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
  });

  it('renders every string as given — diacritics, no-break spaces and line breaks intact, no message key path (§8.1)', () => {
    const { container } = renderList({ posts: [], pagination: ONLY_PAGE });

    expect(container.textContent).toBe(`${TITLE}${LEAD}`);
  });
});

describe('PostList — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    expectTypeOf<keyof PostListProps>().toEqualTypeOf<
      'title' | 'lead' | 'posts' | 'tagsLabel' | 'readMore' | 'pagination'
    >();
    expectTypeOf<PostListProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PostListProps['lead']>().toEqualTypeOf<string>();
    expectTypeOf<PostListProps['readMore']>().toEqualTypeOf<string>();
    expectTypeOf<PostListProps['posts']>().toEqualTypeOf<
      readonly PostListItem[]
    >();
    // An item is a card's content plus its slug.
    expectTypeOf<PostListItem>().toExtend<PostCardContent>();
    expectTypeOf<PostListItem['slug']>().toEqualTypeOf<string>();
    // The navigation's data is sections/Pagination's own eight fields, and
    // spreads into it as they are.
    expectTypeOf<keyof PostListPagination>().toEqualTypeOf<
      | 'label'
      | 'current'
      | 'total'
      | 'status'
      | 'previousLabel'
      | 'nextLabel'
      | 'previousHref'
      | 'nextHref'
    >();
    expectTypeOf<PostListPagination>().toExtend<PaginationProps>();
  });
});
