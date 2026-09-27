import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import {
  TeamRoster,
  type TeamRosterDoctor,
  type TeamRosterMember,
} from './TeamRoster';

// FIVE stories, and the count is the honest one: the whole page shape at the
// width where the alternation is visible, the two halves on their own (either
// list may be empty on a real populator run), and the two expansion stresses.
// The export NAMES are load-bearing — each one names a baseline file
// (`sections-teamroster--default`, `sections-teamroster--german-longest`, …),
// so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the run's visual manifest. The `Sections/*` title
// prefix routes every one of them to 390 + 1536 (tests/visual/stories.spec.ts,
// §13); the 'stress-320' tag adds the accessibility width to the three whose
// layout has something to say there (a 256px column around a 192px portrait, a
// German compound in a mono eyebrow, a 40%-expanded page title).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props, run D1 — the Team page owns the keys): the preview decorator
//     stamps `<html lang>` from that global, and both `hyphens: auto` (§15.14)
//     and the `quotes` property (PersonnelCard D8) pick their behaviour from
//     the declared language. Flip the toolbar to Pseudo over any story here
//     and nothing changes — that is the §8.9 sweep PASSING, and the reason the
//     pseudo stress below is typed out as a fixture instead of produced by the
//     toolbar (the PersonnelCard / DoctorProfile precedent);
//   · the viewport pin, because this band CHANGES SHAPE with the column it is
//     handed twice over: the doctor cards flip at 48rem of CARD width and the
//     auxiliary grid gains a track every 17.5rem of COLUMN. A manager canvas
//     narrowed by the sidebar sits in the middle of both bands, so an unpinned
//     story would photograph an accident. Playwright ignores the pin — it sets
//     its own page size per project — which is exactly why every geometry
//     assertion below DERIVES its expectation from a measured box instead of
//     assuming the pinned width.
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
// file and hydrates nothing of its own. The links are plain anchors with
// finished hrefs (§15.13), and the only islands in the frame are the ones
// ui/Image brings with the five portraits (PersonnelCard D11) — which is also
// why the demo photographs are committed fixtures rather than a design-time
// placeholder.
//
// ── THE THREE COPIED HELPERS BELOW (`expectNoSidewaysScroll`, `sitsBeside`,
// the parts walk) are the story tier's recorded duplication, not an oversight:
// the standing promotion trigger for a story/test helper module is the one
// §15.19's round-3 table names, and moving them is that lane's job, not this
// band's. Each is copied WITH its reasoning so neither copy can drift silently.
//
// Demo people are INVENTED and the portraits are synthetic silhouettes
// (public/images/demo/portrait-1…3.jpg, 600×800): no real patient or employee,
// nothing to license, obviously placeholders. Copy is Romanian with diacritics
// (§15.7), first-person and factual — no superlatives, no promises, no result
// guarantees (CMSR advertising rules for dental practices, in force since
// 2025-07-01). The real people, in five languages, are the owner's to author
// (§15.17).

/** The three committed demo portraits, all at the ONE team ratio (3:4). */
const PORTRAITS = {
  elena: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  andrei: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} as const;

const TITLE = 'Echipa noastră';

/** The two labels every doctor card repeats. They are the `team` namespace's
 *  two card labels (run D2), which is why the pseudo story accents THEM and
 *  leaves the people alone. */
const LABELS = { services: 'Vezi serviciile', profile: 'Vezi profilul' };

/** The doctors, with the keyword fragments a `<Keywords segments={…} />` built
 *  from lib/team would produce (run D2) and the two finished, already
 *  locale-prefixed hrefs the page's localeHref() hands over. No quotation mark
 *  anywhere in the words: the marks are CSS, in the language of the document
 *  (PersonnelCard D8). */
const DOCTORS = [
  {
    id: 'elena-marin',
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    photo: PORTRAITS.elena,
    about: (
      <>
        Lucrez în <Keyword>ortodonție</Keyword> de peste zece ani și explic
        fiecare etapă a tratamentului. Consultația începe cu{' '}
        <Keyword>ascultarea</Keyword> pacientului, apoi construim împreună un
        plan potrivit.
      </>
    ),
    actions: {
      services: {
        href: '/ro/services/#orthodontics',
        label: LABELS.services,
      },
      profile: { href: '/ro/team/elena-marin/', label: LABELS.profile },
    },
  },
  {
    id: 'andrei-serban',
    name: 'Dr. Andrei Șerban',
    position: 'Medic dentist, chirurgie orală',
    photo: PORTRAITS.andrei,
    about: (
      <>
        Mă ocup de <Keyword>chirurgie orală</Keyword>: extracții și mici
        intervenții. Înainte de fiecare procedură explic pașii și răspund la
        întrebări, iar <Keyword>controlul</Keyword> de după se programează la o
        săptămână.
      </>
    ),
    actions: {
      services: {
        href: '/ro/services/#oral-surgery',
        label: LABELS.services,
      },
      profile: { href: '/ro/team/andrei-serban/', label: LABELS.profile },
    },
  },
] as const satisfies readonly TeamRosterDoctor[];

/** The three auxiliary tiles. The third position is deliberately long enough
 *  to WRAP inside a narrow track, so the grid stories photograph — and their
 *  play proves — the equal-heights mechanism rather than three single-line
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
    photo: PORTRAITS.elena,
  },
  {
    id: 'ana-maria-dobre',
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.andrei,
  },
] as const satisfies readonly TeamRosterMember[];

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/** The band itself — the story's only <section>, since every card inside it is
 *  an <article> and this band names no region of its own. */
const bandOf = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector('section') as HTMLElement;

/** The two lists, told apart by what the ENGINE made of them rather than by
 *  index: the doctors stand in a flex column, the auxiliaries in the auto-fit
 *  grid (D9). Either may be absent — an empty half renders no list at all. */
const listsOf = (band: HTMLElement) => {
  const lists = within(band).queryAllByRole('list');
  return {
    doctors: lists.find((list) => getComputedStyle(list).display === 'flex'),
    auxiliaries: lists.find(
      (list) => getComputedStyle(list).display === 'grid',
    ),
  };
};

/**
 * WHERE A DOCTOR CARD FLIPS, derived rather than assumed — copied from
 * PersonnelCard.stories' `sitsBeside` with its reasoning: `@3xl` is 48rem of
 * CARD width and a container query asks the CONTENT box, so ui/Card's own
 * border and padding come off before the comparison, from the FRACTIONAL
 * border-box width (`clientWidth` is an integer and would disagree with the
 * engine inside a sub-pixel window around the step), against 48rem at whatever
 * the root font-size is rather than a baked-in 768.
 */
const sitsBeside = (card: HTMLElement): boolean => {
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(card);
  const contentWidth =
    card.getBoundingClientRect().width -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth) -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight);
  const step =
    48 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  return contentWidth >= step;
};

/**
 * THE ALTERNATION, MEASURED. `side` is PersonnelCard D7's visual-only mirror,
 * so the proof is geometric: above the card's step the portrait sits on the
 * start side for even indices and on the end side for odd ones, while the DOM
 * order stays block → quote → actions in both. Below the step there is no
 * mirror left to prove — the card is one column — so the branch asserts the
 * stack instead, which is what makes this one call honest at 1536, at 390 and
 * at 320.
 */
const expectAlternation = async (band: HTMLElement): Promise<void> => {
  const quotes = [...band.querySelectorAll('blockquote')];

  for (const [index, quote] of quotes.entries()) {
    const card = quote.closest('article') as HTMLElement;
    const block = quote.previousElementSibling as HTMLElement;
    const portrait = block.children[0] as HTMLElement;
    const quoteBox = quote.getBoundingClientRect();
    const portraitBox = portrait.getBoundingClientRect();

    // A collapsed box would satisfy the comparisons below by accident.
    await expect(quoteBox.height).toBeGreaterThan(0);
    await expect(portraitBox.height).toBeGreaterThan(0);

    if (!sitsBeside(card)) {
      await expect(quoteBox.top).toBeGreaterThanOrEqual(portraitBox.bottom);
      continue;
    }
    if (index % 2 === 0) {
      await expect(portraitBox.right).toBeLessThanOrEqual(quoteBox.left);
    } else {
      await expect(quoteBox.right).toBeLessThanOrEqual(portraitBox.left);
    }
  }
};

/**
 * THE AUXILIARY GRID'S CONTRACT (D9), DERIVED FROM THE USED TRACKS. The band
 * states a FLOOR — `repeat(auto-fit, minmax(16rem, 1fr))` — and the engine
 * decides the count, so the play reads the count back out of
 * `grid-template-columns` (whose resolved value is the USED track sizes, with
 * auto-fit's collapsed tracks at 0) instead of assuming one per sampled width:
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
 * The facts a picture cannot show, in one place: the page's single <h1>, the
 * cards in DOM ORDER — doctors first, then the auxiliaries — each an `article`
 * named by its own heading, and both of a doctor's links by name and href
 * (§9: the accessible name is the label AND the person it belongs to —
 * PersonnelCard D15).
 */
const expectRoster = async (
  band: HTMLElement,
  expected: {
    title: string;
    doctors: readonly TeamRosterDoctor[];
    members: readonly TeamRosterMember[];
  },
): Promise<void> => {
  const canvas = within(band);

  await expect(
    canvas.getByRole('heading', { level: 1, name: expected.title }),
  ).toBeVisible();
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);

  const names = [
    ...expected.doctors.map((doctor) => doctor.name),
    ...expected.members.map((member) => member.name),
  ];
  const articles = names.length === 0 ? [] : canvas.getAllByRole('article');
  await expect(articles).toHaveLength(names.length);
  for (const [index, name] of names.entries()) {
    await expect(articles[index]).toBe(canvas.getByRole('article', { name }));
  }

  for (const doctor of expected.doctors) {
    const card = within(canvas.getByRole('article', { name: doctor.name }));
    for (const link of [doctor.actions.services, doctor.actions.profile]) {
      // The accessible NAME is the label plus the person (PersonnelCard D15):
      // three doctors repeat the same two labels here, which is exactly the
      // roster a links list used to read as „Vezi profilul" three times.
      const anchor = card.getByRole('link', {
        name: `${link.label} ${doctor.name}`,
      });
      await expect(anchor).toBeVisible();
      await expect(anchor).toHaveAttribute('href', link.href);
      // …while the VISIBLE words stay the label alone (SC 2.5.3).
      await expect(anchor).toHaveTextContent(link.label);
    }
  }
  for (const member of expected.members) {
    await expect(
      within(canvas.getByRole('article', { name: member.name })).queryAllByRole(
        'link',
      ),
    ).toHaveLength(0);
  }
};

const meta = {
  title: 'Sections/TeamRoster',
  component: TeamRoster,
  parameters: {
    layout: 'fullscreen',
  },
  args: { title: TITLE, doctors: DOCTORS, members: MEMBERS },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The Team page’s own <h1>, finished and already translated (§8.1) — visible, at ui/Heading’s `hero` step (§15.24, the one h1 size app-wide), with no eyebrow above it and no sub-heading below it (run D10, the owner’s "as simple as possible")',
    },
    doctors: {
      control: false,
      description:
        'The doctors, in reading order. Sides ALTERNATE by index (start, end, start …) — PersonnelCard D7’s visual-only mirror, computed here so a doctor added to lib/team cannot arrive with the wrong side in the data. Each one’s `about` is already rendered and each one’s two links already locale-prefixed (run D1/D2). Not a live control: a text knob over portraits, fragments and hrefs would only ever produce a broken card',
    },
    members: {
      control: false,
      description:
        'The auxiliary personnel, in reading order, in `repeat(auto-fit, minmax(16rem, 1fr))` tracks (run D9): the band states the FLOOR PersonnelCard D5 needs and the engine picks the count — 1 column at 390, 2 at 768, 3 at 1280, 4 at 1536, 5 at 1920. Not a live control, for the reason above',
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
 * THE WHOLE PAGE SHAPE — Romanian, at the laptop width, which is where the
 * owner's sentence is visible: "as simple as possible as it is now in team
 * composition". Two doctors with their sides alternating, the three auxiliary
 * tiles under them, one 24px rhythm all the way down, and the page's own title
 * over the lot.
 *
 * The title control is live; the two object props deliberately are not (see
 * their descriptions).
 *
 * **1536 · 320 (`stress-320`):** at 1536 each doctor card is the 2×2 grid
 * (portrait beside the words, mirrored on the second card) and the three tiles
 * share one row of four available tracks. At the stress width the same markup
 * is one column throughout — portrait, words, the two full-width links, then
 * three stacked tiles — with 256px of column and nothing scrolling sideways.
 * The play reads back what a picture cannot: the single h1, the five cards in
 * DOM order, both links per doctor by name and href, and both geometries
 * DERIVED from measured boxes so the one assertion holds at either width.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, {
      title: TITLE,
      doctors: DOCTORS,
      members: MEMBERS,
    });
    await expectAlternation(band);

    const { doctors, auxiliaries } = listsOf(band);
    await expect(doctors).toBeDefined();
    await expectGrid(auxiliaries as HTMLElement);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * DOCTORS ONLY — the state a clinic that has not yet photographed its
 * auxiliary personnel really produces, and the proof that the missing half
 * renders NO list rather than an empty one (a `<ul>` with no children
 * announces "list, 0 items" and photographs as a hole in the rhythm).
 *
 * It is also the cleanest look at the alternation: two cards, mirrored, with
 * nothing under them.
 */
export const DoctorsOnly: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { members: [] },
  play: async ({ canvasElement }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, { title: TITLE, doctors: DOCTORS, members: [] });
    await expectAlternation(band);

    const { doctors, auxiliaries } = listsOf(band);
    await expect(within(band).getAllByRole('list')).toHaveLength(1);
    await expect(doctors).toBeDefined();
    await expect(auxiliaries).toBeUndefined();
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE AUXILIARY GRID ON ITS OWN — the other missing half, and the frame where
 * the tracks are the subject: three tiles in four available tracks at 1536, so
 * they share one row, equal-height, each at least 16rem wide.
 *
 * The equal heights are not a `minHeight` prop the card refuses to own: the
 * grid stretches its ITEM (`align-items: stretch`), and `h-full` on the
 * <article> inside the stretched <li> is what makes the surface follow, so the
 * third tile's two-line position lifts the whole row instead of leaving its
 * neighbours short.
 */
export const MembersOnly: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { doctors: [] },
  play: async ({ canvasElement }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, { title: TITLE, doctors: [], members: MEMBERS });

    const { doctors, auxiliaries } = listsOf(band);
    await expect(within(band).getAllByRole('list')).toHaveLength(1);
    await expect(doctors).toBeUndefined();
    await expect(band.querySelectorAll('blockquote')).toHaveLength(0);
    await expectGrid(auxiliaries as HTMLElement);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width
 * carrying the words this band is most likely to break on: „Unser
 * Behandlungsteam" as the page title, „Fachzahnärztin für Kieferorthopädie"
 * and „Zahnmedizinische Fachangestellte" in mono eyebrows that never
 * hyphenate (PersonnelCard D5), „Behandlungsschwerpunkte" inside a justified
 * quote, and the longest of the five label pairs under it.
 *
 * `lang="de"` rides the native prop spread onto the BAND and inherits to every
 * child, which is the whole mechanism and does two jobs at once: `hyphens:
 * auto` (§15.14) picks the German dictionary, so the compound in the running
 * text breaks at a syllable instead of pushing a card open — and `quotes`
 * picks the GERMAN marks, so the generated content around each quote reads
 * „…“ while the Romanian stories read „…”, with not one character of it in any
 * string (PersonnelCard D8). The names and the positions are the exception
 * that proves the rule: both wear `hyphens-none` one tier down, so they may
 * only wrap between words.
 *
 * **390 · 320 (`stress-320`):** one column everywhere, each link on its own
 * full-width line (ui/Button's `hyphens-none` means a label may wrap between
 * words but never split one), and a single auxiliary track holding a
 * two-line position.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    title: 'Unser Behandlungsteam',
    doctors: [
      {
        id: 'elena-marin',
        name: 'Dr. Friederike Schwarzenbeck',
        position: 'Fachzahnärztin für Kieferorthopädie',
        photo: PORTRAITS.elena,
        about: (
          <>
            Meine <Keyword>Behandlungsschwerpunkte</Keyword> sind feste und
            herausnehmbare Zahnspangen. Jeden Schritt der Behandlung erkläre ich
            vorher, und die <Keyword>Nachkontrolle</Keyword> vereinbaren wir
            gemeinsam.
          </>
        ),
        actions: {
          services: {
            href: '/de/services/#orthodontics',
            label: 'Leistungen ansehen',
          },
          profile: { href: '/de/team/elena-marin/', label: 'Profil ansehen' },
        },
      },
    ],
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
        photo: PORTRAITS.elena,
      },
    ],
    lang: 'de',
  },
  play: async ({ canvasElement, args }) => {
    const band = bandOf(canvasElement);

    await expect(band).toHaveAttribute('lang', 'de');
    await expectRoster(band, {
      title: args.title,
      doctors: args.doctors,
      members: args.members,
    });
    await expectAlternation(band);

    const { auxiliaries } = listsOf(band);
    await expectGrid(auxiliaries as HTMLElement);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this band reads none (its strings are props, run D1). Flipping any
 * other story here to Pseudo changes nothing, which is that sweep passing; the
 * expansion stress still has to happen somewhere, and this is it.
 *
 * WHAT IS TRANSFORMED IS EXACTLY WHAT A MESSAGE KEY WOULD BE, which is run
 * D2's split made visible: the page TITLE and the two card LABELS live in the
 * `team` namespace, so they carry the accents and the `·`-padding; the PEOPLE's
 * names, positions and words are DATA travelling with their pictures in
 * `lib/team`, so pseudo-ing them here would be a picture of a pipeline this
 * site does not have. The three strings are the Romanian originals put through
 * the preview's OWN transform (the same ACCENT map, the same `·`-padding at
 * 40% of the source length), so what is sampled is the width the real pipeline
 * produces.
 *
 * **390 · 320 (`stress-320`):** the expanded h1 has to absorb the growth by
 * WRAPPING inside a 312px — then 256px — column, and the two padded labels
 * have to fit their full-width buttons without clipping.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    title: 'Éçhípá ñóášťră ······',
    doctors: DOCTORS.map((doctor) => ({
      ...doctor,
      actions: {
        services: {
          ...doctor.actions.services,
          label: 'Véží šérvíçíílé ······',
        },
        profile: { ...doctor.actions.profile, label: 'Véží prófílúl ······' },
      },
    })),
  },
  play: async ({ canvasElement, args }) => {
    const band = bandOf(canvasElement);

    await expectRoster(band, {
      title: args.title,
      doctors: args.doctors,
      members: args.members,
    });
    // The data half stayed itself — that is the point of the frame.
    await expect(
      within(band).getByRole('article', { name: MEMBERS[0].name }),
    ).toBeInTheDocument();
    await expectAlternation(band);
    await expectNoSidewaysScroll(band);
  },
};
