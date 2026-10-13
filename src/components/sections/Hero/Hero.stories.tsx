import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { Header } from '@/components/sections/Header/Header';
import type { Locale } from '@/i18n/locales';
import { heroSlides } from '@/lib/hero-slides/hero-slides';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { Hero, type HeroLabels, type HeroSlide } from './Hero';

// Sections/Hero — the opener's stories: the everyday picture (the slogan on
// its aura face), the three kept faces one prop away, the language that
// stresses it, the band after a bead has picked a slide, the one-picture
// case with nothing to rotate, and the band in motion from its first second
// (Rotating, never photographed). The
// export NAMES are load-bearing — each names a baseline file
// (`sections-hero--default`, …) — so this list IS the section's contribution
// to the lane's visual manifest. `Sections/*` routes every one of them to 390
// + 1536 (§13, tests/visual/stories.spec.ts); GermanStress adds the 320px
// stress width through its tag.
//
// ── THE WORDS AND THE PICTURES ARE lib/hero-slides' OWN. The band is dumb,
// so a story has to populate it exactly as the page does — one language
// picked per row, the „{index} din {total}" sentence filled from the message
// file — and the shipped list is the honest fixture: the clinic's three
// photographs (the lobby, a treatment room, the handpieces — owner,
// 2026-10-01) under Claude's drafted slogans in all five languages (flagged
// in that file's header). No story invents copy the site does not have.
//
// ── EVERY STORY PINS ITS LANGUAGE AND ITS VIEWPORT (the ReviewsCarousel
// precedent): the visual runner opens a story by URL with no toolbar state,
// so without the pin a German baseline would be a Romanian picture; and the
// stage is made of the viewport (`min-h-svh`, `sizes=100vw`), so the
// workbench should show the width the story is about. Playwright sets its
// own size per project and samples both tier widths regardless.
//
// ── THE HEADER IS MOUNTED ABOVE THE BAND (pack round 2, owner 2026-09-20):
// the band slides UNDER the pill by its own negative margin — the pill's
// flow box, Hero.tsx's STAGE paragraph — so it assumes that box is there;
// alone on a canvas it would start 98px above the top and lose its first
// strip. Every story here therefore composes the real sections/Header above
// the band, exactly as the shell does, and the glass pill over the first
// photograph IS the thing to look at. A section story composing a sibling
// section is the dossier model Header itself practices with Wordmark.
//
// ── THE CLOCK RUNS AT THE PRODUCT'S OWN RHYTHM IN EVERY STORY (round 3,
// owner 2026-09-20: the workbench must show the motion — rounds 1–2 held a
// one-minute first dwell here for the net's sake, and the owner opened
// Default and saw nothing move). lib/clock's env seam is a prop here (tests
// and stories only — the page cannot pass functions), but these stories
// leave the browser real. What keeps a BASELINE still is the harness now:
// the visual projects run with `reducedMotion: 'reduce'` (playwright.config
// .ts — the lever G2 react named on 2026-09-19, taken 2026-09-20), under
// which lib/clock declines every automatic start, so the net photographs an
// idle ring's first frame by construction and a bead press lands without
// restarting anything. The Vitest storybook project runs a real Chromium
// with no such preference, so every play function below sees the running
// band. Picked presses a bead in its play function and asserts the slide it
// lands on — never the live region's state, which differs between the two
// runners. Rotating is the story for the eye: the product's rhythm with a
// one-second first dwell, tagged 'no-visual' so the net never photographs a
// frame that changes by design.
//
// ── The ContactModalProvider decorator is the shell's, in miniature: the
// primary button is a ContactModalTrigger, which THROWS outside a provider
// by design (the Header.stories precedent).
//
// layout 'fullscreen' because the band is full-bleed and owns its gutters
// through ui/Container: Storybook's default 1rem padding would put the
// story's ground and the band's margins on two different rulers.

const fill = (message: string, values: Record<string, string>): string =>
  message.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');

const MESSAGES = { ro, de } as const;
/** The two languages this file pins — spelled as a subset of `Locale`, so a key outside the manifest fails here. */
type StoryLocale = Extract<Locale, keyof typeof MESSAGES>;

/** The page's populator, in miniature: one language, every slide named. */
function slidesIn(
  locale: StoryLocale,
  options: { count?: number } = {},
): readonly HeroSlide[] {
  const rows = heroSlides.slice(0, options.count ?? heroSlides.length);
  return rows.map((row, index) => {
    const words = row.words[locale];
    return {
      id: row.id,
      src: row.picture.src,
      alt: words.alt,
      title: words.title,
      label: fill(MESSAGES[locale].home.hero.slide, {
        index: String(index + 1),
        total: String(rows.length),
      }),
    };
  });
}

function labelsIn(locale: StoryLocale): HeroLabels {
  const m = MESSAGES[locale];
  return {
    region: m.home.hero.region,
    role: m.common.carousel.role,
    slideRole: m.common.carousel.slideRole,
    picker: m.home.hero.picker,
    contact: m.home.hero.contact,
    services: m.home.hero.services,
  };
}

/**
 * THE REAL FACE BEFORE ANY MEASURE (the CI failure of 2026-10-01): the
 * Storybook face is `font-display: block`, so a play that measures right
 * after the render lays the slogan out in the FALLBACK serif until
 * Source Serif 4 arrives — and whether it has arrived depends on which
 * stories ran before in the same browser. Measured: the fallback wrapped the
 * first slogan onto two lines at 1536 locally (the gap read 24) where CI,
 * the font already loaded, laid it on one (131). `load()` fetches the exact
 * face the element asks for — DoctorIntro's `expectNameOnOneLine` recipe.
 */
const loadFace = async (element: HTMLElement): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
};

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story): ReactElement => (
      <ContactModalProvider>
        <Header />
        <Story />
      </ContactModalProvider>
    ),
  ],
  args: {
    slides: slidesIn('ro'),
    labels: labelsIn('ro'),
    servicesHref: '/ro/services/',
  },
  argTypes: {
    slides: {
      control: false,
      description:
        'The ring — finished words per slide, the page’s populator builds them',
    },
    slogan: {
      control: 'select',
      options: ['aura', 'plain', 'stroked', 'outlined'],
      description:
        "The slogan's face: 'aura' (default since 2026-10-01 — the old page's accent-stroked slogan under a lilac halo at the plain weight, ui/Heading's inverse-aura), 'plain' (the thin inverse ink, the owner's pick of 2026-09-21 and the default until then), 'stroked' (the bold, stroked face without the halo) or 'outlined' (the plain weight with the border alone, no halo)",
    },
    labels: {
      control: false,
      description: 'Every other word the band says, resolved by the page',
    },
    servicesHref: {
      control: 'text',
      description: 'localeHref(locale, "/services") — built by the page',
    },
    intervalMs: {
      control: 'number',
      description:
        'The rhythm in ms (default 5 500 — the old site’s own). Read once, at mount',
    },
    startDelayMs: {
      control: 'number',
      description:
        'The first dwell in ms (default 1 500; one second in Rotating). Read once, at mount',
    },
    env: { control: false },
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The everyday picture at the laptop width: the first slide showing, its
 * slogan on the AURA face — the old page's stroked letters under a lilac
 * halo, at the plain weight ("drop the bold."), the default since round 12
 * (2026-10-01) — over the veiled
 * photograph, the two calls to action, three beads with the first one a
 * pill. At this width the slogan runs 85.8px, the tablet's own share of the
 * viewport (the atom's new `slogan` step), and the words block spans the
 * column.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    const region = canvas.getByRole('region', { name: ro.home.hero.region });
    await expect(region).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
    const beads = canvas.getAllByRole('button', { name: /Imaginea \d din 3/ });
    await expect(beads).toHaveLength(3);
    await expect(beads[0]).toHaveAttribute('aria-current', 'true');
    await expect(
      canvas.getByRole('group', { name: 'Imaginea 1 din 3' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: ro.home.hero.contact }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: ro.home.hero.services }),
    ).toHaveAttribute('href', '/ro/services/');
    // Under the pill: the band's top edge IS the viewport's, and the stage
    // fills the whole first screen, never less.
    const box = region.getBoundingClientRect();
    await expect(box.top).toBe(0);
    await expect(box.height).toBeGreaterThanOrEqual(window.innerHeight);
    // THE BLOCK IS CENTRED, THEN 8 % DOWN (owner, rounds 6–7): from the
    // words row's top edge (the Container — since round 9 its top padding
    // holds the struck line's room, so the slogan itself sits lower) to the
    // services link's bottom edge, the median sits at 58 % of the screen's
    // height — ±3px for the rounding of two shared spacers.
    const slogan = canvas.getByText(heroSlides[0].words.ro.title);
    await loadFace(slogan);
    // The aura face, by default: stroked at the plain weight, its own halo.
    await expect(slogan.className).not.toContain('font-bold');
    await expect(slogan.className).toContain('text-stroke');
    await expect(slogan.className).toContain('text-shadow:');
    // The words ROW — the stacked slides' one cell, as tall as the tallest
    // slogan — is the block's top: slogan → wrapper → Container → slide →
    // row. (Until round 12e this read the first slide's Container, which
    // equalled the row only while that slide was the tallest.)
    const wordsRow =
      slogan.parentElement?.parentElement?.parentElement?.parentElement;
    if (!wordsRow) throw new Error('the words row is missing');
    const services = canvas.getByRole('link', { name: ro.home.hero.services });
    const blockTop = wordsRow.getBoundingClientRect().top;
    const blockBottom = services.getBoundingClientRect().bottom;
    // …and the slogan sits right above the buttons: 24px (owner, round 9).
    const contact = canvas.getByRole('button', { name: ro.home.hero.contact });
    await expect(
      Math.round(
        contact.getBoundingClientRect().top -
          slogan.getBoundingClientRect().bottom,
      ),
    ).toBe(24);
    // EVERY slide's words on the row's floor (round 12e): at this width the
    // first slogan takes one line and the other two take two, so a slide
    // aligned to the row's top would float a line above the buttons. The
    // slide boxes are never translated (their Containers are), so their
    // edges are the layout's.
    const rowBottom = wordsRow.getBoundingClientRect().bottom;
    const slideBoxes = [...wordsRow.children];
    await expect(slideBoxes).toHaveLength(3);
    for (const box of slideBoxes)
      await expect(
        Math.abs(box.getBoundingClientRect().bottom - rowBottom),
      ).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs((blockTop + blockBottom) / 2 - window.innerHeight * 0.58),
    ).toBeLessThanOrEqual(3);
    await expectNoSidewaysScroll(canvasElement);
  },
};

/**
 * The thin face — the owner's pick of 2026-09-21 (round 10) and the default
 * until round 12 brought the old page's heading back: the inverse ink alone,
 * no stroke, no halo (the wrapper's dark text-shadow still rides it) —
 * everything else identical to Default.
 */
export const PlainSlogan: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { slogan: 'plain' },
  play: async ({ canvas }) => {
    const slogan = canvas.getByText(heroSlides[0].words.ro.title);
    await expect(slogan.className).not.toContain('text-stroke');
    await expect(slogan.className).not.toContain('font-bold');
    await expect(slogan.className).not.toContain('text-shadow');
  },
};

/**
 * The BOLD stroked face without the halo — rounds 6–9's port of the old page's
 * slogan, one prop away from Default's aura face: bold, tight, the 2px
 * accent stroke behind the fill, the wrapper's dark text-shadow where the
 * aura face paints its lilac glow — everything else identical to Default.
 */
export const StrokedSlogan: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { slogan: 'stroked' },
  play: async ({ canvas }) => {
    const slogan = canvas.getByText(heroSlides[0].words.ro.title);
    await expect(slogan.className).toContain('text-stroke');
    await expect(slogan.className).toContain('font-bold');
    await expect(slogan.className).not.toContain('text-shadow');
  },
};

/** The third face — the plain weight with the border alone (round 8). */
export const OutlinedSlogan: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { slogan: 'outlined' },
  play: async ({ canvas }) => {
    const slogan = canvas.getByText(heroSlides[0].words.ro.title);
    await expect(slogan.className).toContain('text-stroke');
    await expect(slogan.className).not.toContain('font-bold');
  },
};

/**
 * THE BAND IN MOTION from its first second — for the eye, not the net: the
 * product's own 5.5 s rhythm with the first dwell cut to a second, so the
 * crossfade shows at once (the product's 5.5 s is pinned in Hero.test.tsx).
 * 'no-visual': a frame that moves by design is never a baseline
 * (tests/visual/stories.spec.ts).
 */
export const Rotating: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { startDelayMs: 1_000 },
  play: async ({ canvas }) => {
    const beads = canvas.getAllByRole('button', { name: /Imaginea \d din 3/ });
    await expect(beads[0]).toHaveAttribute('aria-current', 'true');
    // The first dwell passes and the ring steps on its own.
    await waitFor(
      async () => {
        await expect(beads[1]).toHaveAttribute('aria-current', 'true');
      },
      { timeout: 4_000 },
    );
  },
};

/**
 * DE is the longest language (§8.4), on the phone: the 32px slogan floor in a
 * 288px column at 320 (273 in the runner's 15px scrollbar gutter; 256 until
 * THE PHONE GUTTER, 2026-10-09 — ui/Container, CLAUDE.md §15.35), the two
 * buttons stacked at full width. The stress width rides the tag.
 */
export const GermanStress: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    slides: slidesIn('de'),
    labels: labelsIn('de'),
    servicesHref: '/de/services/',
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByRole('region', { name: de.home.hero.region }),
    ).toHaveAttribute('aria-roledescription', de.common.carousel.role);
    const contact = canvas.getByRole('button', { name: de.home.hero.contact });
    const services = canvas.getByRole('link', { name: de.home.hero.services });
    await expect(contact).toBeVisible();
    await expect(services).toBeVisible();
    // Stacked: the second control starts below the first at this width.
    await expect(services.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      contact.getBoundingClientRect().bottom,
    );
    await expectNoSidewaysScroll(canvasElement);
  },
};

/**
 * After a hand on a bead: the third slide showing, its bead the pill — and
 * the ring goes on from there a full interval later (round 3: nothing stops
 * for good). Under the net's reduced motion the ring is idle and the frame
 * is still; here the play asserts only where the press landed.
 */
export const Picked: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const beads = canvas.getAllByRole('button', { name: /Imaginea \d din 3/ });
    await fireEvent.click(beads[2]);
    await waitFor(async () => {
      await expect(beads[2]).toHaveAttribute('aria-current', 'true');
      await expect(
        canvas.getByRole('group', { name: 'Imaginea 3 din 3' }),
      ).toBeVisible();
    });
  },
};

/**
 * One picture is not a carousel: no role word on the region, no beads, no
 * live region — a photograph with its words and the two calls to action.
 */
export const Single: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { slides: slidesIn('ro', { count: 1 }) },
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: ro.home.hero.region });
    await expect(region).not.toHaveAttribute('aria-roledescription');
    await expect(canvas.queryByRole('group')).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: ro.home.hero.services }),
    ).toBeVisible();
  },
};
