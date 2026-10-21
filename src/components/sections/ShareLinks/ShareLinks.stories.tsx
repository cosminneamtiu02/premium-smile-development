import type { ReactElement, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Check } from '@/assets/glyphs/Check';
import { Facebook } from '@/assets/glyphs/Facebook';
import { Link as LinkGlyph } from '@/assets/glyphs/Link';
import { Mail } from '@/assets/glyphs/Mail';
import { Whatsapp } from '@/assets/glyphs/Whatsapp';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
} from '@/components/ui/Container/Container';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';
import { shareHrefs } from '@/lib/share/share';
import de from '@/messages/de.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import type { CopyResult } from './CopyLinkButton';
import { ShareLinks, type ShareLink, type ShareLinksProps } from './ShareLinks';

// Sections/ShareLinks — the blog article's four share controls and their
// status line. `Sections/*` routes every story to 390 + 1536 in the visual
// net (tests/visual/stories.spec.ts, §13); Stress320 adds the 320 width
// ('stress-320'); Hover is photographed with a REAL pointer on its first
// control ('pin-hover' — the lavender word, glyph and underline). The copy
// stories — CopyLink and the CopyFailed ones — are never photographed
// ('no-visual'): each needs its play's press, a copy's answer reverts by
// design after 2.5 seconds, and none was asked for as a baseline. The export
// NAMES are load-bearing — each names a baseline file.
//
// ── THE WORDS ARE THE PAGE'S (ro.json's `blog.article.share.*` and
// `blog.readingTime`), Romanian with diacritics (§15.7); the German and the
// Italian failures read de.json's and it.json's own. The article is in all
// five languages since 2026-10-15; its German, the longest, is photographed
// whole in Pages/BlogArticle's German frames. THE ADDRESSES ARE BUILT LIKE
// THE PAGE BUILDS THEM, through lib/share, for the demo article's own address
// on a stand-in domain: what a story's links say is what the page's links say.
//
// ── THE STAND-INS. The words' step is a CONTAINER query that reads the box
// above the row (ShareLinks.tsx's THE LABELS' STEP), so no story renders the
// row bare: CoverRow is sections/PostCover's row letter for letter — its root
// the container the words read, the reading time at the start in a box of its
// own (PostCover's THE READING TIME'S BOX: one row track, never taller than
// the controls' 44px step, so the reading time stays level with them when the
// line opens), the row at the end in a content-sized slot — inside
// ui/Container's column, the page's own place for it; Narrow is a 24rem
// container, under the step at every width. The four class strings
// (COVER_ROOT, COVER_ROW, COVER_TIME, COVER_SLOT) are held to PostCover.tsx's
// own spelling by ShareLinks.test.tsx (THE STAND-INS' PIN), and every cover
// play checks the boxes wear them: until 2026-10-21 these stand-ins still
// showed the row before PostCover's lever was taken, where a press moved the
// reading time (the React and the accessibility reviews, round 3). They are
// stand-ins, not PostCover: the cover is another unit of this lane, and a
// story of this row proves the row.
//
// ── THE PLAYS DERIVE WHAT THEY EXPECT FROM WHAT THEY MEASURE. The visual net
// photographs every story at its own widths with the same play, and ignores
// the viewport pins (those choose the width the Vitest run uses), so each play
// reads the width of the container the words answer to and expects the words
// shown from 42rem, hidden under it — and, in a cover row, the row beside the
// reading time where both fit and under it where they do not. Where the row
// shares the reading time's line, the reading time is LEVEL with the controls
// — its words' middle on theirs — at rest and with the line open alike. It is
// read by its WORDS, a Range around them, never by a box: its own box
// stretches to the row's line by design, and a paragraph stretched inside it
// would carry its words to the top while every box stayed centred (the React
// review, round 3). Every play loads the real face first (Source Serif 4 is
// `font-display: block` in the workbench — the house's lesson) and checks
// that nothing scrolls sideways, and each control's glyph by its FINGERPRINT,
// the first path it draws (CopyLinkButton.test.tsx's idiom): until 2026-10-20
// a link could wear another's glyph and every play passed (the React review).
//
// ── THE COPY STORIES hold the round-2 rule (2026-10-20, the React and the
// accessibility reviews): NO CONTROL EVER MOVES — and, since round 3, nor
// does the reading time beside them. Each reads every control's box and the
// reading time's words before the press and after the answer and finds them
// EQUAL, the copy button's word and name unchanged, and the answer said on
// THE LINE under the controls. What happens LATER needs no real-time wait
// here: a failure schedules no timer (CopyLinkButton.test.tsx pins it), and
// ShareLinks.test.tsx's THE LINE finds every box of the row where it was a
// minute after a failure, on Vitest's fake clock — the 5.2-second waits these
// plays made until 2026-10-21 proved nothing more, slowly (the React review,
// round 3). What the line SAYS is read outside its hidden nodes (`said`): it
// keeps every answer, invisible, for its height. The pinned ones check their
// premise UNCONDITIONALLY — the window's width first: never photographed,
// they run at their pin alone, and a renamed viewport key would fall back to
// the runner's width in silence (the accessibility review, round 3).
//
// ── MEASURED here (Chromium, the real face, 2026-10-14) — the numbers in
// ShareLinks.tsx's THE LABELS' STEP: glyphs alone every control is 44 × 44
// and the list 200px; labelled, the controls are 118.8 · 125.5 · 94.1 ·
// 158.7px and the list 521.1px; the reading time is 97.2px for one digit of
// minutes and 105.5px for two, so a cover row needs 650.6px at most for one
// line — under the step's 672px. The copy control keeps its 158.7px in every
// state (its word never changes, CopyLinkButton.tsx's WHY THE NAME STAYS),
// and the line at rest is 0px tall: the row is the list, to the pixel. Open
// (2026-10-20), it is 200 × 32px under the glyphs at 390 and 320 in
// Romanian, 200 × 56 in German (two lines), and every control's box is the
// one it had before the press (ShareLinks.tsx's THE LINE has the rest).

/** The demo article's address on a stand-in domain, and its title. */
const ADDRESS = 'https://example.com/ro/blog/cum-iti-alegi-periuta-de-dinti/';
const TITLE = 'Cum îți alegi periuța de dinți';
/** What the share says around the address — ro.json's
 *  `blog.article.share.message` and `.subject` round the title. */
const MESSAGE = `Citește acest articol de la Premium Smile: ${TITLE}`;
const SUBJECT = `Un articol de la Premium Smile: ${TITLE}`;
const HREFS = shareHrefs(ADDRESS, { subject: SUBJECT, message: MESSAGE });

/** The list's name and the copy control's three words — ro.json's own. */
const LABEL = 'Distribuie articolul';
const COPY = {
  url: ADDRESS,
  label: 'Copiază linkul',
  copied: 'Link copiat',
  failed: 'Linkul nu a putut fi copiat',
} as const;

/** The three links as the page passes them. */
const FACEBOOK: ShareLink = {
  href: HREFS.facebook,
  label: 'Facebook',
  name: 'Facebook, distribuie articolul',
};
const WHATSAPP: ShareLink = {
  href: HREFS.whatsapp,
  label: 'WhatsApp',
  name: 'WhatsApp, trimite articolul',
};
const EMAIL: ShareLink = {
  href: HREFS.email,
  label: 'E-mail',
  name: 'E-mail, trimite articolul',
};

/**
 * The first path a glyph draws — its FINGERPRINT — read from the glyph
 * rendered on its own, off the page, when a play asks. Through the client
 * renderer every story already loads, never a server one: a module the
 * workbench has not met before makes Vite re-bundle and reload a running
 * suite, every story of the file failing to load (measured, 2026-10-20).
 */
function fingerprint(glyph: ReactElement): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => root.render(glyph));
  const drawn = host.querySelector('path')?.getAttribute('d') ?? '';
  root.unmount();
  return drawn;
}

/** The copy control's glyph at rest and on a failure, and after a copy. */
const CHAIN_GLYPH = <LinkGlyph size="sm" />;
const TICK_GLYPH = <Check size="sm" />;

/** The fingerprint of the glyph a control shows now. */
const glyphOf = (control: Element): string | null | undefined =>
  control.querySelector('svg path')?.getAttribute('d');

/** …in the list's order, with the glyph each draws, the `rel` each must carry
 *  and what each hands its receiver — its query, decoded (lib/share's
 *  header): Facebook the address alone; WhatsApp the message, a line feed,
 *  the address; the e-mail the subject, and the message, a blank line (CR LF
 *  twice), the address. */
const LINKS = [
  {
    ...FACEBOOK,
    glyph: <Facebook size="sm" />,
    rel: 'noreferrer',
    carries: [['u', ADDRESS]],
  },
  {
    ...WHATSAPP,
    glyph: <Whatsapp size="sm" />,
    rel: 'noreferrer',
    carries: [['text', `${MESSAGE}\n${ADDRESS}`]],
  },
  {
    ...EMAIL,
    glyph: <Mail size="sm" />,
    rel: null,
    carries: [
      ['subject', SUBJECT],
      ['body', `${MESSAGE}\r\n\r\n${ADDRESS}`],
    ],
  },
] as const;

const ARGS: ShareLinksProps = {
  label: LABEL,
  facebook: FACEBOOK,
  whatsapp: WHATSAPP,
  email: EMAIL,
  copy: COPY,
};

/** The reading time as the page words it — one digit, and the longest the
 *  data allows (60 minutes, lib/blog-article). */
const READING = '4 min de citit';
const READING_LONGEST = '60 min de citit';

/** A page's share words and its reading time, in its own language — what the
 *  route hands the row, from a message file (the text-spacing stories). */
type Messages = typeof de;

function argsIn(messages: Messages): ShareLinksProps {
  const share = messages.blog.article.share;
  const fill = (template: string): string =>
    template.replace('{site}', 'Premium Smile').replace('{title}', TITLE);
  const hrefs = shareHrefs(ADDRESS, {
    subject: fill(share.subject),
    message: fill(share.message),
  });
  return {
    label: share.label,
    facebook: {
      href: hrefs.facebook,
      label: share.facebook,
      name: share.facebookName,
    },
    whatsapp: {
      href: hrefs.whatsapp,
      label: share.whatsapp,
      name: share.whatsappName,
    },
    email: { href: hrefs.email, label: share.email, name: share.emailName },
    copy: {
      url: ADDRESS,
      label: share.copy,
      copied: share.copied,
      failed: share.copyFailed,
    },
  };
}

/** A reading time of `minutes` in a page's language (up to the data's 60). */
const readingIn = (messages: Messages, minutes: number): string =>
  messages.blog.readingTime.replace('{minutes, number}', String(minutes));

/** THE STAND-INS' classes: sections/PostCover's ROOT, ROW, TIME and SLOT,
 *  letter for letter — held to PostCover.tsx's own spelling by
 *  ShareLinks.test.tsx (THE STAND-INS' PIN). One static string per box:
 *  Tailwind reads class names from source text. */
const COVER_ROOT = '@container flex flex-col gap-4';
const COVER_ROW = 'flex flex-wrap items-center justify-between gap-x-6 gap-y-2';
const COVER_TIME =
  'grid grid-rows-[minmax(min-content,min(100%,calc(var(--spacing)*11)))] items-center self-stretch';
const COVER_SLOT = 'ms-auto';

/** sections/PostCover's row, letter for letter (THE STAND-INS). */
function CoverRow({
  readingTime,
  children,
}: Readonly<{ readingTime: string; children: ReactNode }>): ReactElement {
  return (
    <div className={COVER_ROOT}>
      <div className={COVER_ROW}>
        <div className={COVER_TIME}>
          <Text tone="muted">{readingTime}</Text>
        </div>
        <div className={COVER_SLOT}>{children}</div>
      </div>
    </div>
  );
}

/** A container of 24rem at most — under the 42rem step at every width. */
function Narrow({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="@container flex max-w-sm justify-end">{children}</div>;
}

/** The article page's RHYTHM BOX (sections/PostPage): ui/Container's two band
 *  strings, so on a laptop or desktop with a mouse every length inside is
 *  drawn in THE BAND SCALE's design pixel (§15.32) — inside the meta's
 *  column, which is ui/Container, whose width the design pixel reads. */
function Band({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div className={cx(bandColumnClasses, bandScaleClasses, 'flex flex-col')}>
      {children}
    </div>
  );
}

/** The page column: ui/Container, under a band's vertical air. */
const withColumn: Decorator = (Story) => (
  <Container>
    <div className="py-12">
      <Story />
    </div>
  </Container>
);

/** `n` rem in px, at whatever the root font size is. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The face of every word in the canvas, loaded before anything is measured. */
async function loadFaces(root: HTMLElement): Promise<void> {
  for (const element of root.querySelectorAll<HTMLElement>('a, button, p')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** No width may make the page scroll sideways (§7). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
}

/** Two numbers within half a pixel — a computed length against its design. */
async function near(actual: number, expected: number, what: string) {
  await expect(Math.abs(actual - expected), what).toBeLessThan(0.5);
}

/** The class tokens an element wears. */
const tokens = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** The nearest size container above `element` — the box the words answer to. */
function nearestContainer(element: HTMLElement): HTMLElement {
  for (let box = element.parentElement; box; box = box.parentElement) {
    if (getComputedStyle(box).containerType !== 'normal') return box;
  }
  throw new Error('the list has no container above it to read');
}

/** A box's content width — what a container query compares — from its
 *  fractional border box (`clientWidth` rounds to a whole pixel). */
function contentWidth(box: HTMLElement): number {
  const style = getComputedStyle(box);
  return (
    box.getBoundingClientRect().width -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight) -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth)
  );
}

/** The list, by its name. */
const listIn = (canvasElement: HTMLElement, label: string = LABEL) =>
  within(canvasElement).getByRole('list', { name: label });

/** The row's root (the list's parent) and its status line. */
function rowOf(list: HTMLElement): { root: HTMLElement; line: HTMLElement } {
  const root = list.parentElement;
  if (!root) throw new Error('the list has no root');
  return { root, line: within(root).getByRole('status') };
}

/** Whether the four controls' words are on screen — each word's position,
 *  which the step leaves screen-reader-only (`absolute`) or shows (`static`);
 *  all four answer the one step, so a mixed row is an error by name. */
function wordsShown(list: HTMLElement): boolean {
  const positions = new Set(
    [
      ...list.querySelectorAll<HTMLElement>(
        ':scope a > span > span, :scope button > span > span',
      ),
    ].map((word) => getComputedStyle(word).position),
  );
  if (positions.size !== 1) {
    throw new Error(`the words disagree: ${[...positions].join(', ')}`);
  }
  return positions.has('static');
}

/** What the line SAYS: its text outside every `aria-hidden` node — the answer
 *  shown, never the ones it keeps for its height. */
function said(element: Element): string {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? '';
    else if (
      node instanceof Element &&
      node.getAttribute('aria-hidden') !== 'true'
    ) {
      text += said(node);
    }
  }
  return text;
}

/** A rectangle as four numbers, for an exact comparison. */
const four = ({ left, top, width, height }: DOMRect) => ({
  left,
  top,
  width,
  height,
});

/** A box as four numbers. */
const boxOf = (element: Element) => four(element.getBoundingClientRect());

/** Where an element's WORDS are: a Range around them, never its box. */
function wordsBox(element: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect();
}

/** Every control's box, in the list's order. */
const controlBoxes = (list: HTMLElement) =>
  [...list.querySelectorAll('a, button')].map(boxOf);

/**
 * THE COVER ROW around a list (THE STAND-INS): PostCover's row, the slot the
 * row sits in, the reading time's box — and the reading time itself, the
 * PARAGRAPH inside that box, read by its words: the box stretches to the
 * row's line by design. A named error where the story renders none.
 */
function coverOf(list: HTMLElement): {
  slot: HTMLElement;
  row: HTMLElement;
  box: HTMLElement;
  time: HTMLParagraphElement;
} {
  const slot = list.parentElement?.parentElement;
  const row = slot?.parentElement;
  const box = row?.firstElementChild;
  const time = box?.firstElementChild;
  if (
    !(slot instanceof HTMLElement) ||
    !(row instanceof HTMLElement) ||
    !(box instanceof HTMLElement) ||
    !(time instanceof HTMLParagraphElement)
  ) {
    throw new Error('the cover row is missing');
  }
  return { slot, row, box, time };
}

/**
 * THE LIST'S CONTRACT, at whatever width the story renders, AT REST: four
 * items; the three links' names, addresses — and what each hands its
 * receiver — `rel`, same tab, and each its OWN glyph (by fingerprint); the
 * copy control a real button wearing the chain; ShareLinks itself no
 * container; the words shown from 42rem of the container above and hidden
 * the screen-reader-only way under it; every control at least 44 × 44; every
 * glyph decorative and painted in its control's own colour; THE LINE right
 * after the list, empty and 0px tall, so the row is the list to the pixel;
 * nothing scrolling sideways. Returns whether the words are shown.
 */
async function expectShareLinks(canvasElement: HTMLElement): Promise<boolean> {
  await loadFaces(canvasElement);
  const list = listIn(canvasElement);
  const items = within(list).getAllByRole('listitem');
  await expect(items).toHaveLength(4);
  // Three different drawings, none of them the chain: a fingerprint cannot
  // pass on one glyph worn three times.
  const drawings = LINKS.map((link) => fingerprint(link.glyph));
  const chain = fingerprint(CHAIN_GLYPH);
  await expect(drawings).not.toContain('');
  await expect(new Set([...drawings, chain]).size).toBe(4);

  for (const [index, link] of LINKS.entries()) {
    const anchor = within(list).getByRole('link', { name: link.name });
    await expect(glyphOf(anchor)).toBe(drawings[index]);
    await expect(anchor).toHaveAttribute('href', link.href);
    // Every field of its query, decoded, in order: the page's words and the
    // article's address, and nothing else.
    await expect([
      ...new URL(anchor.getAttribute('href') ?? '').searchParams,
    ]).toEqual(link.carries);
    if (link.rel === null) await expect(anchor).not.toHaveAttribute('rel');
    else await expect(anchor).toHaveAttribute('rel', link.rel);
    await expect(anchor).not.toHaveAttribute('target');
    // The visible word inside the accessible name (SC 2.5.3).
    await expect(link.name.toLowerCase()).toContain(link.label.toLowerCase());
    await expect(items[index]).toContainElement(anchor);
  }
  const copy = within(list).getByRole('button', { name: COPY.label });
  await expect(copy).toHaveAttribute('type', 'button');
  await expect(items[3]).toContainElement(copy);
  await expect(glyphOf(copy)).toBe(chain);

  // ShareLinks declares no container; the words answer to the one above it.
  await expect(getComputedStyle(list).containerType).toBe('normal');
  const wide = contentWidth(nearestContainer(list)) >= rem(42);

  for (const control of list.querySelectorAll<HTMLElement>('a, button')) {
    const box = control.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(44 - 0.5);
    await expect(box.height).toBeGreaterThanOrEqual(44 - 0.5);

    const word = control.querySelector<HTMLElement>(':scope > span > span');
    if (!word) throw new Error(`${control.textContent}: the word is missing`);
    const wordBox = word.getBoundingClientRect();
    await expect(getComputedStyle(word).position).toBe(
      wide ? 'static' : 'absolute',
    );
    if (wide) {
      await expect(wordBox.width).toBeGreaterThan(1);
    } else {
      // Screen-reader only: a 1px box, clipped — never display: none, so the
      // copy button keeps its name.
      await expect(wordBox.width).toBeLessThanOrEqual(1);
      await expect(getComputedStyle(word).display).not.toBe('none');
    }

    const glyph = control.querySelector('svg');
    if (!glyph) throw new Error(`${control.textContent}: the glyph is missing`);
    await expect(glyph).toHaveAttribute('aria-hidden', 'true');
    const paint = getComputedStyle(glyph);
    await expect([paint.fill, paint.stroke]).toContain(
      getComputedStyle(control).color,
    );
  }

  // THE LINE at rest: right after the list, empty, 0px tall — the row is the
  // list, to the pixel.
  const { root, line } = rowOf(list);
  await expect(list.nextElementSibling).toBe(line);
  await expect(line).toBeEmptyDOMElement();
  await expect(line.getBoundingClientRect().height).toBe(0);
  await expect(boxOf(root)).toEqual(boxOf(list));

  await expectNoSidewaysScroll();
  return wide;
}

/**
 * THE COVER ROW's line, at rest or with the status line open: the stand-in's
 * boxes wearing PostCover's own classes; the row beside the reading time
 * where both fit on the cover's row (the reading time's box, its 24px gap and
 * the list against the row's content width), under it where they do not —
 * and at the row's end either way. On one line the reading time is LEVEL
 * with the controls, its WORDS' middle on theirs, whether the line is open or
 * not — unless `level` is false: under SC 1.4.12's paragraph spacing the
 * reading time's own 2em hangs inside its box and lifts it to the row's top,
 * the paragraph-spacing case PostCover records as moving at rest (its THE
 * READING TIME'S BOX). Returns whether the row shares the reading time's
 * line.
 */
async function expectCoverLine(
  canvasElement: HTMLElement,
  label: string = LABEL,
  { level = true }: Readonly<{ level?: boolean }> = {},
): Promise<boolean> {
  const list = listIn(canvasElement, label);
  const { slot, row, box, time } = coverOf(list);
  await expect(tokens(row.parentElement ?? row)).toEqual(COVER_ROOT.split(' '));
  await expect(tokens(row)).toEqual(COVER_ROW.split(' '));
  await expect(tokens(box)).toEqual(COVER_TIME.split(' '));
  await expect(tokens(slot)).toEqual(COVER_SLOT.split(' '));

  const rowBox = row.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const timeBox = box.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(row).columnGap);
  const fits = timeBox.width + gap + listBox.width <= rowBox.width + 0.5;

  await expect(Math.abs(listBox.right - rowBox.right)).toBeLessThan(1);
  if (fits) {
    await expect(listBox.left).toBeGreaterThan(timeBox.right);
    if (level) {
      const middle = (rect: DOMRect) => rect.top + rect.height / 2;
      await expect(
        Math.abs(middle(listBox) - middle(wordsBox(time))),
        'the reading time level with the controls',
      ).toBeLessThan(1);
    }
  } else {
    await expect(listBox.top).toBeGreaterThanOrEqual(timeBox.bottom);
  }
  return fits;
}

/**
 * Press the copy control and wait for its ANSWER on the line — at whatever
 * width the story renders: no control moved (every box as before the press),
 * nor the reading time beside them (its words where they were); the copy
 * button its own word, name and focus, its glyph the tick after a copy and
 * the chain after a failure; the line under the controls, its words within
 * the row's width and ending at its end, inside the window; nothing
 * scrolling sideways. Returns the line.
 */
async function pressAndExpectAnswer(
  list: HTMLElement,
  copy: Readonly<{ label: string; copied: string; failed: string }>,
  answer: CopyResult,
): Promise<HTMLElement> {
  const button = within(list).getByRole('button', { name: copy.label });
  const before = controlBoxes(list);
  const { time } = coverOf(list);
  const timeBefore = four(wordsBox(time));
  const { root, line } = rowOf(list);
  const rowBefore = root.getBoundingClientRect();
  await userEvent.click(button);
  const words = answer === 'copied' ? copy.copied : copy.failed;
  await waitFor(() => expect(said(line)).toBe(words));

  // NO CONTROL EVER MOVES — the box the visitor pressed is still the copy
  // button's, and every other control's is where it was — NOR THE READING
  // TIME, since PostCover's lever (ShareLinks.tsx's THE ONE SHIFT).
  await expect(controlBoxes(list)).toEqual(before);
  await expect(four(wordsBox(time))).toEqual(timeBefore);
  await expect(button).toHaveAccessibleName(copy.label);
  await expect(button.textContent).toBe(copy.label);
  await expect(button).toHaveFocus();
  await expect(glyphOf(button)).toBe(
    fingerprint(answer === 'copied' ? TICK_GLYPH : CHAIN_GLYPH),
  );

  // The words on the line: under the controls, within the row, at its end.
  const listBox = list.getBoundingClientRect();
  const rowBox = root.getBoundingClientRect();
  const shown = line.firstElementChild?.firstElementChild;
  if (!shown) throw new Error('the line shows no answer');
  const ink = wordsBox(shown);
  await expect(line.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    listBox.bottom,
  );
  await expect(ink.width).toBeGreaterThan(20);
  await expect(ink.left).toBeGreaterThanOrEqual(rowBox.left - 0.5);
  await expect(ink.right).toBeLessThanOrEqual(rowBox.right + 0.5);
  await expect(Math.abs(ink.right - rowBox.right)).toBeLessThan(1);
  await expect(ink.left).toBeGreaterThanOrEqual(0);
  await expect(ink.right).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
  // The row never widens — not past its controls, not past its own width
  // before the press (THE LINE's containment): where the row has a line of
  // its own, a wider row would move no control, so this is the one witness.
  await expect(Math.abs(rowBox.width - listBox.width)).toBeLessThan(0.01);
  await expect(rowBox.width).toBe(rowBefore.width);
  await expect(rowBox.left).toBe(rowBefore.left);
  await expectNoSidewaysScroll();
  return line;
}

/**
 * Both of the copy's roads fail in the workbench: the Clipboard API refuses
 * and the older road reports nothing copied — own properties shadowing the
 * platform's, and deleting them brings the platform's back. A story's
 * `beforeEach`, returning its own cleanup.
 */
function failBothRoads(): () => void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {
        throw new DOMException('Refuzat în workbench', 'NotAllowedError');
      },
    },
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: () => false,
  });
  return () => {
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(document, 'execCommand');
  };
}

/**
 * SC 1.4.12's four overrides — line height 1.5, letter spacing 0.12em, word
 * spacing 0.16em, paragraph spacing 2em — on everything under `scope`, for
 * as long as `read` runs (sections/PostConclusion's stories' idiom).
 */
async function withTextSpacing<T>(
  scope: HTMLElement,
  read: () => Promise<T>,
): Promise<T> {
  const sheet = document.createElement('style');
  sheet.textContent =
    '[data-text-spacing] * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } [data-text-spacing] p { margin-bottom: 2em !important; }';
  scope.dataset.textSpacing = '';
  document.head.append(sheet);
  try {
    return await read();
  } finally {
    sheet.remove();
    delete scope.dataset.textSpacing;
  }
}

const meta = {
  title: 'Sections/ShareLinks',
  component: ShareLinks,
  parameters: { layout: 'fullscreen' },
  decorators: [withColumn],
  args: ARGS,
  render: (args) => (
    <CoverRow readingTime={READING}>
      <ShareLinks {...args} />
    </CoverRow>
  ),
  argTypes: {
    label: {
      control: 'text',
      description:
        'The list’s accessible name, e.g. „Distribuie articolul" — finished text (§8.1)',
    },
    facebook: {
      control: 'object',
      description:
        'href (built by the page, lib/share) · label (the visible word) · name (the accessible name, containing the word)',
    },
    whatsapp: { control: 'object', description: 'The same three fields' },
    email: { control: 'object', description: 'The same three fields' },
    copy: {
      control: 'object',
      description:
        'The copy control: the address to copy, its word, and the two answers its status line says — copied, failed',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the row’s root (§6.4/§6.8)',
    },
  },
} satisfies Meta<typeof ShareLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE COVER ROW in the page's column: the reading time at the start, the
 * four controls at the end. Words shown wherever the column reaches 42rem —
 * the runner's own 1200 and the net's 1536 — glyphs alone under it (the
 * net's 390). At both of the net's widths the row is one line (the pinned
 * Smartphone and Laptop stories hold that); the play derives the line from
 * what it measures, so it holds at any width the story is opened at.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvasElement }) => {
    await expectShareLinks(canvasElement);
    await expectCoverLine(canvasElement);
  },
};

/**
 * GLYPHS ALONE at every width: the row in a 24rem container, under the
 * step. Each control is a 44 × 44 target with its word kept for the ear —
 * the links named by their sentence, the copy button by its word.
 */
export const IconsOnly: Story = {
  globals: { locale: 'ro' },
  render: (args) => (
    <Narrow>
      <ShareLinks {...args} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await expect(await expectShareLinks(canvasElement)).toBe(false);
    for (const control of listIn(canvasElement).querySelectorAll<HTMLElement>(
      'a, button',
    )) {
      const box = control.getBoundingClientRect();
      await expect(Math.abs(box.width - 44)).toBeLessThan(0.5);
      await expect(Math.abs(box.height - 44)).toBeLessThan(0.5);
    }
  },
};

/**
 * THE HOVER, photographed: the net rests a real pointer on the first control
 * ('pin-hover'), so its frame shows the owner's "on hover turn lilla" — the
 * word, the glyph and the underline in the lavender, the other three in ink.
 * A play cannot hover (its events are synthetic and CSS `:hover` answers only
 * the real pointer), so here it proves the list as Default does.
 */
export const Hover: Story = {
  tags: ['pin-hover'],
  globals: { locale: 'ro' },
  play: async ({ canvasElement }) => {
    await expectShareLinks(canvasElement);
  },
};

/** The addresses the copy story's stubbed Clipboard API was handed, in order
 *  — the record its play reads (the stub itself is the story's `beforeEach`). */
let clipboardWrites: string[] = [];

/**
 * COPIED: a press copies the address — through a stubbed Clipboard API here,
 * so the workbench never touches the machine's clipboard — the button's chain
 * turns into a tick, and „Link copiat" is said on the status line under the
 * controls a moment later (CopyLinkButton.tsx's THE REFILL), focus staying on
 * the button and NO control moving, nor the reading time: the button keeps
 * its word and its name, and the reading time stays level with it, the line
 * open. 2.5 seconds after the words land both answers go, which is why this
 * frame is never photographed.
 */
export const CopyLink: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro' },
  beforeEach: () => {
    clipboardWrites = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
        },
      },
    });
    return () => {
      Reflect.deleteProperty(navigator, 'clipboard');
    };
  },
  play: async ({ canvasElement }) => {
    await expectShareLinks(canvasElement);
    await expectCoverLine(canvasElement);
    await pressAndExpectAnswer(listIn(canvasElement), COPY, 'copied');
    await expectCoverLine(canvasElement);
    await expect(clipboardWrites).toEqual([ADDRESS]);
  },
};

/**
 * FAILED, at the runner's width: the Clipboard API refuses and the older road
 * copies nothing, so the status line says „Linkul nu a putut fi copiat" under
 * the controls — the button itself unchanged, its chain, its word, its name,
 * and the reading time level with it — until the next press. Never
 * photographed: it needs its play's press.
 */
export const CopyFailed: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro' },
  beforeEach: failBothRoads,
  play: async ({ canvasElement }) => {
    await loadFaces(canvasElement);
    await expectCoverLine(canvasElement);
    await pressAndExpectAnswer(listIn(canvasElement), COPY, 'failed');
    await expectCoverLine(canvasElement);
  },
};

/**
 * THE FAILURE ON A PHONE, pinned to the Smartphone width (390), the column
 * under the step: at rest the four controls are their glyphs on the reading
 * time's line, and a failed copy changes NONE of them, nor the reading time —
 * the sentence is said on the line under the glyphs, within their 200px, and
 * the row stays on the reading time's line, level with it (until 2026-10-20
 * the copy button grew to the sentence there, the list wrapped, the e-mail
 * link slid under the visitor's finger, and the row collapsed after 5 seconds
 * — the reviews' CLS of 0.154; until 2026-10-21 the reading time dropped 16px
 * at the press). Never photographed: it needs its play's press.
 */
export const CopyFailedSmartphone: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  beforeEach: failBothRoads,
  play: async ({ canvasElement }) => {
    // THE PREMISE, unconditional: a 390 window, glyphs alone, on the reading
    // time's line.
    await expect(window.innerWidth).toBe(390);
    await expect(await expectShareLinks(canvasElement)).toBe(false);
    await expect(await expectCoverLine(canvasElement)).toBe(true);
    await pressAndExpectAnswer(listIn(canvasElement), COPY, 'failed');
    // Still on the reading time's line, and level with it: the open line
    // widened nothing and moved the reading time not at all.
    await expect(await expectCoverLine(canvasElement)).toBe(true);
  },
};

/**
 * THE FAILURE AT 320 (§7's stress width), pinned there: the longest reading
 * time puts the row on a line of its own, and a failed copy moves none of its
 * controls nor the reading time above them (the reviews' CLS of 0.297 there
 * once the row collapsed, until 2026-10-20). Never photographed: it needs its
 * play's press.
 */
export const CopyFailedStress320: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  beforeEach: failBothRoads,
  render: (args) => (
    <CoverRow readingTime={READING_LONGEST}>
      <ShareLinks {...args} />
    </CoverRow>
  ),
  play: async ({ canvasElement }) => {
    // THE PREMISE, unconditional: a 320 window, glyphs alone, the row on a
    // line of its own.
    await expect(window.innerWidth).toBe(320);
    await expect(await expectShareLinks(canvasElement)).toBe(false);
    await expect(await expectCoverLine(canvasElement)).toBe(false);
    await pressAndExpectAnswer(listIn(canvasElement), COPY, 'failed');
  },
};

/**
 * One page's failure under SC 1.4.12's four overrides, at one pinned width —
 * the next three stories. None is photographed, so each runs at its pin alone
 * and checks its premise first, unconditionally: the pinned window, glyphs
 * alone, and at 320 the row on a line of its own. Then a failed press moves
 * no control and not the reading time, and the sentence — wrapped, which is
 * allowed — stays inside the column.
 */
function spacedFailure({
  messages,
  locale,
  viewport,
  minutes,
}: Readonly<{
  messages: Messages;
  locale: 'ro' | 'de' | 'it';
  viewport: 'smartphone' | 'stress320';
  minutes: number;
}>): Story {
  const args = argsIn(messages);
  const width = viewport === 'smartphone' ? 390 : 320;
  return {
    tags: ['no-visual'],
    globals: { locale, viewport: { value: viewport } },
    args,
    beforeEach: failBothRoads,
    render: (story) => (
      <CoverRow readingTime={readingIn(messages, minutes)}>
        <ShareLinks {...story} />
      </CoverRow>
    ),
    play: async ({ canvasElement }) => {
      await loadFaces(canvasElement);
      const list = listIn(canvasElement, args.label);
      await expect(window.innerWidth).toBe(width);
      await expect(wordsShown(list)).toBe(false);
      await withTextSpacing(canvasElement, async () => {
        // The row under the overrides, at its end — level or not is the
        // overrides' own case (`expectCoverLine`'s `level`): what matters
        // here is that the press moves nothing, held below.
        const oneLine = await expectCoverLine(canvasElement, args.label, {
          level: false,
        });
        if (width === 320) await expect(oneLine).toBe(false);
        const line = await pressAndExpectAnswer(list, args.copy, 'failed');
        // The sentence wraps (allowed) and stays inside the column.
        const column = nearestContainer(list).getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(line);
        for (const rect of range.getClientRects()) {
          await expect(rect.left).toBeGreaterThanOrEqual(column.left - 0.5);
          await expect(rect.right).toBeLessThanOrEqual(column.right + 0.5);
        }
        await expectNoSidewaysScroll();
      });
    },
  };
}

/**
 * A FAILURE ON A PHONE (390) under SC 1.4.12's overrides, in Romanian — the
 * one-digit reading time beside the glyphs, as CopyFailedSmartphone shows them
 * without the overrides. Never photographed: it needs its play's press.
 */
export const CopyFailedSmartphoneSpacing: Story = spacedFailure({
  messages: ro,
  locale: 'ro',
  viewport: 'smartphone',
  minutes: 4,
});

/**
 * GERMAN'S FAILURE AT 320, under SC 1.4.12's four text-spacing overrides —
 * „Der Link konnte nicht kopiert werden", the longest of the five: no
 * sideways scroll, the sentence wrapped inside the column, no control moved.
 * Never photographed: it needs its play's press.
 */
export const CopyFailedGermanSpacing320: Story = spacedFailure({
  messages: de,
  locale: 'de',
  viewport: 'stress320',
  minutes: 60,
});

/**
 * ITALIAN'S FAILURE AT 320, the same — „Non è stato possibile copiare il
 * link". Never photographed: it needs its play's press.
 */
export const CopyFailedItalianSpacing320: Story = spacedFailure({
  messages: it_,
  locale: 'it',
  viewport: 'stress320',
  minutes: 60,
});

/**
 * THE FAILURE ON A LAPTOP, IN THE BAND SCALE, pinned to the Laptop width
 * (1536): the cover row inside the article page's rhythm box (Band), so with
 * the runner's mouse every length is drawn in the design pixel, as on the page
 * (§15.32). The words shown, on the reading time's line and level with it; a
 * failed copy moves no control and not the reading time; the open line is
 * its 8 design pixels under the controls and one 24 of words, and the copy
 * button keeps the German line's 56 under it when focus scrolls it into view
 * (CopyLinkButton.tsx's THE ROOM UNDER IT) — redrawn with the line. Never
 * photographed: it needs its play's press.
 */
export const CopyFailedLaptop: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  beforeEach: failBothRoads,
  render: (args) => (
    <Band>
      <CoverRow readingTime={READING}>
        <ShareLinks {...args} />
      </CoverRow>
    </Band>
  ),
  play: async ({ canvasElement }) => {
    // THE PREMISE, unconditional: a 1536 window, a fine pointer, and the
    // band's design pixel declared on the rhythm box — not the registered
    // initial 1px, which outside the scale every length would be drawn in.
    await expect(window.innerWidth).toBe(1536);
    await expect(window.matchMedia('(pointer: fine)').matches).toBe(true);
    const list = listIn(canvasElement);
    const band = nearestContainer(list).parentElement;
    if (!band) throw new Error('the band is missing');
    const pixel = parseFloat(
      getComputedStyle(band).getPropertyValue('--scale-px'),
    );
    await expect(pixel).toBeGreaterThan(1);

    await expect(await expectShareLinks(canvasElement)).toBe(true);
    await expect(await expectCoverLine(canvasElement)).toBe(true);
    const line = await pressAndExpectAnswer(list, COPY, 'failed');
    await expect(await expectCoverLine(canvasElement)).toBe(true);
    // Drawn in the design pixel, with everything else.
    await near(line.getBoundingClientRect().height, 32 * pixel, 'the line');
    const button = within(list).getByRole('button', { name: COPY.label });
    await near(
      parseFloat(getComputedStyle(button).scrollMarginBottom),
      56 * pixel,
      'the room under the button',
    );
  },
};

/**
 * THE PHONE, pinned to the Smartphone width (390): the column is 351px (336
 * behind a classic scrollbar), under the step, so the controls are their
 * glyphs — 200px — and share the line with the reading time: 321px.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    const wide = await expectShareLinks(canvasElement);
    const oneLine = await expectCoverLine(canvasElement);
    if (window.innerWidth === 390) {
      await expect(wide).toBe(false);
      await expect(oneLine).toBe(true);
    }
  },
};

/**
 * THE LAPTOP, pinned to the Laptop width (1536): the column is well past the
 * step, so every control shows its word, and the 521px list shares the line
 * with the reading time.
 */
export const Laptop: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement }) => {
    const wide = await expectShareLinks(canvasElement);
    const oneLine = await expectCoverLine(canvasElement);
    if (window.innerWidth === 1536) {
      await expect(wide).toBe(true);
      await expect(oneLine).toBe(true);
    }
  },
};

/**
 * THE STRESS, at the 320 width (§7) as well as the net's two ('stress-320'),
 * and pinned there: the longest reading time the data allows. A 288px column
 * (273 behind a classic scrollbar) is too short for it and the 200px of
 * glyphs together, so the row takes a line of its own under it, still at the
 * row's end, every target still 44 × 44, nothing scrolling sideways.
 */
export const Stress320: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  render: (args) => (
    <CoverRow readingTime={READING_LONGEST}>
      <ShareLinks {...args} />
    </CoverRow>
  ),
  play: async ({ canvasElement }) => {
    const wide = await expectShareLinks(canvasElement);
    const oneLine = await expectCoverLine(canvasElement);
    if (window.innerWidth === 320) {
      await expect(wide).toBe(false);
      await expect(oneLine).toBe(false);
    }
  },
};
