'use client';

import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { lockScroll } from '@/lib/scroll-lock';
import { BurgerToggle } from './BurgerToggle';
import { NavItem } from './NavItem';
import { useNavItems } from './useNavItems';

// sections/Header — the burger, the dropdown panel and the dimming sheet: the
// one stateful island of the bar. Built to the owner-approved N2 contract
// board .claude/plans/header-n2-contract.plan.md (2026-08-12); the drawer-era
// parts of the dossier are SUPERSEDED — this is a DROPDOWN under the bar, not
// a side drawer, and the file is named for what it is (D2's lying-name
// precedent: RoundButton → GlyphButton the moment the name stopped matching).
//
// ── The three boxes and where each one lives.
//   burger  inside the bar — its hide-rule is measured against the bar
//   panel   inside the bar, hanging off its bottom edge (absolute top-full)
//   sheet   PORTALED to <body> — the one box that must leave (board §4b)
// All three read one `open` boolean, which is what makes them one component.
//
// ── Why the sheet has to leave, in two independent sentences (board §4b).
// ① `fixed` does not always mean "the screen": it resolves against the nearest
// ancestor that established a positioning scope, and `container-type` — the
// very property that makes the breakpoint possible — establishes one. A
// `fixed inset-0` sheet inside the bar pins itself to the BAR's four edges: a
// 64px stripe, not a full-screen sheet.
// ② z-index is hierarchical: `z-50` on the bar opens a stacking context, so a
// sheet nested inside is "50-point-something" whatever number it claims — it
// could never paint below the bar (and the lit bar is the point) nor slot
// between the z-40 corner discs and the z-50 bar. As a child of <body> no
// ancestor is a positioning scope and no ancestor opened a z-scope, so
// 40 discs < 45 sheet < 50 bar+panel are three numbers on one flat scale:
// discs dimmed, bar lit, by construction.
//
// ── The freeze is `inert`, and nothing else (board §5·A1, fb-157).
// The panel deliberately does NOT claim role="dialog"/aria-modal. That claim
// would tell screen readers "nothing outside this panel exists", which
// includes the bar and therefore the ✕ — and the ✕ must stay reachable. It is
// honestly a DISCLOSURE: a button that opens and closes a thing, wearing
// aria-expanded + aria-controls. With everything below the bar inert, the
// browser's OWN Tab order is ✕ → Contact → the links — the brand corner is
// sections/Wordmark's hrefless placeholder anchor since D9 (visible, never
// focusable) — page content is unreachable, and there is NO JavaScript focus
// trap anywhere in this file.
// Since fb-164/165/166 that order is exact at EVERY width: the single-menu
// rule takes the bar's row and its Contact to display:none while the panel is
// open, and display:none is unfocusable — so the wide screen now walks the
// same three-step cycle the phone always did, and the Contact in it is the
// panel's own (the classes live in Header.tsx and HeaderNav.tsx).

/**
 * The panel's id, hard-coded rather than useId: FIVE places must agree on the
 * literal (count amended per org-review F7, fb-169). `aria-controls` on the
 * burger names it, the visual runner waits for it (`pin-open`), and the
 * interaction tests query it — and since the single-menu rule (fb-164/165/166)
 * the string also appears INSIDE two class selectors,
 * `group-has-[#header-menu]/bar:hidden` in Header.tsx and HeaderNav.tsx, where
 * Tailwind's build-time scanner reads class text literally and cannot
 * interpolate a JS constant. Exactly one Header exists per page (it is the
 * shell's bar), so a generated id would only make five places harder to keep
 * in step; Header.test.tsx pins both the id and the class token, so a drift
 * fails loudly.
 */
const PANEL_ID = 'header-menu';

/**
 * Marks the portaled sheet so the freeze below can skip it. Without this the
 * sheet — a child of <body> like the page content — would be frozen by its own
 * effect and could not be tapped, which is its only job (fb-154).
 */
const SHEET_MARKER = 'data-header-sheet';

/**
 * The element that CONTAINS this Header, at the level `inert` is applied:
 * walks up until the next step would be <body>. In the real shell that is the
 * <header> itself (§4: layout.tsx renders Header · {children} · Footer as body
 * children), so the siblings it skips are exactly <main>, the footer and the
 * corner discs.
 *
 * IN STORYBOOK IT IS #storybook-root — which holds the bar AND the story's
 * page ground together, so the stories exercise NO REAL FREEZE: what gets
 * inerted there is Storybook's own scaffolding (see warnIfNothingWasFrozen).
 * The freeze is proven in Header.test.tsx, which mounts the stand-in <main>
 * and footer as genuine body-level siblings.
 */
function bodyLevelAncestor(node: Element | null): Element | null {
  let current: Element | null = node;
  while (current?.parentElement && current.parentElement !== document.body) {
    current = current.parentElement;
  }
  return current?.parentElement === document.body ? current : null;
}

/**
 * Body-level boxes the freeze must NOT touch: live regions, and Next's route
 * announcer — a <next-route-announcer> custom element the App Router appends to
 * <body> of every page, whose aria-live node lives in its shadow root (so an
 * attribute check alone would miss it, and `inert` propagates into shadow DOM).
 *
 * The rule outlived the case that prompted it (G2 review, 2026-08-13), and is
 * kept on the general one. It was written when a panel link swapped the page
 * client-side and that announcer named the arriving page; since §15.13 a click
 * loads a whole new document, which announces its own <title>, so the element
 * narrates nothing of ours — Next still appends it regardless. Freezing a live
 * region is simply the wrong default: it turns a message into silence, and the
 * first region that does matter here (the language-suggestion banner, a future
 * form status) would inherit that bug without a symptom. Costs nothing either
 * way — a live region is announced, never focused: not a Tab stop, not a tap
 * target.
 */
function isLiveRegion(element: Element): boolean {
  return (
    element.hasAttribute('aria-live') ||
    element.localName === 'next-route-announcer' ||
    element.id === '__next-route-announcer__'
  );
}

// Dev builds only — THAT gate is the ui/slot.ts convention. The once-per-session
// half is not: slot.ts carries no such guard and warns on every call, so this
// boolean is where "say it once" starts in this repo (ui/SpeedDial's keyed Set
// refines it for a helper that warns about many different strings).
let mountContractWarned = false;

/**
 * Dev tripwire for the mount contract the freeze DEPENDS ON. `inert` is
 * applied to <body>'s children minus our own, so it only freezes anything if
 * the shell keeps header · main · footer · FloatingActions as BODY-LEVEL
 * SIBLINGS (§4). Wrap them in one layout <div> and this effect still runs,
 * still finds a list, and still freezes — Storybook's own scaffolding, say —
 * while the page itself stays live: a silent, total loss of the §5·A1 freeze
 * with no error anywhere. This turns that into a message.
 *
 * EXPECTED to fire in Storybook: the preview mounts every story inside
 * #storybook-root, which IS the one-wrapper shape it warns about (see the
 * stories' own note). The interaction tests are where the real freeze is
 * proven, because they put the stand-in page at body level.
 */
function warnIfNothingWasFrozen(frozen: readonly Element[]): void {
  if (process.env.NODE_ENV === 'production' || mountContractWarned) return;
  const freezesPageContent = frozen.some(
    (element) =>
      element.matches('main, footer') ||
      element.querySelector('main, footer') !== null,
  );
  if (freezesPageContent) return;
  mountContractWarned = true;
  console.error(
    'Header/NavMenu: the open menu froze no page content — no <main> or ' +
      "<footer> was found among <body>'s other children. The freeze (board " +
      '§5·A1) assumes the Phase-4 mount contract: header, main, footer and ' +
      'FloatingActions are BODY-LEVEL SIBLINGS. One wrapper element around ' +
      'them disables the freeze silently.',
  );
}

// The panel. `absolute inset-x-0 top-full` reads: pin my left and right edges
// to my container's, and put my top edge at my container's bottom — hang
// directly below the bar, exactly as wide as it. A RELATIVE position, so there
// is no portal, no viewport arithmetic and no magic number for the bar's
// height: move the bar and the panel follows. (The bar is `sticky`, and its
// container-type also makes it the containing block — both roads lead to the
// same box.) Since the bar became a floating pill (owner, 2026-08-16 —
// Header.tsx tells that story) the panel is a SECOND glass card: `mt-2` of
// dimmed page between the two, and the same rounded-md + full border +
// static-blur chrome the bar wears.
// B2 · the panel can be taller than a landscape phone (~356px of content vs a
// 320px-tall screen), so it caps itself and scrolls INTERNALLY — the panel
// scrolls, the page behind it stays frozen. `dvh`, not `vh`, because mobile
// URL bars change the viewport height as you scroll; 5.5rem is the panel's
// own top edge — the pill's reach plus the gap, top-4 + h-20 + mt-2 = 6.5rem —
// i.e. everything below the hanging panel and nothing more.
// THE NUMBER MOVED ON 2026-09-04 (owner: "make top bar same size on every
// screen as it is on a standard pc screen now"), 5.5rem → 6.5rem. Worth
// recording why it moved THIS round and pointedly did not the round before,
// because the two look like the same edit: the first ask grew the row only at
// the bar's @5xl step, and this panel can only ever EXIST below @3xl — the
// burger that opens it is `@3xl:hidden`, and a display:none button cannot be
// pressed — so every width where a panel is reachable still had an h-16 row and
// the cap was already correct. The uniform height removes that shelter: the
// burger widths now get the taller bar too, so the panel really does hang 1rem
// lower and the cap follows or the panel overflows the viewport by exactly that
// much. It is now a plain member of the P9a family (Header's row · globals'
// scroll-padding-top · FloatingActions' --stem-inset · this).
// B6 · a box of unknown height cannot animate `height: auto`, so the entry is
// transform + opacity on D12's 300ms ease-out family. @starting-style (the
// `starting:` variant) is what gives a JUST-MOUNTED element a from-state; the
// resting `translate-y-0` is its to-state, declared so the two interpolate.
// Under prefers-reduced-motion the transition is off and the panel simply
// appears (§9) — nothing is conveyed by the animation.
// rounded-lg = 8px, matching the pill — the owner's old-bar rounder corners
// (2026-08-16; controls keep §15.1's 6px). The dimmed page shows through at
// all four corners AND through the mt-2 gap above, which is the intended
// two-cards look. Depth is deliberately NOT invented here — no shadow ships
// until the N4 pack settles one.
const panelClasses =
  'absolute inset-x-0 top-full mt-2 flex flex-col gap-2 p-4 ' +
  'rounded-lg border border-line-subtle bg-surface/95 ' +
  'backdrop-blur-md backdrop-saturate-150 ' +
  'max-h-[calc(100dvh-6.5rem)] overflow-y-auto ' +
  'translate-y-0 opacity-100 transition-[translate,opacity] ' +
  'duration-300 ease-out starting:-translate-y-2 starting:opacity-0 ' +
  'motion-reduce:transition-none';

// The morph, D12, lives whole in ./BurgerToggle — artwork AND behavior in one
// section-owned control (§3c placement, owner 2026-08-16: assets/ holds inert
// nouns; a state-driven morph is a verb and sits beside the feature that
// drives it — that file carries the full reasoning, the load-bearing
// transform-box note and the per-bar transition rule). GlyphButton stays
// morph-READY only: it guarantees the `group` marker class on its root, and
// BurgerToggle's bars read THIS button's aria-expanded through it. Wave-1
// constraint 3 still binds at this call site: no `group` may appear on any
// wrapper between that root and the bars (Header.tsx keeps its own group
// named `group/bar`; Header.test.tsx asserts the seam).

export function NavMenu(): ReactElement {
  const t = useTranslations('common');
  const items = useNavItems();

  // The one variable the whole file turns on. `{open && …}` renders NOTHING
  // when false, so while the menu is closed neither the panel nor the sheet
  // exists in the document — the pre-built HTML contains no menu and nothing
  // can flicker during hydration (§16).
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Set by close(), consumed by the focus-return effect below: it records
  // "this close came from the USER". That is also what tells a real close apart
  // from the FIRST render, where the same effect runs with the menu already
  // closed and must not pull focus onto the burger.
  const returningFocus = useRef(false);

  /**
   * Every close the USER performs — the ✕, Esc, a tap on the sheet — puts
   * focus back where they left it. Without this, closing from Esc or the
   * sheet would drop focus on <body> and a keyboard user would restart at the
   * top of the document.
   */
  const close = useCallback(() => {
    returningFocus.current = true;
    setOpen(false);
  }, []);

  // The focus return runs AFTER the close has been committed, not inside
  // close(), because closing can HIDE the very button we want to focus.
  // Board §4c, the row-4 → row-3 transition: the menu was opened below the
  // breakpoint, the container then grew past it (rotation, a resized window),
  // and closing re-applies `@3xl:hidden` to the burger. Focusing it before
  // that commit lands focus on an element that is about to become
  // `display: none`, and the browser drops focus to <body> — a keyboard user
  // is silently teleported to the top of the document (G2 review, 2026-08-13).
  // Reading offsetParent after the commit is what tells the two cases apart:
  // it is null exactly when the element (or an ancestor) is display:none.
  // The fallback is the FIRST `a[href]` in the bar. That used to be the brand
  // link; since the brand became Wordmark's hrefless placeholder anchor (D9)
  // it is the nav row's first link — safe by construction, because this path
  // only runs when the burger vanished, i.e. above the @3xl step, exactly
  // where the row is visible. Header.test.tsx asserts the target.
  useEffect(() => {
    if (open || !returningFocus.current) return;
    returningFocus.current = false;

    // `preventScroll` on BOTH paths (owner-reported bug, 2026-09-04: closing
    // the menu on a phone jumped the page). A focus return restores the
    // KEYBOARD position; the VIEWPORT position belongs to the visitor, who has
    // not asked to go anywhere. By default focus() also scrolls the target into
    // view, and since the shell gained `scroll-padding-top` the browser tries to
    // clear that strip for a target that is INSIDE the sticky bar — a clearance
    // a sticky element can never satisfy, because it moves with the scroll — so
    // every close nudged the page. The burger is on screen by construction here
    // (it is in the always-visible bar), which is what makes suppressing the
    // scroll safe rather than merely quieter.
    // KEEP-IN-SYNC with ui/SpeedDial's focus-return effect (fb-44): its bulb
    // takes the same option for the same reason, and the two moved together.
    const burger = burgerRef.current;
    if (!burger) return;
    if (burger.offsetParent !== null) {
      burger.focus({ preventScroll: true });
      return;
    }
    // Scoped to this section's own root — never a document-wide query.
    burger
      .closest('header')
      ?.querySelector<HTMLElement>('a[href]')
      ?.focus({ preventScroll: true });
  }, [open]);

  // Esc closes (§9). Bound to the document, not the panel, because focus may
  // legitimately sit on the ✕ — outside the panel and live (the brand corner
  // stopped being focusable with Wordmark's D9 placeholder anchor).
  //
  // KEEP-IN-SYNC with ui/SpeedDial's own "Esc closes (§9)" effect
  // (src/components/ui/SpeedDial/SpeedDial.tsx): same key check, same document
  // binding, same reason — focus may legitimately sit outside the popup while
  // it is open. The two are independent BY CONSTRUCTION, not by neglect: §4
  // forbids the atom from importing a section's internals and neither owns the
  // other, so this is a fb-44-style KEEP-IN-SYNC pair rather than a promotion
  // candidate. A change to the dismissal rule is a change to both files.
  // SpeedDial's reciprocal pointer back here rides the org-hygiene lane, not
  // this one (§17.3 — one component per commit).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  // ── BACK, WITH THE MENU STILL OPEN — the bfcache (G2 review D1).
  // The back/forward cache: browsers keep the document you LEAVE frozen in
  // memory — DOM, React state, scroll position — and restore it whole on Back,
  // instantly, without re-running anything. That is a gift on a static site and
  // the reason §7 counts it as an upside of full-document navigation; it is
  // also the one case where the shell's state DOES persist across a
  // "navigation". Tap a panel link, land on the new document, press Back: the
  // frozen document comes back with the panel open over a page that is still
  // `inert` and still scroll-locked, because no code ran to close it. Under
  // soft navigation the deleted B1 (close-on-route-change) covered this by
  // accident; a restore is not a route change, so nothing covers it now. This
  // effect IS B1's full-document replacement — the same guarantee ("a
  // navigation leaves no open menu behind"), rebuilt out of the two page
  // lifecycle events §15.13 left us instead of a router callback.
  //
  // ── DEPARTURE — `pagehide`, and why the close must be flushed.
  // Closing on the way IN (below) is a repair: the browser paints the frozen
  // snapshot first, and only then does our listener ask React to re-render, so
  // one frame (~16ms) of restored page can still show the open panel. The cure
  // is to leave with the menu already closed, so the snapshot itself is clean.
  // `pagehide` is the one event that fires on EVERY departure — a navigation
  // away, or entry into the bfcache — and ONLY on departures, which is what
  // makes it the right place to change what the snapshot will contain.
  // `visibilitychange` also fires on tab and app switches, where closing the
  // menu would be visitor-noticeable, and `unload` must not be used at all —
  // merely listening for it disqualifies the page from the bfcache. Hence the
  // pre-close, and hence flushSync: React normally SCHEDULES a commit for its
  // next turn, and that turn may never come on a page that is about to be
  // frozen. flushSync is React's documented tool for exactly this — "apply
  // this update now, do not schedule it" — so the DOM is mutated synchronously
  // inside the handler, before the event returns. Its cost (a forced
  // synchronous render) is the reason it is a last resort in normal code and
  // a non-issue here: it runs once, at page exit, on a document nobody will
  // interact with again.
  // Deliberately UNCONDITIONAL — no `event.persisted` check, unlike below.
  // Closing a menu on a page the visitor is leaving is harmless whether or not
  // the browser then caches it (the document is either frozen or gone), and the
  // flag at that moment is an INTENTION, not a fact: `persisted: true` says the
  // browser INTENDS to cache the page, and other factors may still prevent it —
  // in every engine, not one vendor's quirk. Branching on it could only ever
  // skip a close we wanted.
  //
  // ── RESTORE — `pageshow`, kept as the fallback.
  // `pageshow` fires on EVERY show of the document, first paint included;
  // `persisted` is true only for a bfcache restore, which is the only case
  // worth acting on there. It is a no-op whenever the pre-close ran — this
  // effect is gated on `open`, so a restored-already-closed document has no
  // listener attached at all — and it still covers any browser that freezes
  // without delivering `pagehide` first. Cheap belt to the braces.
  //
  // Both handlers call close(), not setOpen(false): the visitor's finger was
  // last on the ✕, so focus belongs on the burger, and close() is the one path
  // that arms the focus-return effect above. Listening only while open keeps
  // both listeners' lifetime the same as every other effect in this file — and
  // the document is frozen mid-open, so they are attached exactly when the
  // departure and the restore need them.
  //
  // KEEP-IN-SYNC with ui/SpeedDial's "── BACK, WITH THE DIAL STILL OPEN — the
  // bfcache (NavMenu's D1, same shape)" block
  // (src/components/ui/SpeedDial/SpeedDial.tsx): same pair of listeners, the
  // same flushSync pre-close, the same persisted-only restore, both gated on
  // `open`. That block already names THIS one as the shape it copied; the
  // pointer back rides the org-hygiene lane, not this one (§17.3 — one
  // component per commit).
  useEffect(() => {
    if (!open) return;
    const onPageHide = () => {
      flushSync(() => close());
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) close();
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [open, close]);

  // ── THE FREEZE (board §5·A1) — and a KNOWING §6 BOUNDARY CROSSING (B5).
  // §6 forbids a section from styling the shell. This reaches outside the
  // section anyway, onto <main>, the footer and the corner discs, because
  // `inert` IS the freeze mechanism and no page-freezing overlay can do its
  // job from inside its own subtree. It is a runtime DOM effect, not a style
  // rule, and every mutation is reverted on close/unmount — recorded here so a
  // reviewer reads intent, not a slip.
  //
  // Elements that were ALREADY inert before we opened are left untouched and
  // stay inert: we restore the exact prior state, we do not impose ours.
  //
  // ── THE SCROLL-LOCK IS THE OTHER HALF of "the page cannot be scrolled"
  // (fb-154), and it is no longer written out here. This block used to carry
  // the promise "when ContactModal needs the same, this becomes a shared helper
  // (rule of two)"; that helper shipped on 2026-08-26 as lib/scroll-lock.ts
  // (Modal contract board D7 → A) and names this file as the second consumer
  // due to adopt it. THIS IS THAT ADOPTION — the promise is kept, so the three
  // hand-written lines do not come back.
  // What the shared import buys is not brevity but a GUARANTEE. The menu → modal
  // handover documented in lockScroll's own JSDoc — the menu locks and saves
  // '', the modal locks on top and saves 'hidden', each unlock puts back
  // exactly what it found — used to rest on two files happening to spell
  // save/restore the same way. One module makes it true by construction. The
  // panel's Contact trigger walks straight through that handover; the CTA note
  // below tells that story in full, and Header.test.tsx pins it.
  //
  // The sideways lurch this lock caused on classic scrollbars — scrollbar gone
  // → viewport wider → every vw-derived box recomputes, so the pill visibly
  // RESIZED the moment it opened (owner report, 2026-08-16) — is cured by
  // `scrollbar-gutter: stable` on <html>: a SITE-WIDE line §6 forbids this
  // section from adding, so it lives in globals.css' base layer (board §5·A2,
  // shipped early for this very lock; ContactModal's lock leans on the same
  // line).
  useEffect(() => {
    if (!open) return;

    const unlock = lockScroll();

    const section = bodyLevelAncestor(burgerRef.current);
    const frozen = Array.from(document.body.children).filter(
      (child) =>
        child !== section &&
        !child.hasAttribute(SHEET_MARKER) &&
        !isLiveRegion(child) &&
        !child.hasAttribute('inert'),
    );
    for (const element of frozen) element.setAttribute('inert', '');

    warnIfNothingWasFrozen(frozen);

    return () => {
      unlock();
      for (const element of frozen) element.removeAttribute('inert');
    };
  }, [open]);

  return (
    <>
      {/* The burger — a disclosure: ONE state-invariant name plus
          aria-expanded, so a screen reader says "Meniu, button, collapsed" →
          "Meniu, button, expanded". Swapping the label to "Închide" would
          double-announce the state (Wave-1 a11y verdict: three keys → two).
          THE AUTO MARGINS ARE GONE (2026-09-04, Header's three-cell grid).
          This button used to carry `ml-auto` (and `@3xl:ml-0` while closed) to
          push itself to the bar's right edge and then to hand that job back to
          the CTA's own auto margin above the step — three classes doing one
          thing that the layout would not do by itself. It does now: the burger
          sits in Header's right-hand cell, which is `justify-self-end`, so the
          free space is outside the cell and the ✕ is at the right edge at every
          width and in both states, including the open one where the
          single-menu rule (fb-164/165/166) has removed the row and the bar's
          CTA. An `ml-auto` inside a content-sized flex cell moves nothing, so
          keeping it would have left a class that reads like a rule and is not.
          The hide-rule is what remains, and it is DROPPED while open
          (fb-145/149): a menu opened before rotating a tablet must stay
          closable, and one conditional class beats JavaScript watching the
          window (which D1 deleted). */}
      <GlyphButton
        ref={burgerRef}
        variant="ghost"
        shape="square"
        aria-label={t('menu.label')}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => (open ? close() : setOpen(true))}
        className={open ? undefined : '@3xl:hidden'}
      >
        <BurgerToggle />
      </GlyphButton>

      {open && (
        // A second navigation landmark, named by menu.label — the same string
        // the burger carries, so the panel announces as the thing that button
        // opened. NO role="dialog", NO aria-modal (board §5·A1).
        <nav
          id={PANEL_ID}
          aria-label={t('menu.label')}
          className={panelClasses}
        >
          {/* Contact FIRST (fb-151, amending D8's original bottom placement):
              it is the site's one conversion goal (§1) and, at the top of the
              panel, also the first thing a thumb reaches AND the panel's first
              Tab stop after the ✕ (B3). w-full is the section owning its
              child's box (§6.4/§6.8), never a restyle of the atom's internals.
              The interim plain phone link D4 parked here is gone: this is the
              ContactModal's own opener now (org-review F1, 2026-09-02), and the
              number it used to dial lives inside that dialog.

              ── `onClick={close}` IS LOAD-BEARING, not tidiness. The one-commit
              close-menu rule: this close() and the provider's open() both fire
              inside ONE event handler, because ContactModalTrigger never
              swallows the consumer's handler — that is the half of its contract
              this depends on — so React's automatic batching lands both
              setStates in ONE commit. NOT the order within that handler: the
              trigger calls onClick before open(), and its own header records
              that the order "is not observable from the outside" precisely
              because the batch hides it. Without the close the menu would
              simply stay open while the dialog appears — and the freeze above
              would still be holding `inert` on every body-level sibling, the
              <body>-level <dialog> included. showModal() would paint it into
              the top layer and leave it dead to taps, keys and assistive tech:
              a panel and an unusable modal on screen at once.

              ── WHERE FOCUS ENDS UP, and why useContactModal needed no new API
              to steer it. Inside that single commit React runs ALL
              PASSIVE-effect destroys and then ALL passive creates, child-first
              in tree order — passive specifically, since layout effects run
              earlier, during commit, so do not extend this ordering claim to
              them. This section sits inside the provider's {children}, while
              the one <ContactModal /> renders after them. So, in order: the
              freeze's
              cleanup releases the scroll lock and drops the inert attributes;
              the focus-return effect above, ARMED BY THIS close(), puts focus
              on the burger; only then does ui/Modal's open/close engine read
              document.activeElement — finding the burger — call showModal()
              (which records that same element as the platform's own restore
              target) and take its own lockScroll(). Esc or the ✕ therefore
              lands focus back on the burger, visibly, with nothing passed
              anywhere. The lock handover is race-free by the same ordering: the
              menu's unlock has already put '' back by the time the modal saves
              it. Header.test.tsx pins the whole chain in "hands the panel over
              to the ContactModal in ONE commit". */}
          <ContactModalTrigger
            variant="solid"
            className="w-full"
            onClick={close}
          >
            {t('actions.contact')}
          </ContactModalTrigger>

          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                {/* Same component, same list, same active rule as the bar row
                    — one source rendered twice, never two that can drift.
                    min-h-11 inside TextButton keeps every row a §9 touch
                    target; w-full is this section handing NavItem its layout
                    (§6.4) so the whole panel width is tappable. */}
                <NavItem {...item} className="w-full" />
              </li>
            ))}
          </ul>
        </nav>
      )}

      {open &&
        createPortal(
          // The dimming sheet. Tapping it closes the menu (fb-154); z-45 sits
          // between the z-40 corner discs and the z-50 bar, so content and
          // pills dim while the bar stays lit.
          // aria-hidden + no role + no tab stop is what keeps this legal
          // WITHOUT an eslint waiver: jsx-a11y's interaction rules exempt
          // aria-hidden elements, because a click target that is hidden from
          // assistive tech must not ALSO be keyboard-operable — Esc is the
          // keyboard's way out of the menu. Making this decoration focusable
          // would put a nameless stop in the Tab order between the ✕ and the
          // panel, which is exactly what §5·A1's Tab order must not contain.
          // The attribute is spelled out here and read back by SHEET_MARKER in
          // the freeze above; the sheet-tap test queries the same selector, so
          // a drift between the two fails loudly rather than silently freezing
          // the sheet.
          <div
            data-header-sheet=""
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 z-45 bg-scrim"
          />,
          document.body,
        )}
    </>
  );
}
