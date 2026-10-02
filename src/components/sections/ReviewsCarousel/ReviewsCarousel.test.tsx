import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { locales, type Locale } from '@/i18n/locales';
import {
  reviews as siteReviews,
  type Review,
  type ReviewWords,
} from '@/lib/reviews/reviews';
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
import { REVIEWS_NOW } from './ReviewsCarousel.fixtures';
import source from './ReviewsCarousel.tsx?raw';
import deckSource from './ReviewsDeck.tsx?raw';

// sections/ReviewsCarousel — the BAND's suite: the half of this section that
// runs on the server. What it has to prove is the seam — that every string the
// island needs arrives FINISHED and correct for the page's language (the
// "how long ago" phrase included, measured from the band's `now`), that the
// list decides whether the band exists at all, that the story clock stays in
// the workbench, that no client directive ever creeps into this file — and,
// since 2026-10-02 (CLAUDE.md §15.32), that ui/Container's band scale rides
// the opener box alone and never reaches the deck. The island's own manners
// live in ReviewsDeck.test.tsx.
//
// Role-based queries (§9, §13), the clinic's own Romanian reviews with their
// diacritics (§15.7), and every user-facing string read from the REAL message
// files — a renamed or dropped key fails HERE as well as in the
// translation-parity gate, instead of silently rendering the dotted key path
// (which is what next-intl does).
//
// ── THE REAL LIST, AND PLACEHOLDERS THAT ARE PLAINLY NOT REVIEWS (owner,
// 2026-10-01: "all fabricated ones need to be dropped"). Where a test asserts
// what the band does with CONTENT it renders lib/reviews' own rows, chosen by
// POSITION or by PROPERTY — never by id — and compares against each row's own
// fields rather than a copied literal, so an edit to the list cannot break it.
// Where a test needs a shape the real list cannot give — a controlled day, a
// half-star rating — it builds a `placeholder` whose words say what it is.
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so the utility TOKENS are the contract here — the convention
// every component test in this repo follows.

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/**
 * The REAL list by POSITION: the whole of it, or its first `count` rows — with
 * a clear failure, never a quietly shorter band, when lib/reviews holds fewer
 * than the test needs (the whole list needs two: a deck).
 */
const real = (count?: number): readonly Review[] => {
  const needed = count ?? 2;
  if (siteReviews.length < needed)
    throw new Error(
      `This test needs ${needed} real reviews; lib/reviews holds ${siteReviews.length}.`,
    );
  return siteReviews.slice(0, count);
};

/** Words that say what they are, in all five languages. */
const PLACEHOLDER_WORDS: ReviewWords = {
  title: 'Titlu test',
  text: 'Text test.',
};

/**
 * A row that is plainly NOT a review — for the shapes the real list cannot
 * give. Only the id varies unless a test says otherwise, because the deck keys
 * its slides by id.
 */
const placeholder = (id: string, row: Partial<Review> = {}): Review => ({
  id,
  name: 'Nume test',
  initials: 'NT',
  rating: 5,
  postedOn: '2024-09-30',
  words: {
    ro: PLACEHOLDER_WORDS,
    en: PLACEHOLDER_WORDS,
    de: PLACEHOLDER_WORDS,
    fr: PLACEHOLDER_WORDS,
    it: PLACEHOLDER_WORDS,
  },
  ...row,
});

/** The provider the band gets in production (app/[locale]/layout.tsx wraps the
 *  whole tree) and in Storybook (.storybook/preview.tsx decorator), so the
 *  tests mount it the same way. ReviewsCarousel is NOT a client component;
 *  useTranslations and useLocale are isomorphic and read this context. The
 *  clock is PINNED to the folder's REVIEWS_NOW unless a test says otherwise —
 *  the stories' rule, so no assertion here drifts with the calendar, and
 *  tests/unit/reviews-data.test.ts holds every real day at or before it, so a
 *  real row can never make the pinned clock throw. */
const Mounted = ({
  locale,
  reviews,
  now = REVIEWS_NOW,
}: {
  locale: Locale;
  reviews?: readonly Review[];
  now?: Date;
}): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ReviewsCarousel reviews={reviews} now={now} />
  </NextIntlClientProvider>
);

const mount = (locale: Locale = 'ro', reviews: readonly Review[] = real()) => {
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

/** A class string's tokens, the way an element's class attribute holds them. */
const tokensOf = (classes: string): string[] =>
  classes.split(/\s+/).filter(Boolean);

/**
 * The band scale's OWN classes — every token of ui/Container's two strings
 * that rides the `scalable:` variant: the cap, the design pixel, the remap.
 * Read off the strings themselves, so a re-spelled string moves the tests with
 * it; `mx-auto` and `w-full` are ordinary layout any box may wear.
 */
const SCALE_TOKENS: readonly string[] = [
  ...tokensOf(bandColumnClasses),
  ...tokensOf(bandScaleClasses),
].filter((token) => token.startsWith('scalable:'));

/** The rhythm box: the band's first box inside ui/Container (THE BAND SHELL). */
const rhythmOf = (band: HTMLElement): HTMLElement => {
  const rhythm = band.firstElementChild?.firstElementChild;
  if (!(rhythm instanceof HTMLElement))
    throw new Error('ReviewsCarousel test: the band lost its rhythm box.');
  return rhythm;
};

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
    // A heading over an empty deck is worse than no band at all — whether the
    // empty list is one a caller passes or the site's own.
    const { container } = render(<Mounted locale="ro" reviews={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('defaults to the site list ALONE — exactly lib/reviews, and nothing while it is empty', () => {
    // No `reviews` and no `now`: the page mount's own shape
    // (app/[locale]/(home)/page.tsx), so "how long ago" is measured from the
    // real clock — the one test here that leaves REVIEWS_NOW out, because the
    // default `now` is what it is about (tests/unit/reviews-data.test.ts holds
    // every real day at or before REVIEWS_NOW, so today can never be earlier
    // than a real review). Written to hold in BOTH states of the list: the
    // 2026-09-20 demo fallback is retired (2026-09-30), so an empty site list
    // means no band at all, and a full one means ITS rows — every title, in
    // the list's own order, and nothing else.
    const { container } = render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ReviewsCarousel />
      </NextIntlClientProvider>,
    );

    if (siteReviews.length === 0) {
      expect(container).toBeEmptyDOMElement();
      return;
    }
    const band = screen.getByRole('region', { name: ro.home.reviews.title });
    expect(
      [...band.querySelectorAll('article h3')].map(
        (title) => title.textContent,
      ),
    ).toEqual(siteReviews.map((review) => review.words.ro.title));
    for (const review of siteReviews)
      expect(within(band).getAllByText(review.name).length).toBeGreaterThan(0);
  });
});

describe('ReviewsCarousel — how long ago, measured from `now` (lib/time-ago)', () => {
  it('prints „acum 2 ani" for a review posted on 2024-09-30, with the day as the machine-readable half', () => {
    // The band pre-renders the phrase (a formatter is a function and cannot
    // cross into the island); the card prints it inside `<time dateTime>`.
    const { band } = mount('ro', [
      placeholder('test-doi-ani', { postedOn: '2024-09-30' }),
    ]);
    const day = band().querySelector('time[datetime="2024-09-30"]');

    expect(day).not.toBeNull();
    expect(day).toHaveTextContent('acum 2 ani');
  });

  it('says it in the PAGE language — „vor 2 Jahren" under `de`', () => {
    const { band } = mount('de', [
      placeholder('test-doi-ani', { postedOn: '2024-09-30' }),
    ]);

    expect(
      band().querySelector('time[datetime="2024-09-30"]'),
    ).toHaveTextContent('vor 2 Jahren');
  });

  it('measures every review on its OWN day — one phrase per card, in the list’s order', () => {
    // Three placeholders three days, three months and two years before
    // REVIEWS_NOW: three different units, so a phrase computed once and
    // handed to every card, or handed to the wrong card, fails here.
    const rows = [
      placeholder('test-zile', { postedOn: '2026-09-27' }),
      placeholder('test-luni', { postedOn: '2026-06-14' }),
      placeholder('test-ani', { postedOn: '2024-09-30' }),
    ];
    const { band } = mount('ro', rows);
    const days = [...band().querySelectorAll('time')];

    expect(days.map((day) => day.getAttribute('datetime'))).toEqual(
      rows.map((review) => review.postedOn),
    );
    expect(days.map((day) => day.textContent)).toEqual([
      'acum 3 zile',
      'acum 3 luni',
      'acum 2 ani',
    ]);
  });

  it('measures from `now` and not from the machine’s clock: a year later the same row reads „acum 3 ani"', () => {
    // REVIEWS_NOW is a day this lane was built on, so the tests above could
    // not tell a pinned clock from the real one; a moved `now` can.
    render(
      <Mounted
        locale="ro"
        reviews={[placeholder('test-doi-ani', { postedOn: '2024-09-30' })]}
        now={new Date('2027-09-30T12:00:00Z')}
      />,
    );

    expect(
      document.querySelector('time[datetime="2024-09-30"]'),
    ).toHaveTextContent('acum 3 ani');
  });
});

describe('ReviewsCarousel — the story clock stays in the workbench', () => {
  it('neither runtime file imports a fixtures module, nor names the story clock (§15.19 round 3)', () => {
    // ReviewsCarousel.fixtures.ts is the stories' and the tests' pinned clock;
    // an import from the band or from its island would freeze "how long ago"
    // on the live site. Read through Vite's ?raw with the prose stripped, so
    // the headers may name the file while the CODE may not.
    for (const code of [CODE, stripComments(deckSource)]) {
      expect(code).not.toMatch(/\.fixtures\b/);
      expect(code).not.toMatch(/\bREVIEWS_NOW\b/);
    }
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

  it('gives the band its own vertical rhythm one level in — the BOTTOM step on the rhythm box', () => {
    // An element cannot query its OWN size: ui/Container IS the container, so
    // the stepped padding sits on a child of it (the ClinicLocation D7
    // precedent). RE-SPELLED 2026-10-02 (CLAUDE.md §15.32 — the band's THE
    // BAND SHELL): this box was `flex flex-col gap-8 py-12 @lg:py-16
    // @3xl:py-20`. The opener's scale took the TOP step and the 32px gap into
    // the opener box (pinned in the next describe, as its `pt-*` and `pb-8`);
    // the BOTTOM step stays here, under the deck, which never scales. Below
    // the regime the two boxes lay out exactly as the one did.
    const { band } = mount();
    const container = band().firstElementChild as HTMLElement;
    const rhythm = rhythmOf(band());

    expect(classesOf(container)).toContain('@container');
    expect(classesOf(rhythm)).toEqual([
      'flex',
      'flex-col',
      'pb-12',
      '@lg:pb-16',
      '@3xl:pb-20',
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

describe('ReviewsCarousel — the opener scales, the deck does not (§15.32)', () => {
  // ui/Container's THE BAND SCALE on the OPENER box alone (the band's header,
  // THE OPENER'S SCALE). No stylesheet is loaded in this project, so these
  // tests pin WHERE the two strings ride; the stories measure what they do in
  // a real browser — the eyebrow 14 × s and the h2 36 × s on a laptop, the
  // deck's body text still the theme's 16px.

  it('wraps the opener — and only the opener — in a box wearing both of ui/Container’s band-scale strings', () => {
    const { band, messages } = mount();
    const opener = rhythmOf(band()).firstElementChild as HTMLElement;

    // The band's top step, the old 32px gap as the box's own bottom padding,
    // then the two strings WHOLE and in their order — read off ui/Container,
    // never re-spelled here, so the pin follows the one definition.
    expect(classesOf(opener)).toEqual([
      'pt-12',
      'pb-8',
      '@lg:pt-16',
      '@3xl:pt-20',
      ...tokensOf(bandColumnClasses),
      ...tokensOf(bandScaleClasses),
    ]);
    // …holding the eyebrow over the h2 through sections/SectionHeading, and
    // nothing else: one child, and no region inside it.
    expect(opener.children).toHaveLength(1);
    expect(
      within(opener).getByRole('heading', { level: 2, name: messages.title }),
    ).toHaveAttribute('id', 'reviews-heading');
    expect(within(opener).getByText(messages.eyebrow).tagName).toBe('P');
    expect(within(opener).queryByRole('region')).toBeNull();
  });

  it('keeps the deck OUTSIDE the scale — no box from the deck up to the band, and none inside it, wears a band-scale class', () => {
    // The owner, verbatim: "the reviews carrousell which you will not touch
    // under any circumstance". The deck is the rhythm box's SECOND child — the
    // opener box's sibling, never its child — so it inherits no design pixel
    // at any width. The opener's own wear is asserted first, so the empty
    // lists below cannot pass on an empty SCALE_TOKENS.
    const { band, deck } = mount();
    const rhythm = rhythmOf(band());
    const opener = rhythm.firstElementChild as HTMLElement;
    const wearsScale = (element: Element): boolean =>
      classesOf(element).some((token) => SCALE_TOKENS.includes(token));

    expect(wearsScale(opener)).toBe(true);
    expect([...rhythm.children]).toEqual([opener, deck()]);
    expect(opener.contains(deck())).toBe(false);

    // Every box from the deck's own <section> up to the band's, inclusive.
    const ancestry: Element[] = [];
    for (
      let element: Element | null = deck();
      element !== null;
      element = element.parentElement
    ) {
      ancestry.push(element);
      if (element === band()) break;
    }
    expect(ancestry.at(-1)).toBe(band());
    expect(ancestry.filter(wearsScale)).toEqual([]);
    // …and nothing the deck renders, down to the last word on a card.
    expect([...deck().querySelectorAll('*')].filter(wearsScale)).toEqual([]);
  });

  it('hands the deck the same four props as before — no class and no style that could carry the scale into it', () => {
    // Pinned by NAME and in order from the source, with the prose stripped: a
    // `className` or a `style` on <ReviewsDeck> would be a road for the design
    // pixel into the deck the owner put out of reach.
    const start = CODE.indexOf('<ReviewsDeck');
    const element = CODE.slice(start, CODE.indexOf('/>', start));

    expect(start).toBeGreaterThan(-1);
    // EVERY attribute form — `name={…}`, `name="…"`, `name='…'` (the Opus
    // review: a `className="…"` string slipped past a `={`-only reader) —
    // and no spread, which could carry anything.
    expect(
      [...element.matchAll(/([\w-]+)=["'{]/g)].map(([, name]) => name),
    ).toEqual(['slides', 'labels', 'intervalMs', 'startDelayMs']);
    expect(element).not.toMatch(/\{\s*\.\.\./);
  });
});

describe('ReviewsCarousel — the strings the island is handed', () => {
  it('hands one finished slide per review, named by the ICU index string', () => {
    const rows = real(3);
    const { deck } = mount('ro', rows);
    const names = [...deck().querySelectorAll('[role="group"]')].map((slide) =>
      slide.getAttribute('aria-label'),
    );

    expect(names).toEqual(
      rows.map((_, index) =>
        fill(ro.home.reviews.slide, {
          index: String(index + 1),
          total: String(rows.length),
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
    // Placeholders, because every real review so far gives five whole stars.
    mount('ro', [
      placeholder('test-patru-si-jumatate', { rating: 4.5 }),
      placeholder('test-trei-si-jumatate', { rating: 3.5 }),
    ]);

    expect(
      screen.getByRole('img', { name: '4,5 din 5 stele', hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '3,5 din 5 stele', hidden: true }),
    ).toBeInTheDocument();
  });

  it('formats the same rating the English way under `en`', () => {
    mount('en', [placeholder('test-patru-si-jumatate', { rating: 4.5 })]);

    expect(
      screen.getByRole('img', { name: '4.5 out of 5 stars', hidden: true }),
    ).toBeInTheDocument();
  });

  it('picks the review’s words for the PAGE locale, never the default', () => {
    // The first real review, by position; the negative check reads its
    // Romanian BODY, a sentence no German text of the list can contain.
    const [first] = real(1);
    const { band } = mount('de');

    expect(band().textContent).toContain(first.words.de.title);
    expect(band().textContent).toContain(first.words.de.text);
    expect(band().textContent).not.toContain(first.words.ro.text);
    // …while the name, a proper noun, is locale-invariant.
    expect(band().textContent).toContain(first.name);
  });

  it('translates its own chrome per locale, in all five languages', () => {
    for (const locale of locales) {
      const { unmount } = render(<Mounted locale={locale} reviews={real()} />);
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
    // The first real review that carries a portrait, found by PROPERTY — a
    // placeholder with a picture path only if the list ever holds none, so a
    // content change cannot break this test. Read synchronously: where the
    // optimizer's width variants are missing the <img> is in the DOM only
    // until ui/Avatar swaps to its letters face. The alt is the assertion — a
    // named portrait would announce the reviewer twice, since the card prints
    // the name two lines below.
    const withPicture =
      siteReviews.find((review) => review.picture) ??
      placeholder('test-portret', {
        picture: { src: '/images/reviews/test.jpg' },
      });
    const { container } = render(
      <Mounted locale="ro" reviews={[withPicture]} />,
    );
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
  it('exports the two numbers the deck runs on — the hero’s own since 2026-09-20', () => {
    // Round 2 of the reviews lane slowed the deck to 30 s / 34 s on the
    // owner's eye; the hero lane's round 6 ("why … are the reviews not
    // autoscrolling like … the slides") gave it the hero's 5.5 s and 1.5 s
    // first beat. The reading arithmetic is recorded in ReviewsCarousel.tsx.
    expect(REVIEWS_INTERVAL_MS).toBe(5_500);
    expect(REVIEWS_FIRST_DWELL_MS).toBe(1_500);
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
