import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import type { Locale } from '@/i18n/locales';
import { SERVICE_TIERS } from '@/lib/services';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { ServicesTeaser } from './ServicesTeaser';

// Role-based queries on purpose (§9, §13) — the Footer.test.tsx conventions,
// unchanged: Romanian diacritics-bearing fixtures (§15.7), every user-facing
// string read back from the REAL message files (§17.4), no stylesheet loaded
// (utility TOKENS are the contract), nothing mocked.
//
// NO ContactModalProvider here, deliberately: this band holds no trigger — its
// only controls are plain links (§15.13) — so mounting one would test a
// wrapper the section does not need.
//
// THE PRICE IS NEVER HARDCODED IN THIS FILE. `Intl.NumberFormat` output is
// CLDR data: "100 RON" in ro/de/fr/it, "RON 100" in en, and the space between
// them is U+00A0 — all three facts belong to the platform's locale data and
// change with an ICU update, not with this component. So the expectation is
// COMPUTED the same way the section computes it (the amount from
// lib/services.ts, the sentence from the message file) and compared on
// whitespace-normalized text; what is actually under test is the WIRING —
// number + ICU pattern + locale — not the digits.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ServicesTeaser />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  return {
    ...utils,
    locale,
    home: MESSAGES[locale].home,
    services: MESSAGES[locale].services,
  };
};

const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** ICU interpolation, done the way the message file declares it (the
 * Footer.test.tsx helper). */
const fill = (message: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    message,
  );

/** Collapses every run of whitespace — U+00A0 included, which is exactly what
 * Intl puts between "100" and "RON" and what Testing Library's own normalizer
 * would fold on the DOM side only. */
const flatten = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** The from-price line as the section must render it, for one tier. */
const priceLine = (locale: Locale, priceRon: number): string =>
  fill(MESSAGES[locale].services.priceFrom, {
    price: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0,
    }).format(priceRon),
  });

describe('ServicesTeaser — the three sourced tiers', () => {
  it('opens with an <h2> that NAMES the band (aria-labelledby)', () => {
    const { home } = mount();
    const heading = screen.getByRole('heading', {
      level: 2,
      name: home.teaser.title,
    });
    expect(
      screen.getByRole('region', { name: home.teaser.title }),
    ).toContainElement(heading);
    // The eyebrow and the intro are the band's own copy, not the heading's
    // accessible name — the id sits on the <h2>, never on the opener's root.
    expect(screen.getByText(home.teaser.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(home.teaser.intro)).toBeInTheDocument();
  });

  it('renders ONE list item per tier in lib/services.ts', () => {
    mount();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      SERVICE_TIERS.length,
    );
    expect(SERVICE_TIERS).toHaveLength(3);
    // role="list" is redundant in the SPEC and load-bearing in WebKit: Safari
    // drops list semantics from a list styled `list-style: none`, which
    // Tailwind's preflight sets on every <ul> (the SpeedDial stem precedent).
    expect(list).toHaveAttribute('role', 'list');
  });

  it('renders each card as sections/ServiceCard in a BARE grid cell (S3)', () => {
    // THE ZERO-DIFF PIN for the stage-S3 rewire, from the consumer's side. The
    // <li> used to BE the card; the shape moved to sections/ServiceCard when
    // the Services page became its second consumer (§4's sharing table row 1,
    // the #64 promotion-rewires-consumers precedent), and the swap is accepted
    // on ZERO visual diff. So: every class the <li> carried now sits on the
    // <article> inside it, byte-identically, plus the `h-full` that hands the
    // stretched grid cell's height to the card (a block child would otherwise
    // shrink to its content and the three price rows would stop agreeing).
    // Written OUT rather than imported from ServiceCard: an edit there must
    // fail HERE, which an import would follow.
    const CARD_BASE =
      'flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-6';
    mount();

    for (const item of screen.getAllByRole('listitem')) {
      expect(item.getAttribute('class')).toBeNull();
      const card = item.firstElementChild as HTMLElement;
      expect(card.tagName).toBe('ARTICLE');
      expect(card.className).toBe(`${CARD_BASE} h-full`);
      expect(item.children).toHaveLength(1);
    }
  });

  it('gives every tier its name as an <h3> under the section’s h2', () => {
    const { services } = mount();
    for (const tier of SERVICE_TIERS) {
      const name = services.tiers[tier.key].name;
      expect(
        screen.getByRole('heading', { level: 3, name }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(services.tiers[tier.key].description),
      ).toBeInTheDocument();
    }
  });

  it('prints the from-price as ICU pattern + Intl currency, not a string', () => {
    mount();
    const [consult] = SERVICE_TIERS;
    const card = screen.getAllByRole('listitem')[0];
    expect(flatten(card.textContent ?? '')).toContain(
      flatten(priceLine('ro', consult.priceRon)),
    );
  });

  it('lets the LOCALE place the currency (the §8.3 reason for the split)', () => {
    // English puts the code first ("RON 100") where Romanian puts it last
    // ("100 RON"). One number in lib/services.ts, five sentences in the
    // message files, and no locale needs a hand-written price string.
    const { services } = mount('en');
    const [consult] = SERVICE_TIERS;
    const card = screen.getAllByRole('listitem')[0];

    expect(flatten(card.textContent ?? '')).toContain(
      flatten(priceLine('en', consult.priceRon)),
    );
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: services.tiers.consult.name,
      }),
    ).toBeInTheDocument();
  });

  it('closes with a PLAIN anchor to the Services page (§15.13)', () => {
    const { home } = mount();
    const link = screen.getByRole('link', { name: home.teaser.all });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/ro/services/');
  });

  it('is a full-bleed outer whose gutter box is ui/Container (band recipe)', () => {
    const { home } = mount();
    const band = screen.getByRole('region', { name: home.teaser.title });
    expect(band.tagName).toBe('SECTION');
    expect(classesOf(band)).not.toContain('@container');

    const gutter = band.firstElementChild as HTMLElement;
    for (const token of containerClasses.split(' ')) {
      expect(classesOf(gutter)).toContain(token);
    }
  });

  it('ships NO outer margin and flips on NAMED container steps only', () => {
    const { home } = mount();
    const band = screen.getByRole('region', { name: home.teaser.title });
    expect(classesOf(band).filter((c) => /^-?m[trblxyse]?-/.test(c))).toEqual(
      [],
    );

    // No custom container step may enter the untouched default scale (§3):
    // every @-VARIANT is one of Tailwind's own names. The bare `@container`
    // mark is the box itself, not a step, so it is excluded by name.
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;
    const named = /^@(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl):/;
    for (const el of band.querySelectorAll('*')) {
      const tokens = classesOf(el);
      expect(tokens.filter((c) => viewportVariant.test(c))).toEqual([]);
      for (const token of tokens.filter(
        (c) => c.startsWith('@') && c !== '@container',
      )) {
        expect(token).toMatch(named);
      }
    }
  });
});
