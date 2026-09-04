import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { containerClasses } from '@/components/ui/Container/Container';
import { clinic } from '@/lib/clinic';
import { cx } from '@/lib/cx';
import { Wordmark } from './Wordmark';

// The Wordmark's two stories — the component has ONE axis that can change its
// shape, the WIDTH OF THE BOX IT IS GIVEN, so there are exactly two pictures:
// full size, and the tightened step (contract §7). What is deliberately absent
// is as informative as what is here:
//
// ── NO GermanStress. This section renders no translated string at all: the
// only text is `clinic.name`, which is DATA (§10.1) and identical in five
// languages. Flip the locale toolbar to Pseudo and nothing here may change —
// that is the §8.9 sweep passing, not failing.
// ── NO FocusVisible. D9's placeholder <a> has no href, so it is not focusable
// and there is no focus state to photograph (Wordmark.tsx says why at length).
// ── NO `parameters.nextjs`. Only the Header's stories still pin a pretend
// route, and for the one thing that needs one: usePathname decides which entry
// gets aria-current. Nobody pins for LINKS any more — they are plain anchors
// since §15.13 — and this section has neither, which is what D9 deferred.
//
// THE THREE MECHANICS THAT WOULD OTHERWISE FAIL SILENTLY, same as the Header's
// and the Footer's files:
//
// ── 1. Every story PINS ITS OWN LANGUAGE with per-story `globals` (Romanian,
// §15.7). The locale toolbar is manager state; the visual runner opens each
// story by URL with no toolbar at all, so an unpinned story photographs
// whatever the last person clicked.
// ── 2. Every story PINS ITS OWN VIEWPORT, and here the pin is the whole
// point: the component's single container step is decided by the box below,
// whose gutter clamp is a function of the viewport. Playwright ignores the pin
// (it sets its own page size per project), so the `Sections/*` title still
// routes this file to 390 + 1536, and the 'stress-320' tag on the second story
// adds the accessibility width on top (tests/visual/stories.spec.ts, §13).
// ── 3. The DECORATOR IS THE CONSUMER'S BOX, not a frame. The step measures the
// nearest ancestor `@container` (§6.5), so a story that dropped the lockup into
// a bare div would photograph a state neither consumer can produce. `Cell`
// below reproduces the tighter of the two consumers — the Header pill: same
// gutter clamp, same 1px border, the same `px-4` and `gap-4`, and an `h-16` row
// that was that consumer's height until 2026-09-04 (see the Cell comment: the
// shipped rows are `h-20` now and this harness has not followed). The WIDTH
// arithmetic the pinned case rests on is unaffected — it is a horizontal
// budget. Header.tsx's row is the anchor for both numbers (§17.7: named block,
// never a line range — the old "Header.tsx:125-132" citation had already
// drifted). The Footer's gutter box is the same clamp without the
// border or the padding, i.e. ~34px roomier at every width, so a lockup that
// fits here fits there.

/**
 * The box both consumers hand the lockup, drawn as the Header's pill because
 * that is the tighter one.
 *
 * <header> is not decoration either: the per-story axe audit reports visible
 * text that sits inside no landmark, and `banner` is the honest landmark for
 * the box this mirrors.
 */
const Cell = ({
  children,
  pinned = false,
}: {
  children: ReactNode;
  /**
   * Replace the fluid gutter clamp with the pill's MEASURED outer width at the
   * 320 stress viewport: 305px of Chromium body (the runner reserves ~15px for
   * the scrollbar) − 2 × 10vw margins = 241px.
   *
   * Pinned rather than derived, because the derived version is only as tight
   * as the runner's scrollbar policy: in a body that measures the full 320 the
   * same clamp yields a 256px pill and hands the lockup ~15px it does not have
   * in the case this story exists to prove (G2 react-reviewer, F11 — the first
   * cut's fixture built a 156px cell against the real 147px one). 241px keeps
   * the fixture on the pessimistic side wherever it runs.
   */
  pinned?: boolean;
}): ReactElement => (
  <header
    className={
      pinned
        ? // The PINNED branch keeps its literal on purpose: it REPLACES the
          // gutter with a measured width and shares only the container mark,
          // so it is not a copy of the definition (see `pinned` above).
          '@container mx-auto my-8 w-[15.0625rem] rounded-lg border border-line-subtle bg-surface'
        : // The fluid branch quotes the SAME constant the Header pill now
          // wears (ui/Container's `containerClasses`, board fb-343) — this
          // decorator imitates that consumer's box, so it must not hold its
          // own spelling of the number. Byte-identical to what it replaced.
          cx(
            containerClasses,
            'my-8 rounded-lg border border-line-subtle bg-surface',
          )
    }
  >
    {/* h-16 = 4rem — the ruler the percentage-sized artwork resolves against.
        STALE AS A CLAIM ABOUT THE SHIPPED ROWS, recorded rather than quietly
        corrected: this said "the row height BOTH consumers give it (fb-205)"
        and that stopped being true on 2026-09-04, when the owner's uniform bar
        height took Header's row — and, per fb-205, the Footer's ruler — to
        `h-20`/5rem. This harness still samples 4rem, so these baselines
        photograph the lockup at a size no consumer now uses. Aligning it is a
        one-word change that re-records the Wordmark frames, which is a
        deliberate visual decision and not a drive-by: it is booked for the
        owner rather than taken here (reported with the F18 round).
        `self-stretch` on the wrapper is what the Header does for the
        same reason: `items-center` centres children instead of stretching
        them, and a centred child has no full height to be a percentage of.
        px-4 + gap-4 are the pill's own numbers, and they are load-bearing in
        the pinned case: 241 − 2 border − 32 padding = 207 of row, minus the
        44px control and the 16px gap = the 147.00px cell the Header really
        offers at 320. */}
    <div className="flex h-16 items-center gap-4 px-4">{children}</div>
  </header>
);

const meta = {
  title: 'Sections/Wordmark',
  component: Wordmark,
  parameters: { layout: 'fullscreen' },
  // args flow through (G2 TS r2, M2): the D11 artwork control in the
  // workbench is LIVE — empty args render the component's own default, so the
  // baselines are untouched, and dropping a different artwork into the panel
  // actually draws it.
  render: (args) => (
    <Cell>
      <div className="flex self-stretch">
        <Wordmark {...args} />
      </div>
    </Cell>
  ),
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The artwork's height as a PERCENTAGE of the row, read off the layout.
 * getBoundingClientRect, not offsetHeight: the rule is "90% of 4rem" = 57.6px,
 * and offsetHeight rounds that to 58 — which reads back as 91%, an off-by-one
 * that would make the assertion lie about which number is in the class.
 */
const artworkPercent = (img: HTMLElement, anchor: HTMLElement): number =>
  Math.round(
    (img.getBoundingClientRect().height /
      anchor.getBoundingClientRect().height) *
      100,
  );

/** The four elements a play function needs, found the way a reader would. */
const parts = (root: HTMLElement) => {
  const text = root.querySelector('span.font-display') as HTMLElement;
  const anchor = text.closest('a') as HTMLElement;
  return {
    anchor,
    img: anchor.querySelector('img') as HTMLElement,
    text,
    row: anchor.closest('div.flex.h-16') as HTMLElement,
  };
};

/**
 * D9, provable in EVERY picture: the lockup looks like a link and is not one.
 * No href, therefore no link role, therefore no tab stop and no accessible
 * name to give it. The day the wiring diff lands this assertion flips — which
 * is the point of writing it down.
 */
const expectPlaceholderAnchor = async (
  canvas: { queryByRole: (role: string) => HTMLElement | null },
  anchor: HTMLElement,
): Promise<void> => {
  await expect(canvas.queryByRole('link')).toBeNull();
  await expect(anchor).not.toHaveAttribute('href');
};

/** D10: both parts render at every width — nothing may hide (D12 removed the
 * bar, so artwork + name is the whole census). */
const expectAllPartsVisible = async (
  p: ReturnType<typeof parts>,
): Promise<void> => {
  for (const el of [p.img, p.text]) {
    await expect(el.offsetWidth).toBeGreaterThan(0);
    await expect(el.offsetHeight).toBeGreaterThan(0);
  }
};

/** §7: nothing may require horizontal scrolling, at any width. */
const expectNoOverflow = async (p: ReturnType<typeof parts>): Promise<void> => {
  await expect(p.anchor.scrollWidth).toBeLessThanOrEqual(p.anchor.clientWidth);
  await expect(p.row.scrollWidth).toBeLessThanOrEqual(p.row.clientWidth);
};

/**
 * FULL SIZE, Romanian, at the laptop width §13 samples for this tier.
 *
 * This is the everyday picture and the one both consumers show from roughly a
 * 420px viewport up: the artwork at 90% of the 4rem row (58px tall, 86px wide
 * at the demo cat's 1.49:1) and "Premium Smile" on one line at Heading's
 * title step — ~237px of lockup in a 1212px pill (D12: no bar between them).
 *
 * The play function measures the two ratios the file header derives, because a
 * picture cannot: the artwork's 90% and the gap's 0.75rem. If either drifts,
 * this fails before a baseline does.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    const p = parts(canvasElement);

    await expectPlaceholderAnchor(canvas, p.anchor);
    await expectAllPartsVisible(p);
    await expectNoOverflow(p);

    // The name is DATA, never a message key — the same string the JSON-LD and
    // the Footer's NAP will carry (§10.1).
    await expect(p.text).toHaveTextContent(clinic.name);
    // Full size: 90% of the row, and the untightened gap-3.
    await expect(artworkPercent(p.img, p.anchor)).toBe(90);
    await expect(getComputedStyle(p.anchor).columnGap).toBe('12px');
    // One line at text-xl (28px line box) — the fb-207 invariant the tighten
    // step below exists to protect at the phone widths.
    await expect(p.text.offsetHeight).toBeLessThan(40);
  },
};

/**
 * THE 320px STRESS WIDTH (§7, §9) — the tighten step, in the tightest cell the
 * repo can give this component.
 *
 * THE FIXTURE IS CALIBRATED, not sketched (G2 react-reviewer, F11). The pill
 * is pinned to its measured 241px and the extra child is the Header's 2.75rem
 * burger, so the row arithmetic here IS the Header's: 241 − 2 border − 32
 * `px-4` = 207, minus 44 and the 16px `gap-4` = a 147.00px cell. The first cut
 * derived the width from the gutter clamp instead and built a 156px cell —
 * 9px of comfort no consumer offers, in the one story whose entire job is to
 * deny it.
 *
 * What the step does, and why the numbers are what they are (the full
 * derivation is in Wordmark.tsx): below a 20rem container the gap drops to
 * 0.5rem and the artwork to 40% of the row, which keeps the name on ONE line
 * at 390 with 17.94px to spare (203px cell, re-measured). At 320 nothing can — one line needs ~185px
 * against this 147.00px cell — so the name reflows onto two 28px lines inside
 * the 4rem row, and what has to fit is the min-content sum: 38.22 + 8
 * + 83.70 = 129.92, i.e. 17.08px of real slack (13.42 against G2's stricter
 * reading of the same word — sized against that one; D12's removed bar and
 * second gap are where the extra room came from). Reflow, not removal: D10's
 * rule is that every part renders at EVERY width (fb-202), and the assertions
 * below are that rule, not the picture's.
 *
 * The 'stress-320' tag is what carries this story into the visual net at 320
 * (tests/visual/stories.spec.ts) on top of the tier's own 390 + 1536.
 */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  render: (args) => (
    <Cell pinned>
      <div className="flex self-stretch">
        <Wordmark {...args} />
      </div>
      {/* The Header's burger, as a box: same 2.75rem square (§9's touch
          target), same `ml-auto`, aria-hidden because it is a measurement
          fixture and not a control.
          `shrink-0` is copied from ui/GlyphButton's own base classes
          (GlyphButton.tsx:108-109) and it is the whole reason this fixture is
          honest. Without it the stand-in is the row's second shrinkable item:
          it gives up ~8.7px of its 44 to the over-constrained row, and hands
          the lockup a 155.69px cell instead of the 147.00px the real burger
          leaves it — which is exactly the "9px too roomy" the reviewer
          measured. The real control cannot do that, so neither may this. */}
      <div
        aria-hidden="true"
        className="ml-auto size-11 shrink-0 rounded-md bg-line-subtle"
      />
    </Cell>
  ),
  play: async ({ canvas, canvasElement }) => {
    const p = parts(canvasElement);

    await expectPlaceholderAnchor(canvas, p.anchor);
    await expectAllPartsVisible(p);
    await expectNoOverflow(p);

    // THE CELL ITSELF, before anything about the lockup: 207px of row content
    // and a 44px control mean the lockup is offered 147.00px, which is the
    // number Wordmark.tsx's arithmetic is written against. If this fixture
    // ever drifts, it fails HERE rather than by quietly passing a laxer test.
    const style = getComputedStyle(p.row);
    const control = p.row.lastElementChild as HTMLElement;
    // clientWidth is the PADDING box, so the pill's own px-4 comes back out
    // before the cell arithmetic starts.
    const rowContent =
      p.row.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const cell =
      rowContent -
      control.getBoundingClientRect().width -
      parseFloat(style.columnGap);

    await expect(p.row.getBoundingClientRect().width).toBe(239);
    await expect(rowContent).toBe(207);
    await expect(cell).toBe(147);
    // …and the lockup fills that cell with genuine slack rather than by
    // crushing anything. WHERE THE SLACK LIVES is worth being precise about:
    // the anchor stretches to the whole 147.00px, so the headroom shows up as
    // the TEXT BOX being wider than the longest word it has to hold —
    // 147.00 − 38.22 artwork − 8 gap = 100.78px of text box against an
    // 83.70px "Premium", i.e. the slack the file header derives (D12: no bar,
    // one gap). Below that the word would spill out of its box, which is what
    // the two assertions here catch. The floor of 89 clears the widest
    // measurement of that word by a pixel and still fails long before
    // anything can overflow.
    await expect(p.anchor.getBoundingClientRect().width).toBe(147);
    await expect(p.text.getBoundingClientRect().width).toBeGreaterThan(89);
    await expect(p.text.scrollWidth).toBeLessThanOrEqual(p.text.clientWidth);

    // The step is LIVE here: 40% artwork, gap-2.
    await expect(artworkPercent(p.img, p.anchor)).toBe(40);
    await expect(getComputedStyle(p.anchor).columnGap).toBe('8px');
    // …and the name reflows onto a second line rather than being clipped or
    // dropped — still the whole name, still inside the 4rem row.
    await expect(p.text).toHaveTextContent(clinic.name);
    await expect(p.text.offsetHeight).toBeGreaterThan(40);
    await expect(p.text.offsetHeight).toBeLessThanOrEqual(
      p.anchor.offsetHeight,
    );
  },
};
