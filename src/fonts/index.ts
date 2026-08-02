import localFont from 'next/font/local';

// Self-hosted variable subsets (brief §8.8 — never a font CDN). The woff2 files
// are produced from the Google Fonts variable TTFs (OFL) by a one-off subset
// step: Latin + Latin-Ext incl. Romanian comma-below Șș Țț (U+0218–021B) and
// ăâî, German äöüß + ẞ (U+1E9E), French/Italian accents, punctuation, €.
// Any regenerated file must be re-verified in the Phase 0 glyph story.

export const serif = localFont({
  src: './SourceSerif4Variable-subset.woff2',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-source-serif',
});

export const mono = localFont({
  src: './JetBrainsMonoVariable-subset.woff2',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  // Eyebrows / micro-labels only — not worth blocking first paint for.
  preload: false,
  variable: '--font-jetbrains-mono',
});
