import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Text } from './Text';

// One story per meaningful state (§13), six in total — they are also the
// declared visual manifest for this lane (contract board §2), so the export
// NAMES are load-bearing: renaming one renames its baseline file.
// Demo values are Romanian with diacritics (§15.7); DE-longest and
// pseudo-locale are dedicated stress variants, both carrying the 'stress-320'
// tag so the visual net also samples them at the 320px accessibility width
// (§13 UI-tier opt-in).
// Copy is factual only — no superlatives, no promotions, no result guarantees
// (CMSR advertising rules for dental practices, in force since 2025-07-01).

const meta = {
  title: 'UI/Text',
  component: Text,
  args: {
    // The Default story's fixture: a Footer NAP line, the atom's first real
    // consumer shape (§10.5).
    children: 'Strada Exemplu nr. 1, 000000 București',
    tone: 'default',
    as: 'p',
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['p', 'span', 'dt', 'dd'],
      description:
        'Which native element wears the treatment. dt/dd need a real <dl> parent — see DefinitionList; picking them here would render invalid HTML.',
    },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'strong'],
      description:
        'Ink axis (fb-182): default → text-ink · muted → text-ink-muted · strong → text-ink-strong',
    },
    children: {
      control: 'text',
      description:
        'Finished text (§8.1) — the section passes an already-translated string; never a key, never t()',
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Body copy at rest: `text-base` on `--ink`, line-height inherited from the
 * utility itself (D2 — no leading-* class, ever). The `as` control stays on
 * `p`: an orphan dt/dd in a bare canvas is invalid HTML and fails the axe
 * `dlitem` rule, so the DefinitionList story owns those two elements.
 */
export const Default: Story = {};

/**
 * The three tones on one ground. `strong` ships SPECULATIVE — no consumer
 * exists yet; it is in v1 on the owner's explicit call (fb-182), so that a
 * section can lift one line without inventing a class for it.
 * The stack spacing belongs to this wrapper, never to the atom (§6.4).
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text>Luni – Vineri: 09:00 – 19:00</Text>
      <Text tone="muted">
        © 2026 Premium Smile. Toate drepturile rezervate.
      </Text>
      <Text tone="strong">Sâmbătă: 09:00 – 14:00</Text>
    </div>
  ),
};

/**
 * The opening-hours shape the Footer will hand over at the fb-186 rewiring:
 * `<dl>` + the standard HTML5 `<div>` pairing wrappers, each row a dt/dd
 * couple. The wrapper is a requirement, not decoration — orphan dt/dd fail
 * axe's `dlitem` rule.
 * Watch the closed day: BOTH its dt and its dd are passed `tone="muted"`
 * one by one (D4). Today the Footer colors the row wrapper and lets bare
 * dt/dd inherit; with Text the section decides the tone per element and the
 * atom always emits its own ink — same token, same computed color, zero
 * visual diff.
 * The rows run the full canvas width on purpose: the column width belongs to
 * the Footer's grid, and an atom story composes atoms, it never plays a
 * section.
 */
export const DefinitionList: Story = {
  render: () => (
    <dl className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <Text as="dt">Luni – Vineri</Text>
        <Text as="dd">09:00 – 19:00</Text>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <Text as="dt">Sâmbătă</Text>
        <Text as="dd">09:00 – 14:00</Text>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <Text as="dt" tone="muted">
          Duminică
        </Text>
        <Text as="dd" tone="muted">
          Închis
        </Text>
      </div>
    </dl>
  ),
};

/**
 * An inline aside inside ordinary body prose. The surrounding paragraph runs
 * at the ambient 1.125rem body base (§15.1); the `<Text as="span">` inside it
 * renders at 1rem, so it visibly steps DOWN. That contrast is the point of
 * the story, not a bug: Text is the supporting-copy treatment, and it does not
 * try to match whatever prose it is nested in.
 */
export const InlineSpan: Story = {
  render: () => (
    <p className="max-w-prose">
      Programul de lucru și adresa cabinetului sunt afișate la intrare.{' '}
      <Text as="span" tone="muted">
        Actualizat la 19 august 2026.
      </Text>{' '}
      Pentru programări, sunați la numărul de telefon din subsolul paginii.
    </p>
  ),
};

/**
 * DE is the longest locale (§8.4) and compounds do not break at spaces — the
 * line must wrap and never overflow, at 320px too.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: {
    children: 'Terminvereinbarung: Montag – Freitag, 09:00 – 19:00 Uhr',
  },
};

/**
 * Pseudo-locale (~40% expansion + accents) — the Default fixture run through
 * the preview's transform and hardcoded here as a stress variant (§8.9,
 * §15.7).
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: {
    children: 'Šťrádá Éxémplú ñr. 1, 000000 Búçúréșťí ················',
  },
};
