import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Heading } from './Heading';

// Role-based queries wherever a role exists (§3, §9): the asChild cases are
// queried as heading/link — exactly what a screen reader announces. The
// default host is a <p>, which has no such role, so it is reached through its
// text and the ABSENCE of any heading role is asserted instead (I2: the atom
// never fakes document structure). Fixtures are Romanian with diacritics
// (§15.7) — the real Footer/Header strings this atom will carry.

// I1 · zero-diff-rewire: the title step renders EXACTLY this and nothing else.
// The four rewire call sites (Footer ×3, Header brand) are accepted on zero
// visual diff, so any extra utility — leading-*, tracking-*, text-balance, a
// margin — is a defect, not polish. `cx` is a plain join(' ') (slot.ts:18), so
// byte-equality is deterministic: toBe here, never toContain.
const TITLE_CLASSES = 'font-display text-xl text-ink-strong';

describe('Heading — the title step (I1 zero-diff-rewire, I2 element neutrality)', () => {
  it('renders a plain <p> wearing exactly the title classes and no heading role', () => {
    render(<Heading>Servicii și prețuri</Heading>);
    const title = screen.getByText('Servicii și prețuri');
    expect(title.tagName).toBe('P');
    expect(title.className).toBe(TITLE_CLASSES);
    // A real h1–h6 is always an explicit consumer act via asChild — the atom
    // can never invent an outline slot (the Footer's titles are <p> today).
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders size="title" byte-identically to the bare call (I3 default pinned)', () => {
    // The default stays 'title' FOREVER: additive union growth must never
    // change what a bare <Heading> looks like (§6.6 silent-break guard).
    const { unmount } = render(<Heading>Servicii și prețuri</Heading>);
    const bare = screen.getByText('Servicii și prețuri').className;
    unmount();
    render(<Heading size="title">Servicii și prețuri</Heading>);
    expect(screen.getByText('Servicii și prețuri').className).toBe(bare);
  });
});

describe('Heading — §6 hygiene (I4)', () => {
  it('merges the caller className LAST — parent spacing rides on top', () => {
    // The Footer brand row: `pb-8 text-center` is parent spacing/alignment
    // routed through the atom (§6.4 + §6.8), never the atom's own.
    render(<Heading className="pb-8 text-center">Servicii și prețuri</Heading>);
    expect(screen.getByText('Servicii și prețuri').className).toBe(
      `${TITLE_CLASSES} pb-8 text-center`,
    );
  });

  it('spreads native props onto the element and leaks none of its own', () => {
    render(
      <Heading id="footer-nav-title" data-column="nav">
        Servicii și prețuri
      </Heading>,
    );
    const title = screen.getByText('Servicii și prețuri');
    // `id` is load-bearing, not decoration: the Footer's <nav> names itself
    // through aria-labelledby pointing at this exact title.
    expect(title).toHaveAttribute('id', 'footer-nav-title');
    expect(title).toHaveAttribute('data-column', 'nav');
    expect(title).not.toHaveAttribute('size');
    expect(title).not.toHaveAttribute('aschild');
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Heading ref={ref}>Servicii și prețuri</Heading>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('Heading — asChild (shared ui/slot engine)', () => {
  it('lets an <h2> child BECOME the heading — same look, real outline slot', () => {
    render(
      <Heading asChild id="titlu-echipa">
        <h2 className="child-own">Echipa noastră</h2>
      </Heading>,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Echipa noastră',
    });
    // Own classes first, the child's own preserved after them (slot.ts merge
    // order) — the child keeps everything it declares.
    expect(heading.className).toBe(`${TITLE_CLASSES} child-own`);
    // …and props merge DOWN when the child leaves them undefined: the id a
    // future SectionHeading's aria-labelledby will point at.
    expect(heading).toHaveAttribute('id', 'titlu-echipa');
  });

  it('lets an <a> child BECOME the heading — the Header brand shape', () => {
    // Header.tsx:148 wears these classes ON the anchor today; cloning them
    // onto the child is what makes that rewire byte-identical in the DOM.
    render(
      <Heading asChild>
        <a href="#acasa">Premium Smile</a>
      </Heading>,
    );
    const brand = screen.getByRole('link', { name: 'Premium Smile' });
    expect(brand).toHaveAttribute('href', '#acasa');
    expect(brand.className).toBe(TITLE_CLASSES);
  });

  // HeadingProps types ref for the <p> branch; in asChild mode it reaches the
  // child element instead — the cast below is the test acknowledging that.
  const asParagraphRef = (ref: Ref<HTMLHeadingElement>) =>
    ref as unknown as Ref<HTMLParagraphElement>;

  it("forwards Heading's ref to the child element (React 19 ref-in-props)", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading asChild ref={asParagraphRef(ref)}>
        <h2>Echipa noastră</h2>
      </Heading>,
    );
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("the child's own ref wins over Heading's (children win conflicts)", () => {
    // React 19 exposes ref inside props, so the engine's child-wins merge
    // covers it like any other prop — never disallow it (slot.ts:70-74).
    const childRef = createRef<HTMLHeadingElement>();
    const headingRef = createRef<HTMLHeadingElement>();
    render(
      <Heading asChild ref={asParagraphRef(headingRef)}>
        <h2 ref={childRef}>Echipa noastră</h2>
      </Heading>,
    );
    expect(childRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(headingRef.current).toBeNull();
  });

  it('throws its own actionable, Heading-named message for bad children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Heading asChild>doar text</Heading>)).toThrow(
      /Heading with asChild expects exactly one element child/,
    );
    expect(() =>
      render(
        <Heading asChild>
          <h2>unu</h2>
          <h2>doi</h2>
        </Heading>,
      ),
    ).toThrow(/Heading with asChild expects exactly one element child/);
    silence.mockRestore();
  });
});
