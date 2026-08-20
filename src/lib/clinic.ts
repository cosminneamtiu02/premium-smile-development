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
  geo: {
    latitude: 44.4268, // TODO(owner): exact pin
    longitude: 26.1025,
  },
  // TODO(owner): confirm the real schedule. The shape is the old site's —
  // weekdays plus a short Saturday, Sunday closed — and lib/hours.ts spreads
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
