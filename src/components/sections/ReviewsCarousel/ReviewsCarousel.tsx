import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Container } from '@/components/ui/Container/Container';
import { defaultLocale, locales, type Locale } from '@/i18n/locales';
import { reviews as siteReviews, type Review } from '@/lib/reviews/reviews';
import {
  ReviewsDeck,
  type ReviewSlide,
  type ReviewsDeckLabels,
} from './ReviewsDeck';

// sections/ReviewsCarousel — the „Părerea ta contează" band: the eyebrow/title
// opener over a deck of patient reviews that rotates on its own. Built to the
// owner-approved N3 composition contract (master board fb-432…448, dossier
// .claude/section-runs/2026-09-10_17-01_reviews-carousel/sections/
// ReviewsCarousel.md, approved 2026-09-10) out of the old site's
// composite/reviews-carousel and its Home mount.
//
// ── THIS FILE IS THE SERVER HALF (§16). It reads the review list at BUILD
// time, resolves every string through next-intl and hands ReviewsDeck — the
// island beside it — finished props. Nothing of next-intl reaches the browser,
// and the only JavaScript this band costs a page is the rotation itself. It
// calls t() with no directive because next-intl's useTranslations and
// useLocale are ISOMORPHIC: they resolve against the request-scoped config
// while this Server Component is pre-rendered, and read
// NextIntlClientProvider in Storybook and Vitest (the ClinicLocation/Footer
// precedent). ReviewsCarousel.test.tsx's ?raw guard pins the directive's
// absence mechanically, because no runtime assertion can see one.
//
// ── AN EMPTY LIST RENDERS NOTHING (owner D15). lib/reviews ships EMPTY: the
// twelve testimonials the old site displayed were fabricated demo copy and
// never entered this repo, and the real ones are the owner's to supply, each
// with the patient's written consent (a name plus a procedure is health data,
// GDPR art. 9) and the CMSR testimonial check. A heading over an empty deck is
// worse than no band, so `null` is the honest answer — and it is TODAY's
// answer, which is also why the Home page does not mount this band yet.
//
// ── THE `reviews` PROP IS THE STORY/TEST SEAM (board D18), not a
// configuration knob. It defaults to the site list, so the page mount will
// read `<ReviewsCarousel />`; stories and tests pass fabricated rows instead of
// putting demo copy into shipped data. That is the whole reason the review
// WORDS live in the typed list rather than in `home.reviews.items.*` message
// keys: a story cannot fabricate a message key without shipping it to five
// locales, and the translation-parity test cannot tie an id's keys to the row
// that needs them. Reviews are CONTENT (§15.17), the way blog posts are
// content in MDX; this band's own chrome — the opener, the control names, the
// slide and rating formats — stays in `home.reviews.*`, where UI strings live.
//
// ── WHAT CROSSES THE BOUNDARY, AND WHAT CANNOT. Only serializable values:
// strings, numbers, plain objects. The per-slide "{index} of {total}" names
// are therefore PRE-RENDERED here (a formatter is a function), and so is the
// rating's sentence — „4,5 din 5 stele" through `{rating, number}`, which is
// what puts the comma in ro/de/fr/it and the point in en (§8.3). The card
// never sees the number and this file never formats by hand.
//
// ── THE BAND SHELL is ui/Container's PAGE-BAND RECIPE, unchanged: a
// full-bleed semantic <section> owning the paint, a Container owning the width
// and the container-query context, and a rhythm box one level in owning the
// vertical steps (an element cannot query its OWN size, so the stepped `py`
// cannot ride on Container itself — sections/ClinicLocation's D7). NO outer
// margin: the page owns the rhythm between bands (§6.4). The old Home wrapped
// this block in its own `pl-[clamp(48px,10vw,200px)]` gutter; that spelling is
// gone, because ui/Container is the site's ONE gutter definition (§15.15 a).
//
// ── ONE DELIBERATE BREACH OF THAT RECIPE, AND ITS BELT (owner 2026-09-12,
// pack round 2). The deck's STAGE — the slides' clipping box, nothing else —
// runs under the gutters, edge to edge, the way the old deck did: on a phone
// the gutter box is 312px and a card that must let its neighbours peek needs
// the whole 390. ReviewsDeck.tsx does it with the full-bleed margin idiom
// (`calc(50% − 50vw)`, its STAGE paragraph), which copies no gutter
// expression here — ui/Container stays the ONE definition. The heading above
// and the buttons below keep the gutter. The BELT is this band's own
// `overflow-x-clip`: a stage 100vw wide overshoots the visible width by a
// classic scrollbar's thickness, and the band is the full-bleed box that
// swallows it, so the PAGE never scrolls sideways (§7) — the stories assert
// that on the document itself. Behind a `@supports not (overflow: clip)`
// gate the same belt is spelled `overflow-x-hidden` for Safari ≤ 15, which
// does not know `clip` (G3 react M1; the band test pins both tokens).

/**
 * The `aria-labelledby` target. Hard-coded like ClinicLocation's HEADING_ID and
 * for the same reason: exactly ONE instance of this band exists per page, so a
 * generated id would only make the pair harder to keep in step.
 */
const HEADING_ID = 'reviews-heading';

/**
 * THE RHYTHM (owner D11 — "pick whatever, we'll see"; recomputed against the
 * WHOLE CARD after the G2 a11y round, 2026-09-10; then the owner's own eye at
 * pack round 2, 2026-09-12: "the iteration is too fast" at 16 s).
 *
 * The reading-time rider lib/rotation's header makes every dossier answer: a
 * slide is not its body alone. A screen reader — and an eye — takes in the
 * review's title, the quoted body, the patient's name, the procedure line AND
 * the star rating's sentence („4,5 din 5 stele"). The longest fixture this
 * deck was drawn around, the German stress row, totals 41 words that way,
 * i.e. 41 ÷ 150 × 60 ≈ 16.4 s at the ~150 words per minute an older audience
 * reads at (§9). Sixteen seconds was that number rounded, and the owner found
 * it hurried. THIRTY is the same arithmetic with the two allowances sixteen
 * did not make: a slower reader (≈ 120 wpm → 20.5 s) and the seconds spent
 * FINDING the card, the stars and the name before the reading starts. It is
 * still a fifth of the old deck's failure mode per word (6 s for the same
 * card).
 *
 * RECORDED TRIGGER: when the owner's REAL reviews land, count the whole card
 * again; anything past ~60 words re-opens this number rather than being
 * silently outrun. The hover suspension, the keyboard entry and a hand on
 * the deck (ReviewsDeck.tsx's NO ROTATION CONTROL paragraph) are the floor
 * under that, never a substitute for it.
 */
export const REVIEWS_INTERVAL_MS = 30_000;

/**
 * The FIRST dwell — longer than the interval on purpose (lib/clock's
 * `startDelayMs` exists to lengthen it): the opening slide is the one every
 * visitor lives through while their eye is still travelling down from the
 * heading, so it gets the reading time PLUS the journey.
 */
export const REVIEWS_FIRST_DWELL_MS = 34_000;

export type ReviewsCarouselProps = {
  /**
   * The reviews to show, newest first. Defaults to the site list in
   * lib/reviews — the seam stories and tests use to render fabricated rows
   * without putting demo copy into shipped data (board D18). An empty list
   * renders NOTHING at all.
   */
  reviews?: readonly Review[];
};

export function ReviewsCarousel({
  reviews = siteReviews,
}: ReviewsCarouselProps): ReactElement | null {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const locale = useLocale();

  // Every hook first: the empty-list exit below is a conditional RETURN, never
  // a conditional hook.
  if (reviews.length === 0) return null;

  // useLocale() hands back a plain `string` under the default config (the
  // src/i18n/href.ts and lib/routes precedent). `find` over the manifest hands
  // back the manifest's OWN value, so `words[…]` is indexed by a real `Locale`
  // with no cast — the src/i18n/match.ts idiom. The fallback is unreachable on
  // the built site (only manifest locales are pre-rendered) and is spelled
  // anyway, because a `Record` lookup on an unexpected key would hand the card
  // `undefined` and crash the band rather than show Romanian.
  const pageLocale: Locale =
    locales.find((candidate) => candidate === locale) ?? defaultLocale;

  // ONE map, and every finished string a slide needs is on the slide (G2 ts 2):
  // a second array of names in the same order would be a second thing to keep
  // in step, and the first filter or sort applied to either would misname every
  // review after it.
  const slides: readonly ReviewSlide[] = reviews.map((review, index) => {
    const words = review.words[pageLocale];
    return {
      id: review.id,
      // The slide's own accessible name — pre-rendered here because ICU
      // formatting is a function and functions cannot cross the boundary.
      label: t('reviews.slide', { index: index + 1, total: reviews.length }),
      initials: review.initials,
      // Decorative: the card prints the patient's name two lines below, so a
      // named portrait would announce the same person twice (ui/Avatar D-A1).
      picture: review.picture
        ? { src: review.picture.src, alt: '' }
        : undefined,
      rating: review.rating,
      ratingLabel: t('reviews.rating', { rating: review.rating }),
      title: words.title,
      body: words.text,
      name: review.name,
      procedure: words.procedure,
    };
  });

  // `satisfies`, not an annotation (G2 ts 10): the object is checked against
  // the island's own type HERE — a renamed or dropped label fails in this file
  // rather than at the call site below — while each member keeps its literal
  // string type instead of widening.
  const labels = {
    region: t('reviews.region'),
    // The two keys lib/rotation's law reserves for every rotator on this site
    // (§15.18): ARIA requires a roledescription to be localized, so „carusel"
    // and „slide" are message keys like everything else a visitor hears.
    role: tc('carousel.role'),
    slideRole: tc('carousel.slideRole'),
    previous: t('reviews.previous'),
    next: t('reviews.next'),
  } satisfies ReviewsDeckLabels;

  return (
    // Full-bleed band, per Container's PAGE-BAND RECIPE: the semantic outer
    // owns the paint, the Container inside owns the width and the container
    // context every @-step below queries. `overflow-x-clip` is the belt under
    // the deck's edge-to-edge stage (the header's ONE DELIBERATE BREACH).
    <section
      aria-labelledby={HEADING_ID}
      // `overflow-x-clip` is the belt; the `supports-[not_(overflow:clip)]`
      // twin is its legacy fallback (G3 react M1): Safari ≤ 15 — the very
      // engine ui/Card's colour fallback serves — drops an unknown `clip` and
      // would let the edge-to-edge stage scroll the whole page sideways (§7).
      // `hidden` ONLY behind that gate: emitted bare it would win on every
      // engine (Tailwind orders it after `clip`) and turn the band into a
      // scroll container.
      className="overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden bg-page"
    >
      <Container>
        {/* The rhythm box — band-owned `py` on container steps, plus the ONE
            gap between the opener and the deck (§6.4: the section owns its
            children's spacing, and neither child brings a margin). */}
        <div className="flex flex-col gap-8 py-12 @lg:py-16 @3xl:py-20">
          {/* The id lands on the <h2> — the half of the aria-labelledby pair
              the <section> above points at, and what turns this band into a
              named region rather than a generic box. The page owns its one
              <h1> (§9); a band opens at 2. */}
          <SectionHeading
            eyebrow={t('reviews.eyebrow')}
            title={t('reviews.title')}
            id={HEADING_ID}
            align="start"
          />
          <ReviewsDeck
            slides={slides}
            labels={labels}
            intervalMs={REVIEWS_INTERVAL_MS}
            startDelayMs={REVIEWS_FIRST_DWELL_MS}
          />
        </div>
      </Container>
    </section>
  );
}
