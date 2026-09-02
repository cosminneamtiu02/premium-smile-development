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
// PHASE-4 MOUNT CONTRACT (added 2026-09-02, org-review board): the assembled
// bill this file must discharge — scroll-padding pair, body-level siblings,
// spacer-last, provider-wraps-all + dialog-last, the one-commit trigger wiring,
// the NEW skip-link, deleting this placeholder markup — lives as the checklist
// "Shell mount contract" under MIGRATION_PLAYBOOK.md Phase 4. Tick every box;
// each number's authoritative home stays in its section's own file header.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('siteName'),
    // Never indexable: staging always (GITHUB_SETUP §3, STAGING=1) and the
    // interim Pages production until the real domain lands (§15.2, NOINDEX=1).
    ...(process.env.STAGING === '1' || process.env.NOINDEX === '1'
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
              {/* One ICU string, not glued fragments (§8.2); year as string so the
                  formatter can't digit-group it ("2.026"). footer.rights died with
                  the real Footer's copyright key (Q10, N2 board fb-179). */}
              {t('footer.copyright', {
                year: String(new Date().getFullYear()),
                name: clinic.name,
              })}
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
