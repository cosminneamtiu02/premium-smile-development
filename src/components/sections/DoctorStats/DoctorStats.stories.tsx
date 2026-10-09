import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { People } from '@/assets/glyphs/People';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import { DoctorStats, type DoctorStatTile } from './DoctorStats';

// EIGHT stories, and the count is the honest one: the everyday band at the
// width where the four tiles stand on one row, the phone arrangement with one
// tile above the other, the two expansion stresses — and `Counting`, a
// play-only twin of the everyday band that watches the count from its first
// frame (G2-R2 tier 2, react F3), tagged 'no-visual' so it names no baseline —
// then, since 2026-10-01, THE SECOND PAGE in three frames (`PageGround`,
// `PageGroundStacked`, `PageGroundGerman`; the header's own paragraph below).
// The export NAMES of the photographed seven are load-bearing — each one names
// a baseline file (`sections-doctorstats--default`,
// `sections-doctorstats--stacked`, …), so renaming or adding a photographed
// export re-records pictures; the first four ARE the band's contribution to the
// round-2f visual manifest (D30), which `Counting` leaves unchanged, and the
// three `PageGround*` frames are the 2026-10-01 lane's. The `Sections/*` title
// prefix routes every photographed one to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to the four whose layout has something to say there (a
// 288px column of 18px prose — 256 before 2026-10-09's phone gutter — German
// labels in it, a 40%-expanded lead, the Home shape's three tiles one above
// the other).
//
// ── THE SECOND PAGE — HOME AND THE TEAM PAGE (owner, 2026-10-01, verbatim:
// "i want it on home page too with just 3 components. experience, patients
// and nr of procedures. i want it without that gradient lilla background and
// to haave : [the eyebrow and the title] left alligned as other headings nad
// eyebrows on main page and without this: [the lead] so dorp that part"; the
// same band then closed the Team page's staff). The three `PageGround*`
// stories render exactly that call — `ground="page"`, `align="start"`, NO
// lead, and `scaled` since 2026-10-02 (the next paragraph) — over THREE
// tiles: this file's four without the courses tile, the drawings and the
// order of lib/team's `clinicStats` (the pages pass the real rows; a dumb
// band's workbench owes the data list nothing, the demo-copy paragraph at the
// end). Their plays read off the ENGINE what the suite can only read off the
// tokens: the eyebrow and the <h2> standing on the band column's left edge
// (the Container's, or past THE BAND SCALE's cap the cap's, centred in it),
// the section painted in the page ground and nothing tinted inside it, the
// three tiles in one row from the container's `@xl` (all three across on the
// tablet, the narrowest named width that holds them) and one above the other
// below it, every label whole. And every frame of the band, both grounds,
// paints its glyphs LILAC (the owner, the same day: "paint it's svgs lilla"):
// `expectLilacGlyphs` compares each drawing's computed colour with the
// decorative role's own token, resolved by the engine and never typed here.
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — DoctorStats.tsx's
// paragraph of that name). The three `PageGround*` stories model Home and the
// Team page, so they pass `scaled` (`HOME_ARGS`); the four tint stories and
// `Counting` model the doctor page and do not. `expectBandScale` reads — like
// the doctors band's own `expectScale` — the column, the pointer and the
// engine the play runs in, never the pinned window, and asserts whichever side
// it is on: inside the scale (a `scaled` band, a fine pointer, an engine that
// registers custom properties, a column of max(56rem, 896px)) the opener in
// the doctors band's design pixel, s = min(column, 96rem) / 1106, and every
// tile at 9/8 of it; anywhere else every size the theme's, in rem. In the
// Vitest storybook project the pointer is Chromium's fine one, so
// `PageGround`'s laptop pin asserts the scale (and `expectScaled` that it was
// not skipped), `Default`'s the doctor page's unscaled band at the same width,
// and the phone and tablet pins that `scaled` changes nothing there. In the
// pixel net the `PageGround*` frames at 1536 are drawn in the scale; every 390
// and 320 frame, and every tint frame, is as it was.
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
// („peste 3.000") off the twin laid over the digits.

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
 *  longest locale's words in a 288px column are the case this frame exists
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

/** THE SECOND PAGE's three (the header's own paragraph): experience, patients,
 *  procedures — the four above without the courses tile, in lib/team's
 *  `clinicStats` order. */
const THREE_TILES = [
  TILES[0],
  TILES[1],
  TILES[3],
] as const satisfies readonly DoctorStatTile[];

/** …and the same three in German, for the tablet's narrowest three-across
 *  tiles (~173px): „Jahre Erfahrung" is the longest label they carry. */
const GERMAN_THREE_TILES = [
  GERMAN_TILES[0],
  GERMAN_TILES[1],
  GERMAN_TILES[3],
] as const satisfies readonly DoctorStatTile[];

/** The German opener — `team.doctor.stats` (DRAFTED, §15.17): the eyebrow and
 *  the title `GermanLongest` and `PageGroundGerman` both print, and the lead
 *  only the first does (the second shows Home's band, which has none). */
const GERMAN_EYEBROW = 'In Zahlen';
const GERMAN_TITLE = 'Über die Jahre bestätigte Erfahrung';
const GERMAN_LEAD =
  'Die Zahlen unten sagen in Kürze, wie wir arbeiten: sorgfältig, mit moderner Technik und mit echter Aufmerksamkeit für jeden Patienten.';

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

/** The SECOND PAGE's three, seen and heard — the four above without the
 *  courses tile's exact count, so every one is an "at least". */
const RO_THREE_FINALS = ['6+', '3.000+', '1.000+'];
const DE_THREE_FINALS = ['6+', '3.000+', '1.000+'];
const RO_THREE_SPOKEN = ['peste 6', 'peste 3.000', 'peste 1.000'];
const DE_THREE_SPOKEN = ['über 6', 'über 3.000', 'über 1.000'];

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
 * Each tile's number — the <p>, its visible (aria-hidden) span and its twin —
 * found by what it SAYS and never by its index among the tile's children,
 * because the DOM order is not the painted one (G2-R2 tier 2, a11y F1): the
 * twin is the tile's one `data-spoken` text and always holds a digit (the
 * SPOKEN form since round 2s, „peste 3.000": the word, then the number), the
 * visible span is the number's one aria-hidden text holding a digit
 * (mid-count too: "0+" is a digit), the number <p> is their one paragraph
 * ancestor (the island's own box sits between since 2026-10-01, when the twin
 * moved from `sr-only` onto the digits — StatNumber.tsx's THE TWIN). The
 * count is read off `visible`; what is heard, off `twin`.
 */
const numbersOf = (band: HTMLElement) =>
  tilesOf(band).map((tile) => {
    const twin = within(tile).getByText(/\d/, { selector: '[data-spoken]' });
    const number = twin.closest('p') as HTMLElement;
    const visible = within(number).getByText(/\d/, {
      selector: '[aria-hidden="true"]',
    });
    return { number, visible, twin };
  });

/**
 * THE TWIN LIES ON THE DIGITS (the a11y review of 2026-10-01): what a screen
 * reader's cursor outlines, and what VoiceOver finds under a finger, is the
 * twin's box — so in every tile it must be the visible number's box, to the
 * pixel, and never painted. A picture cannot show this: the twin is invisible
 * by design, so only a play can pin it.
 */
const expectTwinsOnTheDigits = async (band: HTMLElement): Promise<void> => {
  for (const { visible, twin } of numbersOf(band)) {
    // The twin IS the island's box — one line tall — and that box sits on the
    // digits: the same left edge and width, and the same vertical CENTRE (the
    // line spreads its leading evenly above and below the glyphs' own box,
    // which can be a few px taller than the line, so edges differ, centres
    // never do).
    const box = (twin.parentElement as HTMLElement).getBoundingClientRect();
    const seen = visible.getBoundingClientRect();
    const heard = twin.getBoundingClientRect();
    await expect(seen.width).toBeGreaterThan(0);
    for (const side of ['left', 'top', 'width', 'height'] as const) {
      await expect(Math.abs(heard[side] - box[side])).toBeLessThanOrEqual(1);
    }
    await expect(Math.abs(heard.left - seen.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(heard.width - seen.width)).toBeLessThanOrEqual(1);
    const centre = (rect: DOMRect): number => (rect.top + rect.bottom) / 2;
    await expect(Math.abs(centre(heard) - centre(seen))).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(twin).opacity).toBe('0');
  }
};

/** The facts a picture cannot show: a named region, its one <h2>, one <h3>
 *  per tile in order, and the SPOKEN finals in the twins from the
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
 * How many tiles one row holds, by COUNT and by the measured column —
 * DoctorStats.tsx's `rowsFor`, read back (its STEPS paragraph): three tiles
 * all across from `@xl` (36rem) and one column below it, never two and one;
 * any other count four from `@3xl` (48rem), two from `@md` (28rem), one below.
 */
const columnsFor = (count: number, width: number): 4 | 3 | 2 | 1 => {
  if (count === 3) return width >= stepPx(36) ? 3 : 1;
  return width >= stepPx(48) ? 4 : width >= stepPx(28) ? 2 : 1;
};

type Branch = 'four' | 'three' | 'two' | 'one';
const BRANCH = { 4: 'four', 3: 'three', 2: 'two', 1: 'one' } as const;

/**
 * THE ARRANGEMENT CONTRACT (D30, D21), DERIVED from the measured list — the
 * box every `@`-variant here is read against is ui/Container's column, and
 * the list is exactly that wide (no padding between them) — or, in THE BAND
 * SCALE past a 96rem column, the cap's 96rem, which is past every step, so
 * the branch read off it is the column's all the same. FRACTIONAL widths,
 * never clientWidth. The row width is `columnsFor`'s: four, three, two or one
 * — tiles of one row share a top (within 1px) and sit left to right without
 * overlapping; each row starts at or under the previous row's bottom; in one
 * column every tile is on the list's left edge and as wide as the list.
 */
const expectArrangement = async (band: HTMLElement): Promise<Branch> => {
  const list = within(band).getByRole('list').getBoundingClientRect();
  const boxes = tilesOf(band).map((tile) => tile.getBoundingClientRect());

  for (const box of boxes) {
    await expect(box.width).toBeGreaterThan(0);
    await expect(box.height).toBeGreaterThan(0);
  }

  const columns = columnsFor(boxes.length, list.width);

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
  return BRANCH[columns];
};

/**
 * THE PIN IS NOT VACUOUS (the DoctorCourses guard): below 28rem of WINDOW the
 * column is narrower still, so one column is the only possibility; from 64rem
 * of window the column (the window less two gutters of at most 10vw) is past
 * 48rem, so four is the only possibility; and for THREE tiles, from 48rem of
 * window the column is past 36rem — 80 % of the window less a classic
 * scrollbar is 38.4rem less 17px at most — so all three across is the only
 * possibility (the tablet's 768px is exactly that threshold). Conditioned on
 * the live window, so a Playwright project photographing the story at another
 * width runs it without a false failure.
 */
const expectBranch = async (
  branch: Branch,
  pinned: 'four' | 'three' | 'one',
): Promise<void> => {
  if (pinned === 'one' && window.innerWidth < stepPx(28)) {
    await expect(branch).toBe('one');
  }
  if (pinned === 'four' && window.innerWidth >= stepPx(64)) {
    await expect(branch).toBe('four');
  }
  if (pinned === 'three' && window.innerWidth >= stepPx(48)) {
    await expect(branch).toBe('three');
  }
};

/**
 * A colour TOKEN as the engine resolves it, in the very serialization
 * getComputedStyle gives every painted colour (`rgb(…)`) — never a hex typed
 * here, so §15.1's still-open hue confirm moves the expectation with the
 * token. The probe stands OUTSIDE the band, on the body: a token the
 * stylesheet failed to declare would leave it the body's ink, never the
 * band's own colour, and the check could not pass by inheriting what it
 * measures. A token missing from :root is named rather than compared.
 */
const tokenColour = (name: string): string => {
  const declared = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (declared === '') {
    throw new Error(`DoctorStats story: ${name} is not declared on :root`);
  }
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

/**
 * THE GLYPHS ARE LILAC (owner, 2026-10-01: "paint it's svgs lilla"): every
 * tile's drawing computes to §15.1's graphics role, `accent-decorative` — the
 * disc's `color`, which the glyph's `stroke="currentColor"` paints with. Both
 * read off the <svg>, both against the token, on whichever ground the band
 * stands.
 */
const expectLilacGlyphs = async (band: HTMLElement): Promise<void> => {
  const lilac = tokenColour('--color-accent-decorative');
  const tiles = tilesOf(band);
  await expect(tiles.length).toBeGreaterThan(0);
  for (const tile of tiles) {
    const glyph = tile.querySelector('svg');
    if (!glyph) throw new Error('DoctorStats story: a tile lost its glyph');
    await expect(getComputedStyle(glyph).color).toBe(lilac);
    await expect(getComputedStyle(glyph).stroke).toBe(lilac);
  }
};

/** The nearest size container above an element — ui/Container's column, the
 *  box every `@`-step of the band reads (the Pages/Team `columnOf`). */
const columnOf = (element: Element): HTMLElement => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node;
  }
  throw new Error('DoctorStats story: no size container above the element');
};

/**
 * THE PAGE GROUND, read off the engine: the <section> paints the page's own
 * colour (`--color-page`, resolved, never typed), and NOTHING inside it is
 * tinted — its one child is ui/Container (a size container, no background of
 * its own), no fade box stands above or below it, and the rhythm box inside
 * paints nothing either. TintedBand would have put three boxes there, two of
 * them aria-hidden gradients and the middle one in the lilac.
 */
const expectPageGround = async (band: HTMLElement): Promise<void> => {
  const transparent = 'rgba(0, 0, 0, 0)';
  await expect(getComputedStyle(band).backgroundColor).toBe(
    tokenColour('--color-page'),
  );
  await expect(getComputedStyle(band).backgroundImage).toBe('none');
  await expect(band.children).toHaveLength(1);
  const column = band.firstElementChild as HTMLElement;
  await expect(column).not.toHaveAttribute('aria-hidden');
  await expect(getComputedStyle(column).containerType).toBe('inline-size');
  await expect(getComputedStyle(column).backgroundColor).toBe(transparent);
  const rhythm = column.firstElementChild as HTMLElement;
  await expect(getComputedStyle(rhythm).backgroundColor).toBe(transparent);
  await expect(getComputedStyle(rhythm).backgroundImage).toBe('none');
};

/**
 * THE REAL FACE BEFORE ANY TEXT IS MEASURED (the CI failure of 2026-10-01,
 * Sections/Hero's `loadFace`, DoctorIntro's recipe): Storybook's faces are
 * `font-display: block`, so a play that measures right after the render may
 * lay text out in the FALLBACK serif, whose words are wider — and whether the
 * real face has arrived depends on which stories ran before in the same
 * browser. `load()` fetches the exact face the element asks for.
 */
const loadFace = async (element: HTMLElement): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/**
 * THE OPENER AT THE START (owner, 2026-10-01: "left alligned as other
 * headings nad eyebrows on main page"): the eyebrow's and the <h2>'s left
 * edges stand on the band's own column — its rhythm box — within 1px, and
 * both read their lines from the start. That column is the Container's, or,
 * in THE BAND SCALE past its 96rem cap, the cap's, CENTRED in it, which the
 * check asserts too: the one left edge every scaled band on the page shares
 * (the owner, 2026-10-02: "same offset always"). Font-independent when it
 * passes — a start-aligned box begins at its column whatever its text
 * measures — and not vacuous: a centred opener on a laptop column puts both a
 * few hundred pixels in. The real faces load first all the same (`loadFace`):
 * how far in a centred box would sit IS a text measure, and a failure should
 * report the shipped face's number. (At a phone's column a wrapping title
 * fills it either way; the `textAlign` reads are what hold there.)
 */
const expectStartAligned = async (
  band: HTMLElement,
  eyebrow: string,
): Promise<void> => {
  const heading = within(band).getByRole('heading', { level: 2 });
  const kicker = within(band).getByText(eyebrow);
  await loadFace(kicker);
  await loadFace(heading);
  const container = columnOf(heading);
  const rhythm = container.firstElementChild;
  if (!(rhythm instanceof HTMLElement)) {
    throw new Error('DoctorStats story: the column lost its rhythm box');
  }
  const [outer, column] = [container, rhythm].map((box) =>
    box.getBoundingClientRect(),
  );
  await expect(
    Math.abs(column.left - outer.left - (outer.right - column.right)),
  ).toBeLessThanOrEqual(1);
  for (const element of [kicker, heading]) {
    await expect(
      Math.abs(element.getBoundingClientRect().left - column.left),
    ).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(element).textAlign).toBe('start');
  }
};

/**
 * NO LEAD (owner, 2026-10-01: "without this … so dorp that part"): the opener
 * box holds SectionHeading alone — its one <p> is the eyebrow — and the lead
 * sentence is nowhere in the band.
 */
const expectNoLead = async (band: HTMLElement, lead: string): Promise<void> => {
  const opener = within(band).getByRole('heading', { level: 2 }).parentElement
    ?.parentElement as HTMLElement;
  await expect(opener.children).toHaveLength(1);
  await expect(opener.querySelectorAll(':scope > p')).toHaveLength(0);
  await expect(within(band).queryByText(lead)).toBeNull();
};

/**
 * EVERY LABEL WHOLE (the header's TILES paragraph: a title breaks between
 * words, never inside one — `hyphens-none`). Read off the engine in the real
 * face: each <h3> computes `hyphens: none`, each WORD of it lays out as ONE
 * line fragment (a word cut at a syllable is two), and no label leaves its
 * TILE. That last read is against the <li>, never the label's own box: the
 * tile centres its children as boxes, so a word wider than the tile widens
 * the <h3> to fit and spills over both of the tile's edges — the label's own
 * scroll width would never notice (measured, with a 36-letter German
 * compound in this frame). German on the tablet's ~173–178px three-across
 * tiles is the frame it exists for.
 */
const expectLabelsWhole = async (band: HTMLElement): Promise<void> => {
  const labels = within(band).getAllByRole('heading', { level: 3 });
  await expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    await loadFace(label);
    await expect(getComputedStyle(label).hyphens).toBe('none');
    const tile = label.closest('li');
    if (!tile) throw new Error('DoctorStats story: a label outside its tile');
    const [box, room] = [label, tile].map((element) =>
      element.getBoundingClientRect(),
    );
    await expect(box.left).toBeGreaterThanOrEqual(room.left - 0.5);
    await expect(box.right).toBeLessThanOrEqual(room.right + 0.5);
    const text = label.firstChild;
    if (!(text instanceof Text)) {
      throw new Error('DoctorStats story: a label is not one text node');
    }
    for (const word of text.data.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(text, word.index);
      range.setEnd(text, word.index + word[0].length);
      const fragments = [...range.getClientRects()].filter(
        (rect) => rect.width > 0,
      );
      await expect(fragments, `„${word[0]}" in „${text.data}"`).toHaveLength(1);
    }
  }
};

/** THE D21 RIDER, spelled for the stacked frame: one tile above the other,
 *  every top strictly under the one before. Asked only of the one-column
 *  branch — a wider window, which Playwright may give the story, puts the
 *  three in a row. */
const expectStackedTops = async (
  band: HTMLElement,
  branch: Branch,
): Promise<void> => {
  if (branch !== 'one') return;
  const tops = tilesOf(band).map((tile) => tile.getBoundingClientRect().top);
  for (let index = 1; index < tops.length; index += 1) {
    await expect(tops[index]).toBeGreaterThan(tops[index - 1]);
  }
};

/** THE BAND SCALE's numbers (DoctorStats.tsx's paragraph of that name;
 *  ui/Container's; born as sections/DoctorShowcase's D10), written out as the
 *  doctors band's own play writes them: the REFERENCE column, where a design
 *  pixel is a CSS pixel; the CAP in rem of the root (1536px at the default
 *  16px, a 1920 window's column); THE STEP's two halves, `@4xl`'s 56rem and
 *  the 896px floor. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** The scale's two GATES — globals.css's `scalable:` — read off the browser
 *  the play runs in: a fine primary pointer (a mouse or a trackpad), in an
 *  engine that registers custom properties (the relative colour syntax
 *  shipped with `@property`). */
const scaleGatesOpen = (): boolean =>
  window.matchMedia('(pointer: fine)').matches &&
  CSS.supports('color', 'rgb(from red r g b)');

/** The column from which the scale applies — max(56rem, 896px). */
const scaleStepPx = (): number => Math.max(stepPx(STEP_REM), STEP_FLOOR);

/**
 * THE BAND SCALE (2026-10-02, §15.32 — DoctorStats.tsx's paragraph), asserted
 * where the play finds itself, the doctors band's `expectScale` recipe: the
 * column read off ui/Container (the size container above the <h2>), the two
 * GATES off the browser, never the pinned window. Where the band is `scaled`,
 * the gates are open and the column is past the step, the opener draws in the
 * doctors band's design pixel, s = min(column, 96rem) / 1106 — its <h2>
 * 36 × s and its eyebrow 14 × s, the doctors band's own — the rhythm box is
 * the column capped at 96rem and centred in it, and every tile draws at 9/8
 * of s: its sentence 18 × s, HALF the <h2> (a doctor card's quote — the
 * owner's "1 to 1"), its label 22.5 × s, its number 40.5 × s, its disc
 * 126 × s with the glyph 54 × s; each within 0.05px. Anywhere else — the
 * doctor page's band, never `scaled`; every phone and tablet; a coarse
 * pointer — nothing is declared: both boxes' design pixel is the registered
 * 1px, the rhythm box is the column, and every size is the theme's, in rem of
 * the root (the <h2> 30 or 36 by the column's `@md`, the eyebrow 14, the
 * sentence 16, the label 20, the number 36, the disc 112 and the glyph 48 at
 * the 16px root). No face to load: a computed font size and a fixed box do
 * not depend on which face has arrived. Returns whether the scale applied,
 * for a caller that pins it (`expectScaled`).
 */
const expectBandScale = async (
  band: HTMLElement,
  eyebrow: string,
  scaled: boolean,
): Promise<boolean> => {
  const heading = within(band).getByRole('heading', { level: 2 });
  const kicker = within(band).getByText(eyebrow);
  const list = within(band).getByRole('list');
  const container = columnOf(heading);
  const rhythm = container.firstElementChild;
  if (!(rhythm instanceof HTMLElement)) {
    throw new Error('DoctorStats story: the column lost its rhythm box');
  }
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
  const sizeOf = (element: Element): number =>
    parseFloat(getComputedStyle(element).fontSize);
  const pixelOf = (element: Element): string =>
    getComputedStyle(element).getPropertyValue('--scale-px').trim();
  // Each tile's five measured parts, reached by what they are: the disc as
  // the tile's aria-hidden child and its glyph inside it, the label by role,
  // the number by its twin (`numbersOf`), the sentence as the tile's last
  // child (the DOM order the suite pins).
  const numbers = numbersOf(band);
  const parts = tilesOf(band).map((tile, index) => {
    const disc = [...tile.children].find(
      (child) => child.getAttribute('aria-hidden') === 'true',
    );
    const glyph = disc?.querySelector('svg');
    const sentence = tile.lastElementChild;
    if (!disc || !glyph || !sentence) {
      throw new Error('DoctorStats story: a tile lost its disc or sentence');
    }
    return {
      disc: disc.getBoundingClientRect().width,
      glyph: glyph.getBoundingClientRect().width,
      label: sizeOf(within(tile).getByRole('heading', { level: 3 })),
      number: sizeOf(numbers[index].number),
      sentence: sizeOf(sentence),
    };
  });
  await expect(parts.length).toBeGreaterThan(0);

  const outer = container.getBoundingClientRect();
  const column = rhythm.getBoundingClientRect();
  const cap = stepPx(CAP_REM);
  const applies = scaled && scaleGatesOpen() && outer.width >= scaleStepPx();

  // THE COLUMN — the Container's, or the cap's centred in it.
  await near(
    column.width,
    applies ? Math.min(outer.width, cap) : outer.width,
    'the band’s column',
    0.5,
  );
  await near(
    column.left - outer.left,
    outer.right - column.right,
    'the band’s centring',
    1,
  );

  if (applies) {
    const s = Math.min(outer.width, cap) / REFERENCE;
    const title = sizeOf(heading);
    await near(parseFloat(pixelOf(rhythm)), s, 'the band’s pixel', 0.0001);
    await near(
      parseFloat(pixelOf(list)),
      (s * 9) / 8,
      'the tiles’ pixel',
      0.0001,
    );
    await near(title, 36 * s, 'the <h2>');
    await near(sizeOf(kicker), 14 * s, 'the eyebrow');
    for (const part of parts) {
      await near(part.sentence, 18 * s, 'a tile’s sentence');
      await near(part.sentence, title / 2, 'a tile’s sentence, half the <h2>');
      await near(part.label, 22.5 * s, 'a tile’s label');
      await near(part.number, 40.5 * s, 'a tile’s number');
      await near(part.disc, 126 * s, 'a tile’s disc');
      await near(part.glyph, 54 * s, 'a tile’s glyph');
    }
    return true;
  }

  const rem = stepPx(1);
  await expect(pixelOf(rhythm)).toBe('1px');
  await expect(pixelOf(list)).toBe('1px');
  await near(
    sizeOf(heading),
    (outer.width >= stepPx(28) ? 2.25 : 1.875) * rem,
    'the <h2>, unscaled',
  );
  await near(sizeOf(kicker), 0.875 * rem, 'the eyebrow, unscaled');
  for (const part of parts) {
    await near(part.sentence, rem, 'a tile’s sentence, unscaled');
    await near(part.label, 1.25 * rem, 'a tile’s label, unscaled');
    await near(part.number, 2.25 * rem, 'a tile’s number, unscaled');
    await near(part.disc, 7 * rem, 'a tile’s disc, unscaled');
    await near(part.glyph, 3 * rem, 'a tile’s glyph, unscaled');
  }
  return false;
};

/**
 * THE SCALE IS NOT VACUOUS where the story is pinned to see it (the
 * `expectBranch` guard's reasoning, for THE BAND SCALE): under open gates, a
 * window whose column MUST be past the step — 80 % of it less 17px of classic
 * scrollbar at most, the gutter's 10vw governing every window from 600px up
 * to its 2000px cap (5vw on a phone since 2026-10-09's phone gutter, far
 * below any window this guard reads) and the column only wider beyond — must
 * have drawn the scale.
 * Conditioned on the live window and browser, so a Playwright project
 * photographing the story at a phone's width runs it without a false failure.
 */
const expectScaled = async (applied: boolean): Promise<void> => {
  if (scaleGatesOpen() && window.innerWidth >= (scaleStepPx() + 17) / 0.8) {
    await expect(applied).toBe(true);
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
      description:
        'One sentence under the title, on its own <p> — centred with the opener, start-aligned under a start-aligned one. OPTIONAL since 2026-10-01: Home and the Team page pass none, and an absent (or empty) lead renders no <p> at all',
    },
    ground: {
      control: 'inline-radio',
      options: ['tint', 'page'],
      description:
        'Where the band stands: `tint` (default) is sections/TintedBand, the doctor page’s lilac with its two fades; `page` is the plain page ground every other Home band stands on — a `bg-page` <section> around ui/Container (owner, 2026-10-01: "without that gradient lilla background")',
    },
    align: {
      control: 'inline-radio',
      options: ['center', 'start'],
      description:
        'How the opener lines up — sections/SectionHeading’s two answers: `center` (default, the doctor page) or `start` (Home and the Team page, "left alligned as other headings nad eyebrows on main page"). The tiles stay centred either way',
    },
    scaled: {
      control: 'boolean',
      description:
        'Draws the band in THE BAND SCALE (ui/Container’s paragraph of that name; §15.32): on a laptop or desktop column of max(56rem, 896px) the doctors band’s own design pixel, the column ÷ 1106, capped at a 96rem column and centred past it — so the eyebrow and the title are the doctors band’s size and stand on its left edge — and the tiles at 9/8 of it, so a tile’s sentence reads a doctor card’s quote size. Home and the Team page pass it; the doctor page does not (default false). Below the step, on a touch device and in an engine that cannot register custom properties it changes nothing',
    },
    tiles: {
      control: false,
      description:
        'The tiles, in the page’s order: `id` (the list key) · `icon` (a glyph element, painted at 3rem in the decorative lilac inside a white disc) · `value` (the FINAL integer — the static HTML prints it, the island counts up to it) · `suffix` ("+", or absent for an exact count) · `label` (the <h3>) · `description` (one sentence). One column below the 28rem container step, two to 48rem, four from there — and THREE tiles one column below 36rem, all three across from there',
    },
    format: {
      control: false,
      description:
        'The page’s `Intl.NumberFormat(locale).format` (§8.3). The band never formats: it calls this ON THE SERVER for the final value and for every step of the count, and hands the island finished strings (a function cannot cross into a client island)',
    },
    atLeast: {
      control: 'text',
      description:
        'The word a screen reader hears for a tile’s „+”, finished and already translated (§8.1): the page’s `team.doctor.stats.atLeast` key, „peste” · “over” · „über” · « plus de » · « oltre ». The band puts it BEFORE the formatted final value in the twin laid over the digits of every tile with a suffix („peste 3.000”), ON THE SERVER, while the screen keeps showing „3.000+”; a tile without a suffix is spoken as its number alone. It names the one suffix the data allows („+”, at least): a second suffix kind would need a second word',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> — through sections/TintedBand on the tint, directly on the page ground (§6.4/§6.8). The band owns its ground, gutter and vertical rhythm; the page owns the space BETWEEN bands',
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
 * one row — a lilac line icon in a white disc (the owner, 2026-10-01: "paint
 * it's svgs lilla"; the CTA green until then), the number, the label, the
 * sentence. What to look at: the four discs level, each number centred over
 * its label, and the numbers COUNTING UP once the row is half on screen (the
 * workbench shows the count; the visual net photographs the final values,
 * under reduced motion).
 *
 * **1536 · 320 (`stress-320`):** at the stress width the same markup is ONE
 * column, one tile above the other, 18px prose wrapping in a 288px column and
 * nothing scrolling sideways. The play reads back what a picture cannot: the
 * outline, the SPOKEN finals in the screen reader's twins („peste 3.000", the
 * page's word and never the sign, round 2s), the still branch
 * when the machine asks for reduced motion, every number final within the
 * budget, the painted order (the number above its <h3>, which follows it in
 * the DOM), the glyphs' lilac against the decorative role's own token and the
 * arrangement derived from the measured column — and, at the laptop width
 * where `PageGround` draws in THE BAND SCALE, that the doctor page's band does
 * NOT: never `scaled`, its sizes the theme's rem (`expectBandScale`). The
 * count itself is watched in `Counting` (the header says why).
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expect(canvas.getByText(EYEBROW)).toBeVisible();
    await expectOutline(band, TITLE, LABELS, RO_SPOKEN);
    await expectBandScale(band, EYEBROW, false);
    await expectLilacGlyphs(band);
    await expectTwinsOnTheDigits(band);
    // The title never splits a word (the a11y review of 2026-10-01): the
    // class rides SectionHeading's root and the <h2> inherits it, computed —
    // and its belt with it, a word too long for a line by itself still breaks.
    const titleStyle = getComputedStyle(
      within(band).getByRole('heading', { level: 2 }),
    );
    await expect(titleStyle.hyphens).toBe('none');
    await expect(titleStyle.overflowWrap).toBe('anywhere');
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
 * column is 351px, far short of `@md`, so the four tiles stand one above the
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
    eyebrow: GERMAN_EYEBROW,
    title: GERMAN_TITLE,
    lead: GERMAN_LEAD,
    tiles: GERMAN_TILES,
    format: formatFor('de'),
    atLeast: GERMAN_AT_LEAST,
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: GERMAN_TITLE });

    await expect(band).toHaveAttribute('lang', 'de');
    await expect(canvas.getByText(GERMAN_EYEBROW)).toBeVisible();
    await expectOutline(
      band,
      GERMAN_TITLE,
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
 * and the long lead absorb the growth by WRAPPING in a 351px — then 288px —
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

const THREE_LABELS = THREE_TILES.map((tile) => tile.label);

/**
 * THE SECOND PAGE'S CALL, prop for prop — what Home and the Team page pass
 * besides the words: the page ground, the opener at the start, NO lead, and,
 * since 2026-10-02, `scaled` (the header's BAND SCALE paragraph). The
 * `lead: undefined` takes the meta's Romanian lead back OUT, so the band
 * receives what those pages hand it: nothing (the header's own paragraph).
 */
const HOME_ARGS = {
  ground: 'page',
  align: 'start',
  lead: undefined,
  scaled: true,
  tiles: THREE_TILES,
} as const;

/**
 * THE SECOND PAGE — Home's band and the Team page's, at the laptop width
 * (owner, 2026-10-01): the same band on the PAGE ground, no lilac and no fade,
 * its eyebrow „În cifre" and its title at the column's start like every other
 * Home band's opener, NO lead under them, and three tiles in one row —
 * experience, patients, procedures — each a lilac drawing in a white disc
 * whose `line` ring is now its only edge (the white disc stands off the page
 * ground at 1.05:1, DoctorStats.tsx's DISC bullet). What to look at: the
 * opener on the column's left edge, the three tiles level and evenly spread,
 * nothing tinted anywhere. And since 2026-10-02 the band is `scaled`, like
 * every band on those two pages (the header's BAND SCALE paragraph): at this
 * laptop width it draws in the doctors band's design pixel — its eyebrow and
 * title the doctors band's size, a tile's sentence a doctor card's quote — so
 * the same frame at another laptop or desktop width is this one, larger or
 * smaller, in the same proportions.
 *
 * **1536 · 390 · 320 (`stress-320`):** below the container's `@xl` the three
 * stand one above the other (`PageGroundStacked` pins the phone), and below
 * the scale's step every size is the theme's. The play reads back what a
 * picture cannot: the outline, the absent lead, the page ground resolved from
 * its own token, the start alignment off the engine (on the band's centred
 * column, the scaled bands' one left edge), THE BAND SCALE — every size the
 * design pixel's multiple, and the scale not skipped at the laptop
 * (`expectScaled`) — the lilac glyphs, every number final within the budget,
 * the painted order, and the arrangement derived from the measured column —
 * one row of three wherever the window is 48rem or wider (`expectBranch`).
 */
export const PageGround: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: HOME_ARGS,
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expect(canvas.getByText(EYEBROW)).toBeVisible();
    await expectOutline(band, TITLE, THREE_LABELS, RO_THREE_SPOKEN);
    await expectNoLead(band, LEAD);
    await expectPageGround(band);
    await expectStartAligned(band, EYEBROW);
    await expectScaled(await expectBandScale(band, EYEBROW, true));
    await expectLilacGlyphs(band);
    await expectTwinsOnTheDigits(band);
    await expectFinalWithinBudget(band, RO_THREE_FINALS, RO_THREE_SPOKEN);
    await expectPaintOrder(band, THREE_TILES);
    await expectBranch(await expectArrangement(band), 'three');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE SECOND PAGE ON A PHONE — the owner's adaptability rule (D21): at 390
 * the column is 351px, far short of the container's `@xl` (36rem), so the
 * three tiles stand one above the other — every top strictly under the one
 * before, every tile as wide as the column, never two and one. The opener
 * stays at the start (a wrapping title fills the column; its lines still read
 * from the start), and nothing scrolls sideways. The band is `scaled`, as on
 * Home, and on the phone that changes nothing — the owner's "on phone and
 * tablet it looks perfect atm, so do not touch those": the play reads every
 * size back as the theme's (`expectBandScale`, its unscaled side).
 */
export const PageGroundStacked: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: HOME_ARGS,
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expectOutline(band, TITLE, THREE_LABELS, RO_THREE_SPOKEN);
    await expectNoLead(band, LEAD);
    await expectStartAligned(band, EYEBROW);
    await expectBandScale(band, EYEBROW, true);
    await expectFinalWithinBudget(band, RO_THREE_FINALS, RO_THREE_SPOKEN);
    await expectPaintOrder(band, THREE_TILES);
    const branch = await expectArrangement(band);
    await expectBranch(branch, 'one');
    await expectStackedTops(band, branch);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE SECOND PAGE IN GERMAN ON THE TABLET — the longest language (§8.4) at the
 * narrowest named width that holds the three in a row: the tablet's 614px
 * column gives each tile ~178px (~173 under a classic scrollbar), and „Jahre
 * Erfahrung" (DRAFTED, §15.17) on the 20px title step must break between its
 * words and never inside one (`hyphens-none`). The play loads the real face
 * first, then reads every label's words one line fragment each and no label
 * wider than its tile, the three in one row, the German opener at the start
 * with no lead, and nothing sideways. `lang="de"` rides the native prop spread
 * onto the section, as in `GermanLongest`, so the prose hyphenates with the
 * German dictionary while the labels opt out. `scaled` as on Home, and the
 * tablet's 614px column is under the scale's step: every size the theme's.
 *
 * **390 · 1536:** the Sections tier's two widths; at 390 the three stack and
 * the labels' check still holds — a whole word is whole in any column; at
 * 1536 the band draws in THE BAND SCALE, German labels at 22.5 design pixels
 * in tiles that grew with them.
 */
export const PageGroundGerman: Story = {
  globals: { locale: 'de', viewport: { value: 'tablet' } },
  args: {
    ...HOME_ARGS,
    eyebrow: GERMAN_EYEBROW,
    title: GERMAN_TITLE,
    tiles: GERMAN_THREE_TILES,
    format: formatFor('de'),
    atLeast: GERMAN_AT_LEAST,
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: GERMAN_TITLE });

    await expect(band).toHaveAttribute('lang', 'de');
    await expect(canvas.getByText(GERMAN_EYEBROW)).toBeVisible();
    await expectOutline(
      band,
      GERMAN_TITLE,
      GERMAN_THREE_TILES.map((tile) => tile.label),
      DE_THREE_SPOKEN,
    );
    await expectNoLead(band, GERMAN_LEAD);
    await expectPageGround(band);
    await expectStartAligned(band, GERMAN_EYEBROW);
    await expectBandScale(band, GERMAN_EYEBROW, true);
    await expectFinalWithinBudget(band, DE_THREE_FINALS, DE_THREE_SPOKEN);
    await expectLabelsWhole(band);
    await expectBranch(await expectArrangement(band), 'three');
    await expectNoSidewaysScroll(band);
  },
};
