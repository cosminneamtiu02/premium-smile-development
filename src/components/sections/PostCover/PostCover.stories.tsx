import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { PostCover, type PostCoverOwnProps } from './PostCover';

// SEVEN stories: the build contract's six — the everyday cover, a post with
// no categories, three long categories, the two pinned widths the §13 matrix
// samples for this tier, and the 320px accessibility width — and, since the
// a11y review of 2026-10-20, the German stress at that same width. The export
// NAMES are load-bearing — each names a baseline file
// (`sections/post-cover/default-…`) — so this list IS the section's
// contribution to a lane's visual manifest. `Sections/*` routes every story
// to 390 + 1536 (tests/visual/stories.spec.ts, §13), and the 'stress-320' tag
// adds the 320 width to Stress320 and GermanStress. Smartphone and Laptop
// photograph the same frames as Default there (the net ignores pins) — a
// harmless duplicate, kept because their PLAYS are what the pins buy: the
// Vitest storybook project renders each at its pinned width, so the two
// shapes the cover takes are proven at widths that decide them.
//
// ── THE COVER IS ROMANIAN BY DEFAULT (§15.7): the reading time the route
// prints („4 min de citit"), the clinic's lobby photograph with its own alt,
// and the blog's real categories — „igienă" and „sfaturi" (the owner's
// example), and for the stress three long ones the blog's posts carry (14,
// 13 and 9 letters).
// GERMAN IS THE STRESS LANGUAGE (§13): the blog and its articles are in
// every language since 2026-10-14 (§15.39 round 3), so GermanStress lays the
// cover out at 320 in de.json's own words — „4 Min. Lesezeit", „Kategorien",
// the share controls' names — under the widest three tags German can bring
// (GERMAN, below).
//
// ── THE DECORATOR IS THE ARTICLE PAGE'S STRUCTURE (sections/PostPage, the
// build contract's §2): a full-bleed <section> that paints, ui/Container that
// measures the column, and the RHYTHM BOX inside it wearing ui/Container's
// two band strings — `bandColumnClasses` and `bandScaleClasses` — as PostPage
// wears them, a flex column that stretches the cover across it. So on a
// laptop or desktop with a mouse the cover is drawn in THE BAND SCALE's
// design pixel exactly as on the page (§15.32), and every play reads that
// pixel off the rhythm box before it measures anything. Not decoration: the
// cover's root is a container — inline-size containment — so it must sit in
// a width-giving parent, and its `sizes` is derived from this very column.
// `layout: 'fullscreen'` keeps Storybook's own padding out of the band.
//
// ── THE SHARE SLOT IS A STAND-IN: four 44px targets 8px apart, a bullet for
// each icon and the word for the ear only — sections/ShareLinks' icons-only
// shape, the one it takes under the cover's `@2xl`, so the row is as wide as
// the real one where the line is short enough to wrap. It is not a control:
// nothing here is focusable. Its words are the story's language's — the
// message files' own share names (ro.json's, de.json's for GermanStress), so
// a screen reader never meets Romanian under `lang="de"`. The real controls
// (and their labelled shape on a wide cover) are ShareLinks' own lane's,
// composed by PostPage's stories.
//
// ── WHAT THE PLAYS READ (`expectCover`), each DERIVED from the cover it
// measures — never from the pinned width, because the visual net shoots every
// story at 390 and 1536 whatever its pin says: the reading time is muted body
// text at the row's start, in a box of its own — on one line as tall as the
// line (at rest, the controls), from the line's top, the reading time's WORDS
// level with the controls (a Range around its text, never its paragraph's
// box) and its paragraph shorter than the box; wrapped, its own height
// (PostCover's THE READING TIME'S BOX); the slot's right edge
// is the picture's (within 1px), on the reading time's line or — when the
// line is too short — one gap under it; the picture is 3:2 under the cover's
// `@2xl` (42rem of the root)
// and 2:1 from it; the chips are drawn in THEIR OWN PIXEL (PostCover's THE
// CHIPS FOLLOW THEIR COVER) — sections/PostCard's formula, the cover's width
// over the owner's reference never under the 12px label's floor, capped at
// the page's own pixel (the design pixel inside the scale, a sixteenth of the
// root outside it): its numbers read off the list's class, its declaration
// found by NAME and never spelled whole here (Tailwind reads stories too, and
// tests/unit/design-scale.test.ts holds every scanned file to its D-LIT
// RULE), the engine's own pixel held to it, and in it every chip the atom's
// own — 44 tall, 20 of padding, an 18 label — the FIRST tag the rightmost
// chip, 12 of those pixels (three of the chips' steps) in from the picture's
// top and right edges, the chips 12 apart; no chip leaves the picture — the
// one check that sees a tag too long for its line, which `flex-row-reverse`
// pushes out to the LEFT, where no scroll width grows; every chip is a TAG,
// not a button — the lavender edge and label on its own white face, and not
// one `hover:` utility in its class list (THE HOVER, below); nothing scrolls
// sideways — the cover by its own box, the page by the ROOT's box, which ends
// where a reserved scrollbar gutter begins: never by the root's
// `clientWidth`, which in a Vitest runner's frame is the whole window, the
// 15px gutter included, so a check against it lets 15px of overflow through
// (PostList.stories.tsx's expectNoSidewaysScroll, and its reason). The exact
// readings at given cover widths, the root's font size and the guard are
// PostCover.scale.test.tsx's.
// The real faces are loaded first (Storybook's fonts are `font-display:
// block`, PR #125's lesson). No play waits on the picture: in the Vitest run
// the optimizer's variants do not exist yet, every <img> 404s and falls back
// to its original file, and a play that awaited `decode()` could hang.
//
// ── THE HOVER. The owner, 2026-10-14, on these chips: "it should always have
// the current hover aspect on it no matter what and houls not be dinamic, i
// do not want to give impression of a button" — so a chip must change
// nothing under a pointer. The plays read that off the CHIP: the still face
// above, and not one `hover:` utility in its class list (ui/PillButton's
// THE TAG — a tag's face is spelled with no hover variant at all), which is
// what makes a pointer powerless, in every engine and every runner — the
// Vitest storybook project, Storybook's UI and the visual net alike. Until
// the rebase onto develop's multilingual blog (2026-10-15) the plays drove
// the Vitest runner's REAL pointer over each chip instead; in the full run,
// beside develop's heavier stories, that Playwright hover stalled — MEASURED:
// it never got past resolving the chip, a 15 s timeout in five of six full
// runs while the file alone passed in under half a second — so the static
// read replaced it, develop's own way of proving a hover in a story (sections/
// PostCard's stories read the compiled rules instead of hovering). The same
// rule is held where a test renders the atom whole: PostCover.test.tsx's TAG
// case, and ui/PillButton's own suite. (No 'pin-hover' tag: the net's hover
// lands on the first button or link in the canvas, and this cover has none.)

/** The cover as the article page hands it over — the share slot apart. */
const COVER = {
  readingTime: '4 min de citit',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
  },
  tags: ['igienă', 'sfaturi'],
  tagsLabel: 'Categorii',
} as const satisfies Omit<PostCoverOwnProps, 'share'>;

/** Three long categories the blog's posts carry (14, 13 and 9 letters) —
 *  three single-word chips that cannot wrap, so the LIST does. */
const LONG_TAGS = ['parodontologie', 'implantologie', 'prevenție'] as const;

/** THE GERMAN STRESS (the header): de.json's own reading time and list name,
 *  the lobby photograph's German alt (lib/hero-slides' row), and the three
 *  tags lib/blog's MAX_TAGS allows, the widest German can bring:
 *  „Kieferorthopädie", the widest chip the blog ships in any language
 *  (PostCard's GermanStress), „Wurzelbehandlungen", the 18-letter compound
 *  tests/unit/blog-data.test.ts names as its ceiling's worst case — a
 *  category no post carries yet — and „Parodontologie". German starts each
 *  with a capital, as it writes its nouns. */
const GERMAN = {
  readingTime: '4 Min. Lesezeit',
  image: {
    src: '/images/hero/lobby.jpg',
    alt: 'Das Wartezimmer der Klinik mit gelben Sesseln und einer offenen Tür zu einem Behandlungszimmer',
  },
  tags: ['Kieferorthopädie', 'Wurzelbehandlungen', 'Parodontologie'],
  tagsLabel: 'Kategorien',
} as const satisfies Omit<PostCoverOwnProps, 'share'>;

/** The share slot's words in one language: the list's name and the four
 *  channels the article page offers (the owner's answer: Facebook ·
 *  WhatsApp · E-mail · Copy link), as the message files name them. */
type ShareWords = { label: string; channels: readonly string[] };

/** ro.json's words (blog.article.share) — the stand-in's default. */
const SHARE_RO: ShareWords = {
  label: 'Distribuie articolul',
  channels: ['Facebook', 'WhatsApp', 'E-mail', 'Copiază linkul'],
};

/** de.json's words (blog.article.share), for GermanStress. */
const SHARE_DE: ShareWords = {
  label: 'Artikel teilen',
  channels: ['Facebook', 'WhatsApp', 'E-Mail', 'Link kopieren'],
};

/** THE SHARE SLOT'S STAND-IN (the header): ShareLinks' icons-only shape —
 *  four 44px targets, a bullet for each icon, the word sr-only — in the
 *  story's language. */
const ShareStandIn = ({
  words = SHARE_RO,
}: {
  words?: ShareWords;
}): ReactElement => (
  <ul role="list" aria-label={words.label} className="flex items-center gap-2">
    {words.channels.map((word) => (
      <li
        key={word}
        className="flex size-11 items-center justify-center text-lg text-ink"
      >
        <span aria-hidden="true">•</span>
        <span className="sr-only">{word}</span>
      </li>
    ))}
  </ul>
);

/** The article page's band, as PostPage builds it (the header). */
const Band = ({ children }: { children: ReactNode }): ReactElement => (
  <section className="bg-page">
    <Container>
      <div
        className={cx(
          bandColumnClasses,
          bandScaleClasses,
          'flex flex-col py-10',
        )}
      >
        {children}
      </div>
    </Container>
  </section>
);

const withBand: Decorator = (Story) => (
  <Band>
    <Story />
  </Band>
);

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP in rem of the root; THE
 *  STEP's two halves, `@4xl`'s 56rem and the floor's 896px. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** CSS px per rem — the root's, which a container query's rem reads. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The design pixel's NAME (PostCover's CHIP_SCALE declares it on the tag
 *  list), and the guard both of CHIP_SCALE's classes ride (THE GUARD). */
const PIXEL = '--scale-px';
const GUARD = 'supports-[width:1cqw]:';

/**
 * THE CHIPS' OWN PIXEL, as the stylesheet computes it: the smaller of the
 * page's own pixel — `cap`, the unit the play found the cover in — and the
 * card's formula, the larger of the floor (FLOOR rem over DIVISOR) and the
 * cover's width over the owner's reference: the three numbers read off the
 * list's own class (its declaration behind the guard). The pattern is built
 * from strings, so no bracketed declaration stands in this file's text (the
 * header's WHAT THE PLAYS READ). Throws by name when the declaration is
 * missing or its shape moved.
 */
const chipPixelOf = (
  list: Element,
  coverWidth: number,
  cap: number,
): number => {
  const open = '[';
  const declaration = (list.getAttribute('class') ?? '')
    .split(/\s+/)
    .find((token) => token.startsWith(`${GUARD}${open}${PIXEL}:`))
    ?.slice(GUARD.length);
  const number = '(\\d+(?:\\.\\d+)?)';
  const shape = new RegExp(
    `^\\${open}${PIXEL}:min\\(var\\(--tags-cap\\),max\\(calc\\(${number}rem/${number}\\),calc\\(100cqw/${number}\\)\\)\\)\\]$`,
  ).exec(declaration ?? '');
  if (!shape?.[1] || !shape[2] || !shape[3]) {
    throw new Error(
      `PostCover stories: the tag list's pixel moved — ${declaration ?? 'none'}`,
    );
  }
  return Math.min(
    cap,
    Math.max(
      (Number(shape[1]) * rem()) / Number(shape[2]),
      coverWidth / Number(shape[3]),
    ),
  );
};

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

/** The face an element's text is laid out in, loaded before anything is
 *  measured — Blog.stories.tsx's `loadFace`, for one element (the cover has
 *  no <h1>; its words are the reading time and the chips). */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** A semantic colour token as the engine computes it — a probe wearing it. */
const colourOf = (token: string): string => {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};

const middle = (box: DOMRect): number => (box.top + box.bottom) / 2;

/** A chip's three colours, as the engine computes them. */
const paintOf = (
  chip: Element,
): { edge: string; label: string; ground: string } => {
  const style = getComputedStyle(chip);
  return {
    edge: style.borderTopColor,
    label: style.color,
    ground: style.backgroundColor,
  };
};

/**
 * The unit every theme length of the cover is drawn in, where the play finds
 * itself: the design pixel inside THE BAND SCALE — a fine primary pointer, an
 * engine that registers custom properties, a column of max(56rem, 896px):
 * min(column, 96rem) / 1106 — and a sixteenth of the root outside it (rem,
 * §7). Cross-checked against what the rhythm box declares.
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
  if (scaled) {
    await near(
      parseFloat(getComputedStyle(rhythm).getPropertyValue('--scale-px')),
      unit,
      'the design pixel',
      0.0001,
    );
  } else {
    await expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
  }
  return { unit, scaled };
};

/** The shape a play found the cover in — for a story to hold at its pin. */
type CoverShape = {
  /** The reading time and the slot on one line. */
  oneLine: boolean;
  /** The picture 2:1 — the cover at least its `@2xl` wide. */
  wide: boolean;
  /** Drawn in THE BAND SCALE's design pixel. */
  scaled: boolean;
};

/**
 * THE COVER, MEASURED (the header's WHAT THE PLAYS READ) — every fact the
 * build contract names, at whatever width the play is handed, and the shape
 * it found, returned.
 */
const expectCover = async (
  canvasElement: HTMLElement,
  args: Pick<PostCoverOwnProps, 'readingTime' | 'tags' | 'tagsLabel'>,
): Promise<CoverShape> => {
  const canvas = within(canvasElement);
  const time = canvas.getByText(args.readingTime);
  const box = time.parentElement;
  const row = box?.parentElement;
  const cover = row?.parentElement;
  const rhythm = cover?.parentElement;
  const column = rhythm?.parentElement;
  const slot = row?.children[1];
  // The stand-in's list, the controls' band (the header's THE SHARE SLOT).
  const controls = slot?.firstElementChild;
  const picture = cover?.children[1];
  const photo = picture?.querySelector('img');
  if (
    !(box instanceof HTMLElement) ||
    row?.firstElementChild !== box ||
    !(row instanceof HTMLElement) ||
    !(cover instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(column instanceof HTMLElement) ||
    !(slot instanceof HTMLElement) ||
    !(controls instanceof HTMLElement) ||
    !(picture instanceof HTMLElement) ||
    !(photo instanceof HTMLImageElement)
  ) {
    throw new Error('PostCover story: the cover lost its structure.');
  }
  const list = canvas.queryByRole('list', { name: args.tagsLabel });
  const chips = list === null ? [] : within(list).getAllByRole('listitem');

  // The real faces first: the reading time's and the chips'.
  await loadFace(time);
  for (const chip of chips) await loadFace(chip);
  const { unit, scaled } = await unitOf(rhythm, column);

  // EVERY RECTANGLE OF THE ROW AND THE PICTURE, READ AT ONCE — before any
  // assertion awaits, so no two of them come from different layouts. The
  // reading time's WORDS are a Range around its text (THE READING TIME'S
  // BOX, below).
  const words = document.createRange();
  words.selectNodeContents(time);
  const coverWidth = cover.getBoundingClientRect().width;
  const rowBox = row.getBoundingClientRect();
  const boxBox = box.getBoundingClientRect();
  const timeBox = time.getBoundingClientRect();
  const wordsBox = words.getBoundingClientRect();
  const slotBox = slot.getBoundingClientRect();
  const controlsBox = controls.getBoundingClientRect();
  const pic = picture.getBoundingClientRect();
  const photoBox = photo.getBoundingClientRect();

  // THE READING TIME: ui/Text's muted body copy, at the row's start.
  await expect(time.tagName).toBe('P');
  await expect(getComputedStyle(time).color).toBe(colourOf('--ink-muted'));
  await near(
    parseFloat(getComputedStyle(time).fontSize),
    16 * unit,
    'the reading time on ui/Text’s 16px step',
    0.05,
  );
  await near(timeBox.left, pic.left, 'the reading time at the row’s start', 1);

  // THE SLOT: at the row's end — the picture's right edge — on the reading
  // time's line, both centred on it, or one gap under it when the line is too
  // short for both; at the end either way (the slot's auto start margin).
  await near(slotBox.right, pic.right, 'the slot at the row’s end', 1);
  const oneLine = slotBox.top < timeBox.bottom;
  // THE READING TIME'S BOX (PostCover's THE ROW): on one line the box is
  // stretched to the line — the row's one line; at rest, the controls'
  // height, the stand-in's 44 — and the reading time centred in its row
  // track, which never grows past the controls' step, so it stays level with
  // them however tall the slot grows under them (PostCover.scale.test.tsx's
  // THE ROW opens such a line); wrapped, the box is the reading time's own
  // height and the slot one gap under it. "Level" is read on the WORDS, a
  // Range around the text, never on the paragraph's box: a paragraph
  // stretched to the track keeps its box's middle on the controls' while its
  // words sit at its top — so the paragraph must also be shorter than its
  // box. Within 1px: Chromium floors the line's half-leading to a whole
  // pixel, so the words sit up to 63/64px above their line's middle.
  await near(
    boxBox.left,
    pic.left,
    'the reading time’s box at the row’s start',
    1,
  );
  if (oneLine) {
    await near(
      middle(wordsBox),
      middle(controlsBox),
      'one line, the reading time’s WORDS level with the controls',
      1,
    );
    await expect(
      timeBox.height,
      'the reading time’s paragraph, shorter than its box — never stretched to it',
    ).toBeLessThan(boxBox.height);
    await near(boxBox.top, rowBox.top, 'the box from the line’s top', 0.5);
    await near(
      boxBox.height,
      rowBox.height,
      'the box as tall as the line',
      0.5,
    );
  } else {
    await near(
      boxBox.height,
      timeBox.height,
      'the wrapped box, the reading time’s own height',
      0.5,
    );
    await near(
      slotBox.top - timeBox.bottom,
      8 * unit,
      'the wrapped slot one gap under the reading time',
    );
  }

  // THE PICTURE: 3:2 under the cover's `@2xl` (42rem of the root — Tailwind
  // writes the step into the query, never the design pixel), 2:1 from it;
  // the photograph fills its box.
  const wide = coverWidth >= 42 * rem();
  await near(
    pic.height,
    pic.width * (wide ? 1 / 2 : 2 / 3),
    wide ? 'the picture, 2:1' : 'the picture, 3:2',
  );
  await near(photoBox.width, pic.width, 'the photograph’s width');
  await near(photoBox.height, pic.height, 'the photograph’s height');

  // THE CHIPS: none without tags; else drawn in THEIR OWN PIXEL — the card's
  // formula under the page's own pixel, `unit` — and in it the atom's own
  // chip, the first tag the rightmost, 12 of the pixel (the `3` step) in from
  // the picture's top and right edges, the next ones to its left, 12 apart,
  // and every chip inside the picture.
  if (args.tags.length === 0) {
    await expect(list).toBeNull();
    await expect(picture.children).toHaveLength(1);
  } else {
    if (list === null) throw new Error('PostCover story: no tag list.');
    const chipPx = chipPixelOf(list, coverWidth, unit);
    const listStyle = getComputedStyle(list);
    await near(
      parseFloat(listStyle.getPropertyValue(PIXEL)),
      chipPx,
      'the chips’ own pixel — the card’s formula under the page’s',
      0.0001,
    );
    await near(
      parseFloat(listStyle.columnGap),
      12 * chipPx,
      'the chips 12 of their pixel apart',
      0.01,
    );
    for (const item of chips) {
      const style = getComputedStyle(item);
      await near(
        item.getBoundingClientRect().height,
        44 * chipPx,
        `„${item.textContent}", 44 of the chips’ pixel tall`,
      );
      await near(
        parseFloat(style.paddingInlineStart),
        20 * chipPx,
        `„${item.textContent}", 20 of the chips’ pixel of padding`,
        0.01,
      );
      await near(
        parseFloat(style.fontSize),
        18 * chipPx,
        `„${item.textContent}", a label 18 of the chips’ pixel`,
        0.01,
      );
    }
    await expect(chips.map((item) => item.textContent)).toEqual([...args.tags]);
    const boxes = chips.map((item) => item.getBoundingClientRect());
    const [first] = boxes;
    if (first === undefined) throw new Error('PostCover story: no chip.');
    for (const box of boxes) {
      await expect(box.right).toBeLessThanOrEqual(first.right + 0.5);
    }
    await near(
      pic.right - first.right,
      12 * chipPx,
      'the first chip, 12 of the chips’ pixel in from the picture’s right edge',
    );
    await near(
      first.top - pic.top,
      12 * chipPx,
      'the first chip, 12 of the chips’ pixel under the picture’s top edge',
    );
    const second = boxes[1];
    if (second !== undefined && Math.abs(second.top - first.top) < 1) {
      // On the first chip's line, the second tag sits to its LEFT.
      await expect(second.right).toBeLessThanOrEqual(first.left + 0.5);
    }
    for (const [index, box] of boxes.entries()) {
      const name = `chip ${index + 1} („${args.tags[index]}") inside the picture`;
      await expect(box.left, name).toBeGreaterThanOrEqual(pic.left - 0.5);
      await expect(box.right, name).toBeLessThanOrEqual(pic.right + 0.5);
      await expect(box.top, name).toBeGreaterThanOrEqual(pic.top - 0.5);
      await expect(box.bottom, name).toBeLessThanOrEqual(pic.bottom + 0.5);
    }

    // A TAG, NOT A BUTTON: every chip the lavender edge and label on its own
    // white face — and not one `hover:` utility in its class list, a plain
    // one or a group's, so a pointer has nothing to change (THE HOVER).
    const accent = colourOf('--accent');
    const white = colourOf('--surface');
    for (const [index, chip] of chips.entries()) {
      const name = `chip ${index + 1} („${args.tags[index]}")`;
      await expect(paintOf(chip), `${name}, the tag's face`).toEqual({
        edge: accent,
        label: accent,
        ground: white,
      });
      await expect(
        [...chip.classList].filter((token) => token.includes('hover:')),
        `${name}: no hover utility`,
      ).toEqual([]);
    }
  }

  // NOTHING SCROLLS SIDEWAYS — not the cover, not the page (§7, §9): the page
  // read by the ROOT's own box, never by its `clientWidth` (the header's WHAT
  // THE PLAYS READ).
  await expect(cover.scrollWidth).toBeLessThanOrEqual(cover.clientWidth);
  const page = document.documentElement;
  await expect(
    page.scrollWidth,
    'the page’s scroll width, against the root’s own box',
  ).toBeLessThanOrEqual(Math.ceil(page.getBoundingClientRect().width));

  return { oneLine, wide, scaled };
};

const meta = {
  title: 'Sections/PostCover',
  component: PostCover,
  parameters: { layout: 'fullscreen' },
  decorators: [withBand],
  // `preload: true` as sections/PostPage always passes it — the cover is the
  // article page's LCP picture — so no story renders a lazy LCP picture (Next
  // warns on one).
  args: { ...COVER, share: <ShareStandIn />, preload: true },
  argTypes: {
    readingTime: {
      control: 'text',
      description:
        'How long the article takes to read — finished text, at the row’s start in the muted ink',
    },
    share: {
      control: false,
      description:
        'SLOT — the share controls, rendered as given at the row’s end (the page passes sections/ShareLinks; here a stand-in)',
    },
    image: {
      control: false,
      description:
        'The picture under public/images/ and its alt (empty when decorative) — 3:2 on a narrow cover, 2:1 from its @2xl',
    },
    tags: {
      control: 'object',
      description:
        'The categories — ui/PillButton TAGS (labels, never buttons: the lavender edge and label on white, no hover) over the picture’s top-right corner, the first at the far right; an empty list renders no list',
    },
    tagsLabel: {
      control: 'text',
      description: 'The accessible name of the tag list, e.g. „Categorii”',
    },
    preload: {
      control: 'boolean',
      description:
        'The page’s LCP picture: load it at once, at high priority, with a preload link',
    },
    className: {
      control: false,
      description: 'Placement only, merged last onto the root (§6.8)',
    },
  },
} satisfies Meta<typeof PostCover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY COVER — the reading time on the left, the share controls on
 * the right, the lobby photograph under them with „igienă" at the far right
 * of its top edge and „sfaturi" beside it. Unpinned: the Vitest run renders
 * it at Storybook's default width, the net at 390 and 1536, and the play
 * proves whichever shape it is handed.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectCover(canvasElement, args);
  },
};

/**
 * A POST WITHOUT CATEGORIES: no list at all — an empty named list would be
 * announced as „list, 0 items" — and the picture's box holds the picture
 * alone.
 */
export const NoTags: Story = {
  globals: { locale: 'ro' },
  args: { tags: [] },
  play: async ({ args, canvasElement }) => {
    await expectCover(canvasElement, args);
  },
};

/**
 * THREE LONG CATEGORIES (14, 13 and 9 letters): single words that never
 * wrap inside a chip, so the LIST wraps where its line is too short — on a
 * phone, on the chips' floor, two lines — each new line starting at the right
 * again, every chip still inside the picture.
 */
export const ThreeTags: Story = {
  globals: { locale: 'ro' },
  args: { tags: LONG_TAGS },
  play: async ({ args, canvasElement }) => {
    await expectCover(canvasElement, args);
  },
};

/**
 * THE PHONE, pinned to the Smartphone width (390): the cover is under its
 * `@2xl`, so the picture is 3:2 — the clinic photograph whole — and the row
 * holds the reading time and the slot on one line: 351px of column (336
 * behind a classic scrollbar) for 321px of content.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ args, canvasElement }) => {
    const shape = await expectCover(canvasElement, args);
    if (window.innerWidth === 390) {
      await expect(shape.wide).toBe(false);
      await expect(shape.oneLine).toBe(true);
      await expect(shape.scaled).toBe(false);
    }
  },
};

/**
 * THE LAPTOP, pinned to the Laptop width (1536): the cover is past its
 * `@2xl`, so the picture is 2:1, and — on a mouse or trackpad — the whole
 * cover is drawn in THE BAND SCALE's design pixel, the chips' inset with it.
 */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ args, canvasElement }) => {
    const shape = await expectCover(canvasElement, args);
    if (window.innerWidth === 1536) {
      await expect(shape.wide).toBe(true);
      await expect(shape.oneLine).toBe(true);
    }
  },
};

/**
 * THE STRESS, at the 320px accessibility width (§7) as well as the net's two
 * — the 'stress-320' tag — and pinned there: a longer reading time and the
 * three long categories. The line is too short for the reading time and the
 * slot, so the slot drops one gap under it and STAYS AT THE RIGHT; the list,
 * on the chips' floor (29.3px chips, a 12px label), wraps to two lines and
 * ends well inside the 3:2 picture; nothing pushes the page sideways.
 */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: { readingTime: '12 min de citit', tags: LONG_TAGS },
  play: async ({ args, canvasElement }) => {
    const shape = await expectCover(canvasElement, args);
    if (window.innerWidth === 320) {
      await expect(shape.wide).toBe(false);
      await expect(shape.oneLine).toBe(false);
    }
  },
};

/**
 * THE GERMAN STRESS, at the 320px accessibility width (§7) as well as the
 * net's two — the 'stress-320' tag — and pinned there: German, the house's
 * stress language (§13), in de.json's own words, under the three widest tags
 * German can bring (GERMAN). „4 Min. Lesezeit" and the share slot do not fit
 * one line, so the slot drops one gap under it, at the right. On the chips'
 * floor (29.3px chips, a 12px label) no two of the three tags fit the list's
 * line — „Wurzelbehandlungen" is a 157.7px chip — so each takes a line of its
 * own, starting at the right, and the third ends 70px above the 3:2
 * picture's bottom behind the Vitest run's classic scrollbar (MEASURED,
 * 2026-10-20), 80 on a phone, whose picture is 10px taller. The play's two
 * charges: no chip leaves the picture — a tag too wide for its line would
 * leave it on the LEFT, where no scroll width grows — and nothing pushes the
 * page sideways, the page read by the root's own box (the header's WHAT THE
 * PLAYS READ); `expectCover` holds both, among the rest.
 */
export const GermanStress: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'stress320' } },
  args: { ...GERMAN, share: <ShareStandIn words={SHARE_DE} /> },
  play: async ({ args, canvasElement }) => {
    // The story's language reached the page — `lang` picks the dictionary.
    await expect(document.documentElement.lang).toBe('de');
    const shape = await expectCover(canvasElement, args);
    if (window.innerWidth === 320) {
      await expect(shape.wide).toBe(false);
      await expect(shape.oneLine).toBe(false);
      // Each tag a line of its own: every chip's top under the bottom of the
      // chip before it.
      const chips = within(
        within(canvasElement).getByRole('list', { name: args.tagsLabel }),
      ).getAllByRole('listitem');
      await expect(chips).toHaveLength(args.tags.length);
      const boxes = chips.map((chip) => chip.getBoundingClientRect());
      for (const [index, box] of boxes.entries()) {
        const before = boxes[index - 1];
        if (before === undefined) continue;
        await expect(
          box.top,
          `„${args.tags[index]}" on a line of its own`,
        ).toBeGreaterThan(before.bottom);
      }
    }
  },
};
