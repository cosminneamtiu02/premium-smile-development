import type { ReactElement } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/i18n/locales';
import { clinic } from '@/lib/clinic';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { Header } from './Header';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7), and every
// user-facing string comes from the REAL message files or lib/clinic.ts —
// never a literal typed in here (§17.4). A renamed or dropped key then fails
// HERE as well as in the translation-parity gate, instead of silently
// rendering the dotted key path (which is what next-intl does for a miss).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, same convention as GlyphButton.test.tsx
// and FloatingActions.test.tsx. A direct consequence, and the reason so many
// queries below are scoped with within(): `hidden @3xl:flex` hides nothing in
// this runner, so the bar row AND the open panel are both fully queryable and
// a bare getByRole('link', { name: 'Blog' }) would find two (board §5·B7).
//
// ── HARNESS NOTE — why '@/i18n/navigation' is the mock boundary, not
// 'next/navigation' (the layer the build dispatch named).
// Vitest pre-bundles bare deps: next-intl's optimized chunk imports
// next/navigation's optimized chunk by esbuild-internal alias, so replacing
// next/navigation with vi.mock breaks ESM linking before any factory runs
// ("does not provide an export named 'c'"). The sanctioned cure is
// optimizeDeps.exclude in vitest.config.ts — outside this lane's write
// surface. Mocking OUR first-party module instead controls exactly what the
// section consumes, one call frame closer to the components — and since §15.13
// that is ONE export: usePathname, which hands back the LOCALE-STRIPPED
// pathname ('/ro/services/' → '/services/'; since D9 our own stripLocale does
// that unprefixing, over next/navigation, with no next-intl navigation and
// therefore no next/link anywhere in the graph). The hrefs are NOT mocked any
// more: they come from the pure src/i18n/href.ts, which runs for real here, so
// the strings asserted below are the ones a visitor gets.
// The REAL chain (next/navigation → stripLocale) is exercised one tier up, in
// Header.stories.tsx, where the Storybook Next framework feeds the true
// pathname via parameters.nextjs.navigation — so both halves are covered.
const nav = vi.hoisted(() => ({ pathname: '/services' }));

vi.mock('@/i18n/navigation', () => ({ usePathname: () => nav.pathname }));

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

// The provider the section gets in production (app/[locale]/layout.tsx wraps
// the whole tree) and in Storybook (.storybook/preview.tsx decorator), so the
// tests mount it the same way. Header itself is NOT a client component;
// useTranslations/useLocale are isomorphic and read this context.
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <Header />
  </NextIntlClientProvider>
);

// The page the Header freezes. RTL renders into its own <div> under <body>, so
// these two are exactly the body-level SIBLINGS the real shell puts around the
// bar (§4: layout.tsx = Header · {children} · Footer) — which is what the
// inert freeze walks over (board §5·A1).
let page: HTMLElement;
let pageFooter: HTMLElement;

beforeEach(() => {
  nav.pathname = '/services';
  page = document.createElement('main');
  page.innerHTML = '<a href="/ro/team">Echipa noastră</a>';
  pageFooter = document.createElement('footer');
  pageFooter.innerHTML = '<a href="/ro/blog">Articole</a>';
  document.body.append(page, pageFooter);
});

afterEach(() => {
  page.remove();
  pageFooter.remove();
});

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  const messages = MESSAGES[locale].common;
  return {
    ...utils,
    messages,
    burger: () => screen.getByRole('button', { name: messages.menu.label }),
    // The panel is queried by the id aria-controls promises — if the two ever
    // drift, every open-state test fails here rather than passing on a lucky
    // second <nav>.
    panel: () => document.getElementById('header-menu'),
    // The bar row and the panel are two distinct navigation landmarks, named
    // by two distinct keys — that is what makes within() scoping possible.
    barNav: () =>
      screen.getByRole('navigation', { name: messages.nav.ariaLabel }),
    // The bar CTA's BOX, not the control: its visibility lives on a wrapper
    // the section owns, because ui/Button's base already sets `inline-flex`
    // and a second display utility in the atom's class list is decided by
    // sheet order, not by the caller (see Header.tsx).
    barCtaBox: () =>
      screen.getByRole('link', { name: messages.actions.contact })
        .parentElement as HTMLElement,
    sheet: () => document.querySelector('[data-header-sheet]'),
  };
};

/** Tab order as the browser computes it, scoped to one subtree. */
const focusablesIn = (root: ParentNode): HTMLElement[] =>
  Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );

/** SVG elements expose className as SVGAnimatedString — read the attribute. */
const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

describe('Header — the burger toggles the panel (disclosure, not a dialog)', () => {
  it('flips aria-expanded false → true → false and mounts/unmounts the panel', async () => {
    const user = userEvent.setup();
    const { burger, panel } = mount();

    expect(burger()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).toBeNull();

    await user.click(burger());
    expect(burger()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).not.toBeNull();

    await user.click(burger());
    expect(burger()).toHaveAttribute('aria-expanded', 'false');
    // While closed neither panel nor sheet exists in the document at all, so
    // the pre-built HTML contains no menu and nothing can flicker during
    // hydration (§16 — visitor-dependent UI decides only after mount).
    expect(panel()).toBeNull();
  });

  it('claims NO dialog semantics — the panel is a disclosure (board §5·A1, fb-157)', async () => {
    const user = userEvent.setup();
    const { burger, panel } = mount();
    await user.click(burger());

    const open = panel();
    expect(open).not.toBeNull();
    expect(open).not.toHaveAttribute('aria-modal');
    expect(open?.getAttribute('role')).not.toBe('dialog');
    // aria-controls names the element the toggle governs; the id must match.
    expect(burger()).toHaveAttribute('aria-controls', 'header-menu');
  });

  it('keeps ONE state-invariant accessible name on the burger (menu.label)', async () => {
    // Wave-1 a11y verdict, three keys → two: the state comes from
    // aria-expanded, and swapping the label to "Închide" would
    // double-announce it. This test is that rule's regression guard.
    const user = userEvent.setup();
    const { burger, messages } = mount();
    const closedName = burger().getAttribute('aria-label');

    await user.click(burger());
    const openName = screen
      .getByRole('button', { name: messages.menu.label })
      .getAttribute('aria-label');

    expect(closedName).toBe(messages.menu.label);
    expect(openName).toBe(closedName);
    expect(closedName).not.toMatch(/menu\.label|^common\./);
  });
});

describe('Header — the freeze is `inert`, and nothing else (board §5·A1)', () => {
  it('makes page content unreachable while open and restores it on close', async () => {
    const user = userEvent.setup();
    const { burger } = mount();

    expect(page).not.toHaveAttribute('inert');
    expect(pageFooter).not.toHaveAttribute('inert');

    await user.click(burger());
    // inert removes a subtree from focus order, hit-testing AND the
    // accessibility tree — one attribute doing the whole job of a focus trap.
    expect(page).toHaveAttribute('inert');
    expect(pageFooter).toHaveAttribute('inert');

    await user.click(burger());
    // B5: reverted exactly. A leaked `inert` would freeze the live page
    // forever, and it is a DOM effect on the SHELL — the knowingly documented
    // §6 boundary crossing, so its cleanup is a first-class assertion.
    expect(page).not.toHaveAttribute('inert');
    expect(pageFooter).not.toHaveAttribute('inert');
  });

  it('leaves the bar LIVE: the ✕ is focusable and the panel opens with Contact', async () => {
    const user = userEvent.setup();
    const { burger, panel } = mount();
    await user.click(burger());

    // The ✕ must NOT be inert — that is the whole reason the panel refuses to
    // claim aria-modal (fb-157). Tab can reach it because nothing above it in
    // the tree was frozen.
    expect(burger().closest('[inert]')).toBeNull();
    burger().focus();
    expect(document.activeElement).toBe(burger());

    // B3: focus does NOT teleport on open; DOM order makes the next Tab stop
    // the panel's first focusable — the full-width Contact CTA (fb-151).
    const open = panel();
    expect(open).not.toBeNull();
    const first = focusablesIn(open as HTMLElement)[0];
    expect(first).toHaveAttribute('href', `tel:${clinic.phone}`);
    expect(first).toHaveTextContent(ro.common.actions.contact);
  });

  it("never freezes a live region — Next's announcer and any aria-live box stay live", async () => {
    // The freeze must never silence a live region. Next appends its
    // <next-route-announcer> to the <body> of every page and `inert` reaches
    // into shadow DOM, so a walk over body's children freezes it unless told
    // otherwise. Since §15.13 that element no longer narrates OUR navigations
    // — a click loads a new document, which announces its own title — so this
    // guards the general rule rather than the panel-link flow it was written
    // for (G2 review, 2026-08-13): the first region that does matter here (the
    // language-suggestion banner, a future form status) would otherwise
    // inherit the bug with no symptom. A live region is announced, never
    // focused, so leaving it live costs the freeze nothing.
    const user = userEvent.setup();
    const announcer = document.createElement('next-route-announcer');
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    document.body.append(announcer, politeRegion);

    try {
      const { burger } = mount();
      await user.click(burger());

      expect(announcer).not.toHaveAttribute('inert');
      expect(politeRegion).not.toHaveAttribute('inert');
      // …while the page around them is frozen as usual.
      expect(page).toHaveAttribute('inert');
    } finally {
      announcer.remove();
      politeRegion.remove();
    }
  });

  it('scroll-locks the document while open and releases it on close', async () => {
    const user = userEvent.setup();
    const { burger } = mount();
    const before = document.documentElement.style.overflow;

    await user.click(burger());
    expect(document.documentElement.style.overflow).toBe('hidden');

    await user.click(burger());
    expect(document.documentElement.style.overflow).toBe(before);
  });

  it('releases the freeze when the section unmounts mid-open', async () => {
    // Navigating away (or a story remount) while open must not leave the page
    // inert and unscrollable forever — the effect cleanup owns both.
    const user = userEvent.setup();
    const { burger, unmount } = mount();
    await user.click(burger());
    expect(page).toHaveAttribute('inert');

    unmount();
    expect(page).not.toHaveAttribute('inert');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('closes on a bfcache restore — Back must not hand the menu back open', async () => {
    // The back/forward cache: browsers keep the document you LEAVE frozen in
    // memory — DOM, React state, scroll position — and restore it whole when
    // you press Back, without re-running a single line. Since §15.13 a nav tap
    // loads a NEW document, so the frozen one is exactly the one whose panel
    // was open: without this, Back hands the visitor an open menu over a page
    // that is still `inert` and still scroll-locked, with focus nowhere. It is
    // the one case the deleted B1 (close-on-route-change) used to cover by
    // accident, and the case §7's "shell state cannot persist" row got wrong.
    // `persisted: true` is the browser's own flag for "this is a restore":
    // pageshow also fires on every ordinary load, with it false.
    const user = userEvent.setup();
    const { burger, panel } = mount();
    const overflowBefore = document.documentElement.style.overflow;
    await user.click(burger());
    expect(panel()).not.toBeNull();
    expect(page).toHaveAttribute('inert');

    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', { persisted: true }),
      );
    });

    expect(panel()).toBeNull();
    expect(burger()).toHaveAttribute('aria-expanded', 'false');
    // Everything the open state had taken from the page is handed back…
    expect(page).not.toHaveAttribute('inert');
    expect(document.documentElement.style.overflow).toBe(overflowBefore);
    // …and focus lands on the burger, which is why NavMenu calls close() and
    // not setOpen(false): only close() arms the focus return.
    expect(document.activeElement).toBe(burger());
  });

  it('closes on pagehide — the frozen snapshot must never contain an open menu', async () => {
    // The other half of D1, and the one that removes the flicker: `pageshow`
    // above REPAIRS a restored document (the browser paints the frozen page
    // first, so one frame can still show the panel), while `pagehide` prevents
    // it — it is the one event that fires on EVERY departure and ONLY on
    // departures, so a close committed inside its handler is what the frozen
    // snapshot contains.
    // EVERY assertion therefore sits INSIDE act(), reading the DOM immediately
    // after dispatch and before act flushes anything of its own — because a
    // "clean snapshot" is not merely the panel and the sheet gone: it is also
    // the page un-frozen (no `inert`), the scroll unlocked, and focus already
    // placed on the burger. Those last three are undone by passive-effect
    // CLEANUPS, and asserting them HERE is exactly what pins the guarantee the
    // pre-close depends on — that React runs those cleanups synchronously for a
    // flushSync commit, and not on a later turn a frozen page may never get.
    // Asserting them after act() would pass whether or not that holds, so it
    // would distinguish nothing.
    // The control that makes these real detectors: a plain scheduled setState
    // would still be PENDING at this point and the panel would still be in the
    // document; finding all of it already reverted is the proof that NavMenu
    // wrapped the close in flushSync — i.e. that the commit is synchronous with
    // the event, which is the entire point on a page about to be frozen.
    // `persisted: true` is passed only because a real pagehide carries the flag;
    // the handler deliberately ignores it (leaving is enough), so this test
    // would pass with either value.
    const user = userEvent.setup();
    const { burger, panel, sheet } = mount();
    const overflowBefore = document.documentElement.style.overflow;
    await user.click(burger());
    expect(panel()).not.toBeNull();
    expect(page).toHaveAttribute('inert');

    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent('pagehide', { persisted: true }),
      );
      // The menu itself is gone from the markup the snapshot would capture…
      expect(panel()).toBeNull();
      expect(sheet()).toBeNull();
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
      // …everything the open state had taken from the page is handed back…
      expect(page).not.toHaveAttribute('inert');
      expect(document.documentElement.style.overflow).toBe(overflowBefore);
      // …and focus lands on the burger: the pre-close goes through close(), so
      // a browser that declines to cache the page (or a Back that re-runs it)
      // finds focus exactly where every other close path leaves it.
      expect(document.activeElement).toBe(burger());
    });
  });
});

describe('Header — every close path returns focus to the burger', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { burger, panel } = mount();
    await user.click(burger());

    await user.keyboard('{Escape}');
    expect(panel()).toBeNull();
    expect(burger()).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(burger());
  });

  it('closes on a tap anywhere on the dimming sheet (fb-154)', async () => {
    const user = userEvent.setup();
    const { burger, panel, sheet } = mount();
    await user.click(burger());

    const scrim = sheet();
    expect(scrim).not.toBeNull();
    // Portaled to <body> (board §4b): inside the bar, `fixed` would resolve
    // against the container-typed header and paint a 64px stripe.
    expect(scrim?.parentElement).toBe(document.body);
    expect(scrim).toHaveAttribute('aria-hidden', 'true');

    await user.click(scrim as Element);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(burger());
  });

  it('falls back to the first bar LINK when closing HIDES the ✕ (board §4c, row 4 → 3)', async () => {
    // The transition nobody can trigger deliberately: the menu was opened
    // below the breakpoint, the container then grew past it (a rotated tablet,
    // a resized window), and closing re-applies `@3xl:hidden` to the burger.
    // Focusing a button that the same commit turns into display:none drops
    // focus on <body>, i.e. silently teleports a keyboard user to the top of
    // the document.
    // Stylesheets are not loaded in this project, so the hidden state is
    // applied directly here — the branch under test is "the burger is
    // display:none by the time the focus return runs", whatever CSS put it
    // there.
    // WHICH link, since the fb-200 swap: NavMenu's fallback is
    // `header a[href]`, the first LINKED thing in the bar. That used to be the
    // brand anchor; sections/Wordmark took its place and is a placeholder
    // <a> with no href (D9), so the first focusable in the bar is now the nav
    // row's Home link — which is where the fallback lands, and the next Tab
    // still continues into the row that just became visible.
    const user = userEvent.setup();
    const { burger, panel, barNav, messages } = mount();
    await user.click(burger());
    burger().style.display = 'none';

    await user.keyboard('{Escape}');

    expect(panel()).toBeNull();
    const firstBarLink = within(barNav()).getByRole('link', {
      name: messages.nav.home,
    });
    expect(document.activeElement).toBe(firstBarLink);
    expect(document.activeElement).not.toBe(document.body);
  });
});

describe('Header — the panel hangs off the bar and survives a short screen', () => {
  it('is ANCHORED (absolute, top-full) rather than pinned to the viewport', async () => {
    const user = userEvent.setup();
    const { burger, panel } = mount();
    await user.click(burger());

    const classes = classesOf(panel() as Element);
    expect(classes).toEqual(
      expect.arrayContaining([
        'absolute',
        'inset-x-0',
        'top-full',
        'rounded-lg',
      ]),
    );
    // `fixed` would need viewport arithmetic and a magic bar height; the
    // anchored panel follows the bar wherever it goes.
    expect(classes).not.toContain('fixed');
  });

  it('caps its height at the dynamic viewport and scrolls internally (B2)', async () => {
    // ~356px of content vs a 320px-tall landscape phone: the PANEL scrolls,
    // the page behind it stays frozen. dvh, not vh — mobile URL bars change
    // the viewport height as you scroll. Asserted here because the visual
    // harness samples widths only.
    const user = userEvent.setup();
    const { burger, panel } = mount();
    await user.click(burger());

    expect(classesOf(panel() as Element)).toEqual(
      expect.arrayContaining([
        'max-h-[calc(100dvh-5.5rem)]',
        'overflow-y-auto',
      ]),
    );
  });
});

describe('Header — the ☰ → ✕ morph belongs to this section (D12)', () => {
  it('drives its transforms off the button aria-expanded, with a motion guard', async () => {
    const { burger } = mount();
    const svg = burger().querySelector('svg');

    expect(svg).toBeInstanceOf(SVGSVGElement);
    // The glyph never announces itself: the button's aria-label already names
    // the control, and a labelled child would double-announce.
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    const bars = Array.from(svg?.children ?? []);
    expect(bars).toHaveLength(3);

    // The morph is whole in ./BurgerToggle (§3c, owner 2026-08-16): artwork
    // and behavior in one section-owned control, so there is no data module
    // to import — these literals ARE the drawn spec (bars at y = 6 / 12 / 18
    // on the shared 24-unit grid). If the geometry ever changes, this test
    // changes with it, deliberately.
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(bars.map((bar) => bar.getAttribute('d'))).toEqual([
      'M4 6h16',
      'M4 12h16',
      'M4 18h16',
    ]);

    // GlyphButton contributes ONLY the `group` marker class on its root; the
    // state lives on that root as aria-expanded, and these utilities read it.
    // No `group` may appear on any wrapper in between — an unnamed outer group
    // would capture the utilities and freeze the morph (Wave-1 constraint 3).
    expect(classesOf(burger())).toContain('group');
    const wrappers = burger().querySelectorAll('.group');
    expect(wrappers).toHaveLength(0);

    // The same trap from ABOVE: the bar root carries a group for the
    // single-menu rule, and it must be the NAMED `group/bar`. A bare `group`
    // on any ancestor would satisfy `:is(:where(.group)[aria-expanded] *)`
    // against an element that has no aria-expanded, freezing the morph.
    for (
      let ancestor = burger().parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      expect(classesOf(ancestor)).not.toContain('group');
    }

    const [top, middle, bottom] = bars.map(classesOf);
    expect(top).toEqual(
      expect.arrayContaining([
        'group-aria-expanded:translate-y-[6px]',
        'group-aria-expanded:rotate-45',
      ]),
    );
    expect(middle).toContain('group-aria-expanded:opacity-0');
    expect(bottom).toEqual(
      expect.arrayContaining([
        'group-aria-expanded:-translate-y-[6px]',
        'group-aria-expanded:-rotate-45',
      ]),
    );

    // §9: the morph is decoration over a state that aria-expanded already
    // states — under prefers-reduced-motion it becomes an instant swap.
    for (const bar of bars) {
      expect(classesOf(bar)).toContain('motion-reduce:transition-none');
      expect(classesOf(bar).join(' ')).toMatch(/duration-300/);
      // Each bar rotates about ITS OWN centre. Without this, an SVG child's
      // transform-box defaults to `view-box` and origin-center resolves to the
      // centre of the 24×24 viewBox for all three alike — the ✕ comes out
      // lopsided and right-shifted (G2 review, 2026-08-13).
      expect(classesOf(bar)).toContain('[transform-box:fill-box]');
      expect(classesOf(bar)).toContain('origin-center');
    }
  });
});

describe('Header — the nav row, the panel list, and the current page', () => {
  it('marks the mocked-active route with aria-current="page", and only it', async () => {
    const { container, barNav, messages } = mount();
    const current = container.querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(messages.nav.services);
    expect(
      within(barNav()).getByRole('link', { name: messages.nav.services }),
    ).toHaveAttribute('aria-current', 'page');
    // Sibling routes stay unmarked — the home link especially, since '/' is a
    // prefix of every path and a naive startsWith would light it up always.
    expect(
      within(barNav()).getByRole('link', { name: messages.nav.home }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks a nested route as its section (e.g. /blog/<slug> → Blog)', () => {
    nav.pathname = '/blog/coroane-ceramice';
    const { container, messages } = mount();

    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(messages.nav.blog);
  });

  it('does NOT mark a route whose path merely starts with another one', () => {
    // The boundary the section rule turns on: a sibling route may share a
    // prefix with a nav item ('/servicii-urgente' next to '/services'), and
    // only a SEGMENT boundary makes it that item's page. A bare
    // pathname.startsWith(href) would light Servicii up here — and pass every
    // other test in this file, which is why this fixture exists.
    nav.pathname = '/services-urgente';
    const { container } = mount();

    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it('marks Home only on the exact root', () => {
    nav.pathname = '/';
    const { container, messages } = mount();

    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(messages.nav.home);
  });

  it('renders every nav entry as a plain anchor carrying the FINAL href', async () => {
    // §15.13: nothing finishes these strings on the way out any more — what
    // useNavItems hands NavItem is exactly what lands in the DOM, so the locale
    // prefix and the trailing slash (`trailingSlash: true`, next.config.ts) are
    // asserted here or nowhere. The base path is empty in this runner
    // (vitest.config.ts inlines the unset PAGES_BASE_PATH as ''), which is the
    // root-serving host's shape; the prefixed one is tests/unit/href.test.ts.
    // Both locales in ONE test because the locale is half of the string under
    // test — and each pass unmounts first, since RTL leaves every render in the
    // document and a second bar would double every query below.
    const user = userEvent.setup();

    for (const locale of ['ro', 'de'] as const) {
      const { burger, panel, barNav, messages, unmount } = mount(locale);
      const expected: Array<[string, string]> = [
        [messages.nav.home, `/${locale}/`],
        [messages.nav.services, `/${locale}/services/`],
        [messages.nav.team, `/${locale}/team/`],
      ];
      // Romanian alone carries the blog (§5): /de/blog is never generated, so
      // no href for it may exist either.
      if (locale === 'ro') expected.push([messages.nav.blog, '/ro/blog/']);

      await user.click(burger());
      for (const [label, href] of expected) {
        // Both call sites: the bar row and the panel render the same hook's
        // rows, and both are what a visitor actually taps (board §5·B7 — no
        // stylesheet here, so both are queryable and must be scoped).
        for (const scope of [barNav(), panel() as HTMLElement]) {
          const link = within(scope).getByRole('link', { name: label });
          // A plain <a>, not something that renders one: no click handler, no
          // prefetch observer — the browser does the navigating (§15.13).
          expect(link.tagName).toBe('A');
          expect(link).toHaveAttribute('href', href);
        }
      }

      if (locale === 'de') {
        expect(
          within(panel() as HTMLElement).queryByRole('link', {
            name: messages.nav.blog,
          }),
        ).toBeNull();
      }
      unmount();
    }
  });

  it('renders Blog for `ro` in BOTH the bar row and the panel', async () => {
    const user = userEvent.setup();
    const { burger, panel, barNav, messages } = mount('ro');

    expect(
      within(barNav()).getByRole('link', { name: messages.nav.blog }),
    ).toBeInTheDocument();

    await user.click(burger());
    expect(
      within(panel() as HTMLElement).getByRole('link', {
        name: messages.nav.blog,
      }),
    ).toBeInTheDocument();
  });

  it('drops Blog off Romanian — the blog is `ro`-only (§5)', async () => {
    const user = userEvent.setup();
    const { burger, panel, barNav, messages } = mount('en');

    expect(
      within(barNav()).queryByRole('link', { name: messages.nav.blog }),
    ).toBeNull();
    // The other three still ship, in English.
    expect(
      within(barNav()).getByRole('link', { name: messages.nav.services }),
    ).toBeInTheDocument();

    await user.click(burger());
    expect(
      within(panel() as HTMLElement).queryByRole('link', {
        name: messages.nav.blog,
      }),
    ).toBeNull();
  });
});

describe('Header — the brand and the two Contact links', () => {
  it('hands its brand corner to sections/Wordmark, in a self-stretch box', () => {
    // The fb-200 swap: the corner used to be a locale-prefixed <Link> named
    // from `brand.ariaLabel`; it is now the shared lockup — artwork, hairline
    // bar, the name at Heading's title step — and this file owns only the BOX
    // around it (§6.4/§6.8). `self-stretch` is load-bearing: the row is
    // `items-center`, and the lockup's bar and artwork are sized as
    // percentages of the row height, which a centred child does not have.
    const { container } = mount();
    const row = container.querySelector('header > div') as HTMLElement;
    const box = row.firstElementChild as HTMLElement;
    const lockup = box.firstElementChild as HTMLElement;

    expect(classesOf(box)).toEqual(expect.arrayContaining(['self-stretch']));
    expect(lockup.tagName).toBe('A');
    expect(lockup).toHaveTextContent(clinic.name);
    // The brand is NOT a heading (C2): one <h1> per page belongs to the page.
    expect(lockup.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('no longer NAVIGATES from the brand — D9 placeholder, key held in reserve', () => {
    // fb-200 taken literally: "make it clickable, but don't implement
    // go-to-a-page yet". The corner is an <a> WITHOUT href, so it has no link
    // role, no tab stop and no accessible name (a label on an unfocusable
    // generic is prohibited ARIA). `common.brand.ariaLabel` stays in all five
    // message files, uncalled, for the wiring diff Wordmark.tsx declares — an
    // unused key is legal, the parity gate compares key SETS.
    const { container, messages } = mount();
    const lockup = container.querySelector('header a') as HTMLElement;
    const named = messages.brand.ariaLabel.replace('{name}', clinic.name);

    expect(lockup).not.toHaveAttribute('href');
    expect(lockup).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('link', { name: named })).toBeNull();
    // …and no OTHER link in the bar points at home either: the single home
    // destination is gone until the wiring lands, rather than moved.
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAccessibleName(named);
    }
    expect(messages.brand.ariaLabel).not.toMatch(/brand\.ariaLabel/);
  });

  it('dials the single-source number from the bar AND from the panel (B7)', async () => {
    const user = userEvent.setup();
    const { burger, panel, messages } = mount();

    const barCta = screen.getByRole('link', { name: messages.actions.contact });
    expect(barCta).toHaveAttribute('href', `tel:${clinic.phone}`);

    await user.click(burger());
    // Two Contact links now exist in the DOM; the scoped query is what keeps
    // this test from passing on the wrong one.
    const panelCta = within(panel() as HTMLElement).getByRole('link', {
      name: messages.actions.contact,
    });
    expect(panelCta).not.toBe(barCta);
    expect(panelCta).toHaveAttribute('href', `tel:${clinic.phone}`);
    // fb-151 + D8: full width, first in the panel, first thing a thumb reaches.
    expect(classesOf(panelCta)).toContain('w-full');
  });

  it('never puts a display utility in the CTA atom own class list', () => {
    // The regression this file exists for, measured on 2026-08-13: ui/Button's
    // base sets `inline-flex`, so a caller's `hidden` lands in the same class
    // list at the same specificity (0,1,0) and loses to whichever the sheet
    // emits last — which is `.inline-flex`. The bar's Contact was therefore
    // VISIBLE at 390, beside the burger, against the board's phone sketch.
    // The cure is structural: the section owns a wrapper box, the atom keeps
    // its own display. This test fails the moment someone moves the
    // breakpoint classes back onto the Button.
    const { barCtaBox, messages } = mount();
    const barCta = screen.getByRole('link', { name: messages.actions.contact });

    for (const token of ['hidden', '@3xl:flex', '@3xl:inline-flex']) {
      expect(classesOf(barCta)).not.toContain(token);
    }
    expect(classesOf(barCta)).toContain('inline-flex'); // the atom's own
    expect(classesOf(barCtaBox())).toContain('hidden');
  });

  it('renders the bar CTA and the row only above the container step', () => {
    // The ENTIRE breakpoint: both variants exist in the HTML at every width
    // and CSS decides which is drawn — @3xl is Tailwind's own 48rem step
    // (C1), measured against the BAR, never the viewport (§6.5).
    const { barNav, barCtaBox, burger } = mount();

    // The CTA's box, not the atom — see the wrapper rationale in Header.tsx.
    expect(classesOf(barCtaBox())).toEqual(
      expect.arrayContaining(['hidden', '@3xl:flex']),
    );
    expect(classesOf(barNav())).toEqual(
      expect.arrayContaining(['hidden', '@3xl:flex']),
    );
    expect(classesOf(burger())).toContain('@3xl:hidden');
    // Container steps only: a viewport media query here would measure the
    // window instead of the bar (§6.5). Token-wise, not a substring match —
    // `@3xl:` legitimately contains "xl:".
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;
    for (const el of [barCtaBox(), barNav(), burger()]) {
      expect(classesOf(el).filter((c) => viewportVariant.test(c))).toEqual([]);
    }
  });

  it('shows ONE menu at a time: the open panel hides the bar row and bar Contact', async () => {
    // Owner amendment fb-164/165/166. Below the step nothing else was ever
    // visible; above it the row and the bar's Contact used to sit behind the
    // open panel, which reads as two menus at once. Pure CSS: the panel exists
    // in the bar's subtree exactly while it is open, so `:has()` on the bar's
    // NAMED group is the whole mechanism — no state crosses a component
    // boundary and Header.tsx stays a Server Component.
    // Class tokens are the contract here (no stylesheet in this project), and
    // asserting all three in ONE test is deliberate: renaming the group breaks
    // the pair silently in production, and loudly right here.
    const { container, barNav, barCtaBox, messages } = mount();
    const header = container.querySelector('header');
    const HIDE_WHILE_OPEN = 'group-has-[#header-menu]/bar:hidden';
    expect(messages.actions.contact).toBeTruthy();

    expect(classesOf(header as Element)).toContain('group/bar');
    expect(classesOf(barNav())).toContain(HIDE_WHILE_OPEN);
    expect(classesOf(barCtaBox())).toContain(HIDE_WHILE_OPEN);

    // The group MUST stay named: a bare `group` on the bar root would be
    // matched by the morph's `group-aria-expanded:*` utilities and freeze the
    // ☰ → ✕ animation (Wave-1 constraint 3).
    expect(classesOf(header as Element)).not.toContain('group');
  });

  it('leaves the CLOSED bar composition untouched by the single-menu rule', async () => {
    // The amendment changes the open state only. Closed, at any width, the
    // breakpoint classes are exactly what shipped: the row and the CTA appear
    // above the step, the burger below it.
    const user = userEvent.setup();
    const { barNav, barCtaBox, burger } = mount();

    expect(classesOf(barNav())).toEqual(
      expect.arrayContaining(['hidden', '@3xl:flex']),
    );
    expect(classesOf(barCtaBox())).toEqual(
      expect.arrayContaining(['ml-auto', 'hidden', '@3xl:flex']),
    );
    expect(classesOf(burger())).toEqual(
      expect.arrayContaining(['ml-auto', '@3xl:ml-0', '@3xl:hidden']),
    );

    // …and OPEN, the burger drops @3xl:ml-0: the CTA whose own ml-auto used to
    // absorb the free space above the step is now hidden, so this margin is
    // the only thing still pushing the ✕ to the right edge.
    await user.click(burger());
    expect(classesOf(burger())).toContain('ml-auto');
    expect(classesOf(burger())).not.toContain('@3xl:ml-0');
  });

  it('keeps the ✕ visible at ANY width while the menu is open (fb-145/149)', async () => {
    // Row 4 of the board's state table: a menu opened before rotating must
    // stay closable. The hide-rule is dropped while open — the alternative
    // (JS watching the window) re-introduces the width-measuring script D1
    // deleted, and would undo the patient's own action on rotation.
    const user = userEvent.setup();
    const { burger } = mount();
    await user.click(burger());

    expect(classesOf(burger())).not.toContain('@3xl:hidden');
  });
});
