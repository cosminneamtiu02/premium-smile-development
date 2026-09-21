import type { ReactElement, ReactNode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { userEvent as realUser } from 'vitest/browser';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import type { ClockEnv } from '@/lib/clock/clock';
import ro from '@/messages/ro.json';
import {
  Hero,
  HERO_FIRST_DWELL_MS,
  HERO_INTERVAL_MS,
  type HeroLabels,
  type HeroProps,
  type HeroSlide,
} from './Hero';
import source from './Hero.tsx?raw';

// sections/Hero — the opener's interaction suite, in the `components` project
// (a real Chromium): the ReviewsDeck.test.tsx shape for the site's second
// rotator. What only a browser can prove is here — a trusted Tab entering
// the region holds the ring and leaving lets it go; a bead press moves it
// and the ring goes on a full interval later — even with the hand and the
// focus left on the bead; no pointer anywhere holds it; the server HTML and
// the hydrated tree are the same nodes.
// The clock is driven through lib/clock's `env` seam (no real media query,
// no real visibility) and fake timers where the rhythm matters.
//
// EXPECTED LOG NOISE: three next/image warnings per mount ("fill … parent
// element with invalid position: static"). tests/setup/components.ts loads
// no stylesheet, so the picture wrapper's `absolute` never computes in this
// runner; the built export has it positioned. Not a defect — do not chase.
//
// Fixtures are Romanian with diacritics (§15.7) — the old site's own three
// slogans, the words lib/hero-slides ships — and the labels are the real
// message file's, so a renamed key fails here before it fails on the page.
// Every string that reaches the band is FINISHED (§8.1): this suite formats
// the „{index} din {total}" sentence itself, as the page's populator does.

/** A browser that neither reduces motion nor hides the tab, unless asked. */
const quietEnv = (reduced = false): ClockEnv => ({
  prefersReducedMotion: () => reduced,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
});

const fill = (message: string, values: Record<string, string>): string =>
  message.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');

const label = (index: number, total: number): string =>
  fill(ro.home.hero.slide, { index: String(index), total: String(total) });

const LABELS: HeroLabels = {
  region: ro.home.hero.region,
  role: ro.common.carousel.role,
  slideRole: ro.common.carousel.slideRole,
  picker: ro.home.hero.picker,
  contact: ro.home.hero.contact,
  services: ro.home.hero.services,
};

const WORDS = [
  {
    id: 'calm',
    src: '/images/demo/hero-calm.jpg',
    alt: 'Cabinet de tratament liniștit cu lumină naturală',
    title: 'O clinică stomatologică modernă pentru toată familia',
  },
  {
    id: 'team',
    src: '/images/demo/hero-team.jpg',
    alt: 'Medic primitor salutând un pacient la recepție',
    title: 'O echipă care ascultă, pe limba ta',
  },
  {
    id: 'result',
    src: '/images/demo/hero-result.jpg',
    alt: 'Pacient zâmbind încrezător după tratament',
    title: 'Tratamente realizate ca într-un studio de lux',
  },
] as const satisfies readonly Omit<HeroSlide, 'label'>[];

const SERVICES_HREF = '/ro/services/';
const INTERVAL = 5_000;
const FIRST_DWELL = 8_000;

/**
 * The shell, in miniature (the Header.test precedent): the band itself reads
 * no message file, but its contact button opens the ONE dialog the
 * ContactModalProvider renders — and that dialog calls t('contact.*'), so the
 * intl provider must sit outside the modal provider exactly as layout.tsx
 * nests them.
 */
function Providers({ children }: { children: ReactNode }): ReactElement {
  return (
    <NextIntlClientProvider locale="ro" messages={ro}>
      <ContactModalProvider>{children}</ContactModalProvider>
    </NextIntlClientProvider>
  );
}

type MountOptions = {
  count?: number;
  reduced?: boolean;
  intervalMs?: number;
  startDelayMs?: number;
  /** Renders a focusable sibling on each side — the page around the band. */
  neighbours?: boolean;
};

function slidesOf(count: number = WORDS.length): readonly HeroSlide[] {
  return WORDS.slice(0, count).map((row, index) => ({
    ...row,
    label: label(index + 1, count),
  }));
}

function mount(options: MountOptions = {}) {
  const slides = slidesOf(options.count);
  const band = (
    <Hero
      slides={slides}
      labels={LABELS}
      servicesHref={SERVICES_HREF}
      intervalMs={options.intervalMs ?? INTERVAL}
      startDelayMs={options.startDelayMs ?? FIRST_DWELL}
      env={quietEnv(options.reduced ?? false)}
    />
  );
  const utils = render(
    <Providers>
      {options.neighbours ? (
        <>
          <button type="button">Înainte</button>
          {band}
          <button type="button">După</button>
        </>
      ) : (
        band
      )}
    </Providers>,
  );
  const region = screen.getByRole('region', { name: LABELS.region });
  // The slides container is the live region — the one box that carries
  // aria-live, and the one the ring's status is read from below.
  const stage = region.querySelector('[aria-live]');
  const beads = () =>
    screen.queryByRole('group', { name: LABELS.picker }) === null
      ? []
      : screen.getAllByRole('button', { name: /Imaginea \d din \d/ });
  return { ...utils, region, stage, beads, slides };
}

/** The slide that is showing: the only group NOT inert. */
function showingLabel(region: HTMLElement): string | null {
  const groups = [...region.querySelectorAll('[aria-roledescription]')].filter(
    (el) => el.getAttribute('role') === 'group',
  );
  const showing = groups.find((el) => !el.hasAttribute('inert'));
  return showing?.getAttribute('aria-label') ?? null;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Hero — the region and its slides (lib/rotation’s markup duties)', () => {
  it('is a named carousel region whose slides are groups named like their beads', () => {
    const { region, stage } = mount();
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('aria-roledescription', LABELS.role);
    expect(stage).not.toBeNull();

    // Only the showing slide is in the tree; the other two are inert AND
    // aria-hidden (the Safari ≤ 15.5 belt), so `hidden: true` is needed to
    // count them at all.
    const groups = screen.getAllByRole('group', { hidden: true });
    const slides = groups.filter(
      (el) => el.getAttribute('aria-roledescription') === LABELS.slideRole,
    );
    expect(slides.map((el) => el.getAttribute('aria-label'))).toEqual([
      label(1, 3),
      label(2, 3),
      label(3, 3),
    ]);
    expect(slides[0]).not.toHaveAttribute('inert');
    expect(slides[1]).toHaveAttribute('inert');
    expect(slides[2]).toHaveAttribute('inert');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
    // NO aria-current on a slide — that attribute belongs to the beads.
    for (const slide of slides)
      expect(slide).not.toHaveAttribute('aria-current');
    expect(showingLabel(region)).toBe(label(1, 3));
  });

  it('renders no heading of its own — the page owns the one static h1', () => {
    mount();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    // The slogans are display text on a <p> (ui/Heading’s default host),
    // alone in their box: the supporting line and the blank that replaced
    // it are gone (owner, rounds 8–9), and the room they took sits ABOVE the
    // slogan as the words Container's top padding, so the buttons stay put.
    const slogan = screen.getByText(WORDS[0].title);
    expect(slogan.tagName).toBe('P');
    expect(slogan.nextElementSibling).toBeNull();
    expect(slogan.parentElement?.parentElement?.className).toContain('pt-10');
  });

  it('wears the PLAIN slogan by default — the owner’s pick (round 10) — and the old page’s stroked face on slogan="stroked"', () => {
    const { unmount } = mount();
    const plain = screen.getByText(WORDS[0].title).className;
    expect(plain).toContain('text-ink-inverse');
    expect(plain).not.toContain('text-stroke');
    expect(plain).not.toContain('font-bold');
    unmount();

    render(
      <Providers>
        <Hero
          slides={slidesOf()}
          labels={LABELS}
          servicesHref={SERVICES_HREF}
          slogan="stroked"
          env={quietEnv()}
        />
      </Providers>,
    );
    const stroked = screen.getByText(WORDS[0].title).className;
    expect(stroked).toContain('text-ink-inverse');
    expect(stroked).toContain('font-bold');
    expect(stroked).toContain('text-stroke:2px');
  });

  it('wears the border alone on slogan="outlined" (owner, round 8)', () => {
    render(
      <Providers>
        <Hero
          slides={slidesOf()}
          labels={LABELS}
          servicesHref={SERVICES_HREF}
          slogan="outlined"
          env={quietEnv()}
        />
      </Providers>,
    );
    for (const row of WORDS) {
      const face = screen.getByText(row.title).className;
      expect(face).toContain('text-stroke:2px');
      expect(face).not.toContain('font-bold');
    }
  });

  it('gives every picture its alt, preloads only the first (the LCP element) and covers the box', () => {
    mount();
    const pictures = screen.getAllByRole('img', { hidden: true });
    expect(pictures.map((img) => img.getAttribute('alt'))).toEqual(
      WORDS.map((row) => row.alt),
    );
    expect(pictures[0]).toHaveAttribute('fetchpriority', 'high');
    // `preload` reaches next/image only through ExportedImage's `...rest`
    // (it destructures `priority`, not `preload`): the ABSENCE of lazy on the
    // first picture is what proves the optimizer did not swallow it.
    expect(pictures[0]).not.toHaveAttribute('loading', 'lazy');
    expect(pictures[1]).toHaveAttribute('loading', 'lazy');
    expect(pictures[2]).toHaveAttribute('loading', 'lazy');
    expect(pictures[0]).toHaveAttribute('sizes', '100vw');
    expect(pictures[0].className).toContain('object-cover');
    // The grey filter rides the picture's wrapper, 4px oversize for the blur.
    const wrapper = pictures[0].parentElement;
    expect(wrapper?.className).toContain('grayscale');
    expect(wrapper?.className).toContain('blur-xs');
    expect(wrapper?.className).toContain('-inset-1');
  });

  it('lays ONE static ground — the §15.1 floor from 8rem down — under the words, buttons, beads and fade, and ONE fade into the page', () => {
    const { region } = mount();
    const stage = region.firstElementChild;
    if (!stage) throw new Error('no stage');
    // Round 1 painted a scrim inside every slide; round 2 (owner, 2026-09-20)
    // lightened the picture zone and anchored the floor to the words' own
    // row — no per-slide scrim survives, and no uniform bg-scrim either.
    expect(region.querySelectorAll('.bg-scrim')).toHaveLength(0);
    const ground = [...stage.children].find((el) =>
      el.className.includes('rgb(0_0_0_/_0.4)_8rem'),
    );
    if (!ground) throw new Error('no ground');
    expect(ground).toHaveAttribute('aria-hidden', 'true');
    // The veil is the old site's 0.40, spelled here — NOT the 0.55 token
    // (§15.1's rider, owner round 3): the token stays the modal's dim.
    expect(ground.className).not.toContain('--color-scrim');
    // The old page's legibility aid, inherited from the words' wrapper.
    expect(screen.getByText(WORDS[0].title).parentElement?.className).toContain(
      'text-shadow:',
    );
    expect(ground.className).toContain('col-start-1');
    expect(ground.className).toContain('row-start-2');
    expect(ground.className).toContain('row-end-5'); // to the stage's bottom
    expect(ground.className).toContain('-mt-36');
    // DOM order is paint order at z-auto: the slides, THEN the ground, so it
    // sits above their pictures.
    const live = region.querySelector('[aria-live]');
    if (!live) throw new Error('no live region');
    expect(
      live.compareDocumentPosition(ground) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The picture rests at 80 % over the band's page ground (the old wash);
    // the slide box itself never fades — its two children do.
    const picture = screen.getAllByRole('img', { hidden: true })[0]
      .parentElement;
    expect(picture?.className).toContain('opacity-80');
    expect(picture?.className).toContain('transition-opacity');
    expect(picture?.parentElement?.className).not.toContain('opacity');
    expect(region.className).toContain('bg-page');
    // The fade: absolute at the stage's bottom, a tenth of it tall (the old
    // page's own thinness — round 6), ending in the page colour.
    const fade = stage.lastElementChild;
    expect(fade).toHaveAttribute('aria-hidden', 'true');
    expect(fade?.className).toContain('absolute');
    expect(fade?.className).toContain('bottom-0');
    expect(fade?.className).toContain('h-[10%]');
    // Ten eased stops: invisible for the first fifth, solid page at the end.
    expect(fade?.className).toContain('_1%,transparent)_20%');
    expect(fade?.className).toContain('_90%,transparent)_90%');
    expect(fade?.className).toContain('var(--color-page)_100%');
  });

  it('remaps the focus token to the inverse ink on the band — the first dark band', () => {
    const { region } = mount();
    expect(region.className).toContain('[--focus:var(--ink-inverse)]');
    expect(region.className).toContain('isolate');
  });

  it('slides UNDER the pill and fills the whole first screen as a MINIMUM — the sixth coupled spelling, two numbers in one file', () => {
    const { region } = mount();
    // The pill's flow box: mt-4 + h-20 + two 1px borders (Header.tsx).
    expect(region.className).toContain('-mt-[calc(6rem+2px)]');
    const stage = region.firstElementChild;
    expect(stage?.className).toContain('min-h-screen');
    expect(stage?.className).toContain('supports-[height:100svh]:min-h-svh');
    // The 8 % shift (round 7): a padding above two equal spacers moves their
    // shared centre down by half of it — 16svh puts the median at 58 %.
    expect(stage?.className).toContain('pt-[16vh]');
    expect(stage?.className).toContain('supports-[height:100svh]:pt-[16svh]');
    // Four rows: two spacers that share the slack equally — the block's
    // median is the screen's centre (round 6) — the first never thinner than
    // 8rem (the words stay clear of the pill), the last never thinner than
    // 9rem (the buttons stay clear of the absolute beads and fade).
    expect(stage?.className).toContain(
      'grid-rows-[minmax(8rem,1fr)_auto_auto_minmax(9rem,1fr)]',
    );
    // The buttons' row ends at the buttons' own edge (no bottom padding), so
    // the visual block and the centred rows are one box.
    const cta = screen.getByRole('link', { name: LABELS.services })
      .parentElement?.parentElement;
    expect(cta?.className).toContain('row-start-3');
    expect(cta?.className).not.toMatch(/\bpb-/);
  });

  it('spreads native props onto the <section> and merges className last', () => {
    render(
      <Providers>
        <Hero
          slides={slidesOf()}
          labels={LABELS}
          servicesHref={SERVICES_HREF}
          env={quietEnv()}
          id="opener"
          data-band="hero"
          className="mt-0"
        />
      </Providers>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    expect(region).toHaveAttribute('id', 'opener');
    expect(region).toHaveAttribute('data-band', 'hero');
    expect(region.className.endsWith(' mt-0')).toBe(true);
  });
});

describe('Hero — the beads (buttons with aria-current, the law’s picker)', () => {
  it('come FIRST in the DOM and LAST in the picture, named like the slides, the first current', () => {
    const { region, beads } = mount();
    const picker = screen.getByRole('group', { name: LABELS.picker });
    const stage = region.querySelector('[aria-live]');
    // DOM order: the controls before the slides (the APG order).
    if (!stage)
      throw new Error('no live region — the slides container is missing');
    expect(
      picker.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Picture order: the beads are ABSOLUTE at the bottom of the stage (8 %
    // up — round 6), out of the grid so they cannot pull the centred block
    // down; the slides' words are row 2, naming their column so they may
    // overlap the ground.
    expect(picker.className).toContain('absolute');
    expect(picker.className).toContain('bottom-[8%]');
    expect(stage?.className).toContain('row-start-2');
    expect(stage?.className).toContain('col-start-1');

    const buttons = beads();
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      label(1, 3),
      label(2, 3),
      label(3, 3),
    ]);
    expect(buttons[0]).toHaveAttribute('aria-current', 'true');
    expect(buttons[1]).not.toHaveAttribute('aria-current');
    // Hit box: a 44px-tall button with horizontal padding around the bead —
    // SC 2.5.8's 24 × 24 minimum with slack; the bead itself is decoration.
    expect(buttons[0].className).toContain('h-11');
    expect(buttons[0].className).toContain('px-2');
    expect(buttons[0].firstElementChild).toHaveAttribute('aria-hidden', 'true');
    // A soft drop shadow keeps a white dot a dot over a pale photograph
    // under the 0.40 veil (the BEADS paragraph).
    expect(buttons[0].firstElementChild?.className).toContain('shadow-[');
  });

  it('a press shows that slide, moves aria-current, and the ring GOES ON a full interval later (owner, round 3)', () => {
    vi.useFakeTimers();
    const { region, stage, beads } = mount();
    expect(stage).toHaveAttribute('aria-live', 'off'); // running

    act(() => fireEvent.click(beads()[2]));
    expect(showingLabel(region)).toBe(label(3, 3));
    expect(beads()[2]).toHaveAttribute('aria-current', 'true');
    expect(beads()[0]).not.toHaveAttribute('aria-current');
    // Nothing stops for good: still running, and the press bought a FULL
    // interval — not the remainder of the first dwell.
    expect(stage).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(INTERVAL - 1));
    expect(showingLabel(region)).toBe(label(3, 3));
    act(() => vi.advanceTimersByTime(1));
    expect(showingLabel(region)).toBe(label(1, 3)); // wrapped
  });
});

describe('Hero — the clock (lib/clock through the shared shell)', () => {
  it('waits the first dwell, then steps every interval and wraps', () => {
    vi.useFakeTimers();
    const { region } = mount();
    act(() => vi.advanceTimersByTime(FIRST_DWELL - 1));
    expect(showingLabel(region)).toBe(label(1, 3));
    act(() => vi.advanceTimersByTime(1));
    expect(showingLabel(region)).toBe(label(2, 3));
    act(() => vi.advanceTimersByTime(INTERVAL));
    expect(showingLabel(region)).toBe(label(3, 3));
    act(() => vi.advanceTimersByTime(INTERVAL));
    expect(showingLabel(region)).toBe(label(1, 3));
  });

  it('renders from the CLAMPED index when the ring shrinks under it (the recipe’s one-frame guard)', () => {
    // ui/use-rotation's one non-trivial line: setCount() runs one frame
    // AFTER a shorter list renders, so `active` may point past the end for
    // that frame. The frame must show the slide setCount() is about to land
    // on — the last one — never slide 0 on the way (a move nobody asked for).
    const { region, beads, rerender } = mount();
    act(() => fireEvent.click(beads()[2]));
    expect(showingLabel(region)).toBe(label(3, 3));
    rerender(
      <Providers>
        <Hero
          slides={slidesOf(2)}
          labels={LABELS}
          servicesHref={SERVICES_HREF}
          intervalMs={INTERVAL}
          startDelayMs={FIRST_DWELL}
          env={quietEnv()}
        />
      </Providers>,
    );
    expect(showingLabel(region)).toBe(label(2, 2));
    expect(beads()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('ships the old site’s own 5.5 s rhythm and a 1.5 s first beat as its defaults (owner, rounds 4–5)', () => {
    expect(HERO_INTERVAL_MS).toBe(5_500);
    expect(HERO_FIRST_DWELL_MS).toBe(1_500);
  });

  it('no pointer holds the ring — not over the picture, not over the picker (owner, rounds 2–3)', () => {
    vi.useFakeTimers();
    const { region, stage } = mount();
    const picker = screen.getByRole('group', { name: LABELS.picker });
    act(() => fireEvent.pointerEnter(region));
    act(() => fireEvent.pointerEnter(picker));
    expect(stage).toHaveAttribute('aria-live', 'off'); // still running
    act(() => vi.advanceTimersByTime(FIRST_DWELL));
    expect(showingLabel(region)).toBe(label(2, 3));
  });

  it('a REAL click on a bead — which focuses it — holds nothing: the hand and the focus stay, the ring goes on', async () => {
    // Real timers and a trusted click: only a real click both focuses the
    // bead (Chrome, Firefox) and leaves the pointer on it — the two holds
    // the law would apply and this band declines (owner, round 3).
    // Two seconds, not 300 ms: under a full parallel run a trusted click can
    // take longer than a short interval, and the ring would already have
    // moved on before the landing is checked (flaked once, 2026-09-21).
    const { region, stage, beads } = mount({
      intervalMs: 2_000,
      startDelayMs: 2_000,
    });
    // This runner loads no stylesheet (the header's EXPECTED LOG NOISE): the
    // `fill` pictures resolve against the viewport and lie over everything,
    // so a trusted click would land on an <img>. On the site they sit under
    // the z-10 beads; here they are told to let the click through.
    for (const img of document.images) img.style.pointerEvents = 'none';
    await realUser.click(beads()[2]);
    expect(document.activeElement).toBe(beads()[2]);
    expect(showingLabel(region)).toBe(label(3, 3));
    expect(stage).toHaveAttribute('aria-live', 'off'); // not held
    await waitFor(() => expect(showingLabel(region)).toBe(label(1, 3)), {
      timeout: 5_000,
    });
  });

  it('declines the automatic start under reduced motion; the beads still work', () => {
    vi.useFakeTimers();
    const { region, stage, beads } = mount({ reduced: true });
    expect(stage).toHaveAttribute('aria-live', 'polite'); // idle
    act(() => vi.advanceTimersByTime(FIRST_DWELL + INTERVAL * 2));
    expect(showingLabel(region)).toBe(label(1, 3));
    act(() => fireEvent.click(beads()[1]));
    expect(showingLabel(region)).toBe(label(2, 3));
  });

  it('keyboard focus INSIDE the region holds the ring; a Tab within is not a second entry; leaving lets it go (owner, round 3)', async () => {
    // Real timers: a trusted Tab is the only thing that sets the keyboard
    // modality classifyFocusEntry reads, and it needs the real event loop.
    const { stage, beads } = mount({ neighbours: true });
    expect(stage).toHaveAttribute('aria-live', 'off');
    screen.getByRole('button', { name: 'Înainte' }).focus();
    await realUser.keyboard('{Tab}');
    expect(document.activeElement).toBe(beads()[0]);
    expect(stage).toHaveAttribute('aria-live', 'polite'); // held
    await realUser.keyboard('{Tab}');
    expect(document.activeElement).toBe(beads()[1]);
    expect(stage).toHaveAttribute('aria-live', 'polite');
    // Leaving the region RESUMES it — the transient hold, not the law's
    // sticky pause (Hero.tsx's NO ROTATION CONTROL paragraph).
    await realUser.keyboard('{Tab}{Tab}{Tab}{Tab}');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'După' }),
    );
    expect(stage).toHaveAttribute('aria-live', 'off');
  });
});

describe('Hero — the two calls to action', () => {
  it('the contact button opens the one dialog the provider renders', () => {
    mount();
    const trigger = screen.getByRole('button', { name: LABELS.contact });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    act(() => fireEvent.click(trigger));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('the services link is a plain locale anchor wearing the outline face', () => {
    mount();
    const link = screen.getByRole('link', { name: LABELS.services });
    expect(link).toHaveAttribute('href', SERVICES_HREF);
    expect(link.className).toContain('border-cta');
  });

  it('both sit in one wrapping row that shares the width equally', () => {
    mount();
    const link = screen.getByRole('link', { name: LABELS.services });
    const row = link.parentElement;
    expect(row?.className).toContain('flex-wrap');
    expect(row?.className).toContain('*:grow');
    expect(row?.className).toContain('*:basis-64');
    expect(row?.className).toContain('max-w-3xl');
  });
});

describe('Hero — the two-item floor and the empty ring', () => {
  it('one slide is a picture with words, not a carousel: no role word, no beads, no live region', () => {
    const { region, stage } = mount({ count: 1 });
    expect(region).not.toHaveAttribute('aria-roledescription');
    expect(stage).toBeNull();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByText(WORDS[0].title)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: LABELS.services }),
    ).toBeInTheDocument();
  });

  it('an empty ring renders nothing at all', () => {
    const { container } = render(
      <Providers>
        <Hero slides={[]} labels={LABELS} servicesHref={SERVICES_HREF} />
      </Providers>,
    );
    expect(container.querySelector('section')).toBeNull();
  });
});

describe('Hero — hydration parity (§16 rule 2)', () => {
  it('the server HTML and the hydrated tree are the same nodes, and the ring starts after mount', async () => {
    const band = (
      <Providers>
        <Hero
          slides={slidesOf()}
          labels={LABELS}
          servicesHref={SERVICES_HREF}
          env={quietEnv()}
        />
      </Providers>
    );
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(band);
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      const serverStage = container.querySelector('[aria-live]');
      const serverBead = container.querySelector('[aria-current="true"]');
      // The construction snapshot is idle → polite; index 0 is current.
      expect(serverStage).toHaveAttribute('aria-live', 'polite');
      expect(serverBead).toHaveAttribute('aria-label', label(1, 3));

      await act(async () => {
        root = hydrateRoot(container, band);
      });

      expect(errors).toEqual([]);
      // The SAME nodes React adopted, now running.
      expect(container.contains(serverStage)).toBe(true);
      expect(container.contains(serverBead)).toBe(true);
      expect(serverStage).toHaveAttribute('aria-live', 'off');
    } finally {
      spy.mockRestore();
      act(() => root?.unmount());
      container.remove();
    }
  });
});

describe('Hero — the prop contract refuses what the band sets itself', () => {
  // Refused by the TYPES, never resolved by attribute order (the ReviewCard /
  // PersonnelCard precedent; G2 typescript M1, 2026-09-19): a caller's
  // `aria-labelledby` would outrank the band's `aria-label` and rename the
  // region; a caller's FOCUS handler would compile and never fire, because
  // the shared shell's are spread last. Runs at typecheck, costs nothing.
  expectTypeOf<HeroProps>().not.toHaveProperty('aria-label');
  expectTypeOf<HeroProps>().not.toHaveProperty('aria-labelledby');
  expectTypeOf<HeroProps>().not.toHaveProperty('aria-roledescription');
  expectTypeOf<HeroProps>().not.toHaveProperty('onFocus');
  expectTypeOf<HeroProps>().not.toHaveProperty('onBlur');
  // The pointer pair is an ordinary handler again since round 2: the band
  // spreads it on the beads, not on the section, so a caller's fires.
  expectTypeOf<HeroProps>().toHaveProperty('onPointerEnter');
  expectTypeOf<HeroProps>().toHaveProperty('onPointerLeave');
  expectTypeOf<HeroProps>().not.toHaveProperty('children');
  it('keeps the rest of the native <section> surface open', () => {
    expectTypeOf<HeroProps>().toHaveProperty('id');
    expectTypeOf<HeroProps>().toHaveProperty('className');
  });
});

describe('Hero — source pins (what no runtime assertion can see)', () => {
  const stripComments = (code: string): string =>
    code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const code = stripComments(source);

  it("is the island: 'use client' on line 1 — the whole band hydrates", () => {
    expect(source.split('\n')[0]).toMatch(/^['"]use client['"];$/);
  });

  it('calls no t() and imports no message file or data list — a dumb band (§8.1)', () => {
    expect(code).not.toMatch(/\bt\(/);
    expect(code).not.toMatch(/useTranslations|getTranslations|next-intl/);
    expect(code).not.toMatch(/@\/messages\//);
    expect(code).not.toMatch(/lib\/hero-slides/);
  });

  it('consumes the shared shell, never a private copy of the recipe', () => {
    expect(code).toMatch(/from '@\/components\/ui\/use-rotation'/);
    expect(code).not.toMatch(/createRotation|useSyncExternalStore/);
  });
});
