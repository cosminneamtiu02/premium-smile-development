import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  SectionHeading,
  type SectionHeadingAlign,
  type SectionHeadingLevel,
  type SectionHeadingProps,
} from './SectionHeading';
import source from './SectionHeading.tsx?raw';

// sections/SectionHeading — the interaction suite. Role-based queries wherever
// a role exists (§9, §13): a passing test doubles as proof of accessible
// markup, and here that is the whole point of the component — the title is
// reachable as a `heading` at a stated LEVEL because it really is an <h2>/<h3>,
// not because something wears a size.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the Wordmark precedent). next-intl's hooks
// throw without one, so a green render proves what the contract states: this
// section calls no t() and uses zero message keys. Every string below is a
// FIXTURE the caller would have translated, Romanian with diacritics (§15.7) —
// RO_ALL carries all seven Romanian marks, so a broken encoding path fails here
// rather than in front of a patient.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — the 8px gap that replaces the
// dropped Stack, and the wrap behaviour at 320 — is asserted one tier up, in
// SectionHeading.stories.tsx.

const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';

// The real pair the old site opens its clinic-location section with, and the
// card shape (an eyebrow over a person's name at level 3).
const RO_EYEBROW = 'Ne găsești';
const RO_TITLE = 'Vizitează clinica noastră';
const RO_CARD_EYEBROW = 'Părerea ta contează';
const RO_CARD_TITLE = 'Dr. Elena Marin';

// The two atom recipes and the two root strings, in canonical order and
// written OUT rather than imported: the test must fail on a silent edit to
// either component's constant, which an import would follow.
const SECTION_STEP = 'font-display text-3xl text-ink-strong';
const EYEBROW_RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';
const ROOT_START = 'flex flex-col gap-2 items-start text-start';
const ROOT_CENTER = 'flex flex-col gap-2 items-center text-center';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * Wordmark.test.tsx, where its reasoning is written out in full).
 *
 * Without it those guards police the file's own documentation: this component
 * is deliberately comment-heavy and its header discusses `'use client'`, `t()`
 * and the hooks it does NOT have by name. Known limit, same as there: it strips
 * block comments and whole-line `//` comments, not a `//` trailing real code —
 * a shape this file does not contain, and one that is visible in review.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The root <div> — everything else is found through a role. */
const rootOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

describe('SectionHeading — a REAL heading, at the level the caller asked for', () => {
  it('renders an <h2> carrying the title by default', () => {
    render(<SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />);

    const heading = screen.getByRole('heading', { level: 2, name: RO_TITLE });
    expect(heading.tagName).toBe('H2');
  });

  it('keeps the title intact, Ș ș Ț ț ă â î and all', () => {
    // Queried by its own text: a role query would still match if any layer
    // normalised or mangled the diacritics.
    render(<SectionHeading title={RO_ALL} />);

    expect(screen.getByText(RO_ALL).tagName).toBe('H2');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(RO_ALL);
  });

  it('renders an <h3> at level 3 — and no <h2> anywhere', () => {
    // The card shape (doctor-card, helping-staff-card): a heading nested under
    // a section that already opened with an <h2>. The size does not move with
    // it — that is what `visualLevel` used to be for (v1 retired it).
    render(
      <SectionHeading
        eyebrow={RO_CARD_EYEBROW}
        title={RO_CARD_TITLE}
        level={3}
      />,
    );

    const heading = screen.getByRole('heading', {
      level: 3,
      name: RO_CARD_TITLE,
    });
    expect(heading.tagName).toBe('H3');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });
});

describe('SectionHeading — the section step, byte-exactly', () => {
  it('dresses the h2 in ui/Heading’s `section` row and nothing else', () => {
    // The string ui/Heading's D2 table holds. Byte exactness is the contract:
    // an extra utility here is a defect, not polish — it would also mean the
    // section had started restyling an atom's internals (§6.8).
    render(<SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />);

    expect(screen.getByRole('heading', { level: 2 }).className).toBe(
      SECTION_STEP,
    );
  });

  it('dresses an h3 in the SAME row — element and look are independent', () => {
    render(<SectionHeading title={RO_CARD_TITLE} level={3} />);

    expect(screen.getByRole('heading', { level: 3 }).className).toBe(
      SECTION_STEP,
    );
  });
});

describe('SectionHeading — the id is the aria-labelledby half', () => {
  it('lands on the HEADING element, never on the root', () => {
    // An id on the wrapper would name the consuming <section> with the eyebrow
    // and the title read together; on the heading it names it with the title.
    const { container } = render(
      <SectionHeading id="locatie" eyebrow={RO_EYEBROW} title={RO_TITLE} />,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'locatie');
    expect(document.getElementById('locatie')).toBe(heading);
    expect(rootOf(container)).not.toHaveAttribute('id');
  });

  it('ships no empty id attribute when nobody asked for one', () => {
    const { container } = render(<SectionHeading title={RO_TITLE} />);

    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute('id');
    expect(rootOf(container)).not.toHaveAttribute('id');
  });
});

describe('SectionHeading — the eyebrow row is optional', () => {
  it('renders it above the title, wearing ui/Eyebrow’s recipe', () => {
    const { container } = render(
      <SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />,
    );

    const eyebrow = screen.getByText(RO_EYEBROW);
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow.className).toBe(EYEBROW_RECIPE);
    // font-mono is the one utility that must never go missing: ui/Eyebrow is
    // the only consumer of the §3 mono token, and this is the site that uses it.
    expect(tokensOf(eyebrow)).toContain('font-mono');
    // Uppercase is CSS, so the DOM keeps the authored sentence case — a
    // toUpperCase() anywhere in the chain would fail the query above.
    expect(eyebrow.textContent).toBe(RO_EYEBROW);
    // Order matters to a screen reader as much as to the eye: kicker first.
    const root = rootOf(container);
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toBe(eyebrow);
    expect(root.children[1]).toBe(screen.getByRole('heading', { level: 2 }));
  });

  it('renders NO row at all when the prop is omitted', () => {
    // Not an empty <p>: a blank paragraph is a stray stop for a screen reader
    // and a phantom child for the flex gap.
    const { container } = render(<SectionHeading title={RO_TITLE} />);

    expect(screen.queryByText(RO_EYEBROW)).toBeNull();
    expect(screen.queryByRole('paragraph')).toBeNull();
    expect(container.querySelectorAll('p')).toHaveLength(0);
    const root = rootOf(container);
    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toBe(screen.getByRole('heading', { level: 2 }));
  });
});

describe('SectionHeading — align, and §6.8 native-element fidelity', () => {
  it('is start-aligned by default, byte-exactly', () => {
    const { container } = render(<SectionHeading title={RO_TITLE} />);

    expect(rootOf(container).className).toBe(ROOT_START);
  });

  it('switches the whole block to centre on align="center"', () => {
    const { container } = render(
      <SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} align="center" />,
    );

    expect(rootOf(container).className).toBe(ROOT_CENTER);
  });

  it('merges the caller className LAST, keeping its own classes first', () => {
    // Order is the contract, not an accident: a deterministic convention this
    // assertion pins — NOT a cascade mechanism (attribute order never decides
    // CSS specificity), and §6.8 limits caller utilities to positioning and
    // spacing, which is what every old call site passed (`mb-12 sm:mb-16`).
    const { container } = render(
      <SectionHeading title={RO_TITLE} className="col-span-2" />,
    );

    expect(rootOf(container).className).toBe(`${ROOT_START} col-span-2`);
  });

  it('owns no outer margin and no width of its own (§6.4)', () => {
    const { container } = render(
      <SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />,
    );

    const tokens = tokensOf(rootOf(container));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^w-/.test(t))).toEqual([]);
  });

  it('carries no responsive self-scaling — media queries are the page’s (§6.5)', () => {
    // The old component shipped `md:items-start` from `mdAlign`; v1 cut the
    // axis, and this is the guard that keeps it cut.
    const { container } = render(
      <SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} align="center" />,
    );

    for (const element of [
      rootOf(container),
      ...rootOf(container).querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });

  it('accepts ref as a regular prop (React 19) — it is the root <div>', () => {
    const root = createRef<HTMLDivElement>();
    render(<SectionHeading ref={root} title={RO_TITLE} />);

    expect(root.current).toBeInstanceOf(HTMLDivElement);
    expect(root.current).toContainElement(
      screen.getByRole('heading', { level: 2 }),
    );
  });

  it('spreads remaining native props onto the root, not onto the heading', () => {
    // `lang` is the shape the German stress story uses: CSS `hyphens: auto`
    // picks its dictionary from the ELEMENT's language and inheritance carries
    // it to both children, so one attribute on the root hyphenates the title.
    const { container } = render(
      <SectionHeading
        lang="de"
        data-slot="section-heading"
        title="Behandlungsschwerpunkte"
      />,
    );

    const root = rootOf(container);
    expect(root).toHaveAttribute('lang', 'de');
    expect(root).toHaveAttribute('data-slot', 'section-heading');
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute(
      'lang',
    );
  });
});

describe('SectionHeading — zero islands, two imports', () => {
  it('ships NO client directive — it is inert HTML on every page (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    // …and the reasons it can stay that way: no hook, no handler, no t().
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
  });

  it('imports EXACTLY the two atoms it composes plus lib/cx', () => {
    // The import surface is the guard that sees what a regex cannot: swapping
    // an atom for something with state (ui/Image wraps a client component)
    // would hydrate every page that opens with this block, without tripping a
    // single directive check. Adding an import here has to be a deliberate
    // edit to this test, with that question asked out loud.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Eyebrow/Eyebrow',
      '@/components/ui/Heading/Heading',
      '@/lib/cx',
      'react',
    ]);
    // lib/cx joined the list when the cx-to-lib lane (org-review F2,
    // 2026-09-02) moved the class-join helper to the foundation ring; the old
    // "never ui/cx" clause died with the fence.
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive: no button, no link, no JavaScript', () => {
    render(<SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('never renders a message key path — both strings are props (§8.1)', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and these are the assertions that keep it that way.
    const { container } = render(
      <SectionHeading eyebrow={RO_EYEBROW} title={RO_TITLE} />,
    );

    expect(container.textContent).toBe(`${RO_EYEBROW}${RO_TITLE}`);
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});

describe('SectionHeading — type-level pins (G2, both reviewers 2026-09-01)', () => {
  it('pins the deliberate type decisions so a refactor cannot quietly widen them', () => {
    // The ELEMENT/ALIGN Records already gate WIDENING at the source — these
    // pins close the other direction: a refactor that rebuilds the props type
    // (say, back onto a plain ComponentPropsWithRef<'div'> intersection)
    // would compile and keep all render tests green while silently reopening
    // the swallowed-children hole fb-314 closed. Erased to no-ops at runtime;
    // they fail at tsc --noEmit time, naming the property.
    expectTypeOf<SectionHeadingLevel>().toEqualTypeOf<2 | 3>();
    expectTypeOf<SectionHeadingAlign>().toEqualTypeOf<'start' | 'center'>();
    expectTypeOf<SectionHeadingProps>().not.toHaveProperty('children');
  });
});
