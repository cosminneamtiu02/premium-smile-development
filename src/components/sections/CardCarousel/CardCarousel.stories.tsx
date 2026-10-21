import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { Image } from '@/components/ui/Image/Image';
import type { ClockEnv } from '@/lib/clock/clock';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import ro from '@/messages/ro.json';
import {
  CardCarousel,
  type CardCarouselLabels,
  type CardCarouselMode,
  type CardCarouselVisible,
} from './CardCarousel';
import { ARRANGEMENTS, OUTER_SHARE, STEP, poseAt } from './conveyor';
import { BOUNDED_RESISTANCE } from './drag';

// Sections/CardCarousel — the card carousel's workbench: the owner's FOUR
// instances (2026-10-16: "all must be instantiated. both with 3 and 5
// iteration *and must also have 8 instances*") — circular × 3 (ThreeCards),
// circular × 5 (FiveCards), end to end × 3 (BoundedThree) and end to end × 5
// (BoundedFive), each over the EIGHT gallery photographs — the two pinned
// widths the §13 matrix samples, the 320 stress width, the FIXED card
// (FixedWidth: a 14rem card in three columns, five asked for in each, the
// stage the column, a narrow one cut from the faded sides — the Home band's
// way since 2026-10-17, which retired the FULL-WIDTH story of the lifted cap
// with the option itself on 2026-10-20), the cards' ONE HEIGHT
// (UniformHeight: notes of unequal length, every box the tallest's), and
// five MOVING stories the pixel net never photographs (tag `no-visual`): the
// automatic move caught mid-glide, the hand, the bounded list's two ends, its
// ping-pong, and the controls pressed — the arrows and the beads, then the
// stop for good.
//
// ── THE DEMO CARD IS A STAND-IN (the owner: "always hold a card and i'll
// decide later on card"). It follows his screenshot — a portrait 3:4 card, the
// photograph filling it under the soft corner, a soft grey drop shadow, and
// the caption over the photo's bottom-left behind a small white dot — so the
// workbench shows the carousel the way he pictured it. It lives HERE, never
// in shipped code and never in a `.fixtures` module (the soft-corner census
// sweeps every source file but stories and tests). KEEP IN SYNC with
// sections/PostGallery/GalleryCard — the article's gallery card, this card
// made real; PostGallery.test.tsx pins the recipe (it reads `PhotoCard` and
// CAPTION from this file and fails the day the two part).
//   · The photographs are the eight gallery placeholders,
//     /images/demo/gallery-1.jpg … gallery-8.jpg (portrait crops, 1080 px
//     wide) — the owner's "8 fake photos" — with Romanian captions and alts
//     (the house default for stories, §15.7), the captions in the clinic's
//     voice (no superlative, no promise — CMSR).
//   · THE SHADOW is `shadow-xl`, Tailwind's default token the contact dialog
//     and the language banner already wear — no token minted; the stage keeps
//     room under the cards for its 40px (CardCarousel.tsx's THE ROOM).
//   · THE CAPTION'S CONTRAST, measured on the worst pixel (§9, SC 1.4.3): the
//     caption box is ONE gradient — the site's locked 0.55-black `--scrim`,
//     solid from the bottom up to 16 theme steps under the box's top and
//     fading out over those 16 steps into the photograph — and the words
//     begin one step BELOW the fade (`pt-17`), so not a letter sits on
//     anything lighter than the solid scrim. The fade is spelled in the THEME'S
//     step (`var(--spacing)*16`, 4rem at the default root), never as 4rem:
//     inside THE BAND SCALE (§15.32) the padding is a theme step and scales,
//     and a 4rem fade let the first line slip into the light part of the
//     gradient below a design pixel of ≈ 0.94 (GalleryCard.tsx's THE FIRST).
//     And the caption wears `wrap-anywhere` beside `hyphens-none`: under SC
//     1.4.12's text spacing „Instrumentele de lucru" ran 179px wide in a 156–
//     164px card (GalleryCard.tsx's THE SECOND); the belt breaks only a word
//     wider than its whole line, and nothing at ordinary spacing. The brightest pixel a photograph can put under them is then white
//     under 0.55 black, rgb(115 115 115), and white 18px text on it reads
//     4.74:1 — the §15.21 Hero's own 4.77 arithmetic, rounded on the
//     composited channel. ONE gradient and not a solid box under a separate
//     fade: two boxes meeting at a transformed card's fractional edge drew a
//     light hairline between them in WebKit (seen in this lane's screenshots).
//     `expectCaptionContrast` re-derives the ratio from the computed token and
//     checks the words' place in every visual story.
//   · THE PICTURE HINT follows the card: 20rem at most, the cap the card is
//     held at (CardCarousel.tsx's THE CARD CAP).
//
// ── THE PLAYS MEASURE THE CONVEYOR (CardCarousel.tsx's THE GEOMETRY;
// ./conveyor's header) WHEREVER THE RING STANDS: the visual stories run the
// product's rhythm (the owner watches them move in the workbench), so a play
// reads the carousel AT REST — `atRest` waits for the glides and the beads'
// fades to end and takes the reading again if one began while it read — and
// finds each card's slot from the pose the island wrote, never from which card
// is centred. THE LINE IN BOTH WINDOWS: the stage the window's cards and THE
// BARS' ROOM — a strip's width a side for five, as much of one as the column's
// margin allows for three — the outermost pair 40 % inside the cards' window,
// to 2px, under the mask, and of that 40 % all of it beside the strip wherever
// the room is a whole strip; the centre card straight and whole, each
// outermost card turned with its outer edge away, every card's vertical centre
// on one line and every card upright (the owner: "all cards centers must sit
// on that line and all must stand up right"). The window the root's width
// asks for (the five-card floor, 12rem, after the strips' room) and no
// sideways scroll. Width-agnostic, so the runner may open a story at any
// size. The pixel net runs with reduced motion, under which lib/clock never
// starts the ring: it photographs the first card centred, by construction.
//
// ── THE CONTROLS (CardCarousel.tsx's THE ARROWS and THE BEADS): every story
// shows the two arrows and the beads, and the visual plays check them — the
// arrows at the stage's two edges, as tall as the cards' row, nothing painted
// but a tall chevron against each strip's outer edge, lilac, grey when the
// arrow cannot be pressed; the beads one per card under the stage, the
// centred card's the lilac pill — and Controls presses them: the ring steps,
// and then stays.
//
// ── THE FRAMES. layout 'fullscreen' with the article's own frame by default —
// ui/Container's gutter and the post's 42rem measure (sections/PostPage) —
// because the gallery's place is inside an article, and the window it shows
// depends on that width. At that measure `visible: 5` shows THREE (its switch
// is a 705.5px column), so the five-card stories take a WIDE frame, 64rem —
// five from the laptop up, three on a phone — and FixedWidth no frame of
// ours: it draws its own three. The wide frame's measure is an inline style,
// never a class: no product file wears one that wide, and a class spelled
// here alone would ship a CSS rule nothing on the site uses (Tailwind reads
// the stories too).

/** One demo card: a picture under its caption. */
type DemoCard = Readonly<{ src: ImagePath; alt: string; caption: string }>;

const DEMO: readonly DemoCard[] = [
  {
    src: '/images/demo/gallery-1.jpg',
    alt: 'Holul clinicii și ușa deschisă a unui cabinet, prin care se vede scaunul stomatologic mov',
    caption: 'Ușa cabinetului',
  },
  {
    src: '/images/demo/gallery-2.jpg',
    alt: 'Două fotolii galbene în fața unui perete cu un model rotund în relief și, în prim-plan, o canapea galbenă',
    caption: 'Sala de așteptare',
  },
  {
    src: '/images/demo/gallery-3.jpg',
    alt: 'Sertare albe, aparate mici și un scaun mov într-un cabinet',
    caption: 'Masa de lucru',
  },
  {
    src: '/images/demo/gallery-4.jpg',
    alt: 'Un scaun mov sub lampă și, pe peretele mov, un ecran cu o radiografie panoramică',
    caption: 'Scaunul stomatologic',
  },
  {
    src: '/images/demo/gallery-5.jpg',
    alt: 'Prim-plan cu un instrument subțire și o piesă de mână, suspendate pe brațul unității dentare',
    caption: 'Instrumentele de lucru',
  },
  {
    src: '/images/demo/gallery-6.jpg',
    alt: 'Prim-plan cu două piese de mână argintii, una cu un inel roșu, lângă un vârf de culoare bej',
    caption: 'Piesele de mână',
  },
  {
    src: '/images/demo/gallery-7.jpg',
    alt: 'Un pacient cu ochii închiși, cu oglinda ținută lângă dinți',
    caption: 'Oglinda dentară',
  },
  {
    src: '/images/demo/gallery-8.jpg',
    alt: 'Mâini în mănuși țin o sondă cu mâner portocaliu lângă dinții unui pacient',
    caption: 'La control',
  },
];

/** The demo card's picture hint: never wider than the carousel's 20rem cap,
 *  about half a phone's width below it. A stand-in's estimate — the real card
 *  derives its own. */
const PHOTO_SIZES = '(min-width: 40rem) 20rem, 52vw';

/** The caption: ONE gradient, the solid scrim under the words and a 16-step
 *  fade into the photograph above them (the header's THE CAPTION'S CONTRAST)
 *  — `pt-17` puts the words a step below the fade — the belt for a word
 *  wider than its line, and on a card under 10 of its ems the narrow step,
 *  16px words and 12px a side, so no word is cut on a 320 phone's card
 *  (GalleryCard's THE CAPTION NEVER SPLITS A WORD — „Instrumentele" was).
 *  KEEP IN SYNC with sections/PostGallery/GalleryCard — PostGallery.test.tsx
 *  pins the recipe. */
const CAPTION =
  'absolute inset-x-0 bottom-0 flex items-center gap-2 bg-[linear-gradient(to_top,var(--scrim)_calc(100%_-_var(--spacing)*16),transparent)] px-4 pt-17 pb-4 text-lg font-medium text-ink-inverse hyphens-none wrap-anywhere @max-[10em]:text-base @max-[10em]:px-3';

/** THE DEMO CARD (the header): his screenshot's portrait photo card — its
 *  caption's container at the caption's own step (`@container text-lg`, so
 *  the narrow step reads the card in the caption's ems). KEEP IN SYNC with
 *  sections/PostGallery/GalleryCard — PostGallery.test.tsx pins the recipe.
 *  Under 8.5 ems the dot drops (GalleryCard's THE CAPTION NEVER SPLITS A WORD). */
function PhotoCard({ src, alt, caption }: DemoCard) {
  return (
    <figure className="relative aspect-[3/4] overflow-hidden rounded-soft bg-line-subtle shadow-xl @container text-lg">
      <Image
        src={src}
        alt={alt}
        variant="plain"
        fill
        sizes={PHOTO_SIZES}
        className="object-cover"
      />
      <figcaption className={CAPTION}>
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-ink-inverse @max-[8.5em]:hidden"
        />
        {caption}
      </figcaption>
    </figure>
  );
}

const SLIDES = DEMO.map((card) => <PhotoCard key={card.caption} {...card} />);

/** How many cards every story's ring holds — the owner's "8 instances". */
const COUNT = SLIDES.length;

/** „1 din 8" … — the finished names a page would hand over. */
const slideLabelsFor = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${index + 1} din ${count}`);

/** The demo's words: the house's two roledescriptions from the real
 *  messages (common.carousel.*), the rest a stand-in's placeholders. */
const LABELS: CardCarouselLabels = {
  region: 'Galeria clinicii',
  role: ro.common.carousel.role,
  slideRole: ro.common.carousel.slideRole,
  previous: 'Cardul anterior',
  next: 'Cardul următor',
  picker: 'Alege fotografia',
};

/** A browser that asks for less motion, as far as lib/clock can tell: the
 *  ring never starts, so the hand is the only thing that moves it. The CSS
 *  half of the preference is the real one — the glides still run. */
const STILL: ClockEnv = {
  prefersReducedMotion: () => true,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
};

/** A browser that asks for motion and shows the tab, whatever the runner's
 *  own preference — the ping-pong's play must see the ring move. */
const MOVING: ClockEnv = {
  prefersReducedMotion: () => false,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
};

/** What a story chooses: the two axes, and — for the moving stories only —
 *  the clock's seams. */
type DemoProps = Readonly<{
  mode: CardCarouselMode;
  visible: CardCarouselVisible;
  env?: ClockEnv;
  intervalMs?: number;
  startDelayMs?: number;
}>;

/**
 * The workbench's carousel: the eight demo cards with their names, in the mode
 * and the window a story asks for, on the product's own rhythm unless a story
 * passes the clock's seams.
 */
function CardCarouselDemo({
  mode,
  visible,
  env,
  intervalMs,
  startDelayMs,
}: DemoProps) {
  return (
    <CardCarousel
      slides={SLIDES}
      slideLabels={slideLabelsFor(COUNT)}
      labels={LABELS}
      visible={visible}
      mode={mode}
      env={env}
      intervalMs={intervalMs}
      startDelayMs={startDelayMs}
    />
  );
}

/** THE FRAMES (the header): the article's 42rem measure, a 64rem column wide
 *  enough for five, or none — the whole canvas. */
type Frame = 'article' | 'wide' | 'bleed';

/** Each frame's measure — the article's the post's own class (sections/
 *  PostPage wears it), the wide one an inline 64rem (THE FRAMES). */
const FRAME_WIDTH: Readonly<
  Record<Exclude<Frame, 'bleed'>, { className?: string; style?: CSSProperties }>
> = {
  article: { className: 'max-w-2xl' },
  wide: { style: { maxWidth: '64rem' } },
};

const meta = {
  title: 'Sections/CardCarousel',
  component: CardCarouselDemo,
  parameters: { layout: 'fullscreen', frame: 'article' },
  decorators: [
    (Story, { parameters }) => {
      const frame: Frame = parameters.frame ?? 'article';
      if (frame === 'bleed') {
        return (
          <div className="py-12">
            <Story />
          </div>
        );
      }
      return (
        <Container className="py-12">
          <div
            className={cx('mx-auto w-full', FRAME_WIDTH[frame].className)}
            style={FRAME_WIDTH[frame].style}
          >
            <Story />
          </div>
        </Container>
      );
    },
  ],
  args: { mode: 'loop', visible: 3 },
  argTypes: {
    env: { control: false },
    intervalMs: { control: false },
    startDelayMs: { control: false },
    mode: { control: 'inline-radio', options: ['loop', 'bounded'] },
    visible: { control: 'inline-radio', options: [3, 5] },
  },
} satisfies Meta<typeof CardCarouselDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── THE MEASURING KIT ──────────────────────────────────────────────────────

/** Load the caption's real face before anything is measured (the house rule:
 *  `font-display: block` lays text out in a fallback until it arrives). */
async function loadFace(root: HTMLElement): Promise<void> {
  const caption = root.querySelector('figcaption');
  if (caption) {
    const style = getComputedStyle(caption);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      caption.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** No width may make the page scroll sideways (§7). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
}

/** The carousel's region. */
const regionOf = (root: HTMLElement): HTMLElement =>
  within(root).getByRole('region', { name: LABELS.region });

/** The stage: every card's parent, and the live region. */
function stageOf(root: HTMLElement): HTMLElement {
  const stage = regionOf(root).querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) {
    throw new Error('CardCarousel story: the stage is missing');
  }
  return stage;
}

/** Every card box, in the list's order. */
const cardsOf = (stage: HTMLElement): HTMLElement[] =>
  [...stage.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

/** The card at the centre: the one that is not inert. */
function centreOf(stage: HTMLElement): HTMLElement {
  const centre = cardsOf(stage).find((card) => !card.hasAttribute('inert'));
  if (centre === undefined) {
    throw new Error('CardCarousel story: no card is at the centre');
  }
  return centre;
}

/** A card's pose, read back off its own box: `--tx` in card widths, `--ry`
 *  in degrees. */
const shiftOf = (card: HTMLElement): number =>
  Number(card.style.getPropertyValue('--tx'));
const turnOf = (card: HTMLElement): number =>
  Number(card.style.getPropertyValue('--ry'));

/** A box's vertical centre. */
const middle = (rect: DOMRect): number => (rect.top + rect.bottom) / 2;

/** A card box's LAYOUT width — exact, where offsetWidth rounds to a whole
 *  pixel (the box is posed by a transform, so its drawn rect is no help). */
const widthOf = (card: HTMLElement): number =>
  parseFloat(getComputedStyle(card).width);

/** A point, px. */
type Point = readonly [x: number, y: number];

/** A point of a card's own box (px from its centre) where it is DRAWN, px
 *  from where its centre is laid out — through its computed transform. */
function drawnPoint(card: HTMLElement, x: number, y: number): Point {
  const matrix = new DOMMatrix(getComputedStyle(card).transform);
  const point = matrix.transformPoint(new DOMPoint(x, y, 0, 1));
  return [point.x / point.w, point.y / point.w];
}

/**
 * Where a card's own centre point is DRAWN, relative to where it is laid out:
 * the projected shift. Its drawn RECT is no measure of it — a turned card's
 * near edge projects further out than its far edge comes in, so the box's
 * middle leans towards the near side.
 */
const shiftDrawn = (card: HTMLElement): number => drawnPoint(card, 0, 0)[0];

/** A card's DRAWN outline, px from its layout centre: its own box's four
 *  corners through its transform — top left, top right, bottom right,
 *  bottom left. */
function drawnOutline(card: HTMLElement): Point[] {
  const halfWidth = widthOf(card) / 2;
  const halfHeight = parseFloat(getComputedStyle(card).height) / 2;
  const corners: readonly Point[] = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ];
  return corners.map(([x, y]) => drawnPoint(card, x, y));
}

/** How far a card's vertical edges lean, px: zero for a card standing
 *  upright — never rolled in the screen's plane. */
function leanOf(card: HTMLElement): number {
  const [topLeft, topRight, bottomRight, bottomLeft] = drawnOutline(card);
  return Math.max(
    Math.abs(topLeft[0] - bottomLeft[0]),
    Math.abs(topRight[0] - bottomRight[0]),
  );
}

/**
 * The drawn heights of a card's two vertical edges, projected through its own
 * computed transform (the origin is the box's centre): a card turned with its
 * outer edge away draws that edge SHORTER.
 */
function edgeHeights(card: HTMLElement): Readonly<{
  left: number;
  right: number;
}> {
  const halfWidth = widthOf(card) / 2;
  const halfHeight = parseFloat(getComputedStyle(card).height) / 2;
  const y = (x: number, top: number): number => drawnPoint(card, x, top)[1];
  return {
    left: y(-halfWidth, halfHeight) - y(-halfWidth, -halfHeight),
    right: y(halfWidth, halfHeight) - y(halfWidth, -halfHeight),
  };
}

/** Wait one frame. */
const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

/**
 * Read the carousel AT REST: every glide and every bead's fade finished, and
 * none begun while the reading was taken (a tick of the running ring can land
 * between the wait and the read; the reading is then taken again).
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
  throw new Error('CardCarousel story: the carousel never came to rest');
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

/** The root's px per rem. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** An arrow's strip: nine theme steps and never under 24px, `--bar`
 *  (CardCarousel.tsx's THE BARS' ROOM, BAR). */
const barWidth = (): number => Math.max(24, 2.25 * rem());

/**
 * Which window the root's width asks for (CardCarousel.tsx's THE FIVE-CARD
 * FALLBACK): five only while a five-card card would be at least 12rem — the
 * card being the root's width less two strips ÷ the five-card ratio (the
 * 20rem cap, when there is one, is over the floor and changes nothing here).
 */
function windowFor(root: HTMLElement, visible: 3 | 5): 3 | 5 {
  if (visible === 3) return 3;
  const five = (root.clientWidth - 2 * barWidth()) / ARRANGEMENTS[5].ratio;
  return five >= 12 * rem() ? 5 : 3;
}

/** One card, as a reading holds it. */
type CardReading = Readonly<{
  card: HTMLElement;
  rect: DOMRect;
  shift: number;
  turn: number;
  centred: boolean;
}>;

/** The card a reading holds at signed slot `slot`, found by the pose the
 *  island wrote — undefined where a bounded list's place is empty. */
function slotIn(
  cards: readonly CardReading[],
  slot: number,
): CardReading | undefined {
  const pose = poseAt(slot);
  return cards.find((entry) => entry.shift === pose.tx);
}

/**
 * THE CONVEYOR, MEASURED (the header), wherever the ring stands: the window,
 * the centre card, the outermost pair, the line — every card's centre on one
 * horizontal line, every card upright — and the mask.
 */
async function expectConveyor(
  canvasElement: HTMLElement,
  visible: 3 | 5,
): Promise<void> {
  const region = regionOf(canvasElement);
  const stage = stageOf(canvasElement);
  const shown = windowFor(region, visible);
  // Five's fallback IS the three-card window (./conveyor's FIVE_FALLBACK).
  const arrangement = ARRANGEMENTS[shown];
  const reading = await atRest(region, () => ({
    stage: stage.getBoundingClientRect(),
    width: widthOf(cardsOf(stage)[0]),
    cards: cardsOf(stage).map((card): CardReading => ({
      card,
      rect: card.getBoundingClientRect(),
      shift: shiftOf(card),
      turn: turnOf(card),
      centred: !card.hasAttribute('inert'),
    })),
  }));
  const { width } = reading;

  // THE WINDOW: the stage is the window's ratio of card widths and THE BARS'
  // ROOM — a strip a side for five; for three, as much of one as the
  // column's margin allows — the card never wider than the 20rem cap.
  const bar = barWidth();
  const inset = (reading.stage.width - arrangement.ratio * width) / 2;
  const room =
    shown === 5
      ? bar
      : Math.min(bar, (region.clientWidth - arrangement.ratio * width) / 2);
  await near(inset, room, 1, `the ${shown}-card stage's strips' room`);
  await expect(width).toBeLessThanOrEqual(20 * rem() + 0.5);

  // THE CENTRE: undrawn-size, whole, straight.
  const centre = reading.cards.find((entry) => entry.centred);
  if (centre === undefined) throw new Error('no centred card');
  await near(centre.shift, 0, 0, 'the centre card’s shift');
  await near(centre.turn, 0, 0, 'the centre card’s turn');
  await near(centre.rect.width, width, 0.5, 'the centre card’s width');
  const centreEdges = edgeHeights(centre.card);
  await near(centreEdges.left, centreEdges.right, 0.5, 'a straight card');
  await expect(centre.rect.left).toBeGreaterThanOrEqual(reading.stage.left);
  await expect(centre.rect.right).toBeLessThanOrEqual(reading.stage.right);

  // THE OUTERMOST PAIR: 40 % of each drawn box inside the cards' window — the
  // stage less its strips' room — 60 % past it; and of the 40 % what the
  // strip leaves: all of it where the room is a whole strip, the rest where
  // the column had less to give (a phone: the arrow over the fade's outer
  // edge). On each side that has a card (a bounded list at an end has none
  // on one).
  const outer = shown === 3 ? 1 : 2;
  const right = slotIn(reading.cards, outer);
  const left = slotIn(reading.cards, -outer);
  if (right === undefined && left === undefined) {
    throw new Error(`no card at ±${outer}`);
  }
  const covered = Math.max(0, bar - inset);
  if (right !== undefined) {
    await near(
      reading.stage.right - inset - right.rect.left,
      OUTER_SHARE * right.rect.width,
      2,
      'the right card’s 40 %',
    );
    await near(
      reading.stage.right - bar - right.rect.left,
      OUTER_SHARE * right.rect.width - covered,
      2,
      'the right card beside its strip',
    );
    // Turned with its OUTER edge away.
    const edges = edgeHeights(right.card);
    await expect(edges.left).toBeGreaterThan(edges.right + 1);
  }
  if (left !== undefined) {
    await near(
      left.rect.right - (reading.stage.left + inset),
      OUTER_SHARE * left.rect.width,
      2,
      'the left card’s 40 %',
    );
    await near(
      left.rect.right - (reading.stage.left + bar),
      OUTER_SHARE * left.rect.width - covered,
      2,
      'the left card beside its strip',
    );
    const edges = edgeHeights(left.card);
    await expect(edges.right).toBeGreaterThan(edges.left + 1);
  }

  // THE LINE: every card's vertical centre the same, to a pixel, and every
  // card upright — its vertical edges drawn vertical.
  const centres = reading.cards.map((entry) => middle(entry.rect));
  await near(
    Math.max(...centres) - Math.min(...centres),
    0,
    1,
    'the cards’ vertical centres',
  );
  for (const entry of reading.cards) {
    await near(
      leanOf(entry.card),
      0,
      0.01,
      `the card at ${entry.shift}: upright`,
    );
  }

  // THE FADE: the stage wears its mask.
  const style = getComputedStyle(stage);
  await expect(
    `${style.maskImage} ${style.getPropertyValue('-webkit-mask-image')}`,
  ).toMatch(/linear-gradient/);
}

/**
 * THE CAPTION'S CONTRAST (the header): the centre card's words lie wholly
 * below the caption's 4rem fade, on the solid scrim — so the worst pixel under
 * them is white composited under the scrim's alpha, and white text on that
 * reads at least 4.5:1.
 */
async function expectCaptionContrast(root: HTMLElement): Promise<void> {
  const stage = stageOf(root);
  const caption = await atRest(regionOf(root), () =>
    centreOf(stage).querySelector('figcaption'),
  );
  const words = caption?.lastChild;
  if (
    caption === null ||
    caption === undefined ||
    words === null ||
    words === undefined
  ) {
    throw new Error('no caption');
  }
  await expect(getComputedStyle(caption).backgroundImage).toMatch(
    /linear-gradient/,
  );
  const range = document.createRange();
  range.selectNodeContents(words);
  const top =
    range.getBoundingClientRect().top - caption.getBoundingClientRect().top;
  // The fade's depth, 16 theme steps, measured in the caption's own step.
  const depth = document.createElement('div');
  depth.style.height = 'calc(var(--spacing) * 16)';
  depth.style.position = 'absolute';
  caption.append(depth);
  const fade = depth.getBoundingClientRect().height;
  depth.remove();
  await expect(fade).toBeGreaterThan(0);
  await expect(top).toBeGreaterThanOrEqual(fade);
  // The token itself, rgb(0 0 0 / 0.55), read through the browser's own colour
  // parser — never as the authored text: the BUILT stylesheet ships it
  // minified as #0000008c (alpha 140/255 = 0.549), which a text pattern cannot
  // read (it returned NaN in the static Storybook), so the floor allows that
  // one 8-bit step.
  const probe = document.createElement('span');
  probe.style.color = 'var(--scrim)';
  document.body.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const alpha = Number(/[\d.]+(?=\s*\)$)/.exec(computed)?.[0] ?? 'NaN');
  await expect(alpha).toBeGreaterThanOrEqual(0.55 - 1 / 255);
  // White under black at `alpha`, composited per channel, then WCAG's ratio.
  const channel = Math.round(255 * (1 - alpha)) / 255;
  const linear =
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  const ratio = 1.05 / (linear + 0.05);
  await expect(ratio).toBeGreaterThanOrEqual(4.5);
  await expect(getComputedStyle(caption).color).toBe('rgb(255, 255, 255)');
}

/** The previous and next arrows. */
const controlsOf = (root: HTMLElement) => ({
  previous: within(regionOf(root)).getByRole('button', {
    name: LABELS.previous,
  }),
  next: within(regionOf(root)).getByRole('button', { name: LABELS.next }),
});

/** The site's ink — a DISABLED arrow's colour, its line at half strength. */
const INK = 'rgb(43, 39, 36)';

/**
 * THE ARROWS (CardCarousel.tsx): VISIBLE — named, over the stage's two
 * edges, as tall as the cards' row (the stage's content box, between its top
 * padding and its room), above the cards — NOTHING PAINTED but a tall chevron
 * (1.5rem × 9rem, against its strip's outer edge, half a theme step in), the
 * lilac where the arrow can be pressed, the ink with its line at half strength
 * — grey — where it cannot. Read at rest.
 */
async function expectControls(root: HTMLElement): Promise<void> {
  const stage = stageOf(root);
  const { previous, next } = controlsOf(root);
  const reading = await atRest(regionOf(root), () => {
    const box = stage.getBoundingClientRect();
    const style = getComputedStyle(stage);
    return {
      box,
      top: box.top + parseFloat(style.paddingTop),
      bottom: box.bottom - parseFloat(style.paddingBottom),
      previous: previous.getBoundingClientRect(),
      next: next.getBoundingClientRect(),
    };
  });
  await near(reading.previous.left, reading.box.left, 0.5, 'previous’s edge');
  await near(reading.next.right, reading.box.right, 0.5, 'next’s edge');
  for (const [name, strip] of [
    ['previous', reading.previous],
    ['next', reading.next],
  ] as const) {
    await near(strip.width, barWidth(), 0.5, `${name}: nine theme steps wide`);
    await near(strip.top, reading.top, 0.5, `${name}: the row’s top`);
    await near(strip.bottom, reading.bottom, 0.5, `${name}: the row’s bottom`);
  }
  for (const control of [previous, next]) {
    await expect(control).toBeVisible();
    const glyphs = control.querySelectorAll('svg');
    await expect(glyphs).toHaveLength(1);
    const style = getComputedStyle(control);
    await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(style.borderLeftWidth).toBe('0px');
    await expect(style.borderTopWidth).toBe('0px');
    const strip = control.getBoundingClientRect();
    const glyph = glyphs[0].getBoundingClientRect();
    await near(glyph.width, 1.5 * rem(), 0.5, 'the chevron’s width');
    await near(
      glyph.height,
      Math.min(9 * rem(), strip.height),
      0.5,
      'the chevron’s height',
    );
    await near(
      control === previous
        ? glyph.left - strip.left
        : strip.right - glyph.right,
      0.125 * rem(),
      0.5,
      'the chevron against its strip’s outer edge, half a theme step in',
    );
    await near(
      glyph.top + glyph.height / 2,
      strip.top + strip.height / 2,
      0.5,
      'the chevron centred down its strip',
    );
    await expect(getComputedStyle(glyphs[0]).opacity).toBe('1');
    const line = glyphs[0].querySelectorAll('path')[1];
    await expect(getComputedStyle(line).opacity).toBe(
      control.matches(':disabled') ? '0.5' : '1',
    );
    if (control.matches(':hover')) continue;
    await expect(style.color).toBe(control.matches(':disabled') ? INK : PILL);
    const top = document.elementFromPoint(
      strip.left + strip.width / 2,
      strip.top + strip.height / 2,
    );
    await expect(control.contains(top)).toBe(true);
  }
}

/** The lilac — the current bead's pill and an enabled arrow's chevron — and
 *  the grey dot, as the engine computes them. */
const PILL = 'rgb(116, 104, 148)';
const DOT = 'rgb(118, 111, 105)';

/**
 * THE BEADS (CardCarousel.tsx): a group named by the picker word, one bead
 * per card named as its card, in a row centred under the stage below its
 * room; exactly one current — the centred card's — its dot the lilac 28px
 * pill, the others 8px grey dots. Read at rest.
 */
async function expectBeads(root: HTMLElement): Promise<void> {
  const region = regionOf(root);
  const stage = stageOf(root);
  const picker = within(region).getByRole('group', { name: LABELS.picker });
  const beads = within(picker).getAllByRole('button');
  await expect(beads.map((bead) => bead.getAttribute('aria-label'))).toEqual(
    slideLabelsFor(COUNT),
  );
  const reading = await atRest(region, () => ({
    centre: centreOf(stage).getAttribute('aria-label'),
    current: beads
      .filter((bead) => bead.getAttribute('aria-current') === 'true')
      .map((bead) => bead.getAttribute('aria-label')),
    stage: stage.getBoundingClientRect(),
    row: beads.map((bead) => bead.getBoundingClientRect()),
    dots: beads.map((bead) => {
      const dot = bead.querySelector('span');
      if (dot === null) throw new Error('a bead lost its dot');
      return {
        rect: dot.getBoundingClientRect(),
        colour: getComputedStyle(dot).backgroundColor,
        hovered: bead.matches(':hover'),
        current: bead.getAttribute('aria-current') === 'true',
      };
    }),
  }));
  await expect(reading.current).toEqual([reading.centre]);
  const left = Math.min(...reading.row.map((rect) => rect.left));
  const right = Math.max(...reading.row.map((rect) => rect.right));
  await near(
    (left + right) / 2,
    reading.stage.left + reading.stage.width / 2,
    1,
    'the beads centred under the stage',
  );
  for (const rect of reading.row) {
    await expect(rect.top).toBeGreaterThanOrEqual(reading.stage.bottom - 0.5);
  }
  for (const dot of reading.dots) {
    await near(dot.rect.height, 0.5 * rem(), 0.5, 'a dot’s height');
    await near(
      dot.rect.width,
      (dot.current ? 1.75 : 0.5) * rem(),
      0.5,
      'a dot’s width',
    );
    if (!dot.hovered) await expect(dot.colour).toBe(dot.current ? PILL : DOT);
  }
}

/**
 * A hand on the stage: pressed at its middle, moved `dx` sideways in two
 * steps, then — after `holdMs` — let go there. Synthetic pointer events, as a
 * mouse would send them.
 */
async function dragBy(
  stage: HTMLElement,
  dx: number,
  holdMs = 0,
): Promise<void> {
  const box = stage.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const init = {
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientY: box.top + box.height / 2,
  };
  fireEvent.pointerDown(stage, { ...init, clientX: x });
  fireEvent.pointerMove(stage, { ...init, clientX: x + dx / 2 });
  fireEvent.pointerMove(stage, { ...init, clientX: x + dx });
  await frame();
  if (holdMs > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, holdMs);
    });
  }
  fireEvent.pointerUp(stage, { ...init, buttons: 0, clientX: x + dx });
  await frame();
}

/** px per step of the line: ./conveyor's STEP card widths. */
const pitchOf = (stage: HTMLElement): number =>
  STEP * widthOf(cardsOf(stage)[0]);

/** The centre card's name, once the carousel has come to rest. */
const restingCentre = (stage: HTMLElement): Promise<string | null> =>
  atRest(stage.closest('section') ?? stage, () =>
    centreOf(stage).getAttribute('aria-label'),
  );

/** The list position a „3 din 8" label names: 2. */
const positionIn = (label: string | null): number =>
  Number(/^(\d+) din/.exec(label ?? '')?.[1] ?? Number.NaN) - 1;

/**
 * THE BOUNDED LIST, MEASURED wherever its walk stands: every card at its
 * plain distance from the centred one (no wrap — the places beyond the ends
 * empty), and previous disabled exactly at the first card, next exactly at the
 * last.
 */
async function expectTrackStop(canvasElement: HTMLElement): Promise<void> {
  const stage = stageOf(canvasElement);
  const { previous, next } = controlsOf(canvasElement);
  const reading = await atRest(regionOf(canvasElement), () => ({
    at: positionIn(centreOf(stage).getAttribute('aria-label')),
    shifts: cardsOf(stage).map(shiftOf),
    previous: previous.hasAttribute('disabled'),
    next: next.hasAttribute('disabled'),
  }));
  await expect(Number.isInteger(reading.at)).toBe(true);
  await expect(reading.previous).toBe(reading.at === 0);
  await expect(reading.next).toBe(reading.at === COUNT - 1);
  for (const [card, shift] of reading.shifts.entries()) {
    await expect(shift).toBe(poseAt(card - reading.at).tx);
  }
}

// ── THE STORIES ────────────────────────────────────────────────────────────

/**
 * CIRCULAR × 3 — THE DEFAULT: the circular carousel with three cards in its
 * window: the centre card straight, its two neighbours smaller and turned,
 * 60 % past the stage's edges and fading out, a tall chevron at each edge and
 * the beads under the cards. In the workbench it moves on by itself, a first
 * move after 1.5 s and one every 5.5 s, round the eight cards — after the
 * last, the first comes in from the right — until a press stops it.
 */
export const ThreeCards: Story = {
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const region = regionOf(canvasElement);
    await expect(region).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
    await expect(cardsOf(stageOf(canvasElement))).toHaveLength(COUNT);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 3);
    await expectCaptionContrast(canvasElement);
    await expectNoSidewaysScroll();
  },
};

/**
 * CIRCULAR × 5 — five cards in the window, on the same line: the centre
 * straight, its two neighbours whole, the next pair the faded one — "just a
 * wider section" — in a 64rem frame wide enough for five. Under a 705.5px
 * column, three show.
 */
export const FiveCards: Story = {
  args: { visible: 5 },
  parameters: { frame: 'wide' },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expect(cardsOf(stageOf(canvasElement))).toHaveLength(COUNT);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 5);
    await expectCaptionContrast(canvasElement);
    await expectNoSidewaysScroll();
  },
};

/** END TO END × 3 — the bounded list: out to the last card and back to the
 *  first, one card every 5.5 s, never wrapping. */
export const BoundedThree: Story = {
  args: { mode: 'bounded' },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectTrackStop(canvasElement);
    await expectConveyor(canvasElement, 3);
    await expectNoSidewaysScroll();
  },
};

/** END TO END × 5 — the bounded list, five in the window, in the wide
 *  frame. */
export const BoundedFive: Story = {
  args: { mode: 'bounded', visible: 5 },
  parameters: { frame: 'wide' },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectTrackStop(canvasElement);
    await expectConveyor(canvasElement, 5);
    await expectNoSidewaysScroll();
  },
};

/** A phone: three cards over the article's column. */
export const SmartphoneThree: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 3);
    await expectNoSidewaysScroll();
  },
};

/** A phone asked for five: a five-card card would be under 12rem, so the
 *  three-card window shows — on the same line. */
export const SmartphoneFive: Story = {
  args: { visible: 5 },
  parameters: { frame: 'wide' },
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expect(windowFor(regionOf(canvasElement), 5)).toBe(3);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 5);
    await expectNoSidewaysScroll();
  },
};

/** A laptop: three cards, the centre one at the 20rem cap and the stage
 *  centred in the measure. */
export const LaptopThree: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 3);
    await expectNoSidewaysScroll();
  },
};

/** A laptop asked for five: the 64rem frame holds five cards of 288.5px and
 *  the strips' room beside them. */
export const LaptopFive: Story = {
  args: { visible: 5 },
  parameters: { frame: 'wide' },
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expect(windowFor(regionOf(canvasElement), 5)).toBe(5);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 5);
    await expectNoSidewaysScroll();
  },
};

/** The 320px accessibility width (§7): five asked for, three shown, a
 *  readable centre card, both arrows, the beads, and the page never scrolls
 *  sideways. */
export const Stress320: Story = {
  args: { visible: 5 },
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  tags: ['stress-320'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    await expectConveyor(canvasElement, 5);
    await expectNoSidewaysScroll();
  },
};

/** THE FIXED CARD's card (CardCarousel.tsx): 14rem — 56 theme steps. */
const FIXED_CARD = 'calc(var(--spacing)*56)';

/** THE FIXED CARD's frames, px: a wide column (more room a side than a
 *  strip), one a little wider than the five-card window (a sliver of room),
 *  and a phone's (no room — the sides cut from the fade). */
const FIXED_FRAMES = [1106, 776, 351] as const;

/**
 * THE FIXED CARD (CardCarousel.tsx): a 14rem card in three columns, five
 * asked for in each — the window stands at every width, the stage is the
 * column, the room a side what the column leaves beside the window, and a
 * column narrower than the window is cut from its faded sides, the centre
 * card whole and centred. Still (lib/clock never starts the ring), so every
 * frame shows its first card centred; each region named for its frame, so no
 * two landmarks share a name.
 */
export const FixedWidth: Story = {
  args: { visible: 5 },
  parameters: { frame: 'bleed' },
  render: ({ mode, visible }) => (
    <div className="flex flex-col items-center gap-12 px-4">
      {FIXED_FRAMES.map((width) => (
        <div
          key={width}
          data-frame={width}
          className="w-full"
          style={{ maxWidth: `${width}px` }}
        >
          <CardCarousel
            slides={SLIDES}
            slideLabels={slideLabelsFor(COUNT)}
            labels={{ ...LABELS, region: `${LABELS.region}, ${width}px` }}
            visible={visible}
            mode={mode}
            cardWidth={FIXED_CARD}
            env={STILL}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const card = 14 * rem();
    const { ratio, fade } = ARRANGEMENTS[5];
    const frames = canvasElement.querySelectorAll<HTMLElement>('[data-frame]');
    await expect(frames).toHaveLength(FIXED_FRAMES.length);
    for (const frame of frames) {
      const region = frame.querySelector('section');
      const stage = region?.querySelector('[aria-live]');
      if (!(region instanceof HTMLElement) || !(stage instanceof HTMLElement)) {
        throw new Error('CardCarousel story: a fixed frame lost its carousel');
      }
      const reading = await atRest(region, () => {
        const cards = cardsOf(stage);
        const centre = cards.find((entry) => !entry.hasAttribute('inert'));
        return {
          column: frame.getBoundingClientRect().width,
          stage: stage.getBoundingClientRect(),
          widths: cards.map(widthOf),
          centre: centre?.getBoundingClientRect(),
          mask: getComputedStyle(stage).maskImage,
        };
      });
      const { column } = reading;
      for (const width of reading.widths) {
        await near(width, card, 0.5, `${column}px: every card 14rem`);
      }
      await near(
        reading.stage.width,
        column,
        0.5,
        `${column}px: the stage the column`,
      );
      const stops =
        /^linear-gradient\(to right, rgba\(0, 0, 0, 0\) ([-\d.e+]+)px, rgb\(0, 0, 0\) ([-\d.e+]+)px/.exec(
          reading.mask,
        );
      if (stops === null)
        throw new Error(`an unexpected mask: ${reading.mask}`);
      const [clear, opaque] = [Number(stops[1]), Number(stops[2])];
      await near(
        clear,
        Math.max(0, (column - ratio * card) / 2),
        0.5,
        `${column}px: the room a side, what the column leaves beside the window`,
      );
      await near(opaque - clear, fade * card, 0.5, `${column}px: the fade`);
      const centre = reading.centre;
      if (centre === undefined) throw new Error('no centred card');
      await expect(centre.left).toBeGreaterThanOrEqual(
        reading.stage.left - 0.5,
      );
      await expect(centre.right).toBeLessThanOrEqual(reading.stage.right + 0.5);
      await near(
        centre.left + centre.width / 2,
        reading.stage.left + reading.stage.width / 2,
        0.5,
        `${column}px: the centre card centred`,
      );
    }
    await expectNoSidewaysScroll();
  },
};

/** THE CARDS' HEIGHT's demo cards (CardCarousel.tsx): a title over a line of
 *  words or three — one width, unequal words, so unequal natural heights. */
const NOTES: readonly Readonly<{ title: string; text: string }>[] = [
  { title: 'Igienizare', text: 'Curățarea dinților de placă și de tartru.' },
  {
    title: 'Albire',
    text: 'Nuanța dinților se deschide treptat, în una sau mai multe ședințe, după un consult.',
  },
  {
    title: 'Implant',
    text: 'Un dinte pierdut se poate înlocui cu un implant, pe care se fixează apoi o coroană lucrată după forma dinților vecini; vindecarea durează câteva luni.',
  },
  { title: 'Detartraj', text: 'Tartrul se îndepărtează cu ultrasunete.' },
  {
    title: 'Aparat dentar',
    text: 'Dinții se aliniază încet, cu bracketuri sau cu gutiere transparente.',
  },
  {
    title: 'Control',
    text: 'O privire de ansamblu asupra danturii, cu o radiografie atunci când este nevoie.',
  },
];

/** One demo note: a white card that fills its box (`h-full`). */
function NoteCard({ title, text }: Readonly<{ title: string; text: string }>) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-md border border-line bg-surface p-5">
      <p className="font-display text-xl text-ink-strong">{title}</p>
      <p className="text-ink-muted">{text}</p>
    </div>
  );
}

/**
 * THE CARDS' HEIGHT (CardCarousel.tsx): six notes of unequal length, every
 * card's box stretched to the TALLEST note's height — `cardHeight`
 * 'tallest' — and each note filling its box: one height, one shape, the
 * line their common centre. Still, so the first note stands centred.
 */
export const UniformHeight: Story = {
  args: { visible: 3 },
  render: ({ mode, visible }) => (
    <CardCarousel
      slides={NOTES.map((note) => (
        <NoteCard key={note.title} {...note} />
      ))}
      slideLabels={slideLabelsFor(NOTES.length)}
      labels={LABELS}
      visible={visible}
      mode={mode}
      cardHeight="tallest"
      env={STILL}
    />
  ),
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    const heights = await atRest(regionOf(canvasElement), () =>
      cardsOf(stage).map((box) => {
        const note = box.firstElementChild;
        if (!(note instanceof HTMLElement)) {
          throw new Error('CardCarousel story: an empty card box');
        }
        return {
          box: parseFloat(getComputedStyle(box).height),
          note: parseFloat(getComputedStyle(note).height),
          words: note.lastElementChild?.getBoundingClientRect().height ?? 0,
        };
      }),
    );
    await expect(heights).toHaveLength(NOTES.length);
    // The premise: unequal words — the longest note's text at least two
    // lines taller than the shortest's.
    const words = heights.map((entry) => entry.words);
    await expect(Math.max(...words) - Math.min(...words)).toBeGreaterThan(
      2 * rem(),
    );
    const tallest = Math.max(...heights.map(({ box }) => box));
    for (const { box, note } of heights) {
      await near(
        box,
        tallest,
        0.5,
        'every card’s box the tallest card’s height',
      );
      await near(note, box, 0.5, 'every note filling its box');
    }
    await expectControls(canvasElement);
    await expectNoSidewaysScroll();
  },
};

/** Pause every glide on the stage at `ms` of its 700. */
function freezeGlides(stage: HTMLElement, ms: number): Animation[] {
  const gliding = stage.getAnimations({ subtree: true });
  for (const animation of gliding) {
    animation.pause();
    animation.currentTime = ms;
  }
  return gliding;
}

/**
 * THE AUTOMATIC MOVE, caught mid-glide (`no-visual`: it moves by design). The
 * product's rhythm: after the 1.5 s first dwell the ring moves on, and the
 * play pauses every glide at its half and reads the line there — every card's
 * vertical centre still on ONE line and every card still upright (the owner:
 * "like in a line … no up and down"), the card coming in between its two
 * poses.
 */
export const Rotating: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    await expect(stage).toHaveAttribute('aria-live', 'off');
    await expect(await restingCentre(stage)).toBe('1 din 8');

    await waitFor(
      () => expect(centreOf(stage)).toHaveAttribute('aria-label', '2 din 8'),
      { timeout: 6_000, interval: 16 },
    );
    const gliding = freezeGlides(stage, 350);
    await expect(gliding.length).toBeGreaterThan(0);
    const centres = cardsOf(stage).map((card) =>
      middle(card.getBoundingClientRect()),
    );
    await near(
      Math.max(...centres) - Math.min(...centres),
      0,
      1,
      'the vertical centres mid-glide',
    );
    for (const card of cardsOf(stage)) {
      await near(leanOf(card), 0, 0.01, 'a card upright mid-glide');
    }
    // The card coming in is half-way: wider than a neighbour, narrower than
    // the centre, and not yet straight.
    const incoming = centreOf(stage);
    const drawn = incoming.getBoundingClientRect().width;
    await expect(drawn).toBeLessThan(widthOf(incoming) - 1);
    const edges = edgeHeights(incoming);
    await expect(Math.abs(edges.left - edges.right)).toBeGreaterThan(0.5);
    for (const animation of gliding) animation.finish();
    await expectNoSidewaysScroll();
  },
};

/**
 * THE HAND (`no-visual`), with the clock still so only the hand moves it: a
 * drag past half a step moves one card, a short one snaps back, a quick flick
 * moves one, every card on one line under the moving hand — and the arrows
 * wrap round the ring.
 */
export const Dragging: Story = {
  args: { env: STILL },
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    const pitch = pitchOf(stage);
    await expect(await restingCentre(stage)).toBe('1 din 8');

    // Past half a step, slowly: one card on.
    await dragBy(stage, -0.6 * pitch, 350);
    await expect(await restingCentre(stage)).toBe('2 din 8');

    // A short slide, slowly: back where it was.
    await dragBy(stage, -0.3 * pitch, 350);
    await expect(await restingCentre(stage)).toBe('2 din 8');

    // A quick flick the other way: one card back.
    await dragBy(stage, 0.2 * pitch);
    await expect(await restingCentre(stage)).toBe('1 din 8');

    // UNDER THE HAND: the centre card follows the pointer exactly, and every
    // card's vertical centre stays on one line.
    const box = stage.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const init = {
      pointerId: 9,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientY: box.top + box.height / 2,
    };
    await near(shiftDrawn(centreOf(stage)), 0, 0.01, 'the centre at rest');
    fireEvent.pointerDown(stage, { ...init, clientX: x });
    fireEvent.pointerMove(stage, { ...init, clientX: x - 0.35 * pitch });
    await frame();
    await frame();
    await near(
      shiftDrawn(centreOf(stage)),
      -0.35 * pitch,
      0.5,
      'the centre card under the hand',
    );
    const centres = cardsOf(stage).map((card) =>
      middle(card.getBoundingClientRect()),
    );
    await near(
      Math.max(...centres) - Math.min(...centres),
      0,
      1,
      'the vertical centres under the hand',
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 350);
    });
    fireEvent.pointerUp(stage, {
      ...init,
      buttons: 0,
      clientX: x - 0.35 * pitch,
    });
    await expect(await restingCentre(stage)).toBe('1 din 8');

    // THE RING, by the arrows: previous from the first card is the last, next
    // comes back.
    const { previous, next } = controlsOf(canvasElement);
    await userEvent.click(previous);
    await expect(await restingCentre(stage)).toBe('8 din 8');
    await userEvent.click(next);
    await expect(await restingCentre(stage)).toBe('1 din 8');
    await expectNoSidewaysScroll();
  },
};

/**
 * THE ENDS (`no-visual`), with the clock still: the bounded list's two full
 * stops. Pulled past its first card the ring follows a third of the hand and
 * springs back; walked to its last card, next is disabled and the focus the
 * press left on it moves to previous; pulled past the last card, the same
 * spring.
 */
export const BoundedEnds: Story = {
  args: { mode: 'bounded', env: STILL },
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    const pitch = pitchOf(stage);
    const { previous, next } = controlsOf(canvasElement);

    /** A pull past an end: the first card moves a third of the hand, then
     *  the release springs it back. */
    const expectSpring = async (dx: number, label: string): Promise<void> => {
      const box = stage.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const init = {
        pointerId: 5,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientY: box.top + box.height / 2,
      };
      const rest = await atRest(regionOf(canvasElement), () =>
        shiftDrawn(centreOf(stage)),
      );
      await near(rest, 0, 0.01, `${label}: at rest`);
      fireEvent.pointerDown(stage, { ...init, clientX: x });
      fireEvent.pointerMove(stage, { ...init, clientX: x + dx });
      await frame();
      await frame();
      await near(
        shiftDrawn(centreOf(stage)),
        dx * BOUNDED_RESISTANCE,
        0.5,
        `${label}: a third of the hand`,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });
      fireEvent.pointerUp(stage, { ...init, buttons: 0, clientX: x + dx });
      const back = await atRest(regionOf(canvasElement), () =>
        shiftDrawn(centreOf(stage)),
      );
      await near(back, 0, 0.01, `${label}: sprung back`);
    };

    await expect(previous).toBeDisabled();
    await expectSpring(0.6 * pitch, 'past the first card');
    await expect(await restingCentre(stage)).toBe('1 din 8');

    for (let step = 1; step < COUNT; step++) await userEvent.click(next);
    await expect(await restingCentre(stage)).toBe('8 din 8');
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();
    await expect(document.activeElement).toBe(previous);
    // The places after the last card are empty.
    for (const card of cardsOf(stage)) {
      await expect(shiftOf(card)).toBeLessThanOrEqual(0);
    }

    await expectSpring(-0.6 * pitch, 'past the last card');
    await expect(await restingCentre(stage)).toBe('8 din 8');
    await expectNoSidewaysScroll();
  },
};

/**
 * THE PING-PONG (`no-visual`, on a quick clock so the walk fits a play): the
 * bounded list walks out to its last card on its own, one card a beat, and
 * the next automatic move goes BACK one — never round to the first. The play
 * checks the walk's SHAPE from wherever it stands when the play first looks
 * (the first beat comes 400ms after the story mounts, and a stall in loading
 * the face can let it pass first): one card a beat, turning only at the two
 * ends, and the turn at the last card.
 */
export const PingPong: Story = {
  args: {
    mode: 'bounded',
    visible: 5,
    env: MOVING,
    intervalMs: 400,
    startDelayMs: 400,
  },
  parameters: { frame: 'wide' },
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    const last = COUNT - 1;
    // Every place the walk stands, one entry a change (the wait below reads
    // on every change of the page, so no beat goes unseen).
    const walked: number[] = [];
    const record = (): void => {
      const at = positionIn(centreOf(stage).getAttribute('aria-label'));
      if (walked.at(-1) !== at) walked.push(at);
    };
    record();
    await waitFor(
      () => {
        record();
        expect(walked.slice(-2)).toEqual([last, last - 1]);
      },
      { timeout: 10_000, interval: 16 },
    );
    for (let i = 1; i < walked.length; i += 1) {
      await expect(
        Math.abs(walked[i] - walked[i - 1]),
        `one card a beat: ${walked.join(' → ')}`,
      ).toBe(1);
    }
    for (let i = 1; i < walked.length - 1; i += 1) {
      const turns =
        Math.sign(walked[i + 1] - walked[i]) !==
        Math.sign(walked[i] - walked[i - 1]);
      if (turns) {
        await expect(
          [0, last],
          `turning only at an end: ${walked.join(' → ')}`,
        ).toContain(walked[i]);
      }
    }
  },
};

/**
 * THE CONTROLS PRESSED (`no-visual`, on a quick clock so a stop can be seen
 * holding): the two arrows at the stage's edges and the beads under it; the
 * carousel moves on by itself; a press on next steps it — and then nothing
 * moves again, however many beats pass (the owner's OPTION 1: every
 * activation stops the automatic movement for good), the cards' live region
 * polite from then on; previous and a bead still answer, a step or a card a
 * press. A Tab reaches previous first, then next, then the beads in order.
 * The play reads every step from where the ring stands, never from a beat
 * count: on a 400ms clock a stall anywhere before the press lets it move on.
 */
export const Controls: Story = {
  args: { visible: 5, env: MOVING, intervalMs: 400, startDelayMs: 400 },
  parameters: { frame: 'wide' },
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const stage = stageOf(canvasElement);
    const { previous, next } = controlsOf(canvasElement);
    const picker = within(regionOf(canvasElement)).getByRole('group', {
      name: LABELS.picker,
    });
    const beads = within(picker).getAllByRole('button');
    const names = slideLabelsFor(COUNT);
    await expectControls(canvasElement);
    await expectBeads(canvasElement);
    // It moves by itself…
    await expect(stage).toHaveAttribute('aria-live', 'off');
    await waitFor(
      () => expect(centreOf(stage)).not.toHaveAttribute('aria-label', names[0]),
      { timeout: 4_000, interval: 16 },
    );
    // …until a press: one step from where the ring stands AT the click — read
    // on the button itself, before the island's own handler (React's, at the
    // root, comes later in the same dispatch) — and the stop for good.
    let pressedAt = Number.NaN;
    next.addEventListener(
      'click',
      () => {
        pressedAt = positionIn(centreOf(stage).getAttribute('aria-label'));
      },
      { once: true },
    );
    await userEvent.click(next);
    await expect(Number.isInteger(pressedAt)).toBe(true);
    const stopped = names[(pressedAt + 1) % COUNT];
    await expect(centreOf(stage)).toHaveAttribute('aria-label', stopped);
    await expect(stage).toHaveAttribute('aria-live', 'polite');
    await new Promise((resolve) => {
      setTimeout(resolve, 2_000);
    });
    await expect(await restingCentre(stage)).toBe(stopped);
    await expect(stage).toHaveAttribute('aria-live', 'polite');
    // The arrows still answer, a step a press…
    await userEvent.click(previous);
    await expect(await restingCentre(stage)).toBe(names[pressedAt]);
    // …and a bead lands on its card, its pill the current one.
    await userEvent.click(beads[5]);
    await expect(await restingCentre(stage)).toBe('6 din 8');
    await expect(beads[5]).toHaveAttribute('aria-current', 'true');
    await expectBeads(canvasElement);
    // The Tab order: previous, next, then the beads in order.
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(document.activeElement).toBe(previous);
    await userEvent.tab();
    await expect(document.activeElement).toBe(next);
    for (const bead of beads) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(bead);
    }
    await expectNoSidewaysScroll();
  },
};
