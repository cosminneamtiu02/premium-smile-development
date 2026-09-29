import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Card } from '@/components/ui/Card/Card';
import { CategoryCard, type PriceCategoryProps } from './CategoryCard';
import cardSource from './CategoryCard.tsx?raw';

// sections/PriceList/CategoryCard — the in-folder piece's OWN suite (the
// ReviewsDeck precedent). PriceList.test.tsx already exercises it through the
// band; what is pinned HERE is the contract it has as an exported component on
// its own: the surface it wears, the props it passes through, the trio that
// makes it a fragment target, and — since the owner's 2026-09-29 word — the
// one class that keeps the focus ring for a keyboard arrival alone. Styles are
// not loaded in this project (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the contract — computed values would
// read back as browser defaults. What the ring LOOKS like on the built page, a
// pointer's arrival and a keyboard's side by side, is
// tests/e2e/price-current-aura.spec.ts's.

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

/** ui/Card's glow utility and the two tokens of its ARMED form, spelled in the
 *  TEST and never in the component: this band passes the atom's `aura` PROP —
 *  `aura="current"` since 2026-09-29 — so no `shadow-aura` string exists in
 *  its source, which is exactly what tests/unit/aura-token.test.ts's census
 *  expects of a section that asks for the glow this way (its ui/Card note says
 *  so in full); the band still spells no shadow utility of its own. The bare
 *  AURA is the glow WORN on the card's own box; ARMED_GLOW is the same glow
 *  on the card's `::before` layer, and SHOWN_WHILE the one rule that shows
 *  that layer while the card carries the mark. Pinning the tokens here is how
 *  the ARMING stays guarded — and spelling them here rather than importing
 *  them is what makes a silent rename fail. */
const AURA = 'shadow-aura';
const ARMED_GLOW = 'before:shadow-aura';
const SHOWN_WHILE = 'data-current:before:opacity-100';

/** THE RING IS THE KEYBOARD'S (owner 2026-09-29): the one class that hides the
 *  shell's focus outline on a `:focus-visible` card the keyboard did not jump
 *  to. Spelled here, never imported, AURA's reason: a silent rename of the
 *  stamp or of the class must fail in this file. */
const QUIET_RING = 'not-data-[arrival=keyboard]:focus-visible:outline-hidden';

/** The island's stamp on a card the keyboard jumped to — its attribute. */
const ARRIVAL = 'data-arrival';

/** ui/Card's own surface, ARMED with the glow (`aura="current"`), DERIVED from
 *  a rendered card rather than retyped — so an edit to the atom's geometry,
 *  tone rows or glow layer lands in these assertions instead of drifting
 *  silently away from this section. */
const cardSurface = (): string => {
  const { container, unmount } = render(<Card aura="current" />);
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
    // a deterministic convention the tests pin, NOT a cascade mechanism. The
    // element's own are the scroll rider and, since 2026-09-29, the quiet
    // ring (THE RING IS THE KEYBOARD'S).
    expect(card.className).toBe(`${cardSurface()} scroll-mt-10 ${QUIET_RING}`);
  });

  it('is ARMED with the glow and wears none of its own (owner 2026-09-29)', () => {
    // "what category card is not selected gets no aura" — superseding the
    // 2026-09-14 pack round's glow on EVERY card. The card carries the pill's
    // glow on its `::before` layer, shown only while the band's island has
    // marked it, and never on its own box. The section still names no shadow
    // utility — `aura` is ui/Card's prop, chosen per card KIND in the
    // composing section (fb-378/381).
    const { container } = render(<CategoryCard {...CATEGORY} />);
    const tokens = tokensOf(cardOf(container));

    expect(tokens).toContain(ARMED_GLOW);
    expect(tokens).toContain(SHOWN_WHILE);
    expect(tokens).not.toContain(AURA);
  });

  it('is never current on its own — no island, no mark', () => {
    // The mark is the band's island's to stamp (PriceMenu.tsx, THE CARD THE
    // VISITOR IS AT); this file renders none, so a card with no island
    // around it is never current and never glows.
    const { container } = render(<CategoryCard {...CATEGORY} />);

    expect(cardOf(container)).not.toHaveAttribute('data-current');
  });

  it('merges a caller className LAST, after the card, the scroll rider and the quiet ring', () => {
    const { container } = render(
      <CategoryCard {...CATEGORY} className="col-span-2" />,
    );

    expect(cardOf(container).className).toBe(
      `${cardSurface()} scroll-mt-10 ${QUIET_RING} col-span-2`,
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

describe('CategoryCard — the ring is the keyboard’s (owner 2026-09-29)', () => {
  it('hides the ring on every focused card the keyboard did not jump to — the class rides the section, before the caller’s className', () => {
    // "i want that removed" — the dark border a pointer's jump drew. The class
    // hides the shell's outline on a `:focus-visible` card WITHOUT the
    // island's `data-arrival="keyboard"` stamp, so the keyboard keeps its
    // ring (CategoryCard.tsx's THE RING IS THE KEYBOARD'S). It is the card's
    // own class, merged before the caller's placement className (§6.8).
    const { container } = render(
      <CategoryCard {...CATEGORY} className="col-span-2" />,
    );
    const tokens = tokensOf(cardOf(container));

    expect(tokens).toContain(QUIET_RING);
    expect(tokens.indexOf(QUIET_RING)).toBeLessThan(
      tokens.indexOf('col-span-2'),
    );
    // No unconditional outline utility anywhere: the ring is hidden only for
    // a `:focus-visible` card without the stamp, never for every card.
    expect(tokens.filter((t) => /(^|:)outline-/.test(t))).toEqual([QUIET_RING]);
  });

  it('renders no data-arrival of its own — the stamp is the island’s to write', () => {
    // Like the glow's `data-current`, the stamp is a DOM write the band's
    // island makes on this inert server HTML after a keyboard click
    // (PriceMenu.tsx's THE RING IS THE KEYBOARD'S); a card on its own never
    // carries it, so the quiet ring applies to every one of its arrivals.
    const { container } = render(<CategoryCard {...CATEGORY} />);

    expect(cardOf(container)).not.toHaveAttribute(ARRIVAL);
  });

  it('spells the class as a literal in its own source, tied to ./arrival’s constants', () => {
    // Tailwind reads class names from SOURCE TEXT, so the class must appear
    // whole in this file for the rule to be generated at all; the `satisfies`
    // beside it is what keeps the literal and the island's stamp one spelling
    // (ui/Card's idiom for CARD_CURRENT_ATTRIBUTE).
    expect(cardSource).toContain(`'${QUIET_RING}'`);
    expect(cardSource).toContain(
      'satisfies `not-data-[${typeof ARRIVAL_KEY}=${typeof ARRIVAL_BY_KEYBOARD}]:focus-visible:outline-hidden`',
    );
    expect(cardSource).toMatch(/from '\.\/arrival'/);
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
