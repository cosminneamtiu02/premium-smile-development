import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx';

// sections/ServiceCard — ONE priced service, as a card: its name, what it
// covers, and (when there is one) the from-price. Built to the approved
// composition contract
// .claude/section-runs/2026-09-06_12-40_services-page/sections/ServiceCard.md
// (PHASE-4 CONTENT RUN, stage S3). Two consumers, both in this repo today:
//   · app/[locale]/services/page.tsx — the §14 list, ×3 tiers;
//   · sections/ServicesTeaser — Home's middle band, the same three cards.
//
// ── IT EXISTS BECAUSE THE SECOND CONSUMER ARRIVED (§4's sharing table, row 1:
// "identical MECHANICS, second consumer arrives → extract to the nearest tier
// both may import"). The markup below was born hours earlier as the teaser's
// inline <li> body (stage S2); the Services page is consumer number two, so
// the shape is extracted HERE and the teaser is REWIRED to it in the same lane
// — the lib/cx promotion's precedent (#64: a promotion rewires its consumers
// in its own change-set, it never leaves a copy behind to drift). The rewire
// is accepted on ZERO visual diff, which is why the class string below is
// byte-identical to the one the teaser's <li> used to carry: an extra utility
// here is a defect, not polish.
//
// ── TIER: SECTION, PROPS-IN — the Wordmark/SectionHeading kind. It composes
// two atoms (ui/Heading, ui/Text), which by /classify-component rule 3 makes it
// a composition and by §4's dependency direction bars ui/ from importing it
// back. And it owns NO message key: both strings and the price arrive FINISHED
// and already translated (§8.1), because only the CONSUMER knows whether its
// copy lives under `services` or somewhere else, and whether the price came
// from Intl.NumberFormat over lib/services.ts or from anywhere at all. There is
// no t() in this file, no useTranslations, no 'use client' — it compiles into
// the static HTML of both pages and ships zero bytes of JavaScript (§16).
//
// ── THE PRICE ROW IS ABSENT, NEVER FAKE. `priceLabel` is optional and an
// omitted price renders no row at all: not a dash, not "on request", not an
// empty <p> for a screen reader to stop on. The three tiers the site quotes
// today all carry a from-price (lib/services.ts, amounts TODO(owner) until
// confirmed — D-S3-1), and the first service without one must be able to appear
// beside them without inventing a number. CMSR's 2025 advertising rules make
// that a compliance matter, not a taste one.
//
// ── THE `level` AXIS, AND WHY IT SHIPPED ON DAY ONE. The dossier planned none
// ("both consumers sit under a band h2, so h3 is correct in each") and named the
// trigger that would add one; the trigger fired inside this same lane, so the
// axis is here rather than deferred to a lane that would have to touch the same
// two files again. The evidence, not a hunch: the Services page is ONE band with
// ONE h1 and no h2 above its list, so an h3 there SKIPS a rung — and axe's
// heading-order rule failed the page story on exactly that (h1 → h3), which is
// §9's logical heading order stated by a machine. So:
//   · Home's teaser opens with an h2 and its cards stay h3 — the default;
//   · the Services page's cards sit directly under its h1 and pass level={2}.
// Same component, two outlines, one look: `asChild` hands ui/Heading a REAL
// heading element, so the atom answers "how big is this title" and never "which
// element is it" — h2 and h3 here are dressed byte-identically, which is also
// why the axis costs zero pixels. The union is 2 | 3 and no wider: an <h1>
// belongs to the page (sections/SectionHeading's own reasoning), and 4–6 has no
// consumer. Growing it means naming the new element in the ELEMENT Record below
// — a compile gate, never an `h${level}` template.
//
// ── THE ROOT IS AN <article>, and the LIST stays the consumer's. A card is a
// self-contained composition — name, description, price — so <article> is the
// element that says so; but nothing here assumes it is inside a list, which is
// exactly what lets the page and the teaser each wrap it in their own <ul>/<li>
// (both do; the `role="list"` WebKit note lives with them). It adds no landmark
// and takes no focus.
//
// ── NO CONTAINER QUERY, NO MEDIA QUERY (§6.5). The card is one column at every
// width and reflows only by wrapping its text; the GRID that decides whether
// three of them sit side by side is the consumer's, measured against German
// there. `flex-1` on the description is the one layout opinion it does hold:
// it pushes the price to the bottom edge, so a row of unevenly-filled cards
// still ends its price lines on one baseline (§8.4's min-height rule, applied
// to a card).
//
// ── NO OUTER MARGIN AND NO HEIGHT OF ITS OWN (§6.4). Both consumers stretch
// the card to its grid row with `h-full` passed through className — placement,
// which §6.8 licenses the parent to do; restyling the card's internals through
// className is what it does not.
// MERGE ORDER: this component's classes first, the caller's className LAST. A
// deterministic convention the tests pin — NOT a cascade mechanism: attribute
// order never decides CSS specificity.

/** Real heading levels a card may render (§9: logical heading order). */
export type ServiceCardLevel = 2 | 3;

type ServiceCardOwnProps = {
  /** The service's name, finished and already translated (§8.1) — rendered as
   * the card's heading. */
  name: string;
  /** What the service covers, finished and already translated (§8.1). */
  description: string;
  /**
   * The from-price as ONE finished string — the consumer runs
   * Intl.NumberFormat over the amount and the ICU sentence over the result
   * (§8.2/§8.3: never assembled from fragments here). Omitted ⇒ no price row
   * at all, which is the honest state for a service without a confirmed price.
   */
  priceLabel?: string;
  /**
   * Which REAL heading element the name becomes — the document outline, kept
   * independent of the look (the size step is always `title`). Default 3, the
   * rung under a band that opened with its own h2 (Home's teaser); a page
   * whose list sits directly under its h1 passes 2 (the Services page).
   */
  level?: ServiceCardLevel;
};

export type ServiceCardProps = ServiceCardOwnProps &
  // `children` leaves with the own props: the content arrives as `name` /
  // `description` / `priceLabel`, and without the Omit a caller could nest
  // something, type-check, and watch it vanish (JSX children always beat
  // spread ones) — the SectionHeading precedent, same reasoning.
  Omit<
    ComponentPropsWithRef<'article'>,
    keyof ServiceCardOwnProps | 'children'
  >;

// Record<> rather than a ternary or an `h${level}` template — the SectionHeading
// gate, for the same reason: widening ServiceCardLevel cannot compile until this
// table names the new level's element, where a ternary would map any widened
// value to h3 silently and a template turns a typed level into an unvalidatable
// string (which is how h1 and h4–h6 quietly come back).
const ELEMENT: Record<ServiceCardLevel, 'h2' | 'h3'> = {
  2: 'h2',
  3: 'h3',
};

export function ServiceCard({
  name,
  description,
  priceLabel,
  level = 3,
  className,
  ...rest
}: ServiceCardProps): ReactElement {
  const HeadingElement = ELEMENT[level];

  return (
    <article
      className={cx(
        'flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-6',
        className,
      )}
      {...rest}
    >
      <Heading size="title" asChild>
        <HeadingElement>{name}</HeadingElement>
      </Heading>

      {/* flex-1 pushes the price row to the bottom of the card — the layout
          opinion this component does own (see the header); the tone axis is
          the atom's own, never a className restyle (§6.8). */}
      <Text tone="muted" className="flex-1">
        {description}
      </Text>

      {/* No price ⇒ no row. `&&` on a plain string is safe here because the
          empty string is barred by the parity gate (no message file may hold
          one) and a caller that has no price omits the prop entirely. */}
      {priceLabel && <Text bold>{priceLabel}</Text>}
    </article>
  );
}
