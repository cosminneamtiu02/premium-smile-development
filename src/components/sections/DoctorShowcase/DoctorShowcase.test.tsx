import { createRef, type ReactNode, type Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, waitFor, within } from '@testing-library/react';
import { page, userEvent as realUser } from 'vitest/browser';
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
// The REAL stylesheet, for ONE describe block since 2026-10-01 (D10): THE
// SCALE, measured — the band's design pixel is a registered length computed
// against the Container's width, and only an engine can say what every box
// inside it comes to. tests/setup/components.ts loads no CSS globally; the
// per-file import is the house pattern (Card, Ribbon, PersonnelCard …). The
// STYLES note below says what it changes for the rest of the file: nothing.
import '@/styles/globals.css';
import {
  PersonnelCard,
  type PersonnelLink,
  type PersonnelPhoto,
  type PersonnelSide,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { containerClasses } from '@/components/ui/Container/Container';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import { Ribbon, RibbonStation } from '@/components/ui/Ribbon/Ribbon';
import { gaugeRule, lanes, UNIT_PX } from '@/lib/ribbon-model/ribbon-model';
import {
  DoctorShowcase,
  type DoctorShowcaseDoctor,
  type DoctorShowcaseProps,
} from './DoctorShowcase';
import source from './DoctorShowcase.tsx?raw';

// sections/DoctorShowcase — the interaction suite. Role-based queries wherever
// a role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this band is almost nothing BUT structure — a `region` named by
// its own <h2> (D2), ONE `list` whose items are the doctors (D3), one
// `article` per doctor named by an <h3> (D6), one link per card — plus the one
// loading decision it makes, the first card's picture on the first screen (D9).
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// DoctorCourses / PersonnelCard precedent). next-intl's hooks throw without
// one, so a green render proves D1: the band owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have translated —
// Romanian with diacritics (§15.7), demo people, factual words (CMSR: no
// superlative, no promise of a result).
//
// ── STYLES: the project loads none (tests/setup/components.ts imports no
// stylesheet), and until 2026-10-01 this file loaded none either, so the
// utility TOKENS and the DOM are the contract almost everywhere here. Since
// D10 the file imports globals.css (top of file) for ONE describe block, "THE
// SCALE, measured", the last: the band's design pixel is a COMPUTED length,
// and every length inside the band follows it. Every other assertion still
// reads tokens, attributes and roles — none reads a computed value, so each
// holds with the sheet or without it. With the sheet the ribbon's colour
// tokens can be read, so its guard no longer refuses every ribbon here (the
// one line this file kept out of the log until then is gone with its reason);
// a ribbon that IS refused says so on the console, and the measured block
// fails on it. What the drawing does is ui/Ribbon's own suite, and what this
// band looks like under it at the workbench's widths — the canvases sized,
// the picture beside the words on the right side of every card, no sideways
// scroll — is asserted one tier up, in DoctorShowcase.stories.tsx's play
// functions.
//
// ── NOTHING OF PersonnelCard IS RE-SPELLED HERE. Which way a card faces is
// read off the card itself: the same doctor rendered alone on one side, its
// tags and classes taken as the expectation (`referenceLook`) — the
// `buttonFace` / `restTitleClasses` idiom of the sibling suites — so the
// card's own lane may re-tune its rows without turning this suite red, while
// a band that stopped alternating, or passed the wrong level, still fails.
// ui/Ribbon's root is read the same way, off a bare server render.
//
// ── HARNESS NOTE — why a `process` shim, copied verbatim from
// PersonnelCard.test.tsx with its reason (which took it from Image.test.tsx).
// The `components` vitest project is bare Vite in a real chromium: no Next
// plugin, so nothing defines the `process` global. next/image reads
// process.env.__NEXT_IMAGE_OPTS at MODULE scope (image-component.js), so
// importing the real ExportedImage — which every card composes through
// ui/Image — throws "process is not defined" before a single test runs.
// vi.hoisted is the sanctioned pre-import seam (Vitest transforms static
// imports, so this really does execute first). Deliberately EMPTY env, not a
// copy of next.config.ts: with __NEXT_IMAGE_OPTS undefined next/image falls
// back to imageConfigDefault and the optimizer's own reads fall back to their
// documented defaults, i.e. the same shape the app ships.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

const EYEBROW = 'Familia Premium Smile';
const TITLE = 'Specialiștii cu care ne mândrim';
const LABEL = 'Mai multe despre mine';

/** The committed demo cutouts (900×1200, transparent — synthetic, no real
 *  person); only two exist, so the third doctor borrows the first. */
const CUTOUT_1: PersonnelPhoto = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};
const CUTOUT_2: PersonnelPhoto = {
  src: '/images/demo/cutout-2.png',
  width: 900,
  height: 1200,
};

/**
 * A doctor's words in three pieces — the key word where ui/Keyword's
 * `<Keywords>` would put it — so the expected TEXT is assembled from the same
 * pieces as the node the card quotes. Every part rides an expression
 * container, which keeps JSX's whitespace trimming out of the assertion.
 */
const words = (lead: string, keyword: string, tail: string) => ({
  text: `${lead}${keyword}${tail}`,
  node: (
    <>
      {lead}
      <Keyword>{keyword}</Keyword>
      {tail}
    </>
  ),
});

const ELENA = words(
  'Lucrez în ',
  'ortodonție',
  ' de peste zece ani și explic fiecare etapă a tratamentului.',
);
const ANDREI = words(
  'Mă ocup de ',
  'chirurgie orală',
  ': extracții și mici intervenții, cu pașii explicați dinainte.',
);
const CRISTINA = words(
  'Tratez canalele dinților la ',
  'microscop',
  ' și arăt radiografiile după fiecare etapă.',
);

const DOCTORS: readonly DoctorShowcaseDoctor[] = [
  {
    id: 'elena-marin',
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    photo: CUTOUT_1,
    about: ELENA.node,
    profile: { href: '/ro/team/elena-marin/', label: LABEL },
  },
  {
    id: 'andrei-serban',
    name: 'Dr. Andrei Șerban',
    position: 'Medic dentist, chirurgie orală',
    photo: CUTOUT_2,
    about: ANDREI.node,
    profile: { href: '/ro/team/andrei-serban/', label: LABEL },
  },
  {
    id: 'cristina-turcanu',
    name: 'Dr. Cristina Țurcanu',
    position: 'Medic dentist, endodonție',
    photo: CUTOUT_1,
    about: CRISTINA.node,
    profile: { href: '/ro/team/cristina-turcanu/', label: LABEL },
  },
];

/** Each doctor's quoted words as text, in DOCTORS' order. */
const TEXTS = [ELENA.text, ANDREI.text, CRISTINA.text];

/** The side every card should face, by index (D5): start, end, start. */
const SIDES: readonly PersonnelSide[] = ['start', 'end', 'start'];

/** The band's rhythm box, byte for byte (D4, D10): the standard band top, and
 *  NO bottom padding and NO gap — the ribbon's own head and tail room are the
 *  band's air above the first card and under the last — and THE SCALE behind
 *  its GATES: on a mouse or trackpad, in an engine that registers custom
 *  properties (`scalable:`), the cap, centred; and from the Container's `@4xl`
 *  step floored at 896px, the band's design pixel and every theme length
 *  measured in it. */
const RHYTHM_BOX =
  'mx-auto flex flex-col pt-12 @lg:pt-16 @3xl:pt-20 scalable:max-w-[96rem] scalable:@4xl:@min-[896px]:[--scale-px:calc(min(100cqw,96rem)/1106)] scalable:@4xl:@min-[896px]:design-scale';

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what the source pins
 * at the bottom run against (the DoctorCourses / PersonnelCard mechanism).
 * Without it those pins police the file's own documentation: the header
 * discusses `'use client'`, `t()` and the ribbon's island by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderBand = (
  placement: Placement = {},
  doctors: readonly DoctorShowcaseDoctor[] = DOCTORS,
) =>
  render(
    <DoctorShowcase
      eyebrow={EYEBROW}
      title={TITLE}
      doctors={doctors}
      {...placement}
    />,
  );

/** The band, TOLD whether it is on its page's first screen (D9) — `false`
 *  and `true` spelled out; `renderBand()` above is the prop left out. */
const renderOnScreen = (
  firstScreen: boolean,
  doctors: readonly DoctorShowcaseDoctor[] = DOCTORS,
) =>
  render(
    <DoctorShowcase
      eyebrow={EYEBROW}
      title={TITLE}
      doctors={doctors}
      firstScreen={firstScreen}
    />,
  );

/** Each card's picture, in the page's order — reached through its card, so a
 *  picture is always read as THAT doctor's (decorative, so `presentation`). */
const picturesOf = (container: HTMLElement): HTMLElement[] =>
  within(container)
    .getAllByRole('article')
    .map((card) => within(card).getByRole('presentation'));

/** The band, and the two boxes between it and its content — reached by
 *  structure, because neither carries a role of its own. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const columnOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const rhythmOf = (container: HTMLElement): HTMLElement =>
  columnOf(container).firstElementChild as HTMLElement;

/** Every element's tag and classes, in document order — a card's LOOK,
 *  without its words, its ids or its links' targets. */
const lookOf = (card: Element): string[] =>
  [card, ...card.querySelectorAll('*')].map(
    (element) => `${element.tagName} ${element.getAttribute('class') ?? ''}`,
  );

/**
 * The look of `doctor`'s card rendered ALONE, facing `side`, at the level
 * this band promises its names (D6) — read and unmounted inside the helper,
 * so nothing of it survives into the assertion's DOM. The expectation
 * follows sections/PersonnelCard wherever its lane takes the card.
 */
const referenceLook = (
  doctor: DoctorShowcaseDoctor,
  side: PersonnelSide,
): string[] => {
  const { container, unmount } = render(
    <PersonnelCard
      kind="doctor"
      headingLevel={3}
      side={side}
      name={doctor.name}
      position={doctor.position}
      photo={doctor.photo}
      about={doctor.about}
      profile={doctor.profile}
    />,
  );
  const look = lookOf(container.firstElementChild as Element);
  unmount();
  return look;
};

/** ui/Ribbon's own root, read off a bare SERVER render — no effect runs
 *  there, so nothing is drawn and nothing warns. */
const bareRibbonRoot = (): Element => {
  const host = document.createElement('div');
  host.innerHTML = renderToString(
    <Ribbon role="list">
      <RibbonStation role="listitem">
        <article />
      </RibbonStation>
    </Ribbon>,
  );
  return host.firstElementChild as Element;
};

describe('DoctorShowcase — a named region (D2)', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" too would be redundant ARIA (§9, semantic HTML first).
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

  it('opens with the eyebrow over the title, through sections/SectionHeading', () => {
    // The eyebrow is a <p> one tier down (ui/Eyebrow), asserted by TEXT so a
    // broken diacritic path fails here; it never enters the outline, so the
    // band's title is its only level-2 heading.
    const { container } = renderBand();

    const eyebrow = within(bandOf(container)).getByText(EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      eyebrow.compareDocumentPosition(
        screen.getByRole('heading', { level: 2 }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('generates the heading id — two bands on one page never collide', () => {
    render(
      <>
        <DoctorShowcase eyebrow={EYEBROW} title={TITLE} doctors={DOCTORS} />
        <DoctorShowcase
          eyebrow={EYEBROW}
          title="Medicii clinicii"
          doctors={DOCTORS.slice(0, 1)}
        />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Medicii clinicii' }),
    ).toBeInTheDocument();
  });

  it('stands on the page ground and merges the caller className LAST (§6.8)', () => {
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter, no outer margin (§6.4: the page owns the
    // rhythm between its bands).
    const { container } = renderBand();
    expect(bandOf(container).className).toBe('bg-page');

    const { container: placed } = renderBand({ className: 'scroll-mt-10' });
    expect(bandOf(placed).className).toBe('bg-page scroll-mt-10');
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

  it('spreads remaining native props onto the section, never over the name pair', () => {
    const { container } = render(
      <DoctorShowcase
        eyebrow={EYEBROW}
        title={TITLE}
        doctors={DOCTORS}
        id="specialisti"
        lang="ro"
        data-slot="doctor-showcase"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('id', 'specialisti');
    expect(band).toHaveAttribute('lang', 'ro');
    expect(band).toHaveAttribute('data-slot', 'doctor-showcase');
    // A caller's id on the BAND never becomes the heading's — the pair keeps
    // its generated one — and the region keeps its name.
    expect(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    ).not.toHaveAttribute('id', 'specialisti');
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
  });

  it('keeps its own name when a caller WRITES `aria-labelledby` in JSX — the spread rides first (D2)', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so the attribute below COMPILES despite the Omit. The band's own
    // pair rides AFTER `{...rest}`, so the caller's loses — move the spread
    // below `aria-labelledby` and this test goes red (G2 react).
    const { container } = render(
      <DoctorShowcase
        eyebrow={EYEBROW}
        title={TITLE}
        doctors={DOCTORS}
        aria-labelledby="nowhere"
      />,
    );

    const band = bandOf(container);
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(band).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
  });
});

describe('DoctorShowcase — the band’s shape (D4)', () => {
  it('takes its gutter from ui/Container, never a second spelling', () => {
    const { container } = renderBand();
    expect(columnOf(container).className).toBe(containerClasses);
  });

  it('opens with the standard band top and carries NO bottom padding and NO gap — the ribbon’s head and tail room are its air', () => {
    const { container } = renderBand();
    const rhythm = rhythmOf(container);

    expect(rhythm.className).toBe(RHYTHM_BOX);
    // Named one by one, so a returning `py-*` or `gap-*` reads as itself.
    expect(
      tokensOf(rhythm).filter((token) =>
        /(^|:)(pb|py|gap|gap-y|space-y)-/.test(token),
      ),
    ).toEqual([]);
    // Exactly two children, the opener and the ribbon, nothing between them.
    expect(rhythm.children).toHaveLength(2);
    expect(rhythm.children[0]).toContainElement(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    );
    expect(rhythm.children[1]).toBe(screen.getByRole('list'));
  });

  it('wears THE SCALE on that same box, behind its GATES — the cap on a mouse or trackpad, the regime from the Container’s `@4xl` step floored at 896px (D10)', () => {
    // Named one by one beside the byte pin above, so a scale that moved to
    // another box — or lost a gate: without `scalable:` it would scale every
    // touch tablet held sideways, without its container step every narrow
    // window a mouse opens, down to the phone's width the owner keeps — reads
    // as itself. The numbers' own census is tests/unit/design-scale.test.ts.
    const { container } = renderBand();
    const tokens = tokensOf(rhythmOf(container));

    expect(tokens).toEqual(
      expect.arrayContaining([
        'mx-auto',
        'scalable:max-w-[96rem]',
        'scalable:@4xl:@min-[896px]:[--scale-px:calc(min(100cqw,96rem)/1106)]',
        'scalable:@4xl:@min-[896px]:design-scale',
      ]),
    );
    expect(
      tokens.filter((token) => /design-scale|--scale-px/.test(token)),
    ).toEqual([
      'scalable:@4xl:@min-[896px]:[--scale-px:calc(min(100cqw,96rem)/1106)]',
      'scalable:@4xl:@min-[896px]:design-scale',
    ]);
    // THE GATE on all three and on nothing else: the band's top, its flex
    // column and its centring are every device's.
    expect(tokens.filter((token) => token.startsWith('scalable:'))).toEqual([
      'scalable:max-w-[96rem]',
      'scalable:@4xl:@min-[896px]:[--scale-px:calc(min(100cqw,96rem)/1106)]',
      'scalable:@4xl:@min-[896px]:design-scale',
    ]);
    // ONE box: nothing else in the band declares a design pixel or wears the
    // remap — the opener, the ribbon and every card INHERIT the band's.
    for (const element of [
      bandOf(container),
      columnOf(container),
      ...rhythmOf(container).querySelectorAll('*'),
    ]) {
      expect(
        tokensOf(element).filter((token) =>
          /design-scale|--scale-px/.test(token),
        ),
      ).toEqual([]);
    }
  });

  it('puts no outer margin on the opener or the ribbon (§6.4)', () => {
    const { container } = renderBand();
    for (const child of rhythmOf(container).children) {
      expect(
        tokensOf(child).filter((token) => /^-?m[trblxyse]?-/.test(token)),
      ).toEqual([]);
    }
  });

  it('carries no WIDTH media query anywhere — container steps only (§6.5) — and its one media condition is the input gate', () => {
    // A viewport breakpoint (`md:`, `max-lg:`, `min-[…]:`) would read the
    // window, never the band's column. The container steps (`@4xl:`, and the
    // `@min-[896px]:` floor beside it) read the column, and the ONE media
    // feature the band asks — through globals.css's `scalable` variant — is
    // the primary pointer, a property of the device and no width (D10, THE
    // GATES).
    const { container } = renderBand();

    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(^|:)(min|max)-\[/);
      }
    }
    expect(
      tokensOf(rhythmOf(container)).filter((token) => token.includes(':')),
    ).toEqual(
      tokensOf(rhythmOf(container)).filter((token) =>
        /^(scalable:|@)/.test(token),
      ),
    );
  });
});

describe('DoctorShowcase — the doctors, ONE list under the ribbon (D3, D5, D6)', () => {
  it('reads as ONE list with an item per doctor, each holding that doctor’s article named by an <h3>', () => {
    renderBand();

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(1);
    const items = within(lists[0]).getAllByRole('listitem');
    expect(items).toHaveLength(DOCTORS.length);
    items.forEach((item, index) => {
      const { name } = DOCTORS[index];
      const card = within(item).getByRole('article', { name });
      expect(card.tagName).toBe('ARTICLE');
      expect(item.firstElementChild).toBe(card);
      expect(
        within(card).getByRole('heading', { level: 3, name }).tagName,
      ).toBe('H3');
    });
  });

  it('IS the ribbon: its root the list (route B), untouched by a className, a station per doctor and the decorative layer last', () => {
    renderBand();

    const list = screen.getByRole('list');
    const bare = bareRibbonRoot();
    // The Ribbon gets no className (ui/Ribbon's LIMITS: a root className is
    // placement only, and this band has nothing to place) — the root wears
    // exactly what a bare ribbon wears.
    expect(list.className).toBe(bare.className);
    const stations = list.querySelectorAll('[data-ribbon-station]');
    expect(stations).toHaveLength(DOCTORS.length);
    // ROUTE B, not A: each station is a WRAPPER <div> with the listitem role,
    // never the card itself through asChild (whose marker reads "card").
    for (const station of stations) {
      expect(station.tagName).toBe('DIV');
      expect(station).toHaveAttribute('data-ribbon-station', '');
      expect(station).toHaveAttribute('role', 'listitem');
      expect(station).not.toHaveAttribute('class');
    }
    const layer = list.lastElementChild;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).not.toContainElement(stations[0] as HTMLElement);
  });

  it('gives every station exactly ONE card — the article is its first and only element child (the ribbon measures it)', () => {
    renderBand();

    const stations = [
      ...screen.getByRole('list').querySelectorAll('[data-ribbon-station]'),
    ];
    const cards = screen.getAllByRole('article');
    expect(stations).toHaveLength(cards.length);
    stations.forEach((station, index) => {
      expect(station.children).toHaveLength(1);
      expect(station.firstElementChild).toBe(cards[index]);
    });
  });

  it('gives each card exactly ONE link — to that doctor’s own page, named with the label and then the person', () => {
    renderBand();

    screen.getAllByRole('article').forEach((card, index) => {
      const { name, profile } = DOCTORS[index];
      const links = within(card).getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0].tagName).toBe('A');
      expect(links[0]).toHaveAttribute('href', profile.href);
      // The visible words are the label alone; the accessible name is the
      // label, then the person (PersonnelCard D15, SC 2.5.3).
      expect(links[0].textContent).toBe(profile.label);
      expect(links[0]).toHaveAccessibleName(`${profile.label} ${name}`);
    });
    expect(screen.getAllByRole('link')).toHaveLength(DOCTORS.length);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('hands each card its own specialty, picture and words, untouched', () => {
    renderBand();

    screen.getAllByRole('article').forEach((card, index) => {
      const doctor = DOCTORS[index];
      expect(within(card).getByText(doctor.position).tagName).toBe('P');
      const quote = within(card).getByRole('blockquote');
      expect(quote.textContent).toBe(TEXTS[index]);
      // The keyword fragment arrives as the <b> ui/Keyword renders.
      expect(quote.querySelectorAll('b')).toHaveLength(1);
      // The cutout, decorative by construction (PersonnelCard D3).
      const picture = within(card).getByRole('presentation');
      expect(picture.tagName).toBe('IMG');
      expect(picture).toHaveAttribute('alt', '');
      expect(picture.getAttribute('src')).toContain(
        doctor.photo.src.replace(/^.*\/|\.png$/g, ''),
      );
    });
  });

  it('alternates the sides by index — start, end, start (D5) — read off the card itself, never re-spelled', () => {
    // Computed BEFORE the band renders: each reference mounts and unmounts
    // inside its helper.
    const expected = DOCTORS.map((doctor, index) =>
      referenceLook(doctor, SIDES[index]),
    );
    // Never vacuous: the two sides really are two looks.
    expect(referenceLook(DOCTORS[0], 'start')).not.toEqual(
      referenceLook(DOCTORS[0], 'end'),
    );

    renderBand();
    screen.getAllByRole('article').forEach((card, index) => {
      expect(lookOf(card), `card ${index + 1}`).toEqual(expected[index]);
    });
  });

  it('keeps the outline whole: the band’s <h2>, then one <h3> per doctor, nothing deeper (D6)', () => {
    renderBand();

    expect(
      screen
        .getAllByRole('heading')
        .map((heading) => Number(heading.tagName[1])),
    ).toEqual([2, ...DOCTORS.map(() => 3)]);
    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(DOCTORS.map((doctor) => doctor.name));
  });

  it('keys every station by its doctor’s id — a card keeps its element when the order changes', () => {
    // React matches a keyed child by its key, so the same doctor keeps the
    // same <article> across renders; keyed by position, the first element
    // would be handed the next doctor's words instead. (React's own
    // missing-key warning is no pin: it fires once per component per run.)
    const { rerender } = renderBand();
    const elena = screen.getByRole('article', { name: DOCTORS[0].name });

    rerender(
      <DoctorShowcase
        eyebrow={EYEBROW}
        title={TITLE}
        doctors={DOCTORS.toReversed()}
      />,
    );

    expect(screen.getByRole('article', { name: DOCTORS[0].name })).toBe(elena);
  });

  it('prints the doctors exactly as given — the band never sorts', () => {
    // Display order is designed in lib/team; the page passes it through and
    // so does the band.
    renderBand({}, [DOCTORS[2], DOCTORS[0]]);

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([DOCTORS[2].name, DOCTORS[0].name]);
  });
});

describe('DoctorShowcase — empty renders nothing (D7)', () => {
  it('renders NOTHING for an empty list — no region, no heading, no eyebrow, no ribbon', () => {
    // A titled band with no card is a promise with nothing behind it.
    const { container } = renderBand({}, []);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText(EYEBROW)).toBeNull();
  });
});

describe('DoctorShowcase — the first screen: ONE eager picture (D9)', () => {
  it('keeps every picture lazy when the page does not say “first screen” — Home, under the Hero', () => {
    // The prop left out and `false` are one answer, the default; each is
    // rendered and read on its own.
    for (const mount of [() => renderBand(), () => renderOnScreen(false)]) {
      const { container, unmount } = mount();
      const pictures = picturesOf(container);
      expect(pictures).toHaveLength(DOCTORS.length);
      for (const picture of pictures) {
        expect(picture).toHaveAttribute('loading', 'lazy');
        expect(picture).not.toHaveAttribute('fetchpriority');
      }
      unmount();
    }
  });

  it('preloads the FIRST card’s picture — and only it — on the first screen: the Team page’s LCP element', () => {
    // PersonnelCard D18's pair on card 0: no lazy loading, a high fetch
    // priority. The second and the third wait for the scroll like any
    // picture below the fold (§11).
    const { container } = renderOnScreen(true);

    const [first, ...others] = picturesOf(container);
    expect(first).toHaveAttribute('fetchpriority', 'high');
    expect(first).not.toHaveAttribute('loading', 'lazy');
    expect(others).toHaveLength(DOCTORS.length - 1);
    for (const picture of others) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });

  it('follows the ORDER, never the doctor — whoever the page puts first is the eager one', () => {
    // Reversed, the third doctor opens the band and Elena closes it: the LCP
    // is whichever card stands first, so the eager picture moves with the
    // index, never with a person.
    const { container } = renderOnScreen(true, DOCTORS.toReversed());

    expect(within(container).getAllByRole('article')[0]).toHaveAccessibleName(
      DOCTORS[2].name,
    );
    const pictures = picturesOf(container);
    expect(pictures[0]).toHaveAttribute('fetchpriority', 'high');
    expect(pictures.at(-1)).toHaveAttribute('loading', 'lazy');
    expect(
      pictures.filter((picture) => picture.hasAttribute('fetchpriority')),
    ).toHaveLength(1);
  });

  it('never lets `firstScreen` reach the <section> as an attribute', () => {
    // React prints NO boolean on an attribute it does not know — it drops
    // `true` and `false` alike — so a leaked boolean could never show here,
    // and the plain case alone would prove nothing. A truthy STRING would be
    // printed (`firstscreen="da"`), so it is the probe; the double cast is how
    // a value assembled elsewhere would arrive (ContactModal's "smuggled"
    // precedent).
    const names = (container: HTMLElement): string[] =>
      bandOf(container).getAttributeNames().toSorted();
    const plain = names(renderBand().container);
    const smuggled = 'da' as unknown as boolean;

    for (const told of [true, smuggled]) {
      const attributes = names(renderOnScreen(told).container);
      expect(attributes).toEqual(plain);
      expect(attributes.filter((name) => /first-?screen/i.test(name))).toEqual(
        [],
      );
    }
  });
});

describe('DoctorShowcase — the static page (§16 rule 2, D8)', () => {
  it('compiles to static HTML: the region, the list and every card — and no canvas', () => {
    // renderToString is the nearest a unit test gets to the export's HTML —
    // the same markup, rendered as ONE tree: the server-to-client boundary the
    // real page has is tests/e2e/doctor-showcase.spec.ts's to see, on the
    // built files. The ribbon's drawing starts only after mount, in the
    // browser, so the HTML carries its empty layer and nothing drawn.
    const html = renderToString(
      <DoctorShowcase eyebrow={EYEBROW} title={TITLE} doctors={DOCTORS} />,
    );
    expect(html).not.toContain('<canvas');

    const host = document.createElement('div');
    host.innerHTML = html;
    const list = host.querySelector('[role="list"]');
    if (list === null) throw new Error('no list in the server HTML');
    expect(list.querySelectorAll('[data-ribbon-station]')).toHaveLength(
      DOCTORS.length,
    );
    expect(list.querySelectorAll('article')).toHaveLength(DOCTORS.length);
    expect(list.lastElementChild?.childElementCount).toBe(0);
    expect(host.querySelector('section h2')?.textContent).toBe(TITLE);
  });

  it('writes the eager pair into the static HTML on the first screen — the first picture only (D9)', () => {
    // D9 exists for the HTML the browser's preload scanner reads before any
    // script runs. renderToString shows the <img>'s own attributes; the
    // preload link React hoists into <head> is the e2e spec's, on the built
    // page.
    const host = document.createElement('div');
    host.innerHTML = renderToString(
      <DoctorShowcase
        eyebrow={EYEBROW}
        title={TITLE}
        doctors={DOCTORS}
        firstScreen
      />,
    );

    const [first, ...others] = [...host.querySelectorAll('article img')];
    expect(first).toHaveAttribute('fetchpriority', 'high');
    expect(first).not.toHaveAttribute('loading', 'lazy');
    expect(others).toHaveLength(DOCTORS.length - 1);
    for (const picture of others) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });
});

describe('DoctorShowcase — the source (D1, D8)', () => {
  it('ships NO client directive and no state — the ribbon is the island, not this file (§16)', () => {
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b|\bgetTranslations\b/);
    expect(CODE).not.toMatch(/next-intl/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, once, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(']);
  });

  it('imports react, PersonnelCard, SectionHeading, Container, Ribbon and lib/cx — nothing else', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB band into a second populator (D1), and a
    // stateful composed child would hydrate the page without tripping the
    // directive check (D8).
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/PersonnelCard/PersonnelCard',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/ui/Container/Container',
      '@/components/ui/Ribbon/Ribbon',
      '@/lib/cx/cx',
      'react',
    ]);
    // The card's two shapes arrive as TYPES beside the component.
    expect(CODE).toMatch(
      /^import \{[^}]*\bPersonnelCard\b[^}]*\btype PersonnelLink\b[^}]*\btype PersonnelPhoto\b[^}]*\} from '@\/components\/sections\/PersonnelCard\/PersonnelCard';$/m,
    );
    // No lib DATA and no locale at all: a DUMB band knows no team (D1).
    expect(CODE).not.toMatch(
      /@\/lib\/(clinic|prices|reviews|team|routes|hours|hero-slides)/,
    );
    expect(CODE).not.toMatch(/@\/i18n\//);
    // Side-effect and re-export forms add a dependency the matcher above
    // would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });
});

describe('DoctorShowcase — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('eyebrow');
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('title');
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('doctors');
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('className');
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('ref');
    expectTypeOf<DoctorShowcaseProps['eyebrow']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorShowcaseProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<DoctorShowcaseProps['doctors']>().toEqualTypeOf<
      readonly DoctorShowcaseDoctor[]
    >();
    // Optional with a false default: Home leaves it out (D9).
    expectTypeOf<DoctorShowcaseProps>().toHaveProperty('firstScreen');
    expectTypeOf<DoctorShowcaseProps['firstScreen']>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<DoctorShowcaseDoctor>().toEqualTypeOf<
      Readonly<{
        id: string;
        name: string;
        position: string;
        photo: PersonnelPhoto;
        about: ReactNode;
        profile: PersonnelLink;
      }>
    >();
    // The band's name is its <h2>'s text alone (D2).
    expectTypeOf<DoctorShowcaseProps>().not.toHaveProperty('aria-label');
    expectTypeOf<DoctorShowcaseProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<DoctorShowcaseProps>().not.toHaveProperty('children');
  });

  it('refuses the names, the slot and the shapes the types exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the props
    // loosen. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered. Every bad shape stays on ONE line: an
    // object literal broken across lines reports an excess property at the
    // PROPERTY, which would leave the directive unused (the DoctorCourses
    // suite's TS2578 note).
    const BAND = { eyebrow: EYEBROW, title: TITLE, doctors: DOCTORS };
    const DOCTOR = DOCTORS[0];
    // `as const`: the path stays a literal, so the refusal below is about
    // THIS path being outside public/images/ — a widened `string` would fail
    // the same way for a correct path too (G2 typescript).
    const LOOSE = { src: 'cutout-1.png', width: 900, height: 1200 } as const;
    const UNLINKED = { id: 'x', name: 'x', position: 'x', photo: CUTOUT_1 };

    // @ts-expect-error — content arrives as `doctors`; nested children would vanish
    const nested: DoctorShowcaseProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band's name is its <h2>'s text alone (D2)
    const renamed: DoctorShowcaseProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's (D2)
    const repaired: DoctorShowcaseProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — the doctors are REQUIRED; "none" is an empty list (D7)
    const bare: DoctorShowcaseProps = { eyebrow: EYEBROW, title: TITLE };
    // @ts-expect-error — which way a card faces is the band's decision (D5)
    const sided: DoctorShowcaseDoctor = { ...DOCTOR, side: 'end' };
    // @ts-expect-error — which picture loads first is the band's decision (D9)
    const eager: DoctorShowcaseDoctor = { ...DOCTOR, preload: true };
    // @ts-expect-error — the picture is a file under public/images/ (§11)
    const stray: DoctorShowcaseDoctor = { ...DOCTOR, photo: LOOSE };
    // @ts-expect-error — a doctor's card always carries its words and its link
    const silent: DoctorShowcaseDoctor = UNLINKED;

    expect([
      nested,
      renamed,
      repaired,
      bare,
      sided,
      eager,
      stray,
      silent,
    ]).toHaveLength(8);
  });
});

// ── THE SCALE, MEASURED (D10) ─────────────────────────────────────────────
// The one block of this file that reads COMPUTED values, on the real
// stylesheet and the real typefaces: the band at a column of the owner's
// reference, 1106px, against the same band at wider columns, past its cap
// and below its step. What it holds is the owner's sentence — "card and
// component and all contents to adjust in size harmonically all at once" —
// as numbers: from the step every length of every box is the reference's
// × s, s = min(column, 96rem) / 1106 (four kinds of box answer for a stated
// reason, `expectScaled` says which and why); past the cap the band is the
// cap's, centred; below the step nothing is declared and nothing moves. And
// D10's GATES, each where it bites: the step's px floor under a 12px root,
// the cap in rem under a 28px one, and a TOUCH pointer, emulated through the
// browser's own DevTools protocol, which turns the regime off at any width.
// THE PREMISE, asserted before any case: this runner IS a place where the
// regime can apply — a fine pointer, an engine that registers custom
// properties, the default 16px root — so a runner that changed under it
// fails here by name instead of skipping the regime in silence. The
// tolerance is the planner's, max(0.5px, 0.6 %), wherever a case does not
// name its own. Last in the file on purpose: it parks the pointer and
// changes the window, and puts both back when it ends; a case that injects a
// root font or a touch screen takes it away again in its own `finally`.

/** THE REAL TYPEFACES — ui/Ribbon's suite's pair, for ContactModal.test.tsx's
 *  reason: next/font does not run here, so the token chain would set every
 *  string in a fallback serif, and a box that hugs its words measures those
 *  words. The URLs are the committed subsets as this runner serves them,
 *  from the repo's root. */
const FONT_CSS = `
@font-face {
  font-family: 'Source Serif 4 SB';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'JetBrains Mono SB';
  src: url('/src/fonts/JetBrainsMonoVariable-subset.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
:root {
  --font-source-serif: 'Source Serif 4 SB';
  --font-jetbrains-mono: 'JetBrains Mono SB';
}
`;

/** THE STILLNESS RULE (the PR #45 rule): unlayered, so it beats every
 *  @layer'd utility — the cards' colour fade and the link's jump never run
 *  under a reading. */
const STILL_CSS =
  '*, *::before, *::after { transition: none !important; animation: none !important; }';

/** D10's numbers, written out — the REFERENCE column, where a design pixel is
 *  a CSS pixel; the CAP, 96rem, in px at this runner's 16px root (THE PREMISE
 *  asserts the root); and THE STEP's two halves, `@4xl`'s 56rem and the
 *  floor's 896px. Spelled again on purpose: the byte pin holds the source,
 *  these hold what the engine does with it. */
const REFERENCE = 1106;
const CAP_REM = 96;
const CAP = CAP_REM * 16;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** A window whose 10vw is a whole pixel, so ui/Container's gutter — and with
 *  it every column below — is exact in layout units, and each case's design
 *  pixel exactly its column / 1106: the reference draws in one CSS pixel to
 *  the last digit, the band the owner approved. */
const WINDOW = { width: 1000, height: 900 } as const;

/** The two first doctors, `start` and `end` — both mirrors — with their
 *  words cut to ONE line at every column measured below. One line ON
 *  PURPOSE: a box's height counts its lines, and a sentence that ends near a
 *  line's end may break a word later in a column the card's hairline leaves a
 *  hair WIDER than the scaled reference's — its 1px stays 1px, so the words'
 *  column is 2(s − 1)px wider than × s — or in a line the face draws
 *  narrower at a larger size (D10, NOT the design's; WORD_BOX). A wrap is the
 *  TEXT's, never the scale's, and no number here may rest on one. */
const SHORT_WORDS = [
  words('Explic fiecare ', 'etapă', ' a tratamentului.'),
  words('Arăt ', 'radiografiile', ' după fiecare etapă.'),
];
const SCALE_DOCTORS: readonly DoctorShowcaseDoctor[] = SHORT_WORDS.map(
  (quote, index) => ({ ...DOCTORS[index], about: quote.node }),
);

/** lib/reduced-motion's own query answers "reduce": every ribbon is painted
 *  whole at its first build (lib/ribbon-draw), so a reading never waits on a
 *  scroll. */
const reduce = (query: string): MediaQueryList => ({
  matches: query === '(prefers-reduced-motion: reduce)',
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

/** `count` animation frames — the ribbon's observer reports, its build runs. */
const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    const next = (left: number): void => {
      if (left === 0) resolve();
      else requestAnimationFrame(() => next(left - 1));
    };
    next(count);
  });

/** How many pixels of a canvas carry paint. */
const painted = (canvas: HTMLCanvasElement): number => {
  const context = canvas.getContext('2d');
  if (context === null || canvas.width === 0) return 0;
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count += 1;
  return count;
};

/** A length in CSS px per rem — the root's, which every container query's
 *  rem reads (a query never sees the band's remapped theme). */
const rootRem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The browser's own `matchMedia`, taken before any case spies on it: the
 *  measured cases answer lib/reduced-motion's question through `reduce`, and
 *  the gates' questions — the pointer — must reach the engine. */
const realMatchMedia = window.matchMedia.bind(window);

/** A ROOT FONT for one case — an unlayered `html { font-size }`, which every
 *  rem on the page reads: a container query's (the 56rem step) and the 96rem
 *  cap's alike. Returns the undo, which each case calls in its `finally`. */
const withRootFont = (px: number): (() => void) => {
  const style = document.createElement('style');
  style.textContent = `html { font-size: ${px}px; }`;
  document.head.append(style);
  return () => style.remove();
};

/** ui/Container's gutter per side at this window, read off a probe wearing
 *  the real class — the clamp is spelled once, in Container.tsx. */
const gutter = (): number => {
  const probe = document.createElement('div');
  probe.className = containerClasses;
  document.body.append(probe);
  try {
    return parseFloat(getComputedStyle(probe).marginLeft);
  } finally {
    probe.remove();
  }
};

/** A computed length of an element, in px — a property or a custom one. */
const lengthOf = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** IS THE REGIME ON for this box? `design-scale` remaps `--spacing` on the
 *  box that wears it; elsewhere the box inherits the root's. Asked of the
 *  declaration, never of a number: at the reference the two agree to the
 *  last digit, and only the remap says which one drew. */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing');

/** A box's content width — what a container query on it reads. */
const contentWidth = (element: Element): number => {
  const style = getComputedStyle(element);
  return (
    element.getBoundingClientRect().width -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight) -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth)
  );
};

type Scene = Readonly<{
  /** ui/Container's box — the band's column. */
  column: HTMLElement;
  /** The rhythm box: the one that declares the design pixel (D10). */
  rhythm: HTMLElement;
  /** The ribbon's root — the list (D3). */
  ribbon: HTMLElement;
  cards: readonly HTMLElement[];
  unmount: () => void;
}>;

/** A card's parts, by role where there is one and by structure where not —
 *  the INSET is the article's one child, the GRID the INSET's (PersonnelCard
 *  D17). */
const partsOf = (card: HTMLElement) => {
  const inset = card.firstElementChild as HTMLElement;
  const picture = card.querySelector('img');
  if (picture === null) throw new Error('THE SCALE: a card lost its picture');
  return {
    inset,
    grid: inset.firstElementChild as HTMLElement,
    picture,
    quote: within(card).getByRole('blockquote'),
    name: within(card).getByRole('heading', { level: 3 }),
    link: within(card).getByRole('link'),
  };
};

/**
 * THE MEASURING HELPER every case below shares: the band on SCALE_DOCTORS in
 * a box that hands its Container a column of exactly `width` px — the
 * gutter read, never assumed — and the premise every number rests on,
 * checked before any is read.
 */
const renderColumn = (width: number): Scene => {
  const { container, unmount } = render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <DoctorShowcase eyebrow={EYEBROW} title={TITLE} doctors={SCALE_DOCTORS} />
    </div>,
  );
  const section = container.firstElementChild?.firstElementChild;
  if (!(section instanceof HTMLElement)) {
    throw new Error('THE SCALE: no band rendered');
  }
  const column = section.firstElementChild as HTMLElement;
  const rhythm = column.firstElementChild as HTMLElement;
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    4,
  );
  return {
    column,
    rhythm,
    ribbon: within(rhythm).getByRole('list'),
    cards: within(rhythm).getAllByRole('article'),
    unmount,
  };
};

/**
 * Pictures first, then boxes — and the ribbon painted. Every picture is asked
 * for at once (the stories' `settled`, for its reason: a lazy picture far
 * below the window is never started) and the wait is bounded and names what
 * it waited for; two frames let the ribbon's observer report; then every
 * card's canvas carries paint — reduced motion paints the whole ribbon at its
 * first build, and THE GUARD let it through.
 */
const settle = async ({ rhythm }: Scene): Promise<void> => {
  const pictures = [...rhythm.querySelectorAll('img')];
  for (const picture of pictures) picture.loading = 'eager';
  await waitFor(
    () => {
      for (const picture of pictures) {
        expect(picture.complete, picture.currentSrc).toBe(true);
      }
    },
    { timeout: 5_000 },
  );
  await frames(2);
  await waitFor(
    () => {
      const canvases = [...rhythm.querySelectorAll('canvas')];
      expect(canvases).toHaveLength(SCALE_DOCTORS.length);
      for (const canvas of canvases) {
        expect(painted(canvas)).toBeGreaterThan(0);
      }
    },
    { timeout: 5_000 },
  );
};

const SIDE_NAMES = ['top', 'right', 'bottom', 'left'] as const;
const CORNER_NAMES = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
] as const;

/**
 * THE WORD BOXES — shrink-to-fit round ONE line of their own words, so their
 * WIDTH is the typeface's advance and no theme length: the band's eyebrow and
 * title (SectionHeading's start column) and, in each card, the name and the
 * specialty (PersonnelCard D17's PAIR). And THE HUG BOX, the pair itself, as
 * wide as the wider of its two (D17's HUG RULE).
 * WHY THEY ARE HELD APART (measured 2026-10-01, this runner's Chromium):
 * Source Serif 4 is a variable face with an OPTICAL-SIZE axis, and the
 * browser's default `font-optical-sizing: auto` sets it from the size each
 * line is drawn at — so its words run NARROWER PER EM as they grow: 14.39 em
 * of „Specialiștii cu care ne mândrim” at 18px, 13.92 at 25, 13.57 at 36,
 * 13.13 at 50, 12.82 at 70.3 (14.075 at every size with the axis switched
 * off; JetBrains Mono has no such axis and scales exactly). A title drawn at
 * ×1.389 — THE CAP's, the largest the band draws — is therefore 3.3 %
 * narrower than the reference's × s: the typeface's display cut, not the
 * scale. Their FONT SIZE and their HEIGHT are held to × s like every box's;
 * their width is held to the reference's, carried from one size to the other
 * by the face's OWN advance, measured on a probe of the same words in the
 * same face.
 */
const WORD_BOX = 'h2, h3, p';
const HUG_BOX = ':has(> h3)';

/** The advance of an element's own words on ONE line at its own size, per
 *  em — every property that shapes them copied onto a probe. */
const perEmOf = (element: Element): number => {
  const style = getComputedStyle(element);
  const probe = document.createElement('span');
  probe.textContent = element.textContent;
  probe.style.cssText =
    'position: absolute; top: 0; left: 0; white-space: nowrap; visibility: hidden';
  for (const property of [
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-stretch',
    'font-optical-sizing',
    'font-variation-settings',
    'font-feature-settings',
    'font-kerning',
    'text-transform',
    'letter-spacing',
    'word-spacing',
  ]) {
    probe.style.setProperty(property, style.getPropertyValue(property));
  }
  document.body.append(probe);
  try {
    return probe.getBoundingClientRect().width / parseFloat(style.fontSize);
  } finally {
    probe.remove();
  }
};

/** One box's lengths, as the engine computed and laid them out. */
type Box = Readonly<{
  label: string;
  tag: string;
  display: string;
  scale: string;
  font: number;
  padding: readonly number[];
  border: readonly number[];
  radius: readonly number[];
  /** row-gap, column-gap — NaN where `normal`. */
  gap: readonly number[];
  /** The laid-out width and height. */
  size: readonly number[];
  /** A WORD BOX's words' advance per em at its own size — else null. */
  perEm: number | null;
  /** A HUG BOX's widest child's width — else null. */
  hugs: number | null;
}>;

const boxOf = (element: Element, index: number): Box => {
  const style = getComputedStyle(element);
  const { width, height } = element.getBoundingClientRect();
  const lengths = (names: readonly string[]): number[] =>
    names.map((name) => parseFloat(style.getPropertyValue(name)));
  return {
    label: `#${index} <${element.tagName.toLowerCase()} class="${(element.getAttribute('class') ?? '').slice(0, 48)}">`,
    tag: element.tagName,
    display: style.display,
    scale: style.scale,
    font: parseFloat(style.fontSize),
    padding: lengths(SIDE_NAMES.map((side) => `padding-${side}`)),
    border: lengths(SIDE_NAMES.map((side) => `border-${side}-width`)),
    radius: lengths(CORNER_NAMES.map((corner) => `border-${corner}-radius`)),
    gap: lengths(['row-gap', 'column-gap']),
    size: [width, height],
    perEm: element.matches(WORD_BOX) ? perEmOf(element) : null,
    hugs: element.matches(HUG_BOX)
      ? Math.max(
          ...[...element.children].map(
            (child) => child.getBoundingClientRect().width,
          ),
        )
      : null,
  };
};

/** What one column of the band computed and drew. */
type Measured = Readonly<{
  /** The rhythm box and every box inside it, in document order. */
  boxes: readonly Box[];
  /** The rhythm box's design pixel, computed (px). */
  scalePx: number;
  /** The ribbon's unit on its root (px) — 100 design pixels. */
  unit: number;
  /** The ribbon's two lanes on its column (px): top, side. */
  lanes: readonly number[];
  /** Every canvas as laid out (px): width, height — each one painted. */
  canvases: readonly (readonly number[])[];
  /** Where the rhythm box sits in its column (px): left offset, width. */
  placement: readonly number[];
}>;

const measureColumn = async (width: number): Promise<Measured> => {
  const scene = renderColumn(width);
  try {
    await settle(scene);
    const ribbonColumn = scene.ribbon.firstElementChild as HTMLElement;
    const from = scene.column.getBoundingClientRect();
    const box = scene.rhythm.getBoundingClientRect();
    return {
      boxes: [scene.rhythm, ...scene.rhythm.querySelectorAll('*')].map(boxOf),
      scalePx: lengthOf(scene.rhythm, '--scale-px'),
      unit: lengthOf(scene.ribbon, '--ribbon-unit'),
      lanes: [
        lengthOf(ribbonColumn, '--ribbon-lane-top'),
        lengthOf(ribbonColumn, '--ribbon-lane-side'),
      ],
      canvases: [...scene.ribbon.querySelectorAll('canvas')].map((canvas) => {
        const tile = canvas.getBoundingClientRect();
        return [tile.width, tile.height];
      }),
      placement: [box.left - from.left, box.width],
    };
  } finally {
    scene.unmount();
  }
};

/** The planner's tolerance: half a pixel for a small length, 0.6 % of a
 *  large one. */
const tolerance = (expected: number): number =>
  Math.max(0.5, 0.006 * Math.abs(expected));

const near = (
  actual: number,
  expected: number,
  label: string,
  within: number = tolerance(expected),
): void => {
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(within);
};

/** What the owner saw, to a twentieth of a pixel. */
const exact = (actual: number, expected: number, label: string): void =>
  near(actual, expected, label, 0.05);

/**
 * ui/Card's THE SUM RULE — the ONE box of the band whose lengths are not all
 * the reference's × s, and why: a card spends six steps of the design + ONE
 * CSS pixel per side on its frame and its padding (the pixel is a
 * hairline's, and a hairline stays a hairline). The FRAME is a whole 3px
 * border at every scale — an engine floors a fractional border to whole
 * pixels while it keeps a padding's fraction — and the PADDING, six steps
 * less 2px, carries the step (D10, NOT the design's). So the frame is held to
 * the reference's own px, and the SPEND to six steps × s + 1px EXACTLY — to a
 * twentieth of a pixel, the engine's layout precision — the reading
 * PersonnelCard.test.tsx's `expectWordsAt` makes of the same card.
 */
const expectSpend = (reference: Box, scaled: Box, s: number): void => {
  SIDE_NAMES.forEach((side, i) => {
    exact(
      scaled.border[i],
      reference.border[i],
      `${scaled.label} frame, ${side}`,
    );
    const steps = reference.border[i] + reference.padding[i] - 1;
    exact(
      scaled.border[i] + scaled.padding[i],
      steps * s + 1,
      `${scaled.label} spend, ${side}`,
    );
  });
};

/**
 * EVERY BOX × s: the font size, the padding, the gaps, the radii, the borders
 * and the laid-out size of the rhythm box and of everything inside it, each
 * the reference's × s within the tolerance. Four kinds of box answer
 * differently, each for a stated reason:
 *   · the CANVASES are the ribbon's raster tiles, sized in whole CSS px round
 *     the drawing with a fixed 2px margin (lib/ribbon-draw, TILES) — held
 *     apart, against the reference's tiles, in each case;
 *   · the CARD (the <article>) keeps its 3px frame and spends six steps + 1px
 *     per side on frame and padding together (THE SUM RULE, `expectSpend`);
 *   · a WORD BOX's width is its words' advance, carried by the face's own
 *     optical size (WORD_BOX), and the HUG BOX is as wide as the wider of its
 *     two — their font size and height are × s like every box's;
 *   · an INLINE box is a run of text — its width its glyphs' advances, its
 *     height the font's content area, both the typeface's — so only its font
 *     size is read.
 * A 1px border would be a hairline, held at 1px; the band has none today.
 * Focus rings are not read: nothing is focused, and a ring is §9's, not the
 * design's.
 */
const expectScaled = (
  reference: readonly Box[],
  scaled: readonly Box[],
  s: number,
): void => {
  expect(scaled.map((box) => box.tag)).toEqual(reference.map((box) => box.tag));
  reference.forEach((before, i) => {
    const after = scaled[i];
    // A jump under a resting pointer would scale a box itself — never here.
    expect(after.scale, after.label).toBe('none');
    if (before.tag === 'CANVAS') return;
    near(after.font, before.font * s, `${after.label} font-size`);
    before.radius.forEach((value, j) =>
      near(after.radius[j], value * s, `${after.label} ${CORNER_NAMES[j]}`),
    );
    before.gap.forEach((value, j) => {
      if (Number.isNaN(value)) expect(after.gap[j], after.label).toBeNaN();
      else near(after.gap[j], value * s, `${after.label} gap ${j}`);
    });
    if (before.tag === 'ARTICLE') {
      expectSpend(before, after, s);
    } else {
      before.padding.forEach((value, j) =>
        near(
          after.padding[j],
          value * s,
          `${after.label} padding-${SIDE_NAMES[j]}`,
        ),
      );
      before.border.forEach((value, j) => {
        if (value === 1) expect(after.border[j], after.label).toBe(1);
        else near(after.border[j], value * s, `${after.label} border ${j}`);
      });
    }
    if (before.display === 'inline') return;
    near(after.size[1], before.size[1] * s, `${after.label} height`);
    if (before.perEm !== null && after.perEm !== null) {
      // Never vacuous: a word box IS as wide as its words in both renders —
      // one that stretched to its column would be a theme length, and
      // carrying it by the face's advance would hide a real miss.
      for (const box of [before, after]) {
        near(box.size[0], (box.perEm ?? 0) * box.font, `${box.label} hugs`);
      }
      near(
        after.size[0],
        before.size[0] * s * (after.perEm / before.perEm),
        `${after.label} width, at the face's own advance`,
      );
    } else if (after.hugs !== null) {
      near(
        after.size[0],
        after.hugs,
        `${after.label} width, hugging its words`,
      );
    } else {
      near(after.size[0], before.size[0] * s, `${after.label} width`);
    }
  });
};

describe('DoctorShowcase — THE SCALE, measured (D10 — real stylesheet, real typefaces)', () => {
  let injected: HTMLElement[] = [];
  let parking: HTMLElement;
  let window0: { width: number; height: number };

  beforeAll(async () => {
    // THE PREMISE (D10, THE GATES): the regime CAN apply here. Every case
    // below that expects it on would otherwise turn red for a reason that
    // reads as the scale's, and every case that expects it off would pass
    // for the wrong one.
    expect(
      realMatchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine passes the registration gate (relative colour syntax)',
    ).toBe(true);
    expect(rootRem(), 'the default 16px root (CAP is spelled at it)').toBe(16);
    window0 = { width: window.innerWidth, height: window.innerHeight };
    await page.viewport(WINDOW.width, WINDOW.height);
    const fonts = document.createElement('style');
    fonts.textContent = FONT_CSS;
    const still = document.createElement('style');
    still.textContent = STILL_CSS;
    document.head.append(fonts, still);
    // THE POINTER, PARKED (ReviewsDeck.test.tsx's idiom): a real pointer
    // resting over a card would hover the link, whose jump scales its box by
    // 5 % — every band renders BELOW this element, never under the pointer.
    parking = document.createElement('div');
    parking.id = 'pointer-parking';
    parking.textContent = 'parcare';
    document.body.prepend(parking);
    injected = [fonts, still, parking];
    await document.fonts.load('1rem "Source Serif 4 SB"');
    await document.fonts.load('1rem "JetBrains Mono SB"');
    await document.fonts.ready;
  });

  beforeEach(async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(reduce);
    await realUser.hover(parking);
  });

  afterAll(async () => {
    for (const element of injected) element.remove();
    await page.viewport(window0.width, window0.height);
  });

  it.each([600, 300])(
    'leaves a %ipx column — below the step — as it always was: no design pixel declared, nothing remapped, the theme’s own sizes',
    async (width) => {
      const warned = vi.spyOn(console, 'warn');
      const scene = renderColumn(width);
      await settle(scene);
      const { rhythm, ribbon, cards } = scene;
      const rem = rootRem();

      expect(remapped(rhythm)).toBe(false);
      // The registered initial value — the box declares none.
      expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      expect(getComputedStyle(ribbon).getPropertyValue('--ribbon-unit')).toBe(
        '100px',
      );
      // The body's 1.125rem, inherited (§15.1), and the band top at the
      // theme's step.
      exact(lengthOf(rhythm, 'font-size'), 1.125 * rem, 'the body size');
      exact(
        lengthOf(rhythm, 'padding-top'),
        (width >= 48 * rem ? 20 : width >= 32 * rem ? 16 : 12) * 0.25 * rem,
        'the band top',
      );
      const title = within(rhythm).getByRole('heading', { level: 2 });
      exact(lengthOf(title, 'font-size'), width >= 28 * rem ? 36 : 30, 'h2');
      exact(
        lengthOf(within(rhythm).getByText(EYEBROW), 'font-size'),
        14,
        'the band’s eyebrow',
      );

      cards.forEach((card, index) => {
        const { inset, grid, picture, quote, name, link } = partsOf(card);
        const room = contentWidth(inset);
        const at = `${width}px, card ${index + 1}`;
        // Stacked — the card every phone keeps, and every column under the
        // card's own flip.
        expect(getComputedStyle(grid).display, at).toBe('flex');
        exact(lengthOf(quote, 'font-size'), 18, `${at}: the quote`);
        exact(
          lengthOf(name, 'font-size'),
          room >= 28 * rem ? 36 : 30,
          `${at}: the name`,
        );
        exact(
          lengthOf(
            within(card).getByText(DOCTORS[index].position),
            'font-size',
          ),
          14,
          `${at}: the specialty`,
        );
        // The cutout's 18rem cell — the whole column where that is less.
        const cell = Math.min(18 * rem, room);
        const shot = picture.getBoundingClientRect();
        exact(shot.width, cell, `${at}: the picture's width`);
        exact(shot.height, (cell * 4) / 3, `${at}: the picture's height`);
        // The link: as wide as the words up to 28rem, the lg box's 3.5rem.
        const action = link.getBoundingClientRect();
        exact(action.width, Math.min(28 * rem, room), `${at}: the link`);
        expect(action.height, at).toBeGreaterThanOrEqual(3.5 * rem - 0.05);
        // The reviews deck's frame, whole: 3px over 22px, every side.
        for (const side of SIDE_NAMES) {
          exact(lengthOf(card, `border-${side}-width`), 3, `${at}: frame`);
          exact(lengthOf(card, `padding-${side}`), 22, `${at}: padding`);
        }
      });
      expect(
        warned.mock.calls.filter(([text]) => /not painted/.test(String(text))),
      ).toEqual([]);
      scene.unmount();
    },
  );

  it('turns on at THE STEP and not a pixel before — max(56rem, 896px): 895px plain, 896px drawn in the design pixel', () => {
    const step = Math.max(STEP_REM * rootRem(), STEP_FLOOR);
    for (const [width, on] of [
      [step - 1, false],
      [step, true],
    ] as const) {
      const scene = renderColumn(width);
      expect(remapped(scene.rhythm), `${width}px`).toBe(on);
      expect(lengthOf(scene.rhythm, '--scale-px'), `${width}px`).toBeCloseTo(
        on ? width / REFERENCE : 1,
        4,
      );
      scene.unmount();
    }
  });

  it('floors THE STEP in px — under a 12px root a 700px column, past its 56rem (672px), stays plain, and 896px is drawn at 0.81, two-column (G2 react, R6)', () => {
    // With the step in rem alone, a smaller root started the regime on a
    // tablet-wide column, smaller than the design — 0.61 at this root from a
    // 672px column. The floor holds the narrowest design the band draws at
    // 896 / 1106 whatever the root (D10, THE NUMBERS — STEP).
    const undo = withRootFont(12);
    try {
      expect(rootRem()).toBe(12);
      expect(700).toBeGreaterThan(STEP_REM * 12);
      for (const [width, on] of [
        [700, false],
        [STEP_FLOOR - 1, false],
        [STEP_FLOOR, true],
      ] as const) {
        const scene = renderColumn(width);
        try {
          expect(remapped(scene.rhythm), `${width}px`).toBe(on);
          if (on) {
            expect(lengthOf(scene.rhythm, '--scale-px')).toBeCloseTo(
              STEP_FLOOR / REFERENCE,
              4,
            );
            for (const card of scene.cards) {
              expect(getComputedStyle(partsOf(card).grid).display).toBe('grid');
            }
          } else {
            expect(
              getComputedStyle(scene.rhythm).getPropertyValue('--scale-px'),
              `${width}px`,
            ).toBe('1px');
          }
        } finally {
          scene.unmount();
        }
      }
    } finally {
      undo();
    }
    expect(rootRem()).toBe(16);
  });

  it('caps in REM — under a 28px root a 2700px column, past its 96rem (2688px), draws the cap’s band, centred, every card two-column (G2 typescript, T2)', () => {
    // With the cap in px, a root of ≈ 27.4px or more put the 56rem step past
    // it: the design pixel pinned at 1536 / 1106, the card's inset 1329px —
    // under its grid's 48rem (1344px here) — and every card STACKED inside the
    // regime. In rem, the step and the cap keep their ratio at any root.
    const undo = withRootFont(28);
    try {
      expect(rootRem()).toBe(28);
      const cap = CAP_REM * 28;
      const width = 2700;
      expect(width).toBeGreaterThan(cap);
      const scene = renderColumn(width);
      try {
        expect(remapped(scene.rhythm)).toBe(true);
        expect(lengthOf(scene.rhythm, '--scale-px')).toBeCloseTo(
          cap / REFERENCE,
          4,
        );
        const from = scene.column.getBoundingClientRect();
        const box = scene.rhythm.getBoundingClientRect();
        exact(box.width, cap, 'the box, as wide as the cap');
        exact(box.left - from.left, (width - cap) / 2, 'the box, centred');
        expect(scene.cards.length).toBeGreaterThan(0);
        for (const card of scene.cards) {
          expect(getComputedStyle(partsOf(card).grid).display).toBe('grid');
        }
      } finally {
        scene.unmount();
      }
    } finally {
      undo();
    }
    expect(rootRem()).toBe(16);
  });

  it('draws the REFERENCE column — 1106px, the owner’s 1401 window — as the band he approved: a design pixel IS a CSS pixel', async () => {
    // The numbers measured on develop's export at the 1401 × 1063 window
    // (D10): the quote 18, a doctor's name and the band's title 36, the
    // eyebrows 14, the picture 288 × 384, the link 448 × 56, the frame 3px
    // over 22px, and the words `lane + 1px` in from the card's edge (THE
    // INSET, PersonnelCard D17) — the lanes lib/ribbon-model's for this
    // column. The regime is ON here, and draws in exactly one pixel.
    const warned = vi.spyOn(console, 'warn');
    const scene = renderColumn(REFERENCE);
    await settle(scene);
    const { rhythm, ribbon, cards } = scene;

    expect(remapped(rhythm)).toBe(true);
    exact(lengthOf(rhythm, '--scale-px'), 1, 'the design pixel');
    exact(lengthOf(ribbon, '--ribbon-unit'), UNIT_PX, 'the ribbon’s unit');
    exact(
      lengthOf(within(rhythm).getByRole('heading', { level: 2 }), 'font-size'),
      36,
      'h2',
    );
    exact(
      lengthOf(within(rhythm).getByText(EYEBROW), 'font-size'),
      14,
      'the band’s eyebrow',
    );
    const lane = lanes(gaugeRule(REFERENCE / UNIT_PX));

    cards.forEach((card, index) => {
      const { inset, grid, picture, quote, name, link } = partsOf(card);
      const at = `card ${index + 1}`;
      expect(getComputedStyle(grid).display, at).toBe('grid');
      exact(lengthOf(quote, 'font-size'), 18, `${at}: the quote`);
      exact(lengthOf(name, 'font-size'), 36, `${at}: the name`);
      exact(
        lengthOf(within(card).getByText(DOCTORS[index].position), 'font-size'),
        14,
        `${at}: the specialty`,
      );
      const shot = picture.getBoundingClientRect();
      exact(shot.width, 288, `${at}: the picture's width`);
      exact(shot.height, 384, `${at}: the picture's height`);
      const action = link.getBoundingClientRect();
      exact(action.width, 448, `${at}: the link's width`);
      exact(action.height, 56, `${at}: the link's height`);
      for (const side of SIDE_NAMES) {
        exact(lengthOf(card, `border-${side}-width`), 3, `${at}: frame`);
        exact(lengthOf(card, `padding-${side}`), 22, `${at}: padding`);
      }
      exact(lengthOf(inset, 'padding-top'), lane.top - 24, `${at}: inset top`);
      exact(lengthOf(inset, 'padding-left'), lane.side - 24, `${at}: inset`);
      exact(lengthOf(inset, 'padding-right'), lane.side - 24, `${at}: inset`);
      exact(lengthOf(inset, 'padding-bottom'), 0, `${at}: inset bottom`);
    });
    expect(
      warned.mock.calls.filter(([text]) => /not painted/.test(String(text))),
    ).toEqual([]);
    scene.unmount();
  });

  it.each([1300, CAP])(
    'draws a %ipx column as the reference, scaled — every length of every box × column / 1106, the ribbon’s unit and lanes with it',
    async (width) => {
      const warned = vi.spyOn(console, 'warn');
      const reference = await measureColumn(REFERENCE);
      const scaled = await measureColumn(width);
      const s = width / REFERENCE;

      expect(scaled.scalePx).toBeCloseTo(s, 4);
      exact(scaled.unit, UNIT_PX * s, 'the ribbon’s unit');
      scaled.lanes.forEach((value, i) =>
        exact(value, reference.lanes[i] * s, `lane ${i}`),
      );
      expectScaled(reference.boxes, scaled.boxes, s);
      // THE RIBBON'S TILES: one per card, each painted (settle), each the
      // reference's tile × s to 1 % — the e2e's tolerance, not the boxes'
      // 0.6 %, for two stated reasons: a tile is the drawing's bounding box
      // grown by a FIXED 2px a side and snapped outward to whole pixels
      // (lib/ribbon-draw, TILES), and the card it wraps keeps its hairline's
      // pixel a pixel (THE SUM RULE above), 2(s − 1)px off × s in height.
      // Measured: 0.37 % short at most — 3.3px on an 883px tile at ×1.389,
      // the cap's; 0.21 % at ×1.175. The ribbon's own LENGTHS — its unit, its
      // lanes — are held exactly above; ui/Ribbon's suite holds its tiles × s
      // on a column with no card frame in it.
      expect(scaled.canvases).toHaveLength(reference.canvases.length);
      reference.canvases.forEach((tile, i) =>
        tile.forEach((value, j) =>
          near(
            scaled.canvases[i][j],
            value * s,
            `canvas ${i}, axis ${j}`,
            Math.max(0.5, 0.01 * value * s),
          ),
        ),
      );
      expect(
        warned.mock.calls.filter(([text]) => /not painted/.test(String(text))),
      ).toEqual([]);
    },
  );

  it.each([1800, 2600])(
    `stops at THE CAP — a %ipx column draws the ${CAP}px band to the pixel, centred in it`,
    async (width) => {
      // Past the cap the design pixel stops at CAP / 1106 and the box at CAP
      // wide — 96rem, a 1920 window's column at the default root (D10, THE
      // NUMBERS — CAP) — so every wider column shows the band of the cap's
      // own column, in its middle.
      const cap = await measureColumn(CAP);
      const wide = await measureColumn(width);

      expect(wide.scalePx).toBeCloseTo(CAP / REFERENCE, 4);
      exact(wide.placement[1], CAP, 'the box’s width');
      exact(wide.placement[0], (width - CAP) / 2, 'the box, centred');
      exact(cap.placement[1], CAP, 'at the cap itself, the whole column');
      exact(cap.placement[0], 0, 'at the cap itself, flush');
      // The same band, to a layout unit — box for box, length for length.
      expect(wide.boxes).toEqual(cap.boxes);
      expect(wide.canvases).toEqual(cap.canvases);
      expect(wide.unit).toBe(cap.unit);
      expect(wide.lanes).toEqual(cap.lanes);
    },
  );

  it('keeps the card two-column at every width of the regime — from the step’s own 896px up, and past the cap — and stacked below the card’s own flip', () => {
    // At the step the design pixel is 896 / 1106 ≈ 0.81 and the card's inset
    // ≈ 774px — the thin margin over the 768px its `@3xl` grid asks for
    // (D10, THE NUMBERS — STEP); a step that drew the card any narrower would
    // stack it inside the regime and turn this red at 896. Just under the
    // step the card is ALREADY two-column, unscaled — its own flip falls at
    // ≈ 893px (D10's record (3)), so crossing the step changes its size, never
    // its layout.
    for (const [width, display] of [
      [300, 'flex'],
      [600, 'flex'],
      [880, 'flex'],
      [STEP_FLOOR - 2, 'grid'],
      [896, 'grid'],
      [REFERENCE, 'grid'],
      [1300, 'grid'],
      [CAP, 'grid'],
      [1800, 'grid'],
      [2600, 'grid'],
    ] as const) {
      const scene = renderColumn(width);
      for (const card of scene.cards) {
        expect(getComputedStyle(partsOf(card).grid).display, `${width}px`).toBe(
          display,
        );
      }
      scene.unmount();
    }
  });

  it('puts every rule of the scale behind its GATES in the real stylesheet — inside `@supports (color: rgb(from red r g b))` and `@media (pointer: fine)`, the regime also behind both container steps — so a touch screen, upright or sideways, and an engine that cannot register custom properties draw today’s band (D10, THE GATES)', () => {
    // THE DEVICE ITSELF is driven end to end, in a fresh browser per window
    // (tests/e2e/doctor-showcase.spec.ts, the touch tablets): Chromium's touch
    // emulation switched on and off inside this shared runner did not report a
    // fine pointer again on CI's Linux within seconds (2026-10-01), and the tab
    // it leaves coarse is every later file's. Here: the compiled rules, read
    // from the CSSOM — each `scalable:` class of RHYTHM is found, and every
    // rule that styles it sits under both gates, the regime's two also under
    // the Container's 56rem step and the 896px floor.
    const gated = RHYTHM_BOX.split(' ').filter((token) =>
      token.startsWith('scalable:'),
    );
    expect(gated).toHaveLength(3);
    type Found = { conditions: string[] };
    const found = new Map<string, Found[]>(gated.map((token) => [token, []]));
    const walk = (rules: CSSRuleList, conditions: string[]): void => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          for (const token of gated) {
            if (rule.selectorText === `.${CSS.escape(token)}`) {
              found.get(token)?.push({ conditions });
            }
          }
        } else if (rule instanceof CSSSupportsRule) {
          walk(rule.cssRules, [
            ...conditions,
            `supports ${rule.conditionText}`,
          ]);
        } else if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, [...conditions, `media ${rule.media.mediaText}`]);
        } else if (rule instanceof CSSContainerRule) {
          walk(rule.cssRules, [
            ...conditions,
            `container ${rule.conditionText}`,
          ]);
        } else if ('cssRules' in rule) {
          walk((rule as CSSGroupingRule).cssRules, conditions);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      walk(sheet.cssRules, []);
    }
    const supports = /^supports \(?color: rgb\(from red r g b\)\)?$/;
    const fine = /^media \(pointer: fine\)$/;
    const step = /^container \((?:min-width: 56rem|width >= 56rem)\)$/;
    const floor = /^container \((?:min-width: 896px|width >= 896px)\)$/;
    for (const token of gated) {
      const rules = found.get(token) ?? [];
      expect(rules.length, `${token}: compiled`).toBeGreaterThan(0);
      for (const { conditions } of rules) {
        expect(
          conditions.some((c) => supports.test(c)),
          `${token}: ${conditions.join(' › ')}`,
        ).toBe(true);
        expect(
          conditions.some((c) => fine.test(c)),
          `${token}: ${conditions.join(' › ')}`,
        ).toBe(true);
        if (token !== 'scalable:max-w-[96rem]') {
          expect(
            conditions.some((c) => step.test(c)),
            `${token}: ${conditions.join(' › ')}`,
          ).toBe(true);
          expect(
            conditions.some((c) => floor.test(c)),
            `${token}: ${conditions.join(' › ')}`,
          ).toBe(true);
        }
      }
    }
  });
});
