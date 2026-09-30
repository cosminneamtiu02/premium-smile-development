'use client';

import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { Modal } from '@/components/ui/Modal/Modal';
import { Text } from '@/components/ui/Text/Text';
import { Phone } from '@/assets/glyphs/Phone';
import { Whatsapp } from '@/assets/glyphs/Whatsapp';
import { clinic } from '@/lib/clinic/clinic';
import type { OpeningHours, SchemaDay } from '@/lib/clinic/clinic';
import { useContactModal } from './useContactModal';

// sections/ContactModal — the panel itself: the site's one conversion goal
// (§1: the visitor reaches the clinic) rendered as a dialog. Built to the
// owner-approved N2 composition contract, board
// .claude/plans/contact-modal-n2-contract.plan.md (2026-08-27), which picked
// exploration story 9 — a centred hero — trimmed by the owner on 2026-08-28 to
// a title, a lead and the call control, and REWORKED on 2026-09-04 to the
// two-channel shape of board
// .claude/plans/contact-modal-whatsapp-n2-contract.plan.md (v4, fb-351…358).
//
// ── WHAT THE v4 REWORK CHANGED, in one sentence: the dialog stopped asking
// „Probleme?" and started answering „Ne găsiți la telefon sau pe WhatsApp." —
// the title now NAMES the two channels, and the body is those two channels,
// each as a titled group of [heading · control · caption]. The lead line is
// gone (its `contact.lead` key with it, from all five files); the second
// channel is the clinic's WhatsApp conversation, the same wa.me target the
// Footer's contact disc opens (board contact-touchpoints, 2026-09-02: ONE
// modal, and a WhatsApp modal is specifically banned — the discs act directly).
//
// ── NOT EXPORTED FOR PLACEMENT. ContactModalProvider renders this once, after
// its children (D1); consumers reach the dialog through ContactModalTrigger
// and useContactModal, never by placing it themselves. Two of them on a page
// would mean two focus returns and two scroll locks fighting over one visitor.
//
// ── WHAT THE ATOM ALREADY DOES, so this file does not (ui/Modal D1/D11/D13):
// the top layer, the inert page behind it, Escape, the focus return to
// whatever opened it, the scroll lock, the scrim and the backdrop press. This
// section supplies content, a name and the switch — nothing else.
//
// ── THE NEVER-SCROLL RULE, and how it is kept since the atom's rework
// (ui/Modal D16–D21, owner 2026-08-28). `scrollable={false}` is the whole of
// it: the atom then puts NO cap on the white box, so the box is exactly as
// tall as this composition and its body neither scrolls nor turns into a
// region with a tab stop. The visitor is never handed a card with a scrollbar
// down its middle. There is no `height` step either — a fixed height would
// reintroduce a box whose content can outgrow it, the same picture by another
// route. The v4 body is twice the old one, so the numbers moved and are
// written down MEASURED (ContactModal.test.tsx runs them with the real font
// subset loaded, and the suite pins every one of them in RO and DE).
//
// ── THE RHYTHM IS STATE-DEPENDENT, and it is the ONLY way the owner's rulings
// survive together. They pull in opposite directions:
//   · fb-354 (2026-09-04) approved the AIR, and the live-Storybook reviews on
//     2026-09-05 pushed it FURTHER, twice: "they look too crammed within the
//     modal", then "it looks very crammed" with four seams named — bar→rail,
//     both sides of the Or-word, and below the second group. Those four are
//     MACRO seams, between blocks; the owner did not ask for more room inside a
//     group, so the in-group stack stays at gap-2 and only the seams grew
//     (mt-3 · gap-7 · gap-7 · mb-4);
//   · the Q1 answer the day before (2026-09-04, "tighten the gaps") demanded
//     that a phone held SIDEWAYS keep the whole panel motionless, which no airy
//     rhythm can do: at 844×390 the layer offers 358px and the airy box
//     measures 502px (measured 2026-09-26 at 30px);
//   · and the title's 27px (the peer-applied edit below, owner 2026-09-05) put
//     a SECOND LINE in the bar at every width the site serves, which broke
//     both tight budgets at once (sideways −16px, German at 320 −2px — measured
//     then, at 27px). The owner chose OPTION B to fix it (2026-09-05,
//     in-terminal): the title keeps its size at EVERY viewport and the tight
//     states buy the pixels from their own gaps instead — rail 12 → 4px, group
//     4 → 0. The alternative on the table, a title that fell back to Heading's
//     20px step in those two states, was explicitly NOT taken. Since
//     2026-09-26 the title wears Heading's 30px `section` step (§15.24) and
//     option B still pays for it — measured 2026-09-26 at 30px: the bar goes
//     68 → 96px on a sideways phone (one title line → two), the title runs to
//     three lines at 390 and four at 320 (five in German), which left the
//     tight states 0px of slack sideways and 30px at 320 in German. The same
//     day the sideways state gave up its last rail gap, `gap-1` → `gap-0`
//     under the height query only (G2-R2 tier 2 — the 30px title's cost
//     bought back in part; candidates B–I measured and rejected, see the
//     ledger): 844×390 box 358 → 354, slack 0 → 4, RO and DE; every airy state
//     byte-identical (measured 2026-09-26 at 30px). The width query keeps its
//     `gap-1`, and where BOTH queries hold (a 320×500 zoom window) the height
//     rule ALONE loses to it — Tailwind emits the width rule after the height
//     rule — which left German there 2px over (470 against 468). That is the
//     ONE place the combined regime needed its own rule: a rail gap of 0 under
//     both queries at once (the rail's note has the class and why its operand
//     order matters), which takes 320×500 from 458 / 470 (+10 / −2, the layer
//     scrolling in German) to 454 / 466 (+14 / +2), measured 2026-09-26 at
//     30px.
// So the air is the DEFAULT and the tightening is a RESPONSE TO ROOM, not a
// global trade. TWO QUERIES turn it on, and each one is a measured boundary
// rather than a taste:
//   · `max-height: 33.5rem` (536px) — the sideways phone. Above it the panel
//     with its divider and its seams measures 502px and needs 534px of
//     viewport; at 537 the slack is 3px and at 536 the tight state takes over
//     with 150px (measured 2026-09-26 at 30px), so the two states MEET with no
//     gap: there is no height at which this dialog scrolls. In that state ALL
//     FOUR SEAMS collapse and go further than they used to — `mt-0 · gap-0 ·
//     mb-0` on the rail (its gap `gap-1` from option B, owner 2026-09-05,
//     until G2-R2 tier 2 on 2026-09-26) and `gap-0` inside each group — which
//     is what pays for the title's SECOND LINE at that width: 354px against a
//     358px budget, 4px to spare (measured 2026-09-26 at 30px; the 27px title
//     had left 8, the 30px title on `gap-1` 0).
//     (This query has moved three times, and always behind a measurement it
//     lost to: 26.875rem when the airy box was 378px, 29.5rem when the divider
//     made it 434, 32rem when the seams made it 474, 33.5rem when the 27px
//     title made it 494. The 30px title did NOT move it: the airy box's 534px
//     of need still sits below 537, the first row of the airy state (measured
//     2026-09-26 at 30px). A threshold that stays behind its own arithmetic is
//     just a scrolling band nobody measured — probed on BOTH sides every time,
//     and all three variant families — rail, ChannelGroup, the divider's
//     `hidden` — sit on the same number, because a mixed band is the other way
//     this goes wrong.)
//   · `max-width: 21.25rem` (340px) — the 320px accessibility stress width,
//     where the panel is only 288px wide and the title runs to five lines.
//     Uncollapsed, the box would reach 614px in Romanian and 590 in German
//     against that phone's 536px budget; the same collapse lands them at 506
//     and 482 (30 and 54px of slack), WITH the divider still at full size —
//     the owner's lever order for an upright overflow (2026-09-05). Probed at
//     340/341; 390 and up are never affected. (Measured 2026-09-30, after the
//     hours caption lost its Saturday half and its second line here; the
//     note under the table has the engine and the 2026-09-26 numbers.)
// MEASURED 2026-09-26 AT 30px, the rail's height-query gap at 0 (Chromium,
// overlay scrollbars — a phone's), RO / DE, box height (slack against the
// layer's budget) — the two 320-wide rows RE-MEASURED 2026-09-30, see below:
//   844×390  tight, no divider  354 / 354  (+4)   ← the case the height query is for
//   844×536  tight, no divider  354 / 354  (+150) ← its last row
//   844×537  airy               502 / 502  (+3)   ← the first row above it
//   320×568  collapsed seams, divider  506 / 482  (+30 / +54) ← worst upright
//   390×844  airy               518 / 518  (+294 / +294)
//   768×1024 · 1280×800 · 1536×864 · 1920×1080  airy  502 / 502 everywhere
//   320×500  both queries, no divider  466 / 442  (+2 / +26) ← the combined rule
// THE 320-WIDE ROWS, 2026-09-30 (Chromium 151 on macOS, phone emulation —
// overlay scrollbars; every other row re-read the same day, unchanged).
// `contact.callHours` lost its Saturday half, so at this width the hours
// caption holds ONE line in both languages where it took two, and each box is
// 24px lower than the day before: 530 / 506 → 506 / 482, and 490 / 466 →
// 466 / 442. The GERMAN halves of the old pair are the 2026-09-26 table
// exactly (506, 466); the ROMANIAN ones are not — that table had 494 / 454, a
// four-line title, where this engine breaks „WhatsApp." inside the word and
// gives Romanian five lines like German. So Romanian is the taller language
// at this width here, and before the caption changed its 320×500 box stood
// 22px OVER the budget on this engine — the one window where this dialog
// scrolled. It clears it by 2 now.
// KNOWN BOUNDARY, recorded rather than smoothed: at the 320px width the panel
// needs 538px of viewport height in its taller language (506 plus the layer's
// 32 — Romanian on the engine of the 2026-09-30 rows, German until then),
// which the §7 stress phone (568) has and a 200%-zoom window of 320×500 does
// not — but there both queries hold, the divider hides and the rail's
// combined-regime rule closes its gap, so the box is 466px against a 468px
// budget and even that window does not scroll. Below it — under 498px of
// height at that width, the 466 plus the layer's 32 — the LAYER scrolls, which
// is ui/Modal's designed answer for content that cannot fit (D17/D18) and the
// §9 reflow regime rather than a device. Hiding the divider upright to buy
// those pixels is NOT this lane's call (owner, 2026-09-05). The same regime
// covers a desktop engine with CLASSIC scrollbars at that width: globals'
// `scrollbar-gutter: stable` on <html> takes 15px off the layer, so the German
// panel is 273px wide, its title runs to six lines and the layer scrolls 34px
// at 320×568 — and 62px at 320×500, the combined-regime rule notwithstanding
// (both measured 2026-09-30; 58 and 86 while the caption took two lines,
// measured 2026-09-26 on Windows and reproduced on develop here) — which is
// why the table above is read with overlay scrollbars.
// §6.5 ON THE MEDIA QUERIES, which an atom would not be allowed: media queries
// are the section/page tier's tool, and this section is the one place they are
// unavoidable — a container query cannot see what this needs, because the
// panel is a TOP-LAYER element anchored to the VIEWPORT and the budget it must
// respect is the viewport's own height. The queries therefore watch exactly the
// dimensions the never-scroll rule lives in, and nothing else.
// All class literals are spelled out in full at their elements (never built by
// concatenation): Tailwind's scanner reads source text, so a composed variant
// name would emit no CSS at all.
// In the BUILT sheet the queries come out in modern range syntax —
// `@media (height<=33.5rem)`, `@media (width<=21.25rem)` — the same conditions,
// worth knowing before grepping for "max-height" and concluding nothing
// compiled. The suite does not trust either spelling: it reads the computed
// row-gap and the divider's computed display at both states
// (ContactModal.test.tsx), which is the only check that can tell an emitted
// rule from a class name that means nothing.
//
// ── THE TITLE SITS IN THE BAR, CENTRED (owner, 2026-08-27, chat). It moved out
// of the body and into ui/Modal's `header` slot at the same RELATIVE position
// it had before — centred on the panel, not on the slot (the arithmetic is at
// the header prop below). Two things come with the move: the ~44px of empty
// bar the body-title layout paid for is reclaimed, so the panel is shorter at
// every width, and the dialog reads as a titled sheet rather than a poster.
// `aria-labelledby` is unaffected — the id travelled with the <h2>. The v4
// rework changed the title's VALUE only; nothing about this wiring moved.
//
// ── ONE GROUP COMPONENT, RENDERED TWICE (the owner's "same component for
// different stuff"). Both channels have the identical shape — a title, the
// control it names, a caption qualifying it — so ChannelGroup below is written
// once, file-locally and NOT exported: it is this panel's internal rhythm, not
// a reusable piece, and §4's promotion rule is explicit that a composite never
// climbs to ui/ however often it is reused. The moment a THIRD consumer
// outside this file wants it, that is a contract conversation, not an export.
//
// ── THE RAIL, and why both green controls are the same width. The two groups
// sit on ONE grid whose width is `fit-content`: the widest thing in either
// group decides the column, and every child stretches to it. So the pair reads
// as one stack of equal blocks in all five languages without a single fixed
// pixel (§8.4: text expansion decides the width, never a magic number), and
// `max-w-full` caps the rail at the panel's inner width so 320px wraps text
// instead of overflowing (§7).
// `mx-auto` + `w-fit` rather than an inline-grid: auto margins do not centre an
// INLINE-level box (they resolve to zero), so centring an `inline-grid` would
// need `text-align` on a wrapper element that would otherwise not exist. Same
// shrink-to-fit width, one element fewer.
//
// ── GERMAN SIZES IN EVERY LANGUAGE (owner, 2026-09-05: "i like the german ones
// very much, keep that sizes of elements throughout all languages"). Without a
// floor, `fit-content` gives each locale its own width — German 391.88px,
// Romanian 313.08px at the same viewport — and the panel looks like a different
// design per language. `min-w-[min(24.5rem,100%)]` is that floor: 24.5rem =
// 392px is the GERMAN rail MEASURED at 768, 1280, 1536 and 1920 on 2026-09-05
// (identical at all four — the content, not the screen, sets it), rounded up
// from 391.88 to the nearest half-rem.
// It is a MINIMUM, not a size: a locale whose label ever runs wider still grows
// past it, which is what keeps §8.4 true rather than freezing a German number
// into the layout. RE-MEASURE TRIGGER: any edit to `contact.whatsapp` or
// `contact.callHours` in de.json — those two strings are what 392 measures.
// Re-measured 2026-09-30, when `callHours` lost its Saturday half: the German
// rail is still 391.88px at 1280, before and after — the WhatsApp label sets
// it, so the floor stands unchanged.
// The `min(…, 100%)` guard is load-bearing, not defensive: at 390 the panel's
// inner width is 309px and at 320 it is 239px, so a bare `min-w-[24.5rem]`
// would push the rail past the box and out of the dialog. With the guard the
// floor simply collapses to the available width, and every locale is equal
// there too — by the cap instead of by the floor.
//
// ── §8: every visible string is either t() from the `contact` namespace —
// which exists in all five message files, values authored by the owner — or
// data from lib/clinic/clinic.ts (§10.1: the same phone number, WhatsApp number and
// opening hours the Footer prints and the JSON-LD will publish). EIGHT keys
// carry the dialog now: heading · callHeading · callHours · or ·
// whatsappHeading · whatsapp · whatsappNote · close.
// `or` arrived on 2026-09-05 with the divider, and it took a word WITH it: the
// second group's title was „Sau scrieți-ne" and is now „Scrieți-ne" in all five
// files, because the conjunction it carried is the divider's job now. The two
// edits are one change — a translator who reverts either half prints the word
// twice or not at all.
// The hours caption is the §10.5 amendment the owner made on 2026-09-04
// (fb-349/350): the schedule returns to this panel, but as ONE interpolated
// line — never the Footer's <dl> block a second time. The times come from
// lib/clinic/clinic.ts and the day-name abbreviations from the translations, which is
// the only division that keeps five locales honest: „Lun–Vin" and „Mo.–Fr."
// are copy, 09:00 and 19:00 are data.
//
// 'use client' because the switch, the dialog's showModal() and the focus move
// are browser-time work (§16). The markup still pre-renders — closed, hidden,
// costing nothing until a trigger is pressed.

/**
 * The schedule row covering `day`, found BY DAY NAME rather than by index
 * (§10.1). Today the week is ONE entry and the guards below keep it so, which
 * makes `hours[0]` the same row — but the day the clinic's week gains a second
 * entry and the caption is re-authored for it, a lookup by name keeps
 * printing the right times where a blind index would print whichever entry
 * came first.
 *
 * Loud on a miss, in lib/hours/hours.ts's idiom: a caption that reads „Lun–Vin –"
 * sends a visitor to a locked door, so a schedule this copy no longer fits
 * fails the build instead of shipping. The `callHours` message names the one
 * weekday row in all five languages, so the copy and the data move together
 * or not at all.
 *
 * `Readonly<…>` because the row IS the singleton's own object (G2 ts fold):
 * handing out a mutable reference would let a future consumer edit the clinic's
 * hours for the Footer and the JSON-LD too, from here.
 */
function hoursCovering(day: SchemaDay): Readonly<OpeningHours> {
  const row = clinic.hours.find((entry) => entry.days.includes(day));
  if (!row) {
    throw new Error(
      `sections/ContactModal: lib/clinic/clinic.ts has no opening-hours entry ` +
        `covering ${day}, which the contact.callHours message prints.`,
    );
  }
  return row;
}

const weekdayHours = hoursCovering('Monday');

/**
 * What a reshaped week costs, said once for both refusals below — and said
 * WHOLE (G2 typescript, 2026-09-30): the message files alone would leave the
 * build throwing the same error, because these guards hard-code the shape
 * and t() passes the caption exactly two arguments.
 */
const RESHAPE_REMEDY =
  `Re-author callHours in all five message files for the new shape, and ` +
  `with it the arguments t() passes that key and the guards in this file.`;

// …AND THE SHAPE THE COPY ASSUMES, not just the days it names (G2 react MEDIUM
// fold). The caption prints a SPAN — „Lun–Vin {weekOpens}–{weekCloses}" and its
// four siblings — which is a claim about all five weekdays, while the lookup
// above only proves Monday. Split the weekday entry (Mon–Thu one row, a short
// Friday another) and every gate would stay green while the panel printed
// Monday's times under a „Lun–Vin" label and the Footer, which renders EVERY
// row, showed the truth beside it. So the assumption is checked where it is
// made, at module scope, and a re-split fails the build with the copy edit it
// requires spelled out. ContactModal.test.tsx pins the same fact outside-in,
// straight from lib/clinic/clinic.ts.
const WEEKDAY_SPAN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const satisfies readonly SchemaDay[];

const uncoveredWeekdays = WEEKDAY_SPAN.filter(
  (day) => !weekdayHours.days.includes(day),
);
if (uncoveredWeekdays.length > 0) {
  throw new Error(
    `sections/ContactModal: lib/clinic/clinic.ts no longer covers ` +
      `${uncoveredWeekdays.join(', ')} in the same entry as Monday, so the ` +
      `contact.callHours span (Mon–Fri, one pair of times) would print ` +
      `Monday's hours for days the clinic now keeps different ones. ` +
      RESHAPE_REMEDY,
  );
}
// …AND NOTHING BESIDE IT. Since 2026-09-30 the clinic's week IS that one entry
// — Saturday and Sunday closed — and the caption names only „Lun–Vin", so any
// other opening would be a day the Footer prints and this panel silently
// leaves out: a weekend day added to that entry, or a second entry (a
// re-opened Saturday, a split day). Checked here for the reason the span is:
// either change fails the build with the copy edit it requires spelled out.
// ContactModal.test.tsx pins the same facts outside-in.
const WEEKEND = ['Saturday', 'Sunday'] as const satisfies readonly SchemaDay[];

const openWeekend = WEEKEND.filter((day) =>
  clinic.hours.some((entry) => entry.days.includes(day)),
);
if (openWeekend.length > 0 || clinic.hours.length !== 1) {
  throw new Error(
    `sections/ContactModal: the contact.callHours caption prints ONE Mon–Fri ` +
      `pair of times and nothing for the weekend, but lib/clinic/clinic.ts ` +
      (openWeekend.length > 0
        ? `opens on ${openWeekend.join(', ')}`
        : `splits the week into ${clinic.hours.length} entries`) +
      `. ` +
      RESHAPE_REMEDY,
  );
}

interface ChannelGroupProps {
  /** Already-translated group title; rendered as the panel's <h3> (§8.1). */
  heading: string;
  /** The line under the control — hours, or a reply promise. */
  caption: ReactNode;
  /** The one control this group is about. */
  children: ReactNode;
}

/**
 * One way to reach the clinic: a title, the control, and the caption that
 * qualifies it. File-local by design (see the header note) — nothing outside
 * this panel renders one.
 *
 * Its inner gap is the rail's smaller half and moves with it: `gap-2` normally,
 * `gap-0` under either tightening query — the stack closes up entirely there,
 * which is where option B found the pixels the title's second line costs
 * (header note): 32px of the 88px the sideways collapse saves (the rail's last
 * 4px joined it on 2026-09-26, G2-R2 tier 2), and with the 30px title's 96px
 * bar that state keeps 4px to spare (measured 2026-09-26 at 30px).
 * Written here in
 * full rather than passed in as a prop — the two literals are a KEEP-IN-SYNC
 * pair with the rail's, and a gap arriving from outside would let a caller give
 * this component a rhythm the panel's own budget never approved (§6.4/§6.8: the
 * parent owns spacing BETWEEN children, the group owns its own three lines).
 */
function ChannelGroup({
  heading,
  caption,
  children,
}: ChannelGroupProps): ReactElement {
  return (
    <div className="flex flex-col gap-2 [@media(max-height:33.5rem)]:gap-0 [@media(max-width:21.25rem)]:gap-0">
      {/* h3 because the panel's own title is the h2 (§9: logical heading
          order, never a skipped level), and asChild because ui/Heading never
          picks a heading tag itself. The DEFAULT `title` step, not `section`:
          `section` is the page-band size, which inside a 32rem dialog would
          shout over the very title that names it. */}
      <Heading asChild>
        <h3 className="text-center">{heading}</h3>
      </Heading>
      {children}
      {/* `text-center` PER PARAGRAPH, not once on the column: globals.css
          gives every <p> `text-align: start` in its base layer, and a
          declaration on the element beats a value inherited from an ancestor —
          so a caption that wraps to two lines would sit ragged-left under a
          centred control. The Footer documents the same trap. §6.8: className
          is merged last by the atom, so this is a parent utility, never a
          restyle of ui/Text's internals. */}
      <Text tone="muted" className="text-center">
        {caption}
      </Text>
    </div>
  );
}

export function ContactModal(): ReactElement {
  const { isOpen, close } = useContactModal();
  const t = useTranslations('contact');
  // The <h2> below carries this id and the dialog points at it: one generated
  // string, so a page that ever renders the section twice (a story canvas
  // showing two states side by side) still names each dialog with its own
  // heading. useId is hydration-safe by construction — React generates the
  // same value on both sides (§16.2).
  const titleId = useId();

  return (
    <Modal
      open={isOpen}
      onClose={close}
      // md (32rem) — the middle step: a poster-shaped panel on a laptop, and
      // at 320px the same 288px card every step collapses to. NO `height`, see
      // the header note.
      width="md"
      // The owner's rule, in one prop (ui/Modal D16): the box is never capped,
      // so nothing inside this dialog ever scrolls — and it stays shorter than
      // every viewport this site is tested at, so the atom's layer has nothing
      // to scroll either (see the header note for the v4 numbers).
      scrollable={false}
      closeLabel={t('close')}
      aria-labelledby={titleId}
      // THE TITLE, in the atom's bar and centred on the PANEL — which is not
      // the same as centred in the slot, and the difference is the whole
      // reason this wrapper exists. ui/Modal's bar is
      // [slot flex-1][gap-3 = 12px][✕ size-11 = 44px], so the slot is 56px
      // narrower than the panel's content box and its centre sits 28px to the
      // inline-start of the panel's. `ps-14` (3.5rem = 56px) pads the
      // wrapper's content box on that side, moving ITS centre back by exactly
      // 56 / 2 = 28px — onto the panel's centre, i.e. the same relative
      // position the title had while it lived in the body.
      // Those two numbers are MIRRORED from ui/Modal's `barClasses` and the
      // ✕'s GlyphButton md size. If either ever changes, this padding follows;
      // it is recorded here rather than hidden so the coupling is findable
      // from both ends. RE-READ AT 27px (2026-09-05) and still correct: both
      // numbers are box geometry, independent of the type size. What the bigger
      // title DID change is the pad's COST — the slot is ~200px wide at 320px,
      // of which `ps-14` takes 56, so the title runs to FOUR lines there (three
      // at 390, two at 844). RECORDED AS AN UN-TAKEN LEVER: if the owner ever
      // wants that block shorter, the pad is the thing to revisit (it buys
      // optical centring on the panel, not legibility) — never the size, which
      // is the owner's own instruction.
      // THE TITLE WEARS ui/Heading's `section` STEP (30px) through `asChild` —
      // the ONE h2 step every page shares since 2026-09-26 (owner: "all
      // headings and eyebrows app wide … the same size as they are on the
      // [doctor] page", CLAUDE.md §15.24). Until then it was a plain <h2> in
      // the Or-word's 27px dress (owner, 2026-09-05: the title as big as the
      // Or-word), which made 27px a second consumer and armed Heading's
      // third-step promotion — DISARMED now: the ornament below keeps its
      // 27px alone, the one-off its own note describes. h2 because the page
      // owns the one <h1> (§9:
      // logical heading order) — a dialog summoned from anywhere may not claim
      // the document's top level. `text-center` on the heading itself because
      // the slot is `flex-wrap`: a long German title wraps to two lines there,
      // and both must stay centred.
      header={
        <div className="flex flex-1 justify-center ps-14">
          <Heading size="section" asChild>
            <h2 id={titleId} className="text-center">
              {t('heading')}
            </h2>
          </Heading>
        </div>
      }
    >
      {/* THE RAIL — one column holding both channels and the word between
          them, centred on the panel and capped at its inner width (header
          note).
          IT CARRIES THREE OF THE FOUR MACRO SEAMS the owner enumerated on
          2026-09-05 ("it looks very crammed"), and they are margins and gaps on
          THIS element because the section owns spacing between its children
          (§6.4) — ui/Modal's own padding is never touched from out here:
            `mt-3`  the seam under the title bar (+0.75rem);
            `gap-7` the two seams flanking the Or-word (1.25 → 1.75rem), one
                    value for both because they are the same seam mirrored;
            `mb-4`  the seam below the second group (+1rem).
          The in-group stack is deliberately NOT in that list: the owner named
          the seams between blocks, so ChannelGroup keeps `gap-2` and the
          contrast between the two rhythms is what makes a group read as one
          thing (7:2 now, where it was 5:2).
          ALL FOUR COLLAPSE TOGETHER in the two tight states — a short viewport
          (Q1, 2026-09-04) and the 320px stress width — because neither has room
          for any of it: `mt-0 mb-0` in both, the rail gap `gap-0` on the short
          viewport and `gap-1` at the stress width (where the Or-word stays and
          the gap keeps it off the groups), with ChannelGroup going to `gap-0`
          beside it. That is option B (owner, 2026-09-05): when the title took
          the Or-word's 27px and grew a second line in the bar, those states
          went 16px and 2px over budget, and the owner chose to pay it out of
          the gaps rather than shrink the title back; the short viewport's rail
          gap went from `gap-1` to `gap-0` on 2026-09-26 (G2-R2 tier 2 — the
          30px title's cost bought back in part). The result is deliberately
          dense — nothing between the two controls' groups on a sideways phone,
          4px at 320, and none inside a group — because the alternative was a
          scrolling card, and the short-viewport state already drops the
          Or-word for the same reason. Their thresholds and the measurements
          behind them are in the header note.
          WHERE BOTH QUERIES HOLD (a zoomed 320×500 window: the divider hidden
          by the height query, the rail's gap claimed by both) the two
          single-query gaps disagree, and the width query's `gap-1` wins — so
          the combined regime has its OWN rule, the last class below: `gap-0`
          under `(max-width: 21.25rem) and (max-height: 33.5rem)` (G2-R2 tier
          2, 2026-09-26: German there 470 → 466px against a 468px budget).
          ITS OPERAND ORDER IS LOAD-BEARING. Tailwind emits arbitrary media
          variants in the order their query text sorts (read off the compiled
          sheet, 2026-09-26), and all of them share one specificity, so the
          later rule wins: written width-first, the combined rule sorts AFTER
          the width query's `gap-1` and wins; written height-first, it sorts
          between the height query's rules and the width query's and loses to
          that `gap-1` — an identical-looking class that silently does
          nothing. The 320×500 interaction case reads the computed gap, which
          is the only check that can tell the two spellings apart. */}
      <div className="mx-auto mt-3 mb-4 grid w-fit max-w-full min-w-[min(24.5rem,100%)] gap-7 [@media(max-height:33.5rem)]:mt-0 [@media(max-height:33.5rem)]:mb-0 [@media(max-height:33.5rem)]:gap-0 [@media(max-width:21.25rem)]:mt-0 [@media(max-width:21.25rem)]:mb-0 [@media(max-width:21.25rem)]:gap-1 [@media(max-width:21.25rem)_and_(max-height:33.5rem)]:gap-0">
        <ChannelGroup
          heading={t('callHeading')}
          caption={t('callHours', {
            weekOpens: weekdayHours.opens,
            weekCloses: weekdayHours.closes,
          })}
        >
          {/* THE CONVERSION CONTROL. An <a href="tel:"> wearing Button's
              clothes: it NAVIGATES (the phone app opens), so it is an anchor,
              not a button (§9) — and a protocol handler is not external
              navigation, so it carries NO target/rel (the Footer's contact-disc
              law, PR #68: _blank here would orphan a blank tab). The glyph is
              left and UNLABELLED — decorative, so the link's accessible name is
              exactly the visible number and SC 2.5.3 (Label in Name) holds by
              construction. E.164 in the href, the human format on screen: two
              fields of lib/clinic/clinic.ts on purpose (§10.1). `size="lg"` is a
              3.5rem target, well past §9's 44px aim for the primary action, and
              `w-full` takes the rail's width so both controls match. A label
              that wraps stays centred by the ATOM (ui/Button's `text-center`,
              since 2026-09-30 — the WhatsApp control's note below has the
              history); this number never wraps at any width the site serves. */}
          <Button asChild variant="solid" size="lg" className="w-full">
            <a href={`tel:${clinic.phone}`}>
              <Phone />
              {clinic.phoneDisplay}
            </a>
          </Button>
        </ChannelGroup>

        {/* THE WORD BETWEEN THEM (owner, 2026-09-05). „sau" / „oder" is the
            whole divider — no rule, no line, just the conjunction the two
            groups' titles used to carry ("Sau scrieți-ne" became "Scrieți-ne"
            when this arrived, in all five files; the caps became bare
            lowercase on the owner's word the same day).
            A PLAIN <p> WEARING THE DISPLAY TOKENS, not ui/Heading — and this is
            a deliberate, recorded choice, made when the owner asked on
            2026-09-05 for the word ~10% smaller (30px → 27px). ui/Heading's
            axis is `title` (20px) and `section` (30px), and its own header
            states the growth law: one step per MEASURED CONSUMER, never a size
            invented for a call site. 27px has exactly one consumer — this
            ornament — so neither road through the atom is clean: adding a step
            would inflate a shared axis for a one-off, and passing
            `className="text-[1.6875rem]"` to <Heading> would be a caller
            RESTYLING AN ATOM'S INTERNALS, which §6.8 forbids outright (it
            allows callers positioning and spacing, nothing else). Rendering the
            look here instead keeps the atom honest and puts the one-off exactly
            where one-offs belong — the same policy the glyph README applies to
            its hand-rolled class joins.
            The tokens are the semantic ones ui/Heading itself uses
            (`font-display`, `text-ink-strong`), so nothing about the theme is
            re-invented here; only the SIZE is local, and it is written in rem
            (§7) at the same 1.2 ratio the atom's steps use — 1.6875rem over a
            2rem line box.
            IF A SECOND CONSUMER EVER WANTS 27px, that is the measured consumer
            Heading's law asks for, and this <p> becomes the atom's third step
            in that lane — not before. (Met on 2026-09-05, when the panel's own
            title wore the same 27px on the owner's word, and UNDONE on
            2026-09-26: the title now wears ui/Heading's `section` step (30px)
            per CLAUDE.md §15.24, so 27px is back to one consumer — this
            ornament — and the Heading-step lane is disarmed again; G2-R2
            tier 2, typescript F6.)
            It contributes NOTHING to the document outline, which is the other
            half of why it is a <p>: the panel's structure stays h2 → h3 · h3,
            what a screen-reader user navigates by, while linear reading still
            speaks the conjunction in its place — exactly its job.
            It is WRITTEN IN THE MESSAGE FILES EXACTLY AS DISPLAYED („sau",
            lowercase), never re-cased in CSS: a voice-control user says what
            they see, and CSS-only casing makes the DOM text and the visible
            text disagree (the same rule fb-133 fixed on the language bulb).
            `text-center` because globals gives every <p> `text-align: start` —
            the caption trap, one element further out.
            HIDDEN IN THE SHORT-VIEWPORT STATE (owner decision, 2026-09-05): on
            a phone held sideways the flourish yields to the never-scroll rule.
            Nothing is lost — two stacked green controls under one title that
            already names both channels read as alternatives without a word
            between them, and the word costs 32px there (its own line; the
            rail gap it would add is 0 since 2026-09-26) where that state has
            4px to spare (both measured 2026-09-26 at 30px). */}
        <p className="text-center font-display text-[1.6875rem]/[2rem] text-ink-strong [@media(max-height:33.5rem)]:hidden">
          {t('or')}
        </p>

        <ChannelGroup
          heading={t('whatsappHeading')}
          caption={t('whatsappNote')}
        >
          {/* THE SECOND CHANNEL — the clinic's own WhatsApp conversation, the
              same wa.me target the Footer's disc opens, built from the
              digits-only `whatsapp` field (never the E.164 spelling with its
              plus). wa.me IS external navigation, so unlike tel: it travels
              with target=_blank + rel="noopener noreferrer" (PR #68's law, the
              other half of it). Same solid/lg clothes as the call: the owner's
              v4 picture is two equal green blocks, not a primary and a
              runner-up. The glyph stays UNLABELLED so the link's accessible
              name is exactly the visible label (SC 2.5.3).
              A LABEL THAT WRAPS STAYS CENTRED (owner, 2026-09-05: "on
              Kontaktieren Sie uns über WhatsApp i want the text centered when
              it goes on 2 lines"). `justify-center` on the atom's flex line
              centres the ROW — the glyph-plus-label group — and says nothing
              about the LINES inside a label that wraps: German's runs to two
              at phone widths, and the second one was ragging left under the
              first. This section carried the fix as a `text-center` of its own
              until 2026-09-30, when the doctor card's label wrapped too and
              the class moved INTO ui/Button's base row — the atom's now, for
              every button. */}
          <Button asChild variant="solid" size="lg" className="w-full">
            <a
              href={`https://wa.me/${clinic.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Whatsapp />
              {t('whatsapp')}
            </a>
          </Button>
        </ChannelGroup>
      </div>
    </Modal>
  );
}
