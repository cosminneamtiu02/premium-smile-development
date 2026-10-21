import { createRef, type ComponentPropsWithRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { bandScaleClasses } from '@/components/ui/Container/Container';
import { PostHeader, type PostHeaderProps } from './PostHeader';
import source from './PostHeader.tsx?raw';

// sections/PostHeader — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the title is found as the page's one level-1
// heading, by its own text; the by-line as a PARAGRAPH, by its role — so a
// line hidden from assistive technology is not found — and then by its text,
// since ARIA prohibits a paragraph's name (`bylineOf`; the review,
// 2026-10-20).
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the PostCard and PostList precedent):
// next-intl's hooks throw without one, so a green render proves this piece
// calls no t().
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the piece or to an atom fails HERE instead of following the code it
// is meant to check. What the real stylesheet does with them — the start edge,
// the title's size inside and outside THE BAND SCALE, no sideways scroll — is
// PostHeader.stories.tsx's business.

/** The demo article's opener, in Romanian with diacritics (§15.7): the post's
 *  title and the by-line the page words — the preposition included. */
const TITLE = 'Cum îți alegi periuța de dinți';
const BYLINE = 'de Dr. Nicu Elena Alina';
const TITLE_ID = 'titlul-articolului';

// THE RECIPES, written out.
/** The opener: both boxes stacked at the START, 16px apart (the owner,
 *  2026-10-14, superseding the centred first build). */
const OPENER = ['flex', 'flex-col', 'items-start', 'gap-4'];
/** ui/Heading's `hero` step — THE h1 step (§15.24) — on its default ink:
 *  what the title's step IS wherever THE BAND SCALE does not apply. */
const HERO_STEP = [
  'font-display',
  'text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  'text-ink-strong',
];
/** The `hero-scaled` step's ONE class beyond `hero` (ui/Heading's
 *  'hero-scaled' JOINED; PostHeader's THE BAND SCALE): the `hero` step's
 *  1401-window value in spacing steps, behind the regime's own chain — the
 *  title's one band-scale class, and the STEP's, never this piece's. A byte
 *  pin of a WORN class, so it ships no rule of its own. */
const SCALED_SIZE =
  'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]';
/** ui/Heading's `hero-scaled` step on its default ink — the step the title
 *  has worn since 2026-10-15: `hero`'s row with SCALED_SIZE closing the size
 *  row, before the ink. */
const HERO_SCALED_STEP = [
  'font-display',
  'text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  SCALED_SIZE,
  'text-ink-strong',
];
/** The title's own four utilities, in order — and no size: the step carries
 *  it. */
const TITLE_UTILITIES = [
  'max-w-4xl',
  'text-balance',
  'hyphens-none',
  'wrap-anywhere',
];
/** ui/Eyebrow's default RECIPE. */
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

/** Read through the ATTRIBUTE, the same bytes on every element. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const renderHeader = (overrides: Partial<PostHeaderProps> = {}) =>
  render(<PostHeader title={TITLE} byline={BYLINE} {...overrides} />);

const pageTitle = (): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: TITLE });

/** The <header> — the title's parent, reached by structure: inside a page's
 *  <article> it has no role of its own (the source's THE <header>). */
const openerOf = (h1: HTMLElement): HTMLElement => {
  const opener = h1.parentElement;
  if (!opener) throw new Error('PostHeader test: the title has no parent');
  return opener;
};

/** The by-line — the ui/Eyebrow <p> after the title, found by its ROLE:
 *  among the paragraphs, the one that reads the by-line. A <p> hidden from
 *  assistive technology (`aria-hidden`, say) is no paragraph to this query,
 *  so every test that reads the by-line fails with it — found by its text
 *  alone, such a line passed the whole suite (the review, 2026-10-20). */
const bylineOf = (): HTMLElement => {
  const lines = screen
    .getAllByRole('paragraph')
    .filter((paragraph) => paragraph.textContent === BYLINE);
  if (lines.length !== 1) {
    throw new Error(
      `PostHeader test: ${lines.length} paragraphs read the by-line`,
    );
  }
  return lines[0];
};

/** A class read as its variant chain and its utility — cut at the LAST colon
 *  outside brackets (DoctorIntro.test.tsx's `chainOf`). */
const chainOf = (token: string): string => {
  let depth = 0;
  let cut = 0;
  for (const [index, character] of [...token].entries()) {
    if (character === '[') depth += 1;
    if (character === ']') depth -= 1;
    if (character === ':' && depth === 0) cut = index + 1;
  }
  return token.slice(0, cut);
};

/** THE BAND SCALE's one variant chain, read off ui/Container's string. */
const BAND_CHAIN = (() => {
  const chains = new Set(bandScaleClasses.split(' ').map(chainOf));
  if (chains.size !== 1) {
    throw new Error('PostHeader test: THE BAND SCALE wears two chains');
  }
  return [...chains][0];
})();

/**
 * A source with its PROSE removed — what the guards below run against: the
 * header discusses `'use client'`, `@container` and t() by name. ONE
 * left-to-right pass (tests/unit/design-scale.test.ts's `tsCode`): string
 * literals are stepped over whole, and a `//` comment — which opens only at a
 * line's start or after whitespace — is consumed before a `/*` inside it could
 * open a block running on to the next `*\/`.
 */
const codeOf = (text: string): string =>
  text.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

const CODE = codeOf(source);

describe('PostHeader — the title: the page’s one <h1>, on the `hero-scaled` step', () => {
  it('renders exactly ONE heading — the title, an <h1>', () => {
    renderHeader();

    const h1 = pageTitle();
    expect(h1.tagName).toBe('H1');
    expect(screen.getAllByRole('heading')).toEqual([h1]);
  });

  it('dresses the <h1> in the `hero-scaled` step, then its four utilities — and no size of its own', () => {
    renderHeader();

    expect(tokensOf(pageTitle())).toEqual([
      ...HERO_SCALED_STEP,
      ...TITLE_UTILITIES,
    ]);
  });

  it('asks ui/Heading for the `hero-scaled` step in its source — never the bare `hero` — and spells no size anywhere', () => {
    // The size inside THE BAND SCALE is the step's (PostHeader's THE BAND
    // SCALE): until 2026-10-15 this piece spelled the class on the <h1>'s
    // own className, LAST; the step spells it once, in the atom, and
    // tests/unit/design-scale.test.ts holds the size to that one file and
    // the three <h1>s on the step — the doctor's name and the page hero's
    // heading beside this title. The ask is read with its attributes in ANY
    // order, as the census reads it (`asChild` first, sections/Wordmark's
    // order, is the same element; the G2 typescript review, 2026-10-20).
    expect(CODE).toMatch(
      /<Heading\b(?=[^>]*\bsize="hero-scaled")(?=[^>]*\basChild\b)[^>]*>\s*<h1\b/,
    );
    expect(CODE).not.toMatch(/size="hero"/);
    expect(CODE).not.toContain('text-[length:');
    // The step IS `hero` plus that one class, before the ink: wherever the
    // gate stays shut the title is `hero` to the byte.
    expect(HERO_SCALED_STEP.filter((token) => token !== SCALED_SIZE)).toEqual(
      HERO_STEP,
    );
  });

  it('takes its id from `titleId` — the page’s useId, which names the article', () => {
    renderHeader({ titleId: TITLE_ID });

    const h1 = pageTitle();
    expect(h1).toHaveAttribute('id', TITLE_ID);
    // The id names the HEADING, never the <header> around it.
    expect(openerOf(h1)).not.toHaveAttribute('id');
  });

  it('carries no id at all when the page hands none', () => {
    renderHeader();

    expect(pageTitle()).not.toHaveAttribute('id');
  });

  it('carries no id for an EMPTY `titleId` either — never an empty `id` attribute (the review, 2026-10-20)', () => {
    renderHeader({ titleId: '' });

    expect(pageTitle()).not.toHaveAttribute('id');
  });

  it('names an <article> through the id it is given — the page’s pairing, rehearsed', () => {
    // (Whether the <header> is a landmark is not asked here: Testing
    // Library's role table maps every <header> to `banner`, without
    // HTML-AAM's rule that one scoped to an <article> maps to none.)
    render(
      <article aria-labelledby={TITLE_ID}>
        <PostHeader title={TITLE} byline={BYLINE} titleId={TITLE_ID} />
      </article>,
    );

    expect(screen.getByRole('article', { name: TITLE })).toBeInTheDocument();
  });
});

describe('PostHeader — the by-line: ui/Eyebrow, under the title', () => {
  it('prints the by-line as given — a ui/Eyebrow <p>, unhyphenated ON THE ELEMENT, wrapping greedily', () => {
    renderHeader();

    const line = bylineOf();
    expect(line.tagName).toBe('P');
    // No alignment utility (globals.css's fence holds every <p> to start)
    // and no balancing: it broke a hyphenated surname at its hyphen
    // (PostHeader's THE BY-LINE DOES NOT WEAR IT).
    expect(line.className).toBe(`${EYEBROW_RECIPE} hyphens-none`);
    expect(line.textContent).toBe(BYLINE);
  });

  it('follows the title — DOM order is visual order, and the <header> holds nothing else', () => {
    renderHeader();

    const h1 = pageTitle();
    expect([...openerOf(h1).children]).toEqual([h1, bylineOf()]);
  });

  it('prints no date — the owner’s answer for the article page', () => {
    const { container } = renderHeader();

    expect(container.querySelectorAll('time')).toHaveLength(0);
    expect(screen.queryByRole('time')).toBeNull();
  });
});

describe('PostHeader — the <header> and THE BAND SCALE', () => {
  it('is a <header> that stacks its two boxes at the START, 16px apart', () => {
    renderHeader();

    const opener = openerOf(pageTitle());
    expect(opener.tagName).toBe('HEADER');
    expect(tokensOf(opener)).toEqual(OPENER);
  });

  it('centres nothing, anywhere — the owner’s start-aligned opener (2026-10-14)', () => {
    const { container } = renderHeader();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(
          /(^|:)(text-center|items-center|self-center|justify-center|mx-auto)$/,
        );
      }
    }
  });

  it('declares NO size container — in the source or in the markup — so the title’s gate reads ui/Container’s column', () => {
    const { container } = renderHeader();

    expect(CODE).not.toContain('@container');
    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)@container/);
      }
    }
  });

  it('wears the regime on the TITLE alone — its step’s one class — behind THE BAND SCALE’s own chain', () => {
    const { container } = renderHeader();

    const h1 = pageTitle();
    for (const element of container.querySelectorAll('*')) {
      const gated = tokensOf(element).filter((token) =>
        token.startsWith('scalable:'),
      );
      expect(gated).toEqual(element === h1 ? [SCALED_SIZE] : []);
    }
    expect(BAND_CHAIN).toBe('scalable:@4xl:@min-[896px]:');
    expect(chainOf(SCALED_SIZE)).toBe(BAND_CHAIN);
  });

  it('is sized by its step as the `hero` step at the owner’s 1401 window — 16.26 spacing steps, within a hundredth of a pixel', () => {
    // `hero` is a VIEWPORT clamp the band scale cannot redraw, so inside the
    // scale the `hero-scaled` step gives the title the clamp's value at the
    // reference window, in the design pixel: four design pixels a step.
    const steps = /^text-\[length:calc\(var\(--spacing\)\*([\d.]+)\)\]$/.exec(
      SCALED_SIZE.slice(BAND_CHAIN.length),
    );
    const hero =
      /clamp\(([\d.]+)rem,([\d.]+)rem\+([\d.]+)vw,([\d.]+)rem\)/.exec(
        HERO_STEP[1] ?? '',
      );
    if (!steps || !hero) throw new Error('PostHeader test: a step moved');
    const at1401 = Number(hero[2]) * 16 + (Number(hero[3]) * 1401) / 100;
    // Neither the floor nor the cap binds at 1401.
    expect(at1401).toBeGreaterThan(Number(hero[1]) * 16);
    expect(at1401).toBeLessThan(Number(hero[4]) * 16);
    expect(Math.abs(Number(steps[1]) * 4 - at1401)).toBeLessThan(0.01);
  });
});

describe('PostHeader — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the <header> itself', () => {
    renderHeader({ className: 'w-full' });

    const tokens = tokensOf(openerOf(pageTitle()));
    expect(tokens.slice(0, OPENER.length)).toEqual(OPENER);
    expect(tokens.at(-1)).toBe('w-full');
  });

  it('spreads native props onto the <header>, never onto the atoms', () => {
    render(
      <PostHeader
        title={TITLE}
        byline={BYLINE}
        id="antet-articol"
        lang="ro"
        data-slot="post-header"
      />,
    );

    const opener = openerOf(pageTitle());
    expect(opener).toHaveAttribute('id', 'antet-articol');
    expect(opener).toHaveAttribute('lang', 'ro');
    expect(opener).toHaveAttribute('data-slot', 'post-header');
    expect(pageTitle()).not.toHaveAttribute('data-slot');
    expect(bylineOf()).not.toHaveAttribute('data-slot');
  });

  it('keeps its own props off the <header> — no tooltip, no stray attribute', () => {
    renderHeader({ titleId: TITLE_ID });

    // `title` is the heading's text, never HTML's tooltip attribute; the
    // three own props are destructured, so nothing of theirs rides the spread.
    expect(openerOf(pageTitle()).getAttributeNames()).toEqual(['class']);
  });

  it('is never a landmark and never named — a `role` in a wider spread and a WRITTEN `aria-label` / `aria-labelledby` are reset after the spread (THE NATIVE SURFACE)', () => {
    // The type refuses all three (the type pins below), but TypeScript checks
    // no hyphenated attribute written in JSX against a props type that lacks
    // it, and never checks the spread of a wider object for the extra `role`:
    // both compile, so only the reset after the spread holds them. A
    // "banner" would make the opener a second banner beside the shell's
    // header; a name on a <header> scoped to an <article> names a generic
    // element, which ARIA forbids. The ATTRIBUTES are what this holds:
    // Testing Library's role table calls every <header> a banner (the
    // pairing test above).
    const wider: Pick<ComponentPropsWithRef<'header'>, 'id' | 'role'> = {
      id: 'antet-articol',
      role: 'banner',
    };
    render(
      <article aria-labelledby={TITLE_ID}>
        <PostHeader
          title={TITLE}
          byline={BYLINE}
          titleId={TITLE_ID}
          {...wider}
          aria-label="Antetul articolului"
          aria-labelledby="altundeva"
        />
      </article>,
    );

    const opener = openerOf(pageTitle());
    expect(opener).not.toHaveAttribute('role');
    expect(opener).not.toHaveAttribute('aria-label');
    expect(opener).not.toHaveAttribute('aria-labelledby');
    // The rest of the wider object still rides the spread, and the article
    // keeps the name its <h1> gives it.
    expect(opener).toHaveAttribute('id', 'antet-articol');
    expect(screen.getByRole('article', { name: TITLE })).toBeInTheDocument();
  });

  it('accepts ref as a regular prop (React 19) — it is the <header>', () => {
    const root = createRef<HTMLElement>();
    renderHeader({ ref: root });

    expect(root.current?.tagName).toBe('HEADER');
    expect(root.current).toBe(openerOf(pageTitle()));
  });

  it('owns no outer margin anywhere — the page’s rhythm box spaces it (§6.4)', () => {
    const { container } = renderHeader();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
      }
    }
  });
});

describe('PostHeader — zero islands, zero message keys, zero data', () => {
  it('ships NO client directive and calls no hook, no t() and no handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY the two atoms it composes and lib/cx — and React’s types', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // import of ui/Container's band-scale strings would make the opener a
    // second wearer of the page's scale (the page wears it), and a data
    // import would make it its own populator.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/lib/cx/cx',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{ ComponentPropsWithRef, ReactElement \} from 'react';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
  });

  it('renders both strings as given — diacritics intact, no message key path (§8.1)', () => {
    const { container } = renderHeader();

    expect(container.textContent).toBe(`${TITLE}${BYLINE}`);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('PostHeader — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    expectTypeOf<PostHeaderProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<PostHeaderProps['byline']>().toEqualTypeOf<string>();
    expectTypeOf<PostHeaderProps['titleId']>().toEqualTypeOf<
      string | undefined
    >();
    // The content arrives as the two named strings — nothing nested, and no
    // markup set beside them (React throws on it).
    expectTypeOf<PostHeaderProps>().not.toHaveProperty('children');
    expectTypeOf<PostHeaderProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    // Never a landmark, never named (THE NATIVE SURFACE; the review,
    // 2026-10-20 — sections/PageHero's refusal). Pinned on the props TYPE: a
    // hyphenated attribute written in JSX compiles whatever the type says, and
    // a wider spread can carry a `role`, which is why the reset after the
    // spread is the belt that holds those (the runtime test above).
    expectTypeOf<PostHeaderProps>().not.toHaveProperty('role');
    expectTypeOf<PostHeaderProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostHeaderProps>().not.toHaveProperty('aria-labelledby');
    // Each directive below fails `tsc` the day the type lets its prop
    // through; the two elements are built, never rendered.
    const refused = [
      <PostHeader
        key="role"
        title={TITLE}
        byline={BYLINE}
        // @ts-expect-error — `role` is no prop of the opener
        role="banner"
      />,
      <PostHeader
        key="markup"
        title={TITLE}
        byline={BYLINE}
        // @ts-expect-error — nor is markup set beside its two strings
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
    ];
    expect(refused).toHaveLength(2);
    // The native <header> surface rides along — an id, the ARIA attributes
    // the type keeps, and `ref` (React 19).
    expectTypeOf<PostHeaderProps>().toHaveProperty('id');
    expectTypeOf<PostHeaderProps>().toHaveProperty('aria-describedby');
    expectTypeOf<PostHeaderProps>().toHaveProperty('ref');
    expectTypeOf<PostHeaderProps['className']>().toEqualTypeOf<
      string | undefined
    >();
  });
});
