import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useTranslations } from 'next-intl';
import ro from '@/messages/ro.json';

// Pages/Team — the INTERIM STUB as it actually ships: one heading reusing the
// nav label, no new message keys. The real TeamIntro · TeamMemberCard grid ·
// ClinicGallery arrive with the §14 Team lane, and the owner authors that
// content (§15.17).
//
// KEEP-IN-SYNC with src/app/[locale]/team/page.tsx: that page is an async
// Server Component (getTranslations from next-intl/server), unrenderable in the
// browser runner — the shell.test.tsx / Pages/NotFound precedent — so the twin
// below renders the same markup through the isomorphic `useTranslations`.
//
// Created on the owner's 2026-09-06 instruction that every page have its story.
// ONE story, Romanian: the DE variant arrives WITH the real page lane (§13's
// RO+DE page tier) — a placeholder nav label carries no expansion risk worth a
// baseline.
//
// layout 'fullscreen': the stub ships no gutter, so the truthful picture is the
// heading flush against the edge, not a Storybook inset.

/** KEEP-IN-SYNC twin of src/app/[locale]/team/page.tsx. */
function TeamPageBand(): ReactElement {
  const t = useTranslations('common');

  return <h1 className="font-display text-ink-strong">{t('nav.team')}</h1>;
}

const meta = {
  title: 'Pages/Team',
  component: TeamPageBand,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TeamPageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: ro.common.nav.team,
    });
    await expect(heading.tagName).toBe('H1');
  },
};
