import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  type ButtonMotion,
  type ButtonTone,
  type ButtonVariant,
} from './Button';

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

describe('Button — a label that wraps stays centred (2026-09-30)', () => {
  // The flex container centres the label's BOX; once §8.4 lets a label wrap,
  // only `text-center` centres its LINES — the doctor card's „Mai multe
  // despre mine" on a phone was laid out start-aligned inside a centred box
  // (sections/PersonnelCard D17). Pinned on every variant, and on the asChild
  // path the card takes, because the class rides the shared `base`.
  const variants = Object.keys({
    solid: true,
    outline: true,
    ghost: true,
  } satisfies Record<ButtonVariant, true>) as ButtonVariant[];

  it.each(variants)('variant %s centres its lines, not only its box', (v) => {
    render(<Button variant={v}>Mai multe despre mine</Button>);
    const tokens = screen.getByRole('button').className.split(/\s+/);
    expect(tokens).toContain('justify-center');
    expect(tokens).toContain('text-center');
  });

  it('carries it onto an asChild link', () => {
    render(
      <Button asChild size="lg">
        <a href="/ro/team/elena-marin/">Mai multe despre mine</a>
      </Button>,
    );
    const tokens = screen
      .getByRole('link', { name: 'Mai multe despre mine' })
      .className.split(/\s+/);
    expect(tokens).toContain('text-center');
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
  const tokensOf = (
    variant: ButtonVariant = 'solid',
    tone: ButtonTone = 'cta',
  ) => {
    const { unmount } = render(
      <Button variant={variant} tone={tone}>
        Ședință
      </Button>,
    );
    const cls = screen.getByRole('button').className;
    unmount();
    return { cls, tokens: cls.split(/\s+/).filter(Boolean) };
  };

  it('runs one calm shared fade clock, symmetric in and out', () => {
    const { tokens } = tokensOf();
    expect(tokens).toContain('[--fade:400ms]');
    expect(tokens).toContain('duration-(--fade)');
    expect(tokens).toContain('ease-in-out');
    expect(tokens).toContain('transition-[background-color,color,box-shadow]');
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

  // Every variant, exhaustively — the satisfies makes a 4th variant a type
  // error right here, the same auto-sweep guarantee GlyphButton's
  // module-scope tables give its motionCases matrix (G2 react, 2026-09-06: a
  // solid-only sweep would have let hover:shadow-md ship on ghost unseen).
  const sweptVariants = Object.keys({
    solid: true,
    outline: true,
    ghost: true,
  } satisfies Record<ButtonVariant, true>) as ButtonVariant[];
  // …and every FAMILY of every variant (the 2026-10-01 tone axis): the sweep
  // matrix is DERIVED from the two closed tables, so a third family joins it
  // the moment the file typechecks — GlyphButton.test's motionCases idiom.
  const sweptTones = Object.keys({
    cta: true,
    accent: true,
  } satisfies Record<ButtonTone, true>) as ButtonTone[];
  const sweptCases = sweptVariants.flatMap((variant) =>
    sweptTones.map((tone): [ButtonVariant, ButtonTone] => [variant, tone]),
  );

  // With box-shadow on the fade clock, EVERY box-shadow-painting utility is
  // an animation channel. Exactly these three spellings — solid's hairline —
  // are legitimate; the rest of the ring families (outer ring, ring-offset,
  // width escalations like inset-ring-4) stay banned alongside the shadows:
  // hover:ring-4 would be the fb-49/fb-50 pop respelled as a growing halo
  // (G2 react MEDIUM, 2026-09-06). KEEP-IN-SYNC with GlyphButton.test.tsx's
  // twin allowlist.
  const legitimateRingTokens = new Set([
    'inset-ring',
    'inset-ring-transparent',
    'hover:inset-ring-cta',
    // …and the hairline's lavender twin (the 2026-10-01 tone axis).
    'hover:inset-ring-accent',
  ]);

  it.each(sweptCases)(
    'the sweep is gone — one animation only (%s · %s)',
    (variant, tone) => {
      const { cls, tokens } = tokensOf(variant, tone);
      // Pseudo-elements are banned by PATTERN: a working sweep was re-added
      // on ::after, and again as [&::before]:…, past a before:-only ban.
      expect(cls).not.toMatch(/(^|:)(before|after):/);
      expect(cls).not.toMatch(/::(before|after)/);
      expect(tokens.filter((t) => /(^|:)(before|after):/.test(t))).toEqual([]);
      // …and nothing may move, spin, pulse or scale: color is the ONE
      // animation.
      expect(cls).not.toMatch(/transition-transform|transition-all/);
      expect(
        tokens.filter((t) =>
          /(^|:)(animate|scale|translate|rotate|skew)-/.test(t),
        ),
      ).toEqual([]);
      // box-shadow rides the fade clock for solid's inset-ring hairline
      // (owner, 2026-09-06) — which puts a shadow POP one utility away
      // again. The shadow-* family is banned wholesale (GlyphButton's fb-50
      // twin ban), `inset-` spelling included…
      expect(tokens.filter((t) => /(^|:)(inset-)?shadow(-|$)/.test(t))).toEqual(
        [],
      );
      // …and so is every ring spelling outside the three-token allowlist.
      expect(
        tokens.filter(
          (t) =>
            /(^|:)(inset-)?ring(-|$)/.test(t) && !legitimateRingTokens.has(t),
        ),
      ).toEqual([]);
      expect(tokens).not.toContain('overflow-hidden');
      expect(tokens).not.toContain('isolate');
      expect(tokens.filter((t) => t.startsWith('will-change'))).toEqual([]);
      expect(tokens.filter((t) => t.includes('--sweep'))).toEqual([]);
      // No hand-written hover-capability gate — Tailwind already wraps every
      // hover: utility in @media (hover:hover) on its own.
      expect(tokens.filter((t) => t.startsWith('motion-safe:'))).toEqual([]);
    },
  );

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

  // Record<ButtonVariant, Record<ButtonTone, …>> on purpose: a fourth variant
  // OR a third family cannot ship with zero coverage — the file stops
  // typechecking until the cell is classified here.
  const requiredTokens: Record<ButtonVariant, Record<ButtonTone, string[]>> = {
    // solid MIRRORS outline since the socials'-hover rework (owner decision
    // 2026-09-06): its hover face is outline's rest face — surface ground,
    // cta label, a 1px cta hairline (inset-ring, the layout-free twin of
    // outline's border) — and its press face is outline's press face. The
    // lavender cell (owner 2026-10-01) is the same face with the family's
    // three substitutions — cta → accent, cta-hover → accent-strong, the
    // hairline → inset-ring-accent — and nothing else (derived below).
    solid: {
      cta: [
        'bg-cta',
        'text-ink-inverse',
        'inset-ring',
        'inset-ring-transparent',
        'hover:bg-surface',
        'hover:text-cta',
        'hover:inset-ring-cta',
        'active:bg-cta-hover',
        'active:text-ink-inverse',
      ],
      accent: [
        'bg-accent',
        'text-ink-inverse',
        'inset-ring',
        'inset-ring-transparent',
        'hover:bg-surface',
        'hover:text-accent',
        'hover:inset-ring-accent',
        'active:bg-accent-strong',
        'active:text-ink-inverse',
      ],
    },
    outline: {
      cta: [
        'border-cta',
        'bg-surface',
        'text-cta',
        'hover:bg-line-subtle',
        'hover:text-cta-hover',
        'active:bg-line-subtle',
        'active:text-cta-hover',
      ],
      // …whose grey is ONE STEP DARKER than the green's (owner, 2026-10-01:
      // "on hover of vezi serviciile i want little darker shade of gray") —
      // `line`, not `line-subtle`; the derivation below declares it.
      accent: [
        'border-accent',
        'bg-surface',
        'text-accent',
        'hover:bg-line',
        'hover:text-accent-strong',
        'active:bg-line',
        'active:text-accent-strong',
      ],
    },
    ghost: {
      cta: [
        'bg-transparent',
        'text-ink',
        'hover:bg-line-subtle',
        'active:bg-line-subtle',
      ],
      accent: [
        'bg-transparent',
        'text-ink',
        'hover:bg-line-subtle',
        'active:bg-line-subtle',
      ],
    },
  };

  it.each(sweptCases)(
    'variant %s · tone %s carries its exact AA-checked color pair',
    (variant, tone) => {
      const { tokens } = tokensOf(variant, tone);
      // Positive coverage: without it, dropping text-ink-inverse from solid
      // leaves the label inheriting --ink on #008854 (3.28:1, SC 1.4.3 fail)
      // with the whole suite still green. The lavender pairs are MEASURED in
      // tests/unit/accent-census.test.ts, from the tokens' own lines.
      for (const required of requiredTokens[variant][tone]) {
        expect(tokens).toContain(required);
      }
    },
  );

  // Which variants hold their label color constant. outline was the one
  // deliberate crossfade (fb-38); solid joined it with the 2026-09-06
  // socials'-hover rework (see the mirror law in Button.tsx), leaving ghost
  // as the only constant-label tone.
  const constantTextVariants: Record<ButtonVariant, boolean> = {
    solid: false,
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

  it.each(sweptCases.filter(([variant]) => !constantTextVariants[variant]))(
    '%s · %s crossfades both colors with no rogue lerp utilities',
    (variant, tone) => {
      const { cls } = tokensOf(variant, tone);
      // Positive tokens live in the requiredTokens table above. The broad
      // utilities stay banned even though text DOES fade here: they also cover
      // outline-color, dragging the focus ring onto the clock. None of them
      // collides with the legitimate
      // transition-[background-color,color,box-shadow].
      expect(cls).not.toMatch(
        /transition-colors|transition-\[color\]|transition-all/,
      );
    },
  );

  // The family's one-step-darker ink — the outline's hover label and the
  // solid's press ground: cta-hover for the green, accent-strong for the
  // lavender (Button.tsx's THE TWO FAMILIES).
  const darker: Record<ButtonTone, string> = {
    cta: 'cta-hover',
    accent: 'accent-strong',
  };
  // …and the grey each outline greys TO: line-subtle for the green, ONE
  // STEP DARKER — `line` — for the lavender (owner, 2026-10-01: "on hover
  // of vezi serviciile i want little darker shade of gray"); the green cell
  // cannot follow, cta-hover reads 4.47:1 on `line` (Button.tsx's cell note).
  const grey: Record<ButtonTone, string> = {
    cta: 'line-subtle',
    accent: 'line',
  };

  it.each(sweptTones)(
    "solid's hover face is outline's rest face; outline's hover is its own grey (the mirror, one direction since 2026-09-20) — %s",
    (tone) => {
      // THE 2026-09-06 LAW as a DERIVED relation, never a third hardcoded list
      // (G2 react LOW, 2026-09-06): the variant-distinctive rest color tokens
      // of outline are computed by set difference — shared base/size tokens
      // (text-lg…) cancel out — and every one of them must reappear
      // hover:-prefixed on solid. Colors only — outline draws its line as a
      // real border while solid draws it as an inset-ring hairline (a border
      // arriving on hover would grow the auto-width box by 2px, i.e.
      // movement), so the line's channel is deliberately variant-local and not
      // part of the mirror. GlyphButton.test.tsx carries the derived twin.
      // THE OTHER DIRECTION ENDED 2026-09-20 (owner, hero pack round 3: "should
      // not turn green, but rather gray out a little"): outline no longer
      // fills with solid's rest face — it greys, and the label darkens one
      // step for SC 1.4.3 (Button.tsx's contract has the arithmetic). Both
      // families obey the same law — the lavender one since 2026-10-01.
      const solid = tokensOf('solid', tone).tokens;
      const outline = tokensOf('outline', tone).tokens;
      const restColors = (tokens: string[], other: string[]) =>
        tokens.filter((t) => /^(bg|text)-/.test(t) && !other.includes(t));
      const solidRest = restColors(solid, outline);
      const outlineRest = restColors(outline, solid);
      // Guard the derivation itself: an over-aggressive filter that returned []
      // would pass the loops below while proving nothing.
      expect(solidRest).not.toHaveLength(0);
      expect(outlineRest).not.toHaveLength(0);
      for (const rest of outlineRest) expect(solid).toContain(`hover:${rest}`);
      // outline's hover is NOT solid's rest any more — the grey face instead.
      for (const rest of solidRest)
        expect(outline).not.toContain(`hover:${rest}`);
      expect(outline).toContain(`hover:bg-${grey[tone]}`);
      expect(outline).toContain(`hover:text-${darker[tone]}`);
    },
  );
});

describe('Button — the two colour families (owner, 2026-10-01)', () => {
  // "there is a set of buttons i need you to make lilla, like the one that the
  // latest menu buttons are" — the `tone` axis: the SAME faces, cut from the
  // green CTA family (the default) or from the menu buttons' lavender
  // (Button.tsx's THE TWO FAMILIES). Styles are not loaded here; the utility
  // tokens are the contract, as in the describe above.
  const classesOf = (variant: ButtonVariant, tone?: ButtonTone): string => {
    const { unmount } = render(
      <Button variant={variant} tone={tone}>
        Ședință
      </Button>,
    );
    const cls = screen.getByRole('button').className;
    unmount();
    return cls;
  };
  const variants = Object.keys({
    solid: true,
    outline: true,
    ghost: true,
  } satisfies Record<ButtonVariant, true>) as ButtonVariant[];

  it.each(variants)(
    '%s defaults to the green: a call site that says nothing is byte-identical to tone="cta"',
    (variant) => {
      expect(classesOf(variant)).toBe(classesOf(variant, 'cta'));
    },
  );

  it('ghost paints with ink and ignores the family', () => {
    expect(classesOf('ghost', 'accent')).toBe(classesOf('ghost', 'cta'));
  });

  it.each(['solid', 'outline'] as const)(
    "%s: the lavender face is the green face with the family's substitutions — the three hues, and outline's darker grey — and nothing else",
    (variant) => {
      // DERIVED, never a third list: translate the green cell token by token
      // — cta-hover → accent-strong FIRST (it contains `cta`), then cta →
      // accent — and the result must equal the lavender cell exactly, so an
      // undeclared substitution (a changed ground, a dropped hairline) cannot
      // hide in the requiredTokens table.
      const green = classesOf(variant, 'cta').split(/\s+/);
      const lavender = classesOf(variant, 'accent').split(/\s+/);
      const translated = green.map((t) =>
        t
          .replace(/-cta-hover(?![\w-])/g, '-accent-strong')
          .replace(/-cta(?![\w-])/g, '-accent')
          // THE FOURTH SUBSTITUTION, outline's alone (owner, 2026-10-01: "on
          // hover of vezi serviciile i want little darker shade of gray"):
          // the lavender outline greys to `line`, one step darker than the
          // green's `line-subtle`. Declared here WITH its scope, so it is the
          // only way the two cells may differ beyond the hue; the green cell
          // cannot take the darker grey (cta-hover reads 4.47:1 on it, under
          // 4.5:1 — Button.tsx's cell note; accent-census measures the
          // lavender's 6.33:1).
          .replace(
            /^(hover|active):bg-line-subtle$/,
            variant === 'outline' ? '$1:bg-line' : '$&',
          ),
      );
      expect(lavender).toEqual(translated);
      expect(lavender).not.toEqual(green);
      // …and the two families never bleed into each other.
      expect(lavender.filter((t) => /cta/.test(t))).toEqual([]);
      expect(green.filter((t) => /accent/.test(t))).toEqual([]);
    },
  );

  it('never reaches the DOM as an attribute — on a button or on an asChild link', () => {
    render(<Button tone="accent">Mai multe despre mine</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('tone');
    render(
      <Button tone="accent" asChild>
        <a href="/ro/team/elena-marin/">Vezi profilul</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Vezi profilul' });
    expect(link).not.toHaveAttribute('tone');
    // The family rides onto the child with the rest of the clothes.
    expect(link.className.split(/\s+/)).toContain('bg-accent');
  });
});

describe('Button — the jump (owner, 2026-10-01)', () => {
  // "like in old webpage i want the book consultation, see our services, call
  // hover button in bottom right and whatsapp button, contact button in top
  // bar, more about me button in doctor card, to have that jump at you
  // animation on hover. this should not affect buttons from footer" — the
  // `motion` axis (Button.tsx's THE JUMP): the old site's hover:scale-105 on
  // its own 200ms ease-out clock, opt-in per call site, the fade clock and
  // every colour bundle untouched. Token contract, as in the describes above.
  const tokensOf = (
    motion: ButtonMotion | undefined,
    variant: ButtonVariant,
    tone: ButtonTone,
  ): string[] => {
    const { unmount } = render(
      <Button variant={variant} tone={tone} motion={motion}>
        Programează o consultație
      </Button>,
    );
    const tokens = screen
      .getByRole('button')
      .className.split(/\s+/)
      .filter(Boolean);
    unmount();
    return tokens;
  };
  // Every variant in every family, DERIVED from the two closed tables so a
  // new member joins the sweep the moment the file typechecks.
  const variants = Object.keys({
    solid: true,
    outline: true,
    ghost: true,
  } satisfies Record<ButtonVariant, true>) as ButtonVariant[];
  const tones = Object.keys({
    cta: true,
    accent: true,
  } satisfies Record<ButtonTone, true>) as ButtonTone[];
  const cases = variants.flatMap((variant) =>
    tones.map((tone): [ButtonVariant, ButtonTone] => [variant, tone]),
  );
  /** The still trio — the one colour fade, exactly as the base row carried it before the axis. */
  const STILL = [
    'transition-[background-color,color,box-shadow]',
    'duration-(--fade)',
    'ease-in-out',
  ];
  /** What the jump adds — and the ONLY thing it adds (the lists, then the scale pair, then the reduced-motion hold). */
  const JUMP = [
    '[--jump:200ms]',
    '[transition-property:background-color,color,box-shadow,scale]',
    '[transition-duration:var(--fade),var(--fade),var(--fade),var(--jump)]',
    '[transition-timing-function:ease-in-out,ease-in-out,ease-in-out,ease-out]',
    'hover:scale-105',
    'active:scale-100',
    'motion-reduce:hover:scale-100',
  ];
  const sorted = (tokens: string[]) => [...tokens].sort();

  it.each(cases)(
    '%s · %s: a call site that says nothing is byte-identical to motion="still", which holds still',
    (variant, tone) => {
      const still = tokensOf('still', variant, tone);
      expect(tokensOf(undefined, variant, tone)).toEqual(still);
      for (const t of STILL) expect(still).toContain(t);
      expect(
        still.filter((t) =>
          /scale|--jump|transition-(property|duration|timing)/.test(t),
        ),
      ).toEqual([]);
    },
  );

  it.each(cases)(
    '%s · %s: the jump swaps the still trio for the two-clock lists and the scale pair — nothing else changes',
    (variant, tone) => {
      const still = tokensOf('still', variant, tone);
      const jump = tokensOf('jump', variant, tone);
      // Set algebra, so an edit anywhere else in the class list fails here:
      // jump = still − STILL + JUMP, exactly.
      expect(sorted(jump)).toEqual(
        sorted([...still.filter((t) => !STILL.includes(t)), ...JUMP]),
      );
      // The fade's number, the press snap and the reduced-motion escape are
      // the base row's and now govern the scale too.
      for (const t of [
        '[--fade:400ms]',
        'active:duration-0',
        'motion-reduce:transition-none',
      ]) {
        expect(jump).toContain(t);
      }
    },
  );

  it.each(cases)(
    '%s · %s: the jump keeps every other ban of the calm-fade contract',
    (variant, tone) => {
      const jump = tokensOf('jump', variant, tone);
      const cls = jump.join(' ');
      // The old pop's second half — the growing shadow — is NOT ported.
      expect(jump.filter((t) => /(^|:)(inset-)?shadow(-|$)/.test(t))).toEqual(
        [],
      );
      // Scale is the one movement, in exactly three spellings; nothing
      // translates, rotates, skews or animates.
      expect(
        jump.filter((t) => /(^|:)(animate|translate|rotate|skew)-/.test(t)),
      ).toEqual([]);
      expect(sorted(jump.filter((t) => /(^|:)scale-/.test(t)))).toEqual([
        'active:scale-100',
        'hover:scale-105',
        'motion-reduce:hover:scale-100',
      ]);
      // No shorthand that would drag the focus ring or the border onto a
      // clock, no pseudo-element channel.
      expect(cls).not.toMatch(
        /transition-all|transition-transform|transition-colors/,
      );
      expect(cls).not.toMatch(/(^|:)(before|after):|::(before|after)/);
      // And no `duration-*` / `ease-*` UTILITY beside the lists: two
      // utilities on one property are decided by sheet order (Button.tsx's
      // THE JUMP) — the arbitrary-property lists are the clocks' one spelling.
      expect(
        jump.filter(
          (t) =>
            !t.startsWith('[') &&
            /(^|:)duration-/.test(t) &&
            t !== 'active:duration-0',
        ),
      ).toEqual([]);
      expect(
        jump.filter((t) => !t.startsWith('[') && /(^|:)ease-/.test(t)),
      ).toEqual([]);
    },
  );

  it('never reaches the DOM as an attribute — on a button or on an asChild link, which jumps too', () => {
    render(<Button motion="jump">Contact</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('motion');
    render(
      <Button motion="jump" asChild>
        <a href="/ro/team/elena-marin/">Mai multe despre mine</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Mai multe despre mine' });
    expect(link).not.toHaveAttribute('motion');
    expect(link.className.split(/\s+/)).toContain('hover:scale-105');
  });
});
