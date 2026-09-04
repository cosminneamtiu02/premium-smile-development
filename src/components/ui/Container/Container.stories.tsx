import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { cx } from '@/lib/cx';
import { Container } from './Container';

// EXACTLY ONE story, and the count is the honest one: a transparent box has a
// single meaningful state. Everything a second story could vary — the paint,
// the vertical rhythm, the content — belongs to the CALLER by contract
// (Container.tsx's recipe rules 1 and 3), so a "Padded" or "OnDarkBand"
// variant would photograph the fixture rather than the atom.
// The export NAME is load-bearing: it names the baseline file
// (`ui-container--default`), so renaming or adding an export re-records
// pictures. That one ID is this ATOM's contribution to the lane manifest —
// the lane's full declaration also names every Header, Footer and Wordmark
// story at expected 0 diffs (the disc.ts standing rule: editing the
// definition = editing every consumer).
//
// ── NO GermanStress, NO PseudoLocale — the sections/Wordmark precedent, for
// the same reason: this component renders no translated string of its own and
// reads no message key (§8.1 — children arrive finished). Flip the locale
// toolbar to Pseudo and nothing here may change; that is the §8.9 sweep
// passing, not a gap. Text expansion is a concern for whatever rides INSIDE
// the column, and every band's own stories carry it (§8.4).
// For the same reason the stories pin no `globals`: with no messages to
// resolve there is nothing a toolbar flip could falsify, unlike a section.
//
// ── `layout: 'fullscreen'` is load-bearing, not tidiness. Storybook's default
// `centered`/`padded` canvas would add its own padding around the story root,
// i.e. it would falsify THE MARGINS — the entire subject of the photograph.
//
// ── HOW TO READ THE TWO FRAMES (`UI/*` routes to 1280 §13, the 'stress-320'
// tag adds the accessibility width the atom exists for). Gutter per side, from
// the clamp: 320→32px · 390→39px · 768→77px · 1280→128px · 1536→154px ·
// 1920→192px, capped at 200px above a 2000px viewport. The 1rem floor only
// engages below a 160px viewport — at 320 the 10vw term still governs. Content
// column: 256px at 320, 1024px at 1280.
//
// Demo copy is Romanian with diacritics (§15.7) and factual — no superlatives,
// no promotions, no result guarantees (CMSR advertising rules for dental
// practices, in force since 2025-07-01).

const meta = {
  title: 'UI/Container',
  component: Container,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Stomatologie modernă. Îngrijire onestă.',
  },
  argTypes: {
    children: {
      control: 'text',
      description:
        'Finished, already-translated content (§8.1) — a band passes its own composed children; the column never reads a message key. Typed as the native `<div>` children, so anything a band renders is legal here.',
    },
  },
  // THE FIXTURE IS THE BAND RECIPE, drawn at miniature scale: a semantic
  // full-bleed outer that PAINTS (bg-surface, edge to edge), the Container
  // narrowing the content and carrying the band's own `py-10` as a caller
  // class — the Footer's exact arrangement. The two bordered cells exist to
  // make the gutter LEGIBLE (a transparent box photographs as nothing) and to
  // prove the second half of the definition at the same time: the grid flips
  // on `@3xl`, a NAMED container step measured against THIS column, so the
  // 1280 frame shows two cells and the 320 frame one. Semantic tokens only,
  // never primitives (§3).
  // `className` is destructured and merged rather than spread, so the control
  // panel stays live (the Wordmark "args flow through" precedent) without the
  // args object being able to drop the band's rhythm on the floor.
  render: ({ children, className, ...rest }) => (
    <section className="bg-surface">
      <Container className={cx('py-10', className)} {...rest}>
        <div className="grid gap-4 @3xl:grid-cols-2">
          <div className="rounded-md border border-line-subtle bg-page p-6">
            <p>{children}</p>
          </div>
          <div className="rounded-md border border-line-subtle bg-page p-6">
            <p>Pașii de layout măsoară această coloană, nu fereastra.</p>
          </div>
        </div>
      </Container>
    </section>
  ),
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The gutter at the two widths §13 samples for this atom.
 *
 * **1280 (the `UI/*` tier width):** 128px of white band on each side of the
 * cells, a 1024px column — 64rem, past the `@3xl` step, so the grid inside is
 * two columns. That flip is the proof that the container context ships WITH
 * the margins: take the gutter without the mark and the step would silently
 * never match.
 *
 * **320 (the `stress-320` tag, §7/§9):** 32px per side — the 10vw term, not
 * the 1rem floor, which only engages below a 160px viewport — leaving a 256px
 * column that holds its content with no horizontal scrolling, and a single
 * cell because 16rem is far below `@3xl`.
 *
 * What the picture does NOT show is as decided as what it does: the paint and
 * the vertical rhythm are the band's (the `<section>` and the `py-10` in this
 * story's fixture), never the atom's.
 */
export const Default: Story = {
  tags: ['stress-320'],
};
