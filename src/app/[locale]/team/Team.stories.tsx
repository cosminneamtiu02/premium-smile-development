import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { TeamRoster } from '@/components/sections/TeamRoster/TeamRoster';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale, type Locale } from '@/i18n/locales';
import { auxiliaries, clinicStats, doctors } from '@/lib/team/team';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import {
  populateDoctorShowcase,
  populateStats,
  populateTeamRoster,
} from './populate';
import { toStatTiles } from './stat-tiles';

// Pages/Team — THE TEAM PAGE'S STORY TWIN. ./page.tsx is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no
// browser runner can execute — the shell.test.tsx / Pages/Services precedent —
// so this file renders the SAME markup through the isomorphic
// `useTranslations` + `useLocale` and the SAME ./populate.ts, and its play
// pins what THIS TWIN renders. KEEP IN SYNC: ../page-twins.test.ts reads
// page.tsx and this file as source and holds their bands, in order, and the
// doctors band's and the numbers band's props equal — change the JSX in one
// and that test names it.
//
// ── THE PAGE SINCE 2026-09-30 (the owner's dispatch, quoted in page.tsx): an
// `sr-only` <h1> in the page's own markup, then the DOCTORS band
// (sections/DoctorShowcase — eyebrow, <h2>, every doctor as a card under the
// ribbon), then the staff tiles (sections/TeamRoster), then — since
// 2026-10-01 (owner: "same component as on main page with the stats on the
// team page between map and helping staff") — the clinic's NUMBERS
// (sections/DoctorStats on the page ground, the Home page's band prop for
// prop: the opener at the start, no lead, lib/team's three `clinicStats`
// through ./populate.ts' `populateStats` and ./stat-tiles.tsx), then the map.
//
// ── TWO STORIES, the `Pages/*` tier's RO + DE (§13): Romanian pinned at the
// Laptop window, where the doctor card sits in two columns; German at the
// Smartphone, where it stacks under the phone's header (PersonnelCard D20) —
// the longest language at the narrowest named width. Playwright ignores the
// pin (it sets its own page size per project),
// which is why every geometry assertion below asks the PAGE which branch it
// is in instead of assuming the pinned width.
//
// ── THE PLAY MEASURES A SETTLED PAGE (the 2026-09-27 lesson, #110): fonts and
// pictures first, then boxes — a picture that loads after a measurement moves
// what was measured.
//
// No `parameters.nextjs` and no mock messages: the preview decorator provides
// the real five message files, and the people are lib/team's own — since
// 2026-09-30 the clinic's six real doctors, under placeholder details, beside
// three demo auxiliary members (lib/team's TODO(owner)). The BAND's stories
// (Sections/DoctorShowcase, Sections/TeamRoster) are where invented rosters
// exercise the layout; that split is what „dumb" buys, and it is why adding a
// doctor re-records this page's frames and none of the bands'.

function TeamPageBands(): ReactElement {
  const t = useTranslations('team');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`team story: unknown locale "${locale}"`);

  const cards = populateDoctorShowcase(
    locale,
    t('showcase.profile'),
    (segments) => <Keywords segments={segments} />,
  );

  return (
    <>
      <h1 className="sr-only">{t('title')}</h1>
      <DoctorShowcase
        firstScreen
        eyebrow={t('showcase.eyebrow')}
        title={t('showcase.title')}
        doctors={cards}
      />
      <TeamRoster
        eyebrow={t('roster.eyebrow')}
        title={t('roster.title')}
        members={populateTeamRoster(locale)}
      />
      <DoctorStats
        scaled
        ground="page"
        align="start"
        eyebrow={t('doctor.stats.eyebrow')}
        title={t('doctor.stats.title')}
        atLeast={t('doctor.stats.atLeast')}
        tiles={toStatTiles(populateStats(locale, clinicStats))}
        format={new Intl.NumberFormat(locale).format}
      />
      <ClinicLocation scaled />
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

/** Does `first` come before `second` in the document? */
const precedes = (first: Element, second: Element): boolean =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The nearest size container above an element — the box its `@3xl` reads. */
const columnOf = (element: Element): HTMLElement => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node;
  }
  throw new Error('team story: no size container above the element');
};

/** The content box of the container an element reads — for a doctor card,
 *  its own INSET (PersonnelCard D17). */
const contentOf = (element: Element): number => {
  const column = columnOf(element);
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(column);
  return (
    column.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight) -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth)
  );
};

/** Is the card in its two-column branch? Asked of the container, never of the window. */
const sitsBeside = (element: Element): boolean =>
  contentOf(element) >= 48 * rem();

/** Is the card in its PHONE header (PersonnelCard D20)? Its INSET from the
 *  12.5rem floor to 24rem — every upright phone at 100 % zoom — asked the
 *  same way; under the floor the card stacks. */
const inHeader = (element: Element): boolean => {
  const content = contentOf(element);
  return content >= 12.5 * rem() && content < 24 * rem();
};

/**
 * Fonts and pictures first, then boxes (#110).
 *
 * EVERY PICTURE IS ASKED FOR FIRST (2026-09-30 — found on the real-doctors
 * lane's CI and reproduced here): the cards' pictures ship `loading="lazy"`,
 * and a lazy picture far below the window is never STARTED by the browser, so
 * its load never finishes and a wait on it times out. It stays invisible on a
 * workstation, where an earlier story has left the same file in the memory
 * cache; on CI the optimized variants do not exist yet when the tests run, so
 * nothing is cached. Flipping `loading` to eager is HTML's own resumption of
 * a deferred load — no scroll, no timer. Whatever a play asserts about how a
 * picture SHIPS must therefore be read before this runs.
 *
 * THE WAIT IS BOUNDED AND NAMED (the real-doctors lane's shape, taken at the
 * merge of 2026-09-30): `complete`, polled under a timeout well inside the
 * runner's 15 s, so a picture that never settles fails this play by NAME —
 * its `currentSrc` — instead of timing the whole test out; no `decode()`,
 * which is unbounded and adds nothing to a layout read. SETTLED MEANS LOADED
 * OR BROKEN: on CI the optimizer's variants do not exist, a picture errors and
 * ui/Image swaps it to the original file — sound on this page, because every
 * picture's box is reserved from its `width`/`height` (§11), the same whether
 * it arrived or broke; nothing here asserts pixels. And the visual net leans
 * on the flip: its full-page screenshot waits for fonts only, so on this page,
 * taller than the lazy-loading distance at the phone widths, the far pictures
 * are in the baseline because this play asked for them.
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

const cardName = (card: HTMLElement): string | null =>
  within(card).getByRole('heading').textContent;

/**
 * The first doctor card, coarsely: the picture beside the text and the name
 * level with the button when the card has two columns; specialty → name →
 * picture → text → button when it stacks; and on a phone (PersonnelCard D20)
 * the specialty on top, then the round photo on the LEFT beside the name — as
 * on every card, the mirrored ones too (D20's ONE SIDE ON A PHONE) — then the
 * text and the button. The picture is
 * measured by its CELL: on a phone the <img> is drawn 165 % of its circle and
 * clipped. The fine numbers are sections/PersonnelCard's own stories' business.
 */
const expectFirstCard = async (card: HTMLElement): Promise<void> => {
  const quote = within(card).getByRole('blockquote');
  const heading = within(card).getByRole('heading');
  const position = heading.parentElement?.querySelector('p');
  const cell = card.querySelector('img')?.parentElement;
  const link = within(card).getByRole('link');
  if (!cell || !position)
    throw new Error('team story: the first card lost its picture or position');

  const picture = cell.getBoundingClientRect();
  const name = heading.getBoundingClientRect();
  const specialty = position.getBoundingClientRect();
  const words = quote.getBoundingClientRect();
  const button = link.getBoundingClientRect();
  for (const box of [picture, name, specialty, words, button])
    await expect(box.height).toBeGreaterThan(0);

  if (sitsBeside(quote)) {
    // Row 1: the picture ‖ the text. Row 2: the name ‖ the button.
    await expect(picture.right).toBeLessThanOrEqual(words.left);
    await expect(name.top).toBeGreaterThanOrEqual(picture.bottom);
    await expect(button.top).toBeGreaterThanOrEqual(words.bottom);
    await expect(name.right).toBeLessThanOrEqual(button.left);
    await expect(name.top).toBeLessThan(button.bottom);
    await expect(button.top).toBeLessThan(specialty.bottom);
    return;
  }
  if (inHeader(quote)) {
    // Row 1 the specialty; row 2 the round photo ‖ the name; then the text
    // and the button (D20).
    await expect(specialty.bottom).toBeLessThanOrEqual(
      Math.min(picture.top, name.top),
    );
    await expect(Math.abs(picture.width - picture.height)).toBeLessThan(0.5);
    await expect(picture.right).toBeLessThanOrEqual(name.left);
    await expect(Math.max(picture.bottom, name.bottom)).toBeLessThanOrEqual(
      words.top,
    );
    await expect(words.bottom).toBeLessThanOrEqual(button.top);
    return;
  }
  await expect(specialty.bottom).toBeLessThanOrEqual(name.top);
  await expect(name.bottom).toBeLessThanOrEqual(picture.top);
  await expect(picture.bottom).toBeLessThanOrEqual(words.top);
  await expect(words.bottom).toBeLessThanOrEqual(button.top);
};

/**
 * Everything both stories check, against the language they were pinned to.
 * Written once because the page's contract does not change with the locale —
 * only the words do.
 */
const playPage =
  (
    words: {
      title: string;
      eyebrow: string;
      showcase: string;
      profile: string;
      location: string;
      /** The numbers band's opener — the doctor page's `team.doctor.stats.*`
       *  keys — and the lead it must NOT print. */
      numbers: { eyebrow: string; title: string; lead: string };
      /** The staff band's opener since 2026-10-02 — `team.roster.*` (§15.32). */
      roster: { eyebrow: string; title: string };
    },
    locale: Locale,
  ): NonNullable<Story['play']> =>
  async ({ canvas, canvasElement }) => {
    // HOW EVERY PICTURE SHIPS — read BEFORE `settled` asks for them all. The
    // page's first picture is the first doctor's, and it PRELOADS: the band
    // opens the first screen here and that picture is its largest paint (the
    // band's D9, the page's `firstScreen`). Every later one — the other
    // doctors', the staff tiles' — is lazy.
    const [firstPicture, ...laterPictures] = Array.from(
      canvasElement.querySelectorAll('img'),
    );
    await expect(firstPicture?.closest('[data-ribbon-station]')).toBeInstanceOf(
      HTMLElement,
    );
    await expect(firstPicture).toHaveAttribute('fetchpriority', 'high');
    await expect(firstPicture).not.toHaveAttribute('loading', 'lazy');
    for (const picture of laterPictures)
      await expect(picture).toHaveAttribute('loading', 'lazy');

    await settled(canvasElement);
    // ONE PICTURE PER PERSON — a doctor's cutout, a staff member's portrait —
    // so the settle above is never vacuous: a page that stopped rendering
    // <img>s (pictures as CSS backgrounds, say) would let it pass over nothing.
    // The numbers band adds none: its three drawings are inline <svg> glyphs.
    await expect(canvasElement.querySelectorAll('img')).toHaveLength(
      doctors.length + auxiliaries.length,
    );

    // THE OUTLINE ROOT: one <h1>, the page's own — sr-only, outside every band.
    const title = canvas.getByRole('heading', { level: 1, name: words.title });
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(title).toHaveClass('sr-only');
    await expect(title.closest('section')).toBeNull();

    // THE DOCTORS BAND: a region named by its own <h2>, its eyebrow above.
    const band = canvas.getByRole('region', { name: words.showcase });
    await expect(within(band).getByText(words.eyebrow)).toBeVisible();
    const list = within(band).getByRole('list');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(
      doctors.length,
    );
    const doctorCards = within(list).getAllByRole('article');
    await expect(doctorCards.map(cardName)).toEqual(
      doctors.map((doctor) => doctor.words[locale].name),
    );

    // ONE link per card — to that doctor's own page, named with the person.
    for (const [index, card] of doctorCards.entries()) {
      const doctor = doctors[index];
      const links = within(card).getAllByRole('link');
      await expect(links).toHaveLength(1);
      await expect(links[0]).toHaveAttribute(
        'href',
        `/${locale}/team/${doctor.id}/`,
      );
      await expect(links[0].textContent).toBe(words.profile);
      await expect(links[0]).toHaveAccessibleName(
        `${words.profile} ${doctor.words[locale].name}`,
      );
    }

    const [firstCard] = doctorCards;
    if (!firstCard) throw new Error('lib/team has no doctor to story');
    await expectFirstCard(firstCard);
    // ONE SIDE ON A PHONE (PersonnelCard D20): in the phone header EVERY
    // card's round photo stands left of its name — the mirrored, odd cards
    // too ("i prefer only left on phone", the owner, 2026-10-10); `side`
    // mirrors a card from its wide step alone.
    for (const card of doctorCards) {
      if (!inHeader(within(card).getByRole('blockquote'))) continue;
      const cell = card.querySelector('img')?.parentElement;
      if (!cell)
        throw new Error(`team story: ${cardName(card)} lost its picture`);
      await expect(cell.getBoundingClientRect().right).toBeLessThanOrEqual(
        within(card).getByRole('heading').getBoundingClientRect().left,
      );
    }

    // THE RIBBON IS MOUNTED: one canvas per doctor in its decorative layer,
    // each sized — its guard zeroes them all when the strip would touch a
    // name, a text or a button.
    const layer = list.lastElementChild;
    if (!(layer instanceof HTMLElement))
      throw new Error('team story: the ribbon lost its layer');
    await expect(layer).toHaveAttribute('aria-hidden', 'true');
    // 3 s, the band stories' own allowance: the canvases arrive after mount.
    await waitFor(
      () =>
        expect(layer.querySelectorAll('canvas')).toHaveLength(doctors.length),
      { timeout: 3_000 },
    );
    for (const canvasNode of layer.querySelectorAll('canvas'))
      await waitFor(() => expect(canvasNode.width).toBeGreaterThan(0), {
        timeout: 3_000,
      });

    // THE STAFF TILES: the next band — since 2026-10-02 a region named by its
    // own <h2> (`team.roster.title`), its eyebrow above it (§15.32) — one
    // list, every auxiliary member.
    const staff = band.nextElementSibling;
    if (!(staff instanceof HTMLElement) || staff.tagName !== 'SECTION')
      throw new Error('team story: no staff band after the doctors band');
    await expect(staff).toBe(
      canvas.getByRole('region', { name: words.roster.title }),
    );
    await expect(within(staff).getByText(words.roster.eyebrow)).toBeVisible();
    const tiles = within(within(staff).getByRole('list')).getAllByRole(
      'article',
    );
    await expect(tiles.map(cardName)).toEqual(
      auxiliaries.map((member) => member.words[locale].name),
    );
    await expect(within(staff).queryAllByRole('link')).toHaveLength(0);

    // No `<k>` survives the walk, and the keywords really are fragments.
    await expect(canvasElement.textContent).not.toContain('<k>');
    await expect(
      canvasElement.querySelectorAll('article b').length,
    ).toBeGreaterThan(0);

    // THE CLINIC'S NUMBERS (owner, 2026-10-01: "between map and helping
    // staff"): the band right after the staff, a region named by the doctor
    // page's own title key, its eyebrow above it and NO lead under it, and
    // exactly the clinic's three tiles — experience, patients, procedures —
    // labelled by lib/team's `clinicStats` in this language.
    const numbers = staff.nextElementSibling;
    if (!(numbers instanceof HTMLElement))
      throw new Error('team story: no numbers band after the staff band');
    await expect(numbers).toBe(
      canvas.getByRole('region', { name: words.numbers.title }),
    );
    await expect(
      within(numbers).getByText(words.numbers.eyebrow),
    ).toBeVisible();
    await expect(
      canvas.queryByText(words.numbers.lead),
    ).not.toBeInTheDocument();
    await expect(
      within(within(numbers).getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(3);
    await expect(
      within(numbers)
        .getAllByRole('heading', { level: 3 })
        .map((label) => label.textContent),
    ).toEqual(clinicStats.map((stat) => stat.words[locale].label));

    // THE MAP IS LAST: doctors → staff → numbers → map.
    const map = canvas.getByRole('region', { name: words.location });
    await expect(precedes(band, staff)).toBe(true);
    await expect(precedes(staff, numbers)).toBe(true);
    await expect(precedes(numbers, map)).toBe(true);
    await expect(map.nextElementSibling).toBeNull();

    // THE OUTLINE, whole: no level is skipped anywhere on the page.
    await expect(
      canvas
        .getAllByRole('heading')
        .map((element) => Number(element.tagName[1])),
    ).toEqual([
      1, // the page's own, sr-only
      2, // the doctors band
      ...doctors.map(() => 3), // one per doctor card
      2, // the staff band, since 2026-10-02 (§15.32)
      ...auxiliaries.map(() => 3), // one per staff tile
      2, // the numbers band
      ...clinicStats.map(() => 3), // one per clinic tile — three
      2, // the map
    ]);

    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  };

export const Romanian: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: playPage(
    {
      title: ro.team.title,
      eyebrow: ro.team.showcase.eyebrow,
      showcase: ro.team.showcase.title,
      profile: ro.team.showcase.profile,
      location: ro.home.location.title,
      numbers: ro.team.doctor.stats,
      roster: ro.team.roster,
    },
    'ro',
  ),
};

/** GERMAN — the §8.4 expansion stress, pinned to the SMARTPHONE width, where
 *  every card is one column (D21) under the phone's header — the round photo
 *  beside the name, PersonnelCard D20: the longest button label, the
 *  27-letter tile compound and the longer quotes (see this file's header). With six
 *  doctors this is also the page's TALLEST frame — the one whose last pictures
 *  lie beyond the browser's lazy-loading distance (`settled` above). */
export const German: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  play: async (context) => {
    await playPage(
      {
        title: de.team.title,
        eyebrow: de.team.showcase.eyebrow,
        showcase: de.team.showcase.title,
        profile: de.team.showcase.profile,
        location: de.home.location.title,
        numbers: de.team.doctor.stats,
        roster: de.team.roster,
      },
      'de',
    )(context);
    // The preview decorator stamps the language the quotes and the hyphens
    // read (§8.10, §15.14).
    await expect(document.documentElement.lang).toBe('de');
  },
};
