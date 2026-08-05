import { createRef, type ReactElement, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  RoundButton,
  type RoundButtonSize,
  type RoundButtonVariant,
} from './RoundButton';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7).
//
// This file deliberately does NOT import ui/Icon. RoundButton.tsx doesn't
// either — its slot takes ANY inline SVG, so the unit proof uses a raw one:
// a glyph-registry edit can then never mask (or fake) a RoundButton
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

describe('RoundButton — element & semantics', () => {
  it('renders a real <button> exposing the aria-label as its accessible name', () => {
    render(<RoundButton aria-label="Sună clinica">{GLYPH}</RoundButton>);
    expect(
      screen.getByRole('button', { name: 'Sună clinica' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<RoundButton aria-label="Sună clinica">{GLYPH}</RoundButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(
      <RoundButton aria-label="Trimite formularul" type="submit">
        {GLYPH}
      </RoundButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(
      <RoundButton aria-label="Sună clinica" onClick={onClick}>
        {GLYPH}
      </RoundButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună clinica' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <RoundButton aria-label="Sună clinica" disabled onClick={onClick}>
        {GLYPH}
      </RoundButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună clinica' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('RoundButton — the icon slot (§6.2) and its geometry', () => {
  it('renders the svg child inside the control and sizes it from the root', () => {
    render(<RoundButton aria-label="Sună clinica">{GLYPH}</RoundButton>);
    const button = screen.getByRole('button', { name: 'Sună clinica' });
    // The glyph is the content, not a prop — any inline <svg> is legal.
    expect(button.querySelector('svg')).toBeInstanceOf(SVGSVGElement);
    // …and the CIRCLE owns its geometry: the descendant utility scores
    // specificity (0,1,1) against Icon's own preset class (0,1,0), so call
    // sites may drop <Icon name="…"/> in with or without a size prop.
    expect(button.className).toContain('[&_svg]:size-5');
  });

  // Record<RoundButtonSize, …> for the same reason as the variant table
  // further down: a future size cannot ship with zero token coverage — this
  // file stops typechecking until it is classified here.
  const sizeTokens: Record<RoundButtonSize, string[]> = {
    md: ['size-11', '[&_svg]:size-5'], // 2.75rem / 44px — §9 touch target
    lg: ['size-14', '[&_svg]:size-7'], // 3.5rem / 56px — primary CTA scale
  };

  it.each(Object.keys(sizeTokens) as RoundButtonSize[])(
    'size %s scales circle and glyph together, in rem (§7)',
    (size) => {
      const cls = classesOf(
        <RoundButton aria-label="Sună clinica" size={size}>
          {GLYPH}
        </RoundButton>,
      );
      for (const token of sizeTokens[size]) {
        expect(cls).toContain(token);
      }
    },
  );

  it('is a perfect circle that never shrinks in a flex row', () => {
    const cls = classesOf(
      <RoundButton aria-label="Sună clinica">{GLYPH}</RoundButton>,
    );
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('shrink-0');
  });
});

describe('RoundButton — variants & sizes are real styling switches', () => {
  it('defaults to solid · md', () => {
    const fallback = classesOf(
      <RoundButton aria-label="Sună clinica">{GLYPH}</RoundButton>,
    );
    expect(fallback).toEqual(
      classesOf(
        <RoundButton aria-label="Sună clinica" variant="solid" size="md">
          {GLYPH}
        </RoundButton>,
      ),
    );
  });

  it('variant "solid" styles differ from "outline"', () => {
    expect(
      classesOf(
        <RoundButton aria-label="Sună clinica" variant="solid">
          {GLYPH}
        </RoundButton>,
      ),
    ).not.toEqual(
      classesOf(
        <RoundButton aria-label="Sună clinica" variant="outline">
          {GLYPH}
        </RoundButton>,
      ),
    );
  });

  it('size "md" styles differ from "lg"', () => {
    expect(
      classesOf(
        <RoundButton aria-label="Sună clinica" size="md">
          {GLYPH}
        </RoundButton>,
      ),
    ).not.toEqual(
      classesOf(
        <RoundButton aria-label="Sună clinica" size="lg">
          {GLYPH}
        </RoundButton>,
      ),
    );
  });
});

describe('RoundButton — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    render(
      <RoundButton aria-label="Sună clinica" className="fixed end-5 bottom-5">
        {GLYPH}
      </RoundButton>,
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
      <RoundButton aria-label="Sună clinica" ref={ref}>
        {GLYPH}
      </RoundButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <RoundButton
        aria-label="Sună clinica"
        data-analytics="call"
        aria-describedby="hint"
      >
        {GLYPH}
      </RoundButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-analytics', 'call');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('RoundButton — asChild (same slot contract as Button)', () => {
  // RoundButtonProps types ref for the <button> branch; in asChild mode it
  // reaches the child element instead — the cast below is the test
  // acknowledging that.
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it('renders ONLY the child element — the <a> IS the circle', () => {
    render(
      <RoundButton asChild aria-label="Sună clinica" size="lg">
        <a href="tel:+40700000000">{GLYPH}</a>
      </RoundButton>,
    );
    // The accessible name travels from RoundButton onto the anchor…
    const link = screen.getByRole('link', { name: 'Sună clinica' });
    expect(link).toHaveAttribute('href', 'tel:+40700000000');
    expect(link.querySelector('svg')).toBeInstanceOf(SVGSVGElement);
    // …and no <button> of its own is left behind.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours the circle's classes onto the child, keeping the child's own", () => {
    render(
      <RoundButton
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
      </RoundButton>,
    );
    const link = screen.getByRole('link', {
      name: 'Deschide profilul Instagram',
    });
    // the child keeps its own class…
    expect(link.className).toContain('col-span-2');
    // …receives the parent-positioning class routed through RoundButton…
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
      <RoundButton asChild aria-label="Sună clinica">
        <a href="tel:+40700000000" aria-label="Sună recepția">
          {GLYPH}
        </a>
      </RoundButton>,
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
      <RoundButton asChild aria-label="Sună clinica">
        <a href="tel:+40700000000" aria-label={undefined}>
          {GLYPH}
        </a>
      </RoundButton>,
    );
    expect(
      screen.getByRole('link', { name: 'Sună clinica' }),
    ).toBeInTheDocument();
  });

  it('forwards ref to the child element (React 19 ref-in-props)', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <RoundButton asChild aria-label="Sună clinica" ref={asButtonRef(ref)}>
        <a href="tel:+40700000000">{GLYPH}</a>
      </RoundButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('throws its own actionable, RoundButton-named message for non-element children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <RoundButton asChild aria-label="Sună clinica">
          doar text
        </RoundButton>,
      ),
    ).toThrow(
      'RoundButton with asChild expects exactly one element child (e.g. an <a> or <Link>).',
    );
    expect(() =>
      render(
        <RoundButton asChild aria-label="Sună clinica">
          <a href="tel:+40700000000">{GLYPH}</a>
          <a href="tel:+40700000001">{GLYPH}</a>
        </RoundButton>,
      ),
    ).toThrow(/exactly one element child/);
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RoundButton asChild aria-label="Sună clinica" disabled formAction="/x">
        <a href="tel:+40700000000">{GLYPH}</a>
      </RoundButton>,
    );
    const link = screen.getByRole('link', { name: 'Sună clinica' });
    // An anchor has no disabled state and no form association.
    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('formaction');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'RoundButton: disabled, formAction has no effect with asChild',
      ),
    );
    errorSpy.mockRestore();
  });
});

describe('RoundButton — one calm color fade (fb-44: Button’s clock)', () => {
  // These run in real Chromium (@vitest/browser-playwright, the "components"
  // project), but the setup imports no stylesheet, so computed styles would
  // read back as browser defaults — the utility tokens ARE the contract here,
  // exactly as in Button.test.tsx.
  const tokensOf = (variant: RoundButtonVariant = 'solid') => {
    const cls = classesOf(
      <RoundButton aria-label="Sună clinica" variant={variant}>
        {GLYPH}
      </RoundButton>,
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

  it('nothing moves and nothing jumps (D2: no scale-105, no shadow pop)', () => {
    const { cls, tokens } = tokensOf();
    // The old icon-button grew on hover and swapped shadows — the owner cut
    // BOTH (fb-49/fb-50). Banned by pattern, never as a list of spellings.
    expect(
      tokens.filter((t) =>
        /(^|:)(animate|scale|translate|rotate|skew)-/.test(t),
      ),
    ).toEqual([]);
    expect(tokens.filter((t) => /(^|:)shadow(-|$)/.test(t))).toEqual([]);
    expect(cls).not.toMatch(/transition-transform|transition-all/);
    expect(cls).not.toMatch(/(^|:)(before|after):|::(before|after)/);
  });

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

  // Record<RoundButtonVariant, …> on purpose: a third variant cannot ship with
  // zero coverage — the file stops typechecking until it is classified here.
  const requiredTokens: Record<RoundButtonVariant, string[]> = {
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
  };

  it.each(Object.keys(requiredTokens) as RoundButtonVariant[])(
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

  it('disabled is a state of the box, not of the colors', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('disabled:pointer-events-none');
    expect(tokens).toContain('disabled:opacity-50');
  });
});

describe('RoundButton — type-level contract', () => {
  it('requires aria-label: an unnamed icon-only control cannot compile (§6.3)', () => {
    // Never rendered: this exists so `tsc --noEmit` fails if the contract
    // loosens. @ts-expect-error is itself an error when the line compiles,
    // so both directions are covered.
    const nameless = (
      // @ts-expect-error — 'aria-label' is required: children are never text
      <RoundButton>{GLYPH}</RoundButton>
    );
    expect(nameless).toBeTruthy();
  });
});
