/// <reference types="vite/client" />
import { createRef, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ALL_FLAGS } from './all-flags';
import { RomaniaFlag } from './RomaniaFlag';

// The flags frame contract — Glyphs.test.tsx's shape with the folder's ONE
// deliberate inversion (./README.md rule 3): a flag is not tintable, so fixed
// colors are REQUIRED and currentColor is FORBIDDEN, the exact opposite of the
// glyphs discipline. A DECORATIVE flag is absent from the a11y tree, so
// structural assertions reach the <svg> root through the container (the
// Glyphs.test.tsx asymmetry, same reason). Fixtures are Romanian with
// diacritics (§15.7).

// Each flag's official construction ratio, pinned: the viewBox IS the ratio
// (README rule 2). The completeness check binds this hand-map to ALL_FLAGS so
// a new flag cannot skip its row here silently.
const RATIOS: Record<string, string> = {
  FranceFlag: '0 0 3 2',
  GermanyFlag: '0 0 5 3',
  ItalyFlag: '0 0 3 2',
  RomaniaFlag: '0 0 3 2',
  UnitedKingdomFlag: '0 0 60 30',
};

// SVGElement.className is an SVGAnimatedString, never a string — class
// assertions go through the attribute (the Glyphs.test.tsx note).
function renderFlag(ui: ReactElement): SVGSVGElement {
  const { container } = render(ui);
  const root = container.firstElementChild;
  if (!(root instanceof SVGSVGElement)) {
    throw new Error(
      `a flag must render a bare <svg> root; got <${root?.tagName ?? 'nothing'}>`,
    );
  }
  return root;
}

describe('flags — the registry stays complete', () => {
  it('covers every *Flag.tsx component file in the folder', () => {
    // import.meta.glob is a build-time Vite transform, so this is a real
    // folder listing — stronger than the glyphs hand-list, whose drift risk
    // was accepted with the pattern (board §5·2-2); here nothing drifts.
    const files = Object.keys(import.meta.glob('./*Flag.tsx'))
      .map((path) => path.replace('./', '').replace('.tsx', ''))
      .sort();
    const registered = ALL_FLAGS.map(([name]) => name).sort();
    expect(registered).toEqual(files);
  });

  it('pins every registered flag to its official ratio exactly once', () => {
    expect(Object.keys(RATIOS).sort()).toEqual(
      ALL_FLAGS.map(([name]) => name).sort(),
    );
  });
});

describe('flags — element & frame (every component)', () => {
  it.each(ALL_FLAGS)(
    '%s renders a bare <svg> root — no wrapper',
    (_n, Flag) => {
      // A wrapper would put the artwork out of reach of the consumer's
      // [&_svg]:size-full crop-box selector — hence "bare".
      const { container } = render(<Flag />);
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild).toBeInstanceOf(SVGSVGElement);
    },
  );

  it.each(ALL_FLAGS)('%s draws on its official ratio', (name, Flag) => {
    expect(renderFlag(<Flag />)).toHaveAttribute('viewBox', RATIOS[name]);
  });

  it.each(ALL_FLAGS)(
    '%s carries the cover-crop contract (preserveAspectRatio slice)',
    (_n, Flag) => {
      expect(renderFlag(<Flag />)).toHaveAttribute(
        'preserveAspectRatio',
        'xMidYMid slice',
      );
    },
  );

  it.each(ALL_FLAGS)(
    '%s never emits width/height attributes — the consumer owns geometry',
    (_n, Flag) => {
      const svg = renderFlag(<Flag />);
      expect(svg).not.toHaveAttribute('width');
      expect(svg).not.toHaveAttribute('height');
    },
  );

  it.each(ALL_FLAGS)('%s renders real shape geometry', (_n, Flag) => {
    // Tricolors are three rects; the Union Jack is a rect plus stroked paths.
    const svg = renderFlag(<Flag />);
    expect(svg.querySelectorAll('rect, path').length).toBeGreaterThanOrEqual(3);
  });
});

describe('flags — fixed-color discipline (the glyphs inversion)', () => {
  it.each(ALL_FLAGS)(
    '%s ships literal colors, never currentColor',
    (_n, Flag) => {
      // A flag that painted with currentColor would recolor under a parent's
      // text-* utility — national colors are not a theme surface (README §3).
      const markup = renderFlag(<Flag />).outerHTML;
      expect(markup).toMatch(/#[0-9a-f]{6}/i);
      expect(markup).not.toMatch(/currentColor/);
    },
  );
});

describe('flags — labelled mode is the semantic escape hatch (every component)', () => {
  // The labelled branch is hand-duplicated per file (the glyphs pattern's
  // accepted cost) — so every component proves it, not just one.
  it.each(ALL_FLAGS)(
    '%s exposes role="img" with the given name and drops aria-hidden',
    (_n, Flag) => {
      render(<Flag aria-label="Drapelul țării" />);
      const svg = screen.getByRole('img', { name: 'Drapelul țării' });
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveAttribute('aria-hidden');
    },
  );

  it.each(ALL_FLAGS)(
    '%s stays out of the a11y tree without a label',
    (_n, Flag) => {
      render(<Flag />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    },
  );

  it.each(ALL_FLAGS)(
    '%s treats an empty aria-label as decorative — never a nameless image',
    (_n, Flag) => {
      const svg = renderFlag(<Flag aria-label="" />);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
    },
  );

  it.each(ALL_FLAGS)(
    '%s treats a whitespace-only aria-label as decorative',
    (_n, Flag) => {
      render(<Flag aria-label="   " />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    },
  );
});

describe('flags — §6.8 native-element fidelity (every component)', () => {
  it.each(ALL_FLAGS)('%s passes the parent className through', (_n, Flag) => {
    // Unlike glyphs there is no own base class to merge with (no size prop,
    // README's sizing rule) — the parent's string must arrive verbatim.
    const { container } = render(<Flag className="absolute end-2" />);
    const cls = container.firstElementChild?.getAttribute('class') ?? '';
    expect(cls).toContain('absolute');
    expect(cls).toContain('end-2');
  });

  it.each(ALL_FLAGS)(
    '%s accepts ref as a regular prop (React 19) reaching the SVG node',
    (_n, Flag) => {
      const ref = createRef<SVGSVGElement>();
      render(<Flag ref={ref} />);
      expect(ref.current).toBeInstanceOf(SVGSVGElement);
    },
  );

  it.each(ALL_FLAGS)(
    '%s spreads remaining native props onto the root element',
    (_n, Flag) => {
      const svg = renderFlag(<Flag data-country="fixture" focusable="false" />);
      expect(svg).toHaveAttribute('data-country', 'fixture');
      expect(svg).toHaveAttribute('focusable', 'false');
    },
  );
});

describe('flags — type-level contract', () => {
  it('rejects children, width/height and unknown props', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the contract
    // loosens. @ts-expect-error is itself an error when the line compiles,
    // so both directions are covered.
    const slotted = (
      // @ts-expect-error — children are Omit-ed: the artwork lives in the file
      <RomaniaFlag>steag</RomaniaFlag>
    );
    const sized = (
      // @ts-expect-error — width/height are Omit-ed: CSS owns the geometry
      <RomaniaFlag width={90} />
    );
    const unknownProp = (
      // @ts-expect-error — unknown props must not compile
      <RomaniaFlag ratio="2:3" />
    );
    expect(slotted).toBeTruthy();
    expect(sized).toBeTruthy();
    expect(unknownProp).toBeTruthy();
  });
});
