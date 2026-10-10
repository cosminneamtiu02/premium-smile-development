import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Eyebrow, type EyebrowSize } from './Eyebrow';
import { Heading } from '../Heading/Heading';

// One story per meaningful state (§13), six in total — they are also the
// declared visual manifest for this lane, so the export NAMES are
// load-bearing: renaming one renames its baseline file. The sixth, CardStep,
// joined 2026-10-10 with the `card` step (sections/PersonnelCard D20).
// `UI/*` routes this atom to the 1280 visual project only (§13); the two
// wrap-sensitive stories opt into the 320px accessibility width via the
// 'stress-320' tag.
// Demo values are Romanian with diacritics (§15.7) and are the REAL strings
// the old site ships — home.location.eyebrow and home.reviews.eyebrow — so
// the story shows the atom doing its actual job, not a lorem stand-in.
// Copy is factual only — no superlatives, no promotions, no result guarantees
// (CMSR advertising rules for dental practices, in force since 2025-07-01).

const meta = {
  title: 'UI/Eyebrow',
  component: Eyebrow,
  args: {
    // The clinic-location eyebrow: the string that opens the section this
    // atom was migrated for.
    children: 'Ne găsești',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'card'] satisfies EyebrowSize[],
      description:
        "The step, by role: 'default' = the site's one eyebrow, 14px — pinned forever, so a bare <Eyebrow> never moves · 'card' = a doctor card's specialty (2026-10-10, PersonnelCard D20): 13.2px on a snug line in a container under 24rem, where it spans a phone's card over the round photo — the owner's \"10% bigger\" over the picked rendition's 12px — and exactly 'default' from 24rem up and on an engine without container queries (see CardStep)",
    },
    children: {
      control: 'text',
      description:
        'Finished text (§8.1) — the section passes an already-translated string; never a key, never t(). Authored in SENTENCE case: the uppercase is CSS.',
    },
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The one step, at rest: JetBrains Mono at 14px/500, `tracking-widest`,
 * `--ink-muted` (7.35:1 on white), uppercased by CSS, hosted by a
 * hardcoded `<p>` — the atom has exactly one prop (fb-300).
 *
 * Flip the `children` control to lowercase and watch it still render
 * uppercase — that is the atom's central invariant, not a coincidence. The
 * string in the message file stays "Ne găsești" so translators author natural
 * Romanian and the browser owns the Ș/Ț case mapping.
 */
export const Default: Story = {};

/**
 * Both real section eyebrows the old site ships today — the whole population,
 * not a sample. `home.location.eyebrow` opens the map section,
 * `home.reviews.eyebrow` opens the testimonials.
 *
 * The gap belongs to this wrapper, never to the atom (§6.4).
 */
export const RealStrings: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow>Ne găsești</Eyebrow>
      <Eyebrow>Părerea ta contează</Eyebrow>
    </div>
  ),
};

/**
 * The shape this atom exists for: an eyebrow above a title, which is what
 * `sections/SectionHeading` will compose next lane. Read the two lines
 * together — the mono/serif contrast and the ink step (muted → strong) are
 * what make the small line read as a label rather than as undersized copy.
 *
 * This story composes atoms; it does not play a section. The vertical gap and
 * the heading level are the future section's business, and are hardcoded here
 * only to make the pairing visible (§6.4).
 */
export const AboveATitle: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Eyebrow>Ne găsești</Eyebrow>
      <Heading>Vizitează clinica noastră</Heading>
    </div>
  ),
};

/**
 * The `card` step (2026-10-10, sections/PersonnelCard D20): a doctor's
 * specialty on a phone, where it spans the card above the round photo and
 * the name — 13.2px on a snug 18.15px line, the owner's "10% bigger" over the
 * 12px of the rendition he picked — in a container under 24rem, and the
 * site's one 14px eyebrow from there up and on an engine without container
 * queries ("On tablet and desktop it's fine and should remain as is"). Two
 * `@container` frames, read the way a card's INSET is: a `w-xs` one — 20rem,
 * a phone's card — at 13.2px, and a `w-md` one — 28rem, past the override's
 * edge — at the default's 14px; in each the Romanian line
 * follows the controls (a real specialty, in the clinic's own wording) and
 * the German one — the longest language, `Kieferorthopädie` the widest word
 * a real specialty has (§8.4) — is pinned to 'card'. The frames, their
 * gap and their dashed outline (an outline, so the content box the query
 * measures stays whole) are the story's, never the atom's (§6.4). The play
 * reads the sizes off the engine.
 */
export const CardStep: Story = {
  args: {
    size: 'card',
    children: 'Medic specialist în protetică dentară și parodontologie',
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div className="@container flex w-xs flex-col gap-4 outline outline-dashed outline-line">
        <Eyebrow {...args} />
        <Eyebrow size="card" lang="de">
          Fachrichtung Kieferorthopädie
        </Eyebrow>
      </div>
      <div className="@container flex w-md flex-col gap-4 outline outline-dashed outline-line">
        <Eyebrow {...args} />
        <Eyebrow size="card" lang="de">
          Fachrichtung Kieferorthopädie
        </Eyebrow>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // In DOM order — the narrow frame's two lines, then the wide frame's;
    // the frames measured first, so a width that failed to apply cannot let
    // the sizes pass for the wrong reason.
    const labels = Array.from(canvasElement.querySelectorAll('p'));
    await expect(
      labels.map(
        (label) => label.parentElement?.getBoundingClientRect().width ?? 0,
      ),
    ).toEqual([320, 320, 448, 448]);
    await expect(
      labels.map((label) => getComputedStyle(label).fontSize),
    ).toEqual(['13.2px', '13.2px', '14px', '14px']);
  },
};

/**
 * DE is the longest locale (§8.4) and its compounds do not break at spaces —
 * made worse here than in any other atom, because uppercase glyphs are wider
 * than lowercase and `tracking-widest` adds 0.1em to every single character.
 * An eyebrow is therefore the repo's true wrap worst case: it must wrap
 * cleanly and never overflow, at 320px too.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: {
    children: 'Behandlungsschwerpunkte und Anfahrtsbeschreibung',
  },
};

/**
 * Pseudo-locale (~40% expansion + accents) — the Default fixture run through
 * the preview's transform and hardcoded as a stress variant (§8.9, §15.7).
 * Untransformed text appearing here would mean a hardcoded string, which for
 * this atom would be a §8.1 violation.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: {
    children: 'Ňé ǧăşéşťí ················',
  },
};
