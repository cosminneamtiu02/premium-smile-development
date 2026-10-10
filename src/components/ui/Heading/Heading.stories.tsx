import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Heading, type HeadingSize, type HeadingTone } from './Heading';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — real site strings (§15.7); DE-longest and pseudo-locale are
// dedicated stress variants, both carrying the 'stress-320' tag so the visual
// net also samples them at the 320px accessibility width (§13 UI-tier opt-in;
// the tier itself is 1280-only) — SectionStep carries that tag for its own
// reason: a 30px serif line wrapping inside a 320px column.
// Three of the six stories exist to show ONE look on three different
// elements — <p>, <h2>, <a>. That decoupling is the atom's whole point, and
// "identical pixels, different element" is a claim only rendered stories can
// make honestly.
// There are deliberately NO Focus/Hover stories: the atom is non-interactive
// and owns no state styling whatsoever — the AsLink child's focus ring comes
// from the globals' :focus-visible net, which belongs to no atom.
// The href is a placeholder: the real one is a plain locale anchor built by
// localeHref() (§15.13), and it lives in the Header. An atom story composes
// atoms; it never plays a section.

const meta = {
  title: 'UI/Heading',
  component: Heading,
  args: {
    children: 'Servicii și prețuri',
    size: 'title',
  },
  argTypes: {
    size: {
      control: 'select',
      options: [
        'title',
        'section',
        'band',
        'page',
        'hero',
        'slogan',
      ] satisfies HeadingSize[],
      description:
        "The growth axis, one step per measured consumer: 'title' = the Footer/Header treatment (font-display, text-xl, ink-strong) · 'section' = the SectionHeading step (text-3xl, same face and ink), measured 2026-09-01 · 'band' = THE h2 step (text-3xl, text-4xl from the container's @md step): 30px on a column narrower than 28rem, 36px from it — so an h2 never outranks the hero h1's 32px floor on a phone; the axis's one container-responsive row, joined 2026-09-26 (D48, see Band) · 'page' = the page-hero step (text-4xl), measured by the 404 band 2026-09-07 · 'hero' = the fluid full-screen step (clamp 32px → 72px with the viewport, /tight), measured by sections/Hero 2026-09-19 and THE h1 step since §15.24 · 'slogan' = the Home opener's slogan step (2026-10-01): hero's curve to the tablet, the tablet's own 5.58 % of the viewport from there — 32px → 107px (see SloganStep). Further steps join additively when real designs measure them — the default stays 'title' forever, so growth never moves an existing call site",
    },
    tone: {
      control: 'select',
      options: [
        'default',
        'inverse',
        'inverse-stroked',
        'inverse-outlined',
        'inverse-aura',
        'accent',
        'accent-idle',
      ] satisfies HeadingTone[],
      description:
        "The ink axis, orthogonal to size: 'default' = ink-strong, every title's ink · 'inverse' = ink-inverse, display text over the §15.1 scrim · 'inverse-stroked' = the same white ink, bold and tight, with the old page's 2px accent stroke behind the letterforms · 'inverse-outlined' = the plain weight with that stroke alone (the Hero's three compared faces, 2026-09-20/21) · 'inverse-aura' = the outlined face (the plain weight) plus a lilac HALO — two centred em-scaled text-shadows mixed from the display lilac — the old page's slogan as the owner sees it and the Hero's default face since 2026-10-01 · 'accent' = the lilac accent-decorative ink, ALWAYS bold — the year labels over a doctor's courses (sections/DoctorCourses, 2026-09-25): 4.44:1 on the page ground is large-text contrast only, and bold is what makes the 20px title step large · 'accent-idle' = the same bold in ink-muted, accent's REST twin — the course timeline's grey years at rest (2026-09-26): the pair differs in the ink alone, so a year switching between them never reflows. Joined with sections/Hero; the default stays 'default' forever",
    },
    asChild: {
      control: false,
      description:
        'Render no element of its own — the single child element becomes the heading (see AsHeadingElement / AsLink)',
    },
    children: {
      control: 'text',
      description: 'The finished, already-translated text (§8.1)',
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default host: a plain <p> — the Footer's column and brand titles, which open no outline slot on purpose. */
export const Default: Story = {};

/**
 * asChild: the nested <h2> IS the heading — identical pixels to Default, plus
 * a real document outline slot. This is the shape a future SectionHeading
 * passes (it owns the level and the id; the atom owns only the size).
 * axe note: a lone <h2> satisfies heading-order — that rule scores the
 * INCREMENT between consecutive headings, and the first heading in the order
 * has none to score.
 */
export const AsHeadingElement: Story = {
  render: (args) => (
    <Heading {...args} asChild>
      <h2>Echipa noastră</h2>
    </Heading>
  ),
};

/**
 * asChild: the brand anchor IS the heading — the Header's shape, where the
 * classes sit ON the link today. Cloning them onto the child is what makes
 * that rewire byte-identical in the DOM rather than merely similar.
 */
export const AsLink: Story = {
  render: (args) => (
    <Heading {...args} asChild>
      <a href="#acasa">Premium Smile</a>
    </Heading>
  ),
};

/**
 * The second step (D2, 2026-09-01): `text-3xl` — 30px on the same display face
 * and the same ink, the size sections/SectionHeading passes. Both wrap extremes
 * share one frame, because a step shown only on its short line proves nothing
 * about the long one: the Romanian title the section opens with, and a German
 * compound that cannot break at a space (§8.4 expansion). A 30px serif compound
 * inside a 320px column is the genuine wrap case here — hence 'stress-320'.
 * The Romanian line follows the `size` control (flip it to watch the step next
 * to itself); the German line is pinned to 'section' so the comparison holds.
 * Both take the default <p> host — the story samples a SIZE, not an outline,
 * so there is no heading order for axe to score.
 * The gap belongs to this wrapper, never to the atom (§6.4).
 * lang="de" rides the prop spread onto the German <p> (fb-315): CSS
 * `hyphens: auto` picks its dictionary from the ELEMENT's language, so this
 * line breaks under German patterns while the frame stays Romanian.
 */
export const SectionStep: Story = {
  tags: ['stress-320'],
  args: { size: 'section', children: 'Vizitează clinica noastră' },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="section" lang="de">
        Behandlungsschwerpunkte und Anfahrtsbeschreibung
      </Heading>
    </div>
  ),
};

/**
 * THE h2 step (2026-09-26, the doctor-pages run's D48): one row, two sizes,
 * decided by the NEAREST `@container`, never by the screen — ui/Container's
 * column for a band title, the ui/Card itself for a card title, measured on
 * the card's content box, 25px inside its border-box on every side
 * (Heading.tsx's `'band' JOINED` paragraph). The same words in two
 * `@container` frames: a `w-xs` one — a 320px CONTAINER, the narrow case:
 * the 20rem schedule card (270px of content) lands under it and a 390px
 * phone's column (351px since ui/Container's phone gutter of 2026-10-09, 312
 * before) just over it, and every container under 448px reads 30px —
 * where the step rests on section's 30px, and a `w-md` one (28rem = 448px —
 * the container's `@md` threshold itself, which is inclusive) where it
 * reaches page's 36px. That is how a band title stays under the `hero` h1's
 * 32px floor on a phone and still reads as the "next order" below it wherever
 * its container can carry it. In each frame the
 * Romanian line follows the controls and the German one (the schedule card's
 * DE title — the longest language, §8.4) is pinned to 'band'. Real <h2>s
 * through asChild, the shape every consumer passes; four consecutive h2s give
 * axe's heading-order no increment to score. The frames — their widths, their
 * gap, their dashed OUTLINE (not a border: a border would eat into the content
 * box the container query measures) — are the story's, never the atom's
 * (§6.4). No 'stress-320' tag: a 448px frame cannot fit a 320px viewport, and
 * the narrow frame already stands for the phone column.
 */
export const Band: Story = {
  args: { size: 'band', children: 'Când mă găsiți la clinică' },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div className="@container flex w-xs flex-col gap-4 outline outline-dashed outline-line">
        <Heading {...args} asChild>
          <h2>{args.children}</h2>
        </Heading>
        <Heading size="band" asChild>
          <h2 lang="de">Wann Sie mich in der Praxis finden</h2>
        </Heading>
      </div>
      <div className="@container flex w-md flex-col gap-4 outline outline-dashed outline-line">
        <Heading {...args} asChild>
          <h2>{args.children}</h2>
        </Heading>
        <Heading size="band" asChild>
          <h2 lang="de">Wann Sie mich in der Praxis finden</h2>
        </Heading>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    // Read off the engine, in DOM order — narrow RO, narrow DE, wide RO, wide
    // DE. The frames are measured first, so a width utility that failed to
    // generate cannot let the sizes pass for the wrong reason.
    const titles = canvas.getAllByRole('heading', { level: 2 });
    await expect(
      titles.map(
        (title) => title.parentElement?.getBoundingClientRect().width ?? 0,
      ),
    ).toEqual([320, 320, 448, 448]);
    await expect(
      titles.map((title) => parseFloat(getComputedStyle(title).fontSize)),
    ).toEqual([30, 30, 36, 36]);
  },
};

/**
 * The page-hero step, measured in by the 404 band (owner, 2026-09-07): 36px,
 * one additive step over 'section', same face and ink. Same dual-line shape as
 * SectionStep — the Romanian line follows the `size` control, the German line
 * is pinned to 'page' so the comparison holds; both at the default <p> host (a
 * SIZE sample, not an outline). The fixtures are the step's own measuring
 * consumer: the routed 404 headings, `404: ` prefix included, and a 36px serif
 * line in a 320px column is the wrap case — hence 'stress-320'.
 */
export const PageStep: Story = {
  tags: ['stress-320'],
  args: { size: 'page', children: '404: Această pagină nu există' },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="page" lang="de">
        404: Diese Seite existiert nicht
      </Heading>
    </div>
  ),
};

/**
 * The fluid slogan step, measured in by sections/Hero (owner dispatch
 * 2026-09-19, epic #103): `clamp(2rem, 1rem + 3.5vw, 4.5rem)` — 32px at the
 * 320px stress width, ~61px at the 1280px UI-tier width, 72px from 1600px
 * on — replacing the old site's four-prefix staircase with one curve, so the
 * atom scales with the PAGE (the gutter's own licence) and never with a
 * container it cannot see. Same dual-line shape as its elders: the Romanian
 * line follows the controls, the German line is pinned to 'hero'. The fixtures
 * are the old site's own slogans. 'stress-320': a 32px serif line in a 288px
 * column (the 320 window's since ui/Container's phone gutter of 2026-10-09;
 * 256 before) is the wrap case, and the step's floor is what this width
 * proves.
 * THE h1 STEP of §15.24 since 2026-09-26 (the doctor page's name, the 404
 * title); the opener's own reshape is SloganStep, beside it.
 */
export const HeroStep: Story = {
  tags: ['stress-320'],
  args: {
    size: 'hero',
    children: 'O clinică stomatologică modernă pentru toată familia',
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="hero" lang="de">
        Eine moderne Zahnklinik für die ganze Familie
      </Heading>
    </div>
  ),
};

/**
 * The Home opener's slogan step (owner, 2026-10-01: "leave on phone as is,
 * on tablet is perfect, but adapt text component raports in sizing for
 * laptop and desktop as on tablet"): `clamp(2rem, max(1rem + 3.5vw,
 * 5.5833vw), 6.7rem)` — hero's curve to the tablet (32px at the 320px stress
 * width, 42.88px at 768), the tablet's own 5.58 % of the viewport from there
 * (71.5px at 1280, 107.2px at 1920, where the cap holds). A step BESIDE
 * `hero`, not `hero` reshaped: since §15.24 `hero` is the h1 step of every
 * page, and a doctor's name at 107px in DoctorIntro's words column is not
 * what the owner pointed at (the atom's header has the differential). Same
 * dual-line shape as HeroStep — the Romanian line follows the controls, the
 * German line is pinned to 'slogan' — on the clinic's own first slogan
 * (lib/hero-slides) and its German twin; 'stress-320' for HeroStep's reason.
 * The play reads the curve OFF THE ENGINE at whatever width the story runs
 * — the one proof that the nested `max()` reached the browser as valid CSS
 * (an arbitrary value Tailwind failed to normalise would leave the step at
 * the body's 18px, and no class assertion can see that).
 */
export const SloganStep: Story = {
  tags: ['stress-320'],
  args: {
    size: 'slogan',
    children: 'Bine ai venit! Te așteptăm cu drag.',
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="slogan" lang="de">
        Herzlich willkommen! Wir freuen uns auf Sie.
      </Heading>
    </div>
  ),
  play: async ({ canvas }) => {
    // vw counts the scrollbar gutter, so innerWidth is the right ruler; the
    // root is 16px (globals.css keeps html at the browser default, §7).
    const line = canvas.getByText(
      'Herzlich willkommen! Wir freuen uns auf Sie.',
    );
    const vw = window.innerWidth;
    const expected = Math.min(
      Math.max(32, 16 + 0.035 * vw, 0.055833 * vw),
      6.7 * 16,
    );
    await expect(parseFloat(getComputedStyle(line).fontSize)).toBeCloseTo(
      expected,
      0,
    );
  },
};

/**
 * The inverse ink on the ground it exists for: display text over the §15.1
 * scrim. The wrapper paints `bg-scrim` over `bg-page` — the darkest the
 * scrim ever gets on the site is the 0.55 token over a white photograph, and
 * this near-white ground is that worst case (white-on-#737373 measures
 * 4.77:1, which is why 0.55 is the locked floor). The wrapper's padding is the
 * story owning its spacing, never the atom's (§6.4). Both steps the Hero
 * uses ride here — the slogan on 'hero', a supporting line on 'section' —
 * because the axis is orthogonal and a story is where that is visible.
 */
export const InverseTone: Story = {
  tags: ['stress-320'],
  args: {
    size: 'hero',
    tone: 'inverse',
    children: 'O echipă care ascultă, pe limba ta',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="section" tone="inverse" lang="de">
          Ein Team, das zuhört – in Ihrer Sprache
        </Heading>
      </div>
    </div>
  ),
};

/**
 * The old page's slogan face (owner, 2026-09-20: "the thick heading with
 * border"): bold, tight, white, a 2px accent stroke painted BEHIND the fill,
 * so every glyph keeps a defined edge over a pale photograph. Shown over the
 * §15.1 scrim like InverseTone — the solid ground axe can measure (4.77:1);
 * the Hero's own 0.40 veil sits over a photograph, which axe cannot measure,
 * and its number is recorded in Hero.tsx and §15.1's rider, not here. The
 * wrapper owns its spacing, never the atom (§6.4).
 */
export const StrokedTone: Story = {
  tags: ['stress-320'],
  parameters: {
    // axe reads `-webkit-text-stroke`'s colour as the FOREGROUND and measures
    // the lavender stroke against the ground (1.06:1) - a false positive: the
    // stroke is painted BEHIND the fill (paint-order), the letterforms the
    // visitor reads are the white ink, and InverseTone measures that ink on
    // this very ground at 4.77:1. The rule is off for this story only, the
    // reason recorded here; every other rule still runs.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: {
    size: 'hero',
    tone: 'inverse-stroked',
    children: 'Tratamente realizate ca într-un studio de lux',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="hero" tone="inverse-stroked" lang="de">
          Behandlungen wie in einem Luxusstudio
        </Heading>
      </div>
    </div>
  ),
};

/**
 * The stroke alone on the plain weight (owner, 2026-09-21: "the initial thin,
 * but with that border") — the Hero's third compared face, over the same
 * scrim ground as its siblings. The same axe note as StrokedTone: the checker
 * reads the stroke colour as the foreground, so its contrast rule is off for
 * this story only.
 */
export const OutlinedTone: Story = {
  tags: ['stress-320'],
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: {
    size: 'hero',
    tone: 'inverse-outlined',
    children: 'Tratamente realizate ca într-un studio de lux',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="hero" tone="inverse-outlined" lang="de">
          Behandlungen wie in einem Luxusstudio
        </Heading>
      </div>
    </div>
  ),
};

/**
 * The owner's own description of the old page's slogan, made a face of its
 * own (2026-10-01, the hero-aura lane: "white on interior and has a lila aura
 * shadow as top bar around letters and with that lilla contour and i think it
 * is in bold" — then, on the pack: "drop the bold."): OutlinedTone's white,
 * accent-stroked letterforms at the plain weight plus a lilac HALO — two
 * centred text-shadows mixed from the display lilac,
 * 0.28em at 60 % and 0.08em at 40 %, in em so the glow keeps its share of the
 * letter from a phone's 32px to a desktop's 107px (the wearer is the `slogan`
 * step; the atom's header has the comparison). The Hero's DEFAULT face since
 * that day; the fixtures are the clinic's own first slogan (lib/hero-slides)
 * and its German twin. Over the §15.1 scrim like its siblings — the one
 * ground axe can measure — with StrokedTone's color-contrast exemption for
 * StrokedTone's reason: axe reads the stroke's lilac as the foreground. The
 * play reads the halo off the engine. The wrapper owns the spacing (§6.4).
 */
export const AuraTone: Story = {
  tags: ['stress-320'],
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: {
    size: 'slogan',
    tone: 'inverse-aura',
    children: 'Bine ai venit! Te așteptăm cu drag.',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="slogan" tone="inverse-aura" lang="de">
          Herzlich willkommen! Wir freuen uns auf Sie.
        </Heading>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    // Two centred layers, the wide one first, both a fixed share of the
    // letter: 0.28em and 0.08em of whatever size the step resolves to here.
    const slogan = canvas.getByText('Bine ai venit! Te așteptăm cu drag.');
    const style = getComputedStyle(slogan);
    await expect(Number(style.fontWeight)).toBeLessThan(600); // the bold dropped
    const fontSize = parseFloat(style.fontSize);
    const layers = style.textShadow.split(/,(?![^(]*\))/).map((s) => s.trim());
    await expect(layers).toHaveLength(2);
    const blurs = layers.map((layer) =>
      parseFloat(/(\d+(?:\.\d+)?)px$/.exec(layer)?.[1] ?? 'NaN'),
    );
    await expect(blurs[0]).toBeCloseTo(0.28 * fontSize, 0);
    await expect(blurs[1]).toBeCloseTo(0.08 * fontSize, 0);
    for (const layer of layers) await expect(layer).toMatch(/ 0px 0px /);
  },
};

/**
 * The accent ink (2026-09-25, the doctor-pages run's round 2, D16): the lilac
 * year label sections/DoctorCourses opens each group of courses with — a real
 * <h3> through asChild on the page ground it ships on, photographed at the
 * `title` step ON PURPOSE: the consumer has worn `section` (30px, large by
 * size alone) since round 2j (D44a), and 20px is the harder case — the one
 * where the weight is what makes the label large, so a frame that passes here
 * passes at every step above it.
 * The owner asked for "bold and lilac"; the arithmetic is why the two travel
 * together. `--color-accent-decorative` #7a6d9c on `--page` #faf9f7 measures
 * 4.44:1 — UNDER the 4.5:1 normal text needs, which is why §15.1 licenses the
 * role for large display text and graphics only. WCAG's "large" is ≥ 24px, or
 * ≥ 18.67px BOLD: the title step is 20px, so the tone's own `font-bold` is
 * what lifts this label into the 3:1 bracket, where 4.44:1 clears with room.
 * That is why the weight is in the TONE row and not the caller's className —
 * the pair cannot be split at a call site.
 * axe runs with every rule ON here, color-contrast included: it reads the
 * computed weight (700) and size (20px), classifies the text as large and
 * scores it against 3:1 — the story is the arithmetic, checked by the engine.
 * The lone <h3> passes heading-order for AsHeadingElement's reason: the rule
 * scores the INCREMENT between consecutive headings, and the first has none.
 * The wrapper paints the ground and owns the padding, never the atom (§6.4).
 */
export const AccentTone: Story = {
  args: { size: 'title', tone: 'accent', children: '2024' },
  render: (args) => (
    <div className="bg-page p-6">
      <Heading {...args} asChild>
        <h3>{args.children}</h3>
      </Heading>
    </div>
  ),
  play: async ({ canvas }) => {
    // The "large" claim, read off the engine rather than asserted in prose:
    // the weight the tone row ships and the size the title step resolves to.
    // 18.66 rather than 18.67 is float slack on WCAG's 14pt (= 18.666…px).
    const label = canvas.getByRole('heading', { level: 3 });
    const style = getComputedStyle(label);
    await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
    await expect(parseFloat(style.fontSize)).toBeGreaterThanOrEqual(18.66);
  },
};

/**
 * The accent ink's REST twin (2026-09-26, the doctor-pages run's round 2g,
 * D35): the grey year a course timeline shows while that year is not the one
 * being read — "all are grayed out at rest", in the owner's words. The SAME
 * `font-bold` as AccentTone, in `ink-muted`: the two are a lit/unlit pair that
 * sections/DoctorCourses switches as the visitor scrolls, and a pair that
 * differed in weight would reflow the line — and every course under it — on
 * every switch. Only the ink moves (the test file pins exactly one token of
 * difference). `--ink-muted` #5b554f on `--page` #faf9f7 measures 6.99:1 at
 * full opacity, so unlike the accent this ink clears body-text contrast at any
 * weight; at full opacity the bold is here for the pair, not for the
 * arithmetic.
 * KEEP-IN-SYNC with sections/DoctorCourses/CourseTimeline.tsx (its CONTRAST,
 * MEASURED paragraph and `groupIdle`): the one consumer fades the whole
 * resting group to 0.65, where this ink blends to rgb(147 142 138) and reads
 * 3.07:1 on `--page` — the large-text bar, which every step of this atom
 * meets by construction (the smallest, `title`, is 20px, and this row is
 * bold: ≥ 18.67px bold is large) — so no consumer may fade it below 0.65
 * without re-measuring (at 0.50 it would read 2.27:1, a failure). This frame
 * shows the ink at full opacity.
 * Same shape as AccentTone — a real <h3> through asChild on the page ground,
 * at the same `title` step for AccentTone's reason (the consumer is at
 * `section`, D44a) — so the two frames sit side by side in the pack as the
 * two states of one label. axe runs with every rule on, color-contrast
 * included.
 */
export const AccentIdleTone: Story = {
  args: { size: 'title', tone: 'accent-idle', children: '2024' },
  render: (args) => (
    <div className="bg-page p-6">
      <Heading {...args} asChild>
        <h3>{args.children}</h3>
      </Heading>
    </div>
  ),
  play: async ({ canvas }) => {
    // The weight the pair shares, read off the engine: bold at rest too.
    const label = canvas.getByRole('heading', { level: 3 });
    await expect(
      Number(getComputedStyle(label).fontWeight),
    ).toBeGreaterThanOrEqual(700);
  },
};

/**
 * DE is the longest locale (§8.4) — this is the real Footer hours title: one
 * long compound word with an umlaut and no break opportunity, sampled at 320px
 * where an atom that had reserved width would overflow.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: { children: 'Öffnungszeiten' },
};

/** Pseudo-locale (~40% expansion, accents) — hardcoded stress fixture (§15.7). */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: { children: 'Šéŕvíçíí șî þŕéțûŕí~~~' },
};
