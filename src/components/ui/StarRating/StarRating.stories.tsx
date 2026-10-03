import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { Rating } from '@/lib/rating/rating';
import { StarRating } from './StarRating';

// THREE stories, and the count is the honest one: the two ends of the scale
// and the whole population in between. The export NAMES are load-bearing —
// each one names a baseline file (`ui-starrating--full`, `--halves`,
// `--empty`) — so this list IS the atom's contribution to the lane's declared
// visual manifest; renaming or adding an export re-records pictures.
// `UI/*` routes to the 1280 project only (§13) and there is deliberately NO
// 'stress-320' tag: the row is a fixed 5 × 1rem plus four 2px gaps, it holds
// no text, and nothing in it can wrap or reflow at any width.
//
// ── NO DE AND NO PSEUDO-LOCALE STORY EITHER, for the reason that also
// explains the missing 320 tag rather than as a gap: this atom renders no
// text at all. Its only string is the aria-label, an ATTRIBUTE the consumer
// hands over already finished (§8.1) — a German or pseudo label produces a
// byte-identical picture, so a fourth baseline would photograph nothing.
// Those fixtures ("4,5 von 5 Sternen", the Romanian diacritics sweep) live in
// StarRating.test.tsx, where an attribute can actually be asserted; the §8.9
// pseudo-locale sweep passing over this atom unchanged is the contract
// holding, not coverage missing.
//
// Demo values are Romanian (§15.7): the decimal comma in "4,5" is what the
// section's ICU `{rating, number}` really produces in ro/de/fr/it — the atom
// never formats a number itself. Copy is factual, and the ratings below are
// illustrative fixtures rather than the clinic's real scores: real review
// data is the owner's to supply (§15.17), and no claim about it may be
// superlative or promotional (CMSR, in force since 2025-07-01).

// The eleven legal values with the Romanian label each one really ships with.
// `satisfies` keeps a wrong value out; the union's own exhaustiveness is
// pinned in StarRating.test.tsx (`expectTypeOf<Rating>()` plus the eleven-row
// sequence table), which is where a type belongs.
const ALL_RATINGS = [
  [0, '0 din 5 stele'],
  [0.5, '0,5 din 5 stele'],
  [1, '1 din 5 stele'],
  [1.5, '1,5 din 5 stele'],
  [2, '2 din 5 stele'],
  [2.5, '2,5 din 5 stele'],
  [3, '3 din 5 stele'],
  [3.5, '3,5 din 5 stele'],
  [4, '4 din 5 stele'],
  [4.5, '4,5 din 5 stele'],
  [5, '5 din 5 stele'],
] as const satisfies ReadonlyArray<readonly [Rating, string]>;

const meta = {
  title: 'UI/StarRating',
  component: StarRating,
  args: {
    value: 5,
    'aria-label': '5 din 5 stele',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ALL_RATINGS.map(([value]) => value),
      description:
        'The rating, in HALVES — one of eleven values (0, 0.5, … 5), typed as `Rating`. Slot k is full when value ≥ k, half when value ≥ k − 0.5, empty otherwise, so full stars come first and the half lands where the value falls. Anything else — a third of a star, a 6, a NaN — throws a RangeError at render instead of being rounded: the old site’s Math.round showed 3.4 as four whole stars',
    },
    'aria-label': {
      control: 'text',
      description:
        'REQUIRED by the types (§6.3): the children are five glyphs, not text, so the row carries the one accessible name and every star stays aria-hidden. Finished, already-localized text (§8.1) — the section’s ICU output, e.g. home.reviews.rating → "4,5 din 5 stele". There is no default and no English fallback in an atom',
    },
    className: {
      control: false,
      description:
        'PLACEMENT only (§6.8), merged after the atom’s own classes — `ms-auto` to push the row to the end of a card header. Not a styling API: the star size is fixed at 1rem and the gold is the LOCKED --color-star',
    },
  },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The top of the scale, and the atom at rest: five solid gold stars on the
 * LOCKED `--color-star` — #d4af37 since the owner's pack round 2 (2026-09-12),
 * the old site's own gold ("more golden, faded/yellowish, not a dark yellow"),
 * now a theme token rather than that site's one-off `--color-gold`.
 *
 * No outline, by the same decision: a star is a solid shape in one of two
 * inks. Move the `value` control down through the halves and watch the row's
 * width stay put (a clip is paint, not geometry) while the ink changes, star
 * by star, from gold to the body copy's own gray.
 */
export const Full: Story = {};

/**
 * The whole population — all eleven legal values, each with the Romanian
 * label it really ships with. Read the half rows closely: the gold star is
 * clipped to its left 50% over a gray star of the SAME path, which is why the
 * two halves meet exactly on the glyph's own edge (one drawing in Star.tsx —
 * swapping in the owner's artwork is that one path string).
 *
 * Read it in grayscale too: gold #d4af37 against ink-muted #5b554f is a
 * 3.5:1 LIGHTNESS difference, so the eleven rows stay distinguishable with the
 * hue removed — which is what a colour-vision deficiency or a printed page
 * does. The digits themselves travel in the row's accessible name; the
 * header of StarRating.tsx records what the owner's "no outline" trades away
 * (the forced-colours and star-on-white cases) and why.
 *
 * The column's gap and the value captions belong to this wrapper, never to
 * the atom (§6.4) — and the captions are the story's, so a screen reader
 * hearing the label twice here is the demo, not the component.
 */
export const Halves: Story = {
  argTypes: {
    // Dead controls are worse than missing ones (the Card.stories
    // convention): this fixture pins all eleven values and their labels, so
    // neither knob could move the picture.
    value: { control: false },
    'aria-label': { control: false },
  },
  render: () => (
    <ul className="flex flex-col gap-2">
      {ALL_RATINGS.map(([value, label]) => (
        <li key={value} className="flex items-center gap-3">
          <StarRating value={value} aria-label={label} />
          <span className="text-sm text-ink-muted">{label}</span>
        </li>
      ))}
    </ul>
  ),
};

/**
 * Zero, the state the old site got wrong: an unearned star is a SLOT, not a
 * gap — so the row keeps its full width and a card header never reflows when
 * a rating changes — and it is painted in `--ink-muted`, the review body's
 * own ink, on the owner's word twice over (D5 "dark gray"; round 2 "like this
 * shade from this text"), never the old `text-border` hairline: an empty star
 * still has to read as a star from a phone's distance (§1: the audience skews
 * older). Five solid gray stars, no outline — compare with `Full`.
 */
export const Empty: Story = {
  args: {
    value: 0,
    'aria-label': '0 din 5 stele',
  },
};
