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
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import { containerClasses } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import {
  DoctorStats,
  countFrames,
  spokenNumber,
  type DoctorStatTile,
  type DoctorStatsAlign,
  type DoctorStatsGround,
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
//
// ── THE SECOND PAGE (owner, 2026-10-01 — DoctorStats.tsx's SECOND PAGE
// paragraph): the same band on Home and on the Team page, three settings
// apart — `ground="page"`, `align="start"`, no `lead` — over THREE tiles. Each
// setting is pinned on its own below; the defaults are pinned to the doctor
// page's markup to the byte (`ground="tint" align="center"` renders exactly
// what no setting renders, so that page's call did not move, §6.6); and what
// stands INSIDE the ground — the rhythm box, the opener, the tiles — is held
// to be one code path on both grounds. HOME_TILES is TILES without the courses
// tile: the clinic's three drawings in the clinic's order (lib/team's
// `clinicStats`, which stays out of this suite for the reason above). And the
// glyphs are LILAC since that day (the owner: "paint it's svgs lilla"): the
// disc's pin below wears `text-accent-decorative`, and no `text-cta` may come
// back anywhere in the band.

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

/** Home's and the Team page's three — experience, patients, procedures (the
 *  owner's "just 3 components"), in that order: TILES without the courses
 *  tile, so every word is one the doctor page's tiles already print. */
const HOME_TILES = [
  TILES[0],
  TILES[1],
  TILES[3],
] as const satisfies readonly DoctorStatTile[];

/** The two grounds and the two alignments, spelled once for the loops below;
 *  the type pins at the end prove they are ALL of each union. */
const GROUNDS = [
  'tint',
  'page',
] as const satisfies readonly DoctorStatsGround[];
const ALIGNS = [
  'center',
  'start',
] as const satisfies readonly DoctorStatsAlign[];

/** The page's formatter for Romanian (§8.3) — „3.000", „1.000". */
const RO = (value: number): string => new Intl.NumberFormat('ro').format(value);

/** The page's `team.doctor.stats.atLeast` word in Romanian (round 2s). */
const AT_LEAST = 'peste';

/** The four final numbers as the visitor SEES them: the sign kept. */
const FINALS = ['6+', '3.000+', '10', '1.000+'];

/** …and as a screen reader SAYS them (round 2s): the page's word before the
 *  page's number on a „+" tile, the number alone on the exact count. */
const SPOKEN = ['peste 6', 'peste 3.000', '10', 'peste 1.000'];

// ── THE BYTE PINS — this band's OWN class strings. The opener, the lead and
// the list are assembled by lib/cx since 2026-10-01 (the base, then what the
// setting adds), so their tokens read in that order.
const RHYTHM_BOX = 'flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20';
/** The opener, centred as a box — the doctor page (the default `align`). */
const OPENER = 'flex max-w-3xl flex-col gap-4 mx-auto';
/** …and at the column's start — Home and the Team page (`align="start"`). */
const OPENER_START = 'flex max-w-3xl flex-col gap-4';
/** The lead, centred on its own <p> (the default `align`)… */
const LEAD_CLASSES = 'text-lg text-ink-muted wrap-anywhere text-center';
/** …and on the base rule's `text-align: start` (`align="start"`). */
const LEAD_START = 'text-lg text-ink-muted wrap-anywhere';
/** The list for any count but three — the doctor page's measured steps. */
const FOUR_TILE_GRID =
  'grid gap-10 @3xl:gap-8 @md:grid-cols-2 @3xl:grid-cols-4';
/** The list for THREE tiles — one column, all three across from `@xl`. */
const THREE_TILE_GRID = 'grid gap-10 @3xl:gap-8 @xl:grid-cols-3';
const TILE = 'flex flex-col items-center gap-4';
const DISC =
  '-order-2 flex size-28 items-center justify-center rounded-full border border-line bg-surface text-accent-decorative [&_svg]:size-12';

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

/** The band's three settings (the header's SECOND PAGE), each passed ONLY
 *  when its key is present — so `{}` is the doctor page's call minus its lead,
 *  and `{ ground: 'page', align: 'start', tiles: HOME_TILES }` is Home's. */
type Settings = Placement &
  Readonly<{
    ground?: DoctorStatsGround;
    align?: DoctorStatsAlign;
    lead?: string;
    tiles?: readonly DoctorStatTile[];
  }>;

const renderSettings = ({ tiles = TILES, ...settings }: Settings = {}) =>
  render(
    <DoctorStats
      eyebrow={EYEBROW}
      title={TITLE}
      tiles={tiles}
      format={RO}
      atLeast={AT_LEAST}
      {...settings}
    />,
  );

/** The band exactly as Home and the Team page mount it: the page ground, the
 *  opener at the start, no lead, three tiles. */
const HOME = {
  ground: 'page',
  align: 'start',
  tiles: HOME_TILES,
} as const satisfies Settings;

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

/** The opener's three boxes, outward from the band's one <h2>: SectionHeading's
 *  root, the capped opener box around it, the rhythm box around that. One band
 *  per test, so the <h2> is the screen's. */
const sectionHeadingOf = (): HTMLElement =>
  screen.getByRole('heading', { level: 2 }).parentElement as HTMLElement;
const openerOf = (): HTMLElement =>
  sectionHeadingOf().parentElement as HTMLElement;
const rhythmOf = (): HTMLElement => openerOf().parentElement as HTMLElement;

/**
 * What a band holds INSIDE its ground — the rhythm box's markup, read off one
 * render's own container (two bands may share the screen) — with the one
 * generated id taken out: React's useId numbers every mount anew, and the id is
 * the one byte of the content that is allowed to differ.
 */
const contentHtml = (container: HTMLElement): string => {
  const rhythm =
    container.querySelector('h2')?.parentElement?.parentElement?.parentElement;
  if (!rhythm) throw new Error('no rhythm box around the band’s <h2>');
  const copy = rhythm.cloneNode(true) as HTMLElement;
  copy.querySelector('h2')?.removeAttribute('id');
  return copy.outerHTML;
};

/** `count` tiles with unique ids — TILES' first ones, and for five a fifth
 *  that is the first again under a key of its own (no list ships five; the
 *  type allows them, and the steps must still say what they do). */
const tilesOfCount = (count: 1 | 2 | 3 | 4 | 5): readonly DoctorStatTile[] =>
  count === 5
    ? [...TILES, { ...TILES[0], id: 'fifth' }]
    : TILES.slice(0, count);

/** The island's twin — its `data-spoken` mark (StatNumber.tsx's THE TWIN;
 *  the `sr-only` class until 2026-10-01, when the twin moved onto the digits). */
const TWIN = '[data-spoken]';

/**
 * A tile's number <p>, found by what it CARRIES and never by its index among
 * the tile's children (that order is the DOM-order case's to pin, and it
 * moved once, G2-R2 tier 2): the island's twin, the tile's one `data-spoken`
 * text, which always holds a digit — the <p> is its one paragraph ancestor
 * (the island's own box sits between them since 2026-10-01).
 */
const numberOf = (item: HTMLElement): HTMLElement =>
  within(item).getByText(/\d/, { selector: TWIN }).closest('p') as HTMLElement;

/** The number <p>'s two spans — the visible count and the twin — through the
 *  island's own box. */
const partsOf = (number: HTMLElement): HTMLElement[] =>
  [...(number.firstElementChild as HTMLElement).children] as HTMLElement[];

/** The order utilities an element wears, `-order-2` and friends. */
const ordersOf = (element: Element): string[] =>
  tokensOf(element).filter((token) => /(^|:)-?order-/.test(token));

/** Each tile's two number texts in DOM order: what is SEEN (the aria-hidden
 *  span) and what is HEARD (the twin laid over it). */
const numberTexts = (): { seen: string[]; heard: string[] } => {
  const pairs = tilesOf().map((item) => {
    const [visible, twin] = partsOf(numberOf(item));
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

describe('DoctorStats — composes sections/TintedBand on the default ground, the doctor page’s (D29)', () => {
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

describe('DoctorStats — the defaults ARE the doctor page (§6.6)', () => {
  it('renders `ground="tint" align="center"` byte for byte as no setting at all — that page’s call did not move', () => {
    // renderToString IS the static export's render, and it numbers useId by
    // the tree's shape, so two identical trees print identical ids: the
    // comparison is the whole server HTML, every byte of it.
    const doctorPage = {
      eyebrow: EYEBROW,
      title: TITLE,
      lead: LEAD,
      tiles: TILES,
      format: RO,
      atLeast: AT_LEAST,
    };

    expect(
      renderToString(
        <DoctorStats {...doctorPage} ground="tint" align="center" />,
      ),
    ).toBe(renderToString(<DoctorStats {...doctorPage} />));
  });

  it.each(ALIGNS)(
    'lays ONE content on both grounds — the rhythm box, the opener and the tiles do not know where they stand (align %s)',
    (align) => {
      // The header's SECOND PAGE paragraph: "Everything else … is one code
      // path on both pages." The ground is the only difference between the
      // two shapes; what it holds is the same markup to the byte.
      const tint = renderSettings({ ground: 'tint', align, lead: LEAD });
      const page = renderSettings({ ground: 'page', align, lead: LEAD });

      expect(contentHtml(page.container)).toBe(contentHtml(tint.container));
    },
  );
});

describe('DoctorStats — the PAGE ground, Home’s and the Team page’s (owner, 2026-10-01)', () => {
  it('is a bare <section> on the page ground — `bg-page` and nothing else — the caller className merged LAST (§6.8)', () => {
    // The other Home bands' outer (DoctorShowcase, TeamRoster, ClinicLocation
    // — ui/Container's page-BAND recipe): full-bleed, the paint and nothing
    // else, no gutter and no outer margin (§6.4).
    const { container } = renderSettings(HOME);
    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe('bg-page');

    const { container: placed } = renderSettings({
      ...HOME,
      className: 'scroll-mt-10',
    });
    expect(bandOf(placed).className).toBe('bg-page scroll-mt-10');
  });

  it('holds ui/Container as its ONE child and the rhythm box first inside it — no tint, no fade: no TintedBand at all', () => {
    const { container } = renderSettings(HOME);
    const band = bandOf(container);

    expect(band.children).toHaveLength(1);
    const column = band.firstElementChild as HTMLElement;
    expect(column.tagName).toBe('DIV');
    expect(column.className).toBe(containerClasses);
    expect(column.children).toHaveLength(1);
    expect(column.firstElementChild).toBe(rhythmOf());
    expect(rhythmOf().className).toBe(RHYTHM_BOX);
    expect(rhythmOf().children).toHaveLength(2);
    expect(rhythmOf().lastElementChild).toBe(screen.getByRole('list'));

    // TintedBand's tells, each absent: its two aria-hidden fades (every
    // aria-hidden box left is a tile's disc or a number's visible span), its
    // `relative`, the `--tint` variable and the gradients that paint with it.
    for (const hidden of band.querySelectorAll('[aria-hidden="true"]')) {
      expect(hidden.closest('li')).not.toBeNull();
    }
    expect(tokensOf(band)).not.toContain('relative');
    expect(band.outerHTML).not.toContain('--tint');
    expect(band.outerHTML).not.toContain('linear-gradient');
  });

  it('is still a region named by its own <h2> through a generated id', () => {
    const { container } = renderSettings(HOME);

    const band = screen.getByRole('region', { name: TITLE });
    expect(band).toBe(bandOf(container));
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading.id).toBeTruthy();
    expect(band).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    renderSettings({ ...HOME, ref: band });

    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toBe(screen.getByRole('region', { name: TITLE }));
  });

  it('spreads remaining native props onto the section, the name pair intact', () => {
    const { container } = render(
      <DoctorStats
        ground="page"
        align="start"
        eyebrow={EYEBROW}
        title={TITLE}
        tiles={HOME_TILES}
        format={RO}
        atLeast={AT_LEAST}
        id="in-cifre"
        lang="de"
        data-slot="clinic-stats"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('id', 'in-cifre');
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('data-slot', 'clinic-stats');
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute(
      'id',
      'in-cifre',
    );
  });

  it.each(GROUNDS)(
    'keeps its own name on the %s ground when a caller WRITES `aria-labelledby` in JSX — the spread rides first',
    (ground) => {
      // TypeScript exempts a hyphenated JSX attribute from its excess-property
      // check, so the attribute below COMPILES despite the Omit (the
      // DoctorShowcase finding, G2 react 2026-09-30). The band's own pair
      // rides AFTER `{...rest}` on both grounds, so the caller's loses.
      const { container } = render(
        <DoctorStats
          ground={ground}
          eyebrow={EYEBROW}
          title={TITLE}
          tiles={TILES}
          format={RO}
          atLeast={AT_LEAST}
          aria-labelledby="nowhere"
        />,
      );

      const band = bandOf(container);
      const heading = screen.getByRole('heading', { level: 2, name: TITLE });
      expect(band).toHaveAttribute('aria-labelledby', heading.id);
      expect(screen.getByRole('region', { name: TITLE })).toBe(band);
    },
  );
});

describe('DoctorStats — the opener’s alignment (owner, 2026-10-01: "left alligned as other headings nad eyebrows on main page")', () => {
  it.each(ALIGNS)(
    'hands sections/SectionHeading the band’s `align` — its root is exactly a rendered SectionHeading’s (%s)',
    (align) => {
      // Derived, never retyped: SectionHeading's ALIGN map is its own — and
      // so is its className merge, which carries the band's two additions,
      // `hyphens-none` and its belt `wrap-anywhere` (the header's TITLE
      // paragraph, 2026-10-01).
      const expected = classOfRendered(
        <SectionHeading
          level={2}
          eyebrow={EYEBROW}
          title={TITLE}
          align={align}
          className="hyphens-none wrap-anywhere"
        />,
      );
      renderSettings({ align });

      expect(sectionHeadingOf().className).toBe(expected);
    },
  );

  it('starts SectionHeading’s lines and box with align="start" — `items-start text-start`, never a centring token', () => {
    renderSettings({ align: 'start' });
    const tokens = tokensOf(sectionHeadingOf());

    expect(tokens).toEqual(
      expect.arrayContaining(['items-start', 'text-start']),
    );
    expect(tokens).not.toContain('items-center');
    expect(tokens).not.toContain('text-center');
  });

  it('leaves the capped opener box at the column’s start with align="start" — `max-w-3xl`, no `mx-auto`', () => {
    renderSettings({ align: 'start', lead: LEAD });
    const opener = openerOf();

    expect(opener.className).toBe(OPENER_START);
    expect(tokensOf(opener)).toContain('max-w-3xl');
    expect(tokensOf(opener)).not.toContain('mx-auto');
  });

  it('centres NOTHING in the opener with align="start" — a lead keeps the base rule’s `text-align: start`', () => {
    renderSettings({ align: 'start', lead: LEAD });
    const opener = openerOf();

    for (const element of [opener, ...opener.querySelectorAll('*')]) {
      expect(tokensOf(element)).not.toContain('text-center');
      expect(tokensOf(element)).not.toContain('mx-auto');
    }
    const lead = screen.getByText(LEAD);
    expect(lead.tagName).toBe('P');
    expect(lead.parentElement).toBe(opener);
    expect(lead.className).toBe(LEAD_START);
  });

  it('leaves the TILES centred whichever way the opener lines up — the owner named the eyebrow and the title', () => {
    for (const align of ALIGNS) {
      const { unmount } = renderSettings({ align, lead: LEAD });
      for (const item of tilesOf()) {
        expect(item.className).toBe(TILE);
        expect(
          tokensOf(within(item).getByRole('heading', { level: 3 })),
        ).toContain('text-center');
        expect(tokensOf(numberOf(item))).toContain('text-center');
        expect(tokensOf(item.lastElementChild as HTMLElement)).toContain(
          'text-center',
        );
      }
      unmount();
    }
  });
});

describe('DoctorStats — the lead is optional (owner, 2026-10-01: "without this … so dorp that part")', () => {
  it.each([
    ['absent', 'center', {}],
    ['absent', 'start', {}],
    ['empty', 'center', { lead: '' }],
    ['empty', 'start', { lead: '' }],
  ] as const)(
    'renders no <p> when the lead is %s (align %s) — the opener holds SectionHeading alone',
    (_, align, settings) => {
      renderSettings({ align, ...settings });
      const opener = openerOf();

      expect(opener.children).toHaveLength(1);
      expect(opener.firstElementChild).toBe(sectionHeadingOf());
      // The one <p> left in the opener is SectionHeading's eyebrow.
      expect(
        [...opener.querySelectorAll('p')].map((p) => p.textContent),
      ).toEqual([EYEBROW]);
      expect(screen.queryByText(LEAD)).toBeNull();
      // The rhythm box still holds the opener and the list, nothing between.
      expect(rhythmOf().children).toHaveLength(2);
      expect(rhythmOf().lastElementChild).toBe(screen.getByRole('list'));
    },
  );

  it('renders Home’s band — the page ground, the start, no lead — with its eyebrow over its <h2> and nothing under them', () => {
    renderSettings(HOME);

    expect(within(openerOf()).getByText(EYEBROW).tagName).toBe('P');
    expect(openerOf().children).toHaveLength(1);
    expect(openerOf().className).toBe(OPENER_START);
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent),
    ).toEqual(HOME_TILES.map((tile) => tile.label));
  });
});

describe('DoctorStats — the tiles (D30)', () => {
  it('renders ONE list with one item per tile, in the page’s order', () => {
    renderBand();

    const list = screen.getByRole('list');
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(list.className).toBe(FOUR_TILE_GRID);

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

  it.each(GROUNDS)(
    'paints the icon inside an aria-hidden disc, the glyph sized by the parent — on the %s ground',
    (ground) => {
      renderSettings({ ground });

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
    },
  );

  it.each(GROUNDS)(
    'paints every glyph in the decorative LILAC and nothing in the CTA green — on the %s ground (owner, 2026-10-01: "paint it’s svgs lilla")',
    (ground) => {
      // The glyph strokes with `currentColor`, so the disc's ink IS the
      // drawing's colour: §15.1's graphics role, `accent-decorative` — never
      // `--accent`, the menu buttons' lavender, which the accent census bars
      // from every band that composes TintedBand.
      const { container } = renderSettings({ ground });

      for (const item of tilesOf()) {
        const disc = item.firstElementChild as HTMLElement;
        expect(tokensOf(disc)).toContain('text-accent-decorative');
        expect(disc.firstElementChild).toHaveAttribute(
          'stroke',
          'currentColor',
        );
      }
      // The green is gone from the markup, in any variant spelling…
      for (const element of container.querySelectorAll('*')) {
        expect(
          tokensOf(element).some((token) => /(^|:)text-cta(\/|$)/.test(token)),
        ).toBe(false);
      }
    },
  );

  it('keeps the CTA green out of the band’s SOURCE too — no `text-cta` left to come back through a branch', () => {
    expect(CODE).not.toMatch(/\btext-cta\b/);
    // …and the lilac is spelled exactly once, on the disc.
    expect(CODE.match(/\btext-accent-decorative\b/g)).toHaveLength(1);
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
      const [visible, twin] = partsOf(numberOf(item));
      expect(visible).toHaveAttribute('aria-hidden', 'true');
      expect(twin).toHaveAttribute('data-spoken', '');
      expect(twin.className).toBe(
        'absolute inset-0 overflow-hidden whitespace-nowrap opacity-0 select-none',
      );
    }
    // The count is held still in this suite, so the visible span is final.
    expect(numberTexts().seen).toEqual(FINALS);
  });

  it('says the SPOKEN final in the twin: the page’s `atLeast` word before the page’s number on a „+" tile, the number alone otherwise (round 2s)', () => {
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

    const twins = [...host.querySelectorAll(`li ${TWIN}`)];
    expect(twins.map((twin) => twin.textContent)).toEqual(SPOKEN);
    const visibles = [...host.querySelectorAll('li p [aria-hidden="true"]')];
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

  it.each([
    // [the shape, its settings, does SectionHeading centre, is a lead there]
    ['the doctor page (centre, a lead)', { lead: LEAD }, true, true],
    ['centre without a lead', {}, true, false],
    ['the start with a lead', { align: 'start', lead: LEAD }, false, true],
    [
      'Home and the Team page (page ground, start, no lead)',
      HOME,
      false,
      false,
    ],
  ] as const)(
    'centres prose ONLY on the elements themselves (§15.15 b) — %s',
    (_, settings, headingCentres, hasLead) => {
      const { container } = renderSettings(settings);

      const centred = [...container.querySelectorAll('*')].filter((element) =>
        tokensOf(element).includes('text-center'),
      );
      const lead = within(bandOf(container)).queryByText(LEAD);
      expect(lead !== null).toBe(hasLead);
      const expected = [
        // SectionHeading's root, when its `align` is "center".
        ...(headingCentres ? [sectionHeadingOf()] : []),
        // The lead, when there is one AND the opener is centred: a lead under
        // a start-aligned title keeps the base rule's `text-align: start`.
        ...(headingCentres && lead ? [lead] : []),
        // In DOM order, which is the order querySelectorAll walks (G2-R2
        // tier 2, a11y F1): the <h3>, then the number <p>, then the sentence
        // — on every page, whichever way the opener lines up.
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
    },
  );

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
    expect(screen.getByRole('list').className).toBe(FOUR_TILE_GRID);
  });
});

describe('DoctorStats — the rows, by count (`rowsFor`, the header’s STEPS paragraph)', () => {
  it.each(GROUNDS)(
    'gives THREE tiles a row of their own on the %s ground — one column, all three across from the container’s @xl, never two and one',
    (ground) => {
      renderSettings({ ground, tiles: HOME_TILES });
      const list = screen.getByRole('list');

      expect(list.className).toBe(THREE_TILE_GRID);
      // Neither four-tile step: at `@md` they would put two tiles on a row
      // and leave the third alone beside half a band of nothing.
      expect(tokensOf(list)).not.toContain('@md:grid-cols-2');
      expect(tokensOf(list)).not.toContain('@3xl:grid-cols-4');
      expect(tilesOf()).toHaveLength(3);
    },
  );

  it.each([1, 2, 4, 5] as const)(
    'keeps the doctor page’s measured steps for %i tile(s) — two from @md, four from @3xl, never the three-tile row',
    (count) => {
      renderSettings({ tiles: tilesOfCount(count) });
      const list = screen.getByRole('list');

      expect(tilesOf()).toHaveLength(count);
      expect(list.className).toBe(FOUR_TILE_GRID);
      expect(tokensOf(list)).not.toContain('@xl:grid-cols-3');
    },
  );

  it.each([1, 2, 3, 4, 5] as const)(
    'spaces %i tile(s) `gap-10`, `gap-8` from @3xl, whatever the count',
    (count) => {
      renderSettings({ tiles: tilesOfCount(count) });
      const tokens = tokensOf(screen.getByRole('list'));

      expect(tokens.slice(0, 3)).toEqual(['grid', 'gap-10', '@3xl:gap-8']);
    },
  );
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

describe('DoctorStats — the ear’s spaces (`spokenNumber`, the a11y review of 2026-10-01 and its re-review)', () => {
  /** French groups thousands with U+202F, the narrow no-break space. */
  const FR = (value: number): string =>
    new Intl.NumberFormat('fr').format(value);
  /** Spelled as escapes: the two characters are invisible in an editor. */
  const NNBSP = '\u202f';
  const NBSP = '\u00a0';

  it('drops every grouping SPACE between two digits — the narrow no-break space and the no-break space alike', () => {
    expect(spokenNumber(8000, () => `8${NNBSP}000`)).toBe('8000');
    expect(spokenNumber(8000, () => `8${NBSP}000`)).toBe('8000');
    expect(spokenNumber(1_000_000, () => `1${NNBSP}000${NNBSP}000`)).toBe(
      '1000000',
    );
  });

  it('touches no other space — none outside two digits, and never a plain one', () => {
    expect(spokenNumber(8, () => `≈${NBSP}8`)).toBe(`≈${NBSP}8`);
    expect(spokenNumber(8, () => `8${NNBSP}%`)).toBe(`8${NNBSP}%`);
    expect(spokenNumber(8, () => '8 000')).toBe('8 000');
  });

  it('leaves every other formatter output exactly as the page made it', () => {
    expect(spokenNumber(8000, RO)).toBe(RO(8000)); // „8.000"
    expect(spokenNumber(8000, (value) => `X${value}`)).toBe('X8000');
    expect(spokenNumber(10, RO)).toBe('10');
  });

  it('hears French as ONE number while the eye keeps the page’s own spacing', () => {
    // The fixture's 3000 in French: „3 000" on screen (U+202F, the page's
    // formatter untouched), « plus de 3000 » in the twin — the way the tiles'
    // own sentences write it.
    renderBand({}, TILES, FR, 'plus de');
    const { seen, heard } = numberTexts();
    expect(seen[1]).toBe(`3${NNBSP}000+`);
    expect(heard[1]).toBe('plus de 3000');
    expect(heard.join('')).not.toMatch(/[\u00a0\u202f]/);
  });
});

describe('DoctorStats — the title never splits a word (the a11y review of 2026-10-01)', () => {
  it.each([
    ['tint', 'center'],
    ['page', 'start'],
  ] as const)(
    'wraps the %s ground’s %s-aligned title between words only — `hyphens-none` on SectionHeading’s root, inherited by the <h2>, with `wrap-anywhere` as its belt',
    (ground, align) => {
      render(
        <DoctorStats
          eyebrow={EYEBROW}
          title={TITLE}
          tiles={TILES}
          format={RO}
          atLeast={AT_LEAST}
          ground={ground}
          align={align}
        />,
      );
      const title = screen.getByRole('heading', { level: 2 });
      const root = title.parentElement as HTMLElement;
      // The class on the root; the property inherits to the <h2> (this suite
      // loads no stylesheet — the Default story's play reads it computed).
      expect(tokensOf(root)).toContain('hyphens-none');
      // The belt (the Opus re-review): a word too long for a line by itself —
      // a large default text size, a 200 % zoom — breaks rather than pushing
      // the page sideways, now that hyphenation no longer can.
      expect(tokensOf(root)).toContain('wrap-anywhere');
      // …and nothing else in the band opted out by the same class: the tile
      // labels carry their own (the TILES paragraph), the prose keeps §15.14.
      for (const paragraph of document.querySelectorAll('li p:not(:has(*))'))
        expect(tokensOf(paragraph)).not.toContain('hyphens-none');
    },
  );
});

describe('DoctorStats — container steps only, one island (§6.5, §16)', () => {
  it.each([
    ['the doctor page', { lead: LEAD }],
    ['Home and the Team page', HOME],
  ] as const)(
    'carries no media queries anywhere — those are the page’s (%s)',
    (_, settings) => {
      const { container } = renderSettings(settings);

      for (const element of [
        bandOf(container),
        ...container.querySelectorAll('*'),
      ]) {
        for (const token of tokensOf(element)) {
          expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
          expect(token).not.toMatch(/(min|max)-\[/);
        }
      }
    },
  );

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

  it('imports react, TintedBand, SectionHeading, Container, Heading, Text, lib/cx and ./StatNumber — nothing else', () => {
    // ui/Container and lib/cx arrived with the PAGE ground (2026-10-01): the
    // other Home bands' outer is a <section> around ui/Container, and the
    // settings assemble the opener's, the lead's and the list's classes.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './StatNumber',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/sections/TintedBand/TintedBand',
      '@/components/ui/Container/Container',
      '@/components/ui/Heading/Heading',
      '@/components/ui/Text/Text',
      '@/lib/cx/cx',
      'react',
    ]);
    // No lib DATA — a DUMB band knows no doctor and no clinic (the round-1
    // ledger's D1): the one module it takes from lib/ is the class-join
    // MECHANIC, and no locale reaches it either.
    expect(
      specifiers.filter((specifier) => specifier.startsWith('@/lib/')),
    ).toEqual(['@/lib/cx/cx']);
    expect(CODE).not.toMatch(/@\/i18n\//);
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

  it('pins the three settings of the SECOND PAGE: an optional lead, two grounds, two alignments', () => {
    expectTypeOf<DoctorStatsProps>().toHaveProperty('ground');
    expectTypeOf<DoctorStatsProps>().toHaveProperty('align');
    // `lead` is OPTIONAL since 2026-10-01 — Home passes none.
    expectTypeOf<DoctorStatsProps['lead']>().toEqualTypeOf<
      string | undefined
    >();
    // Exactly the two grounds and the two alignments — and the lists the
    // loops above walk are ALL of each union, no member left untested.
    expectTypeOf<DoctorStatsGround>().toEqualTypeOf<'tint' | 'page'>();
    expectTypeOf<DoctorStatsAlign>().toEqualTypeOf<'center' | 'start'>();
    expectTypeOf<(typeof GROUNDS)[number]>().toEqualTypeOf<DoctorStatsGround>();
    expectTypeOf<(typeof ALIGNS)[number]>().toEqualTypeOf<DoctorStatsAlign>();
    expectTypeOf<DoctorStatsProps['ground']>().toEqualTypeOf<
      DoctorStatsGround | undefined
    >();
    expectTypeOf<DoctorStatsProps['align']>().toEqualTypeOf<
      DoctorStatsAlign | undefined
    >();
  });

  it('accepts the band without a lead — the shape Home and the Team page pass', () => {
    // Never rendered: these COMPILE, and that is the assertion — no directive
    // stands over them, so a lead made required again fails `tsc`.
    const leadless: DoctorStatsProps = {
      eyebrow: EYEBROW,
      title: TITLE,
      tiles: HOME_TILES,
      format: RO,
      atLeast: AT_LEAST,
    };
    const home: DoctorStatsProps = {
      ...leadless,
      ground: 'page',
      align: 'start',
    };

    expect([leadless, home]).toHaveLength(2);
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
    // @ts-expect-error — two grounds: TintedBand's 'tint' and the plain 'page'
    const tinted: DoctorStatsProps = { ...BAND, ground: 'tinted' };
    // @ts-expect-error — SectionHeading's two answers: 'center' and 'start'
    const ended: DoctorStatsProps = { ...BAND, align: 'end' };
    // @ts-expect-error — a lead is a finished sentence or nothing, never a flag
    const flagged: DoctorStatsProps = { ...BAND, lead: false };

    expect([
      nested,
      renamed,
      repaired,
      textual,
      unformatted,
      wordless,
      tinted,
      ended,
      flagged,
    ]).toHaveLength(9);
  });
});
