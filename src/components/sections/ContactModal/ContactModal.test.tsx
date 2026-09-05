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
// .claude/plans/contact-modal-n2-contract.plan.md, 2026-08-27) and REWORKED to
// the two-channel v4 contract (board
// .claude/plans/contact-modal-whatsapp-n2-contract.plan.md, fb-351…358): the
// panel now answers with TWO ways to reach the clinic — the tel: control and
// the wa.me one — each in its own titled group with a caption under it.
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
// (§8.4) — its WhatsApp label ("Kontaktieren Sie uns über WhatsApp") is the
// longest string the panel has to hold and its title the longest line in the
// bar, which is why German appears in the key-leak case, in the equal-width
// pair and in the box-height matrix at the bottom.
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

/**
 * The section's own rail — the grid holding both channel groups. ui/Modal wraps
 * consumer content in ONE measuring <div> of its own (the atom's overflow
 * probe reads it), so the rail is the body's grandchild, not its child; the
 * hop is spelled here once rather than in every case that measures rhythm.
 */
const rail = (dialog: HTMLDialogElement): HTMLElement =>
  contentRegion(dialog).firstElementChild?.firstElementChild as HTMLElement;

/**
 * The Or-word between the two channel groups — the rail's MIDDLE child, which
 * is the only thing about it worth reaching for by position: it is a <p>, like
 * both captions, so a `p` selector would find three and a text match would
 * pass on a divider that had drifted to the end of the rail.
 */
const divider = (dialog: HTMLDialogElement): HTMLElement =>
  rail(dialog).children[1] as HTMLElement;

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
    // …and the caller's className is merged LAST (pinned convention;
    // attribute order never decides the cascade).
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
    // TWO controls in the panel besides the ✕ since the v4 rework — the call
    // and the message, and nothing else. Pinned as a COUNT so a third channel
    // cannot arrive unnoticed (the board's D1: two channels, no more).
    expect(within(dialog()).getAllByRole('link')).toHaveLength(2);
  });

  it('opens the clinic’s own WhatsApp conversation in a new tab', () => {
    // The second channel (v4 contract). wa.me IS external navigation, so it
    // travels with target=_blank + rel="noopener noreferrer" — the Footer's
    // contact-disc law (PR #68), while tel: next to it stays targetless
    // (a protocol handler hands the number to the dialler; _blank would orphan
    // a blank tab). The number is the single-source `whatsapp` field, digits
    // only, never the E.164 spelling with its plus (§10.1).
    const { dialog, messages } = mount({ defaultOpen: true });
    const write = within(dialog()).getByRole('link', {
      name: messages.whatsapp,
    });

    expect(write).toHaveAttribute('href', `https://wa.me/${clinic.whatsapp}`);
    expect(write).toHaveAttribute('target', '_blank');
    expect(write).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      within(dialog()).getByRole('link', { name: clinic.phoneDisplay }),
    ).not.toHaveAttribute('target');
  });

  it.each([
    ['phone', () => clinic.phoneDisplay],
    ['whatsapp', () => ro.contact.whatsapp],
  ] as const)(
    'keeps the %s glyph unlabelled, so its link announces once',
    (_channel, name) => {
      const { dialog } = mount({ defaultOpen: true });
      const svg = within(dialog())
        .getByRole('link', { name: name() })
        .querySelector('svg');

      expect(svg).toBeInstanceOf(SVGSVGElement);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
    },
  );

  it('prints every one of its eight keys from the message file', () => {
    // The whole dialog in eight keys: heading, the two group titles, the word
    // between them, the WhatsApp label, the two captions and close. The `lead`
    // of the 08-28 trim is gone from the panel and its key from all five files.
    const { dialog, messages } = mount({ defaultOpen: true });
    const text = dialog().textContent ?? '';

    expect(text).toContain(messages.heading);
    expect(text).toContain(messages.callHeading);
    expect(text).toContain(messages.or);
    expect(text).toContain(messages.whatsappHeading);
    expect(text).toContain(messages.whatsapp);
    expect(text).toContain(messages.whatsappNote);
    expect(text).toContain(clinic.phoneDisplay);
  });

  it.each(['ro', 'de'] as const)(
    'prints the %s Or-word between the groups, big but not a heading',
    (locale) => {
      // The divider (owner, 2026-09-05). Three claims, and the third is the one
      // that needed thought:
      //  · it is the MESSAGE, not a hardcoded "sau" — five files, five words;
      //  · it is written in those files exactly as displayed (bare lowercase —
      //    owner, 2026-09-05) with no CSS re-casing, so the DOM text and the
      //    visible text agree and a voice-control user can say what they see
      //    (fb-133's rule, borrowed from the bulb);
      //  · it is NOT in the document outline. ui/Heading without `asChild`
      //    renders its default <p>, so the panel keeps h2 → h3 · h3 while the
      //    word is a plain <p> wearing the display tokens at 27px against the
      //    group titles' 20px (the owner's 2026-09-05 "~10% smaller" — see the
      //    section's header for why the size lives here and not as a third step
      //    on ui/Heading's axis). A screen-reader user navigating by heading
      //    hears the two channels, not a stray level between them — and reading
      //    the panel linearly still speaks the conjunction in its place, which
      //    is exactly what it is for.
      const { dialog, messages } = mount({ locale, defaultOpen: true });
      const word = divider(dialog());

      expect(word.tagName).toBe('P');
      expect(word).toHaveTextContent(messages.or);
      // Computed, not a class name: the size is an arbitrary rem value, so a
      // typo inside the brackets would still "have" the class and render at the
      // inherited size.
      expect(getComputedStyle(word).fontSize).toBe('27px');
      expect(word).toHaveClass('font-display', 'text-ink-strong');
      // THE TWIN PIN (owner, 2026-09-05): the panel's title wears the SAME 27px
      // dress as this word — that is what made the size a second consumer, and
      // it is the fact ui/Heading's promotion lane will consolidate. Asserted
      // as computed sizes so the two literals cannot drift apart while both
      // still "have" their own class, and UNQUALIFIED by viewport: option B
      // keeps the title at 27px in every state, including the two where the
      // Or-word itself is hidden (this case runs at the runner's default
      // viewport, and the box-matrix cases below cover the tight ones).
      const title = within(dialog()).getByRole('heading', { level: 2 });
      expect(getComputedStyle(title).fontSize).toBe(
        getComputedStyle(word).fontSize,
      );
      expect(getComputedStyle(title).lineHeight).toBe(
        getComputedStyle(word).lineHeight,
      );
      expect(word).not.toHaveAttribute('role');
      expect(
        within(dialog()).queryByRole('heading', { name: messages.or }),
      ).toBeNull();
      // …and the outline is untouched by it: still exactly three headings.
      expect(within(dialog()).getAllByRole('heading')).toHaveLength(3);
      // The fb-133 guard, restated for the 2026-09-05 lowercasing: the file
      // value IS the visible value because no CSS re-casing may touch it.
      expect(getComputedStyle(word).textTransform).toBe('none');
    },
  );

  it('fills the hours caption from lib/clinic.ts, never from a literal', () => {
    // §10.1: the times are the same data the Footer prints and the JSON-LD will
    // publish, interpolated into ONE translated line (the owner's fb-349/350
    // amendment to §10.5 — a caption, not the Footer's <dl> a second time). The
    // rows are read BY DAY here exactly as the section reads them, so a
    // reordered lib/clinic.ts moves both together.
    const weekday = clinic.hours.find((row) => row.days.includes('Monday'));
    const saturday = clinic.hours.find((row) => row.days.includes('Saturday'));
    const { dialog } = mount({ defaultOpen: true });
    const text = dialog().textContent ?? '';

    expect(weekday).toBeDefined();
    expect(saturday).toBeDefined();
    for (const value of [
      weekday?.opens,
      weekday?.closes,
      saturday?.opens,
      saturday?.closes,
    ]) {
      expect(value).toBeTruthy();
      expect(text).toContain(value);
    }
    // …and the ICU placeholders are really gone, not printed as themselves.
    expect(text).not.toMatch(/\{(week|sat)(Opens|Closes)\}/);
  });

  it('rests on ONE weekday row in lib/clinic.ts, Monday through Friday', () => {
    // G2 react MEDIUM fold — the hole this closes: the caption prints a SPAN
    // („Lun–Vin 09:00–19:00"), so it is only true while one entry really covers
    // all five weekdays. Split that entry (Mon–Thu one row, Fri another with a
    // short Friday) and the section's 'Monday' lookup still succeeds, the
    // caption still prints the span — with Monday's times — and the Footer,
    // which renders every row, disagrees with it silently (§10.1).
    // Read STRAIGHT FROM THE DATA, never through the section's own helper: this
    // has to fail even if that guard were ever softened, which is what makes it
    // an outside-in pin rather than a second copy of the same code.
    const byMonday = clinic.hours.find((row) => row.days.includes('Monday'));
    const byFriday = clinic.hours.find((row) => row.days.includes('Friday'));
    const bySaturday = clinic.hours.find((row) =>
      row.days.includes('Saturday'),
    );

    expect(byMonday).toBeDefined();
    // Object IDENTITY, not equal times: two rows that happen to share hours
    // today are still two rows, and the copy would be wrong the day one moves.
    expect(byFriday).toBe(byMonday);
    // …and Saturday is its own row, or the caption prints the same span twice.
    expect(bySaturday).toBeDefined();
    expect(bySaturday).not.toBe(byMonday);
  });

  it('names the dialog with the ONE <h2>, above two <h3> group titles', () => {
    // §9's heading rules for a section: the page owns the <h1>, so the modal
    // opens at h2 — and the dialog's accessible name IS that heading, so a
    // screen reader announces the title once, not twice. The v4 body adds the
    // two channel groups at h3, i.e. the level BELOW the title and in document
    // order under it: logical heading order, never a skipped level.
    const { dialog, messages } = mount({ defaultOpen: true });
    const headings = within(dialog()).getAllByRole('heading');
    const [title, ...groups] = headings;

    expect(headings.map((heading) => heading.tagName)).toEqual([
      'H2',
      'H3',
      'H3',
    ]);
    expect(groups.map((heading) => heading.textContent)).toEqual([
      messages.callHeading,
      messages.whatsappHeading,
    ]);
    expect(dialog()).toHaveAttribute('aria-labelledby', title?.id);
    expect(title?.id).toBeTruthy();
    expect(dialog()).toHaveAccessibleName(ro.contact.heading);
  });

  it('puts the title in the TOP BAR, beside the ✕, not in the body', () => {
    // Owner, 2026-08-27: the <h2> moved from the first line of the body into
    // ui/Modal's `header` slot, centred on the panel. The slot sits BEFORE the
    // ✕ in DOM order, so it is also before it in the Tab order, and the body
    // now opens on the first group's own title.
    const { dialog, messages } = mount({ defaultOpen: true });
    const slot = topBar(dialog()).firstElementChild as HTMLElement;
    const title = within(dialog()).getByRole('heading', { level: 2 });

    expect(slot).toContainElement(title);
    // …and the body carries the group titles ONLY — no second <h2> anywhere.
    const inBody = within(contentRegion(dialog())).getAllByRole('heading');
    expect(inBody.map((heading) => heading.textContent)).toEqual([
      messages.callHeading,
      messages.whatsappHeading,
    ]);
    expect(
      within(contentRegion(dialog())).queryByRole('heading', { level: 2 }),
    ).toBeNull();
  });

  it('reads title → control → caption, twice, in DOM order', () => {
    // The shape of the answer (board v4): each group is a heading, the control
    // it names, and the caption that qualifies it — so a screen reader walking
    // the panel linearly hears "Sunați-ne la / 0700 000 000 / Lun–Vin …" and
    // then the same three beats for WhatsApp. A caption that drifted above its
    // button would still LOOK right at one width and read wrong at every one.
    const weekday = clinic.hours.find((row) => row.days.includes('Monday'));
    // The sibling case's guard rather than a stringification (G2 ts fold):
    // `String(weekday?.opens)` would have asserted against the text "undefined"
    // if the schedule ever stopped covering Monday — a failure naming the DOM
    // instead of the data. The throw is unreachable past the expect and exists
    // only to narrow the type, the same shape childrenOf() uses in
    // FloatingActions.test.tsx for its impossible case.
    expect(weekday).toBeDefined();
    if (!weekday) throw new Error('unreachable: the guard above fails first');

    const { dialog, messages } = mount({ defaultOpen: true });
    const nodes = Array.from(
      contentRegion(dialog()).querySelectorAll<HTMLElement>('h3, a, p'),
    );

    expect(nodes.map((node) => node.tagName)).toEqual([
      'H3',
      'A',
      'P',
      'P',
      'H3',
      'A',
      'P',
    ]);
    expect(nodes[0]).toHaveTextContent(messages.callHeading);
    expect(nodes[1]).toHaveAttribute('href', `tel:${clinic.phone}`);
    expect(nodes[2]).toHaveTextContent(weekday.opens);
    // The Or-word sits BETWEEN the groups in the reading order too, which is
    // the whole reason it is a real text node rather than a drawn rule: linear
    // reading gets "…, Sâm 09:00–14:00 / SAU / Scrieți-ne / …".
    expect(nodes[3]).toHaveTextContent(messages.or);
    expect(nodes[4]).toHaveTextContent(messages.whatsappHeading);
    expect(nodes[5]).toHaveAttribute(
      'href',
      `https://wa.me/${clinic.whatsapp}`,
    );
    expect(nodes[6]).toHaveTextContent(messages.whatsappNote);
  });

  it.each(['ro', 'de'] as const)(
    'gives both controls the SAME width in %s (one rail, no fixed px)',
    (locale) => {
      // §8.4 in one assertion: the two buttons are grid items on one
      // fit-content rail, so the longer label — German's "Kontaktieren Sie uns
      // über WhatsApp" — decides the width of BOTH and neither is pinned to a
      // pixel count that a translation could outgrow. A ragged pair of
      // different-width green blocks is what this prevents.
      const { dialog, messages } = mount({ locale, defaultOpen: true });
      const call = within(dialog()).getByRole('link', {
        name: clinic.phoneDisplay,
      });
      const write = within(dialog()).getByRole('link', {
        name: messages.whatsapp,
      });

      const callWidth = call.getBoundingClientRect().width;
      const writeWidth = write.getBoundingClientRect().width;
      expect(callWidth).toBeGreaterThan(0);
      expect(Math.abs(callWidth - writeWidth)).toBeLessThanOrEqual(1);
    },
  );

  it.each([
    { width: 390, height: 844 },
    { width: 1536, height: 864 },
  ])(
    'gives EVERY language the German control size at $width×$height',
    async ({ width, height }) => {
      // The owner's 2026-09-05 ruling, asserted literally: "i like the german
      // ones very much, keep that sizes of elements throughout all languages".
      // Romanian used to measure 313px against German's 392px at a roomy
      // viewport — the same dialog in two shapes — because a fit-content rail
      // is sized by ITS OWN text. `min-w-[min(24.5rem,100%)]` is the German
      // measurement turned into a floor for everyone, and this is the check
      // that would fail if the floor were dropped, mistyped, or outgrown by a
      // future German string (in which case both locales grow together, which
      // is still a pass — a MINIMUM never freezes the layout).
      // Both sampled widths matter and for different reasons: at 1536 the floor
      // is what does the work, at 390 the panel is narrower than the floor and
      // the `min(…, 100%)` guard makes the two locales equal by the CAP —
      // proving the guard collapses instead of overflowing the box.
      await page.viewport(width, height);
      const measure = (locale: Fixture): number => {
        const { dialog, unmount } = mount({ locale, defaultOpen: true });
        const link = within(dialog()).getByRole('link', {
          name: clinic.phoneDisplay,
        });
        const measured = link.getBoundingClientRect().width;
        unmount();
        return measured;
      };

      const ro_ = measure('ro');
      const de_ = measure('de');
      expect(ro_).toBeGreaterThan(0);
      expect(Math.abs(ro_ - de_)).toBeLessThanOrEqual(1);
      await page.viewport(414, 896);
    },
  );
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
// own middle. The second half is arithmetic, and it moved twice: once when the
// v4 rework put two channel groups where a lead and one control used to be,
// and again on 2026-09-05, twice in one day: first the owner's Or-divider added
// its own line plus a second rail gap, then the "it looks very crammed" round
// added air to the four MACRO seams (bar→rail, both sides of the divider, and
// below the second group). MEASURED with the real subset loaded, RO / DE:
//   320×568   478 / 506  (+58 / +30)   ← the worst upright case in the product
//   390×844   530 / 506  (+282 / +306)
//   768×1024 · 1280×800 · 1536×864 · 1920×1080   494 / 494, hundreds to spare
//   844×390   350 / 350  (+8)          ← sideways, tight rhythm, divider hidden
//   844×536   350 / 350  (+154)        ← the height query's last row
//   844×537   494 / 494  (+11)         ← the first row above it, airy again
// The two states MEET at 536/537 with no gap between them, which is the whole
// claim: there is no viewport height at which this dialog scrolls.
// SIDEWAYS IS WHERE IT IS PAID FOR, and it is paid ONLY there: the seams
// collapse and the divider hides under `@media (max-height: 33.5rem)`, so no
// upright §7 viewport is ever in that state — the 2026-09-05 live review is
// what keeps it out of them. The 320px stress width has its OWN lever,
// `@media (max-width: 21.25rem)`: collapsed seams WITH the divider still at
// full size, which is what keeps German at 506px against that phone's 536px
// budget.
//
// The matrix has two axes, because the panel's height is content × typography:
// the WIDTH — both phone sizes the §13 matrix samples, plus the 320px
// accessibility stress width (§7) — and the LANGUAGE, where German is the
// longest this site speaks (§8.4, ≈ +30–35%): its title fills the bar and its
// WhatsApp label is the string the shared rail is sized by, in every locale
// (the 24.5rem floor). DE at 320 is therefore the worst case in the whole
// product, and it is in here. The sideways phone follows in BOTH languages,
// because that is where the box has the least room and the panel only fits
// while the title and both captions hold one line each.
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
   * collapsed one — the bar, two group titles, two 3.5rem controls and two
   * captions clear 300px at every width this site serves, and the assertion is
   * deliberately below the 350–530px the card measures across both rhythms, so
   * it catches a collapse (a group that stopped rendering) without pinning a
   * pixel height no one promised.
   */
  const expectUncappedBox = (dialog: HTMLDialogElement) => {
    const box = panelBox(dialog);
    const content = contentRegion(dialog);

    expect(content).not.toHaveAttribute('role');
    expect(content).not.toHaveAttribute('tabindex');
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    expect(box.getBoundingClientRect().height).toBeGreaterThan(300);
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

  it('breathes by default and tightens ONLY where the room runs out', async () => {
    // The two owner rulings, in one case (fb-354's air + the 2026-09-05 "too
    // crammed" review vs the Q1 motionless-landscape demand): the rhythm is
    // state-dependent, and the state is the VIEWPORT'S HEIGHT.
    // Read as COMPUTED STYLE against the real compiled sheet, not as class
    // names: an arbitrary variant that Tailwind failed to emit — the one real
    // risk of `[@media(max-height:33.5rem)]:gap-1` — still appears in the class
    // list while changing nothing, and only getComputedStyle can tell those two
    // apart. Same for the divider's `hidden`.
    // The SAME element is measured at both viewports, without remounting, which
    // additionally proves this is a live media query rather than a decision
    // taken once at mount (a phone turned in the hand re-lays out; nothing
    // re-renders).
    await page.viewport(390, 844);
    const { dialog } = mount({ defaultOpen: true });
    await document.fonts.ready;
    await flush();

    const groups = rail(dialog());
    const firstGroup = groups.firstElementChild as HTMLElement;
    const word = divider(dialog());
    // AIRY — the four MACRO seams the owner enumerated on 2026-09-05 ("it looks
    // very crammed"), which are the seams BETWEEN blocks and not the stacks
    // inside them: the bar→rail seam (mt-3), the two rail gaps that now flank
    // the divider (gap-7), and the seam below the second group (mb-4). The
    // in-group rhythm is untouched at gap-2 — it was never on the owner's list.
    expect(getComputedStyle(groups).rowGap).toBe('28px');
    expect(getComputedStyle(groups).marginTop).toBe('12px');
    expect(getComputedStyle(groups).marginBottom).toBe('16px');
    expect(getComputedStyle(firstGroup).rowGap).toBe('8px');
    expect(getComputedStyle(word).display).not.toBe('none');

    await page.viewport(844, 390);
    await flush();

    // TIGHT — and byte-identical to what it measured before the air landed:
    // this state has 4px of slack, so every one of the four seams collapses
    // back (gap-1 on the rail, gap-0 inside a group, no margins — option B's
    // deeper collapse, which is what the 27px title's second line costs) and
    // the divider yields with them (owner,
    // 2026-09-05). Two stacked green controls under a title that already names
    // both channels still read as alternatives.
    expect(getComputedStyle(groups).rowGap).toBe('4px');
    expect(getComputedStyle(groups).marginTop).toBe('0px');
    expect(getComputedStyle(groups).marginBottom).toBe('0px');
    expect(getComputedStyle(firstGroup).rowGap).toBe('0px');
    expect(getComputedStyle(word).display).toBe('none');

    // …and the airy rhythm WITH the word is what EVERY §7 upright viewport
    // gets: 568px is the shortest of them (the 320 stress phone) and it is
    // above the 536px query, so no story, baseline or real page in the set is
    // ever photographed without the divider.
    for (const height of [568, 800, 844, 864, 1024, 1080]) {
      await page.viewport(390, height);
      await flush();
      expect(getComputedStyle(groups).rowGap, `${height}px tall`).toBe('28px');
      expect(getComputedStyle(word).display, `${height}px tall`).toBe('block');
    }

    // THE NARROW LEVER is the other axis, and it does NOT take the word with
    // it: at the 320px stress width the seams collapse (that is what buys
    // German its slack) while the divider stays visible AT FULL SIZE — the
    // owner's lever order for an upright overflow.
    await page.viewport(320, 568);
    await flush();
    expect(getComputedStyle(groups).rowGap).toBe('4px');
    expect(getComputedStyle(groups).marginTop).toBe('0px');
    expect(getComputedStyle(firstGroup).rowGap).toBe('0px');
    expect(getComputedStyle(word).display).toBe('block');
    expect(getComputedStyle(word).fontSize).toBe('27px');

    // THE TITLE NEVER YIELDS — option B (owner, 2026-09-05). The seams collapse
    // and the word can hide, but the 27px dress the owner asked for holds at
    // every viewport, in both tight states as well as the airy one. Checked
    // here at 320 and again on the sideways phone, which are precisely the two
    // states where a size fallback would have been the cheaper fix and was
    // deliberately not taken.
    const title = within(dialog()).getByRole('heading', { level: 2 });
    expect(getComputedStyle(title).fontSize).toBe('27px');
    await page.viewport(844, 390);
    await flush();
    expect(getComputedStyle(title).fontSize).toBe('27px');
  });

  it('centres a WhatsApp label that wraps, in the language that wraps it', async () => {
    // Owner, 2026-09-05: "on Kontaktieren Sie uns über WhatsApp i want the text
    // centered when it goes on 2 lines". ui/Button centres the flex ROW, which
    // places glyph+label as a group but leaves the label's own lines ragging
    // left; `text-center` from this section governs those lines (§6.8: a parent
    // utility on the atom's root, not a restyle of its internals).
    // 320 + German is the case that HAS the wrap — the assertion checks both
    // halves, because a centring class on a label that never wraps proves
    // nothing.
    await page.viewport(320, 568);
    const { dialog, messages } = mount({ locale: 'de', defaultOpen: true });
    await document.fonts.ready;
    await flush();

    const write = within(dialog()).getByRole('link', {
      name: messages.whatsapp,
    });
    const lineHeight = Number.parseFloat(getComputedStyle(write).lineHeight);

    expect(getComputedStyle(write).textAlign).toBe('center');
    expect(lineHeight).toBeGreaterThan(0);
    // It really does wrap here: the control is taller than two of its own line
    // boxes, which no single-line label can be.
    expect(write.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      lineHeight * 2,
    );
    // …and the call control carries the same spelling, so the pair cannot
    // diverge the day a display format grows long enough to wrap.
    expect(
      getComputedStyle(
        within(dialog()).getByRole('link', { name: clinic.phoneDisplay }),
      ).textAlign,
    ).toBe('center');
  });

  it.each(['ro', 'de'] as const)(
    'holds the whole box in %s even on a phone held sideways',
    async (locale) => {
      // 844×390 is the same phone turned over: 358px of room under the layer's
      // 1rem margins, and the tightest case the site has. The airy rhythm does
      // NOT fit it — 378px before the divider, 494px with it and the air — so
      // the owner chose to tighten (2026-09-04) and to drop the divider here
      // (2026-09-05) rather than accept a scrolling layer: "nothing scrolls, at
      // any size" is the rule, and it has now survived both a second channel
      // and a flourish. This viewport is 390px tall, i.e. inside the panel's
      // `max-height: 33.5rem` query, so what renders here is the tight rhythm
      // with no word between the groups, and the box measures 350px in BOTH
      // languages: 8px of slack, and the whole dialog is motionless.
      // Passing THIS case is therefore also proof that both variants engaged —
      // an unstyled or mis-compiled one would put 374 or 494px back and fail on
      // the layer's scrollHeight.
      // So this case asserts the STRONG property, as it did before the rework:
      // not one box on the screen scrolls, and the panel sits fully inside the
      // viewport with its top edge visible at rest.
      await page.viewport(844, 390);
      const { dialog } = mount({ locale, defaultOpen: true });
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

      // THE DIVIDER YIELDS HERE, and it yields by CSS rather than by being
      // un-rendered: the element stays in the DOM (nothing about this dialog
      // branches on the viewport at render time, §16) and `display: none` takes
      // it out of the picture and out of the accessibility tree both.
      // Asserted as VISIBILITY, not as a text query: getByText matches hidden
      // nodes too, so it would pass on a divider that still occupied 36px.
      expect(getComputedStyle(divider(layer)).display).toBe('none');
      expect(divider(layer)).not.toBeVisible();
      expect(divider(layer)).toHaveTextContent(MESSAGES[locale].contact.or);

      // THE CONDITION THE 8px OF SLACK RESTS ON, and it CHANGED on 2026-09-05
      // when the title took the Or-word's 27px: the bar holds TWO lines here
      // now, not one. That is measured and budgeted for (the bar grew 68 → 88px
      // and the tight state absorbed it by collapsing its gaps to 4px/0), so
      // the guard moved with the fact instead of being deleted: the title may
      // wrap to two lines and no further, and each caption still holds exactly
      // one. A third title line, or a caption that wrapped, would add ~32px
      // where 8 are spare.
      // Measured against each element's OWN computed line-height rather than a
      // pixel constant, so it keeps meaning the same thing if the type scale
      // moves; the +0.5 in each bound is the honest midpoint between N and N+1
      // lines.
      const atMostLines = (el: HTMLElement, lines: number) => {
        const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
        expect(lineHeight).toBeGreaterThan(0);
        expect(el.getBoundingClientRect().height).toBeLessThan(
          lineHeight * (lines + 0.5),
        );
      };

      atMostLines(within(layer).getByRole('heading', { level: 2 }), 2);
      // The body's <p>s are the two captions AND the hidden divider — three
      // elements, of which the two inside the groups are the ones that must
      // hold one line (the divider is display:none here and measures zero).
      const captions = Array.from(rail(layer).children)
        .filter((child) => child !== divider(layer))
        .map((group) => group.querySelector('p'))
        .filter((caption): caption is HTMLParagraphElement => caption !== null);
      expect(captions).toHaveLength(2);
      for (const caption of captions) atMostLines(caption, 1);
    },
  );
});
