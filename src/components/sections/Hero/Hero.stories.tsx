import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { Hero } from './Hero';

// The Hero's two stories — the everyday Romanian picture and the German
// expansion stress. Conventions are the Footer's and the Header's, and the two
// mechanics that would otherwise fail SILENTLY are spelled out again because
// they are exactly as invisible here:
//
// ── 1. EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL (/iframe.html?id=…) with no toolbar state at all.
// Without the pin the German baseline would be a second Romanian picture —
// green, and proving nothing. The pin also stamps `<html lang>` through the
// preview decorator, which is what gives `hyphens: auto` its dictionary
// (§15.14) — the whole point of a German stress shot.
//
// ── 2. THE PROVIDER DECORATOR IS NOT OPTIONAL. The primary CTA is a
// ContactModalTrigger, and a trigger outside a ContactModalProvider THROWS by
// design (useContactModal names the missing wrapper rather than shipping a dead
// button), so without this every story here would fail to render. It stands in
// for the shell wrapper (app/[locale]/layout.tsx) and serves all three
// in-browser gates at once: the canvas, per-story axe, and the visual net.
// THE DIALOG STAYS CLOSED in both stories (`defaultOpen` left at false, no play
// presses the CTA), which keeps the baselines at zero pixels of change: the
// provider renders no box of its own and the closed <dialog> is display:none by
// globals.css' `dialog:not([open])` rule. The dialog's own states are storied
// where they belong, in ContactModal.stories.tsx.
//
// NO PINNED VIEWPORTS, the SectionHeading/LanguageSwitcher convention: the band
// has ONE container step (the h1's type size) and no layout that appears or
// disappears, so the two widths the `Sections/*` title prefix already routes it
// to ARE the story (390 + 1536, tests/visual/stories.spec.ts §13) and the
// manual workbench keeps its toolbar. The plays below are width-independent for
// the same reason.
//
// NO `parameters.nextjs` either: the band reads no pathname. Its one link is a
// plain anchor whose href comes from the pure i18n/href.ts (§15.13), so there
// is no pretend route to stage.
//
// The section takes NO props and translates itself, so there are no args and no
// controls: the locale toolbar is this component's control surface. Flip it to
// Pseudo and every string must come out accented — untransformed text there is
// a hardcoded string, i.e. a bug (§8.9).
//
// layout 'fullscreen' because the band is full-bleed and owns its own gutter
// clamp: Storybook's default 1rem padding would add a second inset on top of it
// and put the story's ground and the band's margins on two different rulers.

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story): ReactElement => (
      <ContactModalProvider>
        <Story />
      </ContactModalProvider>
    ),
  ],
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/**
 * THE PICTURE, Romanian (§15.7): the decorative wash fading into the page
 * ground, the display-serif h1 over a muted support line, and the CTA pair —
 * the green solid button that opens the dialog beside the quiet underlined link
 * to /services.
 *
 * The play proves the two things a screenshot cannot: that the band is a REGION
 * named by its own h1 (the aria-labelledby pair, read back as the accessibility
 * tree computes it), and that the secondary CTA is a real anchor pointing at
 * the finished locale URL rather than a button pretending to navigate.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: ro.home.hero.title });
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: ro.home.hero.title,
    });
    await expect(band).toContainElement(heading);

    await expect(
      canvas.getByRole('button', { name: ro.home.hero.ctaPrimary }),
    ).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(
      canvas.getByRole('link', { name: ro.home.hero.ctaSecondary }),
    ).toHaveAttribute('href', '/ro/services/');

    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the expansion
 * stress this band needs, because everything in it is text: a longer h1 takes a
 * third line before its `max-w-3xl` measure gives way, the support line runs
 * wider, and the CTA row is where a too-long pair would stop fitting side by
 * side (`flex-wrap` is what lets it stack instead of clip).
 *
 * `hyphens: auto` is live here through the pinned locale's `<html lang="de">`
 * (§15.14) — for the PROSE. The two controls opt out (`hyphens-none` rides
 * ui/Button and ui/TextButton on the owner's 2026-09-04 rule), so a German
 * label may wrap between words but never mid-word.
 */
export const GermanLongest: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: de.home.hero.title });
    canvas.getByRole('heading', { level: 1, name: de.home.hero.title });
    canvas.getByRole('button', { name: de.home.hero.ctaPrimary });
    await expect(
      canvas.getByRole('link', { name: de.home.hero.ctaSecondary }),
    ).toHaveAttribute('href', '/de/services/');

    await expectNoSidewaysScroll(band);
  },
};
