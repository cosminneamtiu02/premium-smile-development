import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Card } from '@/components/ui/Card/Card';
import { CategoryCard, type PriceCategoryProps } from './CategoryCard';

// sections/PriceList/CategoryCard — the in-folder piece's OWN suite (the
// ReviewsDeck precedent). PriceList.test.tsx already exercises it through the
// band; what is pinned HERE is the contract it has as an exported component on
// its own: the surface it wears, the props it passes through, and the trio
// that makes it a fragment target. Styles are not loaded in this project
// (tests/setup/components.ts imports no stylesheet), so the utility TOKENS are
// the contract — computed values would read back as browser defaults.

const CATEGORY = {
  id: 'endodontics',
  name: 'Endodonție',
  eyebrow: 'Tratamente la microscop',
  rows: [
    {
      id: 'one-canal',
      name: 'Tratament endodontic pe un canal',
      price: '450 RON',
    },
    {
      id: 'three-canals',
      name: 'Tratament endodontic pe trei canale',
      price: '750 RON',
    },
  ],
} satisfies PriceCategoryProps;

/** ui/Card's glow utility, spelled in the TEST and never in the component:
 *  this band passes the atom's `aura` PROP, so no `shadow-aura` string exists
 *  in its source — which is exactly what tests/unit/aura-token.test.ts's
 *  census expects of a section that wears the glow this way (its ui/Card note
 *  says so in full). Pinning the token here is how the WEAR stays guarded. */
const AURA = 'shadow-aura';

/** ui/Card's own surface WITH the glow, DERIVED from a rendered card rather
 *  than retyped — so an edit to the atom's geometry, tone rows or aura lookup
 *  lands in these assertions instead of drifting silently away from this
 *  section. */
const cardSurface = (): string => {
  const { container, unmount } = render(<Card aura />);
  const own = (container.firstElementChild as HTMLElement).className;
  unmount();
  return own;
};

const cardOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

describe('CategoryCard — the card IS the section (ui/Card asChild)', () => {
  it('wears the surface on the <section> itself, with no wrapper div', () => {
    const { container } = render(<CategoryCard {...CATEGORY} />);
    const card = cardOf(container);

    expect(card.tagName).toBe('SECTION');
    // ui/slot.ts's order: the atom's classes, then the child element's own —
    // a deterministic convention the tests pin, NOT a cascade mechanism.
    expect(card.className).toBe(`${cardSurface()} scroll-mt-10`);
  });

  it('wears the pill’s lavender glow, through the atom’s own prop', () => {
    // Owner 2026-09-14, the pack round: the aura on every card in this band.
    // The section names no shadow utility — `aura` is ui/Card's prop, chosen
    // per card KIND in the composing section (fb-378/381).
    const { container } = render(<CategoryCard {...CATEGORY} />);

    expect(tokensOf(cardOf(container)).filter((t) => t === AURA)).toEqual([
      AURA,
    ]);
  });

  it('merges a caller className LAST, after the card and the scroll rider', () => {
    const { container } = render(
      <CategoryCard {...CATEGORY} className="col-span-2" />,
    );

    expect(cardOf(container).className).toBe(
      `${cardSurface()} scroll-mt-10 col-span-2`,
    );
  });

  it('owns no outer margin and no width of its own (§6.4, ui/Card D3)', () => {
    const { container } = render(<CategoryCard {...CATEGORY} />);
    const tokens = tokensOf(cardOf(container));

    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^w-/.test(t))).toEqual([]);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const card = createRef<HTMLElement>();
    render(<CategoryCard {...CATEGORY} ref={card} />);

    expect(card.current?.tagName).toBe('SECTION');
    expect(card.current).toHaveAttribute('id', CATEGORY.id);
  });

  it('spreads remaining native props onto the section', () => {
    // `lang` is the shape a mixed-language page would use: both `hyphens: auto`
    // (§15.14) and the `quotes` property read the ELEMENT's language, and both
    // inherit from here.
    const { container } = render(
      <CategoryCard {...CATEGORY} lang="de" data-slot="category-card" />,
    );

    expect(cardOf(container)).toHaveAttribute('lang', 'de');
    expect(cardOf(container)).toHaveAttribute('data-slot', 'category-card');
  });
});

describe('CategoryCard — the fragment target (board §4.2)', () => {
  it('is the id, the name and the focus target in one element', () => {
    render(<CategoryCard {...CATEGORY} />);
    const card = screen.getByRole('region', { name: CATEGORY.name });

    expect(card).toHaveAttribute('id', CATEGORY.id);
    expect(card).toHaveAttribute('aria-labelledby', `${CATEGORY.id}-title`);
    // Focusable by script only: the browser's focusing steps run on a jumped-to
    // target, which is what makes the arrival audible — and -1 keeps the card
    // out of the Tab order while doing it.
    expect(card).toHaveAttribute('tabindex', '-1');
    // 2.5rem over the shell's global `scroll-padding-top: 6rem` — the same
    // 2.5rem the sticky menu adds to that reach, so a jumped-to card and the
    // stuck menu come to rest on ONE line (owner 2026-09-14).
    expect(tokensOf(card)).toContain('scroll-mt-10');
  });

  it('derives the heading id from the category id — no generated pair', () => {
    // A useId() pair would make the fragment unguessable; the whole point of
    // `id` being a prop is that a link elsewhere can point at it (board §4.4).
    render(<CategoryCard {...CATEGORY} />);
    const heading = screen.getByRole('heading', { level: 2 });

    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('id', `${CATEGORY.id}-title`);
    expect(heading).toHaveTextContent(CATEGORY.name);
  });
});

describe('CategoryCard — the head and the rows', () => {
  it('opens with its eyebrow, above the title — every card, always', () => {
    // Owner 2026-09-14: "why in categories is it only in some places heading +
    // eyebrow. i want that in all of them". The eyebrow is a <p> one tier down
    // (ui/Eyebrow) — asserted by TEXT, so a broken diacritic path fails here
    // rather than in front of a patient.
    render(<CategoryCard {...CATEGORY} />);
    const card = screen.getByRole('region', { name: CATEGORY.name });

    const eyebrow = within(card).getByText(CATEGORY.eyebrow);
    expect(eyebrow.tagName).toBe('P');
    expect(
      eyebrow.compareDocumentPosition(
        screen.getByRole('heading', { level: 2 }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // …and it is the card's ONLY paragraph: no second prose row crept in.
    expect(
      Array.from(card.querySelectorAll('p'), (p) => p.textContent),
    ).toEqual([CATEGORY.eyebrow]);
  });

  it('REQUIRES the eyebrow in this band’s own type', () => {
    // The type-level half of the owner's decision, and the one that actually
    // holds the line: a category without an eyebrow must not compile in
    // lib/prices or in the page's populator. `string` — NOT `string |
    // undefined` — IS the required check; an optional prop would widen it.
    // sections/SectionHeading's own `eyebrow` stays optional (a section may
    // open without one); only THIS band's contract tightens.
    expectTypeOf<PriceCategoryProps>().toHaveProperty('eyebrow');
    expectTypeOf<PriceCategoryProps['eyebrow']>().toEqualTypeOf<string>();
  });

  it('pairs each treatment with its price in ONE column (owner 2026-09-14)', () => {
    // "I do not like having 2 columns for prices. always make only one" — so
    // the <dl> carries no class at all (a block stacks) and no row wears
    // `break-inside-avoid`, which only ever existed to survive a column break.
    render(<CategoryCard {...CATEGORY} />);
    const card = screen.getByRole('region', { name: CATEGORY.name });
    const lists = card.querySelectorAll('dl');

    expect(lists).toHaveLength(1);
    expect(lists[0].getAttribute('class')).toBeNull();

    const rows = Array.from(lists[0].children);
    expect(rows).toHaveLength(CATEGORY.rows.length);
    for (const [index, row] of rows.entries()) {
      expect(row.querySelector('dt')?.textContent).toBe(
        CATEGORY.rows[index].name,
      );
      expect(row.querySelector('dd')?.textContent).toBe(
        CATEGORY.rows[index].price,
      );
      expect(tokensOf(row)).not.toContain('break-inside-avoid');
      // The rule rides each PAIR — `divide-y` would skip the last row and
      // leave the list hanging open under its final price.
      expect(tokensOf(row)).toContain('border-b');
    }
  });

  it('prints nothing it was not handed (§17.4)', () => {
    // The sweep: strike every fixture string out of the card's text and what
    // remains must hold no letter and no digit — no unit word bolted on in
    // JSX, no separator, no label.
    render(<CategoryCard {...CATEGORY} />);
    const words = [
      CATEGORY.name,
      CATEGORY.eyebrow,
      ...CATEGORY.rows.flatMap((row) => [row.name, row.price]),
    ];
    const text =
      screen.getByRole('region', { name: CATEGORY.name }).textContent ?? '';

    expect(
      words.reduce((rest, word) => rest.replaceAll(word, ' '), text),
    ).not.toMatch(/[\p{L}\p{N}]/u);
  });
});
