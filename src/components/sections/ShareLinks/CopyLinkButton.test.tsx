import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Check } from '@/assets/glyphs/Check';
import { Link as LinkGlyph } from '@/assets/glyphs/Link';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { CopyLinkButton, type CopyLinkButtonProps } from './CopyLinkButton';
import { CONTROL, WORD } from './ShareFace';
import { COPY_FEEDBACK_MS, STATUS_REFILL_MS } from './times';

// sections/ShareLinks/CopyLinkButton — the island's suite. It runs in the
// components project's real Chromium, so the button, the focus, the selection
// and the textarea are the platform's own — EXCEPT the three things a test
// must hold still, each stubbed per test and removed after it:
//   · the Clipboard API — an own `navigator.clipboard` shadowing the real one
//     (or `undefined`, the plain-http case), so no test ever touches the
//     machine's clipboard;
//   · `document.execCommand`, the older road's last step, for the same reason
//     and so a test can see what was selected at the moment of the copy;
//   · `window.isSecureContext`, where a test is about the plain-http case.
// THE PRESS'S OWN DOCUMENT has a block of its own: the button mounted in a
// same-origin frame, whose window's clipboard and document's `execCommand`
// are stubbed beside the page's, so a step that reached for the page's
// instead would be seen.
//
// THE LINE the island fills is ShareLinks' — a <p role="status"> printed
// empty beside the list. Here a bare one stands in for it, with the id the
// island is handed (`mount` below); ShareLinks.test.tsx holds the real row on
// the real stylesheet — its heights and widths — and the hydration of the
// server's HTML.
//
// ── TWO HARNESS FACTS THIS SUITE IS SHAPED BY (both measured, 2026-10-14):
//   · `userEvent.setup()` INSTALLS user-event's own clipboard stub over
//     `navigator.clipboard` (its setup does; the direct `userEvent.click`
//     does not). A test that stubbed first and set up second was silently
//     talking to user-event's stub — so every test here sets up FIRST and
//     stubs AFTER (`press` below does both, in that order).
//   · Testing Library's async helpers (findBy*, waitFor) end by draining
//     with a `setTimeout(0)`, which never fires under a faked setTimeout in
//     Vitest. So the tests of THE TIMES and THE REFILL — on Vitest's fake
//     clock, setTimeout and clearTimeout (and Date, where a test reads the
//     clock's own time) — never call them: they let the press's promise chain
//     finish inside act() (`settle`) instead. On the real clock, an answer
//     reaches the status line STATUS_REFILL_MS after the button, so those
//     tests wait for the line (`waitFor`).
//
// THE LINE KEEPS EVERY ANSWER in its one grid cell once open — invisible and
// `aria-hidden` — so its text CONTENT always holds both sentences, and
// jest-dom's `toHaveTextContent` would pass on either at any moment. What the
// line SAYS is read with `said` below: the text outside its hidden nodes, what
// a screen reader is given.
//
// The failure's and the copy's words are the page's in all five languages
// where THE TIMES are measured against their reading; every other fixture is
// the page's own Romanian (ro.json's `blog.article.share.*`) and the demo
// article's address on a stand-in domain.

/** The id the island is handed, and the stand-in line wears. */
const STATUS_ID = 'linia-de-stare';

const PROPS: CopyLinkButtonProps = {
  url: 'https://example.com/ro/blog/cum-iti-alegi-periuta-de-dinti/',
  label: 'Copiază linkul',
  copied: 'Link copiat',
  failed: 'Linkul nu a putut fi copiat',
  statusId: STATUS_ID,
};

/** A sentence of the article the visitor may have marked before pressing. */
const SENTENCE = 'Periuța cu peri moi curăță fără să rănească gingia.';

/** The first path a glyph draws, as markup prints it — a glyph's fingerprint. */
const firstPath = (markup: string): string =>
  /<path d="([^"]+)"/.exec(markup)?.[1] ?? '';
const TICK = firstPath(renderToStaticMarkup(<Check size="sm" />));
const CHAIN = firstPath(renderToStaticMarkup(<LinkGlyph size="sm" />));

/** The glyph the button shows now, by its fingerprint. */
const glyphOf = (button: HTMLElement): string | null | undefined =>
  button.querySelector('svg path')?.getAttribute('d');

/** The span that holds the button's word (./ShareFace.tsx's THE WORD). */
const wordOf = (button: HTMLElement): Element => {
  const word = button.querySelector(':scope > span > span');
  if (!word) throw new Error('the button has no word');
  return word;
};

/** The class tokens an element wears. */
const tokens = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** A node's kind by its `nodeType`, never by `instanceof`: a node of another
 *  window — THE PRESS'S OWN DOCUMENT's frame — is an instance of THAT
 *  window's classes, so `instanceof Element` is false for it here. */
const isElement = (node: Node | null): node is Element =>
  node?.nodeType === Node.ELEMENT_NODE;
const isText = (node: Node | null): node is Text =>
  node?.nodeType === Node.TEXT_NODE;

/** What the line SAYS: its text outside every `aria-hidden` node — the
 *  answer shown, never the ones it keeps for its height. */
function said(element: Element): string {
  let text = '';
  for (const node of element.childNodes) {
    if (isText(node)) text += node.data;
    else if (isElement(node) && node.getAttribute('aria-hidden') !== 'true') {
      text += said(node);
    }
  }
  return text;
}

/** The open line's one cell and what it holds (CopyLinkButton.tsx's THE
 *  STACK): the answer shown first, then the ones kept. */
function stackOf(status: HTMLElement): HTMLElement[] {
  const stack = status.firstElementChild;
  if (!stack) throw new Error('the line is not open');
  return [...stack.children] as HTMLElement[];
}

/** Where a selection's two ends are — anchor first: the order says its
 *  direction. */
const endsOf = (selection: Selection | null) => [
  selection?.anchorNode,
  selection?.anchorOffset,
  selection?.focusNode,
  selection?.focusOffset,
];

/** The text node of a paragraph holding SENTENCE, named. */
function textOf(paragraph: Element): Text {
  const text = paragraph.firstChild;
  if (!isText(text)) throw new Error('the sentence has no text');
  return text;
}

type WriteText = (text: string) => Promise<void>;

/** An own `navigator.clipboard` with this `writeText` — or none at all. */
function stubClipboard(writeText: WriteText | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText === undefined ? undefined : { writeText },
  });
}

/** An own `document.execCommand`, spied. */
function stubExecCommand(impl: (command: string) => boolean) {
  const spy = vi.fn(impl);
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: spy,
  });
  return spy;
}

/** A Clipboard API that refuses, as a browser does without permission. */
const refuse: WriteText = async () => {
  throw new DOMException('Refuzat', 'NotAllowedError');
};

/** A promise the test settles by hand. */
function deferred() {
  let resolve: () => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<void>((settle, fail) => {
    resolve = settle;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** The empty line ShareLinks prints beside its list — a stand-in, bare. */
const Line = () => <p id={STATUS_ID} role="status" />;

/** The button mounted beside its line: the button and the line. */
const mount = (props: Partial<CopyLinkButtonProps> = {}) => {
  const utils = render(
    <>
      <CopyLinkButton {...PROPS} {...props} />
      <Line />
    </>,
  );
  return {
    ...utils,
    button: screen.getByRole('button', { name: PROPS.label }),
    status: screen.getByRole('status'),
  };
};

/** The button mounted beside its line and another control, „Mai departe" —
 *  the place a visitor moves on to while the clipboard makes a press wait. */
const mountBesideAnother = () => {
  render(
    <>
      <CopyLinkButton {...PROPS} />
      <Line />
      <button type="button">Mai departe</button>
    </>,
  );
  return {
    button: screen.getByRole('button', { name: PROPS.label }),
    onward: screen.getByRole('button', { name: 'Mai departe' }),
    status: screen.getByRole('status'),
  };
};

/**
 * user-event set up FIRST, then this test's clipboard (THE HARNESS FACTS),
 * then the button mounted.
 */
function press(writeText: WriteText | undefined) {
  const user = userEvent.setup();
  stubClipboard(writeText);
  return { user, ...mount() };
}

/** Let a press's promise chain — a few awaits deep — finish inside act(). */
async function settle(): Promise<void> {
  await act(async () => {
    for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
  });
}

/** One turn of the real clock, for whatever a settled chain left queued. */
const nextTurn = (): Promise<void> =>
  new Promise((done) => {
    window.setTimeout(done, 0);
  });

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(document, 'execCommand');
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.getSelection()?.removeAllRanges();
});

describe('CopyLinkButton — at rest', () => {
  it('is a real button named by its word, with the link glyph — and leaves the line untouched and empty', () => {
    const { button, status } = mount();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(glyphOf(button)).toBe(CHAIN);
    // Its word answers the step: on screen from the container's 42rem only.
    expect(tokens(wordOf(button))).toEqual(WORD.split(' '));
    // No portal before a press: the line has no child at all.
    expect(status).toBeEmptyDOMElement();
  });

  it('keeps the open line’s room under it when focus scrolls it into view — the width floor and THE ROOM UNDER IT on the button', () => {
    const { button } = mount();
    // 14 spacing steps, the German failure's two lines (THE ROOM UNDER IT);
    // ShareLinks.test.tsx measures it against the open line itself.
    expect(tokens(button)).toEqual(
      expect.arrayContaining([CONTROL, 'scroll-mb-14']),
    );
  });

  it('prints the idle button and nothing else: its one word, no answer, no line of its own', () => {
    const html = renderToString(<CopyLinkButton {...PROPS} />);
    expect(html).toContain(PROPS.label);
    expect(html).not.toContain(PROPS.copied);
    expect(html).not.toContain(PROPS.failed);
    // The line is ShareLinks' to print; the island fills it from the first
    // press, through a portal the server renderer never meets.
    expect(html).not.toContain('role="status"');
    // (The hydration of the whole row — rendered where there is no window
    // and no document — is ShareLinks.test.tsx's THE SERVER HTML.)
  });
});

describe('CopyLinkButton — the Clipboard API (a secure context: the site)', () => {
  it('copies the address and says so — the tick at once, „Link copiat" on the line — with its word, its name and focus kept', async () => {
    vi.stubGlobal('isSecureContext', true);
    const writeText = vi.fn<WriteText>(async () => {});
    const { user, button, status } = press(writeText);
    const execCommand = stubExecCommand(() => true);

    await user.click(button);
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(PROPS.url);
    expect(execCommand).not.toHaveBeenCalled();
    expect(glyphOf(button)).toBe(TICK);
    expect(button).toHaveFocus();
    // The button is itself: its one word, its name, the step's class.
    expect(button).toHaveAccessibleName(PROPS.label);
    expect(button.textContent).toBe(PROPS.label);
    expect(tokens(wordOf(button))).toEqual(WORD.split(' '));
  });

  it('falls through to the textarea when the API refuses', async () => {
    vi.stubGlobal('isSecureContext', true);
    const { user, button, status } = press(refuse);
    const execCommand = stubExecCommand(() => true);

    await user.click(button);
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
    expect(execCommand).toHaveBeenCalledExactlyOnceWith('copy');
    expect(button).toHaveFocus();
  });

  it('hands focus back to whatever held it — not to the button — when the visitor moved on while the API waited', async () => {
    vi.stubGlobal('isSecureContext', true);
    const answer = deferred();
    const user = userEvent.setup();
    stubClipboard(() => answer.promise);
    let focusedAtCopy: Element | null = null;
    const execCommand = stubExecCommand(() => {
      focusedAtCopy = document.activeElement;
      return true;
    });
    const { button, onward, status } = mountBesideAnother();

    await user.click(button);
    // The press waits on the API, and the visitor moves on…
    onward.focus();
    // …then the API refuses, and the textarea copies after all.
    answer.reject(new DOMException('Refuzat', 'NotAllowedError'));
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));

    expect(execCommand).toHaveBeenCalledExactlyOnceWith('copy');
    expect(focusedAtCopy).toBeInstanceOf(HTMLTextAreaElement);
    expect(document.querySelector('textarea')).toBeNull();
    // Focus is where the visitor left it, never pulled back to the button.
    expect(onward).toHaveFocus();
  });
});

describe('CopyLinkButton — the textarea road (plain http, an old browser)', () => {
  it('selects the whole address in a read-only, off-screen textarea, copies, removes it and hands focus back', async () => {
    const { user, button, status } = press(undefined);
    let seen: Record<string, unknown> | undefined;
    stubExecCommand((command) => {
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement) {
        seen = {
          command,
          value: active.value,
          readOnly: active.readOnly,
          start: active.selectionStart,
          end: active.selectionEnd,
          position: active.style.position,
          left: active.style.left,
          fontSize: active.style.fontSize,
        };
      }
      return true;
    });

    await user.click(button);
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));

    expect(seen).toEqual({
      command: 'copy',
      value: PROPS.url,
      readOnly: true,
      start: 0,
      end: PROPS.url.length,
      position: 'fixed',
      left: '-9999px',
      fontSize: '12pt',
    });
    expect(document.querySelector('textarea')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('never asks the Clipboard API outside a secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    const writeText = vi.fn<WriteText>(async () => {});
    const { user, button, status } = press(writeText);
    const execCommand = stubExecCommand(() => true);

    await user.click(button);
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
    expect(writeText).not.toHaveBeenCalled();
    expect(execCommand).toHaveBeenCalledExactlyOnceWith('copy');
  });

  it.each<readonly [string, (command: string) => boolean, string]>([
    ['copies', () => true, PROPS.copied],
    ['reports nothing copied', () => false, PROPS.failed],
    [
      'throws',
      () => {
        throw new DOMException('Nesuportat', 'NotSupportedError');
      },
      PROPS.failed,
    ],
  ])(
    'puts the visitor’s own selection back WHOLE — a sentence marked from right to left keeps its direction — when the textarea %s',
    async (_case, impl, answer) => {
      render(
        <>
          <p data-testid="marked">{SENTENCE}</p>
          <CopyLinkButton {...PROPS} />
          <Line />
        </>,
      );
      stubClipboard(undefined);
      const execCommand = stubExecCommand(impl);
      const text = textOf(screen.getByTestId('marked'));
      const selection = document.getSelection();
      if (selection === null) throw new Error('the page has no selection');
      // Marked BACKWARDS, dragged from the sentence's end to its fifth
      // letter: the anchor at the end, the focus at the start.
      selection.setBaseAndExtent(text, text.length, text, 5);
      const before = selection.toString();
      expect(before.length).toBeGreaterThan(40);
      expect(endsOf(selection)).toEqual([text, text.length, text, 5]);

      // A press that touches no selection of its own (no pointer down), so
      // what changes it is the copy alone.
      fireEvent.click(screen.getByRole('button', { name: PROPS.label }));
      await waitFor(() =>
        expect(said(screen.getByRole('status'))).toBe(answer),
      );

      // The copy went the textarea's way — whose `select()` takes the
      // document's selection (the TypeScript review measured it lost, 46
      // characters → 0) — and, whatever the step did, the visitor has theirs
      // back: the same words, the same two ends, the same direction (put
      // back range for range, a backward selection came back forward — the
      // React review, round 3).
      expect(execCommand).toHaveBeenCalledExactlyOnceWith('copy');
      expect(document.getSelection()?.toString()).toBe(before);
      expect(endsOf(document.getSelection())).toEqual([
        text,
        text.length,
        text,
        5,
      ]);
    },
  );

  it('says it failed — never an error past the press — when the page refuses even the textarea', async () => {
    stubClipboard(undefined);
    const execCommand = stubExecCommand(() => true);
    const { button, status } = mount();
    // The page refuses the textarea itself: its placing throws.
    Object.defineProperty(document.body, 'append', {
      configurable: true,
      value: () => {
        throw new DOMException('Refuzat', 'HierarchyRequestError');
      },
    });
    try {
      fireEvent.click(button);
      await waitFor(() => expect(said(status)).toBe(PROPS.failed));
      expect(execCommand).not.toHaveBeenCalled();
      expect(document.querySelector('textarea')).toBeNull();
      expect(button).toHaveAccessibleName(PROPS.label);
    } finally {
      Reflect.deleteProperty(document.body, 'append');
    }
  });
});

describe('CopyLinkButton — when nothing can copy', () => {
  it.each([
    ['reports nothing copied', () => false],
    [
      'throws',
      () => {
        throw new DOMException('Nesuportat', 'NotSupportedError');
      },
    ],
  ])(
    'when the textarea road %s: the sentence on the line, the button itself — its chain, its word, its name — focus and page clean',
    async (_case, impl) => {
      const { user, button, status } = press(refuse);
      stubExecCommand(impl);

      await user.click(button);
      await waitFor(() => expect(said(status)).toBe(PROPS.failed));

      // The button does not change: no new glyph (a failure's own is the
      // owner's call), no new word, no new name.
      expect(glyphOf(button)).toBe(CHAIN);
      expect(button.textContent).toBe(PROPS.label);
      expect(button).toHaveAccessibleName(PROPS.label);
      expect(tokens(wordOf(button))).toEqual(WORD.split(' '));
      expect(button).toHaveFocus();
      expect(document.querySelector('textarea')).toBeNull();
    },
  );
});

describe('CopyLinkButton — THE NAME: one word, one name, in every state', () => {
  it('is „Copiază linkul" at rest, while „Link copiat" shows and while the failure shows — and its content is that word alone', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let ok = true;
    stubClipboard(async () => {
      if (!ok) throw new DOMException('Refuzat', 'NotAllowedError');
    });
    stubExecCommand(() => false);
    const { button, status } = mount();
    const states: string[] = [];
    const record = () => {
      states.push(`${said(status) || '—'} · ${button.textContent}`);
      expect(button).toHaveAccessibleName(PROPS.label);
      expect(button.textContent).toBe(PROPS.label);
    };

    record();
    fireEvent.click(button);
    await settle();
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    record();
    ok = false;
    fireEvent.click(button);
    await settle();
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    record();

    expect(states).toEqual([
      `— · ${PROPS.label}`,
      `${PROPS.copied} · ${PROPS.label}`,
      `${PROPS.failed} · ${PROPS.label}`,
    ]);
  });
});

describe('CopyLinkButton — THE LINE, through a portal', () => {
  it('opens the line at the FIRST PRESS, before any answer — its cell laid out, saying nothing yet', async () => {
    vi.stubGlobal('isSecureContext', true);
    const answer = deferred();
    stubClipboard(() => answer.promise);
    const { button, status } = mount();

    expect(status).toBeEmptyDOMElement();
    fireEvent.click(button);
    // The clipboard still waits, and the line is open: its height is taken
    // with the press (THE HEIGHT), its words wait for the answer.
    expect(status).not.toBeEmptyDOMElement();
    expect(said(status)).toBe('');
    answer.resolve();
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
  });

  it('keeps EVERY answer in the open line, stacked in its one cell, invisible and out of the accessibility tree', async () => {
    stubClipboard(async () => {});
    const { button, status } = mount();
    fireEvent.click(button);
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));

    const [shown, ...kept] = stackOf(status);
    expect(tokens(status.firstElementChild as Element)).toEqual([
      'grid',
      'pt-2',
    ]);
    expect(shown).toHaveTextContent(PROPS.copied);
    expect(shown).not.toHaveAttribute('aria-hidden');
    expect(tokens(shown as HTMLElement)).toEqual([
      'col-start-1',
      'row-start-1',
    ]);
    expect(kept.map((cell) => cell.textContent)).toEqual([
      PROPS.copied,
      PROPS.failed,
    ]);
    for (const cell of kept) {
      expect(cell).toHaveAttribute('aria-hidden', 'true');
      expect(tokens(cell)).toEqual(['col-start-1', 'row-start-1', 'invisible']);
    }
  });

  it('without its line — no element by its id — still copies and shows the tick, and in development says the line is missing', async () => {
    stubClipboard(async () => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<CopyLinkButton {...PROPS} statusId="nicio-linie" />);
      const button = screen.getByRole('button', { name: PROPS.label });

      fireEvent.click(button);
      await waitFor(() => expect(glyphOf(button)).toBe(TICK));
      expect(screen.queryByRole('status')).toBeNull();
      expect(button).toHaveAccessibleName(PROPS.label);
      // Not silent: the lookup that found nothing says so, by the id.
      expect(errors).toHaveBeenCalledWith(
        expect.stringContaining('no element has the id "nicio-linie"'),
      );
    } finally {
      errors.mockRestore();
    }
  });

  it('says so in development when the element by its id is not a status — and still shows the answer there', async () => {
    stubClipboard(async () => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <>
          <CopyLinkButton {...PROPS} />
          <p id={STATUS_ID} data-testid="not-a-status" />
        </>,
      );
      fireEvent.click(screen.getByRole('button', { name: PROPS.label }));
      const element = screen.getByTestId('not-a-status');
      await waitFor(() => expect(said(element)).toBe(PROPS.copied));
      expect(errors).toHaveBeenCalledWith(
        expect.stringContaining(`"${STATUS_ID}" is not role="status"`),
      );
    } finally {
      errors.mockRestore();
    }
  });

  it('looks its line up again when the one it found has left the page — and answers on the new one', async () => {
    stubClipboard(async () => {});
    const { rerender } = render(
      <>
        <CopyLinkButton {...PROPS} />
        <Line key="first" />
      </>,
    );
    const button = screen.getByRole('button', { name: PROPS.label });
    const first = screen.getByRole('status');
    fireEvent.click(button);
    await waitFor(() => expect(said(first)).toBe(PROPS.copied));

    // The row prints its line anew: the same id, another element.
    rerender(
      <>
        <CopyLinkButton {...PROPS} />
        <Line key="second" />
      </>,
    );
    const second = screen.getByRole('status');
    expect(second).not.toBe(first);
    expect(first.isConnected).toBe(false);

    fireEvent.click(button);
    await waitFor(() => expect(said(second)).toBe(PROPS.copied));
  });
});

describe('CopyLinkButton — THE PRESS’S OWN DOCUMENT (a same-origin frame)', () => {
  /** A same-origin frame, and the button mounted in ITS document, beside its
   *  line and a sentence the visitor marked there. */
  function mountInFrame() {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const page = frame.contentDocument;
    // Its document's window, typed with its classes (a frame's own
    // `contentWindow` is typed as a bare Window).
    const view = page?.defaultView;
    if (page === null || view === null || view === undefined) {
      throw new Error('the frame has no document');
    }
    const host = page.createElement('div');
    page.body.append(host);
    const utils = render(
      <>
        <p data-testid="marked">{SENTENCE}</p>
        <CopyLinkButton {...PROPS} />
        <Line />
      </>,
      { container: host },
    );
    return {
      frame,
      page,
      view,
      unmount: utils.unmount,
      button: utils.getByRole('button', { name: PROPS.label }),
      status: utils.getByRole('status'),
      sentence: utils.getByTestId('marked'),
    };
  }

  it('asks the frame’s Clipboard API — never the page’s — and answers on the frame’s line', async () => {
    const ours = vi.fn<WriteText>(async () => {});
    stubClipboard(ours);
    const { frame, view, button, status, unmount } = mountInFrame();
    try {
      const theirs = vi.fn<WriteText>(async () => {});
      Object.defineProperty(view.navigator, 'clipboard', {
        configurable: true,
        value: { writeText: theirs },
      });
      // The premise: the frame's window allows the API, as the page's does.
      expect(view.isSecureContext).toBe(true);

      fireEvent.click(button);
      await waitFor(() => expect(said(status)).toBe(PROPS.copied));
      expect(theirs).toHaveBeenCalledExactlyOnceWith(PROPS.url);
      expect(ours).not.toHaveBeenCalled();
      // The page itself has no line to fill.
      expect(document.querySelector('[role="status"]')).toBeNull();
    } finally {
      unmount();
      frame.remove();
    }
  });

  it('copies through a textarea in the frame’s document — its execCommand, its focus, its selection — never the page’s', async () => {
    const ours = stubExecCommand(() => true);
    const { frame, page, view, button, status, sentence, unmount } =
      mountInFrame();
    try {
      // The frame's window has no Clipboard API: the older road.
      Object.defineProperty(view.navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      });
      let copiedFrom: Element | null = null;
      const theirs = vi.fn((command: string) => {
        copiedFrom = page.activeElement;
        return command === 'copy';
      });
      Object.defineProperty(page, 'execCommand', {
        configurable: true,
        value: theirs,
      });
      const text = textOf(sentence);
      page.getSelection()?.setBaseAndExtent(text, text.length, text, 5);
      const focused = page.activeElement;

      fireEvent.click(button);
      await waitFor(() => expect(said(status)).toBe(PROPS.copied));
      expect(theirs).toHaveBeenCalledExactlyOnceWith('copy');
      expect(ours).not.toHaveBeenCalled();
      // The textarea was the frame's — an instance of ITS window's class —
      // and is gone from both documents.
      expect(copiedFrom).toBeInstanceOf(view.HTMLTextAreaElement);
      expect(page.querySelector('textarea')).toBeNull();
      expect(document.querySelector('textarea')).toBeNull();
      // Focus and the selection put back in the frame, as they were.
      expect(page.activeElement).toBe(focused);
      expect(endsOf(page.getSelection())).toEqual([text, text.length, text, 5]);
    } finally {
      unmount();
      frame.remove();
    }
  });
});

describe('CopyLinkButton — THE TIMES (Vitest’s fake setTimeout)', () => {
  it('copied: the tick at once, „Link copiat" from its landing STATUS_REFILL_MS later for exactly COPY_FEEDBACK_MS (2.5 s), then both go together — and the line STAYS OPEN', async () => {
    expect(COPY_FEEDBACK_MS).toBe(2_500);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    stubClipboard(async () => {});
    const { button, status } = mount();

    fireEvent.click(button);
    await settle();
    expect(glyphOf(button)).toBe(TICK);
    expect(said(status)).toBe('');

    // The words land after the refill…
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.copied);
    // …and stay their whole 2.5 seconds from there, the tick with them.
    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS - 1));
    expect(glyphOf(button)).toBe(TICK);
    expect(said(status)).toBe(PROPS.copied);
    act(() => vi.advanceTimersByTime(1));
    expect(glyphOf(button)).toBe(CHAIN);
    expect(said(status)).toBe('');
    // Cleared, never closed: the cell and the answers it keeps for the
    // line's height are still there (ShareLinks.test.tsx measures it).
    expect(stackOf(status)).toHaveLength(3);
    expect(button).toHaveAccessibleName(PROPS.label);
  });

  it('holds the words longer than the pause before them: COPY_FEEDBACK_MS outlasts STATUS_REFILL_MS', () => {
    expect(COPY_FEEDBACK_MS).toBeGreaterThan(STATUS_REFILL_MS);
  });

  it('failed: the sentence has NO clock — it stays until the next press, which empties the line at once', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    stubClipboard(refuse);
    stubExecCommand(() => false);
    const { button, status } = mount();

    fireEvent.click(button);
    await settle();
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.failed);
    // Nothing is scheduled to take it away…
    expect(vi.getTimerCount()).toBe(0);
    // …so a minute later it is still there, the button unchanged.
    act(() => vi.advanceTimersByTime(60_000));
    expect(said(status)).toBe(PROPS.failed);
    expect(glyphOf(button)).toBe(CHAIN);
    expect(button).toHaveAccessibleName(PROPS.label);

    // The next press empties it before its own answer (THE REFILL).
    fireEvent.click(button);
    expect(said(status)).toBe('');
    await settle();
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.failed);
  });

  it('keeps „Link copiat" on screen the whole of COPY_FEEDBACK_MS, measured from its landing to its leaving — the time to read it at 120 words a minute in all five languages, which the failure would not have', async () => {
    // The site's budget for an older reader (sections/Hero's reading-time
    // rider): 120 words a minute, half a second a word.
    const readingMs = (sentence: string): number =>
      sentence.trim().split(/\s+/).length * 500;
    // Date faked as well: the clock's own time says when the words come and
    // go.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    stubClipboard(async () => {});
    const pages = [ro, en, de, fr, it_];
    for (const page of pages) {
      const word = page.blog.article.share.copied;
      const { button, status, unmount } = mount({ copied: word });
      fireEvent.click(button);
      await settle();

      // The answer is in: step from timer to timer, noting when the words
      // land on the line and when they leave it.
      const answered = Date.now();
      let landed: number | undefined;
      let left: number | undefined;
      while (left === undefined && vi.getTimerCount() > 0) {
        act(() => {
          vi.advanceTimersToNextTimer();
        });
        const at = Date.now() - answered;
        if (landed === undefined && said(status) === word) landed = at;
        else if (landed !== undefined && said(status) === '') left = at;
      }
      expect(landed, page.blog.article.share.copy).toBe(STATUS_REFILL_MS);
      expect(left, page.blog.article.share.copy).toBeDefined();
      const shown = (left ?? Number.NaN) - (landed ?? Number.NaN);
      expect(shown).toBe(COPY_FEEDBACK_MS);
      expect(readingMs(word)).toBeLessThanOrEqual(shown);
      unmount();
    }
    // A failure takes longer to read than a copy's clock gives — one reason
    // it keeps no clock at all (THE TIMES).
    const failures = pages.map((page) => page.blog.article.share.copyFailed);
    expect(Math.max(...failures.map(readingMs))).toBeGreaterThan(
      COPY_FEEDBACK_MS,
    );
  });

  it('runs each time from its own answer: a new press’s answer brings a new one', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const answers = [deferred(), deferred()];
    let call = 0;
    stubClipboard(() => answers[call++]?.promise ?? Promise.resolve());
    const { button, status } = mount();

    fireEvent.click(button);
    answers[0]?.resolve();
    await settle();
    act(() => vi.advanceTimersByTime(2_000));
    expect(said(status)).toBe(PROPS.copied);

    // The second press: the line empties at once, while the tick stays
    // until the answer comes.
    fireEvent.click(button);
    expect(said(status)).toBe('');
    expect(glyphOf(button)).toBe(TICK);
    answers[1]?.resolve();
    await settle();

    // The first answer's time would end 650 ms after the second press; the
    // second's runs from its own answer, past its own refill.
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS + COPY_FEEDBACK_MS - 1));
    expect(glyphOf(button)).toBe(TICK);
    expect(said(status)).toBe(PROPS.copied);
    act(() => vi.advanceTimersByTime(1));
    expect(glyphOf(button)).toBe(CHAIN);
    expect(said(status)).toBe('');
  });

  it('keeps the tick for the rest of its own time while a new press waits', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const answers = [deferred(), deferred()];
    let call = 0;
    stubClipboard(() => answers[call++]?.promise ?? Promise.resolve());
    const { button, status } = mount();

    fireEvent.click(button);
    answers[0]?.resolve();
    await settle();
    act(() => vi.advanceTimersByTime(1_000));

    // A second press the clipboard keeps waiting: the line empties at once,
    // the first answer's tick leaves on its own time, and the button rests
    // until the second answers.
    fireEvent.click(button);
    expect(said(status)).toBe('');
    act(() =>
      vi.advanceTimersByTime(STATUS_REFILL_MS + COPY_FEEDBACK_MS - 1_000 - 1),
    );
    expect(glyphOf(button)).toBe(TICK);
    act(() => vi.advanceTimersByTime(1));
    expect(glyphOf(button)).toBe(CHAIN);
    expect(said(status)).toBe('');

    answers[1]?.resolve();
    await settle();
    expect(glyphOf(button)).toBe(TICK);
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.copied);
  });

  it('clears its timers when it unmounts — a copy owes two, a failure one', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    stubClipboard(async () => {});
    const { button, unmount } = mount();

    fireEvent.click(button);
    await settle();
    // The line's refill and the way back to rest.
    expect(vi.getTimerCount()).toBe(2);
    unmount();
    expect(vi.getTimerCount()).toBe(0);

    stubClipboard(refuse);
    stubExecCommand(() => false);
    const again = mount();
    fireEvent.click(again.button);
    await settle();
    // The refill alone: a failure has no way back of its own (THE TIMES).
    expect(vi.getTimerCount()).toBe(1);
    again.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CopyLinkButton — THE REFILL (Vitest’s fake setTimeout)', () => {
  it('speaks every answer STATUS_REFILL_MS after showing it, so a second press with the same answer is heard again', async () => {
    expect(STATUS_REFILL_MS).toBe(150);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    stubClipboard(async () => {});
    const { button, status } = mount();

    fireEvent.click(button);
    await settle();
    // The button shows the tick at once; the line waits.
    expect(glyphOf(button)).toBe(TICK);
    expect(said(status)).toBe('');
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS - 1));
    expect(said(status)).toBe('');
    act(() => vi.advanceTimersByTime(1));
    expect(said(status)).toBe(PROPS.copied);

    // The same answer again: the press empties the line, and the answer —
    // the same sentence — fills it only after the pause, so the line was
    // empty in between, a change a screen reader announces.
    act(() => vi.advanceTimersByTime(1_000));
    fireEvent.click(button);
    expect(said(status)).toBe('');
    await settle();
    expect(said(status)).toBe('');
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS - 1));
    expect(said(status)).toBe('');
    act(() => vi.advanceTimersByTime(1));
    expect(said(status)).toBe(PROPS.copied);
  });

  it('cancels a refill the last answer still owed when a new press comes first', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const answers = [deferred(), deferred()];
    let call = 0;
    stubClipboard(() => answers[call++]?.promise ?? Promise.resolve());
    const { button, status } = mount();

    fireEvent.click(button);
    answers[0]?.resolve();
    await settle();
    // A second press inside the pause: the first answer is never spoken now…
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe('');
    // …and the second is, after its own.
    answers[1]?.resolve();
    await settle();
    act(() => vi.advanceTimersByTime(STATUS_REFILL_MS));
    expect(said(status)).toBe(PROPS.copied);
  });
});

describe('CopyLinkButton — THE LATEST PRESS', () => {
  it('ignores an answer that arrives after a later press — and never runs its textarea, nor moves focus', async () => {
    vi.stubGlobal('isSecureContext', true);
    const answers = [deferred(), deferred()];
    let call = 0;
    stubClipboard(() => answers[call++]?.promise ?? Promise.resolve());
    const execCommand = stubExecCommand(() => false);
    const { button, onward, status } = mountBesideAnother();

    fireEvent.click(button);
    fireEvent.click(button);
    answers[1]?.resolve();
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
    onward.focus();

    // The first press now fails — late. Nobody listens, and the page is
    // left alone: no textarea, no copy, focus where the visitor put it.
    answers[0]?.reject(new DOMException('Refuzat', 'NotAllowedError'));
    await settle();
    await nextTurn();
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.querySelector('textarea')).toBeNull();
    expect(onward).toHaveFocus();
    expect(glyphOf(button)).toBe(TICK);
    expect(said(status)).toBe(PROPS.copied);
  });

  it('counts unmounting as a later press: a refusal that arrives after it runs no textarea', async () => {
    vi.stubGlobal('isSecureContext', true);
    const answer = deferred();
    stubClipboard(() => answer.promise);
    const execCommand = stubExecCommand(() => true);
    const { button, unmount } = mount();

    fireEvent.click(button);
    unmount();
    answer.reject(new DOMException('Refuzat', 'NotAllowedError'));
    await settle();
    await nextTurn();
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.querySelector('textarea')).toBeNull();
  });
});

describe('CopyLinkButton — the keyboard', () => {
  it('copies on Enter and on Space, and focus never leaves the button', async () => {
    const writeText = vi.fn<WriteText>(async () => {});
    const { user, button, status } = press(writeText);

    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(button).toHaveFocus();

    await user.keyboard(' ');
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(said(status)).toBe(PROPS.copied));
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName(PROPS.label);
  });
});
