import { createRef, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import { Image } from '@/components/ui/Image/Image';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import {
  DoctorIntro,
  type DoctorIntroCredo,
  type DoctorIntroPhoto,
  type DoctorIntroProps,
} from './DoctorIntro';
import source from './DoctorIntro.tsx?raw';

// sections/DoctorIntro — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing test doubles as proof of accessible markup,
// and here that is most of the contract — the name is the page's one <h1>, the
// cutout carries no `img` role because its alt is deliberately empty
// (PersonnelCard D3), the band itself answers to NO role at all, which is the
// decision its Omit exists to protect, and the ONE region inside it is the
// credo card (round 2's D12), named by its own <h2>. The card's own contract —
// its tone, its aura (D61), its quote, its type — is CredoCard.test.tsx's;
// this suite proves where the band puts it.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the Wordmark / SectionHeading / PriceList
// precedent). next-intl's hooks throw without one, so a green render proves
// what run D1 states: this band calls no t() and owns no message key. Every
// string below is a FIXTURE the doctor page would have translated — Romanian
// with diacritics (§15.7), factual, no superlatives (CMSR).
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — where the picture sits relative to
// the words, that the pair really stands centred above the picture in the
// stack, and that beside it the picture really takes its third of the column
// and grows down to the words' floor while the card centres under the name on
// the name's own left edge (D62–D64) — is asserted one tier up, in
// DoctorIntro.stories.tsx's play functions, which measure the rendered boxes.
//
// ── HARNESS NOTE — why a `process` shim, copied verbatim from
// PersonnelCard.test.tsx with its reason (which took it from Image.test.tsx).
// The `components` vitest project is bare Vite in a real chromium: no Next
// plugin, so nothing defines the `process` global. next/image reads
// process.env.__NEXT_IMAGE_OPTS at MODULE scope (image-component.js), so
// importing the real ExportedImage — which this band composes through ui/Image
// — throws "process is not defined" before a single test runs. vi.hoisted is
// the sanctioned pre-import seam (Vitest transforms static imports, so this
// really does execute first). Deliberately EMPTY env, not a copy of
// next.config.ts: with __NEXT_IMAGE_OPTS undefined next/image falls back to
// imageConfigDefault and the optimizer's own reads fall back to their
// documented defaults, i.e. the same shape the app ships, without this file
// pretending to be a second source of truth for the build config.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

// ── FIXTURES. The committed demo cutout (900×1200, transparent — a synthetic
// silhouette, no real person, nothing to license) and the doctor the story
// file opens with, so a failure here reads like the picture there.
const PHOTO: DoctorIntroPhoto = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};

const NAME = 'Dr. Elena Marin';
const POSITION = 'Medic specialist ortodonție';

// The credo (D12): the eyebrow and title the page's `team.doctor.philosophy`
// keys carry (round 2's D20), and a body built the way the page builds it —
// ui/Keyword's `Keywords` over a TWO-SEGMENT list (a key word, then plain
// text), so a fragment that failed to survive the band would fail here.
const CREDO_EYEBROW = 'În cuvintele mele';
const CREDO_TITLE = 'Filozofia mea';
const CREDO_SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Ascultarea', keyword: true },
  { text: ' pacientului deschide fiecare consultație.', keyword: false },
];
const CREDO_KEYWORD = 'Ascultarea';
const CREDO_BODY = 'Ascultarea pacientului deschide fiecare consultație.';
const CREDO: DoctorIntroCredo = {
  eyebrow: CREDO_EYEBROW,
  title: CREDO_TITLE,
  body: <Keywords segments={CREDO_SEGMENTS} />,
};

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to an atom's constant, which an import would follow (the
// ui/Eyebrow RECIPE convention).

/** ui/Heading's `hero` size row + its default `tone` row, concatenated in that
 *  order — the fluid clamp the atom's header measures out (32px at the 320
 *  stress width, the old site's 72px from 1600px up) in the ink every
 *  non-inverse title wears. */
const HERO_STEP =
  'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight text-ink-strong';
/** ui/Eyebrow's RECIPE constant. */
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

/** This band's own class strings, byte for byte. The grid's rhythm is the
 *  round-2j one (D43a: 24 / 32 / 40px, halved from 48 / 64 / 80) with ONE
 *  rider — below `@lg` the floor is `pb-8`, 32px under a 24px top, so the
 *  credo card's aura (D61) is not cut by the next band. Below the step ONE
 *  `minmax(0,1fr)` track (2026-09-27, CI on PR #110: an implicit `auto`
 *  track grew to the picture box's 20rem min-content and overflowed the
 *  column — DoctorIntro.tsx's THE STACKED TRACK paragraph); at the step D62's
 *  two containers across the whole column, spaced by D63 — `--picture`, a
 *  third of the column, as the first track with a zero floor for the same
 *  reason, the words in the rest with an `auto` one — never narrower than
 *  their longest unbreakable run (the Opus a11y review) — a sixth of the
 *  column for the gap
 *  clamped to 3rem–10.5rem, and an inset of 15 % of the page gutter before
 *  the picture. Every token before the first `@3xl:` is the one it was before
 *  D62 — the phone and the tablet byte-identical. */
const GRID =
  'grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 pb-8 @lg:py-8 @3xl:[--picture:min(calc(100cqi/3),var(--cutout-width))] @3xl:grid-cols-[minmax(0,var(--picture))_minmax(auto,1fr)] @3xl:gap-x-[clamp(3rem,calc(100cqi/6),10.5rem)] @3xl:py-10 @3xl:ps-[min(1.875cqi,1.875rem)]';
/** The picture's container: below the step capped at 20rem and centred in the
 *  column, exactly as before D62; at the step the whole first track — the cap
 *  lifted — the positioned box the cutout is drawn into (D64): stretched to the
 *  row and never shorter than the cutout at its third. */
const PHOTO_BOX =
  'mx-auto w-full max-w-xs @3xl:relative @3xl:min-h-[calc(var(--picture)*var(--cutout-ratio))] @3xl:max-w-none @3xl:self-stretch';
/** The cutout itself (D64): below the step ui/Image's `artwork` recipe,
 *  spelled by the band (the test that wears it DERIVES that half from the
 *  atom); from it, out of flow — as tall as its container, as wide as its own
 *  proportion makes that up to 1.4 × the track, centred on the track and
 *  standing on its floor. */
const CUTOUT =
  'h-auto max-w-full object-contain @3xl:absolute @3xl:bottom-0 @3xl:left-1/2 @3xl:h-full @3xl:w-auto @3xl:max-w-[140%] @3xl:-translate-x-1/2 @3xl:object-bottom';
/** The words' container: `display: contents` below the step (D51c: the
 *  column dissolves so the pair can climb above the picture), a flex COLUMN
 *  from it (D62: the second track, stretched to the row's height, holding the
 *  pair over the bottom container) — inset 1.5rem, the ONE left edge of the
 *  pair and the card, padded down a ninth of the column (D64), and positioned
 *  so it paints above the cutout should they ever meet. Every token after the
 *  first is `@3xl:`. */
const WORDS =
  'contents @3xl:relative @3xl:flex @3xl:flex-col @3xl:ps-6 @3xl:pt-[calc(100cqi/9)]';
/** D62's BOTTOM container — the philosophy's: `display: contents` below the
 *  step, so the card and the slot are still the stack's own grid items; from
 *  it, the rest of the row's height (`flex-1`), one 36rem track on its left
 *  edge (D63), the content centred in its height over 1.5rem above and
 *  below. */
const BOTTOM =
  'contents @3xl:grid @3xl:flex-1 @3xl:grid-cols-[minmax(0,36rem)] @3xl:content-center @3xl:gap-6 @3xl:py-6';
/** The title pair reads BACKWARDS on purpose: the <h1> is first in the DOM and
 *  the eyebrow paints above it (the band's THE HEADING IS THE PAGE'S <h1>
 *  paragraph, G2 a11y 2026-09-21). Below the step it climbs above the picture
 *  and centres its two boxes (D51c); from it, back in the column, start. */
const PAIR =
  '-order-1 flex flex-col-reverse items-center gap-2 @3xl:order-none @3xl:items-start';
/** The two lines' own placement row, identical on both (D51c + §15.14's
 *  rider): centred ON THE ELEMENT in the stack, `start` beside the picture
 *  (§15.15 b — the utility on the element, the re-assertion `text-start`),
 *  never broken at a syllable, and balanced beside the picture when a line
 *  wraps (D62 — the stack wraps as it always did). */
const LINE = 'text-center hyphens-none @3xl:text-start @3xl:text-balance';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The band's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this band is
 * deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and hooks by name. Known limit, same as there: it strips block comments and
 * whole-line `//` comments, not a `//` trailing real code — a shape this file
 * does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The boxes, reached by structure because none of them carries a role:
 *  section → Container → the grid → the picture's box and the words'
 *  container → the pair and D62's bottom container. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const containerOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const gridOf = (container: HTMLElement): HTMLElement =>
  containerOf(container).firstElementChild as HTMLElement;
const photoBoxOf = (container: HTMLElement): HTMLElement =>
  gridOf(container).children[0] as HTMLElement;
const wordsOf = (container: HTMLElement): HTMLElement =>
  gridOf(container).children[1] as HTMLElement;
const pairOf = (container: HTMLElement): HTMLElement =>
  wordsOf(container).children[0] as HTMLElement;
/** D62's bottom container — the words' SECOND block, the card's parent. */
const bottomOf = (container: HTMLElement): HTMLElement =>
  wordsOf(container).children[1] as HTMLElement;
/** The credo card — found by its ROLE, because unlike the boxes above it has
 *  one: a <section> named by its own <h2> (D12). */
const credoOf = (): HTMLElement =>
  screen.getByRole('region', { name: CREDO_TITLE });

/**
 * ui/Image's `artwork` row, DERIVED FROM THE ATOM instead of retyped: render
 * one and read the class back off the element. Since D64 the band takes
 * `variant="plain"` and spells the geometry itself, so this is what its
 * STACKED half must equal, token for token — an edit to the atom's variant
 * table then moves the expectation with it, and a band whose phone geometry
 * drifted from the recipe fails here (DoctorIntro.tsx's THE CUTOUT
 * paragraph).
 */
const artworkRecipe = (): string => {
  const { container, unmount } = render(
    <Image
      variant="artwork"
      src={PHOTO.src}
      width={PHOTO.width}
      height={PHOTO.height}
      alt=""
    />,
  );
  const recipe = (container.querySelector('img') as HTMLImageElement).className;
  unmount();
  return recipe;
};

type Placement = {
  className?: string;
  children?: ReactNode;
};

const mount = (placement: Placement = {}) =>
  render(
    <DoctorIntro
      name={NAME}
      position={POSITION}
      photo={PHOTO}
      credo={CREDO}
      {...placement}
    />,
  );

describe('DoctorIntro — the page’s opener, and the page’s <h1>', () => {
  it('renders the name as the ONE <h1>, in ui/Heading’s hero step', () => {
    // The element is the decision: a doctor page has exactly one outline root
    // and it is the doctor's name. The atom supplies the step through asChild
    // and never picks a tag of its own.
    const { container } = mount();

    const heading = screen.getByRole('heading', { level: 1, name: NAME });
    expect(heading.tagName).toBe('H1');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    // The atom's two rows first, this band's one placement utility last: a
    // person's name never breaks at a syllable (§15.14's rider), it wraps
    // between words.
    expect(heading.className).toBe(`${HERO_STEP} ${LINE}`);
    // Ș ș Ț ț ă â î survive the whole chain — queried by TEXT, because a role
    // query would still match a mangled name.
    expect(screen.getByText(NAME).textContent).toBe(NAME);
  });

  it('renders the position as ui/Eyebrow, AFTER the name in the DOM and unhyphenatable', () => {
    // A specialisation is a title, not prose: `hyphens-none` for the heading's
    // reason. `text-center` BELOW THE STEP only (D51c — PersonnelCard's D5
    // recipe, the pair centred above the picture), `start` again beside it.
    const { container } = mount();

    const position = screen.getByText(POSITION);
    expect(position.tagName).toBe('P');
    expect(position.className).toBe(`${EYEBROW_RECIPE} ${LINE}`);
    // Uppercase is CSS, so the DOM keeps the authored sentence case — Ș/Ț case
    // mapping stays the browser's job.
    expect(position.textContent).toBe(POSITION);

    // READING ORDER IS NAME → SPECIALTY (G2 a11y, 2026-09-21): a screen-reader
    // user pressing H lands on the doctor's name and hears the qualification
    // next, instead of meeting a qualification with nobody attached to it.
    // The eyebrow still PAINTS above the name — `flex-col-reverse` on the pair
    // is what reverses the visual order, and only the story tier can measure
    // that, which is where the geometry assertion lives.
    const pair = pairOf(container);
    expect(pair.className).toBe(PAIR);
    expect(pair.children[0]).toBe(
      screen.getByRole('heading', { level: 1, name: NAME }),
    );
    expect(pair.children[1]).toBe(position);
  });

  it('is a GENERIC section — the band names nothing, itself included', () => {
    // A named <section> is a `region`, and this band's own heading is the
    // page's title: naming it would announce the doctor's name twice and
    // duplicate the boundary <main> already draws. The ONE region inside is
    // the credo card (D12) — a named piece of the band, never the band.
    const { container } = mount();

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(1);
    expect(regions[0]).toBe(credoOf());
    expect(regions[0]).not.toBe(band);
    expect(band).toContainElement(regions[0]);
  });

  it('builds the outline h1 → h2: the name, then the credo (§9)', () => {
    // The page's ONE <h1> is the doctor's name and its SECOND heading is the
    // credo card's <h2> — one level down, no gap, in that document order.
    mount();

    const headings = screen.getAllByRole('heading');
    expect(headings.map((heading) => heading.tagName)).toEqual(['H1', 'H2']);
    expect(headings[0]).toBe(
      screen.getByRole('heading', { level: 1, name: NAME }),
    );
    expect(headings[1]).toBe(
      screen.getByRole('heading', { level: 2, name: CREDO_TITLE }),
    );
  });

  it('composes ui/Container for the gutter — never a second spelling', () => {
    // The band outer paints and owns the rhythm; the Container owns the width
    // and the @container context every step below measures against (the
    // PAGE-BAND RECIPE, rules 1–2).
    const { container } = mount();

    expect(bandOf(container).className).toBe('bg-page');
    // ui/Container's `containerClasses` — the ONE gutter definition (§15.15 a),
    // IMPORTED rather than spelled: tests/unit/gutter-single-spelling.test.ts
    // fences every file under src/, this suite included (the DoctorCourses way).
    expect(containerOf(container).className).toBe(containerClasses);
    expect(gridOf(container).className).toBe(GRID);
  });

  it('merges the caller className LAST onto the section', () => {
    // Order is the contract, not an accident: own classes first, the caller's
    // last — a deterministic convention (§6.8), NOT a cascade mechanism.
    const { container } = mount({ className: 'scroll-mt-10' });

    expect(bandOf(container).className).toBe('bg-page scroll-mt-10');
  });

  it('owns no outer margin of its own (§6.4)', () => {
    // The page owns the rhythm between its bands. `mx-auto` on the picture's
    // box one level in is the opposite case — the band placing its own child.
    const { container } = mount();

    expect(
      tokensOf(bandOf(container)).filter((token) =>
        /^-?m[trblxyse]?-/.test(token),
      ),
    ).toEqual([]);
  });

  it('spreads remaining native props onto the section', () => {
    // `lang` is the shape the German stress story uses: CSS `hyphens: auto`
    // picks its dictionary from the ELEMENT's language (§15.14) and both lines
    // opt out of it, so the attribute has to reach them by inheritance to mean
    // anything at all.
    const { container } = render(
      <DoctorIntro
        name={NAME}
        position={POSITION}
        photo={PHOTO}
        credo={CREDO}
        lang="de"
        data-slot="doctor-intro"
        id="despre-doctor"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('data-slot', 'doctor-intro');
    expect(band).toHaveAttribute('id', 'despre-doctor');
    expect(
      screen.getByRole('heading', { level: 1, name: NAME }),
    ).not.toHaveAttribute('lang');
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    render(
      <DoctorIntro
        name={NAME}
        position={POSITION}
        photo={PHOTO}
        credo={CREDO}
        ref={band}
      />,
    );

    expect(band.current).toBeInstanceOf(HTMLElement);
    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toContainElement(
      screen.getByRole('heading', { level: 1, name: NAME }),
    );
  });
});

describe('DoctorIntro — the cutout, decorative by construction', () => {
  it('renders exactly one image, with an EMPTY alt and no img role', () => {
    // alt="" is the decision, not a missing string (PersonnelCard D3): the
    // <h1> beside it is the doctor's accessible identity, so a picture alt
    // would be announced back-to-back with the heading.
    const { container } = mount();

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.queryByRole('img')).toBeNull();
    const cutout = within(container).getByRole('presentation');
    expect(cutout.tagName).toBe('IMG');
    expect(cutout).toHaveAttribute('alt', '');
  });

  it('keeps the intrinsic size on the element — reserved space (§11)', () => {
    const { container } = mount();

    const cutout = within(container).getByRole('presentation');
    expect(cutout).toHaveAttribute('width', String(PHOTO.width));
    expect(cutout).toHaveAttribute('height', String(PHOTO.height));
    expect(cutout.getAttribute('src')).toContain('cutout-1');
    // Pinned to the OPTIMIZED pipeline rather than to mere existence: the
    // error-fallback loader emits a srcset too, but only the real one points
    // into the optimizer's folder — and synchronously after render the error
    // event cannot have fired yet (the ui/Image test's own note).
    expect(cutout.getAttribute('srcset')).toContain('nextImageExportOptimizer');
  });

  it('wears ui/Image’s artwork recipe below the step — derived from the atom — and its own geometry from it (D64)', () => {
    // The whole figure always visible, never upscaled, no blur ghost behind
    // the transparency — ui/Image D4. `framed` would crop the cutout into a
    // box and round its corners, i.e. undo "no background" entirely. Since
    // D64 the band owns the geometry (`variant="plain"`, the atom's rule for
    // a consumer whose geometry differs), so the recipe is pinned as the
    // STACKED half of the band's own class string, and every other token is
    // the step's.
    const recipe = artworkRecipe();
    const { container } = mount();

    const cutout = within(container).getByRole('presentation');
    expect(cutout.className).toBe(CUTOUT);
    expect(
      tokensOf(cutout).filter((token) => !token.startsWith('@3xl:')),
    ).toEqual(recipe.split(' '));
    expect(recipe).toContain('object-contain');
    expect(photoBoxOf(container).className).toBe(PHOTO_BOX);
  });

  it('keeps the blur ghost out of the transparency — `placeholder="empty"` is the band’s own now', () => {
    // `artwork` brought `placeholder="empty"` as its default; `plain` brings
    // the repo-wide blur (ui/Image D4, second half), so the band passes the
    // empty one itself. DIFFERENTIAL on one file, ui/Image's own recipe: the
    // same cutout through a bare `plain` Image DOES paint a blur (an inline
    // background-image on the <img>), the band's does not. Read synchronously
    // right after render — the optimizer's 404 in this runner later clears
    // the blur at a macrotask boundary (Image.test.tsx's placeholder note), so
    // no `await` may stand between the render and the reads.
    const { container: bare } = render(
      <Image
        src={PHOTO.src}
        width={PHOTO.width}
        height={PHOTO.height}
        alt=""
      />,
    );
    const { container } = mount();

    const blurred = (bare.querySelector('img') as HTMLImageElement).style
      .backgroundImage;
    expect(blurred).toContain('cutout-1');
    expect(
      within(container).getByRole('presentation').style.backgroundImage,
    ).toBe('');
  });

  it('preloads at high priority — the doctor page’s LCP element (§10.6)', () => {
    // The Hero's first-slide privilege, in the one band that has a picture
    // above the fold. Every portrait further down the page stays lazy.
    const { container } = mount();

    const cutout = within(container).getByRole('presentation');
    expect(cutout).toHaveAttribute('fetchpriority', 'high');
    expect(cutout).not.toHaveAttribute('loading', 'lazy');
  });

  it('declares the boxes the layout actually gives it (sizes)', () => {
    // Beside the words the box is D64's CAP spelled in vw: the cutout grows to
    // at most 1.4 × the picture's third, 7/15 of the column — 0.8 × the
    // viewport under the 10vw gutter, the viewport less 25rem from a 125rem
    // window, where the gutter's 12.5rem cap binds. The cap and not the third,
    // because at a laptop width the cutout IS grown and a hint at the third
    // would fetch a file the browser then stretches (DoctorIntro.tsx's sizes
    // paragraph). Stacked it is 20rem; 60rem is the viewport at which `@3xl`
    // fires here (48rem of column over the 2×10vw gutter), not a second
    // breakpoint, because a `sizes` hint cannot be a container query. The
    // hint follows the box (the G2 react principle): a flat width would
    // overstate it on every laptop.
    const { container } = mount();

    expect(within(container).getByRole('presentation')).toHaveAttribute(
      'sizes',
      '(min-width: 125rem) calc((100vw - 25rem) * 7 / 15), (min-width: 60rem) calc(80vw * 7 / 15), 20rem',
    );
  });

  it('derives the `sizes` numbers from the gutter, the step and the cap — never a second spelling of them', () => {
    // The hint restates facts that live elsewhere (the Opus TypeScript
    // review): ui/Container's gutter — `clamp(…,10vw,12.5rem)` a side, so
    // the column is 80vw while 10vw binds and the viewport less 25rem from
    // the 125rem window where 12.5rem does — the `@3xl` step (48rem of
    // column → a 60rem window under the 10vw gutter), and the cutout's cap
    // over its share of the column (`max-w-[140%]` of a third → 7/15). Each
    // number is read off its source here, so an edit to the gutter, the
    // third or the cap that forgot the hint fails by name.
    const { container } = mount();
    const cutout = within(container).getByRole('presentation');

    const gutter = /clamp\([\d.]+rem,([\d.]+)vw,([\d.]+)rem\)/.exec(
      containerClasses,
    );
    const cap = /@3xl:max-w-\[(\d+)%\]/.exec(cutout.className);
    const third = /--picture:min\(calc\(100cqi\/(\d+)\)/.exec(
      gridOf(container).className,
    );
    const hint =
      /^\(min-width: ([\d.]+)rem\) calc\(\(100vw - ([\d.]+)rem\) \* (\d+) \/ (\d+)\), \(min-width: ([\d.]+)rem\) calc\(([\d.]+)vw \* (\d+) \/ (\d+)\), 20rem$/.exec(
        cutout.getAttribute('sizes') ?? '',
      );
    if (!gutter || !cap || !third || !hint)
      throw new Error('DoctorIntro test: a source of the sizes hint moved');

    const vw = Number(gutter[1]);
    const maxRem = Number(gutter[2]);
    const share = Number(cap[1]) / 100 / Number(third[1]);
    const [fixedWindow, fixedLess, n1, d1, stepWindow, columnVw, n2, d2] = hint
      .slice(1)
      .map(Number);
    expect(fixedWindow).toBe(maxRem / (vw / 100));
    expect(fixedLess).toBe(2 * maxRem);
    expect(stepWindow).toBe(48 / ((100 - 2 * vw) / 100));
    expect(columnVw).toBe(100 - 2 * vw);
    expect(n1 / d1).toBeCloseTo(share, 9);
    expect(n2 / d2).toBeCloseTo(share, 9);
  });

  it('keeps the phone’s small files in the srcset — no `vw` after a space in sizes', () => {
    // MEASURED 2026-10-01 (DoctorIntro.tsx's EVERY `vw` HERE FOLLOWS A `(`):
    // Next's srcset builder reads a `vw` term that follows a space as a floor
    // on the picture's width and drops every file under 640px × that share.
    // D62's first `sizes` did exactly that — the 16–384px files left, and a
    // phone's 20rem box fetched the 640px one. The 384px file is the one a
    // 320px box takes at DPR 1, so its presence is the pin.
    const { container } = mount();

    const srcset =
      within(container).getByRole('presentation').getAttribute('srcset') ?? '';
    expect(srcset).toMatch(/-opt-384\.\w+ 384w/);
    expect(
      within(container).getByRole('presentation').getAttribute('sizes'),
    ).not.toMatch(/(^|\s)(1?\d?\d)vw/);
  });
});

describe('DoctorIntro — the words’ container: the pair over the bottom container (D12, D62)', () => {
  it('puts the credo card in the BOTTOM container, right under the pair', () => {
    // "in that empty space next to photo below [the heading]" (D12), in the
    // owner's two containers one above the other (D62): the pair is the
    // words' FIRST block and the bottom container the second, the card first
    // inside it — so the card shares the <h1>'s left edge and stands under it.
    const { container } = mount();

    const words = wordsOf(container);
    const bottom = bottomOf(container);
    const credo = credoOf();
    expect(words.children).toHaveLength(2);
    expect(words.children[0]).toBe(pairOf(container));
    expect(words.children[1]).toBe(bottom);
    expect(bottom.children[0]).toBe(credo);
    expect(credo.tagName).toBe('SECTION');
    expect(
      screen
        .getByRole('heading', { level: 1, name: NAME })
        .compareDocumentPosition(credo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The eyebrow is visible text inside the card, and the quote's key word
    // is still a <b> after Keywords → DoctorIntro → CredoCard → the DOM.
    expect(within(credo).getByText(CREDO_EYEBROW).tagName).toBe('P');
    const quote = within(credo).getByRole('blockquote');
    const keyword = within(quote).getByText(CREDO_KEYWORD);
    expect(keyword.tagName).toBe('B');
    expect(quote.querySelector('p')).toContainElement(keyword);
    expect(quote.textContent).toBe(CREDO_BODY);
  });

  it('renders children in the bottom container, AFTER the card', () => {
    const { container } = mount({
      children: <p>Membru al Colegiului Medicilor Dentiști.</p>,
    });

    const bottom = bottomOf(container);
    const slot = screen.getByText('Membru al Colegiului Medicilor Dentiști.');
    expect(wordsOf(container)).toContainElement(slot);
    // PAIR → CARD → SLOT, in that DOM order (D12) — the card and the slot
    // together in the bottom container, centred in its height as one block.
    expect(bottom.children).toHaveLength(2);
    expect(bottom.children[0]).toBe(credoOf());
    expect(bottom.children[1]).toBe(slot);
    expect(
      credoOf().compareDocumentPosition(slot) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(credoOf()).not.toContainElement(slot);
  });

  it('renders the card alone when the slot is left empty', () => {
    // The slot is optional and the owner has not yet said what goes in it —
    // an empty one must add no box, or the `gap-6` would open under nothing.
    const { container } = mount();

    expect(bottomOf(container).children).toHaveLength(1);
    expect(bottomOf(container).children[0]).toBe(credoOf());
  });

  it('wears D62–D64’s class strings on the two containers — no seat of their own', () => {
    // The `align` axis (D6) left with D62 and does not come back as a
    // `self-*` seat: the words' container stretches with the row, and its
    // only paddings are D64's two — the 1.5rem inset the pair and the card
    // share, and the name's ninth of the column from the top. The card
    // centres in the rest, whatever the name's length.
    const { container } = mount();

    const words = wordsOf(container);
    expect(words.className).toBe(WORDS);
    expect(bottomOf(container).className).toBe(BOTTOM);
    expect(tokensOf(words).some((token) => /self-/.test(token))).toBe(false);
    expect(
      tokensOf(words).filter((token) =>
        /(^|:)p(bs|be|[xysetrbl])?-/.test(token),
      ),
    ).toEqual(['@3xl:ps-6', '@3xl:pt-[calc(100cqi/9)]']);
  });

  it('puts the picture BEFORE the words in the DOM', () => {
    // Reading order is "who, then which words": the picture is decorative,
    // the <h1> is the first thing named.
    const { container } = mount();

    const grid = gridOf(container);
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0]).toContainElement(
      within(container).getByRole('presentation'),
    );
    expect(grid.children[1]).toBe(wordsOf(container));
  });
});

describe('DoctorIntro — the laptop and desktop opener as two containers (D62–D64)', () => {
  it('gives the picture ONE third of the column and the words the rest — the picture’s track floored at zero, the words’ at their longest run (D63)', () => {
    // "disregard before mentioned sizings in contaners, procentages etc":
    // D62's 35 ‖ 65 `fr` shares gave way to ONE number, `--picture` — a third
    // of ui/Container's column, `cqi` because the Container is the nearest
    // size container — as the first track, and the words in whatever is left.
    // The picture's track and the stacked one have a ZERO floor
    // (`minmax(0,…)`), because a track's default floor is its item's
    // min-content and the picture's would bring the <img>'s 900px width
    // attribute into it; the words' track an `auto` one, so a name's longest
    // unbreakable run is never squeezed past the column's edge and the
    // picture's track gives way instead (the Opus a11y review — DoctorIntro.tsx's
    // THE STACKED TRACK paragraph). The geometry is measured in the stories.
    const { container } = mount();

    const tokens = tokensOf(gridOf(container));
    expect(tokens).toContain('grid-cols-[minmax(0,1fr)]');
    expect(tokens).toContain(
      '@3xl:[--picture:min(calc(100cqi/3),var(--cutout-width))]',
    );
    expect(tokens).toContain(
      '@3xl:grid-cols-[minmax(0,var(--picture))_minmax(auto,1fr)]',
    );
    expect(tokens).not.toContain('@3xl:justify-center');
    // Exactly two track lists — the stack's and the row's, so D62's `fr`
    // shares or a third spelling cannot slip in — and each track's FLOOR read
    // off the component: zero for the stack and the picture, `auto` for the
    // words.
    const lists = tokens.filter((t) => t.includes('grid-cols-'));
    expect(lists).toEqual([
      'grid-cols-[minmax(0,1fr)]',
      '@3xl:grid-cols-[minmax(0,var(--picture))_minmax(auto,1fr)]',
    ]);
    expect(
      lists.map((list) =>
        list
          .slice(list.indexOf('[') + 1, -1)
          .split('_')
          .map((track) => track.slice('minmax('.length, track.indexOf(','))),
      ),
    ).toEqual([['0'], ['0', 'auto']]);
  });

  it('spaces the two containers by the column — the inset before the picture, the gap after it (D63)', () => {
    // "15% extra space on ledft side of picture and 250% more space between
    // photo and right container": the inset is 15 % of the page gutter the
    // column stands in (10vw ≈ 12.5cqi, capped at 12.5rem), the gap D62's
    // 3rem three and a half times over — 10.5rem — reached by a sixth of the
    // column and never below 3rem. Column-relative, so both shrink with a
    // narrow laptop instead of crowding it.
    const { container } = mount();

    const tokens = tokensOf(gridOf(container));
    expect(tokens).toContain('@3xl:ps-[min(1.875cqi,1.875rem)]');
    expect(tokens).toContain('@3xl:gap-x-[clamp(3rem,calc(100cqi/6),10.5rem)]');
    expect(tokens).not.toContain('@3xl:gap-12');
  });

  it('stretches the picture’s container to the row, never shorter than the cutout at its third (D64)', () => {
    // "both large containers share same floor": the picture's container is a
    // grid item stretched to the row — `self-stretch`, where D62 centred it —
    // and its floor height is the cutout at its third: `--picture` times the
    // photo's own height ÷ width, which rides in on the grid as
    // `--cutout-ratio` (from the PROP, so a cutout of another proportion
    // keeps its own). So the row is the taller of the words and the picture at
    // its third, as before D64. `relative` makes it the box the cutout is
    // drawn into.
    const { container } = mount();

    const picture = tokensOf(photoBoxOf(container));
    expect(photoBoxOf(container).className).toBe(PHOTO_BOX);
    for (const token of [
      '@3xl:relative',
      '@3xl:self-stretch',
      '@3xl:max-w-none',
      '@3xl:min-h-[calc(var(--picture)*var(--cutout-ratio))]',
    ])
      expect(picture).toContain(token);
    expect(picture.some((token) => /self-(center|start|end)/.test(token))).toBe(
      false,
    );
    expect(gridOf(container).style.getPropertyValue('--cutout-ratio')).toBe(
      String(PHOTO.height / PHOTO.width),
    );
    // …and its own width, the cap on `--picture` (the Opus React review: a
    // third of an ultrawide column would draw the file larger than it is).
    expect(gridOf(container).style.getPropertyValue('--cutout-width')).toBe(
      `${PHOTO.width}px`,
    );

    // Another proportion, its own ratio — never a hard-coded 4/3.
    const { container: wide } = render(
      <DoctorIntro
        name={NAME}
        position={POSITION}
        photo={{ src: PHOTO.src, width: 1000, height: 1250 }}
        credo={CREDO}
      />,
    );
    expect(gridOf(wide).style.getPropertyValue('--cutout-ratio')).toBe('1.25');
    expect(gridOf(wide).style.getPropertyValue('--cutout-width')).toBe(
      '1000px',
    );
  });

  it('draws the cutout OUT OF FLOW — as tall as the row, centred, on the floor, at most 1.4 × its third (D64)', () => {
    // "image is separated as asset and has to adjust height wise": out of the
    // row's sizing (`absolute`), so the words alone decide whether the row is
    // taller than the picture at its third — a picture whose width followed
    // the row's height while the words' width followed the picture's would be
    // a loop no CSS layout closes. Inside its container: the full height,
    // the width its proportion makes of that, centred (D62's "centered in
    // it"), its bottom on the floor, never wider than 1.4 × the track, past
    // which `object-contain` + `object-bottom` stand the figure on the floor.
    const { container } = mount();

    const cutout = tokensOf(within(container).getByRole('presentation'));
    for (const token of [
      '@3xl:absolute',
      '@3xl:bottom-0',
      '@3xl:left-1/2',
      '@3xl:-translate-x-1/2',
      '@3xl:h-full',
      '@3xl:w-auto',
      '@3xl:max-w-[140%]',
      '@3xl:object-bottom',
      'object-contain',
    ])
      expect(cutout).toContain(token);
    // Positioned but never LAYERED: it overlaps no word by construction (the
    // cap's arithmetic in DoctorIntro.tsx's D64 paragraph), so no z-index —
    // and the words' container is positioned too and LATER in the DOM, so
    // were they ever to meet, the words would paint over the figure (the Opus
    // a11y review's belt), again without a z-index on either.
    expect(cutout.some((token) => /(^|:)-?z-/.test(token))).toBe(false);
    const words = tokensOf(wordsOf(container));
    expect(words).toContain('@3xl:relative');
    expect(words.some((token) => /(^|:)-?z-/.test(token))).toBe(false);
    expect(
      photoBoxOf(container).compareDocumentPosition(wordsOf(container)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('gives the bottom container the rest of the height and the card one 36rem track, centred (D62, D63)', () => {
    // "philosophy has to have same space between it and headings and eyebrow
    // contianer as to bottom of container it is within": the bottom container
    // grows into what the pair leaves (`flex-1`), is a grid with ONE explicit
    // track — 36rem since D63's "like 30% wider" (28rem × 1.3 ≈ 36.4), on the
    // left edge, because an explicit track is never stretched — and centres
    // its content in its height over 1.5rem above and below (`content-center`
    // + `py-6`), so the space over the card always equals the space under it.
    const { container } = mount();

    const bottom = tokensOf(bottomOf(container));
    for (const token of [
      '@3xl:grid',
      '@3xl:flex-1',
      '@3xl:grid-cols-[minmax(0,36rem)]',
      '@3xl:content-center',
      '@3xl:py-6',
    ]) {
      expect(bottom).toContain(token);
    }
    // The words' container is the flex COLUMN that hands it that height.
    const words = tokensOf(wordsOf(container));
    expect(words[0]).toBe('contents');
    expect(words).toContain('@3xl:flex');
    expect(words).toContain('@3xl:flex-col');
  });

  it('puts the pair and the card on ONE left edge — the words’ container’s own inset (D64)', () => {
    // "heading and filozofie have to have same offset": D63's 1.5rem moved
    // from the bottom container up to the words' container, so the pair and
    // the card start on one line. Neither carries a start inset of its own
    // any more — a second one would split the edge again.
    const { container } = mount();

    expect(tokensOf(wordsOf(container))).toContain('@3xl:ps-6');
    // The pair and the bottom container carry no inset at all — no side and
    // no all-round padding or margin that would move a start edge.
    const ANY = /(^|:)-?[pm]([xsl]|bs|be)?-/;
    for (const box of [pairOf(container), bottomOf(container)]) {
      expect(tokensOf(box).some((token) => ANY.test(token))).toBe(false);
    }
    // The card keeps ui/Card's own all-round inset (its `framed` padding,
    // CredoCard.test.tsx's business) and adds no START-side one.
    const START = /(^|:)-?([pm][xs]|pl|ml)-/;
    expect(tokensOf(credoOf()).some((token) => START.test(token))).toBe(false);
  });

  it('starts the name a ninth of the column under the row’s top — read off the column, never the picture (D64)', () => {
    // "heading soes not have to stay at middle of card. currrent positioning
    // is good": D63's quarter of the picture's height is a ninth of the
    // column for the 3:4 cutout, so the name stays where the owner approved
    // it — spelled from the column alone, because the picture's height now
    // follows the words', and a padding read off the picture would be a loop.
    const { container } = mount();

    const padding = tokensOf(wordsOf(container)).filter((token) =>
      token.startsWith('@3xl:pt-'),
    );
    expect(padding).toEqual(['@3xl:pt-[calc(100cqi/9)]']);
    expect(padding[0]).not.toMatch(/--picture|--cutout-ratio/);
  });

  it('keeps every class BELOW the step what it was — the phone and the tablet byte-identical', () => {
    // "on phone and tablet it's perfect how they behave and look now, so i
    // want to mentain that": D62–D64 are spelled in `@3xl:` tokens only. Every
    // token WITHOUT that prefix, element by element, is the pre-D62 string —
    // written out here so a stray base utility fails by name, the cutout's
    // included: since D64 the band spells it, and below the step it is still
    // `artwork`'s three utilities. The one new element, the bottom container,
    // is `contents` and nothing else below the step, so the card and the slot
    // are still the stack's own grid items. The grid's one inline style is
    // `--cutout-ratio`, a custom property that no rule below the step reads.
    const { container } = mount();

    const base = (element: Element): string[] =>
      tokensOf(element).filter((token) => !token.startsWith('@3xl:'));
    const heading = screen.getByRole('heading', { level: 1, name: NAME });
    const position = screen.getByText(POSITION);
    expect(base(gridOf(container))).toEqual([
      'grid',
      'grid-cols-[minmax(0,1fr)]',
      'gap-8',
      'pt-6',
      'pb-8',
      '@lg:py-8',
    ]);
    expect(base(photoBoxOf(container))).toEqual([
      'mx-auto',
      'w-full',
      'max-w-xs',
    ]);
    expect(base(within(container).getByRole('presentation'))).toEqual([
      'h-auto',
      'max-w-full',
      'object-contain',
    ]);
    const inline = gridOf(container).style;
    expect(Array.from(inline)).toEqual(['--cutout-ratio', '--cutout-width']);
    expect(base(wordsOf(container))).toEqual(['contents']);
    expect(base(bottomOf(container))).toEqual(['contents']);
    expect(base(pairOf(container))).toEqual([
      '-order-1',
      'flex',
      'flex-col-reverse',
      'items-center',
      'gap-2',
    ]);
    expect(base(heading)).toEqual([
      ...HERO_STEP.split(' '),
      'text-center',
      'hyphens-none',
    ]);
    expect(base(position)).toEqual([
      ...EYEBROW_RECIPE.split(' '),
      'text-center',
      'hyphens-none',
    ]);
  });

  it('dissolves the words’ two boxes below the step and lifts the pair above the picture (D51c)', () => {
    // `contents` first and every other token `@3xl:`, on the words' container
    // AND on D62's bottom container, so below the step neither is a box at all
    // and their blocks are the grid's own items; the pair takes `-order-1`
    // there and gives it back at the step.
    const { container } = mount();

    for (const box of [wordsOf(container), bottomOf(container)]) {
      const [first, ...others] = tokensOf(box);
      expect(first).toBe('contents');
      expect(others.length).toBeGreaterThan(0);
      for (const token of others) expect(token.startsWith('@3xl:')).toBe(true);
    }

    const pair = tokensOf(pairOf(container));
    expect(pair).toContain('-order-1');
    expect(pair).toContain('@3xl:order-none');
    // Only the pair is reordered: the picture and the card keep the DOM's.
    for (const element of [photoBoxOf(container), credoOf()]) {
      expect(
        tokensOf(element).some((token) => /^(@\w+:)?-?order-/.test(token)),
      ).toBe(false);
    }
  });

  it('keeps the DOM order picture → pair → card, whatever the paint order (D51c)', () => {
    // The reorder is VISUAL only: the picture is decorative (`alt=""`), so the
    // <h1> is still the first thing a screen reader names, and nothing in the
    // band is focusable, so the order costs no tab stop (SC 1.3.2, 2.4.3).
    const { container } = mount();

    const cutout = within(container).getByRole('presentation');
    const heading = screen.getByRole('heading', { level: 1, name: NAME });
    expect(
      cutout.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      heading.compareDocumentPosition(credoOf()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('centres the two lines ON THE ELEMENTS, never through a wrapper (§15.15 b)', () => {
    // The eyebrow and the <h1> are the ONLY elements in the band's own
    // markup that set a text alignment — each its own `text-center` with the
    // `@3xl:text-start` re-assertion, and D62's `@3xl:text-balance` beside it.
    // The wrappers may centre BOXES (`items-center` on the pair,
    // `content-center` on the bottom container) but never text, and the credo
    // card's justified quote is CredoCard.test.tsx's business.
    const { container } = mount();

    const heading = screen.getByRole('heading', { level: 1, name: NAME });
    const position = screen.getByText(POSITION);
    for (const line of [heading, position]) {
      expect(tokensOf(line)).toContain('text-center');
      expect(tokensOf(line)).toContain('@3xl:text-start');
      expect(tokensOf(line)).toContain('@3xl:text-balance');
    }
    const ALIGNMENT = /^(@\w+:)?text-(center|start|end|left|right|justify)$/;
    for (const element of [
      bandOf(container),
      ...bandOf(container).querySelectorAll('*'),
    ]) {
      if (element === heading || element === position) continue;
      if (credoOf().contains(element)) continue;
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(ALIGNMENT);
        expect(token).not.toMatch(/^\[&/);
      }
    }
  });
});

describe('DoctorIntro — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    // Container variants (@lg:, @3xl:) are the allowed shape: they measure the
    // COLUMN, which is what makes the same band right on a phone and on a
    // 1920 desktop without the band ever seeing the window.
    const { container } = mount();

    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });

  it('ships NO client directive — the band is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment. The ONE island in the
    // frame is the one ui/Image brings with the cutout (PersonnelCard D11).
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls no hook at all — not even the server-safe ones', () => {
    // PersonnelCard needs useId for its aria-labelledby pair; this band names
    // nothing, so it needs no id and no hook (see the GENERIC section test).
    // The credo card's useId lives in CredoCard.tsx and is pinned there.
    expect([...CODE.matchAll(/\buse[A-Z]\w*\(/g)]).toHaveLength(0);
  });

  it('imports EXACTLY the four atoms, its own credo card, lib/cx, a lib TYPE and react', () => {
    // The import surface is the guard that sees what a regex cannot: swapping
    // an atom for something with state would hydrate every doctor page without
    // tripping a single directive check. ui/Image is the one island already
    // accepted here and it is named on this list, so the question gets asked
    // out loud the day a ninth import arrives. lib/image-path joined on
    // 2026-09-21 and is TYPE-ONLY — it erases at build time, which is what
    // lets a section reach into §4's foundation ring for it. ./CredoCard
    // joined in round 2 (D12): the band's own in-folder piece, zero-island
    // itself (CredoCard.test.tsx pins its surface), and the declaration site
    // of the `DoctorIntroCredo` type this file re-exports.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      // Code-unit order: '.' sorts before '@'.
      './CredoCard',
      '@/components/ui/Container/Container',
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Image/Image',
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{[^}]*\bImagePath\b[^}]*\} from '@\/lib\/image-path\/image-path';$/m,
    );
    // The credo type crosses as a TYPE, and leaves again as one — a type-only
    // re-export, never an `export … from` (the guard right below).
    expect(CODE).toMatch(
      /^import \{ CredoCard, type DoctorIntroCredo \} from '\.\/CredoCard';$/m,
    );
    expect(CODE).toMatch(/^export type \{ DoctorIntroCredo \};$/m);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('imports no data and no translation machinery (run D1)', () => {
    // The doctor page is the ONE populator: this band may reach for lib/cx and
    // for lib/image-path's TYPE, and for nothing else under lib/ — no DATA at
    // all — and it may not know what a locale is.
    const libImports = [...CODE.matchAll(/from '(@\/lib\/[^']+)'/g)].map(
      (match) => match[1],
    );

    expect(libImports).toEqual(['@/lib/cx/cx', '@/lib/image-path/image-path']);
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
    expect(CODE).not.toMatch(/next-intl|useTranslations|getTranslations/);
    expect(CODE).not.toMatch(/@\/messages|@\/i18n/);
  });

  it('prints nothing but the words it was handed (§8.1)', () => {
    // The sweep: strike the five fixtures out of the band's text and what
    // remains must hold no letter and no digit. A hardcoded label, a
    // separator word, a unit or a quote mark bolted on in JSX — each one fails
    // here. And next-intl prints the dotted key on a miss; there is no t() at
    // all, which is the other half of the same assertion.
    const { container } = mount();
    const text = bandOf(container).textContent ?? '';

    // Name then position — the DOM order the pair ships since 2026-09-21,
    // which `flex-col-reverse` paints the other way round — then the credo
    // card's eyebrow, title and quote (D12). The quote marks are CSS and never
    // reach textContent.
    const words = [NAME, POSITION, CREDO_EYEBROW, CREDO_TITLE, CREDO_BODY];
    expect(text).toBe(words.join(''));
    const residue = words.reduce(
      (rest, word) => rest.replaceAll(word, ' '),
      text,
    );
    expect(residue).not.toMatch(/[\p{L}\p{N}]/u);
    expect(text).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });

  it('renders nothing interactive of its own', () => {
    // Whatever the slot holds is the consumer's; the band itself is a picture,
    // two lines of text and a card of quoted words.
    mount();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('DoctorIntro — type-level pins', () => {
  it('pins the two names the band refuses — and the axis D62 retired', () => {
    // A refactor that rebuilt the props onto a plain intersection would
    // compile, keep every render test green, and silently reopen the naming
    // hole; and the `align` axis (D6) left whole with D62, so a prop of that
    // name coming back is a decision, not a drift. Erased to no-ops at
    // runtime; they fail at `tsc --noEmit` time, naming the property.
    expectTypeOf<DoctorIntroProps>().not.toHaveProperty('align');
    expectTypeOf<DoctorIntroProps>().not.toHaveProperty('aria-label');
    expectTypeOf<DoctorIntroProps>().not.toHaveProperty('aria-labelledby');
  });

  it('does carry the surface those pins are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, both negative pins above would pass while proving
    // nothing (an `any` is caught by the negatives themselves — `keyof any`
    // extends every key — so `{}` is the one shape this guard exists for).
    expectTypeOf<DoctorIntroProps>().toHaveProperty('name');
    expectTypeOf<DoctorIntroProps>().toHaveProperty('position');
    expectTypeOf<DoctorIntroProps>().toHaveProperty('photo');
    expectTypeOf<DoctorIntroProps>().toHaveProperty('credo');
    expectTypeOf<DoctorIntroProps>().toHaveProperty('children');
    expectTypeOf<DoctorIntroProps>().toHaveProperty('className');
  });

  it('takes the credo as the card’s own words shape, REQUIRED (D12)', () => {
    // The band re-exports the card's shape rather than declaring a second one
    // that could drift from it; `credo` is required, so the prop's type is the
    // shape itself — no `| undefined` hiding in it.
    expectTypeOf<DoctorIntroCredo>().toEqualTypeOf<
      Readonly<{ eyebrow: string; title: string; body: ReactNode }>
    >();
    expectTypeOf<DoctorIntroProps['credo']>().toEqualTypeOf<DoctorIntroCredo>();
  });

  it('refuses the shapes the Omits and the retired axis exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the surface
    // loosens. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent). PERSON is
    // COMPLETE — the credo included — so every line below fails for its own
    // reason and never for a missing card.
    const PERSON = {
      name: NAME,
      position: POSITION,
      photo: PHOTO,
      credo: CREDO,
    };

    // @ts-expect-error — the band has no seat to choose since D62 (D6 retired)
    const seated: DoctorIntroProps = { ...PERSON, align: 'lowered' };
    // A real path and no size, declared apart (the WORDLESS note below), so
    // the line under the directive fails for the missing size alone.
    const SIZELESS = { src: PHOTO.src };
    // @ts-expect-error — the intrinsic size is the reserved box (§11)
    const flatPhoto: DoctorIntroProps = { ...PERSON, photo: SIZELESS };
    // @ts-expect-error — the band is generic; a name would make it a region
    const named: DoctorIntroProps = { ...PERSON, 'aria-label': 'x' };
    // @ts-expect-error — same, from the other attribute
    const labelled: DoctorIntroProps = { ...PERSON, 'aria-labelledby': 'x' };
    // @ts-expect-error — an opener without the picture it is built around
    const pictureless: DoctorIntroProps = {
      name: NAME,
      position: POSITION,
      credo: CREDO,
    };
    // @ts-expect-error — a doctor page without the credo card is not the design (D12)
    const credoless: DoctorIntroProps = {
      name: NAME,
      position: POSITION,
      photo: PHOTO,
    };
    // Declared apart so the error below lands on ONE line whatever Prettier
    // does to it: a nested literal would report on its own property line.
    const WORDLESS = { eyebrow: CREDO_EYEBROW, title: CREDO_TITLE };
    // @ts-expect-error — the card's words arrive whole: no credo without its body
    const bodiless: DoctorIntroProps = { ...PERSON, credo: WORDLESS };

    expect([
      seated,
      flatPhoto,
      named,
      labelled,
      pictureless,
      credoless,
      bodiless,
    ]).toHaveLength(7);
  });
});
