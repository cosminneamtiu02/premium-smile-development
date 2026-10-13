import { createRef, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  DoctorCourses,
  type DoctorCoursesProps,
} from '@/components/sections/DoctorCourses/DoctorCourses';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import {
  DoctorProfile,
  type DoctorProfileProps,
  type ProfileHeading,
} from './DoctorProfile';
import source from './DoctorProfile.tsx?raw';

// sections/DoctorProfile — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing test doubles as proof of accessible markup,
// and here that is most of the contract — each column opens with a REAL <h2>,
// EACH COLUMN is a `region` named by its own heading (the biography since the
// G2-R2 review's tier-2 a11y F2, the courses by sections/DoctorCourses' own
// <section aria-labelledby>), and the band itself is deliberately NOT a named
// region (so exactly TWO regions coming back, biography then courses, and
// neither of them the root, is an assertion rather than an omission). Since
// 2026-10-13 (CLAUDE.md §15.23 round 7) the band is the biography beside the
// courses on the plain page ground: no lilac, no schedule card, no outdent —
// and, since the owner's pack feedback the same evening, the biography on
// three fifths of the row and the courses on two, the two regions sharing the
// band's two rows from `@3xl`, and the paragraphs in the credo card's faint
// ink, any finished node each, so the page can hand them over with their key
// words.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the Wordmark/SectionHeading/PersonnelCard
// precedent). next-intl's hooks throw without one, so a green render proves
// what the run's D1 states: this band calls no t() and owns no message key —
// and neither does the courses' island it composes. Every string below is a
// FIXTURE the doctor page would have translated — Romanian with diacritics
// (§15.7), factual (CMSR: no superlatives, no promises, no result
// guarantees), D-DASH-clean (no mid-sentence punctuation dashes), and drafted
// for this suite rather than copied from lib/team, so a data edit can never
// turn a layout test red.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the 3 : 2 columns side by side at
// the step and stacked below it, the two contents starting on one line, no
// sideways scroll — is asserted one tier up, in DoctorProfile.stories' play
// functions; THE BAND SCALE's lengths (CLAUDE.md §15.32 round 4 — every length
// × the design pixel on a laptop or desktop, nothing moved elsewhere) and THE
// SHARED ROWS' lines are computed on the real stylesheet in
// DoctorProfile.scale.test.tsx, one premise per file (the PriceList.scale
// precedent). This file pins the CLASS contract.
//
// ── THE ONE OTHER SECTION IN THE BAND IS THE COURSES, RENDERED WHOLE:
// sections/DoctorCourses is this band's composed public component (§4's
// section → section rule), and the suite renders a BARE one with the same
// props to read its class row off the DOM — so this file spells none of the
// courses' own markup, and a retuned list turns DoctorCourses' suites red
// rather than this one. sections/SectionHeading is rendered bare ONCE for the
// same reason: "the band hands the biography's opener one class" is compared
// against the opener's own row rather than a copy of it.

// ── FIXTURES. The run's demo doctor, in three short third-person paragraphs
// — plain strings, which a ReactNode list takes as they are; the cases that
// need the page's shape hand over fragments with a <b>, as ui/Keyword's
// <Keywords> would — and five courses, one idea each, no year (the owner,
// 2026-10-13: "no year anymore. jsut dot ideas").
const ABOUT_HEADING = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
} satisfies ProfileHeading;

const PARAGRAPHS = [
  'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate fixe sau cu gutiere transparente, după caz.',
  'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns.',
  'Fiecare etapă este explicată înainte de a începe, cu durata estimată și costul ei. Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament.',
] as const;

/** Two paragraphs as the page hands them over: finished nodes, their key
 *  words already <b>s (ui/Keyword's <Keywords> renders exactly that — a
 *  fragment of text and <b>s, no wrapper). The band never sees a mark. */
const NODES: readonly ReactNode[] = [
  <>
    Dr. Elena Marin este medic specialist în <b>ortodonție</b> și lucrează cu{' '}
    <b>aparate fixe</b>.
  </>,
  <>
    <b>Planul de tratament</b> se stabilește împreună.
  </>,
];
/** The words of NODES, read as a screen reader or `textContent` reads them. */
const NODE_TEXTS = [
  'Dr. Elena Marin este medic specialist în ortodonție și lucrează cu aparate fixe.',
  'Planul de tratament se stabilește împreună.',
];

const COURSES = {
  eyebrow: 'Repere din drumul meu spre specializare',
  title: 'Cursuri și specializări',
  items: [
    'Curs de reabilitare protetică pe implanturi, București',
    'Curs de ortodonție digitală și scanare intraorală, Cluj-Napoca',
    'Curs de ortodonție interceptivă la copii, Timișoara',
    'Curs de aliniere dentară cu gutiere transparente, Iași',
    'Specializare în ortodonție și ortopedie dento-facială',
  ],
} as const satisfies DoctorProfileProps['courses'];

const ABOUT = { ...ABOUT_HEADING, paragraphs: PARAGRAPHS };
/** The courses with nothing in them — sections/DoctorCourses renders null. */
const NO_COURSES = { ...COURSES, items: [] };

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to the band's own classes, which an import would follow (the
// ui/Eyebrow RECIPE convention, and PersonnelCard's reading of it). These are
// the band's OWN markup; every atom's row, the Container's and the courses'
// are read off a render or an import. THE ONE EXCEPTION IS THE SCALE
// (`RHYTHM` below): its classes are ui/Container's two exported strings,
// compared against the IMPORTS — they are not the band's to spell,
// tests/unit/design-scale.test.ts holds them to ONE spelling, and a retyped
// copy of the design pixel's arbitrary class here would ship a CSS rule only
// this file needed (that census's D-LIT rule).
/** THE BAND OUTER: the paint and THE BELT — the clip, its Safari ≤ 15 twin
 *  behind its gate, and `wrap-anywhere` — and nothing else. */
const BAND =
  'overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden wrap-anywhere bg-page';
/** THE BELT's three tokens, which ride the outer and no other element. */
const BELT = [
  'overflow-x-clip',
  'supports-[not_(overflow:clip)]:overflow-x-hidden',
  'wrap-anywhere',
];
/** The rhythm box: the band's `py` on the Container's three steps, then
 *  ui/Container's band-scale column and pixel, in the order cx() joins them —
 *  the two strings READ OFF THE IMPORTS, never retyped. */
const RHYTHM_PY = ['py-12', '@lg:py-16', '@3xl:py-20'];
const RHYTHM = [
  ...RHYTHM_PY,
  ...bandColumnClasses.split(' '),
  ...bandScaleClasses.split(' '),
];
/** The grid with courses: one column, 64px between the two, and from `@3xl`
 *  THREE FIFTHS and TWO of the row 48px apart, over TWO rows 24px apart (the
 *  header's THE BIOGRAPHY THREE FIFTHS and THE SHARED ROWS). */
const GRID_TWO =
  'grid gap-16 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:grid-rows-[auto_auto] @3xl:gap-x-12 @3xl:gap-y-6';
/** The grid without courses: ONE column at every width (ONE BRANCH). */
const GRID_ONE = 'grid gap-16';
/** THE SHARED ROWS: from `@3xl` a region spans both rows and adopts them as a
 *  subgrid, its two children keep their own heights (THE ITEMS KEEP THEIR
 *  HEIGHTS), and its rows are packed at its top where subgrid is missing (THE
 *  FALLBACK). Worn by BOTH regions whenever the courses render. */
const SHARED_ROWS = [
  '@3xl:row-span-2',
  '@3xl:grid',
  '@3xl:grid-rows-subgrid',
  '@3xl:items-start',
  '@3xl:content-start',
];
/** The biography alone: a named region (G2-R2 a11y F2), a flex column at
 *  EVERY width — the opener over the paragraphs' block, 24px apart — and
 *  never `contents`, which would cost the region its role. */
const ABOUT_ALONE = 'flex flex-col gap-6';
/** The biography beside the courses: the same flex column, a subgrid of the
 *  band's two rows from `@3xl`. */
const ABOUT_SECTION = `${ABOUT_ALONE} ${SHARED_ROWS.join(' ')}`;
/** The paragraphs' block — `max-w-4xl` is the ONE lever on the measure. */
const PARAGRAPHS_BLOCK = 'flex max-w-4xl flex-col gap-4';
/** Each paragraph: the §15.1 body base, the credo card's faint ink (THE INK),
 *  justified ON THE ELEMENT (§15.1's third exception, §15.15 b). */
const PARAGRAPH = 'text-lg text-ink-faint contrast-more:text-ink text-justify';
/** A class behind globals.css's `scalable:` gate — every class of the scale
 *  wears it outermost (tests/unit/design-scale.test.ts). */
const GATED = /^scalable:/;
/** Any grid placement utility, at any variant. */
const PLACEMENT = /(^|:)-?(row|col)-(start|end|span)-/;
/** Any alignment utility, at any variant. */
const ALIGNMENT = /(^|:)(items|self|place-items|place-self|content|align)-/;

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this component
 * is deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and next-intl by name. Known limit, same as there: it strips block comments
 * and whole-line `//` comments, not a `//` trailing real code — a shape this
 * file does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`DoctorProfile: no ${name}`);
  }
  return node;
};

/** The <section> — the band itself; everything else is found through a role
 *  or, for the layout boxes that carry none, through structure. */
const bandOf = (container: HTMLElement): HTMLElement =>
  htmlElement(container.firstElementChild, 'band');
/** ui/Container — the band's ONE child (no fades, no tint: THE GROUND). */
const columnOf = (container: HTMLElement): HTMLElement =>
  htmlElement(bandOf(container).firstElementChild, 'ui/Container column');
/** The rhythm box — the column's one child, wearing THE BAND SCALE. */
const rhythmOf = (container: HTMLElement): HTMLElement =>
  htmlElement(columnOf(container).firstElementChild, 'rhythm box');
/** The grid — the rhythm box's one child; its children are the columns. */
const gridOf = (container: HTMLElement): HTMLElement =>
  htmlElement(rhythmOf(container).firstElementChild, 'grid');
const columnsOf = (container: HTMLElement): HTMLElement[] =>
  [...gridOf(container).children] as HTMLElement[];

/** The paragraphs' block — the biography's last child, under the opener. */
const paragraphsBlockOf = (container: HTMLElement): HTMLElement =>
  htmlElement(columnsOf(container)[0]?.lastElementChild, 'paragraphs’ block');

/** The band and every element in it — the walk the "nowhere else" pins use. */
const everyElementOf = (container: HTMLElement): Element[] => [
  bandOf(container),
  ...bandOf(container).querySelectorAll('*'),
];

/** The band's OWN boxes — the ones whose classes this file spells: the outer,
 *  the rhythm box, the grid, the biography's region, its paragraphs' block and
 *  each paragraph. ui/Container's row is the atom's, the opener's
 *  SectionHeading's and the courses' DoctorCourses' — each read off a render
 *  where this suite needs it, never claimed here. */
const ownBoxesOf = (container: HTMLElement): Element[] => {
  const about = htmlElement(columnsOf(container)[0], 'biography');
  const block = paragraphsBlockOf(container);
  return [
    bandOf(container),
    rhythmOf(container),
    gridOf(container),
    about,
    block,
    ...block.children,
  ];
};

const renderBand = (
  props: Partial<DoctorProfileProps> = {},
): ReturnType<typeof render> =>
  render(<DoctorProfile about={ABOUT} courses={COURSES} {...props} />);

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The courses' own class row, READ OFF A BARE sections/DoctorCourses with the
 * same three props — so what the band adds on top of it (THE SHARED ROWS, and
 * nothing else) is the only thing this suite claims.
 */
const bareCoursesRow = (): string => {
  const { container, unmount } = render(
    <DoctorCourses
      eyebrow={COURSES.eyebrow}
      title={COURSES.title}
      items={COURSES.items}
    />,
  );
  const row = htmlElement(
    container.firstElementChild,
    'bare courses',
  ).className;
  unmount();
  return row;
};

/** Every console.error React raised about a KEY while `run` rendered. */
const keyWarningsDuring = (run: () => void): string[] => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    run();
    return error.mock.calls
      .map((call) => call.map(String).join(' '))
      .filter((message) => /\bkey\b/i.test(message));
  } finally {
    error.mockRestore();
  }
};

describe('DoctorProfile — the biography ‖ the courses (§15.23 round 7)', () => {
  it('opens each column with its own <h2> — eyebrow over title, the biography first', () => {
    renderBand();

    // Level 2, both: the page's <h1> is the doctor's name, two bands up in
    // sections/DoctorIntro, and the two columns are siblings.
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      ABOUT_HEADING.title,
      COURSES.title,
    ]);
    // Each eyebrow sits directly ABOVE its own title (SectionHeading's
    // order), and the diacritics survive the chain — queried by TEXT, because
    // a role query would still match a mangled string.
    for (const [eyebrow, heading] of [
      [ABOUT_HEADING.eyebrow, headings[0]],
      [COURSES.eyebrow, headings[1]],
    ] as const) {
      const label = screen.getByText(eyebrow);
      expect(label.textContent).toBe(eyebrow);
      expect(label.nextElementSibling).toBe(heading);
    }
    // Nothing else claims a heading level — an <h1> here would fight the
    // page, and the courses' ideas are list items, never headings.
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('names TWO regions by their <h2>s, biography then courses — never the band (G2-R2 a11y F2)', () => {
    const { container } = renderBand();

    // A landmark walk over the doctor page stops on the doctor's story and on
    // the courses beside it (the header's TWO <h2>s, TWO REGIONS): exactly
    // two regions, in DOM order, each named by its own title ALONE —
    // exact-match queries, so a name that had picked up its eyebrow fails —
    // and the band's root is neither of them.
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(2);
    const [about, courses] = regions;
    expect(screen.getByRole('region', { name: ABOUT_HEADING.title })).toBe(
      about,
    );
    expect(screen.getByRole('region', { name: COURSES.title })).toBe(courses);
    expect(regions).not.toContain(bandOf(container));
    // Each region holds its OWN heading and not its sibling's: neither column
    // is nested in the other.
    const aboutHeading = screen.getByRole('heading', {
      level: 2,
      name: ABOUT_HEADING.title,
    });
    const coursesHeading = screen.getByRole('heading', {
      level: 2,
      name: COURSES.title,
    });
    expect(about).toContainElement(aboutHeading);
    expect(about).not.toContainElement(coursesHeading);
    expect(courses).toContainElement(coursesHeading);
    expect(courses).not.toContainElement(aboutHeading);
    // Both are bare <section>s made regions by their name — no role bolted on
    // (§9 semantic HTML first), the CredoCard idiom.
    for (const region of regions) {
      expect(region.tagName).toBe('SECTION');
      expect(region).not.toHaveAttribute('role');
    }
  });

  it('puts the biography’s id on its <h2>, never on the region or the opener', () => {
    renderBand();

    // useId() rides SectionHeading's `id` prop onto the heading (its id
    // paragraph), so aria-labelledby reads the title alone. The region keeps
    // no id of its own and the opener's wrapper carries none either.
    const about = screen.getByRole('region', { name: ABOUT_HEADING.title });
    const heading = screen.getByRole('heading', {
      level: 2,
      name: ABOUT_HEADING.title,
    });
    const id = heading.getAttribute('id');
    expect(id).toBeTruthy();
    expect(document.getElementById(id ?? '')).toBe(heading);
    expect(about).toHaveAttribute('aria-labelledby', id);
    expect(about).not.toHaveAttribute('id');
    expect(heading.parentElement).not.toHaveAttribute('id');
  });

  it('gives two bands on one page four different region ids (useId)', () => {
    render(
      <>
        <DoctorProfile about={ABOUT} courses={COURSES} />
        <DoctorProfile
          about={{ ...ABOUT, title: 'Despre Dr. Andrei Pop' }}
          courses={{ ...COURSES, title: 'Cursurile doctorului' }}
        />
      </>,
    );

    const ids = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(
      screen.getByRole('region', { name: 'Despre Dr. Andrei Pop' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Cursurile doctorului' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(4);
  });

  it('renders the paragraphs as <p>s, in order, in the credo card’s faint ink, justified (THE INK)', () => {
    const { container } = renderBand();

    const block = paragraphsBlockOf(container);
    expect(block.className).toBe(PARAGRAPHS_BLOCK);
    const paragraphs = [...block.children] as HTMLElement[];
    expect(paragraphs.map((p) => p.tagName)).toEqual(['P', 'P', 'P']);
    expect(paragraphs.map((p) => p.textContent)).toEqual([...PARAGRAPHS]);
    for (const paragraph of paragraphs) {
      // `text-ink-faint` — the credo card's grey, the owner's pack feedback of
      // 2026-10-13 ("like the text at [the credo quote] … so gary-ish er"),
      // 4.70:1 on the page ground — and JUSTIFIED on the element, the owner's
      // word of 2026-09-25 (round 2c), §15.1's third per-element exception.
      expect(paragraph.className).toBe(PARAGRAPH);
      // A plain string stays plain: one string became one <p>'s text.
      expect(paragraph.children).toHaveLength(0);
    }
    // ONE ink on the paragraphs — the faint one, never the full ink beside
    // it (a second `text-*` colour would leave the cascade to decide).
    for (const paragraph of paragraphs) {
      expect(
        tokensOf(paragraph).filter((token) =>
          /^text-(ink|accent|cta)/.test(token),
        ),
      ).toEqual(['text-ink-faint']);
    }
  });

  it('prints a paragraph that arrives as a NODE as it is — a fragment with a <b> lands inside its <p>, the band adds nothing', () => {
    // The page's shape (THE INK): ui/Keyword's <Keywords> hands over text and
    // <b>s with no wrapper, and the band prints whatever node it is given —
    // the <b>s become the <p>'s own children, the words read through intact.
    const { container } = renderBand({
      about: { ...ABOUT_HEADING, paragraphs: NODES },
    });

    const paragraphs = [
      ...paragraphsBlockOf(container).children,
    ] as HTMLElement[];
    expect(paragraphs.map((p) => p.tagName)).toEqual(['P', 'P']);
    expect(paragraphs.map((p) => p.textContent)).toEqual(NODE_TEXTS);
    for (const paragraph of paragraphs) {
      expect(paragraph.className).toBe(PARAGRAPH);
    }
    // The key words: <b>s, children of their <p> — no wrapper in between,
    // and no class from the band (ui/Keyword's recipe is the <b>'s own).
    const keywords = [...paragraphsBlockOf(container).querySelectorAll('b')];
    expect(keywords.map((b) => b.textContent)).toEqual([
      'ortodonție',
      'aparate fixe',
      'Planul de tratament',
    ]);
    for (const keyword of keywords) {
      expect(paragraphs).toContain(keyword.parentElement);
      expect(keyword).not.toHaveAttribute('class');
    }
  });

  it('keys the paragraphs by their INDEX — a node is never a key, and two equal paragraphs both print (THE KEYS ARE INDICES)', () => {
    // A key is invisible in the DOM, so two things carry the pin: React's own
    // warnings (none — a node as a key would stringify to one shared
    // "[object Object]", two equal strings would collide), and the source.
    let container: HTMLElement | undefined;
    const warnings = keyWarningsDuring(() => {
      ({ container } = renderBand({
        about: {
          ...ABOUT_HEADING,
          paragraphs: [...NODES, PARAGRAPHS[0], PARAGRAPHS[0]],
        },
      }));
    });
    expect(warnings).toEqual([]);
    expect(
      [...paragraphsBlockOf(htmlElement(container, 'render')).children].map(
        (p) => p.textContent,
      ),
    ).toEqual([...NODE_TEXTS, PARAGRAPHS[0], PARAGRAPHS[0]]);
    expect(CODE).toMatch(/\bkey=\{index\}/);
    expect(CODE).not.toMatch(/\bkey=\{paragraph\}/);
  });

  it('justifies the biography’s paragraphs and NOTHING else — and centres nothing (§15.15 b)', () => {
    const { container } = renderBand();

    // The elements that carry `text-justify` are exactly the biography's
    // paragraphs (the per-element canon: the utility rides each <p>, never a
    // wrapper) — the course ideas stay start-aligned (DoctorCourses' header).
    // And both openers are start-aligned: since the card left, nothing in the
    // band is centred.
    const justified = everyElementOf(container).filter((element) =>
      tokensOf(element).includes('text-justify'),
    );
    expect(justified).toEqual([...paragraphsBlockOf(container).children]);
    for (const element of everyElementOf(container)) {
      for (const token of tokensOf(element)) {
        if (token === 'text-justify' && justified.includes(element)) continue;
        expect(token).not.toMatch(/(^|:)text-(justify|center|end|right)$/);
      }
    }
  });

  it('opts the doctor’s name out of hyphenation — on the biography’s opener, never above the courses’ title (§15.14)', () => {
    const { container } = renderBand();

    // The biography's title carries a PERSON'S NAME, and the body's site-wide
    // `hyphens: auto` broke real doctors' names at a syllable on phones
    // (DoctorProfile.tsx's THE NAME IS NEVER SPLIT comment). The opt-out
    // rides SectionHeading's ROOT — the <h2>'s own wrapper, the region's
    // first child — and reaches the heading because `hyphens` inherits. The
    // CLASS is the pin: no stylesheet is loaded here, so a computed `hyphens`
    // would read back the browser's default with or without it.
    const about = screen.getByRole('region', { name: ABOUT_HEADING.title });
    const opener = htmlElement(
      screen.getByRole('heading', { level: 2, name: ABOUT_HEADING.title })
        .parentElement,
      'biography opener',
    );
    expect(opener).toBe(about.firstElementChild);
    expect(tokensOf(opener)).toContain('hyphens-none');
    // …and the courses' title keeps the inheritance: its words are ordinary
    // words, which may break at a syllable. Nothing from that <h2> up to the
    // band's root may carry the class, so a refactor that hoists the opt-out
    // to the grid, the rhythm box or the whole band fails here, naming the
    // element. The walk must reach the root, or it proved nothing.
    const band = bandOf(container);
    const path: HTMLElement[] = [];
    for (
      let element: HTMLElement | null = screen.getByRole('heading', {
        level: 2,
        name: COURSES.title,
      });
      element !== null && band.contains(element);
      element = element.parentElement
    ) {
      path.push(element);
    }
    expect(path.at(-1)).toBe(band);
    expect(
      path.filter((element) => tokensOf(element).includes('hyphens-none')),
    ).toEqual([]);
    // The opener's row is a bare SectionHeading's, read off a live render,
    // plus that ONE class, merged last — the band hands it nothing else.
    const { container: bare, unmount } = render(
      <SectionHeading level={2} eyebrow="x" title="y" />,
    );
    const bareRow = htmlElement(
      bare.firstElementChild,
      'bare opener',
    ).className;
    unmount();
    expect(opener.className).toBe(`${bareRow} hyphens-none`);
  });

  it('composes sections/DoctorCourses’ public component — its own row, its three props, and THE SHARED ROWS merged last', () => {
    const { container } = renderBand();

    // The courses column IS a bare DoctorCourses with the same eyebrow, title
    // and items, plus ONE thing the band hands it through `className`: THE
    // SHARED ROWS, placement in this band's grid (§6.8). Its class row is read
    // off a live render, never spelled here — the page ground, the belt, the
    // `py` and the scale are the band's, not handed down.
    const courses = screen.getByRole('region', { name: COURSES.title });
    expect(columnsOf(container)[1]).toBe(courses);
    expect(courses.className).toBe(
      `${bareCoursesRow()} ${SHARED_ROWS.join(' ')}`,
    );
    // Every idea, in the order given, as one list item each — printed, not
    // rewritten: the band forwards `items` untouched.
    const list = within(courses).getByRole('list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...COURSES.items]);
  });

  it('draws no divider — the gap separates the two columns', () => {
    const { container } = renderBand();

    // No side or top rule on the band's own boxes, no <hr>, no separator
    // role: nothing is drawn BETWEEN the biography and the courses (the
    // header's NO DIVIDER). The courses' own line down its rail is its
    // business, inside its region.
    const own = [
      bandOf(container),
      columnOf(container),
      rhythmOf(container),
      gridOf(container),
      ...columnsOf(container),
    ];
    for (const element of own) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)border(-|$)/);
        expect(token).not.toMatch(/(^|:)divide-/);
      }
    }
    expect(container.querySelector('hr')).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
  });
});

describe('DoctorProfile — the grid (THE BIOGRAPHY THREE FIFTHS, THE SHARED ROWS, ONE BRANCH)', () => {
  it('seats the biography and the courses as the grid’s two items — 3 : 2 from `@3xl` over two rows they share, one column below', () => {
    const { container } = renderBand();

    const grid = gridOf(container);
    expect(grid.className).toBe(GRID_TWO);
    // ONE track list, two SHARES of the row — the biography 1.2 × the equal
    // half round 7's first cut gave it, the courses 0.8 × — each with a zero
    // floor, so a long word never widens one column at the other's expense;
    // never a rem or px track, which THE BAND SCALE could not redraw. And ONE
    // row list: two auto rows, the openers' and the contents'.
    expect(tokensOf(grid).filter((token) => /grid-cols-/.test(token))).toEqual([
      '@3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
    ]);
    expect(tokensOf(grid).filter((token) => /grid-rows-/.test(token))).toEqual([
      '@3xl:grid-rows-[auto_auto]',
    ]);
    expect(
      tokensOf(grid).filter((token) => /\d(rem|px)\b/.test(token)),
    ).toEqual([]);
    // The row gap is the 24px each region keeps between its opener and its
    // content (both regions' `gap-6`), so a subgrid's own gap adds nothing.
    expect(tokensOf(grid)).toContain('@3xl:gap-y-6');
    expect(tokensOf(columnsOf(container)[0] ?? grid)).toContain('gap-6');

    const [about, courses] = columnsOf(container);
    expect(columnsOf(container)).toHaveLength(2);
    // The first item IS the biography's region (G2-R2 a11y F2): a flex
    // column at every width, the opener then the paragraphs' block — DOM
    // order = reading order = region order, in both arrangements (D21) — and
    // from `@3xl` a subgrid of the band's two rows.
    expect(about).toBe(
      screen.getByRole('region', { name: ABOUT_HEADING.title }),
    );
    expect(about?.className).toBe(ABOUT_SECTION);
    expect(about?.children).toHaveLength(2);
    expect(courses).toBe(screen.getByRole('region', { name: COURSES.title }));
    // THE SHARED ROWS on BOTH regions, whole, behind `@3xl` — the courses'
    // through its className (the test above reads the merge).
    for (const region of [about, courses]) {
      for (const token of SHARED_ROWS) {
        expect(tokensOf(htmlElement(region, 'region'))).toContain(token);
      }
    }
    // Placement: each region spans the two rows and NAMES nothing — no
    // column, no line; the DOM order seats the two side by side. None is
    // `contents`: a region never dissolves (the header's TWO REGIONS).
    for (const element of [grid, ...columnsOf(container)]) {
      expect(
        tokensOf(element).filter(
          (token) => PLACEMENT.test(token) || /(^|:)contents$/.test(token),
        ),
      ).toEqual(element === grid ? [] : ['@3xl:row-span-2']);
    }
    // Alignment: on each region, and only from `@3xl`, TWO utilities —
    // `@3xl:items-start`, so its opener and its content keep their own
    // heights at the top of their rows instead of stretching to them (THE
    // ITEMS KEEP THEIR HEIGHTS: the courses' island watches its list for the
    // off-screen hold), and `@3xl:content-start`, THE FALLBACK's belt —
    // and nothing on the grid.
    for (const element of [grid, ...columnsOf(container)]) {
      expect(
        tokensOf(element).filter((token) => ALIGNMENT.test(token)),
      ).toEqual(
        element === grid ? [] : ['@3xl:items-start', '@3xl:content-start'],
      );
    }
    // Every class of the arrangement waits for the Container's `@3xl`: below
    // it the grid is one column and both regions plain flex columns.
    for (const element of [grid, ...columnsOf(container)]) {
      const own = element === grid ? GRID_ONE : ABOUT_ALONE;
      for (const token of tokensOf(element)) {
        if (own.split(' ').includes(token)) continue;
        if (element === courses && bareCoursesRow().split(' ').includes(token))
          continue;
        expect(token, `${element.tagName} ${token}`).toMatch(/^@3xl:/);
      }
    }
  });

  it('with NO courses: ONE column at every width — no courses region, no list, no shared rows, the biography alone', () => {
    // sections/DoctorCourses renders nothing for an empty `items` (its EMPTY
    // paragraph), and the band's one branch is the same fact: no second
    // column waits beside nothing, no row waits to be shared, and the
    // biography stays a plain flex column (the header's ONE BRANCH, a
    // KEEP-IN-SYNC pair this test holds from both sides).
    const { container } = renderBand({ courses: NO_COURSES });

    expect(gridOf(container).className).toBe(GRID_ONE);
    expect(columnsOf(container)).toHaveLength(1);
    const about = screen.getByRole('region', { name: ABOUT_HEADING.title });
    expect(columnsOf(container)[0]).toBe(about);
    expect(about.className).toBe(ABOUT_ALONE);
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: COURSES.title })).toBeNull();
    expect(screen.queryByText(COURSES.eyebrow)).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    // The measure is then `max-w-4xl` on the paragraphs' block, as it always
    // was — the same block, the same row.
    expect(paragraphsBlockOf(container).className).toBe(PARAGRAPHS_BLOCK);
  });

  it('renders what it is given: no paragraphs is an empty block, not a branch', () => {
    // A page bug, not a state (the header's ONE BRANCH paragraph): the band
    // keeps its shape and simply has nothing to print in the block.
    const { container } = renderBand({
      about: { ...ABOUT_HEADING, paragraphs: [] },
    });

    const block = paragraphsBlockOf(container);
    expect(block.className).toBe(PARAGRAPHS_BLOCK);
    expect(block.children).toHaveLength(0);
    expect(columnsOf(container)).toHaveLength(2);
    expect(columnsOf(container)[0]?.className).toBe(ABOUT_SECTION);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
  });
});

describe('DoctorProfile — the ground, the belt and the scale (the header’s THE GROUND, THE BELT, THE BAND SCALE)', () => {
  it('stands on the plain page ground — ui/Container’s page-band recipe, no TintedBand', () => {
    const { container } = renderBand();

    // THE GROUND IS THE PLAIN PAGE (2026-10-13): the band is a <section> on
    // `bg-page` whose ONE child is ui/Container — no fade box before or after
    // it, no tinted middle, no colour mix anywhere in the band's own markup.
    // The faint ink of the paragraphs is chartered for this ground and barred
    // from the tint (THE INK; tests/unit/ink-faint-census.test.ts).
    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe(BAND);
    expect(band.children).toHaveLength(1);
    expect(columnOf(container).className).toBe(containerClasses);
    expect(columnOf(container).children).toHaveLength(1);
    expect(rhythmOf(container).children).toHaveLength(1);
    for (const element of [
      band,
      columnOf(container),
      rhythmOf(container),
      gridOf(container),
    ]) {
      expect(element.getAttribute('aria-hidden')).toBeNull();
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/color-mix|--tint|bg-linear|gradient/);
      }
    }
    // The one paint in the band's own markup is the page's.
    expect(
      ownBoxesOf(container).flatMap((element) =>
        tokensOf(element).filter((token) => /(^|:)bg-/.test(token)),
      ),
    ).toEqual(['bg-page']);
  });

  it('wears THE BELT on the full-bleed outer and on no other element of the band', () => {
    const { container } = renderBand();

    // The clip trims the lit idea's overshoot at the screen's edge only on
    // the outer (the header's THE BELT); on the Container or the grid it
    // would cut an idea at rest, and a second `wrap-anywhere` would be a
    // second, quieter version of the same rule. The belt's three tokens ride
    // the outer and NO other element of the band — the courses' included,
    // whose own belt moved here on 2026-10-13 — and no other box of the
    // band's own markup clips at all.
    const band = bandOf(container);
    for (const token of BELT) expect(tokensOf(band)).toContain(token);
    for (const element of everyElementOf(container)) {
      if (element === band) continue;
      expect(
        tokensOf(element).filter((token) => BELT.includes(token)),
        `${element.tagName}.${element.getAttribute('class') ?? ''}`,
      ).toEqual([]);
    }
    for (const element of ownBoxesOf(container)) {
      if (element === band) continue;
      expect(
        tokensOf(element).filter((token) =>
          /(^|:)overflow(-[xy])?-/.test(token),
        ),
        `${element.tagName}.${element.getAttribute('class') ?? ''}`,
      ).toEqual([]);
    }
  });

  it('wears THE BAND SCALE on the rhythm box — the `py` steps, then ui/Container’s two strings, imported, whole, in cx() order', () => {
    // The owner, 2026-10-13: "Whole page, like Home" (CLAUDE.md §15.32 round
    // 4). The rule is ui/Container's (THE BAND SCALE, recipe rule 5): the
    // band wears it unconditionally on its RHYTHM box — no prop, no box of
    // its own since the outdent left — and the box's classes are the `py`
    // steps and the two exports, nothing added, nothing dropped.
    const { container } = renderBand();

    const rhythm = rhythmOf(container);
    expect(rhythm.tagName).toBe('DIV');
    expect(tokensOf(rhythm)).toEqual(RHYTHM);
    // Never vacuous: the imported strings really carry the gate — the pin
    // above could not tell an emptied export from the scale.
    expect(RHYTHM.filter((token) => GATED.test(token)).length).toBeGreaterThan(
      0,
    );
    // A plain layout box: its class and nothing else — no role, no name, no
    // id, nothing a screen reader or a jump could find.
    expect(rhythm.getAttributeNames()).toEqual(['class']);
    // ONE box declares the design pixel: the gated classes ride it alone,
    // never the band, the Container, the grid or anything inside — the
    // courses included, which inherit the scale and wear none of their own.
    for (const element of everyElementOf(container)) {
      if (element === rhythm) continue;
      expect(
        tokensOf(element).filter((token) => GATED.test(token)),
        `${element.tagName}.${element.getAttribute('class') ?? ''}`,
      ).toEqual([]);
    }
  });

  it('keeps the biography on the column’s edge — no outdent, no negative margin anywhere in the band’s own markup', () => {
    const { container } = renderBand();

    // Round 2d's step into the gutter left with the lilac (the header's
    // HISTORY): the ONE margin utility on the band's own boxes is the scale
    // column's centring — no outdent, nothing negative — so the biography's
    // opener stands on the column's edge at every width.
    const margins = ownBoxesOf(container).flatMap((element) =>
      tokensOf(element).filter((token) => /(^|:)-?m[xytrblse]?-/.test(token)),
    );
    expect(margins).toEqual(['mx-auto']);
    // …and that one comes from ui/Container's column string, not this file.
    expect(bandColumnClasses.split(' ')).toContain('mx-auto');
  });
});

describe('DoctorProfile — no schedule, no lilac (the owner, 2026-10-13: “no more schedul box at all”)', () => {
  it('prints no week: no <dl>, no card, no third heading', () => {
    renderBand();

    expect(document.querySelector('dl, dt, dd')).toBeNull();
    expect(screen.getAllByRole('heading')).toHaveLength(2);
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('imports no schedule, no hours module and no tinted ground — read off the source', () => {
    expect(CODE).not.toMatch(/ScheduleCard/);
    expect(CODE).not.toMatch(/@\/lib\/hours\b/);
    expect(CODE).not.toMatch(/HoursRow/);
    expect(CODE).not.toMatch(/TintedBand/);
    expect(CODE).not.toMatch(/\bschedule\b/);
  });
});

describe('DoctorProfile — the native surface (§6.8)', () => {
  it('merges the caller className LAST on the <section>', () => {
    const { container } = renderBand({ className: 'mt-10' });

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe(`${BAND} mt-10`);
  });

  it('spreads native props onto the band', () => {
    const { container } = render(
      <DoctorProfile
        about={ABOUT}
        courses={COURSES}
        lang="de"
        id="profile"
        data-band="doctor-profile"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('id', 'profile');
    expect(band).toHaveAttribute('data-band', 'doctor-profile');
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    const { container } = render(
      <DoctorProfile about={ABOUT} courses={COURSES} ref={band} />,
    );

    expect(band.current).toBe(bandOf(container));
    expect(band.current?.tagName).toBe('SECTION');
  });

  it('takes no name of its own — the two headings are the structure', () => {
    const { container } = renderBand();

    // A <section> without an accessible name is a generic box, not a region:
    // there is no single noun covering "who the doctor is" and "what the
    // doctor has trained in", and a name invented for the pair would wrap the
    // two named columns in a third region called after one of them.
    const band = bandOf(container);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    expect(screen.getAllByRole('region')).not.toContain(band);
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
  });
});

describe('DoctorProfile — container steps only, zero islands of its own (§6.5, §16)', () => {
  it('carries no WIDTH media query anywhere — those are the page’s; its one media condition is THE BAND SCALE’s pointer gate, imported', () => {
    // Container variants (@lg:, @3xl:, the scale's @4xl: and @min-[…]:) are
    // the allowed shape: they measure the gutter COLUMN, which is what makes
    // the same band right inside a page and inside a story canvas the sidebar
    // narrowed. An arbitrary MEDIA variant is a `min-[…]:` or `max-[…]:` at
    // the start of a chain or after a colon; the container's own form carries
    // an `@` in front, and stays allowed.
    const { container } = renderBand();

    for (const element of everyElementOf(container)) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(^|:)(min|max)-\[/);
      }
    }
    // The ONE media condition in the band — globals.css's `scalable:` gate, a
    // fine pointer in an engine that registers custom properties, never a
    // width — rides the rhythm box alone, and only through ui/Container's
    // strings (the scale block above).
    const gatedElements = everyElementOf(container).filter((element) =>
      tokensOf(element).some((token) => GATED.test(token)),
    );
    expect(gatedElements).toEqual([rhythmOf(container)]);
  });

  it('ships NO client directive — the band itself is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment. The courses' island
    // is DoctorCourses' file, never this one.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bnext-intl\b/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    // The biography's region is named through useId — the CredoCard idiom,
    // server-safe and hydration-stable, so it costs no 'use client'. Once,
    // and nothing else.
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(']);
  });

  it('imports EXACTLY what it renders, plus react — never ui/Keyword, never lib/team', () => {
    // The import surface is the guard a regex over the body cannot be: a data
    // module imported here would make the band its own populator and break the
    // run's D1 in a way no rendered assertion would notice. Since 2026-10-13
    // the band renders ui/Container itself (the page-band recipe, with
    // TintedBand gone) and composes sections/DoctorCourses, whose props TYPE
    // it reads for `courses`; lib/hours and ./ScheduleCard left with the week.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/DoctorCourses/DoctorCourses',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/ui/Container/Container',
      '@/lib/cx/cx',
      'react',
    ]);
    // From ui/Container, the atom and the two band-scale strings — never the
    // gutter pair, which the atom already applies.
    expect(CODE).toMatch(
      /^import \{\s*Container,\s*bandColumnClasses,\s*bandScaleClasses,?\s*\} from '@\/components\/ui\/Container\/Container';$/m,
    );
    // From DoctorCourses, the component and its props TYPE — never an
    // internal (§4's section → section rule).
    expect(CODE).toMatch(
      /^import \{\s*DoctorCourses,\s*type DoctorCoursesProps,?\s*\} from '@\/components\/sections\/DoctorCourses\/DoctorCourses';$/m,
    );
    // No lib DATA at all (run D1): the words arrive finished.
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
    // THE KEY WORDS ARE THE PAGE'S (THE INK): the band names neither
    // ui/Keyword nor the cutter that feeds it — a paragraph arrives rendered.
    expect(CODE).not.toMatch(/@\/components\/ui\/Keyword/);
    expect(CODE).not.toMatch(/\bKeywords?\b|\bsplitKeywords\b|<b\b/);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive and no message-key path (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way.
    const { container } = renderBand();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    // Every character on the band, in order: the biography, then the courses.
    expect(container.textContent).toBe(
      `${ABOUT_HEADING.eyebrow}${ABOUT_HEADING.title}${PARAGRAPHS.join('')}` +
        `${COURSES.eyebrow}${COURSES.title}${COURSES.items.join('')}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('DoctorProfile — type-level pins', () => {
  it('pins the props surface so a refactor cannot quietly widen it', () => {
    // Erased to no-ops at runtime; they fail at `tsc --noEmit` time, naming
    // the property. `children` would be swallowed silently (JSX children beat
    // spread ones), and either ARIA naming attribute would turn the band into
    // a region announced by a name that covers only one of its columns.
    expectTypeOf<ProfileHeading>().toEqualTypeOf<
      Readonly<{ eyebrow: string; title: string }>
    >();
    // A paragraph is any finished node (THE INK): the page hands over
    // ui/Keyword's fragments, and a plain string is a node too.
    expectTypeOf<DoctorProfileProps['about']['paragraphs']>().toEqualTypeOf<
      readonly ReactNode[]
    >();
    // The courses are DoctorCourses' own three shown props, as given — the
    // eyebrow, the <h2> and the ideas — and its rhythm is NOT among them
    // (the band leaves `intervalMs` to DoctorCourses' default).
    expectTypeOf<DoctorProfileProps['courses']>().toEqualTypeOf<
      Readonly<{ eyebrow: string; title: string; items: readonly string[] }>
    >();
    expectTypeOf<DoctorProfileProps['courses']['items']>().toEqualTypeOf<
      DoctorCoursesProps['items']
    >();
    expectTypeOf<DoctorProfileProps['courses']>().not.toHaveProperty(
      'intervalMs',
    );
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('children');
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('aria-label');
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('aria-labelledby');
    // The week LEFT this band on 2026-10-13 ("no more schedul box at all"): a
    // caller still handing it over is a caller that has not dropped it.
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('schedule');
  });

  it('does carry the surface those pins are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin above would pass while proving
    // nothing.
    expectTypeOf<DoctorProfileProps>().toHaveProperty('about');
    expectTypeOf<DoctorProfileProps>().toHaveProperty('courses');
    expectTypeOf<DoctorProfileProps>().toHaveProperty('className');
  });

  it('takes the page’s shape — fragments with key words, or plain strings — as paragraphs', () => {
    // Compiles, or `tsc --noEmit` names the line: the doctor page's
    // <Keywords> output and the plain strings every story keeps are both
    // finished nodes.
    const keyworded: DoctorProfileProps = {
      about: { ...ABOUT_HEADING, paragraphs: NODES },
      courses: COURSES,
    };
    const plain: DoctorProfileProps = { about: ABOUT, courses: COURSES };
    expect([keyworded, plain]).toHaveLength(2);
  });

  it('refuses the shapes the Omits and the two columns exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the surface
    // loosens. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent).
    const BASE = {
      about: ABOUT,
      courses: COURSES,
    } satisfies DoctorProfileProps;

    // @ts-expect-error — the band exists for the doctor's words (run D1)
    const wordless: DoctorProfileProps = { courses: BASE.courses };
    // @ts-expect-error — the courses are the other column; empty is `items: []`
    const courseless: DoctorProfileProps = { about: BASE.about };
    // @ts-expect-error — content arrives as props; children would vanish
    const nested: DoctorProfileProps = { ...BASE, children: 'x' };
    // @ts-expect-error — the band deliberately has no one name
    const named: DoctorProfileProps = { ...BASE, 'aria-label': 'Despre' };
    // @ts-expect-error — a caller's pair would name it after one column
    const paired: DoctorProfileProps = { ...BASE, 'aria-labelledby': 'x' };
    // @ts-expect-error — the schedule card is gone (2026-10-13)
    const scheduled: DoctorProfileProps = { ...BASE, schedule: {} };
    // The last three sit INSIDE the literal: a multi-line object reports the
    // mismatch on the offending PROPERTY, and @ts-expect-error only silences
    // the line right under it (on the `const`, TS2578 reports it unused).
    const oneString: DoctorProfileProps = {
      ...BASE,
      // @ts-expect-error — paragraphs are a LIST of finished nodes, never one
      about: { ...ABOUT_HEADING, paragraphs: PARAGRAPHS[0] },
    };
    const paced: DoctorProfileProps = {
      ...BASE,
      courses: {
        ...COURSES,
        // @ts-expect-error — the rhythm is DoctorCourses' own default
        intervalMs: 1_000,
      },
    };
    const untitled: DoctorProfileProps = {
      ...BASE,
      // @ts-expect-error — the title names the courses' region: required
      courses: { eyebrow: COURSES.eyebrow, items: COURSES.items },
    };

    expect([
      wordless,
      courseless,
      nested,
      named,
      paired,
      scheduled,
      oneString,
      paced,
      untitled,
    ]).toHaveLength(9);
  });
});
