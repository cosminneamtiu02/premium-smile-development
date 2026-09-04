import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { page } from 'vitest/browser';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { FloatingActions } from '@/components/sections/FloatingActions/FloatingActions';
import { Footer } from '@/components/sections/Footer/Footer';
import { Header } from '@/components/sections/Header/Header';
import { nativeNames } from '@/i18n/locales';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses —
// the precedent is Modal/SpeedDial/LanguageSwitcher/ContactModal.test.tsx. It is
// not decoration here: three of this file's four contracts are questions about
// COMPUTED style rather than about class names.
//   · "the spacer is the last box in NORMAL FLOW" is only meaningful once the
//     two corner controls are actually `position: fixed` and the closed
//     <dialog> is actually `display: none` — without the sheet every body child
//     is a static box and the assertion degrades into DOM order;
//   · the skip-link's whole design (Q1's in-flow reveal) IS a pair of computed
//     states: clipped 1px box at rest, real box while focused;
//   · the shell's own two lines — `scroll-padding-top` and the three-step
//     `scroll-padding-bottom` — live nowhere else and are covered by no other
//     suite. They are what makes this file RED before the mount lands.
// It brings the boxes but NOT the typeface (next/font does not run in this
// runner), which costs nothing here: not one assertion below measures text.
import '@/styles/globals.css';
import ro from '@/messages/ro.json';
// The shell's own source as TEXT, through Vite's `?raw` (typed by the repo's
// own src/types/raw-import.d.ts, never a program-wide vite/client reference —
// the Wordmark/SectionHeading source-guard precedent). TEXT is the whole point:
// layout.tsx is an async Server Component that awaits `params` and calls
// next-intl/server, so it can never be IMPORTED here — but it can be read, and
// that is enough to mechanize the one duplicated string this lane ships (G2 F6).
import layoutSource from './layout.tsx?raw';

// app/[locale] — THE SHELL ASSEMBLY SUITE: the executable spec of the Phase-4
// mount, written to the owner-approved boards `.claude/plans/app-shell-mount.
// plan.md` §5 and `.claude/plans/app-shell-layers.plan.md` (E10–E12, P1, P7).
//
// ── WHAT IT MOUNTS, AND WHY NOT `layout.tsx` ITSELF. The layout is an async
// Server Component: it awaits `params`, calls `setRequestLocale` and
// `getTranslations` (next-intl/server), and returns <html>/<body> — none of
// which a browser test runner can render, and all of which is Next's contract
// rather than this lane's. What the lane actually owes is the ASSEMBLY: which
// boxes are siblings of <body>, in which order, inside which DOM-less
// providers. So this file composes exactly the shape board §4 draws, and the
// mount is written to match it. Two consequences worth stating plainly rather
// than discovering later: the skip-link's class string is duplicated in
// SKIP_LINK below (layout.tsx must carry the identical one — §6.6 makes that a
// deliberate two-file edit, exactly like every other KEEP-IN-SYNC pair in this
// repo), and the assembly assertions are green the moment this file exists,
// while the shell-tier CSS assertions at the bottom are the ones that go
// red → green with the mount.
//
// ── `container: document.body` IS THE POINT (E11, P1). Header.test.tsx already
// mounts a stand-in <main> and <footer> as genuine body-level siblings; this
// file takes that to the FULL roster, because RTL's default wrapper <div> would
// nest every piece one level down and silently falsify the freeze — NavMenu
// applies `inert` to <body>'s OTHER children, so one wrapper makes it freeze
// nothing while still "working". That is the exact bug class NavMenu's dev
// tripwire exists for, and group 2 below asserts the tripwire stays SILENT.
//
// Role-based queries throughout (§9, §13) and every user-facing string comes
// from the REAL message file (§17.4): a renamed key fails HERE as well as in
// the parity gate, instead of silently rendering the dotted key path.
//
// ── HARNESS NOTE — '@/i18n/navigation' is the mock boundary, not
// 'next/navigation' (Header.test.tsx carries the long form: Vitest pre-bundles
// bare deps, so replacing next/navigation breaks ESM linking before any factory
// runs). Since §15.13 that module has ONE export, usePathname, handing back the
// locale-stripped pathname; HeaderNav and useLanguageOptions are its consumers.
vi.mock('@/i18n/navigation', () => ({ usePathname: () => '/services/' }));

/**
 * The skip-link's clothes, board §4 (Q1 — the IN-FLOW reveal). `sr-only`
 * clips it to a 1px absolutely-positioned box at rest; `focus:not-sr-only
 * focus:block` puts it back into NORMAL FLOW at the top of the document while
 * focused, pushing the page down — the sticky pill simply rides lower for that
 * moment, which IS the visible feedback. Zero additions to the z-map (§2 of the
 * layers board: 40/45/50 + top layer, closed), zero overlap cases.
 *
 * The padding is deliberately plain `focus:px-4` and NOT the gutter pair
 * ui/Container now owns (§15.15 a DECIDED, board fb-343): the skip link is
 * SHELL chrome, not a band — bands own gutters, the shell stays full-bleed.
 *
 * KEEP-IN-SYNC with app/[locale]/layout.tsx's skip-link (§6.6 — the same
 * string, changed in one edit or not at all). Since G2 F6 that pair is no
 * longer a promise in prose: the source guard at the bottom of this file reads
 * layout.tsx as text and fails if the two ever drift.
 */
const SKIP_LINK =
  'sr-only focus:not-sr-only focus:block focus:border-b ' +
  'focus:border-line-subtle focus:bg-surface focus:px-4 focus:py-3';

/**
 * <body>'s own classes, and the reason this file can pin a rule that lives on
 * an element the assembly does not render. The shell writes these on <body>
 * itself — never on a wrapper, because NavMenu's freeze walks <body>'s children
 * (P1/E11) — so `mount()` stamps the same string onto the real <body> and the
 * computed-style assertions below measure the actual cascade.
 *
 * `flex min-h-dvh flex-col` + `flex-1` on <main> is the sticky footer the owner
 * asked for on 2026-09-04 ("on every screen the footer must always stay at the
 * bottom of the page"). Both halves are KEEP-IN-SYNC with layout.tsx and both
 * are mechanized by the source guard, exactly like SKIP_LINK.
 */
const BODY_LAYOUT = 'flex min-h-dvh flex-col bg-page font-body text-ink';
/** The growing half of that pair, on <main>. */
const MAIN_GROW = 'flex-1';

/**
 * The shell, exactly as board §4 composes it. Both providers render NO DOM
 * element — a React context provider is invisible to the DOM and
 * NextIntlClientProvider adds no box either — which is precisely why wrapping
 * the whole document in them does not violate the body-level-siblings contract
 * the freeze depends on (E10).
 *
 * ORDER IS LOAD-BEARING: Footer BEFORE FloatingActions, and the <dialog> lands
 * last automatically because the provider renders {children} and then
 * <ContactModal /> (E10 again). Since the clearance spacer was removed (owner,
 * 2026-09-04) FloatingActions contributes no flow box at all, so that order now
 * buys DOM and tab order rather than geometry — and the FOOTER is what ends the
 * document's normal flow.
 */
const Shell = (): ReactElement => (
  <NextIntlClientProvider locale="ro" messages={ro}>
    <ContactModalProvider>
      <a href="#main" className={SKIP_LINK}>
        {ro.common.skipToContent}
      </a>
      <Header />
      <main id="main" className={MAIN_GROW}>
        {/* Stand-in page content: one paragraph and one focusable, so "the
            skip-link is the document's FIRST focusable" is a claim with
            something to be first of. Romanian with diacritics (§15.7). */}
        <p>Îngrijire stomatologică pentru toată familia.</p>
        <a href="/ro/team/">Echipa noastră</a>
      </main>
      <Footer />
      <FloatingActions />
    </ContactModalProvider>
  </NextIntlClientProvider>
);

/**
 * The whole shell as GENUINE children of <body> — see the file header.
 *
 * Why <body> survives the suite, stated precisely (G2 F5): RTL's `cleanup`
 * unmounts every tracked container and then removes the ones whose PARENT is
 * <body>. Passing <body> itself sidesteps that removal for a structural reason
 * rather than a lucky one — its parent is <html>, not <body> — while React's own
 * unmount still takes the shell's children back out, so each case starts from a
 * clean document.
 */
const mount = () => {
  // The shell's own <body> classes, stamped on the real one — see BODY_LAYOUT.
  // Reset in afterAll so nothing leaks past this file.
  document.body.className = BODY_LAYOUT;
  return render(<Shell />, { container: document.body });
};

/**
 * The SHELL's own boxes at body level, in document order — with the framework's
 * own injected children filtered out, because <body> is not this file's to own
 * exclusively and the contract was never "nothing else may exist there".
 *
 * MEASURED ON THE BUILT EXPORT (`npm run build`, out/ro/index.html): React
 * streams a `<div hidden><!--$--><!--/$--></div>` Suspense placeholder as
 * <body>'s FIRST child, ahead of the skip-link, and Next's bootstrap
 * <script> tags close the document after the dialog; at runtime Next also
 * appends <next-route-announcer>. None of them changes a single claim below —
 * `hidden` is `display: none`, a <script> renders no box, and all three are
 * unfocusable — which is exactly why the filter is by "renders no box" rather
 * than by a list of tag names: a future framework insert is covered too.
 * (The freeze walks past them harmlessly; NavMenu's own `isLiveRegion` carve-out
 * is what keeps the announcer live.)
 */
const shellChildren = (): Element[] =>
  Array.from(document.body.children).filter(
    (element) =>
      !element.hasAttribute('hidden') &&
      element.localName !== 'script' &&
      element.localName !== 'template',
  );

/** The one <main> the shell mounts — the skip-link's target (E12). */
const main = () => document.getElementById('main') as HTMLElement;
const footer = () => document.querySelector('footer') as HTMLElement;
/** The provider's single <dialog>, closed and display:none until a trigger. */
const dialog = () => document.querySelector('dialog') as HTMLDialogElement;

/** The language dial's <nav> landmark (sections/LanguageSwitcher). */
const dialNav = () =>
  screen.getByRole('navigation', { name: ro.common.language.region });
/**
 * The dial's stem list, read by SELECTOR and not by role ON PURPOSE: while the
 * dial is closed the <ul> carries `inert` (and `inert:invisible` with the real
 * sheet loaded), so it is out of the accessibility tree — which is exactly the
 * state the P7 assertions are about. A role query would find nothing and the
 * test would pass for the wrong reason.
 */
const stem = () => dialNav().querySelector('ul') as HTMLElement;
/** The call CTA — an <a href="tel:"> at body level (GlyphButton asChild). */
const callDisc = () =>
  screen.getByRole('link', { name: ro.common.actions.call });
const burger = () => screen.getByRole('button', { name: ro.common.menu.label });
const skipLink = () =>
  screen.getByRole('link', { name: ro.common.skipToContent });
const bulb = () =>
  within(dialNav()).getByRole('button', {
    name: ro.common.language.switch.replace('{name}', nativeNames.ro),
  });

/**
 * Focusables in DOM order, filtered to the ones a browser would actually stop
 * on: `checkVisibility()` drops anything display:none (the bar row and the bar
 * CTA below the @3xl container step, the closed dialog), and the `[inert]`
 * ancestor walk drops the closed stem's discs. Same selector as
 * Header.test.tsx's helper, widened to the whole document.
 */
const focusablesInDocument = (): HTMLElement[] =>
  Array.from(
    document.body.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.checkVisibility() && el.closest('[inert]') === null);

/**
 * The one dev tripwire this suite must prove SILENT: NavMenu's mount-contract
 * warning, which fires when an open menu froze no page content — i.e. exactly
 * when someone has wrapped the shell's pieces in a layout <div>. Matched on the
 * distinctive phrase rather than the whole string so a reworded warning still
 * counts, and so React's own "creating roots directly with document.body is
 * discouraged" notice (unavoidable when body IS the container, and harmless —
 * nothing else writes to this body) is not mistaken for it.
 */
const TRIPWIRE = 'froze no page content';

/**
 * Declared through the factory rather than typed out, the `spyOnCookie`
 * precedent in LanguageSwitcher.test.tsx: `ReturnType<typeof vi.spyOn>` alone
 * picks the wrong overload and hands back an `any[]`-argument mock, so
 * `mock.calls` loses its element type. `vi.spyOn` CALLS THROUGH by default,
 * which is what keeps React's own warnings visible in the runner output while
 * this suite reads them.
 */
const spyOnConsoleError = () => vi.spyOn(console, 'error');
let consoleError: ReturnType<typeof spyOnConsoleError>;

/** Every recorded console.error that is the mount-contract tripwire, and nothing else. */
const tripwireCalls = () =>
  consoleError.mock.calls.filter((call) =>
    call.some(
      (argument) => typeof argument === 'string' && argument.includes(TRIPWIRE),
    ),
  );

let stillnessStyle: HTMLStyleElement | null = null;

beforeAll(async () => {
  // The PR #45 rule: with the real sheet loaded, @starting-style fades and the
  // stem's 300ms clip-path sweep run for real, and any assertion taken inside
  // that window is CI-flaky. An UNLAYERED rule beats every @layer'd Tailwind
  // declaration whatever its specificity, so one line stills the whole tree and
  // every assertion below can be made immediately, with no frame waits.
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent =
    '*, *::before, *::after { transition: none !important; animation: none !important; }' +
    // …and the THIRD kind of motion in this document, which the PR #45 rule
    // predates: globals ships `scroll-behavior: smooth` on <html> (wrapped in
    // prefers-reduced-motion: no-preference), so every scroll — a scrollTo, and
    // any scroll the browser performs on focus() — is ANIMATED. That breaks the
    // close-jump test in both directions: the setup scroll had not landed when
    // scrollY was read, and, far worse, a focus-induced jump would still be
    // mid-animation at assertion time and the test would pass while the bug
    // shipped. Forcing `auto` makes every scroll land synchronously, which is
    // what lets the assertion be exact equality.
    'html { scroll-behavior: auto !important; }';
  document.head.append(stillnessStyle);

  // Pin the phone width (§7's Smartphone step) for the whole file: the bar is a
  // @container, so the burger↔row flip is decided by the BAR's width, and a
  // runner-default viewport wide enough to cross the @3xl step would take the
  // burger to display:none and make every menu assertion unqueryable. The
  // scroll-padding suite at the bottom moves the viewport deliberately and puts
  // it back here.
  await page.viewport(390, 844);

  // Armed for the whole file, and NEVER CLEARED BETWEEN TESTS — the record is
  // cumulative on purpose (G2 F1, both reviewers). NavMenu's tripwire is guarded
  // by a module-scope once-per-session boolean, so it can fire AT MOST ONCE, at
  // the file's FIRST menu open — which happens in the freeze test, one case
  // BEFORE the silence test below. A per-test `mockClear()` would therefore wipe
  // the only evidence window that exists and leave `expect(tripwires).toEqual([])`
  // vacuously green in exactly the failure class it is here to catch. Nothing
  // else in this file reads the spy, `vi.spyOn` calls through so the runner still
  // prints everything, and the TRIPWIRE phrase filter keeps unrelated
  // console.error traffic (React's own document.body notice) out of the claim.
  consoleError = spyOnConsoleError();
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
  document.body.className = '';
  // The belt to the silence test's braces: whatever order the cases ran in, and
  // whichever of them opened the menu first, no tripwire was printed anywhere in
  // this file. Asserted before the spy is restored, or there is nothing to read.
  expect(tripwireCalls()).toEqual([]);
  consoleError.mockRestore();
});

describe('Shell — the body-level sibling contract (E10/E11, P1)', () => {
  it('renders skip-link · header · main · footer · dial · call · dialog as direct <body> children, in that order', () => {
    mount();

    // SEVEN since 2026-09-04: FloatingActions' clearance spacer was removed by
    // the owner, so the section contributes two `fixed` controls and nothing
    // else (its own header carries the decision).
    expect(shellChildren()).toEqual([
      skipLink(),
      document.querySelector('header'),
      main(),
      footer(),
      dialNav(),
      callDisc(),
      dialog(),
    ]);
    // Not one wrapper anywhere in between — the freeze walks <body>'s children
    // and skips only the section's own ancestor, so a layout <div> here would
    // disable it silently (that is what group 2 proves at runtime).
    expect(main().parentElement).toBe(document.body);
    expect(footer().parentElement).toBe(document.body);
  });

  it('puts the skip-link first in the document AND first in the tab order', () => {
    mount();

    // First of the shell's own boxes — see shellChildren() for what the export
    // additionally puts around them, and why none of it competes for this slot.
    expect(shellChildren()[0]).toBe(skipLink());
    // The claim that actually matters to a visitor (SC 2.4.1 Bypass Blocks):
    // FIRST IN THE TAB ORDER. `sr-only` clips the link but never hides it, so it
    // stays a real tab stop; everything above it in the bar is either
    // unfocusable (Wordmark's hrefless D9 placeholder) or display:none below the
    // @3xl container step.
    expect(focusablesInDocument()[0]).toBe(skipLink());
  });

  it('keeps the clearance spacer the LAST box in normal flow, with the closed dialog after it', () => {
    mount();

    // Normal flow = everything that is neither taken out of it (the two
    // `fixed` corner controls, the `sr-only absolute` skip-link) nor hidden
    // (the closed dialog). Since the clearance spacer was removed (owner,
    // 2026-09-04) the FOOTER is the last flow box — which is the whole point of
    // the sticky-footer rule: nothing of ours renders below it any more.
    const flow = shellChildren().filter((element) => {
      const style = getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.position !== 'fixed' &&
        style.position !== 'absolute'
      );
    });
    expect(flow.at(-1)).toBe(footer());
    expect(flow).toContain(main());

    // …and the dialog is the last ELEMENT while contributing no box at all:
    // `display: none` comes from globals' `dialog:not([open])` rule (and the UA
    // sheet), so footer-last-in-flow holds regardless. Both facts together are
    // what board §4 promises.
    expect(shellChildren().at(-1)).toBe(dialog());
    expect(dialog().open).toBe(false);
    expect(getComputedStyle(dialog()).display).toBe('none');
  });
});

describe('Shell — the freeze reaches the real page (E3/E11)', () => {
  it('inerts every non-header sibling while the menu is open, and restores them on close', async () => {
    const user = userEvent.setup();
    mount();

    // EVERY non-header sibling, which is what the freeze actually walks — the
    // dialog and the spacer included (G2 F2). The dialog's freezing is not a
    // curiosity: it is the PREMISE of E1's one-commit handover. Done in two
    // steps instead of one, the panel's Contact press would leave `inert` on the
    // body-level <dialog> and showModal() would paint a top-layer dialog that is
    // dead to taps, keys and assistive tech. Header.test.tsx pins the handover;
    // this pins the state that makes it necessary.
    const frozen = [
      skipLink(),
      main(),
      footer(),
      dialNav(),
      callDisc(),
      dialog(),
    ];
    for (const element of frozen) expect(element).not.toHaveAttribute('inert');

    await user.click(burger());
    // `inert` removes a subtree from focus order, hit-testing AND the
    // accessibility tree — one attribute doing a focus trap's whole job. The
    // skip-link is frozen with everything else, deliberately (board §4): Esc is
    // the way out of an open menu, not a jump to <main>.
    for (const element of frozen) expect(element).toHaveAttribute('inert');
    // The bar itself stays LIVE — that is why the panel refuses aria-modal and
    // why the ✕ is still reachable (fb-157).
    expect(burger().closest('[inert]')).toBeNull();

    await user.click(burger());
    for (const element of frozen) expect(element).not.toHaveAttribute('inert');
  });

  it('leaves NavMenu’s mount-contract tripwire silent — the shell shape is the one the freeze assumes', async () => {
    const user = userEvent.setup();
    mount();

    await user.click(burger());
    expect(main()).toHaveAttribute('inert');

    // The tripwire fires when the frozen set contains no <main> and no
    // <footer>, i.e. when a wrapper element has quietly turned the freeze into
    // a no-op. In Storybook it is EXPECTED to fire (#storybook-root is that
    // one-wrapper shape, recorded in NavMenu); here it must not, and this is
    // the only place in the repo that can say so.
    // The record is CUMULATIVE — never cleared between tests — so this reads the
    // whole file's console traffic, the earlier freeze test's first open
    // included. That open is in fact the only moment the once-per-session guard
    // can ever let the warning through; see the beforeAll note.
    expect(tripwireCalls()).toEqual([]);
  });

  it('does NOT move the page when the menu closes (owner close-jump, 2026-09-04)', async () => {
    // THE REGRESSION THIS SHELL CREATED, and the test that keeps it closed.
    // Reported from a phone: closing the menu jumped the page. The cause was
    // this lane's own `scroll-padding-top` meeting NavMenu's focus return —
    // focus() scrolls its target into view by default AND honours scroll
    // padding, and the target is the burger, which lives in a STICKY bar. The
    // browser therefore tried to put a sticky element 5rem below the top of the
    // viewport, a position it can never reach because it moves with the scroll,
    // and settled by nudging the page. `focus({ preventScroll: true })` at every
    // focus-RETURN site is the fix (NavMenu here, ui/SpeedDial and ui/Modal in
    // the same edit).
    // Exact equality, not a tolerance: a focus return must move the viewport by
    // ZERO pixels. Real Chromium, real scrolling — nothing here is simulated.
    // ── THE SETUP IS AS LOAD-BEARING AS THE ASSERTION, because two things in
    // this runner can fake a pass or a failure, and both were measured before
    // this test was written:
    //  ① `@testing-library/user-event` calls `element.focus()` (no options) as
    //     part of a click when the target is not already focused, and THAT
    //     scroll is the driver's, not ours — a real mouse click never scrolls a
    //     button into view. So the burger is focused up front, with the scroll
    //     suppressed, and every later click finds it already focused;
    //  ② the close must move focus for the return to mean anything. Focus is
    //     therefore parked INSIDE the panel first (which is where a visitor
    //     leaves it after tabbing to a menu item), so Esc performs a genuine
    //     panel → burger move — the exact motion the owner saw jump the page.
    // Measured on this tree: a bare `burger.focus()` at scrollY 1200 lands the
    // page at 836, and `focus({ preventScroll: true })` holds 1200.
    const user = userEvent.setup();
    mount();

    const tall = document.createElement('div');
    tall.style.height = '4000px';
    main().append(tall);
    // A real mid-page position, with room to move in both directions.
    expect(
      document.documentElement.scrollHeight - window.innerHeight,
    ).toBeGreaterThan(2000);

    burger().focus({ preventScroll: true });
    await user.click(burger());
    const panelCta = document.querySelector<HTMLElement>('#header-menu button');
    panelCta?.focus({ preventScroll: true });
    expect(document.activeElement).toBe(panelCta);

    window.scrollTo(0, 1200);
    const before = window.scrollY;
    expect(before).toBe(1200); // the scroll landed (globals' smooth is stilled)

    await user.keyboard('{Escape}');

    // The focus return happened…
    expect(document.activeElement).toBe(burger());
    // …and it moved the page by exactly nothing. Exact equality: a focus return
    // restores the KEYBOARD position, and the viewport belongs to the visitor.
    expect(window.scrollY).toBe(before);
  });

  it('scroll-locks the document while open and releases it on close', async () => {
    const user = userEvent.setup();
    mount();
    const before = document.documentElement.style.overflow;

    await user.click(burger());
    expect(document.documentElement.style.overflow).toBe('hidden');

    await user.click(burger());
    expect(document.documentElement.style.overflow).toBe(before);
  });
});

describe('Shell — single-open across {menu, dial} (P7, E2)', () => {
  it('makes the dial unreachable while the menu is open', async () => {
    const user = userEvent.setup();
    mount();

    await user.click(burger());

    // The dial is a body-level sibling, so the freeze reaches it: the bulb is
    // not merely dimmed by the z-45 sheet, it is dead to taps, keys and
    // assistive tech. The fb-129/136 "looks pressable, does nothing" trap
    // cannot recur, because the scrim explains the state visually.
    expect(dialNav()).toHaveAttribute('inert');
    expect(bulb().closest('[inert]')).toBe(dialNav());
  });

  it('closes an open dial on the burger press, BEFORE the menu opens', async () => {
    const user = userEvent.setup();
    mount();

    await user.click(bulb());
    expect(bulb()).toHaveAttribute('aria-expanded', 'true');
    // Open = the stem list drops its own `inert`, which is the only thing that
    // changes besides aria-expanded (D8 = M: nothing mounts, nothing unmounts).
    expect(stem()).not.toHaveAttribute('inert');

    await user.click(burger());

    // The other direction of the invariant, and the one with no coordinator
    // behind it: the burger press is an outside `pointerdown` for the dial, so
    // the dial's own document listener closes it in that event — before the
    // click that opens the menu. The stem's OWN `inert` is the discriminator
    // here: the <nav> around it is inert too now (the freeze), so only the
    // list's attribute can tell "closed" apart from "merely frozen".
    expect(bulb()).toHaveAttribute('aria-expanded', 'false');
    expect(stem()).toHaveAttribute('inert');
    expect(burger()).toHaveAttribute('aria-expanded', 'true');
    expect(dialNav()).toHaveAttribute('inert');
  });
});

describe('Shell — the skip-link (mount-contract box 9, Q1)', () => {
  it('targets the one <main> landmark by fragment', () => {
    mount();

    expect(skipLink()).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toBe(main());
    expect(main().tagName).toBe('MAIN');
    // Exactly one <main> in the document — a second landmark would make the
    // fragment ambiguous and break the §9 landmark contract.
    expect(document.querySelectorAll('main')).toHaveLength(1);
    // No tabindex: a fragment jump moves the sequential-focus starting point
    // natively, and scroll-padding-top keeps the landing clear of the pill.
    expect(main()).not.toHaveAttribute('tabindex');
  });

  it('ships the SAME clothes and the SAME target in layout.tsx — the pair cannot drift', () => {
    // THE ONE DUPLICATED STRING THIS LANE SHIPS, mechanized (G2 F6). Everything
    // else in this file renders the real components; the skip-link is markup the
    // shell writes inline, and the shell is an async Server Component no browser
    // runner can execute — so the assembly above composes its own copy. Without
    // this guard, a reviewer editing the reveal in layout.tsx would keep a green
    // suite while shipping a skip-link the tests never saw.
    // Read as TEXT, so nothing in layout.tsx's module graph (next/font, the
    // next-intl/server helpers) has to run for the check to hold.
    expect(layoutSource).toContain(SKIP_LINK);
    expect(layoutSource).toContain('href="#main"');
    expect(layoutSource).toContain('id="main"');
    // The sticky-footer pair (owner, 2026-09-04) rides the same guard: the
    // computed-style assertions below measure classes THIS file stamps on
    // <body>, so without these two lines they would prove the cascade works and
    // say nothing about whether the shell actually ships it.
    expect(layoutSource).toContain(`className="${BODY_LAYOUT}"`);
    expect(layoutSource).toContain(`className="${MAIN_GROW}"`);
  });

  it('is clipped at rest and a real, visible box while focused (the in-flow reveal)', () => {
    mount();
    const link = skipLink();

    // At rest: `sr-only` — an absolutely positioned 1px box, out of flow and
    // invisible, but still a tab stop.
    expect(getComputedStyle(link).position).toBe('absolute');
    expect(link.getBoundingClientRect().height).toBeLessThanOrEqual(1);

    link.focus();
    expect(document.activeElement).toBe(link);

    // Focused: `focus:not-sr-only focus:block` puts it back into NORMAL flow at
    // the top of the document — a real strip that pushes the page down. Not
    // clipped, so offsetParent resolves to a laid-out ancestor.
    const focused = getComputedStyle(link);
    expect(focused.position).toBe('static');
    expect(focused.display).toBe('block');
    expect(link.offsetParent).not.toBeNull();
    expect(link.getBoundingClientRect().height).toBeGreaterThan(1);
  });
});

describe('Shell — the footer stays at the bottom (owner, 2026-09-04)', () => {
  afterAll(async () => {
    await page.viewport(390, 844);
  });

  it('makes <body> a full-height column with <main> taking the slack', () => {
    mount();

    const body = getComputedStyle(document.body);
    expect(body.display).toBe('flex');
    expect(body.flexDirection).toBe('column');
    // `min-h-dvh` — the DYNAMIC viewport unit, so a mobile URL bar sliding away
    // does not leave a short body behind (NavMenu's panel cap records the same
    // choice). Compared against the live viewport rather than a literal, which
    // would only be true at one runner geometry.
    expect(body.minHeight).toBe(`${window.innerHeight}px`);
    expect(getComputedStyle(main()).flexGrow).toBe('1');
  });

  it('pins the footer to the viewport bottom when the page is SHORT', async () => {
    // THE OWNER'S ACTUAL REQUIREMENT, measured rather than inferred from
    // classes: "on every screen the footer must always stay at the bottom of
    // the page". A tall viewport is what makes this case the short-page one —
    // the stand-in <main> holds a paragraph and a link, so at 2400px the real
    // Header + Footer cannot fill the screen and a non-flex body would leave
    // the footer floating with blank page-ground beneath it.
    await page.viewport(1536, 2400);
    mount();

    const bottom = footer().getBoundingClientRect().bottom;
    // Sub-pixel tolerance: fractional layout can land this a hair off.
    expect(Math.abs(bottom - window.innerHeight)).toBeLessThanOrEqual(1);
    // …and the case is genuinely the short one — if the content had overflowed,
    // the assertion above would pass for the wrong reason.
    expect(document.body.scrollHeight).toBeLessThanOrEqual(
      window.innerHeight + 1,
    );
  });

  it('lets a TALL page push the footer down instead of squashing <main>', async () => {
    // The other half of `flex-1`: a flex item's `min-height: auto` refuses to
    // shrink below its content, so long pages scroll normally and the footer
    // simply follows the content. Without that, `flex-basis: 0` would clip.
    await page.viewport(390, 600);
    mount();

    const tall = document.createElement('div');
    tall.style.height = '3000px';
    main().append(tall);

    expect(main().getBoundingClientRect().height).toBeGreaterThan(3000);
    expect(footer().getBoundingClientRect().top).toBeGreaterThan(
      window.innerHeight,
    );
  });
});

describe('Shell — the scroll-padding pair on <html> (E5/E12, boxes 1 + 3)', () => {
  // SC 2.4.11 Focus Not Obscured (Minimum), AA and new in WCAG 2.2, by the
  // WCAG-documented technique C43. Two blurred-glass surfaces are always on
  // top — the sticky pill above and the two fixed corner discs below — so a
  // focusable scrolled or jumped to rest behind either is obscured together
  // with its focus ring. These four numbers are the shell's half of the bill;
  // each one's authoritative home stays in its section's own header
  // (Header.tsx "THE MOUNT CONTRACT" (a) · FloatingActions' mount-contract
  // obligation (a)), and they move together or the debt reopens.
  //
  // The bottom steps are matched by PATTERN rather than by equality because
  // every step carries an `env(safe-area-inset-bottom)` term: without a
  // viewport-fit=cover opt-in the inset resolves to zero, and engines differ on
  // whether they then collapse `calc(88px + 0px)` to `88px`. The number is the
  // contract; the collapsing is not. `(^|\D)` closes the left boundary a plain
  // substring left open (G2 F3) — '188px' contains '88px' and would have passed.
  const paddings = () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.scrollPaddingTop,
      bottom: style.scrollPaddingBottom,
    };
  };

  afterAll(async () => {
    await page.viewport(390, 844);
  });

  it('keeps the pill’s 6rem reach clear at the top, at EVERY width', async () => {
    // top-4 + h-20 = 6rem = 96px, and it is one unstepped number again: the bar
    // is the same height on every screen since the owner's 2026-09-04 "make top
    // bar same size on every screen as it is on a standard pc screen now".
    // Sampled at three widths precisely because a stepped spelling existed
    // earlier the same day (80px below xl, 96px above) — if a media step ever
    // comes back without the owner asking, the phone case fails here.
    await page.viewport(390, 844);
    expect(paddings().top).toBe('96px');

    await page.viewport(1280, 800);
    expect(paddings().top).toBe('96px');

    await page.viewport(1536, 864);
    expect(paddings().top).toBe('96px');
  });

  it('mirrors the clearance spacer at the bottom, in three steps', async () => {
    // The steps are the spacer's own heights, and they exist because the corner
    // discs grow with the screen (--disc-size 56 → 64 → 72px): base 5.5rem,
    // xl 6rem, 2xl 6.5rem — Tailwind's untouched 1280/1536 breakpoints (§3, §7).
    await page.viewport(390, 844);
    expect(paddings().bottom).toMatch(/(^|\D)88px/);

    await page.viewport(1280, 800);
    expect(paddings().bottom).toMatch(/(^|\D)96px/);

    await page.viewport(1536, 864);
    expect(paddings().bottom).toMatch(/(^|\D)104px/);
  });
});
