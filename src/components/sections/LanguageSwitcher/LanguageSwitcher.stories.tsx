import { useState, type ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { NextIntlClientProvider, useLocale, useMessages } from 'next-intl';
import { expect, waitFor } from 'storybook/test';
import { localeHref } from '@/i18n/href';
import { type Locale, locales, nativeNames } from '@/i18n/locales';
import { usePathname } from '@/i18n/navigation';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
import ro from '@/messages/ro.json';
import {
  LanguageSwitcher,
  type LanguageSwitcherProps,
} from './LanguageSwitcher';
import type { SpeedDialDirection } from '@/components/ui/SpeedDial/SpeedDial';

// Two stories, and the visual manifest says exactly two: closed and open, at
// 390 + 1536 each (the `Sections/*` title prefix is what routes them there —
// tests/visual/stories.spec.ts, §13). The export NAMES are load-bearing:
// renaming one renames its baseline file.
//
// ── WHY THERE IS NO GERMAN OR PSEUDO STORY, deliberately (memory: section
// stories pin locale — no pseudo flip). This dial renders no prose: two or
// three unexpandable letters in a disc, and endonyms that are the same word in
// every language version of the site. Its ONE translated string is the bulb's
// accessible name, which lives in the a11y tree, not in the picture — a DE
// baseline would be pixel-identical to the RO one. That string is covered
// three other ways instead: LanguageSwitcher.test.tsx sweeps all five locales
// and asserts each name comes from that locale's file (and never renders a key
// path), the translation-parity gate refuses a missing translation, and the
// per-story axe run audits the names these two stories do render.
//
// ── BOTH STORIES PIN THEIR LOCALE with per-story `globals` (the Header/Footer
// precedent). The locale toolbar is preview-level state that lives in the
// Storybook manager UI; the visual runner opens each story by URL
// (/iframe.html?id=…) with no toolbar state at all, so without the pin a
// baseline records whatever the last person left selected.
//
// ── AND THEIR PRETEND ROUTE with `parameters.nextjs.navigation`.
// @storybook/nextjs-vite feeds that pathname through the real Next app-router
// contexts, where @/i18n/navigation's usePathname reads it and stripLocale
// UNPREFIXES it — '/ro/services' arrives in the hook as '/services'. That chain
// is the REAL one (the interaction suite mocks the module, so these stories are
// where it is exercised end to end, and the Default play asserts the four hrefs
// it produces). `appDirectory: true` is what selects those contexts at all —
// without it the framework mounts the pages-router mock and next/navigation's
// usePathname is null (our hook reads that as the root rather than crashing).

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it };

/** The bulb's name as the shipped data builds it — never a typed-out literal. */
const bulbName = (locale: Locale): string =>
  MESSAGES[locale].common.language.switch.replace(
    '{name}',
    nativeNames[locale],
  );

/**
 * PathnameContext holds what Next's app router puts in it — and the router
 * removes the deployment's base path BEFORE that value is ever read
 * (next/dist/client/components/app-router.js: `hasBasePath(…) ?
 * removeBasePath(…)`). Our own stripLocale relies on that: it takes off the
 * locale segment and nothing else.
 *
 * Both values this demo feeds the context come from the other side of that
 * line — localeHref() and an anchor's resolved .href both INCLUDE the interim
 * Pages base path (§15.2) when Storybook is built with PAGES_BASE_PATH
 * exported. Feeding one back in unstripped would stack the prefix on every
 * re-render: '/premium-smile-development/de/premium-smile-development/ro/…'.
 * Only a story would ever see it — the browser never round-trips a pathname
 * like this — but a wrong story is a wrong review.
 *
 * Read at CALL time, not at module load: the same convention as
 * src/i18n/href.ts' basePath(), and the Storybook build inlines the variable
 * exactly as next.config.ts' `env` does for the browser bundle.
 */
const withoutBasePath = (pathname: string): string => {
  const base = process.env.PAGES_BASE_PATH ?? '';
  return base && pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname;
};

/**
 * THE NEXT PAGE, STAGED — the SpeedDialDemo / ModalDemo play, and REQUIRED
 * here rather than a nicety.
 *
 * On the real site every disc is a plain link and the BROWSER leaves for a
 * whole new document (§15.13). Inside Storybook's preview there is no next
 * document: a pick navigates the iframe to a dead URL and the owner gets an
 * error page instead of a story (rejected on Lane A). So this host plays the
 * part of the browser — it cancels the navigation and re-renders the dial with
 * the state the NEXT page would have had: the picked language in the bulb,
 * named from its own message file, the other four re-fanned in manifest order,
 * and every href rebuilt for the new address (D1, model C). The dial stays
 * open, because a link pick is the one close the atom deliberately does not
 * perform.
 *
 * Three mechanics deserve their reason in writing:
 *
 * · THE HANDLER IS ON A WRAPPER, IN THE BUBBLE PHASE, and it is React's own
 *   onClick — not a native listener. React delegates every handler to the root
 *   container and replays them in tree order, so the anchor's handler (the
 *   section's onSelect, which writes the cookie) has ALREADY run by the time
 *   this one cancels the navigation. That is production order exactly, with
 *   nothing hidden: the story shows the same sequence a visitor triggers.
 *   A native addEventListener on this div would fire BEFORE React's root
 *   container and quietly invert it. `role="presentation"` says what the box
 *   is — not a control, a stand-in for the browser — and is the reason
 *   jsx-a11y does not (rightly) demand a keyboard handler for it.
 *
 * · THE DEEP IMPORT of PathnameContext is the exact module
 *   @storybook/nextjs-vite itself provides the pathname through
 *   (its AppRouterProvider wraps every story in it), so nesting our own
 *   Provider inside is how the "next page" gets a new address without a
 *   router. It is lint-clean because the navigation block restricts next/link,
 *   four names of next/navigation and next-intl/navigation — none of which
 *   this is, and none of which would help: there is no client-side routing to
 *   ask for (§15.13).
 *
 * · STATE IS ONE OPTIONAL OVERRIDE, not a copy of the provider. While nothing
 *   has been picked the story follows the decorator (and therefore the toolbar
 *   and the story's own `globals` pin); after a pick it follows the pick. Two
 *   parallel copies of locale + messages + pathname would have to be kept in
 *   sync with a provider that can change under them.
 *
 * ONE REAL SIDE EFFECT SURVIVES THE PRETENCE, deliberately: the section writes
 * the NEXT_LOCALE cookie before this host cancels anything, so a manual pick in
 * Storybook really does leave that cookie behind — and a cookie is scoped to
 * the HOST, not the port, so localhost:6007 and `next dev` on localhost:3000
 * share it. If your dev server starts landing on /de/ instead of /ro/, that is
 * why; clear NEXT_LOCALE in devtools. It is left as production fidelity rather
 * than stubbed away: the story shows the visitor's real sequence. The `Picked`
 * story below cleans up after itself, because an automated run must not leave
 * state on the machine.
 */
function LanguageSwitcherDemo(props: LanguageSwitcherProps): ReactElement {
  const outerLocale = useLocale();
  const outerMessages = useMessages();
  // Locale-STRIPPED, from the story's pretend route: '/ro/services' →
  // '/services'. Put back together below, because what a PathnameContext holds
  // is the whole address INCLUDING the locale segment — but NOT the base path,
  // which the real router removes before anyone reads it (see withoutBasePath).
  const outerPath = usePathname();
  const [picked, setPicked] = useState<{
    locale: Locale;
    pathname: string;
  } | null>(null);

  const locale = picked?.locale ?? outerLocale;
  const messages = picked ? MESSAGES[picked.locale] : outerMessages;
  const pathname =
    picked?.pathname ?? withoutBasePath(localeHref(outerLocale, outerPath));

  return (
    <PathnameContext.Provider value={pathname}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div
          role="presentation"
          onClick={(event) => {
            const target = event.target;
            const anchor =
              target instanceof Element ? target.closest('a[hreflang]') : null;
            if (!(anchor instanceof HTMLAnchorElement)) return;
            event.preventDefault();
            const next = locales.find((entry) => entry === anchor.hreflang);
            if (!next) return;
            setPicked({
              locale: next,
              pathname: withoutBasePath(new URL(anchor.href).pathname),
            });
          }}
        >
          <LanguageSwitcher {...props} />
        </div>
      </NextIntlClientProvider>
    </PathnameContext.Provider>
  );
}

const meta = {
  title: 'Sections/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/ro/services' } },
  },
  // The stem is absolutely positioned OUTSIDE the root's box (ui/SpeedDial), so
  // the canvas must be given room explicitly — otherwise an `up` dial unfolds
  // off the top of the frame and the baseline photographs nothing. 50rem
  // centres the bulb 400px from every edge; the four lg discs reach ≈ 240px.
  decorators: [
    (Story) => (
      <div className="flex min-h-[50rem] items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
  args: { direction: 'up' },
  argTypes: {
    direction: {
      control: 'radio',
      options: ['up', 'down', 'left', 'right'] satisfies SpeedDialDirection[],
      description:
        'Which way the stem unfolds — the HOST’s placement decision (D6). FloatingActions passes `up`: `right` would run into the call CTA at 320px',
    },
    className: {
      control: false,
      description:
        'Placement plus the atom’s two public CSS variables — the --disc-size steps and --stem-inset — merged onto the dial’s root (§6.4/§6.8). FloatingActions is the one caller that sets them',
    },
  },
  render: (args) => <LanguageSwitcherDemo {...args} />,
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Open the dial the way a visitor would, idempotently: the visual runner clicks
 * the same bulb through the 'pin-open' tag, and both orderings must end OPEN.
 * Written against the FIRST [aria-expanded] in the canvas — which is the bulb.
 *
 * It ends by BLURRING the bulb, and that is not tidying: whoever clicked last
 * leaves focus on it, and a play-function click focuses with keyboard modality
 * (ring) while the runner's real mouse click does not (no ring). The baseline
 * would then encode WHICH of the two won the race — a flake with a screenshot
 * attached. Blurring lands both orderings on the same pixels, and the dial
 * stays open because the atom ignores a blur with no relatedTarget (D11, the
 * Safari rule).
 */
const openPlay: NonNullable<Story['play']> = async ({ canvas, userEvent }) => {
  const bulb = canvas
    .getAllByRole('button')
    .find((button) => button.hasAttribute('aria-expanded'));
  if (!bulb)
    throw new Error('LanguageSwitcher stories: no bulb in this canvas');
  if (bulb.getAttribute('aria-expanded') !== 'true') {
    await userEvent.click(bulb);
  }
  await waitFor(() => expect(bulb).toHaveAttribute('aria-expanded', 'true'));
  bulb.blur();
  // …and it must SURVIVE that blur: if focus-out ever stopped ignoring a null
  // relatedTarget, every "open" baseline would quietly become a picture of a
  // closed dial.
  await expect(bulb).toHaveAttribute('aria-expanded', 'true');
};

/**
 * The everyday picture: one filled disc showing the language you are reading,
 * collapsed. On the phone baseline it is the whole control; at 1536 it is the
 * same control, because the SIZE steps belong to the corner (FloatingActions),
 * not to this section.
 *
 * The play function is the standing proof that the REAL chain works end to end
 * — Next's pathname → stripLocale → equivalentPath → localeHref — with the
 * actual message files and the actual locale manifest. The interaction suite
 * mocks that module boundary, so this is the half it cannot cover.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByRole('button', { name: bulbName('ro') }),
    ).toHaveAttribute('aria-expanded', 'false');
    const links = Array.from(
      canvasElement.querySelectorAll<HTMLAnchorElement>('a[hreflang]'),
    );
    // Already in the HTML while closed, already pointing at the same page in
    // each other language (§5, §16.2) — the crawlable half of the dial.
    await expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/en/services/',
      '/de/services/',
      '/fr/services/',
      '/it/services/',
    ]);
  },
};

/**
 * The stem unfolded: four discs above the bulb, nearest-first, inside the
 * thermometer tube (D7 · D12). Tagged 'pin-open' so the visual runner
 * photographs this state at both widths, and the play function opens it too, so
 * the in-browser gates — per-story axe and the interaction runner — audit the
 * OPEN dial rather than a closed bulb.
 */
export const Open: Story = {
  globals: { locale: 'ro' },
  tags: ['pin-open'],
  play: openPlay,
};

/**
 * A PICK, PLAYED THROUGH — the story that pins the staged next page, and the
 * only automated thing that exercises the demo host's own machinery (the nested
 * PathnameContext and the nested NextIntlClientProvider). Until it existed,
 * that mechanism was verified by nothing but the pack script.
 *
 * What it pins, in the order the play asserts it:
 *  · D1 model C, after the fact — the picked language becomes the BULB, named
 *    from its own message file, and the other four re-fan in `locales` manifest
 *    order with the language you came from back among them, pointing at the
 *    page you were just on;
 *  · the dial stays OPEN. A link pick is the one close ui/SpeedDial
 *    deliberately does not perform: on the real site the document is already
 *    leaving, and animating a pill on a page being replaced is wasted work;
 *  · COOKIE BEFORE CANCEL. The cookie is asserted to exist before the play
 *    clears it, which is what proves the order: the section's onSelect ran
 *    first (React replays delegated handlers in tree order), and only then did
 *    the demo host cancel the navigation. That is the production sequence with
 *    nothing hidden.
 *
 * AND IT CLEANS UP. A cookie is scoped to the HOST, not the port: NEXT_LOCALE
 * left on localhost by a test run is the same cookie `next dev` reads on
 * localhost:3000, where it would silently redirect '/' to /de/. An automated
 * run must not change the developer's machine, so the play deletes it (a
 * MANUAL pick still leaves it — see the demo host's comment; that one is
 * deliberate fidelity).
 *
 * No pin tag: the runner photographs whatever the play leaves on screen, and
 * toHaveScreenshot's retry-until-stable is what waits for it (the FocusedDisc
 * precedent in ui/SpeedDial's stories).
 */
export const Picked: Story = {
  globals: { locale: 'ro' },
  play: async (context) => {
    await openPlay(context);
    const { canvas, canvasElement, userEvent } = context;

    const bulb = canvas.getByRole('button', { name: bulbName('ro') });
    const list = canvasElement.querySelector(
      `#${CSS.escape(bulb.getAttribute('aria-controls') ?? '')}`,
    );
    const german = list?.querySelector('a[hreflang="de"]');
    if (!(german instanceof HTMLAnchorElement)) {
      throw new Error('LanguageSwitcher stories: no German disc to pick');
    }
    await userEvent.click(german);

    await waitFor(async () => {
      const next = canvas.getByRole('button', { name: bulbName('de') });
      await expect(next).toHaveTextContent('DE');
      // Open through the pick: nothing closed, nothing remounted.
      await expect(next).toHaveAttribute('aria-expanded', 'true');
    });

    const links = Array.from(
      canvasElement.querySelectorAll<HTMLAnchorElement>('a[hreflang]'),
    );
    await expect(links.map((link) => link.hreflang)).toEqual(
      locales.filter((locale) => locale !== 'de'),
    );
    await expect(links.find((link) => link.hreflang === 'ro')).toHaveAttribute(
      'href',
      '/ro/services/',
    );

    // The section really wrote it, before the host cancelled anything…
    await expect(document.cookie).toContain('NEXT_LOCALE=de');
    // …and this run does not get to keep it.
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0; Secure';
  },
};
