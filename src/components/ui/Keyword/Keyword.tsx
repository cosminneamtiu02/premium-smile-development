import {
  Fragment,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '@/lib/cx/cx';

// ui/Keyword — a key word inside a sentence: HTML's own key-word element, a
// little bold (650) and in the deep accent lilac, so a name-dropped speciality
// stands apart from the quiet line around it by weight, by hue and by a
// darker ink, without claiming importance the sentence does not have.
//
// ── PROMOTED 2026-09-21 by the doctor-pages run, on the trigger its own
// author recorded. This component was born inside sections/PersonnelCard as
// that card's D9, which wrote the §4 primitive rule into its own paragraph:
// "the second section that wants keyword fragments moves this to ui/Keyword —
// a composite never promotes, but this one is a primitive living here until it
// has a second consumer". The doctor page is that second consumer (the
// opener's CredoCard, round 2 — the same quote the doctor card shows, D12),
// so the trigger fired and the file moved. The <b> was BYTE-IDENTICAL to the
// one PersonnelCard shipped when it moved — a promotion moves a primitive, it
// does not redesign it — and PersonnelCard.tsx's D9 is now a pointer at this
// file. The redesigns came later, each on its own word (THE RECIPE and its
// HISTORY: D52, D55, D56, D57, D59, then D60), and each landed HERE, once, for
// every consumer: the reason a primitive lives in one file.
//
// ── WHY <b>, AND WHY <b> IS THE POINT. The spec's own example for <b> is "key
// words in a document abstract". <strong> would claim importance, <em> stress
// emphasis, <mark> relevance to the reader's current task, <i> an alternate
// voice; none of those is what a speciality named in passing is. So the
// element carries the meaning and the utilities carry the look — the split
// that let D52, D55, D56, D59 and D60 change the look five times in one day
// without touching the meaning: a heavier lilac <b> is still a key word, not
// a stressed one.
//
// ── THE RECIPE — D60, the owner, 2026-09-26, one look after D59 added a thin
// underline on the owner's "add just a little more bold and underline them
// maybe": "remove the underline". The "maybe" is resolved — the line read as
// a link and left after one look, its two companions (`decoration-1`,
// `underline-offset-2`) with it, since they style nothing without it; D59's
// weight stayed. D59 had recorded what set its 1px violet line apart from the
// site's links — ui/Button dresses its <a> as a green face and ui/TextButton
// draws a 2px green bar, neither a text-decoration, and the one underlined
// link in a band, LanguageBanner's accept link, is green, 2px thick and 4px
// down — but an underline is the web's oldest link cue, and one look
// outweighed the record.
//   font-[650]         weight 650, PINNED — D59's "just a little more bold",
//                      kept by D60: half a step above D56's 600 ("just a
//                      little bold"), half a step below D52's 700 that was
//                      "too bold". An ARBITRARY value because Tailwind's named
//                      weights stop at the hundreds (semibold 600, bold 700);
//                      it compiles to `font-weight: 650`, never to a family
//                      (Keyword.test.tsx reads the weight back). The hosted
//                      Source Serif 4 is ONE variable file spanning 200–900
//                      (src/fonts/index.ts), so 650 is a true instance of its
//                      weight axis — drawn, not synthesised, not rounded to a
//                      neighbour. Pinned rather than left to Preflight's
//                      `b { font-weight: bolder }` because `bolder` is
//                      relative to the parent (300 → 400, 400 → 700, 600/700 →
//                      900): in the 400 lines every consumer has, it would be
//                      D52's 700 again. The explicit 650 reads the same in
//                      every consumer (Keyword.test.tsx reads it back under
//                      five parent weights). The known edge of a pin: in a
//                      line at 600 the weight half of the cue shrinks to 50
//                      units, and in a heavier one it inverts — the hue and
//                      the lightness step hold in both, and no consumer has
//                      either.
//   (no line)          NO text decoration, since D60: the <b> wears none of
//                      its own and the recipe adds none (Keyword.test.tsx
//                      reads `none` back off every key word), and a consumer
//                      must not add one through className (THREE LIMITS, (2)).
//   text-accent-strong THE INK, unchanged by D59 and D60: --accent-strong, a
//                      darker lilac — the 18th semantic role, added to
//                      globals.css's light-theme block beside
//                      --accent-decorative (D56). Its VALUE is D57's #4b3a86
//                      (the same day, the owner after seeing D56's #655885: "a
//                      more seeable one … make it just jump at you more, as
//                      keyword, important information"): darker AND more
//                      saturated, a clear violet — the utility unchanged, the
//                      token re-valued, every consumer moved at once. Its
//                      charter: accent ink for body-size text, the lilac that
//                      passes 4.5:1; keywords are its first consumer.
//                      --accent-decorative (#7a6d9c) stays the
//                      display/graphics role — 4.67:1 on white but 4.44:1 on
//                      the page ground, astride the body-text bar, and its
//                      charter never covered body text. No slant: `italic`
//                      left with D55.
// HISTORY: D9 (the PersonnelCard lane) read the owner's first sentence —
// fragments "not bold but rather more colored towards black so that they jump
// out as keywords" — as `font-normal text-ink-strong`: ink, not weight. D52
// (2026-09-26, "bold and darker … a more serious contrast between non key
// words and key words") pinned `font-bold`: weight AND ink. D55 (the same day,
// one round later) took the weight back and put a slant in its place:
// `font-normal italic text-ink-strong`. D56 (one round after that) dropped the
// slant, set the weight at `font-semibold` — between D9's and D52's — and
// moved the ink off --ink-strong for the first time: weight AND hue. The bold
// stood for one round and the italic for minutes; both are history. D57 (one
// round after D56) kept the recipe and deepened the token's value, #655885 →
// #4b3a86, so the key word also reads DARKER than the quote around it:
// weight, hue AND a lightness step. D58 (one round later) never touched this
// file: it gave the two consumers' quotes an ink of their own, the lighter
// --ink-faint #766f69, and the step widened from 1.27:1 to 1.89:1. D59 (one
// round after D58 — "looks better. add just a little more bold and underline
// them maybe") moved the weight from `font-semibold` to `font-[650]` and added
// a thin underline in the key word's own ink (`underline decoration-1
// underline-offset-2`): weight, hue, lightness AND shape. D60 (one look after
// D59 — "remove the underline") struck the line and its two companions and
// kept the 650: weight, hue AND lightness, the three cues D57 had left.
//
// ── THE FACE NOTE — history: D55's italic was synthesised (no italic face).
//
// ── THE NUMBERS (WCAG 2.2 relative luminance, sRGB):
//   keyword  #4b3a86 on white #ffffff    9.34:1 — AA body text (4.5:1) met
//   quote    #766f69 on white #ffffff    4.94:1 — --ink-faint, the two
//                                                  consumers' quote ink (D58)
//   step     #4b3a86 against #766f69     1.89:1 — and the keyword is the
//                                                  DARKER of the two
// The step is not a contrast and is not meant to be one — but it runs the
// right way: the key word is the darker ink, so it stands apart by LIGHTNESS
// as well as by HUE and WEIGHT (against the --ink-muted #5b554f the quotes
// wore until D58 the step was 1.27:1; D56's #655885 was the lighter of the
// two, 1.15:1). Both consumers set their quote at body size and regular
// weight — PersonnelCard's at 18px, the CredoCard's at 20px — so the 4.5:1
// bar applies to the fragment in full, and it clears it with room. Both seat
// the quote on white: PersonnelCard's `surface` card and DoctorIntro's
// CredoCard on `framed` (ui/Card's `framed` row paints `bg-surface`; its
// --card-tint is the 3px frame, never the ground). On the page ground
// (#faf9f7) the keyword reads 8.88:1 and the faint quote 4.70:1. On
// sections/TintedBand's 30% lilac ground (#d4cfdc) the keyword reads 6.12:1
// (D56's value read 4.18:1 there, under the bar); the faint quote ink is not
// chartered for that ground (3.24:1 — globals.css's --ink-faint record), so a
// quote seated there keeps --ink-muted (4.82:1), against which the keyword is
// still the darker, 1.27:1. The ground that still bars the ink is recorded in
// THREE LIMITS, (3).
//
// ── THREE LIMITS, RECORDED (G2 a11y, the PersonnelCard lane; amended by D52,
// D55, D56, D57, D59 and D60 — they travel with the component; D60 struck
// D59's fourth, the underline read as a link, with the line itself). (1) The
// cue is WEIGHT, HUE and a LIGHTNESS step, and the weight survives
// everywhere: forced colours repaint every ink to the system's text colour
// and never touch a font's weight. A greyscale view or a colour-vision
// deficiency that flattens lilac against warm grey keeps the weight and the
// lightness step — the key word a little heavier (650 against 400, by the
// owner's "just a little more") and a little darker (1.89:1 against the faint
// quote). (2) It is still SALIENCE and not information: SC 1.4.1 passes
// exactly because the sentence is complete without it, so copy must never
// REFER to the marking ("the highlighted words…", "the lilac words…", "the
// words in bold…"), and a consumer must not stack a further cue (italic, a
// decoration — D60's underline read as a link — a ground) on the fragment
// through className — §6.8 limits that prop to placement. (3) The ink is
// chartered for the LIGHT grounds — 9.34:1 on white, 8.88:1 on the page,
// 6.12:1 on the 30% lilac tint (D57 lifted that ground from D56's failing
// 4.18:1, so a quote with key words may now sit on it). A DARK ground is
// outside the charter — 1.71:1 on --inverse-surface — so a consumer that
// seats key words on one fails SC 1.4.3 at body size; no consumer does today,
// and one that wants to needs its own ink first (a token decision, the
// owner's), never a className.
//
// ── THE ATOM'S OWN RULES, as every sibling here keeps them: no outer margin
// (§6.4 — the sentence around it owns the spacing, and an inline element with
// a vertical margin would be ignored anyway); no sm:/lg: self-scaling (§6.5 —
// an atom cannot see its container); no t() and no message key (§8.1 — the
// fragment arrives finished and already translated); no 'use client', no hook,
// no state, so a <Keyword> costs the visitor zero bytes of JavaScript (§16).
// §6.3's typed-required aria-label does not bind: this is non-interactive text.
//
// ── TWO WAYS A CONSUMER HANDS THE FRAGMENTS OVER, and both ship here.
//   1. INSIDE THE MESSAGE (PersonnelCard's original shape): the band authors
//      "Lucrez în <k>ortodonție</k> de peste zece ani…" in messages/*.json and
//      passes `t.rich('members.elena.about', { k: (chunks) => <Keyword>{chunks}
//      </Keyword> })` wherever a ReactNode is taken.
//   2. FROM DATA (the doctor-pages run, its ledger D2): a doctor's words are
//      CONTENT, so they live in lib/team beside his pictures, still marked up
//      with <k>…</k>; lib/team's splitKeywords cuts one string into SEGMENTS
//      and <Keywords> renders them. Same marks, same look, no message key.

type KeywordOwnProps = {
  /**
   * The fragment — finished, already-translated text (§8.1): the chunks a
   * `t.rich` tag function hands over, or one segment's words. REQUIRED, as on
   * every sibling atom (Eyebrow, Heading, Text): a keyword without its word is
   * a bug.
   */
  children: ReactNode;
};

export type KeywordProps = KeywordOwnProps &
  Omit<ComponentPropsWithRef<'b'>, keyof KeywordOwnProps>;

// One recipe, one string. Named rather than inlined so the tests can assert the
// whole className byte-for-byte and catch a silent utility creeping in (the
// ui/Eyebrow RECIPE convention). The why of each utility: THE RECIPE (D60).
const RECIPE = 'font-[650] text-accent-strong';

/**
 * A key word inside a sentence — HTML's own key-word element, a little bold (a
 * pinned 650) and in the deep accent lilac (`--accent-strong`), with no line
 * under it (THE RECIPE, D60), so the fragment stands apart from the line
 * around it without claiming importance the sentence does not have.
 */
export function Keyword({
  className,
  children,
  ...rest
}: KeywordProps): ReactElement {
  return (
    // §6.8 merge order: the atom's own classes first, the caller's className
    // LAST. A deterministic convention the tests pin — NOT a cascade mechanism
    // (attribute order never decides CSS specificity), and §6.8 limits caller
    // utilities to positioning/spacing.
    <b className={cx(RECIPE, className)} {...rest}>
      {children}
    </b>
  );
}

/**
 * One piece of a sentence: plain text, or a key word.
 *
 * STRUCTURAL ON PURPOSE — `lib/team`'s `splitKeywords` returns exactly this
 * shape WITHOUT importing it, because §4's dependency direction runs
 * app → sections → ui → tokens and the foundation ring never imports a
 * component module (`lib/` must load bare under Node, with no React runtime —
 * tests/unit/lib-react-free.test.ts). Two files describing one two-field shape
 * is the price of that fence; a reversed import would be the fence broken.
 */
export type KeywordSegment = Readonly<{ text: string; keyword: boolean }>;

export type KeywordsProps = Readonly<{
  /** The sentence, already cut — finished, already-translated text (§8.1). */
  segments: readonly KeywordSegment[];
}>;

/**
 * A whole sentence: plain segments as text, keyword segments as <Keyword>.
 *
 * Renders a FRAGMENT — no wrapper element of its own — because the consumer's
 * <p> / <blockquote> is the box, and a <span> around the sentence would be one
 * more thing for a caller's CSS to trip over (§6.4's spirit: the parent owns
 * the box). Keys are INDICES, and here that is identity rather than a shortcut:
 * the list is a pure function of one string, re-cut on every render, so there
 * is no reorder, no insertion and nothing to preserve across one.
 */
export function Keywords({ segments }: KeywordsProps): ReactElement {
  return (
    <>
      {segments.map((segment, index) =>
        segment.keyword ? (
          <Keyword key={index}>{segment.text}</Keyword>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
