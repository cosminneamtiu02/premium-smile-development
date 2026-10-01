import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { Header } from '@/components/sections/Header/Header';
import { Hero } from '@/components/sections/Hero/Hero';
import { ReviewsCarousel } from '@/components/sections/ReviewsCarousel/ReviewsCarousel';
import { REVIEWS_NOW } from '@/components/sections/ReviewsCarousel/ReviewsCarousel.fixtures';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { reviews } from '@/lib/reviews/reviews';
import { clinicStats, doctors } from '@/lib/team/team';
import { localeHref } from '@/i18n/href';
import { isLocale } from '@/i18n/locales';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateDoctorShowcase, populateStats } from '../team/populate';
import { toStatTiles } from '../team/stat-tiles';
import { populateHero } from './populate';

// Pages/Home — the page as it actually ships: the Hero opener (the site's
// second rotator, owner dispatch 2026-09-19, epic #103) over the clinic's
// NUMBERS (sections/DoctorStats on the page ground, owner 2026-10-01: "i want
// it on home page too with just 3 components. experience, patients and nr of
// procedures" — the doctor page's „în cifre" band, its eyebrow and title at
// the start, no lead, lib/team's three `clinicStats` through
// ../team/populate.ts' `populateStats` and ../team/stat-tiles.tsx, the Team
// page's band prop for prop) over the DOCTORS band (sections/DoctorShowcase,
// owner dispatch 2026-09-30 — the band the Team page opens with, populated by
// the Team page's own walk, ../team/populate.ts) — numbers first, doctors
// second, the owner's order since 2026-10-01 ("so first in cifre and then
// doctors", ./page.tsx's header) — over the „Ne găsești"
// band (owner 2026-09-09, board D3) over the reviews deck (mounted
// 2026-09-20 on the owner's word — the hero lane's rounds 4–5 — over the
// clinic's own Google reviews since 2026-09-30), in the old site's order.
// ServicesTeaser and CTABanner still arrive with their own lanes (§14); this
// story photographs what ships, not a wish. The band's live Google iframe is
// fenced in the visual net (tests/visual/stories.spec.ts) and photographs as
// its tray.
//
// KEEP-IN-SYNC with ./page.tsx BESIDE this file: that page is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no
// browser runner can execute — the shell.test.tsx / Pages/NotFound precedent
// — so the twin below renders the same markup through the isomorphic
// `useTranslations`/`useLocale` and the SAME ./populate.ts (one mapping,
// never twinned by hand), and the play function pins it from the outside.
//
// TWO STORIES NOW, Romanian and German — §13's RO + DE page tier, which the
// stub deferred "until the real page lane": a serif slogan of up to 107px in
// German (the `hero` step's desktop value since 2026-10-01) is the
// text-expansion case this page has. `Pages/*` photographs both at all six
// widths.
//
// THE CLOCK IS THE REAL ONE, as on the page (functions cannot cross the
// server→client boundary, so the page never passes lib/clock's env seam and
// neither does its twin — a twin that slowed the ring would not be the page).
// What keeps the baselines still is the harness: the visual projects run
// with `reducedMotion: 'reduce'` (playwright.config.ts — the lever G2 react
// named on 2026-09-19, taken on the hero lane's round 3, 2026-09-20), under
// which lib/clock declines every automatic start, so each rotator's first
// frame is still by construction. The Vitest storybook project has no such
// preference and sees the running band.
//
// The ContactModalProvider decorator is the shell's, in miniature: the Hero's
// primary button is a ContactModalTrigger, which THROWS outside a provider by
// design (useContactModal names the missing wrapper rather than shipping a
// dead button) — the Header.stories precedent.
//
// THE HEADER IS MOUNTED TOO (pack round 2, owner 2026-09-20) — the first page
// story to compose the shell's pill, because this page's first band slides
// UNDER it: the Hero pulls itself up by the pill's flow box (Hero.tsx's STAGE
// paragraph) and assumes that box is above it. Without the Header the twin
// would clip its first 98px; with it, the story shows what ships — the glass
// pill floating over the first photograph. The other page stories keep
// rendering their bands alone: nothing in them depends on the pill.
//
// layout 'fullscreen' on purpose — both bands are full-bleed and own their
// gutters through ui/Container; Storybook's default padding would photograph
// an inset the site does not have.

/**
 * Every picture ASKED FOR, then waited on — the Team twin's `settled`, for the
 * same reason (2026-09-30): most pictures on this page ship `loading="lazy"`,
 * and a lazy picture far below the window is never STARTED by the browser.
 * This page is the longest on the site and the pixel net photographs all of
 * it: with two doctors every card is within the browser's reach, but the
 * clinic's real roster is six, and from the fourth or fifth card on the
 * cutouts would be left out of the picture (G2 react, measured: Chromium's
 * lazy distance is 3 000px). Flipping `loading` to eager is HTML's own
 * resumption of a deferred load. Whatever a play asserts about how a picture
 * SHIPS must therefore be read before this runs. The wait is bounded and
 * named, the Team twin's shape: a picture that never settles fails by its
 * `currentSrc` instead of timing the whole test out (no `decode()` — it is
 * unbounded, and `complete` turns true at the same moment).
 */
const settled = async (root: HTMLElement): Promise<void> => {
  await document.fonts.ready;
  const pictures = Array.from(root.querySelectorAll('img'));
  for (const picture of pictures) picture.loading = 'eager';
  await waitFor(
    () => {
      for (const picture of pictures) {
        expect(picture.complete, picture.currentSrc).toBe(true);
      }
    },
    { timeout: 5_000 },
  );
};

/** KEEP-IN-SYNC twin of ./page.tsx — the bands, the doctors band's props and
 *  the numbers band's are held equal to the page's by ../page-twins.test.ts,
 *  read off both sources; the plays below pin what this twin renders. */
function HomePageBand(): ReactElement {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const tt = useTranslations('team');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`home story: unknown locale "${locale}"`);

  const slides = populateHero(locale, (index, total) =>
    t('hero.slide', { index, total }),
  );
  // The doctors band — the Team page's own walk and words, as in page.tsx.
  const cards = populateDoctorShowcase(
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
      {/* The clinic's numbers — the page's band, prop for prop: the page
          ground, the opener at the start, no lead, lib/team's `clinicStats`
          through the same walk and the same glyph map. First under the Hero,
          before the doctors, as on the page. */}
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
        doctors={cards}
      />
      <ClinicLocation />
      {/* The page passes nothing and measures "how long ago" from the build;
          the twin pins the REAL list's story clock instead, so this baseline
          never ages (tests/unit/reviews-data.test.ts holds every real review
          at or before it). */}
      <ReviewsCarousel now={REVIEWS_NOW} />
    </>
  );
}

const meta = {
  title: 'Pages/Home',
  component: HomePageBand,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story): ReactElement => (
      <ContactModalProvider>
        <Header />
        <Story />
      </ContactModalProvider>
    ),
  ],
} satisfies Meta<typeof HomePageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    // THE DOCTORS BAND (owner, 2026-09-30) — and HOW ITS PICTURES SHIP, read
    // BEFORE `settled` asks for every picture on the page: below the hero and
    // the numbers they are all LAZY. This page's largest paint is the hero's
    // photograph; only the Team page, which the band opens, preloads its
    // first (`firstScreen`, the band's D9).
    const showcase = canvas.getByRole('region', {
      name: ro.team.showcase.title,
    });
    for (const picture of showcase.querySelectorAll('img'))
      await expect(picture).toHaveAttribute('loading', 'lazy');
    await settled(canvasElement);

    // The outline root: one h1, the page's, read and never seen.
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: ro.home.hero.title,
    });
    await expect(heading.tagName).toBe('H1');
    // The opener: a named carousel region wearing its localized role word,
    // ONE slide showing, its beads named like their slides.
    const hero = canvas.getByRole('region', { name: ro.home.hero.region });
    await expect(hero).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
    // Under the pill: the band's top edge is the viewport's (round 2).
    await expect(hero.getBoundingClientRect().top).toBe(0);
    // WHICH slide is showing is the clock's, not this play's: the ring's
    // first dwell is 1.5 s (§15.21 round 5) and it runs while `settled`
    // above waits for every picture on the page, so on a loaded machine the
    // ring has moved on by the time this line runs and slide 1 is `inert`,
    // out of the accessibility tree (measured 2026-10-01: three pre-push
    // runs on a machine at load average ~12 failed exactly here and nowhere
    // else; alone the story passes every time). The start at slide 1 is
    // Hero.test.tsx's pin; here it is enough that exactly one slide is
    // reachable, named like its bead.
    await expect(
      canvas.getByRole('group', { name: /^Imaginea [1-3] din 3$/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: ro.home.hero.contact }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: ro.home.hero.services }),
    ).toHaveAttribute('href', '/ro/services/');
    // The doctors band, between the numbers and the map: every lib/team
    // doctor as a card with the ONE link to the doctor's own page.
    await expect(
      within(showcase).getByText(ro.team.showcase.eyebrow),
    ).toBeVisible();
    await expect(
      within(showcase)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(doctors.map((doctor) => `/ro/team/${doctor.id}/`));
    // THE CLINIC'S NUMBERS (owner, 2026-10-01): a region named by the doctor
    // page's own title key, its eyebrow above it and NO lead under it, and
    // exactly the clinic's three tiles — experience, patients, procedures —
    // labelled by lib/team's `clinicStats`, in that order.
    const stats = canvas.getByRole('region', {
      name: ro.team.doctor.stats.title,
    });
    await expect(
      within(stats).getByText(ro.team.doctor.stats.eyebrow),
    ).toBeVisible();
    await expect(
      canvas.queryByText(ro.team.doctor.stats.lead),
    ).not.toBeInTheDocument();
    await expect(
      within(within(stats).getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(3);
    await expect(
      within(stats)
        .getAllByRole('heading', { level: 3 })
        .map((label) => label.textContent),
    ).toEqual(clinicStats.map((stat) => stat.words.ro.label));
    // The map, named by its own h2 — after the numbers and the doctors, as on
    // the page: hero → numbers → doctors → map (the owner's order since
    // 2026-10-01: "so first in cifre and then doctors").
    const map = canvas.getByRole('region', { name: ro.home.location.title });
    await expect(
      hero.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      stats.compareDocumentPosition(showcase) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      showcase.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The reviews deck below the map, over the clinic's own Google reviews
    // (lib/reviews, since 2026-09-30) — every one of them, since the deck lays
    // out every slide.
    await expect(
      canvas.getByRole('region', { name: ro.home.reviews.region }),
    ).toBeInTheDocument();
    for (const review of reviews)
      await expect(canvas.getByText(review.name)).toBeInTheDocument();
  },
};

/** DE, the longest language (§8.4): the page tier's second pinned language. */
export const German: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas, canvasElement }) => {
    await settled(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: de.home.hero.title }),
    ).toBeInTheDocument();
    const hero = canvas.getByRole('region', { name: de.home.hero.region });
    await expect(hero).toHaveAttribute(
      'aria-roledescription',
      de.common.carousel.role,
    );
    await expect(
      canvas.getByRole('link', { name: de.home.hero.services }),
    ).toHaveAttribute('href', '/de/services/');
    await expect(
      canvas.getByRole('region', { name: de.team.showcase.title }),
    ).toBeInTheDocument();
    // The clinic's numbers in German — the doctor page's German title.
    await expect(
      canvas.getByRole('region', { name: de.team.doctor.stats.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('region', { name: de.home.location.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('region', { name: de.home.reviews.region }),
    ).toBeInTheDocument();
  },
};
