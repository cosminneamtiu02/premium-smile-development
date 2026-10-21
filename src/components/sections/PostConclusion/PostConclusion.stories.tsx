import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { unitsOf } from '@/components/sections/PostCard/PostCard.fixtures';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { PostConclusion, type PostConclusionOwnProps } from './PostConclusion';

// Sections/PostConclusion — the doctor's closing words at the end of a blog
// article. SIX stories: the demo article's own conclusion, the longest
// specialty the clinic's doctors carry, the conclusion pinned to a phone and
// to the laptop, the 320 stress width, and its German twin. The export NAMES
// are load-bearing — each names a baseline file — so this list IS the
// section's contribution to a lane's visual manifest. `Sections/*` routes
// every story to 390 + 1536 (tests/visual/stories.spec.ts, §13); the
// 'stress-320' tag adds the accessibility width to LongSpecialty, Stress320
// and GermanStress.
//
// ── THE WORDS AND THE PEOPLE: the demo article's own closing words (its
// JSON's `conclusion`) under the clinic's real doctors as lib/team writes
// them — COPIED here as fixtures, never imported (a story renders a section
// through its props). Romanian with diacritics by default (§15.7); since
// 2026-10-15 an article is written in all five languages and signed in each
// (§15.39 round 4), so German, the longest, is a stress of its own. The
// cutouts are lib/team's demo pictures (900 × 1200, transparent).
//   · Dr. Nicu Elena Alina — the demo article's author, and „Medic
//     specialist în parodontologie": Romanian's widest unbreakable run,
//     „PARODONTOLOGIE", 14 mono capitals, 137.2px (its widest whole word,
//     „DENTO-ALVEOLARĂ", 15, breaks after its hyphen);
//   · Dr. Toma Lucian — the longest specialty, 77 characters over nine words;
//   · Dr. Malea (Sabău) Oana Bianca — the longest name the clinic signs, and
//     „PARODONTOLOGIE" again: the 320 stress carries both at once;
//   · Dr. Ivașcu-Zugravu Cătălina in German — „Fachrichtung
//     Kieferorthopädie": the widest word of any doctor's specialty in any of
//     the five languages, „KIEFERORTHOPÄDIE", 16 mono capitals, 156.8px
//     (161.3 with SC 1.4.12's spacing on) — the word THE BASIS, the narrowest
//     the names' column ever is beside the circle, is sized for
//     (PostConclusion.tsx's THE CIRCLE) — and a surname that breaks only
//     after its own hyphen.
//
// ── THE STAND-IN IS WHAT THE PAGE WRAPS THE CONCLUSION IN (the build
// contract's §2): ui/Container's column, the rhythm box wearing ui/Container's
// two band-scale strings, and the article's 42rem measure — sections/PostPage
// will hand it in exactly so. Not decoration: on a laptop or desktop with a
// mouse the rhythm box redraws every theme length in the band's design pixel,
// so a bare canvas would photograph a conclusion that never scales. The
// plays read THE BAND SCALE where they find themselves (`scaleOf`), never
// from the pinned window.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14), and
// three pin a VIEWPORT for the Vitest storybook project. The visual net
// ignores the pins (it sets its own page size per project), so every play
// DERIVES what it expects from the boxes it measures and asserts a pinned
// width's own facts only when the window really is that width.
//
// ── THE REAL FACES FIRST: Storybook loads Source Serif 4 and JetBrains Mono
// `font-display: block`, so a play that measured before they arrived would
// lay the words out in a fallback (Blog.stories.tsx's `loadFace`, asked here
// for each element by its COMPUTED font). No play waits on a picture: in the
// Vitest run the optimizer's variants do not exist yet, every <img> 404s and
// falls back to its original file, and a play awaiting `decode()` could hang.

/** The demo article's closing words (its JSON's `conclusion`). */
const TEXT =
  'O periuță moale, schimbată la timp și folosită cu răbdare, face mai mult pentru gingiile tale decât orice model scump. Dacă nu știi ce să alegi, adu-ți periuța la următoarea consultație și o alegem împreună.';

type Doctor = PostConclusionOwnProps['doctor'];

/** lib/team's first demo cutout. */
const CUTOUT_1 = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
} as const;

/** lib/team's second demo cutout. */
const CUTOUT_2 = {
  src: '/images/demo/cutout-2.png',
  width: 900,
  height: 1200,
} as const;

/** The demo article's author (lib/blog's first post). */
const NICU = {
  name: 'Dr. Nicu Elena Alina',
  position: 'Medic specialist în parodontologie',
  photo: CUTOUT_1,
} as const satisfies Doctor;

/** The longest specialty the clinic's doctors carry. */
const TOMA = {
  name: 'Dr. Toma Lucian',
  position:
    'Medic specialist în protetică dentară, specializat în endodonție microscopică',
  photo: CUTOUT_2,
} as const satisfies Doctor;

/** The longest name the clinic signs, with „PARODONTOLOGIE". */
const MALEA = {
  name: 'Dr. Malea (Sabău) Oana Bianca',
  position: 'Medic specialist în protetică dentară și parodontologie',
  photo: CUTOUT_1,
} as const satisfies Doctor;

/** The demo article's closing words in German (its JSON's `conclusion`). */
const TEXT_DE =
  'Eine weiche Zahnbürste, rechtzeitig gewechselt und mit Geduld benutzt, tut mehr für Ihr Zahnfleisch als jedes teure Modell. Wenn Sie nicht wissen, welche Sie nehmen sollen, bringen Sie Ihre Zahnbürste zum nächsten Termin mit, dann suchen wir gemeinsam eine aus.';

/** The widest unbreakable run of any doctor's specialty in any language,
 *  „KIEFERORTHOPÄDIE" — lib/team's German words for Dr. Ivașcu-Zugravu. */
const IVASCU_DE = {
  name: 'Dr. Ivașcu-Zugravu Cătălina',
  position: 'Fachrichtung Kieferorthopädie',
  photo: CUTOUT_2,
} as const satisfies Doctor;

/** The page's rhythm box (PostPage wears the privacy page's steps; the top
 *  step is the one a picture of this block needs). */
const RHYTHM = 'py-12';

/** The article's measure, as PostPage spells it. */
const MEASURE = 'mx-auto flex w-full max-w-2xl flex-col';

/** THE STAND-IN (the header's paragraph). */
const Stage = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="bg-page">
    <Container>
      <div className={cx(bandColumnClasses, bandScaleClasses, RHYTHM)}>
        <div className={MEASURE}>{children}</div>
      </div>
    </Container>
  </div>
);

const withStage: Decorator = (Story) => (
  <Stage>
    <Story />
  </Stage>
);

/** The root font size, which every `rem` resolves against — read, never a
 *  baked-in 16. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  the CAP and THE STEP in rem of the root, the step floored at 896px.
 *  Spelled again on purpose: the census holds the source, these hold what
 *  the engine does (PostHeader.stories' idiom). */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** THE CIRCLE's numbers, in spacing steps (PostConclusion.tsx's THE CIRCLE):
 *  its floor and its full size, THE RESERVE it leaves the names wherever it
 *  can still give way, what else the figure keeps beside the names — the
 *  line (1), the air after it (6) and the signature's gap (4) — THE BASIS,
 *  the narrowest the names' column is beside the circle, and that gap again,
 *  the air between the circle and the names wrapped under it. Written out
 *  like the band's. What the plays can catch is narrower than the list: the
 *  pinned widths reach the FLOOR (the runner's 320 frame) and the FULL size
 *  (every other width), and the frame's side of THE BASIS — under it in the
 *  320 frame, beside it everywhere else; RESERVE and AROUND bind only in
 *  figures from 280 to 320px, which no pinned story draws, and the basis's
 *  exact edge (278px) neither — PostConclusion.test.tsx measures both. */
const FLOOR = 18;
const FULL = 28;
const RESERVE = 41;
const AROUND = 11;
const BASIS = 40.5;
const GAP = 4;

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure (a twentieth of a pixel by default: layout rounds to 1/64px). */
const near = async (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.05,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/** The real face an element's text is laid out in, before anything is
 *  measured. */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** The lines an element's text is laid out in — a Range's per-line boxes. */
const linesOf = (element: Element): DOMRect[] => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return [...range.getClientRects()].filter((line) => line.width > 0);
};

/** A layout box, read off the engine. */
const boxOf = (element: Element): DOMRect => element.getBoundingClientRect();

/** The figure's parts — by role where they have one, by structure where
 *  they do not: the caption is the figure's last child, never reached by the
 *  figure's name — HTML-AAM's rule names a figure by its <figcaption>, which
 *  Chromium 151 does not apply (measured 2026-10-20; Firefox and WebKit not
 *  measured; a screen reader still reads the caption inside the figure), and
 *  Testing Library does not apply it either. */
const partsOf = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const figure = canvas.getByRole('figure');
  const quote = within(figure).getByRole('blockquote');
  const children = [...figure.children] as HTMLElement[];
  const caption = figure.lastElementChild as HTMLElement;
  const circle = caption.children[0] as HTMLElement;
  const names = caption.children[1] as HTMLElement;
  const measure = figure.parentElement;
  const rhythm = measure?.parentElement;
  const column = rhythm?.parentElement;
  if (!measure || !rhythm || !column) {
    throw new Error('PostConclusion story: the stand-in lost a box');
  }
  return {
    figure,
    line: children[0] as HTMLElement,
    mark: children[1] as unknown as SVGSVGElement,
    quote,
    words: quote.firstElementChild as HTMLElement,
    caption,
    circle,
    names,
    name: names.children[0] as HTMLElement,
    specialty: names.children[1] as HTMLElement,
    rhythm,
    column,
  };
};

/**
 * THE BAND SCALE, read where the play finds itself: the column off
 * ui/Container, the two gates off the browser — a fine primary pointer, and
 * the relative colour syntax that rides with registered custom properties.
 * Inside the regime every theme length is drawn in the design pixel
 * min(column, 96rem) / 1106, which the rhythm box declares; outside it
 * nothing is declared and a design pixel is the theme's own, a sixteenth of
 * the root (§7).
 */
const scaleOf = async (
  column: HTMLElement,
  rhythm: HTMLElement,
): Promise<{ regime: boolean; unit: number }> => {
  const width = boxOf(column).width;
  const regime =
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    width >= Math.max(STEP_REM * rem(), STEP_FLOOR);
  const unit = regime
    ? Math.min(width, CAP_REM * rem()) / REFERENCE
    : rem() / 16;
  const declared = getComputedStyle(rhythm).getPropertyValue('--scale-px');
  if (regime) {
    await near(parseFloat(declared), unit, 'the design pixel', 0.0001);
  } else {
    // The registered property's initial value: nothing declared it.
    await expect(declared).toBe('1px');
  }
  return { regime, unit };
};

/** The thread's lilac, `--ribbon` #d4cfdc, as the engine computes it. */
const THREAD = 'rgb(212, 207, 220)';

/** What `--card-tint` computes to here — ui/Card's own tint, read off a
 *  probe painted with the variable (an inline style: no class for Tailwind
 *  to find). */
const cardTint = (): string => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--card-tint)';
  document.body.append(probe);
  try {
    return getComputedStyle(probe).backgroundColor;
  } finally {
    probe.remove();
  }
};

/** The widest run of an element's text that no line may break, laid out
 *  alone in the element's own classes — what a line must hold for no word to
 *  be cut. A run ends at a space a line may break at, or right after a
 *  hyphen the word itself carries: `hyphens: none` refuses the breaks a
 *  browser would ADD, never the one a written hyphen offers, so
 *  „Ivașcu-Zugravu" may wrap as „Ivașcu-" over „Zugravu" and is two runs
 *  (measured on the built article). A no-break space JOINS — U+00A0, or the
 *  U+202F French sets before its colon, where a browser never breaks — which
 *  is THE CUT RULE sections/PostCard spells once (PostCard.fixtures.ts's
 *  `unitsOf`), imported rather than spelled a second time. */
const widestWord = (element: HTMLElement): number => {
  const probe = document.createElement('span');
  probe.className = element.className;
  probe.style.position = 'absolute';
  probe.style.whiteSpace = 'nowrap';
  probe.style.visibility = 'hidden';
  element.after(probe);
  try {
    return Math.max(
      ...unitsOf(element.textContent ?? '').map((run) => {
        probe.textContent = run;
        return boxOf(probe).width;
      }),
    );
  } finally {
    probe.remove();
  }
};

/** Nothing may require horizontal scrolling (§7, §9) — the page measured by
 *  the root's own BOX, which ends where a reserved scrollbar gutter begins.
 *  Never by `clientWidth`: in a Vitest runner's frame it is the whole window,
 *  the 15px gutter included, so a check against it lets up to 15px of real
 *  overflow through (DoctorShowcase.stories.tsx's expectNoSidewaysScroll, the
 *  reading its G2 React review measured). */
const expectNoSidewaysScroll = async (): Promise<void> => {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(root.getBoundingClientRect().width),
  );
};

/** WCAG 2.2 SC 1.4.12's four overrides, applied to the figure for the length
 *  of `read` — what a reader's text-spacing tool does to the page: line
 *  height 1.5, letter spacing 0.12em, word spacing 0.16em, 2em after each
 *  paragraph. Taken off again whatever `read` does. */
const withTextSpacing = async <T,>(
  figure: HTMLElement,
  read: () => Promise<T>,
): Promise<T> => {
  const sheet = document.createElement('style');
  sheet.textContent =
    '[data-text-spacing] * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } [data-text-spacing] p { margin-bottom: 2em !important; }';
  figure.dataset.textSpacing = '';
  document.head.append(sheet);
  try {
    return await read();
  } finally {
    sheet.remove();
    delete figure.dataset.textSpacing;
  }
};

/** What a play learned, for the pinned stories' own facts. */
type Reading = {
  regime: boolean;
  unit: number;
  circle: number;
  /** The names beside the circle — false where they wrapped under it. */
  beside: boolean;
  namesColumn: number;
  specialtyLines: number;
};

/**
 * THE CONCLUSION, at whatever width the play finds itself:
 *   · HTML's quotation with its attribution — one <figure>, its <blockquote>
 *     holding the words, its LAST child the <figcaption>; no outline heading
 *     and no image exposed (the mark is hidden, the photo's alt is empty);
 *   · THE LINE down the figure's whole left: from its top to its bottom, one
 *     spacing step wide, the thread's lilac — every other part 6 steps right
 *     of it;
 *   · THE QUOTE MARK: hidden, 12 steps square, the thread's lilac, filled and
 *     turned half a turn, ABOVE the words;
 *   · THE SIGNATURE: the name FIRST in the DOM and painted UNDER the
 *     specialty, both on one left edge; the circle round and as large as THE
 *     CIRCLE's clamp says — 28 steps, giving way to 18 so the names keep 41,
 *     THE RESERVE — on ui/Card's tint, at the caption's start; the names
 *     BESIDE it on a column never narrower than THE BASIS wherever the
 *     caption seats the circle, its gap and the basis, and UNDER it, 4 steps
 *     down and at the caption's whole width, wherever it does not;
 *   · every word of the specialty and of the name WHOLE on its line (THE
 *     BELT idle) and nothing past its box — the specialty, the names, the
 *     caption, the figure — nor the page sideways (§7, §9).
 */
const expectConclusion = async (
  canvasElement: HTMLElement,
  args: PostConclusionOwnProps,
): Promise<Reading> => {
  const canvas = within(canvasElement);
  const parts = partsOf(canvasElement);
  const { figure, line, mark, quote, words, caption, circle, names } = parts;
  const { name, specialty, rhythm, column } = parts;
  for (const element of [words, name, specialty]) await loadFace(element);

  // THE SHAPE.
  await expect(figure.tagName).toBe('FIGURE');
  await expect(caption.tagName).toBe('FIGCAPTION');
  await expect(caption.parentElement).toBe(figure);
  await expect(quote).toHaveTextContent(args.text);
  await expect(canvas.queryAllByRole('heading')).toHaveLength(0);
  await expect(within(figure).queryAllByRole('img')).toHaveLength(0);
  await expect(circle.querySelector('img')).toHaveAttribute('alt', '');

  const { regime, unit } = await scaleOf(column, rhythm);
  const u = 4 * unit;
  const frame = boxOf(figure);

  // THE LINE.
  const bar = boxOf(line);
  await expect(line).toHaveAttribute('aria-hidden', 'true');
  await near(bar.top, frame.top, 'the line’s top', 0.5);
  await near(bar.bottom, frame.bottom, 'the line’s bottom', 0.5);
  await near(bar.left, frame.left, 'the line’s left', 0.5);
  await near(bar.width, u, 'the line’s thickness');
  await expect(getComputedStyle(line).backgroundColor).toBe(THREAD);
  for (const part of [mark, quote, caption]) {
    await near(
      boxOf(part).left,
      bar.right + 6 * u,
      'a part beside the line',
      0.5,
    );
  }

  // THE QUOTE MARK.
  const glyph = boxOf(mark);
  const markStyle = getComputedStyle(mark);
  await expect(mark).toHaveAttribute('aria-hidden', 'true');
  await near(glyph.width, 12 * u, 'the mark’s width');
  await near(glyph.height, 12 * u, 'the mark’s height');
  await expect(glyph.bottom).toBeLessThanOrEqual(boxOf(quote).top + 0.5);
  await expect(markStyle.rotate).toBe('180deg');
  await expect(markStyle.fill).toBe(THREAD);
  await expect(markStyle.color).toBe(THREAD);

  // THE SIGNATURE: the name first in the DOM, painted under the specialty.
  await expect(
    name.compareDocumentPosition(specialty) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await expect(name).toHaveTextContent(args.doctor.name);
  await expect(specialty).toHaveTextContent(args.doctor.position);
  await expect(boxOf(specialty).bottom).toBeLessThanOrEqual(
    boxOf(name).top + 0.5,
  );
  await near(boxOf(specialty).left, boxOf(name).left, 'one left edge', 0.5);
  await expect(getComputedStyle(specialty).textAlign).toBe('start');

  // THE CIRCLE.
  const ring = boxOf(circle);
  const side = Math.min(
    FULL * u,
    Math.max(FLOOR * u, frame.width - (AROUND + RESERVE) * u),
  );
  await near(ring.width, side, 'the circle’s width');
  await near(ring.height, side, 'the circle’s height');
  const ringStyle = getComputedStyle(circle);
  await expect(
    parseFloat(ringStyle.borderTopLeftRadius),
  ).toBeGreaterThanOrEqual(ring.width / 2);
  await expect(ringStyle.overflow).toBe('hidden');
  await expect(ringStyle.backgroundColor).toBe(cardTint());

  // THE NAMES: beside the circle wherever the caption seats the circle, its
  // gap and THE BASIS — on a column never narrower than the basis (THE
  // RESERVE's exactly while the circle gives way) — and under it, at the
  // caption's whole width, wherever it does not. The row's own arithmetic
  // says which, and the layout must agree with it (half a pixel either side
  // of the edge is left to the engine's rounding).
  const signature = boxOf(caption);
  const namesBox = boxOf(names);
  const namesColumn = namesBox.width;
  const beside = namesBox.top < ring.bottom;
  const room = signature.width - ring.width - (GAP + BASIS) * u;
  await near(ring.left, signature.left, 'the circle at the caption’s start');
  if (Math.abs(room) > 0.5) {
    await expect(beside, `the names beside the circle (room ${room})`).toBe(
      room > 0,
    );
  }
  if (beside) {
    await near(
      namesBox.left,
      ring.right + GAP * u,
      'the names beside the circle',
      0.5,
    );
    await expect(namesColumn).toBeGreaterThanOrEqual(BASIS * u - 0.05);
  } else {
    await near(
      namesBox.left,
      signature.left,
      'the names under the circle',
      0.5,
    );
    await near(
      namesBox.top,
      ring.bottom + GAP * u,
      'the air between the circle and the names under it',
      0.5,
    );
    await near(
      namesColumn,
      signature.width,
      'the names at the caption’s whole width',
      0.5,
    );
  }

  // EVERY WORD WHOLE, NOTHING PAST ITS BOX.
  await expect(widestWord(specialty)).toBeLessThanOrEqual(namesColumn + 0.05);
  await expect(widestWord(name)).toBeLessThanOrEqual(namesColumn + 0.05);
  for (const element of [specialty, name, names, caption, figure]) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  }
  for (const box of linesOf(specialty)) {
    await expect(box.right).toBeLessThanOrEqual(boxOf(specialty).right + 0.5);
  }
  await expectNoSidewaysScroll();

  return {
    regime,
    unit,
    circle: ring.width,
    beside,
    namesColumn,
    specialtyLines: linesOf(specialty).length,
  };
};

const meta = {
  title: 'Sections/PostConclusion',
  component: PostConclusion,
  parameters: { layout: 'fullscreen' },
  decorators: [withStage],
  args: { text: TEXT, doctor: NICU },
  argTypes: {
    text: {
      control: 'text',
      description:
        'The doctor’s closing words — one paragraph in the <blockquote>, start-aligned',
    },
    doctor: {
      control: 'object',
      description:
        'Who said them: the name (a <p> on ui/Heading’s `title` step), the specialty (ui/Eyebrow) and the photo — the transparent cutout under public/images/ with its intrinsic size, cropped into the circle',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the <figure> (§6.8)',
    },
  },
} satisfies Meta<typeof PostConclusion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE DEMO ARTICLE'S CONCLUSION — the owner's screenshot: the thread's lilac
 * line down the left, the large faint “ at the top, the words in the medium
 * weight, and the doctor's round photo beside her name under her specialty.
 * Unpinned: the Vitest run renders it at Storybook's default window (inside
 * THE BAND SCALE when the pointer is fine), the net at 390 and 1536.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectConclusion(canvasElement, args);
  },
};

/**
 * THE LONGEST SPECIALTY — 77 characters over nine words: it WRAPS under the
 * name's column, every word whole, at 320 (the 'stress-320' tag) as at 390
 * and 1536.
 */
export const LongSpecialty: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro' },
  args: { doctor: TOMA },
  play: async ({ args, canvasElement }) => {
    const reading = await expectConclusion(canvasElement, args);
    await expect(reading.specialtyLines).toBeGreaterThan(1);
  },
};

/** ON A PHONE (390, pinned): no band scale — the theme's own sizes — and the
 *  full 112px circle (the figure is over 320px: 351 on a phone, 336 behind
 *  the runner's scrollbar). */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ args, canvasElement }) => {
    const reading = await expectConclusion(canvasElement, args);
    if (window.innerWidth === 390) {
      await expect(reading.regime).toBe(false);
      await near(reading.circle, 112, 'the full circle');
      await expect(reading.beside).toBe(true);
    }
  },
};

/** ON THE LAPTOP (1536, pinned): inside THE BAND SCALE wherever the pointer
 *  is fine — every length the design's × the design pixel, the circle 112
 *  design pixels. */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ args, canvasElement }) => {
    const reading = await expectConclusion(canvasElement, args);
    if (
      window.innerWidth === 1536 &&
      window.matchMedia('(pointer: fine)').matches
    ) {
      await expect(reading.regime).toBe(true);
      await near(reading.circle, 112 * reading.unit, 'the scaled circle');
    }
  },
};

/**
 * THE STRESS, at the 320px accessibility width (§7) — the 'stress-320' tag,
 * and pinned there: the longest name the clinic signs over „PARODONTOLOGIE",
 * Romanian's widest unbreakable run. THE CIRCLE GIVES WAY here — 80px on a
 * real 320 phone, where the names keep THE RESERVE's 164px beside it; behind
 * the runner's 15px scrollbar gutter the figure is 273px, under THE BASIS's
 * 278: the circle sits at its 72px floor and the names WRAP under it, at the
 * caption's whole 245px (until round 2 they shrank to 157px beside it) — and
 * the word stays whole: with a fixed 112px circle it ran 20px past its line
 * (PostConclusion.tsx's THE CIRCLE).
 */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: { doctor: MALEA },
  play: async ({ args, canvasElement }) => {
    const reading = await expectConclusion(canvasElement, args);
    if (window.innerWidth === 320) {
      await expect(reading.circle).toBeLessThan(112);
    }
    // EVERY WORD HOLDS UNDER SC 1.4.12: with the four text-spacing overrides
    // on, every word of the name and the specialty still fits the names'
    // column whole — „PARODONTOLOGIE" being 141.1px — and nothing runs past
    // its box.
    const { figure, caption, names, name, specialty } = partsOf(canvasElement);
    await withTextSpacing(figure, async () => {
      const column = boxOf(names).width;
      await expect(widestWord(specialty)).toBeLessThanOrEqual(column + 0.05);
      await expect(widestWord(name)).toBeLessThanOrEqual(column + 0.05);
      for (const element of [specialty, name, names, caption, figure]) {
        await expect(element.scrollWidth).toBeLessThanOrEqual(
          element.clientWidth,
        );
      }
    });
  },
};

/**
 * THE GERMAN STRESS, at the 320px accessibility width (§7) — the 'stress-320'
 * tag, and pinned there: Dr. Ivașcu-Zugravu's „Fachrichtung
 * Kieferorthopädie", whose „KIEFERORTHOPÄDIE" — 16 mono capitals, 156.8px —
 * is the widest unbreakable run of any doctor's specialty in any of the five
 * languages. The old 144px reserve cut it („KIEFERORTHOPÄD" over „IE" on a
 * real 320 phone, the blog-article lane's reviews, 2026-10-20); THE BASIS's
 * 40.5 steps, 162px — the narrowest the names' column ever is beside the
 * circle — hold it whole. Here the word stands whole on a line of its own
 * under „FACHRICHTUNG", and every run of the name and the specialty is
 * MEASURED in the real face against the basis with SC 1.4.12's four
 * overrides on (161.3px for the word) — the basis itself, never only this
 * frame's column: behind the runner's 15px scrollbar the 320 frame's figure
 * is 273px, under the basis's 278, so here the names wrap under the circle
 * at the caption's whole 245px (until round 2 a 157px column beside it, which
 * held the word at the page's own spacing but not with the overrides on).
 * The surname wraps after its own hyphen.
 */
export const GermanStress: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'stress320' } },
  args: { text: TEXT_DE, doctor: IVASCU_DE },
  play: async ({ args, canvasElement }) => {
    const reading = await expectConclusion(canvasElement, args);
    const u = 4 * reading.unit;
    const { figure, caption, names, name, specialty } = partsOf(canvasElement);
    if (window.innerWidth === 320) {
      await expect(reading.circle).toBeLessThan(112);
      // Two lines, the second the widest word whole: „FACHRICHTUNG" over
      // „KIEFERORTHOPÄDIE" — a third would be THE BELT cutting it.
      await expect(reading.specialtyLines).toBe(2);
    }
    // THE BASIS HOLDS EVERY RUN UNDER SC 1.4.12, in the real face: each run
    // of the specialty and of the name, laid out alone with the four
    // overrides on, no wider than the basis's 40.5 steps — and, as in the
    // Romanian stress, no wider than the names' column this frame draws, and
    // nothing past its box.
    await withTextSpacing(figure, async () => {
      const column = boxOf(names).width;
      for (const element of [specialty, name]) {
        await expect(widestWord(element)).toBeLessThanOrEqual(BASIS * u + 0.05);
        await expect(widestWord(element)).toBeLessThanOrEqual(column + 0.05);
      }
      for (const element of [specialty, name, names, caption, figure]) {
        await expect(element.scrollWidth).toBeLessThanOrEqual(
          element.clientWidth,
        );
      }
    });
  },
};
