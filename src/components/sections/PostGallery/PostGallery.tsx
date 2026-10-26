import type { ReactElement } from 'react';
import {
  CardCarousel,
  type CardCarouselLabels,
  type CardCarouselMode,
  type CardCarouselProps,
} from '@/components/sections/CardCarousel/CardCarousel';
import { GalleryCard } from './GalleryCard';

export type { GalleryCard } from './GalleryCard';

// sections/PostGallery — the blog article's photo gallery: the article's
// photographs as cards on sections/CardCarousel's line. Until 2026-10-14 this
// file was a dashed placeholder holding the place („Galerie foto · în
// curând"); the owner, the same day, verbatim: "for: Galeria foto vine în
// curând — place that caroussell". The placeholder, its `label` prop and the
// pictures glyph only it drew (assets/glyphs/Images) are deleted, not kept
// beside the real thing.
//
// ── A DUMB SERVER COMPONENT COMPOSING A SECTION (§4, section → section: a
// section may compose another section's PUBLIC component, never its
// internals). It draws the page's `cards` as GalleryCards — server-rendered,
// in this folder — and hands them, with every finished word, to CardCarousel,
// the one client island here, which moves the cards' boxes and never renders
// inside them (its THE SLOT; the ui/Ribbon ← sections/DoctorShowcase
// pattern). Zero message keys, zero t(), zero site data (§8.1): the page words
// the region, the two roledescriptions, previous and next, the beads' group
// name, and one label per card („Fotografia 1 din 8"). No 'use client' here:
// the island is CardCarousel's.
//
// ── THREE CARDS, ALWAYS (2026-10-17). The owner, of the carousel's five-card
// window, verbatim: "the fiver option … do not represent it in the article,
// represent it on home page". So an article's gallery is the carousel's
// THREE-card window — the centre photograph straight and largest, its two
// neighbours turned away in 3D and fading at the stage's edges — and it is
// not a prop: the gallery mounts CardCarousel with `visible={3}` AFTER the
// spread, a spread THE STRIP (below) has already emptied of every key the
// gallery withholds — so no withheld key reaches the island's window, its
// card's size or its clock. Not every way in is closed: a `className` still
// reaches the island (THE STRIP's last lines). Beside the window the gallery
// spells the card's 20rem cap, `cardCap="capped"` — the island's default and,
// since 2026-10-20, its one value, so the prop changes no card: it is the
// BACKSTOP. A `cardWidth` that ever leaked past THE STRIP would meet it, and
// the island refuses the pair with its "both given" RangeError — at build,
// for this static page — where without the cap that width would silently fix
// every card: a 400px width drew 400px cards where THE `sizes` below is
// derived for 320 (MEASURED, 2026-10-20, the strip mutated to spare the
// width). Keep it.
// lib/blog-article refuses a `visible` key in an article file. From
// 2026-10-16 to that day the gallery took `visible: 3 | 5` per gallery, and
// the demo article showed all four instances of the two axes.
//
// ── ITS PROPS are CardCarousel's, with `cards` where the island takes
// `slides`, LESS every key THE STRIP withholds: the ONE axis the owner
// chooses per gallery, `mode`; the labels — CardCarousel's six words, the
// beads' group name `picker` among them; one label per card (CardCarousel
// throws a RangeError naming both counts when the two lists differ: at build,
// for this static page); and the native <section> surface CardCarousel lets a
// caller add, because its root IS this gallery's root (an `id`, a placement
// className), less `style`. The region's name and roles are the island's,
// set after its spread, every other spelling of them dropped from it (THE
// STRIP's last lines). No clock option: on a page both modes run at the
// carousel's own rhythm. No card size: the window gives a card its width, and
// every card keeps its own height (the carousel's default). No cards renders
// nothing.
//
// ── THE STRIP (2026-10-20 — the review found the types alone left the
// island open). `WITHHELD` below is ONE list, read twice: by the props' type,
// which omits every key on it, and by the component, which deletes every key
// on it from the props its destructuring leaves — a fresh object, as a rest
// element always is, so the caller's own props are never touched — before
// spreading them onto the island. The type alone is no fence: TypeScript
// checks a spread of a NON-FRESH object in JSX for no key it does not know,
// so `{...{ intervalMs: 60, startDelayMs: 60 }}` compiled and reached the
// island — the centre card went from the first to the seventh in 400 ms
// (MEASURED by the review). On the list: CardCarousel's own props — those
// the gallery passes itself (the slides it draws, its own four), those it
// fixes (the window, the cap) and those it never passes (the fixed card
// width, the cards' height, the clock's rhythm, its first dwell and its
// environment seam) — and `style`, whose inline custom properties outrank
// the cap's class: `style={{ '--cap': '100cqw' }}` drew the card 584px wide
// in a 1024px frame, where THE `sizes` below assumes 320 (MEASURED by the
// review). The list is held COMPLETE by PostGallery.test.tsx's type pins:
// every prop of the island's own is on it or is one of the three the gallery
// names (`mode`, `labels`, `slideLabels`), so a prop CardCarousel gains turns
// them red until it is placed — where before it silently became a gallery
// prop (a twelfth, `dwellMs`, on a copy of the island's props: it compiled,
// the suite stayed green, and it reached the island — MEASURED by the
// review). The window still rides AFTER the spread, the belt behind the
// strip, and the cap beside it, the backstop (THREE CARDS, ALWAYS).
// ONE WAY IN STAYS OPEN: a `className`, which the house keeps for placement
// (§6.8) — a rule, not a fence: one that set the cap's custom property to the
// column's width drew the centre card 584.4px in a 1024px frame, where 320 is
// due (MEASURED by the review).
// A SECOND, CLOSED THE SAME DAY: an attribute named in another CASE. HTML
// attribute names are case-insensitive, while THE STRIP matches names
// exactly, so `Style`, `Role`, `ARIA-LABEL` or `Aria-Live` passes it
// (MEASURED, 2026-10-20) — and, until sections/CardCarousel closed it, passed
// the island's resets too: `{ Style: '--cap: 100cqw' }` lifted the cap in a
// browser render (584.4px in a 1024px frame); in the server's HTML, which
// this static page ships, it came before the island's own `style` and won it,
// the geometry's custom properties lost — a 0px card; the server's HTML took a
// smuggled `ARIA-LABEL` as the region's name, and in both renders a smuggled
// `Role` replaced the region's role and a smuggled `Aria-Live` made it a live
// region. The island now drops every spelling of its own attributes from its
// spread (CardCarousel.tsx's OWN_ATTRIBUTES), in the browser's render and the
// server's HTML alike — the Home band's carousel with this gallery's.
//
// ── THE ONE AXIS, `mode` (CardCarousel.tsx's THE TWO AXES and THE
// CONSUMPTION LAW in full). The owner, 2026-10-16: "i want it to keep auto
// scrolll on them … i also want them to have a simple list of articles with
// max left and max right. once an end i reached, it goes in the other
// direction". BOTH MOVE BY THEMSELVES, one card every 5.5 s, and both follow
// a swipe: 'loop' is the circular carousel, the last card followed by the
// first; 'bounded' scrolls out to the last card and back to the first,
// turning round at each end and never wrapping.
//
// ── WHAT THE CAROUSEL BRINGS (CardCarousel.tsx's THE ARROWS and THE BEADS),
// each worded by the page:
//   · PREVIOUS AND NEXT — two tall chevrons ("the smaller larger sign … like
//     600% taller"), the lilac `--accent` on no ground and no border at the
//     stage's two edges, as tall as the cards, the line drawn on a halo of the
//     page's own colour so it reads over the neighbours' photographs on a
//     phone; a little larger under a mouse, still lilac; the deep violet
//     `--accent-strong` while pressed, at its own size again; grey while
//     disabled — a bounded list disables the one that has nowhere to go;
//     named by the page's `previous` and `next` words;
//   · THE BEADS — "the progress dots like on home hero": one per card in a
//     row under the cards, each a button named by its card's label, the
//     centred card's the lilac pill (aria-current), in a group named by the
//     page's `picker` word („Alege fotografia");
//   · IN THE DOM previous, next, the beads, then the cards — the controls
//     first, the beads under the cards in the picture;
//   · OPTION 1 (the owner's pick for SC 2.2.2) — ANY PRESS STOPS THE
//     MOVEMENT FOR GOOD: an arrow, a bead, a swipe, a tap on the cards;
//     keyboard focus inside the gallery holds it only while it stays.
//
// ── THE `sizes`, DERIVED — how wide a card is drawn, from three things the
// page fixes: ui/Container's gutter (5vw a side up to a 480px window, a ramp
// to 10vw at 600, 10vw up to the 12.5rem cap at 2000), the article's 42rem
// measure (sections/PostPage), and CardCarousel's three-card card,
// `min(20rem, column ÷ 1.7521)` — never shrunk for the arrows, whose room the
// stage takes from the column's margin instead (its THE BARS' ROOM). Inside
// THE BAND SCALE (CLAUDE.md §15.32 — a mouse or trackpad, a column of
// max(56rem, 896px): a 1120px window, 1138.75 behind a classic scrollbar) the
// measure and the cap are theme lengths drawn in the design pixel s =
// min(column, 96rem) / 1106, and the card is 20rem × s. So: 0.9 × W ÷ 1.7521
// = 51.4vw on a phone (under 52vw through the ramp, where the column grows
// slower than the window); 0.8 × W ÷ 1.7521 = 45.7vw from 600px; the 20rem
// cap from a 700.8px window, and on every window past it outside the scale;
// inside it 320 × 0.8 × W ÷ 1106 = 23.15vw, stopping at 444.4px (27.8rem)
// where the scale caps (1920px).
// Every clause is the card BOX's width ROUNDED UP — the browser may fetch a
// file a step larger than the box, never a smaller one (THE PHOTO, NOT THE
// BOX, below, is what the box cannot say) — and each switch sits where the
// card's rule is certain on both sides of it, AT ANY DEFAULT FONT: a rem in a
// media condition is the reader's default font size, which moves every rem
// clause, while the band scale's column floor, 896px, is CSS pixels, which it
// never moves. So the scale's 24vw clause opens at the LATER of 71.25rem and
// 1140px — past the step even behind a scrollbar. On the rem alone (until
// 2026-10-20, the review) it opened under a 16px default on windows where the
// scale cannot have begun — from 855 to 1000px at a 12px default — and there
// hinted up to 14.5 % under the unscaled 20rem card. From 1120 to 1140px the
// scale has begun without a scrollbar and not yet behind one (until
// 1138.75px), so the hint is never under the WIDER of the two cards: the
// 20rem clause where 20rem is the wider — at the default font 1.23 times the
// scaled card at a 1120px window (259.2px), the widest margin anywhere at
// 16px and up, which the sweep holds under 1.25 — and, where a smaller
// default makes 24vw the wider (its 20rem card under the scaled 259.2 to
// 263.9px: a default under about 13px), a second 24vw clause from 1120px,
// opened by `(min-width: 83.34rem)`, from where 24vw is at least 20rem.
// Under a 16px default the hint may run wider than its card — at most 1.4
// times, at 9px, where the 28rem clause's 120rem, 1080px, opens before the
// scale can begin — a file a step larger, never a smaller one. One blind
// spot, the band scale's own: an engine that cannot register custom
// properties (Safari before 16.4, Firefox before 128) never scales, so from
// 1140px it draws a card up to 17 % wider than the scale's clause says (to
// ≈1333px) — a file a step smaller there, never a wrong box.
// THE SPACE BEFORE EACH `vw` is load-bearing (PersonnelCard's THE SPACE
// BEFORE `21vw`), and so is the WHOLE number: next/image reads only a whole
// share after a space, `(^|\s)(1?\d?\d)vw` — a share with a decimal point it
// would not read at all — takes the smallest, 24vw, and keeps the candidates
// from next.config's smallest `deviceSizes` width, 640, × that share up
// (153.6px: from the 256px file). The smallest card the gallery draws from
// §7's 320 up: 155.8px, at that window behind a classic scrollbar.
// PostGallery.test.tsx sweeps every window from 280 to 3840px, both pointers,
// with and without a scrollbar, at default fonts from 9 to 24px, against the
// card the engine's own rules give.
// THE PHOTO, NOT THE BOX (2026-10-20, the review): the hint is the box's, and
// a photograph of another shape is drawn LARGER than its box — GalleryCard
// covers the 3:4 card with it and cuts off what overflows (its THE
// PHOTOGRAPH) — so a photo wider than 3:4 is drawn wider than the card, by
// its ratio over the card's: 1.125 times for six of the eight demo
// photographs (1080 × 1280), 1.2 for the other two (1080 × 1200), 1.78 for a
// 4:3 landscape photograph, exactly the card's width for a 3:4 one. The
// browser chooses for the box, so such a photo comes from a file up to that
// factor smaller than it is drawn: at a 768 window at 2×, the 640w file for a
// demo photograph drawn 720 device pixels wide — a little soft. No hint can
// know a photo's shape; the lever is the articles' photographs cut to 3:4,
// which their data test (tests/unit/blog-article-data.test.ts, which reads
// every photo's size already) could require — not this folder's.

/** THE `sizes`, DERIVED (the header) — the three-card card's, at any default
 *  font: the scale's 24vw from the later of 71.25rem and 1140px, and from
 *  1120px where 24vw is at least 20rem (83.34rem). */
const SIZES =
  '(min-width: 120rem) and (pointer: fine) 28rem, ' +
  '(min-width: 71.25rem) and (min-width: 1140px) and (pointer: fine) 24vw, ' +
  '(min-width: 83.34rem) and (min-width: 1120px) and (pointer: fine) 24vw, ' +
  '(min-width: 44rem) 20rem, (min-width: 37.5rem) 46vw, 52vw';

type PostGalleryOwnProps = Readonly<{
  /** The gallery's cards, in order — each a photograph and its caption. */
  cards: readonly GalleryCard[];
  /** Both move by themselves until a press stops them: 'loop' wraps, the last
   *  card followed by the first; 'bounded' walks out to the last card and
   *  back, turning round at each end. */
  mode: CardCarouselMode;
  /** Every word the carousel says, finished by the page (§8.1) — previous and
   *  next the names of its two arrows, `picker` its beads' group name. */
  labels: CardCarouselLabels;
  /** One finished name per card, in the same order („Fotografia 1 din 8") —
   *  its card's name and its bead's. */
  slideLabels: readonly string[];
}>;

/**
 * WHAT THE GALLERY WITHHOLDS (the header's THE STRIP) — ONE list, read by the
 * props' type, which omits every key on it, and by the component, which
 * deletes every key on it before the spread: CardCarousel's own props — those
 * the gallery passes itself, those it fixes, those it never passes (the card's
 * fixed width and its height, the clock's three options) — and `style`. Each
 * is a key of CardCarousel's props, so a misspelt one fails to compile; and
 * the list is COMPLETE — PostGallery.test.tsx's type pins hold every prop of
 * the island's own either here or among the three the gallery names, so a
 * prop CardCarousel gains turns them red until it is placed.
 */
const WITHHELD = [
  'slides',
  'slideLabels',
  'visible',
  'cardCap',
  'cardWidth',
  'flatFrom',
  'cardHeight',
  'labels',
  'mode',
  'intervalMs',
  'startDelayMs',
  'env',
  'style',
] as const satisfies readonly (keyof CardCarouselProps)[];

export type PostGalleryProps = PostGalleryOwnProps &
  Omit<
    CardCarouselProps,
    (typeof WITHHELD)[number] | keyof PostGalleryOwnProps
  >;

export function PostGallery({
  cards,
  mode,
  labels,
  slideLabels,
  ...native
}: PostGalleryProps): ReactElement {
  const slides = cards.map((card, index) => (
    // The list is static and never reorders: the index is the card's
    // identity (CardCarousel keys its own boxes the same way).
    <GalleryCard
      key={index}
      image={card.image}
      caption={card.caption}
      sizes={SIZES}
    />
  ));
  // THE STRIP (the header): every WITHHELD key deleted from `native`, the
  // rest of the caller's props — a fresh object, as a rest element always is,
  // so the caller's own props are never touched — and the island meets none
  // of them, its own defaults standing.
  for (const key of WITHHELD) Reflect.deleteProperty(native, key);
  return (
    <CardCarousel
      {...native}
      slides={slides}
      slideLabels={slideLabels}
      // THREE CARDS, ALWAYS (the header) — after the spread: the window, the
      // belt behind THE STRIP, and the cap, the backstop that turns a leaked
      // `cardWidth` into the island's "both given" RangeError.
      visible={3}
      cardCap="capped"
      labels={labels}
      mode={mode}
    />
  );
}
