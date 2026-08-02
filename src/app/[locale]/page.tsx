import { getTranslations, setRequestLocale } from 'next-intl/server';

// Home lives at /{locale} itself — never /{locale}/home (brief §5).
// Placeholder content: the real Hero/ServicesTeaser/CTABanner sections are
// Phase 3 work; this page only proves the locale shell end-to-end.

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <>
      <h1 className="font-display text-ink-strong">{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </>
  );
}
