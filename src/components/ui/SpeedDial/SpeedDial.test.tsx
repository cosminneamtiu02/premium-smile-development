import { createRef, type ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses.
// The `ui/disc.ts` suite at the bottom is meaningless without it: `--disc-size`
// is a CSS variable with a fallback, so "56px at the step, 72px when a host
// overrides it" is a COMPUTED size, never a class name. Everything else in this
// file reads tokens, exactly as GlyphButton.test.tsx does.
import '@/styles/globals.css';
import { GlyphButton } from '../GlyphButton/GlyphButton';
import {
  SpeedDial,
  type SpeedDialDirection,
  type SpeedDialOption,
  type SpeedDialProps,
  type SpeedDialSize,
  type SpeedDialTone,
} from './SpeedDial';

// Role-based queries on purpose (§3, §9): a passing test doubles as proof of
// accessible markup — getByRole('button', { name }) only finds a control the
// platform actually names, and the four discs are only reachable as `link`s
// because they really are anchors (D2 = B′). Fixtures are Romanian with
// diacritics (§15.7): the five site locales, which is also the atom's first
// consumer (sections/LanguageSwitcher, Lane B).
//
// TWO event sources, deliberately — the Modal precedent:
//  · `userEvent` from vitest/browser drives the REAL browser (Playwright/CDP),
//    so clicks, Tab presses and Escape are TRUSTED events with real default
//    actions and real focus modality (:focus-visible).
//  · `fireEvent` is used where a SPECIFIC synthetic event is the point: a
//    pointerdown at a place no real mouse could aim at without measuring the
//    layout first, a focusout carrying `relatedTarget: null` (the Safari case,
//    board §8), and the two page-lifecycle events.

const GLYPH = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12h16" stroke="currentColor" fill="none" />
  </svg>
);

const LANGUAGES = [
  {
    value: 'ro',
    code: 'RO',
    label: 'Română',
    lang: 'ro',
    href: '/ro/services/',
  },
  {
    value: 'en',
    code: 'EN',
    label: 'English',
    lang: 'en',
    href: '/en/services/',
  },
  {
    value: 'de',
    code: 'DE',
    label: 'Deutsch',
    lang: 'de',
    href: '/de/services/',
  },
  {
    value: 'fr',
    code: 'FR',
    label: 'Français',
    lang: 'fr',
    href: '/fr/services/',
  },
  {
    value: 'it',
    code: 'IT',
    label: 'Italiano',
    lang: 'it',
    href: '/it/services/',
  },
] as const;

type Lang = (typeof LANGUAGES)[number]['value'];

// The bulb's name is STATE-INVARIANT and starts with the current endonym, so
// the visible "RO" is contained in it (SC 2.5.3, D10). tests/unit/locales.test.ts
// pins the data fact this leans on.
const RO_LABEL = 'Română · schimbă limba';
const DE_LABEL = 'Deutsch · Sprache ändern';

// A same-page chooser (D2 = B′): no hrefs, so every disc is a <button> and
// onSelect is the whole outcome.
const DURATIONS: readonly SpeedDialOption[] = [
  { value: '15', code: '15', label: '15 minute' },
  { value: '30', code: '30', label: '30 de minute' },
  { value: '45', code: '45', label: '45 de minute' },
  { value: '60', code: '60', label: '60 de minute' },
];

/**
 * ART, the dressing the owner asked for on 2026-09-04 (board
 * .claude/plans/speed-dial-flags.plan.md) — and deliberately NOT the five real
 * flag components. The atom has never heard of a flag (D2): `art` is a
 * ReactNode it clips, covers, hides and scrims without ever looking inside, so
 * its own suite hands it the dumbest node that can still be told one from
 * another — an <svg> carrying its option's value. That the REAL flags arrive
 * through the hook is proved one tier up, in
 * sections/LanguageSwitcher.test.tsx, which is where flags become a fact.
 */
const artOf = (value: string) => (
  <svg data-art={value} viewBox="0 0 3 2" aria-hidden="true">
    <rect width="3" height="2" fill="#002B7F" />
  </svg>
);

const FLAGGED: readonly SpeedDialOption<Lang>[] = LANGUAGES.map((option) => ({
  ...option,
  art: artOf(option.value),
}));

const OUTSIDE = 'Ieșire';

/**
 * Room for the stem — the whole point of the wrapper. The discs are absolutely
 * positioned OUTSIDE the root's own box, so a dial rendered at the top-left of
 * the document would unfold its `up` stem above y = 0, where the real browser
 * driving these tests cannot click. The trailing button is the "outside" the
 * pointerdown and focus-out suites need, and it sits AFTER the dial so Tab
 * leaves the root through it.
 */
function Ground({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '18rem' }}>
      {children}
      <button type="button">{OUTSIDE}</button>
    </div>
  );
}

type DialProps = SpeedDialProps<Lang>;

const mount = (props: Partial<DialProps> = {}) => {
  const merged: DialProps = {
    options: LANGUAGES,
    value: 'ro',
    'aria-label': RO_LABEL,
    ...props,
  };
  return render(<SpeedDial {...merged} />, { wrapper: Ground });
};

const bulbOf = (name = RO_LABEL) => screen.getByRole('button', { name });
const listOf = (name = RO_LABEL) => {
  const id = bulbOf(name).getAttribute('aria-controls') ?? '';
  const list = document.querySelector(`#${id}`);
  if (!(list instanceof HTMLUListElement)) {
    throw new Error(`aria-controls "${id}" does not resolve to the <ul>`);
  }
  return list;
};
const discsOf = (name = RO_LABEL) =>
  Array.from(listOf(name).querySelectorAll<HTMLElement>('a, button'));
const rootOf = (name = RO_LABEL) => {
  const root = bulbOf(name).parentElement?.parentElement;
  if (!(root instanceof HTMLDivElement)) {
    throw new Error('the bulb is not two <div>s deep — the root shape moved');
  }
  return root;
};
const tokensOf = (el: Element) => el.className.split(/\s+/).filter(Boolean);

const open = async (name = RO_LABEL) => {
  await userEvent.click(bulbOf(name));
  return bulbOf(name);
};

// Test environment, not product styling: unlayered author CSS beats Tailwind's
// @layer utilities without !important. The stencil sweep and the 60ms stagger
// are visual concerns, verified in the compiled CSS and disabled in every
// snapshot (§13) — a unit test must never wait out a 300ms clock, and asserting
// inside one is how a suite goes CI-flaky (memory: tests-with-real-css-disable-
// transitions, PR #45). Everything below therefore asserts IMMEDIATELY.
let stillnessStyle: HTMLStyleElement | null = null;

// Real anchors in a real browser: an unguarded disc click would NAVIGATE the
// runner away mid-suite. This listener sits on `document`, in the BUBBLE phase,
// so it runs AFTER React's root-container handler — late enough to record what
// the atom did (D2: `defaultPrevented` must be FALSE, the browser performs the
// navigation) and still early enough to cancel the default action itself.
const clicks: boolean[] = [];
const guardNavigation = (event: MouseEvent) => {
  clicks.push(event.defaultPrevented);
  event.preventDefault();
};

beforeAll(() => {
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent =
    '[aria-controls], [aria-controls] ~ ul, [aria-controls] ~ ul * { transition: none; }';
  document.head.append(stillnessStyle);
  document.addEventListener('click', guardNavigation);
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
  document.removeEventListener('click', guardNavigation);
});

beforeEach(() => {
  clicks.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  // A leaked NODE_ENV stub would silence every later tripwire assertion.
  vi.unstubAllEnvs();
});

// ─────────────────────────────────────────────────────────────────────────────
// The class tables. Each one is a Record<Union, …> at module scope (the
// GlyphButton pattern), so a fifth direction, a third size or a third tone
// cannot ship with zero token coverage: the file stops typechecking until it is
// classified here. The cap sweep and the motion sweep DERIVE their matrices
// from these, inheriting the exhaustiveness.

const directionTokens: Record<SpeedDialDirection, string[]> = {
  up: [
    'bottom-1/2', // the stem's start end sits at the bulb's centre (fb-262)
    'inset-x-px', // the tube = the bulb minus 2px — room for a disc's ring
    'flex-col-reverse', // first disc nearest the bulb (D7)
    'pb-[calc(var(--bulb)/2+0.375rem)]',
    '[clip-path:inset(100%_0_0_0_round_9999px)]',
    'max-h-[calc(100dvh-var(--bulb)/2-var(--stem-inset,1rem))]',
    'overflow-y-auto',
  ],
  down: [
    'top-1/2',
    'inset-x-px',
    'flex-col',
    'pt-[calc(var(--bulb)/2+0.375rem)]',
    '[clip-path:inset(0_0_100%_0_round_9999px)]',
    'max-h-[calc(100dvh-var(--bulb)/2-var(--stem-inset,1rem))]',
    'overflow-y-auto',
  ],
  right: [
    'left-1/2',
    'inset-y-px',
    'flex-row',
    'pl-[calc(var(--bulb)/2+0.375rem)]',
    '[clip-path:inset(0_100%_0_0_round_9999px)]',
    'max-w-[calc(100dvw-var(--bulb)/2-var(--stem-inset,1rem))]',
    'overflow-x-auto',
  ],
  left: [
    'right-1/2',
    'inset-y-px',
    'flex-row-reverse',
    'pr-[calc(var(--bulb)/2+0.375rem)]',
    '[clip-path:inset(0_0_0_100%_round_9999px)]',
    'max-w-[calc(100dvw-var(--bulb)/2-var(--stem-inset,1rem))]',
    'overflow-x-auto',
  ],
};

// The tokens that must belong to EXACTLY ONE direction — position and stencil.
// Asserted negatively below, because "carries its own" alone would still pass
// if a row accidentally carried all four positions at once.
const exclusiveTokens: Record<SpeedDialDirection, string[]> = {
  up: ['bottom-1/2', '[clip-path:inset(100%_0_0_0_round_9999px)]'],
  down: ['top-1/2', '[clip-path:inset(0_0_100%_0_round_9999px)]'],
  right: ['left-1/2', '[clip-path:inset(0_100%_0_0_round_9999px)]'],
  left: ['right-1/2', '[clip-path:inset(0_0_0_100%_round_9999px)]'],
};

// The stem's own tokens, direction-independent (D8 + the pre-`inert` belt).
const stemTokens = [
  'inert:invisible',
  'transition-[clip-path,visibility]',
  '[transition-duration:300ms,0s]',
  'inert:[transition-delay:0s,300ms]',
  'ease-out',
  'motion-reduce:transition-none',
];

const sizeTokens: Record<SpeedDialSize, { root: string[]; bulb: string[] }> = {
  md: {
    root: [
      '[--bulb:var(--disc-size,2.75rem)]',
      '[--disc:calc(var(--bulb)*8/11)]',
    ],
    bulb: ['size-[var(--disc-size,2.75rem)]'], // 44px at the fallback — §9 target
  },
  lg: {
    root: [
      '[--bulb:var(--disc-size,3.5rem)]',
      '[--disc:calc(var(--bulb)*11/14)]',
    ],
    bulb: ['size-[var(--disc-size,3.5rem)]'], // 56px — the FloatingActions corner
  },
};

// The tone dresses the BULB and stops there (owner reversal of D5, Storybook
// review 2026-08-27): a Record of one string per tone, not a chosen/creep pair.
const toneTokens: Record<SpeedDialTone, string[]> = {
  ink: [
    'bg-inverse-surface',
    'text-ink-inverse',
    'hover:bg-ink-strong',
    'active:bg-ink-strong',
  ],
  cta: [
    'bg-cta',
    'text-ink-inverse',
    'hover:bg-cta-hover',
    'active:bg-cta-hover',
  ],
};

// What every stem disc wears INSTEAD, in every tone: GlyphButton's ghost bundle
// plus a resting ring. Transparent at rest, the quiet tray on hover/press, and
// a border that never recolours — so the only thing a keyboard shows is
// discBase's outline ring (parity with GlyphButton ghost).
const discGhostTokens = [
  'border',
  'border-line',
  'bg-transparent',
  'text-ink',
  'hover:bg-line-subtle',
  'active:bg-line-subtle',
];

// ── THE ART TABLES (speed-dial-flags lane). Copied from the treatment the
// owner tuned live over six rounds on 2026-09-05 and froze in
// src/assets/flags/Flags.stories.tsx (TreatmentPreview): a whisper of a scrim,
// weight-640 white codes one size step up, and an 8-way 1px ink HALO — a halo
// borders the glyph from OUTSIDE, so unlike the centered text-stroke of rounds
// 3–5 it never eats into the letter body. Pinned as tokens, the discRest way:
// what the atom EMITS is the contract, and the pixels are the visual net's job.
const HALO =
  '[text-shadow:1px_0_var(--color-ink),-1px_0_var(--color-ink),0_1px_var(--color-ink),0_-1px_var(--color-ink),1px_1px_var(--color-ink),1px_-1px_var(--color-ink),-1px_1px_var(--color-ink),-1px_-1px_var(--color-ink)]';

const artLetterTokens = [
  'text-ink-inverse', // white on every flag, both tones, stem discs included
  'font-[640]', // the variable wght axis: round 5's 800 ceiling × 0.8
  'text-[max(1rem,calc(var(--bulb)*9/28))]', // ONE step above the artless 2/7
  HALO,
];

const artLayerTokens = [
  'absolute',
  'inset-0',
  'overflow-hidden', // the circle is what crops the flag…
  'rounded-full', // …and this is the circle
  '[&_svg]:size-full', // whatever svg the consumer passed covers the box
  'forced-colors:hidden', // WHC strips the halo but not svg fills — art yields
];

const artScrimTokens = [
  'absolute',
  'inset-0',
  'rounded-full', // the scrim's OWN clip — square corners outside the circle without it (owner, 2026-09-05)
  'bg-ink/5',
  'transition-[background-color]',
  'duration-(--fade)', // discBase's own clock, inherited down from the control
  'ease-in-out',
  'group-hover:bg-ink/20', // the flagged disc's hover MANNER
  'group-active:bg-ink/20',
  'motion-reduce:transition-none',
  'forced-colors:hidden', // yields with the art layer (G2 a11y, 2026-09-05)
];

const DIRECTIONS = Object.keys(directionTokens) as SpeedDialDirection[];
const SIZES = Object.keys(sizeTokens) as SpeedDialSize[];
const TONES = Object.keys(toneTokens) as SpeedDialTone[];

// ─────────────────────────────────────────────────────────────────────────────

describe('SpeedDial — closed: the resting state the build writes into the HTML', () => {
  it('is ONE button, named by the required label, collapsed, printing the current code', () => {
    mount();
    const bulb = bulbOf();
    expect(screen.getAllByRole('button', { name: RO_LABEL })).toHaveLength(1);
    expect(bulb).toHaveAttribute('aria-expanded', 'false');
    expect(bulb).toHaveAttribute('type', 'button');
    // DOM text = visible text (fb-133): 'RO' arrives already uppercased.
    expect(bulb).toHaveTextContent('RO');
  });

  it('names its list with an id a plain CSS selector can find (React 19 useId)', () => {
    // The visual runner waits for `#${aria-controls}` (tests/visual/stories.spec.ts),
    // so an id the selector parser rejects would break the baselines, not the
    // unit suite. React 19.2 emits `_R_0_`; the assertion is that it RESOLVES.
    mount();
    const id = bulbOf().getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(document.querySelector(`#${id}`)).toBe(listOf());
  });

  it('keeps the stem inert while closed — invisible AND dead (D8 = M)', () => {
    mount();
    expect(listOf()).toHaveAttribute('inert');
  });

  it('never renders a disc for the current value — it IS the bulb (D1)', () => {
    mount();
    expect(screen.queryByRole('link', { name: 'Română' })).toBeNull();
    expect(discsOf()).toHaveLength(LANGUAGES.length - 1);
    // Asserted at the DOM level too, on purpose: the closed stem is
    // `inert:invisible`, and a role query skips anything `visibility: hidden`
    // — so the line above would now pass even for a disc that IS rendered.
    // This one cannot be fooled by the stem being hidden.
    expect(discsOf().map((disc) => disc.getAttribute('aria-label'))).toEqual([
      'English',
      'Deutsch',
      'Français',
      'Italiano',
    ]);
  });
});

describe('SpeedDial — opening (the two-line algorithm, D1 · D7)', () => {
  it('flips exactly two switches and reports the change once', async () => {
    const onOpenChange = vi.fn();
    mount({ onOpenChange });
    const bulb = await open();
    expect(bulb).toHaveAttribute('aria-expanded', 'true');
    expect(listOf()).not.toHaveAttribute('inert');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it.each([
    ['ro' as const, RO_LABEL, ['English', 'Deutsch', 'Français', 'Italiano']],
    ['de' as const, DE_LABEL, ['Română', 'English', 'Français', 'Italiano']],
    [
      'it' as const,
      'Italiano · cambia lingua',
      ['Română', 'English', 'Deutsch', 'Français'],
    ],
  ])(
    'value %s puts the rest along the stem in `options` order, nearest first',
    async (value, label, expected) => {
      mount({ value, 'aria-label': label });
      await open(label);
      const names = discsOf(label).map((disc) =>
        disc.getAttribute('aria-label'),
      );
      expect(names).toEqual(expected);
    },
  );

  it('gives every disc its href, its own language and a spoken endonym', async () => {
    mount();
    await open();
    const list = within(listOf());
    for (const option of LANGUAGES.filter((o) => o.value !== 'ro')) {
      const disc = list.getByRole('link', { name: option.label });
      expect(disc).toHaveAttribute('href', option.href);
      expect(disc).toHaveAttribute('lang', option.lang);
      expect(disc).toHaveAttribute('hreflang', option.lang);
      // The abbreviation is the CONTENT; the endonym is the name (§6.3).
      expect(disc).toHaveTextContent(option.code);
    }
  });

  it('closes again on a second tap and never reports a selection (D11 row 1)', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    mount({ onSelect, onOpenChange });
    await open();
    await userEvent.click(bulbOf());
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(listOf()).toHaveAttribute('inert');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
});

describe('SpeedDial — picking a disc (D2 = B′)', () => {
  it('hands back the WHOLE option and lets the browser navigate', async () => {
    const onSelect = vi.fn();
    mount({ onSelect });
    await open();
    // The bulb's own click is in the log too — the disc's is the one on trial.
    clicks.length = 0;
    await userEvent.click(
      within(listOf()).getByRole('link', { name: 'Deutsch' }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    // The whole option, plus the click EVENT — a ctrl/cmd-click opens a new tab
    // and leaves THIS document alone, so a side effect that assumes "we are
    // leaving" needs the modifier keys to decide (D2, additive argument).
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'de',
        code: 'DE',
        label: 'Deutsch',
        lang: 'de',
        href: '/de/services/',
      }),
      expect.objectContaining({ type: 'click' }),
    );
    // The atom does NOT preventDefault: the href is the outcome, and the
    // section's cookie write is a side effect on the way out (D2).
    expect(clicks).toEqual([false]);
  });

  it('leaves a link pick alone — the page is leaving, not re-rendering', async () => {
    mount();
    await open();
    await userEvent.click(
      within(listOf()).getByRole('link', { name: 'English' }),
    );
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders an href-less option as a <button>, never an <a>', async () => {
    render(
      <SpeedDial
        options={DURATIONS}
        value="30"
        aria-label="30 de minute · schimbă durata"
      />,
      { wrapper: Ground },
    );
    const label = '30 de minute · schimbă durata';
    await open(label);
    const list = within(listOf(label));
    expect(list.queryAllByRole('link')).toHaveLength(0);
    for (const option of DURATIONS.filter((o) => o.value !== '30')) {
      const disc = list.getByRole('button', { name: option.label });
      expect(disc).toHaveAttribute('type', 'button');
      expect(disc).not.toHaveAttribute('href');
    }
  });

  it('closes an href-less pick and hands focus back to the bulb', async () => {
    // BUILDER RULE, filling a board gap: with no navigation to end the
    // interaction, leaving the dial open would strand focus on a disc the
    // parent may re-render away. Reported first, then closed.
    const onSelect = vi.fn();
    const label = '30 de minute · schimbă durata';
    render(
      <SpeedDial
        options={DURATIONS}
        value="30"
        aria-label={label}
        onSelect={onSelect}
      />,
      { wrapper: Ground },
    );
    await open(label);
    const before = window.location.href;
    await userEvent.click(
      within(listOf(label)).getByRole('button', { name: '45 de minute' }),
    );
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        value: '45',
        code: '45',
        label: '45 de minute',
      }),
      expect.objectContaining({ type: 'click' }),
    );
    expect(window.location.href).toBe(before);
    expect(bulbOf(label)).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(bulbOf(label));
  });

  it('dresses both kinds of disc identically — a mixed dial is still one dial', async () => {
    const mixed: readonly SpeedDialOption[] = [
      { value: 'ro', code: 'RO', label: 'Română', lang: 'ro', href: '/ro/' },
      { value: 'en', code: 'EN', label: 'English', lang: 'en', href: '/en/' },
      // 'AL' inside 'Altă acțiune' — the fixture obeys the Label-in-Name rule
      // the atom tripwires in dev.
      { value: 'al', code: 'AL', label: 'Altă acțiune' },
    ];
    render(<SpeedDial options={mixed} value="ro" aria-label={RO_LABEL} />, {
      wrapper: Ground,
    });
    await open();
    const [link, button] = discsOf();
    expect(link.tagName).toBe('A');
    expect(button.tagName).toBe('BUTTON');
    expect(link.className).toEqual(button.className);
  });
});

describe('SpeedDial — every way it closes (D11)', () => {
  it('Esc closes it and puts focus back on the bulb', async () => {
    mount();
    await open();
    await userEvent.keyboard('{Escape}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(bulbOf());
  });

  it('a pointer press OUTSIDE the root closes it', async () => {
    mount();
    await open();
    fireEvent.pointerDown(document.body);
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a pointer press on the stem itself changes nothing', async () => {
    mount();
    await open();
    fireEvent.pointerDown(listOf());
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('Tab past the last disc closes it — no orphan pill for keyboard users', async () => {
    mount();
    await open();
    const discs = discsOf();
    discs[discs.length - 1].focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: OUTSIDE })).toHaveFocus();
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('IGNORES a blur with no relatedTarget (Safari does not focus on click)', async () => {
    mount();
    await open();
    fireEvent.focusOut(discsOf()[0], { relatedTarget: null });
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on the way OUT so the bfcache snapshot is clean (pagehide)', async () => {
    mount();
    await open();
    fireEvent(window, new PageTransitionEvent('pagehide', { persisted: true }));
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on a bfcache RESTORE (pageshow, persisted)', async () => {
    mount();
    await open();
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('leaves an ordinary pageshow alone — only a restore is worth acting on', async () => {
    mount();
    await open();
    fireEvent(
      window,
      new PageTransitionEvent('pageshow', { persisted: false }),
    );
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HOVER — the owner's 2026-09-04 request ("i want language switcher also on
// hover to open, not just on click"), built to
// .claude/plans/speed-dial-hover.plan.md. Three facts shape every case below.
//
//  · THE POINTER IS PHYSICAL AND IT PERSISTS. Browser mode runs this whole file
//    in one page, so the CDP mouse is still parked wherever the previous case
//    left it — and a move onto the element it is ALREADY on crosses no
//    boundary, which means no pointerenter and no dwell. Every case here
//    therefore parks it on the OUTSIDE button first; that move is also what
//    cancels any dwell a fresh render under the resting cursor may have
//    started (Chromium re-computes hover when the layout changes beneath it).
//  · THE TWO CLOCKS ARE THE ATOM'S, restated here as literals the way the rest
//    of this file restates a token: 150ms of dwell before it opens, 300ms of
//    grace after the pointer leaves. A drift in either shows up as a red case.
//  · END STATES ONLY, on real timers. There is no fake clock in browser mode,
//    and sampling INSIDE a 150/300ms window is exactly how a suite goes
//    CI-flaky (memory: tests-with-real-css-disable-transitions, PR #45):
//    `waitFor` for the flips, one `settle()` well past the window for the
//    "and then nothing happened" ones.
//
// The CLICK paths are deliberately NOT re-proved here — every suite above
// already drives this dial with real clicks, and they must all stay green
// untouched. That is the point of the dwell: a click always arrives after a
// pointerenter (real CDP and synthetic user-event alike), and cancelling the
// timers on the bulb's own click is what keeps click semantics byte-identical.
describe('SpeedDial — hover opens it (mouse only), hover-away closes what hover opened', () => {
  const outside = () => screen.getByRole('button', { name: OUTSIDE });

  const settle = (ms: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  /** Move the REAL pointer clear of the dial — see the note above. */
  const park = async () => {
    await userEvent.hover(outside());
  };

  /** Open it the new way: arrive, rest, unfold. No click anywhere. */
  const hoverOpen = async (name = RO_LABEL) => {
    await userEvent.hover(bulbOf(name));
    await waitFor(() =>
      expect(bulbOf(name)).toHaveAttribute('aria-expanded', 'true'),
    );
    return bulbOf(name);
  };

  it('opens after the dwell when a real mouse comes to rest on it', async () => {
    const onOpenChange = vi.fn();
    mount({ onOpenChange });
    await park();
    await userEvent.hover(bulbOf());
    await waitFor(() =>
      expect(bulbOf()).toHaveAttribute('aria-expanded', 'true'),
    );
    // The same two switches a tap flips, and nothing else (D8 = M).
    expect(listOf()).not.toHaveAttribute('inert');
    // ONE report per REAL flip: a timer must never re-report a state the dial
    // is already in.
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('never opens for a TOUCH pointer — a tap would open and close in one act', async () => {
    // fireEvent because the SPECIFIC synthetic events are the point (the file's
    // two-source doctrine): a finger that lands on the dial and drags — the
    // first frames of a page scroll — sends exactly this, and the real mouse
    // this runner drives cannot. Unguarded it would unfold the dial under the
    // finger, and the tap's own click would then toggle it shut: untappable.
    mount();
    await park();
    fireEvent.pointerEnter(rootOf(), { pointerType: 'touch' });
    fireEvent.pointerMove(rootOf(), { pointerType: 'touch' });
    await settle(400); // well past the 150ms dwell
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(listOf()).toHaveAttribute('inert');
    // …and the same two events with a MOUSE on them do open it. The positive
    // control is not decoration: without it this case would keep passing on the
    // day the whole hover manner stopped working.
    fireEvent.pointerEnter(rootOf(), { pointerType: 'mouse' });
    fireEvent.pointerMove(rootOf(), { pointerType: 'mouse' });
    await waitFor(() =>
      expect(bulbOf()).toHaveAttribute('aria-expanded', 'true'),
    );
  });

  it('ignores an arrival no MOVEMENT produced — content landing under a resting mouse', async () => {
    // Chromium re-computes hover when the layout changes beneath a parked
    // cursor and delivers pointerover/pointerenter for whatever arrived there,
    // with NO pointermove (probed 2026-09-04). A fixed corner dial must not
    // unfold itself at page load because somebody's mouse happened to be
    // resting on that corner — hovering is something the VISITOR does.
    const onOpenChange = vi.fn();
    mount({ onOpenChange });
    await park();
    fireEvent.pointerEnter(rootOf(), { pointerType: 'mouse' });
    await settle(400); // well past the 150ms dwell
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes again when the mouse leaves — and steals no focus on the way out', async () => {
    mount();
    await park();
    await hoverOpen();
    await userEvent.hover(outside()); // a REAL leave: the pointer is elsewhere
    await waitFor(() =>
      expect(bulbOf()).toHaveAttribute('aria-expanded', 'false'),
    );
    // A pointer-driven close never pulls focus back to the bulb — the visitor
    // is by definition looking somewhere else (the outside-pointerdown rule).
    expect(rootOf().contains(document.activeElement)).toBe(false);
  });

  it('stays open when the mouse comes back inside the 300ms grace', async () => {
    mount();
    await park();
    await hoverOpen();
    // The leave/re-enter pair is fired SYNTHETICALLY, on purpose: the grace is
    // 300ms and every real hover is a round trip to the Playwright side, so
    // racing that window with two of them would make this case a test of the
    // machine rather than of the atom. That a REAL leave closes it is the case
    // above; what this one pins is the re-enter cancelling the pending close.
    fireEvent.pointerLeave(rootOf(), { pointerType: 'mouse' });
    fireEvent.pointerEnter(rootOf(), { pointerType: 'mouse' });
    await settle(500); // past the 300ms grace, with room to spare
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('never hover-closes a dial a CLICK opened — the visual runner’s guarantee', async () => {
    mount();
    await park();
    await open();
    // openPlay's own tail, deliberately reproduced (SpeedDial.stories.tsx): the
    // visual runner click-opens each pin-open story, the play function blurs
    // the bulb, and openDisclosure parks the mouse at 0,0 — a pointerleave over
    // an open dial. With focus off the bulb, "hover closes only what hover
    // opened" is the ONLY thing keeping this dial open; a focus-only guard
    // would lose that race and freeze a closed baseline.
    bulbOf().blur();
    await userEvent.hover(outside());
    await settle(500); // past the 300ms grace
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('a pointer click on a hover-opened dial CLAIMS it — hover may no longer close it', async () => {
    // The slow aimer (§1's audience): a hand that parks on the bulb before
    // pressing it rests there longer than the dwell, so the dial is already
    // open when the click they planned lands. Closing in their face would
    // punish careful aiming — the click claims the dial as click-opened
    // instead, and the proof of the claim is that hover-away no longer works.
    mount();
    await park();
    await hoverOpen();
    await userEvent.click(bulbOf());
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
    await userEvent.hover(outside());
    await settle(500); // past the 300ms grace
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
  });

  it('…and the SECOND click closes it, like any click-opened dial', async () => {
    mount();
    await park();
    await hoverOpen();
    await userEvent.click(bulbOf()); // claims it
    await userEvent.click(bulbOf()); // closes it
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(listOf()).toHaveAttribute('inert');
  });

  it('Enter still closes a hover-opened dial — claiming takes a POINTER', async () => {
    // The claim is keyed on `event.detail > 0`, which a real key activation
    // never carries: `aria-expanded` must not lie to a keyboard user about
    // what the next press does.
    mount();
    await park();
    await hoverOpen();
    bulbOf().focus();
    await userEvent.keyboard('{Enter}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
  });

  it('will not close under a keyboard walk — and Esc still returns focus', async () => {
    mount();
    await park();
    await hoverOpen();
    await userEvent.tab(); // the bulb
    await userEvent.tab(); // …and into the stem
    expect(discsOf()[0]).toHaveFocus();
    await userEvent.hover(outside());
    // The mixed-input belt: the close timer FIRES and aborts, because closing
    // would hand `inert` a focused disc and dump the visitor on <body>.
    await settle(500);
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'true');
    // …and the guarded focus return is untouched by any of it: focus IS inside
    // the root at close time, so Esc still hands it back to the bulb.
    await userEvent.keyboard('{Escape}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(bulbOf()).toHaveFocus();
  });

  it('does not YANK focus on Esc when the visitor is working elsewhere', async () => {
    // The regression hover-open made possible, and the reason the focus return
    // is now guarded: a dial can be open because a mouse came to rest on it
    // while the visitor types somewhere else entirely. Esc must dismiss it
    // (SC 1.4.13) WITHOUT moving their focus into the corner.
    mount();
    await park();
    await hoverOpen();
    const elsewhere = outside();
    elsewhere.focus();
    await userEvent.keyboard('{Escape}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    expect(elsewhere).toHaveFocus();
  });

  it('stays dismissed while the pointer rests on it — no re-open on a jiggle', async () => {
    // The dismissable half of SC 1.4.13 taken at its word: dismissing the dial
    // must not be undone by the very hover it was dismissed under. The pointer
    // VISIT is spent at the close; only leaving and coming back can spend a new
    // one. (True of every close — Esc here, a bulb tap and a disc pick alike.)
    mount();
    await park();
    await hoverOpen();
    await userEvent.keyboard('{Escape}');
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.pointerMove(rootOf(), { pointerType: 'mouse' });
    await settle(400); // well past the 150ms dwell
    expect(bulbOf()).toHaveAttribute('aria-expanded', 'false');
    // …and a FRESH visit still opens it, so "dismissed" never means "dead".
    fireEvent.pointerLeave(rootOf(), { pointerType: 'mouse' });
    fireEvent.pointerEnter(rootOf(), { pointerType: 'mouse' });
    fireEvent.pointerMove(rootOf(), { pointerType: 'mouse' });
    await waitFor(() =>
      expect(bulbOf()).toHaveAttribute('aria-expanded', 'true'),
    );
  });
});

describe('SpeedDial — direction is layout, never content (D7 · D9 · D16)', () => {
  it.each(DIRECTIONS)(
    'direction %s carries exactly its own tokens',
    (direction) => {
      mount({ direction });
      const tokens = tokensOf(listOf());
      for (const token of directionTokens[direction]) {
        expect(tokens).toContain(token);
      }
      // One open stencil for all four: both states are four-value insets with
      // `round`, so they interpolate (D9).
      expect(tokens).toContain(
        'peer-aria-expanded:[clip-path:inset(0_0_0_0_round_9999px)]',
      );
      // …and NONE of the other three's position or stencil: "carries its own"
      // would still pass if a row wore all four anchors at once, and the last
      // one Tailwind emits would silently decide the layout.
      for (const other of DIRECTIONS.filter((d) => d !== direction)) {
        for (const token of exclusiveTokens[other]) {
          expect(tokens).not.toContain(token);
        }
      }
    },
  );

  it('wears the pre-`inert` belt: invisible while closed, on the same clock', () => {
    // `inert` alone is a 2022+ guarantee. Tailwind's `inert:` variant is an
    // attribute selector, so `inert:invisible` also lands in engines that
    // ignore the attribute — where the discs would otherwise be invisible but
    // tabbable. `visibility` rides the transition list so the closing sweep
    // still plays in full before they go dead (SC 4.1.2 / 2.4.7).
    mount();
    const tokens = tokensOf(listOf());
    for (const token of stemTokens) expect(tokens).toContain(token);
  });

  it('keeps ONE HTML order whichever way the stem grows — letters never rotate', () => {
    const orders = DIRECTIONS.map((direction) => {
      const { unmount } = mount({ direction });
      const order = discsOf().map((disc) => disc.textContent);
      unmount();
      return order;
    });
    for (const order of orders) {
      expect(order).toEqual(['EN', 'DE', 'FR', 'IT']);
    }
  });

  it.each(DIRECTIONS)(
    'direction %s caps itself against extreme zoom on its OWN axis (D16)',
    (direction) => {
      // Derived from the table above, so a fifth direction cannot ship
      // uncapped: a column stem caps its height, a row stem its width.
      //
      // The cap subtracts BOTH half a bulb (the stem hangs off the bulb's
      // centre, not off the viewport edge) and `--stem-inset`, the host's own
      // offset. A plain `100dvh - 1rem` overshot by exactly that much and let
      // the scroll box climb past the viewport at 400% zoom, where its content
      // is unreachable (SC 1.4.10 / 2.4.11, G2 a11y).
      const vertical = direction === 'up' || direction === 'down';
      const cap = vertical
        ? [
            'max-h-[calc(100dvh-var(--bulb)/2-var(--stem-inset,1rem))]',
            'overflow-y-auto',
          ]
        : [
            'max-w-[calc(100dvw-var(--bulb)/2-var(--stem-inset,1rem))]',
            'overflow-x-auto',
          ];
      expect(directionTokens[direction]).toEqual(expect.arrayContaining(cap));
      mount({ direction });
      const tokens = tokensOf(listOf());
      for (const token of cap) {
        expect(tokens).toContain(token);
      }
      // NOT overscroll-contain: on a container that is not overflowing,
      // Chromium still treats it as a scroll boundary and eats page scroll
      // over the open stem. NavMenu's own B2 cap carries none either.
      expect(tokens).not.toContain('overscroll-contain');
    },
  );
});

describe('SpeedDial — size: one variable, the step as its fallback (D12 · D16 F2)', () => {
  it.each(SIZES)('size %s sets the root variables and the bulb box', (size) => {
    mount({ size });
    const root = tokensOf(rootOf());
    for (const token of sizeTokens[size].root) expect(root).toContain(token);
    const bulb = tokensOf(bulbOf());
    for (const token of sizeTokens[size].bulb) expect(bulb).toContain(token);
  });

  it('derives every stem disc from the bulb — one variable, never a second table', () => {
    mount();
    for (const disc of discsOf()) {
      expect(tokensOf(disc)).toContain('size-(--disc)');
    }
  });

  it.each(SIZES)(
    'size %s: the root fallback and the shared discBox fallback are the same number',
    (size) => {
      // Derived, not hand-listed: `--bulb` restates the step that discBox
      // already carries, and a drift between the two would bend the
      // thermometer (board §8) without failing anything else.
      const fallbackOf = (token: string) =>
        /--disc-size,\s*([\d.]+rem)/.exec(token)?.[1];
      const root = sizeTokens[size].root
        .map(fallbackOf)
        .find((value) => value !== undefined);
      const bulb = sizeTokens[size].bulb
        .map(fallbackOf)
        .find((value) => value !== undefined);
      expect(root).toMatch(/^[\d.]+rem$/);
      expect(bulb).toBe(root);
    },
  );

  it('defaults to md · up · ink', () => {
    const { unmount } = mount();
    const fallback = [rootOf(), bulbOf(), listOf(), ...discsOf()].map(
      (el) => el.className,
    );
    unmount();
    mount({ size: 'md', direction: 'up', tone: 'ink' });
    expect(
      [rootOf(), bulbOf(), listOf(), ...discsOf()].map((el) => el.className),
    ).toEqual(fallback);
  });
});

describe('SpeedDial — tone fills the bulb, the stem stays ghost (D4 · D5)', () => {
  it.each(TONES)('tone %s fills the BULB and nothing else', (tone) => {
    mount({ tone });
    const bulb = tokensOf(bulbOf());
    for (const token of toneTokens[tone]) expect(bulb).toContain(token);
    // …and the discs are untouched by it: same ghost bundle in either tone.
    for (const disc of discsOf()) {
      const tokens = tokensOf(disc);
      for (const token of discGhostTokens) expect(tokens).toContain(token);
    }
  });

  it.each(TONES)(
    'tone %s leaves no creep behind on a disc — no shadow, no ring recolour',
    (tone) => {
      // The reversed D5, asserted as an ABSENCE so the old bundle cannot creep
      // back one token at a time: hover changes the ground, full stop.
      mount({ tone });
      for (const disc of discsOf()) {
        const tokens = tokensOf(disc);
        expect(tokens.filter((t) => /(^|:)shadow(-|$)/.test(t))).toEqual([]);
        expect(
          tokens.filter((t) => /^(hover|focus-visible|active):border-/.test(t)),
        ).toEqual([]);
      }
    },
  );

  it('rests every disc transparent, with the ring as its only paint', () => {
    // GlyphButton's ghost test, disc-shaped: a ground painted at rest would
    // make ghost a second solid. bg-transparent must be the ONLY plain bg —
    // the tray exists under hover/active alone, so the stem's own surface (and
    // whatever the host puts behind it) shows through.
    mount();
    for (const disc of discsOf()) {
      const tokens = tokensOf(disc);
      expect(tokens).toContain('rounded-full');
      for (const token of discGhostTokens) expect(tokens).toContain(token);
      expect(tokens.filter((t) => /^bg-/.test(t))).toEqual(['bg-transparent']);
    }
  });

  it('prints its letters as mono text that scales with the bulb', () => {
    // Real text, never a picture of letters (D3 = C, SC 1.4.5) — and the size
    // is derived from the box, so a host override keeps the same look (D16).
    mount();
    for (const el of [bulbOf(), ...discsOf()]) {
      const tokens = tokensOf(el);
      expect(tokens).toContain('font-mono');
      expect(tokens).toContain('font-medium');
      expect(tokens).toContain('tracking-wide');
      expect(tokens).toContain('text-[max(0.875rem,calc(var(--bulb)*2/7))]');
      expect(tokens).not.toContain('uppercase');
    }
  });
});

describe('SpeedDial — art backgrounds (owner 2026-09-04: flags behind the codes)', () => {
  /** The two positioned layers of a flagged control, in paint order. */
  const layersOf = (control: Element) =>
    Array.from(
      control.querySelectorAll<HTMLElement>(
        ':scope > span[aria-hidden="true"]',
      ),
    );

  const artIn = (control: Element) =>
    control.querySelector('svg')?.getAttribute('data-art');

  it('adds NOTHING to an artless dial — the DOM is a code and nothing else', () => {
    // The zero-diff half of the manifest, made executable: sixteen ui/speeddial
    // baselines say every existing story renders exactly what it rendered
    // before this lane, and every existing story is artless.
    mount();
    for (const el of [bulbOf(), ...discsOf()]) {
      expect(el.querySelectorAll('span')).toHaveLength(0);
      expect(el.querySelectorAll('svg')).toHaveLength(0);
      expect(el.querySelectorAll('[aria-hidden]')).toHaveLength(0);
      expect(el.childNodes).toHaveLength(1);
      expect(el.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    }
  });

  it('dresses ONLY the option carrying art — every other class string is byte-identical', () => {
    // The other half, and the stronger one: a mixed dial proves the artless
    // path did not merely survive but is the SAME STRING, character for
    // character. `art` is per-option, so one flag can never re-dress the four
    // discs around it (nor the bulb above them).
    const { unmount } = mount();
    const before = [bulbOf(), ...discsOf()].map((el) => el.className);
    unmount();

    const oneFlagged: readonly SpeedDialOption<Lang>[] = LANGUAGES.map(
      (option) =>
        option.value === 'de' ? { ...option, art: artOf('de') } : option,
    );
    mount({ options: oneFlagged });
    const after = [bulbOf(), ...discsOf()].map((el) => el.className);

    // [bulb RO · EN · DE · FR · IT] — index 2 is the one that changed.
    expect(after.filter((_, index) => index !== 2)).toEqual(
      before.filter((_, index) => index !== 2),
    );
    expect(after[2]).not.toBe(before[2]);
  });

  it('gives the bulb the CURRENT option’s art and each disc its own, hidden from the a11y tree', () => {
    // Model C again (D1): the bulb IS the current option, so it wears that
    // option's art — the owner's "flags everywhere incl. the bulb".
    mount({ options: FLAGGED });
    expect(artIn(bulbOf())).toBe('ro');
    expect(discsOf().map(artIn)).toEqual(['en', 'de', 'fr', 'it']);

    for (const el of [bulbOf(), ...discsOf()]) {
      const [layer, scrim] = layersOf(el);
      // Decoration, top to bottom: the art is aria-hidden because it says
      // nothing — the disc's spoken name is its endonym and its visible text is
      // the code. A flag that announced itself would be a second, competing
      // identification, which is exactly what §8.5 refuses.
      expect(layer).toHaveAttribute('aria-hidden', 'true');
      expect(scrim).toHaveAttribute('aria-hidden', 'true');
      expect(layer.contains(el.querySelector('svg'))).toBe(true);
      for (const token of artLayerTokens) {
        expect(tokensOf(layer)).toContain(token);
      }
      for (const token of artScrimTokens) {
        expect(tokensOf(scrim)).toContain(token);
      }
      // …and the code paints ABOVE both, because it is positioned too: a
      // `relative` in-flow span is the last positioned sibling, so DOM order
      // puts it on top without a single z-index.
      expect(tokensOf(el.lastElementChild as HTMLElement)).toContain(
        'relative',
      );
    }
  });

  it('keeps the visible code and the spoken endonym exactly as they were (SC 2.5.3)', async () => {
    // The dressing changes paint, never text. A voice-control user still reads
    // "DE" and says "click Deutsch"; the flag contributes no text node at all,
    // so textContent is still the code alone (fb-133).
    mount({ options: FLAGGED });
    expect(bulbOf()).toHaveTextContent('RO');
    expect(bulbOf()).toHaveAccessibleName(RO_LABEL);
    await open();
    const list = within(listOf());
    for (const option of FLAGGED.filter((o) => o.value !== 'ro')) {
      const disc = list.getByRole('link', { name: option.label });
      expect(disc.textContent).toBe(option.code);
      expect(disc).toHaveAccessibleName(option.label);
    }
  });

  it('paints flagged letters white and weight-640, one step up, ringed by the ink halo', () => {
    mount({ options: FLAGGED });
    for (const el of [bulbOf(), ...discsOf()]) {
      const tokens = tokensOf(el);
      for (const token of artLetterTokens) expect(tokens).toContain(token);
      // REPLACED, never overridden — the mechanism, asserted as an absence: two
      // font-weight (or two font-size) utilities on one element hand the look
      // to the STYLESHEET's emission order, which no class-order edit can fix.
      expect(tokens).not.toContain('font-medium');
      expect(tokens).not.toContain(
        'text-[max(0.875rem,calc(var(--bulb)*2/7))]',
      );
      // The marker the scrim's `group-hover:` reads, and the positioning scope
      // both layers are absolute against.
      expect(tokens).toContain('group');
      expect(tokens).toContain('relative');
    }
  });

  it('COVERS the ghost tray rather than stripping it — no conditionals in the tables', () => {
    // A flagged disc's hover manner is the scrim deepening; the tray it used to
    // show is still in the class list, simply painted over by an opaque flag.
    // Nothing about the artless bundle is edited away, which is what keeps the
    // two paths one atom instead of two.
    mount({ options: FLAGGED });
    for (const disc of discsOf()) {
      const tokens = tokensOf(disc);
      for (const token of ['border', 'border-line', 'bg-transparent']) {
        expect(tokens).toContain(token);
      }
      expect(tokens).toContain('hover:bg-line-subtle');
      expect(tokens).toContain('active:bg-line-subtle');
      // The ONE ghost token a flag genuinely replaces: white letters and ink
      // letters cannot both be declared and left to the cascade.
      expect(tokens).not.toContain('text-ink');
    }
    // The bulb keeps its whole tone bundle for the same reason (D4-reversed cta
    // fills it) — covered by the flag, never conditioned away.
    for (const token of toneTokens.ink) {
      expect(tokensOf(bulbOf())).toContain(token);
    }
  });

  it('keeps the focus ring OUTSIDE the clip — a flag never eats it (SC 2.4.7)', () => {
    // The clipping lives on the art LAYER, not on the control, and an outline
    // is painted outside the box and is not subject to the element's own
    // overflow either way. Both facts, pinned: the ring bundle survives on a
    // flagged control, and the control itself never clips.
    mount({ options: FLAGGED });
    for (const el of [bulbOf(), ...discsOf()]) {
      const tokens = tokensOf(el);
      expect(tokens).toContain('focus-visible:outline-2');
      expect(tokens).toContain('focus-visible:outline-focus');
      expect(tokens).toContain('outline-offset-2');
      expect(tokens).not.toContain('overflow-hidden');
    }
  });

  it('COMPILES to the approved treatment, not merely to the right class names', () => {
    // The pins above prove the atom EMITS the fragments; this one asks the
    // engine whether Tailwind turned them into declarations. An arbitrary value
    // that silently fails to compile leaves no class-name evidence at all — the
    // letters would just inherit the body's weight, and the first thing to
    // notice would be a wrong baseline. The real stylesheet is already loaded
    // at the top of this file, so the answer is one getComputedStyle away.
    mount({ options: FLAGGED, size: 'lg' });
    const bulb = bulbOf();
    const disc = discsOf()[0];

    for (const el of [bulb, disc]) {
      const style = getComputedStyle(el);
      expect(style.fontWeight).toBe('640');
      // 18px on BOTH, and deliberately: the size is derived from `--bulb` (the
      // 56px lg bulb → max(1rem, 56×9/28) = 18px), which the root sets once for
      // the whole dial — so a 44px stem disc prints the same 18px as the bulb.
      // Recorded, not accidental: the flag lane's pack surfaces this in case
      // the owner ever wants the stem a step smaller than the bulb.
      expect(style.fontSize).toBe('18px');
      // Eight shadow copies, one per compass point. Counted by colour stops so
      // the assertion does not hard-code whatever --color-ink resolves to.
      expect(style.textShadow.match(/rgb/g)).toHaveLength(8);
    }

    // White letters, resolved through the token rather than typed as a hex —
    // the LanguageSwitcher cta-probe idiom: both sides parsed by one engine.
    const probe = document.createElement('div');
    probe.style.color = 'var(--color-ink-inverse)';
    document.body.append(probe);
    try {
      expect(getComputedStyle(disc).color).toBe(getComputedStyle(probe).color);
    } finally {
      probe.remove();
    }

    // The scrim really paints, and it fades on the system's own --fade clock
    // (set by discBase on the CONTROL, inherited down to this child).
    // Measured on the BULB's scrim on purpose: the stillness style at the top
    // of this file kills transitions inside the stem — `[aria-controls] ~ ul *`
    // — and the bulb's own children are outside that selector.
    const scrim = getComputedStyle(layersOf(bulb)[1]);
    expect(scrim.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(scrim.transitionDuration).toBe('0.4s');
    expect(scrim.transitionProperty).toBe('background-color');
  });
});

describe('SpeedDial — §6.8 native-element fidelity', () => {
  it('merges the parent className LAST onto the root', () => {
    mount({ className: 'fixed bottom-4 left-4 z-40' });
    const root = rootOf();
    expect(root.className).toContain('inline-flex');
    expect(
      root.className.trimEnd().endsWith('fixed bottom-4 left-4 z-40'),
    ).toBe(true);
  });

  it('accepts ref as a regular prop (React 19) reaching the root <div>', () => {
    const ref = createRef<HTMLDivElement>();
    mount({ ref });
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(rootOf());
  });

  it('calls a plain function ref with the node, then null on unmount', () => {
    const attached: Array<HTMLDivElement | null> = [];
    const { unmount } = mount({
      ref: (node) => {
        attached.push(node);
      },
    });
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBeInstanceOf(HTMLDivElement);
    unmount();
    expect(attached).toEqual([expect.any(HTMLDivElement), null]);
  });

  it('returns the caller’s cleanup instead of swallowing it (React 19)', () => {
    // React 19 lets a callback ref return a cleanup and then calls THAT instead
    // of re-invoking the ref with null. An atom that drops the return value
    // silently downgrades every caller to the legacy null-call they did not
    // write (Modal.tsx's attachRef carries the same guarantee).
    const attached: Array<HTMLDivElement | null> = [];
    const cleanup = vi.fn();
    const { unmount } = mount({
      ref: (node) => {
        attached.push(node);
        return cleanup;
      },
    });
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBeInstanceOf(HTMLDivElement);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    // …and never the null call: exactly one attach, no detach-by-null.
    expect(attached).toHaveLength(1);
  });

  it('spreads remaining native props onto the root and keeps its own off the DOM', () => {
    // Written as literal JSX, not through mount(): React types data-* through
    // JSX only, so an object of props cannot carry one.
    render(
      <SpeedDial
        options={LANGUAGES}
        value="ro"
        aria-label={RO_LABEL}
        data-analytics="language"
        direction="down"
        size="lg"
        tone="cta"
        onSelect={() => {}}
        onOpenChange={() => {}}
      />,
      { wrapper: Ground },
    );
    const root = rootOf();
    expect(root).toHaveAttribute('data-analytics', 'language');
    // The contract props are styling and behaviour, never attributes.
    for (const attribute of [
      'direction',
      'size',
      'tone',
      'options',
      'value',
      'onselect',
      'onopenchange',
      'aria-label',
    ]) {
      expect(root.hasAttribute(attribute)).toBe(false);
    }
    // …and the required name lands where it belongs: on the bulb.
    expect(bulbOf()).toHaveAttribute('aria-label', RO_LABEL);
  });

  it('renders a plain list: <ul> of <li>, no menu role, no aria-current (D10)', () => {
    // role="list" is the WebKit belt, not a semantic addition: Safari drops
    // list semantics from a `list-style: none` <ul> outside <nav> — which
    // Tailwind's preflight makes every list in this project — and a screen
    // reader would announce four loose links instead of "list, 4 items"
    // (SC 1.3.1, G2 a11y).
    mount();
    const list = listOf();
    expect(list).toHaveAttribute('role', 'list');
    expect(list).not.toHaveAttribute('aria-modal');
    expect(Array.from(list.children).every((li) => li.tagName === 'LI')).toBe(
      true,
    );
    for (const disc of discsOf()) {
      expect(disc).not.toHaveAttribute('aria-current');
    }
  });
});

describe('SpeedDial — one clock, nothing moves (§9)', () => {
  const animatedElements = () => {
    mount();
    const list = listOf();
    return [
      rootOf(),
      bulbOf(),
      list,
      ...Array.from(list.querySelectorAll<HTMLElement>('li')),
      ...discsOf(),
    ];
  };

  it('gives every animated element a reduced-motion escape hatch', () => {
    let animatedCount = 0;
    for (const el of animatedElements()) {
      const tokens = tokensOf(el);
      const animated = tokens.some((t) =>
        /(^|:)(transition|duration|delay|ease)-/.test(t),
      );
      if (!animated) continue;
      animatedCount += 1;
      expect(tokens).toContain('motion-reduce:transition-none');
    }
    // Without this the loop would pass loudest on the day someone deletes every
    // transition token: nothing to check is not the same as everything checked.
    // The bulb, the stem, four <li>s and four discs = 10 animated elements.
    expect(animatedCount).toBe(10);
  });

  it('never fades a shorthand that would drag the focus ring along', () => {
    for (const el of animatedElements()) {
      expect(el.className).not.toMatch(/transition-colors|transition-all/);
    }
    // Exactly GlyphButton's two properties, on purpose (one system, one fade):
    // since the creep went, nothing about a disc's border or shadow moves.
    expect(tokensOf(bulbOf())).toContain('transition-[background-color,color]');
    for (const disc of discsOf()) {
      expect(tokensOf(disc)).toContain('transition-[background-color,color]');
      expect(disc.className).not.toMatch(
        /transition-colors|transition-\[color\]|transition-all/,
      );
    }
    // Asymmetric on purpose: the OPEN state transitions clip-path only, so the
    // discs are visible in the same recalc that drops `inert` (visibility has a
    // ZERO duration); the INERT state only DELAYS that flip by 300ms, so the
    // closing sweep finishes before they go dead.
    const stem = tokensOf(listOf());
    expect(stem).toContain('transition-[clip-path,visibility]');
    expect(stem).toContain('[transition-duration:300ms,0s]');
    expect(stem).toContain('inert:[transition-delay:0s,300ms]');
    // THE SPECIFICITY TRAP (G2 react, 2026-08-27): an `inert:` variant compiles
    // to `:is([inert],[inert] *)` — (0,2,0) — and would outrank
    // `motion-reduce:transition-none` — (0,1,0) — so the inert rule must never
    // set the transition PROPERTY list (or duration): only a delay, which is
    // moot once reduced motion sets the list to none.
    expect(
      stem.filter((t) =>
        /^inert:(transition-|duration-|\[transition(-property|-duration)?:)/.test(
          t,
        ),
      ),
    ).toEqual([]);
  });

  it('nothing grows, slides or spins — the stencil is the whole animation', () => {
    for (const el of animatedElements()) {
      expect(
        tokensOf(el).filter((t) =>
          /(^|:)(animate|scale|translate|rotate|skew)-/.test(t),
        ),
      ).toEqual([]);
    }
  });

  it('carries no shadow token anywhere — GlyphButton’s own ban, inherited', () => {
    // With D5 reversed there is no legitimate shadow left in this atom, so the
    // ban can be flat rather than a list of allowed spellings (the GlyphButton
    // motion sweep uses exactly this pattern).
    for (const el of animatedElements()) {
      expect(tokensOf(el).filter((t) => /(^|:)shadow(-|$)/.test(t))).toEqual(
        [],
      );
    }
  });

  it('keeps a visible focus ring on every control (SC 2.4.7 / 1.4.11)', () => {
    mount();
    for (const el of [bulbOf(), ...discsOf()]) {
      const tokens = tokensOf(el);
      expect(tokens).toContain('focus-visible:outline-2');
      expect(tokens).toContain('focus-visible:outline-focus');
      expect(tokens).toContain('outline-offset-2');
      expect(el.className).not.toMatch(/outline-none|outline-hidden/);
    }
  });

  it('staggers the discs off ONE index pair and reverses it on the way out (D9)', () => {
    mount();
    const items = Array.from(listOf().querySelectorAll<HTMLElement>('li'));
    expect(items).toHaveLength(4);
    items.forEach((item, index) => {
      expect(item.style.getPropertyValue('--i')).toBe(String(index));
      expect(item.style.getPropertyValue('--n')).toBe(String(items.length));
      const tokens = tokensOf(item);
      expect(tokens).toContain('delay-[calc(var(--i)*60ms)]');
      expect(tokens).toContain(
        'inert:delay-[calc((var(--n)-1-var(--i))*60ms)]',
      );
      expect(tokens).toContain('inert:opacity-0');
    });
  });
});

describe('SpeedDial — the atom stores nothing (§12)', () => {
  it('writes no cookie and no storage key, open or picked', async () => {
    const cookie = document.cookie;
    const local = localStorage.length;
    const session = sessionStorage.length;
    mount();
    await open();
    await userEvent.click(
      within(listOf()).getByRole('link', { name: 'Français' }),
    );
    expect(document.cookie).toBe(cookie);
    expect(localStorage.length).toBe(local);
    expect(sessionStorage.length).toBe(session);
  });
});

describe('SpeedDial — the type-level contract and the dev tripwire', () => {
  it('requires aria-label: an abbreviation-only control cannot compile (§6.3)', () => {
    const nameless = (
      // @ts-expect-error — 'aria-label' is required: the disc shows 'RO', the
      // spoken name must say 'Română'.
      <SpeedDial options={LANGUAGES} value="ro" />
    );
    expect(nameless).toBeTruthy();
  });

  it('rejects a value that is not one of the options (NoInfer)', () => {
    // Without NoInfer on `value` this line COMPILES: `value` is an inference
    // site of its own, so TS simply widens V to 'ro'|'en'|…|'rp' and the typo
    // becomes legal. NoInfer takes `value` out of the inference, leaving
    // `options` to fix V — which is the whole point of the generic.
    const typo = (
      // @ts-expect-error — 'rp' is not one of the options' values
      <SpeedDial options={LANGUAGES} value="rp" aria-label={RO_LABEL} />
    );
    expect(typo).toBeTruthy();
  });

  it('narrows onSelect’s option to the union the options declared', () => {
    // The positive half of the same guarantee: what comes BACK is typed too,
    // so the section can switch on `option.value` without a cast.
    const pair: SpeedDialOption<'ro' | 'en'>[] = [
      { value: 'ro', code: 'RO', label: 'Română' },
      { value: 'en', code: 'EN', label: 'English' },
    ];
    const picked: Array<'ro' | 'en'> = [];
    const dial = (
      <SpeedDial
        options={pair}
        value="en"
        aria-label="English · change language"
        onSelect={(option) => {
          const narrowed: 'ro' | 'en' = option.value;
          picked.push(narrowed);
        }}
      />
    );
    expect(dial).toBeTruthy();
    expect(picked).toEqual([]);
  });

  it('prints an unmatched value raw and says so ONCE, in dev only', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const options: readonly SpeedDialOption[] = LANGUAGES;
    const { unmount } = render(
      <SpeedDial
        options={options}
        value="xx"
        aria-label="Necunoscut · schimbă"
      />,
      { wrapper: Ground },
    );
    // Honest, never invented: the bulb prints exactly what it was handed.
    expect(bulbOf('Necunoscut · schimbă')).toHaveTextContent('xx');
    unmount();
    render(
      <SpeedDial
        options={options}
        value="xx"
        aria-label="Necunoscut · schimbă"
      />,
      { wrapper: Ground },
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('SpeedDial: value "xx" matches no option'),
    );
  });

  it('renders the raw value whatever the build — only the LINE is dev-only', () => {
    // Named for what it can prove. The production branch of the tripwire is NOT
    // reachable from this project: Vite replaces `process.env.NODE_ENV` with a
    // literal at transform time in the browser graph, so vi.stubEnv has nothing
    // left to change (probed 2026-08-27). A same-file assertion could not prove
    // that either — both sides would be the same inlined literal — so it is
    // stated, not asserted.
    // What this DOES pin is the half the doc comment leans on: the tripwire
    // changes nothing a visitor sees. The bulb prints the raw value in either
    // build, and in production that string is silently NOT contained in the
    // consumer's aria-label — SC 2.5.3 broken for as long as it ships. A misuse
    // path caught in dev, never a supported state with a fallback rendering.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const options: readonly SpeedDialOption[] = LANGUAGES;
    render(
      <SpeedDial
        options={options}
        value="zz"
        aria-label="Necunoscut · schimbă"
      />,
      { wrapper: Ground },
    );
    expect(bulbOf('Necunoscut · schimbă')).toHaveTextContent('zz');
    // This IS a dev build, so the line is printed — once, for a new message.
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('SpeedDial — the dev tripwires for Label in Name (SC 2.5.3)', () => {
  // Every ingredient of the rule is in these props — each option carries what
  // it PRINTS and what it is CALLED, the bulb carries both too — so the atom
  // checks it rather than leaving it to a consumer's test or an audit. A
  // voice-control user reads the two letters and says them; a name that does
  // not contain them makes the disc unreachable by voice.
  const OK_LABEL = 'Română · schimbă limba';

  it('names an option whose label does not contain its printed code', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const options: readonly SpeedDialOption[] = [
      { value: 'ro', code: 'RO', label: 'Română', lang: 'ro', href: '/ro/' },
      // The real mistake this catches, taken from the story fixture it was
      // found in: "português" does not contain "pt".
      { value: 'pt', code: 'PT', label: 'Português', lang: 'pt', href: '/pt/' },
    ];
    render(<SpeedDial options={options} value="ro" aria-label={OK_LABEL} />, {
      wrapper: Ground,
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('the option printed "PT" is named "Português"'),
    );
  });

  it('names a bulb whose spoken name does not contain its printed code', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SpeedDial
        options={LANGUAGES}
        value="ro"
        // The §15.13 trap: a name that describes the ACTION without naming the
        // language leaves "RO" unsayable.
        aria-label="Schimbă limba"
      />,
      { wrapper: Ground },
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('the bulb prints "RO" but is named'),
    );
  });

  it('says nothing about a 3-letter code at either size', () => {
    // The rule that used to live here — "3 letters need size=lg" — existed for
    // ONE reason: the creep's blur was a proportion of the box, so on a 32px
    // disc it reached under a third character. With the creep reversed
    // (Storybook review, 2026-08-27) the hover fill no longer touches the
    // letters at any size, so a long code is a layout judgement call and not
    // something the atom can honestly call a contrast failure.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const options: readonly SpeedDialOption[] = [
      { value: 'ro', code: 'RO', label: 'Română', lang: 'ro', href: '/ro/' },
      { value: 'rom', code: 'ROM', label: 'Română', lang: 'ro', href: '/rom/' },
    ];
    for (const size of SIZES) {
      const { unmount } = render(
        <SpeedDial
          options={options}
          value="ro"
          size={size}
          aria-label={OK_LABEL}
        />,
        { wrapper: Ground },
      );
      unmount();
    }
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('says nothing at all about a well-formed dial', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe('ui/disc.ts — one variable, two corners (D16 · F2 · D17 Road 3)', () => {
  const boxOf = (el: Element) => {
    const { width, height } = el.getBoundingClientRect();
    return [Math.round(width * 100) / 100, Math.round(height * 100) / 100];
  };

  it('measures 44 / 32 at the md step', () => {
    mount({ size: 'md' });
    expect(boxOf(bulbOf())).toEqual([44, 44]);
    expect(boxOf(discsOf()[0])).toEqual([32, 32]);
  });

  it('measures 56 / 44 at the lg step — the FloatingActions corner', () => {
    mount({ size: 'lg' });
    expect(boxOf(bulbOf())).toEqual([56, 56]);
    expect(boxOf(discsOf()[0])).toEqual([44, 44]);
  });

  it('lets a HOST set the size per screen through --disc-size, bulb and stem together', () => {
    mount({ size: 'lg', className: '[--disc-size:4.5rem]' });
    expect(boxOf(bulbOf())).toEqual([72, 72]);
    const [width, height] = boxOf(discsOf()[0]);
    expect(width).toBeCloseTo((72 * 11) / 14, 1);
    expect(height).toBeCloseTo((72 * 11) / 14, 1);
  });

  it('scales GlyphButton from the SAME variable, glyph included (zero-pixel refactor)', () => {
    // The other corner: the call CTA must grow with the language bulb or the
    // row stops reading as one row (board §8, "one number, two corners").
    render(
      <GlyphButton size="lg" aria-label="Sună clinica">
        {GLYPH}
      </GlyphButton>,
    );
    const call = screen.getByRole('button', { name: 'Sună clinica' });
    expect(boxOf(call)).toEqual([56, 56]);
    const svg = call.querySelector('svg');
    expect(svg && boxOf(svg)).toEqual([28, 28]);
  });

  it('honours a host override on GlyphButton too — 72px box, 36px glyph', () => {
    render(
      <GlyphButton
        size="lg"
        aria-label="Sună clinica"
        className="[--disc-size:4.5rem]"
      >
        {GLYPH}
      </GlyphButton>,
    );
    const call = screen.getByRole('button', { name: 'Sună clinica' });
    expect(boxOf(call)).toEqual([72, 72]);
    const svg = call.querySelector('svg');
    expect(svg && boxOf(svg)).toEqual([36, 36]);
  });

  it('keeps bulb, tube and every disc on ONE centre line (D12, board §8)', () => {
    // A 1px drift here reads as a bent thermometer, and nothing else in the
    // suite would catch it: the tube is the bulb minus 2px, centred on it, and
    // the first disc clears the bulb's top edge by 6px — exactly the 0.375rem
    // of air in the padding override. It was 7 while the tube wore its 1px
    // border; the owner struck the whole capsule chrome on 2026-09-05 ("i
    // fucking hate that square, remove it" — stemBase carries the story), and
    // the border went with it. Measured in Chromium, not assumed.
    mount({ size: 'lg', direction: 'up' });
    const bulb = bulbOf().getBoundingClientRect();
    const tube = listOf().getBoundingClientRect();
    const disc = discsOf()[0].getBoundingClientRect();
    const centre = (r: DOMRect) => Math.round((r.left + r.right) / 2);
    expect(centre(tube)).toBe(centre(bulb));
    expect(centre(disc)).toBe(centre(bulb));
    expect(Math.round(tube.width)).toBe(Math.round(bulb.width) - 2);
    expect(Math.round(disc.bottom)).toBe(Math.round(bulb.top) - 6);
  });

  it('leaves a focused disc’s ring room inside the tube (SC 2.4.7)', async () => {
    // The tube is a SCROLL CONTAINER (the zoom cap), and a scroll container
    // clips at its padding box — so a ring that needs more room than the tube
    // has spare is not merely tight, it is CUT. offset 2 + width 2 = 4 per
    // side, which is why the tube is the bulb minus 2px and not minus 4
    // (52px of padding box around a 44px disc left 3 — G2 a11y).
    // Opened by a real click, then TABBED into: :focus-visible only matches
    // after keyboard input, and an unpainted ring would measure 0 and pass.
    mount({ size: 'lg', direction: 'up' });
    await open();
    await userEvent.tab();
    const disc = discsOf()[0];
    expect(disc).toHaveFocus();
    const { outlineWidth, outlineOffset } = getComputedStyle(disc);
    const ring = parseFloat(outlineWidth) + parseFloat(outlineOffset);
    expect(parseFloat(outlineWidth)).toBeGreaterThan(0);
    const room = (listOf().clientWidth - disc.offsetWidth) / 2;
    expect(ring).toBeLessThanOrEqual(room);
  });

  it('paints the bulb ABOVE the tube’s round start end (fb-262)', () => {
    // The stack is three tokens working together: the inner box `isolate`s so
    // the negative index cannot sink below the page, the stem sits at -z-10 and
    // the bulb at z-10. The <ul> is also a LATER sibling, which is what lets
    // `peer-*` reach it at all — peer only looks backwards.
    mount();
    const inner = bulbOf().parentElement as HTMLElement;
    expect(tokensOf(inner)).toEqual(
      expect.arrayContaining(['relative', 'isolate']),
    );
    expect(tokensOf(bulbOf())).toEqual(
      expect.arrayContaining(['relative', 'z-10', 'peer']),
    );
    expect(tokensOf(listOf())).toContain('-z-10');
    expect(bulbOf().nextElementSibling).toBe(listOf());
  });

  it('scrolls a capped column-reverse stem to the BULB side first (board §8)', () => {
    // The behaviour the extreme-zoom cap leans on, exercised on the REAL stem
    // rather than a hand-built stand-in — so a change to the direction table
    // can fail it. `--stem-inset` is the host's own variable (D16 · F2): set it
    // to nearly the whole viewport and the cap engages here instead of at 400%
    // zoom, which is the only place it otherwise bites.
    // What must hold: when the capsule overflows, the browser's initial scroll
    // position leaves the disc NEAREST the bulb visible — the far ones are the
    // ones that fall off the end, which is the right way round for a thumb.
    mount({
      size: 'lg',
      direction: 'up',
      className: '[--stem-inset:calc(100dvh-8rem)]',
    });
    const list = listOf();
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    const nearest = discsOf()[0];
    expect(nearest.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      list.getBoundingClientRect().bottom + 1,
    );
  });

  it('lets the direction padding beat the stem’s own p-1 (shorthand, then side)', () => {
    // Tailwind emits `padding` before `padding-bottom`, which is what puts the
    // stem's round start end INSIDE the bulb (fb-262). If that order ever
    // flipped, the first disc would sit under the bulb instead of above it.
    mount({ size: 'lg', direction: 'up' });
    const { paddingBottom, paddingTop } = getComputedStyle(listOf());
    expect(paddingTop).toBe('4px'); // p-1
    expect(paddingBottom).toBe(`${56 / 2 + 6}px`); // bulb/2 + 0.375rem
  });
});
