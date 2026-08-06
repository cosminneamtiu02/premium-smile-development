import { createRef, type ReactElement, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  GlyphButton,
  type GlyphButtonShape,
  type GlyphButtonSize,
  type GlyphButtonVariant,
} from './GlyphButton';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7).
//
// This file deliberately does NOT import ui/Icon. GlyphButton.tsx doesn't
// either — its slot takes ANY inline SVG, so the unit proof uses a raw one:
// a glyph-registry edit can then never mask (or fake) a GlyphButton
// regression. The real <Icon> composition is covered by the stories, where
// the visual net and per-story axe see it (plan §6).
const GLYPH = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12h16" stroke="currentColor" fill="none" />
  </svg>
);

const classesOf = (ui: ReactElement): string => {
  const { unmount } = render(ui);
  const cls = screen.getByRole('button').className;
  unmount();
  return cls;
};

// All three axis tables sit at module scope, each a Record<Union, …> so a
// future member cannot ship with zero token coverage — the file stops
// typechecking until it is classified here. The shape suite reuses sizeTokens
// to prove the axes orthogonal, and the motion sweep derives its matrix from
// the shape × variant tables, inheriting their exhaustiveness.
const sizeTokens: Record<GlyphButtonSize, string[]> = {
  md: ['size-11', '[&_svg]:size-5'], // 2.75rem / 44px — §9 touch target
  lg: ['size-14', '[&_svg]:size-7'], // 3.5rem / 56px — primary CTA scale
};

const shapeTokens: Record<GlyphButtonShape, string[]> = {
  round: ['rounded-full'], // the call CTA and the footer socials
  square: ['rounded-md'], // the Header burger — 6px, the §15.1 default radius
};

const requiredTokens: Record<GlyphButtonVariant, string[]> = {
  solid: [
    'bg-cta',
    'text-ink-inverse',
    'hover:bg-cta-hover',
    'active:bg-cta-hover',
  ],
  outline: [
    'border-cta',
    'bg-surface',
    'text-cta',
    'hover:bg-cta',
    'hover:text-ink-inverse',
    'active:bg-cta-hover',
    'active:text-ink-inverse',
  ],
  // The quiet tone, byte-identical to Button's ghost bundle so the two atoms
  // speak one ghost language: transparent at rest, dim tray on hover — and
  // the tray is line-subtle, NOT raised (#ffffff would be invisible on the
  // white surface). ink over #e9e6e2 = 11.9:1, measured in Button.tsx.
  ghost: [
    'bg-transparent',
    'text-ink',
    'hover:bg-line-subtle',
    'active:bg-line-subtle',
  ],
};

// The full variant × shape matrix, DERIVED — never hand-listed: a hand list
// silently missed outline·square and would let a future bundle ship unswept
// (G2 finding, 2026-08-06). Because both source tables are Record<Union, …>,
// a 4th variant or 3rd shape joins the sweep the moment the file typechecks.
const motionCases = (
  Object.keys(requiredTokens) as GlyphButtonVariant[]
).flatMap((variant) =>
  (Object.keys(shapeTokens) as GlyphButtonShape[]).map(
    (shape): [GlyphButtonVariant, GlyphButtonShape] => [variant, shape],
  ),
);

describe('GlyphButton — element & semantics', () => {
  it('renders a real <button> exposing the aria-label as its accessible name', () => {
    render(<GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>);
    expect(
      screen.getByRole('button', { name: 'Sună clinica' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(
      <GlyphButton aria-label="Trimite formularul" type="submit">
        {GLYPH}
      </GlyphButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(
      <GlyphButton aria-label="Sună clinica" onClick={onClick}>
        {GLYPH}
      </GlyphButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună clinica' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <GlyphButton aria-label="Sună clinica" disabled onClick={onClick}>
        {GLYPH}
      </GlyphButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună clinica' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('GlyphButton — the icon slot (§6.2) and its geometry', () => {
  it('renders the svg child inside the control and sizes it from the root', () => {
    render(<GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>);
    const button = screen.getByRole('button', { name: 'Sună clinica' });
    // The glyph is the content, not a prop — any inline <svg> is legal.
    expect(button.querySelector('svg')).toBeInstanceOf(SVGSVGElement);
    // …and the CIRCLE owns its geometry: the descendant utility scores
    // specificity (0,1,1) against Icon's own preset class (0,1,0), so call
    // sites may drop <Icon name="…"/> in with or without a size prop.
    expect(button.className).toContain('[&_svg]:size-5');
  });

  it.each(Object.keys(sizeTokens) as GlyphButtonSize[])(
    'size %s scales circle and glyph together, in rem (§7)',
    (size) => {
      const cls = classesOf(
        <GlyphButton aria-label="Sună clinica" size={size}>
          {GLYPH}
        </GlyphButton>,
      );
      for (const token of sizeTokens[size]) {
        expect(cls).toContain(token);
      }
    },
  );

  it('is a perfect circle that never shrinks in a flex row', () => {
    const cls = classesOf(
      <GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>,
    );
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('shrink-0');
  });
});

describe('GlyphButton — shape is geometry, nothing else', () => {
  it('defaults to round, so every existing circle is untouched by the rework', () => {
    const fallback = classesOf(
      <GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>,
    );
    expect(fallback).toEqual(
      classesOf(
        <GlyphButton aria-label="Sună clinica" shape="round">
          {GLYPH}
        </GlyphButton>,
      ),
    );
  });

  it.each(Object.keys(shapeTokens) as GlyphButtonShape[])(
    'shape %s carries exactly its own radius token',
    (shape) => {
      const cls = classesOf(
        <GlyphButton aria-label="Deschide meniul" shape={shape}>
          {GLYPH}
        </GlyphButton>,
      );
      for (const token of shapeTokens[shape]) {
        expect(cls).toContain(token);
      }
    },
  );

  it('square is a rounded rectangle and never a circle', () => {
    const cls = classesOf(
      <GlyphButton aria-label="Deschide meniul" shape="square">
        {GLYPH}
      </GlyphButton>,
    );
    expect(cls).toContain('rounded-md');
    expect(cls).not.toContain('rounded-full');
  });

  it('shape "round" styles differ from "square"', () => {
    expect(
      classesOf(
        <GlyphButton aria-label="Deschide meniul" shape="round">
          {GLYPH}
        </GlyphButton>,
      ),
    ).not.toEqual(
      classesOf(
        <GlyphButton aria-label="Deschide meniul" shape="square">
          {GLYPH}
        </GlyphButton>,
      ),
    );
  });

  it.each(Object.keys(sizeTokens) as GlyphButtonSize[])(
    'square keeps the %s box and its glyph sizing — shape ⟂ size',
    (size) => {
      const cls = classesOf(
        <GlyphButton aria-label="Deschide meniul" shape="square" size={size}>
          {GLYPH}
        </GlyphButton>,
      );
      for (const token of sizeTokens[size]) {
        expect(cls).toContain(token);
      }
    },
  );
});

describe('GlyphButton — morph-ready root (no state, no new code path)', () => {
  // The burger's open/closed animation is the Header's job (D12): this atom
  // only GUARANTEES the hooks — `group` on the root plus honest prop spread —
  // so the parent's own child SVG can drive itself with group-aria-expanded:*.
  it('always marks its root `group`, the hook a parent SVG keys off', () => {
    const cls = classesOf(
      <GlyphButton aria-label="Deschide meniul">{GLYPH}</GlyphButton>,
    );
    expect(cls.split(/\s+/)).toContain('group');
  });

  it('spreads aria-expanded/aria-controls onto the root — the parent owns the state', () => {
    render(
      <GlyphButton
        aria-label="Deschide meniul"
        aria-expanded={false}
        aria-controls="meniu-principal"
      >
        {GLYPH}
      </GlyphButton>,
    );
    const button = screen.getByRole('button', { name: 'Deschide meniul' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'meniu-principal');
  });

  it('lands both `group` and aria-expanded on the child in asChild mode', () => {
    // Mechanics proof ONLY — an anchor that toggles a panel would announce
    // "link" and promise navigation it doesn't do; the REAL burger is the
    // plain-<button> branch above. Never copy this fixture as the pattern.
    render(
      <GlyphButton asChild aria-label="Deschide meniul" aria-expanded>
        <a href="#meniu-principal">{GLYPH}</a>
      </GlyphButton>,
    );
    const link = screen.getByRole('link', { name: 'Deschide meniul' });
    expect(link.className.split(/\s+/)).toContain('group');
    expect(link).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('GlyphButton — variants & sizes are real styling switches', () => {
  it('defaults to solid · md', () => {
    const fallback = classesOf(
      <GlyphButton aria-label="Sună clinica">{GLYPH}</GlyphButton>,
    );
    expect(fallback).toEqual(
      classesOf(
        <GlyphButton aria-label="Sună clinica" variant="solid" size="md">
          {GLYPH}
        </GlyphButton>,
      ),
    );
  });

  it('variant "solid" styles differ from "outline"', () => {
    expect(
      classesOf(
        <GlyphButton aria-label="Sună clinica" variant="solid">
          {GLYPH}
        </GlyphButton>,
      ),
    ).not.toEqual(
      classesOf(
        <GlyphButton aria-label="Sună clinica" variant="outline">
          {GLYPH}
        </GlyphButton>,
      ),
    );
  });

  it('size "md" styles differ from "lg"', () => {
    expect(
      classesOf(
        <GlyphButton aria-label="Sună clinica" size="md">
          {GLYPH}
        </GlyphButton>,
      ),
    ).not.toEqual(
      classesOf(
        <GlyphButton aria-label="Sună clinica" size="lg">
          {GLYPH}
        </GlyphButton>,
      ),
    );
  });
});

describe('GlyphButton — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    render(
      <GlyphButton aria-label="Sună clinica" className="fixed end-5 bottom-5">
        {GLYPH}
      </GlyphButton>,
    );
    const button = screen.getByRole('button');
    // The one thing §6.4/§6.8 let a parent do: position it (the floating CTA).
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('bottom-5');
    // …merged LAST, on top of the atom's own classes, which survive.
    expect(button.className).toContain('rounded-full');
    expect(button.className.trimEnd().endsWith('fixed end-5 bottom-5')).toBe(
      true,
    );
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <GlyphButton aria-label="Sună clinica" ref={ref}>
        {GLYPH}
      </GlyphButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <GlyphButton
        aria-label="Sună clinica"
        data-analytics="call"
        aria-describedby="hint"
      >
        {GLYPH}
      </GlyphButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-analytics', 'call');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('GlyphButton — asChild (same slot contract as Button)', () => {
  // GlyphButtonProps types ref for the <button> branch; in asChild mode it
  // reaches the child element instead — the cast below is the test
  // acknowledging that.
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it('renders ONLY the child element — the <a> IS the circle', () => {
    render(
      <GlyphButton asChild aria-label="Sună clinica" size="lg">
        <a href="tel:+40700000000">{GLYPH}</a>
      </GlyphButton>,
    );
    // The accessible name travels from GlyphButton onto the anchor…
    const link = screen.getByRole('link', { name: 'Sună clinica' });
    expect(link).toHaveAttribute('href', 'tel:+40700000000');
    expect(link.querySelector('svg')).toBeInstanceOf(SVGSVGElement);
    // …and no <button> of its own is left behind.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours the circle's classes onto the child, keeping the child's own", () => {
    render(
      <GlyphButton
        asChild
        variant="outline"
        aria-label="Deschide profilul Instagram"
        className="justify-self-start"
      >
        <a
          href="https://example.com/instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2"
        >
          {GLYPH}
        </a>
      </GlyphButton>,
    );
    const link = screen.getByRole('link', {
      name: 'Deschide profilul Instagram',
    });
    // the child keeps its own class…
    expect(link.className).toContain('col-span-2');
    // …receives the parent-positioning class routed through GlyphButton…
    expect(link.className).toContain('justify-self-start');
    // …wears the circle's clothes, variant included…
    expect(link.className).toContain('rounded-full');
    expect(link.className).toContain('border-cta');
    // …and keeps every attribute of its own untouched.
    expect(link).toHaveAttribute('href', 'https://example.com/instagram');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('the child wins ordinary prop conflicts', () => {
    render(
      <GlyphButton asChild aria-label="Sună clinica">
        <a href="tel:+40700000000" aria-label="Sună recepția">
          {GLYPH}
        </a>
      </GlyphButton>,
    );
    expect(
      screen.getByRole('link', { name: 'Sună recepția' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Sună clinica' }),
    ).not.toBeInTheDocument();
  });

  it("a child aria-label={undefined} does NOT void the owner's label", () => {
    // The ordinary conditional pattern `aria-label={cond ? x : undefined}`
    // leaves the key present but empty. React treats undefined as absent —
    // the slot must too, or the §6.3 type guarantee dies silently at exactly
    // the call sites that look most innocent (G2 a11y finding, 2026-08-05).
    render(
      <GlyphButton asChild aria-label="Sună clinica">
        <a href="tel:+40700000000" aria-label={undefined}>
          {GLYPH}
        </a>
      </GlyphButton>,
    );
    expect(
      screen.getByRole('link', { name: 'Sună clinica' }),
    ).toBeInTheDocument();
  });

  it('forwards ref to the child element (React 19 ref-in-props)', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <GlyphButton asChild aria-label="Sună clinica" ref={asButtonRef(ref)}>
        <a href="tel:+40700000000">{GLYPH}</a>
      </GlyphButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('throws its own actionable, GlyphButton-named message for non-element children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GlyphButton asChild aria-label="Sună clinica">
          doar text
        </GlyphButton>,
      ),
    ).toThrow(
      'GlyphButton with asChild expects exactly one element child (e.g. an <a> or <Link>).',
    );
    expect(() =>
      render(
        <GlyphButton asChild aria-label="Sună clinica">
          <a href="tel:+40700000000">{GLYPH}</a>
          <a href="tel:+40700000001">{GLYPH}</a>
        </GlyphButton>,
      ),
    ).toThrow(/exactly one element child/);
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <GlyphButton asChild aria-label="Sună clinica" disabled formAction="/x">
        <a href="tel:+40700000000">{GLYPH}</a>
      </GlyphButton>,
    );
    const link = screen.getByRole('link', { name: 'Sună clinica' });
    // An anchor has no disabled state and no form association.
    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('formaction');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'GlyphButton: disabled, formAction has no effect with asChild',
      ),
    );
    errorSpy.mockRestore();
  });
});

describe('GlyphButton — one calm color fade (fb-44: Button’s clock)', () => {
  // These run in real Chromium (@vitest/browser-playwright, the "components"
  // project), but the setup imports no stylesheet, so computed styles would
  // read back as browser defaults — the utility tokens ARE the contract here,
  // exactly as in Button.test.tsx.
  // Both axes are parameters now: the motion bans below sweep the WHOLE
  // family — the quiet tone and the square face included — instead of auditing
  // the founding circle only.
  const tokensOf = (
    variant: GlyphButtonVariant = 'solid',
    shape: GlyphButtonShape = 'round',
  ) => {
    const cls = classesOf(
      <GlyphButton aria-label="Sună clinica" variant={variant} shape={shape}>
        {GLYPH}
      </GlyphButton>,
    );
    return { cls, tokens: cls.split(/\s+/).filter(Boolean) };
  };

  it('runs the same 400ms clock as Button — the two atoms must stay in sync', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('[--fade:400ms]');
    expect(tokens).toContain('duration-(--fade)');
    expect(tokens).toContain('ease-in-out');
    expect(tokens).toContain('transition-[background-color,color]');
  });

  it('admits no second clock or easing — in and out stay mirrored', () => {
    const { tokens } = tokensOf();
    expect(
      tokens.filter(
        (t) =>
          /(^|:)duration-/.test(t) &&
          t !== 'duration-(--fade)' &&
          t !== 'active:duration-0',
      ),
    ).toEqual([]);
    expect(
      tokens.filter((t) => /(^|:)ease-/.test(t) && t !== 'ease-in-out'),
    ).toEqual([]);
  });

  it.each(motionCases)(
    'nothing moves and nothing jumps — %s · %s (D2: no scale-105, no shadow pop)',
    (variant, shape) => {
      const { cls, tokens } = tokensOf(variant, shape);
      // The old icon-button grew on hover and swapped shadows — the owner cut
      // BOTH (fb-49/fb-50). Banned by pattern, never as a list of spellings.
      // The burger's morph is no exception: transforms belong to the Header's
      // own SVG child, never to a bundle in here.
      expect(
        tokens.filter((t) =>
          /(^|:)(animate|scale|translate|rotate|skew)-/.test(t),
        ),
      ).toEqual([]);
      expect(tokens.filter((t) => /(^|:)shadow(-|$)/.test(t))).toEqual([]);
      expect(cls).not.toMatch(/transition-transform|transition-all/);
      expect(cls).not.toMatch(/(^|:)(before|after):|::(before|after)/);
    },
  );

  it('fades exactly two properties — never the focus ring', () => {
    const { cls } = tokensOf('outline');
    // transition-colors would cover outline-color too, dragging the ring onto
    // the fade clock; the legitimate transition-[background-color,color] does
    // not collide with any of these patterns.
    expect(cls).not.toMatch(
      /transition-colors|transition-\[color\]|transition-all/,
    );
  });

  it('press feedback snaps, release fades, reduced motion gets snaps (§9)', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('active:duration-0');
    expect(tokens).toContain('motion-reduce:transition-none');
  });

  it('keeps a visible focus ring, never animated away (SC 2.4.7 / 1.4.11)', () => {
    const { cls, tokens } = tokensOf();
    // outline-hidden/-none would sail past axe AND jsx-a11y in silence.
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).toContain('focus-visible:outline-focus');
    expect(tokens).toContain('outline-offset-2');
    expect(cls).not.toMatch(/outline-none|outline-hidden/);
  });

  it.each(Object.keys(requiredTokens) as GlyphButtonVariant[])(
    'variant %s carries its exact AA-checked color pair',
    (variant) => {
      const { tokens } = tokensOf(variant);
      // Positive coverage: the glyph paints with currentColor, so `text-*` is
      // what colors the icon in every state — dropping text-ink-inverse from
      // solid would leave a green-on-green glyph with the suite still green.
      for (const required of requiredTokens[variant]) {
        expect(tokens).toContain(required);
      }
    },
  );

  it('ghost really rests transparent — bg-transparent is its only plain bg', () => {
    // A ground painted at rest would make ghost a second solid: the tray must
    // exist ONLY under hover/active, so the parent's surface shows through and
    // ghost stays usable on any light ground (Button.tsx's standing caveat).
    const { tokens } = tokensOf('ghost');
    expect(tokens.filter((t) => /^bg-/.test(t))).toEqual(['bg-transparent']);
  });

  it('disabled is a state of the box, not of the colors', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('disabled:pointer-events-none');
    expect(tokens).toContain('disabled:opacity-50');
  });
});

describe('GlyphButton — type-level contract', () => {
  it('requires aria-label: an unnamed icon-only control cannot compile (§6.3)', () => {
    // Never rendered: this exists so `tsc --noEmit` fails if the contract
    // loosens. @ts-expect-error is itself an error when the line compiles,
    // so both directions are covered.
    const nameless = (
      // @ts-expect-error — 'aria-label' is required: children are never text
      <GlyphButton>{GLYPH}</GlyphButton>
    );
    expect(nameless).toBeTruthy();
  });
});
