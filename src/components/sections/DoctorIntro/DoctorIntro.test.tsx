import { createRef, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import { Image } from '@/components/ui/Image/Image';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import {
  DoctorIntro,
  type DoctorIntroAlign,
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
// the words, what `align` actually moves, that the pair really stands centred
// above the picture in the stack and the two columns really sit centred in
// the row (D51) — is asserted one tier up, in DoctorIntro.stories.tsx's play
// functions, which measure the rendered boxes.
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
 *  column — DoctorIntro.tsx's THE STACKED TRACK paragraph); at the step,
 *  two CONTENT-SIZED tracks centred in the row (D51b — they were ⅓ ‖ ⅔
 *  under D43b), the picture's with a zero floor, `minmax(0,auto)`, for the
 *  same reason just above the step (the same paragraph). */
const GRID =
  'grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 pb-8 @lg:py-8 @3xl:grid-cols-[minmax(0,auto)_auto] @3xl:justify-center @3xl:gap-12 @3xl:py-10';
/** The picture TIED TO THE COLUMN (D51a, "like 30% larger all around", the
 *  coordinator's ruling): round 2j's ⅓-track picture × 1.3 — `(100cqi − 3rem)
 *  × 0.4333`, 0.4333 = 1.3 / 3 — capped at 36rem. Round 1's
 *  `@3xl:justify-self-center` left with the stretched tracks: a
 *  content-sized track IS the box. */
const PHOTO_WIDE = '@3xl:max-w-[min(36rem,calc((100cqi-3rem)*0.4333))]';
const PHOTO_BOX = `mx-auto w-full max-w-xs @3xl:mx-0 ${PHOTO_WIDE} @3xl:self-end`;
/** `display: contents` below the step (D51c: the column dissolves so the pair
 *  can climb above the picture), a 28rem flex column from it (D51b: `w-md` —
 *  a definite width, because ui/Card's inline-size containment gives an auto
 *  track nothing to size by — widened only by a longer name token,
 *  `min-w-min`). Every token after the first is `@3xl:`. */
const WORDS =
  'contents @3xl:flex @3xl:w-md @3xl:min-w-min @3xl:flex-col @3xl:gap-6';
/** The title pair reads BACKWARDS on purpose: the <h1> is first in the DOM and
 *  the eyebrow paints above it (the band's THE HEADING IS THE PAGE'S <h1>
 *  paragraph, G2 a11y 2026-09-21). Below the step it climbs above the picture
 *  and centres its two boxes (D51c); from it, back in the column, start. */
const PAIR =
  '-order-1 flex flex-col-reverse items-center gap-2 @3xl:order-none @3xl:items-start';
/** The two lines' own placement row, identical on both (D51c + §15.14's
 *  rider): centred ON THE ELEMENT in the stack, `start` beside the picture
 *  (§15.15 b — the utility on the element, the re-assertion `text-start`),
 *  and never broken at a syllable. */
const LINE = 'text-center hyphens-none @3xl:text-start';

/** The three rows of the band's ALIGN table (D6) — the growth gate's other
 *  half: a value added to the union without a row here fails to compile, and a
 *  row silently changed fails right below. */
const SELF: Record<DoctorIntroAlign, string> = {
  start: '@3xl:self-start',
  // The fourth seat (round 2e; 1.5rem under D38; 7rem since D54 — 20 % of the
  // 555px figure at 1280): the top seat plus a 7rem drop — two tokens, still
  // exactly ONE of them a `self-*`.
  lowered: '@3xl:self-start @3xl:pt-28',
  center: '@3xl:self-center',
  end: '@3xl:self-end',
};
const ALIGNS = ['start', 'lowered', 'center', 'end'] as const;

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

/** The four boxes, reached by structure because none of them carries a role:
 *  section → Container → the grid → the picture's box and the words' column. */
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
/** The credo card — found by its ROLE, because unlike the boxes above it has
 *  one: a <section> named by its own <h2> (D12). */
const credoOf = (): HTMLElement =>
  screen.getByRole('region', { name: CREDO_TITLE });

/**
 * ui/Image's `artwork` row, DERIVED FROM THE ATOM instead of retyped: render
 * one and read the class back off the element. The contract asks for the
 * derivation on purpose — an edit to the atom's variant table then moves this
 * expectation with it, while a band that quietly stopped passing
 * `variant="artwork"` (or started passing `framed`) still fails here.
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
  align?: DoctorIntroAlign;
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

  it('wears ui/Image’s artwork recipe, derived from the atom itself', () => {
    // The whole figure always visible, never upscaled, no blur ghost behind
    // the transparency — ui/Image D4. `framed` would crop the cutout into a
    // box and round its corners, i.e. undo "no background" entirely.
    const recipe = artworkRecipe();
    const { container } = mount();

    expect(within(container).getByRole('presentation').className).toBe(recipe);
    expect(recipe).toContain('object-contain');
    expect(photoBoxOf(container).className).toBe(PHOTO_BOX);
  });

  it('preloads at high priority — the doctor page’s LCP element (§10.6)', () => {
    // The Hero's first-slide privilege, in the one band that has a picture
    // above the fold. Every portrait further down the page stays lazy.
    const { container } = mount();

    const cutout = within(container).getByRole('presentation');
    expect(cutout).toHaveAttribute('fetchpriority', 'high');
    expect(cutout).not.toHaveAttribute('loading', 'lazy');
  });

  it('declares the two boxes the layout actually gives it (sizes)', () => {
    // Beside the words the box is its own formula spelled in vw on a
    // 0.8 × viewport column (D51a): 1.3 × the old ⅓ track, (80vw − 3rem) ×
    // 0.4333, capped at 36rem (from ~1720px) — and the row's remainder after
    // the words' 28rem and the 3rem gap, 80vw − 31rem, which is the smaller
    // just above the step (below ~1050px). Stacked it is 20rem; 60rem is the
    // viewport at which `@3xl` fires here (48rem of column over the 2×10vw
    // gutter), not a second breakpoint, because a `sizes` hint cannot be a
    // container query. The `min()` is the G2 react principle: a flat cap
    // would overstate the box on every laptop.
    const { container } = mount();

    expect(within(container).getByRole('presentation')).toHaveAttribute(
      'sizes',
      '(min-width: 60rem) min(36rem, calc((80vw - 3rem) * 0.4333), calc(80vw - 31rem)), 20rem',
    );
  });
});

describe('DoctorIntro — the words column and the align axis (D6, D12)', () => {
  it('puts the credo card in the words column, right under the pair', () => {
    // "in that empty space next to photo below [the heading]" (D12): the card
    // is the column's SECOND block, so it shares the <h1>'s column and left
    // edge and the column's `gap-6` sets it one step below the name.
    const { container } = mount();

    const words = wordsOf(container);
    const credo = credoOf();
    expect(words.children[0]).toBe(pairOf(container));
    expect(words.children[1]).toBe(credo);
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

  it('renders children inside the words column, AFTER the card', () => {
    const { container } = mount({
      children: <p>Membru al Colegiului Medicilor Dentiști.</p>,
    });

    const words = wordsOf(container);
    const slot = screen.getByText('Membru al Colegiului Medicilor Dentiști.');
    expect(words).toContainElement(slot);
    // PAIR → CARD → SLOT, in that DOM order (D12).
    expect(words.children).toHaveLength(3);
    expect(words.children[0]).toBe(pairOf(container));
    expect(words.children[1]).toBe(credoOf());
    expect(words.children[2]).toBe(slot);
    expect(
      credoOf().compareDocumentPosition(slot) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(credoOf()).not.toContainElement(slot);
  });

  it('renders the pair and the card alone when the slot is left empty', () => {
    // The slot is optional and the owner has not yet said what goes in it —
    // an empty one must add no box, or the `gap-6` would open under nothing.
    const { container } = mount();

    expect(wordsOf(container).children).toHaveLength(2);
    expect(wordsOf(container).children[1]).toBe(credoOf());
  });

  it('takes exactly ONE @3xl:self-* token, one per align value — and `lowered` its 7rem drop', () => {
    for (const align of ALIGNS) {
      const { container, unmount } = mount({ align });

      const words = wordsOf(container);
      expect(words.className).toBe(`${WORDS} ${SELF[align]}`);
      expect(
        tokensOf(words).filter((token) => token.startsWith('@3xl:self-')),
      ).toEqual(
        SELF[align]
          .split(' ')
          .filter((token) => token.startsWith('@3xl:self-')),
      );
      // Only the fourth seat pads the column (round 2e), and only at the step.
      expect(tokensOf(words).some((token) => /^@3xl:pt-/.test(token))).toBe(
        align === 'lowered',
      );
      expect(tokensOf(words).some((token) => /^pt-/.test(token))).toBe(false);
      unmount();
    }
  });

  it('defaults to start — including for an explicit align={undefined}', () => {
    // A page computing `align` from data may hand over undefined on purpose;
    // that is the default row, not a fourth state (the PersonnelCard `side`
    // precedent).
    const { container: bare } = mount();
    expect(wordsOf(bare).className).toBe(`${WORDS} ${SELF.start}`);

    const { container: explicit } = mount({ align: undefined });
    expect(wordsOf(explicit).className).toBe(`${WORDS} ${SELF.start}`);
  });

  it('puts the picture BEFORE the words in the DOM, at every align', () => {
    // Reading order is "who, then which words" whichever way the row is
    // aligned: `align` moves a box inside its row and never the document.
    for (const align of ALIGNS) {
      const { container, unmount } = mount({ align });

      const grid = gridOf(container);
      expect(grid.children).toHaveLength(2);
      expect(grid.children[0]).toContainElement(
        within(container).getByRole('presentation'),
      );
      expect(grid.children[1]).toBe(wordsOf(container));
      unmount();
    }
  });
});

describe('DoctorIntro — the opener re-proportioned (D51)', () => {
  it('centres two content-sized tracks at the step instead of stretching two fractions (D51b)', () => {
    // "left and right they have same as much space": content-sized tracks
    // (an `auto` ceiling on both) under `justify-content: center` never grow,
    // so the free space falls outside the pair — the geometry itself is
    // measured in the stories. The picture's track has a ZERO FLOOR,
    // `minmax(0,auto)` (2026-09-27): just above the step the picture box's
    // min-content must never hold the row wider than the column, so there
    // the picture gives way and the words keep their 28rem (DoctorIntro.tsx's
    // THE STACKED TRACK paragraph). The one fraction left in the row is BELOW
    // the step: the stacked column's `minmax(0,1fr)` (CI on PR #110), which
    // the `@3xl` tracks replace — so the no-fraction guard reads the step's
    // tokens only.
    const { container } = mount();

    const tokens = tokensOf(gridOf(container));
    expect(tokens).toContain('grid-cols-[minmax(0,1fr)]');
    expect(tokens).toContain('@3xl:grid-cols-[minmax(0,auto)_auto]');
    expect(tokens).toContain('@3xl:justify-center');
    expect(
      tokens.some(
        (token) => token.startsWith('@3xl:') && /fr[)_\]]/.test(token),
      ),
    ).toBe(false);
  });

  it('gives the words a definite 28rem column and the picture a column-tied width (D51a, D51b)', () => {
    // `w-md`, never a mere `max-w-md`: ui/Card contains its own inline size,
    // so an auto track under a cap would shrink to the NAME (measured: 388px
    // for „Dr. Elena Marin" at 1280) and the card with it. `min-w-min` lets a
    // name token wider than 28rem widen the column instead of overflowing it.
    const { container } = mount();

    const words = tokensOf(wordsOf(container));
    expect(words).toContain('@3xl:w-md');
    expect(words).toContain('@3xl:min-w-min');
    expect(words.some((token) => /max-w-/.test(token))).toBe(false);
    const picture = tokensOf(photoBoxOf(container));
    // 1.3 × the old ⅓ track, measured +30 % at 1280 and 1536 (the fixed
    // `max-w-lg` of the first cut gave +60 % / +32 % / +14 %).
    expect(picture).toContain(PHOTO_WIDE);
    expect(picture).not.toContain('@3xl:max-w-md');
    expect(picture).not.toContain('@3xl:max-w-lg');
    expect(picture.some((token) => /justify-self/.test(token))).toBe(false);
  });

  it('dissolves the words column below the step and lifts the pair above the picture (D51c)', () => {
    // `contents` first and every other token `@3xl:`, so below the step the
    // column is no box at all and its blocks are the grid's own items; the
    // pair takes `-order-1` there and gives it back at the step.
    const { container } = mount({ align: 'lowered' });

    const [first, ...others] = tokensOf(wordsOf(container));
    expect(first).toBe('contents');
    expect(others.length).toBeGreaterThan(0);
    for (const token of others) expect(token.startsWith('@3xl:')).toBe(true);

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
    // `@3xl:text-start` re-assertion. The wrappers may centre BOXES
    // (`items-center` on the pair) but never text, and the credo card's
    // justified quote is CredoCard.test.tsx's business.
    const { container } = mount();

    const heading = screen.getByRole('heading', { level: 1, name: NAME });
    const position = screen.getByText(POSITION);
    for (const line of [heading, position]) {
      expect(tokensOf(line)).toContain('text-center');
      expect(tokensOf(line)).toContain('@3xl:text-start');
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
    const { container } = mount({ align: 'center' });

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
  it('pins the axis and the two names the band refuses', () => {
    // The ALIGN Record gates widening at the source — these pins close the
    // other direction: a refactor that rebuilt the props onto a plain
    // intersection would compile, keep every render test green, and silently
    // reopen the naming hole. Erased to no-ops at runtime; they fail at
    // `tsc --noEmit` time, naming the property.
    expectTypeOf<DoctorIntroAlign>().toEqualTypeOf<
      'start' | 'lowered' | 'center' | 'end'
    >();
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
    expectTypeOf<DoctorIntroProps>().toHaveProperty('align');
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

  it('refuses the shapes the Omits and the union exist to refuse', () => {
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

    // @ts-expect-error — 'middle' is not a DoctorIntroAlign (D6)
    const middling: DoctorIntroProps = { ...PERSON, align: 'middle' };
    // @ts-expect-error — the intrinsic size is the reserved box (§11)
    const flatPhoto: DoctorIntroProps = { ...PERSON, photo: { src: 'x' } };
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
      middling,
      flatPhoto,
      named,
      labelled,
      pictureless,
      credoless,
      bodiless,
    ]).toHaveLength(7);
  });
});
