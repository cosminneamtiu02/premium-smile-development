import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

// Build-time only under static export: every locale × route is pre-rendered
// with its messages already resolved into the markup (brief §16).
// The locale arrives straight from the [locale] URL segment via
// next/root-params (stable since Next 16.3, §15.16) — nothing threads it by
// hand any more; the deprecated requestLocale/setRequestLocale pair is retired.
// EXPLICIT-LOCALE CALLS STILL WIN: `getTranslations({locale})` (the layout's
// D6 banner block resolves all five locales' strings on every page, and
// generateMetadata passes the locale explicitly) arrives via the
// NON-deprecated `locale` param — the S1 probe proved the segment alone
// collapses the banner's five languages into the page's one.
// KEEP-IN-SYNC: tests/unit/request-locale-resolution.test.ts pins this
// resolution as source text (§6.6 — this module is un-importable under
// vitest, next/root-params being a compiler-replaced placeholder).
export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const requested = explicitLocale ?? (await rootParams.locale());
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
