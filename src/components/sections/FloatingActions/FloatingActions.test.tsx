import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Locale, locales, nativeNames } from '@/i18n/locales';
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
// One visible consequence since the language dial landed: with no CSS the
// closed stem is neither clipped nor hidden, so all four alternate-language
// anchors answer role queries. Every link query below is therefore NAMED.
//
// ── HARNESS NOTE — why '@/i18n/navigation' is the mock boundary, not
// 'next/navigation' (Header.test.tsx carries the long form: Vitest pre-bundles
// bare deps, and replacing next/navigation with vi.mock breaks ESM linking
// before any factory runs). Mocking OUR module controls exactly what the tree
// consumes, one call frame closer — and since §15.13 it has ONE export:
// usePathname, handing back the LOCALE-STRIPPED pathname. This section does not
// call it; the LanguageSwitcher it now mounts does, and without the mock the
// hook would ask a router that does not exist in this runner.
vi.mock('@/i18n/navigation', () => ({ usePathname: () => '/services/' }));

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

// The Fragment's two siblings in contract order (fb-132): the language dial ·
// the call CTA. There WAS a third — an aria-hidden clearance spacer — removed
// by the owner on 2026-09-04 (FloatingActions.tsx §3 carries the decision and
// what took over its duty).
const mount = (locale: Locale = 'ro') => {
  const { container, rerender } = render(<Mounted locale={locale} />);
  // Guard HERE, not only in the shape test: without it, a 3-child Fragment
  // binds `call` to the wrong element and the tests below fail with confident
  // lies about the wrong node. One assertion turns that into one honest failure
  // repeated identically (G2 typescript review, 2026-08-12).
  expect(container.children).toHaveLength(2);
  const [dial, call] = childrenOf(container);
  return { container, rerender, dial, call };
};

/**
 * The Fragment's children as HTMLElements. `container.children` is typed
 * `Element`, which has no `className` narrowing worth trusting and — the reason
 * this exists — cannot be handed to within(): a role query needs a real HTML
 * element. The throw is the honest failure for the impossible case rather than
 * a cast that would hide it.
 */
function childrenOf(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).map((child) => {
    if (!(child instanceof HTMLElement)) {
      throw new Error('FloatingActions rendered a non-HTML element');
    }
    return child;
  });
}

/**
 * The bulb's accessible name as the shipped data builds it: that locale's
 * `common.language.switch` with its one ICU argument filled by the endonym.
 * COMPUTED, never typed out — a hand-copied "Română · schimbă limba" would keep
 * passing after someone edited ro.json.
 */
const bulbName = (locale: Locale): string =>
  MESSAGES[locale].common.language.switch.replace(
    '{name}',
    nativeNames[locale],
  );

/** The one class starting with `prefix`, or '' — never a non-null assertion. */
const tokenStartingWith = (el: Element, prefix: string): string =>
  Array.from(el.classList).find((c) => c.startsWith(prefix)) ?? '';

// INVARIANT for the parsers below: their FAILURE VALUE MUST BE NaN, never a
// plausible number, because every caller feeds them to a positive-direction
// matcher (toBeGreaterThan / toBeGreaterThanOrEqual). NaN makes every such
// comparison false, so a parse miss FAILS LOUDLY instead of arithmetically
// passing. Corollary: never use these with a negated numeric matcher — that
// would invert the safety and let a miss slip through silently.

/** First rem length inside an arbitrary value, e.g. bottom-[calc(1rem+…)] → 1. */
const remIn = (token: string): number =>
  Number(/([\d.]+)rem/.exec(token)?.[1] ?? NaN);

/**
 * A per-BREAKPOINT rem table read off an element's classes: every token
 * matching `pattern` becomes one entry keyed by its variant prefix ('' for the
 * base step, 'xl', '2xl'), valued by the first rem inside it.
 *
 * This replaces the old single-number `boxRem`, which the corner pair outgrew
 * on 2026-08-27 when it gained `--disc-size` steps (D16 · F2): a clearance
 * computed from one fallback would be confidently wrong at exactly the widths
 * the steps exist for. `boxRem` said so by returning NaN; this reads all three.
 * An unparseable token still yields NaN, so the loud-failure invariant holds
 * per entry.
 */
const stepsIn = (el: Element, pattern: RegExp): Record<string, number> => {
  const steps: Record<string, number> = {};
  for (const token of Array.from(el.classList)) {
    const match = pattern.exec(token);
    if (!match) continue;
    steps[match[1] ?? ''] = remIn(token);
  }
  return steps;
};

/** `[--disc-size:3.5rem]` · `xl:[--disc-size:4rem]` → { '': 3.5, xl: 4 }. */
const DISC_STEP = /^(?:([a-z0-9]+):)?\[--disc-size:/;
/** `[--stem-inset:calc(6rem+…)]` · `xl:[--stem-inset:calc(7rem+…)]` → { '': 6, xl: 7 }. */
const STEM_INSET_STEP = /^(?:([a-z0-9]+):)?\[--stem-inset:/;

/** Every `--disc-size` token, sorted — the string the two corners must SHARE. */
const discTokens = (el: Element): string[] =>
  Array.from(el.classList)
    .filter((c) => DISC_STEP.test(c))
    .sort();

// `sticky top-4` + `h-20` = the Header pill's reach (Header.tsx's mount
// contract, which books the same 5rem for the shell's scroll-padding-top).
// The `up` stem must never be able to climb behind that blurred glass.
// …`h-20` since the owner's 2026-09-04 "same size on every screen", so 6rem —
// one value at every width, which is why the dial books one inset and not two.
const HEADER_PILL_REACH_REM = 6;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FloatingActions — a Fragment, never a wrapper (fb-132)', () => {
  it('renders exactly two siblings with no element around them', () => {
    // A wrapper would need position+z-index to carry the layer, which opens a
    // stacking context around both controls; a full-width fixed wrapper would
    // additionally swallow pointer events. Two siblings need neither patch.
    // TWO since 2026-09-04 (owner): the clearance spacer that used to be the
    // third child is gone, so this section now renders NOTHING in normal flow —
    // both children are `fixed`. Its place after {children} + Footer in the
    // shell is therefore about DOM/tab order now, not about geometry.
    const { container } = mount();
    expect(container.children).toHaveLength(2);
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
    const { call } = mount();
    const label = call.getAttribute('aria-label');
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

describe('FloatingActions — the language corner is a REAL control now', () => {
  // This suite replaces the "inert contract" one: until 2026-08-28 the corner
  // was a `<p aria-hidden>` placeholder that looked pressable and did nothing —
  // a risk the owner accepted twice (fb-129, fb-136) on the promise that Phase
  // 3 would turn it into a real button with a real name. These rows are that
  // promise, kept. What the switcher itself guarantees (hrefs per pathname, the
  // cookie, the modified-click rule) is pinned in its own suite; here the
  // question is only whether the CORNER mounts it correctly.

  it('exposes exactly ONE button in the whole tree — the bulb', () => {
    const { dial } = mount();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(dial).toContainElement(buttons[0]);
    expect(buttons[0]).toHaveTextContent('RO');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('names that button from the message file, endonym first (SC 2.5.3)', () => {
    const { dial } = mount();
    expect(
      within(dial).getByRole('button', { name: bulbName('ro') }),
    ).toBeInTheDocument();
  });

  it('carries the four alternate-language links in the HTML already (§16.2)', () => {
    // Always mounted, merely `inert` while closed (board D8 = M), so a crawler
    // that runs no JavaScript still finds /de/services/ from /ro/services/.
    const { dial } = mount();
    const links = Array.from(
      dial.querySelectorAll<HTMLAnchorElement>('a[hreflang]'),
    );
    expect(links.map((link) => link.hreflang)).toEqual(
      locales.filter((locale) => locale !== 'ro'),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/en/services/',
      '/de/services/',
      '/fr/services/',
      '/it/services/',
    ]);
  });

  it('leaves no <p> behind — the placeholder is gone, not hidden', () => {
    const { container } = mount();
    expect(container.querySelector('p')).toBeNull();
  });

  it('writes NO cookie just by being on the page (§8.7)', () => {
    // The site's one piece of storage is written on the explicit click and
    // nowhere else — which is what lets this site ship without a consent
    // banner (§12). Mounting the corner on every page must never touch it.
    const cookieSetter = vi.spyOn(Document.prototype, 'cookie', 'set');
    mount();
    expect(cookieSetter).not.toHaveBeenCalled();
  });
});

describe('FloatingActions — both corners follow the route locale', () => {
  // The sweep is DERIVED from the locale manifest: a sixth locale joins it the
  // moment src/i18n/locales.ts grows one. This is the test that a hardcoded
  // "RO" fails — such a badge would claim "you are reading Romanian" on /de.
  it.each(locales)(
    '%s → the bulb prints that code and is named in that language; so is the CTA',
    (locale) => {
      const { dial } = mount(locale);
      const bulb = within(dial).getByRole('button', { name: bulbName(locale) });
      expect(bulb).toHaveTextContent(locale.toUpperCase());
      expect(
        screen.getByRole('link', {
          name: MESSAGES[locale].common.actions.call,
        }),
      ).toBeInTheDocument();
    },
  );

  it('re-renders bulb AND CTA name when the locale changes underneath it', () => {
    const { dial, rerender } = mount('ro');
    expect(within(dial).getByRole('button')).toHaveTextContent('RO');
    expect(
      screen.getByRole('link', { name: ro.common.actions.call }),
    ).toBeInTheDocument();

    rerender(<Mounted locale="de" />);

    const bulb = within(dial).getByRole('button');
    expect(bulb).toHaveTextContent('DE');
    expect(bulb).toHaveAccessibleName(bulbName('de'));
    expect(
      screen.getByRole('link', { name: de.common.actions.call }),
    ).toBeInTheDocument();
  });

  it('uppercases in JS, not in CSS (fb-133)', () => {
    // `uppercase` would make the DOM text and the visible text diverge, and a
    // voice-control user says what they SEE.
    const { dial } = mount();
    const bulb = within(dial).getByRole('button');
    expect(Array.from(bulb.classList)).not.toContain('uppercase');
    expect(bulb).toHaveTextContent('RO');
  });
});

describe('FloatingActions — one number, two corners (D16 · F2)', () => {
  it('gives BOTH controls the identical --disc-size token list', () => {
    // The pair is only a pair if it scales together: a 72px language bulb
    // beside a 56px call button stops reading as one row. Comparing the sorted
    // class lists is what makes "one number" checkable — both atoms read the
    // variable through ui/disc.ts, so equal tokens mean equal boxes.
    const { dial, call } = mount();
    expect(discTokens(dial)).toEqual(discTokens(call));
    expect(discTokens(dial)).toHaveLength(3);
  });

  it('steps at exactly the base, xl and 2xl screen types', () => {
    const { dial, call } = mount();
    for (const el of [dial, call]) {
      expect(Object.keys(stepsIn(el, DISC_STEP)).sort()).toEqual([
        '',
        '2xl',
        'xl',
      ]);
    }
  });
});

describe('FloatingActions — layering, safe area, and clearance', () => {
  it('pins both controls to the viewport on ONE layer (z-40)', () => {
    const { dial, call } = mount();
    for (const el of [dial, call]) {
      expect(Array.from(el.classList)).toContain('fixed');
      expect(Array.from(el.classList)).toContain('z-40');
    }
  });

  it('renders NOTHING in normal flow — every child is viewport-pinned', () => {
    // The inverse of the deleted spacer test, and the assertion that makes the
    // 2026-09-04 removal explicit: this section contributes no page height at
    // all now, which is exactly why the footer can reach the bottom edge
    // (app/[locale]/layout.tsx's sticky-footer rule) with nothing under it.
    const { container } = mount();
    for (const child of childrenOf(container)) {
      expect(Array.from(child.classList)).toContain('fixed');
    }
  });

  it('anchors BOTH controls at the same offset — the "one row" contract', () => {
    // Also the precondition for the clearance test below: the two corners are
    // only "one row" if they share a bottom edge.
    const { dial, call } = mount();
    expect(tokenStartingWith(call, 'bottom-')).toBe(
      tokenStartingWith(dial, 'bottom-'),
    );
  });

  it('keeps every control INSIDE the scroll clearance globals.css books for it', () => {
    // THE ARITHMETIC SURVIVES THE SPACER (owner removal, 2026-09-04) — it just
    // points at the surviving consumer. It used to compare the controls' reach
    // against the spacer's own `h-` classes, one step per size step; the spacer
    // is gone, so the numbers it was derived from now live ONLY in globals.css'
    // base layer as `scroll-padding-bottom`, which this section's header
    // obligation (a) books and cannot set itself (§6 forbids a section styling
    // the shell). Without this test, changing one `--disc-size` step or pushing
    // a control up to bottom-8 would silently outgrow a shell number no file
    // checks — the exact hole the spacer version existed to close.
    // KEEP-IN-SYNC: src/styles/globals.css `@layer base` html rules; the
    // computed values are pinned from the other side in
    // src/app/[locale]/shell.test.tsx ("mirrors the clearance … in three steps").
    const CLEARANCE_REM: Record<string, number> = {
      '': 5.5,
      xl: 6,
      '2xl': 6.5,
    };
    const { dial, call } = mount();

    for (const el of [dial, call]) {
      const steps = stepsIn(el, DISC_STEP);
      // globals must define a step for every width the controls grow at — one
      // missing breakpoint is a corner that under-clears exactly there.
      expect(Object.keys(CLEARANCE_REM).sort()).toEqual(
        Object.keys(steps).sort(),
      );
      for (const [prefix, step] of Object.entries(steps)) {
        // Each control's reach from ITS OWN bottom token: reading one corner's
        // offset and applying it to both was a real hole (G2 react review,
        // 2026-08-12), and reading one SIZE for all widths became the same hole
        // when the steps landed (G2, 2026-08-27).
        const reach = step + remIn(tokenStartingWith(el, 'bottom-'));
        // NaN from either parser fails here rather than reaching the comparison.
        expect(reach).toBeGreaterThan(0);
        expect(CLEARANCE_REM[prefix]).toBeGreaterThanOrEqual(reach);
      }
    }
  });

  it('keeps the open stem clear of the Header pill via --stem-inset', () => {
    // The atom's extreme-zoom cap is measured from the BULB'S CENTRE and reads
    // this variable (ui/SpeedDial's public CSS variables). Only the host knows
    // the number, so the host does the arithmetic: its own bottom offset plus
    // the sticky bar's reach. Get it wrong and a 400%-zoom stem parks discs
    // behind blurred glass (SC 1.4.10 / 2.4.11).
    // ONE STEP, at every width — the bar is the same height on every screen
    // since the owner's 2026-09-04 uniform-height ask, so its reach is a single
    // 6rem and this inset a single 7rem. (Earlier the same day it briefly
    // carried an `xl:` twin, for a bar that grew only on desktop.) Still read
    // as a per-breakpoint TABLE rather than as one token, so that a step
    // reappearing without the matching arithmetic fails here — the lesson the
    // --disc-size steps taught this file on 2026-08-27.
    const { dial } = mount();
    const insets = stepsIn(dial, STEM_INSET_STEP);
    const offset = remIn(tokenStartingWith(dial, 'bottom-'));

    expect(Object.keys(insets)).toEqual(['']);
    expect(insets['']).toBe(offset + HEADER_PILL_REACH_REM);
    // The safe-area term belongs to every step, exactly as on the offsets.
    for (const token of Array.from(dial.classList).filter((c) =>
      STEM_INSET_STEP.test(c),
    )) {
      expect(token).toContain('env(safe-area-inset-bottom)');
    }
  });

  it('lifts BOTH controls by the SAME safe-area inset', () => {
    // Notched/gesture-bar phones: env() resolves to 0px everywhere else, so the
    // calc collapses to the plain rem offset — one expression, both worlds.
    // The other half of this pair — that every `scroll-padding-bottom` step
    // carries the same term, not just the base one — used to be asserted here
    // against the spacer's three heights; since the removal it belongs to the
    // rules themselves and is pinned in shell.test.tsx's scroll-padding suite.
    const { dial, call } = mount();
    const INSET = 'env(safe-area-inset-bottom)';
    expect(tokenStartingWith(dial, 'bottom-')).toContain(INSET);
    expect(tokenStartingWith(call, 'bottom-')).toContain(INSET);
  });
});
