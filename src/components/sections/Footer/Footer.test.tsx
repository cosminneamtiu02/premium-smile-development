import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import type { Locale } from '@/i18n/locales';
import { clinic } from '@/lib/clinic';
import { formatHoursRows } from '@/lib/hours';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { Footer, socialEntries } from './Footer';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7), and every
// user-facing string comes from the REAL message files or lib/clinic.ts —
// never a literal typed in here (§17.4). A renamed or dropped key then fails
// HERE as well as in the translation-parity gate, instead of silently
// rendering the dotted key path (which is what next-intl does for a miss).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo already follows (GlyphButton, FloatingActions, Header).
//
// NOTHING IS MOCKED HERE, and since §15.13 nothing needs to be: the site-map
// hrefs come from the pure src/i18n/href.ts, which runs for real in this
// runner, and the Footer touches no router at all (it marks no active route —
// a footer link list is a site map, not a "you are here" indicator). The stub
// this file used to carry was a hand-written <Link>, and a less faithful one
// than the real thing: it dropped the trailing slash every export URL has.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

// The provider the section gets in production (app/[locale]/layout.tsx wraps
// the whole tree) and in Storybook (.storybook/preview.tsx decorator), so the
// tests mount it the same way. Footer itself is NOT a client component;
// useTranslations/useLocale are isomorphic and read this context.
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <Footer />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  const messages = MESSAGES[locale].common;
  return {
    ...utils,
    messages,
    locale,
    footer: () => screen.getByRole('contentinfo'),
  };
};

const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** ICU interpolation, done the way the message file declares it. */
const fill = (message: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    message,
  );

describe('Footer — the contentinfo landmark', () => {
  it('is a real <footer>, with no role attribute bolted on', () => {
    // <footer> at body level IS contentinfo; spelling role="contentinfo" on it
    // would be redundant ARIA (§9 semantic-HTML-first).
    const { footer } = mount();
    expect(footer().tagName).toBe('FOOTER');
    expect(footer()).not.toHaveAttribute('role');
  });

  it('carries NO outer margin — pages own the rhythm above it (§6.4)', () => {
    const { footer } = mount();
    const margins = classesOf(footer()).filter((c) =>
      /^-?m[trblxye]?-/.test(c),
    );
    expect(margins).toEqual([]);
  });

  it('measures ITSELF with container queries, never the viewport (§6.5)', () => {
    // A media query here would react to the window instead of the box the
    // section actually occupies. Token-wise, not a substring match — `@3xl:`
    // legitimately contains "xl:".
    const { footer } = mount();
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;
    for (const el of footer().querySelectorAll('*')) {
      expect(classesOf(el).filter((c) => viewportVariant.test(c))).toEqual([]);
    }
    expect(classesOf(footer())).not.toContain('@container');
    // …and the measured box is the gutter box, one level in.
    const gutter = footer().firstElementChild as HTMLElement;
    expect(classesOf(gutter)).toContain('@container');
    // The SAME clamp the Header pill wears — one number, two sections.
    expect(classesOf(gutter)).toContain('mx-[clamp(1rem,10vw,12.5rem)]');
  });

  it('flips its grids on NAMED container steps only', () => {
    const { footer } = mount();
    const grids = Array.from(footer().querySelectorAll('[class*="grid-cols"]'));
    const tokens = grids.flatMap(classesOf);

    expect(tokens).toEqual(
      expect.arrayContaining([
        'grid-cols-1',
        '@3xl:grid-cols-2',
        '@5xl:grid-cols-[1fr_0.6fr_1fr_1fr]',
        '@3xl:grid-cols-3',
      ]),
    );
    // No custom container step may enter the untouched default scale (§3):
    // every @-variant here is one of Tailwind's own names.
    const named = /^@(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl):/;
    for (const token of tokens.filter((t) => t.startsWith('@'))) {
      expect(token).toMatch(named);
    }
  });
});

describe('Footer — every control is a LINK (zero-island contract)', () => {
  it('renders no <button> anywhere: nothing here needs JavaScript', () => {
    // The section is a Server Component with no client island (§16): a button
    // would imply a handler, i.e. hydration on every page of the site.
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('gives EVERY link an accessible name', () => {
    mount();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAccessibleName();
    }
  });

  it('never leaks a message key path into a visible string', () => {
    // next-intl does not throw on a miss — it renders "common.footer.tagline"
    // and logs. This is the assertion that turns that into a failure.
    const { footer } = mount();
    expect(footer().textContent).not.toMatch(/\bfooter\.[a-zA-Z]+\b/);
    expect(footer().textContent).not.toMatch(/\{(year|name)\}/);
  });
});

describe('Footer — row 1, the brand', () => {
  it('opens the band with sections/Wordmark, centred in an h-16 box', () => {
    // Since the fb-200 swap this row is the SAME lockup the Header's corner
    // renders — artwork, hairline bar, the name at Heading's title step — so
    // the §15.6 logo arrives in one file instead of two. The name is still
    // data from lib/clinic.ts (§10.1), and the brand is still identified
    // positionally: the first child of the gutter box. The two wrappers are
    // this section owning placement and SIZE (§6.4/§6.8) — `pb-8` is the old
    // row's rhythm, `h-16` the 4rem ruler the lockup's percentages resolve
    // against, matching the header instance exactly (fb-205).
    const { footer } = mount();
    const gutter = footer().firstElementChild as HTMLElement;
    const brandRow = gutter.firstElementChild as HTMLElement;
    const box = brandRow.firstElementChild as HTMLElement;
    const lockup = box.firstElementChild as HTMLElement;

    expect(classesOf(brandRow)).toEqual(
      expect.arrayContaining(['flex', 'justify-center', 'pb-8']),
    );
    expect(classesOf(box)).toEqual(expect.arrayContaining(['flex', 'h-16']));
    expect(lockup.tagName).toBe('A');
    expect(lockup).toHaveTextContent(clinic.name);
    expect(classesOf(within(lockup).getByText(clinic.name))).toContain(
      'font-display',
    );
    // NOT a heading either: the one <h1> belongs to the page, and a repeated
    // shell element must not claim an outline slot (the Header's C2 rule).
    expect(lockup.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('adds NO second destination to the tab order — fb-179 stays honoured', () => {
    // The rule this row was built on ("the Header owns the home link; a second
    // link with the same name is a duplicate destination") is not broken by
    // the swap, it is MOOT: D9's lockup is a placeholder <a> with no href, so
    // it takes no link role, no tab stop and no accessible name. The question
    // re-poses itself the day the wiring diff lands, and Wordmark.tsx is where
    // that is written down.
    const { footer } = mount();
    const gutter = footer().firstElementChild as HTMLElement;
    const lockup = gutter.querySelector('a') as HTMLElement;

    expect(lockup).not.toHaveAttribute('href');
    expect(lockup).not.toHaveAttribute('aria-label');
    // The site-map column's title carries the same name and is likewise no
    // link — the two occurrences of the clinic name are both inert.
    for (const occurrence of within(footer()).getAllByText(clinic.name, {
      selector: 'p',
    })) {
      expect(occurrence.closest('a')).toBeNull();
    }
    // …and every element the accessibility tree DOES call a link is one of the
    // band's real destinations, none of them named for the brand alone.
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAccessibleName(clinic.name);
    }
  });
});

describe('Footer — row 2, the contact column', () => {
  it('dials the E.164 number while SHOWING the human format', () => {
    mount();
    // The visible text is the accessible name — SC 2.5.3 Label in Name holds
    // by construction, because the glyph beside it is aria-hidden.
    const phone = screen.getByRole('link', { name: clinic.phoneDisplay });

    expect(phone).toHaveAttribute('href', `tel:${clinic.phone}`);
    expect(phone).toHaveAttribute('href', 'tel:+40700000000');
    expect(phone).toHaveTextContent(clinic.phoneDisplay);
    // Two different strings on purpose: a tel: href needs E.164, a reader
    // needs spacing. Collapsing them would break one of the two.
    expect(clinic.phoneDisplay).not.toBe(clinic.phone);
    expect(clinic.phone.startsWith('+')).toBe(true);
  });

  it('keeps the phone glyph unlabelled so the link announces once', () => {
    mount();
    const svg = screen
      .getByRole('link', { name: clinic.phoneDisplay })
      .querySelector('svg');

    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('prints the tagline, the contact label and the postal address', () => {
    const { footer, messages } = mount();
    const text = footer().textContent ?? '';

    expect(text).toContain(messages.footer.tagline);
    expect(text).toContain(messages.footer.contactLabel);
    // §10.5: the NAP must be crawlable in the footer of every page.
    expect(text).toContain(clinic.address.street);
    expect(text).toContain(clinic.address.postalCode);
    expect(text).toContain(clinic.address.city);
  });

  it('prints the county line only when it differs from the city', () => {
    // Placeholder data has București twice (city = county); printing it twice
    // reads as a mistake, and §10.1 says one source decides.
    const { footer } = mount();
    const county = clinic.address.county;
    const occurrences = (footer().textContent ?? '').split(county).length - 1;

    expect(occurrences).toBe(county === clinic.address.city ? 1 : 2);
  });
});

describe('Footer — row 2, the nav column', () => {
  it('links the four primary routes in Romanian, locale-prefixed', () => {
    const { messages } = mount('ro');

    // The exact strings the export serves: /{locale} because localePrefix is
    // 'always' (§5), and the trailing slash because `trailingSlash: true`
    // writes out/ro/services/index.html — so a visitor pays no redirect hop.
    // Both come from src/i18n/href.ts, the only place that spells them
    // (§15.13); the base path is '' in this runner (vitest.config.ts).
    for (const [label, href] of [
      [messages.nav.home, '/ro/'],
      [messages.nav.services, '/ro/services/'],
      [messages.nav.team, '/ro/team/'],
      [messages.nav.blog, '/ro/blog/'],
    ] as const) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      );
    }
  });

  it('drops Blog on non-Romanian locales — the blog is `ro`-only (§5)', () => {
    const { messages } = mount('de');

    expect(screen.queryByRole('link', { name: messages.nav.blog })).toBeNull();
    // The other three still ship, in German.
    expect(
      screen.getByRole('link', { name: messages.nav.services }),
    ).toHaveAttribute('href', '/de/services/');
  });

  it('marks NO footer link as the current page', () => {
    // A footer link list is a site map, not a "you are here" indicator — and
    // the Header already answers that question (its aria-current is the one).
    const { footer } = mount();
    expect(footer().querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('names its navigation landmark, so it is not a second bare "navigation"', () => {
    const { footer } = mount();
    const nav = within(footer()).getByRole('navigation', {
      name: clinic.name,
    });
    expect(nav.tagName).toBe('NAV');
    // The visible column title IS the name — no invented message key.
    expect(nav).toHaveAccessibleName(clinic.name);
  });
});

describe('Footer — row 2, the ANPC/SAL badge', () => {
  it('opens the official SAL portal in a new tab, safely', () => {
    const { messages } = mount();
    const sal = screen.getByRole('link', { name: messages.footer.salLabel });

    expect(sal).toHaveAttribute('href', 'https://reclamatiisal.anpc.ro');
    expect(sal).toHaveAttribute('target', '_blank');
    // noopener kills the reverse-tabnabbing handle; noreferrer is belt-and-
    // braces for older engines.
    expect(sal.getAttribute('rel')).toContain('noopener');
    expect(sal.getAttribute('rel')).toContain('noreferrer');
    expect(messages.footer.salLabel).not.toMatch(/footer\.salLabel/);
  });

  it('carries the artwork as a DECORATIVE image — the link holds the name', () => {
    const { messages } = mount();
    const sal = screen.getByRole('link', { name: messages.footer.salLabel });
    const img = sal.querySelector('img');

    expect(img).toBeInstanceOf(HTMLImageElement);
    // alt="" + the link's aria-label = announced once, not twice.
    expect(img).toHaveAttribute('alt', '');
    expect(img?.getAttribute('src')).toContain('anpc-sal-pictograma');
  });

  it('reserves the badge box so nothing shifts when it loads (§11)', () => {
    const { messages } = mount();
    const img = screen
      .getByRole('link', { name: messages.footer.salLabel })
      .querySelector('img') as HTMLImageElement;

    // Intrinsic 500×124, displayed at half that — the width/height ATTRIBUTES
    // are what give the browser the aspect ratio before the bytes arrive.
    expect(img.getAttribute('width')).toBe('250');
    expect(img.getAttribute('height')).toBe('62');
    expect(img).toHaveAttribute('loading', 'lazy');
    // …and it must still be able to shrink inside a narrow column (320px, §7).
    expect(classesOf(img)).toEqual(
      expect.arrayContaining(['h-auto', 'max-w-full']),
    );
  });
});

describe('Footer — the column titles', () => {
  it('sizes both titles a full step ABOVE the nav labels they head', () => {
    // Owner amendment 2026-08-18: at text-lg the titles sat at exactly the
    // nav TextButtons' own text-lg and read as list items, not headings.
    // text-xl is one step up the untouched scale (§3) — the step IS the
    // hierarchy, so this test fails if either title falls back to text-lg.
    const { footer, messages } = mount();
    const nav = within(footer()).getByRole('navigation', { name: clinic.name });
    const navTitle = within(nav).getByText(clinic.name);
    const hoursTitle = within(footer()).getByText(messages.footer.hoursTitle);

    for (const title of [navTitle, hoursTitle]) {
      expect(title.tagName).toBe('P');
      expect(classesOf(title)).toContain('text-xl');
      expect(classesOf(title)).not.toContain('text-lg');
      expect(classesOf(title)).toContain('font-display');
    }
  });
});

describe('Footer — row 2, the opening hours', () => {
  it('renders one <dt>/<dd> pair per row from lib/hours', () => {
    const { footer, messages } = mount();
    const expected = formatHoursRows(
      clinic.hours,
      'ro',
      messages.footer.closed,
    );
    const list = footer().querySelector('dl') as HTMLElement;

    expect(within(list).getAllByRole('term')).toHaveLength(expected.length);
    const terms = Array.from(list.querySelectorAll('dt')).map(
      (dt) => dt.textContent,
    );
    const values = Array.from(list.querySelectorAll('dd')).map(
      (dd) => dd.textContent,
    );

    expect(terms).toEqual(expected.map((row) => row.label));
    expect(values).toEqual(expected.map((row) => row.value));
    // The shipped fixture, ONE ROW PER DAY (owner 2026-08-18): five identical
    // weekday rows, the short Saturday, Sunday closed — calendar order, no
    // grouped ranges.
    expect(terms).toEqual([
      'Luni',
      'Marți',
      'Miercuri',
      'Joi',
      'Vineri',
      'Sâmbătă',
      'Duminică',
    ]);
  });

  it('titles the column from the message file', () => {
    const { footer, messages } = mount();
    expect(footer().textContent).toContain(messages.footer.hoursTitle);
  });

  it('dims the closed row with a COLOR token, never opacity', () => {
    // opacity-60 dims the row below the contrast the token guarantees;
    // text-ink-muted is a measured 7.35:1 on the surface ground (§9). Since
    // the fb-186 rewire the token rides ON each dt/dd — ui/Text emits its ink
    // explicitly (no inherit tone, its D4) — while the row wrapper carries
    // layout only, so the elements are checked for the token and the whole
    // row for the absence of the opacity trick.
    const { footer, messages } = mount();
    const closedValue = within(footer()).getByText(messages.footer.closed);
    const closedRow = closedValue.closest('div') as HTMLElement;
    const closedTerm = closedRow.querySelector('dt') as HTMLElement;

    expect(classesOf(closedTerm)).toContain('text-ink-muted');
    expect(classesOf(closedValue)).toContain('text-ink-muted');
    // …and an OPEN row keeps the solid ink — the ternary's other side.
    expect(classesOf(within(footer()).getByText('Luni'))).toContain('text-ink');
    for (const el of [closedRow, closedTerm, closedValue]) {
      expect(el.className).not.toMatch(/opacity-/);
    }
  });

  it('translates the closed label per locale, never a hardcoded word', () => {
    const { footer, messages } = mount('de');
    expect(footer().textContent).toContain(messages.footer.closed);
    expect(footer().textContent).not.toContain(ro.common.footer.closed);
  });
});

describe('Footer — row 3, the legal strip', () => {
  it('states the copyright with the build year and the single-source name', () => {
    const { footer, messages } = mount();
    const year = String(new Date().getFullYear());
    const expected = fill(messages.footer.copyright, {
      year,
      name: clinic.name,
    });

    expect(footer().textContent).toContain(expected);
    expect(expected).toContain(year);
    // A grouped "2.026" would be next-intl number-formatting the year — the
    // reason the value crosses as a string.
    expect(footer().textContent).not.toContain('2.0');
  });

  it('takes you back to the top with a plain fragment link, no JS', () => {
    const { messages } = mount();
    const top = screen.getByRole('link', { name: messages.footer.backToTop });

    expect(top.tagName).toBe('A');
    // '#top' is the HTML spec's own name for the top of the document, so this
    // works with zero script and zero id to point at.
    expect(top).toHaveAttribute('href', '#top');
    expect(
      screen.queryByRole('button', { name: messages.footer.backToTop }),
    ).toBeNull();
  });

  it('renders one named social control per URL the clinic actually has', () => {
    const { messages } = mount();
    const instagram = screen.getByRole('link', {
      name: fill(messages.footer.socialInstagram, { name: clinic.name }),
    });
    const tiktok = screen.getByRole('link', {
      name: fill(messages.footer.socialTiktok, { name: clinic.name }),
    });

    expect(instagram).toHaveAttribute('href', clinic.social.instagram);
    expect(tiktok).toHaveAttribute('href', clinic.social.tiktok);
    for (const link of [instagram, tiktok]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      // Icon-only controls: the glyph stays unlabelled, the anchor is named.
      const svg = link.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(link.textContent).toBe('');
    }
  });

  it('drops the button entirely when a profile URL is absent', () => {
    // The conditional itself, through the section OWN logic — no module
    // mocking, and no pretend clinic: socialEntries is what the component
    // calls, handed the data shapes the owner may actually leave behind.
    expect(socialEntries({}).map((entry) => entry.name)).toEqual([]);
    expect(socialEntries({ instagram: 'https://example.com' })).toEqual([
      {
        name: 'instagram',
        url: 'https://example.com',
        labelKey: 'footer.socialInstagram',
      },
    ]);
    expect(socialEntries({ tiktok: 'https://example.com' })).toEqual([
      {
        name: 'tiktok',
        url: 'https://example.com',
        labelKey: 'footer.socialTiktok',
      },
    ]);
    // …and the shipped data has both, which is what the render test above sees.
    expect(socialEntries(clinic.social).map((entry) => entry.name)).toEqual([
      'instagram',
      'tiktok',
    ]);
  });

  it('keeps the socials off the fixed corner discs (FloatingActions §b)', () => {
    // SC 2.4.11: the call CTA is `fixed` bottom-right at every scroll
    // position, so a 44px social flush against the right margin would sit
    // behind it. Centred below the step, and inset ≥ 88px above it (10vw of a
    // ≥960px canvas), is exactly the composition rule FloatingActions.tsx asks
    // pages for.
    const { footer } = mount();
    const socials = footer().querySelector('[data-footer-socials]');
    expect(socials).not.toBeNull();
    expect(classesOf(socials as Element)).toEqual(
      expect.arrayContaining(['@3xl:justify-self-end']),
    );
    const strip = (socials as Element).parentElement as HTMLElement;
    expect(classesOf(strip)).toContain('justify-items-center');
  });
});
