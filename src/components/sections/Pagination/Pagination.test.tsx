import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Pagination, type PaginationProps } from './Pagination';
import source from './Pagination.tsx?raw';

// sections/Pagination — the interaction suite. Role-based queries on purpose
// (§9, §13): a passing suite doubles as proof of accessible markup. Every
// fixture is Romanian with diacritics (§15.7) and every visible word is a
// PROP — the band holds no message key — so the sweep in the last block
// proves it adds no word of its own (§17.4).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the layout's contract here, the
// convention every component suite in this repo follows. What only real CSS
// can prove — that the row holds at 320px, one row from the nav's 20rem and
// two below it, the counter on the centre line, the disabled face greyed —
// is measured in Pagination.stories.tsx's plays, where globals.css is loaded.
//
// NOTHING IS MOCKED: no router, no message provider, no clock. A dumb band
// needs none of them, which is the point of the shape.

/** The landmark's name in the shipped words — ro.json's
 *  `blog.pagination.label` (G2 react, 2026-10-14). */
const LABEL = 'Paginile articolelor';

/** The page's own addresses (the planner's routes): page 1 at the blog's
 *  root, page n under /page/n/. */
const hrefOf = (page: number): string =>
  page === 1 ? '/ro/blog/' : `/ro/blog/page/${page}/`;

/** A CONSISTENT page — the shape the page builds: a back href from page 2,
 *  a forward href before the last page, each absent otherwise. */
const page = (current: number, total = 3): PaginationProps => ({
  label: LABEL,
  current,
  total,
  status: `Pagina ${current} din ${total}`,
  previousLabel: 'Anterior',
  nextLabel: 'Următor',
  ...(current > 1 ? { previousHref: hrefOf(current - 1) } : {}),
  ...(current < total ? { nextHref: hrefOf(current + 1) } : {}),
});

/** `props` without one of its two hrefs — the belt's "missing" cases. */
const without = (
  props: PaginationProps,
  key: 'previousHref' | 'nextHref',
): PaginationProps => {
  const kept = { ...props };
  delete kept[key];
  return kept;
};

const nav = (): HTMLElement => screen.getByRole('navigation', { name: LABEL });

describe('Pagination — the landmark', () => {
  it('is a navigation landmark named by `label`', () => {
    render(<Pagination {...page(2)} />);

    expect(nav()).toBeInTheDocument();
    expect(nav().tagName).toBe('NAV');
  });

  it('keeps its own name when a caller smuggles a naming attribute past the type', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so both of these compile although the props Omit them; the
    // band's name rides after the spread and wins (sections/TeamRoster's
    // precedent).
    render(
      <>
        <h2 id="altceva">Altceva</h2>
        <Pagination
          {...page(2)}
          aria-label="Altceva"
          aria-labelledby="altceva"
        />
      </>,
    );

    expect(nav()).toHaveAttribute('aria-label', LABEL);
    expect(nav()).not.toHaveAttribute('aria-labelledby');
  });

  it('passes native props through and merges className last, for placement', () => {
    // `mt-8`, a class the site already ships: Tailwind turns every class-like
    // word in a scanned file into a rule, tests included, so a class spelled
    // only here would ship as dead CSS.
    render(
      <Pagination {...page(2)} id="paginare" data-slot="x" className="mt-8" />,
    );

    expect(nav()).toHaveAttribute('id', 'paginare');
    expect(nav()).toHaveAttribute('data-slot', 'x');
    expect(nav().className.split(/\s+/).at(-1)).toBe('mt-8');
  });
});

describe('Pagination — the links (§15.13)', () => {
  it('links both neighbours on a middle page: plain <a href> with rel prev and next', () => {
    render(<Pagination {...page(2)} />);

    const previous = within(nav()).getByRole('link', { name: 'Anterior' });
    const next = within(nav()).getByRole('link', { name: 'Următor' });
    expect(previous).toHaveAttribute('href', '/ro/blog/');
    expect(previous).toHaveAttribute('rel', 'prev');
    expect(next).toHaveAttribute('href', '/ro/blog/page/3/');
    expect(next).toHaveAttribute('rel', 'next');
    // Two links and nothing else to press.
    expect(within(nav()).getAllByRole('link')).toHaveLength(2);
    expect(within(nav()).queryByRole('button')).toBeNull();
  });

  it('reaches both by Tab, back before forward', async () => {
    const user = userEvent.setup();
    render(<Pagination {...page(2)} />);

    await user.tab();
    expect(within(nav()).getByRole('link', { name: 'Anterior' })).toHaveFocus();
    await user.tab();
    expect(within(nav()).getByRole('link', { name: 'Următor' })).toHaveFocus();
  });
});

describe('Pagination — the ends are disabled buttons, never links', () => {
  it('on the first page, the back control is a disabled <button> and the keyboard skips it', async () => {
    const user = userEvent.setup();
    render(<Pagination {...page(1)} />);

    const previous = within(nav()).getByRole('button', { name: 'Anterior' });
    expect(previous).toBeDisabled();
    expect(previous).toHaveAttribute('type', 'button');
    expect(within(nav()).queryByRole('link', { name: 'Anterior' })).toBeNull();
    expect(
      within(nav()).getByRole('link', { name: 'Următor' }),
    ).toHaveAttribute('href', '/ro/blog/page/2/');

    await user.tab();
    expect(within(nav()).getByRole('link', { name: 'Următor' })).toHaveFocus();
  });

  it('on the last page, the forward control is a disabled <button>', () => {
    render(<Pagination {...page(3)} />);

    const next = within(nav()).getByRole('button', { name: 'Următor' });
    expect(next).toBeDisabled();
    expect(next).toHaveAttribute('type', 'button');
    expect(within(nav()).queryByRole('link', { name: 'Următor' })).toBeNull();
    expect(
      within(nav()).getByRole('link', { name: 'Anterior' }),
    ).toHaveAttribute('href', '/ro/blog/page/2/');
  });

  it('on a page of two, page 1 and page 2 each disable their own end', () => {
    const { unmount } = render(<Pagination {...page(1, 2)} />);
    expect(
      within(nav()).getByRole('button', { name: 'Anterior' }),
    ).toBeDisabled();
    expect(
      within(nav()).getByRole('link', { name: 'Următor' }),
    ).toBeInTheDocument();
    unmount();

    render(<Pagination {...page(2, 2)} />);
    expect(
      within(nav()).getByRole('link', { name: 'Anterior' }),
    ).toBeInTheDocument();
    expect(
      within(nav()).getByRole('button', { name: 'Următor' }),
    ).toBeDisabled();
  });
});

describe('Pagination — the counter speaks a sentence', () => {
  it('shows „2 / 3" to the eye alone and gives the ear the page’s sentence', () => {
    render(<Pagination {...page(2)} />);

    const fraction = within(nav()).getByText('2 / 3');
    expect(fraction).toHaveAttribute('aria-hidden', 'true');
    const sentence = within(nav()).getByText('Pagina 2 din 3');
    expect(sentence).toHaveClass('sr-only');
    expect(sentence).not.toHaveAttribute('aria-hidden');
    // Twins in one paragraph, the paragraph centred on the element (§15.15 b).
    expect(fraction.parentElement).toBe(sentence.parentElement);
    expect(fraction.parentElement?.tagName).toBe('P');
    expect(fraction.parentElement).toHaveClass('text-center');
  });

  it('keeps the reading order back → counter → forward in the DOM', () => {
    render(<Pagination {...page(2)} />);

    const cells = [...(nav().firstElementChild?.children ?? [])];
    expect(cells.map((cell) => cell.tagName)).toEqual(['A', 'P', 'A']);
    expect(cells[0]).toHaveAccessibleName('Anterior');
    expect(cells[2]).toHaveAccessibleName('Următor');
  });

  it('prints a two-digit counter as it is', () => {
    render(<Pagination {...page(10, 12)} />);

    expect(within(nav()).getByText('10 / 12')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(within(nav()).getByText('Pagina 10 din 12')).toHaveClass('sr-only');
  });
});

describe('Pagination — one page', () => {
  it('renders nothing at all: no landmark, no element', () => {
    const { container } = render(<Pagination {...page(1, 1)} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('Pagination — the face and the layout contract (tokens)', () => {
  it('dresses both kinds of control in ui/Button’s lavender solid md face, with no jump', () => {
    render(<Pagination {...page(1)} />);

    const controls = [
      within(nav()).getByRole('button', { name: 'Anterior' }),
      within(nav()).getByRole('link', { name: 'Următor' }),
    ];
    for (const control of controls) {
      const tokens = control.className.split(/\s+/);
      // The lavender solid family (§15.30) at the md box (min-h-11 = 44px,
      // the §9 target).
      expect(tokens).toEqual(
        expect.arrayContaining([
          'bg-accent',
          'text-ink-inverse',
          'hover:bg-surface',
          'hover:text-accent',
          'min-h-11',
        ]),
      );
      // No green token, and nothing that moves on hover (jump-census).
      expect(tokens.filter((token) => token.includes('cta'))).toEqual([]);
      expect(tokens.filter((token) => token.includes('scale'))).toEqual([]);
      expect(control).not.toHaveAttribute('tone');
    }
  });

  it('lays out a row that measures the nav: two lines under its 20rem, three tracks from it', () => {
    render(<Pagination {...page(2)} />);

    // The nav is the size container the row reads.
    expect(nav()).toHaveClass('@container', 'w-full');
    const row = nav().firstElementChild;
    expect(row).toHaveClass(
      'flex',
      'flex-wrap',
      'items-center',
      'gap-4',
      '@xs:grid',
      '@xs:grid-cols-[1fr_auto_1fr]',
    );
    // Each control shares its line at its narrowest and is never wider than
    // its label; the forward one is pushed to the end.
    expect(within(nav()).getByRole('link', { name: 'Anterior' })).toHaveClass(
      'flex-1',
      'max-w-max',
    );
    expect(within(nav()).getByRole('link', { name: 'Următor' })).toHaveClass(
      'ms-auto',
      'flex-1',
      'max-w-max',
    );
    // The counter a line of its own under the step, the middle track from it.
    expect(within(nav()).getByText('2 / 3').parentElement).toHaveClass(
      'order-last',
      'basis-full',
      '@xs:order-none',
    );
  });
});

describe('Pagination — the belt', () => {
  // [what is wrong, the props, the refusal's exact words]
  const REFUSALS: ReadonlyArray<readonly [string, PaginationProps, string]> = [
    [
      'a total of 0',
      { ...page(1), total: 0 },
      'Pagination: total must be an integer ≥ 1, got 0',
    ],
    [
      'a fractional total',
      { ...page(2), total: 2.5 },
      'Pagination: total must be an integer ≥ 1, got 2.5',
    ],
    [
      'an infinite total',
      { ...page(2), total: Number.POSITIVE_INFINITY },
      'Pagination: total must be an integer ≥ 1, got Infinity',
    ],
    [
      'a current of 0',
      { ...page(1), current: 0 },
      'Pagination: current must be an integer ≥ 1, got 0',
    ],
    [
      'a negative current',
      { ...page(1), current: -1 },
      'Pagination: current must be an integer ≥ 1, got -1',
    ],
    [
      'a current of -0, spelled as such',
      { ...page(1), current: -0 },
      'Pagination: current must be an integer ≥ 1, got -0',
    ],
    [
      'a fractional current',
      { ...page(2), current: 1.5 },
      'Pagination: current must be an integer ≥ 1, got 1.5',
    ],
    [
      'NaN for current',
      { ...page(2), current: Number.NaN },
      'Pagination: current must be an integer ≥ 1, got NaN',
    ],
    [
      'a page past the last',
      { ...page(3), current: 4 },
      'Pagination: current must not pass total, got page 4 of 3',
    ],
    [
      'a back link on page 1',
      { ...page(1), previousHref: '/ro/blog/' },
      'Pagination: page 1 has no previous page, got previousHref "/ro/blog/"',
    ],
    [
      'no back link after page 1',
      without(page(2), 'previousHref'),
      'Pagination: page 2 of 3 needs a previousHref',
    ],
    [
      'a forward link on the last page',
      { ...page(3), nextHref: '/ro/blog/page/4/' },
      'Pagination: page 3 of 3 is the last, got nextHref "/ro/blog/page/4/"',
    ],
    [
      'a forward link on the one page there is',
      { ...page(1, 1), nextHref: '/ro/blog/page/2/' },
      'Pagination: page 1 of 1 is the last, got nextHref "/ro/blog/page/2/"',
    ],
    [
      'no forward link before the last page',
      without(page(2), 'nextHref'),
      'Pagination: page 2 of 3 needs a nextHref',
    ],
    [
      'an empty back link',
      { ...page(2), previousHref: '' },
      'Pagination: an empty href on page 2 of 3 would reload the page it is on',
    ],
    [
      'an empty forward link',
      { ...page(2), nextHref: '' },
      'Pagination: an empty href on page 2 of 3 would reload the page it is on',
    ],
  ];

  it.each(REFUSALS)(
    'refuses %s with a named RangeError, on the static render `next build` runs',
    (_wrong, props, words) => {
      const build = () => renderToStaticMarkup(<Pagination {...props} />);

      expect(build).toThrow(RangeError);
      expect(build).toThrow(words);
    },
  );

  it('accepts every consistent page of one, two and twelve', () => {
    for (const [current, total] of [
      [1, 1],
      [1, 2],
      [2, 2],
      [1, 12],
      [7, 12],
      [12, 12],
    ] as const) {
      expect(() =>
        renderToStaticMarkup(<Pagination {...page(current, total)} />),
      ).not.toThrow();
    }
  });
});

describe('Pagination — a dumb Server Component', () => {
  it('carries no directive and reads no words of its own (§16, §8.1)', () => {
    // No runtime assertion can see a directive, so the source text is read
    // (the PriceList precedent).
    expect(source).not.toMatch(/^\s*['"]use client['"]/m);
    expect(source).not.toMatch(/from ['"]next-intl/);
    expect(source).not.toMatch(/\buse(Translations|Locale)\(/);
  });

  it('prints only the words it is handed — and the fraction it makes from two numbers (§17.4)', () => {
    const props = page(2);
    render(<Pagination {...props} />);

    expect(nav().textContent).toBe(
      `${props.previousLabel}2 / 3${props.status}${props.nextLabel}`,
    );
  });
});
