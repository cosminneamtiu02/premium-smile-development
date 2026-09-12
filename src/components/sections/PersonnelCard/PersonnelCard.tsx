import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';

// sections/PersonnelCard — one member of the clinic's personnel as a card: a
// centred portrait over the full name over the position, in two kinds. An
// `auxiliary` card is that column alone (a grid tile); a `doctor` card puts the
// same column on one side and the person's own words — quoted, justified,
// muted, with ink-strong keyword fragments — on the other.
// Built to the owner-approved composition contract (run
// .claude/section-runs/2026-09-10_17-17_personnel-card, issue #95, no board by
// owner waiver: "do not show me a board … build it fully yourself"). The
// decision numbers below are that dossier's D1–D14 and are the anchors other
// files cite (§17.7 — never a line number).
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
// SectionHeading/Wordmark kind. It composes four atoms (ui/Card, ui/Image,
// ui/Heading, ui/Eyebrow), which is what /classify-component rule 3 looks at,
// and §4's dependency direction then forbids ui/ from importing it back. It
// owns ZERO message keys and calls no t(): every string arrives finished and
// already translated (§8.1), because only the consuming band knows whether its
// people live under `team` or under `home`. Reuse schedules a composite early
// in the build order; it never promotes it (the SectionHeading paradox, §4).
//
// ── D2 · ONE COMPONENT, ONE DISCRIMINANT. `kind` rather than
// PersonnelCard/DoctorCard: the two kinds share the WHOLE portrait block and
// differ by one slot plus one layout row, so two components would spell that
// block twice — the drift sections/SectionHeading and ui/Card both exist to
// stop. `about` and `side` are typed `never` on the auxiliary branch, so a
// quote handed to a nurse fails at `tsc --noEmit`, not in review. And `kind` is
// REQUIRED, with no default: the Team band always knows which card it is
// rendering, while a default discriminant would weaken the union at every call
// site (a bare <PersonnelCard> would type-check into the auxiliary branch and
// silently drop a doctor's words).
//
// ── D3 · THE PORTRAIT, AND ITS EMPTY alt. `photo` carries the path plus the
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
// `alt=""` IS THE DECISION, not a missing string: the <h3> directly below
// carries the person's name, so a portrait alt would be announced twice in a
// row ("Dr. Elena Marin, image · Dr. Elena Marin, heading level 3") — WAI's
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
// ── D4 · THE NAME. `Heading size="title"` on a REAL <h3> through asChild, for
// BOTH kinds: the Team band's own <h2> wears the `section` step (30px) and must
// outrank every card, and 20px is this repo's card-title step (the service tier
// in Card.stories). The atom answers "how big is this title" and never "which
// element is it", which is why the outline slot stays this section's decision.
// `hyphens-none` on the h3: the site-wide `hyphens: auto` (§15.14) is for
// PROSE, and a person's name must never break at a syllable — it still wraps
// between words when the box demands it. The `id` lands on the h3 and the
// <article> points at it: the region is named by the heading's text ALONE, the
// rule SectionHeading records for the same pairing. It comes from React's
// useId(), which is server-safe and hydration-stable, so several cards on one
// page can never collide. The LEVEL is fixed at 3 — right for the §14 Team
// plan (h1 page → h2 band → h3 cards) and deliberately not an axis (§6.6).
// TRIGGER (G2 a11y): the first page that nests cards under an <h3> sub-heading
// ("Medici" over "Personal auxiliar") adds `headingLevel` additively, with
// the default pinned to 3.
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
// letter-level emergency breaks inside a person's title.
//
// ── D6 · THE BLOCK. `flex flex-col items-center gap-3 text-center` — photo,
// name, position at the card's own 12px column rhythm, so the block reads as
// the card's native stack rather than as a nested widget. Centred for both
// kinds (owner: "title and eyebrow centered below the image").
//
// ── D7 · THE DOCTOR LAYOUT, MEASURED AGAINST THE CARD. The Card's single child
// is a layout <div>: one column by default, and for `doctor` also the LAYOUT
// row below. Container variants query the NEAREST container ancestor, and
// ui/Card bundles `@container` with its surface (Card D10) — so `@3xl` here
// measures 48rem/768px of CARD content width, never the band and never the
// window (§6.5). With ui/Container's gutter the card is 312px at the 390
// phone and 614px at the 768 tablet (both stacked), 1024px at 1280 and 1228px
// at 1536 (both beside): the owner's fb-393 rule from ClinicLocation — desktop
// beside, tablet and phone below — and today's brief, "where stuff doesn't fit
// … place first left side and then text below still in justify".
// The block takes `@3xl:w-64 @3xl:shrink-0` (16rem: the 12rem photo centred
// with room for a two-line name) and the quote takes `min-w-0 flex-1`, where
// min-w-0 is what stops one unbreakable token from pushing the row open.
// `items-center` at the step floats a short quote mid-height beside the
// portrait instead of hugging the top with air below (ClinicLocation's
// `@3xl:items-center` precedent).
// **DOM ORDER IS FIXED — block, then quote — for BOTH sides.** Reading order
// stays "who, then what they say" for a screen reader and for the stacked phone
// layout; `side="end"` swaps `flex-row` for `flex-row-reverse`, a VISUAL-ONLY
// mirror. The measure at desktop is the page's lever (a max-w-* on the band's
// grid), never this card's.
//
// ── D8 · THE QUOTE. A bare <blockquote>, because the text is the doctor's OWN
// words: the marks say so to sighted readers and the element says so to
// assistive tech (ARIA role `blockquote`), which is also why the owner authors
// it in the first person. Its dress, utility by utility:
//   text-lg          18px = the §15.1 body base. A quote reads at body size,
//                    not at ui/Text's 16px step.
//   text-ink-muted   the owner's "relatively washed or ghost". No washed/ghost
//                    TOKEN exists — "ghost" names a button variant — and muted
//                    is the repo's quiet ink at 7.35:1 on the surface, AA with
//                    room (§9).
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
// ── D9 · KEYWORDS ARE <b>, AND <b> IS THE POINT. The owner asked for fragments
// "not bold but rather more colored towards black so that they jump out as
// keywords", so `Keyword` renders HTML's key-word element — the spec's own
// example for <b> is "key words in a document abstract". <strong> would claim
// importance, <em> stress emphasis, <mark> relevance to the reader's current
// task; none of those is what a name-dropped speciality is. `font-normal`
// undoes Preflight's `b { font-weight: bolder }` so the weight matches the
// running text, and `text-ink-strong` (#1a1714) is the darkest ink, one step
// past the body's. Consumers author the fragments INSIDE the message —
// "Lucrez în <k>ortodonție</k> de peste zece ani…" — and pass
// t.rich('members.elena.about', { k: (chunks) => <Keyword>{chunks}</Keyword> })
// as `about`, which is why `about` is a ReactNode rather than a string.
// PROMOTION TRIGGER (the §4 primitive rule): the second section that wants
// keyword fragments moves this to ui/Keyword — a composite never promotes, but
// this one is a primitive living here until it has a second consumer.
// TWO LIMITS, RECORDED (G2 a11y): the keyword-to-text luminance step is
// 2.43:1 (#1a1714 against #5b554f), so the "jump" is subtle for low-vision
// readers and vanishes under forced colours — legitimately, because it is
// salience and not information (SC 1.4.1 passes exactly because the sentence
// is complete without it); the page lane must therefore never REFER to the
// colouring in copy ("the highlighted words are…"), and must not reach for
// italic as a second cue — only the upright Source Serif 4 face is hosted.
//
// ── D10 · FIDELITY (§6.8). The caller's className goes on the <article>, where
// ui/slot.ts merges it LAST (atom classes → Card's className → the child's), so
// placement wins where placement is allowed and nothing restyles an atom's
// insides. `ref` and every other native prop spread onto the article too. The
// card owns no outer margin and no width of its own (§6.4): a grid track or a
// max-w-* placement is the page's business, and ui/Card's D3 says the same from
// one tier down.
//
// ── D11 · ISLANDS (§16). No 'use client' in this file; useId is the only hook
// and it is server-safe, there is no state and no handler, so the card compiles
// into the page's static HTML. The ONE cost, stated rather than discovered:
// ui/Image wraps next-image-export-optimizer, which ships its own directive, so
// every portrait brings a small client island with it. Accepted — the
// photographs are the reason this card exists (§11). PersonnelCard.test.tsx
// pins the directive's absence and the whole import surface from the source
// text, because no runtime assertion can see either.
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

/**
 * The portrait file: a path under public/ plus its INTRINSIC pixel size — the
 * optimizer's srcset input and the reserved box (§11, zero layout shift). No
 * alt: decorative by construction, because the name below IS the identity (D3).
 */
export type PersonnelPhoto = { src: string; width: number; height: number };

type PersonnelCardBaseProps = {
  /** The full name, finished text (§8.1) — becomes the card's <h3>. */
  name: string;
  /** The position / specialisation, finished text — the all-caps eyebrow. */
  position: string;
  photo: PersonnelPhoto;
};

type AuxiliaryProps = PersonnelCardBaseProps & {
  kind: 'auxiliary';
  /** Typed `never`: an auxiliary card has no quote to give (D2). */
  about?: never;
  /** Typed `never`: there is nothing to mirror without a quote (D2). */
  side?: never;
};

type DoctorProps = PersonnelCardBaseProps & {
  kind: 'doctor';
  /**
   * The doctor's own words, finished and already translated — a ReactNode so
   * the consuming band can hand over t.rich(...) output with <Keyword>
   * fragments inside. The quotation marks are NOT part of it (D8).
   */
  about: ReactNode;
  /** Which side the portrait block sits on at the wide step. @default 'start' */
  side?: PersonnelSide;
};

export type PersonnelCardProps = (AuxiliaryProps | DoctorProps) &
  // `children` is Omitted (the SectionHeading precedent): content arrives as
  // name/position/about, and without the Omit a caller could nest something,
  // type-check, and watch it vanish. The four own names leave the native side
  // with it — `about` is a real RDFa attribute on every HTML element and
  // `name` is not an <article> attribute at all, so both would otherwise
  // intersect into something meaningless at the call site. The two ARIA
  // naming attributes leave too (G2, the ui/Modal precedent): the article's
  // name is the heading's text ALONE (D4), and a caller's `aria-labelledby`
  // would land after the component's own and silently replace the pair,
  // while an `aria-label` would be silently ignored — better refused by the
  // types than resolved by attribute order.
  Omit<
    ComponentPropsWithRef<'article'>,
    | 'children'
    | 'kind'
    | 'about'
    | 'side'
    | 'aria-label'
    | 'aria-labelledby'
    | keyof PersonnelCardBaseProps
  >;

type KeywordOwnProps = {
  /**
   * The fragment — finished, already-translated text (§8.1): the chunks a
   * `t.rich` tag function hands over. REQUIRED, as on every sibling atom
   * (Eyebrow, Heading, Text): a keyword without its word is a bug.
   */
  children: ReactNode;
};

export type KeywordProps = KeywordOwnProps &
  Omit<ComponentPropsWithRef<'b'>, keyof KeywordOwnProps>;

// Record<> rather than a ternary, the ui/Heading growth gate the whole repo
// uses: widening PersonnelSide cannot compile until this table names the new
// value, where a ternary would map anything new to the start row in silence.
// Both rows carry the same two companions on purpose — the step is ONE
// situation ("sit beside, centred, at 32px"), so its direction is the only
// thing that differs between them.
const LAYOUT: Record<PersonnelSide, string> = {
  start: '@3xl:flex-row @3xl:items-center @3xl:gap-8',
  end: '@3xl:flex-row-reverse @3xl:items-center @3xl:gap-8',
};

/** The portrait block's share of the wide row (D7) — a fixed 16rem column that
 *  never shrinks, so the quote absorbs every extra pixel instead. */
const BLOCK_BESIDE = '@3xl:w-64 @3xl:shrink-0';

export function PersonnelCard({
  kind,
  name,
  position,
  photo,
  about,
  side,
  className,
  ...rest
}: PersonnelCardProps): ReactElement {
  const headingId = useId();
  const doctor = kind === 'doctor';

  return (
    <Card asChild tone="surface">
      {/* The <article> IS the card (Card D2 / ui/slot.ts): the surface, the
          inset and the @container context land on the element this section
          chose, so there is no wrapper div between a grid's <li> and its
          content, and `aria-labelledby` stays on the thing being named. */}
      <article aria-labelledby={headingId} className={className} {...rest}>
        <div
          className={cx(
            'flex flex-col gap-6',
            doctor && LAYOUT[side ?? 'start'],
          )}
        >
          <div
            className={cx(
              'flex flex-col items-center gap-3 text-center',
              doctor && BLOCK_BESIDE,
            )}
          >
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
            <Heading size="title" asChild>
              <h3 id={headingId} className="hyphens-none">
                {name}
              </h3>
            </Heading>
            <Eyebrow className="hyphens-none text-center">{position}</Eyebrow>
          </div>
          {doctor && (
            <blockquote className="min-w-0 flex-1 text-lg text-ink-muted text-justify before:content-[open-quote] after:content-[close-quote]">
              {about}
            </blockquote>
          )}
        </div>
      </article>
    </Card>
  );
}

/**
 * A key word inside a doctor's quote (D9) — HTML's own key-word element, at the
 * running text's weight and the darkest ink, so the fragment stands out without
 * claiming importance the sentence does not have.
 *
 * The consuming band authors the fragments in the message file and hands them
 * over as rich-text chunks:
 * `t.rich('members.elena.about', { k: (chunks) => <Keyword>{chunks}</Keyword> })`.
 */
export function Keyword({
  className,
  children,
  ...rest
}: KeywordProps): ReactElement {
  return (
    // §6.8 merge order: own classes first, the caller's className LAST — a
    // deterministic convention the tests pin, not a cascade mechanism.
    <b className={cx('font-normal text-ink-strong', className)} {...rest}>
      {children}
    </b>
  );
}
