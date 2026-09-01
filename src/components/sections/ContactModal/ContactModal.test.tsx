import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
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
import { clinic } from '@/lib/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses.
// The "never scrolls" suite at the bottom is meaningless without it: whether
// the panel's body overflows is a question about computed heights, not about
// class names, and every number in it — the 32rem width cap, the 1rem phone
// margins, the max-h of 100dvh − 2rem — arrives through this import.
// It brings the BOXES but NOT the typeface: next/font does not run in this
// runner, so `--font-source-serif` is undefined here and the whole token chain
// (--font-body → font-family) is poisoned by the missing variable, leaving
// every string measured in the browser's default serif. Text height is half of
// "does this panel overflow", so beforeAll injects the same @font-face pair
// .storybook/preview-fonts.css declares — see there.
import '@/styles/globals.css';
import { ContactModalProvider } from './ContactModalProvider';
import { ContactModalTrigger } from './ContactModalTrigger';
import { useContactModal } from './useContactModal';

// sections/ContactModal — the interaction suite for the site's ONE dialog,
// built to the owner-approved N2 composition contract (board
// .claude/plans/contact-modal-n2-contract.plan.md, 2026-08-27).
//
// Role-based queries throughout (§9, §13): a passing suite doubles as proof of
// accessible markup — getByRole('dialog', { name }) only finds a dialog the
// platform actually names, and getByRole('link', { name: phoneDisplay }) only
// finds a control whose accessible name IS the visible number (SC 2.5.3).
// Every user-facing string comes from the REAL message files or lib/clinic.ts,
// never a literal typed in here (§17.4): a renamed or dropped key then fails
// HERE as well as in the translation-parity gate, instead of silently
// rendering the dotted key path, which is what next-intl does for a miss.
//
// Fixtures are Romanian with diacritics (§15.7); German is the stress locale
// (§8.4) — its lead is the longest string the panel has to hold, which is why
// it appears in the key-leak case and in the box-height matrix at the bottom.
//
// TWO event sources, exactly as in the atom's own suite (Modal.test.tsx):
//  · `userEvent` from vitest/browser drives the REAL browser, so its events
//    are TRUSTED — the only kind that runs <dialog>'s native Escape handling.
//  · `fireEvent` for the scrim press only, which needs coordinates OUTSIDE the
//    panel's rectangle — a place a real mouse cannot aim at without knowing
//    the layout first.

type Fixture = 'ro' | 'de';
const MESSAGES: Record<Fixture, typeof ro> = { ro, de };

// Chromium dispatches <dialog>'s `close` event on the next RENDERING frame,
// not on the next macrotask (Modal.test.tsx's G2 finding), and the atom's
// overflow measurement lands on a frame too. One frame, then one task, reaches
// both.
const flush = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  );

interface MountOptions {
  locale?: Fixture;
  /** Stories and tests only — the shipped page always starts closed (D1). */
  defaultOpen?: boolean;
  /** A consumer handler, to prove the trigger runs it BEFORE opening. */
  onClick?: () => void;
  /** A second opener, to prove there is still exactly ONE dialog. */
  secondTrigger?: boolean;
}

/**
 * The page in miniature: the provider wraps the content and renders the dialog
 * ONCE after it (D1), a section-tier trigger sits inside a landmark, and
 * next-intl's provider supplies the messages — the same three layers the shell
 * gives it in production (app/[locale]/layout.tsx) and in Storybook
 * (.storybook/preview.tsx).
 */
const Mounted = ({
  locale = 'ro',
  defaultOpen = false,
  onClick,
  secondTrigger = false,
}: MountOptions): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ContactModalProvider defaultOpen={defaultOpen}>
      <main>
        <ContactModalTrigger onClick={onClick}>
          {MESSAGES[locale].common.actions.contact}
        </ContactModalTrigger>
        {secondTrigger ? (
          <ContactModalTrigger variant="outline">
            {MESSAGES[locale].common.actions.call}
          </ContactModalTrigger>
        ) : null}
      </main>
    </ContactModalProvider>
  </NextIntlClientProvider>
);

const mount = (options: MountOptions = {}) => {
  const locale = options.locale ?? 'ro';
  const messages = MESSAGES[locale];
  const utils = render(<Mounted {...options} />);
  return {
    ...utils,
    messages: messages.contact,
    trigger: () =>
      screen.getByRole('button', { name: messages.common.actions.contact }),
    dialog: () =>
      screen.getByRole('dialog', {
        name: messages.contact.heading,
      }) as HTMLDialogElement,
    queryDialog: () => screen.queryByRole('dialog'),
    closeButton: () =>
      screen.getByRole('button', { name: messages.contact.close }),
  };
};

/**
 * A press that starts AND ends on the scrim. Since ui/Modal's rework (D19) that
 * simply means the event TARGETED the layer — the transparent <dialog> — rather
 * than anything inside the box, so the coordinates below are only there to make
 * the gesture a real one; they no longer have to miss a rectangle.
 */
const pressScrim = (dialog: HTMLDialogElement) => {
  const rect = dialog.getBoundingClientRect();
  const point = { clientX: rect.left - 20, clientY: rect.top - 20 };
  fireEvent.pointerDown(dialog, point);
  fireEvent.click(dialog, point);
};

/**
 * THE BOX — the white card. Since ui/Modal's rework (D17) the <dialog> is a
 * transparent full-viewport LAYER and the box is its only child, so every
 * measurement about the panel itself goes through here; the layer is what
 * scrolls when the box is taller than the screen.
 */
const panelBox = (dialog: HTMLDialogElement): HTMLElement =>
  dialog.firstElementChild as HTMLElement;

/** The top bar = the box's first child. */
const topBar = (dialog: HTMLDialogElement): HTMLElement =>
  panelBox(dialog).children[0] as HTMLElement;

/** The body container = the box's second child. */
const contentRegion = (dialog: HTMLDialogElement): HTMLElement =>
  panelBox(dialog).children[1] as HTMLElement;

// Test environment, not product styling: unlayered author CSS beats Tailwind's
// @layer utilities without !important. The panel opens from @starting-style
// opacity 0 over 200ms, and an assertion landing inside that window reads a
// half-painted box — a visual concern that is verified in the compiled CSS and
// disabled in every snapshot (§13), never something a unit test should race.
let stillnessStyle: HTMLStyleElement | null = null;

// The REAL typeface, for the same reason the real stylesheet is imported: the
// panel's height is the sum of its lines, and a fallback serif with different
// metrics measures a different panel. These are the declarations
// .storybook/preview-fonts.css makes for Storybook, verbatim apart from the
// URL — this runner serves the repo from its root, so the committed subset
// sits at /src/fonts/… instead of at staticDirs' /… . `font-display: block`
// keeps a fallback from ever being measured; the mono face is not copied,
// because nothing in this section uses it.
const FONT_FAMILY = 'Source Serif 4 SB';
const FONT_CSS = `
@font-face {
  font-family: '${FONT_FAMILY}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${FONT_FAMILY}'; }
`;
let fontStyle: HTMLStyleElement | null = null;

beforeAll(async () => {
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent = 'dialog, dialog::backdrop { transition: none; }';
  document.head.append(stillnessStyle);

  fontStyle = document.createElement('style');
  fontStyle.textContent = FONT_CSS;
  document.head.append(fontStyle);
  // load(), not just ready: nothing has rendered yet, so there is no pending
  // font for `ready` to wait on — and a 404 on the subset REJECTS here, loudly,
  // instead of silently downgrading every measurement below to the fallback.
  await document.fonts.load(`1rem "${FONT_FAMILY}"`);
  await document.fonts.ready;
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
  fontStyle?.remove();
  fontStyle = null;
});

afterEach(() => {
  // A leaked scroll lock would silently poison every later test in this file.
  document.documentElement.style.overflow = '';
  vi.restoreAllMocks();
});

describe('ContactModal — the trigger', () => {
  it('is a real <button> that announces what it opens', () => {
    // §9 semantic HTML: a trigger is always a genuine button (the contract
    // omits `asChild` from its props for exactly this reason), and
    // aria-haspopup="dialog" is what tells a screen-reader user that pressing
    // it summons a dialog rather than navigating somewhere.
    const { trigger } = mount();

    expect(trigger().tagName).toBe('BUTTON');
    expect(trigger()).toHaveAttribute('type', 'button');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('opens the dialog on click, named by the section’s own <h2>', async () => {
    const { trigger, dialog, queryDialog } = mount();

    expect(queryDialog()).toBeNull();
    await userEvent.click(trigger());
    await flush();

    expect(dialog().open).toBe(true);
    expect(dialog().matches(':modal')).toBe(true);
  });

  it('calls the consumer’s own onClick as well as opening', async () => {
    // The trigger is a wrapper around ui/Button, not a replacement for it: a
    // page that wants to do something of its own on the same press must not
    // have to choose between its handler and the dialog. Only the CONJUNCTION
    // is asserted, deliberately: the relative ORDER of the two calls is not
    // observable from out here — React batches the state update, so the dialog
    // is still closed inside either callback — so "the consumer's handler
    // first" stays documented intent in ContactModalTrigger.tsx rather than a
    // test that would pass either way.
    const onClick = vi.fn();
    const { trigger, queryDialog } = mount({ onClick });

    await userEvent.click(trigger());
    await flush();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0]).toMatchObject({ type: 'click' });
    expect(queryDialog()).not.toBeNull();
  });

  it('cannot be turned into an asChild or a different popup by a SPREAD', async () => {
    // The type ban (`Omit<ButtonProps, 'asChild' | 'aria-haspopup'>`) only
    // stops a caller who spells the prop out; an object spread is checked
    // loosely enough to slip both past it. What actually holds the line is the
    // props ORDER inside the trigger — `{...rest}` first, the owned props
    // after — so this test drives the hole the types leave: a smuggled
    // `asChild` would reach ui/Button's slotClone and throw at render (its
    // single-element-child guard), and a smuggled token would replace the
    // dialog hint. The double cast is how a caller would end up here in real
    // life: props assembled elsewhere and spread in.
    const smuggled = { asChild: true, 'aria-haspopup': 'menu' } as unknown as {
      children?: never;
    };
    render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ContactModalProvider>
          <main>
            <ContactModalTrigger {...smuggled}>
              {ro.common.actions.contact}
            </ContactModalTrigger>
          </main>
        </ContactModalProvider>
      </NextIntlClientProvider>,
    );
    const trigger = screen.getByRole('button', {
      name: ro.common.actions.contact,
    });

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    await flush();
    expect(
      screen.getByRole('dialog', { name: ro.contact.heading }),
    ).toBeInTheDocument();
  });

  it('spreads the rest of ui/Button’s props (§6.8)', () => {
    // `variant`, `size` and `className` are ButtonProps and must reach the
    // atom untouched — the trigger owns only the click and the aria-haspopup.
    render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ContactModalProvider>
          <main>
            <ContactModalTrigger
              variant="outline"
              size="lg"
              className="self-start"
            >
              {ro.common.actions.contact}
            </ContactModalTrigger>
          </main>
        </ContactModalProvider>
      </NextIntlClientProvider>,
    );
    const trigger = screen.getByRole('button', {
      name: ro.common.actions.contact,
    });

    expect(trigger).toHaveClass('border-cta', 'min-h-14', 'self-start');
    // …and the caller's className is merged LAST, so it can win a Tailwind tie.
    expect(trigger.className.trim().split(/\s+/).at(-1)).toBe('self-start');
  });

  it('renders ONE dialog however many openers the page carries (D1)', async () => {
    const { trigger, queryDialog } = mount({ secondTrigger: true });

    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    await userEvent.click(trigger());
    await flush();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(queryDialog()).not.toBeNull();
  });
});

describe('ContactModal — every exit path (§9)', () => {
  it('closes on Escape and hands focus back to the trigger', async () => {
    const { trigger, queryDialog } = mount();
    const opener = trigger();

    await userEvent.click(opener);
    await flush();
    await userEvent.keyboard('{Escape}');
    await flush();

    expect(queryDialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
    // …and it STAYS closed: a second onClose reaching the provider would
    // reopen nothing, but a stale queued `close` event that flipped the switch
    // twice would show up here as a dialog that never came back.
    await flush();
    expect(queryDialog()).toBeNull();
  });

  it('closes on the ✕, which speaks the locale’s own close label', async () => {
    // Opened by a PRESS, not by defaultOpen: the platform returns focus to
    // whatever was focused when showModal() ran, so a dialog that opened on
    // mount has nothing but <body> to go back to. The trigger is what the
    // visitor's finger left behind, and this is the path they take.
    const { trigger, closeButton, queryDialog, messages } = mount();
    const opener = trigger();

    await userEvent.click(opener);
    await flush();
    expect(closeButton()).toHaveAccessibleName(messages.close);

    await userEvent.click(closeButton());
    await flush();

    expect(queryDialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a press that starts and ends on the scrim', async () => {
    const { dialog, queryDialog } = mount({ defaultOpen: true });

    pressScrim(dialog());
    await flush();

    expect(queryDialog()).toBeNull();
  });

  it('reopens afterwards — the switch is reusable, never one-shot', async () => {
    const { trigger, queryDialog } = mount({ defaultOpen: true });

    await userEvent.keyboard('{Escape}');
    await flush();
    expect(queryDialog()).toBeNull();

    await userEvent.click(trigger());
    await flush();
    expect(queryDialog()).not.toBeNull();
  });

  it('hands out STABLE open/close callbacks across a state change (D1)', async () => {
    // The context value changes on every open — the callbacks must not, or
    // every consumer memoised on them re-renders for nothing.
    const seen: Array<{ open: () => void; close: () => void }> = [];
    const Spy = (): null => {
      const value = useContactModal();
      useEffect(() => {
        seen.push({ open: value.open, close: value.close });
      });
      return null;
    };

    render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ContactModalProvider>
          <main>
            <Spy />
            <ContactModalTrigger>
              {ro.common.actions.contact}
            </ContactModalTrigger>
          </main>
        </ContactModalProvider>
      </NextIntlClientProvider>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: ro.common.actions.contact }),
    );
    await flush();

    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)?.open).toBe(seen[0]?.open);
    expect(seen.at(-1)?.close).toBe(seen[0]?.close);
  });
});

describe('ContactModal — the dialog’s content', () => {
  it('starts open when the host asks for it (stories and tests only)', () => {
    const { dialog } = mount({ defaultOpen: true });
    expect(dialog().open).toBe(true);
  });

  it('dials the E.164 number while SHOWING the human format', () => {
    // Two different strings on purpose (§10.1): a tel: href needs E.164, a
    // reader needs spacing — the Footer's phone link makes the same pair.
    const { dialog } = mount({ defaultOpen: true });
    const call = within(dialog()).getByRole('link', {
      name: clinic.phoneDisplay,
    });

    expect(call).toHaveAttribute('href', `tel:${clinic.phone}`);
    expect(call).toHaveTextContent(clinic.phoneDisplay);
    expect(clinic.phone.startsWith('+')).toBe(true);
    // The ONE control in the panel besides the ✕ — the dialog asks for a call
    // and nothing else.
    expect(within(dialog()).getAllByRole('link')).toHaveLength(1);
  });

  it('keeps the phone glyph unlabelled, so the link announces once', () => {
    const { dialog } = mount({ defaultOpen: true });
    const svg = within(dialog())
      .getByRole('link', { name: clinic.phoneDisplay })
      .querySelector('svg');

    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('prints the heading and the lead from the message file', () => {
    // The whole dialog in three keys since the 08-28 trim (owner): heading,
    // lead, close. The second label and the schedule are gone from the panel
    // and their keys are gone from all five files.
    const { dialog, messages } = mount({ defaultOpen: true });
    const text = dialog().textContent ?? '';

    expect(text).toContain(messages.heading);
    expect(text).toContain(messages.lead);
    expect(text).toContain(clinic.phoneDisplay);
  });

  it('names the dialog with the ONE <h2> in it, via aria-labelledby', () => {
    // §9's heading rules for a section: the page owns the <h1>, so the modal
    // opens at h2 — and the dialog's accessible name IS that heading, so a
    // screen reader announces the title once, not twice.
    // ONE heading again since the 08-28 trim: the schedule's level-3 „Program"
    // went with the block it titled, so nothing here needs ui/Text to grow an
    // 'h3' step any more.
    const { dialog } = mount({ defaultOpen: true });
    const headings = within(dialog()).getAllByRole('heading');
    const [title] = headings;

    expect(headings).toHaveLength(1);
    expect(title?.tagName).toBe('H2');
    expect(dialog()).toHaveAttribute('aria-labelledby', title?.id);
    expect(title?.id).toBeTruthy();
    expect(dialog()).toHaveAccessibleName(ro.contact.heading);
  });

  it('puts the title in the TOP BAR, beside the ✕, not in the body', () => {
    // Owner, 2026-08-27: the <h2> moved from the first line of the body into
    // ui/Modal's `header` slot, centred on the panel. The slot sits BEFORE the
    // ✕ in DOM order, so it is also before it in the Tab order, and the body
    // now opens on the lead.
    const { dialog } = mount({ defaultOpen: true });
    const slot = topBar(dialog()).firstElementChild as HTMLElement;
    const title = within(dialog()).getByRole('heading', { level: 2 });

    expect(slot).toContainElement(title);
    // …and the body holds no heading at all: it opens on the lead.
    expect(
      within(contentRegion(dialog())).queryAllByRole('heading'),
    ).toHaveLength(0);
  });
});

describe('ContactModal — the message keys', () => {
  it.each(['ro', 'de'] as const)(
    'never leaks a %s key path into a visible string',
    (locale) => {
      // next-intl does not throw on a miss — it renders "contact.heading" and
      // logs. This is the assertion that turns that into a failure, in both
      // the default locale and the stress one.
      mount({ locale, defaultOpen: true });
      expect(document.body.textContent).not.toMatch(/contact\./);
    },
  );
});

describe('useContactModal — used outside its provider', () => {
  it('throws a message that NAMES ContactModalProvider', () => {
    // The failure mode this replaces: a silent `undefined` context, a trigger
    // that does nothing when pressed, and no clue where the provider belongs.
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Orphan = (): ReactElement => {
      useContactModal();
      return <p>nu ajunge niciodată pe ecran</p>;
    };

    expect(() => render(<Orphan />)).toThrow(/ContactModalProvider/);
    silence.mockRestore();
  });
});

// The owner's hard rule for this dialog: NOTHING SCROLLS, at any size. Since
// ui/Modal's rework the first half is one prop — `scrollable={false}`
// (D16–D21): the atom puts NO cap on the white box, so the box is always
// exactly as tall as this composition and can never grow a scrollbar down its
// own middle. The second half is the 08-28 trim: with the second label and the
// schedule gone the box is ~200px tall, which is shorter than every viewport
// in the §7 set — so the atom's full-viewport LAYER has nothing to scroll
// either, and the sideways phone that used to be an accepted fallback now
// simply holds the whole card.
//
// The matrix has two axes, because the panel's height is content × typography:
// the WIDTH — both phone sizes the §13 matrix samples, plus the 320px
// accessibility stress width (§7) — and the LANGUAGE, where German is the
// longest this site speaks (§8.4, ≈ +30–35%) and its lead runs two lines where
// Romanian's runs one. DE at 320 is therefore the worst case in the whole
// product, and it is in here. The sideways phone follows as its own case.
//
// The `role`/`tabindex` check is the atom's own signal, not a guess: ui/Modal
// grants its body a region and a tab stop ONLY in the scrollable mode and only
// while the content really overflows, so their ABSENCE is the panel confirming
// which mode it is in as well as that everything fits.
describe('ContactModal — the box is never capped, so it never scrolls', () => {
  // vitest's own default iframe size (browser.viewport), restored so nothing
  // that runs later inherits a phone-sized page.
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  /**
   * What `scrollable={false}` must be true of at EVERY viewport: the body is
   * no region and no tab stop, the box holds its whole content without
   * scrolling in either direction, and it is a real card rather than a
   * collapsed one — the bar, the lead and the 3.5rem control clear 150px at
   * every width this site serves, and the assertion is deliberately far below
   * the ~200px the card measures, so it catches a collapse without pinning a
   * pixel height no one promised.
   */
  const expectUncappedBox = (dialog: HTMLDialogElement) => {
    const box = panelBox(dialog);
    const content = contentRegion(dialog);

    expect(content).not.toHaveAttribute('role');
    expect(content).not.toHaveAttribute('tabindex');
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    expect(box.getBoundingClientRect().height).toBeGreaterThan(150);
  };

  it.each([
    { locale: 'ro' as const, width: 320, height: 568 },
    { locale: 'ro' as const, width: 390, height: 844 },
    { locale: 'de' as const, width: 320, height: 568 },
  ])(
    'fits an upright $width×$height phone in $locale, layer included',
    async ({ locale, width, height }) => {
      await page.viewport(width, height);
      const { dialog } = mount({ locale, defaultOpen: true });
      await document.fonts.ready;
      await flush();
      // The premise, asserted rather than assumed: a fallback serif would make
      // every number below a measurement of the wrong panel.
      expect(document.fonts.check(`1rem "${FONT_FAMILY}"`)).toBe(true);

      const layer = dialog();
      expectUncappedBox(layer);
      // Upright, the box fits the screen, so not even the layer has anything
      // to scroll — the whole dialog is motionless.
      expect(layer.scrollHeight).toBeLessThanOrEqual(layer.clientHeight);
      expect(layer.scrollWidth).toBeLessThanOrEqual(layer.clientWidth);
    },
  );

  it('holds the whole box even on a phone held sideways', async () => {
    // 844×390 is the same phone turned over: 358px of room under the layer's
    // 1rem margins. Before the 08-28 trim the card was taller than that and
    // the layer scrolled — an owner-accepted fallback. With the second label
    // and the schedule gone the card fits here too, so this case now asserts
    // the STRONGER property: not one box on the screen scrolls, and the panel
    // sits fully inside the viewport with its top edge visible at rest.
    await page.viewport(844, 390);
    const { dialog } = mount({ defaultOpen: true });
    await document.fonts.ready;
    await flush();
    expect(document.fonts.check(`1rem "${FONT_FAMILY}"`)).toBe(true);

    const layer = dialog();
    const box = panelBox(layer);
    expectUncappedBox(layer);

    expect(layer.scrollHeight).toBeLessThanOrEqual(layer.clientHeight);
    expect(layer.scrollWidth).toBeLessThanOrEqual(layer.clientWidth);
    expect(layer.scrollTop).toBe(0);
    expect(box.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
    expect(box.getBoundingClientRect().bottom).toBeLessThanOrEqual(390);
  });
});
