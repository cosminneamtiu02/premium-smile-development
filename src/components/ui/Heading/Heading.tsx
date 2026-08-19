import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { slotClone } from '../slot';

// ui/Heading — the display-type step, with the ELEMENT left entirely to the
// consumer (migrated per the approved contract board
// .claude/plans/heading-atom-contract-v2.plan.md, owner-approved 2026-08-19).
// It answers exactly one question — "how big is this title" — never "which
// element is it": the Footer renders its column titles as <p>, the Header
// wears the same look inline on its brand <Link>, and sections will pass real
// h1–h6. The old repo's ui/heading had the right instinct (level vs
// visualLevel as independent axes) but hardcoded `Tag = h${level}`, which
// makes the Footer's <p> titles impossible by construction.
//
// v1 ships ONE step, `title` — the look with real in-tree consumers today.
// Bigger steps ('section', 'page') join the union ADDITIVELY when
// SectionHeading and the page runs bring measured numbers (§6.6: never invent
// display sizes without a consumer), and the default stays 'title' forever, so
// union growth can never silently restyle a bare <Heading> (§6.6 again — a
// changed default is a break at every existing call site at once).
//
// ZERO-DIFF-REWIRE INVARIANT — `title` renders byte-exactly
// `font-display text-xl text-ink-strong`: the string the Footer holds in its
// columnTitleClasses constant and the Header spells inline on the brand
// anchor. The rewires that follow (their own lanes, not this one) are accepted
// on ZERO visual diff, so any extra utility is a defect, not polish — no
// leading-*, no tracking-*, no text-balance, and no margin ever (§6.4: the
// parent's gap/padding owns spacing; the Footer brand row's `pb-8 text-center`
// rides in through className, §6.8). text-xl is an owner decision, not a
// default: the nav labels beneath these titles are TextButtons at text-lg, and
// that one-step gap is what makes a title read as a title.
// No `sm:`/`lg:` self-scaling either — the old heading scaled itself per
// viewport; §6.5 leaves responsive judgement to the section/page, never to an
// atom that cannot see its container.
//
// Ink is fixed at ink-strong: all four real call sites are ink-strong and no
// second ink has a consumer. The one foreseeable exception — a hero title over
// the §15.1 scrim needing inverse ink — arrives as Heading's OWN additive
// ink/tone prop when that consumer exists, never as a caller className
// override (restyling an atom's internals is banned, §6.8).
//
// Server-safe and zero-JS: no 'use client', no hooks, no state — slotClone is
// render-time cloneElement, which is why TextButton asChild already runs
// inside the zero-island Footer. Keep it that way.
// §6.3's typed-required aria-label does not bind here: the atom is
// non-interactive and its children are finished text (§8.1). It owns no
// hover/focus/disabled styling for the same reason — an asChild <a>'s focus
// ring belongs to the globals' :focus-visible net, not to this atom.

export type HeadingSize = 'title';

type HeadingOwnProps = {
  /**
   * Step on the display scale. v1: 'title' — the Footer/Header title
   * treatment. The axis is named by ROLE, not magnitude, so a step landing
   * between two existing ones is an addition instead of a rename (§6.6).
   */
  size?: HeadingSize;
  /**
   * Render no element of Heading's own — the single child element you nest
   * (an <h2>, a next-intl <Link>) BECOMES the heading and wears these classes
   * on top of its own. This is how a real document outline slot, or the
   * Header's brand anchor, gets the look: the atom never picks a heading tag
   * itself, and it can therefore never fake structure.
   */
  asChild?: boolean;
  /** The finished, already-translated text (§8.1); markup is allowed. */
  children: ReactNode;
};

export type HeadingProps = HeadingOwnProps &
  Omit<ComponentPropsWithRef<'p'>, keyof HeadingOwnProps>;

const sizeClasses: Record<HeadingSize, string> = {
  title: 'font-display text-xl text-ink-strong',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export function Heading({
  size = 'title',
  asChild = false,
  className,
  children,
  ...rest
}: HeadingProps): ReactElement {
  const ownClasses = cx(sizeClasses[size], className);

  if (asChild) {
    // The child element becomes the heading. The engine lives in ui/slot.ts
    // (owner decision fb-64) — single-child guard first, child-wins merge,
    // className merged last. NO disallow set, unlike Button's
    // BUTTON_ONLY_PROPS: a <p> has no element-only props, so everything the
    // caller passes is equally meaningful on an <h2> or an <a> — including
    // `id`, which a section's aria-labelledby pairs with.
    return slotClone('Heading', children, ownClasses, rest);
  }

  // Default host <p>, chosen by the dominant real consumer rather than by
  // semantics theory: all three non-asChild sites are the Footer's titles,
  // which deliberately open no outline slot.
  return (
    <p className={ownClasses} {...rest}>
      {children}
    </p>
  );
}
