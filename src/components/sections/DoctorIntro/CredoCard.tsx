import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Card } from '@/components/ui/Card/Card';

// sections/DoctorIntro/CredoCard — the doctor's credo under his name: a framed
// card in the lavender aura (D61) holding an eyebrow, a title and his own
// quoted words, with the key words still marked. Round 2 of the doctor-pages
// run, decision D12
// (.claude/section-runs/2026-09-21_11-58_doctor-pages/round2/ledger-round2.md
// — the anchor other files cite, §17.7). The owner's brief, verbatim: "below
// [the specialty + the name] I need the card from reviews, but … the non
// current one, that is the styling I need. Within it I need just the
// internationalised quotations and … the original doctor text from the doctor
// card with bold text and so on within it. So in that empty space next to
// photo below [the heading]. Within this card I also want a heading with
// eyebrow with „filozofia mea" or smth in this direction."
//
// It lives inside the band's folder rather than beside it because it has
// exactly one consumer, DoctorIntro, and nothing about it is shared (the
// CategoryCard-in-PriceList and ScheduleCard-in-DoctorProfile precedent: a band's
// own piece stays in the band's folder until a second consumer exists).
// Exported all the same, so the suites can mount it alone. It has NO story of
// its own, on purpose: it is photographed inside every DoctorIntro story, and
// a second frame would only duplicate those pixels.
//
// ── D12 · "THE NON CURRENT ONE" IS ui/Card's `framed` TONE. The reviews deck
// passes `framed` to every slide but the selected one (ReviewsDeck's
// `offset === 0 ? 'emphasized' : 'framed'`), so the look the owner pointed at
// is a row the atom already owns: the 3px `--card-tint` frame on the white
// surface, spending 3 + 22 per side where the flat rows spend 1 + 24 (ui/Card's
// SUM RULE). Choosing a tone is the section's job (fb-378/381); spelling a
// border here would be restyling an atom's internals (§6.8).
//
// ── D61 · THE AURA, ON THE OWNER'S WORD (2026-09-26, round 2r: "i need you
// also to add an aura around the filozofia mea card"). Round 2 built the card
// without one — the glow is a per-KIND decision, and D12 had judged that the
// opener's words needed no second halo beside the cutout; the owner decided
// the kind the other way. `aura` is ui/Card's OWN prop, chosen per card KIND
// in the section that composes it (fb-378/381) — the PriceList precedent,
// where the menu card and every category card pass it — so no shadow utility
// is spelled anywhere in this folder: the atom holds the single spelling of
// the token and tests/unit/aura-token.test.ts's census counts it there, while
// CredoCard.test.tsx guards THIS card's wear by deriving its row from
// `<Card tone="framed" aura>`. The TONE does not move: the card is still the
// deck's idle card, `framed`, now in the Header pill's lavender glow.
//   THE GLOW'S REACH, against the band's spacing (DoctorIntro.tsx's classes,
//   read, and the doctor page MEASURED in Chromium at 320 / 390 / 768 / 1280
//   / 1536 on the dev server, a sampled pixel counted as glow while it
//   differs from the --page ground #faf9f7): the token is `0 8px 22px`, so
//   the glow reaches ~16px above the box, ~24px to either side and ~32px
//   below it.
//   BESIDE THE PICTURE (`@3xl`, DoctorIntro's D62–D64): the pair above the
//   card stands across the bottom container's top padding, `py-6` = 24px
//   (clears the 16px); the picture's track ends a whole gap away —
//   `clamp(3rem, a sixth of the column, 10.5rem)`, 128–168px — plus the
//   words' 1.5rem inset, and even the cutout grown to its cap stays ~100px
//   clear of the card at the step (clears the 24px); and the band's bottom
//   edge lies 64px under the card wherever the words set the row (the bottom
//   container's 24px + `@3xl:py-10`'s 40px — 1280, the Notebook story),
//   more wherever the picture does (82.5px at 1920). The one neighbour INSIDE
//   the glow is a FILLED slot, 24px under the card across the bottom
//   container's `gap-6` — the WithActions story; the page passes none.
//   STACKED: the picture above crosses the grid's `gap-8` = 32px and a filled
//   slot below would cross the same 32px (both clear); the gutter beside the
//   card is ui/Container's `clamp(1rem, 10vw, 12.5rem)`, 32px at 320 (clears
//   the 24px). But on the page the card is the band's LAST item, standing on
//   the band's bottom padding, with the next band — sections/TintedBand,
//   whose `relative` outer paints over an earlier sibling's shadow — right
//   under it: `@lg:py-8` = 32px on a tablet (clears — the last glow pixel
//   before the edge is 1/255 off the ground), and on the phone the floor is
//   `pb-8` = 32px too, for exactly this reason (DoctorIntro.tsx's D61 rider
//   on D43a; the top keeps its 24px). The band's first cut was `py-6`, and
//   at 320 and 390 the next band cut the glow's tail at 24px — a ~5/255 step
//   from the last glow pixel to the ground; with `pb-8` the tail ends on the
//   same 1/255 as the tablet's (re-measured at 320 and 390).
//
// ── D12 · THE CARD IS A NAMED REGION, the ScheduleCard idiom exactly:
// `ui/Card asChild` puts the surface, the inset and the `@container` context
// ON the <section> this file chose, so nothing sits between the words column
// and the element being named. `aria-labelledby` → the heading's id is what
// turns a bare <section> into a `region` — „Filozofia mea" — which is how a
// screen-reader user reaches the doctor's own words from the landmarks list.
// The band that holds it stays GENERIC (DoctorIntro's THE BAND NAMES NOTHING,
// ITSELF INCLUDED): its only heading is the page's <h1>, while this card's
// heading is its own.
// NO `tabIndex={-1}`: nobody's jump target (the ScheduleCard reasoning).
//
// ── THE HEADING IS AN <h2>, THROUGH sections/SectionHeading. The page's
// outline is h1 (the doctor's name, the band's pair) → h2 (this card) — the
// page's SECOND heading and one level down, no gap (§9). SectionHeading is
// the eyebrow + title pair every content section on the site opens with, so
// composing it (§4: a section may compose another section's public
// component) keeps the pair one spelling: mono eyebrow, SectionHeading's own
// title step (whichever ui/Heading step that component wears — D47 moved it to
// `page`, D48 on to the container-responsive `band`, and the card follows
// without an edit here), 8px apart. Its `id` lands on the <h2> and never on
// its root — SectionHeading's own rule — so the region's name is the title
// ALONE and not the eyebrow and the title read together. The id comes from
// React's useId(), which is server-safe and hydration-stable.
//
// ── THE QUOTE: a <blockquote> holding ONE <p>, dressed utility by utility.
//   <blockquote>     the doctor's OWN words — the marks say so to sighted
//                    readers and the element says so to assistive tech (ARIA
//                    role `blockquote`), PersonnelCard D8's reason.
//   <p>              the prose itself, and the element the marks ride. The
//                    generated content goes ON THE PARAGRAPH — ReviewCard's
//                    recipe — because that is the inline formatting context
//                    the words live in: on the <blockquote> the ::before
//                    would become an anonymous block of its own ABOVE the
//                    paragraph, a lone mark on a line of its own. On the <p>
//                    the opening mark sits on the first line, the closing mark
//                    on the last, and ui/Keyword's <b>s sit INSIDE the pair.
//   text-xl          20px on a 28px line — ONE STEP ABOVE the doctor card's
//                    quote, on the owner's word (2026-09-26, round 2j: "put a
//                    bigger card for filozofia mea" — D43b in round 2's
//                    ledger). Built at `text-lg`, 18px = the §15.1 body base
//                    and PersonnelCard D8's size, so the same words printed at
//                    the same size on both surfaces; the doctor's own page now
//                    gives them the larger voice, and the doctor card keeps
//                    its 18px. (A plain <p> and not ui/Text either way: that
//                    atom's steps stop at 16px.) MEASURED in Chromium on the
//                    built page (the clinic's first doctor, Romanian): four
//                    lines at 1280 and three at 1536 and 1920 — the card 462
//                    / 576 / 576px wide and 238 / 214 / 214px tall — since
//                    DoctorIntro's D63 widened its track to 36rem (the
//                    owner's "like 30% wider", 2026-10-01). Under D51b's
//                    28rem column it was five lines, 266px tall and 448px
//                    wide at all three (the demo doctor's words); under
//                    D43b's ⅔ track three, three, two lines, 214 / 214 /
//                    186px tall and 641 / 777 / 982px wide; 577 / 700 / 884
//                    before that.
//   text-ink-faint   THE DOCTOR QUOTES' OWN INK — D58 (round 2o, 2026-09-26,
//                    the owner: "what if you make the faint text lighter").
//                    Built in PersonnelCard D8's "relatively washed or ghost"
//                    ink, `ink-muted` #5b554f at 7.35:1; the washed look now
//                    has a semantic role of its own, `--ink-faint` #766f69
//                    (globals.css), and the two doctor quotes — the roster
//                    card's and this one — SHARE it, so the same words still
//                    wear the same ink on both surfaces. Everything else on
//                    the site keeps `ink-muted`. 4.94:1 on the framed card's
//                    white ground (4.70:1 on --page), AA for body text (§9);
//                    the role is NOT for sections/TintedBand's 30 % lilac,
//                    where it reads 3.24:1 — this card sits in the opener, on
//                    the page ground, never on the band. The key words step
//                    UP to `accent-strong` (ui/Keyword), 1.89:1 off the quote
//                    where they stood 1.27:1 off the muted ink.
//   before/after     content-[open-quote] / content-[close-quote]: the marks
//                    come from `quotes: auto` against the INHERITED lang —
//                    „…” for ro, „…“ for de, «…» for fr — zero strings, zero
//                    per-locale code (ReviewCard's D6, PersonnelCard D8). A
//                    `body` carrying its own marks would print them INSIDE the
//                    generated pair; the data holds the sentence, the
//                    stylesheet the punctuation.
//   hyphens          INHERITED — the body's site-wide `hyphens: auto`
//                    (§15.14) is written for PROSE, and this is prose. Only the
//                    titles above opt out (SectionHeading's h2 wraps between
//                    words; a person's name is DoctorIntro's h1).
//   text-justify     THE OWNER'S WORD, 2026-09-25, on the round-2 pack: "these
//                    texts do not feel like justify" — so the credo is justified
//                    exactly like the doctor card's quote it repeats. Built
//                    START-aligned first (D12 as written: §15.1's justify
//                    exception was scoped to the doctor card's ONE element and
//                    was not extended silently), then flipped the same day on
//                    that sentence — the lever D12 had recorded: one utility on
//                    THIS <p> (§15.15 b, per element), and §15.1 now names this
//                    paragraph as its third per-element exception. The
//                    site-wide `hyphens: auto` is what keeps rivers out of the
//                    justified lines, as on the card. Scope: this <p> alone.
//
// ── DUMB, LIKE THE BAND (run D1). Props in, HTML out: every string that
// arrives is FINISHED — translated, one language — and `body` arrives already
// RENDERED: the page hands over ui/Keyword's <Keywords> built from lib/team's
// `philosophy` (round 2's D17), so this file imports neither ui/Keyword nor
// lib/team. No t(), no message key, no `Locale`, no lib import of any kind.
//
// ── ZERO ISLANDS (§16). No 'use client', no state, no ref and no handler;
// useId is the only hook and it is server-safe, so the card compiles into the
// doctor page's static HTML and ships zero bytes of JavaScript.
// CredoCard.test.tsx pins the directive's absence and the whole import surface
// from the source text, because no runtime assertion can see either.
//
// ── THE CARD OWNS NO WIDTH AND NO OUTER MARGIN (§6.4). It fills whatever
// the band places it in — beside the picture a grid item of the band's bottom
// container, whose ONE explicit track is `minmax(0,36rem)` (DoctorIntro.tsx's
// D62 and D63), in the stack a grid item of the one-column grid (D51c); both
// stretch (ui/Card D3), and there is no flex ROW here, so none of the atom's
// collapse cases applies — and the band owns the space above it (the bottom
// container's 1.5rem beside the picture, `gap-8` in the stack). Its OWN
// intrinsic width is nothing at all: ui/Card's `@container` contains its
// inline size, which is exactly why the band hands it an explicit TRACK, sized
// from the room the words leave and never from the card's content — the
// choice D51b's definite 28rem column made before it. A caller's className is
// placement only, merged caller-last by ui/slot.ts.
//
// ── D43b · "A BIGGER CARD" GROWS BY ITS WIDTH AND ITS TYPE, NOT BY ITS INSET.
// The owner's ask (2026-09-26) is answered in three places, none of them an
// atom's insides: the band handed the words column ⅔ of the row instead of ⅗
// (DoctorIntro.tsx's grid — a width D51b took back the same day for a
// narrower, TALLER card: the owner's next word), the quote steps up to
// `text-xl` (the row above), and the title grew by itself with
// SectionHeading's own step (D47's `page`, builder A1's lane) — until D48's
// container-responsive `band` and D51b's 28rem column put it back at 30px
// beside the picture: the step answers to ui/Card's own `@container`, whose
// content box was 398px there, so it read 36px only stacked full-width on a
// tablet (recorded, not changed: owner decision 1 of G2 tier 1,
// fold-tier1.md) — until DoctorIntro's D63 track (36rem, the owner's "like
// 30% wider", 2026-10-01) took it back to 36px beside the picture wherever the
// card is ~498px or wider: MEASURED on the built page, 30px at 1024 and 1280
// (363 / 462px cards) and 36px from 1366 up (506 / 545 / 576px) — the "wider
// words column" road of that open call. The card's INNER ROOM — `framed`'s 3px + 22px per side —
// does NOT move, because ui/Card offers no padding axis: its header rejects
// per-side padding outright (D5) and names the one way in, a `density` axis
// of its own that joins when a SECOND proven card kind measures a different
// inset. And className cannot stand in for it: on a `framed` card the atom's
// arbitrary `p-[calc(var(--spacing)*6_-_2px)]` (22px at the default step;
// spelled in steps since §15.25 round 2) is emitted after the whole named
// scale, so no caller `p-*` wins in either direction (ui/Card's WHY
// className CANNOT BE THE PADDING paragraph) — which §6.8 forbids anyway. A
// roomier inset is therefore an ATOM decision, reported to the planner, not
// spelled here.

/**
 * The credo card's words — finished text (§8.1); `body` carries ui/Keyword's
 * fragments (run D1). Named for the band prop it travels as
 * (`DoctorIntro`'s `credo`, D12) and re-exported by DoctorIntro.tsx as the
 * band's public name for the shape: the doctor page builds the `credo`
 * literal inline and checks it against that re-export with `satisfies
 * DoctorIntroCredo` (the page and its Pages/Doctor story twin both), while
 * the populator hands over only the quote node that becomes `body`. It is
 * DECLARED here because this card reads it and may import nothing from its
 * band (the import-surface pin).
 */
export type DoctorIntroCredo = Readonly<{
  /** The mono micro-label above the title — authored in sentence case. */
  eyebrow: string;
  /** The card's title — becomes the real <h2> and the region's name. */
  title: string;
  /**
   * The doctor's own words, already rendered: ui/Keyword's <Keywords> over
   * lib/team's segments, or any ReactNode of finished text. NO quotation
   * marks inside — they are CSS, in the document's language.
   */
  body: ReactNode;
}>;

export type CredoCardProps = DoctorIntroCredo &
  // The native <section> surface minus what this component owns (§6.8
  // fidelity, the ScheduleCard Omit idiom). `children` goes because content
  // arrives as `body` — without the Omit a caller could nest something,
  // type-check, and watch it vanish. `title` leaves the native side with the
  // own keys: here it means the heading's text, not HTML's tooltip. The two
  // ARIA naming attributes go because the region's name is its heading's text
  // ALONE: a caller's `aria-labelledby` would land after the component's own
  // and silently replace the pair, while an `aria-label` would silently win
  // over it — both better refused by the types than resolved by attribute
  // order. React 19 carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorIntroCredo | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function CredoCard({
  eyebrow,
  title,
  body,
  className,
  ...rest
}: CredoCardProps): ReactElement {
  const headingId = useId();

  return (
    <Card tone="framed" aura asChild>
      {/* The <section> IS the card (Card D2 / ui/slot.ts): the surface, the
          inset, the glow (`aura`, D61) and the @container context land on
          the element that is also the named region. `{...rest}` rides FIRST
          so a caller's stray attribute can never replace the name pair;
          className is merged caller-last by the slot engine (§6.8 —
          placement only). */}
      <section {...rest} aria-labelledby={headingId} className={className}>
        <SectionHeading
          level={2}
          id={headingId}
          eyebrow={eyebrow}
          title={title}
        />
        <blockquote>
          {/* The marks ride the PARAGRAPH (see the header's THE QUOTE): they
              open on the first line and close on the last, around the key
              words. JUSTIFIED like the doctor card's quote — the owner's word,
              2026-09-25 (the header's text-justify row; §15.1's third exception). */}
          <p className="text-xl text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]">
            {body}
          </p>
        </blockquote>
      </section>
    </Card>
  );
}
