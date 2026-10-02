import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { PersonnelPhoto } from '@/components/sections/PersonnelCard/PersonnelCard';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import {
  TeamRoster,
  type TeamRosterMember,
  type TeamRosterProps,
} from './TeamRoster';
import source from './TeamRoster.tsx?raw';

// sections/TeamRoster — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing suite doubles as proof of accessible
// markup, and this band is almost entirely structure — a `region` named by its
// own <h2>, ONE `list`, and the `article`s inside it, each named by its own
// <h3>.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// PersonnelCard / DoctorProfile precedent). next-intl's hooks throw without one,
// so a green render proves run D1: this band owns no message key and calls no
// t(). Every string below is a FIXTURE the page would have handed over —
// Romanian with diacritics (§15.7), invented people, the committed demo
// portraits; the eyebrow and the title are the RO drafts of the page's
// `team.roster.*` keys.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — a tile's width outside and inside
// the band scale, how many share a row at a measured column, the opener's
// sizes — is asserted one tier up, in TeamRoster.stories.tsx's play functions,
// and derived there from the measured column rather than from a pinned
// viewport.
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

// ── FIXTURES. The opener's two strings are the page's RO drafts
// (`team.roster.eyebrow` / `team.roster.title`); the three staff people are
// TeamRoster.stories.tsx's, so a failure here reads like the picture there,
// all on the committed demo portraits (600×800, the 3:4 headshot ratio every
// team picture uses — synthetic silhouettes, no real people, nothing to
// license). The third position is long enough to wrap inside a tile.
const EYEBROW = 'Echipa de sprijin';
const TITLE = 'Oamenii fără de care nu ne-am descurca';

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

// ── THE BYTE PINS. This band's own class strings — the rhythm box's own half,
// the tiles' row, one tile's width — written out so a silent edit fails here.
// Two things are deliberately NOT among them: the GUTTER and the BAND SCALE,
// both imported from ui/Container, because tests/unit/gutter-single-spelling
// .test.ts fences src/ against a second spelling of the clamp (§15.15 a) and
// tests/unit/design-scale.test.ts against a second spelling of the design
// pixel — the whole product of each promotion (§15.32).
const RHYTHM_OWN = 'flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20';
const TILES =
  'flex flex-wrap gap-x-5 gap-y-6 scalable:@4xl:@min-[896px]:gap-x-6';
const TILE = 'w-72 max-w-full scalable:@4xl:@min-[896px]:w-88';

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/** A class's variant chain — everything before its utility, colons kept
 *  (`a:b:c` → `a:b:`), read at the LAST colon outside brackets so an
 *  arbitrary value's own colons never split it. */
const chainOf = (token: string): string => {
  let depth = 0;
  let cut = 0;
  for (const [index, character] of [...token].entries()) {
    if (character === '[') depth += 1;
    if (character === ']') depth -= 1;
    if (character === ':' && depth === 0) cut = index + 1;
  }
  return token.slice(0, cut);
};

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
    <TeamRoster eyebrow={EYEBROW} title={TITLE} members={MEMBERS} {...props} />,
  );

/** The band, and the two boxes between it and the opener — reached by
 *  structure, because none of the three inner ones carries a role. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
const columnOf = (container: HTMLElement): HTMLElement =>
  bandOf(container).firstElementChild as HTMLElement;
const rhythmOf = (container: HTMLElement): HTMLElement =>
  columnOf(container).firstElementChild as HTMLElement;

describe('TeamRoster — the band, named by its own <h2>', () => {
  it('is a <section> region named by its <h2> — the title alone, never the eyebrow', () => {
    // The id comes from useId() and lands on the HEADING through
    // SectionHeading's `id`, never on its root, so the name is the title's
    // text alone (DoctorShowcase's D2, the DoctorStats shape).
    const { container } = renderRoster();

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(screen.getAllByRole('region')).toEqual([band]);
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe(TITLE);
    expect(heading.id).not.toBe('');
    expect(band).toHaveAttribute('aria-labelledby', heading.id);
    expect(band).not.toHaveAttribute('role');
    expect(band).not.toHaveAttribute('aria-label');
  });

  it('opens with the eyebrow over the title, at the start, every word of it whole', () => {
    // sections/SectionHeading at level 2, `align="start"` like every opener on
    // the Team page; `hyphens-none wrap-anywhere` rides its className merge
    // onto its root (§6.8) — DoctorStats' TITLE paragraph, the precedent.
    const { container } = renderRoster();

    const opener = rhythmOf(container).firstElementChild as HTMLElement;
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.parentElement).toBe(opener);
    expect(tokensOf(opener)).toEqual(
      expect.arrayContaining(['items-start', 'hyphens-none', 'wrap-anywhere']),
    );
    expect(tokensOf(opener)).not.toContain('items-center');

    const [eyebrow, title] = [...opener.children];
    expect(eyebrow?.tagName).toBe('P');
    expect(eyebrow?.textContent).toBe(EYEBROW);
    expect(title).toBe(heading);
  });

  it('keeps its own name when a caller WRITES a naming attribute in JSX — the Omit alone is not a refusal', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so the two lines below COMPILE despite the Omit (G2 typescript,
    // 2026-09-30). THE BELT: the band's own `aria-labelledby` rides after the
    // spread, and a caller's `aria-label` is reset.
    const { container } = render(
      <TeamRoster
        eyebrow={EYEBROW}
        title={TITLE}
        members={MEMBERS}
        aria-label="Personalul auxiliar"
        aria-labelledby="nowhere"
      />,
    );

    const band = bandOf(container);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByRole('region', { name: TITLE })).toBe(band);
    expect(
      screen.queryByRole('region', { name: 'Personalul auxiliar' }),
    ).toBeNull();
  });

  it('prints `title` as its heading and never as the section’s native tooltip', () => {
    // `title` is an OWN prop now: destructured before the spread, it is never
    // in `rest`, so the native attribute — which Chromium's accessibility tree
    // turns into a region NAME (measured 2026-09-30) — never reaches the
    // <section>, whichever door the value came through.
    const { container } = renderRoster();
    expect(bandOf(container)).not.toHaveAttribute('title');

    const spread = { title: 'Oamenii din spatele programărilor' } as const;
    const { container: spreadInto } = render(
      <TeamRoster eyebrow={EYEBROW} members={MEMBERS} {...spread} />,
    );
    expect(bandOf(spreadInto)).not.toHaveAttribute('title');
    expect(
      within(bandOf(spreadInto)).getByRole('heading', { level: 2 }).textContent,
    ).toBe(spread.title);
  });

  it('stands on the page ground and merges the caller className LAST', () => {
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter here, no outer margin (§6.4: the page owns the
    // rhythm between its bands).
    const { container } = renderRoster();
    expect(bandOf(container).className).toBe('bg-page');

    const { container: placed } = renderRoster({ className: 'scroll-mt-10' });
    expect(bandOf(placed).className).toBe('bg-page scroll-mt-10');
  });

  it('takes its gutter AND its band scale from ui/Container, never a second spelling', () => {
    // The ONE gutter definition on the site (§15.15 a, fb-343) on the column;
    // on the rhythm box, the band's own `py` and gap and then BOTH of
    // ui/Container's band-scale strings (§15.32, its recipe rule 5) — imported
    // and compared, so a hand-typed copy here would fail this test and the
    // src-wide fences alike.
    const { container } = renderRoster();

    expect(columnOf(container).className).toBe(containerClasses);
    expect(rhythmOf(container).className).toBe(
      `${RHYTHM_OWN} ${bandColumnClasses} ${bandScaleClasses}`,
    );
    for (const token of [
      ...bandColumnClasses.split(' '),
      ...bandScaleClasses.split(' '),
    ]) {
      expect(tokensOf(rhythmOf(container))).toContain(token);
    }
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
        eyebrow={EYEBROW}
        title={TITLE}
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
    // A caller's id lands on the BAND and nowhere else — neither the heading
    // nor a tile takes it.
    expect(container.querySelectorAll('[id="echipa"]')).toHaveLength(1);
  });

  it('renders NOTHING for an empty staff — no section, no heading, no padded box', () => {
    // A clinic with no auxiliary personnel yet is a state the populator can
    // really produce. The answer is `null` (the ReviewsCarousel / PriceList
    // exit): a titled band over "list, 0 items" is a promise with nothing
    // behind it (DoctorShowcase's D7).
    const { container } = renderRoster({ members: [] });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('TeamRoster — the staff tiles, fixed (D9)', () => {
  it('renders ONE list, marked for WebKit, right after the opener', () => {
    // `role="list"` is redundant in the spec and load-bearing in WebKit, which
    // drops list semantics from any `list-style: none` list (the ui/SpeedDial
    // precedent, an exception in eslint.config.mjs). getByRole throws on a
    // second list, so this is also the proof that there is only one.
    const { container } = renderRoster();

    const list = screen.getByRole('list');
    const opener = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect([...rhythmOf(container).children]).toEqual([opener, list]);
    expect([...list.children].map((item) => item.tagName)).toEqual(
      MEMBERS.map(() => 'LI'),
    );
  });

  it('lays the tiles in a wrapping row of FIXED widths — the stretching tracks are gone', () => {
    // D9: the <ul> a wrapping flex row that starts at the column — 20px
    // between two tiles of a row outside the band scale, 24 design pixels
    // inside it, 24 (design) px between rows — and every <li> 18rem outside the
    // band scale (`max-w-full` under a narrower column) and 352 design pixels
    // inside it. The auto-fit grid that made every tile a third of the row —
    // the owner's "always adjusting in width" — must not come back in any
    // spelling.
    const { container } = renderRoster();

    const list = screen.getByRole('list');
    expect(list.className).toBe(TILES);
    for (const item of list.children) {
      expect(item.className).toBe(TILE);
    }
    expect(tokensOf(list)).not.toContain('grid');
    expect(container.innerHTML).not.toMatch(/auto-fit|auto-fill|minmax/);
    expect(CODE).not.toMatch(/auto-fit|auto-fill|minmax/);
  });

  it('flips the tile width under the band scale’s OWN chain, byte for byte', () => {
    // The tile's regime width re-spells bandScaleClasses' variant chain,
    // because Tailwind reads a class only whole from source text (D9). The two
    // must agree, or the tiles would scale at another column than the band
    // they stand in.
    const chains = new Set(bandScaleClasses.split(' ').map(chainOf));
    expect(chains.size).toBe(1);
    const [bandChain] = [...chains];
    expect(bandChain).toBe('scalable:@4xl:@min-[896px]:');

    const regime = TILE.split(' ').filter((token) => chainOf(token) !== '');
    expect(regime).toEqual([`${bandChain}w-88`]);
    // …and outside it the tile is plain 18rem, capped by the row.
    expect(TILE.split(' ').filter((token) => chainOf(token) === '')).toEqual([
      'w-72',
      'max-w-full',
    ]);
    // The row's gap re-spells the same chain (D9: 20px outside the scale so a
    // 768 desktop window fits two, 24 design pixels inside it), and the row
    // starts at the column — never spread.
    expect(TILES.split(' ').filter((token) => chainOf(token) !== '')).toEqual([
      `${bandChain}gap-x-6`,
    ]);
    expect(TILES).not.toMatch(/justify-/);
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

  it('files the tiles under its own <h2>: no <h1>, ONE <h2>, every tile an <h3>', () => {
    // The <h1> is the PAGE's (sr-only, in its markup); the band's <h2> is the
    // only one here, and every person is an <h3> under it, handed down through
    // PersonnelCard's `headingLevel` (its D4) — the Team page's outline: h1 →
    // the doctors band's h2 → an h3 per doctor → this band's h2 → an h3 per
    // tile (the header's outline paragraph). Only the ELEMENT is asserted, never
    // the name's size class: that look is PersonnelCard's NAME_STEP.
    renderRoster();

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    const [opener, ...tiles] = screen.getAllByRole('heading');
    expect(opener).toBe(screen.getByRole('heading', { level: 2 }));
    expect(tiles).toHaveLength(MEMBERS.length);
    for (const [index, card] of screen.getAllByRole('article').entries()) {
      const heading = within(card).getByRole('heading', { level: 3 });
      expect(heading.tagName).toBe('H3');
      expect(heading.textContent).toBe(MEMBERS[index].name);
      expect(tiles[index]).toBe(heading);
      expect(within(card).queryAllByRole('heading', { level: 2 })).toEqual([]);
    }
  });

  it('places the tiles and nothing else — `h-full` on every card', () => {
    // A flex item is stretched to its line's height while the <article> inside
    // it is an ordinary block, so `h-full` is what makes a row's card surfaces
    // equal (the AuxiliaryTiles recipe). §6.4: the band owns all the spacing
    // and the cards own no margin at all.
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
  it('carries no width media query anywhere — those are the page’s (§6.5)', () => {
    // Container variants (@lg:/@3xl:/@4xl:/@min-[…]) are the allowed shape:
    // they measure ui/Container's COLUMN, which is what makes the same band
    // right inside a 312px phone gutter and a 1228px laptop one. `scalable:`
    // is globals.css's CAPABILITY gate — a mouse or trackpad, an engine that
    // registers custom properties — never a width: after it a class may only
    // name container steps (the band scale's chain) or none at all (its cap,
    // ui/Container's THE BAND SCALE).
    const { container } = renderRoster();

    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(^|:)(min|max)-\[/);
        if (!token.startsWith('scalable:')) continue;
        const after = chainOf(token).slice('scalable:'.length);
        for (const variant of after.split(':').filter(Boolean)) {
          expect(variant, token).toMatch(/^@/);
        }
      }
    }
    // Never vacuous: on the band's OWN boxes the cap, the design pixel, the
    // remap and one width per tile all wear the gate.
    const own = [rhythmOf(container), ...screen.getByRole('list').children];
    expect(
      own.flatMap(tokensOf).filter((token) => token.startsWith('scalable:')),
    ).toHaveLength(3 + MEMBERS.length);
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

  it('calls ONE hook — the server-safe useId, for its heading’s id', () => {
    // The band names itself by its <h2> now (the header's naming paragraph),
    // and the id that pairs them is useId()'s. Any other hook appearing here
    // would mean state or an effect appeared with it.
    expect([...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0])).toEqual([
      'useId(',
    ]);
  });

  it('imports two sections, one atom and lib/cx — and no data at all', () => {
    // The import surface is the guard that sees what a regex cannot: a lib
    // DATA import would turn a DUMB band into a second populator (run D1), and
    // swapping a composed section for something stateful would hydrate the
    // whole page without tripping a directive check. sections/SectionHeading
    // came back with the band's own opener on 2026-10-02.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/PersonnelCard/PersonnelCard',
      '@/components/sections/SectionHeading/SectionHeading',
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
    // The band scale is IMPORTED, never spelled here (§15.32): no design
    // pixel and no remap in this file's code.
    expect(CODE).toMatch(/\bbandColumnClasses\b/);
    expect(CODE).toMatch(/\bbandScaleClasses\b/);
    expect(CODE).not.toMatch(/design-scale|--scale-px|1106/);
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
    expectTypeOf<TeamRosterProps>().toHaveProperty('eyebrow');
    expectTypeOf<TeamRosterProps>().toHaveProperty('title');
    expectTypeOf<TeamRosterProps>().toHaveProperty('members');
    expectTypeOf<TeamRosterProps>().toHaveProperty('className');
    expectTypeOf<TeamRosterProps>().toHaveProperty('ref');
    // `title` is the band's heading text, a plain string — never the native
    // attribute's type intersected with it.
    expectTypeOf<TeamRosterProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<TeamRosterProps['eyebrow']>().toEqualTypeOf<string>();
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
    const BAND = { eyebrow: EYEBROW, title: TITLE, members: MEMBERS };

    // @ts-expect-error — the staff is required
    const memberless: TeamRosterProps = { eyebrow: EYEBROW, title: TITLE };
    // @ts-expect-error — the band's eyebrow is required (§15.32's opener)
    const plain: TeamRosterProps = { title: TITLE, members: MEMBERS };
    // @ts-expect-error — the band's title is required: it names the region
    const untitled: TeamRosterProps = { eyebrow: EYEBROW, members: MEMBERS };
    // @ts-expect-error — the title is finished TEXT, never a node or a number
    const numbered: TeamRosterProps = { ...BAND, title: 3 };
    // @ts-expect-error — content arrives as props; nested children would vanish
    const nested: TeamRosterProps = { ...BAND, children: 'x' };
    // @ts-expect-error — the band's name is its <h2>'s text alone
    const renamed: TeamRosterProps = { ...BAND, 'aria-label': 'x' };
    // @ts-expect-error — …and a caller's pair would replace the band's own
    const repaired: TeamRosterProps = { ...BAND, 'aria-labelledby': 'x' };
    // @ts-expect-error — an auxiliary has no quote to give (PersonnelCard D2)
    const talkative: TeamRosterMember = { ...MEMBERS[0], about: 'x' };
    // A WELL-FORMED path with no size: the refusal below is then about the
    // missing `width` / `height` alone, never about the path (G2 typescript).
    const SIZELESS = { src: '/images/x.jpg' } as const;
    // @ts-expect-error — the portrait's intrinsic size is the reserved box (§11)
    const flatPhoto: TeamRosterMember = { ...MEMBERS[0], photo: SIZELESS };

    expect([
      memberless,
      plain,
      untitled,
      numbered,
      nested,
      renamed,
      repaired,
      talkative,
      flatPhoto,
    ]).toHaveLength(9);
  });
});
