// THE `credentialless` IFRAME ATTRIBUTE, taught to TypeScript (CLAUDE.md
// §15.38). HTML's anonymous-iframe attribute gives the frame a fresh, EMPTY
// cookie jar of its own, thrown away when the page closes — so Google's map
// can neither send nor read the Google cookies a signed-in visitor already
// has (measured 2026-10-01: 19 of 46 requests carried one in Chromium, 0 with
// the attribute; COOKIES.md §3). Chrome, Edge, Opera and Samsung Internet
// honour it; Safari blocks those cookies anyway and Firefox keeps each site's
// cookies apart. It is a BOOLEAN attribute: present means on, whatever value.
//
// @types/react does not list the attribute yet, so this module adds it to
// React's own iframe props by declaration merging. A `.ts` module and not a
// `.d.ts` ON PURPOSE (the TypeScript review, 2026-10-10): tsconfig's
// `skipLibCheck` skips every `.d.ts`, the project's own included, so a
// declaration file would be merged unchecked. As a module it is type-checked
// like any source file — and the day @types/react declares the attribute
// itself, TypeScript reports the clash (TS2717) HERE, naming this file:
// delete it then.
//
// ── THE ONE SPELLING THAT SHIPS: the attribute's own name as its value. Two
// Reacts render this component, and they disagree (measured 2026-10-10):
//   · the EXPORT's — Next's bundled React, 19.3.0-canary — knows the attribute
//     as a boolean: `true` and any non-empty string write `credentialless=""`,
//     while an EMPTY STRING counts as false and is dropped, with a dev warning.
//     The first build of this lane shipped the empty string and the static
//     HTML carried no attribute at all;
//     Storybook renders with this one too: vite-plugin-storybook-nextjs
//     aliases `react` and `react-dom` to Next's bundled copies;
//   · the unit and components tests' — npm `react-dom` 19.2.8, under Vitest —
//     does not know it: `true` is dropped with a warning, any string is
//     written as given.
// `"credentialless"` is truthy for the first and a string for the second, so
// both write the attribute. The type allows that value alone;
// tests/unit/credentialless-render.test.ts renders it through BOTH Reacts.
import 'react';

declare module 'react' {
  // `T` is React's own type parameter, unused here: the declaration mirrors
  // React's `IframeHTMLAttributes<T>` so the two read as one interface.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface IframeHTMLAttributes<T> {
    credentialless?: 'credentialless';
  }
}
