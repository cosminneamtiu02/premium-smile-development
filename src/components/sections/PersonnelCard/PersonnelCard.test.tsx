import { createRef, type Ref } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Button, type ButtonVariant } from '@/components/ui/Button/Button';
import { Image } from '@/components/ui/Image/Image';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  PersonnelCard,
  type PersonnelCardProps,
  type PersonnelHeadingLevel,
  type PersonnelKind,
  type PersonnelLink,
  type PersonnelPhoto,
  type PersonnelSide,
} from './PersonnelCard';
import source from './PersonnelCard.tsx?raw';

// sections/PersonnelCard — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing test doubles as proof of accessible markup,
// and here that is half the contract — the card is an `article` NAMED by its
// own heading because the id really sits on the <h3>, the portrait carries no
// `img` role because its alt is deliberately empty (D3), and the doctor's words
// are a `blockquote` because they are the doctor's words (D8).
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the Wordmark/SectionHeading precedent).
// next-intl's hooks throw without one, so a green render proves what D1 states:
// this section calls no t() and owns no message key. Every string below is a
// FIXTURE the consuming band would have translated — Romanian with diacritics
// (§15.7), factual and first-person (CMSR: no superlatives, no promises).
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the justified quote, the faint ink,
// the lilac keywords, the language's own quotation marks, the doctor card's 3px
// frame and the 25px it still keeps to its content, the inset that adds
// nothing outside a ribbon and the two arrangements of the doctor card — is
// asserted one tier up, in PersonnelCard.stories.tsx's play functions.
//
// ── HARNESS NOTE — why a `process` shim, copied verbatim from Image.test.tsx
// with its reason. The `components` vitest project is bare Vite in a real
// chromium: no Next plugin, so nothing defines the `process` global. next/image
// reads `process.env.__NEXT_IMAGE_OPTS` at MODULE scope (image-component.js),
// so importing the real ExportedImage — which this card composes through
// ui/Image — throws "process is not defined" before a single test runs.
// vi.hoisted is the sanctioned pre-import seam (Vitest transforms static
// imports, so this really does execute first). Deliberately EMPTY env, not a
// copy of next.config.ts: with `__NEXT_IMAGE_OPTS` undefined next/image falls
// back to `imageConfigDefault` and the optimizer's own reads fall back to their
// documented defaults, i.e. the same shape the app ships, without this file
// pretending to be a second source of truth for the build config. Storybook's
// runner needs none of this: @storybook/nextjs-vite supplies the Next
// environment, which is why the stories tier stays clean.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

// ── HARNESS NOTE — the KEYWORD suite is NOT here any more. `Keyword` was this
// card's own D9 primitive until the doctor-pages run fired the promotion
// trigger D9 itself recorded; the atom and its four tests now live in
// src/components/ui/Keyword/. What stays below is the SECTION's half of that
// contract — a keyword handed to `about` arrives inside the quote still
// wearing the atom's two utilities — which is why the fixture imports the real
// component rather than a stand-in.
//
// ── FIXTURES. One committed demo portrait for the auxiliary (600×800, the 3:4
// headshot ratio of D3) and one committed demo CUTOUT for the doctor (900×1200,
// the same ratio, transparent — D17) — synthetic figures, no real people,
// nothing to license — and the two people the story file uses, so a failure
// here reads like the picture there.
const PHOTO: PersonnelPhoto = {
  src: '/images/demo/portrait-1.jpg',
  width: 600,
  height: 800,
};

const CUTOUT: PersonnelPhoto = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};

const DOCTOR_NAME = 'Dr. Elena Marin';
const DOCTOR_ROLE = 'Medic specialist ortodonție';
const AUX_NAME = 'Ioana Țepeș';
const AUX_ROLE = 'Asistentă medicală';

// The quote, in pieces, so the two <Keyword> fragments sit exactly where a
// t.rich('…', { k: (chunks) => <Keyword>{chunks}</Keyword> }) call would put
// them (D9) — and so the expected TEXT is assembled from the same pieces
// instead of being re-typed. Every part rides an expression container, which
// is what keeps JSX's whitespace trimming out of the assertion.
const ABOUT_PARTS = {
  lead: 'Lucrez în ',
  first: 'ortodonție',
  middle:
    ' de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ',
  second: 'ascultarea',
  tail: ' pacientului, apoi construim împreună un plan potrivit.',
};

const ABOUT_TEXT = Object.values(ABOUT_PARTS).join('');

const ABOUT = (
  <>
    {ABOUT_PARTS.lead}
    <Keyword>{ABOUT_PARTS.first}</Keyword>
    {ABOUT_PARTS.middle}
    <Keyword>{ABOUT_PARTS.second}</Keyword>
    {ABOUT_PARTS.tail}
  </>
);

// The doctor's ONE link (D17) — a finished href, already locale-prefixed by the
// band that built it, pointing at the doctor's own page, and a finished label in
// the doctor's own voice, which also leads the link's accessible name (§8.1, §9).
const PROFILE: PersonnelLink = {
  href: '/ro/team/elena-marin/',
  label: 'Mai multe despre mine',
};

/**
 * THE ACCESSIBLE NAME of a doctor's link — the label, then the person (D15's
 * EACH LINK NAMES ITSELF bullet). Composed here rather than typed out, so the
 * assertions below read "this label, on this card" and a renamed fixture moves
 * them both. The VISIBLE text is still the label alone, which every geometry
 * and face assertion keeps proving.
 */
const linkName = (label: string, name = DOCTOR_NAME): string =>
  `${label} ${name}`;

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to an atom's constant, which an import would follow (the
// ui/Eyebrow RECIPE convention).
//
// ui/Card's rows are assembled from TOKENS on purpose, and the reason is
// mechanical rather than stylistic: tests/unit/card-single-spelling.test.ts
// fences src/ against any file outside ui/Card carrying the surface's
// contiguous geometry string, so spelling it here — even inside a test — would
// turn that src-wide fence red. Joining the tokens produces the same expected
// value while this file never contains the fenced spelling.
/** ui/Card's geometry, corner row, tone clock and one tint — the bytes every
 *  tone row follows (its `cardGeometry` + `cornerClasses` + `cardClock`). */
const CARD_BASE = [
  '@container',
  'flex',
  'flex-col',
  'gap-3',
  // THE CORNER (owner 2026-10-01, §15.29): ui/Card's `corners="soft"` row on
  // BOTH kinds — the old doctor card's rounded-2xl, the 1rem token — in the
  // slot where every other card's `rounded-md` stands: the one moved token.
  'rounded-soft',
  // The TONE CROSSFADE utilities (ui/Card rework, reviews-deck run 2026-09-10):
  // paint fades on the shared --fade clock, geometry never moves. Part of the
  // atom's own `cardClock`, so a consumer's byte-pin carries them too.
  '[--fade:400ms]',
  'transition-[background-color,border-color]',
  'duration-(--fade)',
  'ease-in-out',
  'motion-reduce:transition-none',
  // The ONE TINT declarations (ui/Card, owner 2026-09-12): the solid accent,
  // then the opaque 20% mix behind a @supports gate — worn by every card,
  // read only by the `framed`/`emphasized` rows. Part of `cardClock` too.
  '[--card-tint:var(--color-accent-decorative)]',
  'supports-[color:color-mix(in_lab,red,red)]:[--card-tint:color-mix(in_srgb,var(--color-accent-decorative)_20%,var(--color-surface))]',
];

/** ui/Card's `surface` row (its toneClasses table) — the auxiliary tile's. */
const SURFACE_ROW = ['border', 'border-line-subtle', 'bg-surface', 'p-6'];

/** ui/Card's `framed` row — the doctor card's since D17's THE FRAME: the
 *  reviews deck's idle card, 3px of border over 1.5rem − 2px of padding. */
const FRAMED_ROW = [
  'border-[3px]',
  'border-(--card-tint)',
  'bg-surface',
  'p-[calc(1.5rem-2px)]',
];

const CARD_SURFACE = [...CARD_BASE, ...SURFACE_ROW].join(' ');
const CARD_FRAMED = [...CARD_BASE, ...FRAMED_ROW].join(' ');

/** ui/Heading's `title` step (its sizeClasses table). */
const TITLE_STEP = 'font-display text-xl text-ink-strong';
/** ui/Heading's `band` step (its sizeClasses table, run D48). */
const BAND_STEP = 'font-display text-3xl @md:text-4xl text-ink-strong';
/** ui/Eyebrow's RECIPE constant. */
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
/** ui/Image's `framed` row (its variantClasses table). */
const FRAMED_RECIPE = 'h-full w-full rounded-xl object-cover';
/** ui/Image's `artwork` row (its variantClasses table). */
const ARTWORK_RECIPE = 'h-auto max-w-full object-contain';

/**
 * ui/Button's own face, read off a rendered button rather than retyped: the
 * link wears the old services button's solid `lg` face (D17), so the pin has
 * to FOLLOW the atom — a solid variant re-tuned in ui/Button must move this
 * card's link with it, and a card that quietly stopped composing the atom must
 * fail here. Rendered and unmounted inside the helper so nothing of it
 * survives into the assertion's DOM.
 */
const buttonFace = (variant: ButtonVariant): string => {
  const { container, unmount } = render(
    <Button variant={variant} size="lg">
      {variant}
    </Button>,
  );
  const face = (container.firstElementChild as HTMLElement).className;
  unmount();
  return face;
};

/** The auxiliary's block and its name/position pair — this section's class
 *  strings, byte for byte (D6). */
const BLOCK = 'flex flex-col items-center gap-3 text-center';
const NAME_PAIR = 'flex flex-col items-center gap-3';

/** The doctor's rows (D17): the inset, the grid, which column each half takes,
 *  the block and the pair turned upward below the step, the cutout's cell, the
 *  three row placements, the quote's dress and the link's width — byte for
 *  byte. */
const INSET =
  '@container pt-[max(0px,calc(var(--ribbon-lane-top,1.5rem)_-_1.5rem))] px-[max(0px,calc(var(--ribbon-lane-side,1.5rem)_-_1.5rem))]';
const GRID = {
  start:
    'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-x-8 @3xl:gap-y-3',
  end: 'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:gap-x-8 @3xl:gap-y-3',
} satisfies Record<PersonnelSide, string>;
const COLUMN = {
  start: { block: '@3xl:col-start-1', words: '@3xl:col-start-2' },
  end: { block: '@3xl:col-start-2', words: '@3xl:col-start-1' },
} satisfies Record<PersonnelSide, Record<'block' | 'words', string>>;
const DOCTOR_BLOCK =
  'flex flex-col-reverse items-center gap-3 text-center @3xl:contents';
const DOCTOR_PAIR =
  'flex flex-col-reverse items-center gap-3 @3xl:flex-col @3xl:justify-self-center';
const PICTURE = 'w-72 max-w-full';
const PHOTO_CELL = '@3xl:row-start-1 @3xl:self-end @3xl:justify-self-center';
const TEXT_CELL = '@3xl:row-start-1 @3xl:self-center';
const BOTTOM = '@3xl:row-start-2 @3xl:self-center';
const QUOTE =
  'min-w-0 text-lg text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]';
const ACTION = 'mx-auto w-full max-w-md';

/** Every cell's full class string for one side — what the card must render. */
const doctorRows = (side: PersonnelSide) => ({
  grid: GRID[side],
  block: DOCTOR_BLOCK,
  picture: `${PICTURE} ${COLUMN[side].block} ${PHOTO_CELL}`,
  pair: `${DOCTOR_PAIR} ${COLUMN[side].block} ${BOTTOM}`,
  quote: `${QUOTE} ${COLUMN[side].words} ${TEXT_CELL}`,
  link: `${buttonFace('solid')} ${ACTION} ${COLUMN[side].words} ${BOTTOM}`,
});

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this component
 * is deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and the one hook it DOES have by name. Known limit, same as there: it strips
 * block comments and whole-line `//` comments, not a `//` trailing real code —
 * a shape this file does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The <article> — the card itself; everything else is found through a role. */
const cardOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

/** The auxiliary's layout <div> — the Card's single child — the portrait block
 *  inside it, and that block's two boxes, the portrait cell and the
 *  name/position pair (D6). Reached by structure because none of them carries
 *  a role. */
const layoutOf = (container: HTMLElement): HTMLElement =>
  cardOf(container).firstElementChild as HTMLElement;
const blockOf = (container: HTMLElement): HTMLElement =>
  layoutOf(container).firstElementChild as HTMLElement;
const portraitCellOf = (container: HTMLElement): HTMLElement =>
  blockOf(container).children[0] as HTMLElement;
const namePairOf = (container: HTMLElement): HTMLElement =>
  blockOf(container).children[1] as HTMLElement;

/** A doctor card's boxes (D7, D17), by structure for the same reason: the
 *  INSET is the article's one child, the GRID the inset's, and the grid holds
 *  the block, the quote and the link — the block holding the cutout's cell and
 *  the name/position pair. */
const doctorPartsOf = (container: HTMLElement) => {
  const inset = cardOf(container).firstElementChild as HTMLElement;
  const grid = inset.firstElementChild as HTMLElement;
  const block = grid.children[0] as HTMLElement;
  return {
    inset,
    grid,
    block,
    picture: block.children[0] as HTMLElement,
    pair: block.children[1] as HTMLElement,
  };
};

/** The two placement props the helpers below need to vary. A hyphenated
 *  attribute (`data-slot`) is exempt from excess-property checking in JSX but
 *  not in a typed object literal (TS2353), so the test that checks the prop
 *  SPREAD writes its own JSX instead of going through this shape. */
type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderAuxiliary = (placement: Placement = {}) =>
  render(
    <PersonnelCard
      kind="auxiliary"
      name={AUX_NAME}
      position={AUX_ROLE}
      photo={PHOTO}
      {...placement}
    />,
  );

const renderDoctor = (side?: PersonnelSide) =>
  render(
    <PersonnelCard
      kind="doctor"
      name={DOCTOR_NAME}
      position={DOCTOR_ROLE}
      photo={CUTOUT}
      about={ABOUT}
      profile={PROFILE}
      {...(side ? { side } : {})}
    />,
  );

/** The doctor's one link, found the way a screen reader lists it (D15). */
const theLink = (): HTMLElement =>
  screen.getByRole('link', { name: linkName(PROFILE.label) });

describe('PersonnelCard — an article named by the person (D4)', () => {
  it('names the card with the heading text alone, through aria-labelledby', () => {
    // The accessible NAME, computed by the browser — not an attribute we
    // placed. An id on the article instead of on the h3 would still "have" the
    // id somewhere and fail right here.
    const { container } = renderAuxiliary();

    const card = screen.getByRole('article', { name: AUX_NAME });
    expect(card.tagName).toBe('ARTICLE');
    expect(card).toBe(cardOf(container));
  });

  it('puts the id on the <h3>, never on the article', () => {
    const { container } = renderAuxiliary();

    const heading = screen.getByRole('heading', { level: 3, name: AUX_NAME });
    const id = heading.getAttribute('id') as string;
    expect(id).toBeTruthy();
    expect(document.getElementById(id)).toBe(heading);
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', id);
    expect(cardOf(container)).not.toHaveAttribute('id');
  });

  it('gives two cards on one page two different ids (useId, D4)', () => {
    // The Team band renders a grid of these; a hardcoded id would collide and
    // both articles would end up named by the first heading.
    render(
      <>
        <PersonnelCard
          kind="auxiliary"
          name={AUX_NAME}
          position={AUX_ROLE}
          photo={PHOTO}
        />
        <PersonnelCard
          kind="auxiliary"
          name="Andrei Șerban"
          position={AUX_ROLE}
          photo={PHOTO}
        />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 3 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('article', { name: AUX_NAME })).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: 'Andrei Șerban' }),
    ).toBeInTheDocument();
  });

  it('lets a caller id land on the article without touching the name pair', () => {
    // A page may anchor a card (#echipa-ioana); that id is the ARTICLE's, and
    // the heading keeps its own generated one so aria-labelledby still points
    // at the name (G2 react).
    const { container } = render(
      <PersonnelCard
        kind="auxiliary"
        name={AUX_NAME}
        position={AUX_ROLE}
        photo={PHOTO}
        id="echipa-ioana"
      />,
    );

    const card = cardOf(container);
    const heading = screen.getByRole('heading', { level: 3, name: AUX_NAME });
    expect(card.id).toBe('echipa-ioana');
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).not.toBe('echipa-ioana');
  });

  it('keeps the heading as the name when a caller WRITES `aria-labelledby` in JSX — the spread rides first (D10)', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so the attribute below COMPILES despite the Omit. The card's own
    // pair rides AFTER `{...rest}`, so the caller's loses — move the spread
    // below `aria-labelledby` and this test goes red (G2 react).
    const { container } = render(
      <PersonnelCard
        kind="auxiliary"
        name={AUX_NAME}
        position={AUX_ROLE}
        photo={PHOTO}
        aria-labelledby="nowhere"
      />,
    );

    const heading = screen.getByRole('heading', { level: 3, name: AUX_NAME });
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('names a DOCTOR card by its heading alone too', () => {
    // The link's own name borrows the heading (D15); the article's does not
    // borrow the link — its name is the person, nothing else.
    const { container } = renderDoctor();

    expect(screen.getByRole('article', { name: DOCTOR_NAME })).toBe(
      cardOf(container),
    );
  });
});

describe('PersonnelCard — ui/Card dresses the article, the article IS the card (D10, D17)', () => {
  it('dresses an AUXILIARY tile in the surface tone byte-exactly — untouched by THE FRAME', () => {
    // Byte exactness is the contract: an extra utility here would mean the
    // section had started restyling an atom's internals (§6.8), and a missing
    // one would mean the card had stopped composing ui/Card at all.
    const { container } = renderAuxiliary();

    expect(cardOf(container).className).toBe(CARD_SURFACE);
  });

  it('dresses a DOCTOR card in the FRAMED tone — the reviews deck’s idle card (D17’s THE FRAME)', () => {
    // "i want to use for this card the border of the non current review from
    // the review carrousel": ui/Card's `framed` row, byte for byte, and none
    // of the flat row's border or padding — a second border width or `p-*`
    // would leave the stylesheet's order to pick one. The ribbon's lanes still
    // ride the INSET, never the card: ui/Card refuses className as a padding
    // API, and `framed` spends the same 1.5rem + 1px per side on border and
    // padding as `surface` does (the Doctor stories measure it).
    const { container } = renderDoctor();

    const card = cardOf(container);
    expect(card.className).toBe(CARD_FRAMED);
    for (const flat of ['border', 'border-line-subtle', 'p-6']) {
      expect(tokensOf(card)).not.toContain(flat);
    }
  });

  it('frames the doctor card whichever way it faces and at either level (D17’s THE FRAME)', () => {
    // The tone is the KIND's, never the side's or the outline's.
    const { container } = render(
      <PersonnelCard
        kind="doctor"
        name={DOCTOR_NAME}
        position={DOCTOR_ROLE}
        photo={CUTOUT}
        about={ABOUT}
        profile={PROFILE}
        side="end"
        headingLevel={2}
      />,
    );

    expect(cardOf(container).className).toBe(CARD_FRAMED);
  });

  it('merges the caller className LAST, keeping the atom’s classes first', () => {
    // Order is the contract, not an accident: ui/slot.ts merges atom classes,
    // then Card's className, then the child element's — a deterministic
    // convention, NOT a cascade mechanism (attribute order never decides CSS
    // specificity), and §6.8 limits caller utilities to placement.
    const { container } = renderAuxiliary({ className: 'col-span-2' });

    expect(cardOf(container).className).toBe(`${CARD_SURFACE} col-span-2`);
  });

  it('owns no outer margin and no width of its own (§6.4)', () => {
    // A grid track or a max-w-* placement is the page's business (D10), and
    // ui/Card's D3 says the same one tier down.
    const { container } = renderDoctor();

    const tokens = tokensOf(cardOf(container));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^w-/.test(t))).toEqual([]);
  });

  it('accepts ref as a regular prop (React 19) — it is the <article>', () => {
    const card = createRef<HTMLElement>();
    renderAuxiliary({ ref: card });

    expect(card.current).toBeInstanceOf(HTMLElement);
    expect(card.current?.tagName).toBe('ARTICLE');
    expect(card.current).toContainElement(
      screen.getByRole('heading', { level: 3, name: AUX_NAME }),
    );
  });

  it('spreads remaining native props onto the article', () => {
    // `lang` is the shape the German stress story uses: CSS `hyphens: auto`
    // picks its dictionary from the ELEMENT's language (§15.14) and the
    // `quotes` property picks that language's own marks (D8) — one attribute
    // here reaches both, because both inherit.
    const { container } = render(
      <PersonnelCard
        kind="auxiliary"
        name={AUX_NAME}
        position={AUX_ROLE}
        photo={PHOTO}
        lang="de"
        data-slot="personnel-card"
      />,
    );

    const card = cardOf(container);
    expect(card).toHaveAttribute('lang', 'de');
    expect(card).toHaveAttribute('data-slot', 'personnel-card');
    expect(
      screen.getByRole('heading', { level: 3, name: AUX_NAME }),
    ).not.toHaveAttribute('lang');
  });
});

describe('PersonnelCard — the portrait, decorative by construction (D3)', () => {
  it('renders exactly one image, with an EMPTY alt and no img role', () => {
    // alt="" is the decision, not a missing string: the <h3> right below is
    // the person's accessible identity, so a portrait alt would be announced
    // back-to-back with the heading.
    const { container } = renderAuxiliary();

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.queryByRole('img')).toBeNull();
    const portrait = within(container).getByRole('presentation');
    expect(portrait.tagName).toBe('IMG');
    expect(portrait).toHaveAttribute('alt', '');
  });

  it('keeps the intrinsic size on the element — reserved space (§11)', () => {
    const { container } = renderAuxiliary();

    const portrait = within(container).getByRole('presentation');
    expect(portrait).toHaveAttribute('width', String(PHOTO.width));
    expect(portrait).toHaveAttribute('height', String(PHOTO.height));
    expect(portrait.getAttribute('src')).toContain('portrait-1');
    // Pinned to the OPTIMIZED pipeline rather than to mere existence: the
    // error-fallback loader emits a srcset too, but only the real one points
    // into the optimizer's folder — and synchronously after render the error
    // event cannot have fired yet (the ui/Image test's own note).
    expect(portrait.getAttribute('srcset')).toContain(
      'nextImageExportOptimizer',
    );
  });

  it('loads lazily — a team grid sits below the fold (§11)', () => {
    // Never `preload`: that is the LCP element's privilege (§10.6), and a page
    // of portraits fetched eagerly would compete with it — since D18 the types
    // refuse it on this kind outright.
    const { container } = renderAuxiliary();

    expect(within(container).getByRole('presentation')).toHaveAttribute(
      'loading',
      'lazy',
    );
  });

  it('declares its box with sizes="12rem" so the browser picks a small variant', () => {
    // Without it the browser assumes 100vw and downloads the 1080px file for a
    // 192px hole — a §10.6 Core-Web-Vitals concern, not a nicety.
    const { container } = renderAuxiliary();

    expect(within(container).getByRole('presentation')).toHaveAttribute(
      'sizes',
      '12rem',
    );
  });

  it('wears ui/Image’s framed recipe inside a 3:4 cell', () => {
    const { container } = renderAuxiliary();

    const portrait = within(container).getByRole('presentation');
    expect(portrait.className).toBe(FRAMED_RECIPE);
    // h-full + w-full + object-cover only mean "fill and crop" because the
    // PARENT fixes the ratio — one ratio for the whole team (§11).
    const cell = portrait.parentElement as HTMLElement;
    expect(tokensOf(cell)).toEqual(['aspect-3/4', 'w-48', 'max-w-full']);
  });
});

describe('PersonnelCard — the name, the position, the block (D4–D6)', () => {
  it('renders the name as an <h3> in ui/Heading’s title step, unhyphenatable', () => {
    renderAuxiliary();

    const heading = screen.getByRole('heading', { level: 3, name: AUX_NAME });
    expect(heading.tagName).toBe('H3');
    // The atom's row first, this section's one placement utility last: a
    // person's name never breaks at a syllable (§15.14's rider), it wraps
    // between words.
    expect(heading.className).toBe(`${TITLE_STEP} hyphens-none`);
    // Ș ș Ț ț ă â î survive the whole chain — queried by TEXT, because a role
    // query would still match a mangled name.
    expect(screen.getByText(AUX_NAME).textContent).toBe(AUX_NAME);
  });

  it('renders the position as ui/Eyebrow, centred per element and unhyphenatable', () => {
    renderAuxiliary();

    const position = screen.getByText(AUX_ROLE);
    expect(position.tagName).toBe('P');
    // text-center rides the ATOM's className because globals.css aligns every
    // <p> to `start` in the base layer and a declaration on the element beats
    // an inherited one — the per-element canon (§15.15 b), which is exactly
    // the case SectionHeading's KNOWN LIMIT paragraph reserved.
    expect(position.className).toBe(
      `${EYEBROW_RECIPE} hyphens-none text-center`,
    );
    // Uppercase is CSS, so the DOM keeps the authored sentence case — Ș/Ț case
    // mapping stays the browser's job.
    expect(position.textContent).toBe(AUX_ROLE);
  });

  it('stacks portrait, then the name/position pair, in that order, centred', () => {
    // Order matters to a screen reader as much as to the eye: face, name, role.
    // The pair sits in a box of its own (D6, amended by D15) so that the wide
    // step can place it as ONE grid cell beside the portrait's; below the step
    // the nesting is invisible — 12px between the two boxes, 12px inside the
    // pair, which is the single 12px column the card always had.
    const { container } = renderAuxiliary();

    const block = blockOf(container);
    expect(block.className).toBe(BLOCK);
    expect(block.children).toHaveLength(2);
    expect(portraitCellOf(container)).toContainElement(
      within(container).getByRole('presentation'),
    );

    const pair = namePairOf(container);
    expect(pair.className).toBe(NAME_PAIR);
    expect(pair.children).toHaveLength(2);
    expect(pair.children[0]).toBe(
      screen.getByRole('heading', { level: 3, name: AUX_NAME }),
    );
    expect(pair.children[1]).toBe(screen.getByText(AUX_ROLE));
  });
});

describe('PersonnelCard — auxiliary is the column alone (D2)', () => {
  it('renders NO blockquote at all', () => {
    const { container } = renderAuxiliary();

    expect(screen.queryByRole('blockquote')).toBeNull();
    expect(container.querySelector('blockquote')).toBeNull();
  });

  it('carries no wide-step row anywhere — nothing to sit beside', () => {
    const { container } = renderAuxiliary();

    for (const element of [
      cardOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^@3xl:/);
      }
    }
    expect(layoutOf(container).className).toBe('flex flex-col gap-6');
  });

  it('carries no inset and no ribbon marker — it is never wrapped (D17)', () => {
    // The lanes and the keep-outs are the doctor's seam to ui/Ribbon; a tile
    // in the auxiliary grid is never a station, so it reads neither.
    const { container } = renderAuxiliary();

    expect(container.querySelectorAll('[data-ribbon-keepout]')).toHaveLength(0);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toContain('--ribbon-lane');
    }
  });
});

describe('PersonnelCard — doctor: the inset the ribbon reads (D17)', () => {
  it('wraps the whole doctor card in ONE inset — the lanes less Card’s 1.5rem, a container of its own', () => {
    // ui/Card's `p-6` stays; the inset pads the DIFFERENCE, never below 0, so
    // outside a ribbon it adds nothing (the stories measure that) and inside
    // one the card's inset is the lane. Its own `@container` is what makes
    // `@3xl` and the name's `band` measure the box the grid really has.
    const { container } = renderDoctor();

    const card = cardOf(container);
    expect(card.children).toHaveLength(1);
    const { inset } = doctorPartsOf(container);
    expect(inset.className).toBe(INSET);
    expect(tokensOf(inset)[0]).toBe('@container');
    // Top and the two sides only: below, the card's own 1.5rem already IS
    // the lane (§15.26 — `max(1.5rem, lane)` on top and either side).
    const paddings = tokensOf(inset)
      .filter((t) => /^p[trblxy]?-/.test(t))
      .map((t) => t.slice(0, t.indexOf('-')));
    expect(paddings).toEqual(['pt', 'px']);
  });
});

describe('PersonnelCard — doctor: the block, the words, the link (D7, D17)', () => {
  it('runs block → quote → link in the DOM — for both sides (D7)', () => {
    // Reading order is "who, then what they say, then what you can do"
    // whichever way the wide grid faces; `side` moves COLUMNS, not children,
    // so the DOM never reorders.
    for (const side of ['start', 'end'] as const) {
      const { container, unmount } = renderDoctor(side);

      const { grid, block } = doctorPartsOf(container);
      expect(grid.children).toHaveLength(3);
      expect(grid.children[0]).toBe(block);
      expect(grid.children[1]).toBe(screen.getByRole('blockquote'));
      expect(grid.children[2]).toBe(theLink());
      // …and inside the block, the picture before the pair, the name before
      // the specialty — the phone's upward order is paint, never markup.
      const { picture, pair } = doctorPartsOf(container);
      expect(picture).toContainElement(
        within(container).getByRole('presentation'),
      );
      expect(pair.children[0]).toBe(
        screen.getByRole('heading', { level: 3, name: DOCTOR_NAME }),
      );
      expect(pair.children[1]).toBe(screen.getByText(DOCTOR_ROLE));
      unmount();
    }
  });

  it('lays out `start` by default — every cell byte for byte, and never the mirror', () => {
    const { container } = renderDoctor();

    const rows = doctorRows('start');
    const { grid, block, picture, pair } = doctorPartsOf(container);
    expect(grid.className).toBe(rows.grid);
    expect(tokensOf(grid)).not.toContain(
      '@3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
    );
    // The block DISSOLVES at the step so its two boxes become grid items of
    // their own (D15); below the step it paints upward (D17's phone order).
    expect(block.className).toBe(rows.block);
    expect(picture.className).toBe(rows.picture);
    expect(pair.className).toBe(rows.pair);
    expect(screen.getByRole('blockquote').className).toBe(rows.quote);
    expect(theLink().className).toBe(rows.link);
  });

  it('mirrors the columns for side="end" — the same grid, reversed', () => {
    // Every cell swaps column and nothing else: the rows, the alignments and
    // the DOM stay exactly as they are for `start` (D7's visual-only mirror).
    const { container } = renderDoctor('end');

    const rows = doctorRows('end');
    const { grid, block, picture, pair } = doctorPartsOf(container);
    expect(grid.className).toBe(rows.grid);
    expect(tokensOf(grid)).not.toContain(
      '@3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
    );
    expect(block.className).toBe(rows.block);
    expect(picture.className).toBe(rows.picture);
    expect(pair.className).toBe(rows.pair);
    expect(screen.getByRole('blockquote').className).toBe(rows.quote);
    expect(theLink().className).toBe(rows.link);
  });

  it('takes the start columns for an explicit side={undefined} too (the ?? path)', () => {
    // A consumer computing `side` from an index may hand over undefined on
    // purpose; that is the default arrangement, not a third state (G2 react).
    const { container } = render(
      <PersonnelCard
        kind="doctor"
        name={DOCTOR_NAME}
        position={DOCTOR_ROLE}
        photo={CUTOUT}
        about={ABOUT}
        profile={PROFILE}
        side={undefined}
      />,
    );

    const rows = doctorRows('start');
    expect(doctorPartsOf(container).grid.className).toBe(rows.grid);
    expect(doctorPartsOf(container).picture.className).toBe(rows.picture);
    expect(theLink().className).toBe(rows.link);
  });

  it('makes the name’s pair HUG its words at the step — a keep-out is what is painted (D17)', () => {
    // Stretched across its column, the pair's box marked empty space as a
    // keep-out and the ribbon cornered against it; `justify-self-center`
    // shrinks the box to its words. The stories measure the hug.
    const { container } = renderDoctor();

    expect(tokensOf(doctorPartsOf(container).pair)).toContain(
      '@3xl:justify-self-center',
    );
  });
});

describe('PersonnelCard — doctor: the cutout (D3, D17)', () => {
  it('renders exactly one picture, decorative, with an EMPTY alt', () => {
    const { container } = renderDoctor();

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.queryByRole('img')).toBeNull();
    const cutout = within(container).getByRole('presentation');
    expect(cutout.tagName).toBe('IMG');
    expect(cutout).toHaveAttribute('alt', '');
  });

  it('draws the whole cutout — ui/Image’s artwork recipe, never the framed crop', () => {
    // The doctor from the waist up, no background: cropping it into a 3:4
    // frame would cut the figure, and `artwork` draws the whole image.
    const { container } = renderDoctor();

    const cutout = within(container).getByRole('presentation');
    expect(cutout.className).toBe(ARTWORK_RECIPE);
    expect(cutout.parentElement).toBe(doctorPartsOf(container).picture);
  });

  it('keeps the cutout’s intrinsic size, declares an 18rem box and loads lazily (§11)', () => {
    const { container } = renderDoctor();

    const cutout = within(container).getByRole('presentation');
    expect(cutout).toHaveAttribute('width', String(CUTOUT.width));
    expect(cutout).toHaveAttribute('height', String(CUTOUT.height));
    expect(cutout.getAttribute('src')).toContain('cutout-1');
    expect(cutout.getAttribute('srcset')).toContain('nextImageExportOptimizer');
    // The cell is 18rem (`w-72`); `sizes` says so, or the browser assumes
    // 100vw and fetches a file five times too wide.
    expect(cutout).toHaveAttribute('sizes', '18rem');
    // Lazy unless a band asks otherwise (D18, the block below).
    expect(cutout).toHaveAttribute('loading', 'lazy');
  });
});

/** Every attribute of an element, name → value — an <img> compared attribute
 *  for attribute (D18). Read synchronously after render: ExportedImage swaps
 *  its src for the fallback only on the error event, a macrotask later (the
 *  ui/Image suite's own note). */
const attributesOf = (element: Element): Record<string, string | null> =>
  Object.fromEntries(
    element
      .getAttributeNames()
      .map((name): [string, string | null] => [
        name,
        element.getAttribute(name),
      ]),
  );

/** The one picture inside a rendered card — decorative, so `presentation`. */
const cutoutOf = (container: HTMLElement): HTMLElement =>
  within(container).getByRole('presentation');

/**
 * The cutout as this card rendered it BEFORE D18 — ui/Image with the card's
 * own six props and nothing else — mounted and unmounted inside the helper, so
 * "attribute for attribute what it is today" is a comparison, never a belief.
 */
const bareCutout = (): Record<string, string | null> => {
  const { container, unmount } = render(
    <Image
      variant="artwork"
      src={CUTOUT.src}
      width={CUTOUT.width}
      height={CUTOUT.height}
      alt=""
      sizes="18rem"
    />,
  );
  const attributes = attributesOf(cutoutOf(container));
  unmount();
  return attributes;
};

/** A doctor card with `preload` SPELLED OUT — `true`, or one of the two ways
 *  to write "not asked", `false` and `undefined` (D18). */
const renderDoctorPreload = (preload: boolean | undefined) =>
  render(
    <PersonnelCard
      kind="doctor"
      name={DOCTOR_NAME}
      position={DOCTOR_ROLE}
      photo={CUTOUT}
      about={ABOUT}
      profile={PROFILE}
      preload={preload}
    />,
  );

describe('PersonnelCard — doctor: eager only when the band asks (D18)', () => {
  it('loads LAZILY when not asked — and carries no `fetchpriority`', () => {
    // Home's case: the band sits under the Hero, whose picture is the LCP, so
    // every cutout waits for the scroll (§11).
    const cutout = cutoutOf(renderDoctor().container);

    expect(cutout).toHaveAttribute('loading', 'lazy');
    expect(cutout).not.toHaveAttribute('fetchpriority');
  });

  it('renders, when not asked, the very <img> it rendered before D18 — attribute for attribute', () => {
    // "Not asked" has three spellings — the prop left out, `false` and
    // `undefined` — and none may leave a trace on the picture. next/image
    // happens to default its own `preload` to false, but that is its code,
    // not this card's promise, so the promise is COMPARED with ui/Image
    // rendered with the card's own props and nothing else.
    const before = bareCutout();
    // Never vacuous: the reference really is the lazy picture.
    expect(before.loading).toBe('lazy');
    expect(before).not.toHaveProperty('fetchpriority');

    for (const mount of [
      () => renderDoctor(),
      () => renderDoctorPreload(false),
      () => renderDoctorPreload(undefined),
    ]) {
      const { container, unmount } = mount();
      expect(attributesOf(cutoutOf(container))).toEqual(before);
      unmount();
    }
  });

  it('preloads at high priority when the band asks — the page’s LCP element (§10.6)', () => {
    // sections/DoctorIntro's pair, one band over. `preload` reaches next/image
    // only through ExportedImage's `...rest` (the Hero suite's note), so the
    // ABSENCE of lazy is what proves the optimizer did not swallow it.
    const cutout = cutoutOf(renderDoctorPreload(true).container);

    expect(cutout).toHaveAttribute('fetchpriority', 'high');
    expect(cutout).not.toHaveAttribute('loading', 'lazy');
    // …and the pair's third effect: a preload link in the head for the SAME
    // srcset and `sizes`, so the browser fetches the variant this <img> will
    // pick before any layout exists. Asserted PRESENT only: React keeps one
    // link per srcset for the document's life, so an absence elsewhere in
    // this file would hang on test order — a lazy <img> is the order-free
    // proof that nothing asked for one (next/image links only from `preload`,
    // and `preload` is what turns lazy off).
    const link = [
      ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
    ].find(
      (element) =>
        element.getAttribute('imagesrcset') === cutout.getAttribute('srcset'),
    );
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect(link).toHaveAttribute('imagesizes', '18rem');
    expect(link).toHaveAttribute('fetchpriority', 'high');
  });

  it('changes exactly those two attributes — the same file, box and dress', () => {
    // The eager card is still the card: the same srcset and sizes (so the
    // preload fetches the variant the <img> uses), the same intrinsic size,
    // the artwork recipe, the empty alt. `loading` goes, `fetchpriority`
    // arrives, and nothing else moves.
    const { loading, ...lazy } = attributesOf(
      cutoutOf(renderDoctor().container),
    );
    const { fetchpriority, ...eager } = attributesOf(
      cutoutOf(renderDoctorPreload(true).container),
    );

    expect(loading).toBe('lazy');
    expect(fetchpriority).toBe('high');
    expect(eager).toEqual(lazy);
  });
});

describe('PersonnelCard — doctor: the name wears `band` at both levels (D4, D17)', () => {
  it('renders an <h3> by default, on the `band` step, unhyphenatable', () => {
    renderDoctor();

    const heading = screen.getByRole('heading', {
      level: 3,
      name: DOCTOR_NAME,
    });
    expect(heading.tagName).toBe('H3');
    expect(heading.className).toBe(`${BAND_STEP} hyphens-none`);
  });

  it('renders an <h2> for headingLevel={2} — the element follows the level, the step does not', () => {
    const { container } = render(
      <PersonnelCard
        kind="doctor"
        name={DOCTOR_NAME}
        position={DOCTOR_ROLE}
        photo={CUTOUT}
        about={ABOUT}
        profile={PROFILE}
        headingLevel={2}
      />,
    );

    const heading = screen.getByRole('heading', {
      level: 2,
      name: DOCTOR_NAME,
    });
    expect(heading.tagName).toBe('H2');
    expect(heading.className).toBe(`${BAND_STEP} hyphens-none`);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('dresses the specialty exactly as an auxiliary’s position (D5)', () => {
    renderDoctor();

    const position = screen.getByText(DOCTOR_ROLE);
    expect(position.tagName).toBe('P');
    expect(position.className).toBe(
      `${EYEBROW_RECIPE} hyphens-none text-center`,
    );
  });
});

describe('PersonnelCard — doctor: the quote (D8, D9)', () => {
  it('renders the quote as a <blockquote> carrying the about node', () => {
    // The element is the semantics: these are the doctor's OWN words (ARIA
    // role `blockquote`), which is why the owner authors them in first person.
    const { container } = renderDoctor();

    const quote = screen.getByRole('blockquote');
    expect(quote.tagName).toBe('BLOCKQUOTE');
    expect(quote).toBe(container.querySelector('blockquote'));
    // Its own dress plus the cell it takes at the step (the default side's) —
    // the two arrangements are pinned in full above.
    expect(quote.className).toBe(`${QUOTE} ${COLUMN.start.words} ${TEXT_CELL}`);
    // Both keyword fragments arrive as real <b> elements inside the quote.
    expect(within(quote).getAllByText(ABOUT_PARTS.first)[0].tagName).toBe('B');
    expect(quote.querySelectorAll('b')).toHaveLength(2);
  });

  it('holds the words and NOT the quotation marks (D8)', () => {
    // The marks are CSS generated content taken from the language's own
    // `quotes` value, so not one of them may live in a string — the owner's
    // rule, and what keeps five locales' punctuation out of the message files.
    render(
      <PersonnelCard
        kind="doctor"
        name={DOCTOR_NAME}
        position={DOCTOR_ROLE}
        photo={CUTOUT}
        about={ABOUT_TEXT}
        profile={PROFILE}
      />,
    );

    const quote = screen.getByRole('blockquote');
    expect(quote.textContent).toBe(ABOUT_TEXT);
    expect(quote.textContent).not.toMatch(/[„”“«»"]/);
  });

  it('keeps every keyword dressed inside the quote (ui/Keyword, D9 + D56 + D59 + D60)', () => {
    // The section's half of the promoted atom's contract: a fragment handed to
    // `about` arrives inside the blockquote still wearing the atom's own
    // utilities — a darker lilac and a little weight since D56 ("italic looks
    // stupid … use a darker lilla and just a little bold and drop italic"),
    // which replaced D55's italic, itself over D52's one round of bold — and
    // since D59 ("add just a little more bold and underline them maybe") a
    // touch heavier at 650 — the thin underline D59 added was dropped after one
    // look by D60 ("remove the underline"), the 650 and the violet kept. The
    // atom's own suite lives in ui/Keyword.
    renderDoctor();

    const keywords = screen.getByRole('blockquote').querySelectorAll('b');
    expect(keywords).toHaveLength(2);
    for (const keyword of keywords) {
      expect(keyword.className).toBe('font-[650] text-accent-strong');
    }
  });
});

describe('PersonnelCard — the doctor’s ONE link (D15, D17)', () => {
  it('renders exactly ONE link, to his own page, named with the person', () => {
    // A link, never a button: it goes to a page (§15.13 — a plain <a href>,
    // no router). The accessible NAME is the label AND the doctor, computed
    // by the browser out of the anchor's own text plus the card's heading
    // (D15) — so a rotor full of „Mai multe despre mine" becomes a rotor of
    // people.
    renderDoctor();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toBe(theLink());
    // The VISIBLE words are still the label alone — SC 2.5.3's leading
    // substring, so „click Mai multe despre mine" still matches (D15).
    expect(links[0].textContent).toBe(PROFILE.label);
    expect(links[0]).toHaveAttribute('href', PROFILE.href);
    expect(links[0].tagName).toBe('A');
    // No <button> anywhere: ui/Button's asChild renders no button of its own.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('wears the old services button’s solid `lg` face, then its width and its cell', () => {
    // "i want the button that was befroe vezi servicii" (D17). The face is
    // DERIVED from a rendered ui/Button, so a variant re-tuned in the atom
    // moves this card with it instead of turning a stale copy red; the card's
    // own four utilities ride after it (ui/slot.ts merges the child's last).
    renderDoctor();

    const tokens = tokensOf(theLink());
    expect(theLink().className.startsWith(buttonFace('solid'))).toBe(true);
    expect(tokens).not.toContain('border-cta');
    // As wide as the words up to 28rem, centred under them (the stories
    // measure it) — and a label that wraps stays centred (ui/Button).
    for (const token of ['mx-auto', 'w-full', 'max-w-md', 'text-center']) {
      expect(tokens).toContain(token);
    }
  });

  it('wires the anchor to ITSELF and then the heading (D15, the repeated-names fix)', () => {
    // The mechanism, read off the DOM rather than inferred from the computed
    // name: `aria-labelledby` lists the anchor's OWN id first — whose
    // name-from-content is the visible label — and the card's <h3> second. A
    // pair written the other way round would read "Dr. Elena Marin Mai multe
    // despre mine" and break SC 2.5.3's leading substring.
    const { container } = renderDoctor();

    const headingId = screen.getByRole('heading', {
      level: 3,
      name: DOCTOR_NAME,
    }).id;
    const anchor = theLink();
    const id = anchor.getAttribute('id') as string;
    expect(id).toBeTruthy();
    expect(id).not.toBe(headingId);
    expect(container.querySelectorAll(`#${CSS.escape(id)}`)).toHaveLength(1);
    expect(anchor).toHaveAttribute('aria-labelledby', `${id} ${headingId}`);
    // …and the COMPUTED name, which is the assertion that would catch a
    // self-reference an engine refused to resolve — plus SC 2.5.3 itself:
    // the name begins with the words a visitor can see and say.
    expect(anchor).toHaveAccessibleName(linkName(PROFILE.label));
    expect(
      linkName(PROFILE.label).startsWith(anchor.textContent as string),
    ).toBe(true);
    expect(anchor.getAttribute('aria-label')).toBeNull();
  });

  it('places the link AFTER the words (D15 reading order)', () => {
    renderDoctor();

    const quote = screen.getByRole('blockquote');
    expect(
      quote.compareDocumentPosition(theLink()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('gives two doctor cards on one page two different link ids', () => {
    // A roster renders several; each link must name ITS person.
    render(
      <>
        <PersonnelCard
          kind="doctor"
          name={DOCTOR_NAME}
          position={DOCTOR_ROLE}
          photo={CUTOUT}
          about={ABOUT_TEXT}
          profile={PROFILE}
        />
        <PersonnelCard
          kind="doctor"
          name="Dr. Andrei Șerban"
          position="Medic dentist, chirurgie orală"
          photo={CUTOUT}
          about={ABOUT_TEXT}
          profile={{ href: '/ro/team/andrei-serban/', label: PROFILE.label }}
          side="end"
        />
      </>,
    );

    const first = theLink();
    const second = screen.getByRole('link', {
      name: linkName(PROFILE.label, 'Dr. Andrei Șerban'),
    });
    expect(first.id).not.toBe(second.id);
    expect(second).toHaveAttribute('href', '/ro/team/andrei-serban/');
  });

  it('renders NO link at all on an auxiliary card', () => {
    // `profile` is typed `never` on that branch (D2, D17) — this is the
    // runtime shadow of the type error a real call site would get.
    renderAuxiliary();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('PersonnelCard — the ribbon’s seam: four literal keep-outs (§15.26, D17)', () => {
  it('marks the cutout’s cell, the name’s pair, the words and the link — nothing else', () => {
    const { container } = renderDoctor();

    const { picture, pair } = doctorPartsOf(container);
    const expected = [picture, pair, screen.getByRole('blockquote'), theLink()];
    const marked = [...container.querySelectorAll('[data-ribbon-keepout]')];
    // Identity, in document order — not merely four look-alikes.
    expect(marked).toHaveLength(expected.length);
    for (const [index, block] of marked.entries()) {
      expect(block).toBe(expected[index]);
    }
    expect(picture).toHaveAttribute('data-ribbon-keepout', 'portrait');
    for (const block of marked.slice(1)) {
      expect(block).toHaveAttribute('data-ribbon-keepout', '');
    }
  });

  it('keeps EVERY word of a doctor card inside a keep-out — the census the mount owes (§15.26)', () => {
    // The ribbon keeps out of what is MARKED; a word outside every marker is a
    // word the ribbon may paint over. Walked over the text nodes themselves,
    // so a new label, a badge or a caption added later cannot slip in unseen.
    const { container } = renderDoctor();

    const card = cardOf(container);
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    const words: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if ((node.textContent ?? '').trim() !== '') words.push(node as Text);
    }
    // Never vacuous: the name, the specialty, the quote's five pieces and the
    // label — and together they ARE the card's whole text.
    expect(words.length).toBeGreaterThanOrEqual(8);
    expect(words.map((word) => word.textContent).join('')).toBe(
      card.textContent,
    );
    for (const word of words) {
      const keepout = word.parentElement?.closest('[data-ribbon-keepout]');
      expect(keepout, word.textContent ?? '').toBeInstanceOf(HTMLElement);
      expect(card).toContainElement(keepout as HTMLElement);
      // …and never the picture's: its keep-out is inset to the central
      // 60 % × 70 % of the cell (lib/ribbon-layout), which no word may need.
      expect(keepout).not.toHaveAttribute('data-ribbon-keepout', 'portrait');
    }
  });

  it('spells the four markers as LITERAL attributes in the source — no imported constant', () => {
    // The seam is the attribute's name, written where the card is written
    // (ui/Ribbon's THE SEAM TO A CARD); the import pin below proves no lib
    // constant stands in for it.
    expect(CODE.match(/data-ribbon-keepout="portrait"/g)).toHaveLength(1);
    expect(CODE.match(/data-ribbon-keepout=""/g)).toHaveLength(3);
    expect(CODE.match(/data-ribbon-keepout/g)).toHaveLength(4);
  });
});

describe('PersonnelCard — container steps only, zero islands (D7, D11)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    // Container variants (@3xl:) are the allowed shape: they measure the CARD,
    // which is what makes the same card right in a grid track and in a
    // full-width band.
    const { container } = renderDoctor('end');

    for (const element of [
      cardOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });

  it('ships NO client directive — the card is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls ONE KIND of hook, and it is the server-safe useId (D11)', () => {
    // Two calls since D17 — the heading's id and the link's (D15) — but still
    // only useId: what the guard is for is a STATEFUL hook arriving, which
    // would make this card an island on every page that renders it.
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
    expect(hooks).toHaveLength(2);
  });

  it('imports EXACTLY the five atoms it composes, plus lib/cx, a lib TYPE and react', () => {
    // The import surface is the guard that sees what a regex cannot: swapping
    // an atom for something with state would hydrate every page carrying this
    // card without tripping a single directive check. ui/Image is the one
    // island already accepted here (D11) and it is named on this list, so the
    // question gets asked out loud the day a sixth import arrives.
    // ui/Button joined with D15's links and is server-safe; ui/Keyword is
    // deliberately ABSENT even though D9 points at it — a consumer's fragments
    // are already rendered by the time `about` reaches this file — and so is
    // lib/ribbon-layout: the keep-out markers are literal attributes (D17).
    // lib/image-path joined on 2026-09-21 and is a TYPE-ONLY module (D3): it
    // erases at build time and carries no runtime at all, which is what lets a
    // section reach into §4's foundation ring for it.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Button/Button',
      '@/components/ui/Card/Card',
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Image/Image',
      '@/lib/cx/cx',
      '@/lib/image-path/image-path',
      'react',
    ]);
    // …and it arrives `import type`, never as a value.
    expect(CODE).toMatch(
      /^import type \{[^}]*\bImagePath\b[^}]*\} from '@\/lib\/image-path\/image-path';$/m,
    );
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders no message key path, and nothing interactive but the one link (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way. The link's label is
    // a FIXTURE the band would have translated — the only text in the card
    // beyond the person's own (D17).
    const { container } = renderDoctor();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.textContent).toBe(
      `${DOCTOR_NAME}${DOCTOR_ROLE}${ABOUT_TEXT}${PROFILE.label}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });

  it('keeps an auxiliary card free of anything interactive at all', () => {
    const { container } = renderAuxiliary();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).toBe(`${AUX_NAME}${AUX_ROLE}`);
  });
});

/** The union's two branches, for pins that must hold on EACH of them: a
 *  property pinned absent on the union is only proven absent from the keys
 *  the branches SHARE (`keyof (A | B)`), so a leak into one branch alone
 *  would slip past a union-level pin (G2 typescript). */
type AuxiliaryCard = Extract<PersonnelCardProps, { kind: 'auxiliary' }>;
type DoctorCard = Extract<PersonnelCardProps, { kind: 'doctor' }>;

describe('PersonnelCard — type-level pins (D2)', () => {
  it('pins the two unions so a refactor cannot quietly widen them', () => {
    // The Record tables already gate widening at the source — these pins
    // close the other direction: a refactor that rebuilt the props type onto a
    // plain intersection would compile, keep every render test green, and
    // silently reopen both the swallowed-children hole and the
    // quote-on-a-nurse one. Erased to no-ops at runtime; they fail at
    // `tsc --noEmit` time, naming the property.
    expectTypeOf<PersonnelKind>().toEqualTypeOf<'auxiliary' | 'doctor'>();
    expectTypeOf<PersonnelSide>().toEqualTypeOf<'start' | 'end'>();
    expectTypeOf<AuxiliaryCard>().not.toHaveProperty('children');
    expectTypeOf<DoctorCard>().not.toHaveProperty('children');
    // The ARIA name is this component's (D4): neither attribute may arrive
    // from a caller — one would replace the pair, the other would be ignored.
    expectTypeOf<AuxiliaryCard>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<DoctorCard>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<AuxiliaryCard>().not.toHaveProperty('aria-label');
    expectTypeOf<DoctorCard>().not.toHaveProperty('aria-label');
  });

  it('pins `profile` as the doctor’s, REQUIRED there and refused elsewhere (D17)', () => {
    // Required, not optional: a doctor card without its link would be a
    // different card, and `toEqualTypeOf` over the branch's own property is
    // what distinguishes required from `PersonnelLink | undefined`.
    expectTypeOf<DoctorCard>().toHaveProperty('profile');
    expectTypeOf<DoctorCard['profile']>().toEqualTypeOf<PersonnelLink>();
    expectTypeOf<PersonnelLink>().toEqualTypeOf<
      Readonly<{ href: string; label: string }>
    >();
    // On the auxiliary branch the key exists ONLY as `never` (the D2 shape:
    // an optional `never` is what makes a wrong call site fail at the
    // property rather than at the whole object).
    expectTypeOf<AuxiliaryCard['profile']>().toEqualTypeOf<undefined>();
  });

  it('pins `preload` as the doctor’s, OPTIONAL there and refused elsewhere (D18)', () => {
    // Optional with a false default: a card on Home, and every card after the
    // first on the Team page, simply leaves it out — `renderDoctor()` above
    // does, so its compiling IS the optional half of the pin.
    expectTypeOf<DoctorCard['preload']>().toEqualTypeOf<boolean | undefined>();
    // On the auxiliary branch the key exists ONLY as `never` (the D2 shape).
    expectTypeOf<AuxiliaryCard['preload']>().toEqualTypeOf<undefined>();
  });

  it('pins `photo` as a Readonly triple, like the link shape beside it (D3)', () => {
    // Readonly like PersonnelLink (G2-R2 typescript F4): a prop is the
    // caller's value, never this card's to write. `toEqualTypeOf` compares
    // readonly modifiers too, so the negative pin is not vacuous. And exactly
    // three fields: D3's RE-OPEN TRIGGER (`photo.alt`, additive) is the day
    // this pin moves, on purpose.
    expectTypeOf<PersonnelPhoto>().toEqualTypeOf<
      Readonly<{ src: ImagePath; width: number; height: number }>
    >();
    expectTypeOf<PersonnelPhoto>().not.toEqualTypeOf<{
      src: ImagePath;
      width: number;
      height: number;
    }>();
  });

  it('does carry the surface those pins are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin above would pass while proving
    // nothing (an `any` is caught by the negatives themselves — `keyof any`
    // extends every key — so `{}` is the one shape this guard exists for).
    expectTypeOf<PersonnelCardProps>().toHaveProperty('kind');
    expectTypeOf<PersonnelCardProps>().toHaveProperty('name');
    expectTypeOf<PersonnelCardProps>().toHaveProperty('position');
    expectTypeOf<PersonnelCardProps>().toHaveProperty('photo');
    expectTypeOf<PersonnelCardProps>().toHaveProperty('className');
  });

  it('refuses the shapes the discriminant and the Omits exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the union
    // loosens. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent).
    const AUX = {
      kind: 'auxiliary',
      name: AUX_NAME,
      position: AUX_ROLE,
      photo: PHOTO,
    } satisfies PersonnelCardProps;
    const PERSON = { name: DOCTOR_NAME, position: DOCTOR_ROLE, photo: CUTOUT };

    // @ts-expect-error — an auxiliary card has no words to quote (D2)
    const quotedNurse: PersonnelCardProps = { ...AUX, about: ABOUT_TEXT };
    // @ts-expect-error — nothing to mirror without a quote (D2)
    const mirroredNurse: PersonnelCardProps = { ...AUX, side: 'end' };
    // @ts-expect-error — a page of one's own is a doctor's (D2, D17)
    const linkedNurse: PersonnelCardProps = { ...AUX, profile: PROFILE };
    // @ts-expect-error — no page opens on a staff tile: no eager path (D2, D18)
    const eagerNurse: PersonnelCardProps = { ...AUX, preload: true };
    // @ts-expect-error — a doctor without the doctor's own words (D2)
    const silentDoctor: PersonnelCardProps = {
      ...PERSON,
      kind: 'doctor',
      profile: PROFILE,
    };
    // @ts-expect-error — a doctor card always carries its link (D17)
    const linklessDoctor: PersonnelCardProps = {
      ...PERSON,
      kind: 'doctor',
      about: ABOUT_TEXT,
    };
    // @ts-expect-error — 'receptionist' is not a PersonnelKind (D2)
    const thirdKind: PersonnelCardProps = { ...PERSON, kind: 'receptionist' };
    // A WELL-FORMED path with no size: the refusal below is then about the
    // missing `width` / `height` alone, never about the path (G2 typescript).
    const SIZELESS = { src: '/images/x.jpg' } as const;
    // @ts-expect-error — the intrinsic size is the reserved box (§11, D3)
    const flatPhoto: PersonnelCardProps = { ...AUX, photo: SIZELESS };
    // @ts-expect-error — the article's name is the heading's alone (D4)
    const renamed: PersonnelCardProps = { ...AUX, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's (D4)
    const repaired: PersonnelCardProps = { ...AUX, 'aria-labelledby': 'x' };

    expect([
      quotedNurse,
      mirroredNurse,
      linkedNurse,
      eagerNurse,
      silentDoctor,
      linklessDoctor,
      thirdKind,
      flatPhoto,
      renamed,
      repaired,
    ]).toHaveLength(10);
  });
});

describe('PersonnelCard — the heading level is an additive axis (D4, 2026-09-21)', () => {
  it('defaults to an <h3> — the level under a band’s own h2', () => {
    renderAuxiliary();

    const heading = screen.getByRole('heading', { level: 3, name: AUX_NAME });
    expect(heading.tagName).toBe('H3');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('renders an <h2> for headingLevel={2}, still naming the article by it', () => {
    // The Team page's case: cards directly under the page <h1>, where a
    // level-3 title would skip a level (§9). The element AND the step change
    // (§15.24, 2026-09-26, amended the same day by run D45 and again by run
    // D48: a level-2 name wears Heading's `band` step — 30px under the
    // card's 28rem container step, 36px from it, never over the h1's phone
    // floor) — the id and the aria-labelledby pair stay exactly as they are.
    const { container } = render(
      <PersonnelCard
        kind="auxiliary"
        name={AUX_NAME}
        position={AUX_ROLE}
        photo={PHOTO}
        headingLevel={2}
      />,
    );

    const heading = screen.getByRole('heading', { level: 2, name: AUX_NAME });
    expect(heading.tagName).toBe('H2');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByRole('article', { name: AUX_NAME })).toBe(
      cardOf(container),
    );
    expect(heading.className).toBe(
      'font-display text-3xl @md:text-4xl text-ink-strong hyphens-none',
    );
  });

  it('offers exactly 2 | 3 — the union is the growth gate', () => {
    expectTypeOf<PersonnelCardProps['headingLevel']>().toEqualTypeOf<
      2 | 3 | undefined
    >();
    expectTypeOf<PersonnelHeadingLevel>().toEqualTypeOf<2 | 3>();
  });
});

describe('PersonnelCard — THE CORNER (owner 2026-10-01, §15.29)', () => {
  it.each([
    ['doctor', renderDoctor],
    ['auxiliary', renderAuxiliary],
  ] as const)(
    'gives a %s card the SOFT corner — the old doctor card’s rounded-2xl — and never a second radius',
    (_kind, renderKind) => {
      // "i want that rounded corner effect that the doctor card from old
      // webpage has" · "doctor cards mean also personell cards": ui/Card's
      // `corners="soft"` on BOTH kinds — `rounded-soft`, the 1rem token the
      // Header pill, ui/TextButton and ui/Modal wear too — in place of the 6px
      // `rounded-md` every other card keeps. Exactly ONE `rounded-*` on the
      // root: two would leave the stylesheet's order to pick the corner.
      const { container } = renderKind();

      const rounded = tokensOf(cardOf(container)).filter((t) =>
        /^rounded-/.test(t),
      );
      expect(rounded).toEqual(['rounded-soft']);
    },
  );
});
