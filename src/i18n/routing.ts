import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './locales';

// Static export ⇒ no middleware exists (brief §2.1): prefix routing is
// mandatory and the locale is never negotiated server-side. The root "/" is a
// redirect stub GENERATED from the same locale manifest at build time
// (tools/generate-root-redirect.ts → out/index.html, per brief §5).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
