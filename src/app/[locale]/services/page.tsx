import type { Metadata } from 'next';
import { useFormatter, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { CTABanner } from '@/components/sections/CTABanner/CTABanner';
import { ServiceCard } from '@/components/sections/ServiceCard/ServiceCard';
import { Container } from '@/components/ui/Container/Container';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { pageMetadata, serializeJsonLd, servicesJsonLd } from '@/lib/seo';
import { SERVICE_TIERS } from '@/lib/services';

// SERVICES — §14's second content row, discharged (PHASE-4 CONTENT RUN, stage
// S3): the intro, the priced list, the disclaimer, and the closing CTA band.
//
// THE INTERIM STUB IS GONE. This file used to render a bare <h1> reusing the
// nav label, so the shell's live nav had a resolvable target and CI's link
// check stayed green (PR #69); its own header named this page as its
// retirement. Retired wholesale — nothing of it survives, not even the class
// string, because the h1 now wears ui/Heading's `section` step like every other
// title in the repo.
//
// ── THE CONTENT IS SOURCED, NEVER INVENTED (D-S2-5/D-S3-1). The three tiers in
// lib/services.ts are the only priced services that exist as a requirement —
// they come from the old repo's pricing page, the single pricing source — and
// their amounts stay TODO(owner) until the owner confirms them. A price list is
// exactly where invention is unshippable: CMSR's 2025 rules bar dental
// advertising that promises results, and a quoted price the clinic never agreed
// to is worse than a short list. TODO(owner): the full price list, whenever the
// clinic supplies one — it lands as rows in lib/services.ts plus five message
// files, and this page grows with it without an edit.
// §14 also lists an optional FAQ band here: it is VOID, permanently, by owner
// decision (§15.15 — "FAQ is out of scope forever", 2026-09-02), so its absence
// is a decision and not an omission.
//
// ── ONE BAND HOLDS THE OPENER AND THE LIST, deliberately. The page has ONE
// topic and one <h1>, so it gets ONE named region: a second <section> around
// the <ul> would add a landmark for screen-reader users to walk without adding
// a second subject, and its heading would have to be an h2 that says the same
// thing as the h1 above it. The CTA band that follows is a genuinely different
// subject (and its own component), which is why THAT one is a second region.
//
// ── WHY THE OPENER IS SPELLED HERE INSTEAD OF sections/SectionHeading. That
// shared opener's `level` union is deliberately 2 | 3 — "an <h1> belongs to the
// page, never to a repeated section opener" is its own header's wording — so a
// page-title pair is precisely the case it declines. The pair below is
// therefore the same shape written out (`flex flex-col gap-2`, the identical
// 8px column the shared opener uses), with the size step still coming from
// ui/Heading so the h1 and every h2 on the site are dressed by one table. If a
// SECOND page ever needs this pair, that is the evidence SectionHeading's level
// axis grows on (additively, default pinned) — not a copy in a third file.
//
// ── THE PRICE-LINE TWIN (§4's sharing table, N=2 row). The three lines that
// turn `tier.priceRon` into a sentence — Intl currency options through
// next-intl's `useFormatter`, then the ICU message `services.priceFrom` — are
// spelled here AND in sections/ServicesTeaser ("THE PRICE IS ASSEMBLED, NEVER
// STORED"). What must AGREE is the OPTION BAG; the amount is one datum
// (lib/services.ts) and the sentence one key, so neither can drift. To be
// precise about what the fence does and does not bar (G2 ts LOW, S3): only
// the FORMATTER CALL is framework-bound — the option bag itself is plain data
// and could legally live in lib/services.ts today. Keeping it spelled at both
// call sites at N=2 is the §4 sharing-table CHOICE (KEEP-IN-SYNC pair, one
// side test-pinned), not a fence necessity. TRIGGER, recorded so the next
// lane inherits a decision rather than a shrug: a THIRD shipped consumer of
// this bag promotes the constant in a lane of its own (§4's N≥3 row, the
// lib/cx.ts fb-307 precedent) — never as a drive-by.
//
// ── ISOMORPHIC, SYNC, ZERO ISLANDS. The default export calls useTranslations /
// useFormatter with no 'use client': they resolve against the request-scoped
// config while this Server Component is pre-rendered into complete static HTML
// (§16). NO setRequestLocale anywhere — the Home page was the first born
// without it (PR #82 bumped Next to 16.3.4, the §15.16 minor crossing that
// ships stable next/root-params, so next-intl resolves the locale itself); the
// export is sync because nothing here has anything to await. The only hydrated
// thing on the finished page is CTABanner's trigger.
//
// ── THE BAND RECIPE, consumed not restated (Container.tsx header law, §15.15
// a): full-bleed semantic outer owns paint and `py` rhythm, ui/Container owns
// width and the container-query context, named container steps only, calibrated
// against German. No gutter and no inter-band margin in this file — the bands
// sit flush and their grounds meet edge to edge, exactly as on Home.

type Props = { params: Promise<{ locale: string }> };

/**
 * The §10.3/§10.4 head block: per-locale title + description authored in the
 * message files, plus the self-referencing canonical, the hreflang cluster and
 * the Open Graph tags that lib/seo's pageMetadata builds from one path.
 *
 * getTranslations (server-only) rather than the isomorphic hook: this runs
 * outside React's render, during the build, so the {locale, namespace} form is
 * the only one that can work here.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });

  return pageMetadata({
    locale,
    path: '/services',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default function ServicesPage() {
  const t = useTranslations('services');
  const format = useFormatter();

  // ONE array, two audiences: the cards below and the JSON-LD at the bottom
  // read the same finished strings, so a crawler can never be told about a
  // service the page does not show (§10.1's consistency-by-construction, seen
  // from the content side). `key` is lib/services.ts's render identity AND the
  // message path segment, which is why a tier cannot exist without its five
  // translations.
  const services = SERVICE_TIERS.map((tier) => ({
    key: tier.key,
    name: t(`tiers.${tier.key}.name`),
    description: t(`tiers.${tier.key}.description`),
    // The from-price, assembled and never stored: the amount is data, the
    // currency is Intl.NumberFormat's job through next-intl's formatter (§8.3),
    // and the sentence is the ICU message. maximumFractionDigits: 0 because
    // every price here is a whole number of lei and "100,00 RON" reads as an
    // invoice, not a from-price. RON only — EUR display on the foreign locales
    // is a PARKED decision (§15.4).
    priceLabel: t('priceFrom', {
      price: format.number(tier.priceRon, {
        style: 'currency',
        currency: 'RON',
        maximumFractionDigits: 0,
      }),
    }),
  }));

  return (
    <>
      {/* Full-bleed band on the page's own ground — no paint of its own, so it
          meets the shell's <main> seamlessly. NO outer margin (§6.4). */}
      <section aria-labelledby="services-title" className="py-20">
        <Container className="flex flex-col gap-8">
          {/* THE OPENER (see the header for why it is not SectionHeading): the
              mono kicker over the page's one <h1>, 8px apart. `id` lands on the
              heading itself, closing the aria-labelledby pair above — the band
              is named by its title alone, not by eyebrow + title read
              together. asChild hands ui/Heading a REAL <h1>: the size step and
              the document outline stay independent decisions. */}
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('intro.eyebrow')}</Eyebrow>
            <Heading size="section" asChild>
              <h1 id="services-title">{t('title')}</h1>
            </Heading>
          </div>

          {/* Measure on the element, tone from the atom's axis (§6.8: the
              caller's className positions and spaces, never restyles). */}
          <Text tone="muted" className="max-w-2xl">
            {t('intro.text')}
          </Text>

          {/* A LIST, because it is one: screen readers announce "list, 3 items"
              and offer item-by-item navigation. `role="list"` is redundant in
              the spec and load-bearing in WebKit — Safari drops list semantics
              from any list styled `list-style: none`, which Tailwind's
              preflight sets on every <ul> (ui/SpeedDial's stem; the jsx-a11y
              config carries the matching exception).
              ONE NAMED STEP, the teaser's: a single column until @3xl (48rem),
              three tracks after it, calibrated on German (§8.4) where
              "Professionelle Zahnreinigung" must wrap inside a ~15rem track
              rather than push it open. The step measures the GUTTER BOX, so
              with the 10vw clamp the flip lands around a ~960px canvas. */}
          <ul role="list" className="grid gap-6 @3xl:grid-cols-3">
            {services.map((service) => (
              // The <li> is the grid cell; every card class lives on the card.
              // h-full is PLACEMENT (§6.8): the cell is stretched to the row by
              // the grid, and this passes that height on, so three
              // unevenly-filled cards end their price rows on one baseline.
              <li key={service.key}>
                {/* level={2}: this band has ONE heading above the list — the
                    page's h1 — so the cards are its direct subsections and an
                    h3 would skip a rung (§9's logical heading order; axe's
                    heading-order rule fails the page story on exactly that).
                    Home's teaser opens with an h2, so its cards keep the
                    default 3. Same component, two outlines, one look. */}
                <ServiceCard
                  className="h-full"
                  level={2}
                  name={service.name}
                  description={service.description}
                  priceLabel={service.priceLabel}
                />
              </li>
            ))}
          </ul>

          {/* The honest half of a price list, and the reason the amounts above
              may be from-prices at all: what changes the number, and what to do
              about it. Muted because it is a footnote to the list, not a fourth
              service; the measure rides the element, like every other paragraph
              (§15.15 b — prose measure is per-element, never the gutter's). */}
          <Text tone="muted" className="max-w-2xl">
            {t('disclaimer')}
          </Text>
        </Container>
      </section>

      {/* §14 lists this band on Home AND here — ONE component rendered verbatim
          by both pages, which is why its keys live under `common` (D-S2-8). */}
      <CTABanner />

      {/* §10.2's optional `Service` markup, from the SAME `services` array the
          cards above render — three ListItems whose provider is the clinic the
          shell's Dentist node already declares. A <script> renders no box and
          takes no focus (the shell's own JSON-LD mount, layout.tsx "THE §10.2
          DENTIST JSON-LD"), so its position in the markup changes nothing on
          screen; it sits last because it describes everything above it.
          serializeJsonLd escapes `<`, so no value can end the element early.
          NO PRICES in here on purpose — lib/seo.ts's servicesJsonLd says why. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(servicesJsonLd(services)),
        }}
      />
    </>
  );
}
