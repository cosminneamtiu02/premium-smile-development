import { useState } from 'react';
import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { Phone } from '@/assets/glyphs/Phone';
import { GlyphButton } from '../GlyphButton/GlyphButton';
import {
  SpeedDial,
  type SpeedDialDirection,
  type SpeedDialOption,
  type SpeedDialProps,
  type SpeedDialSize,
  type SpeedDialTone,
} from './SpeedDial';

// The fifteen stories ARE the declared visual manifest for this lane (design
// board .claude/plans/language-dial.plan.md §6, owner-approved), so the export
// NAMES are load-bearing: renaming one renames its baseline file. Sixteen
// darwin baselines — 1280 each, plus CornerFit again at 320 through the
// 'stress-320' tag (§13 UI-tier opt-in).
//
// Demo values are Romanian with diacritics (§15.7) and the atom's first real
// consumer: the five site locales, their endonyms, and hrefs shaped exactly as
// localeHref() will write them (§15.13 — the section builds the string, this
// atom only prints it). There is deliberately NO German or pseudo-locale
// variant: the dial renders no translated prose, only 1–3-letter codes that
// cannot expand, and its two long strings (the bulb's name, each disc's name)
// live in the a11y tree where the a11y addon audits them.
//
// Two tags carry state into the VISUAL runner (tests/visual/stories.spec.ts):
// 'pin-open' clicks the first [aria-expanded] and waits for the list it
// controls; 'pin-open-hover' does the same and then really hovers the first
// disc, because synthetic events cannot activate CSS :hover. Each open story
// ALSO runs the play function below, so the in-browser gates — per-story axe
// and the interaction runner — audit the OPEN dial rather than a closed bulb.
// The play function is idempotent (it returns early if the runner already
// opened it) so the two openers can never cancel each other into a closed
// baseline.
//
// Since 2026-09-04 the dial ALSO opens on hover — a mouse resting on it for
// 150ms — and closes 300ms after that mouse leaves. No story here changes
// hands because of it: hover closes only what HOVER opened, and every story
// below is click-opened (by the runner's poll or by the play function), so the
// mouse parking at 0,0 inside openDisclosure cannot touch them. There is
// deliberately no hover story either — the hover-open END state is pixel-for-
// pixel the pin-open state, so a new baseline would photograph nothing new.

const LANGUAGES: readonly SpeedDialOption[] = [
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
];

// Eight options, five of them the real locales: the stem's length is data, not
// a hard-coded four. Every endonym here starts with its own code, so Label in
// Name holds for each disc (SC 2.5.3, D10) — which is exactly why the three
// extras are Español · Svenska · Dansk and NOT the Português and Nederlands
// this fixture first reached for: "português" does not contain "pt" and
// "nederlands" does not contain "nl", so those discs would have printed a code
// no voice-control user could say to reach them (G2 a11y). The atom's own dev
// tripwire now fails that mistake loudly; the fixture no longer makes it.
const MANY: readonly SpeedDialOption[] = [
  ...LANGUAGES,
  {
    value: 'es',
    code: 'ES',
    label: 'Español',
    lang: 'es',
    href: '/es/services/',
  },
  {
    value: 'sv',
    code: 'SV',
    label: 'Svenska',
    lang: 'sv',
    href: '/sv/services/',
  },
  {
    value: 'da',
    code: 'DA',
    label: 'Dansk',
    lang: 'da',
    href: '/da/services/',
  },
];

// The same dial with no hrefs at all (D2 = B′): a same-page chooser whose whole
// outcome is onSelect. Proof that the atom is not tied to navigation.
const DURATIONS: readonly SpeedDialOption[] = [
  { value: '15', code: '15', label: '15 minute' },
  { value: '30', code: '30', label: '30 de minute' },
  { value: '45', code: '45', label: '45 de minute' },
  { value: '60', code: '60', label: '60 de minute' },
];

const RO_LABEL = 'Română · schimbă limba';

// D15's five bulb names — each locale names the control in ITSELF, endonym
// first (SC 2.5.3). The section will read them from `common.language.switch`;
// the demo host uses them so a pick re-names the bulb the way the NEXT page
// would ("Deutsch · Sprache ändern" on /de/…).
const BULB_NAMES: Record<string, string> = {
  ro: 'Română · schimbă limba',
  en: 'English · change language',
  de: 'Deutsch · Sprache ändern',
  fr: 'Français · changer de langue',
  it: 'Italiano · cambia lingua',
};

/**
 * The consumer in miniature — the Modal stories' ModalDemo play. On the site a
 * disc is a real link and the BROWSER leaves for the next document (§15.13);
 * inside Storybook's preview there is no next document, only a dead URL and an
 * error page. So this host owns `value`: a pick calls preventDefault() on the
 * click the atom hands back as its second argument — the STORY's doing, never
 * the atom's — and re-renders the dial as the next page would show it: the
 * picked option becomes the bulb and the rest fan out again in manifest order
 * (D1, model C), the dial staying open because a link pick leaves it alone. The
 * bulb's name follows the pick: D15's value when the story used a plain locale
 * name, otherwise the picked label plus the story's own tail (" · schimbă
 * durata", " · schimbă limba · ton cta"), so Label in Name keeps holding.
 * `key={args.value}` on the render remounts it when the control changes.
 */
function SpeedDialDemo({
  value: initialValue,
  'aria-label': initialLabel,
  onSelect,
  ...props
}: SpeedDialProps): ReactElement {
  const [value, setValue] = useState(initialValue);
  const current = props.options.find((option) => option.value === value);
  const tailAt = initialLabel.indexOf(' · ');
  const tail = tailAt === -1 ? '' : initialLabel.slice(tailAt);
  const name =
    value === initialValue
      ? initialLabel
      : initialLabel === BULB_NAMES[initialValue] && BULB_NAMES[value]
        ? BULB_NAMES[value]
        : `${current?.label ?? value}${tail}`;
  return (
    <SpeedDial
      {...props}
      value={value}
      aria-label={name}
      onSelect={(option, event) => {
        onSelect?.(option, event);
        event.preventDefault();
        setValue(option.value);
      }}
    />
  );
}

const meta = {
  title: 'UI/SpeedDial',
  component: SpeedDial,
  // The stem is absolutely positioned OUTSIDE the root's box, so the canvas
  // must be given room explicitly — otherwise an `up` dial unfolds off the top
  // of the frame and the baseline photographs nothing. 50rem centres the bulb
  // 400px from every edge: the longest stem here (EightOptions at lg — seven
  // 44px discs) reaches ≈ 382px, HostScaled's four 57px discs ≈ 290px.
  decorators: [
    (Story) => (
      <div className="flex min-h-[50rem] items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
  args: {
    options: LANGUAGES,
    value: 'ro',
    'aria-label': RO_LABEL,
    direction: 'up',
    size: 'md',
    tone: 'ink',
    onSelect: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    options: {
      control: false,
      description:
        'Every option in unfold order, the current one INCLUDED — { value, code, label, href?, lang? }. An option with an href becomes an <a>, one without a <button> (D2 = B′)',
    },
    value: {
      control: 'select',
      options: LANGUAGES.map((option) => option.value),
      description:
        'The current option: it lives in the bulb and is never a link (D1). The stem is `options` minus this one, in `options` order',
    },
    'aria-label': {
      control: 'text',
      description:
        'REQUIRED (§6.3) — the bulb shows an abbreviation. State-INVARIANT (aria-expanded tells the state) and it must START with the current endonym so the visible code is contained in it (SC 2.5.3)',
    },
    direction: {
      control: 'radio',
      options: ['up', 'down', 'left', 'right'] satisfies SpeedDialDirection[],
      description:
        'Which way the stem unfolds. The corner uses `up`: `right` would run into the call CTA at 320px',
    },
    size: {
      control: 'radio',
      options: ['md', 'lg'] satisfies SpeedDialSize[],
      description:
        'The BULB’s box — md 2.75rem/44px · lg 3.5rem/56px; stem discs one step smaller (32 · 44). The step is the fallback of --disc-size, which a host may override per screen (D16 · F2)',
    },
    tone: {
      control: 'radio',
      options: ['ink', 'cta'] satisfies SpeedDialTone[],
      description:
        'Named bundle for the BULB’s fill — ink = inverse-surface (state) · cta = the locked green pair (action). The stem discs are ghost in either tone (owner reversal of D5, 2026-08-27)',
    },
    onSelect: {
      control: false,
      description:
        'Fires with the WHOLE picked option before the browser follows the href, default NOT prevented. Never fires for the bulb',
    },
    onOpenChange: {
      control: false,
      description:
        'Reports every open/close flip — the atom owns the state (uncontrolled, D13)',
    },
    className: {
      control: false,
      description:
        'Merged LAST onto the root: the host’s placement (`fixed … left-4 z-40`) and its two CSS variables — the --disc-size steps and --stem-inset for the zoom cap (§6.4/§6.8)',
    },
  },
  render: (args) => <SpeedDialDemo key={args.value} {...args} />,
} satisfies Meta<typeof SpeedDial>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Open the dial the way a visitor would, idempotently: the visual runner clicks
 * the same bulb, and both orderings must end OPEN. Written against the FIRST
 * [aria-expanded] in the canvas — which is the bulb, since GlyphButton (the
 * CornerFit stand-in) carries none.
 *
 * It ends by BLURRING the bulb, and that is not tidying: whoever clicked last
 * leaves focus on it, and a play-function click focuses with keyboard modality
 * (ring) while the runner's real mouse click does not (no ring). The baseline
 * would then encode WHICH of the two won the race — a flake with a screenshot
 * attached. Blurring lands both orderings on the same pixels, and the dial
 * stays open because the atom ignores a blur with no relatedTarget (D11, the
 * Safari rule).
 *
 * The click below still MEANS what it meant before hover-open: the pointerMOVE
 * user-event dispatches ahead of every click is what arms the 150ms dwell (the
 * pointerenter only opens the pointer's visit), and the bulb's own press and
 * click both cancel the hover timers before it toggles — so this function opens
 * the dial exactly once, whoever gets there first.
 */
const openPlay: NonNullable<Story['play']> = async ({ canvas, userEvent }) => {
  const bulb = canvas
    .getAllByRole('button')
    .find((button) => button.hasAttribute('aria-expanded'));
  if (!bulb) throw new Error('SpeedDial stories: no bulb in this canvas');
  if (bulb.getAttribute('aria-expanded') !== 'true') {
    await userEvent.click(bulb);
  }
  await waitFor(() => expect(bulb).toHaveAttribute('aria-expanded', 'true'));
  bulb.blur();
  // …and it must SURVIVE that blur: if focus-out ever stopped ignoring a null
  // relatedTarget, every "open" baseline in this file would quietly become a
  // picture of a closed dial.
  await expect(bulb).toHaveAttribute('aria-expanded', 'true');
};

/**
 * The whole control at rest: one filled disc, the current language, collapsed.
 *
 * Also the story to put a real mouse on: since the owner's 2026-09-04 request
 * the dial opens on a 150ms DWELL — rest the pointer on the bulb and it
 * unfolds without a click — and closes 300ms after that pointer leaves. Only
 * ever what hover opened: a dial you clicked open stays open until you dismiss
 * it. Behaviour, not pixels, which is why the manner adds no story and no
 * baseline of its own.
 */
export const Default: Story = {};

/**
 * The four unfolds, settled. Each one proves the same three things in its own
 * axis: the tube is the bulb minus 2px and shares its centre line (D12),
 * its round start end hides BEHIND the bulb (fb-262 — the bulb paints above),
 * and the disc nearest the bulb is the first in the HTML (D7). Letters stay
 * upright in all four; nothing is ever rotated.
 */
export const OpenUp: Story = {
  tags: ['pin-open'],
  play: openPlay,
};

export const OpenDown: Story = {
  tags: ['pin-open'],
  args: { direction: 'down' },
  play: openPlay,
};

export const OpenLeft: Story = {
  tags: ['pin-open'],
  args: { direction: 'left' },
  play: openPlay,
};

export const OpenRight: Story = {
  tags: ['pin-open'],
  args: { direction: 'right' },
  play: openPlay,
};

/**
 * D1 · D7 with the current option in the MIDDLE of the manifest: the bulb keeps
 * DE, and the stem reads RO · EN · FR · IT outward — `options` order with one
 * member filtered out, no sorting and no rotation.
 */
export const CurrentInTheMiddle: Story = {
  tags: ['pin-open'],
  args: { value: 'de', 'aria-label': 'Deutsch · Sprache ändern' },
  play: openPlay,
};

/**
 * The hover look: GlyphButton's quiet TRAY under the first disc.
 *
 * This is the owner's 2026-08-27 reversal of the board's D5 ("i do not like the
 * new animation … drop it and use just old on hover" → "replace it with ghost
 * glyph but with a border"). Where a tone used to creep in from the disc's edge
 * as a "partially selected" progression, a disc now behaves exactly like a
 * ghost GlyphButton with a resting ring: transparent → `bg-line-subtle` on the
 * same 400ms clock, border unchanged. Hover reads as "ready"; "chosen" stays
 * the filled bulb, so the two looks are still unmistakable.
 *
 * The runner performs a REAL mouse hover — synthetic events cannot activate CSS
 * :hover — through the 'pin-open-hover' tag, which opens exactly like
 * 'pin-open' and then hovers the first disc.
 */
export const HoveredDisc: Story = {
  tags: ['pin-open-hover'],
  play: openPlay,
};

/**
 * The KEYBOARD look: discBase's focus ring, 2px offset outside the disc, and
 * nothing else — no tray, no recoloured border. That parity with GlyphButton
 * ghost is the whole point of the D5 reversal, so this story is what proves the
 * ring is the only thing a keyboard user gets.
 *
 * Deliberately NOT tagged 'pin-open': the runner's real mouse click on the bulb
 * would set pointer modality, and script-driven focus after that does not match
 * :focus-visible — the ring would be missing from the baseline. Opened inside
 * the play function instead, NO trusted pointer input ever precedes the
 * script focus, which is the condition under which Chromium lets a script
 * focus show the ring (TextButton's FocusVisible precedent; the synthetic Tab
 * itself does not count as a key press). The runner does not wait for the play
 * to finish — `toHaveScreenshot`'s retry-until-match is what settles the shot
 * against an existing baseline — so the play must reach its end state fast
 * and deterministically, which the visibility guard below secures.
 */
export const FocusedDisc: Story = {
  play: async (context) => {
    await openPlay(context);
    const bulb = context.canvas
      .getAllByRole('button')
      .find((button) => button.hasAttribute('aria-expanded'));
    bulb?.focus();
    // The discs must be VISIBLE before the Tab — visibility is what the tab
    // order honours, and a transition still in flight would skip them.
    await waitFor(() =>
      expect(context.canvas.getAllByRole('link')[0]).toBeVisible(),
    );
    await context.userEvent.tab();
  },
};

/**
 * The two tones side by side, CLOSED — the everyday corner look, and the shot
 * the owner picks the default from. Closed on purpose: two OPEN dials cannot
 * share a story, because the click that opens the second is an outside press
 * that closes the first (D11).
 */
export const Tones: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <SpeedDialDemo {...args} tone="ink" />
      {/* Two buttons in one canvas need two names — "which Română · schimbă
          limba?" is unanswerable by voice and ambiguous to a screen-reader
          user walking the story. The endonym still comes first (SC 2.5.3). */}
      <SpeedDialDemo
        {...args}
        tone="cta"
        aria-label="Română · schimbă limba · ton cta"
      />
    </div>
  ),
};

/** The green bundle open: cta fills the bulb; the stem is ghost either way (D4). */
export const OpenCta: Story = {
  tags: ['pin-open'],
  args: { tone: 'cta' },
  play: openPlay,
};

/** The FloatingActions scale: a 56px bulb over 44px discs (D12). */
export const Large: Story = {
  tags: ['pin-open'],
  args: { size: 'lg' },
  play: openPlay,
};

/**
 * The §1 drawing made real: the corner pair at the accessibility stress width.
 * The dial takes its placement from the host as className (§6.4/§6.8 — the
 * atom owns no margins), and a stand-in call CTA holds the other corner so the
 * 320px question can actually be answered: does the open stem clear the phone
 * button and the bottom edge? `up` is the corner's direction precisely because
 * `right` would run straight into that green disc.
 */
export const CornerFit: Story = {
  tags: ['stress-320', 'pin-open'],
  args: {
    size: 'lg',
    direction: 'up',
    className:
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40',
  },
  render: (args) => (
    <div className="min-h-[24rem] w-full">
      <SpeedDialDemo {...args} />
      <GlyphButton
        size="lg"
        aria-label="Sună clinica"
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40"
      >
        <Phone />
      </GlyphButton>
    </div>
  ),
  play: openPlay,
};

/** Eight options: the stem's length is data-driven, never a hard-coded four. */
export const EightOptions: Story = {
  tags: ['pin-open'],
  args: { options: MANY, size: 'lg' },
  play: openPlay,
};

/**
 * B′ (D2): four options with NO href, so every disc is a <button> and
 * `onSelect` is the whole outcome — the "do something else in the page" use.
 * Same dial, same clothes; only the element follows the data.
 */
export const ButtonDiscs: Story = {
  tags: ['pin-open'],
  args: {
    options: DURATIONS,
    value: '30',
    'aria-label': '30 de minute · schimbă durata',
  },
  play: openPlay,
};

/**
 * D16 · F2: the size a HOST sets, not one the atom reads off the screen. One
 * variable in the className — the 2xl step FloatingActions will pass to BOTH
 * corners — scales bulb and stem together: 72px over ≈57px.
 */
export const HostScaled: Story = {
  tags: ['pin-open'],
  args: { size: 'lg', className: '[--disc-size:4.5rem]' },
  play: openPlay,
};
