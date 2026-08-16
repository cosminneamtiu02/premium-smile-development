import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { type Locale, locales } from '@/i18n/locales';
import { clinic } from '@/lib/clinic';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { FloatingActions } from './FloatingActions';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7).
//
// REAL message files, never invented fixtures: this is the first component in
// the repo that calls t(), so the strings under test must be the shipped
// translations. A renamed/dropped key then fails HERE as well as in the
// translation-parity gate, instead of silently rendering the key path (which is
// exactly what next-intl does for a miss — see the "never a key" test).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, same convention as GlyphButton.test.tsx.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

// The provider the section gets in production (app/[locale]/layout.tsx wraps
// the whole tree in it) and in Storybook (.storybook/preview.tsx decorator) —
// so the tests mount it the same way. The section itself is NOT a client
// component; useTranslations/useLocale are isomorphic and read this context.
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <FloatingActions />
  </NextIntlClientProvider>
);

// The Fragment's three siblings in contract order (fb-132): language pill ·
// call CTA · clearance spacer. Two of the three are aria-hidden BY DESIGN and
// therefore unreachable by role — reading them positionally is deliberate, and
// the inert-contract suite below asserts that unreachability instead of
// working around it.
const mount = (locale: Locale = 'ro') => {
  const { container, rerender } = render(<Mounted locale={locale} />);
  // Guard HERE, not only in the shape test: without it, a 4-child Fragment
  // binds `spacer` to the wrong element and ~18 tests fail with confident lies
  // about the wrong node. One assertion turns that into one honest failure
  // repeated identically (G2 typescript review, 2026-08-12).
  expect(container.children).toHaveLength(3);
  const [pill, call, spacer] = Array.from(container.children);
  return { container, rerender, pill, call, spacer };
};

const SPACING_STEP_REM = 0.25; // Tailwind's default scale, untouched (§3, §7)

/** The one class starting with `prefix`, or '' — never a non-null assertion. */
const tokenStartingWith = (el: Element, prefix: string): string =>
  Array.from(el.classList).find((c) => c.startsWith(prefix)) ?? '';

// INVARIANT for both parsers below: their FAILURE VALUE MUST BE NaN, never a
// plausible number, because every caller feeds them to a positive-direction
// matcher (toBeGreaterThan / toBeGreaterThanOrEqual). NaN makes every such
// comparison false, so a parse miss FAILS LOUDLY instead of arithmetically
// passing. Corollary: never use these with a negated numeric matcher — that
// would invert the safety and let a miss slip through silently.

/** First rem length inside an arbitrary value, e.g. bottom-[calc(1rem+…)] → 1. */
const remIn = (token: string): number =>
  Number(/([\d.]+)rem/.exec(token)?.[1] ?? NaN);

/**
 * `size-14` → 3.5rem. Ignores the `[&_svg]:size-7` glyph rule on purpose.
 * Returns NaN — NOT 0 — when there is no scale-size class (e.g. someone
 * switches to `size-[3.5rem]` or `h-14 w-14`). `Number('')` is 0, and 0 is a
 * plausible-looking box that would let the clearance assertion below pass with
 * nonsense; NaN cannot (G2 typescript review, 2026-08-12).
 */
const boxRem = (el: Element): number => {
  const token = Array.from(el.classList).find((c) => /^size-\d+$/.test(c));
  return token === undefined
    ? NaN
    : Number(token.replace('size-', '')) * SPACING_STEP_REM;
};

describe('FloatingActions — a Fragment, never a wrapper (fb-132)', () => {
  it('renders exactly three siblings with no element around them', () => {
    // A wrapper would need position+z-index to carry the layer, which opens a
    // stacking context around both controls; a full-width fixed wrapper would
    // additionally swallow pointer events. Three siblings need neither patch.
    const { container } = mount();
    expect(container.children).toHaveLength(3);
  });
});

describe('FloatingActions — the call CTA', () => {
  it('is a LINK to the single-source clinic number (§10.1), named in Romanian', () => {
    mount();
    const link = screen.getByRole('link', { name: ro.common.actions.call });
    // Derived from lib/clinic.ts — the number is never re-typed at a call site.
    expect(link).toHaveAttribute('href', `tel:${clinic.phone}`);
  });

  it('carries the TRANSLATED label, never the key path', () => {
    // next-intl does not throw on a miss: it renders the key ("common.actions.
    // call") and logs. Without this assertion a wrong namespace would ship a
    // dotted machine string as the CTA's accessible name.
    mount();
    const label = screen.getByRole('link').getAttribute('aria-label');
    expect(label).toBe(ro.common.actions.call);
    expect(label).not.toMatch(/actions\.call|^common\./);
  });

  it('keeps the phone glyph UNLABELLED so the anchor announces once', () => {
    // See the `children` prop doc in ui/GlyphButton — a labelled glyph inside
    // an asChild anchor double-announces in the a11y tree.
    const { call } = mount();
    const svg = call.querySelector('svg');
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });
});

describe('FloatingActions — the inert contract, ASSERTED not assumed', () => {
  it('exposes no button anywhere in the tree', () => {
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('exposes exactly ONE link — the phone; the pill is not a control', () => {
    const { call } = mount();
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toBe(call);
  });

  it('renders the pill as a plain <p>: no role, no tab stop, nothing nested', () => {
    // The LanguageSwitcher placeholder (Phase 3, §8.5). aria-hidden because
    // <html lang> already conveys the page language authoritatively; a
    // two-letter badge repeats it in a form screen readers mispronounce, and
    // it carries nothing actionable — hiding it removes noise, not information.
    const { pill } = mount();
    expect(pill.tagName).toBe('P');
    expect(pill).toHaveAttribute('aria-hidden', 'true');
    expect(pill).not.toHaveAttribute('role');
    expect(pill).not.toHaveAttribute('tabindex');
    // NOTE the reach of this one: `[onclick]` matches only an inline DOM
    // attribute. React attaches onClick synthetically and writes no attribute,
    // so a stealth handler would slip past THIS clause — jsx-a11y's
    // no-static-element-interactions rule is what catches that, at lint time.
    // The assertions that carry the inert contract for assistive tech are the
    // role / tabindex / nested-control ones (G2 review, 2026-08-12).
    expect(pill.querySelector('a, button, [role], [onclick]')).toBeNull();
  });
});

describe('FloatingActions — the pill follows the route locale (fb-133)', () => {
  // The sweep is DERIVED from the locale manifest: a sixth locale joins it the
  // moment src/i18n/locales.ts grows one. This is the test that a hardcoded
  // "RO" fails — such a badge would claim "you are reading Romanian" on /de.
  it.each(locales)(
    '%s → the uppercased code, and the CTA named from that locale file',
    (locale) => {
      const { pill } = mount(locale);
      expect(pill.textContent).toBe(locale.toUpperCase());
      expect(screen.getByRole('link')).toHaveAttribute(
        'aria-label',
        MESSAGES[locale].common.actions.call,
      );
    },
  );

  it('re-renders pill AND CTA name when the locale changes underneath it', () => {
    const { pill, rerender } = mount('ro');
    expect(pill.textContent).toBe('RO');
    expect(screen.getByRole('link')).toHaveAttribute(
      'aria-label',
      ro.common.actions.call,
    );

    rerender(<Mounted locale="de" />);
    expect(pill.textContent).toBe('DE');
    expect(screen.getByRole('link')).toHaveAttribute(
      'aria-label',
      de.common.actions.call,
    );
  });

  it('uppercases in JS, not in CSS, and adds no chevron (fb-134)', () => {
    const { pill } = mount();
    // `uppercase` would make the DOM text and the visible text diverge.
    expect(Array.from(pill.classList)).not.toContain('uppercase');
    // Exactly the code: a ▸ is the visual grammar for "opens a list" and would
    // tell sighted users the lie the missing button role refuses to tell.
    expect(pill.textContent).toBe('RO');
  });

  it('paints the pill from SEMANTIC tokens only (§3 standing note)', () => {
    const { pill } = mount();
    expect(Array.from(pill.classList)).toEqual(
      expect.arrayContaining([
        'bg-surface',
        'text-ink',
        'border-line',
        'rounded-full',
        'font-mono',
      ]),
    );
    expect(pill.className).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('FloatingActions — layering, safe area, and clearance', () => {
  it('pins both controls to the viewport on ONE layer (z-40)', () => {
    const { pill, call } = mount();
    for (const el of [pill, call]) {
      expect(Array.from(el.classList)).toContain('fixed');
      expect(Array.from(el.classList)).toContain('z-40');
    }
  });

  it('leaves the spacer in NORMAL FLOW — a fixed spacer would clear nothing', () => {
    const { spacer } = mount();
    expect(Array.from(spacer.classList)).not.toContain('fixed');
    expect(Array.from(spacer.classList)).not.toContain('absolute');
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(spacer.textContent).toBe('');
  });

  it('anchors BOTH controls at the same offset — the "one row" contract', () => {
    // Also the precondition for the clearance test below: the two corners are
    // only "one row" if they share a bottom edge.
    const { pill, call } = mount();
    expect(tokenStartingWith(call, 'bottom-')).toBe(
      tokenStartingWith(pill, 'bottom-'),
    );
  });

  it('sizes the spacer to clear EVERY control plus that control OWN offset', () => {
    // Derived, not a magic number: shrink the CTA to size="md" or push either
    // control up to bottom-8 and this arithmetic — not a reviewer — objects.
    //
    // Each control's reach is measured from ITS OWN bottom token. Reading the
    // pill's offset and applying it to both was a real hole: raising only the
    // CTA to bottom-[calc(3rem+…)] put its top 6.5rem above the edge, past the
    // 5.5rem spacer, while all 19 tests still passed (G2 react review,
    // 2026-08-12).
    const { pill, call, spacer } = mount();
    const reachRem = (el: Element) =>
      boxRem(el) + remIn(tokenStartingWith(el, 'bottom-'));
    const reaches = [reachRem(pill), reachRem(call)];
    const clearanceRem = remIn(tokenStartingWith(spacer, 'h-'));

    // NaN from either parser fails here rather than reaching the comparison.
    for (const r of reaches) expect(r).toBeGreaterThan(0);
    expect(clearanceRem).toBeGreaterThanOrEqual(Math.max(...reaches));
  });

  it('lifts controls and clearance by the SAME safe-area inset', () => {
    // Notched/gesture-bar phones: env() resolves to 0px everywhere else, so the
    // calc collapses to the plain rem offset — one expression, both worlds.
    const { pill, call, spacer } = mount();
    const INSET = 'env(safe-area-inset-bottom)';
    expect(tokenStartingWith(pill, 'bottom-')).toContain(INSET);
    expect(tokenStartingWith(call, 'bottom-')).toContain(INSET);
    expect(tokenStartingWith(spacer, 'h-')).toContain(INSET);
  });
});
