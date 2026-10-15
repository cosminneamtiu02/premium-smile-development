import {
  getDefaultNormalizer,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { bandScaleClasses } from '@/components/ui/Container/Container';
import ro from '@/messages/ro.json';
import { PageHero, type PageHeroProps } from './PageHero';
import { namedAs } from './PageHero.fixtures';
import source from './PageHero.tsx?raw';

// sections/PageHero — the unit suite. Role-based queries wherever a role
// exists (§9, §13): the heading is found as the page's one level-1 heading,
// by the name a screen reader hears. Moved here from PostList.test.tsx on
// 2026-10-15 with the hero itself; the blog band's suite keeps the
// composition (the hero first in its rhythm box, the two strings handed over
// and nothing else).
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the PostCard and ReviewCard precedent):
// next-intl's hooks throw without one, so a green render proves the hero
// calls no t(). NOTHING IS MOCKED either: a props-in composition needs no
// router, no clock and no data.
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the hero or to an atom fails HERE. One exception, compared rather
// than retyped: ui/Container's regime chain, read off `bandScaleClasses` (a
// hand-typed copy would be a second spelling of the regime, which
// tests/unit/design-scale.test.ts forbids in spirit). What the real
// stylesheet and the real faces do with all of it — the stairway's two and
// three lines, the reach, the scale — is PageHero.scale.test.tsx's business
// and PageHero.stories.tsx's.
//
// ── THE COPY: the blog list's Romanian hero, read out of the message file —
// the copy every mechanism was first measured on (PageHero.tsx's record), its
// line breaks and no-break spaces included. The hero's two strings hold a
// `\n` where the stairway turns; a role query names the heading by its
// accessible name, and the two engines that compute one disagree on that
// `\n` (PageHero.fixtures.ts's `namedAs` says how), so the <h1> is found by
// `namedAs`, whitespace collapsed on both sides. A TEXT query collapses the
// element's whitespace by default, so the lead is found with a normalizer
// that keeps it (`leadIn`) — which also proves the breaks reach the DOM.

const TITLE = ro.blog.hero.title;
const LEAD = ro.blog.hero.lead;

// THE RECIPES, written out.
/** The hero: both boxes centred, 3rem apart, the heading's lines centred. */
const HERO = ['flex', 'flex-col', 'items-center', 'gap-12', 'text-center'];
/** ui/Heading's `hero` step — THE h1 step (§15.24) — on its default ink. */
const HERO_STEP = [
  'font-display',
  'text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  'text-ink-strong',
];
/** The one wrap style the hero's two blocks wear: `pretty` on a phone's or a
 *  tablet's column alone, under the Container's 48rem step (PageHero.tsx's
 *  ON A PHONE'S OR A TABLET'S COLUMN). */
const PHONE_PRETTY = '@max-3xl:text-pretty';
/** THE STAIRWAY: the copy's own line breaks held inside THE BAND SCALE alone
 *  — the pre-line white-space behind the band scale's chain, worn by both
 *  blocks. */
const STAIRWAY = 'scalable:@4xl:@min-[896px]:whitespace-pre-line';
/** THE HEADING'S REACH: inside the band scale alone the <h1> is as wide as
 *  its longest line, up to the column's full width plus 67.5 spacing steps —
 *  135 design pixels a side, room for every first line in the fallback face
 *  (PageHero.tsx's WHY 135, AND WHAT 100 WAS) — behind the band scale's chain
 *  (the owner, 2026-10-15: "it should not be constrained by a div"). */
const REACH = [
  'scalable:@4xl:@min-[896px]:w-max',
  'scalable:@4xl:@min-[896px]:max-w-[calc(100%+var(--spacing)*67.5)]',
];
/** The <h1>'s size inside the band scale: 16.26 spacing steps, 65.04 design
 *  pixels — sections/DoctorIntro's name's class byte for byte, the KEEP-IN-
 *  SYNC pair restored on the owner's word of 2026-10-15 ("tbh i kinda liked
 *  it how it looked before"). */
const SIZE_IN_SCALE =
  'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]';
/** The <h1>'s own classes before its gated ones: the 6xl cap (THE CAPS),
 *  whole words, the belt, and the phone's `pretty` wrap. */
const TITLE_OWN = ['max-w-6xl', 'hyphens-none', 'wrap-anywhere', PHONE_PRETTY];
/** ui/Text's muted recipe, then the lead's own: the cap of 123 spacing steps
 *  (THE CAPS), whole words, the heading's belt for a word too long for a
 *  line, centred ON THE ELEMENT, the phone's `pretty`, the stairway. */
const LEAD_TOKENS = [
  'text-base',
  'text-ink-muted',
  'max-w-123',
  'hyphens-none',
  'wrap-anywhere',
  'text-center',
  PHONE_PRETTY,
  STAIRWAY,
];

/** Read through the ATTRIBUTE, the same bytes on every element. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** A token's variant chain — the colon-separated part before its utility,
 *  brackets kept whole (an arbitrary value may hold a colon). */
const variantsOf = (token: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i += 1) {
    const char = token[i];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  return parts;
};

/** A token's utility — what follows its variant chain. */
const utilityOf = (token: string): string => {
  const variants = variantsOf(token);
  return variants.length === 0
    ? token
    : token.slice(variants.join(':').length + 1);
};

const renderHero = (props: Partial<PageHeroProps> = {}) =>
  render(<PageHero title={TITLE} lead={LEAD} {...props} />);

/** The page's <h1>, by the name a screen reader hears (THE COPY above). */
const pageTitle = (): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: namedAs(TITLE) });

/** The hero's root — the <h1>'s parent, which carries no role of its own. */
const heroOf = (h1: HTMLElement): HTMLElement => {
  const hero = h1.parentElement;
  if (!(hero instanceof HTMLElement)) throw new Error('no hero');
  return hero;
};

/** The lead, found by its text with the line breaks KEPT — the default
 *  normalizer would collapse them into spaces and never match the copy. */
const leadIn = (hero: HTMLElement): HTMLElement =>
  within(hero).getByText(LEAD, {
    normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
  });

/**
 * The hero's source with its PROSE removed — what the zero-island guards run
 * against: the header names `'use client'`, t() and the hooks the hero does
 * not have, by name. Three passes, in the PostCard suite's order (the accent
 * census's lesson): full-line comments first — a line comment may itself
 * hold a block opener, which taken first would swallow the code up to the
 * next block's close — then blocks, JSX comments included, then the
 * comments that trail code.
 */
const stripComments = (code: string): string =>
  code
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const CODE = stripComments(source);

/** The band scale's variant chain — the gate first — as ui/Container spells
 *  it, read off its regime string (one chain, or a throw that says so). */
const SCALE_CHAIN = (() => {
  const chains = new Set(
    bandScaleClasses.split(' ').map(variantsOf).map(String),
  );
  if (chains.size !== 1) throw new Error('ui/Container: not one chain');
  return [...chains][0];
})();

describe('PageHero — one <header>: the page’s <h1> over its lead', () => {
  it('renders exactly ONE <header> holding exactly two elements — the <h1>, then the lead’s <p>', () => {
    const { container } = renderHero();

    const headers = container.querySelectorAll('header');
    expect(headers).toHaveLength(1);
    const [hero] = headers;
    // The hero IS the root: nothing wraps it, nothing sits beside it.
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(hero);
    expect([...(hero?.children ?? [])].map(({ tagName }) => tagName)).toEqual([
      'H1',
      'P',
    ]);
  });

  it('renders exactly ONE <h1>, the title, on ui/Heading’s `hero` step — whole words, belted and capped', () => {
    renderHero();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const h1 = pageTitle();
    expect(h1.tagName).toBe('H1');
    expect(tokensOf(h1)).toEqual([
      ...HERO_STEP,
      ...TITLE_OWN,
      STAIRWAY,
      ...REACH,
      SIZE_IN_SCALE,
    ]);
  });

  it('is found by the name a screen reader hears — the copy’s line break a space, whitespace collapsed on both sides, whichever engine computes the name', () => {
    renderHero();

    const h1 = pageTitle();
    // Chromium's own accessible name reads the copy's line break as a space
    // (its accessibility tree through the DevTools protocol, 2026-10-15):
    // that name finds the very heading the suite's query does…
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: namedAs(TITLE.replaceAll('\n', ' ')),
      }),
    ).toBe(h1);
    // …the raw `\n` that dom-accessibility-api keeps matches as well, and the
    // heading's text with one word changed matches nothing.
    expect(namedAs(TITLE)(TITLE)).toBe(true);
    expect(namedAs(TITLE)(TITLE.replace('blogul', 'jurnalul'))).toBe(false);
  });

  it('wears, LAST, the doctor page’s name’s size in the band scale — 16.26 spacing steps, 65.04 design pixels — behind the band scale’s chain, the stairway and the heading’s reach beside it', () => {
    renderHero();

    // The `hero` step reads the viewport, the one size the remap cannot
    // redraw (PageHero.tsx's THE ONE SIZE THE REMAP CANNOT REDRAW): inside
    // the scale the title takes sections/DoctorIntro's name's design size,
    // 65.04 (tests/unit/design-scale.test.ts holds the two classes equal),
    // and the room for every language's two lines comes from the heading's
    // reach, not from a smaller size.
    const tokens = tokensOf(pageTitle());
    expect(tokens.at(-1)).toBe(SIZE_IN_SCALE);
    // …behind the band scale's own chain, the gate first, and nothing else on
    // the heading gated but the stairway and the reach.
    for (const token of [STAIRWAY, ...REACH, SIZE_IN_SCALE]) {
      expect(String(variantsOf(token)), token).toBe(SCALE_CHAIN);
    }
    expect(
      tokens.filter((token) => variantsOf(token).includes('scalable')),
    ).toEqual([STAIRWAY, ...REACH, SIZE_IN_SCALE]);
    // …so the reach is never worn ungated: off the scale a max-content width
    // would lay the whole heading on one line wider than a phone (the full
    // token list above admits no other width on the heading; the ungated
    // forms are not spelled in this file, which Tailwind scans too).
  });

  it('puts the lead right after the title — a ui/Text <p>, muted, whole words, centred ON THE ELEMENT (§15.15 b), capped, on the stairway', () => {
    renderHero();

    const h1 = pageTitle();
    const hero = heroOf(h1);
    const lead = leadIn(hero);
    expect(lead.tagName).toBe('P');
    expect(tokensOf(lead)).toEqual(LEAD_TOKENS);
    // DOM order is visual order: the title, then the lead, nothing else — no
    // eyebrow (THE HERO, CENTRED: the owner's "eyebrow of text" is this
    // sentence).
    expect([...hero.children]).toEqual([h1, lead]);
  });

  it('keeps the copy’s line breaks inside THE BAND SCALE alone — ONE white-space token on each block, the stairway behind the band scale’s chain, none on the <header>', () => {
    renderHero();

    // The white-space utilities, built from their values so this file spells
    // no class nothing wears (Tailwind scans tests too).
    const whiteSpaces = new Set(
      ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'].map(
        (value) => `whitespace-${value}`,
      ),
    );
    const whiteSpaceTokensOf = (element: Element): string[] =>
      tokensOf(element).filter((token) => whiteSpaces.has(utilityOf(token)));
    const h1 = pageTitle();
    const hero = heroOf(h1);
    expect(whiteSpaceTokensOf(h1)).toEqual([STAIRWAY]);
    expect(whiteSpaceTokensOf(leadIn(hero))).toEqual([STAIRWAY]);
    expect(whiteSpaceTokensOf(hero)).toEqual([]);
    // …and the copy's breaks reach the DOM as written: one in the heading,
    // two in the lead.
    expect(h1.textContent).toBe(TITLE);
    expect(TITLE.split('\n')).toHaveLength(2);
    expect(LEAD.split('\n')).toHaveLength(3);
  });

  it('centres both boxes and the title’s lines through its <header>', () => {
    renderHero();

    const hero = heroOf(pageTitle());
    expect(hero.tagName).toBe('HEADER');
    expect(tokensOf(hero)).toEqual(HERO);
  });

  it('wraps the title and the lead as prose falls from the 48rem step up, `pretty` only on a phone’s or a tablet’s column — ONE wrap token on each, none on the <header>', () => {
    renderHero();

    // The wrap style INHERITS, so a wrap utility on the <header> would
    // reshape both blocks. Of Tailwind's four `text-*` wrap utilities, under
    // any variant, the title and the lead wear exactly one —
    // `@max-3xl:text-pretty` (ON A PHONE'S OR A TABLET'S COLUMN) — and every
    // other is refused: a balanced wrap, a `pretty` at every width, a
    // `nowrap`. (The four are built from their style names, so this file
    // spells no class nothing wears — Tailwind scans tests too.)
    const wrapUtilities = new Set(
      ['wrap', 'nowrap', 'balance', 'pretty'].map((style) => `text-${style}`),
    );
    const wrapTokensOf = (element: Element): string[] =>
      tokensOf(element).filter((token) => wrapUtilities.has(utilityOf(token)));
    const h1 = pageTitle();
    const hero = heroOf(h1);
    expect(wrapTokensOf(h1)).toEqual([PHONE_PRETTY]);
    expect(wrapTokensOf(leadIn(hero))).toEqual([PHONE_PRETTY]);
    expect(wrapTokensOf(hero)).toEqual([]);
  });

  it('gates nothing but the title’s four classes and the lead’s one — the regime itself is ui/Container’s, worn by the band around the hero', () => {
    const { container } = renderHero();

    const h1 = pageTitle();
    const lead = leadIn(heroOf(h1));
    for (const element of container.querySelectorAll('*')) {
      const gated = tokensOf(element).filter((token) =>
        variantsOf(token).includes('scalable'),
      );
      if (element === h1)
        expect(gated).toEqual([STAIRWAY, ...REACH, SIZE_IN_SCALE]);
      else if (element === lead) expect(gated).toEqual([STAIRWAY]);
      else expect(gated, element.tagName).toEqual([]);
    }
    // The hero declares no design pixel and remaps nothing: the band that
    // composes it does (PageHero.tsx's THE BAND IT SITS IN).
    expect(CODE).not.toMatch(/design-scale|--scale-px/);
  });

  it('owns no outer margin on any of its boxes — the band around it spaces it (§6.4)', () => {
    renderHero();

    const h1 = pageTitle();
    const hero = heroOf(h1);
    for (const box of [hero, h1, leadIn(hero)]) {
      for (const token of tokensOf(box)) {
        expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
      }
    }
  });

  it('renders every string as given — diacritics, no-break spaces and line breaks intact, no message key path (§8.1)', () => {
    const { container } = renderHero();

    expect(container.textContent).toBe(`${TITLE}${LEAD}`);
    // The `title` prop is the heading's text, never the <header>'s tooltip.
    expect(heroOf(pageTitle())).not.toHaveAttribute('title');
  });
});

describe('PageHero — the native <header> surface (§6.8)', () => {
  it('spreads the native props onto the <header> and merges a className LAST, after its own', () => {
    render(
      <PageHero
        title={TITLE}
        lead={LEAD}
        id="echipa"
        aria-describedby="nota"
        data-band="team"
        className="mt-4"
      />,
    );

    const hero = heroOf(pageTitle());
    expect(hero).toHaveAttribute('id', 'echipa');
    expect(hero).toHaveAttribute('aria-describedby', 'nota');
    expect(hero).toHaveAttribute('data-band', 'team');
    // Its own classes first, the caller's after them — placement only: the
    // caller's className can add, never take one of the hero's away.
    expect(tokensOf(hero)).toEqual([...HERO, 'mt-4']);
  });

  it('keeps its own classes with no className given — nothing appended, nothing left empty', () => {
    renderHero();

    expect(heroOf(pageTitle()).getAttribute('class')).toBe(HERO.join(' '));
  });

  it('hands `ref` to the <header> — a regular prop (React 19), no forwardRef', () => {
    const ref = createRef<HTMLElement>();
    renderHero({ ref });

    expect(ref.current).toBe(heroOf(pageTitle()));
    expect(ref.current?.tagName).toBe('HEADER');
    expect(CODE).not.toMatch(/\bforwardRef\b/);
  });

  it('is never a landmark of its own — a `role` is refused by the type, and one that slips past it is reset after the spread (sections/PostCard’s belt)', () => {
    // The directive fails `tsc` the day the type lets a `role` through; at
    // runtime the prop rides the spread, and the reset after it wins — a
    // "banner" here would make the hero a second banner landmark beside the
    // shell's header. Inside <main>, where every page sets it, a <header>
    // without a role is no landmark at all — which this runner cannot show:
    // Testing Library's role table calls every <header> a banner, whatever
    // its ancestors (measured: it named this very header, inside <main>, a
    // banner), so the ATTRIBUTE is what the test holds.
    render(
      <main>
        <PageHero
          title={TITLE}
          lead={LEAD}
          // @ts-expect-error — `role` is Omitted from the hero's props
          role="banner"
        />
      </main>,
    );

    const hero = heroOf(pageTitle());
    expect(hero.tagName).toBe('HEADER');
    expect(hero).not.toHaveAttribute('role');
  });
});

describe('PageHero — zero islands, zero message keys, zero data', () => {
  it('ships NO client directive, calls no hook, no t() and no handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY the two atoms and one helper it composes, and React’s types — no section, no data, no message', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // import of a message file or of lib data would make the hero its own
    // populator, and a section with state would hydrate the page's opener.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/components/ui/Text/Text',
      '@/lib/cx/cx',
      'react',
    ]);
    // React for its types alone: nothing of it runs here.
    expect(CODE).toMatch(
      /^import type \{ ComponentPropsWithRef, ReactElement \} from 'react';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
  });
});

describe('PageHero — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    // The two strings, both required — neither alone is a hero, the two
    // together are, nothing else required — and both plain strings: the copy
    // arrives finished (§8.1).
    expectTypeOf<{ lead: string }>().not.toExtend<PageHeroProps>();
    expectTypeOf<{ title: string }>().not.toExtend<PageHeroProps>();
    expectTypeOf<{ title: string; lead: string }>().toExtend<PageHeroProps>();
    expectTypeOf<PageHeroProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PageHeroProps['lead']>().toEqualTypeOf<string>();
    // `children` is refused: the content is the two strings. And the native
    // `title` attribute — a tooltip on the <header> — is gone, replaced by
    // the heading's required text (no `string | undefined` left of it).
    expectTypeOf<PageHeroProps>().not.toHaveProperty('children');
    expectTypeOf<PageHeroProps['title']>().not.toEqualTypeOf<
      string | undefined
    >();
    // `role` and `dangerouslySetInnerHTML` are refused too (sections/
    // PostCard's refusal of the same): a role would make the hero a landmark
    // — a "banner" a second one beside the shell's header — and React throws
    // on markup set beside children. Each directive below fails `tsc` the day
    // the type lets its prop through; the two elements are built, never
    // rendered.
    expectTypeOf<PageHeroProps>().not.toHaveProperty('role');
    expectTypeOf<PageHeroProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    const refused = [
      <PageHero
        key="role"
        title={TITLE}
        lead={LEAD}
        // @ts-expect-error — `role` is no prop of the hero
        role="banner"
      />,
      <PageHero
        key="markup"
        title={TITLE}
        lead={LEAD}
        // @ts-expect-error — nor is markup set beside its two strings
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
    ];
    expect(refused).toHaveLength(2);
    // The native <header> surface rides along: an id, the ARIA attributes,
    // a className for placement, and `ref` as a regular prop.
    expectTypeOf<PageHeroProps>().toHaveProperty('id');
    expectTypeOf<PageHeroProps>().toHaveProperty('aria-describedby');
    expectTypeOf<PageHeroProps>().toHaveProperty('className');
    expectTypeOf<PageHeroProps>().toHaveProperty('ref');
  });
});
