import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { Hero } from '@/components/sections/Hero/Hero';
import { ReviewsCarousel } from '@/components/sections/ReviewsCarousel/ReviewsCarousel';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { localeHref } from '@/i18n/href';
import { isLocale } from '@/i18n/locales';
import { clinicStats } from '@/lib/team/team';
import { populateDoctorShowcase, populateStats } from '../team/populate';
import { toStatTiles } from '../team/stat-tiles';
import { populateHero } from './populate';

// Home lives at /{locale} itself — never /{locale}/home (brief §5).
// FIVE real bands so far, and the two bands added on 2026-09-30 and
// 2026-10-01 stand in the OWNER'S order since 2026-10-01: "i need to swap
// these 2 sections between them … so first in cifre and then doctors" —
// the Hero, then the numbers, then the doctors, then the map. Both places
// had been the planner's picks, levers; this is the owner pulling them.
// Second, right under the Hero: the clinic's NUMBERS (sections/DoctorStats
// on the page ground — owner, verbatim: "i want it on home page too with
// just 3 components. experience, patients and nr of procedures"), the doctor
// page's „în cifre" band with its eyebrow and title at the start, no lead
// and lib/team's three `clinicStats` tiles; the same band closes the Team
// page's staff (owner, minutes later: "same component as on main page with
// the stats on the team page between map and helping staff"), and the swap
// is Home's alone — on the Team page the two bands are not neighbours.
// Third, between the numbers and the map: the DOCTORS band
// (sections/DoctorShowcase — owner, verbatim: "crete it as a section in the
// home page and in the personell page with heading and eyebrow smth in the
// direction of specialistii cu care ne mandrim familia premium smile"), the
// same band the Team page opens with, populated by the Team page's own walk
// (../team/populate.ts) and the Team page's own words (`team.showcase.*`).
// The other three, in the old site's order: the Hero FIRST — the
// opener, the whole first screen UNDER the Header pill (owner dispatch
// 2026-09-19, epic #103; pack round 2, 2026-09-20: the band pulls itself up
// by the pill's flow box on its own, Hero.tsx's STAGE paragraph — this page
// passes no spacing; the stub lines that stood here went with it, as this
// file always said they would) — the „Ne găsești" band late on the page
// (ClinicLocation board D3, owner 2026-09-09) — and the reviews deck BELOW
// the map (owner, 2026-09-20, the hero lane's round 4: "it should be below
// the map"; the old site's order too). The deck reads lib/reviews itself —
// the clinic's own Google reviews since 2026-09-30, which retired the demo
// rows that held the band's place from 2026-09-20 (ReviewsCarousel.tsx, AN
// EMPTY LIST) — and measures "how long ago" from the build's own clock, so
// this page passes it nothing.
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
// `home.hero.subtitle`, the stub's second line, was STRUCK from the five
// files on 2026-10-01 (the hero-photos lane, the owner's "discard dead
// code"): nothing had rendered it since the band arrived.
//
// No `params` plumbing: the locale reaches next-intl through the [locale]
// root param (src/i18n/request.ts, §15.16) — `getLocale` reads it.
// KEEP-IN-SYNC with ./Home.stories.tsx: this file is an async Server Component
// and cannot render in the browser runner, so the story twins its markup
// through `useTranslations`/`useLocale` and the same ./populate.ts (owner,
// 2026-09-06). The twin's plays pin the TWIN; ../page-twins.test.ts holds the
// two files' bands, in order, and the doctors band's props equal.

export default async function HomePage() {
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const tt = await getTranslations('team');
  const locale = await getLocale();
  if (!isLocale(locale))
    throw new Error(`home page: unknown locale "${locale}"`);

  const slides = populateHero(locale, (index, total) =>
    t('hero.slide', { index, total }),
  );

  // The doctors band's cards — the Team page's own walk and the Team page's
  // own words (`team.showcase.*`), so the band reads the same on both pages.
  const doctors = populateDoctorShowcase(
    locale,
    tt('showcase.profile'),
    (segments) => <Keywords segments={segments} />,
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
      {/* THE CLINIC'S NUMBERS (owner, 2026-10-01): the doctor page's „în
          cifre" band on the page ground, its eyebrow and title at the start
          like every Home band's, no lead, and three tiles — lib/team's
          `clinicStats` through the same walk and glyph map a doctor's page
          uses. The words are the doctor page's own keys, so the band reads
          the same on every page that carries it (the showcase's precedent).
          FIRST under the Hero, before the doctors — the owner's order, the
          header's opening paragraph. */}
      <DoctorStats
        ground="page"
        align="start"
        eyebrow={tt('doctor.stats.eyebrow')}
        title={tt('doctor.stats.title')}
        atLeast={tt('doctor.stats.atLeast')}
        tiles={toStatTiles(populateStats(locale, clinicStats))}
        format={new Intl.NumberFormat(locale).format}
      />
      <DoctorShowcase
        eyebrow={tt('showcase.eyebrow')}
        title={tt('showcase.title')}
        doctors={doctors}
      />
      <ClinicLocation />
      <ReviewsCarousel />
    </>
  );
}
