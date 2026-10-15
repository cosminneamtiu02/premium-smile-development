import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChevronLeft } from '@/assets/glyphs/ChevronLeft';
import { ChevronRight } from '@/assets/glyphs/ChevronRight';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Pagination, type PaginationProps } from './Pagination';
import source from './Pagination.tsx?raw';

// sections/Pagination — the interaction suite. Role-based queries on purpose
// (§9, §13): a passing suite doubles as proof of accessible markup. Every
// fixture is Romanian with diacritics (§15.7) and every word is a PROP — the
// band holds no message key — so the sweep in the last block proves it adds
// no word of its own (§17.4).
//
// Styles are NOT loaded in this file (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the layout's contract here, the
// convention every component suite in this repo follows. What only the real
// sheet and the real face can prove — the 44px discs 12px apart, the row's
// width the same on every page, the row drawn in THE BAND SCALE — is computed
// in Pagination.scale.test.tsx, and the row as a page mounts it in
// Pagination.stories.tsx's plays.
//
// NOTHING IS MOCKED: no router, no message provider, no clock. A dumb band
// needs none of them, which is the point of the shape.

/** The landmark's name in the shipped words — ro.json's
 *  `blog.pagination.label` (G2 react, 2026-10-14). */
const LABEL = 'Paginile articolelor';

/** The controls' names in the shipped words — ro.json's
 *  `blog.pagination.previous` / `.next` since the round of 2026-10-14, which
 *  made them names, never shown (Pagination.tsx's GLYPH-ONLY paragraph). */
const PREVIOUS = 'Pagina anterioară';
const NEXT = 'Pagina următoare';

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
  previousLabel: PREVIOUS,
  nextLabel: NEXT,
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

/** An element's class tokens, as a sorted list (order is cx's business). */
const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean).sort();

/** What ui/GlyphButton draws for `variant="outline" tone="accent"` and nothing
 *  else — the props sections/ReviewsCarousel/ReviewsDeck.tsx passes its two
 *  discs: the face this band wears, read off the atom itself. */
const deckFace = (): string[] => {
  const { container, unmount } = render(
    <GlyphButton variant="outline" tone="accent" aria-label="Referință">
      <ChevronLeft />
    </GlyphButton>,
  );
  const button = container.querySelector('button');
  if (!button) throw new Error('the reference disc rendered no <button>');
  const tokens = tokensOf(button);
  unmount();
  return tokens;
};

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
    // `self-end`, the placement sections/PostList passes (Pagination.tsx's
    // THE ROW) — a class the site wears, so naming it here ships no dead rule.
    render(
      <Pagination
        {...page(2)}
        id="paginare"
        data-slot="x"
        className="self-end"
      />,
    );

    expect(nav()).toHaveAttribute('id', 'paginare');
    expect(nav()).toHaveAttribute('data-slot', 'x');
    expect(nav().className.split(/\s+/).at(-1)).toBe('self-end');
  });
});

describe('Pagination — the links (§15.13)', () => {
  it('links both neighbours on a middle page: plain <a href> with rel prev and next, named by the labels', () => {
    render(<Pagination {...page(2)} />);

    const previous = within(nav()).getByRole('link', { name: PREVIOUS });
    const next = within(nav()).getByRole('link', { name: NEXT });
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
    expect(within(nav()).getByRole('link', { name: PREVIOUS })).toHaveFocus();
    await user.tab();
    expect(within(nav()).getByRole('link', { name: NEXT })).toHaveFocus();
  });
});

describe('Pagination — the ends are disabled buttons, never links', () => {
  it('on the first page, the back control is a disabled <button> and the keyboard skips it', async () => {
    const user = userEvent.setup();
    render(<Pagination {...page(1)} />);

    const previous = within(nav()).getByRole('button', { name: PREVIOUS });
    expect(previous).toBeDisabled();
    expect(previous).toHaveAttribute('type', 'button');
    expect(within(nav()).queryByRole('link', { name: PREVIOUS })).toBeNull();
    expect(within(nav()).getByRole('link', { name: NEXT })).toHaveAttribute(
      'href',
      '/ro/blog/page/2/',
    );

    // The first Tab passes the disabled control by and lands on forward.
    await user.tab();
    expect(within(nav()).getByRole('link', { name: NEXT })).toHaveFocus();
  });

  it('on the last page, the forward control is a disabled <button> and the keyboard skips it', async () => {
    const user = userEvent.setup();
    render(<Pagination {...page(3)} />);

    const next = within(nav()).getByRole('button', { name: NEXT });
    expect(next).toBeDisabled();
    expect(next).toHaveAttribute('type', 'button');
    expect(within(nav()).queryByRole('link', { name: NEXT })).toBeNull();
    expect(within(nav()).getByRole('link', { name: PREVIOUS })).toHaveAttribute(
      'href',
      '/ro/blog/page/2/',
    );

    // Back is the one stop: the next Tab leaves the navigation.
    await user.tab();
    expect(within(nav()).getByRole('link', { name: PREVIOUS })).toHaveFocus();
    await user.tab();
    expect(nav()).not.toContainElement(
      document.activeElement as HTMLElement | null,
    );
  });

  it('on a list of two, page 1 and page 2 each disable their own end', () => {
    const { unmount } = render(<Pagination {...page(1, 2)} />);
    expect(
      within(nav()).getByRole('button', { name: PREVIOUS }),
    ).toBeDisabled();
    expect(within(nav()).getByRole('link', { name: NEXT })).toBeInTheDocument();
    unmount();

    render(<Pagination {...page(2, 2)} />);
    expect(
      within(nav()).getByRole('link', { name: PREVIOUS }),
    ).toBeInTheDocument();
    expect(within(nav()).getByRole('button', { name: NEXT })).toBeDisabled();
  });
});

describe('Pagination — the face: the reviews deck’s discs', () => {
  it('dresses a link and a disabled button alike in ui/GlyphButton’s outline lavender disc — the deck’s, with no jump', () => {
    // Page 1: one end of each kind.
    render(<Pagination {...page(1)} />);
    const face = deckFace();

    const controls = [
      within(nav()).getByRole('button', { name: PREVIOUS }),
      within(nav()).getByRole('link', { name: NEXT }),
    ];
    for (const control of controls) {
      // EXACTLY the atom's own face: a change of variant, tone, size, shape or
      // motion here — or a class added beside it — turns this red.
      expect(tokensOf(control)).toEqual(face);
      // …which is, for the reader: the outline circle in the lavender family.
      expect(control).toHaveClass(
        'rounded-full',
        'border',
        'border-accent',
        'bg-surface',
        'text-accent',
      );
      // No green token, and nothing that grows on hover (jump-census).
      expect(
        tokensOf(control).filter((token) => token.includes('cta')),
      ).toEqual([]);
      expect(
        tokensOf(control).filter((token) => token.includes('scale')),
      ).toEqual([]);
      expect(control).not.toHaveAttribute('tone');
      expect(control).not.toHaveAttribute('variant');
    }
  });

  it('holds its chevron and nothing else — the label is the NAME, never shown', () => {
    render(<Pagination {...page(2)} />);

    const glyph = (chevron: ReactElement): string =>
      renderToStaticMarkup(chevron);
    const previous = within(nav()).getByRole('link', { name: PREVIOUS });
    const next = within(nav()).getByRole('link', { name: NEXT });

    // The atom's glyph, exactly — Lucide's chevron, decorative by default.
    expect(previous.innerHTML).toBe(glyph(<ChevronLeft />));
    expect(next.innerHTML).toBe(glyph(<ChevronRight />));
    expect(previous.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(next.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // No text in the control: the words live in its accessible name alone.
    expect(previous.textContent).toBe('');
    expect(next.textContent).toBe('');
    expect(previous).toHaveAttribute('aria-label', PREVIOUS);
    expect(next).toHaveAttribute('aria-label', NEXT);
  });

  it('keeps the disabled end’s chevron and name too', () => {
    render(<Pagination {...page(3)} />);

    const next = within(nav()).getByRole('button', { name: NEXT });
    expect(next.innerHTML).toBe(renderToStaticMarkup(<ChevronRight />));
    expect(next.textContent).toBe('');
  });
});

describe('Pagination — the counter speaks a sentence', () => {
  it('shows „2 / 3" to the eye alone and gives the ear the page’s sentence', () => {
    render(<Pagination {...page(2)} />);

    const fraction = within(nav()).getByText('2 / 3');
    const eye = fraction.parentElement;
    expect(eye).toHaveAttribute('aria-hidden', 'true');
    const sentence = within(nav()).getByText('Pagina 2 din 3');
    expect(sentence).toHaveClass('sr-only');
    expect(sentence).not.toHaveAttribute('aria-hidden');
    expect(sentence.closest('[aria-hidden]')).toBeNull();
    // Twins in one paragraph.
    expect(eye?.parentElement).toBe(sentence.parentElement);
    expect(sentence.parentElement?.tagName).toBe('P');
  });

  it('keeps the reading order back → counter → forward in the DOM', () => {
    const { unmount } = render(<Pagination {...page(2)} />);
    expect([...nav().children].map((cell) => cell.tagName)).toEqual([
      'A',
      'P',
      'A',
    ]);
    expect(nav().children[0]).toHaveAccessibleName(PREVIOUS);
    expect(nav().children[2]).toHaveAccessibleName(NEXT);
    unmount();

    // …and the ends keep their places when one is a disabled button.
    render(<Pagination {...page(1)} />);
    expect([...nav().children].map((cell) => cell.tagName)).toEqual([
      'BUTTON',
      'P',
      'A',
    ]);
  });

  it('holds the widest fraction’s place with an invisible twin inside the hidden span', () => {
    // Pagination.tsx's THE ARROWS NEVER MOVE BETWEEN PAGES: on page 2 of 12
    // the twin is „12 / 12", sharing the fraction's cell.
    render(<Pagination {...page(2, 12)} />);

    const fraction = within(nav()).getByText('2 / 12');
    const eye = fraction.parentElement;
    if (!eye) throw new Error('the fraction has no parent');
    expect(eye).toHaveAttribute('aria-hidden', 'true');
    expect([...eye.children]).toHaveLength(2);
    const twin = eye.children[1];
    expect(twin).toBe(within(nav()).getByText('12 / 12'));
    expect(tokensOf(twin as Element)).toEqual(['invisible']);
    // One cell for both, the fraction centred in it.
    expect(eye).toHaveClass(
      'grid',
      'justify-items-center',
      '*:col-start-1',
      '*:row-start-1',
    );
    // Figures of one width, and never a break inside the fraction.
    expect(eye.parentElement).toHaveClass('whitespace-nowrap', 'tabular-nums');
  });

  it('prints a two-digit counter as it is', () => {
    render(<Pagination {...page(10, 12)} />);

    expect(within(nav()).getByText('10 / 12').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(within(nav()).getByText('Pagina 10 din 12')).toHaveClass('sr-only');
  });
});

describe('Pagination — the row contract (tokens)', () => {
  it('is ONE flex line hugging its content, 12px between the cells, the discs sized in spacing steps', () => {
    render(<Pagination {...page(2)} />);

    expect(nav()).toHaveClass(
      'flex',
      'w-fit',
      'items-center',
      'gap-3',
      // sections/ClinicLocation's DISC_SIZE, byte for byte (THE BAND SCALE).
      '[--disc-size:calc(var(--spacing)*11)]',
    );
  });

  it('carries no container query and no step anywhere — the two-row shape is gone', () => {
    render(<Pagination {...page(2)} />);

    for (const element of [nav(), ...nav().querySelectorAll('*')]) {
      for (const token of element.getAttribute('class')?.split(/\s+/) ?? []) {
        expect(token, `${element.tagName}: ${token}`).not.toMatch(/^@/);
        expect(token, `${element.tagName}: ${token}`).not.toBe('w-full');
      }
    }
  });
});

describe('Pagination — one page', () => {
  it('renders nothing at all: no landmark, no element', () => {
    const { container } = render(<Pagination {...page(1, 1)} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation')).toBeNull();
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

    // The visible fraction, its invisible twin, the sentence — and no other
    // text: the two labels reach the page as names alone.
    expect(nav().textContent).toBe(`2 / 33 / 3${props.status}`);
    expect(
      within(nav()).getByRole('link', { name: props.previousLabel }),
    ).toBeInTheDocument();
    expect(
      within(nav()).getByRole('link', { name: props.nextLabel }),
    ).toBeInTheDocument();
  });
});
