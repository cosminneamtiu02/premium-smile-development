import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import {
  SectionHeading,
  type SectionHeadingAlign,
  type SectionHeadingLevel,
} from './SectionHeading';

// Five stories, and the visual manifest says exactly five: the everyday
// opener, the card shape, the title on its own, and the two expansion
// stresses. The `Sections/*` title prefix is what routes them to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag on the last two
// adds the accessibility width on top. The export NAMES are load-bearing —
// renaming one renames its baseline file.
//
// ── NO PINNED VIEWPORTS in this file, unlike Header/Footer/Wordmark, and the
// convention copied here is LanguageSwitcher's. Those three change SHAPE with
// the box they are handed (container steps, a burger that only exists below a
// width), so a story that did not pin one would photograph an accident. This
// section has no container query and no media query at all — one column at
// every width, wrapping where the text runs out of room — so the two widths
// the title prefix already routes it to ARE the story, and the manual
// workbench keeps its toolbar.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`, even though
// this section reads no message file (its two strings are props, §8.1 — the
// consuming section owns the keys). The pin is not decoration: the preview
// decorator stamps `<html lang>` from that global, and `hyphens: auto` picks
// its dictionary from the declared language (§15.14). Romanian by default
// (§15.7); GermanLongest keeps the FRAME Romanian and declares German on the
// block itself, which is the ui/Heading SectionStep precedent (fb-315…318) —
// the one line that must break under German patterns says so about itself.
// Flip the toolbar to Pseudo over any of these and nothing changes: that is
// the §8.9 sweep PASSING, and the reason the pseudo stress below is typed out
// as a fixture rather than produced by the toolbar.
//
// ── NO `parameters.nextjs`. Nothing here reads a pathname and nothing links:
// the block is inert HTML (§16), so there is no pretend route to stage.
//
// ── THE DECORATOR IS PAGE GROUND, not a frame. This component owns no width
// and no margin (§6.4) — dropped onto a bare canvas it would photograph a
// title stretched across 1536px, which no page produces. `max-w-3xl` with a
// gutter is the ordinary content column every consumer of this opener sits in,
// and it is also what makes the 320 stress honest: 20rem minus 2 × 1.5rem of
// gutter is the real column a phone gives a 30px serif line.

const meta = {
  title: 'Sections/SectionHeading',
  component: SectionHeading,
  args: { title: 'Vizitează clinica noastră' },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono kicker above the title — finished, already-translated text (§8.1). Omitted → no eyebrow row at all, not an empty one',
    },
    title: {
      control: 'text',
      description: 'The section title, finished and already translated (§8.1)',
    },
    level: {
      control: 'inline-radio',
      options: [2, 3] satisfies SectionHeadingLevel[],
      description:
        'Which REAL heading element the title becomes — the document outline, independent of the look (the size step is always `section`). Default 2; 3 is the card shape, nested under a section that already opened with an h2. v1 offers no 1 and no 4–6: zero old call sites, and the page owns its one h1',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center'] satisfies SectionHeadingAlign[],
      description:
        'Default `start`. `end` was cut with the other four unused axes (0 old call sites) and joins additively if a design ever measures one',
    },
    id: {
      control: 'text',
      description:
        'Set on the HEADING element, never on the root — the half of the aria-labelledby pair a wrapping <section> points at (see the Default story, which wires the real thing)',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the root (§6.4/§6.8) — every old call site used it for `mb-12 sm:mb-16`, which stays the parent’s business',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY OPENER — the clinic-location shape, the pair the old site
 * really ships: "Ne găsești" over "Vizitează clinica noastră", start-aligned,
 * a real <h2>.
 *
 * It is also the one story that wires the `id` end to end: the ground is a
 * <section aria-labelledby> pointing at the heading, which is what every old
 * call site did around this component and the only reason the prop exists. The
 * play function reads the result back as a NAMED REGION — the accessible name
 * computed by the browser, not an attribute we placed — so a regression that
 * moved the id onto the wrapper would fail here even though the DOM still
 * "has" the id somewhere.
 *
 * The second measurement is the one no unit test can make (the interaction
 * suite loads no stylesheet): the 8px column gap. That number is the dropped
 * ui/Stack's `gap="sm"` (D3), so it is the proof that removing an atom moved
 * nothing on screen.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  args: { eyebrow: 'Ne găsești', id: 'sectiune-locatie' },
  decorators: [
    (Story) => (
      <section aria-labelledby="sectiune-locatie">
        <Story />
      </section>
    ),
  ],
  play: async ({ canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', {
      level: 2,
      name: 'Vizitează clinica noastră',
    });
    // The pairing, as the accessibility tree sees it: the section is named by
    // the title alone — not by the eyebrow and the title read together, which
    // is what an id on the wrapper would have produced.
    await expect(
      canvas.getByRole('region', { name: 'Vizitează clinica noastră' }),
    ).toContainElement(heading);

    const root = heading.parentElement as HTMLElement;
    await expect(getComputedStyle(root).rowGap).toBe('8px');
    // §7: nothing may require horizontal scrolling, at any sampled width.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await expect(canvasElement.querySelectorAll('h2')).toHaveLength(1);
  },
};

/**
 * THE CARD SHAPE — doctor-card and helping-staff-card in the old repo: an
 * eyebrow over a person's name, centred, at level 3 because the section around
 * it already opened with an <h2>.
 *
 * This is the story that retires `visualLevel`. The old component needed that
 * axis to say "level 3, but big"; here the level and the look are separate by
 * construction — ui/Heading's `section` step lands on whatever element this
 * section hands it — so the h3 below is byte-identically dressed to the h2
 * above it.
 *
 * The play asserts the CENTRING as geometry (the eyebrow's box centred in the
 * column), not as a class: one line of kicker centres because `items-center`
 * centres the box and the box hugs its text. A wrapping centred eyebrow is the
 * documented limit in SectionHeading.tsx — globals.css aligns every <p> to
 * `start` directly, which beats an inherited `center` — and it is a board
 * question, not something a story may quietly paper over.
 */
export const CenterLevel3: Story = {
  globals: { locale: 'ro' },
  args: {
    eyebrow: 'Părerea ta contează',
    title: 'Dr. Elena Marin',
    level: 3,
    align: 'center',
  },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 3,
      name: 'Dr. Elena Marin',
    });
    await expect(canvas.queryByRole('heading', { level: 2 })).toBeNull();
    await expect(getComputedStyle(heading).textAlign).toBe('center');

    const root = heading.parentElement as HTMLElement;
    const eyebrow = canvas.getByText('Părerea ta contează');
    const box = eyebrow.getBoundingClientRect();
    const column = root.getBoundingClientRect();
    await expect(
      Math.abs((box.left + box.right) / 2 - (column.left + column.right) / 2),
    ).toBeLessThan(1);
  },
};

/**
 * TITLE ONLY — the eyebrow is optional, and "optional" here means the row is
 * ABSENT rather than empty: no blank paragraph for a screen reader to stop on,
 * and no phantom 8px where a kicker would have been. Worth its own picture
 * because that second half is invisible in code review and obvious in a
 * baseline: the title sits flush against whatever the parent put above it.
 */
export const NoEyebrow: Story = {
  globals: { locale: 'ro' },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — a real compound
 * that cannot break at a space, sampled at 320px where the column is 272px
 * wide and a 30px serif line has nowhere to go.
 *
 * `lang="de"` rides the prop spread onto the ROOT and inherits to both
 * children, which is the whole mechanism: CSS `hyphens: auto` (§15.14) picks
 * its dictionary from the element's declared language, so this block breaks
 * "Behandlungsschwerpunkte" under German patterns while the document around it
 * stays Romanian — the ui/Heading SectionStep precedent, one tier up.
 *
 * The play is deliberately one assertion: at the widths this story is sampled
 * at, nothing may need horizontal scrolling (§7, §9). If hyphenation ever
 * stopped engaging, the compound would push the column open and this fails
 * before a baseline does.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro' },
  args: {
    eyebrow: 'So finden Sie uns',
    title: 'Behandlungsschwerpunkte und Anfahrtsbeschreibung',
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 2 });
    const root = heading.parentElement as HTMLElement;

    await expect(root).toHaveAttribute('lang', 'de');
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this section reads none (its strings are props, §8.1). Flipping to
 * Pseudo over any other story here changes nothing, which is that sweep
 * passing; the expansion stress still has to happen somewhere, and this is it.
 *
 * The strings are the Default pair put through the preview's own transform —
 * the same ACCENT map, the same `·`-padding at 40% of the source length — so
 * what is sampled is the width the real pipeline would produce, not a longer
 * string someone invented.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro' },
  args: {
    eyebrow: 'Ñé găšéșťí ····',
    title: 'Vížíťéážă çlíñíçá ñóášťră ··········',
  },
};
