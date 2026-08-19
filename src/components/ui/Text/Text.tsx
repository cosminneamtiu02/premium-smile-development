import { createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

// ui/Text — body copy, one size (contract board text-atom-contract-v2,
// owner-approved fb-189). Migrated from the old repo's ui/text, narrowed
// deliberately: no `lead`, no `small`, no `div` — §15.1's 1.125rem body base
// already makes text-base the "smaller" step, and a text-bearing <div> is the
// non-semantic-container smell.
// §6 contract: content is a slot (children), tone is a typed prop, semantic
// tokens only, no outer margins, parent className merged last (§6.8).
// Server-safe by construction: no 'use client', no state, no handlers, no
// effects — a <Text> costs zero bytes of JS on the visitor's device (§16).
// §8.1: locale-agnostic. Sections pass FINISHED strings; this atom never
// calls t() and never sees a message key.
// §6.3 does NOT apply: Text is non-interactive and its children are text by
// contract, so there is no aria-label prop to demand (D6). Native aria-*
// attributes still spread through for genuine edge cases.
// Weight axis added 2026-08-19 (owner, addendum v3): `bold` → font-bold,
// orthogonal to the untouched fb-182 tone triple, CSS only (D-C: never a
// <strong> — the `as` prop alone decides the element).

export type TextElement = 'p' | 'span' | 'dt' | 'dd';
export type TextTone = 'default' | 'muted' | 'strong';

type TextOwnProps<E extends TextElement> = {
  /** Which native element wears the treatment. @default 'p' */
  as?: E;
  /**
   * Ink axis (fb-182): default → text-ink · muted → text-ink-muted ·
   * strong → text-ink-strong (speculative, no consumer yet — owner call).
   * @default 'default'
   */
  tone?: TextTone;
  /** Weight axis (owner 2026-08-19): true → font-bold (700). @default false */
  bold?: boolean;
  /** Finished text only (§8.1) — sections pass translated strings/data; never a key, never t(). */
  children: ReactNode;
};

export type TextProps<E extends TextElement = 'p'> = TextOwnProps<E> &
  Omit<ComponentPropsWithRef<E>, keyof TextOwnProps<E>>;

// D4 — the atom always emits its ink EXPLICITLY: there is no 'inherit' tone in
// v1, so a <Text> looks the same wherever it lands (§6.1 closed system). Where
// a section used to color a row wrapper and let bare dt/dd inherit (today's
// Footer hours), it passes the computed tone per element instead:
// tone={row.closed ? 'muted' : 'default'} — same token, same computed color.
const toneClasses: Record<TextTone, string> = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  strong: 'text-ink-strong',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

// D5 — Text is the repo's FIRST tag-generic atom, and the generic is the whole
// difficulty: `Omit<ComponentPropsWithRef<E>, …>` stays deferred while E is
// unresolved, so TS cannot prove it fits any ONE intrinsic tag. Spreading it
// into JSX (<Tag {...rest} />, for every shape of Tag tried) fails on ref
// variance alone: HTMLParagraphElement carries the legacy `align` member that
// HTMLSpanElement/HTMLElement lack, so RefObject<HTMLSpanElement> is not
// assignable to RefObject<HTMLParagraphElement>.
// The escape is NOT a cast — no `any`, no `as unknown` anywhere in this atom.
// Instead the internal element type is constrained explicitly: the attribute
// bag is annotated as TextRenderProps below, which is what TS checks the
// pass-through against, and createElement — literally what JSX compiles to —
// takes the tag. Checking nuance (G2-verified 2026-08-19): the bag's members
// are UNIONS across the four tags, so a shape-wrong value in the literal
// (misspelled key, wrong handler arity) fails at the annotation, while a
// value typed for the WRONG element would still pass — today the construction
// adds only `className: string`, so that hole has zero width; keep it that
// way when editing this bag.
// Consumers lose nothing vs raw JSX: `as="span"` narrows attribute and
// handler element types at the call site, and ref checking is exactly as
// strict as JSX itself — which means porous where the platform's types are:
// object refs of near-identical DOM interfaces pass structurally
// (HTMLSpanElement declares no own members in lib.dom), callback refs pass
// via @types/react's bivariance hack, while a truly foreign ref (an SVG
// element) still errors.
type TextRenderProps = Omit<
  TextProps<TextElement>,
  'as' | 'tone' | 'bold' | 'children'
>;

export function Text<E extends TextElement = 'p'>({
  as,
  tone = 'default',
  bold = false,
  className,
  children,
  ...rest
}: TextProps<E>): ReactElement {
  // `as` cannot carry a destructuring default ('p' is not assignable to a
  // still-unresolved E) — the fallback lives at the render call instead.
  const attrs: TextRenderProps = {
    ...rest,
    // §6.8 merge order: the atom's own classes first, the caller's className
    // LAST so a parent utility can win a Tailwind tie.
    // D2 — no leading-* utility, ever: text-base brings its own line-height
    // (1.5rem), which is exactly what the Footer's recipes carry today, so the
    // fb-186 rewiring stays a zero-visual-diff swap. If the older audience
    // ever wants more generous leading, the lever is --text-base--line-height
    // in globals.css — one line, every consumer at once, a declared global
    // change — never a margin or a leading class smuggled in here (§6.4).
    className: cx(
      'text-base',
      toneClasses[tone],
      bold && 'font-bold',
      className,
    ),
  };

  return createElement(as ?? 'p', attrs, children);
}
