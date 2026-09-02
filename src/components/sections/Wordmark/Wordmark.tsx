import type { ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { clinic } from '@/lib/clinic';

// sections/Wordmark — the clinic's brand corner as ONE component: the artwork
// and the name, one gap apart. Built to the owner-approved N2 composition contract
// .claude/plans/brand-lockup-contract.plan.md (v2, fb-200…fb-208). Two
// consumers today, which is the whole reason it exists: the Header's pill and
// the Footer's opening row each spelled the mark out themselves, so the §15.6
// logo swap would have been two edits that can disagree.
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
// own placeholder link: the element everyone agrees will become the link,
// inert until it does. Four consequences, each deliberate rather than
// overlooked:
//   · it is NOT focusable and joins no tab order — an <a> without href has no
//     link role at all, it is a generic element that happens to be an <a>;
//   · it therefore carries NO aria-label. On a non-interactive generic a label
//     is PROHIBITED ARIA (axe aria-prohibited-attr, a hard §13 gate failure),
//     and it would be pointless anyway: the visible clinic name IS the name;
//   · no cursor-pointer. Painting the affordance of a link that goes nowhere
//     is worse than not having the link;
//   · the Header's home link is GONE for now. The brand corner of the time
//     navigated to '/', the swapped-in Wordmark does not. That is fb-200 taken
//     literally — recorded here so it reads as the decision it is, not as a
//     regression someone should quietly patch.
// THE WIRING IS A DECLARED TWO-LINE DIFF, held for its own lane:
// `href={localeHref(locale, '/')}` from '@/i18n/href' (§15.13 — every internal
// link is a plain anchor, and that builder is where the locale prefix, the
// trailing slash and the interim base path are spelled) plus
// `aria-label={t('brand.ariaLabel', { name: clinic.name })}` — that key already
// sits in all five messages/*.json, reserved and currently uncalled (an unused
// key is legal: the parity gate compares key SETS, not usage). Landing it flips
// two other things back on: the label stops being prohibited, because a real
// link may be named, and fb-179 re-poses its question — a second link to home
// in the Footer is a duplicate destination in the tab order. Moot while
// nothing navigates.
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
// WHY THE SRC IS A COMMITTED 9.9 KB DERIVATIVE and not the optimizer's own
// output (F12, ruled 2026-08-20). The optimizer DOES produce WEBP variants of
// this asset — unlike the SAL badge it lives under `public/images` — but those
// are BUILD ARTIFACTS: `.gitignore` excludes
// `public/images/**/nextImageExportOptimizer/` as "regenerated at build", so
// their URLs 404 in exactly the two paths a human looks at while developing
// (`npm run dev` on a fresh clone, and vitest, which CI runs BEFORE
// build-storybook) — invisibly, because alt="" degrades a 404 to an empty box.
// The ruling: `transparent-artwork-cat-256.webp` is a byte-copy of the
// optimizer's `-opt-256` output COMMITTED as an ordinary source asset, so it
// serves as a plain static file in all four paths (dev, vitest, storybook,
// build). 256w is 2× headroom for the ~86px draw; the 847×567 PNG source stays
// beside it as the ui/Image demo fixture (D8) — it is simply no longer what
// the shell ships eagerly on every route (585 KB → 9.9 KB).
//
// NO `loading` attribute, i.e. the HTML default of EAGER, and that is a
// decision rather than an omission: the SAL badge is `lazy` because it sits at
// the bottom of every page, while this mark sits in the HEADER, above the fold
// on every route — the same rule ui/Image states from the other side, in its
// header comment: "lazy below the fold by default — pass `preload` for the
// hero". A lazy above-the-fold image is fetched immediately anyway, just after
// layout has run: all of the cost, none of the saving. The Footer instance loads the same
// file eagerly for nothing, which is a cache hit rather than a second download.
// INTERIM ARTWORK (D4, fb-204 · D11, owner terminal 2026-08-20: "src image is
// just parameter"). The artwork is a PROP with the demo cat as its DEFAULT —
// `WordmarkArtwork` carries src AND intrinsic width/height together, because
// §11's zero-CLS attributes are only honest when the numbers travel with the
// file they describe. Both consumers render `<Wordmark />` and inherit the
// default, so §15.6's Publio swap is ONE edit to DEMO_ARTWORK — or a
// per-consumer override, which is the parameter's point. Still debt until that
// logo lands.
//
// KNOWN DEBT · basePath, the same one the SAL badge books (the KNOWN DEBT
// paragraph inside Footer's SAL-badge block) and now the LARGER instance of it
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
// THE NUMBERS ARE MEASURED, not guessed, and the TIGHTEST CELL IN THE REPO
// sets them. The Header hands this component the pill row minus its 1rem
// padding, its 1rem row gap and the 2.75rem burger: 203px at the 390 phone
// width, 147.00px at the 320 stress width (measured in the Storybook runner,
// whose scrollbar makes both the pessimistic figures — a real phone is ~15px
// wider). Against that, the name is 139px on one line at text-xl and 87.36px
// when it wraps to its longest word, and the artwork is 1.49:1, so it costs
// width fastest. SUB-PIXEL arithmetic, because that is the scale this fits in
// (F11: the first cut was written in whole pixels and hid a 0.38px
// over-constraint inside the bar):
//   · FULL SIZE — 90% artwork + gap-3 — needs ~237px (86.03 + 12 + 138.75),
//     and gets it from roughly a 420px viewport up, which is exactly where the
//     step lets go;
//   · BELOW `@max-xs` (a 20rem container: the pill at any phone width, and the
//     Footer's gutter box likewise) — gap-2 and a 40% artwork bring the
//     one-line lockup to ~185px against the 203px cell at 390: ONE LINE
//     with 17.94px to spare (G2 react r2 re-measured; an earlier 193.97/9.00
//     pair here was carried over from the pre-F11 fixture). Staying on one
//     line is fb-207 read literally:
//     today's header brand is one 139×28 line, and wrapping it at the phone
//     width would be precisely the changed aspect that ruling forbids;
//   · AT 320 nothing keeps it on one line — one line needs ~185px against a
//     147.00px cell — so the name WRAPS to two 28px lines inside the 4rem row.
//     The floor that has to fit is the MIN-CONTENT sum: 38.22 artwork + 8 gap
//     + 83.70 longest word = 129.92, i.e. 17.08px of real slack (13.42 against
//     G2's stricter 87.36 reading of the same word — D12's removed bar and
//     second gap are where the extra ~9px of room came from).
// When §15.6 lands a SQUARER logo than this 1.49:1 demo cat, the percentage can
// rise again without the step moving — the arithmetic above is the recipe, and
// Wordmark.stories.tsx is where it is re-measured.
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
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/** D4's committed demo derivative — the default until §15.6 lands (D11). */
const DEMO_ARTWORK: WordmarkArtwork = {
  src: '/images/demo/transparent-artwork-cat-256.webp',
  width: 256,
  height: 171,
};

export interface WordmarkProps {
  /**
   * The left half of the lockup — §8.1's "props with defaults" shape (D11):
   * both consumers stay `<Wordmark />`, and a rebrand is one edit to the
   * default here or one prop at a call site.
   */
  artwork?: WordmarkArtwork;
}

export function Wordmark({
  artwork = DEMO_ARTWORK,
}: WordmarkProps): ReactElement {
  return (
    // NO outer margin, and no width of its own: the CONSUMER owns the box
    // (§6.4/§6.8) — the Header hands it a `self-stretch` cell in the pill row,
    // the Footer a centred `h-16` box. `h-full` is how both of those become
    // the ruler the percentage-sized artwork resolves against.
    // THE ONE SUPPRESSED RULE, and the one place it is honest to suppress it:
    // jsx-a11y/anchor-is-valid says an anchor must be keyboard accessible, and
    // it is exactly right — which is why the wiring diff exists and why this
    // element is inert until it lands (D9 above). Suppressed here rather than
    // worked around: a `href="#"` would ship a real link to nowhere, and a
    // <button> would promise an action there is none of.
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
      {/* The name through ui/Heading's `title` step — byte-exactly
          `font-display text-xl text-ink-strong`, the string the Header used to
          spell inline on its brand anchor, so the swap is invisible to the
          baselines (fb-207). asChild because Heading answers "how big is this
          title" and never "which element is it": the host is a <span>, an
          inline generic that claims no outline slot — a mark repeated in the
          shell of every route must not (the Header's C2 rule, the Footer's
          brand row already following it). The text is DATA from lib/clinic.ts
          (§10.1), never a message key, so a rename is one edit. */}
      <Heading asChild>
        <span>{clinic.name}</span>
      </Heading>
    </a>
  );
}
