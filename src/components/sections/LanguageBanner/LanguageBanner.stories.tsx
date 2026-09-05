import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import de from '@/messages/de.json';
import it from '@/messages/it.json';
import { LanguageBannerCard } from './LanguageBanner';

// sections/LanguageBanner — the declared visual manifest for this lane
// (owner-approved board `.claude/plans/language-banner.plan.md`, verdict
// fb-345). The export NAMES are load-bearing: renaming one renames its
// baseline file.
//
// ── WHY THESE STORIES RENDER THE CARD AND NOT THE ISLAND (board §5's split).
// <LanguageBanner /> decides whether to appear from two facts about the
// VISITOR — the §8.7 cookie and `navigator.languages` — so a baseline taken
// through it would record whichever machine took the picture, and a story that
// stubs browser globals is a story that has stopped showing the product. The
// presentational half, <LanguageBannerCard />, is exported for exactly this:
// hand it a locale, three strings, an href and two callbacks and it renders,
// deterministically, forever. That is the ui/Modal open-state-story precedent
// (an open dialog is staged through `defaultOpen`, never through a click), and
// the wrapper's own logic — the visibility matrix, both cookie writes, the
// bfcache re-decide — is covered by LanguageBanner.test.tsx instead.
//
// ── THE §15.15 VERDICT THIS LANE OPENED WITH lives in LanguageBanner.tsx's
// header, dated 2026-09-04: the banner is NOT the third stateful overlay, the
// overlay-manners consolidation does not fire, and the trigger stays armed for
// the ClinicGallery lightbox. Nothing in these stories opens, traps or closes
// anything, which is that verdict seen from the outside.
//
// ── TWO STORIES, NOT THREE — the one place this file reads the board's §8
// story list differently, recorded here rather than discovered in review. That
// list asks for "Default · DE stress (longest strings) · 320-fit". For every
// other section on the site those are three different pictures, because German
// is the +30–35% language (§8.4) and the DE story is where text expansion is
// stressed. HERE THEY COLLAPSE: this card renders exactly one locale's three
// strings — the SUGGESTED language's, never the page's — so the German picture
// IS the realistic Default (a German-reading visitor on a Romanian page), and
// German is not even the longest of the fifteen owner-approved cells. Italian
// is: „Questa pagina è disponibile anche in italiano." runs 46 characters
// against German's 37. So the stress story carries ITALIAN, and it carries the
// 320px width too — a separate 390/1536 story with identical content would
// only add duplicate baselines to the net.
//
// ── BOTH STORIES PIN THEIR LOCALE with per-story `globals` (the Header /
// Footer / LanguageSwitcher convention): the locale toolbar is preview-level
// state in the Storybook manager, and the visual runner opens each story by URL
// (/iframe.html?id=…) with no toolbar state at all. The pin does NOT choose the
// card's language — its strings are props — it chooses the PAGE's, which is the
// point: the decorator stamps `document.documentElement.lang` per locale
// exactly as the shell does (§15.14), so the card's own `lang` really is
// overriding a Romanian document, hyphenation dictionary and all.
//
// ── layout 'fullscreen' AND A SHORT GROUND. The card is `fixed`, so Storybook's
// default 1rem padding would put the story's ground and the viewport-anchored
// card on two different rulers. The grounds are exactly `min-h-screen` for the
// FloatingActions reason: the visual spec captures fullPage, and a document
// taller than the viewport renders fixed elements at a mid-document position in
// the stitched image — an unreadable baseline.

/**
 * PAGE GROUND — Romanian prose with diacritics (§15.7), held constant in both
 * stories so a pixel diff cannot hide in the scenery. It is scenery: this
 * section renders no page text of its own, and in the stress story the card is
 * what changes language, exactly as FloatingActions' GermanOpen keeps its
 * ground Romanian while the corner switches.
 *
 * IT ALSO PLAYS THE BROWSER. The accept control is a real <a href> and the real
 * browser is what navigates it (§15.13) — inside Storybook's preview there is
 * no next document, so a click would take the iframe to a dead URL and the
 * owner would get an error page instead of a story (the LanguageSwitcherDemo
 * host, minus the state it needed). The handler is React's own onClick on a
 * wrapper, in the bubble phase, so the card's own onAccept has ALREADY run when
 * this one cancels: production order exactly, with nothing hidden.
 * `role="presentation"` says what the box is — not a control, a stand-in for
 * the browser — and is why jsx-a11y does not (rightly) ask it for a keyboard
 * handler.
 */
const Ground = ({ children }: { children: ReactNode }): ReactElement => (
  <div
    role="presentation"
    className="min-h-screen px-4 py-8"
    onClick={(event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a[href]')) {
        event.preventDefault();
      }
    }}
  >
    <div className="flex max-w-prose flex-col gap-4">
      <p>Clinica este deschisă de luni până vineri, între orele 9 și 18.</p>
      <p>
        Programările se fac telefonic. Vă răspundem în cel mult o zi lucrătoare
        și vă propunem prima oră liberă din cabinet.
      </p>
    </div>
    {children}
  </div>
);

const meta = {
  title: 'Sections/LanguageBanner',
  component: LanguageBannerCard,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Ground>
        <Story />
      </Ground>
    ),
  ],
  argTypes: {
    suggested: {
      control: false,
      description:
        'The language being offered — the card’s own `lang` and every string’s (SC 3.1.2). The island derives it from `navigator.languages`; a story pins it',
    },
    strings: {
      control: false,
      description:
        'That locale’s three owner-authored strings (`common.language.banner`), resolved for ALL FIVE locales by the shell at build time (D6) because a client island only receives the page locale’s messages',
    },
    href: {
      control: false,
      description:
        'The finished URL — locale prefix, trailing slash and interim base path already on (localeHref); the blog’s Romanian-only pages resolve to the target locale’s home (equivalentPath, §5)',
    },
    onAccept: { control: false },
    onDismiss: { control: false },
  },
  args: {
    // Plain no-ops: both handlers are one-line side effects owned by the
    // WRAPPER (write the cookie · write the cookie and hide), and both are
    // pinned byte-exactly in LanguageBanner.test.tsx. A story that re-created
    // them would be photographing its own fixture.
    onAccept: () => {},
    onDismiss: () => {},
  },
} satisfies Meta<typeof LanguageBannerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY PICTURE, and the realistic pair: a German-reading visitor who
 * landed on a Romanian page. The card speaks German — sentence, link and the
 * ✕'s accessible name all come from de.json — while the document around it
 * stays Romanian, which is the whole situation the §8.6 banner exists for.
 *
 * The geometry is what the two tier widths are sampling (board §2): a centred
 * toast, `w-fit` up to `max-w-md`, lifted 6.5rem + the safe-area inset clear of
 * the bottom edge so it never sits in the corner controls' row. At 390 it is a
 * near-full-width card; at 1536 it hugs its sentence.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  args: {
    suggested: 'de',
    strings: de.common.language.banner,
    // A finished href, spelled out rather than built here: what the wrapper
    // hands over is a string, and localeHref/equivalentPath are pinned by
    // LanguageBanner.test.tsx and lib/routes.test.ts.
    href: '/de/services/',
  },
  play: async ({ canvas }) => {
    // The landmark, named by its own sentence (board §4 · Q-C): a screen reader
    // announces "Diese Seite gibt es auch auf Deutsch, complementary" — in
    // German, because the root carries `lang`. This is also the state the
    // per-story axe run audits.
    const banner = canvas.getByRole('complementary', {
      name: de.common.language.banner.text,
    });
    await expect(banner).toHaveAttribute('lang', 'de');

    const accept = canvas.getByRole('link', {
      name: de.common.language.banner.accept,
    });
    await expect(accept).toHaveAttribute('href', '/de/services/');
    await expect(accept).toHaveAttribute('hreflang', 'de');

    // Icon-only, so the ✕'s NAME is the dismiss string and the glyph itself
    // stays decorative — a labelled glyph inside a labelled button
    // double-announces (§9, §6.3's rule written by hand: this is a plain
    // <button>, so no type enforces it).
    // NOT `toBeVisible()`: jest-dom reads opacity, and this card arrives on a
    // 200ms @starting-style fade — a play function runs live, inside that
    // window, where the assertion is a coin toss (the PR #45 rule, met in the
    // story runner instead of a unit suite). The visual net has no such problem:
    // toHaveScreenshot finishes CSS transitions before it shoots.
    const dismiss = canvas.getByRole('button', {
      name: de.common.language.banner.dismiss,
    });
    await expect(dismiss).toHaveAccessibleName(
      de.common.language.banner.dismiss,
    );
    await expect(dismiss.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  },
};

/**
 * THE STRESS STORY, and the 320px accessibility width in one (see the file
 * header for why they are not two).
 *
 * ITALIAN is the longest of the fifteen owner-approved cells — the sentence
 * runs 46 characters against German's 37 and Romanian's 44, and „Continua in
 * italiano" is a longer link than either — so this is the §8.4 headroom check
 * this component actually has. Nothing here is a fixed width (`w-fit` inside
 * `max-w-md`, `min-h-11` on the link so a wrapped label still has an honest
 * height), which is what the picture is for.
 *
 * The 'stress-320' tag is what carries it into the visual net at 320 on top of
 * the tier's own 390 + 1536 (tests/visual/stories.spec.ts); the viewport pin is
 * for the manager's canvas, which the runner ignores — it sets its own page
 * size per project (the Wordmark Stress320 precedent). At 320 the card has
 * 288px between its 1rem margins and nothing may require horizontal scrolling
 * (§7, §9); both controls stay at or above the 44px target floor.
 */
export const LongestFit320: Story = {
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  tags: ['stress-320'],
  args: {
    suggested: 'it',
    strings: it.common.language.banner,
    href: '/it/services/',
  },
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('complementary', {
      name: it.common.language.banner.text,
    });
    await expect(banner).toHaveAttribute('lang', 'it');
    // THE CLAIM, WRITTEN VIEWPORT-INDEPENDENTLY (the Wordmark Stress320
    // lesson): a play function runs in the story runner, which sets its own
    // page size and ignores the manager's viewport pin, so an assertion about
    // 288px would be an assertion about whichever width that runner happened to
    // use. "Both edges are inside the viewport" is the same §7 claim — nothing
    // may require horizontal scrolling — and it holds at every width, 320
    // included, where the card has 288px between the margins `inset-x-4`
    // reserves.
    const box = banner.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    // …and neither control was squeezed below the §9 floor to achieve it.
    const dismiss = canvas.getByRole('button', {
      name: it.common.language.banner.dismiss,
    });
    await expect(dismiss.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      44,
    );
  },
};
