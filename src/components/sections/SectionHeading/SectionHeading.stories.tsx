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
// section writes no container query and no media query of its own — one
// column at every width, wrapping where the text runs out of room. Its title
// does answer to its COLUMN since D48 (ui/Heading's `band` step: 30px under
// a 28rem container, 36px from it), but that is a size, not a shape, and the
// two widths the title prefix already routes it to photograph both halves —
// 390's page column is under the step, 1536's is over it (CenterLevel3's card
// column stays under at every width) — so they ARE the story, and the manual
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
// gutter is no wider than the column a phone gives a 30px serif line (the
// narrow half of ui/Heading's `band` step, D48) — ui/Container's is 288px at
// a 320 phone since its PHONE GUTTER of 2026-10-09, so this frame is the
// stricter of the two. It is ALSO a `@container`, because the
// column every consumer sits in is one — ui/Container's `containerClasses`
// and ui/Card's root both carry the mark — and since D48 the title's size
// depends on it: the `band` step reads its `@md:` half off the nearest
// container. Without the mark the step falls back to its 30px at every width
// (it fails small, never large), a picture of the fallback rather than of the
// step every consumer wears. The mark moves no box: inline-size containment
// only stops a block's width from following its content, and this block's
// width already follows its parent.

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
        'Which REAL heading element the title becomes — the document outline, independent of the look (the size step is always `band`, D48: 30px under a 28rem column, 36px from it). Default 2; 3 is the card shape, nested under a section that already opened with an h2. v1 offers no 1 and no 4–6: zero old call sites, and the page owns its one h1',
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
      <div className="@container mx-auto max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The root font size, read off the engine: the plays assert in rem, the unit
    every size in this repo is written in (§7). */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

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
 * The next two measurements are the ones no unit test can make (the
 * interaction suite loads no stylesheet): the 8px column gap — the dropped
 * ui/Stack's `gap="sm"` (D3), so the proof that removing an atom moved nothing
 * on screen — and the title's computed size, which since D48 is a function of
 * its COLUMN (ui/Heading's `band` step: 30px under the container's 28rem `@md`
 * step, 36px from it). So the play asserts no constant: it finds the container
 * the variant queries — the nearest ancestor the ENGINE reports as one, the
 * decorator's — measures its content box (the box a size query reads) and
 * asserts the size that width implies. In the Vitest runner the canvas is
 * 1200px wide — a 720px column — so the run pins the 36px half; the 390
 * visual width photographs the 30px one. The narrow half is ASSERTED in
 * CenterLevel3 (a 20rem card column, under the step at every width), and the
 * split at its exact threshold — a 320px frame beside a 448px one — is
 * ui/Heading's Band story's.
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
    // D48: the size the column implies — the unit suite pins the class, this
    // pins what the class paints. The container is found the way the engine
    // resolves an unnamed `@md:`, the nearest ancestor whose container-type is
    // not `normal`; a lost mark ends the walk at null and fails HERE, instead
    // of letting the 30px fallback pass for the narrow half.
    let frame = root.parentElement;
    while (frame && getComputedStyle(frame).containerType === 'normal') {
      frame = frame.parentElement;
    }
    await expect(frame).toBeInstanceOf(HTMLElement);
    const container = frame as HTMLElement;
    const box = getComputedStyle(container);
    // The CONTENT box is what a size query reads — the decorator's p-6 is
    // outside it.
    const column =
      container.clientWidth -
      parseFloat(box.paddingLeft) -
      parseFloat(box.paddingRight);
    // 28rem = the container's `@md` step (inclusive); text-4xl = 2.25rem,
    // text-3xl = 1.875rem.
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBe(
      (column >= 28 * rem() ? 2.25 : 1.875) * rem(),
    );
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
 * construction — ui/Heading's `band` step (D48) lands on whatever element this
 * section hands it — so the h3 below is byte-identically dressed to the h2
 * above it.
 *
 * The play asserts the CENTRING as geometry (the eyebrow's box centred in the
 * column), not as a class: one line of kicker centres because `items-center`
 * centres the box and the box hugs its text. A wrapping centred eyebrow is the
 * documented limit in SectionHeading.tsx — globals.css aligns every <p> to
 * `start` directly, which beats an inherited `center` — and it is a board
 * question, not something a story may quietly paper over.
 *
 * It is also D48's NARROW HALF. A card shape sits in a card, and a card is a
 * container of its own (ui/Card's root carries the mark), so the story frames
 * it in a 20rem `@container` — `max-w-xs`, never a fixed width, so it fits the
 * 390 and 320 columns too. At 20rem the column is under the `band` step's
 * 28rem at every width this story is photographed or run at, and the play
 * asserts the 30px that implies: the frame first (a container, under the
 * step), so a utility that failed to generate cannot let the size pass for
 * the wrong reason — without the frame's mark the page column would answer,
 * and the title would read 36px here.
 */
export const CenterLevel3: Story = {
  globals: { locale: 'ro' },
  args: {
    eyebrow: 'Părerea ta contează',
    title: 'Dr. Elena Marin',
    level: 3,
    align: 'center',
  },
  decorators: [
    (Story) => (
      <div className="@container mx-auto max-w-xs">
        <Story />
      </div>
    ),
  ],
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

    // D48's narrow half: the card frame is a container, and it is under the
    // 28rem step — so the title rests at text-3xl, 1.875rem.
    const frame = root.parentElement as HTMLElement;
    await expect(getComputedStyle(frame).containerType).toBe('inline-size');
    await expect(frame.clientWidth).toBeLessThan(28 * rem());
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBe(
      1.875 * rem(),
    );
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
 * wide and a 30px serif line (the `band` step's narrow half — the column is
 * under its 28rem container step, D48) has nowhere to go.
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
