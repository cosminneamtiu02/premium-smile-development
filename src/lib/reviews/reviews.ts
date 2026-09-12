import type { Locale } from '../../i18n/locales';
import type { Initials } from '../initials/initials';
import type { Rating } from '../rating/rating';

// lib/reviews — THE list the reviews deck is populated from at build time
// (owner brief 2026-09-10: "populate it from a list … static, no call to any
// server … a dumb component populated at compile time"). Site DATA in §4's
// foundation ring, the lib/clinic precedent: one file every consumer reads,
// nothing fetched, nothing mutated.
//
// WHY A TYPESCRIPT MODULE AND NOT reviews.json (board D2, owner fb-434). A JSON
// import is typed as plain `string` and `number`, so nothing could stop a
// three-letter monogram or a 4.3. Here every row is checked against
// lib/initials' `Initials` (two capitals) and lib/rating's `Rating` (eleven
// half-steps) THE MOMENT IT IS TYPED — a red squiggle in the editor, a failed
// `tsc` in CI — which is the earliest "error" the owner asked for. The
// annotation types each row contextually, so a wrong literal is reported ON
// ITS OWN LINE; an `as const satisfies` spelling would have typed the empty
// list as `readonly []` and every consumer's element as `never`.
//
// FACTS AND WORDS IN ONE TYPED ROW (board D2, amended at build time — the
// planner's call inside the owner's "fully go with your recommendations"). A
// row carries what is the same in every language — the id, the name (a proper
// noun), the monogram, the rating, the picture path — AND the translated
// content: `words` is a Record over the five locales, so a review with a
// missing German title is a COMPILE error, the same guarantee the message
// files get from tests/unit/translation-parity.test.ts. The words were first
// planned as `home.reviews.items.<id>.*` message keys; that shape was dropped
// because Storybook and the tests could then only render a demo review by
// putting fabricated copy INTO the shipped message bundle, and the parity test
// cannot tie an id's keys to the row that needs them. Reviews are CONTENT
// (§15.17 — the owner's hands), the way blog posts are content in MDX rather
// than in the message files; the band's own control labels (region name,
// prev/next, the slide and rating formats) stay in `home.reviews.*` where UI
// strings belong.
//
// THE LIST SHIPS EMPTY (board D15, owner fb-446). The twelve reviews the old
// site displayed were fabricated demo copy and never enter this file; the
// owner supplies REAL reviews, each with the patient's written consent
// (a name + a procedure is health data, GDPR art. 9) and the CMSR testimonial
// check (§15.18's consumer gate). Until the list has rows, the band does not
// mount on Home. Storybook renders demo rows of its own, clearly labelled.
//
// PICTURES live under public/images/ — the folder the export optimizer scans
// (§11). The site's own portraits go in public/images/reviews/ BY CONVENTION,
// which tests/unit/reviews-data.test.ts enforces on the shipped list together
// with the file's existence (so a typo fails CI instead of shipping a broken
// disc), while the TYPE stops at §11's folder — a story may then carry a
// committed demo portrait from public/images/demo/ without a cast (owner
// 2026-09-12: the deck's examples alternate photograph and letters). A
// picture is DECORATIVE (its alt is empty): the name is printed on the card.
// RECORDED TRIGGER (G3 typescript L1 / org T6): the template
// `/images/${string}` is spelled in four tiers today — this row, ui/Avatar,
// sections/ReviewCard, the deck's ReviewSlide — which is §4's "byte-identical
// copies at N ≥ 3 → a dedicated promotion lane, never a drive-by". The next
// lane that types an image path (the blog's PostCard, the team photo) promotes
// it to a type-only `lib/image-path` module and points all four at it.

/** The translated part of one review — every locale, or it does not compile. */
export type ReviewWords = Readonly<{
  /** The card's heading, e.g. „Încrederea regăsită". */
  title: string;
  /** The quoted body — BARE text; the card adds locale-correct quotation marks itself (board D6). */
  text: string;
  /** The procedure, e.g. „Fațete dentare" — the card shouts it in mono via CSS. */
  procedure: string;
}>;

export type Review = Readonly<{
  /** Stable, kebab-case, dot-free — the deck's React key and the aria-labelledby seed. */
  id: string;
  /** The patient's name as they consented to have it shown — locale-invariant. */
  name: string;
  /** The monogram shown when there is no picture, or when the picture fails to load. */
  initials: Initials;
  /** Whole or half stars, 0 to 5. */
  rating: Rating;
  /** Optional portrait under public/images/ (decorative, alt='') — the site's own go in public/images/reviews/, a test-enforced convention. */
  picture?: Readonly<{ src: `/images/${string}` }>;
  /** Title, text and procedure in all five locales. */
  words: Readonly<Record<Locale, ReviewWords>>;
}>;

/**
 * The owner's list. Add rows here — the types refuse a third initial, a 4.3 or
 * a missing language, and tests/unit/reviews-data.test.ts checks what only the
 * file system knows (the picture exists) and what a cast could smuggle past
 * the compiler.
 */
export const reviews: readonly Review[] = [];
