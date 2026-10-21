import { createRef, type ReactElement, type ReactNode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
// The REAL stylesheet, for the blocks that read COMPUTED values — THE LABELS'
// STEP and THE LINE (a word's position, a control's box, the line's height).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (ClinicLocation, Card, StatNumber).
import '@/styles/globals.css';
import { Facebook } from '@/assets/glyphs/Facebook';
import { Link as LinkGlyph } from '@/assets/glyphs/Link';
import { Mail } from '@/assets/glyphs/Mail';
import { Whatsapp } from '@/assets/glyphs/Whatsapp';
import de from '@/messages/de.json';
import { shareHrefs } from '@/lib/share/share';
import coverSource from '../PostCover/PostCover.tsx?raw';
import * as island from './CopyLinkButton';
import copySource from './CopyLinkButton.tsx?raw';
import { CONTROL, FACE, WORD } from './ShareFace';
import faceSource from './ShareFace.tsx?raw';
import { ShareLinks, type ShareLinksProps } from './ShareLinks';
import source from './ShareLinks.tsx?raw';
import storiesSource from './ShareLinks.stories.tsx?raw';
import type { ServerRender } from './ShareLinks.worker.fixtures';
import { COPY_FEEDBACK_MS, STATUS_REFILL_MS } from './times';
import timesSource from './times.ts?raw';

// sections/ShareLinks — the row's suite. Role-based queries on purpose (§9,
// §13): a passing suite doubles as proof of accessible markup. Fixtures are
// the page's own Romanian words (ro.json's `blog.article.share.*`), and the
// three addresses are built the way the article route builds them, through
// lib/share, for the demo article's address on a stand-in domain. The copy
// control's behaviour has its own suite (CopyLinkButton.test.tsx); here it is
// a member of the list, and its answer a sentence on the row's status line.
//
// The utility TOKENS are the contract almost everywhere below (the repo's
// convention: a class name is what a component promises), and two blocks
// read the engine's answer on the real stylesheet — THE LABELS' STEP and THE
// LINE — because a container query's effect, a box's size and a line's height
// are computed values, not classes. Each control's glyph is read by its
// FINGERPRINT, the first path it draws (CopyLinkButton.test.tsx's idiom):
// until 2026-10-20 nothing here looked at which glyph a link wore, and every
// link wearing another's passed the suite (the React review). THE STAND-INS'
// PIN holds the cover row this file and the stories stand in for to
// sections/PostCover's own spelling, since 2026-10-21.

const ADDRESS = 'https://example.com/ro/blog/cum-iti-alegi-periuta-de-dinti/';
const TITLE = 'Cum îți alegi periuța de dinți';
/** What the share says around the address — ro.json's
 *  `blog.article.share.message` and `.subject` round the title. */
const MESSAGE = `Citește acest articol de la Premium Smile: ${TITLE}`;
const SUBJECT = `Un articol de la Premium Smile: ${TITLE}`;
const HREFS = shareHrefs(ADDRESS, { subject: SUBJECT, message: MESSAGE });

const PROPS: ShareLinksProps = {
  label: 'Distribuie articolul',
  facebook: {
    href: HREFS.facebook,
    label: 'Facebook',
    name: 'Facebook, distribuie articolul',
  },
  whatsapp: {
    href: HREFS.whatsapp,
    label: 'WhatsApp',
    name: 'WhatsApp, trimite articolul',
  },
  email: {
    href: HREFS.email,
    label: 'E-mail',
    name: 'E-mail, trimite articolul',
  },
  copy: {
    url: ADDRESS,
    label: 'Copiază linkul',
    copied: 'Link copiat',
    failed: 'Linkul nu a putut fi copiat',
  },
};

/** THE STAND-INS' classes: sections/PostCover's ROOT, ROW, TIME and SLOT,
 *  letter for letter — held to PostCover.tsx's own spelling, and the stories'
 *  copy to these, by THE STAND-INS' PIN below. One static string per box:
 *  Tailwind reads class names from source text. */
const COVER_ROOT = '@container flex flex-col gap-4';
const COVER_ROW = 'flex flex-wrap items-center justify-between gap-x-6 gap-y-2';
const COVER_TIME =
  'grid grid-rows-[minmax(min-content,min(100%,calc(var(--spacing)*11)))] items-center self-stretch';
const COVER_SLOT = 'ms-auto';

/** The first path a glyph draws, as markup prints it — its FINGERPRINT. */
const fingerprint = (glyph: ReactElement): string =>
  /<path d="([^"]+)"/.exec(renderToStaticMarkup(glyph))?.[1] ?? '';
const CHAIN = fingerprint(<LinkGlyph size="sm" />);

/** The fingerprint of the glyph a control shows now. */
const glyphOf = (control: Element): string | null | undefined =>
  control.querySelector('svg path')?.getAttribute('d');

/** The three links in the list's order, with the glyph each draws, the `rel`
 *  each must carry and what each hands its receiver — its query, decoded
 *  (lib/share's header): Facebook the address alone; WhatsApp the message, a
 *  line feed, the address; the e-mail the subject, and the message, a blank
 *  line (CR LF twice), the address. */
const LINKS = [
  {
    ...PROPS.facebook,
    glyph: fingerprint(<Facebook size="sm" />),
    rel: 'noreferrer',
    carries: [['u', ADDRESS]],
  },
  {
    ...PROPS.whatsapp,
    glyph: fingerprint(<Whatsapp size="sm" />),
    rel: 'noreferrer',
    carries: [['text', `${MESSAGE}\n${ADDRESS}`]],
  },
  {
    ...PROPS.email,
    glyph: fingerprint(<Mail size="sm" />),
    rel: null,
    carries: [
      ['subject', SUBJECT],
      ['body', `${MESSAGE}\r\n\r\n${ADDRESS}`],
    ],
  },
] as const;

const mount = (props: Partial<ShareLinksProps> = {}) =>
  render(<ShareLinks {...PROPS} {...props} />);

const list = () => screen.getByRole('list', { name: PROPS.label });

/** The row's root: the list's parent. */
const rootOf = (element: HTMLElement): HTMLElement => {
  const root = element.parentElement;
  if (!root) throw new Error('the list has no root');
  return root;
};

/** The class tokens an element wears — read from the attribute, because an
 *  SVG element's `className` is an SVGAnimatedString, not a string. */
const tokens = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** What a link hands its receiver: every field of its query, decoded, in order. */
const carried = (anchor: Element): [string, string][] => [
  ...new URL(anchor.getAttribute('href') ?? '').searchParams,
];

/** What the line SAYS: its text outside every `aria-hidden` node — the answer
 *  shown, never the ones it keeps for its height (CopyLinkButton.test.tsx). */
function said(element: Element): string {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? '';
    else if (
      node instanceof Element &&
      node.getAttribute('aria-hidden') !== 'true'
    ) {
      text += said(node);
    }
  }
  return text;
}

/** TS without its comments, in ONE left-to-right pass — the design-scale
 *  census's `tsCode` (tests/unit/blog-tags-sync.test.ts): string literals
 *  stepped over whole, a `//` comment consumed before a `/*` inside it can
 *  open a block. Until 2026-10-20 this file stripped every `/* … *\/` FIRST,
 *  so a `/*` written inside a `//` comment swallowed the code up to the next
 *  block's end (the TypeScript review). tests/unit/fixtures-fence.test.ts
 *  reads with the same pass since 2026-10-21. */
const code = (text: string): string =>
  text.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

/** The folder's runtime files, as text. */
const RUNTIME = [source, faceSource, copySource, timesSource];

/** Every way the folder's code could take a word out of the accessibility
 *  tree: the `hidden` utility under any variant, the `hidden` attribute or
 *  property (bare, or given a value), `display: none` — never `aria-hidden`,
 *  which the glyphs and the line's kept answers wear on purpose, nor a word
 *  that merely ends in -hidden. */
const UNSEEN = /(?<![-\w])hidden\b|display\s*:\s*['"]?none\b/;

/** Both of the copy's roads fail: the Clipboard API refuses and the textarea
 *  copies nothing — own properties shadowing the platform's, removed after
 *  each test. */
function failBothRoads(): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {
        throw new DOMException('Refuzat', 'NotAllowedError');
      },
    },
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: () => false,
  });
}

/** A Clipboard API that copies (a stub: the machine's clipboard untouched). */
function copyWorks(): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(document, 'execCommand');
  vi.useRealTimers();
});

describe('ShareLinks — one named list of four, and its line', () => {
  it('is a list named by `label`, its role written out for WebKit, with four items', () => {
    mount();
    const element = list();
    expect(element.tagName).toBe('UL');
    // Explicit, not implied: Safari drops list semantics from a <ul> styled
    // without bullets, which Tailwind's preflight does to every one.
    expect(element).toHaveAttribute('role', 'list');
    expect(within(element).getAllByRole('listitem')).toHaveLength(4);
  });

  it('orders the four as the owner listed them: Facebook, WhatsApp, e-mail, copy', () => {
    mount();
    const items = within(list()).getAllByRole('listitem');
    LINKS.forEach((link, index) => {
      expect(
        within(items[index] as HTMLElement).getByRole('link', {
          name: link.name,
        }),
      ).toBeInTheDocument();
    });
    expect(
      within(items[3] as HTMLElement).getByRole('button', {
        name: PROPS.copy.label,
      }),
    ).toBeInTheDocument();
  });

  it('prints ONE status line, empty, right after the list and outside it — a child of the row, never of an item', () => {
    mount();
    const status = screen.getByRole('status');
    expect(status.tagName).toBe('P');
    expect(status).toBeEmptyDOMElement();
    expect(list().nextElementSibling).toBe(status);
    expect(list()).not.toContainElement(status);
    expect([...rootOf(list()).children]).toEqual([list(), status]);
    // Its id is the one the island looks for (THE LINE): non-empty, unique.
    expect(status.id).not.toBe('');
    expect(document.querySelectorAll(`[id="${status.id}"]`)).toHaveLength(1);
  });

  it('dresses the line as body text, its words at the END and a wrapped sentence’s lines even, never wider than the controls above it', () => {
    mount();
    const status = screen.getByRole('status');
    // ui/Text's body step and ink, then THE LINE's three classes.
    expect(tokens(status)).toEqual([
      'text-base',
      'text-ink',
      'contain-inline-size',
      'text-end',
      'text-balance',
    ]);
  });

  it('gives two rows on one page two lines, each its own', () => {
    render(
      <>
        <ShareLinks {...PROPS} />
        <ShareLinks {...PROPS} />
      </>,
    );
    const [first, second] = screen.getAllByRole('status');
    expect(first?.id).not.toBe(second?.id);
  });

  it('fills ITS OWN line: a press in the second row answers on the second row’s line, and the first row’s stays empty', async () => {
    copyWorks();
    render(
      <>
        <ShareLinks {...PROPS} />
        <ShareLinks {...PROPS} />
      </>,
    );
    const [first, second] = screen.getAllByRole('status');
    const [, button] = screen.getAllByRole('button', {
      name: PROPS.copy.label,
    });
    if (!first || !second || !button) throw new Error('two rows are due');
    fireEvent.click(button);
    // The second row's line answers — never the first one in the page, which
    // an island looking for any status line would find first.
    await waitFor(() => expect(said(second)).toBe(PROPS.copy.copied));
    expect(first).toBeEmptyDOMElement();
  });

  it('refuses, by its type, what a generic root cannot take — a role, a name, markup (THE ROOT AND THE BELT)', () => {
    expectTypeOf<ShareLinksProps>().not.toHaveProperty('role');
    expectTypeOf<ShareLinksProps>().not.toHaveProperty('aria-label');
    expectTypeOf<ShareLinksProps>().not.toHaveProperty('aria-labelledby');
    expectTypeOf<ShareLinksProps>().not.toHaveProperty(
      'dangerouslySetInnerHTML',
    );
    // …and keeps the rest of the native surface: an id, a ref (§6.8).
    expectTypeOf<ShareLinksProps>().toHaveProperty('id');
    expectTypeOf<ShareLinksProps>().toHaveProperty('ref');
  });

  it('keeps the root nameless and the list its own name against naming attributes WRITTEN in JSX, which the type cannot refuse', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so these two compile although the props leave them out — the
    // reason the runtime belt stays.
    render(
      <ShareLinks
        {...PROPS}
        aria-label="Alt nume"
        aria-labelledby="alt-titlu"
      />,
    );
    const root = rootOf(list());
    expect(root).not.toHaveAttribute('aria-label');
    expect(root).not.toHaveAttribute('aria-labelledby');
    expect(list()).toHaveAttribute('aria-label', PROPS.label);
    expect(list()).not.toHaveAttribute('aria-labelledby');
  });

  it('keeps the root generic and the list a list against smuggled props (THE ROOT AND THE BELT)', () => {
    // The other road past the type: a spread of an object typed WIDER than
    // these props. TypeScript checks excess properties on object literals
    // alone, so whatever the wider object carries arrives — a role, a name.
    // The cast stands in for that object.
    const smuggled = {
      role: 'menu',
      'aria-label': 'Alt nume',
      'aria-labelledby': 'alt-titlu',
    } as unknown as Partial<ShareLinksProps>;
    mount(smuggled);
    const root = rootOf(list());
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    expect(root).not.toHaveAttribute('aria-labelledby');
    expect(list()).toHaveAttribute('role', 'list');
    expect(list()).toHaveAttribute('aria-label', PROPS.label);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('spreads native props onto the ROOT, merges its className there and takes `ref` as a prop (§6.8)', () => {
    const ref = createRef<HTMLDivElement>();
    mount({ className: 'ms-auto', id: 'distribuie', ref });
    const root = rootOf(list());
    expect(root.tagName).toBe('DIV');
    expect(tokens(root)).toEqual(['ms-auto']);
    expect(root).toHaveAttribute('id', 'distribuie');
    expect(ref.current).toBe(root);
    // The list keeps its own row, untouched by the caller's class.
    expect(tokens(list())).not.toContain('ms-auto');
  });

  it('owns its row and no outer margin (§6.4): the list its five tokens, the root none of its own', () => {
    mount();
    expect(tokens(list())).toEqual([
      'flex',
      'flex-wrap',
      'items-center',
      'justify-end',
      'gap-2',
    ]);
    expect(rootOf(list())).not.toHaveAttribute('class');
  });
});

describe('ShareLinks — the three links', () => {
  it('names each link by its sentence and sends it to the address the page built', () => {
    mount();
    for (const link of LINKS) {
      const anchor = screen.getByRole('link', { name: link.name });
      expect(anchor).toHaveAttribute('href', link.href);
      // …which hands its receiver exactly the page's words and the article's
      // address, and nothing else.
      expect(carried(anchor)).toEqual(link.carries);
    }
  });

  it('keeps every link in the same tab, `noreferrer` on the web two, no `rel` on the e-mail one', () => {
    mount();
    for (const link of LINKS) {
      const anchor = screen.getByRole('link', { name: link.name });
      expect(anchor).not.toHaveAttribute('target');
      if (link.rel === null) expect(anchor).not.toHaveAttribute('rel');
      else expect(anchor).toHaveAttribute('rel', link.rel);
    }
  });

  it('carries each visible word inside the accessible name (SC 2.5.3)', () => {
    mount();
    for (const link of LINKS) {
      const anchor = screen.getByRole('link', { name: link.name });
      expect(anchor).toHaveTextContent(link.label);
      expect(link.name.toLowerCase()).toContain(link.label.toLowerCase());
    }
  });

  it('dresses each link as ui/TextButton — the top bar menu button — on the anchor itself', () => {
    mount();
    for (const link of LINKS) {
      const anchor = screen.getByRole('link', { name: link.name });
      // asChild: the anchor IS the control; the atom's own look rides on it.
      expect(tokens(anchor)).toEqual(
        expect.arrayContaining([
          'text-ink',
          'hover:text-accent',
          'after:bg-accent',
          'min-h-11',
          CONTROL,
        ]),
      );
    }
  });

  it('draws each link’s OWN glyph — Facebook’s, WhatsApp’s, the envelope — and the copy button the chain', () => {
    // Three different drawings, so the check cannot pass on one glyph worn
    // three times, and none of them the copy button's.
    const drawings = LINKS.map((link) => link.glyph);
    expect(new Set([...drawings, CHAIN]).size).toBe(4);
    expect(drawings).not.toContain('');
    mount();
    for (const link of LINKS) {
      expect(glyphOf(screen.getByRole('link', { name: link.name }))).toBe(
        link.glyph,
      );
    }
    expect(
      glyphOf(screen.getByRole('button', { name: PROPS.copy.label })),
    ).toBe(CHAIN);
  });

  it('draws a decorative glyph that paints with the link’s own colour', () => {
    mount();
    for (const link of LINKS) {
      const glyph = screen
        .getByRole('link', { name: link.name })
        .querySelector('svg');
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
      expect(glyph).not.toHaveAttribute('aria-label');
      // `currentColor` alone: ink at rest, lavender on hover, with the word.
      expect(
        [glyph?.getAttribute('fill'), glyph?.getAttribute('stroke')].filter(
          (paint) => paint !== null && paint !== 'none',
        ),
      ).toEqual(['currentColor']);
      // ui's `sm` step, 1rem.
      expect(tokens(glyph as Element)).toContain('size-4');
    }
  });
});

describe('ShareLinks — the copy control', () => {
  it('is a real button in the fourth item, named by its word — its line beside the list, never in the item', () => {
    mount();
    const items = within(list()).getAllByRole('listitem');
    const fourth = items[3] as HTMLElement;
    const copy = within(fourth).getByRole('button', {
      name: PROPS.copy.label,
    });
    expect(copy).toHaveAttribute('type', 'button');
    expect(tokens(copy)).toContain(CONTROL);
    expect(within(fourth).queryByRole('status')).toBeNull();
  });

  it('fills THE LINE beside the list when pressed, and keeps its own word and name', async () => {
    copyWorks();
    mount();
    const copy = screen.getByRole('button', { name: PROPS.copy.label });
    fireEvent.click(copy);
    const status = screen.getByRole('status');
    await waitFor(() => expect(said(status)).toBe(PROPS.copy.copied));
    expect(copy).toHaveAccessibleName(PROPS.copy.label);
    expect(copy.textContent).toBe(PROPS.copy.label);
  });
});

describe('ShareLinks — the face and the word', () => {
  it('lays every control out as glyph + word in ONE shared face', () => {
    mount();
    for (const control of list().querySelectorAll('a, button')) {
      const face = control.firstElementChild as HTMLElement;
      expect(face.tagName).toBe('SPAN');
      expect(tokens(face)).toEqual(FACE.split(' '));
      expect(face.firstElementChild?.tagName.toLowerCase()).toBe('svg');
      expect(tokens(face.lastElementChild as Element)).toEqual(WORD.split(' '));
    }
  });

  it('hides a word the screen-reader-only way, never with display: none', () => {
    expect(WORD.split(' ')).toEqual(['sr-only', '@2xl:not-sr-only']);
    // Nothing in the folder's code takes a word out of the tree, in any of
    // the ways UNSEEN reads.
    for (const text of RUNTIME) {
      expect(code(text)).not.toMatch(UNSEEN);
    }
  });

  it('reads every way a word could leave the tree — and not the ways a word stays in it', () => {
    // UNSEEN's teeth (the TypeScript review, round 3): until 2026-10-21 the
    // check read a bare `hidden` between quotes or spaces alone, blind to a
    // variant before it, to the attribute given a value, and to the property.
    for (const taken of [
      "className='hidden'",
      "className='print:hidden'",
      "className='forced-colors:hidden'",
      '<span hidden>',
      '<span hidden={open}>',
      'word.hidden = true;',
      "style={{ display: 'none' }}",
    ]) {
      expect(taken, taken).toMatch(UNSEEN);
    }
    for (const kept of [
      '<span aria-hidden className={KEPT}>',
      "className='overflow-hidden'",
      "className='invisible'",
      "className='sr-only'",
    ]) {
      expect(kept, kept).not.toMatch(UNSEEN);
    }
  });

  it('declares NO container of its own — the words read the cover’s (load-bearing)', () => {
    for (const text of RUNTIME) {
      expect(code(text)).not.toContain('@container');
    }
    mount();
    const root = rootOf(list());
    for (const element of [root, ...root.querySelectorAll('*')]) {
      expect(tokens(element)).not.toContain('@container');
    }
  });

  it('imports no message file, no next-intl and no site data (a dumb piece, §8.1)', () => {
    for (const text of RUNTIME) {
      expect(code(text)).not.toMatch(/next-intl|@\/messages|@\/lib\/(?!cx\/)/);
    }
  });

  it('strips comments in ONE pass: a block opener inside a line comment hides no code', () => {
    // The stripper's teeth (the TypeScript review): a two-pass stripper —
    // blocks first — would eat `const kept` here up to the closing `*/`.
    const sample = [
      '// a note that names a /* block opener',
      "const kept = 'use client';",
      '/* a real block */',
      'const after = 1;',
    ].join('\n');
    expect(code(sample)).toContain("const kept = 'use client';");
    expect(code(sample)).toContain('const after = 1;');
    expect(code(sample)).not.toContain('a note');
    expect(code(sample)).not.toContain('a real block');
  });
});

describe('ShareLinks — one island, in one file (§16)', () => {
  /** A client directive on a line of its own — sections/PostCover's pin. */
  const DIRECTIVE = /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m;

  it('keeps ShareLinks.tsx, ShareFace.tsx and times.ts free of the client directive: they render on the server', () => {
    for (const text of [source, faceSource, timesSource]) {
      expect(code(text)).not.toMatch(DIRECTIVE);
    }
  });

  it('opens CopyLinkButton.tsx with it: that file is the island — and its module carries no value but its component', () => {
    expect(copySource.trimStart()).toMatch(/^['"]use client['"];/);
    // A value exported from a 'use client' file reaches a server importer as
    // a client reference (./times.ts's header): the island exports its
    // component, and types. Read off the MODULE itself, so every way of
    // exporting is seen — a declaration, an export list, a re-export, a
    // default (the React and TypeScript reviews, round 3: the source pattern
    // this replaced saw declarations alone); a type leaves no key.
    expect(Object.keys(island)).toEqual(['CopyLinkButton']);
  });
});

describe('ShareLinks — THE SERVER HTML', () => {
  it('prints the idle row: four controls, the copy button at rest with its one word, the line empty after the list', () => {
    const html = renderToStaticMarkup(<ShareLinks {...PROPS} />);
    const host = document.createElement('div');
    host.innerHTML = html;
    const root = host.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect([...root.children].map((child) => child.tagName)).toEqual([
      'UL',
      'P',
    ]);
    expect(host.querySelectorAll('li')).toHaveLength(4);
    expect(host.querySelectorAll('a[href]')).toHaveLength(3);
    const button = host.querySelector('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toBe(PROPS.copy.label);
    // A live region speaks what CHANGES in it: present from the start, empty
    // (SC 4.1.3).
    const status = host.querySelector('[role="status"]');
    expect(status?.tagName).toBe('P');
    expect(status?.innerHTML).toBe('');
    expect(status?.id).not.toBe('');
    // No answer anywhere in the HTML: the island says it from the first press.
    expect(html).not.toContain(PROPS.copy.copied);
    expect(html).not.toContain(PROPS.copy.failed);
  });

  it('hydrates the HTML a server renders — with NO window and NO document — without a mismatch, and fills ITS line from the first press', async () => {
    // THE SERVER PASS IN A WORKER (./ShareLinks.worker.fixtures.tsx): a
    // dedicated worker has no `window` and no `document`, as the static
    // export's Node has none, so a render that branched on either would print
    // there what the page's first render does not print, and hydrating it
    // below would fail — which a server pass rendered in this page, where
    // both exist, could never show (the React review, round 2). WHAT IT
    // CANNOT STAND FOR: the globals a worker HAS and Node lacks — `self`,
    // `location`, `requestAnimationFrame`, `navigator.onLine` (MEASURED,
    // 2026-10-21: all four in a Chromium 151 worker, none in Node 24) — so a
    // render branching on one of those prints here what the page prints and
    // passes, while the export's Node would print something else (the React
    // review, round 3); Node's own globals (`process`, `Buffer`), which the
    // worker lacks; Next's bundled React and its server-component renderer —
    // on the page this row arrives through React's Flight payload, the island
    // alone server-rendered as here; and the export's real bytes, which `next
    // build` and the e2e suite read.
    const worker = new Worker(
      new URL('./ShareLinks.worker.fixtures.tsx', import.meta.url),
      { type: 'module' },
    );
    const answer = await new Promise<ServerRender>((resolve, reject) => {
      worker.addEventListener('message', (event: MessageEvent<ServerRender>) =>
        resolve(event.data),
      );
      worker.addEventListener('error', (event) =>
        reject(new Error(`the server pass failed: ${event.message}`)),
      );
      worker.postMessage(PROPS);
    }).finally(() => worker.terminate());
    // The room had neither global, or this proves nothing.
    expect(answer.window).toBe('undefined');
    expect(answer.document).toBe('undefined');
    expect(answer.html).toMatch(/<p id="[^"]+" role="status"[^>]*><\/p>/);

    const host = document.createElement('div');
    host.innerHTML = answer.html;
    document.body.append(host);
    const recoverable = vi.fn();
    // React recovers from a mismatched TEXT and reports it here, but an
    // attribute that differs it only logs — so the console is listened to
    // as well (ui/Ribbon's idiom).
    const complaints = vi.spyOn(console, 'error');
    copyWorks();
    let root: Root | undefined;
    try {
      const serverLine = host.querySelector('[role="status"]');
      await act(async () => {
        root = hydrateRoot(host, <ShareLinks {...PROPS} />, {
          onRecoverableError: recoverable,
        });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(complaints).not.toHaveBeenCalled();
      // The very element the server printed, adopted — and the island's
      // portal fills it.
      expect(within(host).getByRole('status')).toBe(serverLine);
      fireEvent.click(
        within(host).getByRole('button', { name: PROPS.copy.label }),
      );
      await waitFor(() =>
        expect(said(serverLine as Element)).toBe(PROPS.copy.copied),
      );
      expect(complaints).not.toHaveBeenCalled();
    } finally {
      act(() => root?.unmount());
      host.remove();
      complaints.mockRestore();
    }
  });
});

describe('ShareLinks — THE LABELS’ STEP, on the real stylesheet', () => {
  /** The list inside a container of `width` CSS pixels — the cover's root. */
  const mountIn = (width: number) =>
    render(
      <div className="@container" style={{ width: `${width}px` }}>
        <ShareLinks {...PROPS} />
      </div>,
    );

  const controls = () => [...list().querySelectorAll<HTMLElement>('a, button')];
  const wordOf = (control: HTMLElement) =>
    control.querySelector(':scope > span > span') as HTMLElement;

  it('under 42rem: glyphs alone, every word screen-reader-only, every target 44 × 44', () => {
    mountIn(671);
    for (const control of controls()) {
      expect(getComputedStyle(wordOf(control)).position).toBe('absolute');
      const box = control.getBoundingClientRect();
      expect(box.width).toBeCloseTo(44, 0);
      expect(box.height).toBeCloseTo(44, 0);
    }
    // …and every control keeps its name, the copy button's from its word.
    for (const link of LINKS) {
      expect(screen.getByRole('link', { name: link.name })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('button', { name: PROPS.copy.label }),
    ).toBeInTheDocument();
  });

  it('from 42rem: every word shown beside its glyph, every target still at least 44 tall', () => {
    mountIn(672);
    for (const control of controls()) {
      const word = wordOf(control);
      expect(getComputedStyle(word).position).toBe('static');
      expect(word.getBoundingClientRect().width).toBeGreaterThan(1);
      const box = control.getBoundingClientRect();
      expect(box.width).toBeGreaterThan(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  it('with no container above it, keeps to the glyphs (the step needs one)', () => {
    render(<ShareLinks {...PROPS} />);
    for (const control of controls()) {
      expect(getComputedStyle(wordOf(control)).position).toBe('absolute');
    }
  });
});

describe('ShareLinks — THE STAND-INS’ PIN: the cover row, held to sections/PostCover', () => {
  /** The class strings a file spells as `const <prefix>NAME = '…';` — for
   *  NAME in ROOT, ROW, TIME, SLOT — read from its code. */
  const spelled = (text: string, prefix: string): Record<string, string> =>
    Object.fromEntries(
      [
        ...code(text).matchAll(
          new RegExp(
            `^const ${prefix}(ROOT|ROW|TIME|SLOT) =\\s*'([^']*)';`,
            'gm',
          ),
        ),
      ].map((match) => [match[1], match[2]]),
    );

  it('copies PostCover’s row letter for letter — ROOT, ROW, TIME, SLOT — here and in the stories', () => {
    // The stand-ins copy the cover's row so this folder can lay its row out
    // where the page does without importing another section's internals
    // (§4). Copies drift: until 2026-10-21 both still showed the row from
    // before PostCover's reading-time box, where a press moved the reading
    // time (the React and the accessibility reviews, round 3).
    const cover = spelled(coverSource, '');
    expect(Object.keys(cover).sort()).toEqual(['ROOT', 'ROW', 'SLOT', 'TIME']);
    expect({
      ROOT: COVER_ROOT,
      ROW: COVER_ROW,
      TIME: COVER_TIME,
      SLOT: COVER_SLOT,
    }).toEqual(cover);
    expect(spelled(storiesSource, 'COVER_')).toEqual(cover);
  });

  it('caps the reading time’s box at the controls’ own height step — KEEP-IN-SYNC, the two move together', () => {
    // PostCover's THE READING TIME'S BOX keeps the reading time level with
    // the controls by capping its one row track at their height; this
    // folder's THE HIT AREA names it back. Every control's height step must
    // be the cap's.
    const cap = /calc\(var\(--spacing\)\*(\d+)\)/.exec(COVER_TIME)?.[1];
    expect(cap).toBeDefined();
    mount();
    const controls = list().querySelectorAll('a, button');
    expect(controls).toHaveLength(4);
    for (const control of controls) {
      expect(tokens(control)).toContain(`min-h-${cap}`);
    }
  });
});

describe('ShareLinks — THE LINE, on the real stylesheet', () => {
  /** sections/PostCover's row, letter for letter (THE STAND-INS' PIN): the
   *  cover's root a container of `width` px, the reading time at the row's
   *  start in its own box, the row in a CONTENT-SIZED slot at its end — and a
   *  picture box under them, which only has to move when the row grows. */
  function CoverRow({
    width,
    children,
  }: Readonly<{ width: number; children: ReactNode }>): ReactElement {
    return (
      <div className={COVER_ROOT} style={{ width: `${width}px` }}>
        <div className={COVER_ROW}>
          <div className={COVER_TIME}>
            <p className="text-base text-ink-muted">4 min de citit</p>
          </div>
          <div className={COVER_SLOT}>{children}</div>
        </div>
        <div data-testid="picture" className="aspect-[3/2]" />
      </div>
    );
  }

  /** A rectangle as four numbers, for an exact comparison. */
  const four = ({ left, top, width, height }: DOMRect) => ({
    left,
    top,
    width,
    height,
  });

  /** A box as four numbers. */
  const boxOf = (element: Element) => four(element.getBoundingClientRect());

  /** Where an element's WORDS are: a Range around them, never its box —
   *  the reading time's box stretches to the row's line by design. */
  function wordsBox(element: Element): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  }

  /** The widths of the lines an element's words are laid in, top to bottom. */
  function lineWidths(element: Element): number[] {
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = new Map<number, { left: number; right: number }>();
    for (const rect of range.getClientRects()) {
      if (rect.width === 0) continue;
      const top = Math.round(rect.top);
      const line = lines.get(top);
      lines.set(top, {
        left: Math.min(line?.left ?? rect.left, rect.left),
        right: Math.max(line?.right ?? rect.right, rect.right),
      });
    }
    return [...lines.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, line]) => line.right - line.left);
  }

  /** A box's vertical middle. */
  const middle = (rect: DOMRect): number => rect.top + rect.height / 2;

  /** Every control's box, in the list's order. */
  const controlBoxes = () =>
    [...list().querySelectorAll('a, button')].map(boxOf);

  it('is 0px tall at rest: the row is the list alone, to the pixel', () => {
    render(
      <CoverRow width={351}>
        <ShareLinks {...PROPS} />
      </CoverRow>,
    );
    const root = rootOf(list());
    expect(screen.getByRole('status').getBoundingClientRect().height).toBe(0);
    expect(boxOf(root)).toEqual(boxOf(list()));
    // The glyphs alone at a phone's column, on the reading time's line.
    expect(boxOf(list())).toMatchObject({ width: 200, height: 44 });
  });

  it.each([
    ['a phone’s column (390)', 351, true],
    ['a 320 stress column', 273, false],
    ['a laptop’s column, the words shown', 1009, true],
  ])(
    'at %s a FAILED copy moves no control and not the reading time — the sentence on the line under them, inside the row — and the line keeps it',
    async (_case, width, oneLine) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      failBothRoads();
      render(
        <CoverRow width={width}>
          <ShareLinks {...PROPS} />
        </CoverRow>,
      );
      const time = screen.getByText('4 min de citit');
      // The premise: the row on the reading time's line, or under it.
      expect(list().getBoundingClientRect().top < wordsBox(time).bottom).toBe(
        oneLine,
      );
      /** On one line, the reading time's WORDS level with the controls. */
      const expectLevel = () => {
        if (!oneLine) return;
        expect(
          Math.abs(
            middle(wordsBox(time)) - middle(list().getBoundingClientRect()),
          ),
        ).toBeLessThan(1);
      };
      expectLevel();
      const before = controlBoxes();
      const timeBefore = four(wordsBox(time));
      const copy = screen.getByRole('button', { name: PROPS.copy.label });
      fireEvent.click(copy);
      await act(async () => {
        for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
      });
      act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
      const status = screen.getByRole('status');
      expect(said(status)).toBe(PROPS.copy.failed);

      // NO CONTROL MOVED — the box the visitor pressed is the copy button's —
      // and NOR DID THE READING TIME, level with them still (sections/
      // PostCover's THE READING TIME'S BOX; ShareLinks.tsx's THE ONE SHIFT).
      expect(controlBoxes()).toEqual(before);
      expect(four(wordsBox(time))).toEqual(timeBefore);
      expectLevel();
      // The sentence on the line: under the four controls, within the row's
      // width (it wraps there), at its end.
      const line = status.getBoundingClientRect();
      const row = rootOf(list()).getBoundingClientRect();
      const shown = (status.firstElementChild?.firstElementChild ??
        status) as HTMLElement;
      const ink = wordsBox(shown);
      expect(line.top).toBeGreaterThanOrEqual(
        list().getBoundingClientRect().bottom,
      );
      expect(line.height).toBeGreaterThan(0);
      expect(ink.left).toBeGreaterThanOrEqual(row.left - 0.5);
      expect(ink.right).toBeLessThanOrEqual(row.right + 0.5);
      expect(Math.abs(ink.right - row.right)).toBeLessThan(1);
      expect(row.width).toBeCloseTo(list().getBoundingClientRect().width, 3);

      // NOTHING MOVES LATER: long past the 5 seconds a failure once had, the
      // sentence and every box are as they were.
      const settled = {
        controls: controlBoxes(),
        time: four(wordsBox(time)),
        line: boxOf(status),
        picture: boxOf(screen.getByTestId('picture')),
      };
      act(() => vi.advanceTimersByTime(60_000));
      expect(said(status)).toBe(PROPS.copy.failed);
      expect({
        controls: controlBoxes(),
        time: four(wordsBox(time)),
        line: boxOf(status),
        picture: boxOf(screen.getByTestId('picture')),
      }).toEqual(settled);
    },
  );

  it('never widens the row (contain: inline-size): a sentence wider than the four glyphs wraps inside them, into even lines, with room for it kept under the button', async () => {
    failBothRoads();
    // German's failure, the widest of the five, against 200px of glyphs.
    const failed = de.blog.article.share.copyFailed;
    render(
      <CoverRow width={351}>
        <ShareLinks {...PROPS} copy={{ ...PROPS.copy, failed }} />
      </CoverRow>,
    );
    const status = screen.getByRole('status');
    const copy = screen.getByRole('button', { name: PROPS.copy.label });
    fireEvent.click(copy);
    await waitFor(() => expect(said(status)).toBe(failed));

    const row = rootOf(list()).getBoundingClientRect();
    expect(row.width).toBeCloseTo(200, 3);
    // Wider than the row on one line, so it wraps…
    const probe = document.createElement('span');
    probe.textContent = failed;
    probe.style.whiteSpace = 'nowrap';
    status.append(probe);
    const oneLine = probe.getBoundingClientRect().width;
    probe.remove();
    expect(oneLine).toBeGreaterThan(row.width);
    const shown = status.firstElementChild?.firstElementChild as HTMLElement;
    const balanced = lineWidths(shown);
    expect(balanced.length).toBeGreaterThan(1);
    // …into lines of EVEN length (`text-balance`): closer to one another than
    // the same sentence laid greedily in the same width.
    const greedy = document.createElement('span');
    greedy.textContent = failed;
    greedy.style.display = 'block';
    greedy.style.setProperty('text-wrap', 'wrap');
    status.append(greedy);
    const unbalanced = lineWidths(greedy);
    greedy.remove();
    const spread = (widths: number[]): number =>
      Math.max(...widths) - Math.min(...widths);
    expect(balanced).toHaveLength(unbalanced.length);
    expect(spread(balanced)).toBeLessThan(spread(unbalanced));
    // THE ROOM UNDER IT: when focus scrolls the copy button into view, its
    // scroll margin keeps the open line — German's two lines, the tallest —
    // clear under it (CopyLinkButton.tsx).
    expect(parseFloat(getComputedStyle(copy).scrollMarginBottom)).toBe(
      status.getBoundingClientRect().height,
    );
    // …and the row stays on the reading time's line, as at rest.
    const time = screen.getByText('4 min de citit').getBoundingClientRect();
    expect(list().getBoundingClientRect().left).toBeGreaterThan(time.right);
  });

  it('keeps its height once open: a success that clears leaves the line as tall as before — the tallest answer’s height', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    copyWorks();
    const failed = de.blog.article.share.copyFailed;
    render(
      <CoverRow width={351}>
        <ShareLinks {...PROPS} copy={{ ...PROPS.copy, failed }} />
      </CoverRow>,
    );
    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: PROPS.copy.label }));
    await act(async () => {
      for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
    });
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.copy.copied);
    const open = boxOf(status);
    const picture = boxOf(screen.getByTestId('picture'));
    // Two lines of German failure reserved under a one-line „Link copiat".
    const lineHeight = parseFloat(getComputedStyle(status).lineHeight);
    expect(open.height).toBeGreaterThanOrEqual(2 * lineHeight);

    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS));
    expect(said(status)).toBe('');
    expect(boxOf(status)).toEqual(open);
    expect(boxOf(screen.getByTestId('picture'))).toEqual(picture);
  });
});
