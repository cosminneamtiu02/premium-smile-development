import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Eyebrow } from './Eyebrow';
import { Heading } from '../Heading/Heading';

// One story per meaningful state (§13), five in total — they are also the
// declared visual manifest for this lane, so the export NAMES are
// load-bearing: renaming one renames its baseline file.
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
