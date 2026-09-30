import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorCourses } from '@/components/sections/DoctorCourses/DoctorCourses';
import {
  DoctorIntro,
  type DoctorIntroCredo,
} from '@/components/sections/DoctorIntro/DoctorIntro';
import { DoctorProfile } from '@/components/sections/DoctorProfile/DoctorProfile';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale, type Locale } from '@/i18n/locales';
import { coursesByYear, doctors, type Doctor } from '@/lib/team/team';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateDoctorPage } from '../populate';
import { toStatTiles } from './stat-tiles';

// Pages/Doctor — a real `/{locale}/team/{id}/` page as it ships: the opener
// with its credo card, the tinted „Despre" band beside the schedule card, the
// courses by year, the „în cifre" tiles and the map, at the six page-tier
// widths (§13: Pages/* → 320 · 390 · 768 · 1280 · 1536 · 1920,
// tests/visual/stories.spec.ts).
//
// ── WHY A STORY-LOCAL TWIN AND NOT THE PAGE ITSELF. ./page.tsx is an async
// Server Component: it awaits `getTranslations` and `getLocale` from
// next-intl/server, which no browser runner can execute — the same reason
// src/app/[locale]/shell.test.tsx composes the shell's shape instead of
// importing layout.tsx, and the same shape as Pages/Home and Pages/Services.
// So `DoctorPageBands` below renders the SAME markup through the isomorphic
// `useTranslations` + `useLocale`.
// What is NOT twinned is the mapping: both sides call the one
// `populateDoctorPage` from ../populate.ts with the real `doctors`, so the
// thing most likely to drift — which language, which person, which week,
// which years — cannot, because there is only one copy of it.
//
// ── THIS IS A KEEP-IN-SYNC PAIR (§4's sharing table), written down rather than
// assumed: the twin lives here, the original in ./page.tsx, and that file's
// header points back at this one. Both must render the same five bands in the
// same order (round 2's D18, extended by D33: DoctorIntro → DoctorProfile →
// DoctorCourses → DoctorStats → ClinicLocation), fed by the same populator and
// the same ./stat-tiles.tsx, with the same eleven `team.doctor.*` keys (D20,
// D32, D37) — the about title taking the doctor's name as its ICU argument on
// both sides. The plays pin exactly that from the outside, so a change on
// either side that the other does not follow turns this suite red instead of
// quietly photographing something the site no longer ships. The FUTURE SEAM
// page.tsx marks between the tiles and the map (D19, the doctor's blog
// articles) is marked here too: when that band lands, both files gain it in
// the same change, and the region count and the heading census below move
// with it.
//
// ── ONE DOCTOR, THE FIRST OF lib/team, and derived rather than named: this is
// a page SHAPE, reused for every person the owner adds (his dispatch: „this
// page as structure will be reused for more doctors"), so the story follows
// the list instead of pinning a demo id that a real roster will retire. What
// the picture is ABOUT is the structure — the cutout beside the name with the
// credo card under it, the prose beside the week on the tint, the years down
// the timeline, the tiles on the second tint, the map — not who is in it.
//
// ── THE OWNER'S ADAPTABILITY RULE, PLAY-PINNED (round 2's D21, 2026-09-25:
// "sections that are next to each other when in phone mode … must come one
// above the other"). The plays read FOUR arrangements — the picture beside
// the words, the „Despre" prose beside the schedule card, the stat tiles four
// on a row, and the timeline, which since D34 is one year per row down the
// left at every width and so votes by its column's width alone — and every
// side-by-side one flips below ui/Container's `@3xl` step (48rem of column, a
// ~960px window; the tiles fall to two per row, then one). Each band's suite
// already proves its own flip; what only the PAGE can prove is that the four
// flip TOGETHER, at one width, because all four stand in the same Container
// gutter. So the plays measure all four, each in the branch its OWN measured
// column puts it in (never the pinned width: the visual runner ignores the
// pin and renders these same plays at all six widths), and then assert the
// four branches agree. The pins make each branch non-vacuous in
// the Vitest runner, which DOES honour them: Romanian at the laptop width
// must have taken the beside branch, German at the smartphone width the
// stacked one — tops under bottoms and shared left edges, not only pixels.
//
// ── THE 404 BRANCH IS NOT A STORY. `populateDoctorPage` returns `undefined`
// for a slug nobody wears and the page answers with `notFound()`, which
// renders the localized 404 — a page that already has its own story
// (Pages/NotFound). Photographing it here would be the same picture twice,
// and `notFound()` is a Next control-flow throw the browser runner has no
// router to catch. What the branch gets instead is the assertion in
// ../populate.test.ts, where it is a return value rather than a redirect.
//
// ── TWO STORIES, RO + DE — the §13 page tier, and German earns its baseline
// here: „Fachrichtung Prothetik und Parodontologie" sits over the site's
// longest name, „Dr. Malea (Sabău) Oana Bianca", at a 72px serif;
// „Kurse und Spezialisierungen" and „Über Dr. Malea (Sabău) Oana Bianca" are
// h2s that must not syllable-break (SectionHeading's titles opt out of
// hyphenation) at 256px of column; the „Despre" paragraphs are built out of
// compounds like „Zahnfleischerkrankungen" and „Behandlungsmöglichkeiten",
// which must break at syllable points instead of pushing the tint open; and
// the course lines are the kind of long German sentence §8.4's expansion
// headroom was written for. Every story PINS ITS LOCALE with `globals`: the
// locale toolbar is manager state and the visual runner opens each story by
// URL with none of it, while the preview decorator supplies the messages AND
// stamps `document.documentElement.lang` exactly as the shell does — which is
// what makes hyphenation and the credo's `quotes: auto` marks behave here the
// way they behave on the built page. The VIEWPORT pins are the D21 paragraph's.
//
// ── NO HEADER AND NO ContactModalProvider decorator, unlike Pages/Home.
// Nothing on this page slides under the pill (the Services precedent: the
// opener is an ordinary band with its own `py`), and no band here mounts a
// ContactModalTrigger — the two calls to action live on the Team page's cards,
// not on a doctor's own page. A provider nobody asks for would only put a
// context in the picture that the page does not have.
//
// layout 'fullscreen' because all five bands are full-bleed and Container owns
// the gutter: Storybook's default canvas padding would add a second inset on
// top of the clamp and put the story's ground and the bands' margins on two
// rulers.

/** The page shape's stand-in, the first row of lib/team — see ONE DOCTOR.
 *  `.at(0)` plus a named throw rather than `doctors[0]`: an emptied list (an
 *  edit that swaps the list's rows, like the day the owner's real doctors
 *  replaced the demo ones, is exactly when it could be briefly empty) would
 *  otherwise fail somewhere far from here with a bare
 *  "cannot read properties of undefined". It is a function because a
 *  module-scope guard does not narrow a `const` inside the components below —
 *  a return value does. */
const firstDoctor = (): Doctor => {
  const doctor = doctors.at(0);
  if (!doctor) throw new Error('lib/team has no doctor to story');
  return doctor;
};

const DOCTOR = firstDoctor();

/** KEEP-IN-SYNC twin of ./page.tsx — see this file's header. Every comment
 *  justifying this markup lives in that file (why the opener owns the <h1>,
 *  why `align` is the `lowered` seat, why the about title takes the name as
 *  an argument, the `isLocale` narrowing); duplicating the arguments here
 *  would give them two homes and no owner. */
function DoctorPageBands(): ReactElement {
  const t = useTranslations('team');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`doctor story: unknown locale "${locale}"`);

  const page = populateDoctorPage(locale, DOCTOR.id, {
    renderQuote: (segments) => <Keywords segments={segments} />,
    closedLabel: t('doctor.schedule.closed'),
  });
  // The page answers `notFound()` here; the twin throws, because a story that
  // rendered nothing would photograph a blank canvas and pass.
  if (!page) throw new Error(`doctor story: no doctor "${DOCTOR.id}"`);

  return (
    <>
      <DoctorIntro
        name={page.intro.name}
        position={page.intro.position}
        photo={page.intro.photo}
        align="lowered"
        credo={
          // Checked against the band's public shape here, where the literal is
          // spelled (G2-R2 tier 2, typescript F5): the populator hands over only
          // the quote node, so this is the one place the shape is written out.
          {
            eyebrow: t('doctor.philosophy.eyebrow'),
            title: t('doctor.philosophy.title'),
            body: page.intro.credo,
          } satisfies DoctorIntroCredo
        }
      />
      <DoctorProfile
        about={{
          eyebrow: t('doctor.about.eyebrow'),
          title: t('doctor.about.title', { name: page.intro.name }),
          paragraphs: page.profile.paragraphs,
        }}
        schedule={{
          title: t('doctor.schedule.title'),
          rows: page.profile.rows,
        }}
      />
      <DoctorCourses
        eyebrow={t('doctor.courses.eyebrow')}
        title={t('doctor.courses.title')}
        groups={page.courses}
      />
      {/* THE „ÎN CIFRE" TILES (D30, D33): the second lilac band, on the same
          TintedBand ground as the profile. The numbers come through as
          numbers — the island counts up to them — and are printed by
          `Intl.NumberFormat` in the visitor's language (§8.3), never by the
          band; the icon ids become glyphs in ./stat-tiles.tsx, the one
          mapping this twin and the page share (G2-R2 tier 3). */}
      <DoctorStats
        eyebrow={t('doctor.stats.eyebrow')}
        title={t('doctor.stats.title')}
        lead={t('doctor.stats.lead')}
        atLeast={t('doctor.stats.atLeast')}
        tiles={toStatTiles(page.stats)}
        format={new Intl.NumberFormat(locale).format}
      />
      {/* ── FUTURE SEAM (run ledger D19): the doctor's blog-articles band,
          between the tiles and the map when it exists — see ./page.tsx,
          which carries the full note. */}
      <ClinicLocation />
    </>
  );
}

const meta = {
  title: 'Pages/Doctor',
  component: DoctorPageBands,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DoctorPageBands>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Which way a band's side-by-side arrangement went at the width it was
 *  rendered at (D21). */
type Branch = 'beside' | 'stacked';

/** True when `first` really does come before `second` in the document — the
 *  DOM's own answer, which no class name or bounding box can fake. */
const precedes = (first: Element, second: Element): boolean =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

/** One rem at whatever the root font-size is, never a baked-in 16 — a visitor
 *  who enlarged the browser's base font moves every container step with it. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * The COLUMN an element's arrangement is decided by: the nearest ancestor
 * that is a size container — every band's ui/Container (`@container`), since
 * nothing between a band's grid and its Container is one. Found by the
 * computed `container-type` rather than by counting parents, so a wrapper a
 * band adds tomorrow does not silently move the measurement. The walk starts
 * ABOVE the element on purpose: the schedule card is a ui/Card, which is a
 * container of its own, and its arrangement is decided by the column it
 * stands in, not by itself.
 */
/**
 * Fonts and pictures loaded before a single box is read. `decode()` rejects
 * on a broken image; that is not this play's question, so it is swallowed —
 * the alt/role pins elsewhere own it.
 */
const settled = async (root: HTMLElement): Promise<void> => {
  await document.fonts.ready;
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map((img) =>
      img.decode().catch(() => undefined),
    ),
  );
};

const columnOf = (element: Element): HTMLElement => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node;
  }
  throw new Error('doctor story: no size container above the element');
};

/**
 * THE WIDTH A CONTAINER QUERY ASKS: the column's CONTENT box, so any padding
 * and border come off the FRACTIONAL border-box width (`clientWidth` is an
 * integer and would disagree with the engine inside a sub-pixel window around
 * a step). One function for every arrangement below, so the four verdicts
 * measure their columns the same way (G2-R2 tier 3, typescript F2 — the
 * tiles once read the border box off a class-name lookup of their own).
 */
const contentWidthOf = (column: Element): number => {
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(column);
  return (
    column.getBoundingClientRect().width -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight) -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth)
  );
};

/**
 * WHERE A BAND SPLITS, derived rather than assumed (the band stories'
 * `sitsBeside` idiom, reached from the page's side): `@3xl` is 48rem of the
 * column's content box.
 */
const sitsBeside = (element: Element): boolean =>
  contentWidthOf(columnOf(element)) >= 48 * rem();

/** The element's parent, or a NAMED failure — the file's `columnOf` /
 *  `firstDoctor` idiom, instead of a cast that turns a lost wrapper into a
 *  bare "cannot read properties of null" somewhere further down. */
const parentOf = (element: Element): HTMLElement => {
  const parent = element.parentElement;
  if (!parent) throw new Error('doctor story: a timeline box lost its parent');
  return parent;
};

// ── WHAT THE FOUR `expect…` HELPERS BELOW RE-DERIVE, ON PURPOSE. Each one
// measures more than its D21 verdict: the opener's 28rem cap and centring, the
// schedule card's 20rem and its vertical middle, the timeline's gap, line and
// rest paint, the tiles' grid. Those are section pins the bands' own suites
// already hold; they are spelled again here because the owner asked for
// page-level proof of rounds 2e–2k on the page as it ships. The cost is
// recorded in G2-R2 tier 3, react F2: a band builder who changes one of those
// numbers turns THIS file red too, a file the one-agent-per-folder rule keeps
// out of his lane — a future lane may thin each helper to its D21 verdict and
// a "not collapsed" check.

/**
 * THE OPENER (D12, D21, D51). Beside: the cutout's box ends before the name
 * begins, the credo card stands under the name on the name's left edge (the
 * words column's next block), the words column is capped at 28rem, and the
 * PAIR — picture + words — is CENTRED in the column: as much space left of
 * the picture as right of the words (round 2k, the owner's "left and right
 * they have same as much space"). Stacked (round 2k, D51c): the NAME comes
 * FIRST, centred, then the picture, then the card — the owner's "name and
 * speciality … above the photo and … centered" on a phone or tablet.
 */
const expectOpener = async (
  heading: HTMLElement,
  credo: HTMLElement,
): Promise<Branch> => {
  const band = heading.closest('section');
  const cutout = band?.querySelector('img');
  if (!cutout) throw new Error('doctor story: the opener lost its cutout');

  const picture = cutout.getBoundingClientRect();
  const name = heading.getBoundingClientRect();
  const card = credo.getBoundingClientRect();
  const column = columnOf(heading).getBoundingClientRect();
  // A collapsed box would satisfy every comparison below by accident.
  await expect(picture.height).toBeGreaterThan(0);
  await expect(card.height).toBeGreaterThan(0);

  if (sitsBeside(heading)) {
    await expect(picture.right).toBeLessThanOrEqual(name.left);
    await expect(card.top).toBeGreaterThanOrEqual(name.bottom);
    await expect(Math.abs(card.left - name.left)).toBeLessThanOrEqual(1);
    await expect(card.width).toBeLessThanOrEqual(28 * rem() + 1);
    const wordsRight = Math.max(name.right, card.right);
    await expect(
      Math.abs(picture.left - column.left - (column.right - wordsRight)),
    ).toBeLessThanOrEqual(1);
    return 'beside';
  }
  // Stacked: name → picture → card, the name centred on the column — and the
  // column HOLDS them: the grid's one track must never outgrow the column
  // (2026-09-27, CI on Linux: a loaded picture's 20rem min-content had grown
  // the `auto` track to 320px inside a 297px column, every item 23px over and
  // the name 11.5px off centre; the play had passed on Windows only because it
  // measured before the image loaded — hence `settled()` above).
  await expect(name.right).toBeLessThanOrEqual(column.right + 1);
  await expect(picture.right).toBeLessThanOrEqual(column.right + 1);
  await expect(card.right).toBeLessThanOrEqual(column.right + 1);
  await expect(name.bottom).toBeLessThanOrEqual(picture.top);
  await expect(picture.bottom).toBeLessThanOrEqual(card.top);
  await expect(getComputedStyle(heading).textAlign).toBe('center');
  await expect(
    Math.abs((name.left + name.right) / 2 - (column.left + column.right) / 2),
  ).toBeLessThanOrEqual(1);
  return 'stacked';
};

/**
 * THE TINTED BAND (D14, D21, round 2e, D37). Beside: the schedule card sits
 * right of every paragraph and is CENTRED on the opener + prose block — the
 * biography is a named region and the row's tall item since G2-R2 tier 2
 * (a11y F2), the card `self-center` beside it in a ONE-row grid, its vertical
 * middle on the block's middle (round 2g, the owner's "center it also
 * vertically in the lila section"; round 2e's "level with the first
 * paragraph" and round 2g's two-row placement are history — the geometry is
 * pixel-identical, measured). Stacked: the card starts at or
 * under the last paragraph's bottom, ONE width of 20rem where the column allows it (D53) and
 * centred under the prose — it follows the column only where the column is narrower.
 */
const expectProfile = async (
  aboutHeading: HTMLElement,
  paragraphs: readonly HTMLElement[],
  schedule: HTMLElement,
): Promise<Branch> => {
  const card = schedule.getBoundingClientRect();
  const last = paragraphs.at(-1)?.getBoundingClientRect();
  if (!last) throw new Error('doctor story: the about band has no paragraph');
  await expect(card.height).toBeGreaterThan(0);
  await expect(last.height).toBeGreaterThan(0);

  if (sitsBeside(schedule)) {
    for (const paragraph of paragraphs) {
      await expect(card.left).toBeGreaterThanOrEqual(
        paragraph.getBoundingClientRect().right,
      );
    }
    // The block the card centres on runs from the OPENER's top (the
    // SectionHeading root — the eyebrow's top, not the h2's) to the last
    // paragraph's bottom; the tinted box is the grid's grandparent through
    // the Container, and its middle is the same line (symmetric `py`).
    const opener = aboutHeading.parentElement?.getBoundingClientRect();
    const tinted =
      schedule.parentElement?.parentElement?.parentElement?.getBoundingClientRect();
    if (!opener || !tinted)
      throw new Error('doctor story: the about band lost its boxes');
    const cardMiddle = (card.top + card.bottom) / 2;
    await expect(
      Math.abs(cardMiddle - (opener.top + last.bottom) / 2),
    ).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(cardMiddle - (tinted.top + tinted.bottom) / 2),
    ).toBeLessThanOrEqual(1);
    // Not vacuous: the card sits INSIDE the block at both ends.
    await expect(card.top).toBeGreaterThan(opener.top + 1);
    await expect(last.bottom).toBeGreaterThan(card.bottom + 1);
    // ONE WIDTH, 20rem (round 2k, D53: "fixed and remain fixed").
    await expect(Math.abs(card.width - 20 * rem())).toBeLessThanOrEqual(1);
    return 'beside';
  }
  await expect(card.top).toBeGreaterThanOrEqual(last.bottom);
  // Stacked: the same 20rem wherever the column allows it, centred under the
  // prose; only a column narrower than 20rem shrinks it — every phone column
  // (312px at 390, 256px at 320) is, so a phone shows the column's width.
  const stackedColumn = columnOf(schedule).getBoundingClientRect();
  await expect(
    Math.abs(card.width - Math.min(20 * rem(), stackedColumn.width)),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(
      (card.left + card.right) / 2 -
        (stackedColumn.left + stackedColumn.right) / 2,
    ),
  ).toBeLessThanOrEqual(1);
  return 'stacked';
};

/**
 * THE COURSES (D15, D21, D28, D34, D35, D44) — the CV timeline as round 2j
 * left it: one year per row down the LEFT at every width, the rail a column
 * of groups 5rem apart, and the line PER GROUP — each group's own stretch
 * from its dot's centre to the next dot's centre (the last to its own box),
 * 1.5 spacing units in (6px at the 16px root), so the rail still reads as
 * one seamless line with a dot on it at every year; the years on Heading's
 * `section` step; and, at rest, NOTHING lit — every group faded to 0.65,
 * every stretch and dot grey — because the CourseTimeline island marks a
 * current year only once the visitor has scrolled one to the pill's landing
 * line (and this story has not scrolled).
 */
const expectCourses = async (
  years: readonly HTMLElement[],
): Promise<Branch> => {
  const groups = years.map(parentOf);
  // group → the rail (the column of groups itself since D44)
  const railEl = parentOf(groups[0]);
  const rail = railEl.getBoundingClientRect();
  const lineX = rail.left + 0.375 * rem();
  const GAP = 5 * rem();
  const GREY = 'rgb(216, 212, 207)';

  const boxes = groups.map((group) => group.getBoundingClientRect());
  const stretches = groups.map((group) =>
    group.children[0].getBoundingClientRect(),
  );
  // THE PREMISE of every "at rest" check below (round 2k, D49): the island's
  // line is the viewport's middle, so a year lights the moment its top passes
  // `innerHeight / 2`; this story has not scrolled and the timeline sits far
  // below the first screen, so the first year's top must still be under it.
  await expect(boxes[0].top).toBeGreaterThan(window.innerHeight / 2 + 1);
  for (const [index, box] of boxes.entries()) {
    await expect(box.height).toBeGreaterThan(0);
    await expect(Math.abs(box.left - rail.left)).toBeLessThanOrEqual(1);
    if (index > 0) {
      await expect(
        Math.abs(box.top - boxes[index - 1].bottom - GAP),
      ).toBeLessThanOrEqual(1);
    }
    const stretch = stretches[index];
    const dotEl = groups[index].children[1];
    const dot = dotEl.getBoundingClientRect();
    const year = years[index].getBoundingClientRect();
    await expect(dot.width).toBeGreaterThan(0);
    await expect(stretch.width).toBeGreaterThan(0);
    // The stretch and the dot share the line's x; the stretch starts at the
    // dot's centre and ends 0.25rem ABOVE the next group's top — or, last, at
    // its own box — so nothing of the line hangs above the first dot and a
    // short break sits above every next dot (round 2k, D50: a lit stretch
    // never runs under the next subsection's dot).
    await expect(
      Math.abs(stretch.left + stretch.width / 2 - lineX),
    ).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(dot.left + dot.width / 2 - lineX),
    ).toBeLessThanOrEqual(1);
    const dotY = dot.top + dot.height / 2;
    await expect(Math.abs(stretch.top - dotY)).toBeLessThanOrEqual(1);
    const nextBox = boxes[index + 1];
    await expect(
      Math.abs(
        stretch.bottom - (nextBox ? nextBox.top - 0.25 * rem() : box.bottom),
      ),
    ).toBeLessThanOrEqual(1);
    if (nextBox) {
      // …and the next dot's page-coloured ring (4px outside its box, which
      // sits `top-3` under the group's top) starts at least 8px lower.
      const nextDot = groups[index + 1].children[1].getBoundingClientRect();
      await expect(nextDot.top - 4 - stretch.bottom).toBeGreaterThanOrEqual(8);
    }
    await expect(dotY).toBeGreaterThanOrEqual(year.top);
    await expect(dotY).toBeLessThanOrEqual(year.bottom);
    // The year on the `section` step, bold in either tone (D44a, D16).
    await expect(getComputedStyle(years[index]).fontSize).toBe(
      `${1.875 * rem()}px`,
    );
    await expect(
      Number(getComputedStyle(years[index]).fontWeight),
    ).toBeGreaterThanOrEqual(700);
    // AT REST the whole subsection recedes: faded, grey stretch, grey dot.
    await expect(getComputedStyle(groups[index]).opacity).toBe('0.65');
    await expect(
      getComputedStyle(groups[index].children[0]).backgroundColor,
    ).toBe(GREY);
    await expect(getComputedStyle(dotEl).backgroundColor).toBe(GREY);
  }

  // AT REST NOTHING IS LIT (D35): the island's spy runs with
  // `topFallback: 'none'`, and this story has not scrolled — the timeline is
  // below the first screen — so no group carries the current mark, and the
  // static HTML never does (§16 rule 2). The branch is still reported, read
  // off the timeline's column, so the D21 "every arrangement agrees" check
  // keeps the timeline's vote.
  await expect(railEl.querySelectorAll('[data-current]')).toHaveLength(0);
  return sitsBeside(groups[0]) ? 'beside' : 'stacked';
};

/** The five `team.doctor.*` groups a play reads back, plus the map's title. */
type PageWords = {
  philosophy: { eyebrow: string; title: string };
  about: { eyebrow: string; title: string };
  schedule: { title: string };
  courses: { eyebrow: string; title: string };
  stats: { eyebrow: string; title: string; lead: string; atLeast: string };
  location: string;
};

/**
 * THE STATS TILES (D30, D21) — the „în cifre" band's four tiles: four on one
 * row from the Container's `@3xl` (tops level, lefts increasing), two per row
 * from its `@md` (28rem — pairs level, the second pair under the first), one
 * column below (each under the previous, one left edge). The tablet state is
 * reported as 'stacked' to the page's branch set: it is the not-beside
 * branch, exactly as the other three bands report it at that width. The
 * column is found and measured exactly as the other three find theirs —
 * `columnOf`, then `contentWidthOf` — never by a class name (G2-R2 tier 3,
 * typescript F2: a named container or a padded wrapper would have left the
 * old lookup with `null` and a bare TypeError).
 */
const expectStats = async (tiles: readonly HTMLElement[]): Promise<Branch> => {
  const boxes = tiles.map((tile) => tile.getBoundingClientRect());
  for (const box of boxes) await expect(box.height).toBeGreaterThan(0);
  const width = contentWidthOf(columnOf(tiles[0]));
  const perRow = width >= 48 * rem() ? 4 : width >= 28 * rem() ? 2 : 1;

  for (const [index, box] of boxes.entries()) {
    const row = Math.floor(index / perRow);
    const col = index % perRow;
    if (col > 0) {
      const left = boxes[index - 1];
      await expect(Math.abs(box.top - left.top)).toBeLessThanOrEqual(1);
      await expect(box.left).toBeGreaterThan(left.right);
    } else if (row > 0) {
      const above = boxes[index - perRow];
      await expect(box.top).toBeGreaterThanOrEqual(above.bottom);
      await expect(Math.abs(box.left - above.left)).toBeLessThanOrEqual(1);
    }
  }
  return perRow === 4 ? 'beside' : 'stacked';
};

/**
 * Everything both stories check, against the language they were pinned to.
 * Written once because the page's contract does not change with the locale —
 * only the words do. `pinned` is the arrangement the story's viewport pin
 * must produce in the Vitest runner (see the header's D21 paragraph).
 */
const playPage =
  (
    words: PageWords,
    locale: Locale,
    pinned: Branch,
  ): NonNullable<Story['play']> =>
  async ({ canvas, canvasElement }) => {
    const doctor = DOCTOR.words[locale];
    // Measure a SETTLED page: the webfont and every picture loaded. A grid
    // track's min-content includes a loaded image's, so a box read before the
    // cutout arrives is a different layout from the one a visitor sees (the
    // CI-only failure of 2026-09-27 hid behind exactly that window).
    await settled(canvasElement);

    // ONE <h1>, the doctor's NAME, and it is the opener's — not an `sr-only`
    // element of the page's own like Home's and Services'. Queried by role and
    // by the real string out of lib/team, so a walk that picked the wrong
    // language or the wrong person fails here (§9, §13).
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: doctor.name,
    });
    await expect(heading.tagName).toBe('H1');
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The specialty above it — the eyebrow the opener pairs with the name.
    await expect(canvas.getByText(doctor.position)).toBeVisible();

    // THE CREDO CARD (D12): a region named by its own title, holding the
    // doctor's philosophy in a <blockquote> with the <k> marks GONE — the
    // populator cut them and ui/Keyword rendered the pieces, so the first
    // key word is a real <b> and a tag visible anywhere would mean one of
    // those two stopped happening.
    const credo = canvas.getByRole('region', { name: words.philosophy.title });
    await expect(
      within(credo).getByText(words.philosophy.eyebrow),
    ).toBeVisible();
    const quote = within(credo).getByRole('blockquote');
    const firstKeyword = doctor.philosophy.match(/<k>(.+?)<\/k>/)?.[1];
    if (firstKeyword === undefined)
      throw new Error('lib/team: the first doctor has no <k> fragment to read');
    const bold = within(quote).getByText(firstKeyword);
    await expect(bold.tagName).toBe('B');
    await expect(bold).toBeVisible();
    await expect(canvasElement.textContent).not.toContain('<k>');

    // THE „DESPRE" HALF (D14): a region of its own since G2-R2 tier 2 (a11y
    // F2 — the biography was the one block a landmark walk skipped), named
    // by an <h2> whose ICU argument is the doctor's name — resolved here the
    // way next-intl resolves it on the page — and every paragraph of
    // lib/team's `about`, visible, in order.
    const aboutTitle = words.about.title.replace('{name}', doctor.name);
    const biography = canvas.getByRole('region', { name: aboutTitle });
    const about = within(biography).getByRole('heading', {
      level: 2,
      name: aboutTitle,
    });
    await expect(canvas.getByText(words.about.eyebrow)).toBeVisible();
    const paragraphs = doctor.about.map((text) => canvas.getByText(text));
    for (const paragraph of paragraphs) await expect(paragraph).toBeVisible();
    for (const [index, paragraph] of paragraphs.entries()) {
      if (index > 0)
        await expect(precedes(paragraphs[index - 1], paragraph)).toBe(true);
    }

    // THE SCHEDULE CARD: a named region, no eyebrow, and seven rows — the
    // count is the page's proof that it printed a CALENDAR and not just the
    // days the doctor works (lib/hours' own rule, reached from here).
    const schedule = canvas.getByRole('region', {
      name: words.schedule.title,
    });
    // No eyebrow row in the card any more (round 2g, D37): the only <p> a
    // SectionHeading emits is its eyebrow, and the week is a <dl>.
    await expect(schedule.querySelectorAll('p')).toHaveLength(0);
    await expect(schedule.querySelectorAll('dt')).toHaveLength(7);
    await expect(schedule.querySelectorAll('dd')).toHaveLength(7);

    // THE COURSES (D15): a named region, one <h3> per year of lib/team's own
    // grouping — the labels plain digits, newest first — and every line of
    // every year visible under it.
    const courses = canvas.getByRole('region', { name: words.courses.title });
    await expect(
      within(courses).getByText(words.courses.eyebrow),
    ).toBeVisible();
    const groups = coursesByYear(DOCTOR, locale);
    const years = within(courses).getAllByRole('heading', { level: 3 });
    await expect(years.map((year) => year.textContent)).toEqual(
      groups.map((group) => String(group.year)),
    );
    await expect(
      groups.every((group, index) =>
        index === 0 ? true : groups[index - 1].year > group.year,
      ),
    ).toBe(true);
    for (const line of groups.flatMap((group) => group.courses))
      await expect(within(courses).getByText(line)).toBeVisible();

    // THE „ÎN CIFRE" TILES (D30/D32): a named region with its eyebrow and
    // lead, one <h3> per stat row of lib/team in the doctor's own order, and
    // — from the FIRST frame, before any count-up — the FINAL value of every
    // number: SEEN as „3.000+" in the aria-hidden span, HEARD as the page's
    // `atLeast` word before the number („peste 3.000") in the sr-only twin, the
    // number alone when the row has no suffix (round 2s, owner 2026-09-27) —
    // both formatted the way the page formats them.
    const stats = canvas.getByRole('region', { name: words.stats.title });
    await expect(within(stats).getByText(words.stats.eyebrow)).toBeVisible();
    await expect(within(stats).getByText(words.stats.lead)).toBeVisible();
    const tiles = within(stats).getAllByRole('listitem');
    await expect(tiles).toHaveLength(DOCTOR.stats.length);
    await expect(
      within(stats)
        .getAllByRole('heading', { level: 3 })
        .map((label) => label.textContent),
    ).toEqual(DOCTOR.stats.map((stat) => stat.words[locale].label));
    const numberFormat = new Intl.NumberFormat(locale);
    for (const [index, stat] of DOCTOR.stats.entries()) {
      const number = numberFormat.format(stat.value);
      const seen = `${number}${stat.suffix ?? ''}`;
      const heard = stat.suffix ? `${words.stats.atLeast} ${number}` : number;
      await expect(
        within(tiles[index]).getByText(heard, { selector: '.sr-only' }),
      ).toBeInTheDocument();
      await expect(
        within(tiles[index]).getByText(seen, { selector: '[aria-hidden]' }),
      ).toBeInTheDocument();
      // The sign is seen, never heard: no sr-only text in the tile carries it.
      await expect(
        within(tiles[index]).queryByText(/\+/, { selector: '.sr-only' }),
      ).toBeNull();
      await expect(
        within(tiles[index]).getByText(stat.words[locale].description),
      ).toBeVisible();
    }

    // EXACTLY SIX REGIONS, in page order: the credo, the biography, the week,
    // the courses, the tiles and the map. Round 1's „Echipa mea" region is
    // gone (D13) and the biography joined in G2-R2 tier 2 (a11y F2) —
    // counting the landmarks the page really has, identity by identity, is
    // what keeps the first gone, and what moves by one the day the D19 band
    // arrives. The tinted band itself is never one of them (its own Omit).
    const map = canvas.getByRole('region', { name: words.location });
    const expected = [credo, biography, schedule, courses, stats, map];
    const regions = canvas.getAllByRole('region');
    await expect(regions).toHaveLength(6);
    await expect(regions.map((region) => expected.indexOf(region))).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);

    // THE OUTLINE, WHOLE (G2-R2 tier 3, a11y F2): every heading on the page,
    // by LEVEL, in document order. The region census above proves each
    // region's NAME; this proves the level of the element that names it,
    // which is what a heading-navigation user hears (SC 1.3.1 / 2.4.6) — a
    // band arriving with an <h3> title, or a title level turned into a prop
    // and passed wrong, would pass every band suite and fail here. Built from
    // lib/team's own lengths (the years `coursesByYear` groups, the doctor's
    // stat rows), never typed by hand, so a new year or tile moves it by
    // itself. The canvas holds the page's bands and nothing else (no Header,
    // no Footer — see NO HEADER above), so this is the page's own outline.
    await expect(
      canvas
        .getAllByRole('heading')
        .map((element) => Number(element.tagName[1])),
    ).toEqual([
      1, // the doctor's name (DoctorIntro)
      2, // the credo card
      2, // the „Despre" half of the tinted band
      2, // the schedule card
      2, // the courses band
      ...groups.map(() => 3), // one per year
      2, // the „în cifre" band
      ...DOCTOR.stats.map(() => 3), // one per tile
      2, // the map
    ]);

    // THE BANDS STAND IN D18/D33's ORDER: name → credo → about → week →
    // courses → tiles → map.
    await expect(precedes(heading, credo)).toBe(true);
    await expect(precedes(credo, about)).toBe(true);
    await expect(precedes(about, schedule)).toBe(true);
    await expect(precedes(schedule, courses)).toBe(true);
    await expect(precedes(courses, stats)).toBe(true);
    await expect(precedes(stats, map)).toBe(true);
    // NOTHING FOLLOWS THE MAP. The map region IS ClinicLocation's own
    // <section>, so its next sibling is what a sixth band would be — and there
    // is none (G2 react, 2026-09-21: a "last child contains it" spelling was
    // vacuous).
    await expect(map.nextElementSibling).toBeNull();

    // D21 — THE FOUR ARRANGEMENTS, each in the branch its own column puts it
    // in, and all four the SAME branch: they stand in one gutter, so they
    // must flip at one width.
    const branches = [
      await expectOpener(heading, credo),
      await expectProfile(about, paragraphs, schedule),
      await expectCourses(years),
      await expectStats(tiles),
    ];
    await expect(new Set(branches).size).toBe(1);
    // THE PIN IS NOT VACUOUS. Below 48rem of window the column is narrower
    // still, so stacked is the only possibility. From 64rem of window up, the
    // column — the window less two gutters of at most 10vw each, and less a
    // classic scrollbar — is at least ~50rem, clear of the step, so beside is
    // the only possibility. Between the two the derived branch stands alone
    // (the visual runner samples no width there).
    if (pinned === 'stacked' && window.innerWidth < 48 * rem())
      await expect(branches[0]).toBe('stacked');
    if (pinned === 'beside' && window.innerWidth >= 64 * rem())
      await expect(branches[0]).toBe('beside');

    // §7: nothing on this page may make the DOCUMENT scroll sideways, at any
    // width — the 320px stress is a page-tier baseline, and a single unbroken
    // German compound pushing a band past the gutter would show up here first.
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  };

/**
 * ROMANIAN — the default locale and the §15.7 story default (diacritics-bearing
 * copy, so a font or shaping regression has somewhere to show), pinned to the
 * LAPTOP width, where every side-by-side arrangement is on (D21).
 *
 * What to look at: the cutout standing on the band's floor with the specialty
 * and the name beside it, seated 7rem under the column's top (the `lowered`
 * seat, D54), and under the name the framed „Filozofia mea" card — the reviews
 * deck's idle card, under the price cards' lavender glow since round 2r (D61)
 * — quoting the doctor in Romanian marks („…”) with the key words at weight 650 in
 * the deep violet accent-strong (D60); the lavender band fading in and out of the page ground with
 * „Despre Dr. Malea (Sabău) Oana Bianca" and three paragraphs on the left and the „Când mă
 * găsiți la clinică" card on the right, centred on them (D37); the years in
 * one column down the timeline on the left (D34), newest first, all at rest
 * here — one year lights as it crosses the middle of the screen on scroll
 * (D35, D49); the four „în cifre" tiles on one row on the second tint; the
 * map last.
 */
export const Romanian: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: playPage(
    {
      philosophy: ro.team.doctor.philosophy,
      about: ro.team.doctor.about,
      schedule: ro.team.doctor.schedule,
      courses: ro.team.doctor.courses,
      stats: ro.team.doctor.stats,
      location: ro.home.location.title,
    },
    'ro',
    'beside',
  ),
};

/**
 * GERMAN — the §8.4 expansion stress, pinned to the SMARTPHONE width, where
 * every arrangement is one column (D21): the name over the cutout, the cutout
 * over the credo card (D51c), the „Über Dr. Malea (Sabău) Oana Bianca" prose
 * over the „Wann Sie mich in der Praxis finden" card, the years one under the
 * other, and the tiles one per row. „Fachrichtung Prothetik und
 * Parodontologie" over the name, „Kurse und Spezialisierungen" as an h2 that must not break inside a
 * word, and paragraphs and course lines that must break at syllable points,
 * which they only do under a declared `lang` — stamped by
 * the preview decorator exactly as the shell stamps it (§15.14).
 */
export const German: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  play: async (context) => {
    await playPage(
      {
        philosophy: de.team.doctor.philosophy,
        about: de.team.doctor.about,
        schedule: de.team.doctor.schedule,
        courses: de.team.doctor.courses,
        stats: de.team.doctor.stats,
        location: de.home.location.title,
      },
      'de',
      'stacked',
    )(context);
    await expect(document.documentElement.lang).toBe('de');
  },
};
