import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { userEvent } from 'vitest/browser';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet (the Modal / SpeedDial / LanguageSwitcher precedent),
// because two of this file's claims are questions about COMPUTED style rather
// than about class names:
//  · the z-30 seat and the lifted anchor (board §2/§3) live nowhere else — no
//    other suite and no unit test can say whether this card sits below the
//    corner discs or on top of them;
//  · the §9 target floor is a MEASUREMENT. `min-h-11` proves nothing without a
//    sheet to compile it.
// It also brings the entrance transition, which is why the stillness style in
// beforeAll is not optional here (the PR #45 rule — see that block).
import '@/styles/globals.css';
import { type Locale } from '@/i18n/locales';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { LanguageBanner, type BannerStrings } from './LanguageBanner';

// sections/LanguageBanner — the interaction suite: the visibility MATRIX, the
// two cookie writes, and the bfcache re-decide. Role-based queries throughout
// (§9, §13), so a passing test doubles as proof of accessible markup, and every
// user-facing string comes from the REAL message files (§17.4) — a renamed key
// fails HERE as well as in the parity gate instead of silently rendering the
// dotted key path.
//
// ── WHAT THE SUITE STANDS ON, AND WHY IT IS STUBBED RATHER THAN LIVED.
// This component decides from two facts about the VISITOR — the language cookie
// and `navigator.languages` — and a test that read the real ones would assert
// whatever the machine running it happens to prefer. Both are therefore own
// properties installed on `document` / `navigator` for the file's lifetime and
// removed in afterAll.
//
// THE COOKIE JAR IS HERMETIC ON PURPOSE. sections/LanguageSwitcher's suite
// spies on the real setter and lets the write THROUGH, which is right there:
// that file's job includes proving a browser accepts the exact string. Since
// this lane, both sections write through the SAME helper (src/i18n/cookie.ts),
// so that round-trip is already pinned once from the outside — and a real
// cookie is scoped to the HOST, not the port, so a NEXT_LOCALE left on
// localhost by this file would be read by `next dev` on localhost:3000 and by
// every other suite in the same browser context. A jar cannot leak, cannot be
// leaked INTO, and still records the exact bytes.
//
// The 'NEXT_LOCALE' LITERAL stays in the stubs (the #62 outside-in tripwire
// convention): a fixture built out of the constant it watches watches nothing.
//
// ── HARNESS NOTE — '@/i18n/navigation' is the mock boundary, not
// 'next/navigation' (Header.test.tsx carries the long form: Vitest pre-bundles
// bare deps, so replacing next/navigation breaks ESM linking before any factory
// runs). Everything downstream runs for real — equivalentPath and localeHref
// are the shipping code, so the hrefs asserted below are the strings a
// visitor's browser receives.
const nav = vi.hoisted(() => ({ pathname: '/services/' as `/${string}` }));

vi.mock('@/i18n/navigation', () => ({ usePathname: () => nav.pathname }));

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/**
 * The prop the shell builds at build time (D6), assembled here from the same
 * five files — never typed-out copies, or the suite keeps passing after someone
 * edits de.json.
 */
const BANNER: Record<Locale, BannerStrings> = {
  ro: ro.common.language.banner,
  en: en.common.language.banner,
  de: de.common.language.banner,
  fr: fr.common.language.banner,
  it: it_.common.language.banner,
};

/** The exact bytes src/i18n/cookie.ts writes — 12 months, site-wide, Lax, Secure. */
const cookieFor = (locale: string) =>
  `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax; Secure`;

// ── THE JAR. `document.cookie` is an accessor on Document.prototype; an own
// property on the instance shadows it for this file and is deleted in afterAll.
// The setter imitates a browser closely enough for the one case that needs it
// (a write is visible to the next read, attributes dropped); expiry is NOT
// modelled, because nothing here deletes a cookie.
let jar = '';
const cookieWrites: string[] = [];
let cookieReads = 0;
/** Reads of `navigator.languages`, counted for the same reason as cookie reads. */
let languageReads = 0;

/** Put a cookie in the jar WITHOUT going through the setter, so the write log
 *  stays a record of what the component did. */
const putCookie = (raw: string) => {
  jar = raw;
};

const stubLanguages = (languages: readonly string[]) => {
  Object.defineProperty(navigator, 'languages', {
    configurable: true,
    get: () => {
      languageReads += 1;
      return languages;
    },
  });
};

// Real anchors in a real browser: an unguarded accept click would NAVIGATE the
// runner away mid-suite. This listener sits on `document`, in the BUBBLE phase,
// so it runs AFTER React's root-container handler — late enough to record what
// the section did (§15.13: `defaultPrevented` must be FALSE, the BROWSER is the
// thing that navigates) and still early enough to cancel the default action.
// The LanguageSwitcher suite's guard, verbatim in behaviour.
const clicks: boolean[] = [];
const guardNavigation = (event: MouseEvent) => {
  clicks.push(event.defaultPrevented);
  event.preventDefault();
};

let stillnessStyle: HTMLStyleElement | null = null;

beforeAll(() => {
  // The PR #45 rule. With the real sheet loaded the card's @starting-style
  // fade+rise runs for real, and jest-dom's toBeVisible() reads opacity — an
  // assertion taken inside that 200ms window is CI-flaky. An UNLAYERED rule
  // beats every @layer'd Tailwind declaration whatever its specificity, so one
  // line stills the tree and every assertion below can be made immediately,
  // with no frame waits.
  stillnessStyle = document.createElement('style');
  stillnessStyle.textContent =
    '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.append(stillnessStyle);

  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => {
      cookieReads += 1;
      return jar;
    },
    set: (value: string) => {
      cookieWrites.push(value);
      const pair = value.split(';')[0].trim();
      const name = pair.slice(0, pair.indexOf('='));
      jar = [
        ...jar
          .split('; ')
          .filter((entry) => entry && !entry.startsWith(`${name}=`)),
        pair,
      ].join('; ');
    },
  });

  document.addEventListener('click', guardNavigation);
});

afterAll(() => {
  stillnessStyle?.remove();
  stillnessStyle = null;
  Reflect.deleteProperty(document, 'cookie');
  Reflect.deleteProperty(navigator, 'languages');
  document.removeEventListener('click', guardNavigation);
});

beforeEach(() => {
  nav.pathname = '/services/';
  jar = '';
  cookieWrites.length = 0;
  cookieReads = 0;
  languageReads = 0;
  clicks.length = 0;
  // A visitor whose browser is set to German, reading a Romanian page: the
  // realistic pair, and the default every case below either uses or overrides.
  stubLanguages(['de-AT', 'de', 'en']);
});

const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <LanguageBanner messages={BANNER} />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => render(<Mounted locale={locale} />);

/** The card, resolved as a screen reader resolves it: a named landmark. */
const card = () => screen.queryByRole('complementary');
const acceptLink = (locale: Locale = 'de') =>
  screen.getByRole('link', { name: BANNER[locale].accept });
const dismissButton = (locale: Locale = 'de') =>
  screen.getByRole('button', { name: BANNER[locale].dismiss });

describe('LanguageBanner — the visibility matrix (D2/D3, §8.6)', () => {
  it.each(['NEXT_LOCALE=de', 'other=1; NEXT_LOCALE=ro'])(
    'says nothing once a choice exists in the cookie (%s)',
    (cookie) => {
      // §8.7's cookie is the record of an EXPLICIT choice — a switcher pick,
      // this card's accept, or its dismiss (D2). Re-asking someone who has
      // answered is the rudeness this component exists to avoid, and the second
      // fixture is why the check parses cookie ENTRIES rather than substrings.
      putCookie(cookie);
      mount('ro');
      expect(card()).toBeNull();
    },
  );

  it('says nothing when the visitor already reads this page’s language', () => {
    stubLanguages(['ro-RO', 'de']);
    mount('ro');
    // The first hit in the ranked list IS the page's locale: there is nothing
    // to suggest, and offering "continue in Romanian" on a Romanian page would
    // be a link to where you already are.
    expect(card()).toBeNull();
  });

  it('says nothing when none of the five is a language the visitor reads (D3)', () => {
    stubLanguages(['pl', 'hu-HU']);
    mount('ro');
    // No match is an ORDINARY answer, not a failure: the banner hides and the
    // visitor keeps the page they asked for. `fallbackLocale` is not consulted
    // here at all — a deep link is never redirected; that constant belongs to
    // the root "/" stub, which has no page to leave someone on.
    expect(card()).toBeNull();
  });

  it('offers the language the visitor reads, IN that language (SC 3.1.2)', () => {
    mount('ro');
    const banner = card();

    // Present, and named by its own sentence: the landmark announces as
    // "Diese Seite gibt es auch auf Deutsch, complementary" (board §4 · Q-C).
    expect(banner).not.toBeNull();
    expect(banner).toBeVisible();
    expect(banner).toHaveAccessibleName(BANNER.de.text);
    // The whole card is German — text, link and ✕ label — so `lang` on the root
    // carries all three into the right voice.
    expect(banner).toHaveAttribute('lang', 'de');
    expect(banner).toHaveTextContent(BANNER.de.text);
    expect(acceptLink()).toHaveAttribute('hreflang', 'de');
    expect(dismissButton()).toBeVisible();
    // …and never the machine string next-intl renders for a missed key.
    expect(banner?.textContent).not.toMatch(/language\.banner|^common\./);
  });

  it('mirrors on a foreign page: a Romanian reader on /de/… is offered română', async () => {
    // The matrix above runs on pageLocale='ro'; decide() special-cases no
    // locale, and this is the row that keeps it that way (G2 react review,
    // 2026-09-04): a future defaultLocale carve-out would go red here first.
    // Dismissal stores the PAGE's locale — German, because "I am fine here"
    // is about where the visitor is, not where they are from (D2).
    stubLanguages(['ro']);
    mount('de');
    const banner = card();
    expect(banner).not.toBeNull();
    expect(banner).toHaveAttribute('lang', 'ro');
    expect(banner).toHaveTextContent(BANNER.ro.text);

    await userEvent.click(dismissButton('ro'));
    expect(cookieWrites).toEqual([cookieFor('de')]);
    expect(card()).toBeNull();
  });

  it('is a LANDMARK, not a live region — so the menu freeze can inert it', () => {
    // Board §4: `role="status"` would make this a live region, and NavMenu's
    // freeze exempts live regions BY ATTRIBUTE (`aria-live`). The exemption is
    // declined on purpose — a card reachable under an open menu would be a
    // second interactive surface — so the absence asserted here is a decision,
    // not an omission. src/app/[locale]/shell.test.tsx asserts the other half:
    // that the freeze really does reach this card.
    mount('ro');
    const banner = card();
    expect(banner?.tagName).toBe('ASIDE');
    expect(banner).not.toHaveAttribute('role');
    expect(banner).not.toHaveAttribute('aria-live');
    expect(banner?.querySelectorAll('[aria-live]')).toHaveLength(0);
  });

  it('renders NOTHING in the build HTML — it decides only after mount (§16.2)', () => {
    // WHY renderToStaticMarkup AND NOT render(): Testing Library mounts the
    // tree and flushes effects, so every assertion above is really "after React
    // woke up". §16.2's rule is about the file the host SERVES — visitor-
    // dependent UI must render a neutral default and decide only after mount,
    // or hydration mismatches follow. This is exactly what `next build` writes
    // into out/ro/services/index.html.
    const html = renderToStaticMarkup(<Mounted locale="ro" />);

    expect(html).toBe('');
    // …and it got there without ASKING about the visitor. The counters are what
    // make that claim testable: a cookie or `navigator.languages` read during
    // the initial render is the §16.2 violation itself, whatever the output
    // happened to be.
    expect(cookieReads).toBe(0);
    expect(languageReads).toBe(0);
  });
});

describe('LanguageBanner — accept: a real navigation, with the choice stamped on the way out', () => {
  it('links to the SAME page under the suggested prefix and writes the cookie once', async () => {
    mount('ro');

    // Literal strings on purpose, not localeHref(equivalentPath(…)): deriving
    // the expectation from the code under test would make a broken rule agree
    // with itself. (basePath is '' in this runner — vitest.config's define.)
    expect(acceptLink()).toHaveAttribute('href', '/de/services/');

    await userEvent.click(acceptLink());

    // The string, character for character — 12 months (§8.7), site-wide, Lax so
    // it never rides along on another site's request to us, Secure so it only
    // travels over HTTPS (§15.14).
    expect(cookieWrites).toEqual([cookieFor('de')]);
    // NOT default-prevented: the section stamps the cookie and gets out of the
    // way — the BROWSER follows the href and loads a whole new document
    // (§15.13). Only this suite's guard stops the runner leaving.
    expect(clicks).toEqual([false]);
  });

  it.each(['/blog/', '/blog/un-articol/'] as const)(
    'sends the suggestion HOME from %s — the blog is Romanian-only (§5)',
    (pathname) => {
      // /de/blog is never generated, so linking to it would be a 404 in the one
      // language the visitor actually reads. equivalentPath knows that;
      // matchesRoute is what makes the article count as "under /blog".
      nav.pathname = pathname;
      mount('ro');
      expect(acceptLink()).toHaveAttribute('href', '/de/');
    },
  );

  it('writes NOTHING on mount, on re-render, or on anything but a press', () => {
    const { rerender } = mount('ro');
    rerender(<Mounted locale="ro" />);
    // The §8.7 regression test, and the reason this site has no consent banner
    // (§12): the ONE cookie is written on an explicit press and at no other
    // moment in the component's life — least of all by the thing whose whole
    // job is to ASK.
    expect(cookieWrites).toEqual([]);
  });
});

describe('LanguageBanner — dismiss: "I am fine here" is a choice (D2)', () => {
  it('stores the PAGE’s locale and takes the card away', async () => {
    mount('ro');

    await userEvent.click(dismissButton());

    // The page's own locale, not the suggested one: the visitor said they are
    // staying, so the choice on record is Romanian — which is also why they are
    // never asked again, with no second piece of storage (§12 forbids one).
    expect(cookieWrites).toEqual([cookieFor('ro')]);
    expect(card()).toBeNull();
  });

  it('is reachable and operable from the keyboard alone (§9)', async () => {
    mount('ro');

    acceptLink().focus();
    await userEvent.tab();
    // Two tab stops, in reading order: take the offer, or refuse it. Nothing
    // else in the card is focusable.
    expect(document.activeElement).toBe(dismissButton());

    await userEvent.keyboard('{Enter}');
    expect(cookieWrites).toEqual([cookieFor('ro')]);
    expect(card()).toBeNull();
  });

  it('leaves both targets at or above the §9 floor', () => {
    mount('ro');
    const accept = acceptLink().getBoundingClientRect();
    const dismiss = dismissButton().getBoundingClientRect();

    // 44px, measured against the compiled sheet rather than inferred from
    // `min-h-11` / `size-11`. Both controls are thumb targets on a phone, and
    // the ✕ is the one a visitor who cannot read the card will aim for.
    expect(accept.height).toBeGreaterThanOrEqual(44);
    expect(dismiss.height).toBeGreaterThanOrEqual(44);
    expect(dismiss.width).toBeGreaterThanOrEqual(44);
  });
});

describe('LanguageBanner — it never takes focus, and it never leaves the page', () => {
  it('steals no focus when it appears', () => {
    // The behaviour that makes banners hated, and a context change the visitor
    // never asked for (SC 3.2.x's stance on unrequested changes is the formal
    // version of the same objection). Staged with a real focusable, because
    // that is the situation: the card arrives while the visitor is somewhere in
    // the page, and the keyboard must stay exactly where it was.
    const probe = document.createElement('button');
    probe.textContent = 'Programări';
    document.body.append(probe);
    try {
      probe.focus();
      expect(document.activeElement).toBe(probe);

      mount('ro');

      expect(card()).toBeVisible();
      expect(document.activeElement).toBe(probe);
    } finally {
      probe.remove();
    }
  });

  it('sits on the z-30 seat, lifted clear of the corner row (board §2/§3)', () => {
    mount('ro');
    const style = getComputedStyle(card() as HTMLElement);

    // BELOW the corner discs (z-40), the menu sheet (45) and the header pill
    // (50): user-invoked chrome always paints over a passive suggestion, and a
    // z-40 TIE would invert exactly that, since this card mounts later in the
    // DOM. Nothing else in the repo can catch a change to this number.
    expect(style.position).toBe('fixed');
    expect(style.zIndex).toBe('30');
    // 11.5rem = 184px above the bottom edge — the tallest of globals'
    // scroll-padding-bottom steps since fb-353 stacked the right corner
    // (re-derived 2026-09-05; the first instantiation, 6.5rem/104px, predates
    // the WhatsApp disc — the derivation is in LanguageBanner.tsx' anchor
    // comment, and THIS pin is what went red when the corner moved under the
    // rule, exactly as intended). Matched by PATTERN because the value carries
    // an `env(safe-area-inset-bottom)` term and engines differ on whether they
    // collapse `calc(184px + 0px)` — shell.test.tsx matches the same family
    // the same way. `(^|\D)` closes the left boundary a plain substring would
    // leave open ('1184px').
    expect(style.bottom).toMatch(/(^|\D)184px/);
  });
});

describe('LanguageBanner — the bfcache restore RE-DECIDES (board §4 · Q-D)', () => {
  it('drops a stale card when the choice was made on another page', () => {
    mount('ro');
    expect(card()).toBeVisible();

    // What actually happens: the visitor accepts on page A, lands on page B in
    // the new language, presses Back — and the browser hands back page A's
    // frozen document, React state and all, without re-running a line of it.
    // The cookie is the fact that changed underneath.
    putCookie('NEXT_LOCALE=de');
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));

    expect(card()).toBeNull();
  });

  it('ignores an ordinary pageshow — only a RESTORE re-decides', () => {
    mount('ro');
    putCookie('NEXT_LOCALE=de');

    // `pageshow` also fires on first paint, where the mount decision has
    // already run; `persisted` is the flag that tells a restore from a load.
    // This is where the shape DIVERGES from NavMenu's D1 twin and ui/SpeedDial's
    // copy: they close unconditionally, this one re-runs the rule — same event,
    // opposite semantics, which is why the three are a citation and not an
    // fb-44 sync set (§15.15 verdict, point 4).
    fireEvent(
      window,
      new PageTransitionEvent('pageshow', { persisted: false }),
    );

    expect(card()).toBeVisible();
  });

  it('keeps a card the restore does not invalidate', () => {
    mount('ro');
    // Back onto a page where nothing was chosen: the offer still stands. A
    // handler that simply closed (the twins' rule) would silently withdraw it.
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));
    expect(card()).toBeVisible();
    expect(cookieWrites).toEqual([]);
  });

  it('stops listening once the island unmounts', () => {
    const { unmount } = mount('ro');
    unmount();

    // A `window` listener outlives its component unless the effect cleans up,
    // and a stale one would go on deciding for a card nobody can see. The
    // COOKIE READ is what makes that observable: `decide()` cannot run without
    // one, so zero reads after a restore event means zero listeners left.
    cookieReads = 0;
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));

    expect(cookieReads).toBe(0);
    expect(card()).toBeNull();
  });
});

describe('LanguageBanner — every locale is offered in its own words (§8, D6)', () => {
  it.each(['en', 'de', 'fr', 'it'] as const)(
    '%s: the card speaks that language, from that locale’s file',
    (locale) => {
      // The shell hands over all five locales' strings precisely because a
      // client island only ever receives the PAGE locale's messages (D6): the
      // card cannot t() its way to a foreign language, so this is the assertion
      // that the record really is used.
      stubLanguages([locale]);
      mount('ro');

      const banner = card();
      expect(banner).toHaveAttribute('lang', locale);
      expect(banner).toHaveAccessibleName(BANNER[locale].text);
      expect(acceptLink(locale)).toBeVisible();
      expect(dismissButton(locale)).toBeVisible();
    },
  );
});
