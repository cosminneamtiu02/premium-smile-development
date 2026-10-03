// Vite's `?raw` import suffix, typed for this repo — and nothing else.
//
// WHY THREE LINES OF OUR OWN INSTEAD OF `/// <reference types="vite/client" />`
// (G2 typescript-reviewer, F7 — the reference shipped in Wordmark.test.tsx and
// was removed): a triple-slash reference is not file-scoped. TypeScript hoists
// it into the WHOLE PROGRAM, so one test file asking for one module type
// silently re-typed everything:
//   · `import.meta.env` becomes `any` repo-wide — every env read loses its
//     type, and a typo in one stops being a compile error;
//   · untyped CSS side-effect imports (`import './anything.css'`) become
//     legal everywhere, so a wrong path stops failing too;
//   · vite/client redeclares the image modules next-env.d.ts already declares
//     — 18 duplicate identifiers whose winner depends on file order, hidden
//     today only by `skipLibCheck: true`.
// The `?raw` idiom itself is sound and stays: Wordmark.test.tsx reads its own
// source to prove the section ships no 'use client' directive (§16), which no
// runtime assertion can see. This declaration gives that one import a type and
// grants nothing else.
//
// No import and no reference is needed to reach it: tsconfig's `**/*.ts`
// include picks this file up as an ambient declaration, which is exactly the
// scope a build-tool suffix deserves.

declare module '*?raw' {
  const source: string;
  export default source;
}
