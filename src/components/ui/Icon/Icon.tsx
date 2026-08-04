import type { ComponentPropsWithRef, ReactElement, SVGProps } from 'react';
import { GLYPHS, type Glyph } from '@/assets/glyphs';

// ui/Icon — the glyph atom (migrated per the approved 2026-08-05 canvas plan
// .claude/plans/icon-atom.plan.md; replaces the lucide-react dependency AND
// the habit of pasting <svg> blobs at call sites).
// §6 contract: the glyph is chosen by name from the glyphs/ registry, size is
// a typed variant prop, color arrives from the parent via currentColor only,
// no outer margins, parent className merged last (§6.8).

export type IconName = keyof typeof GLYPHS;
export type IconSize = 'sm' | 'md' | 'lg';

type IconOwnProps = {
  /** Which glyph — a unique file in glyphs/; a typo cannot compile. */
  name: IconName;
  /**
   * Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem.
   * Parents may still size it from the outside with a descendant utility
   * (`[&_svg]:size-5`, the composed-control pattern) — they win by CSS
   * specificity, (0,1,1) over this class's (0,1,0), in every browser.
   */
  size?: IconSize;
  /**
   * A NON-EMPTY label flips decorative → semantic: adds role="img" plus this
   * name and drops the default aria-hidden. Empty or whitespace-only counts
   * as absent — a nameless role="img" is an axe violation, so this atom
   * cannot produce one. Already-translated text, never a key (§8.1). Rare:
   * normally the interactive parent owns the accessible name.
   */
  'aria-label'?: string;
};

export type IconProps = IconOwnProps &
  Omit<ComponentPropsWithRef<'svg'>, keyof IconOwnProps | 'children'>;

// rem-based so browser zoom and user font settings scale the glyph (§7);
// shrink-0 keeps it square inside a flex row of text.
const sizeClasses: Record<IconSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

// The two glyph families, absorbed here so callers never learn which one a
// name belongs to (plan §4d). Both resolve their paint from currentColor =
// the parent's CSS `color`, which is why a parent's text-* utility (or a
// hover fade) recolors the icon with zero coordination code. NO literal
// color exists anywhere in this atom or in the registry.
// Keyed by Glyph['mode'] on purpose: a third family cannot be added to the
// registry without classifying it here — the file stops typechecking first.
// Only paint channels may live in a mode bundle: a `width`, `className` or
// aria key here would silently outrank the component logic at the spread
// site — Pick turns that into a compile error instead of a review item.
type PaintAttrs = Pick<
  SVGProps<SVGSVGElement>,
  'fill' | 'stroke' | 'strokeWidth' | 'strokeLinecap' | 'strokeLinejoin'
>;

const MODE_ATTRS: Record<Glyph['mode'], PaintAttrs> = {
  stroke: {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  fill: { fill: 'currentColor' },
};

export function Icon({
  name,
  size = 'md',
  className,
  ...rest
}: IconProps): ReactElement {
  const { mode, d } = GLYPHS[name];
  // Decorative by default (§9, plan §4e): screen readers skip the glyph and
  // the interactive parent owns the accessible name (§6.3). A NON-EMPTY label
  // flips it to a semantic image — role + name, and aria-hidden gone
  // entirely, never spelled aria-hidden="false". Empty/whitespace labels stay
  // decorative: role="img" without a name is an axe fail (svg-img-alt), and
  // Storybook's cleared text control hands us '' live, not undefined.
  const label = rest['aria-label'];
  const labelled = typeof label === 'string' && label.trim() !== '';

  // width/height attributes are never emitted: they would win over the CSS
  // box and defeat both the size presets and a parent's descendant override.
  // `rest` is spread last for native-element fidelity (§6.8) — className is
  // destructured out above so it can only ever be merged, not replaced.
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx(sizeClasses[size], 'shrink-0', className)}
      {...MODE_ATTRS[mode]}
      {...(labelled ? { role: 'img' } : { 'aria-hidden': true })}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
