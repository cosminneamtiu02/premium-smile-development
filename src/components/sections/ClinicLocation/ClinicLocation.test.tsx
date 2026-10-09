import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — for ONE
// block, THE BAND SCALE at the bottom, which reads COMPUTED lengths (the
// header below says why). tests/setup/components.ts loads no CSS globally;
// the per-file import is the house pattern (Card, Modal, DoctorShowcase).
import '@/styles/globals.css';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Phone } from '@/assets/glyphs/Phone';
import { locales, type Locale } from '@/i18n/locales';
import { clinic, mapEmbedUrlFor } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { ClinicLocation, type ClinicLocationProps } from './ClinicLocation';
import source from './ClinicLocation.tsx?raw';

// sections/ClinicLocation — the interaction suite. Role-based queries on
// purpose (§9, §13): a passing suite doubles as proof of accessible markup.
// Fixtures are Romanian with diacritics (§15.7) and every user-facing string
// comes from the REAL message files or lib/clinic/clinic.ts — never a literal
// typed in here (§17.4). A renamed or dropped key then fails HERE as well as in
// the translation-parity gate, instead of silently rendering the dotted key
// path (which is what next-intl does for a miss).
//
// The utility TOKENS are the contract almost everywhere here, the convention
// every component test in this repo follows (Footer, GlyphButton, Header). The
// stylesheet IS loaded in this file since 2026-10-02 (the import above), and
// the token pins neither need nor notice it: it exists for THE BAND SCALE
// block at the bottom, because what the band's `scaled` prop and the discs'
// DISC_SIZE buy is a RESOLVED length — the disc 44px outside the regime, 44
// design px inside it — and a class name cannot show that. One token pin
// reads a computed value too: the row text's 16px, whose old comment had
// claimed 18 (the component header's OLD → NEW, item 3).
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
 *  useTranslations is isomorphic and reads this context. The band's one prop
 *  passes straight through — absent unless a case names it, which is the
 *  doctor page's call (§15.32). */
const Mounted = ({
  locale,
  ...props
}: ClinicLocationProps & { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ClinicLocation {...props} />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro', props: ClinicLocationProps = {}) => {
  const utils = render(<Mounted locale={locale} {...props} />);
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
    // lib/clinic's ONE url, in this mount's language (Romanian) — the case
    // below has all five.
    expect(frames[0]).toHaveAttribute(
      'src',
      mapEmbedUrlFor(clinic.mapEmbedUrl, 'ro'),
    );
    // The `pb=` form is the only one Google renders inside a frame — pinned so
    // a hand-written maps URL (which shows nothing) cannot ship silently.
    expect(clinic.mapEmbedUrl).toContain('google.com/maps/embed?pb=');
  });

  it("shows the map in the page's own language — five locales, one place", () => {
    // Google's controls and its place card read their language from two
    // fields inside the url and from nothing else (`mapEmbedUrlFor` in
    // lib/clinic has the measurement), so the one pasted url reaches each
    // page with those fields swapped. Pinned on the RENDERED attribute in
    // every locale, because no other gate can see it: an English card on
    // the Romanian page passes axe, and the visual net fences the frame.
    const sources = new Set<string>();
    for (const locale of locales) {
      const { band, unmount } = mount(locale);
      const src = band().querySelector('iframe')?.getAttribute('src') ?? '';

      expect(src, locale).toBe(mapEmbedUrlFor(clinic.mapEmbedUrl, locale));
      expect(src, locale).toContain(`!3m2!1s${locale}!2s`);
      expect(src, locale).toContain(`!5m2!1s${locale}!2s`);
      sources.add(src);
      unmount();
    }
    // Five pages, five urls: the language really travels.
    expect(sources.size).toBe(locales.length);
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
        'overflow-hidden',
        'rounded-md',
        'border',
        'border-line-subtle',
        'bg-line-subtle',
        'shadow-aura',
      ]),
    );
  });

  it('shapes the tray 4:3 on a phone and 2:1 from the `@lg` step — two ratio tokens, nothing else', () => {
    // The owner, 2026-10-09: "i need map on phone to be like 50% taller. it is
    // too small." (the component header's OLD → NEW, item 4; §15.34). Under
    // `@lg` — the phone layout, D7 — the tray is three quarters of its width
    // tall instead of half; from the step up it keeps the 2:1 it always had.
    // EXACTLY these two: a third ratio token (a `@3xl:` one, say) would move
    // the tablet or the laptop, which the owner did not ask for; the computed
    // block at the bottom shows what the two draw.
    const { band } = mount();
    const tray = (band().querySelector('iframe') as HTMLElement)
      .parentElement as HTMLElement;

    expect(
      classesOf(tray)
        .filter((c) => c.includes('aspect-'))
        .sort(),
    ).toEqual(['@lg:aspect-[2/1]', 'aspect-[4/3]']);
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
    expect(row).toHaveAttribute('href', 'tel:+40770162765');
    // NO target/rel: tel: hands the number to a protocol handler (the dialler),
    // it does not navigate a browsing context — _blank would open and orphan a
    // blank tab on desktop. The Footer's phone disc holds the same line.
    expect(row).not.toHaveAttribute('target');
    expect(row.textContent).toBe(clinic.phoneDisplay);
    // Two different strings on purpose: a tel: href needs E.164, a reader
    // needs spacing.
    expect(clinic.phoneDisplay).not.toBe(clinic.phone);
  });

  it('dresses the row text at the old weight, on the section’s OWN span (D5) — 16px, never the 18 an old comment claimed', () => {
    // ui/Text has no medium axis and a section lane does not grow one (§6.6);
    // a section writing utilities on its own markup is lawful (§6.7) — the
    // ContactModal's "plain <h2> wearing the dress" precedent. `text-base` is
    // Tailwind's 1rem: 16px, the old row's PHONE size, at every width — the
    // 1.125rem body base (§15.1) sits on `body` and the utility replaces it.
    // Until 2026-10-02 this comment and the component's said 18px, "the old
    // site's `sm:text-lg`"; the computed read below is what keeps the next
    // reader from believing it again (the header's OLD → NEW, item 3).
    const { band } = mount();

    for (const text of [ADDRESS, clinic.phoneDisplay]) {
      const line = within(band()).getByText(text);
      expect(line.tagName).toBe('SPAN');
      expect(classesOf(line)).toEqual(['text-base', 'font-medium', 'text-ink']);
      expect(getComputedStyle(line).fontSize).toBe('16px');
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

  it('wears GlyphButton’s solid face in the lavender family verbatim, plus the aura', () => {
    // The atom's real bundle, rendered right here: the expectation is DERIVED,
    // never typed, so a solid-variant edit lands in this assertion instead of
    // drifting silently apart from the section. The family is the LAVENDER
    // one since 2026-10-01 (the owner: "buttons for location and phone next
    // to the map" lilac, like the menu buttons) — the reference is cut from
    // that cell, and a drift back to the green fails below by name.
    const { band } = mount();
    const disc = band().querySelector(
      'span[aria-hidden="true"]',
    ) as HTMLElement;

    render(
      <GlyphButton variant="solid" tone="accent" aria-label="x">
        <Phone />
      </GlyphButton>,
    );
    const reference = classesOf(screen.getByRole('button', { name: 'x' }));

    expect(reference.length).toBeGreaterThan(0);
    expect(classesOf(disc)).toEqual(expect.arrayContaining(reference));
    expect(classesOf(disc)).toContain('bg-accent');
    expect(classesOf(disc).filter((c) => /cta/.test(c))).toEqual([]);
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
      <GlyphButton variant="solid" tone="accent" aria-label="x">
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
    // single un-stepped py-10, never needed this). The band as the doctor page
    // mounts it — no `scaled`; THE BAND SCALE block below holds the other.
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

// ── THE BAND SCALE (2026-10-02, §15.32) ─────────────────────────────────────
// The band's one prop, `scaled`, puts its rhythm box in ui/Container's two
// band-scale strings (the component header's THE BAND SCALE). Two blocks: the
// CLASS contract — off by default and byte-identical, on the rhythm box alone
// when asked, the discs' DISC_SIZE in both modes — and the COMPUTED one, on
// the real stylesheet, where the same facts become lengths. The strings
// themselves are read from the atom's exports and never written out here:
// their one spelling is ui/Container's, and tests/unit/design-scale.test.ts
// fences every other (its D-LIT rule reads this file's raw text too).

/** The rhythm box — the band's first box inside ui/Container, the one that
 *  carries its `py` (board D7) and, under `scaled`, the scale. */
const rhythmOf = (band: HTMLElement): HTMLElement =>
  (band.firstElementChild as HTMLElement).firstElementChild as HTMLElement;

/** Every element of the band, the band's own <section> included. */
const everyElementOf = (band: HTMLElement): Element[] => [
  band,
  ...band.querySelectorAll('*'),
];

/** An element's classes behind globals.css's `scalable:` gate — every regime
 *  class and the cap wear it outermost (tests/unit/design-scale.test.ts). */
const gatedClassesOf = (el: Element): string[] =>
  classesOf(el).filter((c) => c.startsWith('scalable:'));

/** The discs' one geometric word, written out as the byte pin (the Eyebrow
 *  RECIPE convention) — the very literal the component's DISC_SIZE carries,
 *  so Tailwind finds no class here that the site does not already ship. */
const DISC_SIZE = '[--disc-size:calc(var(--spacing)*11)]';

describe('ClinicLocation — THE BAND SCALE, the class contract (§15.32)', () => {
  it('is OFF by default — the doctor page’s band: three `py` tokens on the rhythm box, no gated class anywhere, and `scaled={false}` the same markup to the byte', () => {
    // The doctor page mounts the band with no prop, and its other bands do not
    // scale yet (§15.32) — so the default must be today's band exactly. The
    // markup comparison is safe: nothing in the band generates an id.
    const implicit = render(<Mounted locale="ro" />);
    const markup = implicit.container.innerHTML;
    const band = screen.getByRole('region', { name: ro.home.location.title });

    expect(classesOf(rhythmOf(band))).toEqual([
      'py-12',
      '@lg:py-16',
      '@3xl:py-20',
    ]);
    for (const el of everyElementOf(band)) {
      expect(gatedClassesOf(el)).toEqual([]);
    }
    implicit.unmount();

    const explicit = render(<Mounted locale="ro" scaled={false} />);
    expect(explicit.container.innerHTML).toBe(markup);
  });

  it('wears BOTH strings on the rhythm box when asked — after its `py`, in the order cx() writes them, and on no other element', () => {
    // ui/Container's recipe rule 5: the RHYTHM box, the first inside the
    // Container — never the Container itself (an element cannot query its own
    // size, and the regime's `@4xl` step reads the Container), never the
    // <section> (outside the container context, the step would never match).
    const { band } = mount('ro', { scaled: true });
    const rhythm = rhythmOf(band());

    expect(classesOf(rhythm)).toEqual([
      'py-12',
      '@lg:py-16',
      '@3xl:py-20',
      ...bandColumnClasses.split(' '),
      ...bandScaleClasses.split(' '),
    ]);
    expect(gatedClassesOf(rhythm).length).toBeGreaterThan(0);
    for (const el of everyElementOf(band())) {
      if (el !== rhythm) expect(gatedClassesOf(el)).toEqual([]);
    }
  });

  it('changes NOTHING else — the scaled markup is the plain one with the rhythm box’s class list swapped back', () => {
    // The whole band follows the scale through the remapped theme, never
    // through a second class anywhere inside it (globals.css, THE DESIGN
    // SCALE): proven by undoing the one difference and comparing bytes.
    const plain = render(<Mounted locale="ro" />);
    const markup = plain.container.innerHTML;
    plain.unmount();

    const scaled = render(<Mounted locale="ro" scaled />);
    const rhythm = rhythmOf(
      screen.getByRole('region', { name: ro.home.location.title }),
    );
    const swapped = scaled.container.innerHTML.replace(
      `class="${rhythm.getAttribute('class') ?? ''}"`,
      'class="py-12 @lg:py-16 @3xl:py-20"',
    );

    // Never vacuous: the swap really found the scaled list.
    expect(swapped).not.toBe(scaled.container.innerHTML);
    expect(swapped).toBe(markup);
  });

  it('sizes each disc in the band’s own spacing step, in BOTH modes — eleven steps, the atom’s 2.75rem drawn in the band’s pixel', () => {
    // ui/disc.ts's D16 door ("a HOST may set per screen type through
    // className"), worn ALWAYS, so the doctor page's band and Home's can never
    // disagree about what a disc is made of (the component's DISC_SIZE). The
    // computed block below shows what the class buys in each mode.
    for (const scaled of [false, true]) {
      const { band, unmount } = mount('ro', { scaled });
      const discs = band().querySelectorAll('span[aria-hidden="true"]');

      expect(discs).toHaveLength(2);
      for (const disc of discs) expect(classesOf(disc)).toContain(DISC_SIZE);
      unmount();
    }
  });
});

// ── THE BAND SCALE, COMPUTED ────────────────────────────────────────────────
// The same contract as lengths, on the real stylesheet (the import at the
// top): the band in a box that hands its Container a column of exactly
// `width` px — the gutter read off a probe wearing the real class, never
// assumed (DoctorShowcase.test.tsx's `renderColumn`, whose block is the
// regime's full measurement) — and every size read back from the engine. No
// typeface is loaded, and none is needed: a font SIZE, a disc's box and the
// map tray's 2:1 do not depend on glyph shapes (the words' WIDTHS would, and
// nothing here reads them). Tolerance: a twentieth of a pixel — layout rounds
// to 1/64px and a design pixel keeps its fraction.

/** ui/Container's gutter per side at this window, read off a probe wearing
 *  the real class — the clamp is spelled once, in Container.tsx. */
const gutter = (): number => {
  const probe = document.createElement('div');
  probe.className = containerClasses;
  document.body.append(probe);
  try {
    return parseFloat(getComputedStyle(probe).marginLeft);
  } finally {
    probe.remove();
  }
};

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel, and the CAP, 96rem, in px at this
 *  runner's 16px root (the premise asserts the root). Spelled again on
 *  purpose: the census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const CAP = 96 * 16;

/** The band, Romanian, in a box whose Container gets a `width` px column. */
const renderColumn = (width: number, scaled: boolean) => {
  render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <Mounted locale="ro" scaled={scaled} />
    </div>,
  );
  const band = screen.getByRole('region', { name: ro.home.location.title });
  const column = band.firstElementChild as HTMLElement;
  // The premise of every number below: the column is the width asked for.
  expect(column.getBoundingClientRect().width).toBeCloseTo(width, 1);
  return { band, column, rhythm: rhythmOf(band) };
};

/** What the band draws, read from the engine: the opener's two font sizes,
 *  the rows' words', the first disc's box and its glyph's, and the map tray. */
const sizesOf = (band: HTMLElement) => {
  const disc = band.querySelector('span[aria-hidden="true"]') as HTMLElement;
  const glyph = disc.querySelector('svg') as SVGElement;
  const tray = (band.querySelector('iframe') as HTMLElement)
    .parentElement as HTMLElement;
  const fontSize = (el: Element): number =>
    parseFloat(getComputedStyle(el).fontSize);
  return {
    title: fontSize(within(band).getByRole('heading', { level: 2 })),
    eyebrow: fontSize(within(band).getByText(ro.home.location.eyebrow)),
    words: fontSize(within(band).getByText(ADDRESS)),
    disc: disc.getBoundingClientRect(),
    glyph: glyph.getBoundingClientRect(),
    tray: tray.getBoundingClientRect(),
  };
};

describe('ClinicLocation — THE BAND SCALE, computed (§15.32 — the real stylesheet)', () => {
  beforeAll(() => {
    // THE PREMISE: this runner is a place where the regime CAN apply — a fine
    // primary pointer and an engine that registers custom properties, the two
    // conditions of globals.css's THE SCALABLE VARIANT — at the 16px root
    // CAP is written at. Otherwise every case below that expects the scale
    // would fail for a reason that reads as the band's, and every case that
    // expects none would pass for the wrong one.
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine passes the registration gate (relative colour syntax)',
    ).toBe(true);
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the default 16px root (CAP is spelled at it)',
    ).toBe(16);
  });

  it.each([
    {
      where: 'the doctor page’s band (no `scaled`) at a laptop’s column',
      width: 1382.5,
      scaled: false,
    },
    {
      where: 'Home’s band (`scaled`) below the step',
      width: 600,
      scaled: true,
    },
  ])(
    'declares NOTHING for $where — the theme’s sizes, the 44px disc with its 20px glyph',
    ({ width, scaled }) => {
      const { band, rhythm } = renderColumn(width, scaled);
      // The registered property's initial value: nothing declared it.
      expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      expect(rhythm.getBoundingClientRect().width).toBeCloseTo(width, 1);
      const sizes = sizesOf(band);
      expect(sizes.title).toBe(36);
      expect(sizes.eyebrow).toBe(14);
      expect(sizes.words).toBe(16);
      // DISC_SIZE at the theme's 0.25rem step: 11 × 4px = 2.75rem, the atom's
      // own fallback to the pixel — what every page drew before 2026-10-02.
      expect(sizes.disc.width).toBe(44);
      expect(sizes.disc.height).toBe(44);
      expect(sizes.glyph.width).toBeCloseTo(20, 2);
      expect(sizes.glyph.height).toBeCloseTo(20, 2);
      expect(sizes.tray.height).toBeCloseTo(sizes.tray.width / 2, 1);
    },
  );

  it.each([
    { where: 'a column of 1.25 references', width: 1382.5 },
    { where: 'a column past the cap', width: 2000 },
  ])(
    'draws the WHOLE band in the design pixel at $where — opener, words, discs, map, and the cap’s centring',
    ({ width }) => {
      const { band, column, rhythm } = renderColumn(width, true);
      const outer = column.getBoundingClientRect();
      const s = Math.min(outer.width, CAP) / REFERENCE;

      expect(
        parseFloat(getComputedStyle(rhythm).getPropertyValue('--scale-px')),
      ).toBeCloseTo(s, 4);
      // bandColumnClasses: as wide as the column up to the cap, centred past it.
      const box = rhythm.getBoundingClientRect();
      expect(box.width).toBeCloseTo(Math.min(outer.width, CAP), 1);
      expect(box.left - outer.left).toBeCloseTo(
        (outer.width - box.width) / 2,
        1,
      );
      // Every length of the band, its reference × s — the discs among them,
      // which is what DISC_SIZE is for: without it they would stay 44px here.
      const sizes = sizesOf(band);
      expect(sizes.title).toBeCloseTo(36 * s, 1);
      expect(sizes.eyebrow).toBeCloseTo(14 * s, 1);
      expect(sizes.words).toBeCloseTo(16 * s, 1);
      expect(sizes.disc.width).toBeCloseTo(44 * s, 1);
      expect(sizes.disc.height).toBeCloseTo(44 * s, 1);
      expect(sizes.glyph.width).toBeCloseTo(20 * s, 1);
      expect(sizes.tray.height).toBeCloseTo(sizes.tray.width / 2, 1);
    },
  );
});

// ── THE PHONE'S MAP, COMPUTED (2026-10-09, §15.34) ──────────────────────────
// The owner: "i need map on phone to be like 50% taller. it is too small."
// Under the band's `@lg` step — 32rem of ui/Container's box, D7's phone
// layout — the tray is 4:3, and from the step up it is the 2:1 it always was
// (the component header's OLD → NEW, item 4). Measured on the real
// stylesheet through `renderColumn` above, at columns a phone hands the band
// — on develop a6b072f, measured 2026-10-09, a 320 phone's was 256px, a
// 390's 312 and a 430's 344, and a 768 tablet's 614.4; a phone's column moves
// with ui/Container's gutter, the ratio does not — and on both sides of the
// step itself. The band asked to scale (Home's and Team's) is the same band
// here: the regime starts far above a phone's column.

/** The `@lg` step in px at this runner's root — a container query's rem is
 *  the root's, so the step follows the user's font size like any rem. */
const lgStep = (): number =>
  32 * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The map tray's box — the iframe's parent, the element that wears the
 *  ratio. */
const trayOf = (band: HTMLElement): DOMRect =>
  (
    (band.querySelector('iframe') as HTMLElement).parentElement as HTMLElement
  ).getBoundingClientRect();

describe('ClinicLocation — the phone’s map, computed (§15.34 — the real stylesheet)', () => {
  it.each([
    { where: 'a 256px column', width: 256, scaled: false },
    { where: 'a 312px column', width: 312, scaled: false },
    { where: 'a 312px column, Home’s band', width: 312, scaled: true },
    { where: 'a 344px column', width: 344, scaled: false },
    { where: 'the last whole pixel under the step', width: 511, scaled: false },
  ])(
    'draws the map 4:3 on $where — the column’s full width, three quarters of it tall',
    ({ width, scaled }) => {
      expect(width).toBeLessThan(lgStep());
      const tray = trayOf(renderColumn(width, scaled).band);

      expect(tray.width).toBeCloseTo(width, 1);
      expect(tray.height).toBeCloseTo((width * 3) / 4, 1);
      // The owner's "50% taller": half again the 2:1 box this width had.
      expect(tray.height / (width / 2)).toBeCloseTo(1.5, 2);
    },
  );

  it.each([
    { where: 'the step itself', width: 512 },
    { where: 'a 768 tablet’s column', width: 614.4 },
  ])(
    'keeps the 2:1 map from the `@lg` step up — $where, untouched',
    ({ width }) => {
      expect(width).toBeGreaterThanOrEqual(lgStep());
      const tray = trayOf(renderColumn(width, false).band);

      expect(tray.width).toBeCloseTo(width, 1);
      expect(tray.height).toBeCloseTo(width / 2, 1);
    },
  );
});
