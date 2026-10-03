import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Heading, type HeadingSize, type HeadingTone } from './Heading';

// Role-based queries wherever a role exists (§3, §9): the asChild cases are
// queried as heading/link — exactly what a screen reader announces. The
// default host is a <p>, which has no such role, so it is reached through its
// text and the ABSENCE of any heading role is asserted instead (I2: the atom
// never fakes document structure). Fixtures are Romanian with diacritics
// (§15.7) — the real Footer/Header strings this atom will carry; the section
// step's fixture is the title SectionHeading opens with, by the same rule.

// I1 · zero-diff-rewire: the title step renders EXACTLY this and nothing else.
// The four rewire call sites (Footer ×3, Header brand) are accepted on zero
// visual diff, so any extra utility — leading-*, tracking-*, text-balance, a
// margin — is a defect, not polish. `cx` is a plain join(' ') (lib/cx/cx.ts), so
// byte-equality is deterministic: toBe here, never toContain.
const TITLE_CLASSES = 'font-display text-xl text-ink-strong';

// The second step (D2, 2026-09-01), held to the same byte-exact discipline for
// a different reason: it has no baseline to keep identical, but the two
// utilities it deliberately DROPS from the old site's h2 —
// `font-bold tracking-tight` — plus the `sm:text-4xl` self-scaling §6.5 bans
// could only ever come back unnoticed. Equality is what keeps them out.
const SECTION_CLASSES = 'font-display text-3xl text-ink-strong';

// I1-page · the page-hero step, measured in by the 404 band (owner,
// 2026-09-07 "make both text and heading larger"): 36px, one additive step
// over section — same face, same ink, nothing else.
const PAGE_CLASSES = 'font-display text-4xl text-ink-strong';

// I1-hero · the fluid slogan step, measured in by sections/Hero (owner
// dispatch 2026-09-19, epic #103): 32px floor, 3.5vw slope, 72px cap — the
// old site's four-prefix staircase (30/36/60/72) as one curve, so no `sm:`/
// `lg:` self-scaler can return under a different spelling. `/tight` is the
// step's own line-height (an arbitrary size carries none), not an extra
// utility — the header argues it; equality here keeps it exactly that.
// THE h1 STEP since §15.24 (the doctor page's name, the 404 title) — which is
// why the opener's 2026-10-01 reshape joined BESIDE it (next) and this string
// is byte-identical to the day it was measured.
const HERO_CLASSES =
  'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight text-ink-strong';

// I1-slogan · the Home opener's slogan step, joined on the owner's 2026-10-01
// word ("leave on phone as is, on tablet is perfect, but adapt text component
// raports in sizing for laptop and desktop as on tablet"): one expression in
// two stretches — `hero`'s curve to the tablet (its floor, its slope), the
// tablet's own ratio from it (`5.5833vw` = 42.88 / 768) — held at 6.7rem, the
// 1920px value. Pinned byte-exactly like its elders, and pinned AGAINST
// `hero` below: the first stretch must stay `hero`'s own.
const SLOGAN_CLASSES =
  'font-display text-[clamp(2rem,max(1rem+3.5vw,5.5833vw),6.7rem)]/tight text-ink-strong';

// I1-band · the h2 step (the doctor-pages run's D48, 2026-09-26 — §15.24's
// "next order of heading height" under the h1): 30px on a column narrower than
// the container's `@md` step (28rem), 36px from it. The ONE container-
// responsive row on the axis, pinned byte-exactly like its elders so a viewport
// prefix, a bold or a third size can never slip into it unnoticed.
const BAND_CLASSES = 'font-display text-3xl @md:text-4xl text-ink-strong';

// Record<HeadingSize, …> on purpose: this union is BUILT to grow, so a new
// step must not be able to ship with zero
// coverage — the file stops typechecking until the member is classified here.
// That is the compile-time half of the additive-growth rule (§6.6); the
// runtime half is the per-step equality test below.
const expectedClasses: Record<HeadingSize, string> = {
  title: TITLE_CLASSES,
  section: SECTION_CLASSES,
  page: PAGE_CLASSES,
  hero: HERO_CLASSES,
  slogan: SLOGAN_CLASSES,
  band: BAND_CLASSES,
};

describe('Heading — the title step (I1 zero-diff-rewire, I2 element neutrality)', () => {
  it('renders a plain <p> wearing exactly the title classes and no heading role', () => {
    render(<Heading>Servicii și prețuri</Heading>);
    const title = screen.getByText('Servicii și prețuri');
    expect(title.tagName).toBe('P');
    expect(title.className).toBe(TITLE_CLASSES);
    // A real h1–h6 is always an explicit consumer act via asChild — the atom
    // can never invent an outline slot (the Footer's titles are <p> today).
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders size="title" byte-identically to the bare call (I3 default pinned)', () => {
    // The default stays 'title' FOREVER: additive union growth must never
    // change what a bare <Heading> looks like (§6.6 silent-break guard).
    const { unmount } = render(<Heading>Servicii și prețuri</Heading>);
    const bare = screen.getByText('Servicii și prețuri').className;
    unmount();
    render(<Heading size="title">Servicii și prețuri</Heading>);
    expect(screen.getByText('Servicii și prețuri').className).toBe(bare);
  });
});

describe('Heading — the section step (D2, the SectionHeading size)', () => {
  it('renders a plain <p> wearing exactly the section classes and no heading role', () => {
    render(<Heading size="section">Vizitează clinica noastră</Heading>);
    const title = screen.getByText('Vizitează clinica noastră');
    expect(title.tagName).toBe('P');
    // toBe, never toContain — equality is the only assertion that can prove a
    // dropped utility STAYED dropped. The old site's section title measured
    // `text-3xl font-bold tracking-tight sm:text-4xl`; D2 keeps the 30px step
    // alone, so a returning `sm:`/`lg:` self-scaler (§6.5), a bold, a
    // tracking-*, a leading-* or any margin (§6.4) fails right here.
    expect(title.className).toBe(SECTION_CLASSES);
    // I2 is a property of the atom, not of one step: size never invents an
    // outline slot — a real h2 is always the consumer's asChild act.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('leaves the bare <Heading> on the title step (default pinned FOREVER)', () => {
    // The lane's whole claim in one assertion: growing the union moves nothing
    // that already renders, which is why every existing baseline stays
    // byte-identical. I3 above pins bare ≡ size="title" as a pair; this pins it
    // against the NEW member by name, so a future edit that flipped the default
    // to 'section' fails loudly here instead of silently restyling every
    // existing call site at once (§6.6).
    render(<Heading>Vizitează clinica noastră</Heading>);
    const bare = screen.getByText('Vizitează clinica noastră');
    expect(bare.className).toBe(TITLE_CLASSES);
    expect(bare.className).not.toBe(SECTION_CLASSES);
  });

  it('merges the caller className LAST, after the section classes', () => {
    // §6.8 unchanged by the new step: the parent's spacing/alignment rides on
    // top of whichever step it asked for, and never restyles its internals.
    render(
      <Heading size="section" className="pb-8 text-center">
        Vizitează clinica noastră
      </Heading>,
    );
    expect(screen.getByText('Vizitează clinica noastră').className).toBe(
      `${SECTION_CLASSES} pb-8 text-center`,
    );
  });

  it('wears the section classes on an asChild <h2> — the SectionHeading shape', () => {
    // The measured consumer arrives exactly like this: a real outline slot
    // asking for the step. Both branches consume the same ownClasses, but only
    // a rendered assertion proves the asChild branch honors `size` rather than
    // hardcoding one step's row (G2 2026-09-01 — the one path no other test
    // sampled).
    render(
      <Heading asChild size="section">
        <h2 className="child-own">Vizitează clinica noastră</h2>
      </Heading>,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Vizitează clinica noastră',
    });
    expect(heading.className).toBe(`${SECTION_CLASSES} child-own`);
  });
});

describe('Heading — the page step (the 404-measured hero size, 2026-09-07)', () => {
  it('renders size="page" wearing exactly the page classes', () => {
    // Same equality discipline as the elders: toBe, never toContain — one
    // returning self-scaler, bold, tracking or margin fails right here. The
    // fixture is the step's own measuring consumer, the 404 hero (§15.7:
    // Romanian, diacritics-bearing).
    render(<Heading size="page">404: Această pagină nu există</Heading>);
    const hero = screen.getByText('404: Această pagină nu există');
    expect(hero.tagName).toBe('P');
    expect(hero.className).toBe(PAGE_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('Heading — the hero step (the fluid slogan size, 2026-09-19)', () => {
  it('renders size="hero" wearing exactly the hero classes on a plain <p>', () => {
    // The measuring consumer's own fixture: the old site's first slogan,
    // Romanian with diacritics (§15.7). A <p> host on purpose — the Hero's
    // slogans are display text inside the slides, never the page's h1 (that
    // one is static and outside the ring, lib/rotation's law).
    render(
      <Heading size="hero">
        O clinică stomatologică modernă pentru toată familia
      </Heading>,
    );
    const slogan = screen.getByText(
      'O clinică stomatologică modernă pentru toată familia',
    );
    expect(slogan.tagName).toBe('P');
    expect(slogan.className).toBe(HERO_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('carries no viewport prefix — the curve replaced the staircase', () => {
    // The old site's `text-3xl sm:text-4xl lg:text-6xl xl:text-7xl` is the
    // §6.5 self-scaling smell `title` refused on day one; a fluid clamp is the
    // step's whole answer to it, so a `sm:`/`md:`/`lg:`/`xl:` token returning
    // to this row is a regression by definition.
    expect(HERO_CLASSES).not.toMatch(/\b(sm|md|lg|xl|2xl):/);
  });
});

describe('Heading — the slogan step (the Home opener’s, 2026-10-01)', () => {
  it('renders size="slogan" wearing exactly the slogan classes on a plain <p>', () => {
    // The measuring consumer's own fixture: the clinic's first slogan
    // (lib/hero-slides, Romanian with diacritics — §15.7), on the <p> host
    // the Hero's slides use (never the page's h1, which stays outside the
    // ring).
    render(
      <Heading size="slogan">Bine ai venit! Te așteptăm cu drag.</Heading>,
    );
    const slogan = screen.getByText('Bine ai venit! Te așteptăm cu drag.');
    expect(slogan.tagName).toBe('P');
    expect(slogan.className).toBe(SLOGAN_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('runs in two stretches — hero’s curve to the tablet, the tablet’s own ratio from it — and leaves hero byte-identical', () => {
    // The owner's "leave on phone as is, on tablet is perfect" is the first
    // stretch: hero's floor and hero's slope, read OUT OF HERO_CLASSES rather
    // than re-typed, so the two curves cannot drift apart below the tablet;
    // "as on tablet" for laptop and desktop is the second, 42.88 / 768 =
    // 5.5833 % of the viewport; the cap is the 1920px value (6.7rem =
    // 107.2px). The SloganStep story's play is where the ENGINE's reading of
    // the curve is pinned (a nested max() Tailwind failed to normalise would
    // be invisible to a class assertion).
    const curveOf = (classes: string): string =>
      /text-\[(.+?)\]\/tight/.exec(classes)?.[1] ?? '';
    const [, floor, slope, cap] =
      /^clamp\((.+?),(.+?),(.+?)\)$/.exec(curveOf(HERO_CLASSES)) ?? [];
    expect([floor, slope, cap]).toEqual(['2rem', '1rem+3.5vw', '4.5rem']);
    expect(curveOf(SLOGAN_CLASSES)).toBe(
      `clamp(${floor},max(${slope},5.5833vw),6.7rem)`,
    );
    expect(42.88 / 768).toBeCloseTo(0.055833, 6);
    expect(0.055833 * 1920).toBeCloseTo(6.7 * 16, 0);
    // Everything but the curve is hero's, token for token.
    expect(
      SLOGAN_CLASSES.replace(curveOf(SLOGAN_CLASSES), curveOf(HERO_CLASSES)),
    ).toBe(HERO_CLASSES);
  });

  it('carries no viewport prefix either — one curve, never a staircase', () => {
    expect(SLOGAN_CLASSES).not.toMatch(/\b(sm|md|lg|xl|2xl):/);
  });
});

describe('Heading — the band step (the h2 step, D48, 2026-09-26)', () => {
  // A token that carries a variant: `@md:text-4xl`, `sm:text-4xl`. The tone
  // rows' arbitrary properties (`[-webkit-text-stroke:…]`) open with a bracket
  // and never match; only the size rows are sampled below anyway.
  const variantTokens = (classes: string) =>
    classes.split(' ').filter((token) => /^@?[a-z0-9-]+:/.test(token));

  it('renders size="band" wearing exactly the band classes on a plain <p>', () => {
    // The narrow consumer's own words: the schedule card's title, the 320px
    // column where the step rests at 30px (§15.7: Romanian, diacritics).
    render(<Heading size="band">Când mă găsiți la clinică</Heading>);
    const title = screen.getByText('Când mă găsiți la clinică');
    expect(title.tagName).toBe('P');
    expect(title.className).toBe(BAND_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('wears the band classes on an asChild <h2> — the SectionHeading shape', () => {
    // How every consumer arrives (SectionHeading's openers, the price menu's
    // title, PersonnelCard's level-2 names): a real outline slot asking for
    // the step, the child's own classes after the atom's.
    render(
      <Heading asChild size="band">
        <h2 className="child-own">Cursuri și specializări</h2>
      </Heading>,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Cursuri și specializări',
    });
    expect(heading.className).toBe(`${BAND_CLASSES} child-own`);
  });

  it.each(Object.keys(expectedClasses) as HeadingSize[])(
    'size "%s" carries a responsive token only if it is the band step',
    (size) => {
      // The axis stays static everywhere else: `hero` answers the page with a
      // clamp, never a variant; the three fixed steps answer nothing at all.
      // `band` is the ONE row that reads its surroundings, and it reads them
      // through exactly one container step.
      expect(variantTokens(expectedClasses[size])).toEqual(
        size === 'band' ? ['@md:text-4xl'] : [],
      );
    },
  );

  it('responds to its CONTAINER, never to the viewport (§6.5)', () => {
    // `@md:` queries the nearest ancestor container — the band's
    // ui/Container column, a ui/Card — which is the component-responsiveness
    // §6.5 prescribes. A bare `md:`/`sm:` would be the viewport self-scaling
    // `title` refused on day one (the old site's `sm:text-4xl`).
    const tokens = variantTokens(BAND_CLASSES);
    expect(tokens.every((token) => token.startsWith('@'))).toBe(true);
    expect(tokens.some((token) => /^(sm|md|lg|xl|2xl):/.test(token))).toBe(
      false,
    );
  });

  it('invents no size: it rests on the section step and steps up to the page step', () => {
    // §6.6 — one step per measured consumer, never an invented number. The
    // band row is the section row below 28rem and the page row's size from
    // it: remove the variant and the section string is left byte for byte;
    // strip the prefix and it is the page row's own size token.
    const tokens = BAND_CLASSES.split(' ');
    expect(tokens.filter((token) => token !== '@md:text-4xl').join(' ')).toBe(
      SECTION_CLASSES,
    );
    expect(PAGE_CLASSES.split(' ')).toContain(
      '@md:text-4xl'.replace('@md:', ''),
    );
  });
});

describe('Heading — the tone axis (inverse ink for the scrim, 2026-09-19)', () => {
  // Record<HeadingTone, …> on purpose, the size table's twin: a third ink
  // cannot ship with zero coverage — this file stops typechecking until it
  // is classified here.
  const expectedInk: Record<HeadingTone, string> = {
    default: 'text-ink-strong',
    inverse: 'text-ink-inverse',
    // The old page's slogan face (2026-09-20): the same white ink, bold and
    // tight, the accent stroke painted behind the fill.
    'inverse-stroked':
      'text-ink-inverse font-bold tracking-tight [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill]',
    // The stroke alone on the plain weight (2026-09-21, the Hero's third face).
    'inverse-outlined':
      'text-ink-inverse [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill]',
    // The old page's slogan as the owner sees it (2026-10-01): the outlined
    // face — the plain weight, his "drop the bold." on the pack — plus a
    // lilac halo, two centred em-scaled text-shadows mixed from the display
    // lilac. The Hero's default face.
    'inverse-aura':
      'text-ink-inverse [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill] [text-shadow:0_0_0.28em_color-mix(in_srgb,var(--color-accent-decorative)_60%,transparent),0_0_0.08em_color-mix(in_srgb,var(--color-accent-decorative)_40%,transparent)]',
    // The lilac year labels (2026-09-25, the doctor-pages run's D16): the
    // accent ink with its weight — 4.44:1 on the page ground is large-text
    // contrast only, and bold is what makes the 20px title step large.
    accent: 'font-bold text-accent-decorative',
    // Their REST twin (2026-09-26, the run's D35): the same weight in the
    // muted ink, so a year switching between the two never reflows.
    'accent-idle': 'font-bold text-ink-muted',
  };

  // Pin the union itself, exactly as the size axis does: widening it to
  // `string` would keep every Record compiling with stale rows.
  expectTypeOf<HeadingTone>().toEqualTypeOf<
    | 'default'
    | 'inverse'
    | 'inverse-stroked'
    | 'inverse-outlined'
    | 'inverse-aura'
    | 'accent'
    | 'accent-idle'
  >();

  it.each(Object.keys(expectedInk) as HeadingTone[])(
    'tone "%s" swaps only the ink — size classes first, ink last, nothing else',
    (tone) => {
      render(
        <Heading size="hero" tone={tone}>
          O echipă care ascultă, pe limba ta
        </Heading>,
      );
      expect(
        screen.getByText('O echipă care ascultă, pe limba ta').className,
      ).toBe(
        `font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight ${expectedInk[tone]}`,
      );
    },
  );

  it('tone "inverse-aura" is the outlined face plus EXACTLY one token — a centred, em-scaled halo in the display lilac (2026-10-01)', () => {
    // The owner's description, decoded: "white on interior" = the inverse
    // ink · "that lilla contour" = the 2px stroke, at the plain weight since
    // his "drop the bold." on the pack = 'inverse-outlined' to the letter ·
    // "a lila aura shadow … around letters" = the one token this row adds.
    // Pinned as a RELATION so the two faces can never drift apart: every
    // token of the stroked face is worn, and the only new one is a
    // text-shadow of two centred layers, both in em (the share of the letter,
    // not a px cloud), both mixed from the display lilac — never a pasted
    // rgb, so §15.1's hue confirm re-tints the halo with the aura token.
    const outlined = expectedInk['inverse-outlined'].split(' ');
    const aura = expectedInk['inverse-aura'].split(' ');
    expect(aura.slice(0, outlined.length)).toEqual(outlined);
    expect(aura).not.toContain('font-bold');
    const [halo, ...rest] = aura.slice(outlined.length);
    expect(rest).toEqual([]);
    expect(halo).toMatch(/^\[text-shadow:/);
    const layers = halo.slice('[text-shadow:'.length, -1).split('),');
    expect(layers).toHaveLength(2);
    for (const layer of layers) {
      expect(layer).toMatch(
        /^0_0_0\.\d+em_color-mix\(in_srgb,var\(--color-accent-decorative\)_\d+%,transparent\)?$/,
      );
    }
    expect(halo).not.toMatch(/\brgba?\(|#[0-9a-f]{3,6}\b/i); // mixed from the token, never pasted
  });

  it('leaves every elder byte-identical: the bare call is tone="default"', () => {
    // The tone axis joined AFTER four steps had shipped with their ink baked
    // into the size row; splitting the tables must not move a single existing
    // call site (§6.6). Bare ≡ explicit default, and both ≡ the pinned string.
    const { unmount } = render(<Heading>Servicii și prețuri</Heading>);
    const bare = screen.getByText('Servicii și prețuri').className;
    unmount();
    render(<Heading tone="default">Servicii și prețuri</Heading>);
    expect(screen.getByText('Servicii și prețuri').className).toBe(bare);
    expect(bare).toBe(TITLE_CLASSES);
  });

  it('is orthogonal to size — any step may wear the inverse ink', () => {
    render(
      <Heading size="section" tone="inverse">
        Vizitează clinica noastră
      </Heading>,
    );
    expect(screen.getByText('Vizitează clinica noastră').className).toBe(
      'font-display text-3xl text-ink-inverse',
    );
  });

  it('is orthogonal to size for the accent ink too — the DoctorCourses <h3>', () => {
    // The measuring consumer's own shape (D16): a real <h3> handed in through
    // asChild at the title step, a year as its whole text. Size row first,
    // the tone row after it, the child's own classes (none here) last — so
    // the title step's `font-display text-xl` is untouched and the ink swaps
    // in whole, weight included.
    render(
      <Heading size="title" tone="accent" asChild>
        <h3>2024</h3>
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: '2024' }).className,
    ).toBe('font-display text-xl font-bold text-accent-decorative');
  });

  it.each(Object.keys(expectedClasses) as HeadingSize[])(
    'tone "accent" is bold at the "%s" step — the weight never leaves the ink (D16)',
    (size) => {
      // §15.1 licenses the accent for LARGE display text only; at the 20px
      // title step the bold IS what makes it large (≥ 18.67px bold), and at
      // every larger step it keeps the look one face. A future edit that moved
      // `font-bold` out of the tone row (onto one caller's className, say)
      // would leave the other call sites under 4.5:1 at body weight.
      render(
        <Heading size={size} tone="accent">
          Formare continuă
        </Heading>,
      );
      const tokens = screen.getByText('Formare continuă').className.split(' ');
      expect(tokens).toContain('font-bold');
      expect(tokens).toContain('text-accent-decorative');
      expect(tokens).not.toContain('text-ink-strong');
    },
  );

  it.each(Object.keys(expectedClasses) as HeadingSize[])(
    'tones "accent" and "accent-idle" differ in the INK alone at the "%s" step — a lit/unlit pair never reflows (D35)',
    (size) => {
      // The course timeline switches ONE year between the two as the visitor
      // scrolls. Anything but the colour changing — the weight above all —
      // would re-measure the line and nudge every course under it. So the
      // two class strings must be the same tokens with exactly one swapped.
      const { unmount } = render(
        <Heading size={size} tone="accent">
          2024
        </Heading>,
      );
      const lit = screen.getByText('2024').className.split(' ');
      unmount();
      render(
        <Heading size={size} tone="accent-idle">
          2024
        </Heading>,
      );
      const rest = screen.getByText('2024').className.split(' ');

      expect(rest).toContain('font-bold');
      expect(rest).toContain('text-ink-muted');
      expect(lit.filter((token) => !rest.includes(token))).toEqual([
        'text-accent-decorative',
      ]);
      expect(rest.filter((token) => !lit.includes(token))).toEqual([
        'text-ink-muted',
      ]);
    },
  );

  it('keeps the caller className LAST, after the ink', () => {
    render(
      <Heading size="hero" tone="inverse" className="text-center">
        O echipă care ascultă, pe limba ta
      </Heading>,
    );
    expect(
      screen.getByText('O echipă care ascultă, pe limba ta').className,
    ).toBe(
      `${HERO_CLASSES.replace('text-ink-strong', 'text-ink-inverse')} text-center`,
    );
  });
});

describe('Heading — the size axis, exhaustively (§6.6 growth guard)', () => {
  // The one drift the Record cannot see: WIDENING the axis. `HeadingSize =
  // string` (or `| (string & {})`) keeps the impl Record, the test Record and
  // the stories' `satisfies` all compiling with stale rows while
  // `sizeClasses[x]` goes undefined at runtime. So pin the union itself —
  // additive growth edits this line consciously, in the same commit as the new
  // Record row (the Eyebrow pin's growth-direction twin; runs at typecheck,
  // costs nothing at runtime).
  expectTypeOf<HeadingSize>().toEqualTypeOf<
    'title' | 'section' | 'band' | 'page' | 'hero' | 'slogan'
  >();

  it.each(Object.keys(expectedClasses) as HeadingSize[])(
    'size "%s" emits exactly its own class set and nothing else',
    (size) => {
      render(<Heading size={size}>Vizitează clinica noastră</Heading>);
      expect(screen.getByText('Vizitează clinica noastră').className).toBe(
        expectedClasses[size],
      );
    },
  );
});

describe('Heading — §6 hygiene (I4)', () => {
  it('merges the caller className LAST — parent spacing rides on top', () => {
    // The Footer brand row: `pb-8 text-center` is parent spacing/alignment
    // routed through the atom (§6.4 + §6.8), never the atom's own.
    render(<Heading className="pb-8 text-center">Servicii și prețuri</Heading>);
    expect(screen.getByText('Servicii și prețuri').className).toBe(
      `${TITLE_CLASSES} pb-8 text-center`,
    );
  });

  it('spreads native props onto the element and leaks none of its own', () => {
    render(
      <Heading id="footer-nav-title" data-column="nav">
        Servicii și prețuri
      </Heading>,
    );
    const title = screen.getByText('Servicii și prețuri');
    // `id` is load-bearing, not decoration: the Footer's <nav> names itself
    // through aria-labelledby pointing at this exact title.
    expect(title).toHaveAttribute('id', 'footer-nav-title');
    expect(title).toHaveAttribute('data-column', 'nav');
    expect(title).not.toHaveAttribute('size');
    expect(title).not.toHaveAttribute('aschild');
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Heading ref={ref}>Servicii și prețuri</Heading>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('Heading — asChild (shared ui/slot engine)', () => {
  it('lets an <h2> child BECOME the heading — same look, real outline slot', () => {
    render(
      <Heading asChild id="titlu-echipa">
        <h2 className="child-own">Echipa noastră</h2>
      </Heading>,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Echipa noastră',
    });
    // Own classes first, the child's own preserved after them (slot.ts merge
    // order) — the child keeps everything it declares.
    expect(heading.className).toBe(`${TITLE_CLASSES} child-own`);
    // …and props merge DOWN when the child leaves them undefined: the id a
    // future SectionHeading's aria-labelledby will point at.
    expect(heading).toHaveAttribute('id', 'titlu-echipa');
  });

  it('lets an <a> child BECOME the heading — the Header brand shape', () => {
    // Header.tsx:148 wears these classes ON the anchor today; cloning them
    // onto the child is what makes that rewire byte-identical in the DOM.
    render(
      <Heading asChild>
        <a href="#acasa">Premium Smile</a>
      </Heading>,
    );
    const brand = screen.getByRole('link', { name: 'Premium Smile' });
    expect(brand).toHaveAttribute('href', '#acasa');
    expect(brand.className).toBe(TITLE_CLASSES);
  });

  // HeadingProps types ref for the <p> branch; in asChild mode it reaches the
  // child element instead — the cast below is the test acknowledging that.
  const asParagraphRef = (ref: Ref<HTMLHeadingElement>) =>
    ref as unknown as Ref<HTMLParagraphElement>;

  it("forwards Heading's ref to the child element (React 19 ref-in-props)", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading asChild ref={asParagraphRef(ref)}>
        <h2>Echipa noastră</h2>
      </Heading>,
    );
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("the child's own ref wins over Heading's (children win conflicts)", () => {
    // React 19 exposes ref inside props, so the engine's child-wins merge
    // covers it like any other prop — never disallow it (slot.ts:70-74).
    const childRef = createRef<HTMLHeadingElement>();
    const headingRef = createRef<HTMLHeadingElement>();
    render(
      <Heading asChild ref={asParagraphRef(headingRef)}>
        <h2 ref={childRef}>Echipa noastră</h2>
      </Heading>,
    );
    expect(childRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(headingRef.current).toBeNull();
  });

  it('throws its own actionable, Heading-named message for bad children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Heading asChild>doar text</Heading>)).toThrow(
      /Heading with asChild expects exactly one element child/,
    );
    expect(() =>
      render(
        <Heading asChild>
          <h2>unu</h2>
          <h2>doi</h2>
        </Heading>,
      ),
    ).toThrow(/Heading with asChild expects exactly one element child/);
    silence.mockRestore();
  });
});
