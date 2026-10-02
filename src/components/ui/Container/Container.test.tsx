import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from './Container';
import source from './Container.tsx?raw';
// The project loads no stylesheet (tests/setup/components.ts); THE BAND SCALE
// block below measures COMPUTED lengths, so this file loads the site's sheet
// — the DoctorShowcase.test.tsx precedent. Every other assertion here reads
// class names and holds with the sheet or without it.
import '@/styles/globals.css';

// A <div> has no role, and that is the contract (this atom measures a column,
// it does not add semantics — landmarks stay the band's own markup), so the
// queries below find the box through its CHILDREN instead: getByText matches
// the element whose own text nodes carry the string, which for `<Container>
// {copy}</Container>` is the div itself.
// Fixtures are Romanian WITH diacritics (§15.7). RO_ALL carries all seven
// Romanian marks — Ș ș Ț ț ă â î — so a broken encoding path (font subsetting,
// JSX escaping, the message pipeline downstream) fails here rather than in
// front of a patient. RO_COPY is the parked dossier's own fixture, i.e. the
// string the story photographs.
const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';
const RO_COPY = 'Stomatologie modernă. Îngrijire onestă.';

// THE definition, in canonical order. Written out rather than imported from
// the component, so a silent edit to the constant fails HERE instead of
// quietly re-defining what the test compares against (the ui/Eyebrow RECIPE
// precedent). Every page band and both shipped sections share these bytes.
const GUTTER = '@container mx-[clamp(1rem,10vw,12.5rem)]';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

describe('Container — element & children', () => {
  it('renders a <div>, children intact including Ș ș Ț ț ă â î', () => {
    render(<Container>{RO_ALL}</Container>);
    // Query the diacritics themselves: a laxer query would miss the node if
    // any layer normalised or mangled them.
    const box = screen.getByText(RO_ALL);
    expect(box.tagName).toBe('DIV');
  });

  it('adds no semantics of its own — no role, no landmark', () => {
    // The two-box split IS the pattern (the band recipe in Container.tsx):
    // the semantic full-bleed <section>/<footer> is the caller's, this box
    // only owns width and measurement. Footer.test.tsx pins the same split
    // from the other side (`not.toContain('@container')` on the footer root).
    render(<Container>{RO_COPY}</Container>);
    const box = screen.getByText(RO_COPY);
    expect(box).not.toHaveAttribute('role');
    expect(box).not.toHaveAttribute('aria-label');
  });
});

describe('Container — THE gutter definition', () => {
  it('exports the gutter pair byte-for-byte', () => {
    // The number every band shares. Changing it changes the Header pill, the
    // Footer band and every future page band at once — which is exactly why
    // it is one constant and this assertion is a literal.
    expect(containerClasses).toBe(GUTTER);
  });

  it('emits exactly the definition and nothing else', () => {
    render(<Container>{RO_ALL}</Container>);
    expect(screen.getByText(RO_ALL).className).toBe(GUTTER);
  });

  it('bundles the @container mark WITH the gutter (the silent-failure guard)', () => {
    // Splitting the pair has no error mode: a band that took the gutter but
    // forgot the mark would leave its `@3xl:`/`@5xl:` variants with no
    // queryable ancestor — post-shell-mount nothing above renders a container
    // context — and container-gated styles would simply never match, i.e. the
    // single-column mobile layout at every width, silently. The pairing
    // deletes that failure class by construction.
    render(<Container>{RO_ALL}</Container>);
    const tokens = tokensOf(screen.getByText(RO_ALL));
    expect(tokens).toContain('@container');
    expect(tokens).toContain('mx-[clamp(1rem,10vw,12.5rem)]');
  });

  it('owns no vertical padding, no background, no width preset', () => {
    // Each absence is a recorded decision, not an oversight: `py` is the
    // band's own rhythm handed through className (Footer's `py-10`), paint
    // belongs to the full-bleed outer, and the clamp IS the width policy
    // (fb-171, "no second width system" — the parked dossier's max-w draft is
    // superseded, with a named re-open trigger in Container.tsx).
    render(<Container>{RO_COPY}</Container>);
    const tokens = tokensOf(screen.getByText(RO_COPY));
    expect(tokens.filter((t) => /^p[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^bg-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^max-w-/.test(t))).toEqual([]);
  });

  it('carries no viewport variant — bands measure the BOX (§6.5)', () => {
    // A media query on the atom would react to the window instead of the
    // column it hands its consumer. The `@`-variants are the sanctioned
    // family here and none of them is on this root either.
    render(<Container>{RO_COPY}</Container>);
    const tokens = tokensOf(screen.getByText(RO_COPY));
    expect(tokens.filter((t) => /^(sm|md|lg|xl|2xl):/.test(t))).toEqual([]);
  });
});

// THE BAND SCALE (2026-10-02, CLAUDE.md §15.32) — the two strings every band
// of Home and Team wears on its rhythm box, written out for the GUTTER's
// reason above. tests/unit/design-scale.test.ts holds their parts (one
// spelling, the gate, the cap, the step, the zoom's one setter); this suite
// holds the bytes and what the engine draws with them.
const BAND_SCALE =
  'scalable:@4xl:@min-[896px]:[--scale-px:calc(min(100cqw,96rem)/1106*var(--band-zoom,1))] scalable:@4xl:@min-[896px]:design-scale';
const BAND_COLUMN = 'mx-auto w-full scalable:max-w-[96rem]';

describe('Container — THE BAND SCALE (§15.32)', () => {
  it('exports both band-scale strings byte-for-byte', () => {
    expect(bandScaleClasses).toBe(BAND_SCALE);
    expect(bandColumnClasses).toBe(BAND_COLUMN);
  });

  it('never wears them itself — the box stays the gutter alone; a band’s rhythm box wears them (recipe rule 5)', () => {
    render(<Container>{RO_COPY}</Container>);
    expect(screen.getByText(RO_COPY).className).toBe(GUTTER);
  });

  it('draws a band in its design pixel on a laptop column, stops at the 96rem cap, and leaves a column under the step in rem', () => {
    // The gate's pointer half: the test browser is a desktop Chromium.
    expect(matchMedia('(pointer: fine)').matches).toBe(true);
    // Each case forces the COLUMN through the box's own width (inline style
    // beats the gutter's margin), so the numbers do not depend on the window:
    // the design pixel reads `100cqw` against THIS box.
    const cases = [
      // The reference column — the owner's 1401 window: a design pixel IS a
      // CSS pixel, the band its own unscaled self.
      { column: 1106, title: 36, band: 1106 },
      { column: 1300, title: (36 * 1300) / 1106, band: 1300 },
      // Past the cap (96rem = 1536px at the default root): the band stops
      // growing at 1536 and centres in its column.
      { column: 1800, title: (36 * 1536) / 1106, band: 1536 },
      // Under the step (max(56rem, 896px)): no design pixel, rem as ever.
      { column: 880, title: 36, band: 880 },
    ];
    for (const { column, title, band } of cases) {
      const { unmount } = render(
        <Container style={{ marginInline: 0, width: `${column}px` }}>
          <div
            data-testid="band"
            className={`${bandColumnClasses} ${bandScaleClasses}`}
          >
            <p data-testid="title" className="text-4xl">
              {RO_COPY}
            </p>
          </div>
        </Container>,
      );
      const box = screen.getByTestId('band').getBoundingClientRect();
      const host = screen
        .getByTestId('band')
        .parentElement?.getBoundingClientRect();
      expect(
        parseFloat(getComputedStyle(screen.getByTestId('title')).fontSize),
        `the title at a ${column}px column`,
      ).toBeCloseTo(title, 2);
      expect(box.width, `the band at a ${column}px column`).toBeCloseTo(
        band,
        2,
      );
      // Centred in whatever the cap leaves over.
      expect(box.left - (host?.left ?? 0)).toBeCloseTo((column - band) / 2, 2);
      unmount();
    }
  });

  it('lets a box inside draw at a fixed multiple of the band’s pixel — THE ZOOM, worn by DoctorStats’ tiles at 9/8', () => {
    render(
      <Container style={{ marginInline: 0, width: '1300px' }}>
        <div className={`${bandColumnClasses} ${bandScaleClasses}`}>
          <p data-testid="band-text" className="text-base">
            {RO_COPY}
          </p>
          <div className={`${bandScaleClasses} [--band-zoom:1.125]`}>
            <p data-testid="zoomed-text" className="text-base">
              {RO_COPY}
            </p>
          </div>
        </div>
      </Container>,
    );
    const size = (id: string): number =>
      parseFloat(getComputedStyle(screen.getByTestId(id)).fontSize);
    const s = 1300 / 1106;
    expect(size('band-text')).toBeCloseTo(16 * s, 2);
    // 16 × 9/8 = 18 design pixels — the doctor card's quote size.
    expect(size('zoomed-text')).toBeCloseTo(18 * s, 2);
  });
});

describe('Container — §6.8 native-element fidelity', () => {
  it('merges the caller className LAST — the Footer byte-identity in miniature', () => {
    // THIS is the assertion the retrofit rests on: the Footer's gutter box
    // used to spell `@container mx-[clamp(1rem,10vw,12.5rem)] py-10` inline,
    // and `<Container className="py-10">` reproduces that attribute
    // byte-for-byte because the atom's own classes come first and the
    // caller's are appended. Order is a deterministic convention, NOT a
    // cascade mechanism: attribute order never decides CSS specificity, and
    // §6.8 limits caller utilities to positioning/spacing.
    render(<Container className="py-10">{RO_ALL}</Container>);
    expect(screen.getByText(RO_ALL).className).toBe(`${GUTTER} py-10`);
  });

  it('accepts ref as a regular prop (React 19)', () => {
    const box = createRef<HTMLDivElement>();
    render(<Container ref={box}>{RO_ALL}</Container>);
    expect(box.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads remaining native props onto the rendered <div>', () => {
    render(
      <Container id="banda" lang="ro" aria-hidden="false" data-band="hero">
        {RO_COPY}
      </Container>,
    );
    const box = screen.getByText(RO_COPY);
    expect(box).toHaveAttribute('id', 'banda');
    expect(box).toHaveAttribute('lang', 'ro');
    expect(box).toHaveAttribute('aria-hidden', 'false');
    expect(box).toHaveAttribute('data-band', 'hero');
  });
});

describe('Container — the rejected axes, pinned at the type level', () => {
  // The board (container-gutter.plan.md, Q2) rejected three axes, each with a
  // named re-open trigger. These lines stop compiling the moment one is added
  // without that board note — the surgical form of the pin, erased to a no-op
  // at runtime (the Eyebrow `as` precedent).
  type ContainerProps = Parameters<typeof Container>[0];

  it('has no width axis — the clamp IS the width policy (fb-171)', () => {
    expectTypeOf<ContainerProps>().not.toHaveProperty('width');
  });

  it('has no asChild / as axis — the two-box split is the pattern', () => {
    expectTypeOf<ContainerProps>().not.toHaveProperty('asChild');
    expectTypeOf<ContainerProps>().not.toHaveProperty('as');
  });

  it('does carry the native surface those pins are read against', () => {
    // Never-vacuous guard: if the props type ever degraded to `{}` or `any`,
    // the three assertions above would pass while proving nothing.
    expectTypeOf<ContainerProps>().toHaveProperty('className');
    expectTypeOf<ContainerProps>().toHaveProperty('children');
  });
});

describe('Container — the zero-island invariant (source guard)', () => {
  it("ships no 'use client' directive", () => {
    // Load-bearing, and invisible to any runtime assertion: the Footer's
    // zero-island contract must survive composing this atom, and a directive
    // here would hydrate the Footer — and every future band — on every route
    // of the site (§16). Tolerant of trailing line AND block comments
    // (`'use client'; /* … */` is a live directive — the prologue grammar
    // keeps comment company legal; G2 2026-09-04). RECORDED TOLERANCE, not a
    // hole being denied: a leading same-line comment or trailing code
    // (`'use client';const x=1`) would still slip past — prettier formats
    // directives onto their own line in this repo, so the guard reads the
    // shapes that survive formatting. A comment line can never match:
    // comments start with `/` or `*`, never with a quote.
    expect(source).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
  });

  it('spells the gutter pair exactly ONCE in its own source', () => {
    // The FILE-LOCAL half of the promotion's residue check: THIS file spells
    // the pair once (counting the PAIR, not the clamp alone, keeps the prose
    // above free to discuss the numbers without reddening the guard). This
    // counter cannot see any other file — the src-WIDE half, "no spelling
    // beyond the definition and the two deliberate test pins", is
    // tests/unit/gutter-single-spelling.test.ts.
    expect(source.split(GUTTER).length - 1).toBe(1);
  });
});
