import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { PriceList } from '@/components/sections/PriceList/PriceList';
import { isLocale, type Locale } from '@/i18n/locales';
import { priceCategories } from '@/lib/prices/prices';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populatePriceList, SERVICES_TITLE_ID } from './populate';

// Pages/Services — the real page as it ships: the price band, opened by an
// `sr-only` <h1> that costs no pixels, at the six page-tier widths (§13:
// Pages/* → 320 · 390 · 768 · 1280 · 1536 · 1920, tests/visual/stories.spec.ts).
//
// ── WHY A STORY-LOCAL TWIN AND NOT THE PAGE ITSELF. ./page.tsx is an async
// Server Component: it awaits `getTranslations` and `getLocale` from
// next-intl/server, which no browser runner can execute — the same reason
// src/app/[locale]/shell.test.tsx composes the shell's shape instead of
// importing layout.tsx, and the same shape as Pages/Home and Pages/NotFound. So
// `ServicesPageBand` below renders the SAME markup through the isomorphic
// `useTranslations` + `useLocale`.
// What is NOT twinned is the mapping: both sides call the one
// `populatePriceList` from ./populate.ts with the real `priceCategories`, so
// the thing most likely to drift — which language, which formatter, which rows
// — cannot, because there is only one copy of it.
//
// ── THIS IS A KEEP-IN-SYNC PAIR (§4's sharing table), written down rather than
// assumed: the twin lives here, the original in ./page.tsx, and that file's
// header points back at this one. Both must render ONE bare `<h1
// id={SERVICES_TITLE_ID} className="sr-only">` — no ui/Heading, no Container,
// no band around it, because the owner's 2026-09-14 round removed the visible
// opener and page.tsx argues there why the ELEMENT outlived the pixels (§9's
// one outline root, §10.3's page title) — immediately followed by an UNNAMED
// `<PriceList>` (no aria-labelledby: the band is not a landmark, G2 a11y L1;
// page.tsx's header) fed by `populatePriceList`. The plays pin exactly that
// from the outside, so a change on either side that the other does not follow
// turns this suite red instead of quietly photographing something the site no
// longer ships.
//
// ── TWO STORIES, RO + DE — the §13 page tier, and here German earns its
// baseline three times over: the menu labels may not syllable-break (§15.14),
// „Kieferorthopädie" is what the menu track's 15rem floor was measured against
// (PriceList.tsx's header), and the tariff's own German row names run to 24
// unbroken letters inside a card that is ~206px wide at 320. Every story PINS
// ITS LOCALE with `globals`: the locale toolbar is manager state and the visual
// runner opens each story by URL with none of it, while the preview decorator
// supplies the messages AND stamps `document.documentElement.lang` exactly as
// the shell does — which is what makes hyphenation behave here the way it
// behaves on the built page.
//
// ── THE CONTENT IS THE REAL TARIFF, not a fixture: this is the page, and its
// rows are the owner's transcribed sheet (lib/prices). The BAND's own stories
// (Sections/PriceList) are where invented decks exercise the layout — that
// split is what „dumb" buys (board §2c.1), and it is why a change to the price
// list re-records these six pictures and none of the band's.
//
// layout 'fullscreen' because the band is full-bleed and Container owns the
// gutter: Storybook's default canvas padding would add a second inset on top of
// the clamp and put the story's ground and the band's margins on two rulers —
// and it would move the band off the top of the canvas, which one of the plays
// now measures.

/** KEEP-IN-SYNC twin of ./page.tsx — see this file's header. Every comment
 *  justifying this markup lives in that file (why the <h1> is `sr-only` and
 *  what is left of its id, the `isLocale` narrowing); duplicating the arguments
 *  here would give them two homes and no owner. */
function ServicesPageBand(): ReactElement {
  const t = useTranslations('services');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`services page: unknown locale "${locale}"`);

  const categories = populatePriceList(locale, (lei) =>
    t('prices.amount', { amount: lei }),
  );

  return (
    <>
      <h1 id={SERVICES_TITLE_ID} className="sr-only">
        {t('title')}
      </h1>
      <PriceList menuTitle={t('prices.menu')} categories={categories} />
    </>
  );
}

const meta = {
  title: 'Pages/Services',
  component: ServicesPageBand,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ServicesPageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The tariff's own category ids, in the order the page prints them. DERIVED
 *  from the list, because what these stories check is that the PAGE printed all
 *  of it in order — the counts themselves are pinned against the photographed
 *  sheet in tests/unit/prices-data.test.ts, and restated below so a silently
 *  shortened list is loud here too. */
const CATEGORY_IDS = priceCategories.map((category) => category.id);

/** A four-digit row, so the assertion below can see the LOCALE's digit
 *  grouping („2.300", not „2300") — the one thing only the page does. */
const GROUPED_ROW = priceCategories
  .flatMap((category) => category.items)
  .find((item) => item.lei >= 1000);
if (GROUPED_ROW === undefined)
  throw new Error('lib/prices holds no four-digit amount to sample');

/**
 * Everything both stories check, against the language they were pinned to.
 * Written once because the page's contract does not change with the locale —
 * only the words do.
 */
const playPage =
  (
    words: { title: string; menu: string; amount: string },
    locale: Locale,
  ): NonNullable<Story['play']> =>
  async ({ canvas, canvasElement }) => {
    // ONE <h1>, queried by ROLE and by its real message, so a renamed key or a
    // heading that stopped being an <h1> fails here (§9, §13). The role query
    // is the right instrument twice over now that the heading is invisible:
    // `sr-only` clips the element but leaves it in the accessibility tree, so
    // a regression that hid it PROPERLY — `display:none`, `hidden`,
    // `aria-hidden` — would take the page's outline root away and turn exactly
    // this line red (Testing Library filters those out of role queries by
    // default; a clipped element it still finds).
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: words.title,
    });
    await expect(heading.tagName).toBe('H1');
    await expect(heading).toHaveAttribute('id', SERVICES_TITLE_ID);
    await expect(heading).toHaveClass('sr-only');

    // …AND THE FIRST THING THE PAGE PAINTS IS THE BAND (owner 2026-09-14: the
    // visible opener is gone). Two halves, because either alone could pass on
    // a page that still opened with something: the band is the heading's next
    // sibling and the only `bg-page` section left in the document, and its top
    // edge is the canvas's own — an out-of-flow heading pushes nothing down,
    // which is the whole reason the page owes no padding above it.
    const band = heading.nextElementSibling as HTMLElement;
    await expect(band.tagName).toBe('SECTION');
    await expect(band).toHaveClass('bg-page');
    await expect(
      canvasElement.querySelectorAll('section.bg-page'),
    ).toHaveLength(1);
    await expect(band.getBoundingClientRect().top).toBe(
      canvasElement.getBoundingClientRect().top,
    );

    // …and it names NOTHING else: the band is deliberately not a region
    // (page.tsx, THE BAND IS NOT A NAMED REGION), so no landmark carries the
    // page title — <main> already is the page.
    await expect(
      canvas.queryByRole('region', { name: words.title }),
    ).toBeNull();

    // The menu is a NAVIGATION landmark named by its own visible title (the
    // band's own contract, re-checked from the page's side because the page is
    // what supplies the title string).
    const menu = canvas.getByRole('navigation', { name: words.menu });
    const links = Array.from(menu.querySelectorAll('a'));

    // One card per category: <section id … tabindex="-1">, the fragment target
    // shape (board §3.5/§4.2). Queried from the DOM and not by role because
    // what is being checked is that SHAPE and the document order of the ids —
    // a role query finds the same cards by their headings but can see neither
    // the `id` the menu links at nor the `tabindex` that makes arriving at one
    // audible.
    const cards = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('section[id][tabindex="-1"]'),
    );

    await expect(CATEGORY_IDS).toHaveLength(11);
    await expect(CATEGORY_IDS[0]).toBe('consultations');
    await expect(links).toHaveLength(CATEGORY_IDS.length);
    await expect(cards).toHaveLength(CATEGORY_IDS.length);
    await expect(cards.map((card) => card.id)).toEqual(CATEGORY_IDS);
    await expect(links.map((link) => link.getAttribute('href'))).toEqual(
      CATEGORY_IDS.map((id) => `#${id}`),
    );

    // EVERY CARD OPENS WITH AN EYEBROW, each one THIS locale's (owner
    // 2026-09-14: „i want that in all of them"). The band's own suite proves a
    // card renders whatever eyebrow it is handed; only the page can prove the
    // walk handed all eleven of them, in the language the page is in, from the
    // real list rather than a fixture. The eyebrow is the card's ONLY <p> —
    // the price rows are <dt>/<dd> — so the count is part of the assertion: a
    // second paragraph appearing inside a card would be a design change nobody
    // declared.
    await expect(
      cards.map((card) => card.querySelector('p')?.textContent),
    ).toEqual(priceCategories.map((category) => category.eyebrow[locale]));
    for (const card of cards)
      await expect(card.querySelectorAll('p')).toHaveLength(1);

    // THE PAGE IS WHERE A NUMBER BECOMES WORDS (board §2.4): lib/prices stores
    // a bare `lei` and the band prints whatever string it is handed, so a
    // GROUPED amount can only come from this page resolving the ICU key in this
    // locale — and the separator is the platform's, which is the whole reason
    // `Intl`'s currency mode was refused (prices.ts' header): „1.300" in ro and
    // de, „1,300" in en, a narrow no-break space in fr, none at all in it.
    // Resolved by hand here — the message's own text with the platform's own
    // grouping — rather than retyped, so a changed sentence or a changed locale
    // shows up as a mismatch instead of a stale literal.
    const grouped = words.amount.replace(
      '{amount, number}',
      new Intl.NumberFormat(locale).format(GROUPED_ROW.lei),
    );
    await expect(canvas.getAllByText(grouped).length).toBeGreaterThan(0);

    // §7: nothing on this page may make the DOCUMENT scroll sideways, at any
    // width — the 320px stress is a page-tier baseline, and a single unbroken
    // German compound pushing a card past the gutter would show up here first.
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  };

/**
 * ROMANIAN — the default locale and the §15.7 story default (diacritics-bearing
 * copy, so a font or shaping regression has somewhere to show).
 *
 * What to look at: the page starting ON the band — „Serviciile noastre" is in
 * the document and not on it (§9's outline root, clipped by `sr-only`), so
 * there is nothing above „Categorii" but the header pill; the menu card with
 * the eleven categories, stuck under that pill from ~960px up while the price
 * cards scroll past it, its current entry green and underlined; each card
 * opening with its own eyebrow over its <h2> — all eleven wear one since the
 * owner's round — its rows in ONE column however wide the card gets, prices
 * right-aligned with tabular digits.
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: playPage(
    {
      title: ro.services.title,
      menu: ro.services.prices.menu,
      amount: ro.services.prices.amount,
    },
    'ro',
  ),
};

/**
 * GERMAN — the §8.4 expansion stress, and the calibration picture for the
 * menu's 15rem track floor: „Kieferorthopädie" and „Konsultationen" must sit on
 * one line each (an interactive label may not syllable-break, §15.14), while
 * the row names inside the cards may and must break, which they only do under a
 * declared `lang` — stamped by the preview decorator exactly as the shell
 * stamps it. Since the owner's round the eyebrows stress the same seam one line
 * higher: „Aufhellungsbehandlungen" and „Zahnfleischbehandlung" are compounds
 * set in the wide-tracked mono face, above a heading, inside a card that is
 * ~206px wide at 320.
 */
export const German: Story = {
  globals: { locale: 'de' },
  play: async (context) => {
    await playPage(
      {
        title: de.services.title,
        menu: de.services.prices.menu,
        amount: de.services.prices.amount,
      },
      'de',
    )(context);
    await expect(document.documentElement.lang).toBe('de');
  },
};
