import { cleanup, render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { userEvent as realUser } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
// The REAL stylesheet and, below, the REAL face: a caption word's width is
// the typeface's, at the size the caption computes, on the line its card
// gives it — and which step the caption takes, and whether its dot is drawn,
// is the engine's answer to the card's own container query. Nothing a class
// string or a character count can answer.
import '@/styles/globals.css';
import type { CardCarouselLabels } from '@/components/sections/CardCarousel/CardCarousel';
// A TEST reads the carousel's geometry (the gallery itself composes only
// CardCarousel's public component, §4) — PostGallery.test.tsx's precedent.
import { ARRANGEMENTS } from '@/components/sections/CardCarousel/conveyor';
import { locales, type Locale } from '@/i18n/locales';
import { GalleryCard } from './GalleryCard';
import { PostGallery } from './PostGallery';
import {
  captionDotShown,
  captionLine,
  captionUnits,
  captionUnitsAcrossLines,
} from './PostGallery.fixtures';

// sections/PostGallery — EVERY CAPTION WORD THE ARTICLES SHIP FITS THE
// NARROWEST CAPTION LINE THE GALLERY DRAWS, in each of the five languages,
// MEASURED — AND NO CAPTION IS LAID OUT WITH A WORD ON TWO LINES.
//
// ── WHY (2026-10-15, found by the German translation; again 2026-10-16,
// found by the wheel). The caption never hyphenates (`hyphens-none`, the
// short-label rule) and wears the `wrap-anywhere` belt, so a word wider than
// its whole line is cut at a letter, with no hyphen. MEASURED (Chromium, the
// real face, weight 500), before GalleryCard's THE CAPTION NEVER SPLITS A
// WORD: at 18px the Romanian „Instrumentele" 118.5px and the German
// „Wartezimmer" 114.2px, against a 116.4px line on a 320 phone (a 164.4px
// card less 2 × 16px of padding, the 8px dot and its 8px gap) and a 107.8px
// one behind a classic scrollbar (155.8px). THE NARROW STEP (16px words, 12px
// a side) gave them room; THE DOT STEP (no dot under 8.5 of the caption's
// ems) gave the wheel's narrower window room the next day. Since 2026-10-17
// an article's gallery is the carousel's THREE-card window on its line alone,
// 1.7521 card widths (PostGallery.tsx's THREE CARDS, ALWAYS): its narrowest
// card from §7's 320 up is 155.8px, on the narrow step WITH the dot. The dot
// step stays for a larger default font (GalleryCard.tsx's THE LINE ALONE has
// the arithmetic), and this file holds it there, at 18px.
//
// ── WHERE THE LINES ARE NARROWEST (GalleryCard.tsx's paragraph of that name
// has the numbers). The card is sections/CardCarousel's three-card card: the
// measure ÷ 1.7521, under a 20rem cap, in THE BAND SCALE's design pixel on a
// laptop (§15.32), for the article wears it. The caption takes ONE of three
// steps, decided by the card's own width in the caption's own ems:
//   · THE NARROW STEP (8.5em to 10em — 153 to 180px at the default root):
//     16px words, 12px a side and the dot — a line of the card less 40px. From
//     §7's 320 up its narrowest is §7's narrowest window behind a classic
//     scrollbar — a 320 window less 15px less ui/Container's 1rem a side, a
//     273px measure — a 155.8px card, a 115.8px line (124.4 on a 320 phone, a
//     164.4px card). At any root its narrowest is its own threshold: a 153px
//     card, a 113px line — what a ≈300px window draws (≈315 behind a
//     scrollbar), as do a zoomed phone and a larger default font;
//   · THE DOT STEP (under 8.5em): the narrow step's words and padding, no dot
//     and no gap — a line of the card less 24px. No card from 320 up at the
//     default root; at an 18px default font a 320 phone draws it (a 162.1px
//     card, 8.0 of its 20.25px ems);
//   · THE CAPTION STEP (from 10em): 18px words and 16px of padding, a line of
//     the card less 48px. Its narrowest card is the threshold itself — 180px,
//     a 132px line — which phones draw at ≈350px;
//   · INSIDE THE BAND SCALE: every length in design pixels, and the card is
//     320 of them at every width — 17.8 of its ems, the CAPTION step with its
//     dot — so the narrowest is the scale's step, s = 896 / 1106: a 259.2px
//     card, a 220.4px line. THE QUERIES READ THE CARD'S OWN EM: there 10 of
//     the card's 14.6px ems are 145.8px, where a rem threshold would read 180
//     CSS px — no three-card card comes near either, and a card made that
//     narrow on purpose shows which one the caption reads.
// No window under 320 is drawn here (§7's floor): below it, and under SC
// 1.4.12's spacing or a larger default font, a word wider than its line is
// the belt's (GalleryCard.tsx's THE SECOND; PostGallery.test.tsx's belt case
// holds it). The one larger default font drawn here, 18px, is THE DOT STEP's
// teeth: it shows the step is still what keeps „Instrumentele" whole there.
//
// ── HOW. Each card width is the ENGINE's — the real gallery laid out in the
// measure of that window, its first card box's computed width — but for the
// thresholds, cards of exactly 8.5em and 10em (and a hair under each). The
// captions are read off the article files AS DATA
// (src/content/blog/articles/*.json, every gallery card's
// `words.<locale>.caption`), never through lib/blog-article: the files are
// what ships, and a reader changing its shape fails here by name. Each
// caption is then set on its own GalleryCard of that width, under its
// language's `lang`, the face loaded; a caption's line is read off its
// computed box (PostGallery.fixtures.ts's `captionLine`, which counts the dot
// only while it is drawn) and each unit's natural width off a Range while the
// caption is held on one line. A unit is PostCard's (its fixtures'
// `unitsOf`): the text between two breakable spaces, once more after a
// written hyphen. Laid out again, wrapping, on every card here, no unit may
// stand on two lines (`captionUnitsAcrossLines`). The pointer is parked off
// the cards first — the house's rule — though nothing here answers a hover.

/** The runner's root, which every rem here is written at (the premise). */
const ROOT = 16;

/** A larger default font, the one THE DOT STEP's teeth are shown at — the
 *  root set to it for that one test, and given back. */
const LARGER_ROOT = 18;

/** A classic scrollbar: `vw` counts it, the column loses it. */
const SCROLLBAR = 15;

/** The article's measure, 42rem (sections/PostPage's THE MEASURE). */
const MEASURE = 42 * ROOT;

/** The three-card window's card ratio, from the carousel's own geometry. */
const THREE = ARRANGEMENTS[3].ratio;

/** The card's 20rem cap, in px at this root (CardCarousel.tsx's THE STAGE). */
const CAP = 20 * ROOT;

/** THE BAND SCALE at its step: the column max(56rem, 896px) over its
 *  reference 1106 (ui/Container's THE BAND SCALE). */
const STEP_S = Math.max(56 * ROOT, 896) / 1106;

/** A caption's step (GalleryCard's THE CAPTION NEVER SPLITS A WORD), in px
 *  at this root: its words' size, its padding a side, and its dot. */
type Step = Readonly<{ font: number; pad: number; dot: boolean }>;
const CAPTION_STEP: Step = { font: 18, pad: 16, dot: true };
const NARROW_STEP: Step = { font: 16, pad: 12, dot: true };
const DOTLESS_STEP: Step = { font: 16, pad: 12, dot: false };

/** What the dot and its gap take on a line while the dot is drawn. */
const DOT_AND_GAP = 8 + 8;

/** The two thresholds, in the caption step's ems: under 10 of them the
 *  narrow step (180px), under 8.5 no dot (153px). */
const THRESHOLD = 10 * CAPTION_STEP.font;
const DOT_THRESHOLD = 8.5 * CAPTION_STEP.font;

/** The line a step leaves on a `card` px card, at a design pixel `s`. */
const lineOn = (card: number, step: Step, s = 1): number =>
  card - (2 * step.pad + (step.dot ? DOT_AND_GAP : 0)) * s;

/** The card the carousel draws in a `measure` px wide gallery, at a design
 *  pixel `s` (the header's WHERE): the three-card card under its cap. */
const cardIn = (measure: number, s = 1): number =>
  Math.min(CAP * s, measure / THREE);

/** ui/Container's column at a phone's window (§15.35): the window less any
 *  scrollbar less the gutter a side — 5vw, never under 1rem, at a `root` px
 *  default font. */
const columnAt = (viewport: number, scrollbar: number, root = ROOT): number =>
  viewport - scrollbar - 2 * Math.max(root, 0.05 * viewport);

/** A card of the gallery and the step its caption must take there: its width
 *  either the ENGINE's — the gallery in a window's measure, at a design pixel
 *  `s` inside THE BAND SCALE — or a fixed one. */
type FrameBase = Readonly<{ name: string; step: Step; s?: number }>;
type EngineFrame = FrameBase & Readonly<{ measure: number }>;
type FixedFrame = FrameBase & Readonly<{ card: number }>;
type Frame = EngineFrame | FixedFrame;

const isEngineFrame = (frame: Frame): frame is EngineFrame =>
  'measure' in frame;

// ── THE FRAMES (the header's WHERE), the narrowest first.

/** THE NARROW STEP's narrowest card from §7's 320 up: §7's narrowest window
 *  behind a classic scrollbar, its dot drawn (8.66 of its ems). */
const NARROWEST: EngineFrame = {
  name: 'a 320 window behind a classic scrollbar',
  step: NARROW_STEP,
  measure: columnAt(320, SCROLLBAR),
};

/** The same, on a 320 phone. */
const PHONE_320: EngineFrame = {
  name: 'a 320 phone',
  step: NARROW_STEP,
  measure: columnAt(320, 0),
};

/** THE NARROW STEP's narrowest card at any root: its own threshold, 8.5em —
 *  no window from 320 draws it at the default root; one under 320, a zoomed
 *  phone or a larger default font does. */
const AT_THE_DOT: FixedFrame = {
  name: 'a card of exactly 8.5em, the dot’s threshold',
  step: NARROW_STEP,
  card: DOT_THRESHOLD,
};

/** THE CAPTION STEP's narrowest card: the threshold itself — phones draw it
 *  at ≈350px. */
const AT_THE_THRESHOLD: FixedFrame = {
  name: 'a card of exactly 10em, the threshold',
  step: CAPTION_STEP,
  card: THRESHOLD,
};

/** THE BAND SCALE's narrowest card: the scale's step, on the caption step
 *  (17.8 of its ems). */
const SCALED: EngineFrame = {
  name: 'THE BAND SCALE at its step',
  step: CAPTION_STEP,
  s: STEP_S,
  measure: MEASURE * STEP_S,
};

/** The narrowest lines of each step, behind a classic scrollbar and without,
 *  and inside the band scale (the header's WHERE). */
const NARROWEST_LINES: readonly Frame[] = [
  NARROWEST,
  PHONE_320,
  AT_THE_DOT,
  AT_THE_THRESHOLD,
  SCALED,
];

/** Every card the captions are laid out on: the narrowest lines, a hair
 *  under each threshold, the phones past them, and the card at the article's
 *  measure. */
const FRAMES: readonly Frame[] = [
  ...NARROWEST_LINES,
  {
    name: 'a hair under 8.5em',
    step: DOTLESS_STEP,
    card: DOT_THRESHOLD - 0.5,
  },
  {
    name: 'a hair under 10em',
    step: NARROW_STEP,
    card: THRESHOLD - 0.5,
  },
  {
    name: 'a 360 phone',
    step: CAPTION_STEP,
    measure: columnAt(360, 0),
  },
  {
    name: 'a 390 window behind a classic scrollbar',
    step: CAPTION_STEP,
    measure: columnAt(390, SCROLLBAR),
  },
  {
    name: 'a 390 phone',
    step: CAPTION_STEP,
    measure: columnAt(390, 0),
  },
  {
    name: 'the article’s 42rem measure, unscaled',
    step: CAPTION_STEP,
    measure: MEASURE,
  },
];

// ── THE CAPTIONS, read off the article files as data (the header's HOW).

/** Every article file the blog ships, as its JSON parses — a build-time Vite
 *  transform, so an article added later is read without an edit here; typed
 *  by Next's own declaration, `unknown` per file (page-twins.test.ts's
 *  precedent), and narrowed where it is read. */
const ARTICLE_FILES = import.meta.glob(
  '../../../content/blog/articles/*.json',
  {
    eager: true,
    import: 'default',
  },
);

/** One caption, and where it lives. */
type Caption = Readonly<{ where: string; text: string }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Every gallery caption of every article in `locale`, in file order — each
 * gallery card's `words.<locale>.caption`. Throws by name when a file has no
 * block list, a gallery no card list, or a card no caption in `locale`: the
 * files' shape moved, and this reader must move with it. And when a gallery
 * names a window (`visible`): an article's gallery shows three cards, ALWAYS
 * (PostGallery.tsx), and the lines below are that window's alone.
 */
function captionsIn(locale: Locale): Caption[] {
  const found: Caption[] = [];
  for (const [path, file] of Object.entries(ARTICLE_FILES)) {
    const name = path.split('/').at(-1) ?? path;
    if (!isRecord(file) || !Array.isArray(file.blocks)) {
      throw new Error(`${name}: no "blocks" list — the article's shape moved.`);
    }
    for (const [b, block] of file.blocks.entries()) {
      if (!isRecord(block) || block.type !== 'gallery') continue;
      if (!Array.isArray(block.cards)) {
        throw new Error(`${name} › blocks[${b}]: a gallery with no "cards".`);
      }
      if ('visible' in block) {
        throw new Error(
          `${name} › blocks[${b}]: a gallery that names a window ("visible") — an article's gallery is three cards, always; these lines are that window's.`,
        );
      }
      for (const [c, card] of block.cards.entries()) {
        const where = `${name} › blocks[${b}] › cards[${c}]`;
        const words =
          isRecord(card) && isRecord(card.words)
            ? card.words[locale]
            : undefined;
        const text = isRecord(words) ? words.caption : undefined;
        if (typeof text !== 'string' || text.trim() === '') {
          throw new Error(
            `${where}: no "words.${locale}.caption" — the article's shape moved; read it again here.`,
          );
        }
        found.push({ where, text });
      }
    }
  }
  return found;
}

// ── THE RUNNER: the face, the language, the pointer.

/** The no-break spaces, by name — never typed raw into a test. */
const NBSP = String.fromCodePoint(0xa0);

// The REAL typeface, as PostCard.titles.test.tsx loads it: the declaration
// .storybook/preview-fonts.css makes for Storybook, its URL served from the
// repo's root, `font-display: block` so a fallback is never measured.
const SERIF = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }
`;
let injected: HTMLStyleElement | null = null;
let lang0: string | null = null;
/** The parking box of the running test, once taken. */
let unpark: (() => void) | undefined;

beforeAll(async () => {
  lang0 = document.documentElement.getAttribute('lang');
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet — and a 404 on the
  // subset REJECTS here, loudly.
  await document.fonts.load(`500 1rem "${SERIF}"`);
  await document.fonts.ready;
});

// THE POINTER, PARKED off the cards before each test (PostCard.titles.test's
// parking, KEEP-IN-SYNC): a 2rem box prepended to the body and the REAL
// pointer on it, taken away only after the frame is unmounted.
beforeEach(async () => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  unpark = () => parking.remove();
});

afterEach(() => {
  cleanup();
  unpark?.();
  unpark = undefined;
});

afterAll(() => {
  injected?.remove();
  injected = null;
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.lang = lang0;
});

/** The carousel's words, Romanian (§15.7) — the probe gallery speaks them. */
const LABELS: CardCarouselLabels = {
  region: 'Galerie foto',
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Fotografia anterioară',
  next: 'Fotografia următoare',
  picker: 'Alege fotografia',
};

/** Any photograph will do: the caption is what is measured. */
const PHOTO = {
  src: '/images/demo/gallery-5.jpg',
  alt: 'Prim-plan cu un instrument subțire și o piesă de mână, suspendate pe brațul unității dentare',
} as const;

/** The frame a scaled card stands in: THE BAND SCALE's remap with its design
 *  pixel set INLINE (Heading.test's D-LIT reason — a class only a test reads
 *  ships a dead rule); nothing for an unscaled one. */
const scaleOf = (
  s: number | undefined,
): Readonly<{ className?: string; style: CSSProperties }> =>
  s === undefined
    ? { style: {} }
    : {
        className: 'design-scale',
        style: { '--scale-px': `${s}px` } as CSSProperties,
      };

/** THE ENGINE'S CARD (the header's HOW): the real gallery laid out in the
 *  frame's measure, and its first card's box and caption — read at once, and
 *  a card's pose (the carousel moves both modes by itself) never changes a
 *  box's layout width. Unmounted by the caller (or the file's cleanup). */
function engineCard(
  frame: EngineFrame,
): Readonly<{ card: number; caption: HTMLElement; unmount: () => void }> {
  const scale = scaleOf(frame.s);
  const captions = captionsIn('ro');
  const { container, unmount } = render(
    <div
      className={scale.className}
      style={{ ...scale.style, width: `${frame.measure}px` }}
    >
      <PostGallery
        cards={captions.map((caption) => ({
          image: PHOTO,
          caption: caption.text,
        }))}
        mode="bounded"
        labels={LABELS}
        slideLabels={captions.map(
          (_, index) => `Fotografia ${index + 1} din ${captions.length}`,
        )}
      />
    </div>,
  );
  const box = container.querySelector('[role="group"][aria-roledescription]');
  const caption = box?.querySelector('figcaption');
  if (!(box instanceof HTMLElement) || !(caption instanceof HTMLElement)) {
    throw new Error(`${frame.name}: the gallery drew no card box or caption`);
  }
  return { card: parseFloat(getComputedStyle(box).width), caption, unmount };
}

/** The frame's card width: the engine's, or the fixed one. */
function cardOf(frame: Frame): number {
  if (!isEngineFrame(frame)) return frame.card;
  const { card, unmount } = engineCard(frame);
  unmount();
  return card;
}

/** Each caption on a GalleryCard `card` px wide (inside the frame's scale),
 *  under `locale`'s `lang`, once the face has their words. */
async function renderCaptions(
  locale: Locale,
  captions: readonly Caption[],
  card: number,
  s?: number,
): Promise<HTMLElement[]> {
  document.documentElement.lang = locale;
  const scale = scaleOf(s);
  const { container } = render(
    <div className={scale.className} style={scale.style}>
      {captions.map((caption) => (
        <div key={caption.where} style={{ width: `${card}px` }}>
          <GalleryCard
            image={PHOTO}
            caption={caption.text}
            sizes="(min-width: 44rem) 20rem, 52vw"
          />
        </div>
      ))}
    </div>,
  );
  const elements = [...container.querySelectorAll('figcaption')].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
  for (const element of elements) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
  return elements;
}

/** Each unit of a caption as its card sets it unbroken: the caption held on
 *  one line, a Range per unit, its width — layout, for the card stands
 *  untransformed here (the premise checks it) — then the wrap given back. */
function unitWidths(caption: HTMLElement): { unit: string; width: number }[] {
  caption.style.whiteSpace = 'nowrap';
  try {
    return captionUnits(caption).map(({ unit, range }) => ({
      unit,
      width: range.getBoundingClientRect().width,
    }));
  } finally {
    caption.style.whiteSpace = '';
  }
}

/** The one caption a render drew — or a failure naming what went missing. */
const only = (captions: readonly HTMLElement[]): HTMLElement => {
  const [caption] = captions;
  if (caption === undefined || captions.length !== 1) {
    throw new Error(`expected one caption, found ${captions.length}`);
  }
  return caption;
};

/** One Romanian caption with the widest word the articles ship (§15.7). */
const INSTRUMENTS: readonly Caption[] = [
  { where: 'Instrumentele', text: 'Instrumentele de lucru' },
];

/** The step a caption computes: its words' size, its padding a side, and
 *  whether its dot is drawn. */
const stepOf = (caption: HTMLElement) => {
  const style = getComputedStyle(caption);
  return {
    font: parseFloat(style.fontSize),
    pad: parseFloat(style.paddingLeft),
    padEnd: parseFloat(style.paddingRight),
    dot: captionDotShown(caption),
  };
};

/** What `stepOf` reads for a step at a design pixel `s`. */
const expectedStep = (step: Step, s = 1) => ({
  font: expect.closeTo(step.font * s, 2),
  pad: expect.closeTo(step.pad * s, 2),
  padEnd: expect.closeTo(step.pad * s, 2),
  dot: step.dot,
});

describe('PostGallery — every caption is read off the article files, in all five languages', () => {
  it('finds at least one article and, in each language, a caption on every gallery card — no gallery naming a window', () => {
    expect(Object.keys(ARTICLE_FILES).length, 'article files').toBeGreaterThan(
      0,
    );
    // captionsIn throws by name on a gallery that names a window.
    const counts = locales.map((locale) => captionsIn(locale).length);
    expect(counts[0], 'gallery cards').toBeGreaterThan(0);
    // Every language captions every card: one count, five times.
    expect(
      new Set(counts).size,
      `cards per language: ${counts.join(', ')}`,
    ).toBe(1);
  });
});

describe('PostGallery — where the caption lines are narrowest (the real stylesheet, the real face)', () => {
  it('runs at the 16px root, with the real face', () => {
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the 16px root',
    ).toBe(ROOT);
    expect(document.fonts.check(`500 1rem "${SERIF}"`), SERIF).toBe(true);
  });

  it.each(FRAMES.filter(isEngineFrame))(
    'draws the card the geometry gives, its caption on the step it names — $name',
    (frame) => {
      const s = frame.s ?? 1;
      const { card, caption } = engineCard(frame);

      // The card: the measure ÷ the three-card ratio under the 20rem cap,
      // every rem a design pixel × s.
      expect(card, 'the card box').toBeCloseTo(cardIn(frame.measure, s), 1);

      // The caption, in the real carousel: the step the card's width in its
      // own ems names — the dot with it — and the line that step leaves.
      expect(stepOf(caption), 'the caption’s step').toEqual(
        expectedStep(frame.step, s),
      );
      expect(captionLine(caption), 'the line').toBeCloseTo(
        lineOn(card, frame.step, s),
        1,
      );
    },
  );

  it('measures the narrowest line of each step: 115.8px behind §7’s scrollbar (124.4 on a 320 phone), 113 at the dot’s threshold, 132 on the caption step, and 272 design pixels inside the band scale', () => {
    // THE NARROW STEP from 320 up: behind a scrollbar, over the dot's
    // threshold.
    const narrowest = cardOf(NARROWEST);
    expect(narrowest).toBeCloseTo((320 - SCROLLBAR - 32) / THREE, 1);
    expect(narrowest).toBeCloseTo(155.8, 1);
    expect(narrowest, 'over 8.5 ems: the dot drawn').toBeGreaterThanOrEqual(
      DOT_THRESHOLD,
    );
    expect(lineOn(narrowest, NARROW_STEP)).toBeCloseTo(115.8, 1);
    expect(lineOn(cardOf(PHONE_320), NARROW_STEP)).toBeCloseTo(124.4, 1);
    // …at any root, its own threshold.
    expect(lineOn(DOT_THRESHOLD, NARROW_STEP)).toBe(113);
    // THE CAPTION STEP: its threshold.
    expect(lineOn(THRESHOLD, CAPTION_STEP)).toBe(132);
    // THE BAND SCALE: the card at the cap, in design pixels — 272 of them
    // for the words, 220.4px at the scale's step.
    expect(cardOf(SCALED) / STEP_S).toBeCloseTo(CAP, 1);
    expect(lineOn(cardOf(SCALED), CAPTION_STEP, STEP_S) / STEP_S).toBeCloseTo(
      272,
      1,
    );
  });

  it('switches at the CARD’S OWN ems — the caption step from 10 (180px), the narrow one under it; the dot from 8.5 (153px), gone under it; inside the band scale a card under 180 CSS px but over 10 of its 14.6px ems keeps the caption step', async () => {
    const cases: readonly (readonly [number, Step])[] = [
      [THRESHOLD, CAPTION_STEP],
      [THRESHOLD - 0.5, NARROW_STEP],
      [DOT_THRESHOLD, NARROW_STEP],
      [DOT_THRESHOLD - 0.5, DOTLESS_STEP],
    ];
    for (const [card, step] of cases) {
      const caption = only(await renderCaptions('ro', INSTRUMENTS, card));
      expect(stepOf(caption), `a ${card}px card`).toEqual(expectedStep(step));
      cleanup();
    }

    // A card made narrow on purpose, at the scale's step — no three-card
    // card the gallery draws comes near it (THE BAND SCALE's is 259.2px).
    // A rem threshold would read the caption step's 180 CSS px here — and
    // the dot's 153 — and put this card on the narrow step, dotless; the
    // card's em is the scale's, 18 × s — 145.8px for 10 of them.
    const card = 150;
    expect(card, 'under 180 CSS px').toBeLessThan(THRESHOLD);
    expect(card, 'under 153 CSS px').toBeLessThan(DOT_THRESHOLD);
    expect(card, 'over 10 of its own ems').toBeGreaterThan(
      10 * CAPTION_STEP.font * STEP_S,
    );
    const scaled = only(await renderCaptions('ro', INSTRUMENTS, card, STEP_S));
    expect(stepOf(scaled)).toEqual(expectedStep(CAPTION_STEP, STEP_S));
  });
});

describe('PostGallery — every caption word the articles ship fits the narrowest caption lines (the real face)', () => {
  it.each(locales)(
    'fits every %s caption word on the narrowest lines — no shipped caption leans on the belt',
    async (locale) => {
      const captions = captionsIn(locale);
      const misfits: string[] = [];
      for (const frame of NARROWEST_LINES) {
        const card = cardOf(frame);
        const elements = await renderCaptions(locale, captions, card, frame.s);
        expect(elements).toHaveLength(captions.length);
        for (const caption of elements) {
          // THE PREMISE: drawn at its layout size — no transform here — and on
          // the step the frame names, its dot with it.
          const figure = caption.parentElement;
          if (!figure) throw new Error('a caption with no card');
          expect(figure.getBoundingClientRect().width).toBeCloseTo(card, 1);
          expect(stepOf(caption), frame.name).toEqual(
            expectedStep(frame.step, frame.s),
          );
          const line = captionLine(caption);
          const units = unitWidths(caption);
          expect(units.length).toBeGreaterThan(0);
          for (const { unit, width } of units) {
            expect(width, `„${unit}" set at all`).toBeGreaterThan(0);
            if (width > line) {
              misfits.push(
                `„${unit}" ${width.toFixed(1)}px on a ${line.toFixed(1)}px line — ${frame.name}, in „${caption.textContent?.trim() ?? ''}"`,
              );
            }
          }
        }
        cleanup();
      }
      expect(misfits, 'a caption word wider than its line').toEqual([]);
    },
  );

  it('has teeth — at an 18px default font THE DOT STEP is still what keeps „Instrumentele" whole: a 320 phone’s card is 162.1px, 8.0 of its ems, and with the dot the word would run past its line', async () => {
    // A larger default font, as a reader sets it: the root's own size. The
    // card is a share of the column, which gives up only its two 1rem
    // gutters; the caption's steps are its own ems, and follow the font.
    const root = document.documentElement;
    const before = root.style.fontSize;
    root.style.fontSize = `${LARGER_ROOT}px`;
    try {
      const s = LARGER_ROOT / ROOT;
      const card = cardOf({
        name: `a 320 phone at a ${LARGER_ROOT}px default font`,
        step: DOTLESS_STEP,
        measure: columnAt(320, 0, LARGER_ROOT),
      });
      // The three-card card — the cap is rem too, and far off — under 8.5 of
      // the caption's 20.25px ems.
      expect(card).toBeCloseTo(columnAt(320, 0, LARGER_ROOT) / THREE, 1);
      expect(card).toBeCloseTo(162.09, 1);
      expect(card / (CAPTION_STEP.font * s)).toBeLessThan(8.5);
      const caption = only(await renderCaptions('ro', INSTRUMENTS, card));
      expect(stepOf(caption), 'the dot step, at that font').toEqual(
        expectedStep(DOTLESS_STEP, s),
      );
      // Without the dot the line holds the word…
      const dotless = captionLine(caption);
      expect(dotless).toBeCloseTo(lineOn(card, DOTLESS_STEP, s), 1);
      const [whole] = unitWidths(caption);
      expect(whole?.unit).toBe('Instrumentele');
      expect(whole?.width).toBeLessThan(dotless);
      // …with the dot forced back on — its half rem, and the half rem after
      // it — the word would run past.
      const dot = caption.firstElementChild;
      if (!(dot instanceof HTMLElement)) throw new Error('the dot is missing');
      dot.style.display = 'block';
      expect(captionDotShown(caption), 'the dot, forced back').toBe(true);
      const dotted = captionLine(caption);
      expect(dotted).toBeCloseTo(lineOn(card, NARROW_STEP, s), 1);
      const [widest] = unitWidths(caption);
      expect(widest?.unit).toBe('Instrumentele');
      expect(widest?.width).toBeGreaterThan(dotted);
    } finally {
      root.style.fontSize = before;
    }
  });

  it('has teeth — without THE NARROW STEP, „Instrumentele" would run past the narrowest line', async () => {
    const card = cardOf(NARROWEST);
    const caption = only(await renderCaptions('ro', INSTRUMENTS, card));
    // The caption step, forced back on: 18px words and 16px a side.
    caption.style.fontSize = `${CAPTION_STEP.font}px`;
    caption.style.paddingInline = `${CAPTION_STEP.pad}px`;
    await document.fonts.load(`500 ${CAPTION_STEP.font}px "${SERIF}"`);
    const line = captionLine(caption);
    expect(line).toBeCloseTo(lineOn(card, CAPTION_STEP), 1);
    const [widest] = unitWidths(caption);
    expect(widest?.unit).toBe('Instrumentele');
    expect(widest?.width).toBeGreaterThan(line);
  });
});

describe('PostGallery — no caption word is laid out on two lines (the real face, laid out)', () => {
  it.each(locales)(
    'keeps every word of every %s caption on one line, on every card here — between words the caption breaks; inside one, never',
    async (locale) => {
      const captions = captionsIn(locale);
      const split: string[] = [];
      const steps: string[] = [];
      for (const frame of FRAMES) {
        const card = cardOf(frame);
        const elements = await renderCaptions(locale, captions, card, frame.s);
        expect(elements).toHaveLength(captions.length);
        const s = frame.s ?? 1;
        for (const caption of elements) {
          const step = stepOf(caption);
          if (
            Math.abs(step.font - frame.step.font * s) > 0.01 ||
            Math.abs(step.pad - frame.step.pad * s) > 0.01 ||
            step.dot !== frame.step.dot
          ) {
            steps.push(
              `${step.font}px, ${step.pad}px a side, ${step.dot ? 'a dot' : 'no dot'} — ${frame.name}`,
            );
          }
          for (const unit of captionUnitsAcrossLines(caption)) {
            split.push(
              `„${unit}" in „${caption.textContent?.trim() ?? ''}" — ${frame.name} (${card.toFixed(1)}px)`,
            );
          }
        }
        cleanup();
      }
      expect(split, 'a word laid out on two lines').toEqual([]);
      // The premise: each card on the step it names, so no frame passed on
      // a size — or a dot — it was not meant to have.
      expect(steps, 'a caption on another step').toEqual([]);
    },
  );

  it('has teeth — a word too wide for its line is broken by the belt, and caught', async () => {
    // A 390 phone's card, about 200px: the caption step, a 152px line.
    const caption = only(
      await renderCaptions(
        'de',
        [{ where: 'Wartezimmer', text: 'Das Wartezimmer' }],
        200,
      ),
    );
    expect(captionUnitsAcrossLines(caption), 'on a line it fits').toEqual([]);
    // A caption narrower than the word — 6 of its ems, a 60px line — so
    // only the belt can break it.
    caption.style.width = '6em';
    expect(captionUnitsAcrossLines(caption)).toEqual(['Wartezimmer']);
  });

  it('cuts a caption as a card title is cut — at a space, never at a no-break space (PostCard’s rule, imported)', async () => {
    const caption = only(
      await renderCaptions(
        'fr',
        [{ where: 'joined', text: `La salle d’attente${NBSP}:` }],
        200,
      ),
    );
    expect(captionUnits(caption).map(({ unit }) => unit)).toEqual([
      'La',
      'salle',
      `d’attente${NBSP}:`,
    ]);
  });
});
