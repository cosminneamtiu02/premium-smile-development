import { act, render, screen, within } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
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
import { Heading, type HeadingTone } from '@/components/ui/Heading/Heading';
import { CourseTimeline, type CourseTimelineProps } from './CourseTimeline';
import source from './CourseTimeline.tsx?raw';
import type { CourseGroup } from './DoctorCourses';
import globalsCss from '@/styles/globals.css?raw';

// sections/DoctorCourses/CourseTimeline — THE ISLAND's suite (the doctor-pages
// run's round 2g, D35, reworked in round 2j, D44, and round 2k, D49 + D50):
// the rail, the groups with their stretches of line, and the ONE year brought
// forward as the visitor scrolls — the year whose top has crossed the middle
// of the window. It runs in the components project's real Chromium, so the
// scrolling below is the browser's own — a real scroll position, real
// getBoundingClientRect, real scroll events — and nothing is mocked: the
// mechanic is lib/scroll-spy, which has its own suite beside it; what is
// pinned HERE is the WIRING (the PriceList suite's division of labour for
// PriceMenu): that the ids reach the DOM, that the server HTML is all rest,
// that a scroll lights exactly one group and a further scroll hands the light
// on, and that the island starts and disposes its spy.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here, and the page's
// `scroll-padding-top: 6rem` does not exist either: the scrolling tests lend
// <html> the shell's 96px themselves — not because the middle line reads it
// (it does not, D49) but so that one test can PROVE it does not: a year
// lights at the middle of the window long before its top would reach the
// pill's line. The groups are stretched so they are reached one at a time.
// The looks that need real CSS — the colours, the fade, the forward motion,
// the pop, the break above every dot — are read back in
// DoctorCourses.stories.tsx's plays. The TOKENS those animations are minted
// from are pinned here, off globals.css's source text (the last describe).
//
// ── Fixtures are Romanian with diacritics (§15.7), invented courses in
// lib/team's shape (D17), D-DASH-clean — the band suite's four years.

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

// ── THE BYTE PINS, both states. The island's own class strings, written out
// so a silent edit fails here (D34 the rail, D35 the states, D44 the step,
// the gap and the forward subsection). The <h3>'s ATOM classes are not among
// them: they are ui/Heading's, derived below from a rendered atom, so a
// retuned tone row moves this suite with it. The group's transition LIST is
// per state since the G2-R2 tier-2 fold (react F1): the base keeps the clock
// and its reduced-motion switch, rest eases `[opacity,scale]` (the recede),
// current eases `opacity` alone and wears the settled `scale-104`
// unprefixed (the entry starts at a drawn 1.0) — the ONE CURRENT YEAR block
// below names the reason in a test of its own.
const RAIL = 'mt-8 flex max-w-4xl flex-col gap-20 @lg:mt-10 @3xl:mt-12';
const GROUP_BASE =
  'relative origin-left ps-10 duration-300 motion-reduce:transition-none';
const GROUP_IDLE = `${GROUP_BASE} transition-[opacity,scale] opacity-65`;
const GROUP_CURRENT = `${GROUP_BASE} scale-104 transition-opacity animate-forward motion-reduce:animate-none`;
const STRETCH_BASE =
  'absolute start-1.25 top-4.5 w-0.5 transition-colors motion-reduce:transition-none';
/** A stretch's reach: down the gap below its group to 0.25rem above the
 *  next (D50), or — the last — to its own box's end. */
const REACH = '-bottom-19';
const END = 'bottom-0';
const stretchIdle = (last: boolean): string =>
  `${STRETCH_BASE} ${last ? END : REACH} bg-line`;
const stretchCurrent = (last: boolean): string =>
  `${STRETCH_BASE} ${last ? END : REACH} bg-accent-decorative`;
/** The dot's transition list is per state too (the dot's twin of react F1):
 *  rest eases `[background-color,scale]` (a dot losing the light shrinks as
 *  it greys), current its colours alone (the `scale-125` lands at once and
 *  the pop carries the entry, as before). */
const DOT_BASE =
  'absolute start-0 top-3 size-3 rounded-full ring-4 ring-page motion-reduce:transition-none';
const DOT_IDLE = `${DOT_BASE} transition-[background-color,scale] bg-line`;
const DOT_CURRENT = `${DOT_BASE} transition-colors scale-125 bg-accent-decorative animate-pop motion-reduce:animate-none`;
const YEAR = 'transition-colors motion-reduce:transition-none';
const LIST_IDLE =
  'mt-3 flex list-disc flex-col gap-3 ps-5 transition-colors motion-reduce:transition-none text-ink marker:text-ink-muted';
const LIST_CURRENT =
  'mt-3 flex list-disc flex-col gap-3 ps-5 transition-colors motion-reduce:transition-none text-ink marker:text-accent-decorative';
const ITEM = 'text-lg';

/** The shell's `scroll-padding-top: 6rem`, in the pixels this file sets on
 *  <html> — globals.css is not loaded here. Lent so a test can show the
 *  middle line ignores it (see the header). */
const SCROLL_PADDING = 96;
/** A block above the timeline — the doctor page's opener and profile band,
 *  which is what makes `topFallback: 'none'` matter. */
const INTRO = 1_500;

/**
 * The classes ui/Heading answers for the `section` step (D44a) in `tone`,
 * read off a RENDERED atom rather than retyped — whatever the atom emits is
 * what the <h3> must wear before the island's own classes. Rendered and
 * unmounted on its own so it never shares a screen with the timeline.
 */
const yearAtomClasses = (tone: HeadingTone): string => {
  const { container, unmount } = render(
    <Heading size="section" tone={tone}>
      2024
    </Heading>,
  );
  const classes = (container.firstElementChild as HTMLElement).className;
  unmount();
  return classes;
};

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** Scroll and let the browser deliver its scroll event (the next rendering
 *  opportunity, never synchronously). Inside `act`, because the island's
 *  store publishes from that listener — a React update from outside React. */
const scrollToY = async (y: number): Promise<void> => {
  await act(async () => {
    window.scrollTo(0, y);
    await nextFrame();
    await nextFrame();
  });
};

/** The timeline below an intro, on a page with the shell's scroll padding. */
const mountOnPage = () => {
  document.documentElement.style.scrollPaddingTop = `${SCROLL_PADDING}px`;
  const view = render(
    <>
      <div style={{ height: `${INTRO}px` }} />
      <CourseTimeline groups={GROUPS} />
    </>,
  );
  return view;
};

/** The rail: the island's root, right after the intro block. */
const railOf = (container: HTMLElement): HTMLElement =>
  container.children[1] as HTMLElement;
/** The rail IS the column of groups since round 2j (the line box is gone). */
const groupsOf = (rail: HTMLElement): HTMLElement[] =>
  [...rail.children] as HTMLElement[];

/** Stretch every group so they are reached one at a time, and return the
 *  scroll offset at which a group's top sits ON THE MIDDLE of the window —
 *  the spy's `line: 'middle'` (D49), `rect.top ≤ innerHeight / 2`. The half
 *  is floored, so an odd window's half pixel puts the top inside the line. */
const stretch = (rail: HTMLElement): ((group: HTMLElement) => number) => {
  for (const group of groupsOf(rail)) group.style.minHeight = '1200px';
  return (group) =>
    Math.round(group.getBoundingClientRect().top + window.scrollY) -
    Math.floor(window.innerHeight / 2);
};

const lit = (rail: HTMLElement): HTMLElement[] =>
  groupsOf(rail).filter((group) => group.hasAttribute('data-current'));

/** One group's four parts: its stretch of line, the painted dot, the year,
 *  the list. */
const partsOf = (group: HTMLElement) => {
  const [stretch, dot, year, list] = [...group.children] as HTMLElement[];
  return { stretch, dot, year, list };
};

/** Is this group the rail's last (its stretch ends at its own box)? */
const isLast = (group: HTMLElement): boolean =>
  group.nextElementSibling === null;

const expectIdle = (group: HTMLElement): void => {
  const { stretch, dot, year, list } = partsOf(group);
  expect(group).not.toHaveAttribute('data-current');
  expect(group.className).toBe(GROUP_IDLE);
  expect(stretch.className).toBe(stretchIdle(isLast(group)));
  expect(dot.className).toBe(DOT_IDLE);
  expect(year.className).toBe(`${yearAtomClasses('accent-idle')} ${YEAR}`);
  expect(list.className).toBe(LIST_IDLE);
};

const expectCurrent = (group: HTMLElement): void => {
  const { stretch, dot, year, list } = partsOf(group);
  expect(group).toHaveAttribute('data-current');
  expect(group.className).toBe(GROUP_CURRENT);
  expect(stretch.className).toBe(stretchCurrent(isLast(group)));
  expect(dot.className).toBe(DOT_CURRENT);
  expect(year.className).toBe(`${yearAtomClasses('accent')} ${YEAR}`);
  expect(list.className).toBe(LIST_CURRENT);
};

/** The source with its prose removed — the island guards below police code,
 *  not the header that discusses `aria-current` and `'use client'` by name. */
const CODE = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

// ── THE PAGE ABOVE THE RAIL. Since round 2k the spy measures against the
// MIDDLE of the window (D49), so a rail rendered at the very top of a test
// document has its first years' tops above that middle — and lights one at
// mount, which is right (the last test in the ONE CURRENT YEAR block pins
// it) but is not the state the rest of this suite reads. On the doctor page
// the opener and the profile band always stand above the band, so one
// window-tall block, inserted before Testing Library's own container, plays
// them: every render starts with its rail below the middle, at rest.
let pageAbove: HTMLElement | undefined;

beforeEach(() => {
  pageAbove = document.createElement('div');
  pageAbove.style.height = '100vh';
  document.body.prepend(pageAbove);
});

// The runner is a live page: put the scroll position, the lent padding, the
// page above and any spy back, or the next test (and the next FILE) inherits
// them.
afterEach(() => {
  pageAbove?.remove();
  pageAbove = undefined;
  document.documentElement.style.scrollPaddingTop = '';
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

describe('CourseTimeline — §16 rule 2: the static HTML is all rest', () => {
  it('server-renders every group at rest — no data-current, no accent, nothing forward', () => {
    // renderToString IS the static export's render: no effect runs, the spy's
    // frozen server snapshot is `{ current: null }`, so what a crawler, a
    // no-JS visitor and hydration all see is the rest state — every
    // subsection faded, every stretch and dot grey (D44c).
    const html = renderToString(<CourseTimeline groups={GROUPS} />);

    expect(html).not.toContain('data-current');
    expect(html).not.toContain('accent-decorative');
    expect(html).not.toContain('animate-forward');
    expect(html).not.toContain('animate-pop');
    expect(html).not.toContain('scale-104');
    expect(html).not.toContain('scale-125');
    expect(html).not.toContain('aria-current');
    expect(html.match(/ opacity-65"/g)).toHaveLength(GROUPS.length);
    expect(html.match(/ bg-line"/g)).toHaveLength(GROUPS.length * 2);
    expect(html.match(/text-ink marker:text-ink-muted/g)).toHaveLength(
      GROUPS.length,
    );
  });

  it('hydrates that HTML with no mismatch — the ids included', () => {
    // The group ids come from useId, which is exactly the hook that must
    // agree between the server's render and the browser's first one.
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(<CourseTimeline groups={GROUPS} />);
    const serverIds = [...host.querySelectorAll('[id]')].map((el) => el.id);
    const recoverable = vi.fn();

    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(host, <CourseTimeline groups={GROUPS} />, {
        onRecoverableError: recoverable,
      });
    });

    expect(recoverable).not.toHaveBeenCalled();
    expect(serverIds).toHaveLength(GROUPS.length);
    expect([...host.querySelectorAll('[id]')].map((el) => el.id)).toEqual(
      serverIds,
    );
    act(() => root?.unmount());
    host.remove();
  });
});

describe('CourseTimeline — the rail (D34: the line on the left, at every width; D44: stretches, a doubled gap)', () => {
  it('is the rail: the column of groups itself, capped and spaced by gap-20', () => {
    // Round 2g's continuous line and the box that held it beside the column
    // are gone (D44c): the rail's children are the groups, nothing else.
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const rail = container.firstElementChild as HTMLElement;

    expect(rail.className).toBe(RAIL);
    expect(rail.children).toHaveLength(GROUPS.length);
    for (const group of groupsOf(rail)) expect(group.tagName).toBe('DIV');
  });

  it('doubles the gap between subsections — gap-20, round 2g’s gap-10 × 2 (D44b)', () => {
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const tokens = (container.firstElementChild as HTMLElement).className.split(
      ' ',
    );
    expect(tokens).toContain('gap-20');
    expect(tokens).not.toContain('gap-10');
  });

  it('stops each stretch ONE UNIT above the next group — reach = gap − 1, KEEP-IN-SYNC (D50)', () => {
    // A stretch runs down the gap below its group and stops 0.25rem short of
    // the next group's top, so it never runs under the next dot ("keep some
    // space empty until start of next subsection", owner, round 2k):
    // `-bottom-R` must equal `gap-G` − 1, or the break above every dot grows
    // (a wider gap) or closes (a narrower one). Read off the RENDERED
    // classes, so the relation is checked as it ships, not as this file
    // spells it.
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const rail = container.firstElementChild as HTMLElement;
    const step = (classes: string, prefix: string): number =>
      Number(
        new RegExp(`(?:^| )${prefix}(\\d+(?:\\.\\d+)?)(?: |$)`).exec(
          classes,
        )?.[1],
      );
    const gap = step(rail.className, 'gap-');
    const stretches = groupsOf(rail).map(
      (group) => partsOf(group).stretch.className,
    );

    expect(gap).toBe(20);
    for (const stretch of stretches.slice(0, -1)) {
      expect(step(stretch, 'top-')).toBe(4.5);
      expect(step(stretch, '-bottom-')).toBe(gap - 1);
    }
    // The last reaches no further than its own box.
    expect(stretches.at(-1)?.split(' ')).toContain(END);
  });

  it('has ONE recipe for every group — no side, no parity, no wide-step variant', () => {
    // The alternating layout (D28) is gone: every group is indented from the
    // line on the left, its dot on the line, at every width. The only `@3xl:`
    // token left in the island is the rail's own top margin.
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const rail = container.firstElementChild as HTMLElement;

    for (const group of groupsOf(rail)) expectIdle(group);
    const wide = [...rail.querySelectorAll('*'), rail].flatMap((element) =>
      (element.getAttribute('class') ?? '')
        .split(/\s+/)
        .filter((token) => token.startsWith('@3xl:')),
    );
    expect(wide).toEqual(['@3xl:mt-12']);
  });

  it('caps the rail at the prose measure — max-w-4xl (D34)', () => {
    // One column at the wide step would run a course line ~1200px at 1536;
    // the rail borrows DoctorProfile's measure instead.
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    expect(
      (container.firstElementChild as HTMLElement).className.split(' '),
    ).toContain('max-w-4xl');
  });

  it('opens every group with its stretch, then its dot, then the year, then the list', () => {
    // The stretch FIRST, so the dot paints over it (tree order); both are
    // empty aria-hidden paint.
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const rail = container.firstElementChild as HTMLElement;

    for (const [index, group] of groupsOf(rail).entries()) {
      const { stretch, dot, year, list } = partsOf(group);
      expect(group.children).toHaveLength(4);
      for (const paint of [stretch, dot]) {
        expect(paint.tagName).toBe('SPAN');
        expect(paint).toHaveAttribute('aria-hidden', 'true');
        expect(paint).toBeEmptyDOMElement();
      }
      expect(year.tagName).toBe('H3');
      expect(year.textContent).toBe(GROUPS[index].year);
      expect(list.tagName).toBe('UL');
      expect(list).toHaveAttribute('role', 'list');
      const items = within(list).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual([
        ...GROUPS[index].courses,
      ]);
      for (const item of items) expect(item.className).toBe(ITEM);
    }
    // Pure paint, nothing to read: the stretches and the dots, nothing else.
    expect([...rail.querySelectorAll('[aria-hidden]')]).toEqual(
      groupsOf(rail).flatMap((group) => {
        const { stretch, dot } = partsOf(group);
        return [stretch, dot];
      }),
    );
  });

  it('stops every stretch above the next group but the LAST, which ends at its own box', () => {
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const groups = groupsOf(container.firstElementChild as HTMLElement);

    for (const [index, group] of groups.entries()) {
      const tokens = partsOf(group).stretch.className.split(' ');
      const last = index === groups.length - 1;
      expect(tokens).toContain(last ? END : REACH);
      expect(tokens).not.toContain(last ? REACH : END);
    }
  });

  it('draws a single year like any other: its stretch ends at its own box', () => {
    const { container } = render(<CourseTimeline groups={[GROUPS[3]]} />);
    const [only] = groupsOf(container.firstElementChild as HTMLElement);

    expectIdle(only);
    expect(partsOf(only).stretch.className).toBe(stretchIdle(true));
  });

  it('seats the dot on the section step’s line and starts the stretch at its centre', () => {
    // D44a moved the year to the 36px `section` line: the dot's centre is
    // `top-3` + half of `size-3` = 1.125rem = the stretch's `top-4.5`, so the
    // line begins UNDER the dot at any root size (the header's RAIL).
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const [first] = groupsOf(container.firstElementChild as HTMLElement);
    const { stretch, dot } = partsOf(first);

    expect(dot.className.split(' ')).toEqual(
      expect.arrayContaining(['top-3', 'size-3']),
    );
    expect(stretch.className.split(' ')).toContain('top-4.5');
  });
});

describe('CourseTimeline — the ids (useId + the year)', () => {
  it('gives every group an id of the island’s own prefix and its year', () => {
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const groups = groupsOf(container.firstElementChild as HTMLElement);
    const prefix = groups[0].id.slice(0, -'-2024'.length);

    expect(prefix).not.toBe('');
    expect(groups.map((group) => group.id)).toEqual(
      GROUPS.map((group) => `${prefix}-${group.year}`),
    );
  });

  it('never collides with a second timeline in the same document', () => {
    // A docs page renders several stories into one document, and a page could
    // one day list two doctors' timelines: useId is what keeps the spy's
    // getElementById answering for the right one.
    const { container } = render(
      <>
        <CourseTimeline groups={GROUPS} />
        <CourseTimeline groups={GROUPS} />
      </>,
    );
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(ids).toHaveLength(GROUPS.length * 2);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CourseTimeline — ONE current year on scroll (D35, D49: the middle of the window)', () => {
  it('is all rest at the top of the page — the long intro keeps every year grey', () => {
    // `topFallback: 'none'`: no year's top has reached the middle, so nothing
    // is lit — "all are grayed out at rest" (owner, 2026-09-26). With the
    // spy's default fallback the FIRST year would be lit here.
    const { container } = mountOnPage();
    const rail = railOf(container);
    stretch(rail);

    expect(window.scrollY).toBe(0);
    expect(lit(rail)).toEqual([]);
    for (const group of groupsOf(rail)) expectIdle(group);
  });

  it('lights exactly the group whose top has reached the middle, and hands the light on', async () => {
    const { container } = mountOnPage();
    const rail = railOf(container);
    const middleOf = stretch(rail);
    const groups = groupsOf(rail);

    await scrollToY(middleOf(groups[0]));
    expect(lit(rail)).toEqual([groups[0]]);
    expectCurrent(groups[0]);

    // The second year's top reaches the middle: it is lit, and the first
    // returns to rest — "when not on current they should be deselected"
    // (owner).
    await scrollToY(middleOf(groups[1]));
    expect(lit(rail)).toEqual([groups[1]]);
    expectCurrent(groups[1]);
    expectIdle(groups[0]);
    for (const group of groups.slice(2)) expectIdle(group);
  });

  it('holds the settled 1.04 in a TRANSITIONED property and gives each state its own transition list (react F1)', async () => {
    // A transition starts only for a property the AFTER-change style lists,
    // and never from a value an animation holds. So the size lives in
    // `scale-104`, in both motion worlds (no `motion-reduce:` prefix); the
    // RESTING group lists `scale`, so a group that has just lost the light
    // eases 1.04 → 1 while it fades; the CURRENT group lists `opacity`
    // alone, so on entry `scale` jumps and the animation, starting at
    // 0.9615, draws exactly 1.0. The looks themselves need real CSS: the
    // `Current` story seeks both clocks at the swap (DoctorCourses.stories).
    const { container } = mountOnPage();
    const rail = railOf(container);
    const middleOf = stretch(rail);
    const [first, second] = groupsOf(rail);

    await scrollToY(middleOf(first));
    const tokens = (group: HTMLElement): string[] => group.className.split(' ');
    const transitions = (group: HTMLElement): string[] =>
      tokens(group).filter((token) => token.startsWith('transition'));

    expect(lit(rail)).toEqual([first]);
    expect(tokens(first).filter((token) => token.includes('scale'))).toEqual([
      'scale-104',
    ]);
    expect(transitions(first)).toEqual(['transition-opacity']);
    expect(transitions(second)).toEqual(['transition-[opacity,scale]']);
    expect(tokens(second).filter((token) => token.includes('scale-'))).toEqual(
      [],
    );
    // One clock and one reduced-motion switch, whichever state.
    for (const group of [first, second]) {
      expect(tokens(group)).toEqual(
        expect.arrayContaining([
          'duration-300',
          'motion-reduce:transition-none',
        ]),
      );
    }
    // The DOT follows the same rule on its own 150ms clock: at rest it
    // lists `scale` (it shrinks 1.25 → 1 as it greys), lit its colours alone
    // (the `scale-125` lands at once and the pop carries the entry).
    const dotOf = (group: HTMLElement): HTMLElement => partsOf(group).dot;
    expect(transitions(dotOf(first))).toEqual(['transition-colors']);
    expect(tokens(dotOf(first))).toContain('scale-125');
    expect(transitions(dotOf(second))).toEqual([
      'transition-[background-color,scale]',
    ]);
    for (const group of [first, second]) {
      expect(tokens(dotOf(group))).toContain('motion-reduce:transition-none');
    }
  });

  it('lights a year at the MIDDLE of the window — long before its top would reach the pill’s line (D49)', async () => {
    // The wiring of `line: 'middle'`, shown the only way it can be: two
    // pixels short of the middle nothing is lit, on the middle the first year
    // is — while its top is still far below the shell's 96px scroll padding,
    // the landing line rounds 2g and 2j lit at (a spy on that line would
    // light nothing here).
    const { container } = mountOnPage();
    const rail = railOf(container);
    const middleOf = stretch(rail);
    const [first] = groupsOf(rail);

    await scrollToY(middleOf(first) - 2);
    expect(lit(rail)).toEqual([]);

    await scrollToY(middleOf(first));
    expect(lit(rail)).toEqual([first]);
    expect(first.getBoundingClientRect().top).toBeGreaterThan(
      SCROLL_PADDING + 1,
    );
  });

  it('returns every year to rest when the visitor scrolls back above them', async () => {
    const { container } = mountOnPage();
    const rail = railOf(container);
    const middleOf = stretch(rail);

    await scrollToY(middleOf(groupsOf(rail)[2]));
    expect(lit(rail)).toEqual([groupsOf(rail)[2]]);

    await scrollToY(0);
    expect(lit(rail)).toEqual([]);
    for (const group of groupsOf(rail)) expectIdle(group);
  });

  it('lights the year being read AT MOUNT when the rail starts above the middle — no scroll needed', () => {
    // The other half of D49, pinned so it is never mistaken for a bug: with
    // no page above it, the rail's first years sit above the middle of the
    // window from the first frame, and the spy's first walk (start(), in the
    // island's effect) lights the LAST of them — the one at the reader's eye
    // — exactly as a scroll would. The server HTML is still all rest (§16
    // rule 2, the first describe); this is the browser's first look.
    pageAbove?.remove();
    const { container } = render(<CourseTimeline groups={GROUPS} />);
    const rail = container.firstElementChild as HTMLElement;
    const middle = window.innerHeight / 2;
    const reached = groupsOf(rail).filter(
      (group) => group.getBoundingClientRect().top <= middle + 1,
    );

    expect(window.scrollY).toBe(0);
    expect(reached.length).toBeGreaterThan(0);
    expect(lit(rail)).toEqual([reached.at(-1)]);
  });

  it('keeps the semantics identical in every state — no aria-current, same outline', async () => {
    // The light is visual emphasis only: nothing here is interactive, so the
    // navigation attribute has no place, and a screen reader reads the same
    // h3 + list in both states.
    const { container } = mountOnPage();
    const rail = railOf(container);
    const middleOf = stretch(rail);

    const outline = () =>
      screen
        .getAllByRole('heading', { level: 3 })
        .map((year) => year.textContent);
    const before = outline();
    await scrollToY(middleOf(groupsOf(rail)[1]));

    expect(outline()).toEqual(before);
    expect(screen.getAllByRole('list')).toHaveLength(GROUPS.length);
    expect(container.querySelector('[aria-current]')).toBeNull();
  });
});

describe('CourseTimeline — the spy’s lifecycle', () => {
  it('starts the spy after mount and disposes it on unmount', () => {
    // PriceMenu's shape: the listeners arrive with the effect and leave with
    // its cleanup — a leaked scroll listener would keep walking a timeline
    // that is no longer on the page.
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<CourseTimeline groups={GROUPS} />);
    const scroll = add.mock.calls.filter(([type]) => type === 'scroll');
    expect(scroll).toHaveLength(1);
    expect(scroll[0][2]).toEqual({ passive: true });

    unmount();
    const listener = scroll[0][1];
    expect(
      remove.mock.calls.some(
        ([type, handler]) => type === 'scroll' && handler === listener,
      ),
    ).toBe(true);
  });
});

describe('CourseTimeline — source pins (§16)', () => {
  it('is a client island: the directive is its first statement', () => {
    expect(CODE.trimStart()).toMatch(/^['"]use client['"];/);
  });

  it('imports react, ui/Heading, lib/cx, lib/scroll-spy and a TYPE from the band — nothing else', () => {
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './DoctorCourses',
      '@/components/ui/Heading/Heading',
      '@/lib/cx/cx',
      '@/lib/scroll-spy/scroll-spy',
      'react',
    ]);
    // The band's module is a SERVER component: only its type may cross, and
    // `import type` is erased at compile time, so no server code enters this
    // island's bundle (PriceMenu's PriceMenuItem precedent).
    expect(CODE).toMatch(/^import type \{[^}]*\} from '\.\/DoctorCourses';/m);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('asks the spy for the MIDDLE line and "none yet" above the first year, and marks no navigation', () => {
    // D49 + D35: the one spy call, both options in it — the middle of the
    // window as the line, nothing current above the first year.
    expect(CODE).toMatch(
      /createScrollSpy\(\{\s*ids: groups\.map\(idOf\),\s*line: 'middle',\s*topFallback: 'none',\s*\}\)/,
    );
    expect(CODE.match(/createScrollSpy\(/g)).toHaveLength(1);
    expect(CODE).not.toMatch(/aria-current/);
    expect(CODE).not.toMatch(/\.select\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('formats nothing and knows no language', () => {
    expect(CODE).not.toMatch(/\bIntl\b/);
    expect(CODE).not.toMatch(/next-intl|\buseTranslations\b|\bt\(/);
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
  });
});

describe('CourseTimeline — the tokens its animations are minted from (globals.css @theme)', () => {
  // Tailwind v4 mints `animate-forward` / `animate-pop` from `--animate-*`
  // declarations inside `@theme` and emits their keyframes only where worn:
  // a renamed or deleted token would leave the class silently inert (no
  // runtime error, no lint error), so the source text is the guard. Comments
  // are stripped first — the token layer explains itself in prose that names
  // both values.
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ');
  const theme = css.slice(
    css.indexOf('@theme {'),
    css.indexOf('@theme inline'),
  );

  it('declares --animate-forward inside @theme — the overshoot RELATIVE to the wearer’s scale-104: 0.9615 → 1.0192 → 1, drawn 1 → ~1.06 (measured ~1.065) → 1.04 (D44c, react F1)', () => {
    // The current group WEARS its settled 1.04 as `scale-104`, a transitioned
    // property, so a group that loses the light can ease back to 1; the
    // animation multiplies with it on `transform` and carries only the
    // overshoot — the drawn sizes divided by 1.04, ending at 1. The first
    // cut's `scale(1) → scale(1.06) → scale(1.04)`, held by `fill: both`,
    // snapped the recede in one frame (G2-R2 tier 2, react F1).
    expect(css.indexOf('@theme {')).toBeGreaterThanOrEqual(0);
    expect(theme).toContain(
      '--animate-forward: forward 450ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;',
    );
    expect(theme).toContain(
      '@keyframes forward { from { transform: scale(0.9615); } 60% { transform: scale(1.0192); } to { transform: scale(1); } }',
    );
  });

  it('keeps those keyframes and the wearer’s scale-104 in step — drawn 1 at the start, 1.06 at the 60 % keyframe, 1.04 settled (KEEP-IN-SYNC)', () => {
    // Two numbers in two files, one relation: the keyframes are the drawn
    // sizes over the size the island's current group wears. Read BOTH off
    // their sources, so a retuned `scale-*` without its keyframes (or the
    // reverse) fails here instead of drawing a group that jumps at the swap
    // or settles at the wrong size.
    const keyframes = theme.slice(theme.indexOf('@keyframes forward'));
    const frame = (selector: string): number => {
      const opening = `${selector} { transform: scale(`;
      const start = keyframes.indexOf(opening);
      expect(start).toBeGreaterThanOrEqual(0);
      const value = start + opening.length;
      return Number(keyframes.slice(value, keyframes.indexOf(')', value)));
    };
    const worn = /const groupCurrent =\s*'([^']*)'/.exec(CODE)?.[1] ?? '';
    const size =
      Number(/(?:^| )scale-(\d+)(?: |$)/.exec(worn)?.[1] ?? Number.NaN) / 100;

    expect(size).toBe(1.04);
    expect(frame('from') * size).toBeCloseTo(1, 3);
    expect(frame('60%') * size).toBeCloseTo(1.06, 3);
    expect(frame('to')).toBe(1);
  });

  it('still declares --animate-pop inside @theme — the lit dot’s (D36)', () => {
    expect(theme).toContain(
      '--animate-pop: pop 450ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;',
    );
    expect(theme).toContain(
      '@keyframes pop { from { transform: scale(0.7); } 60% { transform: scale(1.25); } to { transform: scale(1); } }',
    );
  });

  it('declares both AFTER the aura — the aura pin reads @theme to its first brace', () => {
    // tests/unit/aura-token.test.ts slices @theme up to its first `}`; a
    // keyframes block moved above the aura would truncate that slice.
    const aura = theme.indexOf('--shadow-aura:');
    expect(aura).toBeGreaterThanOrEqual(0);
    expect(theme.indexOf('--animate-pop:')).toBeGreaterThan(aura);
    expect(theme.indexOf('--animate-forward:')).toBeGreaterThan(aura);
    expect(theme.indexOf('}')).toBeGreaterThan(aura);
  });

  it('wears the forward motion ONLY with its reduced-motion pair (§9)', () => {
    // Source-level: every `animate-*` token in this island's code travels in
    // the same string as `motion-reduce:animate-none`.
    const wearers = [
      ...CODE.matchAll(/'[^'\n]*animate-(?:forward|pop)[^'\n]*'/g),
    ];
    expect(wearers.length).toBe(2);
    for (const [string] of wearers) {
      expect(string).toContain('motion-reduce:animate-none');
    }
  });
});

describe('CourseTimeline — type-level pins', () => {
  it('takes the finished groups and nothing else — strings only cross', () => {
    expectTypeOf<CourseTimelineProps>().toEqualTypeOf<
      Readonly<{ groups: readonly CourseGroup[] }>
    >();
  });
});
