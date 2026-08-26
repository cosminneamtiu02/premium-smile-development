import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent } from 'storybook/test';
import { TextButton } from './TextButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — the real Header nav labels (§15.7); DE-longest + pseudo-locale
// are dedicated stress variants, both carrying the 'stress-320' tag → the
// visual net also samples them at the 320px accessibility width (§13 UI-tier
// opt-in).
// Hrefs are placeholders: the Header nests a plain <a href> whose locale-aware
// route string comes from localeHref() (§15.13). Nothing here owns
// navigation — the atom never did (see TextButton.tsx).

const meta = {
  title: 'UI/TextButton',
  component: TextButton,
  args: {
    children: 'Servicii',
    active: false,
  },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'The current page — aria-current="page" + a STATIC full-width underline (never animated in)',
    },
    asChild: {
      control: false,
      description:
        'Render no <button> of its own — the single child element becomes the control (see AsNavLink)',
    },
    children: {
      control: 'text',
      description: 'The label — already-translated text (§8.1)',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The quiet action at rest: ink label, underline swept away. */
export const Default: Story = {};

/** The current page: static full-width underline + aria-current="page". */
export const Active: Story = {
  args: { active: true, children: 'Acasă' },
};

/**
 * The Header consumption shape — three nav ANCHORS via asChild, „Acasă"
 * current: aria-current="page" and the static underline ride to the child
 * <a>, exactly what the Header will render (G2: the production-real
 * asChild+active pair belongs in front of axe and the pixel net, not only in
 * Vitest). The gap belongs to the parent (§6.4), and so does the real <nav>
 * landmark: an atom story composes atoms, it never plays a section.
 */
export const NavRow: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <TextButton {...args} asChild active>
        <a href="#acasa">Acasă</a>
      </TextButton>
      <TextButton {...args} asChild>
        <a href="#servicii">Servicii</a>
      </TextButton>
      <TextButton {...args} asChild>
        <a href="#echipa">Echipa</a>
      </TextButton>
    </div>
  ),
};

/** asChild: the nested <a> IS the control — same clothes, link behaviour. */
export const AsNavLink: Story = {
  render: (args) => (
    <TextButton {...args} asChild>
      <a href="#servicii">Servicii</a>
    </TextButton>
  ),
};

/** Dimmed and out of the tab order; contrast-exempt as an inactive control (§9). */
export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * The keyboard state, pinned as real pixels: a play-function Tab press makes
 * :focus-visible genuinely match (script focus() would lean on UA
 * heuristics), so the per-story axe pass and the visual baseline both render
 * the 2px offset ring — which otherwise exists only as class assertions
 * (G2 a11y F1).
 */
export const FocusVisible: Story = {
  play: async () => {
    await userEvent.tab();
  },
};

/**
 * The other sanctioned light ground: --surface (a Card, the drawer). This is
 * the atom's thinnest contrast margin — the cta underline at 4.52:1 against
 * the 3:1 non-text floor — so it gets a rendered instance with pixels and axe
 * behind it (G2 a11y F5). The ground itself belongs to the parent (§6.4).
 */
export const OnSurface: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2 bg-surface p-4">
      <TextButton {...args} active>
        Acasă
      </TextButton>
      <TextButton {...args}>Servicii</TextButton>
    </div>
  ),
};

/**
 * DE is the longest locale (§8.4) — the labels must wrap, never overflow, at
 * 320px too, and the underline follows whatever box that produces.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <TextButton {...args} active>
        Startseite
      </TextButton>
      <TextButton {...args}>Leistungen</TextButton>
    </div>
  ),
};

/** Pseudo-locale (~40% expansion, accents) — hardcoded stress fixture (§15.7). */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: { children: 'Šéŕvíçîî~~~' },
};

/**
 * Hover END state, pinned as real pixels: the 'pin-hover' tag makes the visual
 * spec perform a true mouse hover before the (animation-disabled) screenshot —
 * synthetic play() events cannot activate CSS :hover. What lands is the end of
 * both clocks at once: the cta-hover label and the fully swept underline.
 */
export const HoverEnd: Story = {
  tags: ['pin-hover'],
};
