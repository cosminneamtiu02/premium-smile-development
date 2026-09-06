import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { ServiceCard, type ServiceCardLevel } from './ServiceCard';

// Two stories, and the visual manifest says exactly two: the everyday card with
// its from-price, and the German card WITHOUT one. The `Sections/*` title prefix
// is what routes them to 390 + 1536 (tests/visual/stories.spec.ts, §13). The
// export NAMES are load-bearing — renaming one renames its baseline file.
//
// ── NO PINNED VIEWPORTS, and no `stress-320` tag either. This component has no
// container query and no media query at all (§6.5 — the GRID that decides
// whether three of these sit side by side belongs to the consumer), so the two
// widths the title prefix already routes it to ARE the story; the 320px
// accessibility stress happens where the grid does, in ServicesTeaser's and the
// Services page's own frames.
// The `level` axis gets no story either, on purpose: h2 and h3 are dressed
// byte-identically here (ui/Heading's `title` step lands on whichever element
// `asChild` is handed), so a third frame would photograph the same pixels for a
// difference that lives in the accessibility tree. It is proved where it is
// visible instead — ServiceCard.test.tsx, and the page story's outline check.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`, even though
// this section reads no message file (all three strings are props, §8.1 — the
// consuming page owns the keys). The pin is not decoration: the preview
// decorator stamps `<html lang>` from that global, and `hyphens: auto` picks its
// dictionary from the declared language (§15.14). Romanian by default (§15.7);
// the German story flips the GLOBAL rather than putting `lang="de"` on the card
// (SectionHeading's route), because here the whole card is German — a card on
// /de/services — not one German line inside a Romanian page.
// Flip the toolbar to Pseudo over either story and nothing changes: that is the
// §8.9 sweep PASSING, and the reason no pseudo fixture is typed out here — the
// expansion stress is what the German story below already is.
//
// ── NO `parameters.nextjs` and no provider decorator. The card reads no
// pathname, links nowhere and holds no trigger: it is inert HTML (§16), so
// there is no route to stage and no switch to wrap.
//
// ── THE DECORATOR IS A GRID TRACK, not a frame. The card owns no width and no
// margin (§6.4), so on a bare canvas it would photograph a 1536px-wide card,
// which no consumer produces. `max-w-sm` (24rem) is very nearly the track the
// teaser's three-column grid hands it on a laptop (~24.6rem inside the 10vw
// gutter clamp), and at 390 the ground's own padding leaves ~21rem — close to
// the 19.5rem single column a phone gives it. So both sampled widths photograph
// a real deployment of this card rather than an accident.

const meta = {
  title: 'Sections/ServiceCard',
  component: ServiceCard,
  argTypes: {
    name: {
      control: 'text',
      description:
        'The service name, finished and already translated (§8.1) — rendered as the card’s <h3>',
    },
    description: {
      control: 'text',
      description: 'What the service covers, finished and translated (§8.1)',
    },
    priceLabel: {
      control: 'text',
      description:
        'The from-price as ONE finished string (the consumer runs Intl.NumberFormat + the ICU sentence). Omitted → no price row at all, which is the honest state for a service without a confirmed price',
    },
    level: {
      control: 'inline-radio',
      options: [2, 3] satisfies ServiceCardLevel[],
      description:
        'Which REAL heading element the name becomes — the document outline, independent of the look (the size step is always `title`). Default 3, the rung under a band that opened with its own h2 (Home’s teaser); the Services page passes 2 because its cards sit directly under the page h1. Flip it here and the picture must not move: that is the axis costing zero pixels, and why it has no story of its own',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the root (§6.4/§6.8) — both consumers pass `h-full` so the card fills the grid row its cell was stretched to',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ServiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY CARD, Romanian (§15.7) — the middle tier exactly as
 * /ro/services and the Home teaser render it: the name, what it covers, and the
 * bold from-price sitting on the bottom edge.
 *
 * The play measures the two things no unit test in this repo can (the
 * interaction suite loads no stylesheet): the 12px column gap and the 24px
 * padding that make this a card rather than three stacked paragraphs. Both are
 * part of the S3 rewire's ZERO-DIFF promise — the numbers the teaser's inline
 * <li> produced before the shape moved here.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  args: {
    name: 'Igienizare profesională',
    description: 'Detartraj, periaj profesional și fluorizare.',
    priceLabel: 'de la 250 RON',
  },
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article');
    canvas.getByRole('heading', { level: 3, name: 'Igienizare profesională' });
    canvas.getByText('de la 250 RON');

    const styles = getComputedStyle(card);
    await expect(styles.rowGap).toBe('12px');
    await expect(styles.paddingTop).toBe('24px');
    // §7: nothing may require horizontal scrolling, at any sampled width.
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) AND THE ABSENT
 * PRICE — one frame carrying both stresses, because they meet in the same
 * place: the bottom edge of the card.
 *
 * The name is the real German compound the teaser's grid step was calibrated
 * against ("Professionelle Zahnreinigung"), and `hyphens: auto` breaks it under
 * German patterns because the pinned global stamps `<html lang="de">` (§15.14).
 * The price row is OMITTED, which is what a service without a confirmed price
 * must look like: the card simply ends after the description — no dash, no "auf
 * Anfrage", no empty row. The play asserts that as structure (two children),
 * since a screenshot cannot tell an absent row from a blank one.
 */
export const GermanLongest: Story = {
  globals: { locale: 'de' },
  args: {
    name: 'Professionelle Zahnreinigung',
    description:
      'Zahnsteinentfernung, professionelle Politur und Fluoridierung — auf Wunsch mit Behandlungsplan für die häufigsten Folgebehandlungen.',
  },
  play: async ({ canvas }) => {
    const card = canvas.getByRole('article');
    canvas.getByRole('heading', {
      level: 3,
      name: 'Professionelle Zahnreinigung',
    });

    await expect(card.children).toHaveLength(2);
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};
