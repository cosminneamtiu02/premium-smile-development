import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CTABanner } from '@/components/sections/CTABanner/CTABanner';
import { Hero } from '@/components/sections/Hero/Hero';
import { ServicesTeaser } from '@/components/sections/ServicesTeaser/ServicesTeaser';
import { pageMetadata } from '@/lib/seo';

// HOME — §14's first content row, discharged (PHASE-4 CONTENT RUN, stage S2).
// Home lives at /{locale} itself, never /{locale}/home (§5).
//
// THE PLACEHOLDER IS GONE. This file used to render a bare <h1> + <p> to prove
// the locale shell end to end, and said in its own header that the real
// Hero/ServicesTeaser/CTABanner would retire it. They have: the page is now the
// composition and nothing else — three bands in reading order, no markup of its
// own. §14 lists a fourth, optional band (TrustStrip); it is deliberately NOT
// built (D-S2-1): the only material for it in the old repo was twelve fabricated
// demo testimonials, which are unshippable both honestly and under CMSR's
// advertising rules, and inventing trust signals is not a developer's call.
//
// ── WHY THE BANDS TRANSLATE THEMSELVES AND THIS FILE DOES NOT. Each section
// calls useTranslations for its own keys (§8.1 — translation happens in the
// section/page tier); this page therefore hands them nothing and holds no
// message key except its own <title>/description below. That is what lets the
// same three components be storied, tested and — for CTABanner — reused
// verbatim by the Services page (§14 lists it there too).
//
// ── NO GUTTER AND NO SPACING HERE. The shell's <main> is full-bleed and each
// band composes ui/Container inside its own semantic outer, owning its own `py`
// rhythm (the band recipe, Container.tsx header law, §15.15 a). A page adds
// EXTRA inter-band rhythm only when a design asks for it; this one does not, so
// the bands sit flush and their grounds meet edge to edge.
//
// ── NO setRequestLocale HERE — the first page born without it (owner ask,
// 2026-09-06, mid-run: PR #82 bumped Next to 16.3.4, the §15.16 minor crossing
// that ships stable next/root-params, so next-intl resolves the locale for the
// isomorphic hooks on its own and new pages never thread it by hand). The API
// is deprecated; the Phase C follow-up deletes the calls the shell and the old
// stubs still carry — a page that never added one needs no migration at all.
// The §16 static-export proof is behavioral, not typological: the built /de/
// tree must carry German strings, and this run's stage gate checks exactly
// that against out/ after `npm run build`.

type Props = { params: Promise<{ locale: string }> };

/**
 * The §10.3/§10.4 head block: per-locale title + description authored in the
 * message files, plus the self-referencing canonical, the hreflang cluster and
 * the Open Graph tags that lib/seo's pageMetadata builds from one path. The
 * page's job is only to say WHICH path and hand over two finished strings —
 * the URL rule itself lives in i18n/href.ts and nowhere else.
 *
 * getTranslations (server-only) rather than the isomorphic hook: this runs
 * outside React's render, during the build, so the {locale, namespace} form is
 * the only one that can work here — the same shape the shell's own
 * generateMetadata uses.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return pageMetadata({
    locale,
    path: '/',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesTeaser />
      <CTABanner />
    </>
  );
}
