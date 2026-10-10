import { createRef, type CSSProperties } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
// The REAL stylesheet, since 2026-10-10, for ONE block of this suite: the
// `card` step's container row MEASURED (13.2px under a 24rem container, the
// default's 14px from it — a class string cannot say what a row comes to).
// The per-file import is the house pattern (PersonnelCard, Card, Modal …);
// every other assertion here reads class strings, attributes and roles, so
// each holds with the sheet or without it. The atom owns no transition.
import '@/styles/globals.css';
import { Eyebrow, type EyebrowProps, type EyebrowSize } from './Eyebrow';

// Role-based queries wherever a role exists (§9): a passing test doubles as
// proof of accessible markup. Fixtures are Romanian WITH diacritics (§15.7).
// RO_ALL carries all seven Romanian marks — Ș ș Ț ț ă â î — so a broken
// encoding path (font subsetting, message pipeline, JSX escaping) fails here
// rather than in front of a patient. Uppercase Ș/Ț (U+0218/U+021A) matter
// doubly for THIS atom: it is the only one that renders text-transform:
// uppercase, so the uppercase comma-below forms are the ones a visitor
// actually sees.
const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';

// The two real section-eyebrow strings the old site ships today.
const RO_LOCATION = 'Ne găsești';

// The default recipe, in canonical order. Written out rather than imported so
// the test fails on a silent edit to the component's constant.
const RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

// The `card` step (2026-10-10, sections/PersonnelCard D20): the default
// recipe plus ONE container override — 13.2px on a snug line in a container
// under 24rem — so an engine without container queries draws the default
// (the G2 fold of 2026-10-10). Written out for RECIPE's reason.
const CARD_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase @max-sm:text-[0.825rem]/snug';

/** The card step's ONE token beyond the default. */
const CARD_OVERRIDE = '@max-sm:text-[0.825rem]/snug';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

describe('Eyebrow — element & semantics', () => {
  it('renders a <p>, children intact including Ș ș Ț ț ă â î', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    // Query the diacritics themselves: getByText would miss the node if any
    // layer normalised or mangled them.
    const paragraph = screen.getByText(RO_ALL);
    expect(paragraph.tagName).toBe('P');
    expect(screen.getByRole('paragraph')).toBe(paragraph);
  });

  it('has no element axis: the host is a hardcoded <p> (owner fb-300)', () => {
    // Every real consumer — SectionHeading's eyebrow, the carousel status,
    // the review-card credential — is a <p>. An `as` prop joins ADDITIVELY
    // (default pinned 'p') if an inline consumer ever materialises; until
    // then the API surface stays two props wide (children, and since
    // 2026-10-10 the additive `size`).
    // @ts-expect-error — `as` is not part of the contract.
    render(<Eyebrow as="span">{RO_ALL}</Eyebrow>);
    // React 19 forwards unknown props to the DOM verbatim — prove the reject
    // is not only a type error but also that nothing silently re-tags.
    expect(screen.getByText(RO_ALL).tagName).toBe('P');
  });

  it('pins the absence of `as` at the type level (surgical twin of the directive)', () => {
    // The @ts-expect-error above is line-scoped and would swallow ANY error
    // on its expression (G2 LOW, both reviewers 2026-09-01); this line is the
    // narrow pin — it stops compiling the moment EyebrowProps gains an `as`
    // property, and names it in the tsc output. Erased to a no-op at runtime.
    expectTypeOf<EyebrowProps>().not.toHaveProperty('as');
  });
});

describe('Eyebrow — the default step, pinned forever (v1)', () => {
  it('emits exactly the recipe and nothing else', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    expect(screen.getByRole('paragraph').className).toBe(RECIPE);
  });

  it('renders size="default" byte-identically to the bare call (§6.6)', () => {
    // Growth must never restyle a bare <Eyebrow>: the default stays
    // 'default' FOREVER, and 'default' IS the v1 recipe to the byte.
    render(<Eyebrow size="default">{RO_ALL}</Eyebrow>);
    expect(screen.getByRole('paragraph').className).toBe(RECIPE);
  });

  it('uses the Tailwind tracking scale, never an arbitrary value (owner 2026-09-01)', () => {
    // The old site used tracking-[0.18em]. The owner chose tracking-widest
    // (0.1em) so the atom stays inside §3's untouched default scale — this
    // repo has zero arbitrary tracking values, and this atom must not be the
    // first. A regression here is a design decision being quietly reverted.
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(tokens).toContain('tracking-widest');
    expect(tokens.filter((t) => t.includes('tracking-['))).toEqual([]);
  });

  it('sits at text-sm, not text-xs (owner 2026-09-01 — §1 older audience)', () => {
    // 14px against the §15.1 1.125rem body base preserves the old site's
    // 0.75 eyebrow-to-body ratio; text-xs would shrink it to 0.67.
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(tokens).toContain('text-sm');
    expect(tokens).not.toContain('text-xs');
  });

  it('carries no leading-* utility (the utility brings its own line-height)', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(tokens.filter((t) => /(^|:)leading-/.test(t))).toEqual([]);
  });

  it('owns no outer margin (§6.4 — the parent owns spacing)', () => {
    // SectionHeading will set the eyebrow-to-title gap on its own Stack; an
    // mt-* smuggled in here would fight it at every call site at once.
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
  });

  it('carries no responsive token at all — the default answers nothing (§6.5)', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(
      tokens.filter((t) => /^(sm|md|lg|xl|2xl|@[a-z0-9-]+):/.test(t)),
    ).toEqual([]);
  });
});

describe('Eyebrow — the card step (a doctor card’s specialty, PersonnelCard D20, 2026-10-10)', () => {
  it('emits exactly the card recipe and nothing else', () => {
    render(<Eyebrow size="card">{RO_ALL}</Eyebrow>);
    expect(screen.getByRole('paragraph').className).toBe(CARD_RECIPE);
  });

  it('is the default recipe plus ONE container override — 13.2px on a snug line under 24rem, the default everywhere else', () => {
    // Every utility of the default stays — the face, the size, the weight,
    // the tracking, the ink, the uppercase — so the two steps can never drift
    // apart on any property but the size under 24rem, and an engine without
    // container queries draws the site's one eyebrow. (The owner's "10%
    // bigger" over the picked rendition's 12px: 13.2px, 0.825rem at the 16px
    // root.)
    const card = CARD_RECIPE.split(' ');
    const base = RECIPE.split(' ');
    expect(card.filter((token) => !base.includes(token))).toEqual([
      CARD_OVERRIDE,
    ]);
    expect(base.filter((token) => !card.includes(token))).toEqual([]);
    expect(card.filter((token) => token !== CARD_OVERRIDE).join(' ')).toBe(
      RECIPE,
    );
  });

  it('reads its CONTAINER through exactly one override, never the viewport (§6.5)', () => {
    render(<Eyebrow size="card">{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    const variants = tokens.filter((t) => /^@?[a-z0-9-]+:/.test(t));
    expect(variants).toEqual([CARD_OVERRIDE]);
    expect(variants.every((t) => t.startsWith('@'))).toBe(true);
  });

  it('pins the size union so a refactor cannot quietly widen it', () => {
    expectTypeOf<EyebrowSize>().toEqualTypeOf<'default' | 'card'>();
    expectTypeOf<EyebrowProps['size']>().toEqualTypeOf<
      EyebrowSize | undefined
    >();
  });

  it('leaks no `size` attribute onto the <p>', () => {
    render(<Eyebrow size="card">{RO_ALL}</Eyebrow>);
    expect(screen.getByRole('paragraph')).not.toHaveAttribute('size');
  });
});

/** An eyebrow in a `@container` box `width` rem wide — the box's width an
 *  inline style, never an arbitrary class (a width spelled as a class here
 *  would ship in the site's sheet as a rule nothing on the site wears). */
const measuredEyebrow = (size: EyebrowSize, width: number) => {
  const style: CSSProperties = { width: `${width}rem` };
  const { unmount } = render(
    <div className="@container" style={style}>
      <Eyebrow size={size}>{RO_ALL}</Eyebrow>
    </div>,
  );
  const paragraph = screen.getByRole('paragraph');
  const computed = getComputedStyle(paragraph);
  const measured = {
    box: (paragraph.parentElement as HTMLElement).getBoundingClientRect().width,
    fontSize: computed.fontSize,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing,
  };
  unmount();
  return measured;
};

const rootPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

describe('Eyebrow — the card step, MEASURED (real stylesheet)', () => {
  it.each([
    { width: 12.5, at: 'PersonnelCard D20’s FLOOR' },
    { width: 20, at: 'a phone’s doctor card' },
    { width: 23.9, at: 'just under the override’s 24rem edge' },
  ])(
    'is 13.2px on an 18.15px line in a container under 24rem — $at ($width rem)',
    ({ width }) => {
      // Every phone's INSET is under 24rem (PersonnelCard D20). The box
      // first, so a width that failed to apply cannot let the size pass for
      // the wrong reason. The tracking follows the size — 0.1em, 1.32px.
      const card = measuredEyebrow('card', width);
      expect(card.box).toBeCloseTo(width * rootPx(), 1);
      expect(card.fontSize).toBe('13.2px');
      expect(parseFloat(card.lineHeight)).toBeCloseTo(13.2 * 1.375, 2);
      expect(parseFloat(card.letterSpacing)).toBeCloseTo(1.32, 2);
    },
  );

  it.each([
    { width: 24, at: 'the override’s edge — 24rem, no longer under it' },
    { width: 40, at: 'a tablet’s INSET' },
  ])(
    'EQUALS the default — 14px on its own 20px line — at $at ($width rem)',
    ({ width }) => {
      const card = measuredEyebrow('card', width);
      const base = measuredEyebrow('default', width);
      expect(card.box).toBeCloseTo(width * rootPx(), 1);
      expect(base.box).toBe(card.box);
      expect(card.fontSize).toBe('14px');
      expect(card.fontSize).toBe(base.fontSize);
      expect(card.lineHeight).toBe(base.lineHeight);
      expect(card.letterSpacing).toBe(base.letterSpacing);
    },
  );

  it('leaves the default 14px under a 24rem container too — the card step alone moves', () => {
    const base = measuredEyebrow('default', 20);
    expect(base.box).toBeCloseTo(20 * rootPx(), 1);
    expect(base.fontSize).toBe('14px');
  });

  it('IS the default 14px with no container above it — what an engine without container queries draws, too', () => {
    const { unmount } = render(<Eyebrow size="card">{RO_ALL}</Eyebrow>);
    const computed = getComputedStyle(screen.getByRole('paragraph'));
    expect(computed.fontSize).toBe('14px');
    expect(computed.lineHeight).toBe('20px');
    unmount();
  });
});

describe('Eyebrow — uppercase is CSS, never the string', () => {
  it('leaves the source string in the DOM in its authored case', () => {
    // THE invariant of this atom. The message file holds "Ne găsești" in
    // sentence case and `text-transform: uppercase` does the shouting, so:
    //   · translators keep authoring natural Romanian, not SHOUTED strings;
    //   · a locale that must not uppercase drops one class, not a message;
    //   · Ș/Ț casing is the browser's job, not a toUpperCase() call whose
    //     locale rules differ (Turkish dotted-i is the classic burn).
    // A JS .toUpperCase() in the component would make this query fail.
    render(<Eyebrow>{RO_LOCATION}</Eyebrow>);
    const paragraph = screen.getByText(RO_LOCATION);
    expect(paragraph.textContent).toBe(RO_LOCATION);
    expect(tokensOf(paragraph)).toContain('uppercase');
  });
});

describe('Eyebrow — §6.8 native-element fidelity', () => {
  it('merges the parent className LAST, keeping its own classes first', () => {
    // Order is the contract, not an accident: the merge order is pinned as a
    // deterministic convention (not a cascade mechanism — attribute order
    // never decides CSS), and the atom's own classes must survive.
    render(<Eyebrow className="col-span-2">{RO_ALL}</Eyebrow>);
    expect(screen.getByRole('paragraph').className).toBe(
      `${RECIPE} col-span-2`,
    );
  });

  it('accepts ref as a regular prop (React 19)', () => {
    const paragraph = createRef<HTMLParagraphElement>();
    render(<Eyebrow ref={paragraph}>{RO_ALL}</Eyebrow>);
    expect(paragraph.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('spreads remaining native props onto the rendered <p>', () => {
    // aria-live is the real shape the old reviews-carousel hand-rolled: it
    // wants this exact recipe on a polite live region — a standalone <p>,
    // which is why dropping the `as` axis loses nothing there. Native
    // attributes spreading through is what lets that consumer drop the
    // copy-paste when its lane is built.
    render(
      <Eyebrow id="sectiune" lang="ro" aria-live="polite" data-slot="eyebrow">
        {RO_LOCATION}
      </Eyebrow>,
    );
    const paragraph = screen.getByRole('paragraph');
    expect(paragraph).toHaveAttribute('id', 'sectiune');
    expect(paragraph).toHaveAttribute('lang', 'ro');
    expect(paragraph).toHaveAttribute('aria-live', 'polite');
    expect(paragraph).toHaveAttribute('data-slot', 'eyebrow');
  });
});
