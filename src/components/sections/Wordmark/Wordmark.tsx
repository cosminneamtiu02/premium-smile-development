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
// ── TIER: SECTION — and not because it is big. It has two required props
// (the home link's href and name, D9), one optional one (the artwork, D11), no
// state, no message key. Rule 3 of /classify-component decides on the IMPORT GRAPH:
// this composes ui/Heading, so it is a composition, and §4's dependency
// direction (app → sections → ui) then forbids ui/ from importing it back.
// Two consumers is rule 4, the SectionHeading paradox: heavy reuse schedules a
// composite EARLY in the build order, it never promotes it to ui/.
//
// ── D9 · THE HOME LINK (owner, 2026-10-02: "i just want the "premium smile"
// logo from top bar and from footer to be a component that takes you to
// home"). The root is a plain <a href> to the page's locale home — "button"
// is the owner's word for any control, and a control that NAVIGATES is a link
// (§9: buttons act, links navigate). One tab stop, a full document load on
// click, zero JavaScript (§15.13: no router, no prefetch). Both halves arrive
// as REQUIRED props, so a consumer cannot leave either out: `href`, which the
// consumer builds with `localeHref(locale, '/')` — the one URL rule (locale
// prefix, trailing slash, the interim base path) — and `aria-label`, the
// consumer's `common.brand.ariaLabel` with `{name}` = clinic.name, „Premium
// Smile, acasă": the visible name FIRST (SC 2.5.3 Label in Name — speech
// input's "click Premium Smile" finds it), then the destination (SC 2.4.4).
// The types hold only that both are there; what they SAY is held by the
// tests — Header.test.tsx's five-language `{name}`-first check and both
// consumers' suites.
// THE HISTORY, three steps: fb-200 ("make it clickable but don't implement
// go-to-a-page yet", 2026-08-20) made the root an <a> WITHOUT href — HTML's
// own placeholder link: no link role, no tab stop, no name; the owner dropped
// the wiring on 2026-09-06 ("i am dropping wordmark home link"); and on
// 2026-10-02 he restored it, which also reverses fb-179 ("no second link to
// home in the footer") — the Footer's lockup is now a second link home beside
// its site map's „Acasă", under a different name (Footer.tsx, ROW 1).
// WHY PROPS-IN, and no t() here: the locale and the words belong to the band
// that composes the lockup — §4's page-phase default, a repeated unit shared
// by 2+ consumers starts props-in and message keys stay with the composing
// band — so this file stays the dumb lockup both shells populate: still
// zero message keys, still no hook, still the four imports
// Wordmark.test.tsx's allowlist names.
// WHY THE BOX HUGS: the root no longer stretches to the consumer's 5rem row —
// `h-full` left with this change, and nothing resolved against the box any
// more anyway (the mark has been a fixed rem since 2026-10-01) — so the focus
// ring draws round the lockup itself, INSIDE the bar's row, instead of
// straddling the pill's edge; `min-h-11` keeps the target at least 44px tall
// where the phone lockup is shorter (§9's aim: a 24.5px mark beside a 28px
// line), and both consumers centre the box with `items-center` — load-bearing:
// a flex parent's default `stretch` would pull the link back to the row's full
// height (Header.test.tsx and Footer.test.tsx pin the class). The ring is
// ui/TextButton's own recipe — 2px of `--focus` at a 2px offset, the
// globals.css safety net's numbers stated on the element — on `rounded-md`,
// §15.1's 6px house corner (an outline follows border-radius). NOT the soft
// corner: §15.29 gives it to four named parts by the owner's taste, and
// tests/unit/soft-corner-census.test.ts holds that list.
// NO HOVER LOOK — no hover or press state, no jump, no transition, no cursor
// class: the old site's logo link had none, that is the web's convention for
// a logo, and the browser already gives every <a href> the pointer. A hover
// look is the owner's future call, not this change's.
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
// the 55px the header asks for and at any density or zoom. The optimizer
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
// travel with the file they describe. Both consumers pass no artwork and
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
// — all four under §9's 4.5:1 for body-size text. At the `section` step the
// name wears since 2026-10-01 (30px regular, "large text") the bar is 3:1:
// the lilac clears it on both grounds, the grey reaches it only on pure white
// (3.00:1) and misses it on the page ground and on the bar's 95% glass, which
// reads ~#f2f2f2 over the Hero (~2.7:1). It is legal because of WCAG 2.2
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
// site and was NOT done here (§15.28 has the numbers). THE FAVICON LANDED
// 2026-10-01 (owner: "use the logo from top bar also in the tab"): this very
// file is the browser tab's icon — src/app/icon.svg is a byte copy of it and
// src/app/favicon.ico is rasterised from it (CLAUDE.md §15.31; the copy is
// pinned by tests/unit/logotype-census.test.ts, so a re-cut mark that forgets
// the tab fails there). The OG share image is §15.6's last open item.
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
// THE NUMBERS ARE MEASURED, not guessed — RE-DERIVED 2026-10-01 for the
// clinic's near-square mark and again the same evening for THE OWNER'S SIZES
// below — and the TIGHTEST CELL IN THE REPO sets them. The Header hands this
// component the pill row minus its 1rem padding and the 2.75rem burger, and
// NO row gap: the row wore `gap-4` from 2026-08-17 until the shell mount took
// it off on 2026-09-04 (#69) — the `gap-4` left in the bar sits inside the
// right cell, around a Contact box that is display:none below the bar's step —
// so this paragraph's 203 / 147, right when written, went stale that day, and
// the story harness with it. MEASURED on the built export (Chromium, Firefox,
// WebKit): on a phone (overlay scrollbars, no gutter) the cell is 0.8 ×
// viewport − 78px — 234 at 390, 178 at 320; in a runner with Chromium's 15px
// classic gutter, 219 and 163. The mark is 0.99:1, so it costs almost exactly
// its height in width. SUB-PIXEL arithmetic, because that is the scale this
// fits in (F11):
//   · FULL SIZE — a 3.4425rem mark (55.08px, 54.44 wide), `gap-3` and the
//     name at Heading's `section` step (30px; 203.7px on one line, not 1.5 ×
//     the 20px name's 138.75: the face has an optical-size axis) make a
//     270.1px lockup (72px and ~222 with the 20px name until 2026-10-01; the
//     demo cat's 1.49:1 made it 258.5 — Header.tsx records each beside its
//     step arithmetic);
//   · BELOW `@max-sm` (a 24rem container — the bar's pill on a phone up to
//     ~482px wide, the Footer's gutter box up to ~480px) — `gap-2`, a 1.53rem
//     mark (24.47px, 24.19 wide) and the name back at the 20px `title` size
//     (`@max-sm:text-xl`) make a 170.9px one-line lockup, which a phone's bar
//     holds on ONE line from a ~311px viewport — fb-207's one line at 390, with
//     room — and the Footer always. The step was `@max-xs` (20rem) until
//     2026-10-01: with the 30px name that threshold left the large iPhones
//     (403–435px) a 55px mark beside a wrapped two-line name;
//   · AT 320 — the floor that has to fit is the MIN-CONTENT sum: 24.19 mark +
//     8 gap + 83.70 for „Premium" = 115.89 against the runner's 163px cell (a
//     phone's 178 keeps one line), so in the runner the two 28px lines,
//     „Premium" over „Smile", each in its colour, stand inside the 5rem row.
//     THIS WRAP WAS A PROMISE THE HEADER BROKE until
//     2026-10-01: its brand cell wore `whitespace-nowrap` at every width, so
//     the one-line name overflowed its cell and „Smile" was painted 32px under
//     the burger at 320 (measured on develop; flagged by the real-clinic-data
//     lane on 2026-09-30). The nowrap now lives at the bar's step only, where
//     the grid needs it (Header.tsx, the brand cell), and the phone wraps as
//     this arithmetic always said.
// THE OWNER'S SIZES (2026-10-01, in four words through one evening, each
// verbatim): "make logo in top bar 15% smaller", then "make the logo 10%
// smaller again" and "make the text 50% bigger than it is now", then "update
// also in footer. now it looks sensational" — and, on the two fittings those
// left open, "whatever, do your thing". The mark was 90% of the 5rem box (40%
// below the step), what the demo cat wore; it is 90% × 85% × 90% of it,
// 3.4425rem (1.53rem below the step), spelled as a FIXED rem rather than a
// share of the box, and with `max-w-none`: Tailwind's preflight gives every
// <img> `max-width: 100%`, which makes it COMPRESSIBLE (CSS Sizing 3 — its
// min-content contribution is ZERO), so until then no grid could see the mark
// (measured in all three engines: the lockup's min-content was its text
// alone) and the Header's `1fr` side track could squeeze the brand under the
// nav — WCAG 1.4.12's text spacing did, in German, just above the bar's step.
// With both, the min-content is the whole lockup, and a squeezed track pushes
// the nav right instead (Header.tsx, THE BRAND GREW). The name moved from
// Heading's `title` step to its `section` step, 20px → 30px, and keeps the
// 20px below the step (the phone fitting). The first two words were the top
// bar's alone and were built in the Header's box for an hour; the fourth made
// them the lockup's look everywhere, so they live HERE, in both instances at
// once (fb-205), re-measured in Wordmark.stories.tsx and Header.stories.tsx.
//
// ── CONSUMER PRECONDITION, stated because it fails QUIETLY. The step above
// resolves against the NEAREST ANCESTOR with `container-type` — both consumers
// have one (the Header pill root's `@container`, Footer's THE GUTTER BOX
// `@container` div), which is why neither had to be told anything. Drop this
// component into a consumer that establishes NO container and the query simply
// never matches: it renders full-size at every width, including 320, where the
// lockup then does not fit. Nothing throws and nothing logs. If a third
// consumer ever needs to be independent of its ancestors, the recorded option
// is a NAMED container (`@container/pill` on the consumer, `@max-sm/pill:`
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

/**
 * The lockup's three props — and the only three that reach the DOM: the root
 * spreads nothing, so any other attribute a consumer writes is dropped
 * silently (TypeScript does not check a hyphenated JSX attribute such as
 * `aria-current` against this interface); a new attribute arrives as its own
 * typed prop (the `aria-current` follow-up recorded in CLAUDE.md §15.33).
 */
export interface WordmarkProps {
  /**
   * Where the lockup takes you: the page's locale home, built BY THE CONSUMER
   * with `localeHref(locale, '/')` — §15.13's one URL rule (locale prefix,
   * trailing slash, the interim base path), so a click is a plain full
   * document load. REQUIRED (D9), so a consumer cannot leave it out; which
   * href it passes is the consumer's to get right, and both consumers' tests
   * pin theirs.
   */
  href: string;
  /**
   * The link's accessible name, passed through verbatim. Both consumers pass
   * `common.brand.ariaLabel` with `{name}` = clinic.name („{name}, acasă" in
   * Romanian): the clinic name FIRST, so the visible text leads the name
   * (WCAG 2.2 SC 2.5.3 Label in Name), then the destination (SC 2.4.4).
   * REQUIRED (D9), so a consumer cannot leave it out — but the name-first
   * rule is not this type's to hold: Header.test.tsx's five-language
   * `{name}`-first check and both consumers' tests hold it.
   */
  'aria-label': string;
  /**
   * The left half of the lockup — §8.1's "props with defaults" shape (D11):
   * both consumers render the mark by default, and a re-cut of the mark is
   * one edit to the default here or one prop at a call site.
   */
  artwork?: WordmarkArtwork;
}

export function Wordmark({
  href,
  'aria-label': ariaLabel,
  artwork = BRAND_MARK,
}: WordmarkProps): ReactElement {
  return (
    // NO outer margin, and no width of its own: the CONSUMER owns the box
    // (§6.4/§6.8) — the Header hands it a `self-stretch` cell in the pill row,
    // the Footer an `h-20` box, both `items-center`, so this link sits centred
    // in the consumer's 5rem row while hugging what it draws (D9: the focus
    // ring round the lockup, inside the row). `h-full` stretched this root to
    // the row until 2026-10-02 and left when the link arrived: nothing
    // resolves against the box any more — the mark has been a fixed rem since
    // 2026-10-01. Both boxes are 5rem since 2026-09-04 (the owner's uniform bar
    // height); fb-205 is the standing rule that they must agree, so they move
    // together or not at all — which is why the owner's sizes of 2026-10-01
    // live HERE (THE OWNER'S SIZES, above), not in either consumer's box.
    <a
      href={href}
      aria-label={ariaLabel}
      className="flex min-h-11 items-center gap-3 rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus @max-sm:gap-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artwork.src}
        alt=""
        width={artwork.width}
        height={artwork.height}
        className="h-[3.4425rem] w-auto max-w-none @max-sm:h-[1.53rem]"
      />
      {/* The name through ui/Heading's `section` step — `font-display
          text-3xl text-ink-strong`, 30px, half again the `title` step (20px)
          it wore until the owner's "make the text 50% bigger than it is now"
          (2026-10-01, THE OWNER'S SIZES above) — plus the host's own
          `hyphens-none` (merged last by asChild, §6.8). asChild because Heading answers "how big is this
          title" and never "which element is it": the host is a <span>, an
          inline generic that claims no outline slot — a mark repeated in the
          shell of every route must not (the Header's C2 rule, the Footer's
          brand row already following it). The two words inside wear the
          brand's two colours (THE TWO COLOURS above); the `data-logotype`
          marker on each is what the a11y gate's exemption is keyed on. The
          text is DATA from lib/clinic/clinic.ts (§10.1), never a message key,
          so a rename is one edit there — and a build failure here until this
          file is revisited (`brandWords`). */}
      <Heading asChild size="section">
        <span className="hyphens-none @max-sm:text-xl">
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
