import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CARD_CAROUSEL_FLAT_QUERY,
  CardCarousel,
} from '@/components/sections/CardCarousel/CardCarousel';
import carouselSource from '@/components/sections/CardCarousel/CardCarousel.tsx?raw';
import statsSource from '@/components/sections/DoctorStats/DoctorStats.tsx?raw';
import { PostCard } from '@/components/sections/PostCard/PostCard';
import postCardSource from '@/components/sections/PostCard/PostCard.tsx?raw';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import globals from '@/styles/globals.css?raw';
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
// gutter-single-spelling hold their one). THE FLAT ROW's nine classes are
// ASSEMBLED here from their parts — sections/CardCarousel's query,
// sections/DoctorStats' tile zoom, this band's own share, the clamp's four
// variables by name — and never written whole: two of them name a custom
// property the census lets no scanned file spell but as its wearer's class
// (THE D-LIT RULE), and Tailwind reads tests too, so a bracketed utility
// spelled here that the band does not wear — a clamp variable's setter
// without the row's query, say — would ship as a rule nobody wears; the
// floor the band no longer sets is named the same way, from parts, in the
// pin that it sets none (THE FLOOR, REMOVED). What the real stylesheet makes
// of it all — the column, the five-card window, the row, the cards' one
// width and one height, the carousel's own pixel, the row's pixel, the
// opener's size and edge — is BlogCarousel.scale.test.tsx's and
// BlogCarousel.stories.tsx's, measured in a real browser.
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
/** The band's outer: THE BELT under the row's bleed — sections/
 *  ReviewsCarousel's spelling, its Safari ≤ 15 twin beside it — and the page
 *  ground (the header's THE BAND, THE FLAT ROW). */
const BAND = [
  'overflow-x-clip',
  'supports-[not_(overflow:clip)]:overflow-x-hidden',
  'bg-page',
];
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

/** CARD (the header's THE FIXED SHAPE), as the carousel's root carries it:
 *  the blog list's three-across card at the owner's 1401 window — 1106 less
 *  two 32s, a third — at the owner's 0.65, in the inherited design pixel
 *  (the spacing step over four). BlogCarousel.scale.test.tsx derives the
 *  numbers where they live; here the spelling is the contract. */
const CARD = 'calc(var(--spacing)/4*(1106 - 2*32)/3*0.65)';

// THE FLAT ROW's classes (the header's THE FLAT ROW), ASSEMBLED from their
// parts (the header above says why): the query, the numbers, the names.

/** sections/CardCarousel's query as Tailwind's arbitrary media variant, its
 *  spaces underscores — read off the carousel's own constant. */
const ROW = `[@media${CARD_CAROUSEL_FLAT_QUERY.replaceAll(' ', '_')}]:`;

/** The two custom properties the row's classes set, by name — and the floor
 *  variable the band sets nowhere since 2026-10-26 (the header's THE FLOOR,
 *  REMOVED), named for the pin that it sets none. */
const PIXEL_NAME = ['--scale', 'px'].join('-');
const ZOOM_NAME = ['--band', 'zoom'].join('-');
const FLOOR_NAME = ['--band', 'floor'].join('-');

/** A number a pattern captures from a source, or a failure naming it. */
const readNumber = (text: string, pattern: RegExp, name: string): number => {
  const found = pattern.exec(text)?.[1];
  if (found === undefined) throw new Error(`BlogCarousel: no ${name} found`);
  return Number(found);
};

/** THE MINIATURE, this band's share — read off its source. */
const SHARE = readNumber(source, /^const MINIATURE = ([\d.]+);$/m, 'share');

/** sections/DoctorStats' TILE_ZOOM — the tile sentence's multiple of the
 *  band's pixel, read off its source (its class assembled from parts). */
const TILE_ZOOM = readNumber(
  statsSource,
  new RegExp(
    String.raw`const TILE_ZOOM = '\[` + ZOOM_NAME + String.raw`:([\d.]+)\]';`,
  ),
  'tile zoom',
);

/** The theme's pixels in a rem — `--text-base`'s multiplier in globals.css's
 *  design scale (text-base is 1rem, sixteen of the theme's pixels). */
const TEXT_BASE = readNumber(
  globals,
  /--text-base: calc\(var\(--scale-px\) \* (\d+)\);/,
  'text-base',
);

/** THE ROW'S PIXEL (the header): the theme's pixel over the share, and the
 *  remap — on the box round the carousel's own pixel. */
const ROW_PIXEL = [
  `${ROW}[${PIXEL_NAME}:calc(1rem/${TEXT_BASE}/${SHARE})]`,
  `${ROW}design-scale`,
];

/** THE ROW'S ZOOM (the header): the tile sentence's zoom over the share —
 *  beside the band scale's pixel on the box round the carousel. */
const ROW_ZOOM = `${ROW}[${ZOOM_NAME}:calc(${TILE_ZOOM}/${SHARE})]`;

/** THE BLEED (the header): the carousel's root across the screen, half a rem
 *  in from each edge — the one class the band hands the carousel. */
const ROW_BLEED = `${ROW}${['mx', '[calc(50%_-_50vw_+_0.5rem)]'].join('-')}`;

/** THE CLAMP IN THE ROW (the header): the four variables sections/PostCard's
 *  THE CLAMP reads, by name — each a `var()` in PostCard's own source, with
 *  today's value behind it (held below). */
const CLAMP_NAMES = {
  box: '--clamp-box',
  clip: '--clamp-clip',
  title: '--title-lines',
  summary: '--summary-lines',
} as const;

/** The two engines' clips (the header's THE CLIP, NOT A SCROLLER): `clip`
 *  where the engine has it, `hidden` where it has not — two conditions, each
 *  engine meeting ONE, so no rule order decides. */
const CLIP_WHERE = {
  clip: 'supports-[overflow:clip]:',
  hidden: 'supports-[not_(overflow:clip)]:',
} as const;

/** …and what the row's box sets them to, behind the row's query: the
 *  engine's line-clamp box, the clip in its two engines, two lines of each
 *  title and summary. */
const ROW_CLAMP = [
  `${ROW}[${CLAMP_NAMES.box}:-webkit-box]`,
  `${ROW}${CLIP_WHERE.clip}[${CLAMP_NAMES.clip}:clip]`,
  `${ROW}${CLIP_WHERE.hidden}[${CLAMP_NAMES.clip}:hidden]`,
  `${ROW}[${CLAMP_NAMES.title}:2]`,
  `${ROW}[${CLAMP_NAMES.summary}:2]`,
];

/** A card's title — its <h3> — and its summary, the muted paragraph after
 *  the author line among the words under the title. */
const titleOf = (article: Element): HTMLElement => {
  const title = article.querySelector('h3');
  if (title === null) throw new Error('BlogCarousel: a card has no title');
  return title;
};
const summaryOf = (article: Element): HTMLElement => {
  const parts = [...(titleOf(article).parentElement?.children ?? [])];
  const summary = parts.find(
    (part, index) => index > 1 && part.tagName === 'P',
  );
  if (!(summary instanceof HTMLElement)) {
    throw new Error('BlogCarousel: a card has no summary');
  }
  return summary;
};

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
 *  → the opener and the row's box (THE ROW'S PIXEL, THE CLAMP IN THE ROW) →
 *  the box round the carousel (THE CAROUSEL'S OWN PIXEL, THE ROW'S ZOOM) →
 *  the carousel. */
const partsOf = () => {
  const band = screen.getByRole('region', { name: TITLE });
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const opener = rhythm?.firstElementChild;
  const row = rhythm?.lastElementChild;
  const pixel = row?.firstElementChild;
  const carousel = within(band).getByRole('region', { name: LABELS.region });
  if (
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(opener instanceof HTMLElement) ||
    !(row instanceof HTMLElement) ||
    !(pixel instanceof HTMLElement)
  ) {
    throw new Error('BlogCarousel: the band lost a box');
  }
  return { band, column, rhythm, opener, row, pixel, carousel };
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
    // The phone's carousel — one card live (the row's reach is measured
    // against a stylesheet this project never loads).
    expect(window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).matches).toBe(false);
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
    const { band, column, rhythm, opener, row } = partsOf();
    expect(band.children).toHaveLength(1);
    expect(tokensOf(column)).toEqual(tokens(containerClasses));
    expect(column.children).toHaveLength(1);
    expect(tokensOf(rhythm)).toEqual([
      ...RHYTHM_OWN,
      ...tokens(bandColumnClasses),
      ...tokens(bandScaleClasses),
    ]);
    // The opener first, the row's box second — nothing else.
    expect([...rhythm.children]).toEqual([opener, row]);
    // The row's pixel and its zoom are never the rhythm box's: the opener
    // keeps every Home band's pixel.
    expect(tokensOf(rhythm).filter((token) => token.startsWith(ROW))).toEqual(
      [],
    );
  });

  it('puts the carousel inside TWO boxes — the row’s, which declares the theme’s pixel over the share and the clamp’s four variables from the row’s query up, and the one round the carousel, which wears the band scale’s pixel again and, from the query up, the row’s zoom (THE ROW’S PIXEL, THE CLAMP IN THE ROW, THE CAROUSEL’S OWN PIXEL, THE ROW’S ZOOM)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { row, pixel, carousel } = partsOf();
    // The row's box: its pixel and the remap, then the clamp's four
    // variables, all behind the query — nothing else: no width, no margin,
    // no role, no name.
    expect(tokensOf(row)).toEqual([...ROW_PIXEL, ...ROW_CLAMP]);
    expect(row.tagName).toBe('DIV');
    expect(row.getAttributeNames()).toEqual(['class']);
    expect([...row.children]).toEqual([pixel]);
    // The box round the carousel: the pixel string, imported, then the row's
    // zoom — and nothing else, no floor (THE FLOOR, REMOVED).
    expect(tokensOf(pixel)).toEqual([...tokens(bandScaleClasses), ROW_ZOOM]);
    expect(pixel.tagName).toBe('DIV');
    expect(pixel.getAttributeNames()).toEqual(['class']);
    expect([...pixel.children]).toEqual([carousel]);
  });

  it('sets NO floor at all — no class of the band at any depth SETS the floor variable, no inline style sets it, and its code never spells it (THE FLOOR, REMOVED)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { band } = partsOf();
    const elements = [band, ...band.querySelectorAll('*')];
    // Never vacuous: the band's own boxes and every card under them.
    expect(elements.length).toBeGreaterThan(50);
    // A SETTER is a class whose own property is the variable, under any
    // chain of variants; the band scale's pixel class READS it — its
    // `var(…, 0px)` — and is no setter, which the census also says.
    const setters = elements.flatMap((element) =>
      tokensOf(element).filter((token) => token.includes(`[${FLOOR_NAME}:`)),
    );
    expect(setters).toEqual([]);
    // …and the reads ARE seen: the band scale's pixel, on the rhythm box and
    // on the box round the carousel — so the walk has teeth.
    const readsPerBox = tokens(bandScaleClasses).filter((token) =>
      token.includes(FLOOR_NAME),
    ).length;
    expect(readsPerBox).toBeGreaterThan(0);
    expect(
      elements.flatMap((element) =>
        tokensOf(element).filter((token) => token.includes(FLOOR_NAME)),
      ),
    ).toHaveLength(2 * readsPerBox);
    for (const element of elements) {
      if (!(element instanceof HTMLElement)) continue;
      expect(element.style.getPropertyValue(FLOOR_NAME)).toBe('');
    }
    expect(CODE).not.toContain(FLOOR_NAME);
  });

  it('sets the clamp’s four variables on the row’s box ALONE and only behind the row’s query — the names sections/PostCard’s clamp reads, two lines of each, the clip `clip` where the engine has it and `hidden` where it has not — so below the query no card is clamped (THE CLAMP IN THE ROW, THE CLIP, NOT A SCROLLER)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { band, row } = partsOf();
    // Every SETTER of a clamp variable anywhere in the band — a class whose
    // property IS the variable, under a variant or not. PostCard's own
    // classes READ them (`var(name, today's value)`) and set none.
    const setters = [band, ...band.querySelectorAll('*')].flatMap((element) =>
      tokensOf(element)
        .filter((token) =>
          Object.values(CLAMP_NAMES).some((name) =>
            token.includes(`[${name}:`),
          ),
        )
        .map((token) => ({ element, token })),
    );
    // Only under the query — no bare setter, which would clamp the phone…
    for (const { token } of setters) {
      expect(token.startsWith(ROW), token).toBe(true);
    }
    // …exactly the five — the clip in two, behind conditions no engine meets
    // both of — once each, on the row's box and nowhere else, and each
    // spelled ONCE in the band's code, whole (Tailwind reads class names
    // from source text).
    expect(setters.map(({ token }) => token)).toEqual(ROW_CLAMP);
    expect(
      setters
        .map(({ token }) => token)
        .filter((token) => token.includes(`[${CLAMP_NAMES.clip}:`))
        .map((token) => token.slice(ROW.length)),
    ).toEqual([
      `${CLIP_WHERE.clip}[${CLAMP_NAMES.clip}:clip]`,
      `${CLIP_WHERE.hidden}[${CLAMP_NAMES.clip}:hidden]`,
    ]);
    for (const { element } of setters) expect(element).toBe(row);
    const code = CODE.replace(/\s+/g, ' ');
    for (const token of ROW_CLAMP) {
      expect(code.split(token).length - 1, token).toBe(1);
    }
    // The names are the ones PostCard's clamp reads — each a `var()` with
    // today's value behind it in its source — so a renamed variable there
    // fails HERE instead of leaving the row unclamped.
    for (const name of Object.values(CLAMP_NAMES)) {
      expect(postCardSource, name).toContain(`var(${name},`);
    }
  });

  it('bleeds the carousel to the screen from the row’s query up — the ONE class the band hands it, behind the query, last — and nothing below it (THE BLEED, THE WIDTH)', () => {
    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    const placed = tokensOf(carousel).filter((token) =>
      /vw|-?mx-|pointer-fine:/.test(token),
    );
    expect(placed).toEqual([ROW_BLEED]);
    expect(tokensOf(carousel).at(-1)).toBe(ROW_BLEED);
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
  it('is the card carousel’s FIVE-CARD window on a phone and its FLAT ROW from a tablet up, circular, every card the band’s fixed width and the tallest card’s height — the band’s root held to a reference carousel with exactly those props, the bleed its className, class for class, style for style (THE FIXED SHAPE, THE FLAT ROW)', () => {
    const { unmount } = render(
      <CardCarousel
        visible={5}
        mode="loop"
        cardWidth={CARD}
        cardHeight="tallest"
        flatFrom="tablet"
        labels={LABELS}
        slideLabels={SLIDE_LABELS}
        className={ROW_BLEED}
        slides={POSTS.map((post) => (
          <p key={post.slug}>{post.title}</p>
        ))}
      />,
    );
    const reference = screen.getByRole('region', { name: LABELS.region });
    const referenceClasses = tokensOf(reference);
    const referenceStyle = reference.getAttribute('style');
    const referenceSlides = slidesOf(reference).map(tokensOf);
    const referenceSlideStyles = slidesOf(reference).map((slide) =>
      slide.getAttribute('style'),
    );
    unmount();

    render(<BlogCarousel {...PROPS} />);
    const { carousel } = partsOf();
    // Its own classes alone — the fixed card's geometry and the row's among
    // them — the bleed last, and its own style: the window's numbers and the
    // band's card, `--card-fixed`.
    expect(tokensOf(carousel)).toEqual(referenceClasses);
    expect(carousel.getAttribute('style')).toBe(referenceStyle);
    expect(carousel.style.getPropertyValue('--card-fixed')).toBe(CARD);
    expect(carousel).toHaveAttribute('aria-roledescription', LABELS.role);
    // Every card's box the reference's — stretched to the row, the tallest
    // card's height (CardCarousel's THE CARDS' HEIGHT), the row's pose and
    // hover beside the line's (its THE FLAT ROW) — card for card.
    expect(slidesOf(carousel).map(tokensOf)).toEqual(referenceSlides);
    expect(
      slidesOf(carousel).map((slide) => slide.getAttribute('style')),
    ).toEqual(referenceSlideStyles);
    // The row's pose rides every card: the carousel may lie flat.
    for (const slide of slidesOf(carousel)) {
      expect(slide.style.getPropertyValue('--fsc')).not.toBe('');
    }
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

  it('draws EVERY card as the owner’s 65 % miniature, filling the height of its box, its title and summary clampable — a reference card asked for exactly that, class for class and style for style (THE MINIATURE, THE FIXED SHAPE, THE CLAMP IN THE ROW)', () => {
    // The card the band promises: the share, the box's height, the clamp its
    // page may switch on, its level and its hint — read off a PostCard asked
    // for them, so a change inside the card moves both renders at once.
    const [first] = POSTS;
    const referenceCard = (clampable: boolean) =>
      render(
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
          jump={false}
          clampable={clampable}
          headingLevel={3}
          className="h-full"
        />,
      );
    const { container, unmount } = referenceCard(true);
    const reference = container.querySelector('article');
    if (reference === null) throw new Error('no reference card');
    const referenceClasses = tokensOf(reference);
    const referenceStyle = reference.getAttribute('style');
    const referenceTitle = tokensOf(titleOf(reference));
    const referenceSummary = tokensOf(summaryOf(reference));
    unmount();
    expect(referenceClasses).toContain('h-full');
    expect(referenceStyle).toContain('--miniature: 0.65');
    // …and a card that never grows on a hover: the carousel grows its slot
    // (CardCarousel's THE HOVER), so the jump's own scale is nowhere on it.
    expect(referenceClasses.filter((token) => token.includes('scale'))).toEqual(
      [],
    );
    // …whose title and summary wear THE CLAMP — never vacuous: the same card
    // unclampable wears fewer classes on both, every one of them among the
    // clampable card's, and the same article.
    const plain = referenceCard(false);
    const plainArticle = plain.container.querySelector('article');
    if (plainArticle === null) throw new Error('no plain card');
    expect(tokensOf(plainArticle)).toEqual(referenceClasses);
    for (const [clamped, unclamped] of [
      [referenceTitle, tokensOf(titleOf(plainArticle))],
      [referenceSummary, tokensOf(summaryOf(plainArticle))],
    ] as const) {
      expect(unclamped.length).toBeLessThan(clamped.length);
      for (const token of unclamped) expect(clamped).toContain(token);
    }
    plain.unmount();

    render(<BlogCarousel {...PROPS} />);
    const articles = within(partsOf().carousel).getAllByRole('article', {
      hidden: true,
    });
    expect(articles).toHaveLength(POSTS.length);
    for (const article of articles) {
      expect(tokensOf(article)).toEqual(referenceClasses);
      expect(article.getAttribute('style')).toBe(referenceStyle);
      expect(tokensOf(titleOf(article))).toEqual(referenceTitle);
      expect(tokensOf(summaryOf(article))).toEqual(referenceSummary);
    }
  });

  it('puts exactly ONE card’s link in the Tab order on a phone — the centred one’s; the side cards are inert previews (the row’s live cards are measured against the real stylesheet: BlogCarousel.scale.test.tsx)', () => {
    expect(window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).matches).toBe(false);
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

  it('asks the carousel for exactly the owner’s window — five, circular, the band’s fixed card, the tallest card’s height, FLAT from a tablet up, the bleed its one placement — and each card for the miniature, no jump of its own, the clamp the row switches on, its box’s height, an <h3> title and the band’s own picture hint, keyed by its slug', () => {
    const tag =
      /<CardCarousel\b([\s\S]*?)\/>\s*\n\s*<\/div>/.exec(CODE)?.[1] ?? '';
    expect(tag).toMatch(/\bvisible=\{5\}/);
    expect(tag).toMatch(/\bmode="loop"/);
    expect(tag).toMatch(/\bcardWidth=\{CARD\}/);
    expect(tag).toMatch(/\bcardHeight="tallest"/);
    // THE FLAT ROW, the literal step — and THE BLEED, the one placement.
    expect(tag).toMatch(/\bflatFrom="tablet"/);
    // A fixed card is never the column's share: no cap — and no placement of
    // the band's own on the carousel but the bleed (the attributes before
    // its slides).
    const own = tag.slice(0, tag.indexOf('slides='));
    expect(own).toMatch(/\bvisible=\{5\}/);
    expect(own).not.toMatch(/\bcardCap\b|\bstyle=/);
    expect(own.match(/\bclassName=/g)).toHaveLength(1);
    expect(own).toMatch(/\bclassName=\{ROW_BLEED\}/);
    const card = /<PostCard\b([\s\S]*?)\/>/.exec(tag)?.[1] ?? '';
    expect(card).toMatch(/\bkey=\{post\.slug\}/);
    expect(card).toMatch(/\bminiature=\{MINIATURE\}/);
    // The card never grows on a hover — the carousel grows its slot
    // (CardCarousel's THE HOVER): the literal `false`, never a variable.
    expect(card).toMatch(/\bjump=\{false\}/);
    // Every card clampable — the bare flag, the house's `scaled` shape,
    // never a value: the row's box switches the clamp on and nothing below
    // its query does (THE CLAMP IN THE ROW).
    expect(card).toMatch(/^\s*clampable$/m);
    expect(card).not.toMatch(/\bclampable=/);
    expect(card).toMatch(/\bclassName="h-full"/);
    expect(card).toMatch(/\bheadingLevel=\{3\}/);
    expect(card).toMatch(/\bsizes=\{SIZES\}/);
    // Never a preload: the band is below the first screen.
    expect(tag).not.toMatch(/\bpreload\b/);
    // Every card prop by name — never an item spread.
    expect(tag).not.toMatch(/\{\.\.\.post\}/);
  });

  it('spells the owner’s 65 % ONCE as a number the code reads — the slot (CARD) and every card (`miniature`) — and twice more inside the row’s two classes, which must name the same share (THE MINIATURE, THE TEXT RULE)', () => {
    expect(CODE).toMatch(/^const MINIATURE = 0\.65;$/m);
    expect(CODE.match(/\bMINIATURE\b/g)).toHaveLength(3);
    expect(CODE).toMatch(/\*\$\{MINIATURE\}\)`;$/m);
    // …and the number itself nowhere else in the code but the two row
    // classes, whose literal strings Tailwind must read whole: the row's
    // pixel and its zoom — each the same share, pinned below.
    expect(CODE.match(/\b0\.65\b/g)).toHaveLength(3);
    expect(SHARE).toBe(0.65);
  });

  it('spells the row’s numbers as their owners’: the theme’s pixel over THE MINIATURE — `1rem / 16 / share`, 16 the theme pixels of text-base — and the tile sentence’s zoom over it — sections/DoctorStats’ TILE_ZOOM / share (THE TEXT RULE)', () => {
    expect(TEXT_BASE).toBe(16);
    expect(TILE_ZOOM).toBe(9 / 8);
    // The two classes, assembled from those owners' numbers, are the ones the
    // band ships — in its code once each.
    const code = CODE.replace(/\s+/g, ' ');
    for (const token of [...ROW_PIXEL, ROW_ZOOM, ROW_BLEED]) {
      expect(code.split(token).length - 1, token).toBe(1);
    }
  });

  it('spells THE FLAT ROW’s query ONCE — sections/CardCarousel’s CARD_CAROUSEL_FLAT_QUERY, its spaces as Tailwind’s underscores — on every class that draws the row (THE QUERY)', () => {
    // The carousel's constant, read where it lives (a value exported from a
    // 'use client' module reaches this server band as a client reference,
    // so the band spells it itself): its source and its export agree.
    const constant =
      /export const CARD_CAROUSEL_FLAT_QUERY =\s*'([^']*)';/.exec(
        carouselSource,
      )?.[1];
    expect(constant).toBe(CARD_CAROUSEL_FLAT_QUERY);
    const spellings = [...CODE.matchAll(/\[@media([^\]]*)\]:/g)].map(
      (match) => match[1],
    );
    // Seven on the row's box — its pixel, its remap and the clamp's five, its
    // clip one per engine — one on the box round the carousel, its zoom, and
    // one bleed.
    expect(spellings).toHaveLength(9);
    for (const spelling of spellings) {
      expect(spelling.replaceAll('_', ' ')).toBe(constant);
    }
  });

  it('takes THE BAND SCALE from ui/Container by IMPORT and spells none of its regime itself — the row’s pixel, its remap and its zoom alone, and no floor (THE CAROUSEL’S OWN PIXEL, THE TEXT RULE)', () => {
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
    expect(CODE).not.toMatch(/scalable:/);
    // The row's pixel and its remap, once each; the zoom once; the floor
    // never (THE FLOOR, REMOVED — the pin below reads every class).
    expect(CODE.split('design-scale')).toHaveLength(2);
    expect(CODE.split(PIXEL_NAME)).toHaveLength(2);
    expect(CODE.split(ZOOM_NAME)).toHaveLength(2);
    expect(CODE.split(FLOOR_NAME)).toHaveLength(1);
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
