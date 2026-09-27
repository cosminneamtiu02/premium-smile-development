'use client';

import {
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { cx } from '@/lib/cx/cx';
import { createScrollSpy } from '@/lib/scroll-spy/scroll-spy';
import type { CourseGroup } from './DoctorCourses';

// sections/DoctorCourses/CourseTimeline — THE ISLAND: the course timeline's
// rail and its year groups, with the ONE year the visitor is reading brought
// forward and every other year receding. Built to the round-2g composition
// contract of the doctor-pages run (.claude/section-runs/2026-09-21_11-58_
// doctor-pages/round2/DoctorCourses-current.md, builder R10) and reworked in
// round 2j (builder A5) and round 2k (builder B1); D34 (the line on the
// left), D35 (one current year), D36 (the pop), D44 (the year's step, the
// doubled gap, the subsection coming forward), D49 (the middle of the screen
// as the line) and D50 (a break in the line above every dot) in that round's
// ledger are the decisions this file implements, and the anchors other files
// quote (§17.7).
//
// Owner's briefs, verbatim (2026-09-26): "upon scrolling highlight top dot
// with year and dots, so basically a single subsection should be highlighted
// upon scroll and all are grayed out at rest. when not on current they should
// be deselected and return to on rest state. the current should have a non
// grayed out jump at you animation." · "now that i think about it, the line
// should be on the left side, not centered". · Round 2j: "years have to be at
// least the size of what is now current heading" · "double the empty space at
// the end of a subsection of timeline" · "i want as you scroll to highlight
// one by one subsection of timeline … non current more faint. current … bring
// up front with a 'come for you' on a theoretical z axis animation and bring
// color to it, while others are fainter. the same should happen with the line
// and started dot, they should be brought up with whole subsection." · Round
// 2k ("way better", then): "move at the center of the screen on y axis the
// line activating 'current'" · "keep some space empty until start of next
// subsection, so the line for current does not highlight below the start dot
// of the next subsection … the last few millimetres of the line end, wipe them
// so that they do not cross the next subsection".
//
// ── WHY THE BAND IS SPLIT IN TWO FILES (the PriceList/PriceMenu and
// DoctorStats/StatNumber precedent). DoctorCourses.tsx stays a SERVER
// component — the <section>, its name, the eyebrow and the <h2> compile to
// inert HTML (§16) — and only what needs the browser crosses into this file:
// WHICH year is current depends on where THIS visitor has scrolled, so it can
// be decided only after mount. The rail and the groups come with it because
// the state is written onto them; there is nothing smaller to hydrate. The
// doctor page's SECOND island (StatNumber is its first, D31); CLAUDE.md §16's
// runtime list names it.
//
// ── WHAT CROSSES THE BOUNDARY: THE FINISHED GROUPS, AND NOTHING ELSE
// (PriceMenu's and ReviewsCarousel's paragraphs of that name). Props that
// cross a server→client boundary are serialized into the page's flight
// payload, so the band hands over exactly what it prints — the year labels
// and the course lines, strings only — and no class name, no callback, no
// formatter (a function cannot cross at all). The eyebrow and the <h2> stay
// on the server side, where they are printed once.
//
// ── THE MECHANIC IS lib/scroll-spy — the price menu's, reused rather than
// re-derived (its header's WHY IT LIVES IN lib/ named this second consumer
// before it existed). A year is CURRENT when it is the LAST group whose top
// has reached THE MIDDLE OF THE SCREEN: `line: 'middle'` (D49), the spy's
// `rect.top ≤ innerHeight / 2` with its one pixel of grace. So a year lights
// as its top — its dot and its label — crosses the middle of the window, the
// height a reader's eye rests at, and it stays lit while its courses are
// read, until the next year's top crosses the same middle. The spy reads the
// window's height itself, on every walk, so a resized window moves the line;
// this file spells no offset.
//   · HISTORY: rounds 2g and 2j (D35) measured against the spy's default
//     LANDING line, `rect.top − scroll-margin-top ≤ scroll-padding-top` = the
//     shell's 6rem under the header pill — the year lit as it slid UNDER the
//     pill, i.e. as it was leaving the screen, "highlight top dot" read
//     literally. The owner's round-2k verdict moved the line to the middle.
//     The shell's scroll padding and any scroll margin play no part on the
//     middle line (lib/scroll-spy's THE MIDDLE LINE); round 2j changed the
//     LOOK of the two states, round 2k this mechanic, neither the other.
//   · THE MIDDLE LINE AND ASSISTIVE TECHNOLOGY (the G2-R2 tier-2 a11y
//     review): a screen reader's browse mode and the Tab key scroll their
//     target to an EDGE of the window, and a screen magnifier shows a piece
//     of the FULL window, whose middle is not its own, so the lit year may
//     lead or trail what such a visitor is reading — harmless, because the
//     mark is visual emphasis only (SEMANTICS UNCHANGED, below) and nothing
//     in the rail is focusable.
//   · `topFallback: 'none'` — THE SPY'S NAMED TRIGGER, FIRED HERE. The price
//     menu begins at the top of its page, so its first category is current at
//     scrollY 0; this rail sits under the doctor's opener and the lilac
//     profile band, so at the top of the page no year is being read and none
//     may be current ("all are grayed out at rest"). With 'none' the spy
//     answers null until the first group's top reaches the middle — the
//     same line, since the spy asks every rule of the one line it was built
//     with (lib/scroll-spy's ONE LINE PER SPY). Its bottom rule is kept: at
//     the document's end the LAST year is current — by then the rail has long
//     scrolled by above the map and the footer, so that state is off screen,
//     and the right one is current on the way back up.
//   · THE CONSUMPTION IDIOM IS PriceMenu's, line for line: the spy built in a
//     useState INITIALIZER (pure construction — it runs in Node during the
//     static export and again at hydration, touching no window either time),
//     read through useSyncExternalStore (React's own trio, so lib/ stays
//     React-free), `start()` in an effect and `dispose()` as its cleanup.
//   · THE LIST IS STATIC, and that is a decision: the ids are read once, at
//     mount. A doctor's courses are compiled into the page at build time
//     (§16) and cannot change while a visitor watches; lib/scroll-spy records
//     `setIds()` as the trigger the day a list can.
//   · NO CLICK, NO PIN. Nothing here is interactive, so `select()` is never
//     called: the state follows the scroll alone. The ids come from useId,
//     and no link on the site names a year — which is why the middle line's
//     one consequence (a browser jump lands on the landing line, so a pin
//     there would not arrive on the middle, lib/scroll-spy's THE MIDDLE LINE)
//     costs this island nothing.
//   · A GROUP'S SCALE CANNOT MAKE THE SPY FLICKER. The spy reads
//     `getBoundingClientRect()` — the DRAWN box, `scale` and `transform`
//     included — and a group is scaled about the middle of its left edge
//     (`origin-left`), so its drawn top moves by (s − 1) × h / 2 of its laid
//     out height h, and always AWAY from the line that changed its state:
//       – LIGHTING, the group is drawn at exactly 1.0 at the swap (THE
//         CLOCKS, below), so the spy lights it on its laid-out top; then it
//         grows, and its drawn top rises above the laid-out one (0.02h
//         settled, ~0.03h at the overshoot's peak): further past the line,
//         never back across it;
//       – LOSING THE LIGHT on the way DOWN, the next year's top has reached
//         the line and the walk takes the LAST group that has, so the
//         receding group's drawn top, easing 0.02h back down over its 300ms
//         recede, is never asked about;
//       – LOSING THE LIGHT on the way UP is where the drawn top counts: a lit
//         group lets go only when its DRAWN top drops below the line, i.e.
//         once its laid-out top is ~0.02h (plus the spy's one pixel) under
//         it: a HYSTERESIS of 0.02 × the group's height on the way up, none
//         on the way down (~1.5px for a one-line year at the laptop width,
//         ~5px for the tallest group the stories sample; the G2-R2 tier-2
//         typescript review's note). The recede then eases that drawn top
//         further DOWN, away from the line; only the visitor's own scroll
//         back down inside those 300ms can re-light it, a little early and
//         within the same 0.02h band.
//     Lit, a group stays lit and unlit it stays unlit, until the visitor's
//     scroll carries it across the line.
//
// ── THE IDS — `useId()` as a prefix, the year after it (`${prefix}-${year}`),
// on each group's root. The spy finds its targets with getElementById, so an
// id must be unique in the DOCUMENT, not just in this rail: a Storybook docs
// page renders several of these stories into one document, and a page could
// one day list two doctors' timelines. useId is unique per React tree and
// hydration-stable — the server's render and the browser's first one agree —
// which a hand-built counter is not. The year makes each id unique within the
// rail: lib/team's `coursesByYear` folds every row of a year into ONE group
// (the band's KEYS paragraph), and the spy refuses a duplicate id out loud,
// so a populator bug would fail at the call site instead of lighting the
// wrong year. An EMPTY list never reaches this file: the band returns null
// first (its EMPTY paragraph), because the spy refuses an empty list too and
// a guard here would have to sit above three hooks.
//
// ── THE TWO STATES (D35, reworked by D44c), switched in JS the way PriceMenu
// switches its `aria-current` — one boolean per group, `isCurrent = current
// === id`. Since round 2j the state lives on the WHOLE SUBSECTION, because
// the owner asked for the line and the dot to come "up with whole
// subsection":
//   · REST — the group RECEDES: `opacity-65` on the group root, over the
//     grey parts — its stretch of line and its dot `bg-line`, the year on
//     ui/Heading's `accent-idle` tone (bold ink-muted, the accent tone's REST
//     TWIN — the same weight, so a year switching states never reflows), the
//     bullets `ink-muted`. The course lines are `text-ink` under the fade
//     (the CONTRAST paragraph says why the fade, not the ink, greys them).
//   · CURRENT — the group COMES FORWARD at full opacity: it wears
//     `scale-104`, its settled size, and `animate-forward` carries the
//     overshoot on top of it, so the whole subsection is drawn 1 → ~1.06
//     (measured ~1.065) → 1.04 from its left edge and stays there (THE
//     FORWARD MOTION, below);
//     its stretch of line and its dot turn to the accent, the
//     dot at `scale-125` with its own pop (D36), the year on the `accent`
//     tone (bold lilac, D16), the lines in full `ink`, their bullets in the
//     accent.
//   · The current group carries `data-current` — present only while current,
//     absent otherwise (PriceMenu's `data-rail` idiom) — so a test, a story
//     play and any future stylesheet can find it without parsing class
//     strings. The static HTML carries NONE: the spy's frozen server snapshot
//     is `{ current: null }`, so the server render and the browser's first
//     render are the rest state byte for byte (§16's hydration-safety rule);
//     the state appears one frame after mount, once start() has looked at
//     the real page — and a page restored mid-rail brings its year forward
//     then.
//   · THE CLOCKS. The group's clock is 300ms (`duration-300`), and WHICH
//     properties it eases belongs to the STATE, because a transition starts
//     only for a property the AFTER-change style lists in
//     `transition-property` (react F1 of the G2-R2 tier-2 review, measured
//     in Chromium against the compiled classes):
//       – REST eases `[opacity,scale]`: a group that has just lost the light
//         fades 1 → 0.65 AND recedes 1.04 → 1 on the one curve, drawn 1.038
//         at 40ms, 1.009 at 150ms, 1 at 300ms. The first cut held the 1.04 in
//         the animation's `fill: both` and listed `transform`; a transition
//         never starts from a value an animation holds, so the size dropped
//         to 1 in ONE frame under a 300ms fade.
//       – CURRENT eases `opacity` ALONE: on entry `scale` jumps to 1.04 at
//         once while the animation begins at 0.9615, so the group is drawn at
//         exactly 1.0 at the swap, 1.035 at 40ms, 1.064 at 150ms (the
//         overshoot), 1.04 from 450ms. Listing `scale` here too would ease
//         it up from 1 UNDER the animation's 0.9615 and draw 0.96 at the
//         swap: a shrink before the pop (measured, and why the two states
//         carry two lists).
//       – A group that loses the light MID-OVERSHOOT (a scroll crossing a
//         whole year inside 450ms) drops to its settled 1.04 at once, for
//         the same reason — an animation's value is never a transition's
//         start — and recedes from there: at most the overshoot's ~0.025,
//         during a scroll that fast.
//       – THE DOT, the same rule on its own 150ms clock (the G2-R2 tier-2
//         fold, the dot's twin of react F1): at rest it eases
//         `[background-color,scale]`, so a dot losing the light shrinks
//         1.25 → 1 as it greys, drawn 1.30 at the swap, 1.225 at 40ms, 1.009
//         at 150ms, 1 at 300ms (its size × the group's recede) where it had
//         dropped to the group's 1.04 in one frame; current eases its colours
//         alone, so the `scale-125` lands at once and the pop draws it from
//         its own first keyframe, 0.875 at the swap, exactly as before.
//     The colours of the parts inside the group fade on the shared 150ms
//     clock (`transition-colors`; the resting dot's
//     `[background-color,scale]`), the BULLETS excepted: `marker:` writes their
//     colour ON each `::marker`, while the list's `transition-colors` sits
//     on the <ul>, and `transition-property` does not inherit, so the
//     bullets switch at once as the group's fade carries the lines (the
//     <ul>'s own `text-ink` is the same in both states, so that transition
//     eases nothing today). Chromium does animate a marker's colour when the
//     transition is declared on the marker itself (measured); invisible at
//     18px, recorded so nobody chases it (the G2-R2 tier-2 react review).
//     The forward motion and the dot's pop run 450ms.
//     `motion-reduce:transition-none` rides the group's clock in both states
//     and every part's, and `motion-reduce:animate-none` every animation
//     (§9): a visitor who asked for less motion gets the colours, the fade
//     and the size switched at once, both ways, and nothing moving.
//
// ── THE FORWARD MOTION (D44c, reworked by react F1 of the G2-R2 tier-2
// review): the current group WEARS `scale-104` — its settled size, a static
// 1.04 in Tailwind v4's separate `scale` property — and `animate-forward`, the
// `--animate-forward` token in globals.css's `@theme`, carries ONLY the
// overshoot on top of it: 0.9615 → 1.0192 → 1 on `transform`, over 450ms on
// the pop's overshoot curve. `transform` and `scale` multiply, so the
// subsection is drawn 1 → ~1.06 (measured ~1.065) → 1.04 and settles a little
// in front of the others (the curve eases each keyframe interval on its own,
// so the drawn peak passes the 60 % keyframe's 1.06). The size is the
// WEARER's, not the animation's held
// last frame, so that a transition can ease it back (THE CLOCKS, above).
// KEEP-IN-SYNC: the keyframes are the drawn sizes DIVIDED by 1.04, the
// `scale-104` below — CourseTimeline.test.tsx pins the pair's product. The
// lit dot sits inside the group, so it is drawn at its own `scale-125` (and
// its pop) × the group's 1.04. The class is added when a group becomes
// current, and a class that is added starts its animation afresh, so every
// subsection comes forward each time it is reached.
//   · REDUCED MOTION keeps the POSITION, drops the MOTION:
//     `motion-reduce:animate-none` leaves the plain `scale-104` alone — the
//     1.04 as a static size, reached at once and left at once (the group's
//     `motion-reduce:transition-none`), the same "shape, not only colour"
//     argument the lit dot's plain `scale-125` makes. Because the keyframes
//     END at 1, size and animation never double up, and the
//     `motion-reduce:scale-104` the first cut needed (its keyframes ended at
//     1.04, which a plain `scale-104` would have MULTIPLIED) is gone.
//   · `origin-left` on every group: the subsection grows from the side its
//     line is on, so the line and the dot stay where the eye left them
//     (a 6px centre moves by a quarter of a pixel) and the growth goes into
//     the column's free right-hand side.
//   · IT OPENS NO SIDEWAYS SCROLL (§7). A transform counts towards a page's
//     scrollable overflow, and a group is as wide as the rail — on a phone as
//     wide as the column — so 1.04 pushes its right edge 4 % past the column,
//     into the gutter: ~12px at 390 against a 39px gutter, ~10px at 320
//     against 32px (the gutter is `clamp(1rem, 10vw, 12.5rem)`, ui/Container),
//     and ~17px at 320 for the few frames of the ~1.065 peak.
//     Every story and the page twin assert no sideways scroll.
//   · The year no longer pops on its own (round 2g's `origin-left
//     animate-pop` on the <h3> is gone, and with it the `w-fit` that kept
//     that pop inside the column): it comes forward WITH its subsection, and
//     a 30px label overshooting 1.25 inside a group overshooting ~1.06 would
//     be a jump, not an approach.
//
// ── THE RAIL AND ITS LINE (D34 — "the line should be on the left side, not
// centered"; D44c — the line in per-group stretches; D50 — a break above
// every dot). ONE recipe at every width; the alternating wide-step layout of
// round 2e (D28) is history:
//   · the rail is the column of groups itself — a flex column capped at
//     `max-w-4xl` (56rem, DoctorProfile's prose measure: in one column at the
//     laptop width a course line would otherwise run ~1200px, far past a
//     reading measure for §1's older reader). Round 2g's continuous line
//     under the column is GONE, and with it the separate box that held the
//     two;
//   · the line is drawn in STRETCHES, one per group, so each subsection
//     carries its own and the current one's stretch lights and comes forward
//     with it. A stretch is the group's FIRST child — positioned boxes with
//     z-index auto paint in tree order, so the dot (second) paints over it —
//     an `aria-hidden` 2px bar (`w-0.5`) at `start-1.25`: 1.25 spacing units
//     plus half its 2px puts its centre at 1.5 units, and the 12px dot at
//     `start-0` has its centre at 1.5 units too — on the line by
//     construction, at any root size;
//   · a stretch BEGINS AT ITS DOT'S CENTRE, `top-4.5` = the dot's `top-3`
//     plus half its `size-3` (0.75rem + 0.375rem = 1.125rem). Hidden under
//     the dot itself, not merely under its ring: `ring-4` is a 4px box-shadow
//     at every root size while `top-*` is rem, so a stretch that began at the
//     ring's edge would peek out above it under an enlarged browser font. So
//     the line begins at the first dot — nothing above it;
//   · a stretch ENDS 0.25rem ABOVE THE NEXT GROUP (D50 — "keep some space
//     empty until start of next subsection, so the line for current does
//     not highlight below the start dot of the next subsection … the last few
//     millimetres of the line end, wipe them"): `-bottom-19`, down through
//     4.75rem of the column's 5rem `gap-20` below its group — one spacing
//     unit short of the next group's top. The next dot's ring begins `top-3`
//     less its 4px `ring-4` = 8px under that top, so 12px of bare ground
//     (0.25rem + 0.75rem − 4px at the 16px root; more under an enlarged
//     browser font, the ring being the one px length in the sum) separate
//     every stretch's end from the next dot's ring — 16px from the dot's
//     grey disc, since the ring is the ground's own colour. So the rail reads
//     as a line DOTTED AT THE YEARS: each stretch hangs from its own dot and
//     stops short of the next, with a short break above every dot — the
//     owner's choice over round 2j's seamless rail. KEEP-IN-SYNC: the reach
//     is the gap LESS one unit — 20 − 1 = 19 — two numbers, one relation
//     (CourseTimeline.test.tsx pins it off the rendered classes): widen the
//     gap without the reach and the break grows; narrow it and a stretch runs
//     into the next subsection. The LAST group's stretch ends at its own box
//     (`bottom-0`): there is no next dot;
//   · A LIT STRETCH STILL STOPS SHORT OF THE NEXT DOT. The forward motion
//     scales the current group about its vertical middle, which carries the
//     stretch's end on by (scale − 1) × its distance from that middle (half
//     the group's height plus the 4.75rem reach). MEASURED at the laptop
//     width (the `Current` story, 1536×864, a one-line year 76px tall,
//     settled at 1.04): 4.56px on — the end 0.56px past the next group's top,
//     7.44px clear of the next dot's ring. Worked from the heights the
//     stories measure: the tallest group sampled, German 2024 at 390 (256px),
//     settles 8.16px on, 3.84px clear. The end reaches the next ring only for
//     a group taller than ~448px at 1.04 (~13 wrapped course lines) — ~217px
//     at the overshoot's drawn peak of ~1.065 (THE FORWARD MOTION), where
//     that German group runs about a pixel into the ring for a few frames
//     (G2-R2 tier 2 re-derived the peak; the curve itself is unchanged):
//     under the ground-coloured ring,
//     which the next group paints over it, still short of the grey disc, and
//     never under reduced motion (no overshoot). Recorded, accepted;
//   · HISTORY (round 2j): each stretch reached `-bottom-24.5` — the gap PLUS
//     the next stretch's own `top-4.5` — so the stretches met end to start
//     UNDER every dot and the rail read as one seamless line; the seam sat
//     under the next group's faded dot, whose 0.35 transparency let a lit
//     stretch through as a faint lilac tinge, and the 1.04 ran a lit
//     stretch ~5px on under that dot. The owner's round-2k verdict asked for
//     exactly those millimetres to go, and D50 retired the seam with them;
//   · `top-3` puts the dot's centre 18px down its group — the middle of the
//     `section` step's 36px line (D44a moved the year from the 28px `title`
//     line, where it was `top-2`) — so each dot marks its YEAR, never a
//     bullet; `ring-4 ring-page` lifts the dot off its own stretch, which
//     begins under it (the band's ground is `bg-page`, so the ring IS the
//     ground);
//   · `gap-20` (D44b — "double the empty space at the end of a subsection",
//     round 2g's `gap-10` doubled) separates the subsections;
//   · the rail's `mt-*` steps are the band's spacing under its heading, kept
//     on the rail because this file IS the band — split for the §16 boundary,
//     not a composed child (PriceMenu's placement classes live in PriceMenu
//     for the same reason). Container steps, never a media query (§6.5).
//
// ── SEMANTICS UNCHANGED IN EVERY STATE (D15): one <h3> per year over a
// `<ul role="list">` of its lines, the stretches and the dots `aria-hidden`.
// The state is VISUAL EMPHASIS ONLY — nothing here is interactive, so there
// is no `aria-current` (that attribute belongs to navigation: the price
// menu's links, the header's items) and a screen reader reads the same
// outline and the same lists whether a year is current or not. `role="list"`
// is BELT-AND-BRACES here (the G2-R2 tier-2 a11y review): WebKit drops list
// semantics from a list whose `list-style` is none, which Tailwind's
// preflight makes of every <ul>, but `list-disc` gives this one its
// `list-style-type` back, so WebKit keeps the semantics anyway. The role
// stays so they never hang on the bullets (a restyle that dropped
// `list-disc` would otherwise take them with it in Safari); on DoctorStats'
// and TeamRoster's lists, where preflight's `list-style: none` stands, the
// same role is load-bearing (eslint.config.mjs configures the
// `no-redundant-roles` exception).
//
// ── CONTRAST, MEASURED (§9, on the band's `--page` #faf9f7; an opacity
// blends a colour with the ground beneath it, `a·fg + (1−a)·page` per
// channel, and the ratio is read on the blend):
//   · ON `--page` ONLY. Every rest-state ratio below is a blend over the
//     band's own ground and holds nowhere else: the same `opacity-65` over
//     the 30 % lilac tint (sections/TintedBand, DoctorProfile's ground)
//     blends the course lines to rgb(102 98 100) = 3.94:1, an SC 1.4.3
//     failure. DoctorCourses.test.tsx's `stands on the page ground` is the
//     pin that keeps this rail off any lilac ground; a TintedBand consumer
//     of the rail re-measures first (the G2-R2 tier-2 a11y review).
//   · THE FADE IS 0.65, AND THE YEAR SETS IT. The brief proposed 0.6. A
//     resting year is ink-muted #5b554f: at 0.6 it blends to rgb(155 151 146)
//     = 2.77:1, under large text's 3:1 (a 30px bold <h3> is large text); at
//     0.65 to rgb(147 142 138) = 3.07:1 — the strongest fade the year
//     survives. `opacity-65` on the group root, then, one number for the
//     whole subsection.
//   · THE COURSE LINES MOVE TO `text-ink` UNDER THAT FADE. Left in ink-muted
//     they would blend to 3.07:1 at 0.65 — under body text's 4.5:1; kept in
//     ink-muted the group could fade no further than 0.85 (4.82:1; 0.8 is
//     4.28:1), a fade too slight to read as "fainter". In ink #2b2724 at 0.65
//     they blend to rgb(116 113 110) = 4.64:1 (0.6 would be 4.00:1): a grey
//     a shade lighter than round 2g's ink-muted lines, still body-text
//     contrast. So the grey of a resting line is the FADE, and the lit line's
//     14.07:1 is the same ink at full opacity.
//   · THE ONE-ELEMENT FADE over a split one (opacity on the stretch, the dot
//     and the year, ink on the list): the two reach the same list grey (the
//     split's best, ink-muted at 0.85, is 4.82:1 against this 4.64:1) and the
//     same 0.65 floor for the year, so the split buys nothing visible while
//     spreading the fade over four elements and four transitions — and the
//     owner's "whole subsection" recedes as ONE thing this way.
//   · CURRENT, at full opacity: the lines `ink` 14.07:1; the year the accent
//     #7a6d9c 4.44:1, large text by its 30px (3:1 binds) and bold by the
//     tone's construction besides (ui/Heading's D16 paragraph).
//   · THE LINE AND THE DOTS are decorative — they draw a structure the markup
//     already carries — so SC 1.4.11 does not bind: `--line` #d8d4cf is
//     1.40:1 on the ground, 1.24:1 under the fade.
//   · Bullets are `ink-muted` at rest (3.07:1 under the fade) and the accent
//     when current: list markers, a graphic adjunct to the text beside them.
//
// ── PROSE STAYS START-ALIGNED (§15.15 b): no alignment utility anywhere in
// this file; the body's site-wide `hyphens: auto` (§15.14) is inherited, so a
// German compound breaks at a syllable rather than push the column open.

export type CourseTimelineProps = Readonly<{
  /**
   * The year groups, newest first, finished strings only — the band's own
   * `groups`, handed down whole (see WHAT CROSSES THE BOUNDARY). At least
   * one, with unique years: the band returns null for an empty list before
   * this component is reached, and `coursesByYear` folds a year's rows into
   * one group (the header's IDS paragraph).
   */
  groups: readonly CourseGroup[];
}>;

// ── THE CLASS RECIPES (D34, D35, D44), one constant per part and state, so
// the two states of each part differ exactly where the header says they do.
/** The rail: the column of year groups, capped at the prose measure. The
 *  `gap-20` is KEEP-IN-SYNC with `stretchReach` (the header's RAIL). */
const railClasses = 'mt-8 flex max-w-4xl flex-col gap-20 @lg:mt-10 @3xl:mt-12';
/** Every group: indented from the line, scaling from the line's side, on a
 *  300ms clock that reduced motion switches off in BOTH states. WHICH
 *  properties that clock eases is the state's (the header's THE CLOCKS). */
const groupClasses =
  'relative origin-left ps-10 duration-300 motion-reduce:transition-none';
/** At rest: faded, and easing opacity AND scale, so a group that has just
 *  lost the light recedes 1.04 → 1 while it fades (react F1). `opacity-65`
 *  stays LAST: the server-HTML pins count ` opacity-65"`. */
const groupIdle = 'transition-[opacity,scale] opacity-65';
/** Current: the settled 1.04 in the TRANSITIONED `scale` property, the
 *  overshoot in the animation's `transform` (KEEP-IN-SYNC with the
 *  `--animate-forward` keyframes), and opacity alone eased, so on entry the
 *  scale jumps and the group is drawn at exactly 1.0 (react F1). */
const groupCurrent =
  'scale-104 transition-opacity animate-forward motion-reduce:animate-none';
/** A group's stretch of line: from its dot's centre down, 2px, on the left. */
const stretchClasses =
  'absolute start-1.25 top-4.5 w-0.5 transition-colors motion-reduce:transition-none';
/** Down through the rail's `gap-20`, stopping one spacing unit (0.25rem)
 *  above the next group, so a stretch never runs under the next dot (D50) —
 *  KEEP-IN-SYNC: 20 − 1. */
const stretchReach = '-bottom-19';
/** The last group's stretch: to its own box's end. */
const stretchEnd = 'bottom-0';
const stretchIdle = 'bg-line';
const stretchCurrent = 'bg-accent-decorative';
/** The dot's geometry and its reduced-motion switch, in both states. WHICH
 *  properties its 150ms clock eases is the state's, as for the group (the
 *  header's THE CLOCKS). */
const dotClasses =
  'absolute start-0 top-3 size-3 rounded-full ring-4 ring-page motion-reduce:transition-none';
/** At rest: grey, and easing its colour AND scale, so a dot that has just
 *  lost the light shrinks 1.25 → 1 as it greys. `bg-line` stays LAST: the
 *  server-HTML pin counts ` bg-line"` on stretches and dots alike. */
const dotIdle = 'transition-[background-color,scale] bg-line';
/** Current: its colours eased alone, so the `scale-125` lands at once and
 *  `animate-pop` draws the dot from its own first keyframe, as before. */
const dotCurrent =
  'transition-colors scale-125 bg-accent-decorative animate-pop motion-reduce:animate-none';
/** The year's own classes, after ui/Heading's step + tone (slot merge). */
const yearClasses = 'transition-colors motion-reduce:transition-none';
/** The list: DoctorProfile's round-1 bullets; lines in ink, greyed at rest
 *  by the group's fade (the header's CONTRAST), bullets per state — the
 *  bullets switch at once, their colour sitting on each `::marker` (the
 *  header's THE CLOCKS). */
const listClasses =
  'mt-3 flex list-disc flex-col gap-3 ps-5 transition-colors motion-reduce:transition-none';
const listIdle = 'text-ink marker:text-ink-muted';
const listCurrent = 'text-ink marker:text-accent-decorative';

export function CourseTimeline({ groups }: CourseTimelineProps): ReactElement {
  const prefix = useId();
  const idOf = (group: CourseGroup): string => `${prefix}-${group.year}`;
  const [spy] = useState(() =>
    createScrollSpy({
      ids: groups.map(idOf),
      line: 'middle',
      topFallback: 'none',
    }),
  );
  const { current } = useSyncExternalStore(
    spy.subscribe,
    spy.getSnapshot,
    spy.getServerSnapshot,
  );

  useEffect(() => {
    spy.start();
    return () => spy.dispose();
  }, [spy]);

  return (
    // THE RAIL (the header's RAIL paragraph): the column of groups, each
    // carrying its own stretch of line. `mt-*` and `gap-20` are the section
    // owning ALL child spacing (§6.4).
    <div className={railClasses}>
      {groups.map((group, index) => {
        const id = idOf(group);
        const isCurrent = current === id;
        const isLast = index === groups.length - 1;
        return (
          // Keyed by the year — unique per doctor by construction of
          // `coursesByYear` (the band's KEYS paragraph). `data-current` only
          // while current, never in the server HTML (§16 rule 2).
          <div
            key={group.year}
            id={id}
            data-current={isCurrent ? '' : undefined}
            className={cx(groupClasses, isCurrent ? groupCurrent : groupIdle)}
          >
            {/* THE STRETCH — this subsection's piece of the line, FIRST so
                the dot paints over it; grey at rest, the accent when current
                (D44c). Pure paint. */}
            <span
              aria-hidden="true"
              className={cx(
                stretchClasses,
                isLast ? stretchEnd : stretchReach,
                isCurrent ? stretchCurrent : stretchIdle,
              )}
            />
            {/* THE DOT — on the line, grey at rest, the accent and bigger
                when current, popping as it lights (D35, D36). Pure paint. */}
            <span
              aria-hidden="true"
              className={cx(dotClasses, isCurrent ? dotCurrent : dotIdle)}
            />
            {/* THE YEAR — a real <h3> (D15) on the `section` step (D44a); the
                ink is the ATOM's tone, never a className (§6.8):
                `accent-idle` at rest, `accent` current, the same bold either
                way. */}
            <Heading
              size="section"
              tone={isCurrent ? 'accent' : 'accent-idle'}
              asChild
            >
              <h3 className={yearClasses}>{group.year}</h3>
            </Heading>
            <ul
              role="list"
              className={cx(listClasses, isCurrent ? listCurrent : listIdle)}
            >
              {group.courses.map((line) => (
                // Keyed by the line itself: finished, distinct sentences (the
                // data test pins them unique), never an index. The ink comes
                // from the list, so it switches in one place.
                <li key={line} className="text-lg">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
