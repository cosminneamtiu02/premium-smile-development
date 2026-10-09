import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { clinic } from '@/lib/clinic/clinic';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { brandWords, Wordmark } from './Wordmark';
import source from './Wordmark.tsx?raw';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. The one visible string is Romanian with diacritics by
// nature — it is `clinic.name` from lib/clinic/clinic.ts (§10.1), the single NAP
// source, never a literal typed in here (§17.4) — and so is the link's name:
// the REAL Romanian `common.brand.ariaLabel`, filled the way the consumers
// fill it (LABEL below).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows (GlyphButton, FloatingActions, Header, Footer). The facts
// that need real CSS — the tighten step's measurements, the no-overflow rule,
// the two words' painted colours and the focus ring's pixels — are asserted
// one tier up, in Wordmark.stories.tsx, where the section renders inside its
// consumers' box.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider here, and that absence
// is itself an assertion. next-intl's hooks throw without one, so a green
// render proves what §5 of the contract states: this section calls no t() and
// uses ZERO message keys — the link's name arrives FINISHED, as the
// `aria-label` prop the consumers translate (D9, 2026-10-02).
// The Header's suite mocks '@/i18n/navigation' for its ONE remaining export,
// usePathname (§15.13: the links themselves are plain anchors and need no
// stub); this file mocks nothing at all, because the home link is a plain
// anchor whose href arrives finished too — it imports no router and no URL
// rule.

const classesOf = (el: Element): string[] =>
  (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/**
 * The section's source with its PROSE removed, which is what every guard below
 * runs against.
 *
 * Without this the guards police the file's own documentation: this component
 * is deliberately comment-heavy, and the header discusses `'use client'`,
 * `useTranslations` and the handlers it does NOT have by name. A future
 * sentence mentioning `useEffect()` would then redden a suite that is supposed
 * to be watching the CODE (G2 typescript-reviewer, F8/M3).
 *
 * KNOWN LIMIT, stated rather than papered over: this strips block comments and
 * whole-line `//` comments, not a `//` trailing real code on the same line
 * (`<a>` … `// useEffect()`), and it would also strip a `//` living inside a
 * string literal. Neither shape exists in this file, and both are visible in
 * review — the alternative is a parser, which is not what a guard is for.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

/**
 * The link's name exactly as both consumers build it: the real Romanian
 * `common.brand.ariaLabel` („{name}, acasă") with `{name}` filled from the
 * single NAP source — what `t('brand.ariaLabel', { name: clinic.name })`
 * returns in the Header and the Footer, never a string typed in here.
 */
const LABEL = ro.common.brand.ariaLabel.replace('{name}', clinic.name);

/** The Romanian home, as `localeHref('ro', '/')` writes it (§15.13). */
const HOME = '/ro/';

/** The German pair — the pass-through test's second language. */
const DE_LABEL = de.common.brand.ariaLabel.replace('{name}', clinic.name);
const DE_HOME = '/de/';

const mount = ({ href = HOME, label = LABEL } = {}) => {
  const utils = render(<Wordmark href={href} aria-label={label} />);
  const text = utils.container.querySelector(
    'span.font-display',
  ) as HTMLElement;
  const anchor = text.closest('a') as HTMLElement;
  return {
    ...utils,
    anchor,
    img: anchor.querySelector('img') as HTMLImageElement,
    text,
    words: [...text.querySelectorAll('span')] as HTMLElement[],
  };
};

describe('Wordmark — D9, the home link (owner, 2026-10-02)', () => {
  it('IS the link: the root <a> carries the href it was handed, and nothing else in the lockup links', () => {
    // "i just want the "premium smile" logo from top bar and from footer to
    // be a component that takes you to home" — a control that NAVIGATES, so a
    // plain <a href> (§9, §15.13), and the root itself: the lockup adds no
    // wrapper, so the consumer's box holds exactly one link.
    const { anchor } = mount();

    expect(anchor.tagName).toBe('A');
    expect(screen.getByRole('link', { name: LABEL })).toBe(anchor);
    expect(anchor).toHaveAttribute('href', HOME);
    // ONE link: the mark stays decorative (alt=""), so no image link and no
    // second anchor can nest inside the first.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(anchor.querySelectorAll('a')).toHaveLength(0);
  });

  it('is named by EXACTLY the label it is handed — a pass-through, in any language', () => {
    // The accessible name IS the `aria-label` prop, verbatim: this component
    // neither builds the label nor checks it, and the visible text stays the
    // clinic's name whatever the label says. So the label-in-name rule —
    // SC 2.5.3, the visible „Premium Smile" FIRST, then the destination
    // (SC 2.4.4) — is not this file's to hold: Header.test.tsx's five-language
    // `{name}`-first check holds it, and both consumers' suites pin the label
    // they pass. Two languages here, so a hard-wired Romanian label could not
    // pass for a pass-through.
    for (const [href, label] of [
      [HOME, LABEL],
      [DE_HOME, DE_LABEL],
    ] as const) {
      const { anchor, text, unmount } = mount({ href, label });

      expect(text.textContent).toBe(clinic.name);
      expect(anchor).toHaveAccessibleName(label);
      expect(anchor).toHaveAttribute('href', href);
      unmount();
    }
  });

  it('is a tab stop by being a real link — no tabindex, no role bolted on', () => {
    // An <a href> is focusable and announced as a link by the platform
    // itself; a tabindex or a role here would only be a second, driftable
    // spelling of what the element already is.
    const { anchor } = mount();

    expect(anchor).not.toHaveAttribute('tabindex');
    expect(anchor).not.toHaveAttribute('role');
    anchor.focus();
    expect(document.activeElement).toBe(anchor);
  });

  it('hugs the lockup and wears the house focus ring — never the soft corner', () => {
    // The box HUGS (no `h-full`), so the ring draws round the lockup inside
    // the bar's row; `min-h-11` keeps a 44px target where the phone lockup is
    // shorter (§9). The ring is ui/TextButton's recipe on §15.1's 6px corner;
    // the soft corner belongs to the four parts §15.29 names
    // (tests/unit/soft-corner-census.test.ts).
    const { anchor } = mount();
    const classes = classesOf(anchor);

    expect(classes).toEqual(
      expect.arrayContaining([
        'min-h-11',
        'rounded-md',
        'outline-offset-2',
        'focus-visible:outline-2',
        'focus-visible:outline-focus',
      ]),
    );
    expect(classes).not.toContain('h-full');
    expect(classes).not.toContain('rounded-soft');
  });

  it('fakes no hover look: no hover or press state, no motion, no cursor class', () => {
    // A logo link at rest IS its look — the old site's had no hover effect,
    // the owner confirmed "no effect" (2026-10-03), and the browser already
    // gives every <a href> the pointer. Every element of the lockup, not just
    // the root: nothing in it may restyle or move on hover.
    // EVERY VARIANT SEGMENT of every token is read — everything before a
    // token's last colon — so the hover and press states hide under no
    // prefix: plain `hover:`, `group-hover:` (the repo's own idiom —
    // ClinicLocation's rows and SpeedDial's scrim wear it), `peer-hover:`, a
    // named `group-hover/x:`, an arbitrary `[&:hover]:` (its inner colon
    // splits off a segment that still says "hover"), `group-active:`. A
    // leading-colon pattern saw only the first of those.
    const { anchor } = mount();
    const tokens = [anchor, ...anchor.querySelectorAll('*')].flatMap(classesOf);
    const variantsOf = (token: string): string[] =>
      token.split(':').slice(0, -1);

    expect(
      tokens.filter((t) => variantsOf(t).some((v) => /hover|active/.test(v))),
    ).toEqual([]);
    expect(
      tokens.filter((t) =>
        /(^|:)-?(transition|duration-|ease-|scale-|animate-|cursor-)/.test(t),
      ),
    ).toEqual([]);
  });
});

describe('Wordmark — the mark', () => {
  it('is DECORATIVE (alt="") so the brand is announced once, not twice', () => {
    // The clinic name stands beside it in text; a described image would say it
    // again. alt="" also keeps the image out of the accessibility tree, which
    // is why there is no img role to query.
    const { img } = mount();

    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(img).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it("draws the clinic's own mark by default — the .svg under the brand folder (§15.6)", () => {
    // The file the optimizer never touches (its extension list has no .svg),
    // so the same src serves in dev, vitest, storybook and the build.
    const { img } = mount();
    expect(img.getAttribute('src')).toBe('/images/brand/mark.svg');
  });

  it('reserves its box with width/height ATTRIBUTES (§11, zero CLS)', () => {
    // The intrinsic box is the file's viewBox, 258 × 261 — near-square; the
    // attributes give the browser that aspect ratio before the bytes arrive,
    // and the CSS then draws it at a FIXED rem height — 3.4425rem, 1.53rem
    // below the phone step, since 2026-10-01 (Wordmark.tsx's THE OWNER'S
    // SIZES) — its width following that ratio.
    // tests/unit/logotype-census.test.ts holds the two numbers to the file.
    const { img } = mount();

    expect(img.getAttribute('width')).toBe('258');
    expect(img.getAttribute('height')).toBe('261');
    expect(classesOf(img)).toEqual(
      expect.arrayContaining(['h-[3.4425rem]', 'w-auto', 'max-w-none']),
    );
  });

  it('loads EAGERLY — it sits above the fold in the header', () => {
    // No `loading` attribute at all, i.e. the HTML default. The Footer's SAL
    // badge is `lazy` because it is always below the fold; this mark is the
    // brand corner of the bar, and a lazy above-the-fold image pays the cost
    // of the deferral without the saving (Wordmark.tsx states the rule).
    const { img } = mount();
    expect(img).not.toHaveAttribute('loading');
  });

  it('is a PARAMETER with the mark as default (D11) — dims travel with src', () => {
    // "src image is just parameter" (owner, 2026-08-20). The object shape is
    // deliberate: §11's width/height attributes are only honest when the
    // intrinsic size arrives WITH the file it describes — a bare src prop
    // would let a caller swap the file and keep the old box. `src` is an
    // ImagePath: a path outside /images/ is a compile error, not a 404.
    const { container } = render(
      <Wordmark
        href={HOME}
        aria-label={LABEL}
        artwork={{ src: '/images/brand/other.svg', width: 96, height: 96 }}
      />,
    );
    const img = container.querySelector('img') as HTMLImageElement;

    expect(img.getAttribute('src')).toBe('/images/brand/other.svg');
    expect(img.getAttribute('width')).toBe('96');
    expect(img.getAttribute('height')).toBe('96');
  });
});

describe('Wordmark — the census (D12)', () => {
  it('renders NO bar between mark and name', () => {
    // "remove vertical line" (owner, 2026-08-20, after seeing it live) —
    // supersedes v2's D2. Two children, one gap: the only aria-hidden the
    // lockup may contain is none at all (the mark hides via alt="").
    const { anchor } = mount();

    expect(anchor.children).toHaveLength(2);
    expect(anchor.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });
});

describe('Wordmark — the name', () => {
  it('prints the single-source clinic name, never a message key', () => {
    const { text } = mount();

    expect(text).toHaveTextContent(clinic.name);
    // A leaked key path is what next-intl renders on a miss; there is no t()
    // here at all, and this is the assertion that keeps it that way.
    expect(text.textContent).not.toMatch(/\bbrand\.[a-zA-Z]+\b/);
  });

  it('reads as ONE string — the two coloured words are joined by a plain space', () => {
    // Two spans could be announced as two fragments; the space between them
    // is real text, so textContent IS the name, byte for byte — what a screen
    // reader, a find-in-page and a copy-paste all get.
    const { text } = mount();
    expect(text.textContent).toBe(clinic.name);
  });

  it('wears ui/Heading section step plus hyphens-none on the host — nothing else', () => {
    // The `section` step, 30px — half again the `title` step (20px) it wore
    // until the owner's "make the text 50% bigger than it is now" and "update
    // also in footer" (2026-10-01, Wordmark.tsx's THE OWNER'S SIZES) — and
    // §15.14's rider for labels: a brand name may break between its words,
    // never at a syllable. Byte exactness keeps a third utility from riding
    // in unnoticed.
    const { text } = mount();
    expect(text.getAttribute('class')).toBe(
      'font-display text-3xl text-ink-strong hyphens-none @max-md:text-xl',
    );
  });

  it('claims no outline slot: the Heading host is a plain <span>', () => {
    // C2, the Header's rule applied to a mark that repeats in the shell of
    // every route: the one <h1> belongs to the page's content.
    const { text } = mount();

    expect(text.tagName).toBe('SPAN');
    expect(text.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });
});

describe('Wordmark — the two colours (owner, 2026-10-01)', () => {
  it('paints the first word in the brand grey and the second in the brand lilac', () => {
    // "on Premium the gray and on smile the liliac" — the words are
    // clinic.name's own, in order, each on one utility and nothing else.
    const { words } = mount();
    const [first, second] = brandWords(clinic.name);

    expect(words).toHaveLength(2);
    expect(words[0]).toHaveTextContent(first);
    expect(words[1]).toHaveTextContent(second);
    expect(classesOf(words[0] as HTMLElement)).toEqual(['text-brand-grey']);
    expect(classesOf(words[1] as HTMLElement)).toEqual(['text-brand-lilac']);
  });

  it('marks both words as the logotype — the attribute the a11y gate keys its exemption on', () => {
    // WCAG 2.2 SC 1.4.3 exempts text that is part of a brand name from the
    // contrast minimum; axe cannot know, so .storybook/preview.tsx narrows
    // its color-contrast rule by this attribute. Present and EMPTY (a
    // boolean would print "true"; presence is what the selector matches).
    const { words } = mount();
    for (const word of words) {
      expect(word).toHaveAttribute('data-logotype', '');
    }
  });

  it('brandWords splits exactly two words and refuses every other shape by name', () => {
    expect(brandWords('Premium Smile')).toEqual(['Premium', 'Smile']);
    for (const bad of [
      'Premium',
      'Premium Smile Sibiu',
      'Premium  Smile',
      ' Smile',
      '',
    ]) {
      expect(() => brandWords(bad)).toThrow(/exactly two words/);
    }
  });
});

describe('Wordmark — zero islands, and a box it does not own', () => {
  it('ships NO client directive — it is inert HTML on every page (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts, never by a program-wide vite/client
    // reference — F7) so it runs in the same browser project as the rest of
    // the suite. A 'use client' here would hydrate the Header AND the Footer
    // on every route of the site.
    // Anchored to a line of its OWN, because that is what a directive is, and
    // tolerant of a trailing comment, because that is a shape a real one
    // takes: `'use client'; // …`.
    expect(CODE).not.toMatch(/^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/m);
    // …and the reason it can stay that way: no hook, no handler, no router.
    expect(CODE).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY five things — a swap to ui/Image cannot be silent', () => {
    // F14: every guard above is one level deep. `<img>` → `ui/Image` would
    // hydrate both shells on every page without tripping a single regex —
    // ExportedImage holds useState for its error fallback, but that `use` sits
    // in the PACKAGE, not in this file. An allowlist is the only guard that
    // sees it: adding an import here has to be a deliberate edit to this test,
    // with the hydration question asked out loud. The fourth entry is the
    // TYPE of the artwork's path (lib/image-path) — erased at build, a
    // dependency on paper only. The fifth, lib/base-path (pages-base-path
    // lane, 2026-10-03), puts the deployment's prefix on the mark's address;
    // asked out loud: it is a React-free function of one environment variable
    // (tests/unit/lib-react-free.test.ts fences the folder), so it hydrates
    // nothing — the shells stay inert HTML.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/lib/base-path/base-path',
      '@/lib/clinic/clinic',
      '@/lib/image-path/image-path',
      'react',
    ]);
    // …and the two that are types stay types: a value import of either would
    // be a runtime dependency this allowlist did not admit.
    expect(CODE).toMatch(/^import type \{ ImagePath \}/m);
    expect(CODE).toMatch(/^import type \{ ReactElement \}/m);
    // Side-effect (`import './x'`) and re-export (`export … from './x'`)
    // forms add a dependency without a `from`-import the matcher above would
    // see — asserted absent rather than widening the matcher (G2 TS r2, L6).
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('renders no <button>: nothing here needs JavaScript', () => {
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('carries NO outer margin — the consumer owns placement (§6.4)', () => {
    const { anchor } = mount();
    expect(classesOf(anchor).filter((c) => /^-?m[trblxye]?-/.test(c))).toEqual(
      [],
    );
  });

  it('measures its CONSUMER container, never the viewport (§6.5)', () => {
    // A media query here would react to the window instead of the box the
    // component was handed — and both consumers hand it a very different one
    // at the same viewport.
    // Every element, at every width (D10/fb-202 — D12 trimmed the census to
    // mark + name). THREE SHAPES, because Tailwind offers three (F8/M2): the plain `md:`
    // prefix, the `max-md:` and compound `dark:max-lg:` forms, and the
    // arbitrary `min-[600px]:` / `max-[600px]:` variants. The first pattern
    // therefore anchors on start-OR-colon, which is what keeps a legitimate
    // CONTAINER token out of it: in `@max-md:gap-2` the character before
    // `max-` is `@`, not a colon, and that leading `@` is the whole
    // protection — `md` IS a viewport name, so without it the token would
    // read as the media query it is not.
    // The second never matches `max-h-[…]` / `max-w-[…]`, which are sizing
    // utilities rather than variants.
    const { anchor, container } = mount();
    const viewportVariant = /(^|:)(max-)?(sm|md|lg|xl|2xl):/;
    const arbitraryMedia = /(min|max)-\[/;

    for (const el of [anchor, ...anchor.querySelectorAll('*')]) {
      for (const token of classesOf(el)) {
        expect(token).not.toMatch(viewportVariant);
        expect(token).not.toMatch(arbitraryMedia);
      }
    }
    // It is NOT the container itself: the Header pill and the Footer gutter box
    // already are, and a container of its own would measure the lockup instead
    // of the space available to it.
    expect(classesOf(container.firstElementChild as Element)).not.toContain(
      '@container',
    );
  });

  it('tightens on ONE named container step: gap, mark and name', () => {
    // D10 (fb-202): same elements at every width, one step at most, and the
    // step is one of Tailwind's own names — no custom value may enter the
    // untouched default scale (§3). The two values are the owner's chosen
    // sizes (Wordmark.tsx's THE OWNER'S SIZES), whose fit is re-checked by
    // the Stress320 story, which reproduces the real header cell.
    const { anchor } = mount();
    const tokens = [anchor, ...anchor.querySelectorAll('*')].flatMap(classesOf);
    const stepped = tokens.filter((t) => t.startsWith('@'));

    // The step is `@max-md` since 2026-10-09 (`@max-sm` until then): THE
    // PHONE GUTTER widened the pill by a tenth of the window, and 28rem keeps
    // every phone on the phone lockup (Wordmark.tsx, BELOW `@max-md`).
    expect(stepped.toSorted()).toEqual([
      '@max-md:gap-2',
      '@max-md:h-[1.53rem]',
      '@max-md:text-xl',
    ]);
    // Nothing may HIDE at the step — that is the rule the old site broke.
    expect(tokens.filter((t) => t.includes('hidden'))).toEqual([]);
    // …and nothing may forbid the wrap the 320 arithmetic rests on: the
    // Header's nowrap lives at ITS step, on its own cell (Header.tsx).
    expect(tokens).not.toContain('whitespace-nowrap');
  });
});
