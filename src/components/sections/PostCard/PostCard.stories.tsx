import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { PostCard, type PostCardContent } from './PostCard';

// FOUR stories, and the count is the honest one: the everyday card, a post
// with no categories, the long-word stress, and the hover jump the pixel net
// cannot photograph. The export NAMES are load-bearing — each names a baseline
// file (`sections/post-card/default-…`) — so this list IS the section's
// contribution to a lane's visual manifest. `Sections/*` routes every story to
// 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds
// the accessibility width to LongWords, and 'no-visual' keeps Jump out of the
// net — it runs under reduced motion, where the card never moves, so its
// frame would only repeat Default's.
//
// ── THE POSTS ARE SAMPLES, written here in Romanian with diacritics (§15.7) —
// the blog is Romanian-only (§5), so there is no German stress: LongWords
// stresses the language the page speaks. Copy is plain dental-care advice,
// written to the CMSR rules every page follows (no superlative, no promise,
// no result, no percentage). The authors are the clinic's real doctors, as on
// the index the planner is building; the pictures are the clinic's own three
// photographs under public/images/hero/, with their own alts.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14), and two
// pin a VIEWPORT, for the Vitest storybook project, so each of the card's two
// shapes is proven at a width that decides it: NoTags at the laptop's 1536 —
// the row — and LongWords at the 320 stress width — the stack. The visual net
// ignores the pins (it sets its own page size per project), which is why every
// play DERIVES the shape it expects from the card it measures (`inRow`),
// never from the pinned width: at 390 and 1536 each play proves whichever
// shape the card is in.
//
// ── THE DECORATOR IS THE PAGE-BAND RECIPE (ui/Container's standing law): a
// full-bleed <section> that paints and a Container that measures the column —
// the column the blog index puts its cards in, and the one PostCard's `sizes`
// is derived from. Not decoration: ui/Card applies inline-size containment, so
// a card must sit in a width-giving parent, and a bare canvas would photograph
// a box sized by a rule this card does not use. `layout: 'fullscreen'` keeps
// Storybook's own padding out of the band.
//
// ── WHAT THE PLAYS READ, AND WHAT THEY CANNOT. Every geometry number below is
// a LAYOUT value — a computed size, a grid track, an offset — because the
// card JUMPS under a resting pointer (a 105 % transform on :hover) and a
// story cannot park the real pointer: its events are synthetic, and :hover
// answers only the real one. A transform scales what is painted and leaves
// layout alone, so no number here moves with the jump. The real faces are
// loaded before anything is measured (Storybook's fonts are `font-display:
// block` — the house's lesson), and no play waits on a picture: in the Vitest
// run the optimizer's variants do not exist yet, every <img> 404s and falls
// back to its original file, and a play that awaited `decode()` could hang.

/** The everyday post — the index's own first sample: two categories. */
const TOOTHBRUSH = {
  title: 'Cum îți alegi periuța de dinți',
  summary:
    'Firele, mărimea capului și mânerul: ce să urmărești pe ambalaj când îți alegi periuța și cât de des merită să o schimbi.',
  date: { iso: '2026-09-29', label: '29 septembrie 2026' },
  author: 'Dr. Nicu Elena Alina',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
  },
  tags: ['igienă', 'sfaturi'],
} as const satisfies PostCardContent;

/** A post with NO categories — the card renders no list at all. */
const FIRST_VISIT = {
  title: 'Ce se întâmplă la prima consultație',
  summary:
    'Pe scurt, cum decurge prima vizită: discuția despre ce te supără, examinarea, radiografia, dacă e nevoie, și planul pe care îl stabilim împreună.',
  date: { iso: '2026-09-15', label: '15 septembrie 2026' },
  author: 'Dr. Nicu Elena Alina',
  image: {
    src: '/images/hero/treatment-room.jpg',
    alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  tags: [],
} as const satisfies PostCardContent;

/** THE STRESS: long Romanian words in the title and the summary, the longest
 *  month in the date, the longest name the clinic's authors carry, and three
 *  long single-word categories — so the chips wrap onto a second line. */
const LONG_WORDS = {
  title:
    'Parodontopatia și întreținerea gingiilor după detartraj: recomandări pentru îngrijirea zilnică',
  summary:
    'Detartrajul ultrasonic, periajul interdentar și controalele periodice fac parte din îngrijirea parodontală. Află ce întrebări să pregătești pentru următoarea programare și cum îți organizezi igienizarea interdentară acasă, între două vizite.',
  date: { iso: '2026-09-30', label: '30 septembrie 2026' },
  author: 'Dr. Malea (Sabău) Oana Bianca',
  image: {
    src: '/images/hero/instruments.jpg',
    alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
  tags: ['parodontologie', 'implantologie', 'prevenție'],
} as const satisfies PostCardContent;

const Band = ({ children }: { children: ReactNode }): ReactElement => (
  <section className="bg-page">
    <Container className="py-10">{children}</Container>
  </section>
);

const withBand: Decorator = (Story) => (
  <Band>
    <Story />
  </Band>
);

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

const px = (value: string): number => parseFloat(value);

/** The face an element's text is laid out in, loaded before anything is
 *  measured (the DoctorIntro / Hero / PersonnelCard idiom). */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** The card's boxes, reached from the <article> by structure — none of them
 *  carries a role: ui/Card, the grid inside it, and the grid's two cells. */
const partsOf = (article: HTMLElement) => {
  const card = article.firstElementChild as HTMLElement;
  const grid = card.firstElementChild as HTMLElement;
  return {
    card,
    grid,
    cell: grid.children[0] as HTMLElement,
    words: grid.children[1] as HTMLElement,
  };
};

/** ui/Card's CONTENT width — what the card's `@lg` asks — off the layout: the
 *  computed width (the border box, fractional) less the frame and the
 *  padding. A transform never changes it. */
const contentWidth = (card: HTMLElement): number => {
  const style = getComputedStyle(card);
  return (
    px(style.width) -
    px(style.borderLeftWidth) -
    px(style.borderRightWidth) -
    px(style.paddingLeft) -
    px(style.paddingRight)
  );
};

/** WHERE THE CARD TURNS INTO A ROW, derived rather than assumed: `@lg` is
 *  32rem of the card's content box. */
const inRow = (card: HTMLElement): boolean => contentWidth(card) >= rem(32);

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  not the card (a chip never wraps) and not the page. */
const expectNoSidewaysScroll = async (article: HTMLElement): Promise<void> => {
  await expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
};

/**
 * THE LAYOUT, MEASURED — the row from the card's `@lg`, the stack under it —
 * and returned, so a story can say which shape it pinned. In both shapes the
 * picture's cell is square and comes first; in the row it is the first of two
 * tracks, a quarter of the content after the 2rem gap, level with the words;
 * stacked it is the one track's full width, the words 1.5rem under it.
 * Offsets are compared between the two siblings, which share one offset
 * parent, so the pair is layout on both sides.
 */
const expectLayout = async (article: HTMLElement): Promise<'row' | 'stack'> => {
  const { card, grid, cell, words } = partsOf(article);
  for (const element of words.querySelectorAll('h2, h3, p, li')) {
    await loadFace(element);
  }

  const content = contentWidth(card);
  const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').map(px);
  const cellBox = getComputedStyle(cell);
  const side = px(cellBox.width);
  await expect(px(cellBox.height)).toBeCloseTo(side, 0);

  if (inRow(card)) {
    const quarter = (content - rem(2)) / 4;
    await expect(tracks).toHaveLength(2);
    await expect(tracks[0]).toBeCloseTo(quarter, 0);
    await expect(tracks[1]).toBeCloseTo(quarter * 3, 0);
    await expect(side).toBeCloseTo(quarter, 0);
    // `@lg:items-start` — Tailwind v4 spells it `flex-start`, which a grid
    // reads as `start`.
    await expect(getComputedStyle(grid).alignItems).toMatch(/^(flex-)?start$/);
    // Beside: the same top, the words 2rem to the right of the picture.
    await expect(words.offsetTop).toBe(cell.offsetTop);
    await expect(
      Math.abs(
        words.offsetLeft - (cell.offsetLeft + cell.offsetWidth) - rem(2),
      ),
    ).toBeLessThanOrEqual(1);
    return 'row';
  }

  await expect(tracks).toHaveLength(1);
  await expect(tracks[0]).toBeCloseTo(content, 0);
  await expect(side).toBeCloseTo(content, 0);
  // Under: the same left edge, the words 1.5rem below the picture.
  await expect(words.offsetLeft).toBe(cell.offsetLeft);
  await expect(
    Math.abs(words.offsetTop - (cell.offsetTop + cell.offsetHeight) - rem(1.5)),
  ).toBeLessThanOrEqual(1);
  return 'stack';
};

/** The facts every card owes whatever its shape: named by its title, the day
 *  a <time> uppercased by CSS, the tags a named list — or none. */
const expectNamedParts = async (
  canvasElement: HTMLElement,
  args: PostCardContent & { tagsLabel: string },
): Promise<HTMLElement> => {
  const canvas = within(canvasElement);
  const article = canvas.getByRole('article', { name: args.title });
  await expect(
    canvas.getByRole('heading', { level: 2, name: args.title }),
  ).toBeInTheDocument();
  const posted = canvas.getByRole('time');
  await expect(posted).toHaveAttribute('datetime', args.date.iso);
  await expect(getComputedStyle(posted).textTransform).toBe('uppercase');
  if (args.tags.length === 0) {
    await expect(canvas.queryByRole('list')).toBeNull();
  } else {
    const list = canvas.getByRole('list', { name: args.tagsLabel });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(
      args.tags.length,
    );
  }
  return article;
};

const meta = {
  title: 'Sections/PostCard',
  component: PostCard,
  parameters: { layout: 'fullscreen' },
  decorators: [withBand],
  args: { ...TOOTHBRUSH, tagsLabel: 'Categorii' },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The post’s title — the card’s heading (an <h2> by default) and the article’s accessible name',
    },
    summary: {
      control: 'text',
      description: 'One or two sentences under the title, in the muted ink',
    },
    date: {
      control: 'object',
      description:
        'The day in both halves: `iso` (YYYY-MM-DD) is the <time>’s dateTime, `label` the page’s own words for it, uppercased in CSS',
    },
    author: { control: 'text', description: 'Who wrote the post' },
    image: {
      control: false,
      description:
        'The picture under public/images/ and its alt (empty when decorative) — a square cell, ui/Image’s framed situation',
    },
    tags: {
      control: 'object',
      description:
        'The categories — the price strip’s chips at rest; an empty list renders no list',
    },
    tagsLabel: {
      control: 'text',
      description: 'The accessible name of the tag list, e.g. „Categorii”',
    },
    headingLevel: {
      control: 'inline-radio',
      options: [2, 3],
      description:
        'The title’s heading level: 2 under the page’s <h1> (the default), 3 under a band’s <h2>',
    },
    preload: {
      control: 'boolean',
      description:
        'The page’s FIRST card: load the picture at once, at high priority, with a preload link (a likely LCP)',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the <article> (§6.8)',
    },
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY CARD — the reference's shape: on a laptop the square picture
 * on the left, a quarter of the card, and beside it the title, the day and
 * the author, the two categories as the price strip's resting chips, and the
 * summary; on a phone the same pieces stacked, the picture on top at the
 * card's full width. Unpinned: the Vitest run renders it at Storybook's
 * default 1200px (the row), the net at 390 (the stack) and 1536 (the row), and
 * the play proves whichever it is handed.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    await expectLayout(article);
    await expectNoSidewaysScroll(article);
  },
};

/**
 * A POST WITHOUT CATEGORIES: no list at all — an empty named list would be
 * announced as „list, 0 items" — and the summary follows the date line.
 * Pinned to the laptop (1536px) so the Vitest run proves THE ROW.
 */
export const NoTags: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { ...FIRST_VISIT },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    const shape = await expectLayout(article);
    if (window.innerWidth === 1536) await expect(shape).toBe('row');
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE STRESS, at the 320px accessibility width (§7) as well as the net's two
 * — the 'stress-320' tag — and pinned there, so the Vitest run proves THE
 * STACK: a title of long words in the 30px `band` step, hyphenated by the
 * Romanian dictionary where it must break — and, on an engine without one,
 * broken by THE TITLE'S BELT rather than run past the card (PostCard's THE
 * NAME, G2 a11y, 2026-10-14); the longest date and the longest
 * author's name the clinic signs, each kept whole on its line, the name
 * wrapping inside its own box where the line is shorter than it; three
 * single-word chips that cannot wrap, so the LIST wraps instead; and a
 * two-sentence summary. Nothing may push the page sideways.
 */
export const LongWords: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: { ...LONG_WORDS },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    const shape = await expectLayout(article);
    if (window.innerWidth === 320) await expect(shape).toBe('stack');
    // THE TITLE'S BELT reached the real sheet: the title's own element
    // computes `overflow-wrap: anywhere` (the unit suite pins the token).
    await expect(
      getComputedStyle(within(canvasElement).getByRole('heading', { level: 2 }))
        .overflowWrap,
    ).toBe('anywhere');
    // The date never breaks inside itself: one line box tall.
    const posted = within(canvasElement).getByRole('time');
    await expect(posted.offsetHeight).toBeLessThanOrEqual(
      px(getComputedStyle(posted).lineHeight) + 1,
    );
    await expectNoSidewaysScroll(article);
  },
};

/** One CSS rule as the stylesheet holds it, with the at-rules around it. */
type RuleTrail = { trail: readonly string[]; style: CSSStyleDeclaration };

/** Every style rule the document's sheets hold, each with its `@media`
 *  conditions — layers and other groupings are walked through, nested rules
 *  included. A sheet the page may not read is skipped. */
const styleRules = (): RuleTrail[] => {
  const found: RuleTrail[] = [];
  const walk = (rules: CSSRuleList, trail: readonly string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const next = [...trail, rule.selectorText];
        found.push({ trail: next, style: rule.style });
        walk(rule.cssRules, next);
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, [...trail, `@media ${rule.conditionText}`]);
      } else if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, trail);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    walk(rules, []);
  }
  return found;
};

/** The index of the ONE rule whose selector is `selector`, named on failure. */
const ruleIndex = (rules: RuleTrail[], selector: string): number => {
  const index = rules.findIndex(({ trail }) => trail.at(-1) === selector);
  if (index === -1) {
    throw new Error(`PostCard stories: no stylesheet rule for ${selector}.`);
  }
  return index;
};

/**
 * THE CARD JUMP — the owner's "react on hover like a button": hover the card
 * and it grows to 105 % over 200ms, the house button's jump (ui/Button's THE
 * JUMP), and settles back when the pointer leaves. Not photographed
 * ('no-visual'): the net runs under reduced motion, where the card never
 * moves, and synthetic events cannot hover anything. So the play reads what
 * a picture could not: the clock on the <article> — `scale` alone, 0.2s, the
 * keyword ease-out — ui/Card's own paint clock left on the element inside it,
 * and, in the real stylesheet, the two rules that move it: the 105 % behind
 * `(hover: hover)`, and the reduced-motion reset after it in the sheet, so the
 * reset wins.
 */
export const Jump: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    const article = within(canvasElement).getByRole('article', {
      name: args.title,
    });
    const clock = getComputedStyle(article);
    await expect(clock.transitionProperty).toBe('scale');
    await expect(clock.transitionDuration).toBe('0.2s');
    await expect(clock.transitionTimingFunction).toBe('ease-out');
    // Two clocks, two elements: the frame's paint fades on ui/Card's own.
    await expect(
      getComputedStyle(partsOf(article).card).transitionProperty,
    ).toBe('background-color, border-color');

    const rules = styleRules();
    const grow = ruleIndex(rules, '.hover\\:scale-105:hover');
    const reset = ruleIndex(rules, '.motion-reduce\\:hover\\:scale-100:hover');
    await expect(rules[grow]?.trail).toContain('@media (hover: hover)');
    await expect(
      rules[grow]?.style.getPropertyValue('--tw-scale-x').trim(),
    ).toBe('105%');
    await expect(rules[reset]?.trail).toContain(
      '@media (prefers-reduced-motion: reduce)',
    );
    await expect(
      rules[reset]?.style.getPropertyValue('--tw-scale-x').trim(),
    ).toBe('100%');
    // Same specificity, so the sheet's order decides: the reset comes later.
    await expect(reset).toBeGreaterThan(grow);
  },
};
