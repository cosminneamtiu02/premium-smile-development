import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { clinic } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { ClinicLocation } from './ClinicLocation';

// The „Ne găsești" band's THREE stories — the two widths §13 samples for this
// tier, plus the language that stresses them. Conventions are the Footer's, and
// the two mechanics that would otherwise fail SILENTLY are spelled out again
// because they are exactly as invisible here:
//
// ── 1. Every story PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL (/iframe.html?id=…) with no toolbar state at all.
// Without the pin, the German baseline would be a Romanian picture — green, and
// proving nothing.
//
// ── 2. Every story PINS ITS OWN VIEWPORT, and here that pin is what makes the
// story mean anything: the layout step measures the GUTTER BOX (canvas −
// 2×10vw), so the rows sit BESIDE the map only from a ~960px canvas. A manager
// canvas narrowed by the sidebar sits in the middle of that band. Playwright
// ignores the pin — it sets its own page size per project — so the visual net
// still samples every story at 390 + 1536 (§13, `Sections/*` prefix →
// tests/visual/stories.spec.ts).
//
// ── 3. THE MAP IS LIVE IN STORYBOOK, and fenced in the visual net. Open the
// workbench and the <iframe> loads Google's real, scrollable map — that is the
// point of the pack review. The Playwright runner answers every off-origin
// request with an empty 200 (board D9, the rule in tests/visual/stories.spec.ts),
// so the baselines photograph the band's own bordered tray on its
// `bg-line-subtle` ground instead of nondeterministic map tiles — identically
// on darwin and linux, and on a CI runner with no network at all.
//
// ── NO HOVER STORY (board D10, round 2): the disc's hover-mirror is the ATOM's
// contract and is already photographed by `UI/GlyphButton`'s `pin-hover` story,
// while a section-level hover would land on the row anchor's centre — the text —
// and photograph nothing.
//
// The section takes NO props and translates itself, so there are no args and no
// controls: the locale toolbar is this component's control surface. Flip it to
// Pseudo and the eyebrow, the title and both row labels must come out accented;
// untransformed text there is a hardcoded string, i.e. a bug (§8.9). The two
// strings that must NOT change are the address and the phone number — they are
// data from lib/clinic/clinic.ts (§10.1), not copy.
//
// layout 'fullscreen' because the band is full-bleed and owns its own gutter
// clamp: Storybook's default 1rem padding would add a second inset on top of it
// and put the story's ground and the band's margins on two different rulers.

const meta = {
  title: 'Sections/ClinicLocation',
  component: ClinicLocation,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ClinicLocation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/** ICU interpolation, done the way the message file declares it. */
const fill = (message: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    message,
  );

const ADDRESS = `${clinic.address.street}, ${clinic.address.city}`;

/**
 * The everyday picture, Romanian, on the laptop width the §13 matrix samples.
 *
 * This is the story that shows the SIDE-BY-SIDE arrangement: the 2:1 map takes
 * the free track, the two contact rows hug their content beside it, vertically
 * centred (`@3xl:grid-cols-[1fr_auto]`). Above them the eyebrow/title opener.
 * It is also the only place the map is REAL — the workbench loads Google's own
 * page inside the frame, which is what the owner reviews; the baselines see the
 * fenced tray instead (see the file header).
 *
 * The play function proves the facts a picture cannot: that the band is a named
 * `region` rather than a generic box, that the frame carries its translated
 * name, and where the two rows actually GO — a screenshot shows an address and
 * a phone number, not their destinations.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: ro.home.location.title,
    });

    await expect(
      canvas.getByTitle(fill(ro.home.location.mapAlt, { name: clinic.name }))
        .tagName,
    ).toBe('IFRAME');
    await expect(
      canvas.getByRole('link', {
        name: fill(ro.home.location.directionsLabel, { address: ADDRESS }),
      }),
    ).toHaveAttribute('href', clinic.directionsUrl);
    await expect(
      canvas.getByRole('link', {
        name: fill(ro.home.location.callLabel, {
          phone: clinic.phoneDisplay,
        }),
      }),
    ).toHaveAttribute('href', `tel:${clinic.phone}`);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * The phone, Romanian — the other width §13 samples for this tier.
 *
 * Below `@3xl` the band is ONE column: the map first, the two rows stacked
 * under it, both starting on the SAME left edge as the map and the heading
 * (owner fb-422 — the old site centred each row on its own line; the owner
 * asked for one shared start on phone and tablet). That is the owner's fb-393
 * rule — desktop beside, tablet and phone below — and at 390 the gutter box is
 * 312px, well under the 768px step.
 *
 * 320px is not pinned here: the visual matrix gives `Sections/*` 390 + 1536,
 * and the no-horizontal-scroll assertion below is width-agnostic — it holds
 * wherever the story is rendered.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: ro.home.location.title,
    });

    // Everything is still THERE at the phone width — the band stacks, it never
    // drops content (§7: the sampled sizes are sampling points, not designs).
    await expect(
      canvas.getByTitle(fill(ro.home.location.mapAlt, { name: clinic.name })),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole('link')).toHaveLength(2);
    await expect(band).toHaveTextContent(clinic.phoneDisplay);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * German at 1536 — the CALIBRATION story for the container steps.
 *
 * German is the longest language this site speaks (§8.4), so it is what decides
 * whether `@lg`/`@3xl` sit in the right place. The things to look at: "So
 * finden Sie uns" — four words where Romanian has two, in the wide-tracked
 * uppercase mono eyebrow — over "Besuchen Sie unsere Klinik". Neither may wrap
 * into the map, clip, or push the row column into its neighbour. If it ever
 * stops fitting, the STEP moves to the adjacent Tailwind name (@3xl → @4xl) —
 * never to a custom value, and never without the planning loop.
 *
 * The rows themselves are immune by construction: their visible text is the
 * address and the phone number, i.e. DATA that reads identically in all five
 * languages (§10.1). Only their invisible aria-labels translate.
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: de.home.location.title,
    });

    await expect(band).toHaveTextContent(de.home.location.eyebrow);
    await expect(band).toHaveTextContent(de.home.location.title);
    // …and the data lines are untouched by the language flip.
    await expect(band).toHaveTextContent(ADDRESS);
    await expectNoSidewaysScroll(band);
  },
};
