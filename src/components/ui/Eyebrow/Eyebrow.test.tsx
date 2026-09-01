import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Eyebrow, type EyebrowProps } from './Eyebrow';

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

// The one recipe, in canonical order. Written out rather than imported so the
// test fails on a silent edit to the component's constant.
const RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

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
    // then the API surface stays exactly one prop wide (children).
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

describe('Eyebrow — ONE step, no axes (v1)', () => {
  it('emits exactly the recipe and nothing else', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
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

  it('carries no responsive self-scaling (§6.5 — an atom cannot see its container)', () => {
    render(<Eyebrow>{RO_ALL}</Eyebrow>);
    const tokens = tokensOf(screen.getByRole('paragraph'));
    expect(
      tokens.filter((t) => /^(sm|md|lg|xl|2xl|@[a-z0-9]+):/.test(t)),
    ).toEqual([]);
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
