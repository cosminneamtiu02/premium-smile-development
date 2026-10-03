import { createRef, type Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import {
  DoctorCourses,
  type CourseGroup,
  type DoctorCoursesProps,
} from './DoctorCourses';
import source from './DoctorCourses.tsx?raw';

// sections/DoctorCourses — the interaction suite. Role-based queries wherever
// a role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this band is almost nothing BUT structure — a named `region`,
// its <h2>, one <h3> per year and one `list` per year, which is exactly the
// outline D15 chose headings to give a screen-reader user.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// DoctorProfile / SectionHeading precedent). next-intl's hooks throw without
// one, so a green render proves the band owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have translated —
// Romanian with diacritics (§15.7), invented courses in lib/team's shape
// (D17: the year left the line and became the group's label), D-DASH-clean.
// lib/team itself is deliberately NOT imported: a DUMB band's suite must not
// depend on the demo data a parallel lane is reshaping.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the stretches of line down the
// left at every width, each stopping 0.25rem above the next group (D50),
// every dot's centre ON its stretch, the rail's 56rem cap, the <h3>'s computed bold, the fade, the
// current year's colours and its forward motion — is asserted one tier up,
// in DoctorCourses.stories.tsx's play functions.
//
// ── THE BAND HAS ONE ISLAND SINCE ROUND 2g (D35): ./CourseTimeline, the rail
// and the year groups with the year being read lit. Its own suite
// (CourseTimeline.test.tsx) drives a real scroll and pins both states; THIS
// file pins the band around it — the region, the heading, the outline — and
// the island at REST, which is what the band renders at the top of a page and
// what its server HTML always is (§16 rule 2).
//
// ── THE PAGE ABOVE THE BAND. Since round 2k the island lights the year whose
// top has crossed the MIDDLE of the window (D49), so a band rendered at the
// very top of a test document would light its first years at mount — right
// for a page that begins with them, but no doctor page does: the opener and
// the profile band always stand above. One window-tall block, inserted before
// Testing Library's own container, plays them, so every render here starts
// with the rail below the middle, at rest (CourseTimeline.test.tsx pins the
// at-mount light for a rail that starts above it).
//
// No `process` shim, unlike DoctorIntro's suite: nothing in this band reaches
// ui/Image, so next/image's module-scope `process.env` read never loads.

const EYEBROW = 'Formare continuă';
const TITLE = 'Cursuri și specializări';

/** Four years, newest first — the page's order — the first with two lines so
 *  one group shows two bullets (the round-2 ledger's D17 demo rule). */
const GROUPS = [
  {
    year: '2024',
    courses: [
      'Curs de aliniere dentară cu gutiere transparente, București',
      'Curs de ortodonție digitală și scanare intraorală, Cluj-Napoca',
    ],
  },
  {
    year: '2023',
    courses: ['Congresul Asociației Europene de Ortodonție, Viena'],
  },
  {
    year: '2021',
    courses: ['Curs de ortodonție interceptivă la copii, Cluj-Napoca'],
  },
  {
    year: '2016',
    courses: [
      'Specializare în ortodonție și ortopedie dento-facială, UMF „Carol Davila”, București',
    ],
  },
] as const satisfies readonly CourseGroup[];

// ── THE BYTE PINS. The band's class strings as it renders AT REST — the
// rhythm box, the timeline's rail (the column of groups itself since round
// 2j), one faded group (easing opacity AND scale, the recede of the G2-R2
// tier-2 fold, react F1), its grey stretch of line, its grey dot (easing
// its colour AND scale, the dot's twin of F1), and the list — written out so
// a silent edit fails here. ONE recipe per part since round
// 2g (D34): the line runs down the left at every width, so there is no side
// and no parity left to pin; round 2j (D44) drew it in per-group stretches.
// The current recipes are CourseTimeline.test.tsx's. The GUTTER is
// deliberately NOT among them:
// it is imported from ui/Container, because
// tests/unit/gutter-single-spelling.test.ts fences src/ against a second
// spelling of the clamp. The <h3>'s ATOM classes are not among them either:
// they are ui/Heading's, derived below from a rendered atom
// (`restTitleClasses`), so a retuned tone row moves this suite with it
// instead of against it.
const RHYTHM_BOX = 'py-12 @lg:py-16 @3xl:py-20';
const RAIL = 'mt-8 flex max-w-4xl flex-col gap-20 @lg:mt-10 @3xl:mt-12';
const GROUP_REST =
  'relative origin-left ps-10 duration-300 motion-reduce:transition-none transition-[opacity,scale] opacity-65';
const STRETCH_REST =
  'absolute start-1.25 top-4.5 w-0.5 transition-colors motion-reduce:transition-none -bottom-19 bg-line';
const LAST_STRETCH_REST =
  'absolute start-1.25 top-4.5 w-0.5 transition-colors motion-reduce:transition-none bottom-0 bg-line';
const DOT_REST =
  'absolute start-0 top-3 size-3 rounded-full ring-4 ring-page motion-reduce:transition-none transition-[background-color,scale] bg-line';
const YEAR_REST = 'transition-colors motion-reduce:transition-none';
const LIST_REST =
  'mt-3 flex list-disc flex-col gap-3 ps-5 transition-colors motion-reduce:transition-none text-ink marker:text-ink-muted';
const ITEM = 'text-lg';

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The class string ui/Heading emits for a RESTING year label, read off a
 * RENDERED atom rather than retyped — the island asks for `size="section"
 * tone="accent-idle"` at rest (D44a: the years moved up from `title`), and
 * whatever the atom answers is what every <h3> must wear before the island's
 * own classes. Rendered and unmounted on its own so it never shares a screen
 * with the band.
 */
const restTitleClasses = (): string => {
  const { container, unmount } = render(
    <Heading size="section" tone="accent-idle">
      2024
    </Heading>,
  );
  const classes = (container.firstElementChild as HTMLElement).className;
  unmount();
  return classes;
};

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (the PersonnelCard/DoctorProfile mechanism).
 * Without it those guards police the file's own documentation: the header
 * discusses `'use client'`, `t()` and `Intl.NumberFormat` by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

let pageAbove: HTMLElement | undefined;

beforeEach(() => {
  pageAbove = document.createElement('div');
  pageAbove.style.height = '100vh';
  document.body.prepend(pageAbove);
});

afterEach(() => {
  pageAbove?.remove();
  pageAbove = undefined;
});

type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderBand = (
  placement: Placement = {},
  groups: readonly CourseGroup[] = GROUPS,
) =>
  render(
    <DoctorCourses
      eyebrow={EYEBROW}
      title={TITLE}
      groups={groups}
      {...placement}
    />,
  );

/** The band, and the boxes between it and the groups — reached by structure,
 *  because none of them carries a role of its own (the stretches and the dots
 *  are aria-hidden on purpose: pure paint, nothing to read). */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const columnOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const rhythmOf = (container: HTMLElement): HTMLElement =>
  columnOf(container).firstElementChild as HTMLElement;
/** The rail — since round 2j the column of groups ITSELF (D44c deleted the
 *  continuous line and the box that held it beside the column). */
const railOf = (container: HTMLElement): HTMLElement =>
  rhythmOf(container).children[1] as HTMLElement;
const groupsOf = (container: HTMLElement): HTMLElement[] =>
  [...railOf(container).children] as HTMLElement[];

describe('DoctorCourses — the region landmark (§9)', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> only becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" as well would be redundant ARIA (§9 semantic-HTML-first).
    const { container } = renderBand();

    const band = screen.getByRole('region', { name: TITLE });
    expect(band.tagName).toBe('SECTION');
    expect(band).toBe(bandOf(container));
    expect(band).not.toHaveAttribute('role');

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBeTruthy();
    expect(band).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('generates the heading id — two bands on one page never collide', () => {
    render(
      <>
        <DoctorCourses eyebrow={EYEBROW} title={TITLE} groups={GROUPS} />
        <DoctorCourses
          eyebrow={EYEBROW}
          title="Congrese și conferințe"
          groups={GROUPS}
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
    // never enters the outline, which is why the h2 is the band's only
    // level-2 heading.
    const { container } = renderBand();

    const eyebrow = within(bandOf(container)).getByText(EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    // …and it comes BEFORE the title in the DOM, as it does on screen.
    expect(
      eyebrow.compareDocumentPosition(
        screen.getByRole('heading', { level: 2 }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('stands on the page ground and merges the caller className LAST', () => {
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter here, no outer margin (§6.4: the page owns the
    // rhythm between its bands, D18).
    const { container } = renderBand();
    expect(bandOf(container).className).toBe('bg-page');

    const { container: placed } = renderBand({ className: 'scroll-mt-10' });
    expect(bandOf(placed).className).toBe('bg-page scroll-mt-10');
  });

  it('takes its gutter from ui/Container, never a second spelling', () => {
    const { container } = renderBand();

    expect(columnOf(container).className).toBe(containerClasses);
    expect(rhythmOf(container).className).toBe(RHYTHM_BOX);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    renderBand({ ref: band });

    expect(band.current).toBeInstanceOf(HTMLElement);
    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toContainElement(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    );
  });

  it('spreads remaining native props onto the section', () => {
    const { container } = render(
      <DoctorCourses
        eyebrow={EYEBROW}
        title={TITLE}
        groups={GROUPS}
        id="cursuri"
        lang="de"
        data-slot="doctor-courses"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('id', 'cursuri');
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('data-slot', 'doctor-courses');
    // A caller's id on the BAND never becomes the heading's — the name pair
    // keeps its generated one — and the region keeps its name.
    expect(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    ).not.toHaveAttribute('id', 'cursuri');
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
  });
});

describe('DoctorCourses — the years are headings, the courses lists (D15, D16)', () => {
  it('renders one <h3> per group, in the page’s order', () => {
    renderBand();

    const years = screen.getAllByRole('heading', { level: 3 });
    expect(years.map((year) => year.textContent)).toEqual(
      GROUPS.map((group) => group.year),
    );
    expect(years.every((year) => year.tagName === 'H3')).toBe(true);
    // h1 (the page's) → h2 (this band) → h3 (each year): nothing deeper, and
    // nothing level-2 but the band's own title.
    expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0);
  });

  it('dresses every RESTING year in ui/Heading’s section step + accent-idle ink, derived from the atom', () => {
    // D16 + D35 + D44a: the ink is the ATOM's tone row, never a className
    // this band spells — at rest the grey twin `accent-idle` (the same bold
    // in ink-muted), current the lilac `accent` (CourseTimeline.test.tsx) —
    // and the step is `section` (30px, "at least the size of what is now
    // current heading"). The expectation is whatever a rendered `<Heading
    // size="section" tone="accent-idle">` emits, then the <h3>'s own class,
    // merged last by the slot (the colour fade).
    const expected = `${restTitleClasses()} ${YEAR_REST}`;
    // Never vacuous: the atom's answer really carries the step, the ink and
    // the weight.
    expect(expected.split(' ')).toEqual(
      expect.arrayContaining(['text-3xl', 'font-bold', 'text-ink-muted']),
    );

    renderBand();
    for (const year of screen.getAllByRole('heading', { level: 3 })) {
      expect(year.className).toBe(expected);
    }
  });

  it('prints the groups exactly as given — the band never sorts', () => {
    // Newest-first is the PAGE's order (lib/team's `coursesByYear`, D17); a
    // band that re-sorted would be a second opinion about the data. Handed an
    // unsorted list, it prints the unsorted list.
    const shuffled = [GROUPS[2], GROUPS[0], GROUPS[3]];
    renderBand({}, shuffled);

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent),
    ).toEqual(['2021', '2024', '2016']);
  });

  it('gives each year ONE list of its lines, in order, under its heading', () => {
    const { container } = renderBand();

    // `role="list"` survives WebKit's list-style-none heuristic (the header);
    // getAllByRole finds it by that role, one per group.
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(GROUPS.length);

    for (const [index, group] of GROUPS.entries()) {
      const row = groupsOf(container)[index];
      const [stretch, dot, heading, list] = [...row.children];

      // The group is exactly [stretch, dot, h3, ul] — the painted stretch and
      // dot first (the rail tests below), then the year labelling the list
      // after it.
      expect(row.children).toHaveLength(4);
      expect(stretch).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(heading.tagName).toBe('H3');
      expect(heading.textContent).toBe(group.year);
      expect(list).toBe(lists[index]);
      expect(list.tagName).toBe('UL');
      expect(list).toHaveAttribute('role', 'list');
      expect(list.className).toBe(LIST_REST);

      const items = within(list as HTMLElement).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual([...group.courses]);
      for (const item of items) {
        expect(item.tagName).toBe('LI');
        expect(item.className).toBe(ITEM);
      }
    }
  });

  it('shows two bullets under the first year and one under each of the rest', () => {
    renderBand();

    expect(
      screen
        .getAllByRole('list')
        .map((list) => within(list).getAllByRole('listitem').length),
    ).toEqual([2, 1, 1, 1]);
  });

  it('renders NOTHING for an empty list — no region, no heading, no box', () => {
    // A doctor without courses has no band (the header's EMPTY paragraph).
    // The render not throwing is itself the proof that the island is never
    // reached: lib/scroll-spy refuses an empty list of ids out loud.
    const { container } = renderBand({}, []);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByText(EYEBROW)).toBeNull();
  });
});

describe('DoctorCourses — the timeline: a line down the left in stretches, a dot per year (D34, D44)', () => {
  it('draws the rail as the column of groups itself — no continuous line (D44c)', () => {
    // Round 2g's one line under the column is gone: each group carries its
    // own stretch, so the rail holds the groups and nothing else.
    const { container } = renderBand();

    const rail = railOf(container);
    expect(rail.className).toBe(RAIL);
    expect(rail.children).toHaveLength(GROUPS.length);
    expect(groupsOf(container).every((group) => group.tagName === 'DIV')).toBe(
      true,
    );
  });

  it('caps the rail at the prose measure — max-w-4xl, DoctorProfile’s lever', () => {
    // One column at the wide step would run a course line ~1200px at 1536.
    const { container } = renderBand();
    expect(tokensOf(railOf(container))).toContain('max-w-4xl');
  });

  it('doubles the space between subsections — gap-20 (D44b)', () => {
    const { container } = renderBand();
    expect(tokensOf(railOf(container))).toContain('gap-20');
    expect(tokensOf(railOf(container))).not.toContain('gap-10');
  });

  it('gives every year its own row — a flex column, never a grid', () => {
    // One group per row at EVERY width: a grid would put two years on one
    // row at the wide step, which is the round-2 shape the timeline replaced.
    const { container } = renderBand();

    expect(tokensOf(railOf(container))).toEqual(
      expect.arrayContaining(['flex', 'flex-col']),
    );
    // No grid and no CSS-columns spelling may creep back in anywhere.
    for (const element of container.querySelectorAll('*')) {
      expect(
        tokensOf(element).some((t) =>
          /(^|:)(grid|grid-cols-.+|columns-.+)$/.test(t),
        ),
      ).toBe(false);
    }
  });

  it('draws EVERY group the same way at rest — faded, no side, no parity, no wide-step variant', () => {
    // Round 2e's alternation (D28) is gone: whatever its index, a group is
    // indented from the line on its left, and nothing under the rail changes
    // at the wide step. The rail's own top margin is the one `@3xl:` token.
    // At rest every group recedes — `opacity-65` (D44c).
    const { container } = renderBand();

    for (const group of groupsOf(container)) {
      expect(group.className).toBe(GROUP_REST);
    }
    const wide = [...railOf(container).querySelectorAll('*')].flatMap(
      (element) => tokensOf(element).filter((t) => t.startsWith('@3xl:')),
    );
    expect(wide).toEqual([]);
    expect(tokensOf(railOf(container))).toContain('@3xl:mt-12');
  });

  it('opens every group with its grey stretch, then its grey dot — the stretch stopping above the next group, the last ending at its box', () => {
    const { container } = renderBand();
    const groups = groupsOf(container);

    for (const [index, group] of groups.entries()) {
      const [stretch, dot, heading, list] = [...group.children];
      const last = index === groups.length - 1;

      expect(stretch.tagName).toBe('SPAN');
      expect(stretch).toHaveAttribute('aria-hidden', 'true');
      expect(stretch).toBeEmptyDOMElement();
      expect(stretch.className).toBe(last ? LAST_STRETCH_REST : STRETCH_REST);
      expect(dot.tagName).toBe('SPAN');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toBeEmptyDOMElement();
      expect(dot.className).toBe(DOT_REST);
      // The H3 and the list FOLLOW the paint — the year is still the first
      // thing a reader meets in the group.
      expect(heading.tagName).toBe('H3');
      expect(list.tagName).toBe('UL');
    }
  });

  it('hides the stretches and the dots — and nothing else in the band', () => {
    // Pure paint: nothing to read. Everything else — the eyebrow, the title,
    // every year and every line — stays in the accessibility tree.
    const { container } = renderBand();

    const paint = groupsOf(container).flatMap((group) => [
      group.children[0],
      group.children[1],
    ]);
    expect([...bandOf(container).querySelectorAll('[aria-hidden]')]).toEqual(
      paint,
    );
  });

  it('draws a single year like any other, its stretch ending at its own box', () => {
    const { container } = renderBand({}, [GROUPS[3]]);

    const groups = groupsOf(container);
    expect(groups).toHaveLength(1);
    expect(groups[0].className).toBe(GROUP_REST);
    expect(groups[0].children[0].className).toBe(LAST_STRETCH_REST);
    expect(groups[0].children[1].className).toBe(DOT_REST);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

describe('DoctorCourses — the lit year is decided after mount (D35, §16 rule 2)', () => {
  it('prints the band at REST in the server HTML — no current year, nothing forward, no accent', () => {
    // renderToString IS the static export's render: the island's spy answers
    // from its frozen server snapshot, `{ current: null }`, so every doctor
    // page's HTML carries all its years grey and faded and none marked.
    const html = renderToString(
      <DoctorCourses eyebrow={EYEBROW} title={TITLE} groups={GROUPS} />,
    );

    expect(html).not.toContain('data-current');
    expect(html).not.toContain('accent-decorative');
    expect(html).not.toContain('animate-forward');
    expect(html).not.toContain('animate-pop');
    expect(html).not.toContain('aria-current');
    expect(html.match(/ opacity-65"/g)).toHaveLength(GROUPS.length);
    expect(html).toContain(TITLE);
    for (const group of GROUPS) expect(html).toContain(`>${group.year}<`);
  });

  it('marks no year at the top of a page — nothing is lit on arrival', () => {
    // The spy's `topFallback: 'none'`: until a year's top reaches the middle
    // of the window (D49), the whole timeline rests. (The scrolling half is
    // CourseTimeline.test.tsx's.)
    const { container } = renderBand();
    expect(bandOf(container).querySelector('[data-current]')).toBeNull();
  });

  it('gives each group an id — the spy’s getElementById target', () => {
    const { container } = renderBand();
    const ids = groupsOf(container).map((group) => group.id);

    expect(ids.every((id) => id !== '')).toBe(true);
    expect(new Set(ids).size).toBe(GROUPS.length);
    for (const [index, id] of ids.entries()) {
      expect(id.endsWith(`-${GROUPS[index].year}`)).toBe(true);
    }
  });
});

describe('DoctorCourses — container steps only, ONE island (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    const { container } = renderBand();

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

  it('keeps prose start-aligned everywhere in the band (§15.15 b)', () => {
    // Every element is checked, not only the prose ones, because a group
    // wrapper's alignment would inherit into its <li>s. (`origin-left` on a
    // year is a transform origin, not an alignment — the pattern cannot
    // match it.)
    const { container } = renderBand();

    for (const element of container.querySelectorAll('*')) {
      expect(
        tokensOf(element).some((t) =>
          /(^|:)text-(center|justify|left|right|end)$/.test(t),
        ),
      ).toBe(false);
    }
  });

  it('ships NO client directive in the BAND file — its one island is ./CourseTimeline (§16)', () => {
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

  it('hands the island `groups` alone — the one prop that crosses (D35)', () => {
    // Props that cross a server→client boundary are serialized into the
    // page's flight payload: the island is rendered exactly once, handed the
    // band's own `groups` and nothing else — no class name, no callback.
    expect(CODE.match(/<CourseTimeline\b/g)).toHaveLength(1);
    expect(CODE).toMatch(/<CourseTimeline groups=\{groups\} \/>/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports react, SectionHeading, Container, lib/cx and its island — nothing else', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB band into a second populator, and a
    // stateful composed child would hydrate the page without tripping the
    // directive check. ui/Heading moved into the island with the years.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './CourseTimeline',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/ui/Container/Container',
      '@/lib/cx/cx',
      'react',
    ]);
    // No lib DATA at all: a DUMB band knows no clinic, no price list and no
    // team (the round-1 ledger's D1).
    expect(CODE).not.toMatch(
      /@\/lib\/(clinic|prices|reviews|team|routes|hours|hero-slides)/,
    );
    // Side-effect (`import './x'`) and re-export (`export … from './x'`)
    // forms add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive and no message key path (§8.1)', () => {
    const { container } = renderBand();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('DoctorCourses — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('eyebrow');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('title');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('groups');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('className');
    expectTypeOf<DoctorCoursesProps>().toHaveProperty('ref');
    expectTypeOf<DoctorCoursesProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorCoursesProps['groups']>().toEqualTypeOf<
      readonly CourseGroup[]
    >();
  });

  it('pins `year` as a STRING — a label, never a number to format', () => {
    // `Intl.NumberFormat('ro')` prints „2.024"; the page hands the year over
    // finished and the band prints it verbatim (the header).
    expectTypeOf<CourseGroup['year']>().toEqualTypeOf<string>();
    expectTypeOf<CourseGroup['courses']>().toEqualTypeOf<readonly string[]>();
  });

  it('refuses the names, the slot and the shapes the types exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the props
    // loosen. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent). Every bad
    // shape stays on ONE line — an object literal broken across lines reports
    // its error at the offending PROPERTY, which would leave the directive
    // unused (DoctorProfile.test.tsx records the same TS2578 finding).
    const BAND = { eyebrow: EYEBROW, title: TITLE, groups: GROUPS };
    const LINES = ['Curs de ortodonție interceptivă, Viena'];
    const PIECES = [['Curs de ortodonție', 'Viena']];

    // @ts-expect-error — content arrives as `groups`; nested children would vanish
    const nested: DoctorCoursesProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band's name is its <h2>'s text alone
    const renamed: DoctorCoursesProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's
    const repaired: DoctorCoursesProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — a year is a finished label, not a number to format
    const numeric: CourseGroup = { year: 2024, courses: LINES };
    // @ts-expect-error — the lines are finished strings, not fragments to assemble
    const fragments: CourseGroup = { year: '2024', courses: PIECES };
    // @ts-expect-error — the groups are REQUIRED; "no courses" is an empty list
    const bare: DoctorCoursesProps = { eyebrow: EYEBROW, title: TITLE };

    expect([nested, renamed, repaired, numeric, fragments, bare]).toHaveLength(
      6,
    );
  });
});
