import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PrivacyPolicy } from '@/components/sections/PrivacyPolicy/PrivacyPolicy';
import { privacyTranslator } from '@/components/sections/PrivacyPolicy/messages';
import { defaultLocale, isLocale } from '@/i18n/locales';
import { clinic } from '@/lib/clinic/clinic';

// THE PRIVACY AND COOKIE POLICY PAGE — /{locale}/privacy, in all five locales
// (CLAUDE.md §12; the owner, 2026-10-10: "build all things mentioned and all
// fixes"). Reached from the Footer's legal strip (lib/routes' LEGAL_ROUTES)
// and from the note under the map, which points at its #map part.
//
// ── THE WHOLE PAGE IS ONE BAND, sections/PrivacyPolicy, which translates
// itself and reads lib/clinic — so this file is the wiring: the route, the
// tab title and the description. Pre-rendered ×5 for free: `output: 'export'`
// walks the layout's own generateStaticParams (§5), as for every page.
//
// ── NO `params` PLUMBING in the page itself: the locale reaches next-intl
// through the [locale] root param (src/i18n/request.ts, §15.16). The one
// exception is generateMetadata, the 404 page's precedent — metadata is
// resolved per params, outside the render.
//
// ── THE TITLE, in the §10.3 pattern: what the page is, then the clinic (the
// meta-title separator keeps its dash — D-DASH's recorded exception).
// Indexable like every content page; the layout still says noindex wherever
// the build says so (staging, the interim Pages host — §15.2).
//
// ── KEEP-IN-SYNC with ./Privacy.stories.tsx, the page's twin: this page is a
// Server Component no browser runner renders, so the twin mounts the same band
// and its plays pin the page from the outside (page-twins.test.ts holds the
// two sources together).

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const common = await getTranslations({ locale, namespace: 'common' });
  const t = privacyTranslator(isLocale(locale) ? locale : defaultLocale);

  return {
    title: `${t('title')} — ${common('siteName')}`,
    description: t('meta.description', { name: clinic.name }),
  };
}

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
