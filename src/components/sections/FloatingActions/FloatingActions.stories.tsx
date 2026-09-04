import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { nativeNames } from '@/i18n/locales';
import de from '@/messages/de.json';
import { FloatingActions } from './FloatingActions';

// The FIRST section story file — it fixes the tier's conventions in one place.
//
// · The `Sections/*` title prefix routes the visual net to 390 + 1536
//   (tests/visual/stories.spec.ts, §13); the 'stress-320' tag on Clearance320
//   adds the 320px accessibility width on top of those two.
// · EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals`, and pairs it
//   with a MATCHING `parameters.nextjs.navigation.pathname`. The locale toolbar
//   is NOT this file's control surface any more (it was, until the placeholder
//   pill became the real language dial on 2026-08-28) — and the reason is a
//   correctness one, not a convention:
//     the dial builds each href from BOTH halves — the READER's locale
//     (next-intl) and the ROUTE (Next's pathname). @/i18n/href's stripLocale
//     removes the reader's own prefix and nothing else, so a toolbar flip to
//     German over a story still pretending to be on '/ro/services' produces
//     '/en/ro/services/' and '/ro/ro/services/': the reader says "strip /de",
//     the address says "/ro/…", and nothing matches. That state cannot exist in
//     production — the [locale] URL segment and the page's locale ARE the same
//     fact (§5: the shell is dictated by the locale segment) — so a story must
//     never stage it. Pin both together, or pin neither.
//   DE therefore lives in its OWN story (GermanOpen) rather than behind a
//   toolbar flip, which is also the Header/Footer/LanguageSwitcher convention:
//   the visual runner opens stories by URL with no toolbar state at all.
// · The prose is story-local page GROUND, not component copy: this section
//   renders no visible text of its own. Romanian with diacritics per §15.7 —
//   including in GermanOpen, where the CORNER is what is being stressed.
// · layout 'fullscreen' because the controls are `fixed`: Storybook's default
//   1rem padding would put the story's ground and the viewport-anchored discs
//   on two different rulers, which is precisely what these stories measure.
// · `nextjs.navigation` gives the story a real address for the language dial to
//   read: @storybook/nextjs-vite feeds '/ro/services' through Next's own
//   app-router contexts, where @/i18n/navigation's usePathname unprefixes it to
//   '/services' and the four alternate hrefs are built from that. Without
//   `appDirectory: true` the framework mounts the pages-router mock instead and
//   the hook reads null (our hook takes that as the root rather than crashing).
// · In both grounds FloatingActions is the LAST child — the Phase 4 mount
//   contract. Since the clearance spacer was removed (owner, 2026-09-04) the
//   section renders nothing in normal flow at all, so that placement is now
//   about DOM and tab order rather than geometry; the grounds keep it because
//   it is what the shell does.
//
// ── WHAT THE 2026-08-28 SWAP CHANGED IN THESE PICTURES. The bottom-left corner
// was an inert white pill standing in for the language switcher; it is now the
// real dial, so both baselines show a FILLED disc printing the current code
// (ink, D4 — green stays reserved for the one action this site is for). The
// 1536 shots additionally show the `2xl` size step on BOTH corners at once
// (72px, D16 · F2), which is the whole point of sampling that width: the pair
// scales from one number and must still read as one row.
//
// Both grounds are deliberately SHORT. The visual spec captures fullPage, and a
// document taller than the viewport renders fixed elements at a mid-document
// position in the stitched image — an unreadable baseline. Scroll behaviour is
// covered by the interaction tests; these stories pin the GEOMETRY.

const meta = {
  title: 'Sections/FloatingActions',
  component: FloatingActions,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/ro/services' } },
  },
} satisfies Meta<typeof FloatingActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The everyday picture: a short page with content at the top, the language dial
 * bottom-left and the call CTA bottom-right — two boxes of the SAME size (3.5rem
 * up to xl, 4rem at xl, 4.5rem at 2xl) sitting 1rem clear of the bottom edge, on
 * one z-40 layer over ordinary page ground.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  render: () => (
    <div className="min-h-screen px-4 py-8">
      <div className="flex max-w-prose flex-col gap-4">
        <p>Clinica este deschisă de luni până vineri, între orele 9 și 18.</p>
        <p>
          Programările se fac telefonic. Vă răspundem în cel mult o zi
          lucrătoare și vă propunem prima oră liberă din cabinet.
        </p>
      </div>
      <FloatingActions />
    </div>
  ),
};

/**
 * Clearance 320 — the reflow stress width (§7, §9), and the story that shows
 * what the two corner bands actually sit on.
 *
 * ── WHAT THIS PICTURE MEANS SINCE 2026-09-04. It used to make the clearance
 * SPACER earn its place: the ground is BOTTOM-ALIGNED (`justify-end`, no bottom
 * padding) so the last line landed exactly one spacer above the document edge,
 * and the visible gap between that rule and the tops of the discs was the
 * spacer's arithmetic, photographed. The owner removed the spacer, on the
 * ground that the corners cover page ground and nothing operable
 * (FloatingActions.tsx §3 carries the decision in full).
 *
 * So the ground is kept EXACTLY as it was, and the picture now says the other
 * half of the same sentence: with content pushed hard against the bottom edge,
 * this is precisely how much of a final line the two discs overlap at the
 * narrowest supported width. That is the worst case by construction — a
 * top-aligned page cannot reach the bands at all — and it is the baseline that
 * would move the moment someone re-introduced clearance, changed a
 * `--disc-size` step, or shifted a corner's offset.
 *
 * What it deliberately does NOT show is a violation: the marked line is page
 * PROSE, not a control. The rule that keeps real controls out of these bands is
 * the page-composition rule (FloatingActions' obligation (b), playbook
 * mount-contract box 5), which the removal promoted from belt-and-braces to the
 * primary guarantee — and the Footer's legal strip already complies (centred
 * below @3xl, inset >= 88px above).
 *
 * The last line is a marked one so a diff is readable at a glance, and nothing
 * here may require horizontal scrolling at 320px.
 */
export const Clearance320: Story = {
  globals: { locale: 'ro' },
  tags: ['stress-320'],
  render: () => (
    <div className="flex min-h-screen flex-col justify-end px-4 pt-8">
      <div className="flex max-w-prose flex-col gap-4">
        <p>
          Programările se fac telefonic, între orele 9 și 18. Vă răspundem în
          cel mult o zi lucrătoare și vă propunem prima oră liberă din cabinet.
        </p>
        <p className="border-t border-line pt-3 font-mono text-base">
          ULTIMUL RÂND DE CONȚINUT — trebuie să rămână vizibil.
        </p>
      </div>
      <FloatingActions />
    </div>
  ),
};

/**
 * The bulb's accessible name as the shipped data builds it — never a typed-out
 * literal, or the story keeps passing after someone edits de.json.
 */
const germanBulbName = de.common.language.switch.replace(
  '{name}',
  nativeNames.de,
);

/**
 * Open the dial the way a visitor would, idempotently: the visual runner clicks
 * the same bulb through the 'pin-open' tag, and both orderings must end OPEN.
 * Written against the FIRST [aria-expanded] in the canvas — which is the bulb,
 * since the call CTA (GlyphButton) carries none.
 *
 * A COPY of LanguageSwitcher.stories' openPlay, on purpose: the two files stage
 * different things (the section alone vs the section inside its corner) and a
 * shared helper between story files would make one file's baseline depend on
 * the other's edits — the same keep-in-sync convention ui/disc.ts' consumers
 * use for their transition lists.
 *
 * It ends by BLURRING the bulb, and that is not tidying: whoever clicked last
 * leaves focus on it, and a play-function click focuses with keyboard modality
 * (ring) while the runner's real mouse click does not (no ring). The baseline
 * would then encode WHICH of the two won the race — a flake with a screenshot
 * attached. Blurring lands both orderings on the same pixels, and the dial
 * stays open because the atom ignores a blur with no relatedTarget (D11, the
 * Safari rule).
 */
/** The context Storybook hands a play function — borrowed off Story so it
 *  cannot drift from the framework's own type. */
type PlayContext = Parameters<NonNullable<Story['play']>>[0];

const openPlay = async ({
  canvas,
  userEvent,
}: PlayContext): Promise<HTMLElement> => {
  const bulb = canvas
    .getAllByRole('button')
    .find((button) => button.hasAttribute('aria-expanded'));
  if (!bulb) throw new Error('FloatingActions stories: no bulb in this canvas');
  if (bulb.getAttribute('aria-expanded') !== 'true') {
    await userEvent.click(bulb);
  }
  await waitFor(() => expect(bulb).toHaveAttribute('aria-expanded', 'true'));
  bulb.blur();
  // …and it must SURVIVE that blur: if focus-out ever stopped ignoring a null
  // relatedTarget, every "open" baseline would quietly become a picture of a
  // closed dial.
  await expect(bulb).toHaveAttribute('aria-expanded', 'true');
  // Handed back so a story can go on asserting about the control it opened,
  // without hunting for it a second time.
  return bulb;
};

/**
 * German, open — the ONLY baselines that photograph the unfolded dial IN THE
 * HOST'S CONFIGURATION, which is the one thing neither ui/SpeedDial's stories
 * (no corner) nor Sections/LanguageSwitcher's (no corner, no CTA) can show:
 *
 *  · the `--disc-size` steps reaching the STEM. The discs derive from the
 *    bulb's own variable, so at 1536 the whole thermometer scales together
 *    (72px bulb over ≈57px discs) while the call CTA grows to match — one
 *    number, two corners (D16 · F2);
 *  · `--stem-inset` doing its job: the corner passes its own 1rem offset + the
 *    safe area + the Header pill's 5rem reach, and the atom's extreme-zoom cap
 *    reads it;
 *  · at 320 (the 'stress-320' tag) the D6 claim itself — an `up` stem clears
 *    the call CTA, which is exactly why the corner does not open `right`.
 *
 * DE because it is the stress language (§8.4: ~+30–35% over English), and the
 * one string that grows here is the bulb's accessible name — audited by the
 * per-story axe run and asserted in the play. The page GROUND stays Romanian
 * (§15.7): it is scenery, held constant so a diff cannot hide in it, and the
 * corner is what this story pins.
 */
export const GermanOpen: Story = {
  globals: { locale: 'de' },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/de/services' } },
  },
  tags: ['pin-open', 'stress-320'],
  render: () => (
    <div className="min-h-screen px-4 py-8">
      <div className="flex max-w-prose flex-col gap-4">
        <p>Clinica este deschisă de luni până vineri, între orele 9 și 18.</p>
        <p>
          Programările se fac telefonic. Vă răspundem în cel mult o zi
          lucrătoare și vă propunem prima oră liberă din cabinet.
        </p>
      </div>
      <FloatingActions />
    </div>
  ),
  play: async (context) => {
    const bulb = await openPlay(context);
    // THE READER AND THE ROUTE AGREE — the whole reason this story pins both.
    // The name comes from de.json (so the corner really is German), and the
    // alternate pointing at the page you came from is '/ro/services/' (so the
    // route really is /de/services). Flip only the toolbar and this second
    // assertion is the one that fails, with '/ro/de/services/'.
    await expect(bulb).toHaveAccessibleName(germanBulbName);
    await expect(
      context.canvasElement.querySelector('a[hreflang="ro"]'),
    ).toHaveAttribute('href', '/ro/services/');
  },
};
