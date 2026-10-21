import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import ro from '@/messages/ro.json';
import type { CardCarouselLabels } from '@/components/sections/CardCarousel/CardCarousel';
import { PostGallery } from './PostGallery';
import {
  GALLERY_CARDS,
  captionDotShown,
  captionUnitsAcrossLines,
} from './PostGallery.fixtures';

// Sections/PostGallery — the blog article's photo gallery: the owner's eight
// gallery photographs as GalleryCards on sections/CardCarousel's line, ALWAYS
// its three-card window (PostGallery.tsx's THREE CARDS, ALWAYS — the five-card
// window is the Home page's since 2026-10-17), in the article's two
// instances: circular (Default) and end to end (Bounded), each over the same
// EIGHT cards — then the phone, the laptop and §7's 320 stress width. The
// `Sections` title prefix routes every story to 390 + 1536 in the visual net
// (tests/visual/stories.spec.ts, §13), whatever its own pin; Stress320 adds the
// 320 stress width ('stress-320'). The export NAMES are load-bearing —
// renaming one renames its baseline file (none was recorded when `Bounded`
// became `BoundedThree` on 2026-10-16, nor when it became `Bounded` again and
// `FiveCards` and `BoundedFive` left, on 2026-10-17). Default, Smartphone390
// and Laptop1536 differ only in the width the Vitest runner gives them (its
// own 1200, a phone's 390, a laptop's 1536); the net photographs each at its
// own two widths — harmless repeats, the price of the lane's rule for pinned
// stories. The net runs with reduced motion, under which neither mode starts,
// so every frame shows the first card centred; in the workbench BOTH modes
// move on by themselves until a press stops them — the loop round its cards,
// the bounded list out to its last card and back (CardCarousel.tsx's THE TWO
// AXES and THE CONSUMPTION LAW) — and no play below depends on which card is
// at the centre, nor presses anything.
//
// ── THE DECORATOR IS THE ARTICLE'S COLUMN: ui/Container (the page's gutter),
// the vertical air of a page, and the article's 42rem MEASURE — the flex
// column sections/PostPage sets its blocks in (the build contract's §2). The
// gallery owns no width (§6.4), and the carousel's stage depends on the width
// it is given. The page's band scale is the page's, not worn here.
//
// ── THE WORDS ARE THE PAGE'S: the region, previous, next, the beads' group
// name and the slide labels from ro.json's `blog.article.gallery` („Fotografia
// 1 din 8", „Alege fotografia"), the two roledescriptions from
// `common.carousel` — so the workbench says what the article says. The cards
// are the owner's eight placeholder photographs under the Romanian captions and
// alts sections/CardCarousel's stories give them (PostGallery.fixtures.ts's
// GALLERY_CARDS, §15.7).
//
// ── THE PLAYS, one helper for all (expectGallery), every check true at EVERY
// width and whichever card the ring has brought to the centre: the real face
// first (the house's lesson, PR #125); the region named by the page's word
// with its roledescription; THE ARROWS (CardCarousel.tsx's THE ARROWS) —
// visible, named by the page's previous and next words, nothing painted on
// their own boxes (a tall chevron on no ground), each a strip nine theme steps
// wide and as tall as the cards; THE BEADS (its THE BEADS) — a group named by
// the page's picker word, one bead per card named as its card, exactly one
// current, the centred card's, every bead UNDER the stage; THE ORDER — the
// region's only buttons previous, next, then the beads, all of them before
// every card; every card — in the DOM, since the side cards are `inert`
// previews out of the accessibility tree — with its caption, its photo's alt
// and its slide label, in order; every caption's contrast, read off each
// caption's own computed box, which no pose changes (the words a step below
// the fade, white on a scrim whose worst pixel still reads 4.5:1); no
// caption's words wider than their card; THE DOT STEP — every dot drawn
// exactly on a card of at least 8.5 of its caption's ems; NO CAPTION WORD ON
// TWO LINES (GalleryCard's THE CAPTION NEVER SPLITS A WORD — on the 320 stress
// width the narrowest card the gallery draws, 155.8px behind the runner's 15px
// scrollbar gutter, on the narrow step with its dot), counted per word as
// PostGallery.fixtures.ts reads it, a count no pose changes; and nothing
// scrolling sideways (§7). Bounded adds THE ENDS, read in one moment wherever
// the walk stands: previous dead exactly while the first card is centred, next
// exactly while the last is.

/** The eight cards — the owner's "8 instances". */
const CARDS = GALLERY_CARDS;

const GALLERY = ro.blog.article.gallery;

/** The carousel's words, the page's. */
const LABELS: CardCarouselLabels = {
  region: GALLERY.region,
  role: ro.common.carousel.role,
  slideRole: ro.common.carousel.slideRole,
  previous: GALLERY.previous,
  next: GALLERY.next,
  picker: GALLERY.picker,
};

/** „Fotografia 1 din 8" … — the page's ICU sentence, its two arguments
 *  filled the way the page's formatter fills them. */
const slideLabelsFor = (count: number): string[] =>
  Array.from({ length: count }, (_, index) =>
    GALLERY.slide
      .replace('{index}', String(index + 1))
      .replace('{total}', String(count)),
  );

const meta = {
  title: 'Sections/PostGallery',
  component: PostGallery,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Container>
        <div className="py-12">
          <div className="mx-auto flex w-full max-w-2xl flex-col">
            <Story />
          </div>
        </div>
      </Container>
    ),
  ],
  args: {
    cards: CARDS,
    mode: 'loop',
    labels: LABELS,
    slideLabels: slideLabelsFor(CARDS.length),
  },
  argTypes: {
    cards: {
      control: false,
      description:
        'The cards, in order — each a photograph (src, alt) and its caption, finished (§8.1)',
    },
    mode: {
      control: 'inline-radio',
      options: ['loop', 'bounded'],
      description:
        'Both move by themselves until a press stops them: „loop" wraps, the last card followed by the first; „bounded" walks out to the last card and back, turning round at each end',
    },
    labels: {
      control: 'object',
      description:
        'The region’s name, the two roledescriptions, the names of the previous and next arrows and the beads’ group name — finished by the page',
    },
    slideLabels: {
      control: false,
      description:
        'One finished name per card, in the same order („Fotografia 1 din 8") — its card’s name and its bead’s',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the region (§6.4/§6.8)',
    },
  },
} satisfies Meta<typeof PostGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The root's px per rem. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The scrim's alpha, read through the browser's own colour parser — the
 *  built stylesheet ships the token minified (#0000008c), which a text
 *  pattern could not read. */
function scrimAlpha(): number {
  const probe = document.createElement('span');
  probe.style.color = 'var(--scrim)';
  document.body.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return Number(/[\d.]+(?=\s*\)$)/.exec(computed)?.[0] ?? 'NaN');
}

/** WCAG's ratio of white words over white composited under black at `alpha`
 *  — the brightest pixel a photograph can put under the caption. */
function whiteOnScrim(alpha: number): number {
  const channel = Math.round(255 * (1 - alpha)) / 255;
  const linear =
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return 1.05 / (linear + 0.05);
}

/** The previous and next arrows of a region. */
const controlsOf = (region: HTMLElement) => ({
  previous: within(region).getByRole('button', { name: LABELS.previous }),
  next: within(region).getByRole('button', { name: LABELS.next }),
});

/** The beads' group of a region, named by the page's picker word. */
const beadsOf = (region: HTMLElement): HTMLElement =>
  within(region).getByRole('group', { name: LABELS.picker });

/** The stage: every card box's parent, and the carousel's live region. */
function stageOf(region: HTMLElement): HTMLElement {
  const stage = region.querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) {
    throw new Error('PostGallery story: the stage is missing');
  }
  return stage;
}

/** Every card box, in the list's order — the side cards included. */
const cardBoxes = (region: HTMLElement): HTMLElement[] =>
  [...region.querySelectorAll('[role="group"][aria-roledescription]')].filter(
    (box): box is HTMLElement => box instanceof HTMLElement,
  );

/** The card at the centre: the one box that is not inert. */
function centreOf(region: HTMLElement): HTMLElement {
  const centre = cardBoxes(region).find((box) => !box.hasAttribute('inert'));
  if (centre === undefined) throw new Error('no centre card');
  return centre;
}

/** `a` comes before `b` in the document. */
const precedes = (a: Node, b: Node): boolean =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

/**
 * THE ARROWS (CardCarousel.tsx's THE ARROWS): always visible, named by the
 * page's words, NOTHING PAINTED on their own boxes — a tall chevron on no
 * ground, no border — each a strip nine theme steps wide (`--bar`, 2.25rem)
 * and as tall as the cards (the centre card's box). Lengths of layout boxes,
 * which no pose changes.
 */
async function expectArrows(region: HTMLElement): Promise<void> {
  const { previous, next } = controlsOf(region);
  const cardHeight = parseFloat(getComputedStyle(centreOf(region)).height);
  for (const control of [previous, next]) {
    const name = control.getAttribute('aria-label') ?? '';
    await expect(control, name).toBeVisible();
    const style = getComputedStyle(control);
    await expect(style.backgroundColor, name).toBe('rgba(0, 0, 0, 0)');
    await expect(style.borderTopWidth, name).toBe('0px');
    await expect(style.borderLeftWidth, name).toBe('0px');
    const strip = control.getBoundingClientRect();
    await expect(
      Math.abs(strip.width - 2.25 * rem()),
      `${name}: nine theme steps wide, ${strip.width}px`,
    ).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs(strip.height - cardHeight),
      `${name}: as tall as the cards, ${strip.height}px against ${cardHeight}px`,
    ).toBeLessThanOrEqual(0.5);
  }
}

/**
 * THE BEADS (CardCarousel.tsx's THE BEADS) and THE ORDER: a group named by
 * the page's picker word, one bead per card named as its card, exactly one
 * current — the centred card's, read in ONE moment (the ring's tick writes
 * both in one commit); the region's only buttons previous, next, then the
 * beads, all before every card in the DOM; and every bead UNDER the stage —
 * below the cards and their room, never over a card.
 */
async function expectBeads(region: HTMLElement): Promise<void> {
  const { previous, next } = controlsOf(region);
  const labels = slideLabelsFor(CARDS.length);
  await expect(
    within(region)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label')),
    'the region’s buttons: previous, next, then the beads',
  ).toEqual([LABELS.previous, LABELS.next, ...labels]);
  const picker = beadsOf(region);
  const beads = within(picker).getAllByRole('button');
  await expect(beads.map((bead) => bead.getAttribute('aria-label'))).toEqual(
    labels,
  );
  const reading = {
    centre: centreOf(region).getAttribute('aria-label'),
    current: beads
      .filter((bead) => bead.getAttribute('aria-current') === 'true')
      .map((bead) => bead.getAttribute('aria-label')),
  };
  await expect(reading.current, 'the one current bead').toEqual([
    reading.centre,
  ]);
  await expect(precedes(previous, next), 'previous, then next').toBe(true);
  await expect(precedes(next, picker), 'the arrows, then the beads').toBe(true);
  for (const box of cardBoxes(region)) {
    await expect(precedes(picker, box), 'the beads before the cards').toBe(
      true,
    );
  }
  const stage = stageOf(region).getBoundingClientRect();
  for (const bead of beads) {
    await expect(
      bead.getBoundingClientRect().top,
      `${bead.getAttribute('aria-label') ?? ''}: under the stage`,
    ).toBeGreaterThanOrEqual(stage.bottom - 0.5);
  }
}

/**
 * The gallery's promise at the width the story has (the header's THE PLAYS).
 * Returns the region.
 */
async function expectGallery(canvasElement: HTMLElement): Promise<HTMLElement> {
  const captions = [...canvasElement.querySelectorAll('figcaption')];
  const first = captions[0];
  if (first === undefined) throw new Error('the gallery drew no caption');
  const face = getComputedStyle(first);
  await document.fonts.load(
    `${face.fontStyle} ${face.fontWeight} ${face.fontSize} ${face.fontFamily}`,
    captions.map((caption) => caption.textContent ?? '').join(' '),
  );
  await document.fonts.ready;

  // THE REGION: the page's name, its roledescription — then its arrows, its
  // beads and their order.
  const region = within(canvasElement).getByRole('region', {
    name: LABELS.region,
  });
  await expect(region).toHaveAttribute('aria-roledescription', LABELS.role);
  await expectArrows(region);
  await expectBeads(region);

  // EVERY CARD, in order: its slide label, its photo's alt, its caption.
  await expect(
    cardBoxes(region).map((box) => box.getAttribute('aria-label')),
  ).toEqual(slideLabelsFor(CARDS.length));
  await expect(captions.map((caption) => caption.textContent)).toEqual(
    CARDS.map((card) => card.caption),
  );
  await expect(
    [...region.querySelectorAll('figure img')].map((img) =>
      img.getAttribute('alt'),
    ),
  ).toEqual(CARDS.map((card) => card.image.alt));

  // EVERY CAPTION'S CONTRAST, off its own computed box: the words begin a
  // step below the fade, on the solid scrim, white at 4.5:1 or more over the
  // brightest pixel a photograph can put under them — and no word wider than
  // its card.
  const alpha = scrimAlpha();
  await expect(alpha).toBeGreaterThanOrEqual(0.55 - 1 / 255);
  await expect(whiteOnScrim(alpha)).toBeGreaterThanOrEqual(4.5);
  for (const caption of captions) {
    const style = getComputedStyle(caption);
    const fade = Number(
      /calc\(100% - ([\d.]+)px\)/.exec(style.backgroundImage)?.[1] ?? 'NaN',
    );
    await expect(fade).toBeCloseTo(4 * rem(), 3);
    await expect(parseFloat(style.paddingTop)).toBeGreaterThan(fade);
    await expect(style.color).toBe('rgb(255, 255, 255)');
    await expect(caption.scrollWidth).toBeLessThanOrEqual(caption.clientWidth);
  }

  // THE DOT STEP, at any width: the dot drawn exactly on a card of at least
  // 8.5 of its caption's ems — the figure's own font (GalleryCard's paragraph
  // of that name); a card's computed width is its layout's, which no pose
  // changes.
  for (const caption of captions) {
    const figure = caption.parentElement;
    if (!(figure instanceof HTMLElement)) {
      throw new Error('a caption with no card');
    }
    const box = getComputedStyle(figure);
    const ems = parseFloat(box.width) / parseFloat(box.fontSize);
    await expect(
      captionDotShown(caption),
      `the dot on a card of ${ems.toFixed(2)} ems`,
    ).toBe(ems >= 8.5);
  }

  // NO CAPTION WORD ON TWO LINES, wherever the ring stands each card.
  await expect(
    captions.flatMap((caption) =>
      captionUnitsAcrossLines(caption).map(
        (unit) => `„${unit}" in „${caption.textContent?.trim() ?? ''}"`,
      ),
    ),
  ).toEqual([]);

  // §7: nothing scrolls sideways.
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  return region;
}

/**
 * THE ENDS of a bounded list (the header's THE PLAYS), read in ONE moment
 * wherever its walk stands — the centred card and the two arrows' state from
 * the same commit: previous dead exactly while the first card is centred,
 * next exactly while the last is.
 */
async function expectEnds(region: HTMLElement): Promise<void> {
  const { previous, next } = controlsOf(region);
  const labels = slideLabelsFor(CARDS.length);
  const reading = {
    at: labels.indexOf(centreOf(region).getAttribute('aria-label') ?? ''),
    previous: previous.hasAttribute('disabled'),
    next: next.hasAttribute('disabled'),
  };
  await expect(reading.at, 'the centred card').toBeGreaterThanOrEqual(0);
  await expect(reading.previous, 'previous dead').toBe(reading.at === 0);
  await expect(reading.next, 'next dead').toBe(
    reading.at === labels.length - 1,
  );
}

/**
 * CIRCULAR — THE DEFAULT: the circular carousel, three cards in its window on
 * the line: the centre photograph straight and largest, its neighbours turned
 * and fading at the stage's edges, the eight going round.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvasElement }) => {
    await expectGallery(canvasElement);
  },
};

/** END TO END — the bounded list on the line: out to the last card and back
 *  to the first by itself, never wrapping. */
export const Bounded: Story = {
  globals: { locale: 'ro' },
  args: { mode: 'bounded' },
  play: async ({ canvasElement }) => {
    const region = await expectGallery(canvasElement);
    await expectEnds(region);
  },
};

/** ON A PHONE (390) — the three-card window over the phone's column, the
 *  arrows over the fade's outermost edge (the column keeps no margin to give
 *  them a room of their own). */
export const Smartphone390: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    await expectGallery(canvasElement);
  },
};

/** ON A LAPTOP (1536) — the article's 42rem measure, the centre card at the
 *  carousel's 20rem cap (unscaled here), the arrows beside the neighbours'
 *  whole fade, in the room the measure's margin gives them. */
export const Laptop1536: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    await expectGallery(canvasElement);
  },
};

/** THE 320 STRESS WIDTH (§7): the narrowest card the gallery draws — 155.8px
 *  behind the runner's 15px scrollbar gutter, its captions on the narrow
 *  step's 16px words, the dot drawn (8.66 of its ems, over THE DOT STEP),
 *  every word whole, none wider than its card, the arrows over the fade's
 *  outer edge, the beads under the cards, and no sideways scroll. */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ canvasElement }) => {
    await expectGallery(canvasElement);
  },
};
