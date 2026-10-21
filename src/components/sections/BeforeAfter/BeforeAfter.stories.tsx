import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import type { PostPhotoImage } from '@/components/sections/PostPhoto/PostPhoto';
import { Container } from '@/components/ui/Container/Container';
import {
  BeforeAfter,
  type BeforeAfterPair,
  type BeforeAfterProps,
} from './BeforeAfter';

// SIX stories: the four instances the owner asked for — verbatim
// (2026-10-15): "add every instantiation possible of a inainte and dupa wher
// eboth left and right must be same instance of blog image … here headings
// sould be replaceble, not mandatory before and after and here headings should
// also be optional" — headings and notes (Default), headings alone, notes
// alone, the pictures alone; the replaced headings; and the German stress. The
// export NAMES are load-bearing — each names a baseline file
// (`sections/before-after/default-…`) — so this list IS the section's
// contribution to a lane's visual manifest. `Sections/*` routes every story to
// 390 + 1536 (tests/visual/stories.spec.ts, §13), and the 'stress-320' tag
// adds the accessibility width to GermanStress. The PINS are for the Vitest
// storybook run only — the net sets its own page size per project — and they
// decide what that run proves. Its default window is 1200px wide (measured),
// where the article's column holds 42rem, so the two unpinned stories,
// Default and PicturesOnly, prove the pair SIDE BY SIDE on three rows and on
// one — each play asserts the row at that width, as a pinned story asserts
// its pin; NotesOnly and ReplacedHeadings pin the laptop and prove it on two
// rows and on three — ReplacedHeadings under headings of different line
// counts, the pictures level; HeadingsOnly pins the smartphone and
// GermanStress the 320px stress width, so they prove THE STACK — the phone,
// as it was, and the phone with notes.
//
// ── THE WORDS are Romanian with diacritics (§15.7), German in the stress —
// demo copy: each note FINISHED with its lead-in („Notă: …", „Hinweis: …")
// the way the route hands it over, and under 40 characters, so it sits on two
// lines at most even on a 230px half (the owner's "maximum of 2 rows" — the
// plays measure it). The pictures are the clinic's own three photographs,
// each alt saying what it shows — stand-ins: a real before/after needs the
// patient's written consent and a CMSR check (BACKLOG.md entry 7). The two
// stories WITHOUT headings, NotesOnly and PicturesOnly, open their alts on
// „Înainte: " and „După: " (the review's ask, 2026-10-20): without headings
// nothing else tells a screen reader which half is which — the line between
// them is decoration, and a note is a paragraph in its figure, never its
// caption — and BeforeAfter checks it nowhere: it is the caller's duty (its
// `images` prop), the rule the CI data test holds the shipped articles to
// (tests/unit/blog-article-data.test.ts; lib/blog-article's `parseArticle`
// itself takes any alt with a visible letter). With headings the alts stay
// plain: each heading captions its figure, read inside it — the figure's
// name only under HTML-AAM's rule, which Chromium 151 does not apply
// (PostPhoto.tsx's THE HEADING).
//
// ── THE DECORATOR IS THE ARTICLE'S COLUMN: the page-band recipe (a
// full-bleed <section> that paints, ui/Container that measures) holding a
// STAND-IN for the article's 42rem measure — an inline width, because the
// measure's own utility ships with sections/PostPage and a story must not
// ship a CSS rule nothing else wears (Tailwind reads every scanned file). The
// stand-in is the box this section lives in on the page, outside THE BAND
// SCALE: the stories photograph the theme's look; BeforeAfter.scale.test.tsx
// measures the scaled one. `layout: 'fullscreen'` keeps Storybook's own
// padding out of the band.
//
// ── WHAT THE PLAYS READ: every geometry number is a LAYOUT value — a grid
// track, a box, an offset — read after the real faces are loaded (Storybook's
// fonts are `font-display: block`, the house's lesson: a heading measured in
// the fallback face wraps differently). Each play DERIVES the arrangement it
// expects from the root it measures (`inRow`: the root's own 32rem), never
// from the pinned width, so at 390 and 1536 each proves whichever arrangement
// the pair is in; a pinned story then asserts the arrangement its pin
// promises. A figure's NAME comes from its <figcaption> under HTML-AAM's
// rule — a rule Chromium 151 does not apply (measured 2026-10-20: its own
// accessibility tree names such a figure ""; Firefox and WebKit not
// measured), while a screen reader still reads the caption inside the figure
// (PostPhoto.tsx's THE HEADING). Testing Library's engine does not read a
// figcaption either, so the heading is checked as an element
// (BeforeAfter.test.tsx asks Playwright's engine, which applies the rule,
// for the name). No play waits on a picture: in the Vitest run the
// optimizer's variants do not exist yet, every <img> 404s and falls back to
// its original file, and a play that awaited `decode()` could hang.

/** The clinic's treatment room — the hero slide's own alt (truthful). */
const TREATMENT_ROOM = {
  src: '/images/hero/treatment-room.jpg',
  alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
} as const satisfies PostPhotoImage;

/** The handpieces on the dental unit's arm. */
const INSTRUMENTS = {
  src: '/images/hero/instruments.jpg',
  alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
} as const satisfies PostPhotoImage;

/** The clinic's waiting room. */
const LOBBY = {
  src: '/images/hero/lobby.jpg',
  alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
} as const satisfies PostPhotoImage;

/** The demo article's pair of pictures. */
const IMAGES = {
  before: TREATMENT_ROOM,
  after: INSTRUMENTS,
} as const satisfies BeforeAfterPair<PostPhotoImage>;

/** THE PAIRS WITHOUT HEADINGS (the header's THE WORDS): each alt opens on
 *  its half's word, as the shipped article writes them — NotesOnly's pair,
 *  the treatment room before the instruments… */
const HEADLESS_IMAGES = {
  before: {
    ...TREATMENT_ROOM,
    alt: 'Înainte: cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  after: {
    ...INSTRUMENTS,
    alt: 'După: prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

/** …and PicturesOnly's, the waiting room before the treatment room. */
const HEADLESS_PICTURES = {
  before: {
    ...LOBBY,
    alt: 'Înainte: sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
  },
  after: {
    ...TREATMENT_ROOM,
    alt: 'După: cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

const HEADINGS = {
  before: 'Înainte',
  after: 'După',
} as const satisfies BeforeAfterPair<string>;

/** Finished notes, each under 40 characters. */
const NOTES = {
  before: 'Notă: fotografie din cabinetul nostru.',
  after: 'Notă: după igienizare.',
} as const satisfies BeforeAfterPair<string>;

/** Headings that are not „Înainte" / „După" — and of different lengths, so
 *  side by side the second takes two lines beside the first's one. */
const REPLACED = {
  before: 'Ianuarie',
  after: 'Aprilie, după trei luni de periaj',
} as const satisfies BeforeAfterPair<string>;

/** THE GERMAN STRESS — the longest words: a heading that wraps beside a short
 *  one, and the longer notes, over the pictures' German alts. */
const GERMAN = {
  images: {
    before: {
      src: '/images/hero/treatment-room.jpg',
      alt: 'Ein Behandlungszimmer mit dem Behandlungsstuhl und, an der Wand, einem Bildschirm mit einem Panoramaröntgenbild',
    },
    after: {
      src: '/images/hero/instruments.jpg',
      alt: 'Nahaufnahme der Instrumente am Arm der Behandlungseinheit',
    },
  },
  headings: {
    before: 'Vor der professionellen Zahnreinigung',
    after: 'Nachher',
  },
  notes: {
    before: 'Hinweis: Aufnahme vor der Behandlung.',
    after: 'Hinweis: Zwei Wochen später.',
  },
} as const satisfies Pick<BeforeAfterProps, 'images' | 'headings' | 'notes'>;

/** THE ARTICLE'S COLUMN (the header's THE DECORATOR): the band recipe and the
 *  42rem measure's stand-in, centred like the page's. */
const ArticleColumn = ({ children }: { children: ReactNode }): ReactElement => (
  <section className="bg-page">
    <Container className="py-10">
      <div style={{ width: '100%', maxWidth: '42rem', marginInline: 'auto' }}>
        {children}
      </div>
    </Container>
  </section>
);

const withArticleColumn: Decorator = (Story) => (
  <ArticleColumn>
    <Story />
  </ArticleColumn>
);

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

const px = (value: string): number => parseFloat(value);

/** `node` as the HTMLElement it must be, or a named failure — never an
 *  unchecked cast (BeforeAfter.scale.test.tsx's check, the same name). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`BeforeAfter story: no ${name}`);
  }
  return node;
};

/** The face an element's text is laid out in, loaded before anything is
 *  measured (the PostPhoto / PostCard / DoctorIntro idiom). */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** A token's colour, resolved by the engine through a probe — no colour is
 *  retyped here (DoctorProfile.stories.tsx's `colourOf`). */
const colourOf = (token: string): string => {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
};

/** How many lines an element's TEXT takes — off a Range over its contents,
 *  never its box: side by side a note's box is stretched to its row. */
const linesOf = (element: Element): number => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return Math.round(
    range.getBoundingClientRect().height /
      parseFloat(getComputedStyle(element).lineHeight),
  );
};

/** The words a story hands the pair. */
type Args = Pick<BeforeAfterProps, 'images' | 'headings' | 'notes'>;

/** One half's boxes: its figure, its heading and note when the pair has
 *  them, and its picture's box. */
type Half = Readonly<{
  figure: HTMLElement;
  heading: HTMLElement | undefined;
  box: HTMLElement;
  note: HTMLElement | undefined;
}>;

/**
 * THE INSTANCE: two figures in reading order, before then after, each holding
 * exactly its parts — the heading's <figcaption> first when the pair has
 * headings, the picture's box, the note's <p> last when it has notes — each
 * part its own half's words, each picture named by its alt; the line between
 * them, one decoration hidden from assistive technology. Returns the parts,
 * the faces loaded.
 */
const expectInstance = async (canvasElement: HTMLElement, args: Args) => {
  const figures = within(canvasElement).getAllByRole('figure');
  await expect(figures).toHaveLength(2);
  const grid = htmlElement(figures[0].parentElement, 'grid');
  const halves: Half[] = [];
  for (const [index, side] of (['before', 'after'] as const).entries()) {
    const figure = figures[index];
    const children = [...figure.children].map((child, place) =>
      htmlElement(child, `${side} half, part ${place + 1}`),
    );
    await expect(children.map((child) => child.tagName)).toEqual([
      ...(args.headings ? ['FIGCAPTION'] : []),
      'DIV',
      ...(args.notes ? ['P'] : []),
    ]);
    const heading = args.headings ? children[0] : undefined;
    const note = args.notes ? children.at(-1) : undefined;
    const box = children[args.headings ? 1 : 0];
    if (heading !== undefined) {
      await expect(heading.textContent).toBe(args.headings?.[side]);
      // The owner's "heading left oriented": start, on the element itself.
      await expect(getComputedStyle(heading).textAlign).toBe('start');
      await loadFace(heading);
    }
    if (note !== undefined) {
      await expect(note.textContent).toBe(args.notes?.[side]);
      await loadFace(note);
    }
    await expect(
      within(figure).getByRole('img', { name: args.images[side].alt }),
    ).toBeInTheDocument();
    halves.push({ figure, heading, box, note });
  }
  const line = htmlElement(grid.children[1], 'line');
  await expect(line).toHaveAttribute('aria-hidden', 'true');
  return {
    grid,
    root: htmlElement(grid.parentElement, 'root'),
    line,
    halves,
    parts: 1 + (args.headings ? 1 : 0) + (args.notes ? 1 : 0),
  };
};

type Parts = Awaited<ReturnType<typeof expectInstance>>;

/** WHERE THE PAIR STANDS SIDE BY SIDE, derived rather than assumed: the
 *  root's own `@lg`, 32rem. */
const inRow = ({ root }: Parts): boolean =>
  px(getComputedStyle(root).width) >= rem(32);

/** THE LINE'S PAINT: the floss ribbon's colour, read off a probe that asks
 *  for `var(--ribbon)` — the thread the doctor cards' band draws. */
const expectRibbonColour = async (line: HTMLElement): Promise<void> => {
  const probe = document.createElement('span');
  probe.style.backgroundColor = 'var(--ribbon)';
  document.body.append(probe);
  try {
    await expect(getComputedStyle(line).backgroundColor).toBe(
      getComputedStyle(probe).backgroundColor,
    );
  } finally {
    probe.remove();
  }
};

/**
 * THE NOTES, as the owner asked them: the grey ink (`--ink-faint`, the credo
 * ink of the doctor card's quote) and "a maximum of 2 rows" — each note's
 * text on two lines at most at the width this story draws it.
 */
const expectNotes = async ({ halves }: Parts): Promise<void> => {
  for (const { note } of halves) {
    if (note === undefined) continue;
    await expect(getComputedStyle(note).color).toBe(colourOf('--ink-faint'));
    await expect(linesOf(note)).toBeLessThanOrEqual(2);
  }
};

/**
 * THE LAYOUT, MEASURED — the row from the root's `@lg`, the stack under it —
 * and returned, so a story can say which arrangement it pinned. Side by side:
 * three tracks and as many rows as each half has parts, the line STANDING the
 * pair's full height (4px wide) with 1.5rem of air, both pictures LEVEL — one
 * top, one bottom, one width — each heading 1rem above its own picture and
 * each note 1rem under it, the notes' first lines level. Stacked: one track,
 * the line LYING DOWN across the full width (4px tall) between the two halves,
 * each heading 1rem above its picture and each note 1rem under it. In both:
 * the pictures 4:3.
 */
const expectLayout = async (parts: Parts): Promise<'row' | 'stack'> => {
  const { grid, root, line, halves } = parts;
  const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').map(px);
  const lineBox = line.getBoundingClientRect();
  const gridBox = grid.getBoundingClientRect();
  for (const { heading, box, note } of halves) {
    const { width, height, top, bottom } = box.getBoundingClientRect();
    await expect(Math.abs(height - width * 0.75)).toBeLessThanOrEqual(0.5);
    if (heading !== undefined) {
      await expect(
        Math.abs(top - heading.getBoundingClientRect().bottom - rem(1)),
      ).toBeLessThanOrEqual(1);
    }
    if (note !== undefined) {
      await expect(
        Math.abs(note.getBoundingClientRect().top - bottom - rem(1)),
      ).toBeLessThanOrEqual(1);
    }
  }
  await expectRibbonColour(line);

  if (inRow(parts)) {
    await expect(tracks).toHaveLength(3);
    await expect(
      getComputedStyle(grid).gridTemplateRows.split(' '),
    ).toHaveLength(parts.parts);
    await expect(tracks[1]).toBeCloseTo(rem(0.25), 1);
    await expect(lineBox.width).toBeCloseTo(rem(0.25), 1);
    // Standing, the whole pair's height.
    await expect(Math.abs(lineBox.top - gridBox.top)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(lineBox.height - gridBox.height)).toBeLessThanOrEqual(
      0.5,
    );
    // Between the two halves, 1.5rem of air on either side.
    await expect(
      Math.abs(
        lineBox.left -
          halves[0].figure.getBoundingClientRect().right -
          rem(1.5),
      ),
    ).toBeLessThanOrEqual(0.5);
    // THE PICTURES STAY LEVEL: one top, one bottom, one width.
    const [first, second] = halves.map(({ box }) =>
      box.getBoundingClientRect(),
    );
    await expect(Math.abs(first.top - second.top)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(first.bottom - second.bottom)).toBeLessThanOrEqual(
      0.5,
    );
    await expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(0.5);
    const [one, two] = halves.map(({ note }) => note);
    if (one !== undefined && two !== undefined) {
      await expect(
        Math.abs(
          one.getBoundingClientRect().top - two.getBoundingClientRect().top,
        ),
      ).toBeLessThanOrEqual(0.5);
    }
    return 'row';
  }

  await expect(tracks).toHaveLength(1);
  // Lying down, the whole column's width, between the two halves.
  await expect(
    Math.abs(lineBox.width - root.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(0.5);
  await expect(lineBox.height).toBeCloseTo(rem(0.25), 1);
  await expect(lineBox.top).toBeGreaterThan(
    halves[0].figure.getBoundingClientRect().bottom,
  );
  await expect(lineBox.bottom).toBeLessThan(
    halves[1].figure.getBoundingClientRect().top,
  );
  return 'stack';
};

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  not the pair, not either half, not the page. */
const expectNoSidewaysScroll = async (parts: Parts): Promise<void> => {
  for (const element of [
    parts.root,
    ...parts.halves.map(({ figure }) => figure),
  ]) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  }
  // The page measured by the root's own BOX, which ends where a reserved
  // scrollbar gutter begins — never by `clientWidth`, which in a Vitest
  // runner's frame is the whole window, the 15px gutter included, and so
  // let up to 15px of real overflow through (PostHeader.stories.tsx's
  // NOTHING SIDEWAYS, the same reading; the round-3 a11y review, 2026-10-20).
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(page.getBoundingClientRect().width),
  );
};

/** The whole play every story runs — the instance, the notes, the layout, the
 *  page — returning the arrangement it found. */
const playPair = async (
  canvasElement: HTMLElement,
  args: Args,
): Promise<{ parts: Parts; shape: 'row' | 'stack' }> => {
  const parts = await expectInstance(canvasElement, args);
  await expectNotes(parts);
  const shape = await expectLayout(parts);
  await expectNoSidewaysScroll(parts);
  return { parts, shape };
};

const meta = {
  title: 'Sections/BeforeAfter',
  component: BeforeAfter,
  parameters: { layout: 'fullscreen' },
  decorators: [withArticleColumn],
  args: { images: IMAGES },
  argTypes: {
    images: {
      control: 'object',
      description:
        'The two pictures — each under public/images/ with its alt, which describes the picture in words: at least one letter, or sections/PostPhoto refuses it — in PostPhoto’s 4:3 box; the before first: left side by side, upper when stacked. Without headings the alts alone say which half is which, so they open on „Înainte: " / „După: " — the caller’s duty; the section checks it nowhere',
    },
    headings: {
      control: 'object',
      description:
        'Optional — a heading over EACH picture or over neither, any words („Înainte" / „După" or others), showing text on both or on neither; each captions its figure, read inside it by a screen reader (its name only under HTML-AAM’s rule, which Chromium 151 does not apply — measured 2026-10-20), so the two must tell the halves apart',
    },
    notes: {
      control: 'object',
      description:
        'Optional — a grey note under EACH picture or under neither, finished with its lead-in („Notă: …"), showing text on both or on neither; two lines at most is the data’s rule',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the root (§6.8)',
    },
  },
} satisfies Meta<typeof BeforeAfter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * HEADINGS AND NOTES — the demo article's pair: „Înainte" over the treatment
 * room and „După" over the instruments, the grey note under each, the faint
 * lilac line between them — side by side wherever the article's column holds
 * 32rem, stacked on a phone. Unpinned: the play proves whichever arrangement
 * it is handed — and, at the Vitest run's 1200px window, that it is the row.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  args: { headings: HEADINGS, notes: NOTES },
  play: async ({ args, canvasElement }) => {
    const { shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 1200) await expect(shape).toBe('row');
  },
};

/**
 * THE HEADINGS ALONE — no notes: each half its heading over its picture, the
 * pair ending with the pictures' bottom edge. Pinned to the smartphone (390):
 * the article's column is 351px there, under the root's 32rem, so the Vitest
 * run proves THE STACK as it was before the halves became blog photos —
 * „Înainte" and its picture, the line lying across the column, „După" and its
 * picture (BeforeAfter.scale.test.tsx holds every position).
 */
export const HeadingsOnly: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: { headings: HEADINGS },
  play: async ({ args, canvasElement }) => {
    const { shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 390) await expect(shape).toBe('stack');
  },
};

/**
 * THE NOTES ALONE — no headings: each half its picture and its grey note, so
 * the figures are unnamed (a note is no caption) and the alts, opening on
 * „Înainte:" and „După:", say which half is which. Pinned to the laptop, so
 * the Vitest run proves the pair SIDE BY SIDE on two rows — the pictures
 * level at the pair's top, the notes under them.
 */
export const NotesOnly: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { images: HEADLESS_IMAGES, notes: NOTES },
  play: async ({ args, canvasElement }) => {
    const { parts, shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 1536) await expect(shape).toBe('row');
    for (const { figure } of parts.halves) {
      await expect(figure.querySelector('figcaption')).toBeNull();
    }
  },
};

/**
 * THE PICTURES ALONE — neither headings nor notes: the two photographs and
 * the line between them, and nothing else on screen; the alts, opening on
 * „Înainte: " and „După: ", say which half is which. Unpinned, like Default:
 * at the Vitest run's 1200px window the play asserts the row.
 */
export const PicturesOnly: Story = {
  globals: { locale: 'ro' },
  args: { images: HEADLESS_PICTURES },
  play: async ({ args, canvasElement }) => {
    const { parts, shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 1200) await expect(shape).toBe('row');
    for (const { figure } of parts.halves) {
      await expect(figure.children).toHaveLength(1);
    }
  },
};

/**
 * THE HEADINGS REPLACED — "not mandatory before and after": „Ianuarie" and
 * „Aprilie, după trei luni de periaj" over the two pictures, with the notes.
 * Pinned to the laptop: SIDE BY SIDE the second heading takes two lines
 * beside the first's one, and the pictures stay LEVEL — the shorter heading
 * seated on its own picture.
 */
export const ReplacedHeadings: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { headings: REPLACED, notes: NOTES },
  play: async ({ args, canvasElement }) => {
    const { parts, shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 1536) {
      await expect(shape).toBe('row');
      // THE PREMISE: the two headings really take different line counts.
      const [short, long] = parts.halves.map(({ heading }) =>
        linesOf(htmlElement(heading, 'heading')),
      );
      await expect(short).toBe(1);
      await expect(long).toBeGreaterThan(1);
    }
  },
};

/**
 * THE GERMAN STRESS, at the 320px accessibility width (§7) as well as the
 * net's two — the 'stress-320' tag — and pinned there, so the Vitest run
 * proves THE STACK under the longest words: each heading wraps across the
 * column at the `subhead` step, never hyphenated (PostPhoto's A CAPTION
 * NEVER SPLITS A WORD — the play reads it) and broken by PostPhoto's belt
 * only where a word cannot fit its line, each note within two lines; nothing
 * may push the page sideways. At 1536 the net photographs the same words side
 * by side, the long heading beside „Nachher".
 */
export const GermanStress: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'stress320' } },
  args: GERMAN,
  play: async ({ args, canvasElement }) => {
    const { parts, shape } = await playPair(canvasElement, args);
    if (window.innerWidth === 320) await expect(shape).toBe('stack');
    // PostPhoto's belts reached the real sheet, on both words of both halves
    // — and its heading's A CAPTION NEVER SPLITS A WORD.
    for (const { heading, note } of parts.halves) {
      for (const [words, name] of [
        [heading, 'heading'],
        [note, 'note'],
      ] as const) {
        await expect(
          getComputedStyle(htmlElement(words, name)).overflowWrap,
        ).toBe('anywhere');
      }
      await expect(
        getComputedStyle(htmlElement(heading, 'heading')).hyphens,
      ).toBe('none');
    }
  },
};
