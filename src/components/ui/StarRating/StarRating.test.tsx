import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { Rating } from '@/lib/rating/rating';
import { StarRating, type StarRatingProps } from './StarRating';
import source from './StarRating.tsx?raw';

// Role-based queries wherever a role exists (§9): a passing test doubles as
// proof of accessible markup. The row IS the role here — one `role="img"`
// with one name — so every structural assertion below reaches the five slots
// through `data-fill`, which exists for exactly that purpose (the old
// `data-filled` precedent, now three-valued because halves are real).
//
// FIXTURES (§15.7 — Romanian first). The label a section really hands this
// atom is finished ICU output (`home.reviews.rating`), i.e. mostly digits;
// RO_MARKS is the same sentence widened so ă, ș and ț travel the aria-label
// path once and a broken encoding layer fails HERE rather than in a patient's
// screen reader. There is no seven-mark sweep in this file because this atom
// renders no text at all: the label is an ATTRIBUTE that passes straight
// through, and the glyphs are geometry.
const RO_LABEL = '4,5 din 5 stele';
const RO_MARKS = 'Părerea pacienților despre ședințe: 4,5 din 5 stele';
const DE_LABEL = '4,5 von 5 Sternen'; // the longest locale (§8.4)

// THE class recipes, in canonical order, written out rather than imported —
// the ui/Eyebrow convention — so a silent edit to the component's constants
// fails here instead of quietly re-defining what the test compares against.
// The two SVG strings include what the glyph itself emits (`size-4 shrink-0`,
// the folder README's one-size-class rule) followed by the className this atom
// hands it: ONE glyph, two inks (owner 2026-09-12 — no outline, ever) —
// EMPTY_STAR is the ink-muted star an unearned slot is made of (and the
// underside of a half), FILL_STAR the gold one, and the half adds the clip to
// the gold only.
const ROOT =
  'inline-flex items-center gap-0.5 leading-none forced-color-adjust-none';
const SLOT = 'relative size-4 shrink-0';
const FILL_STAR = 'size-4 shrink-0 absolute inset-0 text-star';
const EMPTY_STAR = 'size-4 shrink-0 absolute inset-0 text-ink-muted';
const HALF_CLIP = '[clip-path:inset(0_50%_0_0)]';

type Fill = 'full' | 'half' | 'empty';

// The whole population — all eleven legal values, spelled out rather than
// computed. A test that re-derived `value >= k` from the implementation's own
// rule would agree with any rule; these rows are the owner's sentence
// ("3.5 = three full, one half, one empty") written as data.
const SEQUENCES: ReadonlyArray<readonly [Rating, readonly Fill[]]> = [
  [0, ['empty', 'empty', 'empty', 'empty', 'empty']],
  [0.5, ['half', 'empty', 'empty', 'empty', 'empty']],
  [1, ['full', 'empty', 'empty', 'empty', 'empty']],
  [1.5, ['full', 'half', 'empty', 'empty', 'empty']],
  [2, ['full', 'full', 'empty', 'empty', 'empty']],
  [2.5, ['full', 'full', 'half', 'empty', 'empty']],
  [3, ['full', 'full', 'full', 'empty', 'empty']],
  [3.5, ['full', 'full', 'full', 'half', 'empty']],
  [4, ['full', 'full', 'full', 'full', 'empty']],
  [4.5, ['full', 'full', 'full', 'full', 'half']],
  [5, ['full', 'full', 'full', 'full', 'full']],
];

const rowOf = (name = RO_LABEL) => screen.getByRole('img', { name });
const slotsOf = (row: Element) => [...row.querySelectorAll('[data-fill]')];
const fillsOf = (row: Element) =>
  slotsOf(row).map((slot) => slot.getAttribute('data-fill'));
const classOf = (element: Element) => element.getAttribute('class') ?? '';
const tokensOf = (element: Element) =>
  classOf(element).split(/\s+/).filter(Boolean);

describe('StarRating — element & the ONE accessible name', () => {
  it('renders a <span role="img"> carrying the consumer\'s finished label', () => {
    render(<StarRating value={4.5} aria-label={RO_LABEL} />);
    const row = rowOf();
    expect(row.tagName).toBe('SPAN');
    expect(row).toHaveAttribute('aria-label', RO_LABEL);
  });

  it('passes Romanian diacritics through the label untouched', () => {
    render(<StarRating value={4.5} aria-label={RO_MARKS} />);
    expect(rowOf(RO_MARKS)).toBeInTheDocument();
  });

  it('takes the longest locale as-is — no default, ever (§8.1)', () => {
    // German is the expansion worst case (§8.4). Nothing in this atom
    // formats, joins or falls back to a string: a `${v} out of 5 stars`
    // default (the old site's) would have shipped English into all five
    // locales.
    render(<StarRating value={4.5} aria-label={DE_LABEL} />);
    expect(rowOf(DE_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /out of 5 stars/ })).toBeNull();
  });

  it('exposes exactly ONE image to assistive tech — the row, never a star', () => {
    render(<StarRating value={3.5} aria-label={RO_LABEL} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('keeps every glyph decorative and roleless', () => {
    // Five slots, up to six glyphs: each one announced would turn a single
    // "4,5 din 5 stele" into six nameless images (an axe svg-img-alt fail on
    // top of the noise).
    const { container } = render(
      <StarRating value={3.5} aria-label={RO_LABEL} />,
    );
    const glyphs = [...container.querySelectorAll('svg')];
    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
      expect(glyph).not.toHaveAttribute('role');
      expect(glyph).not.toHaveAttribute('aria-label');
    }
    // …and no element between the row and the glyphs invents a role either.
    expect(container.querySelectorAll('[role]')).toHaveLength(1);
  });

  it('renders no text of its own — the digits live in the label', () => {
    const { container } = render(
      <StarRating value={4.5} aria-label={RO_LABEL} />,
    );
    expect(container.textContent).toBe('');
  });
});

describe('StarRating — the arithmetic (all eleven values)', () => {
  it.each(SEQUENCES)('%s → %s', (value, expected) => {
    render(<StarRating value={value} aria-label={RO_LABEL} />);
    expect(fillsOf(rowOf())).toEqual([...expected]);
  });

  it.each(SEQUENCES)('%s always renders five slots', (value) => {
    // The row's WIDTH is a constant: an empty star is a slot, not a gap, so a
    // 2/5 rating and a 5/5 rating occupy the same box in a card header.
    render(<StarRating value={value} aria-label={RO_LABEL} />);
    expect(slotsOf(rowOf())).toHaveLength(5);
  });

  it('never puts a full star after a lesser one (full → half → empty, once)', () => {
    // The shape of the whole row, asserted independently of the table above:
    // the rating reads left to right and there is at most one half in it.
    const rank = { full: 2, half: 1, empty: 0 } as const;
    for (const [value] of SEQUENCES) {
      const { unmount } = render(
        <StarRating value={value} aria-label={RO_LABEL} />,
      );
      const fills = fillsOf(rowOf()) as Fill[];
      const ranks = fills.map((fill) => rank[fill]);
      expect(
        ranks.every((r, i) => i === 0 || ranks[i - 1] >= r),
        `${value}: ${fills.join(',')} is not descending`,
      ).toBe(true);
      expect(fills.filter((fill) => fill === 'half').length).toBeLessThan(2);
      unmount();
    }
  });
});

describe('StarRating — one drawing, two inks (owner 2026-09-12: no outline, ever)', () => {
  // The owner struck the stroked twin at pack round 2: a star is a SOLID
  // shape in one of two inks — the muted ink of the review's own body text
  // for an unearned star, the gold for an earned one — and a half is the gold
  // clipped over the gray. What carries the rating for a visitor who cannot
  // tell the inks apart is the row's accessible NAME (the digits, finished by
  // the consumer); what keeps the two inks apart for everyone else is
  // LIGHTNESS, not hue — gold #d4af37 against ink-muted #5b554f is 3.5:1, a
  // difference every colour-vision deficiency preserves (the header's "no
  // outline" paragraph records the rest of the trade).

  it('paints an EMPTY slot as ONE solid ink-muted star — nothing hollow, nothing stroked', () => {
    render(<StarRating value={0} aria-label="0 din 5 stele" />);
    for (const slot of slotsOf(rowOf('0 din 5 stele'))) {
      expect(slot.getAttribute('data-fill')).toBe('empty');
      const glyphs = [...slot.querySelectorAll('svg')];
      expect(glyphs).toHaveLength(1);
      expect(classOf(glyphs[0])).toBe(EMPTY_STAR);
      expect(slot.innerHTML).not.toMatch(/text-star/);
    }
  });

  it('paints a FULL slot as ONE solid gold star — no gray underneath to fringe it', () => {
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    for (const slot of slotsOf(rowOf())) {
      expect(slot.getAttribute('data-fill')).toBe('full');
      const glyphs = [...slot.querySelectorAll('svg')];
      expect(glyphs).toHaveLength(1);
      expect(classOf(glyphs[0])).toBe(FILL_STAR);
    }
  });

  it('paints a HALF slot as the gray star with the gold clipped over its left half', () => {
    // `inset(0 50% 0 0)` hides the right half of the gold star and the gray
    // one underneath shows through. Left-to-right by construction: all five
    // locales are LTR (§1), so the physical spelling is correct here and a
    // future RTL locale would re-open it, not a logical property.
    render(<StarRating value={3.5} aria-label={RO_LABEL} />);
    const half = slotsOf(rowOf()).find(
      (slot) => slot.getAttribute('data-fill') === 'half',
    ) as Element;
    const glyphs = [...half.querySelectorAll('svg')];
    expect(glyphs).toHaveLength(2);
    // DOM order is stacking order (both absolute, auto z-index): the gray
    // first, the gold on top of it.
    expect(classOf(glyphs[0])).toBe(EMPTY_STAR);
    expect(classOf(glyphs[1])).toBe(`${FILL_STAR} ${HALF_CLIP}`);
    expect(half.firstElementChild).toBe(glyphs[0]);
    expect(half.lastElementChild).toBe(glyphs[1]);
  });

  it('stacks a second glyph on a half slot ONLY', () => {
    render(<StarRating value={3.5} aria-label={RO_LABEL} />);
    for (const slot of slotsOf(rowOf())) {
      const fill = slot.getAttribute('data-fill');
      expect(slot.querySelectorAll('svg')).toHaveLength(
        fill === 'half' ? 2 : 1,
      );
    }
  });

  it('draws the SAME path in both inks — one glyph file, never two drawings', () => {
    // The load-bearing property that lets a half meet on its own edge: the
    // gray and the gold are the same `d`, so the clip cuts one shape and the
    // other closes it. Asserted through the rendered DOM, so it holds across
    // the swap to the owner's real artwork (one path string in Star.tsx).
    render(<StarRating value={3.5} aria-label={RO_LABEL} />);
    const paths = [...rowOf().querySelectorAll('path')].map((path) =>
      path.getAttribute('d'),
    );
    expect(paths).toHaveLength(6); // three full + the half's pair + one empty
    expect(new Set(paths).size).toBe(1);
    expect((paths[0] ?? '').length).toBeGreaterThan(0);
  });

  it('strokes nothing — every glyph is a filled star, in any state', () => {
    render(<StarRating value={2.5} aria-label={RO_LABEL} />);
    for (const glyph of rowOf().querySelectorAll('svg')) {
      expect(glyph).toHaveAttribute('fill', 'currentColor');
      expect(glyph).not.toHaveAttribute('stroke');
      expect(glyph).not.toHaveAttribute('stroke-width');
    }
  });

  it('keeps its two inks under forced colours — they ARE the rating', () => {
    // Windows high contrast would paint every star CanvasText and 3,5 would
    // look like 5; the row opts out, and the glyphs inherit the opt-out.
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    expect(tokensOf(rowOf())).toContain('forced-color-adjust-none');
  });

  it('emits exactly the slot box and nothing else', () => {
    // `relative` is what a stacked glyph's `absolute inset-0` resolves against
    // — and, with every child out of flow, it is also what makes `size-4` the
    // thing that gives the box its 1rem (§7 rem, never the old `size={18}`
    // pixels); `shrink-0` keeps the row intact in a tight card header.
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    for (const slot of slotsOf(rowOf())) {
      expect(classOf(slot)).toBe(SLOT);
    }
  });

  it('paints gold with the LOCKED --color-star token, never a one-off hex', () => {
    // §15.1 locks the star TOKEN — since 2026-09-12 at the old site's own
    // #d4af37 (the owner's "more golden, faded") — and the atom wears the
    // token, so the value is the theme layer's business (§3). A hex here
    // would make the stars the one thing on the site immune to it.
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    const gold = [...slotsOf(rowOf())[0].querySelectorAll('svg')][0];
    expect(tokensOf(gold)).toContain('text-star');
    expect(classOf(gold)).not.toMatch(/#[0-9a-f]{3,8}|rgba?\(/i);
  });

  it('paints the empties with the body copy’s own ink token (D5, round 2)', () => {
    render(<StarRating value={0} aria-label="0 din 5 stele" />);
    const gray = [
      ...slotsOf(rowOf('0 din 5 stele'))[0].querySelectorAll('svg'),
    ][0];
    expect(tokensOf(gray)).toContain('text-ink-muted');
    expect(classOf(gray)).not.toMatch(/#[0-9a-f]{3,8}|rgba?\(/i);
  });
});

describe('StarRating — THE row definition', () => {
  it('emits exactly the root recipe and nothing else', () => {
    // toBe, never toContain: equality is the only assertion that can prove a
    // smuggled utility (a margin, a text-*, a viewport variant) stayed out.
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    expect(classOf(rowOf())).toBe(ROOT);
  });

  it('owns no outer margin (§6.4 — the parent owns spacing)', () => {
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    expect(tokensOf(rowOf()).filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual(
      [],
    );
  });

  it('carries no responsive self-scaling (§6.5)', () => {
    // No `sm:`/`md:` and no `@`-variant either: the star size is a constant
    // (see the no-`size`-prop pin below), so there is nothing to react to.
    render(<StarRating value={5} aria-label={RO_LABEL} />);
    expect(
      tokensOf(rowOf()).filter((t) => /^(sm|md|lg|xl|2xl|@[a-z0-9]+):/.test(t)),
    ).toEqual([]);
  });
});

describe('StarRating — §6.8 native-element fidelity', () => {
  it('merges the caller className LAST — placement rides on top', () => {
    // `ms-auto` is the canonical case: the ReviewCard header pushes the row
    // to the end, opposite the avatar. That is PLACEMENT, which §6.8 hands
    // the parent — and it is why the atom's OWN string carries no margin
    // (the test above), not a contradiction of it. Order is a deterministic
    // convention the test pins, never a cascade mechanism.
    render(<StarRating value={5} aria-label={RO_LABEL} className="ms-auto" />);
    expect(classOf(rowOf())).toBe(`${ROOT} ms-auto`);
  });

  it('accepts ref as a regular prop (React 19)', () => {
    const row = createRef<HTMLSpanElement>();
    render(<StarRating value={5} aria-label={RO_LABEL} ref={row} />);
    expect(row.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('spreads remaining native props onto the rendered <span>', () => {
    render(
      <StarRating
        value={5}
        aria-label={RO_LABEL}
        id="nota-recenzie"
        lang="ro"
        title={RO_LABEL}
        data-slot="rating"
      />,
    );
    const row = rowOf();
    expect(row).toHaveAttribute('id', 'nota-recenzie');
    expect(row).toHaveAttribute('lang', 'ro');
    expect(row).toHaveAttribute('title', RO_LABEL);
    expect(row).toHaveAttribute('data-slot', 'rating');
    // …and the atom's own prop never leaks into the DOM.
    expect(row).not.toHaveAttribute('value');
  });
});

describe('StarRating — the runtime belt (D2)', () => {
  // The type union is the FIRST line of defence and the one that matters at a
  // call site; this belt catches the values that arrive as plain `number` —
  // a JSON list, a cast, a future CMS field — where the old site silently
  // rounded 3.4 down and 3.5 up to whole stars and showed a rating nobody
  // gave. Loud beats quiet: the RangeError names the atom, the rule and the
  // received value (the createClock precedent in lib/clock/clock.ts).
  const illegal: ReadonlyArray<[string, number]> = [
    ['a third of a star', 4.3],
    ['below zero', -1],
    ['above five', 6],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ];

  it.each(illegal)('throws a RangeError for %s (%s)', (_name, value) => {
    // React logs the thrown render error too; silencing console.error keeps
    // the run readable without hiding the assertion (the Card/Heading
    // precedent). try/finally, because a FAILING assertion would otherwise
    // leave the rest of the file running silenced.
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        render(<StarRating value={value as Rating} aria-label={RO_LABEL} />),
      ).toThrow(RangeError);
      expect(() =>
        render(<StarRating value={value as Rating} aria-label={RO_LABEL} />),
      ).toThrow(/StarRating: rating must be a half-step/);
    } finally {
      silence.mockRestore();
    }
  });

  it('names the received value in the message', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        render(<StarRating value={4.3 as Rating} aria-label={RO_LABEL} />),
      ).toThrow(/received 4\.3/);
    } finally {
      silence.mockRestore();
    }
  });

  it.each(SEQUENCES)('lets the legal value %s through untouched', (value) => {
    // Never-vacuous guard: a belt that threw on everything would also pass
    // every assertion above.
    expect(() =>
      render(<StarRating value={value} aria-label={RO_LABEL} />),
    ).not.toThrow();
  });
});

describe('StarRating — the contract, pinned at the type level', () => {
  // Never rendered: these exist so `tsc --noEmit` fails if the contract
  // loosens. @ts-expect-error is itself an error when the line compiles, so
  // both directions are covered.

  it('rejects a rating that is not a half step', () => {
    const thirds = (
      // @ts-expect-error — 4.3 is not a Rating: halves only (D2)
      <StarRating value={4.3} aria-label={RO_LABEL} />
    );
    expect(thirds).toBeTruthy();
  });

  it('rejects a rating outside 0…5', () => {
    const tooHigh = (
      // @ts-expect-error — 6 is not a Rating: the scale is five stars
      <StarRating value={6} aria-label={RO_LABEL} />
    );
    expect(tooHigh).toBeTruthy();
  });

  it('requires the accessible name (§6.3 — the children are not text)', () => {
    const nameless = (
      // @ts-expect-error — aria-label is REQUIRED: five glyphs are not a name
      <StarRating value={5} />
    );
    expect(nameless).toBeTruthy();
  });

  it('types aria-label as REQUIRED, not optional', () => {
    // The surgical twin of the line-scoped @ts-expect-error above: that one
    // would swallow ANY error on its expression, this one names the property.
    expectTypeOf<StarRatingProps>().toHaveProperty('aria-label');
    expectTypeOf<StarRatingProps['aria-label']>().toEqualTypeOf<string>();
    expectTypeOf<Rating>().toEqualTypeOf<
      0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5
    >();
  });

  it('has no size axis — 1rem stars, one consumer (§6.6)', () => {
    // A second consumer that MEASURES a different star size re-opens this as
    // an additive prop with a board note (StarRating.tsx's header names the
    // trigger); a wish does not.
    expectTypeOf<StarRatingProps>().not.toHaveProperty('size');
  });

  it('accepts no children and no role override — the row IS the image', () => {
    expectTypeOf<StarRatingProps>().not.toHaveProperty('children');
    expectTypeOf<StarRatingProps>().not.toHaveProperty('role');
  });

  it('does carry the span surface those pins are read against', () => {
    // Never-vacuous guard: if the props type ever degraded to `{}` or `any`,
    // every assertion above would pass while proving nothing.
    expectTypeOf<StarRatingProps>().toHaveProperty('className');
    expectTypeOf<StarRatingProps>().toHaveProperty('value');
    expectTypeOf<StarRatingProps>().toHaveProperty('id');
  });
});

describe('StarRating — the zero-island invariant (source guard)', () => {
  it("ships no 'use client' directive", () => {
    // Load-bearing, and invisible to any runtime assertion: a directive here
    // would hydrate every band that composes a review card — for five spans
    // that have no state, no handler and nothing to focus (§16). Tolerant of
    // trailing line AND block comments (`'use client'; /* … */` is a live
    // directive — the prologue grammar keeps comment company legal); the
    // recorded tolerance is Card.test.tsx's, verbatim, because this is the
    // same guard.
    expect(source).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
  });

  it('holds no React state hook either', () => {
    // The belt to that guard's braces: a hook would BREAK the build rather
    // than hydrate silently (a Server Component cannot call one), but naming
    // it here says why the file has none — the rating is a prop, and five
    // spans are the whole runtime (§16).
    expect(source).not.toMatch(
      /\buse(State|Effect|Ref|SyncExternalStore)\s*\(/,
    );
  });
});
