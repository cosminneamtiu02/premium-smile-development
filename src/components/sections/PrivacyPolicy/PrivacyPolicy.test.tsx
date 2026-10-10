import { cleanup, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import '@/styles/globals.css';
import { NOTE_LINK } from '@/components/sections/ClinicLocation/ClinicLocation';
import { LOCALE_COOKIE_MAX_AGE_S } from '@/i18n/cookie';
import { locales, type Locale } from '@/i18n/locales';
import { clinic } from '@/lib/clinic/clinic';
import { PRIVACY_MAP_ANCHOR } from '@/lib/routes/routes';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import privacyDe from '@/messages/privacy/de.json';
import privacyRo from '@/messages/privacy/ro.json';
import { PRIVACY_MESSAGES } from './messages';
import {
  POLICY_LINK,
  POLICY_UPDATED,
  PRIVACY_TITLE_ID,
  PrivacyPolicy,
} from './PrivacyPolicy';

// sections/PrivacyPolicy, from the outside: what a visitor and a screen reader
// get — the outline, the one cookie, the facts and their placeholders, the
// links out — in Romanian (the reference) and German (the longest), and every
// one of the five rendered whole (the TypeScript review, 2026-10-10).

const MAIN: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

function mount(locale: Locale = 'ro') {
  render(
    <NextIntlClientProvider locale={locale} messages={MAIN[locale]}>
      <PrivacyPolicy />
    </NextIntlClientProvider>,
  );
  return screen.getByRole('article');
}

/** The ids the ten parts carry, in reading order (English, §15.20). */
const PARTS = [
  'summary',
  'controller',
  'visit',
  'cookies',
  PRIVACY_MAP_ANCHOR,
  'contact',
  'reviews',
  'links',
  'rights',
  'changes',
];

describe('PrivacyPolicy — the outline', () => {
  it('is one article with ONE h1 — the policy’s title — and the h1 carries the id the twin finds', () => {
    const article = mount();
    const h1 = within(article).getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(privacyRo.title);
    expect(h1).toHaveAttribute('id', PRIVACY_TITLE_ID);
    expect(within(article).getAllByRole('heading', { level: 1 })).toHaveLength(
      1,
    );
  });

  it('gives each of its ten parts an h2 and an English id, in reading order', () => {
    const article = mount();
    const h2s = within(article).getAllByRole('heading', { level: 2 });
    expect(h2s).toHaveLength(PARTS.length);
    expect(h2s.map((h2) => h2.closest('section')?.id)).toEqual(PARTS);
    // No level is skipped and none goes deeper: h1 → h2 only.
    expect(article.querySelectorAll('h3, h4, h5, h6')).toHaveLength(0);
  });

  it('keeps the parts UNNAMED — no region landmark per part', () => {
    const article = mount();
    for (const section of article.querySelectorAll('section')) {
      expect(section).not.toHaveAttribute('aria-labelledby');
      expect(section).not.toHaveAttribute('aria-label');
    }
    expect(within(article).queryAllByRole('region')).toHaveLength(0);
  });

  it('prints the day the words last changed, in the locale’s long date', () => {
    mount();
    expect(screen.getByText(/^Ultima actualizare: /)).toHaveTextContent(
      'Ultima actualizare: 10 octombrie 2026',
    );
    expect(POLICY_UPDATED).toBe('2026-10-10');
  });
});

describe('PrivacyPolicy — the one cookie, read from the code', () => {
  it('names the cookie the site writes — the literal NEXT_LOCALE, read from the code', () => {
    // The LITERAL, never the constant: src/i18n/cookie.ts's #62 tripwire
    // convention — a test that imported LOCALE_COOKIE would follow a rename
    // the visitors' stored choices never could. The component reads the
    // constant; this pins what it reads.
    const article = mount();
    const cookies = article.querySelector('#cookies') as HTMLElement;
    expect(within(cookies).getByText('NEXT_LOCALE').tagName).toBe('CODE');
  });

  it('states the lifetime the cookie really has — max-age in months', () => {
    const article = mount();
    const cookies = article.querySelector('#cookies') as HTMLElement;
    const months = Math.round(
      LOCALE_COOKIE_MAX_AGE_S / ((365 * 24 * 3600) / 12),
    );
    expect(months).toBe(12);
    expect(cookies).toHaveTextContent(`${months} luni`);
  });

  it('lays the cookie out as ONE definition list of five pairs', () => {
    const article = mount();
    const list = (
      article.querySelector('#cookies') as HTMLElement
    ).querySelector('dl');
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll('dt')).toHaveLength(5);
    expect(list!.querySelectorAll('dd')).toHaveLength(5);
  });
});

describe('PrivacyPolicy — the clinic’s legal facts', () => {
  it('prints the placeholder for every fact the owner has not supplied — nothing invented', () => {
    const article = mount();
    const missing = privacyRo.missing;
    const nulls = Object.values(clinic.legal).filter((v) => v === null).length;
    const shown = (article.textContent ?? '').split(missing).length - 1;
    // Each null fact once — and the e-mail twice (who we are, your rights).
    expect(shown).toBe(nulls + (clinic.legal.email === null ? 1 : 0));
  });

  it('links the e-mail only once it exists, as a mailto:', () => {
    const before = clinic.legal.email;
    try {
      clinic.legal.email = null;
      const article = mount();
      expect(article.querySelector('a[href^="mailto:"]')).toBeNull();
    } finally {
      clinic.legal.email = before;
    }
  });

  it('turns a supplied e-mail into two mailto: links', () => {
    const before = clinic.legal.email;
    try {
      clinic.legal.email = 'contact@example.ro';
      const article = mount();
      const links = article.querySelectorAll(
        'a[href="mailto:contact@example.ro"]',
      );
      expect(links).toHaveLength(2);
      for (const link of links)
        expect(link).toHaveTextContent('contact@example.ro');
    } finally {
      clinic.legal.email = before;
    }
  });

  it('dials the clinic’s E.164 number while showing the human format — twice: who we are, and your rights', () => {
    const article = mount();
    const calls = within(article).getAllByRole('link', {
      name: clinic.phoneDisplay,
    });
    // The rights paragraph offers the phone too (the a11y review: never a
    // placeholder e-mail as the only way to use a right).
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call).toHaveAttribute('href', `tel:${clinic.phone}`);
      expect(call).not.toHaveAttribute('target');
    }
    expect(calls[1]?.closest('section')?.id).toBe('rights');
  });
});

describe('PrivacyPolicy — the links out', () => {
  const external = (locale: Locale) => [
    `https://policies.google.com/privacy?hl=${locale}`,
    'https://www.whatsapp.com/legal/privacy-policy-eea',
    'https://www.dataprotection.ro/',
    'https://cmsr.ro/',
    'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
  ];

  it('points at each source page in the SAME tab, with no referrer (the a11y review)', () => {
    const article = mount();
    for (const href of external('ro')) {
      const link = article.querySelector(`a[href="${href}"]`);
      expect(link, href).not.toBeNull();
      expect(link).not.toHaveAttribute('target');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('opens Google’s policy in the page’s own language', () => {
    const article = mount('de');
    expect(
      article.querySelector(
        'a[href="https://policies.google.com/privacy?hl=de"]',
      ),
    ).not.toBeNull();
  });

  it('dresses every link in POLICY_LINK — underlined at rest (SC 1.4.1)', () => {
    const article = mount();
    const links = article.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.className).toBe(POLICY_LINK);
      expect(getComputedStyle(link).textDecorationLine).toContain('underline');
    }
  });

  it('KEEP-IN-SYNC: the map note’s link wears the very same classes', () => {
    expect(NOTE_LINK).toBe(POLICY_LINK);
  });
});

describe('PrivacyPolicy — the words', () => {
  it('names the map section as the visitor sees it, in every language', () => {
    for (const [locale, main] of [
      ['ro', ro],
      ['de', de],
    ] as const) {
      const article = mount(locale);
      const map = article.querySelector(
        `#${PRIVACY_MAP_ANCHOR}`,
      ) as HTMLElement;
      expect(map).toHaveTextContent(main.home.location.title);
      cleanup();
    }
  });

  it('speaks German on a German page — the title, the placeholder, the plural', () => {
    const article = mount('de');
    expect(
      within(article).getByRole('heading', { level: 1 }),
    ).toHaveTextContent(privacyDe.title);
    expect(article.textContent).toContain(privacyDe.missing);
    expect(article.textContent).toContain('12 Monate');
  });

  it('never leaks a message key or an unfilled ICU argument', () => {
    const text = mount().textContent ?? '';
    expect(text).not.toMatch(/\{[A-Za-z]+\}/);
    expect(text).not.toMatch(/\b(?:summary|controller|cookies|rights)\.[a-z]+/);
  });

  it('renders no button and no form — the page is inert HTML (§16)', () => {
    const article = mount();
    expect(article.querySelector('button, form, input')).toBeNull();
  });
});

/** Every dotted key in the reference policy file — none may ever print. */
const KEYS = (function keys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : keys(value as object, path);
  });
})(PRIVACY_MESSAGES.ro);

/** The links a rendered policy carries, its own language's `hl=` set aside. */
const linksOf = (article: HTMLElement): string[] =>
  [...article.querySelectorAll('a[href]')]
    .map((a) =>
      (a.getAttribute('href') ?? '').replace(/([?&]hl=)[a-z]+/, '$1·'),
    )
    .toSorted();

describe('PrivacyPolicy — every language renders WHOLE (the TypeScript review, 2026-10-10)', () => {
  // The parity test reads the files with regular expressions; this renders
  // them. A straight apostrophe before a tag or an argument starts an ICU
  // quote and prints the raw markup; a tag closed before it opens prints the
  // key path — both pass a regex, neither passes here.
  const ROMANIAN = (() => {
    const article = mount('ro');
    const links = linksOf(article);
    cleanup();
    return links;
  })();

  it.each(locales)(
    '%s: prints no key path, no raw markup and no unfilled argument',
    (locale) => {
      const text = mount(locale).textContent ?? '';
      expect(text).not.toMatch(/[<>{}]/);
      for (const key of KEYS) {
        if (key.includes('.')) expect(text, key).not.toContain(key);
      }
    },
  );

  it.each(locales)('%s: carries exactly Romanian’s links', (locale) => {
    expect(linksOf(mount(locale))).toEqual(ROMANIAN);
  });

  it.each(locales)(
    '%s: its own title on the one h1, ten h2s, a dated line',
    (locale) => {
      const article = mount(locale);
      expect(
        within(article).getByRole('heading', { level: 1 }),
      ).toHaveTextContent(PRIVACY_MESSAGES[locale].title);
      expect(
        within(article).getAllByRole('heading', { level: 2 }),
      ).toHaveLength(10);
      expect(article.querySelector('header p')?.textContent).toMatch(/2026/);
    },
  );
});
