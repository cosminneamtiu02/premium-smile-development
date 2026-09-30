import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { PersonnelPhoto } from '@/components/sections/PersonnelCard/PersonnelCard';
import { containerClasses } from '@/components/ui/Container/Container';
import {
  TeamRoster,
  type TeamRosterMember,
  type TeamRosterProps,
} from './TeamRoster';
import source from './TeamRoster.tsx?raw';

// sections/TeamRoster — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this band is almost entirely structure — ONE `list`, and the
// `article`s inside it, each named by its own <h2>.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// PersonnelCard / DoctorProfile precedent). next-intl's hooks throw without one,
// so a green render proves run D1: this band owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have handed over —
// Romanian with diacritics (§15.7), invented people, the committed demo
// portraits.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — how many tiles share a row at a
// measured column width, and whether they share a height — is asserted one
// tier up, in TeamRoster.stories.tsx's play functions, and derived there from
// the measured tracks rather than from a pinned viewport.
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

// ── FIXTURES. The three staff people of TeamRoster.stories.tsx, so a failure
// here reads like the picture there, all on the committed demo portraits
// (600×800, the 3:4 headshot ratio every team picture uses — synthetic
// silhouettes, no real people, nothing to license). The third position is
// long enough to wrap inside a narrow track.
const PORTRAITS = {
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  mihaela: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  anaMaria: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} as const;

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
    photo: PORTRAITS.mihaela,
  },
  {
    id: 'ana-maria-dobre',
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.anaMaria,
  },
] as const satisfies readonly TeamRosterMember[];

// ── THE BYTE PINS. This band's own class strings — the rhythm box and the
// grid — written out so a silent edit fails here. The GUTTER is deliberately
// NOT among them: it is imported from ui/Container, because
// tests/unit/gutter-single-spelling.test.ts fences src/ against a second
// spelling of the clamp and that fence is the whole product of the promotion
// (§15.15 a).
const RHYTHM_BOX = 'py-12 @lg:py-16 @3xl:py-20';
const AUXILIARY_GRID =
  'grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]';

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
  render(<TeamRoster members={MEMBERS} {...props} />);

/** The band, and the two boxes between it and the list — reached by
 *  structure, because none of them carries a role of its own. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const columnOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const rhythmOf = (container: HTMLElement): HTMLElement =>
  columnOf(container).firstElementChild as HTMLElement;

describe('TeamRoster — the band, which names nothing', () => {
  it('is a plain <section> on the page ground, with no landmark of its own', () => {
    // The band has no heading of its own — its only headings are the tiles',
    // one per person — so a name on the section would draw a landmark whose
    // label nobody sees. No role, no aria-label, no aria-labelledby, no title
    // — the last three Omitted from the props (a typed object is refused,
    // below) and RESET at render (a JSX attribute is not — the next test). The
    // region query cannot stand in for them: Testing Library does not count a
    // titled <section> as a region, while Chromium's accessibility tree does
    // (measured, the header's naming paragraph).
    const { container } = renderRoster();

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band).not.toHaveAttribute('role');
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
    expect(band).not.toHaveAttribute('title');
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });

  it('stays nameless when a caller WRITES a naming attribute in JSX — the Omit alone is not a refusal', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so the two lines below COMPILE despite the Omit (G2 typescript,
    // 2026-09-30: before the resets this rendered `<section aria-label="…">`,
    // a named region). `title` has no hyphen and IS refused in JSX, so it
    // arrives through the one door left, a spread of unknown shape.
    const smuggled = { title: 'Personalul auxiliar' } as object;
    const { container } = render(
      <TeamRoster
        members={MEMBERS}
        aria-label="Personalul auxiliar"
        aria-labelledby="nowhere"
        {...smuggled}
      />,
    );

    const band = bandOf(container);
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
    expect(band).not.toHaveAttribute('title');
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
    expect(band.current).toContainElement(screen.getByRole('list'));
  });

  it('spreads remaining native props onto the section', () => {
    const { container } = render(
      <TeamRoster
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
    // A caller's id lands on the BAND and nowhere else — no tile takes it.
    expect(container.querySelectorAll('[id="echipa"]')).toHaveLength(1);
  });

  it('renders NOTHING for an empty staff — no section, no padded box', () => {
    // A clinic with no auxiliary personnel yet is a state the populator can
    // really produce. The answer is `null` (the ReviewsCarousel / PriceList
    // exit), never a padded page-ground box around "list, 0 items".
    const { container } = renderRoster({ members: [] });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
  });
});

describe('TeamRoster — the staff tiles, the band’s one job (D9)', () => {
  it('renders ONE list, marked for WebKit, as the rhythm box’s only child', () => {
    // `role="list"` is redundant in the spec and load-bearing in WebKit, which
    // drops list semantics from any `list-style: none` list (the ui/SpeedDial
    // precedent, an exception in eslint.config.mjs). getByRole throws on a
    // second list, so this is also the proof that there is only one.
    const { container } = renderRoster();

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(list.className).toBe(AUXILIARY_GRID);
    expect([...rhythmOf(container).children]).toEqual([list]);
    expect([...list.children].map((item) => item.tagName)).toEqual(
      MEMBERS.map(() => 'LI'),
    );
  });

  it('names every tile by its person, in the given order — and brings no link', () => {
    // Each tile is an `article` named by its own heading (PersonnelCard D4),
    // in the populator's order, one per <li>. The names carry Ț ș ă: the
    // exact-name queries below are also the diacritics check.
    const { container } = renderRoster();

    const list = screen.getByRole('list');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(MEMBERS.length);
    for (const [index, member] of MEMBERS.entries()) {
      const card = screen.getByRole('article', { name: member.name });
      expect(articles[index]).toBe(card);
      expect(list.children[index]).toContainElement(card);
      expect(within(card).getByText(member.position)).toBeInTheDocument();
    }
    expect(container.querySelectorAll('img')).toHaveLength(MEMBERS.length);
    // An auxiliary tile has nowhere to send anyone (PersonnelCard D2): no
    // link, and never a button standing in for one.
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('opens no outline of its own: no <h1>, every tile titled by an <h2>', () => {
    // The <h1> is the PAGE's now (sr-only, in its markup), and the tiles sit
    // under it as siblings of the doctors band's <h2>: h1 → h2 (the doctors
    // band) → h3 (each doctor) → h2 (each tile). So this band prints no h1,
    // no h3, and exactly one heading per person — an <h2>, handed down through
    // PersonnelCard's `headingLevel` (its D4).
    renderRoster();

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(MEMBERS.length);
    for (const [index, card] of screen.getAllByRole('article').entries()) {
      const heading = within(card).getByRole('heading', { level: 2 });
      expect(heading.tagName).toBe('H2');
      expect(heading.textContent).toBe(MEMBERS[index].name);
      expect(headings[index]).toBe(heading);
    }
  });

  it('places the tiles and nothing else — `h-full` on every tile', () => {
    // A grid item is stretched while the <article> inside it is an ordinary
    // block, so `h-full` is what makes a row's card surfaces equal (the
    // AuxiliaryTiles recipe). §6.4: the band owns all the spacing and the
    // cards own no margin at all.
    renderRoster();

    for (const card of screen.getAllByRole('article')) {
      expect(tokensOf(card)).toContain('h-full');
      expect(tokensOf(card).filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual(
        [],
      );
    }
  });
});

describe('TeamRoster — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    // Container variants (@lg:/@3xl:) are the allowed shape: they measure
    // ui/Container's COLUMN, which is what makes the same band right inside a
    // 312px phone gutter and a 1228px laptop one. The grid answers the same
    // box without naming a step at all (D9).
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

  it('imports one section, one atom and lib/cx — and no data at all', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB band into a second populator (run D1), and
    // swapping a composed section for something stateful would hydrate the
    // whole page without tripping a directive check. ui/Heading left with the
    // page title on 2026-09-30 — the <h1> is the page's now — and every
    // heading left in the band is a tile's own.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/PersonnelCard/PersonnelCard',
      '@/components/ui/Container/Container',
      '@/lib/cx/cx',
      'react',
    ]);
    // `PersonnelPhoto` arrives as a TYPE — the card's public export (G2-R2
    // typescript F4), erased at build time, so the portrait's shape cannot
    // drift apart from the card's…
    expect(CODE).toMatch(/^\s*type PersonnelPhoto,$/m);
    // …and it is not re-spelled here: the band names no `ImagePath` at all.
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
    // and this is the assertion that keeps it that way.
    const { container } = renderRoster();

    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('TeamRoster — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<TeamRosterProps>().toHaveProperty('members');
    expectTypeOf<TeamRosterProps>().toHaveProperty('className');
    expectTypeOf<TeamRosterProps>().toHaveProperty('ref');
  });

  it('keeps the portrait typed by the card it composes (G2-R2)', () => {
    // The TYPE is PersonnelCard's own public export, not a local re-spelling:
    // a field the card's photo gains (its recorded RE-OPEN TRIGGER, an
    // optional `alt`) reaches the band and the populator at once, where a
    // narrower local copy would drop it silently.
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
    const BAND = { members: MEMBERS };

    // @ts-expect-error — the staff is the band's one prop, and it is required
    const memberless: TeamRosterProps = {};
    // @ts-expect-error — content arrives as props; nested children would vanish
    const nested: TeamRosterProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band names nothing: it has no heading of its own
    const renamed: TeamRosterProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — …and a caller's pair would invent the region it refuses
    const repaired: TeamRosterProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — a native title names a <section> too (Chromium: a region)
    const titled: TeamRosterProps = { ...BAND, title: 'x' };
    // @ts-expect-error — an auxiliary has no quote to give (PersonnelCard D2)
    const talkative: TeamRosterMember = { ...MEMBERS[0], about: 'x' };
    // A WELL-FORMED path with no size: the refusal below is then about the
    // missing `width` / `height` alone, never about the path (G2 typescript).
    const SIZELESS = { src: '/images/x.jpg' } as const;
    // @ts-expect-error — the portrait's intrinsic size is the reserved box (§11)
    const flatPhoto: TeamRosterMember = { ...MEMBERS[0], photo: SIZELESS };

    expect([
      memberless,
      nested,
      renamed,
      repaired,
      titled,
      talkative,
      flatPhoto,
    ]).toHaveLength(7);
  });
});
