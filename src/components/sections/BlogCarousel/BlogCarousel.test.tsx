import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { CardCarousel } from '@/components/sections/CardCarousel/CardCarousel';
import { PostCard } from '@/components/sections/PostCard/PostCard';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import { BlogCarousel, type BlogCarouselProps } from './BlogCarousel';
import source from './BlogCarousel.tsx?raw';

// sections/BlogCarousel — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the band is a `region` named by its own <h2>, the
// carousel inside it a `region` named by its own words, each card an
// `article` named by its title, the arrows and the progress dots buttons
// named by the page's words.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// PostList and DoctorShowcase suites' rule): next-intl's hooks throw without
// one, so a green render proves the band calls no t(). Nothing is mocked: a
// DUMB band needs no router, no clock and no data.
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the band's own utility TOKENS are its layout's contract
// here — written OUT below (the ui/Eyebrow RECIPE convention), so a silent
// edit fails HERE. ui/Container's three strings are IMPORTED, never retyped
// (a hand-typed copy would be a second spelling — tests/unit/design-scale and
// gutter-single-spelling hold their one); the floor's one class is
// sections/PriceList's, written whole, which the census allows. What the real
// stylesheet makes of it all — the column, the five-card window, the cards'
// one width and one height, the floor, the opener's size and edge — is
// BlogCarousel.scale.test.tsx's and BlogCarousel.stories.tsx's, measured in
// a real browser.
//
// ── THE CAROUSEL'S OWN SHAPE IS sections/CardCarousel's. This suite never
// reads its geometry's spelling: where it must tell the carousel's window,
// its fixed card and its cards' height apart — which only its stylesheet
// draws — it renders a REFERENCE CardCarousel with the very props the band
// promises (five, loop, the band's fixed card, the tallest card's height)
// and holds the band's root to it, class for class and style for style. So a
// change inside the carousel moves both renders at once, and only a band that
// asks for something else turns red.
//
// ── THE CLOCK RUNS: the carousel moves by itself after its 1.5 s first
// dwell (the product's rhythm — the band passes no clock option). No case
// here waits that long before reading which card is centred, and the one
// that presses the arrows presses a progress dot FIRST — a press stops the
// ring for good (CardCarousel's OPTION 1) — so the ring stands where the
// case put it.

/** The article every card opens today, as the page builds its address. */
const ARTICLE = '/ro/blog/cum-iti-alegi-periuta-de-dinti/';

/** Four posts as the page hands them over, in Romanian with diacritics
 *  (§15.7), every word finished — fixtures, never shipped data. */
const POSTS = [
  {
    slug: 'cum-iti-alegi-periuta-de-dinti',
    href: ARTICLE,
    title: 'Cum îți alegi periuța de dinți',
    summary:
      'Firele moi, un cap mic și un mâner comod: ce să urmărești pe ambalaj.',
    author: 'Dr. Nicu Elena Alina',
    readingTime: '4 min de citit',
    image: {
      src: '/images/hero/lobby.jpg',
      alt: '',
    },
    tags: ['igienă', 'sfaturi'],
  },
  {
    slug: 'ce-este-tartrul',
    href: '/ro/blog/ce-este-tartrul/',
    title: 'Ce este tartrul și de ce se formează',
    summary:
      'Placa bacteriană întărită pe dinți, pe care periajul de acasă nu o mai poate îndepărta.',
    author: 'Dr. Malea (Sabău) Oana Bianca',
    readingTime: '5 min de citit',
    image: {
      src: '/images/hero/treatment-room.jpg',
      alt: '',
    },
    tags: ['prevenție'],
  },
  {
    slug: 'prima-vizita-a-copilului-la-dentist',
    href: '/ro/blog/prima-vizita-a-copilului-la-dentist/',
    title: 'Prima vizită a copilului la dentist',
    summary:
      'Cum îl pregătești acasă și ce se întâmplă în timpul primei consultații.',
    author: 'Dr. Ivașcu-Zugravu Cătălina',
    readingTime: '6 min de citit',
    image: {
      src: '/images/hero/instruments.jpg',
      alt: '',
    },
    tags: [],
  },
  {
    slug: 'sensibilitatea-dentara-la-rece',
    href: '/ro/blog/sensibilitatea-dentara-la-rece/',
    title: 'Sensibilitatea dentară la rece și la cald',
    summary: 'De unde vine durerea scurtă la o înghițitură rece și ce ajută.',
    author: 'Dr. Toma Lucian',
    readingTime: '3 min de citit',
    image: {
      src: '/images/hero/lobby.jpg',
      alt: '',
    },
    tags: ['sfaturi'],
  },
] as const satisfies BlogCarouselProps['posts'];

/** The band's words as the Home page finishes them (home.articles.*,
 *  common.carousel.*, blog.*). */
const EYEBROW = 'Blog';
const TITLE = 'Sfaturi de la medicii noștri';
const LABELS = {
  region: 'Articole din blog',
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Articolul anterior',
  next: 'Articolul următor',
  picker: 'Alege articolul',
} as const;
const SLIDE_LABELS = POSTS.map(
  (_, index) => `Articolul ${index + 1} din ${POSTS.length}`,
);
const TAGS_LABEL = 'Categorii';
const READ_MORE = 'Citește mai mult…';

const PROPS: BlogCarouselProps = {
  eyebrow: EYEBROW,
  title: TITLE,
  labels: LABELS,
  posts: POSTS,
  slideLabels: SLIDE_LABELS,
  tagsLabel: TAGS_LABEL,
  readMore: READ_MORE,
};

// THE RECIPES, written out.
/** The band's outer: the page ground and nothing else — the belt left with
 *  the bleed (the header's THE BAND, THE WIDTH). */
const BAND = ['bg-page'];
/** The rhythm box's own classes — the band-scale strings follow them: a flex
 *  column, the room above and below on the column's steps (48 / 64 / 80) and
 *  the one gap from the opener to the carousel (32 / 40 / 48). */
const RHYTHM_OWN = [
  'flex',
  'flex-col',
  'gap-8',
  'py-12',
  '@lg:gap-10',
  '@lg:py-16',
  '@3xl:gap-12',
  '@3xl:py-20',
];
/** THE FLOOR (the header): the price list's floor class, whole — the box
 *  round the carousel wears it beside the band scale's pixel string. */
const FLOOR = '[--band-floor:0.0625rem]';

/** CARD (the header's THE FIXED SHAPE), as the carousel's root carries it:
 *  the blog list's three-across card at the owner's 1401 window — 1106 less
 *  two 32s, a third — at the owner's 0.65, in the inherited design pixel
 *  (the spacing step over four). BlogCarousel.scale.test.tsx derives the
 *  numbers where they live; here the spelling is the contract. */
const CARD = 'calc(var(--spacing)/4*(1106 - 2*32)/3*0.65)';

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
const tokens = (classes: string): string[] =>
  classes.split(/\s+/).filter(Boolean);

/** The band's source with its PROSE removed — what the source pins run
 *  against: the header names `'use client'`, t() and the hooks the band does
 *  not have. Three passes, full-line comments first (a line comment may hold
 *  a block opener), then blocks, JSX comments included, then the comments
 *  that trail code (PostList.test.tsx's stripper). */
const stripComments = (code: string): string =>
  code
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
const CODE = stripComments(source);

/** The band's boxes, by structure: section → ui/Container → the rhythm box
 *  → the opener and the box round the carousel (THE FLOOR) → the carousel. */
const partsOf = () => {
  const band = screen.getByRole('region', { name: TITLE });
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const opener = rhythm?.firstElementChild;
  const pixel = rhythm?.lastElementChild;
  const carousel = within(band).getByRole('region', { name: LABELS.region });
  if (
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(opener instanceof HTMLElement) ||
    !(pixel instanceof HTMLElement)
  ) {
    throw new Error('BlogCarousel: the band lost a box');
  }
  return { band, column, rhythm, opener, pixel, carousel };
};

/** Every card box of the carousel, in the list's order — the stage's
 *  children, side cards included (they are aria-hidden previews). */
const slidesOf = (carousel: HTMLElement): HTMLElement[] => {
  const stage = carousel.querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) throw new Error('no stage');
  return [...stage.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
};

/** The name an element's `aria-labelledby` resolves to — read by hand: the
 *  side cards are aria-hidden previews, and an accessible-name computation
 *  gives a hidden element no name at all. */
const labelledBy = (element: Element): string =>
  (element.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

/** The card at the centre: the one that is not inert. */
const centreOf = (carousel: HTMLElement): HTMLElement => {
  const centre = slidesOf(carousel).find(
    (slide) => !slide.hasAttribute('inert'),
  );
  if (centre === undefined) throw new Error('no centred card');
  return centre;
};

describe('BlogCarousel — the band', () => {
  it('is a region named by its own <h2>, the eyebrow over it at the start, the page ground under it', () => {
    render(<BlogCarousel {...PROPS} />);
    const { band, opener } = partsOf();
    expect(band.tagName).toBe('SECTION');
    expect(band).toHaveAttribute('aria-labelledby');
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('role');
    const h2 = within(opener).getByRole('heading', { level: 2, name: TITLE });
    expect(band.getAttribute('aria-labelledby')).toBe(h2.id);
    // The eyebrow is the opener's first line, the <h2> after it — and the
    // region's name is the title's text ALONE, never the eyebrow's.
    expect(opener.firstElementChild?.textContent).toBe(EYEBROW);
    expect(opener.lastElementChild).toBe(h2);
    expect(tokensOf(opener)).toContain('items-start');
    expect(tokensOf(band)).toEqual(BAND);
  });

  it('heads the outline with ONE <h2> — the opener’s — and every card’s title an <h3> under it, one per post, in order (THE OUTLINE)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { band, opener, carousel } = partsOf();
    // Side cards are aria-hidden previews: every level is read with `hidden`,
    // so no card's title can hide from the count.
    const h2s = within(band).getAllByRole('heading', {
      level: 2,
      hidden: true,
    });
    expect(h2s).toHaveLength(1);
    expect(opener.contains(h2s[0])).toBe(true);
    expect(h2s[0]).toHaveTextContent(TITLE);
    const h3s = within(band).getAllByRole('heading', {
      level: 3,
      hidden: true,
    });
    expect(h3s.map((heading) => heading.textContent)).toEqual(
      POSTS.map((post) => post.title),
    );
    for (const heading of h3s) {
      expect(heading.tagName).toBe('H3');
      expect(carousel.contains(heading)).toBe(true);
    }
    // Nothing else: the band's whole outline is that <h2> and those <h3>s.
    expect(within(band).getAllByRole('heading', { hidden: true })).toHaveLength(
      1 + POSTS.length,
    );
    // And the outline a screen reader walks — the centred card's alone, the
    // side cards hidden — is one <h2> over one <h3>.
    expect(
      within(band)
        .getAllByRole('heading')
        .map((heading) => heading.tagName),
    ).toEqual(['H2', 'H3']);
  });

  it('wears ui/Container’s recipe: section → the column → the rhythm box, which wears the band’s rhythm and BOTH band-scale strings (THE BAND SCALE, THE OPENER)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { band, column, rhythm, opener, pixel } = partsOf();
    expect(band.children).toHaveLength(1);
    expect(tokensOf(column)).toEqual(tokens(containerClasses));
    expect(column.children).toHaveLength(1);
    expect(tokensOf(rhythm)).toEqual([
      ...RHYTHM_OWN,
      ...tokens(bandColumnClasses),
      ...tokens(bandScaleClasses),
    ]);
    // The opener first, the box round the carousel second — nothing else.
    expect([...rhythm.children]).toEqual([opener, pixel]);
    // THE FLOOR is never the rhythm box's: the opener keeps every Home band's
    // pixel.
    expect(tokensOf(rhythm)).not.toContain(FLOOR);
  });

  it('puts the carousel IN the rhythm box — the column, no bleed — inside ONE box that wears the band scale’s pixel again with the floor beside it (THE WIDTH, THE FLOOR)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { pixel, carousel } = partsOf();
    // The pixel string, imported, then the price list's floor class — and
    // nothing else: no width, no margin, no role, no name.
    expect(tokensOf(pixel)).toEqual([...tokens(bandScaleClasses), FLOOR]);
    expect(pixel.tagName).toBe('DIV');
    expect(pixel.getAttributeNames()).toEqual(['class']);
    expect([...pixel.children]).toEqual([carousel]);
    // No bleed and no placement of the band's own on the carousel: its
    // classes are all the carousel's (the reference case below).
    expect(
      tokensOf(carousel).filter((token) =>
        /vw|^-?mx-|^pointer-fine:/.test(token),
      ),
    ).toEqual([]);
  });

  it('merges a caller’s className LAST on the <section>, hands it the ref, and lets nothing rename the region or unmake it', () => {
    const ref = createRef<HTMLElement>();
    // A hyphenated attribute WRITTEN IN JSX passes TypeScript's excess-
    // property check, and a wider spread can carry a `role`: both must lose.
    const smuggled = { role: 'presentation', 'aria-label': 'Altceva' };
    render(
      <BlogCarousel
        {...PROPS}
        {...(smuggled as object)}
        aria-labelledby="altceva"
        className="mt-4"
        ref={ref}
        data-band="articles"
      />,
    );
    const { band } = partsOf();
    expect(ref.current).toBe(band);
    expect(tokensOf(band)).toEqual([...BAND, 'mt-4']);
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('role');
    expect(band.getAttribute('aria-labelledby')).not.toBe('altceva');
    expect(band).toHaveAttribute('data-band', 'articles');
  });

  it('renders NOTHING for an empty list — no region, no heading, no carousel', () => {
    const { container } = render(
      <BlogCarousel {...PROPS} posts={[]} slideLabels={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('counts no names over an empty list: names left with no card raise no RangeError — the band returns before the carousel could count them (EMPTY RENDERS NOTHING; `slideLabels`’ doc)', () => {
    expect(PROPS.slideLabels.length).toBeGreaterThan(0);
    const { container } = render(<BlogCarousel {...PROPS} posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('BlogCarousel — the carousel', () => {
  it('is the card carousel’s FIVE-CARD window, circular, every card the band’s fixed width and the tallest card’s height — the band’s root held to a reference carousel with exactly those props, class for class, style for style (THE FIXED SHAPE)', () => {
    const { unmount } = render(
      <CardCarousel
        visible={5}
        mode="loop"
        cardWidth={CARD}
        cardHeight="tallest"
        labels={LABELS}
        slideLabels={SLIDE_LABELS}
        slides={POSTS.map((post) => (
          <p key={post.slug}>{post.title}</p>
        ))}
      />,
    );
    const reference = screen.getByRole('region', { name: LABELS.region });
    const referenceClasses = tokensOf(reference);
    const referenceStyle = reference.getAttribute('style');
    const referenceSlides = slidesOf(reference).map(tokensOf);
    unmount();

    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    // Its own classes alone — the fixed card's geometry among them — and its
    // own style: the window's numbers and the band's card, `--card-fixed`.
    expect(tokensOf(carousel)).toEqual(referenceClasses);
    expect(carousel.getAttribute('style')).toBe(referenceStyle);
    expect(carousel.style.getPropertyValue('--card-fixed')).toBe(CARD);
    expect(carousel).toHaveAttribute('aria-roledescription', LABELS.role);
    // Every card's box the reference's — stretched to the row, the tallest
    // card's height (CardCarousel's THE CARDS' HEIGHT) — card for card.
    expect(slidesOf(carousel).map(tokensOf)).toEqual(referenceSlides);
  });

  it('runs in a LOOP: from the first card, previous goes round to the last', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    const picker = within(carousel).getByRole('group', { name: LABELS.picker });
    // A dot first: the ring goes to the first card and stays (OPTION 1).
    fireEvent.click(
      within(picker).getByRole('button', { name: SLIDE_LABELS[0] }),
    );
    expect(centreOf(carousel)).toHaveAttribute('aria-label', SLIDE_LABELS[0]);
    const previous = within(carousel).getByRole('button', {
      name: LABELS.previous,
    });
    expect(previous).toBeEnabled();
    fireEvent.click(previous);
    expect(centreOf(carousel)).toHaveAttribute(
      'aria-label',
      SLIDE_LABELS.at(-1),
    );
  });

  it('hands the carousel the page’s words: the arrows, the progress dots’ group, one dot per card named as its card, one current', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    expect(
      within(carousel).getByRole('button', { name: LABELS.previous }),
    ).toBeInTheDocument();
    expect(
      within(carousel).getByRole('button', { name: LABELS.next }),
    ).toBeInTheDocument();
    const picker = within(carousel).getByRole('group', { name: LABELS.picker });
    const dots = within(picker).getAllByRole('button');
    expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual(
      SLIDE_LABELS,
    );
    expect(
      dots.filter((dot) => dot.getAttribute('aria-current') === 'true'),
    ).toHaveLength(1);
    // Every card a group named as its dot, in the list's order.
    expect(
      slidesOf(carousel).map((slide) => [
        slide.getAttribute('role'),
        slide.getAttribute('aria-roledescription'),
        slide.getAttribute('aria-label'),
      ]),
    ).toEqual(SLIDE_LABELS.map((label) => ['group', LABELS.slideRole, label]));
  });

  it('throws the carousel’s RangeError when the names and the cards differ in count', () => {
    expect(() =>
      render(<BlogCarousel {...PROPS} slideLabels={SLIDE_LABELS.slice(1)} />),
    ).toThrow(RangeError);
  });
});

describe('BlogCarousel — the cards', () => {
  it('prints ONE PostCard per post, in order: an article named by its title, its ONE link the post’s article, its words, the page’s tag-list name and read-more', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    const slides = slidesOf(carousel);
    expect(slides).toHaveLength(POSTS.length);
    for (const [index, post] of POSTS.entries()) {
      const slide = slides[index];
      // Side cards are aria-hidden previews: queried with `hidden`, their
      // names resolved by hand (`labelledBy`).
      const article = within(slide).getByRole('article', { hidden: true });
      expect(labelledBy(article)).toBe(post.title);
      const links = within(article).getAllByRole('link', { hidden: true });
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', post.href);
      expect(labelledBy(links[0])).toBe(`${READ_MORE} ${post.title}`);
      expect(article).toHaveTextContent(post.summary);
      expect(article).toHaveTextContent(post.author);
      expect(article).toHaveTextContent(post.readingTime);
      const lists = within(article).queryAllByRole('list', { hidden: true });
      if (post.tags.length === 0) {
        expect(lists).toHaveLength(0);
      } else {
        expect(lists).toHaveLength(1);
        expect(lists[0]).toHaveAttribute('aria-label', TAGS_LABEL);
        expect(
          within(lists[0])
            .getAllByRole('listitem', { hidden: true })
            .map((item) => item.textContent),
        ).toEqual(post.tags);
      }
    }
  });

  it('hands each card its props BY NAME — no slug, no stray field on an <article> — and never preloads a picture (the band is below the first screen)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    for (const article of within(carousel).getAllByRole('article', {
      hidden: true,
    })) {
      // The name, the classes and the miniature's one number (PostCard's THE
      // MINIATURE puts its share inline) — nothing else.
      expect(article.getAttributeNames().toSorted()).toEqual(
        ['aria-labelledby', 'class', 'style'].toSorted(),
      );
    }
    // Synchronous — the optimizer swaps a 404'd variant on a later task.
    for (const picture of carousel.querySelectorAll('img')) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });

  it('gives every card the band’s OWN picture hint — one hint for every card, never the blog list’s default (THE `sizes`, DERIVED)', () => {
    // The default, read off a card that names none: the hint PostCard
    // derives for the blog list's grid.
    const [first] = POSTS;
    const { container, unmount } = render(
      <PostCard
        href={first.href}
        title={first.title}
        summary={first.summary}
        author={first.author}
        readingTime={first.readingTime}
        image={first.image}
        tags={first.tags}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE}
      />,
    );
    const listHint = container.querySelector('img')?.getAttribute('sizes');
    unmount();
    expect(listHint).toBeTruthy();

    render(<BlogCarousel {...PROPS} />);
    const hints = [...partsOf().carousel.querySelectorAll('img')].map(
      (picture) => picture.getAttribute('sizes'),
    );
    expect(hints).toHaveLength(POSTS.length);
    expect(new Set(hints).size).toBe(1);
    expect(hints[0]).toBeTruthy();
    expect(hints[0]).not.toBe(listHint);
  });

  it('draws EVERY card as the owner’s 65 % miniature, filling the height of its box — a reference card asked for exactly that, class for class and style for style (THE MINIATURE, THE FIXED SHAPE)', () => {
    // The card the band promises: the share, the box's height, its level and
    // its hint — read off a PostCard asked for them, so a change inside the
    // card moves both renders at once.
    const [first] = POSTS;
    const { container, unmount } = render(
      <PostCard
        href={first.href}
        title={first.title}
        summary={first.summary}
        author={first.author}
        readingTime={first.readingTime}
        image={first.image}
        tags={first.tags}
        tagsLabel={TAGS_LABEL}
        readMore={READ_MORE}
        miniature={0.65}
        headingLevel={3}
        className="h-full"
      />,
    );
    const reference = container.querySelector('article');
    if (reference === null) throw new Error('no reference card');
    const referenceClasses = tokensOf(reference);
    const referenceStyle = reference.getAttribute('style');
    unmount();
    expect(referenceClasses).toContain('h-full');
    expect(referenceStyle).toContain('--miniature: 0.65');

    render(<BlogCarousel {...PROPS} />);
    const articles = within(partsOf().carousel).getAllByRole('article', {
      hidden: true,
    });
    expect(articles).toHaveLength(POSTS.length);
    for (const article of articles) {
      expect(tokensOf(article)).toEqual(referenceClasses);
      expect(article.getAttribute('style')).toBe(referenceStyle);
    }
  });

  it('puts exactly ONE card’s link in the Tab order — the centred one’s; the side cards are inert previews', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    const centre = centreOf(carousel);
    expect(within(carousel).getAllByRole('link')).toEqual(
      within(centre).getAllByRole('link'),
    );
    for (const slide of slidesOf(carousel)) {
      if (slide === centre) continue;
      expect(slide).toHaveAttribute('inert');
      expect(slide).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('BlogCarousel — the source (A DUMB BAND)', () => {
  it('ships NO client directive, no handler, no state and no translation — the carousel is the island, not this file (§16)', () => {
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b|\bt\(/);
    expect(CODE).not.toMatch(/next-intl/);
  });

  it('calls exactly ONE hook, once, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(']);
  });

  it('imports react, CardCarousel, PostCard, PostList’s card TYPE, SectionHeading, Container and lib/cx — no data, no locale, no message file', () => {
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();
    expect(specifiers).toEqual(
      [
        '@/components/sections/CardCarousel/CardCarousel',
        '@/components/sections/PostCard/PostCard',
        '@/components/sections/PostList/PostList',
        '@/components/sections/SectionHeading/SectionHeading',
        '@/components/ui/Container/Container',
        '@/lib/cx/cx',
        'react',
      ].toSorted(),
    );
    // PostList's module contributes a TYPE alone — never its band.
    expect(CODE).toMatch(
      /^import type \{ PostListItem \} from '@\/components\/sections\/PostList\/PostList';$/m,
    );
    expect(CODE).not.toMatch(/@\/lib\/(?!cx\/)/);
    expect(CODE).not.toMatch(/@\/i18n\/|@\/messages\/|@\/content\//);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('asks the carousel for exactly the owner’s window — five, circular, the band’s fixed card, the tallest card’s height — and each card for the miniature, its box’s height, an <h3> title and the band’s own picture hint, keyed by its slug', () => {
    const tag =
      /<CardCarousel\b([\s\S]*?)\/>\s*\n\s*<\/div>/.exec(CODE)?.[1] ?? '';
    expect(tag).toMatch(/\bvisible=\{5\}/);
    expect(tag).toMatch(/\bmode="loop"/);
    expect(tag).toMatch(/\bcardWidth=\{CARD\}/);
    expect(tag).toMatch(/\bcardHeight="tallest"/);
    // A fixed card is never the column's share: no cap — and no placement
    // of the band's own on the carousel (the attributes before its slides).
    const own = tag.slice(0, tag.indexOf('slides='));
    expect(own).toMatch(/\bvisible=\{5\}/);
    expect(own).not.toMatch(/\bcardCap\b|\bclassName=|\bstyle=/);
    const card = /<PostCard\b([\s\S]*?)\/>/.exec(tag)?.[1] ?? '';
    expect(card).toMatch(/\bkey=\{post\.slug\}/);
    expect(card).toMatch(/\bminiature=\{MINIATURE\}/);
    expect(card).toMatch(/\bclassName="h-full"/);
    expect(card).toMatch(/\bheadingLevel=\{3\}/);
    expect(card).toMatch(/\bsizes=\{SIZES\}/);
    // Never a preload: the band is below the first screen.
    expect(tag).not.toMatch(/\bpreload\b/);
    // Every card prop by name — never an item spread.
    expect(tag).not.toMatch(/\{\.\.\.post\}/);
  });

  it('spells the owner’s 65 % ONCE and reads it twice — the slot (CARD) and every card (`miniature`) — so the two can never disagree (THE MINIATURE)', () => {
    expect(CODE).toMatch(/^const MINIATURE = 0\.65;$/m);
    expect(CODE.match(/\bMINIATURE\b/g)).toHaveLength(3);
    expect(CODE).toMatch(/\*\$\{MINIATURE\}\)`;$/m);
    // …and the number itself nowhere else in the code.
    expect(CODE.match(/\b0\.65\b/g)).toHaveLength(1);
  });

  it('takes THE BAND SCALE from ui/Container by IMPORT and spells none of the regime itself — but THE FLOOR, once', () => {
    const named =
      /^import \{([^}]*)\} from '@\/components\/ui\/Container\/Container';$/m
        .exec(CODE)?.[1]
        ?.split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .toSorted();
    expect(named).toEqual(
      ['Container', 'bandColumnClasses', 'bandScaleClasses'].toSorted(),
    );
    expect(CODE).not.toMatch(/design-scale|--scale-px|--band-zoom/);
    expect(CODE).not.toMatch(/scalable:/);
    // The floor: the price list's one class, once (the census holds its
    // setters to two files and their value to one).
    expect(CODE.split('--band-floor')).toHaveLength(2);
    expect(CODE).toContain(`'${FLOOR}'`);
    // The band scale's REFERENCE appears once: the list's column CARD is
    // derived from (THE FIXED SHAPE — BlogCarousel.scale.test.tsx holds it
    // to ui/Container's own).
    expect(CODE.match(/\b1106\b/g)).toHaveLength(1);
  });
});

describe('BlogCarousel — the props (types)', () => {
  it('takes the populator’s shape: the opener’s two strings, the carousel’s words, the cards, their names and the cards’ two words', () => {
    expectTypeOf<BlogCarouselProps['eyebrow']>().toEqualTypeOf<string>();
    expectTypeOf<BlogCarouselProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<BlogCarouselProps['tagsLabel']>().toEqualTypeOf<string>();
    expectTypeOf<BlogCarouselProps['readMore']>().toEqualTypeOf<string>();
    expectTypeOf<BlogCarouselProps['slideLabels']>().toEqualTypeOf<
      readonly string[]
    >();
    expectTypeOf<BlogCarouselProps['labels']>().toEqualTypeOf<
      Parameters<typeof CardCarousel>[0]['labels']
    >();
  });

  it('refuses the naming attributes, `role` and children (THE LANDMARKS)', () => {
    expectTypeOf<BlogCarouselProps>().not.toHaveProperty('aria-label');
    expectTypeOf<BlogCarouselProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<BlogCarouselProps>().not.toHaveProperty('role');
    expectTypeOf<BlogCarouselProps>().not.toHaveProperty('children');
  });
});
