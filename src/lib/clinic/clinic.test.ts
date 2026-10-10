import { describe, expect, it } from 'vitest';
import { locales } from '../../i18n/locales';
import { clinic, directionsUrlFor, mapEmbedUrlFor } from './clinic';

// lib/clinic is the single source of NAP (§10.1); this file pins the two
// fields the ClinicLocation band consumes (board D8, 2026-09-09) the way the
// `sameAs` derivation is pinned in spirit: by construction, not by copy — and,
// since the real data landed (2026-09-30), the two places where one fact is
// spelled twice (the map's centre beside the pin, the shown phone beside the
// dialled one) and the map's language, which is derived per locale.

describe('clinic — the map fields (ClinicLocation board D8)', () => {
  it('derives directionsUrl from geo, so the two pins cannot drift apart', () => {
    expect(clinic.directionsUrl).toBe(directionsUrlFor(clinic.geo));
    // The Google Maps URLs API shape: keyless, coordinate destination.
    expect(clinic.directionsUrl).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${clinic.geo.latitude},${clinic.geo.longitude}`,
    );
  });

  it('ships an EMBED-form map URL — the only form Google allows in an iframe', () => {
    // A maps.app.goo.gl short link or a plain /maps/place URL renders nothing
    // inside an <iframe>; the section would silently show an empty box.
    expect(clinic.mapEmbedUrl).toMatch(
      /^https:\/\/www\.google\.com\/maps\/embed\?pb=/,
    );
  });

  it('keeps the derivation pure — a different pin yields a different link', () => {
    expect(directionsUrlFor({ latitude: 45.7983, longitude: 24.1256 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=45.7983,24.1256',
    );
  });

  it('centres the embed on the pin — the map and the directions are one place', () => {
    // Until 2026-09-30 the two were placeholders a kilometre apart and nothing
    // could notice: the `pb` blob is opaque except for its centre
    // (`!2d<longitude>!3d<latitude>`), so the centre is what gets tied to
    // `geo`. 0.005° is a few hundred metres — room for the offset Google's own
    // "Embed a map" code puts between the centre and the place, none for the
    // next town.
    const centre = /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/.exec(
      clinic.mapEmbedUrl,
    );
    expect(centre).not.toBeNull();
    const [, longitude, latitude] = centre ?? [];

    expect(Math.abs(Number(latitude) - clinic.geo.latitude)).toBeLessThan(
      0.005,
    );
    expect(Math.abs(Number(longitude) - clinic.geo.longitude)).toBeLessThan(
      0.005,
    );
  });
});

describe("mapEmbedUrlFor — the one pasted url, in the page's language", () => {
  /** The two language fields, with the prefix kept so `3` and `5` stay told apart. */
  const FIELD = /(![35]m2!1s)[A-Za-z-]+(?=!2s)/g;
  const languages = (url: string): string[] =>
    [...url.matchAll(/![35]m2!1s([A-Za-z-]+)!2s/g)].map(
      (match) => match[1] ?? '',
    );

  it.each(locales)('swaps BOTH fields for %s, and nothing else', (locale) => {
    const localized = mapEmbedUrlFor(clinic.mapEmbedUrl, locale);

    expect(languages(localized)).toEqual([locale, locale]);
    // Blank the two fields on both sides and the rest is the pasted url, byte
    // for byte — the listing, its name and the centre are not language.
    expect(localized.replace(FIELD, '$1·')).toBe(
      clinic.mapEmbedUrl.replace(FIELD, '$1·'),
    );
  });

  it('refuses a url that does not carry exactly the two fields', () => {
    // A pasted url of another shape must fail the build: one field swapped
    // and one left is a map half in one language, and none is the form
    // Google does not localise at all.
    expect(() =>
      mapEmbedUrlFor(
        'https://www.google.com/maps/embed?pb=!1m18!3m2!1sen!2sro',
        'de',
      ),
    ).toThrow(/carries 1 language field/);
    expect(() =>
      mapEmbedUrlFor(
        'https://www.google.com/maps?q=45.77,24.14&output=embed',
        'de',
      ),
    ).toThrow(/carries 0 language field/);
  });
});

describe('clinic — the phone, one number in two spellings', () => {
  it('shows the number it dials', () => {
    // `phone` is what a dialler needs (E.164) and `phoneDisplay` what a reader
    // needs (the national format) — two fields, so an edit can move one and
    // forget the other, and every consumer would then print one number over a
    // link to another. A Romanian number is nine digits after the prefix
    // (+40 / 0), which is what the two spellings must share.
    const digits = (value: string): string => value.replace(/\D/g, '');

    expect(clinic.phone).toMatch(/^\+40\d{9}$/);
    expect(digits(clinic.phoneDisplay).slice(-9)).toBe(
      digits(clinic.phone).slice(-9),
    );
  });
});

describe('clinic — the company behind it (`legal`, the privacy page’s facts)', () => {
  it('holds each fact as text or as null — never an empty string standing in for one', () => {
    for (const [field, value] of Object.entries(clinic.legal)) {
      if (value !== null) expect(value.trim(), field).not.toBe('');
    }
  });

  // Skipped, and reported as skipped, until the address exists — never a
  // green test with nothing inside it (the TypeScript review).
  it.skipIf(clinic.legal.email === null)(
    'holds a real address once the e-mail is supplied',
    () => {
      expect(clinic.legal.email).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
    },
  );

  // THE LAUNCH GUARD (the a11y review, 2026-10-10: a privacy page whose only
  // channel is a placeholder must not reach the public). While `url` is the
  // placeholder the site lives on the noindex interim host and the facts may
  // wait (BACKLOG.md entries 3 and 7); the day the production domain is set,
  // every legal fact must be set with it, or CI stops the launch here.
  it.skipIf(clinic.url === 'https://example.com')(
    'arrives with the launch domain — no placeholder legal identity goes live',
    () => {
      for (const [field, value] of Object.entries(clinic.legal)) {
        expect(value, field).not.toBeNull();
      }
    },
  );
});
