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
import { CTABanner } from './CTABanner';

// Role-based queries on purpose (§9, §13) — the Footer.test.tsx conventions:
// Romanian diacritics-bearing fixtures (§15.7), every user-facing string read
// back from the REAL message files (§17.4), no stylesheet loaded, nothing
// mocked.
//
// The keys live under `common`, not `home` (D-S2-8): §14 lists this band on
// Home AND Services, and one component reused verbatim keeps one namespace.
// This suite reads them from `common` for exactly that reason — moving them
// back under a page namespace would fail here first.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

// Both providers, in the shell's order: the trigger below is a
// ContactModalTrigger and throws outside a ContactModalProvider by design, and
// the dialog that provider renders reads the `contact` namespace — hence the
// whole message file (the Header.test.tsx idiom).
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ContactModalProvider>
      <CTABanner />
    </ContactModalProvider>
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  return { ...utils, common: MESSAGES[locale].common };
};

const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

describe('CTABanner — the closing conversion band', () => {
  it('opens with an <h2> that NAMES the band (aria-labelledby)', () => {
    const { common } = mount();
    const heading = screen.getByRole('heading', {
      level: 2,
      name: common.cta.title,
    });
    expect(
      screen.getByRole('region', { name: common.cta.title }),
    ).toContainElement(heading);
    // No eyebrow above it: the band asks one question and offers one action.
    expect(screen.getByText(common.cta.text)).toBeInTheDocument();
  });

  it('offers ONE action — a real <button> named common.cta.action', () => {
    // The site's conversion goal (§1) reached the way every opener reaches it:
    // an in-place action, so a button and never an anchor (§9).
    const { common } = mount();
    const trigger = screen.getByRole('button', { name: common.cta.action });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('speaks whatever locale the shell is in', () => {
    // German is the longest language (§8.4) and the second locale is what
    // proves the band reads the message file rather than a constant.
    const { common } = mount('de');
    screen.getByRole('heading', { level: 2, name: common.cta.title });
    screen.getByRole('button', { name: common.cta.action });
  });

  it('is a full-bleed outer whose gutter box is ui/Container (band recipe)', () => {
    const { common } = mount();
    const band = screen.getByRole('region', { name: common.cta.title });
    expect(band.tagName).toBe('SECTION');
    expect(classesOf(band)).not.toContain('@container');

    const gutter = band.firstElementChild as HTMLElement;
    for (const token of containerClasses.split(' ')) {
      expect(classesOf(gutter)).toContain(token);
    }
  });

  it('centres the PROSE on the element itself, never on a wrapper (§15.15 b)', () => {
    // globals.css aligns every <p> to `start` in the base layer, and a rule
    // that matches the element beats an inherited value — so `text-center` on
    // an ancestor would reach the <h2> and NOT this paragraph. ui/Text merges
    // the caller's className onto its own host <p> (§6.8), which is exactly
    // "on the p itself".
    const { common } = mount();
    const line = screen.getByText(common.cta.text);
    expect(line.tagName).toBe('P');
    expect(classesOf(line)).toContain('text-center');
  });

  it('ships NO outer margin — pages own inter-band rhythm (§6.4)', () => {
    const { common } = mount();
    const band = screen.getByRole('region', { name: common.cta.title });
    expect(classesOf(band).filter((c) => /^-?m[trblxyse]?-/.test(c))).toEqual(
      [],
    );
  });
});
