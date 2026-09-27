'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { prefersReducedMotion } from '@/lib/reduced-motion/reduced-motion';

// sections/DoctorStats/StatNumber — THE ISLAND: one tile's number, counting up
// from 0 the first time the visitor scrolls it into view. Built to the
// round-2f composition contract of the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages/round2/DoctorStats.md);
// D31 in that round's ledger is the decision this file implements, D30 the
// band around it (DoctorStats.tsx).
//
// ── WHY THE BAND IS SPLIT IN TWO FILES (the ReviewsCarousel/ReviewsDeck and
// PriceList/PriceMenu precedent). DoctorStats.tsx is a SERVER component — the
// heading, the lead, the four discs, the labels and the sentences compile to
// inert HTML (§16) — and only the thing that needs the browser crosses into
// this file: a number that changes after the page has loaded. §16's rule is
// "the smallest possible client island", and this is it: two <span>s, one
// state variable, one effect. Nothing here calls t() or knows a language.
//
// ── WHAT CROSSES THE BOUNDARY: STRINGS, NEVER A FORMATTER (contract friction,
// reported). The contract drew this island's props as `{ value, suffix,
// format }`, with `format` the page's `Intl.NumberFormat(locale).format`. A
// function cannot cross a server→client boundary — React refuses to serialize
// it into the flight payload, and `next build` fails on the doctor page the
// moment the server band hands one over (ReviewsCarousel.tsx's WHAT CROSSES
// THE BOUNDARY paragraph: its slide names are pre-rendered for exactly this
// reason, and its suite pins that no arrow crosses). So the band calls the
// page's `format` ON THE SERVER, once per frame of the count, and hands this
// file the finished strings — `countFrames` in DoctorStats.tsx. The page's
// formatter therefore still spells EVERY number the visitor sees, the final
// one and each one on the way up (a formatter that returns `X${n}` proves it
// in StatNumber.test.tsx), and this file formats nothing: there is no `Intl`
// in it, and no way for a "3.000" here to disagree with a "3,000" there.
// What the screen reader hears crosses the same way (round 2s): `spoken`, one
// finished string the band composed on the server from the page's `atLeast`
// word and the page's formatter (THE TWIN, below), so no word crosses either.
// The price is the payload, measured rather than guessed: 46 short strings a
// tile — for the demo doctor's four tiles (6 · 3000 · 10 · 1000, Romanian
// digits) 1 029 bytes of JSON, 293 gzipped; 1 080 and 316 with the four
// `spoken` strings of round 2s; a little more once escaped inside the page's
// flight script. PriceMenu's header is the precedent for weighing
// what crosses.
//
// ── §16 RULE 2 — HYDRATION-SAFE BY CONSTRUCTION. The server HTML and the
// first client render print the FINAL value: `step` starts `null`, and null
// means "the last frame". Nothing visitor-dependent — the reduced-motion
// preference, the scroll position — is read during render; both are read in
// the effect, after mount. A crawler, a visitor without JavaScript and a
// screen reader all get the true number from the static HTML.
// The one visible consequence, accepted: a tile that is ALREADY half on
// screen when the page hydrates paints its final number first and then counts
// from 0 once. The doctor page puts this band fourth (D33), under the
// opener, the profile and the courses, so in an ordinary visit it scrolls
// into view long after hydration and the visitor sees only the count.
//
// ── THE LIFECYCLE (D31), all in one effect:
//   1. mount — if `prefersReducedMotion()` (lib/reduced-motion, the React-free
//      seam every JavaScript motion asks), do NOTHING: no observer at all, the
//      cheap path. The number is already final, and not animating it is the
//      whole reduced-motion answer. An engine without IntersectionObserver
//      gets the same: a final number. The preference is asked AGAIN in step 3,
//      because this read is not the one that decides whether the visitor sees
//      motion (G2-R2 tier 2, react F2): the count starts at the first
//      intersection, and the window between mount and that moment is
//      UNBOUNDED. The band is fourth of five on the doctor page (D33), so a
//      visitor may read for minutes before the tiles arrive, and one who
//      turns "reduce motion" on in the meantime (macOS Accessibility, Windows'
//      "Animation effects") must not get the count.
//   2. otherwise ONE IntersectionObserver on the visible <span>, threshold
//      0.5 (VISIBLE_SHARE): the count waits until half the number is on
//      screen, so it is seen from its first frame.
//   3. the first entry at or over that share disconnects the observer (the
//      one decision, taken once) and asks `prefersReducedMotion()` again:
//      reduce now, and the number simply stays final; otherwise it
//      starts ONE requestAnimationFrame loop of COUNT_DURATION_MS. Each frame
//      maps elapsed time linearly onto the frames the band sent (the EASING
//      is baked into their values — ease-out cubic, DoctorStats.tsx's
//      `countFrames`), and sets `step`. Time comes from the frame's own
//      timestamp, the first frame's being the start: a tab hidden mid-count
//      stops calling rAF, and the first frame after it returns is past the
//      end — the number lands on its final value instead of resuming a
//      stale count.
//   4. at the end `step` returns to null — the final frame, the same bytes the
//      server printed.
//   5. unmount — the observer disconnects and the pending frame is cancelled;
//      a `live` flag also mutes a callback the platform had already queued
//      (the IntersectionObserver spec delivers queued entries even after
//      `disconnect()`), and a `counted` flag makes the count run ONCE per
//      mount whatever the observer does: a stat counts once.
// `watchReducedMotion` is deliberately NOT used: two reads (steps 1 and 3)
// cover the window that matters, mount → first intersection, for one extra
// matchMedia call and no listener to add or remove. What is left unwatched is
// the count's own 1.5 s: a preference flipped DURING the count lets it finish,
// which is not worth a listener.
//
// ── THE TWIN — ACCESSIBILITY: THE SCREEN READER HEARS ONE NUMBER, ONCE. The
// visible <span> is `aria-hidden`; an `sr-only` twin carries `spoken`, the
// band's finished words for the FINAL value, at every moment. A screen reader
// that reads the tile mid-count therefore says „peste 3.000", never "0, 1,
// 2 …", and the two copies are never read together. The final frame's
// visible text and the spoken text DIFFER ON PURPOSE (the owner's decision,
// 2026-09-27, round 2s): the eye reads „3.000+", the ear „peste 3.000",
// because screen readers say the sign "plus", and „3.000 plus" names the
// glyph and not what it means. The twin renders `spoken` and NOTHING else: no
// suffix, no word of its own (this file knows no language); the words are
// the band's, composed on the server from the page's `atLeast` key
// (DoctorStats.tsx's SUFFIX, SPOKEN paragraph). SC 2.2.2 (Pause, Stop, Hide)
// does not even bind — the motion stops by itself in under five seconds — but
// the twin keeps the number STABLE for assistive technology, which a changing
// text node would not be. `tabular-nums` rides
// the band's <p> around this island, so every digit keeps its width while it
// counts and the number grows only as it gains digits.
//
// ── THE COST, SAID OUT LOUD. This is the doctor page's SECOND scripted thing
// (ui/Image's optimizer island under the opener's portrait being the first,
// PersonnelCard D11): one small client chunk — react's hooks, this function
// and lib/reduced-motion's two lines — shared by the four tiles, hydrated four
// times. §16's island list gains it in the planner's docs change (D31).
//
// ── DEPENDENCIES: react and lib/reduced-motion, nothing else. No lib data, no
// next-intl, no `Intl` (see WHAT CROSSES THE BOUNDARY) — the suite pins the
// import surface from the source text.

/**
 * The count's frames, first to last: the strings the band made with the
 * page's own formatter (DoctorStats.tsx's `countFrames`). A tuple with a
 * guaranteed LAST element, because the last frame IS the final value — what
 * the static HTML prints, what the count ends on (the screen reader hears
 * `spoken`, the band's words around the same number) — and an empty list
 * would have no number to print at all.
 */
export type CountFrames = readonly [...string[], string];

export type StatNumberProps = Readonly<{
  /** Every number the visitor may see, 0 first, the final value LAST — finished text. */
  frames: CountFrames;
  /**
   * Printed after the number on every VISIBLE frame ("+"), or absent. Never
   * in the sr-only twin, which says `spoken` instead (THE TWIN). The "plus"
   * sentence recorded in G2-R2 tier 2 (a screen reader reading the twin's
   * „3.000+" as "3.000 plus") is superseded by the owner's word, 2026-09-27
   * (round 2s).
   */
  suffix?: string;
  /**
   * What the screen reader hears, finished text the band composed on the
   * server: the page's `atLeast` word before the formatted final value for a
   * tile with a suffix („peste 3.000"), the formatted value alone for one
   * without („10"). Rendered as the sr-only twin, whole and unchanged, at
   * every moment of the count (THE TWIN).
   */
  spoken: string;
}>;

/**
 * How long the count runs, from its first frame to the final value (D31).
 * KEEP-IN-SYNC with `COUNT_STEPS` in DoctorStats.tsx: that constant samples
 * the curve at 30 steps a second OF THIS DURATION, so a change here changes
 * the step rate unless that number moves with it; the relation is pinned in
 * StatNumber.test.tsx's `samples the count at 30 steps a second` (G2-R2
 * tier 2, typescript F2). Exported for the suite —
 * it leaves a 'use client' module, so a server module importing it would
 * receive a client reference, not 1500 (the PRICE_MENU_ID lesson, §15.20
 * round 3); the band never needs it.
 */
export const COUNT_DURATION_MS = 1_500;

/** How much of the number must be on screen before it counts (D31). */
const VISIBLE_SHARE = 0.5;

export function StatNumber({
  frames,
  suffix = '',
  spoken,
}: StatNumberProps): ReactElement {
  const last = frames.length - 1;
  // null = the final frame. The initial value, so the first client render
  // prints exactly what the server printed (§16 rule 2, the header).
  const [step, setStep] = useState<number | null>(null);
  const visible = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = visible.current;
    // A single frame has nothing to count; reduced motion and a missing
    // observer both keep the final value (the header's LIFECYCLE, step 1,
    // the cheap path: reduce at mount creates no observer at all).
    if (element === null || last === 0) return;
    if (prefersReducedMotion()) return;
    if (typeof IntersectionObserver === 'undefined') return;

    let live = true;
    let counted = false;
    let frame = 0;
    let start: number | undefined;

    const tick = (now: number): void => {
      if (!live) return;
      start ??= now;
      const progress = (now - start) / COUNT_DURATION_MS;
      if (progress >= 1) {
        setStep(null);
        return;
      }
      setStep(Math.floor(progress * last));
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!live || counted) return;
        const inView = entries.some(
          (entry) =>
            entry.isIntersecting && entry.intersectionRatio >= VISIBLE_SHARE,
        );
        if (!inView) return;
        counted = true;
        observer.disconnect();
        // Asked again HERE, when the count would start: the mount-time read
        // may be minutes old (the header's LIFECYCLE, steps 1 and 3).
        if (prefersReducedMotion()) return;
        frame = requestAnimationFrame(tick);
      },
      { threshold: VISIBLE_SHARE },
    );
    observer.observe(element);

    return () => {
      live = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [last]);

  const final = frames[last];
  return (
    <>
      <span ref={visible} aria-hidden="true">
        {step === null ? final : frames[step]}
        {suffix}
      </span>
      {/* THE TWIN — `spoken`, whole; no suffix, no word of its own. */}
      <span className="sr-only">{spoken}</span>
    </>
  );
}
