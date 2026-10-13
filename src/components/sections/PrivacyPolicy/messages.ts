import { createTranslator } from 'next-intl';
import type { Locale } from '@/i18n/locales';
import de from '@/messages/privacy/de.json';
import en from '@/messages/privacy/en.json';
import fr from '@/messages/privacy/fr.json';
import it from '@/messages/privacy/it.json';
import ro from '@/messages/privacy/ro.json';

// THE POLICY'S WORDS — five files of their own, `src/messages/privacy/*.json`,
// and NOT keys in `src/messages/*.json`. That split is the one decision in
// this folder worth knowing before you add a word:
//
// ── WHY NOT THE MAIN MESSAGE FILES. The shell's NextIntlClientProvider
// (src/app/[locale]/layout.tsx) serialises EVERY key of the page locale's main
// file into EVERY page it renders — that is how next-intl hands messages to
// client islands, and it is why the layout resolves the language banner's
// foreign strings itself. The policy is several kilobytes of prose that one
// page reads, so in the main file it would ride along with all fifty-five
// pages of the export as dead weight. Here it is read by this page alone, at
// build time, and reaches the browser only inside the policy page's own HTML
// file — twice there, as every server-rendered text is: once as markup and
// once in React's payload, embedded in the same file.
//
// ── WHAT STAYS THE SAME. The words are still message files (§8.10: never
// inline), still ICU — arguments, a plural, rich-text tags for the links —
// and still held to the main files' standard by tests/unit/privacy-parity.test.ts:
// the same keys, the same arguments and the same tags in all five, and no
// mid-sentence dash (the owner's D-DASH rule). `createTranslator` is next-intl's
// own core API — the same formatter `useTranslations` wraps, without a
// provider — so a server component and the workbench render the same strings.
//
// ── TYPED AGAINST ROMANIAN, THE REFERENCE. `PrivacyMessages` is `ro.json`'s
// shape, so a translation that lacks a key fails to COMPILE here, before the
// parity test even runs, and `t('…')` refuses a key that does not exist.

/** The policy's message shape — Romanian's, the reference language. */
export type PrivacyMessages = typeof ro;

export const PRIVACY_MESSAGES: Readonly<Record<Locale, PrivacyMessages>> = {
  ro,
  en,
  de,
  fr,
  it,
};

/**
 * The policy's translator for one locale — `t`, `t.rich`, ICU and all.
 *
 * IT THROWS on every formatting error (the React review, 2026-10-10). The
 * JSON imports type each message as plain `string`, so the compiler checks
 * keys but never a message's ICU arguments or tags — and next-intl's default
 * `onError` only logs, then prints the bare KEY PATH („visit.logs") where the
 * sentence should be, with `next build` still green. A legal page must never
 * ship that, so a renamed argument or tag fails the build, the tests and the
 * stories instead.
 */
export function privacyTranslator(locale: Locale) {
  return createTranslator({
    locale,
    messages: PRIVACY_MESSAGES[locale],
    onError: (error) => {
      throw error;
    },
  });
}
