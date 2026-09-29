import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';

// lib/sticky-rail — "WHICH WAY IS THE PAGE GOING, AND WHERE SHOULD A STICKY
// RAIL PIN?", as a React-free store. The mechanical half of a sticky sidebar
// that is TALLER than the window it sticks in: it watches the document scroll,
// the rail's own size and the window's, decides which of four positions the
// rail should hold, and publishes that decision as a mode plus one number. It
// renders nothing, writes no style, names nothing and knows no word of any
// language (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts) — the island that reads it owns the
// markup, the classes and the attribute it answers with.
//
// ── WHY IT EXISTS (owner, 2026-09-18, measured in Chromium against the built
// export): the Services page's price menu is a sticky card beside the
// category cards, held 8.5rem under the header pill. Eleven categories make
// it 653px tall, Romanian and German alike, so under its 136px offset plus
// 16px of bottom air a window must be at least 805px tall for the whole menu
// to fit — and no laptop is (the table below). The first answer was a HEIGHT
// BELT: `max-h-[calc(100dvh-9.5rem)] overflow-y-auto` on the card, which
// turned it into its own scroll container on every laptop, so the wheel
// scrolled the menu instead of the page and a nested scrollbar sat inside the
// card. The owner: "that should absolutely not be possible". It cannot be
// fixed by shrinking either — 11 × 44px links = 484px is already more than
// the 481px a 1366×768 laptop leaves. Hence this module: direction-aware
// pinning, no belt, and the rail is never a scroll container again.
//
//     window                      innerHeight   usable (−136 −16)   653 fits?
//     1366×768 laptop                     633                 481         no
//     1080p at 125% scaling               737                 585         no
//     1280×800 MacBook                    688                 536         no
//     1440×900 MacBook                    789                 637         no
//     1080p desktop at 100%               945                 793         yes
//
// ── THE FOUR MODES, and what each one asks the consumer to render. The store
// publishes `{ mode, topPx }`; the CSS that makes a mode real lives in the
// consumer's own class list, under the same container-query gate as its base
// sticky, so where the base sticky does not apply neither does anything here.
//   · 'fits'   — the rail is shorter than the usable height (window − offset −
//                bottom air). NOTHING is rendered: no attribute, no style. This
//                is the construction snapshot and therefore the frozen server
//                snapshot (lib/external-store's third rule): the static HTML,
//                the browser's first render and a desktop that fits are all
//                the same bytes (§16's hydration-safety rule). A rail that
//                fits never leaves this mode except through a resize.
//   · 'top'    — the rail wears its OWN static CSS: sticky at its offset (the
//                8.5rem line). The consumer renders the mode as a data
//                attribute and nothing else, so 'top' and 'fits' paint the
//                same pixels; the attribute is there for the two other modes'
//                selectors and for a test to read. It is the mode a tall rail
//                starts in — the CSS sticky is already what the page shows —
//                and the mode the rail returns to when, scrolling UP, its top
//                edge reaches the line again.
//   · 'bottom' — pinned by its BOTTOM edge at `innerHeight − gap`: sticky with
//                a negative `top` = innerHeight − gap − railHeight, published as
//                `topPx`. Reached by scrolling DOWN while the rail travels, the
//                moment its bottom edge arrives at that line.
//   · 'travel' — between the two pins, after a direction reversal: `position:
//                relative` with `top: topPx`, the offset the rail had inside
//                its containing block at the instant of the reversal, FROZEN.
//                Relative positioning scrolls with the page, so the rail moves
//                exactly as the content beside it does and never jumps: from
//                'top', a scroll down lets it ride up until its bottom pins;
//                from 'bottom', a scroll up lets it ride down until its top
//                pins. Its offset is the rail's current viewport top minus the
//                containing block's content-box top — and THAT is the one
//                structural assumption this module makes: the rail is the
//                first in-flow child of its parent, start-aligned, so its
//                normal-flow position IS the parent's content edge plus the
//                rail's own top margin (the price band's grid, `items-start`).
//                A consumer that breaks this reads a wrong offset and sees a
//                jump at the first reversal; the island's test pins the shape.
//
// ── THE TRANSITIONS ARE GEOMETRY, NOT DIRECTION, WHEREVER THEY CAN BE. Only
// the two departures from a pin need the direction of travel — 'top' → 'travel'
// on a scroll DOWN while the sticky is actually holding the rail at its line
// (a rail still sitting in normal flow at the band's start just scrolls with
// the page, and switching it to 'travel' there would flip modes on every
// frame), and 'bottom' → 'travel' on any scroll UP. The two arrivals are pure
// position: 'travel' → 'top' when the rail's top edge is at or below the line,
// 'travel' → 'bottom' when its bottom edge is at or above the bottom line —
// each with one pixel of grace for fractional scroll positions, the
// lib/scroll-spy allowance. Direction is read as the sign of the scroll
// position's change since the last evaluation, so a resize (no scroll) never
// opens a pin.
// What a single LARGE jump does, recorded because it is not a bug: a
// fragment jump under reduced motion, an End key, a restored scroll position
// all arrive as ONE scroll event. From 'top' that one event opens 'travel'
// with the rail still at its line; nothing moves it until the visitor's next
// downward scroll, when it rides up as designed. The rail is never anywhere
// but where the page put it, which is the whole contract.
//
// ── A FOCUSED DESCENDANT MUST BE ON SCREEN — the keyboard half of "every
// link reachable", and it does not come for free. When a link inside a sticky
// rail receives focus the browser scrolls the PAGE to bring it into view, and
// the sticky rail does not move with the page: the link stays exactly as
// hidden as it was. The old belt hid this — Tab scrolled the card's own
// scroller instead. So the rail listens for `focusin` on itself and answers
// in the same task as the focus itself: a target still below the bottom line
// pins 'bottom', one still above the top line pins 'top', and focus on the
// rail element itself (a fragment jump to its own id, the keyboard's) pins
// 'top', so the visitor arrives at its title. Published synchronously — no
// frame wait — and reading the geometry AS IT STANDS, which is what makes the
// order of the browser's own scroll-into-view irrelevant (measured in
// Chromium: the scroll comes first, then the event). A rail in 'travel' rides
// with that scroll, so the browser has already revealed the link and the
// listener leaves it alone; a PINNED rail does not move with the page, the
// link is still hidden when the listener runs, and the pin is what reveals
// it. A pin is independent of the scroll position, and the browser's scroll
// lands on a direction the pin already holds — so it never opens 'travel' a
// frame later.
// ONLY THE KEYBOARD'S FOCUS IS ANSWERED (owner, 2026-09-29, of the defect the
// planner found in the lane's previous round: "fix them for me"). A focus the
// POINTER made needs no reveal — the pointer is already on what it pressed —
// and answering it was a defect, measured on the built page in both engines:
// in Chromium a mouse press on a link focuses the link, so pressing a link
// whose bottom edge sat under the bottom line of a top-pinned rail pinned
// 'bottom' and moved the menu 174px between mousedown and mouseup — the click
// landed on the <nav>, and nothing navigated; in WebKit a press does not
// focus the link at all but its nearest focusable ancestor, the
// `<nav tabindex="-1">` — the rail itself — so ANY press inside a
// bottom-pinned or travelling menu pinned 'top' under the pointer. Both
// engines already know who made a focus at the moment of `focusin`:
// `:focus-visible` is false for those two mouse-made focuses and true for
// every Tab (the planner's focus probe, 2026-09-29). So the listener asks the
// focused element that before anything else — a descendant and the rail
// itself alike — and an engine too old for the selector (Safari before 15.4),
// which throws on it, answers every focus as it did before this rule. One
// consequence, stated rather than discovered: a fragment jump to the rail's
// own id that the keyboard did not make — a mouse click on a link to it — no
// longer pins 'top' on focus; the jump's own scrolling carries the rail to its
// top line through the ordinary transitions.
//
// ── EVENTS, four sources, one evaluation per frame. `scroll` on window,
// `{ passive: true }` (this listener never calls preventDefault, and saying so
// lets the compositor scroll without waiting for it); `resize` on window (the
// bottom line and the fit both move with innerHeight); a ResizeObserver on the
// rail (fonts arriving, a zoom, content changing its height); and `focusin`
// on the rail, the one that runs immediately — and answers only a focus the
// keyboard made (A FOCUSED DESCENDANT MUST BE ON SCREEN). The first three are
// COALESCED through requestAnimationFrame: each schedules at most one frame
// callback, and the callback reads the geometry once. A rAF requested from a
// scroll handler runs in that same frame before paint, so this costs no
// latency; what it buys is one evaluation for any number of events, and a
// place where the direction is measured once per frame rather than once per
// event. The store then keeps the old snapshot whenever nothing changed
// (lib/external-store): state moves only at a transition, so React re-renders
// a handful of times per direction reversal and never per scroll event. In
// 'fits' the scroll listener does not even schedule — the only way out of
// 'fits' is a size change.
//
// ── CONSTRUCTION IS PURE; start() IS THE FIRST BROWSER TOUCH. `output:
// 'export'` renders every client component in Node, where `window` does not
// exist (the lib/scroll-spy and lib/clock precedent). createStickyRail()
// validates its options and touches nothing; start() looks the rail up by id,
// attaches the listeners and evaluates once; dispose() detaches everything,
// cancels a pending frame and publishes 'fits' again, and is re-entrant —
// React re-runs an island's effect on Fast Refresh, and the price band keys
// its island by the id list, which remounts the rail element under the same
// id.
//
// ── THE STATIC OFFSET IS READ, NEVER PASSED. The 8.5rem line is already the
// FIFTH coupled spelling of the header pill's reach (sections/Header.tsx's
// "THE MOUNT CONTRACT", sections/PriceList's `@3xl:top-34` paragraph); an
// option carrying it would be the sixth. So the rail reads its own computed
// `top` — which is the static value exactly while no override is in effect,
// i.e. in 'fits' and 'top' — and keeps that reading through 'bottom' and
// 'travel', where the override hides it. The one case the cache lags is a
// zoom change mid-travel: the arrival at 'top' is then judged against the
// pre-zoom line, the CSS pins at the real one, and the rail snaps by the
// difference once. Accepted; the next 'top' refreshes it. Likewise the fit
// test reads `position`: 'sticky' means the consumer's CSS is acting, and
// anything else — the container step not reached, a phone's stacked layout —
// means the rail stands down to 'fits' and renders nothing at all.
//
// ── REDUCED MOTION: nothing here animates, so there is nothing to switch off
// (§9). A mode change repositions the rail in one style recalculation, the
// same way the CSS sticky itself repositions on every frame; there is no
// transition to honour a preference on.
//
// ── WHAT IS DELIBERATELY NOT BUILT, each a WAIT trigger with its reason:
//   · MERGING THIS MODULE'S LISTENERS WITH lib/scroll-spy's into one loop. The
//     price menu's island runs both stores, so two scroll listeners and two
//     geometry reads exist per frame. They measure different things (the
//     cards against the spy's line — its reading line since round 5,
//     2026-09-29, their landing lines before — vs the rail's own edges) and
//     they are cheap; a shared "one scroll, many readers" loop is §4's
//     sharing-table row 1 and earns its file when a SECOND consumer of both
//     stores appears — never a drive-by here.
//   · TAB VISIBILITY. A hidden tab neither scrolls nor resizes, so the rail
//     already does nothing there; lib/clock's `lib/page-visibility` trigger
//     is the one place that seam will be promoted from, at its second
//     consumer, and this module would join then if it ever needed one.
//   · A `setId()` FOR A CHANGING RAIL. The band remounts the island — and with
//     it the rail element — under the same id when its list changes, so a
//     new rail arrives as a fresh start(), not as a mutation.
//
// WHY THE IMPORT ABOVE SAYS `.ts`: the ring's plain-Node promise — see
// lib/clock/clock.ts's "WHY THE IMPORTS ABOVE SAY `.ts`" paragraph, which
// argues it once for every relative value import inside lib/.

/** Where the rail is held — see THE FOUR MODES in the header. */
export type StickyRailMode = 'fits' | 'top' | 'bottom' | 'travel';

/**
 * What the rail knows: the mode, and the one number two of the modes need —
 * the `top` to render, in CSS pixels (negative for 'bottom', the frozen
 * in-flow offset for 'travel', 0 and unused for the other two).
 */
export type StickyRailSnapshot = Readonly<{
  mode: StickyRailMode;
  topPx: number;
}>;

export type StickyRailOptions = Readonly<{
  /** The rail element's `id`, looked up at start() — the lib/scroll-spy
   *  idiom, which is what keeps construction free of the DOM. Non-blank. */
  id: string;
  /**
   * The air kept under the bottom pin, in CSS pixels: finite, at least 0.
   * Left out, it is ONE ROOT EM read live at every evaluation, so a visitor's
   * zoom scales it with everything else (§7's rem rule, in a module that
   * cannot write rem).
   */
  gapPx?: number;
}>;

/**
 * The rail's public surface: React's external-store protocol — exactly the
 * trio useSyncExternalStore takes (lib/external-store) — plus the lifecycle.
 */
export type StickyRail = ExternalStore<StickyRailSnapshot> &
  Readonly<{
    /** First browser touch: find the rail by id, attach the listeners,
     *  evaluate once. Idempotent while started; a no-op without a browser or
     *  without the element. */
    start(): void;
    /** Detach everything, cancel a pending frame, publish 'fits' again.
     *  Re-entrant, and start() works again afterwards. */
    dispose(): void;
  }>;

/** The neutral answer — the construction snapshot, the server snapshot, and
 *  what dispose() returns to. */
const FITS: StickyRailSnapshot = { mode: 'fits', topPx: 0 };

/** One pixel of grace on every edge comparison — fractional scroll positions
 *  and device-pixel ratios put an edge a hair past its line (the
 *  lib/scroll-spy allowance). */
const GRACE_PX = 1;

/** A computed CSS length in pixels; anything unreadable ('auto', '') is 0. */
function cssPixels(value: string): number {
  const pixels = parseFloat(value);
  return Number.isNaN(pixels) ? 0 : pixels;
}

/**
 * Did the KEYBOARD make this focus? (ONLY THE KEYBOARD'S FOCUS IS ANSWERED, in
 * the header.) `:focus-visible` is the engine's own answer, known at the
 * moment of `focusin`: false for a focus a mouse press made — the link in
 * Chromium, the rail itself in WebKit — and true for every Tab.
 */
function keyboardMade(target: Element): boolean {
  try {
    return target.matches(':focus-visible');
  } catch {
    // An engine too old for the selector throws on it (Safari before 15.4).
    // There the rail answers every focus, as it did before this rule.
    return true;
  }
}

/**
 * Build a rail. Touches nothing until start().
 *
 * @param options the rail element's id and, optionally, the bottom air.
 * @throws when `id` is blank — a rail with nothing to find would silently
 * never act — or when `gapPx` is not a finite, non-negative number.
 */
export function createStickyRail(options: StickyRailOptions): StickyRail {
  const { id, gapPx } = options;

  if (id.trim() === '') {
    throw new RangeError(
      'createStickyRail: id must be a non-blank element id (received an empty one). A rail that cannot be found would never act, silently.',
    );
  }
  if (gapPx !== undefined && !(Number.isFinite(gapPx) && gapPx >= 0)) {
    throw new RangeError(
      `createStickyRail: gapPx must be a finite number of pixels, at least 0 (received ${String(gapPx)}). Omit it to keep one root em of air under the bottom pin.`,
    );
  }

  let mode: StickyRailMode = 'fits';
  let topPx = 0;
  /** The static `top` the consumer's CSS gives the rail, cached while it can
   *  be read (THE STATIC OFFSET IS READ, NEVER PASSED). */
  let linePx = 0;
  let lastScrollY = 0;
  let rail: HTMLElement | undefined;
  let observer: ResizeObserver | undefined;
  let frame: number | undefined;
  let started = false;

  /** THE STORE: built once, here — so `FITS` is both the first snapshot and
   *  the frozen server snapshot; sync() republishes only on a real change. */
  const store = createExternalStore<StickyRailSnapshot>(() =>
    mode === 'fits' ? FITS : { mode, topPx },
  );

  function publish(nextMode: StickyRailMode, nextTop: number): void {
    mode = nextMode;
    topPx = nextTop;
    store.sync();
  }

  /** The air under the bottom pin: the option, or one root em read now. */
  function gap(): number {
    return (
      gapPx ?? cssPixels(getComputedStyle(document.documentElement).fontSize)
    );
  }

  /**
   * The rail's normal-flow top in viewport coordinates — its containing
   * block's content edge plus its own top margin (the structural assumption
   * in THE FOUR MODES, 'travel'). Read only at a reversal, never per frame.
   */
  function flowTop(element: HTMLElement): number {
    const parent = element.parentElement;
    if (parent === null) return element.getBoundingClientRect().top;
    const box = getComputedStyle(parent);
    return (
      parent.getBoundingClientRect().top +
      cssPixels(box.borderTopWidth) +
      cssPixels(box.paddingTop) +
      cssPixels(getComputedStyle(element).marginTop)
    );
  }

  /** The one read of the geometry per frame, and the whole state machine. */
  function evaluate(): void {
    if (rail === undefined) return;
    const element = rail;
    const style = getComputedStyle(element);
    // Is the consumer's sticky acting at all? In 'travel' the consumer has
    // switched the rail to `relative` on this module's word, so that reading
    // means "yes" there; anything else means the container step is not
    // reached (a stacked phone layout) and the rail stands down.
    const acting =
      style.position === 'sticky' ||
      (mode === 'travel' && style.position === 'relative');
    if (!acting) {
      publish('fits', 0);
      return;
    }
    // The static offset is readable exactly while nothing overrides `top`.
    if (mode === 'fits' || mode === 'top') linePx = cssPixels(style.top);

    const rect = element.getBoundingClientRect();
    const height = rect.height;
    const viewport = window.innerHeight;
    const air = gap();
    const floor = viewport - air;
    const y = window.scrollY;
    const delta = y - lastScrollY;
    lastScrollY = y;

    if (linePx + height + air <= viewport) {
      publish('fits', 0);
      return;
    }

    switch (mode) {
      case 'fits':
        // Became tall on a size change: the static sticky is what the page
        // already shows, so that is the mode.
        publish('top', 0);
        return;
      case 'top':
        // Leave the top pin only on a scroll DOWN while the sticky is really
        // holding the rail at (or, near the containing block's end, above)
        // its line — a rail still in normal flow just scrolls with the page.
        if (delta > 0 && rect.top <= linePx + GRACE_PX) {
          publish('travel', rect.top - flowTop(element));
        }
        return;
      case 'bottom':
        if (delta < 0) {
          publish('travel', rect.top - flowTop(element));
          return;
        }
        // Still pinned: the pin follows the window and the rail's own
        // height, so a resize re-pins at the new bottom line.
        publish('bottom', floor - height);
        return;
      case 'travel':
        if (rect.top >= linePx - GRACE_PX) {
          publish('top', 0);
        } else if (rect.bottom <= floor + GRACE_PX) {
          publish('bottom', floor - height);
        }
        return;
    }
  }

  /** One frame callback for any number of events (EVENTS, in the header). */
  function schedule(): void {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      evaluate();
    });
  }

  function cancelFrame(): void {
    if (frame === undefined) return;
    cancelAnimationFrame(frame);
    frame = undefined;
  }

  function onScroll(): void {
    // 'fits' leaves only through a size change; scrolling cannot end it.
    if (mode === 'fits') return;
    schedule();
  }

  /**
   * A FOCUSED DESCENDANT MUST BE ON SCREEN (header): pin whichever edge
   * reveals the target, now, before the browser's own scroll-into-view reads
   * the layout — but only for a focus the KEYBOARD made, asked before anything
   * else: a pointer is already on what it pressed, and a rail that moved under
   * it swallowed the click. In 'fits' the CSS sticky already shows the whole
   * rail.
   */
  function onFocusIn(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || !keyboardMade(target)) return;
    if (rail === undefined || mode === 'fits') return;
    if (target === rail) {
      publish('top', 0);
      return;
    }
    const focused = target.getBoundingClientRect();
    const floor = window.innerHeight - gap();
    if (focused.bottom > floor + GRACE_PX) {
      publish('bottom', floor - rail.getBoundingClientRect().height);
    } else if (focused.top < linePx - GRACE_PX) {
      publish('top', 0);
    }
  }

  function start(): void {
    if (started) return;
    // A no-op where there is no browser: the module stays loadable by plain
    // Node (the ring's promise) even though nothing calls start() there.
    if (typeof window === 'undefined') return;
    const element = document.getElementById(id);
    if (element === null) return;
    started = true;
    rail = element;
    lastScrollY = window.scrollY;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    element.addEventListener('focusin', onFocusIn);
    observer = new ResizeObserver(schedule);
    observer.observe(element);

    evaluate();
  }

  function dispose(): void {
    cancelFrame();
    if (started && rail !== undefined) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
      rail.removeEventListener('focusin', onFocusIn);
      observer?.disconnect();
      observer = undefined;
      started = false;
    }
    rail = undefined;
    // Back to what a fresh rail answers: a disposed store that still asked
    // for a pin would be positioning an element it has stopped watching.
    publish('fits', 0);
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    start,
    dispose,
  };
}
