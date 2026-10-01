import { createRef, type ReactNode, type Ref } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Card } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import {
  CredoCard,
  type CredoCardProps,
  type DoctorIntroCredo,
} from './CredoCard';
import source from './CredoCard.tsx?raw';

// sections/DoctorIntro/CredoCard — the interaction suite. Role-based queries
// wherever a role exists (§9, §13): a passing test doubles as proof of
// accessible markup, and here that is most of the contract (round 2's D12) —
// the card is a named `region` because the id really sits on its <h2>, the
// doctor's words are a `blockquote` because they are his own, and the key
// words inside them are still <b> elements after the whole chain.
//
// ── NO NextIntlClientProvider, AND THE ABSENCE IS THE ASSERTION (the
// ScheduleCard / SectionHeading precedent). next-intl's hooks throw without
// one, so a green render proves run D1: this card owns no message key and
// calls no t(). Every string below is a FIXTURE the doctor page would have
// translated — Romanian with diacritics (§15.7), factual, no superlatives
// (CMSR) — and the body is built the way the page builds it: ui/Keyword's
// `Keywords` over a segment list (lib/team's `splitKeywords` output shape),
// so a keyword that failed to survive the card would fail here.
//
// ── Styles are NOT loaded in this project (tests/setup/components.ts imports
// no stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows. What needs real CSS — that the quote marks are really
// generated, that the quote really is justified, that the card really
// sits under the name in the same column — is asserted one tier up, in
// DoctorIntro.stories.tsx's play functions.
//
// ── EVERY ATOM ROW IS DERIVED, NEVER RE-SPELLED: the framed surface in its
// aura (D61), SectionHeading's title step and root, and ui/Eyebrow's recipe
// are each READ OFF a rendered instance of the thing itself. An edit to an
// atom's table then moves the expectation with it, while a card that stopped
// choosing `framed`, silently dropped `aura` — or stopped composing
// SectionHeading and re-spelled its look — still fails. The glow's utility
// name is therefore never written in this file either: the atom holds its one
// spelling (tests/unit/aura-token.test.ts's census), and the card's WEAR is
// proven by the derived row alone.
// It also keeps ui/Card's contiguous geometry signature out of this file,
// which tests/unit/card-single-spelling.test.ts fences across all of src/.
// The ONE string written out byte for byte is the quote's own dress, because
// it belongs to THIS file and to no atom.

// ── FIXTURES.
const EYEBROW = 'În cuvintele mele';
const TITLE = 'Filozofia mea';

/** Two segments — a key word, then plain text — so the fixture proves the
 *  fragments survive rather than a string that merely looks the same. */
const SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Ascultarea', keyword: true },
  { text: ' pacientului deschide fiecare consultație.', keyword: false },
];
const KEYWORD = 'Ascultarea';
const BODY_TEXT = 'Ascultarea pacientului deschide fiecare consultație.';

const CREDO: DoctorIntroCredo = {
  eyebrow: EYEBROW,
  title: TITLE,
  body: <Keywords segments={SEGMENTS} />,
};

/** The quote's dress, byte for byte — the section's OWN utilities (D12): the
 *  doctor card's ink one size up — `text-ink-faint`, the ink the two doctor
 *  quotes share since D58 (the owner's "what if you make the faint text
 *  lighter", 2026-09-26; it was PersonnelCard D8's `ink-muted`), and
 *  `text-xl`, the owner's "put a bigger card for filozofia mea" (2026-09-26,
 *  D43b; the doctor card keeps `text-lg`) — plus ReviewCard's generated
 *  marks, and `text-justify` — the owner's word of 2026-09-25, §15.1's third
 *  per-element exception (the doctor card's quote is the first). */
const QUOTE =
  'text-xl text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]';

const tokensOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

/** Render something, read the first element's class row, unmount. Nothing of
 *  the render survives the call. */
const classOf = (node: ReactNode): string => {
  const { container, unmount } = render(<>{node}</>);
  const row = (container.firstElementChild as HTMLElement).className;
  unmount();
  return row;
};

/** ui/Card's `framed` row WITH its `aura` — the reviews deck's idle card, the
 *  owner's "the non current one" (D12), in the Header pill's lavender glow
 *  (D61: "i need you also to add an aura around the filozofia mea card",
 *  2026-09-26). Both halves are the atom's own props, so both are read off
 *  the atom. */
const framedAuraCard = (): string =>
  classOf(
    <Card tone="framed" aura>
      x
    </Card>,
  );

/**
 * SectionHeading's OWN title step — read off the heading a bare SectionHeading
 * renders, never named here. The step is that component's decision and it
 * moves on its own schedule (D47 took it from ui/Heading's `section` row to
 * `page`, builder A1, 2026-09-26; D48 LANDED the same day and moved it on to
 * the container-responsive `band` row — 30px under a 28rem container, 36px
 * from it), so a card that composes SectionHeading must follow it without an
 * edit — while a card that stopped composing it, or dressed its own <h2>,
 * still fails. The nearest container of THIS card's title is ui/Card's own
 * `@container`, so „Filozofia mea" reads 36px wherever the card's content
 * box reaches 28rem — a card of ~498px — and 30px under that: since
 * DoctorIntro's D63 (a 36rem track beside the picture) that is 30px at 1024
 * and 1280 and 36px from 1366 up, and 36px stacked full-width on a tablet as
 * before (ui/Heading's `'band' JOINED` paragraph; owner decision 1 of G2
 * tier 1, fold-tier1.md). The never-vacuous guard in the test
 * pins that what is read back really IS one of ui/Heading's rows, not an
 * empty or foreign string.
 */
const sectionHeadingStep = (): string => {
  const { container, unmount } = render(<SectionHeading title="y" />);
  const row = (container.querySelector('h2') as HTMLElement).className;
  unmount();
  return row;
};

/**
 * The card's source with its PROSE removed, which is what the zero-island
 * guards at the bottom run against (mechanism copied verbatim from
 * ScheduleCard.test.tsx, where its reasoning is written out in full). Without
 * it those guards police the file's own documentation: this component is
 * deliberately comment-heavy and its header discusses `'use client'` and
 * `t()` by name.
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
  render(<CredoCard {...CREDO} {...placement} />);

describe('CredoCard — a named region under the name (D12)', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> only becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" as well would be redundant ARIA (§9 semantic-HTML-first).
    const { container } = renderCard();

    const card = screen.getByRole('region', { name: TITLE });
    expect(card.tagName).toBe('SECTION');
    expect(card).toBe(cardOf(container));
    expect(card).not.toHaveAttribute('role');
  });

  it('puts the id on the <h2>, never on the section', () => {
    // SectionHeading's own rule: the id lands on the element carrying the
    // heading's TEXT, so the region is named „Filozofia mea" and not the
    // eyebrow and the title read together.
    const { container } = renderCard();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    const id = heading.getAttribute('id') as string;
    expect(id).toBeTruthy();
    expect(document.getElementById(id)).toBe(heading);
    expect(cardOf(container)).toHaveAttribute('aria-labelledby', id);
    expect(cardOf(container)).not.toHaveAttribute('id');
  });

  it('gives two cards on one page two different ids (useId)', () => {
    render(
      <>
        <CredoCard {...CREDO} />
        <CredoCard {...CREDO} title="Cum lucrez" />
      </>,
    );

    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Cum lucrez' }),
    ).toBeInTheDocument();
  });

  it('lets a caller id land on the section without touching the name pair', () => {
    // A page may anchor the card (#filozofie); that id is the SECTION's, and
    // the heading keeps its own generated one (the ScheduleCard precedent).
    const { container } = render(<CredoCard {...CREDO} id="filozofie" />);

    const card = cardOf(container);
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(card.id).toBe('filozofie');
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).not.toBe('filozofie');
  });

  it('renders the title as an <h2> at SectionHeading’s own title step, through SectionHeading', () => {
    // h2, because the page's outline is h1 (the doctor's name, the band's
    // pair) → h2 (this card) — one level, no gap (§9). The step and the
    // wrapper are both READ OFF their own components: the h2 wears exactly
    // what a bare SectionHeading's title wears (D48: ui/Heading's `band` row
    // today), and its parent is exactly SectionHeading's root, so a card that
    // re-spelled the pair would fail.
    renderCard();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading.tagName).toBe('H2');
    const step = sectionHeadingStep();
    expect(heading.className).toBe(step);
    // Never-vacuous guard: the derived row is a real ui/Heading row — the
    // display face first, the strong ink, a type-size token between — and not
    // an empty string two broken renders could agree on. Token-level on
    // purpose: the container-responsive `band` step (D48, landed) adds an
    // `@md:` variant, and that must not turn this guard red.
    const tokens = tokensOf(heading);
    expect(tokens[0]).toBe('font-display');
    expect(tokens).toContain('text-ink-strong');
    expect(
      tokens.some((token) => /^text-(xs|sm|base|lg|\d?xl)$/.test(token)),
    ).toBe(true);
    expect((heading.parentElement as HTMLElement).className).toBe(
      classOf(<SectionHeading eyebrow="x" title="y" />),
    );
    // Ș ș Ț ț ă â î survive the whole chain — queried by TEXT, because a role
    // query would still match a mangled title.
    expect(screen.getByText(TITLE).textContent).toBe(TITLE);
  });

  it('shows the eyebrow as ui/Eyebrow, above the title and outside the name', () => {
    // The eyebrow is the title's LABEL, not part of the region's name: the
    // exact-name role query above already fails if it leaks in.
    renderCard();

    const eyebrow = screen.getByText(EYEBROW);
    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow.className).toBe(classOf(<Eyebrow>x</Eyebrow>));
    expect(eyebrow.textContent).toBe(EYEBROW);
    expect(
      eyebrow.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('region').getAttribute('aria-labelledby')).toBe(
      heading.id,
    );
  });
});

describe('CredoCard — the doctor’s own words (D12)', () => {
  it('nests the key word’s <b> inside the <p> inside the <blockquote>', () => {
    // The blockquote is the quotation's boundary (ARIA role `blockquote`), the
    // paragraph is the prose, and ui/Keyword's <b> is still a <b> after
    // Keywords → CredoCard → the DOM.
    const { container } = renderCard();

    const quote = within(cardOf(container)).getByRole('blockquote');
    expect(quote.children).toHaveLength(1);
    const paragraph = quote.children[0] as HTMLElement;
    expect(paragraph.tagName).toBe('P');

    const keyword = screen.getByText(KEYWORD);
    expect(keyword.tagName).toBe('B');
    expect(paragraph).toContainElement(keyword);
    expect(paragraph.textContent).toBe(BODY_TEXT);
    // The blockquote comes AFTER the heading pair: who is speaking is named
    // before the words are read.
    expect(
      screen
        .getByRole('heading', { level: 2, name: TITLE })
        .compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('dresses the paragraph like the doctor card’s quote — justified like it', () => {
    // text-xl + text-ink-faint = the doctor card's ink one size up (D58: the
    // two doctor quotes share --ink-faint, everything else keeps ink-muted;
    // D43b: the same words, a step larger on the doctor's own page — the
    // doctor card keeps text-lg). The two generated-content utilities are
    // ReviewCard's recipe. `text-justify` is PRESENT on the owner's word
    // (2026-09-25, the round-2 pack: "these texts do not feel like justify") —
    // §15.1's third per-element exception, the card's quote being the first.
    const { container } = renderCard();

    const paragraph = within(cardOf(container)).getByRole('blockquote')
      .children[0] as HTMLElement;
    expect(paragraph.className).toBe(QUOTE);
    expect(tokensOf(paragraph)).toContain('text-justify');
    // The justification rides the PARAGRAPH and nothing else (§15.15 b: the
    // utility ON the element, never a wrapper-level blanket): the blockquote
    // carries no class, and no other element in the card sets an alignment.
    expect(
      within(cardOf(container)).getByRole('blockquote'),
    ).not.toHaveAttribute('class');
    for (const element of [
      cardOf(container),
      ...cardOf(container).querySelectorAll('*'),
    ]) {
      if (element === paragraph) continue;
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/^text-(justify|center|left|right)$/);
      }
    }
  });

  it('carries no quotation mark of its own — the marks are CSS', () => {
    // ReviewCard's D6: `quotes: auto` picks the LANGUAGE's marks („…” in ro,
    // „…“ in de, «…» in fr) from the inherited lang, so a mark in the DOM
    // would print a second pair inside the generated one.
    const { container } = renderCard();

    expect(cardOf(container).textContent).not.toMatch(/[„”“"«»‹›]/);
  });
});

describe('CredoCard — ui/Card’s framed surface in its aura (D12, D61)', () => {
  it('dresses the section in the framed tone WITH the aura — derived from the atom itself', () => {
    // `framed` IS the reviews deck's idle card (ReviewsDeck passes it to every
    // slide but the selected one): the 3px `--card-tint` frame on the white
    // surface — the owner's "the non current one". And `aura` is the glow the
    // owner asked for on 2026-09-26 (D61), the PriceList cards' prop. Both
    // chosen on the atom's own axes, never spelled here as a border or a
    // shadow utility (§6.8).
    const { container } = renderCard();

    const card = framedAuraCard();
    expect(cardOf(container).className).toBe(card);
    // Never-vacuous guards, ONE PER AXIS, so neither choice can hide behind
    // the other: the row differs from an aura'd card of the atom's DEFAULT
    // tone (a card that dropped `framed` fails the equality above) and from
    // the plain `framed` row (a card that silently dropped `aura` fails it).
    expect(card).not.toBe(classOf(<Card aura>x</Card>));
    expect(card).not.toBe(classOf(<Card tone="framed">x</Card>));
  });

  it('merges the caller className LAST, keeping the atom’s classes first', () => {
    // ui/slot.ts merges atom classes, then the child element's — a
    // deterministic convention, NOT a cascade mechanism, and §6.8 limits
    // caller utilities to placement.
    const { container } = renderCard({ className: 'scroll-mt-10' });

    expect(cardOf(container).className).toBe(
      `${framedAuraCard()} scroll-mt-10`,
    );
  });

  it('owns no outer margin and no width of its own (§6.4)', () => {
    // It fills the box it is placed in (ui/Card D3 — beside the picture a
    // grid item of the band's bottom container, whose one track gives it its
    // width; in the stack an item of the one-column grid), and that box is
    // the band's business.
    const { container } = renderCard();

    const tokens = tokensOf(cardOf(container));
    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(tokens.filter((t) => /^(max-|min-)?w-/.test(t))).toEqual([]);
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
    // `lang` is the shape that matters most here: the generated quote marks
    // follow the element's language (`quotes: auto`), so a German credo on a
    // Romanian page would wear „…“ from this attribute alone.
    const { container } = render(
      <CredoCard
        eyebrow="In meinen Worten"
        title="Meine Philosophie"
        body="Zuhören steht am Anfang jeder Beratung."
        lang="de"
        data-slot="credo-card"
      />,
    );

    const card = cardOf(container);
    expect(card).toHaveAttribute('lang', 'de');
    expect(card).toHaveAttribute('data-slot', 'credo-card');
    expect(screen.getByRole('region', { name: 'Meine Philosophie' })).toBe(
      card,
    );
  });
});

describe('CredoCard — container steps only, zero islands (§6.5, §16)', () => {
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

  it('ships NO client directive and no translation machinery (§16, run D1)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/next-intl|useTranslations|getTranslations/);
    expect(CODE).not.toMatch(/@\/messages|@\/i18n/);
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
  });

  it('calls exactly ONE hook, and it is the server-safe useId', () => {
    const hooks = [...CODE.matchAll(/\buse[A-Z]\w*\(/g)].map((m) => m[0]);
    expect([...new Set(hooks)]).toEqual(['useId(']);
  });

  it('imports EXACTLY react, ui/Card and SectionHeading — nothing from lib', () => {
    // The import surface is the guard that sees what a regex cannot: swapping
    // a piece for something with state would hydrate every doctor page
    // without tripping a directive check. No lib specifier at all — not DATA
    // (the page is the one populator, run D1) and not even a type.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/SectionHeading/SectionHeading',
      '@/components/ui/Card/Card',
      'react',
    ]);
    expect(CODE).not.toMatch(/@\/lib\//);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`) forms
    // add a dependency the matcher above would not see.
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('prints nothing but the words it was handed (§8.1)', () => {
    // The sweep: strike the three fixtures out of the card's text and what
    // remains must hold no letter and no digit — a hardcoded label, a
    // separator word or a quote mark bolted on in JSX fails here. And
    // next-intl prints the dotted key on a miss; there is no t() at all.
    const { container } = renderCard();
    const text = cardOf(container).textContent ?? '';

    expect(text).toBe(`${EYEBROW}${TITLE}${BODY_TEXT}`);
    const residue = [EYEBROW, TITLE, BODY_TEXT].reduce(
      (rest, word) => rest.replaceAll(word, ' '),
      text,
    );
    expect(residue).not.toMatch(/[\p{L}\p{N}]/u);
    expect(text).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+/);
  });

  it('renders nothing interactive of its own', () => {
    renderCard();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('CredoCard — type-level pins', () => {
  it('pins the words’ shape the band re-exports (D12)', () => {
    // `body` is a ReactNode because the page hands over ui/Keyword fragments
    // (run D1); eyebrow and title are finished strings (§8.1).
    expectTypeOf<DoctorIntroCredo>().toEqualTypeOf<
      Readonly<{ eyebrow: string; title: string; body: ReactNode }>
    >();
  });

  it('pins the surface those negatives are read against', () => {
    // Never-vacuous guard (the ui/Card precedent): if the props type ever
    // degraded to `{}`, every negative pin below would pass while proving
    // nothing.
    expectTypeOf<CredoCardProps>().toHaveProperty('eyebrow');
    expectTypeOf<CredoCardProps>().toHaveProperty('title');
    expectTypeOf<CredoCardProps>().toHaveProperty('body');
    expectTypeOf<CredoCardProps>().toHaveProperty('className');
    expectTypeOf<CredoCardProps>().toHaveProperty('id');
  });

  it('refuses the names and the slot the Omit exists to refuse', () => {
    // The region's name is its heading's text ALONE: a caller's
    // `aria-labelledby` would land after the component's own and silently
    // replace the pair, while an `aria-label` would silently win over it —
    // better refused by the types than resolved by attribute order. And
    // content arrives as `body`: nested children would type-check and vanish.
    expectTypeOf<CredoCardProps>().not.toHaveProperty('aria-label');
    expectTypeOf<CredoCardProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<CredoCardProps>().not.toHaveProperty('children');

    // @ts-expect-error — content arrives as `body`; nested children would vanish
    const nested: CredoCardProps = { ...CREDO, children: 'x' };
    // @ts-expect-error — the region's name is its heading's alone
    const renamed: CredoCardProps = { ...CREDO, 'aria-label': 'x' };
    // @ts-expect-error — a caller's pair would replace the component's
    const repaired: CredoCardProps = { ...CREDO, 'aria-labelledby': 'x' };
    // @ts-expect-error — `title` is the heading's text, not the native tooltip
    const tooltipped: CredoCardProps = { ...CREDO, title: 42 };
    // @ts-expect-error — a credo card without the doctor's words is not one
    const wordless: CredoCardProps = { eyebrow: EYEBROW, title: TITLE };

    expect([nested, renamed, repaired, tooltipped, wordless]).toHaveLength(5);
  });
});
