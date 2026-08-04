import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, type ButtonVariant } from './Button';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7).

describe('Button — element & semantics', () => {
  it('renders a real <button> exposing its accessible name', () => {
    render(<Button>Programează o consultație</Button>);
    expect(
      screen.getByRole('button', { name: 'Programează o consultație' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(<Button type="submit">Trimite</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sună acum</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Sună acum' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Sună acum
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună acum' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    render(<Button className="mt-4">Programează o consultație</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('rounded-md');
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Programează o consultație</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <Button data-analytics="cta" aria-describedby="hint">
        Programează o consultație
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-analytics', 'cta');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('Button — variants & sizes are real styling switches', () => {
  it.each([
    ['solid', 'outline'],
    ['solid', 'ghost'],
    ['outline', 'ghost'],
  ] as const)('variant "%s" styles differ from "%s"', (a, b) => {
    const { unmount } = render(<Button variant={a}>Ședință</Button>);
    const classA = screen.getByRole('button').className;
    unmount();
    render(<Button variant={b}>Ședință</Button>);
    expect(screen.getByRole('button').className).not.toEqual(classA);
  });

  it.each([
    ['md', 'lg'],
    ['md', 'xl'],
    ['lg', 'xl'],
  ] as const)('size "%s" styles differ from "%s"', (a, b) => {
    const { unmount } = render(<Button size={a}>Ședință</Button>);
    const classA = screen.getByRole('button').className;
    unmount();
    render(<Button size={b}>Ședință</Button>);
    expect(screen.getByRole('button').className).not.toEqual(classA);
  });
});

describe('Button — content is a slot (§6.2)', () => {
  it('renders partly-bold children and exposes the full accessible name', () => {
    render(
      <Button variant="outline">
        Soluționarea <strong>online</strong> a litigiilor
      </Button>,
    );
    expect(
      screen.getByRole('button', { name: 'Soluționarea online a litigiilor' }),
    ).toBeInTheDocument();
  });
});

describe('Button — asChild (approved option A)', () => {
  it('renders ONLY the child element — no <button> exists in the DOM', () => {
    render(
      <Button asChild>
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    expect(
      screen.getByRole('link', { name: 'Vezi serviciile' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours the button's styling classes onto the child, keeping the child's own", () => {
    render(
      <Button asChild variant="outline" className="justify-self-start">
        <a href="#servicii" className="col-span-2">
          Vezi serviciile
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Vezi serviciile' });
    // the child keeps its own class…
    expect(link.className).toContain('col-span-2');
    // …receives the parent-positioning class routed through Button…
    expect(link.className).toContain('justify-self-start');
    // …and wears Button's clothes (shared base class as the marker).
    expect(link.className).toContain('rounded-md');
  });

  it("leaves the child's own attributes untouched", () => {
    render(
      <Button asChild>
        <a
          href="https://anpc.ro/ce-este-sal/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Soluționarea alternativă a litigiilor
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', {
      name: 'Soluționarea alternativă a litigiilor',
    });
    expect(link).toHaveAttribute('href', 'https://anpc.ro/ce-este-sal/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('Button — asChild guards & merge rules', () => {
  // ButtonProps types ref for the <button> branch; in asChild mode it reaches
  // the child element instead — the cast below is the test acknowledging that.
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it("forwards Button's ref to the child element (React 19 ref-in-props)", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button asChild ref={asButtonRef(ref)}>
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("the child's own ref wins over Button's (children win conflicts)", () => {
    const childRef = createRef<HTMLAnchorElement>();
    const buttonRef = createRef<HTMLAnchorElement>();
    render(
      <Button asChild ref={asButtonRef(buttonRef)}>
        <a href="#servicii" ref={childRef}>
          Vezi serviciile
        </a>
      </Button>,
    );
    expect(childRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(buttonRef.current).toBeNull();
  });

  it('throws its own actionable message for non-element children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Button asChild>doar text</Button>)).toThrow(
      /exactly one element child/,
    );
    expect(() =>
      render(
        <Button asChild>
          <span>unu</span>
          <span>doi</span>
        </Button>,
      ),
    ).toThrow(/exactly one element child/);
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Button asChild disabled formAction="/x">
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Vezi serviciile' });
    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('formaction');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no effect with asChild'),
    );
    errorSpy.mockRestore();
  });

  it('the child wins ordinary prop conflicts', () => {
    render(
      <Button asChild aria-label="de la Button">
        <a href="#servicii" aria-label="de la copil">
          Vezi serviciile
        </a>
      </Button>,
    );
    expect(
      screen.getByRole('link', { name: 'de la copil' }),
    ).toBeInTheDocument();
  });
});

describe('Button — one calm color fade (owner decision 2026-08-04)', () => {
  // These run in real Chromium (@vitest/browser-playwright, the "components"
  // project), but the setup imports no stylesheet, so computed styles would
  // read back as browser defaults — the utility tokens ARE the contract here.
  // Plan button-hover-fade.plan.md replaced the v1 center-out sweep with a
  // single crossfade: the owner read sweep + color change as "2 animations at
  // once". The bans below ARE the deliverable, and every one of them was
  // proven bypassable in review before it was tightened — a fully working
  // sweep re-added on ::after, a rogue transform, an asymmetric
  // hover:duration. They are therefore pattern-based, never a blocklist of
  // exact spellings.
  // Where an exact spelling IS the requirement, tokens are matched whole,
  // never as substrings: every rest-state token is contained in its own
  // variant-prefixed form — 'bg-cta' sits inside 'hover:bg-cta',
  // 'duration-0' inside 'active:duration-0'.
  const tokensOf = (variant: ButtonVariant = 'solid') => {
    const { unmount } = render(<Button variant={variant}>Ședință</Button>);
    const cls = screen.getByRole('button').className;
    unmount();
    return { cls, tokens: cls.split(/\s+/).filter(Boolean) };
  };

  it('runs one calm shared fade clock, symmetric in and out', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('[--fade:400ms]');
    expect(tokens).toContain('duration-(--fade)');
    expect(tokens).toContain('ease-in-out');
    expect(tokens).toContain('transition-[background-color,color]');
  });

  it('admits no second clock or easing — in and out stay mirrored', () => {
    const { tokens } = tokensOf();
    // A single hover:duration-1000 or hover:ease-linear would desynchronise
    // the two directions, which is precisely what "calm" rules out.
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

  it('the sweep is gone — one animation only', () => {
    const { cls, tokens } = tokensOf();
    // Pseudo-elements are banned by PATTERN: a working sweep was re-added on
    // ::after, and again as [&::before]:…, straight past a before:-only ban.
    expect(cls).not.toMatch(/(^|:)(before|after):/);
    expect(cls).not.toMatch(/::(before|after)/);
    expect(tokens.filter((t) => /(^|:)(before|after):/.test(t))).toEqual([]);
    // …and nothing may move, spin, pulse or scale: color is the ONE animation.
    expect(cls).not.toMatch(/transition-transform|transition-all/);
    expect(
      tokens.filter((t) =>
        /(^|:)(animate|scale|translate|rotate|skew)-/.test(t),
      ),
    ).toEqual([]);
    expect(tokens).not.toContain('overflow-hidden');
    expect(tokens).not.toContain('isolate');
    expect(tokens.filter((t) => t.startsWith('will-change'))).toEqual([]);
    expect(tokens.filter((t) => t.includes('--sweep'))).toEqual([]);
    // No hand-written hover-capability gate — Tailwind already wraps every
    // hover: utility in @media (hover:hover) on its own.
    expect(tokens.filter((t) => t.startsWith('motion-safe:'))).toEqual([]);
  });

  it('press feedback snaps, release fades', () => {
    expect(tokensOf().tokens).toContain('active:duration-0');
  });

  it('reduced motion gets snaps, not fades', () => {
    expect(tokensOf().tokens).toContain('motion-reduce:transition-none');
  });

  it('keeps a visible focus ring, never animated away (SC 2.4.7 / 1.4.11)', () => {
    const { cls, tokens } = tokensOf();
    // outline-hidden/-none would sail past axe AND jsx-a11y in silence: this
    // is the only guard the ring has anywhere in the repo.
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).toContain('focus-visible:outline-focus');
    expect(tokens).toContain('outline-offset-2');
    expect(cls).not.toMatch(/outline-none|outline-hidden/);
  });

  // Record<ButtonVariant, …> on purpose: a fourth variant cannot ship with
  // zero coverage — the file stops typechecking until it is classified here.
  const requiredTokens: Record<ButtonVariant, string[]> = {
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
    ghost: [
      'bg-transparent',
      'text-ink',
      'hover:bg-line-subtle',
      'active:bg-line-subtle',
    ],
  };

  it.each(Object.keys(requiredTokens) as ButtonVariant[])(
    'variant %s carries its exact AA-checked color pair',
    (variant) => {
      const { tokens } = tokensOf(variant);
      // Positive coverage: without it, dropping text-ink-inverse from solid
      // leaves the label inheriting --ink on #008854 (3.28:1, SC 1.4.3 fail)
      // with the whole suite still green.
      for (const required of requiredTokens[variant]) {
        expect(tokens).toContain(required);
      }
    },
  );

  // Which variants hold their label color constant. outline is the one
  // deliberate crossfade (owner decision — see the invariant in Button.tsx).
  const constantTextVariants: Record<ButtonVariant, boolean> = {
    solid: true,
    outline: false,
    ghost: true,
  };

  it.each(
    (Object.keys(constantTextVariants) as ButtonVariant[]).filter(
      (variant) => constantTextVariants[variant],
    ),
  )('variant %s never changes text color', (variant) => {
    const { tokens } = tokensOf(variant);
    // Only the ground fades, so every frame of the lerp keeps the label over
    // an AA-passing pair. Arbitrary properties bypass the text- prefix, hence
    // the third ban.
    expect(tokens.filter((t) => t.startsWith('hover:text-'))).toEqual([]);
    expect(tokens.filter((t) => t.startsWith('active:text-'))).toEqual([]);
    expect(tokens.filter((t) => /(^|:)\[color:/.test(t))).toEqual([]);
  });

  it('outline crossfades both colors with no rogue lerp utilities', () => {
    const { cls } = tokensOf('outline');
    // Its positive tokens live in the requiredTokens table above. The broad
    // utilities stay banned even though text DOES fade here: they also cover
    // outline-color, dragging the focus ring onto the clock. None of them
    // collides with the legitimate transition-[background-color,color].
    expect(cls).not.toMatch(
      /transition-colors|transition-\[color\]|transition-all/,
    );
  });
});
