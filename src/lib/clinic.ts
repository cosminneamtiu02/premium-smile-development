// SINGLE SOURCE of NAP — name, address, phone, hours, geo, sameAs (brief §10.1).
// Feeds the Footer, the ContactModal AND the JSON-LD builder: consistency by
// construction. ALL values below are placeholders until the owner supplies the
// real ones — every "TODO(owner)" must be resolved before launch (Phase 5).

export interface OpeningHours {
  /** schema.org day names, e.g. ['Monday', 'Tuesday'] */
  days: readonly string[];
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
  /** Social/profile URLs for JSON-LD sameAs */
  sameAs: readonly string[];
}

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
  hours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    }, // TODO(owner)
  ],
  url: 'https://example.com', // TODO(owner): production domain (blocks §10 metadata)
  priceRange: '$$',
  sameAs: [], // TODO(owner): Facebook/Instagram/GBP profile URLs
};
