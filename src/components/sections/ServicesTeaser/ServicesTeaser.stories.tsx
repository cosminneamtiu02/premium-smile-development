import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SERVICE_TIERS } from '@/lib/services';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { ServicesTeaser } from './ServicesTeaser';

// The teaser's two stories — the everyday Romanian picture and the German
// expansion stress. Conventions are the Footer's; the mechanic that would
// otherwise fail SILENTLY is spelled out again:
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL with no toolbar state at all, so without the pin the
// German baseline would be a second Romanian picture. The pin also stamps
// `<html lang>`, which is what gives `hyphens: auto` its dictionary (§15.14) —
// and this is the band where that matters most, because
// "Professionelle Zahnreinigung" has to fit a ~15rem grid track.
//
// ── NO PROVIDER DECORATOR, unlike Hero and CTABanner: this band holds no
// ContactModalTrigger. Its only controls are plain links (§15.13), so there is
// no shared switch to wrap and nothing to hydrate.
//
// ── NO PINNED VIEWPORTS: the `Sections/*` title prefix already routes both
// stories to 390 and 1536 (tests/visual/stories.spec.ts, §13), which happen to
// be exactly the two sides of this band's ONE container step — the cards stack
// on the phone and sit in three tracks on the laptop. The plays are therefore
// written width-independently (they count list items, they do not measure the
// grid).
//
// The section takes NO props and translates itself, so there are no args and no
// controls. Flip the toolbar to Pseudo and every string must come out accented
// — except the PRICES, which are Intl output over a number in lib/services.ts
// (§8.3) and are data, not copy (the lib/clinic.ts precedent in the Footer's
// stories).
//
// layout 'fullscreen' because the band is full-bleed and owns its own gutter
// clamp; Storybook's default padding would put its ground and the band's
// margins on two different rulers.

const meta = {
  title: 'Sections/ServicesTeaser',
  component: ServicesTeaser,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ServicesTeaser>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/**
 * THE PICTURE, Romanian (§15.7): the mono eyebrow over the section title, the
 * muted intro, then the three sourced tiers as bordered cards — each a name,
 * a description, and a bold from-price — and the quiet link on to the full
 * Services page.
 *
 * The play proves what a screenshot cannot: that the cards are a real LIST (3
 * items, so the count tracks lib/services.ts rather than a hand-written grid),
 * that the band is a REGION named by its own h2, and that the closing control
 * is an anchor with the finished locale URL.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: ro.home.teaser.title });
    await expect(canvas.getAllByRole('listitem')).toHaveLength(
      SERVICE_TIERS.length,
    );
    canvas.getByRole('heading', {
      level: 3,
      name: ro.services.tiers.consult.name,
    });
    await expect(
      canvas.getByRole('link', { name: ro.home.teaser.all }),
    ).toHaveAttribute('href', '/ro/services/');

    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the language the
 * @3xl grid step was calibrated against. Two things are on trial in this frame:
 * the tier names, the longest of which ("Professionelle Zahnreinigung") must
 * wrap inside its track rather than push it open, and the card rhythm, since
 * `flex-1` on the descriptions is what keeps three unevenly-filled cards
 * ending on one baseline (§8.4's min-height rule, applied to a grid).
 *
 * The price row is the control in the experiment: German formats the amount
 * exactly as Romanian does ("100 RON"), so any difference between the two
 * baselines is text expansion and nothing else.
 */
export const GermanLongest: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: de.home.teaser.title });
    canvas.getByRole('heading', {
      level: 3,
      name: de.services.tiers.cleaning.name,
    });
    await expect(
      canvas.getByRole('link', { name: de.home.teaser.all }),
    ).toHaveAttribute('href', '/de/services/');

    await expectNoSidewaysScroll(band);
  },
};
