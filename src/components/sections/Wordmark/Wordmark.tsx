import type { ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { clinic } from '@/lib/clinic/clinic';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/Wordmark — the clinic's brand corner as ONE component: the mark
// and the name, one gap apart. Built to the owner-approved N2 composition contract
// .claude/plans/brand-lockup-contract.plan.md (v2, fb-200…fb-208). Two
// consumers today, which is the whole reason it exists: the Header's pill and
// the Footer's opening row each spelled the mark out themselves, so the §15.6
// logo swap would have been two edits that can disagree — and when the swap
// came (2026-10-01, THE MARK and THE TWO COLOURS below) it was one file.
//
// ── TIER: SECTION — and not because it is big. It has ONE optional prop (the
// artwork, D11), no state, no message key. Rule 3 of /classify-component decides on the IMPORT GRAPH:
// this composes ui/Heading, so it is a composition, and §4's dependency
// direction (app → sections → ui) then forbids ui/ from importing it back.
// Two consumers is rule 4, the SectionHeading paradox: heavy reuse schedules a
// composite EARLY in the build order, it never promotes it to ui/.
//
// ── D9 · CLICKABLE-SHAPED, NAVIGATING NOWHERE (fb-200, "make it clickable but
// don't implement go-to-a-page yet"). The root is an <a> WITHOUT href — HTML's
// own placeholder link. Four consequences, each deliberate rather than
// overlooked:
//   · it is NOT focusable and joins no tab order — an <a> without href has no
//     link role at all, it is a generic element that happens to be an <a>;
//   · it therefore carries NO aria-label. On a non-interactive generic a label
//     is PROHIBITED ARIA (axe aria-prohibited-attr, a hard §13 gate failure),
//     and it would be pointless anyway: the visible clinic name IS the name;
//   · no cursor-pointer. Painting the affordance of a link that goes nowhere
//     is worse than not having the link;
//   · the Header's home link is GONE. The brand corner of the time navigated
//     to '/', the swapped-in Wordmark does not.
// THE WIRING IS DROPPED, NOT PARKED (owner, 2026-09-06: "i am dropping
// wordmark home link"): the logo stays a non-link, and the fb-179 question —
// a second home link per page once the Footer has one — is closed by removal
// rather than answered. The two-line diff this header used to declare
// (`href={localeHref(locale, '/')}` + `aria-label={t('brand.ariaLabel', …)}`)
// is history; the reserved `common.brand.ariaLabel` key still sits in all
// five messages/*.json, uncalled (an unused key is legal: the parity gate
// compares key SETS, not usage) — striking it ×5 is the owner's word. The
// placeholder <a> stays as the ELEMENT for now: three suites and the e2e find
// the lockup through it (`img.closest('a')`), so trading it for a <span> is
// its own small cleanup, not a rider on the logo.
//
// ── ZERO ISLANDS, which is why the artwork is a plain <img>. No 'use client',
// no hooks, no t(): this renders identically for every visitor, so it compiles
// into the static HTML of every page (§16) and ships no JavaScript — the
// Footer's contract, inherited by the component that now opens it. The bare
// <img> is the SAL-badge precedent (Footer's COLUMN 3 · ANPC/SAL BADGE block,
// fb-83) and its first reason alone is decisive here: ui/Image wraps
// ExportedImage, a CLIENT component, so importing it would hydrate the Header
// AND the Footer on every route of the site. alt="" makes the mark DECORATIVE
// — the clinic name stands next to it in text, so a described image would
// announce the brand twice — and the width/height ATTRIBUTES reserve the box
// before the bytes arrive (§11, zero CLS).
//
// ── THE MARK (§15.6 LANDED, owner 2026-10-01: "this is the actual logo of
// the clinic premium smile"). `public/images/brand/mark.svg` is the clinic's
// tooth — the lilac stroke and the grey stroke — TRACED from the owner's
// 261×262 PNG into two paths (the recipe and its numbers: CLAUDE.md §15.28;
// the tracer itself never enters the repository, like the ribbon's modelling
// code). WHY A .svg FILE and not an inline component: fb-83's rule — static,
// fixed-colour artwork ships as a file, and only state- or colour-REACTIVE
// artwork stays inline (the burger morph, the currentColor glyphs) — and the
// file's own reasons: it is fetched once and cached across every page, the
// two shells carry no path data in their HTML, and a vector draws crisp at
// the 72px the header asks for and at any density or zoom. The optimizer
// never touches it: next-image-export-optimizer lists PNG/GIF/JPG/JPEG/AVIF/
// WEBP and nothing else, so the ONE file serves as a plain static asset in all
// four paths (dev, vitest, storybook, build) — which is the whole problem the
// demo era's committed WEBP derivative (F12, 2026-08-20) existed to solve; it
// left with the cat. Its two fills are the brand tokens' VALUES, spelled as
// literals because a file loaded through <img> is a sealed document no page
// variable reaches — a KEEP-IN-SYNC pair with globals.css, pinned by
// tests/unit/logotype-census.test.ts together with the viewBox ↔ width/height
// pair below. The viewBox is the ink's own box plus one unit of air on each
// side: 258 × 261, i.e. very nearly square (0.99:1) where the demo cat was
// 1.49:1 — which is what changed every number in D10.
// THE ARTWORK STAYS A PARAMETER (D11, owner terminal 2026-08-20: "src image is
// just parameter"): `WordmarkArtwork` carries src AND intrinsic width/height
// together, because §11's zero-CLS attributes are only honest when the numbers
// travel with the file they describe. Both consumers render `<Wordmark />` and
// inherit the default — the mark — so a future re-cut of the logo is one edit
// to BRAND_MARK, or a per-consumer override, which is the parameter's point.
// `src` is typed `ImagePath` (lib/image-path): the picture folder is the one
// place a root-relative image path may point (the §15.19 round-3 trigger, "at
// the next lane that types an image path", fired here).
//
// ── THE TWO COLOURS (owner, 2026-10-01: "on the text use those colors as
// described … on Premium the gray and on smile the liliac"). The name is the
// brand's own lettering: „Premium" wears the mark's grey (`--brand-grey`
// #939598) and „Smile" its lilac (`--brand-lilac` #8576b1), two semantic roles
// minted for exactly this (globals.css, §15.1 — 22 roles). The words come from
// `clinic.name` (§10.1: one spelling of the name, never a second literal
// here), split ONCE at module scope by `brandWords`, which fails the build by
// name if the name is not exactly two words — the colouring below would
// otherwise paint a renamed clinic wrong without a sound.
// CONTRAST, MEASURED (WCAG 2.2 relative luminance, sRGB): the grey reads
// 3.00:1 on --surface white and 2.85:1 on --page, the lilac 4.02:1 and 3.82:1
// — all four under §9's 4.5:1 for text at the `title` step (20px regular is
// not "large text"; bold at 20px would lift the bar to 3:1, and the grey
// would still miss it on the page ground). It is legal because of WCAG 2.2
// SC 1.4.3's own clause — "Text that is part of a logo or brand name has no
// minimum contrast requirement" (SC 1.4.11 exempts the mark's colours the
// same way: a logo's particular presentation is essential) — and these two
// words are that text and NOTHING ELSE on the site is: the census test lets
// the two utilities and the `data-logotype` marker exist in this file alone.
// axe cannot tell a logotype from a paragraph, so the marker is what the
// Storybook a11y config narrows its color-contrast rule by
// (.storybook/preview.tsx — the rule keeps its whole reach except these two
// nodes; the same census pins the selector to the marker). The name still
// reaches everyone in full ink: the Footer's copyright line and its site-map
// title print it as ordinary text, and the two spans read as ONE string —
// `textContent` is `clinic.name`, a space between the words — so a screen
// reader hears the name, not two fragments. `hyphens-none` on the host is
// §15.14's rider for labels: a brand name breaks between its words or not at
// all, never at a syllable.
// RECORDED, the owner's calls: the lilac of the real logo is #8576b1, and
// §15.1's `--accent-decorative` #7a6d9c ("pending hue confirm vs the real
// logo") is a different lavender — re-setting that role, and the ribbon's
// #8377a3, to the logo's hue repaints tints, auras and keywords across the
// site and was NOT done here (§15.28 has the numbers); a favicon and the OG
// share image (§15.6's other two items) are the natural next use of the
// mark, not built in this lane.
//
// NO `loading` attribute, i.e. the HTML default of EAGER, and that is a
// decision rather than an omission: the SAL badge is `lazy` because it sits at
// the bottom of every page, while this mark sits in the HEADER, above the fold
// on every route — the same rule ui/Image states from the other side, in its
// header comment: "lazy below the fold by default — pass `preload` for the
// hero". A lazy above-the-fold image is fetched immediately anyway, just after
// layout has run: all of the cost, none of the saving. The Footer instance loads the same
// file eagerly for nothing, which is a cache hit rather than a second download.
//
// KNOWN DEBT · basePath, the same one the SAL badge books (the KNOWN DEBT
// paragraph inside Footer's SAL-badge block) and the LARGER instance of it
// (F13). This `src` is ROOT-ABSOLUTE and nothing threads next.config's
// `basePath` through it, so under the interim GitHub-Pages deploy
// (`PAGES_BASE_PATH=/premium-smile-development`, §15.2) it resolves at the
// domain root and 404s. Where the badge is one image at the bottom of the page,
// this is the BRAND CORNER of the header and the footer on every route — and
// because it is correctly `alt=""` (decorative), a 404
// degrades to an invisible box rather than to broken-image alt text, i.e. it
// fails silently. Reported, not patched: threading the prefix is a repo-wide
// deploy-hardening item (R2 — three bookings now: the SAL badge, this, and
// ui/Image), and a section is the wrong place to read process env.
//
// ── D12 · NO BAR (owner, terminal, 2026-08-20: "remove vertical line"). v2's
// middle element — the vertical `line-subtle` hairline between artwork and
// name — was cut after being seen live in Storybook; the lockup is two
// children and one gap. Supersedes D2 and retires F11's `shrink-0` machinery
// with it (the lesson — a 1px flex child is a silent shock absorber for an
// over-constrained row — stays recorded on the board for whoever adds a
// hairline next).
//
// ── D10 · EVERY PART RENDERS AT EVERY WIDTH (fb-202, "look the same on
// every screen size, ready for window resizes"). Nothing here hides, ever: the
// old site dropped the brand TEXT below `sm` and left a bare mark, and this is
// the rule that forbids repeating it. What remains is fluidity, and it is pure
// CSS — a live window drag re-solves it without a frame of JavaScript.
// ONE tighten step, measured against the nearest ancestor CONTAINER and never
// the viewport (§6.5). Both consumers already are containers — the Header pill
// root (the `group/bar @container` <header>) and the Footer gutter box (the
// `@container` div under Footer's THE GUTTER BOX comment) — so this component
// reacts to the box it was handed rather than to the window, and the Storybook
// decorator reproduces that box on purpose.
// THE NUMBERS ARE MEASURED, not guessed — RE-DERIVED 2026-10-01 for the 5rem
// row both consumers give the lockup since 2026-09-04 (the first derivation
// was written against 4rem) and for the near-square mark — and the TIGHTEST
// CELL IN THE REPO sets them. The Header hands this component the pill row
// minus its 1rem padding, its 1rem row gap and the 2.75rem burger: 203px at
// the 390 phone width, 147.00px at the 320 stress width (measured in the
// Storybook runner, whose scrollbar makes both the pessimistic figures — a
// real phone is ~15px wider). Against that, the name is 138.75px on one line
// at text-xl and 83.70px when it wraps to its longest word (87.36 by G2's
// stricter reading), and the mark is 0.99:1, so it costs almost exactly its
// height in width. SUB-PIXEL arithmetic, because that is the scale this fits
// in (F11):
//   · FULL SIZE — 90% of the 5rem row is a 72px mark, 71.17px wide, and with
//     `gap-3` and the name the lockup is ~222px (the demo cat's 1.49:1 made
//     it 258.5, the number sections/Header's step arithmetic was measured
//     against — Header.tsx records the new one beside it);
//   · BELOW `@max-xs` (a 20rem container: the pill at any phone width, and the
//     Footer's gutter box likewise) — gap-2 and a 40% mark (32px tall, 31.63
//     wide) bring the one-line lockup to ~178.4px against the 203px cell at
//     390: ONE LINE with ~24.6px to spare. (A 360px window offers 179px, so
//     there the name sits on the edge of wrapping — either way is inside the
//     row, see the next bullet.) Staying on one line at 390 is fb-207 read
//     literally: the header brand of the time was one 139×28 line, and
//     wrapping it at the phone width would be precisely the changed aspect
//     that ruling forbids;
//   · AT 320 nothing keeps it on one line — 178.4 against a 147.00px cell —
//     so the name WRAPS to two 28px lines inside the 5rem row, „Premium"
//     over „Smile", each in its colour. The floor that has to fit is the
//     MIN-CONTENT sum: 31.63 mark + 8 gap + 83.70 longest word = 123.33, i.e.
//     23.67px of real slack. THIS WRAP WAS A PROMISE THE HEADER BROKE until
//     2026-10-01: its brand cell wore `whitespace-nowrap` at every width, so
//     the one-line name overflowed its cell and „Smile" was painted 32px under
//     the burger at 320 (measured on develop; flagged by the real-clinic-data
//     lane on 2026-09-30). The nowrap now lives at the bar's step only, where
//     the grid needs it (Header.tsx, the brand cell), and the phone wraps as
//     this arithmetic always said.
// The two percentages are the owner's lever: the mark being square, 90% and
// 40% are what the demo cat wore, kept so the lockup's height did not move —
// a bigger mark in the pill is one number here, re-measured in
// Wordmark.stories.tsx.
//
// ── CONSUMER PRECONDITION, stated because it fails QUIETLY. The step above
// resolves against the NEAREST ANCESTOR with `container-type` — both consumers
// have one (the Header pill root's `@container`, Footer's THE GUTTER BOX
// `@container` div), which is why neither had to be told anything. Drop this
// component into a consumer that establishes NO container and the query simply
// never matches: it renders full-size at every width, including 320, where the
// lockup then does not fit. Nothing throws and nothing logs. If a third
// consumer ever needs to be independent of its ancestors, the recorded option
// is a NAMED container (`@container/pill` on the consumer, `@max-xs/pill:`
// here) — deliberate, greppable, and still zero JavaScript. Not done today:
// two consumers, both already containers, and an unused name is a lie about
// what the code needs.

/**
 * One artwork the lockup can draw: a file plus the intrinsic pixel size that
 * makes its `width`/`height` attributes truthful — §11's zero-CLS pair only
 * reserves the right box when the numbers describe the file they ship with.
 */
export interface WordmarkArtwork {
  readonly src: ImagePath;
  readonly width: number;
  readonly height: number;
}

/**
 * The clinic's mark — the default since 2026-10-01 (§15.6 landed). The two
 * numbers are the file's viewBox; tests/unit/logotype-census.test.ts holds
 * them to it.
 */
const BRAND_MARK: WordmarkArtwork = {
  src: '/images/brand/mark.svg',
  width: 258,
  height: 261,
};

/**
 * The brand's own lettering is TWO words, one per colour of the mark. The
 * split happens once, from `clinic.name` (§10.1), and a name that is not
 * exactly two non-empty words fails the build BY NAME rather than painting a
 * renamed clinic in the wrong colours — revisit this file before renaming.
 */
export function brandWords(name: string): readonly [string, string] {
  const [first, second, ...rest] = name.split(' ');
  if (
    first === undefined ||
    second === undefined ||
    first === '' ||
    second === '' ||
    rest.length > 0
  ) {
    throw new Error(
      `sections/Wordmark: the logotype colours exactly two words and the clinic's name is "${name}" — revisit the wordmark before the name changes shape.`,
    );
  }
  return [first, second];
}

const [FIRST_WORD, SECOND_WORD] = brandWords(clinic.name);

export interface WordmarkProps {
  /**
   * The left half of the lockup — §8.1's "props with defaults" shape (D11):
   * both consumers stay `<Wordmark />`, and a re-cut of the mark is one edit
   * to the default here or one prop at a call site.
   */
  artwork?: WordmarkArtwork;
}

export function Wordmark({
  artwork = BRAND_MARK,
}: WordmarkProps): ReactElement {
  return (
    // NO outer margin, and no width of its own: the CONSUMER owns the box
    // (§6.4/§6.8) — the Header hands it a `self-stretch` cell in the pill row,
    // the Footer a centred `h-20` box. `h-full` is how both of those become
    // the ruler the percentage-sized artwork resolves against. Both rulers are
    // 5rem since 2026-09-04 (the owner's uniform bar height); fb-205 is the
    // standing rule that they must agree, so they move together or not at all.
    // THE ONE SUPPRESSED RULE, and the one place it is honest to suppress it:
    // jsx-a11y/anchor-is-valid says an anchor must be keyboard accessible, and
    // it is exactly right — which is why this element is inert (D9 above).
    // Suppressed here rather than worked around: a `href="#"` would ship a
    // real link to nowhere, and a <button> would promise an action there is
    // none of.
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a className="flex h-full items-center gap-3 @max-xs:gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artwork.src}
        alt=""
        width={artwork.width}
        height={artwork.height}
        className="h-[90%] w-auto @max-xs:h-[40%]"
      />
      {/* The name through ui/Heading's `title` step — `font-display text-xl
          text-ink-strong`, the string the Header used to spell inline on its
          brand anchor — plus the host's own `hyphens-none` (merged last by
          asChild, §6.8). asChild because Heading answers "how big is this
          title" and never "which element is it": the host is a <span>, an
          inline generic that claims no outline slot — a mark repeated in the
          shell of every route must not (the Header's C2 rule, the Footer's
          brand row already following it). The two words inside wear the
          brand's two colours (THE TWO COLOURS above); the `data-logotype`
          marker on each is what the a11y gate's exemption is keyed on. The
          text is DATA from lib/clinic/clinic.ts (§10.1), never a message key,
          so a rename is one edit there — and a build failure here until this
          file is revisited (`brandWords`). */}
      <Heading asChild>
        <span className="hyphens-none">
          <span data-logotype="" className="text-brand-grey">
            {FIRST_WORD}
          </span>{' '}
          <span data-logotype="" className="text-brand-lilac">
            {SECOND_WORD}
          </span>
        </span>
      </Heading>
    </a>
  );
}
