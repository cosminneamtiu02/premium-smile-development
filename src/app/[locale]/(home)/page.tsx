import { getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';

// Home lives at /{locale} itself — never /{locale}/home (brief §5).
// Placeholder content: the real Hero/ServicesTeaser/CTABanner sections are
// Phase 3 work; this page only proves the locale shell end-to-end — EXCEPT the
// „Ne găsești" band below, the FIRST real Home band shipped (ClinicLocation
// board D3, owner 2026-09-09: build order = this one first; page order = the
// old site's, late on the page, before the closing band — Hero/ServicesTeaser/
// CTABanner slot AROUND it in their own lanes, the stub lines above it go
// with the Hero). The band brings its own gutter (ui/Container inside its
// full-bleed <section>); the stub lines stay flush, as they always were.
// No `params` plumbing: the locale reaches next-intl through the [locale]
// root param (src/i18n/request.ts, §15.16) — pages never thread it by hand.
// KEEP-IN-SYNC with ./Home.stories.tsx: this file is an async Server Component
// and cannot render in the browser runner, so the story twins its markup
// through `useTranslations` and pins it (owner, 2026-09-06).

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <>
      <h1 className="font-display text-ink-strong">{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <ClinicLocation />
    </>
  );
}
