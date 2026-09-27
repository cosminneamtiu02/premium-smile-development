import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  PersonnelActions,
  PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { containerClasses } from '@/components/ui/Container/Container';
import { Keyword } from '@/components/ui/Keyword/Keyword';
import {
  TeamRoster,
  type TeamRosterDoctor,
  type TeamRosterMember,
  type TeamRosterProps,
} from './TeamRoster';
import source from './TeamRoster.tsx?raw';

// sections/TeamRoster — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this band is almost entirely structure — the page's ONE <h1>,
// two `list`s, and the `article`s inside them named by their own headings.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// PersonnelCard / DoctorProfile precedent). next-intl's hooks throw without one,
// so a green render proves run D1: this band owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have translated —
// Romanian with diacritics (§15.7), invented people, the committed demo
// portraits, copy that is factual and first-person (CMSR: no superlatives, no
// promises).
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — how many auxiliary tiles share a
// row at a measured column width, and whether the two doctor cards really
// mirror each other — is asserted one tier up, in TeamRoster.stories.tsx's
// play functions, and derived there from the measured column rather than from
// a pinned viewport.
//
// ── HARNESS NOTE — why a `process` shim, copied verbatim from
// PersonnelCard.test.tsx with its reason. The `components` vitest project is
// bare Vite in a real Chromium, which has no `process` object, and next/image
// reads `process.env.__NEXT_IMAGE_OPTS` at MODULE scope (image-component.js) —
// so importing the real ExportedImage, which this band reaches through
// sections/PersonnelCard → ui/Image, throws "process is not defined" before a
// single test runs. vi.hoisted is the sanctioned pre-import seam. Deliberately
// EMPTY env, not a copy of next.config.ts: with `__NEXT_IMAGE_OPTS` undefined
// next/image falls back to `imageConfigDefault`, i.e. the same shape the app
// ships, without this file pretending to be a second source of truth for the
// build config. Storybook's runner needs none of this: @storybook/nextjs-vite
// supplies the Next environment.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

// ── FIXTURES. The `TeamComposition` story's own people, so a failure here
// reads like the picture there: two doctors whose words carry ui/Keyword
// fragments (run D2 — the page's populator renders them before they arrive),
// and three auxiliaries, all on the committed demo portraits (600×800, the 3:4
// headshot ratio every team picture uses — synthetic silhouettes, no real
// people, nothing to license).
const TITLE = 'Echipa noastră';

const PORTRAITS = {
  elena: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  andrei: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} as const;

// The quotes in pieces, so the <Keyword> fragments sit exactly where a
// <Keywords segments={…} /> built from lib/team would put them — and so the
// expected TEXT is assembled from the same pieces instead of being re-typed.
// Every part rides an expression container, which keeps JSX's whitespace
// trimming out of the assertion.
const ELENA_PARTS = {
  lead: 'Lucrez în ',
  keyword: 'ortodonție',
  tail: ' de peste zece ani și explic fiecare etapă a tratamentului.',
};
const ANDREI_PARTS = {
  lead: 'Mă ocup de ',
  keyword: 'chirurgie orală',
  tail: ': extracții și mici intervenții, cu un control la o săptămână.',
};
const ELENA_ABOUT_TEXT = Object.values(ELENA_PARTS).join('');
const ANDREI_ABOUT_TEXT = Object.values(ANDREI_PARTS).join('');

const DOCTORS = [
  {
    id: 'elena-marin',
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    photo: PORTRAITS.elena,
    about: (
      <>
        {ELENA_PARTS.lead}
        <Keyword>{ELENA_PARTS.keyword}</Keyword>
        {ELENA_PARTS.tail}
      </>
    ),
    actions: {
      services: {
        href: '/ro/services/#orthodontics',
        label: 'Vezi serviciile',
      },
      profile: { href: '/ro/team/elena-marin/', label: 'Vezi profilul' },
    },
  },
  {
    id: 'andrei-serban',
    name: 'Dr. Andrei Șerban',
    position: 'Medic dentist, chirurgie orală',
    photo: PORTRAITS.andrei,
    about: (
      <>
        {ANDREI_PARTS.lead}
        <Keyword>{ANDREI_PARTS.keyword}</Keyword>
        {ANDREI_PARTS.tail}
      </>
    ),
    actions: {
      services: {
        href: '/ro/services/#oral-surgery',
        label: 'Vezi serviciile',
      },
      profile: { href: '/ro/team/andrei-serban/', label: 'Vezi profilul' },
    },
  },
] as const satisfies readonly TeamRosterDoctor[];

const MEMBERS = [
  {
    id: 'ioana-tepes',
    name: 'Ioana Țepeș',
    position: 'Asistentă medicală',
    photo: PORTRAITS.ioana,
  },
  {
    id: 'mihaela-craciun',
    name: 'Mihaela Crăciun',
    position: 'Asistentă medicală',
    photo: PORTRAITS.elena,
  },
  {
    id: 'ana-maria-dobre',
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.andrei,
  },
] as const satisfies readonly TeamRosterMember[];

// ── THE BYTE PINS. This band's own class strings — the rhythm box and the two
// lists — written out so a silent edit fails here, plus the two PersonnelCard
// grids the `side` alternation is read through. The GUTTER is deliberately NOT
// among them: it is imported from ui/Container, because
// tests/unit/gutter-single-spelling.test.ts fences src/ against a second
// spelling of the clamp and that fence is the whole product of the promotion
// (§15.15 a).
const RHYTHM_BOX = 'flex flex-col gap-8 py-12 @lg:py-16 @3xl:py-20';
const DOCTOR_LIST = 'flex flex-col gap-6';
const AUXILIARY_GRID =
  'grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]';

/** ui/Heading's `hero` step — §15.24, the one h1 size app-wide — plus its
 *  default ink (its two tables, concatenated size-then-tone), written OUT
 *  rather than imported, because the test must fail on a silent edit to the
 *  atom's constant, which an import would follow (the ui/Eyebrow RECIPE
 *  convention). */
const HERO_STEP =
  'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight text-ink-strong';

/** ui/Keyword's RECIPE — the same convention, one tier further down: what a
 *  fragment must still be wearing when it arrives inside a card's quote.
 *  A DARKER LILAC, A LITTLE BOLD, UPRIGHT since D56 (owner, 2026-09-26:
 *  "italic looks stupid … use a darker lilla and just a little bold and drop
 *  italic") — the new --accent-strong ink and a semibold 600 are the cue,
 *  the slant is gone; the ink #4b3a86 since D57 (owner, the same day: "a
 *  more seeable one … make it just jump at you more" — D56 had set
 *  #655885); a 650 weight since D59 (owner, the same day: "add just a
 *  little more bold and underline them maybe"), whose thin underline D60
 *  struck the round after (owner: "remove the underline" — the weight and
 *  the ink carry the cue alone). D55's italic (over the darkest ink) and
 *  D52's bold before it each lasted one round. */
const KEYWORD_RECIPE = 'font-[650] text-accent-strong';

/** sections/PersonnelCard's two wide-step grids (its LAYOUT Record) — how
 *  `side` is READ here. The card's own suite pins every cell; this band only
 *  needs to prove which of the two arrangements each doctor was handed, and
 *  the layout <div>'s class string is where the card exposes it. */
const GRID_START =
  '@3xl:grid @3xl:grid-cols-[16rem_minmax(0,1fr)] @3xl:gap-x-8 @3xl:gap-y-3';
const GRID_END =
  '@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_16rem] @3xl:gap-x-8 @3xl:gap-y-3';
const CARD_LAYOUT = 'flex flex-col gap-6';

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism from PersonnelCard.test.tsx,
 * where its reasoning is written out in full). Without it those guards police
 * the file's own documentation: this band is deliberately comment-heavy and
 * its header discusses `'use client'`, `t()` and `useId` by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The everyday band, with any prop overridden per test — `className` and
 *  `ref` included, both of which live in the props type already (§6.8). A
 *  hyphenated attribute (`data-slot`) is exempt from excess-property checking
 *  in JSX but not in a typed object literal (TS2353), so the test that checks
 *  the prop SPREAD writes its own JSX instead of going through this helper. */
const renderRoster = (
  props: Partial<TeamRosterProps> = {},
): ReturnType<typeof render> =>
  render(
    <TeamRoster title={TITLE} doctors={DOCTORS} members={MEMBERS} {...props} />,
  );

/** The band, and the two boxes between it and the lists — reached by
 *  structure, because none of them carries a role of its own. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const columnOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const rhythmOf = (container: HTMLElement): HTMLElement =>
  columnOf(container).firstElementChild as HTMLElement;

/** The layout <div> a PersonnelCard's single child is — the one element that
 *  carries the side's grid (its LAYOUT Record). */
const layoutOf = (card: HTMLElement): HTMLElement =>
  card.firstElementChild as HTMLElement;

describe('TeamRoster — the band, which names nothing', () => {
  it('is a plain <section> on the page ground, with no landmark of its own', () => {
    // The only heading here is the PAGE's <h1>, so a name on this section
    // would announce the title twice and duplicate the boundary <main> already
    // draws (the Services precedent, reached again by DoctorIntro). No role,
    // no aria-label, no aria-labelledby — and the last two are refused by the
    // TYPES as well, below.
    const { container } = renderRoster();

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band).not.toHaveAttribute('role');
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });

  it('stands on the page ground and merges the caller className LAST', () => {
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter here, no outer margin (§6.4: the page owns the
    // rhythm between its bands, and the map comes after this one).
    const { container } = renderRoster();
    expect(bandOf(container).className).toBe('bg-page');

    const { container: placed } = renderRoster({ className: 'scroll-mt-10' });
    expect(bandOf(placed).className).toBe('bg-page scroll-mt-10');
  });

  it('takes its gutter from ui/Container, never a second spelling', () => {
    // The ONE gutter definition on the site (§15.15 a, fb-343): imported and
    // compared, so a hand-typed clamp here would fail both this test and the
    // src-wide fence.
    const { container } = renderRoster();

    expect(columnOf(container).className).toBe(containerClasses);
    expect(rhythmOf(container).className).toBe(RHYTHM_BOX);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    renderRoster({ ref: band });

    expect(band.current).toBeInstanceOf(HTMLElement);
    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toContainElement(
      screen.getByRole('heading', { level: 1, name: TITLE }),
    );
  });

  it('spreads remaining native props onto the section', () => {
    const { container } = render(
      <TeamRoster
        title={TITLE}
        doctors={DOCTORS}
        members={MEMBERS}
        id="echipa"
        lang="de"
        data-slot="team-roster"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('id', 'echipa');
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('data-slot', 'team-roster');
    // A caller's id lands on the BAND and nowhere else — no heading, no card
    // takes it.
    expect(
      screen.getByRole('heading', { level: 1, name: TITLE }),
    ).not.toHaveAttribute('id');
  });
});

describe('TeamRoster — the page’s one <h1> (D10)', () => {
  it('renders the title as the only h1, at ui/Heading’s `hero` step (§15.24)', () => {
    // asChild onto a REAL <h1>: the atom answers "how big is this title" and
    // never "which element is it". `hyphens-none` rides the child's className,
    // so it merges LAST over the atom's own row — a page title may wrap
    // between words but never break at a syllable (§15.14's rider).
    renderRoster();

    const heading = screen.getByRole('heading', { level: 1, name: TITLE });
    expect(heading.tagName).toBe('H1');
    expect(heading.className).toBe(`${HERO_STEP} hyphens-none`);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // Ș ș Ț ț ă â î survive the whole chain — queried by TEXT, because a role
    // query would still match a mangled title.
    expect(screen.getByText(TITLE).textContent).toBe(TITLE);
  });

  it('opens with it: no eyebrow, no sub-heading, nothing above it (D10)', () => {
    // "as simple as possible" (the owner): the outline is h1 → one h2 per
    // person — the cards are handed headingLevel={2} (PersonnelCard D4's
    // additive axis), so nothing skips a level; this band has no eyebrow over
    // the title and titles neither of its two lists.
    const { container } = renderRoster();

    expect(rhythmOf(container).firstElementChild).toBe(
      screen.getByRole('heading', { level: 1 }),
    );
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    // Five people, five h2s — every heading below the title belongs to a card,
    // one level under the page title, never two.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(
      DOCTORS.length + MEMBERS.length,
    );
  });
});

describe('TeamRoster — doctors, then the auxiliary grid (D9, D10)', () => {
  it('renders exactly two lists, in that order, each marked for WebKit', () => {
    // `role="list"` is redundant in the spec and load-bearing in WebKit, which
    // drops list semantics from any `list-style: none` list (the ui/SpeedDial
    // precedent, an exception in eslint.config.mjs).
    const { container } = renderRoster();

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(list.tagName).toBe('UL');
      expect(list).toHaveAttribute('role', 'list');
    }

    const [doctors, auxiliaries] = lists;
    expect(doctors.className).toBe(DOCTOR_LIST);
    expect(auxiliaries.className).toBe(AUXILIARY_GRID);

    // The three blocks of the rhythm box, in order, by identity.
    const blocks = [...rhythmOf(container).children];
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toBe(screen.getByRole('heading', { level: 1 }));
    expect(blocks[1]).toBe(doctors);
    expect(blocks[2]).toBe(auxiliaries);
    expect(doctors.children).toHaveLength(DOCTORS.length);
    expect(auxiliaries.children).toHaveLength(MEMBERS.length);
    expect([...doctors.children].map((item) => item.tagName)).toEqual(
      DOCTORS.map(() => 'LI'),
    );
  });

  it('names every card by its person, doctors first, in the given order', () => {
    const { container } = renderRoster();

    const [doctors, auxiliaries] = screen.getAllByRole('list');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(DOCTORS.length + MEMBERS.length);
    expect(
      articles.map(
        (card) =>
          within(card).getAllByRole('heading', { level: 2 })[0].textContent,
      ),
    ).toEqual([
      ...DOCTORS.map((doctor) => doctor.name),
      ...MEMBERS.map((member) => member.name),
    ]);

    for (const [index, doctor] of DOCTORS.entries()) {
      const card = screen.getByRole('article', { name: doctor.name });
      expect(doctors.children[index]).toContainElement(card);
      expect(within(card).getByText(doctor.position)).toBeInTheDocument();
    }
    for (const [index, member] of MEMBERS.entries()) {
      const card = screen.getByRole('article', { name: member.name });
      expect(auxiliaries.children[index]).toContainElement(card);
      expect(within(card).getByText(member.position)).toBeInTheDocument();
    }
    expect(container.querySelectorAll('img')).toHaveLength(
      DOCTORS.length + MEMBERS.length,
    );
  });

  it('alternates the sides by INDEX — start, end, start (PersonnelCard D7)', () => {
    // `side` reaches the card, and the card's layout <div> is where it shows:
    // the two wide-step grids of its LAYOUT Record. A third doctor proves the
    // modulo rather than a two-row coincidence. The DOM never reorders — the
    // mirror is visual only, which the card's own suite pins cell by cell.
    const third = { ...DOCTORS[0], id: 'maria-pop', name: 'Dr. Maria Pop' };
    renderRoster({ doctors: [...DOCTORS, third], members: [] });

    const layouts = screen
      .getAllByRole('article')
      .map((card) => layoutOf(card).className);
    expect(layouts).toEqual([
      `${CARD_LAYOUT} ${GRID_START}`,
      `${CARD_LAYOUT} ${GRID_END}`,
      `${CARD_LAYOUT} ${GRID_START}`,
    ]);
  });

  it('gives every doctor his two links, services then profile (D15)', () => {
    // The hrefs arrive FINISHED — already locale-prefixed by the page's
    // localeHref() (§8.1) — and the accessible name is the label PLUS the
    // doctor, which is what makes a roster's repeated labels tellable apart in
    // a links list (PersonnelCard D15's EACH LINK NAMES ITSELF bullet; the
    // card's own suite pins the wiring). The visible text is still the label.
    renderRoster();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(DOCTORS.length * 2);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      DOCTORS.flatMap((doctor) => [
        doctor.actions.services.href,
        doctor.actions.profile.href,
      ]),
    );

    for (const doctor of DOCTORS) {
      const card = screen.getByRole('article', { name: doctor.name });
      const [services, profile] = within(card).getAllByRole('link');
      expect(services).toHaveAccessibleName(
        `${doctor.actions.services.label} ${doctor.name}`,
      );
      expect(services).toHaveTextContent(doctor.actions.services.label);
      expect(services).toHaveAttribute('href', doctor.actions.services.href);
      expect(profile).toHaveAccessibleName(
        `${doctor.actions.profile.label} ${doctor.name}`,
      );
      expect(profile).toHaveTextContent(doctor.actions.profile.label);
      expect(profile).toHaveAttribute('href', doctor.actions.profile.href);
    }
    // The auxiliary tiles bring none — nothing to see and nowhere to go.
    for (const member of MEMBERS) {
      const card = screen.getByRole('article', { name: member.name });
      expect(within(card).queryAllByRole('link')).toHaveLength(0);
    }
    // Links, never buttons (§15.13 — a plain <a href>, no router).
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('hands each doctor’s words to his own card, fragments intact', () => {
    // `about` is a ReactNode: the page's populator has already turned run D2's
    // `<k>` marks into ui/Keyword fragments, so this band never sees a mark
    // and never imports the atom (§8.1). The quotation marks are CSS — no
    // character of them is in the DOM (PersonnelCard D8).
    renderRoster();

    const quotes = screen.getAllByRole('blockquote');
    expect(quotes).toHaveLength(DOCTORS.length);
    expect(quotes.map((quote) => quote.textContent)).toEqual([
      ELENA_ABOUT_TEXT,
      ANDREI_ABOUT_TEXT,
    ]);
    for (const quote of quotes) {
      expect(quote.textContent).not.toMatch(/[„”“«»"]/);
      const keywords = quote.querySelectorAll('b');
      expect(keywords).toHaveLength(1);
      expect(keywords[0].className).toBe(KEYWORD_RECIPE);
    }
    expect(
      within(screen.getByRole('article', { name: DOCTORS[0].name })).getByText(
        ELENA_PARTS.keyword,
      ),
    ).toBeInTheDocument();
  });

  it('places the tiles and nothing else — `h-full` on the auxiliaries only', () => {
    // A grid item is stretched while the <article> inside it is an ordinary
    // block, so `h-full` is what makes a row's card surfaces equal (the
    // AuxiliaryTiles recipe). The doctors' list is a flex COLUMN — one card
    // per row — so the class would say nothing there. §6.4: the band owns all
    // the spacing and the cards own no margin at all.
    renderRoster();

    for (const member of MEMBERS) {
      expect(
        tokensOf(screen.getByRole('article', { name: member.name })),
      ).toContain('h-full');
    }
    for (const doctor of DOCTORS) {
      expect(
        tokensOf(screen.getByRole('article', { name: doctor.name })),
      ).not.toContain('h-full');
    }
    for (const card of screen.getAllByRole('article')) {
      expect(tokensOf(card).filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual(
        [],
      );
    }
  });

  it('renders no empty list — either half may be missing (D10)', () => {
    // A `<ul>` with no children announces "list, 0 items" and photographs as a
    // hole in the rhythm. A clinic with no auxiliary personnel yet is a state
    // the populator can really produce.
    const { unmount } = renderRoster({ members: [] });
    let lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(1);
    expect(lists[0].className).toBe(DOCTOR_LIST);
    expect(screen.getAllByRole('article')).toHaveLength(DOCTORS.length);
    unmount();

    const { unmount: unmountSecond } = renderRoster({ doctors: [] });
    lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(1);
    expect(lists[0].className).toBe(AUXILIARY_GRID);
    expect(screen.queryAllByRole('blockquote')).toHaveLength(0);
    unmountSecond();

    const { container } = renderRoster({ doctors: [], members: [] });
    expect(screen.queryAllByRole('list')).toHaveLength(0);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    // The title still stands: a page with no people yet is still a page.
    expect(
      screen.getByRole('heading', { level: 1, name: TITLE }),
    ).toBeInTheDocument();
    expect(rhythmOf(container).children).toHaveLength(1);
  });
});

describe('TeamRoster — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    // Container variants (@lg:/@3xl:) are the allowed shape: they measure
    // ui/Container's COLUMN, which is what makes the same band right inside a
    // 312px phone gutter and a 1228px laptop one. The auxiliary grid answers
    // the same box without naming a step at all (D9).
    const { container } = renderRoster();

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

  it('ships NO client directive — the band is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. The ONE island in the frame is the one ui/Image
    // brings with each portrait (PersonnelCard D11), which is why the import
    // surface below is pinned as well as the directive.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls NO hook at all — not even useId, because it names nothing', () => {
    // DoctorCourses needs one for its region's id; this band draws no region and
    // opens no name, so there is no id to generate (the header's naming
    // paragraph). A hook appearing here would mean a name appeared with it.
    expect([...CODE.matchAll(/\buse[A-Z]\w*\(/g)]).toEqual([]);
  });

  it('imports one section, two atoms and lib/cx — and no data at all', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB band into a second populator (run D1), and
    // swapping a composed section for something stateful would hydrate the
    // whole page without tripping a directive check. ui/Keyword is absent on
    // purpose — the doctors' fragments are rendered by the page before they
    // arrive (run D2). lib/image-path joined on 2026-09-21 and left on
    // 2026-09-26 (G2-R2 typescript F4): the portrait's shape is now the card's
    // own `PersonnelPhoto`, so the band spells no `ImagePath` of its own.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/PersonnelCard/PersonnelCard',
      '@/components/ui/Container/Container',
      '@/components/ui/Heading/Heading',
      '@/lib/cx/cx',
      'react',
    ]);
    // `PersonnelActions` and `PersonnelPhoto` arrive as TYPES — the card's
    // public exports (run D5; G2-R2 typescript F4), erased at build time, so
    // neither shape can drift apart from the card's…
    expect(CODE).toMatch(/^\s*type PersonnelActions,$/m);
    expect(CODE).toMatch(/^\s*type PersonnelPhoto,$/m);
    // …and neither is re-spelled here: the band names no `ImagePath` at all.
    expect(CODE).not.toMatch(/\bImagePath\b/);
    // No lib DATA at all: a DUMB band knows no clinic, no price list and no
    // team (run D1).
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders no message key path — every string arrived finished (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and this is the assertion that keeps it that way. The hrefs are
    // attributes, never text, so a `/ro/team/elena-marin/` cannot satisfy it.
    const { container } = renderRoster();

    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('TeamRoster — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<TeamRosterProps>().toHaveProperty('title');
    expectTypeOf<TeamRosterProps>().toHaveProperty('doctors');
    expectTypeOf<TeamRosterProps>().toHaveProperty('members');
    expectTypeOf<TeamRosterProps>().toHaveProperty('className');
  });

  it('keeps a doctor’s `actions` typed by the card it composes (run D5)', () => {
    // The TYPE is PersonnelCard's own public export, not a local re-spelling:
    // a face renamed there is a compile error here and at the populator, in
    // the same change-set.
    expectTypeOf<
      TeamRosterDoctor['actions']
    >().toEqualTypeOf<PersonnelActions>();
  });

  it('keeps both shapes’ `photo` typed by the card it composes (G2-R2)', () => {
    // The same rule for the portrait: a field the card's photo gains (its
    // recorded RE-OPEN TRIGGER, an optional `alt`) reaches the roster and the
    // populator at once, where a narrower local copy would drop it silently.
    expectTypeOf<TeamRosterDoctor['photo']>().toEqualTypeOf<PersonnelPhoto>();
    expectTypeOf<TeamRosterMember['photo']>().toEqualTypeOf<PersonnelPhoto>();
  });

  it('refuses the names, the slot and the shapes the types exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the props
    // loosen. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent).
    // Every bad shape below stays on ONE line, and that is mechanical rather
    // than cosmetic: `@ts-expect-error` suppresses the errors reported on the
    // line that FOLLOWS it, and an object literal broken across lines reports
    // its error at the offending PROPERTY — so a multi-line spelling would
    // turn each directive into an "unused directive" error of its own (the
    // TS2578 finding DoctorProfile.test.tsx records).
    const BAND = { title: TITLE, doctors: DOCTORS, members: MEMBERS };
    const WITHOUT_ACTIONS: Omit<TeamRosterDoctor, 'actions'> = DOCTORS[0];

    // @ts-expect-error — content arrives as props; nested children would vanish
    const nested: TeamRosterProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band names nothing: it holds the page's own <h1>
    const renamed: TeamRosterProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — …and a caller's pair would invent the region it refuses
    const repaired: TeamRosterProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — every doctor card the owner described has its two links
    const linkless: TeamRosterDoctor = WITHOUT_ACTIONS;
    // @ts-expect-error — an auxiliary has no quote to give (PersonnelCard D2)
    const talkative: TeamRosterMember = { ...MEMBERS[0], about: 'x' };
    // @ts-expect-error — the portrait's intrinsic size is the reserved box (§11)
    const flatPhoto: TeamRosterMember = { ...MEMBERS[0], photo: { src: 'x' } };
    // @ts-expect-error — `side` is computed from the index, never authored
    const sided: TeamRosterDoctor = { ...DOCTORS[0], side: 'end' };

    expect([
      nested,
      renamed,
      repaired,
      linkless,
      talkative,
      flatPhoto,
      sided,
    ]).toHaveLength(7);
  });
});
