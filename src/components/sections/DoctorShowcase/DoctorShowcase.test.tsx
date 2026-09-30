import { createRef, type ReactNode, type Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import {
  PersonnelCard,
  type PersonnelLink,
  type PersonnelPhoto,
  type PersonnelSide,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { containerClasses } from '@/components/ui/Container/Container';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import { Ribbon, RibbonStation } from '@/components/ui/Ribbon/Ribbon';
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
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS and the DOM are the contract here. The ribbon's effect still
// runs on mount — without the stylesheet its colour tokens cannot be read, so
// its own guard paints nothing and says so once per ribbon (lib/ribbon-draw,
// THE GUARD). That ONE line, with that one reason, is kept out of the log
// below (`UNSTYLED_RIBBON`); any other warning still prints. What the drawing
// does on a styled page is ui/Ribbon's own suite, and what this band looks
// like under it — the canvases sized, the picture beside the words on the
// right side of every card, no sideways scroll — is asserted one tier up, in
// DoctorShowcase.stories.tsx's play functions.
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

/** The ribbon guard's one line in an UNSTYLED document (the header): the
 *  colour tokens live in globals.css, which this project never loads. */
const UNSTYLED_RIBBON =
  'lib/ribbon-draw: the ribbon is not painted — the colour tokens';

beforeEach(() => {
  const warn = console.warn;
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith(UNSTYLED_RIBBON)) {
      return;
    }
    warn(...args);
  });
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

/** The band's rhythm box, byte for byte (D4): the standard band top, and NO
 *  bottom padding and NO gap — the ribbon's own head and tail room are the
 *  band's air above the first card and under the last. */
const RHYTHM_BOX = 'flex flex-col pt-12 @lg:pt-16 @3xl:pt-20';

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

  it('puts no outer margin on the opener or the ribbon (§6.4)', () => {
    const { container } = renderBand();
    for (const child of rhythmOf(container).children) {
      expect(
        tokensOf(child).filter((token) => /^-?m[trblxyse]?-/.test(token)),
      ).toEqual([]);
    }
  });

  it('carries no media queries anywhere — container steps only (§6.5)', () => {
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
