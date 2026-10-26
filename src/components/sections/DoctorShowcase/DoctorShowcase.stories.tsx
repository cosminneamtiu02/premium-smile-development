import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import {
  linesOf,
  namedAs,
} from '@/components/sections/PageHero/PageHero.fixtures';
import type {
  PersonnelHeadingLevel,
  PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import { LONG_QUOTE_DE } from '@/components/ui/Ribbon/Ribbon.fixtures';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import {
  DoctorShowcase,
  type DoctorShowcaseDoctor,
  type DoctorShowcaseHero,
} from './DoctorShowcase';

// ELEVEN stories: the everyday band at the laptop width, the phone, three
// doctors (the second card mirrored, the third the mirror of the mirror), six
// doctors (the size of the clinic's real roster), German with a
// ~1 200-character text on the first card, the narrowest window — and, since
// THE SCALE (DoctorShowcase D10, 2026-10-01), the band at the notebook and
// the desktop widths and in a container narrower than its page — and, since
// D12 (2026-10-15), the band under its PAGE opener, the Team page's, in
// Romanian and in German (`PageOpener`, `PageOpenerGerman`). The export
// NAMES are load-bearing — each one names a baseline file
// (`sections/doctorshowcase/default-…`, `…/three-doctors-…`), so renaming or
// adding an export re-records pictures; this list IS the section's
// contribution to the visual manifest. The `Sections/*` title prefix routes
// every one of them to 390 + 1536 (tests/visual/stories.spec.ts, §13), and
// the 'stress-320' tag adds the accessibility width to `Narrowest`, the one
// story pinned there. `Notebook` and `Desktop` are 'no-visual': the net sets
// its own window and ignores their pins, so at 390 and 1536 they would only
// repeat `Default`'s pixels — they exist for the workbench, where the owner
// flips between the widths, and for their plays, which run at the pinned
// width in the Vitest storybook project.
//
// ── THE SCALE, IN EVERY PLAY (D10). Wherever D10's three GATES hold — a
// mouse or trackpad (`pointer: fine`), an engine that registers custom
// properties, a column of max(56rem, 896px) — the band is drawn in its design
// pixel, s = min(column, 96rem) / 1106, every length the reference's × s: the
// quote 18 × s, a doctor's name and the title 36 × s, the eyebrows 14 × s,
// the picture 288 × s wide, the link 448 × s by 56 × s — and past THE CAP,
// 96rem (a 1920 window's column at the default root), the cap's band,
// centred. Wherever one gate fails — every phone, every touch tablet held
// either way, a column under the step, an engine that cannot register —
// nothing is declared and the band is today's, unchanged. Every play reads
// its column, its pointer and its engine and asserts whichever of the two it
// is in (`expectScale`), never the pinned width — the same reason as the
// branch reading below. In the Vitest storybook project the pointer is
// Chromium's fine one, so from the step up every play there asserts the
// scale.
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
//     below it (PersonnelCard D17), and under a ~567px window the phone's
//     header, a round photo beside the name (its D20). The Vitest runner
//     applies the pin;
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
//
// ── THE PAGE OPENER'S COPY IS THE PAGE'S OWN (D12): the hero's two strings
// are read out of src/messages/{ro,de}.json — `team.hero`, the Team page's
// keys — so these frames show the copy the page ships, its line breaks and
// no-break spaces included (the PostList stories' precedent). The band reads
// no message file itself (D1): the story hands it the finished strings, as
// the page does.

const EYEBROW_RO = 'Echipa Premium Smile';
const TITLE_RO = 'Specialiștii cu care ne mândrim';
const EYEBROW_DE = 'Das Premium-Smile-Team';
const TITLE_DE = 'Spezialisten, auf die wir stolz sind';

/** The Team page's hero, Romanian and German (D12) — the page's own keys. */
const HERO_RO: DoctorShowcaseHero = ro.team.hero;
const HERO_DE: DoctorShowcaseHero = de.team.hero;

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

/** The content box of the container an element's card reads — the doctor
 *  card's own INSET (PersonnelCard D17) — from its fractional width. */
const containerContent = (element: Element): number => {
  const box = containerOf(element);
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(box);
  return (
    box.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight) -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth)
  );
};

/**
 * Is this card in its two-column branch? Asked of the container its grid
 * reads — its content box against 48rem — never of the window: Playwright
 * ignores the viewport pin, and the workbench canvas is whatever the sidebar
 * leaves.
 */
const sitsBeside = (element: Element): boolean =>
  containerContent(element) >= 48 * rem();

/** Is this card in its PHONE header (PersonnelCard D20)? Its INSET's content
 *  box from the 12.5rem floor to 24rem — every upright phone at 100 % zoom —
 *  asked the same way; under the floor the card stacks. */
const inHeader = (element: Element): boolean => {
  const content = containerContent(element);
  return content >= 12.5 * rem() && content < 24 * rem();
};

/** D10's numbers, written out — the band's REFERENCE column, where its
 *  design pixel is a CSS pixel; its CAP, in rem of the root (1536px at the
 *  default 16px, a 1920 window's column); and THE STEP's two halves, `@4xl`'s
 *  56rem and the floor's 896px. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** A computed length of an element, in px. */
const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** Which opener a story draws (D12): the band's, an eyebrow over its <h2>,
 *  or the page's, its <h1> over a lead. */
type Opener = 'band' | 'page';

/** Each opener's heading and its design size inside THE SCALE (D10, D12):
 *  the band's <h2> on the `band` step, 36 design pixels; the page's <h1> on
 *  ui/Heading's `hero-scaled` step through PageHero, 16.26 spacing steps,
 *  65.04. */
const OPENER_HEADING: Record<
  Opener,
  Readonly<{ level: 1 | 2; design: number }>
> = {
  band: { level: 2, design: 36 },
  page: { level: 1, design: 16.26 * 4 },
};

/** Each doctor's name, by opener (D6, D12): an <h3> under the band's <h2>,
 *  an <h2> under the page's <h1>. */
const NAME_LEVEL: Record<Opener, PersonnelHeadingLevel> = {
  band: 3,
  page: 2,
};

/** The band's two boxes under its <section> — ui/Container's column and the
 *  rhythm box inside it — reached by structure: neither carries a role. */
const boxesOf = (
  band: HTMLElement,
): Readonly<{ column: HTMLElement; rhythm: HTMLElement }> => {
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  if (!(column instanceof HTMLElement) || !(rhythm instanceof HTMLElement)) {
    throw new Error('DoctorShowcase story: the band lost its column');
  }
  return { column, rhythm };
};

/** D10's three GATES, read where the play finds itself — never the pinned
 *  window: a fine primary pointer, the relative colour syntax that rides
 *  with registered custom properties, and a column of max(56rem, 896px). */
const scalableAt = (column: HTMLElement): boolean =>
  window.matchMedia('(pointer: fine)').matches &&
  CSS.supports('color', 'rgb(from red r g b)') &&
  column.getBoundingClientRect().width >=
    Math.max(STEP_REM * rem(), STEP_FLOOR);

/** A length within `within` of the expected one, the two named on a miss. */
const near = async (
  actual: number,
  expected: number,
  within: number,
  label: string,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(within);
};

/** Nothing may require horizontal scrolling (§7, §9) — the page measured by
 *  the root's own BOX, which ends where a reserved scrollbar gutter begins.
 *  Never by `clientWidth`: in a Vitest runner's frame it is the whole window,
 *  the 15px gutter included, so a check against it let 10px of real overflow
 *  through (G2 React, measured — the reading of PageHero.stories.tsx's and
 *  PostList.stories.tsx's expectNoSidewaysScroll). */
const expectNoSidewaysScroll = async (): Promise<void> => {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(root.getBoundingClientRect().width),
  );
};

/** The real faces of the hero's two blocks, asked for by their COMPUTED
 *  fonts before a line is counted (PageHero.stories.tsx's loadFace):
 *  Storybook loads the faces under their own family names, `font-display:
 *  block`, and a line counted in a fallback face is another line. */
const loadHeroFaces = async (hero: HTMLElement): Promise<void> => {
  for (const element of hero.querySelectorAll<HTMLElement>('h1, p')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/**
 * THE SCALE (D10), asserted where the play finds itself — the column read
 * off ui/Container, the band's first box, never the pinned window, and the
 * two GATES read off the browser the play runs in: a fine primary pointer, and
 * the relative colour syntax that rides with registered custom properties.
 * Where all three hold, every size below is the reference's × s, s =
 * min(column, CAP) / REFERENCE with the cap in rem of the root — to a tenth of
 * a pixel for a font, half a pixel for a box; elsewhere the band declares
 * nothing: its design pixel is the registered 1px and the quote the theme's
 * `text-lg`. Under the page opener (D12) the heading read is the <h1>, at its
 * 65.04 design pixels, the names <h2>s, and the room above the hero the blog
 * hero's 32 steps, 128 × s.
 */
const expectScale = async (
  band: HTMLElement,
  opener: Opener = 'band',
): Promise<void> => {
  const { column, rhythm } = boxesOf(band);
  const width = column.getBoundingClientRect().width;
  const cards = within(band).getAllByRole('article');

  if (!scalableAt(column)) {
    await expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
    for (const card of cards) {
      await near(
        px(within(card).getByRole('blockquote'), 'font-size'),
        1.125 * rem(),
        0.1,
        'the quote, unscaled',
      );
    }
    return;
  }

  const s = Math.min(width, CAP_REM * rem()) / REFERENCE;
  const heading = OPENER_HEADING[opener];
  await near(px(rhythm, '--scale-px'), s, 0.0001, 'the design pixel');
  await near(
    px(
      within(band).getByRole('heading', { level: heading.level }),
      'font-size',
    ),
    heading.design * s,
    0.1,
    'the title',
  );
  if (opener === 'page') {
    // THE ROOM ABOVE (D12): the blog hero's `@3xl:pt-32`, 32 steps — the regime's
    // step lies past the 48rem one.
    await near(px(rhythm, 'padding-top'), 128 * s, 0.5, 'the room above');
  }
  for (const card of cards) {
    const image = card.querySelector('img');
    if (image === null) {
      throw new Error('DoctorShowcase story: a card has no picture');
    }
    const link = within(card).getByRole('link').getBoundingClientRect();
    await near(
      px(within(card).getByRole('blockquote'), 'font-size'),
      18 * s,
      0.1,
      'the quote',
    );
    await near(
      px(
        within(card).getByRole('heading', { level: NAME_LEVEL[opener] }),
        'font-size',
      ),
      36 * s,
      0.1,
      'the name',
    );
    await near(
      image.getBoundingClientRect().width,
      288 * s,
      0.5,
      'the picture',
    );
    await near(link.width, 448 * s, 0.5, 'the link’s width');
    await near(link.height, 56 * s, 0.5, 'the link’s height');
  }
};

type Expected = Readonly<{
  eyebrow: string;
  title: string;
  doctors: readonly DoctorShowcaseDoctor[];
}>;

/** What a PAGE OPENER story must show (D12): the hero and the doctors. */
type ExpectedPage = Readonly<{
  hero: DoctorShowcaseHero;
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
 *     picture ABOVE the words (the owner's adaptability rule, §14) — and on a
 *     phone, the picture's round CELL LEFT of the name on EVERY card, odd ones
 *     included, under the specialty and on its left edge (PersonnelCard D20's
 *     ONE SIDE ON A PHONE — the owner, 2026-10-10: "i prefer only left on
 *     phone"; the ribbon still alternates). The picture is measured by its
 *     CELL: on a phone the <img> is drawn 165 % of its circle and clipped,
 *     so its own box reaches past the circle on EVERY side — at a 112px
 *     circle 36.4px left and right, 20.2px above and 114.2px below;
 *   · THE SCALE (D10, `expectScale`): from the Container's step the band in
 *     its design pixel, below it the theme's own sizes;
 *   · nothing scrolls sideways (§7).
 * Under the PAGE opener (D12, `expectPage`) the opener's half reads the
 * page's <h1> over its lead instead, and the names are <h2>s; the column's
 * half — the list, the ribbon, the sides — is the same (`expectColumn`).
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

  await expectColumn(band, expected.doctors, NAME_LEVEL.band);

  await expectScale(band);

  await expectNoSidewaysScroll();
};

/**
 * THE PAGE OPENER, read off a SETTLED page (D12): ONE <h1> — the hero's
 * title, found by its name with every run of whitespace collapsed
 * (`namedAs`: the copy breaks it with a `\n`) — over its lead, both visible;
 * the band an UNNAMED <section>, so no region on the page; every doctor's
 * name an <h2> and none an <h3>; where the band is scaled, THE HERO INSIDE
 * THE REAL BAND — the heading in TWO lines and the lead in THREE (PageHero's
 * stairway, the copy's own breaks held), and the <h1>'s box centred on the
 * rhythm box however far it reaches past the column; then the column's half
 * (`expectColumn`), THE SCALE with the <h1>'s design size and the hero's
 * room above, and nothing sideways (§7). Off the scale the copy's breaks are
 * spaces, and no line count is asserted: the prose wraps where its column
 * ends.
 */
const expectPage = async (
  canvasElement: HTMLElement,
  expected: ExpectedPage,
): Promise<void> => {
  await settled(canvasElement);
  const canvas = within(canvasElement);

  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const title = canvas.getByRole('heading', {
    level: 1,
    name: namedAs(expected.hero.title),
  });
  await expect(title).toBeVisible();
  const hero = title.parentElement;
  const band = title.closest('section');
  if (hero?.tagName !== 'HEADER' || !(band instanceof HTMLElement)) {
    throw new Error('DoctorShowcase story: the page opener lost its hero');
  }
  const lead = hero.lastElementChild;
  if (!(lead instanceof HTMLElement)) {
    throw new Error('DoctorShowcase story: the page opener lost its lead');
  }
  await expect(lead.tagName).toBe('P');
  await expect(lead.textContent).toBe(expected.hero.lead);
  await expect(lead).toBeVisible();

  await expect(canvas.queryAllByRole('region')).toHaveLength(0);
  await expect(band).not.toHaveAttribute('aria-labelledby');
  await expect(band).not.toHaveAttribute('aria-label');
  await expect(within(band).queryAllByRole('heading', { level: 3 })).toEqual(
    [],
  );

  const { column, rhythm } = boxesOf(band);
  if (scalableAt(column)) {
    // THE HERO INSIDE THE REAL BAND (PageHero's THE STAIRWAY and THE
    // HEADING'S REACH), its real faces first: two lines of heading, three of
    // lead, and the <h1> centred on the rhythm box — the reach itself is
    // PageHero's number, never read here.
    await loadHeroFaces(hero);
    await expect(linesOf(title)).toHaveLength(2);
    await expect(linesOf(lead)).toHaveLength(3);
    const heading = title.getBoundingClientRect();
    const box = rhythm.getBoundingClientRect();
    await near(
      heading.left + heading.width / 2,
      box.left + box.width / 2,
      0.5,
      'the <h1> centred on the rhythm box',
    );
  }

  await expectColumn(band, expected.doctors, NAME_LEVEL.page);

  await expectScale(band, 'page');

  await expectNoSidewaysScroll();
};

/**
 * THE COLUMN'S HALF of every story (D3, D5, D6), under either opener: ONE
 * list — the ribbon's root — with an item and a station per doctor, each card
 * an <article> whose name is a heading at `level`; one sized canvas per card
 * in the ribbon's aria-hidden layer, nothing focusable there; and the sides
 * (`expectBand`'s list says how each branch is read).
 */
const expectColumn = async (
  band: HTMLElement,
  doctors: readonly DoctorShowcaseDoctor[],
  level: PersonnelHeadingLevel,
): Promise<void> => {
  const list = within(band).getByRole('list');
  await expect(within(list).getAllByRole('listitem')).toHaveLength(
    doctors.length,
  );
  await expect(list.querySelectorAll('[data-ribbon-station]')).toHaveLength(
    doctors.length,
  );
  const cards = within(list).getAllByRole('article');
  await expect(
    cards.map(
      (card) => within(card).getByRole('heading', { level }).textContent,
    ),
  ).toEqual(doctors.map((doctor) => doctor.name));

  const layer = list.lastElementChild;
  if (!(layer instanceof HTMLElement)) {
    throw new Error('DoctorShowcase story: the ribbon lost its layer');
  }
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await waitFor(
    () => expect(layer.querySelectorAll('canvas')).toHaveLength(doctors.length),
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
    const cell = image?.parentElement;
    if (!image || !cell) {
      throw new Error(`DoctorShowcase story: card ${index + 1} has no picture`);
    }
    const picture = cell.getBoundingClientRect();
    const words = quote.getBoundingClientRect();
    await expect(picture.height).toBeGreaterThan(0);
    await expect(words.height).toBeGreaterThan(0);
    if (inHeader(quote)) {
      // THE PHONE HEADER (PersonnelCard D20): the specialty on top, then the
      // round photo on the LEFT beside the name — on EVERY card, the odd,
      // mirrored ones too (D20's ONE SIDE ON A PHONE) — every line at the
      // same left edge, and the words under both.
      const heading = within(card).getByRole('heading', { level });
      const name = heading.getBoundingClientRect();
      // The specialty is the eyebrow after the name in the DOM (PersonnelCard
      // D17's PAIR) — painted above it on a phone.
      const eyebrow = card.querySelector(`h${level} + p`);
      if (eyebrow === null) {
        throw new Error(
          `DoctorShowcase story: card ${index + 1} has no specialty`,
        );
      }
      const specialty = eyebrow.getBoundingClientRect();
      await expect(specialty.bottom).toBeLessThanOrEqual(
        Math.min(picture.top, name.top) + 0.5,
      );
      await expect(Math.abs(picture.width - picture.height)).toBeLessThan(0.5);
      await expect(Math.abs(picture.left - specialty.left)).toBeLessThan(0.5);
      await expect(picture.right).toBeLessThanOrEqual(name.left);
      await expect(getComputedStyle(heading).textAlign).toBe('start');
      await expect(getComputedStyle(eyebrow).textAlign).toBe('start');
      await expect(Math.max(picture.bottom, name.bottom)).toBeLessThanOrEqual(
        words.top,
      );
    } else if (!sitsBeside(quote)) {
      await expect(picture.bottom).toBeLessThanOrEqual(words.top);
    } else if (index % 2 === 0) {
      await expect(picture.right).toBeLessThanOrEqual(words.left);
    } else {
      await expect(words.right).toBeLessThanOrEqual(picture.left);
    }
    // THE PICTURE'S FLOOR (PersonnelCard D17): beside words that run TALLER
    // than it, the picture stands on the bottom of the row the words set, so
    // the waist stays right above the name. `GermanLongText` is the story
    // where this runs — inside the scale, ≈ 560 × s px of words (20 lines at
    // the reference, a line fewer from about the 1536 window: D10's THE
    // WORDS' LIMIT) beside a 384 × s px picture.
    if (sitsBeside(quote) && words.height > picture.height) {
      await expect(Math.abs(picture.bottom - words.bottom)).toBeLessThanOrEqual(
        1,
      );
    }
  }
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
    hero: {
      control: false,
      description:
        'THE PAGE OPENER (D12) — the Team page’s, in place of the eyebrow and the title, which it refuses: `{ title, lead }`, finished, the page’s <h1> with ONE line break where the stairway turns and its lead with TWO (sections/PageHero). The <section> is then unnamed — the page’s <main> is the landmark — every doctor’s name an <h2>, the room above the blog hero’s, and an empty list renders the hero alone. Home passes the band opener',
    },
    doctors: {
      control: false,
      description:
        'Every doctor, finished — name, specialty, the cutout, the quoted words (ui/Keyword fragments inside) and the ONE link to the doctor’s page, already locale-prefixed — in the page’s order, printed as given. Each becomes a doctor card (sections/PersonnelCard) whose name is an <h3> (D6) — an <h2> under the page opener (D12) — the sides alternating start, end, … by index (D5), all in one list the floss ribbon wraps (D3). EMPTY renders nothing at all (D7) — the hero alone under the page opener (D12)',
    },
    firstScreen: {
      control: false,
      description:
        'True when the band is on the FIRST SCREEN of its page — the Team page, which it opens: the FIRST card’s picture then loads at once, at high fetch priority and with a preload link (D9, PersonnelCard D18), and every other card stays lazy. That picture stands in the Team page’s first screen at every window measured and IS its LCP element on a 768 tablet; at 390 × 844, 1280 × 800, 1401 × 1063, 1536 × 864 and 1920 × 1080 the hero’s <h1> is, and the preload is kept on purpose (D9). Default false — Home, where the band sits under the Hero. The PAGE says it; the band never guesses. Not a live control: it moves no pixel',
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
 * THE NOTEBOOK — §7's 1280 sampling point: the everyday band drawn at about
 * 0.91 of the owner's reference (D10), every ratio of his 1401 band kept —
 * the card no shorter for its width, the picture, the words and the link no
 * smaller for it. For the workbench: 'no-visual' (the header says why).
 */
export const Notebook: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'notebook' } },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};

/**
 * THE DESKTOP — §7's 1920 sampling point: the same band at about 1.39 of the
 * reference (D10), larger in every length at once instead of wider with the
 * same small things in it — THE CAP's band, or within a classic scrollbar's
 * 15px of it: every wider window shows the cap's, centred in its column. For
 * the workbench: 'no-visual' (the header).
 */
export const Desktop: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};

/**
 * THE PHONE — every card one column: the specialty across the top, the round
 * photo on the LEFT beside the name on BOTH cards, the mirrored second
 * included (PersonnelCard D20, the owner's picks of 2026-10-10 — "S09.1 ·
 * Kicker, bigger face", then "i prefer only left on phone"), then the words
 * and the link; and the ribbon at its bolder phone gauge, still alternating
 * from card to card (§15.26, fb-501).
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
 * THE NARROWEST WINDOW — 320px, the accessibility stress width (§7): a 288px
 * column on a phone since ui/Container's PHONE GUTTER of 2026-10-09 (256
 * before it; 273 under the classic scrollbar the net photographs it with),
 * the ribbon at its thinnest, and nothing — no card, no tile of the ribbon —
 * scrolling the page sideways. Pinned there in the workbench and photographed
 * there too ('stress-320').
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

/** NarrowContainer's box: the reference column with ui/Container's gutter at
 *  the desktop pin on either side — 1106 + 2 × 192 (10vw of 1920). */
const NARROW_BOX = 1490;

/**
 * THE BAND IN A NARROWER CONTAINER (D10 — the owner: "i might even make it
 * myself smaller for it to fit in a different container or smth but i think
 * i'd want same rations to still remian"). The band's design pixel reads its
 * OWN column, never the window, so in a box narrower than its page it is the
 * same band, smaller. Here the box is 1490px, marked by a dashed line drawn
 * INSIDE it (`outline-offset: -1px` — outside, the line fell off a
 * full-screen canvas at 390 and showed only its two sides at 1536, G2 a11y's
 * A6), and at the desktop pin the column ui/Container leaves inside it is the
 * owner's own reference — the band of his 1401 window, to the pixel, on a
 * 1920 screen whose full-width band (`Desktop`) is drawn at 1.39 times it.
 * Where the screen is narrower than the box, the box is the screen
 * (`max-width: 100%`): the net's 1536 frame shows the band in a 1490px box —
 * at s ≈ 1.07 — and its 390 frame the phone's band inside the line.
 */
export const NarrowContainer: Story = {
  globals: { locale: 'ro', viewport: { value: 'desktop' } },
  decorators: [
    (Story) => (
      <div
        style={{
          width: `${NARROW_BOX}px`,
          maxWidth: '100%',
          marginInline: 'auto',
          outline: '1px dashed var(--line)',
          outlineOffset: '-1px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expectBand(canvasElement, {
      eyebrow: EYEBROW_RO,
      title: TITLE_RO,
      doctors: DOCTORS_RO.slice(0, 2),
    });
  },
};

/**
 * THE PAGE OPENER (D12) — the Team page's band, Romanian, at the laptop
 * width: in place of the eyebrow and the <h2>, the blog list's hero
 * (sections/PageHero) — the page's <h1> over its lead, both centred, the
 * heading's two lines and the lead's three stepping down like a stairway
 * inside the band scale — then the three doctors, each name an <h2>, and the
 * first card's picture preloaded as on the page (`firstScreen`, D9). The
 * <section> names nothing: the page's <main> is the landmark. The meta's
 * eyebrow and title are cleared, so the band is handed exactly what the page
 * hands it.
 */
export const PageOpener: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: {
    eyebrow: undefined,
    title: undefined,
    hero: HERO_RO,
    doctors: DOCTORS_RO,
    firstScreen: true,
  },
  play: async ({ canvasElement }) => {
    await expectPage(canvasElement, { hero: HERO_RO, doctors: DOCTORS_RO });
  },
};

/**
 * THE PAGE OPENER IN GERMAN (D12), the longest language (§8.4), at the laptop
 * width: the Team page's German hero over the German doctors — the first
 * with the ~1 200-character text, so its words run far taller than its
 * picture (`GermanLongText`'s cards, under the page's own heading). The
 * hero's copy and the doctors' words are DRAFTS (§15.17).
 */
export const PageOpenerGerman: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  args: {
    eyebrow: undefined,
    title: undefined,
    hero: HERO_DE,
    doctors: DOCTORS_DE,
    firstScreen: true,
  },
  play: async ({ canvasElement }) => {
    await expectPage(canvasElement, { hero: HERO_DE, doctors: DOCTORS_DE });
  },
};
