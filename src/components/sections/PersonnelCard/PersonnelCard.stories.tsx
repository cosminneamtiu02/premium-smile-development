import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import {
  Keyword,
  PersonnelCard,
  type PersonnelKind,
  type PersonnelPhoto,
  type PersonnelSide,
} from './PersonnelCard';

// SEVEN stories, and the count is the honest one: the everyday tile, the grid
// it lives in, the two doctor arrangements, the page shape both kinds compose
// into, and the two expansion stresses. The export NAMES are load-bearing —
// each one names a baseline file (`sections-personnelcard--default`,
// `sections-personnelcard--doctor-mirrored`, …), so renaming or adding an
// export re-records pictures; this list IS the section's contribution to the
// lane's visual manifest. The `Sections/*` title prefix routes every one of
// them to 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag
// adds the accessibility width to the four whose layout has something to say
// there (a 256px column around a 192px portrait, a justified quote in a 206px
// measure, a German compound, a 40%-expanded name).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this section reads no message file (its
//     strings are props, §8.1 — the Team band owns the keys): the preview
//     decorator stamps `<html lang>` from that global, and both `hyphens: auto`
//     (§15.14) and the `quotes` property (D8) pick their behaviour from the
//     declared language. Flip the toolbar to Pseudo over any story here and
//     nothing changes — that is the §8.9 sweep PASSING, and the reason the
//     pseudo stress below is typed out as a fixture instead of produced by the
//     toolbar (the SectionHeading precedent);
//   · the viewport pin, because this card CHANGES SHAPE with the box it is
//     handed: the doctor row flips at `@3xl` = 768px of CARD width (D7). A
//     manager canvas narrowed by the sidebar sits in the middle of that band,
//     so an unpinned story would photograph an accident. Playwright ignores the
//     pin — it sets its own page size per project — which is exactly why every
//     geometry assertion below DERIVES its expectation from the measured card
//     instead of assuming the pinned width.
//
// ── THE DECORATOR IS THE PAGE-BAND RECIPE (the standing law in
// Container.tsx's header): a semantic full-bleed <section> that PAINTS, and a
// <Container> that measures the column and carries the band's own `py-10`. Not
// decoration — ui/Card applies inline-size containment (Card D10), so a card
// must always sit in a width-giving parent, and photographing one on a bare
// canvas would show a box sized by a rule this card does not use.
// `layout: 'fullscreen'` is load-bearing for the same reason as in
// Card.stories: Storybook's default canvas padding would falsify the band.
//
// ── NO PROPS-DRIVEN LOCALE, NO MOCK MESSAGES, NO `parameters.nextjs`: this
// card reads no message file, links nowhere and hydrates nothing of its own
// (D11) — the only island in the frame is the one ui/Image brings with the
// portrait, which is also why the demo photographs are committed fixtures
// rather than a design-time placeholder.
//
// Demo people are INVENTED and the portraits are synthetic silhouettes
// (public/images/demo/portrait-1…3.jpg, 600×800, D12): no real patient or
// employee, nothing to license, obviously placeholders. Copy is Romanian with
// diacritics (§15.7), first-person and factual — no superlatives, no promises,
// no result guarantees (CMSR advertising rules for dental practices, in force
// since 2025-07-01). The real people, in five languages, are the owner's to
// author (§15.17).

const Band = ({ children }: { children: ReactNode }): ReactElement => (
  <section className="bg-page">
    <Container className="py-10">{children}</Container>
  </section>
);

/**
 * The band as a decorator, typed `Decorator` ON PURPOSE (the
 * .storybook/preview.tsx precedent) rather than written inline in the meta.
 * An inline `(Story) => …` is contextually typed over the meta's
 * `Simplify<PersonnelCardProps>` — the two `kind` branches — and
 * `StoryObj<typeof meta>` folds every decorator's args through
 * `ArgsFromMeta` → `DecoratorsArgs` → `UnionToIntersection`: the branches
 * intersect to `never`, every story is asked for `args: never`, and a
 * `render` cannot even spread its args (G2 react + typescript, both
 * reproduced with the repo's own tsc). Over `Decorator`'s StrictArgs the
 * decorator contributes nothing to that fold, the union survives, and the
 * house idiom holds: `args` stays optional per story, `{ kind: 'doctor' }`
 * without `about` is refused, and `render` receives the real props.
 */
const withBand: Decorator = (Story) => (
  <Band>
    <Story />
  </Band>
);

/** The three committed demo portraits, all at the ONE team ratio (3:4, D3). */
const PORTRAITS = {
  elena: { src: 'images/demo/portrait-1.jpg', width: 600, height: 800 },
  ioana: { src: 'images/demo/portrait-2.jpg', width: 600, height: 800 },
  andrei: { src: 'images/demo/portrait-3.jpg', width: 600, height: 800 },
} satisfies Record<string, PersonnelPhoto>;

/** The two doctors' own words (D8), with the keyword fragments a `t.rich(…, {
 *  k: (chunks) => <Keyword>{chunks}</Keyword> })` call would produce (D9).
 *  No quotation mark anywhere in here: the marks are CSS, in the language of
 *  the document. */
const ELENA_ABOUT = (
  <>
    Lucrez în <Keyword>ortodonție</Keyword> de peste zece ani și explic fiecare
    etapă a tratamentului. Consultația începe cu <Keyword>ascultarea</Keyword>{' '}
    pacientului, apoi construim împreună un plan potrivit.
  </>
);

const ANDREI_ABOUT = (
  <>
    Mă ocup de <Keyword>chirurgie orală</Keyword>: extracții și mici
    intervenții. Înainte de fiecare procedură explic pașii și răspund la
    întrebări, iar <Keyword>controlul</Keyword> de după se programează la o
    săptămână.
  </>
);

/** The three auxiliary tiles the grid stories share. The third position is
 *  deliberately long enough to WRAP inside a three-column track, so the grid
 *  stories photograph — and their play proves — the equal-heights mechanism
 *  rather than three single-line fixtures that could never disagree. */
const AUXILIARIES = [
  {
    name: 'Ioana Țepeș',
    position: 'Asistentă medicală',
    photo: PORTRAITS.ioana,
  },
  {
    name: 'Mihaela Crăciun',
    position: 'Asistentă medicală',
    photo: PORTRAITS.elena,
  },
  {
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.andrei,
  },
];

/** The band's own grid — the page shape a Team lane will write around these
 *  cards, and the two lines it must copy exactly. `@md`/`@3xl` measure the
 *  CONTAINER column (§6.5). `role="list"` is redundant in the spec but
 *  load-bearing in WebKit, which drops list semantics from any
 *  `list-style: none` list (the ui/SpeedDial precedent, configured as an
 *  exception in eslint.config.mjs). And `className="h-full"` on the CARD is
 *  what makes the row's heights equal (G2 react): the grid stretches its
 *  ITEM — the <li> — while the <article> inside it is an ordinary block, so
 *  without the placement class a taller neighbour lifts the <li> and leaves
 *  the shorter card's surface hanging short. A stretched grid item's height
 *  is definite, so the percentage resolves — §6.8 placement, exactly as
 *  Card.stories pins it. Fixtures are keyed by name; the Team lane keys by
 *  member id. */
const AuxiliaryTiles = (): ReactElement => (
  <ul role="list" className="grid gap-6 @md:grid-cols-2 @3xl:grid-cols-3">
    {AUXILIARIES.map((person) => (
      <li key={person.name}>
        <PersonnelCard kind="auxiliary" className="h-full" {...person} />
      </li>
    ))}
  </ul>
);

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/**
 * WHERE THE DOCTOR ROW FLIPS, derived rather than assumed. `@3xl` is 48rem of
 * CARD width (D7) and a container query asks the CONTENT box — so ui/Card's own
 * border and padding (25px per side, its sum rule) come off before the
 * comparison, from the FRACTIONAL border-box width (`clientWidth` is an
 * integer and would disagree with the engine inside a sub-pixel window around
 * the step — G2 react), against 48rem at whatever the root font-size is
 * rather than a baked-in 768 (G2 typescript). Deriving it here is what lets
 * these plays hold at ANY width: the visual runner ignores the viewport pin
 * and renders every `Sections/*` story at 390 and 1536, and the workbench
 * canvas is whatever the sidebar leaves.
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

/** The arrangement contract in one place: the DOM order never moves, and the
 *  boxes sit where the measured width says they should (D7). */
const expectArrangement = async (
  card: HTMLElement,
  block: HTMLElement,
  quote: HTMLElement,
  side: PersonnelSide,
): Promise<void> => {
  // Reading order is "who, then what they say" whichever way the row faces —
  // `side` is a visual-only mirror, so a screen reader and the stacked phone
  // layout see the same sequence in both stories.
  await expect(
    block.compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  // The step itself, read off the layout box: `column` below `@3xl`, and the
  // row the `side` lookup names above it. Asserting this as well as the
  // geometry is what keeps the frame honest at every width — whichever branch
  // the runner lands in, one of the two is being proved rather than skipped.
  const beside = sitsBeside(card);
  const layout = block.parentElement as HTMLElement;
  await expect(getComputedStyle(layout).flexDirection).toBe(
    beside ? (side === 'start' ? 'row' : 'row-reverse') : 'column',
  );

  const blockBox = block.getBoundingClientRect();
  const quoteBox = quote.getBoundingClientRect();
  // A collapsed quote (zero height) would satisfy the stacked comparison
  // below by accident — the words must occupy real space first (G2 react).
  await expect(quoteBox.height).toBeGreaterThan(0);

  if (!beside) {
    // Below the step: one column, portrait first, the justified words below —
    // the owner's brief, verbatim.
    await expect(quoteBox.top).toBeGreaterThanOrEqual(blockBox.bottom);
    return;
  }
  if (side === 'start') {
    await expect(blockBox.right).toBeLessThanOrEqual(quoteBox.left);
  } else {
    await expect(quoteBox.right).toBeLessThanOrEqual(blockBox.left);
  }
};

/** The portrait block is the quote's previous sibling — reached by structure
 *  because it carries no role of its own (it is a layout box). */
const blockBeside = (quote: HTMLElement): HTMLElement =>
  quote.previousElementSibling as HTMLElement;

/** The two controls' options, derived from keyed objects rather than typed as
 *  arrays (the Card.stories `TONE_OPTIONS` reasoning): `satisfies { [K in
 *  PersonnelKind]: K }` refuses to compile while a member is MISSING, which a
 *  `satisfies PersonnelKind[]` array cannot see — it only catches a wrong one
 *  (G2 typescript). */
const KIND_OPTIONS = {
  auxiliary: 'auxiliary',
  doctor: 'doctor',
} satisfies { [K in PersonnelKind]: K };
const SIDE_OPTIONS = {
  start: 'start',
  end: 'end',
} satisfies { [K in PersonnelSide]: K };

const meta = {
  title: 'Sections/PersonnelCard',
  component: PersonnelCard,
  parameters: { layout: 'fullscreen' },
  args: {
    kind: 'auxiliary',
    name: AUXILIARIES[0].name,
    position: AUXILIARIES[0].position,
    photo: PORTRAITS.ioana,
  },
  argTypes: {
    kind: {
      control: 'inline-radio',
      options: Object.values(KIND_OPTIONS),
      description:
        'Which card this is (D2) — REQUIRED, with no default: the Team band always knows, and a default discriminant would weaken the union at every call site. `auxiliary` is the portrait column alone; `doctor` adds the quote and the wide-step row. Switching it here without an `about` renders a doctor card with an empty quote, which is exactly what the TYPES refuse at a real call site',
    },
    name: {
      control: 'text',
      description:
        'The full name, finished and already translated (§8.1) — becomes the card’s real <h3> and, through aria-labelledby, the article’s accessible name (D4). Never hyphenates: a person’s name wraps between words or not at all (§15.14’s rider)',
    },
    position: {
      control: 'text',
      description:
        'The position or specialisation, finished text — the mono eyebrow under the name (D5). Authored in SENTENCE case: the uppercase is ui/Eyebrow’s CSS, so Ș/Ț case mapping stays the browser’s job',
    },
    photo: {
      control: false,
      description:
        'The portrait: a path under public/ plus its INTRINSIC pixel size, which is the optimizer’s srcset input and the reserved box (§11, zero layout shift). One 3:4 ratio for the whole team, and `alt=""` by construction — the name below IS the identity (D3). Not a live control: a text knob over a file path would only ever produce a broken image',
    },
    about: {
      control: false,
      description:
        'The doctor’s own words, finished and already translated — a ReactNode, so the band can hand over `t.rich(…, { k: (chunks) => <Keyword>{chunks}</Keyword> })` output (D9). The quotation marks are NOT part of it: they are CSS generated content in the document’s language (D8). Not a live control anywhere here — every doctor fixture composes JSX, which wins over a spread arg',
    },
    side: {
      control: 'inline-radio',
      options: Object.values(SIDE_OPTIONS),
      description:
        'Which side the portrait block sits on at the wide step. Default `start`. It mirrors the ROW ONLY (`flex-row-reverse`): the DOM order stays block-then-quote for both values, so reading order never moves (D7)',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the <article> (§6.4/§6.8) — a grid track, a `max-w-*`, a `col-span-*`. The card owns no width and no outer margin of its own',
    },
  },
  decorators: [withBand],
} satisfies Meta<typeof PersonnelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY TILE — one auxiliary card at the phone width, inside a
 * `max-w-sm` placement box because that is the width a grid track gives it on a
 * real page (the card owns none of its own, D10).
 *
 * All four controls that can move a card are live here: flip `kind` to
 * `doctor` and the quote row appears empty, which is the runtime shadow of the
 * type error a real call site would get instead (D2).
 *
 * **390 · 320 (`stress-320`):** the 192px portrait inside `p-6`, with the name
 * and the position centred under it and 208px of content still fitting at the
 * accessibility width. The play reads back the three facts a picture cannot:
 * the article is NAMED by its heading, the portrait is decorative (no `img`
 * role at all — `alt=""` is the decision, D3), and there is no blockquote
 * anywhere on an auxiliary card.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  render: (args) => (
    <div className="max-w-sm">
      <PersonnelCard {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole('article', { name: AUXILIARIES[0].name });
    await expect(
      canvas.getByRole('heading', { level: 3, name: AUXILIARIES[0].name }),
    ).toBeInTheDocument();
    await expect(canvas.getByText(AUXILIARIES[0].position)).toBeInTheDocument();

    // Decorative by construction: there is no `img` role to query, so the
    // element is reached the only way it can be.
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvasElement.querySelector('img')).toHaveAttribute('alt', '');

    await expect(canvasElement.querySelector('blockquote')).toBeNull();
    await expectNoSidewaysScroll(card);
  },
};

/**
 * THE GRID THE AUXILIARY CARDS LIVE IN — three tiles in the band's own column,
 * one track per card at the laptop width, two at the tablet step, one on a
 * phone.
 *
 * The subject is the EQUAL HEIGHTS, and where they come from: not from a
 * `minHeight` prop this card refuses to own, but from the grid — `align-items:
 * stretch` is its default (ui/Card D4) — plus `h-full` on the card inside the
 * stretched <li> (AuxiliaryTiles), so the third tile's two-line position
 * lifts the whole row instead of leaving its neighbours short. The play only
 * demands that when the three cards actually share a row, because at 390 the
 * same markup is one column and there is nothing to equalise.
 *
 * `role="list"` on the <ul> is redundant in the spec and load-bearing in
 * WebKit; each card is the <li>'s child rather than the <li> itself, because
 * the <article> is what carries the aria-labelledby wiring.
 */
export const AuxiliaryGrid: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  // Three fixed fixtures — the ROW is the subject, so every per-card control
  // would move nothing. Off, rather than silently inert.
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
    side: { control: false },
  },
  render: () => <AuxiliaryTiles />,
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(3);
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(3);

    const tops = cards.map((card) =>
      Math.round(card.getBoundingClientRect().top),
    );
    if (new Set(tops).size === 1) {
      const heights = new Set(cards.map((card) => card.offsetHeight));
      await expect(heights.size).toBe(1);
    }
  },
};

/**
 * THE DOCTOR CARD, portrait on the start side — the arrangement the owner
 * described first ("photo, name … kept on the left side and … a text about the
 * doctor").
 *
 * This is the frame where the quote's dress is actually measurable, and the
 * play measures all of it because none of it survives in a unit test (no
 * stylesheet there): `text-justify` (OWNER DECISION, "extremely important" — a
 * per-element override of §15.1's start-aligned prose lock, D8), the muted ink
 * that is the owner's "washed / ghost", the keyword fragments one ink step
 * darker at the SAME weight as the running text (D9 — `<b>` without the
 * bolding Preflight would give it), and the opening mark as CSS generated
 * content rather than a character in a string.
 *
 * The arrangement assertion is DERIVED from the card's measured content width,
 * not from the pinned viewport: at 1536 the card is beside-arranged and at 390
 * and 320 it is the stacked one column the owner asked for, and one assertion
 * covers all three.
 */
export const Doctor: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
  },
  render: ({ side }) => (
    <PersonnelCard
      kind="doctor"
      name="Dr. Elena Marin"
      position="Medic specialist ortodonție"
      photo={PORTRAITS.elena}
      about={ELENA_ABOUT}
      {...(side ? { side } : {})}
    />
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Dr. Elena Marin' });
    const quote = canvas.getByRole('blockquote');

    // The words arrive whole, spaces around the keyword fragments included.
    await expect(quote).toHaveTextContent(
      'Lucrez în ortodonție de peste zece ani',
    );

    const quoteStyle = getComputedStyle(quote);
    await expect(quoteStyle.textAlign).toBe('justify');
    // --ink-muted (#5b554f), the repo's quiet ink at 7.35:1 on the surface.
    await expect(quoteStyle.color).toBe('rgb(91, 85, 79)');
    // …and the marks the reader sees are the LANGUAGE's, taken from `quotes`
    // (initial value `auto`) rather than from any string (D8).
    await expect(getComputedStyle(quote, '::before').content).toBe(
      'open-quote',
    );
    await expect(getComputedStyle(quote, '::after').content).toBe(
      'close-quote',
    );

    const keyword = quote.querySelector('b') as HTMLElement;
    const keywordStyle = getComputedStyle(keyword);
    // --ink-strong (#1a1714): "more colored towards black", at 400 — the
    // running text's weight, with Preflight's `bolder` undone (D9).
    await expect(keywordStyle.color).toBe('rgb(26, 23, 20)');
    await expect(keywordStyle.fontWeight).toBe('400');

    await expectArrangement(card, blockBeside(quote), quote, 'start');
    await expectNoSidewaysScroll(card);
  },
};

/**
 * THE SAME DOCTOR, MIRRORED — `side="end"`, the alternation the owner asked for
 * down a page of doctors ("alternate in which it will be turned around, photo,
 * name, etc on right side and text on left").
 *
 * The whole point of the frame is that only the PICTURE changes: the play
 * asserts the quote's box now sits left of the portrait's while the DOM order
 * is still block-then-quote, which is what `flex-row-reverse` buys and why the
 * mirror costs a screen reader nothing (D7). Below the step this story is
 * byte-identical in arrangement to `Doctor` — portrait first, words below — and
 * the derived assertion says so at whatever width it is rendered.
 */
export const DoctorMirrored: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
    // The mirror IS the subject of this frame — a live knob here would just
    // turn it back into the story above.
    side: { control: false },
  },
  render: () => (
    <PersonnelCard
      kind="doctor"
      name="Dr. Andrei Șerban"
      position="Medic dentist, chirurgie orală"
      photo={PORTRAITS.andrei}
      about={ANDREI_ABOUT}
      side="end"
    />
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Dr. Andrei Șerban' });
    const quote = canvas.getByRole('blockquote');

    await expectArrangement(card, blockBeside(quote), quote, 'end');
    await expectNoSidewaysScroll(card);
  },
};

/**
 * THE PAGE SHAPE — what the Team band will actually stack: two doctors
 * alternating sides, then the auxiliary grid under them, one 24px rhythm all
 * the way down.
 *
 * It exists to catch what a single card cannot show: that two doctor cards of
 * different quote lengths keep the same portrait column, that the alternation
 * reads as a rhythm rather than as an accident, and that the auxiliary tiles
 * below sit in the same measure as the cards above them. The band, its heading
 * and its strings belong to the page lane (§15.17) — this frame is the
 * COMPOSITION only, which is why there is no <h2> in it.
 */
export const TeamComposition: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
    side: { control: false },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      <PersonnelCard
        kind="doctor"
        name="Dr. Elena Marin"
        position="Medic specialist ortodonție"
        photo={PORTRAITS.elena}
        about={ELENA_ABOUT}
        side="start"
      />
      <PersonnelCard
        kind="doctor"
        name="Dr. Andrei Șerban"
        position="Medic dentist, chirurgie orală"
        photo={PORTRAITS.andrei}
        about={ANDREI_ABOUT}
        side="end"
      />
      <AuxiliaryTiles />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('article')).toHaveLength(5);
    await expect(canvas.getAllByRole('blockquote')).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('img')).toHaveLength(5);

    const [first, second] = canvas.getAllByRole('blockquote');
    await expectArrangement(
      canvas.getByRole('article', { name: 'Dr. Elena Marin' }),
      blockBeside(first),
      first,
      'start',
    );
    await expectArrangement(
      canvas.getByRole('article', { name: 'Dr. Andrei Șerban' }),
      blockBeside(second),
      second,
      'end',
    );
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — a doctor card at
 * the phone width carrying the two words this card is most likely to break on:
 * `Kieferorthopädie` in the eyebrow and `Behandlungsschwerpunkte` inside the
 * justified quote, under a double-barrelled name that has nowhere to go.
 *
 * `lang="de"` rides the native prop spread onto the ARTICLE (the Card.stories
 * and Heading.stories precedent) and inherits to every child, which is the
 * whole mechanism and does two jobs at once: `hyphens: auto` (§15.14) picks the
 * German dictionary, so the compound in the quote breaks at a syllable instead
 * of pushing the border open — and `quotes` picks the GERMAN marks, so the
 * generated content around this quote reads „…“ while the Romanian stories
 * read „…”, with not one character of it in any string (D8).
 *
 * The name and the position are the exception that proves the rule: both wear
 * `hyphens-none` (D4, D5), so they may only wrap between words. If the name
 * ever clips at 320, the fix is the page's measure, never a syllable break
 * through a person's surname.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
    side: { control: false },
  },
  render: () => (
    <PersonnelCard
      kind="doctor"
      lang="de"
      name="Dr. Friederike Schwarzenbeck-Hoffmann"
      position="Fachzahnärztin für Kieferorthopädie"
      photo={PORTRAITS.elena}
      about={
        <>
          Meine <Keyword>Behandlungsschwerpunkte</Keyword> sind Kieferorthopädie
          und Zahnerhaltung. Vor jedem Eingriff erkläre ich die einzelnen
          Schritte, und die <Keyword>Nachsorgetermine</Keyword> vereinbaren wir
          gemeinsam.
        </>
      }
    />
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', {
      name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    });
    const quote = canvas.getByRole('blockquote');

    await expect(card).toHaveAttribute('lang', 'de');
    await expectArrangement(card, blockBeside(quote), quote, 'start');
    await expectNoSidewaysScroll(card);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this section reads none (its strings are props, §8.1). Flipping any
 * other story here to Pseudo changes nothing, which is that sweep passing; the
 * expansion stress still has to happen somewhere, and this is it.
 *
 * The strings are the Default pair put through the preview's own transform —
 * the same ACCENT map, the same `·`-padding at 40% of the source length — so
 * what is sampled is the width the real pipeline would produce, not a longer
 * string someone invented. Both lines are `hyphens-none` (D4, D5), so the
 * expansion has to be absorbed by WRAPPING inside a 256px column at the 320
 * stress width.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  argTypes: {
    kind: { control: false },
    name: { control: false },
    position: { control: false },
    photo: { control: false },
    side: { control: false },
  },
  render: () => (
    <div className="max-w-sm">
      <PersonnelCard
        kind="auxiliary"
        name="Íóáñá Țépéș ·····"
        position="Ášíšťéñťă médíçálă ········"
        photo={PORTRAITS.ioana}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Íóáñá Țépéș ·····' });

    await expect(canvas.getByText('Ášíšťéñťă médíçálă ········')).toBeVisible();
    await expectNoSidewaysScroll(card);
  },
};
