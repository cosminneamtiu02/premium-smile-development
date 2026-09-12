import { createRef, type Ref } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  Keyword,
  type KeywordProps,
  PersonnelCard,
  type PersonnelCardProps,
  type PersonnelKind,
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
// this repo follows. What needs real CSS — the justified quote, the muted ink,
// the ink-strong keywords, the language's own quotation marks and the two
// arrangements of the doctor row — is asserted one tier up, in
// PersonnelCard.stories.tsx's play functions.
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

// ── FIXTURES. One committed demo portrait (600×800, the 3:4 headshot ratio of
// D3 — synthetic silhouettes, no real people, nothing to license) and the two
// people the story file uses, so a failure here reads like the picture there.
const PHOTO: PersonnelPhoto = {
  src: 'images/demo/portrait-1.jpg',
  width: 600,
  height: 800,
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

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to an atom's constant, which an import would follow (the
// ui/Eyebrow RECIPE convention).
//
// ui/Card's surface row is assembled from TOKENS on purpose, and the reason is
// mechanical rather than stylistic: tests/unit/card-single-spelling.test.ts
// fences src/ against any file outside ui/Card carrying the surface's
// contiguous geometry string, so spelling it here — even inside a test — would
// turn that src-wide fence red. Joining the tokens produces the same expected
// value while this file never contains the fenced spelling.
const CARD_SURFACE = [
  '@container',
  'flex',
  'flex-col',
  'gap-3',
  'rounded-md',
  'border',
  'border-line-subtle',
  'bg-surface',
  'p-6',
].join(' ');

/** ui/Heading's `title` step (its sizeClasses table). */
const TITLE_STEP = 'font-display text-xl text-ink-strong';
/** ui/Eyebrow's RECIPE constant. */
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
/** ui/Image's `framed` row (its variantClasses table). */
const FRAMED_RECIPE = 'h-full w-full rounded-xl object-cover';

/** The block, the row it takes at the wide step, and the quote's own dress —
 *  this section's three class strings, byte for byte (D6, D7, D8). */
const BLOCK = 'flex flex-col items-center gap-3 text-center';
const BLOCK_BESIDE = '@3xl:w-64 @3xl:shrink-0';
const ROW_START = '@3xl:flex-row @3xl:items-center @3xl:gap-8';
const ROW_END = '@3xl:flex-row-reverse @3xl:items-center @3xl:gap-8';
const QUOTE =
  'min-w-0 flex-1 text-lg text-ink-muted text-justify before:content-[open-quote] after:content-[close-quote]';

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

/** The layout <div> the Card's single child is, and the portrait block inside
 *  it (D7) — reached by structure because neither carries a role. */
const layoutOf = (container: HTMLElement): HTMLElement =>
  cardOf(container).firstElementChild as HTMLElement;
const blockOf = (container: HTMLElement): HTMLElement =>
  layoutOf(container).firstElementChild as HTMLElement;

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
      photo={PHOTO}
      about={ABOUT}
      {...(side ? { side } : {})}
    />,
  );

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
});

describe('PersonnelCard — ui/Card wears the surface, the article IS the card (D10)', () => {
  it('dresses the article in the surface tone byte-exactly', () => {
    // Byte exactness is the contract: an extra utility here would mean the
    // section had started restyling an atom's internals (§6.8), and a missing
    // one would mean the card had stopped composing ui/Card at all.
    const { container } = renderAuxiliary();

    expect(cardOf(container).className).toBe(CARD_SURFACE);
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
    // Never `preload`: that is the hero's LCP privilege (§10.6), and a page of
    // portraits fetched eagerly would compete with it.
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

  it('stacks portrait, name and position in that order, centred', () => {
    // Order matters to a screen reader as much as to the eye: face, name, role.
    const { container } = renderAuxiliary();

    const block = blockOf(container);
    expect(block.className).toBe(BLOCK);
    expect(block.children).toHaveLength(3);
    expect(block.children[0]).toContainElement(
      within(container).getByRole('presentation'),
    );
    expect(block.children[1]).toBe(
      screen.getByRole('heading', { level: 3, name: AUX_NAME }),
    );
    expect(block.children[2]).toBe(screen.getByText(AUX_ROLE));
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
});

describe('PersonnelCard — doctor: the block, then the words (D7, D8)', () => {
  it('renders the quote as a <blockquote> carrying the about node', () => {
    // The element is the semantics: these are the doctor's OWN words (ARIA
    // role `blockquote`), which is why the owner authors them in first person.
    const { container } = renderDoctor();

    const quote = screen.getByRole('blockquote');
    expect(quote.tagName).toBe('BLOCKQUOTE');
    expect(quote).toBe(container.querySelector('blockquote'));
    expect(quote.className).toBe(QUOTE);
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
        photo={PHOTO}
        about={ABOUT_TEXT}
      />,
    );

    const quote = screen.getByRole('blockquote');
    expect(quote.textContent).toBe(ABOUT_TEXT);
    expect(quote.textContent).not.toMatch(/[„”“«»"]/);
  });

  it('puts the block BEFORE the quote in the DOM — for both sides (D7)', () => {
    // Reading order is "who, then what they say" whichever way the wide row
    // faces; `side` is a visual-only mirror, so the DOM never moves.
    for (const side of ['start', 'end'] as const) {
      const { container, unmount } = renderDoctor(side);

      const layout = layoutOf(container);
      expect(layout.children).toHaveLength(2);
      expect(layout.children[0]).toBe(blockOf(container));
      expect(layout.children[1]).toBe(screen.getByRole('blockquote'));
      unmount();
    }
  });

  it('takes the wide-step row for `start` by default, and never both rows', () => {
    const { container } = renderDoctor();

    expect(layoutOf(container).className).toBe(
      `flex flex-col gap-6 ${ROW_START}`,
    );
    expect(tokensOf(layoutOf(container))).not.toContain(
      '@3xl:flex-row-reverse',
    );
    // The portrait block becomes a fixed 16rem column beside the words; the
    // quote absorbs the rest through min-w-0 flex-1 (in QUOTE above).
    expect(blockOf(container).className).toBe(`${BLOCK} ${BLOCK_BESIDE}`);
  });

  it('mirrors the row for side="end" — the same two companions, reversed', () => {
    const { container } = renderDoctor('end');

    expect(layoutOf(container).className).toBe(
      `flex flex-col gap-6 ${ROW_END}`,
    );
    expect(tokensOf(layoutOf(container))).not.toContain('@3xl:flex-row');
    expect(blockOf(container).className).toBe(`${BLOCK} ${BLOCK_BESIDE}`);
  });

  it('takes the start row for an explicit side={undefined} too (the ?? path)', () => {
    // A consumer computing `side` from an index may hand over undefined on
    // purpose; that is the default row, not a third state (G2 react).
    const { container } = render(
      <PersonnelCard
        kind="doctor"
        name={DOCTOR_NAME}
        position={DOCTOR_ROLE}
        photo={PHOTO}
        about={ABOUT}
        side={undefined}
      />,
    );

    expect(layoutOf(container).className).toBe(
      `flex flex-col gap-6 ${ROW_START}`,
    );
  });

  it('keeps every keyword dressed inside the quote (D9)', () => {
    renderDoctor();

    const keywords = screen.getByRole('blockquote').querySelectorAll('b');
    expect(keywords).toHaveLength(2);
    for (const keyword of keywords) {
      expect(keyword.className).toBe('font-normal text-ink-strong');
    }
  });
});

describe('Keyword — HTML’s key-word element (D9)', () => {
  it('renders a <b> at the running text’s weight, in the darkest ink', () => {
    // <b> because the spec's own example for it is "key words in a document
    // abstract"; font-normal because Preflight bolds <b> and the owner asked
    // for "not bold"; ink-strong because the fragments must read darker than
    // the muted quote around them.
    render(<Keyword>{ABOUT_PARTS.first}</Keyword>);

    const keyword = screen.getByText(ABOUT_PARTS.first);
    expect(keyword.tagName).toBe('B');
    expect(keyword.className).toBe('font-normal text-ink-strong');
  });

  it('merges the caller className LAST and spreads native props', () => {
    render(
      <Keyword className="whitespace-nowrap" lang="de" data-slot="keyword">
        Kieferorthopädie
      </Keyword>,
    );

    const keyword = screen.getByText('Kieferorthopädie');
    expect(keyword.className).toBe(
      'font-normal text-ink-strong whitespace-nowrap',
    );
    expect(keyword).toHaveAttribute('lang', 'de');
    expect(keyword).toHaveAttribute('data-slot', 'keyword');
  });

  it('accepts ref as a regular prop (React 19) — it is the <b>', () => {
    const keyword = createRef<HTMLElement>();
    render(<Keyword ref={keyword}>{ABOUT_PARTS.first}</Keyword>);

    expect(keyword.current?.tagName).toBe('B');
    expect(keyword.current).toHaveTextContent(ABOUT_PARTS.first);
  });

  it('claims no importance and no emphasis — it is neither', () => {
    // <strong> would claim importance, <em> stress, <mark> relevance to the
    // reader's current task; a speciality named in passing is none of those.
    const { container } = render(<Keyword>{ABOUT_PARTS.second}</Keyword>);

    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('em')).toBeNull();
    expect(container.querySelector('mark')).toBeNull();
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

  it('calls exactly ONE hook, and it is the server-safe useId (D11)', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports EXACTLY the four atoms it composes, plus lib/cx and react', () => {
    // The import surface is the guard that sees what a regex cannot: swapping
    // an atom for something with state would hydrate every page carrying this
    // card without tripping a single directive check. ui/Image is the one
    // island already accepted here (D11) and it is named on this list, so the
    // question gets asked out loud the day a fifth import arrives.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Card/Card',
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Image/Image',
      '@/lib/cx/cx',
      'react',
    ]);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive and no message key path (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way.
    const { container } = renderDoctor();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).toBe(
      `${DOCTOR_NAME}${DOCTOR_ROLE}${ABOUT_TEXT}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
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
    // The LAYOUT Record already gates widening at the source — these pins
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
    const PERSON = { name: DOCTOR_NAME, position: DOCTOR_ROLE, photo: PHOTO };

    // @ts-expect-error — an auxiliary card has no words to quote (D2)
    const quotedNurse: PersonnelCardProps = { ...AUX, about: ABOUT_TEXT };
    // @ts-expect-error — nothing to mirror without a quote (D2)
    const mirroredNurse: PersonnelCardProps = { ...AUX, side: 'end' };
    // @ts-expect-error — a doctor without the doctor's own words (D2)
    const silentDoctor: PersonnelCardProps = { ...PERSON, kind: 'doctor' };
    // @ts-expect-error — 'receptionist' is not a PersonnelKind (D2)
    const thirdKind: PersonnelCardProps = { ...PERSON, kind: 'receptionist' };
    // @ts-expect-error — the intrinsic size is the reserved box (§11, D3)
    const flatPhoto: PersonnelCardProps = { ...AUX, photo: { src: 'x' } };
    // @ts-expect-error — the article's name is the heading's alone (D4)
    const renamed: PersonnelCardProps = { ...AUX, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's (D4)
    const repaired: PersonnelCardProps = { ...AUX, 'aria-labelledby': 'x' };
    // @ts-expect-error — a keyword without its word (§8.1, D9)
    const wordless: KeywordProps = {};

    expect([
      quotedNurse,
      mirroredNurse,
      silentDoctor,
      thirdKind,
      flatPhoto,
      renamed,
      repaired,
      wordless,
    ]).toHaveLength(8);
  });
});
