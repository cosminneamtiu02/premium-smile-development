import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { Header } from '@/components/sections/Header/Header';
import { Hero } from '@/components/sections/Hero/Hero';
import { ReviewsCarousel } from '@/components/sections/ReviewsCarousel/ReviewsCarousel';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { demoReviews } from '@/lib/reviews/reviews';
import { doctors } from '@/lib/team/team';
import { localeHref } from '@/i18n/href';
import { isLocale } from '@/i18n/locales';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateDoctorShowcase } from '../team/populate';
import { populateHero } from './populate';

// Pages/Home — the page as it actually ships: the Hero opener (the site's
// second rotator, owner dispatch 2026-09-19, epic #103) over the DOCTORS band
// (sections/DoctorShowcase, owner dispatch 2026-09-30 — the band the Team page
// opens with, populated by the Team page's own walk, ../team/populate.ts)
// over the „Ne găsești"
// band (owner 2026-09-09, board D3) over the reviews deck (mounted
// 2026-09-20 on the owner's word — the hero lane's rounds 4–5 — on the first
// five of lib/reviews' demo rows until the real rows land), in the old
// site's order.
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
// stub deferred "until the real page lane": a 72px serif slogan in German is
// the text-expansion case this page has. `Pages/*` photographs both at all
// six widths.
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
 * SHIPS must therefore be read before this runs.
 */
const settled = async (root: HTMLElement): Promise<void> => {
  await document.fonts.ready;
  const pictures = Array.from(root.querySelectorAll('img'));
  for (const picture of pictures) picture.loading = 'eager';
  await Promise.all(
    pictures.map((picture) => picture.decode().catch(() => undefined)),
  );
  await waitFor(() => {
    for (const picture of pictures) expect(picture.complete).toBe(true);
  });
};

/** KEEP-IN-SYNC twin of ./page.tsx — the bands and the doctors band's props
 *  are held equal to the page's by ../page-twins.test.ts, read off both
 *  sources; the plays below pin what this twin renders. */
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
      <DoctorShowcase
        eyebrow={tt('showcase.eyebrow')}
        title={tt('showcase.title')}
        doctors={cards}
      />
      <ClinicLocation />
      <ReviewsCarousel />
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
    // BEFORE `settled` asks for every picture on the page: under the hero
    // they are all LAZY. This page's largest paint is the hero's photograph;
    // only the Team page, which the band opens, preloads its first
    // (`firstScreen`, the band's D9).
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
    // its first slide the one showing, its beads named like their slides.
    const hero = canvas.getByRole('region', { name: ro.home.hero.region });
    await expect(hero).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
    // Under the pill: the band's top edge is the viewport's (round 2).
    await expect(hero.getBoundingClientRect().top).toBe(0);
    await expect(
      canvas.getByRole('group', { name: 'Imaginea 1 din 3' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: ro.home.hero.contact }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: ro.home.hero.services }),
    ).toHaveAttribute('href', '/ro/services/');
    // The doctors band sits right under the hero, before the map: every
    // lib/team doctor as a card with the ONE link to his own page.
    await expect(
      within(showcase).getByText(ro.team.showcase.eyebrow),
    ).toBeVisible();
    await expect(
      within(showcase)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(doctors.map((doctor) => `/ro/team/${doctor.id}/`));
    // The map, named by its own h2 — after the doctors, as on the page.
    const map = canvas.getByRole('region', { name: ro.home.location.title });
    await expect(
      hero.compareDocumentPosition(showcase) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      showcase.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The reviews deck below the map, on the five demo rows today.
    await expect(
      canvas.getByRole('region', { name: ro.home.reviews.region }),
    ).toBeInTheDocument();
    await expect(canvas.getByText(demoReviews[0].name)).toBeInTheDocument();
    await expect(canvas.getByText(demoReviews[4].name)).toBeInTheDocument();
    await expect(
      canvas.queryByText(demoReviews[5].name),
    ).not.toBeInTheDocument();
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
    await expect(
      canvas.getByRole('region', { name: de.home.location.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('region', { name: de.home.reviews.region }),
    ).toBeInTheDocument();
  },
};
