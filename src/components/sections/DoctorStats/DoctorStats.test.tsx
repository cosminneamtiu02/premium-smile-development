import { createRef, type ReactElement, type Ref } from 'react';
import { render, screen, within } from '@testing-library/react';
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
import { People } from '@/assets/glyphs/People';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import {
  DoctorStats,
  countFrames,
  type DoctorStatTile,
  type DoctorStatsProps,
} from './DoctorStats';
import source from './DoctorStats.tsx?raw';

// sections/DoctorStats — the band's suite (D30). Role-based queries wherever
// a role exists (§9, §13): a named `region`, its <h2>, one `list`, one
// <h3> per tile — the outline a screen-reader user walks.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// DoctorCourses / DoctorProfile precedent): next-intl's hooks throw without
// one, so a green render proves the band owns no key and calls no t(). Every
// string below is a FIXTURE the page would have translated — Romanian with
// diacritics (§15.7): the eyebrow, title, lead and `atLeast` word are the
// `team.doctor.stats` Romanian values („peste" the owner's, round 2s), the
// tile words lib/team's first doctor's (D32), all of it the CMSR-clean copy
// round 2s shipped (tests/unit/cmsr-scan.test.ts). lib/team itself is NOT imported: a DUMB band's suite must not depend
// on the demo data a parallel lane is shaping.
//
// ── THE COUNT IS HELD STILL HERE. The island inside each number
// (StatNumber.tsx, D31) would count up in this real Chromium the moment a tile
// were half on screen; this suite replaces IntersectionObserver with one that
// never fires, so every number stays at the final value it was rendered with.
// The count itself is StatNumber.test.tsx's.
//
// ── Styles are NOT loaded in this project, so the utility TOKENS are the
// contract here; the geometry (four on a row, two, one) is asserted one tier
// up, in DoctorStats.stories.tsx's plays, derived from the measured column.
// Class strings the band takes from an ATOM are derived from a rendered atom,
// never retyped.

const EYEBROW = 'În cifre';
const TITLE = 'Experiență confirmată în timp';
const LEAD =
  'Cifrele de mai jos spun, pe scurt, cum lucrăm: cu atenție, cu tehnologie modernă și cu grijă reală pentru fiecare pacient.';

const TILES = [
  {
    id: 'experience',
    icon: <CalendarCheck />,
    value: 6,
    suffix: '+',
    label: 'Ani de experiență',
    description: 'Punem grija, expertiza și empatia în fiecare detaliu.',
  },
  {
    id: 'patients',
    icon: <People />,
    value: 3000,
    suffix: '+',
    label: 'Pacienți',
    description:
      'Peste 3000 de zâmbete îngrijite cu dedicare și profesionalism.',
  },
  {
    id: 'courses',
    icon: <Trophy />,
    value: 10,
    label: 'Cursuri',
    description: 'Formare continuă în tehnici și tehnologii moderne.',
  },
  {
    id: 'interventions',
    icon: <ToothCheck />,
    value: 1000,
    suffix: '+',
    label: 'Intervenții',
    description:
      'Atenție la detalii, tehnologii moderne și o abordare personalizată pentru fiecare pacient.',
  },
] as const satisfies readonly DoctorStatTile[];

/** The page's formatter for Romanian (§8.3) — „3.000", „1.000". */
const RO = (value: number): string => new Intl.NumberFormat('ro').format(value);

/** The page's `team.doctor.stats.atLeast` word in Romanian (round 2s). */
const AT_LEAST = 'peste';

/** The four final numbers as the visitor SEES them: the sign kept. */
const FINALS = ['6+', '3.000+', '10', '1.000+'];

/** …and as a screen reader SAYS them (round 2s): the page's word before the
 *  page's number on a „+" tile, the number alone on the exact count. */
const SPOKEN = ['peste 6', 'peste 3.000', '10', 'peste 1.000'];

// ── THE BYTE PINS — this band's OWN class strings.
const RHYTHM_BOX = 'flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20';
const OPENER = 'mx-auto flex max-w-3xl flex-col gap-4';
const LEAD_CLASSES = 'text-lg text-ink-muted text-center wrap-anywhere';
const GRID = 'grid gap-10 @md:grid-cols-2 @3xl:grid-cols-4 @3xl:gap-8';
const TILE = 'flex flex-col items-center gap-4';
const DISC =
  '-order-2 flex size-28 items-center justify-center rounded-full border border-line bg-surface text-cta [&_svg]:size-12';

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** What an atom emits, read off a RENDERED atom and unmounted at once. */
const classOfRendered = (ui: ReactElement): string => {
  const { container, unmount } = render(ui);
  const classes = (container.firstElementChild as HTMLElement).className;
  unmount();
  return classes;
};

const pageStep = (): string =>
  classOfRendered(<Heading size="page">6+</Heading>);
const titleStep = (): string =>
  classOfRendered(<Heading size="title">Pacienți</Heading>);
const mutedText = (): string =>
  classOfRendered(<Text tone="muted">Punem grija.</Text>);

/**
 * The source with its prose removed — what the source pins run against, so
 * they police code and not the header's own discussion of `'use client'`,
 * `Intl` and t() (the DoctorCourses mechanism).
 */
const CODE = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderBand = (
  placement: Placement = {},
  tiles: readonly DoctorStatTile[] = TILES,
  format: (value: number) => string = RO,
  atLeast: string = AT_LEAST,
) =>
  render(
    <DoctorStats
      eyebrow={EYEBROW}
      title={TITLE}
      lead={LEAD}
      tiles={tiles}
      format={format}
      atLeast={atLeast}
      {...placement}
    />,
  );

/** An observer that never reports: the numbers stay final (the header). */
class StillObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', StillObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const tilesOf = (): HTMLElement[] =>
  within(screen.getByRole('list')).getAllByRole('listitem');

/**
 * A tile's number <p>, found by what it CARRIES and never by its index among
 * the tile's children (that order is the DOM-order case's to pin, and it
 * moved once, G2-R2 tier 2): the island's sr-only twin, the tile's one
 * `.sr-only` text, which always holds a digit.
 */
const numberOf = (item: HTMLElement): HTMLElement =>
  within(item).getByText(/\d/, { selector: '.sr-only' })
    .parentElement as HTMLElement;

/** The order utilities an element wears, `-order-2` and friends. */
const ordersOf = (element: Element): string[] =>
  tokensOf(element).filter((token) => /(^|:)-?order-/.test(token));

/** Each tile's two number texts in DOM order: what is SEEN (the aria-hidden
 *  span) and what is HEARD (the sr-only twin). */
const numberTexts = (): { seen: string[]; heard: string[] } => {
  const pairs = tilesOf().map((item) => {
    const [visible, twin] = [...numberOf(item).children];
    return [visible.textContent ?? '', twin.textContent ?? ''];
  });
  return {
    seen: pairs.map(([seen]) => seen),
    heard: pairs.map(([, heard]) => heard),
  };
};

describe('DoctorStats — the region landmark (§9)', () => {
  it('is a <section>, named by its own <h2> through a generated id', () => {
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

  it('generates the id — two bands on one page never collide', () => {
    render(
      <>
        <DoctorStats
          eyebrow={EYEBROW}
          title={TITLE}
          lead={LEAD}
          tiles={TILES}
          format={RO}
          atLeast={AT_LEAST}
        />
        <DoctorStats
          eyebrow={EYEBROW}
          title="Rezultate în cifre"
          lead={LEAD}
          tiles={TILES}
          format={RO}
          atLeast={AT_LEAST}
        />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Rezultate în cifre' }),
    ).toBeInTheDocument();
  });

  it('opens with the eyebrow over the centred title, then the centred lead', () => {
    const { container } = renderBand();
    const band = bandOf(container);

    const eyebrow = within(band).getByText(EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow).toBeVisible();

    const heading = screen.getByRole('heading', { level: 2 });
    const opener = heading.parentElement as HTMLElement; // SectionHeading
    expect(tokensOf(opener)).toEqual(
      expect.arrayContaining(['items-center', 'text-center']),
    );

    const lead = within(band).getByText(LEAD);
    expect(lead.tagName).toBe('P');
    expect(lead.className).toBe(LEAD_CLASSES);
    // SectionHeading and the lead share ONE capped, centred column.
    expect(lead.parentElement).toBe(opener.parentElement);
    expect((lead.parentElement as HTMLElement).className).toBe(OPENER);
    expect(
      heading.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('keeps the outline h2 → h3 per tile, nothing deeper', () => {
    renderBand();

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent),
    ).toEqual(TILES.map((tile) => tile.label));
    expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  });
});

describe('DoctorStats — composes sections/TintedBand (D29)', () => {
  it('IS the lilac ground: the section wears exactly a bare TintedBand’s classes', () => {
    const bare = render(<TintedBand>x</TintedBand>);
    const ground = bandOf(bare.container);
    const expected = ground.className;
    const fades = [...ground.children]
      .filter((child) => child.getAttribute('aria-hidden') === 'true')
      .map((child) => child.className);
    bare.unmount();

    const { container } = renderBand();
    const band = bandOf(container);
    expect(band.className).toBe(expected);
    expect(
      [...band.children]
        .filter((child) => child.getAttribute('aria-hidden') === 'true')
        .map((child) => child.className),
    ).toEqual(fades);
    expect(fades).toHaveLength(2);
  });

  it('puts ITS rhythm box first inside the ground, owning the py steps', () => {
    renderBand();

    const heading = screen.getByRole('heading', { level: 2 });
    const rhythm = heading.parentElement?.parentElement
      ?.parentElement as HTMLElement;
    expect(rhythm.className).toBe(RHYTHM_BOX);
    expect(rhythm.children).toHaveLength(2);
    expect(rhythm.lastElementChild).toBe(screen.getByRole('list'));
  });

  it('merges the caller className LAST, through TintedBand', () => {
    const { container } = renderBand({ className: 'scroll-mt-10' });
    const tokens = tokensOf(bandOf(container));

    expect(tokens.at(-1)).toBe('scroll-mt-10');
    expect(tokens).toEqual(expect.arrayContaining(['relative', 'bg-page']));
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    renderBand({ ref: band });

    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toBe(screen.getByRole('region', { name: TITLE }));
  });

  it('spreads remaining native props onto the section, the name pair intact', () => {
    const { container } = render(
      <DoctorStats
        eyebrow={EYEBROW}
        title={TITLE}
        lead={LEAD}
        tiles={TILES}
        format={RO}
        atLeast={AT_LEAST}
        id="in-cifre"
        lang="de"
        data-slot="doctor-stats"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('id', 'in-cifre');
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('data-slot', 'doctor-stats');
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute(
      'id',
      'in-cifre',
    );
  });
});

describe('DoctorStats — the tiles (D30)', () => {
  it('renders ONE list with one item per tile, in the page’s order', () => {
    renderBand();

    const list = screen.getByRole('list');
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(list.className).toBe(GRID);

    const items = tilesOf();
    expect(items).toHaveLength(TILES.length);
    for (const item of items) {
      expect(item.tagName).toBe('LI');
      expect(item.className).toBe(TILE);
    }
  });

  it('orders each tile disc → label → number → description in the DOM — the heading before its number (G2-R2 tier 2, a11y F1)', () => {
    renderBand();

    for (const [index, item] of tilesOf().entries()) {
      const [disc, label, number, description] = [...item.children];
      expect(item.children).toHaveLength(4);
      expect(disc.tagName).toBe('SPAN');
      expect(label.tagName).toBe('H3');
      expect(label.textContent).toBe(TILES[index].label);
      // A heading jump lands on the label, and the next thing read is the
      // tile's one fact, its number.
      expect(number).toBe(numberOf(item));
      expect(number.tagName).toBe('P');
      expect(description.tagName).toBe('P');
      expect(description.textContent).toBe(TILES[index].description);
    }
  });

  it('paints it disc → number → label → description with TWO order tokens and nothing else', () => {
    // The reference's picture, restored on the tile's own `flex flex-col`
    // (never a `-reverse`): the disc at -2, the number at -1, the label and
    // the description at the default 0 in their DOM order. The engine's
    // reading of it is DoctorStats.stories.tsx's (`expectPaintOrder`).
    renderBand();

    for (const item of tilesOf()) {
      const [disc, label, number, description] = [...item.children];
      expect(tokensOf(item)).toEqual(
        expect.arrayContaining(['flex', 'flex-col']),
      );
      expect(tokensOf(item).some((token) => token.includes('reverse'))).toBe(
        false,
      );
      expect(ordersOf(item)).toEqual([]);
      expect([disc, label, number, description].map(ordersOf)).toEqual([
        ['-order-2'],
        [],
        ['-order-1'],
        [],
      ]);
    }
  });

  it('paints the icon inside an aria-hidden disc, the glyph sized by the parent', () => {
    renderBand();

    for (const item of tilesOf()) {
      const disc = item.firstElementChild as HTMLElement;
      expect(disc).toHaveAttribute('aria-hidden', 'true');
      expect(disc.className).toBe(DISC);
      // The glyph arrived as a prop and landed inside: one bare <svg>,
      // aria-hidden by its own default too.
      expect(disc.children).toHaveLength(1);
      const glyph = disc.firstElementChild as SVGSVGElement;
      expect(glyph).toBeInstanceOf(SVGSVGElement);
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('dresses the number in ui/Heading’s page step on a <p>, painted first, tabular and centred', () => {
    const expected = `${pageStep()} -order-1 tabular-nums text-center`;
    renderBand();

    for (const item of tilesOf()) {
      const number = numberOf(item);
      expect(number.tagName).toBe('P');
      expect(number.className).toBe(expected);
    }
    // A stat is not a heading of anything: no number enters the outline.
    for (const heading of screen.getAllByRole('heading')) {
      expect(heading.textContent).not.toMatch(/\d/);
    }
  });

  it('prints each FINAL value, formatted by the page, in the aria-hidden visible span', () => {
    renderBand();

    for (const item of tilesOf()) {
      const [visible, twin] = [...numberOf(item).children] as HTMLElement[];
      expect(visible).toHaveAttribute('aria-hidden', 'true');
      expect(twin.className).toBe('sr-only');
    }
    // The count is held still in this suite, so the visible span is final.
    expect(numberTexts().seen).toEqual(FINALS);
  });

  it('says the SPOKEN final in the sr-only twin: the page’s `atLeast` word before the page’s number on a „+" tile, the number alone otherwise (round 2s)', () => {
    renderBand();

    // The band's own rule, spelled out once more against the fixture…
    const expected = TILES.map((tile: DoctorStatTile) =>
      tile.suffix ? `${AT_LEAST} ${RO(tile.value)}` : RO(tile.value),
    );
    expect(numberTexts().heard).toEqual(expected);
    // …and the words a Romanian screen reader says, literally.
    expect(numberTexts().heard).toEqual(SPOKEN);
  });

  it('never lets the sign into the twin — the „+" is seen, never heard (round 2s)', () => {
    renderBand();
    const { seen, heard } = numberTexts();

    expect(heard.filter((text) => text.includes('+'))).toEqual([]);
    // The eye and the ear differ exactly on the three „+" tiles, on purpose.
    expect(seen.map((text, index) => text === heard[index])).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it('prints the spoken form in the SERVER HTML — what a screen reader gets before any script (§16 rule 2)', () => {
    // renderToString IS the static export's render: no effect, no count.
    const host = document.createElement('div');
    host.innerHTML = renderToString(
      <DoctorStats
        eyebrow={EYEBROW}
        title={TITLE}
        lead={LEAD}
        tiles={TILES}
        format={RO}
        atLeast={AT_LEAST}
      />,
    );

    const twins = [...host.querySelectorAll('li .sr-only')];
    expect(twins.map((twin) => twin.textContent)).toEqual(SPOKEN);
    const visibles = [...host.querySelectorAll('li p > [aria-hidden="true"]')];
    expect(visibles.map((visible) => visible.textContent)).toEqual(FINALS);
  });

  it('dresses each label as an <h3> on the title step, centred, never hyphenated', () => {
    const expected = `${titleStep()} text-center hyphens-none`;
    renderBand();

    for (const heading of screen.getAllByRole('heading', { level: 3 })) {
      expect(heading.className).toBe(expected);
    }
  });

  it('dresses each description as ui/Text muted, centred on the element, any token wrapping', () => {
    const expected = `${mutedText()} text-center wrap-anywhere`;
    renderBand();

    for (const [index, item] of tilesOf().entries()) {
      const description = item.lastElementChild as HTMLElement;
      expect(description.className).toBe(expected);
      expect(description.textContent).toBe(TILES[index].description);
    }
  });

  it('centres prose ONLY on the elements themselves (§15.15 b)', () => {
    const { container } = renderBand();

    const centred = [...container.querySelectorAll('*')].filter((element) =>
      tokensOf(element).includes('text-center'),
    );
    const heading = screen.getByRole('heading', { level: 2 });
    const expected = [
      heading.parentElement, // SectionHeading's root (align="center")
      within(bandOf(container)).getByText(LEAD),
      // In DOM order, which is the order querySelectorAll walks (G2-R2
      // tier 2, a11y F1): the <h3>, then the number <p>, then the sentence.
      ...tilesOf().flatMap((item) => [
        within(item).getByRole('heading', { level: 3 }),
        numberOf(item),
        item.lastElementChild, // the description <p>
      ]),
    ];
    expect(centred).toEqual(expected);
    // No blanket spelling anywhere — `[&_p]:text-center` and friends.
    for (const element of container.querySelectorAll('*')) {
      expect(
        tokensOf(element).some((token) => /\]:text-center$/.test(token)),
      ).toBe(false);
    }
  });

  it('calls the page formatter with every value — the band formats nothing itself', () => {
    const format = vi.fn(RO);
    renderBand({}, TILES, format);

    for (const tile of TILES) expect(format).toHaveBeenCalledWith(tile.value);
    // Whole numbers only — the curve is rounded before it is formatted.
    for (const [value] of format.mock.calls) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('prints whatever the formatter makes — the `X${n}` probe, seen and heard', () => {
    renderBand({}, TILES, (value) => `X${value}`);
    const { seen, heard } = numberTexts();

    expect(seen).toEqual(['X6+', 'X3000+', 'X10', 'X1000+']);
    // The spoken number is the page's formatter's too, never the band's.
    expect(heard).toEqual(['peste X6', 'peste X3000', 'X10', 'peste X1000']);
  });

  it('speaks whatever word the page hands it — the `atLeast` probe (round 2s)', () => {
    // A word no locale uses: the band invents none and translates none.
    renderBand({}, TILES, RO, 'Wort');

    expect(numberTexts().heard).toEqual([
      'Wort 6',
      'Wort 3.000',
      '10',
      'Wort 1.000',
    ]);
    // The screen keeps the sign whatever the word.
    expect(numberTexts().seen).toEqual(FINALS);
  });

  it('renders a single tile as a one-item list, the band otherwise unchanged', () => {
    renderBand({}, [TILES[1]]);

    expect(tilesOf()).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getByRole('list').className).toBe(GRID);
  });
});

describe('DoctorStats — countFrames, the count as strings (D31 friction)', () => {
  it('makes 46 frames: 0 first, format(value) last', () => {
    const frames = countFrames(3000, RO);

    expect(frames).toHaveLength(46);
    expect(frames[0]).toBe('0');
    expect(frames.at(-1)).toBe('3.000');
  });

  it('climbs, never falls, and eases OUT — past 80 % of the value by half time', () => {
    const numbers = countFrames(3000, String).map(Number);

    for (let index = 1; index < numbers.length; index += 1) {
      expect(numbers[index]).toBeGreaterThanOrEqual(numbers[index - 1]);
    }
    // Step 23 of 45 is the half-time mark: 1 − (1 − 23/45)³ ≈ 0.88.
    expect(numbers[23]).toBeGreaterThan(3000 * 0.8);
    expect(numbers[23]).toBeLessThan(3000);
  });

  it('ends on format(value) itself, whatever the formatter', () => {
    const probe = vi.fn((value: number) => `X${value}`);
    const frames = countFrames(6, probe);

    expect(frames.at(-1)).toBe('X6');
    expect(probe).toHaveBeenLastCalledWith(6);
    expect(frames.every((frame) => /^X\d+$/.test(frame))).toBe(true);
  });

  it('counts a zero as zeros', () => {
    expect(new Set(countFrames(0, RO))).toEqual(new Set(['0']));
  });

  it.each([6.5, -1, Number.NaN, -0])(
    'refuses %s — a count only of whole numbers ≥ 0, before the formatter runs (G2-R2 tier 2, typescript F1)',
    (value) => {
      // 6.5 would settle on 6 and then jump to „6,5"; -1 would print „-0" on
      // the way; NaN would print „NaN" 46 times; -0 passes both
      // `Number.isInteger` and `< 0`, yet Intl prints it „-0" on every frame.
      // On the server, the throw stops `next build` at the bad tile.
      const format = vi.fn(RO);
      // A template literal prints -0 as "0"; the message must not.
      const printed = Object.is(value, -0) ? '-0' : String(value);

      expect(() => countFrames(value, format)).toThrow(RangeError);
      expect(() => countFrames(value, format)).toThrow(
        `countFrames: value must be an integer ≥ 0, got ${printed}`,
      );
      expect(format).not.toHaveBeenCalled();
    },
  );
});

describe('DoctorStats — container steps only, one island (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s', () => {
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

  it('ships NO client directive — only ./StatNumber is an island', () => {
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b/);
    expect(CODE).not.toMatch(/next-intl/);
    expect(CODE).not.toMatch(/\bIntl\./);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports react, TintedBand, SectionHeading, Heading, Text and ./StatNumber — nothing else', () => {
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './StatNumber',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/sections/TintedBand/TintedBand',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Text/Text',
      'react',
    ]);
    // No lib DATA — a DUMB band knows no doctor (the round-1 ledger's D1).
    expect(CODE).not.toMatch(/@\/lib\//);
    // No glyph — the icons arrive as props (D30).
    expect(CODE).not.toMatch(/@\/assets\//);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('hands the island only serializable props — no function crosses', () => {
    // A function cannot cross a server→client boundary (ReviewsCarousel's
    // precedent and its guard): the <StatNumber …/> element receives strings.
    const element = CODE.slice(
      CODE.indexOf('<StatNumber'),
      CODE.indexOf('/>', CODE.indexOf('<StatNumber')),
    );

    expect(element).toContain('frames={countFrames(');
    expect(element).not.toContain('=>');
    expect(element).not.toMatch(/=\{format\}/);
    // The spoken form crosses FINISHED, decided by the tile's suffix; the
    // word never crosses on its own (round 2s).
    expect(element).toMatch(/\bspoken=\{\s*tile\.suffix\s*\?/);
    expect(element).not.toMatch(/\batLeast=\{/);
  });

  it('renders nothing interactive and no message key path (§8.1)', () => {
    const { container } = renderBand();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('DoctorStats — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    expectTypeOf<DoctorStatsProps>().toHaveProperty('eyebrow');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('title');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('lead');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('tiles');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('format');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('atLeast');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('className');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('ref');
    expectTypeOf<DoctorStatsProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorStatsProps['tiles']>().toEqualTypeOf<
      readonly DoctorStatTile[]
    >();
    expectTypeOf<DoctorStatsProps['format']>().toEqualTypeOf<
      (value: number) => string
    >();
    expectTypeOf<DoctorStatsProps['atLeast']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorStatTile['value']>().toEqualTypeOf<number>();
    expectTypeOf<DoctorStatTile['suffix']>().toEqualTypeOf<
      string | undefined
    >();
  });

  it('refuses the names, the slot and the shapes the types exist to refuse', () => {
    // Never rendered: `tsc --noEmit` fails if the props loosen. Every bad
    // shape stays on ONE line (DoctorCourses.test.tsx's TS2578 finding).
    const BAND = {
      eyebrow: EYEBROW,
      title: TITLE,
      lead: LEAD,
      tiles: TILES,
      format: RO,
      atLeast: AT_LEAST,
    };
    const TILE_SHAPE = TILES[0];

    // @ts-expect-error — content arrives as props; nested children would vanish
    const nested: DoctorStatsProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band's name is its <h2>'s text alone
    const renamed: DoctorStatsProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's
    const repaired: DoctorStatsProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — the value is a number; the page's formatter makes it text
    const textual: DoctorStatTile = { ...TILE_SHAPE, value: '6' };
    // @ts-expect-error — the formatter is REQUIRED; the band never formats
    const unformatted: DoctorStatsProps = {
      eyebrow: EYEBROW,
      title: TITLE,
      lead: LEAD,
      tiles: TILES,
      atLeast: AT_LEAST,
    };
    // @ts-expect-error — the spoken word is REQUIRED; the band invents none (round 2s)
    const wordless: DoctorStatsProps = {
      eyebrow: EYEBROW,
      title: TITLE,
      lead: LEAD,
      tiles: TILES,
      format: RO,
    };

    expect([
      nested,
      renamed,
      repaired,
      textual,
      unformatted,
      wordless,
    ]).toHaveLength(6);
  });
});
