import { createElement, createRef } from 'react';
import { render, screen } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  PostProse,
  type PostProseItem,
  type PostProseProps,
} from './PostProse';
import source from './PostProse.tsx?raw';

// sections/PostProse — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): every subheading is found as a level-2 heading by
// its own text; the paragraphs, which carry no role a query can name, by
// structure and by their text.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and that
// absence is itself an assertion (the PostCard, PostList and PostHeader
// precedent): next-intl's hooks throw without one, so a green render proves
// this piece calls no t().
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the contract here — written OUT
// below rather than imported (the ui/Eyebrow RECIPE convention), so a silent
// edit to the piece or to ui/Heading fails HERE instead of following the code
// it is meant to check. What the real stylesheet does with them — 18px and
// 24px, the 16px gap, the 40px above a subheading, no sideways scroll, the
// belt at work — is PostProse.stories.tsx's business, and where a shipped
// subheading breaks is PostProse.subheadings.test.tsx's.
//
// ── THE CONSOLE, WATCHED FOR THE WHOLE FILE (the review of 2026-10-20,
// typescript, measured; corrected in its round 2). React prints its
// missing-key warning ONCE PER PARENT NAME, not once per component: react-dom
// (19.2) dedups it by the name of the list's parent — for an element, its
// tag — so a keyless list under ANY other <div> rendered first in this file
// would silence PostProse's own, which hangs under a <div>, and a spy that
// one test installs sees nothing once an earlier test has printed one. A
// DUPLICATE key is warned on every render that meets one, never deduped.
// So the spy goes in before the first test, the file's FIRST test proves it
// with a working control — a keyless list under a <ul>, so as never to spend
// the <div>'s one warning — and every test ends with the console unread: a
// dropped key, a duplicate key or any other error React prints fails the
// test that caused it.
//
// ── THE FIXTURES ARE EXAMPLE SHAPES, not runs the page hands over: since
// the article holds blog photos its runs are shorter (PostProse.tsx's
// header), and these join the words of several into the shapes this suite
// reads — a subheading among paragraphs, and a run that opens on one.

/** A run that holds every shape — a paragraph, then two subheadings with two
 *  paragraphs each: the words of the demo article's first three runs (the
 *  two photos between them left out), in Romanian with diacritics (§15.7),
 *  shortened — the order and the kinds are what this suite reads. */
const OPENING = [
  {
    kind: 'paragraph',
    text: 'Periuța de dinți este instrumentul pe care îl folosești de două ori pe zi.',
  },
  { kind: 'heading', text: 'Peri moi, medii sau tari?' },
  {
    kind: 'paragraph',
    text: 'Pentru majoritatea oamenilor, o periuță cu peri moi este alegerea potrivită.',
  },
  {
    kind: 'paragraph',
    text: 'Dacă gingiile îți sângerează la periaj, perii extra moi sunt un bun punct de plecare.',
  },
  { kind: 'heading', text: 'Manuală sau electrică?' },
  {
    kind: 'paragraph',
    text: 'Ambele variante curăță bine dacă sunt folosite corect.',
  },
] as const satisfies readonly PostProseItem[];

/** A run that OPENS on a subheading — the shape of every run after a picture
 *  block; the words after the demo article's first gallery, a photo and a
 *  before/after between them left out. */
const AFTER_GALLERY = [
  { kind: 'heading', text: 'Capul periuței și mânerul' },
  {
    kind: 'paragraph',
    text: 'Un cap mic ajunge mai ușor la măselele din spate.',
  },
  { kind: 'heading', text: 'Când o schimbi' },
  {
    kind: 'paragraph',
    text: 'Schimbă periuța la fiecare trei luni sau mai devreme.',
  },
] as const satisfies readonly PostProseItem[];

// THE RECIPES, written out.
/** THE RHYTHM's stack: a flex column, 16px between items. */
const STACK = ['flex', 'flex-col', 'gap-4'];
/** THE PARAGRAPH: the site's 18px reading text, and THE BELT. */
const PARAGRAPH = ['text-lg', 'wrap-anywhere'];
/** ui/Heading's `subhead` step on its default ink, then the subheading's own
 *  three: start-aligned on the element, never hyphenated, and THE BELT. */
const SUBHEAD = [
  'font-display',
  'text-2xl',
  'font-semibold',
  'text-ink-strong',
  'text-start',
  'hyphens-none',
  'wrap-anywhere',
];
/** THE ROOM ABOVE a subheading that is not the first item. */
const ROOM = 'pt-6';

/** A no-break space, by name — never typed raw into a test. */
const NBSP = String.fromCodePoint(0xa0);

/** Characters that SHOW NOTHING yet survive `trim()` (lib/visible-text's THE
 *  UNSEEN SET), by their codes: the zero-width space and the soft hyphen —
 *  FORMAT characters (Cf) both — and the Hangul filler, a LETTER (Lo) drawn
 *  as blank width, and the emoji presentation selector U+FE0F, a mark (Mn):
 *  no format characters, so a test of `trim()` or of `[^\s\p{Cf}]` lets
 *  these two through, and only the shared set refuses them. */
const ZERO_WIDTH = String.fromCodePoint(0x200b);
const SOFT_HYPHEN = String.fromCodePoint(0xad);
const HANGUL_FILLER = String.fromCodePoint(0x3164);
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);

/** How a refusal names OPENING's run, `count` items long: by its first six
 *  words that show, `spelled`, and an ellipsis for the rest. */
const openingRun = (count: number): string =>
  `the run of ${count} items whose first words are "Periuța de dinți este instrumentul pe" …`;

/** THE CONSOLE, WATCHED FOR THE WHOLE FILE (the header): installed before the
 *  first test, read and emptied after every one, given back after the last. */
let consoleErrors: MockInstance<typeof console.error> | undefined;

beforeAll(() => {
  consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  const printed = (consoleErrors?.mock.calls ?? []).map((call) =>
    call.map(String).join(' '),
  );
  // Emptied BEFORE the assertion, so one test's error is never read again by
  // the next.
  consoleErrors?.mockClear();
  expect(printed, 'what React printed to console.error').toEqual([]);
});

afterAll(() => {
  consoleErrors?.mockRestore();
  consoleErrors = undefined;
});

/** Read through the ATTRIBUTE, the same bytes on every element. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const renderProse = (overrides: Partial<PostProseProps> = {}) =>
  render(<PostProse items={OPENING} {...overrides} />);

/** The stack — the root, reached from the container: it carries no role. */
const stackOf = (container: HTMLElement): HTMLElement => {
  const stack = container.firstElementChild;
  if (!(stack instanceof HTMLElement)) {
    throw new Error('PostProse test: nothing rendered');
  }
  return stack;
};

/**
 * A source with its PROSE removed — what the guards below run against: the
 * header discusses `'use client'`, t() and the margins it does not have, by
 * name. ONE left-to-right pass (tests/unit/design-scale.test.ts's `tsCode`):
 * string literals are stepped over whole, and a `//` comment — which opens
 * only at a line's start or after whitespace — is consumed before a `/*`
 * inside it could open a block running on to the next `*\/`.
 */
const codeOf = (text: string): string =>
  text.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

const CODE = codeOf(source);

describe('PostProse — THE CONSOLE, WATCHED FOR THE WHOLE FILE', () => {
  it('catches React’s key warning from the very first render — the premise of every test here, proven by a working control', () => {
    // The spy is in before any test renders (the header).
    expect(vi.isMockFunction(console.error)).toBe(true);
    // THE CONTROL: a list without keys, under a <ul> — never a <div>: React
    // warns of a missing key once per parent name, and a keyless <div> list
    // here would silence PostProse's own warning for the rest of the file.
    render(
      createElement('ul', null, [
        createElement('li', null, 'Periuța'),
        createElement('li', null, 'Pasta de dinți'),
      ]),
    );
    const printed = (consoleErrors?.mock.calls ?? []).map((call) =>
      call.map(String).join(' '),
    );
    expect(printed).toEqual([
      expect.stringContaining(
        'Each child in a list should have a unique "key" prop',
      ),
    ]);
    // Emptied, so the console reads clean after this test as after every
    // other.
    consoleErrors?.mockClear();
  });
});

describe('PostProse — the items, in the article’s order', () => {
  it('renders one element per item, in order — a paragraph a <p>, a subheading an <h2> — each text as given', () => {
    const { container } = renderProse();

    const children = [...stackOf(container).children];
    expect(children.map((child) => child.tagName)).toEqual(
      OPENING.map((item) => (item.kind === 'paragraph' ? 'P' : 'H2')),
    );
    expect(children.map((child) => child.textContent)).toEqual(
      OPENING.map((item) => item.text),
    );
  });

  it('is ONE <div>, a flex column 16px between items, holding the items and nothing else', () => {
    const { container } = renderProse();

    expect(container.children).toHaveLength(1);
    const stack = stackOf(container);
    expect(stack.tagName).toBe('DIV');
    expect(tokensOf(stack)).toEqual(STACK);
    expect(stack.children).toHaveLength(OPENING.length);
  });

  it('renders every string as given — diacritics intact, no message key path (§8.1)', () => {
    const { container } = renderProse();

    expect(container.textContent).toBe(
      OPENING.map((item) => item.text).join(''),
    );
  });
});

describe('PostProse — the paragraph: the site’s 18px reading text', () => {
  it('is a plain <p> on `text-lg` with THE BELT — no ink, no alignment of its own', () => {
    const { container } = renderProse();

    const paragraphs = [...stackOf(container).querySelectorAll(':scope > p')];
    expect(paragraphs).toHaveLength(
      OPENING.filter((item) => item.kind === 'paragraph').length,
    );
    for (const paragraph of paragraphs) {
      // The body's ink, inherited; start-aligned by the base tier's fence
      // (§15.15 b); hyphens left to the site (§15.14). Nothing else rides.
      expect(tokensOf(paragraph)).toEqual(PARAGRAPH);
    }
  });
});

describe('PostProse — the subheading: an <h2> on ui/Heading’s `subhead` step', () => {
  it('makes every subheading an <h2> named by its text — level 2 only, under the page’s <h1>', () => {
    renderProse();

    const headings = screen.getAllByRole('heading');
    const subheads = OPENING.filter((item) => item.kind === 'heading');
    expect(headings).toHaveLength(subheads.length);
    for (const item of subheads) {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: item.text,
      });
      expect(heading.tagName).toBe('H2');
    }
  });

  it('dresses a subheading in the `subhead` step and THE BELT, with its ROOM when it follows text', () => {
    renderProse();

    for (const item of OPENING.filter((entry) => entry.kind === 'heading')) {
      // Neither subheading of the opening run opens the stack.
      expect(
        tokensOf(screen.getByRole('heading', { level: 2, name: item.text })),
      ).toEqual([...SUBHEAD, ROOM]);
    }
  });

  it('gives a subheading that OPENS the stack no room — the page’s measure spaces the blocks', () => {
    renderProse({ items: AFTER_GALLERY });

    const [first, second] = AFTER_GALLERY.filter(
      (item) => item.kind === 'heading',
    );
    if (!first || !second) throw new Error('PostProse test: two subheadings');
    expect(
      tokensOf(screen.getByRole('heading', { level: 2, name: first.text })),
    ).toEqual(SUBHEAD);
    expect(
      tokensOf(screen.getByRole('heading', { level: 2, name: second.text })),
    ).toEqual([...SUBHEAD, ROOM]);
  });

  it('gives a subheading right after another its room as well', () => {
    renderProse({
      items: [
        { kind: 'heading', text: 'Pentru copii' },
        { kind: 'heading', text: 'Cum o păstrezi curată' },
      ],
    });

    expect(
      tokensOf(screen.getByRole('heading', { level: 2, name: 'Pentru copii' })),
    ).toEqual(SUBHEAD);
    expect(
      tokensOf(
        screen.getByRole('heading', {
          level: 2,
          name: 'Cum o păstrezi curată',
        }),
      ),
    ).toEqual([...SUBHEAD, ROOM]);
  });

  it('carries no id, no role and no other attribute — the <h2>’s own element is the outline', () => {
    renderProse();

    for (const heading of screen.getAllByRole('heading')) {
      expect(heading.getAttributeNames()).toEqual(['class']);
    }
  });
});

describe('PostProse — the keys are indices', () => {
  it('keeps two paragraphs with the same words as TWO — and warns of no duplicate key', () => {
    // No spy of its own: THE CONSOLE, WATCHED FOR THE WHOLE FILE (the
    // header) reads what React printed after this test as after every other.
    // A duplicate key is warned on every render that meets one, so this test
    // would see its own; a missing key is warned once per parent name, which
    // the file's first test's control leaves unspent for the <div>.
    const repeated = 'Clătește bine periuța după fiecare periaj.';
    const { container } = renderProse({
      items: [
        { kind: 'paragraph', text: repeated },
        { kind: 'paragraph', text: repeated },
      ],
    });

    const paragraphs = [...stackOf(container).children];
    expect(paragraphs.map((paragraph) => paragraph.textContent)).toEqual([
      repeated,
      repeated,
    ]);
  });
});

describe('PostProse — nothing to say renders nothing', () => {
  it('renders NO element for an empty run — no empty box to open the page’s gaps around', () => {
    const { container } = renderProse({ items: [] });

    expect(container.innerHTML).toBe('');
  });
});

describe('PostProse — a kind that escaped the types', () => {
  it('fails by name — never a block of the owner’s text dropped in silence', () => {
    const stray = { kind: 'quote', text: 'Citat' } as unknown as PostProseItem;

    // Called as the plain function it is: no hook, so the throw is the
    // component's own, not one React reports on its way out.
    expect(() => PostProse({ items: [OPENING[0], stray] })).toThrow(
      new TypeError(
        `PostProse: item 2 has the kind "quote", which is neither a paragraph nor a heading; it stands in ${openingRun(2)}`,
      ),
    );
  });

  it('names a kind that is no string by its type — never „undefined" for a symbol', () => {
    const stray = {
      kind: Symbol('quote'),
      text: 'Citat',
    } as unknown as PostProseItem;

    expect(() => PostProse({ items: [stray] })).toThrow(
      new TypeError(
        'PostProse: item 1 has the kind <symbol>, which is neither a paragraph nor a heading; it stands in the run of 1 item whose first words are "Citat"',
      ),
    );
  });
});

describe('PostProse — an item with no text', () => {
  // THE REFUSALS: lib/blog-article's parseArticle refuses such a text at
  // build, by the same rule (lib/visible-text), so these guard a story or a
  // test that hands one in. Called as the plain function, as above: the
  // throw is the component's own.

  /** Why each kind is refused, written out. */
  const WHY = {
    paragraph:
      'an empty <p> would be a 0px box with the stack’s gap on both sides of it, and one of invisible characters a blank line',
    heading:
      'an empty <h2>, or one of invisible characters, would put a heading with no name in the page’s outline',
  } as const;

  /** The refusal of item `n`, a `kind` whose text, as `spelled` quotes it, is
   *  `quoted`, standing in `run` — every part written out. */
  const noText = (
    n: number,
    kind: 'paragraph' | 'heading',
    quoted: string,
    run: string,
  ): RangeError =>
    new RangeError(
      `PostProse: item ${n}, a ${kind}, has the text ${quoted}, which shows nothing — ${WHY[kind]}; it stands in ${run}`,
    );

  it('refuses an empty paragraph by name — never a 0px <p> with the stack’s gap on both sides of it', () => {
    const empty = () =>
      PostProse({ items: [OPENING[0], { kind: 'paragraph', text: '' }] });

    expect(empty).toThrow(RangeError);
    expect(empty).toThrow(noText(2, 'paragraph', '""', openingRun(2)));
  });

  it('refuses a subheading of nothing but spaces by name — never an <h2> with no name in the outline — every space in the quote spelled by its code point', () => {
    const spaces = () =>
      PostProse({
        items: [
          OPENING[0],
          OPENING[1],
          { kind: 'heading', text: ` ${NBSP}\n ` },
        ],
      });

    expect(spaces).toThrow(RangeError);
    expect(spaces).toThrow(
      noText(3, 'heading', '" \\u{00A0}\\u{000A} "', openingRun(3)),
    );
  });

  it.each([
    [
      'a zero-width space (U+200B), a format character',
      ZERO_WIDTH,
      '"\\u{200B}"',
    ],
    ['a soft hyphen (U+00AD), a format character', SOFT_HYPHEN, '"\\u{00AD}"'],
    // Neither of these two is a format character, and `trim()` keeps both:
    // each is refused by the shared set alone — a test of `trim()` or of the
    // retired `[^\s\p{Cf}]` lets both through (round 1 of lib/visible-text's
    // review, 2026-10-21).
    [
      'a Hangul filler (U+3164) — a letter drawn as blank width',
      HANGUL_FILLER,
      '"\\u{3164}"',
    ],
    [
      'the emoji presentation selector (U+FE0F) alone — a mark, drawn as nothing on its own',
      VARIATION_SELECTOR,
      '"\\u{FE0F}"',
    ],
  ])(
    'refuses a text of nothing but %s, of either kind — trimming keeps it, yet it shows nothing (lib/visible-text): until the round-2 review a 28px blank line, or an <h2> with no name',
    (_name, invisible, quoted) => {
      for (const kind of ['paragraph', 'heading'] as const) {
        const blank = () =>
          PostProse({ items: [OPENING[0], { kind, text: invisible }] });

        expect(blank, kind).toThrow(RangeError);
        expect(blank, kind).toThrow(noText(2, kind, quoted, openingRun(2)));
      }
    },
  );

  it('refuses a SUBHEADING of marks alone — it shows, and names nothing: an <h2> needs a word, a letter or a digit (lib/visible-text’s `hasVisibleWord`, round 2 of its review)', () => {
    const marks = () =>
      PostProse({ items: [OPENING[0], { kind: 'heading', text: '…' }] });

    expect(marks).toThrow(RangeError);
    expect(marks).toThrow(
      new RangeError(
        `PostProse: item 2, a heading, has the text "…", which names nothing — no letter or digit shows in it, and an <h2> of marks alone is a heading whose name says nothing in the page’s outline (SC 2.4.6); it stands in ${openingRun(2)}`,
      ),
    );
    // A number names something — „2019" as a subheading is words — and a
    // PARAGRAPH keeps the text rule: prose of marks alone shows, and prints.
    const { container } = renderProse({
      items: [
        { kind: 'heading', text: '2019' },
        { kind: 'paragraph', text: '…' },
      ],
    });
    expect(screen.getByRole('heading', { level: 2, name: '2019' })).toBe(
      stackOf(container).firstElementChild,
    );
    expect(stackOf(container).lastElementChild?.textContent).toBe('…');
  });

  it('names the run by its FIRST WORDS THAT SHOW — an article hands this piece ten runs, and „item 1" alone says not which', () => {
    const run = [
      { kind: 'heading', text: '' },
      { kind: 'paragraph', text: 'Schimbă periuța la fiecare trei luni.' },
    ] as const satisfies readonly PostProseItem[];

    // Six words exactly: no ellipsis follows them.
    expect(() => PostProse({ items: run })).toThrow(
      noText(
        1,
        'heading',
        '""',
        'the run of 2 items whose first words are "Schimbă periuța la fiecare trei luni."',
      ),
    );
    // …and a run where nothing shows says so.
    expect(() =>
      PostProse({ items: [{ kind: 'paragraph', text: ZERO_WIDTH }] }),
    ).toThrow(
      noText(
        1,
        'paragraph',
        '"\\u{200B}"',
        'a run of 1 item, none of which shows text',
      ),
    );
  });

  it.each([
    ['no text at all', undefined, 'undefined'],
    ['a number', 7, '7'],
    ['null', null, 'null'],
    // JSON.stringify printed the next two as „the text undefined" and threw
    // on the third — named by their type since round 1 of lib/visible-text's
    // review (2026-10-21).
    ['a symbol', Symbol('text'), '<symbol>'],
    ['a function', () => 'text', '<function>'],
    ['a BigInt', BigInt(7), '<bigint>'],
  ])(
    'refuses a text that escaped the types — %s — with a TypeError naming it by its type, the split a kind that escaped them takes',
    (_name, text, named) => {
      const stray = { kind: 'paragraph', text } as unknown as PostProseItem;
      const refusal = () => PostProse({ items: [stray] });

      expect(refusal).toThrow(TypeError);
      expect(refusal).toThrow(
        new TypeError(
          `PostProse: item 1, a paragraph, has the text ${named}, which is not a string; it stands in a run of 1 item, none of which shows text`,
        ),
      );
    },
  );

  it('keeps a text with spaces round its words — what is printed is the item’s own text', () => {
    // Only a text that shows NOTHING is refused (lib/visible-text); the
    // parser refuses an article's text with a stray space at either end
    // (lib/visible-text's `isFinishedText`, which lib/blog-article asks of
    // every text), and this piece prints what it is handed.
    const { container } = renderProse({
      items: [{ kind: 'paragraph', text: ' Clătește bine periuța. ' }],
    });

    expect(stackOf(container).firstElementChild?.textContent).toBe(
      ' Clătește bine periuța. ',
    );
  });
});

describe('PostProse — §6 fidelity: placement in, no styling out', () => {
  it('merges the caller’s className LAST, onto the stack itself', () => {
    const { container } = renderProse({ className: 'w-full' });

    const tokens = tokensOf(stackOf(container));
    expect(tokens.slice(0, STACK.length)).toEqual(STACK);
    expect(tokens.at(-1)).toBe('w-full');
  });

  it('spreads native props onto the stack, never onto the items', () => {
    const { container } = render(
      <PostProse
        items={OPENING}
        id="textul-articolului"
        lang="ro"
        data-slot="post-prose"
      />,
    );

    const stack = stackOf(container);
    expect(stack).toHaveAttribute('id', 'textul-articolului');
    expect(stack).toHaveAttribute('lang', 'ro');
    expect(stack).toHaveAttribute('data-slot', 'post-prose');
    for (const child of stack.children) {
      expect(child).not.toHaveAttribute('id');
      expect(child).not.toHaveAttribute('data-slot');
    }
  });

  it('keeps its own prop off the DOM — the items are content, never an attribute', () => {
    const { container } = renderProse();

    expect(stackOf(container).getAttributeNames()).toEqual(['class']);
  });

  it('accepts ref as a regular prop (React 19) — it is the stack', () => {
    const root = createRef<HTMLDivElement>();
    const { container } = renderProse({ ref: root });

    expect(root.current?.tagName).toBe('DIV');
    expect(root.current).toBe(stackOf(container));
  });

  it('owns no outer margin anywhere — gaps and the room inside the <h2> space it (§6.4)', () => {
    const { container } = renderProse();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)-?m[trblxyse]?-/);
      }
    }
  });

  it('sets no width and no measure of its own — the page decides (§6.4)', () => {
    const { container } = renderProse();

    for (const element of container.querySelectorAll('*')) {
      for (const token of tokensOf(element)) {
        expect(token).not.toMatch(/(^|:)(w|max-w|min-w)-/);
      }
    }
  });

  it('aligns its subheadings to `start` ON THE ELEMENT and nothing else — the paragraphs by the base tier’s fence (§15.15 b)', () => {
    const { container } = renderProse();

    for (const element of container.querySelectorAll('*')) {
      const alignment = tokensOf(element).filter((token) =>
        /(^|:)text-(left|right|center|start|end|justify)$/.test(token),
      );
      // A heading is display text, outside globals.css's p/li/blockquote
      // fence: a centring wrapper would reach it, so it says `start` itself
      // (PostProse.tsx's THE SUBHEADING). Nothing else here aligns.
      expect(alignment, `<${element.tagName.toLowerCase()}>`).toEqual(
        element.tagName === 'H2' ? ['text-start'] : [],
      );
    }
  });

  it('is never anything but a generic stack — a `role` that slips past the type is reset after the spread, and never leaves a region with its name stripped', () => {
    // The props type Omits `role` (the type pins below), so a WRITTEN one
    // fails `tsc` — the directive — while at runtime it rides the spread, and
    // the reset after it wins. Before the round-2 review a written
    // `role="region"` reached the DOM with its name stripped by the resets
    // beside it: an unnamed region, a landmark with no name (measured).
    const { container } = render(
      <PostProse
        items={OPENING}
        // @ts-expect-error — `role` is Omitted from the text's props
        role="region"
        aria-label="Textul articolului"
        data-slot="post-prose"
      />,
    );

    const stack = stackOf(container);
    expect(stack).not.toHaveAttribute('role');
    expect(stack).not.toHaveAttribute('aria-label');
    // Only the role and the name: the rest of the native surface still rides.
    expect(stack).toHaveAttribute('data-slot', 'post-prose');
    // …and the text keeps its own outline: the <h2>s, no landmark around them.
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(
      OPENING.filter((item) => item.kind === 'heading').length,
    );
  });

  it('is named by nothing — a written `aria-label` or `aria-labelledby` is reset after the spread', () => {
    // A <div> is a GENERIC element, which ARIA forbids to name (axe's
    // aria-prohibited-attr). The props type Omits both (the type pins
    // below), but TypeScript checks no hyphenated JSX attribute against a
    // props type that lacks it, so a written one still compiles — the reset
    // after the spread is the belt that holds (sections/PageHero's).
    const { container } = render(
      <PostProse
        items={OPENING}
        aria-label="Textul articolului"
        aria-labelledby="altundeva"
        data-slot="post-prose"
      />,
    );

    const stack = stackOf(container);
    expect(stack).not.toHaveAttribute('aria-label');
    expect(stack).not.toHaveAttribute('aria-labelledby');
    // Only the names: the rest of the native surface still rides.
    expect(stack).toHaveAttribute('data-slot', 'post-prose');
  });
});

describe('PostProse — zero islands, zero message keys, zero data', () => {
  it('ships NO client directive and calls no hook, no t() and no handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY the one atom it composes, lib/cx and lib/visible-text — and React’s types', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // import of ui/Container's band-scale strings would make the text a
    // second wearer of the page's scale (the page wears it — the build
    // contract's §2), and a data import would make it its own populator.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/lib/cx/cx',
      '@/lib/visible-text/visible-text',
      'react',
    ]);
    // lib/visible-text's three exports, by name: `hasVisibleText`, THE
    // REFUSALS' test of whether a text shows anything, `hasVisibleWord`,
    // their test of whether a subheading names something (round 2 of that
    // module's review), and `spelled`, their quoting. This pins the import
    // LINE alone; that no rule of the file's own stands beside them is the
    // refusals' tests' to prove — the Hangul filler's and the presentation
    // selector's rows, which a test of `trim()` and one of `[^\s\p{Cf}]` both
    // let through, and the subheading of marks alone.
    expect(CODE).toMatch(
      /^import \{\s*hasVisibleText,\s*hasVisibleWord,\s*spelled,\s*\} from '@\/lib\/visible-text\/visible-text';$/m,
    );
    expect(CODE).toMatch(
      /^import type \{ ComponentPropsWithRef, ReactElement \} from 'react';$/m,
    );
    expect(CODE).not.toMatch(/^import\s*['"]/m);
  });
});

describe('PostProse — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the property.
    expectTypeOf<PostProseItem>().toEqualTypeOf<
      | Readonly<{ kind: 'paragraph'; text: string }>
      | Readonly<{ kind: 'heading'; text: string }>
    >();
    expectTypeOf<PostProseItem['kind']>().toEqualTypeOf<
      'paragraph' | 'heading'
    >();
    expectTypeOf<PostProseProps['items']>().toEqualTypeOf<
      readonly PostProseItem[]
    >();
    // The content arrives as the items — nothing nested, no markup.
    expectTypeOf<PostProseProps>().not.toHaveProperty('children');
    expectTypeOf<PostProseProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    // Nor a role or a name for the generic <div>: pinned on the props TYPE,
    // because a written hyphenated attribute compiles whatever the type says
    // — the runtime reset holds that one (the §6 block above).
    expectTypeOf<PostProseProps>().not.toHaveProperty('role');
    expectTypeOf<PostProseProps>().not.toHaveProperty('aria-label');
    expectTypeOf<PostProseProps>().not.toHaveProperty('aria-labelledby');
    // A role and markup set beside the items fail `tsc`: built here, never
    // rendered.
    const refused = [
      <PostProse
        key="role"
        items={OPENING}
        // @ts-expect-error — a role is no prop of the text: it stays a generic stack
        role="region"
      />,
      <PostProse
        key="markup"
        items={OPENING}
        // @ts-expect-error — markup is no prop of the text: its content is the items
        dangerouslySetInnerHTML={{ __html: '' }}
      />,
    ];
    for (const element of refused) {
      expect(element.props).toHaveProperty('items', OPENING);
    }
    // The native <div> surface rides along, `ref` included (React 19).
    expectTypeOf<PostProseProps>().toHaveProperty('ref');
    expectTypeOf<PostProseProps>().toHaveProperty('id');
    expectTypeOf<PostProseProps>().toHaveProperty('aria-describedby');
    expectTypeOf<PostProseProps['className']>().toEqualTypeOf<
      string | undefined
    >();
  });
});
