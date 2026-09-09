import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Phone } from '@/assets/glyphs/Phone';
import { locales, type Locale } from '@/i18n/locales';
import { clinic } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { ClinicLocation } from './ClinicLocation';
import source from './ClinicLocation.tsx?raw';

// sections/ClinicLocation — the interaction suite. Role-based queries on
// purpose (§9, §13): a passing suite doubles as proof of accessible markup.
// Fixtures are Romanian with diacritics (§15.7) and every user-facing string
// comes from the REAL message files or lib/clinic/clinic.ts — never a literal
// typed in here (§17.4). A renamed or dropped key then fails HERE as well as in
// the translation-parity gate, instead of silently rendering the dotted key
// path (which is what next-intl does for a miss).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo already follows (Footer, GlyphButton, Header).
//
// ── THE SEAM'S CONTRACT IS THE POINT OF THE MAP BLOCK BELOW. The Google embed
// ships UNGATED for now (board .claude/plans/clinic-location.plan.md D1, owner
// option A 2026-09-09). The cookie-strategy lane will wrap that one element in
// a consent record; the attribute pins here exist so that lane inherits a green
// suite to EXTEND rather than a design to reverse-engineer — src, title, the
// lazy load, the empty permission list and the referrer policy are all stated,
// so a future edit that loosens any of them fails loudly.
//
// ── NOTHING IS MOCKED. The section touches no router, no cookie and no clock;
// the iframe never has to load for any assertion here (the attributes ARE the
// contract), and the visual net fences the network of its own accord
// (tests/visual/stories.spec.ts, board D9).

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/** The provider the section gets in production (app/[locale]/layout.tsx wraps
 *  the whole tree) and in Storybook (.storybook/preview.tsx decorator), so the
 *  tests mount it the same way. ClinicLocation is NOT a client component;
 *  useTranslations is isomorphic and reads this context. */
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ClinicLocation />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />);
  const messages = MESSAGES[locale].home.location;
  return {
    ...utils,
    messages,
    locale,
    // Named by its own <h2> through aria-labelledby, which is what makes a
    // <section> a `region` in the accessibility tree at all.
    band: () => screen.getByRole('region', { name: messages.title }),
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

/** The visible address line — DATA from lib/clinic (§10.1), never a message:
 *  an address is not copy, and the Footer prints the same two fields. */
const ADDRESS = `${clinic.address.street}, ${clinic.address.city}`;

/** The section's source with its PROSE removed, which is what the zero-island
 *  guard at the bottom runs against (mechanism from Wordmark.test.tsx, where
 *  its reasoning is written out in full). Without it the guard polices the
 *  file's own documentation: the header discusses `'use client'` by name. */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('ClinicLocation — the region landmark', () => {
  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    // A <section> only becomes a `region` once it has an accessible name, and
    // aria-labelledby → the heading's id is how it gets one. Spelling
    // role="region" as well would be redundant ARIA (§9 semantic-HTML-first).
    const { band, messages } = mount();

    expect(band().tagName).toBe('SECTION');
    expect(band()).not.toHaveAttribute('role');
    expect(band()).toHaveAttribute(
      'aria-labelledby',
      'clinic-location-heading',
    );

    const heading = screen.getByRole('heading', {
      level: 2,
      name: messages.title,
    });
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('id', 'clinic-location-heading');
  });

  it('opens with the eyebrow over the title, through sections/SectionHeading', () => {
    const { band, messages } = mount();

    // The eyebrow is a <p> one tier down (ui/Eyebrow) — asserted by TEXT, so a
    // broken diacritic path fails here rather than in front of a patient.
    expect(within(band()).getByText(messages.eyebrow).tagName).toBe('P');
    expect(band().textContent).toContain(messages.title);
  });

  it('carries NO outer margin — the page owns the rhythm around it (§6.4)', () => {
    const { band } = mount();
    const margins = classesOf(band()).filter((c) => /^-?m[trblxye]?-/.test(c));

    expect(margins).toEqual([]);
  });
});

describe('ClinicLocation — the map, i.e. the CONSENT SEAM contract', () => {
  it('embeds exactly one iframe, pointed at the single-source embed URL', () => {
    const { band } = mount();
    const frames = band().querySelectorAll('iframe');

    expect(frames).toHaveLength(1);
    expect(frames[0]).toHaveAttribute('src', clinic.mapEmbedUrl);
    // The `pb=` form is the only one Google renders inside a frame — pinned so
    // a hand-written maps URL (which shows nothing) cannot ship silently.
    expect(clinic.mapEmbedUrl).toContain('google.com/maps/embed?pb=');
  });

  it('names the frame per locale, with the clinic name filled from lib/clinic', () => {
    // An <iframe> with no title is an axe violation and an unnavigable stop for
    // a screen reader. Five locales, because this is the one string in the band
    // that BOTH translates and interpolates.
    for (const locale of locales) {
      const { band, messages, unmount } = mount(locale);
      const frame = band().querySelector('iframe') as HTMLIFrameElement;

      expect(frame.getAttribute('title'), locale).toBe(
        fill(messages.mapAlt, { name: clinic.name }),
      );
      expect(within(band()).getByTitle(frame.title)).toBe(frame);
      expect(frame.title, locale).toContain(clinic.name);
      unmount();
    }
  });

  it('loads lazily, grants the frame NO permissions, and leaks no referrer', () => {
    // Board D2: `no-referrer` is stricter than both the old site's value and
    // the browser default — Google gets the visitor's IP either way, but not
    // WHICH page of this site they were reading. `allow=""` is an explicit
    // empty permission list (no fullscreen, no microphone, no payment), which
    // is a different thing from the attribute being absent.
    const { band } = mount();
    const frame = band().querySelector('iframe') as HTMLIFrameElement;

    expect(frame).toHaveAttribute('loading', 'lazy');
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame.hasAttribute('allow')).toBe(true);
    expect(frame.getAttribute('allow')).toBe('');
  });

  it('sits in a bordered, clipped tray so Google never paints past the corners', () => {
    // The tray is the on-brand loading state (and, with the visual net's
    // network fence, the thing the baselines actually photograph). `rounded-md`
    // is the house radius (D4) and only `overflow-hidden` makes the frame
    // respect it; `shadow-aura` is the EXISTING token (D3), not a new one.
    const { band } = mount();
    const tray = (band().querySelector('iframe') as HTMLElement)
      .parentElement as HTMLElement;

    expect(classesOf(tray)).toEqual(
      expect.arrayContaining([
        'aspect-[2/1]',
        'overflow-hidden',
        'rounded-md',
        'border',
        'border-line-subtle',
        'bg-line-subtle',
        'shadow-aura',
      ]),
    );
  });
});

describe('ClinicLocation — the two contact rows', () => {
  it('sends the directions row to Google Maps in a new tab, safely', () => {
    const { messages } = mount();
    const row = screen.getByRole('link', {
      name: fill(messages.directionsLabel, { address: ADDRESS }),
    });

    // DERIVED from clinic.geo (lib/clinic's `directionsUrlFor`), so the pin the
    // map shows and the pin directions lead to are one number (§10.1).
    expect(row).toHaveAttribute('href', clinic.directionsUrl);
    expect(row.getAttribute('href')).toContain(
      `destination=${clinic.geo.latitude},${clinic.geo.longitude}`,
    );
    expect(row).toHaveAttribute('target', '_blank');
    expect(row.getAttribute('rel')).toContain('noopener');
    expect(row.getAttribute('rel')).toContain('noreferrer');
    // The visible line is the address, printed from the NAP source.
    expect(row).toHaveTextContent(clinic.address.street);
    expect(row).toHaveTextContent(clinic.address.city);
  });

  it('dials the E.164 number from the call row while SHOWING the human format', () => {
    const { messages } = mount();
    const row = screen.getByRole('link', {
      name: fill(messages.callLabel, { phone: clinic.phoneDisplay }),
    });

    expect(row).toHaveAttribute('href', `tel:${clinic.phone}`);
    expect(row).toHaveAttribute('href', 'tel:+40700000000');
    // NO target/rel: tel: hands the number to a protocol handler (the dialler),
    // it does not navigate a browsing context — _blank would open and orphan a
    // blank tab on desktop. The Footer's phone disc holds the same line.
    expect(row).not.toHaveAttribute('target');
    expect(row.textContent).toBe(clinic.phoneDisplay);
    // Two different strings on purpose: a tel: href needs E.164, a reader
    // needs spacing.
    expect(clinic.phoneDisplay).not.toBe(clinic.phone);
  });

  it('dresses the row text at the old weight, on the section’s OWN span (D5)', () => {
    // ui/Text has no medium axis and a section lane does not grow one (§6.6);
    // a section writing utilities on its own markup is lawful (§6.7) — the
    // ContactModal's "plain <h2> wearing the dress" precedent. 18px is the
    // §15.1 body base, i.e. the old site's `sm:text-lg` at every width.
    const { band } = mount();

    for (const text of [ADDRESS, clinic.phoneDisplay]) {
      const line = within(band()).getByText(text);
      expect(line.tagName).toBe('SPAN');
      expect(classesOf(line)).toEqual(['text-base', 'font-medium', 'text-ink']);
    }
  });

  it('names each row so the label CONTAINS its visible text (SC 2.5.3)', () => {
    // Label in Name: a speech-input user says what they SEE. An aria-label that
    // replaced the visible words instead of extending them would make the row
    // unspeakable — asserted programmatically for both rows rather than by
    // eyeballing the message file.
    const { band } = mount();

    for (const link of within(band()).getAllByRole('link')) {
      const name = link.getAttribute('aria-label') ?? '';
      const visible = (link.textContent ?? '').trim();

      expect(visible).not.toBe('');
      expect(name).toContain(visible);
      expect(link).toHaveAccessibleName(name);
    }
  });

  it('renders TWO rows and nothing else clickable', () => {
    const { band } = mount();
    expect(within(band()).getAllByRole('link')).toHaveLength(2);
  });

  it('never syllable-splits its label — the §15.14 button rule, on a link row', () => {
    // The body's `hyphens: auto` is inherited; ui/Button and ui/TextButton opt
    // out under the owner's "text on buttons is never allowed to be split", and
    // a whole-row link with a text label is the same kind of control (G2 a11y,
    // 2026-09-09). `hyphens` inherits, so the anchor carries the opt-out once.
    const { band } = mount();

    for (const link of within(band()).getAllByRole('link')) {
      expect(classesOf(link)).toContain('hyphens-none');
    }
  });
});

describe('ClinicLocation — the discs are DECORATION, painted by ui/GlyphButton', () => {
  it('hides each disc from the a11y tree and lets it hold exactly one svg', () => {
    // The row's aria-label is the name AT hears; the disc must add nothing to
    // it, or every row announces its icon twice.
    const { band } = mount();
    const links = within(band()).getAllByRole('link');

    for (const link of links) {
      const discs = link.querySelectorAll(':scope > span[aria-hidden="true"]');
      expect(discs).toHaveLength(1);
      expect(discs[0].querySelectorAll('svg')).toHaveLength(1);
    }
    expect(band().querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2);
  });

  it('never nests a control inside a link — the invalid-HTML guard', () => {
    // HTML forbids a <button> or a second <a> inside an <a>; browsers recover
    // by SPLITTING the markup, which would break the whole-row click target.
    // `asChild` is the atom's own door for "paint your face on my element".
    const { band } = mount();

    for (const link of within(band()).getAllByRole('link')) {
      expect(link.querySelector('a, button')).toBeNull();
    }
    expect(within(band()).queryAllByRole('button')).toHaveLength(0);
  });

  it('wears GlyphButton’s solid face verbatim, plus the aura', () => {
    // The atom's real bundle, rendered right here: the expectation is DERIVED,
    // never typed, so a solid-variant edit lands in this assertion instead of
    // drifting silently apart from the section.
    const { band } = mount();
    const disc = band().querySelector(
      'span[aria-hidden="true"]',
    ) as HTMLElement;

    render(
      <GlyphButton variant="solid" aria-label="x">
        <Phone />
      </GlyphButton>,
    );
    const reference = classesOf(screen.getByRole('button', { name: 'x' }));

    expect(reference.length).toBeGreaterThan(0);
    expect(classesOf(disc)).toEqual(expect.arrayContaining(reference));
    // FloatingActions' precedent: the static aura composes into the atom's own
    // box-shadow through className (§6.8) and holds still while the hairline
    // lerps. Numerically the old site's `shadow-cta`.
    expect(classesOf(disc)).toContain('shadow-aura');
  });

  it('mirrors that face onto the ROW as a KEEP-IN-SYNC pair (board D6)', () => {
    // The old site's mechanism: hovering anywhere on the row flips the disc.
    // The atom spells its face with `hover:`/`active:` (fires when the DISC is
    // hovered); the section needs the same values with the `group-` prefix
    // (fires when the row is). Same values, a second trigger — NOT a restyle
    // (§6.8). The mapping is computed from the rendered atom, so editing
    // GlyphButton's solid bundle fails HERE until the section's ROW_HOVER
    // moves with it (GlyphButton.tsx carries the pointer back).
    const { band } = mount();
    const link = within(band()).getAllByRole('link')[0];
    const disc = link.querySelector('span[aria-hidden="true"]') as HTMLElement;

    render(
      <GlyphButton variant="solid" aria-label="x">
        <Phone />
      </GlyphButton>,
    );
    const expected = classesOf(screen.getByRole('button', { name: 'x' }))
      .filter((c) => c.startsWith('hover:') || c.startsWith('active:'))
      .map((c) => `group-${c}`);

    // The atom really does carry a hover face — a green assertion over an
    // empty list would prove nothing.
    expect(expected.length).toBeGreaterThanOrEqual(5);
    // EXACT, in BOTH directions (G2 typescript, 2026-09-09): the disc's whole
    // `group-` subset must equal the atom's mapped face. A subset check would
    // stay green if the atom dropped a token (`hover:inset-ring-cta`, say) or
    // if ROW_HOVER grew one the atom never wears (fb-49's banned scale pop) —
    // and either way the header's "identical values, second trigger" claim
    // would quietly stop being true. The bare `group` marker on the atom's
    // root never matches `group-`, so the filter is clean. The press-snap
    // (`active:duration-0`, from ui/disc.ts) rides in through the same map,
    // so a row-driven press feels like a disc-driven one instead of fading.
    const rowDriven = classesOf(disc).filter((c) => c.startsWith('group-'));
    expect([...rowDriven].sort()).toEqual([...expected].sort());
    // …and the row is the hover SOURCE: `group` emits no CSS of its own, so
    // without it every class above is inert.
    expect(classesOf(link)).toContain('group');
    // The row is also the focus target, in the house spelling (ui/disc.ts).
    expect(classesOf(link)).toEqual(
      expect.arrayContaining([
        'outline-offset-2',
        'focus-visible:outline-2',
        'focus-visible:outline-focus',
      ]),
    );
  });
});

describe('ClinicLocation — measured boxes and zero islands', () => {
  it('measures the CONTAINER, never the viewport (§6.5)', () => {
    // A media query here would react to the window instead of the box the band
    // actually occupies. Token-wise, not a substring match — `@3xl:`
    // legitimately contains "xl:".
    const { band } = mount();
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;

    for (const el of band().querySelectorAll('*')) {
      expect(classesOf(el).filter((c) => viewportVariant.test(c))).toEqual([]);
    }
    // The band root paints; the gutter box one level in is the container
    // (Container's PAGE-BAND RECIPE, rule 1). The gutter pair is asserted
    // through the atom's own EXPORTED constant rather than written out:
    // tests/unit/gutter-single-spelling.test.ts fences src/ against a second
    // spelling of the clamp, and Footer.test.tsx is already the one
    // deliberate cross-section byte-pin on that allowlist — a copy here would
    // be exactly the paste the promotion exists to prevent (§15.15 a).
    expect(classesOf(band())).not.toContain('@container');
    const gutter = band().firstElementChild as HTMLElement;
    for (const token of containerClasses.split(' ')) {
      expect(classesOf(gutter)).toContain(token);
    }
    expect(classesOf(gutter)).toContain('@container');
  });

  it('flips the map/rows grid on NAMED container steps only (board D7)', () => {
    // @lg ≡ the old `sm:` (640 − 128 = 512) and @3xl ≡ the old `lg:` at every
    // §7 sampled width: phone 390 → box 312 and tablet 768 → box 614 stack the
    // rows BELOW the map; notebook 1280 → box 1024 puts them beside it.
    const { band } = mount();
    const grid = band().querySelector('[class*="grid-cols"]') as HTMLElement;
    const tokens = classesOf(grid);

    expect(tokens).toEqual(
      expect.arrayContaining([
        'grid',
        'gap-6',
        '@3xl:grid-cols-[1fr_auto]',
        '@3xl:items-center',
      ]),
    );
    // No custom container step may enter the untouched default scale (§3).
    const named = /^@(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl):/;
    const steps = classesOf(band())
      .concat(
        ...Array.from(band().querySelectorAll('*'), (el) => classesOf(el)),
      )
      .filter((c) => c.startsWith('@') && c !== '@container');
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) expect(step).toMatch(named);
  });

  it('puts the two rows on ONE line on tablet, pinned to both container edges', () => {
    // Owner, pack rounds 2–5 (final): at the tablet step the rows share a
    // line — the address row on the container's start edge, the phone row on
    // its end edge — and go back to a column beside the map. Phone (below the
    // step) stays a stacked, flush-start column: no `justify-*` at the base.
    const { band } = mount();
    const column = within(band()).getAllByRole('link')[0]
      .parentElement as HTMLElement;
    const tokens = classesOf(column);

    expect(tokens).toEqual(
      expect.arrayContaining([
        'flex',
        'flex-col',
        '@lg:flex-row',
        '@lg:justify-between',
        '@3xl:flex-col',
        '@3xl:justify-start',
      ]),
    );
    expect(tokens.filter((c) => /^justify-/.test(c))).toEqual([]);
  });

  it('lights up ONE row on hover, never both (the hover scope is per row)', () => {
    // Owner: "if I hover on one of the two … not both of them light up". The
    // disc's `group-hover:` face fires for the nearest `group` ANCESTOR that is
    // hovered — so the scope is exactly the element that wears `group`. Each
    // row anchor wears it; the column that holds both rows must NOT, and no
    // ancestor above it may either, or one pointer would flip both discs.
    const { band } = mount();
    const links = within(band()).getAllByRole('link');
    const column = links[0].parentElement as HTMLElement;

    for (const link of links) expect(classesOf(link)).toContain('group');
    expect(classesOf(column)).not.toContain('group');
    let ancestor: HTMLElement | null = column;
    while (ancestor && ancestor !== document.body) {
      expect(classesOf(ancestor)).not.toContain('group');
      ancestor = ancestor.parentElement;
    }
  });

  it('gives the band its own vertical rhythm one level in (the rhythm box)', () => {
    // An element cannot query its OWN size: the Container IS the container, so
    // stepped `py` has to sit on a child of it. The recipe's "band owns its py"
    // holds; only the element wearing it moves down one level (Footer, with a
    // single un-stepped py-10, never needed this).
    const { band } = mount();
    const rhythm = (band().firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;

    expect(classesOf(rhythm)).toEqual(['py-12', '@lg:py-16', '@3xl:py-20']);
  });

  it('ships NO client directive — inert HTML on every page (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts) so it runs in the same browser project as the
    // rest of the suite. Anchored to a line of its OWN, because that is what a
    // directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    // …and the reasons it can stay that way: no state, no handler. t() stays —
    // next-intl's useTranslations is isomorphic (the Footer's precedent).
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('never leaks a message key path into a visible string', () => {
    // next-intl does not throw on a miss — it renders "home.location.title" and
    // logs. This is the assertion that turns that into a failure.
    const { band } = mount();
    const text = band().textContent ?? '';

    expect(text).not.toMatch(/home\.location\./);
    expect(text).not.toMatch(/\{(name|address|phone)\}/);
    // The iframe's name is not textContent, so it is checked on its own.
    expect(
      (band().querySelector('iframe') as HTMLIFrameElement).title,
    ).not.toMatch(/home\.location\.|\{name\}/);
  });

  it('translates the whole band per locale, never a hardcoded word', () => {
    const { band, messages } = mount('de');

    expect(band().textContent).toContain(messages.title);
    expect(band().textContent).toContain(messages.eyebrow);
    expect(band().textContent).not.toContain(ro.home.location.title);
    // …while the DATA lines stay put: an address and a phone number are not
    // copy (§10.1), so they read identically in every language.
    expect(band().textContent).toContain(ADDRESS);
    expect(band().textContent).toContain(clinic.phoneDisplay);
  });
});
