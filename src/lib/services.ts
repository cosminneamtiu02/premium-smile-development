// THE service tiers the site quotes a from-price for — site DATA, exactly like
// clinic.ts and routes.ts beside it (§4's foundation ring): plain TypeScript,
// no React, no next-intl, no browser API, so every tier may import it — the
// Home teaser (a Server Component band) today, the Services page and its
// `Service` JSON-LD (§10.2) next. tests/unit/lib-react-free.test.ts is the
// machine that keeps that promise; the two-question test in lib/cx.ts is why
// this is a lib module at all: it is a FACT ABOUT THE SITE repeated by more
// than one consumer, not a rendering concern.
//
// ── WHY THE PRICE IS A NUMBER AND NOT A STRING. The old repo shipped
// `pricing.tiers.consult.price = "De la 100 RON"` — five translations of one
// sentence with the amount, the currency and the word "from" welded together,
// which is §8.2's "never build sentences from fragments" seen from the other
// side: nothing could reformat it, and a price change meant editing five files.
// Here the AMOUNT lives once, as data, and the SENTENCE lives once, as the ICU
// message `services.priceFrom` ("de la {price}"); the currency comes out of
// Intl.NumberFormat at render (§8.3), which is also what makes ro's "100 RON"
// and en's "RON 100" correct without a second string.
// EUR display on the foreign locales is a PARKED decision (§15.4) — RON only in
// v1, and never a second hardcoded currency smuggled in from a section.
//
// ── §8.1 HOLDS: no user-facing text lives here. The tier's NAME and
// DESCRIPTION are message keys under the `services` namespace
// (`services.tiers.<key>.name` / `.description`), resolved by whichever section
// renders them — the routes.ts precedent, where the rows carry keys and never
// copy. `key` is therefore doing double duty on purpose: it is the render
// identity AND the message path segment, so a tier cannot exist without its
// five translations (the parity gate then names it).

/**
 * The tiers that exist as REQUIREMENTS, spelled as a union rather than
 * `string`: a typo in a `services.tiers.<key>.*` lookup fails at compile time,
 * and adding a fourth tier is a deliberate edit here plus five message files.
 */
export type ServiceKey = 'consult' | 'cleaning' | 'whitening';

export interface ServiceTier {
  /** Render identity AND the `services.tiers.<key>.*` message path segment. */
  readonly key: ServiceKey;
  /**
   * The FROM-price in RON, as a number — formatted per locale by
   * Intl.NumberFormat at render (§8.3), never printed raw.
   */
  readonly priceRon: number;
}

/**
 * The three priced services, in render order — sourced from the old repo's
 * `pricing.tiers.*` ("De la 100 / 250 / 800 RON"), which is the only pricing
 * requirement that exists. Placeholder amounts until the owner confirms them,
 * exactly like clinic.ts's NAP: every TODO(owner) must be resolved before
 * launch (Phase 5).
 */
export const SERVICE_TIERS: readonly ServiceTier[] = [
  { key: 'consult', priceRon: 100 }, // TODO(owner): confirm price
  { key: 'cleaning', priceRon: 250 }, // TODO(owner): confirm price
  { key: 'whitening', priceRon: 800 }, // TODO(owner): confirm price
];
