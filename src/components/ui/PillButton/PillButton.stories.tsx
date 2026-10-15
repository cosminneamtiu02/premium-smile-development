import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PillButton, type PillButtonKind } from './PillButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — the price page's own category names for the controls and the
// blog's own categories for the tags (§15.7); the German stress label and the
// row carry the 'stress-320' tag, so the visual net also samples them at the
// 320px accessibility width (§13 UI-tier opt-in), where a chip that cannot
// wrap must still never push the page sideways. Hrefs are placeholders: the
// price strip nests a plain <a href="#…"> through `asChild`.
//
// THE PLAYS READ THE PAINT, not only the classes: the chip's 44px floor, its
// half-circle ends and each state's colours, from the real stylesheet the
// workbench loads — the facts PillButton.test.tsx pins as tokens, shown to
// hold in the canvas the pixel net photographs. Nothing here waits for a fade:
// a story renders its state from the first frame, so no transition runs.

// THE KIND RADIO offers EVERY kind: its options are the keys of a record
// keyed by PillButtonKind, so a third kind is a compile error here until the
// radio offers it (G2 typescript N2) — where a plain list would let it slip
// past.
const KIND_OPTIONS = Object.keys({
  control: true,
  tag: true,
} satisfies Record<PillButtonKind, true>);

const meta = {
  title: 'UI/PillButton',
  component: PillButton,
  args: {
    children: 'Consultații',
    kind: 'control',
    active: false,
  },
  argTypes: {
    kind: {
      control: 'radio',
      options: KIND_OPTIONS,
      description:
        'What the chip is — control, a button or link that answers a hover and may be current (every price-strip chip; the default) / tag, a label: the hover face held still, never current, worn by a child that is no control through asChild (the blog card’s categories, owner 2026-10-14 — see Tag and TagList). Picked here, on a story that hands the chip no child, a tag falls back to a <span> — never a <button>',
    },
    active: {
      control: 'boolean',
      description:
        'The current choice — the lavender face, white label, and aria-current="page" (an explicit aria-current wins). A control’s alone: beside kind="tag" it does not compile, and a tag ignores it',
    },
    asChild: {
      control: false,
      description:
        'Render no element of its own — the single child element wears the chip: a control’s becomes the control (see Row), a tag’s stays a label (see Tag and TagList). Required for a tag',
    },
    children: {
      control: 'text',
      description: 'The label — already-translated text (§8.1)',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof PillButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The pair every play reads: the chip's box and its computed style. */
const measure = (chip: HTMLElement) => ({
  box: chip.getBoundingClientRect(),
  style: getComputedStyle(chip),
});

/** A pill: at least the 44px floor (§9's aim), and ends that are half circles
 *  — `rounded-full` is a radius larger than any box, which an engine clamps
 *  to half the shorter side. */
const expectPill = async (chip: HTMLElement): Promise<void> => {
  const { box, style } = measure(chip);
  await expect(box.height).toBeGreaterThanOrEqual(44 - 0.5);
  await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(
    box.height / 2,
  );
  await expect(
    parseFloat(style.borderBottomRightRadius),
  ).toBeGreaterThanOrEqual(box.height / 2);
  await expect(style.borderTopWidth).toBe('2px');
  // The glow is worn in every face.
  await expect(style.boxShadow).not.toBe('none');
};

/** The resting paint: ink on white inside the card tint's thin edge — or, if
 *  the runner's real pointer happens to rest on the chip (a resting pointer
 *  is :hover — the house's park-the-pointer lesson), the HOVER paint the atom
 *  promises there: the same white face, the label and the edge lavender. */
const expectResting = async (chip: HTMLElement): Promise<void> => {
  const { style } = measure(chip);
  const hovered = chip.matches(':hover');
  await expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  await expect(style.color).toBe(
    hovered ? 'rgb(116, 104, 148)' : 'rgb(43, 39, 36)',
  );
  // The tint, never the solid accent an engine without color-mix would show.
  await expect(style.borderTopColor).not.toBe('rgb(122, 109, 156)');
  await expect(style.borderTopColor).not.toBe(style.backgroundColor);
  await expect(chip).not.toHaveAttribute('aria-current');
};

/** The current paint: white on the lavender face, a lavender edge. */
const expectActive = async (chip: HTMLElement): Promise<void> => {
  const { style } = measure(chip);
  await expect(style.backgroundColor).toBe('rgb(116, 104, 148)');
  await expect(style.borderTopColor).toBe('rgb(116, 104, 148)');
  await expect(style.color).toBe('rgb(255, 255, 255)');
};

/** A tag's paint: the lavender edge and label on the white face — the very
 *  colours a resting control takes under a hover — whether or not a pointer
 *  rests on it (it has no hover), and never current. */
const expectTag = async (chip: HTMLElement): Promise<void> => {
  const { style } = measure(chip);
  await expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  await expect(style.borderTopColor).toBe('rgb(116, 104, 148)');
  await expect(style.color).toBe('rgb(116, 104, 148)');
  await expect(chip).not.toHaveAttribute('aria-current');
  await expect(chip).not.toHaveAttribute('kind');
};

/** At rest: a white chip, ink label, the doctor card's lavender edge, the
 *  header pill's glow. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Consultații' });
    await expectPill(chip);
    await expectResting(chip);
  },
};

/** The current choice: the lavender face — ui/Button's lavender family at
 *  rest — with a white label, and aria-current="page". */
export const Active: Story = {
  args: { active: true, children: 'Endodonție' },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Endodonție' });
    await expectPill(chip);
    await expectActive(chip);
    await expect(chip).toHaveAttribute('aria-current', 'page');
  },
};

/**
 * Hover END state, pinned as real pixels: the 'pin-hover' tag makes the visual
 * spec perform a true mouse hover before the (animation-disabled) screenshot —
 * synthetic play() events cannot activate CSS :hover. What lands is the label
 * and the edge in the lavender, on the same white face. The play reads the
 * resting state only, for that reason.
 */
export const Hover: Story = {
  tags: ['pin-hover'],
  args: { children: 'Protetică' },
  play: async ({ canvas }) => {
    await expectPill(canvas.getByRole('button', { name: 'Protetică' }));
  },
};

/**
 * The keyboard state, pinned as real pixels: a play-function Tab press makes
 * :focus-visible genuinely match, so the per-story axe pass and the visual
 * baseline both render the 2px offset ring — a pill of its own, because an
 * outline follows `border-radius`.
 */
export const FocusVisible: Story = {
  args: { children: 'Ortodonție' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const chip = canvas.getByRole('button', { name: 'Ortodonție' });
    await expect(chip).toHaveFocus();
    const { style } = measure(chip);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.outlineOffset).toBe('2px');
  },
};

/**
 * German, the longest language (§8.4) — „Kieferorthopädie", the real tariff's
 * longest single word. A chip never wraps (the strip it lives in scrolls
 * sideways instead), so the 320 frame is the proof that one chip alone still
 * fits the narrowest phone.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de' },
  args: { children: 'Kieferorthopädie' },
  play: async ({ canvas, canvasElement }) => {
    const chip = canvas.getByRole('button', { name: 'Kieferorthopädie' });
    await expectPill(chip);
    // ONE line: the box is exactly the floor, never a wrapped lozenge.
    await expect(measure(chip).box.height).toBeLessThanOrEqual(44 + 0.5);
    await expect(measure(chip).style.whiteSpace).toBe('nowrap');
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * The consumption shape — a ROW of chips in a horizontal scroller, the third
 * one current, each an <a href> through `asChild` (the price strip's own
 * markup, in miniature). The markup is the story's whole subject, so no arg
 * reaches it and its controls are off. The scroller is the story's, not the
 * atom's: its padding leaves the glow its 14px above, 30px below and 22px
 * sideways, which is the room any scroller that clips must leave round a row
 * of chips.
 */
export const Row: Story = {
  tags: ['stress-320'],
  parameters: { controls: { disable: true } },
  render: () => (
    <ul className="flex items-center gap-3 overflow-x-auto px-6 pt-4 pb-8">
      {[
        'Consultații',
        'Endodonție',
        'Protetică',
        'Ortodonție',
        'Estetică dentară',
        'Chirurgie',
      ].map((name, index) => (
        <li key={name}>
          <PillButton
            asChild
            active={index === 2}
            aria-current={index === 2 ? 'location' : undefined}
          >
            <a href={`#categorie-${index}`}>{name}</a>
          </PillButton>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvas, canvasElement }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(6);
    for (const [index, link] of links.entries()) {
      await expectPill(link);
      if (index === 2) {
        await expectActive(link);
        await expect(link).toHaveAttribute('aria-current', 'location');
      } else {
        await expectResting(link);
      }
    }
    // The row scrolls sideways inside its own box — never the page.
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * A TAG (owner 2026-10-14 — the atom's THE TAG): a label, not a control — the
 * resting chip's hover face held still, the lavender edge and label on the
 * white face — never current, and never a <button>: a tag requires `asChild`,
 * so here it rides a <span> (on the blog card, an <li> — TagList). The label
 * is the one live control; the others would move nothing. Nothing changes
 * under a pointer either: the tag's face carries no `hover:` utility, and
 * PillButton.test.tsx reads its paint under a real one.
 */
export const Tag: Story = {
  argTypes: {
    kind: { control: false },
    active: { control: false },
    disabled: { control: false },
  },
  args: { children: 'igienă' },
  render: ({ children }) => (
    <PillButton kind="tag" asChild>
      <span>{children}</span>
    </PillButton>
  ),
  play: async ({ canvas }) => {
    const chip = canvas.getByText('igienă');
    await expect(chip.tagName).toBe('SPAN');
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    await expectPill(chip);
    await expectTag(chip);
  },
};

/**
 * The consumption shape — the blog card's categories in miniature: a list
 * named by its label, each tag an <li> through `asChild` (sections/PostCard's
 * THE TAGS). So the tags take no focus and are read as the items of a list,
 * never as buttons — PillButton.test.tsx steps over them with the browser's
 * own Tab. The markup is the story's whole subject, so its controls are off.
 * The list's padding is the story's, leaving the glow its room, as Row's does.
 */
export const TagList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ul
      role="list"
      aria-label="Categorii"
      className="flex flex-wrap items-center gap-3 px-6 pt-4 pb-8"
    >
      {['igienă', 'prevenție', 'sfaturi'].map((tag) => (
        <PillButton key={tag} kind="tag" asChild>
          <li>{tag}</li>
        </PillButton>
      ))}
    </ul>
  ),
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Categorii' });
    const tags = within(list).getAllByRole('listitem');
    await expect(tags).toHaveLength(3);
    for (const tag of tags) {
      await expectPill(tag);
      await expectTag(tag);
      // Not a focus target, by script — the keyboard's proof is the unit
      // test's real Tab (a play's Tab is user-event's simulation of one).
      tag.focus();
      await expect(tag).not.toHaveFocus();
    }
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};
