import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { People } from '@/assets/glyphs/People';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import { DoctorStats, type DoctorStatTile } from './DoctorStats';

// FIVE stories, and the count is the honest one: the everyday band at the
// width where the four tiles stand on one row, the phone arrangement with one
// tile above the other, the two expansion stresses — and `Counting`, a
// play-only twin of the everyday band that watches the count from its first
// frame (G2-R2 tier 2, react F3), tagged 'no-visual' so it names no baseline.
// The export NAMES of the other four are load-bearing — each one names a
// baseline file (`sections-doctorstats--default`,
// `sections-doctorstats--stacked`, …), so renaming or adding a photographed
// export re-records pictures; those four ARE the band's contribution to the
// round-2f visual manifest (D30), which `Counting` leaves unchanged. The
// `Sections/*` title prefix routes every photographed one to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to the three whose layout has something to say there (a
// 256px column of 18px prose, German labels in it, a 40%-expanded lead).
//
// ── NO `ReducedMotion` STORY, by the contract's design: the preference is
// READ in the plays of `Default` and `Counting`, each asserting whichever
// branch the machine is on. The visual projects run with
// `reducedMotion: 'reduce'` (playwright.config.ts, the hero lane's stillness
// lever), so there `Default`'s play proves the STILL branch — the final value
// at once, never moving — and the photograph is of final numbers, never of a
// frame caught mid-count. The Vitest runner's Chromium has no preference set,
// so there `Counting` proves the COUNT — a number that leaves its final value,
// climbs, and lands back on it within two seconds. The count is sampled in
// `Counting` and not in `Default` (G2-R2 tier 2, react F3): at the laptop pin
// `Default`'s first tile is on screen at mount and starts counting before any
// play can watch it, and its "6+" is final again after ≈ 0.87 s of the 1.5 s,
// so a slow runner reaching the play later would see only the final value and
// fail for a reason that is not in the code. `Counting`'s intro keeps the
// tiles below the fold until its play scrolls them in.
//
// ── THE PAINTED ORDER IS AN ENGINE FACT (G2-R2 tier 2, a11y F1). Each tile's
// DOM is disc → label → number → description, and two order utilities paint
// the reference's disc → number → label → description back; the suite pins
// the tokens, `expectPaintOrder` below reads their effect off the layout.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props — the doctor page owns the keys and the data): the preview
//     decorator stamps `<html lang>` from that global, and `hyphens: auto`
//     (§15.14) picks its dictionary from the declared language;
//   · the viewport pin, because this band CHANGES SHAPE with the column it is
//     handed: two tiles a row from `@md` = 28rem, four from `@3xl` = 48rem of
//     CONTAINER width. The Vitest runner applies the pin; Playwright ignores it
//     and sets its own page size per project — which is exactly why the
//     arrangement assertion DERIVES its branch from the measured column
//     instead of assuming the pinned width (the DoctorCourses recipe).
//
// ── THE OWNER'S ADAPTABILITY RULE (2026-09-25, D21): anything side by side on
// the desktop MUST stack one above the other on phones. The one-column branch
// below is that sentence as geometry — each tile's top at or under the
// previous tile's bottom, every tile on the list's left edge and as wide as
// the list — and every smartphone-pinned story runs it.
//
// ── `layout: 'fullscreen'` for the reason TintedBand sets it: the band is
// full-bleed and owns its gutter through ui/Container, so Storybook's default
// canvas padding would leave a page-coloured frame around the tint.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the band reads no message
// file and links nowhere; its one script is the count (StatNumber, D31).
//
// Demo copy: the eyebrow, title and lead are the `team.doctor.stats` values
// (Romanian the owner's words, German DRAFTED, §15.17); the tile words are
// lib/team's first doctor's (D32), verbatim. Round 2s (the owner, 2026-09-27)
// rewrote the claims his reference site made („Excelență…", „Recunoașterea
// obținută…", „Intervenții reușite", „Rezultate predictibile și sigure…",
// „Recunoaștere pentru inovație…") into descriptive copy, and
// tests/unit/cmsr-scan.test.ts keeps the shipped strings that way; these
// fixtures follow the shipped copy word for word, so a pack frame never shows
// a claim the site no longer makes. The numbers are the demo doctor's,
// invented (not lib/team's: the plays pin them). `atLeast` is the page's
// `team.doctor.stats.atLeast` value, the owner's word (2026-09-27, round 2s):
// „peste" in Romanian, „über" in `GermanLongest`, the preview's pseudo form of
// „peste" in `PseudoLocale`. It is never SEEN: every play reads the count off
// the visible (aria-hidden) span, which keeps the „+", and the spoken form
// („peste 3.000") off the sr-only twin.

const EYEBROW = 'În cifre';
const TITLE = 'Experiență confirmată în timp';
const LEAD =
  'Cifrele de mai jos spun, pe scurt, cum lucrăm: cu atenție, cu tehnologie modernă și cu grijă reală pentru fiecare pacient.';

/** The page's `team.doctor.stats.atLeast` word (round 2s), per language —
 *  the owner's: what a screen reader says in place of the „+". */
const AT_LEAST = 'peste';
const GERMAN_AT_LEAST = 'über';

/** The four tiles, Romanian — the reference's order and the demo numbers. */
const TILES = [
  {
    id: 'experience',
    icon: <CalendarCheck />,
    value: 6,
    suffix: '+',
    label: 'Ani de experiență',
    description: 'Punem grija, expertiza și empatia în fiecare detaliu.',
  },
  {
    id: 'patients',
    icon: <People />,
    value: 3000,
    suffix: '+',
    label: 'Pacienți',
    description:
      'Peste 3000 de zâmbete îngrijite cu dedicare și profesionalism.',
  },
  {
    id: 'courses',
    icon: <Trophy />,
    value: 10,
    label: 'Cursuri',
    description: 'Formare continuă în tehnici și tehnologii moderne.',
  },
  {
    id: 'interventions',
    icon: <ToothCheck />,
    value: 1000,
    suffix: '+',
    label: 'Intervenții',
    description:
      'Atenție la detalii, tehnologii moderne și o abordare personalizată pentru fiecare pacient.',
  },
] as const satisfies readonly DoctorStatTile[];

/** The same four in German (DRAFTED, §15.17 — lib/team's drafts): the
 *  longest locale's words in a 256px column are the case this frame exists
 *  for: „Jahre Erfahrung" the longest label since round 2s shortened
 *  „Erfolgreiche Eingriffe" to „Eingriffe", and the interventions sentence
 *  the longest of the four. */
const GERMAN_TILES = [
  {
    ...TILES[0],
    label: 'Jahre Erfahrung',
    description:
      'Wir legen Sorgfalt, Fachwissen und Einfühlungsvermögen in jedes Detail.',
  },
  {
    ...TILES[1],
    label: 'Patienten',
    description: 'Über 3000 Lächeln, mit Hingabe und Professionalität betreut.',
  },
  {
    ...TILES[2],
    label: 'Kurse',
    description: 'Laufende Fortbildung in modernen Techniken und Technologien.',
  },
  {
    ...TILES[3],
    label: 'Eingriffe',
    description:
      'Aufmerksamkeit für Details, moderne Technologien und ein individueller Ansatz für jeden Patienten.',
  },
] as const satisfies readonly DoctorStatTile[];

/**
 * Every string of the band put through the preview's OWN pseudo transform
 * (the same ACCENT map, the same `·`-padding at 40 % of the source length) —
 * typed out, because the toolbar transforms message files and this band reads
 * none. Unlike DoctorCourses, EVERY string here is transformed: the band has
 * no data half, its three opener strings are `team.doctor.stats` keys and its
 * tile words are the doctor's, and all of it is the band's text (the
 * contract's rule for this frame).
 */
const PSEUDO = {
  atLeast: 'péšťé ··',
  eyebrow: 'Îñ çífré ····',
  title: 'Éxpéríéñță çóñfírmáťă îñ ťímp ············',
  lead: 'Çífrélé dé máí jóš špúñ, pé šçúrť, çúm lúçrăm: çú áťéñțíé, çú ťéhñólógíé módérñă șí çú gríjă réálă péñťrú fíéçáré páçíéñť. ·················································',
  tiles: [
    {
      ...TILES[0],
      label: 'Áñí dé éxpéríéñță ·······',
      description:
        'Púñém gríjá, éxpérťížá șí émpáťíá îñ fíéçáré déťálíú. ······················',
    },
    {
      ...TILES[1],
      label: 'Páçíéñțí ····',
      description:
        'Péšťé 3000 dé žâmbéťé îñgríjíťé çú dédíçáré șí próféšíóñálíšm. ·························',
    },
    {
      ...TILES[2],
      label: 'Çúršúrí ···',
      description:
        'Fórmáré çóñťíñúă îñ ťéhñíçí șí ťéhñólógíí módérñé. ····················',
    },
    {
      ...TILES[3],
      label: 'Íñťérvéñțíí ·····',
      description:
        'Áťéñțíé lá déťálíí, ťéhñólógíí módérñé șí ó ábórdáré péršóñálížáťă péñťrú fíéçáré páçíéñť. ····································',
    },
  ],
} as const;

const formatFor =
  (locale: string) =>
  (value: number): string =>
    new Intl.NumberFormat(locale).format(value);

/** The final numbers the visitor SEES, per language: the visible
 *  (aria-hidden) span's text, the „+" kept. */
const RO_FINALS = ['6+', '3.000+', '10', '1.000+'];
const DE_FINALS = ['6+', '3.000+', '10', '1.000+'];

/** …and what a screen reader SAYS for them (round 2s): the page's word before
 *  the page's number on a „+" tile, the number alone on the exact count, the
 *  sign never. */
const RO_SPOKEN = ['peste 6', 'peste 3.000', '10', 'peste 1.000'];
const DE_SPOKEN = ['über 6', 'über 3.000', '10', 'über 1.000'];
const PSEUDO_SPOKEN = ['péšťé ·· 6', 'péšťé ·· 3.000', '10', 'péšťé ·· 1.000'];

/** The count's own budget — StatNumber's 1.5 s plus half a second of slack
 *  for the observer's first report and a busy runner. */
const COUNT_BUDGET_MS = 2_000;

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/**
 * A container step in CSS pixels, read against the document's own font size
 * — `@md` is 28rem, `@3xl` 48rem, and a visitor who has enlarged the base font
 * moves both (the DoctorCourses reasoning).
 */
const stepPx = (rem: number): number =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The tiles in DOM order, reached by role. */
const tilesOf = (band: HTMLElement): HTMLElement[] =>
  within(within(band).getByRole('list')).getAllByRole('listitem');

/**
 * Each tile's number — the <p>, its visible (aria-hidden) span and its sr-only
 * twin — found by what it SAYS and never by its index among the tile's
 * children, because the DOM order is not the painted one (G2-R2 tier 2, a11y
 * F1): the twin is the tile's one `.sr-only` text and always holds a digit
 * (the SPOKEN form since round 2s, „peste 3.000": the word, then the number),
 * the visible span is the number's one aria-hidden text holding a digit
 * (mid-count too: "0+" is a digit), the number <p> is their parent. The count
 * is read off `visible`; what is heard, off `twin`.
 */
const numbersOf = (band: HTMLElement) =>
  tilesOf(band).map((tile) => {
    const twin = within(tile).getByText(/\d/, { selector: '.sr-only' });
    const number = twin.parentElement as HTMLElement;
    const visible = within(number).getByText(/\d/, {
      selector: '[aria-hidden="true"]',
    });
    return { number, visible, twin };
  });

/** The facts a picture cannot show: a named region, its one <h2>, one <h3>
 *  per tile in order, and the SPOKEN finals in the sr-only twins from the
 *  very first frame (§16 rule 2 — the accessible name never counts; round 2s
 *  — it says the page's word, never the sign). */
const expectOutline = async (
  band: HTMLElement,
  title: string,
  labels: readonly string[],
  spoken: readonly string[],
): Promise<void> => {
  await expect(
    within(band).getByRole('heading', { level: 2, name: title }),
  ).toBeInTheDocument();
  await expect(
    within(band)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual([...labels]);
  await expect(numbersOf(band).map(({ twin }) => twin.textContent)).toEqual([
    ...spoken,
  ]);
};

/** Every VISIBLE number ends on its final value within the budget — true of
 *  a tile that counted and of one that never scrolled into view alike — and
 *  every twin still says its SPOKEN final (round 2s). */
const expectFinalWithinBudget = async (
  band: HTMLElement,
  finals: readonly string[],
  spoken: readonly string[],
): Promise<void> => {
  await waitFor(
    () =>
      expect(numbersOf(band).map(({ visible }) => visible.textContent)).toEqual(
        [...finals],
      ),
    { timeout: COUNT_BUDGET_MS },
  );
  await expect(numbersOf(band).map(({ twin }) => twin.textContent)).toEqual([
    ...spoken,
  ]);
};

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** The machine's own preference, READ, never assumed (the header). */
const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * THE STILL BRANCH (D31): under reduced motion the number is final NOW and
 * still final after half a second, so nothing moved. Scrolls nothing, so the
 * visual net photographs `Default` where the story opens it.
 */
const expectStill = async (
  visible: HTMLElement,
  final: string,
): Promise<void> => {
  await expect(visible.textContent).toBe(final);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await expect(visible.textContent).toBe(final);
};

/**
 * THE COUNT (D31), sampled every frame from the moment the caller scrolled the
 * number in: it LEAVES its final value (the count ran), climbs without ever
 * falling from there on, and is final again within the budget — while the
 * twin, sampled on the same frames, says the SPOKEN final throughout (round
 * 2s: the ear never hears the count, nor the sign). The caller
 * guarantees that the count had not started before the scroll (`Counting`'s
 * premise, asserted there); without it the first samples could already be the
 * final value again, and the play would fail for a reason not in the code.
 */
const expectCount = async (
  { visible, twin }: { visible: HTMLElement; twin: HTMLElement },
  final: string,
  spoken: string,
): Promise<void> => {
  const digits = (text: string | null): number =>
    Number((text ?? '').replace(/\D/g, ''));
  const seen: string[] = [];
  const heard = new Set<string>();
  const started = performance.now();
  while (performance.now() - started < COUNT_BUDGET_MS) {
    const text = visible.textContent ?? '';
    seen.push(text);
    heard.add(twin.textContent ?? '');
    if (text === final && seen.some((s) => s !== final)) break;
    await nextFrame();
  }
  // The twin never moved: one spoken final on every sampled frame.
  await expect([...heard]).toEqual([spoken]);
  const firstMove = seen.findIndex((text) => text !== final);
  // The count ran: the number left its final value…
  await expect(firstMove).toBeGreaterThanOrEqual(0);
  // …climbed from there without ever falling…
  const climb = seen.slice(firstMove).map(digits);
  for (let index = 1; index < climb.length; index += 1) {
    await expect(climb[index]).toBeGreaterThanOrEqual(climb[index - 1]);
  }
  // …and landed back on the final value.
  await expect(seen.at(-1)).toBe(final);
};

/**
 * THE PAINTED ORDER (G2-R2 tier 2, a11y F1), read off the ENGINE: in every
 * tile the disc paints above the number, the number ABOVE its <h3> (the claim
 * the two order tokens exist for, since the <h3> comes first in the DOM), and
 * the <h3> above the sentence. Each box is reached by what it is (the disc as
 * the tile's aria-hidden child, the number by its twin, the label by role,
 * the sentence by its text), never by index, and must be laid out, so the
 * check is never vacuous.
 */
const expectPaintOrder = async (
  band: HTMLElement,
  tiles: readonly DoctorStatTile[],
): Promise<void> => {
  const numbers = numbersOf(band);
  for (const [index, tile] of tilesOf(band).entries()) {
    const disc = [...tile.children].find(
      (child) => child.getAttribute('aria-hidden') === 'true',
    ) as HTMLElement;
    const boxes = [
      disc,
      numbers[index].number,
      within(tile).getByRole('heading', { level: 3 }),
      within(tile).getByText(tiles[index].description),
    ].map((element) => element.getBoundingClientRect());
    for (const box of boxes) await expect(box.height).toBeGreaterThan(0);
    const [discBox, numberBox, labelBox, descriptionBox] = boxes;
    await expect(discBox.bottom).toBeLessThanOrEqual(numberBox.top);
    await expect(numberBox.bottom).toBeLessThanOrEqual(labelBox.top);
    await expect(labelBox.bottom).toBeLessThanOrEqual(descriptionBox.top);
  }
};

/**
 * THE INTRO (`Counting`'s decorator, the DoctorCourses `withIntro` recipe):
 * 81rem of page above the band, ~150 % of the laptop's 864px, standing in for
 * the doctor's opener, profile and courses. The tiles therefore sit below the
 * fold at mount, and the first intersection the island can see is the one the
 * play's scroll causes. REM, not `vh`: a full-page capture may lay the page
 * out against a viewport as tall as itself, and a `vh` intro would grow with
 * it (DoctorCourses' header).
 */
const withIntro: Decorator = (Story) => (
  <>
    <div style={{ height: '81rem' }} />
    <Story />
  </>
);

/** Instant, so no smooth-scroll setting stretches a play (DoctorCourses). */
const jumpTo = (top: number): void => {
  window.scrollTo({ top, behavior: 'instant' });
};

/**
 * THE ARRANGEMENT CONTRACT (D30, D21), DERIVED from the measured list — the
 * box every `@`-variant here is read against is ui/Container's column, and
 * the list is exactly that wide (no padding between them). FRACTIONAL widths,
 * never clientWidth. Four columns from 48rem, two from 28rem, one below:
 * tiles of one row share a top (within 1px) and sit left to right without
 * overlapping; each row starts at or under the previous row's bottom; in one
 * column every tile is on the list's left edge and as wide as the list.
 */
const expectArrangement = async (
  band: HTMLElement,
): Promise<'four' | 'two' | 'one'> => {
  const list = within(band).getByRole('list').getBoundingClientRect();
  const boxes = tilesOf(band).map((tile) => tile.getBoundingClientRect());

  for (const box of boxes) {
    await expect(box.width).toBeGreaterThan(0);
    await expect(box.height).toBeGreaterThan(0);
  }

  const columns =
    list.width >= stepPx(48) ? 4 : list.width >= stepPx(28) ? 2 : 1;

  for (const [index, box] of boxes.entries()) {
    const column = index % columns;
    if (column > 0) {
      const left = boxes[index - 1];
      await expect(Math.abs(box.top - left.top)).toBeLessThanOrEqual(1);
      await expect(box.left).toBeGreaterThanOrEqual(left.right - 1);
    } else if (index > 0) {
      const previousRow = boxes.slice(index - columns, index);
      const bottom = Math.max(...previousRow.map((b) => b.bottom));
      await expect(box.top).toBeGreaterThanOrEqual(bottom - 1);
      await expect(Math.abs(box.left - list.left)).toBeLessThanOrEqual(1);
    }
    if (columns === 1) {
      await expect(Math.abs(box.left - list.left)).toBeLessThanOrEqual(1);
      await expect(Math.abs(box.width - list.width)).toBeLessThanOrEqual(1);
    }
  }
  return columns === 4 ? 'four' : columns === 2 ? 'two' : 'one';
};

/**
 * THE PIN IS NOT VACUOUS (the DoctorCourses guard): below 28rem of WINDOW the
 * column is narrower still, so one column is the only possibility; from 64rem
 * of window the column (the window less two gutters of at most 10vw) is past
 * 48rem, so four is the only possibility. Conditioned on the live window, so
 * a Playwright project photographing the story at another width runs it
 * without a false failure.
 */
const expectBranch = async (
  branch: 'four' | 'two' | 'one',
  pinned: 'four' | 'one',
): Promise<void> => {
  if (pinned === 'one' && window.innerWidth < stepPx(28)) {
    await expect(branch).toBe('one');
  }
  if (pinned === 'four' && window.innerWidth >= stepPx(64)) {
    await expect(branch).toBe('four');
  }
};

const meta = {
  title: 'Sections/DoctorStats',
  component: DoctorStats,
  parameters: { layout: 'fullscreen' },
  args: {
    eyebrow: EYEBROW,
    title: TITLE,
    lead: LEAD,
    tiles: TILES,
    format: formatFor('ro'),
    atLeast: AT_LEAST,
  },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono micro-label over the title, finished and already translated (§8.1) — authored in SENTENCE case, because the uppercase is ui/Eyebrow’s CSS',
    },
    title: {
      control: 'text',
      description:
        'The band’s real <h2> and, through aria-labelledby, the region’s accessible name',
    },
    lead: {
      control: 'text',
      description: 'One sentence under the title, centred on its own <p>',
    },
    tiles: {
      control: false,
      description:
        'The tiles, in the page’s order: `id` (the list key) · `icon` (a glyph element, painted at 3rem in the CTA green inside a white disc) · `value` (the FINAL integer — the static HTML prints it, the island counts up to it) · `suffix` ("+", or absent for an exact count) · `label` (the <h3>) · `description` (one sentence). One column below the 28rem container step, two to 48rem, four from there',
    },
    format: {
      control: false,
      description:
        'The page’s `Intl.NumberFormat(locale).format` (§8.3). The band never formats: it calls this ON THE SERVER for the final value and for every step of the count, and hands the island finished strings (a function cannot cross into a client island)',
    },
    atLeast: {
      control: 'text',
      description:
        'The word a screen reader hears for a tile’s „+”, finished and already translated (§8.1): the page’s `team.doctor.stats.atLeast` key, „peste” · “over” · „über” · « plus de » · « oltre ». The band puts it BEFORE the formatted final value in the sr-only twin of every tile with a suffix („peste 3.000”), ON THE SERVER, while the screen keeps showing „3.000+”; a tile without a suffix is spoken as its number alone. It names the one suffix the data allows („+”, at least): a second suffix kind would need a second word',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> through sections/TintedBand (§6.4/§6.8). The band owns its ground, gutter and vertical rhythm; the page owns the space BETWEEN bands',
    },
  },
} satisfies Meta<typeof DoctorStats>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABELS = TILES.map((tile) => tile.label);

/**
 * THE EVERYDAY BAND — Romanian, at the laptop width, where the reference's
 * shape reads as intended: the lilac ground fading in, „În cifre" over
 * „Experiență confirmată în timp" and the lead, all centred, then four tiles on
 * one row — a green line icon in a white disc, the number, the label, the
 * sentence. What to look at: the four discs level, each number centred over
 * its label, and the numbers COUNTING UP once the row is half on screen (the
 * workbench shows the count; the visual net photographs the final values,
 * under reduced motion).
 *
 * **1536 · 320 (`stress-320`):** at the stress width the same markup is ONE
 * column, one tile above the other, 18px prose wrapping in a 256px column and
 * nothing scrolling sideways. The play reads back what a picture cannot: the
 * outline, the SPOKEN finals in the screen reader's twins („peste 3.000", the
 * page's word and never the sign, round 2s), the still branch
 * when the machine asks for reduced motion, every number final within the
 * budget, the painted order (the number above its <h3>, which follows it in
 * the DOM) and the arrangement derived from the measured column. The count
 * itself is watched in `Counting` (the header says why).
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expect(canvas.getByText(EYEBROW)).toBeVisible();
    await expectOutline(band, TITLE, LABELS, RO_SPOKEN);
    if (reducedMotion()) {
      await expectStill(numbersOf(band)[0].visible, RO_FINALS[0]);
    }
    await expectFinalWithinBudget(band, RO_FINALS, RO_SPOKEN);
    await expectPaintOrder(band, TILES);
    await expectBranch(await expectArrangement(band), 'four');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE PHONE — the owner's adaptability rule made visible (D21): at 390 the
 * column is 312px, far short of `@md`, so the four tiles stand one above the
 * other, each centred in the column. The play pins the one-column geometry
 * and the painted order inside each tile (the number above its <h3>); the
 * tiles below the fold keep their final values until they scroll in.
 */
export const Stacked: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expectOutline(band, TITLE, LABELS, RO_SPOKEN);
    await expectFinalWithinBudget(band, RO_FINALS, RO_SPOKEN);
    await expectPaintOrder(band, TILES);
    await expectBranch(await expectArrangement(band), 'one');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width
 * carrying „Jahre Erfahrung" on the 20px title step and the interventions
 * sentence, the longest of the four, beneath „In Zahlen" / „Über die Jahre
 * bestätigte Erfahrung" (DRAFTED, §15.17; round 2s's shipped copy). The numbers go through the German
 * formatter — „3.000" like the Romanian — and the twins say „über 3.000".
 *
 * `lang="de"` rides the native prop spread onto the BAND and inherits to every
 * child: `hyphens: auto` (§15.14) picks the German dictionary for the prose,
 * while the labels keep `hyphens-none` and break only between words.
 *
 * **390 · 320 (`stress-320`):** one column at both widths (the play pins it),
 * nothing sideways.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: 'In Zahlen',
    title: 'Über die Jahre bestätigte Erfahrung',
    lead: 'Die Zahlen unten sagen in Kürze, wie wir arbeiten: sorgfältig, mit moderner Technik und mit echter Aufmerksamkeit für jeden Patienten.',
    tiles: GERMAN_TILES,
    format: formatFor('de'),
    atLeast: GERMAN_AT_LEAST,
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const title = 'Über die Jahre bestätigte Erfahrung';
    const band = canvas.getByRole('region', { name: title });

    await expect(band).toHaveAttribute('lang', 'de');
    await expect(canvas.getByText('In Zahlen')).toBeVisible();
    await expectOutline(
      band,
      title,
      GERMAN_TILES.map((tile) => tile.label),
      DE_SPOKEN,
    );
    await expectFinalWithinBudget(band, DE_FINALS, DE_SPOKEN);
    await expectBranch(await expectArrangement(band), 'one');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * because the toolbar transforms message files and this band reads none.
 * EVERY string is transformed (the PSEUDO fixture's note): the expanded h2
 * and the long lead absorb the growth by WRAPPING in a 312px — then 256px —
 * column, and the padding runs are the stress: a row of `·` is one
 * unbreakable token, the longest here the lead's 49 (70 before round 2s
 * shortened the lead — DoctorStats.tsx's NO TOKEN paragraph).
 *
 * **390 · 320 (`stress-320`):** one column at both, nothing sideways.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: PSEUDO.eyebrow,
    title: PSEUDO.title,
    lead: PSEUDO.lead,
    tiles: PSEUDO.tiles,
    atLeast: PSEUDO.atLeast,
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: PSEUDO.title });

    await expect(canvas.getByText(PSEUDO.eyebrow)).toBeVisible();
    await expectOutline(
      band,
      PSEUDO.title,
      PSEUDO.tiles.map((tile) => tile.label),
      PSEUDO_SPOKEN,
    );
    await expectFinalWithinBudget(band, RO_FINALS, PSEUDO_SPOKEN);
    await expectBranch(await expectArrangement(band), 'one');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE COUNT, WATCHED FROM ITS FIRST FRAME — a play-only twin of `Default`
 * (G2-R2 tier 2, react F3; the DoctorCourses `Current` idiom). In `Default`
 * the first tile is on screen at mount, so its count starts before any play
 * can watch it; here an 81rem intro stands above the band (`withIntro`), the
 * tiles sit below the fold at mount, and the island's first intersection can
 * only be the one the play's `scrollIntoView` causes. The play asserts that
 * premise first (the page at its top, the first number below the fold and
 * still reading its final value two frames later: nothing is counting), then
 * scrolls the number to the middle of the window and branches on the
 * machine's own preference:
 *   · motion allowed (the Vitest runner's Chromium) — sampled every frame
 *     from the scroll on, the number LEAVES its final value, climbs without
 *     ever falling and lands back on it within the budget, while the twin
 *     says „peste 6" on every one of those frames (round 2s);
 *   · reduced motion — the scrolled-in number stays final: nothing moves.
 * Every number is final within the budget either way.
 *
 * 'no-visual': a photograph of it would be the intro's blank 81rem above a
 * band `Default` already pictures, or a count caught mid-flight once scrolled;
 * its play and its per-story axe run in the Vitest storybook project. It
 * starts at the top of the page and puts the scroll back afterwards
 * (`beforeEach`), because the runner renders stories one after another in one
 * document (DoctorCourses' header).
 */
export const Counting: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  decorators: [withIntro],
  beforeEach: () => {
    jumpTo(0);
    return () => jumpTo(0);
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });
    const [first] = numbersOf(band);

    // THE PREMISE, asserted rather than assumed: below the fold at mount, so
    // the island has seen no intersection, and nothing is counting.
    await expect(window.scrollY).toBe(0);
    await expect(first.visible.getBoundingClientRect().top).toBeGreaterThan(
      window.innerHeight,
    );
    await nextFrame();
    await nextFrame();
    await expect(first.visible.textContent).toBe(RO_FINALS[0]);
    await expect(first.twin.textContent).toBe(RO_SPOKEN[0]);

    // THE FIRST INTERSECTION — the play's own; sampling starts in the same
    // task, before the observer can report it.
    first.visible.scrollIntoView({ block: 'center' });
    if (reducedMotion()) {
      await expectStill(first.visible, RO_FINALS[0]);
    } else {
      await expectCount(first, RO_FINALS[0], RO_SPOKEN[0]);
    }
    await expectFinalWithinBudget(band, RO_FINALS, RO_SPOKEN);
    await expectOutline(band, TITLE, LABELS, RO_SPOKEN);
  },
};
