import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline, for the
// facts a class name cannot show — the chip's computed height, its round ends
// and its paint (the house pattern: Card, Modal, SpeedDial load it per file;
// tests/setup/components.ts loads no CSS globally). The class TOKENS are
// pinned too, below, because they are the contract a reader edits.
import '@/styles/globals.css';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { PillButton } from './PillButton';
import source from './PillButton.tsx?raw';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7) — the price
// page's own category names: „Consultații" „Endodonție" „Estetică dentară".

/** Computed colours are read at REST: the chip's paint rides a 400ms clock,
 *  and a state change mid-test would be read mid-fade. An unlayered rule
 *  outranks every utility (the house's tests-with-real-CSS recipe). */
let still: HTMLStyleElement;
beforeAll(() => {
  still = document.createElement('style');
  still.textContent = '* { transition: none !important; }';
  document.head.append(still);
});
afterAll(() => still.remove());

const tokensOf = (props: { active?: boolean } = {}) => {
  const { unmount } = render(<PillButton {...props}>Endodonție</PillButton>);
  const cls = screen.getByRole('button').className;
  unmount();
  return { cls, tokens: cls.split(/\s+/).filter(Boolean) };
};

/**
 * The atom's source with its PROSE removed, in ONE LEFT-TO-RIGHT PASS —
 * PriceList.test.tsx's `stripComments`, the shape the G2 typescript review
 * asked for (2026-10-02, M2): string literals are stepped over whole, and a
 * `//` comment (opening only at a line's start or after whitespace) is
 * consumed before a block opener inside it can run on and hide code. The
 * two-pass version it replaces stripped blocks first.
 */
const stripComments = (code: string): string =>
  code.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

describe('PillButton — element & semantics', () => {
  it('renders a real <button> exposing its accessible name', () => {
    render(<PillButton>Consultații</PillButton>);
    expect(
      screen.getByRole('button', { name: 'Consultații' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so a chip never submits a form', () => {
    render(<PillButton>Consultații</PillButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(<PillButton type="submit">Trimite</PillButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick — the atom itself owns no navigation', async () => {
    const onClick = vi.fn();
    render(<PillButton onClick={onClick}>Protetică</PillButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Protetică' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('a disabled chip truly leaves the tab order (native disabled, not aria)', () => {
    render(<PillButton disabled>Protetică</PillButton>);
    expect(screen.getByRole('button', { name: 'Protetică' })).toBeDisabled();
  });

  it('renders marked-up children and exposes the full accessible name', () => {
    render(
      <PillButton>
        Estetică <strong>dentară</strong>
      </PillButton>,
    );
    expect(
      screen.getByRole('button', { name: 'Estetică dentară' }),
    ).toBeInTheDocument();
  });
});

describe('PillButton — active = the current choice', () => {
  it('exposes aria-current="page" when active', () => {
    render(<PillButton active>Consultații</PillButton>);
    expect(screen.getByRole('button', { name: 'Consultații' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('carries no aria-current when resting', () => {
    render(<PillButton>Consultații</PillButton>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('lets a caller-supplied aria-current win (§6.8 — TextButton’s precedence)', () => {
    render(
      <PillButton active aria-current="location">
        Ortodonție
      </PillButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('never leaks its own props onto the DOM element', () => {
    render(<PillButton active>Ortodonție</PillButton>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('active');
    expect(button).not.toHaveAttribute('aschild');
  });
});

describe('PillButton — §6.8 native-element fidelity', () => {
  it('merges the parent className LAST, after its own classes', () => {
    render(<PillButton className="shrink-0">Chirurgie</PillButton>);
    const cls = screen.getByRole('button').className;
    expect(cls.endsWith(' shrink-0')).toBe(true);
    expect(cls.startsWith('inline-flex ')).toBe(true);
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<PillButton ref={ref}>Chirurgie</PillButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <PillButton data-slot="chip" aria-describedby="hint">
        Chirurgie
      </PillButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-slot', 'chip');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('PillButton — asChild (shared ui/slot engine)', () => {
  it('renders ONLY the child element — no <button> exists in the DOM', () => {
    render(
      <PillButton asChild>
        <a href="#endodontics">Endodonție</a>
      </PillButton>,
    );
    const link = screen.getByRole('link', { name: 'Endodonție' });
    expect(link).toHaveAttribute('href', '#endodontics');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours its styling onto the child, keeping the child's own classes", () => {
    render(
      <PillButton asChild className="shrink-0">
        <a href="#endodontics" className="col-span-2">
          Endodonție
        </a>
      </PillButton>,
    );
    const link = screen.getByRole('link', { name: 'Endodonție' });
    expect(link.className).toContain('col-span-2');
    expect(link.className).toContain('shrink-0');
    expect(link.className).toContain('rounded-full');
  });

  it('rides the computed aria-current through to the child anchor', () => {
    render(
      <PillButton asChild active>
        <a href="#consultations">Consultații</a>
      </PillButton>,
    );
    expect(screen.getByRole('link', { name: 'Consultații' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('an explicit aria-current="location" wins — the price strip’s claim', () => {
    render(
      <PillButton asChild active aria-current="location">
        <a href="#consultations">Consultații</a>
      </PillButton>,
    );
    expect(screen.getByRole('link', { name: 'Consultații' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('never leaks its own props onto the child element', () => {
    render(
      <PillButton asChild active>
        <a href="#consultations">Consultații</a>
      </PillButton>,
    );
    const link = screen.getByRole('link', { name: 'Consultații' });
    expect(link).not.toHaveAttribute('active');
    expect(link).not.toHaveAttribute('aschild');
  });

  // PillButtonProps types ref for the <button> branch; in asChild mode it
  // reaches the child element instead — the cast is the test acknowledging it
  // (TextButton's and Button's shape).
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it('forwards its ref to the child element (React 19 ref-in-props)', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <PillButton asChild ref={asButtonRef(ref)}>
        <a href="#endodontics">Endodonție</a>
      </PillButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('throws its own actionable, PillButton-named message for bad children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<PillButton asChild>doar text</PillButton>)).toThrow(
      /PillButton with asChild expects exactly one element child/,
    );
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <PillButton asChild disabled>
        <a href="#endodontics">Endodonție</a>
      </PillButton>,
    );
    const link = screen.getByRole('link', { name: 'Endodonție' });
    expect(link).not.toHaveAttribute('disabled');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no effect with asChild'),
    );
    errorSpy.mockRestore();
  });
});

describe('PillButton — the shape (owner 2026-10-09: “rounded left and right edge … fully round”)', () => {
  it('wears ONE fully round corner, a 44px floor, nowrap and no syllable split', () => {
    const { tokens } = tokensOf();
    expect(tokens.filter((t) => /^rounded-/.test(t))).toEqual(['rounded-full']);
    for (const token of [
      'min-h-11',
      'px-5',
      'text-lg',
      'font-medium',
      'whitespace-nowrap',
      'hyphens-none',
      'border-2',
    ]) {
      expect(tokens).toContain(token);
    }
  });

  it('measures as a pill: 44px tall, both ends half circles', () => {
    render(<PillButton>Endodonție</PillButton>);
    const chip = screen.getByRole('button');
    const box = chip.getBoundingClientRect();
    const style = getComputedStyle(chip);
    expect(box.height).toBeCloseTo(44, 1);
    // `rounded-full` is `calc(infinity * 1px)`: an engine clamps a radius to
    // half the box's shorter side, so any value at least that large draws the
    // half circle — and it is.
    expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(
      box.height / 2,
    );
    expect(parseFloat(style.borderBottomRightRadius)).toBeGreaterThanOrEqual(
      box.height / 2,
    );
    expect(style.borderTopWidth).toBe('2px');
    expect(style.whiteSpace).toBe('nowrap');
  });

  it('owns no outer margin (§6.4) and no fixed width (§8.4)', () => {
    const { tokens } = tokensOf();
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^(w|min-w|max-w)-/.test(t))).toEqual([]);
  });
});

describe('PillButton — the paint (two states, one hover)', () => {
  /** A computed colour as three 0–255 channels, whichever way the engine
   *  serializes it: `rgb(r, g, b)`, or `color(srgb r g b)` with 0–1 channels —
   *  what Chromium answers for a color-mix(). */
  const rgbOf = (color: string): readonly number[] => {
    const channels = (color.match(/[\d.]+/g) ?? []).map(Number);
    return color.startsWith('color(')
      ? channels.slice(0, 3).map((value) => value * 255)
      : channels.slice(0, 3);
  };

  /** THE POINTER, PARKED away from every chip before a colour is read at rest
   *  — a resting pointer is :hover (the house's park-the-pointer rule,
   *  LanguageBanner.test.tsx's and ReviewsDeck.test.tsx's precedent). A REAL
   *  pointer (vitest/browser's userEvent): a synthetic event cannot move
   *  :hover. Returns the clean-up, run after the reads. */
  const parkPointer = async (): Promise<() => void> => {
    const parking = document.createElement('div');
    parking.style.cssText = 'width: 2rem; height: 2rem';
    document.body.prepend(parking);
    await realUser.hover(parking);
    return () => parking.remove();
  };

  it('RESTING: ink on the white surface inside the card tint’s thin edge — the doctor card’s frame colour', async () => {
    const { tokens } = tokensOf();
    expect(tokens).toEqual(
      expect.arrayContaining(['border-card-tint', 'bg-surface', 'text-ink']),
    );
    const unpark = await parkPointer();
    try {
      render(<PillButton>Consultații</PillButton>);
      const style = getComputedStyle(screen.getByRole('button'));
      expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(style.color).toBe('rgb(43, 39, 36)');
      // The card tint: accent-decorative (#7a6d9c) at 20 % over the white
      // surface — about the old site's rgb(229 228 236) — and never the solid
      // accent an engine without color-mix falls back to.
      expect(style.borderTopColor).not.toBe('rgb(122, 109, 156)');
      const mix = [122, 109, 156].map((channel) => 0.2 * channel + 0.8 * 255);
      rgbOf(style.borderTopColor).forEach((channel, index) => {
        expect(Math.abs(channel - mix[index])).toBeLessThanOrEqual(1);
      });
    } finally {
      unpark();
    }
  });

  it('the resting edge IS the framed card’s frame — one role, read back from the engine', async () => {
    const unpark = await parkPointer();
    try {
      render(
        <>
          <PillButton>Consultații</PillButton>
          <Card tone="framed">Cadru</Card>
        </>,
      );
      expect(getComputedStyle(screen.getByRole('button')).borderTopColor).toBe(
        getComputedStyle(screen.getByText('Cadru')).borderTopColor,
      );
    } finally {
      unpark();
    }
  });

  it('ACTIVE: white on the accent face, an accent edge — ui/Button’s lavender rest face', async () => {
    const { tokens } = tokensOf({ active: true });
    expect(tokens).toEqual(
      expect.arrayContaining([
        'border-accent',
        'bg-accent',
        'text-ink-inverse',
      ]),
    );
    expect(tokens).not.toContain('bg-surface');
    expect(tokens).not.toContain('border-card-tint');
    const unpark = await parkPointer();
    try {
      render(<PillButton active>Consultații</PillButton>);
      const style = getComputedStyle(screen.getByRole('button'));
      expect(style.backgroundColor).toBe('rgb(116, 104, 148)');
      expect(style.borderTopColor).toBe('rgb(116, 104, 148)');
      expect(style.color).toBe('rgb(255, 255, 255)');
    } finally {
      unpark();
    }
  });

  it('the active face IS ui/Button’s lavender face at rest — KEEP-IN-SYNC, held by paint', async () => {
    const unpark = await parkPointer();
    try {
      render(
        <>
          <PillButton active>Consultații</PillButton>
          <Button tone="accent">Programare</Button>
        </>,
      );
      const chip = getComputedStyle(
        screen.getByRole('button', { name: 'Consultații' }),
      );
      const face = getComputedStyle(
        screen.getByRole('button', { name: 'Programare' }),
      );
      expect(chip.backgroundColor).toBe(face.backgroundColor);
      expect(chip.color).toBe(face.color);
    } finally {
      unpark();
    }
  });

  it('HOVERS only at rest: the label and the edge take the accent; the current chip has no hover look', async () => {
    const resting = tokensOf().tokens.filter((t) => t.startsWith('hover:'));
    expect(resting.sort()).toEqual([
      'hover:border-accent',
      'hover:text-accent',
    ]);
    expect(
      tokensOf({ active: true }).tokens.filter((t) => t.startsWith('hover:')),
    ).toEqual([]);

    // …and under a REAL pointer (the stillness rule above means no fade to
    // wait out): the resting chip's label and edge turn lavender, its white
    // face stays; the current chip does not move at all.
    render(
      <>
        <PillButton>Consultații</PillButton>
        <PillButton active>Endodonție</PillButton>
      </>,
    );
    const resting_ = screen.getByRole('button', { name: 'Consultații' });
    await realUser.hover(resting_);
    const hovered = getComputedStyle(resting_);
    expect(hovered.color).toBe('rgb(116, 104, 148)');
    expect(hovered.borderTopColor).toBe('rgb(116, 104, 148)');
    expect(hovered.backgroundColor).toBe('rgb(255, 255, 255)');
    const current = screen.getByRole('button', { name: 'Endodonție' });
    await realUser.hover(current);
    const still_ = getComputedStyle(current);
    expect(still_.backgroundColor).toBe('rgb(116, 104, 148)');
    expect(still_.color).toBe('rgb(255, 255, 255)');
  });

  it('wears the header pill’s glow in BOTH states, and no second shadow — but the forced-colours opt-out', () => {
    for (const active of [false, true]) {
      const { tokens } = tokensOf({ active });
      const shadows = tokens.filter((t) => /(^|:)shadow-/.test(t));
      // ONE unconditional shadow, in both states…
      expect(shadows.filter((t) => !t.startsWith('forced-colors:'))).toEqual([
        'shadow-aura',
      ]);
      // …and, on the ACTIVE chip alone, the one forced-colours override: an
      // opted-out box keeps an author shadow, and High Contrast wants none.
      expect(shadows.filter((t) => t.startsWith('forced-colors:'))).toEqual(
        active ? ['forced-colors:shadow-none'] : [],
      );
    }
  });
});

describe('PillButton — the motion (the system’s --fade clock)', () => {
  it('fades the ground, the edge and the label on ONE 400ms ease-in-out clock', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('[--fade:400ms]');
    expect(tokens).toContain(
      'transition-[background-color,border-color,color]',
    );
    expect(tokens).toContain('duration-(--fade)');
    expect(tokens).toContain('ease-in-out');
    expect(tokens).toContain('motion-reduce:transition-none');
    // Never the shorthand that would drag the focus ring's outline-color onto
    // the clock, never a second clock or easing, never anything that moves.
    expect(tokens).not.toContain('transition-colors');
    expect(tokens).not.toContain('transition-all');
    expect(
      tokens.filter(
        (t) => /(^|:)duration-/.test(t) && t !== 'duration-(--fade)',
      ),
    ).toEqual([]);
    expect(
      tokens.filter((t) => /(^|:)ease-/.test(t) && t !== 'ease-in-out'),
    ).toEqual([]);
    expect(tokens.filter((t) => /(^|:)(scale|translate)-/.test(t))).toEqual([]);
  });

  it('runs the SAME clock as ui/Button — KEEP-IN-SYNC (fb-44), compared, not retyped', () => {
    const { unmount } = render(<Button>Programare</Button>);
    const buttonClock = screen
      .getByRole('button')
      .className.split(/\s+/)
      .filter((t) => t.startsWith('[--fade:'));
    unmount();
    const chipClock = tokensOf().tokens.filter((t) => t.startsWith('[--fade:'));
    expect(chipClock).toHaveLength(1);
    expect(chipClock).toEqual(buttonClock);
  });

  it('keeps a visible focus ring, never animated or styled away (SC 2.4.7) — TextButton’s recipe', () => {
    const { cls, tokens } = tokensOf();
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).toContain('focus-visible:outline-focus');
    expect(tokens).toContain('outline-offset-2');
    expect(cls).not.toMatch(/outline-none|outline-hidden/);
  });

  it('carries no directive and no string of its own (§16, §8.1)', () => {
    const code = stripComments(source);
    expect(code).not.toMatch(/['"]use client['"]/);
    expect(code).not.toMatch(/\bt\(|useTranslations|next-intl/);
  });

  it('strips prose in ONE pass — a `/*` inside a line comment hides no code after it, a comment opener inside a string is kept', () => {
    // Spelled with joined pieces so this file's own text holds no live opener.
    const open = '/' + '*';
    const close = '*' + '/';
    const sample = [
      `// a path like src/messages/${open}.json, in a line comment`,
      "const real = 'kept';",
      `${open} a block comment ${close}`,
      `const url = 'https://example.ro/${open}keep';`,
    ].join('\n');
    const code = stripComments(sample);
    expect(code).toContain("const real = 'kept';");
    expect(code).toContain(`'https://example.ro/${open}keep'`);
    expect(code).not.toMatch(/a path like|a block comment/);
  });
});

describe('PillButton — the current chip in forced colours (G2 a11y, 2026-10-09)', () => {
  it('the ACTIVE state alone opts out and paints the system’s selection pair, its glow off and a CanvasText ring', () => {
    const active = tokensOf({ active: true }).tokens;
    for (const token of [
      'forced-colors:[forced-color-adjust:none]',
      'forced-colors:border-[color:Highlight]',
      'forced-colors:bg-[color:Highlight]',
      'forced-colors:text-[color:HighlightText]',
      'forced-colors:shadow-none',
      'forced-colors:focus-visible:outline-[color:CanvasText]',
    ]) {
      expect(active).toContain(token);
    }
  });

  it('a RESTING chip carries no forced-colours rule — it keeps every system colour the mode gives it', () => {
    expect(
      tokensOf().tokens.filter((token) => token.startsWith('forced-colors:')),
    ).toEqual([]);
  });
});
