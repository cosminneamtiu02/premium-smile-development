import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import ro from '@/messages/ro.json';
import { Header } from './Header';

// The Header's four stories, built to the owner-approved N2 contract board
// .claude/plans/header-n2-contract.plan.md §6.
//
// TWO mechanics here would otherwise fail SILENTLY, so both are spelled out:
//
// ── 1. Every story PINS ITS OWN LANGUAGE with per-story `globals`.
// The locale toolbar is preview-level state that lives in the Storybook
// manager UI; the visual runner opens each story by URL (/iframe.html?id=…)
// with no toolbar state at all. Without the pin, the EN and DE baselines would
// be four identical ROMANIAN pictures — green, and proving nothing.
//
// ── 2. Every story PINS ITS OWN PRETEND ROUTE with
// `parameters.nextjs.navigation`. @storybook/nextjs-vite feeds that pathname
// through the real Next app-router contexts, where @/i18n/navigation's
// usePathname reads it and stripLocale UNPREFIXES it — '/ro/services' arrives
// in HeaderNav as '/services'. That chain is the REAL one (Header.test.tsx
// mocks the module, so these stories are where it is exercised end to end).
// The values below are therefore written the way a browser's address bar
// writes them, locale prefix and all; the Default story's play function asserts
// the underline actually lands, so a silent change in that chain fails a test
// instead of quietly un-marking every page. `appDirectory: true` is what
// selects those app-router contexts at all — without it the framework mounts
// the pages-router mock and next/navigation's usePathname is null (our hook
// reads that as the root rather than crashing).
//
// The `Sections/*` title prefix routes the visual net to 390 + 1536
// (tests/visual/stories.spec.ts, §13) — the phone where the burger is the only
// control, and the laptop where the whole row is on one line.
// layout 'fullscreen' because the bar is `sticky` and owns its own float
// margins (the pill chrome, Header.tsx): Storybook's default 1rem padding
// would add a second inset on top of them and put the story's ground and the
// pill's float on two different rulers.
//
// The section takes NO props and translates itself, so there are no args and
// no controls: the locale toolbar is this component's control surface. Flip it
// to Pseudo and every string in the bar must come out accented — untransformed
// text there is a hardcoded string, i.e. a bug (§8.9).
//
// ── 3. Every story PINS ITS OWN VIEWPORT — the MenuOpen precedent, extended
// to all four when the bar became a floating pill (owner, 2026-08-16). The
// breakpoint measures the BAR, and the pill's side margins mean the row
// appears only once the canvas is ≈960px+ (bar = canvas − 2×10vw ≥ 48rem).
// A manager canvas narrowed by the sidebar and addons panel sits right in
// that band, so an unpinned row-proving play would throw
// TestingLibraryElementError on smaller screens — the row it asserts is
// legitimately display:none there. Each pin puts the story at a width where
// its contract holds; Playwright ignores the pin (it sets its own per-project
// page size), so visual baselines still sample 390 + 1536.

/**
 * Page GROUND, deliberately IDENTICAL in all four stories and deliberately
 * Romanian (§15.7): it is not component copy, it is the page the bar sits on.
 * Holding it constant means the only thing that differs between two baselines
 * is the bar itself — a diff cannot hide in the scenery.
 *
 * The Header is FIRST in flow, as it is in the shell (§4: layout.tsx renders
 * Header · {children} · Footer). The ground is short on purpose: the visual
 * spec captures fullPage, and a document taller than the viewport would
 * stitch the sticky bar in at a mid-document position.
 */
const Ground = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="min-h-screen">
    {children}
    <main className="mx-auto flex max-w-prose flex-col gap-4 px-4 py-8">
      <p>Clinica este deschisă de luni până vineri, între orele 9 și 18.</p>
      <p>
        Programările se fac telefonic. Vă răspundem în cel mult o zi lucrătoare
        și vă propunem prima oră liberă din cabinet.
      </p>
    </main>
  </div>
);

const meta = {
  title: 'Sections/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Ground>
      <Header />
    </Ground>
  ),
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The everyday picture, Romanian, on `/ro/services`.
 *
 * Proves the whole contract in one frame at each sampled width: at 390 the
 * links are gone and the burger is the only control; at 1536 the full row is
 * on one line — brand, four links with Servicii underlined, green Contact
 * button — and no burger. Both variants are in the HTML at both widths; the
 * container query decides which is drawn (C1, §6.5).
 *
 * The play function is the standing proof that the underline is REAL, i.e.
 * that the pathname → next-intl → `active` → `aria-current` chain still works
 * end to end with the actual next-intl and Next mocks (the interaction tests
 * stub that module boundary, so this is the half they cannot cover).
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'notebook' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/ro/services' } },
  },
  play: async ({ canvas }) => {
    const current = canvas.getByRole('link', { name: ro.common.nav.services });
    await expect(current).toHaveAttribute('aria-current', 'page');
    // Only the page you are on is marked — the home link is the trap, since
    // '/' prefixes every path.
    await expect(
      canvas.getByRole('link', { name: ro.common.nav.home }),
    ).not.toHaveAttribute('aria-current');
  },
};

/**
 * The panel, open, on the same Romanian route.
 *
 * Proves the four things only this state can show: the full-width Contact CTA
 * sitting FIRST (fb-151), the vertical link list under it, the panel hanging
 * as a second glass card — dimmed page showing through the mt-2 gap and
 * around all four rounded corners — and the bar staying fully lit with the
 * burger morphed into an ✕ above the z-45 sheet.
 *
 * ONE MENU ON SCREEN (owner, fb-164/165/166): while the panel is open the bar
 * carries BRAND + ✕ only — at 1536 too, where the nav row and the bar's own
 * Contact are hidden rather than left sitting behind the panel.
 *
 * The `pin-open` tag is what carries this state into the VISUAL runner (the
 * sibling of the existing `pin-hover` pattern): the spec clicks the burger and
 * waits for `#header-menu` before shooting. The play function below does the
 * same job for the two in-browser gates — per-story axe, which must see the
 * OPEN panel, and the interaction runner. It is written idempotently (it
 * returns early if the panel is already open) so the two openers can never
 * cancel each other into a closed baseline.
 *
 * The Smartphone-390 viewport global is a REQUIREMENT of that play function,
 * not decoration: the Vitest browser renders stories in a 1200px page, the bar
 * is the container the breakpoint measures, and at 1200 the burger is
 * correctly `display: none` — unclickable, and invisible to getByRole, which
 * only sees what assistive tech sees. Pinning the phone width puts the story
 * where this control actually lives, so per-story axe audits the OPEN panel
 * instead of silently auditing a closed bar. It does NOT touch the visual
 * baselines: Playwright sets its own page size per project, so this story is
 * still sampled at both 390 and 1536 (the second one being the rotation case
 * of board §4c — full row, ✕ and panel together).
 *
 * What this story does NOT prove: the page freeze. Storybook mounts every
 * story inside #storybook-root, so the bar and the ground below it share one
 * body-level ancestor and `inert` lands on Storybook's own scaffolding instead
 * of on the page (NavMenu's dev tripwire says so in the console, on purpose).
 * The freeze — inert on/off, the scroll lock, the Tab order — is proven in
 * Header.test.tsx, where the stand-in page really is a body-level sibling.
 */
export const MenuOpen: Story = {
  tags: ['pin-open'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/ro/services' } },
  },
  play: async ({ canvas, userEvent }) => {
    const burger = canvas.getByRole('button', { name: ro.common.menu.label });
    if (burger.getAttribute('aria-expanded') !== 'true') {
      await userEvent.click(burger);
    }
    // findBy* waits — the panel mounts and animates in over 300ms.
    await canvas.findByRole('navigation', { name: ro.common.menu.label });
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
  },
};

/**
 * English, on `/en/services` — the story that proves the BLOG LINK IS GONE.
 *
 * The blog is Romanian-only (§5), so `/en/blog` must never be offered. Three
 * links here, four in the Romanian stories.
 *
 * Scope, stated exactly: the play function proves the absence in the BAR ROW,
 * which is the whole of what this story renders (the panel is closed, so
 * asserting its contents from here would assert nothing). The panel's own
 * ro-only rule is covered in Header.test.tsx, which opens the menu in both
 * locales and queries within() it.
 */
export const NonRomanianLocale: Story = {
  globals: { locale: 'en', viewport: { value: 'notebook' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/en/services' } },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('link', { name: en.common.nav.blog }),
    ).toBeNull();
    await expect(
      canvas.getByRole('link', { name: en.common.nav.services }),
    ).toHaveAttribute('aria-current', 'page');
  },
};

/**
 * German, on `/de/services` — the C1 proof.
 *
 * German runs ~30–35% longer than English (§8.4), so GERMAN is what decides
 * where the breakpoint sits: "Startseite · Leistungen · Team · Blog" plus
 * "Kontakt" is the longest this row ever gets. At 1536 it must sit on one line
 * with room to spare, and nothing may wrap, clip or push the CTA off the edge.
 * If it ever stops fitting, the number moves (@3xl → @4xl) — never the
 * architecture, and never without the planning loop.
 */
export const GermanStress: Story = {
  // laptop = 1536, the width the C1 calibration sentence names.
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/de/services' } },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: de.common.nav.services }),
    ).toHaveAttribute('aria-current', 'page');
    // The German row is the one that can overflow: the bar must never scroll
    // sideways (§7 — nothing may require horizontal scrolling).
    const bar = canvas.getByRole('banner');
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  },
};
