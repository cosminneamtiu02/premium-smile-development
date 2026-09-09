// SINGLE SOURCE of NAP — name, address, phone, hours, geo, sameAs (brief §10.1).
// Feeds the Footer, the ContactModal AND the JSON-LD builder: consistency by
// construction. ALL values below are placeholders until the owner supplies the
// real ones — every "TODO(owner)" must be resolved before launch (Phase 5).

/**
 * schema.org's weekday names — a CLOSED set of seven, so it is typed as the
 * union: a typo ("Mondey") fails compilation here instead of surfacing as a
 * build-render throw. lib/hours keeps its runtime throw as belt-and-braces
 * for data that dodges the compiler (G2 typescript-reviewer MEDIUM).
 */
export type SchemaDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface OpeningHours {
  /** schema.org day names — the closed SchemaDay union; typos fail to compile */
  days: readonly SchemaDay[];
  /** 24h "HH:MM" */
  opens: string;
  /** 24h "HH:MM" */
  closes: string;
}

export interface ClinicInfo {
  name: string;
  /** E.164, used in tel: links and JSON-LD */
  phone: string;
  /** Human-formatted display variant of the same number */
  phoneDisplay: string;
  /** wa.me target — digits only, no plus */
  whatsapp: string;
  address: {
    street: string;
    city: string;
    county: string;
    postalCode: string;
    /** ISO 3166-1 alpha-2 */
    country: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  /**
   * Google "Share → Embed a map" URL — the `google.com/maps/embed?pb=…` form,
   * the ONLY one Google allows inside an <iframe> (a maps.app.goo.gl short link
   * or a plain maps URL renders nothing there). Cannot be derived from `geo`:
   * the `pb` blob encodes the place card. Consumed by sections/ClinicLocation
   * (board .claude/plans/clinic-location.plan.md D8, 2026-09-09).
   */
  mapEmbedUrl: string;
  /**
   * Directions target — DERIVED from `geo` below (Google Maps URLs API, no
   * key, no billing), never hand-written: the one `TODO(owner): exact pin`
   * fixes the JSON-LD and the directions row together (§10.1's consistency
   * rule one level deeper — the `sameAs` precedent in this file).
   */
  directionsUrl: string;
  hours: readonly OpeningHours[];
  /** Absolute production origin, no trailing slash */
  url: string;
  /** JSON-LD priceRange, e.g. '$$' */
  priceRange: string;
  /**
   * The clinic's own official profiles, keyed by network. OPTIONAL by design:
   * a network the clinic does not use is simply absent, and the Footer renders
   * no control for it — never a dead link to an empty profile.
   */
  social: {
    instagram?: string;
    tiktok?: string;
  };
  /** Social/profile URLs for JSON-LD sameAs — DERIVED from `social` below */
  sameAs: readonly string[];
}

// Declared before `clinic` so `sameAs` can be DERIVED from it: the Footer's
// buttons and the JSON-LD's sameAs are then the same URLs by construction and
// cannot drift apart (§10.1's consistency rule, applied one level deeper).
// Annotated (not `satisfies`) on purpose: the documented removal path — delete
// a network's line — must keep compiling, and the sameAs filter below then
// does real narrowing instead of being type-vacuous (G2 typescript-reviewer).
const social: ClinicInfo['social'] = {
  instagram: 'https://instagram.com/premiumsmile', // TODO(owner): real profile URL
  tiktok: 'https://tiktok.com/@premiumsmile', // TODO(owner): real profile URL
};

// Declared before `clinic` for the same reason as `social`: `directionsUrl` is
// DERIVED from it, so the pin the map points at and the pin directions lead to
// are one number by construction.
const geo: ClinicInfo['geo'] = {
  latitude: 44.4268, // TODO(owner): exact pin (Sibiu — the demo value is București)
  longitude: 26.1025,
};

/**
 * Google Maps URLs API — opens directions to a coordinate in the visitor's maps
 * app or a new tab. No key, no billing, no script on our page: the row that
 * links here is a plain <a href>. Exported so the test beside this file can pin
 * the derivation without re-spelling the URL shape.
 */
export const directionsUrlFor = ({
  latitude,
  longitude,
}: ClinicInfo['geo']): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

export const clinic: ClinicInfo = {
  name: 'Premium Smile', // TODO(owner): confirm public clinic name
  phone: '+40700000000', // TODO(owner): real phone (E.164)
  phoneDisplay: '0700 000 000', // TODO(owner): real display format
  whatsapp: '40700000000', // TODO(owner): real WhatsApp number
  address: {
    street: 'Strada Exemplu nr. 1', // TODO(owner)
    city: 'București', // TODO(owner)
    county: 'București', // TODO(owner)
    postalCode: '000000', // TODO(owner)
    country: 'RO',
  },
  geo,
  // The old site's own placeholder embed (Universitatea din București), shipped
  // on the owner's word 2026-09-09 ("ship old Bucharest url until then").
  // TODO(owner): Google Maps → Share → "Embed a map" → paste the
  // google.com/maps/embed?pb=… URL for the Sibiu clinic here. One line —
  // and resolve it TOGETHER with `geo`'s TODO above, in the same edit: the
  // `pb` blob is opaque, so nothing can tie the pin this map shows to the pin
  // `directionsUrl` derives from (today the two placeholders sit ~1 km apart,
  // Universitatea vs the demo geo — G2 typescript, 2026-09-09). The blob also
  // fixes the embed's OWN UI language (`!5m2!1sen!2sro` = English controls for
  // every locale — G2 a11y LOW-4): when generating the real URL, generate it
  // per language, or first verify whether an appended `&hl=` overrides the
  // blob — unverified as of 2026-09-09.
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.4488!2d26.1003!3d44.4356' +
    '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff465e6f76db%3A0x4d8b0a5e0a8a0f8e' +
    '!2sUniversitatea+din+Bucuresti!5e0!3m2!1sen!2sro!4v1700000000000!5m2!1sen!2sro',
  // Never hand-written — see `directionsUrlFor` above.
  directionsUrl: directionsUrlFor(geo),
  // TODO(owner): confirm the real schedule. The shape is the old site's —
  // weekdays plus a short Saturday, Sunday closed — and lib/hours/hours.ts spreads
  // it into one row PER DAY (owner 2026-08-18): five identical weekday rows,
  // a short Sâmbătă, and Duminică closed in its calendar place.
  hours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00',
    },
    {
      days: ['Saturday'],
      opens: '09:00',
      closes: '14:00',
    },
  ],
  url: 'https://example.com', // TODO(owner): production domain (blocks §10 metadata)
  priceRange: '$$',
  social,
  // Never hand-written: the same URLs the Footer links, filtered so an absent
  // network leaves no empty string in the JSON-LD (§10.2).
  sameAs: [social.instagram, social.tiktok].filter((url): url is string =>
    Boolean(url),
  ),
};
