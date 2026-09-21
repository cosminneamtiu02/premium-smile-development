import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { Hero } from '@/components/sections/Hero/Hero';
import { ReviewsCarousel } from '@/components/sections/ReviewsCarousel/ReviewsCarousel';
import { localeHref } from '@/i18n/href';
import { isLocale } from '@/i18n/locales';
import { populateHero } from './populate';

// Home lives at /{locale} itself — never /{locale}/home (brief §5).
// Three real bands so far, in the old site's order: the Hero FIRST — the
// opener, the whole first screen UNDER the Header pill (owner dispatch
// 2026-09-19, epic #103; pack round 2, 2026-09-20: the band pulls itself up
// by the pill's flow box on its own, Hero.tsx's STAGE paragraph — this page
// passes no spacing; the stub lines that stood here went with it, as this
// file always said they would) — the „Ne găsești" band late on the page
// (ClinicLocation board D3, owner 2026-09-09) — and the reviews deck BELOW
// the map (owner, 2026-09-20, the hero lane's round 4: "it should be below
// the map"; the old site's order too). The deck reads lib/reviews itself and,
// while that list is empty, shows the first five of lib/reviews' demo rows —
// the Storybook "Five" story, on the owner's round-5 word (ReviewsCarousel.tsx,
// AN EMPTY LIST) — this page passes it nothing.
// ServicesTeaser and CTABanner still slot around them in their own lanes
// (§14).
//
// THIS PAGE IS THE HERO'S ONE POPULATOR (the services page's precedent):
// sections/Hero is a DUMB band — no keys, no data, no `t()` — so the page
// narrows the locale, walks lib/hero-slides for that language through
// ./populate.ts, formats the „{index} din {total}" sentence once per slide
// and builds the services link with `localeHref` (§15.13). The two message
// keys lib/rotation's law reserves for every rotator (`common.carousel.*`)
// are read here too.
//
// THE OUTLINE ROOT is the page's, `sr-only`, OUTSIDE the band — lib/
// rotation's law ("one static h1, outside the slides"; a per-slide h1 would
// replace the page's only heading every seven seconds) and the Services
// page's own shape. The slogans inside the band are display text on a <p>.
// `home.hero.subtitle` is no longer rendered anywhere — it was the stub's
// second line; the key stays in the five files until the owner strikes it.
//
// No `params` plumbing: the locale reaches next-intl through the [locale]
// root param (src/i18n/request.ts, §15.16) — `getLocale` reads it.
// KEEP-IN-SYNC with ./Home.stories.tsx: this file is an async Server Component
// and cannot render in the browser runner, so the story twins its markup
// through `useTranslations`/`useLocale` and the same ./populate.ts, and pins
// it (owner, 2026-09-06).

export default async function HomePage() {
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  if (!isLocale(locale))
    throw new Error(`home page: unknown locale "${locale}"`);

  const slides = populateHero(locale, (index, total) =>
    t('hero.slide', { index, total }),
  );

  return (
    <>
      <h1 className="sr-only">{t('hero.title')}</h1>
      <Hero
        slides={slides}
        labels={{
          region: t('hero.region'),
          role: tc('carousel.role'),
          slideRole: tc('carousel.slideRole'),
          picker: t('hero.picker'),
          contact: t('hero.contact'),
          services: t('hero.services'),
        }}
        servicesHref={localeHref(locale, '/services')}
      />
      <ClinicLocation />
      <ReviewsCarousel />
    </>
  );
}
