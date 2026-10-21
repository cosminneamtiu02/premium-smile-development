import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import type { PostPhotoContent } from '@/components/sections/PostPhoto/PostPhoto';
import { PostPage, type PostPageBlock, type PostPageProps } from './PostPage';
import { DEMO_PAGE } from './PostPage.fixtures';

// Sections/PostPage — the blog article's page band, whole: the opener, the
// cover with the share controls in its slot, the article's blocks and the
// doctor's closing words. FIVE stories: the demo article, the article with no
// blocks, and the three widths the build contract pins — a phone (390), the
// laptop (1536, inside THE BAND SCALE) and the 320px accessibility width. The
// export NAMES are load-bearing — each names a baseline file — so this list IS
// the band's contribution to a lane's visual manifest. `Sections/*` routes
// every story to 390 + 1536 (tests/visual/stories.spec.ts, §13), and the
// 'stress-320' tag adds the 320 width to Stress320. Smartphone and Laptop
// photograph the same frames as Default there (the net ignores pins) — a
// harmless duplicate, kept because their PLAYS are what the pins buy (the
// PostCover and PostHeader stories' reasoning).
//
// ── THE DATA IS THE BAND'S OWN FIXTURE (./PostPage.fixtures.ts) — the demo
// article page whole, in Romanian with diacritics (§15.7; the article is in
// all five languages since 2026-10-15, and Pages/BlogArticle's German frames
// photograph its German), copied from the article's
// JSON, ro.json and lib/team — NEVER the route's populator: these stories
// prove the band; the route's twin, Pages/BlogArticle, proves the wiring.
//
// ── NO STAND-IN: the band IS the page's structure — the <article>,
// ui/Container's column and the rhythm box that wears THE BAND SCALE — so
// every story renders it bare, `layout: 'fullscreen'` keeping Storybook's own
// padding out of the column, and on a laptop or a desktop with a mouse the
// whole article is drawn in the design pixel exactly as on the page (§15.32).
//
// ── WHAT THE PLAYS MEASURE (`expectPage`), each DERIVED from the boxes it
// reads — never from the pinned width, because the visual net photographs
// every story at its own widths with the same play:
//   · the page's ONE <h1>, naming the <article>;
//   · the order: the opener, the cover, the measure — and in the measure the
//     blocks, each by its kind, then the conclusion; a blog photo and each
//     half of a pair with EXACTLY its parts, in order (its heading as the
//     caption, its picture, its finished note), and no block's `kind` in the
//     markup;
//   · every gallery a carousel region of its OWN name („Galerie foto 2 din
//     2"), holding its own cards — the page's regions exactly the
//     galleries', in the article's order, no two named alike: each is a
//     landmark, and a page's landmarks never share a name (axe's
//     landmark-unique, which every story's check runs) — its two arrows and
//     its beads (a group named by the page's picker word, one bead per card
//     named as its card) FIRST in its DOM, then its cards;
//   · THE STACK, 48px between the three (`gap-12`), × the design pixel inside
//     the scale; the measure's blocks 40px apart (`gap-10`), the same — a
//     blog photo and a pair among them;
//   · THE MEASURE at most 42rem — 672 design pixels inside the scale — and
//     centred in the column;
//   · the band's steps, 3 / 4 / 5rem by the column, the SAME over the opener
//     and under the conclusion: the bottom one is the room the article leaves
//     the shell's Footer, which follows it on the page (THE RHYTHM BOX);
//   · THE BAND SCALE read off the rhythm box, cross-checked against the
//     gates read off the browser (a fine pointer, an engine that registers
//     custom properties, a column of max(56rem, 896px));
//   · nothing scrolling sideways — not the page, not the band (§7, §9).
// The real faces are loaded first (Storybook's fonts are `font-display:
// block`, so a play that measured before they arrived would lay the words out
// in a fallback — Blog.stories.tsx's `loadFace`, here asked for each element
// by its COMPUTED font). No play waits on a picture: in the Vitest run the
// optimizer's variants do not exist yet, every <img> 404s and falls back to
// its original file, and a play that awaited `decode()` could hang; every box
// measured here takes its size from its own CSS, never from a bitmap.
//
// ── MEASURED here (Chromium, the real faces, behind a classic 15px
// scrollbar — a 273, 336, 599.4, 945, 1009, 1105.8, 1213.8 and 1521px column
// at 320, 390, 768, 1200, 1280, 1401, 1536 and 1920; a mouse, so the scale's
// gate opens from the step): THE STACK is 48px at 320, 390 and 768 — outside
// the scale, the theme's own 3rem — and 41.0 / 43.8 / 48.0 / 52.7 / 66.0px at
// 1200 / 1280 / 1401 / 1536 / 1920 (the design pixel 0.854 / 0.912 / 1.000 /
// 1.097 / 1.375), the measure's blocks 40 × the same; THE MEASURE is the
// whole column at 320, 390 and 768 (every column there under 42rem), and
// 574.2 / 613.1 / 671.9 / 737.5 / 924.1px at 1200 / 1280 / 1401 / 1536 /
// 1920 — 672 design pixels — centred to a hundredth of a pixel; its full
// lines hold 33 characters at 320, 41 at 390, 74 at 768 and 81 to 87 inside
// the scale (83 at 1401). THE BOTTOM STEP under the conclusion — the room the
// Footer is given — is 48px at 320 and 390 and 68.4 / 87.8px at 1200 / 1536,
// the top step's own. The demo page as it ships since 2026-10-17 — twenty
// runs, four blog photos, two galleries of eight cards — three in each
// window — and four pairs among them — is 8979px tall at 390, 8947 at 320, 6844 at 1200 and 8715 at 1536
// (2026-10-17, this runner, at the stories' own widths, on sections/
// CardCarousel's line with its arrows and its beads); NoBlocks 1085 at 1200
// (988 at 390 and 1394 at 1536, 2026-10-16 — it holds no gallery).

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP in rem of the root; THE
 *  STEP's two halves, `@4xl`'s 56rem and the floor's 896px. Spelled again on
 *  purpose: the census holds the source, these hold what the engine does
 *  (the PostCover and PostHeader stories' idiom). */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** THE STACK and the measure's gap, in design pixels (THE RHYTHM BOX, THE
 *  MEASURE: `gap-12`, `gap-10`), and THE MEASURE's 42rem — 672 of them. */
const STACK = 48;
const BLOCK_GAP = 40;
const MEASURE_MAX = 672;

/** CSS px per rem — the root's, which every container query's rem reads. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure (half a pixel by default: a box edge, layout rounding to
 *  1/64px, a design pixel keeping its fraction). */
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

/** The real faces, by each element's computed font, before anything is
 *  measured (Blog.stories.tsx's `loadFace`, for every text the band shows). */
const loadFaces = async (root: HTMLElement): Promise<void> => {
  for (const element of root.querySelectorAll<HTMLElement>(
    'h1, h2, p, li, a, button, figcaption, blockquote',
  )) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/** The middle of a box, across. */
const across = (box: DOMRect): number => box.left + box.width / 2;

/** The vertical distance from one box's foot to the next box's top. */
const gap = (above: Element, below: Element): number =>
  below.getBoundingClientRect().top - above.getBoundingClientRect().bottom;

/** The band's boxes, reached from the <h1> by structure — none of the outer
 *  ones carries a role: the opener, the rhythm box, ui/Container's column;
 *  and the rhythm box's other two children, the cover and the measure. */
const partsOf = (h1: HTMLElement) => {
  const header = h1.parentElement;
  const rhythm = header?.parentElement;
  const column = rhythm?.parentElement;
  const cover = rhythm?.children[1];
  const measure = rhythm?.children[2];
  if (
    !(header instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(column instanceof HTMLElement) ||
    !(cover instanceof HTMLElement) ||
    !(measure instanceof HTMLElement)
  ) {
    throw new Error('PostPage story: the band lost a box.');
  }
  return { header, rhythm, column, cover, measure };
};

/**
 * The unit every theme length of the band is drawn in, where the play finds
 * itself: the design pixel inside THE BAND SCALE — a fine primary pointer, an
 * engine that registers custom properties (the relative colour syntax rides
 * with them), a column of max(56rem, 896px): min(column, 96rem) / 1106 — and
 * a sixteenth of the root outside it (rem, §7). Cross-checked against what
 * the rhythm box declares, and against the root, which declares nothing.
 */
const unitOf = async (
  rhythm: HTMLElement,
  column: HTMLElement,
): Promise<{ unit: number; scaled: boolean }> => {
  const width = column.getBoundingClientRect().width;
  const scaled =
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    width >= Math.max(STEP_REM * rem(), STEP_FLOOR);
  const unit = scaled
    ? Math.min(width, CAP_REM * rem()) / REFERENCE
    : rem() / 16;
  const declared = getComputedStyle(rhythm).getPropertyValue('--scale-px');
  const root = getComputedStyle(document.documentElement).getPropertyValue(
    '--scale-px',
  );
  // The registered property's initial value: the root never declares it.
  await expect(root).toBe('1px');
  if (scaled) {
    await near(parseFloat(declared), unit, 'the design pixel', 0.0001);
    await expect(declared, 'the rhythm box’s design pixel').not.toBe(root);
  } else {
    await expect(declared).toBe(root);
  }
  return { unit, scaled };
};

/** The blocks the measure shows: a prose run with no items renders nothing
 *  (PostProse's NOTHING TO SAY RENDERS NOTHING), and a gallery with no cards
 *  nothing either (sections/CardCarousel, for an empty list); a blog photo
 *  and a pair always draw their pictures. */
const shownBlocks = (blocks: readonly PostPageBlock[]): PostPageBlock[] =>
  blocks.filter((block) =>
    block.kind === 'prose'
      ? block.items.length > 0
      : block.kind === 'gallery'
        ? block.cards.length > 0
        : true,
  );

/** A gallery block — a card carousel. */
type GalleryBlock = Extract<PostPageBlock, { kind: 'gallery' }>;

/** A pair's two halves, the before first. */
const HALVES = ['before', 'after'] as const;

/** A pair's halves as the blog photos it draws (sections/BeforeAfter's EACH
 *  HALF IS A BLOG PHOTO): each half its picture, and the pair's heading and
 *  note for that half when the pair has them. */
const halvesOf = (
  pair: Extract<PostPageBlock, { kind: 'beforeAfter' }>,
): PostPhotoContent[] =>
  HALVES.map((half) => ({
    image: pair.images[half],
    heading: pair.headings?.[half],
    note: pair.notes?.[half],
  }));

/** One part of a blog photo's <figure>: its tag and its words — a caption's
 *  or a note's text, and for the picture's box its picture's alt. */
type Part = readonly [tag: string, words: string];

/** The parts a blog photo's <figure> must hold, in DOM order — sections/
 *  PostPhoto's THE LAYOUT: its heading as the caption when it has one, the
 *  picture's box, its FINISHED note as a <p> when it has one; nothing else. */
const partsWanted = (photo: PostPhotoContent): Part[] => [
  ...(photo.heading === undefined
    ? []
    : [['FIGCAPTION', photo.heading] as const]),
  ['DIV', photo.image.alt],
  ...(photo.note === undefined ? [] : [['P', photo.note] as const]),
];

/** The parts a <figure> holds, read in DOM order. */
const partsShown = (figure: Element): Part[] =>
  [...figure.children].map((child): Part => [
    child.tagName,
    child.tagName === 'DIV'
      ? (child.querySelector('img')?.getAttribute('alt') ?? '')
      : (child.textContent ?? ''),
  ]);

/** One block, read where the measure laid it: its section, by its kind. */
const expectBlock = async (
  box: HTMLElement,
  block: PostPageBlock,
): Promise<void> => {
  switch (block.kind) {
    case 'prose':
      // PostProse: one <p> per paragraph, one <h2> per subheading, in order.
      await expect(
        [...box.children].map((child) => [child.tagName, child.textContent]),
      ).toEqual(
        block.items.map((item) => [
          item.kind === 'heading' ? 'H2' : 'P',
          item.text,
        ]),
      );
      return;
    case 'gallery': {
      // PostGallery: sections/CardCarousel's <section>, a region named by the
      // page's words — its own number, so the measure's one region of that
      // name IS this box — its roledescription, prev and next, its beads,
      // and one labelled card group per card — the side cards inert previews
      // (aria-hidden), so the groups are read hidden or not, wherever the
      // ring has moved.
      await expect(box.tagName).toBe('SECTION');
      await expect(
        within(box.parentElement ?? box).getByRole('region', {
          name: block.labels.region,
        }),
      ).toBe(box);
      await expect(box).toHaveAttribute(
        'aria-roledescription',
        block.labels.role,
      );
      // prev and next, each named, whatever the carousel shows of them and
      // wherever it has moved by now: the ring's two are always live, and
      // the end-to-end list, at whichever card it stands, always has
      // somewhere to go — one way, the other, or both.
      const buttons = [block.labels.previous, block.labels.next].map((name) =>
        within(box).getByRole('button', { name }),
      );
      if (block.mode === 'loop') {
        for (const button of buttons) await expect(button).toBeEnabled();
      } else {
        await expect(
          buttons.filter((button) => button.matches(':enabled')).length,
          `${block.labels.region}: a live control`,
        ).toBeGreaterThan(0);
      }
      // THE BEADS: a group named by the page's picker word, one bead per
      // card named as its card, exactly one current — the centred card's,
      // read in one moment — and the region's buttons in the DOM's order:
      // previous, next, then the beads.
      const beads = within(box).getByRole('group', {
        name: block.labels.picker,
      });
      const beadButtons = within(beads).getAllByRole('button');
      await expect(
        beadButtons.map((bead) => bead.getAttribute('aria-label')),
      ).toEqual([...block.slideLabels]);
      await expect(
        within(box)
          .getAllByRole('button')
          .map((button) => button.getAttribute('aria-label')),
      ).toEqual([
        block.labels.previous,
        block.labels.next,
        ...block.slideLabels,
      ]);
      // The card groups — the slide's roledescription tells them from the
      // beads' group — all after the beads in the DOM.
      const groups = within(box)
        .getAllByRole('group', { hidden: true })
        .filter(
          (group) =>
            group.getAttribute('aria-roledescription') ===
            block.labels.slideRole,
        );
      await expect(
        groups.map((group) => group.getAttribute('aria-label')),
      ).toEqual([...block.slideLabels]);
      await expect(
        groups.map((group) => group.querySelector('figcaption')?.textContent),
      ).toEqual(block.cards.map((card) => card.caption));
      for (const group of groups) {
        await expect(
          beads.compareDocumentPosition(group) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          `${block.labels.region}: the beads before the cards`,
        ).not.toBe(0);
      }
      const reading = {
        centre: groups
          .find((group) => !group.hasAttribute('inert'))
          ?.getAttribute('aria-label'),
        current: beadButtons
          .filter((bead) => bead.getAttribute('aria-current') === 'true')
          .map((bead) => bead.getAttribute('aria-label')),
      };
      await expect(
        reading.current,
        `${block.labels.region}: the one current bead, the centred card's`,
      ).toEqual([reading.centre]);
      return;
    }
    case 'photo':
      // PostPhoto: ONE <figure>, a child of the measure itself — its heading
      // as its caption when it has one, the picture, its finished note under
      // it when it has one, and nothing else.
      await expect(box.tagName).toBe('FIGURE');
      await expect(partsShown(box)).toEqual(partsWanted(block));
      return;
    case 'beforeAfter': {
      // BeforeAfter: the pair's box, two blog photos in it — the before
      // first — each holding exactly the pair's parts.
      await expect(box.tagName).toBe('DIV');
      const figures = within(box).getAllByRole('figure');
      await expect(figures.map(partsShown)).toEqual(
        halvesOf(block).map(partsWanted),
      );
      return;
    }
  }
  // TOTAL over the band's kinds, like PostPage.tsx's renderBlock (2026-10-20,
  // round 2 of the Opus typescript review): a fifth kind does not compile
  // here until the plays read it.
  const unread: never = block;
  throw new Error(
    `PostPage story: a block of the kind ${JSON.stringify(
      (unread as { kind?: unknown }).kind,
    )}, which the plays do not read`,
  );
};

/** What a play learned, for a pinned story's own facts. */
type PageShape = {
  rhythm: HTMLElement;
  measure: HTMLElement;
  unit: number;
  scaled: boolean;
};

/**
 * THE PAGE, MEASURED (the header's WHAT THE PLAYS MEASURE) — every fact the
 * build contract names, at whatever width the play is handed.
 */
const expectPage = async (
  canvasElement: HTMLElement,
  args: PostPageProps,
): Promise<PageShape> => {
  const canvas = within(canvasElement);

  // ONE <h1>, the post's title, and it names the <article>.
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const h1 = canvas.getByRole('heading', { level: 1, name: args.header.title });
  const article = canvas.getByRole('article', { name: args.header.title });
  await expect(article).toContainElement(h1);
  await expect(article).toHaveAttribute('aria-labelledby', h1.id);
  await loadFaces(canvasElement);

  // THE ORDER: the opener, the cover, the measure; in the measure the blocks
  // by kind, then the conclusion.
  const { header, rhythm, column, cover, measure } = partsOf(h1);
  await expect(header.tagName).toBe('HEADER');
  await expect([...rhythm.children]).toEqual([header, cover, measure]);
  await expect(
    within(cover).getByText(args.cover.readingTime),
  ).toBeInTheDocument();
  await expect(
    within(cover).getByRole('list', { name: args.share.label }),
  ).toBeInTheDocument();
  const blocks = shownBlocks(args.blocks);
  const children = [...measure.children] as HTMLElement[];
  await expect(children).toHaveLength(blocks.length + 1);
  for (const [index, block] of blocks.entries()) {
    const box = children[index];
    if (!box) throw new Error(`PostPage story: no box for block ${index + 1}`);
    await expectBlock(box, block);
  }
  // Every section was handed its props BY NAME: no block's `kind` rode into
  // the markup (THE BLOCKS).
  await expect(canvasElement.querySelector('[kind]')).toBeNull();
  // THE GALLERIES' NAMES: the page's regions are exactly its galleries', in
  // the article's order, each found by its own name — so no two share one.
  const galleries = blocks.filter(
    (block): block is GalleryBlock => block.kind === 'gallery',
  );
  await expect(
    new Set(galleries.map((gallery) => gallery.labels.region)).size,
  ).toBe(galleries.length);
  await expect(canvas.queryAllByRole('region')).toEqual(
    galleries.map((gallery) =>
      canvas.getByRole('region', { name: gallery.labels.region }),
    ),
  );
  const conclusion = children.at(-1);
  if (!conclusion) throw new Error('PostPage story: no conclusion');
  await expect(conclusion.tagName).toBe('FIGURE');
  await expect(conclusion.querySelector('blockquote')).toHaveTextContent(
    args.conclusion.text,
  );
  await expect(conclusion.querySelector('figcaption')).toHaveTextContent(
    args.conclusion.doctor.name,
  );

  // THE BAND SCALE, then every distance in its unit.
  const { unit, scaled } = await unitOf(rhythm, column);

  // THE STACK: 48 between the opener, the cover and the measure.
  await near(gap(header, cover), STACK * unit, 'the stack, opener → cover');
  await near(gap(cover, measure), STACK * unit, 'the stack, cover → measure');
  // The measure's blocks 40 apart, the conclusion among them.
  for (const [index, box] of children.entries()) {
    const next = children[index + 1];
    if (!next) break;
    await near(
      gap(box, next),
      BLOCK_GAP * unit,
      `the measure’s gap under block ${index + 1}`,
    );
  }

  // THE MEASURE: at most 42rem (672 design pixels), the column's whole width
  // under it, centred in the column either way.
  const columnBox = rhythm.getBoundingClientRect();
  const measureBox = measure.getBoundingClientRect();
  await near(
    measureBox.width,
    Math.min(columnBox.width, MEASURE_MAX * unit),
    'the measure’s width',
  );
  await expect(measureBox.width).toBeLessThanOrEqual(MEASURE_MAX * unit + 0.5);
  await near(across(measureBox), across(columnBox), 'the measure, centred', 1);

  // The band's steps: 3rem on a column under 32rem, 4rem from it, 5rem from
  // 48rem — container steps written in CSS rem, the lengths in the band's
  // unit — the SAME over the opener, under the sticky header, and under the
  // conclusion, where the shell's Footer follows the article (THE RHYTHM
  // BOX): the bottom step is the whole room between the doctor's last word
  // and the Footer's top edge.
  const width = column.getBoundingClientRect().width;
  const step = width >= 48 * rem() ? 80 : width >= 32 * rem() ? 64 : 48;
  const rhythmStyle = getComputedStyle(rhythm);
  await near(
    parseFloat(rhythmStyle.paddingTop),
    step * unit,
    'the band’s top step',
  );
  await near(
    parseFloat(rhythmStyle.paddingBottom),
    step * unit,
    'the band’s bottom step — the room above the Footer',
  );

  // NOTHING SIDEWAYS — the page, the band, the measure (§7, §9).
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  await expect(rhythm.scrollWidth).toBeLessThanOrEqual(rhythm.clientWidth);
  await expect(measure.scrollWidth).toBeLessThanOrEqual(measure.clientWidth);

  return { rhythm, measure, unit, scaled };
};

const meta = {
  title: 'Sections/PostPage',
  component: PostPage,
  parameters: { layout: 'fullscreen' },
  args: { ...DEMO_PAGE },
  argTypes: {
    header: {
      control: 'object',
      description:
        'The opener — the post’s title (the page’s one <h1>, naming the <article>) and the finished by-line',
    },
    cover: {
      control: 'object',
      description:
        'The cover’s content — the reading time, the picture, the categories and their list’s name; its share slot and its preload are the band’s',
    },
    share: {
      control: 'object',
      description:
        'sections/ShareLinks’ own props — the list’s name, the three links and the copy control — dropped into the cover’s slot; never the native props of its root, the box round the list and its status line',
    },
    blocks: {
      control: 'object',
      description:
        'The article’s body in order — prose runs, blog photos (a heading and a note, each optional), galleries (a card carousel each), before/after pairs (two blog photos, one shape) — laid into the 42rem measure; empty is a page all the same',
    },
    conclusion: {
      control: 'object',
      description:
        'The doctor’s closing words and who said them — always the measure’s last block',
    },
    className: {
      control: false,
      description: 'Placement only — the <article>’s whole class list (§6.8)',
    },
  },
} satisfies Meta<typeof PostPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE DEMO ARTICLE — „Cum îți alegi periuța de dinți" whole, as it ships: the
 * title over its by-line, both on the column's start edge (start-aligned
 * since 2026-10-14, PostHeader's START-ALIGNED), the reading time and the
 * share controls over the lobby photograph with „igienă" and „sfaturi" at its
 * top right,
 * then the 42rem column of text with every kind of block — ten prose runs,
 * four blog photos (neither a heading nor a note, a heading and a note, a
 * note alone, a heading alone), two galleries named by their numbers,
 * „Galerie foto 1 din 2" and „Galerie foto 2 din 2" (the same eight
 * photographs in each, three cards in each window: the ring looping, then
 * the list running end to end) and four before/after pairs (headings alone,
 * headings and notes, neither, notes alone) — and Dr. Nicu Elena Alina's
 * closing words, the page's last.
 * Unpinned: the Vitest run renders it at the runner's own 1200 (inside THE
 * BAND SCALE behind a mouse), the net at 390 and 1536, and the play proves
 * whichever it is handed.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectPage(canvasElement, args);
    // Every kind the band knows, rendered.
    await expect(new Set(args.blocks.map((block) => block.kind))).toEqual(
      new Set(['prose', 'gallery', 'photo', 'beforeAfter']),
    );
    // BOTH INSTANCES of the carousel since 2026-10-17, each drawn once and in
    // this order, eight cards each: the ring, then the end-to-end list — the
    // gallery's one window, three cards, named by no block.
    await expect(
      args.blocks.flatMap((block) =>
        block.kind === 'gallery'
          ? [[block.mode, block.cards.length, 'visible' in block]]
          : [],
      ),
    ).toEqual([
      ['loop', 8, false],
      ['bounded', 8, false],
    ]);
    // EVERY INSTANCE the owner listed (2026-10-15), each drawn once: a blog
    // photo and a pair with a heading and a note, a heading alone, a note
    // alone, neither — H a heading (both of a pair's), N a note.
    const shape = (heading: unknown, note: unknown): string =>
      `${heading === undefined ? '-' : 'H'}${note === undefined ? '-' : 'N'}`;
    await expect(
      args.blocks
        .flatMap((block) =>
          block.kind === 'photo' ? [shape(block.heading, block.note)] : [],
        )
        .toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
    await expect(
      args.blocks
        .flatMap((block) =>
          block.kind === 'beforeAfter'
            ? [shape(block.headings, block.notes)]
            : [],
        )
        .toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
  },
};

/**
 * NO BLOCKS — still a page: the opener, the cover and the conclusion, the
 * conclusion alone in the measure, 48px under the cover like the text would
 * be. A state the route never builds; the band never crashes on it.
 */
export const NoBlocks: Story = {
  globals: { locale: 'ro' },
  args: { blocks: [] },
  play: async ({ args, canvasElement }) => {
    const { measure } = await expectPage(canvasElement, args);
    await expect(measure.children).toHaveLength(1);
    await expect(within(canvasElement).getAllByRole('heading')).toHaveLength(1);
  },
};

/**
 * THE PHONE (390) — outside THE BAND SCALE: the theme's own sizes, the stack
 * 48px, and the measure the column's whole width (336px behind the runner's
 * scrollbar, 351 on a phone with none) — every phone's column is under 42rem.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ args, canvasElement }) => {
    const { rhythm, measure, scaled } = await expectPage(canvasElement, args);
    if (window.innerWidth === 390) {
      await expect(scaled).toBe(false);
      await near(
        measure.getBoundingClientRect().width,
        rhythm.getBoundingClientRect().width,
        'the measure, the column’s whole width',
      );
    }
  },
};

/**
 * THE LAPTOP (1536) — inside THE BAND SCALE, past the owner's 1401 reference:
 * the rhythm box declares its own design pixel (over 1, the root's still
 * 1px), and the whole article grows with the column — the stack, the measure
 * (672 design pixels, centred), every word.
 */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ args, canvasElement }) => {
    const { rhythm, measure, unit, scaled } = await expectPage(
      canvasElement,
      args,
    );
    if (window.innerWidth === 1536) {
      await expect(scaled).toBe(true);
      await expect(unit).toBeGreaterThan(1);
      await expect(
        getComputedStyle(rhythm).getPropertyValue('--scale-px'),
      ).not.toBe(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--scale-px',
        ),
      );
      await near(
        measure.getBoundingClientRect().width,
        MEASURE_MAX * unit,
        'the measure, 672 design pixels',
      );
    }
  },
};

/**
 * THE 320 STRESS WIDTH (§7) — the 'stress-320' tag, and pinned there: the
 * demo article in the narrowest column, outside THE BAND SCALE — the cover's
 * share row wrapping under the reading time, the blog photos across the
 * column with their headings and notes wrapping, the two galleries'
 * carousels inside the column, every before/after stacked with its line
 * lying down, the conclusion's circle at its 72px floor with the doctor's
 * name and specialty WRAPPED under it, at the caption's whole width
 * (sections/PostConclusion's UNDER THE FLOOR, THE NAMES WRAP: this frame is a
 * 273px column, behind the runner's 15px scrollbar, and the names sit beside
 * the circle only from a 278px figure — on a real 320 phone, a 288px column,
 * they sit beside an 80px circle) — and nothing pushing the page sideways.
 */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ args, canvasElement }) => {
    const { rhythm, measure, scaled } = await expectPage(canvasElement, args);
    if (window.innerWidth === 320) {
      await expect(scaled).toBe(false);
      await near(
        measure.getBoundingClientRect().width,
        rhythm.getBoundingClientRect().width,
        'the measure, the column’s whole width',
      );
    }
  },
};
