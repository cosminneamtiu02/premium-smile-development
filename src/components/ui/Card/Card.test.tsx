import { createRef, useState, type Ref } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
// The REAL stylesheet, compiled by the same Tailwind pipeline the site uses.
// The SUM-RULE pin below is meaningless without it: "border + padding = 25px
// per side" is a COMPUTED length — the whole point is that `border-[3px]` and
// `p-[calc(1.5rem-2px)]` really resolve to 3 and 22 — never a class name.
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (Modal, SpeedDial, LanguageSwitcher, LanguageBanner, shell).
import '@/styles/globals.css';
import { Card, type CardProps, type CardTone } from './Card';
import source from './Card.tsx?raw';

// A <div> has no role, and that is the contract: this atom paints a surface,
// it adds no semantics — the <article>/<li> a section wants arrives through
// asChild, as the consumer's OWN element (board card-atom.plan.md D2). So the
// default-host queries below reach the box through its CHILDREN: getByText
// matches the element whose own text nodes carry the string, which for
// `<Card>{copy}</Card>` is the div itself; the asChild cases are queried by
// ROLE (listitem, article), i.e. exactly what a screen reader announces
// (§9 enforcement by construction).
// Fixtures are Romanian WITH diacritics (§15.7). RO_ALL carries all seven
// Romanian marks — Ș ș Ț ț ă â î — so a broken encoding path (font subsetting,
// JSX escaping, the message pipeline downstream) fails here rather than in
// front of a patient. RO_TITLE/RO_BODY are the service-card shape the two
// approved dossiers measured, and they are factual: no superlatives, no
// promotions, no result guarantees (CMSR, in force since 2025-07-01).
const RO_ALL = 'Ședințe în Târgoviște — găsiți Țepeș';
const RO_TITLE = 'Ședință de consultație';
const RO_BODY = 'Evaluare completă a danturii și plan de tratament.';

// THE surface, in canonical order and in one contiguous piece — the
// independent byte-pin (the ui/Eyebrow RECIPE convention): written out here
// rather than imported from the component, so a silent edit to `cardClasses`
// or to a tone row fails HERE instead of quietly re-defining what the test
// compares against. Every card in every future section wears these bytes.
// The clock joined the geometry on 2026-09-10 (owner D1b — Card.tsx's TONE
// CROSSFADE paragraph): a tone swap fades its PAINT instead of cutting, so
// `--fade`, the two-property list, the duration, the easing and the
// reduced-motion reset are part of what a bare <Card> emits and therefore part
// of this pin. The geometry pair is pointedly NOT on that list — which is why
// the content cannot move mid-swap, measured below.
// Since the padding moved into the rows (pack round 1, the `framed`
// amendment) this order also coincides, after the `@container` prefix, with
// the root the two dossiers spelled by hand — which is what lets the fence's
// contiguous signature catch a pasted dossier root as well as a pasted
// definition.
// THE TINT'S TWO DECLARATIONS (owner 2026-09-12 — Card.tsx's ONE TINT
// paragraph): the solid accent every engine understands, then the opaque 20%
// mix over the surface behind a `@supports` gate. They are part of
// `cardClasses`, so EVERY card emits them and every byte-pin below carries
// them — a bare `surface` card included, which never reads the value.
const TINT_DECLARATION =
  '[--card-tint:var(--color-accent-decorative)] ' +
  'supports-[color:color-mix(in_lab,red,red)]:[--card-tint:color-mix(in_srgb,var(--color-accent-decorative)_20%,var(--color-surface))]';

const DEFAULT_CARD =
  '@container flex flex-col gap-3 rounded-md ' +
  '[--fade:400ms] transition-[background-color,border-color] ' +
  'duration-(--fade) ease-in-out motion-reduce:transition-none ' +
  `${TINT_DECLARATION} ` +
  'border border-line-subtle bg-surface p-6';

// The same bytes DECOMPOSED into the two halves the atom actually assembles —
// the geometry every card shares, and the tone row that varies (PADDING
// included: exactly one `p-*` per rendered card, never two). The composition
// assertion in the first `it` below is what keeps the two spellings honest
// about each other, so neither can drift alone.
const GEOMETRY =
  '@container flex flex-col gap-3 rounded-md ' +
  '[--fade:400ms] transition-[background-color,border-color] ' +
  'duration-(--fade) ease-in-out motion-reduce:transition-none ' +
  TINT_DECLARATION;

/** The tone clock's own half of that string, named once so the crossfade
 *  assertions below read as a list of decisions rather than as string soup:
 *  the PAINT fades, the geometry does not travel at all. */
const CROSSFADE_LIST = 'transition-[background-color,border-color]';

// Record<CardTone, …> on purpose: the tone axis is BUILT to grow, and already
// has — `framed` joined as the fourth situation on the owner's word (fb-423).
// A FIFTH joins the same way, when a section measures one; a different INSET
// still would not, arriving instead as `density`, an axis of its own with its
// own lookup — coupling paint to padding is what the board refused (D5/D8),
// and `framed` does not do it either: it spends its extra border out of its
// OWN padding, which is what the sum-rule pin below measures.
// So a new member must not be able to ship with zero coverage — this file
// stops typechecking until it is classified here. That is the compile-time
// half of §6.6's additive-growth rule; the runtime half is the per-tone
// equality test below (the Heading `expectedClasses` precedent).
const TONE_CLASSES: Record<CardTone, string> = {
  surface: 'border border-line-subtle bg-surface p-6',
  tinted: 'border border-transparent bg-page p-6',
  emphasized:
    'border border-(--card-tint) bg-surface supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint) p-6',
  framed: 'border-[3px] border-(--card-tint) bg-surface p-[calc(1.5rem-2px)]',
};

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

describe('Card — element & children', () => {
  it('renders a <div>, children intact including Ș ș Ț ț ă â î', () => {
    // Query the diacritics themselves: a laxer query would miss the node if
    // any layer normalised or mangled them.
    render(<Card>{RO_ALL}</Card>);
    expect(screen.getByText(RO_ALL).tagName).toBe('DIV');
  });

  it('adds no semantics of its own — no role, no aria-label', () => {
    // The look is one thing, the element another (D2). A card that announced
    // itself as an article by default would force that meaning on the grid
    // item, the definition-list row and the plain box alike; sections opt in
    // through asChild instead, on their own markup.
    render(<Card>{RO_BODY}</Card>);
    const card = screen.getByText(RO_BODY);
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('aria-label');
  });
});

describe('Card — THE surface definition', () => {
  // The one drift the Record cannot see: WIDENING the axis. `CardTone = string`
  // (or `| (string & {})`) keeps the impl Record, the Record above and the
  // stories' `satisfies` all compiling with stale rows while `toneClasses[x]`
  // goes undefined at runtime. So pin the union itself — additive growth edits
  // this line consciously, in the same commit as the new row (the Heading
  // "size axis, exhaustively" precedent; runs at typecheck, costs nothing at
  // runtime).
  expectTypeOf<CardTone>().toEqualTypeOf<
    'surface' | 'tinted' | 'emphasized' | 'framed'
  >();

  it('emits exactly the default surface and nothing else', () => {
    // toBe, never toContain — equality is the only assertion that can prove a
    // smuggled utility (a leading-*, a shadow, a hover lift, a margin) stayed
    // out. `cx` is a plain join(' ') (lib/cx/cx.ts), so byte-equality is
    // deterministic.
    render(<Card>{RO_TITLE}</Card>);
    expect(screen.getByText(RO_TITLE).className).toBe(DEFAULT_CARD);
    // …and the two spellings above describe the same bytes.
    expect(`${GEOMETRY} ${TONE_CLASSES.surface}`).toBe(DEFAULT_CARD);
  });

  it('bundles the @container mark WITH the surface (D10, the silent-failure guard)', () => {
    // Splitting the pair has no error mode — Container.tsx's own reason,
    // inherited: a card that took the padding but forgot the mark would leave
    // its `@sm:`/`@md:` variants with no queryable ancestor, and
    // container-gated styles would simply never match. No console line, no
    // exception: the mobile stack at every width, silently.
    render(<Card>{RO_TITLE}</Card>);
    expect(tokensOf(screen.getByText(RO_TITLE))).toContain('@container');
  });

  it.each(Object.keys(TONE_CLASSES) as CardTone[])(
    'tone "%s" emits the shared geometry plus exactly its own row',
    (tone) => {
      render(<Card tone={tone}>{RO_TITLE}</Card>);
      expect(screen.getByText(RO_TITLE).className).toBe(
        `${GEOMETRY} ${TONE_CLASSES[tone]}`,
      );
    },
  );

  it('leaves the bare <Card> on the surface tone, never on a newer row', () => {
    // §6.6: a changed default is a break at every call site at once. Growth
    // adds rows; it never moves what a bare <Card> already looks like. Stated
    // against the OTHER rows by name (the Heading precedent), so this pin says
    // what the byte-exact test above cannot: a future edit that flipped the
    // default to `tinted` fails loudly here instead of silently re-painting
    // every existing card.
    render(<Card>{RO_TITLE}</Card>);
    const bare = screen.getByText(RO_TITLE).className;
    expect(bare).not.toBe(`${GEOMETRY} ${TONE_CLASSES.tinted}`);
    expect(bare).not.toBe(`${GEOMETRY} ${TONE_CLASSES.emphasized}`);
    expect(bare).not.toBe(`${GEOMETRY} ${TONE_CLASSES.framed}`);
  });

  it('keeps border + padding at 25px per side on every row — switching tone never moves content', () => {
    // THE SUM RULE, asserted where it actually lives: in computed pixels, not
    // in class names. A class-level check ("every row contains `border`")
    // could not survive the `framed` amendment (fb-423) and could never have
    // proven the thing that matters anyway — that a card's CONTENT starts at
    // the same place whatever tone it wears, so a framed card in a grid row
    // keeps its text edges aligned with its neighbours'. Read through LOGICAL
    // properties (§3): "inline start" and "block start" are what the rows
    // promise, and physical left/top only happen to coincide in this
    // left-to-right, horizontal-writing document.
    const measure = (tone: CardTone) => {
      const { unmount } = render(<Card tone={tone}>{RO_TITLE}</Card>);
      const box = getComputedStyle(screen.getByText(RO_TITLE));
      const row = {
        border: parseFloat(box.borderInlineStartWidth),
        inline:
          parseFloat(box.borderInlineStartWidth) +
          parseFloat(box.paddingInlineStart),
        block:
          parseFloat(box.borderBlockStartWidth) +
          parseFloat(box.paddingBlockStart),
      };
      unmount();
      return row;
    };

    // THE ONE LITERAL in this test, and the only root-dependent line in it:
    // 1px of border + `--spacing` × 6 = 24px of padding, at the 16px root
    // globals.css keeps (§15.1 puts the 1.125rem base on BODY; html stays
    // 16px so rem and user zoom behave, §7). The invariant the sum rule
    // actually claims is root-INDEPENDENT — 3px + (1.5rem − 2px) = 1px +
    // 1.5rem whatever 1rem turns out to be — so every row below is compared
    // against this measurement rather than against a repeated number.
    const surfaceSum = measure('surface').inline;
    expect(surfaceSum).toBe(25);

    const borders = new Map<CardTone, number>();
    for (const tone of Object.keys(TONE_CLASSES) as CardTone[]) {
      const row = measure(tone);
      borders.set(tone, row.border);
      expect(row.inline, `${tone}: inline start`).toBe(surfaceSum);
      expect(row.block, `${tone}: block start`).toBe(surfaceSum);
    }
    // NEVER-VACUOUS: every sum agreeing would also be true with the stylesheet
    // missing entirely (0 + 0 four times) or with `framed` silently flat
    // (1 + 24 four times). The two widths ARE the claim.
    expect(borders.get('framed')).toBe(3);
    expect(borders.get('surface')).toBe(1);
  });
});

describe('Card — the tone crossfade (owner D1b, 2026-09-10)', () => {
  // Two layers, and they answer different questions. The CLASS layer says
  // which properties were put on the clock — a decision, only readable as
  // tokens (and, once, as the browser's own computed transition-property, so
  // the utility is proven to COMPILE and not merely to be spelled). The PIXEL
  // layer says what that decision does to the content while the fade runs,
  // which no class assertion can see and which is the whole reason the
  // geometry pair is kept OFF the list (Card.tsx's TONE CROSSFADE paragraph).
  // Both run in real Chromium against the real stylesheet imported at the top
  // of this file.

  const tokensOfDefault = () => {
    const { unmount } = render(<Card>{RO_TITLE}</Card>);
    const tokens = tokensOf(screen.getByText(RO_TITLE));
    unmount();
    return tokens;
  };

  it('fades the PAINT on the shared 400ms --fade clock', () => {
    // Whole tokens, never substrings (the Button.test convention): every one
    // of these sits inside some longer spelling — `transition-none` inside
    // `motion-reduce:transition-none`, `ease-in-out` inside a hypothetical
    // `hover:ease-in-out` — so an `includes()` check would pass on the wrong
    // string.
    const tokens = tokensOfDefault();
    expect(tokens).toContain('[--fade:400ms]');
    expect(tokens).toContain(CROSSFADE_LIST);
    expect(tokens).toContain('duration-(--fade)');
    expect(tokens).toContain('ease-in-out');
    expect(tokens).toContain('motion-reduce:transition-none');
  });

  it('keeps the SUM-RULE PAIR off the clock — the geometry never travels', () => {
    // The rejected variant, pinned as an absence (the measurement behind it is
    // in Card.tsx's TONE CROSSFADE paragraph): with `border-width` on the list
    // the browser snaps the used width down to whole device pixels while the
    // padding interpolates, so the content walks ~1 device pixel and back
    // mid-fade — the second animation this repo's hover doctrine bans.
    const list = tokensOfDefault().filter((t) => /^transition-\[/.test(t));
    expect(list).toEqual([CROSSFADE_LIST]);
    expect(list[0]).not.toContain('border-width');
    expect(list[0]).not.toContain('padding');
  });

  it('names its properties instead of reaching for a shorthand', () => {
    const tokens = tokensOfDefault();
    // `transition-colors` also covers outline-color — the Button/GlyphButton
    // lesson: a focus ring may never ride an animation clock, and a card's
    // classes travel onto whatever element `asChild` slots them into.
    expect(tokens).not.toContain('transition-colors');
    // `transition-all` would additionally put every future utility a caller
    // merges through className onto the clock, sight unseen.
    expect(tokens).not.toContain('transition-all');
    // Exactly ONE unprefixed transition utility: a second one does not "add"
    // properties, it REPLACES the first, and which of the two wins is decided
    // by their order in the compiled sheet rather than by this file.
    expect(tokens.filter((t) => /^transition-/.test(t))).toEqual([
      CROSSFADE_LIST,
    ]);
    // …and the only variant-prefixed one is the §9 reset.
    expect(tokens.filter((t) => /^[^:]+:transition-/.test(t))).toEqual([
      'motion-reduce:transition-none',
    ]);
  });

  it('admits no second clock, no second easing and no delay', () => {
    // In and out must mirror each other (the Button precedent): a lone
    // `hover:duration-1000` or a `delay-150` would desynchronise the two
    // directions of a swap that is supposed to feel like one calm move.
    const tokens = tokensOfDefault();
    expect(
      tokens.filter(
        (t) => /(^|:)duration-/.test(t) && t !== 'duration-(--fade)',
      ),
    ).toEqual([]);
    expect(
      tokens.filter((t) => /(^|:)ease-/.test(t) && t !== 'ease-in-out'),
    ).toEqual([]);
    expect(tokens.filter((t) => /(^|:)delay-/.test(t))).toEqual([]);
  });

  it('compiles to exactly those two properties on a 0.4s clock', () => {
    // The class layer's blind spot: an arbitrary-value utility that Tailwind
    // never emits leaves the element with NO transition and every token
    // assertion above still green. This reads the decision back from the
    // browser — the property list, the clock resolved through var(--fade),
    // and the easing.
    render(<Card>{RO_TITLE}</Card>);
    const box = getComputedStyle(screen.getByText(RO_TITLE));
    expect(box.transitionProperty).toBe('background-color, border-color');
    expect(box.transitionDuration).toBe('0.4s');
    expect(box.transitionTimingFunction).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  // ── The pixel layer. A stateful host is the only honest fixture here: the
  // fade exists exactly because a CONSUMER re-renders the SAME card with a
  // different tone (a rotation-driven selection), which is a different event
  // from mounting two cards side by side — the two-render sum-rule test above
  // can never start a transition.
  function ToneSwitcher({ from, to }: { from: CardTone; to: CardTone }) {
    const [tone, setTone] = useState(from);
    return (
      <Card tone={tone} data-testid="card">
        <p data-testid="body">{RO_TITLE}</p>
        <button type="button" onClick={() => setTone(to)}>
          schimbă tonul
        </button>
      </Card>
    );
  }

  const nextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  /** Flip the tone and SCRUB the fade to fixed points, watching the two things
   *  that must disagree: the content's INSET, which may not move at all, and
   *  the background COLOUR, which must (or the stillness below would be the
   *  stillness of a fade that never ran). */
  async function flipAndWatch(from: CardTone, to: CardTone) {
    const { unmount } = render(<ToneSwitcher from={from} to={to} />);
    const body = screen.getByTestId('body');
    const card = screen.getByTestId('card');

    // The content's inset INSIDE THE CARD — border + padding per side, which
    // is exactly what the sum rule promises — rather than viewport
    // coordinates, which a click can shift by scrolling the document (the
    // ui-card--tone-morph story met that).
    const inset = () => {
      const box = card.getBoundingClientRect();
      const inner = body.getBoundingClientRect();
      return { inline: inner.left - box.left, block: inner.top - box.top };
    };
    const startInset = inset();
    const startPaint = getComputedStyle(card).backgroundColor;

    fireEvent.click(screen.getByRole('button'));

    const insets = new Set<string>([
      `${startInset.inline}/${startInset.block}`,
    ]);
    const paints = new Set<string>();
    // SCRUB the fade instead of waiting for it (G3 react L2). The transition
    // the click started is a CSSTransition the Web Animations API can hold
    // still and set to any time, so the samples are taken at FIXED points of
    // the 400ms — 0, a quarter, half, three quarters, the last millisecond —
    // on any machine, with no frame budget in the loop: a wall-clock rAF loop
    // needed at least one frame to land inside the fade, and a throttled CI
    // runner can miss that. One frame first, so the style change has been
    // flushed and the transition exists to be scrubbed.
    await nextFrame();
    const fades = card.getAnimations();
    expect(fades.length, 'the click must have started a fade').toBeGreaterThan(
      0,
    );
    for (const time of [0, 100, 200, 300, 399]) {
      for (const fade of fades) {
        fade.pause();
        fade.currentTime = time;
      }
      const now = inset();
      insets.add(`${now.inline}/${now.block}`);
      paints.add(getComputedStyle(card).backgroundColor);
    }
    for (const fade of fades) fade.finish();

    const endPaint = getComputedStyle(card).backgroundColor;
    unmount();
    return {
      insets: [...insets],
      paints: [...paints],
      startPaint,
      endPaint,
    };
  }

  const DIRECTIONS: ReadonlyArray<[CardTone, CardTone]> = [
    ['framed', 'emphasized'],
    ['emphasized', 'framed'],
  ];

  it.each(DIRECTIONS)(
    'keeps the content exactly 25px in, at every frame of a live %s → %s flip',
    async (from, to) => {
      const { insets, paints, startPaint, endPaint } = await flipAndWatch(
        from,
        to,
      );

      // NEVER-VACUOUS: a swap that never faded would make the stillness below
      // true for the wrong reason. `framed` rests on --surface and
      // `emphasized` on the 20% tint, so an intermediate paint — equal to
      // NEITHER end — is proof the clock really ran during the samples.
      expect(startPaint, 'the two tones must differ in paint').not.toBe(
        endPaint,
      );
      expect(
        paints.some((paint) => paint !== startPaint && paint !== endPaint),
        `background never left its two ends: ${paints.join(' | ')}`,
      ).toBe(true);

      // THE MEASUREMENT THE DECISION WAS MADE ON (owner, via the planner,
      // 2026-09-10): with the geometry pair off the clock, `border-width` and
      // `padding` swap inside ONE style recalculation and their sum is 25px on
      // both sides of it. Not "within a pixel" — the SAME value at rest and at
      // every frame in between, in both directions. Putting them on the list
      // measured up to 1 device pixel of drift instead (Card.tsx's TONE
      // CROSSFADE paragraph records that variant and why it was rejected).
      expect(insets, 'every sampled inset, inline/block').toEqual(['25/25']);
    },
  );

  it('keeps the tone swap on ONE element — a fade needs the node to survive', () => {
    // If a consumer's re-render replaced the DOM node instead of updating it,
    // there would be no previous value to interpolate from and the "fade"
    // would silently become a cut in production while every class assertion
    // above stayed green.
    render(<ToneSwitcher from="framed" to="emphasized" />);
    const before = screen.getByTestId('card');
    expect(before.className).toBe(`${GEOMETRY} ${TONE_CLASSES.framed}`);

    fireEvent.click(screen.getByRole('button'));

    const after = screen.getByTestId('card');
    expect(after).toBe(before);
    expect(after.className).toBe(`${GEOMETRY} ${TONE_CLASSES.emphasized}`);
  });
});

describe('Card — the aura (owner fb-378/381)', () => {
  it('is absent by default — a glow is chosen per card KIND, never assumed', () => {
    render(<Card>{RO_TITLE}</Card>);
    expect(tokensOf(screen.getByText(RO_TITLE))).not.toContain('shadow-aura');
  });

  it('wears the shared token exactly once when asked', () => {
    // The same lavender glow the Header pill and the corner discs wear —
    // named here, mixed from --accent-decorative in globals.css. The count is
    // load-bearing for tests/unit/aura-token.test.ts's census, which reads
    // this atom's source expecting exactly one wear.
    render(<Card aura>{RO_TITLE}</Card>);
    const tokens = tokensOf(screen.getByText(RO_TITLE));
    expect(tokens.filter((t) => t === 'shadow-aura')).toHaveLength(1);
    // …and it rides ON TOP of the tone, changing nothing else about it.
    expect(screen.getByText(RO_TITLE).className).toBe(
      `${GEOMETRY} ${TONE_CLASSES.surface} shadow-aura`,
    );
  });

  it('emits nothing for aura={false} (the explicit-false path)', () => {
    render(<Card aura={false}>{RO_TITLE}</Card>);
    expect(screen.getByText(RO_TITLE).className).toBe(DEFAULT_CARD);
  });
});

describe('Card — the rejected axes, at the class level', () => {
  it.each(Object.keys(TONE_CLASSES) as CardTone[])(
    'tone "%s" ships no margin, no size, no viewport variant, no ink',
    (tone) => {
      // Each absence is a recorded decision, not an oversight (see the
      // OWNS / DOES NOT OWN paragraph in Card.tsx):
      //  · margins — §6.4, the grid's `gap` owns the space between cards;
      //  · width/height — the track's, and the row's stretch plus `flex-1`
      //    on the growing child is the §8.4 mechanism, not a min-height prop;
      //  · `sm:`/`md:` — an atom reacting to the WINDOW instead of its own
      //    box is the §6.5 smell; the `@`-variants are the sanctioned family
      //    and none of them is on this root either;
      //  · text-* — ink is inherited from the body, so a card carries the
      //    same prose colour wherever it lands.
      render(<Card tone={tone}>{RO_TITLE}</Card>);
      const tokens = tokensOf(screen.getByText(RO_TITLE));
      expect(tokens.filter((t) => /^m[trblxyse]?-/.test(t))).toEqual([]);
      expect(
        tokens.filter((t) => /^(w|min-w|max-w|h|min-h|max-h)-/.test(t)),
      ).toEqual([]);
      expect(tokens.filter((t) => /^(sm|md|lg|xl|2xl):/.test(t))).toEqual([]);
      expect(tokens.filter((t) => /^text-/.test(t))).toEqual([]);
    },
  );
});

describe('Card — §6.8 native-element fidelity', () => {
  it('merges the caller className LAST — placement rides on top', () => {
    // `h-full` is the canonical case: a grid item stretching to its row.
    // Order is a deterministic convention the tests pin, NOT a cascade
    // mechanism — attribute order never decides CSS specificity, which is
    // exactly why className is placement only and the padding/colour axes are
    // props (see the className paragraph in Card.tsx).
    render(<Card className="h-full">{RO_TITLE}</Card>);
    expect(screen.getByText(RO_TITLE).className).toBe(`${DEFAULT_CARD} h-full`);
  });

  it('accepts ref as a regular prop (React 19)', () => {
    const card = createRef<HTMLDivElement>();
    render(<Card ref={card}>{RO_TITLE}</Card>);
    expect(card.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads remaining native props onto the rendered <div>', () => {
    render(
      <Card
        id="card-serviciu"
        lang="ro"
        data-kind="service"
        aria-hidden="false"
      >
        {RO_BODY}
      </Card>,
    );
    const card = screen.getByText(RO_BODY);
    // `id` is load-bearing rather than decoration: a section's
    // aria-labelledby pairs the card's heading with its element.
    expect(card).toHaveAttribute('id', 'card-serviciu');
    expect(card).toHaveAttribute('lang', 'ro');
    expect(card).toHaveAttribute('data-kind', 'service');
    expect(card).toHaveAttribute('aria-hidden', 'false');
    // …and none of the atom's own props leak into the DOM.
    expect(card).not.toHaveAttribute('tone');
    expect(card).not.toHaveAttribute('aura');
    expect(card).not.toHaveAttribute('aschild');
  });
});

describe('Card — asChild (shared ui/slot engine)', () => {
  it('lets an <li> BECOME the card — the grid-item shape', () => {
    render(
      <ul>
        <Card asChild>
          <li className="col-span-2">{RO_TITLE}</li>
        </Card>
      </ul>,
    );
    const item = screen.getByRole('listitem');
    // Own classes first, the child's own preserved after them (slot.ts merge
    // order): the consumer keeps its placement class, the atom brings the
    // surface. This is the whole point of D2 — no wrapper div between the
    // <ul> and its <li>, so the list semantics survive.
    expect(item.className).toBe(`${DEFAULT_CARD} col-span-2`);
  });

  it('merges THREE class sources in order: atom, Card className, child className', () => {
    // The full order, in one assertion, because asChild is where it is easiest
    // to get wrong: the atom's own string, then the caller's className (§6.8
    // placement — `h-full` for the grid row), then whatever the child already
    // declared (slot.ts merges the child's LAST). Deterministic because `cx`
    // is a plain join — and, as ever, a convention rather than a cascade.
    render(
      <ul>
        <Card asChild className="h-full">
          <li className="col-span-2">{RO_TITLE}</li>
        </Card>
      </ul>,
    );
    expect(screen.getByRole('listitem').className).toBe(
      `${DEFAULT_CARD} h-full col-span-2`,
    );
  });

  it('lets an <article> BECOME the card, keeping its own a11y wiring', () => {
    render(
      <Card asChild tone="emphasized" aura>
        <article aria-labelledby="titlu-echipa">
          <h3 id="titlu-echipa">{RO_TITLE}</h3>
        </article>
      </Card>,
    );
    const card = screen.getByRole('article');
    // The child wins every prop it declares (slot.ts), so the name the
    // section wired stays the name the screen reader speaks…
    expect(card).toHaveAttribute('aria-labelledby', 'titlu-echipa');
    // …while tone and aura still reach it: the asChild branch consumes the
    // same assembled string as the div branch, and only a rendered assertion
    // can prove it never hardcodes one row.
    expect(card.className).toBe(
      `${GEOMETRY} ${TONE_CLASSES.emphasized} shadow-aura`,
    );
  });

  // CardProps types `ref` for the <div> branch; in asChild mode it reaches the
  // child element instead — the cast below is the test acknowledging that.
  const asDivRef = (ref: Ref<HTMLLIElement>) =>
    ref as unknown as Ref<HTMLDivElement>;

  it("forwards Card's ref to the child element (React 19 ref-in-props)", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <ul>
        <Card asChild ref={asDivRef(ref)}>
          <li>{RO_TITLE}</li>
        </Card>
      </ul>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });

  it("the child's own ref wins over Card's (children win conflicts)", () => {
    // React 19 exposes ref inside props, so the engine's child-wins merge
    // covers it like any other prop — never add 'ref' to a disallow set
    // (ui/slot.ts says so at the merge loop, and this is the assertion behind
    // that sentence).
    const childRef = createRef<HTMLLIElement>();
    const cardRef = createRef<HTMLLIElement>();
    render(
      <ul>
        <Card asChild ref={asDivRef(cardRef)}>
          <li ref={childRef}>{RO_TITLE}</li>
        </Card>
      </ul>,
    );
    expect(childRef.current).toBeInstanceOf(HTMLLIElement);
    expect(cardRef.current).toBeNull();
  });

  it('throws its own actionable, Card-named message for bad children', () => {
    // The engine's guard runs before React's own Children.only would, so the
    // message names the component the author actually wrote. React logs the
    // thrown render error too; silencing console.error keeps the run readable
    // without hiding the assertion (the Heading.test.tsx precedent).
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    // try/finally, not a trailing call: a FAILING assertion throws past the
    // restore and would leave the rest of this file running with console.error
    // silenced — a red test quietly buying silence for its neighbours.
    try {
      expect(() => render(<Card asChild>doar text</Card>)).toThrow(
        /Card with asChild expects exactly one element child/,
      );
      expect(() =>
        render(
          <Card asChild>
            <li>unu</li>
            <li>doi</li>
          </Card>,
        ),
      ).toThrow(/Card with asChild expects exactly one element child/);
    } finally {
      silence.mockRestore();
    }
  });
});

describe('Card — the rejected axes, pinned at the type level', () => {
  // The board rejected each of these with a named re-open trigger (the
  // OWNS / DOES NOT OWN paragraph in Card.tsx). These lines stop compiling
  // the moment one is added without that board note — the surgical form of
  // the pin, erased to a no-op at runtime (the Container/Eyebrow precedent).

  it('has no width or height axis — the track stretches, `flex-1` fills', () => {
    expectTypeOf<CardProps>().not.toHaveProperty('width');
    expectTypeOf<CardProps>().not.toHaveProperty('minHeight');
  });

  it('has no padding axis — per-side knobs would fight §3 logical properties', () => {
    expectTypeOf<CardProps>().not.toHaveProperty('padding');
  });

  it('has no paint axis beyond `tone` — no background, border or radius knob', () => {
    expectTypeOf<CardProps>().not.toHaveProperty('background');
    expectTypeOf<CardProps>().not.toHaveProperty('border');
    expectTypeOf<CardProps>().not.toHaveProperty('radius');
  });

  it('has no `as` axis — the element arrives through asChild', () => {
    expectTypeOf<CardProps>().not.toHaveProperty('as');
  });

  it('rejects a tone outside the lookup — rows join by board note, never at a call site', () => {
    // The positive half is the Record above; this is the negative one. A
    // section inventing `tone="loud"` must fail at COMPILE time, because the
    // atom's answer at runtime would be `toneClasses['loud']` → undefined →
    // a card with geometry and no paint (the SpeedDial 'rp' precedent).
    const loud = (
      // @ts-expect-error — 'loud' is not a CardTone
      <Card tone="loud">{RO_TITLE}</Card>
    );
    expect(loud).toBeTruthy();
  });

  it('does carry the surface those pins are read against', () => {
    // Never-vacuous guard: if the props type ever degraded to `{}` or `any`,
    // every assertion above would pass while proving nothing.
    expectTypeOf<CardProps>().toHaveProperty('className');
    expectTypeOf<CardProps>().toHaveProperty('children');
    expectTypeOf<CardProps>().toHaveProperty('tone');
    expectTypeOf<CardProps>().toHaveProperty('aura');
  });
});

describe('Card — the zero-island invariant (source guard)', () => {
  it("ships no 'use client' directive", () => {
    // Load-bearing, and invisible to any runtime assertion: a directive here
    // would hydrate every band that composes a card — on every route of the
    // site — for a box that has no state, no handler and nothing to focus
    // (§16). Tolerant of trailing line AND block comments (`'use client'; /* … */`
    // is a live directive — the prologue grammar keeps comment company legal;
    // G2 2026-09-04). RECORDED TOLERANCE, not a hole being denied: a leading
    // same-line comment or trailing code (`'use client';const x=1`) would
    // still slip past — prettier formats directives onto their own line in
    // this repo, so the guard reads the shapes that survive formatting. A
    // comment line can never match: comments start with `/` or `*`, never
    // with a quote.
    expect(source).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
  });

  it('spells the card geometry exactly ONCE in its own source', () => {
    // The FILE-LOCAL half of the promotion's residue check, counted on the
    // RAW source: this file spells the signature once, in `cardClasses`, and
    // its own header prose deliberately writes those utilities apart (with
    // separators) so discussing the geometry can never redden the guard. This
    // counter cannot see any other file — the src-WIDE half, "no second
    // spelling anywhere", is tests/unit/card-single-spelling.test.ts.
    expect(source.split('flex flex-col gap-3 rounded-md').length - 1).toBe(1);
  });
});

describe('Card — ONE tint: the idle frame IS the selected ground (owner 2026-09-12)', () => {
  it('paints the emphasized ground in EXACTLY the framed border colour — read back from the engine', () => {
    // The owner's sentence at pack round 2 ("the current card the same shade
    // as the border of the non-current card"), asserted as computed colour:
    // both rows read `--card-tint`, so the two values are one value. Rendered
    // side by side so the same stylesheet resolves both.
    render(
      <>
        <Card tone="framed">{RO_TITLE}</Card>
        <Card tone="emphasized">{RO_BODY}</Card>
      </>,
    );
    const frame = getComputedStyle(screen.getByText(RO_TITLE)).borderTopColor;
    const ground = getComputedStyle(screen.getByText(RO_BODY)).backgroundColor;

    expect(ground).toBe(frame);
    // …and it is the MIX, not either fallback: neither the white base nor the
    // solid accent (#7a6d9c) an engine without color-mix would paint. A
    // readback of either would mean the `supports-[…]` declaration never
    // compiled and every engine would see the fallback.
    expect(ground).not.toBe('rgb(255, 255, 255)');
    expect(ground).not.toBe('rgb(122, 109, 156)');
  });

  it('paints an OPAQUE tint — no alpha channel, never a wash over transparent (G2 a11y, 2026-09-10)', () => {
    const { container } = render(<Card tone="emphasized">x</Card>);
    const card = container.firstElementChild as HTMLElement;
    const paint = getComputedStyle(card).backgroundColor;
    // No alpha channel below 1 in any serialization Chromium may pick.
    expect(paint).not.toMatch(/rgba\(.*,\s*0?\.\d+\)$/);
    expect(paint).not.toMatch(/\/\s*0?\.\d+\)$/);
    expect(paint).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('keeps an explicit white base under the mix for engines without color-mix', () => {
    const { container } = render(<Card tone="emphasized">x</Card>);
    const classes = (
      container.firstElementChild as HTMLElement
    ).className.split(' ');
    expect(classes).toContain('bg-surface');
    expect(classes).toContain(
      'supports-[color:color-mix(in_lab,red,red)]:bg-(--card-tint)',
    );
    // The tint is declared exactly once, as its two halves, on every card.
    expect(classes).toContain('[--card-tint:var(--color-accent-decorative)]');
    expect(
      classes.filter((token) => token.includes('--card-tint:')),
    ).toHaveLength(2);
    // …and never as a transparent wash, in any spelling.
    expect(classes.some((token) => /accent-decorative\/\d+/.test(token))).toBe(
      false,
    );
  });
});
