import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  createRef,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline, for the
// measured blocks — a card's width and a caption's padding are computed boxes,
// which a class name cannot show. tests/setup/components.ts loads no CSS
// globally; the per-file import is the house pattern (Card, Container,
// ClinicLocation, DoctorShowcase). The other blocks read the DOM and the
// tokens, which do not depend on it.
import '@/styles/globals.css';
import carouselSource from '@/components/sections/CardCarousel/CardCarousel.tsx?raw';
import demoSource from '@/components/sections/CardCarousel/CardCarousel.stories.tsx?raw';
import {
  CARD_CAROUSEL_FIRST_DWELL_MS,
  type CardCarouselLabels,
  type CardCarouselProps,
} from '@/components/sections/CardCarousel/CardCarousel';
// A TEST reads the carousel's geometry to re-derive the picture hint; the
// gallery itself composes only CardCarousel's public component (§4).
import { ARRANGEMENTS } from '@/components/sections/CardCarousel/conveyor';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import type { ClockEnv } from '@/lib/clock/clock';
// next.config's text: the config runs only in Node, so this browser runner
// reads its `deviceSizes` out of the source (tests/unit/blog-data.test.ts's
// way) — THE `sizes`, DERIVED, below.
import nextConfigSource from '../../../../next.config.ts?raw';
import { GalleryCard } from './GalleryCard';
import cardSource from './GalleryCard.tsx?raw';
import {
  PostGallery,
  type GalleryCard as ReExportedCard,
  type PostGalleryProps,
} from './PostGallery';
import { GALLERY_CARDS } from './PostGallery.fixtures';
import source from './PostGallery.tsx?raw';

// sections/PostGallery — the blog article's photo gallery: GalleryCards on
// sections/CardCarousel's line, always its THREE-card window (PostGallery.tsx's
// THREE CARDS, ALWAYS). Role-based queries where the tree has the role (§9,
// §13); the carousel's side cards are `inert` previews, out of the
// accessibility tree, so what every card holds is read off the DOM. Fixtures
// are Romanian with diacritics (§15.7): the owner's eight gallery photographs
// under the captions and alts sections/CardCarousel's stories give them
// (PostGallery.fixtures.ts's GALLERY_CARDS), and the page's words (ro.json's
// `blog.article.gallery`, `common.carousel`).

/** The runner's root, which every rem here is written at. */
const ROOT = 16;

/** The eight cards — the owner's "8 instances" (2026-10-16). */
const CARDS = GALLERY_CARDS;

/** The card with the widest word the articles ship, „Instrumentele". */
const LONGEST: GalleryCard = (() => {
  const card = CARDS.find(({ caption }) => caption.startsWith('Instrumentele'));
  if (card === undefined) {
    throw new Error('the fixtures lost „Instrumentele de lucru"');
  }
  return card;
})();

const LABELS: CardCarouselLabels = {
  region: 'Galerie foto',
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Fotografia anterioară',
  next: 'Fotografia următoare',
  picker: 'Alege fotografia',
};

/** „Fotografia 1 din 8" … — the finished names the page hands over. */
const slideLabelsFor = (count: number): string[] =>
  Array.from(
    { length: count },
    (_, index) => `Fotografia ${index + 1} din ${count}`,
  );

/** A complete set of props, with any of them replaced. */
const props = (
  overrides: Partial<PostGalleryProps> = {},
): PostGalleryProps => ({
  cards: CARDS,
  mode: 'loop',
  labels: LABELS,
  slideLabels: slideLabelsFor(CARDS.length),
  ...overrides,
});

const region = (): HTMLElement =>
  screen.getByRole('region', { name: LABELS.region });

/** The stage: every card box's parent, and the carousel's live region. */
function stageOf(root: HTMLElement): HTMLElement {
  const stage = root.querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) throw new Error('no stage');
  return stage;
}

/** Every card box, in the list's order. */
const cardBoxes = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll('[role="group"][aria-roledescription]')].filter(
    (box): box is HTMLElement => box instanceof HTMLElement,
  );

/** The card at the centre: the one box that is not inert. */
function centreOf(root: HTMLElement): HTMLElement {
  const centre = cardBoxes(root).find((box) => !box.hasAttribute('inert'));
  if (centre === undefined) throw new Error('no centre card');
  return centre;
}

/** The beads' group, named by the page's `picker` word. */
const beadsOf = (root: HTMLElement): HTMLElement =>
  within(root).getByRole('group', { name: LABELS.picker });

const tokens = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const sorted = (list: readonly string[]): string[] => [...new Set(list)].sort();

/** The picture hint every card of a rendered gallery carries. */
function sizesOf(root: HTMLElement): string {
  const hints = [...root.querySelectorAll('img')].map((img) =>
    img.getAttribute('sizes'),
  );
  expect(new Set(hints).size).toBe(1);
  const [hint] = hints;
  if (!hint) throw new Error('a gallery card carries no `sizes`');
  return hint;
}

/** `a` comes before `b` in the document. */
const precedes = (a: Node, b: Node): boolean =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe('PostGallery — the composition', () => {
  it('is CardCarousel’s region, named and described by the page’s words — its two arrows visible, transparent and as tall as the cards, named by the page’s words', () => {
    render(<PostGallery {...props()} />);

    expect(region().tagName).toBe('SECTION');
    expect(region()).toHaveAttribute('aria-roledescription', LABELS.role);
    const previous = within(region()).getByRole('button', {
      name: LABELS.previous,
    });
    const next = within(region()).getByRole('button', { name: LABELS.next });
    // CardCarousel's THE ARROWS (2026-10-17): ALWAYS VISIBLE, a tall chevron
    // on NO ground — nothing painted on the button's own box — in a strip
    // nine theme steps wide and as tall as the cards (the centre card's box),
    // in the tree and the Tab order.
    const cardHeight = parseFloat(getComputedStyle(centreOf(region())).height);
    for (const control of [previous, next]) {
      const name = control.getAttribute('aria-label') ?? '';
      expect(control, name).toBeVisible();
      const style = getComputedStyle(control);
      expect(style.backgroundColor, name).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth, name).toBe('0px');
      expect(style.borderLeftWidth, name).toBe('0px');
      const box = control.getBoundingClientRect();
      expect(box.width, name).toBeCloseTo(2.25 * ROOT, 1);
      expect(box.height, name).toBeCloseTo(cardHeight, 0);
      expect(control).not.toHaveAttribute('tabindex', '-1');
      expect(control).not.toHaveAttribute('aria-hidden');
    }
  });

  it('puts the controls FIRST in the DOM — previous, next, the beads — then the cards; the beads one per card, named as their cards, the centred one current', () => {
    render(<PostGallery {...props()} />);

    // The region's only buttons, in this order: the two arrows, then one bead
    // per card, each named by its card's own label.
    const buttons = within(region()).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      LABELS.previous,
      LABELS.next,
      ...slideLabelsFor(CARDS.length),
    ]);
    const beads = beadsOf(region());
    expect(
      within(beads)
        .getAllByRole('button')
        .map((bead) => bead.getAttribute('aria-label')),
    ).toEqual(slideLabelsFor(CARDS.length));
    // Exactly one bead current, and it is the centred card's.
    const current = within(beads)
      .getAllByRole('button')
      .filter((bead) => bead.getAttribute('aria-current') === 'true');
    expect(current.map((bead) => bead.getAttribute('aria-label'))).toEqual([
      centreOf(region()).getAttribute('aria-label'),
    ]);
    // DOM ORDER: previous, next, the beads, then every card.
    const next = within(region()).getByRole('button', { name: LABELS.next });
    const previous = within(region()).getByRole('button', {
      name: LABELS.previous,
    });
    expect(precedes(previous, next)).toBe(true);
    expect(precedes(next, beads)).toBe(true);
    const boxes = cardBoxes(region());
    expect(boxes).toHaveLength(CARDS.length);
    for (const box of boxes) expect(precedes(beads, box)).toBe(true);
  });

  it('draws the beads UNDER the cards — below the stage and its room, never over a card', () => {
    render(<PostGallery {...props()} />);

    const stage = stageOf(region()).getBoundingClientRect();
    for (const bead of within(beadsOf(region())).getAllByRole('button')) {
      const box = bead.getBoundingClientRect();
      expect(box.top, bead.getAttribute('aria-label') ?? '').toBeGreaterThan(
        stage.bottom - 0.5,
      );
    }
  });

  it('takes a bead press to its card — it comes to the centre, its bead current — and the movement stops for good (OPTION 1)', () => {
    render(<PostGallery {...props()} />);

    const [, , third] = slideLabelsFor(CARDS.length);
    fireEvent.click(
      within(beadsOf(region())).getByRole('button', { name: third }),
    );
    expect(centreOf(region())).toHaveAttribute('aria-label', third);
    expect(
      within(beadsOf(region())).getByRole('button', { name: third }),
    ).toHaveAttribute('aria-current', 'true');
    // Stopped for good: the live region speaks again (lib/rotation's
    // liveRegion is 'off' only while the ring moves by itself).
    expect(stageOf(region())).toHaveAttribute('aria-live', 'polite');
  });

  it('draws every card as a GalleryCard, in order — the photo, its alt, its caption', () => {
    render(<PostGallery {...props()} />);

    const figures = [...region().querySelectorAll('figure')];
    expect(figures).toHaveLength(CARDS.length);
    figures.forEach((figure, index) => {
      const card = CARDS[index];
      expect(figure.querySelector('figcaption')?.textContent).toBe(
        card?.caption,
      );
      expect(figure.querySelector('img')).toHaveAttribute(
        'alt',
        card?.image.alt,
      );
    });
  });

  it('names each card by the page’s label, in order, with the slide’s roledescription', () => {
    render(<PostGallery {...props()} />);

    const groups = cardBoxes(region());
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(
      slideLabelsFor(CARDS.length),
    );
    for (const group of groups) {
      expect(group).toHaveAttribute('aria-roledescription', LABELS.slideRole);
    }
  });

  it('passes `mode` through: a loop wraps — both arrows live on its first card — a bounded list has ends: previous dead on its first card, next live', () => {
    const { unmount } = render(<PostGallery {...props({ mode: 'loop' })} />);
    expect(
      within(region()).getByRole('button', { name: LABELS.previous }),
    ).toBeEnabled();
    unmount();

    render(<PostGallery {...props({ mode: 'bounded' })} />);
    expect(
      within(region()).getByRole('button', { name: LABELS.previous }),
    ).toBeDisabled();
    expect(
      within(region()).getByRole('button', { name: LABELS.next }),
    ).toBeEnabled();
  });

  it('runs BOTH modes on the carousel’s own clock — the bounded list moves by itself too, since 2026-10-16', () => {
    // A ring that moves by itself silences its live region (lib/rotation's
    // liveRegion); lib/clock declines the automatic start under reduced
    // motion, and then it stays polite — in both modes alike.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const mode of ['loop', 'bounded'] as const) {
      const { unmount } = render(<PostGallery {...props({ mode })} />);
      expect(stageOf(region()), mode).toHaveAttribute(
        'aria-live',
        still ? 'polite' : 'off',
      );
      unmount();
    }
  });

  it.each([
    ['as the gallery gives it', {}],
    // A caller smuggling a five-card window past the types (a cast): the
    // gallery strips it from its spread and sets its own window AFTER it, so
    // the smuggled one never lands. (A smuggled cap has no case here: the
    // island's cap has one value, so no value could fail — the fixed width is
    // THE STRIP's case below, and so is the inline style that would lift the
    // cap.)
    [
      'with a five-card window smuggled past the types',
      { visible: 5 } as unknown as Partial<PostGalleryProps>,
    ],
  ] as const)(
    'shows THREE cards, ALWAYS, under the 20rem cap — in a 64rem frame, %s',
    (_how, smuggled) => {
      // A 1024px frame: wide enough for the five-card window (its switch is a
      // 705.5px column: five 288.5px cards there), and one whose share would
      // draw a three-card card 584.4px wide — so the 20rem card below is the
      // cap's, and the gallery draws no five-card window.
      render(
        <div style={{ width: `${64 * ROOT}px` }}>
          <PostGallery {...props()} {...smuggled} />
        </div>,
      );

      const card = parseFloat(getComputedStyle(centreOf(region())).width);
      expect(card).toBeCloseTo(20 * ROOT, 1);
      // The three-card stage: its three cards' window and an arrow's strip at
      // each side, taken from the frame's margin (CardCarousel's THE BARS'
      // ROOM), centred in the frame.
      const stage = parseFloat(getComputedStyle(stageOf(region())).width);
      expect(stage).toBeCloseTo(
        20 * ROOT * ARRANGEMENTS[3].ratio + 2 * 2.25 * ROOT,
        1,
      );
      // No window, no cap and no kind ride onto the <section>.
      for (const name of ['visible', 'cardcap', 'cardCap', 'mode']) {
        expect(region()).not.toHaveAttribute(name);
      }
      // The one three-card hint (THE `sizes`, DERIVED).
      expect(sizesOf(region())).toContain(' 24vw');
    },
  );

  it('renders nothing for no cards', () => {
    const { container } = render(
      <PostGallery {...props({ cards: [], slideLabels: [] })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('refuses labels that do not match the cards — CardCarousel’s RangeError, on the render `next build` runs', () => {
    const build = () =>
      renderToStaticMarkup(
        <PostGallery {...props({ slideLabels: slideLabelsFor(3) })} />,
      );

    expect(build).toThrow(RangeError);
    expect(build).toThrow('8 cards but 3 labels');
  });
});

/** The island's OWN props: every key of CardCarousel's props that is not a
 *  native <section> prop — the keys PostGallery.tsx's WITHHELD must account
 *  for, one by one. */
type IslandOwn = Exclude<
  keyof CardCarouselProps,
  keyof ComponentPropsWithRef<'section'>
>;

describe('PostGallery — the native <section> surface', () => {
  it('passes native props to the region and merges className last, for placement', () => {
    // `mt-8`, a class the site already ships: Tailwind turns every class-like
    // word in a scanned file into a rule, tests included.
    render(
      <PostGallery
        {...props()}
        id="galerie"
        data-slot="galerie"
        className="mt-8"
      />,
    );

    expect(region()).toHaveAttribute('id', 'galerie');
    expect(region()).toHaveAttribute('data-slot', 'galerie');
    expect(tokens(region()).at(-1)).toBe('mt-8');
  });

  it('keeps the region’s own name when a caller smuggles one past the type', () => {
    // A hyphenated JSX attribute escapes TypeScript's excess-property check;
    // the island sets the name after the spread, and the gallery spreads first.
    render(<PostGallery {...props()} aria-label="Altceva" />);

    expect(region()).toHaveAttribute('aria-label', LABELS.region);
  });

  it('hands a ref to the region itself (React 19: ref as a prop)', () => {
    const ref = createRef<HTMLElement>();
    render(<PostGallery {...props()} ref={ref} />);

    expect(ref.current).toBe(region());
  });

  it('types the cards as GalleryCards and drops the placeholder’s props and every key it withholds — the island’s own and `style` (THE STRIP) — and holds that list COMPLETE', () => {
    expectTypeOf<ReExportedCard>().toEqualTypeOf<GalleryCard>();
    expectTypeOf<PostGalleryProps['cards']>().toEqualTypeOf<
      readonly GalleryCard[]
    >();
    expectTypeOf<
      PostGalleryProps['labels']
    >().toEqualTypeOf<CardCarouselLabels>();
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('label');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('slides');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('children');
    // The window and the cap it fixes, and the card size it never passes…
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('visible');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('cardCap');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('cardWidth');
    // …nor the flat row (CardCarousel's THE FLAT ROW, 2026-10-25): the
    // article's galleries stand on the line at every width — the row is the
    // Home band's.
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('flatFrom');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('cardHeight');
    // …no clock option…
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('intervalMs');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('startDelayMs');
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('env');
    // …and no inline style, whose custom properties would outrank the cap.
    expectTypeOf<PostGalleryProps>().not.toHaveProperty('style');
    // THE LIST IS COMPLETE (PostGallery.tsx's WITHHELD), both ways. Of the
    // island's OWN props — its props less the native <section> surface — the
    // gallery names exactly three and withholds every other: a prop
    // CardCarousel gains turns this red until it is withheld or named, where
    // the pins above, one per key, would let it through as a gallery prop.
    expectTypeOf<Extract<keyof PostGalleryProps, IslandOwn>>().toEqualTypeOf<
      'mode' | 'labels' | 'slideLabels'
    >();
    // And of the native surface it withholds `style` alone.
    expectTypeOf<
      Exclude<
        Exclude<keyof CardCarouselProps, IslandOwn>,
        keyof PostGalleryProps
      >
    >().toEqualTypeOf<'style'>();
  });
});

describe('PostGallery — THE STRIP: a wider spread hands the island nothing the gallery withholds', () => {
  // TypeScript checks a spread of a NON-FRESH object in JSX for no key it
  // does not know, so every object below compiles beside the gallery's own
  // props. Without THE STRIP (PostGallery.tsx) each key reaches the island:
  // every case here turns red when the gallery spreads `native`, the rest of
  // its props, unstripped.

  /** The gallery in a 64rem frame — whose share would draw a three-card card
   *  584.4px wide, so a 20rem card is the cap's — with `smuggled` spread
   *  after its own props. */
  const renderSmuggling = (smuggled: object) =>
    render(
      <div style={{ width: `${64 * ROOT}px` }}>
        <PostGallery {...props()} {...smuggled} />
      </div>,
    );

  /** The centre card's drawn width. */
  const centreWidth = (): number =>
    parseFloat(getComputedStyle(centreOf(region())).width);

  it('a clock — its rhythm, its first dwell and its environment: the island keeps its own', () => {
    // Two readings, one per smuggled number. FIVE BEATS of the smuggled clock,
    // well inside the island's own first dwell: a smuggled first dwell would
    // have moved the ring by then, the island's own cannot. Then the island's
    // own first dwell, once over: its ring stands on the SECOND card, where a
    // smuggled 60 ms rhythm would have walked it to the seventh. Under
    // reduced motion lib/clock declines the automatic start, so the first
    // card stays centred throughout (the case above reads it the same way).
    // And the smuggled environment, which says the motion is welcome, would
    // be asked at once.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const beats = 5 * 60;
    expect(beats).toBeLessThan(CARD_CAROUSEL_FIRST_DWELL_MS);
    vi.useFakeTimers();
    try {
      let asked = 0;
      const env: ClockEnv = {
        prefersReducedMotion: () => {
          asked += 1;
          return false;
        },
        watchReducedMotion: () => {
          asked += 1;
          return () => {};
        },
        isHidden: () => {
          asked += 1;
          return false;
        },
        watchVisibility: () => {
          asked += 1;
          return () => {};
        },
      };
      renderSmuggling({ intervalMs: 60, startDelayMs: 60, env });
      const [first, second] = slideLabelsFor(CARDS.length);

      act(() => vi.advanceTimersByTime(beats));
      expect(
        centreOf(region()),
        'inside the island’s own first dwell',
      ).toHaveAttribute('aria-label', first);

      act(() => vi.advanceTimersByTime(CARD_CAROUSEL_FIRST_DWELL_MS));
      expect(
        centreOf(region()),
        'once the island’s own first dwell is over',
      ).toHaveAttribute('aria-label', still ? first : second);

      expect(asked, 'the smuggled environment was asked').toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a fixed card width — no RangeError beside the gallery’s cap, no fixed width on the root: the card still 20rem', () => {
    renderSmuggling({ cardWidth: '10rem' });

    expect(region().style.getPropertyValue('--card-fixed')).toBe('');
    expect(centreWidth()).toBeCloseTo(20 * ROOT, 1);
  });

  it('a flat row — no RangeError beside the gallery’s cap, no card posed in a row: the card still 20rem (the G2 typescript review, 2026-10-26)', () => {
    // Reaching the island beside the cap, `flatFrom` meets its "without
    // `cardWidth`" RangeError and the gallery throws; stripped, the island
    // never hears of it, and no card carries the row's per-card pose.
    renderSmuggling({ flatFrom: 'tablet' });

    for (const box of cardBoxes(region())) {
      expect(
        box.style.getPropertyValue('--ftx'),
        box.getAttribute('aria-label') ?? '',
      ).toBe('');
    }
    expect(centreWidth()).toBeCloseTo(20 * ROOT, 1);
  });

  it('a height for the cards — none stretched to the tallest card: each keeps its own', () => {
    renderSmuggling({ cardHeight: 'tallest' });

    const boxes = cardBoxes(region());
    expect(boxes).toHaveLength(CARDS.length);
    for (const box of boxes) {
      expect(
        getComputedStyle(box).alignSelf,
        box.getAttribute('aria-label') ?? '',
      ).not.toBe('stretch');
    }
  });

  it('a style — no inline custom property lifts the cap: the card still 20rem', () => {
    renderSmuggling({ style: { '--cap': '100cqw' } });

    expect(region().style.getPropertyValue('--cap')).toBe('');
    expect(centreWidth()).toBeCloseTo(20 * ROOT, 1);
  });
});

describe('PostGallery — a dumb Server Component composing a section (§4, §16)', () => {
  /** Every module specifier a source imports or re-exports from. */
  const specifiers = (text: string): string[] =>
    [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '');

  it('carries no directive and reads no words of its own, in either file', () => {
    for (const text of [source, cardSource]) {
      expect(text).not.toMatch(/^\s*['"]use client['"]/m);
      expect(text).not.toMatch(/from ['"]next-intl/);
      expect(text).not.toMatch(/\buse[A-Z]\w*\(/);
    }
  });

  it('composes CardCarousel’s PUBLIC component and its own card — never the island’s internals', () => {
    expect(sorted(specifiers(source))).toEqual([
      './GalleryCard',
      '@/components/sections/CardCarousel/CardCarousel',
      'react',
    ]);
    expect(sorted(specifiers(cardSource))).toEqual([
      '@/components/ui/Image/Image',
      '@/lib/image-path/image-path',
      'react',
    ]);
  });

  /** The one <CardCarousel … /> the gallery mounts, as written, its `//`
   *  comments dropped — so no word of a comment is read as a prop. */
  function mountOf(text: string): string {
    const mounts = text.match(/<CardCarousel\b[\s\S]*?\/>/g) ?? [];
    expect(mounts, 'the gallery mounts ONE carousel').toHaveLength(1);
    return (mounts[0] ?? '').replace(/\/\/[^\n]*/g, '');
  }

  it('mounts the carousel with THE STRIP’s copy spread FIRST, its window and its cap fixed AFTER it — three cards, capped', () => {
    expect(mountOf(source)).toMatch(
      /^<CardCarousel\s+\{\.\.\.native\}[\s\S]*?visible=\{3\}\s+cardCap="capped"/,
    );
  });

  it('passes the island no clock option and no card size — the six props it names, and nothing else (the header’s ITS PROPS)', () => {
    // Every attribute name as JSX writes it, a hyphenated one included (a
    // data or an aria attribute), so no name escapes the count.
    const named = [...mountOf(source).matchAll(/\s([\w-]+)=/g)].map(
      ([, name]) => name,
    );

    expect(named).toEqual([
      'slides',
      'slideLabels',
      'visible',
      'cardCap',
      'labels',
      'mode',
    ]);
    for (const option of [
      'intervalMs',
      'startDelayMs',
      'env',
      'cardWidth',
      'cardHeight',
      'flatFrom',
    ]) {
      expect(named, option).not.toContain(option);
    }
  });
});

// ── THE CARD: the stories' demo card made real. KEEP IN SYNC with
// sections/CardCarousel's `PhotoCard` (CardCarousel.stories.tsx): its recipe
// is read from that file's source, and the card must wear it — the four
// choices GalleryCard.tsx's header names on both, token for token.

/** The demo card's source: the `PhotoCard` function, and its CAPTION. */
const demoCard = /function PhotoCard\([\s\S]*?\n\}\n/.exec(demoSource)?.[0];
const demoCaption = /const CAPTION =\s*'([^']+)';/.exec(demoSource)?.[1];

/** One string captured from the demo, or a failure naming what is missing. */
function fromDemo(pattern: RegExp, what: string): string {
  if (demoCard === undefined) {
    throw new Error('CardCarousel.stories.tsx has no `PhotoCard` function');
  }
  const found = pattern.exec(demoCard)?.[1];
  if (found === undefined) {
    throw new Error(`the demo card’s ${what} was not found`);
  }
  return found;
}

/** The fade above the caption's words, as the demo spells it and as the
 *  gallery card does (GalleryCard.tsx's THE FIRST choice). */
const REM_FADE = 'calc(100%_-_4rem)';
const STEP_FADE = 'calc(100%_-_var(--spacing)*16)';

/** THE THIRD choice (GalleryCard.tsx's THE CAPTION NEVER SPLITS A WORD):
 *  the card is its caption's container at the caption's own step, and on a
 *  card under 10 of those ems the caption takes the narrow step. */
const NARROW_CARD = ['@container', 'text-lg'];
const NARROW_CAPTION = ['@max-[10em]:text-base', '@max-[10em]:px-3'];

/** THE FOURTH (GalleryCard.tsx's THE DOT STEP): on a card under 8.5 of its
 *  caption's ems the dot is not drawn. */
const DOT_STEP = '@max-[8.5em]:hidden';

/** One card — „Instrumentele de lucru", the widest word — on its own, in a
 *  frame `width` px wide. */
function renderCard(
  width = 200,
  frame: CSSProperties = {},
): Readonly<{ figure: HTMLElement; caption: HTMLElement; img: HTMLElement }> {
  const { container } = render(
    <div style={{ width: `${width}px`, ...frame }}>
      <GalleryCard
        image={LONGEST.image}
        caption={LONGEST.caption}
        sizes="(min-width: 44rem) 20rem, 52vw"
      />
    </div>,
  );
  const figure = container.querySelector('figure');
  const caption = figure?.querySelector('figcaption');
  const img = figure?.querySelector('img');
  if (!(figure instanceof HTMLElement) || !caption || !img) {
    throw new Error('GalleryCard rendered no figure, caption or photo');
  }
  return { figure, caption, img };
}

describe('GalleryCard — the demo card made real (KEEP IN SYNC with CardCarousel’s PhotoCard)', () => {
  it('wears the demo’s card, dot and photo recipes exactly — the card with the third choice’s container, the dot with the fourth’s step', () => {
    const { figure, caption, img } = renderCard();

    // The demo took the first three choices on 2026-10-15 and the fourth on
    // 2026-10-16, so the card IS the demo's figure, the caption's container
    // included, and the dot IS the demo's dot, its step included — on both.
    const demoFigure = fromDemo(/<figure className="([^"]+)"/, 'figure').split(
      /\s+/,
    );
    expect(demoFigure).toEqual(expect.arrayContaining(NARROW_CARD));
    expect(sorted(tokens(figure))).toEqual(sorted(demoFigure));
    const dot = caption.querySelector('span');
    if (!dot) throw new Error('the dot is missing');
    const demoDot = fromDemo(/<span\b[\s\S]*?className="([^"]+)"/, 'dot').split(
      /\s+/,
    );
    expect(demoDot, 'the demo’s dot').toContain(DOT_STEP);
    expect(tokens(dot), 'the card’s dot').toContain(DOT_STEP);
    expect(sorted(tokens(dot))).toEqual(sorted(demoDot));
    // The photo: ui/Image's `plain` situation on `fill`, covering its cell —
    // the demo's three props, read the way the DOM shows them.
    const demoImage = fromDemo(/<Image\b([\s\S]*?)\/>/, 'photo');
    expect(demoImage).toMatch(/variant="plain"/);
    expect(demoImage).toMatch(/^\s*fill\s*$/m);
    expect(sorted(tokens(img))).toEqual(
      sorted(
        fromDemo(/<Image\b[\s\S]*?className="([^"]+)"/, 'photo class').split(
          /\s+/,
        ),
      ),
    );
    expect(img.style.position).toBe('absolute');
  });

  it('wears the demo’s caption with exactly its three caption choices: the fade in theme steps, the belt, and the narrow step', () => {
    if (demoCaption === undefined) {
      throw new Error('CardCarousel.stories.tsx has no CAPTION constant');
    }
    expect(demoCard).toContain('<figcaption className={CAPTION}>');
    const { caption } = renderCard();

    // The demo took the three caption choices on 2026-10-15 — the fade in the
    // theme's step (never the old rem spelling), the belt, and the narrow step
    // under 10 of the card's ems — so the card's caption IS the demo's, token
    // for token, and both carry all three.
    const demo = demoCaption.split(/\s+/);
    expect(demoCaption).not.toContain(REM_FADE);
    expect(demo.some((token) => token.includes(STEP_FADE))).toBe(true);
    expect(demo).toEqual(
      expect.arrayContaining(['wrap-anywhere', ...NARROW_CAPTION]),
    );
    expect(sorted(tokens(caption))).toEqual(sorted(demo));
  });

  it('is a figure NAMED BY ITS CAPTION under HTML-AAM’s rule, as Playwright applies it (Chromium 151’s tree names it nothing) — its alt read, its dot hidden', async () => {
    const { figure } = renderCard();
    const card = LONGEST;

    // HTML-AAM's rule names a <figure> by its <figcaption> — a rule Chromium
    // 151 does not apply: its own accessibility tree names such a figure ""
    // (measured 2026-10-20, sections/PostPhoto's THE HEADING), and a screen
    // reader still reads the caption inside the figure (GalleryCard.tsx's THE
    // CARD). Testing Library's own name computation does not apply the rule
    // either (it reads the figure as nameless); vitest's locators run
    // Playwright's role engine, which does — so this proves the SPEC as
    // Playwright implements it, not what the browser's own tree exposes.
    // `exact`: the WHOLE name is the caption — a name that merely contains
    // it would match without it (PostPhoto.test.tsx's precedent).
    const named = page.getByRole('figure', {
      name: card?.caption,
      exact: true,
    });
    await expect.element(named).toBeInTheDocument();
    await expect
      .element(named.getByRole('img', { name: card?.image.alt }))
      .toBeInTheDocument();
    const dot = figure.querySelector('figcaption > span');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toBeEmptyDOMElement();
  });

  it('loads its photo lazily, with the hint it is handed', () => {
    const { img } = renderCard();

    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).not.toHaveAttribute('fetchpriority', 'high');
    expect(img).toHaveAttribute('sizes', '(min-width: 44rem) 20rem, 52vw');
  });
});

describe('GalleryCard — the caption’s contrast, measured (the real stylesheet)', () => {
  /** The scrim's alpha, read through the browser's own colour parser. */
  function scrimAlpha(): number {
    const probe = document.createElement('span');
    probe.style.color = 'var(--scrim)';
    document.body.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return Number(/[\d.]+(?=\s*\)$)/.exec(computed)?.[0] ?? 'NaN');
  }

  /** WCAG's ratio of white over white composited under black at `alpha`. */
  function whiteOnScrim(alpha: number): number {
    const channel = Math.round(255 * (1 - alpha)) / 255;
    const linear =
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return 1.05 / (linear + 0.05);
  }

  it.each([
    // [what, the frame's spacing step] — the default root, and THE BAND
    // SCALE's two ends: its step (s 0.81) and its cap (s 1.389).
    ['at the default root', undefined],
    ['inside the band scale at its step, s 0.81', '0.2025rem'],
    ['inside the band scale at its cap, s 1.389', '0.3472rem'],
  ] as const)(
    'puts every word below the fade, on the solid scrim — %s',
    (_what, spacing) => {
      const { caption } = renderCard(
        200,
        spacing === undefined
          ? {}
          : ({ '--spacing': spacing } as CSSProperties),
      );
      const style = getComputedStyle(caption);

      // The gradient's solid stop, as the engine resolved it.
      const fade = Number(
        /calc\(100% - ([\d.]+)px\)/.exec(style.backgroundImage)?.[1] ?? 'NaN',
      );
      expect(Number.isFinite(fade)).toBe(true);
      // The words start where the padding ends: a step below the fade.
      const padding = parseFloat(style.paddingTop);
      expect(padding).toBeGreaterThan(fade);
      expect(padding / fade).toBeCloseTo(17 / 16, 5);
      // The brightest pixel under the words is white under the scrim.
      const alpha = scrimAlpha();
      expect(alpha).toBeGreaterThanOrEqual(0.55 - 1 / 255);
      expect(whiteOnScrim(alpha)).toBeGreaterThanOrEqual(4.5);
      expect(style.color).toBe('rgb(255, 255, 255)');
    },
  );

  it.each([
    // [the card, where the gallery draws it] — §7's 320 window behind a
    // classic scrollbar, the narrowest card from 320 up (155.8px rounded up),
    // and a 320 phone's (164.4) — both with their dot — and THE DOT STEP,
    // which a window under §7's floor reaches.
    [156, 'a 320 window behind a classic scrollbar, its dot drawn'],
    [165, 'a 320 phone, its dot drawn'],
    [142, 'a 280px window — a Galaxy Fold’s cover screen — its dot dropped'],
  ] as const)(
    'keeps a long word inside a %ipx card under SC 1.4.12’s text spacing — the belt (%s)',
    (width, where) => {
      // The criterion's letter, word and line spacing on every element of the
      // caption. No typeface is loaded here: the claim is that NOTHING
      // overflows, which the belt makes true in any face.
      const { caption, figure } = renderCard(width);
      for (const element of [caption, ...caption.querySelectorAll('*')]) {
        if (!(element instanceof HTMLElement)) continue;
        element.style.letterSpacing = '0.12em';
        element.style.wordSpacing = '0.16em';
        element.style.lineHeight = '1.5';
      }

      expect(caption.scrollWidth, where).toBeLessThanOrEqual(
        caption.clientWidth,
      );
      expect(figure.scrollWidth, where).toBeLessThanOrEqual(figure.clientWidth);
    },
  );
});

// ── THE `sizes`, DERIVED (PostGallery.tsx's paragraph of that name): a model
// of the card's width at every window, built from the numbers the engine
// uses — each read where it lives, so the model fails when one moves — then
// pinned to the engine at the measures that matter (a phone's, §7's narrowest,
// the article's, the cap, the band scale, a smaller default font's), then held
// against the hint the gallery ships at every window from 280 to 3840px, at
// default fonts from 9 to 24px. A DEFAULT FONT is a `root` here: the size of
// every rem — the theme's, a container query's and a media condition's alike
// (the site sets no root size of its own, §7) — while the band scale's column
// floor, 896px, and a `px` media condition stay CSS pixels.

/** ui/Container's gutter a side at a `w` px window: clamp(1rem, clamp(5vw,
 *  30vw − 7.5rem, 10vw), 12.5rem), `vw` counting a scrollbar — every rem
 *  `root` px. */
const gutter = (w: number, root = ROOT): number =>
  Math.max(
    root,
    Math.min(
      Math.max(0.05 * w, Math.min(0.3 * w - 7.5 * root, 0.1 * w)),
      12.5 * root,
    ),
  );

/**
 * The card CardCarousel draws in a `measure` px wide gallery at a theme scale
 * `s` (CardCarousel.tsx's THE STAGE and THE BARS' ROOM): the three-card
 * window's card, the measure ÷ the window's ratio — never shrunk for the
 * arrows — under the 20rem cap, the cap 20 × 16 × s px: inside the band scale
 * `s` is the design pixel, outside it the default font over 16.
 */
function cardIn(measure: number, s: number): number {
  return Math.min(20 * ROOT * s, measure / ARRANGEMENTS[3].ratio);
}

/** The card's width at a `w` px window, `scrollbar` px of it a classic
 *  scrollbar, for a pointer, at a `root` px default font. */
function cardAt(
  w: number,
  scrollbar: number,
  pointer: 'fine' | 'coarse',
  root = ROOT,
): number {
  const column = w - scrollbar - 2 * gutter(w, root);
  // THE BAND SCALE: a mouse or trackpad and a column of max(56rem, 896px) —
  // its floor CSS pixels, which no default font moves.
  const scaled = pointer === 'fine' && column >= Math.max(56 * root, 896);
  // The theme's scale: the design pixel, min(column, 96rem) / 1106, inside
  // the band scale; the default font over 16 outside it.
  const s = scaled ? Math.min(column, 96 * root) / 1106 : root / ROOT;
  // The article's 42rem measure, a theme length: 672 design pixels inside
  // the band scale, 42 of the default font's rems outside it.
  const measure = scaled ? 42 * ROOT * s : Math.min(42 * root, column);
  return cardIn(measure, s);
}

/** The slot a `sizes` list gives at a `w` px window, at a `root` px default
 *  font — its first entry whose conditions hold, the way a browser reads it:
 *  a rem in a condition or a length the default font's, a px a CSS pixel. */
function slotAt(
  sizes: string,
  w: number,
  pointer: 'fine' | 'coarse',
  root = ROOT,
): number {
  for (const entry of sizes.split(',').map((part) => part.trim())) {
    const conditions = [...entry.matchAll(/\(([^)]+)\)/g)].map(
      (match) => match[1] ?? '',
    );
    const length = entry
      .replace(/\([^)]*\)/g, '')
      .replace(/\band\b/g, '')
      .trim();
    const holds = conditions.every((condition) => {
      const minRem = /^min-width:\s*([\d.]+)rem$/.exec(condition);
      if (minRem) return w >= Number(minRem[1]) * root;
      const minPx = /^min-width:\s*([\d.]+)px$/.exec(condition);
      if (minPx) return w >= Number(minPx[1]);
      if (condition === 'pointer: fine') return pointer === 'fine';
      throw new Error(`an unknown media condition: ${condition}`);
    });
    if (!holds) continue;
    const rem = /^([\d.]+)rem$/.exec(length);
    if (rem) return Number(rem[1]) * root;
    const vw = /^([\d.]+)vw$/.exec(length);
    if (vw) return (Number(vw[1]) / 100) * w;
    throw new Error(`an unknown length: ${length}`);
  }
  throw new Error(`no entry of „${sizes}" holds at ${w}px`);
}

/** next/image's floor for the files a `vw` share keeps: the smallest of
 *  next.config's `deviceSizes` — next/image sorts the list and multiplies its
 *  first by the smallest share — read out of the config's own text. */
const DEVICE_FLOOR: number = (() => {
  const list = /\bdeviceSizes:\s*\[([^\]]*)\]/.exec(nextConfigSource)?.[1];
  const widths = [...(list ?? '').matchAll(/\d+/g)].map(([width]) =>
    Number(width),
  );
  if (widths.length === 0) {
    throw new Error('next.config.ts: no `deviceSizes` — it moved.');
  }
  return Math.min(...widths);
})();

/** The one hint the gallery ships, read off a rendered gallery. */
function shippedHint(): string {
  const { container, unmount } = render(<PostGallery {...props()} />);
  const hint = sizesOf(container);
  unmount();
  return hint;
}

describe('PostGallery — THE `sizes`, DERIVED', () => {
  it('rests on the numbers the engine uses, read where they live', () => {
    expect(containerClasses).toContain(
      'mx-[clamp(1rem,clamp(5vw,30vw_-_7.5rem,10vw),12.5rem)]',
    );
    expect(bandScaleClasses).toContain('scalable:@4xl:@min-[896px]:');
    expect(bandScaleClasses).toContain('min(100cqw,96rem)/1106');
    expect(bandColumnClasses).toContain('scalable:max-w-[96rem]');
    // The cap, 20rem — the capped card's, which the gallery fixes — and the
    // three-card card: the column ÷ the window's ratio, never shrunk for the
    // arrows.
    expect(carouselSource).toContain('[--cap:calc(var(--spacing)*80)]');
    expect(carouselSource).toContain(
      '[--c3:min(var(--cap),calc(100cqw/var(--r3)))]',
    );
    expect(carouselSource).toContain('[--card:var(--c3)]');
    // The line's three-card window.
    expect(ARRANGEMENTS[3].ratio).toBeCloseTo(1.7521, 4);
  });

  it.each([
    // [the measure in px, its spacing step]
    // A 390 phone's measure, and a 320 phone's.
    [351, undefined],
    [288, undefined],
    // §7's narrowest window behind a classic scrollbar: the narrowest card.
    [273, undefined],
    // The article's 42rem measure: the card at the cap.
    [672, undefined],
    // A wide frame: still the cap, never more.
    [1024, undefined],
    // A scaled band at s 1.2: the measure 42 × 16 × 1.2 px.
    [806.4, '0.3rem'],
  ] as const)(
    'matches the engine: a %fpx measure (spacing %s)',
    (measure, spacing) => {
      const frame = {
        width: `${measure}px`,
        ...(spacing === undefined ? {} : { '--spacing': spacing }),
      } as CSSProperties;
      render(
        <div style={frame}>
          <PostGallery {...props()} />
        </div>,
      );
      const drawn = parseFloat(getComputedStyle(centreOf(region())).width);

      // The model's card for that measure: its spacing step is its s.
      const s = spacing === undefined ? 1 : 0.3 / 0.25;
      expect(Math.abs(drawn - cardIn(measure, s))).toBeLessThanOrEqual(1 / 32);
    },
  );

  it('matches the engine at a smaller default font: at a 12px root the article’s 42rem measure is 504px, and the card its 20rem cap, 240px — the model’s s the root over 16', () => {
    // The root's own size, as a reader's default font sets it — every rem of
    // the theme follows it — given back after.
    const root = document.documentElement;
    const before = root.style.fontSize;
    root.style.fontSize = '12px';
    try {
      const measure = 42 * 12;
      render(
        <div style={{ width: `${measure}px` }}>
          <PostGallery {...props()} />
        </div>,
      );
      const drawn = parseFloat(getComputedStyle(centreOf(region())).width);

      expect(drawn).toBeCloseTo(20 * 12, 1);
      expect(Math.abs(drawn - cardIn(measure, 12 / ROOT))).toBeLessThanOrEqual(
        1 / 32,
      );
    } finally {
      root.style.fontSize = before;
    }
  });

  /** Every window from 280 to 3840px, both pointers, with and without a
   *  classic scrollbar, at a `root` px default font: the card the model
   *  draws, the slot the shipped hint gives, and every window where the slot
   *  is under the card or over `most` times it. */
  function sweep(root: number, most: number) {
    const hint = shippedHint();
    const failures: string[] = [];
    let worst = 1;
    for (const pointer of ['fine', 'coarse'] as const) {
      for (const scrollbar of [0, 15]) {
        for (let w = 280; w <= 3840; w += 2) {
          const card = cardAt(w, scrollbar, pointer, root);
          const slot = slotAt(hint, w, pointer, root);
          worst = Math.max(worst, slot / card);
          if (slot < card - 0.01 || slot > most * card + 0.01) {
            failures.push(
              `${root}px font, ${pointer}, scrollbar ${scrollbar}, ${w}px: card ${card.toFixed(1)}, hint ${slot.toFixed(1)}`,
            );
          }
        }
      }
    }
    return { failures, worst };
  }

  it.each([16, 18, 20, 24])(
    'never hints a card narrower than the one drawn, nor more than 1.25 times it, at any window from 280 to 3840px — at a %ipx default font',
    (root) => {
      const { failures, worst } = sweep(root, 1.25);

      expect(failures).toEqual([]);
      // The widest margin is the 20rem clause over the band scale's first,
      // smaller cards: at the default font a 259.2px card at a 1120px
      // window, under the 1140 where the scale's own clause begins; at a
      // larger one the same ratio at 70rem.
      expect(worst).toBeCloseTo(320 / (20 * ROOT * (896 / 1106)), 2);
    },
  );

  it.each([9, 10, 11, 12, 13, 14, 15])(
    'never hints a card narrower than the one drawn under a SMALLER default font either, nor more than 1.4 times it, at any window from 280 to 3840px — at a %ipx default font',
    (root) => {
      // The band scale's column floor is CSS pixels, 896, which no default
      // font moves, while every rem clause moves with the font: so the
      // scale's 24vw opens at the later of 71.25rem and 1140px, and from
      // 1120px — where the window alone cannot say whether the scale has
      // begun — the hint covers the wider of the two cards. The price, a
      // wider hint than at 16px: at most the 28rem clause over the 20rem
      // card, 1.4 times it, at 9px (PostGallery.tsx's THE `sizes`, DERIVED).
      const { failures } = sweep(root, 28 / 20);

      expect(failures).toEqual([]);
    },
  );

  it('spells every `vw` after a space, as a whole number — next/image reads the smallest such share as the floor of its candidates', () => {
    const hint = shippedHint();
    const shares = [...hint.matchAll(/(.)(\d+(?:\.\d+)?)vw/g)];
    expect(shares.length).toBeGreaterThan(0);
    for (const [, before, share] of shares) {
      expect(before).toBe(' ');
      // next/image's pattern, (^|\s)(1?\d?\d)vw: a share with a decimal point
      // is not read at all.
      expect(share).toMatch(/^\d+$/);
    }
    // The smallest share, 24, keeps the candidates from next.config's
    // smallest `deviceSizes` width × 24 % up — 640 × 0.24 = 153.6px today —
    // under the narrowest card the gallery draws from §7's 320, 155.8.
    const smallest = Math.min(...shares.map(([, , share]) => Number(share)));
    expect(smallest).toBe(24);
    expect(DEVICE_FLOOR * (smallest / 100)).toBeLessThan(
      (320 - 15 - 2 * ROOT) / ARRANGEMENTS[3].ratio,
    );
  });
});
