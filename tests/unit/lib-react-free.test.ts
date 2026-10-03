import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE REACT-FREE FOUNDATION-RING FENCE (CLAUDE.md §4 + §15.15; the cx-to-lib
// lane's G2 LOW, 2026-09-02). src/lib/ is importable from every tier and from
// plain Node — build tooling, this very node test project — precisely because
// it drags no framework in. That rule lived only in comments (lib/cx.ts's
// two-question home test, scroll-lock's "no React in it"); a comment-only
// invariant breaks silently. This test is the machine: the moment any lib file
// imports react/react-dom/next/next-intl — statically, as a side-effect
// import, or dynamically — the fast unit project (and the pre-push hook, and
// CI) goes red naming the file and the specifier.
//
// Mechanism note (§15.15 offered two): the eslint `no-restricted-imports`
// variant fires earlier (at typing time) but requires editing
// eslint.config.mjs, which the ECC config-protection hook bars agent sessions
// from touching. This source-guard is the other sanctioned mechanism — same
// red, one gate later. If the eslint fence is ever added by the owner, keep
// BOTH: lint for feedback speed, this for depth (it also catches dynamic
// import(), which no-restricted-imports does not).
//
// Type-only imports are banned too, deliberately: `import type` vanishes at
// runtime, but it still couples lib/'s build to React's type packages and
// normalizes the specifier in the one folder whose promise is its absence.
// A genuine future need for a React type in lib/ is a §15-class decision,
// not a quiet import.

const LIB_DIR = fileURLToPath(new URL('../../src/lib', import.meta.url));

/** Framework specifiers the ring must never name, as whole first segments —
 * 'react' and 'react-dom/client' match; 'react-aria-like-lib' would not. */
const BANNED = /^(react|react-dom|next|next-intl)(\/|$)/;

/** Every import specifier a TS source names: static `import … from 'x'`,
 * side-effect `import 'x'`, re-export `export … from 'x'`, and dynamic
 * `import('x')`. Regex over source text is enough here: lib files are plain
 * TS modules, and a false positive inside a comment or string would surface
 * loudly in review rather than ship a silent hole. */
function importSpecifiers(source: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\bimport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) out.push(match[1]);
  }
  return out;
}

describe('src/lib is the React-free foundation ring (§4, §15.15)', () => {
  const files = readdirSync(LIB_DIR, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .sort();

  it('contains files to guard (the fence never passes vacuously)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('names no react/react-dom/next/next-intl specifier in any lib file', () => {
    const offenders = files.flatMap((name) => {
      const source = readFileSync(join(LIB_DIR, name), 'utf8');
      return importSpecifiers(source)
        .filter((specifier) => BANNED.test(specifier))
        .map((specifier) => `${name} → ${specifier}`);
    });
    // A hit means framework code entered the ring. Move the logic beside the
    // components (ui/ flat modules — the lib/cx.ts two-question test), or take
    // the §15-class decision out loud; never widen BANNED to get green.
    expect(offenders).toEqual([]);
  });
});
