import type { ReactElement } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { ServiceCard } from '@/components/sections/ServiceCard/ServiceCard';
import { Container } from '@/components/ui/Container/Container';
import { Text } from '@/components/ui/Text/Text';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { localeHref } from '@/i18n/href';
import { SERVICE_TIERS } from '@/lib/services';

// sections/ServicesTeaser — Home's middle band: the three priced services with
// their from-prices, and one link on to the full Services page. Built to the
// approved composition contract
// .claude/section-runs/2026-09-06_12-25_home-page/sections/ServicesTeaser.md
// (PHASE-4 CONTENT RUN, stage S2). There is no old-repo counterpart — §14's
// content model is the requirement — but the CONTENT is sourced, not invented:
// the old pricing page's three tiers are the only priced services that exist as
// requirements (D-S2-5).
//
// ── THREE TIERS, BECAUSE THREE ARE SOURCED (D-S2-5/6). A teaser is a place
// where invented services look plausible and are unshippable: CMSR's 2025 rules
// bar dental advertising that promises results, and a service the clinic does
// not offer is worse than a short list. So the list is exactly lib/services.ts,
// and lib/services.ts is exactly what the old repo priced.
//
// ── THE PRICE IS ASSEMBLED, NEVER STORED (D-S2-6). The old message file shipped
// "De la 100 RON" as ONE string per locale — the amount, the currency and the
// word "from" welded together (§8.2's fragment ban seen from the other side).
// Here the amount is data (lib/services.ts), the currency is
// Intl.NumberFormat's job through next-intl's `useFormatter` (§8.3), and the
// sentence is the ICU message `services.priceFrom`. Romanian prints "100 RON",
// English "RON 100", and neither needed a hand-written string. RON only: EUR
// display on the foreign locales is a PARKED decision (§15.4).
// maximumFractionDigits: 0 because every price here is a whole number of lei
// and "100,00 RON" reads as an invoice, not a from-price.
// TWIN, since stage S3: app/[locale]/services/page.tsx assembles the line the
// same way from the same two sources (its header, "THE PRICE-LINE TWIN") —
// what must agree is the OPTION BAG, and a THIRD consumer promotes it in a lane
// of its own (§4's N≥3 row), never as a drive-by.
//
// ── ONE SOURCE OF SERVICE COPY, SHARED WITH THE SERVICES PAGE (D-S2-7). The
// tier names and descriptions are read from the `services` namespace, not
// copied into `home.*` — §10.1's consistency-by-construction argument applied
// to copy: the teaser and the page it teases cannot describe the same treatment
// differently, because there is only one string. The BAND's own copy (eyebrow,
// title, intro, the closing link) stays under `home`, since that text exists
// only on this page. Two namespaces in one section is therefore deliberate:
// each key lives where its OWNER is.
//
// ── ISOMORPHIC, ZERO CLIENT ISLANDS. It calls t() with NO 'use client' —
// useTranslations/useLocale/useFormatter resolve against the request-scoped
// config while this Server Component is pre-rendered into static HTML (§16) and
// read NextIntlClientProvider in Storybook and Vitest (the Footer precedent).
// Nothing in the band reacts to anything after paint: its only controls are
// plain anchors (§15.13), so it ships as inert HTML with no JavaScript
// attached.
//
// ── THE BAND RECIPE, consumed not restated: the full-bleed semantic outer owns
// paint and `py` rhythm, ui/Container owns width and the container-query
// context, named steps only, calibrated against German (Container.tsx header
// law, §15.15 a). The heading pair is sections/SectionHeading — composing
// another section's public component, which is the dossier model §4 allows
// (Header renders Wordmark), and it takes both strings FINISHED because it owns
// no message key of its own.
//
// ── THE CARD IS NO LONGER SPELLED HERE (stage S3). The <li> body used to be
// this file's own markup; the Services page needed the identical unit, which is
// §4's sharing table row 1 ("identical MECHANICS, second consumer arrives →
// extract to the nearest tier both may import"), so the shape moved to
// sections/ServiceCard and this band was REWIRED to it in the same lane — the
// #64 precedent that a promotion never leaves its first consumer holding a
// copy. Another section's public component, again the dossier model §4 allows.
// The swap is ZERO-DIFF by construction: ServiceCard's base class string is
// byte-identical to the one this <li> carried, the <li> keeps nothing but its
// grid-cell role, and `h-full` restores the equal-height stretch the flex <li>
// used to get for free (the card is a block child now, so it must be told to
// fill the row its grid cell was stretched to). ServiceCard.tsx's header
// carries the argument in full; the strings and the price are still computed
// HERE, because §8.1 keeps t() in the section tier.

export function ServicesTeaser(): ReactElement {
  const t = useTranslations('home');
  const tServices = useTranslations('services');
  const format = useFormatter();
  const locale = useLocale();

  return (
    // Full-bleed band on the page's own ground — no paint of its own, so the
    // Hero's wash above simply continues into it. NO outer margin (§6.4).
    <section aria-labelledby="services-teaser-title" className="py-20">
      <Container className="flex flex-col gap-8">
        {/* The opener owns the eyebrow/title pair and its 8px gap; THIS section
            owns the keys (§8.1 — SectionHeading never calls t()). `id` lands on
            the <h2> itself, closing the aria-labelledby pair above: the band is
            named by its title alone, not by eyebrow + title read together. */}
        <SectionHeading
          eyebrow={t('teaser.eyebrow')}
          title={t('teaser.title')}
          level={2}
          id="services-teaser-title"
        />

        {/* Measure on the element, tone from the atom's axis (§6.8: the
            caller's className positions and spaces, never restyles). */}
        <Text tone="muted" className="max-w-2xl">
          {t('teaser.intro')}
        </Text>

        {/* A LIST, because it is one: screen readers announce "list, 3 items"
            and offer item-by-item navigation. `role="list"` is redundant in the
            spec and load-bearing in WebKit — Safari drops list semantics from
            any list styled `list-style: none`, which Tailwind's preflight sets
            on every <ul> (ui/SpeedDial's stem, the same G2 finding; the
            jsx-a11y config carries the matching exception).
            ONE NAMED STEP: a single column until @3xl (48rem), three tracks
            after it. Calibrated on German, the longest language (§8.4): at that
            step each track is ~15rem, and the longest German name —
            "Professionelle Zahnreinigung" — wraps to two lines inside it rather
            than clipping; the card's own `flex-1` description (ServiceCard.tsx,
            "NO CONTAINER QUERY") then keeps the three price rows on one
            baseline however unevenly the text falls, which is the card-grid
            equivalent of §8.4's min-height rule. The step measures the GUTTER
            BOX, so with the 10vw clamp the flip lands around a ~960px
            canvas. */}
        <ul role="list" className="grid gap-6 @3xl:grid-cols-3">
          {SERVICE_TIERS.map((tier) => (
            // The <li> is now the GRID CELL and nothing else — every class it
            // used to carry moved to the card inside it, unchanged.
            <li key={tier.key}>
              {/* h-full through className is PLACEMENT, which §6.8 licenses the
                  parent to do: the cell is stretched to the row by the grid,
                  and this is what passes that height on to the card so three
                  unevenly-filled cards still end on one baseline (§8.4). */}
              <ServiceCard
                className="h-full"
                name={tServices(`tiers.${tier.key}.name`)}
                description={tServices(`tiers.${tier.key}.description`)}
                priceLabel={tServices('priceFrom', {
                  price: format.number(tier.priceRon, {
                    style: 'currency',
                    currency: 'RON',
                    maximumFractionDigits: 0,
                  }),
                })}
              />
            </li>
          ))}
        </ul>

        {/* The <div> exists so the quiet control hugs its own label instead of
            stretching across the column the flex parent gives it — the parent
            owning placement (§6.4). A plain anchor with a finished href
            (§15.13); no `active` marking, because a teaser is not a "you are
            here" indicator. */}
        <div>
          <TextButton asChild>
            <a href={localeHref(locale, '/services')}>{t('teaser.all')}</a>
          </TextButton>
        </div>
      </Container>
    </section>
  );
}
