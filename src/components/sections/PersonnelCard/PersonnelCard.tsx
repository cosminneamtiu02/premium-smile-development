import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading, type HeadingSize } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PersonnelCard — one member of the clinic's personnel as a card: a
// centred portrait over the full name over the position, in two kinds. An
// `auxiliary` card is that column alone (a grid tile); a `doctor` card puts the
// same column on one side and the person's own words — quoted, justified,
// in a faint ink (D8, D58), with darker-lilac keyword fragments (D9, D56) — on
// the other, with his two calls to action under them.
// Built to the owner-approved composition contract (run
// .claude/section-runs/2026-09-10_17-17_personnel-card, issue #95, no board by
// owner waiver: "do not show me a board … build it fully yourself"). The
// decision numbers below are that dossier's D1–D14 and are the anchors other
// files cite (§17.7 — never a line number).
// REWORKED 2026-09-21 by the doctor-pages run (its ledger's D4/D5): the doctor
// kind gains its two links and the wide step becomes a 2×2 grid — D15 below,
// which amends D6 and D7 and is the only part of this file that moved.
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
// finished and already translated (§8.1) — the two link LABELS and the two
// hrefs included (D15) — because only the consuming band knows whether its
// people live under `team` or under `home`, and only it knows the locale its
// hrefs must carry. Reuse schedules a composite early in the build order; it
// never promotes it (the SectionHeading paradox, §4).
//
// ── D2 · ONE COMPONENT, ONE DISCRIMINANT. `kind` rather than
// PersonnelCard/DoctorCard: the two kinds share the WHOLE portrait block and
// differ by one slot plus one layout row, so two components would spell that
// block twice — the drift sections/SectionHeading and ui/Card both exist to
// stop. `about`, `side` and `actions` are typed `never` on the auxiliary
// branch, so a quote — or a "see my services" link — handed to a nurse fails at
// `tsc --noEmit`, not in review. And `kind` is REQUIRED, with no default: the
// Team band always knows which card it is rendering, while a default
// discriminant would weaken the union at every call site (a bare
// <PersonnelCard> would type-check into the auxiliary branch and silently drop
// a doctor's words).
//
// ── D3 · THE PORTRAIT, AND ITS EMPTY alt. `photo` carries the path — typed
// `ImagePath`, lib/image-path's `/images/${string}`, so a file outside the one
// folder the export optimizer scans cannot compile (G2 typescript) — plus the
// INTRINSIC pixel size, which is the optimizer's srcset input and the reserved
// box — zero layout shift (§11). It hangs in a fixed-ratio cell
// (`aspect-3/4 w-48 max-w-full`) where ui/Image's `framed` recipe
// (h-full w-full object-cover, Image D2) fills and crops it: 3:4 is the
// headshot ratio and ONE ratio for the whole team (§11's uniform aspect
// ratios), 12rem/192px wide so 206px of content still survives inside Card's
// 25px of border-plus-padding at the 320 stress width (`max-w-full` is the
// belt). The radius is the atom's own 12px (Image D3) — a circular portrait
// would be an Image variant question, never a className here (§6.8 bans
// restyling an atom's internals).
// `alt=""` IS THE DECISION, not a missing string: the heading directly below
// (an <h3> by default, an <h2> under `headingLevel={2}` — D4) carries the
// person's name, so a portrait alt would be announced twice in a row
// ("Dr. Elena Marin, image · Dr. Elena Marin, heading level 3") — WAI's
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
// `sizes="12rem"` tells the browser the box, so it picks the 384px variant on a
// 2× screen instead of the 1080px one (Image's own G2 a11y A5 note).
//
// ── D4 · THE NAME. `Heading` on a REAL heading through asChild, for BOTH
// kinds, at THE STEP OF ITS LEVEL (owner 2026-09-26, CLAUDE.md §15.24: one
// size per outline level app-wide, the doctor page's): `band` for
// `headingLevel` 2 — the Team page's cards straight under its h1 — and
// `title` (20px), this repo's card-title step (the service tier in
// Card.stories), for the default 3. `band` is ui/Heading's one
// container-responsive row (run D48, its header): 30px on a column narrower
// than the container's 28rem `@md` step, 36px from it — and the container
// it reads is THIS CARD, its own `@container` (ui/Card), never the screen.
// So a doctor card on the Team page is wider than 28rem from a tablet up
// (36px) and narrower on a phone (30px, under the hero h1's 32px floor),
// while an auxiliary card in TeamRoster's `minmax(16rem, 1fr)` grid can be
// narrower than 28rem on a laptop too (30px there). Level 2 wore `section`
// (30px) for one morning, then `page` (36px) for an hour: the same day the
// owner asked for every page <h2> one step larger (run D45, §15.24 amended;
// sections/SectionHeading moved with it), and D48 replaced it because a
// FIXED 36px outranked the h1's 32px floor on phones. Before that day the
// name wore `title` at both levels; the outline the card sits in picks the
// step, the card's own width picks the pixel inside `band`, and the card's
// kind picks neither. The atom answers "how big is this title"
// and never "which element is it", which is why the outline slot stays this
// section's decision.
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
// against the h1's own 16), which is what caught a German draft.
//
// ── D6 · THE BLOCK (amended by D15). `flex flex-col items-center gap-3
// text-center` — photo, then the name/position PAIR, at the card's own 12px
// column rhythm, so the block reads as the card's native stack rather than as a
// nested widget. Centred for both kinds (owner: "title and eyebrow centered
// below the image").
// The pair sits in a wrapper of its own — a second `flex flex-col items-center
// gap-3` — and that wrapper is D15's doing, not a nesting habit: at the wide
// step the name and the position travel together into ONE grid cell while the
// portrait takes another, and a box is the only thing a grid can place. Below
// the step the wrapper changes nothing a visitor can see: three items at 12px
// in one column read identically to a pair at 12px nested in a column at 12px.
//
// ── D7 · THE DOCTOR LAYOUT, MEASURED AGAINST THE CARD (amended by D15 from the
// flex row to the 2×2 grid). The Card's single child is a layout <div>: one
// column by default, and for `doctor` also the wide-step GRID below.
// Container variants query the NEAREST container ancestor, and ui/Card bundles
// `@container` with its surface (Card D10) — so `@3xl` here measures 48rem/768px
// of CARD content width, never the band and never the window (§6.5). With
// ui/Container's gutter the card is 312px at the 390 phone and 614px at the 768
// tablet (both stacked), 1024px at 1280 and 1228px at 1536 (both beside): the
// owner's fb-393 rule from ClinicLocation — desktop beside, tablet and phone
// below — and the first brief, "where stuff doesn't fit … place first left side
// and then text below still in justify".
// The portrait column is a 16rem TRACK now rather than a 16rem box (the 12rem
// photo centred with room for a two-line name), and the words take
// `minmax(0, 1fr)`, whose 0 floor is what stops one unbreakable token from
// pushing the row open — the job `min-w-0 flex-1` used to do on the quote.
// `min-w-0` stays ON the quote for the other half of that job: a grid item's
// automatic minimum size is still its min-content size, so without it the item
// would overflow the track it was given. `flex-1` is gone with the flex row.
// **DOM ORDER IS FIXED — block, quote, actions — for BOTH sides.** Reading
// order stays "who, then what they say, then what you can do" for a screen
// reader and for the stacked phone layout; `side="end"` only swaps which
// COLUMN each half is placed in (the PLACE table), a VISUAL-ONLY mirror. The
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
//                    `hyphens: auto` is what keeps rivers out of the lines.
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
// sure nothing that dodged them (a cast, a `{...props}` of unknown shape) can
// replace the name pair either. The
// card owns no outer margin and no width of its own (§6.4): a grid track or a
// max-w-* placement is the page's business, and ui/Card's D3 says the same from
// one tier down.
//
// ── D11 · ISLANDS (§16). No 'use client' in this file; useId is the only hook
// — called three times since 2026-09-21, once for the heading and once for
// each link's self-reference (D15) — and it is server-safe, so there is no
// state and no handler, and the card compiles
// into the page's static HTML — ui/Button included, which is a plain props-in
// atom whose two links here are ordinary anchors (§15.13: every internal link
// is a plain <a href>, no router, no prefetch). The ONE cost, stated rather
// than discovered: ui/Image wraps next-image-export-optimizer, which ships its
// own directive, so every portrait brings a small client island with it.
// Accepted — the photographs are the reason this card exists (§11).
// PersonnelCard.test.tsx pins the directive's absence and the whole import
// surface from the source text, because no runtime assertion can see either.
//
// ── D15 · THE TWO CALLS TO ACTION, AND THE 2×2 GRID THEY MADE NECESSARY
// (doctor-pages run, 2026-09-21; the run ledger's D4/D5). The owner, verbatim:
// "i want them 2 have 2 buttons identical as aspect to the ones in the hero
// section for contact us and see services … in the card at the same level on
// the oy axis as [name + position] and centered below the description text …
// the left button is see services done by doctor and the right one takes you to
// the doctor page."
//   · THE FACES are the Hero's pair, prop for prop: `variant="solid"
//     size="lg"` on the services link, `variant="outline" size="lg"` on the
//     profile link — "identical as aspect" read literally, so the two bands
//     cannot drift (§6.6: a variant is one look everywhere). `lg` is
//     min-h-14/56px, comfortably past §9's 44px target for a primary action.
//   · THE ROW is the Hero's too — `flex flex-wrap gap-3 *:grow *:basis-64`:
//     two 16rem bases side by side wherever ~33rem of column exist, grown to
//     equal widths; narrower, each takes its own row at full width, the 320px
//     stress width included. `w-full max-w-3xl mx-auto` is this card's own
//     addition: the row fills its cell up to 48rem and is CENTRED in it, which
//     is the owner's "centered below the description text" (the row is what is
//     centred — the buttons fill it).
//   · BOTH ARE LINKS, never buttons: one goes to the Services page (an anchor
//     into the doctor's own category), the other to his page. `ui/Button
//     asChild` on a plain <a href> is how this repo dresses a link as a button
//     (§15.13, the Hero's services link).
//   · EACH LINK NAMES ITSELF AND THEN THE PERSON (G2 a11y, 2026-09-21). A
//     roster of doctors repeats the same two labels once per card, so a
//     screen-reader user listing the page's links — NVDA's Elements List,
//     VoiceOver's rotor, both of which read names out of context — used to
//     hear "Vezi profilul" five times with nothing to tell them apart. Each
//     anchor therefore carries its own `useId()` and
//     `aria-labelledby={`${linkId} ${headingId}`}`: the first IDREF is the
//     anchor itself, whose name-from-content is the visible label, and the
//     second is the card's heading (D4 — an <h3> by default, an <h2> under
//     `headingLevel={2}`), so the computed name is "Vezi profilul Dr.
//     Elena Marin". The VISIBLE text is byte-identical to before and is the
//     LEADING substring of the accessible name, which is what SC 2.5.3 Label
//     in Name asks of a spoken command ("click Vezi profilul" still matches).
//     The alternative — `aria-label` with the name interpolated — was declined
//     for the §8.1 reason: the card would have to build a sentence out of two
//     strings, which is exactly the fragment-concatenation §8.2 bans.
//   · DOM ORDER is block → quote → actions, i.e. who → what they say → what
//     you can do. A screen reader and the stacked phone layout read the card in
//     that order in both mirrors.
//   · `actions &&`, not `doctor &&`: the union already guarantees the pair
//     exists on the doctor branch and nowhere else (D5 of the run ledger — it
//     is REQUIRED there, because every doctor card the owner described has its
//     two links), and the guard that narrows the VALUE is the one that lets the
//     row read `actions.services.href` without an assertion.
//   · THE GRID is what "at the same level on the oy axis as [name + position]"
//     costs: the buttons must sit in a row of their own, beside the name, with
//     the quote above them and the portrait above the name. Two rows × two
//     columns, both row-2 cells `self-center` so the two boxes share one
//     vertical centre whichever of them is taller. The D6 block DISSOLVES into
//     it — `@3xl:contents` — rather than being split into two wrappers,
//     because below the step those two children must stay ONE flex column at
//     12px (D6), and `display: contents` is the only value that drops a box
//     without dropping the element: CSS inheritance still flows through it, so
//     the block's `text-center` keeps reaching the name in both layouts. The
//     wrapper is a semantically empty <div>, so the old `display: contents`
//     accessibility bug (an element with a ROLE losing it in the a11y tree)
//     has nothing to bite here.
//
// ── D12–D14 live where they belong rather than here: the fixtures and the
// seven stories in PersonnelCard.stories.tsx (three synthetic portraits, no
// real people, nothing to license), and the records this lane carries in its
// own tree — MIGRATION_INVENTORY's rows (PersonnelCard new; the old doctor-card
// and helping-staff-card superseded on the owner's word), CLAUDE.md §14's Team
// row with its §15.1 justify rider, MIGRATION_PLAYBOOK's Phase-3 order.

/** Which of the two cards this is (D2). Required: no default discriminant. */
export type PersonnelKind = 'auxiliary' | 'doctor';

/** Which side the doctor's portrait block sits on at the wide step (D7). */
export type PersonnelSide = 'start' | 'end';

/** The card title's heading level (D4): 3 under a band's h2 (the default), 2
 *  when the cards sit directly under a page's h1 (the Team page). */
export type PersonnelHeadingLevel = 2 | 3;

/**
 * The portrait file: a path under public/images/ plus its INTRINSIC pixel size
 * — the optimizer's srcset input and the reserved box (§11, zero layout
 * shift). No alt: decorative by construction, because the name below IS the
 * identity (D3).
 *
 * `src` is lib/image-path's `ImagePath`, not a `string` (G2 typescript,
 * 2026-09-21): public/images/ is the ONE folder the export optimizer scans, so
 * a path outside it — or one missing its leading slash — would ship as a
 * broken picture with nothing to notice it. A lib TYPE in a section is the
 * Hero's own precedent (§4: the foundation ring is importable from every
 * tier), and it erases at build time.
 *
 * `Readonly` like `PersonnelLink` and `PersonnelActions` beside it (G2-R2
 * typescript F4): a prop is the caller's value, never this card's to write.
 */
export type PersonnelPhoto = Readonly<{
  src: ImagePath;
  width: number;
  height: number;
}>;

/**
 * One of the doctor's two calls to action (D15): a finished href — already
 * locale-prefixed by the page's localeHref(), because this card knows no
 * locale (§8.1) — and a finished, already-translated label, which is also the
 * link's accessible name (§9).
 */
export type PersonnelLink = Readonly<{ href: string; label: string }>;

/**
 * The doctor's two calls to action, left then right (D15): `services` goes to
 * the work he does, `profile` to his own page. Named rather than an array, so
 * neither face can be handed the other's link by a miscounted index.
 */
export type PersonnelActions = Readonly<{
  services: PersonnelLink;
  profile: PersonnelLink;
}>;

type PersonnelCardBaseProps = {
  /** The full name, finished text (§8.1) — becomes the card's heading (an
   *  <h3> by default, an <h2> under `headingLevel={2}` — D4). */
  name: string;
  /** The position / specialisation, finished text — the all-caps eyebrow. */
  position: string;
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
  /** Typed `never`: the two links are a doctor's own (D2, D15). */
  actions?: never;
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
   * The two links under the words — REQUIRED, with no default: a doctor card
   * without them would be a different card (D15).
   */
  actions: PersonnelActions;
  /** Which side the portrait block sits on at the wide step. @default 'start' */
  side?: PersonnelSide;
};

export type PersonnelCardProps = (AuxiliaryProps | DoctorProps) &
  // `children` is Omitted (the SectionHeading precedent): content arrives as
  // name/position/about/actions, and without the Omit a caller could nest
  // something, type-check, and watch it vanish. The five own names leave the
  // native side with it — `about` is a real RDFa attribute on every HTML
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
    | 'actions'
    | 'aria-label'
    | 'aria-labelledby'
    | keyof PersonnelCardBaseProps
  >;

// Record<> rather than a ternary, the ui/Heading growth gate the whole repo
// uses: widening PersonnelSide cannot compile until this table names the new
// value, where a ternary would map anything new to the start row in silence.
// Both rows carry the same three companions on purpose — the step is ONE
// situation ("two rows, a 16rem portrait track beside the words, 32px across
// and 12px down") — so which side holds the fixed track is the only thing that
// differs between them (D7, D15).
const LAYOUT: Record<PersonnelSide, string> = {
  start:
    '@3xl:grid @3xl:grid-cols-[16rem_minmax(0,1fr)] @3xl:gap-x-8 @3xl:gap-y-3',
  end: '@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_16rem] @3xl:gap-x-8 @3xl:gap-y-3',
};

/** The D6 block has no box of its own at the step: its two children become
 *  grid items in their own right, and inheritance still flows through it
 *  (D15 — why `contents` and not two wrappers). */
const BLOCK_DISSOLVES = '@3xl:contents';

/** The name's Heading step per level (D4, §15.24): the outline level decides
 *  the size — the doctor page's h2 / h3 sizes, app-wide. Level 2 is `band`
 *  (run D48), read against this card's own container. */
const NAME_STEP: Record<PersonnelHeadingLevel, HeadingSize> = {
  2: 'band',
  3: 'title',
};

/** The element behind `headingLevel` (D4) — a lookup, so a widened union
 *  fails to compile until this table names its tag (SectionHeading's ELEMENT
 *  precedent). */
const HEADING: Record<PersonnelHeadingLevel, 'h2' | 'h3'> = {
  2: 'h2',
  3: 'h3',
};

/** WHERE THE FOUR CELLS SIT at the step, one row per arrangement (D7, D15).
 *  Only the COLUMN differs between the two rows — the same grid seen in a
 *  mirror — but all four are spelled out so a cell's placement is readable in
 *  ONE place rather than assembled from fragments at the call site, and so the
 *  Record stays the growth gate widening PersonnelSide has to satisfy. */
const PLACE: Record<
  PersonnelSide,
  Record<'portrait' | 'name' | 'quote' | 'actions', string>
> = {
  start: {
    portrait:
      '@3xl:col-start-1 @3xl:row-start-1 @3xl:self-center @3xl:justify-self-center',
    name: '@3xl:col-start-1 @3xl:row-start-2 @3xl:self-center',
    quote: '@3xl:col-start-2 @3xl:row-start-1 @3xl:self-center',
    actions: '@3xl:col-start-2 @3xl:row-start-2 @3xl:self-center',
  },
  end: {
    portrait:
      '@3xl:col-start-2 @3xl:row-start-1 @3xl:self-center @3xl:justify-self-center',
    name: '@3xl:col-start-2 @3xl:row-start-2 @3xl:self-center',
    quote: '@3xl:col-start-1 @3xl:row-start-1 @3xl:self-center',
    actions: '@3xl:col-start-1 @3xl:row-start-2 @3xl:self-center',
  },
};

/** The two calls to action share the Hero's own row, plus this card's cap and
 *  centring (D15). */
const ACTIONS_ROW =
  'mx-auto flex w-full max-w-3xl flex-wrap gap-3 *:grow *:basis-64';

export function PersonnelCard({
  kind,
  name,
  position,
  photo,
  about,
  actions,
  side,
  headingLevel = 3,
  className,
  ...rest
}: PersonnelCardProps): ReactElement {
  const headingId = useId();
  // ONE id per link, so each anchor can name itself WITH the person (D15's
  // REPEATED NAMES bullet). Two calls rather than one id with suffixes: React
  // guarantees a unique, hydration-stable value per call, and a suffix scheme
  // would be a second convention to keep.
  const servicesLinkId = useId();
  const profileLinkId = useId();
  const doctor = kind === 'doctor';
  const HeadingElement = HEADING[headingLevel];
  // The default lives here rather than in a destructuring default because it
  // must also cover an explicit `side={undefined}` from a band computing the
  // alternation off an index (G2 react) — and it is resolved ONCE, so the
  // layout's table and the cells' table can never be read for different sides.
  const mirror = side ?? 'start';
  const place = PLACE[mirror];

  return (
    <Card asChild tone="surface">
      {/* The <article> IS the card (Card D2 / ui/slot.ts): the surface, the
          inset and the @container context land on the element this section
          chose, so there is no wrapper div between a grid's <li> and its
          content, and `aria-labelledby` stays on the thing being named. */}
      <article {...rest} aria-labelledby={headingId} className={className}>
        <div className={cx('flex flex-col gap-6', doctor && LAYOUT[mirror])}>
          <div
            className={cx(
              'flex flex-col items-center gap-3 text-center',
              doctor && BLOCK_DISSOLVES,
            )}
          >
            <div
              className={cx(
                'aspect-3/4 w-48 max-w-full',
                doctor && place.portrait,
              )}
            >
              <Image
                variant="framed"
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt=""
                sizes="12rem"
              />
            </div>
            {/* The name and the position travel together (D6): one box, so
                the grid can place the pair as one cell. No justify-self —
                stretched across the 16rem track, its own `items-center` and
                the inherited `text-center` do the centring. */}
            <div
              className={cx(
                'flex flex-col items-center gap-3',
                doctor && place.name,
              )}
            >
              <Heading size={NAME_STEP[headingLevel]} asChild>
                <HeadingElement id={headingId} className="hyphens-none">
                  {name}
                </HeadingElement>
              </Heading>
              <Eyebrow className="hyphens-none text-center">{position}</Eyebrow>
            </div>
          </div>
          {doctor && (
            <blockquote
              className={cx(
                'min-w-0 text-lg text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]',
                place.quote,
              )}
            >
              {about}
            </blockquote>
          )}
          {actions && (
            <div className={cx(ACTIONS_ROW, place.actions)}>
              {/* Each anchor names ITSELF first and the heading second, so the
                  accessible name is "Vezi serviciile Dr. Elena Marin" while
                  the visible words stay exactly the label (D15). */}
              <Button variant="solid" size="lg" asChild>
                <a
                  id={servicesLinkId}
                  aria-labelledby={`${servicesLinkId} ${headingId}`}
                  href={actions.services.href}
                >
                  {actions.services.label}
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  id={profileLinkId}
                  aria-labelledby={`${profileLinkId} ${headingId}`}
                  href={actions.profile.href}
                >
                  {actions.profile.label}
                </a>
              </Button>
            </div>
          )}
        </div>
      </article>
    </Card>
  );
}
