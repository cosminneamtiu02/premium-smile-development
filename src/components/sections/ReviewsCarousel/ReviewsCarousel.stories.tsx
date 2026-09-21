import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { demoReviews as DEMO } from '@/lib/reviews/reviews';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { ReviewsCarousel } from './ReviewsCarousel';

// The „Părerea ta contează" band's SIX stories: the everyday picture, the
// language that stresses it, the deck after a hand navigation has stopped it,
// the one-review case that has nothing to rotate, and the two small counts
// where the wrap-around shows. The export NAMES are
// load-bearing — each names a baseline file (`sections-reviewscarousel--
// default`, …) — so this list IS this section's contribution to the lane's
// visual manifest. `Sections/*` routes every one of them to 390 + 1536 (§13,
// tests/visual/stories.spec.ts).
//
// ── EVERY REVIEW HERE IS DEMO COPY, AND THAT IS A DECISION, NOT A
// PLACEHOLDER (board D15, owner fb-446). The Romanian and English words are
// the OLD SITE's own fabricated testimonials; the German, French and Italian
// ones are demo drafts written for this file. THE ROWS MOVED to lib/reviews
// as `demoReviews` on 2026-09-20 (owner, the hero lane's round 5: "bring the
// 5 examples story from storybook as demo on home page") — the Home band
// shows the first five of them until the owner's real list has a row, and
// these stories import the same six so the workbench and the page can never
// drift apart. D15's "never into lib/reviews" is therefore REVERSED for the
// demo rows by the owner's word (lib/reviews' header carries the record and
// the TODO): the real reviews remain the owner's to supply, each with the
// patient's written consent (a name plus a procedure is health data, GDPR
// art. 9) and the CMSR testimonial check (in force since 2025-07-01). The
// `reviews` prop (board D18) is still how a story picks its rows.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL with no toolbar state at all, so without the pin the
// German baseline would be a Romanian picture — green, and proving nothing.
// The pin is doubly load-bearing for this band: ReviewCard's quote marks are
// generated content resolved from `quotes: auto` against the declared
// language, and the preview decorator is what stamps `<html lang>`.
//
// ── EVERY STORY PINS ITS OWN VIEWPORT, because width is what the deck is made
// of: the card is a SHARE of the stage (`--deck-card` — two-thirds of a phone,
// half a tablet, a slow line above; ReviewsDeck.tsx's STAGE paragraph), the
// stage runs edge to edge, and `--fan-drop` steps on ui/Container's `@md`, so
// a manager canvas narrowed by the sidebar is simply another width — and the
// pin is what makes the workbench show the width the story is about.
// Playwright ignores the pin — it sets its own page size per project — so the
// visual net still samples every story at 390 + 1536.
//
// ── THE PLAY FUNCTIONS DO TWO JOBS. The usual one: assert what a picture
// cannot — that the band is a named region, that the deck is a second named
// region wearing its localized `aria-roledescription`, that the two controls
// are in the order the APG asks for, and which slide is the visitor's. And one
// this band needs specifically: MEASURE THE DECK. There is no CSS in the
// component tests (tests/setup/components.ts loads no stylesheet), so this is
// the only runner where `--deck-card`, the full-bleed margins and `translate:
// calc(var(--offset) * var(--fan-step))` have actually been resolved by a
// browser — `expectFannedStage` below is what keeps the stage honest (centred,
// the card's share of the screen, both neighbours peeking, both edges cut, no
// sideways page scroll) at whatever width the runner opens the story, and the
// baselines then photograph it at 390 and 1536.
//
// ── THE ENVIRONMENT IS THE REAL ONE, deliberately: the band owns lib/clock's
// numbers and does not forward the env seam (functions cannot cross a
// server→client boundary, so a prop that only tests could pass would be a prop
// the site can never use). Since 2026-09-20 the deck runs the HERO'S rhythm
// (5.5 s, a 1.5 s first beat) and nothing stops it for good, so what keeps a
// BASELINE still is the harness: the visual projects run with
// `reducedMotion: 'reduce'` (playwright.config.ts), under which lib/clock
// declines every automatic start — the net photographs an idle ring's first
// frame by construction, and a story that presses "next" lands on the second
// card without restarting anything. The Vitest storybook project has no such
// preference and sees the running deck; Picked therefore asserts only where
// the press landed, never the live region's state.
//
// layout 'fullscreen' because the band is full-bleed and owns its own gutter
// clamp: Storybook's default 1rem padding would put the story's ground and the
// band's margins on two different rulers.

const meta = {
  title: 'Sections/ReviewsCarousel',
  component: ReviewsCarousel,
  parameters: { layout: 'fullscreen' },
  args: { reviews: DEMO },
} satisfies Meta<typeof ReviewsCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ICU interpolation, done the way the message file declares it. */
const fill = (message: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    message,
  );

/**
 * The band must never make the PAGE scroll sideways (§7), in any language.
 * Measured on the document, not on the band: the band's own `overflow-x-clip`
 * is exactly what turns the stage's half-a-scrollbar overshoot into clipped
 * paint, and a clipped box still REPORTS that overshoot as its scrollWidth —
 * what matters is that the document never gains a horizontal scrollbar, and
 * that the band's box itself fits the visible width.
 */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
  await expect(band.getBoundingClientRect().width).toBeLessThanOrEqual(
    document.documentElement.clientWidth + 1,
  );
};

/**
 * Whether a slide is rendered WITHOUT its travel transition — the wrap-around
 * rule. Compared as exact class TOKENS, never as a substring: every slide
 * carries `motion-reduce:transition-none`, so `className.includes(
 * 'transition-none')` is true for all of them and would assert nothing.
 */
const landsInstantly = (slide: HTMLElement): boolean =>
  slide.className.split(/\s+/).includes('transition-none');

/** Every slide, the far ones included — the DOM order is the reviews' order. */
const slidesOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[role="group"]'),
];

/**
 * THE DECK, MEASURED — the assertion the component tests cannot make, because
 * they run without a stylesheet. Every claim is about resolved CSS, and every
 * one is width-agnostic so the runner may open the story at any size:
 *   · the stage runs edge to edge (its box is the viewport's width — the
 *     full-bleed idiom, ReviewsDeck.tsx's STAGE paragraph);
 *   · the selected card sits in the middle of it, at the share `--deck-card`
 *     promises: clamp(14rem, 66%, 8% + 20rem) of the stage (16px root);
 *   · both neighbours are pushed out either side, hang LOWER, and PEEK — part
 *     of each is inside the stage past the centre card's edge, so there is
 *     visibly "a card left and right" (owner 2026-09-12);
 *   · the deck is cut by the viewport at BOTH edges (some card runs off each
 *     side — the ring's "there is more" cue);
 *   · and none of it scrolls: not the stage vertically (the bottom padding is
 *     the dropped cards' room — a translate moves paint, not layout), not the
 *     PAGE sideways (§7 — the band's `overflow-x-clip` belt).
 */
const expectFannedStage = async (root: HTMLElement): Promise<void> => {
  const slides = slidesOf(root);
  const stage = slides[0].parentElement as HTMLElement;
  // Measure the deck at REST: a story that pressed "next" has cards still
  // travelling on their 500ms clock, and a rect taken mid-flight belongs to
  // neither arrangement. An empty animation list resolves immediately.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await Promise.all(
    stage
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished),
  );
  // By RING OFFSET, not by DOM position: after a hand navigation the centre
  // is no longer the first slide.
  const at = (offset: number): DOMRect =>
    (
      slides.find(
        (slide) => Number(slide.style.getPropertyValue('--offset')) === offset,
      ) as HTMLElement
    ).getBoundingClientRect();
  const box = stage.getBoundingClientRect();
  const centre = at(0);
  const right = at(1);
  const left = at(-1);

  await expect(Math.abs(box.width - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(
    Math.abs((centre.left + centre.right) / 2 - (box.left + box.right) / 2),
  ).toBeLessThanOrEqual(1);
  const expected = Math.min(
    Math.max(224, 0.66 * box.width),
    0.08 * box.width + 320,
  );
  await expect(Math.abs(centre.width - expected)).toBeLessThanOrEqual(1);

  await expect(right.left).toBeGreaterThan(centre.left);
  await expect(left.left).toBeLessThan(centre.left);
  await expect(right.top).toBeGreaterThan(centre.top);
  await expect(left.top).toBeGreaterThan(centre.top);
  await expect(right.right).toBeGreaterThan(centre.right + 16);
  await expect(right.left).toBeLessThan(box.right - 16);
  await expect(left.left).toBeLessThan(centre.left - 16);
  await expect(left.right).toBeGreaterThan(box.left + 16);

  const boxes = slides.map((slide) => slide.getBoundingClientRect());
  await expect(boxes.some((rect) => rect.right > box.right + 1)).toBe(true);
  await expect(boxes.some((rect) => rect.left < box.left - 1)).toBe(true);
  // …and the FAR slide is off-stage, not merely tucked: with six reviews the
  // +3 card starts past the right edge at every sampled width (ReviewsDeck.tsx's
  // ONE HEIGHT paragraph makes that claim; this is where it is measured).
  const far = slides.find(
    (slide) => Number(slide.style.getPropertyValue('--offset')) === 3,
  );
  if (far) {
    await expect(far.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      box.right - 1,
    );
  }

  await expect(stage.scrollHeight).toBeLessThanOrEqual(stage.clientHeight);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
};

/**
 * The everyday picture: Romanian, six reviews, on the laptop width the §13
 * matrix samples.
 *
 * This is the story that shows the DECK — the selected review raised and
 * tinted in the middle (the idle frame's own colour as its ground), its
 * neighbours framed, tilted, peeking and running off both edges, the discs
 * alternating photograph / letters, and the two controls in one row
 * underneath. The rotation is running (the live region is `off`); nothing
 * moves inside the screenshot window, because the first dwell is 34 seconds.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    const band = canvas.getByRole('region', { name: ro.home.reviews.title });
    const deck = canvas.getByRole('region', { name: ro.home.reviews.region });

    // The band's own landmark, and the carousel's inside it.
    await expect(deck).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
    // The APG's DOM order: a keyboard visitor reaches the navigation before
    // the reviews themselves — and there is no rotation control (owner
    // 2026-09-12; ReviewsDeck.tsx's NO ROTATION CONTROL paragraph).
    await expect(
      [...deck.querySelectorAll('button')].map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual([ro.home.reviews.previous, ro.home.reviews.next]);
    // The first review is the visitor's, and it is the only one that is not
    // inert — the rest are stacked behind it, out of the Tab order.
    const slides = slidesOf(canvasElement);
    await expect(slides[0]).toHaveAttribute(
      'aria-label',
      fill(ro.home.reviews.slide, { index: '1', total: '6' }),
    );
    await expect(slides[0]).not.toHaveAttribute('inert');
    await expect(slides[1]).toHaveAttribute('inert');
    // …and the stars say their rating in words, through ICU (§8.3).
    await expect(
      canvas.getByRole('img', { name: '3,5 din 5 stele', hidden: true }),
    ).toBeInTheDocument();

    await expectFannedStage(canvasElement);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * German at the phone width — the CALIBRATION story for the stage.
 *
 * German is the longest language this site speaks (§8.4) and 390 is the
 * narrowest sampled width, so this frame is where the two pressures meet:
 * „Weitere Stimmen unserer Patienten" over the wide-tracked uppercase mono
 * eyebrow, the longest review body in the deck (Bogdan's, with its two
 * compounds), and a stage that runs edge to edge (390px) under a card
 * two-thirds of it wide (257px) with ~66px of each neighbour showing past the
 * centre. The things to look at: no card may clip its own text, the tallest
 * card sets the height for all of them (they share one grid cell, and nothing
 * is ever hidden — so the height is the same at every position of the ring),
 * and the thin rule with the name and the procedure sits at the same height
 * on every card.
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  play: async ({ canvas, canvasElement }) => {
    const band = canvas.getByRole('region', { name: de.home.reviews.title });

    await expect(band).toHaveTextContent(de.home.reviews.eyebrow);
    await expect(
      canvas.getByRole('region', { name: de.home.reviews.region }),
    ).toHaveAttribute('aria-roledescription', de.common.carousel.role);
    // The German words, not the Romanian ones: the band picks each review's
    // words by the PAGE locale (board D18).
    await expect(band).toHaveTextContent(DEMO[0].words.de.title);
    await expect(band).not.toHaveTextContent(DEMO[0].words.ro.title);
    // …while the reviewer's name, a proper noun, reads the same in all five.
    await expect(band).toHaveTextContent(DEMO[0].name);

    await expectFannedStage(canvasElement);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * The deck AFTER A HAND NAVIGATION — the second review selected, and the ring
 * goes on from there a full interval later (2026-09-20: nothing stops for
 * good; ReviewsDeck.tsx's NO ROTATION CONTROL paragraph). The second card
 * now wears the tint and the first has taken the frame, on the same two
 * nodes. Under the net's reduced motion the ring is idle and the frame is
 * still; here the play asserts only where the press landed.
 */
export const Picked: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    const deck = canvas.getByRole('region', { name: ro.home.reviews.region });

    fireEvent.click(canvas.getByRole('button', { name: ro.home.reviews.next }));

    await waitFor(async () => {
      const slides = slidesOf(canvasElement);
      await expect(slides[1]).not.toHaveAttribute('inert');
      await expect(slides[0]).toHaveAttribute('inert');
    });
    // Still no rotation control anywhere in the region.
    await expect(deck.querySelectorAll('button')).toHaveLength(2);
    await expectFannedStage(canvasElement);
  },
};

/**
 * ONE review: not a carousel at all, and it says so.
 *
 * The two-item floor is structural — derived from the COUNT, never from the
 * clock's idle reason — and since the G2 a11y round it governs the SEMANTICS
 * as well as the buttons: no rotation control, no prev/next, no
 * `aria-roledescription` on the region, no slide group, no live region. A
 * screen reader meets a named region containing one review, which is what is
 * actually there. The card itself sits exactly where the deck puts every
 * selected card: centred, raised, emphasized.
 */
export const Single: Story = {
  args: { reviews: DEMO.slice(0, 1) },
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    const band = canvas.getByRole('region', { name: ro.home.reviews.title });
    const deck = canvas.getByRole('region', { name: ro.home.reviews.region });

    await expect(deck.querySelectorAll('button')).toHaveLength(0);
    await expect(deck).not.toHaveAttribute('aria-roledescription');
    await expect(slidesOf(canvasElement)).toHaveLength(0);
    await expect(deck.querySelectorAll('[aria-live]')).toHaveLength(0);
    // …and the one review is still there, wearing the selected card's dress.
    await expect(canvas.getByRole('article')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 3 })).toHaveTextContent(
      DEMO[0].words.ro.title,
    );

    await expectNoSidewaysScroll(band);
  },
};

/**
 * THREE reviews — the smallest deck that still rotates, and the one where the
 * wrap-around is visible.
 *
 * With three slides every advance moves two cards one step and sends the third
 * the other way across the whole stage (−1 becomes +1). Nothing remounts here
 * (ledger D1), so without a rule that card would GLIDE past the fan for half a
 * second on every tick; the rule is that a slide whose offset changed by more
 * than one step is rendered with `transition-none` for that render, i.e. it
 * lands instantly, exactly as the old deck's remount did. The play function
 * below advances once and reads the classes, because a still photograph cannot
 * show a transition that did not happen.
 */
export const Three: Story = {
  args: { reviews: DEMO.slice(0, 3) },
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    fireEvent.click(canvas.getByRole('button', { name: ro.home.reviews.next }));

    await waitFor(async () => {
      const slides = slidesOf(canvasElement);
      // Slide 3 was the left neighbour and is now the right one: it wrapped.
      await expect(landsInstantly(slides[2])).toBe(true);
      // …while the two that moved one step keep the deck's own clock.
      await expect(landsInstantly(slides[0])).toBe(false);
      await expect(landsInstantly(slides[1])).toBe(false);
    });
  },
};

/**
 * FIVE reviews — the largest deck whose window (±2) still equals its count, so
 * every slide is on screen and the wrap has nowhere to hide.
 *
 * From SEVEN up the jump is between +3 and −3, both beyond the stage's clip,
 * unseen; with six the card at −2 leaves the left edge for +3 (the honest
 * limit of a ring that never remounts, recorded in ReviewsDeck.tsx); three,
 * four and five are the counts where the rule earns its keep. Here the card
 * at −2 becomes +2 — four steps — and must land rather than travel.
 */
export const Five: Story = {
  args: { reviews: DEMO.slice(0, 5) },
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    fireEvent.click(canvas.getByRole('button', { name: ro.home.reviews.next }));

    await waitFor(async () => {
      const slides = slidesOf(canvasElement);
      await expect(landsInstantly(slides[3])).toBe(true);
      for (const index of [0, 1, 2, 4]) {
        await expect(landsInstantly(slides[index])).toBe(false);
      }
    });
  },
};
