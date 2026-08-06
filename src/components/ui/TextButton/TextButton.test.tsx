import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextButton } from './TextButton';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7) — the very
// nav labels the Header will pass: „Acasă" „Servicii" „Echipa".

describe('TextButton — element & semantics', () => {
  it('renders a real <button> exposing its accessible name', () => {
    render(<TextButton>Servicii</TextButton>);
    expect(
      screen.getByRole('button', { name: 'Servicii' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so a nav item never submits a form', () => {
    render(<TextButton>Servicii</TextButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(<TextButton type="submit">Trimite</TextButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick — the atom itself owns no navigation', async () => {
    // The absorbed old pattern hijacked clicks (preventDefault + a JS router).
    // Here a click is just a click: real navigation arrives as a child <Link>
    // through asChild, never as behaviour baked into the atom.
    const onClick = vi.fn();
    render(<TextButton onClick={onClick}>Echipa</TextButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Echipa' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('a disabled button truly leaves the tab order (native disabled, not aria)', () => {
    // Guards the §9 exemption evidence: opacity-50 is only contrast-exempt
    // while the control is genuinely inoperable — a refactor to aria-disabled
    // styling that stays focusable must land on a red test (G2 a11y F3).
    render(<TextButton disabled>Servicii</TextButton>);
    expect(screen.getByRole('button', { name: 'Servicii' })).toBeDisabled();
  });

  it('renders partly-bold children and exposes the full accessible name', () => {
    render(
      <TextButton>
        Programări <strong>online</strong>
      </TextButton>,
    );
    expect(
      screen.getByRole('button', { name: 'Programări online' }),
    ).toBeInTheDocument();
  });
});

describe('TextButton — active = the current page', () => {
  it('exposes aria-current="page" when active', () => {
    render(<TextButton active>Acasă</TextButton>);
    expect(screen.getByRole('button', { name: 'Acasă' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('carries no aria-current when not active', () => {
    render(<TextButton>Servicii</TextButton>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('lets a caller-supplied aria-current win (§6.8 native-prop fidelity)', () => {
    render(
      <TextButton active aria-current="step">
        Pasul 2
      </TextButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'step');
  });

  it('never leaks its own props onto the DOM element', () => {
    render(<TextButton active>Acasă</TextButton>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('active');
    expect(button).not.toHaveAttribute('aschild');
  });
});

describe('TextButton — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    render(<TextButton className="justify-self-start">Servicii</TextButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('justify-self-start');
    expect(button.className).toContain('relative');
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<TextButton ref={ref}>Servicii</TextButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <TextButton data-nav-key="services" aria-describedby="hint">
        Servicii
      </TextButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-nav-key', 'services');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('TextButton — asChild (shared ui/slot engine)', () => {
  it('renders ONLY the child element — no <button> exists in the DOM', () => {
    render(
      <TextButton asChild>
        <a href="#servicii">Servicii</a>
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: 'Servicii' });
    expect(link).toHaveAttribute('href', '#servicii');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours its styling onto the child, keeping the child's own classes", () => {
    render(
      <TextButton asChild className="justify-self-start">
        <a href="#servicii" className="col-span-2">
          Servicii
        </a>
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: 'Servicii' });
    // the child keeps its own class…
    expect(link.className).toContain('col-span-2');
    // …receives the parent-positioning class routed through TextButton…
    expect(link.className).toContain('justify-self-start');
    // …and wears TextButton's clothes, underline pseudo-element included —
    // with asChild there is no wrapper element, which is exactly why the
    // underline is a pseudo-element and not a nested <span>.
    expect(link.className).toContain('after:bg-cta-hover');
  });

  it('rides the computed aria-current through to the child anchor', () => {
    render(
      <TextButton asChild active>
        <a href="#acasa">Acasă</a>
      </TextButton>,
    );
    expect(screen.getByRole('link', { name: 'Acasă' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it("the child's own aria-current wins (children win conflicts)", () => {
    render(
      <TextButton asChild active>
        <a href="#acasa" aria-current="location">
          Acasă
        </a>
      </TextButton>,
    );
    expect(screen.getByRole('link', { name: 'Acasă' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('never leaks its own props onto the child element', () => {
    render(
      <TextButton asChild active>
        <a href="#acasa">Acasă</a>
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: 'Acasă' });
    expect(link).not.toHaveAttribute('active');
    expect(link).not.toHaveAttribute('aschild');
  });

  // TextButtonProps types ref for the <button> branch; in asChild mode it
  // reaches the child element instead — the cast below is the test
  // acknowledging that (same shape as Button's).
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it('forwards its ref to the child element (React 19 ref-in-props)', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <TextButton asChild ref={asButtonRef(ref)}>
        <a href="#servicii">Servicii</a>
      </TextButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('throws its own actionable, TextButton-named message for bad children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TextButton asChild>doar text</TextButton>)).toThrow(
      /TextButton with asChild expects exactly one element child/,
    );
    expect(() =>
      render(
        <TextButton asChild>
          <a href="#unu">unu</a>
          <a href="#doi">doi</a>
        </TextButton>,
      ),
    ).toThrow(/TextButton with asChild expects exactly one element child/);
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <TextButton asChild disabled>
        <a href="#servicii">Servicii</a>
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: 'Servicii' });
    expect(link).not.toHaveAttribute('disabled');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no effect with asChild'),
    );
    errorSpy.mockRestore();
  });
});

describe('TextButton — the D5 motion exception (owner-approved)', () => {
  // These run in real Chromium (@vitest/browser-playwright, the "components"
  // project), but the setup imports no stylesheet, so computed styles would
  // read back as browser defaults — the utility tokens ARE the contract here
  // (same reasoning as Button.test.tsx).
  // TextButton is the ONE atom that does not run on the system's shared 400ms
  // --fade clock and the ONE atom that moves something. The assertions below
  // pin that exception in both directions: the right two clocks present, and
  // the system clock absent — a well-meant "harmonise the atoms" edit has to
  // walk past a red test, not slip through review.
  const tokensOf = (props: { active?: boolean } = {}) => {
    const { unmount } = render(<TextButton {...props}>Servicii</TextButton>);
    const cls = screen.getByRole('button').className;
    unmount();
    return { cls, tokens: cls.split(/\s+/).filter(Boolean) };
  };

  it('fades the label on its own 200ms ease-out clock', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('text-ink');
    expect(tokens).toContain('transition-[color]');
    expect(tokens).toContain('duration-200');
    expect(tokens).toContain('ease-out');
    // cta-hover (#006b42), not cta (#008854): the hover END state is one a
    // user can hold, so it owes SC 1.4.3 the full 4.5:1 — and cta measures
    // 4.29:1 on --page (#faf9f7). See the invariant block in TextButton.tsx.
    expect(tokens).toContain('hover:text-cta-hover');
  });

  it('is NOT harmonised to the system --fade clock (Button/RoundButton)', () => {
    const { tokens } = tokensOf();
    expect(tokens.filter((t) => t.includes('--fade'))).toEqual([]);
    expect(tokens).not.toContain('ease-in-out');
    // transition-colors would also cover outline-color, dragging the focus
    // ring onto the clock; the property list is exactly `color`.
    expect(tokens).not.toContain('transition-colors');
    expect(tokens).not.toContain('transition-all');
  });

  it('draws the underline as a pseudo-element, not a wrapper', () => {
    // asChild leaves no element of TextButton's own in the DOM, so the
    // underline can only be pure classes on the control itself.
    const { tokens } = tokensOf();
    expect(tokens).toContain('relative');
    expect(tokens).toContain('after:absolute');
    expect(tokens).toContain('after:inset-x-0');
    expect(tokens).toContain('after:bottom-0');
    expect(tokens).toContain('after:h-0.5');
    expect(tokens).toContain('after:bg-cta-hover');
    expect(tokens).toContain("after:content-['']");
  });

  it('sweeps that underline in from the left on its own 300ms ease-out clock', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('after:origin-left');
    expect(tokens).toContain('after:scale-x-0');
    expect(tokens).toContain('hover:after:scale-x-100');
    expect(tokens).toContain('after:transition-transform');
    expect(tokens).toContain('after:duration-300');
    expect(tokens).toContain('after:ease-out');
  });

  it('never animates the active state in — the current page starts underlined AND green', () => {
    // State is never animation-conveyed (§9): active is a static full-width
    // rule that is already there on first paint, in reduced motion too — and
    // the label wears the underline's own green at rest, the old top bar's
    // one-accent pattern (owner, canvas loop 2026-08-06). cta-hover, never
    // cta: a rest-state label owes SC 1.4.3 the full 4.5:1.
    const { tokens } = tokensOf({ active: true });
    expect(tokens).toContain('after:scale-x-100');
    expect(tokens).not.toContain('after:scale-x-0');
    expect(tokens).toContain('text-cta-hover');
    expect(tokens).not.toContain('text-ink');
  });

  it('disables BOTH transitions under prefers-reduced-motion', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('motion-reduce:transition-none');
    expect(tokens).toContain('motion-reduce:after:transition-none');
    // …and every state stays fully legible without them: the colors and the
    // active underline are discrete values, only their easing is removed.
    expect(tokens).toContain('hover:text-cta-hover');
    expect(tokensOf({ active: true }).tokens).toContain('after:scale-x-100');
  });

  it('keeps a visible focus ring, never animated or styled away (SC 2.4.7)', () => {
    const { cls, tokens } = tokensOf();
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).toContain('focus-visible:outline-focus');
    expect(tokens).toContain('outline-offset-2');
    expect(cls).not.toMatch(/outline-none|outline-hidden/);
  });

  it('owns no outer margin (§6.4) and no fixed width (§8.4)', () => {
    const { tokens } = tokensOf();
    // DE runs +30–35% longer than RO: a width here would clip or overflow.
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^(w|min-w|max-w)-/.test(t))).toEqual([]);
    // …while the hit area still clears the §9 target floor by construction.
    expect(tokens).toContain('min-h-11');
  });
});
