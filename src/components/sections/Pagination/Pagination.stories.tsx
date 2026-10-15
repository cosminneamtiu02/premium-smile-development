import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { Pagination, type PaginationProps } from './Pagination';

// Sections/Pagination — the blog list's page navigation. The `Sections`
// title prefix routes every story to 390 + 1536 in the visual net
// (tests/visual/stories.spec.ts, §13); ManyPages adds the 320 stress width
// ('stress-320'), and SinglePage, which renders nothing, is never photographed
// ('no-visual'). The export NAMES are load-bearing — renaming one renames its
// baseline file. Every story pins its language (`globals.locale`, the
// siblings' convention): the band reads no message file — its words are props
// (§8.1) — but the decorator stamps `<html lang>` from that global.
//
// ── THE DECORATOR IS THE PAGE'S MOUNT: ui/Container, the column the blog
// list's band hands this row, then a flex column — sections/PostList's group
// of the grid and the pager — under the vertical air a list ends in. Every
// story passes PostList's own placement, `self-end` (meta's `args`), so the
// row stands where the page puts it: at the column's end edge, under the last
// card's bottom-right corner. The band owns no placement (§6.4) — that is the
// honest frame for it. ONE THING IT LEAVES OUT: PostList's rhythm box wears
// THE BAND SCALE, this frame does not, so at 1536 a story draws the 44px discs
// where the page draws them ≈48px (× s); Pagination.scale.test.tsx measures
// the scaled row.
//
// ── THE PLAYS HOLD AT EVERY WIDTH. The Vitest runner applies each story's
// viewport pin, the visual runner photographs every story at its own widths
// with the same play, and the row is ONE shape at every width now
// (Pagination.tsx's THE ROW), so one check proves it everywhere: no sideways
// scroll (§7), two 2.75rem discs with 1.25rem chevrons, 0.75rem either side of
// the counter, the three middles level, the row exactly as wide as its cells,
// its end on the column's end edge, the counter as wide as its invisible twin
// (THE ARROWS NEVER MOVE BETWEEN PAGES). Lengths are written in rem and read
// against the engine's root. The pins choose the width the Vitest run
// exercises: ManyPages at 320, MiddlePage at a phone's 390, the other two at
// the runner's own 1200.
//
// ── THE REAL FACE FIRST (the house's lesson, PR #125): Source Serif 4 is
// `font-display: block` in the workbench, so a play that measured before it
// arrived would lay the counter out in the fallback serif. Each play loads
// the counter's face, by its computed font, first. Nothing a play reads
// answers a pointer: the discs hold still on hover (no `motion` jump) and only
// their colours change, which no play reads — the one paint read is a
// DISABLED control's half opacity, and a disabled control takes no pointer —
// so the real pointer, wherever the runner left it, moves no measured box and
// changes no measured paint.
//
// Hrefs are fixtures in the shape the page builds — `/ro/blog/` for page 1,
// `/ro/blog/page/n/` after it. A click in the workbench navigates the canvas
// to that address, as a click on the site loads that page (§15.13).

/** The landmark's name in the shipped words — ro.json's
 *  `blog.pagination.label` (G2 react, 2026-10-14). */
const LABEL = 'Paginile articolelor';

/** The controls' names in the shipped words — ro.json's
 *  `blog.pagination.previous` / `.next` (Pagination.tsx's GLYPH-ONLY
 *  paragraph: names, never shown). */
const PREVIOUS = 'Pagina anterioară';
const NEXT = 'Pagina următoare';

/** The page's own addresses: page 1 at the blog's root, page n under /page/n/. */
const hrefOf = (page: number): string =>
  page === 1 ? '/ro/blog/' : `/ro/blog/page/${page}/`;

/** A CONSISTENT page — the shape the page builds, which the band's belt
 *  demands: a back href from page 2, a forward href before the last page. */
const pageArgs = (current: number, total: number): PaginationProps => ({
  label: LABEL,
  current,
  total,
  status: `Pagina ${current} din ${total}`,
  previousLabel: PREVIOUS,
  nextLabel: NEXT,
  ...(current > 1 ? { previousHref: hrefOf(current - 1) } : {}),
  ...(current < total ? { nextHref: hrefOf(current + 1) } : {}),
});

/** The root font size, read off the engine: the row's lengths are rem. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The landmark, by its name. */
const navIn = (canvasElement: HTMLElement): HTMLElement => {
  const nav = canvasElement.querySelector<HTMLElement>(
    `nav[aria-label="${LABEL}"]`,
  );
  if (!nav) throw new Error(`the navigation named „${LABEL}" is missing`);
  return nav;
};

/** The row's three cells, by structure: back · counter · forward. */
const cellsOf = (nav: HTMLElement) => {
  const [previous, counter, next] = [...nav.children];
  if (!previous || !counter || !next) {
    throw new Error('the row does not hold back · counter · forward');
  }
  return { previous, counter, next };
};

/** The real face, by the counter's computed font, before anything is
 *  measured — the discs hold no text. */
async function loadFace(nav: HTMLElement): Promise<void> {
  const { counter } = cellsOf(nav);
  const style = getComputedStyle(counter);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    counter.textContent ?? '',
  );
  await document.fonts.ready;
}

/** The middle of a box, down. */
const down = (box: DOMRect): number => box.top + box.height / 2;

/**
 * The row's geometry — Pagination.tsx's THE ROW and THE ARROWS NEVER MOVE
 * BETWEEN PAGES — as the page mounts it, at whatever width the play runs.
 */
async function expectShape(nav: HTMLElement): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

  const cells = cellsOf(nav);
  const previous = cells.previous.getBoundingClientRect();
  const counter = cells.counter.getBoundingClientRect();
  const next = cells.next.getBoundingClientRect();

  // Two discs, each the deck's 2.75rem circle round a 1.25rem chevron (§9's
  // 44px target at the default root).
  for (const control of [cells.previous, cells.next]) {
    const box = control.getBoundingClientRect();
    await expect(Math.abs(box.width - 2.75 * rem())).toBeLessThan(0.5);
    await expect(Math.abs(box.height - 2.75 * rem())).toBeLessThan(0.5);
    const glyph = control.querySelector('svg')?.getBoundingClientRect();
    if (!glyph) throw new Error('a control has no chevron');
    await expect(Math.abs(glyph.width - 1.25 * rem())).toBeLessThan(0.5);
  }
  // ONE line: the counter's middle level with both discs' middles.
  await expect(Math.abs(down(counter) - down(previous))).toBeLessThan(1);
  await expect(Math.abs(down(next) - down(previous))).toBeLessThan(1);
  // Back · counter · forward, 0.75rem apart — the reviews deck's gap.
  await expect(
    Math.abs(counter.left - previous.right - 0.75 * rem()),
  ).toBeLessThan(0.5);
  await expect(Math.abs(next.left - counter.right - 0.75 * rem())).toBeLessThan(
    0.5,
  );
  // The row hugs its cells…
  const row = nav.getBoundingClientRect();
  await expect(Math.abs(row.left - previous.left)).toBeLessThan(0.5);
  await expect(Math.abs(row.right - next.right)).toBeLessThan(0.5);
  // …and stands where sections/PostList puts it: the column's end edge.
  const column = nav.parentElement?.getBoundingClientRect();
  if (!column) throw new Error('the row has no column');
  await expect(Math.abs(row.right - column.right)).toBeLessThan(0.5);
  // The counter is as wide as its invisible twin, the widest fraction of the
  // list, so neither disc moves from one page to the next.
  const twin = cells.counter
    .querySelector('[aria-hidden="true"]')
    ?.children[1]?.getBoundingClientRect();
  if (!twin) throw new Error('the counter has no twin');
  await expect(Math.abs(counter.width - twin.width)).toBeLessThan(0.5);
}

const meta = {
  title: 'Sections/Pagination',
  component: Pagination,
  parameters: { layout: 'fullscreen' },
  // sections/PostList's placement of the row — the header's DECORATOR
  // paragraph.
  args: { className: 'self-end' },
  decorators: [
    (Story) => (
      <Container>
        <div className="flex flex-col py-12">
          <Story />
        </div>
      </Container>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description:
        'The navigation landmark’s accessible name — finished text (§8.1), never the role’s own word',
    },
    current: {
      control: 'number',
      description:
        'The page this is, from 1. The belt refuses a page that disagrees with its hrefs — change them together',
    },
    total: {
      control: 'number',
      description: 'How many pages there are. One page renders nothing at all',
    },
    status: {
      control: 'text',
      description:
        'The counter as the ear hears it („Pagina 2 din 3"), formatted by the page through ICU; the eye reads „2 / 3"',
    },
    previousLabel: {
      control: 'text',
      description:
        'The back control’s accessible name — never shown: the control is a chevron',
    },
    nextLabel: {
      control: 'text',
      description:
        'The forward control’s accessible name — never shown: the control is a chevron',
    },
    previousHref: {
      control: 'text',
      description:
        'Page current − 1, built by the page. Absent on page 1 (the control renders disabled), required after it',
    },
    nextHref: {
      control: 'text',
      description:
        'Page current + 1, built by the page. Absent on the last page (the control renders disabled), required before it',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the <nav> (§6.4/§6.8) — here sections/PostList’s `self-end`',
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * PAGE 1 OF 3 — the back disc greyed out (a disabled <button>, ui/GlyphButton's
 * disabled face at half opacity — a disabled control takes no pointer, so the
 * half holds wherever the pointer rests), the counter „1 / 3", the forward
 * disc a link to page 2.
 */
export const FirstPage: Story = {
  globals: { locale: 'ro' },
  args: pageArgs(1, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFace(nav);

    const previous = canvas.getByRole('button', { name: PREVIOUS });
    await expect(previous).toBeDisabled();
    await expect(getComputedStyle(previous).opacity).toBe('0.5');
    await expect(canvas.queryByRole('link', { name: PREVIOUS })).toBeNull();
    const next = canvas.getByRole('link', { name: NEXT });
    await expect(next).toHaveAttribute('href', '/ro/blog/page/2/');
    await expect(next).toHaveAttribute('rel', 'next');
    await expect(canvas.getByText('Pagina 1 din 3')).toBeInTheDocument();
    await expectShape(nav);
  },
};

/** PAGE 2 OF 3, ON A PHONE — both neighbours are links, in the same row. */
export const MiddlePage: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: pageArgs(2, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFace(nav);

    const previous = canvas.getByRole('link', { name: PREVIOUS });
    await expect(previous).toHaveAttribute('href', '/ro/blog/');
    await expect(previous).toHaveAttribute('rel', 'prev');
    const next = canvas.getByRole('link', { name: NEXT });
    await expect(next).toHaveAttribute('href', '/ro/blog/page/3/');
    await expect(next).toHaveAttribute('rel', 'next');
    await expect(canvas.queryByRole('button')).toBeNull();
    await expectShape(nav);
  },
};

/** PAGE 3 OF 3 — the last page: the forward disc greyed out, the back one a link. */
export const LastPage: Story = {
  globals: { locale: 'ro' },
  args: pageArgs(3, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFace(nav);

    const next = canvas.getByRole('button', { name: NEXT });
    await expect(next).toBeDisabled();
    await expect(getComputedStyle(next).opacity).toBe('0.5');
    await expect(canvas.queryByRole('link', { name: NEXT })).toBeNull();
    await expect(canvas.getByRole('link', { name: PREVIOUS })).toHaveAttribute(
      'href',
      '/ro/blog/page/2/',
    );
    await expectShape(nav);
  },
};

/**
 * PAGE 9 OF 12, AT THE 320 WIDTH — the widest counter a list can show sits
 * beside a page number that has not gained its second digit yet: the cell
 * keeps the width of „12 / 12" (the invisible twin), so the next page, „10 /
 * 12", moves neither disc. The row is 158 px, the narrowest column 273 — no
 * sideways scroll. Pinned at 320 in the workbench and photographed there too
 * ('stress-320').
 */
export const ManyPages: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: pageArgs(9, 12),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFace(nav);

    await expect(canvas.getByRole('link', { name: PREVIOUS })).toHaveAttribute(
      'href',
      '/ro/blog/page/8/',
    );
    await expect(canvas.getByRole('link', { name: NEXT })).toHaveAttribute(
      'href',
      '/ro/blog/page/10/',
    );
    await expect(canvas.getByText('9 / 12')).toBeVisible();
    await expect(canvas.getByText('12 / 12')).not.toBeVisible();
    await expect(canvas.getByText('Pagina 9 din 12')).toBeInTheDocument();
    await expectShape(nav);
  },
};

/**
 * ONE PAGE — nothing to page through, so the band renders nothing: no
 * landmark, no element. Never photographed ('no-visual'): its frame would be
 * the empty column.
 */
export const SinglePage: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro' },
  args: pageArgs(1, 1),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(canvasElement.querySelector('nav')).toBeNull();
  },
};
