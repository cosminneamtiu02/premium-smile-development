import type { ReactElement, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Phone } from '@/assets/glyphs/Phone';
import { Pin } from '@/assets/glyphs/Pin';
import { isLocale } from '@/i18n/locales';
import { clinic, mapEmbedUrlFor } from '@/lib/clinic/clinic';
import { cx } from '@/lib/cx/cx';

// sections/ClinicLocation — the „Ne găsești" band: the opener, the live Google
// map, and the two contact rows beside it. Built to the owner-approved N2
// composition contract (board .claude/plans/clinic-location.plan.md, verdict
// fb-416, 2026-09-09), whose brief was four sentences: the real scrollable map
// exactly as the old site, no consent gate for now, the iframe in the section
// rather than in a `ui/MapFrame` atom, and no image anywhere.
//
// ── ZERO CLIENT ISLANDS, BY CONSTRUCTION — the Footer's contract, at a
// quarter of the size. There is no 'use client', no state, no ref and no event
// handler in this file, so the whole band compiles into the page's static HTML
// and ships zero bytes of JavaScript (§16). Three things that LOOK like
// interactivity and are not: the map's pan/zoom is Google's own page running
// inside the <iframe> (our document implements none of it); the whole-row
// hover below is a CSS rule, not code that runs per frame; and both rows are
// plain <a href>s, so every click is a full document load or a protocol
// handoff (§15.13). It still calls t() with no directive, and useLocale() for
// the map's language — next-intl's hooks are ISOMORPHIC: they resolve against
// the request-scoped config while this Server Component is pre-rendered, and
// read NextIntlClientProvider in Storybook and Vitest. §8.1 holds either way,
// since the atoms below only ever see finished text.
//
// ── THE CONSENT SEAM lives at ONE marked element (board D1, owner option A:
// "bypass cookies consent for the moment"). The embed renders UNGATED, at page
// load, exactly as the old site — an accepted, deferred risk recorded in
// CLAUDE.md §12 and COOKIES.md §7, where the measurement behind it also lives
// (the embed endpoint sets no cookie; the exposure is the IP + page-URL
// transfer, which `referrerPolicy="no-referrer"` trims to IP alone — D2). When
// the cookie-strategy lane ships a consent record, the <iframe> marked below is
// what it wraps, and the no-consent branch is that lane's to design (a picture
// is back on the table, fb-387). Nothing is stubbed here: no `hasMapConsent()`
// exists, so none is imported. What that lane inherits instead is
// ClinicLocation.test.tsx's attribute pins — a green suite to EXTEND rather
// than a design to reverse-engineer.
//
// ── KEEP-IN-SYNC with ui/GlyphButton — see ROW_HOVER below. GlyphButton.tsx
// carries the matching pointer back to this file, the way Button ↔ GlyphButton
// pair on `--fade` (fb-44): the two spellings are deliberately independent, so
// changing the system's feel is a two-file edit and never a drift.
//
// ── OLD → NEW: three deviations from "exactly the same", listed so no reviewer
// reads them as drift — the first two STANDING SITE LAW rather than this
// band's taste, the third a size this file got wrong for three weeks and now
// keeps on purpose.
//   1. The gutter. The old band spelled its own `pl/pr-[clamp(48px,10vw,200px)]`;
//      this one composes ui/Container, whose `containerClasses` is the ONE
//      gutter definition on the site (§15.15 a, fb-343). The number is NOT
//      restated here on purpose — tests/unit/gutter-single-spelling.test.ts
//      fences src/ against a second spelling, and that fence is the whole
//      product of the promotion. Geometry: identical to the old band from
//      480px up; below that the floor is 16px instead of 48px, which is the
//      margin every other band on the site already wears.
//   2. The disc's colours. The old disc was the old palette's accent; from
//      2026-09-09 to 2026-10-01 every disc on this site was the green CTA
//      family, and since 2026-10-01 these two wear ui/GlyphButton's LAVENDER
//      family (`tone="accent"` — the `accent` role of the menu buttons, the
//      old accent's AA-passing shade; the owner: "buttons for location and
//      phone next to the map" lilac). The hover face is still the mirror law
//      of PR #80 (solid DRAINS to outline's rest face), in that family. No
//      `hover:scale-105` and no shadow pop either: fb-49/fb-50 removed both
//      site-wide, because "jumps at you" was two extra animations on top of
//      the colour fade — and when the owner brought the growth half back the
//      evening of 2026-10-01 (the atoms' opt-in `motion="jump"`, six named
//      buttons: the Hero's pair, the doctor card's link, the bar's Contact,
//      the corner's two discs), these two row discs were not on his list and
//      hold still; tests/unit/jump-census.test.ts pins this file among the
//      still ones.
//   3. The row text size — CORRECTED 2026-10-02 (§15.32). The old row read
//      16px on phones and 18px from `sm:` up (`text-base sm:text-lg`). This
//      row wears `text-base` at every width, and Tailwind's `text-base` is
//      1rem: 16px, the old row's PHONE size, at every width. From 2026-09-09
//      until this date the paragraph said otherwise — that the 1.125rem body
//      base (§15.1) made `text-base` "already" the old `sm:text-lg`, 18px.
//      It does not: the base sits on `body`, and a `text-*` utility on the
//      span REPLACES the size the span would inherit; the span measures 16px
//      on the built page. Kept at 16 on purpose, not restored to 18: a review
//      card's body is ui/Text's `text-base` too, and the owner's base
//      reference is the two read 1 to 1 (THE BAND SCALE, below, which also
//      names the step up as a lever).
// Everything else is ported: the 2:1 map box, the `-m-3 p-3` hit-area trick,
// the single-anchor row, the whole-row hover, the 44px disc with its 20px
// glyph (44 and 20 DESIGN px inside the band scale — DISC_SIZE below),
// `loading="lazy"` and `allow=""`. The radius (D4) and the shadow (D3) take
// the house values — `rounded-md`, `shadow-aura` — and the aura happens to be
// numerically the old site's `shadow-cta`.
//
// ── D7 · THE CONTAINER-STEP MAPPING, and why there is a rhythm box. §6.5
// forbids a component from measuring the window, so the old media queries
// become steps on ui/Container's gutter box (viewport − 2×10vw):
//   · old `sm:` (640) → `@lg` (container 512px) — EXACT, because 640−128 = 512;
//   · old `lg:` (1024) → `@3xl` (container 768px) — fires around a 960px
//     viewport, i.e. identical at every §7 sampling point: 390 → box 312 and
//     768 → box 614 stack the rows BELOW the map, 1280 → box 1024, 1536 and
//     1920 put them beside it (the owner's fb-393 rule, checked with numbers).
// An element cannot query its OWN size, and Container IS the container — so
// the stepped `py` cannot ride on Container itself. It sits on the rhythm box
// one level in. The band still owns its vertical rhythm (Container's PAGE-BAND
// RECIPE, rule 3); only the element wearing it moves down a level, which the
// Footer — a single un-stepped `py-10` — never needed. The same box is where
// THE BAND SCALE rides when the page asks for it (below): Container's recipe
// rule 5 names the rhythm box for exactly that.
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — ui/Container's THE BAND
// SCALE). The owner, on this band, verbatim: "then there is the "Vizitează
// clinica noastră" page but there is a huge catch. i have the eyebrows and
// headings which i want alligned in offset and height as retierated in this
// message a thousand times and the huge catch is taht the map keeps expanding
// and the text with adress and phone number next to it keeps remianing the
// same. if i tune the screen at a widths and height of 1882x1141 i have what i
// would call a perfect almose or at least a really good raport in width of
// buttons and text to map. but i would want text to be bigger. in text, base
// reference that houls be kept between reviews text and for example "Strada
// Gheorghe Dima nr 3A, Sibiu" should always be 1 to 1 and somehow the window
// size should be adaptable too. regarding this section, those are not clear
// requirements, but the idea is the following, i do not want the map to be
// too large, the space the buttons take up too small or disproportioned and
// text just as readable as this always: [a doctor's quote]".
// THE DECISION (the planner's, the same day): `scaled` — the prop Home and
// Team pass — puts the rhythm box in ui/Container's two band-scale strings,
// `bandColumnClasses` and `bandScaleClasses`, so on a laptop or desktop, from
// a max(56rem, 896px) column, the WHOLE band — opener, map tray, rows, discs,
// words, rhythm — is ONE design drawn at the owner's 1401 window and scaled
// with every band around it, in the same design pixel, capped and centred at
// the same width. Three things follow by construction. (1) The eyebrow and
// the h2 have the other bands' size and left edge at every width ("alligned
// in offset and height"). (2) The map stops outgrowing its rows: the map
// takes the `1fr` track, every box beside it is its reference size × s, and
// the column is 1106 × s up to the cap, so every laptop and desktop width
// shows the reference picture, magnified — to within the typeface's optical
// sizing, which THE NUMBERS below measure at a point and a half of the map's
// share. (3) The words stay `text-base`, 16 DESIGN px — 16px at the 1401
// window and growing with the map past it. A review card's body is ui/Text's
// `text-base` too, so at the REFERENCE window an address and a review read 1
// to 1 — the owner's base reference (OLD → NEW, item 3, for why 16 and not
// 18). Past it they part ON PURPOSE: the reviews band scales its opener alone
// and keeps its deck — every card's words — at 16px (the owner: "you will not
// touch under any circumstance"), while the address grows with the map
// (≈ 21.6px at 1882, ≈ 14.6px at the step); the planner's reading of the two
// asks recorded in §15.32, the lever below.
// Below the step, on every touch device and in an engine that cannot
// register custom properties, nothing is declared: phones and tablets keep
// every pixel. NOT scaled, on purpose (globals.css, THE DESIGN SCALE): the
// tray's 1px hairline, the 2px focus ring, the aura — and Google's own
// controls and card inside the frame, which are Google's page.
// THE NUMBERS — measured 2026-10-02 on the real stylesheet and the committed
// typefaces (Chromium, this folder's components runner, the column set to
// the pixel; the built page has the last word). At the owner's 1882 × 1141
// window with a classic 15px scrollbar: column = 1867 − 2 × 188.2 = 1490.6,
// s = 1490.6 / 1106 = 1.348. The address and the phone 16 × s = 21.6px; the
// discs 44 × s = 59.3px with a 27.0px glyph; the h2 48.5px and the eyebrow
// 18.9px, the other bands' to the digit; the map 1041 × 521 — where develop
// draws 1146 × 573 beside 16px words — and each row's hit box 449px wide.
// The map is the column less the grid's gap and the rows' track, and the
// track is the rows' MARGIN box (320.67 at the reference: each row's `-m-3`
// gives back the 24px its `p-3` adds), so the reference × s would say 1490.6
// − (24 + 320.67) × s = 1026; the engine's 1041 is the face setting larger
// text a little narrower per em (`font-optical-sizing: auto` — DoctorShowcase
// D10's note): the words run 4.4 % under × s at s = 1.35 and 1.4 % over it at
// s = 0.91. So the map's share of the band's width holds within a point and
// a half — 68.5 % at a 1280 window's column, 68.8 % at the 1401 reference,
// 69.9 % at 1882 and past the cap — where develop's ran from 65.8 % to
// 83.9 % (a 2560 window). Past the cap (s = 1536 / 1106 = 1.389, from a
// ≈ 1939px window) the band is 1536px wide and centred: the map 1074 × 537
// beside 22.2px words.
// THE LEVERS, the owner's: (a) the words one step up, `text-lg` — 18 design
// px, a doctor card's quote size: the rows widen by an eighth of their words
// (≈ 32.6 design px) and the map narrows by as much, and an address then
// reads 1 to 1 with a doctor's quote instead of a review; (b) the map's share
// of the row — the map takes what the rows leave today, and a fixed share is
// one change to the grid's template.

/**
 * The `aria-labelledby` target. Hard-coded like the Footer's NAV_TITLE_ID and
 * for the same reason: exactly ONE instance of this band exists per page, so a
 * generated id would only make the pair harder to keep in step.
 */
const HEADING_ID = 'clinic-location-heading';

type ContactRowProps = {
  /** Where the row goes — a maps URL or a `tel:` handoff. */
  href: string;
  /** The link's accessible name — finished, translated; MUST contain `text` (SC 2.5.3). */
  label: string;
  /** The decorative icon the disc paints. */
  glyph: ReactNode;
  /** Visible text — DATA from lib/clinic, never a message. */
  text: string;
  /** target=_blank + rel="noopener noreferrer" — directions only; tel: stays same-tab. */
  external?: boolean;
};

// KEEP-IN-SYNC with ui/GlyphButton `variantClasses.solid.accent` (its `hover:`
// + `active:` members — the LAVENDER cell since 2026-10-01): the same five
// values, spelled with the `group-` prefix so
// the DISC flips when the whole ROW is hovered or pressed — the old site's own
// mechanism (owner fb-413, board D6 round 3). Zero runtime cost: a hover colour
// is a CSS rule the browser applies itself, not JavaScript, so the band's
// zero-island contract is untouched. NOT a restyle (§6.8): identical values, a
// second trigger; the atom's own `hover:` still fires when the disc itself is
// hovered. `group-active:duration-0` carries the atom's press-snap across too,
// so a row-driven press feels like a disc-driven one instead of fading for
// 400ms. ClinicLocation.test.tsx derives the expectation from a RENDERED
// GlyphButton and maps the prefixes — if the atom's hover face ever changes,
// that test fails and these words move with it. GlyphButton.tsx points back
// here from its `variantClasses` comment.
const ROW_HOVER =
  'group-hover:bg-surface group-hover:text-accent group-hover:inset-ring-accent ' +
  'group-active:bg-accent-strong group-active:text-ink-inverse group-active:duration-0';

// THE DISCS FOLLOW THE BAND (2026-10-02, §15.32 — the header's THE BAND
// SCALE). ui/GlyphButton's box is `size-[var(--disc-size,2.75rem)]` and its
// glyph five elevenths of the same variable — ui/disc.ts's D16: "the step is
// the FALLBACK of one variable, --disc-size, that a HOST may set per screen
// type through className". That fallback is a bare rem length, and the design
// scale remaps theme VARIABLES, never a literal — so inside a scaled band the
// discs would stay 44 CSS px while the words and the map beside them grew,
// "the space the buttons take up too small or disproportioned" (the owner).
// This host sets the variable to eleven spacing steps, ALWAYS, not only under
// `scaled`: outside the regime `--spacing` is the theme's 0.25rem, so the disc
// is 2.75rem — 44px with its 20px glyph, the fallback to the pixel (the test
// reads both back from the real stylesheet) — and inside a scaled band it is
// 44 design px with a 20-design-px glyph, because the variable is resolved on
// the disc, against the `--spacing` the band hands down. One rule for every
// mount, so the doctor page's band and Home's can never disagree about what a
// disc is made of — only about the pixel it is measured in.
const DISC_SIZE = '[--disc-size:calc(var(--spacing)*11)]';

/**
 * One row = ONE anchor (the old site's single click target: disc and text are
 * the same button as far as a thumb is concerned). The disc is DECORATION
 * painted by ui/GlyphButton in asChild mode onto an aria-hidden <span>: HTML
 * forbids a control inside a link — browsers recover by SPLITTING the markup,
 * which would cut the row in two — and `asChild` is the atom's own door for
 * "render no button of your own; paint your face on the element I nest" (board
 * D6, owner fb-392). The row wears `group` so ROW_HOVER can drive the disc from
 * anywhere on the strip.
 *
 * `-m-3 p-3` is the old hit-area trick, ported unchanged: the padding grows the
 * target well past the §9 44px floor while the negative margin cancels the
 * growth in layout, so nothing around it moves.
 *
 * NO `justify-*` (owner, pack round fb-422, 2026-09-09): the old site centred
 * each row on its own line below `lg:` (`justify-center lg:justify-start`), so
 * two rows of different length started at two different x positions. The
 * owner asked for one shared start on phone and tablet — "the contact buttons
 * should start at the same spot" — so the anchor keeps flex's default start
 * alignment at EVERY width, and both discs sit on the same left edge the
 * heading and the map already use. A deliberate deviation from "exactly the
 * same", on the owner's word.
 *
 * `hyphens-none` (G2 a11y, 2026-09-09): the body's site-wide `hyphens: auto`
 * (§15.14) is inherited by the address span, and at 320/390 the address wraps
 * — so „Gheor-/ghe" is possible wherever the engine holds a dictionary for
 * the page's `lang` (a de/fr/it page would syllable-split a Romanian proper
 * noun with a foreign dictionary). The owner's §15.14 rider — "text on buttons
 * in general is never allowed to be split" — covers this control row the same
 * way it covers ui/Button and ui/TextButton; `hyphens` inherits, so the anchor
 * wears the opt-out once for both the disc's neighbour and any future line.
 *
 * `aria-label` is REQUIRED by the atom's types (§6.3) and lands on the span,
 * where it is inert — the span is aria-hidden, so the ROW's own aria-label is
 * the one AT hears, exactly once.
 */
function ContactRow({
  href,
  label,
  glyph,
  text,
  external = false,
}: ContactRowProps): ReactElement {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group -m-3 flex items-center gap-4 rounded-md p-3 hyphens-none outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
    >
      {/* shadow-aura through className — the FloatingActions precedent (its
          "AURA ON THE CORNER" comment): Tailwind's shadow and ring layers
          compose into ONE box-shadow value, so the static aura rides along
          unmoved while the atom's hairline lerps under it. Numerically the old
          site's `shadow-cta`. DISC_SIZE is the host's one geometric word: the
          box the atom's own fallback would draw, in the band's pixel. */}
      <GlyphButton
        asChild
        variant="solid"
        tone="accent"
        aria-label={label}
        className={cx('shadow-aura', ROW_HOVER, DISC_SIZE)}
      >
        <span aria-hidden="true">{glyph}</span>
      </GlyphButton>
      {/* The section's own <span>, not ui/Text (board D5, owner fb-412): the
          old row is weight 500 and Text has no medium axis — growing one is a
          §6.6 change that does not belong in a section lane. A section writing
          utilities on its OWN markup is lawful (§6.7); the ContactModal's
          "plain <h2> wearing the dress" is the precedent. `text-base` is
          Tailwind's 1rem — 16px, the old row's PHONE size, at every width
          (the 1.125rem body base sits on `body` and this utility replaces it;
          the header's OLD → NEW, item 3, corrected 2026-10-02) — and 16
          design px inside the band scale: a review card's body size, the
          owner's 1-to-1 reference (THE BAND SCALE). */}
      <span className="text-base font-medium text-ink">{text}</span>
    </a>
  );
}

/**
 * The band's props — ONE, since 2026-10-02 (§15.32). Until that day the band
 * took nothing: it translates itself and reads its facts from lib/clinic, and
 * it still does. The prop is additive with the old behaviour as its default
 * (§6.6), so the call that passes nothing renders what it always rendered.
 */
export type ClinicLocationProps = Readonly<{
  /**
   * Draw the band in THE BAND SCALE's design pixel on a laptop or desktop
   * (the header's THE BAND SCALE; ui/Container's): the rhythm box wears
   * `bandColumnClasses` + `bandScaleClasses`, so opener, map, rows, discs and
   * words scale with the column like every band around them and cap and
   * centre at the same width. Home and Team pass it — every band below the
   * Home hero and every band of the Team page wears the scale. Default
   * `false`, because the doctor page mounts this band too and its other bands
   * do not scale yet: there the band stays its rem self, every pixel as
   * before. Below the step, on every touch device and in an engine that
   * cannot register custom properties, `true` declares nothing either.
   */
  scaled?: boolean;
}>;

export function ClinicLocation({
  scaled = false,
}: ClinicLocationProps = {}): ReactElement {
  const t = useTranslations('home');
  // Locale-invariant NAP data (§10.1) — an address is not copy, and the Footer
  // prints the same two fields. Translating it would create a second source
  // that can disagree with the JSON-LD.
  const address = `${clinic.address.street}, ${clinic.address.city}`;
  // THE MAP SPEAKS THE PAGE'S LANGUAGE (G2 a11y, 2026-09-30). Google's controls
  // and its place card take their language from the url and from nothing else,
  // so each locale's frame is lib/clinic's ONE url with its two language
  // fields swapped (`mapEmbedUrlFor`, where the measurement lives). useLocale
  // answers a plain string: a value outside the five — the workbench's
  // pseudo-locale — keeps the url as pasted rather than inventing a language.
  const locale = useLocale();
  const mapSrc = isLocale(locale)
    ? mapEmbedUrlFor(clinic.mapEmbedUrl, locale)
    : clinic.mapEmbedUrl;

  return (
    // Full-bleed band, per Container's PAGE-BAND RECIPE: the semantic outer
    // owns the paint, the Container inside owns the width and the container
    // context. `bg-page` is the page ground the old band also used. NO outer
    // margin — the page owns the rhythm between its bands (§6.4).
    <section aria-labelledby={HEADING_ID} className="bg-page">
      <Container>
        {/* The rhythm box — band-owned `py` on container steps (board D7; see
            the file header for why it cannot sit on Container itself). Under
            `scaled` it also wears THE BAND SCALE's two strings (the header's
            paragraph; Container's recipe rule 5 names this box); without it
            the class list is the three `py` tokens alone, byte for byte. */}
        <div
          className={cx(
            'py-12 @lg:py-16 @3xl:py-20',
            scaled && bandColumnClasses,
            scaled && bandScaleClasses,
          )}
        >
          {/* The eyebrow/title pair every content section opens with. The id
              lands on the <h2> — that is the half of the aria-labelledby pair
              the <section> above points at, and it is what turns the element
              into a named `region` rather than a generic box. */}
          <SectionHeading
            eyebrow={t('location.eyebrow')}
            title={t('location.title')}
            id={HEADING_ID}
          />
          {/* Map and rows: one column until @3xl, then the map takes the free
              track and the rows hug their content beside it (`1fr auto`,
              vertically centred). gap-6 is the section owning ALL child
              spacing (§6.4); the old `lg:gap-6` was a no-op restatement of the
              base value and is dropped. */}
          <div className="mt-8 grid gap-6 @lg:mt-10 @3xl:mt-12 @3xl:grid-cols-[1fr_auto] @3xl:items-center">
            {/* ── CONSENT SEAM (board D1, owner option A 2026-09-09) ─────────
                The live Google embed renders UNGATED, at page load, exactly as
                the old site — an accepted, deferred risk on the owner's word
                (CLAUDE.md §12 rider; COOKIES.md §7). When the cookie-strategy
                lane ships a consent record, THIS element is what it wraps:
                render the <iframe> only when the record grants, and design the
                no-consent branch THERE (a picture is reopened as an option,
                fb-387). ClinicLocation.test.tsx pins the iframe's attributes so
                that lane inherits a green suite to extend.
                The tray is what a visitor sees while Google's tiles arrive —
                and, with the visual net's network fence (board D9), what the
                baselines photograph: `overflow-hidden` is what makes the frame
                respect the house `rounded-md` corners (D4), `bg-line-subtle` is
                the on-brand ground behind it, and `shadow-aura` is the EXISTING
                token (D3), not a new one. */}
            <div className="aspect-[2/1] overflow-hidden rounded-md border border-line-subtle bg-line-subtle shadow-aura">
              {/* `title` is the frame's accessible name — without it a screen
                  reader announces an unnavigable "frame" and axe fails the
                  story. `referrerPolicy="no-referrer"` sends Google no page
                  address at all: stricter than the old site's value AND than
                  the browser default, with the embed measured to render
                  identically (board D2). `allow=""` is an explicit EMPTY
                  permission list — no fullscreen, no microphone, no payment —
                  which is a different thing from omitting the attribute. */}
              <iframe
                src={mapSrc}
                title={t('location.mapAlt', { name: clinic.name })}
                loading="lazy"
                referrerPolicy="no-referrer"
                allow=""
                className="h-full w-full border-0"
              />
            </div>
            {/* The rows stack under the map below @3xl and sit beside it above
                — the owner's fb-393 rule, met at every sampled width. Stacked
                or beside, both rows start on the same left edge (fb-422).
                THE TABLET ARRANGEMENT (owner, pack rounds 2–5, 2026-09-09 —
                final: "they should sit in the same line … one on the left
                side of the container and the other on the right side"): from
                the @lg step — the tablet band, container ≥ 512px, i.e. the
                old `sm:` — the two rows share ONE LINE, the address row pinned
                to the container's start edge and the phone row to its end
                edge (`flex-row justify-between`); at @3xl they go back to a
                column beside the map, where the `auto` track owns them. Phone
                (box < 512px) keeps the stacked, flush-start column. The rows'
                widths are data-driven and locale-invariant (address + phone),
                so the line never needs German headroom; at the 512px floor
                the two rows total ~473px and still fit, 19px beyond their
                20px gap (re-measured 2026-09-30 with the clinic's real
                address; the placeholder's was ~460px).
                HOVER STAYS PER ROW by construction: each <a> is its own
                `group`, this column carries none, and on one line the two
                `-m-3` hit areas do not even touch — the test pins both facts
                (owner: "if I hover on one … not both of them light up"). */}
            <div className="flex flex-col gap-4 @lg:flex-row @lg:justify-between @lg:gap-5 @3xl:flex-col @3xl:justify-start">
              <ContactRow
                href={clinic.directionsUrl}
                label={t('location.directionsLabel', { address })}
                glyph={<Pin />}
                text={address}
                external
              />
              {/* No target/rel on the call row: `tel:` hands the number to a
                  protocol handler, it does not navigate a browsing context —
                  _blank would open and orphan a blank tab on desktop (the
                  Footer's phone-disc line). The href is E.164 because that is
                  what a dialler needs; the visible text is the human format
                  because that is what a reader needs. */}
              <ContactRow
                href={`tel:${clinic.phone}`}
                label={t('location.callLabel', { phone: clinic.phoneDisplay })}
                glyph={<Phone />}
                text={clinic.phoneDisplay}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
