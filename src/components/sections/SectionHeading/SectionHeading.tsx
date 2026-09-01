import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';

// sections/SectionHeading — the opener every content section starts with: the
// mono kicker over the display title, 8px apart, aligned start or centre.
// Built to the owner-approved composition contract (board fb-314, 2026-09-01).
// Six call sites in the old repo — clinic-location, doctor-showcase and its
// card, helping-staff-grid and its card, the home page's reviews block — which
// is the whole reason it exists ahead of any page that needs it: without it
// that pair is spelled six times, and a pair spelled six times can disagree
// six ways.
//
// ── TIER: SECTION, decided on the IMPORT GRAPH and not on size. It has five
// props, no state, no message key and it would sit happily in ui/ by feel —
// but rule 3 of /classify-component looks at what a thing COMPOSES, and this
// composes two atoms (ui/Eyebrow, ui/Heading), so it is a composition and §4's
// dependency direction then forbids ui/ from importing it back. Wordmark
// already named the trap after this component: heavy reuse ("the SectionHeading
// paradox") schedules a composite EARLY in the build order, it never promotes
// it to ui/.
//
// ── PROPS IN, NOTHING ELSE — the Wordmark precedent (§8.1). Both strings
// arrive FINISHED and already translated; this file calls no t(), owns no
// message key and adds none. The CONSUMING section keeps the keys, because
// only it knows whether its title lives under `services` or `team` — a shared
// opener that reached for a namespace would have to invent one that fits
// nobody. No 'use client', no hooks, no handlers either: this compiles into
// the static HTML of every page that uses it and ships zero bytes of
// JavaScript (§16). The tests prove all of that from the source text, because
// no runtime assertion can see a directive.
//
// ── D3 · THE STACK IS GONE (owner, 2026-09-01). The old component wrapped the
// pair in `ui/Stack direction="column" gap="sm" align={…}`, an atom this repo
// deliberately does not migrate (MIGRATION_INVENTORY, drop-flagged: §6.4 says
// parents own spacing, and a component whose entire body is three flex
// utilities is a rename of CSS, not an abstraction). So the layout is those
// utilities, written here, on the root: `flex flex-col gap-2`. **gap-2 IS the
// old gap="sm"** — the Stack's own table mapped that name to this exact
// utility (0.5rem/8px on Tailwind's untouched scale, measured back at 8px in
// the story's play), so the eyebrow sits where it always sat rather than where
// a fresh guess would put it. The inventory reserved that flag's final verdict
// for consumer runs like this one; D3 is it.
//
// ── THE SIZE STEP CAME FIRST, and from here: ui/Heading grew its second step
// (`size="section"` → `font-display text-3xl text-ink-strong`) with THIS
// component as its measured consumer (epic #54, D2). The division of labour is
// the atom's own rule — Heading answers "how big is this title", never "which
// element is it", so `asChild` lets this section hand it a REAL <h2>/<h3>. The
// heading in the document outline and the look on the screen are therefore two
// independent decisions, which is exactly what the old repo needed `visualLevel`
// for and no longer does.
//
// ── THE `id` LANDS ON THE HEADING, NEVER ON THE ROOT. Every old call site that
// passes one pairs it with `aria-labelledby` on the wrapping <section>, and
// that only works if the id is on the element carrying the heading's TEXT: an
// id on this wrapper would name the section with the eyebrow and the title read
// together ("NE GĂSEȘTI Vizitează clinica noastră"). It rides a conditional
// spread (`{...(id ? { id } : {})}`) so no empty attribute ships when nobody
// asked for one, and it goes on the CHILD of Heading rather than through
// Heading's props — ui/slot.ts merges child-wins, so both routes land in the
// same place, and the direct one keeps the element's own attributes on the
// element in the source.
//
// ── V1 CUTS FIVE AXES the old component carried (fb-300's YAGNI precedent —
// an unused prop is public API that costs review, tests and compatibility
// forever). The counts are the old repo's, not a hunch:
//   · `trailing` (a slot for an "all services" button) — 0 call sites;
//   · `align="end"` — 0 call sites;
//   · `level` 1 and 4–6 — 0 call sites; every one of the six is 2 or 3, and an
//     <h1> belongs to the page, never to a repeated section opener;
//   · `mdAlign` (centre on mobile, start at md) — 1 call site, doctor-card. It
//     also shipped `md:items-start` from a shared component, which is the §6.5
//     smell: media queries are the page's judgement, not a fragment's;
//   · `visualLevel` — 1 call site, doctor-card (level 3 that reads like a
//     section title). RETIRED rather than deferred: `asChild` already decouples
//     the element from the look, so `<Heading size="section" asChild><h3>` IS
//     that call site — which is precisely what this component renders for
//     `level={3}`. The axis has nothing left to do.
// The first four join ADDITIVELY when a real design measures them, defaults
// pinned (§6.6), breaking nobody.
//
// ── NO ui/cx HERE, and that is a boundary rather than a preference: cx.ts says
// in its own header that it is ui-layer plumbing importable by `ui/` modules
// ONLY — never by sections/, never by app/ (§4). The section tier joins its own
// classes, the LanguageSwitcher precedent
// (`['inline-flex', className].filter(Boolean).join(' ')`).
// MERGE ORDER: this component's classes first, the caller's className LAST. A
// deterministic convention the tests pin — NOT a cascade mechanism: attribute
// order never decides CSS specificity, and §6.8 limits caller utilities to
// positioning/spacing, so a real conflict has no way to arise.
//
// ── IT OWNS NO MARGIN AND NO WIDTH (§6.4/§6.8). Five old call sites passed
// `mb-12 sm:mb-16` through className and that stays the parent's business; the
// old root's own `w-full` is gone too, because a block-level flex column is
// already as wide as the box it is given, and the one arrangement where the
// class mattered — a flex-row parent — is the parent's to write.
//
// ── KNOWN LIMIT, recorded rather than patched: `align="center"` with an
// eyebrow long enough to WRAP. globals.css sets `p, li, blockquote {
// text-align: start }` in the base layer (§15.1 — long prose aligns logically),
// and a declaration that matches the element itself always beats a value
// inherited from an ancestor, in any layer. So `text-center` on this root
// reaches the <h2> (which no base rule names) but not the eyebrow's <p>. On one
// line it is invisible — `items-center` centres the BOX and the box hugs its
// text — and every centred eyebrow in the repo today is one line. A wrapping
// one would centre its box and start-align its lines. The fix is a decision
// (narrow the base rule, or give ui/Eyebrow its own alignment axis), so it goes
// back to the board instead of being improvised here.
//
// ── The root is a plain <div>. <hgroup> technically fits this exact shape (one
// heading plus <p> taglines) but maps to a generic in every screen reader, so
// it would buy structure nobody can hear; the landmark belongs to the <section>
// that consumes this, which is also where `aria-labelledby` points at the id
// above.

/** Real heading levels this opener may render (§9: logical heading order). */
export type SectionHeadingLevel = 2 | 3;

/** Where the block sits and how its lines read. */
export type SectionHeadingAlign = 'start' | 'center';

type SectionHeadingOwnProps = {
  /**
   * The mono micro-label above the title, finished and already translated
   * (§8.1). Omitted → no eyebrow row at all, rather than an empty <p>: a blank
   * paragraph is a stray stop for a screen reader and a phantom child for the
   * flex gap.
   */
  eyebrow?: string;
  /** The section title, finished and already translated (§8.1). */
  title: string;
  /**
   * Which REAL heading element the title becomes — the document outline, kept
   * independent of the size step (which is always `section`). Default 2: a
   * page's one <h1> is the page's, and 3 is the shape a card uses inside a
   * section that already opened with an <h2>.
   */
  level?: SectionHeadingLevel;
  /**
   * How the block sits in the box the parent gives it — the flex cross axis
   * and the text alignment together, on the root. Default 'start'. (Centring
   * a WRAPPING eyebrow has a documented limit; see the header.)
   */
  align?: SectionHeadingAlign;
  /**
   * Set on the HEADING element, never on the root — the half of the
   * `aria-labelledby` pair a wrapping <section> points at.
   */
  id?: string;
};

export type SectionHeadingProps = SectionHeadingOwnProps &
  // `children` is Omitted along with the own props: content arrives as
  // `eyebrow`/`title`, and without the Omit a caller could nest something,
  // type-check, and watch it vanish (JSX children always beat spread ones) —
  // the exact shape someone reaches for now that v1 cut the `trailing` slot.
  // `title` and `id` leave with them too: both are native div attributes whose
  // meaning here is this component's, not HTML's.
  Omit<ComponentPropsWithRef<'div'>, keyof SectionHeadingOwnProps | 'children'>;

// Record<> rather than a lookup object, so widening the union above cannot
// compile until this table names the new value (the ui/Heading growth gate).
const ALIGN: Record<SectionHeadingAlign, string> = {
  // text-start, not text-left: the repo leans logical properties (§3) and the
  // globals base rule is text-align: start — all five locales are LTR so the
  // rendering is identical, but the class matches the house direction
  // (G2 LOW, 2026-09-01). text-center is direction-neutral.
  start: 'items-start text-start',
  center: 'items-center text-center',
};

const ELEMENT: Record<SectionHeadingLevel, 'h2' | 'h3'> = {
  2: 'h2',
  3: 'h3',
};

export function SectionHeading({
  eyebrow,
  title,
  level = 2,
  align = 'start',
  id,
  className,
  ...rest
}: SectionHeadingProps): ReactElement {
  // A closed two-member union resolved through a Record — never `h${level}`,
  // the old repo's heading atom's move, which turns a typed level into an
  // unvalidatable string and is how h1 and h4–h6 quietly come back. The
  // Record (not a ternary) is the same widening gate ALIGN celebrates above:
  // growing SectionHeadingLevel cannot compile until this table names the
  // new level's element (G2 MEDIUM, 2026-09-01 — a ternary mapped any
  // widened value to h2 silently).
  const HeadingElement = ELEMENT[level];

  return (
    <div
      className={['flex flex-col gap-2', ALIGN[align], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading size="section" asChild>
        <HeadingElement {...(id ? { id } : {})}>{title}</HeadingElement>
      </Heading>
    </div>
  );
}
