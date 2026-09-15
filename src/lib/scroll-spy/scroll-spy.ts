import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';

// lib/scroll-spy — "WHICH SECTION AM I LOOKING AT?", as a React-free store.
// The mechanical half of an in-page navigation: it watches the document
// scroll, decides which of a list of fragment targets the visitor has reached,
// and publishes that id. It renders nothing, names nothing and knows no word
// of any language (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts) — the menu that reads it owns the markup
// and the look.
//
// ── WHY IT EXISTS (owner, price-list pack round, 2026-09-14): "the on hover
// animation for current item … normal scrolling also dictates menu item, but
// menu item click takes you also to navigation item. plz craft carefully so it
// doesn't break when it goes both ways". That reverses the price-list board's
// §4.3 option A — the price band shipped with NO current-item marker precisely
// because marking one needs a browser — so this module is the measurement that
// option A said was missing, and THE PIN below is the "so it doesn't break
// when it goes both ways" half.
//
// ── TERMS, FOR THE READER WHO HAS NOT MET THEM.
//   · A SCROLL EVENT is the browser saying "the page moved". It is not a
//     stream: the engine fires at most one per rendered frame, however fast
//     the wheel spins, and it fires AFTER the move, never before it.
//   · A FRAGMENT JUMP is what `<a href="#endodontics">` does — a same-document
//     navigation that puts `#endodontics` in the URL and scrolls that element
//     into view. No JavaScript is involved; the browser does all of it.
//   · The LANDING LINE is where a jump comes to rest: the y this document's
//     own CSS says a jumped-to target's top edge should sit at. It is computed
//     below from the same two properties the browser itself uses, which is the
//     one design decision that makes both directions agree.
//   · To SETTLE is for the scrolling to stop. A smooth jump glides for a few
//     hundred milliseconds, streaming one scroll event per frame all the way;
//     an instant one sends a single event; a click on an item already at its
//     line sends none at all. "Settled" here means "quiet for settleMs".
//
// ── WHY IT LIVES IN lib/ AND NOT IN THE BAND THAT ASKED FOR IT (the
// two-question home test in lib/cx/cx.ts):
//   1. Does it import React, or exist to construct components? No — it is a
//      listener, an arithmetic walk and a store; the `useSyncExternalStore`
//      that reads it lives in the consumer (sections/PriceList/PriceMenu).
//   2. Does it encode a specific atom's look or API? No — no class string, no
//      message key, no DOM output, nothing about a price.
// Both answers put it in the foundation ring, beside lib/scroll-lock, which is
// the same kind of thing: browser MECHANICS with no React in them (the ring is
// React-free, not browser-free — the cx-to-lib lane, 2026-09-02). The second
// consumer is already foreseeable and is why this is not five lines inside the
// island: a Team-page table of contents, or a long blog post's outline, asks
// exactly this question and must not re-derive the landing arithmetic.
//
// ── CONSTRUCTION IS PURE; start() IS THE FIRST BROWSER TOUCH. `output:
// 'export'` renders every client component in Node during the static build,
// where `window` does not exist, and §16's hydration-safety rule says
// visitor-dependent UI renders a neutral default and decides only after mount.
// So createScrollSpy() validates its options, fills in variables and touches
// no document, no window and no timer (the lib/clock precedent). Its
// construction snapshot is `{ current: null }`, which is therefore also the
// FROZEN server snapshot for the store's whole life (lib/external-store's
// third rule) — the static HTML carries no `aria-current` anywhere, the
// browser's first render agrees with it byte for byte, and the marker appears
// one frame later when start() has looked at the real page.
//
// ── THE LANDING LINE, and why it is not a magic offset. A fragment jump comes
// to rest so that
//     target.getBoundingClientRect().top − scroll-margin-top(target)
//       === scroll-padding-top(<html>)
// — the scroll padding is the strip this site keeps clear at the top of the
// viewport (globals.css: 6rem, the header pill's reach, SC 2.4.11), and the
// target's own scroll margin is the extra air it asks for on top of that. Both
// are read here with getComputedStyle and parseFloat, and anything unreadable
// ('auto', '', a keyword) counts as 0. A target has REACHED ITS LINE when
//     rect.top − margin <= padding + 1
// — "at or above", with one pixel of grace for the sub-pixel arithmetic a
// fractional device-pixel ratio or a zoomed page produces. Reading the very
// two properties the browser consults means a click and the scroll walk can
// never disagree about where "current" begins: there is no second definition
// of the landing line anywhere in this repo, and no consumer-supplied offset
// to keep in sync with a header's height.
//
// ── THE POSITION WALK is a pure function of the document's scroll state: the
// ids, mapped through getElementById (anything missing is skipped — a menu may
// legitimately outlive a card during a hot reload), then
//   · THE BOTTOM RULE first. If the page is scrolled to its very end
//     (`scrollY >= scrollHeight − innerHeight − 1`), the LAST target wins
//     whatever the lines say. Measured in this lane at 1920×1080 on the real
//     price page: the last category card can never reach its own landing line
//     — the document runs out 145px short — so without this rule the final
//     category would be unreachable by scrolling, however far the visitor
//     scrolls. The `maxScrollY > 0` guard is what keeps a page that FITS its
//     viewport (nothing to scroll, so "the end" is also the top) on the top
//     rule below.
//   · otherwise the LAST target in document order that has reached its line —
//     "last", not "first", because every target above the visitor has reached
//     it too and the one nearest the top of the viewport is the one being
//     read.
//   · otherwise the FIRST target: the top fallback. This band begins at the
//     top of its page, so at scrollY 0 the first card is what the visitor is
//     looking at and the menu should say so. NAMED TRIGGER, deliberately not
//     built: a consumer with a long intro ABOVE its first target wants "none
//     yet" there, which is one option (`topFallback: 'first' | 'none'`) the
//     day such a consumer exists — never guessed at now.
//
// ── THE PIN — the click's intent, and the half that makes "both ways" safe.
// Without it the two directions fight: a click jumps, the jump scrolls, the
// scroll walks, and the walk overrules the visitor's own choice one frame
// later — worst of all for a target that can never reach its line (the last
// card, a short category at the end of the page), which would flash current
// and then hand the marker back. So `select(id)` PINS that id as current and
// publishes it immediately. The pin then arms a SETTLE TIMER: every scroll
// event while pinned clears and re-arms it, so the timer fires only once the
// jump's own scrolling has stopped, and the scroll position at that moment is
// remembered. The next scroll event that reports a DIFFERENT position is the
// visitor's own hand — the pin is dropped and the walk takes over again.
// While pinned the walk still runs on every scroll and resize, silently: the
// position is kept up to date so that the moment the pin drops there is an
// answer ready, and publishing the pin over it is what `pinned ?? position`
// below says in one line.
// What that buys, in the visitor's words: click any item — reachable or not —
// and it stays marked until you scroll; scroll by hand and the menu follows
// the cards; open a link someone sent you with `#orthodontics` in it and that
// item is marked from the first frame (start() runs the same hash check, and
// so does every back/forward through the `hashchange` listener).
//
// ── THE VISITOR'S OWN INPUT DROPS THE PIN AT ONCE, and this half is not
// optional. A `scroll` event does not say who caused it: the glide a click
// started and a hand on the wheel arrive through the same listener, looking
// identical. So the pin ALSO watches the events only a PERSON can produce —
// `wheel`, `touchmove`, and the keys that scroll a document (the arrows,
// PageUp/PageDown, Home/End, Space). A programmatic smooth scroll emits none of
// them, so any one of them means the visitor has taken over, and the pin is
// dropped in that same event rather than waiting for the settle.
// MEASURED on the built page, which is why this is not a nicety: at 1536×864,
// clicking the LAST category glides for over two seconds (5 800px of smooth
// scrolling). Without this listener a visitor who changes their mind mid-glide
// re-arms the settle with every turn of their own wheel and keeps watching the
// item they abandoned — for the whole gesture, not for a frame.
// What the settle timer still covers is the input this cannot see: a scrollbar
// DRAG produces neither a wheel nor a key. That is why BOTH halves exist, and
// why neither is redundant.
//
// ── THE PIN VERIFIES ARRIVAL, AT THE SETTLE (G2 react, Fable, 2026-09-15).
// A pin records an INTENT — a click, a `#id` in the URL — and the two halves
// above assume the browser then carries the page to that target. It does not
// always. Measured on the built page, Chromium and WebKit: a RELOAD with
// `#orthodontics` in the URL restores the previous scroll position instead of
// jumping (y = 1681, Endodonție on screen, Ortodonție marked); a
// full-document Back does the same; a WebKit same-document Back RESTORES the
// position where Chromium re-scrolls to the fragment — and WebKit is every
// iPhone in this clinic's waiting room; and a scroll lock — the contact
// modal, the burger panel — engaging mid-glide freezes the page short of the
// target (y = 2153, Endodonție on screen, Ortodonție marked). In every case no
// further scroll event arrives, the settle fires, and the stale mark would
// stand until the visitor's own hand. So the settle — the one moment the
// scrolling has provably stopped — CHECKS the pin against the page: the target
// has ARRIVED when it sits on its landing line (the walk's own pixel of
// grace), or when it is still below that line while the page has reached its
// end — the browser went as far as it could, which is what the unreachable
// last card, a short category at the end and a page that fits its viewport
// all look like. A pin whose target has not arrived is dropped, and the walk
// answers for where the page actually is. A completed glide, a pasted link
// (Chromium glides to the fragment at load; the streaming events re-arm the
// settle, so the check runs after landing) and the reduced-motion teleport
// all pass it; every restored position fails it and is corrected within
// settleMs.
// TWO BOUNDED CASES, ACCEPTED (same review): (a) `wheel`/`touchmove` over a
// scroll-LOCKED document (an open modal, the burger sheet) and the arrows
// inside a nested scroller (the modal's own, the menu's belt) drop a live pin
// although the page cannot move — measured: every such drop landed on the
// walk's answer, i.e. on what is on screen, so the harm is confined to a
// target the walk can never mark. NAMED TRIGGER, not built: ignore those two
// events while the document is locked — which needs lib/scroll-lock to say so
// (an `isLocked()` it does not have; reading the root's inline `overflow`
// here would couple this module to that one's mechanism). (b) Tab-focusing a
// link low in the sticky menu nudges the page by ~38px (the shell's
// `scroll-padding-bottom` keeping the focused link clear of the corner) — a
// scroll event no hand made, which drops a settled pin onto the walk's
// answer. Both are viewport-truthful.
//
// ── EVENTS, six of them, all on window and all removed by dispose(). Three
// ask "where are we now?": `scroll`, `{ passive: true }` (this listener never
// calls preventDefault, and saying so lets the compositor scroll without
// waiting for it); `resize`, which changes every rect and therefore the answer;
// `hashchange`, which is how Back, Forward and any other link to a `#id` on
// this page reach us. Three ask "is a person doing this?" and exist only to
// drop the pin: `wheel` and `touchmove` (both passive, same reason) and
// `keydown`, filtered to the scrolling keys — see THE VISITOR'S OWN INPUT.
// NO requestAnimationFrame THROTTLE, on purpose: the browser already coalesces
// scroll events to at most one per frame, and a walk over a menu-sized list is
// one getComputedStyle for the document plus, per target, one more and one
// getBoundingClientRect — 23 layout reads for eleven categories, all of them
// against a layout the browser has just finished anyway (the event fires after
// the move). A rAF wrapper would buy nothing at that size and cost a frame of
// latency plus a cancel path to get wrong. The per-target style read is not
// hoisted out of the loop on purpose: `scroll-margin-top` is a CSS value like
// any other and may differ at another breakpoint, so reading it once at start()
// would be wrong the moment the window is resized.
//
// ── IT PUBLISHES THROUGH lib/external-store, like the clock and the ring:
// one FLAT snapshot, `sync()` after every change, and the store keeps the old
// object whenever nothing really moved — identity is the signal React's
// useSyncExternalStore compares, and that header explains it once for all four
// stores.
//
// ── WHAT IS DELIBERATELY NOT BUILT (each with the reason, so the absence
// reads as a decision rather than an oversight):
//   · The `scrollend` EVENT, which would replace the settle timer with the
//     platform's own "scrolling has stopped". Every Safari before 26 lacks it
//     — that is every frozen iPhone in this clinic's waiting room — so the
//     timer has to exist anyway, and shipping both means two code paths for
//     one job plus a feature test to keep honest.
//   · SCROLLING THE CURRENT LINK INTO VIEW inside a menu that has its own
//     `overflow-y` belt. Nobody has asked, it moves content under the
//     visitor's pointer, and it needs the menu's element — which this module
//     deliberately does not know about.
//   · A `setIds()` FOR A CHANGING LIST. Page data on this site is static: the
//     categories are compiled into the HTML at build time (§16). A ring's
//     `setCount` exists because a deck can be handed a new list; a table of
//     contents cannot. The day one can, this is where it joins.
//
// ── REDUCED MOTION: nothing here animates, so there is nothing to switch off
// (§9). The gliding a jump does is the shell's own `scroll-behavior: smooth`,
// declared inside a `prefers-reduced-motion: no-preference` block in
// globals.css, so a visitor who asked for less motion simply teleports. The
// PIN is what survives either way: with a glide it holds through a few hundred
// milliseconds of scroll events, with a teleport through the single one.
//
// WHY THE IMPORT ABOVE SAYS `.ts`: the ring's plain-Node promise — see
// lib/clock/clock.ts's "WHY THE IMPORTS ABOVE SAY `.ts`" paragraph, which
// argues it once for every relative value import inside lib/.

/** What the spy knows: the id of the target the visitor is at, or none yet. */
export type ScrollSpySnapshot = Readonly<{ current: string | null }>;

/**
 * The default quiet time that ends a jump, in milliseconds.
 *
 * 150ms sits between the two things it has to tell apart: a smooth jump
 * streams events every ~16ms until it lands, so any gap that long means the
 * glide is over, while a human hand cannot start a new gesture and be measured
 * inside it. It is a courtesy window, not a rhythm — nothing moves while it
 * runs.
 */
export const DEFAULT_SETTLE_MS = 150;

export type ScrollSpyOptions = Readonly<{
  /**
   * Fragment ids of the targets, in DOCUMENT order — i.e. the menu's own
   * order. Non-empty strings, unique; the walk trusts the order and the
   * pin trusts the membership.
   */
  ids: readonly string[];
  /**
   * Quiet time after the last scroll event that ends a jump, in milliseconds.
   * Finite, at least 1 and at most 2_147_483_647 (setTimeout's own ceiling —
   * lib/clock argues that bound in full). @default DEFAULT_SETTLE_MS
   */
  settleMs?: number;
}>;

/**
 * The spy's public surface: React's external-store protocol — exactly the trio
 * useSyncExternalStore takes, so no custom hook is needed and no React enters
 * the ring (lib/external-store) — plus a lifecycle and the click's intent.
 */
export type ScrollSpy = ExternalStore<ScrollSpySnapshot> &
  Readonly<{
    /** First browser touch: attach the listeners, read the page and the URL's
     *  own `#id`. Idempotent while started. */
    start(): void;
    /** Detach everything and forget the pin; re-entrant, and start() works
     *  again afterwards (React re-runs an island's effect — Fast Refresh, a
     *  late client-only mount). */
    dispose(): void;
    /** The click's intent: pin `id` as current until the visitor scrolls after
     *  the jump has settled. An unknown id is ignored, and so is any call
     *  outside the start()…dispose() window — a no-op, never a throw. */
    select(id: string): void;
  }>;

/** setTimeout's ceiling: 2^31 − 1 ms. Above it — as for anything non-finite —
 *  the WebIDL `long` coercion every engine applies silently yields 0 (the
 *  argument in full: lib/clock/clock.ts, MAX_DELAY_MS). */
const MAX_DELAY_MS = 2_147_483_647;

/** A delay this module is willing to arm. `>= 1`, never merely "positive":
 *  0.5 is positive and truncates to the 0 ms timer the bound exists to stop. */
function isUsableDelay(delayMs: number): boolean {
  return Number.isFinite(delayMs) && delayMs >= 1 && delayMs <= MAX_DELAY_MS;
}

/**
 * The keys that scroll a document, and therefore the only keys that mean "the
 * visitor is moving the page themselves". Everything else — Tab, Enter, a
 * modifier, a letter — must leave a pin alone: Enter in particular is how a
 * keyboard visitor ACTIVATES a menu link, i.e. how a pin is born.
 */
const SCROLL_KEYS: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

/** A computed CSS length in pixels; anything unreadable ('auto', '', a
 *  keyword) is 0 — the same answer the browser's own scrolling gives it. */
function cssPixels(value: string): number {
  const pixels = parseFloat(value);
  return Number.isNaN(pixels) ? 0 : pixels;
}

/**
 * Build a spy. Touches nothing until start().
 *
 * @param options the fragment ids in document order, and (optionally) the
 * settle window.
 * @throws when `ids` is empty, holds a blank id or repeats one — each of those
 * is a menu that cannot work, and it has to die at the call site rather than
 * mark the wrong item forever — and when `settleMs` is not a finite number of
 * milliseconds inside setTimeout's own range.
 */
export function createScrollSpy(options: ScrollSpyOptions): ScrollSpy {
  const { ids, settleMs = DEFAULT_SETTLE_MS } = options;

  if (ids.length === 0) {
    throw new RangeError(
      'createScrollSpy: ids must name at least one target (received an empty list). A navigation with nothing to point at has no current item to report.',
    );
  }
  /** Membership for select() and the hash check — built while validating, so
   *  the duplicate scan and the lookup table are the same pass. */
  const known = new Set<string>();
  for (const id of ids) {
    if (id.trim() === '') {
      throw new RangeError(
        'createScrollSpy: every id must be a non-blank fragment id (received an empty one).',
      );
    }
    if (known.has(id)) {
      throw new RangeError(
        `createScrollSpy: ids must be unique (received "${id}" twice). Two elements sharing a fragment id is already a document-level defect — getElementById answers with the first.`,
      );
    }
    known.add(id);
  }
  if (!isUsableDelay(settleMs)) {
    throw new RangeError(
      `createScrollSpy: settleMs must be a finite number of milliseconds, at least 1 and at most ${MAX_DELAY_MS} (received ${String(settleMs)}). Omit it to inherit DEFAULT_SETTLE_MS.`,
    );
  }

  /** The visitor's click, until they scroll again (THE PIN above). */
  let pinned: string | null = null;
  /** What the walk last answered. Null until start() has looked. */
  let position: string | null = null;
  /** Where the page came to rest after a pinned jump; null while it still
   *  moves — which is exactly "the settle has not happened yet". */
  let settledY: number | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  /**
   * THE STORE. Its builder runs once, right here, so the construction snapshot
   * — nothing current — is both the first getSnapshot() and the frozen
   * getServerSnapshot(). The pin outranks the walk in this one expression,
   * which is the whole precedence rule of the module.
   */
  const store = createExternalStore<ScrollSpySnapshot>(() => ({
    current: pinned ?? position,
  }));

  /** Has this target reached its landing line? `padding` is passed in because
   *  it is one read for the whole walk, not one per target. */
  function reachedLandingLine(target: Element, padding: number): boolean {
    const margin = cssPixels(getComputedStyle(target).scrollMarginTop);
    return target.getBoundingClientRect().top - margin <= padding + 1;
  }

  /** THE POSITION WALK (see the header): a pure read of the document. */
  function walk(): string | null {
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return null;

    const root = document.documentElement;
    const maxScrollY = root.scrollHeight - window.innerHeight;
    // THE BOTTOM RULE: the end of the page means the last target, whatever
    // the lines say — the last card is routinely unreachable (header).
    if (maxScrollY > 0 && window.scrollY >= maxScrollY - 1) {
      return targets[targets.length - 1].id;
    }

    const padding = cssPixels(getComputedStyle(root).scrollPaddingTop);
    // The top fallback, overwritten by every target that has reached its line
    // — so what remains is the LAST one that has.
    let current = targets[0].id;
    for (const target of targets) {
      if (reachedLandingLine(target, padding)) current = target.id;
    }
    return current;
  }

  function recompute(): void {
    position = walk();
    store.sync();
  }

  function clearSettle(): void {
    if (settleTimer === undefined) return;
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }

  /**
   * Has the pinned target come to rest where a jump would have put it (THE PIN
   * VERIFIES ARRIVAL, in the header)? On its landing line, with the walk's own
   * pixel of grace — or still below that line while the page has reached its
   * end, i.e. the browser went as far as it could. A target that has left the
   * page has not arrived.
   */
  function arrived(id: string): boolean {
    const target = document.getElementById(id);
    if (target === null) return false;
    const root = document.documentElement;
    const padding = cssPixels(getComputedStyle(root).scrollPaddingTop);
    const margin = cssPixels(getComputedStyle(target).scrollMarginTop);
    const offset = target.getBoundingClientRect().top - margin - padding;
    if (Math.abs(offset) <= 1) return true;
    const maxScrollY = root.scrollHeight - window.innerHeight;
    return offset > 0 && window.scrollY >= maxScrollY - 1;
  }

  /** (Re-)start the quiet window. Called by select() and by every scroll event
   *  that arrives while the jump is still gliding. When it fires the scrolling
   *  has stopped — the one moment the pin can be checked against the page. */
  function armSettle(): void {
    clearSettle();
    settledY = null;
    settleTimer = setTimeout(() => {
      settleTimer = undefined;
      settledY = window.scrollY;
      if (pinned !== null && !arrived(pinned)) {
        unpin();
        recompute();
      }
    }, settleMs);
  }

  function unpin(): void {
    clearSettle();
    pinned = null;
    settledY = null;
  }

  function onScroll(): void {
    if (pinned !== null) {
      if (settledY === null) {
        // Still gliding: this event belongs to the jump, not to the visitor.
        armSettle();
      } else if (window.scrollY !== settledY) {
        // The page has moved since it came to rest — a hand, a wheel, a key.
        unpin();
      }
      // else: a scroll event that moved nothing (a bounce at the end of the
      // page, a programmatic scrollTo to where we already are). Keep the pin.
    }
    recompute();
  }

  /**
   * A gesture only a person can make (see THE VISITOR'S OWN INPUT): drop the
   * pin now, without waiting for the settle to decide whose scrolling this is.
   * It recomputes immediately rather than leaving it to the `scroll` event that
   * follows, because a wheel that is about to be swallowed by the end of the
   * page produces no scroll event at all.
   */
  function onVisitorInput(): void {
    if (pinned === null) return;
    unpin();
    recompute();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!SCROLL_KEYS.has(event.key)) return;
    // …BUT ONLY IF THE KEY REACHED THE PAGE. A keydown bubbles to window from
    // wherever it landed, and some controls CONSUME these keys instead of
    // scrolling with them: Space on a <button> is that button's activation
    // (the header's Contact button, the burger, a dial code), and the arrows
    // belong to a <select> or a text field. Treating those as "the visitor is
    // scrolling" would drop a pin although the page never moved (G2 react,
    // 2026-09-14). A focused <a> is deliberately NOT in this list: a link does
    // not swallow Space, so the page scrolls under it and the pin should go.
    // `dialog` IS: ui/Modal focuses the <dialog> element itself, and the
    // arrows inside it scroll the dialog's own content, never the page
    // (G2 react, Fable, 2026-09-15).
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button,[role="button"],input,select,textarea,[contenteditable],dialog',
      )
    )
      return;
    onVisitorInput();
  }

  function onResize(): void {
    // Every rect changed, so the answer may have; a resize is never a reason
    // to drop the visitor's pin.
    recompute();
  }

  /** The URL's own `#id`, if it names one of ours. Covers Back/Forward, a
   *  pasted link and the load-time hash (start() calls it too). */
  function selectFromHash(): void {
    // Bare `slice(1)`, no decoding: every fragment id in this repo is ASCII
    // English by owner decision (fb-461), so nothing here is ever
    // percent-encoded. A non-ASCII id would need decodeURIComponent and a
    // guard around its throw — a decision for the consumer that brings one.
    const id = window.location.hash.slice(1);
    if (known.has(id)) {
      select(id);
      return;
    }
    // A FRAGMENT THIS MENU DOES NOT OWN is still news: the shell's skip link
    // (#main), a footer anchor, a link into another band. Ignoring it lets a
    // live pin survive a jump away from every target it knows — click a
    // category, then hit the skip link while the first jump is still inside
    // its settle window, and the menu goes on marking that category while the
    // page sits at the top of the document, with no later event to contradict
    // it (G2 react, 2026-09-14). Dropping the pin hands the answer back to the
    // walk, which reads where the page actually is.
    if (pinned === null) return;
    unpin();
    recompute();
  }

  function select(id: string): void {
    // OUTSIDE THE STARTED WINDOW THIS IS A NO-OP, and both halves of that are
    // real (G2 typescript, 2026-09-14, both reproduced under plain Node).
    // After dispose(): re-pinning would publish a current item for a page this
    // store has stopped watching — precisely what dispose()'s own reset exists
    // to prevent — to any subscriber still attached. Before start(), or where
    // there is no browser at all (the ring is loadable by plain Node, and
    // start() takes its `typeof window === 'undefined'` exit there): arming the
    // settle would schedule a callback that reads `window.scrollY` a moment
    // later and throws ReferenceError from a timer nobody can catch. The type
    // permits both calls — clock and rotation take the same runtime-guard route
    // rather than modelling a phantom lifecycle — so the guard is here.
    // selectFromHash() is unaffected: start() sets `started` before calling it.
    if (!started) return;
    if (!known.has(id)) return;
    pinned = id;
    // Arm BEFORE publishing: a subscriber notified of the new current item may
    // synchronously dispose (React runs store listeners during the same task),
    // and a timer armed afterwards would outlive the very call that cleaned it
    // up — the lib/clock precedent, same reason.
    armSettle();
    store.sync();
  }

  function start(): void {
    if (started) return;
    // A no-op where there is no browser: the module stays loadable by plain
    // Node (the ring's promise) even though nothing calls start() there.
    if (typeof window === 'undefined') return;
    started = true;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('wheel', onVisitorInput, { passive: true });
    window.addEventListener('touchmove', onVisitorInput, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    recompute();
    selectFromHash();
  }

  function onHashChange(): void {
    selectFromHash();
  }

  function dispose(): void {
    clearSettle();
    if (started) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('wheel', onVisitorInput);
      window.removeEventListener('touchmove', onVisitorInput);
      window.removeEventListener('keydown', onKeyDown);
      started = false;
    }
    // Back to what a fresh spy answers: a disposed store that still named a
    // current item would be reporting a page it has stopped watching.
    pinned = null;
    position = null;
    settledY = null;
    store.sync();
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    start,
    dispose,
    select,
  };
}
