import { act, render, screen, within } from '@testing-library/react';
import { createRef, type Ref } from 'react';
import { renderToString } from 'react-dom/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import {
  COURSES_INTERVAL_MS,
  DoctorCourses,
  type DoctorCoursesProps,
} from './DoctorCourses';
import source from './DoctorCourses.tsx?raw';

// sections/DoctorCourses — the block's suite. Role-based queries wherever a
// role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this block is almost nothing BUT structure — a named `region`,
// its <h2> and one `list` of the doctor's courses, one `listitem` per idea.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// DoctorProfile / SectionHeading precedent). next-intl's hooks throw without
// one, so a green render proves the block owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have translated —
// Romanian with diacritics (§15.7), invented course lines in lib/team's
// shape, D-DASH-clean. lib/team itself is deliberately NOT imported: a DUMB
// block's suite must not depend on the demo data a parallel lane is
// reshaping.
//
// ── THE ISLAND HAS ITS OWN SUITE. ./CourseTimeline — the rail, the dots, the
// light moving from idea to idea — is pinned in CourseTimeline.test.tsx
// (every state, the clocks, the off-screen hold); THIS file pins the block
// around it — the region, the opener, the list as the page hands it over —
// and the one thing the block decides about the island: its rhythm,
// COURSES_INTERVAL_MS, driven through the block's own default here.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet): the utility TOKENS are the contract, the convention every
// component test in this repo follows. What needs real CSS — the geometry of
// the rail, the light's colours and motion — is read in
// DoctorCourses.stories.tsx's plays.

const EYEBROW = 'Repere din drumul meu spre specializare';
const TITLE = 'Cursuri și specializări';

/** Four ideas in the page's order — lib/team's shape, one course a line. */
const ITEMS = [
  'Curs de reabilitare protetică pe implanturi, București',
  'Curs de chirurgie plastică parodontală, Cluj-Napoca',
  'Curs de restaurări protetice din zirconiu, Sibiu',
  'Rezidențiat în parodontologie',
] as const;

/** The block's own box as it renders: a flex column, its opener and its list
 *  24px apart (DoctorCourses.tsx's A BLOCK, NOT A BAND). */
const BLOCK = 'flex flex-col gap-6';

/** An element's class tokens, read off the ATTRIBUTE: an SVG's `className` is
 *  an SVGAnimatedString, not a string, and the walks below read every element
 *  of the block. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The block's source with its PROSE removed, which is what the source guards
 * at the bottom run against (the PersonnelCard/DoctorProfile mechanism).
 * Without it those guards police the file's own documentation: the header
 * discusses `'use client'`, `t()` and the old band's classes by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** A browser that never asks for reduced motion — lib/reduced-motion reads
 *  `window.matchMedia` on every call, so the stub decides (the StatNumber.
 *  test.tsx precedent). */
const allowMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
};

beforeEach(() => {
  // No off-screen hold in this file: without an observer the cycle simply
  // runs (CourseTimeline's THE OFF-SCREEN HOLD), so the rhythm tests read
  // the clock alone. The hold is CourseTimeline.test.tsx's.
  vi.stubGlobal('IntersectionObserver', undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderBlock = (
  placement: Placement = {},
  items: readonly string[] = ITEMS,
) =>
  render(
    <DoctorCourses
      eyebrow={EYEBROW}
      title={TITLE}
      items={items}
      {...placement}
    />,
  );

/** The block — the <section> itself, the render's only root. */
const blockOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

/** The ideas, as the island renders them. */
const ideas = (): HTMLElement[] => screen.getAllByRole('listitem');

/** The ideas the island has lit — `data-current`, present only while lit. */
const lit = (): HTMLElement[] =>
  ideas().filter((idea) => idea.hasAttribute('data-current'));

describe('DoctorCourses — the region landmark (§9)', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> only becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" as well would be redundant ARIA (§9 semantic-HTML-first).
    const { container } = renderBlock();

    const block = screen.getByRole('region', { name: TITLE });
    expect(block.tagName).toBe('SECTION');
    expect(block).toBe(blockOf(container));
    expect(block).not.toHaveAttribute('role');

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBeTruthy();
    expect(block).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('generates the heading id — two blocks on one page never collide', () => {
    render(
      <>
        <DoctorCourses eyebrow={EYEBROW} title={TITLE} items={ITEMS} />
        <DoctorCourses
          eyebrow={EYEBROW}
          title="Congrese și conferințe"
          items={ITEMS}
        />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Congrese și conferințe' }),
    ).toBeInTheDocument();
  });

  it('opens with the eyebrow over the title, through sections/SectionHeading', () => {
    // The eyebrow is a <p> one tier down (ui/Eyebrow) — asserted by TEXT, so a
    // broken diacritic path fails here rather than in front of a patient. It
    // never enters the outline, which is why the h2 is the block's only
    // heading.
    const { container } = renderBlock();

    const eyebrow = within(blockOf(container)).getByText(EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    // …and it comes BEFORE the title in the DOM, as it does on screen.
    expect(
      eyebrow.compareDocumentPosition(
        screen.getByRole('heading', { level: 2 }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('is a flex column of its opener and its list, 24px apart — and merges the caller className LAST', () => {
    // The biography region beside it spaces its opener and its paragraphs by
    // the same 24px (DoctorCourses.tsx's A BLOCK, NOT A BAND).
    const { container } = renderBlock();
    const block = blockOf(container);

    expect(block.className).toBe(BLOCK);
    const [opener, list] = [...block.children];
    expect(block.children).toHaveLength(2);
    expect(opener).toContainElement(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    );
    expect(list).toBe(screen.getByRole('list'));

    const { container: placed } = renderBlock({ className: 'scroll-mt-10' });
    expect(blockOf(placed).className).toBe(`${BLOCK} scroll-mt-10`);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const block = createRef<HTMLElement>();
    renderBlock({ ref: block });

    expect(block.current).toBeInstanceOf(HTMLElement);
    expect(block.current?.tagName).toBe('SECTION');
    expect(block.current).toContainElement(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    );
  });

  it('spreads remaining native props onto the section — and none of them can replace the name pair', () => {
    // The types refuse the two naming attributes (the type pins below); this
    // is the runtime half: `{...rest}` rides FIRST, so even an attribute that
    // slipped past the types lands BEFORE the component's own and loses.
    const smuggled = { 'aria-labelledby': 'elsewhere' } as object;
    const { container } = render(
      <DoctorCourses
        eyebrow={EYEBROW}
        title={TITLE}
        items={ITEMS}
        id="cursuri"
        lang="de"
        data-slot="doctor-courses"
        {...smuggled}
      />,
    );

    const block = blockOf(container);
    expect(block).toHaveAttribute('id', 'cursuri');
    expect(block).toHaveAttribute('lang', 'de');
    expect(block).toHaveAttribute('data-slot', 'doctor-courses');
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    // A caller's id on the BLOCK never becomes the heading's, and the
    // smuggled pair never wins: the region keeps its name.
    expect(heading).not.toHaveAttribute('id', 'cursuri');
    expect(block).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByRole('region', { name: TITLE })).toBe(block);
  });
});

describe('DoctorCourses — one idea per dot, no year (2026-10-13)', () => {
  it('renders ONE list of the ideas, one item each, in the page’s order and words', () => {
    renderBlock();

    // `role="list"` survives WebKit's list-style-none heuristic (the
    // island's SEMANTICS); getAllByRole finds it by that role.
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(1);
    expect(lists[0]).toHaveAttribute('role', 'list');
    expect(ideas().map((idea) => idea.textContent)).toEqual([...ITEMS]);
    for (const idea of ideas()) expect(idea.tagName).toBe('LI');
  });

  it('prints the items exactly as given — the block never sorts', () => {
    // The order is the PAGE's (lib/team's own order of the course rows); a
    // block that re-sorted would be a second opinion about the data.
    const shuffled = [ITEMS[2], ITEMS[0], ITEMS[3], ITEMS[1]];
    renderBlock({}, shuffled);

    expect(ideas().map((idea) => idea.textContent)).toEqual(shuffled);
  });

  it('carries no heading but its own <h2> — the years and their <h3>s are gone', () => {
    renderBlock();

    expect(screen.getAllByRole('heading')).toEqual([
      screen.getByRole('heading', { level: 2, name: TITLE }),
    ]);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('renders NOTHING for an empty list — no region, no heading, no box', () => {
    // A doctor without courses has no block (the header's EMPTY paragraph).
    const { container } = renderBlock({}, []);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByText(EYEBROW)).toBeNull();
  });

  it('prints the island NEUTRAL in the server HTML — nothing lit, nothing faded (§16 rule 2)', () => {
    // renderToString IS the static export's render: the island's ring
    // answers from its frozen server snapshot, idle, so every doctor page's
    // HTML carries every idea at full ink and none marked.
    const html = renderToString(
      <DoctorCourses eyebrow={EYEBROW} title={TITLE} items={ITEMS} />,
    );

    expect(html).not.toContain('data-current');
    expect(html).not.toContain('opacity-65');
    expect(html).not.toContain('scale-104');
    expect(html).not.toContain('accent-decorative');
    expect(html).not.toContain('aria-current');
    expect(html).toContain(TITLE);
    expect(html).toContain(EYEBROW);
    for (const item of ITEMS) expect(html).toContain(`>${item}</li>`);
  });
});

describe('DoctorCourses — the rhythm, COURSES_INTERVAL_MS (§15.18)', () => {
  it('is 3 s a light', () => {
    expect(COURSES_INTERVAL_MS).toBe(3_000);
  });

  it('hands the island COURSES_INTERVAL_MS when the page passes nothing', () => {
    // Driven through the block's own default: idea 1 lights after mount and
    // holds for exactly COURSES_INTERVAL_MS, then the light moves on.
    vi.useFakeTimers();
    allowMotion();
    renderBlock();

    expect(lit()).toEqual([ideas()[0]]);
    act(() => vi.advanceTimersByTime(COURSES_INTERVAL_MS - 1));
    expect(lit()).toEqual([ideas()[0]]);
    act(() => vi.advanceTimersByTime(1));
    expect(lit()).toEqual([ideas()[1]]);
  });

  it('passes a given intervalMs through to the island — the stories’ and the tests’ short rhythm', () => {
    vi.useFakeTimers();
    allowMotion();
    render(
      <DoctorCourses
        eyebrow={EYEBROW}
        title={TITLE}
        items={ITEMS}
        intervalMs={500}
      />,
    );

    act(() => vi.advanceTimersByTime(499));
    expect(lit()).toEqual([ideas()[0]]);
    act(() => vi.advanceTimersByTime(1));
    expect(lit()).toEqual([ideas()[1]]);
  });
});

describe('DoctorCourses — a block, not a band (2026-10-13)', () => {
  it('wears nothing band-shaped — no Container, no container context, no rhythm, no band scale, no belt, no ground', () => {
    // sections/DoctorProfile owns all of it now (DoctorCourses.tsx's A
    // BLOCK, NOT A BAND): the full-bleed outer and its page ground, the belt,
    // ui/Container's gutter and container context, the rhythm `py` and the
    // band scale's two strings. One stray token of any of them here would
    // nest a second band inside DoctorProfile's.
    const { container } = renderBlock();
    const block = blockOf(container);
    const everyElement = [block, ...block.querySelectorAll('*')];
    const bandOwned = new Set(
      [containerClasses, bandColumnClasses, bandScaleClasses].flatMap((s) =>
        s.split(' '),
      ),
    );

    // Never vacuous: the block's own elements are really read.
    expect(everyElement.length).toBeGreaterThan(ITEMS.length * 3);
    for (const element of everyElement) {
      for (const token of tokensOf(element)) {
        expect(bandOwned.has(token), token).toBe(false);
        expect(token).not.toMatch(/(^|:)@container/);
        expect(token).not.toMatch(/(^|:)p[ytb]-/);
        expect(token).not.toMatch(/(^|:)overflow-/);
        expect(token).not.toMatch(/(^|:)bg-page$/);
        expect(token).not.toMatch(/(^|:)wrap-anywhere$/);
        expect(token).not.toMatch(/(^|:)scalable:/);
      }
    }
  });

  it('carries no media query and no container query anywhere — the band decides every width', () => {
    // §6.5: a section measures its own box, never the window, and since
    // 2026-10-13 even the box is DoctorProfile's to measure — this block has
    // no width-dependent class at all. The <h2>'s own step answers to the
    // nearest container (ui/Heading's `band` row), which is the band's.
    const { container } = renderBlock();
    const block = blockOf(container);

    for (const element of [block, ...block.querySelectorAll('*')]) {
      if (element.closest('h2') !== null) continue;
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(xs|sm|md|lg|xl|\d?xl):/);
        expect(token).not.toMatch(/(^|:)(min|max)-\[/);
        expect(token).not.toMatch(/(^|:)@/);
      }
    }
  });

  it('keeps prose start-aligned everywhere in the block (§15.15 b)', () => {
    // Every element is checked, not only the prose ones, because a wrapper's
    // alignment would inherit into its <li>s. (`origin-left` on an idea is a
    // transform origin, not an alignment — the pattern cannot match it.)
    const { container } = renderBlock();

    for (const element of container.querySelectorAll('*')) {
      expect(
        tokensOf(element).some((t) =>
          /(^|:)text-(center|justify|left|right|end)$/.test(t),
        ),
      ).toBe(false);
    }
  });

  it('renders nothing interactive and no message key path (§8.1)', () => {
    const { container } = renderBlock();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('DoctorCourses — ONE island, and this file is not it (§16)', () => {
  it('ships NO client directive in the BLOCK file — its one island is ./CourseTimeline', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as
    // the rest of the suite. The shell — section, name, eyebrow, <h2> — stays
    // on the server; the island's directive is pinned in its own suite.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b/);
    expect(CODE).not.toMatch(/next-intl/);
    expect(CODE).not.toMatch(/\bIntl\./);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('hands the island `items` and `intervalMs` alone — strings and a number cross, nothing else', () => {
    // Props that cross a server→client boundary are serialized into the
    // page's flight payload: the island is rendered exactly once, handed the
    // block's own `items` and its rhythm — no class name, no callback.
    expect(CODE.match(/<CourseTimeline\b/g)).toHaveLength(1);
    expect(CODE).toMatch(
      /<CourseTimeline items=\{items\} intervalMs=\{intervalMs\} \/>/,
    );
    // …and the rhythm's default is the block's own constant.
    expect(CODE).toMatch(/intervalMs = COURSES_INTERVAL_MS,/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports react, SectionHeading, lib/cx and its island — nothing else', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB block into a second populator, a stateful
    // composed child would hydrate the page without tripping the directive
    // check, and ui/Container or lib/scroll-spy coming back would be the old
    // band and its scroll-driven light.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './CourseTimeline',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/lib/cx/cx',
      'react',
    ]);
    // No lib DATA at all: a DUMB block knows no clinic, no price list and no
    // team (the round-1 ledger's D1) — and no scroll position.
    expect(CODE).not.toMatch(
      /@\/lib\/(clinic|prices|reviews|team|routes|hours|hero-slides|scroll-spy)/,
    );
    expect(CODE).not.toMatch(/ui\/Container/);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`)
    // forms add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });
});

describe('DoctorCourses — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('eyebrow');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('title');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('items');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('intervalMs');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('className');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('ref');
    expectTypeOf<DoctorCoursesProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorCoursesProps['items']>().toEqualTypeOf<
      readonly string[]
    >();
    expectTypeOf<DoctorCoursesProps['intervalMs']>().toEqualTypeOf<
      number | undefined
    >();
  });

  it('refuses the names, the slot and the shapes the types exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the props
    // loosen. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent). Every bad
    // shape stays on ONE line — an object literal broken across lines reports
    // its error at the offending PROPERTY, which would leave the directive
    // unused (DoctorProfile.test.tsx records the same TS2578 finding).
    const OK = { eyebrow: EYEBROW, title: TITLE, items: ITEMS };
    const GROUPS = [{ year: '2024', courses: [ITEMS[0]] }];

    // @ts-expect-error — content arrives as `items`; nested children would vanish
    const nested: DoctorCoursesProps = { ...OK, children: 'x' };
    // @ts-expect-error — the block's name is its <h2>'s text alone
    const renamed: DoctorCoursesProps = { ...OK, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's
    const repaired: DoctorCoursesProps = { ...OK, 'aria-labelledby': 'x' };
    // @ts-expect-error — the ideas are finished strings, never year groups
    const grouped: DoctorCoursesProps = { ...OK, items: GROUPS };
    // @ts-expect-error — the ideas are finished strings, not numbers to format
    const numeric: DoctorCoursesProps = { ...OK, items: [2024] };
    // @ts-expect-error — the ideas are REQUIRED; "no courses" is an empty list
    const bare: DoctorCoursesProps = { eyebrow: EYEBROW, title: TITLE };
    // @ts-expect-error — the rhythm is a number of milliseconds
    const worded: DoctorCoursesProps = { ...OK, intervalMs: '3s' };
    // @ts-expect-error — the band scale is DoctorProfile's: no prop switches it here
    const switched: DoctorCoursesProps = { ...OK, scaled: false };

    expect([
      nested,
      renamed,
      repaired,
      grouped,
      numeric,
      bare,
      worded,
      switched,
    ]).toHaveLength(8);
  });
});
