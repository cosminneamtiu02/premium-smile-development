import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { Header } from '@/components/sections/Header/Header';
import { Hero } from '@/components/sections/Hero/Hero';
import { ReviewsCarousel } from '@/components/sections/ReviewsCarousel/ReviewsCarousel';
import { demoReviews } from '@/lib/reviews/reviews';
import { localeHref } from '@/i18n/href';
import { isLocale } from '@/i18n/locales';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateHero } from './populate';

// Pages/Home — the page as it actually ships: the Hero opener (the site's
// second rotator, owner dispatch 2026-09-19, epic #103) over the „Ne găsești"
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

/** KEEP-IN-SYNC twin of ./page.tsx. */
function HomePageBand(): ReactElement {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`home story: unknown locale "${locale}"`);

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
  play: async ({ canvas }) => {
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
    // The second real band, named by its own h2 — the twin must mount it too.
    await expect(
      canvas.getByRole('region', { name: ro.home.location.title }),
    ).toBeInTheDocument();
    // The third: the reviews deck below the map, on the five demo rows today.
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
  play: async ({ canvas }) => {
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
      canvas.getByRole('region', { name: de.home.location.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('region', { name: de.home.reviews.region }),
    ).toBeInTheDocument();
  },
};
