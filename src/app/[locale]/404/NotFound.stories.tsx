import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';

// Pages/NotFound — the band that src/app/[locale]/404/page.tsx renders, at the
// six page-tier widths (§13: Pages/* → 320 · 390 · 768 · 1280 · 1536 · 1920).
//
// ── WHY A STORY-LOCAL TWIN AND NOT THE PAGE ITSELF. The page is an async
// Server Component: it awaits `getTranslations` from next-intl/server, which no
// browser runner can execute — the same reason src/app/[locale]/shell.test.tsx
// composes the shell's shape instead of importing layout.tsx. So `NotFoundBand`
// below renders the SAME two elements the page does, through the isomorphic
// `useTranslations` (the Header/Footer precedent: those sections call t() with
// no 'use client' precisely so stories and tests can render them).
//
// ── THIS IS A KEEP-IN-SYNC PAIR (§4's sharing table), and it is written down
// rather than assumed: the twin lives here, the original in
// src/app/[locale]/404/page.tsx, and that file's header points back at this
// one. Both must render one `<Heading size="page" asChild><h1>` whose text
// leads with `404: `, and one `<p className="max-w-xl text-center text-xl">`, reading
// `common.notFound.*`, inside a Container carrying `items-center` +
// `text-center` (the owner's 2026-09-07 corrections — centering round 2,
// h1 prefix + justify→center reversal round 3). The
// play functions below pin exactly that from the outside, so a change to either
// side that the other does not follow turns this suite red rather than
// silently photographing something the site no longer ships.
//
// ── WHAT THE STORIES DELIBERATELY DO NOT SHOW: the Header, the Footer and the
// corner controls, which the owner's correction is all about. They arrive from
// the locale LAYOUT, not from the page (§6 — a page never re-renders the
// shell), and the shell's own assembly is pinned by shell.test.tsx. Putting a
// fake shell around this band would photograph a composition that exists
// nowhere.
//
// ── TWO STORIES, ONE PER LANGUAGE, and the pair is the point. §13 asks the
// page tier for RO + DE, and this band is where German still earns it after
// the 2026-09-07 justify→center reversal: the DE message runs ~110 characters
// against Romanian's ~78 (+30–35%, §8.4), so at 320px it wraps to the most
// lines — centred wrapping with §15.14's `hyphens: auto` under a German `lang`
// is what has to keep the ragged edges balanced, and this is the picture that
// shows whether it does.
//
// Every story PINS ITS LOCALE with per-story `globals`: the locale toolbar is
// manager state and the visual runner opens each story by URL with none of it.
// The preview decorator supplies the messages AND stamps
// `document.documentElement.lang`, exactly as the shell does — which is what
// makes hyphenation behave here the way it behaves on the built page.
//
// layout 'fullscreen' because the band is full-bleed and Container owns the
// gutter: Storybook's default 1rem padding would add a second inset on top of
// the clamp and put the story's ground and the band's margins on two rulers.

/**
 * The page's band, twinned. KEEP-IN-SYNC with src/app/[locale]/404/page.tsx —
 * see this file's header. Every comment justifying these classes lives in that
 * file (the band recipe, the per-element `text-center`, the prose measure);
 * duplicating the arguments here would give them two homes and no owner.
 */
function NotFoundBand(): ReactElement {
  const t = useTranslations('common');

  return (
    <section className="flex min-h-[calc(100dvh-6rem)] grow flex-col justify-center pb-24">
      <Container className="flex flex-col items-center gap-4 py-16 text-center">
        <Heading size="page" asChild>
          <h1>404: {t('notFound.title')}</h1>
        </Heading>
        <p className="max-w-xl text-center text-xl">{t('notFound.message')}</p>
      </Container>
    </section>
  );
}

const meta = {
  title: 'Pages/NotFound',
  component: NotFoundBand,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotFoundBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ROMANIAN — the default locale and the §15.7 story default (diacritics-bearing
 * copy, so a font or shaping regression has somewhere to show).
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    // The page's one heading, queried by ROLE and by its real message — so a
    // renamed key or a Heading that stopped emitting a real <h1> fails here
    // (§9, §13: role-based queries make a passing test double as proof of
    // accessible markup).
    const heading = canvas.getByRole('heading', {
      level: 1,
      // `404: ` leads the accessible name too (owner round 3) — the prefix is
      // composed in the JSX, so the pin composes it here the same way, never
      // by importing the page.
      name: `404: ${ro.common.notFound.title}`,
    });
    await expect(heading.tagName).toBe('H1');

    // THE OWNER'S ROUND-3 REVERSAL ("f*ck justify keep centered"), pinned as
    // computed style rather than as a class string: the alignment is only
    // meaningful if it survives the cascade, and globals.css deliberately
    // aligns every <p> to `start` at the base tier. This assertion is what
    // proves the per-element override wins.
    const paragraph = canvas.getByText(ro.common.notFound.message);
    await expect(getComputedStyle(paragraph).textAlign).toBe('center');

    // THE OWNER'S SECOND CORRECTION (2026-09-07, "centered in the container"),
    // pinned the same way — as computed style, from the outside. Together with
    // the alignment assertion above these prove the §15.15 b shape end to end:
    // the wrapper centres boxes (alignItems) and display text (the h1's
    // inherited text-align), while the paragraph's computed `center` can only
    // come from its OWN element utility — globals' base rule fences every <p>
    // from inherited alignment — so element-declared prose alignment survives
    // whatever the wrapper says.
    const container = paragraph.parentElement;
    if (container === null)
      throw new Error('the paragraph lost its Container parent');
    await expect(getComputedStyle(container).alignItems).toBe('center');
    await expect(getComputedStyle(heading).textAlign).toBe('center');

    // THE Y-AXIS HALF (owner, 2026-09-07 — "more central on y axis"), pinned
    // at declaration level: in the real shell the section grows inside
    // <main>'s column context and this `justify-center` is what centres the
    // band vertically; the story canvas gives the section no height, so the
    // computed value is the honest thing to hold here.
    const section = container.closest('section');
    if (section === null) throw new Error('the band lost its <section> root');
    await expect(getComputedStyle(section).justifyContent).toBe('center');

    // ROUND 4 (owner, "make both text and heading larger"), pinned as computed
    // px at the runner's 16px root: the heading wears Heading's 'page' step
    // (text-4xl = 36px — the step this band measured into the atom) and the
    // message one step over the 1.125rem body base (text-xl = 20px).
    await expect(getComputedStyle(heading).fontSize).toBe('36px');
    await expect(getComputedStyle(paragraph).fontSize).toBe('20px');
  },
};

/**
 * GERMAN — the §8.4 expansion stress, and the reason this band gets two
 * pictures instead of one. The message runs ~110 characters against Romanian's
 * ~78, so at 320px it wraps to many more lines; centred wrapping plus
 * `hyphens: auto` under a German `lang` is what has to keep those ragged
 * edges balanced, and this is the picture that shows whether it does.
 */
export const GermanStress: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: `404: ${de.common.notFound.title}`,
    });
    await expect(heading.tagName).toBe('H1');

    const paragraph = canvas.getByText(de.common.notFound.message);
    await expect(getComputedStyle(paragraph).textAlign).toBe('center');
    // Hyphenation is what keeps long centred German wraps balanced (§15.14), and it
    // engages only under a declared language — the decorator stamps the
    // document's `lang` exactly as the shell does, so this is the same
    // condition the built page runs under.
    await expect(document.documentElement.lang).toBe('de');
  },
};
