import { expect, type Locator, type Page, test } from '@playwright/test';
import ro from '../../src/messages/ro.json';

// EVERY BUTTON FACE KEEPS ITS EDGE IN FORCED COLOURS — against the built
// export (fix lane `fix/dialog-scroll-forced-colors`, 2026-10-26; CLAUDE.md
// §15.23, §15.25 and §15.30 round 5 recorded it, BACKLOG.md entry 2 listed
// it). In forced colours (Windows High Contrast) the browser repaints every
// colour from the visitor's palette and drops every box-shadow, so a face whose
// edge WAS its colour lost it: MEASURED on develop's export under Chromium's
// emulation, ui/Button's and ui/GlyphButton's solid and ghost faces drew as
// bare text or a bare glyph on the page's own ground — the doctor card's „Mai
// multe despre mine", the contact dialog's call and WhatsApp controls (the
// site's one conversion goal), the bar's Contact, the corner discs, the burger,
// the dialog's ✕ — while the outline faces kept their 1px border. The cure is
// one utility in each atom's base row (Button.tsx's THE FORCED-COLOURS
// BOUNDARY): a 1px currentColor border under the `forced-colors:` variant.
//
// This walks the faces the site SHIPS, on the pages that ship them, each in a
// FRESH browser context — `forcedColors` is a context option here
// (contextOptions, set when the test's own context is created), never an
// emulation toggled inside a shared tab (the Vitest browser tab is shared
// across files, and an emulation left on there leaks into every later test:
// tests/unit/no-touch-emulation.test.ts says why). For each face: in forced
// colours a border on all four sides, solid, at least 3:1 against the page's
// own ground, and the keyboard's ring still drawn outside it; outside forced
// colours the atom's own border, exactly — the cure moves nothing there. The
// faces no page wears (the green family, ui/Button's ghost) are pinned by
// class in Button.test.tsx and GlyphButton.test.tsx. Every forced-colours case
// of a solid or ghost face is RED on develop's export.
//
// Chromium only, like the rest of the suite: WebKit reports the media query
// but repaints nothing (macOS has no forced colours), and Firefox's emulation
// is the lane's probe, not a project here (Button.tsx records both).

test.use({ locale: 'ro-RO' });

type Face = Readonly<{
  /** What the visitor sees, and which atom face it is. */
  name: string;
  path: string;
  /** A phone window for the controls that only a phone shows. */
  phone?: boolean;
  /** Opens the contact dialog first: the face lives inside it. */
  inDialog?: boolean;
  find: (page: Page) => Locator;
  /** The face's own border outside forced colours — what must not move. */
  ownBorder: '0px' | '1px';
}>;

const BAR_CONTACT = 'header button[aria-haspopup="dialog"]';

const FACES: readonly Face[] = [
  {
    name: 'the bar’s Contact — Button solid, a <button>',
    path: '/ro/team/',
    find: (page) => page.locator(BAR_CONTACT),
    ownBorder: '0px',
  },
  {
    name: 'the doctor card’s „Mai multe despre mine" — Button solid, an <a>',
    path: '/ro/team/',
    find: (page) =>
      page
        .getByRole('link', {
          name: new RegExp(`^${ro.team.showcase.profile}`),
        })
        .first(),
    ownBorder: '0px',
  },
  {
    name: 'the dialog’s call control — Button solid, an <a>',
    path: '/ro/team/',
    inDialog: true,
    find: (page) => page.locator('dialog[open] a[href^="tel:"]'),
    ownBorder: '0px',
  },
  {
    name: 'the dialog’s WhatsApp control — Button solid, an <a>',
    path: '/ro/team/',
    inDialog: true,
    find: (page) => page.locator('dialog[open] a[href*="wa.me"]'),
    ownBorder: '0px',
  },
  {
    name: 'the dialog’s ✕ — GlyphButton ghost square, a <button>',
    path: '/ro/team/',
    inDialog: true,
    find: (page) =>
      page.locator(`dialog[open] button[aria-label="${ro.contact.close}"]`),
    ownBorder: '0px',
  },
  {
    name: 'the Home hero’s Contact — Button solid, a <button>',
    path: '/ro/',
    find: (page) => page.locator('main button[aria-haspopup="dialog"]'),
    ownBorder: '0px',
  },
  {
    name: 'the Home hero’s services link — Button outline, an <a>',
    path: '/ro/',
    find: (page) => page.locator('main a[href$="/services/"]').first(),
    ownBorder: '1px',
  },
  {
    name: 'the reviews deck’s arrow — GlyphButton outline round, a <button>',
    path: '/ro/',
    find: (page) =>
      page.getByRole('button', { name: ro.home.reviews.previous }),
    ownBorder: '1px',
  },
  {
    name: 'the corner call disc — GlyphButton solid round, an <a>',
    path: '/ro/team/',
    find: (page) => page.locator('a.fixed[href^="tel:"]'),
    ownBorder: '0px',
  },
  {
    name: 'the footer’s call disc — GlyphButton outline round, an <a>',
    path: '/ro/team/',
    find: (page) =>
      page.locator('footer [data-footer-socials] a[href^="tel:"]'),
    ownBorder: '1px',
  },
  {
    name: 'the burger — GlyphButton ghost square, a <button>',
    path: '/ro/team/',
    phone: true,
    find: (page) => page.locator('header button[aria-controls="header-menu"]'),
    ownBorder: '0px',
  },
];

/** Load the face's page, hydrated, and open the dialog when the face is in it. */
async function reach(page: Page, face: Face): Promise<Locator> {
  if (face.phone) await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(face.path);
  const island = face.phone
    ? 'header button[aria-controls="header-menu"]'
    : face.inDialog
      ? BAR_CONTACT
      : null;
  if (island) {
    await page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        return (
          element !== null &&
          Object.keys(element).some((key) => key.startsWith('__reactProps'))
        );
      },
      island,
      { timeout: 15_000 },
    );
  }
  if (face.inDialog) {
    await page.locator(BAR_CONTACT).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  }
  const element = face.find(page);
  await expect(element).toHaveCount(1);
  return element;
}

/** sRGB relative luminance (WCAG 2.2) of a computed `rgb(…)` / `rgba(…)`. */
function luminance(colour: string): number {
  const channels = colour
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  if (!channels || channels.length < 3) {
    throw new Error(`not an rgb() colour: ${colour}`);
  }
  const [r, g, b] = channels.map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
};

/** The face's four edges and its ring, and the page ground they stand on. */
const readFace = (element: Locator) =>
  element.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      widths: [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ],
      styles: [
        style.borderTopStyle,
        style.borderRightStyle,
        style.borderBottomStyle,
        style.borderLeftStyle,
      ],
      colour: style.borderTopColor,
      ground: getComputedStyle(document.body).backgroundColor,
      forced: window.matchMedia('(forced-colors: active)').matches,
      focusVisible: node.matches(':focus-visible'),
      outline: {
        style: style.outlineStyle,
        width: style.outlineWidth,
        offset: style.outlineOffset,
        colour: style.outlineColor,
      },
    };
  });

test.describe('in forced colours — a fresh forced context per face', () => {
  test.use({
    contextOptions: { forcedColors: 'active', reducedMotion: 'reduce' },
  });

  for (const face of FACES) {
    test(`${face.name}: a visible edge at rest, the ring outside it on focus`, async ({
      page,
    }, testInfo) => {
      test.skip(
        face.phone === true && testInfo.project.name !== 'laptop-1366x633',
        'a phone window; one project is enough',
      );
      const element = await reach(page, face);

      const rest = await readFace(element);
      expect(rest.forced, 'the context really is in forced colours').toBe(true);
      for (const width of rest.widths) {
        expect(
          parseFloat(width),
          'every side has an edge',
        ).toBeGreaterThanOrEqual(1);
      }
      expect(rest.styles).toEqual(['solid', 'solid', 'solid', 'solid']);
      expect(
        contrast(rest.colour, rest.ground),
        `the edge (${rest.colour}) against the page (${rest.ground})`,
      ).toBeGreaterThanOrEqual(3);

      // The keyboard's ring: a key first, so the focus counts as the
      // keyboard's (:focus-visible), then the face takes focus.
      await page.keyboard.press('Shift');
      await element.focus();
      const focused = await readFace(element);
      expect(focused.focusVisible, 'the ring’s premise').toBe(true);
      expect(focused.outline.style).toBe('solid');
      expect(parseFloat(focused.outline.width)).toBeGreaterThanOrEqual(2);
      expect(parseFloat(focused.outline.offset)).toBeGreaterThanOrEqual(0);
      expect(
        contrast(focused.outline.colour, focused.ground),
        `the ring (${focused.outline.colour}) against the page`,
      ).toBeGreaterThanOrEqual(3);
    });
  }
});

test.describe('outside forced colours — the cure moves nothing', () => {
  test.use({
    contextOptions: { forcedColors: 'none', reducedMotion: 'reduce' },
  });

  for (const face of FACES) {
    test(`${face.name}: the atom's own border, exactly`, async ({
      page,
    }, testInfo) => {
      test.skip(
        face.phone === true && testInfo.project.name !== 'laptop-1366x633',
        'a phone window; one project is enough',
      );
      const element = await reach(page, face);
      const rest = await readFace(element);
      expect(rest.forced).toBe(false);
      expect(rest.widths).toEqual([
        face.ownBorder,
        face.ownBorder,
        face.ownBorder,
        face.ownBorder,
      ]);
    });
  }
});
