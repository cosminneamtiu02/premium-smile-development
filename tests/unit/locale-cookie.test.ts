import { describe, expect, it } from 'vitest';
import { localeCookieString } from '../../src/i18n/cookie';

// THE COOKIE ATTRIBUTE CONTRACT, both protocol branches — the piece the
// browser-mode section suites cannot reach: a real window's `location` cannot
// be redefined, so LanguageSwitcher.test.tsx and LanguageBanner.test.tsx pin
// the http shape through the real writer while THIS file pins the rule that
// separates the branches. The rule exists because of a 2026-09-07 owner-hit,
// reproduced in Playwright WebKit before the fix: Safari refuses a `Secure`
// cookie write from ANY insecure scheme, localhost included (Chrome's
// localhost carve-out had hidden it), so the banner's ✕ wrote nothing on the
// local preview and the suggestion re-asked on every page.
//
// Literals asserted from the OUTSIDE (the #62 tripwire convention): a pin
// built out of the constant it watches would watch nothing.
describe('localeCookieString', () => {
  it('stamps Secure on https documents — every deployed page (§15.14)', () => {
    expect(localeCookieString('de', 'https:')).toBe(
      'NEXT_LOCALE=de; path=/; max-age=31536000; SameSite=Lax; Secure',
    );
  });

  it('omits Secure on the plain-http local preview so WebKit accepts the write', () => {
    expect(localeCookieString('ro', 'http:')).toBe(
      'NEXT_LOCALE=ro; path=/; max-age=31536000; SameSite=Lax',
    );
  });
});
