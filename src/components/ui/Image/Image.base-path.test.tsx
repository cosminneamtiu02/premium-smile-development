import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Image, type ImageProps } from './Image';

// THE BASE PATH reaches every URL the optimizer derives from `src`
// (pages-base-path lane, 2026-10-03; CLAUDE.md §15.2). On the interim GitHub
// Pages build the site lives under /premium-smile-development/, and before
// this lane every picture there 404'd: ui/Image handed the optimizer a
// root-absolute `src`, and Next adds its basePath to no custom loader's URL.
//
// A file of its own because vi.mock is hoisted over the WHOLE file: the seam
// below makes this file a Pages build, and Image.test.tsx's root-host
// expectations must never see it. A mock, not the environment, because in
// this Chromium project process.env.PAGES_BASE_PATH is a literal '' baked in
// at transform time (vitest.config `define` — measured: vi.stubEnv leaves it
// ''); withBasePath's own logic is pinned in node, tests/unit/base-path.test.ts.
// The seam is the module boundary the atom really calls, so a regression that
// stops routing `src` through it turns these red.
const PAGES = '/premium-smile-development';

vi.mock(import('@/lib/base-path/base-path'), async (importOriginal) => ({
  ...(await importOriginal()),
  basePath: () => PAGES,
  withBasePath: (path: `/${string}`) => `${PAGES}${path}`,
}));

// The `process` shim Image.test.tsx carries, for the same reason (next/image
// reads process.env at module scope); conditional, so it is a no-op wherever
// the runner already provides the global.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

const HERO = { src: '/images/demo/hero-calm.jpg', width: 1600, height: 1200 };
const HERO_ALT = 'Cabinet stomatologic modern, luminos';
const VARIANTS = `${PAGES}/images/demo/nextImageExportOptimizer/hero-calm-opt-`;

const imageNamed = (name: string) => screen.getByRole('img', { name });

// The PATH a URL asks the host for: next/image writes the <img> src as an
// absolute URL in this runner (http://localhost:<port>/…) and the srcset as
// paths, and the prefix is a fact about the path either way.
const pathOf = (url: string | null) =>
  new URL(url ?? '', window.location.href).pathname;

describe('Image — the deployment prefix is on every URL it writes', () => {
  it('prefixes every srcset candidate — the files the browser picks from', () => {
    render(<Image {...HERO} alt={HERO_ALT} />);
    const candidates = (imageNamed(HERO_ALT).getAttribute('srcset') ?? '')
      .split(',')
      .map((candidate) => candidate.trim().split(' ')[0]);
    expect(candidates.length).toBeGreaterThan(0);
    for (const url of candidates) {
      expect(pathOf(url).startsWith(VARIANTS)).toBe(true);
    }
  });

  it('prefixes the <img> src and the blur placeholder', () => {
    render(<Image {...HERO} alt={HERO_ALT} />);
    const image = imageNamed(HERO_ALT);
    // Read synchronously, before the runner's 404 swaps the fallback in (the
    // variants exist only in a built export — Image.test.tsx's opening note).
    expect(pathOf(image.getAttribute('src')).startsWith(VARIANTS)).toBe(true);
    expect(image.style.backgroundImage).toContain(`${VARIANTS}10.WEBP`);
  });

  it("keeps the prefix on the library's ERROR FALLBACK, the reason it rides on src", () => {
    // The variants 404 in this runner, so ExportedImage swaps in the original
    // file. Its fallbackLoader re-reads the raw `src` and ignores the library's
    // own basePath prop — which is why the atom prefixes `src` instead.
    render(<Image {...HERO} alt={HERO_ALT} />);
    const image = imageNamed(HERO_ALT);
    return expect
      .poll(() => pathOf(image.getAttribute('src')))
      .toBe(`${PAGES}/images/demo/hero-calm.jpg`);
  });

  it("reads a slash-less path the way the optimizer does, from the site's root", () => {
    render(<Image {...HERO} src="images/demo/hero-calm.jpg" alt={HERO_ALT} />);
    const src = imageNamed(HERO_ALT).getAttribute('src');
    expect(pathOf(src).startsWith(VARIANTS)).toBe(true);
  });

  it('leaves a full URL alone — a data: picture gets no prefix', () => {
    const pixel =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    render(<Image src={pixel} width={1} height={1} alt={HERO_ALT} />);
    expect(imageNamed(HERO_ALT).getAttribute('src')).toBe(pixel);
  });

  it('leaves a protocol-relative //host URL alone — it names another host', () => {
    render(
      <Image
        src="//example.invalid/clinic.jpg"
        width={1600}
        height={1200}
        alt={HERO_ALT}
      />,
    );
    const first = (imageNamed(HERO_ALT).getAttribute('srcset') ?? '')
      .split(',')[0]
      .trim();
    expect(first.startsWith('//example.invalid/')).toBe(true);
  });

  it("prefixes a STATIC IMPORT's variants through the library's own prop", () => {
    // What Next hands a page for `import photo from './hero-calm.jpg'` on the
    // Pages build: its own `src` already prefixed (assetPrefix = basePath).
    // The optimizer keeps an import's variants at the site root and prefixes
    // their URLs only through its `basePath` prop — the atom passes it.
    const imported = {
      src: `${PAGES}/_next/static/media/hero-calm.1a2b3c4d.jpg`,
      width: 1600,
      height: 1200,
    };
    render(<Image src={imported} alt={HERO_ALT} />);
    const candidates = (imageNamed(HERO_ALT).getAttribute('srcset') ?? '')
      .split(',')
      .map((candidate) => candidate.trim().split(' ')[0]);
    expect(candidates.length).toBeGreaterThan(0);
    for (const url of candidates) {
      expect(
        pathOf(url).startsWith(
          `${PAGES}/nextImageExportOptimizer/hero-calm.1a2b3c4d-opt-`,
        ),
      ).toBe(true);
    }
  });

  it("prefixes a caller's overrideSrc and blurDataURL — every address it forwards", () => {
    render(
      <Image
        {...HERO}
        overrideSrc="/images/demo/hero-calm.jpg"
        blurDataURL="/images/demo/hero-calm-blur.jpg"
        alt={HERO_ALT}
      />,
    );
    const image = imageNamed(HERO_ALT);
    expect(pathOf(image.getAttribute('src'))).toBe(
      `${PAGES}/images/demo/hero-calm.jpg`,
    );
    expect(image.style.backgroundImage).toContain(
      `${PAGES}/images/demo/hero-calm-blur.jpg`,
    );
  });

  it("refuses the optimizer's own basePath prop — the prefix is the atom's", () => {
    // Passed through, the library would add it ON TOP of the prefixed src.
    // A TYPE assertion: it does nothing when Vitest runs and is enforced by
    // tsc (the pre-push hook and CI's typecheck) — measured: against the
    // atom before this lane it fails with TS2554.
    expectTypeOf<ImageProps>().not.toHaveProperty('basePath');
  });
});
