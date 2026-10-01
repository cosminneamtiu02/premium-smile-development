import { useState, type ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { REVIEWS_NOW } from '@/components/sections/ReviewsCarousel/ReviewsCarousel.fixtures';
import { Button } from '@/components/ui/Button/Button';
import { locales, type Locale } from '@/i18n/locales';
import { reviews, type Review } from '@/lib/reviews/reviews';
import { formatTimeAgo } from '@/lib/time-ago/time-ago';
import { REVIEW_TONES, ReviewCard, type ReviewCardProps } from './ReviewCard';

// SIX stories, and the count is the honest one: the two looks the deck asks
// for, the flip between them, the letters face, the longest language, and the
// one frame that exists to photograph punctuation. The export NAMES are
// load-bearing — each names a baseline file (`sections-reviewcard--framed`,
// `sections-reviewcard--emphasized`, …) — so this list IS this section's
// contribution to the lane's visual manifest. `Sections/*` routes every one of
// them to 390 + 1536 (§13, tests/visual/stories.spec.ts). A seventh,
// HalfRating (3,5 stars), went on 2026-10-01 with the fabricated reviews it
// was drawn from: no real review carries a half star, and ui/StarRating's own
// Halves story draws all eleven values — the one place halves are the subject.
//
// ── THE REVIEWS ARE REAL (owner 2026-10-01: "all fabricated ones need to be
// dropped"). Every story renders a row of lib/reviews — the clinic's own
// Google reviews — mapped to the card's props the way the band maps them
// (`toCard` below), its date line built by lib/time-ago against REVIEWS_NOW,
// the real list's pinned clock, so no baseline ages with the calendar. Rows
// are chosen by PROPERTY — the first with a photograph, the first with two
// letters, the longest German body, the shortest body — never by id, so the
// list can gain, lose or reorder reviews without breaking a story; a list that
// loses a property altogether fails at `pick`, naming it. Nothing invented
// remains: no name, no sentence. The owner's gates on the real list (the
// patients' consent, the CMSR check) are lib/reviews' header, not this file's.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`, even though
// this section reads no message file (its strings are props, §8.1 — the band
// owns the keys). The pin is load-bearing twice over here: the preview
// decorator stamps `<html lang>` from that global, and BOTH of this card's
// language-conditional CSS behaviours read that attribute — `hyphens: auto`
// picks its dictionary from it (§15.14), and `quotes: auto` picks the quote
// marks the body's generated content resolves to (ledger D6). A story without
// the pin would photograph whatever the toolbar was last left on, and the
// visual runner — which opens each story by URL with no toolbar state at all —
// would silently record the default.
//
// ── VIEWPORTS ARE PINNED ONLY WHERE WIDTH IS THE SUBJECT (Framed → laptop,
// GermanStress → smartphone), unlike Header/Footer/ClinicLocation: this card
// has no container query and no media query at all — it fills whatever column
// it is given and wraps where the text runs out of room — so the two widths
// the title prefix already routes it to ARE the story, and the workbench keeps
// its toolbar everywhere else.
//
// ── THE DECORATOR IS THE DECK'S SLIDE, not a frame. The card owns NO width
// (ui/Card's D3: the parent measures it) and no margin (§6.4), so on a bare
// 1536px canvas it would photograph as a single line of text across the whole
// viewport — a shape no deck produces. `mx-auto max-w-sm` is the slide track
// the carousel will hand it, which is also what makes the 390 frame honest.
//
// ── WHAT THE PLAY FUNCTIONS ARE FOR: the facts a picture cannot show — that
// the card is an `article` NAMED by its own title, that the title is a real
// `h3`, that the stars carry the band's finished sentence, that the date line
// is a `<time>` carrying its day in `dateTime`, that the body is justified by
// the real stylesheet, and that the quote marks are GENERATED rather than
// typed (the body element's computed `::before`/`::after` content, which is
// the only place that difference is observable in code). Every expectation is
// read from the story's own `args` — the row as mapped — never from a copied
// literal, and the body is found by its place in the card, since a real
// review's words are no fixed string to query. What no play function may
// assert is the PHOTOGRAPH: under `npm run test` the optimizer's width
// variants do not exist yet, so every <img> 404s and ui/Avatar swaps to its
// letters face — a real fallback, firing exactly as designed, and the reason
// the picture is a subject for the baselines (built by
// `npm run build-storybook`, which generates them) rather than for an
// assertion here.

/**
 * `home.reviews.rating` as the band prints it — the message files' own
 * sentence per language, „{rating, number} din 5 stele" and its four
 * siblings, the number through Intl as ICU's `number` argument prints it
 * (§8.1, §8.3). Copied here as FINISHED words because this card reads no
 * message file; the band is where the sentence lives.
 */
const RATING_SENTENCE: Readonly<Record<Locale, (value: string) => string>> = {
  ro: (value) => `${value} din 5 stele`,
  en: (value) => `${value} out of 5 stars`,
  de: (value) => `${value} von 5 Sternen`,
  fr: (value) => `${value} étoiles sur 5`,
  it: (value) => `${value} stelle su 5`,
};

/**
 * ONE REAL REVIEW as the band hands it to the card, in `locale`: every field
 * the row's own, the picture's alt empty as the deck passes it (the card
 * prints the name two lines below, so a named picture would announce the
 * person twice — ui/Avatar's D-A1), and the date line's phrase built by
 * lib/time-ago against REVIEWS_NOW. A row without a picture yields NO
 * `picture` key — not an explicit `undefined`, which Storybook's arg merge is
 * free to read as "not given" (see `meta.args`).
 */
function toCard(review: Review, locale: Locale): Omit<ReviewCardProps, 'tone'> {
  const { title, text } = review.words[locale];
  return {
    id: review.id,
    initials: review.initials,
    ...(review.picture
      ? { picture: { src: review.picture.src, alt: '' } }
      : {}),
    rating: review.rating,
    ratingLabel: RATING_SENTENCE[locale](
      new Intl.NumberFormat(locale).format(review.rating),
    ),
    title,
    body: text,
    name: review.name,
    postedOn: review.postedOn,
    postedAgo: formatTimeAgo(locale, review.postedOn, REVIEWS_NOW),
  };
}

/** The first real row with `what` — by PROPERTY, never by id (the header). */
function pick(what: string, test: (review: Review) => boolean): Review {
  const review = reviews.find(test);
  if (review === undefined) {
    throw new Error(`ReviewCard stories: lib/reviews has no review ${what}.`);
  }
  return review;
}

/** The real row that scores highest, the first of a tie — by PROPERTY too. */
function pickMost(what: string, score: (review: Review) => number): Review {
  const [first, ...rest] = reviews;
  if (first === undefined) {
    throw new Error(`ReviewCard stories: lib/reviews has no review ${what}.`);
  }
  return rest.reduce(
    (best, review) => (score(review) > score(best) ? review : best),
    first,
  );
}

/** A photograph in the disc — Framed and Emphasized, the same review twice. */
const WITH_PICTURE = pick(
  'with a picture',
  (review) => review.picture !== undefined,
);

/** Two letters in the disc — the default every story starts from. */
const WITH_LETTERS = pick(
  'without a picture',
  (review) => review.picture === undefined,
);

/** §8.4's stress: the longest German body in the list. */
const LONGEST_GERMAN = pickMost(
  'with a German body',
  (review) => review.words.de.text.length,
);

/** The punctuation frame's review: the shortest, so five cards stay about the marks. */
const SHORTEST = pickMost(
  'with a body',
  (review) => -review.words.ro.text.length,
);

/** §7/§9: nothing may require horizontal scrolling, at any sampled width. */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/** The quoted body's <p>, found by its place in the card, not by its words. */
const bodyOf = (root: ParentNode): HTMLElement => {
  const body = root.querySelector<HTMLElement>('blockquote > p');
  if (body === null) throw new Error('ReviewCard stories: no quoted body.');
  return body;
};

/**
 * The proof of ledger D6, and the only place it is visible to code: the marks
 * are GENERATED CONTENT resolved from `quotes: auto` against the declared
 * language, so the computed `content` is the KEYWORD (the engine's chosen
 * glyphs never enter the DOM) and the element's text is exactly the review's
 * own words, nothing typed around them. What each language actually paints —
 * ro „…” · de „…“ · fr «…» — is what the baselines photograph, which is why
 * QuoteMarksByLanguage exists.
 */
const expectGeneratedQuotes = async (
  body: HTMLElement,
  words: string,
): Promise<void> => {
  await expect(getComputedStyle(body, '::before').content).toBe('open-quote');
  await expect(getComputedStyle(body, '::after').content).toBe('close-quote');
  await expect(body.textContent).toBe(words);
};

const meta = {
  title: 'Sections/ReviewCard',
  component: ReviewCard,
  parameters: { layout: 'padded' },
  // The default is a review WITHOUT a photograph, on purpose: Storybook merges
  // a story's args over these, so a picture here would ride into every letters
  // frame that does not spell one out. A story that wants a photograph brings
  // its own row, picture included.
  args: { ...toCard(WITH_LETTERS, 'ro'), tone: 'framed' },
  argTypes: {
    tone: {
      control: 'inline-radio',
      // The section's own pair, not a re-typed copy: a renamed row reaches the
      // panel in the same edit (G3 org B3).
      options: [...REVIEW_TONES],
      description:
        'REQUIRED, no default — the deck decides per slide: `framed` is the idle card (the old site’s 3px lavender frame the owner kept, fb-423), `emphasized` the selected one. Both come from ui/Card’s one axis, whose sum rule (border + padding = 25px per side) is what lets the look change without moving a pixel of content',
    },
    id: {
      control: 'text',
      description:
        'The stable review id — the deck’s React key AND the seed of the `aria-labelledby` pair (`review-<id>-title`). Never the element’s `id` attribute: that one is Omitted from the props',
    },
    picture: {
      control: false,
      description:
        'Optional portrait under `public/images/` (§11). The path and its alt travel as ONE prop, so a picture without an alt cannot be spelled; the deck passes `alt=""` because the caption prints the name. Omit it and the disc shows the two capitals — see NoPicture',
    },
    initials: {
      control: 'text',
      description:
        'Exactly two capitals, the reviewer’s own — never derived from the name. Guarded by the `Initials` type at compile time and by a RangeError at render (lib/initials)',
    },
    rating: {
      control: { type: 'range', min: 0, max: 5, step: 0.5 },
      description:
        'Whole or half stars, 0 to 5 (lib/rating’s eleven values). Anything else is a compile error and a RangeError — the old component rounded, i.e. showed a rating nobody gave',
    },
    ratingLabel: {
      control: 'text',
      description:
        'The band’s FINISHED ICU sentence, e.g. „4,5 din 5 stele” — this section never formats a number, which is also what puts the comma in ro/de/fr/it and the dot in en (§8.1)',
    },
    body: {
      control: 'text',
      description:
        'The quoted text WITHOUT quote marks: the marks are generated by CSS from the document’s language (ledger D6), and the text is justified (owner, 2026-10-01). A string that brings its own marks renders them inside the generated pair',
    },
    postedOn: {
      control: 'text',
      description:
        'The day the review appeared on Google, `YYYY-MM-DD` — the machine-readable half, printed ONLY as the `dateTime` of the date line’s `<time>`: search engines read it, the eye never sees it',
    },
    postedAgo: {
      control: 'text',
      description:
        'How long ago, FINISHED in the page’s language — „acum 2 ani”, “2 years ago”, „vor 2 Jahren” — built by the band at `next build` through lib/time-ago (§8.1: never a date, never a number). Sentence case as Intl gives it: ui/Eyebrow uppercases in CSS, so the browser owns Ș/Ț case mapping',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the article (§6.4/§6.8) — the deck passes `h-full` so every card in a row equals the tallest',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE IDLE CARD — the deck's resting look, and the frame the old site's
 * reference picture was taken from: a 3px lavender frame on white, the
 * reviewer's photograph beside the stars, the quoted body — justified, the
 * owner's word of 2026-10-01 — the thin rule, and the credential under it.
 *
 * The play function reads back the facts a screenshot cannot hold: the card
 * is an `article` NAMED BY ITS OWN TITLE — the accessible name computed by the
 * browser from a real `aria-labelledby` pair, not an attribute we placed —
 * the quotation marks around the body are CSS, with the review's own words
 * underneath them, and the body's alignment is what the real stylesheet
 * computes.
 */
export const Framed: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { ...toCard(WITH_PICTURE, 'ro') },
  play: async ({ args, canvas, canvasElement }) => {
    const article = canvas.getByRole('article', { name: args.title });
    await expect(article.tagName).toBe('ARTICLE');
    await expect(
      canvas.getByRole('heading', { level: 3, name: args.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('img', { name: args.ratingLabel }),
    ).toBeInTheDocument();
    await expect(article).toHaveClass('border-[3px]');

    const body = bodyOf(canvasElement);
    await expectGeneratedQuotes(body, args.body);
    // JUSTIFIED by the real stylesheet (owner 2026-10-01: "make review text in
    // justify"): the unit suite pins the utility, this reads what it does.
    await expect(getComputedStyle(body).textAlign).toBe('justify');
    // The credential, as the DOM has it: the name is a <p> wearing the title
    // step (ledger D7), so the outline holds exactly one entry per card.
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
    await expect(canvas.getByText(args.name).tagName).toBe('P');
    // The date line: the band's phrase on a <time> whose dateTime carries the
    // day — the half a screenshot cannot hold. `uppercase` reaches it by
    // inheritance from the eyebrow, which is why the element needs no class.
    const posted = canvas.getByText(args.postedAgo);
    await expect(posted.tagName).toBe('TIME');
    await expect(posted).toHaveAttribute('datetime', args.postedOn);
    await expect(getComputedStyle(posted).textTransform).toBe('uppercase');
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE SELECTED CARD — the SAME review as Framed wearing the deck's other
 * look: the idle frame's own tint as its ground (owner 2026-09-12 — "the same
 * shade as the border of the non-current card"; the old site's rgb(229 228
 * 236)), a 1px border of the same colour, and content that starts on exactly
 * the same pixel as the framed card's (ui/Card's sum rule, 3 + 22 against
 * 1 + 24).
 *
 * Worth its own baseline precisely because the two pictures must differ ONLY
 * in paint: put this frame beside Framed — the same words, the same
 * photograph — and every text edge lines up.
 */
export const Emphasized: Story = {
  globals: { locale: 'ro' },
  args: { ...toCard(WITH_PICTURE, 'ro'), tone: 'emphasized' },
  play: async ({ args, canvas, canvasElement }) => {
    const article = canvas.getByRole('article', { name: args.title });
    await expect(article).toHaveClass(
      'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)',
    );
    await expect(article).not.toHaveClass('border-[3px]');
    await expectGeneratedQuotes(bodyOf(canvasElement), args.body);
    await expectNoSidewaysScroll(article);
  },
};

/** A deck in miniature: ONE card whose tone is re-rendered from the outside,
 *  which is exactly how the carousel marks its current slide. The control is a
 *  real <button> with a Romanian name — cards are not interactive, so the
 *  thing you press is deliberately NOT the card (the ui/Card ToneMorph
 *  precedent, one tier up). */
function MorphDemo(args: ReviewCardProps): ReactElement {
  const [selected, setSelected] = useState(false);
  return (
    // A COLUMN THAT STRETCHES, on purpose. ui/Card applies inline-size
    // containment (its @container mark — Card.tsx's "hand the card a width"
    // rule), so a card whose column said `items-start` was left to size
    // itself and shrank to its padding and border: ~50px, one hyphenated
    // word per line. The first spelling of this demo did exactly that (owner
    // 2026-09-12: "looks absolutely shit"). The default stretch hands the
    // card the decorator's column; the BUTTON is the one that opts out.
    <div className="flex flex-col gap-6">
      <ReviewCard {...args} tone={selected ? 'emphasized' : 'framed'} />
      <Button
        variant="outline"
        className="self-center"
        onClick={() => setSelected((on) => !on)}
      >
        Schimbă tonul
      </Button>
    </div>
  );
}

/**
 * THE MORPH (ledger D1a, the owner's pitfall) — press „Schimbă tonul" and the
 * card changes its look WITHOUT changing anything else: same node, same words,
 * same box. This is the one frame that exercises the deck's real motion at the
 * section tier; the unit suite pins the node identity, and here the assertion
 * runs against the real stylesheet.
 *
 * THE PLAY FUNCTION ENDS WHERE IT STARTED, on `framed` — a visual-net contract
 * rather than tidiness: it runs inside the preview iframe the screenshot is
 * taken from, so a one-way flip would make the baseline depend on who got
 * there first. Flipping back also buys the reverse direction for free.
 *
 * NO PICTURE, DELIBERATELY (CI failure on PR #97, 2026-09-10 — the Linux
 * runner caught a race the Mac had hidden). The story compares the card's
 * text before and after the flip; in the Vitest storybook project a picture
 * 404s (the export optimizer never runs in that Vite graph) and ui/Avatar
 * then swaps it for the two letters ASYNCHRONOUSLY, on the image's error
 * event — a DOM change with no relation to the tone that, if it lands between
 * the two captures, adds the letters to the text and fails the identity claim
 * for the wrong reason. So the review is the default's, the first WITHOUT a
 * photograph. The deck's own tests avoid pictures for the same cause
 * (ReviewsDeck.test.tsx's header); the picture's identity across a tone flip
 * is proven SYNCHRONOUSLY in ReviewCard.test.tsx, where the capture happens
 * before any error event can fire.
 */
export const Morph: Story = {
  globals: { locale: 'ro' },
  args: { ...toCard(WITH_LETTERS, 'ro') },
  argTypes: { tone: { control: false } },
  render: (args) => <MorphDemo {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const article = canvas.getByRole('article', { name: args.title });
    const words = article.textContent;
    const flip = canvas.getByRole('button', { name: 'Schimbă tonul' });
    await expect(article).toHaveClass('border-[3px]');

    await userEvent.click(flip);

    // ONE element through the whole swap — a re-created node would keep every
    // class assertion green while dropping anything the visitor had selected
    // inside it, and would give a crossfade nothing to interpolate from.
    await expect(canvas.getByRole('article', { name: args.title })).toBe(
      article,
    );
    await expect(article.textContent).toBe(words);
    await expect(article).toHaveClass(
      'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)',
    );
    await expect(article).not.toHaveClass('border-[3px]');

    await userEvent.click(flip);

    await expect(canvas.getByRole('article', { name: args.title })).toBe(
      article,
    );
    await expect(article.textContent).toBe(words);
    await expect(article).toHaveClass('border-[3px]');
  },
};

/**
 * NO PHOTOGRAPH — the face of a reviewer whose Google picture is only a
 * generated letter (lib/reviews carries no picture for them): two capitals on
 * the site's CTA green, the same 3rem circle the picture fills, so the header
 * row does not move when a reviewer has no portrait.
 *
 * The letters are DECORATION (`aria-hidden`): the name is printed in the
 * caption below, and a disc that announced it again would make every
 * testimonial read its author twice.
 */
export const NoPicture: Story = {
  globals: { locale: 'ro' },
  args: { ...toCard(WITH_LETTERS, 'ro') },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(canvas.getByText(args.initials)).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(
      canvas.getByRole('article', { name: args.title }),
    ).toHaveTextContent(args.name);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English), on the phone
 * width — the hardest frame this card has: the list's longest German review,
 * justified inside 390px of screen, with the date line in German too.
 *
 * Two mechanisms are on trial and both are driven by ONE attribute, the
 * `<html lang>` the locale global stamps: `hyphens: auto` (§15.14) picks its
 * German dictionary from it — so a long compound breaks inside the card's
 * padding instead of pushing its border, and the justified lines stay free of
 * rivers — and `quotes: auto` picks the German pair: the body comes out „…“
 * here and „…” in the Romanian frames, from the same component (ledger D6).
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: { ...toCard(LONGEST_GERMAN, 'de'), tone: 'emphasized' },
  play: async ({ args, canvas, canvasElement }) => {
    const article = canvas.getByRole('article', { name: args.title });
    // The mechanism, not the picture: the marks and the hyphenation both read
    // this attribute, so if the pin ever stopped arriving the frame would go
    // on looking plausible while proving nothing.
    await expect(document.documentElement.lang).toBe('de');
    await expectGeneratedQuotes(bodyOf(canvasElement), args.body);
    const posted = canvas.getByText(args.postedAgo);
    await expect(posted.tagName).toBe('TIME');
    await expect(posted).toHaveAttribute('datetime', args.postedOn);
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE PUNCTUATION, FIVE TIMES (ledger D6) — ONE real review in its five
 * languages, each card declaring its own, so each wears its language's marks
 * around its language's words: „…” for Romanian, “…” for English, „…“ for
 * German, « … » for French (measured in this repo's own Chromium,
 * 2026-09-10), and Italian's pair as the engine's table has it. The old card
 * hardcoded English `&ldquo;…&rdquo;` into all five locales; this frame is
 * what makes the replacement visible.
 *
 * The words change with the language: the first spelling held one invented
 * Romanian sentence constant across three cards, and the owner's order of
 * 2026-10-01 left no invented sentence to hold. The shortest review keeps the
 * five cards about the marks rather than the copy, and no control speaks for
 * five cards at once, so the panel is off. The play function can only assert
 * the KEYWORD each card resolves to — generated content never enters the DOM,
 * so the glyphs themselves are the baseline's job.
 */
export const QuoteMarksByLanguage: Story = {
  globals: { locale: 'ro' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {locales.map((language) => (
        <div key={language} lang={language}>
          <ReviewCard
            {...toCard(SHORTEST, language)}
            id={`${SHORTEST.id}-${language}`}
            tone="framed"
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('article')).toHaveLength(locales.length);

    for (const language of locales) {
      const wrapper = canvasElement.querySelector(
        `[lang="${language}"]`,
      ) as HTMLElement;
      const article = wrapper.querySelector('article') as HTMLElement;
      // Each card's aria-labelledby pair resolves to ITS OWN title — five ids,
      // five names, no collision (the id is seeded per language here).
      await expect(article).toHaveAccessibleName(
        SHORTEST.words[language].title,
      );
      await expectGeneratedQuotes(
        bodyOf(wrapper),
        SHORTEST.words[language].text,
      );
    }
  },
};
