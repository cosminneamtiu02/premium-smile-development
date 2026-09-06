import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { CTABanner } from '@/components/sections/CTABanner/CTABanner';
import { Hero } from '@/components/sections/Hero/Hero';
import { ServicesTeaser } from '@/components/sections/ServicesTeaser/ServicesTeaser';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';

// THE HOME PAGE as one picture — §13's page-tier story: the REAL sections, with
// mock messages supplied by the preview decorator, and the `Pages/*` title
// prefix routing it to all six widths (320 · 390 · 768 · 1280 · 1536 · 1920 —
// tests/visual/stories.spec.ts) in Romanian AND German, which is the whole
// §13 page matrix. The band stories next door sample two widths each and prove
// their own contracts; this file exists for the thing only an assembly can
// show: the RHYTHM between the three bands, and whether their grounds meet
// cleanly (the Hero's wash fades into --page, the teaser sits on that same
// ground, the CTA band lifts onto --raised).
//
// ── IT RENDERS THE ASSEMBLY, NOT THE PAGE COMPONENT. The page's default
// export is now a plain sync composition (no params, no server APIs — the
// setRequestLocale idiom ended with the 16.3.4 rootParams transport), but the
// MODULE stays un-importable here: page.tsx's generateMetadata pulls
// next-intl/server + lib/seo at module level, none of which exist in the
// browser Storybook renders in. So the story composes the same three bands in
// the same order — the page file's whole body — and the two are kept in step by
// eye and by this comment rather than by the compiler. That is the standing
// trade-off §13 already accepts for page stories ("render the real sections
// with mock messages"); what it buys is that every string, token and container
// step below is the shipped one.
//
// ── THE TWO WRAPPERS ARE THE SHELL, standing in exactly as far as it matters:
//   · ContactModalProvider — both CTAs are ContactModalTriggers, which THROW
//     outside it by design. The dialog stays CLOSED (no `defaultOpen`, no play
//     presses a CTA), so it contributes no pixels to these six frames; its own
//     states are storied in ContactModal.stories.tsx.
//   · <main> — the landmark app/[locale]/layout.tsx wraps {children} in. It is
//     full-bleed there (bands own their gutters by composing ui/Container), so
//     it carries no classes here either.
// Header, Footer and FloatingActions are deliberately ABSENT: they are the
// shell's bands, storied in their own files, and including them would make
// every Home baseline move whenever the bar or the footer changes.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals` — the visual
// runner opens stories by URL with no toolbar state, so an unpinned German
// story would photograph Romanian. The pin also stamps `<html lang>`, which is
// what gives `hyphens: auto` its dictionary (§15.14).
//
// layout 'fullscreen': three full-bleed bands whose grounds must meet edge to
// edge. Storybook's default 1rem padding would inset all three and put the
// seams the frame exists to show inside a border.

const Page = (): ReactElement => (
  <ContactModalProvider>
    <main>
      <Hero />
      <ServicesTeaser />
      <CTABanner />
    </main>
  </ContactModalProvider>
);

const meta = {
  title: 'Pages/Home',
  parameters: { layout: 'fullscreen' },
  render: () => <Page />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The play function's `canvas` — Testing Library's queries bound to the story
 * root, which is exactly what `within()` returns. */
type Canvas = ReturnType<typeof within>;

/**
 * ONE h1 per page (§9), a heading order that only ever steps down by one, and
 * three DISTINCTLY named regions — the assertions that exist only at this tier,
 * because each band is individually correct and can still add up to a page with
 * two h1s or two identically-named landmarks.
 */
const expectPageOutline = async (
  canvas: Canvas,
  messages: typeof ro,
): Promise<void> => {
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  await expect(canvas.getAllByRole('region')).toHaveLength(3);

  // Each landmark named by its own band's title, read back as the
  // accessibility tree computes it (the aria-labelledby pairs).
  canvas.getByRole('region', { name: messages.home.hero.title });
  canvas.getByRole('region', { name: messages.home.teaser.title });
  canvas.getByRole('region', { name: messages.common.cta.title });

  canvas.getByRole('heading', { level: 1, name: messages.home.hero.title });
  canvas.getByRole('heading', { level: 2, name: messages.home.teaser.title });
  canvas.getByRole('heading', { level: 2, name: messages.common.cta.title });
  // The tier cards' h3s sit under the teaser's h2 — no level is skipped
  // anywhere on the page (§9's logical heading order).
  await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(3);
};

/**
 * THE PAGE, Romanian (§15.7) — the default every visitor of /ro sees: the hero
 * wash and its CTA pair, the three priced tiers, the closing question on the
 * raised ground.
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    await expectPageOutline(canvas, ro);
    // §7: nothing may require horizontal scrolling, at any sampled width — and
    // this story is sampled at the 320px accessibility stress width too.
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};

/**
 * THE PAGE IN GERMAN — the longest language (§8.4: ≈ +30–35% over English) and
 * the second half of §13's page matrix. Every band's own German stress is
 * proven next door; what this frame adds is the CUMULATIVE effect: three bands
 * of longer text, in one column, at six widths.
 */
export const German: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas, canvasElement }) => {
    await expectPageOutline(canvas, de);
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
