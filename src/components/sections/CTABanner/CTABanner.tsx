import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Container } from '@/components/ui/Container/Container';
import { Text } from '@/components/ui/Text/Text';

// sections/CTABanner — the closing conversion band: one question, one line, one
// action → the ContactModal, which is the site's single conversion goal (§1: a
// visitor calls the clinic). Built to the approved composition contract
// .claude/section-runs/2026-09-06_12-25_home-page/sections/CTABanner.md
// (PHASE-4 CONTENT RUN, stage S2). No old-repo counterpart — §14's content
// model is the requirement; the old floating book-CTA's duties already live in
// sections/FloatingActions.
//
// ── THE KEYS LIVE UNDER `common`, NOT `home` (D-S2-8). §14 lists this band on
// Home AND on Services, so it is one component rendered verbatim by two pages —
// and a band that reads `home.cta.*` would either duplicate its strings into
// `services.*` or make the Services page read the Home namespace. `common` is
// where a string every page may show already lives (the nav labels, the footer,
// the language UI). This is the BANDS-OWN-THEIR-KEYS sub-kind of §4's sections
// map: like Header and Footer, this band calls t() for its own copy, unlike the
// props-in shared compositions (Wordmark, SectionHeading) which own none.
//
// ── ISOMORPHIC (no 'use client'): useTranslations resolves against the
// request-scoped config while this Server Component is pre-rendered into static
// HTML (§16) and reads NextIntlClientProvider in Storybook and Vitest — the
// Footer/FloatingActions precedent. The one hydrated thing here is the trigger,
// because pressing it flips the shared dialog switch.
//
// ── CENTRING, TWO KINDS, ON PURPOSE (§15.15 b — the text-align canon, owner
// 2026-09-04). `items-center` on the Container centres the BOXES; the prose
// line's own `text-center` rides the ELEMENT, because globals.css aligns every
// <p> to `start` in the base layer and a rule matching the element beats an
// inherited one — a wrapper-level `text-center` would silently reach the
// heading and not the paragraph. SectionHeading's `align="center"` does the
// same thing one tier down, inside its own contract.
//
// ── THE BAND RECIPE, consumed not restated (Container.tsx header law, §15.15
// a): full-bleed semantic outer owns paint + `py` rhythm, the Container owns
// width and the container-query context. `bg-raised` is the distinct closing
// ground — the semantic role for a surface lifted off the page (§3: components
// consume semantic tokens, never primitives). In today's single light theme it
// resolves to the same white as --surface; naming the ROLE rather than the
// colour is what lets a future theme separate them without editing this file.

export function CTABanner(): ReactElement {
  const t = useTranslations('common');

  return (
    // Full-bleed band, no outer margin — pages own the rhythm above it (§6.4).
    <section aria-labelledby="cta-banner-title" className="bg-raised py-20">
      <Container className="flex flex-col items-center gap-6">
        {/* No eyebrow: the question IS the opener. `id` lands on the <h2>,
            closing the aria-labelledby pair — the band is named by its title,
            which is also why an eyebrow here would have had to stay out of the
            name. */}
        <SectionHeading
          title={t('cta.title')}
          level={2}
          align="center"
          id="cta-banner-title"
        />

        {/* max-w keeps the line at a readable measure even in a 1536px column
            (Container's recorded non-duty: prose measure is per-element), and
            `text-center` sits on the paragraph ITSELF — ui/Text merges the
            caller's className onto its own host <p> (§6.8), which is exactly
            what the text-align canon requires. */}
        <Text tone="muted" className="max-w-xl text-center">
          {t('cta.text')}
        </Text>

        {/* size lg = min-h-14, past §9's 44px primary-action target; the
            variant is Button's default `solid` — the LOCKED CTA green (§15.1) —
            left unwritten so one place decides what a primary action looks
            like. `hyphens-none` already rides the atom (§15.14): an
            interactive label never syllable-splits, however long the German
            gets. */}
        <ContactModalTrigger size="lg">{t('cta.action')}</ContactModalTrigger>
      </Container>
    </section>
  );
}
