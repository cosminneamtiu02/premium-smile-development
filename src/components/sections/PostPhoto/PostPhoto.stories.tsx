import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import {
  PostPhoto,
  type PostPhotoContent,
  type PostPhotoImage,
} from './PostPhoto';

// FIVE stories: the four instances the owner listed — verbatim (2026-10-15):
// "also add an instance of the single blog image with note, with heading and
// no not and without no heading nor not and with note no heading" — heading
// and note (Default), heading alone, note alone, the picture alone, and the
// German stress. The export NAMES are load-bearing — each names a baseline
// file (`sections/post-photo/default-…`) — so this list IS the section's
// contribution to a lane's visual manifest. `Sections/*` routes every story to
// 390 + 1536 (tests/visual/stories.spec.ts, §13). GermanStress pins the 320px
// stress width for the Vitest storybook run only — the net sets its own page
// size per project — so that run proves the narrowest column.
//
// ── THE WORDS are Romanian with diacritics (§15.7) — demo copy, every note
// finished with its lead-in („Notă: …", German „Hinweis: …") the way the
// route hands it over, and short enough to sit on two lines at most (the
// owner's "maximum of 2 rows" — the plays measure it). The pictures are the
// clinic's three photographs and the Image atom's demo one, each alt saying
// what the picture shows.
//
// ── THE DECORATOR IS THE ARTICLE'S COLUMN (sections/BeforeAfter's stories'
// frame): the page-band recipe — a full-bleed <section> that paints, a
// ui/Container that measures — holding a STAND-IN for the article's 42rem
// measure, an inline width, because the measure's own utility ships with
// sections/PostPage and a story must not ship a CSS rule nothing else wears
// (Tailwind reads every scanned file). Outside THE BAND SCALE, as there: the
// stories photograph the theme's look; PostPhoto.scale.test.tsx measures the
// scaled one. `layout: 'fullscreen'` keeps Storybook's own padding out.
//
// ── WHAT THE PLAYS READ, after the real faces are loaded (Storybook's fonts
// are `font-display: block` — a note measured in the fallback face wraps
// differently): the parts in reading order, the note's COMPUTED paint — the
// credo ink, the regular weight, upright, 16px, the body's face, start-aligned
// — and its line count, the picture 4:3 across the figure, 1rem between the
// parts, and no sideways scroll. The figure's NAME comes from its
// <figcaption> under HTML-AAM's rule — a rule Chromium 151 does not apply
// (measured 2026-10-20: its own accessibility tree names such a figure "";
// Firefox and WebKit not measured), while a screen reader still reads the
// caption inside the figure (PostPhoto.tsx's THE HEADING). Testing Library's
// engine does not read a figcaption either, so the caption is checked as an
// element (PostPhoto.test.tsx asks Playwright's engine, which applies the
// rule, for the name). No play waits on a picture: in the
// Vitest run the optimizer's variants do not exist yet, every <img> 404s and
// falls back to its original file, and a play that awaited `decode()` could
// hang.

/** The clinic's treatment room — the hero slide's own alt (truthful). */
const TREATMENT_ROOM = {
  src: '/images/hero/treatment-room.jpg',
  alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
} as const satisfies PostPhotoImage;

/** The clinic's waiting room. */
const LOBBY = {
  src: '/images/hero/lobby.jpg',
  alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
} as const satisfies PostPhotoImage;

/** The handpieces on the dental unit's arm. */
const INSTRUMENTS = {
  src: '/images/hero/instruments.jpg',
  alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
} as const satisfies PostPhotoImage;

/** The Image atom's demo photograph — an examination seen up close. */
const EXAMINATION = {
  src: '/images/demo/hero-calm.jpg',
  alt: 'Prim-plan dintr-un control stomatologic: o oglindă dentară și o sondă, ținute de mâini în mănuși',
} as const satisfies PostPhotoImage;

/** THE GERMAN STRESS — the longest heading, with a long compound, and the
 *  longest note, over the treatment room's German alt. */
const GERMAN = {
  heading:
    'Das Behandlungszimmer mit dem Bildschirm für die Panoramaröntgenaufnahme',
  image: {
    src: '/images/hero/treatment-room.jpg',
    alt: 'Ein Behandlungszimmer mit dem Behandlungsstuhl und, an der Wand, einem Bildschirm mit einem Panoramaröntgenbild',
  },
  note: 'Hinweis: Die Abbildung dient nur der Illustration.',
} as const satisfies PostPhotoContent;

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

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing (PostPhoto.scale.test.tsx's helper of the same name). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PostPhoto story: no ${name}`);
  }
  return node;
};

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The face an element's text is laid out in, loaded before anything is
 *  measured (the BeforeAfter / PostCard / DoctorIntro idiom). */
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

/**
 * THE PARTS, IN READING ORDER: the heading's <figcaption> first when there is
 * one, the picture's box, the note's <p> last when there is one — each holding
 * exactly its words, the picture named by its alt. Returns them, the faces
 * loaded.
 */
const expectParts = async (
  canvasElement: HTMLElement,
  args: PostPhotoContent,
) => {
  const figure = within(canvasElement).getByRole('figure');
  const children = [...figure.children];
  const caption = args.heading
    ? htmlElement(children[0], 'caption')
    : undefined;
  const note = args.note ? htmlElement(children.at(-1), 'note') : undefined;
  const box = htmlElement(children[args.heading ? 1 : 0], 'picture box');
  await expect(children.map((child) => child.tagName)).toEqual([
    ...(args.heading ? ['FIGCAPTION'] : []),
    'DIV',
    ...(args.note ? ['P'] : []),
  ]);
  if (caption !== undefined) {
    await expect(caption.textContent).toBe(args.heading);
    await loadFace(caption);
  }
  if (note !== undefined) {
    await expect(note.textContent).toBe(args.note);
    await loadFace(note);
  }
  await expect(
    within(figure).getByRole('img', { name: args.image.alt }),
  ).toBeInTheDocument();
  return { figure, caption, box, note };
};

/**
 * THE NOTE, GREY AND UNEMPHASISED — what the engine paints: the credo ink
 * (`--ink-faint`), the regular weight, upright, 16px, the body's own face, no
 * decoration, start-aligned — and the owner's "maximum of 2 rows": no taller
 * than two of its lines.
 */
const expectNote = async (note: HTMLElement): Promise<void> => {
  const style = getComputedStyle(note);
  await expect(style.color).toBe(colourOf('--ink-faint'));
  await expect(style.fontWeight).toBe('400');
  await expect(style.fontStyle).toBe('normal');
  await expect(Math.abs(parseFloat(style.fontSize) - rem(1))).toBeLessThan(
    0.01,
  );
  await expect(style.fontFamily).toBe(
    getComputedStyle(document.body).fontFamily,
  );
  await expect(style.textDecorationLine).toBe('none');
  await expect(style.textAlign).toBe('start');
  await expect(note.getBoundingClientRect().height).toBeLessThanOrEqual(
    2 * parseFloat(style.lineHeight) + 0.5,
  );
};

/**
 * THE LAYOUT: the picture's box as wide as the figure and three quarters as
 * tall, the heading 1rem above it and the note 1rem under it.
 */
const expectLayout = async ({
  figure,
  caption,
  box,
  note,
}: Awaited<ReturnType<typeof expectParts>>): Promise<void> => {
  const frame = box.getBoundingClientRect();
  await expect(
    Math.abs(frame.width - figure.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(0.5);
  await expect(Math.abs(frame.height - frame.width * 0.75)).toBeLessThanOrEqual(
    0.5,
  );
  if (caption !== undefined) {
    await expect(
      Math.abs(frame.top - caption.getBoundingClientRect().bottom - rem(1)),
    ).toBeLessThanOrEqual(1);
  }
  if (note !== undefined) {
    await expect(
      Math.abs(note.getBoundingClientRect().top - frame.bottom - rem(1)),
    ).toBeLessThanOrEqual(1);
  }
};

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  not the photo, not the page: the page measured by the root's own BOX,
 *  which ends where a reserved scrollbar gutter begins. Never by its
 *  `clientWidth`: in a Vitest runner's frame that is the whole window, the
 *  15px gutter included, so a check against it lets 15px of overflow
 *  through (PostList.stories.tsx's expectNoSidewaysScroll, measured). */
const expectNoSidewaysScroll = async (figure: HTMLElement): Promise<void> => {
  await expect(figure.scrollWidth).toBeLessThanOrEqual(figure.clientWidth);
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(page.getBoundingClientRect().width),
  );
};

/** The whole play every story runs: the parts, the note, the layout, the
 *  page — whichever parts the story's instance has. */
const playPhoto = async (
  canvasElement: HTMLElement,
  args: PostPhotoContent,
): Promise<void> => {
  const parts = await expectParts(canvasElement, args);
  if (parts.note !== undefined) await expectNote(parts.note);
  await expectLayout(parts);
  await expectNoSidewaysScroll(parts.figure);
};

const meta = {
  title: 'Sections/PostPhoto',
  component: PostPhoto,
  parameters: { layout: 'fullscreen' },
  decorators: [withArticleColumn],
  args: { image: TREATMENT_ROOM },
  argTypes: {
    heading: {
      control: 'text',
      description:
        'Optional — the figure’s caption over the picture, start-aligned, never hyphenated, at the article subheadings’ 24px',
    },
    image: {
      control: 'object',
      description:
        'The picture under public/images/ and its alt (at least one visible letter), in a 4:3 box as wide as the figure',
    },
    note: {
      control: 'text',
      description:
        'Optional — the grey note under the picture, finished with its lead-in („Notă: …"); two lines at most, at the default text size, is the data’s rule',
    },
    sizes: {
      control: false,
      description:
        'The picture’s `sizes` — the article measure’s by default; a composer that draws the photo narrower passes its own',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the figure (§6.8)',
    },
  },
} satisfies Meta<typeof PostPhoto>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * HEADING AND NOTE — „Cabinetul de tratament" over the treatment room, and
 * under it the grey note: the whole blog photo, the measure's width.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  args: {
    heading: 'Cabinetul de tratament',
    note: 'Notă: fotografie din cabinetul nostru.',
  },
  play: async ({ args, canvasElement }) => {
    await playPhoto(canvasElement, args);
  },
};

/**
 * THE HEADING ALONE — „Sala de așteptare" over the waiting room, no note: the
 * picture is the figure's last part.
 */
export const HeadingOnly: Story = {
  globals: { locale: 'ro' },
  args: { heading: 'Sala de așteptare', image: LOBBY },
  play: async ({ args, canvasElement }) => {
    await playPhoto(canvasElement, args);
  },
};

/**
 * THE NOTE ALONE — the handpieces, and under them the grey note, no heading:
 * the picture is the figure's first part, and the figure is unnamed (a note
 * is no caption).
 */
export const NoteOnly: Story = {
  globals: { locale: 'ro' },
  args: {
    image: INSTRUMENTS,
    note: 'Notă: imaginea este cu titlu ilustrativ.',
  },
  play: async ({ args, canvasElement }) => {
    await playPhoto(canvasElement, args);
    // No caption, so nothing names the figure.
    await expect(
      within(canvasElement).getByRole('figure').querySelector('figcaption'),
    ).toBeNull();
  },
};

/**
 * THE PICTURE ALONE — neither heading nor note: the 4:3 photograph across the
 * measure, and nothing else.
 */
export const PictureOnly: Story = {
  globals: { locale: 'ro' },
  args: { image: EXAMINATION },
  play: async ({ args, canvasElement }) => {
    await playPhoto(canvasElement, args);
    await expect(
      within(canvasElement).getByRole('figure').children,
    ).toHaveLength(1);
  },
};

/**
 * THE GERMAN STRESS — the longest heading, „Panoramaröntgenaufnahme" in it,
 * and the longest note, pinned to the 320px stress width for the Vitest run:
 * the heading wraps across the column at the `subhead` step, never
 * hyphenated, and broken by its belt only where a word cannot fit its line;
 * the note stays within two lines; nothing pushes the page sideways.
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'stress320' } },
  args: GERMAN,
  play: async ({ args, canvasElement }) => {
    await playPhoto(canvasElement, args);
    // THE BELT reached the real sheet, on both words — and the heading's
    // `hyphens-none` too: a caption never splits a word (PostPhoto.tsx's
    // THE HEADING).
    const figure = within(canvasElement).getByRole('figure');
    const heading = htmlElement(figure.firstElementChild, 'heading');
    const note = htmlElement(figure.lastElementChild, 'note');
    for (const words of [heading, note]) {
      await expect(getComputedStyle(words).overflowWrap).toBe('anywhere');
    }
    await expect(getComputedStyle(heading).hyphens).toBe('none');
  },
};
