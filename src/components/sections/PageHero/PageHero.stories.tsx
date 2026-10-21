import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, getDefaultNormalizer, within } from 'storybook/test';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { PageHero } from './PageHero';
import { namedAs, stairwayViolations } from './PageHero.fixtures';

// Sections/PageHero — a page's centred hero: its <h1> over a lead, both
// centred, stepping down like a stairway on a laptop or a desktop. THREE
// stories, one per copy it ships with that a frame should show: the Team
// page's Romanian hero (Team, the default), the Team page's German one
// (TeamGerman — §13's longest language), and the blog list's Romanian hero
// (Blog — its first consumer, whose band's own stories show it in place,
// Sections/PostList). The export NAMES are load-bearing — each names a
// baseline file — so this list IS the hero's contribution to a lane's visual
// manifest. `Sections/*` routes every story to 390 + 1536
// (tests/visual/stories.spec.ts, §13).
//
// ── THE DECORATOR IS ITS CONSUMERS' BAND. The hero places nothing around
// itself (§6.4), and every regime class on it reads ui/Container's column,
// so each story renders it where its consumers do: a <section>, ui/Container
// and a flex column wearing ui/Container's two band-scale strings
// (`bandColumnClasses` and `bandScaleClasses`, imported, never re-spelled) —
// the shape of sections/PostList's rhythm box and of sections/DoctorShowcase's
// page opener, without the room and the gaps each band owns, and the very
// shape PageHero.scale.test.tsx measures in. Dropped on a bare canvas it would
// photograph a hero outside the regime and outside the column every page
// gives it. `layout: 'fullscreen'`, so the gutter is the page's own (the
// canvas's padding would narrow the column by 2rem).
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it): Romanian, the house default (§13), and German for TeamGerman.
// Two pin a VIEWPORT for the Vitest storybook project — TeamGerman the
// laptop's 1536, inside the band scale, and Blog a phone's 390, outside it —
// while Team opens at the runner's own 1200, a laptop window inside the
// scale. The visual net ignores the pins (it sets its own page size per
// project), so every play DERIVES what it expects from what it measures: the
// stairway's two and three lines only where the band is scaled.
//
// ── WHAT THE PLAYS MEASURE. The real face first: Storybook loads Source
// Serif 4 under its own family name, `font-display: block`, so a play that
// measured before it arrived would lay the words out in a fallback — each
// block's face is asked for by its COMPUTED font (the PostCard and Pagination
// stories' idiom). Then the hero's outline and words: ONE <h1>, named by the
// title (PageHero.fixtures.ts's `namedAs` — the copy's line break is a space
// to a screen reader), over the lead's <p>, its text as given; then THE
// PREMISES — the band is scaled exactly where the regime's three conditions
// hold (`scalableHere`), asserted, so a regime that silently stopped applying
// can never leave the stairway's checks standing on nothing (G2 typescript);
// and, where the band is scaled, THE STAIRWAY read by PageHero.fixtures.ts's
// one reader, `stairwayViolations`, its list empty. Every number — the
// steps, the reach, the size — is PageHero.scale.test.tsx's, for every copy
// that ships.

/** The band its consumers give it (the header's THE DECORATOR): the flex
 *  column wearing ui/Container's two band-scale strings. */
const BAND = cx('flex flex-col', bandColumnClasses, bandScaleClasses);

const inBand: Decorator = (Story) => (
  <section>
    <Container>
      <div className={BAND}>
        <Story />
      </div>
    </Container>
  </section>
);

/** IS THE BAND SCALED? globals.css's `design-scale` remaps `--spacing` on
 *  the box that wears it; elsewhere a box inherits the root's
 *  (PageHero.scale.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing');

/** THE REGIME'S STEP, written out: ui/Container's column at max(56rem, 896px)
 *  — the band scale's chain `scalable:@4xl:@min-[896px]:`. */
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** SHOULD THE BAND BE SCALED HERE? The regime's three conditions, read off
 *  the runner (DoctorShowcase.stories.tsx's `scalable`): a fine primary
 *  pointer and an engine that registers custom properties — globals.css's
 *  THE SCALABLE VARIANT — and ui/Container's column past THE REGIME'S STEP. */
const scalableHere = (column: Element): boolean =>
  window.matchMedia('(pointer: fine)').matches &&
  CSS.supports('color', 'rgb(from red r g b)') &&
  column.getBoundingClientRect().width >= Math.max(rem(STEP_REM), STEP_FLOOR);

/** The real face, by each block's computed font, before anything is measured. */
async function loadFace(root: HTMLElement): Promise<void> {
  for (const element of root.querySelectorAll<HTMLElement>('h1, p')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** Nothing may require horizontal scrolling (§7, §9) — the page measured by
 *  the root's own BOX, which ends where a reserved scrollbar gutter begins
 *  (PostList.stories.tsx's expectNoSidewaysScroll, and its reason). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(root.getBoundingClientRect().width),
  );
}

/**
 * THE HERO — one <h1>, named by the title as a screen reader hears it, over
 * the lead's <p>, its text as given (line breaks and no-break spaces kept),
 * the two the <header>'s only children; the band scaled exactly where its
 * premises hold (`scalableHere`); where it is, THE STAIRWAY's five rules
 * unbroken (`stairwayViolations` empty); off the scale the copy's breaks are
 * spaces, and no line count is asserted — the prose wraps where its column
 * ends. Nothing to scroll sideways.
 */
async function expectHero(
  canvasElement: HTMLElement,
  args: { title: string; lead: string },
): Promise<void> {
  await loadFace(canvasElement);
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const h1 = canvas.getByRole('heading', {
    level: 1,
    name: namedAs(args.title),
  });
  const header = h1.parentElement;
  const band = header?.parentElement;
  const column = band?.parentElement;
  if (!header || !band || !column) throw new Error('the hero lost its band');
  await expect(header.tagName).toBe('HEADER');
  // The lead's text holds its line breaks: a normalizer that keeps them.
  const lead = within(header).getByText(args.lead, {
    normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
  });
  await expect(lead.tagName).toBe('P');
  await expect([...header.children]).toEqual([h1, lead]);
  // THE PREMISES, then the stairway where they hold.
  const scalable = scalableHere(column);
  await expect(remapped(band)).toBe(scalable);
  if (scalable) {
    await expect(stairwayViolations({ h1, lead }, args)).toEqual([]);
  }
  await expectNoSidewaysScroll();
}

const meta = {
  title: 'Sections/PageHero',
  component: PageHero,
  parameters: { layout: 'fullscreen' },
  decorators: [inBand],
  args: {
    title: ro.team.hero.title,
    lead: ro.team.hero.lead,
  },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The page’s one <h1>, on ui/Heading’s `hero-scaled` step (`hero`, and 65.04 design pixels inside the band scale — the doctor page’s name’s size — and there as wide as its first line, up to 135 design pixels past the column a side) — finished text with ONE line break where the stairway turns: two lines on a laptop or desktop, the second the shorter; elsewhere the break is a space',
    },
    lead: {
      control: 'text',
      description:
        'The grey paragraph under the heading, centred — finished text with TWO line breaks: three lines on a laptop or desktop, each shorter than the one above; elsewhere the breaks are spaces',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <header> (§6.4/§6.8) — the band that composes the hero owns the room around it',
    },
  },
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE TEAM PAGE'S HERO, in Romanian — „Echipa noastră: specialiștii cu care
 * ne mândrim / și oamenii care te întâmpină la clinică" over its three-line
 * lead (team.hero.*, Claude's drafts, flagged). Unpinned: the Vitest run
 * renders it at the runner's 1200, inside the band scale, so the play proves
 * the stairway's two and three lines; the net photographs it at 390 (prose)
 * and 1536 (the stairway).
 */
export const Team: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectHero(canvasElement, args);
  },
};

/**
 * THE TEAM PAGE'S HERO, in German — the longest language (§13's DE stress):
 * „Unser Team: Fachleute, auf die wir stolz sind, / und alle, die Sie bei
 * uns empfangen". Pinned to the laptop's 1536, so the Vitest run proves the
 * German stairway inside the band scale.
 */
export const TeamGerman: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  args: {
    title: de.team.hero.title,
    lead: de.team.hero.lead,
  },
  play: async ({ args, canvasElement }) => {
    await expectHero(canvasElement, args);
  },
};

/**
 * THE BLOG LIST'S HERO, in Romanian — its first consumer's copy, „Pentru că
 * ne pasă de zâmbetul tău, îți arătăm / cum să ai grijă de el prin blogul
 * nostru" (sections/PostList shows it in place). Pinned to a phone (390), so
 * the Vitest run proves the hero off the band scale: the copy's breaks are
 * spaces and both blocks wrap as prose.
 */
export const Blog: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    title: ro.blog.hero.title,
    lead: ro.blog.hero.lead,
  },
  play: async ({ args, canvasElement }) => {
    await expectHero(canvasElement, args);
    // Off the scale the copy's breaks collapse into spaces (THE STAIRWAY).
    const h1 = within(canvasElement).getByRole('heading', { level: 1 });
    const band = h1.parentElement?.parentElement;
    if (!band) throw new Error('the hero lost its band');
    if (!remapped(band)) {
      await expect(getComputedStyle(h1).whiteSpace).toBe('normal');
    }
  },
};
