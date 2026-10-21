import {
  createRef,
  type ComponentProps,
  type ComponentPropsWithRef,
  type ReactElement,
} from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ALL_GLYPHS } from './all-glyphs';
import { Burger } from './Burger';
import { CalendarCheck } from './CalendarCheck';
import { Check } from './Check';
import { ChevronLeft } from './ChevronLeft';
import { ChevronRight } from './ChevronRight';
import { Close } from './Close';
import { Facebook } from './Facebook';
import { Instagram } from './Instagram';
import { Link } from './Link';
import { Mail } from './Mail';
import { People } from './People';
import { Phone } from './Phone';
import { Pin } from './Pin';
import { QuoteMark } from './QuoteMark';
import { Star } from './Star';
import { Tiktok } from './Tiktok';
import { ToothCheck } from './ToothCheck';
import { Trophy } from './Trophy';
import { Whatsapp } from './Whatsapp';

// Role-based queries wherever the element belongs in the a11y tree (§3, §9) —
// but a DECORATIVE glyph is deliberately absent from that tree, so structural
// assertions reach the <svg> root through the container instead. That
// asymmetry IS the accessibility contract: aria-hidden by default, role="img"
// only when a label is supplied. Fixtures are Romanian with diacritics (§15.7).
//
// Under the whole-svg pattern there is no compile-checked registry: the paint
// families are hand-listed below, and the completeness check pins them to
// ALL_GLYPHS — a new glyph file that skips the lists fails HERE instead of
// drifting out of coverage silently (board §5·2-2, accepted with mitigation).

const STROKE_GLYPHS = [
  ['Burger', Burger],
  ['CalendarCheck', CalendarCheck],
  ['Check', Check],
  ['ChevronLeft', ChevronLeft],
  ['ChevronRight', ChevronRight],
  ['Close', Close],
  ['Link', Link],
  ['Mail', Mail],
  ['People', People],
  ['Phone', Phone],
  ['Pin', Pin],
  ['QuoteMark', QuoteMark],
  ['ToothCheck', ToothCheck],
  ['Trophy', Trophy],
] as const;
const FILL_GLYPHS = [
  ['Facebook', Facebook],
  ['Instagram', Instagram],
  ['Star', Star],
  ['Tiktok', Tiktok],
  ['Whatsapp', Whatsapp],
] as const;

// SVGElement.className is an SVGAnimatedString, never a string — every class
// assertion in this file therefore goes through the attribute.
function renderGlyph(ui: ReactElement): SVGSVGElement {
  const { container } = render(ui);
  const root = container.firstElementChild;
  if (!(root instanceof SVGSVGElement)) {
    throw new Error(
      `a glyph must render a bare <svg> root; got <${root?.tagName ?? 'nothing'}>`,
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

// A ROW IS A NAME AND A COMPONENT, written side by side by hand, and every
// per-glyph block below reaches a glyph only through its row — so a row must
// be honest, not merely present. Lengths and names cannot tell when a row
// holds another glyph's component (['Mail', Link]: Mail's drawing gone from
// every block below and from the Gallery story, Link's walked twice), when a
// name stands where another stood (a second ['Check', Check] in Mail's
// place), or when one glyph is listed twice in the registry and in a family
// list alike: the lists still agree in length and in names, and the lane's
// TypeScript review measured all three green. So each list names a glyph
// ONCE, and each row holds the function its name says — the component's own
// `name`, which this runner keeps (its transform minifies nothing; read on
// every row).
function expectHonestRows(
  rows: ReadonlyArray<readonly [string, { readonly name: string }]>,
): void {
  const names = rows.map(([name]) => name);
  expect(new Set(names).size, 'a glyph is listed twice').toBe(names.length);
  for (const [name, Glyph] of rows) {
    expect(Glyph.name, `the ${name} row holds another glyph`).toBe(name);
  }
}

describe('glyphs — the hand lists stay complete', () => {
  it('classifies every ALL_GLYPHS entry as stroke or fill exactly once', () => {
    expect(STROKE_GLYPHS.length + FILL_GLYPHS.length).toBe(ALL_GLYPHS.length);
    const classified = new Set(
      [...STROKE_GLYPHS, ...FILL_GLYPHS].map(([name]) => name),
    );
    for (const [name] of ALL_GLYPHS) {
      expect(classified.has(name)).toBe(true);
    }
  });

  it('ALL_GLYPHS lists each glyph once, every row holding its own component', () => {
    expectHonestRows(ALL_GLYPHS);
  });

  it('the paint families list each glyph once, every row holding its own component', () => {
    expectHonestRows([...STROKE_GLYPHS, ...FILL_GLYPHS]);
  });
});

describe('glyphs — element & semantics (every component)', () => {
  it.each(ALL_GLYPHS)(
    '%s renders a bare <svg> root — no wrapper',
    (_n, Glyph) => {
      // A wrapper <span> would put the glyph out of reach of a parent's
      // [&_svg]:size-* descendant selector — hence "bare".
      const { container } = render(<Glyph />);
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild).toBeInstanceOf(SVGSVGElement);
    },
  );

  it.each(ALL_GLYPHS)('%s sits on the shared 24-unit grid', (_n, Glyph) => {
    expect(renderGlyph(<Glyph />)).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it.each(ALL_GLYPHS)(
    '%s never emits width/height attributes — CSS owns the geometry',
    (_n, Glyph) => {
      const svg = renderGlyph(<Glyph />);
      expect(svg).not.toHaveAttribute('width');
      expect(svg).not.toHaveAttribute('height');
    },
  );

  it.each(ALL_GLYPHS)(
    '%s is decorative by default: aria-hidden, no role',
    (_n, Glyph) => {
      const svg = renderGlyph(<Glyph />);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
    },
  );

  it.each(ALL_GLYPHS)('%s renders non-empty path geometry', (_n, Glyph) => {
    const svg = renderGlyph(<Glyph />);
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect((path.getAttribute('d') ?? '').trim().length).toBeGreaterThan(0);
    }
  });
});

// The parent's colour in the computed-paint test below: a value no design
// tool exports, so a paint that computes to it came from the parent. Written
// as Chromium serialises a computed colour.
const PARENT_COLOR = 'rgb(1, 2, 3)';

describe('glyphs — currentColor discipline', () => {
  it.each(ALL_GLYPHS)('%s ships no color literal', (_n, Glyph) => {
    // Color arrives from the parent's CSS `color`, always. A single hex or
    // rgb() in the markup would make one glyph immune to text-*, hover fades
    // and future themes.
    const markup = renderGlyph(<Glyph />).outerHTML;
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(markup).not.toMatch(/rgba?\(/i);
  });

  it.each(ALL_GLYPHS)(
    '%s computes every fill and stroke to the colour it inherits, or none',
    (_n, Glyph) => {
      // The check above reads the markup for literals; this one asks the
      // ENGINE what each element paints with, because a paint can arrive
      // with no hex and no rgb() in it: a named colour (fill="black", how a
      // design tool exports #000), an inline style on a child shape (a pasted
      // export puts paints on CHILD shapes as well as on the root — Lucide
      // draws some icons' small dots solid), or a `color` on the root, which
      // cuts the parent's colour off before currentColor reads it. Reading
      // the fill and stroke ATTRIBUTES — as the family tests below do — sees
      // the first and misses the other two (measured by the lane's TypeScript
      // review).
      // So the glyph renders in a parent coloured PARENT_COLOR, and the
      // computed fill and stroke of the root and of every shape must be that
      // colour or none (README rule 3). What it cannot see: a paint carried by
      // a CLASS, which needs a stylesheet, and this file loads none.
      const { container } = render(
        <div style={{ color: PARENT_COLOR }}>
          <Glyph />
        </div>,
      );
      const svg = container.querySelector('svg');
      if (svg === null) throw new Error('the glyph rendered no <svg>');
      for (const element of [svg, ...svg.querySelectorAll('*')]) {
        const computed = getComputedStyle(element);
        for (const paint of ['fill', 'stroke'] as const) {
          expect(
            ['none', PARENT_COLOR],
            `<${element.tagName}> ${paint}`,
          ).toContain(computed[paint]);
        }
      }
    },
  );

  it.each(STROKE_GLYPHS)(
    '%s is drawn as an outline in currentColor',
    (_n, Glyph) => {
      const svg = renderGlyph(<Glyph />);
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('fill', 'none');
    },
  );

  it.each(FILL_GLYPHS)(
    '%s is drawn as a solid shape in currentColor',
    (_n, Glyph) => {
      const svg = renderGlyph(<Glyph />);
      expect(svg).toHaveAttribute('fill', 'currentColor');
      expect(svg).not.toHaveAttribute('stroke');
    },
  );
});

describe('glyphs — labelled mode is the semantic escape hatch (every component)', () => {
  // The labelled branch is hand-duplicated per file (the accepted cost of
  // killing the renderer) — so every component proves it, not just Phone:
  // a mispasted trim() guard in one file would otherwise pass this suite.
  it.each(ALL_GLYPHS)(
    '%s exposes role="img" with the given name and drops aria-hidden',
    (_n, Glyph) => {
      render(<Glyph aria-label="Sună clinica" />);
      const svg = screen.getByRole('img', { name: 'Sună clinica' });
      expect(svg).toBeInTheDocument();
      // Not "aria-hidden=false" — the attribute must be gone entirely.
      expect(svg).not.toHaveAttribute('aria-hidden');
    },
  );

  it.each(ALL_GLYPHS)(
    '%s stays out of the a11y tree without a label',
    (_n, Glyph) => {
      render(<Glyph />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    },
  );

  it.each(ALL_GLYPHS)(
    '%s treats an empty aria-label as decorative — never a nameless image',
    (_n, Glyph) => {
      // Storybook's cleared text control hands the component '' (not
      // undefined); role="img" with an empty name is an axe svg-img-alt fail.
      const svg = renderGlyph(<Glyph aria-label="" />);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
    },
  );

  it.each(ALL_GLYPHS)(
    '%s treats a whitespace-only aria-label as decorative',
    (_n, Glyph) => {
      render(<Glyph aria-label="   " />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    },
  );
});

describe('glyphs — §6.8 native-element fidelity (every component)', () => {
  it.each(ALL_GLYPHS)(
    '%s merges the parent className instead of replacing its own',
    (_n, Glyph) => {
      const cls = classOf(<Glyph className="absolute end-2" />);
      expect(cls).toContain('absolute');
      expect(cls).toContain('end-2');
      expect(cls).toContain('size-6');
    },
  );

  it.each(ALL_GLYPHS)(
    '%s accepts ref as a regular prop (React 19) reaching the SVG node',
    (_n, Glyph) => {
      const ref = createRef<SVGSVGElement>();
      render(<Glyph ref={ref} />);
      expect(ref.current).toBeInstanceOf(SVGSVGElement);
    },
  );

  it.each(ALL_GLYPHS)(
    '%s spreads remaining native props onto the root element',
    (_n, Glyph) => {
      const svg = renderGlyph(
        <Glyph data-analytics="social" focusable="false" />,
      );
      expect(svg).toHaveAttribute('data-analytics', 'social');
      expect(svg).toHaveAttribute('focusable', 'false');
    },
  );
});

describe('glyphs — size presets are real styling switches (every component)', () => {
  // sizeClasses is duplicated per file too — each component proves its own map.
  it.each(ALL_GLYPHS)(
    '%s: each preset emits a distinct class set',
    (_n, Glyph) => {
      const sm = classOf(<Glyph size="sm" />);
      const md = classOf(<Glyph size="md" />);
      const lg = classOf(<Glyph size="lg" />);
      expect(sm).not.toEqual(md);
      expect(sm).not.toEqual(lg);
      expect(md).not.toEqual(lg);
    },
  );

  it.each(ALL_GLYPHS)(
    '%s defaults to md (1.5rem) and never shrinks in a flex row',
    (_n, Glyph) => {
      const fallback = classOf(<Glyph />);
      expect(fallback).toEqual(classOf(<Glyph size="md" />));
      expect(fallback).toContain('size-6');
      expect(fallback).toContain('shrink-0');
    },
  );

  it.each(ALL_GLYPHS)(
    '%s sizes in rem so browser zoom scales the glyph (§7)',
    (_n, Glyph) => {
      expect(classOf(<Glyph size="sm" />)).toContain('size-4');
      expect(classOf(<Glyph size="lg" />)).toContain('size-8');
    },
  );
});

// The template's props — README rule 2 as a type: its own size scale, and the
// native <svg> props without children, without that prop's name and without
// the two attributes CSS owns.
type TemplateProps = {
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

// Every registry entry's props, keyed by its name — so a file that drifts is
// NAMED in the compiler's error, never lost in a union of every row.
type GlyphRow = (typeof ALL_GLYPHS)[number];
type GlyphPropsByName = {
  [Row in GlyphRow as Row[0]]: ComponentProps<Row[1]>;
};

describe('glyphs — type-level contract', () => {
  it('rejects children and unknown props', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the contract
    // loosens. @ts-expect-error is itself an error when the line compiles,
    // so both directions are covered.
    const slotted = (
      // @ts-expect-error — children are Omit-ed: the artwork lives in the file
      <Phone>Sună</Phone>
    );
    const unknownProp = (
      // @ts-expect-error — unknown props must not compile
      <Phone sizee="lg" />
    );
    expect(slotted).toBeTruthy();
    expect(unknownProp).toBeTruthy();
  });

  it('gives every ALL_GLYPHS entry the template props, so no width or height compiles', () => {
    // README rule 2 promises that a pasted width or height "doesn't even
    // compile" — a promise each FILE keeps with its own Omit, and one nothing
    // here checked: the pair above refuses children and an unknown prop, on
    // Phone, never a width, and Check's Omit without 'width' | 'height'
    // passed tsc and every test (measured by the lane's TypeScript review).
    // So every registry entry's props must BE the template's, spelled once
    // below and never read off a file it judges: the day a file lets width,
    // height or children back in, or grows a size scale of its own,
    // `tsc --noEmit` fails on this line and names the row — "Types of
    // property 'Check' are incompatible".
    expectTypeOf<GlyphPropsByName>().toEqualTypeOf<
      Record<GlyphRow[0], TemplateProps>
    >();
  });
});
