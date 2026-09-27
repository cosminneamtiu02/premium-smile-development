import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { StatNumber, type CountFrames } from './StatNumber';

// sections/DoctorStats — the doctor page's „în cifre" band: a second lilac
// ground under the courses, an eyebrow over a centred <h2> and a lead
// sentence, then a row of tiles — a line icon in a white disc, a big number
// that counts up once, a serif label and one sentence. Built to the round-2f
// composition contract of the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages/round2/DoctorStats.md);
// the D-numbers below are that round's ledger decisions (§17.7 — the anchors
// other files quote, never a line number).
//
// Owner's brief, 2026-09-25/26, verbatim: "a section below cursuri si
// specializari, another lila section like the one below" — the reference's
// shape: „Excelență confirmată în timp" over a lead sentence, then FOUR tiles
// („Ani de experiență", „Pacienți", „Cursuri", „Intervenții reușite") — and
// "I want each page to be populated like a dumb component." (The reference's
// title and its claims were rewritten to descriptive copy in round 2s, the
// owner's CMSR pass, 2026-09-27: „Experiență confirmată în timp",
// „Intervenții"; tests/unit/cmsr-scan.test.ts keeps them so.)
//
// ── D30 · DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero/DoctorProfile shape
// (the round-1 ledger's D1). Every string arrives FINISHED and translated:
// the eyebrow, the title, the lead and the `atLeast` word (the SUFFIX, SPOKEN
// paragraph below) are the page's `team.doctor.stats.*` keys, and each tile's
// number, label and sentence are facts about the doctor that travel with him
// in lib/team (D32). The icon arrives as a ReactNode — the page picks the
// glyph for the tile's `StatIcon` id — so this file imports NO glyph and
// knows no doctor: it could not tell „Pacienți" from „Patienten" if it
// tried. No t(), no message key, no `Locale`, no lib data.
//
// ── `format` IS THE PAGE'S, AND IT IS CALLED HERE, ON THE SERVER. A number
// becomes the visitor's digits through `Intl.NumberFormat(locale).format`
// (§8.3) — „3.000" in Romanian and German, „3,000" in English, „3 000" in
// French — and that is a question of the LOCALE, which only the page knows;
// the band never formats. But the count-up lives in a client island
// (StatNumber.tsx, D31), and a function cannot cross into one: React refuses
// to serialize it, and the static export would fail on the doctor page
// (ReviewsCarousel's WHAT CROSSES THE BOUNDARY paragraph, the precedent). So
// `countFrames` below runs the page's formatter HERE, once per step of the
// count, and hands the island finished strings. Recorded as contract friction
// — the contract drew `format` as an island prop — and resolved without
// changing this band's public API by one character.
//
// ── THE SUFFIX, SPOKEN — `atLeast` (the owner's decision, 2026-09-27, round
// 2s). A tile's number reads „3.000+" on screen, and NVDA, JAWS and VoiceOver
// read the sign as "plus": „3.000 plus" names the glyph, not what it means.
// The owner wants the meaning said out loud, so the island's sr-only twin
// reads „peste 3.000" (ro), "over 3,000" (en), „über 3.000" (de), « plus de
// 3 000 » (fr), « oltre 3.000 » (it). The WORD is the page's
// `team.doctor.stats.atLeast` key, arriving here FINISHED as the REQUIRED
// `atLeast` prop: never a data field (it is a fact about the language, not
// about the doctor, so it has no place in lib/team's rows) and never a string
// inside the island (§8.1: StatNumber knows no language). The band composes
// each tile's SPOKEN final here, ON THE SERVER, with the same formatter that
// spells the digits,
//       tile.suffix ? `${atLeast} ${format(tile.value)}` : format(tile.value)
// and hands the island that one finished string as `spoken`: no formatter
// and no loose word crosses the boundary (the `format` paragraph's rule, the
// `countFrames` precedent). A tile without a suffix is an exact count and is
// spoken as its number alone („10"). The eye and the ear now get different
// text ON PURPOSE: the visible, aria-hidden span keeps „3.000+", the twin
// says „peste 3.000" (StatNumber.tsx's THE TWIN paragraph).
//   · ONE SUFFIX, ONE WORD. lib/team's row type allows exactly one suffix,
//     `'+'`, and the band reads any suffix a tile carries as that "+", "at
//     least". A second suffix kind (a "%", a "k") would need a second word
//     beside `atLeast`: a named trigger, not built.
//   · THE WORD FIRST, IN ALL FIVE. Every language here puts the word BEFORE
//     the number, so one order serves all five. A locale that puts it after
//     would need an ICU pattern with a `{number}` argument in place of the
//     bare word (§8.2: interpolation, never fragments): a second named
//     trigger, not built.
//
// ── THE GROUND IS sections/TintedBand (D29): the 30 % lilac and the Hero's
// two ten-stop fades, extracted from DoctorProfile at this, its second
// consumer (§4's sharing table, first row). This band names itself through
// it — `aria-labelledby` → the <h2>'s generated id, a named `region` — which
// is exactly why TintedBand passes the naming attributes through while
// DoctorProfile refuses them in its own props. Everything below sits inside
// TintedBand's ui/Container; the vertical rhythm is OURS, on the first box
// inside it, because an element cannot query its own size (the Container
// cannot carry its own container-stepped `py`): `py-12 @lg:py-16 @3xl:py-20`,
// DoctorCourses' rhythm, so the page's two lilac bands and the white one
// between them breathe alike. NO OUTER MARGIN (§6.4): the page owns the space
// between bands.
//
// ── THE OPENER IS CENTRED, AND EVERY CENTRING IS PER ELEMENT (§15.15 b, the
// text-align board). sections/SectionHeading `align="center"` centres its own
// box and title; the lead is a <p> that carries its own `text-center`; in each
// tile the number <p>, the <h3> and the description <p> each carry theirs.
// The <li> centres its children as BOXES (`items-center`) and never as text —
// no wrapper-level blanket, `[&_p]:` spellings included. The suite walks every
// element and pins exactly where `text-center` lives. The opener's column is
// capped at `max-w-3xl` (48rem) and centred with `mx-auto`: the lead is one
// long sentence, and at the laptop's 1229px column it would otherwise run
// ~130 characters wide — far past a comfortable measure for §1's older
// reader.
//
// ── THE TILES — ORDER, THEN DRESS. Inside the <li>, the reference's order ON
// SCREEN: disc → number → label → description. In the DOM the label comes
// before the number (the next bullet says why). All of it sits in a REAL list
// (`<ul role="list">` — four equal tiles are a list; the `role` survives
// WebKit's list-style-none heuristic, the DoctorCourses precedent, eslint's
// configured exception).
//   · THE ORDER, AND WHAT IT COSTS (G2-R2 tier 2, a11y F1 — this SUPERSEDES
//     the round-2f build, whose DOM was the painted order). The DOM reads disc
//     → <h3> → number → description, and the tile's own `flex flex-col`
//     paints the reference's order back with two order utilities: `-order-2`
//     on the disc and `-order-1` on the number, the <h3> and the description
//     left at the default 0, in their DOM order. The reason is the heading
//     key. With the number above its <h3>, a screen-reader user pressing H
//     landed on „Pacienți" with the tile's one fact, its number, already
//     BEHIND them, and arrowing on read the sentence and never the number;
//     now the heading is followed by its number, then the sentence. SC 1.3.2
//     (Meaningful Sequence) holds both ways: „Pacienți, peste 3.000, Peste
//     3000 de zâmbete…" read by the DOM (the twin's words since round 2s, the
//     SUFFIX, SPOKEN paragraph) is as meaningful as „3.000+ Pacienți" seen on
//     screen. What it costs: a screen reader's highlight box climbs from the
//     <h3> to the number above it, then drops to the sentence — and nothing
//     else, because nothing in the tile is focusable, so the split between
//     DOM and paint moves no tab stop (SC 2.4.3; DoctorIntro's
//     `flex-col-reverse` + `-order-1` on the doctor's name is the same move).
//     The suite pins the DOM order and the two order tokens;
//     DoctorStats.stories.tsx's plays read the painted order off the engine
//     (the number's bottom at or above the <h3>'s top).
//   · THE DISC — a 7rem circle (`size-28`), `bg-surface` white with a
//     `border-line` ring, the glyph at 3rem through the README's
//     parent-owns-geometry rule (`[&_svg]:size-12`, which outranks the
//     glyph's own size class by specificity) in `text-cta` — every disc on
//     this site is the green CTA family (ClinicLocation's decision; the
//     lavender is decorative only, §15.1). MEASURED on this ground, and worth
//     knowing before a pack review: the tint is rgb(212 207 220); the white
//     disc stands off it at 1.53:1, and `line` (#d8d4cf) sits at 1.03:1
//     against the tint and 1.48:1 against the white — so the ring reads as
//     the disc's own soft edge rather than as a separate grey circle.
//     (`line-subtle` would be 1.24:1 against the white and 1.23:1 against
//     the tint, a midpoint that draws no edge at all.) A visibly separate
//     ring would need a darker token than the tint — the owner's call, one
//     class. The whole disc is `aria-hidden`: decoration, and the glyph
//     inside is aria-hidden by its own default as well. The glyph's
//     `text-cta` on white is 4.5:1.
//   · THE NUMBER — ui/Heading's `page` step on a <p> through `asChild`
//     (36px, ink-strong — display text; a stat is not a heading OF anything,
//     so it takes the look and not the outline), `tabular-nums` so the digits
//     keep their width while they count, `text-center`. Inside it the island.
//     THE ONE LEVER: 36px is the `page` step; the reference's number is
//     ~48px. A bigger number is a NEW Heading step, and ui/Heading grows one
//     step per measured consumer (its header) — this band would be that
//     consumer. Not built without the owner's word.
//   · THE LABEL — an <h3> on ui/Heading's `title` step (20px) through
//     `asChild`, `text-center hyphens-none`: a title breaks between words,
//     never inside one (the §15.14 rider's reasoning for control labels,
//     applied to a one- or two-word heading). The outline: page <h1> (the
//     doctor's name) → this band's <h2> → one <h3> per tile, no gaps (§9).
//   · THE DESCRIPTION — ui/Text `tone="muted"` (a <p>), `text-center` through
//     the className merge (§6.8: it lands on the host element). Measured ink
//     on the tint: `ink-muted` 4.8:1, `ink-strong` 11.7:1 (TintedBand's D23
//     paragraph), both over §9's 4.5:1.
//
// ── THE STEPS, MEASURED ON ui/Container's COLUMN (§6.5 — no media query in
// this file). At §7's sampling points the column is 256 (320) · 312 (390) ·
// 614 (768) · 1024 (1280) · 1229 (1536) · 1536 (1920):
//   · below `@md` (28rem = 448px) — ONE column, one tile above the other (the
//     D21 rider: what stands side by side on the wide step stacks below it);
//   · `@md` to `@3xl` — TWO per row (the tablet: two tiles of ~287px);
//   · from `@3xl` (48rem = 768px) — FOUR on one row, `gap-8` (the notebook:
//     232px tiles; the laptop: 283px). At the step itself a tile is 168px
//     wide, and round 2f's „Intervenții reușite" took two lines (round 2s
//     shortened it to „Intervenții") — a label wraps between words, which
//     `hyphens-none` guarantees.
// A doctor with fewer than four tiles leaves the rest of the row empty; the
// grid does not stretch three tiles over four columns' worth of width.
//
// ── NO TOKEN MAY PUSH THE PAGE SIDEWAYS (§7 — found by the PseudoLocale
// story, measured on round 2f's lead: its 70-character run of `·` padding,
// one unbreakable token, laid the band out 418px wide in a 375px window;
// round 2s's shorter lead pads to 49). The
// lead and every description carry `wrap-anywhere` (overflow-wrap: anywhere)
// on the element, and the choice between the two overflow-wrap values is the
// layout's, not taste. ui/Modal's slot picked `break-word` plus a zero
// minimum width, because its long word sits in a flex ROW; here the long
// token sits in two SHRINK-TO-FIT boxes — the opener column is centred by
// auto margins, so it is sized fit-content, and each description is a
// centred flex item inside a grid track that sizes itself from its items'
// min-content — and `break-word` does not lower min-content, so both boxes
// would still be as wide as the token. `anywhere` does, and in a box whose
// width comes from the space available it breaks a word only when the word
// cannot fit a line on its own — ordinary prose still wraps at spaces and at
// the hyphenation points §15.14 gives it. Real text rarely needs it (a
// German compound the dictionary lacks, a pasted address); the pseudo stress
// is the frame that proves it holds. The labels need none: `hyphens-none`
// keeps a title whole, and the data test caps an unbreakable label token at
// 21 characters (D32).
//
// ── NO BRANCHES. `tiles` empty is a page bug, not a state: lib/team's data
// test pins at least one stat per doctor (D32), so this band renders what it
// is given. Tiles are keyed by their `id`, never an index.
//
// ── Server-safe and zero-JS apart from the island: no 'use client', ONE hook
// (the server-safe useId, for the heading's id), no state, no handler. The
// suite proves it from the source text.

/** One tile — every field finished and already in the visitor's language. */
export type DoctorStatTile = Readonly<{
  /** Stable key — React's list key. No DOM id is emitted: nothing points at a
   *  tile, so the key is all the id this list needs today. */
  id: string;
  /** The decorative glyph inside the disc — a whole-svg glyph component
   *  instance from src/assets/glyphs (aria-hidden by default). */
  icon: ReactNode;
  /** The FINAL number, an integer ≥ 0 — the island counts up to it; the
   *  static HTML prints it. `countFrames` refuses anything else with a
   *  RangeError, so a bad tile fails `next build` (its JSDoc). */
  value: number;
  /**
   * Printed after the number ON SCREEN, finished text ("+"), or absent;
   * lib/team's rows allow `'+'` alone, meaning "at least". Never spoken: the
   * sr-only twin says the band's `atLeast` word BEFORE the number instead
   * („peste 3.000", the header's SUFFIX, SPOKEN paragraph), and a tile
   * without a suffix is spoken as its number alone. The G2-R2 tier 2 record
   * that stood here (the twin's „3.000+" read "plus" by NVDA, JAWS and
   * VoiceOver in all five languages, an explicit word left as the owner's
   * call) is superseded by the owner's word, 2026-09-27 (round 2s).
   */
  suffix?: string;
  /** The tile's title, finished text — becomes the <h3>. */
  label: string;
  /** One sentence, finished text. */
  description: string;
}>;

type DoctorStatsOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1). */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name. */
  title: string;
  /** One sentence under the title, centred. */
  lead: string;
  /** The tiles, 1..n, in the page's order (four on the demo doctors). */
  tiles: readonly DoctorStatTile[];
  /**
   * Turns a number into the visitor's digits — `Intl.NumberFormat(locale)
   * .format` from the page (§8.3). The band never formats (a "3.000" vs
   * "3,000" question is the locale's); it CALLS this on the server for every
   * value and for every step of the count (the header's `format` paragraph).
   */
  format: (value: number) => string;
  /**
   * The word a screen reader hears for a tile's „+", finished text from the
   * page's `team.doctor.stats.atLeast` key (§8.1): „peste" (ro), "over" (en),
   * „über" (de), « plus de » (fr), « oltre » (it). The band puts it BEFORE
   * the formatted final value in the sr-only twin of every tile that carries
   * a suffix, `${atLeast} ${format(value)}` = „peste 3.000", while the screen
   * keeps showing „3.000+". It names the ONE suffix the data shape allows
   * (`'+'`, "at least"); a second suffix kind would need a second word, a
   * named trigger not built (the header's SUFFIX, SPOKEN paragraph).
   */
  atLeast: string;
}>;

export type DoctorStatsProps = DoctorStatsOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as the props above; without the Omit a caller
  // could nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). `title` leaves the native side with the own props: it is a
  // real HTML attribute (a tooltip), and the two meanings would otherwise
  // intersect into something that is neither. The two ARIA naming attributes
  // leave too: the band's name is its <h2>'s text ALONE, and a caller's pair
  // would silently replace the component's own. React 19 carries `ref` inside
  // these props, so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorStatsOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/**
 * How many equal slices of the island's count the curve is sampled at: 45 =
 * 30 steps a second over StatNumber's 1.5 s — a new number every ~33 ms, every
 * other frame on a 60 Hz screen, which reads as a smooth count at the speed
 * the digits move. KEEP-IN-SYNC with `COUNT_DURATION_MS` in StatNumber.tsx:
 * the island maps its duration onto however many frames it is handed, so the
 * two only agree about "30 a second" while they move together — and that
 * RELATION is pinned, not only the two values: StatNumber.test.tsx's
 * `samples the count at 30 steps a second` (G2-R2 tier 2, typescript F2).
 */
const COUNT_STEPS = 45;

/**
 * The count, as the strings the visitor will see — made HERE, on the server,
 * with the page's own formatter, because a formatter cannot cross into the
 * island (the header's `format` paragraph). Step `i` of COUNT_STEPS shows
 * `value` eased by ease-out cubic, `1 − (1 − t)³` at `t = i / COUNT_STEPS`,
 * rounded to a whole number: fast at the start, settling slowly onto the
 * final value, so the last digits are readable before they stop. The LAST
 * frame is `format(value)` itself — never the curve's float at t = 1 — so
 * the final text is exactly what the static HTML prints, and the very number
 * the screen reader hears inside the tile's spoken form (the header's SUFFIX,
 * SPOKEN paragraph). Exported for the suites; the band is its only caller.
 *
 * @throws RangeError when `value` is not an integer ≥ 0 (G2-R2 tier 2,
 * typescript F1). The curve is rounded to whole numbers, so a fraction would
 * settle on the whole number below it and then jump to „6,5" on the last
 * frame, a negative value would print „-0" on the way up, and NaN would print
 * „NaN" 46 times. Negative zero needs its own clause: `Number.isInteger(-0)`
 * is true and `-0 < 0` is false, so the first two tests let it through, yet
 * `Intl.NumberFormat` prints it „-0" (on every frame, the final one included),
 * hence `Object.is(value, -0)`. The message spells it „-0" too, because a
 * template literal would print `-0` as "0", a value this guard accepts. This
 * runs on the SERVER, while the static export renders the doctor page, so a
 * bad tile kills `next build` at the call site instead of shipping a count
 * that lies (lib/scroll-spy's `createScrollSpy` is the precedent for refusing
 * at construction). lib/team's data test pins the same rule for the rows it
 * ships; this guard covers every other caller.
 */
export function countFrames(
  value: number,
  format: (value: number) => string,
): CountFrames {
  if (!Number.isInteger(value) || value < 0 || Object.is(value, -0)) {
    throw new RangeError(
      `countFrames: value must be an integer ≥ 0, got ${Object.is(value, -0) ? '-0' : value}`,
    );
  }
  const rising = Array.from({ length: COUNT_STEPS }, (_, step) => {
    const progress = step / COUNT_STEPS;
    return format(Math.round(value * (1 - (1 - progress) ** 3)));
  });
  return [...rising, format(value)];
}

export function DoctorStats({
  eyebrow,
  title,
  lead,
  tiles,
  format,
  atLeast,
  className,
  ...rest
}: DoctorStatsProps): ReactElement {
  const headingId = useId();

  return (
    // `{...rest}` rides FIRST so a stray attribute can never replace the name
    // pair; TintedBand merges className caller-last (§6.8).
    <TintedBand {...rest} aria-labelledby={headingId} className={className}>
      {/* The rhythm box — band-owned `py` on container steps (the header's
          GROUND paragraph), and the gap between the opener and the tiles. */}
      <div className="flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20">
        {/* THE OPENER — capped and centred as a BOX; each text centres
            itself (the header's CENTRING paragraph). */}
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <SectionHeading
            level={2}
            id={headingId}
            eyebrow={eyebrow}
            title={title}
            align="center"
          />
          <p className="text-lg text-ink-muted text-center wrap-anywhere">
            {lead}
          </p>
        </div>
        {/* THE TILES — one column, two from `@md`, four from `@3xl` (the
            header's STEPS paragraph). `role="list"` is load-bearing in
            WebKit (the header's TILES paragraph). Each tile's DOM is disc →
            label → number → description, painted disc → number → label →
            description (the header's ORDER bullet). */}
        <ul
          role="list"
          className="grid gap-10 @md:grid-cols-2 @3xl:grid-cols-4 @3xl:gap-8"
        >
          {tiles.map((tile) => (
            <li key={tile.id} className="flex flex-col items-center gap-4">
              {/* THE DISC — decoration (the header's DISC paragraph); painted
                  first by `-order-2`. */}
              <span
                aria-hidden="true"
                className="-order-2 flex size-28 items-center justify-center rounded-full border border-line bg-surface text-cta [&_svg]:size-12"
              >
                {tile.icon}
              </span>
              {/* THE LABEL — the tile's <h3>, FIRST in the DOM after the
                  decoration, so a heading jump lands before the number. */}
              <Heading
                size="title"
                asChild
                className="text-center hyphens-none"
              >
                <h3>{tile.label}</h3>
              </Heading>
              {/* THE NUMBER — the `page` step on a <p>; the island inside;
                  painted above the label by `-order-1`. The island gets the
                  frames to SHOW and, in `spoken`, the one finished string to
                  be HEARD (the header's SUFFIX, SPOKEN paragraph). */}
              <Heading
                size="page"
                asChild
                className="-order-1 tabular-nums text-center"
              >
                <p>
                  <StatNumber
                    frames={countFrames(tile.value, format)}
                    suffix={tile.suffix}
                    spoken={
                      tile.suffix
                        ? `${atLeast} ${format(tile.value)}`
                        : format(tile.value)
                    }
                  />
                </p>
              </Heading>
              {/* THE DESCRIPTION — a muted <p>, centred on the element. */}
              <Text tone="muted" className="text-center wrap-anywhere">
                {tile.description}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </TintedBand>
  );
}
