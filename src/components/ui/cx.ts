// ui/cx.ts — the shared class-join helper (owner order fb-307, 2026-09-01:
// the G2 advisory on the Eyebrow lane counted 3 private copies, a full grep
// found TEN byte-identical ones — every atom plus slot.ts — so §4's
// used-by-2+ promotion rule applied many times over).
//
// NOT a component and NOT public API: ui-layer plumbing that sits flat beside
// the atom folders and may be imported by `ui/` modules ONLY — never by
// `sections/`, never by `app/` (§4 dependency direction, §6.1).

/**
 * Builds one className string: each part is either a string of utility
 * classes or the falsy result of a conditional (`bold && 'font-bold'`);
 * falsy parts are dropped and the rest space-joined, so
 * `cx('text-base', undefined, 'col-span-2')` → `'text-base col-span-2'`.
 *
 * STANDING RULE — every atom imports this, so widening the accepted types
 * (numbers, arrays, null, …) is a deliberate API change for all of them at
 * once, never a drive-by edit.
 */
export const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');
