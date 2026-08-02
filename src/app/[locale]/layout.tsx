import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { mono, serif } from '@/fonts';
import { routing } from '@/i18n/routing';
import { clinic } from '@/lib/clinic';
import '@/styles/globals.css';

// THE SHELL (brief §5): locale dictates the shell, the sub-route the content.
// Header/Footer below are placeholders — the real sections arrive in Phase 3.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('siteName'),
    // Staging must never be indexable (GITHUB_SETUP §3) — STAGING=1 build flag.
    ...(process.env.STAGING === '1'
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering (next-intl static-export requirement).
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <html lang={locale} className={`${serif.variable} ${mono.variable}`}>
      <body className="bg-page font-body text-ink">
        <NextIntlClientProvider>
          <header>
            <p>{t('siteName')}</p>
          </header>
          <main>{children}</main>
          <footer>
            {/* Crawlable NAP on every page (brief §10.5) — fed by lib/clinic.ts */}
            <address className="not-italic">
              <p>{clinic.name}</p>
              <p>
                {clinic.address.street}, {clinic.address.city}{' '}
                {clinic.address.postalCode}
              </p>
              <p>
                <a href={`tel:${clinic.phone}`}>{clinic.phoneDisplay}</a>
              </p>
            </address>
            <p>
              © {new Date().getFullYear()} {clinic.name}. {t('footer.rights')}.
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
