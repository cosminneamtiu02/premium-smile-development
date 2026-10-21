import type { BlogCarouselProps } from '@/components/sections/BlogCarousel/BlogCarousel';
import type { HeroSlide } from '@/components/sections/Hero/Hero';
import type { Locale } from '@/i18n/locales';
import {
  posts as SITE_POSTS,
  postsIn,
  type BlogPostEntry,
} from '@/lib/blog/blog';
import { heroSlides, type HeroSlideEntry } from '@/lib/hero-slides/hero-slides';
import { postCard } from '../blog/populate';

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

// ── THE ARTICLES BAND (2026-10-17, the owner: "the fiver option should als
// look and behave the same but is jsut a wider section. maybe as wide as the
// screen. do not represent it in the article, represent it on home page tih
// cards that reference articles. place it below th in numbers category and
// above "Specialiștii cu care ne mândrim""). sections/BlogCarousel is DUMB
// like every Home band: this walk hands it every post of the blog in the
// page's language, newest first (lib/blog's `postsIn`), each as the SAME
// card the blog's list prints (../blog/populate.ts' `postCard` — its link,
// its author, its reading time), one name per card for the carousel and its
// progress dots („Articolul 3 din 12"), and the band's own words. The words
// come through ONE mapping, `blogCarouselWordsFrom`, which the page calls
// with `getTranslations`' translators and the story twin with
// `useTranslations`', so the two cannot word the band two ways — three
// namespaces: the band's own `home.articles`, the cards' `blog` words (the
// list's: its tags' name, „Citește mai mult…", the reading time) and the
// site's carousel roledescriptions from `common`.

/** Every word the articles band says — finished, but the two sentences that
 *  take a number, which are functions here. */
export type BlogCarouselWords = Readonly<{
  eyebrow: string;
  title: string;
  region: string;
  role: string;
  slideRole: string;
  previous: string;
  next: string;
  /** The progress dots' group name — „Alege articolul". */
  picker: string;
  /** „Articolul {index} din {total}" — a card's name and its dot's. */
  slide: (index: number, total: number) => string;
  tags: string;
  readMore: string;
  readingTime: (minutes: number) => string;
}>;

/** The `home` keys the band reads, in ONE call shape — the article route's
 *  `ArticleTranslate` precedent: next-intl's translator over TYPED messages
 *  (./populate.test.ts builds them) cannot be related to an overload set,
 *  and it fits one shape; which argument each sentence takes is pinned
 *  against the real messages instead. */
export type HomeArticlesTranslate = (
  key:
    | 'articles.eyebrow'
    | 'articles.title'
    | 'articles.region'
    | 'articles.previous'
    | 'articles.next'
    | 'articles.picker'
    | 'articles.slide',
  values?: Readonly<{ index: number; total: number }>,
) => string;

/** The `blog` keys the band's cards read — the list's own card words, in
 *  the same one call shape. */
export type BlogCardTranslate = (
  key: 'tags' | 'card.readMore' | 'readingTime',
  values?: Readonly<{ minutes: number }>,
) => string;

/** The `common` keys — the site's one carousel vocabulary. */
export type CarouselRoleTranslate = (
  key: 'carousel.role' | 'carousel.slideRole',
) => string;

/** The band's words from its three translators — the ONE mapping (the
 *  header's THE ARTICLES BAND). */
export function blogCarouselWordsFrom(
  home: HomeArticlesTranslate,
  blog: BlogCardTranslate,
  common: CarouselRoleTranslate,
): BlogCarouselWords {
  return {
    eyebrow: home('articles.eyebrow'),
    title: home('articles.title'),
    region: home('articles.region'),
    role: common('carousel.role'),
    slideRole: common('carousel.slideRole'),
    previous: home('articles.previous'),
    next: home('articles.next'),
    picker: home('articles.picker'),
    slide: (index, total) => home('articles.slide', { index, total }),
    tags: blog('tags'),
    readMore: blog('card.readMore'),
    readingTime: (minutes) => blog('readingTime', { minutes }),
  };
}

/**
 * The articles band's props in `locale` (the header's THE ARTICLES BAND):
 * every post of `list` in that language, newest first, as the blog's own
 * cards, named one by one, and the band's words.
 * @param list the posts to show. Defaults to the blog's, so the page passes
 *   two arguments and only tests pass a fixture.
 */
export function populateBlogCarousel(
  locale: Locale,
  words: BlogCarouselWords,
  list: readonly BlogPostEntry[] = SITE_POSTS,
): BlogCarouselProps {
  const posts = postsIn(locale, list);
  return {
    eyebrow: words.eyebrow,
    title: words.title,
    labels: {
      region: words.region,
      role: words.role,
      slideRole: words.slideRole,
      previous: words.previous,
      next: words.next,
      picker: words.picker,
    },
    posts: posts.map((post) => postCard(locale, post, words.readingTime)),
    slideLabels: posts.map((_, index) => words.slide(index + 1, posts.length)),
    tagsLabel: words.tags,
    readMore: words.readMore,
  };
}
