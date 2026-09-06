import type { Metadata } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultLocale, locales } from '../../src/i18n/locales';
import { clinic } from '../../src/lib/clinic';
import {
  absoluteUrl,
  dentistJsonLd,
  pageMetadata,
  serializeJsonLd,
} from '../../src/lib/seo';

// THE §10.2–10.4 output shapes, pinned: the Dentist JSON-LD repeats clinic.ts
// verbatim (consistency by construction — a drift HERE is the bug §10.1
// exists to prevent), the metadata helper's alternates cluster is total and
// self-referencing, and blog-shaped calls carry no cluster at all.
//
// ── WHY THIS SUITE IS IN tests/unit/ AND NOT BESIDE THE MODULE. Two reasons,
// each decisive alone: (1) absoluteUrl's base-path branch needs an env var
// flipped BETWEEN cases, which only the node project can do (the href.test.ts
// precedent, verbatim); (2) the `Metadata` ASSIGNABILITY PIN below imports the
// `next` type — the one specifier src/lib may never name, even type-only
// (tests/unit/lib-react-free.test.ts). The fence bans it in the ring; the pin
// lives here, one gate later, where tsc still proves it on every run
// (D-S1-2, phase4-content ledger).
//
// Fixtures are Romanian, diacritics-bearing (§15.7) — an encoding regression
// surfaces in the same cases that check URL shape.

beforeEach(() => {
  // Delete rather than ignore: a developer shell that exported
  // PAGES_BASE_PATH for a Pages-shaped build must not turn the unprefixed
  // expectations red for a reason that is not in the code (href.test.ts, D4).
  vi.stubEnv('PAGES_BASE_PATH', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('absoluteUrl — clinic.url + the one URL rule', () => {
  it('clinic.url honors its contract: absolute https origin, no trailing slash', () => {
    // Every expectation below recomputes from clinic.url, so a malformed origin
    // (the Phase-5 owner paste 'https://…/' with a trailing slash) would turn
    // every canonical/hreflang/og:url into '…//ro/…' while ALL suites stayed
    // green — both sides of each assertion would carry the same defect. This is
    // the one case that vets the value itself (G2 ts MEDIUM, S1).
    expect(clinic.url).toMatch(/^https:\/\/[^/]+$/);
  });

  it('composes origin, locale prefix and trailing slash', () => {
    expect(absoluteUrl('ro', '/services')).toBe(`${clinic.url}/ro/services/`);
  });

  it('sends the locale home to /{locale}/ (§5: never /{locale}/home)', () => {
    expect(absoluteUrl('ro', '/')).toBe(`${clinic.url}/ro/`);
  });

  it('carries the interim base path when PAGES_BASE_PATH is set (§15.2)', () => {
    vi.stubEnv('PAGES_BASE_PATH', '/premium-smile-development');
    expect(absoluteUrl('de', '/team')).toBe(
      `${clinic.url}/premium-smile-development/de/team/`,
    );
  });
});

describe('dentistJsonLd — §10.2, fed only from clinic.ts', () => {
  it('is a schema.org Dentist node (the specific type, not LocalBusiness)', () => {
    const node = dentistJsonLd();
    expect(node['@context']).toBe('https://schema.org');
    expect(node['@type']).toBe('Dentist');
  });

  it('repeats the clinic constants verbatim — never a second spelling', () => {
    const node = dentistJsonLd();
    expect(node.name).toBe(clinic.name);
    expect(node.telephone).toBe(clinic.phone);
    expect(node.priceRange).toBe(clinic.priceRange);
    expect(node.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: clinic.address.street,
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.county,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.country,
    });
    expect(node.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    });
  });

  it('mirrors clinic.hours row for row into openingHoursSpecification', () => {
    const node = dentistJsonLd();
    expect(node.openingHoursSpecification).toEqual(
      clinic.hours.map((row) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...row.days],
        opens: row.opens,
        closes: row.closes,
      })),
    );
  });

  it('mirrors the derived sameAs list (the Footer’s own URLs, §10.1)', () => {
    expect(dentistJsonLd().sameAs).toEqual([...clinic.sameAs]);
  });

  it('points url at the default locale’s home — a page that exists (D-S1-4)', () => {
    expect(dentistJsonLd().url).toBe(absoluteUrl(defaultLocale, '/'));
  });

  it('carries no image while §15.6 blocks the asset (D-S1-5)', () => {
    // The day the owner’s logo lands, this case flips to assert the real URL —
    // it exists so the omission stays a decision, not an accident.
    expect('image' in dentistJsonLd()).toBe(false);
  });
});

describe('serializeJsonLd — inline-script hardening', () => {
  it('escapes every < so </script> in a value cannot end the element', () => {
    const serialized = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name: '</script><b>Ș</b>',
    });
    expect(serialized).not.toContain('<');
    expect(serialized).toContain('u003c');
    // A JSON escape, not a mutation: the parsed value is byte-identical.
    expect(JSON.parse(serialized).name).toBe('</script><b>Ș</b>');
  });
});

describe('pageMetadata — §10.3/§10.4 head data', () => {
  const input = {
    locale: 'ro',
    path: '/services',
    title: 'Servicii stomatologice — Premium Smile — București',
    description: 'Tratamente stomatologice pentru întreaga familie.',
  } as const;

  it('is assignable to Next’s Metadata type (the D-S1-2 pin)', () => {
    // THE COMPILE-TIME HALF OF THIS SUITE: this annotation is what proves the
    // ring’s plain object against the framework type the ring may not name.
    // If Next’s Metadata shape drifts, tsc goes red HERE, not in a page.
    const metadata: Metadata = pageMetadata(input);
    expect(metadata.title).toBe(input.title);
    expect(metadata.description).toBe(input.description);
  });

  it('self-references its canonical in the page’s own locale', () => {
    expect(pageMetadata(input).alternates.canonical).toBe(
      absoluteUrl('ro', '/services'),
    );
  });

  it('links all five siblings + x-default, each to the same path (§10.4)', () => {
    const languages = pageMetadata(input).alternates.languages;
    expect(Object.keys(languages ?? {}).sort()).toEqual(
      [...locales, 'x-default'].sort(),
    );
    for (const locale of locales) {
      expect(languages?.[locale]).toBe(absoluteUrl(locale, '/services'));
    }
    expect(languages?.['x-default']).toBe(
      absoluteUrl(defaultLocale, '/services'),
    );
  });

  it('drops the cluster entirely for blog-shaped pages (D-S1-8)', () => {
    const metadata = pageMetadata({
      ...input,
      path: '/blog/igiena-orala',
      alternates: false,
    });
    expect(metadata.alternates.canonical).toBe(
      absoluteUrl('ro', '/blog/igiena-orala'),
    );
    expect('languages' in metadata.alternates).toBe(false);
  });

  it('fills Open Graph from the same values (og:image waits on §15.6)', () => {
    const og = pageMetadata(input).openGraph;
    expect(og.url).toBe(absoluteUrl('ro', '/services'));
    expect(og.siteName).toBe(clinic.name);
    expect(og.title).toBe(input.title);
    expect(og.description).toBe(input.description);
    expect(og.type).toBe('website');
    expect(og.locale).toBe('ro_RO');
    expect('images' in og).toBe(false);
  });

  it('maps en → en_GB (the §8.5 Union Jack precedent, D-S1-6)', () => {
    expect(pageMetadata({ ...input, locale: 'en' }).openGraph.locale).toBe(
      'en_GB',
    );
  });
});
