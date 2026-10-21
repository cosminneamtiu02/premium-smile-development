import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createTranslator } from 'next-intl';
import { expect, within } from 'storybook/test';
import {
  blogCarouselWordsFrom,
  populateBlogCarousel,
} from '@/app/[locale]/(home)/populate';
import type { Locale } from '@/i18n/locales';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { BlogCarousel, type BlogCarouselProps } from './BlogCarousel';

// Sections/BlogCarousel — the Home band of the blog's article cards: the
// opener at the start, then the card carousel's five-card window of
// MINIATURES — the blog list's card at the owner's 65 %, every card one width
// and one height — as wide as the clinic's numbers band's column. SIX
// stories: the Romanian band unpinned (Default) and five pinned to a viewport
// for the Vitest storybook project — a phone (390), a tablet (768), the
// owner's own 1401 look (Reference1401), the desktop (1920) and the German
// band at the 320 stress width (GermanStress320). The export NAMES are
// load-bearing — each names a baseline file — so this list IS the band's
// contribution to a lane's visual manifest. `Sections/*` routes every story
// to 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag
// adds the accessibility width to GermanStress320.
//
// ── THE PROPS ARE HOME'S OWN — `propsFor` calls the Home page's populator,
// app/[locale]/(home)/populate.ts' `populateBlogCarousel`, with the band's
// words through its `blogCarouselWordsFrom`, the ONE mapping the page and the
// Home story twin call too: lib/blog's posts in the story's language, newest
// first, each the blog list's own card (app/[locale]/blog/populate.ts'
// `postCard` — its link, its author as lib/team spells the doctor in that
// language, its reading time in the blog's ICU sentence) and named one by
// one. So a frame holds the very props Home hands the band, never a copy of
// the mapping. A story may call a pure populator; the band never does. Every
// word is the message files' own — the band's `home.articles.*`, the cards'
// `blog.*`, the carousel's `common.carousel.*` — through next-intl's
// `createTranslator` (the populator's own test feeds it the same way), so a
// story frame shows exactly the words the page ships, its ICU sentences
// formatted by the same engine.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14). The
// visual net ignores the viewport pins (it sets its own page size per
// project), so every play DERIVES what it expects from the boxes it measures,
// never from the pinned width: the opener's design pixel from the rhythm box,
// the carousel's from the box round it (THE FLOOR), the column from the
// rhythm box itself.
//
// ── THE CAROUSEL MOVES: the plays run the carousel's default rhythm (the
// band passes no clock option), a first move after 1.5 s and one every 5.5 s
// — the Hero's rhythm, which for cards that take 18 to 20 s to read is an
// OPEN question, the owner's call (BACKLOG.md entry 2, its dwell question).
// The pixel net runs under reduced motion, which lib/clock answers by never
// starting the ring, so it photographs the first card centred. So a play reads the
// cards' places AT REST (`atRest`, sections/CardCarousel's stories' reading:
// every glide and every dot's fade finished, and the reading taken again
// should a move begin while it was taken), and never asks WHICH card is
// centred. A card's WIDTH and HEIGHT are its layout's, which no move changes.
//
// ── WHAT THE PLAYS MEASURE: THE OPENER — the band a region named by its
// <h2>, the eyebrow over it, both on the rhythm box's start edge, at the
// `band` step and the eyebrow's 14px × the design pixel, the band scaled
// exactly where the regime's three premises hold (asserted, so a regime that
// silently stopped applying cannot leave the sizes standing on nothing);
// THE WIDTH — the carousel a region of its own AS WIDE AS THE COLUMN (the
// rhythm box: the numbers band's, BlogCarousel.tsx's THE WIDTH), its stage the
// whole of it, the two arrows named and on its two edges, the progress dots
// one per card, named as its card, one current; THE FIXED SHAPE — every card
// of the ring one width, the band's card in the carousel's pixel, and one
// height, every card filling its box; THE FLOOR — the carousel's pixel the
// theme's up to the owner's window and the column's past it, never under
// the theme's; THE CARDS — every card an article named by its title, its one
// link the post's article, the centre card whole and centred on the stage;
// and NO SIDEWAYS SCROLL. The real faces are loaded first (`loadFaces`):
// Storybook loads Source Serif 4 and JetBrains Mono `font-display: block`, so
// a play that measured before they arrived would lay the words out in a
// fallback. BlogCarousel.scale.test.tsx holds the model behind all of it.

/** The Home page's words and cards in `locale` — the band's props from Home's
 *  own populator and its ONE word mapping (the header's THE PROPS ARE HOME'S
 *  OWN), its three translators next-intl's `createTranslator` over the
 *  message files. */
function propsFor(locale: Locale, messages: typeof ro): BlogCarouselProps {
  return populateBlogCarousel(
    locale,
    blogCarouselWordsFrom(
      createTranslator({ locale, messages, namespace: 'home' }),
      createTranslator({ locale, messages, namespace: 'blog' }),
      createTranslator({ locale, messages, namespace: 'common' }),
    ),
  );
}

const RO = propsFor('ro', ro);
const DE = propsFor('de', de);

// ── THE MEASURING KIT ──────────────────────────────────────────────────────

const box = (element: Element): DOMRect => element.getBoundingClientRect();

const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** THE REGIME'S STEP, written out: ui/Container's column at max(56rem,
 *  896px) — the band scale's chain `scalable:@4xl:@min-[896px]:`. */
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** THE CARD in design pixels (BlogCarousel.tsx's CARD, THE FIXED SHAPE): the
 *  blog list's three-across card at the owner's 1401 window — 1106 less two
 *  32s, a third — at the owner's 0.65. BlogCarousel.scale.test.tsx reads
 *  every one of these numbers where it lives; a story only measures. */
const CARD_DESIGN = ((1106 - 2 * 32) / 3) * 0.65;

/** A box's design pixel: its registered `--scale-px` where THE BAND SCALE
 *  redraws it (its `--spacing` no longer the root's), the theme's 1rem / 16
 *  where nothing is declared. */
const pixelOf = (element: Element): number =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing')
    ? px(element, '--scale-px')
    : rem(1) / 16;

/** A box's LAYOUT size — its computed width or height, which no transform of
 *  the carousel's changes (a side card is drawn smaller and turned). */
const layout = (element: Element, side: 'width' | 'height'): number =>
  parseFloat(getComputedStyle(element)[side]);

/** The real faces, by each element's computed font, before anything is
 *  measured (PostList.stories.tsx's idiom) — the cards' <h3> titles among
 *  them, whose lines set every card's height. */
async function loadFaces(root: HTMLElement): Promise<void> {
  for (const element of root.querySelectorAll<HTMLElement>(
    'h2, h3, p, li, a, span',
  )) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** Wait one frame. */
const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

/**
 * Read the carousel AT REST — every glide and every dot's fade finished, and
 * none begun while the reading was taken (sections/CardCarousel's stories'
 * `atRest`: a tick of the running ring can land between the wait and the
 * read; the reading is then taken again).
 */
async function atRest<T>(region: HTMLElement, read: () => T): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    await frame();
    await Promise.all(
      region
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    const reading = read();
    if (region.getAnimations({ subtree: true }).length === 0) return reading;
  }
  throw new Error('BlogCarousel story: the carousel never came to rest');
}

/** `actual` within `tolerance` of `expected`, naming what was measured. */
async function near(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
): Promise<void> {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
}

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9)
 *  — the page measured by the root's own BOX, never by `clientWidth`, which
 *  in the runner's frame is the whole window, the reserved scrollbar gutter
 *  included (PostList.stories.tsx's reading). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(box(root).width),
  );
}

/** The band's boxes, by structure: the region named by its <h2> →
 *  ui/Container's column → the rhythm box → the box round the carousel (THE
 *  FLOOR) → the carousel. */
function partsOf(canvasElement: HTMLElement, args: BlogCarouselProps) {
  const band = within(canvasElement).getByRole('region', { name: args.title });
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const own = rhythm?.lastElementChild;
  if (
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(own instanceof HTMLElement)
  ) {
    throw new Error('BlogCarousel story: the band lost a box');
  }
  const carousel = within(band).getByRole('region', {
    name: args.labels.region,
  });
  return { band, column, rhythm, own, carousel };
}

/**
 * THE OPENER — the band a region named by its own <h2>, the eyebrow over it,
 * both on the rhythm box's start edge; the band scaled exactly where the
 * regime's premises hold; the <h2> at the `band` step (36px from a 28rem
 * column, 30px under it) and the eyebrow at 14px, each × the design pixel —
 * the size and the edge of every Home band's opener.
 */
async function expectOpener(
  canvasElement: HTMLElement,
  args: BlogCarouselProps,
): Promise<void> {
  const { band, column, rhythm } = partsOf(canvasElement, args);
  const h2 = within(band).getByRole('heading', { level: 2, name: args.title });
  await expect(band.getAttribute('aria-labelledby')).toBe(h2.id);
  const eyebrow = h2.previousElementSibling;
  if (!(eyebrow instanceof HTMLElement)) throw new Error('no eyebrow');
  await expect(eyebrow).toHaveTextContent(args.eyebrow);

  const scaled =
    getComputedStyle(rhythm).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  await expect(scaled).toBe(
    window.matchMedia('(pointer: fine)').matches &&
      CSS.supports('color', 'rgb(from red r g b)') &&
      box(column).width >= Math.max(rem(STEP_REM), STEP_FLOOR),
  );
  const s = scaled ? px(rhythm, '--scale-px') : 1;
  const step = box(column).width >= rem(28) ? 36 : 30;
  await near(px(h2, 'font-size'), step * s, 0.05, 'the <h2>’s size');
  await near(px(eyebrow, 'font-size'), 14 * s, 0.05, 'the eyebrow’s size');
  await near(box(h2).left, box(rhythm).left, 0.5, 'the <h2> at the start');
  await near(box(eyebrow).left, box(rhythm).left, 0.5, 'the eyebrow too');
}

/**
 * THE CAROUSEL — a region of its own, named and described; AS WIDE AS THE
 * COLUMN (the rhythm box — the numbers band's on Home) with its stage the
 * whole of it and its two arrows on its two edges; the progress dots one per
 * card, named as its card, exactly one current; THE FLOOR — the carousel's
 * pixel max(1rem / 16, the opener's) wherever the band scale holds, the
 * theme's elsewhere; THE FIXED SHAPE — every card of the ring the band's card
 * in that pixel (never wider than the column) and one height, each filling its
 * box; and every card an article named by its title whose one link is the
 * post's article, the centre card whole and centred on the stage at rest.
 */
async function expectCarousel(
  canvasElement: HTMLElement,
  args: BlogCarouselProps,
): Promise<void> {
  const { rhythm, own, carousel } = partsOf(canvasElement, args);
  await expect(carousel).toHaveAttribute(
    'aria-roledescription',
    args.labels.role,
  );

  // THE WIDTH — the column, one left edge and one width.
  const column = box(rhythm);
  const root = box(carousel);
  await near(root.left, column.left, 0.01, 'the carousel on the column’s edge');
  await near(root.width, column.width, 0.01, 'the carousel the column’s width');
  const stage = carousel.querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) throw new Error('no stage');
  await near(
    box(stage).width,
    root.width,
    0.01,
    'the stage the whole carousel',
  );

  // THE ARROWS — named, on the column's two edges.
  const previous = within(carousel).getByRole('button', {
    name: args.labels.previous,
  });
  const next = within(carousel).getByRole('button', {
    name: args.labels.next,
  });
  await near(box(previous).left, root.left, 0.01, 'the previous arrow');
  await near(box(next).right, root.right, 0.01, 'the next arrow');

  // THE PROGRESS DOTS — one per card, named as its card, one current.
  const picker = within(carousel).getByRole('group', {
    name: args.labels.picker,
  });
  const dots = within(picker).getAllByRole('button');
  await expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual([
    ...args.slideLabels,
  ]);
  await expect(
    dots.filter((dot) => dot.getAttribute('aria-current') === 'true'),
  ).toHaveLength(1);

  // THE FLOOR — the carousel's own pixel, never under the theme's.
  const scaled =
    getComputedStyle(rhythm).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  const pixel = pixelOf(own);
  await near(
    pixel,
    scaled ? Math.max(rem(1) / 16, pixelOf(rhythm)) : rem(1) / 16,
    1e-4,
    'the carousel’s pixel',
  );

  // THE FIXED SHAPE — one width, one height, every card filling its box.
  const slides = [...stage.children];
  await expect(slides).toHaveLength(args.posts.length);
  const card = Math.min(CARD_DESIGN * pixel, root.width);
  const height = layout(slides[0] ?? stage, 'height');
  for (const slide of slides) {
    await near(layout(slide, 'width'), card, 1 / 32, 'a card’s width');
    await near(layout(slide, 'height'), height, 0.01, 'one height');
    const article = slide.querySelector('article');
    if (article === null) throw new Error('a card is missing');
    await near(layout(article, 'height'), height, 0.01, 'a card fills its box');
  }

  // THE CARDS — every one an article named by its title, its ONE link the
  // post's article, in the list's order (side cards are aria-hidden
  // previews: their names resolved through aria-labelledby by hand).
  for (const [index, slide] of slides.entries()) {
    const post = args.posts[index];
    const article = slide.querySelector('article');
    if (post === undefined || article === null) {
      throw new Error(`card ${index + 1} is missing`);
    }
    const titleId = article.getAttribute('aria-labelledby') ?? '';
    await expect(document.getElementById(titleId)).toHaveTextContent(
      post.title,
    );
    const links = article.querySelectorAll('a[href]');
    await expect(links).toHaveLength(1);
    await expect(links[0]).toHaveAttribute('href', post.href);
  }

  // THE CENTRE CARD, at rest: whole on the stage and on its middle.
  const centre = await atRest(carousel, () => {
    const middle = slides.find((slide) => !slide.hasAttribute('inert'));
    if (middle === undefined) throw new Error('no centred card');
    return { card: box(middle), stage: box(stage) };
  });
  await expect(centre.card.left).toBeGreaterThanOrEqual(
    centre.stage.left - 0.01,
  );
  await expect(centre.card.right).toBeLessThanOrEqual(
    centre.stage.right + 0.01,
  );
  await near(
    centre.card.left + centre.card.width / 2,
    centre.stage.left + centre.stage.width / 2,
    0.5,
    'the centre card centred',
  );
}

// ── THE STORIES ────────────────────────────────────────────────────────────

const meta = {
  title: 'Sections/BlogCarousel',
  component: BlogCarousel,
  parameters: { layout: 'fullscreen' },
  args: RO,
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'The mono micro-label over the title, e.g. „Blog”',
    },
    title: {
      control: 'text',
      description:
        'The band’s <h2> — and the region’s name — at the start like every Home band’s, e.g. „Sfaturi de la medicii noștri”',
    },
    labels: {
      control: 'object',
      description:
        'The carousel’s own words: its region’s name, its two roledescriptions, the two arrows’ names and the progress dots’ group name',
    },
    posts: {
      control: 'object',
      description:
        'The cards, newest first — each sections/PostCard’s content and its slug (the React key, never an attribute). Empty renders nothing',
    },
    slideLabels: {
      control: 'object',
      description:
        'One name per card, in the same order — the card’s group label and its progress dot’s, e.g. „Articolul 3 din 12”',
    },
    tagsLabel: {
      control: 'text',
      description: 'Every card’s tag list’s name, e.g. „Categorii”',
    },
    readMore: {
      control: 'text',
      description: 'Every card’s read-more label, e.g. „Citește mai mult…”',
    },
  },
} satisfies Meta<typeof BlogCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full check every story runs. */
const play: Story['play'] = async ({ args, canvasElement }) => {
  await loadFaces(canvasElement);
  await expectOpener(canvasElement, args);
  await expectCarousel(canvasElement, args);
  await expectNoSidewaysScroll();
};

/**
 * THE ROMANIAN BAND — the owner's shape: „Blog" over „Sfaturi de la medicii
 * noștri", then the blog's twelve cards as miniatures in the five-card window,
 * circular, as wide as the numbers band's column, the arrows on its edges and
 * the progress dots under the cards. Unpinned: the Vitest run renders it at
 * the runner's 1200, a laptop window inside the band scale with the carousel
 * on its floor; the net photographs it at 390 (the window cut from its faded
 * sides) and 1536 (five cards, grown past the owner's window).
 */
export const Default: Story = { globals: { locale: 'ro' }, play };

/** A PHONE (390): the column narrower than the five-card window, so its sides
 *  are cut from the faded edges; the centre card whole, the arrows over the
 *  neighbours' fades; every card the theme's miniature. */
export const Smartphone390: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play,
};

/** A TABLET (768): the window still cut, its neighbours whole on the stage,
 *  the band unscaled (a touch screen at this width keeps the theme's rem). */
export const Tablet768: Story = {
  globals: { locale: 'ro', viewport: { value: 'tablet' } },
  play,
};

/** THE OWNER'S LOOK, his 1401 window — the column 1106px, the band scale's
 *  REFERENCE, so the opener and the carousel both draw at one design pixel to
 *  the CSS pixel. No viewport of that width exists in §7's list, so the story
 *  draws the column itself (DoctorShowcase's NarrowContainer idiom): a box
 *  1106px wider than ui/Container's two 10vw gutters, `calc(1106px + 20vw)`,
 *  keeps a 1106px column inside it at every window from ≈ 1402 to 2000px —
 *  the desktop pin's 1920 (a 1490px box) and the pixel net's 1536 (1413.2px)
 *  alike, where the 1490px box of before 2026-10-20 drew a 1182.8px column at
 *  1536. Where the screen is narrower than the box, the box is the screen
 *  (`max-width: 100%`), and the play checks the column only where the box
 *  fits. Five cards whole and the room a side between each arrow and the
 *  faded outermost card. */
export const Reference1401: Story = {
  globals: { locale: 'ro', viewport: { value: 'desktop' } },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'calc(1106px + 20vw)',
          maxWidth: '100%',
          marginInline: 'auto',
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async (context) => {
    await play?.(context);
    // THE REFERENCE, wherever the box fits the screen: the column
    // ui/Container leaves inside it is the owner's 1106px.
    const { band, column } = partsOf(context.canvasElement, context.args);
    const host = band.parentElement;
    if (
      !(host instanceof HTMLElement) ||
      !(host.parentElement instanceof HTMLElement)
    ) {
      throw new Error('BlogCarousel story: no reference box');
    }
    if (box(host).width < box(host.parentElement).width - 0.5) {
      await near(box(column).width, 1106, 0.05, 'the reference column');
    }
  },
};

/** THE DESKTOP (1920): past the owner's window the carousel's pixel is the
 *  column's, 1.375 here — the cards, their words and the arrows 1.375 times
 *  the theme's, but the tags' labels only 1.19 times (9.31px against 7.8:
 *  they keep PostCard's own chip pixel) — and the opener every Home band's
 *  size and edge. */
export const Desktop1920: Story = {
  globals: { locale: 'ro', viewport: { value: 'desktop' } },
  play,
};

/** THE GERMAN BAND AT THE 320 STRESS WIDTH (§7, §8.4) — the longest language
 *  on the narrowest screen: „Tipps aus unserer Praxis" over the German
 *  miniatures, every card one width and the tallest German card's height, the
 *  window cut to the centre card, and the page never scrolls sideways. */
export const GermanStress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'stress320' } },
  args: DE,
  play,
};
