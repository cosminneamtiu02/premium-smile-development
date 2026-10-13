import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { PaginationProps } from '@/components/sections/Pagination/Pagination';
import type { PostCardContent } from '@/components/sections/PostCard/PostCard';
import {
  PostList,
  type PostListItem,
  type PostListPagination,
  type PostListProps,
} from './PostList';
import source from './PostList.tsx?raw';

// sections/PostList — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the opener is found as the page's one level-1
// heading, every card as an `article` named by its own title, the navigation
// as a landmark named by its label.
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
// so a silent edit to the band or to an atom fails HERE. What the real
// stylesheet does with them — the 3rem gaps, the centred title, the top step,
// no sideways scroll at 320 — is PostList.stories.tsx's business.
//
// ── THE PICTURES IN THIS RUNNER: the optimizer's width variants do not exist
// here, so every <img> 404s and the optimizer swaps to the original file on
// the error event, at a macrotask boundary. Every picture assertion is
// therefore SYNCHRONOUS — render, read, assert — never awaited (the PostCard
// suite's rule).

/** Three posts as the page hands them over, in Romanian with diacritics
 *  (§15.7): every word finished, each day in both halves, one post without
 *  categories. Fixtures — never shipped data. */
const POSTS = [
  {
    slug: 'cum-iti-alegi-periuta-de-dinti',
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
  },
  {
    slug: 'ce-este-tartrul',
    title: 'Ce este tartrul și de ce se formează',
    summary:
      'Placa bacteriană întărită pe dinți, pe care periajul de acasă nu o mai poate îndepărta.',
    date: { iso: '2026-09-15', label: '15 septembrie 2026' },
    author: 'Dr. Malea (Sabău) Oana Bianca',
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
    date: { iso: '2026-08-30', label: '30 august 2026' },
    author: 'Dr. Ivașcu-Zugravu Cătălina',
    image: {
      src: '/images/hero/instruments.jpg',
      alt: 'Instrumentele suspendate pe brațul unității dentare',
    },
    tags: [],
  },
] as const satisfies readonly PostListItem[];

const EYEBROW = 'Blog';
const TITLE = 'Articole și noutăți';
const TAGS_LABEL = 'Categorii';
const NAV_LABEL = 'Paginile articolelor';

/** Page 1 of 3, the shape the page builds: no back href, a forward one. */
const FIRST_OF_THREE = {
  label: NAV_LABEL,
  current: 1,
  total: 3,
  status: 'Pagina 1 din 3',
  previousLabel: 'Anterior',
  nextLabel: 'Următor',
  nextHref: '/ro/blog/page/2/',
} as const satisfies PostListPagination;

/** The only page: nothing to page through, so no navigation at all. */
const ONLY_PAGE = {
  label: NAV_LABEL,
  current: 1,
  total: 1,
  status: 'Pagina 1 din 1',
  previousLabel: 'Anterior',
  nextLabel: 'Următor',
} as const satisfies PostListPagination;

// THE RECIPES, written out.
/** The privacy policy's rhythm box, to the class (THE BAND). */
const RHYTHM = [
  'flex',
  'flex-col',
  'gap-12',
  'py-12',
  '@lg:py-16',
  '@3xl:py-20',
];
/** The opener: both boxes centred, 8px apart, the title's lines centred. */
const OPENER = ['flex', 'flex-col', 'items-center', 'gap-2', 'text-center'];
/** One card a row, 3rem apart. */
const LIST = ['flex', 'flex-col', 'gap-12'];
/** ui/Heading's `hero` step — THE h1 step (§15.24) — on its default ink. */
const HERO_TITLE = [
  'font-display',
  'text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  'text-ink-strong',
];
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

/** Read through the ATTRIBUTE, the same bytes on every element. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const renderList = (overrides: Partial<PostListProps> = {}) =>
  render(
    <PostList
      eyebrow={EYEBROW}
      title={TITLE}
      posts={POSTS}
      tagsLabel={TAGS_LABEL}
      pagination={FIRST_OF_THREE}
      {...overrides}
    />,
  );

/** The band's boxes, reached from the <h1> by structure — none of the outer
 *  ones carries a role: the opener, the rhythm box, ui/Container, the
 *  <section>. */
const partsOf = (h1: HTMLElement) => {
  const opener = h1.parentElement as HTMLElement;
  const rhythm = opener.parentElement as HTMLElement;
  const column = rhythm.parentElement as HTMLElement;
  return {
    opener,
    rhythm,
    column,
    section: column.parentElement as HTMLElement,
  };
};

const pageTitle = (): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: TITLE });

/** The list of articles — the rhythm box's <ul>, never a card's tag list. */
const articleList = (): HTMLElement => {
  const list = partsOf(pageTitle()).rhythm.querySelector(':scope > ul');
  if (!(list instanceof HTMLUListElement)) throw new Error('no article list');
  return list;
};

/**
 * The band's source with its PROSE removed — what the zero-island guards run
 * against (the PostCard suite's mechanism): the header names `'use client'`,
 * t() and the hooks the band does not have, by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('PostList — the opener: an eyebrow over the page’s one <h1>', () => {
  it('renders exactly ONE <h1>, the title, on ui/Heading’s `hero` step', () => {
    renderList();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const h1 = pageTitle();
    expect(h1.tagName).toBe('H1');
    expect(tokensOf(h1)).toEqual(HERO_TITLE);
  });

  it('puts the eyebrow before the title — a ui/Eyebrow <p>, centred ON THE ELEMENT (§15.15 b)', () => {
    renderList();

    const h1 = pageTitle();
    const { opener } = partsOf(h1);
    const eyebrow = within(opener).getByText(EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow.className).toBe(`${EYEBROW_RECIPE} text-center`);
    // DOM order is visual order: the kicker, then the title, nothing else.
    expect([...opener.children]).toEqual([eyebrow, h1]);
  });

  it('centres the opener’s boxes and the title’s lines through its <header>', () => {
    renderList();

    const { opener } = partsOf(pageTitle());
    expect(opener.tagName).toBe('HEADER');
    expect(tokensOf(opener)).toEqual(OPENER);
  });
});

describe('PostList — the band: ui/Container’s page-band recipe', () => {
  it('is an UNNAMED, unpainted <section> around ui/Container, the rhythm box the privacy policy’s', () => {
    renderList();

    const { rhythm, column, section } = partsOf(pageTitle());
    expect(section.tagName).toBe('SECTION');
    // No name, no class: the page's <main> is the landmark, the body paints.
    expect(section.getAttributeNames()).toEqual([]);
    expect(section.children).toHaveLength(1);
    expect(tokensOf(column)).toContain('@container');
    expect(column.children).toHaveLength(1);
    expect(tokensOf(rhythm)).toEqual(RHYTHM);
  });

  it('stacks the opener, the list and the navigation, in that order, in the one rhythm box', () => {
    renderList();

    const { opener, rhythm } = partsOf(pageTitle());
    expect([...rhythm.children]).toEqual([
      opener,
      articleList(),
      screen.getByRole('navigation', { name: NAV_LABEL }),
    ]);
  });

  it('owns no outer margin on any box of its own — its gap spaces them (§6.4)', () => {
    renderList();

    // ui/Container is left out on purpose: its side margins ARE the gutter,
    // the atom's own product (its header's §6.4 nuance), never the band's.
    const { opener, rhythm, section } = partsOf(pageTitle());
    const list = articleList();
    const boxes = [section, rhythm, opener, list, ...list.children];
    for (const box of boxes) {
      for (const token of tokensOf(box)) {
        expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
      }
    }
    // The navigation is placed by that gap alone: the band hands it no class.
    for (const token of tokensOf(
      screen.getByRole('navigation', { name: NAV_LABEL }),
    )) {
      expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
    }
  });
});

describe('PostList — the list of articles', () => {
  it('renders one list item per post, in order, each holding an article named by its <h2>', () => {
    renderList();

    const list = articleList();
    expect(list).toHaveAttribute('role', 'list');
    expect(tokensOf(list)).toEqual(LIST);
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

  it('hands every card the tag list’s name', () => {
    renderList();

    for (const post of POSTS.filter((entry) => entry.tags.length > 0)) {
      const article = screen.getByRole('article', { name: post.title });
      expect(
        within(article).getByRole('list', { name: TAGS_LABEL }),
      ).toBeInTheDocument();
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
    // attributes alone: nothing of the item rode the spread.
    for (const item of articleList().children) {
      expect(item.getAttributeNames()).toEqual([]);
      expect(
        (item.firstElementChild as HTMLElement).getAttributeNames().sort(),
      ).toEqual(['aria-labelledby', 'class']);
    }
  });
});

describe('PostList — the page navigation', () => {
  it('renders the navigation landmark, named by its label, when there is more than one page', () => {
    renderList();

    const nav = screen.getByRole('navigation', { name: NAV_LABEL });
    expect(nav.tagName).toBe('NAV');
    expect(within(nav).getByRole('link', { name: 'Următor' })).toHaveAttribute(
      'href',
      FIRST_OF_THREE.nextHref,
    );
  });

  it('renders NO navigation on a one-page blog', () => {
    renderList({ pagination: ONLY_PAGE });

    expect(screen.queryByRole('navigation')).toBeNull();
    const { opener, rhythm } = partsOf(pageTitle());
    expect([...rhythm.children]).toEqual([opener, articleList()]);
  });
});

describe('PostList — the empty blog', () => {
  it('renders the opener ALONE — no list, no article, no navigation', () => {
    renderList({ posts: [], pagination: ONLY_PAGE });

    const h1 = pageTitle();
    const { opener, rhythm } = partsOf(h1);
    expect([...rhythm.children]).toEqual([opener]);
    expect(within(opener).getByText(EYEBROW)).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toEqual([h1]);
    expect(screen.queryAllByRole('list')).toHaveLength(0);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByRole('navigation')).toBeNull();
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

  it('imports EXACTLY the two sections and three atoms it composes — and no data', () => {
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
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      'react',
    ]);
    expect(CODE).toMatch(/^import type \{ ReactElement \} from 'react';$/m);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
  });

  it('renders every string as given — diacritics intact, no message key path (§8.1)', () => {
    const { container } = renderList({ posts: [], pagination: ONLY_PAGE });

    expect(container.textContent).toBe(`${EYEBROW}${TITLE}`);
  });
});

describe('PostList — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    expectTypeOf<keyof PostListProps>().toEqualTypeOf<
      'eyebrow' | 'title' | 'posts' | 'tagsLabel' | 'pagination'
    >();
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
