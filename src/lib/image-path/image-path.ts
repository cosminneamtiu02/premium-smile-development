// lib/image-path — THE type of a picture's path on this site, and nothing
// else: a type-only module, zero runtime, React-free (fenced by
// tests/unit/lib-react-free.test.ts), importable from every tier.
//
// PROMOTED 2026-09-19 by the hero lane (epic #103) on the recorded trigger in
// lib/reviews' PICTURES paragraph (G3 typescript L1 / org T6, §15.19 round 3):
// the template `/images/${string}` was spelled in four tiers — lib/reviews'
// row, ui/Avatar, sections/ReviewCard and the deck's ReviewSlide — and the
// next lane to type an image path was to promote it and point all four at it.
// lib/hero-slides is that lane's fifth speller; the four are rewired here
// (§4's "byte-identical copies at N ≥ 3 → a dedicated promotion lane" —
// folded into this lane because the trigger named exactly this moment).
//
// WHY `/images/` AND NOTHING NARROWER. public/images/ is the ONE folder the
// export optimizer scans (§11, next.config's `nextImageExportOptimizer_
// imageFolderPath`): a path outside it would ship as a broken picture with no
// compile-time complaint, so the type stops there. Sub-folders (reviews/,
// demo/, hero/) are CONVENTIONS a data list's own test enforces on the shipped
// rows — a story may then carry a committed demo picture from public/images/
// demo/ without a cast (lib/reviews' own reasoning, kept).
//
// The leading slash is part of the type on purpose: the optimizer resolves a
// root-relative path against the folder above, and the interim Pages base
// path (§15.2) is applied by the optimizer's loader, never by the data.

/** A picture path under public/images/ — root-relative, the optimizer's folder. */
export type ImagePath = `/images/${string}`;
