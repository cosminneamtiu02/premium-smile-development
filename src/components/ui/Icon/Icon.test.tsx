import { createRef, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as glyphRegistry from '@/assets/glyphs';
import { Icon, type IconName } from './Icon';

// Role-based queries wherever the element belongs in the a11y tree (§3, §9) —
// but a DECORATIVE icon is deliberately absent from that tree, so the
// structural assertions reach the <svg> root through the container instead.
// That asymmetry IS the accessibility contract (approved plan §4e:
// aria-hidden by default, role="img" only when a label is supplied).
// Fixtures are Romanian with diacritics (§15.7).

const { GLYPHS } = glyphRegistry;
const GLYPH_NAMES = Object.keys(GLYPHS) as IconName[];

// SVGElement.className is an SVGAnimatedString, never a string — every class
// assertion in this file therefore goes through the attribute.
function renderIcon(ui: ReactElement): SVGSVGElement {
  const { container } = render(ui);
  const root = container.firstElementChild;
  if (!(root instanceof SVGSVGElement)) {
    throw new Error(
      `Icon must render a bare <svg> root; got <${root?.tagName ?? 'nothing'}>`,
    );
  }
  return root;
}

const classOf = (ui: ReactElement): string => {
  const { container, unmount } = render(ui);
  const cls = container.firstElementChild?.getAttribute('class') ?? '';
  unmount();
  return cls;
};

describe('Icon — element & semantics', () => {
  it('renders a bare <svg> root — no wrapper element', () => {
    const { container } = render(<Icon name="phone" />);
    // A wrapper <span> would put the icon out of reach of a parent's
    // [&_svg]:size-* descendant selector (plan §4c) — hence "bare".
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBeInstanceOf(SVGSVGElement);
  });

  it('normalizes every glyph onto one coordinate system', () => {
    expect(renderIcon(<Icon name="phone" />)).toHaveAttribute(
      'viewBox',
      '0 0 24 24',
    );
  });

  it('never emits width/height attributes — CSS owns the geometry', () => {
    const svg = renderIcon(<Icon name="phone" />);
    expect(svg).not.toHaveAttribute('width');
    expect(svg).not.toHaveAttribute('height');
  });

  it('is decorative by default: aria-hidden, no role', () => {
    const svg = renderIcon(<Icon name="phone" />);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });
});

describe('Icon — the glyphs/ folder contract (plan §4a)', () => {
  it.each(GLYPH_NAMES)('registry entry "%s" is well formed', (name) => {
    const glyph = GLYPHS[name];
    expect(['stroke', 'fill']).toContain(glyph.mode);
    expect(typeof glyph.d).toBe('string');
    expect(glyph.d.trim().length).toBeGreaterThan(0);
  });

  it.each(GLYPH_NAMES)('glyph "%s" renders one non-empty <path>', (name) => {
    const svg = renderIcon(<Icon name={name} />);
    const paths = svg.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('d')).toBe(GLYPHS[name].d);
    expect(paths[0].getAttribute('d')?.length ?? 0).toBeGreaterThan(0);
  });

  it('keys the registry by the per-file export name — one glyph, one file', () => {
    // The name in the folder IS the name in the union IS the name at the call
    // site; a renamed export that forgets the key would desync them silently.
    for (const name of GLYPH_NAMES) {
      expect(glyphRegistry[name]).toBe(GLYPHS[name]);
    }
  });
});

describe('Icon — currentColor discipline (plan §4d)', () => {
  it.each(GLYPH_NAMES)('glyph "%s" ships no color literal', (name) => {
    // Color arrives from the parent's CSS `color`, always. A single hex or
    // rgb() in the markup would make one glyph immune to text-*, hover fades
    // and future themes.
    const markup = renderIcon(<Icon name={name} />).outerHTML;
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(markup).not.toMatch(/rgba?\(/i);
  });

  it.each(GLYPH_NAMES.filter((name) => GLYPHS[name].mode === 'stroke'))(
    'stroke glyph "%s" is drawn as an outline in currentColor',
    (name) => {
      const svg = renderIcon(<Icon name={name} />);
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('fill', 'none');
    },
  );

  it.each(GLYPH_NAMES.filter((name) => GLYPHS[name].mode === 'fill'))(
    'fill glyph "%s" is drawn as a solid shape in currentColor',
    (name) => {
      const svg = renderIcon(<Icon name={name} />);
      expect(svg).toHaveAttribute('fill', 'currentColor');
      expect(svg).not.toHaveAttribute('stroke');
    },
  );
});

describe('Icon — labelled mode is the semantic escape hatch (plan §4e)', () => {
  it('exposes role="img" with the given name and drops aria-hidden', () => {
    render(<Icon name="phone" aria-label="Sună clinica" />);
    const svg = screen.getByRole('img', { name: 'Sună clinica' });
    expect(svg).toBeInTheDocument();
    // Not "aria-hidden=false" — the attribute must be gone entirely.
    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it('stays out of the a11y tree without a label', () => {
    render(<Icon name="phone" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('treats an empty aria-label as decorative — never a nameless image', () => {
    // Storybook's cleared text control hands the component '' (not
    // undefined); role="img" with an empty name is an axe svg-img-alt fail.
    const svg = renderIcon(<Icon name="phone" aria-label="" />);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('treats a whitespace-only aria-label as decorative', () => {
    render(<Icon name="phone" aria-label="   " />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('Icon — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    const cls = classOf(<Icon name="phone" className="absolute end-2" />);
    expect(cls).toContain('absolute');
    expect(cls).toContain('end-2');
    expect(cls).toContain('size-6');
  });

  it('accepts ref as a regular prop (React 19) reaching the SVG node', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon name="phone" ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('spreads remaining native props onto the root element', () => {
    const svg = renderIcon(
      <Icon name="phone" data-analytics="social" focusable="false" />,
    );
    expect(svg).toHaveAttribute('data-analytics', 'social');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});

describe('Icon — size presets are real styling switches (fb-72)', () => {
  it.each([
    ['sm', 'md'],
    ['sm', 'lg'],
    ['md', 'lg'],
  ] as const)('size "%s" styles differ from "%s"', (a, b) => {
    expect(classOf(<Icon name="phone" size={a} />)).not.toEqual(
      classOf(<Icon name="phone" size={b} />),
    );
  });

  it('defaults to md (1.5rem) and never shrinks in a flex row', () => {
    const fallback = classOf(<Icon name="phone" />);
    expect(fallback).toEqual(classOf(<Icon name="phone" size="md" />));
    expect(fallback).toContain('size-6');
    expect(fallback).toContain('shrink-0');
  });

  it('sizes in rem so browser zoom scales the glyph (§7)', () => {
    expect(classOf(<Icon name="phone" size="sm" />)).toContain('size-4');
    expect(classOf(<Icon name="phone" size="lg" />)).toContain('size-8');
  });
});

describe('Icon — type-level contract', () => {
  it('rejects unknown glyph names and any children', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the contract
    // loosens. @ts-expect-error is itself an error when the line compiles,
    // so both directions are covered.
    const typo = (
      // @ts-expect-error — 'fone' is not a file in glyphs/, so it cannot compile
      <Icon name="fone" />
    );
    const slotted = (
      // @ts-expect-error — children are Omit-ed: the glyph comes from the registry
      <Icon name="phone">Sună</Icon>
    );
    const unknownProp = (
      // @ts-expect-error — unknown props must not compile (plan §8)
      <Icon name="phone" sizee="lg" />
    );
    expect(typo).toBeTruthy();
    expect(slotted).toBeTruthy();
    expect(unknownProp).toBeTruthy();
  });
});
