import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';
import {
  prefersReducedMotion,
  watchReducedMotion,
} from '../reduced-motion/reduced-motion.ts';

// lib/clock — THE auto-advance beat: a timer plus the MANNERS a moving widget
// owes its visitor. React-free (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts), no 'use client', no DOM output, no class
// strings, no words — it decides WHEN something should change and calls back.
// Board: .claude/plans/rotation-lib.plan.md (owner `approve` fb-421, Q9
// delegated fb-424), consolidated in its FINAL CONTRACT section and amended by
// the G2 round (G2-2, G2-4, G2-6, G2-7 in the board's G2 AMENDMENTS table).
//
// ── WHY THIS EXISTS (the drift proof). The old repo wrote this clock twice by
// hand — once in the hero photo frame, once in the reviews deck — and the two
// copies diverged on exactly the accessibility-critical rows: the deck paused
// on hover and read prefers-reduced-motion, the hero did neither, and NEITHER
// shipped the pause/play control WCAG 2.2 SC 2.2.2 requires of anything that
// moves for more than five seconds. Written once, tested once, both future
// rotators inherit the manners instead of re-deriving them.
//
// ── THE DUTY LINE (board Q8.6). This module owns time, the status, and the
// reactions to the environment. It owns nothing you can see: the markup
// (region, slides, aria-current, aria-live), the words (every label comes from
// the message files through the consumer — §8.1: no string ever lives in shared
// code), the LOOK of the move (crossfade, transform, scroll-snap, and the
// `motion-reduce:` CSS half of the preference) and the NUMBERS (each band's
// dossier owns its rhythm) all stay with the consumer. `intervalMs` is
// therefore REQUIRED with no default here: the two old clocks ran 5500 and 6000
// ms, and a shared default would be a site-wide decision smuggled into the ring
// (§8.1's "no defaults in the shared thing"). Two consumers that genuinely want
// the same number are an fb-44 KEEP-IN-SYNC pair between themselves.
//
// ── MILLISECONDS, ALWAYS, `Ms`-SUFFIXED (owner fb-418). Every timer API this
// module calls takes milliseconds and the repo already writes its clocks that
// way (SpeedDial's HOVER_OPEN_DELAY_MS = 150, the --fade token's 400ms).
// Seconds would buy `5.5` over `5_500` at the cost of a conversion inside the
// ring and a second convention beside the first; the numeric separator is the
// readability device. Both numbers must be AT LEAST 1 ms or construction
// THROWS (G2-4; the guard is isUsableDelay below — "at least 1 ms", never
// merely "positive": 0.5 is positive and WebIDL truncates it to the very 0 ms
// chain the rule exists to prevent; org-review F13, 2026-09-09).
// The old repo's "intervalMs: 0 means disabled" convention would become a 0 ms
// chain here — a flashing widget (SC 2.3.1) with a pinned CPU — so the
// convention has to die loudly, at the call site, not quietly at runtime. Use
// setEnabled(false), or lib/rotation's two-item floor, to mean "do not run".
//
// ── WHY THE IMPORTS ABOVE SAY `.ts` (G2-7). The ring's promise is that plain
// Node can load it — `npm run build` ends with `node tools/generate-404.ts`,
// which imports src modules directly under Node's native type stripping. Node
// resolves ES module specifiers literally: an extension-less relative import is
// simply not found, whatever a bundler would have done with it. So every
// relative VALUE import inside lib/ names the file
// (`../reduced-motion/reduced-motion.ts`), exactly as tools/generate-404.ts
// already does; `allowImportingTsExtensions` is on in tsconfig for this. A
// type-only import is exempt because it is erased before Node ever sees the
// module — lib/hours and lib/routes each carry one (org-review F14,
// 2026-09-09). Probe:
//   node --input-type=module -e "import('<abs>/src/lib/rotation/rotation.ts')"
//
// ── A TIMEOUT CHAIN, NEVER setInterval. Each tick schedules the next one. That
// is what makes four different delays ONE code path — the first dwell after
// start(), a full interval after the visitor navigates (restart()), a full
// interval after a hover ends (resume()), and a full interval when a
// backgrounded tab comes back — instead of three special cases bolted onto a
// fixed-period interval. It also means a throttled background tab can never
// deliver the burst of queued callbacks setInterval is famous for: there is
// only ever one pending timeout, and while the tab is hidden there is none.
//
// ── A FACTORY OF CLOSURES, NOT A CLASS (board Q8.5; the ARGUMENT repaired by
// org-review F8, 2026-09-09). Consumers hand these methods around detached —
// `onClick={rotation.pause}`, `useSyncExternalStore(clock.subscribe,
// clock.getSnapshot, …)` — and the version of this note that stood here
// refuted only the NAIVE class: written with arrow-function FIELDS (`pause =
// () => …`) a class's methods are per-instance, keep their `this` when handed
// around detached and are identity-stable, and a `#private` field is private at
// runtime, not merely erased at build time. The honest reasons are these:
//
//   · No `class` exists anywhere in src/. One here would be the repo's first —
//     a new idiom every future reader has to be taught, for this alone.
//   · The ring's own precedent is a closure: lockScroll() returns one holding
//     the saved overflow value (lib/scroll-lock).
//   · It is the React world's grain for this exact job — the vanilla stores of
//     Zustand, Redux and Jotai are closure factories; class stores are the
//     Angular/MobX idiom.
//   · The object literal at the end of the factory IS the whole public surface,
//     in one place: what a reader must audit is a dozen lines, not a body with
//     a modifier on every member.
//   · Nothing will ever subclass a clock, so `instanceof` is all a class would
//     actually add.
//   · The returned functions' identities are stable forever, which is what
//     React's store hook compares (`subscribe` above all).
//
// ── CONSTRUCTION IS PURE, START IS THE FIRST BROWSER TOUCH. Next.js renders
// client components on the server during the static export, so a store may be
// built where `window` does not exist; §16's hydration-safety rule says
// visitor-dependent decisions happen after mount. createClock() therefore
// touches no timer, no media query and no document — it only validates its
// numbers and fills in variables. start()/play() read the environment and
// install the watchers; dispose() removes them.
//
// ── THE STATE MACHINE (board Q3, WAI-ARIA APG carousel semantics):
//
//   idle + reason  not started / structurally disabled (a list too short to
//                  rotate) / reduced motion declined the automatic start
//   running        a tick is pending
//   suspended      TRANSIENT pause: the pointer is over the widget, or focus
//                  is inside it. resume() undoes it
//   stopped        STICKY pause: the visitor pressed the rotation control, or
//                  keyboard focus entered the widget (the APG rule the
//                  consumer applies — see rotation.ts, FOCUS). Only play()
//                  undoes it — never resume(), never start(), so a hover can
//                  not restart what the visitor stopped and the choice
//                  outlives an effect re-run (cleanup → start() on the SAME
//                  store: Fast Refresh, a late client-only mount — a true
//                  remount builds a new store)
//
// ── SUSPENSION IS CAUSE-KEYED (G2-2, a11y HIGH). suspend()/resume() carry a
// cause — 'pointer' or 'focus' — and the clock holds a SET of live causes,
// resuming only when the set empties. One collapsed flag let a pointer leaving
// the widget resume motion while keyboard focus was still inside it, which is
// the APG's reason for keeping hover and focus as separate flags. A set of
// named causes rather than a counter, because browsers deliver unbalanced
// enter/leave pairs (a pointer that leaves through a disappearing element, a
// focusout with no focusin) and an unbalanced counter never returns to zero:
// suspending twice for the same cause is idempotent by construction. play()
// CLEARS the set and runs — an explicit request outranks the courtesy (and the
// rotation control sits outside the hover wrapper, so a real pointer enter
// follows if the visitor moves back in).
//
// ── ENV REACTIONS while running/suspended (board Q9c/Q9d — both were v1
// omissions with named triggers until the owner's fb-424 rider said build them
// now). The two halves are deliberately housed differently: the preference is
// lib/reduced-motion (its own folder, its own suite), while the TAB-VISIBILITY
// pair below — documentIsHidden + watchDocumentVisibility — stays PRIVATE to
// this module (board Q9d: timer hygiene, not a reusable seam). NAMED TRIGGER
// for promoting it to a `lib/page-visibility` folder shaped exactly like
// lib/reduced-motion: the first module OTHER THAN this clock that needs to ask
// whether the tab is hidden (org-review F2b, 2026-09-09 — recorded debt, not a
// to-do; until then one consumer means one home):
//
//   reduce turns ON   → idle(reduced-motion), timer cleared, and a `user`
//                       intent is demoted to `auto`: the flip is the NEWER
//                       statement, so an earlier play() must not outlive it
//                       (G2-6). The visitor may press play again
//   reduce turns OFF  → nothing. Never auto-resume: the absence of a
//                       preference is not a request to move
//   tab hidden        → timer cleared, status UNCHANGED. Being in a background
//                       tab is not a pause; nobody is watching, so nothing
//                       should be spent, and the widget must not come back
//                       mid-transition or with a burst of catch-up ticks
//   tab visible       → the delay that was pending when the tab went away is
//                       armed again, in full: the first dwell survives a tab
//                       switch (G2-6), and every later return is a whole
//                       interval, because the visitor is seeing this slide for
//                       the first time either way
//
// ── DELIBERATELY NOT HERE: anything with a shape. No index (that is
// lib/rotation, which owns the ring and calls this for its beat), no DOM, no
// CSS class (board Q8.7 — a class string is paint, and paint belongs beside the
// element it paints; a shared LOOK would go to a `ui/` flat module like
// ui/disc.ts, never to lib), no message key.

/** What the beat is doing. `running` is the only status that ticks. */
export type ClockStatus = 'idle' | 'running' | 'suspended' | 'stopped';

/** Why an idle clock is idle — set only while `status === 'idle'`. */
export type ClockIdleReason = 'not-started' | 'disabled' | 'reduced-motion';

/**
 * Why a clock is transiently suspended. The two APG flags, kept apart: the
 * pointer being over the widget, and focus being inside it.
 */
export type SuspendCause = 'pointer' | 'focus';

/** An immutable read of the clock at one instant. */
export type ClockSnapshot = Readonly<{
  status: ClockStatus;
  idleReason: ClockIdleReason | null;
}>;

/**
 * THE ENV SEAM — the module's only two browser dependencies, injectable.
 *
 * Left alone these read the real `prefers-reduced-motion` query (via
 * lib/reduced-motion) and the real `document.visibilityState`. A test passes
 * plain functions instead, because neither the OS preference nor the tab's
 * visibility is state a test may own: a suite that flipped them would pass on
 * one workstation and fail on another. Injection is also what keeps
 * construction pure — nothing here is CALLED before start().
 */
export type ClockEnv = Readonly<{
  prefersReducedMotion?: () => boolean;
  watchReducedMotion?: (listener: (reduced: boolean) => void) => () => void;
  isHidden?: () => boolean;
  watchVisibility?: (listener: (hidden: boolean) => void) => () => void;
}>;

export type ClockOptions = Readonly<{
  /** The rhythm, in milliseconds. Required, and at least 1 ms. */
  intervalMs: number;
  /**
   * The FIRST tick after start(), in milliseconds; defaults to `intervalMs`,
   * and at least 1 ms.
   *
   * The first interval is the one every visitor lives through while reading the
   * headline or the first card, and this site's audience skews older (§9), so a
   * longer opening dwell is a standard courtesy — LENGTHENING it is what this
   * option is for. It applies to the AUTOMATIC start only: play(), resume() and
   * a re-enable all arm a full interval, because by then the visitor has
   * already seen the widget (board Q7).
   *
   * It is NOT an anti-sync device: staggering two clocks at load survives
   * exactly until the first hover or dot press re-phases one of them.
   */
  startDelayMs?: number;
  /** What a tick DOES. The clock never knows and never asks. */
  onTick: () => void;
  /**
   * `internal` (default) arms its own timeout chain. `external` arms nothing
   * and waits for someone else's tick() — that someone is lib/rotation-group,
   * the one beat a set of widgets may deliberately share (board Q9a/Q9b).
   */
  driver?: 'internal' | 'external';
  /** Fakes for the two browser touches; defaults are the real browser. */
  env?: ClockEnv;
}>;

/**
 * The beat's public surface: React's external-store protocol — the trio
 * useSyncExternalStore takes, no custom hook needed and no React in here (see
 * lib/external-store) — plus the manners.
 */
export type Clock = ExternalStore<ClockSnapshot> &
  Readonly<{
    /** The mount-time automatic start: honours reduced motion and the gate. */
    start(): void;
    /** The visitor pressed play: runs even under reduced motion. */
    play(): void;
    /** The visitor pressed pause, or keyboard focus arrived: sticky. */
    pause(): void;
    /** Pointer over / focus within: transient, and keyed by its cause. */
    suspend(cause?: SuspendCause): void;
    /** That cause is gone: back to running once no cause remains. */
    resume(cause?: SuspendCause): void;
    /** The visitor navigated by hand: push the next tick a full interval away. */
    restart(): void;
    /** THE one advance path — the timer calls it, or an external driver does. */
    tick(): void;
    /** The structural gate: false while there is nothing worth rotating. */
    setEnabled(enabled: boolean): void;
    /**
     * Effect cleanup. Re-entrant with start() — React re-runs an island's
     * effect (Fast Refresh, late client-only mounts).
     */
    dispose(): void;
  }>;

/**
 * The largest delay setTimeout keeps: 2^31 − 1 ms (~24.9 days). Anything above
 * it — like anything non-finite — is converted to 0 by the WebIDL `long`
 * coercion every engine applies, which turns a mistyped interval into an
 * unthrottled loop.
 */
const MAX_DELAY_MS = 2_147_483_647;

/** A delay this module is willing to arm. */
function isUsableDelay(delayMs: number): boolean {
  // `>= 1`, not `> 0`: WebIDL truncates the delay to an integer, so 0.5 would
  // arm the same 0 ms chain the ceiling exists to prevent.
  return Number.isFinite(delayMs) && delayMs >= 1 && delayMs <= MAX_DELAY_MS;
}

/** The default `isHidden`: SSR-safe, so a server render answers "visible". */
function documentIsHidden(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'hidden';
}

/** The default `watchVisibility`, over the document's own event. */
function watchDocumentVisibility(
  listener: (hidden: boolean) => void,
): () => void {
  if (typeof document === 'undefined') return () => {};
  const onChange = (): void => listener(document.visibilityState === 'hidden');
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * Build a beat. Touches nothing until start() or play().
 *
 * @param options the rhythm, what a tick does, and (optionally) the first
 * dwell, the driver and the environment seam.
 * @throws when `intervalMs` or `startDelayMs` is not a finite number of at
 * least 1 ms and at most MAX_DELAY_MS — a 0 ms chain is a flashing widget, and
 * "0 means disabled" is not this API (G2-4).
 */
export function createClock(options: ClockOptions): Clock {
  const {
    intervalMs,
    startDelayMs = intervalMs,
    onTick,
    driver = 'internal',
    env = {},
  } = options;

  // Finite, at least 1 ms, and inside the range setTimeout can actually hold.
  // Both ends of that sentence are the same defect: WebIDL converts a delay to
  // a 32-bit long, so Infinity, NaN, 0.5 and anything above MAX_DELAY_MS all
  // arrive as 0 — a 0 ms chain, i.e. a flashing widget on a pinned CPU. It has
  // to die at the call site, loudly, instead of quietly at runtime.
  if (!isUsableDelay(intervalMs)) {
    throw new RangeError(
      `createClock: intervalMs must be a finite number of milliseconds, at least 1 and at most ${MAX_DELAY_MS} (received ${String(intervalMs)}). To keep a clock from running, use setEnabled(false).`,
    );
  }
  if (!isUsableDelay(startDelayMs)) {
    throw new RangeError(
      `createClock: startDelayMs must be a finite number of milliseconds, at least 1 and at most ${MAX_DELAY_MS} (received ${String(startDelayMs)}). Omit it to inherit intervalMs.`,
    );
  }

  // The seam, resolved once but never CALLED here (construction stays pure).
  const readsReducedMotion = env.prefersReducedMotion ?? prefersReducedMotion;
  const watchesReducedMotion = env.watchReducedMotion ?? watchReducedMotion;
  const readsHidden = env.isHidden ?? documentIsHidden;
  const watchesVisibility = env.watchVisibility ?? watchDocumentVisibility;

  let status: ClockStatus = 'idle';
  let idleReason: ClockIdleReason | null = 'not-started';

  /**
   * THE STORE. Its builder runs once, right here, so the construction snapshot
   * — idle/not-started — is both the first getSnapshot() and the frozen
   * getServerSnapshot(). Every `store.sync()` below rebuilds it and publishes
   * ONLY when a field actually changed: identity is the signal React reads, and
   * lib/external-store's header explains why, once for the three stores in this
   * ring that publish through it.
   */
  const store = createExternalStore<ClockSnapshot>(() => ({
    status,
    idleReason,
  }));

  /** The structural gate (lib/rotation drives it from `count >= 2`). */
  let enabled = true;
  /**
   * Who asked for this clock to run, if anyone: `auto` is start()'s mount-time
   * request, which reduced motion may decline; `user` is play(), which it may
   * not. It is what lets setEnabled(true) resume the RIGHT way after a list
   * grows, and what stops a disposed clock from arming itself behind React's
   * back. A flip TO reduce demotes `user` back to `auto`.
   */
  let intent: 'none' | 'auto' | 'user' = 'none';
  /** The live transient causes; empty means nothing is holding the clock. */
  const suspensions = new Set<SuspendCause>();
  let reduced = false;
  let hidden = false;
  /** Set by an external restart()/resume(): the next beat is the courtesy one. */
  let skipNextTick = false;
  /**
   * The delay the pending tick was armed with. A tab that goes away and comes
   * back re-arms THIS, so the first dwell is not silently shortened to a plain
   * interval by a tab switch (G2-6).
   */
  let pendingDelayMs = intervalMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unwatchReducedMotion: (() => void) | undefined;
  let unwatchVisibility: (() => void) | undefined;

  function disarm(): void {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  /**
   * One link of the chain. Never armed for an external driver or a hidden tab —
   * but the delay is REMEMBERED either way, so the tab coming back arms what
   * was owed.
   */
  function arm(delayMs: number): void {
    disarm();
    pendingDelayMs = delayMs;
    if (driver === 'external') return;
    if (hidden) return;
    timer = setTimeout(() => {
      timer = undefined;
      tick();
    }, delayMs);
  }

  function tick(): void {
    if (status !== 'running') return;
    if (skipNextTick) {
      skipNextTick = false;
      return;
    }
    try {
      onTick();
    } finally {
      // Re-arm AFTER the callback and only if it left us running: a consumer is
      // free to pause() or navigate from inside onTick. In a `finally`, because
      // a consumer callback that THROWS must not leave a clock that says
      // 'running' with no timer behind it — the one state nothing can recover
      // from without a dispose()/start() cycle.
      if (driver === 'internal' && status === 'running') arm(intervalMs);
    }
  }

  function watch(): void {
    unwatchReducedMotion ??= watchesReducedMotion(onReducedMotionChange);
    unwatchVisibility ??= watchesVisibility(onVisibilityChange);
  }

  function unwatch(): void {
    unwatchReducedMotion?.();
    unwatchReducedMotion = undefined;
    unwatchVisibility?.();
    unwatchVisibility = undefined;
  }

  function onReducedMotionChange(nextReduced: boolean): void {
    reduced = nextReduced;
    if (!reduced) return; // flipping back is not a request to move
    // The flip is the newer statement: an earlier play() no longer speaks for
    // this visitor, so a later re-enable must not silently start moving again.
    if (intent === 'user') intent = 'auto';
    if (status !== 'running' && status !== 'suspended') return;
    toIdle('reduced-motion');
  }

  function onVisibilityChange(nextHidden: boolean): void {
    if (nextHidden === hidden) return;
    hidden = nextHidden;
    if (hidden) {
      disarm(); // status unchanged: a background tab is not a pause
      return;
    }
    if (status !== 'running') return;
    arm(pendingDelayMs); // welcome back — a full look at this slide
  }

  function toIdle(reason: ClockIdleReason): void {
    disarm();
    suspensions.clear();
    status = 'idle';
    idleReason = reason;
    store.sync();
  }

  /** The one entry point for start(), play() and a re-enable. */
  function begin(delayMs: number): void {
    reduced = readsReducedMotion();
    hidden = readsHidden();
    watch();
    disarm();
    // A start or a play is the newest statement: neither the hover courtesy nor
    // an external skip owed to an earlier navigation survives it.
    suspensions.clear();
    skipNextTick = false;

    if (!enabled) {
      toIdle('disabled');
      return;
    }
    // The gate is structural and outranks the preference: a list too short to
    // rotate cannot rotate however anyone feels about motion.
    if (intent === 'auto' && reduced) {
      toIdle('reduced-motion');
      return;
    }

    status = 'running';
    idleReason = null;
    // Arm BEFORE publishing: a subscriber notified of 'running' may synchronously
    // dispose() or pause() (React runs store listeners during the same task), and
    // a timer armed afterwards would outlive the very call that cleaned it up.
    arm(delayMs);
    store.sync();
  }

  function start(): void {
    // Only from idle. A second start() must not re-arm the dwell of a clock
    // that is already running, must not resurrect a suspended one, and must
    // never override the visitor's sticky pause (which outlives an effect
    // re-run).
    if (status !== 'idle') return;
    intent = 'auto';
    begin(startDelayMs);
  }

  function play(): void {
    if (!enabled) return;
    intent = 'user';
    begin(intervalMs);
  }

  function pause(): void {
    if (status !== 'running' && status !== 'suspended') return;
    disarm();
    suspensions.clear();
    status = 'stopped';
    idleReason = null;
    store.sync();
  }

  function suspend(cause: SuspendCause = 'pointer'): void {
    if (status !== 'running' && status !== 'suspended') return;
    suspensions.add(cause);
    if (status !== 'running') return;
    disarm();
    status = 'suspended';
    idleReason = null;
    store.sync();
  }

  /**
   * THE FULL-INTERVAL COURTESY, spelled once (org-review F6, 2026-09-09).
   *
   * A visitor who has just navigated by hand, or who has just stopped hovering,
   * has been looking at THIS slide — so the next automatic move is a whole
   * interval away, not whatever was left of the old countdown. On an internal
   * driver that is a re-armed timer; on an external one there is no timer to
   * push, so the courtesy is paid in beats: swallow the next one and rejoin the
   * shared rhythm after it.
   */
  function oweFullInterval(): void {
    if (driver === 'external') {
      skipNextTick = true;
      return;
    }
    arm(intervalMs);
  }

  function resume(cause: SuspendCause = 'pointer'): void {
    suspensions.delete(cause);
    if (status !== 'suspended') return;
    // Someone else is still holding it — the classic case being a pointer that
    // leaves while keyboard focus is still inside the widget.
    if (suspensions.size > 0) return;
    status = 'running';
    idleReason = null;
    oweFullInterval();
    store.sync();
  }

  function restart(): void {
    if (status !== 'running') return;
    oweFullInterval();
  }

  function setEnabled(nextEnabled: boolean): void {
    if (nextEnabled === enabled) return;
    enabled = nextEnabled;

    if (!enabled) {
      if (status === 'running' || status === 'suspended') toIdle('disabled');
      return;
    }
    if (status !== 'idle' || idleReason !== 'disabled') return;
    // Enabled again: only resume a clock somebody actually started, and let
    // begin() re-apply the reduced-motion gate for an automatic one. A full
    // interval, not the dwell — the dwell is start()'s courtesy, and by now the
    // visitor has been looking at this widget for a while.
    if (intent !== 'none') {
      begin(intervalMs);
      return;
    }
    // Nobody has started this clock, or dispose() cleared the intent: the gate
    // is open again, so the reason has to stop saying 'disabled' — a consumer
    // reading it would render a "too few items" state for a list that is fine.
    idleReason = 'not-started';
    store.sync();
  }

  function dispose(): void {
    disarm();
    unwatch();
    suspensions.clear();
    skipNextTick = false;
    intent = 'none';
    if (status === 'running' || status === 'suspended') {
      status = 'idle';
      idleReason = 'not-started';
      store.sync();
    }
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    start,
    play,
    pause,
    suspend,
    resume,
    restart,
    tick,
    setEnabled,
    dispose,
  };
}
