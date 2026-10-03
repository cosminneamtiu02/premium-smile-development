import { createRef, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import heroSource from '@/components/sections/Hero/Hero.tsx?raw';
import { containerClasses } from '@/components/ui/Container/Container';
import { TintedBand, type TintedBandProps } from './TintedBand';
import source from './TintedBand.tsx?raw';

// sections/TintedBand — the suite of the doctor page's lilac ground, extracted
// from sections/DoctorProfile at its second consumer (run D29). Everything
// under "the ground (run D7)" MOVED here from DoctorProfile.test.tsx with the
// constants it pins — the three boxes, the tint declared once, the fades
// resolving to the tint, the two fades one curve read both ways, and the `?raw`
// cross-pin against the Hero's curve — because the ground now lives in THIS
// file and a pin belongs beside the thing it pins. What is new is the half a
// shared ground needs and a single band never did: the content slot (children
// inside ui/Container, nothing of the band's own around them) and the names a
// consumer hands through (`aria-labelledby` reaching the <section>, so
// DoctorStats can make its band a region while DoctorProfile keeps refusing
// one in ITS props).
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the SectionHeading/DoctorProfile precedent):
// next-intl's hooks throw without one, so a green render proves the band calls
// no t() and owns no message key. The fixture strings are the CONSUMER's —
// Romanian with diacritics (§15.7), factual (CMSR: no superlatives, no
// promises), D-DASH-clean — and they are plain elements rather than another
// section, so nothing but this band can turn this suite red.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the contract here, the convention
// every component test in this repo follows. What needs real CSS — the tint's
// measured alpha, the fades actually reaching the middle box's colour, the band
// never scrolling sideways at 320 — is asserted one tier up, in
// TintedBand.stories' play functions.
//
// ── THE ONE IMPORT FROM ANOTHER BAND IS SOURCE TEXT, NOT A COMPONENT:
// `@/components/sections/Hero/Hero.tsx?raw` is read as a string so the
// cross-file KEEP-IN-SYNC pin below can compare two gradient spellings (§4's
// sharing table — both headers point at each other, this side holds the pin).
// Nothing of the Hero is rendered, mounted or executed here; a section still
// never reaches into another section's internals at RUNTIME. ui/Container's
// class row is imported from the atom (`containerClasses`, the ONE gutter
// definition — tests/unit/gutter-single-spelling.test.ts fences any copy),
// never re-spelled here.

// ── FIXTURES — what a consumer puts inside: its own <h2> (with the id an
// `aria-labelledby` pair points at) over one paragraph of its own prose.
const HEADING_ID = 'banda-despre';
const TITLE = 'Despre Dr. Elena Marin';
const PARAGRAPH =
  'Tratează copii, adolescenți și adulți, cu aparate fixe sau cu gutiere transparente, după caz.';

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to the band's own constants, which an import would follow (the
// ui/Eyebrow RECIPE convention, carried over from DoctorProfile.test.tsx with
// the constants themselves). These are the band's OWN markup; the Container's
// row is read off the atom instead (above).
const TINT =
  '[--tint:color-mix(in_srgb,var(--color-accent-decorative)_30%,transparent)]';
const BAND = `relative bg-page ${TINT}`;

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this component
 * is deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and next-intl by name. Known limit, same as there: it strips block comments
 * and whole-line `//` comments, not a `//` trailing real code — a shape this
 * file does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/**
 * THE HERO'S OWN CURVE, read out of its source text — the cross-file half of
 * the KEEP-IN-SYNC pair (§4's sharing table; both files carry the pointer,
 * this suite is the pin). Reading the SOURCE rather than rendering the Hero is
 * what makes the assertion cheap and total: the constant is a string literal,
 * the Hero is a client island with a clock in it, and nothing here needs it to
 * run — only to be spelled the way this band re-spells it.
 */
const heroFadeGradient = (): string => {
  const constant = heroSource.match(/const fadeClasses =\s*'([^']+)';/)?.[1];
  if (constant === undefined)
    throw new Error(
      'sections/Hero: no `fadeClasses` constant to read the curve from — the KEEP-IN-SYNC pointer in its header names this test.',
    );
  const gradient = constant.match(/bg-\[(linear-gradient\(.+\))\]$/)?.[1];
  if (gradient === undefined)
    throw new Error(
      `sections/Hero: \`fadeClasses\` carries no linear-gradient utility (${constant}).`,
    );
  // The ONE substitution the lilac ground makes: the same stops over the
  // band's tint instead of over the page ground.
  return gradient.replaceAll('var(--color-page)', 'var(--tint)');
};

/** The gradient a fade box actually wears, read back off the DOM. */
const gradientOf = (fade: HTMLElement): string => {
  const gradient = fade.className.match(/bg-\[(linear-gradient\(.+\))\]/)?.[1];
  if (gradient === undefined)
    throw new Error(`the fade box carries no gradient (${fade.className}).`);
  return gradient;
};

/** The <section> — the band itself. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

/** The three ground boxes, in flow order: fade in · tinted middle · fade out
 *  (run D7). Reached by structure because paint carries no role. */
const boxesOf = (container: HTMLElement): HTMLElement[] =>
  [...bandOf(container).children] as HTMLElement[];

/** ui/Container — the middle box's one child, the column the content sits in. */
const columnOf = (container: HTMLElement): HTMLElement =>
  boxesOf(container)[1].firstElementChild as HTMLElement;

const renderBand = (
  props: Partial<TintedBandProps> = {},
): ReturnType<typeof render> =>
  render(
    <TintedBand {...props}>
      <h2 id={HEADING_ID}>{TITLE}</h2>
      <p>{PARAGRAPH}</p>
    </TintedBand>,
  );

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

describe('TintedBand — the ground (run D7)', () => {
  it('paints three boxes: the fade in, the tinted middle, the fade out', () => {
    const { container } = renderBand();

    const [fadeIn, middle, fadeOut] = boxesOf(container);
    expect(boxesOf(container)).toHaveLength(3);
    // Paint is hidden from the accessibility tree: there is nothing in either
    // box to read, and an unlabelled box is one more stop down the page.
    expect(fadeIn).toHaveAttribute('aria-hidden', 'true');
    expect(fadeOut).toHaveAttribute('aria-hidden', 'true');
    expect(middle).not.toHaveAttribute('aria-hidden');
    // In FLOW, never absolute: the fades belong to this band rather than
    // overlapping whichever band sits above or below it.
    for (const fade of [fadeIn, fadeOut]) {
      expect(tokensOf(fade)).toContain('h-24');
      expect(fade.className).not.toContain('absolute');
      expect(fade.className).not.toContain('z-');
    }
  });

  it('declares the tint ONCE, on the band, and the middle box reads it', () => {
    const { container } = renderBand();

    const band = bandOf(container);
    const [fadeIn, middle, fadeOut] = boxesOf(container);

    expect(band.className).toBe(BAND);
    expect(middle.className).toBe('bg-(--tint)');
    // ONE definition: no box re-spells the mix, so the three can never drift.
    for (const box of [fadeIn, middle, fadeOut]) {
      expect(box.className).not.toContain('--tint:');
    }
  });

  it('fades to the TINT, never to the page — the seam argument', () => {
    const { container } = renderBand();

    for (const fade of [boxesOf(container)[0], boxesOf(container)[2]]) {
      // The Hero's curve with var(--tint) in place of var(--color-page): eight
      // eased color-mix stops plus the solid tint at 100%. If a stop ever
      // pointed back at the page ground, the fade's last pixel and the middle
      // box's ground would be two different colours — which is the hairline
      // this construction exists to make impossible.
      expect(fade.className).not.toContain('--color-page');
      expect(fade.className).toContain('transparent_0%');
      expect(fade.className).toContain('var(--tint)_100%)]');
      expect(fade.className.match(/var\(--tint\)/g)).toHaveLength(9);
      expect(
        fade.className.match(/color-mix\(in_srgb,var\(--tint\)/g),
      ).toHaveLength(8);
    }
  });

  it('spells the two fades as one curve read in both directions', () => {
    const { container } = renderBand();

    // The KEEP-IN-SYNC pin. Both constants are written out in full because
    // Tailwind's scanner reads source text and would never see a class built
    // from a template literal — so the guarantee that they are the same curve
    // has to live here.
    const [fadeIn, , fadeOut] = boxesOf(container);
    expect(fadeIn.className).toContain('linear-gradient(to_bottom,');
    expect(fadeOut.className).toBe(
      fadeIn.className.replace('to_bottom', 'to_top'),
    );
  });

  it('is the HERO’s curve, stop for stop, with the tint in place of the page', () => {
    // THE CROSS-FILE PIN (G2 react, 2026-09-21; moved here from
    // DoctorProfile.test.tsx with the ground, run D29). "The Hero's ten-stop
    // slow-in curve" is a claim this band's header makes; without this test it
    // would be a claim about the day the band was written, and a retuned home
    // page would leave the doctor page fading on the old shape. The Hero's
    // constant is read from its SOURCE text, `var(--color-page)` is swapped
    // for `var(--tint)` — the one deliberate difference — and the two must be
    // the same list. The BOXES are each band's own (absolute 10 % there, 6rem
    // in flow here), so only the gradient is compared.
    const { container } = renderBand();
    const expected = heroFadeGradient();

    const [fadeIn, , fadeOut] = boxesOf(container);
    expect(gradientOf(fadeIn)).toBe(expected);
    expect(gradientOf(fadeOut)).toBe(expected.replace('to_bottom', 'to_top'));
    // Never vacuous: the Hero's curve really is the ten-stop one, so a
    // constant that decayed to `linear-gradient(to_bottom,transparent)` on
    // both sides could not pass this pair.
    expect(expected.match(/color-mix\(in_srgb,var\(--tint\)/g)).toHaveLength(8);
  });
});

describe('TintedBand — the content slot (run D29)', () => {
  it('renders the children inside ui/Container, in the tinted middle box', () => {
    const { container } = renderBand();

    const [fadeIn, middle, fadeOut] = boxesOf(container);
    const column = columnOf(container);
    // ONE child in the middle box, and it is the atom's column — the page
    // gutter and the container-query context every consumer's @-steps ask.
    expect(middle.children).toHaveLength(1);
    expect(column.tagName).toBe('DIV');
    expect(column.className).toBe(containerClasses);
    // The consumer's markup lands straight in the column, in the order given,
    // with nothing of the band's own wrapped around it.
    expect([...column.children]).toEqual([
      screen.getByRole('heading', { level: 2, name: TITLE }),
      screen.getByText(PARAGRAPH),
    ]);
    // …and never in a fade: those are paint, empty by construction.
    for (const fade of [fadeIn, fadeOut]) {
      expect(fade.childNodes).toHaveLength(0);
    }
  });

  it('adds no padding and no margin of its own — the rhythm is the consumer’s', () => {
    // The `py` rides the consumer's grid INSIDE the column (an element cannot
    // query its own size, so it cannot sit on the Container), and the rhythm
    // BETWEEN bands is the page's (§6.4). So no spacing token on the band or
    // on any of its three boxes, and the column's row is the atom's alone.
    const { container } = renderBand();

    for (const element of [bandOf(container), ...boxesOf(container)]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)-?[pm][xytbse]?-/);
      }
    }
    expect(columnOf(container).className).toBe(containerClasses);
  });

  it('holds no words, no heading and no control of its own', () => {
    // A ground, not a section with content: everything a screen reader or a
    // search engine reads inside it arrives through `children`.
    const { container } = render(<TintedBand>{null}</TintedBand>);

    expect(container.textContent).toBe('');
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(boxesOf(container)).toHaveLength(3);
    expect(columnOf(container).childNodes).toHaveLength(0);
  });
});

describe('TintedBand — the native surface (§6.8)', () => {
  it('merges the caller className LAST on the <section>', () => {
    const { container } = renderBand({ className: 'mt-10' });

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe(`${BAND} mt-10`);
  });

  it('spreads native props onto the band', () => {
    const { container } = render(
      <TintedBand lang="de" id="profil" data-band="tinted">
        <p>{PARAGRAPH}</p>
      </TintedBand>,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('id', 'profil');
    expect(band).toHaveAttribute('data-band', 'tinted');
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    render(
      <TintedBand ref={band}>
        <p>{PARAGRAPH}</p>
      </TintedBand>,
    );

    expect(band.current?.tagName).toBe('SECTION');
  });

  it('is no region until a consumer names it', () => {
    // An unnamed <section> maps to a generic box, not a region — which is
    // what DoctorProfile wants (two equal halves, no one noun for both).
    const { container } = renderBand();

    expect(screen.queryByRole('region')).toBeNull();
    expect(bandOf(container)).not.toHaveAttribute('aria-labelledby');
    expect(bandOf(container)).not.toHaveAttribute('aria-label');
  });

  it('passes aria-labelledby THROUGH — the consumer’s own <h2> names the region', () => {
    // The DoctorStats shape (run D30): the band points at the heading it
    // renders inside the slot, and the <section> becomes a region announced
    // by that heading's text. The band itself never picks the name.
    const { container } = renderBand({ 'aria-labelledby': HEADING_ID });

    expect(screen.getByRole('region', { name: TITLE })).toBe(bandOf(container));
  });

  it('passes aria-label through as well', () => {
    const { container } = renderBand({ 'aria-label': 'Activitatea în cifre' });

    expect(screen.getByRole('region', { name: 'Activitatea în cifre' })).toBe(
      bandOf(container),
    );
  });
});

describe('TintedBand — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s', () => {
    const { container } = renderBand();

    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });

  it('ships NO client directive — the band is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bnext-intl\b/);
    expect([...CODE.matchAll(/\buse[A-Z]\w*\(/g)]).toHaveLength(0);
  });

  it('imports EXACTLY react (types only), ui/Container and lib/cx', () => {
    // The import surface is the guard a regex over the body cannot be: a data
    // module imported here would make a shared ground its own populator, and a
    // section imported here would make it a band with content of its own.
    // React arrives as TYPES only — no hook, no state — and erases at build.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Container/Container',
      '@/lib/cx/cx',
      'react',
    ]);
    expect(CODE).toMatch(/^import type \{[^}]*\} from 'react';$/m);
    // No lib DATA at all: a ground carries no fact about the clinic.
    expect(CODE).not.toMatch(
      /@\/lib\/(clinic|prices|reviews|team|routes|hours|hero-slides)/,
    );
    expect(CODE).not.toMatch(/@\/components\/sections\//);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });
});

describe('TintedBand — type-level pins', () => {
  it('pins the props surface so a refactor cannot quietly narrow or widen it', () => {
    // Erased to no-ops at runtime; they fail at `tsc --noEmit` time, naming
    // the property. `children` is the band's one own prop; the two ARIA naming
    // attributes STAY on the native side (a consumer names its band by its own
    // heading — DoctorProfile's Omit refuses them in ITS props, not here).
    expectTypeOf<TintedBandProps['children']>().toEqualTypeOf<ReactNode>();
    expectTypeOf<TintedBandProps>().toHaveProperty('aria-labelledby');
    expectTypeOf<TintedBandProps>().toHaveProperty('aria-label');
    expectTypeOf<TintedBandProps>().toHaveProperty('className');
    expectTypeOf<TintedBandProps>().toHaveProperty('ref');
  });

  it('refuses a band with no children key and accepts a named one', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the surface
    // loosens (or tightens). @ts-expect-error is itself an error when the line
    // compiles, so both directions are covered (the ui/GlyphButton precedent).

    // @ts-expect-error — the band exists to hold a consumer's content
    const empty: TintedBandProps = {};
    const named: TintedBandProps = {
      'aria-labelledby': HEADING_ID,
      children: <h2 id={HEADING_ID}>{TITLE}</h2>,
    };

    expect([empty, named]).toHaveLength(2);
  });
});
