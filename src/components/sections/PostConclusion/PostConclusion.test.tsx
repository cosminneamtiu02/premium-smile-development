import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
// The REAL stylesheet, for the blocks that MEASURE (PersonnelCard.test.tsx's
// precedent): the circle's clamp is a COMPUTED length — spacing steps against
// a share of its own caption — the crop is percentages of it, the quote
// mark's turn can only be read off what the engine paints, and the rules a
// condition gates (forced colours) are read off the CSSOM the sheet builds.
// tests/setup/components.ts loads no stylesheet; every other assertion here
// reads tokens, attributes and roles, which hold with the sheet or without it.
import '@/styles/globals.css';
import { QuoteMark } from '@/assets/glyphs/QuoteMark';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  PostConclusion,
  type PostConclusionOwnProps,
  type PostConclusionProps,
} from './PostConclusion';
import source from './PostConclusion.tsx?raw';
import personnelCardSource from '../PersonnelCard/PersonnelCard.tsx?raw';

// sections/PostConclusion — the interaction suite. Role-based queries wherever
// a role exists (§9, §13): the words are a `blockquote`, the block a `figure`.
// The CAPTION is reached by structure — the figure's last child — never by
// the figure's name: a <figcaption> names its <figure> by HTML-AAM's rule,
// which Chromium 151 does not apply (measured 2026-10-20; Firefox and WebKit
// not measured); a screen reader still reads the caption inside the figure.
// Testing Library's name computation (dom-accessibility-api) does not apply
// it either, while Playwright's role engine does — so a naming assertion
// would prove the rule as one test engine implements it, not the browser.
// The structure is what every engine reads the same.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the PostCard precedent): a green render
// proves this section calls no t().
//
// ── THE PICTURE IN THIS RUNNER: in CI the optimizer's variants do not exist
// yet (Vitest runs before the build), so the <img> 404s and the optimizer
// swaps to the original file on the error event, at a macrotask boundary; on
// a workstation after a build they do exist, and the variant loads. Every
// picture assertion reads attributes and LAYOUT boxes synchronously — never
// `decode()`, never a loaded bitmap (PostCard.test.tsx's rule) — so the box
// comes from `width`/`height`, not from the file, EXCEPT where an earlier
// render in this page has already loaded the file: then the picture is
// complete at once and its height follows the file's own ratio, a variant's
// rounded to a whole pixel (the crop test holds the height to half a pixel
// for it — measured 2026-10-21, when failing tests' screenshots gave a
// variant time to load).
//
// ── THE FIXTURES are the demo article's own (Romanian, diacritics — §15.7):
// its closing words and its author, lib/team's Dr. Nicu Elena Alina with her
// cutout — COPIED, never imported (a section's suite does not reach into
// site data).

/** The demo article's closing words. */
const TEXT =
  'O periuță moale, schimbată la timp și folosită cu răbdare, face mai mult pentru gingiile tale decât orice model scump. Dacă nu știi ce să alegi, adu-ți periuța la următoarea consultație și o alegem împreună.';

/** The demo article's author, as the route's populator hands her over. */
const DOCTOR = {
  name: 'Dr. Nicu Elena Alina',
  position: 'Medic specialist în parodontologie',
  photo: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
} as const satisfies PostConclusionOwnProps['doctor'];

// ── THE BYTE PINS, written OUT rather than imported (the ui/Eyebrow RECIPE
// convention): the suite must fail on a silent edit, which an import would
// follow.
const FIGURE =
  'grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-5 [&>svg]:size-12 [&>svg]:fill-current [&>svg]:rotate-180';
/** THE LINE — its colour, round ends and one-step thickness the share it
 *  keeps with sections/BeforeAfter; standing, its form this file's own. */
const LINE = 'w-1 self-stretch rounded-full bg-(--ribbon)';
const LINE_PLACE = 'row-span-3';
const MARK = 'text-(--ribbon) forced-colors:text-[color:GrayText]';
const QUOTE = 'text-xl font-medium text-ink-strong wrap-anywhere';
const SIGNATURE = 'flex flex-wrap items-center gap-4';
const CIRCLE =
  'relative aspect-square w-[clamp(calc(var(--spacing)*18),calc(100%_-_var(--spacing)*45),calc(var(--spacing)*28))] max-w-full shrink-0 overflow-hidden rounded-full bg-line-subtle supports-[color:color-mix(in_lab,red,red)]:bg-[var(--card-tint,var(--color-line-subtle))]';
/** THE RESERVE, in spacing steps: what the circle leaves the names wherever
 *  it can still give way — the 45 its clamp subtracts from the caption, less
 *  the signature's `gap-4` (PostConclusion.tsx's THE CIRCLE). */
const RESERVE = 41;
/** THE BASIS, in spacing steps: the names' flex basis — the narrowest their
 *  column ever is BESIDE the circle; where the caption cannot seat the
 *  circle, its gap and the basis, the names wrap under it (PostConclusion.
 *  tsx's UNDER THE FLOOR, THE NAMES WRAP). Half a step under THE RESERVE. */
const BASIS = 40.5;
/** The circle's floor and its full size, in spacing steps. */
const FLOOR = 18;
const FULL = 28;
/** The signature's gap, in spacing steps — beside the circle, and under it. */
const GAP = 4;
/** What the figure keeps beside the names besides the circle: the line (1),
 *  the air after it (6) and the signature's gap (4). */
const AROUND = 11;
const CROP =
  'absolute left-[-32.5%] top-[-18%] h-auto w-[165%] max-w-none object-contain';
const NAMES =
  'flex min-w-0 grow basis-[calc(var(--spacing)*40.5)] flex-col-reverse gap-1';
const BELT = 'hyphens-none wrap-anywhere';
const CIRCLE_SIZES = '(min-width: 70rem) and (pointer: fine) 14vw, 11.55rem';
/** ui/Heading's `title` step on its default ink. */
const TITLE_STEP = 'font-display text-xl text-ink-strong';
/** ui/Eyebrow's RECIPE, its `default` row. */
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
/** The QuoteMark glyph's own classes at its default `md` size. */
const GLYPH_OWN = 'size-6 shrink-0';

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const classOf = (element: Element): string =>
  element.getAttribute('class') ?? '';

/** The conclusion inside a box of `width` px — the figure fills the box, so
 *  the box decides every share of it inside (the circle's among them). */
const renderAt = (
  width: number,
  props: Partial<PostConclusionProps> = {},
): ReturnType<typeof render> =>
  render(
    <div style={{ width: `${width}px` }}>
      <PostConclusion text={TEXT} doctor={DOCTOR} {...props} />
    </div>,
  );

/** The figure's parts, reached by structure where they carry no role. */
const partsOf = (figure: HTMLElement) => {
  const children = [...figure.children] as HTMLElement[];
  const caption = children[3];
  const circle = caption?.children[0] as HTMLElement;
  const names = caption?.children[1] as HTMLElement;
  return {
    children,
    line: children[0] as HTMLElement,
    mark: children[1] as unknown as SVGSVGElement,
    quote: children[2] as HTMLElement,
    caption: caption as HTMLElement,
    circle,
    picture: circle.querySelector('img') as HTMLImageElement,
    names,
    name: names.children[0] as HTMLElement,
    specialty: names.children[1] as HTMLElement,
  };
};

const renderParts = (width = 640, props: Partial<PostConclusionProps> = {}) => {
  renderAt(width, props);
  return partsOf(screen.getByRole('figure'));
};

/** A layout box, read off the engine. */
const boxOf = (element: Element): DOMRect => element.getBoundingClientRect();

/** The root's spacing step — a quarter rem — in px, never a baked-in 4. */
const step = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) / 4;

/** A block of prose with no comments in it — what the source guards read. */
const codeOf = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** A container-query length: a number followed by one of the six units — and
 *  no further letter, but an underscore may follow: Tailwind spells a space
 *  inside an arbitrary value `_`, and `\b` sees no boundary there. */
const CONTAINER_UNIT = /\d(?:cqmin|cqmax|cq[iwhb])(?![a-z])/i;

/** Every style rule of the page's sheets, with the media conditions it sits
 *  under — the CSSOM walked, never a state forced (CardCarousel.geometry.
 *  test.tsx's reading). */
const styleRules = (): { rule: CSSStyleRule; media: string[] }[] => {
  const found: { rule: CSSStyleRule; media: string[] }[] = [];
  const walk = (rules: CSSRuleList, media: string[]): void => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        found.push({ rule, media });
        walk(rule.cssRules, media);
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, [...media, rule.conditionText]);
      } else if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, media);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, []);
    } catch {
      // A sheet from another origin cannot be read; none of ours is one.
    }
  }
  return found;
};

/** Whether `element` matches `selector` — false for one the engine cannot
 *  match against an element (a pseudo-element's, say), never a throw. */
const matchesSafely = (element: Element, selector: string): boolean => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

describe('PostConclusion — the shape: a quotation with its attribution', () => {
  it('is a <figure> holding the <blockquote> of the words and, as its LAST child, the <figcaption> that signs them — HTML’s own shape, the caption where HTML-AAM’s rule names the figure from (a rule Chromium 151 does not apply; a screen reader still reads the caption inside the figure)', () => {
    const { children, quote, caption } = renderParts();
    const figure = screen.getByRole('figure');
    expect(figure.tagName).toBe('FIGURE');
    expect(within(figure).getByRole('blockquote')).toBe(quote);
    expect(quote.tagName).toBe('BLOCKQUOTE');
    expect(quote.children).toHaveLength(1);
    expect(quote.firstElementChild?.tagName).toBe('P');
    expect(quote).toHaveTextContent(TEXT);
    // The caption is the figure's own LAST child — never nested deeper, where
    // the HTML parser's rules and a screen reader's figure would lose it.
    expect(caption.tagName).toBe('FIGCAPTION');
    expect(figure.lastElementChild).toBe(caption);
    expect(caption.parentElement).toBe(figure);
    expect(figure.querySelectorAll('figcaption')).toHaveLength(1);
    expect(children.map((child) => child.tagName.toLowerCase())).toEqual([
      'span',
      'svg',
      'blockquote',
      'figcaption',
    ]);
  });

  it('meets a screen reader in reading order: the two decorations first and hidden, then the words, then who said them — the NAME before the specialty', () => {
    const { line, mark, caption, name, specialty } = renderParts();
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line).toBeEmptyDOMElement();
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).not.toHaveAttribute('role');
    expect(name).toHaveTextContent(DOCTOR.name);
    expect(specialty).toHaveTextContent(DOCTOR.position);
    expect(
      name.compareDocumentPosition(specialty) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The caption's whole text, in DOM order — what HTML-AAM's rule names the
    // figure by, and what a screen reader reads inside it either way.
    expect(caption.textContent).toBe(`${DOCTOR.name}${DOCTOR.position}`);
  });

  it('signs with a <p>, never an outline heading — a signature opens no part of the article', () => {
    const { name, specialty } = renderParts();
    expect(screen.queryAllByRole('heading')).toEqual([]);
    expect(name.tagName).toBe('P');
    expect(specialty.tagName).toBe('P');
  });

  it('leaves the photo unnamed — alt "", the name beside it is the identity (PersonnelCard D3) — lazy, with the derived `sizes`', () => {
    const { picture } = renderParts();
    const figure = screen.getByRole('figure');
    expect(picture).toHaveAttribute('alt', '');
    // alt "" makes the <img> presentational and the mark is aria-hidden: the
    // figure exposes no image at all.
    expect(within(figure).queryAllByRole('img')).toEqual([]);
    expect(picture).toHaveAttribute('loading', 'lazy');
    expect(picture).not.toHaveAttribute('fetchpriority');
    expect(picture).toHaveAttribute('sizes', CIRCLE_SIZES);
    expect(picture).toHaveAttribute('width', '900');
    expect(picture).toHaveAttribute('height', '1200');
    expect(picture.getAttribute('srcset') ?? '').toContain('cutout-1');
  });
});

describe('PostConclusion — the classes, byte for byte', () => {
  it('lays the figure out as a grid — no container, nothing queries one — and shapes the quote mark from there (the glyph README’s sizing rule)', () => {
    const { line, mark, quote, caption, circle, picture, names, name } =
      renderParts();
    expect(classOf(screen.getByRole('figure'))).toBe(FIGURE);
    expect(classOf(line)).toBe(`${LINE} ${LINE_PLACE}`);
    // The glyph keeps its OWN md size class — no `size-*` rides its
    // className; the figure's `[&>svg]:size-12` outranks it.
    expect(classOf(mark)).toBe(`${GLYPH_OWN} ${MARK}`);
    expect(classOf(mark).match(/(^|\s)size-/g)).toHaveLength(1);
    expect(classOf(quote.firstElementChild as Element)).toBe(QUOTE);
    expect(classOf(caption)).toBe(SIGNATURE);
    expect(classOf(circle)).toBe(CIRCLE);
    expect(classOf(picture)).toBe(CROP);
    expect(classOf(names)).toBe(NAMES);
    expect(classOf(name)).toBe(`${TITLE_STEP} ${BELT}`);
  });

  it('dresses the specialty in ui/Eyebrow’s one step, start-aligned, with the belt', () => {
    const { specialty } = renderParts();
    expect(classOf(specialty)).toBe(`${EYEBROW_RECIPE} ${BELT}`);
  });

  it('spells THE LINE with the share it keeps with sections/BeforeAfter — `rounded-full bg-(--ribbon)` and the one-step thickness — in its own standing form', () => {
    // The two files share the colour, the round ends and the thickness and
    // nothing else (tests/unit/article-line-sync.test.ts holds the pair);
    // the stretch and the three rows are this figure's.
    const { line } = renderParts();
    const tokens = classOf(line).split(/\s+/);
    for (const token of ['rounded-full', 'bg-(--ribbon)', 'w-1']) {
      expect(tokens).toContain(token);
    }
    // No flex shrink guard: a grid item never reads one. Asked BEFORE the
    // byte pin, which would also refuse one, so a guard that comes back fails
    // here, by name.
    expect(
      tokens.filter((token) => token.startsWith('shrink')),
      'a flex shrink guard on a grid item',
    ).toEqual([]);
    expect(tokens).toEqual([...LINE.split(' '), LINE_PLACE]);
  });
});

/** A `const NAME =` string of a source file, by its name. */
const constantOf = (text: string, name: string): string => {
  const found = new RegExp(`const ${name} =\\s*'([^']*)'`).exec(text)?.[1];
  if (found === undefined) {
    throw new Error(`PostConclusion test: no const ${name} in the source`);
  }
  return found;
};

/** PersonnelCard's phone header variants — every token its D20 adds opens
 *  with both (its THE STEP and THE FLOOR). */
const PHONE = '@min-[12.5rem]:@max-sm:';

/** The tokens of a PersonnelCard constant that carry the phone variants,
 *  with the variants taken off. */
const phoneTokens = (text: string): string[] =>
  text
    .split(/\s+/)
    .filter((token) => token.startsWith(PHONE))
    .map((token) => token.slice(PHONE.length));

describe('PostConclusion — KEEP IN SYNC with PersonnelCard’s phone circle (read from its source)', () => {
  const theirCircle = phoneTokens(constantOf(personnelCardSource, 'CIRCLE'));
  const theirFigure = phoneTokens(constantOf(personnelCardSource, 'FIGURE'));
  const ourCircle = constantOf(source, 'CIRCLE').split(/\s+/);
  const ourCrop = constantOf(source, 'CROP').split(/\s+/);

  it('reads both constants (never vacuous)', () => {
    // PHONE is PersonnelCard's D20 step, spelled here by hand: the day that
    // card moves its phone header to another step, these read nothing — and
    // say so, rather than a bare "0 ≥ 5".
    expect(
      theirCircle.length,
      `PersonnelCard’s CIRCLE has no token under ${PHONE} — did its D20 phone step move? Re-read PHONE here`,
    ).toBeGreaterThanOrEqual(5);
    expect(
      theirFigure.length,
      `PersonnelCard’s FIGURE has no token under ${PHONE} — did its D20 phone step move? Re-read PHONE here`,
    ).toBeGreaterThanOrEqual(5);
    // Our constants ARE what renders.
    const { circle, picture } = renderParts();
    expect(classOf(circle)).toBe(ourCircle.join(' '));
    expect(classOf(picture)).toBe(ourCrop.join(' '));
  });

  it('paints the SAME ground: ui/Card’s tint behind its colour-mix gate, the light grey without it and as the variable’s own fallback — and clips the SAME round, positioned cell', () => {
    const tint = [
      'bg-line-subtle',
      'supports-[color:color-mix(in_lab,red,red)]:bg-[var(--card-tint,var(--color-line-subtle))]',
    ];
    const clip = ['relative', 'overflow-hidden', 'rounded-full'];
    for (const token of [...tint, ...clip]) {
      expect(theirCircle, `PersonnelCard’s CIRCLE: ${token}`).toContain(token);
      expect(ourCircle, `our CIRCLE: ${token}`).toContain(token);
    }
    // Every other circle token of theirs is its SIZE, which differs on
    // purpose (THE CIRCLE's size paragraph): a clamp read off the INSET there,
    // spacing steps read off this figure here.
    const rest = theirCircle.filter(
      (token) => ![...tint, ...clip].includes(token),
    );
    expect(rest).toHaveLength(1);
    expect(rest[0]).toMatch(/^size-\[clamp\(/);
  });

  it('crops the SAME head and shoulders: 165 % of the circle, 32.5 % out to the left, 18 % above — every crop token theirs too', () => {
    const crop = [
      'absolute',
      'left-[-32.5%]',
      'top-[-18%]',
      'w-[165%]',
      'max-w-none',
    ];
    for (const token of crop) {
      expect(theirFigure, `PersonnelCard’s FIGURE: ${token}`).toContain(token);
      expect(ourCrop, `our CROP: ${token}`).toContain(token);
    }
    expect(theirFigure.toSorted()).toEqual(crop.toSorted());
    // The three numbers, read off both files.
    const numbers = (tokens: readonly string[]) => ({
      left: tokens.find((token) => token.startsWith('left-')),
      top: tokens.find((token) => token.startsWith('top-')),
      width: tokens.find((token) => token.startsWith('w-')),
    });
    expect(numbers(ourCrop)).toEqual(numbers(theirFigure));
    expect(numbers(ourCrop)).toEqual({
      left: 'left-[-32.5%]',
      top: 'top-[-18%]',
      width: 'w-[165%]',
    });
    // The rest of the picture's dress is the `artwork` row's (Image D4) —
    // the two tokens PersonnelCard's FIGURE opens with, ungated.
    const theirBase = constantOf(personnelCardSource, 'FIGURE')
      .split(/\s+/)
      .filter((token) => !token.startsWith(PHONE));
    for (const token of ['h-auto', 'object-contain']) {
      expect(theirBase).toContain(token);
      expect(ourCrop).toContain(token);
    }
  });
});

describe('PostConclusion — props: the native surface, the className merge, the ref', () => {
  it('spreads native attributes onto the <figure> and merges a caller’s className LAST (§6.8)', () => {
    renderAt(640, {
      id: 'concluzie',
      className: 'mt-8',
      'data-block': 'conclusion',
    } as Partial<PostConclusionProps>);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('id', 'concluzie');
    expect(figure).toHaveAttribute('data-block', 'conclusion');
    expect(classOf(figure)).toBe(`${FIGURE} mt-8`);
  });

  it('hands its ref to the <figure> (React 19: ref is a prop)', () => {
    const ref = createRef<HTMLElement>();
    renderAt(640, { ref });
    expect(ref.current).toBe(screen.getByRole('figure'));
  });

  it('stays ONE figure, its caption the only name HTML-AAM’s rule gives it — a `role`, a name or a `title` smuggled in a wider object is reset (THE NATIVE SURFACE)', () => {
    // `role="presentation"` would leave no figure at all, and `aria-label` /
    // `aria-labelledby` would name the figure in place of its <figcaption> —
    // the name HTML-AAM's rule gives it, which Chromium 151 does not apply
    // (measured 2026-10-20; Firefox and WebKit not measured; a screen reader
    // still reads the caption inside the figure). A `title` names it there
    // too — its only name in Chromium 151: "" without one, „Concluzia" with
    // `title="Concluzia"` (round 3's reviews, measured) — and hangs a tooltip
    // over the block. The props type Omits all four (the type pins below); a
    // wider object spread in carries them anyway, which is why the reset
    // after the spread is the belt that holds.
    const wider = {
      role: 'presentation',
      title: 'Concluzia',
      'aria-label': 'Concluzia articolului',
      'aria-labelledby': 'altundeva',
    } as unknown as Partial<PostConclusionProps>;
    renderAt(640, wider);
    const figures = screen.getAllByRole('figure');
    expect(figures).toHaveLength(1);
    const [figure] = figures;
    expect(figure).not.toHaveAttribute('role');
    expect(figure).not.toHaveAttribute('title');
    expect(figure).not.toHaveAttribute('aria-label');
    expect(figure).not.toHaveAttribute('aria-labelledby');
    expect(figure.lastElementChild?.tagName).toBe('FIGCAPTION');
  });

  it('resets a WRITTEN `aria-label` or `aria-labelledby` too — TypeScript checks no hyphenated JSX attribute against a props type that lacks it, so both compile (sections/PageHero’s precedent)', () => {
    // The reset's real case: no wider object, no cast — the two attributes
    // typed straight into the JSX, which `tsc` lets through whatever the
    // props type Omits (the type pins below hold the TYPE; this holds what
    // reaches the DOM).
    render(
      <PostConclusion
        text={TEXT}
        doctor={DOCTOR}
        aria-label="Concluzia articolului"
        aria-labelledby="altundeva"
      />,
    );
    const figure = screen.getByRole('figure');
    expect(figure).not.toHaveAttribute('aria-label');
    expect(figure).not.toHaveAttribute('aria-labelledby');
    expect(figure.lastElementChild?.tagName).toBe('FIGCAPTION');
  });

  it('types the contract: no children, the photo an ImagePath, every string required', () => {
    expectTypeOf<PostConclusionProps>().not.toHaveProperty('children');
    expectTypeOf<
      PostConclusionOwnProps['doctor']['photo']['src']
    >().toEqualTypeOf<ImagePath>();
    expectTypeOf<PostConclusionOwnProps>()
      .toHaveProperty('text')
      .toEqualTypeOf<string>();
    // The name and the specialty are required strings too: an optional one
    // would read `string | undefined` here.
    expectTypeOf<PostConclusionOwnProps['doctor']>()
      .toHaveProperty('name')
      .toEqualTypeOf<string>();
    expectTypeOf<PostConclusionOwnProps['doctor']>()
      .toHaveProperty('position')
      .toEqualTypeOf<string>();
    // THE NATIVE SURFACE's refusals, each failing `tsc` the day the type
    // lets its prop through: markup beside the words (React throws on it,
    // after the types let it pass), a `role`, the two ARIA names that would
    // name the figure in place of its caption, and the `title` Chromium 151
    // names it by — pinned on the props TYPE, because a written hyphenated
    // attribute compiles whatever the type says (the reset holds that one,
    // "resets a WRITTEN `aria-label`" above). A `title` has no hyphen, so
    // once Omitted a written one does not compile: the third directive below.
    expectTypeOf<PostConclusionProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    expectTypeOf<PostConclusionProps>().not.toHaveProperty('role');
    expectTypeOf<PostConclusionProps>().not.toHaveProperty('title');
    expectTypeOf<PostConclusionProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostConclusionProps>().not.toHaveProperty('aria-labelledby');
    const refused = [
      <PostConclusion
        key="role"
        text={TEXT}
        doctor={DOCTOR}
        // @ts-expect-error — `role` is no prop of the conclusion
        role="presentation"
      />,
      <PostConclusion
        key="markup"
        text={TEXT}
        doctor={DOCTOR}
        // @ts-expect-error — nor is markup set beside its words
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
      <PostConclusion
        key="title"
        text={TEXT}
        doctor={DOCTOR}
        // @ts-expect-error — nor is a `title`, which would name the figure
        title="Concluzia"
      />,
    ];
    expect(refused).toHaveLength(3);
    const outside: PostConclusionOwnProps['doctor']['photo'] = {
      // @ts-expect-error — a picture outside public/images/ is not an ImagePath
      src: 'images/demo/cutout-1.png',
      width: 900,
      height: 1200,
    };
    expect(outside.width).toBe(900);
    const nested = (
      // @ts-expect-error — content arrives as `text` and `doctor`, never nested
      <PostConclusion text={TEXT} doctor={DOCTOR}>
        x
      </PostConclusion>
    );
    expect(nested).toBeTruthy();
  });
});

describe('PostConclusion — zero islands, zero keys, no site data (the source)', () => {
  const code = codeOf(source);

  it('carries no client directive, no hook and no handler (§16)', () => {
    expect(code).not.toMatch(/['"]use client['"]/);
    expect(code).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(code).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports three atoms, one glyph and two helpers — never next-intl, i18n or site data (§8.1)', () => {
    const imports = [...code.matchAll(/from '([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(imports.toSorted()).toEqual(
      [
        'react',
        '@/assets/glyphs/QuoteMark',
        '@/components/ui/Eyebrow/Eyebrow',
        '@/components/ui/Heading/Heading',
        '@/components/ui/Image/Image',
        '@/lib/cx/cx',
        '@/lib/image-path/image-path',
      ].toSorted(),
    );
  });
});

// ── MEASURED, on the real stylesheet.

describe('PostConclusion — THE CIRCLE and THE NAMES, measured: 112px giving way to 72 — and to its caption under that — the names beside it on THE BASIS or under it at the caption’s whole width', () => {
  it.each([
    {
      width: 96,
      circle: 68,
      beside: false,
      at: 'a caption under the floor, a 390 phone just past 300 % zoom',
    },
    { width: 163, circle: 72, beside: false, at: 'a 390 phone at 200 % zoom' },
    { width: 228, circle: 72, beside: false, at: 'a 390 phone at 150 % zoom' },
    {
      width: 240,
      circle: 72,
      beside: false,
      at: 'a phone zoomed past the floor',
    },
    { width: 273, circle: 72, beside: false, at: 'the runner’s 320 frame' },
    {
      width: 277,
      circle: 72,
      beside: false,
      at: 'a pixel under THE BASIS’s figure',
    },
    {
      width: 279,
      circle: 72,
      beside: true,
      at: 'a pixel over THE BASIS’s figure',
    },
    { width: 280, circle: 72, beside: true, at: 'the floor’s own figure' },
    { width: 288, circle: 80, beside: true, at: 'a real 320 phone' },
    {
      width: 300,
      circle: 92,
      beside: true,
      at: 'between the floor and the full circle',
    },
    {
      width: 320,
      circle: 112,
      beside: true,
      at: 'the full circle’s first figure',
    },
    { width: 336, circle: 112, beside: true, at: 'the runner’s 390 frame' },
    { width: 640, circle: 112, beside: true, at: 'a tablet’s measure' },
  ])(
    'is $circle px a side in a $width px figure, the names beside it: $beside — $at',
    ({ width, circle: expected, beside }) => {
      const { circle, caption, names, name, specialty } = renderParts(width);
      const u = step();
      // The premise: the figure is as wide as its box, and the caption — the
      // width the clamp's `100%` reads — the figure less the line and its
      // air.
      const figure = screen.getByRole('figure');
      expect(boxOf(figure).width).toBeCloseTo(width, 1);
      const captionBox = boxOf(caption);
      expect(captionBox.width).toBeCloseTo(width - 7 * u, 1);
      // The clamp's side, and never more than the caption itself: under the
      // floor the circle gives way to its caption (THE CIRCLE NEVER PASSES
      // ITS CAPTION) — nowhere else does that bind.
      const side = Math.min(
        FULL * u,
        Math.max(FLOOR * u, width - (AROUND + RESERVE) * u),
        captionBox.width,
      );
      expect(side).toBeCloseTo(expected, 5);
      // The row's own arithmetic says where the names go — beside the circle
      // wherever the caption seats the circle, the gap and THE BASIS — and
      // the case says so too, so neither can drift from the other.
      expect(captionBox.width >= side + (GAP + BASIS) * u).toBe(beside);
      const box = boxOf(circle);
      expect(box.width).toBeCloseTo(expected, 1);
      expect(box.height).toBeCloseTo(expected, 1);
      expect(box.left).toBeCloseTo(captionBox.left, 1);
      const style = getComputedStyle(circle);
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(
        box.width / 2,
      );
      expect(style.overflow).toBe('hidden');
      expect(style.position).toBe('relative');
      // Nothing past its box at any of these figures: the circle inside its
      // caption, and neither the caption nor the figure wider than itself —
      // the page never scrolls sideways (§7, §9).
      expect(box.right).toBeLessThanOrEqual(captionBox.right + 0.05);
      for (const element of [caption, figure]) {
        expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
      }
      const column = boxOf(names);
      if (beside) {
        // BESIDE: the names start 16px right of the circle and take the rest
        // of the caption — never less than THE BASIS, and exactly THE
        // RESERVE wherever the circle gives way.
        expect(column.left).toBeCloseTo(box.right + GAP * u, 1);
        expect(column.top).toBeLessThan(box.bottom);
        expect(column.width).toBeCloseTo(
          captionBox.width - box.width - GAP * u,
          1,
        );
        expect(column.width).toBeGreaterThanOrEqual(BASIS * u - 0.05);
        if (width >= 280 && width <= 320) {
          expect(column.width).toBeCloseTo(RESERVE * u, 1);
        }
      } else {
        // UNDER: the circle alone on the first line, the names 16px under it
        // at the caption's whole width — never the sliver a shrinking column
        // left them before (the figure less 116px: 47px at 163).
        expect(column.left).toBeCloseTo(captionBox.left, 1);
        expect(column.top).toBeCloseTo(box.bottom + GAP * u, 1);
        expect(column.width).toBeCloseTo(captionBox.width, 1);
      }
      // The specialty painted over the name either way (the DOM keeps the
      // name first — the reading order, pinned above).
      expect(boxOf(specialty).bottom).toBeLessThanOrEqual(
        boxOf(name).top + 0.05,
      );
    },
  );

  it('sizes the circle with no container unit — an engine without them (Safari and iOS before 16) draws it too — and the figure is no container at all', () => {
    // The source: no container-query unit in any class the circle wears, and
    // no `@container` on the figure — nothing inside it queries one.
    expect(CIRCLE).not.toMatch(CONTAINER_UNIT);
    expect(FIGURE.split(' ')).not.toContain('@container');
    // The engine: every rule that applies to the circle, read off the CSSOM.
    // None reads a container unit — such an engine drops the whole
    // declaration, and the circle with it (a 0 × 0 portrait, the react
    // review) — and its size is ONE width, a share of its caption, with the
    // height following through the ratio.
    const { circle } = renderParts();
    const applied = styleRules()
      .filter(({ rule }) => matchesSafely(circle, rule.selectorText))
      .map(({ rule }) => rule.style);
    const sizing = [
      'width',
      'height',
      'inline-size',
      'block-size',
      'min-width',
      'min-height',
      'max-width',
      'max-height',
      'aspect-ratio',
    ];
    for (const style of applied) {
      for (const property of sizing) {
        expect(
          style.getPropertyValue(property),
          `the circle's ${property}`,
        ).not.toMatch(CONTAINER_UNIT);
      }
    }
    const widths = applied
      .map((style) => style.getPropertyValue('width'))
      .filter(Boolean);
    expect(widths).toHaveLength(1);
    expect(widths[0]).toContain('100%');
    expect(applied.filter((style) => style.getPropertyValue('height'))).toEqual(
      [],
    );
    expect(
      applied.map((style) => style.getPropertyValue('aspect-ratio')),
    ).toContain('1 / 1');
    expect(getComputedStyle(screen.getByRole('figure')).containerType).toBe(
      'normal',
    );
  });

  it('paints its ground with ui/Card’s own tint — EQUAL to what `--card-tint` computes to, never transparent', () => {
    const { circle } = renderParts();
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--card-tint)';
    document.body.append(probe);
    const tint = getComputedStyle(probe).backgroundColor;
    probe.remove();
    expect(getComputedStyle(circle).backgroundColor).toBe(tint);
    expect(tint).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('crops the 900 × 1200 cutout into it — 165 % of the circle, 32.5 % out to the left, 18 % above: the file’s square (177, 98)–(723, 643)', () => {
    const { circle, picture } = renderParts();
    const ring = boxOf(circle);
    const drawn = boxOf(picture);
    expect(drawn.width).toBeCloseTo(1.65 * ring.width, 1);
    // The HEIGHT follows the width/height attributes' 3:4 until a file has
    // loaded, then that file's own ratio (`aspect-ratio: auto 900 / 1200`).
    // The original is exactly 3:4, but an optimizer variant's height is
    // rounded to a whole pixel: the 256w file is 256 × 341, which draws this
    // box 246.14px where 3:4 says 246.4 — MEASURED (2026-10-21), whenever an
    // earlier render in this page had loaded and cached that variant (the
    // header's THE PICTURE IN THIS RUNNER). So the height is held to half a
    // pixel, which covers every variant's rounding at this size.
    expect(drawn.height).toBeCloseTo(1.65 * ring.width * (4 / 3), 0);
    expect(ring.left - drawn.left).toBeCloseTo(0.325 * ring.width, 1);
    expect(ring.top - drawn.top).toBeCloseTo(0.18 * ring.width, 1);
    // THE FILE'S SQUARE, in the file's own pixels — 900 across the drawn
    // width. The window's left, top and right there — 0.325 × 900 / 1.65 =
    // 177.3, 0.18 × 900 / 1.65 = 98.2 and 1.325 × 900 / 1.65 = 722.7 — follow
    // from the three lines above, the scale cancelling, so they are not
    // asserted again. Its BOTTOM reads the circle's own height besides: 643.6
    // only while the circle is as tall as it is wide — the file's square
    // (177, 98)–(723, 643), the head and shoulders.
    const scale = DOCTOR.photo.width / drawn.width;
    expect((ring.bottom - drawn.top) * scale).toBeCloseTo(643.6, 0);
    // CLIPPED BY ITS CIRCLE. The crop is 2.2 circles tall from 18 % above
    // the circle, so unclipped it would hang 1.02 circles — 114px — below
    // the circle, past the figure's bottom: the clip keeps all of it out of
    // the page, the figure's scrollable height its own height. MEASURED
    // (2026-10-21) with `overflow-hidden` taken off the circle: 398 against
    // the figure's 284px in this runner's face, the crop's 114px exactly. A
    // WIDTH check cannot tell the two apart: sideways the crop passes the
    // figure only on the LEFT — 36.4px out from the circle, 8.4 past the
    // figure's own edge — and a scroll width never counts what lies left of a
    // box's start; on the right it stays inside the figure.
    const figure = screen.getByRole('figure');
    expect(figure.scrollHeight).toBeLessThanOrEqual(figure.clientHeight);
  });
});

describe('PostConclusion — THE LINE and THE QUOTE MARK, measured', () => {
  it('runs THE LINE down the figure’s whole left — 4px of the thread’s lilac, every other part 24px right of it', () => {
    const { line, mark, quote, caption } = renderParts();
    const u = step();
    const figure = boxOf(screen.getByRole('figure'));
    const bar = boxOf(line);
    expect(bar.left).toBeCloseTo(figure.left, 1);
    expect(bar.top).toBeCloseTo(figure.top, 1);
    expect(bar.bottom).toBeCloseTo(figure.bottom, 1);
    expect(bar.width).toBeCloseTo(u, 1);
    expect(getComputedStyle(line).backgroundColor).toBe('rgb(212, 207, 220)');
    for (const part of [mark, quote, caption]) {
      expect(boxOf(part).left).toBeCloseTo(bar.right + 6 * u, 1);
    }
  });

  it('sets the quote mark ABOVE the words — 3rem square, the thread’s lilac, FILLED and turned half a turn', () => {
    const { mark, quote } = renderParts();
    const u = step();
    const glyph = boxOf(mark);
    expect(glyph.width).toBeCloseTo(12 * u, 1);
    expect(glyph.height).toBeCloseTo(12 * u, 1);
    expect(glyph.bottom).toBeLessThanOrEqual(boxOf(quote).top + 0.05);
    expect(boxOf(quote).top - glyph.bottom).toBeCloseTo(5 * u, 1);
    const style = getComputedStyle(mark);
    expect(style.color).toBe('rgb(212, 207, 220)');
    expect(style.fill).toBe('rgb(212, 207, 220)');
    expect(style.stroke).toBe('rgb(212, 207, 220)');
    expect(style.rotate).toBe('180deg');
  });

  it('paints the quote mark in the reader’s GrayText in forced colours and keeps its row — an SVG that sets its own colour is not forced, while the line goes with every background', () => {
    // Read off the CSSOM, never a state forced (CardCarousel.geometry.test.
    // tsx's reading): emulating forced colours here would reach every later
    // test in this runner's shared tab. EXACTLY ONE rule reaches the mark
    // under the forced-colours condition, and all it does is set the colour
    // to the palette's GrayText — so the mark stays, the one "this is a
    // quote" cue left once the line's ground is forced to Canvas; nothing
    // there hides it or closes its row.
    const { mark } = renderParts();
    const forced = styleRules().filter(
      ({ rule, media }) =>
        media.some((condition) =>
          condition.includes('forced-colors: active'),
        ) && matchesSafely(mark, rule.selectorText),
    );
    expect(
      forced.map(({ rule }) =>
        [...rule.style].map(
          (property) =>
            `${property}: ${rule.style.getPropertyValue(property).toLowerCase()}`,
        ),
      ),
    ).toEqual([['color: graytext']]);
    // Outside that condition the mark paints the thread's lilac, as every
    // block above measures.
    expect(getComputedStyle(mark).color).toBe('rgb(212, 207, 220)');
  });
});

describe('PostConclusion — THE WORDS, measured: THE BELT', () => {
  it('keeps a run longer than its line inside the quote — THE BELT breaks it where the page would otherwise scroll sideways', () => {
    // A 33-character e-mail in the words, on the runner's 320 frame's 245px
    // line. 33, not the review's 26 („programari@premiumsmile.ro", 278.8px
    // in the real face): this suite lays text out in the runner's fallback
    // face, and MEASURED (2026-10-21) the 26-character run is only 244.5px
    // in Times New Roman, while this one is 312.8px there, 341.1 in this
    // runner's system face and 354.3 in Source Serif 4 — over the line in
    // every face a CI machine may fall back to. Hyphenation off around it:
    // an address is no word a dictionary splits (and Chromium on Android,
    // Windows and Linux carries no Romanian one, §15.25), so only the belt
    // can break it — PostProse's THE BELT measured its own the same way.
    const address = 'programari.premiumsmile@gmail.com';
    const { container } = render(
      <div style={{ width: '273px', hyphens: 'manual' }}>
        <PostConclusion
          text={`Scrie-ne la ${address} și te sunăm noi.`}
          doctor={DOCTOR}
        />
      </div>,
    );
    const figure = screen.getByRole('figure');
    const words = within(figure).getByRole('blockquote')
      .firstElementChild as HTMLElement;
    expect(getComputedStyle(words).hyphens).toBe('manual');
    // The premise: the run alone, in the words' own classes, is wider than
    // the line — so the case is never vacuous.
    const alone = document.createElement('span');
    alone.className = words.className;
    alone.style.whiteSpace = 'nowrap';
    alone.textContent = address;
    container.append(alone);
    expect(boxOf(alone).width).toBeGreaterThan(words.clientWidth);
    alone.remove();
    // The belt holds it: nothing past the words' box, the figure's or the
    // frame's, and the run laid out on more than one line.
    for (const element of [words, figure, container.firstElementChild]) {
      if (!(element instanceof HTMLElement)) throw new Error('no box');
      expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
    }
    const node = words.firstChild;
    if (!(node instanceof Text)) throw new Error('the words are not one text');
    const start = node.data.indexOf(address);
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + address.length);
    const tops = new Set(
      [...range.getClientRects()]
        .filter((rect) => rect.width > 0)
        .map((rect) => Math.round(rect.top)),
    );
    expect(tops.size).toBeGreaterThan(1);
  });
});

/** One quote-mark shape as it READS on screen — each a number from 0 to 1
 *  of the shape's own box: `down`, where its mass sits (0 its top, 1 its
 *  bottom); `topFill` / `bottomFill`, how much of its top and bottom
 *  fifths it covers (the BLOB's fifth is near-solid, the tail tip's is not);
 *  `topAcross` / `bottomAcross`, where the covered points of those fifths
 *  sit across it (0 left, 1 right). A 6-shaped “ has its blob BELOW and its
 *  tail rising to the RIGHT; a 9-shaped ” its blob ABOVE and its tail falling
 *  to the LEFT. */
type MarkReading = {
  down: number;
  topFill: number;
  bottomFill: number;
  topAcross: number;
  bottomAcross: number;
};

/** Hit-tests a glyph on screen — `elementFromPoint` at every half pixel of
 *  its box — and reads each of its shapes (MarkReading). The engine's own
 *  hit test honours the CSS turn and the CSS fill, so this reads what is
 *  PAINTED, never the path data. */
const readMark = (svg: SVGSVGElement): MarkReading[] => {
  svg.scrollIntoView({ block: 'center', inline: 'center' });
  const box = boxOf(svg);
  const samples: { x: number; y: number; hit: Element | null }[] = [];
  for (let y = box.top + 0.25; y < box.bottom; y += 0.5) {
    for (let x = box.left + 0.25; x < box.right; x += 0.5) {
      samples.push({ x, y, hit: document.elementFromPoint(x, y) });
    }
  }
  const shapes = [
    ...new Set(
      samples
        .map((sample) => sample.hit)
        .filter(
          (hit): hit is SVGPathElement =>
            hit instanceof SVGPathElement && svg.contains(hit),
        ),
    ),
  ];
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  return shapes.map((shape) => {
    const points = samples.filter((sample) => sample.hit === shape);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const [left, right] = [Math.min(...xs), Math.max(...xs)];
    const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
    const fifth = (bottom - top) / 5;
    const band = (inBand: (y: number) => boolean) => {
      const area = samples.filter(
        (sample) => inBand(sample.y) && sample.x >= left && sample.x <= right,
      );
      const covered = area.filter((sample) => sample.hit === shape);
      return {
        fill: covered.length / area.length,
        across: (mean(covered.map((point) => point.x)) - left) / (right - left),
      };
    };
    // Each band bounded by the shape's own edge: the rows beyond it are
    // empty by definition and would dilute the fill.
    const upper = band((y) => y >= top && y <= top + fifth);
    const lower = band((y) => y <= bottom && y >= bottom - fifth);
    return {
      down: (mean(ys) - top) / (bottom - top),
      topFill: upper.fill,
      bottomFill: lower.fill,
      topAcross: upper.across,
      bottomAcross: lower.across,
    };
  });
};

describe('PostConclusion — THE QUOTE MARK reads as an opening mark (“)', () => {
  it('turns Lucide’s closing „99" pair into the „66" pair: each shape’s blob below, its tail rising to the right', () => {
    const { mark } = renderParts();
    const shapes = readMark(mark);
    expect(shapes).toHaveLength(2);
    for (const shape of shapes) {
      // The blob BELOW: the bottom fifth near-solid, the top fifth the tail's
      // tip, and the mass under the middle.
      // MEASURED (Chromium): bottom fifth 0.90 filled, top fifth 0.71, the
      // mass 0.53 down, the top fifth 0.61 across.
      expect(shape.bottomFill - shape.topFill).toBeGreaterThan(0.1);
      expect(shape.down).toBeGreaterThan(0.5);
      // The tail RISING TO THE RIGHT: the top fifth's points right of centre.
      expect(shape.topAcross).toBeGreaterThan(0.55);
    }
  });

  it('CONTROL — the same glyph filled the same way but NOT turned reads as the closing mark (”): blob above, tail falling to the left', () => {
    render(
      <div className="[&>svg]:size-12 [&>svg]:fill-current">
        <QuoteMark className={MARK} />
      </div>,
    );
    const svg = document.querySelector('svg') as SVGSVGElement;
    expect(getComputedStyle(svg).rotate).toBe('none');
    const shapes = readMark(svg);
    expect(shapes).toHaveLength(2);
    for (const shape of shapes) {
      // The mirror image, measured: top fifth 0.90, bottom fifth 0.71, the
      // mass 0.47 down, the bottom fifth 0.39 across.
      expect(shape.topFill - shape.bottomFill).toBeGreaterThan(0.1);
      expect(shape.down).toBeLessThan(0.5);
      expect(shape.bottomAcross).toBeLessThan(0.45);
    }
  });
});
