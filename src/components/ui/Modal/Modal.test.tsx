import { createRef, StrictMode, useRef, useState } from 'react';
import type { ReactElement, ReactNode, RefObject } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

/** The body container = the bar's next sibling inside the panel. */
const contentRegion = (): HTMLElement =>
  (closeButton().parentElement as HTMLElement)
    .nextElementSibling as HTMLElement;

/** Content that genuinely overflows a fixed-height panel (~3 screens). */
const LongBody = (): ReactElement => (
  <div>
    {Array.from({ length: 12 }, (_, index) => (
      <p key={index}>{BODY}</p>
    ))}
  </div>
);

/** A press that starts AND ends on the backdrop = outside the panel's rect. */
const pressBackdrop = (dialog: HTMLDialogElement) => {
  const rect = dialog.getBoundingClientRect();
  const point = { clientX: rect.left - 20, clientY: rect.top - 20 };
  fireEvent.pointerDown(dialog, point);
  fireEvent.click(dialog, point);
};

const centerOf = (dialog: HTMLDialogElement) => {
  const rect = dialog.getBoundingClientRect();
  return {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
};

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

describe('Modal — the backdrop press (D11)', () => {
  it('closes when the press starts and ends outside the panel', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    pressBackdrop(openDialog());
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores the same press when closeOnBackdropClick is false', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} closeOnBackdropClick={false} />);
    pressBackdrop(openDialog());
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a press INSIDE the panel (the dialog IS the box — A′)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dialog = openDialog();
    const point = centerOf(dialog);
    fireEvent.pointerDown(dialog, point);
    fireEvent.click(dialog, point);
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a drag that STARTS inside and ends outside (text selection)', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dialog = openDialog();
    const rect = dialog.getBoundingClientRect();
    fireEvent.pointerDown(dialog, centerOf(dialog));
    fireEvent.click(dialog, {
      clientX: rect.left - 20,
      clientY: rect.top - 20,
    });
    await flush();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a drag that starts OUTSIDE and ends inside', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dialog = openDialog();
    const rect = dialog.getBoundingClientRect();
    fireEvent.pointerDown(dialog, {
      clientX: rect.left - 20,
      clientY: rect.top - 20,
    });
    fireEvent.click(dialog, centerOf(dialog));
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
  const widthClasses: Record<ModalWidth, string> = {
    sm: 'w-[min(100%-2rem,24rem)]',
    md: 'w-[min(100%-2rem,32rem)]',
    lg: 'w-[min(100%-2rem,42rem)]',
    xl: 'w-[min(100%-2rem,56rem)]',
    full: 'w-[calc(100%-2rem)]',
  };
  const heightClasses: Record<ModalHeight, string> = {
    auto: '',
    sm: 'h-[20rem]',
    md: 'h-[28rem]',
    lg: 'h-[36rem]',
    full: 'h-[calc(100dvh-2rem)]',
  };

  it.each(Object.entries(widthClasses) as [ModalWidth, string][])(
    'width=%s emits %s',
    (width, expected) => {
      render(<Host width={width} />);
      expect(openDialog()).toHaveClass(expected);
    },
  );

  it('defaults to the md width step', () => {
    render(<Host />);
    expect(openDialog()).toHaveClass(widthClasses.md);
  });

  it.each(
    (Object.entries(heightClasses) as [ModalHeight, string][]).filter(
      ([step]) => step !== 'auto',
    ),
  )('height=%s emits %s', (height, expected) => {
    render(<Host height={height} />);
    expect(openDialog()).toHaveClass(expected);
  });

  it('height=auto emits NO height class — the content decides', () => {
    render(<Host height="auto" />);
    expect(openDialog().className).not.toMatch(/(^|\s)h-\[/);
  });

  it('caps every step at the viewport minus the phone margins', () => {
    render(<Host height="full" />);
    expect(openDialog()).toHaveClass('max-h-[calc(100dvh-2rem)]', 'max-w-none');
  });

  it('keeps the CLOSED dialog hidden: open:flex, never a bare flex', () => {
    render(<Host />);
    const classes = openDialog().className.split(' ');
    expect(classes).toContain('open:flex');
    expect(classes).not.toContain('flex');
  });

  it('claims no z-index: the top layer is the mechanism (D13)', () => {
    render(<Host />);
    expect(openDialog().className).not.toMatch(/(^|\s)z-/);
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

describe('Modal — the root is the box (§6.8, D9)', () => {
  it('merges the caller className LAST', () => {
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
    const classes = openDialog().className.trim().split(/\s+/);
    expect(classes.at(-1)).toBe('print:hidden');
  });

  it('hands the ref the <dialog> element itself', () => {
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
    pressBackdrop(openDialog());
    await flush();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal — the top bar slot', () => {
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

  it('finds the heading and the body by their exact strings', async () => {
    render(<Host />);
    // Two frames: the panel opens at opacity 0 (@starting-style, D6's fade-in),
    // and a visibility assertion taken inside that first frame would be asking
    // whether the modal is mid-animation, not whether it is on screen.
    await flush();
    await flush();
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
