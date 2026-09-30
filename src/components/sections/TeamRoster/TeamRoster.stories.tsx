import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { TeamRoster, type TeamRosterMember } from './TeamRoster';

// TWO stories since 2026-09-30, and the count is the honest one: the band
// holds ONE thing now — the auxiliary staff tiles — so it has one everyday
// frame and one expansion stress. The export NAMES are load-bearing — each one
// names a baseline file (`sections-teamroster--default`,
// `sections-teamroster--german-longest`), so renaming or adding an export
// re-records pictures; this list IS the section's contribution to the visual
// manifest. The `Sections/*` title prefix routes both to 390 + 1536
// (tests/visual/stories.spec.ts, §13), and the 'stress-320' tag adds the
// accessibility width to both (a 256px column around a 192px portrait, a
// German compound in a mono eyebrow that never hyphenates).
//
// ── THREE STORIES LEFT WITH THE DOCTORS (owner, 2026-09-30 — TeamRoster.tsx's
// header quotes him): the doctors are a band of their own,
// sections/DoctorShowcase, and the page title is the page's own sr-only <h1>.
// `DoctorsOnly` had nothing left to show. `MembersOnly` — the staff half on
// its own — IS `Default` now, so keeping it would photograph the same pixels
// twice. `PseudoLocale` transformed exactly the page title and the doctors'
// two link labels, the band's last message-key strings; what remains is DATA
// (names and positions travel with their pictures in lib/team), which the
// toolbar's pseudo transform never touches, so a pseudo frame would be
// `Default` again (ReviewCard's stories carry no pseudo frame either). The
// expansion stress is GermanLongest's, the longest real language (§8.4).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props, run D1 — the Team page owns the keys): the preview decorator
//     stamps `<html lang>` from that global, so every frame declares the
//     language its text is written in, as the shell does per locale (§8.10).
//     A story-level pin also beats the toolbar, so the §8.9 Pseudo sweep
//     cannot reach these frames — and would find nothing in them: the band
//     holds no message-key string (TeamRoster.test.tsx pins that no key path
//     is ever printed);
//   · the viewport pin, because the grid gains a track every 17.5rem of COLUMN
//     (D9: a 16rem floor plus the 1.5rem gap). A manager canvas narrowed by the
//     sidebar sits between two counts, so an unpinned story would photograph an
//     accident. Playwright ignores the pin — it sets its own page size per
//     project — which is exactly why the grid assertion below DERIVES its
//     expectation from the measured tracks instead of assuming the pinned width.
//
// ── NO DECORATOR, unlike PersonnelCard's stories: this component IS the band.
// It brings its own full-bleed <section>, its own ui/Container and its own
// vertical rhythm (the PAGE-BAND RECIPE in Container.tsx's header), so wrapping
// it in a second one would put the story's ground and the band's margins on two
// different rulers. `layout: 'fullscreen'` for the same reason ClinicLocation
// and DoctorProfile set it — Storybook's default canvas padding would falsify the
// gutter.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the band reads no message
// file and hydrates nothing of its own. The only islands in the frame are the
// ones ui/Image brings with the portraits (PersonnelCard D11) — which is also
// why the demo photographs are committed fixtures rather than a design-time
// placeholder.
//
// ── `expectNoSidewaysScroll` is the story tier's recorded duplication, not an
// oversight: the standing promotion trigger for a story/test helper module is
// the one §15.19's round-3 table names, and moving it is that lane's job, not
// this band's.
//
// Demo people are INVENTED and the portraits are synthetic silhouettes
// (public/images/demo/portrait-1…3.jpg, 600×800): no real patient or employee,
// nothing to license, obviously placeholders. Copy is Romanian with diacritics
// (§15.7). The real people, in five languages, are the owner's to author
// (§15.17).

/** The three committed demo portraits, all at the ONE team ratio (3:4), keyed
 *  by the Romanian person who wears each one in `Default`. */
const PORTRAITS = {
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  mihaela: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  anaMaria: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} as const;

/** The three staff tiles. The third position is deliberately long enough to
 *  WRAP inside a narrow track, so the stories photograph — and their play
 *  proves — the equal-heights mechanism rather than three single-line
 *  fixtures that could never disagree. */
const MEMBERS = [
  {
    id: 'ioana-tepes',
    name: 'Ioana Țepeș',
    position: 'Asistentă medicală',
    photo: PORTRAITS.ioana,
  },
  {
    id: 'mihaela-craciun',
    name: 'Mihaela Crăciun',
    position: 'Asistentă medicală',
    photo: PORTRAITS.mihaela,
  },
  {
    id: 'ana-maria-dobre',
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.anaMaria,
  },
] as const satisfies readonly TeamRosterMember[];

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/** The band itself — the story's only <section>, since every tile inside it is
 *  an <article> and this band names no region of its own. */
const bandOf = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector('section') as HTMLElement;

/**
 * THE GRID'S CONTRACT (D9), DERIVED FROM THE USED TRACKS. The band states a
 * FLOOR — `repeat(auto-fit, minmax(16rem, 1fr))` — and the engine decides the
 * count, so the play reads the count back out of `grid-template-columns`
 * (whose resolved value is the USED track sizes, with auto-fit's collapsed
 * tracks at 0) instead of assuming one per sampled width:
 *   · every track the engine kept is at least 16rem wide — the floor
 *     PersonnelCard D5 needs so a mono position never protrudes;
 *   · the tiles that share a row share a TOP, and an equal height with it (the
 *     `h-full`-in-a-stretched-item mechanism);
 *   · a tile past the last track starts a new row.
 * At 1536 the column is 1228px, which holds four tracks, so the three tiles
 * share one row — the contract's own sentence, proved without the number.
 */
const expectGrid = async (list: HTMLElement): Promise<void> => {
  const tiles = [...list.children] as HTMLElement[];
  const tracks = getComputedStyle(list)
    .gridTemplateColumns.split(' ')
    .map((track) => parseFloat(track))
    .filter((track) => track > 0);
  const floor =
    16 * parseFloat(getComputedStyle(document.documentElement).fontSize);

  await expect(tracks.length).toBeGreaterThan(0);
  for (const track of tracks) {
    await expect(track).toBeGreaterThanOrEqual(floor - 1);
  }

  const perRow = Math.min(tracks.length, tiles.length);
  const boxes = tiles.map((tile) => tile.getBoundingClientRect());
  const firstRow = boxes.slice(0, perRow);
  const tops = firstRow.map((box) => box.top);
  await expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);

  const heights = new Set(firstRow.map((box) => Math.round(box.height)));
  await expect(heights.size).toBe(1);

  if (boxes.length > perRow) {
    await expect(boxes[perRow].top).toBeGreaterThanOrEqual(
      firstRow[0].bottom - 1,
    );
  }
};

/**
 * The facts a picture cannot show, in one place: no <h1> here (it is the
 * page's, sr-only, in the page's own markup), ONE list, the tiles in DOM order
 * — each an `article` named by its own <h2>, and no other heading — and
 * nothing to follow (PersonnelCard D2: an auxiliary tile brings no link).
 */
const expectRoster = async (
  band: HTMLElement,
  members: readonly TeamRosterMember[],
): Promise<void> => {
  const canvas = within(band);

  await expect(canvas.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  await expect(canvas.getAllByRole('list')).toHaveLength(1);

  const articles = canvas.getAllByRole('article');
  await expect(articles).toHaveLength(members.length);
  for (const [index, member] of members.entries()) {
    await expect(articles[index]).toBe(
      canvas.getByRole('article', { name: member.name }),
    );
    const heading = within(articles[index]).getByRole('heading', {
      name: member.name,
    });
    await expect(heading.tagName).toBe('H2');
    await expect(heading).toBeVisible();
  }
  await expect(canvas.getAllByRole('heading')).toHaveLength(members.length);
  await expect(canvas.queryAllByRole('link')).toHaveLength(0);
};

const meta = {
  title: 'Sections/TeamRoster',
  component: TeamRoster,
  parameters: {
    layout: 'fullscreen',
  },
  args: { members: MEMBERS },
  argTypes: {
    members: {
      control: false,
      description:
        'The auxiliary personnel, in reading order, in `repeat(auto-fit, minmax(16rem, 1fr))` tracks (run D9): the band states the FLOOR PersonnelCard D5 needs and the engine picks the count — room for 1 track at 390, 2 at 768, 3 at 1280, 4 at 1536, 5 at 1920. Each tile’s name is an <h2> under the page’s own <h1>. EMPTY renders nothing at all. Not a live control: a text knob over portraits and their intrinsic sizes would only ever produce a broken tile',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> (§6.4/§6.8). The band owns its own paint, gutter and vertical rhythm; the page owns the space BETWEEN bands — the map comes after this one',
    },
  },
} satisfies Meta<typeof TeamRoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE BAND — Romanian, at the laptop width: the 1228px column holds four
 * 16rem tracks, so the three staff tiles share one row, and `auto-fit`
 * collapses the fourth and widens the three (D9's KNOWN CONSEQUENCE).
 *
 * The equal heights are not a `minHeight` prop the card refuses to own: the
 * grid stretches its ITEM (`align-items: stretch`), and `h-full` on the
 * <article> inside the stretched <li> is what makes the surface follow, so the
 * third tile's wrapping position lifts the whole row instead of leaving its
 * neighbours short.
 *
 * **1536 · 390 · 320 (`stress-320`):** one row of three at 1536; one track at
 * the phone widths — three stacked tiles in 312px, then 256px, of column, and
 * nothing scrolling sideways. The play reads back what a picture cannot — no
 * <h1>, ONE list, the tiles in DOM order each named by its own <h2>, no link —
 * and the grid DERIVED from the measured tracks, so the one assertion holds at
 * every width.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement, args }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, args.members);
    await expectGrid(within(band).getByRole('list'));
    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width
 * carrying the words this band is most likely to break on: „Zahnmedizinische
 * Fachangestellte" in a mono eyebrow that never hyphenates (PersonnelCard D5),
 * under names that wear `hyphens-none` one tier down too, so every line here
 * may only wrap between words.
 *
 * **390 · 1536 · 320 (`stress-320`):** one track at the phone widths, the
 * position wrapping inside a 312px — then 256px — column without protruding;
 * at 1536 the two tiles share one row.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    members: [
      {
        id: 'ioana-tepes',
        name: 'Friederike Obermüller',
        position: 'Zahnmedizinische Fachangestellte',
        photo: PORTRAITS.ioana,
      },
      {
        id: 'mihaela-craciun',
        name: 'Margarethe Baumgartner',
        position: 'Zahnmedizinische Fachangestellte',
        photo: PORTRAITS.mihaela,
      },
    ],
  },
  play: async ({ canvasElement, args }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, args.members);
    await expectGrid(within(band).getByRole('list'));
    await expectNoSidewaysScroll(band);
  },
};
