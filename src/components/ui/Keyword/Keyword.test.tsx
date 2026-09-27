import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses —
// the house pattern (Card, Modal, SpeedDial…): tests/setup/components.ts loads
// no CSS globally, so the file that needs COMPUTED values imports it. Here that
// is D60's look: "650, upright, undecorated and lilac whatever the parent
// weighs" is a property of the cascade (the utility overriding Preflight's
// relative `bolder`, the arbitrary `font-[650]` compiling to a weight,
// --accent-strong reaching its utility through the `@theme inline` bridge),
// never of a class name. No
// next/font variable exists in this project, so the family resolves to the
// fallback stack — the pins read the REQUEST (weight, style, decoration,
// ink), which is what the atom owns; the face is the shell's.
import '@/styles/globals.css';
// …and the same file as SOURCE TEXT, for the token's own pin (the describe
// after the engine's): the computed colour proves the bridge works, the source
// text proves which layer carries which spelling (the CourseTimeline idiom).
import globalsCss from '@/styles/globals.css?raw';
import {
  Keyword,
  type KeywordProps,
  Keywords,
  type KeywordSegment,
  type KeywordsProps,
} from './Keyword';

// ui/Keyword — the suite that came with the promotion (2026-09-21, the
// doctor-pages run): the four <b> cases were sections/PersonnelCard's own and
// moved here with the component, byte for byte; the <Keywords> cases are new,
// because the segments shape is what the promotion added.
//
// Role-based queries wherever a role exists (§9): a passing test doubles as
// proof of accessible markup. <b> has no role of its own — that is the POINT
// of the element (salience, not importance), so the fragments are queried by
// their text and read back as tagName, which is also how a regression to
// <strong>/<em>/<mark> is caught.
//
// Fixtures are Romanian WITH diacritics (§15.7) — the sentence is the one the
// PersonnelCard stories quote, first-person and factual (CMSR: no
// superlatives, no promises). Two layers of pin: the class string byte for
// byte (RECIPE below), and the look READ OFF THE ENGINE with the real
// stylesheet loaded — since D60 (2026-09-26, the owner's "remove the
// underline", one look after D59's "add just a little more bold and underline
// them maybe"): the computed weight 650 (D59's, kept), style normal and NO
// text decoration under every parent weight, and the --accent-strong ink
// itself — #4b3a86 since D57, the owner's "a more seeable one … make it just
// jump at you more" — inside the quiet quote ink, unchanged by D59 and D60. A
// third layer pins the token itself, off globals.css's source text.

/** All seven Romanian marks — Ș ș Ț ț ă â î — so a broken encoding path fails
 *  here rather than in front of a patient. */
const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';

/** The doctor's sentence, in pieces, so the expected text is assembled from
 *  the same parts instead of being re-typed. */
const PARTS = {
  lead: 'Lucrez în ',
  first: 'ortodonție',
  middle:
    ' de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ',
  second: 'ascultarea',
  tail: ' pacientului, apoi construim împreună un plan potrivit.',
};

const SENTENCE = Object.values(PARTS).join('');

/** The same sentence as `lib/team`'s splitKeywords would hand it over: the
 *  <k>…</k> marks cut into segments, plain text between them. */
const SEGMENTS: readonly KeywordSegment[] = [
  { text: PARTS.lead, keyword: false },
  { text: PARTS.first, keyword: true },
  { text: PARTS.middle, keyword: false },
  { text: PARTS.second, keyword: true },
  { text: PARTS.tail, keyword: false },
];

/** The one recipe, in canonical order. Written out rather than imported so the
 *  test fails on a silent edit to the component's constant (the ui/Eyebrow
 *  convention). All on 2026-09-26: D52 moved the weight token from
 *  `font-normal` to `font-bold`; D55 moved it back and added `italic`; D56
 *  dropped the slant, set the weight at `font-semibold` and moved the ink off
 *  `text-ink-strong` onto the new accent role; D59 raised the weight to an
 *  arbitrary `font-[650]` and added the underline trio — `underline`,
 *  `decoration-1`, `underline-offset-2`; D60 (the owner's "remove the
 *  underline") took the trio back out and kept the 650 — the engine pin below
 *  reads `none` back off the key word. */
const RECIPE = 'font-[650] text-accent-strong';

/** The computed forms of the two inks — `--accent-strong` #4b3a86 (the role
 *  D56's, the value D57's) and `--ink-muted` #5b554f — as Chromium serialises
 *  them. */
const ACCENT_STRONG = 'rgb(75, 58, 134)';
const INK_MUTED = 'rgb(91, 85, 79)';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

describe('Keyword — HTML’s key-word element', () => {
  it('renders a <b> a little bolder, undecorated, upright, in the accent lilac', () => {
    // <b> because the spec's own example for it is "key words in a document
    // abstract"; the look is D60's — the owner found D52's bold "too bold" and
    // D55's italic "stupid", took D56's "just a little bold" 600, asked for
    // "just a little more bold and underline them maybe" (D59), then, one look
    // later, "remove the underline": 650, no line, no slant, and the lilac
    // that passes 4.5:1 at body size.
    render(<Keyword>{PARTS.first}</Keyword>);

    const keyword = screen.getByText(PARTS.first);
    expect(keyword.tagName).toBe('B');
    expect(keyword.className).toBe(RECIPE);
  });

  it('claims no importance and no emphasis — it is neither', () => {
    // <strong> would claim importance, <em> stress, <mark> relevance to the
    // reader's current task; a speciality named in passing is none of those.
    const { container } = render(<Keyword>{PARTS.second}</Keyword>);

    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('em')).toBeNull();
    expect(container.querySelector('mark')).toBeNull();
  });

  it('keeps Ș ș Ț ț ă â î intact', () => {
    // Queried by the diacritics themselves: getByText would miss the node if
    // any layer normalised or mangled them.
    render(<Keyword>{RO_ALL}</Keyword>);

    expect(screen.getByText(RO_ALL).textContent).toBe(RO_ALL);
  });

  it('owns no outer margin and no responsive self-scaling (§6.4, §6.5)', () => {
    // The sentence around it owns the spacing, and an atom cannot see its
    // container — both rules, pinned on the one class string this atom has.
    const tokens = tokensOf(
      render(<Keyword>{PARTS.first}</Keyword>).container
        .firstElementChild as HTMLElement,
    );

    expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    expect(
      tokens.filter((t) => /^(sm|md|lg|xl|2xl|@[a-z0-9]+):/.test(t)),
    ).toEqual([]);
  });
});

describe('Keyword — the look, read off the engine (D60)', () => {
  it('weighs 650, stands upright and wears no line whatever the sentence around it weighs — Preflight’s relative `bolder` never decides', () => {
    // WHY the weight is PINNED rather than left to Preflight's
    // `b { font-weight: bolder }`: `bolder` is relative to the parent, so it
    // would give 700 in a 400 line — D52's "too bold" by the back door — and
    // 900 in a 600/700 one. Each parent below is set by inline style (no
    // utility to generate) and read back first, so a parent that silently
    // fell to 400 cannot let the pin pass for the wrong reason. The 700 / 900
    // rows are where the weight half of the cue inverts — the pin's known edge
    // (THE RECIPE); no consumer has such a line. 650 is an ARBITRARY value
    // (`font-[650]`), so this read-back is also the proof that Tailwind
    // compiled it to a weight and not to a font family.
    //
    // Upright under every parent: D56 dropped the slant, and the old
    // `font-synthesis-style` pin went with it — no italic is requested, so
    // there is nothing left to synthesise. The 650 itself is a true instance
    // of the hosted variable serif (200–900), not a synthesised emboldening.
    //
    // No line (D60): D59's underline was struck on the owner's "remove the
    // underline" after one look — it read as a link — so the key word's
    // `text-decoration-line` is read back as `none` under every parent, the
    // guard against the line creeping back through the recipe. The ink is
    // read back beside it, unchanged.
    const parentWeights = ['300', '400', '600', '700', '900'];
    render(
      <>
        {parentWeights.map((weight) => (
          <p key={weight} style={{ fontWeight: Number(weight) }}>
            Lucrez în <Keyword>{`ortodonție ${weight}`}</Keyword> de peste zece
            ani.
          </p>
        ))}
      </>,
    );

    const paragraphs = screen.getAllByRole('paragraph');
    expect(
      paragraphs.map((paragraph) => getComputedStyle(paragraph).fontWeight),
    ).toEqual(parentWeights);
    const keywords = parentWeights.map((weight) =>
      getComputedStyle(screen.getByText(`ortodonție ${weight}`)),
    );
    expect(keywords.map((keyword) => keyword.fontWeight)).toEqual([
      '650',
      '650',
      '650',
      '650',
      '650',
    ]);
    expect(keywords.map((keyword) => keyword.fontStyle)).toEqual([
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
    ]);
    for (const keyword of keywords) {
      expect(keyword.textDecorationLine).toBe('none');
      expect(keyword.color).toBe(ACCENT_STRONG);
    }
  });

  it('stands apart from the quiet quote by weight, hue and a darker ink — and neither wears a line', () => {
    // The consumers' shape (PersonnelCard's blockquote, the CredoCard's <p>):
    // a sentence in a quiet ink, upright, at the body's 400, the fragments
    // inside it. The muted ink stands in for the quote here — the consumers
    // have worn the lighter --ink-faint since D58, and the atom owns neither.
    // Since D56 the two differ in weight (650 since D59, against 400 — the
    // owner's "just a little more bold") and in hue (the lilac against the
    // warm grey); since D57 in LIGHTNESS too, with the key word the darker of
    // the two. D59's fourth difference, SHAPE — the key word alone underlined
    // — lasted one look: D60 struck it, so neither wears a line. This pins the
    // two inks, the two weights and the absent decoration on both, never a
    // contrast between the inks — the step is not one. Both stand upright.
    render(
      <p className="text-ink-muted">
        <Keywords segments={SEGMENTS} />
      </p>,
    );

    const sentence = getComputedStyle(screen.getByRole('paragraph'));
    expect(sentence.color).toBe(INK_MUTED);
    expect(sentence.fontWeight).toBe('400');
    expect(sentence.fontStyle).toBe('normal');
    // No line anywhere (D60): not on the sentence, not on the fragments.
    expect(sentence.textDecorationLine).toBe('none');

    for (const text of [PARTS.first, PARTS.second]) {
      const keyword = getComputedStyle(screen.getByText(text));
      expect(keyword.color).toBe(ACCENT_STRONG);
      expect(keyword.fontWeight).toBe('650');
      expect(keyword.fontStyle).toBe('normal');
      expect(keyword.textDecorationLine).toBe('none');
    }
  });
});

describe('Keyword — its ink’s token, read off globals.css (D56)', () => {
  // `--accent-strong` is wired EXACTLY as `--accent-decorative` is, and that
  // wiring has TWO spellings: the raw hex on the semantic light-theme block
  // (`:root, [data-theme='light'], ::backdrop` — where the sheet's header
  // says a colour's raw value lives; the `@theme` primitive layer holds the
  // fonts, the aura and the animations, and no colour at all), and the
  // `@theme inline` bridge that mints `text-accent-strong` from it. A renamed
  // variable or a dropped bridge leaves the class silently inert — no runtime
  // error, no lint error, and the engine test above would read an inherited
  // ink instead — so the source text is pinned as well. Comments are stripped
  // first: the token layer explains itself in prose that names the very
  // strings matched below, and a guard that cannot fail is not a guard.
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ');

  /** One block's body, from its opener to its first `}` — safe for both
   *  blocks read here, which hold declarations only. */
  const blockOf = (source: string, opener: string): string => {
    const start = source.indexOf(opener);
    if (start < 0) return '';
    const body = source.slice(start + opener.length);
    return body.slice(0, body.indexOf('}'));
  };
  const SEMANTIC = ":root, [data-theme='light'], ::backdrop {";
  const BRIDGE = '@theme inline {';
  const VALUE = '--accent-strong: #4b3a86;';
  const UTILITY = '--color-accent-strong: var(--accent-strong);';

  it('carries the exact hex on the semantic light-theme block', () => {
    expect(blockOf(css, SEMANTIC)).toContain(VALUE);
  });

  it('bridges it to the `text-accent-strong` utility inside @theme inline', () => {
    expect(blockOf(css, BRIDGE)).toContain(UTILITY);
  });

  it('is wired the way --accent-decorative is — the same two layers', () => {
    // The model the role was added after: its hex on the same block, its
    // bridge in the same block — so the two accents cannot drift apart in
    // shape while one of them is edited.
    expect(blockOf(css, SEMANTIC)).toContain('--accent-decorative: #7a6d9c;');
    expect(blockOf(css, BRIDGE)).toContain(
      '--color-accent-decorative: var(--accent-decorative);',
    );
  });

  it('has teeth — and each spelling occurs exactly ONCE in the sheet', () => {
    expect(css.split('#4b3a86').length - 1).toBe(1);
    expect(css.split('--accent-strong:').length - 1).toBe(1);
    expect(css.split('--color-accent-strong:').length - 1).toBe(1);
    const without = css.replace(VALUE, '');
    expect(without).not.toBe(css);
    expect(blockOf(without, SEMANTIC)).not.toContain('--accent-strong:');
  });
});

describe('Keyword — §6.8 native-element fidelity', () => {
  it('merges the caller className LAST, keeping its own classes first', () => {
    // Order is the contract, not an accident: a deterministic convention, NOT
    // a cascade mechanism (attribute order never decides CSS specificity).
    render(
      <Keyword className="whitespace-nowrap" lang="de" data-slot="keyword">
        Kieferorthopädie
      </Keyword>,
    );

    const keyword = screen.getByText('Kieferorthopädie');
    expect(keyword.className).toBe(`${RECIPE} whitespace-nowrap`);
    expect(keyword).toHaveAttribute('lang', 'de');
    expect(keyword).toHaveAttribute('data-slot', 'keyword');
  });

  it('accepts ref as a regular prop (React 19) — it is the <b>', () => {
    const keyword = createRef<HTMLElement>();
    render(<Keyword ref={keyword}>{PARTS.first}</Keyword>);

    expect(keyword.current?.tagName).toBe('B');
    expect(keyword.current).toHaveTextContent(PARTS.first);
  });
});

describe('Keywords — the sentence, cut into segments', () => {
  it('renders plain segments as text and keyword segments as <b>, in order', () => {
    render(
      <p>
        <Keywords segments={SEGMENTS} />
      </p>,
    );

    const sentence = screen.getByRole('paragraph');
    // The words arrive whole — the spaces around the fragments included, which
    // is the half of "assembled from data" a naive join loses.
    expect(sentence.textContent).toBe(SENTENCE);

    const keywords = [...sentence.querySelectorAll('b')];
    expect(keywords.map((keyword) => keyword.textContent)).toEqual([
      PARTS.first,
      PARTS.second,
    ]);
    for (const keyword of keywords) {
      expect(keyword.className).toBe(RECIPE);
    }
    expect(within(sentence).getByText(PARTS.first).tagName).toBe('B');
  });

  it('adds NO wrapper element — the consumer’s <p> is the box', () => {
    // A Fragment, not a <span>: the only ELEMENTS inside the paragraph are the
    // two fragments themselves; everything else is text nodes.
    render(
      <p>
        <Keywords segments={SEGMENTS} />
      </p>,
    );

    const sentence = screen.getByRole('paragraph');
    expect(sentence.children).toHaveLength(2);
    expect([...sentence.children].map((child) => child.tagName)).toEqual([
      'B',
      'B',
    ]);
  });

  it('renders an all-plain sentence with no <b> at all', () => {
    // The shape a doctor who marked nothing produces — one segment, no marks,
    // and not one stray element around it.
    const { container } = render(
      <p>
        <Keywords segments={[{ text: SENTENCE, keyword: false }]} />
      </p>,
    );

    const sentence = screen.getByRole('paragraph');
    expect(sentence.textContent).toBe(SENTENCE);
    expect(container.querySelectorAll('b')).toHaveLength(0);
    expect(sentence.children).toHaveLength(0);
  });

  it('renders nothing at all for an empty list', () => {
    const { container } = render(
      <p>
        <Keywords segments={[]} />
      </p>,
    );

    expect(screen.getByRole('paragraph').textContent).toBe('');
    expect(container.querySelectorAll('*')).toHaveLength(1);
  });

  it('keeps a keyword’s own diacritics and spacing intact', () => {
    render(
      <p>
        <Keywords
          segments={[
            { text: 'Lucrez cu ', keyword: false },
            { text: RO_ALL, keyword: true },
          ]}
        />
      </p>,
    );

    expect(screen.getByText(RO_ALL).tagName).toBe('B');
    expect(screen.getByRole('paragraph').textContent).toBe(
      `Lucrez cu ${RO_ALL}`,
    );
  });
});

describe('Keyword — type-level pins', () => {
  it('requires the word, and keeps the segment shape two fields wide', () => {
    // Erased to no-ops at runtime; they fail at `tsc --noEmit` time, naming
    // the property. The segment type is STRUCTURAL on purpose (lib/team
    // returns it without importing it, §4), so its shape is a contract
    // between two files that never meet — pinned here, where it is declared.
    expectTypeOf<KeywordSegment>().toEqualTypeOf<
      Readonly<{ text: string; keyword: boolean }>
    >();
    expectTypeOf<KeywordsProps>().toHaveProperty('segments');
    expectTypeOf<KeywordProps>().toHaveProperty('children');
    expectTypeOf<KeywordProps>().toHaveProperty('className');

    // @ts-expect-error — a keyword without its word (§8.1)
    const wordless: KeywordProps = {};
    // @ts-expect-error — a segment must say whether it is one (no default)
    const unmarked: KeywordSegment = { text: 'ortodonție' };

    expect([wordless, unmarked]).toHaveLength(2);
  });
});
