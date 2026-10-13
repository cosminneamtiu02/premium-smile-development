import type { Locale } from '../../i18n/locales';

// SINGLE SOURCE of NAP — name, address, phone, hours, geo, sameAs (brief §10.1).
// Feeds the Footer, the ContactModal AND the JSON-LD builder: consistency by
// construction. The address, the phone and the week are the clinic's REAL ones
// (owner, 2026-09-30, copied from the clinic's Google listing); every value
// still marked "TODO(owner)" is a placeholder and must be resolved before
// launch (Phase 5).

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
   * the `pb` blob encodes the place card. ONE url, in whatever language it
   * was generated in; sections/ClinicLocation shows it through
   * `mapEmbedUrlFor` below, in the page's own (board
   * .claude/plans/clinic-location.plan.md D8, 2026-09-09).
   */
  mapEmbedUrl: string;
  /**
   * Directions target — DERIVED from `geo` below (Google Maps URLs API, no
   * key, no billing), never hand-written: the one pin serves the JSON-LD and
   * the directions row together (§10.1's consistency rule one level deeper —
   * the `sameAs` precedent in this file).
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
  /**
   * The COMPANY behind the clinic, as its registration certificate prints it —
   * what the privacy page must show: who processes a visitor's data (GDPR
   * art. 13) and who runs the site (Law 365/2002 art. 5). It is not NAP: the
   * company's name and registered office may differ from the brand `name` and
   * the clinic's `address` above.
   *
   * EVERY FIELD IS `null` UNTIL THE OWNER SUPPLIES IT (BACKLOG.md entry 3): a
   * null prints a visible „[de completat]" on the privacy page — never an
   * invented value, because a made-up tax code on a legal page is worse than a
   * gap anyone can see. Fill a field and the page shows it, nothing else moves.
   */
  legal: {
    /** The registered company name, e.g. „… SRL". */
    companyName: string | null;
    /** The fiscal code (CUI / CIF), as printed. */
    cui: string | null;
    /** The Trade Register number, in the certificate's own format. */
    tradeRegister: string | null;
    /** The registered office (sediul social), as one line. */
    registeredOffice: string | null;
    /** Where privacy requests go — the site shows no e-mail anywhere else. */
    email: string | null;
  };
}

// Declared before `clinic` so `sameAs` can be DERIVED from it: the Footer's
// buttons and the JSON-LD's sameAs are then the same URLs by construction and
// cannot drift apart (§10.1's consistency rule, applied one level deeper).
// Annotated (not `satisfies`) on purpose: the documented removal path — delete
// a network's line — must keep compiling, and the sameAs filter below then
// does real narrowing instead of being type-vacuous (G2 typescript-reviewer).
const social: ClinicInfo['social'] = {
  // The clinic's own profiles (owner, 2026-09-30), spelled as pasted.
  instagram: 'https://www.instagram.com/premium.smile.sibiu/',
  tiktok: 'https://www.tiktok.com/@premium.smile.sibiu',
};

// Declared before `clinic` for the same reason as `social`: `directionsUrl` is
// DERIVED from it, so the pin the map points at and the pin directions lead to
// are one number by construction.
const geo: ClinicInfo['geo'] = {
  // The clinic's pin (owner, 2026-09-30: a right-click on it in Google Maps,
  // "45.776527124492134, 24.143985584655205"), kept to the seven decimals
  // Google's own place URLs carry — about a centimetre. Google's marker for
  // the listing sits some 19 m south of it (45.7763625, 24.1440285).
  latitude: 45.7765271,
  longitude: 24.1439856,
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

/**
 * The embed in the PAGE's language. Google's own controls and place card take
 * their language from two fields INSIDE the `pb` blob — `!3m2!1s<lang>` and
 * `!5m2!1s<lang>` — and from nothing else: measured 2026-09-30, `ro` there
 * gives Romanian controls and `de` German, while an appended `&hl=` changes
 * nothing. So the url stays ONE pasted value and each locale's frame is that
 * value with the two fields swapped — derived, in `directionsUrlFor`'s idiom,
 * never five hand-kept copies. The site's five locale codes are language
 * codes Google takes as they are.
 *
 * THROWS unless it finds exactly the two fields: a pasted url of another
 * shape fails the build instead of shipping a map half in one language.
 */
export const mapEmbedUrlFor = (url: string, locale: Locale): string => {
  let swapped = 0;
  const localized = url.replace(
    /(![35]m2!1s)[A-Za-z-]+(?=!2s)/g,
    (_field, prefix: string) => {
      swapped += 1;
      return `${prefix}${locale}`;
    },
  );
  if (swapped !== 2) {
    throw new Error(
      `lib/clinic: the map embed url carries ${swapped} language field(s) ` +
        `(!3m2!1s<lang>, !5m2!1s<lang>) where Google's "Embed a map" code ` +
        `has two, so it cannot be shown in "${locale}". Paste the url again ` +
        `from Google Maps → Share → Embed a map.`,
    );
  }
  return localized;
};

export const clinic: ClinicInfo = {
  name: 'Premium Smile', // the name on the clinic's Google listing (2026-09-30)
  phone: '+40770162765',
  phoneDisplay: '0770 162 765',
  // The same line as `phone` FOR NOW (owner, 2026-09-30: "for the moment leave
  // same number, i'll modify that"). TODO(owner): the WhatsApp number.
  whatsapp: '40770162765',
  // Spelled exactly as the clinic's Google listing spells it („nr 3A", no
  // dot), so the website and the listing carry ONE address (§10.1).
  address: {
    street: 'Strada Gheorghe Dima nr 3A',
    city: 'Sibiu',
    county: 'Sibiu',
    postalCode: '550409',
    country: 'RO',
  },
  geo,
  // The clinic's own place on Google Maps (owner, 2026-09-30, as the share
  // link maps.app.goo.gl/qrM1bZij1NG56fqK9). A share link renders nothing in
  // an <iframe>, so this is the embed form BUILT around the place that link
  // resolves to — `!1s0x47490dd7d9ebffff:0x29af4d57dcf7042d` is the listing,
  // `!2d…!3d…` its marker — and checked in a browser the same day: the frame
  // shows the „Premium Smile" card and the pin on Strada Gheorghe Dima.
  // Google's own Share → "Embed a map" URL, pasted here, is equally valid.
  // THE CENTRE is a fallback only: while the place resolves, Google centres
  // on it. The test beside this file still keeps the centre at `geo`, because
  // the blob is otherwise opaque and until this edit the map and the pin
  // `directionsUrl` derives from were two placeholders a kilometre apart
  // (G2 typescript, 2026-09-09).
  // THE EMBED'S OWN LANGUAGE is the two `!1sen` fields, and no page shows them
  // as written: `mapEmbedUrlFor` above swaps them for the page's locale, which
  // closes the English-controls-everywhere finding (G2 a11y LOW-4,
  // 2026-09-09; folded 2026-09-30).
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2782.4!2d24.1440285!3d45.7763625' +
    '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47490dd7d9ebffff%3A0x29af4d57dcf7042d' +
    '!2sPremium%20Smile!5e0!3m2!1sen!2sro!4v1790726400000!5m2!1sen!2sro',
  // Never hand-written — see `directionsUrlFor` above.
  directionsUrl: directionsUrlFor(geo),
  // The clinic's week (owner, 2026-09-30): Monday to Friday 09:00–19:00,
  // Saturday and Sunday closed. lib/hours/hours.ts spreads it into one row PER
  // DAY (owner 2026-08-18): five identical weekday rows, then Sâmbătă and
  // Duminică closed in their calendar places — a day no entry covers IS a
  // closed day, so the weekend needs no entry of its own.
  // sections/ContactModal's one-line caption (`contact.callHours`) names THIS
  // shape — one Mon–Fri pair of times, the weekend closed — and refuses to
  // build on any other. Reshaping the week is therefore ONE edit in four
  // places: this list, that key in all five message files, the arguments the
  // section passes to it, and the section's guard itself.
  hours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00',
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
  // TODO(owner): the five facts on the company's registration certificate
  // (Certificat de înregistrare), or from the accountant — BACKLOG.md entry 3.
  // Until then the privacy page shows „[de completat]" in their place.
  legal: {
    companyName: null,
    cui: null,
    tradeRegister: null,
    registeredOffice: null,
    email: null,
  },
};
