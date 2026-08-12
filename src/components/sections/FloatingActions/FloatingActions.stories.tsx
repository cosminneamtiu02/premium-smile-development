import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FloatingActions } from './FloatingActions';

// The FIRST section story file — it fixes the tier's conventions in one place.
//
// · The `Sections/*` title prefix routes the visual net to 390 + 1536
//   (tests/visual/stories.spec.ts, §13); the 'stress-320' tag on Clearance320
//   adds the 320px accessibility width on top of those two.
// · The section takes NO props and translates itself, so there are no args and
//   no controls: the LOCALE TOOLBAR is this component's control surface. Flip
//   it and both the pill (RO → DE) and the CTA's accessible name change; the
//   pseudo-locale entry is the §8.9 sweep, and the single translated string in
//   here — the call label — must come out accented.
// · The prose is story-local page GROUND, not component copy: this section
//   renders no visible text of its own. Romanian with diacritics per §15.7.
// · layout 'fullscreen' because the controls are `fixed`: Storybook's default
//   1rem padding would put the story's ground and the viewport-anchored pills
//   on two different rulers, which is precisely what these stories measure.
// · In both grounds FloatingActions is the LAST child in normal flow — the
//   Phase 4 mount contract, and the only arrangement in which its spacer can
//   clear anything.
//
// Both grounds are deliberately SHORT. The visual spec captures fullPage, and a
// document taller than the viewport renders fixed elements at a mid-document
// position in the stitched image — an unreadable baseline. Scroll behaviour is
// covered by the interaction tests; these stories pin the GEOMETRY.

const meta = {
  title: 'Sections/FloatingActions',
  component: FloatingActions,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FloatingActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The everyday picture: a short page with content at the top, the language pill
 * bottom-left and the call CTA bottom-right — two 3.5rem boxes sitting 1rem
 * clear of the bottom edge, on one z-40 layer over ordinary page ground.
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen px-4 py-8">
      <div className="flex max-w-prose flex-col gap-4">
        <p>Clinica este deschisă de luni până vineri, între orele 9 și 18.</p>
        <p>
          Programările se fac telefonic. Vă răspundem în cel mult o zi
          lucrătoare și vă propunem prima oră liberă din cabinet.
        </p>
      </div>
      <FloatingActions />
    </div>
  ),
};

/**
 * Clearance 320 — the reflow stress width (§7, §9), and the story that makes
 * the spacer earn its place.
 *
 * The ground is BOTTOM-ALIGNED (`justify-end`, no bottom padding) on purpose: a
 * top-aligned short page would leave the last line hundreds of pixels above the
 * controls, and the screenshot would "prove" a clearance that gravity, not the
 * spacer, provided. Pushed to the end, the final line lands exactly one spacer
 * above the document edge — so the visible gap between that rule and the tops
 * of the two pills IS the 1rem of breathing room the spacer's arithmetic
 * promises (5.5rem = 3.5rem control + 1rem offset + 1rem). Delete the spacer
 * and this baseline breaks immediately, at every sampled width.
 *
 * The last line is a marked one so a diff is readable at a glance, and nothing
 * here may require horizontal scrolling at 320px.
 */
export const Clearance320: Story = {
  tags: ['stress-320'],
  render: () => (
    <div className="flex min-h-screen flex-col justify-end px-4 pt-8">
      <div className="flex max-w-prose flex-col gap-4">
        <p>
          Programările se fac telefonic, între orele 9 și 18. Vă răspundem în
          cel mult o zi lucrătoare și vă propunem prima oră liberă din cabinet.
        </p>
        <p className="border-t border-line pt-3 font-mono text-base">
          ULTIMUL RÂND DE CONȚINUT — trebuie să rămână vizibil.
        </p>
      </div>
      <FloatingActions />
    </div>
  ),
};
