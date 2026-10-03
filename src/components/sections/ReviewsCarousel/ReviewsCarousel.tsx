import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { defaultLocale, locales, type Locale } from '@/i18n/locales';
import { cx } from '@/lib/cx/cx';
import { reviews as siteReviews, type Review } from '@/lib/reviews/reviews';
import { formatTimeAgo } from '@/lib/time-ago/time-ago';
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
// ── THE DEFAULT IS THE SITE LIST, AND AN EMPTY LIST RENDERS NOTHING (owner
// D15). The band reads lib/reviews — since 2026-09-30 the clinic's own Google
// reviews, each under the owner's gates: the patient's consent to be named (a
// name beside a dental review is health data, GDPR art. 9) and the CMSR check
// of what the quote says. From 2026-09-20 to that day the site list was empty
// and the default fell back to five fabricated demo rows, so that the band's
// place on Home showed (owner, the hero lane's round 4: "it should be below
// the map"); the first real review retired that fallback, and on 2026-10-01
// the demo rows themselves were dropped from the stories and tests too (owner:
// "all fabricated ones need to be dropped") — they render the real list now,
// and ReviewsCarousel.fixtures.ts holds only their pinned clock, which no
// runtime file imports (ReviewsCarousel.test.tsx's ?raw guard). A heading
// over an empty deck is still worse than no band, so an empty list — the
// site's, or one a caller passes — renders `null`.
//
// ── THE `reviews` PROP IS THE STORY/TEST SEAM (board D18), not a
// configuration knob. It defaults to the site list, so the page mount reads
// `<ReviewsCarousel />`; stories and tests pass a slice of the real list —
// or, for a shape the list cannot give, a placeholder row that says plainly
// what it is — and never put copy into shipped data. That is the whole reason
// the review WORDS live in the typed list rather than in
// `home.reviews.items.*` message keys: a story cannot fabricate a message key
// without shipping it to five locales, and the translation-parity test cannot
// tie an id's keys to the row that needs them. Reviews are CONTENT (§15.17),
// the way blog posts are content in MDX; this band's own chrome — the opener,
// the control names, the slide and rating formats — stays in
// `home.reviews.*`, where UI strings live. `now` is the same kind of seam for
// the clock (its doc below).
//
// ── WHAT CROSSES THE BOUNDARY, AND WHAT CANNOT. Only serializable values:
// strings, numbers, plain objects. The per-slide "{index} of {total}" names
// are therefore PRE-RENDERED here (a formatter is a function), and so is the
// rating's sentence — „4,5 din 5 stele" through `{rating, number}`, which is
// what puts the comma in ro/de/fr/it and the point in en (§8.3) — and so is
// the date line's phrase — „acum 2 ani" / "2 years ago" / „vor 2 Jahren"
// through lib/time-ago's `formatTimeAgo`, i.e. Intl.RelativeTimeFormat
// (§8.3 again), measured from `now`. The day itself crosses beside it as its
// plain `YYYY-MM-DD` string, which the card prints as `<time dateTime>`. The
// card never sees the number and this file never formats by hand.
//
// ── THE BAND SHELL is ui/Container's PAGE-BAND RECIPE: a full-bleed semantic
// <section> owning the paint, a Container owning the width and the
// container-query context, and the vertical steps one level in (an element
// cannot query its OWN size, so a stepped padding cannot ride on Container
// itself — sections/ClinicLocation's D7). Since 2026-10-02 the steps sit on
// TWO boxes where they sat on one (THE OPENER'S SCALE, below): the RHYTHM box
// — the flex column the opener and the deck stack in — owns the band's BOTTOM
// step, under the deck; the OPENER box inside it owns the TOP step and the
// one space between the heading and the deck, as its own `pb-8` — the 32px
// the rhythm box's `gap-8` used to be (§6.4: the band owns its children's
// spacing, and neither child brings a margin). Below the regime the two boxes
// lay out as the one `flex flex-col gap-8 py-12 @lg:py-16 @3xl:py-20` box
// did, to the pixel: the same step above the eyebrow, the same 32px under the
// h2, the same step under the deck. NO outer margin: the page owns the rhythm
// between bands (§6.4). The old Home wrapped this block in its own
// `pl-[clamp(48px,10vw,200px)]` gutter; that spelling is gone, because
// ui/Container is the site's ONE gutter definition (§15.15 a).
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
//
// ── THE OPENER'S SCALE, AND ONLY THE OPENER'S (2026-10-02, CLAUDE.md §15.32;
// ui/Container's THE BAND SCALE). On a laptop or a desktop every band under
// the Home hero now draws in ONE design pixel — its column ÷ 1106, the column
// of the owner's 1401-wide window — so that every eyebrow and every h2 on the
// page read one size and stand on one left edge. For this band the owner drew
// the line himself, verbatim: "And then there is the reviews carrousell which
// you will not touch under any circumstance, it is already responsive BUT
// it's heading and eyebrow isnt. so that heading + eyebrow must be taken care
// of and always be in corcondance of offset and height with other headings
// and eyebrows on the page." So ui/Container's two band-scale strings ride the
// OPENER box (`OPENER_BOX` below) and nothing else:
//   · IN THE REGIME — a mouse or trackpad, an engine that registers custom
//     properties, a column of max(56rem, 896px) — the opener box declares the
//     design pixel s and redraws every theme length on it and inside it in
//     that pixel: the eyebrow 14 × s, the h2 36 × s, the 8px between them
//     8 × s, the top step 80 × s and the 32px under the h2 32 × s — the
//     numbers every other band's opener reads at the same width. Past a
//     1536px column (a 1920 window's) the box caps at 96rem and centres, on
//     the one left edge every scaled band shares.
//   · THE DECK — stage, cards, buttons, every word on a card — is the opener
//     box's SIBLING in the rhythm box, never its child, so it inherits no
//     design pixel: its cards keep their rem sizes and its stage its shares of
//     the screen (ReviewsDeck.tsx's STAGE paragraph) at every width. It moves
//     down the page by however much the opener grows, and changes by no pixel
//     itself. The stage's full-bleed margins still resolve against the
//     Container's box and its `@md` step still queries the Container: the
//     opener box is no container.
//   · BELOW THE STEP, ON EVERY TOUCH DEVICE AND IN AN ENGINE THAT CANNOT
//     REGISTER, nothing is declared and nothing remapped: the band is the one
//     box of before, to the pixel (THE BAND SHELL above) — phones and tablets
//     unchanged.
// WHERE THE STRINGS RIDE, AND WHY NOT ON THE RHYTHM BOX. ui/Container's recipe
// rule 5 puts them on a scaling band's RHYTHM box, the box that carries its
// `py` — written for a band that scales whole. This one scales its opener
// alone, and its rhythm box holds the deck, so the strings ride one box
// further in. What that costs is named here: the band's TOP step scales with
// the opener (the space between the band above and this eyebrow is the one
// every band shares), its BOTTOM step stays rem (it is the deck's floor).
// `w-full` (inside `bandColumnClasses`) is load-bearing on this box: the
// opener box is a FLEX item of the rhythm box's column, where `mx-auto` alone
// would shrink it to its text and centre the heading (ui/Container's THE BAND
// SCALE, its second bullet). The band takes no switch: its one page is Home,
// and Home scales.

/**
 * The `aria-labelledby` target. Hard-coded like ClinicLocation's HEADING_ID and
 * for the same reason: exactly ONE instance of this band exists per page, so a
 * generated id would only make the pair harder to keep in step.
 */
const HEADING_ID = 'reviews-heading';

/**
 * THE RHYTHM BOX (the header's THE BAND SHELL): the flex column the opener box
 * and the deck stack in, and the band's BOTTOM step on container steps. It
 * never wears the band scale — the deck is inside it (THE OPENER'S SCALE) — so
 * the step under the deck is rem at every width. ONE static string: Tailwind
 * reads class names from source text.
 */
const RHYTHM_BOX = 'flex flex-col pb-12 @lg:pb-16 @3xl:pb-20';

/**
 * THE OPENER BOX (the header's THE OPENER'S SCALE): the band's TOP step, the
 * 32px between the heading and the deck as its own bottom padding (the old
 * rhythm box's `gap-8`), and ui/Container's two band-scale strings — the
 * column (cap and centring) and the scale (design pixel and remap) — imported
 * whole, never spelled here (tests/unit/design-scale.test.ts holds every
 * wearer to an import of them). Below the regime the strings declare nothing
 * and the box adds nothing to the old single box's layout.
 */
const OPENER_BOX = cx(
  'pt-12 pb-8 @lg:pt-16 @3xl:pt-20',
  bandColumnClasses,
  bandScaleClasses,
);

/**
 * THE RHYTHM (owner D11 — "pick whatever, we'll see"; recomputed against the
 * WHOLE CARD after the G2 a11y round, 2026-09-10; then the owner's own eye at
 * pack round 2, 2026-09-12: "the iteration is too fast" at 16 s).
 *
 * The reading-time rider lib/rotation's header makes every dossier answer: a
 * slide is not its body alone. A screen reader — and an eye — takes in the
 * review's title, the quoted body, the patient's name, the date line AND
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
 * silently outrun. FIRED 2026-09-30, the day the clinic's own Google reviews
 * landed, and counted again on the list the owner approved on 2026-10-01 —
 * the same way: title, body, name, date line and the rating's sentence. The
 * tallest card runs to about 65–72 words (72 in French), i.e. 26–29 s at
 * 150 wpm (32–36 s at 120) against the 5.5 s it is shown for; the shortest
 * runs to 18 words, 7.2 s. The number is NOT changed here: the deck's rhythm
 * is the owner's call since the hero lane's round 6 (§15.21 — the SUPERSEDED
 * paragraph below), and the decision is OPEN — the arithmetic goes back to
 * the owner, recorded rather than silently outrun.
 *
 * SUPERSEDED 2026-09-20 (owner, the hero lane's round 6: "why … are the
 * reviews not autoscrolling like a circular list like … the slides with
 * images and heading"): the deck now keeps THE HERO'S OWN RHYTHM — 5.5 s, the
 * old site's number — and the arithmetic above is recorded, not applied. The
 * owner watched a 30 s deck and saw a deck that never moved.
 */
export const REVIEWS_INTERVAL_MS = 5_500;

/**
 * The FIRST dwell: 1.5 s, the hero's — the first change is seen at once
 * (owner, 2026-09-20; the 34 s "reading time plus the journey" is history).
 */
export const REVIEWS_FIRST_DWELL_MS = 1_500;

export type ReviewsCarouselProps = {
  /**
   * The reviews to show, newest first. Defaults to the site list in
   * lib/reviews, alone — the seam stories and tests use to render a slice of
   * that list, or a placeholder row that says plainly what it is, without
   * putting anything into shipped data (board D18). An empty list renders
   * NOTHING at all.
   */
  reviews?: readonly Review[];
  /**
   * The moment "how long ago" is measured from. By default it is the render's
   * own clock, which on the static site is `next build`: every rebuild
   * refreshes the phrase, and nothing is recomputed in the browser. Stories
   * and tests pin it (the fixtures' REVIEWS_NOW) so a baseline never ages.
   * lib/time-ago's WHEN "NOW" IS paragraph has the reasoning; a review dated
   * after `now` throws there, loudly, at build.
   */
  now?: Date;
};

export function ReviewsCarousel({
  reviews = siteReviews,
  now = new Date(),
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
      postedOn: review.postedOn,
      // The date line's words, finished HERE for the rating sentence's reason
      // (the header's WHAT CROSSES THE BOUNDARY): a formatter is a function.
      postedAgo: formatTimeAgo(pageLocale, review.postedOn, now),
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
        {/* The rhythm box — the column the opener and the deck stack in, and
            the band's bottom step under the deck; never scaled, because the
            deck is inside it (the header's THE BAND SHELL). */}
        <div className={RHYTHM_BOX}>
          {/* The opener box — the band's top step and the ONE space between
              the opener and the deck, as its own bottom padding (§6.4: the
              section owns its children's spacing, and neither child brings a
              margin) — and the only box here that wears ui/Container's band
              scale, so the eyebrow and the h2 match every band under the
              Hero in size and left edge (the header's THE OPENER'S SCALE). */}
          <div className={OPENER_BOX}>
            {/* The id lands on the <h2> — the half of the aria-labelledby
                pair the <section> above points at, and what turns this band
                into a named region rather than a generic box. The page owns
                its one <h1> (§9); a band opens at 2. */}
            <SectionHeading
              eyebrow={t('reviews.eyebrow')}
              title={t('reviews.title')}
              id={HEADING_ID}
              align="start"
            />
          </div>
          {/* The deck — the opener box's SIBLING, never its child: it
              inherits no design pixel and keeps its rem sizes at every width
              (the owner: "you will not touch under any circumstance"). */}
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
