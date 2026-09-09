import { describe, expect, it } from 'vitest';
import { clinic, directionsUrlFor } from './clinic';

// lib/clinic is the single source of NAP (§10.1); this file pins the two
// fields the ClinicLocation band consumes (board D8, 2026-09-09) the way the
// `sameAs` derivation is pinned in spirit: by construction, not by copy.

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
});
