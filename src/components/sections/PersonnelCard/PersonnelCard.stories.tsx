import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import {
  PersonnelCard,
  type PersonnelLink,
  type PersonnelPhoto,
  type PersonnelSide,
} from './PersonnelCard';

// SIX stories, and the count is the honest one: the everyday tile, the grid it
// lives in, the two doctor arrangements and the two expansion stresses. (A
// seventh, `TeamComposition` — two doctors over the staff grid — left on
// 2026-09-30: no band stacks that shape since the doctors moved to
// sections/DoctorShowcase, whose own stories and the Pages/Team twin show the
// page as it ships.) The export NAMES are load-bearing —
// each one names a baseline file (`sections-personnelcard--default`,
// `sections-personnelcard--doctor-mirrored`, …), so renaming or adding an
// export re-records pictures; this list IS the section's contribution to the
// lane's visual manifest. The `Sections/*` title prefix routes every one of
// them to 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag
// adds the accessibility width to the four whose layout has something to say
// there (a 288px column around a 192px portrait — 273 under the classic
// scrollbar the baselines are recorded with, and 256 before ui/Container's
// PHONE GUTTER of 2026-10-09 — a justified quote and a full-width link in a
// 238px measure (223), a German compound, a 40%-expanded name).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this section reads no message file (its
//     strings are props, §8.1 — the pages own the keys): the preview
//     decorator stamps `<html lang>` from that global, and both `hyphens: auto`
//     (§15.14) and the `quotes` property (D8) pick their behaviour from the
//     declared language. Flip the toolbar to Pseudo over any story here and
//     nothing changes — that is the §8.9 sweep PASSING, and the reason the
//     pseudo stress below is typed out as a fixture instead of produced by the
//     toolbar (the SectionHeading precedent);
//   · the viewport pin, because this card CHANGES SHAPE with the box it is
//     handed: the doctor card becomes the 40 / 60 grid at `@3xl` = 768px of
//     its INSET's width — outside a ribbon, the card's content width (D7,
//     D17) — and is one column below it. A manager canvas narrowed by the
//     sidebar sits in the middle of that band, so an unpinned story would
//     photograph an accident. Playwright ignores the pin — it sets its own
//     page size per project — which is exactly why every geometry assertion
//     below DERIVES its expectation from the measured card instead of assuming
//     the pinned width.
//
// ── THE DECORATOR IS THE PAGE-BAND RECIPE (the standing law in
// Container.tsx's header): a semantic full-bleed <section> that PAINTS, and a
// <Container> that measures the column and carries the band's own `py-10`. Not
// decoration — ui/Card applies inline-size containment (Card D10), so a card
// must always sit in a width-giving parent, and photographing one on a bare
// canvas would show a box sized by a rule this card does not use.
// `layout: 'fullscreen'` is load-bearing for the same reason as in
// Card.stories: Storybook's default canvas padding would falsify the band.
// No story here stands in a ui/Ribbon: the card is photographed as a card,
// where its inset adds nothing (the Doctor play proves it) — the ribbon's
// frames belong to the band that mounts it.
//
// ── NO PROPS-DRIVEN LOCALE, NO MOCK MESSAGES, NO `parameters.nextjs`: this
// card reads no message file, links nowhere by itself and hydrates nothing of
// its own (D11) — the only island in the frame is the one ui/Image brings
// with the picture, which is also why the demo pictures are committed
// fixtures rather than a design-time placeholder.
//
// Demo people are INVENTED and the pictures are synthetic: the auxiliaries'
// silhouettes (public/images/demo/portrait-1…3.jpg, 600×800, D12) and the
// doctors' transparent waist-up cutouts (public/images/demo/cutout-1…2.png,
// 900×1200, D17) — no real patient or employee, nothing to license, obviously
// placeholders. Copy is Romanian with diacritics (§15.7), first-person and
// factual — no superlatives, no promises, no result guarantees (CMSR
// advertising rules for dental practices, in force since 2025-07-01). The real
// people, in five languages, are the owner's to author (§15.17).
//
// ── THE FOUR DOCTOR FRAMES CHANGED on 2026-09-21 (the doctor-pages run, D15):
// two links and a 2×2 grid. They CHANGED AGAIN on 2026-09-30 (D17, the owner's
// direct dispatch on a stand-in iterated live that day): ONE link, „Mai multe
// despre mine", to the doctor's own page on the solid face; the transparent
// CUTOUT in an 18rem cell instead of the framed portrait; the 40 / 60 grid —
// row 1 the picture on its row's floor ‖ the words, row 2 the name and
// specialty ‖ the link, level with each other; and on a phone the order
// specialty → name → picture → words → link. The plays assert the numbers the
// planner measured on that stand-in: the picture 18rem × 24rem, the pair 12px
// under it, the pair's and the link's centres on one line, the pair as wide as
// its words, the link min(28rem, the words' width) wide, centred under them
// and 56px tall, the two sides mirrored — and the phone's painted order. The
// hrefs are FIXTURES in the shape the band will build (a doctor page under
// /team/), and, like every string here, they arrive finished (§8.1). Later the
// same day they took THE FRAME (D17, the owner: "i want to use for this card
// the border of the non current review from the review carrousel"): ui/Card's
// `framed` tone, a 3px lavender border where the 1px hairline was, every box
// inside exactly where it stood — the two expectNoInset plays measure both
// halves. The auxiliary frames did not change then.
//
// ── THE THREE AUXILIARY FRAMES CHANGED on 2026-10-02 (D4, CLAUDE.md
// §15.32): every auxiliary story here renders the DEFAULT level, 3, and a
// level-3 name moved from ui/Heading's `title` step (20px) to `band` — 30px
// on a card narrower than its 28rem `@md`, as every auxiliary card in these
// frames is, 36px from it — the one step a person's name wears at either
// level, for both kinds (the owner wants the staff tiles' names at 30px, the
// size they wore as the Team page's <h2>s). `Default`, `AuxiliaryGrid` and
// `PseudoLocale` re-record — 390 and 1536, and 320 for the two `stress-320`
// ones: eight cells — and the Default play reads the size back; the three
// doctor stories do not move.

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

/** The three committed demo portraits the auxiliary tiles wear, all at the ONE
 *  team ratio (3:4, D3). */
const PORTRAITS = {
  mihaela: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  anaMaria: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} satisfies Record<string, PersonnelPhoto>;

/** The two committed demo CUTOUTS the doctor cards wear (D17): the doctor from
 *  the waist up, no background, the same 3:4 ratio. */
const CUTOUTS = {
  elena: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
  andrei: { src: '/images/demo/cutout-2.png', width: 900, height: 1200 },
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

/** Each doctor's ONE link (D17), and the German one the expansion stress
 *  carries: a finished href — the band's localeHref() output, the doctor's own
 *  page — and a finished label in the doctor's own voice, which also leads the
 *  link's accessible name (D15). */
const PROFILES = {
  elena: { href: '/ro/team/elena-marin/', label: 'Mai multe despre mine' },
  andrei: { href: '/ro/team/andrei-serban/', label: 'Mai multe despre mine' },
  german: { href: '/de/team/elena-marin/', label: 'Mehr über mich' },
} satisfies Record<string, PersonnelLink>;

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
    photo: PORTRAITS.mihaela,
  },
  {
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.anaMaria,
  },
];

/** A staff grid for this card's own workbench — the shape sections/TeamRoster
 *  wrote around these cards until 2026-10-02 (it lays FIXED tiles in a
 *  wrapping row since, its D9; this grid is kept as the card's stress shape,
 *  not as a copy of the band). `@md`/`@3xl` measure the
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

/** `n` rem in px, at whatever the root font-size is — never a baked-in 16
 *  (G2 typescript), so every number below survives a visitor's setting. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * WHERE THE DOCTOR GRID FLIPS, derived rather than assumed. `@3xl` is 48rem of
 * the INSET's width (D7, D17) and a container query asks the CONTENT box — so
 * the inset's own padding (0 outside a ribbon, the lanes' surplus inside one)
 * comes off before the comparison, from the FRACTIONAL border-box width
 * (`clientWidth` is an integer and would disagree with the engine inside a
 * sub-pixel window around the step — G2 react). Deriving it here is what lets
 * these plays hold at ANY width: the visual runner ignores the viewport pin
 * and renders every `Sections/*` story at 390 and 1536, and the workbench
 * canvas is whatever the sidebar leaves.
 */
const sitsBeside = (inset: HTMLElement): boolean => {
  const { paddingLeft, paddingRight } = getComputedStyle(inset);
  const contentWidth =
    inset.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight);
  return contentWidth >= rem(48);
};

/** A doctor card's boxes, reached from the <article>: the INSET is its one
 *  child, the GRID the inset's, and the grid holds the block, the quote and
 *  the link; the block holds the cutout's cell and the name/specialty pair
 *  (D6, D7, D17). None of the boxes carries a role — they are layout — so
 *  structure is the only honest way in. */
const partsOf = (card: HTMLElement) => {
  const inset = card.firstElementChild as HTMLElement;
  const grid = inset.firstElementChild as HTMLElement;
  const block = grid.children[0] as HTMLElement;
  const pair = block.children[1] as HTMLElement;
  return {
    inset,
    grid,
    block,
    picture: block.children[0] as HTMLElement,
    pair,
    heading: pair.children[0] as HTMLElement,
    eyebrow: pair.children[1] as HTMLElement,
    quote: grid.children[1] as HTMLElement,
    link: grid.children[2] as HTMLElement,
  };
};

/** The width of the WORDS inside an element — the union of its text nodes'
 *  own rects, never an element's box — which is what the pair must hug. */
const wordsWidth = (element: HTMLElement): number => {
  const range = document.createRange();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let left = Infinity;
  let right = -Infinity;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
    }
  }
  return right - left;
};

const centreY = (box: DOMRect): number => box.top + box.height / 2;

/** The four sides, as CSS spells them in a longhand's name. */
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/**
 * THE FRAME, AND THE INSET THAT ADDS NOTHING OUTSIDE A RIBBON (D17). The
 * doctor card wears ui/Card's `framed` tone — the reviews deck's idle card, a
 * 3px border on every side — and the frame moves nothing: its two extra px of
 * border come out of the padding (ui/Card's SUM RULE), so border plus padding
 * is still 1.5rem + 1px per side, 25px at the default font size, exactly the
 * flat `surface` card's 1px + 1.5rem. The INSET adds nothing on top: the
 * lanes' registered initial value is 24px, less 1.5rem. So the words start
 * where they always did — measured as the content's own box against the
 * card's, on all four sides (the card is as tall as its content here).
 */
const expectNoInset = async (card: HTMLElement): Promise<void> => {
  const { inset } = partsOf(card);
  const insetStyle = getComputedStyle(inset);
  for (const padding of [
    insetStyle.paddingTop,
    insetStyle.paddingRight,
    insetStyle.paddingBottom,
    insetStyle.paddingLeft,
  ]) {
    await expect(padding).toBe('0px');
  }
  const cardStyle = getComputedStyle(card);
  for (const side of SIDES) {
    const border = cardStyle.getPropertyValue(`border-${side}-width`);
    await expect(border).toBe('3px');
    await expect(
      parseFloat(border) +
        parseFloat(cardStyle.getPropertyValue(`padding-${side}`)),
    ).toBeCloseTo(rem(1.5) + 1, 1);
  }
  const cardBox = card.getBoundingClientRect();
  const contentBox = inset.getBoundingClientRect();
  const edge = rem(1.5) + 1;
  await expect(contentBox.top - cardBox.top).toBeCloseTo(edge, 1);
  await expect(cardBox.right - contentBox.right).toBeCloseTo(edge, 1);
  await expect(cardBox.bottom - contentBox.bottom).toBeCloseTo(edge, 1);
  await expect(contentBox.left - cardBox.left).toBeCloseTo(edge, 1);
};

/** The arrangement contract in one place: the DOM order never moves, and the
 *  boxes sit where the measured width says they should (D7, D17). */
const expectArrangement = async (
  card: HTMLElement,
  side: PersonnelSide,
): Promise<void> => {
  const { inset, grid, block, picture, pair, heading, eyebrow, quote, link } =
    partsOf(card);

  // Reading order is "who, then what they say, then what you can do" whichever
  // way the card faces — `side` is a visual-only mirror, so a screen reader
  // and the stacked phone layout see the same sequence in both stories.
  await expect(
    block.compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await expect(
    quote.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  // The step itself, read off the grid box: a flex `column` below `@3xl`, the
  // grid above it. Asserting this as well as the geometry is what keeps the
  // frame honest at every width — whichever branch the runner lands in, one
  // of the two is being proved rather than skipped.
  const beside = sitsBeside(inset);
  const gridStyle = getComputedStyle(grid);
  await expect(gridStyle.display).toBe(beside ? 'grid' : 'flex');

  const pictureBox = picture.getBoundingClientRect();
  const pairBox = pair.getBoundingClientRect();
  const quoteBox = quote.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  // A collapsed box (zero height) would satisfy an ordering comparison by
  // accident — every one must occupy real space first (G2 react).
  for (const box of [pictureBox, pairBox, quoteBox, linkBox]) {
    await expect(box.height).toBeGreaterThan(0);
  }

  // THE LINK, in both layouts: as wide as the words up to 28rem and centred
  // under them — the words span their column, so on a phone the link spans
  // the content width (D17: "be wider", then "too wide", then 28rem).
  await expect(
    Math.abs(linkBox.width - Math.min(rem(28), quoteBox.width)),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(linkBox.left - quoteBox.left - (quoteBox.right - linkBox.right)),
  ).toBeLessThanOrEqual(1);

  if (!beside) {
    // Below the step: one column, PAINTED specialty → name → picture → words
    // → link — the owner's phone order (D17). The DOM keeps the name before
    // the specialty and both before the picture; the reversal is paint.
    await expect(gridStyle.flexDirection).toBe('column');
    await expect(getComputedStyle(block).display).toBe('flex');
    const painted = [eyebrow, heading, picture, quote, link].map((element) =>
      element.getBoundingClientRect(),
    );
    for (const [index, box] of painted.entries()) {
      if (index === 0) continue;
      await expect(box.top).toBeGreaterThanOrEqual(
        painted[index - 1].bottom - 0.5,
      );
    }
    return;
  }

  // At the step the block DISSOLVES (`display: contents`, D15) so its two
  // boxes are grid items of their own — which is why nothing here measures
  // the block itself: an element with no box has no rectangle to measure.
  await expect(getComputedStyle(block).display).toBe('contents');
  // The two gaps are the grid's longhands, not the column's 24px shorthand:
  // 32px across, 12px down. Compared rather than read in pixels, so the
  // assertion survives a visitor's root font-size.
  const rowGap = parseFloat(gridStyle.rowGap);
  await expect(parseFloat(gridStyle.columnGap)).toBeGreaterThan(rowGap);

  // THE CUTOUT: 18rem wide — its column is never narrower at the step
  // (2 / 5 of 48rem less the gap) — and 3:4 (D17).
  await expect(Math.abs(pictureBox.width - rem(18))).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(pictureBox.height - (pictureBox.width * 4) / 3),
  ).toBeLessThanOrEqual(1);
  // …on its row's FLOOR, with the words on its centre line: while the words
  // are shorter the two share a centre, once they run taller the picture
  // sinks to the bottom of the row they set (PHOTO_CELL / TEXT_CELL).
  if (quoteBox.height <= pictureBox.height) {
    await expect(
      Math.abs(centreY(quoteBox) - centreY(pictureBox)),
    ).toBeLessThanOrEqual(1);
  } else {
    await expect(
      Math.abs(quoteBox.bottom - pictureBox.bottom),
    ).toBeLessThanOrEqual(1);
  }

  // THE PAIR exactly one row gap under the picture — the waist right above the
  // name — and on ONE LEVEL with the link: "dr name and specialization also
  // sticky to bot of card next to the button" (D17), both `self-center`.
  await expect(
    Math.abs(pairBox.top - pictureBox.bottom - rowGap),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(centreY(pairBox) - centreY(linkBox)),
  ).toBeLessThanOrEqual(1);
  // INSIDE the pair the name stands OVER the specialty at the step: the
  // phone's painted order (specialty first) must not leak past it.
  await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    eyebrow.getBoundingClientRect().top,
  );
  // THE HUG: the pair's box is as wide as its words — a keep-out is what is
  // painted, and a stretched pair marked empty space for the ribbon (D17).
  await expect(Math.abs(pairBox.width - wordsWidth(pair))).toBeLessThanOrEqual(
    1,
  );
  // The link is `lg`: 3.5rem, one line of label at this width (§9's 44px+).
  await expect(Math.abs(linkBox.height - rem(3.5))).toBeLessThanOrEqual(1);

  // THE MIRROR: the picture and the name on the start side, the words and the
  // link on the other — and the other way round for `end` (D7).
  if (side === 'start') {
    await expect(pictureBox.right).toBeLessThanOrEqual(quoteBox.left);
    await expect(pairBox.right).toBeLessThanOrEqual(linkBox.left);
  } else {
    await expect(quoteBox.right).toBeLessThanOrEqual(pictureBox.left);
    await expect(linkBox.right).toBeLessThanOrEqual(pairBox.left);
  }
  // Row 2 sits under row 1: the words over the link, the picture over the name.
  await expect(linkBox.top).toBeGreaterThanOrEqual(quoteBox.bottom);
  await expect(pairBox.top).toBeGreaterThanOrEqual(pictureBox.bottom);
};

/** THE ACCESSIBLE NAME of a doctor's link: the label, then the person (D15's
 *  EACH LINK NAMES ITSELF bullet — a page of doctors repeats the same label,
 *  and a rotor reads names out of context). The VISIBLE text is still the
 *  label alone, which is the leading substring SC 2.5.3 asks for. */
const linkName = (label: string, doctor: string): string =>
  `${label} ${doctor}`;

/** A doctor card's ONE link, by role and by name — the composed name is what
 *  a screen reader announces, which is the assertion §9 wants made (D15), and
 *  the label alone is what a visitor reads (D17). */
const expectTheLink = async (
  card: HTMLElement,
  profile: PersonnelLink,
  doctor: string,
): Promise<HTMLElement> => {
  const links = [...card.querySelectorAll('a')];
  await expect(links).toHaveLength(1);
  const [anchor] = links;
  await expect(anchor).toHaveAccessibleName(linkName(profile.label, doctor));
  await expect(anchor).toBeVisible();
  await expect(anchor).toHaveAttribute('href', profile.href);
  await expect(anchor).toHaveTextContent(profile.label);
  // A label that WRAPS stays centred — ui/Button's `text-center`, measured
  // here because the unit tier has no stylesheet (D17's first consumer).
  await expect(getComputedStyle(anchor).textAlign).toBe('center');
  return anchor;
};

/** The `side` control's options, derived from a keyed object rather than typed
 *  as an array (the Card.stories `TONE_OPTIONS` reasoning): `satisfies { [K in
 *  PersonnelSide]: K }` refuses to compile while a member is MISSING, which a
 *  `satisfies PersonnelSide[]` array cannot see — it only catches a wrong one
 *  (G2 typescript). `kind` has no such list: it is not a live control (see
 *  its argType). */
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
      control: false,
      description:
        'Which card this is (D2) — REQUIRED, with no default: the band always knows, and a default discriminant would weaken the union at every call site. `auxiliary` is the portrait column alone; `doctor` is the cutout, the quote and the one link. NOT a live control: a doctor card needs its `about` and its `profile`, which a radio cannot supply — the TYPES refuse that half-built card at a real call site, and the component reads `profile.href` without a guard because they do',
    },
    name: {
      control: 'text',
      description:
        'The full name, finished and already translated (§8.1) — becomes the card’s real heading — an <h3> by default, an <h2> under `headingLevel={2}` (cards straight under a page’s h1), on ui/Heading’s `band` step either way — and, through aria-labelledby, the article’s accessible name (D4). Never hyphenates: a person’s name wraps between words or not at all (§15.14’s rider)',
    },
    position: {
      control: 'text',
      description:
        'The position or specialisation, finished text — the mono eyebrow under the name (D5). Authored in SENTENCE case: the uppercase is ui/Eyebrow’s CSS, so Ș/Ț case mapping stays the browser’s job',
    },
    photo: {
      control: false,
      description:
        'The picture: a path under public/images/ plus its INTRINSIC pixel size, which is the optimizer’s srcset input and the reserved box (§11, zero layout shift). An auxiliary’s is the framed portrait; a doctor’s is the transparent waist-up CUTOUT, drawn whole in an 18rem cell (D17). One 3:4 ratio for the whole team, and `alt=""` by construction — the name beside it IS the identity (D3). Not a live control: a text knob over a file path would only ever produce a broken image',
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
        'Which side the picture and the name sit on at the wide step. Default `start`. It mirrors the COLUMNS ONLY: the DOM order stays block → quote → link for both values, so reading order never moves (D7)',
    },
    headingLevel: {
      control: 'inline-radio',
      options: [2, 3],
      description:
        'The heading level of the name (D4): 3 by default — the level under a band’s own h2 — or 2 when the cards sit directly under a page’s h1. ONLY the ELEMENT follows it: since 2026-10-02 a person’s name wears ui/Heading’s `band` step at both levels, for both kinds (§15.32 — 30px on a card narrower than 28rem, 36px from it; an auxiliary’s level 3 was `title` until then), so flipping it changes the outline and no pixel; the id and the aria-labelledby pair never change',
    },
    profile: {
      control: false,
      description:
        'The doctor’s ONE link, to his own page — REQUIRED on that kind, refused on the auxiliary one (D17). A finished href and a finished label (§8.1) in the doctor’s own voice; it wears the solid `lg` face, as wide as the words up to 28rem, and names itself WITH the person („Mai multe despre mine Dr. Elena Marin", D15). Not a live control: a text knob over an href and a label would only ever produce a broken link',
    },
    preload: {
      control: false,
      description:
        'THE EAGER PATH (D18) — default false: the picture loads lazily, like every picture below the fold (§11). `true` hands ui/Image the pair DoctorIntro gives its own cutout — `preload` and `fetchPriority="high"`: no lazy loading, a high fetch priority and a preload link — for a doctor card whose picture is its page’s LCP element (§10.6). A BAND decides it, never the card: sections/DoctorShowcase asks it of its first card on the Team page. Refused on the auxiliary kind. Not a live control: it moves no pixel, and on this meta’s auxiliary card it would build the shape the TYPES refuse',
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
 * The name, the position and the heading level are live controls here; `kind`
 * is not, on any story — a doctor card cannot be built from a radio alone (D2:
 * its `about` and its `profile` are REQUIRED by the types).
 *
 * **390 · 320 (`stress-320`):** the 192px portrait inside `p-6`, with the name
 * and the position centred under it and 238px of content still fitting at the
 * accessibility width (223 under the classic scrollbar the baselines are
 * recorded with). The play reads back the four facts a picture cannot:
 * the article is NAMED by its heading; the name wears ui/Heading's `band`
 * step at this default level 3 — 30px, the card being narrower than the 28rem
 * `@md` the step reads against its own container (D4: the step of every
 * person's name since 2026-10-02, `title`'s 20px until then); the portrait is
 * decorative (no `img` role at all — `alt=""` is the decision, D3); and there
 * is no blockquote anywhere on an auxiliary card.
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
    const heading = canvas.getByRole('heading', {
      level: 3,
      name: AUXILIARIES[0].name,
    });
    await expect(heading).toBeInTheDocument();
    await expect(canvas.getByText(AUXILIARIES[0].position)).toBeInTheDocument();

    // THE NAME'S SIZE (D4, 2026-10-02): the `band` step's 1.875rem — a card
    // inside `max-w-sm` is under its 28rem `@md` at every width, so 30px at
    // the default root; `title` would read 1.25rem. Read in rem, so it holds
    // at any root font size; a computed font size needs no loaded face.
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(
      rem(1.875),
      1,
    );

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
 * THE DOCTOR CARD, picture on the start side — the arrangement the owner
 * approved on the stand-in (D17): the cutout beside the words, the name and
 * the specialty under the cutout, level with the one link under the words.
 *
 * This is the frame where the quote's dress is actually measurable, and the
 * play measures all of it because none of it survives in a unit test (no
 * stylesheet there): `text-justify` (OWNER DECISION, "extremely important" — a
 * per-element override of §15.1's start-aligned prose lock, D8), the faint ink
 * that is the owner's "washed / ghost" (D58), the keyword fragments in a DARKER
 * LILAC and a LITTLE BOLD, upright (D9 as amended by D56 — the owner's "italic
 * looks stupid … use a darker lilla and just a little bold and drop italic.
 * before it was too bold"; on 2026-09-26 D9's ink-only first shape became D52's
 * bold, then D55's italic, then this), and the opening mark as CSS generated
 * content rather than a character in a string.
 *
 * It is also the frame where the ONE LINK is measured: its name with the
 * person (D15), its solid face, its centred label — and, through
 * expectArrangement, the stand-in's numbers (the header). And it measures THE
 * FRAME (D17) — the reviews deck's 3px border on every side — and proves that
 * neither it nor the INSET moves the words: they start 1.5rem + 1px inside the
 * card's edge, 25px, exactly where they did on the flat 1px card.
 *
 * The arrangement assertion is DERIVED from the inset's measured content
 * width, not from the pinned viewport: at 1536 the card is the grid and at
 * 390 and 320 it is the stacked one column, and one assertion covers all
 * three.
 */
export const Doctor: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  argTypes: {
    name: { control: false },
    position: { control: false },
    photo: { control: false },
  },
  render: ({ side }) => (
    <PersonnelCard
      kind="doctor"
      name="Dr. Elena Marin"
      position="Medic specialist ortodonție"
      photo={CUTOUTS.elena}
      about={ELENA_ABOUT}
      profile={PROFILES.elena}
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
    // --ink-faint (#766f69), the 19th role D58 gave the owner's "washed or
    // ghost" ("what if you make the faint text lighter"): 4.94:1 on the
    // surface, still AA for body text, and lighter than --ink-muted.
    await expect(quoteStyle.color).toBe('rgb(118, 111, 105)');
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
    // --accent (#746894), the lavender of this card's own „Mai multe despre
    // mine" link at rest, at 650, upright, no underline — the owner,
    // 2026-10-02: "i want that highlighted text to actually be the color of
    // the current mai multe despre mine button" (the link's face is measured
    // below and the two are pinned EQUAL there). The weight is D59's ("add
    // just a little more bold and underline them maybe": 650, between D56's
    // 600 and the 700 that was too bold), its thin underline dropped after one
    // look by D60 ("remove the underline"). From D56 to that day the ink was
    // --accent-strong, a deep violet (#4b3a86 since D57's "make it just jump
    // at you more"), 1.89:1 darker than the faint quote; the lavender has the
    // quote's own lightness (1.02:1), so hue and weight carry the cue.
    await expect(keywordStyle.color).toBe('rgb(116, 104, 148)');
    await expect(keywordStyle.fontWeight).toBe('650');
    await expect(keywordStyle.fontStyle).toBe('normal');
    await expect(keywordStyle.textDecorationLine).toBe('none');

    const link = await expectTheLink(card, PROFILES.elena, 'Dr. Elena Marin');
    // The face, measured rather than read off a class list: the old services
    // button's SOLID face (D17), filled with --cta (#008854) until 2026-10-01
    // and with the menu buttons' lavender --accent (#746894) since — ui/Button's
    // `accent` family, the owner: "all 'mai multe despre mine' buttons from the
    // doctor cards" lilac — no border of its own.
    await expect(getComputedStyle(link).backgroundColor).toBe(
      'rgb(116, 104, 148)',
    );
    // …and that face is the key words' ink above, by the owner's sentence
    // ("the color of the current mai multe despre mine button"). Both read
    // --accent today; pinned as a RELATION as well, so a later recolour of
    // either one cannot quietly part them (§4's KEEP-IN-SYNC row).
    await expect(keywordStyle.color).toBe(
      getComputedStyle(link).backgroundColor,
    );
    // ≥44px for a primary action (§9); `lg` is 56px of min-height.
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44,
    );

    await expectNoInset(card);
    await expectArrangement(card, 'start');
    await expectNoSidewaysScroll(card);
  },
};

/**
 * THE SAME CARD, MIRRORED — `side="end"`, the alternation the owner asked for
 * down a page of doctors ("alternate in which it will be turned around, photo,
 * name, etc on right side and text on left").
 *
 * The whole point of the frame is that only the PICTURE changes: the play
 * asserts the words now sit left of the cutout — and the link left of the
 * name — while the DOM order is still block → quote → link, which is what the
 * mirrored COLUMN placement buys and why the mirror costs a screen reader
 * nothing (D7). Below the step this story is identical in arrangement to
 * `Doctor` — specialty, name, cutout, words, link — and the derived assertion
 * says so at whatever width it is rendered.
 */
export const DoctorMirrored: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  argTypes: {
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
      photo={CUTOUTS.andrei}
      about={ANDREI_ABOUT}
      profile={PROFILES.andrei}
      side="end"
    />
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', { name: 'Dr. Andrei Șerban' });

    await expectTheLink(card, PROFILES.andrei, 'Dr. Andrei Șerban');
    await expectNoInset(card);
    await expectArrangement(card, 'end');
    await expectNoSidewaysScroll(card);
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
 *
 * The LABEL is German too — „Mehr über mich" — and the link it sits in spans
 * the phone's column: ui/Button's `hyphens-none` (§15.14's rider) means a
 * label may wrap between words but never split one, and its `text-center`
 * keeps a wrapped label centred at 320 (D17).
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  argTypes: {
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
      photo={CUTOUTS.elena}
      about={
        <>
          Meine <Keyword>Behandlungsschwerpunkte</Keyword> sind Kieferorthopädie
          und Zahnerhaltung. Vor jedem Eingriff erkläre ich die einzelnen
          Schritte, und die <Keyword>Nachsorgetermine</Keyword> vereinbaren wir
          gemeinsam.
        </>
      }
      profile={PROFILES.german}
    />
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article', {
      name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    });

    await expect(card).toHaveAttribute('lang', 'de');
    const link = await expectTheLink(
      card,
      PROFILES.german,
      'Dr. Friederike Schwarzenbeck-Hoffmann',
    );
    // The label may not be split at a syllable (§15.14's rider): whatever the
    // column does with it, the words stay whole.
    await expect(getComputedStyle(link).hyphens).toBe('none');

    await expectArrangement(card, 'start');
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
 * expansion has to be absorbed by WRAPPING inside a 288px column at the 320
 * stress width (273 under the classic scrollbar the baselines are recorded
 * with; 256 before ui/Container's PHONE GUTTER of 2026-10-09).
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  argTypes: {
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
