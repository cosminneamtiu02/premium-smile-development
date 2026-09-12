import { useState, type ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Button } from '@/components/ui/Button/Button';
import { REVIEW_TONES, ReviewCard, type ReviewCardProps } from './ReviewCard';

// SEVEN stories, and the count is the honest one: the two looks the deck asks
// for, the flip between them, the letters face, a half star, the longest
// language, and the one frame that exists to photograph punctuation. The
// export NAMES are load-bearing — each names a baseline file
// (`sections-reviewcard--framed`, `sections-reviewcard--emphasized`, …) — so
// this list IS this section's contribution to the lane's visual manifest.
// `Sections/*` routes every one of them to 390 + 1536 (§13,
// tests/visual/stories.spec.ts).
//
// ── THE FIXTURES ARE DEMO COPY, AND THAT IS A DECISION, NOT A PLACEHOLDER
// (board D15, owner fb-446). Every review below is the OLD SITE's fabricated
// Romanian copy, reused here because it is the shape the old card was drawn
// around — twelve invented testimonials that never entered this repo's data:
// lib/reviews ships an EMPTY list, and the real reviews are the owner's to
// supply, each with the patient's written consent (a name plus a procedure is
// health data, GDPR art. 9) and the CMSR testimonial check (in force since
// 2025-07-01). Nothing in this file may be copied into lib/reviews or into a
// message file. The German block is that same demo copy translated for the
// §8.4 expansion stress, not a fifth review.
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
// `h3`, that the stars carry the band's finished sentence, and that the quote
// marks are GENERATED rather than typed (the body element's computed
// `::before`/`::after` content, which is the only place that difference is
// observable in code). What no play function may assert is the PHOTOGRAPH:
// under `npm run test` the optimizer's width variants do not exist yet, so
// every <img> 404s and ui/Avatar swaps to its letters face — a real fallback,
// firing exactly as designed, and the reason the picture is a subject for the
// baselines (built by `npm run build-storybook`, which generates them) rather
// than for an assertion here.

/** The old site's Romanian review copy — DEMO, never the site's data (D15). */
const DEMO = {
  cristian: {
    id: 'cristian-voicu',
    initials: 'CV',
    rating: 5,
    ratingLabel: '5 din 5 stele',
    title: 'Au văzut imaginea de ansamblu',
    body: 'Alte clinici mi-au dat un preț. Premium Smile mi-a dat un plan. Trei ani mai târziu, gura mea este sănătoasă.',
    name: 'Cristian Voicu',
    procedure: 'Plan complet',
  },
  ana: {
    id: 'ana-petrescu',
    initials: 'AP',
    rating: 5,
    ratingLabel: '5 din 5 stele',
    title: 'Copiii îmi cer să mergem',
    body: 'Doi copii, zero crize. Camera pediatrică și personalul fac fiecare vizită să pară o aventură.',
    name: 'Ana Petrescu',
    procedure: 'Pacient familie',
  },
  stefan: {
    id: 'stefan-radu',
    initials: 'ȘR',
    rating: 3.5,
    ratingLabel: '3,5 din 5 stele',
    title: 'Rapid, lin, prietenos',
    body: 'Toate cele patru măsele de minte într-o dimineață. Instrucțiuni clare, mâini blânde și un telefon de control a doua zi.',
    name: 'Ștefan Radu',
    procedure: 'Măsele de minte',
  },
  // The same demo review in German — §8.4's +30–35%, with a compound that
  // cannot break at a space in the procedure line and two more in the body.
  bogdan: {
    id: 'bogdan-ene',
    initials: 'BE',
    rating: 4.5,
    ratingLabel: '4,5 von 5 Sternen',
    title: 'Schmerzfrei, sogar bei der Wurzelbehandlung',
    body: 'Ehrlich gesagt hatte ich mit dem Schlimmsten gerechnet. Die einzelnen Behandlungsschritte wurden mir in Ruhe erklärt, die Betäubung hielt durchgehend, und am nächsten Tag kam der Kontrollanruf.',
    name: 'Bogdan Ene',
    procedure: 'Wurzelkanalbehandlung',
  },
} satisfies Record<string, Omit<ReviewCardProps, 'tone'>>;

// The committed clinic demo asset, standing in until real reviewer portraits
// arrive through the owner's §11 photographs gate. `alt: ''` is what the deck
// passes and is a decision, not a missing string: the card prints the name two
// lines below, so a named picture would announce the person twice
// (ui/Avatar's D-A1).
// Passed per STORY rather than from `meta.args`, so the letters frames simply
// never mention it — an arg explicitly set to `undefined` is a shape
// Storybook's arg merging is free to read as "not given", and "this card has
// no photograph" must be a fact of this file rather than of a merge rule.
const PICTURE = { src: '/images/demo/hero-calm.jpg', alt: '' } as const;

/** §7/§9: nothing may require horizontal scrolling, at any sampled width. */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/**
 * The proof of ledger D6, and the only place it is visible to code: the marks
 * are GENERATED CONTENT resolved from `quotes: auto` against the declared
 * language, so the computed `content` is the KEYWORD (the engine's chosen
 * glyphs never enter the DOM) while the body string itself stays bare. What
 * each language actually paints — ro „…” · de „…“ · fr «…» — is what the
 * baselines photograph, which is why QuoteMarksByLanguage exists.
 */
const expectGeneratedQuotes = async (body: HTMLElement): Promise<void> => {
  await expect(getComputedStyle(body, '::before').content).toBe('open-quote');
  await expect(getComputedStyle(body, '::after').content).toBe('close-quote');
  await expect(body.textContent).not.toMatch(/["'„”“«»]/);
};

const meta = {
  title: 'Sections/ReviewCard',
  component: ReviewCard,
  parameters: { layout: 'padded' },
  args: { ...DEMO.cristian, tone: 'framed' },
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
        'The quoted text WITHOUT quote marks: the marks are generated by CSS from the document’s language (ledger D6). A string that brings its own renders inside the generated pair',
    },
    procedure: {
      control: 'text',
      description:
        'Sentence case as authored — ui/Eyebrow uppercases in CSS, so the browser owns Ș/Ț case mapping and a locale that must not shout drops one utility instead of forking a message',
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
 * reviewer's photograph beside five gold stars, the quoted body, the thin rule,
 * and the credential under it.
 *
 * The play function reads back the two facts a screenshot cannot hold: the
 * card is an `article` NAMED BY ITS OWN TITLE — the accessible name computed by
 * the browser from a real `aria-labelledby` pair, not an attribute we placed —
 * and the quotation marks around the body are CSS, with the string underneath
 * them still bare.
 */
export const Framed: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { picture: PICTURE },
  play: async ({ canvas }) => {
    const article = canvas.getByRole('article', { name: DEMO.cristian.title });
    await expect(article.tagName).toBe('ARTICLE');
    await expect(
      canvas.getByRole('heading', { level: 3, name: DEMO.cristian.title }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('img', { name: DEMO.cristian.ratingLabel }),
    ).toBeInTheDocument();
    await expect(article).toHaveClass('border-[3px]');

    await expectGeneratedQuotes(canvas.getByText(DEMO.cristian.body));
    // The credential, as the DOM has it: the name is a <p> wearing the title
    // step (ledger D7), so the outline holds exactly one entry per card.
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
    await expect(canvas.getByText(DEMO.cristian.name).tagName).toBe('P');
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE SELECTED CARD — the same information wearing the deck's other look:
 * the idle frame's own tint as its ground (owner 2026-09-12 — "the same
 * shade as the border of the non-current card"; the old site's rgb(229 228
 * 236)), a 1px border of the same colour, and content that starts on exactly
 * the same pixel as the framed card's (ui/Card's sum rule, 3 + 22 against
 * 1 + 24).
 *
 * Worth its own baseline precisely because the two pictures must differ ONLY
 * in paint: put this frame beside Framed and every text edge lines up.
 */
export const Emphasized: Story = {
  globals: { locale: 'ro' },
  args: { ...DEMO.ana, picture: PICTURE, tone: 'emphasized' },
  play: async ({ canvas }) => {
    const article = canvas.getByRole('article', { name: DEMO.ana.title });
    await expect(article).toHaveClass(
      'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)',
    );
    await expect(article).not.toHaveClass('border-[3px]');
    await expectGeneratedQuotes(canvas.getByText(DEMO.ana.body));
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
 * text before and after the flip; in the Vitest storybook project the demo
 * picture 404s (the export optimizer never runs in that Vite graph) and
 * ui/Avatar then swaps the picture for its two letters ASYNCHRONOUSLY, on the
 * image's error event — a DOM change with no relation to the tone that, if it
 * lands between the two captures, adds "CV" to the text and fails the
 * identity claim for the wrong reason. The deck's own tests avoid pictures for
 * the same cause (ReviewsDeck.test.tsx's header); the picture's identity
 * across a tone flip is proven SYNCHRONOUSLY in ReviewCard.test.tsx, where
 * the capture happens before any error event can fire.
 */
export const Morph: Story = {
  globals: { locale: 'ro' },
  args: { picture: undefined },
  argTypes: { tone: { control: false } },
  render: (args) => <MorphDemo {...args} />,
  play: async ({ canvas, userEvent }) => {
    const article = canvas.getByRole('article', { name: DEMO.cristian.title });
    const words = article.textContent;
    const flip = canvas.getByRole('button', { name: 'Schimbă tonul' });
    await expect(article).toHaveClass('border-[3px]');

    await userEvent.click(flip);

    // ONE element through the whole swap — a re-created node would keep every
    // class assertion green while dropping anything the visitor had selected
    // inside it, and would give a crossfade nothing to interpolate from.
    await expect(
      canvas.getByRole('article', { name: DEMO.cristian.title }),
    ).toBe(article);
    await expect(article.textContent).toBe(words);
    await expect(article).toHaveClass(
      'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)',
    );
    await expect(article).not.toHaveClass('border-[3px]');

    await userEvent.click(flip);

    await expect(
      canvas.getByRole('article', { name: DEMO.cristian.title }),
    ).toBe(article);
    await expect(article.textContent).toBe(words);
    await expect(article).toHaveClass('border-[3px]');
  },
};

/**
 * NO PHOTOGRAPH — the face most Romanian reviews will actually wear: two
 * capitals on the site's CTA green, the same 3rem circle the picture fills, so
 * the header row does not move when a reviewer has no portrait.
 *
 * The letters are DECORATION (`aria-hidden`): the name is printed in the
 * caption below, and a disc that announced it again would make every
 * testimonial read its author twice.
 */
export const NoPicture: Story = {
  globals: { locale: 'ro' },
  args: { ...DEMO.ana },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(canvas.getByText(DEMO.ana.initials)).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(
      canvas.getByRole('article', { name: DEMO.ana.title }),
    ).toHaveTextContent(DEMO.ana.name);
  },
};

/**
 * A HALF STAR — 3.5, which the old component could not show: it rounded, so
 * 3.4 and 3.5 both became four whole stars, i.e. a rating nobody gave. Here
 * the half is a clip over the same glyph, so the slot box never changes width
 * and the row occupies the same space at every value.
 *
 * The label is the band's finished sentence with the comma its locale uses —
 * this section formats nothing (§8.1). The play reads the fills back through
 * ui/StarRating's `data-fill` seam: three full, one half, one empty.
 */
export const HalfRating: Story = {
  globals: { locale: 'ro' },
  args: { ...DEMO.stefan },
  play: async ({ canvas }) => {
    const stars = canvas.getByRole('img', { name: '3,5 din 5 stele' });
    const fills = [...stars.children].map((slot) =>
      slot.getAttribute('data-fill'),
    );
    await expect(fills).toEqual(['full', 'full', 'full', 'half', 'empty']);
    // The monogram carries Romanian's comma-below Ș (U+0218), whose uppercase
    // form only exists because the font subset carries it (§8.8).
    await expect(canvas.getByText('ȘR')).toBeInTheDocument();
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English), on the phone
 * width — the hardest frame this card has: a compound procedure word that
 * cannot break at a space, a body a third longer than the Romanian one, and
 * 390px of screen.
 *
 * Two mechanisms are on trial and both are driven by ONE attribute, the
 * `<html lang>` the locale global stamps: `hyphens: auto` (§15.14) picks its
 * German dictionary from it, so „Wurzelkanalbehandlung" breaks inside the
 * card's padding instead of pushing its border, and `quotes: auto` picks the
 * German pair — the body comes out „…“ here and „…” in the Romanian frames,
 * from the same component and the same bare string (ledger D6).
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: { ...DEMO.bogdan, tone: 'emphasized' },
  play: async ({ canvas }) => {
    const article = canvas.getByRole('article', { name: DEMO.bogdan.title });
    // The mechanism, not the picture: the marks and the hyphenation both read
    // this attribute, so if the pin ever stopped arriving the frame would go
    // on looking plausible while proving nothing.
    await expect(document.documentElement.lang).toBe('de');
    await expectGeneratedQuotes(canvas.getByText(DEMO.bogdan.body));
    await expect(canvas.getByText(DEMO.bogdan.procedure)).toBeInTheDocument();
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE PUNCTUATION, THREE TIMES (ledger D6) — the SAME bare body string in
 * three cards, each declaring a different language, so the only variable in
 * the picture is the marks the engine generates: „…” for Romanian, „…“ for
 * German, « … » for French (measured in this repo's own Chromium, 2026-09-10).
 * The old card hardcoded English `&ldquo;…&rdquo;` into all five locales;
 * this frame is what makes the replacement visible.
 *
 * The text is deliberately identical and Romanian in all three: a different
 * sentence per language would change two things at once, and the subject here
 * is the punctuation, not the copy. The play function can only assert the
 * KEYWORD each card resolves to — generated content never enters the DOM, so
 * the glyphs themselves are the baseline's job.
 */
export const QuoteMarksByLanguage: Story = {
  globals: { locale: 'ro' },
  argTypes: { tone: { control: false } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['ro', 'de', 'fr'] as const).map((language) => (
        <div key={language} lang={language}>
          <ReviewCard
            {...args}
            id={`${args.id}-${language}`}
            title={`${DEMO.cristian.title} (${language})`}
            tone="framed"
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const cards = canvas.getAllByRole('article');
    await expect(cards).toHaveLength(3);

    for (const language of ['ro', 'de', 'fr'] as const) {
      const wrapper = canvasElement.querySelector(
        `[lang="${language}"]`,
      ) as HTMLElement;
      const article = wrapper.querySelector('article') as HTMLElement;
      // Each card's aria-labelledby pair resolves to ITS OWN title — three
      // ids, three names, no collision (the id is seeded by the review id).
      await expect(article).toHaveAccessibleName(
        `${DEMO.cristian.title} (${language})`,
      );
      await expectGeneratedQuotes(
        wrapper.querySelector('blockquote > p') as HTMLElement,
      );
    }
  },
};
