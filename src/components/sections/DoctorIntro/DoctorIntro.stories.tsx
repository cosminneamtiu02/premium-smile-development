import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '@/components/ui/Button/Button';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import {
  DoctorIntro,
  type DoctorIntroCredo,
  type DoctorIntroPhoto,
} from './DoctorIntro';

// SEVEN stories — four photographed and three play-only — and the count is the
// honest one: the everyday opener, one filled slot so he can see what the band
// looks like with something after the credo card, the two expansion stresses,
// and three frames for their PLAYS alone, tagged `no-visual` so the pixel net
// never photographs them: the everyday opener at 1280 (`Notebook`, where the
// words set the row and the cutout GROWS to their floor) and at 1920
// (`Desktop`, where the picture at its third sets it and nothing grows) — the
// two branches of D64's one floor, each pinned once — and the German stress
// in a column just past the step (`AtTheStep`), where the words' room is
// tightest and the picture's track must give way to the name.
// The three frames that answered the owner's "top, center or bottom" question
// — Centered, Lowered and Bottom — left with the `align` axis itself (D62,
// 2026-10-01: the name tops the words' container and the card centres in the
// rest, so there is no seat left to choose). The photographed export
// NAMES are load-bearing — each one names a baseline file
// (`sections-doctorintro--default`, `sections-doctorintro--with-actions`, …) —
// so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the run's visual manifest. The `Sections/*` title prefix
// routes every one of them to 390 + 1536 (tests/visual/stories.spec.ts, §13);
// the 'stress-320' tag adds the accessibility width to the three whose layout
// has something to say there (a 256px column around a 900×1200 cutout and a
// framed card in its aura, a German compound with hyphenation switched off,
// a 40%-expanded name).
//
// ── NO CredoCard STORY OF ITS OWN (round 2's D12): the card has one consumer
// and is photographed inside EVERY story below, so a separate frame would only
// duplicate those pixels. Its contract lives in CredoCard.test.tsx; what these
// plays add is what only real CSS can show — the card really stands under the
// name, in the name's column, with the language's own quote marks generated
// around justified words (D22), and its eyebrow at the specialty's own size
// (D43c).
//
// ── THE BAND TAKES ITS WHOLE CONTENT AS ARGS, because it is DUMB (run D1):
// no message file, no data module, no `t()`. So the fixtures below are the
// control surface — the locale toolbar changes nothing here, which is the
// §8.9 sweep PASSING rather than failing, and it is why the German and pseudo
// stresses are typed out as their own fixtures instead of produced by flipping
// the toolbar (the SectionHeading / PersonnelCard / PriceList precedent).
// The credo's segments are SPELLED HERE rather than imported from lib/team:
// a story that read the data module would re-photograph every time a doctor's
// words were edited, and the band never sees lib/team either — the page cuts
// the words and hands the fragments over (D17).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT, and both halves
// are load-bearing:
//   · the locale pin, even though this band reads no message file:
//     .storybook/preview.tsx stamps `<html lang>` from that global, and two
//     things read it. The body's site-wide `hyphens: auto` (§15.14) picks its
//     dictionary from the declared language — the name and the specialty opt
//     OUT of it (`hyphens-none`), the credo's quote does not, because it is
//     prose. And the quote marks are `quotes: auto` generated content, so the
//     SAME card wears „…” under `ro` and „…“ under `de` from that one
//     attribute (ReviewCard's D6);
//   · the viewport pin, because this band CHANGES SHAPE with the column it is
//     handed: picture beside words from `@3xl` = 48rem of ui/Container's box
//     (two containers across the whole column, the picture's third and the
//     words' rest — D62 to D64), and below it
//     one above the other —
//     the name and specialty centred on top, then the picture, then the credo
//     card (D51c, the owner's adaptability rule as reordered in round 2k). A
//     manager canvas narrowed
//     by the sidebar sits in the middle of that band. Playwright ignores the
//     pin — it sets its own page size per project — which is exactly why
//     every geometry assertion below DERIVES its expectation from the measured
//     column instead of assuming the pinned width (the PersonnelCard
//     `sitsBeside` and PriceList `splitHasFired` precedent). The vitest
//     runner DOES honour the pin, so the two smartphone stories are the ones
//     that walk the stacked branch there.
//
// ── NO BAND DECORATOR, unlike PersonnelCard's: that card needs a width-giving
// parent because ui/Card contains its own inline size, while THIS component IS
// the band — its own full-bleed <section> with its own ui/Container and its
// own `py` (the PAGE-BAND RECIPE in Container.tsx's header). The credo card
// inside it is a ui/Card too, and it gets its width from the band itself —
// beside the picture the bottom container's one track (D62, D63), in the
// stack the grid's one column (ui/Card D3). Wrapping the band in a second band would
// put the story's ground and the band's gutters on two different rulers, which
// is also why `layout: 'fullscreen'` is not optional here: Storybook's default
// canvas padding would falsify the measurement.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the band reads no message
// file, links nowhere and hydrates nothing of its own — the only island in the
// frame is the one ui/Image brings with the cutout, which is also why the demo
// pictures are committed fixtures rather than a design-time placeholder.
//
// Demo people are INVENTED and the cutouts are synthetic silhouettes
// (public/images/demo/cutout-1…2.png, 900×1200 with a transparent ground, made
// for this run): no real doctor, nothing to license, obviously placeholders.
// Copy is Romanian with diacritics (§15.7) and factual — no superlatives, no
// promises, no result guarantees (the CMSR advertising rules for dental
// practices, in force since 2025-07-01). The real people, in five languages,
// are the owner's to author (§15.17).

/** The two committed demo cutouts — transparent PNGs at the same 3:4 figure
 *  ratio, so the two stress stories photograph the same box as the everyday
 *  one. */
const CUTOUTS = {
  elena: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
  friederike: { src: '/images/demo/cutout-2.png', width: 900, height: 1200 },
} satisfies Record<string, DoctorIntroPhoto>;

/**
 * THE CREDO FIXTURES (D12) — the eyebrow and title the page's
 * `team.doctor.philosophy` keys carry (round 2's D20), and the doctor card's
 * own quote cut into ui/Keyword segments: Elena's two fragments are the
 * PersonnelCard fixtures' („ortodonție", „ascultarea"), Friederike's the
 * German stress's („Behandlungsschwerpunkte", „Nachsorgetermine"). No
 * quotation mark anywhere in here: the marks are CSS, in the document's
 * language.
 */
const ELENA_SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Lucrez în ', keyword: false },
  { text: 'ortodonție', keyword: true },
  {
    text: ' de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ',
    keyword: false,
  },
  { text: 'ascultarea', keyword: true },
  {
    text: ' pacientului, apoi construim împreună un plan potrivit.',
    keyword: false,
  },
];

const FRIEDERIKE_SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Meine ', keyword: false },
  { text: 'Behandlungsschwerpunkte', keyword: true },
  {
    text: ' sind Kieferorthopädie und Zahnerhaltung. Vor jedem Eingriff erkläre ich die einzelnen Schritte, und die ',
    keyword: false,
  },
  { text: 'Nachsorgetermine', keyword: true },
  { text: ' vereinbaren wir gemeinsam.', keyword: false },
];

/**
 * Elena's words put through the preview's own ACCENT map — and ONLY the map.
 * The eyebrow and the title below are MESSAGES on the real page (D20), so
 * they get the whole transform, `·`-padding included. The quote is lib/team
 * DATA (D17), which the toolbar's transform never reaches; and padding it
 * would produce a 73-character run of U+00B7, a character line breaking
 * treats as a letter (UAX #14 class AI → AL), i.e. one unbreakable word wider
 * than a phone's card — an overflow no real page can ever ship. The accents
 * keep the glyph stress; German carries the expansion stress.
 */
const ELENA_PSEUDO_SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Lúçréž îñ ', keyword: false },
  { text: 'órťódóñțíé', keyword: true },
  {
    text: ' dé péšťé žéçé áñí șí éxplíç fíéçáré éťápă á ťráťáméñťúlúí. Çóñšúlťáțíá îñçépé çú ',
    keyword: false,
  },
  { text: 'ášçúlťáréá', keyword: true },
  {
    text: ' páçíéñťúlúí, ápóí çóñšťrúím împréúñă úñ pláñ póťrívíť.',
    keyword: false,
  },
];

const CREDOS = {
  ro: {
    eyebrow: 'În cuvintele mele',
    title: 'Filozofia mea',
    body: <Keywords segments={ELENA_SEGMENTS} />,
  },
  de: {
    eyebrow: 'In meinen Worten',
    title: 'Meine Philosophie',
    body: <Keywords segments={FRIEDERIKE_SEGMENTS} />,
  },
  pseudo: {
    eyebrow: 'Îñ çúvíñťélé mélé ·······',
    title: 'Fílóžófíá méá ······',
    body: <Keywords segments={ELENA_PSEUDO_SEGMENTS} />,
  },
} satisfies Record<string, DoctorIntroCredo>;

const meta = {
  title: 'Sections/DoctorIntro',
  component: DoctorIntro,
  parameters: { layout: 'fullscreen' },
  args: {
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    photo: CUTOUTS.elena,
    credo: CREDOS.ro,
  },
  argTypes: {
    name: {
      control: 'text',
      description:
        'The doctor’s full name, finished and already translated (§8.1) — becomes the PAGE’s one real `<h1>` at ui/Heading’s fluid `hero` step. Never hyphenates: a person’s name wraps between words or not at all (§15.14’s rider)',
    },
    position: {
      control: 'text',
      description:
        'The specialty, finished text — the mono eyebrow above the name. Authored in SENTENCE case: the uppercase is ui/Eyebrow’s CSS, so Ș/Ț case mapping stays the browser’s job',
    },
    photo: {
      control: false,
      description:
        'The cutout: a path under public/ plus its INTRINSIC pixel size, which is the optimizer’s srcset input and the reserved box (§11, zero layout shift). Transparent ground, shown whole — ui/Image’s `artwork` recipe in the stack, and beside the words drawn as tall as the row and standing on the words’ floor (D64) — and `alt=""` by construction — the `<h1>` beside it IS the identity (PersonnelCard D3). Not a live control: a text knob over a file path would only ever produce a broken image',
    },
    credo: {
      control: false,
      description:
        'REQUIRED (D12) — the credo card under the name: `{ eyebrow, title, body }`. The card is ui/Card’s `framed` tone (the reviews deck’s idle card) in ui/Card’s `aura`, the Header pill’s lavender glow (D61), a region named by its `<h2>` (the title, through SectionHeading), and `body` — a ReactNode carrying ui/Keyword’s fragments — quoted in the document’s own marks by CSS, justified (D22) at `text-xl` (D43b). Not a live control: the body is JSX',
    },
    children: {
      control: false,
      description:
        'Free slot AFTER the credo card — the owner has not yet said what else stands there; the WithActions story shows one candidate. Whatever arrives is the CONSUMER’s markup, so its own text alignment is the consumer’s too (§15.15 b’s per-element canon)',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the `<section>` (§6.4/§6.8). The band owns its own vertical rhythm and no outer margin at all — the page owns the rhythm between its bands',
    },
  },
} satisfies Meta<typeof DoctorIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7, §9), in any
 *  language. Band-scoped: nothing here clips on purpose, so the band's own box
 *  is the honest thing to measure. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/**
 * THE PICTURES FIRST — every play that measures calls this BEFORE its first
 * geometry read (2026-09-27, CI on PR #110; DoctorIntro.tsx's THE STACKED
 * TRACK paragraph has the whole story). It waits for every picture to SETTLE:
 * its `decode()` resolved OR rejected, and then `complete` is true — the
 * picture is done, whatever the outcome. Measured here, the German story's
 * cutout was still unsettled at the play's first read (no source chosen yet),
 * so a geometry read there is a read of a layout nobody gets.
 *
 * It asserts NOTHING about pixels (`naturalWidth`), and that is deliberate:
 * CI's Vitest step runs before any image optimizer, so ui/Image's variants
 * do not exist there and the cutout ERRORS (complete, naturalWidth 0) — and
 * the layout is the same either way, because the track's floor is the
 * picture BOX's, not its pixels (CI measured the 320px overflow with exactly
 * that errored image). Whether the pixels arrive is the visual net's
 * business, not the plays'. `complete` is polled (`waitFor`) rather than read
 * once, because ui/Image answers an error by swapping to the original file —
 * but that swap is React's, and an errored picture already reads `complete`
 * before it, so the poll does NOT wait for the fallback (the Opus React
 * review: a 3s-late fallback was still loading when a play finished). The
 * plays hold anyway because the box they measure does not depend on the
 * pixels: Chromium keeps the width/height attributes' proportion on an
 * `<img>` that is loading, falling back or broken (D64's out-of-flow cutout
 * is sized from the row and that proportion alone). A change of engine or
 * of the cutout's CSS that made the box follow the pixels would need a real
 * wait here. Never vacuous: the frame must hold at least one picture.
 */
const picturesSettled = async (canvasElement: HTMLElement): Promise<void> => {
  const pictures = [...canvasElement.querySelectorAll('img')];
  await expect(pictures.length).toBeGreaterThan(0);
  await Promise.all(
    pictures.map((picture) => picture.decode().catch(() => undefined)),
  );
  await waitFor(() => {
    for (const picture of pictures) expect(picture.complete).toBe(true);
  });
};

/** The root font size, which is what `rem` resolves against everywhere —
 *  including inside a container query. globals.css keeps <html> at 16px on
 *  purpose (§7: user zoom must scale everything), but READING it is what makes
 *  these assertions survive a visitor who changed it. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The REAL face, before a play measures anything a line of text sizes: a
 *  play can start before Source Serif 4 has arrived (`font-display: block`
 *  lays the words out in the fallback serif, which wraps differently), and
 *  `document.fonts.ready` can resolve before the element's face was even
 *  requested — `load()` asks for the exact face the element wears (PR #125's
 *  lesson; the Opus React and TypeScript reviews). */
const realFace = async (element: HTMLElement): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** The band root, and the two boxes inside it — reached by structure because
 *  neither the grid nor its two children carries a role of its own. Below the
 *  step the words box is `display: contents` (D51c) and HAS no box: its
 *  rectangle is all zeros there, so the stacked branch measures the pair and
 *  the card themselves. */
const bandOf = (heading: HTMLElement): HTMLElement =>
  heading.closest('section') as HTMLElement;

const boxesOf = (
  band: HTMLElement,
): { picture: HTMLElement; words: HTMLElement } => {
  const grid = (band.firstElementChild as HTMLElement)
    .firstElementChild as HTMLElement;
  return {
    picture: grid.children[0] as HTMLElement,
    words: grid.children[1] as HTMLElement,
  };
};

/**
 * THE CREDO CARD, by its role (D12): a region named by its own title. It must
 * hold a blockquote whose key word is still a visible <b> — the fragments
 * survived Keywords → DoctorIntro → CredoCard → the DOM. Returned so each play
 * can measure it against the name.
 */
const credoOf = async (
  canvasElement: HTMLElement,
  title: string,
  keyword: string,
): Promise<HTMLElement> => {
  const credo = within(canvasElement).getByRole('region', { name: title });
  const quote = within(credo).getByRole('blockquote');
  const bold = within(quote).getByText(keyword);
  await expect(bold.tagName).toBe('B');
  await expect(bold).toBeVisible();
  return credo;
};

/**
 * D43c · THE TWO EYEBROWS ARE ONE SIZE — asserted, because the owner's eye
 * said otherwise (2026-09-26: "why is size wise „În cuvintele mele" larger
 * than „Medic specialist ortodonție" if they are legit same component").
 * Both are ui/Eyebrow; every typographic value the engine resolves must agree
 * between the specialty over the name and the credo card's label. MEASURED in
 * Chromium at 1280×800 when this was written: 14px, 1.4px of tracking, 500,
 * a 20px line, JetBrains Mono, uppercase, rgb(91 85 79), a 20px box each —
 * the only differences are the words' length (264.6 vs 166.6px of ink) and
 * what surrounds them (DoctorIntro.tsx's D43c paragraph says why the eye
 * disagrees). The step itself is DERIVED from the root size — ui/Eyebrow's
 * `text-sm` (0.875rem) and `tracking-widest` (0.1em) — so a visitor's larger
 * root font moves the expectation with it (§7).
 */
const EYEBROW_TYPE = [
  'fontSize',
  'letterSpacing',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'textTransform',
  'color',
] as const;

const expectEyebrowsMatch = async (
  specialty: HTMLElement,
  label: HTMLElement,
): Promise<void> => {
  // Never-vacuous: two DIFFERENT rendered paragraphs, each at least one line
  // tall — a collapsed or duplicated query would agree with itself.
  await expect(specialty).not.toBe(label);
  await expect(specialty.tagName).toBe('P');
  await expect(label.tagName).toBe('P');
  const a = getComputedStyle(specialty);
  const b = getComputedStyle(label);
  for (const property of EYEBROW_TYPE) {
    await expect(b[property]).toBe(a[property]);
  }
  await expect(parseFloat(a.fontSize)).toBeCloseTo(0.875 * rem(), 2);
  await expect(parseFloat(a.letterSpacing)).toBeCloseTo(
    0.1 * parseFloat(a.fontSize),
    2,
  );
  // THE BOXES: whole lines of ONE line height each. Box-for-box equality holds
  // only while both fit on one line — at 320 the 27-character specialty wraps
  // and the 17-character label does not — so what is compared is the line
  // each box is built from, never an accident of the width.
  const line = parseFloat(a.lineHeight);
  await expect(line).toBeGreaterThan(0);
  for (const element of [specialty, label]) {
    const height = element.getBoundingClientRect().height;
    const lines = Math.round(height / line);
    await expect(lines).toBeGreaterThanOrEqual(1);
    await expect(Math.abs(height - lines * line)).toBeLessThanOrEqual(1);
  }
};

/**
 * WHERE THE BAND SPLITS, derived rather than assumed. `@3xl` is 48rem of
 * ui/Container's column, and a container query asks that box's CONTENT width —
 * Container has neither padding nor border, so its border-box width IS the
 * queried number, taken FRACTIONALLY (`clientWidth` is an integer and would
 * disagree with the engine inside a sub-pixel window around the step). The
 * visual runner renders every `Sections/*` story at 390 AND 1536 regardless of
 * the story's own viewport pin, so a play that assumed the pinned width would
 * be green in the workbench and wrong in the net.
 */
const sitsBeside = (band: HTMLElement): boolean =>
  (band.firstElementChild as HTMLElement).getBoundingClientRect().width >=
  48 * rem();

/** The width of every line box a text element is laid out in — a Range over
 *  its contents yields one client rect per line. */
const lineWidthsOf = (element: HTMLElement): number[] => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return Array.from(range.getClientRects(), (rect) => rect.width);
};

/** The cutout's proportion, width ÷ height — the inverse of the
 *  `--cutout-ratio` the band hands the CSS — read off the photo's INTRINSIC
 *  size, which the <img> carries as its width and height attributes (§11),
 *  never off its loaded pixels, which the Vitest run in CI does not always
 *  have (`picturesSettled`). A missing attribute is a NAMED failure: `0`
 *  over a number, or a number over `0` (Infinity), never a quiet pass. */
const proportionOf = (cutout: HTMLImageElement): number => {
  const proportion =
    Number(cutout.getAttribute('width')) /
    Number(cutout.getAttribute('height'));
  if (!Number.isFinite(proportion) || proportion <= 0)
    throw new Error('DoctorIntro story: the cutout has no intrinsic size');
  return proportion;
};

/** The picture's track as D63 sizes it: a third of the column, capped at
 *  the cutout's own width (its `width` attribute — the file's intrinsic
 *  size, §11), so the file is never drawn past its pixels. */
const thirdOf = (column: number, cutout: HTMLImageElement): number =>
  Math.min(column / 3, Number(cutout.getAttribute('width')));

/**
 * WHICH CONTAINER SET THE ROW (D64), beside the words: the picture's
 * container at exactly the cutout's height at its third — `min-h`'s floor —
 * means the PICTURE did and the words stretched to it; anything taller means
 * the WORDS did and the cutout grew to their floor. The two plays that pin a
 * branch (`Notebook`, `Desktop`) assert it outright, so neither branch of
 * `expectArrangement` below goes unwalked.
 */
const pictureSetsTheRow = (band: HTMLElement): boolean => {
  const { picture } = boxesOf(band);
  const cutout = picture.querySelector('img');
  if (!cutout) throw new Error('DoctorIntro story: the cutout is missing');
  const column = (
    band.firstElementChild as HTMLElement
  ).getBoundingClientRect();
  return (
    Math.abs(
      picture.getBoundingClientRect().height -
        thirdOf(column.width, cutout) / proportionOf(cutout),
    ) <= 1
  );
};

/**
 * THE DEMO DOCTOR'S NAME ON ONE LINE beside the picture — D51's pin, kept
 * through D62–D64: in the pair's room (the words' track less D64's 1.5rem)
 * „Dr. Elena Marin" fills ~388 / 445 / 460px of ~462 / 594 / 793px at 1280 /
 * 1536 / 1920 (the `hero` step's 60.8 / 69.76 / 72px; the classic
 * scrollbar's column), so her name reads on
 * ONE line at every laptop and desktop width, and a drift that wrapped it
 * fails a play instead of slipping into a baseline. Both readings, so
 * neither can be vacuous: the text's own line fragments (a Range's client
 * rects, one per line) and the element's height against ONE line box. (Until
 * D62 the pin stopped at 1536: in the old shared 28rem column the 72px step
 * wrapped her name by design.)
 */
const expectNameOnOneLine = async (
  band: HTMLElement,
  name: HTMLElement,
): Promise<void> => {
  if (!sitsBeside(band)) return;
  // The REAL face first: the fallback serif is wider and wraps the name for a
  // reason that is not the layout's (measured: two line fragments in the
  // file's first story, one after the load).
  await realFace(name);
  const range = document.createRange();
  range.selectNodeContents(name);
  await expect(range.getClientRects()).toHaveLength(1);
  await expect(
    Math.abs(
      name.getBoundingClientRect().height -
        parseFloat(getComputedStyle(name).lineHeight),
    ),
  ).toBeLessThanOrEqual(1);
};

/**
 * The arrangement contract in one place, in the branch the measured column
 * actually puts us in — the owner's adaptability rule (D21): below the step
 * one above the other (D51c — the phone and the tablet exactly as they were
 * before D62), the name and specialty centred on top, then the picture, then
 * the credo card; at the step D62's two containers across the WHOLE column,
 * spaced by D63 — the inset, the picture's third, the gap, the words in the
 * rest — and standing on D64's one floor: the name a ninth of the column down
 * on the left edge it shares with the card, the card centred in the height
 * left under it, and the cutout drawn as tall as the row, centred on its
 * third and standing where the words end. In BOTH branches the card follows
 * the name in the DOM and on screen, inside the words' markup (D12).
 */
const expectArrangement = async (
  band: HTMLElement,
  credo: HTMLElement,
): Promise<void> => {
  const { picture, words } = boxesOf(band);
  const name = band.querySelector('h1') as HTMLElement;
  const specialty = name.nextElementSibling as HTMLElement;
  const pair = name.parentElement as HTMLElement;
  // D62's BOTTOM CONTAINER: the card's parent, the pair's next sibling.
  const philosophy = credo.parentElement as HTMLElement;
  const pictureBox = picture.getBoundingClientRect();
  const nameBox = name.getBoundingClientRect();
  const pairBox = pair.getBoundingClientRect();
  const credoBox = credo.getBoundingClientRect();

  // A collapsed box (zero height) would satisfy every comparison below by
  // accident — each one must occupy real space first.
  await expect(pictureBox.height).toBeGreaterThan(0);
  await expect(pairBox.height).toBeGreaterThan(0);
  await expect(credoBox.height).toBeGreaterThan(0);

  // THE MARKUP IS ONE SHAPE AT EVERY WIDTH: the pair first in the words'
  // container, the bottom container after it with the card first inside,
  // and the card painted under the name.
  await expect(words.firstElementChild).toBe(pair);
  await expect(pair.nextElementSibling).toBe(philosophy);
  await expect(philosophy.firstElementChild).toBe(credo);
  await expect(credoBox.top).toBeGreaterThanOrEqual(nameBox.bottom);

  const column = (
    band.firstElementChild as HTMLElement
  ).getBoundingClientRect();
  const grid = (band.firstElementChild as HTMLElement)
    .firstElementChild as HTMLElement;
  const gridStyle = getComputedStyle(grid);

  // D43a · THE RHYTHM (round 2j, halved: "push it higher … the whole thing"),
  // derived from the measured column like the split itself: 1.5rem below
  // `@lg` (32rem of column), 2rem from it, 2.5rem from `@3xl` — top and
  // bottom alike from `@lg` up, the band's own `py` (the PAGE-BAND RECIPE's
  // rule 3). D51 and D62 left it alone.
  // D61's ONE RIDER: below `@lg` the BOTTOM is 2rem, not 1.5 (`pb-8`) — the
  // credo card is the stack's last item and its aura reaches ~32px below it,
  // which the next band would otherwise cut (CredoCard.tsx's D61 paragraph);
  // the top keeps D43a's 1.5rem there.
  const py = sitsBeside(band) ? 2.5 : column.width >= 32 * rem() ? 2 : 1.5;
  const pb = sitsBeside(band) ? py : 2;
  await expect(
    Math.abs(parseFloat(gridStyle.paddingTop) - py * rem()),
  ).toBeLessThanOrEqual(0.5);
  await expect(
    Math.abs(parseFloat(gridStyle.paddingBottom) - pb * rem()),
  ).toBeLessThanOrEqual(0.5);

  if (!sitsBeside(band)) {
    // Below the step — ONE ABOVE THE OTHER, reordered by D51c (the owner,
    // 2026-09-26: "name and speciality of doctor to appear above the photo
    // and to be centered … filozofia mea sits well below photo"): the words
    // column is no box at all, the pair climbs above the figure, the card
    // stays under it.
    await expect(getComputedStyle(words).display).toBe('contents');
    // D62 gave the card a box of its own beside the picture — and below the
    // step it dissolves as well, so the card (and a slot) are still the
    // stack's own grid items: the phone and the tablet as they were.
    await expect(getComputedStyle(philosophy).display).toBe('contents');
    await expect(pairBox.bottom).toBeLessThanOrEqual(pictureBox.top);
    await expect(pictureBox.bottom).toBeLessThanOrEqual(credoBox.top);
    // THE ONE TRACK NEVER OUTGROWS THE COLUMN (2026-09-27, CI on PR #110 —
    // DoctorIntro.tsx's THE STACKED TRACK paragraph): the grid's single
    // column is `minmax(0,1fr)`, so the picture box's min-content cannot
    // widen it past ui/Container's box. Read three ways, because the band's
    // own `expectNoSidewaysScroll` cannot see this overflow — it lands in the
    // gutter, still inside the full-bleed band: the resolved track against the
    // column, the grid's own scrollable width against its box, and every
    // stacked item — the picture first — inside the column's edges.
    const tracks = gridStyle.gridTemplateColumns.split(' ');
    await expect(tracks).toHaveLength(1);
    await expect(parseFloat(tracks[0])).toBeLessThanOrEqual(column.width + 0.5);
    await expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth);
    for (const item of [pictureBox, pairBox, credoBox]) {
      await expect(item.left).toBeGreaterThanOrEqual(column.left - 0.5);
      await expect(item.right).toBeLessThanOrEqual(column.right + 0.5);
    }
    // THE PAIR CENTRED: each line's box on the column's centre, and each
    // line's own text centred ON THE ELEMENT (§15.15 b) — a wrapped
    // specialty at 320 centres line by line, wrapping as it always did (D62's
    // balancing is the step's alone).
    const middle = (column.left + column.right) / 2;
    for (const line of [specialty, name]) {
      const box = line.getBoundingClientRect();
      await expect(
        Math.abs((box.left + box.right) / 2 - middle),
      ).toBeLessThanOrEqual(1);
      await expect(getComputedStyle(line).textAlign).toBe('center');
      await expect(getComputedStyle(line).textWrapStyle).toBe('auto');
    }
    // The figure centred in the column (capped at 20rem) — and at every
    // phone width, where the column is narrower than that cap, filling it.
    await expect(
      Math.abs(
        pictureBox.left - column.left - (column.right - pictureBox.right),
      ),
    ).toBeLessThanOrEqual(1);
    if (column.width <= 20 * rem()) {
      await expect(Math.abs(pictureBox.left - column.left)).toBeLessThanOrEqual(
        1,
      );
    }
    // The card across the whole column (a stretched grid item).
    await expect(Math.abs(credoBox.left - column.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(credoBox.right - column.right)).toBeLessThanOrEqual(
      1,
    );
    return;
  }

  // At the step — BESIDE, D62's two containers ("one big container … in it
  // there are another 2 containers"), spaced by D63 and standing on D64's
  // one floor. The words' container is a flex column.
  const wordsBox = words.getBoundingClientRect();
  await expect(getComputedStyle(words).display).toBe('flex');
  await expect(getComputedStyle(words).flexDirection).toBe('column');
  // D63 · THE SPACING, read off the column — `cqi` resolves against
  // ui/Container, whose border box IS the column: the inset before the
  // picture (15 % of the gutter, capped at 1.875rem), the picture's ONE
  // width (a third), the gap (a sixth, clamped to 3rem–10.5rem), and the
  // words in the rest, to the column's right edge. Never assumed from the
  // pinned width.
  const cutout = picture.querySelector('img');
  if (!cutout) throw new Error('DoctorIntro story: the cutout is missing');
  const inset = Math.min(0.01875 * column.width, 1.875 * rem());
  // A third of the column, never wider than the cutout's own file (D63).
  const third = thirdOf(column.width, cutout);
  // The clamp's 3rem floor never binds from the step up (a sixth of a 48rem
  // column is 8rem) and the inset's 1.875rem cap only past a ~2030px window,
  // which no sampled width reaches — both spelled as the class spells them,
  // and the class itself is pinned token for token by the unit suite.
  const gap = Math.min(Math.max(3 * rem(), column.width / 6), 10.5 * rem());
  await expect(
    Math.abs(parseFloat(gridStyle.paddingLeft) - inset),
  ).toBeLessThanOrEqual(0.5);
  await expect(
    Math.abs(parseFloat(gridStyle.columnGap) - gap),
  ).toBeLessThanOrEqual(0.5);
  await expect(
    Math.abs(pictureBox.left - column.left - inset),
  ).toBeLessThanOrEqual(1);
  // The picture's THIRD — or less, where the words' `auto` floor claims the
  // difference (DoctorIntro.tsx's THE STACKED TRACK paragraph): checked
  // below, once the pair is measured, that only an unbreakable run did.
  await expect(pictureBox.width).toBeLessThanOrEqual(third + 1);
  await expect(
    Math.abs(wordsBox.left - pictureBox.right - gap),
  ).toBeLessThanOrEqual(1);
  await expect(Math.abs(wordsBox.right - column.right)).toBeLessThanOrEqual(1);
  // THE ROW is the grid's content box, and D64's ONE FLOOR: both containers
  // span it top to bottom, and it is the TALLER of the words and the picture
  // at its third (the picture's container never falls under that height).
  const gridBox = grid.getBoundingClientRect();
  const rowTop = gridBox.top + parseFloat(gridStyle.paddingTop);
  const rowBottom = gridBox.bottom - parseFloat(gridStyle.paddingBottom);
  await expect(rowBottom - rowTop).toBeGreaterThan(0);
  for (const box of [pictureBox, wordsBox]) {
    await expect(Math.abs(box.top - rowTop)).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.bottom - rowBottom)).toBeLessThanOrEqual(1);
  }
  const proportion = proportionOf(cutout);
  await expect(pictureBox.height).toBeGreaterThanOrEqual(
    third / proportion - 1,
  );
  // THE CUTOUT — "separated as asset … adjust height wise": out of flow,
  // as tall as its container (the row), as wide as its proportion makes
  // that up to 1.4 × the third, centred on the third, its bottom on the
  // floor the words stand on — and never reaching them.
  const drawn = cutout.getBoundingClientRect();
  await expect(getComputedStyle(cutout).position).toBe('absolute');
  await expect(getComputedStyle(cutout).objectPosition).toBe('50% 100%');
  await expect(Math.abs(drawn.height - pictureBox.height)).toBeLessThanOrEqual(
    1,
  );
  await expect(
    Math.abs(
      drawn.width -
        Math.min(pictureBox.height * proportion, 1.4 * pictureBox.width),
    ),
  ).toBeLessThanOrEqual(1);
  await expect(Math.abs(drawn.bottom - rowBottom)).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(
      (drawn.left + drawn.right) / 2 - (pictureBox.left + pictureBox.right) / 2,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(drawn.right).toBeLessThan(wordsBox.left);
  // THE TOP CONTAINER: the pair on the words' left edge 1.5rem in — the ONE
  // left edge it shares with the card (D64) — as wide as what that leaves
  // ("way wider"), a ninth of the column under the row's top (D64's spelling
  // of D63's quarter of the picture); both lines start-aligned ("sticky to
  // left side"), never past the right edge, and balanced when they wrap.
  const edge = wordsBox.left + 1.5 * rem();
  await expect(Math.abs(pairBox.left - edge)).toBeLessThanOrEqual(1);
  if (pictureBox.width < third - 1) {
    // THE GIVE: the picture's track yielded, which only the words' floor —
    // their longest unbreakable run — can make it do, so a line of the pair
    // now fills the pair's room edge to edge.
    const widest = Math.max(...[name, specialty].flatMap(lineWidthsOf));
    await expect(widest).toBeGreaterThanOrEqual(pairBox.width - 1);
  }
  await expect(Math.abs(pairBox.right - wordsBox.right)).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(pairBox.top - rowTop - column.width / 9),
  ).toBeLessThanOrEqual(1);
  for (const line of [specialty, name]) {
    const box = line.getBoundingClientRect();
    await expect(getComputedStyle(line).textAlign).toBe('start');
    await expect(getComputedStyle(line).textWrapStyle).toBe('balance');
    await expect(Math.abs(box.left - edge)).toBeLessThanOrEqual(1);
    await expect(box.right).toBeLessThanOrEqual(wordsBox.right + 1);
  }
  // THE BOTTOM CONTAINER: everything under the pair, down to the row's
  // floor; the card on the same left edge, 36rem wide where the words leave
  // that much and their whole width where they do not (D63); and the card —
  // with a slot under it, if any — CENTRED in that height: the same space
  // above as below ("same space between it and headings and eyebrow
  // contianer as to bottom of container it is within"), never under 1.5rem,
  // and exactly 1.5rem wherever the words, not the picture, set the row.
  const philosophyBox = philosophy.getBoundingClientRect();
  await expect(getComputedStyle(philosophy).display).toBe('grid');
  await expect(
    Math.abs(philosophyBox.top - pairBox.bottom),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(philosophyBox.bottom - wordsBox.bottom),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(credoBox.width - Math.min(36 * rem(), wordsBox.right - edge)),
  ).toBeLessThanOrEqual(1);
  await expect(Math.abs(credoBox.left - edge)).toBeLessThanOrEqual(1);
  const last = (
    philosophy.lastElementChild as HTMLElement
  ).getBoundingClientRect();
  const above = credoBox.top - pairBox.bottom;
  const below = rowBottom - last.bottom;
  await expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
  await expect(above).toBeGreaterThanOrEqual(1.5 * rem() - 0.5);
  if (!pictureSetsTheRow(band))
    await expect(Math.abs(above - 1.5 * rem())).toBeLessThanOrEqual(1);
};

/**
 * THE EVERYDAY OPENER — the doctor page's first screen, Romanian, at the
 * laptop width the §13 matrix samples, in D62's two containers across the
 * whole column (the owner, 2026-10-01: "one big container … in it there are
 * another 2 containers"), spaced by D63 and standing on D64's one floor: the
 * cutout centred on the picture's third, as tall as the row and standing
 * where the words end; beside it the specialty over the name a ninth of the
 * column down — the name on ONE line (the play's pin) — and under them the
 * rest of the height, where the credo card stands up to 36rem wide on the
 * name's own left edge with the SAME space above it as below it.
 *
 * **What to look at (round 2): the framed card UNDER THE NAME** — the reviews
 * deck's idle card (its 3px lavender frame on white) in the Header pill's
 * lavender glow (ui/Card's `aura`, D61 — the owner's "add an aura around the
 * filozofia mea card", 2026-09-26), holding the eyebrow
 * „În cuvintele mele" over the title „Filozofia mea" and the doctor card's own
 * words in Romanian quotation marks („…”), with „ortodonție" and
 * „ascultarea" in the darker key-word ink. It fills the space beside the
 * figure that the name alone used to leave empty, JUSTIFIED like the roster
 * card's quote (D22) and one type step larger than it (D43b: the quote
 * `text-xl`) — narrower and taller since round 2k (D51b's 28rem), and since
 * D63 up to 36rem again, the owner's "like 30% wider", its title on the
 * `band` step's 36px wherever the card is ~498px or wider (§15.24). The
 * band's rhythm is round 2j's (D43a: 40px above the row at this width),
 * untouched by D51 and D62–D64.
 *
 * **1536 · 390 · 320 (`stress-320`):** the split, the stack, and the stack at
 * the accessibility width, where 256px of column has to hold a 900×1200 figure,
 * a 32px name with hyphenation switched off and the framed card in its glow
 * (the 32px gutter at 320 holds the glow's ~24px sideways reach) — the stack
 * now reading name and specialty CENTRED on top, then the figure, then the
 * card (D51c). The play
 * reads back what a picture cannot: that the name really is the page's `<h1>`
 * and the credo its only `<h2>`, that the cutout is decorative (no `img` role
 * at all — `alt=""` is the decision), that the band is a GENERIC section whose
 * one region is the card, that the card's quote marks are generated and its
 * words justified in the doctor quotes' faint ink (D58), and that its eyebrow
 * and the specialty are ONE size
 * (D43c — the owner read the card's as larger; the engine says otherwise).
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    await picturesSettled(canvasElement);
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: 'Dr. Elena Marin',
    });
    await realFace(heading);
    const band = bandOf(heading);

    const eyebrow = canvas.getByText('Medic specialist ortodonție');
    await expect(eyebrow).toBeVisible();
    // THE PAIR READS ONE WAY AND PAINTS THE OTHER (G2 a11y, 2026-09-21): the
    // <h1> is FIRST in the DOM — so H lands on the doctor's name and the
    // qualification is the next line read — while `flex-col-reverse` puts the
    // eyebrow above it on screen. Only this tier can prove the second half:
    // the unit suite has no stylesheet, so it pins the DOM order alone.
    await expect(
      heading.compareDocumentPosition(eyebrow) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(eyebrow.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      heading.getBoundingClientRect().top,
    );
    // Decorative by construction: there is no `img` role to query, so the
    // element is reached the only way it can be.
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvasElement.querySelector('img')).toHaveAttribute('alt', '');

    // THE CREDO CARD (D12): the band names nothing, so the ONE region in the
    // frame is the card, named by its own <h2> — the page's second heading.
    const credo = await credoOf(canvasElement, 'Filozofia mea', 'ortodonție');
    const regions = canvas.getAllByRole('region');
    await expect(regions).toHaveLength(1);
    await expect(regions[0]).toBe(credo);
    await expect(credo).not.toBe(band);
    await expect(
      canvas.getAllByRole('heading').map((element) => element.tagName),
    ).toEqual(['H1', 'H2']);
    const label = within(credo).getByText('În cuvintele mele');
    await expect(label).toBeVisible();
    // D43c: the card's label and the specialty are ONE size, by the engine's
    // own numbers.
    await expectEyebrowsMatch(eyebrow, label);
    // What only a stylesheet can prove: the marks are GENERATED around the
    // words (ReviewCard's recipe — the language's own glyphs from
    // `quotes: auto`), the words are JUSTIFIED (the owner's word, 2026-09-25 —
    // D12 amended; §15.1's third per-element exception), and
    // they are prose, so the site-wide hyphenation reaches them (§15.14).
    const words = within(credo).getByRole('blockquote')
      .firstElementChild as HTMLElement;
    await expect(getComputedStyle(words, '::before').content).toBe(
      'open-quote',
    );
    await expect(getComputedStyle(words, '::after').content).toBe(
      'close-quote',
    );
    await expect(getComputedStyle(words).textAlign).toBe('justify');
    await expect(getComputedStyle(words).hyphens).toBe('auto');
    // D58 (round 2o, the owner: "what if you make the faint text lighter"):
    // the two doctor quotes share --ink-faint #766f69 — resolved by the real
    // stylesheet, which the unit suite cannot load. A utility that generated
    // no CSS would leave the inherited ink here, never this value.
    await expect(getComputedStyle(words).color).toBe('rgb(118, 111, 105)');

    // The one-line pin FIRST: it waits for the real face, so every
    // measurement after it reads the layout the visitor gets.
    await expectNameOnOneLine(band, heading);
    await expectArrangement(band, credo);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE EVERYDAY OPENER AT 1280 — PLAY ONLY. `Default` at §7's Notebook width,
 * tagged `no-visual` so the pixel net never photographs it (the Sections/*
 * matrix samples 390 + 1536; tests/visual/stories.spec.ts skips the tag): it
 * exists because the Vitest storybook project honours the viewport pin, and
 * 1280 is the narrowest laptop the §7 matrix samples: the picture's third is
 * at its smallest there and the words are the TALLER container (the demo
 * doctor's pair over a card the 36rem track cannot reach), so it is the width
 * where the WORDS set the row and the cutout GROWS to their floor (D64) — the
 * branch the play asserts outright, so `expectArrangement`'s growth formula
 * is walked at a sampled width. The whole Default play runs here — the
 * arrangement, the eyebrows, the generated quote marks and the one-line pin.
 *
 * PLUS ONE BELT (2026-09-27, DoctorIntro.tsx's THE STACKED TRACK paragraph):
 * the row never holds the grid wider than its box, and the two containers'
 * OUTER edges — the picture's left, the words' right — sit inside the column.
 * D63's inset and tracks fill the column exactly, so at every width this is
 * the edge the arrangement already pins; the picture's zero floor and the
 * words' `auto` one (never under their longest unbreakable run) are what keep
 * it true from the step up, where no frame and no play look. The
 * GROWN cutout spills past its track (D64) — into the inset and the gap, out
 * of flow — and the grid still scrolls nowhere: a box out of flow that
 * crosses the grid's start edge adds nothing a scrollbar could reach. This
 * pin is there so that a track edit which makes the row outgrow the column at
 * a sampled width fails a play instead of landing in a baseline.
 */
export const Notebook: Story = {
  ...Default,
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'notebook' } },
  play: async (context) => {
    await Default.play?.(context);

    const band = bandOf(
      context.canvas.getByRole('heading', {
        level: 1,
        name: 'Dr. Elena Marin',
      }),
    );
    const containerBox = band.firstElementChild as HTMLElement;
    const grid = containerBox.firstElementChild as HTMLElement;
    const column = containerBox.getBoundingClientRect();
    const { picture, words } = boxesOf(band);
    // Never vacuous: the belt is about the ROW, so the row must be on — and
    // at this width the WORDS set it, so the cutout has grown (D64).
    await expect(sitsBeside(band)).toBe(true);
    await expect(pictureSetsTheRow(band)).toBe(false);
    await expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth);
    await expect(picture.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      column.left - 0.5,
    );
    await expect(words.getBoundingClientRect().right).toBeLessThanOrEqual(
      column.right + 0.5,
    );
  },
};

/**
 * THE EVERYDAY OPENER AT 1920 — PLAY ONLY, `no-visual` like `Notebook`, at
 * §7's Desktop width: the OTHER branch of D64's one floor. Here the picture
 * at its third (507 × 676px on a 1920 window's column under a classic
 * scrollbar) is taller than the words — the demo doctor's one-line name over
 * a card the 36rem track holds in three lines — so the PICTURE sets the row: the cutout keeps exactly its third and
 * nothing grows, the words' container stretches to the picture's floor, and
 * the card stands centred in the height the name leaves with MORE than the
 * minimum 1.5rem above and below. The whole Default play runs first (the
 * arrangement's own formula covers both branches); this one asserts the
 * branch, so a change that made the words outgrow the picture on a desktop —
 * a taller name step, a narrower track — fails a play instead of moving a
 * frame nobody samples.
 */
export const Desktop: Story = {
  ...Default,
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'desktop' } },
  play: async (context) => {
    await Default.play?.(context);

    const band = bandOf(
      context.canvas.getByRole('heading', {
        level: 1,
        name: 'Dr. Elena Marin',
      }),
    );
    await expect(sitsBeside(band)).toBe(true);
    await expect(pictureSetsTheRow(band)).toBe(true);
    const { picture } = boxesOf(band);
    const cutout = picture.querySelector('img');
    if (!cutout) throw new Error('DoctorIntro story: the cutout is missing');
    // Nothing grew: the cutout is its third, edge to edge.
    await expect(
      Math.abs(
        cutout.getBoundingClientRect().width -
          picture.getBoundingClientRect().width,
      ),
    ).toBeLessThanOrEqual(1);
    // The card has room to spare, and shares it equally (the arrangement
    // checked the equality; the spare room is this branch's own fact).
    const credo = context.canvas.getByRole('region', { name: 'Filozofia mea' });
    const pair = band.querySelector('h1')?.parentElement;
    if (!pair) throw new Error('DoctorIntro story: the name lost its pair');
    await expect(
      credo.getBoundingClientRect().top - pair.getBoundingClientRect().bottom,
    ).toBeGreaterThan(1.5 * rem() + 1);
  },
};

/**
 * AT THE STEP, WITH THE LONGEST NAME — PLAY ONLY, `no-visual` (the Opus a11y
 * review, 2026-10-01): the narrowest column the row ever gets is the step's
 * own, and the words' room is tightest there. The German stress's name and
 * card, beside the picture in a column 4px over 48rem — the band in a
 * 64.25rem wrapper at §7's Notebook viewport, where ui/Container's 10vw
 * margins leave 772px: the Header `AtTheStep` story's device. At this
 * viewport's `hero` step (60.8px) „Schwarzenbeck-" alone is wider than the
 * words' share of that column, so the words' `auto` floor must take what
 * it needs and the PICTURE's track give way (DoctorIntro.tsx's THE STACKED
 * TRACK paragraph) — the play asserts the give itself, then the whole
 * arrangement: every line of the pair inside the words' right edge, which
 * is the column's, and nothing scrolling sideways. Without the floor the
 * name would cross into the gutter; the play turns red on `minmax(0,1fr)`.
 */
export const AtTheStep: Story = {
  tags: ['no-visual'],
  globals: { locale: 'de', viewport: { value: 'notebook' } },
  args: {
    name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    position: 'Fachzahnärztin für Kieferorthopädie',
    photo: CUTOUTS.friederike,
    credo: CREDOS.de,
    lang: 'de',
  },
  render: (args) => (
    <div className="w-[64.25rem]">
      <DoctorIntro {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await picturesSettled(canvasElement);
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    });
    // The REAL face first: the give is a question of the name's width.
    await realFace(heading);
    const band = bandOf(heading);
    const credo = await credoOf(
      canvasElement,
      'Meine Philosophie',
      'Behandlungsschwerpunkte',
    );
    // Never vacuous: the row is on, just past the step…
    const column = (
      band.firstElementChild as HTMLElement
    ).getBoundingClientRect();
    await expect(sitsBeside(band)).toBe(true);
    await expect(column.width).toBeLessThan(49 * rem());
    // …and the picture's track really gave way to the name.
    const { picture } = boxesOf(band);
    await expect(picture.getBoundingClientRect().width).toBeLessThan(
      column.width / 3 - 1,
    );
    await expect(heading.getBoundingClientRect().right).toBeLessThanOrEqual(
      column.right + 1,
    );
    await expectArrangement(band, credo);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE SLOT, FILLED — an OPTION for the owner rather than the page's default:
 * the Hero's own pair of calls to action, in the Hero's own intrinsic row
 * (`flex-wrap` with `*:grow *:basis-64` under a `max-w-3xl` cap — two 16rem
 * bases side by side wherever ~33rem of column exists, each on its own full
 * width below that), AFTER the credo card (D12: pair → card → slot). Face for
 * face with the band at the top of the Home page, which is the point: the
 * doctor page should not invent a third button look. Beside the picture the
 * row shares D62's bottom container with the card — in its track of up to
 * 36rem (D63), where the two 16rem bases sit side by side once the track
 * passes ~33rem (a window of ~1400px and up, this story's 1536 among them)
 * and stack below that — and the card and the row are centred TOGETHER in
 * the height the name leaves.
 *
 * Both are plain `<a href>` wearing ui/Button through `asChild` — every
 * internal navigation on this site is a full document load (§15.13). The
 * fragments are real ones rather than the sketch's bare `#`, because
 * jsx-a11y's `anchor-is-valid` counts `#` as an invalid destination and this
 * repo runs the full recommended rule set (ui/Button's own stories do the
 * same); on the real page they become `localeHref(locale, '/services')` and a
 * ContactModalTrigger.
 *
 * The play proves the slot lands INSIDE the words' column, AFTER the card and
 * OUTSIDE it — a screenshot cannot tell a slot from a sibling band, or from
 * the card's own content.
 */
export const WithActions: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  render: (args) => (
    <DoctorIntro {...args}>
      <div className="flex max-w-3xl flex-wrap gap-3 *:grow *:basis-64">
        <Button variant="solid" size="lg" asChild>
          <a href="#programare">Programează-te</a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#servicii">Vezi serviciile</a>
        </Button>
      </div>
    </DoctorIntro>
  ),
  play: async ({ canvas, canvasElement }) => {
    await picturesSettled(canvasElement);
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: 'Dr. Elena Marin',
    });
    await realFace(heading);
    const band = bandOf(heading);
    const { words } = boxesOf(band);
    const credo = await credoOf(canvasElement, 'Filozofia mea', 'ortodonție');

    const call = canvas.getByRole('link', { name: 'Programează-te' });
    const services = canvas.getByRole('link', { name: 'Vezi serviciile' });
    await expect(words).toContainElement(call);
    await expect(words).toContainElement(services);
    await expect(credo).not.toContainElement(call);
    await expect(
      credo.compareDocumentPosition(call) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(call.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      credo.getBoundingClientRect().bottom,
    );

    await expectArrangement(band, credo);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width,
 * carrying the words this band is most likely to break on: a double-barrelled
 * surname at the fluid `hero` step, `Kieferorthopädie` in a mono eyebrow whose
 * tracking makes every character wider than it looks, and
 * `Behandlungsschwerpunkte` inside the credo's quote, where the card's 25px
 * inset per side leaves the narrowest measure on the page.
 *
 * THE LANGUAGE IS DECLARED TWICE ON PURPOSE, and the two spellings do
 * different jobs. The `locale: 'de'` pin is what the REAL page looks like —
 * .storybook/preview.tsx stamps `<html lang="de">` from it exactly as the
 * shell does (§8.10), and on a German doctor page the band itself carries no
 * `lang` at all. The `lang="de"` prop on the `<section>` is the STORY's belt:
 * it rides the native prop spread (the PersonnelCard and Card.stories
 * precedent) so the frame stays German even when the toolbar is flipped, and
 * it proves the spread reaches the element in the first place.
 *
 * Either way the mechanism is inheritance: `hyphens: auto` (§15.14) would pick
 * the German dictionary here — the name and the specialty wear `hyphens-none`,
 * so their expansion has to be absorbed by WRAPPING, at a space or at the
 * surname's own hyphen, never by a syllable break through a person's name;
 * the quote is prose and may hyphenate. The card's marks turn German („…“)
 * from the same attribute. If anything ever clips at 320, the fix is the
 * page's measure, never a letter-level break in a name.
 *
 * STACKED at its pin — the owner's adaptability rule as D51c reordered it,
 * walked by the play: the name and the specialty CENTRED over the figure
 * (each wrapped line centred on its own element), the card under the figure
 * across the column — and, since 2026-09-27, the grid's ONE track no wider
 * than the column and every stacked item, the picture first, inside it,
 * measured once the cutout has settled (the CI finding on PR #110; the
 * PseudoLocale frame walks the same pin). At 1536 (the visual net's other width) the same play
 * walks the row, where the name is too long for one line of the pair's room
 * at the `hero` step and wraps there, balanced, between words or
 * at the surname's own hyphen — never through a syllable.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    position: 'Fachzahnärztin für Kieferorthopädie',
    photo: CUTOUTS.friederike,
    credo: CREDOS.de,
    lang: 'de',
  },
  play: async ({ canvas, canvasElement }) => {
    await picturesSettled(canvasElement);
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: 'Dr. Friederike Schwarzenbeck-Hoffmann',
    });
    await realFace(heading);
    const band = bandOf(heading);
    const credo = await credoOf(
      canvasElement,
      'Meine Philosophie',
      'Behandlungsschwerpunkte',
    );

    await expect(band).toHaveAttribute('lang', 'de');
    const specialty = canvas.getByText('Fachzahnärztin für Kieferorthopädie');
    await expect(specialty).toBeVisible();
    const label = within(credo).getByText('In meinen Worten');
    await expect(label).toBeVisible();
    await expectEyebrowsMatch(specialty, label);
    await expectArrangement(band, credo);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this band reads none (its strings are props, §8.1). Flipping any
 * other story here to Pseudo changes nothing, which is that sweep PASSING; the
 * expansion stress still has to happen somewhere, and this is it.
 *
 * The strings are the Default ones put through the preview's own transform —
 * the same ACCENT map, the same `·`-padding at 40% of the source length — so
 * what is sampled is the width the real pipeline would produce, not a longer
 * string someone invented. The ONE exception is the credo's quote, which
 * wears the accents without the padding (the `ELENA_PSEUDO_SEGMENTS` note:
 * it is data the toolbar never reaches). The name and the specialty are
 * `hyphens-none`, so their expansion has to be absorbed by wrapping inside a
 * 256px column at the 320 stress width.
 *
 * STACKED at its pin, like the German frame — the play walks the same rule.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    name: 'Dr. Éléñá Máríñ ······',
    position: 'Médíç špéçíálíšť órťódóñțíé ···········',
    credo: CREDOS.pseudo,
  },
  play: async ({ canvas, canvasElement }) => {
    await picturesSettled(canvasElement);
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: 'Dr. Éléñá Máríñ ······',
    });
    await realFace(heading);
    const band = bandOf(heading);
    const credo = await credoOf(
      canvasElement,
      'Fílóžófíá méá ······',
      'órťódóñțíé',
    );

    const specialty = canvas.getByText(
      'Médíç špéçíálíšť órťódóñțíé ···········',
    );
    await expect(specialty).toBeVisible();
    const label = within(credo).getByText('Îñ çúvíñťélé mélé ·······');
    await expect(label).toBeVisible();
    await expectEyebrowsMatch(specialty, label);
    await expectArrangement(band, credo);
    await expectNoSidewaysScroll(band);
  },
};
