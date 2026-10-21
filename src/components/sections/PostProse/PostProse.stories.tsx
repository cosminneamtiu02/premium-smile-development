import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { PostProse, type PostProseItem } from './PostProse';

// Sections/PostProse — an article's running text. FIVE stories: a run with a
// subheading among paragraphs, a run that opens on a subheading, the first
// pinned to a phone, pinned to the laptop, and at the 320 stress width. The
// export NAMES are load-bearing — each names a baseline file — so this list
// IS the piece's contribution to a lane's visual manifest. `Sections/*`
// routes every story to 390 + 1536 (tests/visual/stories.spec.ts, §13); the
// 'stress-320' tag adds the accessibility width to Narrowest.
//
// ── THE WORDS ARE THE DEMO ARTICLE'S OWN, COPIED (never imported — a story
// holds still while the owner edits his article): src/content/blog/articles/
// cum-iti-alegi-periuta-de-dinti.json, its Romanian words, with diacritics
// (§15.7) — the stress is the language's own long words; the article is in
// all five languages since 2026-10-15, and its German runs are photographed
// in Pages/BlogArticle's German frames. THE TWO ARE EXAMPLE SHAPES, not runs
// the page hands over: since the article holds blog photos its runs are
// shorter — the populator hands over a paragraph, a photo, a subheading with
// two paragraphs, a photo, a subheading with two paragraphs, a gallery, …
// (PostProse.tsx's header). OPENING joins the words of the first three runs
// (the two photos between them left out) into one with a subheading among
// paragraphs; AFTER_GALLERY joins the words after the first gallery (a photo
// and a before/after between them left out) into one that OPENS on a
// subheading — the shape of every run after a picture block. Where the
// article's own subheadings break, in every language, is
// PostProse.subheadings.test.tsx's.
//
// ── THE STAND-IN IS WHAT sections/PostPage WRAPS THE TEXT IN (the build
// contract's §2): ui/Container's column — the page's gutter — and inside it
// the page's 42rem MEASURE, centred. The measure is an INLINE style: its
// class ships with PostPage, and a story must never add a rule nobody wears —
// Tailwind reads class names from every source text, comments included, which
// is why this paragraph does not spell it. `py-12` is the page rhythm's
// shallowest step, ground above and below the text. NOT THE BAND SCALE: these stories draw the text in the
// theme's own sizes at every width (the DoctorCourses precedent for a block
// inside a band) — PostPage's stories show it scaled. `layout: 'fullscreen'`
// keeps Storybook's padding out of the column.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14), and
// three pin a VIEWPORT for the Vitest storybook project. The visual net
// ignores the pins (it sets its own page size per project), so every play
// DERIVES what it expects from the boxes it measures and asserts a pinned
// width's facts only when the window really is that width.
//
// ── THE REAL FACES FIRST: Storybook loads Source Serif 4 `font-display:
// block`, so a play that measured before it arrived would lay the words out
// in a fallback — each element's face is asked for by its COMPUTED font
// (Blog.stories.tsx's `loadFace`), the subheadings' semi-bold included.
//
// ── MEASURED (2026-10-14, the Vitest runner's Chromium, the real faces, the
// theme's own sizes, behind the runner's classic 15px scrollbar, at 320, 390,
// the runner's own 1200 and 1536): every paragraph 18px on a 28px line, every
// subheading 24px on a 32px line at weight 600 — its box 56px tall with its
// 24px of room, 32 without; 16px between every two paragraphs and from every
// subheading down to its paragraph; 40px from a paragraph up to the line of
// the subheading after it (16 of gap, 24 of room), at every one of the four
// widths. The text fills the column on a phone — 273px at 320 and 336 at 390
// (288 and 351 on a phone, which draws no scrollbar) — and the 42rem measure,
// 672px, from a wide window: in a 945px column at 1200, centred in a 1213.8px
// one at 1536. Nothing scrolls sideways anywhere, and THE BELT changes no
// line of the demo article at any of the four.

/** THE OPENING — an example shape: the words of the demo article's first
 *  three runs, joined (the header's paragraph). */
const OPENING = [
  {
    kind: 'paragraph',
    text: 'Periuța de dinți este instrumentul pe care îl folosești de două ori pe zi, în fiecare zi, așa că merită aleasă cu atenție. Pe raft găsești zeci de modele, cu peri de toate felurile, mânere colorate și promisiuni scrise mare pe ambalaj. Vestea bună este că alegerea nu trebuie să fie complicată: câteva lucruri simple contează mult mai mult decât culoarea sau prețul.',
  },
  { kind: 'heading', text: 'Peri moi, medii sau tari?' },
  {
    kind: 'paragraph',
    text: 'Pentru majoritatea oamenilor, o periuță cu peri moi este alegerea potrivită. Perii moi îndepărtează placa bacteriană la fel de bine ca cei tari, dar sunt blânzi cu gingia și cu smalțul. O periuță tare, folosită cu putere, poate retrage gingia în timp și poate lăsa dinții sensibili la rece și la cald.',
  },
  {
    kind: 'paragraph',
    text: 'Dacă gingiile îți sângerează la periaj sau ai urmat un tratament parodontal, perii extra moi sunt un bun punct de plecare. Sângerarea nu este un motiv să te speli mai rar. Este un semn că gingia are nevoie de atenție și că e bine să ne faci o vizită, ca să vedem împreună de unde vine.',
  },
  { kind: 'heading', text: 'Manuală sau electrică?' },
  {
    kind: 'paragraph',
    text: 'Ambele variante curăță bine dacă sunt folosite corect. Periuța electrică te ajută dacă îți este greu să faci mișcări mici și precise, de exemplu când te dor încheieturile, sau dacă ai tendința să apeși prea tare: multe modele te anunță când apeși prea puternic. Periuța manuală nu are nevoie de încărcare și o iei cu tine oriunde.',
  },
  {
    kind: 'paragraph',
    text: 'Oricare ar fi alegerea ta, timpul contează: două minute, de două ori pe zi, cu o pastă de dinți cu fluor. Ține periuța înclinată spre gingie și fă mișcări mici, fără să freci în lung, ca și cum ai lustrui fiecare dinte pe rând. Nu uita de fața dinților dinspre limbă și de suprafețele cu care mesteci.',
  },
] as const satisfies readonly PostProseItem[];

/** AFTER THE GALLERY — an example shape that opens on a subheading: the
 *  words after the demo article's first gallery, joined (the header's
 *  paragraph). */
const AFTER_GALLERY = [
  { kind: 'heading', text: 'Capul periuței și mânerul' },
  {
    kind: 'paragraph',
    text: 'Un cap mic ajunge mai ușor la măselele din spate și pe fața dinților dinspre limbă, acolo unde placa se adună ușor și unde periajul ajunge greu. Mânerul trebuie să stea comod în mână și să nu alunece când e ud, mai ales dacă te speli pe dinți în grabă, dimineața.',
  },
  {
    kind: 'paragraph',
    text: 'Dacă porți aparat dentar sau ai implanturi, coroane ori punți, întreabă-ne despre periuțele speciale: cele cu perii tăiați în formă de V, potrivite pentru aparat, și periuțele cu un singur smoc, care ajung în locurile greu accesibile din jurul lucrărilor.',
  },
  { kind: 'heading', text: 'Când o schimbi' },
  {
    kind: 'paragraph',
    text: 'Schimbă periuța la fiecare trei luni sau mai devreme, dacă perii s-au desfăcut în lateral. O periuță cu perii tociți curăță mult mai puțin, oricât de atent te-ai spăla. Merită schimbată și după o răceală sau o gripă, iar copiii au nevoie adesea de una nouă mai des, pentru că o mestecă.',
  },
] as const satisfies readonly PostProseItem[];

/** THE BELT's probe (Narrowest): an e-mail-shaped run of 42 characters — no
 *  space, slash or hyphen, so no line-break opportunity anywhere in it but a
 *  syllable. MEASURED at 18px with hyphenation off: 390px unbroken, against
 *  the 273px line the runner's 320 leaves (9.3px a character — about 30
 *  characters fill a 320 phone's line). A probe, laid out and removed before
 *  anything paints; never shown. */
const PROBE = 'programari.clinica.premiumsmile@exemplu.ro';

/** The page's 42rem measure, in rem — the stand-in's inline width. */
const MEASURE_REM = 42;

/** THE STAND-IN (the header's paragraph): ui/Container's column and the
 *  page's measure, centred, inline. `data-measure` is the plays' handle on it
 *  — the stand-in's own attribute, never the piece's. */
const OnTheMeasure = ({ children }: { children: ReactNode }): ReactElement => (
  <Container className="py-12">
    <div
      data-measure=""
      style={{ maxWidth: `${MEASURE_REM}rem`, marginInline: 'auto' }}
    >
      {children}
    </div>
  </Container>
);

/** The decorator, typed `Decorator` (the PersonnelCard precedent): an inline
 *  `(Story) => …` would be typed over the meta's args. */
const onTheMeasure: Decorator = (Story) => (
  <OnTheMeasure>
    <Story />
  </OnTheMeasure>
);

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure. */
const near = async (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.5,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/** A computed length, in px. */
const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** The real faces, by each element's COMPUTED font, before anything is
 *  measured. */
async function loadFaces(elements: readonly Element[]): Promise<void> {
  for (const element of elements) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** The lines an element's text is laid out in — a Range's per-line boxes. */
const linesOf = (element: Element): DOMRect[] => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return [...range.getClientRects()].filter((line) => line.width > 0);
};

/** An element's line shape — where each line starts and how wide it is. */
const shapeOf = (element: Element): string =>
  linesOf(element)
    .map((line) => `${line.left}:${line.width}`)
    .join('|');

/** Nothing scrolls sideways (§7, §9): the page — measured by the root's own
 *  BOX, which ends where a reserved scrollbar gutter begins; never by
 *  `clientWidth`, which in a Vitest runner's frame is the whole window, the
 *  15px gutter included, and lets that much real overflow through
 *  (DoctorShowcase.stories.tsx's expectNoSidewaysScroll) — and the boxes
 *  named. */
async function expectNoSidewaysScroll(
  boxes: readonly HTMLElement[],
): Promise<void> {
  const root = document.documentElement;
  await expect(
    root.scrollWidth,
    'the page scrolls sideways',
  ).toBeLessThanOrEqual(Math.ceil(root.getBoundingClientRect().width));
  for (const box of boxes) {
    await expect(
      box.scrollWidth,
      `<${box.tagName.toLowerCase()}> scrolls sideways`,
    ).toBeLessThanOrEqual(box.clientWidth);
  }
}

/** The stand-in's boxes: the measure, the stack inside it, ui/Container's
 *  column around it. */
function partsOf(canvasElement: HTMLElement) {
  const measure = canvasElement.querySelector<HTMLElement>('[data-measure]');
  const stack = measure?.firstElementChild;
  const column = measure?.parentElement;
  if (!measure || !(stack instanceof HTMLElement) || !column) {
    throw new Error('PostProse story: the stand-in lost a box');
  }
  return { measure, stack, column };
}

/** What a play learned, for the pinned stories' own facts. */
type Prose = {
  stack: HTMLElement;
  measure: HTMLElement;
  column: HTMLElement;
  /** Every paragraph-to-paragraph distance, px. */
  between: number[];
  /** Every distance from the item above to a subheading's LINE, px. */
  above: number[];
};

/**
 * THE TEXT, at whatever width the play finds itself:
 *   · ORDER — the stack's children are the items, in order: a paragraph a
 *     <p>, a subheading an <h2>, each printing its text as given;
 *   · THE OUTLINE — every heading on the canvas an <h2> named by its text,
 *     one per subheading item (the page's <h1> is the post's title);
 *   · THE PARAGRAPH — 18px on `text-lg`'s 28px line, the body's ink,
 *     start-aligned, `hyphens: auto`;
 *   · THE SUBHEADING — 24px on a 32px line, weight 600, start-aligned on
 *     the element, never hyphenated, and the ROOM above it (24px of padding)
 *     unless it opens the stack;
 *   · THE RHYTHM — 16px from every item to the next, so 16 between two
 *     paragraphs and under a subheading, 40 from the item above to a
 *     subheading's LINE (its box's top plus its room) — more above a
 *     subheading than between paragraphs;
 *   · THE BELT — every item's lines the same with `overflow-wrap: anywhere`
 *     lifted: on these words the belt breaks nothing;
 *   · WIDTH — the stack fills the measure, which is the column up to 42rem;
 *   · nothing scrolling sideways, the page, the stack nor any item.
 */
async function expectProse(
  canvasElement: HTMLElement,
  items: readonly PostProseItem[],
): Promise<Prose> {
  const canvas = within(canvasElement);
  const { measure, stack, column } = partsOf(canvasElement);
  const children = [...stack.children] as HTMLElement[];
  await loadFaces(children);

  // ORDER.
  await expect(children).toHaveLength(items.length);
  for (const [index, item] of items.entries()) {
    const element = children[index];
    if (!element) throw new Error(`PostProse story: no element ${index + 1}`);
    await expect(element.tagName).toBe(item.kind === 'paragraph' ? 'P' : 'H2');
    await expect(element.textContent).toBe(item.text);
  }

  // THE OUTLINE.
  const headings = canvas.getAllByRole('heading');
  const subheads = items.filter((item) => item.kind === 'heading');
  await expect(headings).toHaveLength(subheads.length);
  for (const item of subheads) {
    const h2 = canvas.getByRole('heading', { level: 2, name: item.text });
    await expect(h2.tagName).toBe('H2');
  }

  // THE PARAGRAPH and THE SUBHEADING.
  const ink = getComputedStyle(document.body).color;
  for (const [index, element] of children.entries()) {
    const style = getComputedStyle(element);
    if (element.tagName === 'P') {
      await near(px(element, 'font-size'), rem(1.125), 'a paragraph’s size');
      await near(px(element, 'line-height'), rem(1.75), 'its line');
      await expect(style.textAlign).toBe('start');
      await expect(style.hyphens).toBe('auto');
      await expect(style.color).toBe(ink);
    } else {
      await near(px(element, 'font-size'), rem(1.5), 'a subheading’s size');
      await near(px(element, 'line-height'), rem(2), 'its line');
      await expect(style.fontWeight).toBe('600');
      await expect(style.textAlign).toBe('start');
      // A SUBHEADING NEVER SPLITS A WORD (PostProse.tsx's THE SUBHEADING).
      await expect(style.hyphens).toBe('none');
      await near(
        px(element, 'padding-top'),
        index === 0 ? 0 : rem(1.5),
        'the room above a subheading',
      );
    }
    await expect(style.overflowWrap).toBe('anywhere');
    await expect(px(element, 'margin-top')).toBe(0);
    await expect(px(element, 'margin-bottom')).toBe(0);
  }

  // THE RHYTHM.
  const between: number[] = [];
  const above: number[] = [];
  const first = children[0];
  if (first) {
    await near(
      first.getBoundingClientRect().top + px(first, 'padding-top'),
      stack.getBoundingClientRect().top,
      'the first item’s line, on the stack’s top',
    );
  }
  for (const [index, element] of children.entries()) {
    const previous = children[index - 1];
    if (!previous) continue;
    const bottom = previous.getBoundingClientRect().bottom;
    const top = element.getBoundingClientRect().top;
    await near(top - bottom, rem(1), 'the gap between two items');
    if (element.tagName === 'H2') {
      const line = top + px(element, 'padding-top');
      await near(line - bottom, rem(2.5), 'the room above a subheading');
      above.push(line - bottom);
    } else if (previous.tagName === 'P') {
      between.push(top - bottom);
    }
  }
  if (between.length > 0 && above.length > 0) {
    await expect(Math.min(...above)).toBeGreaterThan(Math.max(...between));
  }

  // THE BELT: lifted for one synchronous read per item, put back before
  // anything paints, then compared.
  const shapes = children.map((element) => {
    const withBelt = shapeOf(element);
    element.style.overflowWrap = 'normal';
    const withoutBelt = shapeOf(element);
    element.style.removeProperty('overflow-wrap');
    return { withBelt, withoutBelt };
  });
  for (const { withBelt, withoutBelt } of shapes) {
    await expect(withoutBelt, 'an item’s lines without its belt').toBe(
      withBelt,
    );
  }

  // WIDTH.
  const columnWidth = column.getBoundingClientRect().width;
  const measureWidth = measure.getBoundingClientRect().width;
  await near(
    measureWidth,
    Math.min(columnWidth, rem(MEASURE_REM)),
    'the measure',
  );
  await near(stack.getBoundingClientRect().width, measureWidth, 'the stack');

  await expectNoSidewaysScroll([stack, ...children]);
  return { stack, measure, column, between, above };
}

const meta = {
  title: 'Sections/PostProse',
  component: PostProse,
  parameters: { layout: 'fullscreen' },
  decorators: [onTheMeasure],
  args: { items: OPENING },
  argTypes: {
    items: {
      control: 'object',
      description:
        'The run’s paragraphs (`kind: "paragraph"` → <p>, 18px) and subheadings (`kind: "heading"` → <h2> on ui/Heading’s `subhead` step), in order, every string finished. Empty renders nothing',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the stack (§6.8)',
    },
  },
} satisfies Meta<typeof PostProse>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A SUBHEADING AMONG PARAGRAPHS — a paragraph, then two subheadings with two
 * paragraphs each (an example shape, the header's paragraph): the rhythm the
 * page reads in, 16px between paragraphs and 40px above a subheading.
 * Unpinned: the Vitest run renders it at the runner's own 1200, where the
 * 42rem measure binds; the net photographs it at 390 and 1536.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectProse(canvasElement, args.items);
  },
};

/**
 * A RUN THAT OPENS ON A SUBHEADING — the shape of every run after a picture
 * block (a blog photo, a gallery or a before/after): the first subheading
 * takes NO room of its own (the page's measure spaces the blocks), its line
 * on the stack's top; the second takes its 24px.
 */
export const HeadingFirst: Story = {
  globals: { locale: 'ro' },
  args: { items: AFTER_GALLERY },
  play: async ({ args, canvasElement }) => {
    const { stack, above } = await expectProse(canvasElement, args.items);
    const first = stack.firstElementChild;
    if (!(first instanceof HTMLElement)) throw new Error('no first item');
    await expect(first.tagName).toBe('H2');
    await expect(px(first, 'padding-top')).toBe(0);
    await near(
      first.getBoundingClientRect().top,
      stack.getBoundingClientRect().top,
      'the opening subheading, on the stack’s top',
    );
    // One room: the SECOND subheading's.
    await expect(above).toHaveLength(1);
  },
};

/**
 * THE PHONE (390) — the text fills ui/Container's column, narrower than the
 * 42rem measure.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ args, canvasElement }) => {
    const { stack, column } = await expectProse(canvasElement, args.items);
    if (window.innerWidth === 390) {
      const width = column.getBoundingClientRect().width;
      await expect(width).toBeLessThan(rem(MEASURE_REM));
      await near(stack.getBoundingClientRect().width, width, 'the text');
    }
  },
};

/**
 * THE LAPTOP (1536) — the 42rem measure binds: the text 672px wide, centred
 * in the column.
 */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ args, canvasElement }) => {
    const { stack, column } = await expectProse(canvasElement, args.items);
    if (window.innerWidth === 1536) {
      const text = stack.getBoundingClientRect();
      const box = column.getBoundingClientRect();
      await near(text.width, rem(MEASURE_REM), 'the measure');
      await near(
        text.left - box.left,
        box.right - text.right,
        'the measure, centred',
      );
    }
  },
};

/**
 * THE 320 STRESS WIDTH (§7) — the opening in the narrowest column, the
 * 'stress-320' tag, and pinned there: every line inside the column, and THE
 * BELT AT WORK — a probe paragraph, the stack's own first <p> cloned (so it
 * wears exactly the paragraphs' classes), holding a run longer than the line
 * in an engine with no Romanian dictionary: without the belt it pushes past
 * the column, with it it breaks inside. Laid out, measured and removed in
 * one synchronous step, before anything paints. The probe is THIS width's
 * fact, so it runs only when the window really is 320 wide — like the
 * Smartphone and Laptop stories' facts: the net also photographs this story
 * at 1536, where the measure is wider than the probe and its premise would
 * fail.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ args, canvasElement }) => {
    const { stack } = await expectProse(canvasElement, args.items);
    if (window.innerWidth !== 320) return;
    const paragraph = stack.querySelector('p');
    if (!paragraph) throw new Error('no paragraph to clone');
    const probe = paragraph.cloneNode(false) as HTMLParagraphElement;
    probe.textContent = PROBE;
    // An engine with NO Romanian dictionary (§15.25: Chromium's own pattern
    // set, on Android, Windows and Linux): measured, this runner's Chromium
    // hyphenates the probe's words and needs no belt at all.
    probe.style.hyphens = 'manual';
    stack.append(probe);
    const line = probe.clientWidth;
    const withBelt = probe.scrollWidth;
    probe.style.overflowWrap = 'normal';
    const withoutBelt = probe.scrollWidth;
    probe.remove();
    // The premise: the address IS longer than the line.
    await expect(withoutBelt).toBeGreaterThan(line);
    await expect(withBelt).toBeLessThanOrEqual(line);
    await expectNoSidewaysScroll([stack]);
  },
};
