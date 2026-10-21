import {
  createRef,
  type CSSProperties,
  type ReactElement,
  type Ref,
} from 'react';
import { render, screen } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, since 2026-10-10, for the MEASURED blocks of this
// suite: the `name` step's container rows against `band`'s, the `subhead`
// step in its boxes, and the `hero-scaled` step in and out of THE BAND SCALE
// (a class string cannot say what a row comes to in a box of a given width,
// or behind a gate). The per-file import is the house pattern (PersonnelCard,
// Card, Modal …); every other assertion here reads class strings, so each
// holds with the sheet or without it. The atom owns no transition, so
// nothing here needs stilling.
import '@/styles/globals.css';
import { cx } from '@/lib/cx/cx';
// ui/Container builds the band the `hero-scaled` step is measured in — its
// column, and the two band-scale strings a band's rhythm box wears (an atom's
// test composing another atom: the GlyphButton/Button precedent).
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '../Container/Container';
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
// THE h1 STEP since §15.24 (the 404 title, the privacy policy's — inside a
// band that scales, `hero-scaled`, below) — which is why the opener's
// 2026-10-01 reshape joined BESIDE it (next), and so did `hero-scaled`, and
// this string is byte-identical to the day it was measured.
const HERO_CLASSES =
  'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight text-ink-strong';

// I1-hero-scaled · THE h1 of a band that scales (2026-10-15 — the sibling
// step THE BAND SCALE's census booked at the gated class's third consumer):
// `hero`'s row byte for byte plus ONE class, behind THE BAND SCALE's own
// gate chain — inside the scale `hero`'s value at the owner's 1401 window,
// 16 + 3.5 × 14.01 = 65.035px, as 16.26 spacing steps. Pinned byte-exactly,
// and AGAINST `hero` and ui/Container's chain below.
const HERO_SCALED_TOKEN =
  'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]';
const HERO_SCALED_CLASSES =
  'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)] text-ink-strong';

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
// the container's `@md` step (28rem), 36px from it. The axis's FIRST
// container-responsive row (`name`, below, is the second), pinned
// byte-exactly like its elders so a viewport prefix, a bold or a third size
// can never slip into it unnoticed.
const BAND_CLASSES = 'font-display text-3xl @md:text-4xl text-ink-strong';

// I1-name · a doctor card's name (sections/PersonnelCard D20, 2026-10-10 —
// the owner's phone header): `band`, plus ONE override — Tailwind's 24px size
// on a `/tight` 30px line in a container under 24rem. Today's look as the
// base, so an engine without container queries draws `band` (the G2 fold of
// 2026-10-10). Pinned byte-exactly, and pinned AGAINST `band` below.
const NAME_CLASSES =
  'font-display text-3xl @md:text-4xl @max-sm:text-2xl/tight text-ink-strong';

// I1-subhead · an article's subheadings (sections/PostProse's <h2>s) and a
// blog photo's heading (sections/PostPhoto's <figcaption> — alone on the
// article page, or each half of a sections/BeforeAfter) (the blog-article
// lane, 2026-10-14 — the owner: "text and subheadings, so smaller headings
// of the articles"): the default scale's own 24px `text-2xl` and ONE weight,
// semi-bold — the axis's first size row to carry a weight (every elder is
// unbolded; the atom's header argues why 24px over 18px reading text needs
// one). Pinned byte-exactly like its elders, so a bold, a self-scaler or a
// second size can never slip into it unnoticed.
const SUBHEAD_CLASSES = 'font-display text-2xl font-semibold text-ink-strong';

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
  'hero-scaled': HERO_SCALED_CLASSES,
  slogan: SLOGAN_CLASSES,
  band: BAND_CLASSES,
  name: NAME_CLASSES,
  subhead: SUBHEAD_CLASSES,
};

/** The container-responsive tokens each step carries, in order — `band`'s
 *  one, `name`'s two, `band`'s and its own override, and `hero-scaled`'s
 *  one, its container steps behind THE BAND SCALE's gate; every other step
 *  answers the page with a clamp, or nothing at all. */
const CONTAINER_TOKENS: Record<HeadingSize, readonly string[]> = {
  title: [],
  section: [],
  page: [],
  hero: [],
  'hero-scaled': [HERO_SCALED_TOKEN],
  slogan: [],
  band: ['@md:text-4xl'],
  name: ['@md:text-4xl', '@max-sm:text-2xl/tight'],
  subhead: [],
};

/** A token's variants, outermost first — split on the colons OUTSIDE its
 *  brackets, so an arbitrary value's own `length:` never reads as one:
 *  `@md:text-4xl` → `@md`, the `hero-scaled` token → `scalable`, `@4xl`,
 *  `@min-[896px]`. */
const variantsOf = (token: string): string[] => {
  const variants: string[] = [];
  let depth = 0;
  let start = 0;
  for (let at = 0; at < token.length; at += 1) {
    const char = token[at];
    if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    else if (char === ':' && depth === 0) {
      variants.push(token.slice(start, at));
      start = at + 1;
    }
  }
  return variants;
};

/** The name step's ONE token beyond `band` (I1-name). */
const NAME_OVERRIDE = '@max-sm:text-2xl/tight';

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

describe('Heading — the hero-scaled step (THE h1 of a band that scales, 2026-10-15)', () => {
  // The measuring consumers' shape: a page's <h1> through asChild — the
  // doctor page's name, the page hero's heading, an article's title. The
  // words are an article's title, copied (an atom's test reads no site data,
  // §4; §15.7: Romanian, diacritics).
  const TITLE = 'Cum îți alegi periuța de dinți';

  it('wears exactly the hero-scaled classes on an asChild <h1> — its three consumers’ shape', () => {
    render(
      <Heading size="hero-scaled" asChild>
        <h1 className="hyphens-none">{TITLE}</h1>
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: TITLE }).className,
    ).toBe(`${HERO_SCALED_CLASSES} hyphens-none`);
  });

  it('renders on the default <p> host without inventing an outline slot (I2)', () => {
    render(<Heading size="hero-scaled">{TITLE}</Heading>);
    const title = screen.getByText(TITLE);
    expect(title.tagName).toBe('P');
    expect(title.className).toBe(HERO_SCALED_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('IS the hero row byte for byte plus ONE token — the gated size, after hero’s own size and before the ink', () => {
    // §6.6 — no invented size outside the scale: drop the one token and
    // `hero` is left byte for byte, so wherever the gate stays shut the step
    // IS `hero`. Size then tone, as on every row: the token closes the size
    // row, the ink follows it.
    const tokens = HERO_SCALED_CLASSES.split(' ');
    const hero = HERO_CLASSES.split(' ');
    expect(tokens.filter((token) => !hero.includes(token))).toEqual([
      HERO_SCALED_TOKEN,
    ]);
    expect(
      tokens.filter((token) => token !== HERO_SCALED_TOKEN).join(' '),
    ).toBe(HERO_CLASSES);
    expect(tokens.indexOf(HERO_SCALED_TOKEN)).toBe(
      hero.indexOf('text-ink-strong'),
    );
  });

  it('gates its one token with THE BAND SCALE’s own chain — every class of ui/Container’s band-scale string carries the same three variants, the gate first', () => {
    // The heading must switch exactly where its band's design pixel does.
    // Read off ui/Container's export, never retyped, so the day the regime's
    // chain moves this row fails here as well as in the census
    // (tests/unit/design-scale.test.ts holds every re-spelled chain).
    const chain = variantsOf(HERO_SCALED_TOKEN);
    expect(chain).toEqual(['scalable', '@4xl', '@min-[896px]']);
    const regime = bandScaleClasses.split(/\s+/).filter(Boolean);
    expect(regime.length).toBeGreaterThan(0);
    for (const token of regime) expect(variantsOf(token), token).toEqual(chain);
  });

  it('sets, inside the scale, `hero`’s value at the owner’s 1401 window — 16 + 3.5 × 14.01 = 65.035px — to the hundredth of a spacing step, the SIZE alone', () => {
    // The owner's window (§15.25 round 2: "1401x1063"): `vw` counts a
    // classic scrollbar, so 1rem + 3.5vw read 16 + 3.5 × 14.01 there, and
    // the spacing step is 4px at the default root. The `length:` hint makes
    // the class a font size and nothing else: no line height of its own, so
    // `hero`'s `/tight` ratio follows it (measured below).
    const [, steps] =
      /^text-\[length:calc\(var\(--spacing\)\*([\d.]+)\)\]$/.exec(
        HERO_SCALED_TOKEN.slice(
          variantsOf(HERO_SCALED_TOKEN).join(':').length + 1,
        ),
      ) ?? [];
    expect(steps).toBe('16.26');
    expect(Math.round(((16 + 3.5 * 14.01) / 4) * 100) / 100).toBe(
      Number(steps),
    );
  });

  it('carries no viewport prefix — its one variant chain asks the device, the engine and the container, never the screen’s width', () => {
    expect(HERO_SCALED_CLASSES).not.toMatch(/\b(sm|md|lg|xl|2xl):/);
  });

  it('leaves `hero` byte-identical — the step joined BESIDE it', () => {
    // The 404 page's <h1> and the privacy policy's wear `hero` outside any
    // band, and keep it to the byte.
    render(<Heading size="hero">{TITLE}</Heading>);
    expect(screen.getByText(TITLE).className).toBe(HERO_CLASSES);
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
  // rows' arbitrary properties (the stroke's, the halo's) open with a bracket
  // and never match; only the size rows are sampled below anyway.
  const variantTokens = (classes: string) =>
    classes.split(' ').filter((token) => /^@?[a-z0-9-]+:/.test(token));

  it('renders size="band" wearing exactly the band classes on a plain <p>', () => {
    // The narrow case's words: the title of the doctor page's former schedule
    // card (a 20rem card until 2026-10-13), the 320px column where the step
    // rests at 30px (§15.7: Romanian, diacritics).
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
    'size "%s" carries a responsive token only if it is a container row — band, name or hero-scaled',
    (size) => {
      // The axis stays static everywhere else: `hero` and `slogan` answer
      // the page with a clamp, never a variant; the three fixed steps answer
      // nothing at all. `band` reads its surroundings through exactly one
      // container step, `name` (2026-10-10) through two: `band`'s own and
      // its one override under 24rem — and `hero-scaled` (2026-10-15)
      // through THE BAND SCALE's two, behind the regime's own gate.
      expect(variantTokens(expectedClasses[size])).toEqual(
        CONTAINER_TOKENS[size],
      );
    },
  );

  it.each(
    (Object.keys(CONTAINER_TOKENS) as HeadingSize[]).filter(
      (size) => CONTAINER_TOKENS[size].length > 0,
    ),
  )(
    'size "%s" responds to its CONTAINER, never to the viewport’s width (§6.5)',
    (size) => {
      // Every container row the table above lists — built from it, so a
      // fourth container-responsive step is checked the day it joins. An
      // `@`-prefixed variant queries the nearest ancestor container — the
      // band's ui/Container column, a ui/Card, a doctor card's INSET — which
      // is the component-responsiveness §6.5 prescribes; a bare viewport
      // prefix would be the self-scaling `title` refused on day one (the old
      // site's section title scaled itself by the screen). ONE other variant
      // may lead a chain: THE BAND SCALE's gate, `scalable:` — a fine
      // pointer, in an engine that registers custom properties — which asks
      // the device and the engine, never a width, and which `hero-scaled`
      // alone wears, as ui/Container's band-scale strings do.
      const tokens = CONTAINER_TOKENS[size];
      expect(variantTokens(expectedClasses[size])).toEqual(tokens);
      for (const token of tokens) {
        const variants = variantsOf(token);
        const gated = variants[0] === 'scalable';
        const steps = gated ? variants.slice(1) : variants;
        expect(steps.length, token).toBeGreaterThan(0);
        expect(
          steps.every((variant) => variant.startsWith('@')),
          token,
        ).toBe(true);
        expect(
          variants.some((variant) => /^(sm|md|lg|xl|2xl)$/.test(variant)),
          token,
        ).toBe(false);
        expect(gated, token).toBe(size === 'hero-scaled');
      }
    },
  );

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

describe('Heading — the name step (a doctor card’s name, PersonnelCard D20, 2026-10-10)', () => {
  // The measuring consumer's own fixture and shape: a doctor's name on a real
  // <h3> through asChild, the card's default level (§15.7: Romanian,
  // diacritics).
  const NAME = 'Dr. Ivașcu-Zugravu Cătălina';

  it('wears exactly the name classes on an asChild <h3> — the doctor card’s shape', () => {
    render(
      <Heading size="name" asChild>
        <h3 className="hyphens-none">{NAME}</h3>
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 3, name: NAME });
    expect(heading.className).toBe(`${NAME_CLASSES} hyphens-none`);
  });

  it('IS the band step plus ONE override — the default scale’s 24px on a /tight line, under 24rem', () => {
    // §6.6 — no invented size: drop the one override and `band` is left byte
    // for byte, today's look as the base (what an engine without container
    // queries draws). The override is the default scale's 2xl size with the
    // line-height `hero` spells the same way (`/tight`), under the
    // container's 24rem — a MAX query, so it never reaches `@md`'s rows.
    const tokens = NAME_CLASSES.split(' ');
    const band = BAND_CLASSES.split(' ');
    expect(tokens.filter((token) => !band.includes(token))).toEqual([
      NAME_OVERRIDE,
    ]);
    expect(tokens.filter((token) => token !== NAME_OVERRIDE).join(' ')).toBe(
      BAND_CLASSES,
    );
    expect(NAME_OVERRIDE.startsWith('@max-sm:')).toBe(true);
  });

  it('leaves `band` byte-identical — the name step joined BESIDE it', () => {
    render(<Heading size="band">{NAME}</Heading>);
    expect(screen.getByText(NAME).className).toBe(BAND_CLASSES);
  });
});

// The measuring consumers' own words: a subheading of the demo article and a
// blog photo's heading — the first half of its before/after, each half a
// sections/PostPhoto (src/content/blog/articles — COPIED, never imported: an
// atom's test reads no site data, §4). Romanian with diacritics (§15.7).
const SUBHEADING = 'Peri moi, medii sau tari?';
const CAPTION = 'Înainte';

describe('Heading — the subhead step (an article’s subheadings, 2026-10-14)', () => {
  it('renders size="subhead" wearing exactly the subhead classes on a plain <p>', () => {
    // toBe, never toContain — the elders' discipline: a returning bold, a
    // self-scaler, a leading-* or a margin (§6.4) fails right here. And the
    // <p> host invents no outline slot (I2), weight or no weight.
    render(<Heading size="subhead">{SUBHEADING}</Heading>);
    const title = screen.getByText(SUBHEADING);
    expect(title.tagName).toBe('P');
    expect(title.className).toBe(SUBHEAD_CLASSES);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('wears the subhead classes on an asChild <h2> — an article subheading, sections/PostProse’s shape', () => {
    render(
      <Heading size="subhead" asChild>
        <h2>{SUBHEADING}</h2>
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: SUBHEADING }).className,
    ).toBe(SUBHEAD_CLASSES);
  });

  it('wears them on an asChild <figcaption> kept INSIDE its <figure> — sections/PostPhoto’s heading, alone or as half of a before/after', () => {
    // The clone keeps the caption's own element — which is what lets the
    // figure be named by it under HTML-AAM's rule (Chromium 151 does not
    // apply it, measured 2026-10-20 — sections/PostPhoto's THE HEADING) —
    // and its own class after the
    // atom's (slot.ts merge order). No heading role is invented: a caption is
    // the figure's label, never an outline slot.
    render(
      <figure>
        <Heading size="subhead" asChild>
          <figcaption className="text-start">{CAPTION}</figcaption>
        </Heading>
      </figure>,
    );
    const caption = screen.getByText(CAPTION);
    expect(caption.tagName).toBe('FIGCAPTION');
    expect(caption.className).toBe(`${SUBHEAD_CLASSES} text-start`);
    expect(caption.parentElement).toBe(screen.getByRole('figure'));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('IS the title row one step up the default scale, plus ONE weight — invents no size (§6.6)', () => {
    // Drop the weight and walk the size one step back down — 2xl to xl — and
    // the `title` row is left byte for byte: the same face, the same ink.
    const unweighted = SUBHEAD_CLASSES.split(' ')
      .filter((token) => token !== 'font-semibold')
      .map((token) => (token === 'text-2xl' ? 'text-xl' : token))
      .join(' ');
    expect(unweighted).toBe(TITLE_CLASSES);
  });

  it('is the ONLY size row that carries a weight — and that weight is semi-bold, never bold', () => {
    // Every elder is unbolded (the header's Source-Serif-4 reason); the
    // subhead is the one exception, and at 600 — not the 700 the owner called
    // "too bold" in the doctors' quotes. A weight token is any `font-*` but
    // the face.
    const weights = (classes: string) =>
      classes.split(' ').filter((token) => /^font-(?!display$)/.test(token));
    for (const size of Object.keys(expectedClasses) as HeadingSize[]) {
      expect(weights(expectedClasses[size])).toEqual(
        size === 'subhead' ? ['font-semibold'] : [],
      );
    }
  });

  it('carries no viewport prefix and no container row — 24 design px wherever it stands', () => {
    // Not `band`: an article's column and a photo's heading over its picture
    // read the same 24 design px (24px outside THE BAND SCALE, 24 × s inside
    // it); the measured block below proves it in four boxes and in the scale.
    expect(SUBHEAD_CLASSES).not.toMatch(/\b(sm|md|lg|xl|2xl):/);
    expect(SUBHEAD_CLASSES).not.toMatch(/(^|\s)@/);
  });
});

/** `n` rem in px, at whatever the root is. */
const remPx = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** A name on an <h3> in a `@container` box `width` rem wide, at one step —
 *  the box's width an inline style, never an arbitrary class (Tailwind reads
 *  class names from every source file, a test's too: a width spelled as a
 *  class here would ship as a rule nobody wears). */
const measuredTitle = (size: HeadingSize, width: number) => {
  const style: CSSProperties = { width: `${width}rem` };
  const { unmount } = render(
    <div className="@container" style={style}>
      <Heading size={size} asChild>
        <h3>Dr. Elena Marin</h3>
      </Heading>
    </div>,
  );
  const heading = screen.getByRole('heading', { level: 3 });
  const computed = getComputedStyle(heading);
  const measured = {
    box: (heading.parentElement as HTMLElement).getBoundingClientRect().width,
    fontSize: computed.fontSize,
    lineHeight: computed.lineHeight,
  };
  unmount();
  return measured;
};

describe('Heading — the name step, MEASURED (real stylesheet)', () => {
  it.each([
    { width: 12.5, at: 'PersonnelCard D20’s FLOOR' },
    { width: 20, at: 'a phone’s doctor card' },
    { width: 23.9, at: 'just under the 24rem override’s edge' },
  ])(
    'is 24px on a 30px line in a container narrower than 24rem — $at ($width rem)',
    ({ width }) => {
      // Every phone's INSET is under 24rem (PersonnelCard D20 — 218px on a
      // 320 phone, 277 on a 390 one). The box first, so a width that failed
      // to apply cannot let the size pass for the wrong reason.
      const name = measuredTitle('name', width);
      expect(name.box).toBeCloseTo(remPx(width), 1);
      expect(name.fontSize).toBe('24px');
      expect(name.lineHeight).toBe('30px');
    },
  );

  it.each([
    {
      width: 24,
      at: 'the override’s edge — 24rem, no longer under it',
      px: 30,
    },
    { width: 27.9, at: 'just under `@md`', px: 30 },
    { width: 28, at: 'the `@md` step itself (inclusive)', px: 36 },
    { width: 40, at: 'a tablet’s INSET', px: 36 },
  ])(
    'EQUALS `band` — font size AND line height — at $at ($width rem)',
    ({ width, px }) => {
      // The owner's "On tablet and desktop it's fine and should remain as
      // is", read off the engine: from 24rem up the two rows compute the same
      // pair, `section`'s 30/36 and then `page`'s 36/40 — the `/tight` of the
      // override never leaks past it (a `/` modifier sets no `--tw-leading`).
      // The box first, as above.
      const name = measuredTitle('name', width);
      const band = measuredTitle('band', width);
      expect(name.box).toBeCloseTo(remPx(width), 1);
      expect(band.box).toBe(name.box);
      expect(name.fontSize).toBe(`${px}px`);
      expect(name.fontSize).toBe(band.fontSize);
      expect(name.lineHeight).toBe(band.lineHeight);
    },
  );

  it('IS band’s 30px with no container above it — what an engine without container queries draws, too', () => {
    // The safe failure, band's own, to the pixel: with no container to ask,
    // no container row matches and the base is `band`'s — as on Safari and
    // every iPadOS 15 browser, which understand no container rule at all.
    const { unmount } = render(
      <Heading size="name" asChild>
        <h3>Dr. Elena Marin</h3>
      </Heading>,
    );
    const computed = getComputedStyle(
      screen.getByRole('heading', { level: 3 }),
    );
    expect(computed.fontSize).toBe('30px');
    expect(computed.lineHeight).toBe('36px');
    unmount();
  });
});

/** An article subheading — an <h2>, PostProse's shape — read off the engine,
 *  alone or in a `@container` box `width` rem wide (the width an inline style,
 *  never a class — `measuredTitle`'s reason). */
const measuredSubhead = (width?: number) => {
  const heading = (
    <Heading size="subhead" asChild>
      <h2>{SUBHEADING}</h2>
    </Heading>
  );
  const style: CSSProperties = { width: `${width}rem` };
  const { unmount } = render(
    width === undefined ? (
      heading
    ) : (
      <div className="@container" style={style}>
        {heading}
      </div>
    ),
  );
  const element = screen.getByRole('heading', { level: 2 });
  const computed = getComputedStyle(element);
  const measured = {
    box: (element.parentElement as HTMLElement).getBoundingClientRect().width,
    fontSize: computed.fontSize,
    lineHeight: computed.lineHeight,
    fontWeight: computed.fontWeight,
  };
  unmount();
  return measured;
};

describe('Heading — the subhead step, MEASURED (real stylesheet)', () => {
  it('is 24px on a 32px line at weight 600 with no container above it', () => {
    // `text-2xl`'s own pair (24px on 2rem — the default scale's ratio, so
    // the band scale's remap carries the line with the size) and the row's
    // one weight. Background, not something this assertion proves: src/fonts
    // declares Source Serif 4 as a variable face at 200–900, so 600 is one
    // of the face's own instances rather than a synthesized bold — the
    // computed weight reads 600 either way.
    const subhead = measuredSubhead();
    expect(subhead.fontSize).toBe('24px');
    expect(subhead.lineHeight).toBe('32px');
    expect(subhead.fontWeight).toBe('600');
  });

  it.each([
    { width: 20, at: 'a phone’s column' },
    { width: 42, at: 'the article’s 42rem measure' },
    { width: 60, at: 'a box past every container step' },
  ])(
    'reads the SAME 24px / 32px / 600 in $at ($width rem) — no container row',
    ({ width }) => {
      // The box first, so a width that failed to apply cannot let the size
      // pass for the wrong reason — then the one size, unmoved by the box.
      const subhead = measuredSubhead(width);
      expect(subhead.box).toBeCloseTo(remPx(width), 1);
      expect([
        subhead.fontSize,
        subhead.lineHeight,
        subhead.fontWeight,
      ]).toEqual(['24px', '32px', '600']);
    },
  );

  it('lands BETWEEN `title` and `section` on the axis — 20 · 24 · 30px, each on its own line', () => {
    // The gap the role naming exists for (§6.6: a step landing between two
    // others is an addition, never a rename), read off the engine in order.
    render(
      <div>
        <Heading size="title">Servicii și prețuri</Heading>
        <Heading size="subhead">{SUBHEADING}</Heading>
        <Heading size="section">Vizitează clinica noastră</Heading>
      </div>,
    );
    const steps = [
      'Servicii și prețuri',
      SUBHEADING,
      'Vizitează clinica noastră',
    ].map((text) => getComputedStyle(screen.getByText(text)));
    expect(steps.map((step) => step.fontSize)).toEqual([
      '20px',
      '24px',
      '30px',
    ]);
    expect(steps.map((step) => step.lineHeight)).toEqual([
      '28px',
      '32px',
      '36px',
    ]);
    expect(steps.map((step) => step.fontWeight)).toEqual(['400', '600', '400']);
  });

  it('THE WEIGHT RULE — with `inverse-stroked` the subhead still draws at 600: where both axes set a weight, the stylesheet’s order decides, never the class string’s', () => {
    // The one property the two axes share, pinned so it cannot move in
    // silence (the atom's header, THE WEIGHT RULE; no consumer wears the
    // pair). The class string carries BOTH weights, the tone's bold AFTER the
    // size row's semi-bold — and the engine draws the semi-bold, because
    // Tailwind orders two utilities of one property by name and
    // `font-semibold` lands after `font-bold` in the sheet. A Tailwind that
    // sorted otherwise turns this red. Beside it, the same tone on an
    // unweighted row draws its own 700, so the case is never vacuous: the
    // tone's bold is real, and only the subhead row overrides it.
    render(
      <div>
        <Heading size="subhead" tone="inverse-stroked">
          {SUBHEADING}
        </Heading>
        <Heading size="section" tone="inverse-stroked">
          Vizitează clinica noastră
        </Heading>
      </div>,
    );
    const pair = screen.getByText(SUBHEADING);
    // What the engine draws first…
    expect(getComputedStyle(pair).fontWeight).toBe('600');
    expect(
      getComputedStyle(screen.getByText('Vizitează clinica noastră'))
        .fontWeight,
    ).toBe('700');
    // …then why it is the stylesheet deciding: the string asks for both.
    const tokens = pair.className.split(' ');
    expect(tokens).toContain('font-semibold');
    expect(tokens.indexOf('font-bold')).toBeGreaterThan(
      tokens.indexOf('font-semibold'),
    );
  });

  it('reads UNDER the article’s h1 — `hero-scaled`, its own step — at whatever width this runs — §15.24’s article note', () => {
    // An article's <h2> sits under its <h1> (sections/PostHeader, on
    // `hero-scaled` — the pair that ships, measured as it ships). Here, with
    // no container above it, the step's gate stays shut and the h1 IS `hero`,
    // whose fluid curve never drops under its 32px floor, so a 24px
    // subheading can never outrank it — not even in `band`'s residual window
    // (inside THE BAND SCALE the two are 65.04 and 24 design px, measured in
    // the next case and in the hero-scaled block below).
    render(
      <article>
        <Heading size="hero-scaled" asChild>
          <h1>Cum îți alegi periuța de dinți</h1>
        </Heading>
        <Heading size="subhead" asChild>
          <h2>{SUBHEADING}</h2>
        </Heading>
      </article>,
    );
    const h1 = parseFloat(
      getComputedStyle(screen.getByRole('heading', { level: 1 })).fontSize,
    );
    const h2 = parseFloat(
      getComputedStyle(screen.getByRole('heading', { level: 2 })).fontSize,
    );
    expect(h1).toBeGreaterThanOrEqual(32);
    expect(h2).toBe(24);
    expect(h1).toBeGreaterThan(h2);
  });

  it('follows THE BAND SCALE by itself — 24 × s — while `hero`, a viewport clamp, stays where it was', () => {
    // sections/PostPage wears ui/Container's band scale (§15.32), and the
    // blocks inside inherit its remap: a box wearing `design-scale` measures
    // every theme length in `--scale-px`, so `text-2xl` — a theme step —
    // redraws itself with no class of its own: 24 × 1.25 = 30px on a 40px
    // line, the weight untouched (a weight is no length). `hero` is a
    // viewport clamp in rem the remap cannot reach — which is why the
    // article's h1 wears `hero-scaled` (measured in a real band below) while
    // its subheadings need no step of their own. The design pixel is set
    // INLINE (Card.test's D-LIT reason): a class only this test needed would
    // ship as a dead rule.
    render(
      <>
        <Heading size="hero" asChild>
          <h1>Cum îți alegi periuța de dinți</h1>
        </Heading>
        <div
          className="design-scale"
          style={{ '--scale-px': '1.25px' } as CSSProperties}
          data-testid="design"
        >
          <Heading size="hero" asChild>
            <h1>Cum îți alegi periuța de dinți</h1>
          </Heading>
          <Heading size="subhead" asChild>
            <h2>{SUBHEADING}</h2>
          </Heading>
        </div>
      </>,
    );
    // NEVER-VACUOUS: the design pixel is the declared one.
    expect(
      getComputedStyle(screen.getByTestId('design')).getPropertyValue(
        '--scale-px',
      ),
    ).toBe('1.25px');
    const subhead = getComputedStyle(screen.getByRole('heading', { level: 2 }));
    expect([subhead.fontSize, subhead.lineHeight, subhead.fontWeight]).toEqual([
      '30px',
      '40px',
      '600',
    ]);
    const [outside, inside] = screen
      .getAllByRole('heading', { level: 1 })
      .map((h1) => getComputedStyle(h1).fontSize);
    expect(inside).toBe(outside);
  });
});

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel, the cap and the step in rem, and the
 *  step's px floor. Spelled again on purpose: the census holds the source,
 *  these hold what the engine does with it. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** `hero-scaled`'s size inside the scale, in spacing steps (its one token). */
const DESIGN_STEPS = 16.26;

/** The window every measured `hero-scaled` case runs in: §7's Notebook,
 *  where `hero`'s clamp reads 60.8px at the default root — a size no case
 *  inside the scale lands on, so no comparison below can pass by
 *  coincidence. NOT the owner's 1401 window: there the clamp IS the step's
 *  reference value (65.035 against 65.04), and at the reference column a
 *  gate that never opened would pass. */
const WINDOW = { width: 1280, height: 800 } as const;

/** The words: an article's title on the step, and the 404 title — `hero`'s
 *  own wearer outside any band — on `hero` beside it. Copied (§4). */
const STEP_TITLE = 'Cum îți alegi periuța de dinți';
const HERO_TITLE = '404: Această pagină nu există';

/** One `vw` of this window in px, read off a probe — what `hero`'s clamp
 *  reads (DoctorIntro.scale.test.tsx's `vw`). */
const vw = (): number => {
  const probe = document.createElement('div');
  probe.style.width = '100vw';
  document.body.append(probe);
  try {
    return probe.getBoundingClientRect().width / 100;
  } finally {
    probe.remove();
  }
};

/** `hero`'s clamp — clamp(2rem, 1rem + 3.5vw, 4.5rem) — at this window and a
 *  `root` px root. */
const heroAt = (root: number): number =>
  Math.min(4.5 * root, Math.max(2 * root, root + 3.5 * vw()));

/** Did the regime REDRAW this box? `design-scale` remaps the spacing step on
 *  the box that wears it; any other box inherits the root's
 *  (DoctorIntro.scale.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

/** A box's computed font size and line height, in px. */
const typeOf = (element: Element): { size: number; line: number } => {
  const style = getComputedStyle(element);
  return {
    size: parseFloat(style.fontSize),
    line: parseFloat(style.lineHeight),
  };
};

/** Runs `body` with the root font at `px`, then puts the root back. */
const atRoot = (px: number, body: () => void): void => {
  const root = document.documentElement;
  const before = root.style.fontSize;
  root.style.fontSize = `${px}px`;
  try {
    body();
  } finally {
    root.style.fontSize = before;
  }
};

/** Where the step stands: NONE, no container above it · PLAIN, a wide
 *  `@container` that wears no band scale · BAND, a band as the blog's two
 *  titles stand in one — ui/Container's column, then a rhythm box wearing
 *  both band-scale strings · CAPPED, that band with its rhythm box a
 *  `@container` too: the doctor's name's shape (DoctorIntro's opener box,
 *  capped at 96rem). */
type Frame = 'none' | 'plain' | 'band' | 'capped';

/** The frame round `lines`, its container `column` px wide — ui/Container's
 *  gutter zeroed and its width forced (Container.test.tsx's way). Widths are
 *  INLINE styles, never classes: a class only this test spelled would ship
 *  as a rule nothing on the site wears. */
const framed = (
  frame: Frame,
  column: number,
  lines: ReactElement,
): ReactElement => {
  const width: CSSProperties = { width: `${column}px` };
  if (frame === 'none') return lines;
  if (frame === 'plain') {
    return (
      <div className="@container" style={width}>
        {lines}
      </div>
    );
  }
  return (
    <Container style={{ marginInline: 0, ...width }}>
      <div
        data-testid="rhythm"
        className={cx(
          frame === 'capped' && '@container',
          bandColumnClasses,
          bandScaleClasses,
        )}
      >
        {lines}
      </div>
    </Container>
  );
};

/** The step on a real <h1>, `hero` on another beside it, and a probe whose
 *  font size is 16.26 × whatever the spacing step reads there — the
 *  engine's own "16.26 × the spacing" in the step's very box. */
const renderScene = (frame: Frame, column = 0) => {
  const { unmount } = render(
    framed(
      frame,
      column,
      <>
        <Heading size="hero-scaled" asChild>
          <h1>{STEP_TITLE}</h1>
        </Heading>
        <Heading size="hero" asChild>
          <h1>{HERO_TITLE}</h1>
        </Heading>
        <span
          data-testid="probe"
          style={{ fontSize: `calc(var(--spacing) * ${DESIGN_STEPS})` }}
        />
      </>,
    ),
  );
  return {
    unmount,
    step: screen.getByRole('heading', { level: 1, name: STEP_TITLE }),
    hero: screen.getByRole('heading', { level: 1, name: HERO_TITLE }),
    probe: screen.getByTestId('probe'),
    rhythm: screen.queryByTestId('rhythm'),
  };
};

type Scene = ReturnType<typeof renderScene>;

/** The band's rhythm box — or a failure that NAMES what went missing. */
const rhythmOf = (scene: Scene): HTMLElement => {
  if (!scene.rhythm) throw new Error('hero-scaled: no rhythm box here');
  return scene.rhythm;
};

/** Every list of conditions a compiled rule for `.token` sits under, read
 *  off the CSSOM — `supports …`, `media …` and `container …`, outermost
 *  first, one list per rule (PostList.scale.test.tsx's walk). */
const compiledUnder = (token: string): string[][] => {
  const found: string[][] = [];
  const selector = `.${CSS.escape(token)}`;
  const walk = (rules: CSSRuleList, conditions: string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText === selector) found.push(conditions);
      } else if (rule instanceof CSSSupportsRule) {
        walk(rule.cssRules, [...conditions, `supports ${rule.conditionText}`]);
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, [...conditions, `media ${rule.media.mediaText}`]);
      } else if (rule instanceof CSSContainerRule) {
        walk(rule.cssRules, [...conditions, `container ${rule.conditionText}`]);
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, conditions);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, []);
  }
  return found;
};

describe('Heading — the hero-scaled step, MEASURED (real stylesheet)', () => {
  let window0 = { width: 0, height: 0 };

  beforeAll(async () => {
    // Recorded FIRST, so `afterAll` can put the window back even when a
    // premise below fails.
    window0 = { width: window.innerWidth, height: window.innerHeight };
    // THE PREMISE: this runner is a place where THE BAND SCALE CAN apply — a
    // fine primary pointer and an engine that registers custom properties,
    // globals.css's THE SCALABLE VARIANT — at the default 16px root.
    // Otherwise every case that expects the scale would fail for a reason
    // that reads as the step's, and every case that expects none would pass
    // for the wrong one. A touch screen is NEVER emulated here (switched on
    // and off in this shared runner it left CI's Linux tab without a fine
    // pointer for every later file — PostList.scale.test.tsx's THE GATES):
    // the gates' case below reads the compiled sheet instead.
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine passes the registration gate (relative colour syntax)',
    ).toBe(true);
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the default 16px root',
    ).toBe(16);
    await page.viewport(WINDOW.width, WINDOW.height);
  });

  afterAll(async () => {
    await page.viewport(window0.width, window0.height);
  });

  it.each([
    { column: 900, root: 16, at: 'the step’s first columns' },
    { column: 1106, root: 16, at: 'the reference column' },
    { column: 1300, root: 16, at: 'a laptop past the reference' },
    { column: 1800, root: 16, at: 'a column past the 96rem cap' },
    { column: 1200, root: 20, at: 'a 20px root, its 56rem step 1120px' },
    { column: 900, root: 12, at: 'a 12px root, the 896px floor its step' },
  ])(
    'INSIDE THE BAND SCALE — $at ($column px, a $root px root) — is 16.26 × the remapped spacing, 65.04 design pixels × s, on `hero`’s /tight line, while `hero` beside it keeps the clamp',
    ({ column, root }) => {
      atRoot(root, () => {
        expect(column, 'the column clears the step').toBeGreaterThanOrEqual(
          Math.max(STEP_REM * root, STEP_FLOOR),
        );
        const scene = renderScene('band', column);
        const rhythm = rhythmOf(scene);
        const s = Math.min(column, CAP_REM * root) / REFERENCE;
        // THE PREMISE: the band scaled — its rhythm box redrew the spacing
        // step in the design pixel s, the cap's and the column's.
        expect(remapped(rhythm), 'the band scaled').toBe(true);
        expect(
          parseFloat(getComputedStyle(rhythm).getPropertyValue('--scale-px')),
          'the design pixel',
        ).toBeCloseTo(s, 4);
        const step = typeOf(scene.step);
        // 16.26 × the remapped spacing, as the engine computes it in the
        // heading's own box…
        expect(step.size).toBeCloseTo(typeOf(scene.probe).size, 3);
        // …which is 65.04 design pixels × s.
        expect(step.size).toBeCloseTo(DESIGN_STEPS * 4 * s, 2);
        // The SIZE alone: the row's `/tight` ratio follows it.
        expect(step.line).toBeCloseTo(1.25 * step.size, 1);
        // `hero` beside it keeps the viewport's clamp — the size the remap
        // cannot redraw — and the two differ here, so neither comparison
        // passes by coincidence.
        const hero = typeOf(scene.hero).size;
        expect(hero).toBeCloseTo(heroAt(root), 2);
        expect(Math.abs(step.size - hero)).toBeGreaterThan(0.5);
        scene.unmount();
      });
    },
  );

  it.each([
    // The two gated halves of the step, each shut alone: 1000px clears the
    // 896px floor but not 56rem at a 20px root (1120px), and 880px clears
    // 56rem at a 12px root (672px) but not the floor.
    { frame: 'none', column: 0, root: 16, at: 'no container above it' },
    {
      frame: 'band',
      column: 880,
      root: 16,
      at: 'an 880px column, under the step',
    },
    {
      frame: 'band',
      column: 1000,
      root: 20,
      at: 'a 20px root, 1000px: under 56rem',
    },
    {
      frame: 'band',
      column: 880,
      root: 12,
      at: 'a 12px root, 880px: under 896px',
    },
  ] as const)(
    'OUTSIDE THE BAND SCALE — $at — IS `hero`, to the computed size and line',
    ({ frame, column, root }) => {
      atRoot(root, () => {
        if (frame !== 'none') {
          expect(column, 'the column misses the step').toBeLessThan(
            Math.max(STEP_REM * root, STEP_FLOOR),
          );
        }
        const scene = renderScene(frame, column);
        if (scene.rhythm) {
          // Nothing declared, nothing remapped: the band is its rem self.
          expect(remapped(scene.rhythm), 'the band did not scale').toBe(false);
          expect(
            getComputedStyle(scene.rhythm).getPropertyValue('--scale-px'),
          ).toBe('1px');
        }
        const step = typeOf(scene.step);
        expect(step).toEqual(typeOf(scene.hero));
        expect(step.size).toBeCloseTo(heroAt(root), 2);
        // Never vacuous: an open gate would have drawn 16.26 × the root's
        // spacing step — a quarter of the root — which differs here.
        expect(Math.abs(step.size - (DESIGN_STEPS * root) / 4)).toBeGreaterThan(
          0.5,
        );
        scene.unmount();
      });
    },
  );

  it('compiles its one token behind ALL FOUR of THE BAND SCALE’s gates — the registration gate, a fine pointer, 56rem and 896px — so a touch screen, however wide, keeps `hero`', () => {
    // The two gates no case above can flip in this runner, read where the
    // engine reads them: every compiled rule for the step's one token sits
    // under globals.css's THE SCALABLE VARIANT and both container steps.
    const under = compiledUnder(HERO_SCALED_TOKEN);
    expect(under.length, 'the token compiled').toBeGreaterThan(0);
    const gates = [
      [
        'the registration gate',
        /^supports \(?color: rgb\(from red r g b\)\)?$/,
      ],
      ['a fine pointer', /^media \(pointer: fine\)$/],
      [
        'the 56rem container step',
        /^container \((?:min-width: 56rem|width >= 56rem)\)$/,
      ],
      [
        'the 896px container floor',
        /^container \((?:min-width: 896px|width >= 896px)\)$/,
      ],
    ] as const;
    for (const conditions of under) {
      const at = conditions.join(' › ') || 'no condition at all';
      for (const [gate, pattern] of gates) {
        expect(
          conditions.some((condition) => pattern.test(condition)),
          `${at}: ${gate}`,
        ).toBe(true);
      }
    }
  });

  it('THE PRECONDITION — in a wide container that wears no band scale the gate still opens, on the root’s spacing: a FIXED 65.04px, the 1401 design at s = 1, whatever the column — the step belongs inside a scaled band', () => {
    // The gate reads the NEAREST container, not the band: only a scaled
    // band's column makes an open gate mean "the band scales" (the atom's
    // header, THE PRECONDITION). Two widths, one size.
    for (const column of [900, 1500]) {
      const scene = renderScene('plain', column);
      const step = typeOf(scene.step).size;
      expect(step, `a ${column}px container`).toBeCloseTo(DESIGN_STEPS * 4, 2);
      expect(step).toBeCloseTo(typeOf(scene.probe).size, 3);
      expect(Math.abs(step - typeOf(scene.hero).size)).toBeGreaterThan(0.5);
      scene.unmount();
    }
  });

  it('THE BOUND DoctorIntro records — with the band’s own capped box as its nearest container the gate opens with the band only while 96rem ≥ 896px: at a 9px root the band scales and the step stays `hero`, 40.5px where 50.8 is due', () => {
    // At the default root the capped box is the column's 1200px — under its
    // 1536px cap, over the floor — and the gate opens with the band.
    const open = renderScene('capped', 1200);
    expect(remapped(rhythmOf(open)), 'the band scaled').toBe(true);
    expect(typeOf(open.step).size).toBeCloseTo(
      DESIGN_STEPS * 4 * (1200 / REFERENCE),
      2,
    );
    open.unmount();
    // Chrome's "Very small" default font, a 9px root: 96rem is 864px, so
    // the box caps UNDER the 896px floor.
    atRoot(9, () => {
      const shut = renderScene('capped', 1200);
      const rhythm = rhythmOf(shut);
      // The band DID scale — its own gate reads ui/Container's 1200px
      // column, past 56rem (504px) and the floor…
      expect(remapped(rhythm), 'the band scaled').toBe(true);
      expect(rhythm.getBoundingClientRect().width).toBeCloseTo(CAP_REM * 9, 1);
      // …while the step's gate reads the capped box and stayed shut:
      // `hero`'s clamp, at its 4.5rem cap.
      expect(typeOf(shut.step)).toEqual(typeOf(shut.hero));
      expect(typeOf(shut.step).size).toBeCloseTo(4.5 * 9, 2);
      // What the band's pixel would have drawn: 65.04 × 864 / 1106.
      expect(DESIGN_STEPS * 4 * ((CAP_REM * 9) / REFERENCE)).toBeCloseTo(
        50.8,
        1,
      );
      shut.unmount();
    });
  });
});

describe('Heading — the tone axis (inverse ink for the scrim, 2026-09-19)', () => {
  // Record<HeadingTone, …> on purpose, the size table's twin: a new ink
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
  };

  // Pin the union itself, exactly as the size axis does: widening it to
  // `string` would keep every Record compiling with stale rows.
  expectTypeOf<HeadingTone>().toEqualTypeOf<
    | 'default'
    | 'inverse'
    | 'inverse-stroked'
    | 'inverse-outlined'
    | 'inverse-aura'
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

  it('is independent of size — any step may wear the inverse ink', () => {
    render(
      <Heading size="section" tone="inverse">
        Vizitează clinica noastră
      </Heading>,
    );
    expect(screen.getByText('Vizitează clinica noastră').className).toBe(
      'font-display text-3xl text-ink-inverse',
    );
  });

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
    | 'title'
    | 'subhead'
    | 'section'
    | 'band'
    | 'name'
    | 'page'
    | 'hero'
    | 'hero-scaled'
    | 'slogan'
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
