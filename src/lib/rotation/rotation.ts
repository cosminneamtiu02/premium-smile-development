import {
  createClock,
  type ClockEnv,
  type ClockIdleReason,
  type ClockStatus,
  type SuspendCause,
} from '../clock/clock.ts';
import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';

// lib/rotation — the RING: which item is showing, and the manners of moving
// between them. A thin layer over lib/clock (which owns time), React-free
// (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts), no 'use client', no DOM, no classes, no
// words. Board: .claude/plans/rotation-lib.plan.md, FINAL CONTRACT §3, amended
// by the G2 round (G2-1, G2-3, G2-7, G2-8).
//
// ── THE NAME (board Q8). WAI-ARIA calls this widget a "Carousel (Slide Show or
// Image ROTATOR)" and its pause/play button the "ROTATION control", so the
// spec, the screen-reader tester and this file use one noun. It also says what
// is shared and what is not: the rotation, never the movement. The hero frame
// crossfades, a reviews deck may transform or scroll — "auto-scroll" would name
// one consumer's possible move and mislead the other, and "carousel" would
// invite markup into a module that has none.
//
// ── The `.ts` in the imports above is deliberate and load-bearing: see
// clock.ts, "WHY THE IMPORTS ABOVE SAY `.ts`" (G2-7).
//
// ── WHY A SEPARATE FILE FROM THE CLOCK. Two jobs, two failure modes: the clock
// answers WHEN (and is reusable by anything periodic — a group beat, a future
// ticker), this answers WHICH (a number on a ring of n). Splitting them is also
// what let the group in lib/rotation-group exist without copying a single
// manner: a grouped rotation is this ring with its clock driven from outside.
//
// ── The ring publishes through lib/external-store — its header explains why
// identity is the signal (and why the server snapshot is frozen).
//
// ══════════════════════════════════════════════════════════════════════════
// THE CONSUMPTION RECIPE — HEADER LAW (board Q4, owner fb-401; completed by
// the G2 a11y + react round). Every rotator this repo ever ships writes
// exactly this. THE SHARED SHELL EXISTS SINCE 2026-09-19: the second rotator
// lane (sections/Hero, epic #103) extracted the React half of this recipe —
// the store in a pure initializer, the external-store trio, the start/dispose
// and setCount effects, the clamped `shown`, the focus and pointer manners,
// the control-less stop — into src/components/ui/use-rotation.ts (ui/, by
// lib/cx's question 1: it imports React; this ring stays React-free) and
// rewired the first consumer onto it, exactly as this paragraph asked: §4's
// second-consumer law, the sections/Header/useNavItems.ts precedent of a hook
// extracted where its second consumer was born. Two consumers are what tell
// you which parts are the pattern and which were one band's taste (org-review
// F3b/F9, owner-approved 2026-09-09). A rotator now COMPOSES that hook and
// spells only what is not shared: the markup duties below.
// ══════════════════════════════════════════════════════════════════════════
//
// Terms, for the reader who has not met them: a CLIENT COMPONENT is one whose
// JavaScript ships to the browser ('use client' at the top of the file — §16:
// the island is the smallest component that needs the browser, and the clock is
// that island's engine, never an island itself). useState remembers a value
// across renders; its INITIALIZER FUNCTION runs once per render tree — that is
// once on the SERVER during the static export and once again in the browser at
// hydration, so two stores exist over a page's life and hydration stays safe
// only because both are built from the same options and therefore produce the
// same first snapshot (getServerSnapshot). In dev, StrictMode renders twice and
// discards the extra store, which is harmless precisely because construction is
// pure. useEffect runs after the component is on screen and its returned
// CLEANUP before it leaves. useSyncExternalStore is React's built-in way to
// read a store that lives outside React and re-render when it changes — it
// takes subscribe, getSnapshot and getServerSnapshot, which is exactly the trio
// below, so no custom hook is needed and lib stays React-free.
//
//   'use client';
//   const [rotation] = useState(() =>
//     createRotation({ count: slides.length, intervalMs: 8_000 }),
//   );
//   const { active, count, status } = useSyncExternalStore(
//     rotation.subscribe, rotation.getSnapshot, rotation.getServerSnapshot,
//   );
//   useEffect(() => {
//     rotation.start();
//     return () => rotation.dispose();
//   }, [rotation]);
//   useEffect(() => {
//     rotation.setCount(slides.length);
//   }, [rotation, slides.length]);
//
//   // Render from the CLAMPED index: setCount() runs one frame after a list
//   // shrinks, so `active` can momentarily point past the end. CLAMP, not
//   // wrap — the same arithmetic setCount() itself uses, so this frame shows
//   // the slide setCount() is about to land on. (Shrink 5 → 2 with active 4:
//   // wrapIndex would show slide 0 for one frame and then jump to slide 1,
//   // a move the visitor never asked for. Lists are static on this site
//   // today; this costs one line and removes the class of bug entirely.)
//   const shown = Math.min(active, Math.max(0, slides.length - 1));
//   const control = rotationControl(status);
//
// dispose()/start() re-entrancy is a real guarantee, but NOT because of
// StrictMode's effect → cleanup → effect: React skips that double-run on the
// hydration path (hydrateRoot), and every island on this site hydrates. What
// exercises it in practice is Fast Refresh in dev and any late client-only
// mount — the guarantee stays, its reason is that.
//
// ── MARKUP DUTIES (all the consumer's — this module owns none of the DOM;
// board Q8.6's duty line, completed by G2-8):
//
//  · THE REGION: <section aria-label={t('…')} aria-roledescription={t(
//    'common.carousel.role')}>. The accessible NAME is what gives a <section>
//    its role=region, and aria-roledescription is only valid on an element that
//    HAS a role — so the label is not optional. ARIA requires the
//    roledescription to be localized, which means two message keys (
//    common.carousel.role, common.carousel.slideRole) in all five files,
//    OWNER-AUTHORED (§15.17) — the first consumer shipped them as Claude
//    DRAFTS in all five files, flagged in PR #97 for the owner's word.
//
//  · DOM ORDER (the APG example's order, and the reason for it): the rotation
//    control FIRST, then prev/next, then the slides — a keyboard visitor can
//    stop the motion before they start reading it.
//
//  · THE ROTATION CONTROL (WCAG 2.2 SC 2.2.2, and the thing BOTH old copies
//    were missing): a ui/GlyphButton with pause/play glyphs, labels from the
//    messages (§8.1 — nothing user-facing is ever defaulted in shared code).
//    `rotationControl(status)` decides BOTH its face and its handler:
//      onClick={control === 'pause' ? rotation.pause : rotation.play}
//    No aria-pressed: this is a label-changing action button, not a toggle, and
//    announcing "pause, pressed" alongside a changing name is the 4.1.2 defect
//    a toggle role invites. It renders as "play" in the server HTML (the
//    construction snapshot is idle) and flips after mount — keep it rendered
//    either way, because hiding it until mount buys a layout shift. Render NO
//    rotation control and NO prev/next when `count < 2`, derived from COUNT
//    (never from idleReason, which also carries reduced motion).
//    OWNER EXCEPTION, RECORDED (2026-09-12, the reviews deck): the owner
//    struck the button from that deck ("absolutely no pause button"). What
//    stood in for it there — pointer hover suspends, keyboard entry is the
//    sticky pause, and a HAND NAVIGATION (prev/next) calls pause() so the
//    first tap stops the rotation for good (the touch-reachable stop;
//    Swiper's `disableOnInteraction` default) — is written up in
//    sections/ReviewsCarousel/ReviewsDeck.tsx's NO ROTATION CONTROL
//    paragraph. This bullet stays the law for every OTHER rotator: a consumer
//    omits the control only on the owner's word, per consumer, and writes in
//    its own header what stands in for it and what SC 2.2.2 costs — as that
//    paragraph does (it has described the deck's LATER manners, below, since
//    2026-09-20) and as the records below do. ui/use-rotation's
//    handNavigation is the 2026-09-12 stand-ins' stop-for-good, written once.
//    The Hero frame
//    (2026-09-19) took the same exception on the same word — and then, on
//    the owner's pack feedback of 2026-09-20, went further: NO POINTER HOLD
//    AT ALL (a band that fills the whole first screen would stand still under
//    every resting cursor; a hand resting on the bead it just pressed, or
//    the focus that click leaves on the bead, would hold it too) and
//    NOTHING STOPS IT FOR GOOD ("automatically resume even if you interact
//    with it"): a bead press calls goto — the manner below for a rotator
//    WITH a control — and keyboard focus inside is the ONE hold, transient
//    (ui/use-rotation's `keyboardEntry: 'suspend'` + `pointerEntry: 'none'`),
//    not the sticky pause. Hero.tsx's NO ROTATION CONTROL paragraph carries
//    the measurements and the SC 2.2.2 record (mouse and touch visitors
//    have no stop). THE DECK FOLLOWED the same evening on the owner's word
//    ("not autoscrolling like … the slides"): the 2026-09-12 stand-ins named
//    at the top of this bullet are history, both rotators share the Hero's
//    manners and the Hero's 5.5 s rhythm, and `handNavigation` had no
//    consumer until the fourth rotator (sections/CardCarousel, 2026-10-17,
//    below). A THIRD rotator (2026-10-13, the doctor page's course timeline,
//    sections/DoctorCourses/CourseTimeline) HIDES NOTHING: every idea stays
//    on screen and readable, and the ring only says which one is lit — so it
//    is not the carousel this law's markup duties are written for (no
//    control, no prev/next, no live region, no `inert`, no roledescription).
//    It holds while off screen (lib/clock's `'offscreen'` cause) and for
//    nobody else, on the owner's same "it always moves on"; its header and
//    CLAUDE.md §15.23 round 7 carry the SC 2.2.2 record. A FOURTH rotator
//    (2026-10-14, sections/CardCarousel — cards laid out on a ring like the
//    reviews deck's: `signedOffset` below moved here for it), mounted by a
//    blog article's gallery (sections/PostGallery) and, since 2026-10-17, by
//    the Home page's articles band (sections/BlogCarousel), IS a carousel
//    again. WHAT IT KEEPS of the duties below: the named region with the
//    localized roledescription; every card a group with the slide
//    roledescription and its own "{index} of {total}" name; previous, next
//    and the dots before the cards in the DOM, all of them real <button>s;
//    `inert` on every card but the centre one (aria-hidden its belt); the
//    cards' container as the live region, liveRegion(status); the dots as
//    BUTTONS with aria-current="true", each named by its card's string.
//    WHERE IT DEPARTS (argued in CardCarousel.tsx — the reading time here,
//    on its CARD_CAROUSEL_INTERVAL_MS and in BACKLOG.md entry 2):
//      · NO ROTATION CONTROL, the owner's ("no stop button no speed") — the
//        deck's exception, taken a third time;
//      · previous and next are plain <button>s round a tall chevron drawn in
//        that file (its THE ARROWS), not the NAVIGATION bullet's
//        ui/GlyphButton — strips as tall as the cards' row, never under 24px
//        wide;
//      · not the FOCUS bullet's sticky keyboard pause, nor THE HOVER
//        WRAPPER: the focus pair alone, with `keyboardEntry: 'suspend'` and
//        `pointerEntry: 'none'` (the Hero's manners) — keyboard focus inside
//        HOLDS it only while it stays, and no pointer at rest holds it;
//      · eight dots in an article's gallery and twelve on Home: the
//        NAVIGATION bullet's six-dot trigger FIRED, and was NOT taken (the
//        owner asked for the Hero's dots; its THE BEADS and BACKLOG.md entry
//        2 carry the lever);
//      · READING TIME, the rider every dossier answers, has no answer here:
//        it runs 5.5 s (CARD_CAROUSEL_INTERVAL_MS — the Hero's and the
//        deck's rhythm) while a slide on Home is a whole blog card. The
//        newest post's is the longest in German and ties for the longest in
//        Romanian: its title and summary alone are 45 words in Romanian, 18 s
//        at the rider's ~150 wpm, and 51 in German, 20.4 s. OPEN, the
//        owner's question: the Hero's 5.5 s is his word (Hero.tsx's
//        ROTATION), but no record shows him choosing it for these cards with
//        these numbers in front of him, and the deck's own record calls its
//        reading-time question OPEN (ReviewsCarousel.tsx's
//        REVIEWS_INTERVAL_MS). The gallery's captions, two to four words, fit
//        (1.6 s at most). The levers: the constant, or a dwell per card from
//        its own word count.
//    Its own two additions: the off-screen hold and a hand PRESSING it —
//    from the moment a primary press lands to its end, a drag included
//    (lib/clock's `'drag'` cause; until 2026-10-20 only a press that had
//    become a drag held it). Its prev/next are always-visible tall
//    chevrons at its stage's two edges since 2026-10-17, with the Hero's
//    progress dots under its cards (for one day before, prev/next were the
//    keyboard's alone). SC 2.2.2, the owner's "OPTION 1": EVERY ACTIVATION,
//    by hand or by key — an enabled arrow, a dot, a drag, a tap on the stage
//    or on a card — stops it for good (the deck's first manner,
//    ui/use-rotation's `handNavigation`); a 'bounded' list's disabled end
//    arrow runs no handler and stops nothing. What that leaves open: nothing
//    visible or audible SAYS that a press stops it, and a screen reader's
//    reading cursor is not a press — the card it reads is still swapped,
//    with the live region 'off' while it runs (CardCarousel.tsx's "SC 2.2.2
//    — THE OWNER'S OPTION 1" paragraph, BACKLOG.md entry 2). Its `bounded`
//    mode runs this ring too: a ring of 2(N − 1) steps read as a list that
//    turns round at each end (sections/CardCarousel/track.ts), no change to
//    this module.
//    The hover-wrapper and focus bullets below stay the law for every other
//    rotator. `rotationControl()` below is untouched and waits for the first
//    rotator that renders the control — unnamed today.
//
//  · THE HOVER WRAPPER: the pointer handlers go on a wrapper that holds
//    prev/next and the slides, with the rotation control a SIBLING inside the
//    region but OUTSIDE that wrapper — the APG excludes the control from the
//    hover area, so a visitor who presses play with the pointer nearby gets a
//    real pointer enter afterwards if they move onto the slides:
//      onPointerEnter={() => rotation.suspend('pointer')}
//      onPointerLeave={() => rotation.resume('pointer')}
//
//  · FOCUS, and why it is not just another suspension. The APG sentence is
//    "stops rotating when keyboard focus ENTERS; does not restart unless the
//    user explicitly requests it" — so KEYBOARD-initiated focus is STICKY, a
//    pointer-initiated one is only transient, and a move WITHIN the region is
//    neither. Both handlers go on the REGION <section>, NOT on the hover
//    wrapper: the rotation control is inside the focus boundary (Tab landing on
//    it is an entry) but outside the hover area. Those three cases used to be
//    twenty-three lines of prose every consumer re-typed; they are now
//    classifyFocusEntry() and leavesRegion() below, whose JSDoc carries the
//    reasoning and whose behaviour is tested once (org-review F3a,
//    owner-approved 2026-09-09):
//      onFocus={(event) => {
//        const entry = classifyFocusEntry(event);
//        if (entry === 'keyboard') rotation.pause();
//        else if (entry === 'pointer') rotation.suspend('focus');
//      }}
//      onBlur={(event) => {
//        if (leavesRegion(event)) rotation.resume('focus');
//      }}
//    The interaction test only a real browser driving real focus can make —
//    "keyboard focus entering STOPS the rotation; a Tab within the region is
//    not a second entry" — was discharged by the first consumer
//    (sections/ReviewsCarousel/ReviewsDeck.test.tsx) on 2026-09-12 — and
//    that deck no longer STOPS: since 2026-09-20 keyboard focus entering
//    only HOLDS it while focus stays (`keyboardEntry: 'suspend'`, the Hero's
//    manner), and the same real-Tab tests now assert that hold, the Tab
//    within it and the release on leaving. No rotator takes the
//    keyboard-entry pause today: it waits again, with its "play, then Tab
//    within: still running" form, for the first rotator that renders the
//    control — neither the reviews deck, the Hero frame nor the card
//    carousel has a play button to press (the owner exception above, taken
//    three times).
//
//  · NAVIGATION: prev and next as native buttons (ui/GlyphButton, labels from
//    the messages, ≥24×24 px and aiming at 44 — §9) calling rotation.prev /
//    rotation.next; an optional picker of dots as BUTTONS, aria-current="true"
//    on the active one, calling rotation.goto(i) — each dot's accessible NAME
//    is the SAME ICU "{index} of {total}" string as its slide (one key, two
//    uses; a plain <button> in a section has no §6.3 type enforcement, so the
//    name is a rule here). Buttons with aria-current rather than the APG's
//    tablist variant because every dot is a Tab stop either way and the
//    grouped form needs no roving focus; re-open that choice if a picker ever
//    exceeds about six dots — FIRED 2026-10-17 by sections/CardCarousel
//    (eight dots in an article's gallery, twelve on Home) and NOT taken: its
//    THE BEADS paragraph carries the lever. Do NOT port the old repo's
//    focusable region with ArrowLeft/ArrowRight — a tabIndex={0} div with key
//    handlers is a widget the APG does not ask for and screen readers do not
//    announce. If a deck ever adds swipe or drag, these buttons are its SC
//    2.5.7 single-pointer alternative.
//
//  · THE SLIDES: role="group" aria-roledescription={t(
//    'common.carousel.slideRole')} and an aria-label from an ICU "{index} of
//    {total}" string (§8.2). A slide that is not showing is `inert` (which
//    removes it from the accessibility tree AND from the Tab order; plain
//    `hidden` where there is no crossfade to keep) — and un-inerting the new
//    one is exactly the tree change the polite live region announces after a
//    hand navigation. `inert` alone is not enough for a crossfaded slide that
//    holds focusable content: Safari/iOS < 15.5 ignore it, so a transparent
//    slide would keep its links in the Tab order — the crossfade therefore
//    ends in `visibility: hidden` as well (the standard opacity + visibility
//    pair; visibility is transitionable and removes the slide from both the
//    tree and the Tab order everywhere), unless the slides carry no focusable
//    content at all. NO aria-current on slides: that attribute belongs to the
//    picker buttons.
//
//  · THE SLIDES CONTAINER: aria-live={liveRegion(status)}.
//
//  · ONE STATIC h1, OUTSIDE the slides. A per-slide h1 plus inert slides would
//    replace the page's only h1 every interval (§9's one-h1 rule); whether the
//    heading rotates WITH the photo is the consumer gate the board parks for
//    the owner.
//
//  · THE MOVE ITSELF — crossfade classes, transforms, scrollTo, and the
//    `motion-reduce:` CSS half of the preference — driven by `shown`. A deck
//    that must remount a wrapped card keys each slide by its id — React then gets correct
//    enter/leave for any window smaller than the count. Only a deck whose
//    visible window EQUALS its count needs a lap key (`${id}-${lap}`), and
//    `lap` is NOT derivable from `active` (which wraps): keep a monotonic
//    counter in the consumer, incremented in an effect on every `active`
//    change (the old repo's tickKey trick, made explicit).
//
//  · READING TIME (the rider every dossier answers): justify `intervalMs`
//    against the LONGEST slide at ~150 words per minute, the rate an older
//    audience reads at (§9). The old deck's 6 s cannot carry a 40-word review;
//    a frame of a few words at most — a photo, a caption — is the only ≤6 s
//    case. `startDelayMs` exists to
//    LENGTHEN the first dwell — shorter is allowed, but it is not the point.
//
//  · AA GATES A HERO-STYLE CONSUMER MUST NAME: a focus ring that survives a
//    dark photographic ground (ui/GlyphButton's LIGHT GROUNDS ONLY caveat — a
//    two-layer indicator, SC 2.4.7 Focus Visible; 2.4.13 Focus Appearance is
//    the AAA name for the same ring), 3:1 non-text contrast for picker dots
//    (SC 1.4.11), SC 2.4.11 Focus Not Obscured — no carousel control may sit
//    under the sticky Header pill or the FloatingActions corner at any named
//    viewport, and a NEGATIVE `step`, which reverses the automatic direction
//    and therefore forces prev/next to swap their labels.
//
// ── WHAT THE RING GUARANTEES: `active` is always a valid index (wrapIndex is
// modular arithmetic, so next, prev, goto and the automatic step are all one
// operation), a list shorter than two never rotates at all (the two-item floor,
// carried as the clock's structural gate and surfaced as idle('too-few')), and
// every hand navigation buys a full interval before the next automatic move.

/** The four statuses, re-exported under the name consumers will use. */
export type RotationStatus = ClockStatus;

/**
 * The four transient-pause causes — hover, focus, since 2026-10-13 the widget
 * being off screen and since 2026-10-14 a hand pressing or dragging it
 * (lib/clock's SuspendCause doc) — re-exported so a consumer typing its own handlers never
 * has to import from lib/clock (the ring is the tier they know).
 */
export type { SuspendCause };

/** Why an idle rotation is idle. The clock's 'disabled' means 'too-few' here. */
export type RotationIdleReason = 'not-started' | 'too-few' | 'reduced-motion';

/** An immutable read of the ring at one instant. */
export type RotationSnapshot = Readonly<{
  /** 0 ≤ active < count, and 0 when count is 0. */
  active: number;
  count: number;
  status: RotationStatus;
  /** Set only while `status === 'idle'`. */
  idleReason: RotationIdleReason | null;
}>;

export type RotationOptions = Readonly<{
  /** How many items are on the ring right now; setCount() keeps it honest. */
  count: number;
  /**
   * The rhythm in milliseconds, at least 1 ms. Required — rhythms belong to
   * consumers.
   */
  intervalMs: number;
  /** The first automatic advance after start(); defaults to intervalMs. */
  startDelayMs?: number;
  /** Where to begin; default 0, wrapped into the ring. */
  initial?: number;
  /**
   * The AUTOMATIC step; default 1, negative reverses. next() and prev() stay
   * ±1 because they are the visitor's own steps, not the rhythm's.
   */
  step?: number;
  /**
   * 'external' hands the beat to lib/rotation-group. Default 'internal'.
   *
   * RECORDED TRIGGER — at the FIRST GROUP CONSUMER, this option and the
   * returned `Rotation` both become a discriminated `Rotation<'internal' |
   * 'external'>` (§15.18's rider, extended by org-review F7, 2026-09-09): then
   * `intervalMs` is not required under 'external' (the group owns the rhythm
   * and this ring's number is ignored), `tick()` exists only on an external
   * ring — today it is callable on an internal one, where it double-advances —
   * and `group.add()` refuses an internal ring at COMPILE time. The runtime
   * throw in rotation-group's add() stays either way, as the belt.
   */
  driver?: 'internal' | 'external';
  /** Fakes for the clock's two browser touches; defaults are the real browser. */
  env?: ClockEnv;
}>;

/**
 * The ring's public surface: React's external-store protocol (the trio
 * useSyncExternalStore takes — see THE CONSUMPTION RECIPE above and
 * lib/external-store) plus the navigation and the manners.
 */
export type Rotation = ExternalStore<RotationSnapshot> &
  Readonly<{
    /** Which beat drives this ring — lib/rotation-group refuses internal ones. */
    driver: 'internal' | 'external';

    /** Lifecycle — the mount effect's two lines. */
    start(): void;
    dispose(): void;

    /** The rotation control: sticky, and the only way out of `stopped`. */
    play(): void;
    pause(): void;

    /**
     * The transient pause, keyed by CAUSE: the pointer being over the widget
     * and focus being inside it are separate flags (the APG's rule), so a
     * pointer leaving never resumes motion while focus is still inside.
     */
    suspend(cause?: SuspendCause): void;
    resume(cause?: SuspendCause): void;

    /**
     * One advance. The internal timer calls it; an external driver may too —
     * and until the discriminated `Rotation<driver>` of the RECORDED TRIGGER on
     * `RotationOptions.driver` lands, nothing but that note stops a consumer
     * calling it on an internal ring, where it double-advances.
     */
    tick(): void;

    /** Visitor navigation: wraps, and buys a full interval when running. */
    next(): void;
    prev(): void;
    goto(index: number): void;

    /** The list changed length: clamp the index, re-check the two-item floor. */
    setCount(count: number): void;
  }>;

/**
 * Bring any index onto the ring: `((i % n) + n) % n`.
 *
 * The doubled modulo is what makes -1 the LAST item rather than JavaScript's
 * -1: the language's % keeps the sign of its left operand, so a plain `i % n`
 * answers -1 for (-1, 3). Consumers reuse this for their own derived values —
 * a deck's window offsets, a dots list's neighbours. NOT for the recipe's
 * render-time guard, which CLAMPS: see the `shown` line above.
 *
 * @returns 0 for an empty (or nonsensical) ring, never NaN.
 */
export function wrapIndex(index: number, count: number): number {
  // `!(count > 0)` rather than `count <= 0`, so NaN takes this branch too:
  // `NaN <= 0` is false, and the modulo below would have handed back NaN — the
  // one answer this function promises never to give. The finiteness half closes
  // the other end (`x % Infinity` is NaN as well).
  if (!(count > 0) || !Number.isFinite(count)) return 0;
  // And the index itself: `Infinity % n` and `NaN % n` are both NaN.
  if (!Number.isFinite(index)) return 0;
  return ((index % count) + count) % count;
}

/**
 * Where item `index` sits relative to the item being shown, on a ring of
 * `count`: 0 is the shown one, negative is before it (the left), positive
 * after it (the right), and the ring is split as evenly as it divides — with
 * six items the offsets are 0, ±1, ±2 and one +3 (the one beyond the stage's
 * right edge).
 *
 * `wrapIndex` above is the modular half; the comparison is what turns "five
 * steps forward on a ring of six" into "one step back", which is the
 * difference between a card sliding one place and a card flying across the
 * whole stage.
 *
 * `shown` may be FRACTIONAL, and that is the second consumer's reason to be
 * here: a ring under a dragging hand stands BETWEEN two items
 * (sections/CardCarousel), and the same arithmetic then gives every item a
 * continuous position — an item crosses from one end of the ring to the other
 * only where it is furthest from the one shown, half a ring away. With an
 * integer `shown` the answer is the integer the first consumer always had.
 *
 * MOVED HERE on 2026-10-14 from sections/ReviewsCarousel/ReviewsDeck, the
 * §15.19 round-3 STANDING TRIGGER ("`signedOffset` → lib/rotation at the
 * second ring-laid-out rotator") fired by sections/CardCarousel: the body was
 * the deck's, byte for byte, so the deck's fan is unchanged. One line has
 * joined it since — the guard (2026-10-20, found in review), which changes
 * nothing for a positive count — see @returns.
 *
 * @returns 0 for an empty (or nonsensical) ring, never NaN; otherwise a value
 * in the half-open (−count/2, count/2], the tie at half a ring going to the
 * right. The guard is this function's own, not wrapIndex's alone: wrapIndex
 * answers 0 for a NEGATIVE ring too, and the comparison after it then turned
 * that 0 into −count — 5 for a ring of −5, Infinity for one of −Infinity.
 */
export function signedOffset(
  index: number,
  shown: number,
  count: number,
): number {
  // `!(count > 0)`, wrapIndex's spelling. Its job here is a NEGATIVE count:
  // wrapIndex answers 0 for one, and `0 > count / 2` would then hand back
  // −count. (NaN would come back as 0 without it — wrapIndex's own guard.)
  if (!(count > 0)) return 0;
  const distance = wrapIndex(index - shown, count);
  return distance > count / 2 ? distance - count : distance;
}

/** A ring length: whole, never negative, never NaN. */
function normalizeCount(count: number): number {
  // Infinity is not a length: it would enable the clock (`Infinity >= 2`)
  // while wrapIndex pins the index at 0 — a ring that ticks forever and never
  // moves, the very shape the step guard below refuses.
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

/** An index a caller supplied: whole, and 0 where they supplied nonsense. */
function toIndex(index: number): number {
  return Number.isFinite(index) ? Math.trunc(index) : 0;
}

/**
 * The `aria-live` value a status implies (WAI-ARIA APG, carousel pattern).
 *
 * While the rotation moves on its own the region is 'off' — announcing a slide
 * every few seconds would talk over whatever the visitor is actually reading.
 * The moment it stops for any reason (paused, hovered, reduced motion, too few
 * items) it becomes 'polite', because from then on a change means the visitor
 * asked for one and deserves to hear it.
 */
export function liveRegion(status: RotationStatus): 'off' | 'polite' {
  return status === 'running' ? 'off' : 'polite';
}

/**
 * Which face the rotation control wears — and therefore which action it
 * performs (G2-1, a11y CRITICAL).
 *
 * The naive `status === 'running' ? pause : play` is wrong on the DOMINANT
 * activation path: a pointer user hovers the widget to reach the button, which
 * suspends the clock, so by the time they click, the control has silently
 * become "play" — it offers to start something that is still moving, and
 * performs the opposite of what SC 2.2.2 asks. `suspended` means the visitor
 * has NOT stopped the rotation (a hover is not a decision), so the control must
 * still read "pause"; only `stopped` and `idle` genuinely offer play.
 *
 * The consumer derives both the label key and the handler from this one value,
 * so name and action can never diverge (SC 4.1.2).
 */
export function rotationControl(status: RotationStatus): 'pause' | 'play' {
  return status === 'running' || status === 'suspended' ? 'pause' : 'play';
}

/**
 * The shape BOTH React's synthetic FocusEvent and the DOM's own satisfy —
 * typed structurally, so lib stays React-free (§4's fence; no `import type`
 * from react either, tests/unit/lib-react-free.test.ts).
 *
 * Probe-proven against React's types: `currentTarget` is `EventTarget &
 * HTMLElement` (a Node), `relatedTarget` is `(EventTarget & Element) | null`
 * and `target` is `EventTarget & Target`, so `onFocus={(event) =>
 * classifyFocusEntry(event)}` typechecks under --strict with no cast and no
 * import. A plain DOM `focusin` listener satisfies it at runtime too, but its
 * `currentTarget` is DECLARED `EventTarget | null`, so hand the element the
 * listener sits on: `classifyFocusEntry({ currentTarget: region, target:
 * event.target, relatedTarget: event.relatedTarget })`.
 */
export type FocusLike = Readonly<{
  currentTarget: Node;
  relatedTarget: EventTarget | null;
  target: EventTarget | null;
}>;

/** What a focus arriving at the region actually was. See classifyFocusEntry. */
export type FocusEntry = 'within' | 'keyboard' | 'pointer';

/**
 * Is the OTHER end of this focus move inside the region?
 *
 * `instanceof Node` and not a plain `contains(relatedTarget)`, because
 * `relatedTarget` is typed as the widest thing an event can point at — a
 * Window, say — and only a Node can be contained. `Node` here, like `Element`
 * in classifyFocusEntry below, is read when a browser CALLS the function and
 * never at import, so the module still loads in plain Node, where neither
 * global exists (see clock.ts, "WHY THE IMPORTS ABOVE SAY `.ts`").
 */
function withinRegion(event: FocusLike): boolean {
  return (
    event.relatedTarget instanceof Node &&
    event.currentTarget.contains(event.relatedTarget)
  );
}

/**
 * Classify a focus ARRIVING at the region — the handler for focusin (React's
 * onFocus). The three answers are the three manners of the APG's carousel
 * pattern, and the consumer wires them in two lines (THE CONSUMPTION RECIPE,
 * FOCUS).
 *
 * 'within' — a move from one of the region's own controls to another. focusin
 * BUBBLES, so every Tab inside the region fires it again, and a move is not an
 * ENTRY: without this guard a visitor who presses play and then Tabs to "next"
 * would have the rotation re-paused behind them, undoing the request they just
 * made. Do nothing.
 *
 * 'keyboard' — the APG's own sentence is "stops rotating when keyboard focus
 * enters; does not restart unless the user explicitly requests it", so this one
 * is the STICKY pause(). It is also the SAFE default, which is why it is what
 * comes back when there is no element to ask, and when `matches` throws:
 * engines without :focus-visible (Safari/iOS < 15.4) throw a SyntaxError on the
 * selector, and treating that as "pointer" would leave a rotation moving under
 * keyboard focus. No rotator takes the sticky pause today either: the Hero,
 * the reviews deck and sections/CardCarousel pass ui/use-rotation's
 * `keyboardEntry: 'suspend'`, a hold that lifts when focus leaves (the
 * courses' timeline wires no focus manners at all).
 *
 * 'pointer' — Chrome and Firefox focus a button when it is CLICKED, and
 * :focus-visible is the browser's own verdict on which kind of focus this was.
 * A mouse press must not stop the rotation for good, so this is the transient
 * suspend('focus') — undone by the FOCUS leaving the region (onBlur →
 * leavesRegion → resume('focus')), not by the pointer leaving: a mouse click
 * on prev/next leaves focus on the button, so the rotation stays suspended
 * until the visitor clicks or tabs elsewhere (G2 react note, reviews-deck
 * run 2026-09-10 — an inherited manner of the recipe, recorded here so the
 * recipe's behaviour reads as intended). No rotator takes it today: the
 * Hero, the reviews deck (since 2026-09-20) and sections/CardCarousel pass
 * ui/use-rotation's `pointerEntry: 'none'`, so a click's focus holds nothing.
 */
export function classifyFocusEntry(event: FocusLike): FocusEntry {
  if (withinRegion(event)) return 'within';
  if (!(event.target instanceof Element)) return 'keyboard';
  try {
    return event.target.matches(':focus-visible') ? 'keyboard' : 'pointer';
  } catch {
    // No :focus-visible in this engine — sticky is the safe answer.
    return 'keyboard';
  }
}

/**
 * Did focus actually LEAVE the region — the handler for focusout (React's
 * onBlur)?
 *
 * focusout bubbles exactly as focusin does, so without this guard each Tab
 * inside the region produces resume → suspend and one transient 'running'
 * frame, which flips the slides' live region off → polite → off for nobody's
 * benefit. A relatedTarget of null (focus went to the page itself, or to
 * another window) IS a departure.
 */
export function leavesRegion(event: FocusLike): boolean {
  return !withinRegion(event);
}

/** The clock's structural gate reads as the ring's two-item floor. */
function toRotationReason(
  reason: ClockIdleReason | null,
): RotationIdleReason | null {
  return reason === 'disabled' ? 'too-few' : reason;
}

/**
 * Build a rotation. Touches nothing until start() or play() — see the clock's
 * "construction is pure" note; this is §16's hydration-safety rule applied to a
 * store that a server render may build.
 *
 * @throws when `intervalMs` or `startDelayMs` is not a finite number of at
 * least 1 ms (the clock's guard, G2-4), or when `step` is not a non-zero
 * integer.
 */
export function createRotation(options: RotationOptions): Rotation {
  const { step = 1, driver = 'internal' } = options;

  // A fractional or reversed step would desynchronise the ring from its own
  // arithmetic (active + 0.5 is not an index; step 0 is a clock that ticks
  // forever and never moves, which no snapshot would reveal).
  if (!Number.isInteger(step) || step === 0) {
    throw new RangeError(
      `createRotation: step must be a non-zero integer (received ${String(step)}). Use 1 for the ordinary forward ring, -1 to reverse it.`,
    );
  }

  // Normalised exactly as setCount() does it, so a ring built from a fractional
  // or nonsensical length behaves like one that grew into it.
  let count = normalizeCount(options.count);
  let active = wrapIndex(toIndex(options.initial ?? 0), count);

  const clock = createClock({
    intervalMs: options.intervalMs,
    startDelayMs: options.startDelayMs,
    driver,
    env: options.env,
    onTick: () => {
      active = wrapIndex(active + step, count);
      store.sync();
    },
  });

  // The two-item floor, applied before anything can observe the store: a ring
  // of one has nothing to rotate to, whatever the visitor prefers.
  clock.setEnabled(count >= 2);

  function build(): RotationSnapshot {
    const beat = clock.getSnapshot();
    return {
      active,
      count,
      status: beat.status,
      idleReason: toRotationReason(beat.idleReason),
    };
  }

  /**
   * THE STORE, built here and not a line earlier: its builder runs once, on
   * construction, and build() above reads the clock — so the two-item floor
   * must already have been applied or the first snapshot would advertise a
   * running ring that is about to idle. store.sync() rebuilds and publishes
   * only when a field really changed; lib/external-store's header explains why
   * identity is the signal.
   */
  const store = createExternalStore(build);

  // The bridge: a status change inside the clock is a snapshot change out here.
  // Installed after the construction snapshot exists, and never removed —
  // it is one entry in a Set, not a browser resource, and dispose() must leave
  // the store usable for the start() that an effect re-run is about to make.
  clock.subscribe(store.sync);

  /** Visitor navigation: land on `index`, then buy a full interval. */
  function goto(index: number): void {
    // Consumer indices come from `.length` and loop counters, but the ring's
    // "always a valid index" promise holds for whatever arrives.
    active = wrapIndex(toIndex(index), count);
    store.sync();
    // A no-op unless the clock is running, so a stopped rotation stays stopped
    // and an idle one stays idle: navigating never starts anything.
    clock.restart();
  }

  return {
    driver,
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    start: clock.start,
    dispose: clock.dispose,
    play: clock.play,
    pause: clock.pause,
    suspend: clock.suspend,
    resume: clock.resume,
    tick: clock.tick,
    next: () => goto(active + 1),
    prev: () => goto(active - 1),
    goto,
    setCount(nextCount: number): void {
      count = normalizeCount(nextCount);
      // CLAMP, not wrap (the contract's word): when a list shrinks, the nearest
      // surviving item is the honest place to stand — wrapping would throw the
      // visitor back to the first slide for no reason they could see.
      active = count > 0 ? Math.min(active, count - 1) : 0;
      // May flip the clock between running and idle('disabled'), which reaches
      // this store through the bridge above; the trailing store.sync() then
      // finds nothing left to publish.
      clock.setEnabled(count >= 2);
      store.sync();
    },
  };
}
