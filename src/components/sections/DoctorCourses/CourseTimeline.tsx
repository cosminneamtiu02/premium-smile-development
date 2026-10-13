'use client';

import { useEffect, useRef, type ReactElement } from 'react';
import { useRotation } from '@/components/ui/use-rotation';
import { cx } from '@/lib/cx/cx';

// sections/DoctorCourses/CourseTimeline — THE ISLAND: the course rail, one
// <li> per idea with a dot and a stretch of line beside it, ONE idea lit at a
// time and the light moving on by itself, idea after idea, round the list.
// Rebuilt 2026-10-13 (CLAUDE.md §15.23 round 7) on the owner's word; the
// version of rounds 2g–2k lit the YEAR the visitor had scrolled to, on
// lib/scroll-spy, and that mechanic is history here (CLAUDE.md §15.23 — the
// price menu keeps lib/scroll-spy). D36 (the pop), D44c (the forward motion)
// and D50 (the break above every dot) in the doctor-pages run's ledger are
// the decisions that survive in this file, and the anchors other files quote
// (§17.7).
//
// Owner's brief, 2026-10-13, verbatim: "they have to circle automatically
// through the ideas and highlight them one by one. so the scrolll highiight
// has to be automatic now. and maybe half the space that is now between
// higlihhted and non highlighted section." — and, of the scroll-driven
// version (round 2j, 2026-09-26), the look this file keeps: "bring up front
// with a 'come for you' on a theoretical z axis animation and bring color to
// it, while others are fainter. the same should happen with the line and
// started dot".
//
// ── WHY THE BLOCK IS SPLIT IN TWO FILES (the PriceList/PriceMenu and
// DoctorStats/StatNumber precedent). DoctorCourses.tsx stays a SERVER
// component — the <section>, its name, the eyebrow and the <h2> compile to
// inert HTML (§16) — and only what needs the browser crosses into this file:
// WHICH idea is lit depends on time, so it can be decided only after mount.
// The rail and the ideas come with it because the state is written onto
// them; there is nothing smaller to hydrate. One of the doctor page's two
// islands (StatNumber, D31, is the other); CLAUDE.md §16's runtime list
// names both.
//
// ── WHAT CROSSES THE BOUNDARY: THE FINISHED IDEAS AND ONE NUMBER (PriceMenu's
// WHAT DOES NOT CROSS, ReviewsCarousel's WHAT CROSSES THE BOUNDARY, AND WHAT
// CANNOT). Props that cross a server→client boundary are serialized into the
// page's flight payload, so the block hands over exactly what it prints — the
// course lines, strings only — and the rhythm, a number; no class name, no
// callback, no formatter (a function cannot cross at all). That is also why
// this island has no clock seam of its own, unlike sections/Hero's `env`
// (lib/clock's ClockEnv is functions): its tests stub `matchMedia`, the door
// lib/reduced-motion asks through on every call, as StatNumber.test.tsx does.
// The eyebrow and the <h2> stay on the server side, where they are printed
// once.
//
// ── THE MECHANIC IS ui/use-rotation, over lib/rotation and lib/clock — the
// site's THIRD rotator, after sections/Hero's slides and the reviews deck.
// The shared shell builds the ring ONCE in a useState initializer (pure
// construction: it runs in Node during the static export and again at
// hydration, touching no window either time), publishes it through
// useSyncExternalStore, starts it after mount and disposes it on unmount.
// The lit idea is the ring's `shown` whenever the ring is not idle, and
// `status === 'idle'` covers three cases: the server render and the first
// client render ('not-started'), reduced motion (lib/clock declines the
// automatic start) and a single idea ('too-few' — lib/rotation's two-item
// floor: one idea has nothing to hand the light to). So the static HTML, a
// visitor who asked for less motion and a doctor with one course all get the
// NEUTRAL rail (THE STATES, below). With motion allowed, idea 1 lights one
// render after mount, and every `intervalMs` the light moves to the next
// idea, from the last back to the first (lib/rotation's wrapIndex — the
// owner's "circle"). A hidden tab stops the beat and a return re-arms a full
// interval (lib/clock's ENV REACTIONS). The rhythm is the block's
// COURSES_INTERVAL_MS (DoctorCourses.tsx's THE RHYTHM).
//
// ── THE OFF-SCREEN HOLD — lib/clock's third SuspendCause, 'offscreen', added
// for this island (its doc). ONE IntersectionObserver watches the rail: in
// view, `resume('offscreen')`; out of view, `suspend('offscreen')`. The block
// stands third on the doctor page, under the opener and the numbers, so at
// mount it is usually below the fold: idea 1 lights and HOLDS, and the cycle
// begins only when the visitor scrolls the courses into view — the next idea
// a FULL interval later (lib/clock's resume courtesy), so the light never
// jumps the moment the rail arrives. Scrolled away, the light holds where it
// was; scrolled back, a full interval again. A held ring keeps its lit idea:
// `suspended` is not `idle`, so nothing on screen says the beat is held, and
// nothing needs to. Effects run in declaration order, so the shell's start()
// has run before this file's effect creates the observer, and its first
// callback finds a running ring to suspend; a resume while the ring runs is a
// no-op, so a rail that is on screen at mount keeps its first dwell. Every
// entry of a callback is applied in order, so the newest has the last word.
// An engine without IntersectionObserver gets no hold: the cycle simply runs.
// A callback the platform had queued before an unmount lands on a disposed
// ring, where suspend() and resume() change nothing. THE OBSERVER IS MADE
// AGAIN WHEN THE NUMBER OF IDEAS CHANGES (G2 typescript L2, react NIT 1):
// lib/clock's begin() — a ring that goes idle at one idea and runs again at
// two — clears every hold, 'offscreen' included, and an observer reports
// only CROSSINGS, so a rail still off screen would cycle unseen until it next
// crossed the edge; a fresh observer reports the rail's side at once. The
// page's list never changes; a story's `items` control does.
//
// ── NO POINTER, NO FOCUS MANNERS — on purpose. Nothing in the rail is
// focusable (no link, no control), so the shell's focus pair would have
// nothing to hear; and the owner's rotators hold for no pointer since
// 2026-09-20 — "automatically resume even if you interact with it"
// (sections/Hero, round 3), the reviews deck "like the slides" the same
// evening — those two holding only while KEYBOARD focus is inside them, a
// focus this rail cannot receive. Do not make the list focusable to win that
// hold: a tab stop on content nobody operates, and still nothing for a mouse
// or a finger (G2 a11y M1). A hover hold
// here would freeze the light under every resting cursor on a laptop: the
// Hero's round-2 measurement, when one mouse move held its first slide for
// 12 s ("I do not see it autoscrolling"). And there is nothing to press: no
// beads, no prev/next, so no handNavigation either.
//
// ── NOT THE APG CAROUSEL — NOTHING IS HIDDEN. lib/rotation's CONSUMPTION
// RECIPE lists a rotator's markup duties — a region with a localized
// roledescription, the slides as named groups, `inert` on every slide not
// showing, a polite live region once the rotation stops, the rotation
// control, the reading-time rider — and every one of them exists to manage
// slides that are HIDDEN while another one shows. Here every idea is on
// screen and readable at every moment; the light is VISUAL EMPHASIS ONLY. So
// no aria-live (an announcement every 3 s would talk over the biography
// beside the rail and announce nothing new — the words do not change), no
// aria-roledescription, no `inert`, no slide labels and no aria-current
// (navigation's attribute: the header's links, the price menu's): a screen
// reader reads one plain list, the same in every state, and the reading-time
// rider does not bind — an idea whose light has moved on is still there to
// read. The region around the rail is DoctorCourses.tsx's, named by its
// <h2> like every other region on the page.
//
// ── SC 2.2.2 (Pause, Stop, Hide — Level A), THE OWNER'S CALL, RECORDED. The
// light starts by itself, moves every 3 s for as long as the page is open,
// and sits beside other content — from the Container's @3xl step, beside the
// biography, the page's main reading: auto-updating content in the
// criterion's sense, which asks for a way to pause, stop or hide it. This
// rail offers NONE, FOR ANYONE: sections/Hero and the reviews deck offer no
// control either (Hero.tsx's NO ROTATION CONTROL record), but they hold while
// a keyboard is inside them, and this rail holds for no keyboard, no mouse
// and no finger (G2 a11y M1 — the earlier record said "mouse or touch").
// What softens it without meeting the letter: reduced motion stops it
// entirely (the neutral rail — not a sufficient technique for 2.2.2), it
// holds off screen and in a hidden tab, and the change is an emphasis —
// nothing appears or disappears. WHAT WOULD CONFORM: a pause/stop control
// (lib/rotation's rotationControl waits for its first consumer), or ONE
// SWEEP that finishes within 5 s once the list enters view and then rests
// neutral (the StatNumber count-up's manner). WHAT WOULD NOT, ALONE: a hover
// hold (ui/use-rotation's pointerManners — keyboard and touch left out), or
// one lap then stop (6 ideas × 3 s = 18 s, past the criterion's 5 s).
//
// ── THE STATES, switched in JS — one value, `lit`, the index of the lit idea
// or null:
//   · NEUTRAL (`lit` null: the static HTML, reduced motion, a single idea) —
//     every idea at full opacity in `ink`, every stretch and dot grey
//     (`bg-line`), nothing scaled, nothing marked: the plain CV a visitor
//     gets when nothing may move. The visual net photographs this state (it
//     runs with reduced motion);
//   · IDLE (another idea lit) — the idea RECEDES: `opacity-65` on the <li>,
//     its stretch and its dot grey under the fade (CONTRAST, below);
//   · LIT — the idea COMES FORWARD at full opacity: it wears `scale-104`, its
//     settled size, with `animate-forward` carrying the overshoot on top of
//     it (THE FORWARD MOTION), and its stretch and its dot turn to the
//     accent, the dot at `scale-125` with its own pop (D36). The words keep
//     their `ink`: the fade on the others and the size, the line and the dot
//     on this one carry the difference.
//   The lit <li> carries `data-current` — present only while lit, absent
//   otherwise (PriceMenu's `data-rail` idiom) — so a test, a story play and
//   any future stylesheet can find it without parsing class strings. The
//   static HTML carries NONE (§16's hydration-safety rule): the ring's frozen
//   server snapshot is idle, so the server render and the browser's first
//   render are the neutral rail byte for byte, and the first light appears
//   once start() has run.
//   · THE CLOCKS. An idea's clock is 300ms (`duration-300`), and WHICH
//     properties it eases belongs to the STATE, because a transition starts
//     only for a property the AFTER-change style lists in
//     `transition-property` (react F1 of the G2-R2 tier-2 review, measured
//     in Chromium against the compiled classes):
//       – NEUTRAL and IDLE ease `[opacity,scale]`: at the first light the
//         other ideas FADE 1 → 0.65 over 300ms instead of blinking, and an
//         idea that has just lost the light fades AND recedes 1.04 → 1 on
//         the one curve, drawn 1.038 at 40ms, 1.009 at 150ms, 1 at 300ms. A
//         first cut of the forward motion held the 1.04 in the animation's
//         `fill: both` and listed `transform`; a transition never starts
//         from a value an animation holds, so the size dropped to 1 in ONE
//         frame under a 300ms fade;
//       – LIT eases `opacity` ALONE: on entry `scale` jumps to 1.04 at once
//         while the animation begins at 0.9615, so the idea is drawn at
//         exactly 1.0 at the swap, 1.035 at 40ms, 1.064 at 150ms (the
//         overshoot), 1.04 from 450ms. Listing `scale` here too would ease
//         it up from 1 UNDER the animation's 0.9615 and draw 0.96 at the
//         swap: a shrink before the pop (measured, and why the states carry
//         two lists);
//       – an idea that loses the light MID-OVERSHOOT drops to its settled
//         1.04 at once — an animation's value is never a transition's start —
//         and recedes from there; at any rhythm longer than the 450ms
//         overshoot (3 s on the page) it cannot happen;
//       – THE DOT, the same rule on its own 150ms clock: at rest it eases
//         `[background-color,scale]`, so a dot losing the light shrinks
//         1.25 → 1 as it greys, drawn 1.30 at the swap (its size × the
//         idea's 1.04) and 1 by 300ms; lit, it eases its colours alone, so
//         the `scale-125` lands at once and the pop draws it from its own
//         first keyframe, 0.875 at the swap.
//     A stretch's colour fades on the shared 150ms clock (`transition-colors`).
//     The forward motion and the dot's pop run 450ms.
//     `motion-reduce:transition-none` rides the idea's clock in every state
//     and every part's, and `motion-reduce:animate-none` every animation
//     (§9). Under reduced motion the rail never lights in the first place
//     (lib/clock declines the start); the classes are the belt for the one
//     path that reaches them — the preference turned ON while an idea is lit
//     snaps the rail to neutral, every part at once.
//
// ── THE FORWARD MOTION (D44c, reworked by react F1 of the G2-R2 tier-2
// review): the lit idea WEARS `scale-104` — its settled size, a static 1.04
// in Tailwind v4's separate `scale` property — and `animate-forward`, the
// `--animate-forward` token in globals.css's `@theme`, carries ONLY the
// overshoot on top of it: 0.9615 → 1.0192 → 1 on `transform`, over 450ms on
// the pop's overshoot curve. `transform` and `scale` multiply, so the idea is
// drawn 1 → ~1.06 (measured ~1.065) → 1.04 and settles a little in front of
// the others (the curve eases each keyframe interval on its own, so the
// drawn peak passes the 60 % keyframe's 1.06). The size is the WEARER's, not
// the animation's held last frame, so that a transition can ease it back
// (THE CLOCKS, above). KEEP-IN-SYNC: the keyframes are the drawn sizes
// DIVIDED by 1.04, the `scale-104` below — CourseTimeline.test.tsx pins the
// pair's product. The lit dot sits inside the idea, so it is drawn at its own
// `scale-125` (and its pop) × the idea's 1.04. The class is added when an
// idea lights, and a class that is added starts its animation afresh, so
// every idea comes forward each time the light reaches it.
//   · `origin-left` on every idea: it grows from the side its line is on, so
//     the line and the dot stay where the eye left them and the growth goes
//     rightward, into the free side of the column.
//   · IT OPENS NO SIDEWAYS SCROLL (§7) — thanks to the BELT on
//     sections/DoctorProfile's full-bleed outer (this block's own band wore
//     it until 2026-10-13). A transform counts towards a page's scrollable
//     overflow, and an idea is as wide as the rail — on a phone, where the
//     block stacks under the biography, as wide as the column — so 1.04
//     pushes its right edge 4 % past the column, into the gutter (~14px at
//     390 against a 19.5px gutter, ~11.5px at 320 against 16), and the
//     ~1.065 peak ~6.5 % for a few frames, PAST the screen's edge: 2.6–3.5px
//     at 320–430 when it was measured on the built page (2026-10-09, ui/
//     Container's THE PHONE GUTTER). `overflow-x-clip` on the full-bleed
//     outer trims only what passes the screen's edge, never an idea at rest.
//     The stories read the document AND every idea: a box's OWN transform
//     never counts toward its own `scrollWidth`, so each idea is a race-free
//     witness of its words, which the document, behind the belt, can no
//     longer see.
//
// ── THE RAIL AND ITS LINE (D34 — "the line should be on the left side, not
// centered"; D44c — the line drawn in one stretch per idea; D50 — a break
// above every dot; THE TRAIL — the same stretch under the last dot, round
// 7's pack), re-derived on 2026-10-13 for the idea's 18px line:
//   · the rail is a <ul>, a flex column with `gap-10` — 40px between ideas,
//     HALF the 80px between years it replaces (the owner: "maybe half the
//     space"). No top margin (the block's `gap-6` spaces it from the opener)
//     and no measure cap: beside the biography the rail is a share of the
//     band's row, and stacked below the band's split it is at most a
//     tablet's column — never a line long enough to need one;
//   · a stretch is the idea's FIRST child — positioned boxes with z-index
//     auto paint in tree order, so the dot (second) paints over it — an
//     `aria-hidden` 2px bar (`w-0.5`) at `start-1.25`: 1.25 spacing units
//     plus half its 2px puts its centre at 1.5 units, and the 12px dot at
//     `start-0` has its centre at 1.5 units too — on the line by
//     construction, at any root size;
//   · THE DOT MARKS THE IDEA'S FIRST LINE: the idea is `text-lg`, 18px on a
//     28px line box (Tailwind's `--text-lg--line-height`, 1.75 / 1.125), so
//     its first line's centre is 14px down — 3.5 spacing units — and the
//     12px dot at `top-2` has its centre at 2 + 1.5 = 3.5 units: level with
//     the first line, never between two, at any root size and in the design
//     pixel alike (every length in the sum is a theme step). MEASURED in the
//     stories (320, 390 and 1536, Romanian and German, ideas of one to four
//     lines): the dot's centre on the first line box's centre to the pixel,
//     0px, and 0.5px off the glyphs' own box (Chromium rounds the face's
//     ascent and descent to whole pixels before sharing the leading);
//   · a stretch BEGINS AT ITS DOT'S CENTRE, `top-3.5` — hidden under the dot
//     itself, not merely under its ring: `ring-4` is a 4px box-shadow at
//     every root size and in every design pixel, while `top-*` is a spacing
//     step, so a stretch that began at the ring's edge would peek out above
//     it under an enlarged browser font or a scaled band. So the line begins
//     at the first dot — nothing above it;
//   · EVERY STRETCH REACHES 2.25rem PAST ITS OWN IDEA — `-bottom-9`, ONE
//     recipe for every idea, the last's included (THE TRAIL, below) — so
//     where another idea follows, a stretch ENDS ONE SPACING UNIT ABOVE IT
//     (D50 — "keep some space empty until start of next subsection"): down
//     through 2.25rem of the rail's 2.5rem gap. The next dot's ring begins
//     `top-2` less its 4px ring = 4px under the next idea's top, so 8px of
//     bare ground (0.25rem + 0.5rem − 4px at the 16px root; inside the band
//     scale 12 design pixels less the ring, the one px length in the sum:
//     5.7px at the scale's smallest pixel, s ≈ 0.81, 9.2 at the 1536 laptop,
//     12.7 past the cap) separate every stretch's end from the next dot's
//     ring — 12px from the dot's grey disc, since the ring is the ground's
//     own colour. So the rail reads as a line DOTTED AT THE IDEAS, a short
//     break above every dot.
//     KEEP-IN-SYNC: the reach is the gap LESS one unit — 10 − 1 = 9 — two
//     numbers, one relation (CourseTimeline.test.tsx pins it off the
//     rendered classes, on every stretch): widen the gap without the reach
//     and the break grows; narrow it and a stretch runs into the next idea;
//   · A LIT STRETCH STILL STOPS SHORT OF THE NEXT DOT. The forward motion
//     scales the lit idea about the middle of its left edge, which carries
//     the stretch's end on by (scale − 1) × its distance from the idea's
//     vertical middle — half the idea's height h plus the 36px reach — so the
//     ground left above the next ring is 8 − (scale − 1)(h / 2 + 36) px at
//     the theme's size. MEASURED in the stories' runner (Chromium, the
//     forward motion seeked every 5ms through the hand-over, 2026-10-13):
//     the drawn peak 1.0647 at ~170ms; a one-line idea 6.0px settled and
//     4.77 at its tightest, a two-line one (the phone) 5.44 and 3.86,
//     German's three-line idea at 390 4.88 and 2.95, its four-line one at
//     320 4.32 and 2.05. By the formula the settled end reaches the ring
//     only for an idea of twelve lines (336px), the peak for one of seven
//     (196px) — at the band scale's smallest pixel, six. `Cycling` sweeps
//     the motion and pins it. THE DOT IS PAINTED OVER THE STRETCH ABOVE IT,
//     not under it: the lit idea comes later in the tree, and while its dot
//     pops, its ring (the ground's colour, scaled with the dot) reaches up
//     towards the previous stretch's end — the more lines the idea has below
//     its dot, the higher the idea's own overshoot carries it, the idea
//     growing about its middle. At the tightest frame, ~120ms in (measured,
//     the same sweep): 0.3px short of that end for a one-line idea, over its
//     last 0.75px for a two-line one, over 2.7px for German's four-line one.
//     For a few frames the break above the dot is wiped — never a line drawn
//     under a dot;
//   · THE TRAIL (2026-10-13, CLAUDE.md §15.23 round 7 — the owner's pack
//     feedback the same evening, verbatim: "the last dot idea has to have a
//     longer line beneath. so there is the lst dot with rezidentiat in
//     protetica dentara and the line from the column with lines should
//     project until a bit lower. to have like a stable trail. like the other
//     ideas have."). The LAST idea's stretch wears the same reach: until
//     that evening it ended at its own box (`bottom-0`), the one place the
//     island asked which idea was the last, and the question went with it —
//     every idea is ONE recipe, a single idea's too. So the rail ends in a
//     trail 36px below the last idea, as long as the stretch every other
//     idea hangs into the gap above the next, and with no next dot below it
//     simply stops. It is absolutely placed, so it LAYS OUT NOTHING — no box
//     moves for it, and the block's own box still ends where the last idea
//     does — and it paints past the rail's box into the ground under the
//     block: on the page sections/DoctorProfile's bottom padding, 48px on a
//     phone, 64 from `@lg`, 80 from `@3xl` (36 design pixels of 80 in THE
//     BAND SCALE), every one deeper than the trail, or beside a longer
//     biography the grid row's own slack — so it stays inside that band's
//     box and adds nothing to what the page scrolls, and the band's BELT
//     clips only sideways, so nothing trims it. A consumer that set the
//     block on less than 2.25rem of ground would see the trail paint into
//     whatever follows.
//     LIT, the last idea carries its trail on like any lit stretch (above):
//     36 + (scale − 1)(h / 2 + 36) px under the idea. MEASURED in the
//     stories' runner (Chromium, `TrailLit`'s sweep — the forward motion
//     seeked every 5ms — run at each width, 2026-10-13), at the overshoot's
//     peak, 1.0647: 39.2px under a one-line idea (1536), 40.1 under a
//     two-line one (390), 41.0 under a three-line one (320); settled at 1.04,
//     38.0 / 38.6 / 39.1; at rest 36.0 at every width. By the formula the lit
//     trail outruns a phone's 48px only under an idea of eleven lines
//     (308px). The stories' decorator gives the block that shallowest
//     ground, 48px, and every play reads the trail against it — `TrailLit`
//     through the whole forward motion;
//   · `ring-4 ring-page` lifts the dot off its own stretch, which begins
//     under it — the ring IS the ground, sections/DoctorProfile's band being
//     `bg-page` since 2026-10-13.
//
// ── SEMANTICS, THE SAME IN EVERY STATE: one `<ul role="list">` of `<li>`s,
// each the idea's words; the stretches and the dots `aria-hidden`. The light
// is visual emphasis only (NOT THE APG CAROUSEL, above). `role="list"` is
// LOAD-BEARING here: the ideas wear no bullets, so Tailwind's preflight leaves
// the <ul> at `list-style: none`, and WebKit drops list semantics from such a
// list — the role keeps it a list, with its count of items, for Safari's
// VoiceOver (eslint.config.mjs configures the `no-redundant-roles` exception;
// DoctorStats' and TeamRoster's lists are the precedent).
//
// ── THE KEYS. Each <li> is keyed by its own words: finished, distinct course
// lines (tests/unit/team-data.test.ts pins them unique per doctor and
// language), and an index key would survive a reorder by silently
// re-labelling every idea.
//
// ── CONTRAST, MEASURED (§9, on `--page` #faf9f7; an opacity blends a colour
// with the ground beneath it, `a·fg + (1−a)·page` per channel, and the ratio
// is read on the blend):
//   · ON `--page` ONLY — sections/DoctorProfile's band is the page ground
//     since 2026-10-13. The same `opacity-65` over the 30 % lilac tint
//     (sections/TintedBand) blends the course lines to rgb(102 98 100) =
//     3.94:1, an SC 1.4.3 failure: a TintedBand consumer of this rail
//     re-measures first.
//   · THE FADE IS 0.65, AND THE WORDS SET IT (the year that set it until
//     2026-10-13 is gone): `ink` #2b2724 at 0.65 blends to rgb(115.5 112.5
//     109.9) = 4.64:1 — body text's 4.5:1 kept, the strongest fade in steps
//     of 0.05 that keeps it with room (0.64 is 4.50:1, on the edge; 0.6 is
//     4.00:1). So a resting idea is a lighter grey and still body-text
//     contrast; one number on the <li> fades the whole idea, the owner's
//     "others are fainter" as ONE thing.
//   · NEUTRAL and LIT: `ink` at full opacity, 14.07:1.
//   · THE LINE AND THE DOTS are decorative — they draw a structure the markup
//     already carries — so SC 1.4.11 does not bind: `--line` #d8d4cf is
//     1.40:1 on the ground, 1.24:1 under the fade; the lit accent #7a6d9c
//     4.44:1.
//
// ── PROSE STAYS START-ALIGNED (§15.15 b): no alignment utility anywhere in
// this file; the body's site-wide `hyphens: auto` (§15.14) is inherited, so a
// German compound breaks at a syllable rather than push the column open.

export type CourseTimelineProps = Readonly<{
  /**
   * The ideas, finished strings only, in the page's order — the block's own
   * `items`, handed down whole (see WHAT CROSSES THE BOUNDARY). Distinct (the
   * keys), and at least one: the block returns null for an empty list before
   * this component is reached.
   */
  items: readonly string[];
  /** The rhythm in ms — the block's COURSES_INTERVAL_MS unless a story or a
   *  test asks for another. READ ONCE, AT MOUNT. */
  intervalMs: number;
}>;

/** Which face an idea wears (the header's THE STATES). */
type IdeaState = 'neutral' | 'idle' | 'lit';

// ── THE CLASS RECIPES, one constant per part and state, so the states of
// each part differ exactly where the header says they do.
/** The rail: the column of ideas, 40px apart. `gap-10` is KEEP-IN-SYNC with
 *  `stretchReach` (the header's RAIL). */
const railClasses = 'flex flex-col gap-10';
/** Every idea: indented from the line, 18px on a 28px line, scaling from the
 *  line's side, on a 300ms clock that reduced motion switches off in EVERY
 *  state. WHICH properties that clock eases is the state's (THE CLOCKS). */
const ideaClasses =
  'relative origin-left ps-10 text-lg text-ink duration-300 motion-reduce:transition-none';
/** Each state's own classes — the transition LIST is the state's (react F1).
 *  The idle row ends on its fade and the fade's HIGH-CONTRAST LIFT: a visitor
 *  whose system asks for more contrast (`prefers-contrast: more` — macOS and
 *  iOS "Increase contrast") reads every resting idea at full ink, 14.07:1
 *  instead of 4.64:1, while the light keeps its scale, its dot and its
 *  stretch (G2 a11y L1, 2026-10-13). */
const IDEA: Record<IdeaState, string> = {
  neutral: 'transition-[opacity,scale]',
  idle: 'transition-[opacity,scale] opacity-65 contrast-more:opacity-100',
  lit: 'scale-104 transition-opacity animate-forward motion-reduce:animate-none',
};
/** An idea's stretch of line: from its dot's centre down, 2px, on the left. */
const stretchClasses =
  'absolute start-1.25 top-3.5 w-0.5 transition-colors motion-reduce:transition-none';
/** EVERY idea's reach, the last's included: 2.25rem past its own box — down
 *  through the rail's `gap-10` to one spacing unit (0.25rem) above the next
 *  idea, so a stretch never runs under the next dot (D50), and under the last
 *  idea THE TRAIL, as long (the header's RAIL) — KEEP-IN-SYNC: 10 − 1. */
const stretchReach = '-bottom-9';
const stretchRest = 'bg-line';
const stretchLit = 'bg-accent-decorative';
/** The dot's geometry and its reduced-motion switch, in every state. WHICH
 *  properties its 150ms clock eases is the state's (THE CLOCKS). */
const dotClasses =
  'absolute start-0 top-2 size-3 rounded-full ring-4 ring-page motion-reduce:transition-none';
/** Neutral or idle: grey, easing its colour AND scale, so a dot that has just
 *  lost the light shrinks 1.25 → 1 as it greys. `bg-line` stays LAST. */
const dotRest = 'transition-[background-color,scale] bg-line';
/** Lit: its colours eased alone, so the `scale-125` lands at once and
 *  `animate-pop` draws the dot from its own first keyframe. */
const dotLit =
  'transition-colors scale-125 bg-accent-decorative animate-pop motion-reduce:animate-none';

/** The face idea `index` wears while `lit` is lit (null: nothing is). */
const stateOf = (lit: number | null, index: number): IdeaState => {
  if (lit === null) return 'neutral';
  return lit === index ? 'lit' : 'idle';
};

export function CourseTimeline({
  items,
  intervalMs,
}: CourseTimelineProps): ReactElement {
  // THE MECHANIC — the shared shell (the header's paragraph of that name).
  // Called FIRST, so its start() effect runs before the hold's effect below.
  const { rotation, shown, status } = useRotation({
    count: items.length,
    intervalMs,
  });
  const railRef = useRef<HTMLUListElement>(null);

  // THE OFF-SCREEN HOLD (the header's paragraph of that name) — observed
  // afresh whenever the number of ideas changes (`count` in the deps).
  const count = items.length;
  useEffect(() => {
    const rail = railRef.current;
    if (rail === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) rotation.resume('offscreen');
        else rotation.suspend('offscreen');
      }
    });
    observer.observe(rail);
    return () => observer.disconnect();
  }, [rotation, count]);

  // Idle — not started, reduced motion, one idea — lights nothing.
  const lit = status === 'idle' ? null : shown;

  return (
    // THE RAIL (the header's paragraph of that name). `gap-10` is the block
    // owning ALL child spacing (§6.4).
    <ul role="list" ref={railRef} className={railClasses}>
      {items.map((item, index) => {
        const state = stateOf(lit, index);
        const isLit = state === 'lit';
        return (
          // Keyed by its own words (the header's THE KEYS). `data-current`
          // only while lit, never in the server HTML (§16 rule 2).
          <li
            key={item}
            data-current={isLit ? '' : undefined}
            className={cx(ideaClasses, IDEA[state])}
          >
            {/* THE STRETCH — this idea's piece of the line, FIRST so the dot
                paints over it; the same reach for every idea, so under the
                last it is THE TRAIL (the header's RAIL); grey unless lit,
                then the accent (D44c). Pure paint. */}
            <span
              aria-hidden="true"
              className={cx(
                stretchClasses,
                stretchReach,
                isLit ? stretchLit : stretchRest,
              )}
            />
            {/* THE DOT — on the line, level with the idea's first line; grey
                unless lit, then the accent and bigger, popping as it lights
                (D36). Pure paint. */}
            <span
              aria-hidden="true"
              className={cx(dotClasses, isLit ? dotLit : dotRest)}
            />
            {item}
          </li>
        );
      })}
    </ul>
  );
}
