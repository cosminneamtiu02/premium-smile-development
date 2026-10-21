import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';

// sections/PageHero — a page's centred hero: its <h1> over a lead paragraph,
// both centred, the two lines of the heading and the three of the lead
// stepping down like a stairway on a laptop or a desktop. Born on the blog's
// list page (sections/PostList, CLAUDE.md §15.39 rounds 2–3) and moved here
// on 2026-10-15, when the Team page took the same hero — the owner, verbatim:
// "take the hero section of the blog page with all blog articles and
// implement something similar instead of "FAMILIA PREMIUM SMILE /
// Specialiștii cu care ne mândrim" on the echipa page" and "this must take
// place only on the echipa page". Its two consumers: sections/PostList (every
// page of the blog's list) and sections/DoctorShowcase's page opener (the
// Team page alone — Home's doctors band keeps its eyebrow and <h2>).
//
// ── A SHARED COMPOSITION, PROPS-IN, ZERO KEYS (§4's sub-kinds, the
// SectionHeading shape): every string arrives finished — the copy, with its
// own line breaks and no-break spaces, is each consumer's page's, read from
// the message files there. No t(), no data, no hook, no 'use client': a
// Server Component that compiles into the page's static HTML (§16). It
// places nothing around itself (§6.4) — the band that composes it owns the
// room above it and the gap under it.
//
// ── THE BAND IT SITS IN. Every length here is a theme step and every
// regime class reads ui/Container's column, so the hero is drawn in the band
// scale of whichever band composes it, as long as that band wears ui/Container's
// two strings on the box around it (ui/Container's THE BAND SCALE and its
// recipe rule 5) — PostList's rhythm box and DoctorShowcase's both do — and
// clips nothing around it (THE HEADING'S REACH).
//
// The record of every mechanism below moved here from sections/PostList's
// header with the code, on 2026-10-15; that header keeps the BLOG's own — the
// owner's words for its hero, its copy and that copy's measurements — and
// the Team page's copy is recorded here (THE TEAM PAGE'S COPY). A number
// measured on one consumer's copy says so.
//
// ── THE HERO, CENTRED: the page's <h1> over a lead paragraph — first the
// blog's, the owner's "2 rows of ehading … and with an eyebrow of text below
// it on 3 lines both centered" (2026-10-14). The "eyebrow" is read as his
// screenshot showed it — a small grey sentence in the body face under the
// heading — and not as the house's mono micro-label: three lines of
// uppercased, wide-tracked capitals are hard reading for §1's older visitor
// (the planner's call, told to the owner). The <header> centres the two boxes
// (`items-center`) and the heading's lines (display text may inherit
// centring, §15.15 b), 3rem apart — doubled on the owner's second look at
// the blog's hero ("try doubling the space between heading and this text")
// from the 1.5rem his first look had asked for, over the first preview's
// 1rem (sections/PostList's THE BAND has his words); the lead centres its own
// lines ON THE ELEMENT, because globals.css aligns every <p> to start and a
// rule that matches the element beats an inherited value. DOM ORDER IS
// VISUAL ORDER: the <h1> first, so a screen reader that lands on it reads the
// lead, then whatever the page sets under the hero — the blog's articles, the
// Team page's doctors. ONE PER PAGE: the <h1> is the page's one (§9), so a
// page composes one hero and no other <h1>.
//   THE STAIRWAY — the owner's rule, said of the blog's hero on 2026-10-15:
//   its lines step "like a stairway downwards from title to text below"
//   (sections/PostList's THE STAIRWAY keeps his whole sentence). So on a
//   laptop or a desktop the COPY breaks its own lines: each message carries a
//   line break where the stairway turns — one in the heading, two in the lead
//   (THE COPY'S RULES) — and both blocks wear the pre-line white-space behind
//   the band scale's chain (STAIRWAY, spelled once), which keeps those breaks
//   and still wraps a line too long for its box. The heading falls in TWO
//   lines and the lead in THREE, each narrower than the one above it — the
//   heading's second line at most nine tenths of its first, the lead's second
//   at most nineteen twentieths of its first and its third at most nine
//   tenths of its second — and the heading's second line is wider than the
//   lead's first, so the steps run on from the heading into the lead (the
//   three bounds are PageHero.fixtures.ts's TITLE_STEP, LEAD_FIRST_STEP and
//   LEAD_STEP). Everywhere else — a phone, a tablet, a touch screen, a window
//   under the regime's step — the normal white-space makes each break a space
//   (CSS's segment-break rule), and both blocks wrap as prose.
//   THE HEADING'S REACH — the owner, on the blog's heading back at its old
//   size (2026-10-15): "it should not be constrained by a div so that it has
//   same space left and right as the articles seciton" (sections/PostList's
//   THE BAND SCALE has his whole sentence). On a laptop or a desktop the <h1>
//   is not held to the column: inside THE BAND SCALE alone it is as wide as
//   its longest line (REACH: a max-content width), at most the column's full
//   width plus 67.5 spacing steps — 135 design pixels a side, never more —
//   and the hero's centring places it: a flex column centres an item wider
//   than itself by letting it pass BOTH its edges by the same amount
//   (Chromium, WebKit and Firefox alike, measured on 2026-10-15), so the
//   heading stays on the column's centre line and its box passes the
//   column's two edges equally. Nothing on the way may clip it: the bands
//   that compose the hero, ui/Container and the page's <main> set no
//   overflow (and a size container does not clip) — a band that ever clipped
//   its overflow would cut the heading where it passes the column.
//   · WHY 135, AND WHAT 100 WAS. The reach was 50 spacing steps, 100 design
//     pixels a side, when the owner asked for it: room for every first line
//     the blog then shipped in Source Serif 4 (the widest, French's, 83.2
//     past the column at a 1140 window). It is 67.5 since the React review
//     of the Team page's lane (G2, measured on the built export), for the
//     slow first load (below): the widest first line in the fallback face
//     needs 134.5. Source Serif 4 never uses the difference — no first line
//     either consumer ships passes the column by more than 83.9 design pixels
//     (THE TEAM PAGE'S COPY) — so with the webfont not a pixel moved.
//   · THE GUTTER IT STAYS INSIDE. On the built page the gutter is a tenth of
//     the window beside the scrollbar and the column eight tenths, so the
//     gutter is the same 138.25 design pixels (1106 / 8) at every window from
//     the regime's step to the band's cap — G2's reading at a 1140 window,
//     112.5px against the 0.8137px design pixel of its 900px column
//     (2026-10-15); in the test runner, whose 10vw counts the scrollbar,
//     139.6 to 140.6. The reach stays 3.25 design pixels inside it, so the
//     box never reaches the window's edge and the page never scrolls
//     sideways; past the cap the band is centred in a wider column, with more
//     room still.
//   A line too long even for that box wraps inside it — the pre-line
//   white-space wraps (THE STAIRWAY) — which is what SC 1.4.12's text spacing
//   does to every first line that ships: each outgrows the reach and the box
//   stops at it (PageHero.scale.test.tsx's THE HEADING'S REACH AT ITS LIMIT).
//   The LEAD stays in the column under its own cap (THE LEAD). Off the scale
//   the heading keeps the column and its 6xl cap.
//   · ON A SLOW FIRST LOAD — TAKEN, the reach at 135 (G2 react, measured on
//     the built export). Until Source Serif 4 arrives, next/font's swap
//     display sets the heading in its fallback face, Arial at 101.16 % (the
//     built stylesheet's own declaration), whose lines run 6 to 13 % wider,
//     with no optical size to narrow them as they grow; a first line that
//     outgrows the reach wraps inside it, three lines until the webfont
//     lands and two after, and the page below moves up by the difference.
//     With the reach at 100 the Team page's cumulative layout shift was 0.200
//     on /de/team/ at 1140–1180 windows (0.035 before this lane) and 0.056
//     to 0.063 on /ro/team/; with 135 it is 0.081 to 0.084 on /de/team/ at
//     1140–1180 and 0.009 to 0.011 from 1401, and 0.009 to 0.013 on
//     /ro/team/ — under the 0.1 that counts as good at every window measured
//     — and every heading two lines in the fallback. MEASURED in the test
//     runner with that very declaration, at a 1140 window (the same in design
//     pixels at every window: Arial has no optical size), how far each first
//     line passes the column in the fallback: the Team page's Romanian 134.5
//     (1375.0 design pixels), the blog's French 131.7 (1369.4), Italian 117.9
//     (1341.9) and Romanian 112.6 (1331.3), the Team page's German 110.1
//     (1326.2), the blog's German 97.9 and English 93.6, the Team page's
//     Italian 94.2, French 75.1 and English 46.7 — all inside the 135. At 100
//     five of them wrapped, the blog's French, Italian and Romanian and the
//     Team page's Romanian and German: the heading then 197.8px tall against
//     131.9 at a 1140 window, 243.8 against 162.6 at 1401 and 335.4 against
//     223.6 at 1920 (the runner's). HALF A DESIGN PIXEL IS NO MARGIN: the
//     Team page's Romanian fits by 0.5, so a copy edit that lengthens that
//     line, or a platform whose Arial sets it wider, puts it back on three
//     lines in the fallback — the lever then a shorter first line, the reach
//     being 3.25 design pixels from the gutter.
//     NOT CURED HERE — MEASURED in the verify review (2026-10-16, the
//     webfonts held until 800 ms after the page's load): the heading's box
//     hugs its text, so on a laptop it still narrows as the webfont lands,
//     its centred edges moving in the frame the first card reflows —
//     /de/team/ 0.074 to 0.082 up to a 1300 window, 0.096 to 0.100 with the
//     language banner on screen (develop 0.033 to 0.042) — and on a PHONE,
//     where the reach does not apply, the German heading takes four lines in
//     the fallback and three in the webfont (/de/team/ 0.182 at 430, develop
//     0.061) and the Italian first card's reflow moves the ribbon (0.179 to
//     0.206 at 412–430); at 360 both are better than develop. The levers are
//     site-wide and the owner's — next/font's fallback metrics or its
//     optional display — CLAUDE.md §15.25 round 4 (7).
//   ON A PHONE'S OR A TABLET'S COLUMN — under the Container's 48rem step,
//   windows narrower than about 975px on the built page behind a classic
//   scrollbar (979 in the test runner, whose 10vw counts the scrollbar; 960
//   without one) — both blocks wear CSS pretty wrapping (`@max-3xl:`),
//   which mends a short last line where it can. Never from the
//   step up: WebKit's `pretty` re-balances a whole block (measured on the
//   blog's first copy, 2026-10-14, when it evened the Romanian lead's three
//   lines out at a laptop's widths), and the stairway wants its lines where
//   the copy breaks them. `pretty` is no guarantee either: Chromium weighs a
//   short last line against ragged ones and kept the blog's first Italian
//   draft's lone „cura" at 744–900px — hence the no-break spaces every copy
//   carries (THE COPY'S RULES).
//   THE <h1>: ui/Heading's `hero-scaled` step — §15.24's one h1 step,
//   `hero`, as it reads in a band that scales — worn through `asChild` by a
//   real <h1>, the page's one (§9), 65.04 design pixels inside the scale
//   (THE ONE SIZE THE REMAP CANNOT REDRAW, next) —
//   `hyphens-none`, so a word of the title never splits at a syllable
//   (DoctorIntro's name, the numbers band's title); its belt `wrap-anywhere`,
//   which breaks only a word too long for a line by itself (DoctorStats'
//   TITLE paragraph) — and capped at the 6xl container step, 1152px, off the
//   scale; inside it the heading's reach takes the cap's place (THE
//   HEADING'S REACH).
//   THE ONE SIZE THE REMAP CANNOT REDRAW is the <h1>'s: ui/Heading's `hero`
//   step is a VIEWPORT clamp. So the title wears ui/Heading's `hero-scaled`
//   step: `hero`'s row, and inside the scale `hero`'s value at the owner's
//   1401 window, 16 + 3.5 × 14.01 = 65.035px, as 16.26 spacing steps, 65.04
//   design pixels — sections/DoctorIntro's doctor's name's size, and
//   sections/PostHeader's article title's — behind the band scale's own
//   chain, which for this <h1> reads ui/Container's column as every regime
//   class here does. The step is spelled ONCE, in the atom (its header's
//   'hero-scaled' JOINED): tests/unit/design-scale.test.ts holds the size to
//   that one file and the three <h1>s that ask for it, this one among them,
//   to the step, and this hero spells no size. What browser zoom does to that
//   size is the step's own trade, still OPEN and the owner's (ui/Heading's
//   THE ZOOM TRADE, BACKLOG.md entry 2, item (a)). The hero once spelled the
//   class itself, LAST on its <h1> (the blog list's since 2026-10-14), a
//   KEEP-IN-SYNC pair with the doctor's name; an article's title was its
//   third consumer, the trigger the census had booked for the step, which
//   joined on 2026-10-15. The Team page, which wears the hero through this
//   file, is no fourth: one file asks, however many pages wear it.
//   (sections/PostList's THE BAND SCALE records the few hours of 2026-10-15
//   when the blog's heading wore 56 design pixels of its own.)
//   THE LEAD: ui/Text, muted — the grey sentence of the owner's screenshot —
//   capped at 123 spacing steps, 492px, 492 design pixels in the scale, and
//   `hyphens-none` like the heading: the site's `hyphens: auto` (§15.14) lets
//   Chromium's Romanian dictionary on macOS break words where no syllable
//   ends („sfatur-ile", „med-icilor", „îng-rijești" — measured on the blog's
//   Romanian lead), and a word of the hero is never split. The heading's
//   belt too, `wrap-anywhere` (G2 a11y, 2026-10-14): `hyphens-none` alone
//   would leave a word wider than the column — at a very large text size —
//   pushing the page sideways; at an ordinary size it breaks nothing (every
//   line of the blog's copy, in every language, measured the same with and
//   without it), and Chromium's `pretty` mends the same last lines under it.
//   THE CAPS ARE LIMITS. Inside the scale the copy chooses the lines, and
//   each line must fit its box, or it would wrap into a line the stairway
//   does not have: the heading's box reaches at most the column plus 135
//   design pixels a side, 1376 (THE HEADING'S REACH — the 6xl cap, 1152,
//   would be the narrower, so inside the scale the reach takes its place),
//   the lead's its cap, 492. A copy's tightest lines are measured at the
//   regime's narrowest design pixel, a 1140 window, where the smaller type's
//   optical size sets text widest — Chromium's numbers, the test runner's:
//   the blog's in sections/PostList's THE CAPS (WebKit and Firefox measured
//   within 0.23 % of them), the Team page's in THE TEAM PAGE'S COPY
//   (Chromium alone). Off the scale the caps shape the prose.
//   · THE TESTS' NARROWEST WINDOW IS 1160, not 1140 (PageHero.scale.test.tsx's
//     NARROWEST): behind the test runner's classic 15px scrollbar a 1140
//     window's column is 897px, one pixel past the regime's 896px step — too
//     thin a premise to stand a case on; 1160's column, 913px, clears the
//     step with room on any runner (911 behind a 17px scrollbar, 928 with
//     none), its design pixel 1.8 % over 1140's — still the narrow end, where
//     a copy's lines run tightest. Every 1140 figure in this header is a
//     measurement; the tests' cases start at 1160.
//
// ── THE COPY'S RULES — what every copy a page hands the hero obeys. The
// message files carry it, never this composition, and PageHero.scale.test.tsx
// holds every copy that ships to the first rule and to what the others
// protect — no lone last word, no line opening on punctuation, no word cut —
// at every width it samples.
//   · ONE line break (`\n`) in the title and TWO in the lead, each where the
//     stairway turns, between two words — never beside a space, never at
//     either end — and no other character that breaks a line: a carriage
//     return is a space to CSS (and a CRLF copy would hang one beside every
//     break), and U+2028 and U+2029, mandatory breaks to Unicode's
//     line-breaking rules, break no line in Chromium under either white-space
//     (measured, 2026-10-15).
//   · THE NO-BREAK SPACES (U+00A0) are the copy's: a short word stays with its
//     neighbour where a break between them reads badly — the clitic or the
//     pronoun with its verb, the one-letter word with what it introduces —
//     and the LAST TWO WORDS of each block are joined, so neither block can
//     end on a single word at any width, measured or not (the owner's "no
//     one-word last line anywhere"). None stands beside a line break: a
//     no-break space never collapses, so it would hang at the end of a line
//     or open the next.
//   · French joins its colons to the word before them with U+202F, the narrow
//     no-break space French typesetting puts there: after a plain space
//     Chromium breaks before the colon (measured on the blog's French
//     heading).
//   · A joined unit stays SHORT, narrower than a 320 phone's column, or the
//     belt cuts the word itself (measured on a French candidate of the
//     blog's, „l'entreteni | r").
// The blog's no-break spaces are listed in sections/PostList's THE NO-BREAK
// SPACES; the Team page's copy follows the same rules (THE TEAM PAGE'S COPY).
//
// ── THE TEAM PAGE'S COPY (src/messages/*.json `team.hero.title` and
// `team.hero.lead` — Claude's drafts in five languages, flagged for the
// owner, §15.17), measured in the test runner (Chromium, the real faces, its
// classic 15px scrollbar) on the copy as the lane leaves it: at the owner's
// 1401 window, the heading's two lines then the lead's three, in design
// pixels — Romanian 1251.1 / 999.1, 392.7 / 279.9 / 182.7; English 1071.9 /
// 874.4, 402.3 / 293.9 / 201.9; German 1189.7 / 933.1, 435.2 / 290.6 /
// 186.1; French 1131.5 / 960.1, 408.8 / 346.5 / 211.8; Italian 1196.0 /
// 1010.3, 340.5 / 232.6 / 191.0. Its <h1> passes the column by at most 83.9
// design pixels a side (Romanian, at a 1140 window), well inside the reach's
// 135 (English's stays inside the column, 7.1 short of its edges); its widest
// lead line at 1140 is German's first, 447.8, under the lead's 492. The copy
// moved twice in the lane: the leads lost „familia Premium Smile", which the
// owner had said "sounds particularly toxic" (BACKLOG.md entry 4), and then,
// on the accessibility review, four leads put the time phrase next to the
// knowing it qualifies, and the Italian heading was reworded; the numbers
// above are the last copy's. In the fallback face, before Source
// Serif 4 arrives, every first line fits the reach, the Romanian by half a
// design pixel (ON A SLOW FIRST LOAD). PageHero.scale.test.tsx holds all
// five, beside the blog's, to every rule above — the stairway at every
// window it scales at, from 1160 to 2560, and no lone last word on eight
// phones, a 768 tablet and the 1024 and 1100 laptop windows.

export type PageHeroProps = Readonly<{
  /**
   * The page's <h1>, finished text with ONE line break where the stairway
   * turns (e.g. „Echipa noastră: specialiștii cu care ne mândrim" + `\n` +
   * „și oamenii care te întâmpină la clinică"): the break holds inside the
   * band scale and is a space everywhere else (THE STAIRWAY; the copy's own
   * no-break spaces and the rest of THE COPY'S RULES).
   */
  title: string;
  /**
   * The paragraph under the heading, finished text with TWO line breaks,
   * held and collapsed exactly like the title's.
   */
  lead: string;
}> &
  // The native <header> surface, minus `title` (a real HTML attribute — a
  // tooltip — whose meaning would otherwise intersect the heading's),
  // `children` and `dangerouslySetInnerHTML` (the content arrives as the two
  // strings, and React throws on markup set beside children), `role` (a
  // `role="banner"` would make the hero a second banner landmark beside the
  // shell's header) and `aria-label` / `aria-labelledby` (inside <main> or a
  // <section> — every hero's place — a <header> is a GENERIC element, which
  // ARIA forbids to name, axe's aria-prohibited-attr; the hero says what it
  // is through its own <h1> — the verify review, 2026-10-16). The last three
  // are reset after the spread too (THE NATIVE SURFACE, below). React 19
  // carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'header'>,
    | 'title'
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** THE HERO: both boxes centred, 3rem apart, and the heading's lines centred
 *  with them — the centring that also places a heading wider than the column
 *  on its centre line (THE HEADING'S REACH). */
const HERO = 'flex flex-col items-center gap-12 text-center';

/** THE STAIRWAY: inside THE BAND SCALE alone, the copy's own line breaks
 *  hold — the pre-line white-space, behind the band scale's own chain — so
 *  the heading's two lines and the lead's three fall where the message files
 *  break them. One spelling, worn by both blocks. */
const STAIRWAY = 'scalable:@4xl:@min-[896px]:whitespace-pre-line';

/** THE HEADING'S REACH: inside THE BAND SCALE alone, the <h1> is as wide as
 *  its longest line, up to the column's full width plus 67.5 spacing steps —
 *  135 design pixels a side, never more; the hero's centring passes both of
 *  the column's edges by the same amount. Behind the band scale's own chain,
 *  like the stairway beside it. */
const REACH =
  'scalable:@4xl:@min-[896px]:w-max scalable:@4xl:@min-[896px]:max-w-[calc(100%+var(--spacing)*67.5)]';

/** THE <h1>'s own classes: capped at the 6xl step (THE CAPS), never split
 *  at a syllable, a belt for a word too long for a line, the `pretty` wrap on
 *  a phone's or a tablet's column, and the stairway's line breaks and the
 *  heading's reach inside the band scale. NO SIZE: its size there is
 *  ui/Heading's `hero-scaled` step's, 65.04 design pixels (THE ONE SIZE THE
 *  REMAP CANNOT REDRAW — held by tests/unit/design-scale.test.ts). */
const TITLE = cx(
  'max-w-6xl hyphens-none wrap-anywhere @max-3xl:text-pretty',
  STAIRWAY,
  REACH,
);

/** THE LEAD: capped at 123 spacing steps, the limit every one of its lines
 *  fits (THE CAPS), never split at a syllable, a belt for a word too long for
 *  a line (the heading's own), centred ON THE ELEMENT (§15.15 b), the
 *  `pretty` wrap on a phone's or a tablet's column, and the stairway's line
 *  breaks inside the band scale. */
const LEAD = cx(
  'max-w-123 hyphens-none wrap-anywhere text-center @max-3xl:text-pretty',
  STAIRWAY,
);

export function PageHero({
  title,
  lead,
  className,
  ...rest
}: PageHeroProps): ReactElement {
  return (
    // THE NATIVE SURFACE: the caller's native props ride FIRST; then a `role`
    // or a name that slipped past the Omit in the spread of a wider object is
    // reset — a hero is never a landmark of its own and is named by nothing
    // but its <h1> (sections/PostCard's belt, the same refusal); then the
    // hero's own classes, merged with a caller's className LAST (placement
    // only, §6.8).
    <header
      {...rest}
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cx(HERO, className)}
    >
      <Heading size="hero-scaled" asChild>
        <h1 className={TITLE}>{title}</h1>
      </Heading>
      <Text tone="muted" className={LEAD}>
        {lead}
      </Text>
    </header>
  );
}
