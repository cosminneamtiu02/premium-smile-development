import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { clinic } from '@/lib/clinic';
import { Wordmark } from './Wordmark';
import source from './Wordmark.tsx?raw';

// Role-based queries on purpose (§9, §13): a passing suite doubles as proof of
// accessible markup. The one visible string is Romanian with diacritics by
// nature — it is `clinic.name` from lib/clinic.ts (§10.1), the single NAP
// source, never a literal typed in here (§17.4).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows (GlyphButton, FloatingActions, Header, Footer). The two
// facts that need real CSS — the tighten step's measurements and the
// no-overflow rule — are asserted one tier up, in Wordmark.stories.tsx, where
// the section renders inside its consumers' box.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider here, and that absence
// is itself an assertion. next-intl's hooks throw without one, so a green
// render proves what §5 of the contract states: this section calls no t() and
// uses ZERO message keys (D9 removed the label along with the navigation).
// The Header's suite mocks '@/i18n/navigation' for its ONE remaining export,
// usePathname (§15.13: the links themselves are plain anchors and need no
// stub); this file mocks nothing at all, because the placeholder anchor imports
// no router.

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

const mount = () => {
  const utils = render(<Wordmark />);
  const text = utils.container.querySelector(
    'span.font-display',
  ) as HTMLElement;
  const anchor = text.closest('a') as HTMLElement;
  return {
    ...utils,
    anchor,
    img: anchor.querySelector('img') as HTMLImageElement,
    text,
  };
};

describe('Wordmark — D9, the placeholder anchor', () => {
  it('is an <a> with NO href, so it takes no link role and no tab stop', () => {
    // fb-200: clickable-shaped, navigating nowhere. An <a> without href is not
    // a link — it is a generic element — which is precisely the state this
    // component is parked in until the wiring diff lands.
    const { anchor } = mount();

    expect(anchor.tagName).toBe('A');
    expect(anchor).not.toHaveAttribute('href');
    expect(screen.queryByRole('link')).toBeNull();
    // Nor may it be forced into the tab order by hand: a focusable element
    // with no destination is a dead stop for a keyboard user.
    expect(anchor).not.toHaveAttribute('tabindex');
  });

  it('carries NO aria-label — on an unfocusable generic that is prohibited ARIA', () => {
    // axe's aria-prohibited-attr, a hard §13 gate failure. The visible clinic
    // name IS the name; the reserved `common.brand.ariaLabel` key returns only
    // when the element becomes a real link.
    const { anchor } = mount();

    expect(anchor).not.toHaveAttribute('aria-label');
    expect(anchor).not.toHaveAttribute('aria-labelledby');
    expect(anchor).not.toHaveAttribute('role');
  });

  it('fakes no affordance: no cursor-pointer on an inert element', () => {
    const { anchor } = mount();
    expect(classesOf(anchor)).not.toContain('cursor-pointer');
  });
});

describe('Wordmark — the artwork', () => {
  it('is DECORATIVE (alt="") so the brand is announced once, not twice', () => {
    // The clinic name stands beside it in text; a described image would say it
    // again. alt="" also keeps the image out of the accessibility tree, which
    // is why there is no img role to query.
    const { img } = mount();

    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(img).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).toBeNull();
    expect(img.getAttribute('src')).toContain('transparent-artwork-cat');
  });

  it('reserves its box with width/height ATTRIBUTES (§11, zero CLS)', () => {
    // The intrinsic file is 256×171 (the committed F12 derivative); the
    // attributes give the browser that aspect ratio before the bytes arrive,
    // and the CSS then draws it at a percentage of the row it was given.
    const { img } = mount();

    expect(img.getAttribute('width')).toBe('256');
    expect(img.getAttribute('height')).toBe('171');
    expect(classesOf(img)).toEqual(
      expect.arrayContaining(['h-[90%]', 'w-auto']),
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

  it('is a PARAMETER with the demo as default (D11) — dims travel with src', () => {
    // "src image is just parameter" (owner, 2026-08-20). The object shape is
    // deliberate: §11's width/height attributes are only honest when the
    // intrinsic size arrives WITH the file it describes — a bare src prop
    // would let a caller swap the file and keep the old box.
    const { container } = render(
      <Wordmark
        artwork={{ src: '/brand/publio.svg', width: 96, height: 96 }}
      />,
    );
    const img = container.querySelector('img') as HTMLImageElement;

    expect(img.getAttribute('src')).toBe('/brand/publio.svg');
    expect(img.getAttribute('width')).toBe('96');
    expect(img.getAttribute('height')).toBe('96');
  });
});

describe('Wordmark — the census (D12)', () => {
  it('renders NO bar between artwork and name', () => {
    // "remove vertical line" (owner, 2026-08-20, after seeing it live) —
    // supersedes v2's D2. Two children, one gap: the only aria-hidden the
    // lockup may contain is none at all (the artwork hides via alt="").
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

  it('wears ui/Heading title step BYTE-EXACTLY — the zero-diff invariant', () => {
    // The string the Header used to spell inline on its brand anchor. Byte
    // exactness is the whole reason the swap is invisible to the visual
    // baselines (fb-207): an extra utility here IS the diff.
    const { text } = mount();
    expect(text.getAttribute('class')).toBe(
      'font-display text-xl text-ink-strong',
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

  it('imports EXACTLY three things — a swap to ui/Image cannot be silent', () => {
    // F14: every guard above is one level deep. `<img>` → `ui/Image` would
    // hydrate both shells on every page without tripping a single regex —
    // ExportedImage holds useState for its error fallback, but that `use` sits
    // in the PACKAGE, not in this file. An allowlist is the only guard that
    // sees it: adding an import here has to be a deliberate edit to this test,
    // with the hydration question asked out loud.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/Heading/Heading',
      '@/lib/clinic',
      'react',
    ]);
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
    // artwork + name). THREE SHAPES, because Tailwind offers three (F8/M2): the plain `md:`
    // prefix, the `max-md:` and compound `dark:max-lg:` forms, and the
    // arbitrary `min-[600px]:` / `max-[600px]:` variants. The first pattern
    // therefore anchors on start-OR-colon, which is what keeps a legitimate
    // CONTAINER token out of it: in `@max-xs:gap-2` the character before
    // `max-` is `@`, not a colon — and `xs` is not a viewport name anyway.
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

  it('tightens on ONE named container step, gap and artwork only', () => {
    // D10 (fb-202): same three elements at every width, one step at most, and
    // the step is one of Tailwind's own names — no custom value may enter the
    // untouched default scale (§3). The two values are derived from a
    // measurement recorded in Wordmark.tsx and re-checked by the Stress320
    // story, which reproduces the real header cell.
    const { anchor } = mount();
    const tokens = [anchor, ...anchor.querySelectorAll('*')].flatMap(classesOf);
    const stepped = tokens.filter((t) => t.startsWith('@'));

    expect(stepped.toSorted()).toEqual(['@max-xs:gap-2', '@max-xs:h-[40%]']);
    // Nothing may HIDE at the step — that is the rule the old site broke.
    expect(tokens.filter((t) => t.includes('hidden'))).toEqual([]);
  });
});
