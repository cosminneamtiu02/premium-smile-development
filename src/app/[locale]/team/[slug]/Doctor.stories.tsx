import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import {
  DoctorIntro,
  type DoctorIntroCredo,
} from '@/components/sections/DoctorIntro/DoctorIntro';
import { DoctorProfile } from '@/components/sections/DoctorProfile/DoctorProfile';
import {
  DoctorStats,
  spokenNumber,
} from '@/components/sections/DoctorStats/DoctorStats';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale, type Locale } from '@/i18n/locales';
import { doctors, splitKeywords, type Doctor } from '@/lib/team/team';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { populateDoctorPage } from '../populate';
import { toStatTiles } from '../stat-tiles';

// Pages/Doctor — a real `/{locale}/team/{id}/` page as it ships: the opener
// with its credo card, the „în cifre" tiles on the lilac band, the biography
// — its key words set apart like the credo's — beside the courses — one idea
// per dot, lit one by one — and the map, at the six page-tier widths (§13:
// Pages/* → 320 · 390 · 768 · 1280 · 1536 · 1920,
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
// thing most likely to drift — which language, which person, which course
// ideas in which order — cannot, because there is only one copy of it.
//
// ── THIS IS A KEEP-IN-SYNC PAIR (§4's sharing table), written down rather than
// assumed: the twin lives here, the original in ./page.tsx, and that file's
// header points back at this one. Both must render the same four bands in the
// same order (CLAUDE.md §15.23 round 7, 2026-10-13: DoctorIntro → DoctorStats
// → DoctorProfile → ClinicLocation, the courses inside DoctorProfile), fed by
// the same populator and the same ../stat-tiles.tsx, with the same ten
// `team.doctor.*` keys (D20, D32, round 2s) — the biography's title taking
// the doctor's name as its ICU argument on both sides. The plays pin exactly
// that from the outside, so a change on either side that the other does not
// follow turns this suite red instead of quietly photographing something the
// site no longer ships. The FUTURE SEAM page.tsx marks above the map (D19,
// the doctor's blog articles) is marked here too: when that band lands, both
// files gain it in the same change, and the region count and the heading
// census below move with it.
//
// ── ONE DOCTOR, THE FIRST OF lib/team, and derived rather than named: this is
// a page SHAPE, reused for every person the owner adds (his dispatch: „this
// page as structure will be reused for more doctors"), so the story follows
// the list instead of pinning a demo id that a real roster will retire. What
// the picture is ABOUT is the structure — the cutout beside the name with the
// credo card under it, the tiles on the tint, the prose beside the course
// ideas, the map — not who is in it.
//
// ── THE OWNER'S ADAPTABILITY RULE, PLAY-PINNED (round 2's D21, 2026-09-25:
// "sections that are next to each other when in phone mode … must come one
// above the other"). The plays read THREE arrangements — the picture beside
// the words, the stat tiles four on a row, and the biography beside the
// courses (CLAUDE.md §15.23 round 7) — and every side-by-side one flips below
// ui/Container's `@3xl` step (48rem of column, a ~960px window; the tiles fall
// to two per row, then one). Each band's suite already proves its own flip;
// what only the PAGE can prove is that the three flip TOGETHER, at one width,
// because all three stand in the same Container gutter. So the plays measure
// all three, each in the branch its OWN measured column puts it in (never the
// pinned width: the visual runner ignores the pin and renders these same
// plays at all six widths), and then assert the three branches agree. The
// pins make each branch non-vacuous in the Vitest runner, which DOES honour
// them: Romanian at the laptop width must have taken the beside branch,
// German at the smartphone width the stacked one — tops under bottoms and
// shared left edges, not only pixels.
//
// ── THE LIGHT, READ FROM THE OUTSIDE (CLAUDE.md §15.23 round 7 — the owner:
// "they have to circle automatically through the ideas and highlight them
// one by one"). The courses' island lights ONE idea at a time by itself and
// holds the light while its rail is off screen (sections/DoctorCourses/
// CourseTimeline's THE OFF-SCREEN HOLD). This story never scrolls, so the
// plays find exactly ONE idea lit once the island has started — the FIRST
// wherever the rail stands below the first screen — and none under reduced
// motion, where the island never starts (the neutral rail; the pixel net's
// projects emulate reduced motion, the Vitest storybook project does not).
// When the light moves on, and to which idea, is the island's own suite's
// business.
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
// longest name, „Dr. Malea (Sabău) Oana Bianca", on Heading's fluid `hero`
// step (32px on the phone this story is pinned to; on a laptop or a desktop,
// since §15.32 round 4, the 1401 window's 65px scaled with the page — ~89px at
// 1920, where the step alone stopped at 72);
// „Über Dr. Malea (Sabău) Oana Bianca" is the h2 that must not break inside
// the NAME — sections/DoctorProfile opts that one title out of the site-wide
// `hyphens: auto` (2026-09-30; the other band titles inherit it and may break
// at a syllable in a narrow column, which §15.14 allows — the old 256px
// column at 320 broke the map's „Besuchen Sie un-sere Klinik"; the 288px one
// since 2026-10-09's phone gutter breaks no title on this page, measured on
// the built export, and „Über die Jahre bestätigte Erfahrung" has worn
// `hyphens-none` since 2026-10-01); the „Despre" paragraphs are built out of
// compounds like „Zahnfleischerkrankungen" and „Behandlungsmöglichkeiten",
// which must break at syllable points instead of pushing the column open; and
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
// ContactModalTrigger — a doctor's own page carries no call to action (the
// doctor card's one link leads HERE). A provider nobody asks for would only put a
// context in the picture that the page does not have.
//
// layout 'fullscreen' because all four bands are full-bleed and Container owns
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
 *  why it no longer passes an `align` seat, why the numbers come second, why
 *  the biography's title takes the name as an argument, the `isLocale`
 *  narrowing); duplicating the arguments here would give them two homes and
 *  no owner. */
function DoctorPageBands(): ReactElement {
  const t = useTranslations('team');
  const locale = useLocale();
  if (!isLocale(locale))
    throw new Error(`doctor story: unknown locale "${locale}"`);

  const page = populateDoctorPage(locale, DOCTOR.id, {
    renderKeywords: (segments) => <Keywords segments={segments} />,
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
      {/* THE „ÎN CIFRE" TILES (D30), second since 2026-10-13, on the lilac
          TintedBand ground: the numbers come through as numbers — the island
          counts up to them — and are printed by `Intl.NumberFormat` in the
          visitor's language (§8.3), never by the band; the icon ids become
          glyphs in ../stat-tiles.tsx, the one mapping this twin and the page
          share (G2-R2 tier 3). `scaled`, as on the page (CLAUDE.md §15.32
          round 4; ./page.tsx's THE WHOLE PAGE IN THE BAND SCALE). */}
      <DoctorStats
        scaled
        eyebrow={t('doctor.stats.eyebrow')}
        title={t('doctor.stats.title')}
        lead={t('doctor.stats.lead')}
        atLeast={t('doctor.stats.atLeast')}
        tiles={toStatTiles(page.stats)}
        format={new Intl.NumberFormat(locale).format}
      />
      <DoctorProfile
        about={{
          eyebrow: t('doctor.about.eyebrow'),
          title: t('doctor.about.title', { name: page.intro.name }),
          paragraphs: page.profile.paragraphs,
        }}
        courses={{
          eyebrow: t('doctor.courses.eyebrow'),
          title: t('doctor.courses.title'),
          items: page.profile.courses,
        }}
      />
      {/* ── FUTURE SEAM (run ledger D19): the doctor's blog-articles band,
          above the map when it exists — see ./page.tsx, which carries the
          full note. */}
      {/* `scaled`, as on the page: the map band Home and Team draw (CLAUDE.md
          §15.32 round 3; ./page.tsx carries the owner's words). */}
      <ClinicLocation scaled />
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
 * THE DESIGN PIXEL AN ELEMENT IS DRAWN IN (CLAUDE.md §15.32 round 4: the
 * whole page in ui/Container's band scale on a laptop or desktop). Read off
 * the element itself, never off a class name: a band in the scale redefines
 * `--spacing` (globals.css's `design-scale`), so an element's `--spacing`
 * differs from the root's exactly when it stands inside a scaled band — the
 * price-list twin's "remap reading" — and its inherited `--scale-px` is then
 * the band's pixel. Outside the scale a design pixel is the theme's own, a
 * sixteenth of the root (§7). Every length below that the bands spell in the
 * theme's steps is that many design pixels times this.
 */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

const unitAt = (element: Element): number =>
  remapped(element)
    ? parseFloat(getComputedStyle(element).getPropertyValue('--scale-px'))
    : rem() / 16;

/**
 * Fonts and pictures loaded before a single box is read. `decode()` rejects
 * on a broken image; that is not this play's question, so it is swallowed —
 * the alt/role pins elsewhere own it.
 *
 * SOUND ONLY WHILE THIS PAGE HAS NO LAZY PICTURE (Pages/Team's `settled`,
 * 2026-09-30, has the measurements): `decode()` never settles on a lazy
 * picture that lies beyond the browser's loading distance, and a play that
 * awaits one hangs until the runner's timeout. This page's one <img> is the
 * opener's cutout, which ui/Image loads eagerly (`preload`), so the wait
 * below cannot hang today. The day a band with lazy pictures lands far down
 * this page — the FUTURE SEAM's articles, say — take the Team twin's shape:
 * ask for every picture first.
 */
const settled = async (root: HTMLElement): Promise<void> => {
  // The page's NAME first, in its real face: `document.fonts.ready` can
  // resolve before the heading's face was even requested, and the opener's
  // boxes — read before `expectNameLines` runs — follow how the name wraps
  // (the Opus React and TypeScript reviews; PR #125's lesson).
  const name = root.querySelector('h1');
  if (name) {
    const style = getComputedStyle(name);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      name.textContent ?? '',
    );
  }
  await document.fonts.ready;
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map((img) =>
      img.decode().catch(() => undefined),
    ),
  );
};

/**
 * The COLUMN an element's arrangement is decided by: the nearest ancestor
 * that is a size container — every band's ui/Container (`@container`), since
 * nothing between a band's grid and its Container is one. Found by the
 * computed `container-type` rather than by counting parents, so a wrapper a
 * band adds tomorrow does not silently move the measurement. The walk starts
 * ABOVE the element on purpose: a box that is a size container itself — a
 * ui/Card is one — has its arrangement decided by the column it stands in,
 * never by its own width.
 */
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
 * a step). One function for every arrangement below, so the three verdicts
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
  if (!parent) throw new Error('doctor story: a box lost its parent');
  return parent;
};

// ── WHAT THE `expect…` HELPERS BELOW RE-DERIVE, ON PURPOSE. `expectOpener`
// measures more than its D21 verdict — the opener's third, floor and shared
// left edge (D62–D64; that lane re-spelled them here) — and `expectStats` the
// tiles' grid: section pins the bands' own suites already hold, spelled again
// because the owner asked for page-level proof of rounds 2e–2k on the page as
// it ships. The cost is recorded in G2-R2 tier 3, react F2: a band builder who
// changes one of those numbers turns THIS file red too, a file the
// one-agent-per-folder rule keeps out of his lane. The two helpers written for
// round 7 (2026-10-13) take the lever that record named: `expectProfile` holds
// its D21 verdict, a "not collapsed" check and the owner's left-and-right
// (the biography's 3fr beside the courses' 2fr, their contents starting
// level), `expectCourses` what the owner asked of
// the courses (the ideas in order, no year, one lit) — and neither re-spells
// a length a band's own suite owns.

/**
 * THE NAME'S LINES (D62, the owner, 2026-10-01: "in a single line on longest
 * example if possible of "Dr. Malea (Sabău) Oana Bianca" on heading and
 * fallback on 2 rows of the heading when not wide enough, maybe 3"). ONE line
 * wherever the name's one-line width fits the room the pair is given,
 * otherwise two or three — never more. The one-line width is the text's own,
 * read with wrapping switched off for one synchronous read (the style is put
 * back before anything paints). The REAL face first: `settled()`'s
 * `document.fonts.ready` can resolve before the heading's face was even asked
 * for, and the fallback serif wraps differently (PR #125's lesson). Measured
 * on the built page since D64: the longest name the clinic ships is three
 * lines from the step (~979px) to ~1100px, two from ~1180px to 1920 and one
 * at 2560. Returns WHICH branch ran, so a story can say which it expects —
 * the Romanian story's laptop pin wraps (the Opus TypeScript review: a
 * branch no story names is a branch no story can lose).
 */
type NameLines = 'one' | 'wrapped';

const expectNameLines = async (
  heading: HTMLElement,
  room: number,
): Promise<NameLines> => {
  const style = getComputedStyle(heading);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    heading.textContent ?? '',
  );
  await document.fonts.ready;
  const range = document.createRange();
  range.selectNodeContents(heading);
  const lines = new Set(
    Array.from(range.getClientRects(), (rect) => Math.round(rect.top)),
  ).size;
  heading.style.whiteSpace = 'nowrap';
  const oneLine = range.getBoundingClientRect().width;
  heading.style.whiteSpace = '';
  await expect(oneLine).toBeGreaterThan(0);
  if (oneLine <= room) {
    await expect(lines).toBe(1);
    return 'one';
  }
  await expect(lines).toBeGreaterThanOrEqual(2);
  await expect(lines).toBeLessThanOrEqual(3);
  return 'wrapped';
};

/**
 * THE OPENER (D12, D21, D62–D64). Beside — D62's two containers across the
 * WHOLE column (owner, 2026-10-01), spaced by D63 and on D64's one floor: the
 * picture's container a third of the column, after an inset of 15 % of the
 * gutter, and the words' container to the column's right edge; ONE floor
 * under both, the cutout drawn as tall as the row (up to 1.4 × its third
 * wide), centred on its third and standing where the words end; the name and
 * the credo card on ONE left edge 1.5rem into the words, the name on as few
 * lines as fit (`expectNameLines`) and the card up to 36rem wide with as much
 * space above it as below it. (Until D62: a centred pair, as much space left
 * of the picture as right of the words — round 2k's "left and right they
 * have same as much space".) Stacked (round 2k, D51c, unchanged since): the
 * NAME comes FIRST, centred, then the picture, then the card — the owner's
 * "name and speciality … above the photo and … centered" on a phone or
 * tablet.
 */
const expectOpener = async (
  heading: HTMLElement,
  credo: HTMLElement,
  nameLines?: NameLines,
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
    // The two containers, reached through the boxes this play already holds:
    // the cutout's parent is the picture's, the name's grandparent the words'
    // (the name → the eyebrow-and-name pair → the words' container).
    const pair = parentOf(heading).getBoundingClientRect();
    const words = parentOf(parentOf(heading)).getBoundingClientRect();
    const box = parentOf(cutout).getBoundingClientRect();
    // The band's lengths in its own design pixel (`unitAt`): the 1.5rem inset
    // of the words is 24 of them, the inset's cap 30, the card's track 576 —
    // the theme's own rem outside the scale, the same numbers × s inside it.
    // `column` is the band's own box since §15.32 round 4 (`columnOf` stops at
    // DoctorIntro's `@container` wrapper): ui/Container's column below the
    // cap, the capped box past it — what every share of the opener reads.
    const unit = unitAt(heading);
    const edge = words.left + 24 * unit;
    // D63: the inset, the picture's third, the words to the column's edge.
    await expect(
      Math.abs(
        box.left - column.left - Math.min(0.01875 * column.width, 30 * unit),
      ),
    ).toBeLessThanOrEqual(1);
    // The picture's third — or less, where the words' `auto` floor (a name's
    // longest unbreakable run) claims the difference; then that run fills the
    // pair's room (the band's THE STACKED TRACK paragraph).
    // (A third of the column, never wider than the cutout's own file — D63.)
    const third = Math.min(
      column.width / 3,
      Number(cutout.getAttribute('width')),
    );
    await expect(box.width).toBeLessThanOrEqual(third + 1);
    if (box.width < third - 1) {
      const range = document.createRange();
      range.selectNodeContents(heading);
      const widest = Math.max(
        ...Array.from(range.getClientRects(), (rect) => rect.width),
      );
      await expect(widest).toBeGreaterThanOrEqual(pair.width - 1);
    }
    await expect(Math.abs(words.right - column.right)).toBeLessThanOrEqual(1);
    // D64: ONE floor under the two containers and the cutout, the cutout as
    // tall as the row, as wide as its proportion makes that (capped at 1.4 ×
    // its third), centred on its third — and never reaching the name.
    const proportion =
      Number(cutout.getAttribute('width')) /
      Number(cutout.getAttribute('height'));
    if (!Number.isFinite(proportion) || proportion <= 0)
      throw new Error('doctor story: the cutout has no intrinsic size');
    await expect(Math.abs(box.bottom - words.bottom)).toBeLessThanOrEqual(1);
    await expect(Math.abs(picture.bottom - box.bottom)).toBeLessThanOrEqual(1);
    await expect(Math.abs(picture.height - box.height)).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(
        picture.width - Math.min(box.height * proportion, 1.4 * box.width),
      ),
    ).toBeLessThanOrEqual(1);
    await expect(
      Math.abs((picture.left + picture.right) / 2 - (box.left + box.right) / 2),
    ).toBeLessThanOrEqual(1);
    await expect(picture.right).toBeLessThan(name.left);
    // D64: the name and the card on ONE left edge, the name a ninth of the
    // column under the row's top; D63: the card up to 36rem wide, centred in
    // the height the name leaves.
    await expect(Math.abs(name.left - edge)).toBeLessThanOrEqual(1);
    await expect(Math.abs(card.left - edge)).toBeLessThanOrEqual(1);
    // …and the name never crosses the words' right edge, which is the
    // column's (the Opus a11y review: the line count alone cannot see it).
    await expect(name.right).toBeLessThanOrEqual(words.right + 1);
    await expect(
      Math.abs(pair.top - words.top - column.width / 9),
    ).toBeLessThanOrEqual(1);
    await expect(card.top).toBeGreaterThanOrEqual(name.bottom);
    await expect(
      Math.abs(card.width - Math.min(576 * unit, words.right - edge)),
    ).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(card.top - pair.bottom - (words.bottom - card.bottom)),
    ).toBeLessThanOrEqual(1);
    const lines = await expectNameLines(heading, pair.width);
    if (nameLines) await expect(lines).toBe(nameLines);
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
 * THE STATS TILES (D30, D21) — the „în cifre" band's four tiles: four on one
 * row from the Container's `@3xl` (tops level, lefts increasing), two per row
 * from its `@md` (28rem — pairs level, the second pair under the first), one
 * column below (each under the previous, one left edge). The tablet state is
 * reported as 'stacked' to the page's branch set: it is the not-beside
 * branch, exactly as the other two arrangements report it at that width. The
 * column is found and measured exactly as the other two find theirs —
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
 * THE BIOGRAPHY BESIDE THE COURSES (CLAUDE.md §15.23 round 7, D21 — the
 * owner, 2026-10-13: "on the left biography and on the right the thing with
 * the "Courses and specialisations""). Beside: the biography's 3fr beside the
 * courses' 2fr (the owner, the same evening: "like 20% wider"), the courses
 * right of the biography, both regions starting at the grid's one top, so the
 * two openers stand level — and the two contents too, by the band's subgrid
 * (sections/DoctorProfile's header).
 * Stacked: the courses under the biography, on its left edge.
 */
const expectProfile = async (
  biography: HTMLElement,
  courses: HTMLElement,
): Promise<Branch> => {
  const left = biography.getBoundingClientRect();
  const right = courses.getBoundingClientRect();
  // A collapsed box would satisfy every comparison below by accident.
  await expect(left.height).toBeGreaterThan(0);
  await expect(right.height).toBeGreaterThan(0);

  if (sitsBeside(biography)) {
    await expect(right.left).toBeGreaterThan(left.right);
    await expect(Math.abs(right.top - left.top)).toBeLessThanOrEqual(1);
    // 3fr beside 2fr: the biography 1.5 × the courses (the owner's "like 20%
    // wider" — 1.2 × the equal half it had, the courses 0.8 ×).
    await expect(left.width / right.width).toBeCloseTo(1.5, 2);
    // …and the two CONTENTS start level (the owner: "to start at same y when
    // they sit next to the other"): the paragraphs' block and the courses'
    // list, untransformed boxes in the band's second row.
    const paragraphs = biography.lastElementChild?.getBoundingClientRect();
    const list = courses.querySelector('ul')?.getBoundingClientRect();
    await expect(paragraphs, 'the biography’s paragraphs').toBeDefined();
    await expect(list, 'the courses’ list').toBeDefined();
    await expect(
      Math.abs((list?.top ?? NaN) - (paragraphs?.top ?? NaN)),
    ).toBeLessThanOrEqual(0.5);
    return 'beside';
  }
  await expect(right.top).toBeGreaterThanOrEqual(left.bottom);
  await expect(Math.abs(right.left - left.left)).toBeLessThanOrEqual(1);
  return 'stacked';
};

/**
 * THE COURSES (CLAUDE.md §15.23 round 7 — the owner, 2026-10-13: "no year
 * anymore. jsut dot ideas, and each section will be jsut one dot … they have
 * to circle automatically through the ideas and highlight them one by one").
 * ONE list of the doctor's ideas, in lib/team's order, each visible, and NO
 * year: the region holds no <h3> — an idea is a list item, never a heading.
 * THE LIGHT (the header's paragraph of that name): exactly ONE idea carries
 * `data-current` once the island has started — the first while the rail
 * stands below the first screen, where the light holds — and none under
 * reduced motion, where the island never starts. `waitFor`, because the
 * first light comes one render after mount.
 */
const expectCourses = async (
  courses: HTMLElement,
  lines: readonly string[],
): Promise<void> => {
  await expect(
    within(courses).queryAllByRole('heading', { level: 3 }),
  ).toHaveLength(0);
  const rail = within(courses).getByRole('list');
  const ideas = within(rail).getAllByRole('listitem');
  await expect(ideas.map((idea) => idea.textContent)).toEqual([...lines]);
  for (const idea of ideas) await expect(idea).toBeVisible();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  await waitFor(
    () =>
      expect(rail.querySelectorAll('[data-current]')).toHaveLength(
        reduced ? 0 : 1,
      ),
    { timeout: 3_000 },
  );
  if (!reduced && rail.getBoundingClientRect().top >= window.innerHeight)
    await expect(ideas[0]).toHaveAttribute('data-current');
};

/** The four `team.doctor.*` groups a play reads back, plus the map's title. */
type PageWords = {
  philosophy: { eyebrow: string; title: string };
  about: { eyebrow: string; title: string };
  courses: { eyebrow: string; title: string };
  stats: { eyebrow: string; title: string; lead: string; atLeast: string };
  location: string;
};

/** A band's opener, as SectionHeading draws it: the eyebrow is the <p> right
 *  before the heading, inside the same root. */
const eyebrowOf = (title: HTMLElement): HTMLElement => {
  const eyebrow = title.previousElementSibling;
  if (!(eyebrow instanceof HTMLElement) || eyebrow.tagName !== 'P')
    throw new Error('doctor story: a band title lost its eyebrow');
  return eyebrow;
};

const fontSizeOf = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/**
 * THE WHOLE PAGE IN THE BAND SCALE (CLAUDE.md §15.32 round 4; the owner,
 * 2026-10-13: "take current heading and eyebrow from main page. look how
 * reactive and nice it is. make the exact same thing with the heading and
 * eyebrow from the individual dr page" — then "Whole page, like Home"). On a
 * laptop or a desktop — a fine pointer, an engine that registers custom
 * properties, ui/Container's column at least max(56rem, 896px) — EVERY band
 * of this page stands in the scale and draws in ONE design pixel, min(column,
 * 96rem) / 1106, Home's; on a phone or a touch tablet none does and every
 * size is the theme's (§7). So, in both cases, every band opener is Home's:
 * its eyebrow 14 design pixels and its <h2> on the `band` step (36, or 30 in
 * a column under 28rem — only ever outside the scale), and the credo card's
 * opener the same steps against its own card. Inside the scale the
 * biography's and the map's openers also stand on ONE left edge — the
 * column's; the biography's prose outdent left with the lilac on 2026-10-13
 * (CLAUDE.md §15.23 round 7) — the courses' at the second column's start
 * (sections/DoctorProfile's THE BIOGRAPHY THREE FIFTHS — its 3fr beside the
 * courses' 2fr, 48 design pixels apart), and
 * the tiles' centred (D30); and the name, the page's <h1>, is the `hero`
 * step's value at the owner's 1401 window, 16.26 spacing steps (DoctorIntro's
 * THE BAND SCALE). Outside it the name is the `hero` clamp itself. Returns
 * whether the page was in the scale, so a story can say which it expects.
 */
const expectScale = async (parts: {
  name: HTMLElement;
  position: HTMLElement;
  credo: HTMLElement;
  stats: HTMLElement;
  about: HTMLElement;
  biography: HTMLElement;
  courses: HTMLElement;
  map: HTMLElement;
}): Promise<boolean> => {
  // ui/Container's column — the about title's nearest size container: nothing
  // between the two is one (DoctorProfile's rhythm box and grid carry no
  // `@container`).
  const column = columnOf(parts.about).getBoundingClientRect().width;
  const regime =
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    column >= Math.max(56 * rem(), 896);
  const unit = regime ? Math.min(column, 96 * rem()) / 1106 : rem() / 16;
  const near = async (
    actual: number,
    expected: number,
    what: string,
    tolerance = 0.05,
  ): Promise<void> => {
    // Written as NOT within, never as beyond: a NaN — a lost element, an
    // unregistered `--scale-px` — is within nothing, so it fails here instead
    // of passing every comparison silently (G2 typescript, LOW-2).
    if (!(Math.abs(actual - expected) <= tolerance))
      throw new Error(
        `doctor story: ${what} — ${actual.toFixed(3)} where ${expected.toFixed(3)} is due (the design pixel ${unit.toFixed(5)})`,
      );
  };

  const titleOf = (region: HTMLElement): HTMLElement =>
    within(region).getAllByRole('heading', { level: 2 })[0];
  const openers = [
    ['the credo card', titleOf(parts.credo)],
    ['the tiles', titleOf(parts.stats)],
    ['the biography', parts.about],
    ['the courses', titleOf(parts.courses)],
    ['the map', titleOf(parts.map)],
  ] as const;

  // EVERY BAND IN, OR EVERY BAND OUT — and in, all on the page's ONE pixel.
  for (const element of [parts.name, ...openers.map(([, title]) => title)]) {
    await expect(remapped(element)).toBe(regime);
    await near(unitAt(element), unit, 'a band’s design pixel', 0.0001);
  }

  // The band openers, and the credo card's: the eyebrow 14, the title on the
  // `band` step against its own nearest container (the card's for the credo
  // card — ui/Card is one).
  for (const [what, title] of openers) {
    const step = contentWidthOf(columnOf(title)) >= 28 * rem() ? 36 : 30;
    await near(fontSizeOf(title), step * unit, `${what}’s title`);
    await near(fontSizeOf(eyebrowOf(title)), 14 * unit, `${what}’s eyebrow`);
  }
  await near(fontSizeOf(parts.position), 14 * unit, 'the specialty');

  // The name: the design's 65.04 inside the scale, the `hero` clamp outside.
  const hero = Math.min(
    4.5 * rem(),
    Math.max(2 * rem(), rem() + 0.035 * window.innerWidth),
  );
  await near(
    fontSizeOf(parts.name),
    regime ? 16.26 * 4 * unit : hero,
    'the name',
  );

  if (regime) {
    // ONE LEFT EDGE: the biography's and the map's titles on the band's own
    // edge — the column's, and past the cap the capped box's — and the
    // profile's grid on it too, so the courses' title stands at the start of
    // its second column: three fifths of the grid less the 48-design-pixel
    // gap, plus the gap, in (the 3fr/2fr split).
    const map = titleOf(parts.map).getBoundingClientRect().left;
    await near(
      parts.about.getBoundingClientRect().left,
      map,
      'the biography’s and the map’s left edge',
      1,
    );
    const grid = parentOf(parts.biography).getBoundingClientRect();
    await near(grid.left, map, 'the profile’s grid on the map’s edge', 1);
    await near(
      titleOf(parts.courses).getBoundingClientRect().left,
      grid.left + (3 / 5) * (grid.width - 48 * unit) + 48 * unit,
      'the courses’ opener at the second column’s start',
      1,
    );
  }
  return regime;
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
    // Beside the picture, how the name must lay out at the story's pin — so
    // the branch `expectNameLines` took is a stated fact, never a silent one.
    nameLines?: NameLines,
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

    // THE „ÎN CIFRE" TILES (D30/D32), second since 2026-10-13: a named region
    // with its eyebrow and lead, one <h3> per stat row of lib/team in the
    // doctor's own order, and the FINAL value of every number: HEARD as the
    // page's `atLeast` word before the number („peste 3.000") in the island's
    // twin from the first frame, the number alone when the row has no suffix
    // (round 2s, owner 2026-09-27), and SEEN as „3.000+" in the aria-hidden
    // span — at once wherever no count-up runs, once the 1.5 s count has
    // landed wherever one does (the band now stands second, and a tall
    // window may have its tiles on screen at load) — both formatted the way
    // the page formats them.
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
      // Heard through the band's own `spokenNumber` — a French frame's
      // grouping space is dropped for the ear, never read off raw Intl.
      const spoken = spokenNumber(stat.value, numberFormat.format);
      const heard = stat.suffix ? `${words.stats.atLeast} ${spoken}` : spoken;
      await expect(
        within(tiles[index]).getByText(heard, { selector: '[data-spoken]' }),
      ).toBeInTheDocument();
      await waitFor(
        () =>
          expect(
            within(tiles[index]).getByText(seen, { selector: '[aria-hidden]' }),
          ).toBeInTheDocument(),
        { timeout: 3_000 },
      );
      // The sign is seen, never heard: the tile's twin never carries it.
      await expect(
        within(tiles[index]).queryByText(/\+/, { selector: '[data-spoken]' }),
      ).toBeNull();
      await expect(
        within(tiles[index]).getByText(stat.words[locale].description),
      ).toBeVisible();
    }

    // THE BIOGRAPHY (D14): a region of its own since G2-R2 tier 2 (a11y F2 —
    // the biography was the one block a landmark walk skipped), named by an
    // <h2> whose ICU argument is the doctor's name — resolved here the way
    // next-intl resolves it on the page — and every paragraph of lib/team's
    // `about`, visible, in order, found by what a reader sees of it: since
    // 2026-10-13 a paragraph carries `<k>` marks (lib/team's THE BIOGRAPHY'S
    // KEY WORDS), cut by the populator, so its text on the page is the source
    // with the marks gone, split across the <b>s below.
    const aboutTitle = words.about.title.replace('{name}', doctor.name);
    const biography = canvas.getByRole('region', { name: aboutTitle });
    const about = within(biography).getByRole('heading', {
      level: 2,
      name: aboutTitle,
    });
    // THE NAME IS NEVER SPLIT (sections/DoctorProfile, 2026-09-30): this is
    // the one band title that carries a person's name, and under the
    // site-wide `hyphens: auto` Chromium broke „(Sa-bău)" and „Ele-na" on
    // phones (measured on the built pages). The opt-out rides the opener's
    // root and inherits to the <h2>; read here as the COMPUTED value, which
    // is what the browser breaks lines by — a class name alone could sit on
    // the wrong element.
    await expect(getComputedStyle(about).hyphens).toBe('none');
    await expect(
      within(biography).getByText(words.about.eyebrow),
    ).toBeVisible();
    const paragraphs = doctor.about.map((source) => {
      const reading = splitKeywords(source)
        .map((segment) => segment.text)
        .join('');
      return within(biography).getByText(
        (_content, element) =>
          element?.tagName === 'P' && element.textContent === reading,
      );
    });
    for (const paragraph of paragraphs) await expect(paragraph).toBeVisible();
    for (const [index, paragraph] of paragraphs.entries()) {
      if (index > 0)
        await expect(precedes(paragraphs[index - 1], paragraph)).toBe(true);
    }
    // THE KEY WORDS AND THE GREY (CLAUDE.md §15.23 round 7 — the owner,
    // 2026-10-13: "i also wan thte text of biografie to be like the text at
    // [the credo's quote] … so gary-ish er and with tighlighted keywords").
    // Every paragraph sets at least one key word apart as ui/Keyword's <b> —
    // exactly lib/team's marks, in order, so the populator cut them and the
    // page rendered them (a mark left as text fails the canvas-wide `<k>`
    // check above) — and wears the doctor quotes' faint ink, --ink-faint
    // #766f69: sections/DoctorProfile's, read here as the COMPUTED colour.
    for (const [index, paragraph] of paragraphs.entries()) {
      const bold = Array.from(
        paragraph.querySelectorAll('b'),
        (element) => element.textContent,
      );
      await expect(bold.length).toBeGreaterThanOrEqual(1);
      await expect(bold).toEqual(
        splitKeywords(doctor.about[index])
          .filter((segment) => segment.keyword)
          .map((segment) => segment.text),
      );
      await expect(getComputedStyle(paragraph).color).toBe(
        'rgb(118, 111, 105)',
      );
    }

    // THE COURSES (CLAUDE.md §15.23 round 7): a named region with its
    // eyebrow, the doctor's ideas one per dot — `expectCourses` reads the
    // list, the missing years and the light.
    const courses = canvas.getByRole('region', { name: words.courses.title });
    await expect(
      within(courses).getByText(words.courses.eyebrow),
    ).toBeVisible();
    await expectCourses(
      courses,
      DOCTOR.courses.map((course) => course.words[locale]),
    );

    // EXACTLY FIVE REGIONS, in page order: the credo, the tiles, the
    // biography, the courses and the map. Round 1's „Echipa mea" region left
    // with D13, the biography joined in G2-R2 tier 2 (a11y F2) and the week's
    // card left on 2026-10-13 ("no more schedul box at all") — counting the
    // landmarks the page really has, identity by identity, is what keeps the
    // gone ones gone, and what moves by one the day the D19 band arrives. The
    // profile band's own root is never one of them (its own Omit).
    const map = canvas.getByRole('region', { name: words.location });
    const expected = [credo, stats, biography, courses, map];
    const regions = canvas.getAllByRole('region');
    await expect(regions).toHaveLength(5);
    await expect(regions.map((region) => expected.indexOf(region))).toEqual([
      0, 1, 2, 3, 4,
    ]);

    // THE OUTLINE, WHOLE (G2-R2 tier 3, a11y F2): every heading on the page,
    // by LEVEL, in document order. The region census above proves each
    // region's NAME; this proves the level of the element that names it,
    // which is what a heading-navigation user hears (SC 1.3.1 / 2.4.6) — a
    // band arriving with an <h3> title, or a title level turned into a prop
    // and passed wrong, would pass every band suite and fail here. Built from
    // lib/team's own lengths (the doctor's stat rows), never typed by hand, so
    // a new tile moves it by itself; the course ideas add no heading at all.
    // The canvas holds the page's bands and nothing else (no Header, no
    // Footer — see NO HEADER above), so this is the page's own outline.
    await expect(
      canvas
        .getAllByRole('heading')
        .map((element) => Number(element.tagName[1])),
    ).toEqual([
      1, // the doctor's name (DoctorIntro)
      2, // the credo card
      2, // the „în cifre" band
      ...DOCTOR.stats.map(() => 3), // one per tile
      2, // the biography
      2, // the courses — its ideas are list items, never headings
      2, // the map
    ]);

    // THE BANDS STAND IN ROUND 7's ORDER (2026-10-13): name → credo → tiles
    // → biography → courses → map.
    await expect(precedes(heading, credo)).toBe(true);
    await expect(precedes(credo, stats)).toBe(true);
    await expect(precedes(stats, biography)).toBe(true);
    await expect(precedes(biography, courses)).toBe(true);
    await expect(precedes(courses, map)).toBe(true);
    // NOTHING FOLLOWS THE MAP. The map region IS ClinicLocation's own
    // <section>, so its next sibling is what a fifth band would be — and there
    // is none (G2 react, 2026-09-21: a "last child contains it" spelling was
    // vacuous).
    await expect(map.nextElementSibling).toBeNull();

    // D21 — THE THREE ARRANGEMENTS, each in the branch its own column puts it
    // in, and all three the SAME branch: they stand in one gutter, so they
    // must flip at one width.
    const branches = [
      await expectOpener(heading, credo, nameLines),
      await expectStats(tiles),
      await expectProfile(biography, courses),
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

    // THE WHOLE PAGE IN THE BAND SCALE (§15.32 round 4): every band in or
    // every band out, and either way every opener Home's. NOT VACUOUS: from a
    // 75rem window under a mouse the column is past max(56rem, 896px) by any
    // gutter, so the page MUST be in the scale; under 48rem it cannot be.
    const inScale = await expectScale({
      name: heading,
      position: canvas.getByText(doctor.position),
      credo,
      stats,
      about,
      biography,
      courses,
      map,
    });
    if (
      window.matchMedia('(pointer: fine)').matches &&
      window.innerWidth >= 75 * rem()
    )
      await expect(inScale).toBe(true);
    if (window.innerWidth < 48 * rem()) await expect(inScale).toBe(false);

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
 * What to look at: the opener's two containers (D62–D64) — the cutout on
 * the left third of the column, grown down to the words' floor; beside it the
 * specialty and the name a ninth of the column down (the longest name the
 * clinic ships, on two balanced lines at this width), and under the name, on
 * the name's own left edge and centred in the height left beside the
 * picture, the framed „Filozofia mea" card — the reviews
 * deck's idle card, under the price cards' lavender glow since round 2r (D61)
 * — quoting the doctor in Romanian marks („…”) with the key words at weight 650 in
 * the doctor card button's lavender, accent (since 2026-10-02); then, second
 * since 2026-10-13, the four „în cifre" tiles on one row on the lilac band;
 * then, on the page ground, „Despre Dr. Malea (Sabău) Oana Bianca" and three
 * justified paragraphs in the quotes' faint ink on the left, two key words in
 * each set apart like the credo's (since 2026-10-13), and „Cursuri și
 * specializări" on the right
 * — the doctor's courses one idea per dot on a line down the left, no year,
 * the first idea lit and held while the courses stand below the first screen,
 * one idea after another every 3 s once they are in view (reduced motion:
 * none lit); the map last. All of it drawn in the band scale (§15.32 round
 * 4): this width's look is the owner's 1401 window magnified about 1.1×,
 * every eyebrow and title the size Home's are here.
 */
export const Romanian: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: playPage(
    {
      philosophy: ro.team.doctor.philosophy,
      about: ro.team.doctor.about,
      courses: ro.team.doctor.courses,
      stats: ro.team.doctor.stats,
      location: ro.home.location.title,
    },
    'ro',
    'beside',
    // The longest name the clinic ships, on two balanced lines at 1536.
    'wrapped',
  ),
};

/**
 * GERMAN — the §8.4 expansion stress, pinned to the SMARTPHONE width, where
 * every arrangement is one column (D21): the name over the cutout, the cutout
 * over the credo card (D51c), the tiles one per row, and the „Über Dr. Malea
 * (Sabău) Oana Bianca" prose over the „Kurse und Spezialisierungen" ideas.
 * „Fachrichtung Prothetik und Parodontologie" over the name, and paragraphs
 * and course lines that must break at syllable points, which they only do
 * under a declared `lang` — stamped by the preview decorator exactly as the
 * shell stamps it (§15.14).
 */
export const German: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  play: async (context) => {
    await playPage(
      {
        philosophy: de.team.doctor.philosophy,
        about: de.team.doctor.about,
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
