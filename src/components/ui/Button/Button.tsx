import type { ComponentPropsWithRef } from 'react';

// Phase 0 pipeline probe (playbook: "an empty Button story renders…").
// §6-compliant but deliberately minimal — the real Button contract is designed
// through /new-atom in Phase 2 and may replace this wholesale.

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  /** Genuine visual variants only (§6.2) — content always comes via children. */
  variant?: 'primary' | 'ghost';
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-cta text-ink-inverse hover:bg-cta-hover'
      : 'bg-transparent text-ink hover:bg-line-subtle';

  return (
    // Native <button>, semantic tokens only, no outer margins (§6.1/§6.4);
    // min-h-11 = 44px primary target (§9); rounded-md = the 6px default (§15.1);
    // parent className merged for positioning, never restyling (§6.8).
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none ${variantClasses} ${className}`}
      {...rest}
    />
  );
}
