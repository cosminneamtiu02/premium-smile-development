import { act, fireEvent, render, screen } from '@testing-library/react';
import testingUser from '@testing-library/user-event';
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { userEvent as realUser } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import heroSource from '@/components/sections/Hero/Hero.tsx?raw';
import type { ClockEnv } from '@/lib/clock/clock';
import ro from '@/messages/ro.json';
import {
  CARD_CAROUSEL_FIRST_DWELL_MS,
  CARD_CAROUSEL_FLAT_QUERY,
  CARD_CAROUSEL_INTERVAL_MS,
  CardCarousel,
  type CardCarouselCardCap,
  type CardCarouselCardHeight,
  type CardCarouselCardSize,
  type CardCarouselFlatFrom,
  type CardCarouselLabels,
  type CardCarouselProps,
} from './CardCarousel';
import source from './CardCarousel.tsx?raw';
import {
  ARRANGEMENTS,
  FLAT_STEP,
  PERSPECTIVE,
  STEP,
  flatPoseAt,
  poseAt,
} from './conveyor';

// sections/CardCarousel — the island's interaction suite: the consumption
// law's markup, the two arrows (always visible, first in the DOM, one tall
// chevron each, nothing painted behind it), the beads (one per card, named as
// its card, after the arrows and before the cards), the card cap, the clock in
// BOTH modes and its holds (focus, off screen, a drag — never a pointer at
// rest), the owner's OPTION 1 — every press stops the automatic movement for
// good: an arrow, a bead, a drag, a tap — the loop's ring and the bounded
// list's walk out and back, the hand (the axis, the release, the flick, the
// cancel, the swallowed click), the no-fly rule's classes, and the bounded
// list's full stops. Role queries throughout (§9, §13); Romanian fixtures.
//
// ── NO STYLESHEET HERE (tests/setup/components.ts loads none): every card box
// is as wide as the 600px frame `mount` draws, so a step of the ring is
// STEP × 600 px for the hand, and nothing is measured on screen — what the
// engine draws (the arrows' and the beads' boxes and colours included) is
// CardCarousel.geometry.test.tsx's and the stories'. The POSES are read back
// off each card's own `--tx` / `--ry` / `--sc`, the island's output.
//
// ── TIME AND THE ENVIRONMENT ARE THE SUITE'S (the reviews deck's convention):
// every carousel is built with an `env` of plain functions, fake timers appear
// only where a claim is about WHEN, and the IntersectionObserver is a stand-in
// the suite drives by hand (CourseTimeline's FakeObserver). Two userEvents, as
// in the deck's suite: @testing-library/user-event DISPATCHES, and
// vitest/browser's drives the real browser — only a trusted Tab sets the
// keyboard modality the focus hold reads.
//
// ── THE FLAT ROW (2026-10-25) is checked here as the island WRITES it — the
// prop's guards, its classes and custom properties (none of them without the
// prop), its query spelled once, the reach held at 0 in the server's HTML and
// measured after mount, the live cards it frees, and the drag's step in the
// row. Its measurement is the suite's to drive: the query's MediaQueryList and
// the ResizeObserver are stand-ins (FakeQuery, FakeResizer), and the widths
// the island reads are set inline on its boxes, which no stylesheet sizes
// here. What the engine DRAWS of the row is CardCarousel.geometry.test.tsx's.

const FRAME = 600;
const PITCH = STEP * FRAME;
const INTERVAL = 5_000;
const FIRST_DWELL = 15_000;

const TITLES = [
  'Sala de așteptare',
  'Cabinetul de tratament',
  'Instrumentele de lucru',
  'Un cabinet luminos',
  'Recepția clinicii',
  'Radiografia, pe ecran',
  'Totul pregătit pentru tine',
] as const;

const LABELS: CardCarouselLabels = {
  region: 'Galeria clinicii',
  role: ro.common.carousel.role,
  slideRole: ro.common.carousel.slideRole,
  previous: 'Cardul anterior',
  next: 'Cardul următor',
  picker: 'Alege fotografia',
};

/** „1 din 7" … — what a page hands over. */
const labelsFor = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${index + 1} din ${count}`);

/** `count` placeholder cards; the first holds a link for the click tests —
 *  and, `everyCard`, every other card one of its own (THE FLAT ROW's focus
 *  tests, where a side card holds the focus). */
const cardsFor = (count: number, everyCard = false): ReactNode[] =>
  TITLES.slice(0, count).map((title, index) => (
    <article key={title}>
      <h3>{title}</h3>
      {index === 0 && <a href="#prima">Deschide</a>}
      {everyCard && index > 0 && (
        <a href={`#card-${index + 1}`}>{`Deschide ${index + 1}`}</a>
      )}
    </article>
  ));

/** A browser that neither reduces motion nor hides the tab, unless asked. */
const quietEnv = (reduced = false): ClockEnv => ({
  prefersReducedMotion: () => reduced,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
});

/** A stand-in IntersectionObserver the suite drives by hand (CourseTimeline's). */
class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  readonly targets: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Deliver one entry for the first target: `true` is in view. */
  fire(inView: boolean): void {
    const [target] = this.targets;
    act(() => {
      this.callback(
        [
          {
            target,
            isIntersecting: inView,
            intersectionRatio: inView ? 1 : 0,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

/** A stand-in MediaQueryList for THE FLAT ROW's query, the suite's to flip —
 *  every other query stays the browser's own (stubFlatQuery). */
class FakeQuery {
  matches: boolean;
  readonly media = CARD_CAROUSEL_FLAT_QUERY;
  readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(
    _type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ): void {
    this.listeners.add(listener);
  }

  removeEventListener(
    _type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ): void {
    this.listeners.delete(listener);
  }

  /** The window crosses the query: `true` is the row. */
  flip(matches: boolean): void {
    this.matches = matches;
    act(() => {
      for (const listener of this.listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    });
  }
}

/** THE FLAT ROW's query answered by a FakeQuery until the test ends. */
function stubFlatQuery(matches: boolean): FakeQuery {
  const fake = new FakeQuery(matches);
  const real = window.matchMedia.bind(window);
  vi.stubGlobal('matchMedia', (query: string) =>
    query === CARD_CAROUSEL_FLAT_QUERY ? fake : real(query),
  );
  return fake;
}

/** A stand-in ResizeObserver the suite fires by hand: what it observes, and
 *  whether it was let go. */
class FakeResizer {
  static instances: FakeResizer[] = [];
  readonly callback: ResizeObserverCallback;
  readonly targets: Element[] = [];
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizer.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true;
  }

  /** A box changed size. */
  fire(): void {
    act(() => {
      this.callback([], this as unknown as ResizeObserver);
    });
  }
}

type MountOptions = {
  count?: number;
  mode?: 'loop' | 'bounded';
  visible?: 3 | 5;
  cardCap?: CardCarouselCardCap;
  /** THE FIXED CARD: a card width — never beside `cardCap`. */
  cardWidth?: string;
  /** THE FLAT ROW: beside a fixed card only. */
  flatFrom?: CardCarouselFlatFrom;
  /** THE CARDS' HEIGHT: their own, or the tallest's. */
  cardHeight?: CardCarouselCardHeight;
  reduced?: boolean;
  intervalMs?: number;
  startDelayMs?: number;
  /** Omit the rhythm entirely, so the island's own defaults run. */
  defaults?: boolean;
  /** Renders a focusable sibling on each side — the page around it. */
  neighbours?: boolean;
  /** A link in every card, not only the first (cardsFor). */
  linkEveryCard?: boolean;
};

function carouselFor(options: MountOptions = {}): ReactElement {
  const count = options.count ?? 7;
  const common = {
    slides: cardsFor(count, options.linkEveryCard),
    slideLabels: labelsFor(count),
    labels: LABELS,
    visible: options.visible ?? 3,
    mode: options.mode ?? 'loop',
    env: quietEnv(options.reduced),
    ...(options.cardHeight === undefined
      ? {}
      : { cardHeight: options.cardHeight }),
  } as const;
  // The card's size: ONE of its two answers, or neither (the default cap) —
  // and beside the fixed one, THE FLAT ROW when asked.
  const size: CardCarouselCardSize =
    options.cardWidth !== undefined
      ? {
          cardWidth: options.cardWidth,
          ...(options.flatFrom === undefined
            ? {}
            : { flatFrom: options.flatFrom }),
        }
      : options.cardCap !== undefined
        ? { cardCap: options.cardCap }
        : {};
  return options.defaults ? (
    <CardCarousel {...common} {...size} />
  ) : (
    <CardCarousel
      {...common}
      {...size}
      intervalMs={options.intervalMs ?? INTERVAL}
      startDelayMs={options.startDelayMs ?? FIRST_DWELL}
    />
  );
}

function mount(options: MountOptions = {}) {
  const carousel = carouselFor(options);
  const utils = render(
    <div style={{ width: FRAME }}>
      {options.neighbours ? (
        <>
          <button type="button">Înainte</button>
          {carousel}
          <button type="button">După</button>
        </>
      ) : (
        carousel
      )}
    </div>,
  );
  const region = (): HTMLElement =>
    screen.getByRole('region', { name: LABELS.region });
  const stage = (): HTMLElement =>
    region().querySelector('[aria-live]') as HTMLElement;
  const slides = (): HTMLElement[] => [
    ...stage().querySelectorAll<HTMLElement>(':scope > [role="group"]'),
  ];
  const centre = (): HTMLElement =>
    slides().find((slide) => !slide.hasAttribute('inert')) as HTMLElement;
  const picker = (): HTMLElement =>
    screen.getByRole('group', { name: LABELS.picker });
  const beads = (): HTMLButtonElement[] => [
    ...picker().querySelectorAll<HTMLButtonElement>('button'),
  ];
  return {
    ...utils,
    region,
    stage,
    slides,
    centre,
    picker,
    beads,
    bead: (label: string) => screen.getByRole('button', { name: label }),
    previous: () => screen.getByRole('button', { name: LABELS.previous }),
    next: () => screen.getByRole('button', { name: LABELS.next }),
    before: () => screen.getByRole('button', { name: 'Înainte' }),
  };
}

/** A card's pose, as the island wrote it (`--tx` in card widths, `--ry` in
 *  degrees). */
const shiftOf = (slide: HTMLElement): number =>
  Number(slide.style.getPropertyValue('--tx'));
const turnOf = (slide: HTMLElement): number =>
  Number(slide.style.getPropertyValue('--ry'));

/** The bead the page names current: the one with aria-current="true". */
const currentBeads = (beads: HTMLButtonElement[]): string[] =>
  beads
    .filter((bead) => bead.getAttribute('aria-current') === 'true')
    .map((bead) => bead.getAttribute('aria-label') ?? '');

/** What presses: a mouse, a pen's tip or a finger. */
type PointerKind = 'mouse' | 'pen' | 'touch';

/** A press on the stage's middle — a mouse's by default — ready to move. */
function press(
  stage: HTMLElement,
  pointerId = 1,
  pointerType: PointerKind = 'mouse',
) {
  const box = stage.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const init = {
    pointerId,
    pointerType,
    isPrimary: true,
    button: 0,
    buttons: 1,
  };
  fireEvent.pointerDown(stage, { ...init, clientX: x, clientY: y });
  return {
    move: (dx: number, dy = 0) =>
      fireEvent.pointerMove(stage, {
        ...init,
        clientX: x + dx,
        clientY: y + dy,
      }),
    up: (dx: number, dy = 0) =>
      fireEvent.pointerUp(stage, {
        ...init,
        buttons: 0,
        clientX: x + dx,
        clientY: y + dy,
      }),
    /** The browser takes the gesture — where the hand is, `dx` across. */
    cancel: (dx = 0) =>
      fireEvent.pointerCancel(stage, { ...init, buttons: 0, clientX: x + dx }),
  };
}

/** Drag `dx` and let go at once (a quick gesture) — a mouse's by default. */
function dragBy(
  stage: HTMLElement,
  dx: number,
  pointerType: PointerKind = 'mouse',
): void {
  const hand = press(stage, 1, pointerType);
  hand.move(dx / 2);
  hand.move(dx);
  hand.up(dx);
}

/** A mouse's main button, pressed and let go — for a press on a CONTROL (an
 *  arrow, a bead): the pointerdown and the pointerup, never the click. */
const MOUSE_DOWN = {
  pointerId: 1,
  pointerType: 'mouse',
  isPrimary: true,
  button: 0,
  buttons: 1,
} as const;
const MOUSE_UP = { ...MOUSE_DOWN, buttons: 0 } as const;

/** Wait real time — for a release that must NOT be a flick. */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** STOPPED FOR GOOD, as fake time can show it: the live region polite, and
 *  ten whole intervals later the centre card still the one named. */
function expectStoppedAt(
  carousel: ReturnType<typeof mount>,
  label: string,
): void {
  expect(carousel.centre()).toHaveAccessibleName(label);
  expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
  act(() => vi.advanceTimersByTime(10 * INTERVAL));
  expect(carousel.centre()).toHaveAccessibleName(label);
  expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
}

/** A source with its prose removed, for the contract guards. */
const codeOf = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** The island's source, its prose removed. */
const CODE = codeOf(source);

/**
 * PARK THE REAL POINTER before every mount (the reviews deck's recipe, its
 * CI round 2): this suite's real-browser focus tests click „Înainte", and a
 * mouse left resting where a carousel is about to appear is page-level state
 * a later test would inherit. A plain <div> at the very top of the body, so
 * no role query can match it.
 */
let parking: HTMLElement;

beforeAll(() => {
  parking = document.createElement('div');
  parking.textContent = 'parcare';
  document.body.prepend(parking);
});

afterAll(() => {
  parking.remove();
});

beforeEach(async () => {
  FakeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  await realUser.hover(parking);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CardCarousel — the region the law asks for', () => {
  it('is a named region wearing the localized roledescription', () => {
    const { region } = mount();
    expect(region().tagName).toBe('SECTION');
    expect(region()).toHaveAttribute('aria-roledescription', LABELS.role);
    expect(region()).not.toHaveAttribute('role');
  });

  it('names every card group with its finished label and the slide roledescription', () => {
    const { slides } = mount({ count: 5 });
    expect(slides().map((slide) => slide.getAttribute('aria-label'))).toEqual(
      labelsFor(5),
    );
    for (const slide of slides()) {
      expect(slide).toHaveAttribute('aria-roledescription', LABELS.slideRole);
      expect(slide).not.toHaveAttribute('aria-current');
    }
  });

  it('puts the controls FIRST in the DOM: previous → next → the beads → the cards', () => {
    const { region, stage, picker } = mount();
    const buttons = [...region().querySelectorAll('button')];
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      LABELS.previous,
      LABELS.next,
      ...labelsFor(7),
    ]);
    const follows = (a: Node, b: Node): boolean =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const [previous, next] = buttons;
    expect(follows(previous, next)).toBe(true);
    expect(follows(next, picker())).toBe(true);
    expect(follows(picker(), stage())).toBe(true);
    for (const button of buttons) expect(follows(button, stage())).toBe(true);
  });

  it('inerts every card but the centre one — they are previews — with aria-hidden as the belt', () => {
    const { slides, centre } = mount();
    expect(centre()).toHaveAccessibleName('1 din 7');
    expect(centre()).not.toHaveAttribute('aria-hidden');
    for (const slide of slides()) {
      if (slide === centre()) continue;
      expect(slide).toHaveAttribute('inert');
      expect(slide).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it.each([3, 5] as const)(
    'lays the loop’s cards on THE LINE by SIGNED offset in the %i-card window — the conveyor’s poses, three numbers a card and nothing more',
    (visible) => {
      const { slides } = mount({ visible });
      const positions = [0, 1, 2, 3, -3, -2, -1];
      expect(slides().map(shiftOf)).toEqual(positions.map((x) => poseAt(x).tx));
      expect(slides().map(turnOf)).toEqual(positions.map((x) => poseAt(x).ry));
      for (const [card, slide] of slides().entries()) {
        expect(Number(slide.style.getPropertyValue('--sc'))).toBe(
          poseAt(positions[card]).sc,
        );
        // The pose and the stacking rank — no ring angle, no roll: the
        // owner's "0 designs that look like „Când o schimbi"".
        expect([...slide.style].sort()).toEqual([
          '--ry',
          '--sc',
          '--tx',
          'z-index',
        ]);
      }
    },
  );

  it('writes the perspective and each window’s numbers onto the root — nothing of a ring', () => {
    for (const visible of [3, 5] as const) {
      const { region, unmount } = mount({ visible });
      expect(Number(region().style.getPropertyValue('--k'))).toBe(PERSPECTIVE);
      expect([...region().style].sort()).toEqual(
        visible === 3
          ? ['--f3', '--k', '--r3']
          : ['--f3', '--f5', '--k', '--r3', '--r5'],
      );
      unmount();
    }
  });
});

describe('CardCarousel — the arrows', () => {
  it('dresses previous and next as plain buttons with NOTHING PAINTED but the chevron: lilac at rest AND under the mouse — only a larger chevron there — the deep lilac pressed, the ink when disabled; every press and size an enabled arrow’s alone', () => {
    const { previous, next } = mount();
    for (const control of [previous(), next()]) {
      expect(control.tagName).toBe('BUTTON');
      expect(control).toHaveAttribute('type', 'button');
      const classes = control.className.split(/\s+/);
      expect(classes).toEqual(
        expect.arrayContaining([
          'pointer-events-auto',
          'group/arrow',
          'w-(--bar)',
          'text-accent',
          'enabled:active:text-accent-strong',
          'disabled:text-ink',
          'enabled:hover:*:scale-110',
          'enabled:active:*:scale-100',
          'motion-reduce:enabled:hover:*:scale-100',
          'focus-visible:-outline-offset-2',
        ]),
      );
      // Nothing painted behind the chevron: no ground, no border, no corner.
      expect(
        classes.filter((name) => /(^|:)(bg|border|rounded|shadow)-/.test(name)),
      ).toEqual([]);
      // The owner's "always lilla": NO colour of the hover's own, and so no
      // colour glide — the press and the disabling snap it.
      expect(classes.filter((name) => /hover:text-/.test(name))).toEqual([]);
      expect(
        classes.filter(
          (name) =>
            /^transition-/.test(name) ||
            name.startsWith('duration') ||
            name === 'active:duration-0',
        ),
      ).toEqual([]);
      // Every press of the colour and every size answers an ENABLED arrow
      // only: a disabled arrow never turns lilac nor grows.
      const reactions = classes.filter((name) =>
        /(hover|active):(text-|\*:scale-)/.test(name),
      );
      expect(reactions).toHaveLength(4);
      for (const name of reactions) {
        expect(name).toMatch(/^(motion-reduce:)?enabled:/);
      }
      // The press snaps the size on the chevron.
      expect(classes).toContain('active:*:duration-0');
      expect(control.textContent).toBe('');
    }
  });

  it('stands each chevron against its strip’s OUTER edge — the owner’s “a very very little moved to the sides”: previous to the start, next to the end, half a theme step in', () => {
    const { previous, next } = mount();
    for (const [control, side, other] of [
      [previous(), ['justify-start', 'ps-0.5'], ['justify-end', 'pe-0.5']],
      [next(), ['justify-end', 'pe-0.5'], ['justify-start', 'ps-0.5']],
    ] as const) {
      const classes = control.className.split(/\s+/);
      expect(classes).toEqual(expect.arrayContaining([...side]));
      for (const name of [...other, 'justify-center']) {
        expect(classes).not.toContain(name);
      }
    }
  });

  it('draws ONE tall chevron per arrow — decorative, stretched to its box, its stroke never stretched, over a halo of the page ground — pointing out of the stage', () => {
    const { previous, next } = mount();
    for (const [control, outward] of [
      [previous(), -1],
      [next(), 1],
    ] as const) {
      const glyphs = control.querySelectorAll('svg');
      expect(glyphs).toHaveLength(1);
      const [svg] = glyphs;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 144');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      // 1.5rem by 9rem — six times taller than wide — never taller than its
      // strip, never wider than its strip less a theme step; the size's own
      // clock is the jump's.
      expect(svg.getAttribute('class')?.split(/\s+/)).toEqual(
        expect.arrayContaining([
          'w-[min(calc(var(--spacing)*6),calc(var(--bar)_-_var(--spacing)))]',
          'h-36',
          'max-h-full',
          '[--jump:200ms]',
          'transition-[scale]',
          'duration-(--jump)',
          'ease-[ease-out]',
          'motion-reduce:transition-none',
        ]),
      );
      // THE HALO FIRST, THE LINE ON TOP: the same path twice, both
      // non-scaling — the halo in the page ground, the line's width and half
      // a theme step more a side, not drawn in forced colours; the line the
      // svg's currentColor at the svg's own width, its one class the disabled
      // arrow's half strength.
      const paths = svg.querySelectorAll('path');
      expect(paths).toHaveLength(2);
      const [halo, line] = paths;
      expect(halo.getAttribute('d')).toBe(line.getAttribute('d'));
      for (const path of [halo, line]) {
        expect(path).toHaveAttribute('vector-effect', 'non-scaling-stroke');
      }
      expect(halo.getAttribute('class')?.split(/\s+/).sort()).toEqual(
        [
          'stroke-page',
          '[stroke-width:calc(var(--spacing)*1.425)]',
          'forced-colors:hidden',
        ].sort(),
      );
      expect(svg.getAttribute('class')?.split(/\s+/)).toContain(
        '[stroke-width:calc(var(--spacing)*0.425)]',
      );
      expect(line.getAttribute('class')).toBe(
        'group-disabled/arrow:opacity-50',
      );
      expect(line).not.toHaveAttribute('stroke');
      // Three points, each arm from a corner to the middle of the opposite
      // edge: the middle point is the tip, on the outward side.
      const points = [
        ...(line.getAttribute('d') ?? '').matchAll(/(-?[\d.]+) (-?[\d.]+)/g),
      ].map(([, x, y]) => [Number(x), Number(y)] as const);
      expect(points).toHaveLength(3);
      const [first, tip, last] = points;
      expect(tip[1]).toBe(72);
      expect([first[1], last[1]]).toEqual([1, 143]);
      expect(Math.sign(tip[0] - first[0])).toBe(outward);
      expect(first[0]).toBe(last[0]);
    }
  });

  it('keeps previous and next ALWAYS VISIBLE — nothing hides them, nothing reveals them on focus — in the tree, in the Tab order, over the stage', () => {
    const { previous, next } = mount();
    const overlay = previous().parentElement;
    expect(overlay).not.toBeNull();
    expect(next().parentElement).toBe(overlay);
    const classes = overlay?.className.split(/\s+/) ?? [];
    expect(classes).not.toContain('sr-only');
    expect(classes.filter((name) => name.startsWith('focus-within'))).toEqual(
      [],
    );
    // Laid over the stage's own grid row: as wide as the stage, from its top
    // padding to its room, one step above the cards, and through to them but
    // for the two arrows.
    expect(classes).toEqual(
      expect.arrayContaining([
        'pointer-events-none',
        'absolute',
        'row-start-1',
        'col-start-1',
        'w-(--stage)',
        'top-2',
        'bottom-(--room)',
        'z-1',
        'justify-between',
      ]),
    );
    for (const control of [previous(), next()]) {
      expect(control.className.split(/\s+/)).toContain('pointer-events-auto');
      expect(control).not.toHaveAttribute('tabindex', '-1');
      expect(control).not.toHaveAttribute('aria-hidden');
    }
  });

  it('spells the arrows’ strip ONCE, on the root — nine theme steps and never under 24px, read by the arrows and by the room the stage keeps for them', () => {
    for (const visible of [3, 5] as const) {
      const { region, previous, next, unmount } = mount({ visible });
      const root = region().className.split(/\s+/);
      expect(root).toContain('[--bar:max(24px,calc(var(--spacing)*9))]');
      expect(root.filter((name) => name.startsWith('[--bar:'))).toHaveLength(1);
      // The room: the three-card stage takes up to a strip a side, the
      // five-card window always keeps one, its card shrinking to make it.
      expect(root).toContain(
        '[--s3:min(100cqw,calc(var(--c3)*var(--r3)_+_2*var(--bar)))]',
      );
      if (visible === 5) {
        expect(root).toContain(
          '[--c5:min(var(--cap),calc((100cqw_-_2*var(--bar))/var(--r5)))]',
        );
        // THE FLOOR: twelve rem, in the theme's step.
        expect(root).toContain('[--min5:calc(var(--spacing)*48)]');
      }
      for (const control of [previous(), next()]) {
        expect(control.className.split(/\s+/)).toContain('w-(--bar)');
      }
      unmount();
    }
  });
});

describe('CardCarousel — the beads', () => {
  it('draws one bead per card in a group named by the picker word: buttons named as their cards, the centred card’s aria-current', () => {
    const { picker, beads, centre } = mount();
    expect(picker()).toHaveAccessibleName(LABELS.picker);
    expect(beads()).toHaveLength(7);
    expect(beads().map((bead) => bead.getAttribute('aria-label'))).toEqual(
      labelsFor(7),
    );
    for (const bead of beads()) {
      expect(bead).toHaveAttribute('type', 'button');
      // A button with aria-current — never a tab (lib/rotation's law).
      expect(bead).not.toHaveAttribute('role');
    }
    expect(currentBeads(beads())).toEqual([
      centre().getAttribute('aria-label'),
    ]);
  });

  it('dresses each bead in the Hero’s recipe, recoloured for the page ground: the lilac pill for the current card, a grey dot one step darker under the mouse for the rest — the hit box never under 24px wide, its dot centred, and bordered in forced colours', () => {
    const { beads } = mount();
    for (const bead of beads()) {
      expect(bead.className.split(/\s+/)).toEqual(
        expect.arrayContaining([
          'group/bead',
          'h-11',
          'px-2',
          'focus-visible:outline-focus',
          // SC 2.5.8 at any scale: an UNSCALED floor, the dot centred in it.
          'min-w-[24px]',
          'justify-center',
          // In forced colours the dot's ground is the system's own and draws
          // nothing to rely on: the hit box's border does.
          'forced-colors:border',
        ]),
      );
      const dot = bead.querySelector('span');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      const classes = dot?.className.split(/\s+/) ?? [];
      if (bead.getAttribute('aria-current') === 'true') {
        expect(classes).toEqual(expect.arrayContaining(['w-7', 'bg-accent']));
      } else {
        expect(classes).toEqual(
          expect.arrayContaining([
            'w-2',
            'bg-ink-faint',
            'group-hover/bead:bg-ink-muted',
          ]),
        );
      }
    }
  });

  it('KEEPS IN SYNC with the Hero’s beads: the same hit box, the same dot and pill, the same timing — the colours each band’s own', () => {
    const tokens = (text: string): string[] => text.trim().split(/\s+/);
    const constant = (name: string): string => {
      const found = new RegExp(`const ${name} =\\s*'([^']+)'`).exec(CODE);
      if (found?.[1] === undefined) throw new Error(`no ${name}`);
      return found[1];
    };
    const hero = codeOf(heroSource);
    // The hit box: the Hero's bead button wears the very string.
    expect(hero).toContain(`className="${constant('BEAD')}"`);
    // The dot: the Hero's, less the shadow its photograph needs.
    const heroDot = /'(block h-2 rounded-full [^']+)'/.exec(hero)?.[1];
    if (heroDot === undefined) throw new Error('no dot in Hero.tsx');
    expect(tokens(constant('DOT'))).toEqual(
      tokens(heroDot).filter((name) => !name.startsWith('shadow-')),
    );
    // The pill and the dot: 28px current, 8px idle, darker under the mouse.
    expect(hero).toMatch(/'w-7 bg-[^']+'/);
    expect(hero).toMatch(/'w-2 bg-[^ ']+ group-hover\/bead:bg-[^']+'/);
    expect(tokens(constant('DOT_CURRENT'))[0]).toBe('w-7');
    expect(tokens(constant('DOT_IDLE'))[0]).toBe('w-2');
    expect(constant('DOT_IDLE')).toMatch(/ group-hover\/bead:bg-/);
  });

  it('follows the ring: the next card’s bead becomes the current one', () => {
    const { next, beads } = mount();
    fireEvent.click(next());
    expect(currentBeads(beads())).toEqual(['2 din 7']);
    fireEvent.click(next());
    expect(currentBeads(beads())).toEqual(['3 din 7']);
  });

  it('follows the bounded list out and back', () => {
    vi.useFakeTimers();
    const { beads } = mount({ mode: 'bounded', count: 3 });
    const walked = [currentBeads(beads())];
    for (let beat = 0; beat < 4; beat++) {
      act(() => vi.advanceTimersByTime(beat === 0 ? FIRST_DWELL : INTERVAL));
      walked.push(currentBeads(beads()));
    }
    expect(walked).toEqual([
      ['1 din 3'],
      ['2 din 3'],
      ['3 din 3'],
      ['2 din 3'],
      ['1 din 3'],
    ]);
  });

  it('draws no beads under two cards', () => {
    const { region } = mount({ count: 1 });
    expect(
      region().querySelector(`[aria-label="${LABELS.picker}"]`),
    ).toBeNull();
  });
});

describe('CardCarousel — the card cap', () => {
  it.each([
    ['by default', undefined, '[--cap:calc(var(--spacing)*80)]'],
    ['capped', 'capped', '[--cap:calc(var(--spacing)*80)]'],
  ] as const)(
    'spells the cap ONCE on the root — %s',
    (_what, cardCap, expected) => {
      for (const visible of [3, 5] as const) {
        const { region, unmount } = mount({ visible, cardCap });
        const caps = region()
          .className.split(/\s+/)
          .filter((name) => name.startsWith('[--cap:'));
        expect(caps).toEqual([expected]);
        // Every length reads the cap through `--c3`, and five's through
        // `--c5` too: nothing else knows the option exists.
        expect(region().className).toContain(
          '[--c3:min(var(--cap),calc(100cqw/var(--r3)))]',
        );
        unmount();
      }
    },
  );

  it('has ONE cap since its second value left with its last consumer (2026-10-20): no lifted cap in the code — and any other value, the lifted one smuggled past the types among them, is a RangeError at run time, never quietly the 20rem card', () => {
    // The lifted cap's declaration, built from two halves so this file never
    // spells it whole (Tailwind reads every scanned file for class names).
    const lifted = ['--cap', '100cqw'].join(':');
    expect(source).not.toContain(lifted);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const cardCap of ['none', 'Capped', '']) {
      const smuggled = { cardCap } as object;
      expect(
        () =>
          render(
            <CardCarousel
              slides={cardsFor(3)}
              slideLabels={labelsFor(3)}
              labels={LABELS}
              mode="loop"
              visible={5}
              env={quietEnv()}
              {...smuggled}
            />,
          ),
        JSON.stringify(cardCap),
      ).toThrow(/`cardCap`.*'capped'/);
    }
    // An explicit `undefined` is no value: the default cap.
    const absent = { cardCap: undefined } as object;
    render(
      <CardCarousel
        slides={cardsFor(3)}
        slideLabels={labelsFor(3)}
        labels={LABELS}
        mode="loop"
        visible={5}
        env={quietEnv()}
        {...absent}
      />,
    );
    expect(
      screen
        .getByRole('region', { name: LABELS.region })
        .className.split(/\s+/)
        .filter((name) => name.startsWith('[--cap:')),
    ).toEqual(['[--cap:calc(var(--spacing)*80)]']);
  });

  it('KEEPS its one value as a BACKSTOP: a consumer that spells the cap turns a fixed width leaked into its spread into the “both given” RangeError, where the width alone would draw a fixed card without a word', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const leaked = { cardWidth: 'calc(var(--spacing)*100)' } as object;
    expect(() =>
      render(
        <CardCarousel
          slides={cardsFor(3)}
          slideLabels={labelsFor(3)}
          labels={LABELS}
          mode="loop"
          visible={3}
          env={quietEnv()}
          {...leaked}
          cardCap="capped"
        />,
      ),
    ).toThrow(/cardWidth.*cardCap.*never both/);
  });
});

describe('CardCarousel — the fixed card', () => {
  const WIDTH = 'calc(var(--spacing)*56.45)';

  it.each([3, 5] as const)(
    'spells the width ONCE, on the root, as --card-fixed — the card the column at most, the stage the column, the room what the column leaves, the fade the outermost card’s 40 % short of the centre card, the arrows’ strip a bar short of it — and no cap, no share, no fallback (%i cards)',
    (visible) => {
      const { region } = mount({ visible, cardWidth: WIDTH });
      expect(region().style.getPropertyValue('--card-fixed')).toBe(WIDTH);
      const classes = region().className.split(/\s+/);
      expect(classes).toEqual(
        expect.arrayContaining([
          '[--bar:max(24px,min(calc(var(--spacing)*9),calc((100cqw_-_var(--card))/2)))]',
          '[--lift:calc(var(--card)*0.05)]',
          '[--card:min(var(--card-fixed),100cqw)]',
          '[--stage:100cqw]',
          `[--fade:min(calc(var(--card)*var(--f${visible})),max(0px,calc((100cqw_-_var(--card))/2_-_var(--inset))))]`,
          `[--inset:max(0px,calc((100cqw_-_var(--card)*var(--r${visible}))/2))]`,
        ]),
      );
      // ONE spelling of each length: no second bar, no second fade.
      for (const property of ['--bar', '--fade', '--inset', '--card']) {
        expect(
          classes.filter((name) => name.startsWith(`[${property}:`)),
        ).toHaveLength(1);
      }
      // Nothing of the column's share: no cap, no three-card share, no
      // five-card floor — the window asked for at every width.
      expect(
        classes.filter((name) => /^\[--(cap|c3|s3|c5|t5|min5):/.test(name)),
      ).toEqual([]);
      // The window's own numbers, from ./conveyor, on the root.
      expect(Number(region().style.getPropertyValue(`--r${visible}`))).toBe(
        ARRANGEMENTS[visible].ratio,
      );
      expect(Number(region().style.getPropertyValue(`--f${visible}`))).toBe(
        ARRANGEMENTS[visible].fade,
      );
    },
  );

  it('leaves the share’s geometry as it was without the option — the cap and the share on the root, no --card-fixed', () => {
    for (const visible of [3, 5] as const) {
      const { region, unmount } = mount({ visible });
      expect(region().style.getPropertyValue('--card-fixed')).toBe('');
      expect(region().className).toContain('[--cap:calc(var(--spacing)*80)]');
      expect(region().className).not.toContain('[--stage:100cqw]');
      unmount();
    }
  });

  it('refuses a card both capped and fixed — at the type, and with a RangeError for a JavaScript caller; an empty width; and a width outside the theme’s step, which THE BAND SCALE would never redraw', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const common = {
      slides: cardsFor(3),
      slideLabels: labelsFor(3),
      labels: LABELS,
      visible: 5,
      mode: 'loop',
      env: quietEnv(),
    } as const;
    expect(() =>
      render(
        // @ts-expect-error — a cap OR a fixed width (CardCarouselCardSize)
        <CardCarousel {...common} cardCap="capped" cardWidth={WIDTH} />,
      ),
    ).toThrow(/cardWidth.*cardCap.*never both/);
    // An empty width meets its OWN message: a blank string fails the
    // theme-step check too, which would otherwise answer for it.
    expect(() => render(<CardCarousel {...common} cardWidth="  " />)).toThrow(
      /`cardWidth` is empty/,
    );
    // A width that is no string at all — a JavaScript caller's number — meets
    // the same RangeError family, never a TypeError from deep inside.
    for (const width of [226, null, { width: 226 }]) {
      const smuggled = { cardWidth: width } as object;
      expect(
        () => render(<CardCarousel {...common} {...smuggled} />),
        String(width),
      ).toThrow(/`cardWidth` is .*, not a CSS length/);
    }
    // A px length, and a rem one: either would keep the card's size inside a
    // scaled band while everything round it scales.
    for (const width of ['226px', '14rem']) {
      expect(
        () => render(<CardCarousel {...common} cardWidth={width} />),
        width,
      ).toThrow(/not in the theme’s step/);
    }
    // A class's value pasted as it is — Tailwind's underscores standing for
    // its spaces — is no CSS length at all: the inline property would be
    // dropped, and the card with it, without a word.
    for (const width of [
      'calc(var(--spacing)_*_56)',
      'calc(var(--spacing)*56_+_1px)',
    ]) {
      expect(
        () => render(<CardCarousel {...common} cardWidth={width} />),
        width,
      ).toThrow(/underscore/);
    }
  });

  it('puts no card width on the <section> as an attribute', () => {
    const { region } = mount({ visible: 5, cardWidth: WIDTH });
    expect(region()).not.toHaveAttribute('cardwidth');
    expect(region()).not.toHaveAttribute('cardWidth');
  });
});

describe('CardCarousel — the cards’ height', () => {
  it.each([
    ['by default — each its own, centred on the line', undefined, false],
    ['own', 'own', false],
    ['tallest — every box the row, the tallest card’s height', 'tallest', true],
  ] as const)('%s', (_what, cardHeight, stretched) => {
    for (const visible of [3, 5] as const) {
      const { slides, unmount } = mount({ visible, cardHeight });
      expect(slides()).toHaveLength(7);
      for (const slide of slides()) {
        expect(slide.className.split(/\s+/).includes('self-stretch')).toBe(
          stretched,
        );
      }
      unmount();
    }
  });

  it('puts no card height on the <section> as an attribute', () => {
    const { region } = mount({ visible: 5, cardHeight: 'tallest' });
    expect(region()).not.toHaveAttribute('cardheight');
    expect(region()).not.toHaveAttribute('cardHeight');
  });
});

describe('CardCarousel — the two-card floor, and the empty list', () => {
  it('is no carousel at one card: no controls, no beads, no roledescription, no group, no live region, no clock', () => {
    vi.useFakeTimers();
    for (const mode of ['loop', 'bounded'] as const) {
      const { region, unmount } = mount({ count: 1, mode });
      expect(region()).toHaveAccessibleName(LABELS.region);
      expect(region()).not.toHaveAttribute('aria-roledescription');
      expect(region().querySelectorAll('button')).toHaveLength(0);
      expect(region().querySelectorAll('[role="group"]')).toHaveLength(0);
      expect(region().querySelectorAll('[aria-live]')).toHaveLength(0);
      expect(region()).toHaveTextContent(TITLES[0]);
      expect(vi.getTimerCount()).toBe(0);
      unmount();
    }
  });

  it('renders nothing for no cards', () => {
    const { container } = render(
      <div data-testid="frame">
        <CardCarousel
          slides={[]}
          slideLabels={[]}
          labels={LABELS}
          mode="loop"
          visible={3}
          env={quietEnv()}
        />
      </div>,
    );
    expect(container.querySelector('section')).toBeNull();
  });

  it('refuses a window that is neither three nor five — a JavaScript caller is held by no type, and a window of four would draw no geometry at all', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const visible of [4, 0, '5', undefined, Number.NaN]) {
      const smuggled = { visible } as object;
      expect(
        () =>
          render(
            <CardCarousel
              slides={cardsFor(3)}
              slideLabels={labelsFor(3)}
              labels={LABELS}
              mode="loop"
              env={quietEnv()}
              visible={3}
              {...smuggled}
            />,
          ),
        String(visible),
      ).toThrow(/`visible`.*is no window/);
    }
  });

  it('refuses labels that do not match the cards, naming both counts', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <CardCarousel
          slides={cardsFor(3)}
          slideLabels={labelsFor(2)}
          labels={LABELS}
          mode="bounded"
          visible={3}
        />,
      ),
    ).toThrow(/3 cards but 2 labels/);
  });
});

describe('CardCarousel — native props', () => {
  it('spreads native props onto the <section>, merges className after its own, and forwards ref', () => {
    let element: HTMLElement | null = null;
    render(
      <CardCarousel
        slides={cardsFor(3)}
        slideLabels={labelsFor(3)}
        labels={LABELS}
        mode="bounded"
        visible={3}
        env={quietEnv()}
        id="galerie"
        data-testid="carusel"
        className="mt-4"
        ref={(node) => {
          element = node;
        }}
      />,
    );
    const region = screen.getByTestId('carusel');
    expect(region.id).toBe('galerie');
    const classes = region.className.split(/\s+/);
    expect(classes.slice(0, 4)).toEqual([
      'relative',
      'isolate',
      '@container',
      'grid',
    ]);
    expect(classes.at(-1)).toBe('mt-4');
    expect(element).toBe(region);
  });

  it('keeps a caller’s style, under the geometry’s own custom properties', () => {
    const smuggled = { '--k': '9', color: 'red' } as CSSProperties;
    render(
      <CardCarousel
        slides={cardsFor(3)}
        slideLabels={labelsFor(3)}
        labels={LABELS}
        mode="loop"
        visible={5}
        env={quietEnv()}
        style={smuggled}
      />,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    expect(region.style.color).toBe('red');
    expect(Number(region.style.getPropertyValue('--k'))).toBe(PERSPECTIVE);
  });

  it('keeps its own name, roles, live-region setting and content whatever is spread (a spread object escapes TypeScript’s check, a hyphenated attribute too)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const smuggled = {
      'aria-label': 'Altceva',
      'aria-labelledby': 'alt-nume',
      'aria-roledescription': 'altceva',
      'aria-live': 'assertive',
      role: 'button',
      dangerouslySetInnerHTML: { __html: '<p>Alt conținut</p>' },
    } as object;
    render(
      <>
        <p id="alt-nume">Alt nume</p>
        <CardCarousel
          slides={cardsFor(3)}
          slideLabels={labelsFor(3)}
          labels={LABELS}
          mode="bounded"
          visible={3}
          env={quietEnv()}
          {...smuggled}
        />
      </>,
    );
    // Named by its label alone — an aria-labelledby would outrank it — and a
    // region still: no role of the caller's.
    const region = screen.getByRole('region', { name: LABELS.region });
    expect(region).not.toHaveAttribute('aria-labelledby');
    expect(region).not.toHaveAttribute('role');
    expect(region).toHaveAttribute('aria-roledescription', LABELS.role);
    // The cards' container is the one live region; the region itself is none.
    expect(region).not.toHaveAttribute('aria-live');
    expect(region.querySelectorAll('[aria-live]')).toHaveLength(1);
    // Its own cards, never a caller's HTML in their place.
    expect(
      region.querySelectorAll('[aria-live] > [role="group"]'),
    ).toHaveLength(3);
    expect(region).not.toHaveTextContent('Alt conținut');
  });

  it('drops a spread attribute the island owns in ANY CASE — HTML reads `Style`, `ROLE` or `ARIA-LABEL` as its own `style`, `role`, `aria-label` — in the browser AND in the server’s HTML, where a duplicate attribute keeps its FIRST value', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const smuggled = {
      Style: '--cap: 100cqw',
      Role: 'button',
      'ARIA-LABEL': 'Altceva',
      'Aria-Labelledby': 'alt-nume',
      'ARIA-ROLEDESCRIPTION': 'altceva',
      'Aria-Live': 'assertive',
      CLASS: 'altceva',
      ClassName: 'altceva',
      DangerouslySetInnerHTML: { __html: '<p>Alt conținut</p>' },
    } as object;
    const element = (
      <CardCarousel
        slides={cardsFor(3)}
        slideLabels={labelsFor(3)}
        labels={LABELS}
        mode="loop"
        visible={3}
        env={quietEnv()}
        id="galerie"
        {...smuggled}
      />
    );
    // The server's HTML as a browser parses it.
    const parsed = document.createElement('div');
    parsed.innerHTML = renderToString(element);
    const { container } = render(element);
    for (const [where, host] of [
      ['the server’s HTML', parsed],
      ['the browser', container],
    ] as const) {
      const section = host.querySelector('section');
      if (section === null) throw new Error(`no <section> in ${where}`);
      // Its own geometry, never the lifted cap — and never a style the
      // browser kept in its place.
      const style = section.getAttribute('style') ?? '';
      expect(style, where).toContain('--k:');
      expect(style, where).not.toContain('--cap');
      expect(section, where).not.toHaveAttribute('role');
      expect(section, where).toHaveAttribute('aria-label', LABELS.region);
      expect(section, where).not.toHaveAttribute('aria-labelledby');
      expect(section, where).toHaveAttribute(
        'aria-roledescription',
        LABELS.role,
      );
      expect(section, where).not.toHaveAttribute('aria-live');
      expect(section, where).not.toHaveAttribute('classname');
      expect(section.className.split(/\s+/), where).toContain('relative');
      expect(section.className.split(/\s+/), where).not.toContain('altceva');
      expect(section, where).not.toHaveAttribute('dangerouslysetinnerhtml');
      // What the island does not own still reaches it.
      expect(section, where).toHaveAttribute('id', 'galerie');
    }
  });

  it('refuses a caller’s focus CAPTURE handlers — the keyboard’s hold is the island’s: a stopPropagation in `onFocusCapture` would end the hold before it began, in `onBlurCapture` keep it for good', async () => {
    const smuggled = {
      onFocusCapture: (event: ReactFocusEvent) => event.stopPropagation(),
      onBlurCapture: (event: ReactFocusEvent) => event.stopPropagation(),
    } as object;
    render(
      <div style={{ width: FRAME }}>
        <button type="button">Înainte</button>
        <CardCarousel
          slides={cardsFor(3)}
          slideLabels={labelsFor(3)}
          labels={LABELS}
          mode="loop"
          visible={3}
          env={quietEnv()}
          intervalMs={INTERVAL}
          startDelayMs={FIRST_DWELL}
          {...smuggled}
        />
        <button type="button">După</button>
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]') as HTMLElement;
    await realUser.click(screen.getByRole('button', { name: 'Înainte' }));
    await realUser.tab();
    expect(region.contains(document.activeElement)).toBe(true);
    expect(stage).toHaveAttribute('aria-live', 'polite');
    for (let i = 0; i < 10 && region.contains(document.activeElement); i++) {
      await realUser.tab();
    }
    expect(region.contains(document.activeElement)).toBe(false);
    expect(stage).toHaveAttribute('aria-live', 'off');
  });

  it('refuses a caller’s CLICK and DRAG capture handlers — the stop and the drag are the island’s', () => {
    // A stopPropagation in `onClickCapture` would leave every arrow, bead and
    // tap a dead press while the ring went on (MEASURED by the round-3
    // review), in `onPointerMoveCapture` would keep the cards from a drag, and
    // in `onLostPointerCaptureCapture` would keep a cancelled drag on the hand.
    vi.useFakeTimers();
    // Refused by the type, which Omits all three…
    expectTypeOf<CardCarouselProps>().not.toHaveProperty('onClickCapture');
    expectTypeOf<CardCarouselProps>().not.toHaveProperty(
      'onPointerMoveCapture',
    );
    expectTypeOf<CardCarouselProps>().not.toHaveProperty(
      'onLostPointerCaptureCapture',
    );
    // …and at run time, where an object spread escapes the type.
    const smuggled = {
      onClickCapture: (event: ReactMouseEvent) => event.stopPropagation(),
      onPointerMoveCapture: (event: ReactPointerEvent) =>
        event.stopPropagation(),
      onLostPointerCaptureCapture: (event: ReactPointerEvent) =>
        event.stopPropagation(),
    } as object;
    render(
      <div style={{ width: FRAME }}>
        <CardCarousel
          slides={cardsFor(7)}
          slideLabels={labelsFor(7)}
          labels={LABELS}
          mode="loop"
          visible={3}
          env={quietEnv()}
          intervalMs={INTERVAL}
          startDelayMs={FIRST_DWELL}
          {...smuggled}
        />
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]') as HTMLElement;
    const second = (): HTMLElement =>
      stage.querySelectorAll<HTMLElement>(':scope > [role="group"]')[1];
    // THE STOP: a click on next steps the ring and stops it for good.
    fireEvent.click(screen.getByRole('button', { name: LABELS.next }), {
      detail: 1,
    });
    expect(second()).not.toHaveAttribute('inert');
    expect(stage).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(10 * INTERVAL));
    expect(second()).not.toHaveAttribute('inert');
    // THE DRAG: the centre card follows a hand 0.3 of a step across.
    const hand = press(stage);
    hand.move(-0.3 * PITCH);
    expect(shiftOf(second())).toBeCloseTo(poseAt(-0.3).tx, 5);
    // THE CANCEL: the hand's box loses its own capture — the cards spring back.
    fireEvent.lostPointerCapture(stage.parentElement as HTMLElement, {
      pointerId: 1,
      pointerType: 'mouse',
    });
    expect(shiftOf(second())).toBe(0);
  });

  it('puts no mode, no card cap and no clock option on the <section> as an attribute', () => {
    for (const mode of ['loop', 'bounded'] as const) {
      const { region, unmount } = mount({ mode, cardCap: 'capped' });
      for (const name of [
        'mode',
        'cardcap',
        'intervalms',
        'startdelayms',
        'env',
        'visible',
      ]) {
        expect(region()).not.toHaveAttribute(name);
      }
      unmount();
    }
  });
});

describe('CardCarousel — the server HTML, and hydration', () => {
  it('opens the live region POLITE and inerts the side cards in the static export — in both modes — the first bead current', () => {
    for (const mode of ['loop', 'bounded'] as const) {
      const html = renderToStaticMarkup(carouselFor({ mode }));
      expect(html).toContain('aria-live="polite"');
      // Two arrows and seven beads.
      expect(html.match(/<button/g)).toHaveLength(9);
      expect(html.match(/aria-current="true"/g)).toHaveLength(1);
      expect(html).toMatch(/aria-label="1 din 7" aria-current="true"/);
      expect(html.match(/inert=""/g)).toHaveLength(6);
      expect(html).toContain('--tx:0;');
    }
  });

  it.each(['loop', 'bounded'] as const)(
    'hydrates the %s’s server HTML with no warning, then starts its clock',
    async (mode) => {
      const element = carouselFor({ mode });
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      const errors: string[] = [];
      const spy = vi
        .spyOn(console, 'error')
        .mockImplementation((...args: unknown[]) => {
          errors.push(args.map(String).join(' '));
        });
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        const serverStage = container.querySelector('[aria-live]');
        expect(serverStage).toHaveAttribute('aria-live', 'polite');
        await act(async () => {
          root = hydrateRoot(container, element);
        });
        expect(errors).toEqual([]);
        expect(container.contains(serverStage)).toBe(true);
        expect(serverStage).toHaveAttribute('aria-live', 'off');
      } finally {
        spy.mockRestore();
        act(() => root?.unmount());
        container.remove();
      }
    },
  );

  it('server-renders the bounded list’s first stop: previous disabled, next live', () => {
    const html = renderToStaticMarkup(carouselFor({ mode: 'bounded' }));
    expect(html).toContain('aria-live="polite"');
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*aria-label="Cardul anterior"|<button[^>]*aria-label="Cardul anterior"[^>]*disabled=""/,
    );
    expect(html).not.toMatch(/aria-label="Cardul următor"[^>]*disabled=""/);
  });
});

describe('CardCarousel — the loop’s rhythm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('runs the island’s own numbers by default: a first move after 1.5 s, then one every 5.5 s', () => {
    expect(CARD_CAROUSEL_FIRST_DWELL_MS).toBe(1_500);
    expect(CARD_CAROUSEL_INTERVAL_MS).toBe(5_500);
    const { centre } = mount({ defaults: true });
    act(() => vi.advanceTimersByTime(1_499));
    expect(centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(centre()).toHaveAccessibleName('2 din 7');
    act(() => vi.advanceTimersByTime(5_499));
    expect(centre()).toHaveAccessibleName('2 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(centre()).toHaveAccessibleName('3 din 7');
  });

  it('goes round the ring: after the last card the first comes in from the right', () => {
    const { centre, slides } = mount({ count: 3 });
    // Two moves: the first after the dwell, the second an interval later.
    act(() => vi.advanceTimersByTime(FIRST_DWELL + INTERVAL));
    expect(centre()).toHaveAccessibleName('3 din 3');
    // The first card waits at the right neighbour's place…
    expect(shiftOf(slides()[0])).toBe(poseAt(1).tx);
    act(() => vi.advanceTimersByTime(INTERVAL));
    expect(centre()).toHaveAccessibleName('1 din 3');
  });

  it('wraps by the arrows too: previous from the first card is the last, next comes back', () => {
    const { previous, next, centre } = mount();
    fireEvent.click(previous());
    expect(centre()).toHaveAccessibleName('7 din 7');
    fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('1 din 7');
  });

  it('never starts under reduced motion — and the arrows and the beads still work, with nothing to stop', () => {
    const { next, bead, centre, stage } = mount({ reduced: true });
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(10 * INTERVAL));
    expect(centre()).toHaveAccessibleName('1 din 7');
    fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('2 din 7');
    fireEvent.click(bead('5 din 7'));
    expect(centre()).toHaveAccessibleName('5 din 7');
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no timer behind when it unmounts', () => {
    const { unmount } = mount();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CardCarousel — OPTION 1: any press stops the automatic movement for good', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it.each(['loop', 'bounded'] as const)(
    'a press on next steps the %s and stops it for good — however long the page stays open',
    (mode) => {
      const carousel = mount({ mode });
      act(() => vi.advanceTimersByTime(FIRST_DWELL - 1_000));
      expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
      fireEvent.click(carousel.next());
      expect(vi.getTimerCount()).toBe(0);
      expectStoppedAt(carousel, '2 din 7');
    },
  );

  it.each(['loop', 'bounded'] as const)(
    'a press on previous steps the %s back and stops it for good',
    (mode) => {
      const carousel = mount({ mode });
      // Out to the third card by itself, then a step back by hand.
      act(() => vi.advanceTimersByTime(FIRST_DWELL + INTERVAL));
      expect(carousel.centre()).toHaveAccessibleName('3 din 7');
      fireEvent.click(carousel.previous());
      expectStoppedAt(carousel, '2 din 7');
    },
  );

  it.each(['loop', 'bounded'] as const)(
    'a press on a BEAD lands the %s on its card and stops it for good',
    (mode) => {
      const carousel = mount({ mode });
      act(() => vi.advanceTimersByTime(FIRST_DWELL));
      expect(carousel.centre()).toHaveAccessibleName('2 din 7');
      fireEvent.click(carousel.bead('6 din 7'));
      expect(vi.getTimerCount()).toBe(0);
      expect(currentBeads(carousel.beads())).toEqual(['6 din 7']);
      expectStoppedAt(carousel, '6 din 7');
      // …and back by a bead, still stopped.
      fireEvent.click(carousel.bead('3 din 7'));
      expectStoppedAt(carousel, '3 din 7');
    },
  );

  it.each(['loop', 'bounded'] as const)(
    'a press on the CURRENT card’s bead moves nothing and stops the %s all the same',
    (mode) => {
      const carousel = mount({ mode });
      fireEvent.click(carousel.bead('1 din 7'));
      expect(vi.getTimerCount()).toBe(0);
      expectStoppedAt(carousel, '1 din 7');
    },
  );

  it.each(['loop', 'bounded'] as const)(
    'a drag lands the %s and stops it for good — the release lets go of the drag’s hold, and the pause outlives it',
    (mode) => {
      const carousel = mount({ mode });
      const hand = press(carousel.stage());
      hand.move(-20);
      expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
      act(() => vi.advanceTimersByTime(10 * INTERVAL));
      expect(carousel.centre()).toHaveAccessibleName('1 din 7');
      hand.up(-0.6 * PITCH);
      expectStoppedAt(carousel, '2 din 7');
    },
  );

  it('a drag the browser takes back (pointercancel) springs back — and stops it all the same', () => {
    const slow = mount();
    const hand = press(slow.stage());
    hand.move(-0.8 * PITCH);
    hand.cancel();
    expect(slow.slides().map(shiftOf)[0]).toBe(0);
    expectStoppedAt(slow, '1 din 7');
  });

  it.each(['loop', 'bounded'] as const)(
    'a TAP on the %s’s stage — a press that did not become a drag — stops it for good',
    (mode) => {
      const carousel = mount({ mode });
      fireEvent.click(carousel.stage(), { detail: 1 });
      expect(vi.getTimerCount()).toBe(0);
      expectStoppedAt(carousel, '1 din 7');
    },
  );

  it('a tap on a card’s link stops it for good AND is still the link’s: nothing prevents the click', () => {
    const carousel = mount();
    const link = carousel.region().querySelector('a') as HTMLAnchorElement;
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    // A press and a release in place: no drag — then the click it makes.
    const hand = press(carousel.stage());
    hand.up(0);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
    expectStoppedAt(carousel, '1 din 7');
  });

  it('a cursor passing over the stage holds nothing; a PRESS HOLDS — no step lands under it — and stops nothing: taken by the browser, it lets the ring go on a full interval later', () => {
    const carousel = mount();
    const stage = carousel.stage();
    const box = stage.getBoundingClientRect();
    // A mouse moving over the cards, no button down: nothing.
    fireEvent.pointerMove(stage, {
      pointerId: 3,
      pointerType: 'mouse',
      buttons: 0,
      clientX: box.left + 10,
      clientY: box.top + 10,
    });
    expect(stage).toHaveAttribute('aria-live', 'off');
    // A press held in place — not a drag, not yet a tap: HELD, however long,
    // so the card under it never turns inert before its click.
    const hand = press(stage);
    expect(stage).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(FIRST_DWELL + 10 * INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    // The browser takes the gesture (a page scroll began): the hold let go,
    // nothing stopped — the next move a full interval later.
    hand.cancel();
    expect(stage).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(INTERVAL - 1));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(carousel.centre()).toHaveAccessibleName('2 din 7');
  });

  it('a press let go OFF the carousel — before it was a drag nothing has captured it, so the hand’s box never hears the release — still ends: the window hears it, and the ring goes on a full interval later', () => {
    const carousel = mount({ neighbours: true });
    const stage = carousel.stage();
    press(stage);
    expect(stage).toHaveAttribute('aria-live', 'polite');
    // Let go over the button AFTER the carousel.
    fireEvent.pointerUp(screen.getByRole('button', { name: 'După' }), {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 0,
    });
    expect(stage).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(INTERVAL - 1));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(carousel.centre()).toHaveAccessibleName('2 din 7');
  });

  it('ends a press whatever stops the release’s propagation on the way — the window hears it in its capture phase', () => {
    const carousel = mount({ neighbours: true });
    const stage = carousel.stage();
    const after = screen.getByRole('button', { name: 'După' });
    // A neighbour that keeps its pointerups to itself.
    after.addEventListener('pointerup', (event) => event.stopPropagation());
    press(stage);
    fireEvent.pointerUp(after, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 0,
    });
    expect(stage).toHaveAttribute('aria-live', 'off');
  });

  it('a press on an ARROW holds the loop from its pointerdown: a move that comes due while the button is down waits, so ONE press moves ONE card — then stops it for good', () => {
    const carousel = mount();
    // A millisecond before the first move…
    act(() => vi.advanceTimersByTime(FIRST_DWELL - 1));
    const next = carousel.next();
    fireEvent.pointerDown(next, MOUSE_DOWN);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    // …it comes due while the button is down, and waits.
    act(() => vi.advanceTimersByTime(INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    fireEvent.pointerUp(next, MOUSE_UP);
    fireEvent.click(next, { detail: 1 });
    expectStoppedAt(carousel, '2 din 7');
  });

  it.each([
    ['a mouse’s press, release and click', true],
    ['a click with no press (an assistive technology’s)', false],
  ] as const)(
    'ANNOUNCES a click’s move: the stop turns the region polite in a commit of its own, BEFORE a card changes — %s',
    (_what, pressed) => {
      const carousel = mount();
      const next = carousel.next();
      if (pressed) {
        // The press's hold ends at its release, before the click: the ring
        // runs again — the live region off — when the click arrives.
        fireEvent.pointerDown(next, MOUSE_DOWN);
        fireEvent.pointerUp(next, MOUSE_UP);
      }
      expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
      // Every change of the stage's aria-live and of a card's inert, in the
      // order the engine applied them — an engine that judges politeness at
      // the moment of a mutation hears a change made while the region was
      // still off as nothing.
      const watch = new MutationObserver(() => {});
      watch.observe(carousel.stage(), {
        attributes: true,
        subtree: true,
        attributeFilter: ['aria-live', 'inert'],
      });
      fireEvent.click(next, { detail: pressed ? 1 : 0 });
      const changed = watch.takeRecords().map((record) => record.attributeName);
      watch.disconnect();
      expect(changed).toContain('aria-live');
      expect(changed).toContain('inert');
      expect(
        changed.indexOf('aria-live'),
        `the order the engine saw: ${changed.join(' → ')}`,
      ).toBeLessThan(changed.indexOf('inert'));
      expectStoppedAt(carousel, '2 din 7');
    },
  );

  it('a press on the bounded list’s NEXT at its last card but one holds the walk: the move that would land on the last card — and DISABLE the pressed button, its click never fired — waits; the click lands it there and stops it for good', () => {
    const carousel = mount({ mode: 'bounded' });
    act(() => vi.advanceTimersByTime(FIRST_DWELL + 4 * INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('6 din 7');
    const next = carousel.next();
    fireEvent.pointerDown(next, MOUSE_DOWN);
    act(() => vi.advanceTimersByTime(INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('6 din 7');
    expect(next).toBeEnabled();
    fireEvent.pointerUp(next, MOUSE_UP);
    fireEvent.click(next, { detail: 1 });
    expectStoppedAt(carousel, '7 din 7');
    expect(next).toBeDisabled();
  });

  it('a press on a BEAD holds it too — and let go with no click, it lets go: nothing stopped, the ring on a full interval later', () => {
    const carousel = mount();
    fireEvent.pointerDown(carousel.bead('4 din 7'), MOUSE_DOWN);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(FIRST_DWELL + INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    // Let go over the page: no click on the bead.
    fireEvent.pointerUp(document.body, MOUSE_UP);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(INTERVAL - 1));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(carousel.centre()).toHaveAccessibleName('2 din 7');
  });

  it('drops a press that never gets its release when the WINDOW loses focus mid-press — an app switch with the button down: the hold let go, nothing stopped', () => {
    const carousel = mount();
    fireEvent.pointerDown(carousel.next(), MOUSE_DOWN);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    fireEvent.blur(window);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(INTERVAL - 1));
    expect(carousel.centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(carousel.centre()).toHaveAccessibleName('2 din 7');
  });

  it('drops a press whose CONTEXT MENU opened — a ctrl-click on macOS, its release taken by the menu: the hold let go, and the button moving on is no drag', () => {
    const carousel = mount();
    const hand = press(carousel.stage());
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    fireEvent.contextMenu(carousel.stage());
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    hand.move(-0.4 * PITCH);
    expect(shiftOf(carousel.slides()[0])).toBe(0);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
  });

  it('keeps a DRAG through the window’s blur — a drag has its own ends — and lands it where the hand lets go', () => {
    const carousel = mount();
    const hand = press(carousel.stage());
    hand.move(-0.4 * PITCH);
    fireEvent.blur(window);
    hand.move(-0.6 * PITCH);
    expect(shiftOf(carousel.slides()[0])).toBeCloseTo(poseAt(-0.6).tx, 5);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    hand.up(-0.6 * PITCH);
    expectStoppedAt(carousel, '2 din 7');
  });
});

describe('CardCarousel — the clock’s holds: off screen, a drag, a keyboard; never a pointer at rest', () => {
  it.each(['loop', 'bounded'] as const)(
    'holds the %s while the stage is off screen, and moves a full interval after it returns',
    (mode) => {
      vi.useFakeTimers();
      const { centre, stage } = mount({ mode });
      expect(FakeObserver.instances).toHaveLength(1);
      const [observer] = FakeObserver.instances;
      expect(observer.targets).toEqual([stage()]);

      observer.fire(false);
      expect(stage()).toHaveAttribute('aria-live', 'polite');
      act(() => vi.advanceTimersByTime(10 * INTERVAL));
      expect(centre()).toHaveAccessibleName('1 din 7');

      observer.fire(true);
      expect(stage()).toHaveAttribute('aria-live', 'off');
      act(() => vi.advanceTimersByTime(INTERVAL - 1));
      expect(centre()).toHaveAccessibleName('1 din 7');
      act(() => vi.advanceTimersByTime(1));
      expect(centre()).toHaveAccessibleName('2 din 7');
    },
  );

  it.each(['loop', 'bounded'] as const)(
    'HOLDS the %s while keyboard focus is inside (a real Tab), and lets go when it leaves — a hold, not a stop',
    async (mode) => {
      const { previous, next, beads, stage, before, region } = mount({
        mode,
        neighbours: true,
      });
      await realUser.click(before());
      await realUser.tab();
      // The bounded list's first stop disables previous: Tab lands on next.
      expect(document.activeElement).toBe(
        mode === 'loop' ? previous() : next(),
      );
      expect(stage()).toHaveAttribute('aria-live', 'polite');

      if (mode === 'loop') {
        await realUser.tab();
        expect(document.activeElement).toBe(next());
        expect(stage()).toHaveAttribute('aria-live', 'polite');
      }
      // On through the beads, each a Tab stop — still held, never stopped.
      await realUser.tab();
      expect(document.activeElement).toBe(beads()[0]);
      expect(stage()).toHaveAttribute('aria-live', 'polite');

      for (
        let i = 0;
        i < 14 && region().contains(document.activeElement);
        i++
      ) {
        await realUser.tab();
      }
      expect(region().contains(document.activeElement)).toBe(false);
      expect(stage()).toHaveAttribute('aria-live', 'off');
    },
  );

  it('keeps the keyboard’s hold when the WINDOW loses focus — another app, the find bar, a screen reader’s list of elements: the page’s focus stays put, and so does the ring — and lets go when focus really leaves', async () => {
    const { previous, stage, before, region } = mount({ neighbours: true });
    await realUser.click(before());
    await realUser.tab();
    expect(document.activeElement).toBe(previous());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    // What the browser sends the focused element when its WINDOW loses
    // focus: a focusout with no new target, the document's active element
    // unchanged.
    fireEvent.focusOut(previous(), { relatedTarget: null });
    expect(document.activeElement).toBe(previous());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    // A real departure, by Tab, still lets it go.
    for (let i = 0; i < 14 && region().contains(document.activeElement); i++) {
      await realUser.tab();
    }
    expect(region().contains(document.activeElement)).toBe(false);
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('a KEY pressing an arrow stops it for good: focus leaving afterwards lets nothing go on', async () => {
    const { next, stage, centre, before, region } = mount({
      neighbours: true,
    });
    await realUser.click(before());
    await realUser.tab();
    await realUser.tab();
    expect(document.activeElement).toBe(next());
    await realUser.keyboard('{Enter}');
    expect(centre()).toHaveAccessibleName('2 din 7');
    for (let i = 0; i < 14 && region().contains(document.activeElement); i++) {
      await realUser.tab();
    }
    expect(region().contains(document.activeElement)).toBe(false);
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('a KEY pressing a bead lands on its card and stops it for good', async () => {
    const { beads, stage, centre, before, region } = mount({
      neighbours: true,
    });
    await realUser.click(before());
    // previous, next, then the beads: the fourth bead is the sixth Tab.
    for (let i = 0; i < 6; i++) await realUser.tab();
    expect(document.activeElement).toBe(beads()[3]);
    await realUser.keyboard('{Enter}');
    expect(centre()).toHaveAccessibleName('4 din 7');
    for (let i = 0; i < 14 && region().contains(document.activeElement); i++) {
      await realUser.tab();
    }
    expect(region().contains(document.activeElement)).toBe(false);
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('holds for no pointer at rest — a resting cursor over the cards, an arrow or a bead is not a request', async () => {
    const user = testingUser.setup();
    const { stage, centre, next, beads } = mount();
    await user.hover(centre());
    expect(stage()).toHaveAttribute('aria-live', 'off');
    await user.hover(next());
    expect(stage()).toHaveAttribute('aria-live', 'off');
    await user.hover(beads()[2]);
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('a CLICK on an arrow is a press: it stops the ring for good, and the focus it leaves holds nothing more', async () => {
    const { stage, centre, next } = mount();
    await realUser.click(next());
    expect(document.activeElement).toBe(next());
    expect(centre()).toHaveAccessibleName('2 din 7');
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });
});

describe('CardCarousel — the hand', () => {
  it('waits 10px before deciding anything, then follows the hand card for card', () => {
    const { stage, slides } = mount();
    const hand = press(stage());
    hand.move(-6);
    expect(shiftOf(slides()[0])).toBe(0);
    hand.move(-0.3 * PITCH);
    // A third of a step towards the next card: every card a third of a step
    // to the left, the centre one exactly under the hand.
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.3).tx, 5);
    expect(shiftOf(slides()[1])).toBeCloseTo(poseAt(0.7).tx, 5);
    hand.cancel();
  });

  it('drags the five-card window on the same step: a drag of 0.3 of it carries every card 0.3 of the way', () => {
    const { stage, slides } = mount({ visible: 5 });
    const hand = press(stage());
    hand.move(-0.3 * PITCH);
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.3).tx, 5);
    expect(turnOf(slides()[0])).toBeCloseTo(poseAt(-0.3).ry, 5);
    expect(shiftOf(slides()[1])).toBeCloseTo(poseAt(0.7).tx, 5);
    hand.cancel();
    dragBy(stage(), -0.6 * PITCH);
    expect(slides()[1]).not.toHaveAttribute('inert');
  });

  it('keeps a press on an ARROW the arrow’s, carried over the cards: they never follow it — only a press on the hand’s box becomes a drag', () => {
    const { next, stage, slides } = mount();
    const at = slides().map(shiftOf);
    const box = stage().getBoundingClientRect();
    const y = box.top + box.height / 2;
    const x = box.left + box.width / 2;
    // The mouse's main button down on next…
    fireEvent.pointerDown(next(), { ...MOUSE_DOWN, clientX: x, clientY: y });
    // …and carried over the cards, six tenths of a step across, still down.
    fireEvent.pointerMove(stage(), {
      ...MOUSE_DOWN,
      clientX: x - 0.6 * PITCH,
      clientY: y,
    });
    expect(slides().map(shiftOf)).toEqual(at);
    fireEvent.pointerUp(stage(), { ...MOUSE_UP, clientX: x - 0.6 * PITCH });
    expect(slides().map(shiftOf)).toEqual(at);
  });

  it('captures the pointer only once the press has become a drag — never at the press', () => {
    const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
    const { stage } = mount();
    const hand = press(stage(), 4);
    expect(capture).not.toHaveBeenCalled();
    hand.move(-40);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(4);
    hand.cancel();
  });

  it('lands on the next card past half a step, and the one after past a step and a half', () => {
    const { stage, centre } = mount();
    dragBy(stage(), -0.6 * PITCH);
    expect(centre()).toHaveAccessibleName('2 din 7');
    dragBy(stage(), -1.6 * PITCH);
    expect(centre()).toHaveAccessibleName('4 din 7');
    dragBy(stage(), 0.6 * PITCH);
    expect(centre()).toHaveAccessibleName('3 din 7');
  });

  it('wraps a drag round the ring like the arrows do', () => {
    const { stage, centre } = mount();
    dragBy(stage(), 0.6 * PITCH);
    expect(centre()).toHaveAccessibleName('7 din 7');
  });

  it('moves one card for a quick flick, and snaps back a slow short slide', async () => {
    const { stage, centre, slides } = mount();
    dragBy(stage(), -0.2 * PITCH);
    expect(centre()).toHaveAccessibleName('2 din 7');

    const hand = press(stage());
    hand.move(-0.3 * PITCH);
    await wait(350);
    hand.up(-0.3 * PITCH);
    expect(centre()).toHaveAccessibleName('2 din 7');
    expect(shiftOf(slides()[1])).toBe(0);
  });

  it('leaves a pan within 35° of vertical to the page: nothing moves — the press holds the ring while it lasts, like any press, and lets it go when it ends', () => {
    const { stage, slides } = mount();
    const hand = press(stage());
    hand.move(-8, 40);
    hand.move(-30, 160);
    expect(shiftOf(slides()[0])).toBe(0);
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    hand.up(-30, 160);
    expect(shiftOf(slides()[0])).toBe(0);
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('keeps a drag alive when a CARD’S CHILD loses the pointer — a finger is captured at its press to the element it pressed, the drag’s own capture takes it from there, and that lostpointercapture BUBBLES to the hand’s box: no cancel', () => {
    const { stage, slides, centre, region } = mount();
    const link = region().querySelector('a') as HTMLAnchorElement;
    const box = stage().getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const touch = {
      pointerId: 11,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientY: y,
    };
    // The finger lands on the centre card's link: its press and its first
    // moves are the link's (the browser's implicit capture), bubbling.
    fireEvent.pointerDown(link, { ...touch, clientX: x });
    fireEvent.pointerMove(link, { ...touch, clientX: x - 0.3 * PITCH });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.3).tx, 5);
    // The drag took the pointer: the browser tells the LINK it lost it.
    fireEvent.lostPointerCapture(link, {
      pointerId: 11,
      pointerType: 'touch',
      bubbles: true,
    });
    // The drag goes on under the finger, now the hand's box's…
    fireEvent.pointerMove(stage(), { ...touch, clientX: x - 0.6 * PITCH });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.6).tx, 5);
    // …and lands where the finger lets go.
    fireEvent.pointerUp(stage(), {
      ...touch,
      buttons: 0,
      clientX: x - 0.6 * PITCH,
    });
    expect(centre()).toHaveAccessibleName('2 din 7');
  });

  it('springs back and stops for good when the hand’s box ITSELF loses the pointer it captured — the browser took it', () => {
    vi.useFakeTimers();
    const carousel = mount();
    const hand = press(carousel.stage());
    hand.move(-0.8 * PITCH);
    expect(shiftOf(carousel.slides()[0])).toBeCloseTo(poseAt(-0.8).tx, 5);
    const box = carousel.stage().parentElement as HTMLElement;
    fireEvent.lostPointerCapture(box, { pointerId: 1, pointerType: 'mouse' });
    expect(shiftOf(carousel.slides()[0])).toBe(0);
    expectStoppedAt(carousel, '1 din 7');
  });

  it('drops a press whose button is found UP — a release the page never heard: no drag from a buttonless hover, no hold left behind, and the next click on a card’s link reaches it', () => {
    const { stage, slides, region } = mount();
    const box = stage().getBoundingClientRect();
    // A press, and no release ever comes (let go outside the window, a
    // context menu opened).
    press(stage());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    // The mouse comes back over the cards with no button down, 40px across.
    fireEvent.pointerMove(stage(), {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 0,
      clientX: box.left + box.width / 2 - 40,
      clientY: box.top + box.height / 2,
    });
    expect(shiftOf(slides()[0])).toBe(0);
    expect(stage()).toHaveAttribute('aria-live', 'off');
    // The next click on the centre card's link is the link's.
    const link = region().querySelector('a') as HTMLAnchorElement;
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    const hand = press(stage());
    hand.up(0);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('drops a DRAG whose button is found up as a cancel: the cards spring back', () => {
    const { stage, slides, centre } = mount();
    const box = stage().getBoundingClientRect();
    const hand = press(stage());
    hand.move(-0.8 * PITCH);
    fireEvent.pointerMove(stage(), {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 0,
      clientX: box.left + box.width / 2 - 0.9 * PITCH,
      clientY: box.top + box.height / 2,
    });
    expect(shiftOf(slides()[0])).toBe(0);
    expect(centre()).toHaveAccessibleName('1 din 7');
  });

  it('keeps a drag against every other pointer: another primary press (a pen’s beside the mouse’s) neither takes it over nor moves it, and the drag lands where its own pointer lets go', () => {
    const { stage, slides, centre } = mount();
    const hand = press(stage());
    hand.move(-0.3 * PITCH);
    const pen = {
      pointerId: 9,
      pointerType: 'pen',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientY: 50,
    };
    // A pen touches down on the stage: a primary pointer of its own type…
    fireEvent.pointerDown(stage(), { ...pen, clientX: 50 });
    // …and moves far across it.
    fireEvent.pointerMove(stage(), { ...pen, clientX: 50 + 2 * PITCH });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.3).tx, 5);
    // The mouse's drag goes on…
    hand.move(-0.4 * PITCH);
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.4).tx, 5);
    // …and lands where the mouse lets go.
    hand.up(-0.6 * PITCH);
    expect(centre()).toHaveAccessibleName('2 din 7');
  });

  it('presses nothing with a SECOND finger: a non-primary pointer neither replaces the first finger’s press nor starts one', () => {
    const { stage, slides } = mount();
    const box = stage().getBoundingClientRect();
    const x = box.left + box.width / 2;
    const finger = (pointerId: number, isPrimary: boolean) => ({
      pointerId,
      pointerType: 'touch',
      isPrimary,
      button: 0,
      buttons: 1,
      clientY: box.top + box.height / 2,
    });
    fireEvent.pointerDown(stage(), { ...finger(21, true), clientX: x });
    fireEvent.pointerDown(stage(), { ...finger(22, false), clientX: x - 60 });
    // The FIRST finger moves across: the cards follow it.
    fireEvent.pointerMove(stage(), {
      ...finger(21, true),
      clientX: x - 0.3 * PITCH,
    });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.3).tx, 5);
    fireEvent.pointerCancel(stage(), { ...finger(21, true), clientX: x });
  });

  it('snaps back when the browser takes the gesture (pointercancel)', () => {
    const { stage, centre, slides } = mount();
    const hand = press(stage());
    hand.move(-0.8 * PITCH);
    hand.cancel();
    expect(centre()).toHaveAccessibleName('1 din 7');
    expect(shiftOf(slides()[0])).toBe(0);
  });

  it('springs a CANCEL back from wherever the hand was — 0.9 of a step across, where a release would land the next card — and stops it for good: a cancel moves nothing', () => {
    vi.useFakeTimers();
    const carousel = mount();
    const hand = press(carousel.stage());
    hand.move(-0.9 * PITCH);
    hand.cancel(-0.9 * PITCH);
    expect(shiftOf(carousel.slides()[0])).toBe(0);
    expectStoppedAt(carousel, '1 din 7');
  });

  it('ends nothing when a SECOND finger lifts mid-drag: a press ends at its own pointer’s release — the first finger’s drag goes on, held, and lands where it lets go', () => {
    const { stage, slides, centre } = mount();
    const box = stage().getBoundingClientRect();
    const x = box.left + box.width / 2;
    const finger = (pointerId: number, isPrimary: boolean) => ({
      pointerId,
      pointerType: 'touch',
      isPrimary,
      button: 0,
      buttons: 1,
      clientY: box.top + box.height / 2,
    });
    fireEvent.pointerDown(stage(), { ...finger(21, true), clientX: x });
    fireEvent.pointerMove(stage(), {
      ...finger(21, true),
      clientX: x - 0.3 * PITCH,
    });
    fireEvent.pointerDown(stage(), { ...finger(22, false), clientX: x + 40 });
    // The second finger lifts — the window hears its release.
    fireEvent.pointerUp(stage(), {
      ...finger(22, false),
      buttons: 0,
      clientX: x + 40,
    });
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    fireEvent.pointerMove(stage(), {
      ...finger(21, true),
      clientX: x - 0.6 * PITCH,
    });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.6).tx, 5);
    fireEvent.pointerUp(stage(), {
      ...finger(21, true),
      buttons: 0,
      clientX: x - 0.6 * PITCH,
    });
    expect(centre()).toHaveAccessibleName('2 din 7');
  });

  it('keeps a FINGER’s drag whose move reports no button down (`buttons` 0): a finger is in contact whenever it moves — the button-up rule reads a mouse and a pen alone', () => {
    const { stage, slides, centre } = mount();
    const box = stage().getBoundingClientRect();
    const x = box.left + box.width / 2;
    const touch = {
      pointerId: 31,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientY: box.top + box.height / 2,
    };
    fireEvent.pointerDown(stage(), { ...touch, clientX: x });
    fireEvent.pointerMove(stage(), { ...touch, clientX: x - 0.3 * PITCH });
    fireEvent.pointerMove(stage(), {
      ...touch,
      buttons: 0,
      clientX: x - 0.6 * PITCH,
    });
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.6).tx, 5);
    expect(stage()).toHaveAttribute('aria-live', 'polite');
    fireEvent.pointerUp(stage(), {
      ...touch,
      buttons: 0,
      clientX: x - 0.6 * PITCH,
    });
    expect(centre()).toHaveAccessibleName('2 din 7');
  });

  it('ignores a mouse’s other buttons and a pen’s barrel: no press, no hold, no drag', () => {
    const { stage, slides } = mount();
    for (const [pointerId, pointerType] of [
      [2, 'mouse'],
      [3, 'pen'],
    ] as const) {
      const init = { pointerId, pointerType, isPrimary: true, clientY: 100 };
      fireEvent.pointerDown(stage(), {
        ...init,
        button: 2,
        buttons: 2,
        clientX: 300,
      });
      expect(stage(), pointerType).toHaveAttribute('aria-live', 'off');
      fireEvent.pointerMove(stage(), { ...init, buttons: 2, clientX: 100 });
      expect(shiftOf(slides()[0]), pointerType).toBe(0);
      fireEvent.pointerUp(stage(), { ...init, button: 2, buttons: 0 });
    }
  });

  it('draws every card snapped under the hand — and gliding back on release', () => {
    const { stage, slides } = mount();
    const moving = (slide: HTMLElement) =>
      slide.className.split(/\s+/).includes('transition-transform');
    expect(slides().every(moving)).toBe(true);
    const hand = press(stage());
    hand.move(-0.4 * PITCH);
    expect(slides().some(moving)).toBe(false);
    hand.up(-0.4 * PITCH);
    // A flick (quick, 0.4 ≥ 0.1): one card on, and the cards glide there.
    expect(slides()[0].className.split(/\s+/)).toContain(
      'transition-transform',
    );
  });
});

describe('CardCarousel — the click a drag leaves behind', () => {
  /** The centre card's link, its clicks counted and never followed for real. */
  const linkOf = (region: HTMLElement) => {
    const link = region.querySelector('a') as HTMLAnchorElement;
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    return { link, followed };
  };

  it('swallows the pointer click that follows a drag, so a card’s link is not followed', async () => {
    const { stage, region } = mount();
    const followed = vi.fn();
    const link = region().querySelector('a') as HTMLAnchorElement;
    link.addEventListener('click', followed);
    dragBy(stage(), -0.2 * PITCH);
    // A browser runs the microtasks between the release's listeners and the
    // click it dispatches after them, in the same task: the swallow must
    // outlive them — disarmed on the NEXT task, never in a microtask.
    await Promise.resolve();
    const allowed = fireEvent.click(link, { detail: 1 });
    expect(allowed).toBe(false);
    expect(followed).not.toHaveBeenCalled();
  });

  it('swallows the click a PEN’s drag leaves behind, as a mouse’s', async () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    dragBy(stage(), -0.2 * PITCH, 'pen');
    await Promise.resolve();
    expect(fireEvent.click(link, { detail: 1 })).toBe(false);
    expect(followed).not.toHaveBeenCalled();
  });

  it('arms nothing for a FINGER’s drag — a finger’s drag leaves no click behind — so the next click, one with no press of its own (an assistive technology’s), reaches the link', () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    dragBy(stage(), -0.2 * PITCH, 'touch');
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('arms nothing for a CANCELLED drag — the browser took the gesture, and no click follows a cancel — so the next click reaches the link', () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    const hand = press(stage());
    hand.move(-0.6 * PITCH);
    hand.cancel(-0.6 * PITCH);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('disarms on the NEXT TASK after a mouse’s release — its click comes in the release’s own task — so a click that comes later with no press of its own reaches the link', async () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    dragBy(stage(), -0.2 * PITCH);
    await wait(0);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('gives a NEW PRESS its own click even before that task: a mouse’s drag, then — at once — a tap on the card’s link, which is followed', () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    dragBy(stage(), -0.2 * PITCH);
    const hand = press(stage());
    hand.up(0);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('a FINGER’s drag, then a TAP on the card’s link: the tap’s click is followed', () => {
    const { stage, region } = mount();
    const { link, followed } = linkOf(region());
    dragBy(stage(), -0.2 * PITCH, 'touch');
    const finger = press(stage(), 2, 'touch');
    finger.up(0);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('forgets an ARMED swallow when the list falls under two cards and grows back: the next click on the card’s link is the link’s', () => {
    const { stage, region, rerender } = mount();
    const frame = (count: number) => (
      <div style={{ width: FRAME }}>{carouselFor({ count })}</div>
    );
    dragBy(stage(), -0.2 * PITCH);
    // No task passes — the swallow is still armed — and the carousel goes…
    rerender(frame(1));
    // …and comes back.
    rerender(frame(7));
    const { link, followed } = linkOf(region());
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('forgets a WAITING press and a DRAG IN FLIGHT when the list falls under two cards and grows back: no move judged a drag, every card at rest', () => {
    const { stage, slides, rerender } = mount();
    const frame = (count: number) => (
      <div style={{ width: FRAME }}>{carouselFor({ count })}</div>
    );
    const rest = slides().map(shiftOf);
    // A press still waiting to be judged…
    const waiting = press(stage(), 1);
    rerender(frame(1));
    rerender(frame(7));
    // …whose pointer, back over the cards with its button down, drags nothing.
    waiting.move(-0.6 * PITCH);
    expect(slides().map(shiftOf)).toEqual(rest);
    // A drag in flight when the carousel goes leaves no card where it was.
    const dragging = press(stage(), 2);
    dragging.move(-0.4 * PITCH);
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(-0.4).tx, 5);
    rerender(frame(1));
    rerender(frame(7));
    expect(slides().map(shiftOf)).toEqual(rest);
  });

  it('lets a keyboard’s click through after a drag (detail 0)', () => {
    const { stage, region } = mount();
    const link = region().querySelector('a') as HTMLAnchorElement;
    dragBy(stage(), -0.05 * PITCH);
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    fireEvent.click(link, { detail: 0 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('lets a plain click through when no drag happened', () => {
    const { stage, region } = mount();
    const link = region().querySelector('a') as HTMLAnchorElement;
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    const hand = press(stage());
    hand.move(-4);
    hand.up(-4);
    fireEvent.click(link, { detail: 1 });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('makes the hand’s box a CLICK RESPONDER that iOS recognises — an empty `onclick` of its own, React’s Mobile Safari trap — while it is a carousel, and takes it away with it', () => {
    const { stage, rerender, unmount } = mount();
    const frame = (count: number) => (
      <div style={{ width: FRAME }}>{carouselFor({ count })}</div>
    );
    const box = stage().parentElement as HTMLElement;
    expect(box.onclick).toBeTypeOf('function');
    // A responder, never a handler: a click through it is not prevented.
    const click = new PointerEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    box.onclick?.call(box, click);
    expect(click.defaultPrevented).toBe(false);
    // One card is no carousel: no responder…
    rerender(frame(1));
    expect(box.onclick).toBeNull();
    // …and back with the cards.
    rerender(frame(7));
    expect(box.onclick).toBeTypeOf('function');
    unmount();
    expect(box.onclick).toBeNull();
  });

  it('never lets a picture ghost-drag off its card', () => {
    const { stage } = mount();
    expect(fireEvent.dragStart(stage().firstElementChild as Element)).toBe(
      false,
    );
  });
});

describe('CardCarousel — the no-fly rule', () => {
  const lands = (slide: HTMLElement): boolean =>
    slide.className.split(/\s+/).includes('transition-none');

  it('lands a card crossing the ring at once; the rest glide', () => {
    const { next, slides } = mount({ count: 3 });
    expect(slides().map(lands)).toEqual([false, false, false]);
    fireEvent.click(next());
    // 0, 1, −1 → −1, 0, 1: the third card crossed from left to right.
    expect(slides().map(shiftOf)).toEqual([-1, 0, 1].map((x) => poseAt(x).tx));
    expect(slides().map(lands)).toEqual([false, false, true]);
  });

  it.each([3, 5] as const)(
    'lands the far card of a seven-card ring at once (−3 → +3) in the %i-card window',
    (visible) => {
      const { next, slides } = mount({ visible });
      fireEvent.click(next());
      expect(slides().map(lands)).toEqual([
        false,
        false,
        false,
        false,
        true,
        false,
        false,
      ]);
    },
  );

  it('lets a bead one card away glide like an arrow — and lands every card at once for a bead further off', () => {
    const { bead, slides } = mount();
    fireEvent.click(bead('2 din 7'));
    expect(slides().map(lands)).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
      false,
    ]);
    fireEvent.click(bead('5 din 7'));
    expect(slides().every(lands)).toBe(true);
  });

  it('never lands a bounded card at once on its own walk: out and back never wraps', () => {
    vi.useFakeTimers();
    const { slides } = mount({ mode: 'bounded', count: 3 });
    for (let beat = 0; beat < 6; beat++) {
      act(() => vi.advanceTimersByTime(beat === 0 ? FIRST_DWELL : INTERVAL));
      expect(slides().map(lands)).toEqual([false, false, false]);
    }
  });
});

describe('CardCarousel — the bounded list walks out and back by itself', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('runs the island’s own rhythm by default, like the loop', () => {
    const { centre } = mount({ mode: 'bounded', defaults: true });
    act(() => vi.advanceTimersByTime(1_499));
    expect(centre()).toHaveAccessibleName('1 din 7');
    act(() => vi.advanceTimersByTime(1));
    expect(centre()).toHaveAccessibleName('2 din 7');
    act(() => vi.advanceTimersByTime(5_500));
    expect(centre()).toHaveAccessibleName('3 din 7');
  });

  it('walks out to the last card, turns round, back to the first, and out again — never wrapping', () => {
    const { centre, previous, next, slides } = mount({
      mode: 'bounded',
      count: 4,
    });
    const walked = [centre().getAttribute('aria-label')];
    for (let beat = 0; beat < 8; beat++) {
      act(() => vi.advanceTimersByTime(beat === 0 ? FIRST_DWELL : INTERVAL));
      walked.push(centre().getAttribute('aria-label'));
      // Every card at its plain distance from the centred one.
      const at = Number(centre().getAttribute('aria-label')?.[0]) - 1;
      expect(slides().map(shiftOf)).toEqual(
        [0, 1, 2, 3].map((card) => poseAt(card - at).tx),
      );
      expect(previous()).toHaveProperty('disabled', at === 0);
      expect(next()).toHaveProperty('disabled', at === 3);
    }
    expect(walked).toEqual([
      '1 din 4',
      '2 din 4',
      '3 din 4',
      '4 din 4',
      '3 din 4',
      '2 din 4',
      '1 din 4',
      '2 din 4',
      '3 din 4',
    ]);
  });

  it('walks two cards back and forth: 1, 2, 1, 2', () => {
    const { centre } = mount({ mode: 'bounded', count: 2 });
    const walked = [];
    for (let beat = 0; beat < 4; beat++) {
      act(() => vi.advanceTimersByTime(beat === 0 ? FIRST_DWELL : INTERVAL));
      walked.push(centre().getAttribute('aria-label'));
    }
    expect(walked).toEqual(['2 din 2', '1 din 2', '2 din 2', '1 din 2']);
  });

  it('is off while it walks by itself and polite once held — and never starts under reduced motion', () => {
    const moving = mount({ mode: 'bounded' });
    expect(moving.stage()).toHaveAttribute('aria-live', 'off');
    moving.unmount();
    const still = mount({ mode: 'bounded', reduced: true });
    expect(still.stage()).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(10 * INTERVAL));
    expect(still.centre()).toHaveAccessibleName('1 din 7');
  });

  it('a drag on the walking list moves it — back while it walked out — and stops the walk for good', () => {
    const carousel = mount({ mode: 'bounded' });
    // Out to the fourth card by itself.
    act(() => vi.advanceTimersByTime(FIRST_DWELL + 2 * INTERVAL));
    expect(carousel.centre()).toHaveAccessibleName('4 din 7');
    // A drag back one card: there it stays.
    dragBy(carousel.stage(), 0.6 * PITCH);
    expectStoppedAt(carousel, '3 din 7');
  });

  it('steps by the arrows both ways, never past an end — the first press stops the walk', () => {
    const carousel = mount({ mode: 'bounded', count: 4 });
    const { previous, next, centre } = carousel;
    fireEvent.click(next());
    fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('3 din 4');
    fireEvent.click(previous());
    expectStoppedAt(carousel, '2 din 4');
    fireEvent.click(next());
    fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('4 din 4');
    expect(next()).toBeDisabled();
    expectStoppedAt(carousel, '4 din 4');
  });

  it('lands a bead through the track: on its card, the arrows stepping on from there and disabled at its ends', () => {
    const carousel = mount({ mode: 'bounded' });
    const { bead, previous, next, centre, slides } = carousel;
    fireEvent.click(bead('7 din 7'));
    expect(centre()).toHaveAccessibleName('7 din 7');
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
    for (const slide of slides()) expect(shiftOf(slide)).toBeLessThanOrEqual(0);
    fireEvent.click(previous());
    expect(centre()).toHaveAccessibleName('6 din 7');
    fireEvent.click(bead('1 din 7'));
    expect(previous()).toBeDisabled();
    fireEvent.click(next());
    expectStoppedAt(carousel, '2 din 7');
  });

  it('leaves no timer behind when it unmounts', () => {
    const { unmount } = mount({ mode: 'bounded' });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CardCarousel — the bounded list’s full stops', () => {
  it('starts at the first card with nothing to its left, previous disabled', () => {
    const { previous, next, slides } = mount({ mode: 'bounded' });
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
    expect(slides().map(shiftOf)).toEqual(
      [0, 1, 2, 3, 4, 5, 6].map((x) => poseAt(x).tx),
    );
  });

  it('stops at the last card: next disabled, no wrap, nothing to its right', () => {
    const { previous, next, centre, slides } = mount({ mode: 'bounded' });
    for (let step = 0; step < 6; step++) fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('7 din 7');
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
    fireEvent.click(next());
    expect(centre()).toHaveAccessibleName('7 din 7');
    for (const slide of slides()) expect(shiftOf(slide)).toBeLessThanOrEqual(0);
  });

  it('hands the focus to the other control when a press disables the one it was made with (a real keyboard)', async () => {
    const { previous, next, centre, before } = mount({
      mode: 'bounded',
      count: 3,
      neighbours: true,
    });
    await realUser.click(before());
    await realUser.tab();
    // previous is disabled at the first card, so Tab lands on next.
    expect(document.activeElement).toBe(next());
    await realUser.keyboard('{Enter}');
    await realUser.keyboard('{Enter}');
    expect(centre()).toHaveAccessibleName('3 din 3');
    expect(next()).toBeDisabled();
    expect(document.activeElement).toBe(previous());

    await realUser.keyboard('{Enter}');
    await realUser.keyboard('{Enter}');
    expect(centre()).toHaveAccessibleName('1 din 3');
    expect(previous()).toBeDisabled();
    expect(document.activeElement).toBe(next());
  });

  it('follows a third of a hand pulling past an end, and springs back on release', () => {
    const { stage, slides, centre } = mount({ mode: 'bounded' });
    const hand = press(stage());
    hand.move(0.6 * PITCH);
    // Past the first card: the ring follows a third of the hand.
    expect(shiftOf(slides()[0])).toBeCloseTo(poseAt(0.2).tx, 5);
    hand.up(0.6 * PITCH);
    expect(centre()).toHaveAccessibleName('1 din 7');
    expect(shiftOf(slides()[0])).toBe(0);
  });

  it('steps within the list and clamps a long release at its end', () => {
    const { stage, centre } = mount({ mode: 'bounded' });
    dragBy(stage(), -1.4 * PITCH);
    expect(centre()).toHaveAccessibleName('2 din 7');
    dragBy(stage(), -9 * PITCH);
    expect(centre()).toHaveAccessibleName('7 din 7');
  });
});

describe('CardCarousel — the island contract', () => {
  it('IS the island: the directive is on line 1 (§16)', () => {
    expect(source.split('\n')[0]).toBe("'use client';");
  });

  it('hears the end of a press on the WINDOW, in its capture phase — two listeners, added once, taken away when it unmounts', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = mount();
    const added = add.mock.calls.filter(
      ([type]) => type === 'pointerup' || type === 'pointercancel',
    );
    expect(added.map(([type, , options]) => [type, options])).toEqual([
      ['pointerup', true],
      ['pointercancel', true],
    ]);
    expect(remove).not.toHaveBeenCalledWith(
      'pointerup',
      expect.anything(),
      true,
    );
    unmount();
    for (const [type, listener, options] of added) {
      expect(remove).toHaveBeenCalledWith(type, listener, options);
    }
  });

  it('drops a waiting press on the window’s `contextmenu`, in its capture phase, and on the WINDOW’s own `blur` — two listeners more, added once, taken away when it unmounts', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = mount();
    const added = add.mock.calls.filter(
      ([type]) => type === 'contextmenu' || type === 'blur',
    );
    // `blur` without its capture phase: an element's blur, which does not
    // bubble, never reaches it — only the window's own.
    expect(added.map(([type, , options]) => [type, options])).toEqual([
      ['contextmenu', true],
      ['blur', undefined],
    ]);
    unmount();
    // Each taken away with the very listener and phase it was added with.
    for (const [type, listener, options] of added) {
      expect(
        remove.mock.calls.some(
          (call) =>
            call[0] === type && call[1] === listener && call[2] === options,
        ),
        String(type),
      ).toBe(true);
    }
  });

  it('calls no t() and holds no message key — every word is a prop (§8.1)', () => {
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b/);
    expect(CODE).not.toMatch(/common\.carousel\./);
  });

  it('renders no rotation control and no speed control (the owner: “no stop button no speed”) — and stops for good only through ui/use-rotation’s handNavigation', () => {
    expect(CODE).not.toMatch(/rotationControl|\bplay\(/);
    // The stop for good is the shell's, written once: no pause of its own.
    expect(CODE).not.toMatch(/\.pause\(/);
    expect(CODE).toMatch(/\bhandNavigation\(/);
  });
});

// ── THE FLAT ROW (2026-10-25 — CardCarousel.tsx's header of that name) ──────

/** The Home band's list card, in the theme's step — 347.33px at the default
 *  root; here only a string, no stylesheet sizing anything. */
const FLAT_WIDTH = 'calc(var(--spacing) / 4 * (1106 - 2 * 32) / 3)';

/** One of the island's class constants, as the tokens it holds — every
 *  quoted literal between `const NAME =` and the statement's end, so a
 *  `cx(…)` of literals reads like one string. */
function tokensOf(name: string): string[] {
  const statement = new RegExp(`const ${name} =([\\s\\S]*?);\\n`).exec(CODE);
  if (statement?.[1] === undefined) throw new Error(`no ${name}`);
  return [...statement[1].matchAll(/'([^']*)'|"([^"]*)"/g)]
    .flatMap((match) => (match[1] ?? match[2] ?? '').split(/\s+/))
    .filter((token) => token !== '');
}

/** An element's class tokens. */
const classesOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** The names of the cards that are LIVE — neither inert nor aria-hidden. */
const liveOf = (slides: HTMLElement[]): string[] =>
  slides
    .filter(
      (slide) =>
        !slide.hasAttribute('inert') && !slide.hasAttribute('aria-hidden'),
    )
    .map((slide) => slide.getAttribute('aria-label') ?? '');

/**
 * The widths the island reads for THE REACH, set inline on its own boxes —
 * the hand's box (the stage), every card box, the previous arrow's strip —
 * then the size change it hears, through every FakeResizer.
 */
function sizeRow(
  carousel: ReturnType<typeof mount>,
  widths: Readonly<{ stage: number; card: number; bar: number }>,
): void {
  const hand = carousel.stage().parentElement as HTMLElement;
  hand.style.width = `${widths.stage}px`;
  for (const slide of carousel.slides()) {
    slide.style.width = `${widths.card}px`;
  }
  carousel.previous().style.width = `${widths.bar}px`;
  for (const resizer of FakeResizer.instances) resizer.fire();
}

/** The BARE carousel's arithmetic at a 1280px stage — a 347.33px card and the
 *  arrows' 36px strips, the stage the whole screen: one card live a side.
 *  Not the Home band's own row, which draws 55.38px strips at a tablet on a
 *  stage 1rem narrower than the screen (sections/BlogCarousel's THE CHROME
 *  SCALES WITH THE ROW'S PIXEL and THE BLEED). */
const ROW_1280 = { stage: 1280, card: (1106 - 2 * 32) / 3, bar: 36 } as const;

/** THE ANNOUNCEMENT IS THE CENTRE CARD'S: the status line — a live region the
 *  section holds itself, outside the stage — or null where there is none. */
const statusOf = (carousel: ReturnType<typeof mount>): HTMLElement | null =>
  carousel.region().querySelector<HTMLElement>(':scope > [aria-live]');

describe('CardCarousel — THE FLAT ROW: the prop', () => {
  it('has ONE value, beside a fixed card alone: any other value, and the row without a fixed width, is a RangeError — and the types refuse the row without `cardWidth`', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const common = {
      slides: cardsFor(3),
      slideLabels: labelsFor(3),
      labels: LABELS,
      visible: 5,
      mode: 'loop',
      env: quietEnv(),
    } as const;
    // The one answer: a fixed card that lies flat.
    const { unmount } = render(
      <CardCarousel {...common} cardWidth={FLAT_WIDTH} flatFrom="tablet" />,
    );
    unmount();
    // No fixed width: the types refuse it, and a JavaScript caller meets the
    // RangeError — the share's card, and the cap's, have no meaning in a row
    // as wide as the screen.
    expect(() =>
      render(
        // @ts-expect-error — THE FLAT ROW needs THE FIXED CARD
        <CardCarousel {...common} flatFrom="tablet" />,
      ),
    ).toThrow(/`flatFrom` without `cardWidth`/);
    expect(() =>
      render(
        // @ts-expect-error — never beside the cap
        <CardCarousel {...common} cardCap="capped" flatFrom="tablet" />,
      ),
    ).toThrow(/`flatFrom` without `cardWidth`/);
    // Any other value — a JavaScript caller's — is no step at all.
    for (const flatFrom of ['Tablet', 'phone', '', true, 1, null]) {
      const smuggled = { flatFrom } as object;
      expect(
        () =>
          render(
            <CardCarousel {...common} cardWidth={FLAT_WIDTH} {...smuggled} />,
          ),
        JSON.stringify(flatFrom),
      ).toThrow(/`flatFrom`.*is no step.*'tablet'/);
    }
    // An explicit `undefined` is no value: the line at every width.
    const absent = { flatFrom: undefined } as object;
    expect(() =>
      render(<CardCarousel {...common} cardWidth={FLAT_WIDTH} {...absent} />),
    ).not.toThrow();
  });

  it('puts no `flatFrom` on the <section> as an attribute', () => {
    stubFlatQuery(false);
    const { region } = mount({
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    expect(region()).not.toHaveAttribute('flatfrom');
    expect(region()).not.toHaveAttribute('flatFrom');
    expectTypeOf<CardCarouselProps['flatFrom']>().toEqualTypeOf<
      'tablet' | undefined
    >();
  });

  it('writes NOTHING of the row without the prop — no class, no custom property, no listener — in every geometry, window and mode: the line, byte for byte', () => {
    const resizers = FakeResizer.instances.length;
    vi.stubGlobal('ResizeObserver', FakeResizer);
    for (const cardWidth of [undefined, FLAT_WIDTH]) {
      for (const visible of [3, 5] as const) {
        for (const mode of ['loop', 'bounded'] as const) {
          const what = `${cardWidth ?? 'the cap'}, ${visible}, ${mode}`;
          const html = renderToStaticMarkup(
            carouselFor({ cardWidth, visible, mode }),
          );
          for (const trace of [
            '@media',
            '--ftx',
            '--fsc',
            'before:',
            'will-change',
            'hover:scale',
          ]) {
            expect(html, `${what}: ${trace}`).not.toContain(trace);
          }
          // And an explicit `undefined` writes the very same HTML.
          expect(
            renderToStaticMarkup(
              carouselFor({ cardWidth, visible, mode, flatFrom: undefined }),
            ),
            what,
          ).toBe(html);
        }
      }
    }
    // Every card box the line's own classes, exactly.
    const { slides, unmount } = mount({ cardWidth: FLAT_WIDTH });
    for (const slide of slides()) {
      expect(classesOf(slide)).toEqual([
        ...tokensOf('SLIDE'),
        ...tokensOf('SLIDE_MOVE'),
      ]);
    }
    unmount();
    // No observer was made for a carousel that never lies flat.
    expect(FakeResizer.instances.length).toBe(resizers);
  });
});

describe('CardCarousel — THE FLAT ROW: its classes and custom properties', () => {
  beforeEach(() => {
    FakeResizer.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizer);
  });

  it('spells its query ONCE: every class that draws the row wears CARD_CAROUSEL_FLAT_QUERY, its spaces as Tailwind’s underscores — and the engine reads the constant as a query', () => {
    const spellings = [...CODE.matchAll(/\[@media([^\]]*)\]:/g)].map(
      (match) => match[1],
    );
    // Two on the root, three on a card box, one for the centred card's aura.
    expect(spellings).toHaveLength(6);
    for (const spelling of spellings) {
      expect(spelling.replaceAll('_', ' ')).toBe(CARD_CAROUSEL_FLAT_QUERY);
    }
    // A query the engine could not parse would read "not all".
    expect(window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media).not.toMatch(
      /not all/,
    );
    // THE QUERY (the header): TWO media queries in one list, the width clause
    // in each — 32rem tall, or a fine pointer: a laptop a zoom made short
    // keeps the row (the geometry test draws it there).
    expect(
      window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media.split(', '),
    ).toEqual([
      '(min-width: 37.5rem) and (min-height: 32rem)',
      '(min-width: 37.5rem) and (pointer: fine)',
    ]);
  });

  it('writes each card’s ROW pose beside its LINE pose — `--ftx` and `--fsc`, ./conveyor’s — and nothing more', () => {
    stubFlatQuery(false);
    const { slides } = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    const positions = [0, 1, 2, 3, -3, -2, -1];
    for (const [card, slide] of slides().entries()) {
      const flat = flatPoseAt(positions[card]);
      const line = poseAt(positions[card]);
      expect(Number(slide.style.getPropertyValue('--ftx'))).toBe(flat.tx);
      expect(Number(slide.style.getPropertyValue('--fsc'))).toBe(flat.sc);
      expect(shiftOf(slide)).toBe(line.tx);
      expect([...slide.style].sort()).toEqual([
        '--fsc',
        '--ftx',
        '--ry',
        '--sc',
        '--tx',
        'z-index',
      ]);
    }
  });

  it('dresses every card box for the row and THE HOVER, and every one with the aura’s layer — the centred card’s alone shown, and the mark moving with the ring', () => {
    stubFlatQuery(false);
    const { slides, next } = mount({
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    const shown = tokensOf('AURA_SHOWN');
    expect(shown).toEqual([
      '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:before:opacity-100',
    ]);
    const showing = (): string[] =>
      slides()
        .filter((slide) => classesOf(slide).includes(shown[0]))
        .map((slide) => slide.getAttribute('aria-label') ?? '');
    for (const slide of slides()) {
      expect(classesOf(slide)).toEqual(
        expect.arrayContaining([
          ...tokensOf('SLIDE'),
          ...tokensOf('FLAT_SLIDE'),
          ...tokensOf('AURA'),
          ...tokensOf('FLAT_MOVE'),
        ]),
      );
    }
    expect(showing()).toEqual(['1 din 7']);
    fireEvent.click(next());
    expect(showing()).toEqual(['2 din 7']);
    // THE HOVER — the box, not the card in it: the centre card to 1.05, a side
    // card to 1 ÷ 0.9, the centre card's own size; held still under reduced
    // motion.
    expect(tokensOf('FLAT_SLIDE')).toEqual(
      expect.arrayContaining([
        'hover:scale-[max(1.05,calc(1/var(--fsc)))]',
        'motion-reduce:hover:scale-100',
        '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[transform:scale(var(--fsc))]',
        '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[translate:calc(var(--card)*var(--ftx))_0]',
        '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:supports-[font:-apple-system-body]:will-change-transform',
      ]),
    );
    // THE HIGHLIGHT's layer: the house's aura, the soft corner, no pointer,
    // invisible at rest, on ui/Card's clock spelled as numbers — never the
    // root's `--fade`, which here is the mask's length — and none under
    // reduced motion.
    const aura = tokensOf('AURA');
    expect(aura).toEqual(
      expect.arrayContaining([
        'before:pointer-events-none',
        'before:absolute',
        'before:inset-0',
        'before:rounded-soft',
        'before:shadow-aura',
        'before:opacity-0',
        "before:content-['']",
        'before:transition-opacity',
        'before:duration-[400ms]',
        'before:ease-in-out',
        'motion-reduce:before:transition-none',
      ]),
    );
    expect(aura.filter((token) => token.includes('(--fade)'))).toEqual([]);
  });

  it('moves on THREE clocks — the move’s 700ms for `transform` and `translate`, the jump’s 200ms for `scale` — and under a hand snaps all but the hover’s', () => {
    stubFlatQuery(false);
    const { slides, stage } = mount({
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    const move = tokensOf('FLAT_MOVE');
    const snap = tokensOf('FLAT_SNAP');
    expect(move).toEqual([
      '[--jump:200ms]',
      '[transition-property:transform,translate,scale]',
      '[transition-duration:700ms,700ms,var(--jump)]',
      '[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94),cubic-bezier(0.25,0.46,0.45,0.94),ease-out]',
      'motion-reduce:transition-none',
    ]);
    // The move's curve is THE MOVE's own (the line's SLIDE_MOVE).
    const curve = /ease-\[(cubic-bezier\([^\]]+\))\]/.exec(
      tokensOf('SLIDE_MOVE').join(' '),
    )?.[1];
    expect(curve).toBe('cubic-bezier(0.25,0.46,0.45,0.94)');
    expect(move[3]).toContain(`${curve},${curve},ease-out`);
    // Under the hand: the pose lands at once, the hover's scale still glides.
    expect(snap).toEqual([
      '[--jump:200ms]',
      'transition-[scale]',
      'duration-(--jump)',
      'ease-[ease-out]',
      'motion-reduce:transition-none',
    ]);
    const has = (slide: HTMLElement, tokens: string[]): boolean =>
      tokens.every((token) => classesOf(slide).includes(token));
    expect(slides().every((slide) => has(slide, move))).toBe(true);
    const hand = press(stage());
    hand.move(-0.4 * FLAT_STEP * FRAME);
    expect(slides().every((slide) => has(slide, snap))).toBe(true);
    expect(slides().some((slide) => has(slide, move))).toBe(false);
    // The line's own clocks never: a flat carousel's boxes wear the row's.
    for (const slide of slides()) {
      expect(classesOf(slide)).not.toContain('transition-transform');
      expect(classesOf(slide)).not.toContain('transition-none');
    }
    hand.cancel();
  });

  it('wears the root’s two overrides — no room beside a window, the fade the arrows’ own strip — beside THE FIXED CARD’s geometry', () => {
    stubFlatQuery(false);
    const { region } = mount({
      visible: 5,
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    const root = classesOf(region());
    expect(tokensOf('FLAT_ROOT')).toEqual([
      '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--inset:0px]',
      '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--fade:var(--bar)]',
    ]);
    expect(root).toEqual(expect.arrayContaining(tokensOf('FLAT_ROOT')));
    // THE FIXED CARD's own spellings stay, the row's a later rule beside them.
    expect(root).toContain('[--stage:100cqw]');
    expect(root.filter((name) => name.startsWith('[--inset:'))).toHaveLength(1);
  });
});

describe('CardCarousel — THE FLAT ROW: the reach', () => {
  beforeEach(() => {
    FakeResizer.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizer);
  });

  it('keeps the centre card alone live in the server’s HTML — the reach is measured only after mount — and hydrates it with no warning, then frees its neighbours', async () => {
    stubFlatQuery(true);
    const element = carouselFor({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    const html = renderToStaticMarkup(element);
    expect(html.match(/inert=""/g)).toHaveLength(6);
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(6);
    const container = document.createElement('div');
    container.style.width = `${FRAME}px`;
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const errors: string[] = [];
    const spy = vi
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '));
      });
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, element);
      });
      expect(errors).toEqual([]);
      const region = container.querySelector('section') as HTMLElement;
      const slides = [
        ...region.querySelectorAll<HTMLElement>('[aria-live] > [role="group"]'),
      ];
      // At the frame's natural widths nothing reaches past the arrows.
      expect(liveOf(slides)).toEqual(['1 din 7']);
      // Measured again on a size change: one card a side.
      const hand = region.querySelector('[aria-live]')
        ?.parentElement as HTMLElement;
      hand.style.width = `${ROW_1280.stage}px`;
      for (const slide of slides) slide.style.width = `${ROW_1280.card}px`;
      const previous = region.querySelector(
        `[aria-label="${LABELS.previous}"]`,
      ) as HTMLElement;
      previous.style.width = `${ROW_1280.bar}px`;
      for (const resizer of FakeResizer.instances) resizer.fire();
      expect(liveOf(slides)).toEqual(['1 din 7', '2 din 7', '7 din 7']);
    } finally {
      spy.mockRestore();
      act(() => root?.unmount());
      container.remove();
    }
  });

  it('frees every card within the reach of the ring’s card and keeps the rest previews: one a side at a 1280 stage, two at 2000, none once the window leaves the query — and back', () => {
    const query = stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    expect(liveOf(carousel.slides())).toEqual(['1 din 7']);
    sizeRow(carousel, ROW_1280);
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '7 din 7',
    ]);
    // The rest stay previews — both halves of the belt.
    for (const slide of carousel.slides()) {
      const live = liveOf([slide]).length === 1;
      expect(slide.hasAttribute('inert')).toBe(!live);
      expect(slide.getAttribute('aria-hidden')).toBe(live ? null : 'true');
    }
    sizeRow(carousel, { ...ROW_1280, stage: 2000 });
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '3 din 7',
      '6 din 7',
      '7 din 7',
    ]);
    query.flip(false);
    expect(liveOf(carousel.slides())).toEqual(['1 din 7']);
    query.flip(true);
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '3 din 7',
      '6 din 7',
      '7 din 7',
    ]);
  });

  it('follows the ring: after a step the live cards are the new centre’s neighbours — never a drag’s fractional place', () => {
    stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    sizeRow(carousel, ROW_1280);
    fireEvent.click(carousel.next());
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '3 din 7',
    ]);
    // A hand 0.8 of a step on: the ring's card has not changed.
    const hand = press(carousel.stage());
    hand.move(-0.8 * ROW_1280.card * FLAT_STEP);
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '3 din 7',
    ]);
    hand.cancel();
  });

  it('holds the reach under half the list — the card half a ring away, an even list’s tie, is never live; two cards free no side — and the cap is NO crossing card’s guard: at the cap a live neighbour snaps across the ring', () => {
    stubFlatQuery(true);
    const snapped = (slide: HTMLElement): boolean =>
      tokensOf('FLAT_SNAP').every((token) => classesOf(slide).includes(token));
    const named = (
      carousel: ReturnType<typeof mount>,
      label: string,
    ): HTMLElement => {
      const found = carousel
        .slides()
        .find((slide) => slide.getAttribute('aria-label') === label);
      if (found === undefined) throw new Error(`no card ${label}`);
      return found;
    };
    const four = mount({ count: 4, cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    sizeRow(four, { ...ROW_1280, stage: 4000 });
    // Offsets −1, 0, +1 and the tie, +2 — half a ring away, never live.
    expect(liveOf(four.slides())).toEqual(['1 din 4', '2 din 4', '4 din 4']);
    // The header's THE REACH, corrected 2026-10-26: the reach (1) meets the
    // cap (⌊3 ÷ 2⌋), so the card that crosses the ring on next is the LIVE
    // left neighbour — „4 din 4", −1 → +2 — snapping, a preview after it.
    expect(snapped(named(four, '4 din 4'))).toBe(false);
    fireEvent.click(four.next());
    expect(snapped(named(four, '4 din 4'))).toBe(true);
    expect(liveOf(four.slides())).toEqual(['1 din 4', '2 din 4', '3 din 4']);
    four.unmount();
    FakeResizer.instances = [];
    // Of three, the crossing card is live on both sides of its jump: −1 → +1.
    const three = mount({
      count: 3,
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    sizeRow(three, { ...ROW_1280, stage: 4000 });
    expect(liveOf(three.slides())).toEqual(['1 din 3', '2 din 3', '3 din 3']);
    fireEvent.click(three.next());
    expect(snapped(named(three, '3 din 3'))).toBe(true);
    expect(liveOf(three.slides())).toEqual(['1 din 3', '2 din 3', '3 din 3']);
    three.unmount();
    FakeResizer.instances = [];
    const two = mount({ count: 2, cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    sizeRow(two, { ...ROW_1280, stage: 4000 });
    expect(liveOf(two.slides())).toEqual(['1 din 2']);
  });

  it('frees the bounded list’s cards by their plain distance — none past its ends', () => {
    stubFlatQuery(true);
    const carousel = mount({
      mode: 'bounded',
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
    });
    sizeRow(carousel, ROW_1280);
    expect(liveOf(carousel.slides())).toEqual(['1 din 7', '2 din 7']);
    fireEvent.click(carousel.next());
    expect(liveOf(carousel.slides())).toEqual([
      '1 din 7',
      '2 din 7',
      '3 din 7',
    ]);
  });

  it('is 0 wherever the row is not drawn: the query not matching at mount frees no side card, however wide the stage', () => {
    stubFlatQuery(false);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    sizeRow(carousel, { ...ROW_1280, stage: 4000 });
    expect(liveOf(carousel.slides())).toEqual(['1 din 7']);
  });

  it('listens to the query and to the three boxes it reads — the hand’s, a card’s, an arrow’s — and lets go of both when it unmounts', () => {
    const query = stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    expect(FakeResizer.instances).toHaveLength(1);
    const [resizer] = FakeResizer.instances;
    expect(resizer.targets).toEqual([
      carousel.stage().parentElement,
      carousel.slides()[0],
      carousel.previous(),
    ]);
    expect(query.listeners.size).toBe(1);
    carousel.unmount();
    expect(resizer.disconnected).toBe(true);
    expect(query.listeners.size).toBe(0);
  });

  it('a press on a live SIDE card is a TAP — it stops the ring for good, like one on the centre card', () => {
    vi.useFakeTimers();
    stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    sizeRow(carousel, ROW_1280);
    const side = carousel
      .slides()
      .find((slide) => slide.getAttribute('aria-label') === '2 din 7');
    if (side === undefined) throw new Error('no side card');
    expect(side).not.toHaveAttribute('inert');
    fireEvent.click(side, { detail: 1 });
    expect(vi.getTimerCount()).toBe(0);
    // With live side cards the status line is the polite one, the stage
    // silent (THE ANNOUNCEMENT IS THE CENTRE CARD'S).
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    expect(statusOf(carousel)).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(10 * INTERVAL));
    expect(classesOf(carousel.slides()[0])).toContain(
      tokensOf('AURA_SHOWN')[0],
    );
  });
});

describe('CardCarousel — THE FLAT ROW: what it says, and the focus it keeps', () => {
  beforeEach(() => {
    FakeResizer.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizer);
  });

  /** The card box named `label`. */
  const named = (
    carousel: ReturnType<typeof mount>,
    label: string,
  ): HTMLElement => {
    const found = carousel
      .slides()
      .find((slide) => slide.getAttribute('aria-label') === label);
    if (found === undefined) throw new Error(`no card ${label}`);
    return found;
  };

  it('silences the stage while side cards are live and says the CENTRED card’s label in ONE status line beside it — on the stage’s own politeness, the new centre’s after a step or a bead, unchanged by a resize — and gives the stage back its part once the row frees none', () => {
    const query = stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    // At the frame's natural widths the row frees no side card: the stage is
    // the live region it always was, and there is no status line.
    expect(statusOf(carousel)).toBeNull();
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    sizeRow(carousel, ROW_1280);
    const status = statusOf(carousel);
    if (status === null) throw new Error('no status line');
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    // The ring runs: the line is off too — it speaks only once held.
    expect(status).toHaveAttribute('aria-live', 'off');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).not.toHaveAttribute('role');
    expect(classesOf(status)).toEqual(tokensOf('STATUS'));
    expect(status.textContent).toBe('1 din 7');
    // Outside the stage — the section's last child, after the hand's box.
    expect(carousel.stage().contains(status)).toBe(false);
    expect(carousel.region().lastElementChild).toBe(status);
    // A press: the stop, then the step — the line polite, the stage silent,
    // and what it says the card the ring landed on.
    fireEvent.click(carousel.next());
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    expect(statusOf(carousel)).toHaveAttribute('aria-live', 'polite');
    expect(statusOf(carousel)?.textContent).toBe('2 din 7');
    fireEvent.click(carousel.bead('5 din 7'));
    expect(statusOf(carousel)?.textContent).toBe('5 din 7');
    // A resize frees more cards and says nothing new.
    sizeRow(carousel, { ...ROW_1280, stage: 2000 });
    expect(liveOf(carousel.slides())).toHaveLength(5);
    expect(statusOf(carousel)?.textContent).toBe('5 din 7');
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    // The row left: the stage speaks again, the line gone.
    query.flip(false);
    expect(statusOf(carousel)).toBeNull();
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    expect(carousel.region().querySelectorAll('[aria-live]')).toHaveLength(1);
  });

  it('keeps the markup with NO live side card byte for byte — the server’s HTML one live region and nothing of the row’s speech, and a row whose side cards are hidden again the very HTML it had before they were freed', () => {
    const html = renderToStaticMarkup(
      carouselFor({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' }),
    );
    expect(html.match(/aria-live=/g)).toHaveLength(1);
    // The current BEAD's aria-current alone — no card group's.
    expect(html.match(/aria-current=/g)).toHaveLength(1);
    for (const trace of ['aria-atomic', 'reading-']) {
      expect(html, trace).not.toContain(trace);
    }
    /** The region's HTML with every element's attributes in one order — the
     *  DOM puts an attribute taken off and set again at its element's end,
     *  which is no change of the markup. */
    const markupOf = (element: Element): string => {
      const copy = element.cloneNode(true) as Element;
      for (const node of [copy, ...copy.querySelectorAll('*')]) {
        const attributes = [...node.attributes]
          .map(({ name, value }) => [name, value] as const)
          .sort(([a], [b]) => a.localeCompare(b));
        for (const [name] of attributes) node.removeAttribute(name);
        for (const [name, value] of attributes) node.setAttribute(name, value);
      }
      return copy.outerHTML;
    };
    const query = stubFlatQuery(false);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    // Sized as a laptop's row, but the window is not one: no side card.
    sizeRow(carousel, ROW_1280);
    const before = markupOf(carousel.region());
    query.flip(true);
    expect(statusOf(carousel)).not.toBeNull();
    expect(markupOf(carousel.region())).not.toBe(before);
    query.flip(false);
    expect(markupOf(carousel.region())).toBe(before);
  });

  it('silences the stage a commit BEFORE the reach frees a card — in one commit React writes the cards’ attributes before the stage’s — and speaks again only after they are hidden', () => {
    const query = stubFlatQuery(true);
    // Reduced motion: the ring never runs, so the stage is polite from the
    // start — the case where the order is heard.
    const carousel = mount({
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
      reduced: true,
    });
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    const watch = new MutationObserver(() => {});
    watch.observe(carousel.stage(), {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-live', 'inert'],
    });
    const order = (): string[] =>
      watch
        .takeRecords()
        .map((record) =>
          record.target === carousel.stage() ? 'stage' : 'card',
        );
    sizeRow(carousel, ROW_1280);
    // Two cards freed, „2 din 7" and „7 din 7" — after the stage fell silent.
    expect(order()).toEqual(['stage', 'card', 'card']);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'off');
    query.flip(false);
    expect(order()).toEqual(['card', 'card', 'stage']);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    watch.disconnect();
  });

  it('says which card is CURRENT while side cards are live — the centred card’s group, aria-current="true", moving with the ring — and none where it is the one live card', () => {
    const query = stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    const current = (): string[] =>
      carousel
        .slides()
        .filter((slide) => slide.getAttribute('aria-current') === 'true')
        .map((slide) => slide.getAttribute('aria-label') ?? '');
    expect(current()).toEqual([]);
    sizeRow(carousel, ROW_1280);
    expect(current()).toEqual(['1 din 7']);
    fireEvent.click(carousel.next());
    expect(current()).toEqual(['2 din 7']);
    query.flip(false);
    expect(current()).toEqual([]);
  });

  it('makes the stage a READING FLOW container while side cards are live — each card’s reading-order its offset from the ring’s card, following the ring — and writes neither where the row frees none', () => {
    const query = stubFlatQuery(true);
    const carousel = mount({ cardWidth: FLAT_WIDTH, flatFrom: 'tablet' });
    const orders = (): string[] =>
      carousel
        .slides()
        .map((slide) => slide.style.getPropertyValue('reading-order'));
    const flows = (): boolean =>
      classesOf(carousel.stage()).includes(tokensOf('READING_FLOW')[0]);
    expect(flows()).toBe(false);
    expect(orders()).toEqual(Array.from({ length: 7 }, () => ''));
    sizeRow(carousel, ROW_1280);
    expect(tokensOf('READING_FLOW')).toEqual(['[reading-flow:source-order]']);
    expect(classesOf(carousel.stage())).toEqual([
      ...tokensOf('STAGE'),
      ...tokensOf('READING_FLOW'),
    ]);
    // A loop on its first card: 0, +1, +2, +3, then −3, −2, −1.
    expect(orders()).toEqual(['0', '1', '2', '3', '-3', '-2', '-1']);
    fireEvent.click(carousel.next());
    expect(orders()).toEqual(['-1', '0', '1', '2', '3', '-3', '-2']);
    query.flip(false);
    expect(flows()).toBe(false);
    expect(orders()).toEqual(Array.from({ length: 7 }, () => ''));
  });

  it('KEEPS a focused side card live when the reach shrinks — the window falling out of the query, as a zoom does — so the focus and the keyboard’s hold stay; the card turns a preview once the focus leaves it', async () => {
    const query = stubFlatQuery(true);
    const carousel = mount({
      cardWidth: FLAT_WIDTH,
      flatFrom: 'tablet',
      neighbours: true,
      linkEveryCard: true,
    });
    sizeRow(carousel, ROW_1280);
    const side = named(carousel, '2 din 7');
    expect(side).not.toHaveAttribute('inert');
    const link = side.querySelector('a');
    if (link === null) throw new Error('no link');
    // A REAL Tab to it — the keyboard's modality, the hold's.
    await realUser.click(carousel.before());
    for (let i = 0; i < 20 && document.activeElement !== link; i++) {
      await realUser.tab();
    }
    expect(document.activeElement).toBe(link);
    // Held: the status line polite (the stage silent beside it).
    expect(statusOf(carousel)).toHaveAttribute('aria-live', 'polite');
    query.flip(false);
    // The row gone, its reach 0 — and the focused card kept live.
    expect(side).not.toHaveAttribute('inert');
    expect(side).not.toHaveAttribute('aria-hidden');
    expect(document.activeElement).toBe(link);
    expect(carousel.stage()).toHaveAttribute('aria-live', 'polite');
    // The focus leaves it — onward, past the inert cards, out of the region.
    await realUser.tab();
    expect(carousel.region().contains(document.activeElement)).toBe(false);
    expect(side).toHaveAttribute('inert');
    expect(side).toHaveAttribute('aria-hidden', 'true');
  });

  it('tracks NO focus in a carousel that never lies flat — its markup the line’s whatever holds the focus', async () => {
    const carousel = mount({ neighbours: true });
    const link = carousel.centre().querySelector('a');
    if (link === null) throw new Error('no link');
    await realUser.click(carousel.before());
    for (let i = 0; i < 20 && document.activeElement !== link; i++) {
      await realUser.tab();
    }
    expect(document.activeElement).toBe(link);
    // A hand's step while the link holds the focus: the card it left is a
    // preview, as it always was.
    fireEvent.click(carousel.next());
    expect(named(carousel, '1 din 7')).toHaveAttribute('inert');
  });
});

describe('CardCarousel — THE FLAT ROW: the hand', () => {
  beforeEach(() => {
    FakeResizer.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizer);
  });

  it.each([
    ['where the row is drawn: FLAT_STEP card widths a card', true],
    ['where it is not: the line’s STEP', false],
  ] as const)(
    'drags on the step of what is drawn — %s — the centre card under the hand',
    (_what, drawn) => {
      stubFlatQuery(drawn);
      const { stage, slides } = mount({
        cardWidth: FLAT_WIDTH,
        flatFrom: 'tablet',
      });
      const step = drawn ? FLAT_STEP : STEP;
      const hand = press(stage());
      hand.move(-0.3 * step * FRAME);
      // A third of the drawn step: the centre card 0.3 of a card on, in both
      // poses — and under the hand in the one the stylesheet draws.
      const [centre] = slides();
      expect(Number(centre.style.getPropertyValue('--ftx'))).toBeCloseTo(
        flatPoseAt(-0.3).tx,
        5,
      );
      expect(shiftOf(centre)).toBeCloseTo(poseAt(-0.3).tx, 5);
      const drawnShift = drawn
        ? Number(centre.style.getPropertyValue('--ftx'))
        : shiftOf(centre);
      expect(drawnShift * FRAME).toBeCloseTo(-0.3 * step * FRAME, 1);
      hand.cancel();
    },
  );
});
