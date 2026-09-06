import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { containerClasses } from '@/components/ui/Container/Container';
import type { Locale } from '@/i18n/locales';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { Hero } from './Hero';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7), and every
// user-facing string comes from the REAL message files — never a literal typed
// in here (§17.4). A renamed or dropped key then fails HERE as well as in the
// translation-parity gate, instead of silently rendering the dotted key path
// (which is what next-intl does for a miss).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo already follows (Footer, Header, GlyphButton).
//
// NOTHING IS MOCKED: the secondary CTA's href comes from the pure
// src/i18n/href.ts, which runs for real in this runner (PAGES_BASE_PATH is
// pinned to '' by vitest.config's `define`, so the assertions below read the
// root-serving URL shape), and the band touches no router at all.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

// The TWO providers the band gets in production and in Storybook, mounted here
// in the same order (the Header.test.tsx idiom):
// ① NextIntlClientProvider — app/[locale]/layout.tsx wraps the whole tree and
//   .storybook/preview.tsx has a decorator for it. Hero itself is NOT a client
//   component; useTranslations/useLocale are isomorphic and read this context.
// ② ContactModalProvider — the primary CTA is a ContactModalTrigger, and a
//   trigger outside a provider THROWS by design (useContactModal names the
//   missing wrapper rather than shipping a dead button). Its dialog reads the
//   `contact` namespace, which is why the WHOLE message file is handed over.
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ContactModalProvider>
      <Hero />
    </ContactModalProvider>
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  return { ...utils, home: MESSAGES[locale].home };
};

const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

describe('Hero — the opening band', () => {
  it('carries the page’s one <h1>, named by the message file', () => {
    const { home } = mount();
    const heading = screen.getByRole('heading', {
      level: 1,
      name: home.hero.title,
    });
    expect(heading.tagName).toBe('H1');
    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('is a REGION named by that h1 (the aria-labelledby pair)', () => {
    // Read back as the accessibility tree sees it — the computed accessible
    // name, not an attribute we placed: a regression that moved the id off the
    // heading would still "have" it in the DOM and fail here.
    const { home } = mount();
    expect(
      screen.getByRole('region', { name: home.hero.title }),
    ).toContainElement(screen.getByRole('heading', { level: 1 }));
  });

  it('renders the support line from home.hero.subtitle', () => {
    const { home } = mount();
    expect(screen.getByText(home.hero.subtitle)).toBeInTheDocument();
  });

  it('opens the modal with a real <button> named home.hero.ctaPrimary', () => {
    // A trigger performs an action in place, so it must be a button and never
    // an anchor (§9). aria-haspopup is the trigger's own contract, asserted
    // here only as the proof that this IS a ContactModalTrigger and not a
    // bare ui/Button someone swapped in.
    const { home } = mount();
    const trigger = screen.getByRole('button', { name: home.hero.ctaPrimary });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('links to /services as a PLAIN anchor with the finished URL (§15.13)', () => {
    const { home } = mount();
    const link = screen.getByRole('link', { name: home.hero.ctaSecondary });
    expect(link.tagName).toBe('A');
    // Locale prefix + trailing slash, built by i18n/href.ts — the one place
    // that rule is spelled.
    expect(link).toHaveAttribute('href', '/ro/services/');
  });

  it('threads the ACTIVE locale through both the copy and the href', () => {
    // German is the longest language (§8.4) and the second locale proves the
    // URL rule is not a Romanian constant: the same band on /de must link to
    // /de/services/.
    const { home } = mount('de');
    screen.getByRole('heading', { level: 1, name: home.hero.title });
    expect(
      screen.getByRole('link', { name: home.hero.ctaSecondary }),
    ).toHaveAttribute('href', '/de/services/');
  });

  it('is a full-bleed outer whose gutter box is ui/Container (band recipe)', () => {
    // The recipe is standing law in Container.tsx's header: the semantic outer
    // owns paint + rhythm, the inner column owns width and the container-query
    // context. The clamp itself is NEVER spelled here — the constant is
    // imported, which is what keeps tests/unit/gutter-single-spelling.test.ts
    // green.
    const { home } = mount();
    const band = screen.getByRole('region', { name: home.hero.title });
    expect(band.tagName).toBe('SECTION');
    expect(classesOf(band)).not.toContain('@container');

    const gutter = band.firstElementChild as HTMLElement;
    for (const token of containerClasses.split(' ')) {
      expect(classesOf(gutter)).toContain(token);
    }
  });

  it('ships NO outer margin — the page owns inter-band rhythm (§6.4)', () => {
    const { home } = mount();
    const band = screen.getByRole('region', { name: home.hero.title });
    expect(classesOf(band).filter((c) => /^-?m[trblxyse]?-/.test(c))).toEqual(
      [],
    );
  });

  it('measures ITSELF with container queries, never the viewport (§6.5)', () => {
    // A media query here would react to the window instead of the box the band
    // actually occupies. Token-wise, not a substring match — `@3xl:`
    // legitimately contains "xl:".
    const { home } = mount();
    const band = screen.getByRole('region', { name: home.hero.title });
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;
    for (const el of band.querySelectorAll('*')) {
      expect(classesOf(el).filter((c) => viewportVariant.test(c))).toEqual([]);
    }
  });
});
