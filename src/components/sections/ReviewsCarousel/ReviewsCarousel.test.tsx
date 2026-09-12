import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { locales, type Locale } from '@/i18n/locales';
import type { Review } from '@/lib/reviews/reviews';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import {
  ReviewsCarousel,
  REVIEWS_FIRST_DWELL_MS,
  REVIEWS_INTERVAL_MS,
} from './ReviewsCarousel';
import source from './ReviewsCarousel.tsx?raw';

// sections/ReviewsCarousel — the BAND's suite: the half of this section that
// runs on the server. What it has to prove is the seam — that every string the
// island needs arrives FINISHED and correct for the page's language, that the
// list decides whether the band exists at all, and that no client directive
// ever creeps into this file. The island's own manners live in
// ReviewsDeck.test.tsx.
//
// Role-based queries (§9, §13), Romanian diacritics in the fixtures (§15.7),
// and every user-facing string read from the REAL message files — a renamed or
// dropped key fails HERE as well as in the translation-parity gate, instead of
// silently rendering the dotted key path (which is what next-intl does).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the contract here — the convention
// every component test in this repo follows.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/**
 * DEMO reviews — fabricated copy in the shape lib/reviews declares, and never
 * the site's data (board D15: the real list ships EMPTY until the owner
 * supplies reviews with consent and the CMSR check). The `reviews` prop is the
 * story/test seam D18 opened precisely so no test has to reach into the
 * shipped data — or, worse, put demo copy into it.
 */
const DEMO: readonly Review[] = [
  {
    id: 'ana-petrescu',
    name: 'Ana Petrescu',
    initials: 'AP',
    rating: 4.5,
    picture: { src: '/images/reviews/ana-petrescu.jpg' },
    words: {
      ro: {
        title: 'Copiii îmi cer să mergem',
        text: 'Doi copii, zero crize. Camera pediatrică face fiecare vizită o aventură.',
        procedure: 'Pacient familie',
      },
      en: {
        title: 'My kids actually ask to go',
        text: 'Two children, zero tantrums. The pediatric room makes every visit an adventure.',
        procedure: 'Family patient',
      },
      de: {
        title: 'Meine Kinder wollen sogar hin',
        text: 'Zwei Kinder, kein Theater. Das Kinderzimmer macht jeden Besuch zum Abenteuer.',
        procedure: 'Familienbehandlung',
      },
      fr: {
        title: 'Mes enfants demandent à y aller',
        text: 'Deux enfants, aucune crise. La salle pédiatrique fait de chaque visite une aventure.',
        procedure: 'Patient famille',
      },
      it: {
        title: 'I bambini chiedono di andarci',
        text: 'Due bambini, zero capricci. La sala pediatrica rende ogni visita un’avventura.',
        procedure: 'Paziente famiglia',
      },
    },
  },
  {
    id: 'cristian-voicu',
    name: 'Cristian Voicu',
    initials: 'CV',
    rating: 5,
    words: {
      ro: {
        title: 'Au văzut imaginea de ansamblu',
        text: 'Alte clinici mi-au dat un preț. Premium Smile mi-a dat un plan.',
        procedure: 'Plan complet',
      },
      en: {
        title: 'They saw the whole picture',
        text: 'Other clinics gave me a price. Premium Smile gave me a plan.',
        procedure: 'Full mouth plan',
      },
      de: {
        title: 'Sie haben das Ganze gesehen',
        text: 'Andere Praxen nannten mir einen Preis. Premium Smile gab mir einen Plan.',
        procedure: 'Gesamtbehandlungsplan',
      },
      fr: {
        title: 'Ils ont vu l’ensemble',
        text: 'D’autres cliniques m’ont donné un prix. Premium Smile m’a donné un plan.',
        procedure: 'Plan complet',
      },
      it: {
        title: 'Hanno visto tutto l’insieme',
        text: 'Altre cliniche mi hanno dato un prezzo. Premium Smile mi ha dato un piano.',
        procedure: 'Piano completo',
      },
    },
  },
  {
    id: 'stefan-radu',
    name: 'Ștefan Radu',
    initials: 'ȘR',
    rating: 3.5,
    words: {
      ro: {
        title: 'Rapid, lin, prietenos',
        text: 'Toate cele patru măsele de minte într-o dimineață, cu instrucțiuni clare.',
        procedure: 'Măsele de minte',
      },
      en: {
        title: 'Smooth, swift, friendly',
        text: 'All four wisdom teeth in one morning, with clear instructions.',
        procedure: 'Wisdom teeth',
      },
      de: {
        title: 'Schnell, ruhig, freundlich',
        text: 'Alle vier Weisheitszähne an einem Vormittag, mit klaren Anweisungen.',
        procedure: 'Weisheitszähne',
      },
      fr: {
        title: 'Rapide, calme, aimable',
        text: 'Les quatre dents de sagesse en une matinée, avec des consignes claires.',
        procedure: 'Dents de sagesse',
      },
      it: {
        title: 'Rapido, calmo, gentile',
        text: 'Tutti e quattro i denti del giudizio in una mattina, con istruzioni chiare.',
        procedure: 'Denti del giudizio',
      },
    },
  },
];

/** The provider the band gets in production (app/[locale]/layout.tsx wraps the
 *  whole tree) and in Storybook (.storybook/preview.tsx decorator), so the
 *  tests mount it the same way. ReviewsCarousel is NOT a client component;
 *  useTranslations and useLocale are isomorphic and read this context. */
const Mounted = ({
  locale,
  reviews,
}: {
  locale: Locale;
  reviews?: readonly Review[];
}): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ReviewsCarousel reviews={reviews} />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro', reviews: readonly Review[] = DEMO) => {
  const utils = render(<Mounted locale={locale} reviews={reviews} />);
  const messages = MESSAGES[locale].home.reviews;
  return {
    ...utils,
    messages,
    locale,
    // Named by its own <h2> through aria-labelledby, which is what makes a
    // <section> a `region` in the accessibility tree at all.
    band: () => screen.getByRole('region', { name: messages.title }),
    deck: () => screen.getByRole('region', { name: messages.region }),
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

/** The band's source with its PROSE removed (the Wordmark mechanism), so the
 *  directive guard polices the code and not this file's own documentation. */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('ReviewsCarousel — no reviews, no band', () => {
  it('renders NOTHING for an empty list (owner D15)', () => {
    // A heading over an empty deck is worse than no band at all — and the
    // shipped list IS empty today, which is why this is the default answer
    // rather than an edge case.
    const { container } = render(<Mounted locale="ro" reviews={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('defaults to the site list, which ships empty until the owner fills it', () => {
    // No `reviews` prop: the band reads lib/reviews. The day that list has
    // rows this test states what the band will do with them.
    const { container } = render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ReviewsCarousel />
      </NextIntlClientProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ReviewsCarousel — the band shell', () => {
  it('wears the sideways-scroll belt with its legacy twin, and never a bare hidden (G3 react M1)', () => {
    // `clip` for engines that know it; `hidden` only behind a `@supports not`
    // gate for Safari ≤ 15. A bare `overflow-x-hidden` would be emitted after
    // `clip` in the sheet, win everywhere, and make the band a scroll
    // container.
    const { band } = mount();
    const tokens = band().className.split(/\s+/);

    expect(tokens).toContain('overflow-x-clip');
    expect(tokens).toContain(
      'supports-[not_(overflow:clip)]:overflow-x-hidden',
    );
    expect(tokens).not.toContain('overflow-x-hidden');
    expect(tokens).toContain('bg-page');
  });

  it('is a real <section>, named by its own <h2>, with no role bolted on', () => {
    const { band, messages } = mount();

    expect(band().tagName).toBe('SECTION');
    expect(band()).not.toHaveAttribute('role');
    expect(band()).toHaveAttribute('aria-labelledby', 'reviews-heading');

    const heading = screen.getByRole('heading', {
      level: 2,
      name: messages.title,
    });
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('id', 'reviews-heading');
  });

  it('opens with the eyebrow over the title, through sections/SectionHeading', () => {
    const { band, messages } = mount();

    expect(within(band()).getByText(messages.eyebrow).tagName).toBe('P');
    expect(band().textContent).toContain(messages.title);
  });

  it('carries NO outer margin — the page owns the rhythm around it (§6.4)', () => {
    const { band } = mount();
    const margins = classesOf(band()).filter((c) => /^-?m[trblxye]?-/.test(c));

    expect(margins).toEqual([]);
  });

  it('gives the band its own vertical rhythm one level in (the rhythm box)', () => {
    // An element cannot query its OWN size: ui/Container IS the container, so
    // the stepped `py` sits on a child of it (the ClinicLocation D7 precedent).
    const { band } = mount();
    const container = band().firstElementChild as HTMLElement;
    const rhythm = container.firstElementChild as HTMLElement;

    expect(classesOf(container)).toContain('@container');
    expect(classesOf(rhythm)).toEqual([
      'flex',
      'flex-col',
      'gap-8',
      'py-12',
      '@lg:py-16',
      '@3xl:py-20',
    ]);
  });

  it('nests the deck’s own named region inside the band’s', () => {
    // Two named regions, both legitimate: the band is the page's landmark, the
    // deck is the APG's carousel container.
    const { band, deck } = mount();

    expect(band().contains(deck())).toBe(true);
    expect(deck()).toHaveAttribute(
      'aria-roledescription',
      ro.common.carousel.role,
    );
  });
});

describe('ReviewsCarousel — the strings the island is handed', () => {
  it('hands one finished slide per review, named by the ICU index string', () => {
    const { deck } = mount();
    const names = [...deck().querySelectorAll('[role="group"]')].map((slide) =>
      slide.getAttribute('aria-label'),
    );

    expect(names).toEqual(
      DEMO.map((_, index) =>
        fill(ro.home.reviews.slide, {
          index: String(index + 1),
          total: String(DEMO.length),
        }),
      ),
    );
    // …and the message really does read the way a Romanian ear expects, so a
    // reordered ICU argument fails here and not in front of a patient.
    expect(names[0]).toBe('Recenzia 1 din 3');
  });

  it('formats the rating through ICU, comma decimal and all (§8.3)', () => {
    // `{rating, number}` is what turns 4.5 into „4,5" in ro and "4.5" in en.
    // The section never formats by hand, and the card never sees the number.
    mount();

    expect(
      screen.getByRole('img', { name: '4,5 din 5 stele', hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '3,5 din 5 stele', hidden: true }),
    ).toBeInTheDocument();
  });

  it('formats the same rating the English way under `en`', () => {
    mount('en');

    expect(
      screen.getByRole('img', { name: '4.5 out of 5 stars', hidden: true }),
    ).toBeInTheDocument();
  });

  it('picks the review’s words for the PAGE locale, never the default', () => {
    const german = DEMO[0].words.de;
    const { band } = mount('de');

    expect(band().textContent).toContain(german.title);
    expect(band().textContent).toContain(german.text);
    expect(band().textContent).toContain(german.procedure);
    expect(band().textContent).not.toContain(DEMO[0].words.ro.title);
    // …while the name, a proper noun, is locale-invariant.
    expect(band().textContent).toContain(DEMO[0].name);
  });

  it('translates its own chrome per locale, in all five languages', () => {
    for (const locale of locales) {
      const { unmount } = render(<Mounted locale={locale} reviews={DEMO} />);
      const messages = MESSAGES[locale].home.reviews;

      expect(
        screen.getByRole('region', { name: messages.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: messages.previous }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: messages.next }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('passes a DECORATIVE picture — alt is empty, the name is printed', () => {
    // Read synchronously, before the (inevitable, in this project) 404 lets
    // ui/Avatar swap to its letters face: no width variants exist under
    // `npm run test`, so the <img> is only in the DOM for this instant. The
    // alt is the assertion — a named portrait would announce the reviewer
    // twice, since the card prints the name two lines below.
    const { container } = render(<Mounted locale="ro" reviews={DEMO} />);
    const picture = container.querySelector('img');

    expect(picture).not.toBeNull();
    expect(picture).toHaveAttribute('alt', '');
  });

  it('never leaks a message key path or an unfilled placeholder', () => {
    // next-intl does not throw on a miss — it renders "home.reviews.title" and
    // logs. This is the assertion that turns that into a failure.
    const { band } = mount();
    const text = band().textContent ?? '';

    expect(text).not.toMatch(/home\.reviews\.|common\.carousel\./);
    expect(text).not.toMatch(/\{(index|total|rating)\}/);
    for (const label of band().querySelectorAll('[aria-label]')) {
      expect(label.getAttribute('aria-label')).not.toMatch(
        /home\.reviews\.|common\.carousel\.|\{(index|total|rating)\}/,
      );
    }
  });
});

describe('ReviewsCarousel — the rhythm is the dossier’s, and it is stated here', () => {
  it('exports the two numbers the deck runs on (owner D11, round 2)', () => {
    // Recomputed against the WHOLE card after the G2 a11y round (41 words →
    // ~16.4 s at 150 wpm, §9), then slowed on the owner's own eye at pack
    // round 2 ("the iteration is too fast" at 16 s): thirty seconds allows a
    // slower reader and the seconds spent finding the card before reading;
    // the first dwell adds the journey down from the heading.
    expect(REVIEWS_INTERVAL_MS).toBe(30_000);
    expect(REVIEWS_FIRST_DWELL_MS).toBe(34_000);
  });

  it('hands both of them to the island, and nothing else timing-related', () => {
    // The band is the only place these numbers exist: lib/clock requires
    // `intervalMs` per consumer precisely so a site-wide default cannot be
    // smuggled into the ring.
    expect(CODE).toContain('intervalMs={REVIEWS_INTERVAL_MS}');
    expect(CODE).toContain('startDelayMs={REVIEWS_FIRST_DWELL_MS}');
  });
});

describe('ReviewsCarousel — a server band, and it stays one', () => {
  it('ships NO client directive: only the deck crosses into the browser (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts). Anchored to a line of its OWN, because that
    // is what a directive is, and tolerant of a trailing comment.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    // …and the reasons it can stay that way: no state, no effect, no handler.
    // t() stays — next-intl's useTranslations is isomorphic (the ClinicLocation
    // and Footer precedent).
    expect(CODE).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('hands the island only serializable props — no function crosses', () => {
    // A function cannot cross a server→client boundary, which is why the slide
    // LABELS are pre-rendered strings rather than a formatter. The guard is
    // structural: no arrow and no `t` inside the <ReviewsDeck …> element.
    const element = CODE.slice(
      CODE.indexOf('<ReviewsDeck'),
      CODE.indexOf('</Container>'),
    );

    expect(element).not.toContain('=>');
    expect(element).not.toMatch(/=\{t\b|=\{tc\b/);
  });
});
