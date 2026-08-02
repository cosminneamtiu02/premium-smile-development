import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Phase 0 glyph verification (§8.8, playbook): eyeball this story once per
// font-file change. Every character below must render in BOTH families —
// a fallback-font glyph (wrong serif shape, mismatched weight) means the
// subset regressed and the woff2 files must be regenerated.

const SAMPLES: ReadonlyArray<[string, string]> = [
  ['Română (comma-below!)', 'Ș ș Ț ț Ă ă Â â Î î — „Șansă” înțelegere țară'],
  ['Deutsch', 'Ä ä Ö ö Ü ü ß ẞ — Straße GRÜSSE → GRÜẞE'],
  ['Français', 'É é È è Ê ê Ë ë À à Ç ç Œ œ — cœur français'],
  ['Italiano', 'À à È è É é Ì ì Ò ò Ù ù — città perché così'],
  ['Punctuation & currency', '€ 1.250,00 · « » “ ” ‘ ’ – — … ‰ ™'],
];

function GlyphSheet() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {SAMPLES.map(([label, sample]) => (
        <section key={label} className="flex flex-col gap-1">
          <h2 className="font-mono text-sm tracking-widest text-ink-muted uppercase">
            {label}
          </h2>
          <p className="font-display text-2xl text-ink-strong">{sample}</p>
          <p className="font-body">{sample}</p>
          <p className="font-body font-semibold">{sample}</p>
          <p className="font-mono text-sm">{sample}</p>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: 'Fixtures/Glyphs',
  component: GlyphSheet,
} satisfies Meta<typeof GlyphSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllLanguages: Story = {};
