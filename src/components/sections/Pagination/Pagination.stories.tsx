import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { Pagination, type PaginationProps } from './Pagination';

// Sections/Pagination — the blog index's page navigation. The `Sections`
// title prefix routes every story to 390 + 1536 in the visual net
// (tests/visual/stories.spec.ts, §13); LongLabels adds the 320 stress width
// ('stress-320'), and SinglePage, which renders nothing, is never photographed
// ('no-visual'). The export NAMES are load-bearing — renaming one renames its
// baseline file. Every story pins its language (`globals.locale`, the
// siblings' convention): the band reads no message file — its words are props
// (§8.1) — but the decorator stamps `<html lang>` from that global.
//
// ── THE DECORATOR IS PAGE GROUND: ui/Container, the column the blog index's
// band hands this row, under the vertical air a list of cards ends in. The
// band owns no width (§6.4), and its one-row/two-row step reads its OWN width
// (Pagination.tsx's THE ROW), so the honest frame is the column a page gives
// it: 288px at a 320 window, 273 behind a classic scrollbar.
//
// ── THE PLAYS HOLD AT EVERY WIDTH. The Vitest runner applies each story's
// viewport pin, the visual runner photographs every story at its own widths
// with the same play, so a play decides which shape to expect from the width
// the nav really has — one row from 20rem, two below — and then proves that
// shape: no sideways scroll (§7), both controls inside the nav and at least
// 44px tall (§9), the back control at the start, the forward one at the end,
// the counter on the centre line. The pins choose which branch the Vitest run
// exercises: LongLabels at 320 (two rows), MiddlePage at a phone's 390 (one
// row), the other two at the runner's own 1200.
//
// ── THE REAL FACE FIRST (the house's lesson, PR #125): Source Serif 4 is
// `font-display: block` in the workbench, so a play that measured before it
// arrived would lay the labels out in the fallback serif. Each play loads the
// face of every control and of the counter, by their computed font, first.
// Nothing a play reads answers a pointer: the controls hold still on hover
// (no `motion` jump) and only their colours change, which no play reads — the
// one paint read is a DISABLED control's half opacity, and a disabled control
// takes no pointer — so the real pointer, wherever the runner left it, moves
// no measured box and changes no measured paint.
//
// Hrefs are fixtures in the shape the page builds — `/ro/blog/` for page 1,
// `/ro/blog/page/n/` after it. A click in the workbench navigates the canvas
// to that address, as a click on the site loads that page (§15.13).

/** The landmark's name in the shipped words — ro.json's
 *  `blog.pagination.label` (G2 react, 2026-10-14). */
const LABEL = 'Paginile articolelor';

/** The page's own addresses: page 1 at the blog's root, page n under /page/n/. */
const hrefOf = (page: number): string =>
  page === 1 ? '/ro/blog/' : `/ro/blog/page/${page}/`;

/** The everyday pair, and the two-word pair that stresses the 320 row. */
const SHORT = { previousLabel: 'Anterior', nextLabel: 'Următor' } as const;
const LONG = {
  previousLabel: 'Pagina anterioară',
  nextLabel: 'Pagina următoare',
} as const;

/** A CONSISTENT page — the shape the page builds, which the band's belt
 *  demands: a back href from page 2, a forward href before the last page. */
const pageArgs = (
  current: number,
  total: number,
  labels: {
    readonly previousLabel: string;
    readonly nextLabel: string;
  } = SHORT,
): PaginationProps => ({
  label: LABEL,
  current,
  total,
  status: `Pagina ${current} din ${total}`,
  ...labels,
  ...(current > 1 ? { previousHref: hrefOf(current - 1) } : {}),
  ...(current < total ? { nextHref: hrefOf(current + 1) } : {}),
});

/** The root font size, read off the engine: the row's step is 20rem. */
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

/** The real face, by each element's computed font, before anything is measured. */
async function loadFaces(nav: HTMLElement): Promise<void> {
  for (const element of nav.querySelectorAll<HTMLElement>('a, button, p')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** The middle of a box, across and down. */
const across = (box: DOMRect): number => box.left + box.width / 2;
const down = (box: DOMRect): number => box.top + box.height / 2;

/**
 * The row's geometry at the width the nav has — Pagination.tsx's THE ROW, AND
 * WHERE IT GIVES WAY: ONE ROW from 20rem of nav, the three cells on one line
 * with their middles level; TWO ROWS below it, the controls sharing the first
 * line and the counter under both. In both shapes: nothing scrolls sideways,
 * both controls sit inside the nav at 44px or taller, the back control at the
 * start, the forward one at the end, the counter on the centre line.
 */
async function expectShape(nav: HTMLElement): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

  const box = nav.getBoundingClientRect();
  const controls = [...nav.querySelectorAll<HTMLElement>('a, button')];
  await expect(controls).toHaveLength(2);
  const [previous, next] = controls.map((control) =>
    control.getBoundingClientRect(),
  );
  if (!previous || !next) throw new Error('a control is missing');
  const fractionElement = nav.querySelector('[aria-hidden="true"]');
  if (!fractionElement) throw new Error('the visible counter is missing');
  const fraction = fractionElement.getBoundingClientRect();

  for (const control of [previous, next]) {
    await expect(control.left).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(control.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(control.height).toBeGreaterThanOrEqual(44 - 0.5);
  }
  // A face as wide as its label, never as its track — the reference's
  // compact buttons: a label on one line is its text plus the face's own
  // inline padding. (A label broken onto two lines may take its share of the
  // two-row line, by design, so it is not held to this.)
  for (const control of controls) {
    const text = document.createRange();
    text.selectNodeContents(control);
    const words = text.getBoundingClientRect();
    const style = getComputedStyle(control);
    if (words.height < 1.5 * parseFloat(style.lineHeight)) {
      const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      await expect(
        Math.abs(control.getBoundingClientRect().width - words.width - padding),
      ).toBeLessThan(1);
    }
  }
  await expect(Math.abs(previous.left - box.left)).toBeLessThan(1);
  await expect(Math.abs(next.right - box.right)).toBeLessThan(1);
  await expect(Math.abs(across(fraction) - across(box))).toBeLessThan(1);

  if (box.width >= 20 * rem()) {
    // ONE ROW: the counter's middle level with both controls' middles.
    await expect(Math.abs(down(fraction) - down(previous))).toBeLessThan(1);
    await expect(Math.abs(down(fraction) - down(next))).toBeLessThan(1);
  } else {
    // TWO ROWS: the controls share the first line, the counter is under both.
    await expect(Math.abs(down(previous) - down(next))).toBeLessThan(1);
    await expect(fraction.top).toBeGreaterThanOrEqual(
      Math.max(previous.bottom, next.bottom),
    );
  }
}

const meta = {
  title: 'Sections/Pagination',
  component: Pagination,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Container>
        <div className="py-12">
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
    previousLabel: { control: 'text', description: 'The back control’s label' },
    nextLabel: { control: 'text', description: 'The forward control’s label' },
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
        'Placement and spacing only, merged LAST onto the <nav> (§6.4/§6.8)',
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * PAGE 1 OF 3 — the reference's first page: the back control greyed out (a
 * disabled <button>, ui/Button's disabled face at half opacity — a disabled
 * control takes no pointer, so the half holds wherever the pointer rests),
 * the counter „1 / 3", the forward control a link to page 2.
 */
export const FirstPage: Story = {
  globals: { locale: 'ro' },
  args: pageArgs(1, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFaces(nav);

    const previous = canvas.getByRole('button', { name: 'Anterior' });
    await expect(previous).toBeDisabled();
    await expect(getComputedStyle(previous).opacity).toBe('0.5');
    await expect(canvas.queryByRole('link', { name: 'Anterior' })).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Următor' })).toHaveAttribute(
      'href',
      '/ro/blog/page/2/',
    );
    await expect(canvas.getByText('Pagina 1 din 3')).toBeInTheDocument();
    await expectShape(nav);
  },
};

/**
 * PAGE 2 OF 3, ON A PHONE — both neighbours are links, and a phone's column
 * (351px at 390, 336 behind a classic scrollbar) holds the everyday pair in
 * the reference's one row.
 */
export const MiddlePage: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: pageArgs(2, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFaces(nav);

    await expect(
      canvas.getByRole('link', { name: 'Anterior' }),
    ).toHaveAttribute('href', '/ro/blog/');
    await expect(canvas.getByRole('link', { name: 'Următor' })).toHaveAttribute(
      'href',
      '/ro/blog/page/3/',
    );
    await expect(canvas.queryByRole('button')).toBeNull();
    await expectShape(nav);
  },
};

/** PAGE 3 OF 3 — the last page: the forward control greyed out, the back one a link. */
export const LastPage: Story = {
  globals: { locale: 'ro' },
  args: pageArgs(3, 3),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFaces(nav);

    const next = canvas.getByRole('button', { name: 'Următor' });
    await expect(next).toBeDisabled();
    await expect(getComputedStyle(next).opacity).toBe('0.5');
    await expect(canvas.queryByRole('link', { name: 'Următor' })).toBeNull();
    await expect(
      canvas.getByRole('link', { name: 'Anterior' }),
    ).toHaveAttribute('href', '/ro/blog/page/2/');
    await expectShape(nav);
  },
};

/**
 * THE STRESS, AT THE 320 WIDTH — the two-word pair „Pagina anterioară" /
 * „Pagina următoare" on a middle page, so both controls are links. The row
 * cannot hold it at 320: even with each label broken onto two lines the three
 * cells need 315.5px against the column's 288 (273 behind a classic
 * scrollbar), so below the nav's 20rem it gives way gracefully — the controls
 * side by side, each label on two lines, the counter centred on a line of its
 * own under them, and nothing scrolling sideways. At 390 and 1536 (the net's
 * other two frames, the same play) the pair is back in one row. Pinned at 320
 * in the workbench and photographed there too ('stress-320').
 */
export const LongLabels: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: pageArgs(2, 3, LONG),
  play: async ({ canvas, canvasElement }) => {
    const nav = navIn(canvasElement);
    await loadFaces(nav);

    await expect(
      canvas.getByRole('link', { name: 'Pagina anterioară' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Pagina următoare' }),
    ).toBeInTheDocument();
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
