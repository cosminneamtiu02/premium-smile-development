import type { ReactElement } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
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
            than clipping; `flex-1` on the description then keeps the three
            price rows on one baseline however unevenly the text falls, which is
            the card-grid equivalent of §8.4's min-height rule. The step
            measures the GUTTER BOX, so with the 10vw clamp the flip lands
            around a ~960px canvas. */}
        <ul role="list" className="grid gap-6 @3xl:grid-cols-3">
          {SERVICE_TIERS.map((tier) => (
            <li
              key={tier.key}
              className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-6"
            >
              {/* asChild hands ui/Heading a REAL <h3>: the size step and the
                  document outline are independent decisions (the atom answers
                  "how big", never "which element"), and h3 is the right rung
                  under this band's h2 (§9 logical heading order). */}
              <Heading size="title" asChild>
                <h3>{tServices(`tiers.${tier.key}.name`)}</h3>
              </Heading>

              {/* flex-1 pushes the price to the bottom of every card — the
                  PARENT owning layout (§6.8), not a restyle of the atom. */}
              <Text tone="muted" className="flex-1">
                {tServices(`tiers.${tier.key}.description`)}
              </Text>

              <Text bold>
                {tServices('priceFrom', {
                  price: format.number(tier.priceRon, {
                    style: 'currency',
                    currency: 'RON',
                    maximumFractionDigits: 0,
                  }),
                })}
              </Text>
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
