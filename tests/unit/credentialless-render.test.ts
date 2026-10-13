import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// THE MAP'S `credentialless`, rendered by BOTH Reacts that render it
// (CLAUDE.md §15.38). The attribute keeps a signed-in visitor's Google cookies
// out of the map's frame, and the first build of the lane shipped WITHOUT it:
// the source said `credentialless=""`, every Vitest check passed on npm's
// react-dom 19.2.8, and the static export — rendered by Next's own bundled
// React, a 19.3 canary that knows the attribute as BOOLEAN — dropped the empty
// string as `false` (Storybook renders with that same canary, but no story
// looked at the frame's attributes). No browser test could see it; only the built
// HTML did. So this file asks each renderer directly, and pins the spelling
// in the source to the one value both write.

const require = createRequire(import.meta.url);
// Next's bundled pair — what `next build` renders the App Router with.
const NextReact = require('next/dist/compiled/react') as typeof import('react');
const NextServer =
  require('next/dist/compiled/react-dom/server') as typeof import('react-dom/server');

const SOURCE = readFileSync(
  new URL(
    '../../src/components/sections/ClinicLocation/ClinicLocation.tsx',
    import.meta.url,
  ),
  'utf8',
);

/** The props of the map's frame that this test is about. */
const frameWith = (value: unknown) => ({ credentialless: value, allow: '' });

describe('credentialless — the map frame’s empty cookie jar, in both renderers', () => {
  // Both Reacts warn about the spellings they refuse; the warnings ARE the
  // behaviour under test, so they are captured; the one the unit tests' React raises is asserted.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is spelled as its own name in the map band — exactly once, never empty', () => {
    expect(SOURCE.match(/credentialless="credentialless"/g)).toHaveLength(1);
    expect(SOURCE).not.toMatch(/credentialless=""/);
    expect(SOURCE).not.toMatch(/credentialless=\{/);
  });

  it('is written by the EXPORT’s React — Next’s bundled one — as a boolean', () => {
    const markup = NextServer.renderToStaticMarkup(
      NextReact.createElement('iframe', frameWith('credentialless')),
    );
    expect(markup).toContain('credentialless=""');
  });

  it('would be DROPPED by the export’s React as an empty string — the trap', () => {
    const markup = NextServer.renderToStaticMarkup(
      NextReact.createElement('iframe', frameWith('')),
    );
    expect(markup).not.toContain('credentialless');
    // Silently: the static renderer (`renderToStaticMarkup`) drops it without
    // a word — measured, no console.error at all — which is how the first
    // build lost it unnoticed.
  });

  it('is written by the unit tests’ React — npm react-dom — as given', () => {
    const markup = renderToStaticMarkup(
      createElement('iframe', frameWith('credentialless')),
    );
    expect(markup).toContain('credentialless="credentialless"');
  });

  it('would be DROPPED by the unit tests’ React as `true` — the other trap', () => {
    const markup = renderToStaticMarkup(
      createElement('iframe', frameWith(true)),
    );
    expect(markup).not.toContain('credentialless');
    expect(String(vi.mocked(console.error).mock.calls[0]?.[0])).toMatch(
      /non-boolean attribute/,
    );
  });
});
