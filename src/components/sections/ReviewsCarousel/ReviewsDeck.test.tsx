import { act, fireEvent, render, screen } from '@testing-library/react';
import testingUser from '@testing-library/user-event';
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
  it,
  vi,
} from 'vitest';
import type { ClockEnv } from '@/lib/clock/clock';
import ro from '@/messages/ro.json';
import { ReviewsDeck, type ReviewSlide } from './ReviewsDeck';
import source from './ReviewsDeck.tsx?raw';

// sections/ReviewsCarousel/ReviewsDeck — the island's interaction suite, i.e.
// the MANNERS lib/rotation's header law assigns to a consumer, as this deck
// keeps them after the owner's pack round 2 (2026-09-12: no rotation control;
// a hand on the deck stops it). Role-based queries throughout (§9, §13): a
// passing suite doubles as proof of accessible markup, and every user-facing
// string comes from the REAL message files — never a literal typed in here
// (§17.4), so a renamed key fails HERE as well as in the translation-parity
// gate.
//
// ── TIME AND THE ENVIRONMENT ARE THE SUITE'S, NEVER THE MACHINE'S (the
// lib/clock convention, reused verbatim). Every deck below is built with an
// `env` of plain functions: the real prefers-reduced-motion query and the real
// tab visibility are workstation state a test may not own — a suite that read
// them would pass here and fail in CI. Fake TIMERS appear in exactly one
// describe block, the one that makes a claim about WHEN.
//
// ── TWO userEvents, ON PURPOSE, and the difference decides the focus tests.
//   · `testingUser` (@testing-library/user-event) DISPATCHES events. It needs
//     no CSS (this project loads none — tests/setup/components.ts) and no
//     layout, which is what makes hover/click assertions stable here.
//   · `realUser` (vitest/browser, Playwright) drives the REAL browser. Only a
//     trusted Tab sets Chromium's keyboard modality, and `:focus-visible` is
//     what classifyFocusEntry() reads to tell a keyboard entry from a pointer
//     one — so the keyboard-entry claim lib/rotation's header owes its FIRST
//     CONSUMER ("keyboard focus entering stops the rotation") is made with it
//     and could not honestly be made without it. A synthetic focus is used
//     only where the POINTER classification is the subject, where "not
//     focus-visible" is exactly what a real mouse press produces.
//
// ── WHAT IS NOT RE-TESTED HERE: the ring itself. wrapIndex, the two-item
// floor, the status machine, the full-interval courtesy and
// classifyFocusEntry's three answers all have their own suites in
// src/lib/rotation and src/lib/clock. This file asserts the WIRING — that the
// deck asks the ring the right question and paints the answer. Nor the
// GEOMETRY: the stage's full-bleed margins and the card's share of the screen
// are computed lengths, measured by the band's stories in a real browser with
// the real stylesheet (ReviewsCarousel.stories.tsx `expectFannedStage`).

/** Every word the island says, from the REAL message files (§17.4). */
const LABELS = {
  region: ro.home.reviews.region,
  role: ro.common.carousel.role,
  slideRole: ro.common.carousel.slideRole,
  previous: ro.home.reviews.previous,
  next: ro.home.reviews.next,
} as const;

/**
 * ui/Card's `emphasized` ground, as that atom spells it since the owner's
 * round 2: the idle frame's own tint (`--card-tint`), behind a `bg-surface`
 * base for engines without color-mix. Pinned as a token rather than computed,
 * because this project loads no stylesheet — and pinned here rather than
 * imported so that a silent change to the atom's tone table fails THIS suite
 * too (the deck is what decides which card wears it).
 */
const EMPHASIZED_FILL =
  'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)';

/** ICU interpolation, done the way the message file declares it. */
const fill = (message: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    message,
  );

/**
 * DEMO reviews — the old site's fabricated Romanian copy (board D15), Romanian
 * with diacritics per §15.7. Never the site's data: lib/reviews ships EMPTY
 * and the real reviews are the owner's to supply. No pictures: the deck only
 * forwards them, the BAND is what maps them (ReviewsCarousel.test.tsx), and a
 * 404'd <img> swaps to ui/Avatar's letters face asynchronously — a moving DOM
 * under assertions that are about something else.
 */
const DEMO: readonly Omit<ReviewSlide, 'label'>[] = [
  {
    id: 'ana-petrescu',
    initials: 'AP',
    rating: 5,
    ratingLabel: '5 din 5 stele',
    title: 'Copiii îmi cer să mergem',
    body: 'Doi copii, zero crize. Camera pediatrică și personalul fac fiecare vizită să pară o aventură.',
    name: 'Ana Petrescu',
    procedure: 'Pacient familie',
  },
  {
    id: 'cristian-voicu',
    initials: 'CV',
    rating: 5,
    ratingLabel: '5 din 5 stele',
    title: 'Au văzut imaginea de ansamblu',
    body: 'Alte clinici mi-au dat un preț. Premium Smile mi-a dat un plan. Trei ani mai târziu, gura mea este sănătoasă.',
    name: 'Cristian Voicu',
    procedure: 'Plan complet',
  },
  {
    id: 'bogdan-ene',
    initials: 'BE',
    rating: 4.5,
    ratingLabel: '4,5 din 5 stele',
    title: 'Fără durere, chiar și la tratamentul de canal',
    body: 'Sincer, mă așteptam la ce e mai rău. Mi-au explicat fiecare minut și am plecat fără pic de durere.',
    name: 'Bogdan Ene',
    procedure: 'Tratament canal',
  },
  {
    id: 'ioana-stan',
    initials: 'IS',
    rating: 4.5,
    ratingLabel: '4,5 din 5 stele',
    title: 'Ca o persoană diferită',
    body: 'Optsprezece luni de aligneri transparenți, controale săptămânale, zero presiune.',
    name: 'Ioana Stan',
    procedure: 'Ortodonție',
  },
  {
    id: 'diana-munteanu',
    initials: 'DM',
    rating: 4,
    ratingLabel: '4 din 5 stele',
    title: 'O reparație mică a schimbat totul',
    body: 'Doar un dinte din față ciobit, dar mă deranja de ani buni. Douăzeci de minute aici și nu mai disting care a fost reparat.',
    name: 'Diana Munteanu',
    procedure: 'Lipire estetică',
  },
  {
    id: 'stefan-radu',
    initials: 'ȘR',
    rating: 3.5,
    ratingLabel: '3,5 din 5 stele',
    title: 'Rapid, lin, prietenos',
    body: 'Toate cele patru măsele de minte într-o dimineață. Instrucțiuni clare și un telefon de control a doua zi.',
    name: 'Ștefan Radu',
    procedure: 'Măsele de minte',
  },
];

/** A browser that neither reduces motion nor hides the tab, unless asked. */
const quietEnv = (reduced = false): ClockEnv => ({
  prefersReducedMotion: () => reduced,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
});

const INTERVAL = 5_000;
const FIRST_DWELL = 15_000;

type MountOptions = {
  count?: number;
  reduced?: boolean;
  intervalMs?: number;
  startDelayMs?: number;
  slides?: readonly Omit<ReviewSlide, 'label'>[];
  /** Renders a focusable sibling on each side — the page around the deck. */
  neighbours?: boolean;
};

/** The band's own mapping, in miniature: one list, each slide named. */
function label(index: number, total: number): string {
  return fill(ro.home.reviews.slide, {
    index: String(index + 1),
    total: String(total),
  });
}

function mount(options: MountOptions = {}) {
  const rows = options.slides ?? DEMO.slice(0, options.count ?? DEMO.length);
  const slides: readonly ReviewSlide[] = rows.map((row, index) => ({
    ...row,
    label: label(index, rows.length),
  }));
  const slideLabels = slides.map((slide) => slide.label);

  const deck = (
    <ReviewsDeck
      slides={slides}
      labels={LABELS}
      intervalMs={options.intervalMs ?? INTERVAL}
      startDelayMs={options.startDelayMs ?? FIRST_DWELL}
      env={quietEnv(options.reduced ?? false)}
    />
  );

  const utils = render(
    options.neighbours ? (
      <>
        <button type="button">Înainte</button>
        {deck}
        <button type="button">După</button>
      </>
    ) : (
      deck
    ),
  );

  const region = (): HTMLElement =>
    screen.getByRole('region', { name: LABELS.region });
  const stage = (): HTMLElement =>
    region().querySelector('[aria-live]') as HTMLElement;
  /** Every slide, far ones included — the attributes are the subject. */
  const slideNodes = (): HTMLElement[] => [
    ...region().querySelectorAll<HTMLElement>('[role="group"]'),
  ];
  const offsetOf = (slide: HTMLElement): number =>
    Number(slide.style.getPropertyValue('--offset'));
  const selected = (): HTMLElement =>
    slideNodes().find((slide) => offsetOf(slide) === 0) as HTMLElement;

  return {
    ...utils,
    slides,
    slideLabels,
    region,
    stage,
    slideNodes,
    offsetOf,
    selected,
    prev: () => screen.getByRole('button', { name: LABELS.previous }),
    next: () => screen.getByRole('button', { name: LABELS.next }),
    before: () => screen.getByRole('button', { name: 'Înainte' }),
    after: () => screen.getByRole('button', { name: 'După' }),
  };
}

/** The section's source with its PROSE removed (the Wordmark mechanism): the
 *  directive guard below must police the code, not this file's own words. */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/**
 * PARK THE REAL POINTER before EVERY deck mounts (CI round 2, 2026-09-12 — the
 * Linux runner hydrated the deck SUSPENDED and every later query then found
 * two regions). Chromium re-dispatches hover state after a layout change, so
 * a mouse left resting — by an earlier file in the same browser page, or by
 * this file's own real-browser focus tests, which click „Înainte" — where a
 * deck is about to appear fires the region's onPointerEnter the moment the
 * deck exists, and the deck honestly starts suspended: a true statement about
 * the mouse, not about the mount. A REAL pointer move (Playwright's) to a spot
 * at the very top of the body, where no deck can be, makes every "starts
 * rotating" claim below a claim about the code — and it is a `beforeEach`,
 * not a one-off, because the pointer is page-level state that any test may
 * move (G3 react M2). The element stays for the whole file: every container
 * appended later lands BELOW it. A plain <div>, so no role-based query can
 * ever match it; never removed mid-file, because a pointer over the empty
 * spot would land on the next region (measured).
 */
let parking: HTMLElement;

beforeAll(() => {
  parking = document.createElement('div');
  parking.id = 'pointer-parking';
  parking.textContent = 'parcare';
  document.body.prepend(parking);
});

beforeEach(async () => {
  await realUser.hover(parking);
});

afterAll(() => {
  parking.remove();
});

describe('ReviewsDeck — the region the APG asks for', () => {
  it('is a named region wearing the localized roledescription', () => {
    // The NAME is what gives a <section> its role=region at all, and
    // aria-roledescription is only valid on an element that HAS a role — which
    // is why both strings are required props, both from the message files.
    const { region } = mount();

    expect(region().tagName).toBe('SECTION');
    expect(region()).toHaveAttribute('aria-roledescription', LABELS.role);
    expect(region()).not.toHaveAttribute('role');
  });

  it('names every slide with its ICU string and the slide roledescription', () => {
    const { slideNodes, slideLabels } = mount({ count: 3 });
    const names = slideNodes().map((slide) => slide.getAttribute('aria-label'));

    expect(names).toEqual(slideLabels);
    expect(slideLabels[0]).toBe('Recenzia 1 din 3');
    for (const slide of slideNodes()) {
      expect(slide).toHaveAttribute('aria-roledescription', LABELS.slideRole);
    }
  });

  it('puts NO aria-current on a slide (that belongs to a picker)', () => {
    const { slideNodes } = mount();

    for (const slide of slideNodes()) {
      expect(slide).not.toHaveAttribute('aria-current');
    }
  });

  it('keeps the DOM order the law prescribes: prev → next → slides', () => {
    // A keyboard visitor reaches the navigation BEFORE the reviews.
    const { region, stage } = mount();
    const buttons = [...region().querySelectorAll('button')];

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      LABELS.previous,
      LABELS.next,
    ]);
    // …and both of them precede the slides container in the document.
    for (const button of buttons) {
      expect(
        button.compareDocumentPosition(stage()) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});

describe('ReviewsDeck — no rotation control, on the owner’s word (2026-09-12)', () => {
  it('renders NO pause/play button — the only buttons are prev and next', () => {
    // The owner's sentence: "absolutely no pause button". What stands in for
    // it — hover suspends, keyboard entry stops, a hand on the deck stops —
    // is the subject of the describes below.
    const { region } = mount();
    const names = [...region().querySelectorAll('button')].map((button) =>
      button.getAttribute('aria-label'),
    );

    expect(names).toEqual([LABELS.previous, LABELS.next]);
    expect(region().querySelectorAll('button')).toHaveLength(2);
    expect(CODE).not.toMatch(/rotationControl|\bpause:|\bplay:/);
  });

  it('opens the live region polite in the SERVER html', () => {
    // The construction snapshot is idle/not-started, which is exactly what
    // getServerSnapshot freezes — nothing is moving in the static export, so
    // a change announced there would be one somebody asked for.
    const html = renderToStaticMarkup(
      <ReviewsDeck
        slides={DEMO.map((row, index) => ({
          ...row,
          label: label(index, DEMO.length),
        }))}
        labels={LABELS}
        intervalMs={INTERVAL}
        startDelayMs={FIRST_DWELL}
      />,
    );

    expect(html).toContain('aria-live="polite"');
    expect(html.match(/<button/g)).toHaveLength(2);
  });
});

describe('ReviewsDeck — hydration, end to end', () => {
  it('hydrates the server html with no warnings, then starts rotating', async () => {
    // The claim the static export depends on (§16.2): the markup Next writes
    // at build time and the first client render must be IDENTICAL, or React
    // throws the tree away and rebuilds it — which for this deck would mean a
    // visible re-layout of six cards on every page load. It holds because
    // construction is PURE and getServerSnapshot is frozen: both the server
    // store and the browser store answer idle/not-started, so both render the
    // polite live region. Only the mount effect moves it.
    //
    // renderToString (not renderToStaticMarkup) because hydration needs the
    // markers React writes for itself; the console.error spy is the only way
    // to see a hydration warning, since React logs rather than throws.
    const slides = DEMO.map((row, index) => ({
      ...row,
      label: label(index, DEMO.length),
    }));
    const deck = (
      <ReviewsDeck
        slides={slides}
        labels={LABELS}
        intervalMs={INTERVAL}
        startDelayMs={FIRST_DWELL}
        env={quietEnv()}
      />
    );

    const container = document.createElement('div');
    container.innerHTML = renderToString(deck);
    document.body.append(container);
    const errors: string[] = [];
    const spy = vi
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '));
      });
    let root: ReturnType<typeof hydrateRoot> | undefined;

    // try/finally, so a failing assertion can never leave this container in
    // the document for the rest of the file to trip over (CI round 2: one
    // Linux failure here became twenty-four "found multiple regions").
    try {
      const serverStage = container.querySelector('[aria-live]');
      const serverPrev = container.querySelector('button');
      expect(serverStage).toHaveAttribute('aria-live', 'polite');
      expect(serverPrev).toHaveAttribute('aria-label', LABELS.previous);

      await act(async () => {
        root = hydrateRoot(container, deck);
      });

      expect(errors).toEqual([]);
      // The SAME nodes React ADOPTED, now running: the effect started the
      // rotation after mount and nothing was re-created to do it. Asserted
      // through the nodes captured before hydration rather than by
      // re-querying — a replaced tree would have left these detached, still
      // polite, which is exactly the failure this case exists to catch.
      expect(container.contains(serverStage)).toBe(true);
      expect(container.contains(serverPrev)).toBe(true);
      expect(serverStage).toHaveAttribute('aria-live', 'off');
      expect(container.querySelectorAll('button')).toHaveLength(2);
    } finally {
      spy.mockRestore();
      act(() => root?.unmount());
      container.remove();
    }
  });
});

describe('ReviewsDeck — the two-item floor is a COUNT, never a preference', () => {
  it('renders no prev/next for a single review', () => {
    const { region } = mount({ count: 1 });

    expect(region().querySelectorAll('button')).toHaveLength(0);
    expect(region().querySelectorAll('article')).toHaveLength(1);
  });

  it('announces NO carousel at all below the floor (G2 a11y, item E)', () => {
    // One review is one review: a named region and a card. Describing it as a
    // carousel — a roledescription, a slide group, a live region — would
    // announce a widget the visitor cannot operate, because there is nothing
    // to operate.
    const { region } = mount({ count: 1 });

    expect(region()).toHaveAccessibleName(LABELS.region);
    expect(region()).not.toHaveAttribute('aria-roledescription');
    expect(region().querySelectorAll('[role="group"]')).toHaveLength(0);
    expect(region().querySelectorAll('[aria-roledescription]')).toHaveLength(0);
    expect(region().querySelectorAll('[aria-live]')).toHaveLength(0);
  });

  it('puts all of it back at two reviews', () => {
    const { region, stage } = mount({ count: 2 });

    expect(region()).toHaveAttribute('aria-roledescription', LABELS.role);
    expect(region().querySelectorAll('[role="group"]')).toHaveLength(2);
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('renders both buttons from two reviews up', () => {
    const { region } = mount({ count: 2 });

    expect(region().querySelectorAll('button')).toHaveLength(2);
  });

  it('reserves the dropped cards’ room under the stage only when there is a deck to drop (G3 react N3)', () => {
    // A lone review has no neighbours hanging below it; the stage keeps its
    // small bottom padding instead of the fan's drop + stagger room.
    const one = mount({ count: 1 });
    const stageOf = (region: HTMLElement) =>
      (region.querySelector('article') as HTMLElement).closest(
        '.grid.overflow-x-clip',
      ) as HTMLElement;
    const lone = stageOf(one.region()).className.split(/\s+/);
    expect(lone).toContain('pb-2');
    expect(lone.some((token) => token.startsWith('pb-[calc('))).toBe(false);
    one.unmount();

    const { stage } = mount({ count: 3 });
    const deck = stage().className.split(/\s+/);
    expect(deck).not.toContain('pb-2');
    expect(deck.some((token) => token.startsWith('pb-[calc('))).toBe(true);
  });
});

describe('ReviewsDeck — the slides, and which one is the visitor’s', () => {
  it('inerts every slide but the selected one — and keeps EVERY slide in the layout', () => {
    // `inert` removes a slide from the accessibility tree AND from the Tab
    // order; `aria-hidden` is the belt for engines that predate it
    // (Safari/iOS < 15.5). NOTHING is `hidden`: the far slides stay laid out
    // at their offsets so the tallest card sets the stage's height at every
    // position of the ring (owner 2026-09-12 — "consistent throughout"; the
    // first spelling hid |offset| > 2 and the stage breathed as it turned).
    const { slideNodes, offsetOf, selected } = mount();

    expect(selected()).not.toHaveAttribute('inert');
    expect(selected()).not.toHaveAttribute('aria-hidden');

    for (const slide of slideNodes()) {
      expect(slide).not.toHaveAttribute('hidden');
      if (offsetOf(slide) === 0) continue;
      expect(slide).toHaveAttribute('inert');
      expect(slide).toHaveAttribute('aria-hidden', 'true');
    }
    // Six slides: 0, ±1, ±2 and exactly one far one (+3) — still rendered.
    expect(
      slideNodes().filter((slide) => Math.abs(offsetOf(slide)) > 2),
    ).toHaveLength(1);
    expect(slideNodes()).toHaveLength(6);
    // The attribute, not `aria-hidden` (which every inert slide wears).
    expect(CODE).not.toMatch(/\shidden=/);
  });

  it('fans the slides by SIGNED offset — the neighbours sit either side', () => {
    const { slideNodes, offsetOf } = mount({ count: 5 });

    expect(slideNodes().map(offsetOf)).toEqual([0, 1, 2, -2, -1]);
  });

  it('dresses the selected slide emphasized and every other one framed', () => {
    const { slideNodes, offsetOf } = mount({ count: 3 });

    for (const slide of slideNodes()) {
      const card = slide.querySelector('article') as HTMLElement;
      const classes = card.getAttribute('class') ?? '';
      if (offsetOf(slide) === 0) {
        expect(classes).toContain(EMPHASIZED_FILL);
      } else {
        // `bg-surface` is on BOTH rows (the atom's opaque fallback), so the
        // framed card is identified by its 3px frame and by the ABSENCE of
        // the tint ground — never by a base it now shares.
        expect(classes).toContain('border-[3px]');
        expect(classes).not.toContain(EMPHASIZED_FILL);
      }
    }
  });

  it('sizes every slide as the stage’s share and stacks them in ONE cell', () => {
    // The geometry is measured in the stories; the WIRING is pinned here: the
    // width is the stage's `--deck-card` dial, every slide sits in the same
    // grid cell, and the stage carries the full-bleed margins and the dials.
    const { slideNodes, stage } = mount({ count: 3 });

    for (const slide of slideNodes()) {
      const tokens = (slide.getAttribute('class') ?? '').split(/\s+/);
      expect(tokens).toContain('w-(--deck-card)');
      expect(tokens).toContain('col-start-1');
      expect(tokens).toContain('row-start-1');
      expect(tokens).toContain('justify-self-center');
    }
    const stageTokens = (stage().getAttribute('class') ?? '').split(/\s+/);
    expect(stageTokens).toContain('mx-[calc(50%_-_50vw)]');
    expect(stageTokens).toContain('[--deck-card:clamp(14rem,66%,8%_+_20rem)]');
    expect(stageTokens).toContain('[--fan-step:87%]');
    expect(stageTokens).toContain('overflow-x-clip');
  });
});

describe('ReviewsDeck — hand navigation, and the morph it performs', () => {
  it('moves the selection with next and prev, wrapping both ways', async () => {
    const user = testingUser.setup();
    const { next, prev, selected, slides } = mount({ count: 3 });

    expect(selected()).toHaveAccessibleName('Recenzia 1 din 3');

    await user.click(next());
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 3');

    await user.click(prev());
    await user.click(prev());
    // Wrapped past the start onto the last review.
    expect(selected()).toHaveAccessibleName(
      `Recenzia ${slides.length} din ${slides.length}`,
    );
  });

  it('lands a WRAPPING slide instantly instead of sweeping the stage', () => {
    // Not remounting has a price at small counts: with three reviews an
    // advance sends one card from −1 to +1, i.e. across the whole stage, and a
    // 500ms transition would drag it through the fan on every tick. A slide
    // whose offset changed by more than ONE step is therefore rendered with
    // `transition-none` for that render — and compared as exact class TOKENS,
    // because every slide also carries `motion-reduce:transition-none` and a
    // substring test would pass for all of them.
    const { next, slideNodes } = mount({ count: 3 });
    const lands = (slide: HTMLElement): boolean =>
      slide.className.split(/\s+/).includes('transition-none');

    // Nothing has moved yet: no slide is suppressed on the first render.
    expect(slideNodes().map(lands)).toEqual([false, false, false]);

    fireEvent.click(next());

    // Offsets went 0,1,−1 → −1,0,1: the third slide wrapped, the others
    // stepped and keep travelling on the deck's own clock.
    expect(
      slideNodes().map((slide) =>
        Number(slide.style.getPropertyValue('--offset')),
      ),
    ).toEqual([-1, 0, 1]);
    expect(slideNodes().map(lands)).toEqual([false, false, true]);

    // …and the flags last until the next MOVE, per slide: the next advance
    // leaves that card stepping again (−1 → 0) and hands the jump to
    // whichever card is now at the far edge (offsets −1,0,1 → 1,−1,0).
    fireEvent.click(next());
    expect(slideNodes().map(lands)).toEqual([true, false, false]);
  });

  it('MORPHS the cards instead of remounting them (ledger D1)', async () => {
    // The pitfall the owner named: the selected card must not be built anew,
    // or the photograph reloads and the text re-renders under the reader. One
    // <div role="group"> moves by CSS and ONE attribute changes on the
    // card inside it — so both articles are the SAME NODES afterwards, each
    // wearing the other's tone.
    const user = testingUser.setup();
    const { next, slideNodes } = mount({ count: 3 });
    const [first, second] = slideNodes();
    const firstCard = first.querySelector('article');
    const secondCard = second.querySelector('article');
    const firstDisc = first.querySelector('article > div > span');

    await user.click(next());

    expect(first.querySelector('article')).toBe(firstCard);
    expect(second.querySelector('article')).toBe(secondCard);
    // …the avatar disc, the one element a remount would have rebuilt (and
    // whose <img> would have re-requested), is the same node too.
    expect(first.querySelector('article > div > span')).toBe(firstDisc);
    // …and the tones have swapped on those very nodes.
    expect(firstCard?.getAttribute('class')).toContain('border-[3px]');
    expect(firstCard?.getAttribute('class')).not.toContain(EMPHASIZED_FILL);
    expect(secondCard?.getAttribute('class')).toContain(EMPHASIZED_FILL);
  });
});

describe('ReviewsDeck — a hand on the deck STOPS it (SC 2.2.2 without a button)', () => {
  it('ends the automatic rotation for good on next — polite, and still polite after the pointer leaves', async () => {
    // The touch-reachable stop (the header's NO ROTATION CONTROL paragraph):
    // the first tap on a button steps AND calls the sticky pause(). A pointer
    // leaving afterwards resumes nothing — resume() only lifts a SUSPENSION,
    // and this is a stop.
    const user = testingUser.setup();
    const { next, stage, selected } = mount();

    expect(stage()).toHaveAttribute('aria-live', 'off');

    await user.click(next());

    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    await user.unhover(next());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('…and on prev, with no browser in the loop', () => {
    // A bare click event — no focus, no pointer — so what is under test is
    // the `stepThenStop` wiring alone.
    const { prev, stage, selected, slides } = mount();

    fireEvent.click(prev());

    expect(selected()).toHaveAccessibleName(
      `Recenzia ${slides.length} din ${slides.length}`,
    );
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('still navigates by hand under reduced motion, where the deck never ran', async () => {
    // The preference declines the AUTOMATIC start; the buttons are a
    // different statement and keep working (pause() on an idle ring is a
    // no-op — there is nothing to stop).
    const user = testingUser.setup();
    const { next, stage, selected } = mount({ reduced: true });

    expect(stage()).toHaveAttribute('aria-live', 'polite');

    await user.click(next());

    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ReviewsDeck — the hover area is the region', () => {
  it('suspends while the pointer is over a slide and resumes when it leaves', async () => {
    // Proof that React's onPointerEnter/Leave fire by DOM ANCESTRY: the
    // handlers sit on the region, and the pointer never touches the region's
    // own edge — it touches a slide inside it.
    const user = testingUser.setup();
    const { stage, selected } = mount();

    expect(stage()).toHaveAttribute('aria-live', 'off');

    await user.hover(selected());
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    await user.unhover(selected());
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('suspends for a pointer resting in the region’s OWN space — the gap', async () => {
    // The region is a real grid box (stage, gap, buttons), so the row gap
    // between the stage and the buttons suspends too: a visitor whose pointer
    // rests there, reading, is not moved on.
    const user = testingUser.setup();
    const { stage, region } = mount();

    await user.hover(region());

    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('suspends over the buttons as well — nothing is excluded from the area now', async () => {
    // With no rotation control there is nothing the APG asks to keep out of
    // the hover area; prev and next are inside it, like the old deck's were.
    const user = testingUser.setup();
    const { stage, prev } = mount();

    await user.hover(prev());
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    await user.unhover(prev());
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });
});

describe('ReviewsDeck — focus, and why it is not just another suspension', () => {
  it('STOPS the rotation when keyboard focus enters (a real Tab)', async () => {
    // The APG sentence: "stops rotating when keyboard focus enters; does not
    // restart unless the user explicitly requests it". Only a trusted Tab sets
    // Chromium's keyboard modality, which is what :focus-visible reports and
    // classifyFocusEntry() reads — hence the Playwright-driven user here.
    const { prev, stage, before } = mount({ neighbours: true });

    await realUser.click(before());
    await realUser.tab();

    expect(document.activeElement).toBe(prev());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('Tab WITHIN the region moves on to "next" and the deck stays stopped', async () => {
    // focusin BUBBLES, so every Tab inside the region fires the region's
    // onFocus again; the 'within' classification keeps that from being read
    // as a fresh entry. With no play button there is nothing a second entry
    // could undo — the deck is stopped, and stopped it stays.
    const { prev, next, stage, before } = mount({ neighbours: true });

    await realUser.click(before());
    await realUser.tab(); // …into the region: sticky pause
    expect(document.activeElement).toBe(prev());
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    await realUser.tab(); // …to "next", still inside the region
    expect(document.activeElement).toBe(next());
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });

  it('suspends TRANSIENTLY for a pointer-initiated focus, and resumes on leaving', () => {
    // A mouse press focuses a button in Chrome and Firefox without making it
    // :focus-visible — so it must not stop the rotation for good. Dispatched
    // rather than driven: an unfocused target is exactly what "not
    // focus-visible" looks like, which is the classification under test.
    const { region, stage, before } = mount({ neighbours: true });
    // Running BEFORE the focus arrives — a resting pointer would make the
    // "polite" below true for the wrong reason; the parking `beforeEach` is
    // what makes this a claim about the focus.
    expect(stage()).toHaveAttribute('aria-live', 'off');

    act(() => {
      region().dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, relatedTarget: null }),
      );
    });
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    act(() => {
      region().dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: before() }),
      );
    });
    // …and it WAS transient: the rotation runs again.
    expect(stage()).toHaveAttribute('aria-live', 'off');
  });

  it('ignores a focusout that never leaves the region', () => {
    const { region, stage, prev, next } = mount();

    act(() => {
      region().dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, relatedTarget: null }),
      );
    });
    expect(stage()).toHaveAttribute('aria-live', 'polite');

    act(() => {
      prev().dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: next() }),
      );
    });
    // Still suspended: a move between the region's own controls is not an exit.
    expect(stage()).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ReviewsDeck — the rhythm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits out the FIRST DWELL before the first automatic move', () => {
    const { selected } = mount({ intervalMs: 5_000, startDelayMs: 15_000 });

    act(() => vi.advanceTimersByTime(14_999));
    expect(selected()).toHaveAccessibleName('Recenzia 1 din 6');

    act(() => vi.advanceTimersByTime(1));
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');
  });

  it('then keeps the interval between automatic moves', () => {
    const { selected } = mount({ intervalMs: 5_000, startDelayMs: 15_000 });

    act(() => vi.advanceTimersByTime(15_000));
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');

    act(() => vi.advanceTimersByTime(4_999));
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');

    act(() => vi.advanceTimersByTime(1));
    expect(selected()).toHaveAccessibleName('Recenzia 3 din 6');
  });

  it('never moves on its own again after a hand navigation', () => {
    // fireEvent rather than user-event: @testing-library/user-event schedules
    // its own delays, which fake timers would have to be taught to advance —
    // and the claim here is about the ring's clock, not about input. The old
    // countdown had 1 000 ms left on it; the visitor's tap does not buy a
    // fresh interval, it ends the automatic rotation (the header's NO
    // ROTATION CONTROL paragraph).
    const { next, selected } = mount({
      intervalMs: 5_000,
      startDelayMs: 15_000,
    });

    act(() => vi.advanceTimersByTime(14_000));
    fireEvent.click(next());
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');

    act(() => vi.advanceTimersByTime(60_000));
    expect(selected()).toHaveAccessibleName('Recenzia 2 din 6');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no timer behind when the deck unmounts', () => {
    const { unmount } = mount({ intervalMs: 5_000, startDelayMs: 15_000 });

    unmount();

    // Nothing is left to fire — a rotation that outlived its markup would be
    // setState-on-an-unmounted-tree every 5 seconds, forever.
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('ReviewsDeck — the island contract', () => {
  it('IS the island: the directive is on line 1 (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts). No runtime assertion can see a directive,
    // and this file is the ONE in the band's folder that must carry it.
    expect(source.split('\n')[0]).toBe("'use client';");
    expect(CODE).toMatch(/^\s*['"]use client['"]\s*;?\s*$/m);
  });

  it('calls no t() and holds no message key — every label is a prop (§8.1)', () => {
    // A client island only ever receives the PAGE locale's messages; the band
    // resolves every string on the server and hands them over finished.
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b/);
    expect(CODE).not.toMatch(/home\.reviews\.|common\.carousel\./);
  });
});
