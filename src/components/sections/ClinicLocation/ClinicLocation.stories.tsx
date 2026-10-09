import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { clinic } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { ClinicLocation } from './ClinicLocation';

// The „Ne găsești" band's FOUR stories — the two widths §13 samples for this
// tier, the language that stresses them, and (since 2026-10-02, §15.32) the
// band as Home and Team render it, `Scaled`. The first three are the doctor
// page's band, which passes no prop. Conventions are the Footer's, and the
// two mechanics that would otherwise fail SILENTLY are spelled out again
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
// The section translates itself and takes ONE prop since 2026-10-02 — `scaled`,
// THE BAND SCALE (the component header's paragraph) — so its one control is
// that boolean, and the locale toolbar is the rest of its control surface.
// Flip the toolbar to Pseudo and the eyebrow, the title and both row labels
// must come out accented; untransformed text there is a hardcoded string,
// i.e. a bug (§8.9). The two strings that must NOT change are the address and
// the phone number — they are data from lib/clinic/clinic.ts (§10.1), not
// copy.
//
// ── `Scaled` IS IN THE VISUAL NET, and its play reads where it is. The net
// shoots it at 390, where nothing scales (the same pixels as `Smartphone`, a
// harmless duplicate), and at 1536, where the whole band is drawn in the
// design pixel — the one frame of this tier that shows Home's and Team's
// band. Playwright ignores the viewport pin, so the play derives its branch
// from the measured column, the pointer and the engine (`expectBandScale`),
// never from the pin — DoctorShowcase's stories' rule.
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

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP, in rem of the root (1536px
 *  at the default 16px, a 1920 window's column); THE STEP's two halves,
 *  `@4xl`'s 56rem and the floor's 896px. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** CSS px per rem — the root's, which a container query's rem reads. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** An element's computed font size, in px. */
const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure (a twentieth of a pixel by default: layout rounds to 1/64px
 *  and a design pixel keeps its fraction). */
const near = async (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.05,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/**
 * The map tray's SHAPE (the component header's OLD → NEW, item 4; the owner,
 * 2026-10-09: "i need map on phone to be like 50% taller"), asserted where
 * the play finds itself: under the band's `@lg` step — 32rem of ui/Container's
 * box, a phone's column — the tray is 4:3, three quarters of its width tall;
 * from the step up it is 2:1, half its width. The column is MEASURED, never
 * read off the pin: the visual net shoots every story at 390 and at 1536,
 * whatever the story's pin says.
 */
const expectMapShape = async (band: HTMLElement): Promise<void> => {
  const column = band.firstElementChild;
  const tray = band.querySelector('iframe')?.parentElement;
  if (!(column instanceof HTMLElement) || !(tray instanceof HTMLElement)) {
    throw new Error('ClinicLocation story: the band lost its structure');
  }
  const phone = column.getBoundingClientRect().width < 32 * rem();
  const map = tray.getBoundingClientRect();
  await near(
    map.height,
    map.width * (phone ? 3 / 4 : 1 / 2),
    phone ? 'the map on a phone, 4:3' : 'the map, 2:1',
  );
};

/**
 * THE BAND SCALE (§15.32), asserted where the play finds itself — the column
 * read off ui/Container, the band's first box, and the two GATES read off the
 * browser (a fine primary pointer; the relative colour syntax that rides with
 * registered custom properties), never the pinned window. Inside the regime
 * every length is its reference × s, s = min(column, 96rem) / 1106: the h2
 * 36 × s, the eyebrow 14 × s, the address 16 × s, the disc 44 × s, and the
 * band capped and centred at the cap. Outside it — a phone, a column under
 * the step, or a band that was not asked to scale — the band declares nothing
 * and every length is the theme's rem: the h2 on `band`'s 30 or 36, the rest
 * as above at s = 1. The map's tray is `expectMapShape`'s in both: a ratio
 * reads the column alone, never the design pixel.
 */
const expectBandScale = async (
  band: HTMLElement,
  scaled: boolean,
  eyebrow: string,
): Promise<void> => {
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const disc = band.querySelector('span[aria-hidden="true"]');
  if (
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    disc === null
  ) {
    throw new Error('ClinicLocation story: the band lost its structure');
  }
  const width = column.getBoundingClientRect().width;
  const regime =
    scaled &&
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    width >= Math.max(STEP_REM * rem(), STEP_FLOOR);
  // The unit every length below is drawn in: the design pixel inside the
  // regime, a sixteenth of the root outside it (rem — §7).
  const unit = regime
    ? Math.min(width, CAP_REM * rem()) / REFERENCE
    : rem() / 16;

  if (regime) {
    await near(
      parseFloat(getComputedStyle(rhythm).getPropertyValue('--scale-px')),
      unit,
      'the design pixel',
      0.0001,
    );
  } else {
    await expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
  }
  // bandColumnClasses: as wide as the column up to the cap, centred past it
  // (a band not asked to scale is simply the column's width).
  const box = rhythm.getBoundingClientRect();
  const outer = column.getBoundingClientRect();
  await near(
    box.width,
    regime ? Math.min(width, CAP_REM * rem()) : width,
    'the band’s width',
  );
  await near(
    box.left - outer.left,
    (outer.width - box.width) / 2,
    'the band’s centring',
  );

  // ui/Heading's `band` step reads the column against 28rem: 36 from it, 30
  // under it — and inside the regime the column is always past it.
  const titleStep = width >= 28 * rem() ? 36 : 30;
  await near(
    fontSize(within(band).getByRole('heading', { level: 2 })),
    titleStep * unit,
    'the h2',
  );
  await near(
    fontSize(within(band).getByText(eyebrow)),
    14 * unit,
    'the eyebrow',
  );
  await near(
    fontSize(within(band).getByText(ADDRESS)),
    16 * unit,
    'the address',
  );
  const discBox = disc.getBoundingClientRect();
  await near(discBox.width, 44 * unit, 'the disc’s width');
  await near(discBox.height, 44 * unit, 'the disc’s height');
  await expectMapShape(band);
};

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
 * And the map is TALLER here than anywhere else (the owner, 2026-10-09: "i
 * need map on phone to be like 50% taller. it is too small."): under the
 * `@lg` step the tray is 4:3, three quarters of its width tall, where the
 * tablet and the laptop keep the 2:1 box — so a phone's map is half again as
 * tall as it was at the same width. The play checks the shape the measured
 * column calls for (`expectMapShape`).
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
    await expectMapShape(band);
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

/**
 * The band as HOME and TEAM render it — `scaled` (2026-10-02, §15.32),
 * Romanian, at the laptop width.
 *
 * On a laptop or desktop the WHOLE band is drawn in THE BAND SCALE's design
 * pixel, s = min(column, 96rem) / 1106, like every band around it on those two
 * pages (the component header's THE BAND SCALE): the eyebrow and the h2 at
 * the other bands' size and on their left edge, the address 16 × s — a review
 * card's body size, the owner's 1-to-1 reference — the discs 44 × s, and the
 * map still 2:1, so the map's share of the row stops growing with the window.
 * At this pin the column is about 1214px (1229 without a scrollbar gutter),
 * s ≈ 1.1: compare it with `Default`, the doctor page's band at the same
 * width, whose words stay 16px and discs 44px beside a wider map.
 *
 * The play is `expectBandScale` with the band's own answer, `true`: in the
 * Vitest storybook project the pin holds and the pointer is fine, so it
 * asserts the scale; the visual net's 390 frame and a narrow workbench canvas
 * assert the rem band instead — the same contract, read where it stands.
 */
export const Scaled: Story = {
  args: { scaled: true },
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: ro.home.location.title,
    });

    await expectBandScale(band, true, ro.home.location.eyebrow);
    await expectNoSidewaysScroll(band);
  },
};
