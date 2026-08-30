import { createRef, StrictMode, useRef, useState } from 'react';
import type { ReactElement, ReactNode, RefObject } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses.
// Two suites below are meaningless without it: the scrolling region only
// overflows when `h-[28rem]` is real, and the focus ring's inset offset is a
// computed style, not a class name. Everything else behaves identically.
import '@/styles/globals.css';
import {
  Modal,
  type ModalHeight,
  type ModalProps,
  type ModalWidth,
} from './Modal';

// Role-based queries on purpose (§3, §9): a passing test doubles as proof of
// accessible markup — `getByRole('dialog', { name })` only finds a dialog the
// platform actually names. Fixtures are Romanian with diacritics (§15.7).
//
// TWO event sources, deliberately:
//  · `userEvent` from vitest/browser drives the REAL browser (Playwright/CDP),
//    so its events are TRUSTED — the only kind that triggers <dialog>'s native
//    behaviour. A synthetic Escape from @testing-library/user-event does NOT
//    close a dialog (untrusted events run no default action), which would make
//    the Esc suite below silently vacuous.
//  · `fireEvent` is used for the backdrop presses only, because those need
//    exact clientX/clientY OUTSIDE the panel's rectangle — a place a real mouse
//    cannot click in a test without knowing the layout first.
//
// The native `close` event is QUEUED, not synchronous (HTML spec: close() queues
// an element task), so every close path is followed by `flush()` before the
// "exactly once" assertion — the double-fire the D11 guard prevents would
// otherwise land after the test ended.

const TITLE_ID = 'modal-title';
const TITLE = 'Programează o consultație';
const BODY =
  'Ședința de igienizare durează 45 de minute. Țineți cont de programul afișat și sunați înainte, cu câteva zile în avans, pentru informații și programări.';
const ADDRESS = 'Strada Exemplu nr. 1, București.';
const TRIGGER = 'Deschide modalul';
const CLOSE_LABEL = 'Închide';

const noop = () => {};

// Chromium dispatches <dialog>'s `close` event on the next RENDERING frame,
// not on the next macrotask: a pair of setTimeout(0)s returns before it and
// leaves every "exactly once" assertion powerless (G2 finding). One frame, then
// one task, reaches it.
const flush = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  );

// The consumer shape in miniature (D11/D15): the PARENT owns the switch, the
// modal only reports "the user wants out". Every close path below therefore
// runs the real round trip — onClose → setOpen(false) → the effect's close().
type HostProps = {
  initialOpen?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  children?: ReactNode;
  closeLabel?: string;
  width?: ModalWidth;
  height?: ModalHeight;
  dimBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  scrollable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  decoy?: boolean;
};

function Host({
  initialOpen = true,
  onClose,
  header = <h2 id={TITLE_ID}>{TITLE}</h2>,
  children = <p>{BODY}</p>,
  closeLabel = CLOSE_LABEL,
  width,
  height,
  dimBackdrop,
  closeOnBackdropClick,
  scrollable,
  initialFocusRef,
  decoy = false,
}: HostProps): ReactElement {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {TRIGGER}
      </button>
      <Modal
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        aria-labelledby={TITLE_ID}
        closeLabel={closeLabel}
        header={header}
        width={width}
        height={height}
        dimBackdrop={dimBackdrop}
        closeOnBackdropClick={closeOnBackdropClick}
        scrollable={scrollable}
        initialFocusRef={initialFocusRef}
      >
        {children}
      </Modal>
      {/* D13's decoy: a LATER sibling, fixed over the whole viewport, with the
          highest z-index anyone would ever type. The top layer ignores it. */}
      {decoy ? (
        <div
          data-testid="decoy"
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
        />
      ) : null}
    </>
  );
}

const openDialog = (): HTMLDialogElement =>
  screen.getByRole('dialog') as HTMLDialogElement;

const closeButton = (name: string = CLOSE_LABEL): HTMLElement =>
  screen.getByRole('button', { name });

/**
 * THE BOX — the white panel, the layer's ONLY child (D17). Every size step,
 * the caller's className and the cap live here now; the <dialog> above it is a
 * transparent full-viewport LAYER.
 */
const panelBox = (): HTMLElement =>
  openDialog().firstElementChild as HTMLElement;

/** The top bar = the box's first child. */
const topBar = (): HTMLElement => panelBox().children[0] as HTMLElement;

/** The body container = the box's second child. */
const contentRegion = (): HTMLElement => panelBox().children[1] as HTMLElement;

/** Content that genuinely overflows a fixed-height panel (~3 screens). */
const LongBody = (): ReactElement => (
  <div>
    {Array.from({ length: 12 }, (_, index) => (
      <p key={index}>{BODY}</p>
    ))}
  </div>
);

/**
 * A press that starts AND ends on the LAYER (D19): the event's target IS the
 * <dialog>. With the layer/box split there is no rectangle arithmetic left —
 * everything the visitor can press outside the white box is the layer itself,
 * and everything inside it has a different target. The coordinates are the
 * layer's own padding strip, so the picture matches the geometry.
 */
const pressLayer = (dialog: HTMLDialogElement) => {
  const point = { clientX: 8, clientY: 8 };
  fireEvent.pointerDown(dialog, point);
  fireEvent.click(dialog, point);
};

/** The same gesture aimed at the white box — a press INSIDE the panel. */
const pressBox = (box: HTMLElement) => {
  const rect = box.getBoundingClientRect();
  const point = {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
  fireEvent.pointerDown(box, point);
  fireEvent.click(box, point);
};

const centerOf = (dialog: HTMLDialogElement) => {
  const rect = dialog.getBoundingClientRect();
  return {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
};

// Test environment, not product styling: unlayered author CSS beats Tailwind's
// @layer utilities without !important; the fade is a visual concern verified in
// the compiled CSS and disabled in every snapshot (§13) — a unit test must
// never depend on where a 200 ms transition currently is.
// (Concretely: the panel opens from @starting-style opacity 0, and one frame
// later it is ~0.012 — enough for jest-dom's toBeVisible locally, not on a
// jittery CI frame. Removing the clock removes the flake at its cause.)
let stillnessStyle: HTMLStyleElement | null = null;

beforeAll(() => {
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent = 'dialog, dialog::backdrop { transition: none; }';
  document.head.append(stillnessStyle);
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
});

afterEach(() => {
  // A leaked lock would silently poison every later test in this file.
  document.documentElement.style.overflow = '';
  // …and so would a leaked prototype spy (the identity-change test below).
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// The compile-time half of the contract (§3). `accepts` type-checks a props
// object and nothing else; each @ts-expect-error FAILS the build the day the
// line below it becomes legal — which is the whole point of putting the rules
// in the types instead of in a review checklist.
const accepts = (props: ModalProps): ModalProps => props;

const missingCloseLabel = {
  open: true,
  onClose: noop,
  'aria-label': 'Contact',
  children: 'Conținut',
};
const bothNames = {
  open: true,
  onClose: noop,
  closeLabel: CLOSE_LABEL,
  'aria-label': 'Contact',
  'aria-labelledby': TITLE_ID,
  children: 'Conținut',
};
const noName = {
  open: true,
  onClose: noop,
  closeLabel: CLOSE_LABEL,
  children: 'Conținut',
};

// @ts-expect-error — closeLabel is REQUIRED, no default (D10 → B).
accepts(missingCloseLabel);
// @ts-expect-error — exactly ONE of aria-label / aria-labelledby (§6.3).
accepts(bothNames);
// @ts-expect-error — a nameless dialog cannot compile (§6.3).
accepts(noName);
accepts({
  open: true,
  onClose: noop,
  closeLabel: CLOSE_LABEL,
  'aria-label': 'Contact',
  children: 'Conținut',
  // @ts-expect-error — `closedby` would hand the platform its own dismissal
  // path and make closeOnBackdropClick={false} a lie (D11).
  closedby: 'any',
});
// ─────────────────────────────────────────────────────────────────────────────

describe('Modal — the dialog and its name', () => {
  it('renders a real <dialog> named by the consumer heading (aria-labelledby)', () => {
    render(<Host />);
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInstanceOf(
      HTMLDialogElement,
    );
  });

  it('names the headingless case with aria-label instead', () => {
    render(
      <Modal open onClose={noop} closeLabel={CLOSE_LABEL} aria-label="Contact">
        <p>{ADDRESS}</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Contact' })).toBeInTheDocument();
  });

  it('exposes NO dialog while closed, yet keeps the children mounted (D8)', () => {
    render(<Host initialOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByText(BODY)).not.toBeVisible();
  });

  it('opens as a MODAL, not as a plain popup (showModal, not show)', () => {
    render(<Host />);
    expect(openDialog().matches(':modal')).toBe(true);
  });

  it('documents its type contract at compile time (see the accepts() block)', () => {
    expect(typeof accepts).toBe('function');
  });
});

describe('Modal — the ✕', () => {
  it('speaks the closeLabel it was given', () => {
    render(<Host />);
    expect(closeButton()).toBeInTheDocument();
  });

  it('speaks the DE label when the consumer passes one (nothing Romanian inside)', () => {
    render(<Host closeLabel="Schließen" />);
    expect(closeButton('Schließen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CLOSE_LABEL })).toBeNull();
  });

  it('is a 44px touch target (§9) — GlyphButton ghost/square/md', () => {
    render(<Host />);
    expect(closeButton()).toHaveClass(
      'size-11',
      'rounded-md',
      'bg-transparent',
    );
  });

  it('calls onClose EXACTLY ONCE per press (the D11 guard)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    await userEvent.click(closeButton());
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Modal — Escape (never optional)', () => {
  it('closes on a real Escape, once', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('still closes when backdrop dismissal is switched OFF', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} closeOnBackdropClick={false} />);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal — the backdrop press (D11, retargeted by D19)', () => {
  it('closes when the press starts and ends on the layer', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    pressLayer(openDialog());
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores the same press when closeOnBackdropClick is false', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} closeOnBackdropClick={false} />);
    pressLayer(openDialog());
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a press on the BOX — its subtree is not the layer (D19)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    pressBox(panelBox());
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a press on the box even at coordinates over the layer', async () => {
    // The rectangle no longer decides anything: an event aimed at the box is
    // inside the panel however its clientX/clientY read (a keyboard Enter on a
    // control inside reports 0,0 — the case that broke the old geometry).
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const box = panelBox();
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.click(box, { clientX: 0, clientY: 0 });
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a drag that STARTS inside and ends outside (text selection)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dialog = openDialog();
    fireEvent.pointerDown(panelBox(), centerOf(dialog));
    fireEvent.click(dialog, { clientX: 8, clientY: 8 });
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a drag that starts OUTSIDE and ends inside', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dialog = openDialog();
    fireEvent.pointerDown(dialog, { clientX: 8, clientY: 8 });
    fireEvent.click(panelBox(), centerOf(dialog));
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('never reads a click on a CHILD as a backdrop press (keyboard Enter sends 0,0)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal — the parent closing it itself', () => {
  it('adds NO onClose call when the parent simply flips `open` to false', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal
        open
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-labelledby={TITLE_ID}
        header={<h2 id={TITLE_ID}>{TITLE}</h2>}
      >
        <p>{BODY}</p>
      </Modal>,
    );
    rerender(
      <Modal
        open={false}
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-labelledby={TITLE_ID}
        header={<h2 id={TITLE_ID}>{TITLE}</h2>}
      >
        <p>{BODY}</p>
      </Modal>,
    );
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Modal — focus (D3 → C)', () => {
  it('focuses the dialog itself on open: the name is announced, no ring glows', () => {
    render(<Host />);
    expect(document.activeElement).toBe(openDialog());
  });

  it('focuses the consumer target when initialFocusRef is given', () => {
    function PhoneFirst(): ReactElement {
      const phoneRef = useRef<HTMLAnchorElement>(null);
      return (
        <Host initialFocusRef={phoneRef}>
          <a ref={phoneRef} href="tel:+40712345678">
            Sună acum
          </a>
        </Host>
      );
    }
    render(<PhoneFirst />);
    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: 'Sună acum' }),
    );
  });

  it('lands the first Tab on the header slot control when there is one', async () => {
    render(
      <Host
        header={
          <>
            <h2 id={TITLE_ID}>{TITLE}</h2>
            <button type="button">Copiază numărul</button>
          </>
        }
      />,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Copiază numărul' }),
    );
  });

  it('lands the first Tab on the ✕ when the header slot holds no control', async () => {
    render(<Host />);
    await userEvent.tab();
    expect(document.activeElement).toBe(closeButton());
  });

  it('returns focus to the trigger after closing', async () => {
    render(<Host initialOpen={false} />);
    const trigger = screen.getByRole('button', { name: TRIGGER });
    await userEvent.click(trigger);
    await flush();
    expect(document.activeElement).toBe(openDialog());
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Modal — the scroll lock (D7)', () => {
  it('freezes the document while open and restores it on close', async () => {
    const root = document.documentElement;
    expect(root.style.overflow).toBe('');
    render(<Host />);
    expect(root.style.overflow).toBe('hidden');
    await userEvent.click(closeButton());
    await flush();
    expect(root.style.overflow).toBe('');
  });

  it('takes no lock at all while closed', () => {
    render(<Host initialOpen={false} />);
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('Modal — the size steps', () => {
  // The steps moved from the <dialog> to the BOX (D17) and lost their `-2rem`
  // with it: 100% is now the LAYER's content box — the viewport minus the
  // layer's own `p-4` — so `min(100%,32rem)` computes the pixels
  // `min(100% - 2rem, 32rem)` computed against the viewport before it.
  const widthClasses: Record<ModalWidth, string> = {
    sm: 'w-[min(100%,24rem)]',
    md: 'w-[min(100%,32rem)]',
    lg: 'w-[min(100%,42rem)]',
    xl: 'w-[min(100%,56rem)]',
    full: 'w-full',
  };
  const heightClasses: Record<ModalHeight, string> = {
    auto: '',
    sm: 'h-[20rem]',
    md: 'h-[28rem]',
    lg: 'h-[36rem]',
    full: 'h-[calc(100dvh-2rem)]',
  };

  it.each(Object.entries(widthClasses) as [ModalWidth, string][])(
    'width=%s emits %s on the box',
    (width, expected) => {
      render(<Host width={width} />);
      expect(panelBox()).toHaveClass(expected);
      // …and never on the layer, which is always the whole viewport.
      expect(openDialog()).toHaveClass('fixed', 'inset-0', 'w-auto', 'h-auto');
    },
  );

  it('defaults to the md width step', () => {
    render(<Host />);
    expect(panelBox()).toHaveClass(widthClasses.md);
  });

  it.each(
    (Object.entries(heightClasses) as [ModalHeight, string][]).filter(
      ([step]) => step !== 'auto',
    ),
  )('height=%s emits %s on the box (scrollable mode)', (height, expected) => {
    render(<Host height={height} />);
    expect(panelBox()).toHaveClass(expected);
  });

  it.each(
    (
      Object.entries({
        sm: 'min-h-[20rem]',
        md: 'min-h-[28rem]',
        lg: 'min-h-[36rem]',
        full: 'min-h-[calc(100dvh-2rem)]',
      }) as [ModalHeight, string][]
    ).filter(([step]) => step !== 'auto'),
  )('height=%s emits %s when scrollable is false', (height, expected) => {
    render(<Host height={height} scrollable={false} />);
    const box = panelBox();
    expect(box).toHaveClass(expected);
    // The fixed twin must NOT ride along — that is the content trap (G2, D16).
    expect(box.className).not.toMatch(/(^|\s)h-\[/);
  });

  it('height=auto emits NO height class — the content decides', () => {
    render(<Host height="auto" />);
    expect(panelBox().className).not.toMatch(/(^|\s)h-\[/);
  });

  it('caps the box at the viewport minus the phone margins by default', () => {
    render(<Host height="full" />);
    expect(panelBox()).toHaveClass('max-h-[calc(100dvh-2rem)]');
    // The LAYER carries the UA resets instead: a modal <dialog> ships
    // max-width/max-height calc(100% - 6px - 2em), a border and a white
    // background of its own, and all four have to go for the layer to be the
    // transparent full-viewport sheet D17 asks for.
    expect(openDialog()).toHaveClass(
      'max-w-none',
      'max-h-none',
      'border-0',
      'bg-transparent',
      'm-0',
      'p-4',
    );
  });

  it('keeps the CLOSED dialog hidden: open:flex, never a bare flex', () => {
    render(<Host />);
    const classes = openDialog().className.split(' ');
    expect(classes).toContain('open:flex');
    expect(classes).not.toContain('flex');
  });

  it('claims no z-index on either element: the top layer is the mechanism (D13)', () => {
    render(<Host />);
    expect(openDialog().className).not.toMatch(/(^|\s)z-/);
    expect(panelBox().className).not.toMatch(/(^|\s)z-/);
  });
});

describe('Modal — the container is the BOX, not the layer (§6.5, D17)', () => {
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('keeps the padding steps measuring the panel on a wide screen', async () => {
    // 1280 wide: the LAYER's content box is 1248px — past @2xl (42rem) — while
    // a `sm` panel is 384px, short of even @md (28rem). The two answers are
    // 2rem and 1rem, so this viewport is the one place the placement of
    // `@container` is visible in pixels.
    await page.viewport(1280, 800);
    render(<Host width="sm" />);
    expect(panelBox()).toHaveClass('@container');
    expect(openDialog().className).not.toMatch(/(^|\s)@container(\s|$)/);
    // The proof, computed rather than claimed: P stays at its phone step.
    expect(getComputedStyle(topBar()).paddingTop).toBe('16px');
    expect(getComputedStyle(contentRegion()).paddingLeft).toBe('16px');
  });

  it('still steps up when the PANEL itself is wide', async () => {
    await page.viewport(1280, 800);
    const { unmount } = render(<Host width="lg" />);
    // `lg` = 42rem = 672px, but an inline-size container is measured on its
    // CONTENT box — 670px once the panel's 1px borders are taken off — so it
    // lands one pixel short of @2xl and keeps @md's 1.5rem. Unchanged by the
    // split (the old root carried the same border), and recorded here because
    // the arithmetic is a pixel away from the step name.
    expect(getComputedStyle(topBar()).paddingTop).toBe('24px');
    unmount();

    // `xl` = 56rem = 896px → 894px of content box, comfortably past @2xl.
    render(<Host width="xl" />);
    expect(getComputedStyle(topBar()).paddingTop).toBe('32px');
  });
});

describe('Modal — the scrim (D14)', () => {
  it('paints the shared token by default', () => {
    render(<Host />);
    expect(openDialog()).toHaveClass('backdrop:bg-scrim');
  });

  it('keeps the backdrop transparent when dimBackdrop is false', () => {
    render(<Host dimBackdrop={false} />);
    const dialog = openDialog();
    expect(dialog).toHaveClass('backdrop:bg-transparent');
    expect(dialog).not.toHaveClass('backdrop:bg-scrim');
  });
});

describe('Modal — the layer, the box, and what lands where (§6.8, D9/D17)', () => {
  it('merges the caller className LAST onto the BOX', () => {
    render(
      <Modal
        open
        onClose={noop}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        className="print:hidden"
      >
        <p>{ADDRESS}</p>
      </Modal>,
    );
    const classes = panelBox().className.trim().split(/\s+/);
    expect(classes.at(-1)).toBe('print:hidden');
    // …and never on the layer, whose job is fixed to the viewport.
    expect(openDialog()).not.toHaveClass('print:hidden');
  });

  it('hands the ref the <dialog> element itself — the layer, not the box', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Modal
        open
        onClose={noop}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        ref={ref}
      >
        <p>{ADDRESS}</p>
      </Modal>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDialogElement);
    expect(ref.current).toBe(openDialog());
    expect(ref.current).not.toBe(panelBox());
  });

  it('spreads native props (id, data-*, lang) onto that same root', () => {
    render(
      <Modal
        open
        onClose={noop}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        id="contact-modal"
        data-testid="contact"
        lang="ro"
      >
        <p>{ADDRESS}</p>
      </Modal>,
    );
    const dialog = openDialog();
    expect(dialog).toHaveAttribute('id', 'contact-modal');
    expect(dialog).toHaveAttribute('data-testid', 'contact');
    expect(dialog).toHaveAttribute('lang', 'ro');
  });

  it("still runs a caller's own pointer handlers alongside the backdrop press", async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    render(
      <Modal
        open
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        onClick={onClick}
      >
        <p>{ADDRESS}</p>
      </Modal>,
    );
    pressLayer(openDialog());
    await flush();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal — the top bar slot', () => {
  it('gives the layer exactly ONE child — the box — holding bar then body (D17)', () => {
    render(<Host />);
    const layer = openDialog();
    expect(layer.childElementCount).toBe(1);
    const box = panelBox();
    expect(box.childElementCount).toBe(2);
    expect(topBar()).toContainElement(closeButton());
    expect(contentRegion()).toContainElement(screen.getByText(BODY));
  });

  it('renders the bar with the ✕ alone when no header is passed', () => {
    render(
      <Modal open onClose={noop} closeLabel={CLOSE_LABEL} aria-label="Contact">
        <p>{ADDRESS}</p>
      </Modal>,
    );
    const bar = closeButton().parentElement as HTMLElement;
    const slot = bar.firstElementChild as HTMLElement;
    expect(bar.childElementCount).toBe(2);
    expect(slot.childElementCount).toBe(0);
    expect(slot).toBeEmptyDOMElement();
  });

  it('puts the slot content BEFORE the ✕ in DOM order (= in Tab order)', () => {
    render(<Host />);
    const heading = screen.getByRole('heading', { name: TITLE });
    const position = heading.compareDocumentPosition(closeButton());
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('never renders a <header> element (a second banner landmark inside a dialog)', () => {
    render(<Host />);
    expect(openDialog().querySelector('header')).toBeNull();
  });

  it('scrolls the CONTENT, not the bar', () => {
    render(<Host />);
    const bar = closeButton().parentElement as HTMLElement;
    const content = bar.nextElementSibling as HTMLElement;
    expect(content).toHaveClass('overflow-y-auto', 'min-h-0', 'flex-1');
    expect(bar.className).not.toMatch(/overflow-y-auto/);
  });

  it('makes the body a NAMED, focusable region when it really overflows', async () => {
    render(
      <Host height="md">
        <LongBody />
      </Host>,
    );
    await flush();
    const content = contentRegion();
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content).toHaveAttribute('tabindex', '0');
    // The region borrows the dialog's OWN name — no new string (§8.1, D10).
    expect(screen.getByRole('region', { name: TITLE })).toBe(content);
  });

  it('draws that region’s focus ring INSIDE it, where overflow-hidden cannot clip it', async () => {
    render(
      <Host height="md">
        <LongBody />
      </Host>,
    );
    await flush();
    const content = contentRegion();
    // Tab order is unchanged: the bar first, the body after it.
    await userEvent.tab();
    expect(document.activeElement).toBe(closeButton());
    await userEvent.tab();
    expect(document.activeElement).toBe(content);
    const ring = getComputedStyle(content);
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineOffset).toBe('-2px');
  });

  it('adds NO tab stop when the body does not overflow', async () => {
    render(<Host />);
    await flush();
    const content = contentRegion();
    expect(content).not.toHaveAttribute('tabindex');
    expect(content).not.toHaveAttribute('role');
    await userEvent.tab();
    expect(document.activeElement).toBe(closeButton());
    await userEvent.tab();
    expect(document.activeElement).not.toBe(content);
  });
});

describe('Modal — stacking (D13)', () => {
  it('beats a later z-index 9999 sibling: the hit test lands on the modal', () => {
    render(<Host decoy />);
    const dialog = openDialog();
    const { clientX, clientY } = centerOf(dialog);
    const hit = document.elementFromPoint(clientX, clientY);
    expect(hit).not.toBe(screen.getByTestId('decoy'));
    expect(hit === dialog || dialog.contains(hit)).toBe(true);
  });

  it('reports :modal while open and drops it on close', async () => {
    render(<Host />);
    const dialog = openDialog();
    expect(dialog.matches(':modal')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(dialog.matches(':modal')).toBe(false);
    expect(dialog.open).toBe(false);
  });
});

describe('Modal — Romanian fixtures reach the screen intact', () => {
  it('renders every comma-below and breve glyph the locale needs', () => {
    render(
      <Host>
        <p>{BODY}</p>
      </Host>,
    );
    const text = openDialog().textContent ?? '';
    for (const glyph of ['Ș', 'ș', 'Ț', 'ț', 'ă', 'â', 'î']) {
      expect(text).toContain(glyph);
    }
  });

  it('finds the heading and the body by their exact strings', () => {
    render(<Host />);
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The re-entrant-commit family (G2). Every case here is a SECOND commit landing
// while the element is open, i.e. exactly the window in which our own queued
// `close` event can be mistaken for the user's dismissal. None of them may
// produce an onClose, and the modal must still be open when the dust settles.
describe('Modal — re-entrant commits', () => {
  it('survives StrictMode’s double-invoked effects (Next enables it in dev)', async () => {
    const onClose = vi.fn();
    render(
      <StrictMode>
        <Host onClose={onClose} />
      </StrictMode>,
    );
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(openDialog().open).toBe(true);
  });

  it('survives an initialFocusRef identity change while open', async () => {
    const onClose = vi.fn();
    const first = createRef<HTMLAnchorElement>();
    const second = createRef<HTMLAnchorElement>();
    const ui = (target: RefObject<HTMLElement | null>) => (
      <Modal
        open
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        initialFocusRef={target}
      >
        <a ref={first} href="tel:+40712345678">
          Sună acum
        </a>
        <a ref={second} href="tel:+40712345679">
          Sună la recepție
        </a>
      </Modal>
    );
    const { rerender } = render(ui(first));
    await flush();
    expect(document.activeElement).toBe(first.current);

    // The split's whole point: a new ref identity must move FOCUS and touch
    // nothing else — no close(), no showModal(), so no lock churn and no
    // queued `close` event to survive in the first place.
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
    const showSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');

    rerender(ui(second));
    await flush();
    expect(closeSpy).not.toHaveBeenCalled();
    expect(showSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(openDialog().open).toBe(true);
    expect(document.activeElement).toBe(second.current);
  });

  it('survives a false→true flip committed twice inside one task', async () => {
    const onClose = vi.fn();
    const ui = (open: boolean) => (
      <Modal
        open={open}
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
      >
        <p>{ADDRESS}</p>
      </Modal>
    );
    const { rerender } = render(ui(true));
    await flush();
    // TWO commits, no frame between them: the close() of the first queues a
    // native `close` event that only lands after the reopen. Deliberately NOT
    // wrapped in one act() — that would collapse them into a single commit and
    // the test could no longer fail.
    rerender(ui(false));
    rerender(ui(true));
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(openDialog().open).toBe(true);
  });
});

describe('Modal — engines that never implemented <dialog> (D1b)', () => {
  it('is a no-op instead of throwing the whole page away', async () => {
    const onClose = vi.fn();
    const ref = createRef<HTMLDialogElement>();
    const ui = (open: boolean) => (
      <Modal
        open={open}
        onClose={onClose}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        ref={ref}
      >
        <p>{ADDRESS}</p>
      </Modal>
    );
    const { rerender } = render(ui(false));
    const node = ref.current as HTMLDialogElement;
    // What such a browser gives us: an unknown element, no showModal.
    Object.defineProperty(node, 'showModal', {
      value: undefined,
      configurable: true,
    });

    expect(() => rerender(ui(true))).not.toThrow();
    await flush();
    expect(document.documentElement.style.overflow).toBe('');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Modal — unmounted while still open', () => {
  it('hands focus back to the opener the platform can no longer reach', async () => {
    const ui = (mounted: boolean) => (
      <>
        <button type="button">{TRIGGER}</button>
        {mounted ? (
          <Modal
            open
            onClose={noop}
            closeLabel={CLOSE_LABEL}
            aria-label="Contact"
          >
            <p>{ADDRESS}</p>
          </Modal>
        ) : null}
      </>
    );
    const { rerender } = render(ui(false));
    const trigger = screen.getByRole('button', { name: TRIGGER });
    await userEvent.click(trigger);
    expect(document.activeElement).toBe(trigger);

    rerender(ui(true));
    await flush();
    expect(document.activeElement).toBe(openDialog());

    // The parent drops the modal from the tree without closing it first: React
    // removes the node, THEN runs the cleanup, so the browser's own restore has
    // nothing left to restore to.
    rerender(ui(false));
    await flush();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Modal — the callback ref (§6.8, React 19)', () => {
  it('returns the caller’s cleanup instead of swallowing it', () => {
    const attached: Array<HTMLDialogElement | null> = [];
    const cleanup = vi.fn();
    const { unmount } = render(
      <Modal
        open
        onClose={noop}
        closeLabel={CLOSE_LABEL}
        aria-label="Contact"
        ref={(node) => {
          attached.push(node);
          return cleanup;
        }}
      >
        <p>{ADDRESS}</p>
      </Modal>,
    );
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBeInstanceOf(HTMLDialogElement);

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    // React 19: a ref that returns a cleanup is NEVER re-called with null.
    expect(attached).toHaveLength(1);
  });
});

// The region is measured, not guessed — so it has to keep up with content that
// arrives AFTER the modal opened, and it must never vanish from under the
// keyboard user standing on it.
describe('Modal — the region keeps measuring', () => {
  const ShortBody = (): ReactElement => <p>{ADDRESS}</p>;

  it('gains the tab stop when content grows while the modal is open', async () => {
    const ui = (long: boolean) => (
      <Host height="md">{long ? <LongBody /> : <ShortBody />}</Host>
    );
    const { rerender } = render(ui(false));
    await flush();
    const content = contentRegion();
    expect(content).not.toHaveAttribute('tabindex');

    // A lazy image, a font swap, an accordion — anything that grows the body
    // without touching the panel's own (height-stepped) box.
    rerender(ui(true));
    await flush();
    await flush();
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content).toHaveAttribute('tabindex', '0');
    expect(content).toHaveAttribute('role', 'region');
  });

  it('never drops the tab stop while the region itself holds focus', async () => {
    const ui = (long: boolean) => (
      <Host height="md">{long ? <LongBody /> : <ShortBody />}</Host>
    );
    const { rerender } = render(ui(true));
    await flush();
    const content = contentRegion();
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(content);

    // The body shrinks under the focused region: removing tabindex here would
    // drop focus to <body>, i.e. outside the modal entirely.
    rerender(ui(false));
    await flush();
    await flush();
    expect(content.scrollHeight).toBe(content.clientHeight);
    expect(content).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(content);

    // Focus leaves → the onBlur re-measure downgrades it.
    await userEvent.tab();
    await flush();
    expect(content).not.toHaveAttribute('tabindex');
    expect(content).not.toHaveAttribute('role');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// `scrollable` (D16–D21) — WHICH box gives way when the content is taller than
// the screen. Both modes are measured at 320×568, the §7 accessibility stress
// phone, because that is the only viewport where the difference exists at all.
//
//  · scrollable (default) → the BOX is capped at the viewport minus 2rem and
//    its body scrolls inside it; the layer never moves.
//  · scrollable={false}   → the box takes its full content height and the
//    LAYER scrolls, carrying the whole box under the scrim. Nothing inside the
//    panel is a scroll container, so nothing becomes a region or a tab stop.
describe('Modal — scrollable', () => {
  // vitest's own default iframe size (browser.viewport), restored so nothing
  // that runs later inherits a phone-sized page.
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  const STRESS = { width: 320, height: 568 } as const;
  /** The room the layer leaves the box: the viewport minus its `p-4`. */
  const ROOM = STRESS.height - 32;

  it('false: the box keeps its full height and the LAYER scrolls instead', async () => {
    await page.viewport(STRESS.width, STRESS.height);
    render(
      <Host scrollable={false}>
        <LongBody />
      </Host>,
    );
    await flush();
    const layer = openDialog();
    const box = panelBox();

    // Nothing inside the panel is clipped or scrollable: the box is exactly as
    // tall as what it holds.
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
    expect(contentRegion().scrollHeight).toBeLessThanOrEqual(
      contentRegion().clientHeight,
    );
    // …and it is taller than the room, so it can only be seen by scrolling.
    expect(box.getBoundingClientRect().height).toBeGreaterThan(ROOM);
    expect(layer.scrollHeight).toBeGreaterThan(layer.clientHeight);
    // The top edge is REACHABLE at rest: auto margins in a flex column
    // collapse to zero when the free space goes negative, so centring never
    // eats the beginning of the panel the way `justify-center` would.
    expect(layer.scrollTop).toBe(0);
    expect(box.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });

  it('false: the body is never a region and never a tab stop', async () => {
    await page.viewport(STRESS.width, STRESS.height);
    render(
      <Host scrollable={false}>
        <LongBody />
      </Host>,
    );
    await flush();
    const content = contentRegion();
    expect(content).not.toHaveAttribute('role');
    expect(content).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('region')).toBeNull();

    // The only Tab stop in the panel is still the ✕; arrow keys scroll the
    // layer, which holds focus and IS the scroll container (SC 2.1.1).
    await userEvent.tab();
    expect(document.activeElement).toBe(closeButton());
    await userEvent.tab();
    expect(document.activeElement).not.toBe(content);
  });

  it('false: emits no cap on the box and no scrolling body classes', () => {
    render(
      <Host scrollable={false}>
        <LongBody />
      </Host>,
    );
    expect(panelBox()).not.toHaveClass('max-h-[calc(100dvh-2rem)]');
    const content = contentRegion();
    expect(content).toHaveClass('overflow-visible');
    expect(content).not.toHaveClass('overflow-y-auto');
    expect(content).not.toHaveClass('min-h-0');
    expect(content).not.toHaveClass('flex-1');
  });

  it('true (the default): the box is capped and its BODY scrolls', async () => {
    await page.viewport(STRESS.width, STRESS.height);
    render(
      <Host>
        <LongBody />
      </Host>,
    );
    await flush();
    const layer = openDialog();
    const box = panelBox();

    expect(box).toHaveClass('max-h-[calc(100dvh-2rem)]');
    expect(box.getBoundingClientRect().height).toBeLessThanOrEqual(ROOM);
    // The layer has nothing to scroll — the box fits inside it by construction.
    expect(layer.scrollHeight).toBeLessThanOrEqual(layer.clientHeight);

    const content = contentRegion();
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('region', { name: TITLE })).toBe(content);
  });

  it('locks the page in BOTH modes (D20) and releases it on close', async () => {
    const root = document.documentElement;
    for (const scrollable of [true, false]) {
      const view = render(<Host scrollable={scrollable}>{<LongBody />}</Host>);
      expect(root.style.overflow).toBe('hidden');
      await userEvent.click(closeButton());
      await flush();
      expect(root.style.overflow).toBe('');
      view.unmount();
    }
  });

  // THE LAYER'S OWN SCROLLBAR (G2, D19). A classic scrollbar — Windows
  // everywhere, macOS with "always show scroll bars" — is part of the element,
  // so pressing it arrives with `target === dialog`, indistinguishable from a
  // press on the sheet by identity alone. Closing the modal there would end the
  // one gesture this layout invites: dragging an oversized panel into view.
  // Headless Chromium paints OVERLAY scrollbars (clientWidth === offsetWidth),
  // so the band cannot be pressed for real here — fireEvent supplies the point
  // instead, which is exactly what the guard reads.
  it('false: a press on the layer’s scrollbar band never dismisses it', async () => {
    await page.viewport(STRESS.width, STRESS.height);
    const onClose = vi.fn();
    render(
      <Host onClose={onClose} scrollable={false}>
        <LongBody />
      </Host>,
    );
    await flush();
    const layer = openDialog();
    // The premise: this really is a scrolling layer, so a scrollbar is what a
    // classic-scrollbar platform would be painting down its edge.
    expect(layer.scrollHeight).toBeGreaterThan(layer.clientHeight);

    const rect = layer.getBoundingClientRect();
    const onVerticalBar = {
      clientX: rect.left + layer.clientWidth + 2,
      clientY: rect.top + 100,
    };
    fireEvent.pointerDown(layer, onVerticalBar);
    fireEvent.click(layer, onVerticalBar);
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(layer.open).toBe(true);

    // The block-end band belongs to a horizontal scrollbar and is read the
    // same way, in any writing direction.
    const onHorizontalBar = {
      clientX: rect.left + 100,
      clientY: rect.top + layer.clientHeight + 2,
    };
    fireEvent.pointerDown(layer, onHorizontalBar);
    fireEvent.click(layer, onHorizontalBar);
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(layer.open).toBe(true);
  });

  it('false: a press on the sheet itself still dismisses it', async () => {
    // The sibling of the case above, four pixels in from the same edge: inside
    // the client box, so it is the backdrop and nothing else.
    await page.viewport(STRESS.width, STRESS.height);
    const onClose = vi.fn();
    render(
      <Host onClose={onClose} scrollable={false}>
        <LongBody />
      </Host>,
    );
    await flush();
    const layer = openDialog();
    const rect = layer.getBoundingClientRect();
    const onSheet = { clientX: rect.left + 4, clientY: rect.top + 100 };
    fireEvent.pointerDown(layer, onSheet);
    fireEvent.click(layer, onSheet);
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // THE HEIGHT STEPS IN THE NON-SCROLLABLE MODE (G2, D16). A FIXED height here
  // is a content trap: the box is `overflow-hidden`, the body is
  // `overflow-visible`, and the layer only scrolls what sticks OUT of the box —
  // so anything past the fixed height is clipped with no scroll container
  // anywhere to reach it, and Tab into a clipped link scrolls the hidden box
  // programmatically until the ✕ leaves the screen. The steps are therefore
  // minimums in this mode; these two cases pin both halves of that.
  it('false: a height step is a MINIMUM — tall content is never clipped', async () => {
    await page.viewport(414, 896);
    render(
      <Host scrollable={false} height="md">
        <LongBody />
      </Host>,
    );
    await flush();
    const layer = openDialog();
    const box = panelBox();

    expect(box).toHaveClass('min-h-[28rem]');
    expect(box).not.toHaveClass('h-[28rem]');
    // Nothing is clipped: the box is as tall as everything it holds…
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
    expect(contentRegion().scrollHeight).toBeLessThanOrEqual(
      contentRegion().clientHeight,
    );
    // …which is well past the 28rem step, and the layer takes the overflow.
    expect(box.getBoundingClientRect().height).toBeGreaterThan(448);
    expect(layer.scrollHeight).toBeGreaterThan(layer.clientHeight);
  });

  it('false: a height step still holds as a FLOOR under short content', async () => {
    await page.viewport(414, 896);
    render(
      <Host scrollable={false} height="md">
        <p>{ADDRESS}</p>
      </Host>,
    );
    await flush();
    const box = panelBox();
    // 28rem = 448px: the step is what keeps a one-line modal from collapsing,
    // which is the reason the steps exist at all.
    expect(box.getBoundingClientRect().height).toBeGreaterThanOrEqual(448);
    // And it is only a floor — nothing scrolls, in the panel or in the layer.
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
    expect(openDialog().scrollHeight).toBeLessThanOrEqual(
      openDialog().clientHeight,
    );
  });

  it('false: keeps the focus ring for the true→false handover (G2)', () => {
    // `scrollable` can flip while the modal is open, and the measuring effect
    // deliberately keeps the tab stop until the next blur rather than dropping
    // focus to <body>. For those moments the body is focused and
    // overflow-visible, so it needs its own ring: the box's overflow-hidden
    // clips the browser default.
    render(
      <Host scrollable={false}>
        <LongBody />
      </Host>,
    );
    expect(contentRegion()).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-focus',
      'focus-visible:-outline-offset-2',
    );
  });

  it('closes on Escape and on a layer press in the non-scrollable mode too', async () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Host onClose={onClose} scrollable={false}>
        <LongBody />
      </Host>,
    );
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();

    render(
      <Host onClose={onClose} scrollable={false}>
        <LongBody />
      </Host>,
    );
    pressLayer(openDialog());
    await flush();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
