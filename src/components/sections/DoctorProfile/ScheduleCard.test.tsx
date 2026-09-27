import { createRef, type Ref } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Card } from '@/components/ui/Card/Card';
import { Text } from '@/components/ui/Text/Text';
import { formatHoursRows, type HoursRow } from '@/lib/hours/hours';
import { ScheduleCard, type ScheduleCardProps } from './ScheduleCard';
import source from './ScheduleCard.tsx?raw';

// sections/DoctorProfile/ScheduleCard — the interaction suite, MOVED with the
// card from the dropped DoctorTeam band (round 2's D13) and adapted to its new
// seat (D14). Role-based queries wherever a role exists (§9, §13): a passing
// test doubles as proof of accessible markup, and here that is most of the
// contract — the card is a named `region` because the id really sits on its
// <h2>, and the week is a <dl> because a day and what happens on it are a term
// and its value.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// PersonnelCard / SectionHeading precedent). next-intl's hooks throw without
// one, so a green render proves run D1: this card owns no message key and
// calls no t(). Every string below is a FIXTURE the page would have
// translated — Romanian with diacritics (§15.7).
//
// ── THE ROWS COME FROM lib/hours, never from hand-typed strings. A section
// may call a MECHANICS module (§4's foundation ring), and a test may too: the
// weekday words are then the browser's own for the locale, so „Marți" and
// „Sâmbătă" reach this file the same way they reach the page. Typing them out
// would pin this suite to Intl's output of one day rather than to the
// formatter's contract.
//
// ── EVERY CLASS EXPECTATION IS READ OFF A RENDERED ATOM, never re-spelled
// here: the framed white card off `<Card tone="framed">`, the opener off
// `<SectionHeading level={2}>` with no eyebrow (D37), the two row inks off
// `<Text>`. What this suite must prove is that the card COMPOSES those pieces
// unmodified — an extra utility would mean the section had started restyling
// an atom's internals (§6.8), a missing one that it had stopped composing it —
// and a copy typed out here would only prove that two spellings agree today.
// Deriving also keeps this file clear of tests/unit/card-single-spelling.test.ts,
// the src-wide fence against any file outside ui/Card carrying the surface's
// contiguous geometry string.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the white card beside the prose,
// its middle on the band's (D37), never stretched to its height — is asserted
// one tier up, in DoctorProfile.stories.tsx's play functions.

// ── FIXTURES. A doctor-like week: mornings on Monday, Wednesday and Friday,
// afternoons on Tuesday and Thursday, the weekend closed — so both tones below
// have rows to prove, in their calendar places.
const CLOSED_LABEL = 'Închis';

const DOCTOR_ROWS: readonly HoursRow[] = formatHoursRows(
  [
    {
      days: ['Monday', 'Wednesday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
    { days: ['Tuesday', 'Thursday'], opens: '12:00', closes: '20:00' },
  ],
  'ro',
  CLOSED_LABEL,
);

// The page's own Romanian draft of `team.doctor.schedule.title` (D26) — the
// card's ONLY heading row since D37 struck the „Program" eyebrow above it.
const TITLE = 'Când mă găsiți la clinică';

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * ui/Card's whole `framed` class row, READ OFF THE ATOM: rendered with the
 * same tone this card asks for, and unmounted immediately — nothing of it
 * survives the call. Round 2e's "the one with the non current review, the one
 * with border" is exactly this row (D14 as amended).
 */
const framedRow = (): string => {
  const { container, unmount } = render(<Card tone="framed">x</Card>);
  const row = (container.firstElementChild as HTMLElement).className;
  unmount();
  return row;
};

/**
 * sections/SectionHeading at level 2, READ OFF THE COMPOSITION: the opener's
 * wrapper classes and the heading's, from a standalone render with the card's
 * own props — the title alone, centred, NO eyebrow (D37), so there is no
 * eyebrow row to read.
 */
const openerRows = (): {
  wrapper: string;
  heading: string;
} => {
  const { container, unmount } = render(
    <SectionHeading level={2} title={TITLE} align="center" />,
  );
  const wrapper = container.firstElementChild as HTMLElement;
  const rows = {
    wrapper: wrapper.className,
    heading: (wrapper.querySelector('h2') as HTMLElement).className,
  };
  unmount();
  return rows;
};

/**
 * ui/Text's whole class row for a tone, READ OFF THE ATOM rather than retyped:
 * the Footer's recipe computes the tone per row and lets the atom emit its own
 * ink (Text D4), so what this suite must prove is that a closed row and an open
 * row reach DIFFERENT atom rows — not that a particular token spells the quiet
 * ink. Rendered and unmounted immediately; nothing of it survives the call.
 */
const textRow = (tone: 'default' | 'muted'): string => {
  const { container, unmount } = render(<Text tone={tone}>x</Text>);
  const row = (container.firstElementChild as HTMLElement).className;
  unmount();
  return row;
};

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism from PersonnelCard.test.tsx,
 * where its reasoning is written out in full). Without it those guards police
 * the file's own documentation: this component is deliberately comment-heavy
 * and its header discusses `'use client'` and `t()` by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The <section> — the card itself; everything else is found through a role. */
const cardOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

/** The two placement props the helper below varies. A hyphenated attribute
 *  (`data-slot`) is exempt from excess-property checking in JSX but not in a
 *  typed object literal (TS2353), so the spread test writes its own JSX. */
type Placement = { className?: string; ref?: Ref<HTMLElement> };

const renderCard = (placement: Placement = {}) =>
  render(<ScheduleCard title={TITLE} rows={DOCTOR_ROWS} {...placement} />);

/** The seven <div> pairs inside the <dl>, in document order. */
const pairsOf = (container: HTMLElement): HTMLElement[] => {
  const list = container.querySelector('dl') as HTMLElement;
  return [...list.children] as HTMLElement[];
};

describe('ScheduleCard — a named region beside the prose (D14)', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> only becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" as well would be redundant ARIA (§9 semantic-HTML-first).
    // The name is the TITLE ALONE — an exact-match query, so an id that had
    // drifted onto the opener's wrapper (eyebrow + title read together) fails.
    const { container } = renderCard();

    const card = screen.getByRole('region', { name: TITLE });
    expect(card.tagName).toBe('SECTION');
    expect(card).toBe(cardOf(container));
    expect(card).not.toHaveAttribute('role');
  });

  it('puts the id on the <h2>, never on the section or the opener', () => {
    const { container } = renderCard();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    const id = heading.getAttribute('id') as string;
    expect(id).toBeTruthy();
    expect(document.getElementById(id)).toBe(heading);
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', id);
    expect(cardOf(container)).not.toHaveAttribute('id');
    // The opener's wrapper carries no id either (SectionHeading's own rule).
    expect(heading.parentElement).not.toHaveAttribute('id');
  });

  it('gives two cards on one page two different ids (useId)', () => {
    render(
      <>
        <ScheduleCard title={TITLE} rows={DOCTOR_ROWS} />
        <ScheduleCard title="Programul cabinetului" rows={DOCTOR_ROWS} />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Programul cabinetului' }),
    ).toBeInTheDocument();
  });

  it('lets a caller id land on the section without touching the name pair', () => {
    // A page may anchor the schedule (#program); that id is the SECTION's, and
    // the heading keeps its own generated one so aria-labelledby still points
    // at the title (the PersonnelCard precedent).
    const { container } = render(
      <ScheduleCard title={TITLE} rows={DOCTOR_ROWS} id="program" />,
    );

    const card = cardOf(container);
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(card.id).toBe('program');
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).not.toBe('program');
  });

  it('opens with sections/SectionHeading at level 2 — the title ALONE (D37)', () => {
    // An <h2>, the SIBLING of the „Despre" h2 beside it (D14): the page reads
    // h1 → h2 → h2, one level, no gaps (§9). The opener is SectionHeading
    // unmodified — its wrapper and its heading carry exactly the classes a
    // standalone render with the same props gives them.
    const { container } = renderCard();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading.tagName).toBe('H2');
    expect(screen.queryAllByRole('heading')).toHaveLength(1);

    const opener = cardOf(container).firstElementChild as HTMLElement;
    const expected = openerRows();
    expect(opener).toBe(heading.parentElement);
    expect(opener.className).toBe(expected.wrapper);
    expect(heading.className).toBe(expected.heading);
    // ă ș ț survive the whole chain — read by TEXT, because a role query
    // would still match a mangled title.
    expect(heading.textContent).toBe('Când mă găsiți la clinică');
  });

  it('prints NO eyebrow — not an empty row, no row at all (D37)', () => {
    // The owner's round-2g "remove the Program line from the program
    // section": the kicker above the title is gone, and SectionHeading's
    // contract for an omitted eyebrow is NO row — never an empty <p>, which
    // would be a stray stop for a screen reader and a phantom child for the
    // opener's flex gap. So the <h2> is its wrapper's ONE child, and the card
    // holds no <p> at all (the week's rows are <dt>/<dd>, never <p>).
    const { container } = renderCard();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    const opener = heading.parentElement as HTMLElement;
    expect(opener.children).toHaveLength(1);
    expect(opener.firstElementChild).toBe(heading);
    expect(heading.previousElementSibling).toBeNull();
    expect(cardOf(container).querySelectorAll('p')).toHaveLength(0);
    // The card's own text is the title, then the week — nothing in front of
    // the title, where the eyebrow used to print.
    expect(cardOf(container).textContent).toBe(
      TITLE + DOCTOR_ROWS.map((row) => `${row.label}${row.value}`).join(''),
    );
    // Never vacuous: the opener DOES print an eyebrow when handed one, so the
    // silence above is this card's choice, not a SectionHeading that lost
    // its row.
    const withEyebrow = render(
      <SectionHeading level={2} eyebrow="Program" title={TITLE} />,
    );
    expect(withEyebrow.container.querySelectorAll('p')).toHaveLength(1);
    withEyebrow.unmount();
  });
});

describe('ScheduleCard — ui/Card wears the framed white card (D14, round 2e)', () => {
  it('dresses the section in the atom’s own `framed` row, byte for byte', () => {
    // The owner's round-2e "the one with the non current review, the one with
    // border": the reviews deck's idle card — the 3px `--card-tint` frame on
    // the white ground, the same face the opener's credo card wears. No new
    // tone, and no background utility written here (§6.8).
    const { container } = renderCard();

    expect(cardOf(container).className).toBe(framedRow());
  });

  it('is the FRAMED white card, not the lavender one — the tint is the frame, never the ground', () => {
    // The never-vacuous half of the pin above: the row derived from the atom
    // must itself be the framed white one, or "byte for byte" would hold for
    // any tone the atom happened to render by default.
    const tokens = framedRow().split(/\s+/).filter(Boolean);
    expect(tokens).toContain('bg-surface');
    expect(tokens).toContain('border-[3px]');
    expect(
      tokens.filter((token) => token.includes('bg-(--card-tint)')),
    ).toEqual([]);
  });

  it('merges the caller className LAST, keeping the atom’s classes first', () => {
    // Order is the contract, not an accident: ui/slot.ts merges atom classes,
    // then Card's className, then the child element's — a deterministic
    // convention, NOT a cascade mechanism, and §6.8 limits caller utilities to
    // placement. The band hands over exactly that: D53's one width (20rem,
    // centred when stacked) and D37's vertical centring in the band's ONE row
    // (one row since the G2-R2 review's a11y F2 — no row or column named).
    const placement = 'w-full max-w-80 mx-auto @3xl:self-center';
    const { container } = renderCard({ className: placement });

    expect(cardOf(container).className).toBe(`${framedRow()} ${placement}`);
  });

  it('owns no outer margin and no width of its own (§6.4)', () => {
    // A grid track, an alignment or a width (the band's D53) is the band's
    // business; ui/Card's D3 says the same one tier down.
    const { container } = renderCard();

    const tokens = tokensOf(cardOf(container));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^w-/.test(t))).toEqual([]);
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const card = createRef<HTMLElement>();
    renderCard({ ref: card });

    expect(card.current).toBeInstanceOf(HTMLElement);
    expect(card.current?.tagName).toBe('SECTION');
    expect(card.current).toContainElement(
      screen.getByRole('heading', { level: 2, name: TITLE }),
    );
  });

  it('spreads remaining native props onto the section', () => {
    const { container } = render(
      <ScheduleCard
        title="Wann Sie mich in der Praxis finden"
        rows={DOCTOR_ROWS}
        lang="de"
        data-slot="schedule-card"
      />,
    );

    const card = cardOf(container);
    expect(card).toHaveAttribute('lang', 'de');
    expect(card).toHaveAttribute('data-slot', 'schedule-card');
  });
});

describe('ScheduleCard — the week as a <dl> (the Footer’s recipe)', () => {
  it('prints seven day/value pairs, Monday → Sunday, in calendar order', () => {
    // ONE ROW PER DAY is lib/hours' own contract (owner 2026-08-18): closed
    // days stay in place rather than being grouped away, which is why the
    // weekend is visible below instead of absent.
    const { container } = renderCard();

    const list = container.querySelector('dl') as HTMLElement;
    const terms = [...list.querySelectorAll('dt')].map((dt) => dt.textContent);
    const values = [...list.querySelectorAll('dd')].map((dd) => dd.textContent);

    expect(terms).toHaveLength(7);
    expect(values).toHaveLength(7);
    expect(terms).toEqual(DOCTOR_ROWS.map((row) => row.label));
    expect(values).toEqual(DOCTOR_ROWS.map((row) => row.value));
    // The doctor's own week, spelled out so a formatter change is visible
    // here: two rhythms and a closed weekend, with the diacritics intact.
    expect(terms[0]).toBe('Luni');
    expect(values[0]).toBe('09:00 – 17:00');
    expect(terms[1]).toBe('Marți');
    expect(values[1]).toBe('12:00 – 20:00');
    expect(terms[5]).toBe('Sâmbătă');
    expect(values[5]).toBe(CLOSED_LABEL);
    expect(terms[6]).toBe('Duminică');
    expect(values[6]).toBe(CLOSED_LABEL);
  });

  it('pairs each term with its value inside a <div> that is `contents` of the centred grid', () => {
    // The <div> wrappers are HTML5's own way to pair one term with one value;
    // `display: contents` keeps that pairing in the DOM while the two-column
    // grid on the <dl> places the <dt> and <dd> itself (round 2c — the header's
    // THE WEEK IS CENTRED paragraph).
    const { container } = renderCard();

    const pairs = pairsOf(container);
    expect(pairs).toHaveLength(7);
    for (const [index, pair] of pairs.entries()) {
      expect(pair.tagName).toBe('DIV');
      expect(pair.className).toBe('contents');
      expect(pair.children).toHaveLength(2);
      expect(pair.children[0].tagName).toBe('DT');
      expect(pair.children[1].tagName).toBe('DD');
      expect(pair.children[0].textContent).toBe(DOCTOR_ROWS[index].label);
      expect(pair.children[1].textContent).toBe(DOCTOR_ROWS[index].value);
    }
    // The list is a two-column grid CENTRED as one block (`justify-center`),
    // `gap-x-10` between the columns (round 2e, "a bit broader"); the round-2c
    // rule under the heading is gone ("remove thin line"). No width cap: a
    // content-sized block keeps day and hours in one magnifier window by
    // construction (the header's last sentence on G2 a11y F4).
    expect((container.querySelector('dl') as HTMLElement).className).toBe(
      'grid grid-cols-[auto_auto] items-baseline justify-center gap-x-10 gap-y-1',
    );
    // …and the list follows the opener: heading first, the week after it.
    const dl = container.querySelector('dl') as HTMLElement;
    expect(dl.previousElementSibling).toBe(
      screen.getByRole('heading', { level: 2 }).parentElement,
    );
  });

  it('recedes closed rows by TOKEN — both halves of the pair, never opacity', () => {
    // The Footer's reasoning, verbatim: --ink-muted is a measured token, while
    // an opacity multiplier lands wherever the stack happens to put it (§9).
    // Both elements wear it because ui/Text emits its ink explicitly (D4), so
    // a wrapper tone would be inherited by nothing.
    const { container } = renderCard();

    const open = textRow('default');
    const muted = textRow('muted');
    expect(open).not.toBe(muted);

    for (const [index, pair] of pairsOf(container).entries()) {
      const row = DOCTOR_ROWS[index];
      const expected = row.closed ? muted : open;
      expect(pair.children[0].className).toBe(expected);
      expect(pair.children[1].className).toBe(
        `${expected} text-end tabular-nums`,
      );
    }
    // The fixture must actually contain both cases, or the loop above proves
    // half a contract (the never-vacuous guard).
    expect(DOCTOR_ROWS.some((row) => row.closed)).toBe(true);
    expect(DOCTOR_ROWS.some((row) => !row.closed)).toBe(true);
  });

  it('renders no opacity utility anywhere', () => {
    const { container } = renderCard();

    for (const element of [
      cardOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^opacity-/);
      }
    }
  });

  it('renders an empty schedule as an empty list, never as silence', () => {
    // A list with no rows is a degenerate input the band's types allow; it
    // must still be a titled region with an empty <dl>, not a crash and not a
    // card that pretends to say something.
    const { container } = render(<ScheduleCard title={TITLE} rows={[]} />);

    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(0);
    expect(pairsOf(container)).toHaveLength(0);
  });
});

describe('ScheduleCard — container steps only, zero islands (§6.5, §16)', () => {
  it('carries no media queries anywhere — those are the page’s (§6.5)', () => {
    const { container } = renderCard();

    for (const element of [
      cardOf(container),
      ...container.querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });

  it('ships NO client directive — the card is inert HTML (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports the two atoms and the opener it composes plus react, and lib/hours as a TYPE', () => {
    // The import surface is the guard that sees what a regex cannot. lib/hours
    // is the one lib specifier here and it must arrive `import type`: a VALUE
    // import would pull a formatter into a DUMB card (run D1 — rows arrive
    // finished, this file never formats one), and a type import erases to
    // nothing at build time. ui/Heading left the list with the move: the
    // heading is SectionHeading's now (D14).
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/ui/Card/Card',
      '@/components/ui/Text/Text',
      '@/lib/hours/hours',
      'react',
    ]);
    expect(CODE).toMatch(
      /^import type \{[^}]*\bHoursRow\b[^}]*\} from '@\/lib\/hours\/hours';$/m,
    );
    // No lib DATA at all: a DUMB card knows no clinic, no price list and no
    // team (run D1). lib/hours is MECHANICS, which is why it is the exception.
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`)
    // forms add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive and no message key path (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way.
    const { container } = renderCard();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
    expect(within(cardOf(container)).getByText(TITLE)).toBeInTheDocument();
  });
});

describe('ScheduleCard — type-level pins', () => {
  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<ScheduleCardProps>().toHaveProperty('title');
    expectTypeOf<ScheduleCardProps>().toHaveProperty('rows');
    expectTypeOf<ScheduleCardProps>().toHaveProperty('className');
    expectTypeOf<ScheduleCardProps>().toHaveProperty('id');
    expectTypeOf<ScheduleCardProps['rows']>().toEqualTypeOf<
      readonly HoursRow[]
    >();
  });

  it('refuses the names and the slot the Omits exist to refuse', () => {
    // The card's name is its heading's text ALONE: a caller's
    // `aria-labelledby` would land after the component's own and silently
    // replace the pair, while an `aria-label` would silently win over it —
    // better refused by the types than resolved by attribute order.
    expectTypeOf<ScheduleCardProps>().not.toHaveProperty('aria-label');
    expectTypeOf<ScheduleCardProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<ScheduleCardProps>().not.toHaveProperty('children');
    // D37: the eyebrow prop is GONE, not optional — a prop nobody passes is
    // dead public API (the header's NO EYEBROW paragraph).
    expectTypeOf<ScheduleCardProps>().not.toHaveProperty('eyebrow');

    const SCHEDULE: {
      title: string;
      rows: readonly HoursRow[];
    } = {
      title: TITLE,
      rows: DOCTOR_ROWS,
    };

    // @ts-expect-error — content arrives as props; nested children would vanish
    const nested: ScheduleCardProps = { ...SCHEDULE, children: 'x' };
    // @ts-expect-error — the region's name is its heading's alone
    const renamed: ScheduleCardProps = { ...SCHEDULE, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's
    const repaired: ScheduleCardProps = { ...SCHEDULE, 'aria-labelledby': 'x' };
    // @ts-expect-error — `title` here is the heading's text, not the native tooltip
    const tooltipped: ScheduleCardProps = { ...SCHEDULE, title: 42 };
    // @ts-expect-error — rows are lib/hours rows, not strings (§8.1: finished text)
    const flatRows: ScheduleCardProps = { ...SCHEDULE, rows: ['Luni'] };
    // @ts-expect-error — the eyebrow is struck (D37); no prop takes it
    const eyebrowed: ScheduleCardProps = { ...SCHEDULE, eyebrow: 'Program' };
    // @ts-expect-error — the title names the region; it stays required
    const untitled: ScheduleCardProps = { rows: DOCTOR_ROWS };

    expect([
      nested,
      renamed,
      repaired,
      tooltipped,
      flatRows,
      eyebrowed,
      untitled,
    ]).toHaveLength(7);
  });
});
