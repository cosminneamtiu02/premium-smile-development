import {
  Fragment,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '@/lib/cx/cx';

// ui/Keyword — a key word inside a sentence: HTML's own key-word element, a
// little bold (650) and in the lavender of the doctor card's button, so a
// name-dropped speciality stands apart from the quiet line around it by weight
// and by hue, without claiming importance the sentence does not have.
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
// HISTORY: D52, D55, D56, D57, D59, D60, then THE BUTTON'S LAVENDER), and each
// landed HERE, once, for every consumer: the reason a primitive lives in one
// file.
//
// ── WHY <b>, AND WHY <b> IS THE POINT. The spec's own example for <b> is "key
// words in a document abstract". <strong> would claim importance, <em> stress
// emphasis, <mark> relevance to the reader's current task, <i> an alternate
// voice; none of those is what a speciality named in passing is. So the
// element carries the meaning and the utilities carry the look — the split
// that let D52, D55, D56, D59 and D60 change the look five times in one day,
// and THE BUTTON'S LAVENDER once more a week later, without touching the
// meaning: a heavier lilac <b> is still a key word, not a stressed one.
//
// ── THE RECIPE — the weight D59's, no line since D60, the ink since THE
// BUTTON'S LAVENDER (2026-10-02, below). D60 was the owner's word of
// 2026-09-26, one look after D59 added a thin underline on the owner's "add
// just a little more bold and underline them maybe": "remove the underline".
// The "maybe" is resolved — the line read as
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
//                      units, and in a heavier one it inverts — the hue holds
//                      in both, and no consumer has either.
//   (no line)          NO text decoration, since D60: the <b> wears none of
//                      its own and the recipe adds none (Keyword.test.tsx
//                      reads `none` back off every key word), and a consumer
//                      must not add one through className (THREE LIMITS, (2)).
//   text-accent        THE INK — THE BUTTON'S LAVENDER, the owner, 2026-10-02:
//                      "there are some keywords in text that are a lilla. but
//                      i do not like that lilla … i want that highlighted
//                      text to actually be the color of the current mai
//                      multe despre mine button". --accent #746894, the 20th
//                      semantic role: the menu buttons' lavender and the face
//                      of ui/Button's `accent` family at rest — the doctor
//                      card's „Mai multe despre mine" link among its wearers
//                      — so a key word and the card's one button speak ONE
//                      colour (measured on the built page: both
//                      rgb(116, 104, 148)). It replaces --accent-strong
//                      #4b3a86 (D56's role, D57's value: "a more seeable one …
//                      make it just jump at you more"), which this file wore
//                      from D56 on and which stays the accent family's press
//                      and hover ink — the role keeps its charter, this atom
//                      is simply no longer its consumer. The UTILITY changed,
//                      not a token: every key word moved at once and nothing
//                      else on the site did. What the swap costs is a cue,
//                      not the contrast (THE NUMBERS): 5.06:1 on white still
//                      clears body text's 4.5:1, but against the faint quote
//                      the key word now has the quote's own lightness
//                      (1.02:1, where the violet stood 1.89:1 darker), so it
//                      stands apart by hue and weight alone — and the lilac
//                      tint is barred again (THREE LIMITS, (3)).
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
// kept the 650: weight, hue AND lightness, the three cues D57 had left. THE
// BUTTON'S LAVENDER (2026-10-02 — "i do not like that lilla … i want that
// highlighted text to actually be the color of the current mai multe despre
// mine button") moved the ink off --accent-strong onto --accent and kept the
// 650: weight AND hue — the lightness step D57 had added is gone.
//
// ── THE FACE NOTE — history: D55's italic was synthesised (no italic face).
//
// ── THE NUMBERS (WCAG 2.2 relative luminance, sRGB; since THE BUTTON'S
// LAVENDER, 2026-10-02):
//   keyword  #746894 on white #ffffff    5.06:1 — AA body text (4.5:1) met
//   quote    #766f69 on white #ffffff    4.94:1 — --ink-faint, the two
//                                                  consumers' quote ink (D58)
//   step     #746894 against #766f69     1.02:1 — the SAME lightness
// The step is not a contrast and is not meant to be one — and since THE
// BUTTON'S LAVENDER there is next to none: the key word and the quote around
// it have one lightness, so it stands apart by HUE and WEIGHT only. (With
// --accent-strong #4b3a86 it stood 1.89:1 off the faint quote and 1.27:1 off
// the --ink-muted #5b554f the quotes wore until D58, the darker each time;
// against that muted ink the lavender is the LIGHTER, 1.45:1.) Both consumers
// set their quote at body size and regular weight — PersonnelCard's at 18px,
// the CredoCard's at 20px — so the 4.5:1 bar applies to the fragment in full,
// and it clears it. Both seat the quote on white: PersonnelCard's doctor card
// and DoctorIntro's CredoCard, both on `framed` (ui/Card's `framed` row paints
// `bg-surface`; its --card-tint is the 3px frame, never the ground). On the
// page ground (#faf9f7) the keyword reads 4.81:1 and the faint quote 4.70:1.
// On sections/TintedBand's 30% lilac ground (#d4cfdc) the keyword reads
// 3.32:1 — UNDER the bar, the ground every wearer of --accent is barred from
// (globals.css: "NOT FOR THE TINT"); the violet read 6.12:1 there. THREE
// LIMITS, (3), and tests/unit/accent-census.test.ts hold that line.
//
// ── THREE LIMITS, RECORDED (G2 a11y, the PersonnelCard lane; amended by D52,
// D55, D56, D57, D59, D60 and THE BUTTON'S LAVENDER — they travel with the
// component; D60 struck D59's fourth, the underline read as a link, with the
// line itself). (1) The cue is WEIGHT and HUE — the LIGHTNESS step D57 added
// left with THE BUTTON'S LAVENDER (1.02:1 against the faint quote) — and the
// weight survives everywhere: forced colours repaint every ink to the
// system's text colour and never touch a font's weight. A greyscale view or a
// colour-vision deficiency that flattens lavender against warm grey keeps the
// weight ALONE — the key word a little heavier (650 against 400, by the
// owner's "just a little more") and no darker than the quote. (2) It is still
// SALIENCE and not information: SC 1.4.1 passes exactly because the sentence
// is complete without it — which is also why a one-cue difference for some
// readers is a loss of salience and never of content — so copy must never
// REFER to the marking ("the highlighted words…", "the lilac words…", "the
// words in bold…"), and a consumer must not stack a further cue (italic, a
// decoration — D60's underline read as a link — a ground) on the fragment
// through className — §6.8 limits that prop to placement. (3) The ink is
// chartered for WHITE and the PAGE ground — 5.06:1 and 4.81:1 — and the 30%
// lilac tint is BARRED (3.32:1, the role's own "NOT FOR THE TINT"; under the
// violet that ground read 6.12:1 and was open). No key word can reach it
// today: the two bands on that ground take their words as plain strings BY
// TYPE — sections/DoctorProfile's `paragraphs: readonly string[]` (the
// doctors' `about`, which carries no <k>), sections/DoctorStats' `lead`,
// `label` and `description` — so a <b> has no way in, and
// tests/unit/accent-census.test.ts names the three pages that render key words
// and the white cards they land on. A DARK ground is outside the charter too
// — 3.17:1 on --inverse-surface. A consumer that seats key words on either
// fails SC 1.4.3 at body size and needs its own ink first (a token decision,
// the owner's), never a className.
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
// ui/Eyebrow RECIPE convention). The why of each utility: THE RECIPE.
const RECIPE = 'font-[650] text-accent';

/**
 * A key word inside a sentence — HTML's own key-word element, a little bold (a
 * pinned 650) and in the lavender of the doctor card's button (`--accent`),
 * with no line under it (THE RECIPE), so the fragment stands apart from the
 * line around it without claiming importance the sentence does not have.
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
