import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { clinic } from '@/lib/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { ContactModalProvider } from './ContactModalProvider';
import { ContactModalTrigger } from './ContactModalTrigger';

// sections/ContactModal — THREE stories: the dialog open on a phone, the same
// dialog in German on a laptop, and the page before anyone presses anything.
// They are the declared visual manifest for this lane (owner-approved N2
// contract, board .claude/plans/contact-modal-n2-contract.plan.md), so the
// export NAMES are load-bearing: renaming one renames its baseline file.
//
// Three mechanics that would otherwise fail SILENTLY, in the Footer's order:
//
// ── 1. Every story PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL (/iframe.html?id=…) with no toolbar state at all.
// Without the pin the German baseline would be a Romanian picture — green, and
// proving nothing.
//
// ── 2. NO story pins a viewport, deliberately (owner, 2026-08-27). A pinned
// width is applied to the MANAGER's preview iframe verbatim, and the preview
// area is smaller than the numbers this tier samples: measured at a 1440×900
// window it is ~1140px wide — narrower than both 1280 and 1536, so the canvas
// scrolled sideways — and only ~478px TALL, because the toolbar and the addons
// panel take the rest. That height is the real damage: the panel's cap is
// `100dvh − 2rem`, so at 478px the dialog runs out of room and ui/Modal
// switches its body into scroll mode — the one picture the owner never wants
// to see, manufactured by the pin rather than by the design. Unpinned, each
// story renders at the canvas's own size (the panel is fluid below its cap
// either way) and the viewport toolbar stays free for hand-checking.
// Nothing is lost on the visual side: the runner never read these pins — it
// sets its own page size per project — so the net still samples every story at
// 390 + 1536 (§13, `Sections/*`), and Default additionally at 320 through the
// 'stress-320' tag.
//
// ── 3. The two open stories start open through the provider's `defaultOpen`,
// NOT through a click. That is deliberate: an open dialog is what the a11y
// addon must audit and what the snapshot must photograph, and going through
// `defaultOpen` keeps the visual net free of the `pin-open` click dance the
// Header needs (tests/visual/stories.spec.ts). The `Closed` story is the
// hands-on one — press Contact and the same dialog opens for real.
//
// The section takes NO props and translates itself, so there are no args and no
// controls: the locale toolbar is this component's control surface. Flip it to
// Pseudo and every string in the panel must come out accented — untransformed
// text there is a hardcoded string, i.e. a bug (§8.9). The two strings that
// must NOT change are the phone number and its display format: they are data
// from lib/clinic.ts (§10.1), not copy.
//
// layout 'fullscreen' because the ground is a whole page and the dialog is a
// top-layer element that answers to the viewport: Storybook's default 1rem
// padding would inset the page but not the panel, and the two would be
// measured against different rulers.

/**
 * Page GROUND, deliberately IDENTICAL in all three stories and deliberately
 * ROMANIAN in all three (§15.7) — the German story puts German INSIDE the
 * dialog only, exactly as ui/Modal's own GermanLongest story does. Holding the
 * scenery constant means the only thing that differs between two baselines is
 * the panel itself.
 *
 * <main> is not decoration: every visible string on a page must sit inside a
 * landmark or the per-story axe audit reports the loose text. The trigger's
 * own <div> wrapper is the section owning PLACEMENT (§6.4/§6.8) — in a flex
 * column a bare button would stretch edge to edge, which is a different
 * picture from the one the Header will render.
 */
const Ground = (): ReactElement => (
  <main className="mx-auto flex min-h-screen max-w-prose flex-col gap-4 px-4 py-8">
    <p>Clinica este deschisă de luni până vineri, între orele 9 și 19.</p>
    <p>
      Programările se fac telefonic. Vă răspundem în cel mult o zi lucrătoare și
      vă propunem prima oră liberă din cabinet.
    </p>
    <div>
      {/* The label is the CONSUMER's (§8.1 at the trigger): the same
          `common.actions.contact` string the Header's interim phone link wears
          today — i.e. the control this section will replace — read straight
          from the JSON the way the Footer's stories read theirs. */}
      <ContactModalTrigger>{ro.common.actions.contact}</ContactModalTrigger>
    </div>
  </main>
);

/**
 * The page as the shell will assemble it: the provider wraps the content and
 * renders the ONE dialog after it (D1). `open` is the story's only variable.
 */
const Page = ({ open = false }: { open?: boolean }): ReactElement => (
  <ContactModalProvider defaultOpen={open}>
    <Ground />
  </ContactModalProvider>
);

const meta = {
  title: 'Sections/ContactModal',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The panel must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (panel: HTMLElement): Promise<void> => {
  await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
};

/**
 * The owner's hard rule, asserted where the REAL fonts are loaded (Storybook
 * serves the committed subsets; the interaction suite has to inject them).
 * Since ui/Modal's rework the <dialog> is a transparent full-viewport LAYER and
 * the white BOX is its only child, so both readings go through the box: it is
 * uncapped by `scrollable={false}`, therefore never scrolls itself, and its
 * body is granted `role="region"` and a tab stop only in the scrollable mode —
 * so the ABSENCE of both is the panel reporting which mode it is in, at
 * whatever size the story (or the visual runner) is rendering.
 */
const expectNoVerticalScroll = async (layer: HTMLElement): Promise<void> => {
  const box = layer.firstElementChild as HTMLElement;
  const content = box.children[1] as HTMLElement;
  await expect(content).not.toHaveAttribute('role');
  await expect(content).not.toHaveAttribute('tabindex');
  await expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
};

/**
 * THE picture: the dialog open, in Romanian — since the owner's 08-28 trim
 * that is the title in the bar, the lead, and the green call control, with
 * nothing under it. The net shoots it at 390 and 1536, and the 'stress-320'
 * tag adds 320 (§13's opt-in), where the panel collapses to 288px wide: the
 * box is UNCAPPED by `scrollable={false}` (ui/Modal D16), so it can never
 * scroll inside itself, and at ~200px tall it has more than 300px to spare
 * even on that stress phone.
 *
 * The play function proves the facts a picture cannot: the dialog is genuinely
 * open and genuinely named by its own <h2>, the tel: href is the E.164 number
 * while the visible text is the human one, and neither the box nor the page
 * scrolls in any direction.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro' },
  render: () => <Page open />,
  play: async ({ canvas }) => {
    const dialog = canvas.getByRole('dialog', { name: ro.contact.heading });

    // `open` as an ATTRIBUTE, not toBeVisible(): the panel fades in from
    // @starting-style over 200ms and an opacity read inside that window is a
    // race, not a fact (the same reason the interaction suite disables the
    // transition).
    await expect(dialog).toHaveAttribute('open');
    await expect(
      canvas.getByRole('link', { name: clinic.phoneDisplay }),
    ).toHaveAttribute('href', `tel:${clinic.phone}`);
    await expect(dialog).toHaveTextContent(ro.contact.lead);
    await expectNoSidewaysScroll(dialog);
    await expectNoVerticalScroll(dialog);
  },
};

/**
 * German — the CALIBRATION story, because German runs ~30–35% longer than
 * English (§8.4) and this panel has no width to spare on a phone. With the
 * dialog down to three lines, the German lead ("Rufen Sie uns unter der unten
 * stehenden Nummer an.") is the longest string it ever holds: it must wrap
 * under the title without clipping, without pushing the control off the card,
 * and without the ✕ leaving its corner.
 *
 * The net shoots this one at both tier widths, which is what makes it a
 * calibration: at 1536 the panel sits at its full 32rem cap, where the
 * container padding has already stepped up to 1.5rem, and at 390 it is the
 * same component 358px wide — with no media query anywhere (§6.5).
 */
export const GermanStress: Story = {
  globals: { locale: 'de' },
  render: () => <Page open />,
  play: async ({ canvas }) => {
    const dialog = canvas.getByRole('dialog', { name: de.contact.heading });

    await expect(dialog).toHaveAttribute('open');
    await expect(dialog).toHaveTextContent(de.contact.lead);
    await expectNoSidewaysScroll(dialog);
    await expectNoVerticalScroll(dialog);
  },
};

/**
 * The page BEFORE anyone presses anything — and the hands-on story: click
 * Contact and the dialog opens for real, Escape and the ✕ close it, focus
 * returns to the button. This is also the only story that photographs what
 * every page of the site actually ships: the dialog's markup pre-rendered
 * CLOSED and invisible (the globals' `dialog:not([open])` rule), costing a
 * visitor who never presses the button nothing but the island's bytes (§16).
 *
 * Nothing is pinned but the language: the ground is fluid, so the manager
 * shows it at whatever the canvas is and the net samples it at 390 + 1536 like
 * the others.
 */
export const Closed: Story = {
  globals: { locale: 'ro' },
  render: () => <Page />,
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByRole('button', { name: ro.common.actions.contact }),
    ).toHaveAttribute('aria-haspopup', 'dialog');
    // No dialog in the accessibility tree…
    await expect(canvas.queryByRole('dialog')).toBeNull();
    // …while exactly ONE closed <dialog> waits in the markup (D1).
    const panels = canvasElement.querySelectorAll('dialog');
    await expect(panels).toHaveLength(1);
    await expect(panels[0]).not.toHaveAttribute('open');
  },
};
