import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { userEvent } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet, the ui/SpeedDial.test.tsx precedent, for TWO reasons
// this suite actually cashes in:
//  · REAL GEOMETRY for a real click. These tests drive the atom the way a
//    visitor does — open the stem, click a disc — and vitest/browser's
//    userEvent is Playwright aiming at coordinates. Without the compiled CSS
//    the discs sit wherever the default flow puts them, which is not where the
//    thermometer draws them.
//  · REAL VISIBILITY. `inert:invisible` (visibility: hidden) is what makes the
//    closed alternates unreachable by sight and by the Tab key while still
//    being in the HTML for a crawler — the exact §16.2/§10.4 claim asserted
//    below. With no stylesheet the "invisible while closed" test would pass on
//    an element that is plainly visible, i.e. prove nothing.
import '@/styles/globals.css';
import { locales, type Locale, nativeNames } from '@/i18n/locales';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import {
  LanguageSwitcher,
  type LanguageSwitcherProps,
} from './LanguageSwitcher';

// sections/LanguageSwitcher — the interaction suite. Role-based queries on
// purpose (§9, §13): a passing test doubles as proof of accessible markup, and
// the four alternates are only reachable as `link`s because they really are
// anchors (§15.13 — the browser navigates, no router exists). Fixtures are
// Romanian with diacritics (§15.7), and every user-facing string comes from the
// REAL message files or src/i18n/locales.ts — never a literal typed in here
// (§17.4). A renamed or dropped key then fails HERE as well as in the
// translation-parity gate, instead of silently rendering the dotted key path
// (next-intl's behaviour on a miss).
//
// WHAT THIS FILE DOES NOT TEST: open/close mechanics. Esc, the outside pointer
// press, focus-out and the bfcache close all live in ui/SpeedDial (board D11)
// and are pinned by its own 100+ assertions. The section adds no listener, no
// state and no element — so what is on trial here is exactly the three things
// it DOES own: the five options it builds, the one string it translates, and
// the one cookie it writes.
//
// ── HARNESS NOTE — why '@/i18n/navigation' is the mock boundary, not
// 'next/navigation' (Header.test.tsx carries the long form). Vitest pre-bundles
// bare deps: next-intl's optimized chunk imports next/navigation's optimized
// chunk by esbuild-internal alias, so replacing next/navigation with vi.mock
// breaks ESM linking before any factory runs. Mocking OUR module controls
// exactly what the section consumes, one call frame closer — and since §15.13
// that module has ONE export: usePathname, handing back the LOCALE-STRIPPED
// pathname ('/ro/services/' → '/services/'). Everything downstream of it runs
// for real: localeHref, equivalentPath and nativeNames are the shipping code,
// so the hrefs asserted below are the strings a visitor's browser receives.
// The REAL chain (next/navigation → stripLocale) is exercised one tier up, in
// LanguageSwitcher.stories.tsx, through parameters.nextjs.navigation.
const nav = vi.hoisted(() => ({ pathname: '/services/' as `/${string}` }));

vi.mock('@/i18n/navigation', () => ({ usePathname: () => nav.pathname }));

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/**
 * The bulb's accessible name as the shipped data builds it: the locale's own
 * `common.language.switch`, its one ICU argument filled with the endonym.
 * COMPUTED, never typed out — a hand-copied "Română, schimbă limba" would keep
 * passing after someone edited ro.json, which is the exact failure the message
 * files exist to prevent.
 */
const bulbName = (locale: Locale): string =>
  MESSAGES[locale].common.language.switch.replace(
    '{name}',
    nativeNames[locale],
  );

/**
 * Room for the stem, the SpeedDial.test.tsx Ground: the discs are absolutely
 * positioned OUTSIDE the root's own box, so a dial rendered at the top-left of
 * the document would unfold its `up` stem above y = 0, where the real browser
 * driving these tests cannot click it.
 */
const Ground = ({ children }: { children: ReactNode }) => (
  <div style={{ padding: '18rem' }}>{children}</div>
);

// The provider the section gets in production (app/[locale]/layout.tsx wraps
// the whole tree in it) and in Storybook (.storybook/preview.tsx decorator), so
// the tests mount it the same way. This section IS a client island, but only
// because of the cookie and the router — its two next-intl hooks read this
// context exactly as they read the request-scoped config in the build.
const Mounted = ({
  locale,
  ...props
}: { locale: Locale } & LanguageSwitcherProps): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <LanguageSwitcher {...props} />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro', props: LanguageSwitcherProps = {}) =>
  render(<Mounted locale={locale} {...props} />, { wrapper: Ground });

const bulbOf = (locale: Locale = 'ro') =>
  screen.getByRole('button', { name: bulbName(locale) });

/** The stem's <ul>, resolved the way a screen reader does: through aria-controls. */
const listOf = (locale: Locale = 'ro') => {
  const id = bulbOf(locale).getAttribute('aria-controls') ?? '';
  const list = document.querySelector(`#${id}`);
  if (!(list instanceof HTMLUListElement)) {
    throw new Error(`aria-controls "${id}" does not resolve to the <ul>`);
  }
  return list;
};

/**
 * The section's OUTERMOST box — the <nav> landmark, which is also where the
 * host's className lands (§6.8). Resolved BY ROLE, not by walking parents: the
 * landmark is the thing under test, so finding it the way a screen reader does
 * makes one query prove both facts, and an atom that grows a wrapper cannot
 * quietly break the walk.
 */
const regionOf = (locale: Locale = 'ro') =>
  screen.getByRole('navigation', {
    name: MESSAGES[locale].common.language.region,
  });

/** Every alternate, in DOM order — anchors, because every option carries an href. */
const alternates = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>('a[hreflang]'));

const open = async (locale: Locale = 'ro') => {
  await userEvent.click(bulbOf(locale));
  return bulbOf(locale);
};

// Test environment, not product styling: unlayered author CSS beats Tailwind's
// @layer utilities without !important. The stencil sweep and the 60ms stagger
// are visual concerns, verified in ui/SpeedDial's compiled CSS and disabled in
// every snapshot (§13) — a unit test must never wait out a 300ms clock, and
// asserting inside one is how a suite goes CI-flaky (PR #45). Everything below
// therefore asserts IMMEDIATELY.
let stillnessStyle: HTMLStyleElement | null = null;

// Real anchors in a real browser: an unguarded disc click would NAVIGATE the
// runner away mid-suite. This listener sits on `document`, in the BUBBLE phase,
// so it runs AFTER React's root-container handler — late enough to record what
// the section did (§15.13: `defaultPrevented` must be FALSE, the browser is the
// thing that navigates) and still early enough to cancel the default action.
const clicks: boolean[] = [];
const guardNavigation = (event: MouseEvent) => {
  clicks.push(event.defaultPrevented);
  event.preventDefault();
};

/**
 * THE COOKIE PROBE. `document.cookie` is an accessor on Document.prototype in
 * Chromium, so spying on its SETTER is what makes the exact written string —
 * attributes and all — assertable; reading `document.cookie` back only ever
 * shows `name=value`, because a browser never hands the attributes back.
 * `vi.spyOn` calls through, so the real cookie is still written and the
 * browser-parsed half can be checked too. Returned rather than typed out so the
 * declaration cannot drift from Vitest's generic signature.
 */
const spyOnCookie = () => vi.spyOn(Document.prototype, 'cookie', 'set');
let cookieSetter: ReturnType<typeof spyOnCookie>;

const CLEAR_COOKIE = 'NEXT_LOCALE=; path=/; max-age=0; Secure';

beforeAll(() => {
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent =
    '[aria-controls], [aria-controls] ~ ul, [aria-controls] ~ ul * { transition: none; }';
  document.head.append(stillnessStyle);
  document.addEventListener('click', guardNavigation);
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
  document.removeEventListener('click', guardNavigation);
});

beforeEach(() => {
  nav.pathname = '/services/';
  clicks.length = 0;
  // Cleared BEFORE the spy is installed, so the housekeeping write is not one
  // of the calls a "never writes a cookie" test would then have to explain.
  document.cookie = CLEAR_COOKIE;
  cookieSetter = spyOnCookie();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.cookie = CLEAR_COOKIE;
});

describe('LanguageSwitcher — closed: one control, four crawlable alternates', () => {
  it('shows exactly ONE button — the bulb, printing the current code', () => {
    mount();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toBe(bulbOf());
    expect(buttons[0]).toHaveTextContent('RO');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('names the bulb from the message file, endonym first (SC 2.5.3)', () => {
    mount();
    // The name is the whole reason this tier calls t(): the disc shows an
    // abbreviation, so the spoken name has to say the language out loud.
    expect(bulbOf()).toHaveAccessibleName(bulbName('ro'));
  });

  it('keeps the CTA bundle on the bulb — hover-manner parity with the call disc (D4 reversed 2026-09-04; rest-colour half superseded by the flag, 2026-09-05)', () => {
    // TITLE REWORDED at G2 (2026-09-05, both reviewers): the flag now covers
    // the bulb at rest, so the old "rest parity" claim is history — see the
    // SUPERSEDED IN PART note beside tone="cta" in LanguageSwitcher.tsx. The
    // ASSERTIONS below are byte-identical: the computed --cta fill is the
    // unflagged fallback under the art, and the hover bundle still drives the
    // corner pair — both still load-bearing, both still pinned.
    // The owner's ask was a RELATIONSHIP, not a hex code: "at rest phone and
    // language switcher to be same color". So this asserts the ROLE the bulb is
    // painted with, resolved by the real sheet this file already loads — not a
    // literal, which would keep passing if `--cta` were ever re-pointed and the
    // two corners silently drifted apart again.
    // The probe is how both sides get parsed by the same engine: `--cta` is
    // authored as #008854 while a computed background-color reads back as
    // rgb(0, 136, 84), and comparing the two strings directly would fail on
    // notation rather than on colour.
    mount();
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--cta)';
    document.body.append(probe);
    try {
      expect(getComputedStyle(bulbOf()).backgroundColor).toBe(
        getComputedStyle(probe).backgroundColor,
      );
    } finally {
      probe.remove();
    }
    // …and the hover manner comes with it, from the SAME bundle GlyphButton's
    // `solid` call disc wears (SpeedDial's `cta` toneClasses): one named pair,
    // so the two corners cannot fade differently. The stem is unaffected — tone
    // stops at the bulb since the owner's 2026-08-27 reversal of D5.
    expect(Array.from(bulbOf().classList)).toEqual(
      expect.arrayContaining(['bg-cta', 'hover:bg-cta-hover']),
    );
  });

  it('ships the four alternates in the HTML while CLOSED — crawlable (§16.2)', () => {
    // D8 = M: the stem is always mounted and only `inert` + one attribute flip
    // on open, so the pre-hydration document already carries every
    // alternate-language link. A search engine following /ro/services/ finds
    // /de/services/ without running a line of JavaScript.
    const { container } = mount();
    const links = alternates(container);
    expect(links).toHaveLength(locales.length - 1);
    expect(links.map((link) => link.hreflang)).toEqual(
      locales.filter((locale) => locale !== 'ro'),
    );
    // …and IN THE HTML is all they are: `inert` kills them for the keyboard and
    // for assistive tech, and the atom's `inert:invisible` belt hides them from
    // sight (SC 4.1.2 / 2.4.7 — an invisible-but-tabbable link parks a focus
    // ring on nothing). The stillness style makes that immediate, so this is a
    // state, not a moment in an animation.
    for (const link of links) expect(link).not.toBeVisible();
  });

  it('gives every alternate its own language: hreflang = lang = its locale', () => {
    const { container } = mount();
    for (const link of alternates(container)) {
      expect(link.hreflang).toBe(link.lang);
      // Resolved through the manifest rather than cast to it: `as Locale` on a
      // DOM string would hand nativeNames a key it may not have, and
      // toHaveAttribute(name, undefined) degrades to "the attribute exists" —
      // a green test for a nameless disc (G2 typescript, 2026-08-28).
      const locale = locales.find((entry) => entry === link.lang);
      if (!locale) {
        throw new Error(
          `a disc carries lang="${link.lang}", not a site locale`,
        );
      }
      // aria-label is the endonym, so a screen reader switches voice and says
      // "Deutsch" in German; the visible text is the code it prints, and the
      // endonym contains it (SC 2.5.3).
      expect(link).toHaveAttribute('aria-label', nativeNames[locale]);
      expect(link.textContent).toBe(link.lang.toUpperCase());
    }
  });

  it('backs every disc with its own country flag — decoration only (§8.5, amended 2026-09-04)', () => {
    // The owner's flag round (board .claude/plans/speed-dial-flags.plan.md):
    // the hook hands each option a flag, ui/SpeedDial paints it behind the
    // code. Asserted HERE because this is the tier where a flag becomes a fact
    // — the atom only knows it was handed a node, and its own suite says so.
    // Union Jack for `en` and Germany's for `de` are the owner's picks ("so not
    // usa"); which drawing is which is pinned in src/assets/flags, so what this
    // proves is that FIVE of them arrive, one per disc, bulb included.
    const { container } = mount();
    const controls: Element[] = [bulbOf(), ...alternates(container)];
    expect(controls).toHaveLength(locales.length);
    for (const control of controls) {
      const flag = control.querySelector('svg');
      expect(flag).not.toBeNull();
      // Decorative twice over: the flag component hides itself, and the atom's
      // layer around it is hidden too — so a screen reader walking this dial
      // hears five languages and not one word about a country.
      expect(flag).toHaveAttribute('aria-hidden', 'true');
      expect(flag?.parentElement).toHaveAttribute('aria-hidden', 'true');
    }
    // …and the a11y tree is EXACTLY what it was before the flags arrived: the
    // bulb named from the message file, every alternate named by its endonym,
    // every visible text still the code (§8.5's surviving half — a flag may
    // never be the only way a language is identified).
    expect(bulbOf()).toHaveAccessibleName(bulbName('ro'));
    for (const link of alternates(container)) {
      const locale = locales.find((entry) => entry === link.lang);
      if (!locale) throw new Error(`a disc carries lang="${link.lang}"`);
      // The ATTRIBUTE, not toHaveAccessibleName: a closed stem is
      // `visibility: hidden`, and a hidden element has no computed accessible
      // name at all (the same reason the suite's role queries wait for open).
      expect(link).toHaveAttribute('aria-label', nativeNames[locale]);
      // The flag adds no text node, so the DOM text is still the code alone —
      // what a voice-control user says and what SC 2.5.3 compares (fb-133).
      expect(link.textContent).toBe(locale.toUpperCase());
    }
  });

  it('never renders the CURRENT locale as a link — it IS the bulb (D1)', () => {
    // Model C: a "switch to the language you are already reading" link is a
    // self-referential no-op the crawler and the keyboard both have to walk.
    const { container } = mount();
    expect(alternates(container).map((link) => link.hreflang)).not.toContain(
      'ro',
    );
  });
});

describe('LanguageSwitcher — the hrefs are the equivalent page (§5, §15.13)', () => {
  it('points at the SAME page under each other prefix, on /services/', () => {
    // Literal strings on purpose, not localeHref(target, equivalentPath(…)):
    // deriving the expectation from the code under test would make a broken
    // rule agree with itself. lib/routes.test.ts pins the composition; this is
    // what the DOM must contain. (basePath is '' in this runner — pinned by
    // vitest.config's define.)
    const { container } = mount();
    expect(
      alternates(container).map((link) => link.getAttribute('href')),
    ).toEqual([
      '/en/services/',
      '/de/services/',
      '/fr/services/',
      '/it/services/',
    ]);
  });

  it('points at each locale HOME when you are on the home page', () => {
    nav.pathname = '/';
    const { container } = mount();
    expect(
      alternates(container).map((link) => link.getAttribute('href')),
    ).toEqual(['/en/', '/de/', '/fr/', '/it/']);
  });

  it('keeps the trailing slash a real address bar carries, on /team/', () => {
    nav.pathname = '/team/';
    const { container } = mount();
    expect(
      alternates(container).map((link) => link.getAttribute('href')),
    ).toEqual(['/en/team/', '/de/team/', '/fr/team/', '/it/team/']);
  });

  it.each(['/blog/', '/blog/un-articol/'] as const)(
    'sends every alternate HOME from %s — the blog is Romanian-only (§5)',
    (pathname) => {
      // /de/blog is never generated, so linking to it would be a 404 in four
      // languages. equivalentPath is what knows that, matchesRoute is what
      // makes the article count as "under /blog".
      nav.pathname = pathname;
      const { container } = mount();
      expect(
        alternates(container).map((link) => link.getAttribute('href')),
      ).toEqual(['/en/', '/de/', '/fr/', '/it/']);
    },
  );
});

describe('LanguageSwitcher — every locale names itself (§8.5, D15)', () => {
  it.each(locales)(
    '%s: the bulb is named from THAT locale’s file, with THAT endonym',
    (locale) => {
      mount(locale);
      const bulb = bulbOf(locale);
      const name = bulb.getAttribute('aria-label') ?? '';
      expect(name).toBe(bulbName(locale));
      // Endonym FIRST — the atom's own tripwire and SC 2.5.3 both lean on it.
      expect(name.startsWith(nativeNames[locale])).toBe(true);
      // Label in Name, checked where the two strings meet (SC 2.5.3): what the
      // disc PRINTS must be contained in what it is CALLED. What a Dragon or
      // Voice Control user actually says is the leading endonym — "click
      // Deutsch" — since nobody speaks "D E"; the containment is what makes the
      // spoken name and the seen label the same control instead of two.
      expect(name.toLowerCase()).toContain(
        (bulb.textContent ?? '').toLowerCase(),
      );
      // …and never the machine string next-intl renders for a missed key.
      expect(name).not.toMatch(/language\.switch|^common\./);
    },
  );
});

describe('LanguageSwitcher — open/close is the ATOM’s, but truthful here', () => {
  it('flips aria-expanded on the bulb and back on Escape', async () => {
    mount();
    await open();
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('makes the alternates VISIBLE in the same recalc that opens it', async () => {
    // The other half of the closed-state assertion above, and asserted with no
    // clock: the atom transitions `visibility` with a ZERO duration on the way
    // open (the delay lives on the INERT state, so only closing waits for the
    // sweep). If that ever became a symmetric transition, a keyboard user —
    // and this test — would Tab through discs that are still hidden at
    // progress 0.
    const { container } = mount();
    await open();
    expect(alternates(container)[0]).toBeVisible();
  });
});

describe('LanguageSwitcher — the site’s ONE cookie (§8.7, §12)', () => {
  it('writes it EXACTLY once, with exactly the agreed attributes, on a pick', async () => {
    mount();
    await open();
    clicks.length = 0;
    cookieSetter.mockClear();

    await userEvent.click(
      within(listOf()).getByRole('link', { name: nativeNames.de }),
    );

    // The string, character for character: 12 months (§8.7), site-wide, and
    // Lax so it never rides along on another site's request to us.
    expect(cookieSetter).toHaveBeenCalledExactlyOnceWith(
      'NEXT_LOCALE=de; path=/; max-age=31536000; SameSite=Lax; Secure',
    );
    // …and the browser really took it: this is the half tools/generate-root-
    // redirect.ts reads back on the next visit to '/'.
    expect(document.cookie).toContain('NEXT_LOCALE=de');
    // NOT default-prevented: the section writes a cookie and then gets out of
    // the way — the BROWSER follows the disc's href and loads a whole new
    // document (§15.13). Only this suite's guard stops the runner leaving.
    expect(clicks).toEqual([false]);
  });

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
  ] as const)(
    'writes NOTHING on a %s-click — that opens a tab and leaves this page alone',
    async (_name, modifier) => {
      // A modified click is a different act: ctrl/cmd opens a new tab, shift a
      // new window, alt saves the link. This document stays on its language, so
      // stamping the cookie would silently re-language the NEXT ordinary visit.
      mount();
      await open();
      cookieSetter.mockClear();

      fireEvent.click(
        within(listOf()).getByRole('link', { name: nativeNames.de }),
        modifier,
      );

      expect(cookieSetter).not.toHaveBeenCalled();
    },
  );

  it('writes nothing on mount, on re-render, on open, on close or on the bulb', async () => {
    // The §8.7 regression test, and the reason there is no consent banner
    // anywhere on this site (§12): the ONE cookie is written on the ONE
    // explicit click and at no other moment in the component's life.
    const { rerender } = mount('ro');
    rerender(<Mounted locale="de" />);
    await userEvent.click(bulbOf('de')); // open
    await userEvent.click(bulbOf('de')); // close, by tapping the bulb again
    await open('de');
    await userEvent.keyboard('{Escape}'); // close, by keyboard
    expect(cookieSetter).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('NEXT_LOCALE');
  });
});

describe('LanguageSwitcher — what the HOST passes through (§6.8)', () => {
  it('hands `direction` to the atom — the stem unfolds the host’s way (D6)', () => {
    mount('ro', { direction: 'down' });
    expect(Array.from(listOf().classList)).toContain('top-1/2');
    expect(Array.from(listOf().classList)).not.toContain('bottom-1/2');
  });

  it('defaults to `up` — the corner’s direction, decided by FloatingActions', () => {
    mount();
    expect(Array.from(listOf().classList)).toContain('bottom-1/2');
  });

  it('merges `className` onto the LANDMARK and nowhere else', () => {
    // Placement and the two CSS variables arrive from the corner as one string
    // (§6.4: the parent owns spacing, the section owns no margins of its own),
    // and they land on the outermost box this section renders — the <nav>.
    // The variables are CUSTOM PROPERTIES, so the atom inherits them from here.
    const { container } = mount('ro', { className: 'fixed left-4 z-40' });
    expect(Array.from(regionOf().classList)).toEqual(
      expect.arrayContaining(['fixed', 'left-4', 'z-40']),
    );
    expect(container.querySelectorAll('.z-40')).toHaveLength(1);
  });

  it('keeps the landmark a flex box so the dial is not lifted off its anchor', () => {
    // Not decoration: a bare <nav> is a BLOCK box, and the atom's root is
    // inline-flex — an inline-level child sits on a text baseline and adds
    // descender space beneath it. With the corner anchored by `bottom`, that
    // space would push the whole dial up a few pixels. A flex container wraps
    // its child exactly, which is what keeps the visual net at zero diffs.
    mount();
    expect(Array.from(regionOf().classList)).toContain('inline-flex');
  });
});

describe('LanguageSwitcher — the navigation landmark (owner-decided 2026-08-28)', () => {
  // WHY A LANDMARK AT ALL: the dial is the last node of the document (the
  // FloatingActions mount contract), so without a region to jump to, the one
  // control that helps a visitor who cannot read the page is reachable only by
  // walking the whole document. No WCAG criterion demands it and axe cannot see
  // its absence (the `region` rule is off in component testing) — which is why
  // these rows exist: they are the only gate the decision has.

  it('wraps the dial in ONE navigation region, named from the message file', async () => {
    mount();
    const region = screen.getByRole('navigation');
    expect(region.tagName).toBe('NAV');
    expect(region).toHaveAccessibleName(ro.common.language.region);
    expect(region).toContainElement(bulbOf());
    // The alternates live INSIDE the region from the first paint — that is the
    // always-mounted stem (D8 = M) and the reason a crawler finds them. They
    // are NOT in the accessibility tree while closed, though: the atom's
    // `inert` plus `visibility: hidden` take them out of it on purpose, so a
    // screen reader hears one button, not five links. Hence two queries — the
    // DOM one holds closed, the role one only once the stem is open.
    expect(alternates(region)).toHaveLength(locales.length - 1);
    await open();
    expect(within(region).getAllByRole('link')).toHaveLength(
      locales.length - 1,
    );
  });

  it('names the REGION, never the control — two different strings', () => {
    // Reusing the bulb's name would make a screen reader say "Română, schimbă
    // limba, navigation" and then "Română, schimbă limba, button": the same
    // sentence twice, which is noise rather than orientation.
    mount();
    expect(ro.common.language.region).not.toBe(bulbName('ro'));
    expect(regionOf()).not.toHaveAccessibleName(bulbName('ro'));
  });

  it.each(locales)(
    '%s: the region is named in that locale, and never contains the role word',
    (locale) => {
      // Screen readers append "navigation" themselves, so a name carrying the
      // role would be announced twice over ("Navigare limbă, navigation").
      mount(locale);
      const name = MESSAGES[locale].common.language.region;
      expect(regionOf(locale)).toBeInTheDocument();
      expect(name).not.toMatch(/navig|Navig/);
      // Never a key path: next-intl renders the dotted key on a miss.
      expect(name).not.toMatch(/language\.region|^common\./);
    },
  );
});

describe('LanguageSwitcher — the next page, rehearsed (D1, model C)', () => {
  it('re-labels the bulb and re-fans the stem when the locale changes under it', () => {
    // What a visitor actually sees after a pick: the whole document is
    // replaced, so the dial comes back with the new language in the bulb and
    // the old one back among the alternates. A re-render is the closest a unit
    // test gets to that, and it is what the story's demo host stages.
    const { container, rerender } = mount('ro');
    expect(alternates(container).map((link) => link.hreflang)).not.toContain(
      'ro',
    );

    rerender(<Mounted locale="de" />);

    expect(bulbOf('de')).toHaveTextContent('DE');
    expect(bulbOf('de')).toHaveAccessibleName(bulbName('de'));
    const links = alternates(container);
    expect(links.map((link) => link.hreflang)).toEqual(
      locales.filter((locale) => locale !== 'de'),
    );
    expect(
      links.find((link) => link.hreflang === 'ro')?.getAttribute('href'),
    ).toBe('/ro/services/');
  });
});

describe('LanguageSwitcher — the PRE-HYDRATION document (§16.2, §10.4)', () => {
  it('carries all four alternates in the static markup, before any effect runs', () => {
    // WHY renderToStaticMarkup AND NOT render(). Testing Library mounts the
    // tree and flushes effects, so every "it is in the HTML" assertion above is
    // really "it is in the DOM after React woke up". That is not the claim §16
    // makes: the four alternate-language links must be in the file the host
    // SERVES, so a crawler that executes no JavaScript follows /ro/services/ to
    // /de/services/, and so the pre- and post-hydration documents are identical
    // (§16.2). An atom refactor that moved the stem into a useEffect would keep
    // every other test in this file green and quietly break both.
    //
    // This is exactly what `next build` writes into out/ro/services/index.html:
    // one pass, no effects, no useState updates. The '@/i18n/navigation' mock
    // still applies, so the pathname is '/services/' as everywhere else here.
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );

    // PARSED, not string-matched, because the claim is about what a PARSER
    // sees. React serialises the JSX prop's own spelling — the string really
    // says `hrefLang="en"` — and HTML attribute names are ASCII
    // case-insensitive, so a browser and a crawler both read it as `hreflang`
    // (this suite's DOM tests see `link.hreflang` for exactly that reason). A
    // literal /hreflang="/ match would have failed on correct markup; parsing
    // the string asks the question the way Google's fetcher asks it.
    const served = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(
      served.querySelectorAll<HTMLAnchorElement>('a[hreflang]'),
    );
    expect(links).toHaveLength(locales.length - 1);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/en/services/',
      '/de/services/',
      '/fr/services/',
      '/it/services/',
    ]);
    // Closed in the served HTML, and closed after hydration: no flash, no
    // mismatch — the visitor-dependent branch §16.2 forbids does not exist
    // here. The `inert` attribute rides along in the same markup, which is what
    // keeps those four links out of the tab order before any JavaScript runs.
    expect(html).toContain('aria-expanded="false"');
    expect(served.querySelector('ul[inert]')).not.toBeNull();
  });
});
