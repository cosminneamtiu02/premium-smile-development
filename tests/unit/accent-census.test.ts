import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE `--accent` CENSUS (owner, 2026-10-01: "i need them not to be that
// green. i want them to be same color as in old website on the same top bar
// buttons"). The 20th semantic role — `--accent` #746894, the old top bar's
// lavender (#8377a3) with its lightness lowered to the lightest step that
// passes body text's 4.5:1 on THE GLASS FLOOR (95 % white over black, the
// darkest ground the see-through pill and phone panel can make) — reads
// 4.52:1 there, 4.81:1 on the page ground and 5.06:1 on white, and FAILS on
// the 30 % lilac tint (3.32:1). Its charter in
// globals.css says "not for the tint"; this file keeps that promise the way
// tests/unit/ink-faint-census.test.ts keeps its ink's: every wearer is named
// below, and a new one turns this file red until it is added here — with the
// ground it sits on, which is the whole point.
//
// TWO LAYERS, because the wearers are ATOMS. ui/TextButton paints the
// lavender — and, since later the same day, so do ui/Button and
// ui/GlyphButton in their `accent` FAMILY (their THE TWO FAMILIES: the same
// faces with cta → accent, cta-hover → accent-strong, the hairline →
// inset-ring-accent) — and an atom never knows its ground (§6.1: props in,
// UI out) — so the ground travels with the files that RENDER it: the files
// that import TextButton, and the files that pass `tone="accent"` to a
// button atom, each named below with its ground. Every list is closed. (The
// Header's Contact button was pinned OUT of the list that morning — the
// owner: "contact button MUST STAY GREEN AS IT MUST JUMP INTO YOUR EYES" —
// and joined it the same evening on his own reversal: "also paint the
// contact button from top bar a lilla and make it wider, more seszable and
// adjust to widest language form"; Header.test.tsx pins the lilac on both of
// the Header's Contacts now. The fixed corner's two discs are still NOT
// wearers — "do not modify at least yet the hovering buttons from bottom
// right"; FloatingActions.test.tsx pins them green.)
//
// THE VALUE IS MEASURED HERE TOO. The ratios are computed from the tokens' own
// lines in globals.css, so a later edit to the value — the old site's exact
// #8377a3 among them, 4.09:1 on white — fails with the number in the message
// instead of waiting for a story's axe run to notice.
//
// COMMENTS ARE STRIPPED FIRST (the aura census's lesson): the wearers'
// headers explain the colour in prose containing the very spellings matched
// below, so a matcher over raw text would stay green after a class was
// deleted. The last `it` proves the stripper strips.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/**
 * Every Tailwind utility minted from `--color-accent`, whatever its variant
 * prefix or opacity modifier — never `accent-strong` or `accent-decorative`,
 * which the lookahead refuses — plus a raw `var()` read of the role.
 */
const WEARS_ACCENT =
  /\b(?:text|bg|border(?:-[trblxyse])?|outline|decoration|fill|stroke|ring|shadow|from|via|to|caret|divide|placeholder)-accent(?:\/\d+)?(?![\w-])|var\(--(?:color-)?accent\)/g;

/** The wearers — three atoms and one section — and how many spellings each carries. */
const WEARERS: Readonly<Record<string, number>> = {
  // The hover label, the underline and the active label — TextButton.tsx's
  // COLOR INVARIANT: one colour for all three.
  'components/ui/TextButton/TextButton.tsx': 3,
  // The `accent` FAMILY of the two button atoms (owner 2026-10-01): Button's
  // solid cell — the ground, the hover label, the hover hairline — and its
  // outline cell — the border, the label — spell the role five times;
  // GlyphButton's outline also FILLS with it on hover, six. (The one-step-
  // darker `accent-strong` of the press and hover faces is its own role —
  // the lookahead refuses it, so it is not counted here.)
  'components/ui/Button/Button.tsx': 5,
  'components/ui/GlyphButton/GlyphButton.tsx': 6,
  // The map band's whole-row hover: GlyphButton's solid.accent hover face
  // re-spelled with the `group-` prefix (ClinicLocation's ROW_HOVER, its
  // KEEP-IN-SYNC with the atom) — the glyph and the hairline.
  'components/sections/ClinicLocation/ClinicLocation.tsx': 2,
  // The reviewer's initials disc — its letters' ground (owner 2026-10-01: "the
  // circle of persons initials to be in lilla, not in current green"; the
  // avatar board's D3 green until then). White on it 5.06:1, measured below.
  'components/ui/Avatar/Avatar.tsx': 1,
};

/**
 * Every file that RENDERS ui/Avatar, whose letters face is the role as a
 * GROUND under white letters — the pair measured below, independent of the
 * card around it. One renderer today; a second names itself here first.
 */
const AVATAR_RENDERERS: Readonly<Record<string, string>> = {
  'components/sections/ReviewCard/ReviewCard.tsx':
    'the review card (ui/Card surface · framed · emphasized) — the disc paints its own lavender ground',
};

/**
 * Every file that RENDERS ui/TextButton, with the ground its TextButtons sit
 * on — white or nearly, never the tint. Growing this list is a deliberate
 * act: name the file AND the ground, and measure (4.5:1 for an 18px label)
 * before the row goes in.
 */
const RENDERERS: Readonly<Record<string, string>> = {
  // The menu entry of the row and of the phone's panel.
  'components/sections/Header/NavItem.tsx':
    'bg-surface/95 — the Header pill and the NavMenu panel',
  // The phone number, the site-map links and „Înapoi sus".
  'components/sections/Footer/Footer.tsx': 'bg-surface — the Footer band',
  // The price menu's categories.
  'components/sections/PriceList/PriceMenu.tsx':
    'bg-surface — the menu card, ui/Card',
};

/**
 * Every file that passes `tone="accent"` to ui/Button or ui/GlyphButton —
 * the owner's list of 2026-10-01, one row per band, with the ground. A button
 * paints its OWN ground (the solid's lavender face, the outline's white box),
 * so what the band's ground meets is the outline's border (SC 1.4.11's 3:1:
 * 4.81:1 over --page, 5.06:1 over white) — never the tint, where the role
 * fails as text. Growing this list is the same deliberate act as above.
 */
const ACCENT_TONE_CALLERS: Readonly<Record<string, string>> = {
  // The contact trigger (solid) and the services link (outline), each on its
  // own face over the veiled photograph; the link also under shadow-aura.
  'components/sections/Hero/Hero.tsx':
    'the band’s 0.40 veil — the two faces paint their own grounds',
  // The bar's Contact (solid, md, under a 10rem floor) and the panel's
  // full-width Contact — the owner's evening reversal; both on the glass,
  // whose floor is measured below.
  'components/sections/Header/Header.tsx':
    'bg-surface/95 — the Header pill (the glass floor)',
  'components/sections/Header/NavMenu.tsx':
    'bg-surface/95 — the phone’s menu panel (the glass floor)',
  // The doctor card's one link (solid).
  'components/sections/PersonnelCard/PersonnelCard.tsx':
    'bg-surface — the doctor card, ui/Card framed',
  // The four discs of the legal strip (outline).
  'components/sections/Footer/Footer.tsx':
    'bg-surface — the Footer band, the four discs',
  // prev / next under the deck (outline).
  'components/sections/ReviewsCarousel/ReviewsDeck.tsx':
    'the reviews band — the two discs on their own white box',
  // The two row discs beside the map (solid, ROW_HOVER).
  'components/sections/ClinicLocation/ClinicLocation.tsx':
    'bg-page — the map band, the two row discs on their own lavender face',
};

/** The lilac band and every band that composes it — where the role fails. */
const TINTED = [
  'components/sections/TintedBand/TintedBand.tsx',
  'components/sections/DoctorProfile/DoctorProfile.tsx',
  'components/sections/DoctorProfile/ScheduleCard.tsx',
  'components/sections/DoctorStats/DoctorStats.tsx',
];

const IMPORTS_TEXT_BUTTON = /ui\/TextButton\/TextButton['"]/;
const IMPORTS_AVATAR = /ui\/Avatar\/Avatar['"]/;
const PASSES_ACCENT_TONE = /\btone=["']accent["']/;

/** Line and block comments out; strings and code stay. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function wearings(source: string): number {
  return source.match(WEARS_ACCENT)?.length ?? 0;
}

function read(file: string): string {
  return readFileSync(join(SRC_DIR, file), 'utf8');
}

/** WCAG 2.2 relative luminance of an sRGB `#rrggbb`. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `share` of `fg` over `bg`, as a browser composites a translucent colour. */
function over(fg: string, share: number, bg: string): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return (
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(share * channel(fg, i) + (1 - share) * channel(bg, i))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** A token's hex literal, read off its own declaration line in globals.css. */
function token(css: string, name: string): string {
  const lines = css.match(
    new RegExp(`^\\s*--${name}:\\s*(#[0-9a-f]{6});`, 'gm'),
  );
  expect(
    lines,
    `--${name} declared exactly once as a hex literal`,
  ).toHaveLength(1);
  return lines![0]!.replace(/^[^#]*/, '').replace(';', '');
}

const sourceFiles = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('the `--accent` lavender has exactly its named wearers in src/ (owner 2026-10-01)', () => {
  it('is worn by the three atoms and the map band, each exactly as many times as named', () => {
    for (const [file, count] of Object.entries(WEARERS)) {
      expect(wearings(stripComments(read(file))), file).toBe(count);
    }
  });

  it('is worn nowhere else — a second wearer names itself and its ground here first', () => {
    const strangers = sourceFiles.filter((file) => {
      // globals.css DEFINES the role (its `@theme inline` line reads the
      // variable); defining is not wearing.
      if (file in WEARERS || file === 'styles/globals.css') return false;
      return wearings(stripComments(read(file))) > 0;
    });
    expect(strangers).toEqual([]);
  });

  it('reaches the page through the named renderers only, each on a white ground', () => {
    const renderers = sourceFiles.filter((file) =>
      IMPORTS_TEXT_BUTTON.test(read(file)),
    );
    expect(renderers.sort()).toEqual(Object.keys(RENDERERS).sort());
    for (const [file, ground] of Object.entries(RENDERERS)) {
      const source = stripComments(read(file));
      // The ground travels with the renderer: never the lilac tint.
      expect(source, `${file} — ${ground}`).not.toContain('--tint');
      expect(source, `${file} — ${ground}`).not.toMatch(/TintedBand/);
    }
  });

  it('is asked of the button atoms by the named callers only, each with its ground', () => {
    // Comments stripped first: the callers' headers quote the prop in prose.
    const callers = sourceFiles.filter((file) =>
      PASSES_ACCENT_TONE.test(stripComments(read(file))),
    );
    expect(callers.sort()).toEqual(Object.keys(ACCENT_TONE_CALLERS).sort());
    for (const [file, ground] of Object.entries(ACCENT_TONE_CALLERS)) {
      const source = stripComments(read(file));
      expect(source, `${file} — ${ground}`).not.toContain('--tint');
      expect(source, `${file} — ${ground}`).not.toMatch(/TintedBand/);
    }
    // The files that stay GREEN say nothing of the family: the fixed corner's
    // two discs ("do not modify at least yet …") and the contact dialog's own
    // two buttons (never asked). The Header's two files left this list the
    // evening of 2026-10-01 — the owner's reversal, recorded above.
    for (const file of [
      'components/sections/FloatingActions/FloatingActions.tsx',
      'components/sections/ContactModal/ContactModal.tsx',
    ]) {
      expect(PASSES_ACCENT_TONE.test(stripComments(read(file))), file).toBe(
        false,
      );
    }
  });

  it('grounds the initials disc through the named renderer only', () => {
    const renderers = sourceFiles.filter((file) =>
      IMPORTS_AVATAR.test(read(file)),
    );
    expect(renderers.sort()).toEqual(Object.keys(AVATAR_RENDERERS).sort());
    for (const [file, ground] of Object.entries(AVATAR_RENDERERS)) {
      const source = stripComments(read(file));
      expect(source, `${file} — ${ground}`).not.toMatch(/TintedBand/);
    }
  });

  it('never appears inside sections/TintedBand or the bands that compose it', () => {
    for (const file of TINTED) {
      const source = stripComments(read(file));
      expect(wearings(source), file).toBe(0);
      expect(IMPORTS_TEXT_BUTTON.test(source), file).toBe(false);
      expect(IMPORTS_AVATAR.test(source), file).toBe(false);
      expect(PASSES_ACCENT_TONE.test(source), file).toBe(false);
    }
  });

  it('passes 4.5:1 on the grounds of its charter, and fails on the tint it is barred from', () => {
    const css = read('styles/globals.css');
    const accent = token(css, 'accent');
    const page = token(css, 'page');
    const surface = token(css, 'surface');
    // THE GLASS FLOOR: the Header pill and the phone's menu panel are
    // bg-surface/95, so the darkest ground they can make is --surface at 95 %
    // over black. Not hypothetical — with the menu open the scrim dims the
    // page behind the panel (axe measured #f8f8f8 in the Menu Open story, and
    // the first pick, #786c98, failed there at 4.49:1); a dark photograph
    // under the scrim goes lower still. This is the ground that binds.
    const glassFloor = over(surface, 0.95, '#000000');
    // sections/TintedBand: accent-decorative at 30 % over the page ground.
    const tint = over(token(css, 'accent-decorative'), 0.3, page);

    for (const [ground, hex] of [
      ['the glass floor', glassFloor],
      ['--page', page],
      ['--surface', surface],
    ] as const) {
      const ratio = contrast(accent, hex);
      expect(
        ratio,
        `--accent ${accent} on ${ground} ${hex}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    // The reason the census exists, measured: if this ever passes, the charter's
    // "not for the tint" can be revisited — until then it stands.
    expect(contrast(accent, tint), `on the tint ${tint}`).toBeLessThan(4.5);

    // THE BUTTON FACES (the atoms' `accent` family, owner 2026-10-01), from
    // the same lines: the solid face's white label, the press face's, the
    // outline's darkened hover label on the grey — and the two reasons the
    // family is cut the way it is (Button.tsx's THE TWO FAMILIES).
    const strong = token(css, 'accent-strong');
    // The lavender outline's hover ground is --line, ONE STEP DARKER than the
    // green outline's --line-subtle (owner, the evening of 2026-10-01: "on
    // hover of vezi serviciile i want little darker shade of gray").
    const grey = token(css, 'line');
    const white = token(css, 'ink-inverse');
    for (const [name, fg, bg] of [
      // …the same pair is ui/Avatar's letters on their disc.
      ['white on the solid face (and the initials disc)', white, accent],
      ['white on the press face', white, strong],
      ["the outline's hover label on its grey, --line", strong, grey],
    ] as const) {
      const ratio = contrast(fg, bg);
      expect(ratio, `${name}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    // Why the hover label darkens one step: accent itself misses 4.5:1 on the
    // grey — and why the border may stay accent there: it clears 1.4.11's 3:1.
    const onGrey = contrast(accent, grey);
    expect(onGrey, `accent on line: ${onGrey.toFixed(2)}:1`).toBeLessThan(4.5);
    expect(onGrey).toBeGreaterThanOrEqual(3);
    // …and why the GREEN cell keeps the lighter grey, measured: cta-hover
    // misses 4.5:1 on --line and clears it on --line-subtle, so Button.tsx
    // scopes the darker grey to the accent cell — the family's declared
    // fourth substitution, which Button.test's derivation names.
    const ctaHover = token(css, 'cta-hover');
    const ctaHoverOnLine = contrast(ctaHover, grey);
    expect(
      ctaHoverOnLine,
      `cta-hover on line: ${ctaHoverOnLine.toFixed(2)}:1`,
    ).toBeLessThan(4.5);
    const ctaHoverOnSubtle = contrast(ctaHover, token(css, 'line-subtle'));
    expect(
      ctaHoverOnSubtle,
      `cta-hover on line-subtle: ${ctaHoverOnSubtle.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('strips the prose mention, so the count is the class and not the comment', () => {
    // A guard that cannot fail is not a guard: the atom's header mentions the
    // spellings in prose, so the raw text must count MORE than the stripped.
    const raw = read('components/ui/TextButton/TextButton.tsx');
    expect(wearings(raw)).toBeGreaterThan(wearings(stripComments(raw)));
    expect(stripComments('a // text-accent\n/* bg-accent */ b')).toBe('a \n b');
    // …and the lookahead keeps the two siblings out of the count.
    expect(wearings('text-accent-strong bg-accent-decorative')).toBe(0);
    expect(wearings('hover:text-accent after:bg-accent text-accent/50')).toBe(
      3,
    );
  });
});
