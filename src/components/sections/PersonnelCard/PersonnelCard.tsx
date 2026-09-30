import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Card, type CardTone } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
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
// The auxiliary kind is byte-identical to before both.
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
// ratios), 12rem/192px wide so 206px of content still survives inside Card's
// 25px of border-plus-padding at the 320 stress width (`max-w-full` is the
// belt). The radius is the atom's own 12px (Image D3) — a circular portrait
// would be an Image variant question, never a className here (§6.8 bans
// restyling an atom's internals). A DOCTOR's picture is D17's cutout instead.
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
// `sizes` tells the browser the box — `12rem` for the auxiliary's cell,
// `18rem` for the doctor's — so it picks a small variant on a 2× screen
// instead of the 1080px one (Image's own G2 a11y A5 note).
//
// ── D4 · THE NAME. `Heading` on a REAL heading through asChild, for BOTH
// kinds. An auxiliary's name wears THE STEP OF ITS LEVEL (owner 2026-09-26,
// CLAUDE.md §15.24: one size per outline level app-wide, the doctor page's):
// `band` for `headingLevel` 2 — the Team page's tiles straight under its h1 —
// and `title` (20px), this repo's card-title step (the service tier in
// Card.stories), for the default 3. A DOCTOR's name wears `band` at BOTH
// levels since D17 — the look the owner approved on the stand-in, an exception
// to the per-level rule that §15.24 records — while its ELEMENT still follows
// `headingLevel`. `band` is ui/Heading's one container-responsive row (run
// D48, its header): 30px on a column narrower than the container's 28rem
// `@md` step, 36px from it — and the container it reads is THIS CARD (its own
// `@container`, ui/Card) or, for a doctor, the INSET inside it (D17), never
// the screen. So a doctor card is wider than 28rem from a tablet up (36px)
// and narrower on a phone (30px, under the hero h1's 32px floor), while an
// auxiliary card in TeamRoster's `minmax(16rem, 1fr)` grid can be narrower
// than 28rem on a laptop too (30px there). Level 2 wore `section` (30px) for
// one morning, then `page` (36px) for an hour: the same day the owner asked
// for every page <h2> one step larger (run D45, §15.24 amended;
// sections/SectionHeading moved with it), and D48 replaced it because a FIXED
// 36px outranked the h1's 32px floor on phones. Before that day the name wore
// `title` at both levels. The NAME_STEP table (kind × level) holds all four
// answers in one place, so the doctor's exception is one cell to move. The
// atom answers "how big is this title" and never "which element is it", which
// is why the outline slot stays this section's decision.
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
// doctor-pages run — sections/TeamRoster is the first page that puts the
// cards DIRECTLY under the page's <h1> (run D10 struck the sub-headings), where
// a level-3 title skips a level (§9's "logical heading order"; axe's
// heading-order rule fired on every roster story before the prop existed), so
// that band passes 2. A Record<PersonnelHeadingLevel, 'h2' | 'h3'> growth gate
// picks the element — SectionHeading's ELEMENT precedent — so a widened union
// cannot compile until it names its tag; a level BELOW 3 is not offered
// (a card under an h3 sub-heading would be the day to add 4, additively).
//
// ── D5 · THE POSITION. ui/Eyebrow — the only consumer of the §3 mono token —
// so the uppercase is CSS and the string stays sentence case (Ș/Ț case mapping
// is the browser's job, §8.2/§8.8). `text-center` rides the atom's className
// because globals.css aligns every <p> to `start` in the base layer, and a
// declaration matching the element itself beats a value inherited from an
// ancestor: centring prose is a PER-ELEMENT act (§15.15 b, the text-align
// board's canon). This is exactly the move SectionHeading.tsx's KNOWN LIMIT
// paragraph reserved for the first wrapping centred eyebrow — a position like
// "Medic specialist ortodonție" wraps at 320px, so the evidence exists here.
// `hyphens-none` for D4's reason: a specialisation is a title, not prose.
// KNOWN CEILING (G2 a11y): with hyphenation off, ONE word of the position
// longer than the content box (21 mono characters at 320's 206px; 16 in a
// 162px grid track) protrudes into the padding instead of breaking. No fixture
// reaches it and no page-level scroll follows; the page lane keeps it that way
// by giving grid tracks a 16rem floor (`minmax(16rem, 1fr)`) rather than by
// letter-level emergency breaks inside a person's title. Since 2026-09-21 the
// ceiling is ENFORCED on the data rather than merely recorded here:
// tests/unit/team-data.test.ts measures the longest unbreakable run of every
// `position` in every locale against those 21 characters (and of every `name`
// against the h1's own 16), which is what caught a German draft. Since the
// ribbon's mount (2026-09-30) a DOCTOR's position is held to 17 instead: the
// lanes leave its line 174.5px at the 320px window, where 17 mono characters
// fit and 18 do not (measured — CLAUDE.md §15.25); an auxiliary's stays 21.
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
// phone order), and at the step his pair HUGS its words (D17's HUG RULE).
//
// ── D7 · THE DOCTOR LAYOUT, MEASURED AGAINST ITS OWN BOX (amended by D15
// from the flex row to the 2×2 grid, and by D17 to the 40 / 60 grid inside the
// INSET). The doctor card's single child is the INSET, a container of its own,
// and the INSET's single child is the layout <div> (GRID): one column by
// default and the grid from `@3xl`. Container variants query the NEAREST
// container ancestor, so `@3xl` measures 48rem/768px of the INSET's content
// width — never the band and never the window (§6.5). Outside a ribbon that is
// the card's content box; with ui/Container's gutter the card is 312px at the
// 390 phone and 614px at the 768 tablet (both stacked), 1024px at 1280 and
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
// reader and for the stacked phone layout; `side="end"` only swaps which
// COLUMN each half is placed in (the COLUMN table), a VISUAL-ONLY mirror. The
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
//                    --accent-strong where muted gave 1.27:1 — the wash reads
//                    lighter and the keywords stand further off it. Its
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
// 650 and the violet kept — the recipe is now `font-[650] text-accent-strong`.
// Ink-only → bold → italic → lilac → a deeper lilac → a touch heavier and
// underlined → the underline gone, one day. Because the recipe lives in that
// one file and the value in the token, this card's quote and the doctor
// page's credo card both show it with no edit here. D58 then moved the OTHER
// side of that contrast — the quote's own ink, lightened to --ink-faint (D8).
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
//     column at 12px (D6), and `display: contents` is the only value that
//     drops a box without dropping the element: CSS inheritance still flows
//     through it, so the block's `text-center` keeps reaching the name in both
//     layouts. The wrapper is a semantically empty <div>, so the old `display:
//     contents` accessibility bug (an element with a ROLE losing it in the
//     a11y tree) has nothing to bite here.
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
//     services button's solid `lg` face. The services link left the card: this
//     button is now the only way to a doctor's page (the §15.23 SC 2.4.5
//     record stands).
//   · THE PICTURE is the transparent CUTOUT the doctor page's opener shows —
//     one 3:4 ratio for the team (§11; the demo files 900 × 1200) — drawn
//     whole by ui/Image's `artwork` variant (never cropped, no frame, no blur
//     placeholder) in an 18rem cell (`w-72`: about the width of the name and
//     the specialty under it; `max-w-full` on a narrow phone), `sizes="18rem"`.
//   · THE GRID at the step is 40 / 60 (`2fr` / `3fr`): row 1 the picture ‖ the
//     words, row 2 the name + specialty ‖ the link, 32px across and 12px down,
//     columns mirrored by `side`. The picture stands on its row's FLOOR
//     (`self-end`), so the waist stays 12px above the name however tall the
//     words run; the words sit on the picture's centre line. The link is as
//     wide as the words up to 28rem (`max-w-md`), centred under them, and
//     spans the column on a phone.
//   · THE PHONE ORDER below the step: specialty → name → picture → words →
//     link. Paint only — the block and the pair are `flex-col-reverse`, the
//     DOM keeps D7's order and no control moves, so the focus order is
//     untouched (SC 2.4.3).
//   · THE NAME wears `band` at both levels (D4).
// "D16" was the parked two-section rework of 2026-09-29 (Storybook 6007) that
// never merged; its 40 / 60 split and its phone order are carried here.
// THE INSET — the ribbon's lanes without touching ui/Card. Inside ui/Ribbon a
// card is inset by the two LANES — `max(1.5rem, lane)` on top and either side,
// 1.5rem below (§15.26, the seam) — but ui/Card fixes each tone's border and
// padding and refuses className as a padding API (its header). Every tone
// spends the same 1.5rem + 1px per side on the two — `surface` 1px + 1.5rem,
// `framed` 3px + (1.5rem − 2px), 25px at the default font size (its SUM
// RULE) — so the doctor card's one child pads the DIFFERENCE, `max(0px, lane −
// 1.5rem)`, inside that constant: outside a ribbon the lanes' registered
// initial value is 24px and the INSET adds nothing (an engine without
// `@property` reads the 1.5rem fallback — nothing again); inside one the words
// start `lane + 1px` from the card's edge, exactly where ui/Ribbon's stand-in
// card (1px + `max(1.5rem, lane)`) puts them, whichever tone this card wears.
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
// THE PICTURE'S `sizes` (G2 react, recorded, not changed): `18rem` over-asks
// wherever the cell is narrower than 18rem — a 390px phone at 3× fetches the
// 1080w candidate for a 226px box. `min(18rem, calc(80vw - 4.5rem))` would
// ask for less (no space before `80vw`, or next/image drops the small
// candidates), but the gain is unproven on the demo art: measure with a real
// cutout before moving it.
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
// THE LEVERS, one token each: the card's tone (TONE's doctor row, `framed` ↔
// `surface`) · the link's face (`solid` ↔ `outline`) · its cap (`max-w-md`,
// 28rem — 24rem was "not wide enough", the whole text box "too wide") · the
// picture's width (`w-72`, with `sizes`) · the name's step on level 3
// (NAME_STEP's doctor row) · the phone order (the two `flex-col-reverse`).
//
// ── D18 · THE EAGER PATH — a band asks, the card never guesses (the
// doctor-showcase lane, 2026-09-30). A card does not know where it sits on a
// page, so its picture loads LAZILY — §11's rule for everything below the
// fold — unless the band that places it says otherwise. One band must: on the
// Team page, which sections/DoctorShowcase opens, the FIRST doctor's cutout IS
// the page's LCP element (§10.6) — MEASURED by the planner on the lane's built
// export with Chromium's largest-contentful-paint entries: 226 × 302 on a 390
// phone, 288 × 384 at 1280 and 1920, still the LCP at 1366 × 633 — and it
// shipped `loading="lazy"`, with no `fetchpriority` and no preload link. So
// the doctor kind takes `preload` (default false), and when it is true
// ui/Image receives the pair sections/DoctorIntro hands its own cutout (its IT
// IS THE DOCTOR PAGE'S LCP ELEMENT paragraph), `preload` and
// `fetchPriority="high"`: no `loading="lazy"`, a high fetch priority, and a
// `<link rel="preload" as="image">` in the head for the same srcset and
// `sizes` (read off the doctor page's built export). Which card asks is the
// band's call — DoctorShowcase D9: its first, and only when the page says the
// band is on its first screen. On Home the same card sits under the Hero (the
// first cutout at y ≈ 1103), the hero's picture is the LCP, and every cutout
// stays lazy. False or absent, the <img> is attribute for attribute the one
// this card rendered before D18: PersonnelCard.test.tsx COMPARES it with a
// bare ui/Image instead of trusting `preload={false}` to be a no-op. Typed
// `never` on the auxiliary kind (D2): no page opens on a staff tile — the day
// one does, the key joins that branch additively.
//
// ── D12–D14 live where they belong rather than here: the fixtures and the
// stories in PersonnelCard.stories.tsx (synthetic portraits and cutouts, no
// real people, nothing to license), and the records this lane carries in its
// own tree — MIGRATION_INVENTORY's rows (PersonnelCard new; the old doctor-card
// and helping-staff-card superseded on the owner's word), CLAUDE.md §14's Team
// row with its §15.1 justify rider, MIGRATION_PLAYBOOK's Phase-3 order.

/** Which of the two cards this is (D2). Required: no default discriminant. */
export type PersonnelKind = 'auxiliary' | 'doctor';

/** Which side the doctor's picture and name sit on at the wide step (D7). */
export type PersonnelSide = 'start' | 'end';

/** The card title's heading level (D4): 3 under a band's h2 (the default), 2
 *  when the cards sit directly under a page's h1 (the Team page). */
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
  /** Which side the picture and the name sit on at the wide step. @default 'start' */
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

/** The name's Heading step, kind × level (D4, §15.24): an auxiliary's follows
 *  the outline level — the doctor page's h2 / h3 sizes, app-wide — and a
 *  doctor's is `band` at both (D17, the owner-approved look). `band` is read
 *  against the nearest container (run D48). A Record of Records, so neither a
 *  third kind nor a third level compiles until it names its step. */
const NAME_STEP: Record<
  PersonnelKind,
  Record<PersonnelHeadingLevel, HeadingSize>
> = {
  auxiliary: { 2: 'band', 3: 'title' },
  doctor: { 2: 'band', 3: 'band' },
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

/** THE INSET (D17): the ribbon's two lanes less 1.5rem, never below 0 — so
 *  inside a ribbon the words start `lane + 1px` from the card's edge whichever
 *  tone it wears (every tone spends 1.5rem + 1px of border and padding), and
 *  outside one it adds nothing — and its own `@container`, so the steps inside
 *  measure the box the grid really has. */
const INSET =
  '@container pt-[max(0px,calc(var(--ribbon-lane-top,1.5rem)_-_1.5rem))] px-[max(0px,calc(var(--ribbon-lane-side,1.5rem)_-_1.5rem))]';

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

/** The picture and the name's pair, painted upward below the step —
 *  specialty → name → picture — and dissolved at it (`contents`, D15) so each
 *  takes its own cell; the element stays, so `text-center` still reaches the
 *  name by inheritance (D6, D17). */
const BLOCK =
  'flex flex-col-reverse items-center gap-3 text-center @3xl:contents';

/** The name over the specialty — the specialty first below the step — and at
 *  the step a box that HUGS its words (D17's HUG RULE: a keep-out is what is
 *  painted). */
const PAIR =
  'flex flex-col-reverse items-center gap-3 @3xl:flex-col @3xl:justify-self-center';

/** The cutout's cell (D17): 18rem, about the width of the name block; the
 *  whole column on a narrow phone. */
const PICTURE = 'w-72 max-w-full';

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

  // THE NAME AND THE POSITION, spelled ONCE for both kinds (D2, D4, D5): only
  // the box that holds them differs.
  const title = (
    <Heading size={NAME_STEP[kind][headingLevel]} asChild>
      <HeadingElement id={headingId} className="hyphens-none">
        {name}
      </HeadingElement>
    </Heading>
  );
  const eyebrow = (
    <Eyebrow className="hyphens-none text-center">{position}</Eyebrow>
  );

  return (
    <Card asChild tone={TONE[kind]}>
      {/* The <article> IS the card (Card D2 / ui/slot.ts): the tone's paint
          and padding — framed for a doctor, surface for a tile (THE FRAME) —
          and the @container context land on the element this section chose,
          so there is no wrapper div between a grid's <li> and its content,
          and `aria-labelledby` stays on the thing being named. */}
      <article {...rest} aria-labelledby={headingId} className={className}>
        {kind === 'doctor' ? (
          <div className={INSET}>
            <div className={GRID[mirror]}>
              <div className={BLOCK}>
                <div
                  data-ribbon-keepout="portrait"
                  className={cx(PICTURE, column.block, PHOTO_CELL)}
                >
                  {/* Lazy unless the band asks (D18) — then DoctorIntro's
                      pair: preloaded, at high fetch priority. */}
                  <Image
                    variant="artwork"
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt=""
                    sizes="18rem"
                    preload={preload}
                    fetchPriority={preload ? 'high' : undefined}
                  />
                </div>
                <div
                  data-ribbon-keepout=""
                  className={cx(PAIR, column.block, BOTTOM)}
                >
                  {title}
                  {eyebrow}
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
                  while the visible words stay exactly the label (D15). */}
              <Button variant="solid" size="lg" asChild>
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
                  sizes="12rem"
                />
              </div>
              {/* The name and the position travel together (D6): one box —
                  the doctor's grid made it (D15), and the auxiliary keeps it
                  byte for byte (D17 moved nothing here). */}
              <div className="flex flex-col items-center gap-3">
                {title}
                {eyebrow}
              </div>
            </div>
          </div>
        )}
      </article>
    </Card>
  );
}
