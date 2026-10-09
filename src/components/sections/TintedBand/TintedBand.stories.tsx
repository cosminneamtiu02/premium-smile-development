import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactElement } from 'react';
import { expect } from 'storybook/test';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from './TintedBand';

// The doctor page's lilac ground, alone — TWO stories: the everyday picture at
// the laptop width with an unnamed band (DoctorProfile's shape), and the named
// region at the phone width (DoctorStats' shape, D30). The export NAMES are
// load-bearing — each one names a baseline file (`sections-tintedband--default`,
// `sections-tintedband--named`), so renaming or adding an export re-records
// pictures; this list IS the component's contribution to the run's visual
// manifest (round 2f, D29). The `Sections/*` title prefix routes both to
// 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to `Default`, where 18px prose 288px wide (256 before
// 2026-10-09's phone gutter) has to sit on the tint without a sideways scroll.
//
// ── NO PSEUDO-LOCALE STORY, and none is owed: the band holds no words of its
// own (its strings are its consumers', §8.1), so there is nothing for §8.9's
// transform to reach — flipping the toolbar to Pseudo over either story here
// changes nothing, which is that sweep PASSING. The expansion stresses live
// with the words, in DoctorProfile's and DoctorStats' stories. No German story
// either, for the same reason: `lang` would ride the native spread (the test
// pins it), but a ground cannot hyphenate.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals` — the locale because the preview decorator stamps `<html lang>`
// from it (the consumer's Romanian prose then hyphenates in its own
// dictionary, §15.14), the viewport so the workbench shows the width the story
// is about. The visual runner ignores the viewport pin and sets its own page
// size per project, which is why nothing below assumes the pinned width.
//
// ── `layout: 'fullscreen'` is load-bearing: the band is full-bleed and owns
// its gutter through ui/Container, so Storybook's default 1rem canvas padding
// would add a second inset — and, worse here than anywhere, would leave a
// page-coloured frame around the tint that the real page never shows.
//
// ── WHAT THE PLAYS MEASURE, and why it has to be here: none of it survives in
// TintedBand.test.tsx, because this project loads no stylesheet in the
// components runner. The tint's real composite (an alpha of exactly 0.3 over
// the page, the channels read back from the `--accent-decorative` token rather
// than typed in), the fade actually RESOLVING to that same colour at its last
// stop — the "no seam by construction" argument, measured off the engine — the
// two fades' 6rem in flow, the column carrying no padding of the band's own,
// and the band never scrolling sideways. These plays MOVED here from
// DoctorProfile.stories with the ground (`expectTintedGround`, `parseColor`,
// `accentChannels`, run D29): the measurement belongs to the file that owns
// the thing measured, and every consumer inherits it by composing the band.
//
// Demo copy is INVENTED and stands in for a consumer (no real doctor, no real
// clinic history): Romanian with diacritics (§15.7), third-person and factual —
// no superlatives, no promises, no result guarantees (CMSR advertising rules
// for dental practices, in force since 2025-07-01) — and D-DASH-clean.

const meta = {
  title: 'Sections/TintedBand',
  component: TintedBand,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: {
      control: false,
      description:
        'REQUIRED — the consumer’s content, rendered inside ui/Container in the tinted middle box. The consumer brings its own heading (headings start at its h2), its own grid and its own `py` rhythm: the band adds no padding of its own (an element cannot query its own size, so the rhythm rides the consumer’s grid). Not a live control: it is JSX',
    },
    'aria-labelledby': {
      control: false,
      description:
        'Passes THROUGH to the `<section>`: point it at the consumer’s own h2 and the band becomes a region named by that heading (DoctorStats, D30). Left off, the band is an unnamed generic box (DoctorProfile, whose own props refuse a name)',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the `<section>` (§6.4/§6.8). The band owns no outer margin — the page owns the rhythm between its bands, and the two 6rem fades are this band’s own boxes, not spacing',
    },
  },
} satisfies Meta<typeof TintedBand>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── FIXTURES ───────────────────────────────────────────────────────────────

const PROFILE = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
  paragraphs: [
    'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate dentare fixe sau cu gutiere transparente, în funcție de ce arată examinarea.',
    'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns.',
  ],
} as const;

const FIGURES = {
  id: 'banda-in-cifre',
  eyebrow: 'În cifre',
  title: 'Activitatea clinicii în cifre',
  paragraphs: [
    'Numerele de mai jos sunt ale clinicii noastre și se actualizează o dată pe an, la începutul lunii ianuarie.',
  ],
} as const;

/**
 * What a consumer puts on the ground — ITS rhythm (the `py` steps DoctorProfile
 * uses, on its own column: TintedBand's NO VERTICAL PADDING paragraph), ITS
 * opener at level 2, ITS prose in the full ink (9.7:1 on the tint, TintedBand's
 * D23 table). A plain component rather than a story arg per element, so both
 * stories hand over the same shape.
 */
const Content = ({
  id,
  eyebrow,
  title,
  paragraphs,
}: Readonly<{
  id?: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
}>): ReactElement => (
  <div className="flex flex-col gap-6 py-6 @lg:py-8 @3xl:py-10">
    <SectionHeading level={2} id={id} eyebrow={eyebrow} title={title} />
    <div className="flex max-w-4xl flex-col gap-4">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-lg text-ink">
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);

// ── HELPERS ────────────────────────────────────────────────────────────────

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/** The band — the ONLY <section> in the frame; its three children are the
 *  fade in, the tinted middle and the fade out, in flow order (run D7). */
const bandOf = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector('section') as HTMLElement;

const boxesOf = (canvasElement: HTMLElement): HTMLElement[] =>
  [...bandOf(canvasElement).children] as HTMLElement[];

/** One rem at whatever the root font-size is, never a baked-in 16. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * Read an engine's serialisation of a colour back as 0–255 channels plus
 * alpha, rather than asserting against one spelling: Chromium may resolve a
 * `color-mix(in srgb, …)` to `color(srgb 0.478 0.427 0.612 / 0.3)` (0–1
 * channels) or to `rgba(122, 109, 156, 0.3)` (0–255), and both are the same
 * colour. The story asserts the COLOUR, not the notation.
 */
const parseColor = (value: string): { rgb: number[]; alpha: number } => {
  const scale = value.startsWith('color(') ? 255 : 1;
  const [r, g, b, alpha = 1] = value
    .replace(/^[a-z]+\(/, '')
    .replace(/\)$/, '')
    .replace(/^srgb\s+/, '')
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);

  return { rgb: [r * scale, g * scale, b * scale], alpha };
};

/** The `--accent-decorative` hex (§15.1's one decorative role), read from the
 *  token layer so the expected channels move with the still-open hue confirm
 *  instead of being frozen into a test. */
const accentChannels = (): number[] => {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-decorative')
    .trim();

  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
};

/**
 * THE GROUND, measured (run D7 at D23's ratio). The middle box is the accent
 * at EXACTLY 30 % — half again ui/Card's 20 % `--card-tint`, the owner's "too
 * faded" verdict — and each fade resolves, at its last stop, to the very same
 * colour string the middle box computes to: the "no seam by construction"
 * argument, read back off the engine rather than argued in a comment. If a stop
 * ever pointed at `--color-page` again, or the ratio drifted, this is what
 * fails. The two fades are in flow at 6rem each, and the column in the middle
 * carries no padding of the band's own (the rhythm is the consumer's).
 */
const expectTintedGround = async (
  canvasElement: HTMLElement,
): Promise<void> => {
  const [fadeIn, middle, fadeOut] = boxesOf(canvasElement);

  const ground = getComputedStyle(middle).backgroundColor;
  const { rgb, alpha } = parseColor(ground);
  await expect(alpha).toBeCloseTo(0.3, 2);
  for (const [index, channel] of accentChannels().entries()) {
    await expect(Math.abs(rgb[index] - channel)).toBeLessThanOrEqual(1);
  }

  for (const fade of [fadeIn, fadeOut]) {
    const image = getComputedStyle(fade).backgroundImage;
    // The utility compiled at all — an arbitrary value Tailwind's scanner
    // missed would leave this `none` and nothing else would notice.
    await expect(image).toContain('linear-gradient');
    await expect(image).toContain(ground);
    await expect(
      Math.abs(fade.getBoundingClientRect().height - 6 * rem()),
    ).toBeLessThanOrEqual(0.5);
  }

  const column = middle.firstElementChild as HTMLElement;
  const { paddingTop, paddingBottom } = getComputedStyle(column);
  await expect(parseFloat(paddingTop)).toBe(0);
  await expect(parseFloat(paddingBottom)).toBe(0);
};

// ── STORIES ────────────────────────────────────────────────────────────────

/**
 * THE EVERYDAY PICTURE — the ground at the laptop width the §13 matrix
 * samples, holding what DoctorProfile holds in shape: an eyebrow and an <h2>
 * over two paragraphs of prose, with the consumer's own rhythm. The band is
 * UNNAMED, as DoctorProfile leaves it — a generic box, not a region.
 *
 * The frame shows the whole ground at once: the lavender arriving out of the
 * page through the top fade, the tinted middle behind the words, and the tint
 * leaving again through the bottom fade. The play measures what a picture
 * cannot — the tint's exact ratio and the fades resolving to the same colour
 * (the seam argument), the fades' 6rem, and no padding of the band's own.
 *
 * **1536 · 320 (`stress-320`):** at the stress width the column is 288px and
 * 18px prose still has to sit on the tint without a sideways scroll.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { children: <Content {...PROFILE} /> },
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: PROFILE.title }),
    ).toBeVisible();
    await expect(canvas.getByText(PROFILE.eyebrow)).toBeVisible();
    for (const paragraph of PROFILE.paragraphs) {
      await expect(canvas.getByText(paragraph)).toBeVisible();
    }
    // Unnamed: the <section> maps to a generic box, not a region.
    await expect(canvas.queryByRole('region')).toBeNull();
    await expectTintedGround(canvasElement);
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};

/**
 * THE NAMED REGION — the phone width, the consumer pointing `aria-labelledby`
 * at its own <h2> (DoctorStats' shape, D30). The band passes the attribute
 * through to its <section>, which becomes a region announced by the heading's
 * text — the band itself never picks the name. Same ground, same measurement;
 * the subject is the name.
 */
export const Named: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    'aria-labelledby': FIGURES.id,
    children: <Content {...FIGURES} />,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('region', { name: FIGURES.title })).toBe(
      bandOf(canvasElement),
    );
    await expect(
      canvas.getByRole('heading', { level: 2, name: FIGURES.title }),
    ).toBeVisible();
    await expectTintedGround(canvasElement);
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};
