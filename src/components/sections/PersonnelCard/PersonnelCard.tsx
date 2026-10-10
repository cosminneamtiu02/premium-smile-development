import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Card, type CardTone } from '@/components/ui/Card/Card';
import { Eyebrow, type EyebrowSize } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading, type HeadingSize } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PersonnelCard — one member of the clinic's personnel as a card, in
// two kinds. An `auxiliary` card is a centred portrait over the full name over
// the position (a grid tile). A `doctor` card is the doctor from the waist up
// — a transparent cutout — over his name and specialty, beside his own words
// — quoted, justified, in a faint ink (D8, D58), with darker-lilac keyword
// fragments (D9, D56) — and ONE link to his own page under them, all inside
// the reviews deck's lavender frame (D17).
// Built to the owner-approved composition contract (run
// .claude/section-runs/2026-09-10_17-17_personnel-card, issue #95, no board by
// owner waiver: "do not show me a board … build it fully yourself"). The
// decision numbers below are that dossier's D1–D14 and are the anchors other
// files cite (§17.7 — never a line number).
// REWORKED 2026-09-21 by the doctor-pages run (its ledger's D4/D5): the doctor
// kind gains its two links and the wide step becomes a 2×2 grid — D15 below,
// which amends D6 and D7.
// REWORKED AGAIN 2026-09-30 on the owner's direct dispatch: the doctor kind
// keeps ONE link, wears the cutout and the reviews deck's frame, and is laid
// out for the floss ribbon — D17 below, which amends D1, D2, D3, D4, D6, D7,
// D11 and D15 — and, the same day, D18 lets a band ask for its picture EARLY.
// The auxiliary kind is byte-identical to before both. On 2026-10-01 D19
// records the doctors band's SCALE, which this card follows with no prop of
// its own — two spellings moved for it (THE INSET and the cutout's `sizes`).
// On 2026-10-02 (CLAUDE.md §15.32) a person's name took ONE step at either
// heading level, for both kinds — the auxiliary's level-3 cell moved from
// `title` to `band` (D4) — and the scale D19 follows became every band's
// (ui/Container's THE BAND SCALE), the staff tiles' band among them.
// On 2026-10-10 D20 gave the doctor kind a PHONE HEADER — under its INSET's
// `@sm` and over a 12.5rem floor, the specialty across the top, then a round
// photo on the left beside the name, on every card whatever its `side` —
// while every tablet, laptop and desktop keeps the
// card to the computed value, and a zoomed phone under the floor keeps its
// stacked layout;
// it amends D4–D7, D15, D17 and D18, and the auxiliary kind is byte-identical.
//
// ── NO OLD COUNTERPART, deliberately. The owner's brief opens with "do not
// inspire yourself from the old website, as this will be a new card", so the
// old repo's doctor-card / helping-staff-card and the 2026-09-06 TeamMemberCard
// dossier are SUPERSEDED rather than ported. What survives from that lineage is
// not markup but two decisions the repo already paid for: ui/Card exists
// because those dossiers kept re-spelling one surface (Card.tsx's header), and
// the initials disc that used to sit where this portrait sits was aria-hidden
// for exactly the reason D3 gives the photo an empty alt.
//
// ── D1 · TIER: SECTION, and a PROPS-IN SHARED COMPOSITION — the
// SectionHeading/Wordmark kind. It composes five atoms (ui/Card, ui/Image,
// ui/Heading, ui/Eyebrow, ui/Button), which is what /classify-component rule 3
// looks at, and §4's dependency direction then forbids ui/ from importing it
// back. It owns ZERO message keys and calls no t(): every string arrives
// finished and already translated (§8.1) — the link's LABEL and its href
// included (D17) — because only the consuming band knows whether its people
// live under `team` or under `home`, and only it knows the locale its hrefs
// must carry. Reuse schedules a composite early in the build order; it never
// promotes it (the SectionHeading paradox, §4).
//
// ── D2 · ONE COMPONENT, ONE DISCRIMINANT. `kind` rather than
// PersonnelCard/DoctorCard: the two kinds shared the WHOLE portrait block and
// differed by one slot plus one layout row, so two components would have
// spelled that block twice — the drift sections/SectionHeading and ui/Card
// both exist to stop. Since D17 the kinds share less — the name and its
// position, spelled ONCE below, the article and its naming, D3's empty alt,
// but not the card's tone (the TONE table) — and the reason stands: one set of
// rules for a person's name. `about`, `side`, `profile` and `preload` (D18)
// are typed `never` on the auxiliary branch, so a quote — or a link to a page
// of her own — handed to a nurse fails at `tsc --noEmit`, not in review. And
// `kind` is REQUIRED, with no default: the band always knows
// which card it is rendering, while a default discriminant would weaken the
// union at every call site (a bare <PersonnelCard> would type-check into the
// auxiliary branch and silently drop a doctor's words).
//
// ── D3 · THE PORTRAIT, AND ITS EMPTY alt. `photo` carries the path — typed
// `ImagePath`, lib/image-path's `/images/${string}`, so a file outside the one
// folder the export optimizer scans cannot compile (G2 typescript) — plus the
// INTRINSIC pixel size, which is the optimizer's srcset input and the reserved
// box — zero layout shift (§11). An auxiliary's portrait hangs in a
// fixed-ratio cell (`aspect-3/4 w-48 max-w-full`) where ui/Image's `framed`
// recipe (h-full w-full object-cover, Image D2) fills and crops it: 3:4 is the
// headshot ratio and ONE ratio for the whole team (§11's uniform aspect
// ratios), 12rem/192px wide so 238px of content still survives inside Card's
// 25px of border-plus-padding at the 320 stress width — 223 behind a
// desktop's classic scrollbar, and 206 before ui/Container's PHONE GUTTER of
// 2026-10-09 (`max-w-full` is the belt). The radius is the atom's own 12px
// (Image D3) — a circular portrait would be an Image variant question, never
// a className here (§6.8 bans restyling an atom's internals). A DOCTOR's
// picture is D17's cutout instead.
// `alt=""` IS THE DECISION, for both kinds, not a missing string: the heading
// beside the picture (an <h3> by default, an <h2> under `headingLevel={2}` —
// D4) carries the person's name, so a portrait alt would be announced twice in
// a row ("Dr. Elena Marin, image · Dr. Elena Marin, heading level 3") — WAI's
// decorative-images tutorial calls this the image with an adjacent text
// alternative, and the superseded TeamMemberCard dossier had already reached it
// from the other side (its initials disc was aria-hidden for the same reason).
// The zero-cost alternative — `alt={name}`, reusing the prop that already
// exists — was weighed and declined (G2 a11y): it buys only that double
// announcement plus a portrait list that repeats the heading list; if the alt
// is ever made non-empty it is the BARE name, never "Portret:" (the reader
// announces the type itself). RE-OPEN TRIGGER: a portrait that carries
// information the name does not — a doctor photographed AT WORK — at which
// point `photo.alt` joins the shape additively, breaking nobody.
// The literal `alt=""` sits at the JSX call site rather than inside a spread on
// purpose: eslint-config-next maps <Image> to img for jsx-a11y/alt-text and a
// spread does not satisfy that rule (the ui/Image test fixtures' note) — the
// right enforcement for this atom, so it is honoured rather than disabled.
// `sizes` tells the browser the box — `12rem` for the auxiliary's cell, and
// since 2026-10-02 `14vw` from a 70rem window on a mouse or trackpad, where
// the staff band draws the tile in the band scale (PORTRAIT_SIZES, D19's last
// paragraph); for the doctor's, `18rem`, and `21vw` from a 70rem
// window on a mouse or trackpad, where the doctors band draws the card at its
// own scale (D17's THE PICTURE'S `sizes`, D19) — so it picks a small variant
// on a 2× screen instead of the 1080px one (Image's own G2 a11y A5 note).
//
// ── D4 · THE NAME. `Heading` on a REAL heading through asChild, for BOTH
// kinds — and ONE STEP per kind, at either level: an auxiliary's name wears
// `band`, and a doctor's wore it too until 2026-10-10, when D20 moved it to
// ui/Heading's `name` step — `band` to the computed value from the INSET's
// 24rem `@sm` up, 24px on a 30px line under it, where the name shares its row
// with the round photo — at `headingLevel` 2 and at the default 3 alike. THE
// LEVEL IS THE OUTLINE'S, NEVER THE LOOK'S (2026-10-02, CLAUDE.md §15.32): the
// element follows `headingLevel`, the size does not.
// `band` is ui/Heading's first container-responsive row (run D48, its header):
// 30px on a column narrower than the container's 28rem `@md` step, 36px from
// it — and the container it reads is THIS CARD (its own `@container`,
// ui/Card) or, for a doctor, the INSET inside it (D17), never the screen. So
// a doctor card's INSET is wider than 28rem from a ~672px window up (36px),
// between 24rem and 28rem from a ~567px one — a 7″ tablet's 600 among them
// (30px) — and under 24rem on every upright phone (24px, D20; windows inside
// the ribbon, measured 2026-10-10), while an auxiliary tile in TeamRoster's
// grid can be narrower than 28rem on a laptop too (30px there).
// THE HISTORY, short. From 2026-09-26 an auxiliary's name wore THE STEP OF
// ITS LEVEL (§15.24: one size per outline level app-wide, the doctor page's)
// — `band` at 2, the Team page's tiles straight under its h1, and `title`
// (20px), this repo's card-title step, at the default 3 — while a doctor's
// wore `band` at both from D17 on, the look the owner approved on the
// stand-in. (Level 2 wore `section` for one morning and `page` for an hour —
// run D45 — before run D48 made it `band`, a fixed 36px having outranked the
// h1's 32px floor on phones; before 2026-09-26 the name wore `title` at both
// levels.) On 2026-10-02 sections/TeamRoster — the auxiliary tile's one page —
// opened with an eyebrow and an <h2> of its own (the owner: "create an eyebrow
// and headline for the 3 cars with helping staff"), so its tiles became
// <h3>s, and the per-level rule would have dropped their names to 20px; the
// owner wants them at the sizes of his screenshot, 30px ("i have attatched
// the sizes i want for responsiveness to be mentained in desired screens").
// So the auxiliary's level-3 cell moved to `band`: the tiles' names keep, at
// level 3, the very classes they wore at level 2 — on a phone or a tablet
// the size they had, on a laptop or a desktop that size in the band's design
// pixel (D19's last paragraph) — and the only frames this cell moves are the
// default-level auxiliary stories in PersonnelCard.stories.tsx. §15.24's
// per-level sentence is superseded for a person's name.
// The NAME_STEP table (kind × level) stays a TABLE although each kind's two
// cells hold one answer: any cell can move again on the owner's word — D20
// moved the doctor's pair — and a third kind or level cannot compile until it
// names its step. The atom
// answers "how big is this title" and never "which element is it", which is
// why the outline slot stays this section's decision.
// `hyphens-none` on the heading: the site-wide `hyphens: auto` (§15.14) is for
// PROSE, and a person's name must never break at a syllable — it still wraps
// between words when the box demands it. The `id` lands on the heading and the
// <article> points at it: the region is named by the heading's text ALONE, the
// rule SectionHeading records for the same pairing. It comes from React's
// useId(), which is server-safe and hydration-stable, so several cards on one
// page can never collide. The LEVEL DEFAULTS to 3 — right under the h2 every
// content band opens with (h1 page → h2 band → h3 cards) — and since
// 2026-09-21 `headingLevel` (2 | 3) is an ADDITIVE axis with that default
// pinned (§6.6): the trigger this paragraph used to record ("the first page
// that nests cards under a sub-heading") fired in its INVERTED form on the
// doctor-pages run — sections/TeamRoster was the first page that put the
// cards DIRECTLY under the page's <h1> (run D10 struck the sub-headings), where
// a level-3 title skips a level (§9's "logical heading order"; axe's
// heading-order rule fired on every roster story before the prop existed), so
// that band passed 2 — until 2026-10-02, when its own <h2> put its tiles back
// at the default. No band passes 2 since; the axis stays, additive and with
// its default pinned, for the next page that puts cards straight under an h1.
// A Record<PersonnelHeadingLevel, 'h2' | 'h3'> growth gate picks the element —
// SectionHeading's ELEMENT precedent — so a widened union cannot compile until
// it names its tag; a level BELOW 3 is not offered (a card under an h3
// sub-heading would be the day to add 4, additively).
//
// ── D5 · THE POSITION. ui/Eyebrow — the only consumer of the §3 mono token —
// so the uppercase is CSS and the string stays sentence case (Ș/Ț case mapping
// is the browser's job, §8.2/§8.8). An auxiliary's wears the atom's one
// default step; a doctor's, since D20, its `card` step (EYEBROW_STEP) — the
// default's 14px from the INSET's `@sm` up, 13.2px under it, where in the
// phone header it spans the card over the photo's row and starts at the
// card's left edge (on the element, for the reason that follows).
// `text-center` rides the atom's className
// because globals.css aligns every <p> to `start` in the base layer, and a
// declaration matching the element itself beats a value inherited from an
// ancestor: centring prose is a PER-ELEMENT act (§15.15 b, the text-align
// board's canon). This is exactly the move SectionHeading.tsx's KNOWN LIMIT
// paragraph reserved for the first wrapping centred eyebrow — a position like
// "Medic specialist ortodonție" wraps at 320px, so the evidence exists here.
// `hyphens-none` for D4's reason: a specialisation is a title, not prose.
// KNOWN CEILING (G2 a11y): with hyphenation off, ONE word of the position
// longer than the content box (21 mono characters at 320's 206px — since
// ui/Container's PHONE GUTTER of 2026-10-09 the 320 tile's box is 238px on a
// phone and 223 behind a desktop's classic scrollbar, where 24 and 22 fit;
// 16 in a 162px grid track) protrudes into the padding instead of breaking.
// No fixture reaches it and no page-level scroll follows; the page lane keeps
// it that way by giving the tiles a floor — `minmax(16rem, 1fr)` tracks until
// 2026-10-02, since then sections/TeamRoster's FIXED 18rem tiles (its D9),
// the full 18rem at a phone's 320 since THE PHONE GUTTER (16rem before it;
// 273px behind a classic scrollbar) — rather than by letter-level emergency
// breaks inside a person's title. Since 2026-09-21 the
// ceiling is ENFORCED on the data rather than merely recorded here:
// tests/unit/team-data.test.ts measures the longest unbreakable run of every
// `position` in every locale against those 21 characters (and of every `name`
// against the h1's own 16), which is what caught a German draft. Since the
// ribbon's mount (2026-09-30) a DOCTOR's position was held to 17 instead: the
// lanes left its line 174.5px at the 320px window, where 17 mono characters
// fit and 18 did not (measured — CLAUDE.md §15.25; since THE PHONE GUTTER that
// line is 204.2px there, behind the classic scrollbar, and 218.1 on a phone,
// where 20 and 22 fitted at 14px). Since D20 the specialty spans the INSET's
// whole line on a phone at 13.2px, and the ceiling is taken WITH SC 1.4.12's
// letter-spacing override on (the G2 fold of 2026-10-10): its 0.12em replaces
// the 0.1em tracking, so a character advances 0.6em + 0.12em = 0.72em,
// 9.504px, and the narrowest line a 100 %-zoom phone frame gives it — the
// runner's 320 frame behind a classic scrollbar, 204.2px — holds
// floor(204.2 / 9.504) = 21 of them: the ceiling is 21 (a real 320 phone's
// 218.1px holds 22). tests/unit/team-data.test.ts holds it; today's longest
// is 16. An auxiliary's stays 21.
//
// ── D6 · THE BLOCK (amended by D15, and for the doctor by D17). An
// auxiliary's is `flex flex-col items-center gap-3 text-center` — photo, then
// the name/position PAIR, at the card's own 12px column rhythm, so the block
// reads as the card's native stack rather than as a nested widget. Centred for
// both kinds (owner: "title and eyebrow centered below the image").
// The pair sits in a wrapper of its own — a second `flex flex-col items-center
// gap-3` — and that wrapper is D15's doing, not a nesting habit: at the wide
// step the name and the position travel together into ONE grid cell while the
// portrait takes another, and a box is the only thing a grid can place. Below
// the step the wrapper changes nothing a visitor can see: three items at 12px
// in one column read identically to a pair at 12px nested in a column at 12px.
// The doctor's block and pair are `flex-col-reverse` below the step (D17's
// stacked order), and at the step his pair HUGS its words (D17's HUG RULE).
// On a phone — an INSET between D20's FLOOR, 12.5rem, and the `@sm`, 24rem —
// his block is THE PHONE HEADER's grid and his pair dissolves into it
// (`contents`, D20) — ONE string for every card, whatever its side (D20's
// ONE SIDE ON A PHONE): `side` reaches GRID and COLUMN alone.
//
// ── D7 · THE DOCTOR LAYOUT, MEASURED AGAINST ITS OWN BOX (amended by D15
// from the flex row to the 2×2 grid, and by D17 to the 40 / 60 grid inside the
// INSET). The doctor card's single child is the INSET, a container of its own,
// and the INSET's single child is the layout <div> (GRID): one column by
// default and the grid from `@3xl`. Container variants query the NEAREST
// container ancestor, so `@3xl` measures 48rem/768px of the INSET's content
// width — never the band and never the window (§6.5). Outside a ribbon that is
// the card's content box; with ui/Container's gutter the card is 351px at the
// 390 phone (312 before its PHONE GUTTER, 2026-10-09) and 614px at the 768
// tablet (both one column — the phone under D20's header), 1024px at 1280 and
// 1228px at 1536 (both beside): the owner's fb-393 rule from ClinicLocation —
// desktop beside, tablet and phone below — and the first brief, "where stuff
// doesn't fit … place first left side and then text below still in justify".
// Both tracks are `minmax(0, …)`, whose 0 floor is what stops one unbreakable
// token from pushing the row open. `min-w-0` stays ON the quote for the other
// half of that job: a grid item's automatic minimum size is still its
// min-content size, so without it the item would overflow the track it was
// given.
// **DOM ORDER IS FIXED — block, quote, link — for BOTH sides.** Reading
// order stays "who, then what they say, then what you can do" for a screen
// reader and for the stacked layouts; `side="end"` only swaps which COLUMN
// each half is placed in at the step (the COLUMN table), a VISUAL-ONLY
// mirror — under the step it does nothing (D20's ONE SIDE ON A PHONE). The
// measure at desktop is the page's lever (a max-w-* on the band's grid), never
// this card's.
//
// ── D8 · THE QUOTE. A bare <blockquote>, because the text is the doctor's OWN
// words: the marks say so to sighted readers and the element says so to
// assistive tech (ARIA role `blockquote`), which is also why the owner authors
// it in the first person. Its dress, utility by utility:
//   text-lg          18px = the §15.1 body base. A quote reads at body size,
//                    not at ui/Text's 16px step.
//   text-ink-faint   the owner's "relatively washed or ghost", now with an ink
//                    of its own. As first built no washed/ghost TOKEN existed —
//                    "ghost" names a button variant — so the quote wore muted,
//                    the repo's quiet ink at 7.35:1 on the surface. D58 (owner
//                    2026-09-26, after D57's deep violet keywords: "what if
//                    you make the faint text lighter") added the 19th semantic
//                    role, --ink-faint #766f69: 4.94:1 on the surface, still
//                    AA for body text (§9), and 1.89:1 against the keyword's
//                    --accent-strong of the day where muted gave 1.27:1 —
//                    the wash read lighter and the keywords stood further off
//                    it (since 2026-10-02 the key words wear THIS card's
//                    button lavender, --accent, at the faint quote's own
//                    lightness, 1.02:1 — hue and weight carry them; ui/Keyword's
//                    THE NUMBERS). Its
//                    charter and numbers sit on the token in globals.css; its
//                    consumers are this quote and DoctorIntro's CredoCard
//                    alone, and it is NOT for the lilac tint (3.24:1 there).
//   text-justify     OWNER DECISION, mid-brief and marked "extremely
//                    important": a per-element override of §15.1's
//                    start-aligned prose lock, recorded as a §15.1 rider at
//                    seal. WCAG's justified-text clause is SC 1.4.8, AAA —
//                    outside this site's AA acceptance bar — and the body's
//                    `hyphens: auto` is what keeps rivers out of the lines
//                    WHERE THE ENGINE HAS A DICTIONARY for the language.
//                    Measured 2026-09-30: Chromium and WebKit on macOS both
//                    hyphenate Romanian. Chromium's own pattern set — what
//                    Android, Windows and Linux use — is believed to carry
//                    none for Romanian (G2 a11y; not verifiable on this
//                    workstation), which would leave a phone's narrow
//                    justified lines with wide word gaps. The owner's to look
//                    at on an Android phone; the lever is one prefix,
//                    `@md:text-justify` — start-aligned on a narrow card.
//   before/after     content-[open-quote] / content-[close-quote]: CSS
//                    generated content whose glyphs come from the `quotes`
//                    property, whose initial value has been `auto` in every
//                    engine since 2021 (Chrome 90 · Firefox 70 · Safari 14.1).
//                    So the marks are the LANGUAGE's own, taken from the
//                    inherited lang — „…” for ro, „…“ for de, « … » for fr,
//                    «…» for it, “…” for en — with zero per-locale code and not
//                    one mark inside any string (owner: "quotes are not to be
//                    added in parametrisation, but it is in code").
// No <p> inside: one paragraph, one element.
//
// ── D9 · KEYWORDS ARE <b>, AND THAT <b> NOW LIVES IN ui/Keyword. The fragments
// inside a doctor's quote are HTML's key-word element; this card shipped that
// primitive privately and recorded the §4 promotion trigger ("the second
// section that wants keyword fragments moves this to ui/Keyword"). The
// doctor-pages run is that second consumer, so the component, its reasoning
// and its two recorded a11y limits moved WHOLE into
// src/components/ui/Keyword/Keyword.tsx — read them there.
// D9 as first built was INK, NOT WEIGHT: the running text's weight in the
// darkest ink. Three amendments followed at the atom and one at the token, all
// on 2026-09-26: D52 (owner: "bold and darker … a more serious contrast between
// non key words and key words") made it weight AND ink, `font-bold
// text-ink-strong`; D55 (the same evening: "bold is now too bold … try italic
// instead of bold") traded the weight for a synthesized slant, `font-normal
// italic text-ink-strong`; D56 (owner: "italic looks stupid … use a darker
// lilla and just a little bold and drop italic. before it was too bold")
// dropped the slant and moved the cue to HUE plus a LITTLE weight — the recipe
// became `font-semibold text-accent-strong`, the new semantic `--accent-strong`
// at 600; and D57 (owner: "i need a darker accent of lilla. a more seeable one
// … make it just jump at you more, as keyword, important information") moved
// the token's VALUE from #655885 to #4b3a86 — darker and more saturated, so the
// keyword now reads darker than the muted quote around it (#655885 had sat
// lighter than `--ink-muted`). D59 (owner: "looks better. add just a little
// more bold and underline them maybe") took the weight to 650 — between D56's
// 600 and the 700 that D55 called too bold — and added a thin underline in the
// keyword's own violet, the owner's "maybe": the recipe became `font-[650]
// underline decoration-1 underline-offset-2 text-accent-strong`; and D60
// (owner: "remove the underline") dropped that underline after one look, the
// 650 and the violet kept — `font-[650] text-accent-strong`. Ink-only → bold →
// italic → lilac → a deeper lilac → a touch heavier and underlined → the
// underline gone, one day. Because the recipe lives in that one file and the
// value in the token, this card's quote and the doctor page's credo card both
// show it with no edit here. D58 then moved the OTHER side of that contrast —
// the quote's own ink, lightened to --ink-faint (D8). And on 2026-10-02 the
// violet itself gave way to THIS CARD'S BUTTON's lavender (owner: "i want
// that highlighted text to actually be the color of the current mai multe
// despre mine button") — the recipe is now `font-[650] text-accent`, the key
// words at the faint quote's own lightness, set apart by hue and weight.
// Nothing about this card changed with any of these moves: `about` is still a ReactNode, so the
// band hands over either `t.rich('members.elena.about', { k: (chunks) =>
// <Keyword>{chunks}</Keyword> })` or a <Keywords segments={…} /> built from
// lib/team, and this file imports neither — a consumer's fragments are already
// rendered by the time they arrive here (§8.1).
//
// ── D10 · FIDELITY (§6.8). The caller's className goes on the <article>, where
// ui/slot.ts merges it LAST (atom classes → Card's className → the child's), so
// placement wins where placement is allowed and nothing restyles an atom's
// insides. `ref` and every other native prop spread onto the article too, and
// the SPREAD RIDES FIRST — before `aria-labelledby` and `className` — which is
// the belt behind the Omit that CredoCard and ScheduleCard already practise:
// the types refuse a caller's naming attribute, and attribute order then makes
// sure nothing that dodged them (a cast, a `{...props}` of unknown shape, or a
// plain hyphenated JSX attribute — which TypeScript exempts from its
// excess-property check, so `aria-label="…"` written in JSX compiles despite
// the Omit) can replace the name pair either. The
// card owns no outer margin and no width of its own (§6.4): a grid track or a
// max-w-* placement is the page's business, and ui/Card's D3 says the same from
// one tier down.
//
// ── D11 · ISLANDS (§16). No 'use client' in this file; useId is the only hook
// — called twice since D17, once for the heading and once for the link's
// self-reference (D15) — and it is server-safe, so there is no state and no
// handler, and the card compiles into the page's static HTML — ui/Button
// included, which is a plain props-in atom whose one link here is an ordinary
// anchor (§15.13: every internal link is a plain <a href>, no router, no
// prefetch). The ONE cost, stated rather than discovered: ui/Image wraps
// next-image-export-optimizer, which ships its own directive, so every
// portrait brings a small client island with it. Accepted — the photographs
// are the reason this card exists (§11). PersonnelCard.test.tsx pins the
// directive's absence and the whole import surface from the source text,
// because no runtime assertion can see either.
//
// ── D15 · THE TWO CALLS TO ACTION, AND THE 2×2 GRID THEY MADE NECESSARY
// (doctor-pages run, 2026-09-21; the run ledger's D4/D5) — SUPERSEDED IN PART
// by D17, each bullet marked. The owner, verbatim: "i want them 2 have 2
// buttons identical as aspect to the ones in the hero section for contact us
// and see services … in the card at the same level on the oy axis as [name +
// position] and centered below the description text … the left button is see
// services done by doctor and the right one takes you to the doctor page."
//   · THE FACES were the Hero's pair, prop for prop — `solid` on the services
//     link, `outline` on the profile link, both `lg` (min-h-14/56px, past §9's
//     44px target for a primary action). SUPERSEDED: D17 keeps ONE link, on
//     the solid `lg` face.
//   · THE ROW was the Hero's too — `flex flex-wrap gap-3 *:grow *:basis-64`,
//     capped at 48rem and centred. SUPERSEDED: one link needs no row; D17 caps
//     the link itself and centres it under the words.
//   · A LINK, NEVER A BUTTON — HOLDS: it goes to a page. `ui/Button asChild`
//     on a plain <a href> is how this repo dresses a link as a button
//     (§15.13, the Hero's services link).
//   · EACH LINK NAMES ITSELF AND THEN THE PERSON (G2 a11y, 2026-09-21) —
//     HOLDS. A roster of doctors repeats the same label once per card, so a
//     screen-reader user listing the page's links — NVDA's Elements List,
//     VoiceOver's rotor, both of which read names out of context — would hear
//     „Mai multe despre mine" five times with nothing to tell them apart. The
//     anchor therefore carries its own `useId()` and
//     `aria-labelledby={`${linkId} ${headingId}`}`: the first IDREF is the
//     anchor itself, whose name-from-content is the visible label, and the
//     second is the card's heading (D4), so the computed name is „Mai multe
//     despre mine Dr. Elena Marin". The VISIBLE text is the label alone and is
//     the LEADING substring of the accessible name, which is what SC 2.5.3
//     Label in Name asks of a spoken command. The alternative — `aria-label`
//     with the name interpolated — was declined for the §8.1 reason: the card
//     would have to build a sentence out of two strings, which is exactly the
//     fragment-concatenation §8.2 bans.
//   · DOM ORDER — HOLDS: block → quote → link, i.e. who → what they say →
//     what you can do, in both mirrors (D7).
//   · THE GRID — HOLDS in shape, AMENDED by D17: two rows × two columns, the
//     picture over the name in one column, the words over the link in the
//     other, both row-2 cells `self-center` so they share one vertical centre
//     ("at the same level on the oy axis") whichever is taller. The block
//     DISSOLVES into it — `@3xl:contents` — rather than being split into two
//     wrappers, because below the step its two children must stay ONE flex
//     column at 12px (D6) — on a phone, since D20, one grid — and
//     `display: contents` is the only value that
//     drops a box without dropping the element: CSS inheritance still flows
//     through it, so the block's alignment keeps reaching the name in every
//     layout. The wrapper is a semantically empty <div>, so the old `display:
//     contents` accessibility bug (an element with a ROLE losing it in the
//     a11y tree) has nothing to bite here — nor on the pair D20 dissolves on
//     a phone, another empty <div>.
//
// ── D17 · ONE LINK, THE CUTOUT, A CARD THE RIBBON CAN WRAP (the owner's
// direct dispatch, 2026-09-30, on a stand-in iterated live that day: "make this
// the official dr card under personell card"). His words, in order: "i want to
// refactor the doctor card … it has a section specially for buttons. that will
// disappear. i will keep only 1 button of the two" · "i am leaning hard
// towards option 3, but button will stuck in a separate section at bottom of
// card below text" · "i want dr name and specialization also sticky to bot of
// card next to the button" · "i want the button that was befroe vezi servicii"
// · "yes but i want it to be named more about me, be wider and take you to
// adjacent dr page" · and of the picture: "it will be a taller image, about as
// wide as [the name and the specialty] … it will contain no background. it
// will contain the doctor from the waist up". Against D15, what moved:
//   · ONE LINK, `profile` — REQUIRED on the doctor, `never` on the auxiliary;
//     `actions` and its type are gone (§6.6: a breaking change, every usage
//     moves with it). It goes to the doctor's own page, labelled in his own
//     voice („Mai multe despre mine", handed over finished, §8.1), on the old
//     services button's solid `lg` face — in ui/Button's LAVENDER family since
//     2026-10-01 (`tone="accent"`, the atom's THE TWO FAMILIES; the owner:
//     "all 'mai multe despre mine' buttons from the doctor cards" lilac, like
//     the menu buttons). The services link left the card: this
//     button is now the only way to a doctor's page (the §15.23 SC 2.4.5
//     record stands).
//   · THE PICTURE is the transparent CUTOUT the doctor page's opener shows —
//     one 3:4 ratio for the team (§11; the demo files 900 × 1200) — drawn
//     whole in ui/Image's `artwork` recipe (never cropped, no frame, no blur
//     placeholder) in an 18rem cell (`w-72`: about the width of the name and
//     the specialty under it; `max-w-full` on a narrow card), whose `sizes`
//     names that cell — and the cell the doctors band scales (THE PICTURE'S
//     `sizes` below, D19). Since D20 the recipe is spelled at the call site
//     (FIGURE, on `variant="plain"`) and a phone crops the figure into a
//     circle; from the INSET's `@sm` up it is this picture to the byte.
//   · THE GRID at the step is 40 / 60 (`2fr` / `3fr`): row 1 the picture ‖ the
//     words, row 2 the name + specialty ‖ the link, 32px across and 12px down,
//     columns mirrored by `side`. The picture stands on its row's FLOOR
//     (`self-end`), so the waist stays 12px above the name however tall the
//     words run; the words sit on the picture's centre line. The link is as
//     wide as the words up to 28rem (`max-w-md`), centred under them, and
//     spans the column on a phone.
//   · THE STACKED ORDER below the step: specialty → name → picture → words →
//     link. Paint only — the block and the pair are `flex-col-reverse`, the
//     DOM keeps D7's order and no control moves, so the focus order is
//     untouched (SC 2.4.3). It holds from the INSET's `@sm` up — every tablet
//     held upright — and under D20's FLOOR (a zoomed phone); on a phone at
//     100 % zoom D20's header replaces it: specialty → [photo | name] →
//     words → link, paint only again.
//   · THE NAME wore `band` at both levels (D4) — `name` since D20, `band`
//     from the INSET's `@sm` up.
// "D16" was the parked two-section rework of 2026-09-29 (Storybook 6007) that
// never merged; its 40 / 60 split and its phone order are carried here.
// THE INSET — the ribbon's lanes without touching ui/Card. Inside ui/Ribbon a
// card is inset by the two LANES — `max(1.5rem, lane)` on top and either side,
// 1.5rem below (§15.26, the seam) — but ui/Card fixes each tone's border and
// padding and refuses className as a padding API (its header). Every tone
// spends the same SIX SPACING STEPS + 1px per side on the two — `surface` 1px
// + `p-6`, `framed` 3px of border + (six steps − 2px) of padding: 1.5rem +
// 1px at the theme's 0.25rem step, 25px at the default font size (its SUM
// RULE) — so the doctor card's one child pads the DIFFERENCE,
// `max(0px, lane − 6 steps)`, inside that constant: outside a ribbon the
// lanes' registered initial value is 24px and the INSET adds nothing (an
// engine without `@property` reads the fallback, six steps — nothing again);
// inside one the words start `lane + 1px` from the card's edge, exactly where
// ui/Ribbon's stand-in card (1px + `max(1.5rem, lane)`) puts them, whichever
// tone this card wears.
// THE STEP, NOT `1.5rem` (2026-10-01, D19). The INSET subtracted the literal
// 1.5rem until the doctors band began to redraw the step, and ui/Card's
// `framed` PADDING moved into the step the same day; spelled
// `calc(var(--spacing)*6)`, the subtraction is the card's own spend less its
// 1px at any step — the same 24px at the default, 36px in a design drawn at
// 1.5px — so the words keep their `lane + 1px` inside the band's scale too,
// and EXACTLY: the frame stays a whole 3px border at every step (D19 says
// why), the padding, six steps − 2px, carries the step, and the spend is six
// steps + 1px to the engine's own layout precision (Chromium's 1/64px).
// PersonnelCard.test.tsx measures it to 0.05px at the theme's step and in
// designs drawn at the band's own step (0.81px), at the owner's own 1401px
// window (0.99983px) and at 1, 1.5 and 2px. One edge, stated rather than
// found: the lanes' initial 24px is more than six steps wherever the step is
// under 4px (a smaller root font, a band drawn below its reference), and
// there the INSET pads the excess — outside a ribbon the words never start
// closer than 25px, and the band always carries its ribbon, whose lanes are
// drawn in its own units.
// It is its OWN `@container` because the lanes make it narrower than the card:
// the grid's `@3xl` and the name's `band` must measure the box the grid really
// has — two columns from a card of ~893px in a ribbon, from 818px (768 + 50)
// outside one.
// THE HUG RULE — a keep-out is what is painted (lib/ribbon-layout). At the
// step the name + specialty box is `justify-self-center`, so it HUGS its
// words: stretched across its column it marked empty space as a keep-out, and
// the ribbon's side wave turned a corner against that empty edge — the
// "rectangle" beside each name the owner saw. The four markers — the LITERAL
// `data-ribbon-keepout` on the pair, the words and the link,
// `data-ribbon-keepout="portrait"` on the picture's cell — are the whole seam
// (ui/Ribbon's THE SEAM TO A CARD); the auxiliary kind carries none.
// THE HUG'S LIMIT (G2 react, measured on the built Team page): CSS
// shrink-to-fit cannot hug text that WRAPS, so a name or a specialty that
// runs to two lines makes the pair's box its whole 40 % track again — at a
// 1280 window „Dr. Alexandra Constantinescu" gives a 336px box around 265px
// of words, and today's „Medic dentist, chirurgie orală" is 294.0px in a
// 294.6px track at the 1136px window. The ribbon still painted in both
// probes. If real names or specialties make it matter, the lever is
// lib/ribbon-layout measuring the words' own rectangles, never this card.
// THE PICTURE'S `sizes`, since 2026-10-01 (D19; CUTOUT_SIZES):
// `(min-width: 70rem) and (pointer: fine) 21vw, 18rem`. Where the doctors
// band scales — on a mouse or trackpad, in an engine that registers custom
// properties, from a column of max(56rem, 896px): the three gates of
// ui/Container's THE BAND SCALE (`bandScaleClasses` since 2026-10-02, §15.32;
// argued in sections/DoctorShowcase's D10, THE SCALE) — it draws this card at
// column / 1106 of its reference, the column counted up to its 96rem cap, so
// the 18rem cell is 288 × column / 1106 px; with ui/Container's 10vw gutters
// a 56rem column is a 70rem window (overlay scrollbars) and the cell ≈ 0.208
// × the window — 20.8vw: 396px at a 1920 window (the planner's measurement,
// classic scrollbar), where `21vw` asks for 403. Everywhere else the cell is
// 18rem.
// THE POINTER CONDITION is the band's own gate (globals.css's THE SCALABLE
// VARIANT), on the owner's answer of 2026-10-01 — asked how tablets should be
// treated: "Touch devices unchanged" — so a touch screen asks for the 18rem
// it draws at ANY width: without the condition a 1180px landscape iPad, wider
// than 70rem, would be told 21vw — 247.8px for its 288px cell, 14 % under.
// The band and `sizes` read the SAME media feature, so on every device they
// agree, whatever its pointer reports.
// THE BOUNDS, derived — each a file a little smaller or larger than the cell
// could use, never a wrong box (`sizes` chooses the file; CSS sizes the box):
// (1) a classic 15px scrollbar moves the band's step to a ≈ 1139px window, so
// between 1120 and 1139 a mouse is told 21vw of a cell still 288px wide,
// about 18 % under; (2) from the band's CAP on — a 96rem column, 1536px at
// the default root: a 1920px window, ≈ 1939 under a classic scrollbar — the
// cell holds at 400px (288 × 1536 / 1106) while `21vw` grows on, 538px at a
// 2560 window (× 1.34); (3) `sizes` cannot ask the band's `@supports` gate,
// so in an engine that refuses it (Safari before 16.4, Firefox before 128,
// Chrome before 119) the cell stays 18rem while a mouse from a 70rem window
// is told 21vw — under the cell up to a ≈ 1371px window (288 / 0.21), over
// it beyond (× 1.87 at 2560); (4) a media query's rem is the browser's
// default font size — the root's here too, globals.css sets none — so
// `70rem` follows a LARGER user font exactly as the band's 56rem step does
// (70 = 56 / 0.8), but under a SMALLER one the band's step holds at its 896px
// floor while `70rem` comes earlier — at a 14px font from a 980px window,
// where the band waits for 1120 — and in between a mouse is told 21vw of an
// 18rem cell, up to 18 % under at that font. KEEP IN SYNC with the band
// scale's REFERENCE (1106px), STEP (max(56rem, 896px)) and CAP (96rem) —
// spelled since 2026-10-02 in ui/Container's `bandScaleClasses` and
// `bandColumnClasses` (THE BAND SCALE, §15.32) — and with its pointer gate,
// globals.css's THE SCALABLE VARIANT: every number here is derived from them,
// and tests/unit/design-scale.test.ts reads CUTOUT_SIZES' exact string beside
// them.
// THE SPACE BEFORE `21vw` IS LOAD-BEARING: next/image (get-img-props,
// getWidths) reads the smallest `vw` share it finds at the start or after a
// space — `(^|\s)(1?\d?\d)vw` — and keeps only the candidates of at least
// deviceSizes[0] × that share, 640 × 0.21 = 134.4px: the 16 … 128 widths go,
// which no box of this card can use (the least it ever asks for is 21vw of a
// 70rem window, 235px at the default font size), and every one the scaled
// cell needs stays (640 at 1×, 828 at 2× for the 1920 window's 403px). D18's
// preload link carries the same `sizes` — next/image hands one value to both.
// Wherever `sizes` answers 18rem — every touch screen, a mouse under a 70rem
// window — the G2 react note stands: `18rem` over-asks wherever the cell is
// narrower than 18rem. Until D20 that was a phone under 404px (ui/Container's
// PHONE GUTTER of 2026-10-09; 455 before it), where a 360px phone at 3×
// fetched the 1080w candidate for a 251.5px box the 828w would cover, and
// the 390 phone's 276.6px box needed the 1080w anyway. SINCE D20 every
// upright phone draws the cutout CROPPED, 165 % of its circle — 118.8 to
// 184.8px wide — and `sizes` still answers 18rem there, ON PURPOSE: the
// same file as before, so the page fetches nothing new; but a 390 phone at
// 3× now fetches the 1080w for a 554-device-pixel box the 640w would cover.
// THE LEVER, recorded and not built: a phone entry ahead of the fallback —
// the circle's own share of the window times 1.65 — after the filter's rule
// (it takes the SMALLEST `vw` share it reads, so a phone share smaller than
// `21vw` would shed candidates the scaled cell needs: spell it in rem or in
// `calc()`, never as a bare `vw`). The gain is unproven on the demo art:
// measure with a real cutout before moving it.
// THE FRAME — the owner, later the same day (2026-09-30), verbatim: "one more
// thing to mention. i want to use for this card the border of the non current
// review from the review carrousel. can you do that." That border is ui/Card's
// `framed` tone: the reviews deck hands it to every slide but the selected one
// (ReviewsDeck's `offset === 0 ? 'emphasized' : 'framed'`), and DoctorIntro's
// CredoCard already wears it (its D12) — the 3px `--card-tint` frame on the
// white surface. So the doctor card's root takes `framed` through the TONE
// table, and the auxiliary tile keeps `surface`, byte for byte. No `aura`:
// the owner asked for the border, and a glow is a per-kind decision of its
// own. NOTHING MOVES: `framed`'s two extra px of border come out of its
// padding (THE INSET above, ui/Card's SUM RULE), so the words start where they
// did, the INSET's arithmetic is untouched and every number D7 and THE INSET
// record still holds. The Doctor stories measure the 3px, and the 25px from
// the card's edge to its content on every side.
// THE CORNER — the owner, 2026-10-01, verbatim: "i want that rounded corner
// effect that the doctor card from old webpage has … the aspect and ratio or
// idk how to call it implemented in all mentioned parts", and "doctor cards
// mean also personell cards". The old doctor card (and the old staff card)
// were `rounded-2xl` — Tailwind's 2xl step, 1rem, on an untouched radius
// scale — so BOTH kinds pass ui/Card's `corners="soft"`, the atom's second
// corner situation over the ONE token `--radius-soft` the Header pill,
// NavMenu's panel, ui/TextButton and ui/Modal wear as well (§15.29). Every
// other card on the site keeps the 6px `house` corner (the services page's
// cards tried the soft one for an hour on his "apply to all cards on services
// page too" and went back on his "i liked card from before better for
// services. it looked perfect."); the reviews deck's idle card, whose FRAME
// this card borrowed, keeps its 6px — the owner named four parts, and this is
// one of them. The portrait's own 12px
// (ui/Image `framed`, its D3) is untouched: the old staff card paired its
// 16px card with a 12px picture frame, the same pair as here.
// THE LEVERS, one token each: the card's tone (TONE's doctor row, `framed` ↔
// `surface`) · the link's face (`solid` ↔ `outline`) and its colour family
// (`accent` ↔ `cta`) · its cap (`max-w-md`,
// 28rem — 24rem was "not wide enough", the whole text box "too wide") · the
// picture's width (`w-72`, with CUTOUT_SIZES — its `18rem`, and its `21vw`
// and its media condition whenever the band's reference, step or gates move)
// · the name's step on level 3 (NAME_STEP's doctor row) · the stacked order
// (the two `flex-col-reverse`) · the corner (`corners`, `soft` ↔ `house`,
// THE CORNER — both kinds at once) · and on a phone, D20's own levers.
//
// ── D18 · THE EAGER PATH — a band asks, the card never guesses (the
// doctor-showcase lane, 2026-09-30). A card does not know where it sits on a
// page, so its picture loads LAZILY — §11's rule for everything below the
// fold — unless the band that places it says otherwise. One band must: on the
// Team page, which sections/DoctorShowcase opens, the FIRST doctor's cutout IS
// the page's LCP element (§10.6) — MEASURED by the planner on the lane's built
// export with Chromium's largest-contentful-paint entries: 226 × 302 on a 390
// phone (since ui/Container's PHONE GUTTER of 2026-10-09: 276.6 × 368.8 on a
// 390 phone, 262.7 × 350.2 at a 390 window behind a classic scrollbar — the
// geometry the 226 × 302 was — still the LCP, re-measured), 288 × 384 at 1280
// and 1920, still the LCP at 1366 × 633 — and it shipped `loading="lazy"`,
// with no `fetchpriority` and no preload link. So
// the doctor kind takes `preload` (default false), and when it is true
// ui/Image receives the pair sections/DoctorIntro hands its own cutout (its IT
// IS THE DOCTOR PAGE'S LCP ELEMENT paragraph), `preload` and
// `fetchPriority="high"`: no `loading="lazy"`, a high fetch priority, and a
// `<link rel="preload" as="image">` in the head for the same srcset and
// `sizes` (read off the doctor page's built export). Which card asks is the
// band's call — DoctorShowcase D9: its first, and only when the page says the
// band is on its first screen. On Home the same card sits under the Hero and
// the clinic's numbers (the first cutout at y ≈ 1655 at 1280 × 800 since
// 2026-10-01, ≈ 1103 before), the hero's picture is the LCP, and every cutout
// stays lazy. False or absent, the <img> is attribute for attribute the one
// this card rendered before D18: PersonnelCard.test.tsx COMPARES it with a
// bare ui/Image instead of trusting `preload={false}` to be a no-op. Typed
// `never` on the auxiliary kind (D2): no page opens on a staff tile — the day
// one does, the key joins that branch additively.
// SINCE D20, ON A PHONE, THE CUTOUT IS NO LONGER THE LARGEST PAINT: the circle
// shows 112 × 112px of it at a 390 phone (12 544px²), and the first card's
// quote, ≈ 277 × 168px, outranks it — Chromium's largest-contentful-paint
// entries on the Team page's story twin at a 390 phone name the cutout
// first and then the <blockquote> (45 870px², 2026-10-10). The pair still
// rides the first card's picture, unchanged (one image at high priority, its
// preload link the same `sizes`); from the INSET's `@sm` up the cutout is the
// page's LCP as measured above. Whether a phone should keep the preload is a
// recorded lever, measured first on the built export.
//
// ── D19 · THE BAND'S SCALE (2026-10-01). The owner, verbatim: "i like how it
// looks on phone and tablet and i want to keep that unchanged. but on laptop
// and desktop if you make it bigger/smaller in width it gets highly
// disproportioned. i want card and component and all contents to adjust in
// size harmonically all at once and mentain raports as on following sizes:
// 1401x1063. i might even make it myself smaller for it to fit in a different
// container or smth but i think i'd want same rations to still remian." —
// and, asked the same day how tablets should be treated: "Touch devices
// unchanged". The card OWNS NO SCALE, and that is the decision: it is drawn
// in the theme's units — the spacing step and the text, container and radius
// steps — and sections/DoctorShowcase redraws those units for its own box
// where its three gates hold (its D10; since 2026-10-02 through ui/Container's
// THE BAND SCALE, this paragraph's last part): a mouse or trackpad device
// (`pointer: fine`), an engine that registers custom properties (both
// globals.css's THE SCALABLE VARIANT) and a column of max(56rem, 896px). One
// design pixel is then column / 1106 of a CSS pixel (1106px: the band's
// column at the owner's 1401px window — THE SCALE there), the column counted
// up to the band's 96rem cap; the mechanism is globals.css's THE DESIGN
// SCALE. So inside that regime EVERY length of the card follows the band at
// once — the cutout's `w-72` cell, the quote's `text-lg`, the name's `band`
// step, the link's `max-w-md` cap and `lg` height, the gaps, the soft corner,
// and the frame's padding, which ui/Card's `framed` row spells in the step
// (its SUM RULE) — while nothing in this file names the band. The scale
// follows the band's own container, so the owner's "smaller … different
// container" keeps the ratios wherever the band goes. Everywhere else the
// card is drawn at the theme's own units, exactly as before: outside a scaled
// band, under its step, in an engine that cannot register custom properties,
// and on a TOUCH screen at any width — every phone and every tablet, upright
// or sideways, the owner's answer above. Two things are not lengths of the
// design and stay the card's. Its BORDER: the frame is the reviews deck's 3px
// at every scale. A border spelled in px is not remapped, and it must not be,
// because an engine FLOORS a fractional border width to a whole pixel while it
// keeps a padding's fraction — drawn in the step, as this day's first round
// drew it, the frame lost a whole pixel at the owner's own window (2.9995px,
// drawn 2px wide by Chromium at 1× and 2× alike). So the padding, six steps −
// 2px, carries the step for it, and the card's spend stays six steps + 1px
// EXACTLY at every scale, its 1px a hairline still (THE INSET above). And the
// container-query STEPS — a query's rem is the root's, never the remapped
// theme's — so `@3xl` still asks 48rem of the INSET. The INSET scales with
// the band (the card, its padding and the ribbon's lanes are all the band's
// lengths), and the band's step keeps it over those 48rem inside the regime
// at ANY root font size: the step's px floor (G2, R6 — react measured a 0.61
// design at a 12px root before it) holds the narrowest design the band draws
// at 896 / 1106 ≈ 0.81 whatever the root. At a root of 16px or less the step
// is that 896px column and the INSET ≈ 774px, over 48rem (768px or less); at
// a larger root the 56rem term starts the regime and the INSET there is
// ≈ 48.4rem, over 48rem again. Derived from the 1401 measurements: thin
// (≈ 7px at the default root), and the band's to keep — so wherever the band
// scales the doctor card it stays two-column, which is what "maintain the
// ratios" means for a layout. What this file changed for the regime is two
// spellings and no prop: THE INSET's subtraction, in the step (D17), and the
// cutout's `sizes`, which must name the scaled cell where the band scales it
// and the 18rem cell everywhere else, its pointer condition the band's own
// (D17's THE PICTURE'S `sizes`, CUTOUT_SIZES).
// SINCE 2026-10-02 THE SCALE IS EVERY BAND'S (§15.32). The owner, that day:
// "i want both section to in parallel on widening of screen to be responsive
// and adapt in parallel, so headings and eyebrows grow together". The regime
// left the doctors band for ui/Container's THE BAND SCALE — `bandScaleClasses`
// and `bandColumnClasses`, worn on the rhythm box of every band below the Home
// hero and of every band of the Team page — so the STAFF band,
// sections/TeamRoster, draws in the doctors band's design pixel, and an
// AUXILIARY tile there follows it exactly as a doctor card does: no prop, no
// edit here, every theme length of the tile at once — the portrait's `w-48`
// cell, the name's `band` step (30 design pixels on a tile, the owner's — D4),
// the gaps, the padding, the soft corner. The card still names no band and
// owns no scale. ONE HINT HAD TO FOLLOW, and does (the planner's call, the
// same day): the portrait's `sizes` (D3, PORTRAIT_SIZES). Inside the scaled
// staff band the cell is 192 design pixels — ≈ 155.5px at the band's step,
// 192 at the owner's 1401 window, ≈ 266.7 at the cap — so with the old
// `12rem` alone a 2× screen above the 1401 window fetched the 384w file for a
// box that can want 533 device pixels (× 1.39 at the cap; a 1× screen's 256w
// file fell ≈ 4 % short). It now has CUTOUT_SIZES' own shape — the cell's
// share of the window, ceil(100 × 192 × 0.8 / 1106) = 14vw, from the same
// 70rem window behind the same pointer condition, `12rem` the fallback — and
// tests/unit/design-scale.test.ts derives the string like the cutout's.
//
// ── D20 · THE PHONE HEADER (owner 2026-10-10). The doctor card was too tall
// on a phone — 800 to 884px on a 390 × 844 screen, its waist-up cutout alone
// 277 × 369px — and the owner chose, out of seventeen renditions drawn over
// the real doctors under the real ribbon, "S09.1 · Kicker, bigger face",
// verbatim: "i'd go with bigger face but i also want eyebrow like 10% bigger.
// get to implementing it" — having said before it: "On tablet and desktop
// it's fine and should remain as is". So, ON A PHONE ONLY:
//   · ROW 1, THE SPECIALTY, across the card on top, starting at the card's
//     left edge — ui/Eyebrow's `card` step (EYEBROW_STEP): the rendition's
//     12px × 1.1 = 13.2px, on a snug 18.15px line;
//   · ROW 2, THE ROUND PHOTO BESIDE THE NAME — the BLOCK a two-column grid,
//     the photo's track `auto` on the left and the name's `minmax(0, 1fr)`
//     on the right, on every card (ONE SIDE ON A PHONE, below), 18px between
//     them (four and a half spacing steps) and the base 12px row gap down from
//     row 1, both centred in the row. The name wears ui/Heading's `name`
//     step (NAME_STEP): 24px on a 30px line;
//   · THEN THE QUOTE AND THE LINK, exactly as before — GRID's column and its
//     24px gaps, QUOTE and ACTION byte for byte.
// The PAIR dissolves (`display: contents` — D15's, on the other side of the
// card's range) so the name and the specialty are the BLOCK's own grid
// items, and every cell is placed explicitly (PHONE): placement, never a
// size (§6.8). No separator line — the rendition's third panel had one, and
// the owner did not pick it.
// THE STEP IS THE INSET'S `@sm`, 24rem — the box the header really has,
// never the screen (§6.5) — and THE FLOOR, below, is its other edge: every
// class D20 adds to this file is spelled with BOTH container variants, the
// floor's `@min-[12.5rem]` and the step's `@max-sm`, so the header lives
// between the two and nowhere else. The two ATOM steps it wears answer the
// step alone (ui/Heading's `name`, ui/Eyebrow's `card`: today's look, with a
// smaller size under `@sm`), so under the floor the stacked card keeps their
// 24px name and 13.2px specialty — smaller than develop's 30 and 14, never
// larger.
// MEASURED inside the ribbon (2026-10-10, overlay scrollbars): the INSET's
// content is 218.1px on a 320 phone, 276.6 on a 390, 309.9 on a 430 and 318.3
// on a 440, so every upright phone at 100 % zoom is in the header's range; it
// reaches 384px at a ~567px window — at ≈ 603 behind a classic scrollbar, so
// a 600px DESKTOP window still draws the phone header — 396.1 at the 600px
// window of a 7″ tablet, 517 at 768 — so every tablet is over it and its card
// is today's to the computed value; PersonnelCard.test.tsx measures the
// doctor card at a 384, a 396 and a 517px INSET and in two columns, and the
// auxiliary tile at a phone's width and a tablet's. A doctor card measured
// 481 to 538px tall at a 390 phone in Romanian, 519 to 547 in German, over
// the six real doctors (the Team page's story twin).
// THE FLOOR (the G2 fold of 2026-10-10 — a11y HIGH-1, react MEDIUM): a phone
// with page zoom lays out NARROWER — a 390 phone at 150 % is a 260px layout,
// at 200 % a 195px one — and under a 232px INSET the photo held its 72px
// floor while the name's column took all the loss: measured on the built
// export before the floor, at 260 four of the six real names broke inside a
// word („(Sab|ău)", „Căt|ălina", „Mirc|ea", „Bozd|og") and at 195 the column
// was 12px, „Dr. Malea (Sabău) Oana Bianca" one letter a line, twenty-five
// lines. So the header has a LOWER bound: from an INSET of 12.5rem (200px)
// down, the card is TODAY'S STACKED CARD — the specialty, the name and the
// whole cutout one under the other, centred, as on develop. 12.5rem is the
// photo's 72px floor + the 18px gap + 110px, the widest real name word
// („Cătălina", 87.6px at 24px) under SC 1.4.12's 0.12em letter spacing
// (110.6px — its eight letters each 2.88px wider). So NO REAL NAME BREAKS
// INSIDE A WORD, by construction: in the header the name's column is never
// under 110px (an INSET of 200px less 90) — 22px more than the widest real
// word needs at the page's own spacing, and enough with the override on
// everywhere but the first 0.6px of INSET above the floor — and under the
// floor THE NAME'S BELT is off with the rest of the header: a word stays
// whole in the stacked card's full-width line, as on develop. Every phone at
// 100 % zoom stays above the floor: a real 320 phone's INSET is 218.1px, the
// runner's 320 frame behind a classic scrollbar 204.2. The Galaxy Fold's
// 280px cover screen (181px) draws the stacked card. PersonnelCard.test.tsx
// measures both sides of the floor, and tests/e2e/doctor-showcase.spec.ts
// reads every real name's words at windows from 195 to 390.
// THE CIRCLE (CIRCLE): `clamp(4.5rem, 100cqi − 10rem, 7rem)` a side — the
// `cqi` the INSET's content, its nearest `@container` — so 112px from a
// 272px INSET up (the rendition's 112 at a 390 phone), and on a narrower card
// the PHOTO gives way: the name keeps 142px of row (100cqi − 10rem, less the
// 18px gap) down to a 232px INSET, where the photo meets its 72px floor —
// the 72px photo and the 128px name column of a 320 phone — and on down to
// THE FLOOR's 200px, where the name's column is 110. Clipped round (hidden
// overflow, a full radius) over ui/Card's own `--card-tint`, the frame's
// lavender, and positioned: the containing block the crop is placed in (a
// `container-type` no longer is one — CLAUDE.md §15.20 round 4). The tint
// rides ui/Card's own color-mix() `supports` gate: an engine without
// color-mix() reads `--card-tint` as the SOLID accent (ui/Card's ONE TINT —
// Safari before 16.2), a dark disc behind a pale figure, so there the circle
// is the light `line-subtle` grey instead — the lavender's lightness, without
// its hue. And the gated rule reads the variable WITH that grey as its
// fallback: were `--card-tint` ever renamed or dropped in ui/Card, a bare
// `var()` would turn the declaration invalid at computed-value time and the
// circle transparent; with the fallback it stays grey. THE COUPLING, held
// both ways: ui/Card's ONE TINT names this circle as the variable's third
// reader (§4's KEEP-IN-SYNC row), and PersonnelCard.test.tsx measures the
// circle's ground EQUAL to the card's own frame colour. No flex-shrink guard:
// a grid item does not flex-shrink.
// THE NAME'S BELT: on a phone the name stands in a column of its own — 128px
// on a 320 phone, 146.6 on a 390 one — and `hyphens-none` (D4) never splits
// it at a syllable, so a word wider than that whole column would run past the
// card (and the ribbon's guard would withhold the ribbon). `wrap-anywhere`
// (overflow-wrap: anywhere) breaks such a word where it must — the numbers
// band's own belt on its title (CLAUDE.md §15.23 round 5). It engages only
// for a word wider than the whole line: the six real doctors' widest word is
// „Cătălina", 87.6px at 24px, and the header's narrowest name column is
// THE FLOOR's 110px, so no real name breaks (THE FLOOR says why that holds by
// construction); a 14-letter surname („Constantinescu", ~154px) would, rather
// than overflow. From the INSET's `@sm` up, and under THE FLOOR, the belt is
// off — it wears the header's two variants like every class D20 adds.
// THE CROP (FIGURE): the 900 × 1200 cutout drawn 165 % of the circle's
// width, its left edge 32.5 % and its top 18 % of the circle beyond it, so
// the circle shows the file's square (177, 98)–(723, 643) — head and
// shoulders, the face a little above the middle. `variant="plain"`, the
// geometry spelled at this call site (ui/Image's own rule for a consumer
// whose geometry differs; DoctorIntro's cutout is the precedent): FIGURE
// opens with `artwork`'s recipe and `placeholder="empty"` is passed
// explicitly, so from `@sm` up and under THE FLOOR the picture is the
// `artwork` cutout to the byte — the test file derives it from the atom's own
// row, and ui/Image's `artwork` row points back here (KEEP IN SYNC) — and
// only the header's tokens add the crop. The crop overruns its circle on
// every side, clipped: at a 112px circle 36.4px left and right, 20.2px above
// and 114.2px below.
// THE PORTRAIT MARKER STAYS ON THE CELL, and it is load-bearing:
// lib/ribbon-layout measures `data-ribbon-keepout="portrait"` by the cell's
// OWN box, inset, and never by its contents, so the cropped <img> — clipped,
// but laid out 165 % wide and reaching past the card's edge — never becomes
// a keep-out. Marked as a plain keep-out, the circle would be measured with
// its contents' boxes, the picture's among them, and the ribbon's guard would
// withhold the whole ribbon (found on the exploration's first renders,
// 2026-10-10: 15 of 16 withheld).
// ONE SIDE ON A PHONE (the owner, 2026-10-10, after flipping between a
// mirrored and a one-sided build on his iPhone: "i prefer only left on
// phone"): on a phone EVERY card has its photo on the LEFT, the name beside
// it and the specialty above, and every line of the specialty and the name
// starts at the same left edge — so BLOCK and PHONE are ONE value each, not a
// row per side. It also settles the a11y review's LOW-1: right-aligned text
// over several lines is harder to scan, and worse under magnification, where
// a reader follows one edge. `side` therefore acts from the INSET's `@3xl`
// alone — the two-column grid's columns, GRID and COLUMN — as it did before
// D20; nothing from `@sm` up changed for either side. The RIBBON keeps
// alternating by itself: lib/ribbon-layout mirrors every second card by its
// INDEX, never by `side`, so on a phone the ribbon still swings left, right,
// left down the column while every photo sits left. The DOM keeps D7's
// order — the picture's cell, the name, the specialty, the quote, the link —
// so a screen reader still hears the name before the specialty, and only the
// paint moves: specialty → [photo | name] → quote → link (SC 1.3.2, 2.4.3).
// SUPERSEDED for this header row: the doctor-pages run's D21 adaptability rule
// — "sections that are next to each other when in phone mode … must come one
// above the other" (CLAUDE.md §15.23) — on the owner's own pick: the photo and
// the name stand side by side on a phone; every other row of the card stacks.
// RECORDED, NOT BUILT — each one class or one string away:
//   · CUTOUT_SIZES is unchanged on purpose (D17's THE PICTURE'S `sizes`): a
//     phone fetches the very file it fetched before, for a picture now drawn
//     118.8 to 184.8px wide; a phone entry in `sizes` is the lever.
//   · A phone held SIDEWAYS keeps the stacked card: its INSET is wider than
//     24rem.
//   · The German stress story's invented „Schwarzenbeck-" (172px at 24px)
//     fits no phone column under a 302px INSET, so THE NAME'S BELT breaks it
//     there — the story shows the belt at work, by design; the lever for a
//     real doctor with such a surname is the photo's floor or the name's step.
//   · On a phone the Team page's largest paint is the first card's quote, no
//     longer its cutout (D18's last paragraph).
//
// ── D12–D14 live where they belong rather than here: the fixtures and the
// stories in PersonnelCard.stories.tsx (synthetic portraits and cutouts, no
// real people, nothing to license), and the records this lane carries in its
// own tree — MIGRATION_INVENTORY's rows (PersonnelCard new; the old doctor-card
// and helping-staff-card superseded on the owner's word), CLAUDE.md §14's Team
// row with its §15.1 justify rider, MIGRATION_PLAYBOOK's Phase-3 order.

/** Which of the two cards this is (D2). Required: no default discriminant. */
export type PersonnelKind = 'auxiliary' | 'doctor';

/** Which side the doctor's picture and name sit on at the wide step — the
 *  INSET's `@3xl` (D7). A visual-only mirror. Under the step it changes
 *  nothing — every card draws alike there (on a phone, the photo left of the
 *  name: D20's ONE SIDE ON A PHONE). */
export type PersonnelSide = 'start' | 'end';

/** The card title's heading level (D4): 3 under a band's h2 (the default), 2
 *  when the cards sit directly under a page's h1 (the Team page's staff tiles
 *  did until 2026-10-02). The ELEMENT follows it; the step does not
 *  (NAME_STEP). */
export type PersonnelHeadingLevel = 2 | 3;

/**
 * The picture file: a path under public/images/ plus its INTRINSIC pixel size
 * — the optimizer's srcset input and the reserved box (§11, zero layout
 * shift). An auxiliary's is the framed portrait; a doctor's is the transparent
 * cutout, the doctor from the waist up with no background (D17). No alt:
 * decorative by construction, because the name beside it IS the identity (D3).
 *
 * `src` is lib/image-path's `ImagePath`, not a `string` (G2 typescript,
 * 2026-09-21): public/images/ is the ONE folder the export optimizer scans, so
 * a path outside it — or one missing its leading slash — would ship as a
 * broken picture with nothing to notice it. A lib TYPE in a section is the
 * Hero's own precedent (§4: the foundation ring is importable from every
 * tier), and it erases at build time.
 *
 * `Readonly` like `PersonnelLink` beside it (G2-R2 typescript F4): a prop is
 * the caller's value, never this card's to write.
 */
export type PersonnelPhoto = Readonly<{
  src: ImagePath;
  width: number;
  height: number;
}>;

/**
 * The doctor's one link (D17): a finished href — already locale-prefixed by
 * the page's localeHref(), because this card knows no locale (§8.1) — and a
 * finished, already-translated label, which leads the link's accessible name
 * (D15's EACH LINK NAMES ITSELF, §9).
 */
export type PersonnelLink = Readonly<{ href: string; label: string }>;

type PersonnelCardBaseProps = {
  /** The full name, finished text (§8.1) — becomes the card's heading (an
   *  <h3> by default, an <h2> under `headingLevel={2}` — D4). */
  name: string;
  /** The position / specialisation, finished text — the all-caps eyebrow. */
  position: string;
  /** The picture (D3): the framed portrait, or a doctor's cutout (D17). */
  photo: PersonnelPhoto;
  /** The heading level of the name (D4). @default 3 */
  headingLevel?: PersonnelHeadingLevel;
};

type AuxiliaryProps = PersonnelCardBaseProps & {
  kind: 'auxiliary';
  /** Typed `never`: an auxiliary card has no quote to give (D2). */
  about?: never;
  /** Typed `never`: there is nothing to mirror without a quote (D2). */
  side?: never;
  /** Typed `never`: the link to a page of one's own is a doctor's (D2, D17). */
  profile?: never;
  /** Typed `never`: no page opens on a staff tile — no eager path (D2, D18). */
  preload?: never;
};

type DoctorProps = PersonnelCardBaseProps & {
  kind: 'doctor';
  /**
   * The doctor's own words, finished and already translated — a ReactNode so
   * the consuming band can hand over t.rich(...) output or a <Keywords> built
   * from lib/team, with ui/Keyword fragments inside. The quotation marks are
   * NOT part of it (D8, D9).
   */
  about: ReactNode;
  /**
   * The ONE link, to the doctor's own page — REQUIRED, with no default: a
   * doctor card without it would be a different card (D17).
   */
  profile: PersonnelLink;
  /**
   * Which side the picture and the name sit on at the wide step — the
   * INSET's `@3xl` (D7). Paint only: the DOM order never moves. Under the
   * step it changes nothing — every card draws alike there (on a phone, the
   * photo left of the name: D20's ONE SIDE ON A PHONE). @default 'start'
   */
  side?: PersonnelSide;
  /**
   * The picture is its PAGE'S LCP element: load it at once, at high fetch
   * priority, with a preload link — the pair DoctorIntro gives its own cutout.
   * The BAND says so, never the card, which cannot know where it sits (D18).
   * @default false
   */
  preload?: boolean;
};

export type PersonnelCardProps = (AuxiliaryProps | DoctorProps) &
  // `children` is Omitted (the SectionHeading precedent): content arrives as
  // name/position/about/profile, and without the Omit a caller could nest
  // something, type-check, and watch it vanish. The card's own names leave
  // the native side with it — `about` is a real RDFa attribute on every HTML
  // element and `name` is not an <article> attribute at all, so both would
  // otherwise intersect into something meaningless at the call site. The two
  // ARIA naming attributes leave too (G2, the ui/Modal precedent): the
  // article's name is the heading's text ALONE (D4), and a caller's
  // `aria-labelledby` would land after the component's own and silently
  // replace the pair, while an `aria-label` would be silently ignored —
  // better refused by the types than resolved by attribute order.
  Omit<
    ComponentPropsWithRef<'article'>,
    | 'children'
    | 'kind'
    | 'about'
    | 'side'
    | 'profile'
    | 'preload'
    | 'aria-label'
    | 'aria-labelledby'
    | keyof PersonnelCardBaseProps
  >;

/** The name's Heading step, kind × level (D4): ONE look at either level for
 *  each kind — the level is the outline's alone (§15.32, superseding §15.24's
 *  per-level rule for a name; the auxiliary's level 3 was `title` until
 *  2026-10-02). An auxiliary's name wears `band`; a doctor's, since
 *  2026-10-10, `name` — `band` from the INSET's `@sm` up and 24px under it,
 *  where it shares its row with the round photo (D20). Both are read against
 *  the nearest container (run D48). A Record of Records, so neither a third
 *  kind nor a third level compiles until it names its step — and any one cell
 *  can move again on the owner's word. */
const NAME_STEP: Record<
  PersonnelKind,
  Record<PersonnelHeadingLevel, HeadingSize>
> = {
  auxiliary: { 2: 'band', 3: 'band' },
  doctor: { 2: 'name', 3: 'name' },
};

/** The position's ui/Eyebrow step, per kind (D5, D20) — NAME_STEP's twin: a
 *  doctor's specialty wears the atom's `card` step — 13.2px under the INSET's
 *  `@sm`, where it spans the card over the photo's row, the default's 14px from
 *  it — and an auxiliary's the site's one eyebrow. A Record, so a third kind
 *  cannot compile until it names its step. */
const EYEBROW_STEP: Record<PersonnelKind, EyebrowSize> = {
  auxiliary: 'default',
  doctor: 'card',
};

/** The element behind `headingLevel` (D4) — a lookup, so a widened union
 *  fails to compile until this table names its tag (SectionHeading's ELEMENT
 *  precedent). */
const HEADING: Record<PersonnelHeadingLevel, 'h2' | 'h3'> = {
  2: 'h2',
  3: 'h3',
};

/** The card's ui/Card tone, per kind (D17's THE FRAME): the reviews deck's
 *  idle frame for a doctor, the flat surface for a tile. A Record, so a third
 *  kind cannot compile until it names its tone. */
const TONE: Record<PersonnelKind, CardTone> = {
  auxiliary: 'surface',
  doctor: 'framed',
};

/** THE INSET (D17): the ribbon's two lanes less SIX SPACING STEPS (1.5rem at
 *  the theme's default step), never below 0 — so inside a ribbon the words
 *  start `lane + 1px` from the card's edge whichever tone it wears (every tone
 *  spends six steps + 1px of border and padding), at the theme's step or at
 *  the one a band redraws (D19), and outside one it adds nothing — and its own
 *  `@container`, so the steps inside measure the box the grid really has. One
 *  static string: Tailwind reads class names from source text. */
const INSET =
  '@container pt-[max(0px,calc(var(--ribbon-lane-top,calc(var(--spacing)*6))_-_calc(var(--spacing)*6)))] px-[max(0px,calc(var(--ribbon-lane-side,calc(var(--spacing)*6))_-_calc(var(--spacing)*6)))]';

// Record<> rather than a ternary, the ui/Heading growth gate the whole repo
// uses: widening PersonnelSide cannot compile until this table names the new
// value, where a ternary would map anything new to the start row in silence.
/** One column below the step (24px apart); from it 40 / 60, 32px across and
 *  12px down — the picture's track first for `start`, last for `end` (D7,
 *  D17). */
const GRID: Record<PersonnelSide, string> = {
  start:
    'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-x-8 @3xl:gap-y-3',
  end: 'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:gap-x-8 @3xl:gap-y-3',
};

/** WHICH COLUMN each half takes at the step (D7's visual-only mirror): the
 *  picture and the name (`block`), the words and the link (`words`). */
const COLUMN: Record<PersonnelSide, Record<'block' | 'words', string>> = {
  start: { block: '@3xl:col-start-1', words: '@3xl:col-start-2' },
  end: { block: '@3xl:col-start-2', words: '@3xl:col-start-1' },
};

/** The picture and the name's pair: on a phone — an INSET from THE FLOOR's
 *  12.5rem to its `@sm` — THE PHONE HEADER's grid (D20): the specialty across
 *  the top, then the round photo on the LEFT beside the name, 18px apart, the
 *  text starting at the card's left edge — on EVERY card, whatever its side
 *  (D20's ONE SIDE ON A PHONE), so ONE string; from `@sm`, and under THE
 *  FLOOR, painted upward — specialty → name → picture — and dissolved at
 *  `@3xl` (`contents`, D15) so each takes its own cell; the element stays, so
 *  its alignment still reaches the name by inheritance (D6, D17). */
const BLOCK =
  'flex flex-col-reverse items-center gap-3 text-center @min-[12.5rem]:@max-sm:grid @min-[12.5rem]:@max-sm:grid-cols-[auto_minmax(0,1fr)] @min-[12.5rem]:@max-sm:gap-x-4.5 @min-[12.5rem]:@max-sm:text-start @3xl:contents';

/** The name over the specialty — the specialty first from `@sm` up to the
 *  step, and under THE FLOOR — dissolved on a phone (`contents`, D20) so the
 *  two are THE PHONE HEADER's own grid items, and at the step a box that HUGS
 *  its words (D17's HUG RULE: a keep-out is what is painted). */
const PAIR =
  'flex flex-col-reverse items-center gap-3 @min-[12.5rem]:@max-sm:contents @3xl:flex-col @3xl:justify-self-center';

/** The cutout's cell (D17): 18rem, about the width of the name block; the
 *  whole column on a narrow card. On a phone CIRCLE re-dresses it (D20). */
const PICTURE = 'w-72 max-w-full';

/** THE PHONE HEADER's photo (D20): the cutout's cell as a CIRCLE, 112px a side
 *  from a 272px INSET up and giving way below it — 100cqi − 10rem, so the
 *  name keeps 142px of row — to a 72px floor, at THE FLOOR's 200px INSET;
 *  clipped round over ui/Card's own `--card-tint` where the engine mixes
 *  colours (ui/Card's own `supports-` gate — the variable falling back to the
 *  grey should it ever vanish, never to transparent) and the light
 *  `line-subtle` grey where it cannot, and `relative`, the containing block
 *  the cropped picture is placed in. KEEP IN SYNC with ui/Card's ONE TINT,
 *  which names this circle as the variable's third reader (§4). */
const CIRCLE =
  '@min-[12.5rem]:@max-sm:relative @min-[12.5rem]:@max-sm:size-[clamp(4.5rem,calc(100cqi_-_10rem),7rem)] @min-[12.5rem]:@max-sm:overflow-hidden @min-[12.5rem]:@max-sm:rounded-full @min-[12.5rem]:@max-sm:bg-line-subtle @min-[12.5rem]:@max-sm:supports-[color:color-mix(in_lab,red,red)]:bg-[var(--card-tint,var(--color-line-subtle))]';

/** THE PHONE HEADER's cells (D20) — ONE set for every card, whatever its
 *  side (D20's ONE SIDE ON A PHONE): row 1 the specialty across both columns,
 *  starting at the card's left edge ON THE ELEMENT (a <p> — §15.15 b); row 2
 *  the photo in the left column and the name beside it, with the name's one
 *  belt — `wrap-anywhere`, a word wider than its whole column breaks where it
 *  must instead of running past the card (D20's THE NAME'S BELT). Placement
 *  and wrapping only, never a size (§6.8) — and none of it under THE FLOOR,
 *  where the card is the stacked one. A Record, so a fourth cell cannot be
 *  read until it is named here. */
const PHONE: Record<'photo' | 'name' | 'eyebrow', string> = {
  photo:
    '@min-[12.5rem]:@max-sm:row-start-2 @min-[12.5rem]:@max-sm:col-start-1',
  name: '@min-[12.5rem]:@max-sm:row-start-2 @min-[12.5rem]:@max-sm:col-start-2 @min-[12.5rem]:@max-sm:wrap-anywhere',
  eyebrow:
    '@min-[12.5rem]:@max-sm:col-span-2 @min-[12.5rem]:@max-sm:row-start-1 @min-[12.5rem]:@max-sm:text-start',
};

/** The cutout as drawn (D17, D20): ui/Image's `artwork` recipe — the whole
 *  figure in its cell, from `@sm` up and under THE FLOOR the `artwork` picture
 *  to the byte — and, on a phone, THE CROP: 165 % of the circle's width,
 *  32.5 % of it out to the left and 18 % above, so the circle shows the
 *  900 × 1200 file's square (177, 98)–(723, 643) — head and shoulders. KEEP IN
 *  SYNC with ui/Image's `artwork` row, which points back here. */
const FIGURE =
  'h-auto max-w-full object-contain @min-[12.5rem]:@max-sm:absolute @min-[12.5rem]:@max-sm:left-[-32.5%] @min-[12.5rem]:@max-sm:top-[-18%] @min-[12.5rem]:@max-sm:w-[165%] @min-[12.5rem]:@max-sm:max-w-none';

/** The cutout's `sizes` (D17's THE PICTURE'S `sizes`, D19): from a 70rem
 *  window on a mouse or trackpad — `(pointer: fine)`, the band's own gate —
 *  the cell the doctors band scales, ≈ 21vw; everywhere else, every touch
 *  screen at any width included, the 18rem cell. The space before `21vw` is
 *  load-bearing — next/image reads the share from it and drops only the
 *  candidates no box of this card can use. KEEP IN SYNC with ui/Container's
 *  THE BAND SCALE — `bandScaleClasses`: its REFERENCE 1106, its 56rem step
 *  and its `scalable:` gate (promoted 2026-10-02 from sections/DoctorShowcase's
 *  D10, where they are argued; §15.32); tests/unit/design-scale.test.ts reads
 *  this exact string and those numbers there. */
const CUTOUT_SIZES = '(min-width: 70rem) and (pointer: fine) 21vw, 18rem';

/** The auxiliary portrait's `sizes` (D3, D19's last paragraph) — CUTOUT_SIZES'
 *  shape for the tile's 12rem cell: from a 70rem window on a mouse or trackpad
 *  the staff band draws the tile in the band scale, the cell ≈ 14vw (ceil(100
 *  × 192 × 0.8 / 1106)); everywhere else the 12rem cell. The space before
 *  `14vw` is load-bearing for CUTOUT_SIZES' reason. KEEP IN SYNC with
 *  ui/Container's THE BAND SCALE; tests/unit/design-scale.test.ts derives it. */
const PORTRAIT_SIZES = '(min-width: 70rem) and (pointer: fine) 14vw, 12rem';

/** Row 1: the picture on its row's floor — the waist right above the name,
 *  however tall the words run — centred in its column (D17). */
const PHOTO_CELL = '@3xl:row-start-1 @3xl:self-end @3xl:justify-self-center';

/** Row 1: the words on the picture's centre line (D17). */
const TEXT_CELL = '@3xl:row-start-1 @3xl:self-center';

/** Row 2, the card's floor: the name and the link on one level (D15, D17). */
const BOTTOM = '@3xl:row-start-2 @3xl:self-center';

/** The quote's dress (D8). */
const QUOTE =
  'min-w-0 text-lg text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]';

/** The link: as wide as the words up to 28rem, centred under them — the
 *  whole column on a phone (D17). */
const ACTION = 'mx-auto w-full max-w-md';

export function PersonnelCard({
  kind,
  name,
  position,
  photo,
  about,
  profile,
  side,
  preload = false,
  headingLevel = 3,
  className,
  ...rest
}: PersonnelCardProps): ReactElement {
  const headingId = useId();
  // The link's OWN id, so the anchor can name itself WITH the person (D15's
  // EACH LINK NAMES ITSELF). A second call rather than a suffix on the
  // heading's: React guarantees a unique, hydration-stable value per call,
  // and a suffix scheme would be a second convention to keep.
  const linkId = useId();
  const HeadingElement = HEADING[headingLevel];
  // The default lives here rather than in a destructuring default because it
  // must also cover an explicit `side={undefined}` from a band computing the
  // alternation off an index (G2 react) — and it is resolved ONCE, so the
  // grid's table and the cells' table can never be read for different sides.
  const mirror = side ?? 'start';
  const column = COLUMN[mirror];

  // THE KIND SPLIT BELOW IS TOTAL (G2 typescript, 2026-09-30). The markup is a
  // ternary on `kind`, and a ternary hands anything new to its else branch —
  // the failure GRID's comment describes. This line stops compiling the day
  // PersonnelKind gains a third member, before that kind can inherit the
  // auxiliary markup in silence.
  void (kind satisfies 'auxiliary' | 'doctor');

  // THE NAME AND THE POSITION, spelled ONCE for both kinds (D2, D4, D5): their
  // steps are the kind's (NAME_STEP, EYEBROW_STEP) and only the box that holds
  // them differs — plus, for a doctor, the cell each takes in THE PHONE
  // HEADER (D20), handed in by the doctor's branch.
  const title = (cell?: string) => (
    <Heading size={NAME_STEP[kind][headingLevel]} asChild>
      <HeadingElement id={headingId} className={cx('hyphens-none', cell)}>
        {name}
      </HeadingElement>
    </Heading>
  );
  const eyebrow = (cell?: string) => (
    <Eyebrow
      size={EYEBROW_STEP[kind]}
      className={cx('hyphens-none text-center', cell)}
    >
      {position}
    </Eyebrow>
  );

  return (
    <Card asChild tone={TONE[kind]} corners="soft">
      {/* The <article> IS the card (Card D2 / ui/slot.ts): the tone's paint
          and padding — framed for a doctor, surface for a tile (THE FRAME) —
          the soft corner both kinds wear (THE CORNER) and the @container
          context land on the element this section chose,
          so there is no wrapper div between a grid's <li> and its content,
          and `aria-labelledby` stays on the thing being named. */}
      <article {...rest} aria-labelledby={headingId} className={className}>
        {kind === 'doctor' ? (
          <div className={INSET}>
            <div className={GRID[mirror]}>
              <div className={BLOCK}>
                {/* The portrait marker stays on the CELL — on a phone the
                    circle — whose own box lib/ribbon-layout measures, never
                    the cropped picture overflowing it (D20). */}
                <div
                  data-ribbon-keepout="portrait"
                  className={cx(
                    PICTURE,
                    CIRCLE,
                    PHONE.photo,
                    column.block,
                    PHOTO_CELL,
                  )}
                >
                  {/* Lazy unless the band asks (D18) — then DoctorIntro's
                      pair: preloaded, at high fetch priority, the preload
                      link carrying the same CUTOUT_SIZES (D19). `plain` with
                      the `artwork` recipe spelled in FIGURE, its crop on a
                      phone, and `artwork`'s empty placeholder (D20). */}
                  <Image
                    variant="plain"
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt=""
                    placeholder="empty"
                    sizes={CUTOUT_SIZES}
                    preload={preload}
                    fetchPriority={preload ? 'high' : undefined}
                    className={FIGURE}
                  />
                </div>
                <div
                  data-ribbon-keepout=""
                  className={cx(PAIR, column.block, BOTTOM)}
                >
                  {title(PHONE.name)}
                  {eyebrow(PHONE.eyebrow)}
                </div>
              </div>
              <blockquote
                data-ribbon-keepout=""
                className={cx(QUOTE, column.words, TEXT_CELL)}
              >
                {about}
              </blockquote>
              {/* The anchor names ITSELF first and the heading second, so the
                  accessible name is „Mai multe despre mine Dr. Elena Marin"
                  while the visible words stay exactly the label (D15). The
                  face is ui/Button's lavender solid (owner 2026-10-01) and it
                  JUMPS on hover — `motion="jump"`, the old site's 105 % pop,
                  the owner the same evening: "more about me button in doctor
                  card, to have that jump at you animation on hover". The box
                  grows 5 % inside the inset's lanes (≥ 1.5rem of air a side,
                  11px of growth at the 28rem cap), never past the card's
                  frame; tests/unit/jump-census.test.ts names the wearers. */}
              <Button
                variant="solid"
                tone="accent"
                motion="jump"
                size="lg"
                asChild
              >
                <a
                  id={linkId}
                  aria-labelledby={`${linkId} ${headingId}`}
                  data-ribbon-keepout=""
                  href={profile.href}
                  className={cx(ACTION, column.words, BOTTOM)}
                >
                  {profile.label}
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="aspect-3/4 w-48 max-w-full">
                <Image
                  variant="framed"
                  src={photo.src}
                  width={photo.width}
                  height={photo.height}
                  alt=""
                  sizes={PORTRAIT_SIZES}
                />
              </div>
              {/* The name and the position travel together (D6): one box —
                  the doctor's grid made it (D15), and the auxiliary keeps it
                  byte for byte (D17 moved nothing here). */}
              <div className="flex flex-col items-center gap-3">
                {title()}
                {eyebrow()}
              </div>
            </div>
          </div>
        )}
      </article>
    </Card>
  );
}
