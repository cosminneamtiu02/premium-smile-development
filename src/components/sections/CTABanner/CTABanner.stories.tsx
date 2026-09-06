import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { CTABanner } from './CTABanner';

// The closing band's two stories — the everyday Romanian picture and the German
// expansion stress. Conventions are the Hero's, and the two silent mechanics
// are the same two:
//
// ── 1. EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`: the visual
// runner opens stories by URL with no toolbar state, so an unpinned German
// story would photograph Romanian. The pin also stamps `<html lang>`, which is
// what gives `hyphens: auto` its dictionary (§15.14) — and this band's German
// question is one of the longest single lines on the site.
//
// ── 2. THE PROVIDER DECORATOR IS NOT OPTIONAL: the one action here is a
// ContactModalTrigger, which THROWS outside a ContactModalProvider by design.
// It stands in for the shell wrapper and serves the canvas, per-story axe and
// the visual net at once. The dialog stays CLOSED in both stories (no
// `defaultOpen`, no play presses the button), so the provider contributes no
// pixels; its own states are storied in ContactModal.stories.tsx.
//
// NO PINNED VIEWPORTS: the band has no container step at all — a centred stack
// at every width — so the two widths the `Sections/*` prefix routes it to
// (390 + 1536, §13) are the whole story.
//
// The section takes NO props and translates itself: no args, no controls, and
// the locale toolbar is its control surface. Flip it to Pseudo and every string
// must come out accented (§8.9).
//
// layout 'fullscreen' because the band is full-bleed — its `bg-raised` ground
// runs edge to edge and owns the gutter clamp inside; Storybook's default 1rem
// padding would inset that paint and hide exactly the thing this band's
// baseline is for.

const meta = {
  title: 'Sections/CTABanner',
  component: CTABanner,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story): ReactElement => (
      <ContactModalProvider>
        <Story />
      </ContactModalProvider>
    ),
  ],
} satisfies Meta<typeof CTABanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/**
 * THE PICTURE, Romanian (§15.7): the raised ground, the centred question at
 * SectionHeading's `section` step with no eyebrow above it, the muted line
 * under it at a capped measure, and the green solid action.
 *
 * The play proves the naming pair (a REGION named by its own h2) and the KIND
 * of control: an in-place action is a real <button> with aria-haspopup="dialog"
 * — never an anchor dressed as one (§9).
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: ro.common.cta.title });
    const heading = canvas.getByRole('heading', {
      level: 2,
      name: ro.common.cta.title,
    });
    await expect(band).toContainElement(heading);

    const action = canvas.getByRole('button', { name: ro.common.cta.action });
    await expect(action).toHaveAttribute('aria-haspopup', 'dialog');
    // §9's primary-action target: ui/Button size="lg" is min-h-14 = 56px, and
    // this is the one gate with a real stylesheet to measure it in.
    await expect(action.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44,
    );

    // The centring canon (§15.15 b): the utility rides the PARAGRAPH, because
    // globals.css aligns every <p> to `start` in the base layer and an
    // inherited value loses to a rule that matches the element itself.
    const line = canvas.getByText(ro.common.cta.text);
    await expect(getComputedStyle(line).textAlign).toBe('center');

    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — "Haben Sie eine
 * Frage oder möchten Sie einen Termin?" is the wrapping case for a centred
 * heading, and "Kontakt aufnehmen" is the widest label the action ever wears.
 *
 * The label is where §15.14's rider is visible: the site ships `hyphens: auto`
 * at the body tier, and ui/Button opts its label back out (`hyphens-none`), so
 * the German word may move to a second line but must never break in the middle
 * — which is exactly what this frame samples at 390.
 */
export const GermanLongest: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: de.common.cta.title });
    canvas.getByRole('heading', { level: 2, name: de.common.cta.title });
    await expect(
      getComputedStyle(
        canvas.getByRole('button', { name: de.common.cta.action }),
      ).hyphens,
    ).toBe('none');

    await expectNoSidewaysScroll(band);
  },
};
