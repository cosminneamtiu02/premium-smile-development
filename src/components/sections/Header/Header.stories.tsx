import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { clinic } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import ro from '@/messages/ro.json';
import { Header } from './Header';

// The Header's five stories, built to the owner-approved N2 contract board
// .claude/plans/header-n2-contract.plan.md §6 — the fifth, AtTheStep, added by
// the header-nav-gap lane (the owner's ask, 2026-09-26).
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
// to all four when the bar became a floating pill (owner, 2026-08-16), and
// worn by the fifth. The breakpoint measures the BAR, and the pill's side
// margins mean the row appears only once the canvas is ≈1260px+ (bar =
// canvas − the scrollbar gutter − 2×10vw − 2px ≥ 62rem, the bar's step since
// 2026-10-01, 60rem from 2026-09-26 — Header.tsx's "THE BREAKPOINT IS A CONTAINER STEP"). A manager
// canvas narrowed by the sidebar and addons panel sits right in that band —
// the Notebook pin itself is 1280, only ~60px past it — so an unpinned
// row-proving play would throw
// TestingLibraryElementError on smaller screens — the row it asserts is
// legitimately display:none there. Each pin puts the story at a width where
// its contract holds; Playwright ignores the pin (it sets its own per-project
// page size), so visual baselines still sample 390 + 1536.

/**
 * Page GROUND, deliberately IDENTICAL in all five stories and deliberately
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
  // The wrapper Phase 4 will put around the whole document, standing in here.
  // Both of the Header's Contact CTAs are ContactModalTriggers since the
  // ContactModal wiring (org-review F1), and a trigger outside a provider
  // THROWS by design — useContactModal names the missing wrapper rather than
  // shipping a dead button — so without this decorator every story below would
  // fail to render. It serves all three in-browser gates at once: the canvas,
  // per-story axe, and the visual net.
  // THE DIALOG STAYS CLOSED in every story (`defaultOpen` is left at false, and
  // no play function presses a Contact CTA), which is what keeps the baselines
  // at zero pixels of change: the provider renders no box of its own, and the
  // closed <dialog> is display:none by globals.css' `dialog:not([open])` rule.
  // The dialog's OWN states are storied where they belong, in
  // ContactModal.stories.tsx.
  decorators: [
    (Story): ReactElement => (
      <ContactModalProvider>
        <Story />
      </ContactModalProvider>
    ),
  ],
  render: () => (
    <Ground>
      <Header />
    </Ground>
  ),
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE CONTACT'S FLOOR (owner, 2026-10-01: "also paint the contact button from
 * top bar a lilla and make it wider, more seszable and adjust to widest
 * language form") — Header.tsx carries the arithmetic: the bar's Contact is
 * ui/Button's md face — 44px, the row's own height; "wider just, not also
 * taller" — under a 10rem `min-w-40` the section owns, measured so that the
 * widest of the five labels („Contatti", 66.4px at 18px medium, plus 2 × 20px
 * of padding = 106.4px natural) sits inside it with slack. So in EVERY
 * language the box is exactly the floor, 10rem × 2.75rem; a label that
 * outgrew it — a longer sixth language, a bigger face — would widen the box
 * past 10rem and fail here, in Romanian below and in German further down.
 * Widths are text widths, so the fonts first — AtTheStep's idiom: load()
 * rejects on a 404, ready resolves on a failure too, check() is the premise.
 */
const expectContactAtItsFloor = async (contact: HTMLElement) => {
  const FONT = '1rem "Source Serif 4 SB"';
  await expect(await document.fonts.load(FONT)).not.toHaveLength(0);
  await document.fonts.ready;
  await expect(document.fonts.check(FONT)).toBe(true);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const box = contact.getBoundingClientRect();
  await expect(box.width).toBeCloseTo(10 * rem, 0);
  await expect(box.height).toBeCloseTo(2.75 * rem, 0);
};

/**
 * THE BAR'S LOCKUP AT THE OWNER'S SIZES (2026-10-01: "make logo in top bar
 * 15% smaller", "make the logo 10% smaller again", "make the text 50% bigger
 * than it is now", then "update also in footer") — sections/Wordmark carries
 * them (its THE OWNER'S SIZES block) and Header.tsx hands it a cell the whole
 * row tall, centring the lockup's hugging link in it (2026-10-02, Wordmark's
 * D9), so in the bar the mark is 68.85% of the row (90% × 85% × 90%) and the
 * name Heading's `section` step, 1.875rem — and below the Wordmark's
 * `@max-md` step (a pill under 28rem: a phone up to ~525px wide, the 390
 * smartphone pin included; `@max-sm`, 24rem, until 2026-10-09, when
 * ui/Container's THE PHONE GUTTER widened the pill by a tenth of the window)
 * the mark is 30.6% of the row and the name the old 20px, 1.25rem (the
 * phone fitting, 2026-10-01). Measured off the layout as
 * RATIOS of the row and the root, so the pin holds at any root font size and
 * at every width the visual runner samples — which step applies is read off
 * the pill itself, the box the container query measures. And the smaller mark
 * must not have moved anything: the mark and the name both sit on the row's
 * centre line.
 */
const expectMarkAtTopBarSize = async (bar: HTMLElement): Promise<void> => {
  const row = bar.querySelector(':scope > div');
  const box = row?.firstElementChild;
  const mark = box?.querySelector('img');
  const name = box?.querySelector('span');
  if (!row || !box || !mark || !name) {
    throw new Error(
      'expectMarkAtTopBarSize: the bar has no brand box (row → box → the ' +
        "lockup's <img> and name) — Header.tsx or sections/Wordmark changed " +
        'shape.',
    );
  }
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const phone = bar.clientWidth < 28 * rem;
  const share = phone ? 0.306 : 0.6885;
  const r = row.getBoundingClientRect();
  await expect(box.getBoundingClientRect().height).toBeCloseTo(r.height, 3);
  const m = mark.getBoundingClientRect();
  await expect(m.height / r.height).toBeCloseTo(share, 3);
  await expect(parseFloat(getComputedStyle(name).fontSize) / rem).toBeCloseTo(
    phone ? 1.25 : 1.875,
    3,
  );
  const centre = r.top + r.height / 2;
  const n = name.getBoundingClientRect();
  await expect(Math.abs(m.top + m.height / 2 - centre)).toBeLessThanOrEqual(
    0.5,
  );
  await expect(Math.abs(n.top + n.height / 2 - centre)).toBeLessThanOrEqual(
    0.5,
  );
};

/**
 * The everyday picture, Romanian, on `/ro/services`.
 *
 * Proves the whole contract in one frame at each sampled width: at 390 the
 * links are gone and the burger is the only control; at 1536 the full row is
 * on one line — brand, three links with Servicii underlined, the lilac
 * Contact button on its 10rem floor (44px, wider only) — and no burger. Both variants are in the HTML at both widths; the
 * container query decides which is drawn (the bar's step, §6.5).
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
    // The brand corner is the home link too (owner, 2026-10-02 —
    // Wordmark.tsx's D9): named by `common.brand.ariaLabel` with the clinic's
    // name, the visible text first, and pointing at the Romanian home.
    await expect(
      canvas.getByRole('link', {
        name: ro.common.brand.ariaLabel.replace('{name}', clinic.name),
      }),
    ).toHaveAttribute('href', '/ro/');
    await expectContactAtItsFloor(
      canvas.getByRole('button', { name: ro.common.actions.contact }),
    );
    await expectMarkAtTopBarSize(canvas.getByRole('banner'));
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
    // The bar keeps its brand while the panel is open (BRAND + ✕) — and at
    // this story's phone width that brand is past the Wordmark's tighten step.
    await expectMarkAtTopBarSize(canvas.getByRole('banner'));
  },
};

/**
 * English, on `/en/services` — the story that proves the BLOG LINK IS GONE.
 *
 * The blog is Romanian-only (§5), so `/en/blog` must never be offered. Three
 * links here — and, while lib/routes hides the blog row (owner 2026-09-20,
 * "drop it for now"), three in the Romanian stories too.
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
 * German, on `/de/services` — the calibration language at the laptop width.
 *
 * German runs ~30–35% longer than English (§8.4), so GERMAN is what decides
 * where the breakpoint sits: "Startseite · Leistungen · Team" (Blog hidden
 * for now; it never shipped on `de` anyway) plus
 * "Kontakt" is the longest this row ever gets. At 1536 it must sit on one line
 * with room to spare, and nothing may wrap, clip or push the CTA off the edge.
 * This is the proof far from the step; AtTheStep below is the proof AT it.
 * If German ever stops fitting there, the number moves (Header.tsx carries
 * the arithmetic that put it at 62rem) — never the architecture, and never
 * without the planning loop.
 */
export const GermanStress: Story = {
  // laptop = 1536, the sampled width far past the bar's step.
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
    // „Kontakt" sits in the same 10rem box as „Contact" does.
    await expectContactAtItsFloor(
      canvas.getByRole('button', { name: de.common.actions.contact }),
    );
  },
};

/**
 * German, on `/de/services`, with the bar's content box held at 62rem + 4px —
 * THE PROOF AT THE FLIP (header-nav-gap lane, the owner's ask, 2026-09-26:
 * "it should maintain at least a little space between 'premium smile' and
 * first button of menu, like idk, 70% of the width of the menu button …").
 *
 * The narrowest bar that ever shows the row, in the language that makes the
 * row widest: this is where the brand-to-first-link gap sits at its FLOOR.
 * Header.tsx's "THE BREAKPOINT IS A CONTAINER STEP" block puts the step at
 * 62rem so that German keeps ≥ 4rem (64px — ~70% of the 94px "Startseite")
 * there; at this story's 996px bar the expected gap is
 * (964 − 279.3) / 2 − 270.1 ≈ 72.2px (row = bar − the `px-4`; nav 279.3;
 * the brand at the owner's sizes of 2026-10-01, 270.1). At the old 60rem
 * step (a 964px bar) it was ≈ 67.85px with the demo cat's 258.5px brand,
 * ≈ 104.4px with the clinic's mark at the full row and ≈ 56.25px at the
 * owner's sizes — under the floor, which is why the step moved (Header.tsx,
 * THE BRAND GREW).
 *
 * HOW THE FRAME REACHES THE STEP at any window width: the pill's side margins
 * are ui/Container's `containerClasses`, `clamp(1rem, 10vw, 12.5rem)` each
 * from a 600px window up (half that on a phone since THE PHONE GUTTER,
 * 2026-10-09 — widths where this box never binds: its 62rem branch wins the
 * `min()` only from a ~1260px window), so a box of 62rem + 6px + twice that
 * clamp leaves the bar's border box at 62rem + 6px and its CONTENT box at
 * exactly 62rem + 4px — four pixels above the step, so sub-pixel rounding
 * can never drop it under. The wrapper sits
 * INSIDE the shared Ground, so the page ground is the other stories'. At the
 * 390 phone width the `100%` branch of the `min()` wins and the frame is the
 * ordinary phone — the burger, as it must be. The Sections/* tier photographs
 * 390 + 1536; at 1536 the wrapper is 62rem + 6px + 307.2px ≈ 1305px, so that
 * frame IS the step.
 *
 * The play measures, it does not read classes back: the row is drawn (the
 * current link is reachable by role, which a display:none row is not), the
 * bar really is at the step, the gap is within [4rem, 7rem] — the owner's
 * floor, and a ceiling that proves this frame is AT the step and not past
 * it (set for the clinic's mark at the full row, ≈ 104.4px here, a wider bar
 * adding a pixel of gap for every two of bar; 5rem was the ceiling for the
 * demo cat's 67.85; ≈ 72.2px is expected at the owner's sizes and this 62rem
 * frame) — the bar never scrolls sideways, and the nav still sits on the
 * bar's centre line: at the step each side track is ≥ 340px against the
 * 270.1px brand, so exact centring holds here too.
 */
export const AtTheStep: Story = {
  globals: { locale: 'de', viewport: { value: 'notebook' } },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/de/services' } },
  },
  render: () => (
    <Ground>
      <div className="mx-auto w-[min(100%,calc(62rem+6px+clamp(2rem,20vw,25rem)))]">
        <Header />
      </div>
    </Ground>
  ),
  play: async ({ canvas }) => {
    // Widths below are text widths: measure only once the fonts have landed —
    // and ASSERT that they did. `fonts.ready` resolves on a load FAILURE too,
    // and the gap has ~4px of headroom over its floor, so a 404'd subset (a CI
    // container, a `staticDirs` edit) would otherwise fail below with a bare
    // number that reads as "the step moved". ContactModal.test.tsx's idiom:
    // load() REJECTS on a 404, a non-empty result proves .storybook/
    // preview-fonts.css still declares the family, and check() is the premise.
    const FONT = '1rem "Source Serif 4 SB"';
    await expect(await document.fonts.load(FONT)).not.toHaveLength(0);
    await document.fonts.ready;
    await expect(document.fonts.check(FONT)).toBe(true);

    await expect(
      canvas.getByRole('link', { name: de.common.nav.services }),
    ).toHaveAttribute('aria-current', 'page');

    const bar = canvas.getByRole('banner');
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    // The frame IS the step: the bar's content box (no padding on the
    // <header>, so clientWidth) sits 0–8px above 62rem — the wrapper's
    // arithmetic, which a change to the pill's margins would silently void.
    await expect(bar.clientWidth - 62 * rem).toBeGreaterThanOrEqual(0);
    await expect(bar.clientWidth - 62 * rem).toBeLessThanOrEqual(8);

    // The brand corner is sections/Wordmark's lockup: an <a> around the
    // artwork <img> and the name. Found through the <img> — which Wordmark's
    // D10 renders at every width — and `closest('a')` (Wordmark.test.tsx's own
    // idiom), NOT through its href: the lockup was an hrefless placeholder
    // until 2026-10-02 and is a home link now (Wordmark's D9), and a selector
    // keyed on the href's presence or absence breaks at each such turn. A
    // missing lockup is thrown by NAME rather than left to a TypeError
    // further down. The gap is measured from what the lockup PAINTS, the
    // right edge of its last child (the name), never from the anchor's own
    // box: WebKit once sized that box from the artwork's natural width
    // (301.5px around the 258.5px the demo cat's lockup painted, measured
    // 2026-09-26) and Firefox lets the brand's CELL span its whole track, so
    // a box edge could misreport the air between "Smile" and the first link.
    // Since the mark became a fixed rem with `max-w-none` (2026-10-01) the
    // link box hugs the lockup in Chromium and WebKit alike (270.1px,
    // measured 2026-10-02), and the painted edge stays the honest measure all
    // the same.
    const brand = bar.querySelector('img')?.closest('a');
    if (!brand) {
      throw new Error(
        'AtTheStep: the bar has no brand lockup (an <img> inside an <a>) — ' +
          'sections/Wordmark changed shape, so the gap this story proves has ' +
          'no left edge to measure from.',
      );
    }
    const brandRight = Math.max(
      ...Array.from(brand.children, (c) => c.getBoundingClientRect().right),
    );
    const nav = canvas.getByRole('navigation', {
      name: de.common.nav.ariaLabel,
    });
    const [first] = within(nav).getAllByRole('link');
    const gap = first.getBoundingClientRect().left - brandRight;
    // ≥ 4rem is the owner's floor; ≤ 7rem proves this frame really is AT the
    // step rather than comfortably past it (the doc comment has the
    // arithmetic: ≈ 72.2px at the owner's sizes since the step moved to
    // 62rem, 2026-10-01; 5rem was the ceiling for the demo cat's ≈ 67.85px).
    await expect(gap).toBeGreaterThanOrEqual(4 * rem);
    await expect(gap).toBeLessThanOrEqual(7 * rem);

    // §7 — nothing may require horizontal scrolling.
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);

    // The nav on the bar's centre line, within a pixel.
    const b = bar.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    await expect(
      Math.abs((n.left + n.right) / 2 - (b.left + b.right) / 2),
    ).toBeLessThanOrEqual(1);
  },
};
