import type { HeroSlide } from '@/components/sections/Hero/Hero';
import type { Locale } from '@/i18n/locales';
import { heroSlides, type HeroSlideEntry } from '@/lib/hero-slides/hero-slides';

// app/[locale]/(home)/populate — THE walk from the typed slide list to the
// Hero band's finished props, in ONE language. Pure and React-free: a locale,
// a label formatter and (for tests) a list go in, `HeroSlide[]` comes out. No
// JSX, no next-intl import, no DOM — the services page's ./populate.ts
// shape, copied for the same three reasons that file argues:
//   · sections/Hero is a DUMB band (owner 2026-09-19: "I populate it with
//     path and text"), so somebody has to pick the visitor's words and turn
//     „{index} din {total}" into a sentence — the PAGE is that somebody;
//   · it cannot live in lib/hero-slides, whose return type would then have to
//     name a `sections/` type — the one arrow §4 forbids;
//   · it cannot be inline in page.tsx, because the story twin beside it
//     (./Home.stories.tsx) must perform the SAME mapping and cannot import an
//     async Server Component. One module both import is what keeps the
//     mapping written once.
//
// WHY A `formatLabel` CALLBACK AND NOT A `t`: the ICU sentence
// `home.hero.slide` is the page's to own (§8.1), and the two callers reach it
// through two next-intl APIs (`getTranslations` on the server,
// `useTranslations` in the story). A callback is the seam both satisfy, and
// it keeps this module free of next-intl — its test needs no provider.

/**
 * Turn the typed ring into the band's slides for ONE language: every word
 * picked in `locale`, every slide named through `formatLabel`.
 *
 * Ids and order pass through UNCHANGED — the first row is the LCP picture.
 *
 * @param locale the visitor's language, already narrowed by `isLocale` (the
 *   services page's precedent): indexing a `Record<Locale, …>` with an
 *   unchecked string is a cast that type-checks a typo as happily as a locale.
 * @param formatLabel 1-based index + total → the slide's (and its bead's)
 *   accessible name, lib/rotation's one sentence with two uses.
 * @param slides the list to walk. Defaults to the real ring, so the shipping
 *   caller passes two arguments and only tests pass a fixture.
 */
export function populateHero(
  locale: Locale,
  formatLabel: (index: number, total: number) => string,
  slides: readonly HeroSlideEntry[] = heroSlides,
): readonly HeroSlide[] {
  const total = slides.length;
  return slides.map((slide, index) => {
    const words = slide.words[locale];
    return {
      id: slide.id,
      src: slide.picture.src,
      alt: words.alt,
      title: words.title,
      label: formatLabel(index + 1, total),
    };
  });
}
