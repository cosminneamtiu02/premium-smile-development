import { useId, type ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { PostHeader, type PostHeaderProps } from './PostHeader';

// Sections/PostHeader — the blog article's opener. FIVE photographed stories
// and one play-only: the everyday opener, the long-title stress, the opener
// pinned to a phone, the opener pinned to the laptop, the 320 stress width,
// and the notebook (`no-visual`). The export NAMES are load-bearing — each
// names a baseline file — so this list IS the piece's contribution to a
// lane's visual manifest. `Sections/*` routes every story to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to Narrowest, and 'no-visual' keeps Notebook out of
// the net — its frame would show nothing the Laptop frame does not, and it
// exists for its play: the title SHRINKING below the owner's 1401 reference.
//
// ── THE WORDS: the demo article's own title and the by-line the page builds
// for it (lib/blog's first post, „de {author}" from the blog's messages), in
// Romanian with diacritics (§15.7) — the stress is the language's own long
// words; the article is in all five languages since 2026-10-15, and
// Pages/BlogArticle's German frames photograph its German title. The stress title is
// a story fixture written for the length it needs, plain dental-care wording
// under the CMSR rules every page keeps; its by-line carries the longest name
// the clinic's authors sign.
//
// ── THE STAND-IN IS WHAT THE PAGE WRAPS THE OPENER IN (the build contract's
// §2): an <article> named by the <h1> — its id from React's useId, as
// sections/PostPage will hand it in — then ui/Container's column, then the
// rhythm box wearing ui/Container's two band-scale strings. Not decoration:
// the title's `hero-scaled` step reads ui/Container's column and the design
// pixel the rhythm box declares, so a bare canvas would photograph a title
// that never scales; and inside an <article> the <header> is the article's
// introduction, not a second banner. `layout: 'fullscreen'` keeps
// Storybook's padding out of the column.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14), and
// five pin a VIEWPORT for the Vitest storybook project. The visual net
// ignores the pins (it sets its own page size per project), so every play
// DERIVES what it expects from the boxes it measures — the column, the two
// gates read off the browser — and asserts a pinned width's facts only when
// the window really is that width.
//
// ── THE REAL FACES FIRST: Storybook loads Source Serif 4 and JetBrains Mono
// `font-display: block`, so a play that measured before they arrived would
// lay the words out in a fallback (Blog.stories.tsx's `loadFace`, here asked
// for each of the two elements by its COMPUTED font).

/** The demo article's opener — lib/blog's first post and its by-line. */
const DEMO = {
  title: 'Cum îți alegi periuța de dinți',
  byline: 'de Dr. Nicu Elena Alina',
} as const satisfies Pick<PostHeaderProps, 'title' | 'byline'>;

/** THE STRESS: a title of long Romanian words that wraps to THREE lines in a
 *  phone's column, and the longest name the clinic's authors sign. */
const LONG = {
  title: 'Parodontopatia și îngrijirea gingiilor după detartraj',
  byline: 'de Dr. Malea (Sabău) Oana Bianca',
} as const satisfies Pick<PostHeaderProps, 'title' | 'byline'>;

/** The page's rhythm box, as sections/PostPage wears it (the contract's §2):
 *  a flex column with the privacy policy's top step under the header. */
const RHYTHM = 'flex flex-col gap-12 py-12 @lg:py-16 @3xl:py-20';

/** THE STAND-IN (the header's paragraph): the page's <article>, named by the
 *  <h1> through the id the page hands in, around ui/Container's column and
 *  the rhythm box that wears THE BAND SCALE. */
function ArticleStage(props: PostHeaderProps): ReactElement {
  const generated = useId();
  const titleId = props.titleId ?? generated;
  return (
    <article aria-labelledby={titleId}>
      <Container>
        <div className={cx(bandColumnClasses, bandScaleClasses, RHYTHM)}>
          <PostHeader {...props} titleId={titleId} />
        </div>
      </Container>
    </article>
  );
}

/** The root font size, which every `rem` resolves against — read, never a
 *  baked-in 16. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in rem of the
 *  root, the step floored at 896px. Spelled again on purpose: the census
 *  holds the source, these hold what the engine does (DoctorIntro.stories'
 *  idiom). */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** The title's design size inside the scale — ui/Heading's `hero-scaled`
 *  step: 16.26 spacing steps of four design pixels, the `hero` step's value
 *  at the owner's 1401 window. */
const TITLE_DESIGN_PX = 16.26 * 4;

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

/** An element's computed font size, in px. */
const fontSizeOf = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** One `vw` of THIS window, in px, read off a probe — what `hero`'s clamp
 *  reads, whatever an engine counts into a viewport unit beside a classic
 *  scrollbar (DoctorIntro.stories' `vwOf`). */
const vwOf = (): number => {
  const probe = document.createElement('div');
  probe.style.width = '100vw';
  document.body.append(probe);
  try {
    return probe.getBoundingClientRect().width / 100;
  } finally {
    probe.remove();
  }
};

/** The lines an element's text is laid out in — a Range's per-line boxes,
 *  so a wrapped title counts line by line. */
const linesOf = (element: Element): DOMRect[] => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return [...range.getClientRects()].filter((line) => line.width > 0);
};

/** The words on each line an element's one text node is laid out in — its
 *  characters grouped by the line box each lands in. A space collapsed at a
 *  break draws no box and joins no line; each line is trimmed. The DOM's
 *  own sentence case: the uppercase is CSS. */
const lineTextsOf = (element: Element): string[] => {
  const text = element.firstChild;
  if (!(text instanceof Text)) {
    throw new Error('PostHeader story: expected one text node');
  }
  const range = document.createRange();
  const lines: { top: number; text: string }[] = [];
  for (let index = 0; index < text.length; index += 1) {
    range.setStart(text, index);
    range.setEnd(text, index + 1);
    const box = range.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    const last = lines.at(-1);
    if (last && Math.abs(last.top - box.top) < 1) {
      last.text += text.data[index];
    } else {
      lines.push({ top: box.top, text: text.data[index] ?? '' });
    }
  }
  return lines.map((line) => line.text.trim());
};

/** The real face an element's text is laid out in, before anything is
 *  measured (Blog.stories.tsx's `loadFace`, per element). */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** The stand-in's boxes, reached from the <h1> by structure — none of the
 *  outer ones carries a role: the <header>, the rhythm box, ui/Container's
 *  column. */
const partsOf = (h1: HTMLElement) => {
  const opener = h1.parentElement;
  const rhythm = opener?.parentElement;
  const column = rhythm?.parentElement;
  if (!opener || !rhythm || !column) {
    throw new Error('PostHeader story: the stand-in lost a box');
  }
  return { opener, rhythm, column };
};

/**
 * THE BAND SCALE, read where the play finds itself: the column off
 * ui/Container, the two gates off the browser — a fine primary pointer, and
 * the relative colour syntax that rides with registered custom properties —
 * never the pinned window. Inside the regime every length is drawn in the
 * design pixel min(column, 96rem) / 1106, which the rhythm box declares;
 * outside it nothing is declared and a design pixel is the theme's own, a
 * sixteenth of the root (§7). Returns whether the regime is on and the unit.
 */
const scaleOf = async (
  column: HTMLElement,
  rhythm: HTMLElement,
): Promise<{ regime: boolean; unit: number }> => {
  const width = column.getBoundingClientRect().width;
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

/**
 * WHOLE WORDS (PostHeader's THE TITLE'S FOUR UTILITIES): with hyphenation
 * off, the belt is the only thing that could break a title inside a word —
 * so a title whose lines are the same with the belt lifted broke none. The
 * belt is lifted for one synchronous read and put back before anything
 * paints.
 */
const expectWholeWords = async (h1: HTMLElement): Promise<void> => {
  const shape = (): string =>
    linesOf(h1)
      .map((line) => `${line.left}:${line.width}`)
      .join('|');
  const withBelt = shape();
  h1.style.overflowWrap = 'normal';
  const withoutBelt = shape();
  h1.style.removeProperty('overflow-wrap');
  await expect(withoutBelt, 'the title’s lines without its belt').toBe(
    withBelt,
  );
};

/** What a play learned, for the pinned stories' own facts. */
type Opener = {
  h1: HTMLElement;
  byline: HTMLElement;
  regime: boolean;
  unit: number;
  titleLines: number;
};

/**
 * THE OPENER, at whatever width the play finds itself:
 *   · the page's one heading, an <h1> named by the title, naming the
 *     <article> around it; the by-line a <p> right after it;
 *   · START-ALIGNED — the title's box and every one of its lines on the
 *     <header>'s left edge, and the by-line's box and lines with them
 *     (within 1px; the owner, 2026-10-14);
 *   · its SIZE — inside THE BAND SCALE the title is 65.04 design pixels
 *     (its `hero-scaled` step: the `hero` step at the owner's 1401 window)
 *     and the by-line 14, the gap between them 16 and the title's measure
 *     896, all × the design pixel; outside it `hero`'s own clamp of THIS
 *     window, and the theme's 14px, 16px and 896px;
 *   · whole words — `hyphens: none` on both, the title's belt
 *     (`overflow-wrap: anywhere`) on the title, and no line of the title
 *     the belt made;
 *   · nothing scrolling sideways, the page nor the opener (§7, §9).
 */
const expectOpener = async (
  canvasElement: HTMLElement,
  args: PostHeaderProps,
): Promise<Opener> => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole('heading')).toHaveLength(1);
  const h1 = canvas.getByRole('heading', { level: 1, name: args.title });
  const { opener, rhythm, column } = partsOf(h1);
  await expect(opener.tagName).toBe('HEADER');
  // The by-line by its ROLE, then by its text — ARIA prohibits a
  // paragraph's name (PostHeader.test.tsx's `bylineOf`).
  const byline = within(opener).getByRole('paragraph');
  await expect(byline.textContent).toBe(args.byline);
  await expect(byline.tagName).toBe('P');
  await expect(h1.nextElementSibling).toBe(byline);
  await expect(
    canvas.getByRole('article', { name: args.title }),
  ).toBeInTheDocument();
  await loadFace(h1);
  await loadFace(byline);

  // START-ALIGNED: the boxes, then every line of each, on the <header>'s
  // left edge (the owner, 2026-10-14).
  const start = opener.getBoundingClientRect().left;
  await near(h1.getBoundingClientRect().left, start, 'the title’s box', 1);
  await near(
    byline.getBoundingClientRect().left,
    start,
    'the by-line’s box',
    1,
  );
  const titleLines = linesOf(h1);
  await expect(titleLines.length).toBeGreaterThan(0);
  for (const line of [...titleLines, ...linesOf(byline)]) {
    await near(line.left, start, 'a line’s start', 1);
  }
  await expect(getComputedStyle(h1).textAlign).toBe('start');
  await expect(getComputedStyle(byline).textAlign).toBe('start');
  await expect(getComputedStyle(byline).textTransform).toBe('uppercase');

  // WHOLE WORDS, and the title's belt.
  await expect(getComputedStyle(h1).hyphens).toBe('none');
  await expect(getComputedStyle(byline).hyphens).toBe('none');
  await expect(getComputedStyle(h1).overflowWrap).toBe('anywhere');
  await expectWholeWords(h1);

  // THE SIZE, in or out of THE BAND SCALE.
  const { regime, unit } = await scaleOf(column, rhythm);
  const hero = Math.min(4.5 * rem(), Math.max(2 * rem(), rem() + 3.5 * vwOf()));
  const title = fontSizeOf(h1);
  await near(
    title,
    regime ? TITLE_DESIGN_PX * unit : hero,
    regime ? 'the title, in the design pixel' : 'the title, the hero clamp',
  );
  // `/tight`: the line follows the size, inside the scale as out of it.
  await near(
    parseFloat(getComputedStyle(h1).lineHeight) / title,
    1.25,
    'the title’s line height',
    0.001,
  );
  await near(fontSizeOf(byline), 14 * unit, 'the by-line');
  await near(
    parseFloat(getComputedStyle(h1).maxWidth),
    896 * unit,
    'the title’s measure',
  );
  await near(
    byline.getBoundingClientRect().top - h1.getBoundingClientRect().bottom,
    16 * unit,
    'the gap under the title',
    0.5,
  );

  // NOTHING SIDEWAYS. The page measured by the root's own BOX, which ends
  // where a reserved scrollbar gutter begins — never by `clientWidth`, which
  // in a Vitest runner's frame is the whole window, the 15px gutter
  // included, and so let 10px of real overflow through
  // (DoctorShowcase.stories.tsx's expectNoSidewaysScroll, and its reason;
  // the review, 2026-10-20).
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(root.getBoundingClientRect().width),
  );
  await expect(opener.scrollWidth).toBeLessThanOrEqual(opener.clientWidth);
  await expect(h1.scrollWidth).toBeLessThanOrEqual(h1.clientWidth);

  return { h1, byline, regime, unit, titleLines: titleLines.length };
};

const meta = {
  title: 'Sections/PostHeader',
  component: PostHeader,
  parameters: { layout: 'fullscreen' },
  render: (args) => <ArticleStage {...args} />,
  args: { ...DEMO },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The post’s title — the page’s one <h1>, on ui/Heading’s `hero-scaled` step, start-aligned, and the article’s accessible name',
    },
    byline: {
      control: 'text',
      description:
        'The whole finished by-line („de Dr. …”), in ui/Eyebrow’s mono micro-label, uppercased in CSS',
    },
    titleId: {
      control: false,
      description:
        'The <h1>’s id — the page’s useId, naming its <article>; the stand-in supplies one',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the <header> (§6.8)',
    },
  },
} satisfies Meta<typeof PostHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY OPENER — the demo article's title over its by-line, both on
 * the column's start edge.
 * Unpinned: the Vitest run renders it at the runner's own 1200 (inside THE
 * BAND SCALE behind a mouse), the net at 390 and 1536, and the play proves
 * whichever it is handed.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectOpener(canvasElement, args);
  },
};

/**
 * THE LONG TITLE — long Romanian words that wrap to THREE balanced lines in
 * a phone's column, every line on the start edge, no word split at a
 * syllable, and the longest by-line the clinic signs. Pinned to a phone
 * (390), where the play counts the lines. MEASURED on the 32px floor, the
 * three lines hold in every column from 273 to 375px — the 320 and the 390
 * phone, with a classic scrollbar's 15px or without.
 */
export const LongTitle: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: { ...LONG },
  play: async ({ args, canvasElement }) => {
    const { titleLines } = await expectOpener(canvasElement, args);
    if (window.innerWidth === 390) await expect(titleLines).toBe(3);
  },
};

/**
 * THE PHONE (390) — outside THE BAND SCALE: the title on `hero`'s clamp, its
 * 32px floor at this width, the by-line on the theme's 14px.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ args, canvasElement }) => {
    const { h1, regime } = await expectOpener(canvasElement, args);
    if (window.innerWidth === 390) {
      await expect(regime).toBe(false);
      await near(fontSizeOf(h1), 2 * rem(), 'the title on the phone');
    }
  },
};

/**
 * THE LAPTOP (1536) — inside THE BAND SCALE, past the owner's 1401
 * reference: the title GROWS with the column, 65.04 design pixels × a design
 * pixel over 1, and the by-line and the gap with it.
 */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ args, canvasElement }) => {
    const { h1, regime, unit } = await expectOpener(canvasElement, args);
    if (window.innerWidth === 1536) {
      await expect(regime).toBe(true);
      await expect(unit).toBeGreaterThan(1);
      await expect(fontSizeOf(h1)).toBeGreaterThan(TITLE_DESIGN_PX);
    }
  },
};

/**
 * THE NOTEBOOK (1280) — PLAY ONLY (`no-visual`): inside THE BAND SCALE but
 * under the reference, so the title SHRINKS with the column, 65.04 design
 * pixels × a design pixel under 1 — the other side of the Laptop's growth.
 */
export const Notebook: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'notebook' } },
  play: async ({ args, canvasElement }) => {
    const { h1, regime, unit } = await expectOpener(canvasElement, args);
    if (window.innerWidth === 1280) {
      await expect(regime).toBe(true);
      await expect(unit).toBeLessThan(1);
      await expect(fontSizeOf(h1)).toBeLessThan(TITLE_DESIGN_PX);
    }
  },
};

/**
 * THE 320 STRESS WIDTH (§7) — the long title and the longest by-line in the
 * narrowest column, the 'stress-320' tag, and pinned there: the title on
 * `hero`'s 32px floor in its same three lines, every word whole; the
 * by-line wrapping GREEDILY onto two lines between words — MEASURED in the
 * 273px column behind a classic scrollbar and the 288px one without: „de Dr.
 * Malea (Sabău) Oana" (245px) over „Bianca" (58.8px). Balancing was measured
 * and dropped (PostHeader's THE BY-LINE DOES NOT WEAR IT): it broke
 * „Ivașcu-Zugravu" at its hyphen. Asserted by the words on each line, not
 * their pixels, so the split holds wherever a platform rounds a glyph's
 * advance. Every line on the start edge, and nothing pushing the page
 * sideways.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: { ...LONG },
  play: async ({ args, canvasElement }) => {
    const { h1, byline, regime, titleLines } = await expectOpener(
      canvasElement,
      args,
    );
    if (window.innerWidth === 320) {
      await expect(regime).toBe(false);
      await near(fontSizeOf(h1), 2 * rem(), 'the title at 320');
      await expect(titleLines).toBe(3);
      await expect(linesOf(byline).length).toBe(2);
      // The greedy split — balancing would move the break up to „Malea".
      await expect(lineTextsOf(byline)).toEqual([
        'de Dr. Malea (Sabău) Oana',
        'Bianca',
      ]);
    }
  },
};
