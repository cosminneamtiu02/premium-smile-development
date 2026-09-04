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
// two mechanics that would otherwise fail SILENTLY are spelled out again
// because they are exactly as invisible here (a third used to live here: a
// pinned pretend route, needed while the site-map rows were next-intl <Link>s.
// They are plain anchors since §15.13, so this section now touches no router
// at all and pinning one would pin nothing):
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
 * ROW 1's `h-full` CHAIN, asserted here because this is the only place with a
 * real stylesheet AND a real Footer (G2 react-reviewer, F15).
 *
 * sections/Wordmark sizes its artwork as a percentage of the anchor's height,
 * and the anchor is `h-full` — so the whole lockup rests on a chain of three
 * boxes this file owns: the centring row, the `h-16` box inside it, and the
 * `self-stretch`-equivalent flex item. Break any link (drop the `h-16`,
 * centre instead of stretch) and the percentage resolves against `auto`: the
 * artwork keeps only its intrinsic size (D12: no bar). Nothing throws, and
 * the Wordmark's own stories cannot catch it — they reproduce the HEADER's
 * pill.
 *
 * `wide` selects the expected artwork step: the tighten step is a container
 * query on the gutter box, so it is live at the phone width and off at the
 * laptop one (the numbers live in Wordmark.tsx).
 */
const expectLockupChain = async (
  band: HTMLElement,
  wide: boolean,
): Promise<void> => {
  const anchor = band.querySelector('a:not([href])') as HTMLElement;
  const img = anchor.querySelector('img') as HTMLElement;

  // 5rem, the height both consumers agree on (fb-205) — measured, not read
  // back off a class. It was 64px until 2026-09-04, when the owner's "same
  // size on every screen" took Header's row to `h-20` and fb-205 carried the
  // Footer's ruler with it; this is the assertion that would have caught the
  // two drifting apart, so it moves in the same edit or not at all.
  await expect(anchor.getBoundingClientRect().height).toBe(80);
  await expect(
    Math.round(
      (img.getBoundingClientRect().height /
        anchor.getBoundingClientRect().height) *
        100,
    ),
  ).toBe(wide ? 90 : 40);
};

/**
 * The everyday picture, Romanian, on the laptop width the §13 matrix samples.
 *
 * This is the story that shows the FOUR-COLUMN row: contact with the phone
 * link · the site map (four links, Blog included) · the ANPC/SAL badge · the
 * opening hours with Sunday dimmed. Above it the centred brand line, below it
 * the three-part legal strip — copyright left, back-to-top centred, the
 * four-disc contact row right (Instagram · TikTok · WhatsApp · phone, the
 * owner's fb-334 order).
 *
 * The play function proves the facts a picture cannot: that the band is a real
 * contentinfo landmark, that the tel: href is the E.164 number while the
 * visible text is the human one, and where the two contact discs actually go —
 * a screenshot shows two circles, not their destinations.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('contentinfo');
    const phone = canvas.getByRole('link', { name: clinic.phoneDisplay });

    await expect(phone).toHaveAttribute('href', `tel:${clinic.phone}`);
    await expect(
      canvas.getByRole('link', { name: ro.common.nav.blog }),
    ).toBeInTheDocument();
    // The strip's two contact discs act DIRECTLY (board D1/D2): the WhatsApp
    // one opens the clinic's own chat, the phone one dials — never a modal.
    await expect(
      canvas.getByRole('link', {
        name: ro.common.footer.contactWhatsapp.replaceAll(
          '{name}',
          clinic.name,
        ),
      }),
    ).toHaveAttribute('href', `https://wa.me/${clinic.whatsapp}`);
    await expect(
      canvas.getByRole('link', {
        name: ro.common.footer.contactPhone.replaceAll('{name}', clinic.name),
      }),
    ).toHaveAttribute('href', `tel:${clinic.phone}`);
    await expectNoSidewaysScroll(band);
    // Row 1's lockup, at the width where the tighten step is OFF (the gutter
    // box here is ~1214px, far past the 20rem container step).
    await expectLockupChain(band, true);
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
    // The TIGHTENED half of the lockup chain (G2 react r2, M1): at the phone
    // width the gutter box is under the @max-xs step, so the artwork must be
    // at 40%. This is the ONE assertion that notices the Footer losing its
    // `@container` (the gutter-box `@container` comment in Footer.tsx) — the
    // query then never matches, the
    // lockup renders full-size at every width, and nothing else throws.
    await expectLockupChain(band, false);
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
