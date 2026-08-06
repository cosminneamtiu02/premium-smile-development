import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

// ui/slot.ts — the shared asChild engine (owner decision fb-64, 2026-08-05,
// plan .claude/plans/icon-button.plan.md §7 D7). Extracted verbatim from
// Button, which now delegates to it; GlyphButton was its second caller.
//
// NOT a component and NOT public API: this is ui-layer plumbing that sits
// flat beside the atom folders and may be imported by `ui/` atoms ONLY —
// never by `sections/`, never by `app/`. Call sites compose atoms, not their
// internals (§4 dependency direction, §6.1).
//
// STANDING RULE — editing this file = editing every atom that imports it.
// The editing run's visual manifest must declare all consumer atoms' stories,
// which is what makes sharing safe here: the visual net turns a silent
// cross-atom regression into a loud undeclared diff.

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

// <button>-only props that must never land on a slotted child: anchors have
// no disabled state and no form association. ('type' can never actually reach
// the merge loop — atoms destructure it away with a default — but is listed so
// the invariant reads complete in one place.)
export const BUTTON_ONLY_PROPS: ReadonlySet<string> = new Set([
  'type',
  'disabled',
  'form',
  'formAction',
  'formEncType',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'name',
  'value',
]);

/**
 * Turn the single child element INTO the control: it keeps everything it
 * declares, receives the owner's remaining props, and wears the owner's
 * classes merged with its own.
 *
 * @param owner        the calling atom's display name — it names the thrown
 *                     error and the dev warning, so misuse points at the
 *                     component the author actually wrote.
 * @param children     the atom's children slot — must be exactly one element.
 * @param ownClassName the atom's fully assembled class string (its own
 *                     classes plus the caller's className, already merged).
 * @param rest         the atom's remaining props, after destructuring.
 * @param disallow     props that are meaningless on a slotted child; they are
 *                     dropped and reported once, in dev only.
 */
export function slotClone(
  owner: string,
  children: ReactNode,
  ownClassName: string,
  rest: Record<string, unknown>,
  disallow?: ReadonlySet<string>,
): ReactElement {
  // This guard must run FIRST so misuse (text, arrays, nothing) surfaces
  // this actionable message — React's own Children.only would preempt it
  // with a generic one, which is why it is not used here.
  if (
    !isValidElement<{ className?: string; [key: string]: unknown }>(children)
  ) {
    throw new Error(
      `${owner} with asChild expects exactly one element child (e.g. an <a> or <Link>).`,
    );
  }
  // Every prop the child declares WITH A DEFINED VALUE is kept (child wins
  // conflicts — React 19 exposes `ref` inside props, so this check covers ref
  // too; never add 'ref' to a disallow set), then the owner's remaining props
  // are added and the class strings merged — parent positioning classes stay
  // routed through the atom (§6.8).
  // `=== undefined`, not `in`: a child written as the ordinary conditional
  // `aria-label={cond ? x : undefined}` has the key present but empty. React
  // itself treats undefined props as absent — counting them as "child
  // declared it" would silently discard the owner's type-REQUIRED aria-label
  // and render a nameless control (G2 a11y finding, 2026-08-05; the one
  // deliberate divergence from the pre-extraction Button engine).
  const merged: Record<string, unknown> = {};
  const ignored: string[] = [];
  for (const [key, value] of Object.entries(rest)) {
    if (disallow?.has(key)) {
      ignored.push(key);
      continue;
    }
    if (children.props[key] === undefined) merged[key] = value;
  }
  if (ignored.length > 0 && process.env.NODE_ENV !== 'production') {
    console.error(
      `${owner}: ${ignored.join(', ')} has no effect with asChild — put behaviour props on the child element itself.`,
    );
  }
  merged.className = cx(ownClassName, children.props.className);
  return cloneElement(children, merged);
}
