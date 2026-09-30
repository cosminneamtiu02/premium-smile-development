import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import { formatHoursRows, type HoursRow } from '@/lib/hours/hours';
import {
  DoctorProfile,
  type DoctorProfileProps,
  type ProfileHeading,
} from './DoctorProfile';
import source from './DoctorProfile.tsx?raw';
import { ScheduleCard } from './ScheduleCard';

// sections/DoctorProfile — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing test doubles as proof of accessible markup,
// and here that is most of the contract — each half opens with a REAL <h2>,
// EACH HALF is a `region` named by its own heading (the schedule card since
// round 2, the biography since the G2-R2 review's tier-2 a11y F2), and the band
// itself is deliberately NOT a named region (so exactly TWO regions coming
// back, biography then week, and neither of them the root, is an assertion
// rather than an omission). Since round 2g (D37) the card's heading is its
// title ALONE — the only eyebrow left in the band is the „Despre" half's, and
// the first suite below proves the card prints none — and since G2-R2 the
// step's grid is ONE row: the biography stays a box (a region never wears
// `contents`), the card centred beside it.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the Wordmark/SectionHeading/PersonnelCard
// precedent). next-intl's hooks throw without one, so a green render proves
// what the run's D1 states: this band calls no t() and owns no message key.
// Every string below is a FIXTURE the doctor page would have translated —
// Romanian with diacritics (§15.7), factual (CMSR: no superlatives, no
// promises, no result guarantees), D-DASH-clean (no mid-sentence punctuation
// dashes), and drafted for this suite rather than copied from lib/team, so a
// data edit can never turn a layout test red.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the card's one 20rem width beside
// the prose and centred under it (D53), the card's vertical middle on the
// band's (D37), the card never
// stretched to the prose's height, the one-column stack below the step — is
// asserted one tier up, in DoctorProfile.stories' play functions. The
// GROUND's real CSS (the tint's measured alpha, the fades reaching the middle
// box's colour) is TintedBand.stories' to measure now (run D29).
//
// ── THE ONE OTHER SECTION IN THIS FILE IS THE GROUND, RENDERED WHOLE:
// sections/TintedBand is this band's composed public component (§4's section
// → section rule, run D29), and the "composes sections/TintedBand" suite below
// renders a BARE one to read its outer and its three boxes off the DOM — so
// this file spells none of the ground, and a retuned tint or fade turns
// TintedBand.test.tsx red (its byte pins, its `?raw` cross-pin with the Hero)
// rather than this one. ScheduleCard is rendered standalone below too, as this
// band's OWN in-folder piece: the card's classes are read off it rather than
// re-spelled here. And sections/SectionHeading is rendered bare ONCE, in the
// one-row suite, so that "the band hands the biography's opener no className"
// is compared against the opener's own row rather than a copy of it.

// ── FIXTURES. The doctor of the run's demo people, in three short
// third-person paragraphs (D14: plain prose, one string per paragraph). The
// card's title is the page's own Romanian draft of `team.doctor.schedule.title`
// (D26) — and, since D37, the card's only heading row: no eyebrow travels.
const ABOUT_HEADING = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
} satisfies ProfileHeading;

const SCHEDULE_TITLE = 'Când mă găsiți la clinică';

const PARAGRAPHS = [
  'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate fixe sau cu gutiere transparente, după caz.',
  'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns.',
  'Fiecare etapă este explicată înainte de a începe, cu durata estimată și costul ei. Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament.',
] as const;

// The week through lib/hours — a MECHANICS call, exactly what the page makes:
// mornings on Monday, Wednesday and Friday, afternoons on Tuesday and
// Thursday, the weekend closed.
const ROWS: readonly HoursRow[] = formatHoursRows(
  [
    {
      days: ['Monday', 'Wednesday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
    { days: ['Tuesday', 'Thursday'], opens: '12:00', closes: '20:00' },
  ],
  'ro',
  'Închis',
);

const ABOUT = { ...ABOUT_HEADING, paragraphs: PARAGRAPHS };
const SCHEDULE = { title: SCHEDULE_TITLE, rows: ROWS };

// ── THE BYTE PINS, written OUT rather than imported: the test must fail on a
// silent edit to the band's own classes, which an import would follow (the
// ui/Eyebrow RECIPE convention, and PersonnelCard's reading of it). These are
// the band's OWN markup — the grid and what sits in it; the ground's classes
// are read off a bare TintedBand (`bareGround`) and every atom's off a render.
/** D53's two tracks — the prose takes the rest, the card EXACTLY 20rem: no
 *  share, no floor, nothing that grows with the window. */
const TWO_TRACKS = '@3xl:grid-cols-[minmax(0,1fr)_20rem]';
/** The grid: two tracks and ONE row at the step, the outdent and the column
 *  gap (the header's D53 · ONE WIDTH, D37 and PROSE OUTDENT paragraphs). No
 *  row gap is re-stated at the step: one row has no gap between rows. */
const GRID =
  'grid gap-10 py-6 @lg:py-8 @3xl:-ms-8 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:gap-x-12 @3xl:py-10';
/** The biography: a named region (G2-R2 a11y F2), so a flex column at EVERY
 *  width — the opener over the paragraphs' block, 24px apart — and never
 *  `contents`, which would cost the region its role. */
const ABOUT_SECTION = 'flex flex-col gap-6';
/** The paragraphs' block — `max-w-4xl` is the ONE lever on the measure. */
const PARAGRAPHS_BLOCK = 'flex max-w-4xl flex-col gap-4';
/** The card's ONE width (D53): the full column up to 20rem, centred — the
 *  same length as TWO_TRACKS' second track, ungated. */
const CARD_WIDTH = 'w-full max-w-80 mx-auto';
/** The card's placement (D37): centred in the one row — its middle the
 *  band's — at its own height; the DOM order seats it in the second track. */
const CARD_PLACE = '@3xl:self-center';
/** Any grid placement utility, at any variant: the one-row shape names no
 *  row and no column — two items, two tracks, the DOM order seats them. */
const PLACEMENT = /(^|:)-?(row|col)-(start|end|span)-/;
/** `display: contents`, at any variant — allowed ONLY on the week's role-less
 *  <div> pairs (ScheduleCard's THE WEEK IS CENTRED paragraph). */
const DISSOLVES = /(^|:)contents$/;

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this component
 * is deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and next-intl by name. Known limit, same as there: it strips block comments
 * and whole-line `//` comments, not a `//` trailing real code — a shape this
 * file does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/**
 * THE GROUND, READ OFF A BARE sections/TintedBand (run D29) — the outer's class
 * row, the three boxes' rows and the column's, from a TintedBand holding
 * nothing. This band is SUPPOSED to be one of those with its grid inside, so
 * comparing against a live render (rather than a spelled copy) is what makes
 * "the section IS TintedBand's" a checkable claim: a ground retuned in its own
 * file moves both sides of every comparison at once, and a DoctorProfile that
 * grew a paint of its own fails here.
 */
const bareGround = (): Readonly<{
  band: string;
  fadeIn: string;
  middle: string;
  fadeOut: string;
  column: string;
}> => {
  const { container, unmount } = render(<TintedBand>{null}</TintedBand>);
  const band = container.firstElementChild as HTMLElement;
  const [fadeIn, middle, fadeOut] = [...band.children] as HTMLElement[];
  const ground = {
    band: band.className,
    fadeIn: fadeIn.className,
    middle: middle.className,
    fadeOut: fadeOut.className,
    column: (middle.firstElementChild as HTMLElement).className,
  };
  unmount();
  return ground;
};

/** The <section> — the band itself; everything else is found through a role or
 *  through the three boxes below it. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

/** The three ground boxes TintedBand renders, in flow order: fade in · tinted
 *  middle · fade out (run D7, extracted in D29). Reached by structure because
 *  paint carries no role. */
const boxesOf = (container: HTMLElement): HTMLElement[] =>
  [...bandOf(container).children] as HTMLElement[];

/** The grid inside the middle box's Container, and its two direct children —
 *  layout boxes, so structure again. */
const gridOf = (container: HTMLElement): HTMLElement =>
  boxesOf(container)[1].firstElementChild?.firstElementChild as HTMLElement;
const halvesOf = (container: HTMLElement): HTMLElement[] =>
  [...gridOf(container).children] as HTMLElement[];

/** The paragraphs' block — the about half's last child, under the opener. */
const paragraphsBlockOf = (container: HTMLElement): HTMLElement =>
  halvesOf(container)[0].lastElementChild as HTMLElement;

const renderBand = (
  props: Partial<DoctorProfileProps> = {},
): ReturnType<typeof render> =>
  render(<DoctorProfile about={ABOUT} schedule={SCHEDULE} {...props} />);

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The card's own class row, READ OFF A STANDALONE ScheduleCard with the same
 * strings — so what the band adds on top of it (its placement, and nothing
 * else) is the only thing this suite spells.
 */
const cardRow = (): string => {
  const { container, unmount } = render(<ScheduleCard {...SCHEDULE} />);
  const row = (container.firstElementChild as HTMLElement).className;
  unmount();
  return row;
};

describe('DoctorProfile — about ‖ schedule (D14)', () => {
  it('opens each half with its own <h2> — the prose over its eyebrow, the card over none (D37)', () => {
    renderBand();

    // Level 2, both of them: the page's <h1> is the doctor's name, one band up
    // in sections/DoctorIntro, and the two halves are siblings.
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      ABOUT_HEADING.title,
      SCHEDULE_TITLE,
    ]);
    // The „Despre" eyebrow sits directly ABOVE its own title (SectionHeading's
    // order), and the diacritics survive the chain — queried by TEXT, because
    // a role query would still match a mangled string.
    const label = screen.getByText(ABOUT_HEADING.eyebrow);
    expect(label.textContent).toBe(ABOUT_HEADING.eyebrow);
    expect(label.nextElementSibling).toBe(headings[0]);
    expect(headings[1].textContent).toBe('Când mă găsiți la clinică');
    // The card's opener is its <h2> ALONE (D37): nothing before the title in
    // its wrapper, and no <p> anywhere in the card — SectionHeading renders no
    // row for an omitted eyebrow, never an empty one.
    const card = screen.getByRole('region', { name: SCHEDULE_TITLE });
    expect(headings[1].previousElementSibling).toBeNull();
    expect(headings[1].parentElement?.children).toHaveLength(1);
    expect(card.querySelectorAll('p')).toHaveLength(0);
    // Nothing else claims a heading level — an <h1> here would fight the page.
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('names TWO regions by their <h2>s, biography then week — never the band (G2-R2 a11y F2)', () => {
    const { container } = renderBand();

    // A landmark walk over the doctor page must stop on the biography as well
    // as on the card beside it (the header's TWO <h2>s, TWO REGIONS
    // paragraph): exactly two regions, in DOM order, each named by its own
    // title ALONE — exact-match queries, so a name that had picked up the
    // „Biografie" eyebrow fails — and the band's root is neither of them.
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(2);
    const [about, week] = regions;
    expect(screen.getByRole('region', { name: ABOUT_HEADING.title })).toBe(
      about,
    );
    expect(screen.getByRole('region', { name: SCHEDULE_TITLE })).toBe(week);
    expect(regions).not.toContain(bandOf(container));
    // Each region holds its OWN heading and not its sibling's: the biography
    // is not nested in the card, nor the card in the biography.
    const aboutHeading = screen.getByRole('heading', {
      level: 2,
      name: ABOUT_HEADING.title,
    });
    const weekHeading = screen.getByRole('heading', {
      level: 2,
      name: SCHEDULE_TITLE,
    });
    expect(about).toContainElement(aboutHeading);
    expect(about).not.toContainElement(weekHeading);
    expect(week).toContainElement(weekHeading);
    expect(week).not.toContainElement(aboutHeading);
    // Both are bare <section>s made regions by their name — no role bolted on
    // (§9 semantic HTML first), the CredoCard/ScheduleCard idiom.
    for (const region of regions) {
      expect(region.tagName).toBe('SECTION');
      expect(region).not.toHaveAttribute('role');
    }
  });

  it('puts the biography’s id on its <h2>, never on the region or the opener', () => {
    renderBand();

    // useId() rides SectionHeading's `id` prop onto the heading (its id
    // paragraph), so aria-labelledby reads the title alone. The region keeps
    // no id of its own and the opener's wrapper carries none either.
    const about = screen.getByRole('region', { name: ABOUT_HEADING.title });
    const heading = screen.getByRole('heading', {
      level: 2,
      name: ABOUT_HEADING.title,
    });
    const id = heading.getAttribute('id') as string;
    expect(id).toBeTruthy();
    expect(document.getElementById(id)).toBe(heading);
    expect(about).toHaveAttribute('aria-labelledby', id);
    expect(about).not.toHaveAttribute('id');
    expect(heading.parentElement).not.toHaveAttribute('id');
  });

  it('gives two bands on one page four different region ids (useId)', () => {
    render(
      <>
        <DoctorProfile about={ABOUT} schedule={SCHEDULE} />
        <DoctorProfile
          about={{ ...ABOUT, title: 'Despre Dr. Andrei Pop' }}
          schedule={{ ...SCHEDULE, title: 'Programul doctorului' }}
        />
      </>,
    );

    const ids = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(
      screen.getByRole('region', { name: 'Despre Dr. Andrei Pop' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(4);
  });

  it('renders the paragraphs as plain <p>s, in order, in the full ink', () => {
    const { container } = renderBand();

    const block = paragraphsBlockOf(container);
    const paragraphs = [...block.children] as HTMLElement[];
    expect(paragraphs.map((p) => p.tagName)).toEqual(['P', 'P', 'P']);
    expect(paragraphs.map((p) => p.textContent)).toEqual([...PARAGRAPHS]);
    for (const paragraph of paragraphs) {
      // `text-ink`, not muted (D14: reading prose for §1's reader, 9.7:1 on
      // the 30 % tint), and JUSTIFIED on the element — the owner's word of
      // 2026-09-25 (round 2c), §15.1's third per-element exception.
      expect(paragraph.className).toBe('text-lg text-ink text-justify');
      // PLAIN text: no fragments, no markup — one string became one <p>.
      expect(paragraph.children).toHaveLength(0);
    }
  });

  it('justifies the three paragraphs and NOTHING else — and centres only the card’s opener (§15.15 b)', () => {
    const { container } = renderBand();

    // The elements that carry `text-justify` are exactly the about paragraphs
    // (the per-element canon: the utility rides each <p>, never a wrapper).
    // The ONE `text-center` is SectionHeading's own `align="center"` root inside
    // the schedule card (round 2e, D26): a heading block — display text, which
    // the canon leaves free to centre — never a wrapper around prose.
    const opener = screen.getByRole('heading', {
      level: 2,
      name: SCHEDULE_TITLE,
    }).parentElement as HTMLElement;
    expect(tokensOf(opener)).toContain('text-center');
    const justified = [...container.querySelectorAll('*')].filter((element) =>
      tokensOf(element).includes('text-justify'),
    );
    expect(justified.map((element) => element.tagName)).toEqual([
      'P',
      'P',
      'P',
    ]);
    expect(justified.map((element) => element.textContent)).toEqual([
      ...PARAGRAPHS,
    ]);
    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        if (token === 'text-justify' && justified.includes(element)) continue;
        if (token === 'text-center' && element === opener) continue;
        expect(token).not.toMatch(/(^|:)text-(justify|center)$/);
      }
    }
  });

  it('opts the doctor’s name out of hyphenation — on the biography’s opener, never above the card’s title (§15.14)', () => {
    const { container } = renderBand();

    // The biography's title carries a PERSON'S NAME, and the body's site-wide
    // `hyphens: auto` broke real doctors' names at a syllable on phones
    // (DoctorProfile.tsx's THE NAME IS NEVER SPLIT comment). The opt-out
    // rides SectionHeading's ROOT — the <h2>'s own wrapper, the region's
    // first child — and reaches the heading because `hyphens` inherits. The
    // CLASS is the pin: no stylesheet is loaded here, so a computed `hyphens`
    // would read back the browser's default with or without it.
    const about = screen.getByRole('region', { name: ABOUT_HEADING.title });
    const opener = screen.getByRole('heading', {
      level: 2,
      name: ABOUT_HEADING.title,
    }).parentElement as HTMLElement;
    expect(opener).toBe(about.firstElementChild);
    expect(tokensOf(opener)).toContain('hyphens-none');
    // …and the card's title beside it keeps the inheritance: its words are
    // ordinary words, wrapping between them (ScheduleCard's heading
    // paragraph). Nothing from that <h2> up to the band's root may carry the
    // class, so a refactor that hoists the opt-out to the grid, the ground or
    // the whole band fails here, naming the element. The walk must reach the
    // root, or it proved nothing.
    const band = bandOf(container);
    const path: HTMLElement[] = [];
    for (
      let element: HTMLElement | null = screen.getByRole('heading', {
        level: 2,
        name: SCHEDULE_TITLE,
      });
      element !== null && band.contains(element);
      element = element.parentElement
    ) {
      path.push(element);
    }
    expect(path.at(-1)).toBe(band);
    expect(
      path.filter((element) => tokensOf(element).includes('hyphens-none')),
    ).toEqual([]);
  });

  it('draws no list and no divider — the card’s own edge separates', () => {
    const { container } = renderBand();

    // The courses left this band (D15), and with them the <ul>.
    expect(container.querySelector('ul, ol, li')).toBeNull();
    // Round 1's one border that changed side is deleted (D14): no side or
    // top rule anywhere, no accent line, no <hr>, no separator role. Round 2c's
    // rule under the schedule's heading came and went (round 2e, "remove thin
    // line"), so the <dl> carries no border side either.
    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)border-(t|s|e|b|x|y)(-|$)/);
        expect(token).not.toMatch(/border-accent/);
      }
    }
    expect(container.querySelector('hr')).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('seats the biography region and the card as the grid’s two direct children — both BOXES', () => {
    const { container } = renderBand();

    const grid = gridOf(container);
    expect(grid.className).toBe(GRID);
    // The two-track token itself, pinned apart from the whole row so its
    // failure message names the one-width decision (D53).
    expect(tokensOf(grid)).toContain(TWO_TRACKS);

    const [about, card] = halvesOf(container);
    expect(halvesOf(container)).toHaveLength(2);
    // The first child IS the biography's region (G2-R2 a11y F2): a flex
    // column at every width, the opener then the paragraphs' block.
    expect(about).toBe(
      screen.getByRole('region', { name: ABOUT_HEADING.title }),
    );
    expect(about.className).toBe(ABOUT_SECTION);
    expect(about.children).toHaveLength(2);
    expect(about.firstElementChild).toBe(
      screen.getByRole('heading', { name: ABOUT_HEADING.title }).parentElement,
    );
    expect(paragraphsBlockOf(container).className).toBe(PARAGRAPHS_BLOCK);
    // DOM order = reading order = region order: the biography first, then
    // the card, in both arrangements.
    expect(card).toBe(screen.getByRole('region', { name: SCHEDULE_TITLE }));
    // A REGION NEVER DISSOLVES: `display: contents` on an element with a
    // role is the accessibility-tree bug ScheduleCard's THE WEEK IS CENTRED
    // paragraph cites. Round 2g's `@3xl:contents` on this half is gone, and
    // the one place the token may appear is the week's role-less <div>
    // pairs, inside the <dl>.
    const dissolving = [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ].filter((element) => tokensOf(element).some((t) => DISSOLVES.test(t)));
    expect(dissolving.length).toBeGreaterThan(0);
    for (const element of dissolving) {
      expect(element.tagName).toBe('DIV');
      expect(element.parentElement?.tagName).toBe('DL');
      expect(element).not.toHaveAttribute('role');
    }
  });

  it('seats the card in ONE row, centred, at its own height — D37 by construction', () => {
    const { container } = renderBand();

    // ScheduleCard's own row, then the band's width and its one placement
    // utility, merged caller-last (§6.8). Nothing else is added from here.
    const card = halvesOf(container)[1];
    const tokens = tokensOf(card);
    expect(tokens).toContain('@3xl:self-center');
    expect(card.className).toBe(`${cardRow()} ${CARD_WIDTH} ${CARD_PLACE}`);
    // Round 2g's two-row seat is gone, not stacked under the one-row shape
    // (G2-R2 a11y F2): no element in the band names a row or a column — the
    // card's `row-start-1 row-span-2`, the opener's `row-start-1`, the
    // paragraphs' `row-start-2` and the `col-start-*`s all left together —
    // and the grid re-states no row gap, since one row has none.
    for (const element of [
      bandOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      expect(
        tokensOf(element).filter((token) => PLACEMENT.test(token)),
      ).toEqual([]);
    }
    expect(
      tokensOf(gridOf(container)).filter((token) => /gap-y-/.test(token)),
    ).toEqual([]);
    // Centring aligns the card, it never pulls it to the row's height: no
    // `self-stretch`, and no `self-start` pinning its top where D37 wants
    // its middle.
    expect(
      tokens.filter((token) => /self-(stretch|start)/.test(token)),
    ).toEqual([]);
    // The opener is the region's child, never a grid item, so the band hands
    // it NO placement: its row is a bare SectionHeading's, read off a live
    // render rather than spelled here, plus the ONE class the name in its
    // title needs, `hyphens-none`, merged last (DoctorProfile.tsx's THE NAME
    // IS NEVER SPLIT comment).
    const [about] = halvesOf(container);
    const { container: bare, unmount } = render(
      <SectionHeading level={2} eyebrow="x" title="y" />,
    );
    const bareRow = (bare.firstElementChild as HTMLElement).className;
    unmount();
    expect((about.firstElementChild as HTMLElement).className).toBe(
      `${bareRow} hyphens-none`,
    );
  });

  it('gives the card ONE width, 20rem — the track and the cap are one length (D53)', () => {
    // "should not be widening as you widen the screen or tighten when you
    // tighten it" (owner, round 2k). Two spellings of the same 20rem, a
    // KEEP-IN-SYNC pair inside this band: the step's second track, and the
    // stacked card's cap. Read off the RENDER and compared, so retuning one
    // without the other fails here, naming the pair.
    const { container } = renderBand();

    const grid = tokensOf(gridOf(container));
    const tracks = grid
      .map((token) =>
        /^@3xl:grid-cols-\[minmax\(0,1fr\)_(\d+(?:\.\d+)?)rem\]$/.exec(token),
      )
      .find(Boolean);
    expect(tracks, 'the prose track, then ONE fixed rem length').toBeTruthy();
    const card = tokensOf(halvesOf(container)[1]);
    const cap = card
      .map((token) => /^max-w-(\d+(?:\.\d+)?)$/.exec(token))
      .find(Boolean);
    expect(cap, 'the stacked card is capped on the spacing scale').toBeTruthy();
    // `max-w-N` is N × 0.25rem on Tailwind's untouched spacing scale (§3).
    expect(Number(cap?.[1]) * 0.25).toBe(Number(tracks?.[1]));
    expect(Number(tracks?.[1])).toBe(20);

    // Round 2e's share and floor are gone, not stacked under the new track:
    // ONE track list on the grid, so nothing can still hand the card a slice
    // of the free space.
    expect(grid.filter((token) => token.includes('grid-cols-'))).toEqual([
      TWO_TRACKS,
    ]);
    expect(grid.filter((token) => /minmax\(20rem|3fr/.test(token))).toEqual([]);
    // Stacked, the card fills the column UP TO the cap and sits centred: the
    // three utilities ride the card UNGATED (at the step they are inert —
    // `w-full` of a 20rem track is 20rem, the auto margins find no room), and
    // no width, min-width or inline margin is re-stated under a container
    // variant, where it could fight the track.
    for (const token of ['w-full', 'max-w-80', 'mx-auto']) {
      expect(card).toContain(token);
    }
    expect(
      card.filter((token) => /^@[^:]+:(-?m[xse]?-|(min-|max-)?w-)/.test(token)),
    ).toEqual([]);
    expect(card.filter((token) => /^min-w-/.test(token))).toEqual([]);
  });

  it('prints the week the page formatted: seven terms, seven values', () => {
    renderBand();

    const card = screen.getByRole('region', { name: SCHEDULE_TITLE });
    const terms = [...card.querySelectorAll('dt')].map((dt) => dt.textContent);
    const values = [...card.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(terms).toEqual(ROWS.map((row) => row.label));
    expect(values).toEqual(ROWS.map((row) => row.value));
    expect(terms).toHaveLength(7);
  });

  it('renders what it is given: no paragraphs is an empty block, not a branch', () => {
    // A page bug, not a state (the header's NO BRANCHES paragraph): the band
    // keeps its shape and simply has nothing to print in the block.
    const { container } = renderBand({
      about: { ...ABOUT_HEADING, paragraphs: [] },
    });

    const block = paragraphsBlockOf(container);
    expect(block.className).toBe(PARAGRAPHS_BLOCK);
    expect(block.children).toHaveLength(0);
    expect(halvesOf(container)).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
  });
});

describe('DoctorProfile — composes sections/TintedBand (run D29)', () => {
  it('IS a TintedBand: the same outer, the same three boxes, the same column', () => {
    // The ground left this file for sections/TintedBand, and this is the
    // whole claim the band still makes about it: every class the ground
    // paints is the one a bare TintedBand paints, read off a live render —
    // the tint, the fades and their Hero cross-pin are pinned THERE.
    const ground = bareGround();
    const { container } = renderBand();

    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe(ground.band);

    const [fadeIn, middle, fadeOut] = boxesOf(container);
    expect(boxesOf(container)).toHaveLength(3);
    expect(fadeIn.className).toBe(ground.fadeIn);
    expect(middle.className).toBe(ground.middle);
    expect(fadeOut.className).toBe(ground.fadeOut);
    // The fades are paint on this band as on every TintedBand.
    expect(fadeIn).toHaveAttribute('aria-hidden', 'true');
    expect(fadeOut).toHaveAttribute('aria-hidden', 'true');
    expect((middle.firstElementChild as HTMLElement).className).toBe(
      ground.column,
    );
  });

  it('puts ONE thing on the ground: the D14 grid, straight inside the column', () => {
    // What this band adds is its content, never a second wrapper between the
    // ground's column and the grid (the `py` rides the grid — TintedBand adds
    // no padding, its NO VERTICAL PADDING paragraph).
    const { container } = renderBand();

    const column = boxesOf(container)[1].firstElementChild as HTMLElement;
    expect(column.children).toHaveLength(1);
    expect(column.firstElementChild).toBe(gridOf(container));
    expect(gridOf(container).className).toBe(GRID);
  });
});

describe('DoctorProfile — the native surface (§6.8)', () => {
  it('merges the caller className LAST on the <section>', () => {
    const { container } = renderBand({ className: 'mt-10' });

    // The className travels to TintedBand untouched and lands after the
    // ground's own row there — the bare ground's row, then the caller's.
    const band = bandOf(container);
    expect(band.tagName).toBe('SECTION');
    expect(band.className).toBe(`${bareGround().band} mt-10`);
  });

  it('spreads native props onto the band', () => {
    const { container } = render(
      <DoctorProfile
        about={ABOUT}
        schedule={SCHEDULE}
        lang="de"
        id="profile"
        data-band="doctor-profile"
      />,
    );

    const band = bandOf(container);
    expect(band).toHaveAttribute('lang', 'de');
    expect(band).toHaveAttribute('id', 'profile');
    expect(band).toHaveAttribute('data-band', 'doctor-profile');
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();
    render(<DoctorProfile about={ABOUT} schedule={SCHEDULE} ref={band} />);

    expect(band.current?.tagName).toBe('SECTION');
  });

  it('takes no name of its own — the two headings are the structure', () => {
    const { container } = renderBand();

    // An <section> without an accessible name is a generic box, not a region:
    // there is no single noun covering "who he is" and "when he is here", and
    // a name invented for the pair would wrap the two named halves in a third
    // region called after one of them. The TWO regions in the band are its
    // halves (G2-R2 a11y F2), never the band itself.
    const band = bandOf(container);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    expect(screen.getAllByRole('region')).not.toContain(band);
    expect(band).not.toHaveAttribute('aria-label');
    expect(band).not.toHaveAttribute('aria-labelledby');
  });
});

describe('DoctorProfile — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s', () => {
    // Container variants (@lg:, @3xl:) are the allowed shape: they measure the
    // gutter COLUMN, which is what makes the same band right inside a page and
    // inside a story canvas the sidebar narrowed.
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

  it('ships NO client directive — the band is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bnext-intl\b/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    // Since G2-R2 (a11y F2) the biography's region is named through useId —
    // the CredoCard/ScheduleCard idiom, server-safe and hydration-stable, so
    // it costs no 'use client'. Once, and nothing else.
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect(hooks).toEqual(['useId(']);
  });

  it('imports EXACTLY what it renders, plus react and the row TYPE', () => {
    // The import surface is the guard a regex over the body cannot be: a data
    // module imported here would make the band its own populator and break the
    // run's D1 in a way no rendered assertion would notice. lib/hours is the
    // one lib specifier and it must arrive `import type`: the band never
    // formats a row (the page does), and a type import erases to nothing at
    // build time. sections/TintedBand joined in run D29 — and ui/Container and
    // lib/cx LEFT with the markup they served: the Container is rendered
    // inside TintedBand now, and `className` passes through to it unjoined.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      './ScheduleCard',
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/sections/TintedBand/TintedBand',
      '@/lib/hours/hours',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{[^}]*\bHoursRow\b[^}]*\} from '@\/lib\/hours\/hours';$/m,
    );
    // No lib DATA at all (run D1): the words and the week arrive finished.
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive and no message-key path (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way.
    const { container } = renderBand();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    // Every character on the band, in order — and no eyebrow between the
    // prose and the card's title (D37).
    expect(container.textContent).toBe(
      `${ABOUT_HEADING.eyebrow}${ABOUT_HEADING.title}${PARAGRAPHS.join('')}` +
        SCHEDULE_TITLE +
        ROWS.map((row) => `${row.label}${row.value}`).join(''),
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('DoctorProfile — type-level pins', () => {
  it('pins the props surface so a refactor cannot quietly widen it', () => {
    // Erased to no-ops at runtime; they fail at `tsc --noEmit` time, naming
    // the property. `children` would be swallowed silently (JSX children beat
    // spread ones), and either ARIA naming attribute would turn the band into
    // a region announced by a name that covers only one of its halves.
    expectTypeOf<ProfileHeading>().toEqualTypeOf<
      Readonly<{ eyebrow: string; title: string }>
    >();
    expectTypeOf<DoctorProfileProps['about']['paragraphs']>().toEqualTypeOf<
      readonly string[]
    >();
    expectTypeOf<DoctorProfileProps['schedule']['rows']>().toEqualTypeOf<
      readonly HoursRow[]
    >();
    // The card's content is a title and the week — nothing else (D37 struck
    // the eyebrow; `ProfileHeading` above is the prose's pair alone now).
    expectTypeOf<DoctorProfileProps['schedule']>().toEqualTypeOf<
      Readonly<{ title: string; rows: readonly HoursRow[] }>
    >();
    expectTypeOf<DoctorProfileProps['schedule']>().not.toHaveProperty(
      'eyebrow',
    );
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('children');
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('aria-label');
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('aria-labelledby');
    // The courses LEFT this band (D15) — a caller still handing them over is
    // a caller that has not moved them to sections/DoctorCourses.
    expectTypeOf<DoctorProfileProps>().not.toHaveProperty('courses');
  });

  it('does carry the surface those pins are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin above would pass while proving
    // nothing.
    expectTypeOf<DoctorProfileProps>().toHaveProperty('about');
    expectTypeOf<DoctorProfileProps>().toHaveProperty('schedule');
    expectTypeOf<DoctorProfileProps>().toHaveProperty('className');
  });

  it('refuses the shapes the Omits and the two halves exist to refuse', () => {
    // Never rendered: these exist so `tsc --noEmit` fails if the surface
    // loosens. @ts-expect-error is itself an error when the line compiles, so
    // both directions are covered (the ui/GlyphButton precedent).
    const BASE = {
      about: ABOUT,
      schedule: SCHEDULE,
    } satisfies DoctorProfileProps;

    // @ts-expect-error — the band exists for the doctor's words (run D1)
    const wordless: DoctorProfileProps = { schedule: BASE.schedule };
    // @ts-expect-error — the white card is half the band (D14)
    const cardless: DoctorProfileProps = { about: BASE.about };
    // @ts-expect-error — content arrives as props; children would vanish
    const nested: DoctorProfileProps = { ...BASE, children: 'x' };
    // @ts-expect-error — the band deliberately has no one name
    const named: DoctorProfileProps = { ...BASE, 'aria-label': 'Despre' };
    // @ts-expect-error — a caller's pair would name it after one half
    const paired: DoctorProfileProps = { ...BASE, 'aria-labelledby': 'x' };
    // @ts-expect-error — the courses left for sections/DoctorCourses (D15)
    const coursed: DoctorProfileProps = { ...BASE, courses: [] };
    // The last three sit INSIDE the literal: a multi-line object reports the
    // mismatch on the offending PROPERTY, and @ts-expect-error only silences
    // the line right under it (TS2578 caught both when they sat on the `const`).
    const oneString: DoctorProfileProps = {
      ...BASE,
      // @ts-expect-error — paragraphs are a LIST of finished strings, never one
      about: { ...ABOUT_HEADING, paragraphs: PARAGRAPHS[0] },
    };
    const fragments: DoctorProfileProps = {
      ...BASE,
      // @ts-expect-error — plain prose only: no ReactNode body (D14)
      about: { ...ABOUT_HEADING, paragraphs: [<b key="k">ortodonție</b>] },
    };
    const eyebrowed: DoctorProfileProps = {
      ...BASE,
      schedule: {
        // @ts-expect-error — the card's eyebrow is struck (D37, round 2g)
        eyebrow: 'Program',
        title: SCHEDULE_TITLE,
        rows: ROWS,
      },
    };
    const untitled: DoctorProfileProps = {
      ...BASE,
      // @ts-expect-error — the title names the card's region; it stays required
      schedule: { rows: ROWS },
    };

    expect([
      wordless,
      cardless,
      nested,
      named,
      paired,
      coursed,
      oneString,
      fragments,
      eyebrowed,
      untitled,
    ]).toHaveLength(10);
  });
});
