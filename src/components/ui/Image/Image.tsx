import ExportedImage from 'next-image-export-optimizer';
import type { ComponentPropsWithRef } from 'react';

// THE single image wrapper (§11) — every image on the site goes through here.
// Bakes in next-image-export-optimizer (owner decision 2026-08-01, §15.5):
// build-time WebP width variants with srcset in the static HTML. width/height
// stay mandatory via the underlying types (reserved space, zero layout shift);
// lazy below the fold by default — pass `priority` for the hero (LCP, §10.6).

export type ImageProps = ComponentPropsWithRef<typeof ExportedImage>;

export function Image(props: ImageProps) {
  return <ExportedImage {...props} />;
}
