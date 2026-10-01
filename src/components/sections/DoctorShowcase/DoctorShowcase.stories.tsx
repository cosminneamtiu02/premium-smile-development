import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import type { PersonnelPhoto } from '@/components/sections/PersonnelCard/PersonnelCard';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import { LONG_QUOTE_DE } from '@/components/ui/Ribbon/Ribbon.fixtures';
import { DoctorShowcase, type DoctorShowcaseDoctor } from './DoctorShowcase';

// SIX stories: the everyday band at the laptop width, the phone, three
// doctors (the second card mirrored, the third the mirror of the mirror), six
// doctors (the size of the clinic's real roster), German with a
// ~1 200-character text on the first card, and the narrowest window. The export NAMES are load-bearing — each one names a baseline file
// (`sections/doctorshowcase/default-…`, `…/three-doctors-…`), so renaming or
// adding an export re-records pictures; this list IS the section's
// contribution to the visual manifest. The `Sections/*` title prefix routes
// every one of them to 390 + 1536 (tests/visual/stories.spec.ts, §13), and
// the 'stress-320' tag adds the accessibility width to `Narrowest`, the one
// story pinned there.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its
//     strings are props — the pages own the keys, D1): the preview decorator
//     stamps `<html lang>` from that global, and both `hyphens: auto` (§15.14)
//     and the quote's `quotes` marks (PersonnelCard D8) read the declared
//     language;
//   · the viewport pin, because a doctor card changes shape with the column
//     it is handed — two columns from a card of ~893px inside the ribbon, one
//     below it (PersonnelCard D17). The Vitest runner applies the pin;
//     Playwright ignores it and sets its own page size per project — which is
//     why every play DERIVES the branch it is in from the measured card, never
//     from the pinned width.
//
// ── THE RIBBON: LIVE IN THE WORKBENCH, WHOLE IN THE NET. In Storybook the
// ribbon draws as a visitor sees it — scroll a card's centre to the ribbon's
// line, a quarter of the screen above its bottom, and its stretch is drawn,
// and stays drawn (§15.26). The pixel net's
// projects ask for reduced motion (playwright.config.ts, THE STILLNESS
// LEVER), under which the ribbon is painted whole at once, so every
// photograph is the finished ribbon and none is caught mid-stroke. That is
// why no story here is 'no-visual'. Every story starts at the top of the page
// and leaves it there (the meta's `beforeEach`, ui/Ribbon's idiom): stories
// render one after another in one document, and a scroll left behind would
// decide which card is due in the next one.
//
// ── `layout: 'fullscreen'` for the reason every band story sets it: the band
// is full-bleed and owns its gutter through ui/Container, so Storybook's
// canvas padding would add a second inset on top of it. NO MOCK MESSAGES and
// NO `parameters.nextjs`: the band reads no message file, and its links are
// plain anchors (§15.13).
//
// Demo people are INVENTED, the pictures the committed synthetic cutouts
// (public/images/demo/cutout-1…2.png, 900 × 1200 — only two exist, so the
// doctors past the second borrow them in turn); the words are ui/Ribbon's stand-in
// doctors' (Ribbon.fixtures.tsx) with ui/Keyword fragments added: Romanian
// with diacritics (§15.7), factual, first-person — no superlatives, no
// promises (the CMSR rules for dental practices) — and German, DRAFTED, for
// the stress story. The real doctors, in five languages, are the owner's to
// author (§15.17).

const EYEBROW_RO = 'Familia Premium Smile';
const TITLE_RO = 'Specialiștii cu care ne mândrim';
const EYEBROW_DE = 'Die Premium-Smile-Familie';
const TITLE_DE = 'Spezialisten, auf die wir stolz sind';

const CUTOUT_1: PersonnelPhoto = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};
const CUTOUT_2: PersonnelPhoto = {
  src: '/images/demo/cutout-2.png',
  width: 900,
  height: 1200,
};

const PROFILE_RO = 'Mai multe despre mine';
const PROFILE_DE = 'Mehr über mich';

/** Three doctors, Romanian — the page's walk would hand over exactly this
 *  shape (app/[locale]/team/populate.ts): finished words, the cutout, the one
 *  link already locale-prefixed. */
const DOCTORS_RO: readonly DoctorShowcaseDoctor[] = [
  {
    id: 'elena-marin',
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    photo: CUTOUT_1,
    about: (
      <>
        Lucrez în <Keyword>ortodonție</Keyword> de peste zece ani și explic
        fiecare etapă a tratamentului. Consultația începe cu{' '}
        <Keyword>ascultarea</Keyword> pacientului, apoi construim împreună un
        plan potrivit.
      </>
    ),
    profile: { href: '/ro/team/elena-marin/', label: PROFILE_RO },
  },
  {
    id: 'andrei-serban',
    name: 'Dr. Andrei Șerban',
    position: 'Medic dentist, chirurgie orală',
    photo: CUTOUT_2,
    about: (
      <>
        Mă ocup de <Keyword>chirurgie orală</Keyword>: extracții și mici
        intervenții. Înainte de fiecare procedură explic pașii și răspund la
        întrebări, iar <Keyword>controlul</Keyword> de după se programează la o
        săptămână.
      </>
    ),
    profile: { href: '/ro/team/andrei-serban/', label: PROFILE_RO },
  },
  {
    id: 'cristina-turcanu',
    name: 'Dr. Cristina Țurcanu',
    position: 'Medic dentist, endodonție',
    photo: CUTOUT_1,
    about: (
      <>
        Tratez canalele dinților la <Keyword>microscop</Keyword> și îi arăt
        pacientului radiografiile înainte și după fiecare etapă. Programăm
        împreună vizitele, iar la fiecare <Keyword>control</Keyword> verificăm
        cum se vindecă dintele.
      </>
    ),
    profile: { href: '/ro/team/cristina-turcanu/', label: PROFILE_RO },
  },
];

/** The same three in German, the longest language (§8.4) — and on the first
 *  card a text of ~1 200 characters (ui/Ribbon's own fixture), so its words
 *  run far taller than its picture. */
const DOCTORS_DE: readonly DoctorShowcaseDoctor[] = [
  {
    id: 'elena-marin',
    name: 'Dr. Elena Marin',
    position: 'Fachzahnärztin für Kieferorthopädie',
    photo: CUTOUT_1,
    about: LONG_QUOTE_DE,
    profile: { href: '/de/team/elena-marin/', label: PROFILE_DE },
  },
  {
    id: 'andrei-serban',
    name: 'Dr. Andrei Șerban',
    position: 'Zahnarzt, Oralchirurgie',
    photo: CUTOUT_2,
    about: (
      <>
        Ich arbeite in der <Keyword>Oralchirurgie</Keyword>: Extraktionen und
        kleine Eingriffe. Vor jedem Eingriff erkläre ich die Schritte und
        beantworte Fragen, und die <Keyword>Nachkontrolle</Keyword> wird für
        eine Woche später vereinbart.
      </>
    ),
    profile: { href: '/de/team/andrei-serban/', label: PROFILE_DE },
  },
  {
    id: 'cristina-turcanu',
    name: 'Dr. Cristina Țurcanu',
    position: 'Zahnärztin, Endodontie',
    photo: CUTOUT_1,
    about: (
      <>
        Ich behandle Wurzelkanäle unter dem <Keyword>Mikroskop</Keyword> und
        zeige den Patientinnen und Patienten die Röntgenbilder vor und nach
        jedem Schritt. Die Termine planen wir gemeinsam, und bei jeder{' '}
        <Keyword>Kontrolle</Keyword> prüfen wir, wie der Zahn heilt.
      </>
    ),
    profile: { href: '/de/team/cristina-turcanu/', label: PROFILE_DE },
  },
];

/** SIX doctors — the three above and three more, the two cutouts alternating:
 *  the size of the clinic's real roster (a second lane brings six real
 *  doctors, 2026-09-30), so the mount is proven at that size before the real
 *  rows arrive. */
const SIX_DOCTORS_RO: readonly DoctorShowcaseDoctor[] = [
  ...DOCTORS_RO,
  {
    id: 'mihai-dragomir',
    name: 'Dr. Mihai Dragomir',
    position: 'Medic dentist, protetică',
    photo: CUTOUT_2,
    about: (
      <>
        Refac dinții lipsă cu <Keyword>coroane și punți</Keyword>. Discutăm mai
        întâi variantele și ce presupune fiecare, iar lucrarea se probează
        înainte de a fi <Keyword>fixată</Keyword>.
      </>
    ),
    profile: { href: '/ro/team/mihai-dragomir/', label: PROFILE_RO },
  },
  {
    id: 'ioana-preda',
    name: 'Dr. Ioana Preda',
    position: 'Medic dentist, pedodonție',
    photo: CUTOUT_1,
    about: (
      <>
        Lucrez cu <Keyword>copiii</Keyword> și cu părinții lor. Prima vizită
        este de cunoaștere: copilul vede cabinetul și instrumentele, iar
        tratamentul începe când este <Keyword>pregătit</Keyword>.
      </>
    ),
    profile: { href: '/ro/team/ioana-preda/', label: PROFILE_RO },
  },
  {
    id: 'radu-neagu',
    name: 'Dr. Radu Neagu',
    position: 'Medic dentist, parodontologie',
    photo: CUTOUT_2,
    about: (
      <>
        Tratez <Keyword>gingiile</Keyword> și țesuturile din jurul dinților.
        Fiecare plan începe cu o evaluare, iar la <Keyword>controalele</Keyword>{' '}
        periodice urmărim împreună evoluția.
      </>
    ),
    profile: { href: '/ro/team/radu-neagu/', label: PROFILE_RO },
  },
];

const top = (): void => window.scrollTo({ top: 0, behavior: 'instant' });

/** A length in CSS px per rem, read off the document — a visitor who has
 *  enlarged the browser's base font moves every rem on the page. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * Fonts and pictures first, then boxes: a picture that loads after a
 * measurement moves what was measured (the page twins' lesson of 2026-09-27,
 * #110 — a phone overflow masked locally by image-load timing).
 *
 * EVERY PICTURE IS ASKED FOR FIRST (2026-09-30 — `SixDoctors` timed out in a
 * rehearsal of CI): the cards' pictures ship `loading="lazy"`, and a lazy
 * picture far below the window is never STARTED by the browser, so its
 * load never finishes. Six cards are taller than that distance. It stays
 * invisible on a workstation, where an earlier story has left the same file
 * in the memory cache; on CI the optimized variants do not exist yet when the
 * tests run, so nothing is cached. Flipping `loading` to eager is HTML's own
 * resumption of a deferred load — no scroll, no timer — and it also makes the
 * pixel net photograph every card WITH its picture. The wait is bounded and
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

/** The nearest size container above an element — the box its `@3xl` reads
 *  (the doctor card's own inset, PersonnelCard D17). */
const containerOf = (element: Element): HTMLElement => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node;
  }
  throw new Error('DoctorShowcase story: no size container above the card');
};

/**
 * Is this card in its two-column branch? Asked of the container its grid
 * reads — its content box against 48rem — never of the window: Playwright
 * ignores the viewport pin, and the workbench canvas is whatever the sidebar
 * leaves.
 */
const sitsBeside = (element: Element): boolean => {
  const box = containerOf(element);
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(box);
  const content =
    box.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight) -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth);
  return content >= 48 * rem();
};

type Expected = Readonly<{
  eyebrow: string;
  title: string;
  doctors: readonly DoctorShowcaseDoctor[];
}>;

/**
 * What every story must hold, read off a SETTLED page:
 *   · a region named by its own <h2>, the eyebrow above it (D2);
 *   · ONE list — the ribbon's root — with an item and a station per doctor,
 *     each card an <article> whose name is an <h3> (D3, D6);
 *   · one canvas per card in the ribbon's aria-hidden layer, each SIZED —
 *     the ribbon's guard zeroes them all when its strip would touch a name, a
 *     text or a button — and nothing focusable in that layer;
 *   · the sides (D5): at the two-column branch the picture LEFT of the words
 *     on every even card and RIGHT of them on every odd one; below it, the
 *     picture ABOVE the words (the owner's adaptability rule, §14);
 *   · nothing scrolls sideways (§7).
 */
const expectBand = async (
  canvasElement: HTMLElement,
  expected: Expected,
): Promise<void> => {
  await settled(canvasElement);
  const canvas = within(canvasElement);

  const band = canvas.getByRole('region', { name: expected.title });
  await expect(
    within(band).getByRole('heading', { level: 2, name: expected.title }),
  ).toBeVisible();
  await expect(within(band).getByText(expected.eyebrow)).toBeVisible();

  const list = within(band).getByRole('list');
  await expect(within(list).getAllByRole('listitem')).toHaveLength(
    expected.doctors.length,
  );
  await expect(list.querySelectorAll('[data-ribbon-station]')).toHaveLength(
    expected.doctors.length,
  );
  const cards = within(list).getAllByRole('article');
  await expect(
    cards.map(
      (card) => within(card).getByRole('heading', { level: 3 }).textContent,
    ),
  ).toEqual(expected.doctors.map((doctor) => doctor.name));

  const layer = list.lastElementChild;
  if (!(layer instanceof HTMLElement)) {
    throw new Error('DoctorShowcase story: the ribbon lost its layer');
  }
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await waitFor(
    () =>
      expect(layer.querySelectorAll('canvas')).toHaveLength(
        expected.doctors.length,
      ),
    { timeout: 3_000 },
  );
  for (const tile of layer.querySelectorAll('canvas')) {
    await waitFor(() => expect(tile.width).toBeGreaterThan(0), {
      timeout: 3_000,
    });
  }
  await expect(
    layer.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
  ).toHaveLength(0);

  for (const [index, card] of cards.entries()) {
    const quote = within(card).getByRole('blockquote');
    const image = card.querySelector('img');
    if (image === null) {
      throw new Error(`DoctorShowcase story: card ${index + 1} has no picture`);
    }
    const picture = image.getBoundingClientRect();
    const words = quote.getBoundingClientRect();
    await expect(picture.height).toBeGreaterThan(0);
    await expect(words.height).toBeGreaterThan(0);
    if (!sitsBeside(quote)) {
      await expect(picture.bottom).toBeLessThanOrEqual(words.top);
    } else if (index % 2 === 0) {
      await expect(picture.right).toBeLessThanOrEqual(words.left);
    } else {
      await expect(words.right).toBeLessThanOrEqual(picture.left);
    }
    // THE PICTURE'S FLOOR (PersonnelCard D17): beside words that run TALLER
    // than it, the picture stands on the bottom of the row the words set, so
    // the waist stays right above the name. `GermanLongText` is the story
    // where this runs — ~504px of words beside a 384px picture at 1536.
    if (sitsBeside(quote) && words.height > picture.height) {
      await expect(Math.abs(picture.bottom - words.bottom)).toBeLessThanOrEqual(
        1,
      );
    }
  }

  const root = canvasElement.ownerDocument.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
};

const meta = {
  title: 'Sections/DoctorShowcase',
  component: DoctorShowcase,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    top();
    return top;
  },
  args: {
    eyebrow: EYEBROW_RO,
    title: TITLE_RO,
    doctors: DOCTORS_RO.slice(0, 2),
  },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono micro-label over the title, finished and already translated (§8.1) — authored in SENTENCE case, because the uppercase is ui/Eyebrow’s CSS',
    },
    title: {
      control: 'text',
      description:
        'The band’s real <h2> and, through aria-labelledby, the region’s accessible name (D2)',
    },
    doctors: {
      control: false,
      description:
        'Every doctor, finished — name, specialty, the cutout, the quoted words (ui/Keyword fragments inside) and the ONE link to the doctor’s page, already locale-prefixed — in the page’s order, printed as given. Each becomes a doctor card (sections/PersonnelCard) whose name is an <h3> (D6), the sides alternating start, end, … by index (D5), all in one list the floss ribbon wraps (D3). EMPTY renders nothing at all (D7)',
    },
    firstScreen: {
      control: false,
      description:
        'True when the band is on the FIRST SCREEN of its page — the Team page, which it opens: the FIRST card’s picture, the page’s LCP element, then loads at once, at high fetch priority and with a preload link (D9, PersonnelCard D18), and every other card stays lazy. Default false — Home, where the band sits under the Hero. The PAGE says it; the band never guesses. Not a live control: it moves no pixel',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> (§6.4/§6.8). The band owns its paint, its gutter and its top; the page owns the space BETWEEN bands',
    },
  },
} satisfies Meta<typeof DoctorShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY BAND — Romanian, at the laptop width: the eyebrow and the
 * title, then two doctors, each card in two columns — the picture over the
 * name beside the words over the link — the second mirrored, and the ribbon
 * falling from under the title into the first card's corner, round it and
 * down the side of its picture into the second.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};

/**
 * THE PHONE — every card one column, the specialty, the name, the picture,
 * the words and the link one above the other (PersonnelCard D17's phone
 * order), and the ribbon at its bolder phone gauge (§15.26, fb-501).
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};

/** Three doctors: the second card mirrored, the third the mirror of the
 *  mirror — the column is one ribbon, however long (D5). */
export const ThreeDoctors: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { doctors: DOCTORS_RO },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO,
    });
  },
};

/**
 * SIX DOCTORS — the size of the clinic's real roster: still ONE ribbon down
 * the whole column, the sides alternating start, end, start, end, start, end,
 * and a canvas per card. CLAUDE.md §15.26 had recorded the ribbon as NOT
 * tested beyond three doctors; this story is that test, in the workbench and
 * in the pixel net alike.
 */
export const SixDoctors: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { doctors: SIX_DOCTORS_RO },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: SIX_DOCTORS_RO,
    });
  },
};

/**
 * GERMAN, THE LONGEST LANGUAGE (§8.4), at the laptop width, and on the first
 * card a text of ~1 200 characters: the words' column runs far taller than
 * the picture's, the picture stands on its row's floor (PersonnelCard D17),
 * and the ribbon's long side wave still keeps every word clear. The eyebrow,
 * the title and the link's label are DRAFTS (§15.17).
 */
export const GermanLongText: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  args: { eyebrow: EYEBROW_DE, title: TITLE_DE, doctors: DOCTORS_DE },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_DE,
      title: TITLE_DE,
      doctors: DOCTORS_DE,
    });
  },
};

/**
 * THE NARROWEST WINDOW — 320px, the accessibility stress width (§7): a 256px
 * column, the ribbon at its thinnest, and nothing — no card, no tile of the
 * ribbon — scrolling the page sideways. Pinned there in the workbench and
 * photographed there too ('stress-320').
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};
