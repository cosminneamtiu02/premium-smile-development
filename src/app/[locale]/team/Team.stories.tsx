import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { TeamRoster } from '@/components/sections/TeamRoster/TeamRoster';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale, type Locale } from '@/i18n/locales';
import { auxiliaries, doctors } from '@/lib/team/team';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateTeamRoster } from './populate';

// Pages/Team — the real page as it ships: „Echipa noastră" over the doctor
// cards and the auxiliary tiles, with the map last, at the six page-tier
// widths (§13: Pages/* → 320 · 390 · 768 · 1280 · 1536 · 1920,
// tests/visual/stories.spec.ts). It replaces the stub's single story, whose
// one heading reused the nav label and whose own comment promised exactly this
// („the DE variant arrives WITH the real page lane").
//
// ── WHY A STORY-LOCAL TWIN AND NOT THE PAGE ITSELF. ./page.tsx is an async
// Server Component: it awaits `getTranslations` and `getLocale` from
// next-intl/server, which no browser runner can execute — the same reason
// src/app/[locale]/shell.test.tsx composes the shell's shape instead of
// importing layout.tsx, and the same shape as Pages/Home and Pages/Services.
// So `TeamPageBands` below renders the SAME markup through the isomorphic
// `useTranslations` + `useLocale`.
// What is NOT twinned is the mapping: both sides call the one
// `populateTeamRoster` from ./populate.ts with the real people, so the thing
// most likely to drift — which language, which links, which rows — cannot,
// because there is only one copy of it.
//
// ── THIS IS A KEEP-IN-SYNC PAIR (§4's sharing table), written down rather than
// assumed: the twin lives here, the original in ./page.tsx, and that file's
// header points back at this one. Both must render ONE `<TeamRoster>` fed by
// `populateTeamRoster`, followed by `<ClinicLocation>` and nothing else. The
// plays pin exactly that from the outside.
//
// ── THE CONTENT IS THE REAL lib/team, not a fixture: this is the page, and its
// people are the list the site ships (since 2026-09-30 the clinic's six real
// doctors, under placeholder details, beside three demo auxiliary members —
// lib/team's own TODO(owner)). The BAND's stories (Sections/TeamRoster)
// are where invented rosters exercise the layout; that split is what „dumb"
// buys, and it is why adding a doctor re-records these six pictures and none of
// the band's.
//
// ── TWO STORIES, RO + DE — the §13 page tier. German earns its baseline here
// three times over: the two button labels may not syllable-break (§15.14) and
// „Leistungen ansehen" is the longest of the pair; „Zahnmedizinische
// Fachangestellte" is an unbroken 27-letter compound inside a 16rem tile (run
// D9's floor); and the doctors' quotes run longer than the Romanian in a card
// whose two columns are already committed (MEASURED on today's placeholder
// texts: 1–12 % a quote, 8 % overall — §8.4's ~35 % is the headroom a real
// text may use). Every story PINS ITS LOCALE
// with `globals`: the locale toolbar is manager state and the visual runner
// opens each story by URL with none of it, while the preview decorator
// supplies the messages AND stamps `document.documentElement.lang` exactly as
// the shell does — which is what makes hyphenation behave here the way it
// behaves on the built page.
//
// …AND ITS VIEWPORT (G2-R2 tier 3, a11y F1), the Pages/Doctor shape. Without
// a pin the Vitest runner renders both stories at the addon's default
// 1200×900, so the German stress was never PLAYED at a phone width — only
// photographed there, by a visual net that does not run on this machine
// (§15.7). German is pinned to the SMARTPHONE (390): the stress width, where
// the longest words, the stacked cards and the page's sideways-scroll check
// meet. Romanian is pinned to the LAPTOP (1536): the beside branch, the card's
// portrait next to its quote. Together they make the D21 check below
// non-vacuous in both branches.
//
// ── THE OWNER'S ADAPTABILITY RULE ON THIS PAGE (round 2's D21: "sections that
// are next to each other when in phone mode … must come one above the other").
// A doctor card's portrait sits beside its quote from the CARD's own `@3xl`
// step (it is its own size container — ui/Card) and above it below that; the
// play derives the branch from the first card's measured content box, never
// from the pinned width (the visual runner ignores the pin and plays this at
// all six widths), asserts the geometry of whichever branch it found, and then
// asserts that the pin produced the branch it was chosen for.
//
// ── NO HEADER AND NO ContactModalProvider decorator, unlike Pages/Home:
// nothing here slides under the pill (the Services precedent) and no band on
// this page mounts a ContactModalTrigger — the doctor cards' two buttons are
// plain links (§15.13), one to the price list and one to the doctor's page.
//
// layout 'fullscreen' because both bands are full-bleed and Container owns the
// gutter: Storybook's default canvas padding would add a second inset on top of
// the clamp and put the story's ground and the bands' margins on two rulers.

/** KEEP-IN-SYNC twin of ./page.tsx — see this file's header. Every comment
 *  justifying this markup lives in that file (why the <h1> is the band's, the
 *  `isLocale` narrowing, why the page is the one populator); duplicating the
 *  arguments here would give them two homes and no owner. */
function TeamPageBands(): ReactElement {
  const t = useTranslations('team');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`team story: unknown locale "${locale}"`);

  const roster = populateTeamRoster(
    locale,
    { services: t('roster.services'), profile: t('roster.profile') },
    (segments) => <Keywords segments={segments} />,
  );

  return (
    <>
      <TeamRoster
        title={t('title')}
        doctors={roster.doctors}
        members={roster.members}
      />
      <ClinicLocation />
    </>
  );
}

const meta = {
  title: 'Pages/Team',
  component: TeamPageBands,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TeamPageBands>;

export default meta;
type Story = StoryObj<typeof meta>;

/** True when `first` really does come before `second` in the document — the
 *  DOM's own answer, which no class name or bounding box can fake. */
const precedes = (first: Element, second: Element): boolean =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

/** Which way a doctor card went at the width it was rendered at (D21). */
type Branch = 'beside' | 'stacked';

/** One rem at whatever the root font-size is, never a baked-in 16. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * THE COLUMN a card's arrangement is decided by: the nearest size container
 * ABOVE the element — for anything inside a doctor card, the card itself
 * (ui/Card carries `@container`, Card D10). Found by the computed
 * `container-type`, never by counting parents: Pages/Doctor's `columnOf`,
 * the same walk.
 */
const columnOf = (element: Element): HTMLElement => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node;
  }
  throw new Error('team story: no size container above the element');
};

/**
 * WHERE A CARD SPLITS, derived rather than assumed (Pages/Doctor's
 * `sitsBeside`, the same arithmetic): `@3xl` is 48rem of the column's CONTENT
 * box, so padding and border come off the FRACTIONAL border-box width.
 */
const sitsBeside = (element: Element): boolean => {
  const column = columnOf(element);
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(column);
  const content =
    column.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight) -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth);
  return content >= 48 * rem();
};

/**
 * THE FIRST DOCTOR CARD'S ARRANGEMENT (D21), in the branch its own column
 * puts it in. Every box is reached by role or by the one element a card has
 * of its kind — the heading, the blockquote, the portrait's <img>, the two
 * links — never by walking the card's layout divs.
 *
 * Beside: the portrait left of the quote (the first card faces 'start' —
 * TeamRoster alternates from index 0), and the name left of the links. Stacked:
 * one column in the card's DOM order — portrait, name, quote, links — and the
 * two links either sharing one line or, when the row is narrower than their
 * two `flex-basis` widths and the gap, each on a line of its own spanning the
 * row: the phone's two full-width buttons (§9's 44px targets, one per line).
 * Which of the two is read off the row's COMPUTED styles, so the check holds
 * at every width the visual runner plays it at, and at 390 it proves the
 * full-width lines.
 */
const expectFirstCard = async (card: HTMLElement): Promise<Branch> => {
  const quote = within(card).getByRole('blockquote');
  const name = within(card).getByRole('heading').getBoundingClientRect();
  const image = card.querySelector('img');
  if (!image) throw new Error('team story: the first card lost its portrait');
  const links = within(card).getAllByRole('link');
  const [services, profile] = links.map((link) => link.getBoundingClientRect());
  const portrait = image.getBoundingClientRect();
  const words = quote.getBoundingClientRect();
  // A collapsed box would satisfy every comparison below by accident.
  for (const box of [portrait, name, words, services, profile])
    await expect(box.height).toBeGreaterThan(0);

  if (sitsBeside(quote)) {
    await expect(portrait.right).toBeLessThanOrEqual(words.left);
    await expect(name.right).toBeLessThanOrEqual(
      Math.min(services.left, profile.left),
    );
    return 'beside';
  }

  await expect(portrait.bottom).toBeLessThanOrEqual(name.top);
  await expect(name.bottom).toBeLessThanOrEqual(words.top);
  await expect(words.bottom).toBeLessThanOrEqual(services.top);

  const row = links[0].parentElement;
  if (!row) throw new Error('team story: the first card lost its links row');
  const rowStyle = getComputedStyle(row);
  const basis = (link: Element): number =>
    parseFloat(getComputedStyle(link).flexBasis);
  const fitsOneLine =
    basis(links[0]) + parseFloat(rowStyle.columnGap) + basis(links[1]) <=
    row.getBoundingClientRect().width;
  if (fitsOneLine) {
    await expect(Math.abs(services.top - profile.top)).toBeLessThanOrEqual(1);
    await expect(services.right).toBeLessThanOrEqual(profile.left);
  } else {
    const width = row.getBoundingClientRect().width;
    await expect(profile.top).toBeGreaterThanOrEqual(services.bottom);
    await expect(Math.abs(services.width - width)).toBeLessThanOrEqual(1);
    await expect(Math.abs(profile.width - width)).toBeLessThanOrEqual(1);
  }
  return 'stacked';
};

/**
 * Fonts and pictures SETTLED before a single box is read: a grid track's
 * min-content includes a loaded image's, so a box read before the pictures
 * have settled can be a different layout from the one a visitor sees (the
 * doctor twin's CI-only failure of 2026-09-27 hid behind exactly that window).
 *
 * EVERY PICTURE IS ASKED FOR FIRST (2026-09-30, the six real doctors). The
 * portraits are lazy (ui/Image, §11), and a browser never starts a lazy
 * picture that lies further below the window than its loading distance —
 * MEASURED in Chromium: about 3000px. Such a picture's `decode()` stays
 * pending for good, and this play with it, at its first line. With two
 * doctors no picture on this page was that far down; with six the German
 * phone page is 7087px tall and its last four portraits are, so the story
 * timed out. It hid on a workstation and showed on CI for one reason:
 * Romanian runs first in the same browser page and leaves the same picture
 * URLs in the memory cache, which completes a lazy picture on the spot — but
 * CI's Vitest step runs before any image optimizer (the Sections/DoctorIntro
 * stories' own note), those URLs answer 404 there and nothing is cached. To
 * see it without CI, run the German story ALONE.
 *
 * So each picture is flipped to `eager` before the wait — HTML's own "lazy
 * load resumption", no scrolling and no timer — and what the play measures is
 * the page of a visitor who has scrolled through it, which is the page the
 * document-wide checks (the outline, the sideways scroll) are about. React
 * never writes the attribute back: the prop it rendered is unchanged.
 *
 * SETTLED, NOT LOADED — the Sections/DoctorIntro helper's contract, kept:
 * `decode()` resolved OR rejected, and then `complete`, polled (`waitFor`)
 * because ui/Image answers a missing variant by swapping to the original
 * file, and a picture caught between the two sources settles on a later
 * poll. Nothing here asserts pixels. On CI a picture may be read while it is
 * still between its two sources, and that is sound on THIS page: a portrait's
 * box is its frame's (PersonnelCard's `aspect-3/4 w-48`), the same whether
 * the picture arrived or broke.
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

/**
 * Everything both stories check, against the language they were pinned to.
 * Written once because the page's contract does not change with the locale —
 * only the words do. `pinned` is the arrangement the story's viewport pin
 * must produce in the Vitest runner (see the header's viewport paragraph).
 */
const playPage =
  (
    words: {
      title: string;
      services: string;
      profile: string;
      location: string;
    },
    locale: Locale,
    pinned: Branch,
  ): NonNullable<Story['play']> =>
  async ({ canvas, canvasElement }) => {
    await settled(canvasElement);
    // ONE <h1>, VISIBLE, and it is the BAND's (page.tsx, THE <h1> IS THE
    // BAND'S) — queried by role and by its real message, so a renamed key or a
    // heading that stopped being an <h1> fails here (§9, §13).
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: words.title,
    });
    await expect(heading.tagName).toBe('H1');
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    // …and the band around it is NOT a landmark: a region named by the page's
    // own title would duplicate <main> for a screen-reader user (the services
    // page's G2 a11y verdict).
    const band = heading.closest('section');
    if (band === null) throw new Error('the roster band lost its <section>');
    await expect(
      canvas.queryByRole('region', { name: words.title }),
    ).toBeNull();

    // TWO LISTS, in order: the doctors' column and the auxiliary grid. Both
    // carry an explicit role="list" (WebKit drops the implicit one when the
    // bullets are styled away), and scoping the counts to each list is what
    // makes „N doctors then M members" an assertion rather than a total.
    const [doctorList, memberList] = within(band).getAllByRole('list');
    await expect(within(band).getAllByRole('list')).toHaveLength(2);

    // ONE CARD PER PERSON, in lib/team's own order, each named by the name in
    // THIS language — the walk's output read back off the page. The heading is
    // queried BY ROLE and without a level: which level a card's name wears is
    // the band's outline decision (PersonnelCard D4's recorded `headingLevel`
    // trigger), and this page's contract is only that every person has a card
    // and every card is named after him.
    const cardName = (card: HTMLElement): string | null =>
      within(card).getByRole('heading').textContent;

    const doctorCards = within(doctorList).getAllByRole('article');
    await expect(doctorCards).toHaveLength(doctors.length);
    await expect(doctorCards.map(cardName)).toEqual(
      doctors.map((doctor) => doctor.words[locale].name),
    );

    const memberCards = within(memberList).getAllByRole('article');
    await expect(memberCards).toHaveLength(auxiliaries.length);
    await expect(memberCards.map(cardName)).toEqual(
      auxiliaries.map((member) => member.words[locale].name),
    );

    // TWO LINKS PER DOCTOR, left then right (run D4): the work he does, then
    // his own page. The hrefs are derived from lib/team rather than retyped,
    // so a renamed id or a doctor who loses his `servicesCategory` shows up
    // here as a mismatch instead of a stale literal — and the '#category'
    // stays English in every language (owner fb-461).
    for (const [index, card] of doctorCards.entries()) {
      const doctor = doctors[index];
      const links = within(card).getAllByRole('link');
      await expect(links).toHaveLength(2);
      await expect(links.map((link) => link.getAttribute('href'))).toEqual([
        doctor.servicesCategory
          ? `/${locale}/services/#${doctor.servicesCategory}`
          : `/${locale}/services/`,
        `/${locale}/team/${doctor.id}/`,
      ]);
      await expect(links.map((link) => link.textContent)).toEqual([
        words.services,
        words.profile,
      ]);
    }

    // D21 ON THE FIRST CARD — the branch its own column puts it in, then the
    // proof that the pin produced the branch it was chosen for. Below 48rem
    // of window the card is narrower still, so stacked is the only
    // possibility. From 80rem of window up — the window less two gutters of at
    // most 10vw each, a classic scrollbar and the card's own inset of ~25px a
    // side — the card's content box is at least ~60rem, clear of the step, so
    // beside is the only possibility. (Pages/Doctor can use 64rem because its
    // arrangements measure the bare Container column; a card is narrower by
    // its inset, and at 64rem it can land under the step.) Between the two
    // the derived branch stands alone; the visual runner samples 768 there.
    const [firstCard] = doctorCards;
    if (!firstCard) throw new Error('lib/team has no doctor to story');
    const branch = await expectFirstCard(firstCard);
    if (pinned === 'stacked' && window.innerWidth < 48 * rem())
      await expect(branch).toBe('stacked');
    if (pinned === 'beside' && window.innerWidth >= 80 * rem())
      await expect(branch).toBe('beside');

    // The doctors' words carry keyword fragments, which means the page cut the
    // <k> marks and ui/Keyword rendered the pieces — a tag visible anywhere on
    // this page would mean one of those two stopped happening.
    await expect(canvasElement.textContent).not.toContain('<k>');
    await expect(
      canvasElement.querySelectorAll('article b').length,
    ).toBeGreaterThan(0);

    // THE MAP CLOSES THE PAGE (the owner's „add at the end the map"), named by
    // its own <h2> and standing AFTER the roster.
    const map = canvas.getByRole('region', { name: words.location });
    await expect(precedes(band, map)).toBe(true);
    // NOTHING FOLLOWS IT. The map region IS ClinicLocation's own <section>, so
    // its next sibling is what a third band would be — and there is none. The
    // old spelling asked whether the canvas's last child CONTAINED the map,
    // which any wrapper satisfies and a band appended after it would satisfy
    // too (G2 react, 2026-09-21: the assertion was vacuous).
    await expect(map.nextElementSibling).toBeNull();

    // THE OUTLINE, WHOLE (G2-R2 tier 3, a11y F2): every heading on the page,
    // by LEVEL, in document order — the h1, one h2 per person (the doctors,
    // then the auxiliary members: TeamRoster passes `headingLevel={2}` to
    // both lists, D10), and the map's h2. The card queries above read each
    // card's heading WITHOUT a level on purpose; this is where the level is
    // pinned, page-wide, so a card or a band arriving at the wrong level
    // fails here even when its own suite is green. Built from lib/team's own
    // lengths, never typed by hand. The canvas holds the page's two bands and
    // nothing else (no Header, no Footer — see NO HEADER above), so this is
    // the page's own outline.
    await expect(
      canvas
        .getAllByRole('heading')
        .map((element) => Number(element.tagName[1])),
    ).toEqual([
      1, // „Echipa noastră" (TeamRoster)
      ...doctors.map(() => 2), // one per doctor card
      ...auxiliaries.map(() => 2), // one per auxiliary tile
      2, // the map
    ]);

    // §7: nothing on this page may make the DOCUMENT scroll sideways, at any
    // width — the 320px stress is a page-tier baseline, and a single unbroken
    // German compound pushing a tile past the gutter would show up here first.
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  };

/**
 * ROMANIAN — the default locale and the §15.7 story default (diacritics-bearing
 * copy, so a font or shaping regression has somewhere to show), pinned to the
 * LAPTOP width, where every doctor card is on its beside branch (D21).
 *
 * What to look at: „Echipa noastră" at the hero step (§15.24); the doctor
 * cards alternating sides from ~960px, each with its quote, its name and its
 * two buttons on one line — „Vezi serviciile" filled green, „Vezi profilul"
 * outlined; the three auxiliary tiles on one row from 1280 and never narrower
 * than 16rem (run D9); the map last.
 */
export const Romanian: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: playPage(
    {
      title: ro.team.title,
      services: ro.team.roster.services,
      profile: ro.team.roster.profile,
      location: ro.home.location.title,
    },
    'ro',
    'beside',
  ),
};

/** GERMAN — the §8.4 expansion stress, pinned to the SMARTPHONE width, where
 *  every card is one column (D21): the longest button pair, each button on a
 *  full-width line of its own, the 27-letter tile compound and the longer
 *  quotes (see this file's header). With six doctors this is also the page's
 *  TALLEST frame — 7087px — the one whose last portraits lie beyond the
 *  browser's lazy-loading distance (`settled` above). */
export const German: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  play: async (context) => {
    await playPage(
      {
        title: de.team.title,
        services: de.team.roster.services,
        profile: de.team.roster.profile,
        location: de.home.location.title,
      },
      'de',
      'stacked',
    )(context);
    await expect(document.documentElement.lang).toBe('de');
  },
};
