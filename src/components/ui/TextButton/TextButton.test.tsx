import {
  createRef,
  useId,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline, for what
// a class name cannot show — THE TONE's and THE HOVER AREA's paint below: the
// label's computed colour and the underline's computed scale, at rest and
// under a real pointer, and the rules the hover area compiles to (the house
// pattern: Card, Modal, SpeedDial and PillButton load it per file;
// tests/setup/components.ts loads no CSS globally).
import '@/styles/globals.css';
import {
  TEXT_BUTTON_HOVER_AREA,
  TextButton,
  type TextButtonHoverArea,
  type TextButtonTone,
} from './TextButton';
// TYPE-ONLY, erased at run time: the stories' controls, so the union pins
// below can hold their `options` lists to the atom's unions.
import type textButtonStories from './TextButton.stories';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7) — the very
// nav labels the Header will pass: „Acasă" „Servicii" „Echipa" — and the blog
// card's „Citește mai mult…".

/** Paint is read AT REST and at the END of a hover: the label rides a 200ms
 *  clock and the underline a 300ms one, so a read right after a state change
 *  would land mid-fade. An unlayered rule outranks every utility (the house's
 *  tests-with-real-CSS recipe) — and it names `::after`, because `*` matches
 *  no pseudo-element and the underline IS one. */
let still: HTMLStyleElement;
beforeAll(() => {
  still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; }';
  document.head.append(still);
});
afterAll(() => still.remove());

const TONES = ['ink', 'accent'] as const satisfies readonly TextButtonTone[];

/** The class string every menu button wore before either axis existed
 *  (develop 517f2ac), pinned WHOLE: `tone` and `hoverArea` must cost the
 *  Header, the Footer and the price menu nothing — not a token, not their
 *  order. */
const MENU_BUTTON_CLASSES =
  'relative inline-flex min-h-11 items-center justify-center rounded-soft ' +
  'px-2 py-2 text-lg font-medium hyphens-none ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'transition-[color] duration-200 ease-out hover:text-accent ' +
  'motion-reduce:transition-none ' +
  'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 ' +
  "after:h-0.5 after:origin-left after:bg-accent after:content-[''] " +
  'after:transition-transform after:duration-300 after:ease-out ' +
  'hover:after:scale-x-100 motion-reduce:after:transition-none ' +
  'text-ink after:scale-x-0';

/** The class string a render puts on its root — the <button>, or the child an
 *  asChild render clones. */
const classOf = (ui: ReactElement): string => {
  const { container, unmount } = render(ui);
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) throw new Error('nothing rendered');
  const cls = root.className;
  unmount();
  return cls;
};

/** A semantic token's colour as the ENGINE resolves it — read off a probe
 *  that paints with the variable itself, never parsed or retyped here
 *  (PillButton.test.tsx's `accentToken()`). An undeclared name throws: a
 *  probe painted with a missing variable would answer an inherited colour. */
const tokenColour = (name: string): string => {
  if (
    !getComputedStyle(document.documentElement)
      .getPropertyValue(`--${name}`)
      .trim()
  ) {
    throw new Error(`--${name} is not declared`);
  }
  const probe = document.createElement('span');
  probe.style.color = `var(--${name})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};

/** WCAG 2.2's contrast ratio of two computed `rgb(r, g, b)` colours, from
 *  their relative luminance — the census's arithmetic, run on what the
 *  engine resolved. */
const contrastOf = (a: string, b: string): number => {
  const luminance = (colour: string): number => {
    const [r, g, bl] = (colour.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map((channel) => {
        const value = Number(channel) / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

/** How much of its width the underline draws — its `::after`'s horizontal
 *  scale. Tailwind compiles the scale-x utilities onto the individual `scale`
 *  property, never `transform`: Chromium reads back "0 1" swept away and "1"
 *  drawn (measured), so the first value is the answer and `none` is 1. */
const underlineScaleX = (element: Element): number => {
  const scale = getComputedStyle(element, '::after').scale;
  if (scale === 'none') return 1;
  const x = scale.split(/\s+/)[0];
  return x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x);
};

/** THE POINTER, PARKED away from every control before a rest value is read —
 *  a resting pointer is :hover (the house's park-the-pointer rule,
 *  PillButton.test.tsx's helper). A REAL pointer (vitest/browser's userEvent):
 *  a synthetic event cannot move :hover. Returns the clean-up. */
const parkPointer = async (): Promise<() => void> => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  return () => parking.remove();
};

/** THE REAL POINTER onto `element` for a hover read — THE PREMISE before it,
 *  :hover after it. Every hover END value this atom paints compiles under
 *  `@media (hover: hover)`, so in a tab that reports no hovering, fine pointer
 *  the real pointer still moves :hover while every rule it should light stays
 *  dead: a hover read takes the REST state, a "stays at rest" read passes for
 *  nothing. CI met exactly that (run 38735369242, 2026-10-15 — the area
 *  :hover, the colour still ink): an earlier file in the same tab had turned
 *  CDP touch emulation on and off, and on a Linux runner Chromium then
 *  restores the platform's pointer types — none, on a VM with no input
 *  device — over Playwright's launch-time mouse, for every later file in the
 *  tab (DoctorShowcase.test.tsx's THE GATES test met it on 2026-10-01). So a
 *  red read here is a red rule, never a dead tab or a missed pointer. */
const realHover = async (element: Element): Promise<void> => {
  const hovers = matchMedia('(hover: hover)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  expect(
    hovers && fine,
    `THE PREMISE: this tab reports (hover: hover) ${hovers}, (pointer: fine) ` +
      `${fine} — an earlier file left it with a coarse or no pointer (CDP ` +
      'touch emulation turned on and off?), so every hover rule is dead and ' +
      'hover cannot be tested here',
  ).toBe(true);
  await realUser.hover(element);
  expect(element.matches(':hover'), 'the real pointer reached it').toBe(true);
};

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
    // Here a click is just a click: real navigation arrives as a child
    // <a href> through asChild, never as behaviour baked into the atom.
    const onClick = vi.fn();
    render(<TextButton onClick={onClick}>Echipa</TextButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Echipa' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('a disabled button truly leaves the tab order (native disabled, not aria)', () => {
    // Guards the §9 exemption evidence: disabled:opacity-50 is only
    // contrast-exempt while the control is genuinely inoperable — a refactor
    // to aria-disabled styling that stays focusable must land on a red test
    // (G2 a11y F3).
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
    render(
      <TextButton active tone="accent" hoverArea="area">
        Acasă
      </TextButton>,
    );
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('active');
    expect(button).not.toHaveAttribute('tone');
    expect(button).not.toHaveAttribute('hoverarea');
    expect(button).not.toHaveAttribute('aschild');
  });
});

describe('TextButton — THE HELD LOOK: the hover look held while its section is open (owner, 2026-10-16)', () => {
  it('is the active row without aria-current — the lavender label and the full rule, nothing announced', () => {
    expect(classOf(<TextButton held>Servicii</TextButton>)).toBe(
      classOf(<TextButton active>Servicii</TextButton>),
    );
    render(<TextButton held>Servicii</TextButton>);
    expect(
      screen.getByRole('button', { name: 'Servicii' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('omitted or false, it is the menu buttons’ string, byte for byte', () => {
    expect(classOf(<TextButton>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    expect(classOf(<TextButton held={false}>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
  });

  it('with active, it is active — aria-current="page" and one string', () => {
    expect(
      classOf(
        <TextButton active held>
          Acasă
        </TextButton>,
      ),
    ).toBe(classOf(<TextButton active>Acasă</TextButton>));
    render(
      <TextButton active held>
        Acasă
      </TextButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page');
  });

  it('wears the active row in either tone — the tone is a REST ink, and held is no rest', () => {
    for (const tone of TONES) {
      const held = classOf(
        <TextButton held tone={tone}>
          Servicii
        </TextButton>,
      );
      expect(held).toBe(
        classOf(
          <TextButton active tone={tone}>
            Servicii
          </TextButton>,
        ),
      );
      expect(held.split(/\s+/)).toContain('text-accent');
    }
  });

  it('keeps both clocks unconditional, so a switch at run time plays the hover’s sweep in and out — and the reduced-motion resets make it instant', () => {
    const tokens = classOf(<TextButton held>Servicii</TextButton>).split(/\s+/);
    expect(tokens).toEqual(
      expect.arrayContaining([
        'transition-[color]',
        'duration-200',
        'ease-out',
        'after:transition-transform',
        'after:duration-300',
        'after:ease-out',
        'motion-reduce:transition-none',
        'motion-reduce:after:transition-none',
      ]),
    );
  });

  it('never reaches the DOM — on the <button>, or on the child an asChild render clones — and adds no ARIA of its own', () => {
    render(
      <>
        <TextButton held>Servicii</TextButton>
        <TextButton held asChild>
          <a href="/ro/team/">Echipa</a>
        </TextButton>
      </>,
    );
    for (const element of [
      screen.getByRole('button', { name: 'Servicii' }),
      screen.getByRole('link', { name: 'Echipa' }),
    ]) {
      expect(element).not.toHaveAttribute('held');
      expect(element).not.toHaveAttribute('aria-current');
      expect(element).not.toHaveAttribute('aria-expanded');
      expect(element).not.toHaveAttribute('aria-pressed');
    }
  });

  it('paints it: the --accent label and the full rule while held, the ink and no rule once released — the pointer parked away', async () => {
    const unpark = await parkPointer();
    try {
      const { rerender } = render(<TextButton held>Servicii</TextButton>);
      const button = screen.getByRole('button', { name: 'Servicii' });
      expect(getComputedStyle(button).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(button)).toBe(1);

      rerender(<TextButton>Servicii</TextButton>);
      expect(getComputedStyle(button).color).toBe(tokenColour('ink'));
      expect(underlineScaleX(button)).toBe(0);

      rerender(<TextButton held>Servicii</TextButton>);
      expect(getComputedStyle(button).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(button)).toBe(1);
    } finally {
      unpark();
    }
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
    expect(link.className).toContain('after:bg-accent');
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
      <TextButton asChild active tone="accent" hoverArea="area">
        <a href="#acasa">Acasă</a>
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: 'Acasă' });
    expect(link).not.toHaveAttribute('active');
    expect(link).not.toHaveAttribute('tone');
    expect(link).not.toHaveAttribute('hoverarea');
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
  // project) with the real stylesheet loaded — but the stillness rule at the
  // top of this file switches every transition off, so a clock cannot be read
  // back as a computed value: the utility tokens ARE the contract here (the
  // reasoning of Button.test.tsx, whose file loads no sheet at all).
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
    // The `accent` role (#746894) — the old top bar's lavender at the pass
    // line (owner 2026-10-01): the hover END state is one a user can hold, so
    // it owes SC 1.4.3 the full 4.5:1, and the old site's exact #8377a3 reads
    // 4.09:1 on white. See the invariant block in TextButton.tsx.
    expect(tokens).toContain('hover:text-accent');
    // …and the green it replaced is gone from the atom (owner: "i need them
    // not to be that green").
    expect(tokens.filter((t) => t.includes('cta'))).toEqual([]);
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
    expect(tokens).toContain('after:bg-accent');
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

  it('never animates the active state in — the current page starts underlined AND lavender', () => {
    // State is never animation-conveyed (§9): active is a static full-width
    // rule that is already there on first paint, in reduced motion too — and
    // the label wears the underline's own colour at rest, the old top bar's
    // one-accent pattern (owner, canvas loop 2026-08-06), in that accent's
    // lavender since 2026-10-01. The `accent` role, never the old site's exact
    // #8377a3: a rest-state label owes SC 1.4.3 the full 4.5:1.
    const { tokens } = tokensOf({ active: true });
    expect(tokens).toContain('after:scale-x-100');
    expect(tokens).not.toContain('after:scale-x-0');
    expect(tokens).toContain('text-accent');
    expect(tokens).not.toContain('text-ink');
    expect(tokens.filter((t) => t.includes('cta'))).toEqual([]);
  });

  it('disables BOTH transitions under prefers-reduced-motion', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('motion-reduce:transition-none');
    expect(tokens).toContain('motion-reduce:after:transition-none');
    // …and every state stays fully legible without them: the colors and the
    // active underline are discrete values, only their easing is removed.
    expect(tokens).toContain('hover:text-accent');
    expect(tokensOf({ active: true }).tokens).toContain('after:scale-x-100');
  });

  it('keeps a visible focus ring, never animated or styled away (SC 2.4.7)', () => {
    const { cls, tokens } = tokensOf();
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).toContain('focus-visible:outline-focus');
    expect(tokens).toContain('outline-offset-2');
    expect(cls).not.toMatch(/outline-none|outline-hidden/);
  });

  it('wears the SOFT corner on its box — the ring, and any future ground, follow it (§15.29)', () => {
    // owner 2026-10-01: "that rounded corner effect that the doctor card from
    // old webpage has … TEXT buttons" — `rounded-soft`, the 1rem token the
    // personnel card, the Header pill and the contact dialog wear. A quiet
    // control has no ground and no border, so today the corner shows on the
    // focus ring alone (an outline follows border-radius in every current
    // engine); the box is what a future ground would inherit it from. ONE
    // `rounded-*` and never a second — the stylesheet's order must not pick.
    const { tokens } = tokensOf();
    expect(tokens.filter((t) => /^rounded-/.test(t))).toEqual(['rounded-soft']);
    // …and the underline stays a straight rule: nothing clips it to the corner.
    expect(tokens).not.toContain('overflow-hidden');
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

describe('TextButton — THE TONE: the ink at rest (owner, 2026-10-14)', () => {
  // "that is just text with 3 dots at the end whhich when hovered gets
  // underlined, so basivally the top bar button, but always lilla, the lilla
  // from hover" — the blog card's „Citește mai mult…".

  it('is the menu buttons’ class string by default, byte for byte — tone omitted, tone="ink" and through asChild alike', () => {
    expect(classOf(<TextButton>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    expect(classOf(<TextButton tone="ink">Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    expect(
      classOf(
        <TextButton asChild>
          <a href="#servicii">Servicii</a>
        </TextButton>,
      ),
    ).toBe(MENU_BUTTON_CLASSES);
  });

  it('accent changes ONE token — the resting ink — and nothing else, order included', () => {
    const ink = classOf(<TextButton>Citește mai mult…</TextButton>).split(' ');
    const accent = classOf(
      <TextButton tone="accent">Citește mai mult…</TextButton>,
    ).split(' ');
    expect(accent).toEqual(
      ink.map((token) => (token === 'text-ink' ? 'text-accent' : token)),
    );
    // …so the underline is still swept away at rest and drawn by a hover.
    expect(accent).toContain('after:scale-x-0');
    expect(accent).toContain('hover:after:scale-x-100');
  });

  it('active outranks tone — the current page wears ONE string whatever the tone', () => {
    const current = classOf(<TextButton active>Acasă</TextButton>);
    for (const tone of TONES) {
      expect(
        classOf(
          <TextButton active tone={tone}>
            Acasă
          </TextButton>,
        ),
      ).toBe(current);
    }
    expect(current.split(' ')).toEqual(
      expect.arrayContaining(['text-accent', 'after:scale-x-100']),
    );
    expect(current.split(' ')).not.toContain('after:scale-x-0');
  });
});

describe('TextButton — THE TONE’s paint, read from the real stylesheet', () => {
  it('accent: the label IS the --accent token at rest and under a real pointer — the hover draws the underline alone', async () => {
    const unpark = await parkPointer();
    try {
      render(<TextButton tone="accent">Citește mai mult…</TextButton>);
      const control = screen.getByRole('button', {
        name: 'Citește mai mult…',
      });
      expect(getComputedStyle(control).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(control)).toBe(0);

      await realHover(control);
      expect(getComputedStyle(control).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(control)).toBe(1);
      // The rule it draws is the same lavender — the one colour.
      expect(getComputedStyle(control, '::after').backgroundColor).toBe(
        tokenColour('accent'),
      );
    } finally {
      unpark();
    }
  });

  it('is the very ink a menu button turns on hover and the current page wears — the COLOR INVARIANT’s ONE colour, held by paint', async () => {
    const unpark = await parkPointer();
    try {
      render(
        <>
          <TextButton>Servicii</TextButton>
          <TextButton tone="accent">Citește mai mult…</TextButton>
          <TextButton active>Acasă</TextButton>
        </>,
      );
      const menu = screen.getByRole('button', { name: 'Servicii' });
      const readMore = screen.getByRole('button', {
        name: 'Citește mai mult…',
      });
      const current = screen.getByRole('button', { name: 'Acasă' });
      // At rest: the menu button in the body's ink, the other two lavender…
      expect(getComputedStyle(menu).color).toBe(tokenColour('ink'));
      expect(getComputedStyle(readMore).color).toBe(tokenColour('accent'));
      expect(getComputedStyle(current).color).toBe(tokenColour('accent'));
      // …the current page's rule drawn, the two others swept away…
      expect(underlineScaleX(current)).toBe(1);
      expect(underlineScaleX(menu)).toBe(0);
      expect(underlineScaleX(readMore)).toBe(0);

      // …and under the pointer the menu button reaches exactly that ink.
      await realHover(menu);
      expect(getComputedStyle(menu).color).toBe(
        getComputedStyle(readMore).color,
      );
      expect(underlineScaleX(menu)).toBe(1);
    } finally {
      unpark();
    }
  });

  it('is for STANDALONE controls only: against --ink, the words of a sentence, it reads 2.93:1 — under the 3:1 a colour-only difference owes (G183, SC 1.4.1)', () => {
    // THE TONE's last sentence, held by the engine's own colours: with no
    // underline at rest, inline in prose only the hue would tell the control
    // from its sentence. The day the two tokens part by 3:1, this turns red
    // and the paragraph is re-measured.
    const ratio = contrastOf(tokenColour('accent'), tokenColour('ink'));
    expect(ratio).toBeLessThan(3);
    expect(ratio).toBeCloseTo(2.93, 2);
  });
});

describe('TextButton — asChild onto a <span>: the LABEL of a link its caller owns (sections/PostCard’s THE LINK)', () => {
  // The shape the blog card ships since 2026-10-15: the card's <a href> is
  // the control — ONE tab stop, its name read off the label through
  // `aria-labelledby` — and the atom dresses the <span> inside it, which
  // wears the whole look and is no control at all.

  /** The blog card's read-more cut to the label and its link — the
   *  AsLinkLabel story's markup: the caller's <a href> wears the area and
   *  owns the name, read off the label by `aria-labelledby` (an id from
   *  useId, as the card's are); the atom dresses the <span> inside it as the
   *  card asks, `tone="accent"` and `hoverArea="area"`. */
  function LabelInLink(): ReactElement {
    const labelId = useId();
    return (
      <a
        href="/ro/blog/cum-iti-alegi-periuta-de-dinti/"
        aria-labelledby={labelId}
        className={TEXT_BUTTON_HOVER_AREA}
      >
        <TextButton tone="accent" hoverArea="area" asChild>
          <span id={labelId}>Citește mai mult…</span>
        </TextButton>
      </a>
    );
  }

  it('is ONE control, the caller’s link, named by the label’s words — and the label none: the clone itself, a <span> with no role, href, tabindex or aria-current, wearing the accent look byte for byte', () => {
    const look = classOf(
      <TextButton tone="accent" hoverArea="area">
        Citește mai mult…
      </TextButton>,
    );
    render(<LabelInLink />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    const link = screen.getByRole('link', { name: 'Citește mai mult…' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const label = screen.getByText('Citește mai mult…');
    // The CLONE itself — the link's own child, no <button> drawn round it
    // (which getByText would find just the same, by the words inside it).
    expect(label.tagName).toBe('SPAN');
    expect(label.closest('button')).toBeNull();
    expect(label.parentElement).toBe(link);
    expect(label.className).toBe(look);
    // …its own id kept through the merge (the child wins), the id the
    // link's name reads…
    expect(label.id).not.toBe('');
    expect(link).toHaveAttribute('aria-labelledby', label.id);
    // …and nothing added that would make it a control.
    for (const attribute of ['href', 'role', 'tabindex', 'aria-current']) {
      expect(label).not.toHaveAttribute(attribute);
    }
  });

  it('takes no focus of its own: a script’s focus() passes it by, and a real Tab stops ONCE, on the link, both ways — so the atom’s ring never draws on the label', async () => {
    render(
      <>
        <button type="button">Înainte</button>
        <LabelInLink />
        <button type="button">După</button>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Citește mai mult…' });
    const label = screen.getByText('Citește mai mult…');
    label.focus();
    expect(label).not.toHaveFocus();

    await realUser.click(screen.getByRole('button', { name: 'Înainte' }));
    await realUser.tab();
    expect(link).toHaveFocus();
    // The ring answers :focus-visible, which the label — never focused —
    // cannot match while its link holds the keyboard's focus.
    expect(link.matches(':focus-visible')).toBe(true);
    expect(label.matches(':focus-visible')).toBe(false);
    expect(getComputedStyle(label).outlineStyle).toBe('none');
    await realUser.tab();
    expect(screen.getByRole('button', { name: 'După' })).toHaveFocus();
    await realUser.tab({ shift: true });
    expect(link).toHaveFocus();
    await realUser.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Înainte' })).toHaveFocus();
  });

  it('draws the underline under a real pointer on its link and sweeps it away at rest — the accent ink throughout (THE TONE)', async () => {
    const unpark = await parkPointer();
    try {
      render(
        <>
          <LabelInLink />
          <p>În afara linkului.</p>
        </>,
      );
      const link = screen.getByRole('link', { name: 'Citește mai mult…' });
      const label = screen.getByText('Citește mai mult…');
      expect(getComputedStyle(label).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(label)).toBe(0);

      // Where a press opens the link, the label lights: its box IS the
      // link's.
      await realHover(link);
      expect(label.matches(':hover')).toBe(true);
      expect(getComputedStyle(label).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(label)).toBe(1);

      // Off the link, back to rest.
      await realHover(screen.getByText('În afara linkului.'));
      expect(link.matches(':hover')).toBe(false);
      expect(getComputedStyle(label).color).toBe(tokenColour('accent'));
      expect(underlineScaleX(label)).toBe(0);
    } finally {
      unpark();
    }
  });

  it('lays out exactly as the accent <button> — the same box, the same words in the same place — and its link paints nothing round it', () => {
    // The measurement the AsLinkLabel story's 'no-visual' tag stands on: its
    // frame would only repeat the Accent story's pixels. Both render in one
    // face, whichever the runner has, so the face cannot tell them apart;
    // the place is read from each render's own container, so the link round
    // the label is measured too — it moves the label by nothing.
    const geometry = (element: Element) => {
      const box = element.getBoundingClientRect();
      const frame = element.closest('div')?.getBoundingClientRect();
      if (!frame) throw new Error('the render container is missing');
      const range = document.createRange();
      range.selectNodeContents(element);
      const words = range.getBoundingClientRect();
      return {
        left: box.left - frame.left,
        top: box.top - frame.top,
        width: box.width,
        height: box.height,
        wordsLeft: words.left - box.left,
        wordsTop: words.top - box.top,
        wordsWidth: words.width,
        wordsHeight: words.height,
      };
    };
    const { unmount } = render(
      <TextButton tone="accent" hoverArea="area">
        Citește mai mult…
      </TextButton>,
    );
    const button = geometry(screen.getByRole('button'));
    unmount();
    render(<LabelInLink />);
    expect(geometry(screen.getByText('Citește mai mult…'))).toEqual(button);
    // The link round it: no ground, no border, no outline and no
    // decoration of its own at rest — it draws nothing a frame could see.
    // (Its border style is preflight's `0 solid`: the width is what draws.)
    const link = getComputedStyle(screen.getByRole('link'));
    expect(link.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
      expect(link[`border${side}Width`], side).toBe('0px');
    }
    expect(link.outlineStyle).toBe('none');
    expect(link.textDecorationLine).toBe('none');
  });
});

describe('TextButton — THE HOVER AREA: the card’s hover draws its read-more (owner, 2026-10-14)', () => {
  // "i also want on hover of a card the underline from citeste mai mult
  // animation to trigger" — the blog card's article wears
  // TEXT_BUTTON_HOVER_AREA and its „Citește mai mult…" `hoverArea="area"`.

  /** The area's own name, after Tailwind's `group/` — the two utilities the
   *  area lights are spelled FROM the exported constant below, so a renamed
   *  constant and a stale class row cannot both stay green. Each one asks
   *  `not-disabled` before it lights (a disabled button stays quiet). */
  const AREA_NAME = TEXT_BUTTON_HOVER_AREA.replace(/^group\//, '');
  const AREA_ROW = [
    `group-hover/${AREA_NAME}:not-disabled:text-accent`,
    `group-hover/${AREA_NAME}:not-disabled:after:scale-x-100`,
  ];

  /** The blog card's shape, cut to what the area needs: an ancestor wearing
   *  `marker` (the area's class, Tailwind's plain `group`, or nothing), a line
   *  of words to rest the pointer on — inside the ancestor, off the button —
   *  and what goes in it; then a line OUTSIDE it, for leaving. */
  const renderArea = (marker: string | undefined, inside: ReactNode) => {
    const { unmount } = render(
      <>
        <div className={marker}>
          <p>Tartrul se depune acolo unde periuța nu mai ajunge.</p>
          {inside}
        </div>
        <p>În afara cardului.</p>
      </>,
    );
    const words = screen.getByText(
      'Tartrul se depune acolo unde periuța nu mai ajunge.',
    );
    const area = words.parentElement;
    if (!area) throw new Error('the area did not render');
    return {
      area,
      words,
      outside: screen.getByText('În afara cardului.'),
      unmount,
    };
  };

  /** Every style rule of the live sheet, with the media conditions it sits
   *  under — the compiled truth behind a class (DoctorShowcase.test.tsx's
   *  walk; a layer adds no condition). */
  const compiledRules = (): { rule: CSSStyleRule; conditions: string[] }[] => {
    const found: { rule: CSSStyleRule; conditions: string[] }[] = [];
    const walk = (rules: CSSRuleList, conditions: string[]): void => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          found.push({ rule, conditions });
        } else if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, [...conditions, rule.media.mediaText]);
        } else if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules, conditions);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      walk(sheet.cssRules, []);
    }
    return found;
  };

  it('omitted or "self", it is the class string every button wore before the prop, byte for byte — in either tone, active, and through asChild', () => {
    expect(classOf(<TextButton>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    expect(classOf(<TextButton hoverArea="self">Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    expect(
      classOf(
        <TextButton hoverArea="self" asChild>
          <a href="#servicii">Servicii</a>
        </TextButton>,
      ),
    ).toBe(MENU_BUTTON_CLASSES);
    for (const props of [{ tone: 'accent' }, { active: true }] as const) {
      expect(
        classOf(
          <TextButton {...props} hoverArea="self">
            Acasă
          </TextButton>,
        ),
      ).toBe(classOf(<TextButton {...props}>Acasă</TextButton>));
    }
  });

  it('"area" appends the two hover END values under the area’s NAMED group, each asking not-disabled — after the row it lights, before the caller’s class — and nothing else: no clock of its own', () => {
    // Tailwind's named-group marker, `group/<name>` — never the plain `group`.
    expect(TEXT_BUTTON_HOVER_AREA).toBe(`group/${AREA_NAME}`);
    expect(AREA_NAME).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    for (const tone of TONES) {
      const self = classOf(
        <TextButton tone={tone}>Citește mai mult…</TextButton>,
      ).split(' ');
      expect(
        classOf(
          <TextButton tone={tone} hoverArea="area">
            Citește mai mult…
          </TextButton>,
        ).split(' '),
        tone,
      ).toEqual([...self, ...AREA_ROW]);
    }
    expect(
      classOf(
        <TextButton hoverArea="area" className="justify-self-start">
          Servicii
        </TextButton>,
      )
        .split(' ')
        .slice(-3),
    ).toEqual([...AREA_ROW, 'justify-self-start']);
  });

  it('draws the hover look while a real pointer rests on the AREA, off the button — the ink tone’s label turned --accent, the underline swept in, in both tones — lets go when the pointer leaves, and keeps the button’s own hover', async () => {
    const unpark = await parkPointer();
    try {
      for (const tone of TONES) {
        const { area, words, outside, unmount } = renderArea(
          TEXT_BUTTON_HOVER_AREA,
          <TextButton tone={tone} hoverArea="area">
            Citește mai mult…
          </TextButton>,
        );
        const control = screen.getByRole('button', {
          name: 'Citește mai mult…',
        });
        // At rest: the tone's own ink, the underline swept away.
        expect(getComputedStyle(control).color, tone).toBe(tokenColour(tone));
        expect(underlineScaleX(control), tone).toBe(0);

        await realHover(words);
        // The pointer is on the area and NOT on the button…
        expect(area.matches(':hover'), tone).toBe(true);
        expect(control.matches(':hover'), tone).toBe(false);
        // …and the button wears its hover look all the same.
        expect(getComputedStyle(control).color, tone).toBe(
          tokenColour('accent'),
        );
        expect(underlineScaleX(control), tone).toBe(1);

        // Off the card, back to rest.
        await realHover(outside);
        expect(getComputedStyle(control).color, tone).toBe(tokenColour(tone));
        expect(underlineScaleX(control), tone).toBe(0);

        // The button's own hover is untouched: `area` widens it, never moves it.
        await realHover(control);
        expect(getComputedStyle(control).color, tone).toBe(
          tokenColour('accent'),
        );
        expect(underlineScaleX(control), tone).toBe(1);

        // Leave before the next tone renders in the same place.
        await realHover(outside);
        unmount();
      }
    } finally {
      unpark();
    }
  });

  it('draws nothing under an ancestor WITHOUT the class, or one wearing Tailwind’s plain `group` — the marker ui/GlyphButton, ui/SpeedDial and the map’s contact rows wear: the name is the point', async () => {
    const unpark = await parkPointer();
    try {
      for (const marker of [undefined, 'group']) {
        const label = marker ?? 'no class';
        const { area, words, outside, unmount } = renderArea(
          marker,
          <TextButton hoverArea="area">Citește mai mult…</TextButton>,
        );
        const control = screen.getByRole('button', {
          name: 'Citește mai mult…',
        });
        await realHover(words);
        // The ancestor IS hovered — the rest below is not a missed pointer.
        expect(area.matches(':hover'), label).toBe(true);
        expect(getComputedStyle(control).color, label).toBe(tokenColour('ink'));
        expect(underlineScaleX(control), label).toBe(0);
        await realHover(outside);
        unmount();
      }
    } finally {
      unpark();
    }
  });

  it('the class alone draws nothing: a "self" button in a hovered area stays at rest beside the "area" one that lights', async () => {
    const unpark = await parkPointer();
    try {
      const { words } = renderArea(
        TEXT_BUTTON_HOVER_AREA,
        <>
          <TextButton>Servicii</TextButton>
          <TextButton hoverArea="area">Citește mai mult…</TextButton>
        </>,
      );
      const menu = screen.getByRole('button', { name: 'Servicii' });
      const readMore = screen.getByRole('button', {
        name: 'Citește mai mult…',
      });
      await realHover(words);
      expect(getComputedStyle(menu).color).toBe(tokenColour('ink'));
      expect(underlineScaleX(menu)).toBe(0);
      expect(underlineScaleX(readMore)).toBe(1);
    } finally {
      unpark();
    }
  });

  it('answers ANY hovered ancestor wearing the class, not only the nearest — so areas do not nest: one per card', async () => {
    const unpark = await parkPointer();
    try {
      const { words } = renderArea(
        TEXT_BUTTON_HOVER_AREA,
        <div className={TEXT_BUTTON_HOVER_AREA}>
          <TextButton hoverArea="area">Citește mai mult…</TextButton>
        </div>,
      );
      const control = screen.getByRole('button', {
        name: 'Citește mai mult…',
      });
      // The pointer in the OUTER area, outside the inner one…
      await realHover(words);
      expect(control.parentElement?.matches(':hover')).toBe(false);
      // …lights the button all the same.
      expect(underlineScaleX(control)).toBe(1);
    } finally {
      unpark();
    }
  });

  it('leaves a DISABLED button quiet under a hovered area, in both tones — pointer-events: none keeps its own hover off, never its ancestor’s, so the pair asks not-disabled before it lights', async () => {
    const unpark = await parkPointer();
    try {
      for (const tone of TONES) {
        const { area, words, outside, unmount } = renderArea(
          TEXT_BUTTON_HOVER_AREA,
          <TextButton tone={tone} hoverArea="area" disabled>
            Citește mai mult…
          </TextButton>,
        );
        const control = screen.getByRole('button', {
          name: 'Citește mai mult…',
        });
        expect(control, tone).toBeDisabled();
        await realHover(words);
        // The area IS hovered — the rest below is not a missed pointer.
        expect(area.matches(':hover'), tone).toBe(true);
        expect(getComputedStyle(control).color, tone).toBe(tokenColour(tone));
        expect(underlineScaleX(control), tone).toBe(0);
        await realHover(outside);
        unmount();
      }
    } finally {
      unpark();
    }
  });

  it('lights the blog card’s own element, the LABEL <span> inside the card’s link — never disabled, so asking not-disabled lights it where asking “enabled” never would', async () => {
    // A MECHANISM test: the pointer rests on words OUTSIDE the link, which
    // THE PRECONDITION forbids a real caller (the card's link layer covers
    // its whole area) — here it isolates the `not-disabled:` half alone.
    const unpark = await parkPointer();
    try {
      const { words } = renderArea(
        TEXT_BUTTON_HOVER_AREA,
        <a href="/ro/blog/cum-iti-alegi-periuta-de-dinti/">
          <TextButton tone="accent" hoverArea="area" asChild>
            <span>Citește mai mult…</span>
          </TextButton>
        </a>,
      );
      const label = screen.getByText('Citește mai mult…');
      // The CLONE itself, the link's own child: had asChild been ignored,
      // getByText would still find a <span> — the one inside a <button>.
      expect(label.closest('button')).toBeNull();
      expect(label.parentElement).toBe(
        screen.getByRole('link', { name: 'Citește mai mult…' }),
      );
      expect(underlineScaleX(label)).toBe(0);
      await realHover(words);
      expect(label.matches(':hover')).toBe(false);
      expect(underlineScaleX(label)).toBe(1);
    } finally {
      unpark();
    }
  });

  it('under reduced motion a hovered area draws the state at once: the area pair’s compiled rules carry END values only — no transition — under (hover: hover), and the two reduced-motion resets an "area" button wears switch both clocks off', () => {
    render(<TextButton hoverArea="area">Citește mai mult…</TextButton>);
    const control = screen.getByRole('button');
    const rules = compiledRules();
    for (const token of AREA_ROW) {
      expect(control.classList.contains(token), token).toBe(true);
      const own = rules.filter(({ rule }) =>
        rule.selectorText.startsWith(`.${CSS.escape(token)}:`),
      );
      expect(own.length, token).toBeGreaterThan(0);
      for (const { rule, conditions } of own) {
        expect(
          Array.from(rule.style).filter((property) =>
            property.startsWith('transition'),
          ),
          token,
        ).toEqual([]);
        expect(conditions, token).toEqual(['(hover: hover)']);
      }
    }
    for (const [token, pseudo] of [
      ['motion-reduce:transition-none', ''],
      ['motion-reduce:after:transition-none', '::after'],
    ] as const) {
      expect(control.classList.contains(token), token).toBe(true);
      const reset = rules.filter(
        ({ rule }) => rule.selectorText === `.${CSS.escape(token)}${pseudo}`,
      );
      expect(reset.length, token).toBeGreaterThan(0);
      for (const { rule, conditions } of reset) {
        expect(rule.style.transitionProperty, token).toBe('none');
        expect(conditions, token).toEqual(['(prefers-reduced-motion: reduce)']);
      }
    }
  });
});

describe('TextButton — past the types: the unions pinned, an escaped value failing CLOSED', () => {
  it('the unions, exactly — a third tone or area fails tsc until TONES and the stories’ two controls list it', () => {
    // `satisfies` only checks that each listed value IS one; these hold every
    // list to the WHOLE union, so the day the atom gains a third, tsc names
    // each list that misses it. Erased at run time.
    expectTypeOf<TextButtonTone>().toEqualTypeOf<'ink' | 'accent'>();
    expectTypeOf<TextButtonHoverArea>().toEqualTypeOf<'self' | 'area'>();
    expectTypeOf<(typeof TONES)[number]>().toEqualTypeOf<TextButtonTone>();
    type Controls = (typeof textButtonStories)['argTypes'];
    expectTypeOf<
      Controls['tone']['options'][number]
    >().toEqualTypeOf<TextButtonTone>();
    expectTypeOf<
      Controls['hoverArea']['options'][number]
    >().toEqualTypeOf<TextButtonHoverArea>();
  });

  it('a tone that escaped the types — a Storybook control, an untyped spread — wears the INK rest row, never none: no full-width rule at rest, no ink borrowed from above', async () => {
    const escaped = 'loud' as unknown as TextButtonTone;
    expect(classOf(<TextButton tone={escaped}>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
    const unpark = await parkPointer();
    try {
      // A wrapper with an ink of its own: a dropped rest row would borrow it.
      render(
        <div style={{ color: 'rgb(200, 0, 0)' }}>
          <TextButton tone={escaped}>Servicii</TextButton>
        </div>,
      );
      const control = screen.getByRole('button', { name: 'Servicii' });
      expect(getComputedStyle(control).color).toBe(tokenColour('ink'));
      expect(underlineScaleX(control)).toBe(0);
    } finally {
      unpark();
    }
  });

  it('an area that escaped the types adds nothing — the button’s own hover, byte for byte', () => {
    const escaped = 'card' as unknown as TextButtonHoverArea;
    expect(classOf(<TextButton hoverArea={escaped}>Servicii</TextButton>)).toBe(
      MENU_BUTTON_CLASSES,
    );
  });
});
