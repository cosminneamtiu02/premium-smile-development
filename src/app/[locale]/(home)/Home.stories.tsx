import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useTranslations } from 'next-intl';
import ro from '@/messages/ro.json';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';

// Pages/Home — the INTERIM STUB as it actually ships, PLUS its first real
// band: sections/ClinicLocation (owner 2026-09-09, board D3 — the „Ne găsești"
// map + contact rows, mounted below the stub lines exactly as page.tsx does).
// The real Hero · ServicesTeaser · CTABanner still arrive with the §14 Home
// lane, and the owner authors that content (§15.17); this story photographs
// what ships, not a wish. The band's live Google iframe is fenced in the
// visual net (tests/visual/stories.spec.ts) and photographs as its tray.
//
// KEEP-IN-SYNC with ./page.tsx BESIDE this file: that page is an async Server
// Component (getTranslations from next-intl/server), which no browser runner
// can execute — the shell.test.tsx / Pages/NotFound precedent — so the twin
// below renders the same markup through the isomorphic `useTranslations`, and
// the play function pins it from the outside.
//
// Created on the owner's 2026-09-06 instruction that every page have its story.
// ONE story, Romanian: the DE variant arrives WITH the real page lane (§13's
// RO+DE page tier), because placeholder copy carries no text-expansion risk
// worth a baseline.
//
// layout 'fullscreen' on purpose — the stub ships no gutter and no Container,
// so the truthful picture is text flush against the edge. Storybook's default
// padding would photograph an inset the site does not have.

/** KEEP-IN-SYNC twin of ./page.tsx. */
function HomePageBand(): ReactElement {
  const t = useTranslations('home');

  return (
    <>
      <h1 className="font-display text-ink-strong">{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <ClinicLocation />
    </>
  );
}

const meta = {
  title: 'Pages/Home',
  component: HomePageBand,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomePageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: ro.home.hero.title,
    });
    await expect(heading.tagName).toBe('H1');
    // The subtitle is the only other STUB line this page renders — if the twin
    // drifts to one element, this line says so.
    await expect(canvas.getByText(ro.home.hero.subtitle)).toBeInTheDocument();
    // The first real band, named by its own h2 — the twin must mount it too.
    await expect(
      canvas.getByRole('region', { name: ro.home.location.title }),
    ).toBeInTheDocument();
  },
};
