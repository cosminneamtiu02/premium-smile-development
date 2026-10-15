import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import { cx } from '@/lib/cx/cx';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';
import {
  TEXT_BUTTON_HOVER_AREA,
  TextButton,
  type TextButtonHoverArea,
  type TextButtonTone,
} from './TextButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — the real Header nav labels and the blog card's „Citește mai
// mult…" (§15.7); DE-longest + pseudo-locale are dedicated stress variants,
// both carrying the 'stress-320' tag → the visual net also samples them at the
// 320px accessibility width (§13 UI-tier opt-in).
// The hrefs are stand-ins: the Header nests a plain <a href> whose
// locale-aware route string comes from localeHref() (§15.13), the blog card
// an <a> with no href at all until its article exists (AsPlaceholderLink),
// and HoverEndArea's teaser card links its title and its read-more to a
// stand-in article. Nothing here owns navigation — the atom never did (see
// TextButton.tsx).

const meta = {
  title: 'UI/TextButton',
  component: TextButton,
  args: {
    children: 'Servicii',
    active: false,
    tone: 'ink',
    hoverArea: 'self',
  },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'The current page — aria-current="page" + a STATIC full-width underline (never animated in), whatever the tone',
    },
    tone: {
      control: 'radio',
      options: ['ink', 'accent'] satisfies TextButtonTone[],
      description:
        'The label’s ink AT REST — ink, the body’s, turning lavender on hover (every menu button; the default) / accent, the hover’s lavender held at rest, so a hover draws the underline alone (the blog card’s „Citește mai mult…", owner 2026-10-14)',
    },
    hoverArea: {
      control: 'radio',
      options: ['self', 'area'] satisfies TextButtonHoverArea[],
      description:
        'Whose hover draws the hover look — self, the button’s own (every menu button; the default) / area, also any ancestor wearing TEXT_BUTTON_HOVER_AREA, so a pointer anywhere on the blog card underlines its „Citește mai mult…" (owner 2026-10-14); a disabled button stays quiet either way — see HoverEndArea',
    },
    asChild: {
      control: false,
      description:
        'Render no <button> of its own — the single child element becomes the control (see AsNavLink; an <a> with no href becomes no control at all — see AsPlaceholderLink)',
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
 * THE TONE (owner, 2026-10-14: "so basivally the top bar button, but always
 * lilla, the lilla from hover"): `tone="accent"` holds the hover's lavender at
 * rest — the blog card's „Citește mai mult…", the three dots the label's own.
 * No underline at rest; a hover draws it, and nothing else (HoverEndAccent).
 */
export const Accent: Story = {
  args: { tone: 'accent', children: 'Citește mai mult…' },
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

/**
 * The blog card's shape until its article exists: asChild onto an <a> with NO
 * href — HTML's placeholder link. It wears the whole look and underlines on
 * hover, but it is no link: no role and no tab stop (the play checks both);
 * the day the article lands it gains its href and becomes one. 'no-visual':
 * it lays out exactly as Accent's <button> — the same box, the same words in
 * the same place (TextButton.test.tsx measures it) — so its frame would only
 * repeat Accent's pixels; the play and the axe pass still run in the Vitest
 * storybook project.
 */
export const AsPlaceholderLink: Story = {
  tags: ['no-visual'],
  // The placeholder's words are the fixture's JSX, which wins over the spread
  // `children` — the control would move nothing: off, not silently inert.
  argTypes: { children: { control: false } },
  args: { tone: 'accent' },
  render: (args) => (
    <TextButton {...args} asChild>
      {/* jsx-a11y/anchor-is-valid is right that this is no working link —
          that is the case shown (the Wordmark D9 precedent). */}
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a>Citește mai mult…</a>
    </TextButton>
  ),
  play: async ({ canvas }) => {
    const placeholder = canvas.getByText('Citește mai mult…');
    await expect(placeholder).not.toHaveAttribute('href');
    await expect(canvas.queryByRole('link')).toBeNull();
    await expect(canvas.queryByRole('button')).toBeNull();
    placeholder.focus();
    await expect(placeholder).not.toHaveFocus();
  },
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
 * The other sanctioned light ground: --surface (a Card, the drawer) — the
 * Footer's, the price menu card's and the blog card's. The lavender reads
 * 5.06:1 on it, label and underline alike (TextButton.tsx's COLOR INVARIANT),
 * and the story keeps a rendered instance with pixels and axe behind it (G2
 * a11y F5). The ground itself belongs to the parent (§6.4).
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
 * both clocks at once: the lavender `accent` label and the fully swept underline.
 */
export const HoverEnd: Story = {
  tags: ['pin-hover'],
};

/**
 * The accent tone's hover END state, pinned the same way: the label keeps
 * the lavender it wore at rest and the underline is fully swept in — the one
 * thing a hover changes in this tone (Accent is its rest frame).
 */
export const HoverEndAccent: Story = {
  tags: ['pin-hover'],
  args: { tone: 'accent', children: 'Citește mai mult…' },
};

/**
 * THE HOVER AREA (owner, 2026-10-14: "i also want on hover of a card the
 * underline from citeste mai mult animation to trigger"): the card wears
 * TEXT_BUTTON_HOVER_AREA and its read-more `hoverArea="area"`, so a pointer
 * anywhere on the card draws the read-more's hover look — in the `accent`
 * tone the blog card wears, the underline alone. Hover the card in the
 * workbench; flip `hoverArea` to `self` and only the read-more's own hover
 * draws it. 'pin-hover' photographs it the way the owner sees it: the visual
 * spec hovers the FIRST control in the canvas, so this card's title is a
 * link (the common teaser card) and the pointer rests on it — on the card,
 * off the read-more, which draws its underline through the card alone. The
 * play holds that premise. The blog card's own title is no link;
 * sections/PostCard's stories show the real card.
 */
export const HoverEndArea: Story = {
  tags: ['pin-hover'],
  // The read-more's words are the fixture's JSX, which wins over the spread
  // `children` — the control would move nothing: off, not silently inert.
  argTypes: { children: { control: false } },
  args: { tone: 'accent', hoverArea: 'area' },
  render: (args) => (
    <article
      className={cx(
        TEXT_BUTTON_HOVER_AREA,
        'flex max-w-md flex-col items-start gap-3 bg-surface p-6',
      )}
    >
      <Heading size="title" asChild>
        <h3>
          <a href="#articol">Cum îți alegi periuța de dinți</a>
        </h3>
      </Heading>
      <Text tone="muted">
        Peri moi, un cap mic și o periuță nouă la fiecare trei luni: ce contează
        când alegi una.
      </Text>
      <TextButton {...args} asChild>
        <a href="#articol">Citește mai mult…</a>
      </TextButton>
    </article>
  ),
  play: async ({ canvas, canvasElement }) => {
    const readMore = canvas.getByRole('link', { name: 'Citește mai mult…' });
    const area = readMore.closest(`.${CSS.escape(TEXT_BUTTON_HOVER_AREA)}`);
    await expect(area).not.toBeNull();
    // What 'pin-hover' hovers: the FIRST control in the canvas
    // (tests/visual/stories.spec.ts) — here the title, inside the card…
    const first = canvasElement.querySelector('button, a');
    if (!(first instanceof HTMLElement)) throw new Error('no control rendered');
    await expect(first).not.toBe(readMore);
    await expect(area?.contains(first)).toBe(true);
    // …and the point the pointer rests on, the title's centre, off the
    // read-more — measured in the real face, since the box is its words'.
    const style = getComputedStyle(first);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      first.textContent ?? '',
    );
    await document.fonts.ready;
    const box = first.getBoundingClientRect();
    const spot = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    await expect(first.contains(spot)).toBe(true);
    await expect(readMore.contains(spot)).toBe(false);
  },
};
