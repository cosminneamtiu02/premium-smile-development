import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  ServiceCard,
  type ServiceCardLevel,
  type ServiceCardProps,
} from './ServiceCard';
import source from './ServiceCard.tsx?raw';

// sections/ServiceCard — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): a passing test doubles as proof of accessible markup,
// and here that is half the component's job — the service's name is reachable
// as a `heading` at level 3 because it really is an <h3>, not because something
// wears a size.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the Wordmark/SectionHeading precedent).
// next-intl's hooks throw without one, so a green render proves what the
// contract states: this section calls no t() and owns no message key. Every
// string below is a FIXTURE the consumer would have translated, Romanian with
// diacritics (§15.7) — RO_ALL carries all seven Romanian marks, so a broken
// encoding path fails here rather than in front of a patient.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. And in this file they carry extra weight — the class
// strings below are the ZERO-DIFF PIN for the S3 rewire: they are byte-exactly
// what sections/ServicesTeaser's inline <li> card carried before the shape was
// extracted here (the #64 promotion-rewires-consumers precedent). An extra
// utility on either side moves pixels on a shipped page.

const RO_NAME = 'Igienizare profesională';
const RO_DESCRIPTION = 'Detartraj, periaj profesional și fluorizare.';
const RO_PRICE = 'de la 250 RON';
const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';

// Written OUT rather than imported from the components: the test must fail on a
// silent edit to any of these recipes, which an import would follow.
const CARD_BASE =
  'flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-6';
const TITLE_STEP = 'font-display text-xl text-ink-strong';
const DESCRIPTION_RECIPE = 'text-base text-ink-muted flex-1';
const PRICE_RECIPE = 'text-base text-ink font-bold';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * SectionHeading.test.tsx, where its reasoning is written out in full).
 * Known limit, same as there: it strips block comments and whole-line `//`
 * comments, not a `//` trailing real code — a shape this file does not contain.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/** The root <article> — everything else is found through a role. */
const rootOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

describe('ServiceCard — one service, as the accessibility tree sees it', () => {
  it('names the card with a REAL <h3> by default', () => {
    render(<ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />);

    const heading = screen.getByRole('heading', { level: 3, name: RO_NAME });
    expect(heading.tagName).toBe('H3');
    // The default is Home's shape: the teaser opens with an h2, so its cards
    // are h3s. Nothing changes there when the Services page passes level={2}.
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('renders an <h2> at level 2 — and no <h3> anywhere', () => {
    // The Services page's shape: ONE band, ONE h1, and the cards directly
    // under it, so an h3 would skip a rung (§9's logical heading order; axe's
    // heading-order rule fails the page story on exactly that).
    render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} level={2} />,
    );

    const heading = screen.getByRole('heading', { level: 2, name: RO_NAME });
    expect(heading.tagName).toBe('H2');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('dresses both rungs identically — element and look are independent', () => {
    // What makes the axis cost ZERO pixels: `asChild` hands ui/Heading a real
    // element, and the atom's `title` step lands on whichever one it is. This
    // is also why the Services page and the Home teaser photograph the same
    // card at two outline depths.
    const { unmount } = render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />,
    );
    const asH3 = screen.getByRole('heading', { level: 3 }).className;
    unmount();

    render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} level={2} />,
    );
    expect(screen.getByRole('heading', { level: 2 }).className).toBe(asH3);
  });

  it('is an <article>: a self-contained card, not a list item', () => {
    // The LIST semantics stay with the consumer's <ul>/<li>; nothing here
    // assumes it is inside one, which is what lets both consumers wrap it.
    const { container } = render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />,
    );

    expect(rootOf(container).tagName).toBe('ARTICLE');
    expect(screen.getByRole('article')).toBe(rootOf(container));
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('renders the description as its own paragraph', () => {
    render(<ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />);

    expect(screen.getByText(RO_DESCRIPTION).tagName).toBe('P');
  });

  it('keeps every string intact, Ș ș Ț ț ă â î and all', () => {
    // Queried by their own text: a role query would still match if any layer
    // normalised or mangled the diacritics.
    render(
      <ServiceCard
        name={RO_ALL}
        description={RO_ALL}
        priceLabel={`${RO_ALL} 250 RON`}
      />,
    );

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(RO_ALL);
    expect(screen.getAllByText(RO_ALL, { exact: false })).toHaveLength(3);
  });
});

describe('ServiceCard — the price row is present or ABSENT, never fake', () => {
  it('prints the finished price line last, in bold', () => {
    const { container } = render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel={RO_PRICE}
      />,
    );

    const price = screen.getByText(RO_PRICE);
    expect(price.tagName).toBe('P');
    expect(price.className).toBe(PRICE_RECIPE);
    // Order matters to a screen reader as much as to the eye: name, what it
    // covers, then what it costs.
    const root = rootOf(container);
    expect(root.children).toHaveLength(3);
    expect(root.children[2]).toBe(price);
  });

  it('renders NO row at all when there is no confirmed price', () => {
    // Not a dash, not "on request", and not an empty <p> — a blank paragraph is
    // a stray stop for a screen reader and a phantom child for the flex gap.
    const { container } = render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />,
    );

    const root = rootOf(container);
    expect(root.children).toHaveLength(2);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(root.textContent).toBe(`${RO_NAME}${RO_DESCRIPTION}`);
  });

  it('takes the price as ONE finished string — it assembles nothing', () => {
    // §8.2/§8.3: the consumer runs Intl.NumberFormat and the ICU sentence; this
    // component never sees an amount, a currency or a locale.
    render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel="RON 250"
      />,
    );

    expect(screen.getByText('RON 250')).toBeInTheDocument();
  });
});

describe('ServiceCard — the ZERO-DIFF class pins (S3 rewire)', () => {
  it('wears the teaser’s former <li> string byte-exactly', () => {
    const { container } = render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />,
    );

    expect(rootOf(container).className).toBe(CARD_BASE);
  });

  it('dresses the name in ui/Heading’s `title` row and nothing else', () => {
    // The string ui/Heading's ZERO-DIFF-REWIRE INVARIANT holds. Byte exactness
    // is the contract: an extra utility here would mean this section had
    // started restyling an atom's internals (§6.8).
    render(<ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />);

    expect(screen.getByRole('heading', { level: 3 }).className).toBe(
      TITLE_STEP,
    );
  });

  it('keeps flex-1 on the description — the one-baseline mechanism', () => {
    // What makes three unevenly-filled cards end their price rows on one line
    // (§8.4's min-height rule, applied to a card). The tone token rides the
    // atom's own axis; flex-1 is this component's layout opinion.
    render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel={RO_PRICE}
      />,
    );

    expect(screen.getByText(RO_DESCRIPTION).className).toBe(DESCRIPTION_RECIPE);
  });

  it('merges the caller className LAST, keeping its own classes first', () => {
    // `h-full` is what both consumers pass: the grid stretches the <li>, and
    // this hands that height to the card. Order is the contract, not an
    // accident — a deterministic convention this assertion pins, NOT a cascade
    // mechanism (attribute order never decides CSS specificity), and §6.8
    // limits caller utilities to positioning and spacing.
    const { container } = render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        className="h-full"
      />,
    );

    expect(rootOf(container).className).toBe(`${CARD_BASE} h-full`);
  });

  it('owns no outer margin and no height of its own (§6.4)', () => {
    const { container } = render(
      <ServiceCard name={RO_NAME} description={RO_DESCRIPTION} />,
    );

    const tokens = tokensOf(rootOf(container));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    // Height is the consumer's call — the card fills a grid row only because a
    // parent asked it to.
    expect(tokens.filter((t) => /^h-/.test(t))).toEqual([]);
  });

  it('carries no responsive self-scaling — the GRID is the consumer’s (§6.5)', () => {
    const { container } = render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel={RO_PRICE}
      />,
    );

    for (const element of [
      rootOf(container),
      ...rootOf(container).querySelectorAll('*'),
    ]) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(max-)?(sm|md|lg|xl|2xl):/);
        expect(token).not.toMatch(/^@/);
        expect(token).not.toMatch(/(min|max)-\[/);
      }
    }
  });
});

describe('ServiceCard — §6.8 native-element fidelity', () => {
  it('accepts ref as a regular prop (React 19) — it is the root <article>', () => {
    const root = createRef<HTMLElement>();
    render(
      <ServiceCard ref={root} name={RO_NAME} description={RO_DESCRIPTION} />,
    );

    expect(root.current?.tagName).toBe('ARTICLE');
    expect(root.current).toContainElement(
      screen.getByRole('heading', { level: 3 }),
    );
  });

  it('spreads remaining native props onto the root, not onto the heading', () => {
    // `lang` is the shape the German stress story uses: CSS `hyphens: auto`
    // picks its dictionary from the ELEMENT's language and inheritance carries
    // it to every child, so one attribute on the root hyphenates the card.
    const { container } = render(
      <ServiceCard
        lang="de"
        data-slot="service-card"
        name="Professionelle Zahnreinigung"
        description="Zahnsteinentfernung, professionelle Politur und Fluoridierung."
      />,
    );

    const root = rootOf(container);
    expect(root).toHaveAttribute('lang', 'de');
    expect(root).toHaveAttribute('data-slot', 'service-card');
    expect(screen.getByRole('heading', { level: 3 })).not.toHaveAttribute(
      'lang',
    );
  });

  it('pins the type decisions so a refactor cannot quietly widen them', () => {
    // Erased to no-ops at runtime; they fail at tsc --noEmit time, naming the
    // property. Without the Omit a caller could nest something, type-check, and
    // watch it vanish (JSX children always beat spread ones) — the exact hole
    // SectionHeading closed one tier over. And the level union stays 2 | 3: an
    // <h1> belongs to the page, 4–6 has no consumer, and widening it has to go
    // through the ELEMENT Record (which then fails to compile until the new
    // level names its element).
    expectTypeOf<ServiceCardProps>().not.toHaveProperty('children');
    expectTypeOf<ServiceCardLevel>().toEqualTypeOf<2 | 3>();
  });
});

describe('ServiceCard — zero islands, props in (§8.1, §16)', () => {
  it('ships NO client directive — it is inert HTML on both pages', () => {
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
    // would hydrate every page that renders these cards without tripping a
    // single directive check.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/components/ui/Text/Text',
      '@/lib/cx',
      'react',
    ]);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders nothing interactive: no button, no link, no JavaScript', () => {
    render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel={RO_PRICE}
      />,
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('never renders a message key path — every string is a prop', () => {
    // next-intl prints the dotted key on a miss; there is no t() here at all,
    // and this is the assertion that keeps it that way.
    const { container } = render(
      <ServiceCard
        name={RO_NAME}
        description={RO_DESCRIPTION}
        priceLabel={RO_PRICE}
      />,
    );

    expect(container.textContent).toBe(
      `${RO_NAME}${RO_DESCRIPTION}${RO_PRICE}`,
    );
    expect(container.textContent).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });
});
