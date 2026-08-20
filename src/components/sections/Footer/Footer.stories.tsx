import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { clinic } from '@/lib/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { Footer } from './Footer';

// The Footer's four stories — the 2×2 matrix of the two things that can change
// its shape: the WIDTH (which container step the band sits in) and the LANGUAGE
// (German runs ~30–35% longer, §8.4). Conventions are the Header's, and the
// three mechanics that would otherwise fail SILENTLY are spelled out again
// because they are exactly as invisible here:
//
// ── 1. Every story PINS ITS OWN LANGUAGE with per-story `globals`. The locale
// toolbar is preview-level state in the Storybook manager; the visual runner
// opens each story by URL (/iframe.html?id=…) with no toolbar state at all.
// Without the pin, the German baselines would be Romanian pictures — green, and
// proving nothing.
//
// ── 2. Every story PINS ITS OWN VIEWPORT, and here that pin is what makes the
// story mean anything: the grid steps measure the GUTTER BOX (canvas − 2×10vw),
// so the four-column row appears only from a ~1280px canvas and the two-column
// one from ~960px. A manager canvas narrowed by the sidebar sits in the middle
// of that band. Playwright ignores the pin — it sets its own page size per
// project — so the visual net still samples every story at 390 + 1536 (§13,
// `Sections/*` prefix → tests/visual/stories.spec.ts).
//
// ── 3. Every story PINS A PRETEND ROUTE with `parameters.nextjs.navigation`.
// The Footer marks no active route, so nothing here depends on the pathname —
// but its links are real next-intl <Link>s, and `appDirectory: true` is what
// mounts the app-router contexts they resolve against. Without it the framework
// mounts the pages-router mock instead.
//
// The section takes NO props and translates itself, so there are no args and no
// controls: the locale toolbar is this component's control surface. Flip it to
// Pseudo and every string in the band must come out accented — untransformed
// text there is a hardcoded string, i.e. a bug (§8.9). The two strings that
// must NOT change are the clinic name and the address: they are data from
// lib/clinic.ts (§10.1), not copy.
//
// layout 'fullscreen' because the band is full-bleed and owns its own gutter
// clamp: Storybook's default 1rem padding would add a second inset on top of it
// and put the story's ground and the band's margins on two different rulers.

/**
 * Page GROUND, deliberately IDENTICAL in all four stories and deliberately
 * Romanian (§15.7): it is not component copy, it is the page the band closes.
 * Holding it constant means the only thing that differs between two baselines
 * is the Footer itself — a diff cannot hide in the scenery.
 *
 * The Footer is LAST in flow, as it is in the shell (§4: layout.tsx renders
 * Header · {children} · Footer), and the ground is short on purpose: the visual
 * spec captures fullPage, so a tall document would push the band out of the
 * interesting part of the frame.
 *
 * <main> is not decoration either — every visible string on a page must sit
 * inside a landmark or the per-story axe audit reports the loose text.
 */
const Ground = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="flex min-h-screen flex-col">
    <main className="mx-auto flex max-w-prose flex-col gap-4 px-4 py-8">
      <p>Clinica este deschisă de luni până vineri, între orele 9 și 19.</p>
      <p>
        Programările se fac telefonic. Vă răspundem în cel mult o zi lucrătoare
        și vă propunem prima oră liberă din cabinet.
      </p>
    </main>
    <div className="mt-auto">{children}</div>
  </div>
);

const meta = {
  title: 'Sections/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Ground>
      <Footer />
    </Ground>
  ),
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/**
 * The everyday picture, Romanian, on the laptop width the §13 matrix samples.
 *
 * This is the story that shows the FOUR-COLUMN row: contact with the phone
 * link · the site map (four links, Blog included) · the ANPC/SAL badge · the
 * opening hours with Sunday dimmed. Above it the centred brand line, below it
 * the three-part legal strip — copyright left, back-to-top centred, the two
 * social discs right.
 *
 * The play function proves the two facts a picture cannot: that the band is a
 * real contentinfo landmark, and that the tel: href is the E.164 number while
 * the visible text is the human one.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/ro/services' } },
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('contentinfo');
    const phone = canvas.getByRole('link', { name: clinic.phoneDisplay });

    await expect(phone).toHaveAttribute('href', `tel:${clinic.phone}`);
    await expect(
      canvas.getByRole('link', { name: ro.common.nav.blog }),
    ).toBeInTheDocument();
    await expectNoSidewaysScroll(band);
  },
};

/**
 * The phone, Romanian — the other width §13 samples for this tier.
 *
 * Below every step the band is ONE column: the four info blocks stack in DOM
 * order and the legal strip centres all three of its parts. That centring is an
 * accessibility requirement rather than a preference — FloatingActions' fixed
 * call disc owns the bottom-right corner at every scroll position, so a 44px
 * social button flush against the right margin would sit behind it (SC 2.4.11).
 *
 * 320px is not pinned here: the visual matrix gives `Sections/*` 390 + 1536,
 * and the no-horizontal-scroll assertion below is width-agnostic — it holds
 * wherever the story is rendered.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/ro' } },
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('contentinfo');

    // Everything is still THERE at the phone width — the band stacks, it never
    // drops content (§7: the sampled sizes are sampling points, not designs).
    await expect(
      canvas.getByRole('link', { name: ro.common.footer.salLabel }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: ro.common.footer.backToTop }),
    ).toHaveAttribute('href', '#top');
    await expectNoSidewaysScroll(band);
  },
};

/**
 * German at 1536 — the CALIBRATION story for both container steps.
 *
 * German is the longest language this site speaks (§8.4), so it is what decides
 * whether @3xl/@5xl sit in the right place and whether the 0.6fr site-map track
 * is wide enough. The things to look at: "Öffnungszeiten" over its SEVEN
 * per-day rows (owner 2026-08-18) — "Montag" … "Sonntag · Geschlossen", with
 * "Donnerstag" the widest day word — the longer "Kontaktieren Sie uns hier",
 * and "Nach oben" in the strip. Nothing may wrap
 * mid-label, clip, or push a column into its neighbour. If it ever stops
 * fitting, the STEP moves to the adjacent Tailwind name (@5xl → @6xl) — never
 * to a custom value, and never without the planning loop.
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/de/services' } },
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('contentinfo');

    await expect(
      canvas.getByRole('link', { name: de.common.nav.services }),
    ).toBeInTheDocument();
    // The German hours column, straight out of Intl — per-day rows now, and
    // "Donnerstag" is the widest day word the narrow track must hold.
    await expect(band).toHaveTextContent('Donnerstag');
    await expect(band).toHaveTextContent(de.common.footer.closed);
    await expect(band).toHaveTextContent(de.common.footer.hoursTitle);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * German on the phone — the §5 proof: NO Blog link.
 *
 * The blog is Romanian-only, so `/de/blog` is never generated and must never be
 * offered. Three links in the site-map column here, four in the Romanian ones —
 * and the difference comes from lib/routes.ts, the same module the Header's row
 * and panel filter, so this story fails the moment the two disagree.
 */
export const NonRomanianLocale: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/de' } },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('link', { name: de.common.nav.blog }),
    ).toBeNull();
    // …while the other three ship, in German.
    for (const label of [
      de.common.nav.home,
      de.common.nav.services,
      de.common.nav.team,
    ]) {
      await expect(
        canvas.getByRole('link', { name: label }),
      ).toBeInTheDocument();
    }
    await expectNoSidewaysScroll(canvas.getByRole('contentinfo'));
  },
};
