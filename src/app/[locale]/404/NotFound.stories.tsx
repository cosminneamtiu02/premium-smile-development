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
// one. Both must render one `<Heading size="section" asChild><h1>` and one
// `<p className="max-w-xl text-justify">`, reading `common.notFound.*`. The
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
// page tier for RO + DE, and this band is exactly where German earns it:
// justified text (§15.1's dated 2026-09-06 exception) only stays readable
// because §15.14's site-wide `hyphens: auto` breaks long words, and German
// compounds are both the longest words on the site (+30–35%, §8.4) and the
// first place a justification river would open. The 320px column is where the
// two collide hardest, which is why the page tier samples it.
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
 * file (the band recipe, the per-element `text-justify`, the prose measure);
 * duplicating the arguments here would give them two homes and no owner.
 */
function NotFoundBand(): ReactElement {
  const t = useTranslations('common');

  return (
    <section>
      <Container className="flex flex-col gap-4 py-16">
        <Heading size="section" asChild>
          <h1>{t('notFound.title')}</h1>
        </Heading>
        <p className="max-w-xl text-justify">{t('notFound.message')}</p>
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
      name: ro.common.notFound.title,
    });
    await expect(heading.tagName).toBe('H1');

    // THE OWNER'S CORRECTION, pinned as computed style rather than as a class
    // string: `text-justify` is only meaningful if it survives the cascade,
    // and globals.css deliberately aligns every <p> to `start` at the base
    // tier. This assertion is what proves the per-element override wins.
    const paragraph = canvas.getByText(ro.common.notFound.message);
    await expect(getComputedStyle(paragraph).textAlign).toBe('justify');
  },
};

/**
 * GERMAN — the §8.4 expansion stress, and the reason this band gets two
 * pictures instead of one. The message runs ~110 characters against Romanian's
 * ~78, so at 320px it wraps to many more lines; justification plus
 * `hyphens: auto` under a German `lang` is what has to keep that block
 * readable, and this is the picture that shows whether it does.
 */
export const GermanStress: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: de.common.notFound.title,
    });
    await expect(heading.tagName).toBe('H1');

    const paragraph = canvas.getByText(de.common.notFound.message);
    await expect(getComputedStyle(paragraph).textAlign).toBe('justify');
    // Hyphenation is what makes justified German acceptable (§15.14), and it
    // engages only under a declared language — the decorator stamps the
    // document's `lang` exactly as the shell does, so this is the same
    // condition the built page runs under.
    await expect(document.documentElement.lang).toBe('de');
  },
};
