import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Star } from '@/assets/glyphs/Star';
import { cx } from '@/lib/cx/cx';
import { assertRating, type Rating } from '@/lib/rating/rating';

// ui/StarRating — five star slots showing a rating in halves, as ONE named
// image. A rework of the old repo's `ui/stars` (reviews-carousel run, master
// board fb-432…448), not a port: the shape survived, every one of its four
// smells is listed at the bottom of this header with what replaced it.
//
// ── ONE DRAWING, TWO INKS, THREE STATES (owner decision D4; reshaped on the
// owner's word at pack round 2, 2026-09-12: "the stars must never have
// outline — the colour of the star just dictates half full / half empty").
// Every slot is a SOLID star from ONE glyph file, assets/glyphs/Star.tsx,
// painted in one of two inks: `--ink-muted` — the same ink as the review's
// own body text, the shade the owner pointed at for "a gray, but a darker
// one" — for an unearned star, and `--color-star` for an earned one. A half
// is the gray star with the gold star laid over it and CLIPPED to its left
// 50%, so the two halves meet on the glyph's own edge because they are the
// same path. A full and an empty slot hold exactly ONE glyph (no gray under
// the gold, so nothing can fringe a solid star); only a half stacks two.
//   · A clip is PAINT, not geometry — the slot box stays exactly 1rem in all
//     three states, so a 2/5 and a 5/5 rating occupy the same width in a card
//     header and nothing reflows when the number changes.
//   · Both glyphs of a half are `absolute inset-0` with auto z-index, so DOM
//     order IS stacking order: gray first, gold on top.
//   · When the owner's real star artwork lands, the swap is Star.tsx's ONE
//     path string; this file does not change.
//
// ── WHAT "NO OUTLINE" COSTS, RECORDED RATHER THAN HIDDEN. The previous
// spelling (the G2 a11y fold of 2026-09-10) drew a stroked twin of the star
// on top of every slot so an unearned star was HOLLOW — the rating as shape
// (SC 1.4.1) with a ≥7:1 boundary (SC 1.4.11). Struck at pack round 2. What
// remains, and why it is a defensible AA reading rather than a return to the
// old site's `text-border` hairline:
//   · THE ROW'S NAME carries the rating for everyone who cannot tell the inks
//     apart — "4,5 din 5 stele", finished ICU text from the consumer (§6.3,
//     §8.1 — the paragraph below). Nobody has to count stars.
//   · THE TWO INKS DIFFER IN LIGHTNESS, not merely in hue: gold #d4af37
//     against ink-muted #5b554f measures 3.5:1 (the 2026-09-10 pair — gold
//     #b29126 against the same gray — was 2.4:1, the number that forced the
//     outline). A lightness gap survives every colour-vision deficiency and a
//     grayscale print, which is what SC 1.4.1's "not by colour alone" guards
//     against; a hue-only pair would not.
//   · FORCED COLOURS (Windows high contrast) would collapse both inks to
//     CanvasText and 3,5 would look like 5 — so the row opts out with
//     `forced-color-adjust-none` (inherited by the glyphs): the two inks ARE
//     the information here, which is the one case that property exists for.
//     The name still says the number.
//   · Against WHITE the gold now measures 2.1:1 (3.0:1 at #b29126 — §15.1's
//     value moved to the old site's own gold on the owner's word, the same
//     day). A solid gold star is still plainly a star, but the letter of SC
//     1.4.11 for the star-on-card edge is not met. Recorded as the owner's
//     call; the row's name is the AA answer for the rating itself.
//
// ── THE ARITHMETIC, and why there is no "where does the half go" branch:
// slot k (1…5) is `full` when value ≥ k, `half` when value ≥ k − 0.5, and
// `empty` otherwise. Full stars come first, the half lands on the slot the
// value falls inside, and the empties are simply what is left — the owner's
// sentence ("3.5 = three full, one half, one empty") is the arithmetic, not a
// special case bolted onto it. The comparisons are EXACT: every legal value
// is a multiple of 0.5, and halves are exactly representable in binary
// floating point, so this is not a place where an epsilon is needed.
// `data-fill` on each slot is the test seam (the old `data-filled`
// precedent, now three-valued because halves are real).
//
// ── THE NAME BELONGS TO THE ROW, AND THE TYPES DEMAND IT (§6.3): the children
// are five glyphs, never text, so `aria-label` is REQUIRED — not optional
// with a default. Every glyph stays aria-hidden, so a screen reader announces
// "4,5 din 5 stele" once instead of six nameless images. There is no default
// string and no English anywhere in this file (§8.1, owner fb-259/260): the
// consumer hands over FINISHED ICU output (`home.reviews.rating`), which is
// also what puts the comma in "4,5" for ro/de/fr/it and the dot in "4.5" for
// en without this atom knowing that locales exist.
//
// ── THE GOLD IS THE LOCKED TOKEN: `text-star` → `--color-star`, §15.1 —
// #d4af37 since 2026-09-12, the old site's own gold, which the owner asked for
// in so many words ("more golden, faded/yellowish, not a dark yellow"). The
// gray is `--ink-muted` on the owner's word twice over (D5 "dark gray"; round
// 2 "like this shade from this text", the body copy's ink). Both are semantic
// tokens; a hex here would make the stars the one thing on the site immune to
// the theme layer (§3).
//
// ── LTR BY CONSTRUCTION: the half is clipped on its physical left
// (`inset(0 50% 0 0)`). All five locales are left-to-right (§1) and a
// clip-path inset does not flip with writing direction anyway, so this is
// written physically ON PURPOSE rather than dressed up as a logical property
// that would not actually flip. An RTL locale re-opens this line — together
// with the direction the label's own sentence reads.
//
// ── NO `size` PROP (§6.6, the speculative-API rule): one consumer,
// sections/ReviewCard, and one measurement — 1rem stars (`size="sm"` on the
// glyph), the old site's 16px expressed in rem (§7). TRIGGER, so a section
// lane can tell "not decided" from "decided no": the day a SECOND consumer
// MEASURES a different star size — the named candidate is a services-page
// Google-rating badge — a `size` axis joins ADDITIVELY with a board note, as
// ONE lookup driving the slot box and BOTH glyphs' presets. Never as a
// pixel number, and never through className: two `size-*` utilities on one
// element fight over stylesheet order, which the glyph folder's README states
// as law. className stays PLACEMENT only (§6.8) — `ms-auto` in a card header.
//
// ── THE OLD SMELLS, NAMED AND REFUSED (never silently fixed):
//   · `Math.round(value)` — 3.4 and 3.5 both became four whole stars, i.e. a
//     rating nobody gave. Halves are first-class here, and anything that is
//     not a half dies loudly at the call site (the RangeError below, in
//     lib/clock/clock.ts's `createClock` style) instead of quietly on screen.
//   · `size?: number` in PIXELS — §7 is rem, so browser zoom and user font
//     settings behave; see the no-`size`-prop paragraph above.
//   · a default `${v} out of 5 stars` label — English shipped into all five
//     locales the moment a consumer forgot the prop.
//   · a one-off `--color-gold` theme entry — the smell was the private
//     variable, not its value: the LOCKED `--color-star` now carries that
//     very colour by the owner's later choice, as a theme token.
//
// No 'use client', no hooks, no state, no t() and no message key: composing a
// rating must not cost a band its zero-island contract, so a review card is
// five inert spans on the visitor's device (§16). StarRating.test.tsx's ?raw
// guard pins the directive's absence mechanically, because no runtime
// assertion can see it.

// THE VALUE TYPE AND ITS GUARD LIVE IN lib/rating, NOT HERE (board D2, the
// merge-time decision of the reviews-deck run): the owner's data list in
// lib/reviews must mean the same eleven half-steps this prop means, an atom may
// not import lib DATA (§4 — atoms are site-agnostic) and the foundation ring
// may not depend on the spine, so the meaning sits one level below both as
// React-free MECHANICS (the lib/scroll-lock precedent). Consumers import
// `Rating` from '@/lib/rating/rating' by full path — no re-export here (the
// lib-foldering law: no barrels).

type StarRatingOwnProps = {
  /** The rating itself, in halves. */
  value: Rating;
  /**
   * REQUIRED by the types (§6.3): the children are five glyphs, not text.
   * Finished and localized by the consumer — never a default, never English
   * in an atom (§8.1). E.g. the section's `home.reviews.rating` output,
   * "4,5 din 5 stele".
   */
  'aria-label': string;
};

export type StarRatingProps = StarRatingOwnProps &
  Omit<
    ComponentPropsWithRef<'span'>, // React 19: ref is a regular prop
    keyof StarRatingOwnProps | 'children' | 'role'
  >;

/** What one slot shows. Internal: the DOM spelling is `data-fill`. */
type Fill = 'full' | 'half' | 'empty';

/** Five, always — an unearned star is a slot, not a gap. */
const SLOTS = [1, 2, 3, 4, 5] as const;

// `forced-color-adjust-none`: the two inks are the rating (see the header's
// "no outline" paragraph), so the row keeps them where a forced palette would
// otherwise paint every star CanvasText. Inherited by the glyphs.
const rowClasses =
  'inline-flex items-center gap-0.5 leading-none forced-color-adjust-none';
// `relative` is what a stacked glyph's `absolute inset-0` resolves against —
// and it is also why the slot needs its own `size-4`: with every child taken
// out of flow, nothing else would give the box a size. `shrink-0` keeps the
// row whole in a tight header. No margin anywhere — the parent owns spacing
// (§6.4).
const slotClasses = 'relative size-4 shrink-0';
/** An unearned star — and the underside of a half: the body copy's own ink. */
const emptyStarClasses = 'absolute inset-0 text-ink-muted';
/** An earned star, or the earned half. */
const fillStarClasses = 'absolute inset-0 text-star';
const halfClipClasses = '[clip-path:inset(0_50%_0_0)]';

function fillOf(value: number, slot: number): Fill {
  if (value >= slot) return 'full';
  if (value >= slot - 0.5) return 'half';
  return 'empty';
}

export function StarRating({
  value,
  'aria-label': ariaLabel,
  className,
  ...rest
}: StarRatingProps): ReactElement {
  // THE BELT to the type union's braces: the union is what a call site sees,
  // this is what catches the values that arrive as a plain `number` — a list
  // the owner authors, a cast, a future CMS field. Loud, at the call site,
  // naming the rule and the value (the `createClock` message style, written
  // once in lib/rating and shared with the data list's own integrity test),
  // because the alternative is what the old component did: round it and show
  // a rating nobody gave.
  assertRating(value, 'StarRating');

  return (
    // §6.8 merge order: the atom's own classes first, the caller's className
    // LAST. A deterministic convention the tests pin, NOT a cascade mechanism.
    <span
      role="img"
      aria-label={ariaLabel}
      className={cx(rowClasses, className)}
      {...rest}
    >
      {SLOTS.map((slot) => {
        const fill = fillOf(value, slot);
        return (
          <span key={slot} data-fill={fill} className={slotClasses}>
            {/* The gray star: the whole of an empty slot, the underside of a
                half. A FULL slot skips it — one solid gold glyph, nothing
                under it to fringe its edge. */}
            {fill !== 'full' && <Star size="sm" className={emptyStarClasses} />}
            {/* The gold star, painted LAST so it sits on top; on a half it is
                clipped to its left 50% and the gray shows through the rest. */}
            {fill !== 'empty' && (
              <Star
                size="sm"
                className={cx(
                  fillStarClasses,
                  fill === 'half' && halfClipClasses,
                )}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}
